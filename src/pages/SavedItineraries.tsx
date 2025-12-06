import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ShoppingCart } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useBooking } from '@/contexts/BookingContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Trash2, Play, Edit } from 'lucide-react';

const SavedItineraries = () => {
  const navigate = useNavigate();
  const { isAuthenticated, setTripData } = useBooking();
  const { toast } = useToast();

  const [saved, setSaved] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteItineraryId, setDeleteItineraryId] = useState<string | null>(null);
  const [renameItineraryId, setRenameItineraryId] = useState<string | null>(null);
  const [renameTitle, setRenameTitle] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      // Store current page for redirect after auth
      sessionStorage.setItem('authReturnUrl', '/saved-itineraries');
      navigate('/auth');
      return;
    }
    fetchSaved();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  const fetchSaved = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('saved_itineraries')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Failed to load saved itineraries:', error);
        toast({ title: 'Error', description: 'Failed to load saved itineraries.', variant: 'destructive' });
        return;
      }
      setSaved(data || []);
    } catch (err) {
      console.error('Fetch saved error:', err);
      toast({ title: 'Error', description: 'Failed to load saved itineraries.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteItineraryId) return;
    setDeletingId(deleteItineraryId);
    try {
      const { error } = await supabase.from('saved_itineraries').delete().eq('id', deleteItineraryId);
      if (error) {
        console.error('Delete error:', error);
        toast({ title: 'Delete failed', description: error.message, variant: 'destructive' });
        setDeletingId(null);
        setDeleteItineraryId(null);
        return;
      }

      // Create notification for user about deletion
      try {
        const { data: session } = await supabase.auth.getUser();
        const userId = session?.user?.id;
        if (userId) {
          await supabase.from('notifications').insert([
            {
              user_id: userId,
              type: 'itinerary_deleted',
              title: 'Saved itinerary deleted',
              message: `A saved itinerary was deleted.`,
            },
          ]);
        }
      } catch (notifErr) {
        console.warn('Failed to create deletion notification:', notifErr);
      }

      toast({ title: 'Deleted', description: 'Saved itinerary removed.' });
      fetchSaved();
    } catch (err) {
      console.error('Delete saved error:', err);
      toast({ title: 'Error', description: 'Failed to delete saved itinerary.', variant: 'destructive' });
    } finally {
      setDeletingId(null);
      setDeleteItineraryId(null);
    }
  };

  const handleRename = async () => {
    if (!renameItineraryId) return;
    const trimmed = renameTitle.trim();
    if (!trimmed) {
      toast({ title: 'Invalid title', description: 'Title cannot be empty.', variant: 'destructive' });
      return;
    }
    try {
      const { error } = await supabase.from('saved_itineraries').update({ title: trimmed }).eq('id', renameItineraryId);
      if (error) {
        console.error('Rename error:', error);
        toast({ title: 'Rename failed', description: error.message, variant: 'destructive' });
        return;
      }

      // Notification about rename
      try {
        const { data: session } = await supabase.auth.getUser();
        const userId = session?.user?.id;
        if (userId) {
          await supabase.from('notifications').insert([
            {
              user_id: userId,
              type: 'itinerary_renamed',
              title: 'Itinerary renamed',
              message: `Your itinerary was renamed to "${trimmed}".`,
            },
          ]);
        }
      } catch (notifErr) {
        console.warn('Failed to create rename notification:', notifErr);
      }

      toast({ title: 'Renamed', description: 'Itinerary title updated.' });
      fetchSaved();
    } catch (err) {
      console.error('Rename saved error:', err);
      toast({ title: 'Error', description: 'Failed to rename itinerary.', variant: 'destructive' });
    } finally {
      setRenameItineraryId(null);
      setRenameTitle('');
    }
  };

  const handleSave = async (itineraryData: any) => {
    try {
      const { error } = await supabase.from('saved_itineraries').insert([itineraryData]);
      if (error) {
        // Don't expose internal error details to users
        toast({
          title: 'Save failed',
          description: 'Unable to save itinerary. Please try again later.',
          variant: 'destructive'
        });
        console.error('Save error (admin only):', error); // Log for debugging
        return;
      }
      toast({ title: 'Saved', description: 'Itinerary saved successfully.' });
      fetchSaved();
    } catch (err) {
      toast({
        title: 'Save failed',
        description: 'Unable to save itinerary. Please try again later.',
        variant: 'destructive'
      });
    }
  };

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 relative overflow-hidden p-4">
      {/* Subtle background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-100 dark:bg-blue-900/20 rounded-full blur-3xl opacity-20"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-50 dark:bg-blue-900/10 rounded-full blur-3xl opacity-10"></div>
      </div>

      <div className="max-w-4xl mx-auto relative z-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-2">Saved Itineraries</h1>
          <p className="text-gray-600 dark:text-gray-300">View, load, edit, or remove your previously saved trip plans</p>
        </div>

        {/* Stats Bar */}
        <div className="glass p-4 rounded-lg border border-gray-200 dark:border-gray-700 backdrop-blur-sm shadow-md mb-6 flex justify-between items-center dark:bg-gray-800/50">
          <div>
            <p className="text-gray-600 dark:text-gray-400 text-sm">Total Saved</p>
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{saved.length}</p>
          </div>
          <Button 
            onClick={fetchSaved}
            disabled={loading}
            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-lg hover:shadow-lg transition-all-smooth disabled:opacity-50"
          >
            🔄 Refresh
          </Button>
        </div>

        {/* Content */}
        {saved.length === 0 ? (
          <div className="glass p-12 rounded-lg border border-gray-200 text-center">
            <div className="text-6xl mb-4">📋</div>
            <p className="text-gray-900 text-lg font-semibold mb-2">No saved itineraries yet</p>
            <p className="text-gray-600 mb-6">Generate and save a trip plan to see it here</p>
            <Button 
              onClick={() => navigate('/')}
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-lg hover:shadow-lg transition-all-smooth"
            >
              Start Planning →
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {saved.map((row) => (
              <div 
                key={row.id}
                className="glass p-6 rounded-lg border border-gray-200 backdrop-blur-sm hover:border-blue-400 transition-all-smooth group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
                      {row.title}
                    </h3>
                    <p className="text-gray-600 text-sm">
                      Created {row.created_at ? new Date(row.created_at).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      }) : 'unknown'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-600 text-sm mb-1">Total Price</p>
                    <p className="text-3xl font-bold text-blue-600">
                      {row.total_price != null ? `PKR ${Number(row.total_price).toLocaleString()}` : '—'}
                    </p>
                  </div>
                </div>

                <div className="border-t border-gray-300 pt-4 flex gap-2 flex-wrap">
                  <Button 
                    size="sm"
                    onClick={() => {
                      setTripData({
                        source: row.plan?.meta?.source || '',
                        destinations: row.plan?.meta?.destinations || (row.plan?.days?.map((d: any) => d.destination) || []),
                        budget: String(row.plan?.totals?.grandTotal || ''),
                        startDate: row.plan?.days?.[0]?.date || '',
                        endDate: row.plan?.days?.[row.plan?.days?.length - 1]?.date || '',
                      });
                      toast({ title: '✅ Loaded', description: 'Itinerary loaded into planner.' });
                      navigate('/');
                    }}
                    className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold hover:shadow-lg transition-all-smooth"
                  >
                    <Play className="w-4 h-4 mr-2" /> Load
                  </Button>

                  <Button 
                    size="sm"
                    onClick={() => {
                      if (!isAuthenticated) {
                        // Store current page for redirect after auth
                        sessionStorage.setItem('authReturnUrl', '/saved-itineraries');
                        toast({
                          title: 'Authentication Required',
                          description: 'Sign in or sign up to proceed with booking',
                          variant: 'destructive'
                        });
                        navigate('/auth', { state: { bookingData: true } });
                        return;
                      }
                      navigate('/payment', { state: { itinerary: row } });
                    }}
                    className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-semibold hover:shadow-lg transition-all-smooth"
                  >
                    <ShoppingCart className="w-4 h-4 mr-2" /> Book
                  </Button>

                  <Button 
                    size="sm"
                    onClick={() => {
                      setRenameItineraryId(row.id);
                      setRenameTitle(row.title || '');
                    }}
                    className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold hover:shadow-lg transition-all-smooth"
                  >
                    <Edit className="w-4 h-4 mr-2" /> Rename
                  </Button>

                  <AlertDialog open={deleteItineraryId === row.id} onOpenChange={(open) => !open && setDeleteItineraryId(null)}>
                    <AlertDialogTrigger asChild>
                      <Button 
                        size="sm"
                        onClick={() => setDeleteItineraryId(row.id)}
                        disabled={deletingId === row.id}
                        className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold hover:shadow-lg transition-all-smooth disabled:opacity-50"
                      >
                        <Trash2 className="w-4 h-4 mr-2" /> Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Saved Itinerary?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete your saved itinerary.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Rename Dialog */}
      <Dialog open={renameItineraryId !== null} onOpenChange={(open) => {
        if (!open) {
          setRenameItineraryId(null);
          setRenameTitle('');
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Itinerary</DialogTitle>
            <DialogDescription>
              Enter a new title for your saved itinerary.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="rename-title">Title</Label>
            <Input
              id="rename-title"
              value={renameTitle}
              onChange={(e) => setRenameTitle(e.target.value)}
              placeholder="Enter new title"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleRename();
                }
              }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setRenameItineraryId(null);
              setRenameTitle('');
            }}>
              Cancel
            </Button>
            <Button onClick={handleRename}>
              Rename
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SavedItineraries;