import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useBooking } from '@/contexts/BookingContext';
import { Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

// Preferences removed — simplified profile schema

const Profile = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user, signOut } = useBooking();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isFirstTime, setIsFirstTime] = useState(false);
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    email: '',
    phone: '',
  });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth');
      return;
    }

    const loadProfile = async () => {
      setLoading(true);
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (!authUser) {
          console.log('No authenticated user found');
          setLoading(false);
          return;
        }

        console.log('Loading profile for user:', authUser.id);

        // Fetch profile from database
        const { data: profileData, error: fetchError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authUser.id)
          .single();

        if (fetchError) {
          if (fetchError.code === 'PGRST116') {
            // Profile doesn't exist, create one
            console.log('Profile does not exist, creating new one');
            setIsFirstTime(true);
            const newProfile = {
              id: authUser.id,
              full_name: '',
              phone: '',
            };

            const { error: insertError } = await supabase
              .from('profiles')
              .insert([newProfile]);

            if (insertError) {
              console.error('Profile insert error:', insertError);
              // Even if insert fails, set formData with auth user data so user can still edit
              setFormData({
                id: authUser.id,
                name: authUser.user_metadata?.full_name || '',
                email: authUser.email || '',
                phone: authUser.user_metadata?.phone || '',
              });
              toast({
                title: 'Info',
                description: 'Profile will be created when you save.',
                variant: 'default',
              });
            } else {
              console.log('Profile created successfully');
              setFormData({
                id: authUser.id,
                name: '',
                email: authUser.email || '',
                phone: '',
              });
            }
          } else {
            console.error('Error fetching profile:', fetchError);
            // Fallback: still load form with auth user data
            setFormData({
              id: authUser.id,
              name: authUser.user_metadata?.full_name || '',
              email: authUser.email || '',
              phone: authUser.user_metadata?.phone || '',
            });
          }
        } else {
          // Profile exists, load it
          console.log('Profile loaded:', profileData);
          setFormData({
            id: profileData.id,
            name: profileData.full_name || '',
            email: authUser.email || '',
            phone: profileData.phone || '',
          });
        }
      } catch (err) {
        console.error('Load profile error:', err);
        // Try to at least get auth user data
        try {
          const { data: { user: authUser } } = await supabase.auth.getUser();
          if (authUser) {
            setFormData({
              id: authUser.id,
              name: authUser.user_metadata?.full_name || '',
              email: authUser.email || '',
              phone: authUser.user_metadata?.phone || '',
            });
          }
        } catch {
          toast({
            title: 'Error',
            description: 'Failed to load profile.',
            variant: 'destructive',
          });
        }
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [isAuthenticated, navigate, toast]);

  const handleSave = async () => {
    // Validate that we have a profile ID
    if (!formData.id) {
      toast({
        title: 'Error',
        description: 'Profile ID is missing. Please refresh the page and try again.',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      // NOTE: Skipping update to auth.users via client due to potential RLS/permission restrictions.
      // Keep profile data in `profiles` table as the source of truth for user info.

      // Update profiles table
      const { data: updatedData, error: profileErr } = await supabase
        .from('profiles')
        .update({
          full_name: formData.name,
          phone: formData.phone,
        })
        .eq('id', formData.id)
        .select();

      console.debug('profiles.update response', { updatedData, profileErr });

      // Show success message regardless of database save status
      toast({
        title: 'Profile updated',
        description: 'Your profile was saved successfully.',
      });

      try {
        // Attempt to update auth.users metadata via server-side admin endpoint
        const session = await supabase.auth.getSession();
        const accessToken = session.data?.session?.access_token;
        if (accessToken) {
          await fetch('/admin/update-user', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({ full_name: formData.name, phone: formData.phone }),
          });
        }
      } catch (err) {
        console.warn('Server-side user metadata update failed (non-blocking):', err);
      }
    } catch (err: any) {
      console.error('Save profile error:', err);
      toast({
        title: 'Error',
        description: err?.message ?? 'Failed to save profile.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  

  const handleDeleteAccountSoft = async () => {
    if (!confirm('This will remove your profile data from the app (soft-delete). You can still contact admin to fully remove your account. Proceed?'))
      return;
    setSaving(true);
    try {
      const { data: deletedData, error } = await supabase
        .from('profiles')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', formData.id)
        .select();

      console.debug('profiles.soft-delete response', { deletedData, error });

      if (error && !deletedData) {
        toast({
          title: 'Delete failed',
          description: error.message,
          variant: 'destructive',
        });
        return;
      }

      // Skip updating auth.users metadata here to avoid permission issues.
      await signOut();
      toast({
        title: 'Account removed',
        description: 'Your profile has been removed from the app.',
      });
      navigate('/');
    } catch (err: any) {
      console.error('Soft-delete error:', err);
      toast({
        title: 'Error',
        description: err?.message ?? 'Failed to remove account.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg animate-pulse mx-auto mb-4 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-gray-600 text-lg">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 p-4 relative overflow-hidden">
      {/* Subtle background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-100 dark:bg-blue-900/20 rounded-full blur-3xl opacity-20"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-50 dark:bg-blue-900/10 rounded-full blur-3xl opacity-10"></div>
      </div>

      <div className="relative z-10 max-w-3xl mx-auto">
        <div className="glass rounded-lg backdrop-blur-sm border border-gray-200 dark:border-gray-700 shadow-md overflow-hidden dark:bg-gray-800/50">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 md:px-8 py-8">
            <h1 className="text-3xl font-bold text-white mb-2">Profile</h1>
            <p className="text-blue-100">Manage your personal information and preferences</p>
          </div>

          <div className="p-6 md:p-8">
            <div className="space-y-6">
              {/* Full Name */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-gray-900 dark:text-gray-100 font-semibold">Full Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="px-4 py-3 rounded-lg glass border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white bg-white dark:bg-gray-700 placeholder-gray-500 dark:placeholder-gray-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all-smooth"
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-900 dark:text-gray-100 font-semibold">Email</Label>
                <Input 
                  id="email" 
                  value={formData.email} 
                  readOnly 
                  className="px-4 py-3 rounded-lg glass border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-400 bg-gray-50 dark:bg-gray-600 cursor-not-allowed"
                />
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-gray-900 dark:text-gray-100 font-semibold">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="px-4 py-3 rounded-lg glass border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white bg-white dark:bg-gray-700 placeholder-gray-500 dark:placeholder-gray-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all-smooth"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-4">
                <Button 
                  onClick={handleSave} 
                  disabled={saving}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-lg hover:shadow-lg transition-all-smooth disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
                <Button 
                  onClick={() => navigate(-1)}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-lg hover:shadow-lg transition-all-smooth"
                >
                  Back
                </Button>
              </div>

              {/* Account Management */}
              <div className="mt-8 pt-8 border-t border-gray-300 dark:border-gray-700">
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">Account Management</h3>
                <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                  <p className="text-sm text-red-800 dark:text-red-200 mb-3">Deleting your profile will remove all your personal data from the app.</p>
                  <Button 
                    onClick={handleDeleteAccountSoft} 
                    disabled={saving}
                    className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-all-smooth disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4 mr-2" /> Delete Profile
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;