import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, Check, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const hotelFacilities: { [key: number]: string[] } = {
  5: ["Free WiFi", "Pool", "Spa", "Fine Dining", "Gym", "Valet Parking", "24/7 Room Service", "Concierge"],
  4: ["Free WiFi", "Pool", "Breakfast", "Gym", "Free Parking", "Restaurant"],
};

interface HotelCardProps {
  hotel: {
    id: string;
    name: string;
    stars: number;
    price: string;
    image: string;
  };
  isSelected: boolean;
  onSelect: () => void;
}

const HotelCard = ({ hotel, isSelected, onSelect }: HotelCardProps) => {
  const [showDetails, setShowDetails] = useState(false);
  const facilities = hotelFacilities[hotel.stars] || [];

  return (
    <Card
      className={cn(
        "transition-all hover:shadow-lg relative overflow-hidden",
        isSelected && "ring-2 ring-primary"
      )}
    >
      {isSelected && (
        <div className="absolute top-2 right-2 z-10 bg-primary text-primary-foreground rounded-full p-1">
          <Check className="h-5 w-5" />
        </div>
      )}
      
      <div className="h-48 overflow-hidden cursor-pointer" onClick={() => setShowDetails(!showDetails)}>
        <img
          src={hotel.image}
          alt={hotel.name}
          className="w-full h-full object-cover transition-transform hover:scale-110"
        />
      </div>
      
      <CardContent className="p-4 space-y-3">
        <div>
          <h3 className="font-semibold text-lg mb-1">{hotel.name}</h3>
          
          <div className="flex items-center gap-1 mb-2">
            {Array.from({ length: hotel.stars }).map((_, i) => (
              <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            ))}
          </div>
        </div>

        {showDetails && (
          <div className="space-y-2 border-t pt-3">
            <p className="text-sm font-medium">Facilities:</p>
            <div className="grid grid-cols-2 gap-2">
              {facilities.map((facility, idx) => (
                <div key={idx} className="flex items-center gap-1 text-xs text-muted-foreground">
                  <CheckCircle className="h-3 w-3 text-green-600" />
                  <span>{facility}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        
        <div className="flex items-center justify-between pt-2">
          <Badge className="text-sm bg-blue-500 hover:bg-blue-600 text-white">{hotel.price}/night</Badge>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowDetails(!showDetails)}
            >
              {showDetails ? "Hide" : "Details"}
            </Button>
            <Button
              size="sm"
              variant={isSelected ? "default" : "outline"}
              onClick={onSelect}
            >
              {isSelected ? "Selected" : "Select"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default HotelCard;
