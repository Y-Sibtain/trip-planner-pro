import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
import { useAdmin } from '@/hooks/useAdmin';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, XCircle, Eye } from 'lucide-react';

interface BookingObject {
  id: string;
  status: 'pending' | 'confirmed' | 'processed' | 'rejected';
  payment_status: string;
  itinerary_title: string;
  total_amount: number;
  transaction_id?: string;
  card_last_four?: string;
  itinerary_data?: any;
  created_at: string;
}

const AdminBookings = () => {
  const navigate = useNavigate();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const { toast } = useToast();

  const [bookings, setBookings] = useState<BookingObject[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<BookingObject | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [rejectBookingId, setRejectBookingId] = useState<string | null>(null);

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

  const fetchBookings = () => {
    setLoading(true);
    try {
      // Get bookings from localStorage
      const bookingsData = localStorage.getItem('bookings');
      const allBookings: BookingObject[] = bookingsData ? JSON.parse(bookingsData) : [];
      
      // Sort by created_at descending - show all bookings regardless of status
      allBookings.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      console.log('Bookings loaded from localStorage:', allBookings);
      setBookings(allBookings);
    } catch (err) {
      console.error('Fetch bookings error:', err);
      toast({ title: 'Error', description: 'Failed to load bookings.' });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = (bookingId: string) => {
    try {
      const bookingsData = localStorage.getItem('bookings');
      const allBookings: BookingObject[] = bookingsData ? JSON.parse(bookingsData) : [];
      
      // Find and update the booking
      const bookingIndex = allBookings.findIndex(b => b.id === bookingId);
      if (bookingIndex !== -1) {
        allBookings[bookingIndex].status = 'processed';
        localStorage.setItem('bookings', JSON.stringify(allBookings));
        
        toast({ title: 'Success', description: 'Booking marked as processed.' });
        fetchBookings();
      } else {
        toast({ title: 'Error', description: 'Booking not found.' });
      }
    } catch (err) {
      console.error('Error approving booking:', err);
      toast({ title: 'Error', description: 'Failed to approve booking.' });
    }
  };

  const handleReject = () => {
    if (!rejectBookingId) return;

    try {
      const bookingsData = localStorage.getItem('bookings');
      const allBookings: BookingObject[] = bookingsData ? JSON.parse(bookingsData) : [];
      
      // Find and update the booking
      const bookingIndex = allBookings.findIndex(b => b.id === rejectBookingId);
      if (bookingIndex !== -1) {
        allBookings[bookingIndex].status = 'rejected';
        localStorage.setItem('bookings', JSON.stringify(allBookings));
        
        toast({ title: 'Rejected', description: 'Booking has been rejected.' });
        fetchBookings();
      } else {
        toast({ title: 'Error', description: 'Booking not found.' });
      }
    } catch (err) {
      console.error('Error rejecting booking:', err);
      toast({ title: 'Error', description: 'Failed to reject booking.' });
    } finally {
      setRejectBookingId(null);
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
                    <TableHead className="text-gray-700 dark:text-gray-300">Booking ID</TableHead>
                    <TableHead className="text-gray-700 dark:text-gray-300">Itinerary</TableHead>
                    <TableHead className="text-gray-700 dark:text-gray-300">Amount</TableHead>
                    <TableHead className="text-gray-700 dark:text-gray-300">Payment Status</TableHead>
                    <TableHead className="text-gray-700 dark:text-gray-300">Booking Status</TableHead>
                    <TableHead className="text-gray-700 dark:text-gray-300">Date</TableHead>
                    <TableHead className="text-gray-700 dark:text-gray-300">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bookings.map((booking) => (
                    <TableRow key={booking.id} className="dark:border-gray-700 dark:hover:bg-gray-700/50">
                      <TableCell className="font-mono text-sm text-gray-900 dark:text-gray-200">{booking.id.slice(0, 8)}...</TableCell>
                      <TableCell className="text-gray-900 dark:text-gray-200">{booking.itinerary_title}</TableCell>
                      <TableCell className="text-gray-900 dark:text-gray-200">PKR {Number(booking.total_amount).toFixed(2)}</TableCell>
                      <TableCell>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          booking.payment_status === 'paid' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                          booking.payment_status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                          'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                        }`}>
                          {booking.payment_status}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          booking.status === 'confirmed' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' :
                          booking.status === 'pending' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300' :
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
                          {(booking.status === 'confirmed' || booking.status === 'pending') && (
                            <>
                              <Button 
                                size="sm" 
                                className="bg-green-600 hover:bg-green-700"
                                onClick={() => handleApprove(booking.id)}
                              >
                                <CheckCircle className="w-4 h-4 mr-1" /> Approve
                              </Button>
                              <AlertDialog open={rejectBookingId === booking.id} onOpenChange={(open) => !open && setRejectBookingId(null)}>
                                <AlertDialogTrigger asChild>
                                  <Button 
                                    size="sm" 
                                    variant="destructive"
                                    onClick={() => setRejectBookingId(booking.id)}
                                  >
                                    <XCircle className="w-4 h-4 mr-1" /> Reject
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Reject Booking?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      This will cancel this booking. This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleReject} className="bg-red-600 hover:bg-red-700">
                                      Reject
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
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
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Itinerary</p>
                  <p className="font-semibold text-gray-900 dark:text-white">{selectedBooking.itinerary_title}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Amount</p>
                  <p className="font-semibold text-gray-900 dark:text-white">PKR {Number(selectedBooking.total_amount).toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Payment Status</p>
                  <p className="font-semibold text-gray-900 dark:text-white">{selectedBooking.payment_status}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Booking Status</p>
                  <p className="font-semibold text-gray-900 dark:text-white">{selectedBooking.status}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Created At</p>
                  <p className="text-sm text-gray-900 dark:text-gray-200">{new Date(selectedBooking.created_at).toLocaleString()}</p>
                </div>
                {selectedBooking.transaction_id && (
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Transaction ID</p>
                    <p className="font-mono text-sm text-gray-900 dark:text-gray-200">{selectedBooking.transaction_id}</p>
                  </div>
                )}
                {selectedBooking.card_last_four && (
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Card Last 4</p>
                    <p className="font-mono text-sm text-gray-900 dark:text-gray-200">****{selectedBooking.card_last_four}</p>
                  </div>
                )}
              </div>
              {selectedBooking.itinerary_data && (
                <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Itinerary Data</p>
                  <pre className="text-xs text-gray-900 dark:text-gray-200 overflow-auto max-h-48">
                    {JSON.stringify(selectedBooking.itinerary_data, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminBookings;
