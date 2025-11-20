import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TripFormData } from "./TripPlannerForm";
import { Bed, Utensils, Car, Star, Check } from "lucide-react";
import { useBooking, OptionItem } from "@/contexts/BookingContext";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

interface TripResultsProps {
  tripData: TripFormData;
}

const TripResults = ({ tripData }: TripResultsProps) => {
  const { addItem, selectedItems, setTripData, isAuthenticated } = useBooking();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Update trip data in context
  React.useEffect(() => {
    setTripData(tripData);
  }, [tripData, setTripData]);

  const isSelected = (itemId: string) => {
    return selectedItems.some(item => item.id === itemId);
  };

  const handleSelect = (item: OptionItem) => {
    addItem(item);
    toast({
      title: "Item added",
      description: `${item.name} has been added to your selection.`,
    });
  };

  const handleProceedToBooking = () => {
    if (!isAuthenticated) {
      toast({
        title: "Sign in required",
        description: "Please sign in to proceed with booking.",
        variant: "destructive",
      });
      navigate('/auth');
      return;
    }

    if (selectedItems.length === 0) {
      toast({
        title: "No items selected",
        description: "Please select at least one option to proceed.",
        variant: "destructive",
      });
      return;
    }

    navigate('/booking');
  };

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
    
    tripData.destinations.forEach((dest, idx) => {
      options.push({
        id: `acc-1-${dest}-${idx}`,
        type: 'accommodation',
        name: `Luxury Hotel in ${dest}`,
        price: Math.round(perDestinationBudget * 0.8),
        description: "5-star hotel with ocean view, spa, and breakfast included",
        rating: 4.8,
      });
      options.push({
        id: `acc-2-${dest}-${idx}`,
        type: 'accommodation',
        name: `Boutique Hotel in ${dest}`,
        price: Math.round(perDestinationBudget * 0.5),
        description: "4-star centrally located hotel with modern amenities",
        rating: 4.5,
      });
      options.push({
        id: `acc-3-${dest}-${idx}`,
        type: 'accommodation',
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
        id: 'food-1',
        type: 'food',
        name: "Premium Dining Plan",
        price: Math.round(dailyFoodBudget * 0.8 * 7),
        description: "Fine dining restaurants with local cuisine specialties",
        rating: 4.7,
      },
      {
        id: 'food-2',
        type: 'food',
        name: "Standard Dining Plan",
        price: Math.round(dailyFoodBudget * 0.5 * 7),
        description: "Mix of restaurants and casual dining experiences",
        rating: 4.4,
      },
      {
        id: 'food-3',
        type: 'food',
        name: "Budget Dining Plan",
        price: Math.round(dailyFoodBudget * 0.3 * 7),
        description: "Local eateries and street food favorites",
        rating: 4.1,
      },
    ];
  };

  const generateTransport = (): OptionItem[] => {
    const source = tripData.source;
    const destination = tripData.destinations[0];
    return [
      {
        id: `trans-1-${source}-${destination}`,
        type: 'transport',
        name: "Business Class Flights",
        price: Math.round(transportBudget * 0.7),
        description: `Direct flights from ${source} to ${destination} with lounge access and extra legroom`,
        rating: 4.9,
      },
      {
        id: `trans-2-${source}-${destination}`,
        type: 'transport',
        name: "Economy Flights + Car Rental",
        price: Math.round(transportBudget * 0.5),
        description: `Economy flights from ${source} to ${destination} with flexible car rental included`,
        rating: 4.5,
      },
      {
        id: `trans-3-${source}-${destination}`,
        type: 'transport',
        name: "Budget Travel Package",
        price: Math.round(transportBudget * 0.3),
        description: `Multiple stops from ${source} to ${destination} with public transportation passes`,
        rating: 4.0,
      },
    ];
  };

  const accommodations = generateAccommodations();
  const food = generateFood();
  const transport = generateTransport();

  const OptionCard = ({ title, icon: Icon, options, type }: { 
    title: string; 
    icon: any; 
    options: OptionItem[]; 
    type: 'accommodation' | 'food' | 'transport' 
  }) => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon className="w-5 h-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {options.map((option) => {
            const selected = isSelected(option.id);
            return (
              <div key={option.id} className={`p-4 border rounded-lg transition-all ${selected ? 'border-primary bg-primary/5' : 'hover:border-primary'}`}>
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-semibold">{option.name}</h4>
                  <span className="text-lg font-bold text-primary">${option.price}</span>
                </div>
                <p className="text-sm text-muted-foreground mb-2">{option.description}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-sm">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400 mr-1" />
                    <span>{option.rating.toFixed(1)}</span>
                  </div>
                  <Button
                    size="sm"
                    variant={selected ? "default" : "outline"}
                    onClick={() => handleSelect(option)}
                  >
                    {selected ? (
                      <>
                        <Check className="w-4 h-4 mr-1" />
                        Selected
                      </>
                    ) : (
                      'Select'
                    )}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Your Trip Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">From:</span>
              <span className="ml-2 font-medium">{tripData.source}</span>
            </div>
            <div>
              <span className="text-muted-foreground">To:</span>
              <span className="ml-2 font-medium">{tripData.destinations.join(", ")}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Dates:</span>
              <span className="ml-2 font-medium">{tripData.startDate} to {tripData.endDate}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Total Budget:</span>
              <span className="ml-2 font-bold text-primary">${totalBudget}</span>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t">
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Accommodation</span>
                <p className="font-semibold">${accommodationBudget.toFixed(0)}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Food</span>
                <p className="font-semibold">${foodBudget.toFixed(0)}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Transport</span>
                <p className="font-semibold">${transportBudget.toFixed(0)}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <OptionCard title="Accommodation Options" icon={Bed} options={accommodations} type="accommodation" />
      <OptionCard title="Food & Dining" icon={Utensils} options={food} type="food" />
      <OptionCard title="Transportation" icon={Car} options={transport} type="transport" />
      
      {selectedItems.length > 0 && (
        <Card className="sticky bottom-4 shadow-lg">
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <h3 className="font-semibold">{selectedItems.length} item{selectedItems.length !== 1 ? 's' : ''} selected</h3>
              <p className="text-sm text-muted-foreground">
                Total: ${selectedItems.reduce((sum, item) => sum + item.price, 0)}
              </p>
            </div>
            <Button onClick={handleProceedToBooking} size="lg">
              Proceed to Booking
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TripResults;
