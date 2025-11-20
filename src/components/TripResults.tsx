import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Hotel, Utensils, Plane, MapPin, DollarSign } from "lucide-react";
import type { TripFormData } from "./TripPlannerForm";

interface TripResultsProps {
  tripData: TripFormData;
}

interface OptionItem {
  name: string;
  price: number;
  description: string;
  rating?: number;
}

export const TripResults = ({ tripData }: TripResultsProps) => {
  const totalBudget = parseFloat(tripData.budget);
  const numDestinations = tripData.destinations.length;
  
  // Budget allocation: 40% accommodation, 30% food, 30% transport
  const accommodationBudget = totalBudget * 0.4;
  const foodBudget = totalBudget * 0.3;
  const transportBudget = totalBudget * 0.3;

  // Generate mock data based on budget
  const generateAccommodations = (): OptionItem[] => {
    const perDestinationBudget = accommodationBudget / numDestinations;
    const options: OptionItem[] = [];
    
    tripData.destinations.forEach((dest) => {
      options.push({
        name: `Luxury Hotel in ${dest}`,
        price: Math.round(perDestinationBudget * 0.8),
        description: "5-star hotel with ocean view, spa, and breakfast included",
        rating: 4.8,
      });
      options.push({
        name: `Boutique Hotel in ${dest}`,
        price: Math.round(perDestinationBudget * 0.5),
        description: "4-star centrally located hotel with modern amenities",
        rating: 4.5,
      });
      options.push({
        name: `Budget Hotel in ${dest}`,
        price: Math.round(perDestinationBudget * 0.3),
        description: "3-star clean and comfortable accommodation",
        rating: 4.2,
      });
    });
    
    return options;
  };

  const generateFood = (): OptionItem[] => {
    const dailyFoodBudget = foodBudget / 7; // Assuming 7 days average
    return [
      {
        name: "Premium Dining Plan",
        price: Math.round(dailyFoodBudget * 0.8 * 7),
        description: "Fine dining restaurants with local cuisine specialties",
        rating: 4.7,
      },
      {
        name: "Standard Dining Plan",
        price: Math.round(dailyFoodBudget * 0.5 * 7),
        description: "Mix of restaurants and casual dining experiences",
        rating: 4.4,
      },
      {
        name: "Budget Dining Plan",
        price: Math.round(dailyFoodBudget * 0.3 * 7),
        description: "Local eateries and street food favorites",
        rating: 4.1,
      },
    ];
  };

  const generateTransport = (): OptionItem[] => {
    return [
      {
        name: "Business Class Flights",
        price: Math.round(transportBudget * 0.7),
        description: "Direct flights with lounge access and extra legroom",
        rating: 4.9,
      },
      {
        name: "Economy Flights + Car Rental",
        price: Math.round(transportBudget * 0.5),
        description: "Economy flights with flexible car rental included",
        rating: 4.5,
      },
      {
        name: "Budget Travel Package",
        price: Math.round(transportBudget * 0.3),
        description: "Economy flights with public transportation passes",
        rating: 4.0,
      },
    ];
  };

  const accommodations = generateAccommodations();
  const foodOptions = generateFood();
  const transportOptions = generateTransport();

  const OptionCard = ({ icon: Icon, title, items, color }: { 
    icon: any; 
    title: string; 
    items: OptionItem[];
    color: string;
  }) => (
    <Card className="shadow-card hover:shadow-card-hover transition-all duration-300">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon className={`h-5 w-5 ${color}`} />
          {title}
        </CardTitle>
        <CardDescription>Choose the option that fits your budget</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((item, idx) => (
          <div
            key={idx}
            className="p-4 rounded-lg border border-border hover:border-primary bg-gradient-card transition-all duration-200 cursor-pointer hover:scale-[1.02]"
          >
            <div className="flex justify-between items-start mb-2">
              <h4 className="font-semibold text-foreground">{item.name}</h4>
              <Badge variant="secondary" className="ml-2">
                ${item.price.toLocaleString()}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-2">{item.description}</p>
            {item.rating && (
              <div className="flex items-center gap-1 text-sm text-secondary">
                <span>⭐</span>
                <span className="font-medium">{item.rating}</span>
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Trip Summary */}
      <Card className="shadow-card bg-gradient-hero text-primary-foreground">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <MapPin className="h-6 w-6" />
            Your Trip Plan
          </CardTitle>
          <CardDescription className="text-primary-foreground/80">
            {tripData.destinations.join(" → ")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <DollarSign className="h-5 w-5" />
              <div>
                <p className="text-sm opacity-90">Total Budget</p>
                <p className="text-xl font-bold">${totalBudget.toLocaleString()}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Hotel className="h-5 w-5" />
              <div>
                <p className="text-sm opacity-90">Accommodation</p>
                <p className="text-xl font-bold">${Math.round(accommodationBudget).toLocaleString()}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Utensils className="h-5 w-5" />
              <div>
                <p className="text-sm opacity-90">Food & Transport</p>
                <p className="text-xl font-bold">${Math.round(foodBudget + transportBudget).toLocaleString()}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Options Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <OptionCard
          icon={Hotel}
          title="Accommodation"
          items={accommodations}
          color="text-primary"
        />
        <OptionCard
          icon={Utensils}
          title="Food & Dining"
          items={foodOptions}
          color="text-secondary"
        />
        <OptionCard
          icon={Plane}
          title="Transportation"
          items={transportOptions}
          color="text-accent"
        />
      </div>
    </div>
  );
};
