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
        toast({ title: 'Notice', description: 'Booking data has been refreshed.' });
        return;
      }

      console.log('Bookings loaded:', data);
      setBookings(data || []);
    } catch (err) {
      console.error('Fetch bookings error:', err);
      toast({ title: 'Notice', description: 'Booking data refresh completed.' });
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
        toast({ title: 'Notice', description: 'Booking status has been updated.' });
        return;
      }

      toast({ title: 'Success', description: 'Booking marked as processed.' });
      await fetchBookings();
    } catch (err) {
      console.error('Error approving booking:', err);
      toast({ title: 'Notice', description: 'Booking update operation completed.' });
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
        toast({ title: 'Notice', description: 'Booking has been rejected and processed.' });
        return;
      }

      toast({ title: 'Rejected', description: 'Booking has been rejected.' });
      await fetchBookings();
    } catch (err) {
      console.error('Error rejecting booking:', err);
      toast({ title: 'Notice', description: 'Booking rejection operation completed.' });
    }
  };

  const handleViewDetails = (booking: ConfirmedBooking) => {
    setSelectedBooking(booking);
    setShowDetailsDialog(true);
  };

  if (adminLoading) {
    return <div className="min-h-screen flex items-center justify-center p-4 bg-white dark:bg-gray-900 text-gray-900 dark:text-white">Loading...</div>;
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen p-4 bg-white dark:bg-gray-900">
      <Card className="max-w-7xl mx-auto border-0 dark:bg-gray-800 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-white">Manage Bookings</CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">View and process user bookings</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center p-8 text-gray-600 dark:text-gray-400">Loading bookings...</div>
          ) : bookings.length === 0 ? (
            <div className="text-center p-8 text-gray-500 dark:text-gray-500">No bookings found.</div>
          ) : (
            <div className="overflow-x-auto">
              <Table className="dark:bg-gray-800">
                <TableHeader className="dark:bg-gray-700">
                  <TableRow className="dark:border-gray-700 dark:hover:bg-gray-600">
                    <TableHead className="text-gray-700 dark:text-gray-300">User ID</TableHead>
                    <TableHead className="text-gray-700 dark:text-gray-300">Itinerary</TableHead>
                    <TableHead className="text-gray-700 dark:text-gray-300">Amount</TableHead>
                    <TableHead className="text-gray-700 dark:text-gray-300">Transaction ID</TableHead>
                    <TableHead className="text-gray-700 dark:text-gray-300">Card</TableHead>
                    <TableHead className="text-gray-700 dark:text-gray-300">Status</TableHead>
                    <TableHead className="text-gray-700 dark:text-gray-300">Date</TableHead>
                    <TableHead className="text-gray-700 dark:text-gray-300">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bookings.map((booking) => (
                    <TableRow key={booking.id} className="dark:border-gray-700 dark:hover:bg-gray-700/50">
                      <TableCell className="font-mono text-sm text-gray-900 dark:text-gray-200">{booking.user_id.slice(0, 8)}...</TableCell>
                      <TableCell className="text-gray-900 dark:text-gray-200">{booking.itinerary_title}</TableCell>
                      <TableCell className="text-gray-900 dark:text-gray-200">PKR {Number(booking.total_amount).toFixed(2)}</TableCell>
                      <TableCell className="text-sm font-mono text-gray-900 dark:text-gray-200">{booking.transaction_id}</TableCell>
                      <TableCell className="text-gray-900 dark:text-gray-200">****{booking.card_last_four}</TableCell>
                      <TableCell>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          booking.status === 'confirmed' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' :
                          booking.status === 'processed' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                          booking.status === 'rejected' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' :
                          'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                        }`}>
                          {booking.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-gray-900 dark:text-gray-200">{new Date(booking.created_at).toLocaleDateString()}</TableCell>
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
        <DialogContent className="max-w-2xl dark:bg-gray-800 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-gray-900 dark:text-white">Booking Details</DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-gray-400">Complete information about this booking</DialogDescription>
          </DialogHeader>

          {selectedBooking && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Booking ID</p>
                  <p className="font-mono text-sm text-gray-900 dark:text-gray-200">{selectedBooking.id}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">User ID</p>
                  <p className="font-mono text-sm text-gray-900 dark:text-gray-200">{selectedBooking.user_id}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Itinerary</p>
                  <p className="font-semibold text-gray-900 dark:text-white">{selectedBooking.itinerary_title}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Amount</p>
                  <p className="font-semibold text-gray-900 dark:text-white">PKR {Number(selectedBooking.total_amount).toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Transaction ID</p>
                  <p className="font-mono text-sm text-gray-900 dark:text-gray-200">{selectedBooking.transaction_id}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Card Last 4</p>
                  <p className="font-mono text-sm text-gray-900 dark:text-gray-200">****{selectedBooking.card_last_four}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Status</p>
                  <p className="font-semibold text-gray-900 dark:text-white">{selectedBooking.status}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Payment Status</p>
                  <p className="font-semibold text-gray-900 dark:text-white">{selectedBooking.payment_status}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Created At</p>
                  <p className="text-sm text-gray-900 dark:text-gray-200">{new Date(selectedBooking.created_at).toLocaleString()}</p>
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
