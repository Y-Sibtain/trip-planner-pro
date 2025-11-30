import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useBooking } from '@/contexts/BookingContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { CreditCard, Trash2, Eye } from 'lucide-react';

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
  }, [isAuthenticated, user?.id]);

  const fetchBookings = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('confirmed_bookings')
        .select('*')
        .eq('user_id', user.id)
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

  const handleViewDetails = (booking: any) => {
    toast({
      title: 'Booking Details',
      description: `Transaction ID: ${booking.transaction_id}`,
    });
  };

  const handleCancel = async (bookingId: string) => {
    if (!confirm('Cancel this booking? This action cannot be undone.')) return;
    try {
      const { error } = await supabase.from('confirmed_bookings').delete().eq('id', bookingId);
      if (error) {
        toast({ title: 'Error', description: 'Failed to cancel booking.', variant: 'destructive' });
        return;
      }
      toast({ title: 'Cancelled', description: 'Booking has been cancelled.' });
      fetchBookings();
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to cancel booking.', variant: 'destructive' });
    }
  };

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen p-4 bg-gray-50">
      <Card className="max-w-6xl mx-auto">
        <CardHeader>
          <CardTitle>My Bookings</CardTitle>
          <CardDescription>Your confirmed and paid bookings</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center p-8">Loading bookings...</div>
          ) : bookings.length === 0 ? (
            <div className="text-center p-8 text-muted-foreground">
              No bookings yet. <Button variant="link" onClick={() => navigate('/saved-itineraries')}>Book a saved itinerary</Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Itinerary</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Transaction ID</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookings.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell className="font-medium">{booking.itinerary_title}</TableCell>
                    <TableCell>PKR {Number(booking.total_amount).toFixed(2)}</TableCell>
                    <TableCell>
                      <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                        Confirmed
                      </span>
                    </TableCell>
                    <TableCell className="text-sm font-mono">{booking.transaction_id}</TableCell>
                    <TableCell>{new Date(booking.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleViewDetails(booking)}
                        >
                          <Eye className="w-4 h-4 mr-2" /> Details
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={() => handleCancel(booking.id)}
                        >
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
