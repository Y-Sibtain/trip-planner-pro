import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useBooking } from '@/contexts/BookingContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { CreditCard, Lock } from 'lucide-react';

const Payment = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useBooking();
  const { toast } = useToast();

  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [cardData, setCardData] = useState({
    cardName: '',
    cardNumber: '',
    expiryDate: '',
    cvv: '',
  });

  useEffect(() => {
    const state = location.state as any;
    if (state?.booking) {
      setBooking(state.booking);
    } else if (state?.itinerary) {
      // Create booking from saved itinerary
      const itinerary = state.itinerary;
      setBooking({
        id: `booking-${Date.now()}`,
        itinerary_title: itinerary.title,
        total_amount: itinerary.total_price,
        itinerary_data: itinerary.plan,
        user_id: user?.id,
      });
    } else {
      console.log("No booking or itinerary data found in state:", state);
    }
  }, [location.state, user?.id]);

  // Check if user is authenticated when component mounts or when authentication changes
  useEffect(() => {
    if (!isAuthenticated) {
      toast({
        title: 'Authentication Required',
        description: 'You need to sign in or sign up to proceed with booking',
        variant: 'destructive'
      });
      navigate('/auth', { state: { bookingData: true } });
    }
  }, [isAuthenticated, navigate, toast]);

  const validateCard = () => {
    if (!cardData.cardName.trim()) {
      toast({ title: 'Error', description: 'Cardholder name required.', variant: 'destructive' });
      return false;
    }
    if (cardData.cardNumber.replace(/\s/g, '').length !== 16) {
      toast({ title: 'Error', description: 'Card number must be 16 digits.', variant: 'destructive' });
      return false;
    }
    if (!/^\d{2}\/\d{2}$/.test(cardData.expiryDate)) {
      toast({ title: 'Error', description: 'Expiry date format: MM/YY.', variant: 'destructive' });
      return false;
    }
    if (cardData.cvv.length !== 3) {
      toast({ title: 'Error', description: 'CVV must be 3 digits.', variant: 'destructive' });
      return false;
    }
    return true;
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateCard()) return;
    if (!booking || !user?.id) {
      toast({ title: 'Error', description: 'Login in or sign up to proceed.', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      // Simulate payment processing with dummy gateway
      const transactionId = `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

      // Create confirmed booking
      const confirmedBooking = {
        user_id: user.id,
        itinerary_title: booking.itinerary_title || 'Trip Booking',
        total_amount: booking.total_amount || 0,
        itinerary_data: booking.plan || booking.itinerary_data || {},
        status: 'confirmed',
        payment_status: 'paid',
        transaction_id: transactionId,
        card_last_four: cardData.cardNumber.slice(-4),
      };

      const { data, error } = await supabase
        .from('confirmed_bookings')
        .insert([confirmedBooking])
        .select();

      if (error) {
        console.error('Booking creation error:', error);
        toast({ title: 'Error', description: `Failed to create booking: ${error.message}`, variant: 'destructive' });
        setLoading(false);
        return;
      }

      console.log('Booking created:', data);

      // Delete any pending bookings with the same title and payment_status for this user
      // This ensures we don't delete confirmed bookings with the same title
      try {
        const { error: deleteError } = await supabase
          .from('confirmed_bookings')
          .delete()
          .eq('user_id', user.id)
          .eq('status', 'pending')
          .eq('payment_status', 'pending')
          .eq('itinerary_title', booking.itinerary_title);
        
        if (deleteError) {
          console.warn('Failed to delete pending booking:', deleteError);
        } else {
          console.log('Pending bookings deleted successfully');
        }
      } catch (delErr) {
        console.warn('Failed to delete pending booking:', delErr);
      }

      toast({
        title: 'Payment Successful!',
        description: `Transaction ID: ${transactionId}. Your booking is confirmed.`,
      });

      // Clear traveller data from session storage after successful booking
      sessionStorage.removeItem('travellerData');

      // Redirect to bookings page or home after 2 seconds
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (err) {
      console.error('Payment processing error:', err);
      toast({ title: 'Error', description: 'Payment processing failed. Please try again.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  if (!booking) {
    return (
      <div className="w-full min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg animate-pulse mx-auto mb-4 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-gray-600 dark:text-gray-400 text-lg">Loading payment details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-white dark:bg-gray-900 px-4 py-12 md:py-20 relative overflow-hidden">
      {/* Subtle background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-100 dark:bg-blue-900/20 rounded-full blur-3xl opacity-20 dark:opacity-10"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-50 dark:bg-blue-900/10 rounded-full blur-3xl opacity-10 dark:opacity-5"></div>
      </div>

      <div className="relative z-10 max-w-md mx-auto">
        <div className="glass rounded-lg backdrop-blur-sm border border-gray-200 dark:border-gray-700 p-6 md:p-8 shadow-md dark:bg-gray-800/50">
          {/* Header with Back on right */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Complete Payment</h1>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Secure payment processing</p>
            </div>
            <Button
              onClick={() => navigate('/city-planner', { state: { booking } })}
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 text-white font-semibold glow-primary hover:scale-105 transition-all-smooth"
            >
              ← Back
            </Button>
          </div>

          

          {/* Booking Summary */}
          <div className="mb-8 rounded-lg border border-gray-300 dark:border-gray-700 p-4 space-y-3 bg-gray-50 dark:bg-gray-800/30">
            <p className="text-gray-700 dark:text-gray-300 text-sm font-semibold">Order Summary</p>
            <div className="space-y-2">
              <div className="flex justify-between items-start">
                <span className="text-gray-700 dark:text-gray-300">{booking.itinerary_title}</span>
                <span className="font-bold text-blue-600 dark:text-blue-400">PKR {Number(booking.total_amount).toLocaleString()}</span>
              </div>
              <div className="border-t border-gray-300 dark:border-gray-700 pt-2 flex justify-between items-center">
                <span className="font-bold text-gray-900 dark:text-white">Total Amount</span>
                <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">PKR {Number(booking.total_amount).toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Payment Form */}
          <form onSubmit={handlePayment} className="space-y-5">
            {/* Cardholder Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">Cardholder Name</label>
              <input
                type="text"
                placeholder="John Doe"
                value={cardData.cardName}
                onChange={(e) => setCardData({ ...cardData, cardName: e.target.value })}
                required
                className="w-full px-4 py-3 rounded-lg glass border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 dark:bg-gray-700/50 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all-smooth"
              />
            </div>

            {/* Card Number */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">Card Number</label>
              <input
                type="text"
                placeholder="1234 5678 9012 3456"
                value={cardData.cardNumber.replace(/(\d{4})(?=\d)/g, '$1 ')}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 16);
                  setCardData({ ...cardData, cardNumber: val });
                }}
                required
                className="w-full px-4 py-3 rounded-lg glass border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 dark:bg-gray-700/50 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all-smooth font-mono"
              />
            </div>

            {/* Expiry & CVV */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">Expiry (MM/YY)</label>
                <input
                  type="text"
                  placeholder="12/25"
                  value={cardData.expiryDate}
                  onChange={(e) => {
                    let val = e.target.value.replace(/\D/g, '').slice(0, 4);
                    if (val.length >= 2) {
                      val = val.slice(0, 2) + '/' + val.slice(2);
                    }
                    setCardData({ ...cardData, expiryDate: val });
                  }}
                  required
                  className="w-full px-4 py-3 rounded-lg glass border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 dark:bg-gray-700/50 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all-smooth font-mono"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">CVV</label>
                <input
                  type="password"
                  placeholder="123"
                  value={cardData.cvv}
                  onChange={(e) => setCardData({ ...cardData, cvv: e.target.value.replace(/\D/g, '').slice(0, 3) })}
                  required
                  className="w-full px-4 py-3 rounded-lg glass border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 dark:bg-gray-700/50 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all-smooth font-mono"
                />
              </div>
            </div>

            {/* Pay Button */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold py-3 rounded-lg mt-6 hover:shadow-lg transition-all-smooth disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CreditCard className="w-4 h-4 mr-2 inline" />
              {loading ? 'Processing...' : 'Pay Now'}
            </Button>
          </form>

          {/* Security Note */}
          <p className="text-xs text-gray-600 dark:text-gray-400 text-center mt-6"><Lock className="w-4 h-4 inline mr-1" /> Payments are encrypted and secure</p>
        </div>
      </div>
    </div>
  );
};

export default Payment;
