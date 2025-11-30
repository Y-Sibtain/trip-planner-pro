import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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
        console.error('Failed to load bookings - Details:', error.code, error.message, error.details, error.hint);
        toast({ title: 'Error', description: `Failed to load bookings: ${error.message}`, variant: 'destructive' });
        return;
      }

      console.log('Bookings loaded:', data);
      setBookings(data || []);

      // Fetch user emails for each booking
      const emails: Record<string, string> = {};
      if (data) {
        for (const booking of data) {
          const { data: userData } = await supabase.auth.admin.getUserById(booking.user_id);
          if (userData?.user?.email) {
            emails[booking.user_id] = userData.user.email;
          }
        }
        setUserEmails(emails);
      }
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
        toast({ title: 'Error', description: 'Failed to update booking.', variant: 'destructive' });
        return;
      }

      toast({ title: 'Success', description: 'Booking marked as processed.' });
      fetchBookings();
    } catch (err) {
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
        toast({ title: 'Error', description: 'Failed to reject booking.', variant: 'destructive' });
        return;
      }

      toast({ title: 'Rejected', description: 'Booking has been rejected.' });
      fetchBookings();
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to reject booking.', variant: 'destructive' });
    }
  };

  const handleViewDetails = (booking: ConfirmedBooking) => {
    alert(`Booking Details:\n\nID: ${booking.id}\nUser Email: ${userEmails[booking.user_id] || 'N/A'}\nAmount: PKR ${booking.total_amount}\nTransaction: ${booking.transaction_id}\nCard Last 4: ${booking.card_last_four}\nStatus: ${booking.status}`);
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
                    <TableHead>User Email</TableHead>
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
                      <TableCell className="font-medium">{userEmails[booking.user_id] || 'Loading...'}</TableCell>
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
    </div>
  );
};

export default AdminBookings;
