import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import TripPlannerForm, { TripFormData } from "@/components/TripPlannerForm";
import TripResults from "@/components/TripResults";
import { Plane, LogIn, LogOut } from "lucide-react";
import { useBooking } from "@/contexts/BookingContext";
import heroImage from "@/assets/hero-travel.jpg";

const Index = () => {
  const [tripData, setTripData] = useState<TripFormData | null>(null);
  const { isAuthenticated, setIsAuthenticated } = useBooking();
  const navigate = useNavigate();

  const handleSearch = (data: TripFormData) => {
    setTripData(data);
    // Scroll to results
    setTimeout(() => {
      document.getElementById("results")?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const handleAuthAction = () => {
    if (isAuthenticated) {
      setIsAuthenticated(false);
    } else {
      navigate('/auth');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Bar */}
      <nav className="absolute top-0 left-0 right-0 z-50 p-4">
        <div className="max-w-7xl mx-auto flex justify-end">
          <Button
            variant="outline"
            onClick={handleAuthAction}
            className="bg-background/80 backdrop-blur-sm"
          >
            {isAuthenticated ? (
              <>
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4 mr-2" />
                Sign In
              </>
            )}
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-[60vh] flex items-center justify-center overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center z-0"
          style={{ backgroundImage: `url(${heroImage})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-background" />
        </div>
        
        <div className="container mx-auto px-4 relative z-10 text-center">
          <div className="flex items-center justify-center mb-6 animate-in fade-in slide-in-from-top duration-700">
            <Plane className="h-12 w-12 text-primary-foreground mr-3" />
            <h1 className="text-5xl md:text-6xl font-bold text-primary-foreground">
              TripPlanner
            </h1>
          </div>
          <p className="text-xl md:text-2xl text-primary-foreground/90 max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom duration-700 delay-150">
            Plan your perfect adventure with personalized itineraries that fit your budget
          </p>
        </div>
      </section>

      {/* Trip Planner Form */}
      <section className="container mx-auto px-4 -mt-16 relative z-20 mb-16">
        <div className="max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom duration-700 delay-300">
          <TripPlannerForm onSearch={handleSearch} />
        </div>
      </section>

      {/* Results Section */}
      {tripData && (
        <section id="results" className="container mx-auto px-4 pb-16">
          <TripResults tripData={tripData} />
        </section>
      )}

      {/* Popular Destinations Section */}
      {!tripData && (
        <>
          <section className="container mx-auto px-4 pb-16">
            <h2 className="text-3xl font-bold text-center mb-12 text-foreground">Popular Destinations</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {[
                { name: 'Paris, France', emoji: '🗼', desc: 'City of lights and romance' },
                { name: 'Tokyo, Japan', emoji: '🗾', desc: 'Blend of tradition and modernity' },
                { name: 'New York, USA', emoji: '🗽', desc: 'The city that never sleeps' },
                { name: 'Bali, Indonesia', emoji: '🏝️', desc: 'Tropical paradise' },
                { name: 'Dubai, UAE', emoji: '🏙️', desc: 'Luxury and innovation' },
                { name: 'Rome, Italy', emoji: '🏛️', desc: 'Ancient history and culture' },
              ].map((dest, idx) => (
                <div key={idx} className="bg-card border border-border rounded-lg p-6 hover:shadow-card-hover transition-shadow cursor-pointer">
                  <div className="text-4xl mb-3">{dest.emoji}</div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">{dest.name}</h3>
                  <p className="text-muted-foreground text-sm">{dest.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Featured Packages Section */}
          <section className="bg-muted/30 py-16">
            <div className="container mx-auto px-4">
              <h2 className="text-3xl font-bold text-center mb-12 text-foreground">Featured Packages</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                {[
                  {
                    title: 'European Explorer',
                    destinations: 'Paris • Rome • Barcelona',
                    duration: '10 Days',
                    price: '$2,500',
                    includes: 'Flights, Hotels, Guided Tours',
                  },
                  {
                    title: 'Asian Adventure',
                    destinations: 'Tokyo • Bangkok • Singapore',
                    duration: '14 Days',
                    price: '$3,200',
                    includes: 'Flights, Hotels, Local Transport',
                  },
                  {
                    title: 'Beach Getaway',
                    destinations: 'Maldives • Bali',
                    duration: '7 Days',
                    price: '$1,800',
                    includes: 'Flights, Resorts, Activities',
                  },
                  {
                    title: 'Cultural Journey',
                    destinations: 'Delhi • Jaipur • Agra',
                    duration: '8 Days',
                    price: '$1,500',
                    includes: 'Flights, Hotels, Heritage Tours',
                  },
                ].map((pkg, idx) => (
                  <div key={idx} className="bg-card border border-border rounded-lg p-6 hover:shadow-card-hover transition-shadow">
                    <h3 className="text-2xl font-bold text-foreground mb-2">{pkg.title}</h3>
                    <p className="text-primary font-medium mb-4">{pkg.destinations}</p>
                    <div className="space-y-2 text-sm text-muted-foreground mb-4">
                      <p>⏱️ {pkg.duration}</p>
                      <p>✅ {pkg.includes}</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-foreground">{pkg.price}</span>
                      <span className="text-xs text-muted-foreground">per person</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Sample Itineraries Section */}
          <section className="container mx-auto px-4 py-16">
            <h2 className="text-3xl font-bold text-center mb-12 text-foreground">Sample Itineraries</h2>
            <div className="max-w-4xl mx-auto space-y-8">
              {[
                {
                  destination: 'Paris Weekend',
                  days: [
                    { day: 'Day 1', activities: 'Eiffel Tower, Seine River Cruise, Champs-Élysées' },
                    { day: 'Day 2', activities: 'Louvre Museum, Notre-Dame, Montmartre' },
                    { day: 'Day 3', activities: 'Versailles Palace, Shopping, Farewell Dinner' },
                  ],
                },
                {
                  destination: 'Tokyo Experience',
                  days: [
                    { day: 'Day 1', activities: 'Shibuya Crossing, Harajuku, Tokyo Tower' },
                    { day: 'Day 2', activities: 'Senso-ji Temple, Akihabara, Tsukiji Market' },
                    { day: 'Day 3', activities: 'Mount Fuji Day Trip, Hot Springs' },
                  ],
                },
              ].map((itinerary, idx) => (
                <div key={idx} className="bg-card border border-border rounded-lg p-6">
                  <h3 className="text-xl font-bold text-foreground mb-4">{itinerary.destination}</h3>
                  <div className="space-y-3">
                    {itinerary.days.map((day, dayIdx) => (
                      <div key={dayIdx} className="flex gap-4">
                        <div className="font-semibold text-primary min-w-[60px]">{day.day}</div>
                        <div className="text-muted-foreground">{day.activities}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* What We Offer Section */}
          <section className="bg-gradient-hero py-16">
            <div className="container mx-auto px-4">
              <h2 className="text-3xl font-bold text-center mb-12 text-primary-foreground">What We Offer</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                <div className="text-center space-y-3">
                  <div className="w-16 h-16 bg-primary-foreground/10 rounded-full flex items-center justify-center mx-auto">
                    <Plane className="h-8 w-8 text-primary-foreground" />
                  </div>
                  <h3 className="text-xl font-semibold text-primary-foreground">Smart Planning</h3>
                  <p className="text-primary-foreground/90">
                    Intelligent algorithms to optimize your travel itinerary within budget
                  </p>
                </div>
                
                <div className="text-center space-y-3">
                  <div className="w-16 h-16 bg-primary-foreground/10 rounded-full flex items-center justify-center mx-auto">
                    <span className="text-3xl">🏨</span>
                  </div>
                  <h3 className="text-xl font-semibold text-primary-foreground">Best Accommodations</h3>
                  <p className="text-primary-foreground/90">
                    Handpicked hotels and stays that match your preferences and budget
                  </p>
                </div>
                
                <div className="text-center space-y-3">
                  <div className="w-16 h-16 bg-primary-foreground/10 rounded-full flex items-center justify-center mx-auto">
                    <span className="text-3xl">🍴</span>
                  </div>
                  <h3 className="text-xl font-semibold text-primary-foreground">Local Experiences</h3>
                  <p className="text-primary-foreground/90">
                    Discover authentic dining and activities at your destinations
                  </p>
                </div>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
};

export default Index;
