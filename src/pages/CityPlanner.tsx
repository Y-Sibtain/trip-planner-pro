import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin, Star, Users, Plane } from "lucide-react";
import { Link } from "react-router-dom";
import FlightSelector from "@/components/planner/FlightSelector";
import HotelCard from "@/components/planner/HotelCard";
import TripPlan from "@/components/planner/TripPlan";

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
  const [step, setStep] = useState<"city" | "flight" | "hotel" | "plan">("city");
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [numPeople, setNumPeople] = useState<number>(1);
  const [selectedFlight, setSelectedFlight] = useState<any>(null);
  const [selectedHotel, setSelectedHotel] = useState<string | null>(null);
  const [showSummary, setShowSummary] = useState(false);
  const [numDays, setNumDays] = useState<number>(7);

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

      // Auto-select first destination if provided
      if (state.tripData.destinations && state.tripData.destinations.length > 0) {
        const firstDest = state.tripData.destinations[0];
        const matchedCity = cities.find(c => c.name.toLowerCase() === firstDest.toLowerCase());
        if (matchedCity) {
          setSelectedCity(matchedCity.name);
          setStep("flight");
        }
      }
    }
  }, []);
  
  // tried something 
  // Open summary when navigated back from Payment or when booking state is provided
  useEffect(() => {
    const state = location.state as any;
    if (!state) return;

    // If Payment navigated back with booking, rehydrate selection and open summary
    if (state.booking) {
      const b = state.booking;
      try {
        if (b.plan?.city) setSelectedCity(b.plan.city);
        if (b.plan?.numPeople) setNumPeople(b.plan.numPeople);
        if (b.plan?.numDays) setNumDays(b.plan.numDays);
        if (b.plan?.flight) setSelectedFlight(b.plan.flight);
        if (b.plan?.hotel) setSelectedHotel(b.plan.hotel?.id || b.plan.hotel?.id || null);
        setStep('plan');
        setShowSummary(true);
      } catch (err) {
        console.warn('Failed to rehydrate booking state:', err);
        setShowSummary(true);
      }
    } else if (state.openSummary) {
      setShowSummary(true);
    }
  }, [location.state]);

  const handleCitySelect = (city: string) => {
    setSelectedCity(city);
    setStep("flight");
  };

  const handleFlightSelect = (flight: any) => {
    setSelectedFlight(flight);
    setStep("hotel");
  };

  const handleHotelSelect = (hotelId: string) => {
    setSelectedHotel(hotelId);
    setStep("plan");
  };

  const cityHotels = selectedCity ? hotels[selectedCity as keyof typeof hotels] : [];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 relative overflow-hidden">
      {/* Subtle background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-100 dark:bg-blue-900/20 rounded-full blur-3xl opacity-20 dark:opacity-10"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-50 dark:bg-blue-900/10 rounded-full blur-3xl opacity-10 dark:opacity-5"></div>
      </div>

      <div className="max-w-7xl mx-auto p-4 space-y-6 relative z-10">
        {/* Header */}
        <div>
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white">City Trip Planner</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Plan your perfect {numDays}-day adventure</p>
        </div>

        {/* City Selection */}
        {step === "city" && (
          <div className="glass p-8 rounded-lg border border-gray-200 dark:border-gray-700 backdrop-blur-sm shadow-md dark:bg-gray-800/50">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                  <MapPin className="h-6 w-6 text-white" />
                </div>
                Choose Your Destination
              </h2>
              <p className="text-gray-600 dark:text-gray-400">Select a city to begin planning</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {cities.map((city) => (
                <div
                  key={city.name}
                  onClick={() => handleCitySelect(city.name)}
                  className="group glass p-6 rounded-lg border border-gray-200 dark:border-gray-700 backdrop-blur-sm cursor-pointer transition-all-smooth hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:scale-105 hover:shadow-md dark:bg-gray-800/50"
                >
                  <div className="text-6xl mb-4 group-hover:scale-110 transition-all-smooth">{city.emoji}</div>
                  <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-3">{city.name}</h3>
                  <div className="inline-block px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-700 text-sm text-blue-600 dark:text-blue-300">
                    {numDays} Days
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Flight Selection */}
        {step === "flight" && selectedCity && (
          <>
            <div className="glass p-8 rounded-2xl border border-cyan-500/20 dark:border-cyan-500/10 backdrop-blur-xl dark:bg-gray-800/50">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    Select Your Flight
                  </h2>
                  <p className="text-gray-700 dark:text-gray-300">Departing to {selectedCity} for {numDays} days</p>
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
              destination={selectedCity}
              numPeople={numPeople}
              onSelect={handleFlightSelect}
            />
          </>
        )}

        {/* Hotel Selection */}
        {step === "hotel" && selectedCity && (
          <>
            <div className="glass p-8 rounded-2xl border border-purple-500/20 dark:border-purple-500/10 backdrop-blur-xl dark:bg-gray-800/50">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                    Select Your Hotel
                  </h2>
                  <p className="text-gray-700 dark:text-gray-300">Choose from our curated accommodations in {selectedCity}</p>
                </div>
                <Button 
                  onClick={() => setStep("flight")}
                  className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 text-white font-semibold glow-primary hover:scale-105 transition-all-smooth"
                >
                  ← Back
                </Button>
              </div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {cityHotels.map((hotel) => (
                <HotelCard
                  key={hotel.id}
                  hotel={hotel}
                  isSelected={selectedHotel === hotel.id}
                  onSelect={() => handleHotelSelect(hotel.id)}
                />
              ))}
            </div>
          </>
        )}

        {/* Trip Plan */}
        {step === "plan" && selectedCity && selectedHotel && (
          <>
            <div className="glass p-8 rounded-2xl border border-pink-500/20 dark:border-pink-500/10 backdrop-blur-xl dark:bg-gray-800/50">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                    Your {numDays}-Day Itinerary
                  </h2>
                  <p className="text-gray-700 dark:text-gray-300">Activities and dining recommendations</p>
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
              numDays={numDays}
              onFinalize={() => setShowSummary(true)}
            />
          </>
        )}

        {/* Summary Modal */}
        <Dialog open={showSummary} onOpenChange={setShowSummary}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto glass border border-blue-400/20 dark:border-blue-400/10 bg-gradient-to-b from-slate-50 to-blue-50 dark:from-gray-800 dark:to-gray-900 backdrop-blur-sm shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-4xl font-bold text-gray-900 dark:text-white">Booking Summary</DialogTitle>
              <DialogDescription className="text-blue-600 dark:text-white-400 text-base font-medium mt-2">Review your complete {selectedCity} trip</DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 mt-6">
              <div className="group relative overflow-hidden p-5 rounded-xl bg-white dark:bg-gray-800 border-2 border-blue-200 dark:border-blue-700 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-lg transition-all-smooth duration-300">
                <h3 className="font-bold text-gray-900 dark:text-white mb-3 text-lg">👥 Travelers</h3>
                <div className="inline-block px-6 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold shadow-md">
                  {numPeople} {numPeople === 1 ? "person" : "people"}
                </div>
              </div>

              {selectedFlight && (
                <div className="group relative overflow-hidden p-5 rounded-xl bg-white dark:bg-gray-800 border-2 border-blue-200 dark:border-blue-700 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-lg transition-all-smooth duration-300">
                  <h3 className="font-bold text-gray-900 dark:text-white mb-4 text-lg">✈️ Selected Flight</h3>
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-700 space-y-2">
                    <p className="font-bold text-gray-900 dark:text-white text-lg">{selectedFlight.airline}</p>
                    <Badge
                      className={
                        selectedFlight.class === "Economy"
                          ? "bg-green-500 text-white font-semibold"
                          : selectedFlight.class === "Business"
                          ? "bg-red-500 text-white font-semibold"
                          : (selectedFlight.class === "First Class" || selectedFlight.class === "First")
                          ? "bg-yellow-500 text-white font-semibold"
                          : "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white font-semibold"
                      }
                    >
                      {selectedFlight.class}
                    </Badge>
                  </div>
                </div>
              )}

              {selectedHotel && (
                <div className="group relative overflow-hidden p-5 rounded-xl bg-white dark:bg-gray-800 border-2 border-blue-200 dark:border-blue-700 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-lg transition-all-smooth duration-300">
                  <h3 className="font-bold text-gray-900 dark:text-white mb-4 text-lg">🏨 Selected Hotel</h3>
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-700 space-y-3">
                    <p className="font-bold text-gray-900 dark:text-white text-lg">{cityHotels.find(h => h.id === selectedHotel)?.name}</p>
                    <div className="flex items-center gap-2">
                      {Array.from({ length: cityHotels.find(h => h.id === selectedHotel)?.stars || 0 }).map((_, i) => (
                        <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                      ))}
                      <span className="text-sm text-gray-900 dark:text-white font-semibold ml-2">{cityHotels.find(h => h.id === selectedHotel)?.stars} Stars</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-6">
                <Button 
                  className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold text-base rounded-lg hover:scale-105 transition-all-smooth shadow-md"
                  onClick={() => {
                    const hotelPrice = parseInt(cityHotels.find(h => h.id === selectedHotel)?.price?.replace(/\D/g, '') || '0');
                    const bookingData = {
                      itinerary_title: `${selectedCity} - ${numDays} Days`,
                      total_amount: ((selectedFlight?.price || 0) * numPeople) + (hotelPrice * numDays),
                      plan: {
                        city: selectedCity,
                        numPeople,
                        numDays,
                        flight: selectedFlight,
                        hotel: cityHotels.find(h => h.id === selectedHotel),
                      },
                    };
                    navigate('/payment', { state: { booking: bookingData } });
                  }}
                >
                  Proceed to Payment →
                </Button>
                <Button 
                  onClick={() => setShowSummary(false)}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold text-base rounded-lg hover:scale-105 transition-all-smooth shadow-md"
                >
                  Edit Trip
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default CityPlanner;
