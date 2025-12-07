import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Plane, Clock, CheckCircle, Check } from "lucide-react";

const flightData = {
  Dubai: [
    { id: "dub-f1", airline: "Emirates", flightNumber: "EK101", class: "Economy", duration: "3h 15m", departure: "06:00 AM", arrival: "09:15 AM", price: 65000, features: ["Meals", "Entertainment"] },
    { id: "dub-f2", airline: "Emirates", flightNumber: "EK205", class: "Business", duration: "3h 15m", departure: "10:30 AM", arrival: "01:45 PM", price: 180000, features: ["Flat Bed", "Priority Boarding", "Lounge Access", "Gourmet Meals"] },
    { id: "dub-f3", airline: "Emirates", flightNumber: "EK342", class: "First Class", duration: "3h 15m", departure: "02:00 PM", arrival: "05:15 PM", price: 350000, features: ["Private Suite", "Shower Spa", "Chauffeur Service", "Premium Dining"] },
    { id: "dub-f4", airline: "PIA", flightNumber: "PK501", class: "Economy", duration: "3h 30m", departure: "07:15 AM", arrival: "10:45 AM", price: 52000, features: ["Meals", "Entertainment"] },
    { id: "dub-f5", airline: "Air Arabia", flightNumber: "G9202", class: "Economy", duration: "3h 25m", departure: "12:00 PM", arrival: "03:25 PM", price: 48000, features: ["Snacks", "Baggage"] },
    { id: "dub-f6", airline: "Fly Dubai", flightNumber: "FZ603", class: "Business", duration: "3h 20m", departure: "04:30 PM", arrival: "07:50 PM", price: 145000, features: ["Extra Legroom", "Priority Boarding", "Meals"] },
  ],
  London: [
    { id: "lon-f1", airline: "British Airways", flightNumber: "BA285", class: "Economy", duration: "8h 30m", departure: "10:00 AM", arrival: "06:30 PM", price: 95000, features: ["Meals", "Entertainment", "Baggage"] },
    { id: "lon-f2", airline: "British Airways", flightNumber: "BA401", class: "Business", duration: "8h 30m", departure: "12:00 PM", arrival: "08:30 PM", price: 280000, features: ["Flat Bed", "Lounge Access", "Premium Meals", "Priority"] },
    { id: "lon-f3", airline: "British Airways", flightNumber: "BA118", class: "First Class", duration: "8h 30m", departure: "02:00 PM", arrival: "10:30 PM", price: 520000, features: ["Private Suite", "Fine Dining", "Spa Service", "Chauffeur"] },
    { id: "lon-f4", airline: "PIA", flightNumber: "PK701", class: "Economy", duration: "9h 00m", departure: "06:00 AM", arrival: "03:00 PM", price: 78000, features: ["Meals", "Entertainment"] },
    { id: "lon-f5", airline: "Qatar Airways", flightNumber: "QR8", class: "Economy", duration: "8h 45m", departure: "08:30 AM", arrival: "05:15 PM", price: 88000, features: ["Meals", "Entertainment", "Extra Baggage"] },
    { id: "lon-f6", airline: "Qatar Airways", flightNumber: "QR9", class: "Business", duration: "8h 45m", departure: "04:00 PM", arrival: "12:45 AM", price: 295000, features: ["Qsuite", "Gourmet Dining", "Lounge", "Priority"] },
  ],
  "New York": [
    { id: "ny-f1", airline: "Emirates", flightNumber: "EK216", class: "Economy", duration: "14h 30m", departure: "10:00 PM", arrival: "10:30 AM", price: 145000, features: ["Meals", "Entertainment", "Baggage"] },
    { id: "ny-f2", airline: "Emirates", flightNumber: "EK318", class: "Business", duration: "14h 30m", departure: "08:00 PM", arrival: "08:30 AM", price: 420000, features: ["Flat Bed", "Shower Spa", "Lounge", "Premium Dining"] },
    { id: "ny-f3", airline: "Emirates", flightNumber: "EK444", class: "First Class", duration: "14h 30m", departure: "06:00 PM", arrival: "06:30 AM", price: 750000, features: ["Private Suite", "Shower", "Bar", "Chauffeur", "Caviar"] },
    { id: "ny-f4", airline: "PIA", flightNumber: "PK801", class: "Economy", duration: "15h 45m", departure: "11:15 PM", arrival: "11:00 AM", price: 125000, features: ["Meals", "Entertainment"] },
    { id: "ny-f5", airline: "Turkish Airlines", flightNumber: "TK54", class: "Economy", duration: "15h 15m", departure: "09:30 PM", arrival: "12:45 PM", price: 135000, features: ["Meals", "Entertainment", "Extra Legroom"] },
    { id: "ny-f6", airline: "Turkish Airlines", flightNumber: "TK56", class: "Business", duration: "15h 15m", departure: "07:00 PM", arrival: "10:15 AM", price: 385000, features: ["Flat Bed", "Lounge", "Priority", "Gourmet Meals"] },
  ],
  Istanbul: [
    { id: "ist-f1", airline: "Turkish Airlines", flightNumber: "TK702", class: "Economy", duration: "4h 45m", departure: "08:00 AM", arrival: "12:45 PM", price: 58000, features: ["Meals", "Entertainment"] },
    { id: "ist-f2", airline: "Turkish Airlines", flightNumber: "TK804", class: "Business", duration: "4h 45m", departure: "02:00 PM", arrival: "06:45 PM", price: 165000, features: ["Flat Bed", "Lounge Access", "Premium Meals", "Priority"] },
    { id: "ist-f3", airline: "Turkish Airlines", flightNumber: "TK906", class: "First Class", duration: "4h 45m", departure: "06:00 PM", arrival: "10:45 PM", price: 295000, features: ["Private Suite", "Chef Menu", "Spa", "Chauffeur"] },
    { id: "ist-f4", airline: "PIA", flightNumber: "PK603", class: "Economy", duration: "5h 00m", departure: "09:30 AM", arrival: "02:30 PM", price: 48000, features: ["Meals", "Baggage"] },
    { id: "ist-f5", airline: "Pegasus Airlines", flightNumber: "PC701", class: "Economy", duration: "5h 15m", departure: "01:00 PM", arrival: "06:15 PM", price: 42000, features: ["Snacks"] },
    { id: "ist-f6", airline: "Air Arabia", flightNumber: "G9452", class: "Economy", duration: "5h 10m", departure: "03:30 PM", arrival: "08:40 PM", price: 45000, features: ["Meals", "Baggage"] },
  ],
};

