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

      {/* Features Section */}
      {!tripData && (
        <section className="container mx-auto px-4 pb-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center space-y-3 animate-in fade-in duration-700 delay-500">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <Plane className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground">Smart Planning</h3>
              <p className="text-muted-foreground">
                Intelligent algorithms to optimize your travel itinerary within budget
              </p>
            </div>
            
            <div className="text-center space-y-3 animate-in fade-in duration-700 delay-700">
              <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mx-auto">
                <span className="text-3xl">🏨</span>
              </div>
              <h3 className="text-xl font-semibold text-foreground">Best Accommodations</h3>
              <p className="text-muted-foreground">
                Handpicked hotels and stays that match your preferences and budget
              </p>
            </div>
            
            <div className="text-center space-y-3 animate-in fade-in duration-700 delay-1000">
              <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto">
                <span className="text-3xl">🍴</span>
              </div>
              <h3 className="text-xl font-semibold text-foreground">Local Experiences</h3>
              <p className="text-muted-foreground">
                Discover authentic dining and activities at your destinations
              </p>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default Index;
