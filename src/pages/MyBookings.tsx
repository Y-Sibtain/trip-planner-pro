import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useBooking } from '@/contexts/BookingContext';
import { ArrowLeft, Calendar, MapPin, DollarSign } from 'lucide-react';

const MyBookings = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useBooking();

  if (!isAuthenticated) {
    navigate('/auth');
    return null;
  }

  const currentBookings = [
    {
      id: '1',
      destination: 'Paris, France',
      startDate: '2024-06-15',
      endDate: '2024-06-22',
      amount: 2500,
      status: 'confirmed',
      accommodation: 'Luxury Hotel Paris',
      transport: 'Round-trip Flight',
    },
    {
      id: '2',
      destination: 'Tokyo, Japan',
      startDate: '2024-08-10',
      endDate: '2024-08-20',
      amount: 3200,
      status: 'pending',
      accommodation: 'Tokyo Grand Hotel',
      transport: 'Direct Flight',
    },
  ];

  const pastBookings = [
    {
      id: '3',
      destination: 'New York, USA',
      startDate: '2024-01-05',
      endDate: '2024-01-12',
      amount: 1800,
      status: 'completed',
      accommodation: 'Manhattan Suites',
      transport: 'Round-trip Flight',
    },
  ];

  const BookingCard = ({ booking }: { booking: typeof currentBookings[0] }) => (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" />
              {booking.destination}
            </CardTitle>
            <CardDescription>Booking ID: #{booking.id}</CardDescription>
          </div>
          <Badge
            variant={
              booking.status === 'confirmed'
                ? 'default'
                : booking.status === 'pending'
                ? 'secondary'
                : 'outline'
            }
          >
            {booking.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="w-4 h-4" />
          <span>
            {booking.startDate} to {booking.endDate}
          </span>
        </div>
        <div className="space-y-1 text-sm">
          <p className="text-foreground">
            <strong>Accommodation:</strong> {booking.accommodation}
          </p>
          <p className="text-foreground">
            <strong>Transport:</strong> {booking.transport}
          </p>
        </div>
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-muted-foreground" />
            <span className="font-bold text-foreground">PKR {booking.amount}</span>
          </div>
          <Button size="sm" variant="outline">
            View Details
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Button>

        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground">My Bookings</h1>
          <p className="text-muted-foreground">View and manage your travel bookings</p>
        </div>

        <Tabs defaultValue="current" className="space-y-6">
          <TabsList>
            <TabsTrigger value="current">Current & Upcoming</TabsTrigger>
            <TabsTrigger value="past">Past Bookings</TabsTrigger>
          </TabsList>

          <TabsContent value="current" className="space-y-4">
            {currentBookings.map((booking) => (
              <BookingCard key={booking.id} booking={booking} />
            ))}
          </TabsContent>

          <TabsContent value="past" className="space-y-4">
            {pastBookings.map((booking) => (
              <BookingCard key={booking.id} booking={booking} />
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default MyBookings;
