import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAdmin } from '@/hooks/useAdmin';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle, XCircle, Eye } from 'lucide-react';

interface ConfirmedBooking {
  id: string;
  user_id: string;
  itinerary_title: string;
  total_amount: number;
  status: string;
  payment_status: string;
  transaction_id: string;
  card_last_four: string;
  created_at: string;
  itinerary_data?: any;
}

const AdminBookings = () => {
  const navigate = useNavigate();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const { toast } = useToast();

  const [bookings, setBookings] = useState<ConfirmedBooking[]>([]);
  const [loading, setLoading] = useState(false);
  const [userEmails, setUserEmails] = useState<Record<string, string>>({});
  const [selectedBooking, setSelectedBooking] = useState<ConfirmedBooking | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);

  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      navigate('/');
      return;
    }
    if (isAdmin) {
      fetchBookings();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, adminLoading]);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('confirmed_bookings')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Failed to load bookings:', error);
        toast({ title: 'Error', description: `Failed to load bookings: ${error.message}`, variant: 'destructive' });
        return;
      }

      console.log('Bookings loaded:', data);
      setBookings(data || []);
    } catch (err) {
      console.error('Fetch bookings error:', err);
      toast({ title: 'Error', description: 'Failed to load bookings.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (bookingId: string) => {
    try {
      const { error } = await supabase
        .from('confirmed_bookings')
        .update({ status: 'processed' })
        .eq('id', bookingId);

      if (error) {
        console.error('Approve error:', error);
        toast({ title: 'Error', description: `Failed to update booking: ${error.message}`, variant: 'destructive' });
        return;
      }

      toast({ title: 'Success', description: 'Booking marked as processed.' });
      await fetchBookings();
    } catch (err) {
      console.error('Error approving booking:', err);
      toast({ title: 'Error', description: 'Failed to update booking.', variant: 'destructive' });
    }
  };

  const handleReject = async (bookingId: string) => {
    if (!confirm('Reject this booking? This will cancel it.')) return;

    try {
      const { error } = await supabase
        .from('confirmed_bookings')
        .update({ status: 'rejected' })
        .eq('id', bookingId);

      if (error) {
        console.error('Reject error:', error);
        toast({ title: 'Error', description: `Failed to reject booking: ${error.message}`, variant: 'destructive' });
        return;
      }

      toast({ title: 'Rejected', description: 'Booking has been rejected.' });
      await fetchBookings();
    } catch (err) {
      console.error('Error rejecting booking:', err);
      toast({ title: 'Error', description: 'Failed to reject booking.', variant: 'destructive' });
    }
  };

  const handleViewDetails = (booking: ConfirmedBooking) => {
    setSelectedBooking(booking);
    setShowDetailsDialog(true);
  };

  if (adminLoading) {
    return <div className="text-center p-8">Loading...</div>;
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen p-4 bg-gray-50">
      <Card className="max-w-7xl mx-auto">
        <CardHeader>
          <CardTitle>Manage Bookings</CardTitle>
          <CardDescription>View and process user bookings</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center p-8">Loading bookings...</div>
          ) : bookings.length === 0 ? (
            <div className="text-center p-8 text-muted-foreground">No bookings found.</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User ID</TableHead>
                    <TableHead>Itinerary</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Transaction ID</TableHead>
                    <TableHead>Card</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bookings.map((booking) => (
                    <TableRow key={booking.id}>
                      <TableCell className="font-mono text-sm">{booking.user_id.slice(0, 8)}...</TableCell>
                      <TableCell>{booking.itinerary_title}</TableCell>
                      <TableCell>PKR {Number(booking.total_amount).toFixed(2)}</TableCell>
                      <TableCell className="text-sm font-mono">{booking.transaction_id}</TableCell>
                      <TableCell>****{booking.card_last_four}</TableCell>
                      <TableCell>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          booking.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                          booking.status === 'processed' ? 'bg-green-100 text-green-800' :
                          booking.status === 'rejected' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {booking.status}
                        </span>
                      </TableCell>
                      <TableCell>{new Date(booking.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleViewDetails(booking)}
                          >
                            <Eye className="w-4 h-4 mr-1" /> View
                          </Button>
                          {booking.status === 'confirmed' && (
                            <>
                              <Button 
                                size="sm" 
                                className="bg-green-600 hover:bg-green-700"
                                onClick={() => handleApprove(booking.id)}
                              >
                                <CheckCircle className="w-4 h-4 mr-1" /> Approve
                              </Button>
                              <Button 
                                size="sm" 
                                variant="destructive"
                                onClick={() => handleReject(booking.id)}
                              >
                                <XCircle className="w-4 h-4 mr-1" /> Reject
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Booking Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Booking Details</DialogTitle>
            <DialogDescription>Complete information about this booking</DialogDescription>
          </DialogHeader>

          {selectedBooking && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-600">Booking ID</p>
                  <p className="font-mono text-sm">{selectedBooking.id}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">User ID</p>
                  <p className="font-mono text-sm">{selectedBooking.user_id}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Itinerary</p>
                  <p className="font-semibold">{selectedBooking.itinerary_title}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Amount</p>
                  <p className="font-semibold">PKR {Number(selectedBooking.total_amount).toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Transaction ID</p>
                  <p className="font-mono text-sm">{selectedBooking.transaction_id}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Card Last 4</p>
                  <p className="font-mono text-sm">****{selectedBooking.card_last_four}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Status</p>
                  <p className="font-semibold">{selectedBooking.status}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Payment Status</p>
                  <p className="font-semibold">{selectedBooking.payment_status}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Created At</p>
                  <p className="text-sm">{new Date(selectedBooking.created_at).toLocaleString()}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminBookings;
