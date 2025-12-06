import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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
import { CreditCard, Trash2, Eye } from 'lucide-react';

const MyBookings = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useBooking();
  const { toast } = useToast();

  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [cancelBookingId, setCancelBookingId] = useState<string | null>(null);

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

  const handleCancel = async () => {
    if (!cancelBookingId) return;
    try {
      const { error } = await supabase.from('confirmed_bookings').delete().eq('id', cancelBookingId);
      if (error) {
        toast({ title: 'Error', description: 'Failed to cancel booking.', variant: 'destructive' });
        return;
      }
      toast({ title: 'Cancelled', description: 'Booking has been cancelled.' });
      fetchBookings();
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to cancel booking.', variant: 'destructive' });
    } finally {
      setCancelBookingId(null);
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

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-2">My Bookings</h1>
          <p className="text-gray-600 dark:text-gray-300">Your confirmed and paid bookings</p>
        </div>

        {/* Content */}
        {loading ? (
          <div className="glass p-12 rounded-lg border border-gray-200 text-center">
            <div className="inline-flex items-center justify-center">
              <div className="relative w-12 h-12">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full animate-spin" style={{maskImage: 'conic-gradient(transparent 75%, black)'}}></div>
              </div>
            </div>
            <p className="text-gray-900 mt-4 font-semibold">Loading your bookings...</p>
          </div>
        ) : bookings.length === 0 ? (
          <div className="glass p-12 rounded-lg border border-gray-200 text-center">
            <div className="text-6xl mb-4">✈️</div>
            <p className="text-gray-900 text-lg font-semibold mb-2">No bookings yet</p>
            <p className="text-gray-600 mb-6">Start planning your next adventure!</p>
            <Button 
              onClick={() => navigate('/saved-itineraries')}
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-lg hover:shadow-lg transition-all-smooth"
            >
              Book Now →
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <div 
                key={booking.id}
                className="glass p-6 rounded-lg border border-gray-200 backdrop-blur-sm hover:border-blue-400 transition-all-smooth group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
                      {booking.itinerary_title}
                    </h3>
                    <p className="text-gray-600 flex items-center gap-2">
                      <CreditCard className="w-4 h-4" />
                      Transaction ID: <span className="font-mono text-gray-900">{booking.transaction_id}</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-600 text-sm mb-1">Total Amount</p>
                    <p className="text-3xl font-bold text-blue-600">PKR {Number(booking.total_amount).toLocaleString()}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-gray-300 pt-4">
                  <div className="flex items-center gap-3">
                    <div className="px-3 py-1 rounded-full bg-green-100 border border-green-300">
                      <span className="text-xs font-semibold text-green-700">✓ Confirmed</span>
                    </div>
                    <p className="text-gray-600 text-sm">
                      {new Date(booking.created_at).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      size="sm"
                      onClick={() => handleViewDetails(booking)}
                      className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold hover:shadow-lg transition-all-smooth"
                    >
                      <Eye className="w-4 h-4 mr-2" /> Details
                    </Button>
                    <AlertDialog open={cancelBookingId === booking.id} onOpenChange={(open) => !open && setCancelBookingId(null)}>
                      <AlertDialogTrigger asChild>
                        <Button 
                          size="sm"
                          onClick={() => setCancelBookingId(booking.id)}
                          className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold hover:shadow-lg transition-all-smooth"
                        >
                          <Trash2 className="w-4 h-4 mr-2" /> Cancel
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Cancel Booking?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently cancel your booking.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>No, keep it</AlertDialogCancel>
                          <AlertDialogAction onClick={handleCancel} className="bg-red-600 hover:bg-red-700">
                            Yes, cancel booking
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyBookings;
