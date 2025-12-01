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

const hotels = {
  Dubai: [
    { id: "dub1", name: "Burj Al Arab", stars: 5, price: "$800-1200", image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400" },
    { id: "dub2", name: "Atlantis The Palm", stars: 5, price: "$600-900", image: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=400" },
    { id: "dub3", name: "Jumeirah Beach Hotel", stars: 5, price: "$500-800", image: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400" },
    { id: "dub4", name: "Rove Downtown", stars: 4, price: "$200-350", image: "https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=400" },
    { id: "dub5", name: "Holiday Inn Express", stars: 4, price: "$150-250", image: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=400" },
    { id: "dub6", name: "Ibis Al Barsha", stars: 4, price: "$100-180", image: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=400" },
  ],
  London: [
    { id: "lon1", name: "The Ritz London", stars: 5, price: "$700-1100", image: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=400" },
    { id: "lon2", name: "Savoy Hotel", stars: 5, price: "$650-1000", image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400" },
    { id: "lon3", name: "Shangri-La The Shard", stars: 5, price: "$600-950", image: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=400" },
    { id: "lon4", name: "Premier Inn City", stars: 4, price: "$180-280", image: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400" },
    { id: "lon5", name: "Holiday Inn Kensington", stars: 4, price: "$150-240", image: "https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=400" },
    { id: "lon6", name: "Travelodge Central", stars: 4, price: "$120-200", image: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=400" },
  ],
  "New York": [
    { id: "ny1", name: "The Plaza", stars: 5, price: "$900-1500", image: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=400" },
    { id: "ny2", name: "St. Regis New York", stars: 5, price: "$850-1400", image: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=400" },
    { id: "ny3", name: "The Peninsula", stars: 5, price: "$800-1300", image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400" },
    { id: "ny4", name: "Pod Times Square", stars: 4, price: "$250-380", image: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=400" },
    { id: "ny5", name: "Hampton Inn Manhattan", stars: 4, price: "$220-340", image: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400" },
    { id: "ny6", name: "Holiday Inn Express", stars: 4, price: "$180-290", image: "https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=400" },
  ],
  Istanbul: [
    { id: "ist1", name: "Çırağan Palace", stars: 5, price: "$600-1000", image: "https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=400" },
    { id: "ist2", name: "Four Seasons Sultanahmet", stars: 5, price: "$550-900", image: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=400" },
    { id: "ist3", name: "Swissôtel The Bosphorus", stars: 5, price: "$500-850", image: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=400" },
    { id: "ist4", name: "Ramada by Wyndham", stars: 4, price: "$150-250", image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400" },
    { id: "ist5", name: "Holiday Inn Old City", stars: 4, price: "$130-220", image: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=400" },
    { id: "ist6", name: "Best Western Taksim", stars: 4, price: "$100-180", image: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400" },
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
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-4 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold">City Trip Planner</h1>
            <p className="text-muted-foreground mt-1">Plan your perfect {numDays}-day adventure</p>
          </div>
          <Link to="/" onClick={() => window.history.back()}>
            <Button variant="outline">← Back</Button>
          </Link>
        </div>

        {/* City Selection */}
        {step === "city" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Choose Your Destination
              </CardTitle>
              <CardDescription>Select a city</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-semibold mb-3">Select Destination</h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {cities.map((city) => (
                    <Card
                      key={city.name}
                      className="cursor-pointer transition-all hover:scale-105 hover:shadow-lg"
                      onClick={() => handleCitySelect(city.name)}
                    >
                      <CardContent className="p-6 text-center">
                        <div className="text-5xl mb-3">{city.emoji}</div>
                        <h3 className="font-semibold text-lg">{city.name}</h3>
                        <Badge className="mt-2" variant="secondary">{numDays} Days</Badge>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Flight Selection */}
        {step === "flight" && selectedCity && (
          <>
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl flex items-center gap-2">
                      <Plane className="h-6 w-6" />
                      Select Your Flight to {selectedCity}
                    </CardTitle>
                  </div>
                  <Button variant="outline" onClick={() => navigate('/')}>
                    ← Back
                  </Button>
                </div>
              </CardHeader>
            </Card>
            
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
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl">Select Your Hotel</CardTitle>
                    <CardDescription>Choose from our curated accommodations in {selectedCity}</CardDescription>
                  </div>
                  <Button variant="outline" onClick={() => setStep("flight")}>
                    ← Back
                  </Button>
                </div>
              </CardHeader>
            </Card>

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
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl">Your {numDays}-Day Itinerary</CardTitle>
                    <CardDescription>Activities and dining recommendations</CardDescription>
                  </div>
                  <Button variant="outline" onClick={() => setStep("hotel")}>
                    ← Back
                  </Button>
                </div>
              </CardHeader>
            </Card>

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
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl">Booking Summary</DialogTitle>
              <DialogDescription>Review your complete {selectedCity} trip</DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 mt-4">
              <div>
                <h3 className="font-semibold mb-2">Travelers:</h3>
                <Badge variant="secondary">{numPeople} {numPeople === 1 ? "person" : "people"}</Badge>
              </div>

              {selectedFlight && (
                <div>
                  <h3 className="font-semibold mb-2">Selected Flight:</h3>
                  <div className="bg-muted p-3 rounded-lg">
                    <p className="font-medium">{selectedFlight.airline}</p>
                    <p className="text-sm text-muted-foreground">{selectedFlight.class}</p>
                    <p className="text-sm font-semibold mt-1">PKR {(selectedFlight.price * numPeople).toLocaleString()}</p>
                  </div>
                </div>
              )}

              {selectedHotel && (
                <div>
                  <h3 className="font-semibold mb-2">Selected Hotel:</h3>
                  <div className="bg-muted p-3 rounded-lg">
                    <p className="font-medium">{cityHotels.find(h => h.id === selectedHotel)?.name}</p>
                    <div className="flex items-center gap-1 mt-1">
                      {Array.from({ length: cityHotels.find(h => h.id === selectedHotel)?.stars || 0 }).map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <Link to="/payment" className="flex-1">
                  <Button className="w-full">Proceed to Payment</Button>
                </Link>
                <Button variant="outline" onClick={() => setShowSummary(false)}>
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
