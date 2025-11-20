import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, DollarSign, Calendar, Search } from "lucide-react";

interface TripPlannerFormProps {
  onSearch: (data: TripFormData) => void;
}

export interface TripFormData {
  source: string;
  destinations: string[];
  budget: string;
  startDate: string;
  endDate: string;
}

export const TripPlannerForm = ({ onSearch }: TripPlannerFormProps) => {
  const [source, setSource] = useState("");
  const [destination1, setDestination1] = useState("");
  const [destination2, setDestination2] = useState("");
  const [destination3, setDestination3] = useState("");
  const [budget, setBudget] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const destinations = [destination1, destination2, destination3].filter(d => d.trim() !== "");
    
    if (!source.trim() || destinations.length === 0 || !budget || !startDate || !endDate) {
      return;
    }

    onSearch({
      source: source.trim(),
      destinations,
      budget,
      startDate,
      endDate,
    });
  };

  return (
    <Card className="shadow-card hover:shadow-card-hover transition-shadow duration-300">
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="source" className="flex items-center gap-2 text-foreground">
                <MapPin className="h-4 w-4 text-accent" />
                Flying From (Source) *
              </Label>
              <Input
                id="source"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                placeholder="e.g., New York"
                required
                className="transition-all duration-200 focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="destination1" className="flex items-center gap-2 text-foreground">
                <MapPin className="h-4 w-4 text-primary" />
                Destination 1 (Required)
              </Label>
              <Input
                id="destination1"
                value={destination1}
                onChange={(e) => setDestination1(e.target.value)}
                placeholder="e.g., Paris, France"
                required
                className="transition-all duration-200 focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="destination2" className="flex items-center gap-2 text-foreground">
                <MapPin className="h-4 w-4 text-primary" />
                Destination 2 (Optional)
              </Label>
              <Input
                id="destination2"
                value={destination2}
                onChange={(e) => setDestination2(e.target.value)}
                placeholder="e.g., Rome, Italy"
                className="transition-all duration-200 focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="destination3" className="flex items-center gap-2 text-foreground">
                <MapPin className="h-4 w-4 text-primary" />
                Destination 3 (Optional)
              </Label>
              <Input
                id="destination3"
                value={destination3}
                onChange={(e) => setDestination3(e.target.value)}
                placeholder="e.g., Barcelona, Spain"
                className="transition-all duration-200 focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="budget" className="flex items-center gap-2 text-foreground">
              <DollarSign className="h-4 w-4 text-secondary" />
              Total Budget (USD)
            </Label>
            <Input
              id="budget"
              type="number"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              placeholder="e.g., 5000"
              required
              min="100"
              className="transition-all duration-200 focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate" className="flex items-center gap-2 text-foreground">
                <Calendar className="h-4 w-4 text-primary" />
                Start Date
              </Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                className="transition-all duration-200 focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate" className="flex items-center gap-2 text-foreground">
                <Calendar className="h-4 w-4 text-primary" />
                End Date
              </Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
                min={startDate}
                className="transition-all duration-200 focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold transition-all duration-200"
          >
            <Search className="mr-2 h-5 w-5" />
            Plan My Trip
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default TripPlannerForm;
