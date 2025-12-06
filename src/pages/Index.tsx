import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import TripPlannerForm, { TripFormData } from "@/components/TripPlannerForm";
import { Plane, Hotel, Utensils, Map, MapPin, Calendar, Users, DollarSign, Sparkles, Star } from "lucide-react";
import { UserMenu } from "@/components/UserMenu";
import { useBooking } from "@/contexts/BookingContext";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from '@/contexts/LanguageContext';
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
  const { tripData, setTripData, isAuthenticated } = useBooking();
  const [travellers, setTravellers] = useState('');
  const { toast } = useToast();
  const [aiOpen, setAiOpen] = useState(false);
  const [packageResults, setPackageResults] = useState<TripPackage[] | null>(null);
  const [currentFormData, setCurrentFormData] = useState<TripFormData | null>(null);
  const { t } = useLanguage();

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
    console.log("[DEBUG] Index.handleSearch - Search data with travellers:", data);
    setTripData(data);
    navigate('/city-planner', { state: { tripData: data } });
  };

  const askAI = () => {
    if (!currentFormData) {
      toast({ title: "No trip data", description: "Please fill the planner form on this page first.", variant: "destructive" });
      return;
    }

    // Validate required fields
    if (!currentFormData.source || !currentFormData.source.trim()) {
      toast({ title: "Missing source", description: "Please enter a source city or airport.", variant: "destructive" });
      return;
    }

    const dests = Array.isArray(currentFormData.destinations) ? currentFormData.destinations : [];
    if (dests.length === 0) {
      toast({ title: "No destinations", description: "Please add at least one destination.", variant: "destructive" });
      return;
    }

    // Validate dates for destination 1
    if (!currentFormData.startDate || !currentFormData.endDate) {
      toast({ title: "Missing dates", description: "Please enter start and end dates for Destination 1.", variant: "destructive" });
      return;
    }

    // Validate dates for destination 2 if it exists
    if (dests.length > 1 && currentFormData.destination2) {
      if (!currentFormData.startDate2 || !currentFormData.endDate2) {
        toast({ title: "Missing dates", description: "Please enter start and end dates for Destination 2.", variant: "destructive" });
        return;
      }
    }

    // Validate dates for destination 3 if it exists
    if (dests.length > 2 && currentFormData.destination3) {
      if (!currentFormData.startDate3 || !currentFormData.endDate3) {
        toast({ title: "Missing dates", description: "Please enter start and end dates for Destination 3.", variant: "destructive" });
        return;
      }
    }

    // Validate travelers
    if (!currentFormData.travellers || !currentFormData.travellers.toString().trim()) {
      toast({ title: "Missing travelers", description: "Please enter the number of travelers.", variant: "destructive" });
      return;
    }

    const pkgs: TripPackage[] = dests.map((d, idx) => {
      const tripDataForDest: any = { ...currentFormData };
      tripDataForDest.destinations = [d];
      if (idx === 0) {
        tripDataForDest.startDate = currentFormData.startDate;
        tripDataForDest.endDate = currentFormData.endDate;
      } else if (idx === 1) {
        tripDataForDest.startDate = currentFormData.startDate2 || currentFormData.endDate;
        tripDataForDest.endDate = currentFormData.endDate2;
      } else if (idx === 2) {
        tripDataForDest.startDate = currentFormData.startDate3 || currentFormData.endDate2;
        tripDataForDest.endDate = currentFormData.endDate3;
      }
      return generateTripPackage(tripDataForDest as any);
    });

    setPackageResults(pkgs);
    setAiOpen(true);
  };

  const bookAllPackage = () => {
    if (!packageResults || packageResults.length === 0) return;

    // Check if user is authenticated
    if (!isAuthenticated) {
      // Store current page for redirect after auth
      sessionStorage.setItem('authReturnUrl', '/');
      toast({
        title: 'Authentication Required',
        description: 'Sign in or sign up to proceed with booking',
        variant: 'destructive'
      });
      navigate('/auth', { state: { bookingData: true } });
      return;
    }

    let totalAmount = 0;
    let totalDays = 0;
    const itineraryByDest: any = { flights: {}, hotels: {}, days: {}, itineraries: {} };
    packageResults.forEach((p) => {
      totalAmount += (p.budgetBreakdown?.total || 0);
      totalDays += (p.days || 0);
      const dest = p.destination || `Destination`;
      itineraryByDest.flights[dest] = p.flights || null;
      itineraryByDest.hotels[dest] = p.hotel || null;
      itineraryByDest.days[dest] = p.days || 0;
      itineraryByDest.itineraries[dest] = p.itinerary || [];
    });

    const booking = {
      itinerary_title: packageResults.map(p => p.destination).join(' > '),
      total_amount: totalAmount,
      plan: {
        numPeople: packageResults[0]?.travellers || 1,
        numDays: totalDays,
        itineraryByDest,
      },
      itinerary_data: {
        itineraryByDest,
        budgetBreakdown: { total: totalAmount },
      },
    };

    setAiOpen(false);
    // Navigate to city-planner with booking data to go through traveller form first
    navigate('/city-planner', { state: { booking } });
  };

  return (
    <div className="w-full min-h-screen bg-white dark:bg-gray-900">
      {/* Subtle background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-100 dark:bg-blue-900/20 rounded-full blur-3xl opacity-20"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-50 dark:bg-blue-900/10 rounded-full blur-3xl opacity-10"></div>
      </div>

      {/* Navigation Bar */}
      <nav className="fixed top-0 left-0 right-0 z-50 p-4 md:p-6 pointer-events-none">
        <div className="max-w-7xl mx-auto flex justify-between items-center pointer-events-auto">
          <div></div>
          <div className="flex items-center gap-2 sm:gap-4" style={{ marginLeft: 'auto', marginRight: 0, insetInlineEnd: 'auto', insetInlineStart: 'unset' }}>
            <UserMenu />
          </div>
        </div>
      </nav>

      {/* Hero Section - Full Screen with Beach Image */}
      <section className="relative w-full min-h-screen flex items-center justify-center overflow-visible pt-20" style={{
        backgroundImage: `url(${heroImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}>
        {/* Light overlay for readability */}
        <div className="absolute inset-0 bg-black/20 pointer-events-none"></div>

        {/* Content */}
        <div className="relative z-10 w-full max-w-6xl mx-auto px-4 md:px-8 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-1 gap-6 md:gap-8">
            {/* Main Form - Glass Card */}
            <div className="animate-slide-in-up">
              <div className="glass p-6 md:p-8 rounded-lg backdrop-blur-md border border-white/20 shadow-lg bg-white/95 dark:bg-gray-800/90 dark:border-gray-700/30">
                <h1 className="text-4xl md:text-5xl font-bold mb-2 text-gray-900 dark:text-white">
                  {t('hero_title')}
                </h1>
                <p className="text-gray-600 dark:text-gray-300 text-lg mb-8">{t('hero_sub')}</p>
                <TripPlannerForm onSearch={handleSearch} onFormStateChange={setCurrentFormData} onAskAI={askAI} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - Modern Grid */}
      <section className="relative w-full py-20 md:py-32 px-4 md:px-8 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">{t('trip_planner')}</h2>
            <p className="text-gray-600 dark:text-gray-400 text-lg max-w-2xl mx-auto">{t('hero_sub')}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Feature 1 - Perfect Stays */}
            <div className="group glass p-6 md:p-8 rounded-lg backdrop-blur-sm border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-500 transition-all-smooth hover:shadow-lg cursor-pointer dark:bg-gray-800/50">
              <div className="w-14 h-14 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-4 group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50 transition-all">
                <Hotel className="w-7 h-7 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Perfect Stays</h3>
              <p className="text-gray-600 dark:text-gray-400">Handpicked accommodations that match your style and budget, from luxury resorts to cozy boutiques.</p>
            </div>

            {/* Feature 2 - Local Flavors */}
            <div className="group glass p-6 md:p-8 rounded-lg backdrop-blur-sm border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-500 transition-all-smooth hover:shadow-lg cursor-pointer dark:bg-gray-800/50">
              <div className="w-14 h-14 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-4 group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50 transition-all">
                <Utensils className="w-7 h-7 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Local Flavors</h3>
              <p className="text-gray-600 dark:text-gray-400">Discover authentic dining experiences and local activities that capture the true essence of each destination.</p>
            </div>

            {/* Feature 3 - Day-by-Day Plans */}
            <div className="group glass p-6 md:p-8 rounded-lg backdrop-blur-sm border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-500 transition-all-smooth hover:shadow-lg cursor-pointer dark:bg-gray-800/50">
              <div className="w-14 h-14 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-4 group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50 transition-all">
                <Map className="w-7 h-7 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Day-by-Day Plans</h3>
              <p className="text-gray-600 dark:text-gray-400">Detailed itineraries with cost breakdowns, so you can explore confidently and stay within budget.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="relative w-full py-20 md:py-32 px-4 md:px-8 bg-white dark:bg-gray-900">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">How It Works</h2>
            <p className="text-gray-600 dark:text-gray-400 text-lg">Three simple steps to your perfect trip</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 relative">
            {/* Step 1 */}
            <div className="relative glass p-8 rounded-lg backdrop-blur-sm border border-gray-200 dark:border-gray-700 group hover:shadow-lg transition-all-smooth dark:bg-gray-800/50 h-full flex flex-col">
              <div className="absolute -top-6 -left-6 w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-md">
                1
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Tell Us Your Dreams</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4 flex-grow">Select destinations, set your dates, and define your budget. Add as many as 3 destinations to explore.</p>
              <div className="flex gap-2 flex-wrap">
                <span className="text-xs px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">Destinations</span>
                <span className="text-xs px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">Budget</span>
                <span className="text-xs px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">Dates</span>
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative glass p-8 rounded-lg backdrop-blur-sm border border-gray-200 dark:border-gray-700 group hover:shadow-lg transition-all-smooth dark:bg-gray-800/50 h-full flex flex-col">
              <div className="absolute -top-6 -left-6 w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-md">
                2
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">AI Plans Your Trip</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4 flex-grow">Our AI creates personalized itineraries with flights, hotels, activities, and dining recommendations.</p>
              <div className="flex gap-2 flex-wrap">
                <span className="text-xs px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">AI Powered</span>
                <span className="text-xs px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">Personalized</span>
              </div>
            </div>

            {/* Step 3 */}
            <div className="relative glass p-8 rounded-lg backdrop-blur-sm border border-gray-200 dark:border-gray-700 group hover:shadow-lg transition-all-smooth dark:bg-gray-800/50 h-full flex flex-col">
              <div className="absolute -top-6 -left-6 w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-md">
                3
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Book & Explore</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4 flex-grow">Review your perfect itinerary, save it for later, or book immediately with our secure payment.</p>
              <div className="flex gap-2 flex-wrap">
                <span className="text-xs px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">Save</span>
                <span className="text-xs px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">Book</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative w-full py-20 md:py-32 px-4 md:px-8 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-4xl mx-auto">
          <div className="glass p-8 md:p-12 rounded-lg backdrop-blur-sm border border-gray-200 dark:border-gray-700 text-center shadow-md dark:bg-gray-800/50">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">{t('hero_title')}</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-8 text-lg">{t('hero_sub')}</p>
            <Button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold px-8 py-6 rounded-lg text-lg hover:shadow-lg transition-all-smooth">
              {t('plan_my_trip')}
            </Button>
          </div>
        </div>
      </section>

      {/* AI Dialog */}
      <Dialog open={aiOpen} onOpenChange={setAiOpen}>
        <DialogContent className="max-h-screen overflow-y-auto max-w-2xl glass border-gray-200 dark:border-gray-700 shadow-lg dark:bg-gray-800">
          <DialogHeader>
            <DialogTitle className="text-2xl text-gray-900 dark:text-white flex items-center gap-2">Your Perfect Trip Package <Plane className="w-6 h-6 text-blue-600 dark:text-blue-400" /></DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-gray-400">AI-generated itinerary tailored to your preferences and budget</DialogDescription>
          </DialogHeader>

          {packageResults && packageResults.length ? (
            <div className="space-y-4 mt-4">
              {packageResults.map((packageResult, idx) => (
                <div key={idx} className="space-y-4">
                  <div className="p-4 rounded-lg border border-gray-300 dark:border-gray-600 bg-blue-50 dark:bg-blue-900/20">
                    <div className="font-bold text-xl text-blue-900 dark:text-blue-300 mb-2 flex items-center gap-2"><MapPin className="w-5 h-5" /> {packageResult.destination}</div>
                    <div className="text-sm space-y-2 text-gray-700 dark:text-gray-300">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" /> Duration: <strong className="text-blue-600 dark:text-blue-400">{packageResult.days} days</strong></div>
                        <div className="flex items-center gap-2"><Users className="w-4 h-4 text-blue-600 dark:text-blue-400" /> Travelers: <strong className="text-blue-600 dark:text-blue-400">{packageResult.travellers}</strong></div>
                      </div>
                      <div className="flex items-center gap-2"><DollarSign className="w-4 h-4 text-blue-600 dark:text-blue-400" /> Total Budget: <strong className="text-blue-600 dark:text-blue-400">₨{packageResult.totalBudgetPKR.toLocaleString()}</strong></div>
                    </div>
                  </div>

                  <div className="p-4 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/30">
                    <div className="font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2"><Plane className="w-5 h-5 text-blue-600 dark:text-blue-400" /> Flight</div>
                    <div className="text-sm space-y-1 text-gray-700 dark:text-gray-300">
                      <div>Airline: <span className="text-blue-600 dark:text-blue-400">{packageResult.flights.airline}</span></div>
                      <div>Route: {packageResult.flights.departure} → {packageResult.flights.arrival}</div>
                      <div>Price: <strong className="text-blue-600 dark:text-blue-400">₨{packageResult.flights.pricePerPersonPKR.toLocaleString()}</strong> per person</div>
                    </div>
                  </div>

                  <div className="p-4 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/30">
                    <div className="font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2"><Hotel className="w-5 h-5 text-blue-600 dark:text-blue-400" /> Accommodation</div>
                    <div className="text-sm space-y-1 text-gray-700 dark:text-gray-300">
                      <div>Hotel: <span className="text-blue-600 dark:text-blue-400">{packageResult.hotel.name}</span> ({packageResult.hotel.stars} <Star className="w-4 h-4 text-blue-400 inline" />)</div>
                      <div>Rate: <strong className="text-blue-600 dark:text-blue-400">₨{packageResult.hotel.pricePerNightPKR.toLocaleString()}</strong> per night</div>
                      <div>Total Stay: <strong>₨{packageResult.hotel.totalStayPKR.toLocaleString()}</strong></div>
                    </div>
                  </div>

                  <div className="p-4 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/30">
                    <div className="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2"><Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" /> Day-by-Day Itinerary</div>
                    <div className="text-sm space-y-2 text-gray-700 dark:text-gray-300">
                      {packageResult.itinerary.slice(0, 3).map((day) => (
                        <div key={day.day} className="flex justify-between">
                          <span>Day {day.day}: <strong>{day.activity}</strong></span>
                          {day.estimatedCostPKR > 0 && <strong className="text-blue-600 dark:text-blue-400">₨{day.estimatedCostPKR.toLocaleString()}</strong>}
                        </div>
                      ))}
                      {packageResult.itinerary.length > 3 && (
                        <div className="text-xs italic text-gray-600 dark:text-gray-500 pt-2">+ {packageResult.itinerary.length - 3} more days</div>
                      )}
                    </div>
                  </div>

                  <div className="p-4 rounded-lg border border-gray-300 dark:border-gray-600 bg-blue-50 dark:bg-blue-900/20">
                    <div className="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2"><DollarSign className="w-5 h-5 text-blue-600 dark:text-blue-400" /> Budget Breakdown</div>
                    <div className="text-sm space-y-2 text-gray-700 dark:text-gray-300">
                      <div className="flex justify-between">
                        <span>Flights:</span>
                        <strong className="text-blue-600 dark:text-blue-400">₨{packageResult.budgetBreakdown.flights.toLocaleString()}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Accommodation:</span>
                        <strong className="text-blue-600 dark:text-blue-400">₨{packageResult.budgetBreakdown.accommodation.toLocaleString()}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Meals:</span>
                        <strong className="text-blue-600 dark:text-blue-400">₨{packageResult.budgetBreakdown.meals.toLocaleString()}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Activities:</span>
                        <strong className="text-blue-600 dark:text-blue-400">₨{packageResult.budgetBreakdown.activities.toLocaleString()}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Transport:</span>
                        <strong className="text-blue-600 dark:text-blue-400">₨{packageResult.budgetBreakdown.transport.toLocaleString()}</strong>
                      </div>
                      <div className="flex justify-between font-bold pt-2 border-t border-gray-300 dark:border-gray-600 text-lg text-blue-600 dark:text-blue-400">
                        <span>Total:</span>
                        <span>₨{packageResult.budgetBreakdown.total.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              <div className="flex justify-end gap-2 pt-4">
                <Button onClick={() => setAiOpen(false)} className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold hover:shadow-lg transition-all-smooth">
                  Decline
                </Button>
                <Button onClick={bookAllPackage} className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold hover:shadow-lg transition-all-smooth flex items-center gap-2">
                  Book All <Sparkles className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-sm text-gray-600 dark:text-gray-400 py-8 text-center">No package available.</div>
          )}
        </DialogContent>
      </Dialog>

      {/* Footer */}
      <footer className="relative w-full border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 py-12 md:py-16 px-4 md:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-md flex items-center justify-center text-white font-bold">
                  <Plane className="w-6 h-6" />
                </div>
                <span className="font-bold text-lg text-blue-600 dark:text-blue-400">Trip Planner</span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">AI-powered travel planning for the modern explorer.</p>
            </div>

            <div>
              <h4 className="font-bold text-gray-900 dark:text-white mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><span className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer transition-all" onClick={() => navigate('/city-planner')}>Itineraries</span></li>
                <li><span className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer transition-all" onClick={() => navigate('/destinations')}>Destinations</span></li>
                <li><span className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer transition-all" onClick={() => navigate('/my-bookings')}>My Bookings</span></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-gray-900 dark:text-white mb-4">Support</h4>
              <ul className="space-y-2 text-sm">
                <li><span className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer transition-all">Help & FAQs</span></li>
                <li><span className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer transition-all">Contact</span></li>
                <li><span className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer transition-all">Status</span></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-gray-900 dark:text-white mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><span className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer transition-all">Privacy</span></li>
                <li><span className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer transition-all">Terms</span></li>
                <li><span className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer transition-all">Cookie Policy</span></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
              <p>© {new Date().getFullYear()} Trip Planner. All rights reserved.</p>
              <div className="flex gap-6">
                <span className="hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer transition-all">Twitter</span>
                <span className="hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer transition-all">Instagram</span>
                <span className="hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer transition-all">LinkedIn</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
