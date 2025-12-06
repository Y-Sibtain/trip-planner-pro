import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plane, Clock, CheckCircle } from "lucide-react";

const flightData = {
  Dubai: [
    { id: "dub-f1", airline: "Emirates", class: "Economy", duration: "3h 15m", price: 65000, features: ["Meals", "Entertainment"] },
    { id: "dub-f2", airline: "Emirates", class: "Business", duration: "3h 15m", price: 180000, features: ["Flat Bed", "Priority Boarding", "Lounge Access", "Gourmet Meals"] },
    { id: "dub-f3", airline: "Emirates", class: "First Class", duration: "3h 15m", price: 350000, features: ["Private Suite", "Shower Spa", "Chauffeur Service", "Premium Dining"] },
    { id: "dub-f4", airline: "PIA", class: "Economy", duration: "3h 30m", price: 52000, features: ["Meals", "Entertainment"] },
    { id: "dub-f5", airline: "Air Arabia", class: "Economy", duration: "3h 25m", price: 48000, features: ["Snacks", "Baggage"] },
    { id: "dub-f6", airline: "Fly Dubai", class: "Business", duration: "3h 20m", price: 145000, features: ["Extra Legroom", "Priority Boarding", "Meals"] },
  ],
  London: [
    { id: "lon-f1", airline: "British Airways", class: "Economy", duration: "8h 30m", price: 95000, features: ["Meals", "Entertainment", "Baggage"] },
    { id: "lon-f2", airline: "British Airways", class: "Business", duration: "8h 30m", price: 280000, features: ["Flat Bed", "Lounge Access", "Premium Meals", "Priority"] },
    { id: "lon-f3", airline: "British Airways", class: "First Class", duration: "8h 30m", price: 520000, features: ["Private Suite", "Fine Dining", "Spa Service", "Chauffeur"] },
    { id: "lon-f4", airline: "PIA", class: "Economy", duration: "9h 00m", price: 78000, features: ["Meals", "Entertainment"] },
    { id: "lon-f5", airline: "Qatar Airways", class: "Economy", duration: "8h 45m", price: 88000, features: ["Meals", "Entertainment", "Extra Baggage"] },
    { id: "lon-f6", airline: "Qatar Airways", class: "Business", duration: "8h 45m", price: 295000, features: ["Qsuite", "Gourmet Dining", "Lounge", "Priority"] },
  ],
  "New York": [
    { id: "ny-f1", airline: "Emirates", class: "Economy", duration: "14h 30m", price: 145000, features: ["Meals", "Entertainment", "Baggage"] },
    { id: "ny-f2", airline: "Emirates", class: "Business", duration: "14h 30m", price: 420000, features: ["Flat Bed", "Shower Spa", "Lounge", "Premium Dining"] },
    { id: "ny-f3", airline: "Emirates", class: "First Class", duration: "14h 30m", price: 750000, features: ["Private Suite", "Shower", "Bar", "Chauffeur", "Caviar"] },
    { id: "ny-f4", airline: "PIA", class: "Economy", duration: "15h 45m", price: 125000, features: ["Meals", "Entertainment"] },
    { id: "ny-f5", airline: "Turkish Airlines", class: "Economy", duration: "15h 15m", price: 135000, features: ["Meals", "Entertainment", "Extra Legroom"] },
    { id: "ny-f6", airline: "Turkish Airlines", class: "Business", duration: "15h 15m", price: 385000, features: ["Flat Bed", "Lounge", "Priority", "Gourmet Meals"] },
  ],
  Istanbul: [
    { id: "ist-f1", airline: "Turkish Airlines", class: "Economy", duration: "4h 45m", price: 58000, features: ["Meals", "Entertainment"] },
    { id: "ist-f2", airline: "Turkish Airlines", class: "Business", duration: "4h 45m", price: 165000, features: ["Flat Bed", "Lounge Access", "Premium Meals", "Priority"] },
    { id: "ist-f3", airline: "Turkish Airlines", class: "First Class", duration: "4h 45m", price: 295000, features: ["Private Suite", "Chef Menu", "Spa", "Chauffeur"] },
    { id: "ist-f4", airline: "PIA", class: "Economy", duration: "5h 00m", price: 48000, features: ["Meals", "Baggage"] },
    { id: "ist-f5", airline: "Pegasus Airlines", class: "Economy", duration: "5h 15m", price: 42000, features: ["Snacks"] },
    { id: "ist-f6", airline: "Air Arabia", class: "Economy", duration: "5h 10m", price: 45000, features: ["Meals", "Baggage"] },
  ],
};

interface FlightSelectorProps {
  destination: string;
  numPeople: number;
  onSelect: (flight: any) => void;
  selectedFlightId?: string | null;
}

const FlightSelector = ({ destination, numPeople, onSelect, selectedFlightId }: FlightSelectorProps) => {
  const flights = flightData[destination as keyof typeof flightData] || [];

  const categories = {
    Economy: flights.filter(f => f.class === "Economy"),
    Business: flights.filter(f => f.class === "Business"),
    "First Class": flights.filter(f => f.class === "First Class"),
  };

  return (
    <div className="space-y-6">
      {Object.entries(categories).map(([className, classFlights]) => (
        classFlights.length > 0 && (
          <Card key={className}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plane className="h-5 w-5" />
                {className}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {classFlights.map((flight) => (
                  <Card key={flight.id} className="transition-all hover:shadow-lg">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-bold text-lg">{flight.airline}</h3>
                            <Badge 
                              variant="secondary" 
                              className={
                                flight.class === "Economy" 
                                  ? "bg-green-500 text-white" 
                                  : flight.class === "Business"
                                  ? "bg-red-500 text-white"
                                  : flight.class === "First Class"
                                  ? "bg-yellow-500 text-white"
                                  : ""
                              }
                            >
                              {flight.class}
                            </Badge>
                          </div>
                          
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                            <Clock className="h-4 w-4" />
                            <span>{flight.duration}</span>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            {flight.features.map((feature, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                {feature}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-2xl font-bold text-primary mb-1">
                            PKR {flight.price.toLocaleString()}
                          </div>
                          <div className="text-sm text-muted-foreground mb-2">
                            per person
                          </div>
                          {numPeople > 1 && (
                            <div className="text-sm font-semibold mb-2">
                              Total: PKR {(flight.price * numPeople).toLocaleString()}
                            </div>
                          )}
                          <div>
                            {selectedFlightId === flight.id ? (
                              <Button disabled className="opacity-90 bg-green-600 border-green-600">
                                Selected
                              </Button>
                            ) : (
                              <Button onClick={() => onSelect(flight)}>
                                Select Flight
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )
      ))}
    </div>
  );
};

export default FlightSelector;
