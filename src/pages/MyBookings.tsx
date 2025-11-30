import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useBooking } from '@/contexts/BookingContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { CreditCard, Trash2 } from 'lucide-react';

const MyBookings = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useBooking();
  const { toast } = useToast();

  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth');
      return;
    }
    fetchBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('user_id', user?.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Failed to load bookings:', error);
        toast({ title: 'Error', description: 'Failed to load bookings.', variant: 'destructive' });
        return;
      }
      setBookings(data || []);
    } catch (err) {
      console.error('Fetch bookings error:', err);
      toast({ title: 'Error', description: 'Failed to load bookings.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = (booking: any) => {
    navigate('/payment', { state: { booking } });
  };

  const handleCancel = async (bookingId: string) => {
    if (!confirm('Cancel this booking?')) return;
    try {
      const { error } = await supabase.from('bookings').delete().eq('id', bookingId);
      if (error) {
        toast({ title: 'Error', description: 'Failed to cancel booking.', variant: 'destructive' });
        return;
      }
      toast({ title: 'Cancelled', description: 'Booking cancelled.' });
      fetchBookings();
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to cancel booking.', variant: 'destructive' });
    }
  };

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen p-4">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>My Bookings</CardTitle>
          <CardDescription>Pending bookings awaiting payment</CardDescription>
        </CardHeader>
        <CardContent>
          {bookings.length === 0 ? (
            <div className="text-center p-8 text-muted-foreground">No pending bookings. Start by booking a saved itinerary.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Itinerary</TableHead>
                  <TableHead>Total Amount</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookings.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell>{booking.itinerary_title}</TableCell>
                    <TableCell>PKR {Number(booking.total_amount).toFixed(2)}</TableCell>
                    <TableCell>{new Date(booking.created_at).toLocaleDateString()}</TableCell>
                    <TableCell><span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-sm">Pending</span></TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleCheckout(booking)}>
                          <CreditCard className="w-4 h-4 mr-2" /> Checkout
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleCancel(booking.id)}>
                          <Trash2 className="w-4 h-4 mr-2" /> Cancel
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

export default MyBookings;
