import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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

  useEffect(() => {
    if (!isAuthenticated) {
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

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this saved itinerary?')) return;
    setDeletingId(id);
    try {
      const { error } = await supabase.from('saved_itineraries').delete().eq('id', id);
      if (error) {
        console.error('Delete error:', error);
        toast({ title: 'Delete failed', description: error.message, variant: 'destructive' });
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
    }
  };

  const handleRename = async (id: string) => {
    const newTitle = prompt('Enter new itinerary title:');
    if (newTitle === null) return; // cancelled
    const trimmed = newTitle.trim();
    if (!trimmed) {
      toast({ title: 'Invalid title', description: 'Title cannot be empty.', variant: 'destructive' });
      return;
    }
    try {
      const { error } = await supabase.from('saved_itineraries').update({ title: trimmed }).eq('id', id);
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
    <div className="min-h-screen p-4">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Saved Itineraries</CardTitle>
          <CardDescription>View, load, edit, or remove previously saved trip plans</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex justify-between items-center">
            <div>
              <strong>{saved.length}</strong> saved itinerary{saved.length !== 1 ? 's' : ''}
            </div>
            <div>
              <Button onClick={fetchSaved} disabled={loading}>
                Refresh
              </Button>
            </div>
          </div>

          {saved.length === 0 ? (
            <div className="text-center p-8 text-muted-foreground">No saved itineraries yet. Generate and save an itinerary to see it here.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {saved.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{row.title}</TableCell>
                    <TableCell>{row.created_at ? new Date(row.created_at).toLocaleString() : '-'}</TableCell>
                    <TableCell>{row.total_price != null ? `PKR ${Number(row.total_price).toFixed(2)}` : '-'}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => {
                          // load plan into planner
                          setTripData({
                            source: row.plan?.meta?.source || '',
                            destinations: row.plan?.meta?.destinations || (row.plan?.days?.map((d: any) => d.destination) || []),
                            budget: String(row.plan?.totals?.grandTotal || ''),
                            startDate: row.plan?.days?.[0]?.date || '',
                            endDate: row.plan?.days?.[row.plan?.days?.length - 1]?.date || '',
                          });
                          toast({ title: 'Loaded itinerary', description: 'Saved itinerary loaded into planner.' });
                          navigate('/');
                        }}>
                          <Play className="w-4 h-4 mr-2" /> Load
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleRename(row.id)}>
                          <Edit className="w-4 h-4 mr-2" /> Rename
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleDelete(row.id)} disabled={deletingId === row.id}>
                          <Trash2 className="w-4 h-4 mr-2" /> Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SavedItineraries;