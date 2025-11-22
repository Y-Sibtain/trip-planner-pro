import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useBooking } from '@/contexts/BookingContext';
import { ArrowLeft, MapPin, Calendar, Heart, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

const SavedItineraries = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useBooking();
  const { toast } = useToast();
  const [savedTrips, setSavedTrips] = useState([
    {
      id: '1',
      source: 'New York',
      destinations: ['Paris', 'Rome', 'Barcelona'],
      startDate: '2024-07-01',
      endDate: '2024-07-15',
      budget: 3500,
      savedDate: '2024-05-10',
    },
    {
      id: '2',
      source: 'London',
      destinations: ['Tokyo', 'Kyoto'],
      startDate: '2024-09-15',
      endDate: '2024-09-25',
      budget: 4000,
      savedDate: '2024-05-12',
    },
    {
      id: '3',
      source: 'Los Angeles',
      destinations: ['Bali', 'Singapore'],
      startDate: '2024-12-01',
      endDate: '2024-12-10',
      budget: 2800,
      savedDate: '2024-05-15',
    },
  ]);

  if (!isAuthenticated) {
    navigate('/auth');
    return null;
  }

  const handleRemove = (id: string) => {
    setSavedTrips(savedTrips.filter((trip) => trip.id !== id));
    toast({
      title: "Itinerary removed",
      description: "The itinerary has been removed from your saved list.",
    });
  };

  const handlePlanTrip = (trip: typeof savedTrips[0]) => {
    toast({
      title: "Loading itinerary",
      description: "Redirecting you to plan this trip...",
    });
    navigate('/');
  };

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
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Heart className="w-8 h-8 text-primary" />
            Saved Itineraries
          </h1>
          <p className="text-muted-foreground">Your favorite travel plans for future adventures</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {savedTrips.map((trip) => (
            <Card key={trip.id} className="hover:shadow-card-hover transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-primary" />
                    {trip.destinations.join(' • ')}
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemove(trip.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                <CardDescription>From {trip.source}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <span>
                      {trip.startDate} to {trip.endDate}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Budget:</span>
                    <span className="font-bold text-foreground">${trip.budget}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Saved on {trip.savedDate}
                  </div>
                </div>
                <Button
                  onClick={() => handlePlanTrip(trip)}
                  className="w-full"
                  variant="secondary"
                >
                  Plan This Trip
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {savedTrips.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <Heart className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold text-foreground mb-2">
                No saved itineraries yet
              </h3>
              <p className="text-muted-foreground mb-4">
                Start planning your dream trips and save them here for later
              </p>
              <Button onClick={() => navigate('/')}>
                Explore Destinations
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default SavedItineraries;
