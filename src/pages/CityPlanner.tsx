import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { MapPin, Star, Users, Plane, Hotel, Calendar, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import FlightSelector from "@/components/planner/FlightSelector";
import HotelCard from "@/components/planner/HotelCard";
import TripPlan from "@/components/planner/TripPlan";
import TravellerForm, { TravellerDetail } from "@/components/planner/TravellerForm";
import StepProgress from "@/components/planner/StepProgress";
import { BookingSummaryCard } from "@/components/BookingSummaryCard";
import { useBooking } from "@/contexts/BookingContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const cities = [
  { name: "Dubai", emoji: "🏜️", color: "bg-amber-500" },
  { name: "London", emoji: "🇬🇧", color: "bg-blue-500" },
  { name: "New York", emoji: "🗽", color: "bg-green-500" },
  { name: "Istanbul", emoji: "🕌", color: "bg-purple-500" },
];

// Exchange rate: 1 USD = 278 PKR
const USD_TO_PKR = 278;

const hotels = {
  Dubai: [
    { id: "dub1", name: "Burj Al Arab", stars: 5, price: "₨222.4k-333.6k", image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400" },
    { id: "dub2", name: "Atlantis The Palm", stars: 5, price: "₨166.8k-250.2k", image: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=400" },
    { id: "dub3", name: "Jumeirah Beach Hotel", stars: 5, price: "₨139k-222.4k", image: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400" },
    { id: "dub4", name: "Rove Downtown", stars: 4, price: "₨55.6k-97.3k", image: "https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=400" },
    { id: "dub5", name: "Holiday Inn Express", stars: 4, price: "₨41.7k-69.5k", image: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=400" },
    { id: "dub6", name: "Ibis Al Barsha", stars: 4, price: "₨27.8k-50k", image: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=400" },
  ],
  London: [
    { id: "lon1", name: "The Ritz London", stars: 5, price: "₨194.6k-305.8k", image: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=400" },
    { id: "lon2", name: "Savoy Hotel", stars: 5, price: "₨180.7k-278k", image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400" },
    { id: "lon3", name: "Shangri-La The Shard", stars: 5, price: "₨166.8k-264.1k", image: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=400" },
    { id: "lon4", name: "Premier Inn City", stars: 4, price: "₨50k-77.8k", image: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400" },
    { id: "lon5", name: "Holiday Inn Kensington", stars: 4, price: "₨41.7k-66.7k", image: "https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=400" },
    { id: "lon6", name: "Travelodge Central", stars: 4, price: "₨33.4k-55.6k", image: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=400" },
  ],
  "New York": [
    { id: "ny1", name: "The Plaza", stars: 5, price: "₨250.2k-417k", image: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=400" },
    { id: "ny2", name: "St. Regis New York", stars: 5, price: "₨236.3k-389.2k", image: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=400" },
    { id: "ny3", name: "The Peninsula", stars: 5, price: "₨222.4k-361.4k", image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400" },
    { id: "ny4", name: "Pod Times Square", stars: 4, price: "₨69.5k-105.6k", image: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=400" },
    { id: "ny5", name: "Hampton Inn Manhattan", stars: 4, price: "₨61.2k-94.5k", image: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400" },
    { id: "ny6", name: "Holiday Inn Express", stars: 4, price: "₨50k-80.6k", image: "https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=400" },
  ],
  Istanbul: [
    { id: "ist1", name: "Çırağan Palace", stars: 5, price: "₨166.8k-278k", image: "https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=400" },
    { id: "ist2", name: "Four Seasons Sultanahmet", stars: 5, price: "₨152.9k-250.2k", image: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=400" },
    { id: "ist3", name: "Swissôtel The Bosphorus", stars: 5, price: "₨139k-236.3k", image: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=400" },
    { id: "ist4", name: "Ramada by Wyndham", stars: 4, price: "₨41.7k-69.5k", image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400" },
    { id: "ist5", name: "Holiday Inn Old City", stars: 4, price: "₨36.1k-61.2k", image: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=400" },
    { id: "ist6", name: "Best Western Taksim", stars: 4, price: "₨27.8k-50k", image: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400" },
  ],
};

const CityPlanner = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useBooking();
  const { toast } = useToast();
  const [step, setStep] = useState<"city" | "flight" | "hotel" | "activity" | "traveller" | "review" >("city");
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [numPeople, setNumPeople] = useState<number>(1);
  const [numDays, setNumDays] = useState<number>(7);

  // Multi-destination booking support
  const [destinationsList, setDestinationsList] = useState<string[]>([]);
  const [currentDestIndex, setCurrentDestIndex] = useState<number>(0);
  const [selectedFlightsByDest, setSelectedFlightsByDest] = useState<Record<string, any>>({});
  const [selectedHotelsByDest, setSelectedHotelsByDest] = useState<Record<string, string>>({});
  const [travellerDetails, setTravellerDetails] = useState<TravellerDetail[]>([]);
  const [aiBookingData, setAiBookingData] = useState<any>(null);
  const [hotelSortOrder, setHotelSortOrder] = useState<"default" | "price-asc" | "price-desc" | "popularity">("default");
  const [reviewBookingData, setReviewBookingData] = useState<any>(null);

  // Save state to localStorage whenever selections change
  useEffect(() => {
    const stateToSave = {
      step,
      destinationsList,
      currentDestIndex,
      selectedFlightsByDest,
      selectedHotelsByDest,
      travellerDetails,
      numPeople,
      numDays,
      reviewBookingData,
      selectedCity,
    };
    localStorage.setItem('cityPlannerState', JSON.stringify(stateToSave));
  }, [step, destinationsList, currentDestIndex, selectedFlightsByDest, selectedHotelsByDest, travellerDetails, numPeople, numDays, reviewBookingData, selectedCity]);

  // Restore state from localStorage on mount
  useEffect(() => {
    try {
      const savedState = localStorage.getItem('cityPlannerState');
      if (savedState) {
        const state = JSON.parse(savedState);
        setDestinationsList(state.destinationsList || []);
        setCurrentDestIndex(state.currentDestIndex || 0);
        setSelectedFlightsByDest(state.selectedFlightsByDest || {});
        setSelectedHotelsByDest(state.selectedHotelsByDest || {});
        setTravellerDetails(state.travellerDetails || []);
        setNumPeople(state.numPeople || 1);
        setNumDays(state.numDays || 7);
        if (state.reviewBookingData) setReviewBookingData(state.reviewBookingData);
        
        // Restore selected city - if we have destinations, set the city for the current destination
        if (state.destinationsList && state.destinationsList.length > 0) {
          const currentDest = state.destinationsList[state.currentDestIndex || 0];
          const matchedCity = cities.find(c => c.name.toLowerCase() === currentDest.toLowerCase());
          if (matchedCity) {
            setSelectedCity(matchedCity.name);
          } else if (state.selectedCity) {
            setSelectedCity(state.selectedCity);
          }
        } else if (state.selectedCity) {
          setSelectedCity(state.selectedCity);
        }
        
        // Only restore step if it's not the initial "city" step
        if (state.step && state.step !== 'city' && state.destinationsList?.length > 0) {
          setStep(state.step);
        }
      }
    } catch (err) {
      console.warn('Failed to restore state from localStorage:', err);
    }
  }, []);

  // Calculate number of days from trip data
  useEffect(() => {
    const state = location.state as any;
    console.log("CityPlanner state tripData:", state?.tripData);
    console.log("Travellers value:", state?.tripData?.travellers, "Type:", typeof state?.tripData?.travellers);
    
    if (state?.tripData) {
      const { startDate, endDate, travellers } = state.tripData;
      
      if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        console.log("Days calculated:", days);
        setNumDays(Math.max(1, days));
      }

      // Set number of people from travellers field
      if (travellers) {
        const numTravellers = Number(travellers);
        console.log("Setting numPeople to:", numTravellers);
        if (!isNaN(numTravellers)) {
          setNumPeople(numTravellers);
        }
      }

      // Prepare destinations list and auto-select first destination if provided
      // Build list from tripData.destinations and any additional destination2/destination3 fields
      const rawDestinations: string[] = [];
      if (Array.isArray(state.tripData.destinations)) rawDestinations.push(...state.tripData.destinations);
      if (state.tripData.destination2) rawDestinations.push(state.tripData.destination2);
      if (state.tripData.destination3) rawDestinations.push(state.tripData.destination3);
      // normalize, remove empties and duplicates while preserving order
      const dests = rawDestinations
        .map((d: string) => (d || "").trim())
        .filter((d: string) => d && d.length > 0)
        .reduce((acc: string[], cur: string) => {
          const lower = cur.toLowerCase();
          if (!acc.some(a => a.toLowerCase() === lower)) acc.push(cur);
          return acc;
        }, [] as string[]);

      if (dests.length > 0) {
        setDestinationsList(dests);
        setCurrentDestIndex(0);
        const firstDest = dests[0];
        const matchedCity = cities.find(c => c.name.toLowerCase() === firstDest.toLowerCase());
        if (matchedCity) {
          setSelectedCity(matchedCity.name);
          setStep("flight");
        }
      }
    }
  }, []);
  
  // Open summary when navigated back from Payment or when booking state is provided
  useEffect(() => {
    const state = location.state as any;
    if (!state) return;

    // If returning from Payment with returnStep, go directly to that step
    if (state.returnStep) {
      setStep(state.returnStep);
      // Restore all selections from fullState
      if (state.fullState) {
        const fs = state.fullState;
        if (fs.destinationsList && fs.destinationsList.length > 0) {
          setDestinationsList(fs.destinationsList);
          setCurrentDestIndex(0);
        }
        if (fs.selectedFlightsByDest) {
          setSelectedFlightsByDest(fs.selectedFlightsByDest);
        }
        if (fs.selectedHotelsByDest) {
          setSelectedHotelsByDest(fs.selectedHotelsByDest);
        }
        if (fs.travellerDetails && fs.travellerDetails.length > 0) {
          setTravellerDetails(fs.travellerDetails);
        }
        if (fs.numPeople) setNumPeople(fs.numPeople);
        if (fs.numDays) setNumDays(fs.numDays);
      }
      // Also rehydrate the booking data if provided
      if (state.booking) {
        setReviewBookingData(state.booking);
      }
      return;
    }

    // If AI or Payment navigated with booking, rehydrate selection
    if (state.booking) {
      const b = state.booking;
      try {
        // Store the booking data for use when traveller form completes
        setAiBookingData(b);
        
        // Rehydrate per-destination selections if present
        if (b.plan?.itineraryByDest) {
          setSelectedFlightsByDest(b.plan.itineraryByDest.flights || {});
          setSelectedHotelsByDest(b.plan.itineraryByDest.hotels || {});
          // Extract destinations from itineraryByDest.flights keys
          const destKeysFromFlights = Object.keys(b.plan.itineraryByDest.flights || {});
          if (destKeysFromFlights.length > 0) {
            setDestinationsList(destKeysFromFlights);
            setCurrentDestIndex(0);
            const firstDest = destKeysFromFlights[0];
            const matchedCity = cities.find(c => c.name.toLowerCase() === firstDest.toLowerCase());
            if (matchedCity) {
              setSelectedCity(matchedCity.name);
            }
          }
        }
        if (b.plan?.numPeople) setNumPeople(b.plan.numPeople);
        if (b.plan?.numDays) setNumDays(b.plan.numDays);
        // Go to traveller form instead of showing summary directly
        setStep('traveller');
      } catch (err) {
        console.warn('Failed to rehydrate booking state:', err);
      }
    }
  }, [location.state]);

  const handleFlightSelect = (flight: any) => {
    if (!destinationsList[currentDestIndex]) return;
    const destName = destinationsList[currentDestIndex];
    setSelectedFlightsByDest((s) => ({ ...s, [destName]: flight }));
    setStep("hotel");
  };

  const handleHotelSelect = (hotelId: string) => {
    if (!destinationsList[currentDestIndex]) return;
    const destName = destinationsList[currentDestIndex];
    setSelectedHotelsByDest((s) => ({ ...s, [destName]: hotelId }));
    // After selecting hotel, go to activities for the current destination
    setStep('activity');
  };

  const handleActivityComplete = () => {
    // After activities for current destination, either advance to next destination or finish
    const nextIndex = currentDestIndex + 1;
    if (nextIndex < destinationsList.length) {
      const nextDest = destinationsList[nextIndex];
      const matchedCity = cities.find(c => c.name.toLowerCase() === nextDest.toLowerCase());
      setCurrentDestIndex(nextIndex);
      if (matchedCity) {
        setSelectedCity(matchedCity.name);
      } else {
        setSelectedCity(nextDest);
      }
      // start the next destination flow with flight selection
      setStep('flight');
    } else {
      // finished selecting for all destinations, go to traveller form
      setStep('traveller');
    }
  };

  const cityHotels = selectedCity ? hotels[selectedCity as keyof typeof hotels] : [];

  const currentDestName = destinationsList[currentDestIndex] || selectedCity || null;

  const stepOrder = ["city", "flight", "hotel", "activity", "traveller", "review"] as const;

  const handleStepClick = (targetStepId: string, targetIndex: number) => {
    const currentIndex = stepOrder.indexOf(step as any);
    // If user clicked the Destination (first) step, send them back to the planner page
    if (targetStepId === 'city') {
      navigate('/');
      return;
    }

    // Allow backward navigation freely for non-city steps
    if (targetIndex <= currentIndex) {
      setStep(targetStepId as any);
      return;
    }

    // Forward navigation: validate required fields for current step before allowing
    // We'll check the current step's minimal required selection
    const cur = step;
    if (cur === 'city') {
      if (!currentDestName) {
        toast({ title: 'Please select a destination first', variant: 'destructive' });
        return;
      }
    }
    if (cur === 'flight') {
      if (!currentDestName || !selectedFlightsByDest[currentDestName]) {
        toast({ title: 'Please select a flight for this destination before proceeding', variant: 'destructive' });
        return;
      }
    }
    if (cur === 'hotel') {
      if (!currentDestName || !selectedHotelsByDest[currentDestName]) {
        toast({ title: 'Please select a hotel for this destination before proceeding', variant: 'destructive' });
        return;
      }
    }

    // If all checks pass, allow navigation to target step
    setStep(targetStepId as any);
  };

  const parsePriceRangeToNumber = (priceStr?: string) => {
    if (!priceStr) return 0;
    // try to extract the first number and multiplier (k)
    const m = priceStr.match(/([0-9]+(?:\.[0-9]+)?)(k?)/i);
    if (!m) return 0;
    let val = parseFloat(m[1]);
    if (m[2] && m[2].toLowerCase() === "k") val = val * 1000;
    return Math.round(val);
  };
  const getDaysForDestination = (index: number) => {
    // If destinationsList and its days are already set from booking rehydration, use those
    if (destinationsList.length > 0) {
      // Check if we have specific day counts stored in state
      const state = location.state as any;
      const td = state?.tripData;
      if (td) {
        if (index === 0) {
          if (td.startDate && td.endDate) {
            const days = Math.ceil((new Date(td.endDate).getTime() - new Date(td.startDate).getTime())/(1000*60*60*24))+1;
            return Math.max(1, days);
          }
        }
        if (index === 1) {
          if (td.startDate2 && td.endDate2) {
            const days = Math.ceil((new Date(td.endDate2).getTime() - new Date(td.startDate2).getTime())/(1000*60*60*24))+1;
            return Math.max(1, days);
          }
        }
        if (index === 2) {
          if (td.startDate3 && td.endDate3) {
            const days = Math.ceil((new Date(td.endDate3).getTime() - new Date(td.startDate3).getTime())/(1000*60*60*24))+1;
            return Math.max(1, days);
          }
        }
      }
    }
    return Math.max(1, numDays);
  };

  const saveBookingAsPending = async (bookingData: any) => {
    try {
      if (!isAuthenticated || !user?.id) {
        // Store current page for redirect after auth
        sessionStorage.setItem('authReturnUrl', '/city-planner');
        toast({
          title: 'Authentication Required',
          description: 'Sign in to save your booking',
          variant: 'destructive'
        });
        navigate('/auth');
        return;
      }

      // Create pending booking
      const pendingBooking = {
        user_id: user.id,
        itinerary_title: bookingData.itinerary_title || 'Trip Booking',
        total_amount: bookingData.total_amount || 0,
        itinerary_data: bookingData.plan || {},
        status: 'pending',
        payment_status: 'pending',
      };

      const { data, error } = await supabase
        .from('confirmed_bookings')
        .insert([pendingBooking])
        .select();

      if (error) {
        console.error('Booking save error:', error);
        toast({ 
          title: 'Error', 
          description: `Failed to save booking: ${error.message}`, 
          variant: 'destructive' 
        });
        return;
      }

      console.log('Pending booking created:', data);

      toast({
        title: 'Booking Saved!',
        description: 'Your trip has been saved with pending status. Complete payment anytime from My Bookings.',
      });

      // Clear traveller data from session storage after successful save
      sessionStorage.removeItem('travellerData');

      // Redirect to home page after 2 seconds
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (err) {
      console.error('Booking save error:', err);
      toast({ 
        title: 'Error', 
        description: 'Failed to save booking. Please try again.', 
        variant: 'destructive' 
      });
    }
  };

  const handleSaveBooking = () => {
    if (reviewBookingData) {
      try {
        // Get existing bookings from localStorage
        const existingBookings = JSON.parse(localStorage.getItem('bookings') || '[]');
        
        // Add new booking with pending status
        const newBooking = {
          id: `booking-${Date.now()}`,
          ...reviewBookingData,
          status: 'pending',
          payment_status: 'pending',
          created_at: new Date().toISOString(),
        };
        
        existingBookings.push(newBooking);
        localStorage.setItem('bookings', JSON.stringify(existingBookings));
        
        toast({
          title: 'Booking Saved!',
          description: 'Your booking has been saved. You can review it in My Bookings.',
        });
        
        // Clear traveller data from session storage
        sessionStorage.removeItem('travellerData');
        
        // Redirect to home after 2 seconds
        setTimeout(() => {
          navigate('/');
        }, 2000);
      } catch (err) {
        console.error('Error saving booking:', err);
        toast({
          title: 'Error',
          description: 'Failed to save booking. Please try again.',
          variant: 'destructive',
        });
      }
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 relative overflow-hidden">
      {/* Subtle background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-100 dark:bg-blue-900/20 rounded-full blur-3xl opacity-20 dark:opacity-10"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-50 dark:bg-blue-900/10 rounded-full blur-3xl opacity-10 dark:opacity-5"></div>
      </div>

      {/* Step Progress Bar */}
      <StepProgress
        currentStep={step}
        totalDestinations={destinationsList.length || 1}
        currentDestinationIndex={currentDestIndex}
      />

      <div className="max-w-7xl mx-auto p-4 space-y-6 relative z-10">
        {/* Traveller Details Form */}
        {step === "traveller" && (
          <TravellerForm
            numTravellers={numPeople}
            onBack={() => {
              // Go back to activity selection
              setStep("activity");
              setCurrentDestIndex(Math.max(0, destinationsList.length - 1));
            }}
            onComplete={(travellers, action) => {
              setTravellerDetails(travellers);
              // Proceed to review step
              const bookingData = aiBookingData || (() => {
                let totalAmount = 0;
                let totalDays = 0;
                const itineraryByDest: any = { flights: {}, hotels: {}, days: {} };
                destinationsList.forEach((dest, idx) => {
                  const days = getDaysForDestination(idx) || 1;
                  totalDays += days;
                  const flight = selectedFlightsByDest[dest];
                  const hotelId = selectedHotelsByDest[dest];
                  itineraryByDest.flights[dest] = flight || null;
                  itineraryByDest.hotels[dest] = hotelId || null;
                  itineraryByDest.days[dest] = days;
                  if (flight && flight.price) totalAmount += (flight.price || 0) * numPeople;
                  if (hotelId) {
                    const hotel = (hotels[dest as keyof typeof hotels] || []).find(h => h.id === hotelId);
                    const hotelPrice = parsePriceRangeToNumber(hotel?.price);
                    totalAmount += hotelPrice * days;
                  }
                });

                return {
                  itinerary_title: `${destinationsList.join(' > ')} - ${totalDays} Days`,
                  total_amount: totalAmount,
                  plan: {
                    numPeople,
                    numDays: totalDays,
                    itineraryByDest,
                  },
                };
              })();
              
              // Clear AI booking data after use
              setAiBookingData(null);
              
              // Store booking data and action for review step
              setReviewBookingData({ ...bookingData, action });
              setStep('review');
            }}
          />
        )}

        {/* Flight Selection */}
        {step === "flight" && currentDestName && (
          <>
            <div className="glass p-8 rounded-2xl border border-cyan-500/20 dark:border-cyan-500/10 backdrop-blur-xl dark:bg-gray-800/50">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    Select Your Flight for {currentDestName}
                  </h2>
                  <p className="text-gray-700 dark:text-gray-300">Departing to {currentDestName} for {getDaysForDestination(currentDestIndex)} days</p>
                </div>
                <Button 
                  onClick={() => navigate('/')}
                  className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 text-white font-semibold glow-primary hover:scale-105 transition-all-smooth"
                >
                  ← Back
                </Button>
              </div>
            </div>
            
            <FlightSelector
              destination={currentDestName || selectedCity}
              numPeople={numPeople}
              onSelect={handleFlightSelect}
              selectedFlightId={selectedFlightsByDest[currentDestName || '']?.id}
            />
          </>
        )}

        {/* Hotel Selection */}
        {step === "hotel" && currentDestName && (
          <>
            <div className="glass p-8 rounded-2xl border border-purple-500/20 dark:border-purple-500/10 backdrop-blur-xl dark:bg-gray-800/50">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                    Select Your Hotel for {currentDestName}
                  </h2>
                  <p className="text-gray-700 dark:text-gray-300">Choose from our curated accommodations in {currentDestName}</p>
                </div>
                <Button 
                  onClick={() => setStep("flight")}
                  className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 text-white font-semibold glow-primary hover:scale-105 transition-all-smooth"
                >
                  ← Back
                </Button>
              </div>
            </div>

            {/* Sort Options */}
            <div className="flex items-center gap-3 pb-4 border-b border-gray-200 dark:border-gray-700">
              <label className="text-sm font-semibold text-gray-900 dark:text-white">
                Sort by:
              </label>
              <Select value={hotelSortOrder} onValueChange={(val) => setHotelSortOrder(val as any)}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Default</SelectItem>
                  <SelectItem value="price-asc">Price: Low to High</SelectItem>
                  <SelectItem value="price-desc">Price: High to Low</SelectItem>
                  <SelectItem value="popularity">Popularity (Stars)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(() => {
                const hotelList = hotels[currentDestName as keyof typeof hotels] || [];
                let sortedHotels = [...hotelList];
                
                if (hotelSortOrder === "price-asc") {
                  sortedHotels.sort((a, b) => {
                    const priceA = parseInt(a.price.replace(/[^\d]/g, '')) || 0;
                    const priceB = parseInt(b.price.replace(/[^\d]/g, '')) || 0;
                    return priceA - priceB;
                  });
                } else if (hotelSortOrder === "price-desc") {
                  sortedHotels.sort((a, b) => {
                    const priceA = parseInt(a.price.replace(/[^\d]/g, '')) || 0;
                    const priceB = parseInt(b.price.replace(/[^\d]/g, '')) || 0;
                    return priceB - priceA;
                  });
                } else if (hotelSortOrder === "popularity") {
                  sortedHotels.sort((a, b) => b.stars - a.stars);
                }
                
                return sortedHotels.map((hotel) => (
                  <HotelCard
                    key={hotel.id}
                    hotel={hotel}
                    isSelected={selectedHotelsByDest[currentDestName || ''] === hotel.id}
                    onSelect={() => handleHotelSelect(hotel.id)}
                  />
                ));
              })()}
            </div>
          </>
        )}


        {/* Trip Plan */}
        {/* Activity Selection (per-destination) */}
        {step === "activity" && selectedCity && (
          <>
            <div className="glass p-8 rounded-2xl border border-amber-500/20 dark:border-amber-500/10 backdrop-blur-xl dark:bg-gray-800/50">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                    Select Activities for {selectedCity}
                  </h2>
                  <p className="text-gray-700 dark:text-gray-300">Choose activities and dining for {selectedCity}</p>
                </div>
                <Button 
                  onClick={() => setStep("hotel")}
                  className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 text-white font-semibold glow-primary hover:scale-105 transition-all-smooth"
                >
                  ← Back
                </Button>
              </div>
            </div>

            <TripPlan
              city={selectedCity}
              numPeople={numPeople}
              numDays={getDaysForDestination(currentDestIndex)}
              onFinalize={handleActivityComplete}
            />
          </>
        )}


        {/* Review Plan */}
        {step === "review" && reviewBookingData && (
          <div className="space-y-6">
            <div className="glass p-8 rounded-2xl border border-blue-500/20 dark:border-blue-500/10 backdrop-blur-xl dark:bg-gray-800/50">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Review Your Booking
                </h2>
                <Button 
                  onClick={() => setStep("traveller")}
                  className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 text-white font-semibold glow-primary hover:scale-105 transition-all-smooth"
                >
                  ← Back
                </Button>
              </div>
              <p className="text-gray-600 dark:text-gray-400">Review all your trip details before proceeding to payment</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Main Summary Card */}
              <div className="md:col-span-2 space-y-6">
                {/* Trip Items */}
                <Card className="shadow-lg border-0 bg-white dark:bg-gray-800">
                  <CardContent className="p-6 space-y-4">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Trip Details</h3>
                    
                    {(() => {
                      const itinerary = reviewBookingData.plan?.itineraryByDest;
                      return destinationsList.map((dest, idx) => (
                        <div key={dest} className="space-y-3 pb-4 border-b border-gray-200 dark:border-gray-700 last:border-b-0 last:pb-0">
                          <p className="font-semibold text-gray-900 dark:text-white">{dest}</p>
                          
                          {/* Flight */}
                          {itinerary?.flights?.[dest] && (
                            <div className="pl-4 text-sm">
                              {(() => {
                                const flight = itinerary.flights[dest];
                                const flightClass = flight.class || (flight.departure ? `${flight.departure} → ${flight.arrival}` : 'Economy');
                                const price = flight.price || flight.pricePerPersonPKR || 0;
                                
                                return (
                                  <>
                                    <p className="text-gray-600 dark:text-gray-400">Flight: <span className="text-gray-900 dark:text-white font-medium">{flight.airline} ({flightClass})</span></p>
                                    <p className="text-gray-500 dark:text-gray-400 mt-1">PKR {parseInt(String(price).replace(/[^\d]/g, '')).toLocaleString()}</p>
                                  </>
                                );
                              })()}
                            </div>
                          )}
                          
                          {/* Hotel */}
                          {itinerary?.hotels?.[dest] && (
                            <div className="pl-4 text-sm">
                              {(() => {
                                const hotelData = itinerary.hotels[dest];
                                const nights = itinerary.days?.[dest] || 1;
                                
                                // Handle both object (from AI) and ID (from manual selection)
                                let hotel;
                                if (typeof hotelData === 'string') {
                                  // It's an ID - look it up
                                  hotel = (hotels[dest as keyof typeof hotels] || []).find(h => h.id === hotelData);
                                } else {
                                  // It's already an object from AI
                                  hotel = hotelData;
                                }
                                
                                return (
                                  <>
                                    <p className="text-gray-600 dark:text-gray-400">Hotel: <span className="text-gray-900 dark:text-white font-medium">{hotel?.name} ({nights} nights)</span></p>
                                    <p className="text-gray-500 dark:text-gray-400 mt-1">PKR {parseInt(String(hotel?.price || '0').replace(/[^\d]/g, '')) * nights}</p>
                                  </>
                                );
                              })()}
                            </div>
                          )}
                        </div>
                      ));
                    })()}
                  </CardContent>
                </Card>

                {/* Travelers Info */}
                <Card className="shadow-lg border-0 bg-white dark:bg-gray-800">
                  <CardContent className="p-6 space-y-4">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Travelers ({numPeople})</h3>
                    <div className="space-y-3">
                      {travellerDetails.map((traveller, idx) => (
                        <div key={idx} className="p-3 bg-gray-50 dark:bg-gray-900/30 rounded-lg text-sm">
                          <p className="font-medium text-gray-900 dark:text-white">{traveller.firstName} {traveller.lastName}</p>
                          <p className="text-gray-600 dark:text-gray-400">{traveller.email}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right Sidebar - Price Summary & Actions */}
              <div className="col-span-1 space-y-4">
                <BookingSummaryCard
                  title={reviewBookingData.itinerary_title || `${numDays}-Day Trip`}
                  destination={destinationsList.join(' → ')}
                  subtotal={reviewBookingData.total_amount || 0}
                  total={reviewBookingData.total_amount || 0}
                  currency="PKR"
                />

                <div className="space-y-3">
                  <Button 
                    onClick={() => navigate('/payment', { state: { booking: reviewBookingData } })}
                    className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-3 rounded-lg transition-all-smooth"
                  >
                    Proceed to Payment
                  </Button>

                  <Button 
                    onClick={() => handleSaveBooking()}
                    className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-3 rounded-lg transition-all-smooth"
                  >
                    Save Booking
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CityPlanner;
