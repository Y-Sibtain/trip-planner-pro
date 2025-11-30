import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useBooking } from '@/contexts/BookingContext';
import { Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

type Preferences = {
  budgetRange?: { min?: number; max?: number };
  preferredDestinations?: string[];
  travelStyle?: string;
};

const Profile = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user, signOut } = useBooking();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [formData, setFormData] = useState({
    id: '',
    name: '',
    email: '',
    phone: '',
    location: '',
    avatar_url: '',
    preferences: {} as Preferences,
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
            const newProfile = {
              id: authUser.id,
              full_name: authUser.user_metadata?.full_name || '',
              phone: authUser.user_metadata?.phone || '',
              location: authUser.user_metadata?.location || '',
              avatar_url: null,
              preferences: {},
            };

            const { data: createdProfile, error: insertError } = await supabase
              .from('profiles')
              .insert([newProfile]);

            if (insertError) {
              console.error('Profile insert error:', insertError);
              toast({
                title: 'Warning',
                description: 'Could not create profile. Please try again or fill in your details below.',
                variant: 'destructive',
              });
              setFormData({
                id: authUser.id,
                name: authUser.user_metadata?.full_name || '',
                email: authUser.email || '',
                phone: authUser.user_metadata?.phone || '',
                location: authUser.user_metadata?.location || '',
                avatar_url: '',
                preferences: {},
              });
            } else {
              console.log('Profile created successfully:', createdProfile);
              setFormData({
                id: newProfile.id,
                name: newProfile.full_name || '',
                email: authUser.email || '',
                phone: newProfile.phone || '',
                location: newProfile.location || '',
                avatar_url: newProfile.avatar_url || '',
                preferences: newProfile.preferences || {},
              });
            }
          } else {
            console.error('Error fetching profile:', fetchError);
            toast({
              title: 'Error',
              description: 'Failed to load profile.',
              variant: 'destructive',
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
            location: profileData.location || '',
            avatar_url: profileData.avatar_url || '',
            preferences: profileData.preferences || {},
          });
        }
      } catch (err) {
        console.error('Load profile error:', err);
        toast({
          title: 'Error',
          description: 'Failed to load profile.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [isAuthenticated, navigate, toast]);

  const handleSave = async () => {
    setSaving(true);
    try {
      // Update auth user metadata
      const { error: userErr } = await supabase.auth.updateUser({
        data: {
          full_name: formData.name,
          phone: formData.phone,
          location: formData.location,
        },
      });

      if (userErr) {
        console.warn('Failed to update auth metadata:', userErr);
      }

      // Update profiles table
      const { error: profileErr } = await supabase
        .from('profiles')
        .update({
          full_name: formData.name,
          phone: formData.phone,
          location: formData.location,
          avatar_url: formData.avatar_url,
          preferences: formData.preferences,
        })
        .eq('id', formData.id);

      if (profileErr) {
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

  const handleAvatarUpload = async (file: File | null) => {
    if (!file) return;
    setSaving(true);
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `avatars/${formData.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
      });

      if (uploadError) {
        throw uploadError;
      }

      const publicUrl = supabase.storage.from('avatars').getPublicUrl(filePath).data?.publicUrl;

      setFormData((f) => ({ ...f, avatar_url: publicUrl || '' }));

      const { error: updateErr } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', formData.id);

      if (updateErr) {
        throw updateErr;
      }

      toast({
        title: 'Avatar uploaded',
        description: 'Profile picture updated.',
      });
    } catch (err: any) {
      console.error('Avatar upload error:', err);
      toast({
        title: 'Upload failed',
        description: err?.message ?? 'Failed to upload avatar',
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
      const { error } = await supabase
        .from('profiles')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', formData.id);

      if (error) {
        toast({
          title: 'Delete failed',
          description: error.message,
          variant: 'destructive',
        });
        return;
      }

      await supabase.auth.updateUser({
        data: { full_name: null, phone: null, location: null },
      });

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
            <div className="flex gap-4 items-center">
              <div>
                <img
                  src={formData.avatar_url || '/placeholder-avatar.png'}
                  alt="avatar"
                  className="w-24 h-24 rounded-full object-cover border"
                />
              </div>
              <div className="flex-1">
                <Label>Change Profile Picture</Label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleAvatarUpload(e.target.files?.[0] ?? null)}
                  className="mt-1"
                />
              </div>
            </div>

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
              <Input id="email" value={formData.email} disabled />
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