interface FlightSelectorProps {
  destination: string;
  numPeople: number;
  onSelect: (flight: any) => void;
  selectedFlightId?: string | null;
}

// Generate seat numbers based on flight class and number of people
const generateSeats = (flightClass: string, numPeople: number): string[] => {
  const seats: string[] = [];
  const rows = flightClass === "Economy" ? 30 : flightClass === "Business" ? 20 : 10;
  const charsPerRow = flightClass === "Economy" ? 6 : flightClass === "Business" ? 8 : 6; // Different widths for different classes
  
  // Assign sequential seats starting from row 1
  let seatIndex = 0;
  for (let row = 1; row <= rows && seats.length < numPeople; row++) {
    for (let col = 0; col < charsPerRow && seats.length < numPeople; col++) {
      const seatChar = String.fromCharCode(65 + col); // A, B, C, D, etc.
      seats.push(`${row}${seatChar}`);
      seatIndex++;
    }
  }
  
  return seats;
};

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
              <Card key={flight.id} className={`transition-all hover:shadow-lg ${selectedFlightId === flight.id ? 'ring-2 ring-primary border-primary' : ''}`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-bold text-lg">{flight.airline}</h3>
                        <Badge className="bg-blue-100 dark:bg-blue-900/40 text-blue-900 dark:text-blue-100 border border-blue-300 dark:border-blue-700">
                          {flight.flightNumber}
                        </Badge>
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
                      <div className="flex items-center justify-end gap-2 mb-2">
                        <div className="text-2xl font-bold text-primary">
                          PKR {flight.price.toLocaleString()}
                        </div>
                        {selectedFlightId === flight.id && (
                          <div className="bg-primary text-primary-foreground rounded-full p-1">
                            <Check className="h-5 w-5" />
                          </div>
                        )}
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
                        <Button 
                          onClick={() => {
                            const seats = generateSeats(flight.class, numPeople);
                            onSelect({...flight, seats});
                          }}
                          className={selectedFlightId === flight.id ? "bg-blue-500 hover:bg-blue-600 border-blue-600 text-white font-semibold" : ""}
                        >
                          {selectedFlightId === flight.id ? "Selected" : "Select Flight"}
                        </Button>
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
