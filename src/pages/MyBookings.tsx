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
import { CreditCard, Trash2, Eye, Clock, Hourglass } from 'lucide-react';

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
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50 to-white dark:from-gray-950 dark:via-blue-950/20 dark:to-gray-950 relative overflow-hidden p-4 sm:p-6 lg:p-8">
      {/* Enhanced background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200 dark:bg-blue-900/30 rounded-full blur-3xl opacity-30 dark:opacity-20"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-100 dark:bg-blue-900/20 rounded-full blur-3xl opacity-20 dark:opacity-10"></div>
        <div className="absolute top-1/2 left-1/3 w-96 h-96 bg-indigo-100 dark:bg-indigo-900/10 rounded-full blur-3xl opacity-10 dark:opacity-5"></div>
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <div className="mb-12">
          <div className="inline-block mb-4">
            
          </div>
          <h1 className="text-6xl font-bold text-gray-900 dark:text-white mb-2">My Bookings</h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">Manage your trips and track payment status</p>
        </div>

        {/* Content */}
        {loading ? (
          <div className="glass p-12 rounded-lg border border-gray-200 dark:border-gray-700 text-center">
            <div className="inline-flex items-center justify-center">
              <div className="relative w-12 h-12">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full animate-spin" style={{maskImage: 'conic-gradient(transparent 75%, black)'}}></div>
              </div>
            </div>
            <p className="text-gray-900 dark:text-gray-100 mt-4 font-semibold">Loading your bookings...</p>
          </div>
        ) : bookings.length === 0 ? (
          <div className="glass p-12 rounded-lg border border-gray-200 dark:border-gray-700 text-center">
            <div className="text-6xl mb-4">✈️</div>
            <p className="text-gray-900 dark:text-gray-100 text-lg font-semibold mb-2">No bookings yet</p>
            <p className="text-gray-600 dark:text-gray-400 mb-6">Start planning your next adventure!</p>
            <Button 
              onClick={() => navigate('/saved-itineraries')}
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-lg hover:shadow-lg transition-all-smooth"
            >
              Book Now →
            </Button>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Pending Bookings Section */}
            {bookings.filter(b => b.status === 'pending').length > 0 && (
              <div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30">
                    <Clock className="w-7 h-7 text-amber-600 dark:text-amber-400" />
                  </div>
                  Pending Bookings
                </h2>
                <div className="space-y-4">
                  {bookings.filter(b => b.status === 'pending').map((booking) => (
                    <div 
                      key={booking.id}
                      className="group relative p-6 lg:p-8 rounded-2xl border-2 border-amber-300 dark:border-amber-600 backdrop-blur-md bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950 dark:to-orange-950 hover:border-amber-400 dark:hover:border-amber-500 shadow-lg hover:shadow-2xl transition-all duration-300"
                    >
                      {/* Decorative background */}
                      <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                        <div className="absolute -top-20 -right-20 w-40 h-40 bg-amber-200 dark:bg-amber-900/20 rounded-full blur-2xl opacity-20"></div>
                      </div>

                      <div className="relative z-10">
                        <div className="flex items-start justify-between mb-6">
                          <div className="flex-1">
                            <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors duration-300">
                              {booking.itinerary_title}
                            </h3>
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-amber-500" />
                              <p className="text-gray-600 dark:text-gray-400 text-sm">
                                Saved on {new Date(booking.created_at).toLocaleDateString('en-US', { 
                                  year: 'numeric', 
                                  month: 'long', 
                                  day: 'numeric' 
                                })}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-gray-600 dark:text-gray-400 text-xs font-semibold uppercase tracking-wide mb-2">Total Amount</p>
                            <p className="text-4xl font-bold text-amber-600 dark:text-amber-400">PKR {Number(booking.total_amount).toLocaleString()}</p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between border-t border-amber-200 dark:border-amber-700/50 pt-6">
                          <div className="px-4 py-2 rounded-full bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-900/40 dark:to-orange-900/40 border border-amber-300/60 dark:border-amber-600/40">
                            <span className="text-sm font-semibold text-amber-800 dark:text-amber-300 flex items-center gap-2"><Hourglass className="w-4 h-4" /> Pending Payment</span>
                          </div>
                          <div className="flex gap-3">
                            <Button 
                              size="sm"
                              onClick={() => navigate('/payment', { state: { booking } })}
                              className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold rounded-lg hover:shadow-lg transition-all-smooth active:scale-95"
                            >
                              <CreditCard className="w-4 h-4 mr-2" /> Pay Now
                            </Button>
                            <AlertDialog open={cancelBookingId === booking.id} onOpenChange={(open) => !open && setCancelBookingId(null)}>
                              <AlertDialogTrigger asChild>
                                <Button 
                                  size="sm"
                                  onClick={() => setCancelBookingId(booking.id)}
                                  variant="outline"
                                  className="border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" /> Delete
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Booking?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This action cannot be undone. This will permanently delete your pending booking.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>No, keep it</AlertDialogCancel>
                                  <AlertDialogAction onClick={handleCancel} className="bg-red-600 hover:bg-red-700">
                                    Yes, delete booking
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Confirmed Bookings Section */}
            {bookings.filter(b => b.status === 'confirmed').length > 0 && (
              <div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30">
                    <span className="text-xl">✓</span>
                  </div>
                  Confirmed Bookings
                </h2>
                <div className="space-y-4">
                  {bookings.filter(b => b.status === 'confirmed').map((booking) => (
                    <div 
                      key={booking.id}
                      className="group relative p-6 lg:p-8 rounded-2xl border border-green-300 dark:border-green-600 backdrop-blur-md bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 hover:border-green-400 dark:hover:border-green-500 shadow-lg hover:shadow-2xl transition-all duration-300"
                    >
                      {/* Decorative background */}
                      <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                        <div className="absolute -top-20 -right-20 w-40 h-40 bg-green-200 dark:bg-green-900/20 rounded-full blur-2xl opacity-20"></div>
                      </div>

                      <div className="relative z-10">
                        <div className="flex items-start justify-between mb-6">
                          <div className="flex-1">
                            <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors duration-300">
                              {booking.itinerary_title}
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400 flex items-center gap-2 text-sm">
                              <CreditCard className="w-4 h-4 text-green-500" />
                              <span className="font-mono text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                                {booking.transaction_id}
                              </span>
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-gray-600 dark:text-gray-400 text-xs font-semibold uppercase tracking-wide mb-2">Total Amount</p>
                            <p className="text-4xl font-bold text-green-600 dark:text-green-400">PKR {Number(booking.total_amount).toLocaleString()}</p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between border-t border-green-200 dark:border-green-700/50 pt-6">
                          <div className="flex items-center gap-4">
                            <div className="px-4 py-2 rounded-full bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/40 dark:to-emerald-900/40 border border-green-300/60 dark:border-green-600/40">
                              <span className="text-sm font-semibold text-green-800 dark:text-green-300 flex items-center gap-2">✓ Confirmed</span>
                            </div>
                            <p className="text-gray-600 dark:text-gray-400 text-sm">
                              {new Date(booking.created_at).toLocaleDateString('en-US', { 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric' 
                              })}
                            </p>
                          </div>
                          <div className="flex gap-3">
                            <Button 
                              size="sm"
                              onClick={() => handleViewDetails(booking)}
                              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-lg hover:shadow-lg transition-all-smooth active:scale-95"
                            >
                              <Eye className="w-4 h-4 mr-2" /> Details
                            </Button>
                            <AlertDialog open={cancelBookingId === booking.id} onOpenChange={(open) => !open && setCancelBookingId(null)}>
                              <AlertDialogTrigger asChild>
                                <Button 
                                  size="sm"
                                  onClick={() => setCancelBookingId(booking.id)}
                                  className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold rounded-lg hover:shadow-lg transition-all-smooth active:scale-95"
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
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyBookings;
