import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useBooking } from '@/contexts/BookingContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { CreditCard } from 'lucide-react';

const Payment = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useBooking();
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
    }
  }, [location.state, user?.id]);

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
    if (!booking) {
      toast({ title: 'Error', description: 'No booking found.', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      // Simulate payment processing (in production, integrate Stripe/Payment Gateway)
      const transactionId = `TXN-${Date.now()}`;

      // Create confirmed booking
      const confirmedBooking = {
        user_id: user?.id,
        itinerary_title: booking.itinerary_title,
        total_amount: booking.total_amount,
        itinerary_data: booking.itinerary_data,
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
        console.error('Payment error:', error);
        toast({ title: 'Payment failed', description: 'Unable to process payment.', variant: 'destructive' });
        return;
      }

      // Send receipt email
      try {
        await supabase.functions.invoke('send-receipt-email', {
          body: {
            email: user?.email,
            bookingId: data[0].id,
            amount: booking.total_amount,
            transactionId,
            itineraryTitle: booking.itinerary_title,
          },
        });
      } catch (emailErr) {
        console.warn('Failed to send receipt email:', emailErr);
      }

      // Delete from pending bookings if exists
      if (booking.id && !booking.id.startsWith('booking-')) {
        await supabase.from('bookings').delete().eq('id', booking.id);
      }

      toast({ title: 'Payment successful', description: 'Booking confirmed. Receipt sent to your email.' });
      navigate('/');
    } catch (err) {
      console.error('Payment processing error:', err);
      toast({ title: 'Error', description: 'Payment processing failed.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  if (!booking) {
    return <div className="text-center p-8">Loading...</div>;
  }

  return (
    <div className="min-h-screen p-4 flex items-center justify-center">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle>Payment</CardTitle>
          <CardDescription>Complete your booking payment</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6 p-4 bg-gray-50 rounded">
            <p className="text-sm font-medium">{booking.itinerary_title}</p>
            <p className="text-2xl font-bold text-indigo-600">PKR {Number(booking.total_amount).toFixed(2)}</p>
          </div>

          <form onSubmit={handlePayment} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Cardholder Name</label>
              <input
                type="text"
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={cardData.cardName}
                onChange={(e) => setCardData({ ...cardData, cardName: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Card Number</label>
              <input
                type="text"
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="1234 5678 9012 3456"
                value={cardData.cardNumber}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 16);
                  setCardData({ ...cardData, cardNumber: val });
                }}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Expiry (MM/YY)</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">CVV</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="123"
                  value={cardData.cvv}
                  onChange={(e) => setCardData({ ...cardData, cvv: e.target.value.replace(/\D/g, '').slice(0, 3) })}
                  required
                />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              <CreditCard className="w-4 h-4 mr-2" />
              {loading ? 'Processing...' : 'Pay Now'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Payment;
