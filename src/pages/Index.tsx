import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import TripPlannerForm, { TripFormData } from "@/components/TripPlannerForm";
import TripResults from "@/components/TripResults";
import { Plane } from "lucide-react";
import { UserMenu } from "@/components/UserMenu";
import NotificationsMenu from "@/components/NotificationsMenu";
import heroImage from "@/assets/hero-travel.jpg";
import { useBooking } from "@/contexts/BookingContext";

const Index = () => {
  const { tripData, setTripData } = useBooking();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Support prefill via navigation state (e.g., from Destinations page)
    const state: any = location.state as any;
    if (state?.prefill) {
      const p = state.prefill as Partial<TripFormData>;
      setTripData({
        source: p.source || "",
        destinations: p.destinations || [],
        budget: p.budget || "",
        startDate: p.startDate || "",
        endDate: p.endDate || "",
      });
      // clear history state to avoid repeated prefill
      navigate(location.pathname, { replace: true, state: {} });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = (data: TripFormData) => {
    setTripData(data);
    // Scroll to results
    setTimeout(() => {
      document.getElementById("results")?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Bar */}
      <nav className="absolute top-0 left-0 right-0 z-50 p-4">
        <div className="max-w-7xl mx-auto flex justify-end items-center gap-2">
          <NotificationsMenu />
          <UserMenu />
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative">
        <div className="h-96 bg-cover bg-center" style={{ backgroundImage: `url(${heroImage})` }} />
        <div className="max-w-7xl mx-auto -mt-32 px-4">
          <div className="bg-background/80 backdrop-blur rounded-lg p-6 shadow-lg grid md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <h1 className="text-3xl font-bold mb-2">Plan your next adventure</h1>
              <p className="text-muted-foreground mb-4">Get personalized itineraries, budgets, and recommendations.</p>
              <TripPlannerForm onSearch={handleSearch} />
            </div>

            <div className="hidden md:block">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-primary-foreground/10 rounded-full flex items-center justify-center text-2xl">✈️</div>
                <div>
                  <div className="font-semibold">Why use Trip Planner</div>
                  <div className="text-sm text-muted-foreground">Tailored itineraries, cost estimates and easy saves.</div>
                </div>
              </div>

              <div className="border rounded p-4">
                <h4 className="font-medium">Quick tips</h4>
                <ul className="list-disc ml-5 text-sm text-muted-foreground mt-2">
                  <li>Select up to 3 destinations</li>
                  <li>Provide realistic budget to get better results</li>
                  <li>Save itineraries to access them later</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-4 mt-8">
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-card p-6 rounded-lg shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-primary-foreground/10 flex items-center justify-center">🏨</div>
              <div className="font-semibold">Best Accommodations</div>
            </div>
            <p className="text-sm text-muted-foreground">Handpicked hotels and stays that match your preferences and budget.</p>
          </div>

          <div className="bg-card p-6 rounded-lg shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-primary-foreground/10 flex items-center justify-center">🍴</div>
              <div className="font-semibold">Local Experiences</div>
            </div>
            <p className="text-sm text-muted-foreground">Discover authentic dining and activities at your destinations.</p>
          </div>

          <div className="bg-card p-6 rounded-lg shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-primary-foreground/10 flex items-center justify-center">🗺️</div>
              <div className="font-semibold">Smart Itineraries</div>
            </div>
            <p className="text-sm text-muted-foreground">Day-by-day plans with estimated costs so you can plan with confidence.</p>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-7xl mx-auto px-4 mt-10">
        <div className="bg-background rounded-lg p-6">
          <h2 className="text-2xl font-semibold mb-4">How it works</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="p-4">
              <div className="font-semibold mb-2">1. Tell us where you want to go</div>
              <div className="text-sm text-muted-foreground">Pick up to three destinations, dates and budget.</div>
            </div>
            <div className="p-4">
              <div className="font-semibold mb-2">2. Get a tailored itinerary</div>
              <div className="text-sm text-muted-foreground">We generate day-by-day plans with cost estimates.</div>
            </div>
            <div className="p-4">
              <div className="font-semibold mb-2">3. Save, edit, and book</div>
              <div className="text-sm text-muted-foreground">Save itineraries to your account and fine-tune costs and activities.</div>
            </div>
          </div>
        </div>
      </section>

      {/* Results */}
      <div id="results" className="mt-8 max-w-7xl mx-auto p-4">
        <TripResults tripData={tripData ?? null} />
      </div>

      {/* Footer */}
      <footer className="mt-12 border-t bg-background">
        <div className="max-w-7xl mx-auto px-4 py-8 flex flex-col md:flex-row justify-between items-start gap-6">
          <div>
            <div className="font-bold text-lg">Trip Planner</div>
            <div className="text-sm text-muted-foreground mt-2">Plan better trips with smart suggestions and simple budgeting tools.</div>
            <div className="text-sm text-muted-foreground mt-4">© {new Date().getFullYear()} Trip Planner</div>
          </div>

          <div className="flex gap-6">
            <div>
              <div className="font-semibold">Product</div>
              <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                <li>Itineraries</li>
                <li>Destinations</li>
                <li>Saved Plans</li>
              </ul>
            </div>

            <div>
              <div className="font-semibold">Support</div>
              <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                <li>Help & FAQs</li>
                <li>Contact</li>
                <li>Privacy</li>
              </ul>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;