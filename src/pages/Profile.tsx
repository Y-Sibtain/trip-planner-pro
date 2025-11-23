import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useBooking } from '@/contexts/BookingContext';
import { ArrowLeft, User, Mail, Phone, MapPin, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

type Preferences = {
  budgetRange?: { min?: number; max?: number };
  preferredDestinations?: string[]; // up to 3
  travelStyle?: string; // e.g., 'adventure'|'relaxation'|'cultural'
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
    const load = async () => {
      setLoading(true);
      try {
        const userId = user?.id;
        if (!userId) {
          // fallback
          const { data } = await supabase.auth.getUser();
          if (!data?.user) {
            setLoading(false);
            return;
          }
        }

        // Try to load profile from public.profiles
        const { data: profileData, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        if (error) {
          console.error('Error fetching profile:', error);
          toast({ title: 'Error', description: 'Failed to load profile.', variant: 'destructive' });
        }

        if (profileData) {
          setFormData({
            id: profileData.id,
            name: profileData.full_name || '',
            email: user.email || '',
            phone: profileData.phone || '',
            location: profileData.location || '',
            avatar_url: profileData.avatar_url || '',
            preferences: (profileData.preferences as Preferences) || {},
          });
        } else {
          // no profile row yet: create a minimal profile row for this user
          const newProfile = {
            id: user.id,
            full_name: user.user_metadata?.full_name || '',
            phone: user.user_metadata?.phone || '',
            location: user.user_metadata?.location || '',
            preferences: {},
          };
          const { error: insertErr } = await supabase.from('profiles').insert([newProfile]);
          if (insertErr) {
            console.error('Error creating profile row:', insertErr);
            toast({ title: 'Error', description: 'Failed to create profile record.', variant: 'destructive' });
          } else {
            setFormData({
              id: newProfile.id,
              name: newProfile.full_name,
              email: user.email || '',
              phone: newProfile.phone || '',
              location: newProfile.location || '',
              avatar_url: '',
              preferences: {},
            });
          }
        }
      } catch (err) {
        console.error('Load profile error:', err);
        toast({ title: 'Error', description: 'Failed to load profile.', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [isAuthenticated, navigate, user, toast]);

  const handleSave = async () => {
    setSaving(true);
    try {
      // Update user_metadata (for quick auth profile sync)
      const userUpdate: any = {
        data: {
          full_name: formData.name,
          phone: formData.phone,
          location: formData.location,
        },
      };
      const { error: userErr } = await supabase.auth.updateUser(userUpdate);
      if (userErr) {
        console.warn('Failed to update auth metadata:', userErr);
        // not fatal; continue to update profiles table
      }

      // Update profiles table
      const updates: any = {
        full_name: formData.name,
        phone: formData.phone,
        location: formData.location,
        avatar_url: formData.avatar_url,
        preferences: formData.preferences,
      };

      const { error } = await supabase.from('profiles').update(updates).eq('id', formData.id);
      if (error) {
        toast({ title: 'Save failed', description: error.message, variant: 'destructive' });
        return;
      }
      toast({ title: 'Profile updated', description: 'Your profile was saved successfully.' });
    } catch (err: any) {
      console.error('Save profile error:', err);
      toast({ title: 'Error', description: err?.message ?? 'Failed to save profile.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (file: File | null) => {
    if (!file) return;
    setSaving(true);
    try {
      // Ensure you created a storage bucket named "avatars" in Supabase dashboard
      const fileExt = file.name.split('.').pop();
      const filePath = `avatars/${formData.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
      });

      if (uploadError) {
        throw uploadError;
      }

      // Generate a public (signed) URL - recommended to use signed URLs for private buckets
      // Here we attempt to create a public URL (if bucket is public) otherwise createSignedUrl
      let publicUrl = supabase.storage.from('avatars').getPublicUrl(filePath).data?.publicUrl;
      if (!publicUrl) {
        // Fallback: create signed URL (valid 1 hour)
        const { data: signedData, error: signedErr } = await supabase.storage
          .from('avatars')
          .createSignedUrl(filePath, 60 * 60);
        if (signedErr) throw signedErr;
        publicUrl = signedData?.signedUrl;
      }

      setFormData((f) => ({ ...f, avatar_url: publicUrl || '' }));
      // Save avatar_url to profiles table
      const { error: updateErr } = await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', formData.id);
      if (updateErr) {
        throw updateErr;
      }
      toast({ title: 'Avatar uploaded', description: 'Profile picture updated.' });
    } catch (err: any) {
      console.error('Avatar upload error:', err);
      toast({ title: 'Upload failed', description: err?.message ?? 'Failed to upload avatar', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccountSoft = async () => {
    if (!confirm('This will remove your profile data from the app (soft-delete). You can still contact admin to fully remove your account. Proceed?')) return;
    setSaving(true);
    try {
      // Soft-delete profile: set deleted_at
      const { error } = await supabase.from('profiles').update({ deleted_at: new Date().toISOString() }).eq('id', formData.id);
      if (error) {
        toast({ title: 'Delete failed', description: error.message, variant: 'destructive' });
        return;
      }
      // Optionally, remove user metadata
      await supabase.auth.updateUser({ data: { full_name: null, phone: null, location: null } });

      // Sign out the user locally
      await signOut();
      toast({ title: 'Account removed', description: 'Your profile has been removed from the app.' });
      navigate('/');
    } catch (err: any) {
      console.error('Soft-delete error:', err);
      toast({ title: 'Error', description: err?.message ?? 'Failed to remove account.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  // For permanent deletion, recommend using a server-side endpoint using the service_role key.
  // See server/admin/delete-account.ts (example) included in repo for admin-only permanent deletion.
  const handlePermanentDeleteRequest = async () => {
    if (!confirm('Permanent account deletion will remove your auth record and cannot be undone. Contact admin to complete permanent deletion. Proceed to request deletion email to admin?')) return;
    // For now just show instructions / toast
    toast({
      title: 'Deletion requested',
      description: 'Permanent deletion requires admin action. Please contact support or run the server admin endpoint.',
    });
  };

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
              <Label htmlFor="name">Name</Label>
              <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={formData.email} disabled />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input id="location" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} />
            </div>

            <div className="space-y-2">
              <Label>Preferences</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div>
                  <Label>Budget range (min)</Label>
                  <Input
                    type="number"
                    value={(formData.preferences?.budgetRange?.min ?? '') as any}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        preferences: { ...(formData.preferences || {}), budgetRange: { ...(formData.preferences?.budgetRange || {}), min: e.target.value ? Number(e.target.value) : undefined } },
                      })
                    }
                  />
                </div>
                <div>
                  <Label>Budget range (max)</Label>
                  <Input
                    type="number"
                    value={(formData.preferences?.budgetRange?.max ?? '') as any}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        preferences: { ...(formData.preferences || {}), budgetRange: { ...(formData.preferences?.budgetRange || {}), max: e.target.value ? Number(e.target.value) : undefined } },
                      })
                    }
                  />
                </div>
              </div>

              <div className="mt-2">
                <Label>Preferred destinations (up to 3)</Label>
                <Input
                  placeholder="Comma-separated (e.g., Paris, Tokyo)"
                  value={(formData.preferences?.preferredDestinations || []).join(', ')}
                  onChange={(e) => {
                    const list = e.target.value.split(',').map((s) => s.trim()).filter(Boolean).slice(0, 3);
                    setFormData({ ...formData, preferences: { ...(formData.preferences || {}), preferredDestinations: list } });
                  }}
                />
              </div>

              <div className="mt-2">
                <Label>Travel style</Label>
                <Input
                  placeholder="e.g., adventure, relaxation, cultural"
                  value={formData.preferences?.travelStyle || ''}
                  onChange={(e) => setFormData({ ...formData, preferences: { ...(formData.preferences || {}), travelStyle: e.target.value } })}
                />
              </div>
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
                  <Trash2 className="w-4 h-4 mr-2" /> Remove my profile (soft-delete)
                </Button>
                <Button variant="ghost" onClick={handlePermanentDeleteRequest}>
                  Request permanent deletion
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