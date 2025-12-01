import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import TripPlannerForm, { TripFormData } from "@/components/TripPlannerForm";
import { Plane } from "lucide-react";
import { UserMenu } from "@/components/UserMenu";
import NotificationsMenu from "@/components/NotificationsMenu";
import { useBooking } from "@/contexts/BookingContext";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import analyzeTrip, { generateTripPackage, TripPackage } from "@/lib/aiHelper";
import heroImage from "@/assets/hero-travel.jpg";
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

      setTimeout(() => {
        const plannerSection = document.getElementById("trip-planner");
        if (plannerSection) {
          plannerSection.scrollIntoView({ behavior: "smooth" });
        }
      }, 100);

      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state]);

  const handleSearch = (data: TripFormData) => {
    console.log("Search data with travellers:", { ...data, travellers });
    setTripData({ ...data, travellers });
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
    const booking = {
      itinerary_title: packageResult.destination,
      total_amount: packageResult.totalBudgetPKR,
      plan: {
        destination: packageResult.destination,
        numDays: packageResult.days,
        numPeople: packageResult.travellers,
        flight: packageResult.flights,
        hotel: packageResult.hotel,
        activities: packageResult.itinerary,
      },
      itinerary_data: {
        destination: packageResult.destination,
        numDays: packageResult.days,
        numPeople: packageResult.travellers,
        flight: packageResult.flights,
        hotel: packageResult.hotel,
        budgetBreakdown: packageResult.budgetBreakdown,
      },
    };
    setAiOpen(false);
    navigate('/payment', { state: { booking } });
  };

  return (
    <div className="w-full min-h-screen bg-white">
      {/* Subtle background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-100 rounded-full blur-3xl opacity-20"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-50 rounded-full blur-3xl opacity-10"></div>
      </div>

      {/* Navigation Bar */}
      <nav className="fixed top-0 left-0 right-0 z-50 p-4 md:p-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div></div>
          <div className="flex items-center gap-2 sm:gap-4">
            <NotificationsMenu />
            <UserMenu />
          </div>
        </div>
      </nav>

      {/* Hero Section - Full Screen with Beach Image */}
      <section className="relative w-full min-h-screen flex items-center justify-center overflow-hidden pt-20" style={{
        backgroundImage: `url(${heroImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}>
        {/* Light overlay for readability */}
        <div className="absolute inset-0 bg-black/20"></div>

        {/* Content */}
        <div className="relative z-10 w-full max-w-6xl mx-auto px-4 md:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-1 gap-6 md:gap-8">
            {/* Main Form - Glass Card */}
            <div className="animate-slide-in-up">
              <div className="glass p-6 md:p-8 rounded-lg backdrop-blur-md border border-white/20 shadow-lg bg-white/95">
                <h1 className="text-4xl md:text-5xl font-bold mb-2 text-gray-900">
                  Plan Your<br />Next Adventure
                </h1>
                <p className="text-gray-600 text-lg mb-8">AI-powered travel planning with personalized itineraries, smart budgeting, and instant bookings.</p>
                <TripPlannerForm onSearch={handleSearch} onFormStateChange={setCurrentFormData} onAskAI={askAI} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - Modern Grid */}
      <section className="relative w-full py-20 md:py-32 px-4 md:px-8 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Why Choose Trip Planner?</h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">Everything you need for the perfect journey, powered by cutting-edge AI technology</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="group glass p-6 md:p-8 rounded-lg backdrop-blur-sm border border-gray-200 hover:border-blue-300 transition-all-smooth hover:shadow-lg cursor-pointer">
              <div className="w-14 h-14 rounded-xl bg-blue-100 flex items-center justify-center text-2xl mb-4 group-hover:bg-blue-200 transition-all">
                🏨
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Perfect Stays</h3>
              <p className="text-gray-600">Handpicked accommodations that match your style and budget, from luxury resorts to cozy boutiques.</p>
            </div>

            {/* Feature 2 */}
            <div className="group glass p-6 md:p-8 rounded-lg backdrop-blur-sm border border-gray-200 hover:border-blue-300 transition-all-smooth hover:shadow-lg cursor-pointer">
              <div className="w-14 h-14 rounded-xl bg-blue-100 flex items-center justify-center text-2xl mb-4 group-hover:bg-blue-200 transition-all">
                🍽️
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Local Flavors</h3>
              <p className="text-gray-600">Discover authentic dining experiences and local activities that capture the true essence of each destination.</p>
            </div>

            {/* Feature 3 */}
            <div className="group glass p-6 md:p-8 rounded-lg backdrop-blur-sm border border-gray-200 hover:border-blue-300 transition-all-smooth hover:shadow-lg cursor-pointer">
              <div className="w-14 h-14 rounded-xl bg-blue-100 flex items-center justify-center text-2xl mb-4 group-hover:bg-blue-200 transition-all">
                🗺️
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Day-by-Day Plans</h3>
              <p className="text-gray-600">Detailed itineraries with cost breakdowns, so you can explore confidently and stay within budget.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="relative w-full py-20 md:py-32 px-4 md:px-8 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">How It Works</h2>
            <p className="text-gray-600 text-lg">Three simple steps to your perfect trip</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 relative">
            {/* Step 1 */}
            <div className="relative glass p-8 rounded-lg backdrop-blur-sm border border-gray-200 group hover:shadow-lg transition-all-smooth">
              <div className="absolute -top-6 -left-6 w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-md">
                1
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Tell Us Your Dreams</h3>
              <p className="text-gray-600 mb-4">Select destinations, set your dates, and define your budget. Add as many as 3 destinations to explore.</p>
              <div className="flex gap-2 flex-wrap">
                <span className="text-xs px-3 py-1 rounded-full bg-blue-100 text-blue-700">Destinations</span>
                <span className="text-xs px-3 py-1 rounded-full bg-blue-100 text-blue-700">Budget</span>
                <span className="text-xs px-3 py-1 rounded-full bg-blue-100 text-blue-700">Dates</span>
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative glass p-8 rounded-lg backdrop-blur-sm border border-gray-200 group hover:shadow-lg transition-all-smooth md:mt-8">
              <div className="absolute -top-6 -left-6 w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-md">
                2
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">AI Plans Your Trip</h3>
              <p className="text-gray-600 mb-4">Our AI creates personalized itineraries with flights, hotels, activities, and dining recommendations.</p>
              <div className="flex gap-2 flex-wrap">
                <span className="text-xs px-3 py-1 rounded-full bg-blue-100 text-blue-700">AI Powered</span>
                <span className="text-xs px-3 py-1 rounded-full bg-blue-100 text-blue-700">Personalized</span>
              </div>
            </div>

            {/* Step 3 */}
            <div className="relative glass p-8 rounded-lg backdrop-blur-sm border border-gray-200 group hover:shadow-lg transition-all-smooth">
              <div className="absolute -top-6 -left-6 w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-md">
                3
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Book & Explore</h3>
              <p className="text-gray-600 mb-4">Review your perfect itinerary, save it for later, or book immediately with our secure payment.</p>
              <div className="flex gap-2 flex-wrap">
                <span className="text-xs px-3 py-1 rounded-full bg-blue-100 text-blue-700">Save</span>
                <span className="text-xs px-3 py-1 rounded-full bg-blue-100 text-blue-700">Book</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative w-full py-20 md:py-32 px-4 md:px-8 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <div className="glass p-8 md:p-12 rounded-lg backdrop-blur-sm border border-gray-200 text-center shadow-md">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Ready to Plan Your Next Adventure?</h2>
            <p className="text-gray-600 mb-8 text-lg">Join thousands of travelers already planning smarter trips with AI</p>
            <Button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold px-8 py-6 rounded-lg text-lg hover:shadow-lg transition-all-smooth">
              Start Planning Now ✈️
            </Button>
          </div>
        </div>
      </section>

      {/* AI Dialog */}
      <Dialog open={aiOpen} onOpenChange={setAiOpen}>
        <DialogContent className="max-h-screen overflow-y-auto max-w-2xl glass border-gray-200 shadow-lg">
          <DialogHeader>
            <DialogTitle className="text-2xl text-gray-900">Your Perfect Trip Package ✈️</DialogTitle>
            <DialogDescription className="text-gray-600">AI-generated itinerary tailored to your preferences and budget</DialogDescription>
          </DialogHeader>

          {packageResult ? (
            <div className="space-y-4 mt-4">
              <div className="p-4 rounded-lg border border-gray-300 bg-blue-50">
                <div className="font-bold text-xl text-blue-900 mb-2">📍 {packageResult.destination}</div>
                <div className="text-sm space-y-2 text-gray-700">
                  <div>📅 Duration: <strong className="text-blue-600">{packageResult.days} days</strong> | 👥 Travelers: <strong className="text-blue-600">{packageResult.travellers}</strong></div>
                  <div>💰 Total Budget: <strong className="text-blue-600">₨{packageResult.totalBudgetPKR.toLocaleString()}</strong></div>
                </div>
              </div>

              <div className="p-4 rounded-lg border border-gray-300 bg-gray-50">
                <div className="font-bold text-gray-900 mb-2">✈️ Flight</div>
                <div className="text-sm space-y-1 text-gray-700">
                  <div>Airline: <span className="text-blue-600">{packageResult.flights.airline}</span></div>
                  <div>Route: {packageResult.flights.departure} → {packageResult.flights.arrival}</div>
                  <div>Price: <strong className="text-blue-600">₨{packageResult.flights.pricePerPersonPKR.toLocaleString()}</strong> per person</div>
                </div>
              </div>

              <div className="p-4 rounded-lg border border-gray-300 bg-gray-50">
                <div className="font-bold text-gray-900 mb-2">🏨 Accommodation</div>
                <div className="text-sm space-y-1 text-gray-700">
                  <div>Hotel: <span className="text-blue-600">{packageResult.hotel.name}</span> ({packageResult.hotel.stars} ⭐)</div>
                  <div>Rate: <strong className="text-blue-600">₨{packageResult.hotel.pricePerNightPKR.toLocaleString()}</strong> per night</div>
                  <div>Total Stay: <strong>₨{packageResult.hotel.totalStayPKR.toLocaleString()}</strong></div>
                </div>
              </div>

              <div className="p-4 rounded-lg border border-gray-300 bg-blue-50">
                <div className="font-bold text-gray-900 mb-3">💵 Budget Breakdown</div>
                <div className="text-sm space-y-2 text-gray-700">
                  <div className="flex justify-between">
                    <span>Flights:</span>
                    <strong className="text-blue-600">₨{packageResult.budgetBreakdown.flights.toLocaleString()}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Accommodation:</span>
                    <strong className="text-blue-600">₨{packageResult.budgetBreakdown.accommodation.toLocaleString()}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Meals:</span>
                    <strong className="text-blue-600">₨{packageResult.budgetBreakdown.meals.toLocaleString()}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Activities:</span>
                    <strong className="text-blue-600">₨{packageResult.budgetBreakdown.activities.toLocaleString()}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Transport:</span>
                    <strong className="text-blue-600">₨{packageResult.budgetBreakdown.transport.toLocaleString()}</strong>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-gray-300">
                    <span>Contingency:</span>
                    <strong className="text-blue-600">₨{packageResult.budgetBreakdown.contingency.toLocaleString()}</strong>
                  </div>
                  <div className="flex justify-between font-bold pt-2 border-t border-gray-300 text-lg text-blue-600">
                    <span>Total:</span>
                    <span>₨{packageResult.budgetBreakdown.total.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-lg border border-gray-300 bg-gray-50">
                <div className="font-bold text-gray-900 mb-3">📅 Day-by-Day Itinerary</div>
                <div className="text-sm space-y-2 text-gray-700">
                  {packageResult.itinerary.slice(0, 3).map((day) => (
                    <div key={day.day} className="flex justify-between">
                      <span>Day {day.day}: <strong>{day.activity}</strong></span>
                      {day.estimatedCostPKR > 0 && <strong className="text-blue-600">₨{day.estimatedCostPKR.toLocaleString()}</strong>}
                    </div>
                  ))}
                  {packageResult.itinerary.length > 3 && (
                    <div className="text-xs italic text-gray-600 pt-2">+ {packageResult.itinerary.length - 3} more days</div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setAiOpen(false)} className="border-gray-300 text-gray-700 hover:bg-gray-100">
                  Decline
                </Button>
                <Button onClick={bookAllPackage} className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold hover:shadow-lg transition-all-smooth">
                  Book All 🎉
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-sm text-gray-600 py-8 text-center">No package available.</div>
          )}
        </DialogContent>
      </Dialog>

      {/* Footer */}
      <footer className="relative w-full border-t border-gray-200 bg-white py-12 md:py-16 px-4 md:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-md flex items-center justify-center text-white font-bold">
                  ✈
                </div>
                <span className="font-bold text-lg text-blue-600">Trip Planner</span>
              </div>
              <p className="text-sm text-gray-600">AI-powered travel planning for the modern explorer.</p>
            </div>

            <div>
              <h4 className="font-bold text-gray-900 mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><span className="text-gray-600 hover:text-blue-600 cursor-pointer transition-all" onClick={() => navigate('/city-planner')}>Itineraries</span></li>
                <li><span className="text-gray-600 hover:text-blue-600 cursor-pointer transition-all" onClick={() => navigate('/destinations')}>Destinations</span></li>
                <li><span className="text-gray-600 hover:text-blue-600 cursor-pointer transition-all" onClick={() => navigate('/saved-itineraries')}>Saved Plans</span></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-gray-900 mb-4">Support</h4>
              <ul className="space-y-2 text-sm">
                <li><span className="text-gray-600 hover:text-blue-600 cursor-pointer transition-all">Help & FAQs</span></li>
                <li><span className="text-gray-600 hover:text-blue-600 cursor-pointer transition-all">Contact</span></li>
                <li><span className="text-gray-600 hover:text-blue-600 cursor-pointer transition-all">Status</span></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-gray-900 mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><span className="text-gray-600 hover:text-blue-600 cursor-pointer transition-all">Privacy</span></li>
                <li><span className="text-gray-600 hover:text-blue-600 cursor-pointer transition-all">Terms</span></li>
                <li><span className="text-gray-600 hover:text-blue-600 cursor-pointer transition-all">Cookie Policy</span></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-600">
              <p>© {new Date().getFullYear()} Trip Planner. All rights reserved.</p>
              <div className="flex gap-6">
                <span className="hover:text-blue-600 cursor-pointer transition-all">Twitter</span>
                <span className="hover:text-blue-600 cursor-pointer transition-all">Instagram</span>
                <span className="hover:text-blue-600 cursor-pointer transition-all">LinkedIn</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
