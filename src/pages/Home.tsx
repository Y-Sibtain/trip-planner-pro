import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useBooking } from '@/contexts/BookingContext';
import { MapPin, Calendar, DollarSign } from 'lucide-react';

export default function Home() {
  const navigate = useNavigate();
  const { isAuthenticated } = useBooking();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold text-gray-900 mb-4">
            Plan Your Perfect Trip
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Discover amazing destinations, create custom itineraries, and save your favorite trips
          </p>
          {!isAuthenticated && (
            <Button size="lg" onClick={() => navigate('/auth')}>
              Start Planning Now
            </Button>
          )}
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mb-20">
          <Card className="hover:shadow-lg transition">
            <CardHeader>
              <MapPin className="w-8 h-8 text-indigo-600 mb-2" />
              <CardTitle>Explore Destinations</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Browse hundreds of curated destinations from around the world
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition">
            <CardHeader>
              <Calendar className="w-8 h-8 text-indigo-600 mb-2" />
              <CardTitle>Create Itineraries</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Build custom day-by-day itineraries tailored to your preferences
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition">
            <CardHeader>
              <DollarSign className="w-8 h-8 text-indigo-600 mb-2" />
              <CardTitle>Budget Planning</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Track costs and plan your trip within your budget constraints
              </p>
            </CardContent>
          </Card>
        </div>

        {/* CTA Section */}
        {isAuthenticated && (
          <section className="bg-indigo-600 rounded-lg p-12 text-white text-center">
            <h3 className="text-3xl font-bold mb-4">Ready to explore?</h3>
            <p className="text-lg mb-6">
              Start building your next adventure with Trip Planner Pro
            </p>
            <Button 
              size="lg" 
              className="bg-white text-indigo-600 hover:bg-gray-100"
              onClick={() => navigate('/profile')}
            >
              View Your Profile
            </Button>
          </section>
        )}
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-400">
          <p>&copy; 2025 Trip Planner Pro. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}