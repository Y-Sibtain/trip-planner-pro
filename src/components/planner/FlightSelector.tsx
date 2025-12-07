import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Plane, Clock, CheckCircle } from "lucide-react";

const flightData = {
  Dubai: [
    { id: "dub-f1", airline: "Emirates", class: "Economy", duration: "3h 15m", departure: "06:00 AM", arrival: "09:15 AM", price: 65000, features: ["Meals", "Entertainment"] },
    { id: "dub-f2", airline: "Emirates", class: "Business", duration: "3h 15m", departure: "10:30 AM", arrival: "01:45 PM", price: 180000, features: ["Flat Bed", "Priority Boarding", "Lounge Access", "Gourmet Meals"] },
    { id: "dub-f3", airline: "Emirates", class: "First Class", duration: "3h 15m", departure: "02:00 PM", arrival: "05:15 PM", price: 350000, features: ["Private Suite", "Shower Spa", "Chauffeur Service", "Premium Dining"] },
    { id: "dub-f4", airline: "PIA", class: "Economy", duration: "3h 30m", departure: "07:15 AM", arrival: "10:45 AM", price: 52000, features: ["Meals", "Entertainment"] },
    { id: "dub-f5", airline: "Air Arabia", class: "Economy", duration: "3h 25m", departure: "12:00 PM", arrival: "03:25 PM", price: 48000, features: ["Snacks", "Baggage"] },
    { id: "dub-f6", airline: "Fly Dubai", class: "Business", duration: "3h 20m", departure: "04:30 PM", arrival: "07:50 PM", price: 145000, features: ["Extra Legroom", "Priority Boarding", "Meals"] },
  ],
  London: [
    { id: "lon-f1", airline: "British Airways", class: "Economy", duration: "8h 30m", departure: "10:00 AM", arrival: "06:30 PM", price: 95000, features: ["Meals", "Entertainment", "Baggage"] },
    { id: "lon-f2", airline: "British Airways", class: "Business", duration: "8h 30m", departure: "12:00 PM", arrival: "08:30 PM", price: 280000, features: ["Flat Bed", "Lounge Access", "Premium Meals", "Priority"] },
    { id: "lon-f3", airline: "British Airways", class: "First Class", duration: "8h 30m", departure: "02:00 PM", arrival: "10:30 PM", price: 520000, features: ["Private Suite", "Fine Dining", "Spa Service", "Chauffeur"] },
    { id: "lon-f4", airline: "PIA", class: "Economy", duration: "9h 00m", departure: "06:00 AM", arrival: "03:00 PM", price: 78000, features: ["Meals", "Entertainment"] },
    { id: "lon-f5", airline: "Qatar Airways", class: "Economy", duration: "8h 45m", departure: "08:30 AM", arrival: "05:15 PM", price: 88000, features: ["Meals", "Entertainment", "Extra Baggage"] },
    { id: "lon-f6", airline: "Qatar Airways", class: "Business", duration: "8h 45m", departure: "04:00 PM", arrival: "12:45 AM", price: 295000, features: ["Qsuite", "Gourmet Dining", "Lounge", "Priority"] },
  ],
  "New York": [
    { id: "ny-f1", airline: "Emirates", class: "Economy", duration: "14h 30m", departure: "10:00 PM", arrival: "10:30 AM", price: 145000, features: ["Meals", "Entertainment", "Baggage"] },
    { id: "ny-f2", airline: "Emirates", class: "Business", duration: "14h 30m", departure: "08:00 PM", arrival: "08:30 AM", price: 420000, features: ["Flat Bed", "Shower Spa", "Lounge", "Premium Dining"] },
    { id: "ny-f3", airline: "Emirates", class: "First Class", duration: "14h 30m", departure: "06:00 PM", arrival: "06:30 AM", price: 750000, features: ["Private Suite", "Shower", "Bar", "Chauffeur", "Caviar"] },
    { id: "ny-f4", airline: "PIA", class: "Economy", duration: "15h 45m", departure: "11:15 PM", arrival: "11:00 AM", price: 125000, features: ["Meals", "Entertainment"] },
    { id: "ny-f5", airline: "Turkish Airlines", class: "Economy", duration: "15h 15m", departure: "09:30 PM", arrival: "12:45 PM", price: 135000, features: ["Meals", "Entertainment", "Extra Legroom"] },
    { id: "ny-f6", airline: "Turkish Airlines", class: "Business", duration: "15h 15m", departure: "07:00 PM", arrival: "10:15 AM", price: 385000, features: ["Flat Bed", "Lounge", "Priority", "Gourmet Meals"] },
  ],
  Istanbul: [
    { id: "ist-f1", airline: "Turkish Airlines", class: "Economy", duration: "4h 45m", departure: "08:00 AM", arrival: "12:45 PM", price: 58000, features: ["Meals", "Entertainment"] },
    { id: "ist-f2", airline: "Turkish Airlines", class: "Business", duration: "4h 45m", departure: "02:00 PM", arrival: "06:45 PM", price: 165000, features: ["Flat Bed", "Lounge Access", "Premium Meals", "Priority"] },
    { id: "ist-f3", airline: "Turkish Airlines", class: "First Class", duration: "4h 45m", departure: "06:00 PM", arrival: "10:45 PM", price: 295000, features: ["Private Suite", "Chef Menu", "Spa", "Chauffeur"] },
    { id: "ist-f4", airline: "PIA", class: "Economy", duration: "5h 00m", departure: "09:30 AM", arrival: "02:30 PM", price: 48000, features: ["Meals", "Baggage"] },
    { id: "ist-f5", airline: "Pegasus Airlines", class: "Economy", duration: "5h 15m", departure: "01:00 PM", arrival: "06:15 PM", price: 42000, features: ["Snacks"] },
    { id: "ist-f6", airline: "Air Arabia", class: "Economy", duration: "5h 10m", departure: "03:30 PM", arrival: "08:40 PM", price: 45000, features: ["Meals", "Baggage"] },
  ],
};

