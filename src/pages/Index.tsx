import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import TripPlannerForm, { TripFormData } from "@/components/TripPlannerForm";
import { Plane } from "lucide-react";
import { UserMenu } from "@/components/UserMenu";
import NotificationsMenu from "@/components/NotificationsMenu";
import heroImage from "@/assets/hero-travel.jpg";
import { useBooking } from "@/contexts/BookingContext";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import analyzeTrip, { generateTripPackage, TripPackage } from "@/lib/aiHelper";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

const Index = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { tripData, setTripData } = useBooking();
  const [travellers, setTravellers] = useState('');
  const { toast } = useToast();
  const [aiOpen, setAiOpen] = useState(false);
  const [packageResult, setPackageResult] = useState<TripPackage | null>(null);
  const [currentFormData, setCurrentFormData] = useState<TripFormData | null>(null);

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

      // Scroll to planner section
      setTimeout(() => {
        const plannerSection = document.getElementById("trip-planner");
        if (plannerSection) {
          plannerSection.scrollIntoView({ behavior: "smooth" });
        }
      }, 100);

      // clear history state to avoid repeated prefill
      navigate(location.pathname, { replace: true, state: {} });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state]);

  const handleSearch = (data: TripFormData) => {
    console.log("Search data with travellers:", { ...data, travellers });
    setTripData({ ...data, travellers });
    // Navigate to city planner page
    navigate('/city-planner', { state: { tripData: { ...data, travellers } } });
  };

  const askAI = () => {
    if (!currentFormData) {
      toast({ title: "No trip data", description: "Please fill the planner form on this page first.", variant: "destructive" });
      return;
    }
    const pkg = generateTripPackage(currentFormData as any);
    setPackageResult(pkg);
    setAiOpen(true);
  };

  const bookAllPackage = () => {
    if (!packageResult) return;
    // Store the package in booking context and navigate to payment
    const newTripData = {
      ...(tripData || {}),
      destinations: packageResult.destination ? [packageResult.destination] : [],
      travellers: String(packageResult.travellers),
      selectedFlight: packageResult.flights,
      selectedHotel: packageResult.hotel,
      itinerary: packageResult.itinerary,
      budgetBreakdown: packageResult.budgetBreakdown,
    };
    setTripData?.(newTripData as any);
    setAiOpen(false);
    // Navigate to payment page with the full package
    navigate('/payment', { state: { tripData: newTripData } });
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
              <TripPlannerForm onSearch={handleSearch} onFormStateChange={setCurrentFormData} onAskAI={askAI} />
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
                  <li>Provide your budget to get customised results that suits you</li>
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
        {/* Removed TripResults - users now see results on city-planner page */}
      </div>

      {/* AI Recommendation Dialog */}
      <Dialog open={aiOpen} onOpenChange={setAiOpen}>
        <DialogContent className="max-h-screen overflow-y-auto max-w-2xl">
          <DialogHeader>
            <DialogTitle>Your Perfect Trip Package ✈️</DialogTitle>
            <DialogDescription>Complete itinerary within your budget</DialogDescription>
          </DialogHeader>

          {packageResult ? (
            <div className="space-y-4 mt-4">
              {/* Package Overview */}
              <div className="bg-muted p-4 rounded-lg">
                <div className="font-semibold text-lg mb-2">📍 {packageResult.destination}</div>
                <div className="text-sm space-y-1">
                  <div>📅 Duration: <strong>{packageResult.days} days</strong> | 👥 Travellers: <strong>{packageResult.travellers}</strong></div>
                  <div>💰 Total Budget: <strong>₨{packageResult.totalBudgetPKR.toLocaleString()}</strong></div>
                </div>
              </div>

              {/* Flight Recommendation */}
              <div className="border rounded-lg p-3">
                <div className="font-semibold mb-2">✈️ Flight</div>
                <div className="text-sm space-y-1 text-muted-foreground">
                  <div>Airline: {packageResult.flights.airline}</div>
                  <div>Route: {packageResult.flights.departure} → {packageResult.flights.arrival}</div>
                  <div>Price: ₨{packageResult.flights.pricePerPersonPKR.toLocaleString()} per person</div>
                </div>
              </div>

              {/* Hotel Recommendation */}
              <div className="border rounded-lg p-3">
                <div className="font-semibold mb-2">🏨 Accommodation</div>
                <div className="text-sm space-y-1 text-muted-foreground">
                  <div>Hotel: {packageResult.hotel.name} ({packageResult.hotel.stars} ⭐)</div>
                  <div>Rate: ₨{packageResult.hotel.pricePerNightPKR.toLocaleString()} per night</div>
                  <div>Total Stay: ₨{packageResult.hotel.totalStayPKR.toLocaleString()}</div>
                </div>
              </div>

              {/* Budget Breakdown */}
              <div className="border rounded-lg p-3">
                <div className="font-semibold mb-2">💵 Budget Breakdown</div>
                <div className="text-sm space-y-1 text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Flights:</span>
                    <strong>₨{packageResult.budgetBreakdown.flights.toLocaleString()}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Accommodation:</span>
                    <strong>₨{packageResult.budgetBreakdown.accommodation.toLocaleString()}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Meals:</span>
                    <strong>₨{packageResult.budgetBreakdown.meals.toLocaleString()}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Activities:</span>
                    <strong>₨{packageResult.budgetBreakdown.activities.toLocaleString()}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Transport:</span>
                    <strong>₨{packageResult.budgetBreakdown.transport.toLocaleString()}</strong>
                  </div>
                  <div className="flex justify-between pt-2 border-t">
                    <span>Contingency:</span>
                    <strong>₨{packageResult.budgetBreakdown.contingency.toLocaleString()}</strong>
                  </div>
                  <div className="flex justify-between font-semibold pt-2 border-t">
                    <span>Total:</span>
                    <strong>₨{packageResult.budgetBreakdown.total.toLocaleString()}</strong>
                  </div>
                </div>
              </div>

              {/* Affordability Notes / Alternatives */}
              {packageResult.affordabilityNotes && packageResult.affordabilityNotes.length > 0 && (
                <div className="border rounded-lg p-3 bg-yellow-50">
                  <div className="font-semibold mb-2">⚠️ Budget Notes</div>
                  <div className="text-sm space-y-1 text-muted-foreground">
                    {packageResult.affordabilityNotes.map((n, idx) => (
                      <div key={idx}>{n}</div>
                    ))}
                    {packageResult.alternatives && packageResult.alternatives.length > 0 && (
                      <div className="mt-2">
                        <div className="font-medium">Options within your budget:</div>
                        <ul className="list-disc ml-5 text-sm text-muted-foreground">
                          {packageResult.alternatives.map((a, i) => (
                            <li key={i}>{a}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Itinerary Preview */}
              <div className="border rounded-lg p-3">
                <div className="font-semibold mb-2">📅 Day-by-Day Itinerary</div>
                <div className="text-sm space-y-1 text-muted-foreground">
                  {packageResult.itinerary.slice(0, 3).map((day) => (
                    <div key={day.day} className="flex justify-between">
                      <span>Day {day.day}: {day.activity}</span>
                      {day.estimatedCostPKR > 0 && <strong>₨{day.estimatedCostPKR.toLocaleString()}</strong>}
                    </div>
                  ))}
                  {packageResult.itinerary.length > 3 && (
                    <div className="text-xs italic">+ {packageResult.itinerary.length - 3} more days</div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setAiOpen(false)}>
                  Decline
                </Button>
                <Button onClick={bookAllPackage} className="bg-primary">
                  Book All 🎉
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">No package available.</div>
          )}
        </DialogContent>
      </Dialog>

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
                <li 
                  className="cursor-pointer hover:text-primary transition"
                  onClick={() => navigate('/city-planner')}
                >
                  Itineraries
                </li>
                <li 
                  className="cursor-pointer hover:text-primary transition"
                  onClick={() => navigate('/destinations')}
                >
                  Destinations
                </li>
                <li 
                  className="cursor-pointer hover:text-primary transition"
                  onClick={() => navigate('/saved-itineraries')}
                >
                  Saved Plans
                </li>
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