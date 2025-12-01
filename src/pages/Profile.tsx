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

      // If there is an error and no returned data, treat it as fatal
      if (profileErr && !updatedData) {
        console.error('Profile update error:', profileErr);
        toast({
          title: 'Save failed',
          description: profileErr.message,
          variant: 'destructive',
        });
        return;
      }

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
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading profile...</p>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen p-4">
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Manage your personal information and preferences</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Avatar removed - profile simplified */}

            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={formData.email} readOnly />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSave} className="w-full" disabled={saving}>
                Save Changes
              </Button>
              <Button variant="outline" onClick={() => navigate(-1)} className="w-full">
                Back
              </Button>
            </div>

            <div className="mt-4 border-t pt-4">
              <Label>Account</Label>
              <div className="flex gap-2 mt-2">
              <Button variant="destructive" onClick={handleDeleteAccountSoft} disabled={saving}>
                <Trash2 className="w-4 h-4 mr-2" /> Delete Profile
              </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Profile;