interface FlightSelectorProps {
  destination: string;
  numPeople: number;
  onSelect: (flight: any) => void;
  selectedFlightId?: string | null;
}

const FlightSelector = ({ destination, numPeople, onSelect, selectedFlightId }: FlightSelectorProps) => {
  const [sortOrder, setSortOrder] = useState<"asc" | "desc" | "default">("default");
  const flights = flightData[destination as keyof typeof flightData] || [];

  // Sort flights based on sort order
  const sortedFlights = (() => {
    const flightsCopy = [...flights];
    if (sortOrder === "asc") {
      return flightsCopy.sort((a, b) => a.price - b.price);
    } else if (sortOrder === "desc") {
      return flightsCopy.sort((a, b) => b.price - a.price);
    }
    return flightsCopy;
  })();

  return (
    <div className="space-y-6">
      {/* Sort Options */}
      <div className="flex items-center gap-3 pb-4 border-b border-gray-200 dark:border-gray-700">
        <label className="text-sm font-semibold text-gray-900 dark:text-white">
          Sort by Price:
        </label>
        <Select value={sortOrder} onValueChange={(val) => setSortOrder(val as any)}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="default">Default</SelectItem>
            <SelectItem value="asc">Low to High</SelectItem>
            <SelectItem value="desc">High to Low</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* All Flights in One Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plane className="h-5 w-5" />
            Available Flights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {sortedFlights.map((flight) => (
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
                      
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                        <Clock className="h-4 w-4" />
                        <span>{flight.departure} - {flight.arrival} ({flight.duration})</span>
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
                          <Button disabled className="opacity-100 bg-green-500 hover:bg-green-600 border-green-600 text-white font-semibold">
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
    </div>
  );
};

export default FlightSelector;
