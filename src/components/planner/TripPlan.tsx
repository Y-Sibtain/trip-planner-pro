import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Utensils, MapPin, RefreshCw, ChevronDown } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

const tripData = {
  Dubai: {
    activities: [
      { name: "Burj Khalifa Tour", desc: "Visit the world's tallest building", time: "Morning" },
      { name: "Desert Safari", desc: "Dune bashing and camel rides", time: "Evening" },
      { name: "Dubai Mall", desc: "Shopping and aquarium visit", time: "Afternoon" },
      { name: "Palm Jumeirah", desc: "Explore the iconic island", time: "Morning" },
      { name: "Dubai Marina Cruise", desc: "Dinner cruise on a dhow", time: "Evening" },
    ],
    restaurants: [
      { name: "Al Nafoorah", cuisine: "Lebanese", price: "PKR 8,000", rating: "4.8" },
      { name: "Atmosphere", cuisine: "International", price: "PKR 25,000", rating: "4.9" },
      { name: "Pierchic", cuisine: "Seafood", price: "PKR 18,000", rating: "4.7" },
      { name: "Al Mallah", cuisine: "Arabic", price: "PKR 3,500", rating: "4.6" },
      { name: "Ravi Restaurant", cuisine: "Pakistani", price: "PKR 2,500", rating: "4.5" },
      { name: "The Cheesecake Factory", cuisine: "American", price: "PKR 7,000", rating: "4.6" },
      { name: "Zuma", cuisine: "Japanese", price: "PKR 22,000", rating: "4.8" },
    ],
  },
  London: {
    activities: [
      { name: "Tower of London", desc: "Historic castle tour", time: "Morning" },
      { name: "British Museum", desc: "World artifacts and history", time: "Afternoon" },
      { name: "Thames Cruise", desc: "Scenic river tour", time: "Evening" },
      { name: "Buckingham Palace", desc: "Royal residence visit", time: "Morning" },
      { name: "West End Show", desc: "Theatre performance", time: "Evening" },
    ],
    restaurants: [
      { name: "Dishoom", cuisine: "Indian", price: "PKR 6,500", rating: "4.7" },
      { name: "The Ivy", cuisine: "British", price: "PKR 12,000", rating: "4.6" },
      { name: "Sketch", cuisine: "French", price: "PKR 18,000", rating: "4.8" },
      { name: "Nando's", cuisine: "Portuguese", price: "PKR 4,500", rating: "4.5" },
      { name: "Borough Market", cuisine: "Street Food", price: "PKR 3,000", rating: "4.7" },
      { name: "Hawksmoor", cuisine: "Steakhouse", price: "PKR 15,000", rating: "4.8" },
      { name: "Padella", cuisine: "Italian", price: "PKR 5,500", rating: "4.6" },
    ],
  },
  "New York": {
    activities: [
      { name: "Statue of Liberty", desc: "Ferry and island tour", time: "Morning" },
      { name: "Central Park", desc: "Explore the famous park", time: "Afternoon" },
      { name: "Empire State Building", desc: "Observation deck views", time: "Evening" },
      { name: "Metropolitan Museum", desc: "Art and culture", time: "Morning" },
      { name: "Broadway Show", desc: "World-class theatre", time: "Evening" },
    ],
    restaurants: [
      { name: "Katz's Delicatessen", cuisine: "Deli", price: "PKR 5,500", rating: "4.7" },
      { name: "Le Bernardin", cuisine: "French Seafood", price: "PKR 35,000", rating: "4.9" },
      { name: "Joe's Pizza", cuisine: "Italian", price: "PKR 2,500", rating: "4.6" },
      { name: "Peter Luger", cuisine: "Steakhouse", price: "PKR 25,000", rating: "4.8" },
      { name: "Shake Shack", cuisine: "Burgers", price: "PKR 3,500", rating: "4.5" },
      { name: "Carbone", cuisine: "Italian", price: "PKR 28,000", rating: "4.8" },
      { name: "The Halal Guys", cuisine: "Middle Eastern", price: "PKR 2,000", rating: "4.6" },
    ],
  },
  Istanbul: {
    activities: [
      { name: "Hagia Sophia", desc: "Historic basilica", time: "Morning" },
      { name: "Grand Bazaar", desc: "Shopping adventure", time: "Afternoon" },
      { name: "Bosphorus Cruise", desc: "Scenic strait tour", time: "Evening" },
      { name: "Topkapi Palace", desc: "Ottoman history", time: "Morning" },
      { name: "Turkish Bath", desc: "Traditional hammam", time: "Afternoon" },
    ],
    restaurants: [
      { name: "Nusr-Et", cuisine: "Turkish Steakhouse", price: "PKR 22,000", rating: "4.7" },
      { name: "Mikla", cuisine: "Modern Turkish", price: "PKR 18,000", rating: "4.8" },
      { name: "Çiya Sofrası", cuisine: "Anatolian", price: "PKR 5,500", rating: "4.7" },
      { name: "Karaköy Lokantası", cuisine: "Turkish", price: "PKR 6,500", rating: "4.6" },
      { name: "Tarihi Sultanahmet", cuisine: "Ottoman", price: "PKR 7,000", rating: "4.5" },
      { name: "Hamdi Restaurant", cuisine: "Kebab", price: "PKR 8,000", rating: "4.8" },
      { name: "Balıkçı Sabahattin", cuisine: "Seafood", price: "PKR 12,000", rating: "4.7" },
    ],
  },
};

interface TripPlanProps {
  city: string;
  numPeople: number;
  onFinalize: () => void;
}

const TripPlan = ({ city, numPeople, onFinalize }: TripPlanProps) => {
  const cityData = tripData[city as keyof typeof tripData];
  const [selectedPlan, setSelectedPlan] = useState<{ [key: number]: { activity: any; restaurant: any } }>(() => {
    const initial: { [key: number]: { activity: any; restaurant: any } } = {};
    for (let i = 1; i <= 7; i++) {
      const actIdx = (i - 1) % cityData.activities.length;
      const restIdx = (i - 1) % cityData.restaurants.length;
      initial[i] = {
        activity: cityData.activities[actIdx],
        restaurant: cityData.restaurants[restIdx],
      };
    }
    return initial;
  });

  const [expandedDay, setExpandedDay] = useState<number | null>(null);

  const changeActivity = (day: number) => {
    const currentAct = selectedPlan[day].activity;
    const availableActs = cityData.activities.filter(a => a.name !== currentAct.name);
    const newAct = availableActs[Math.floor(Math.random() * availableActs.length)];
    setSelectedPlan(prev => ({
      ...prev,
      [day]: { ...prev[day], activity: newAct }
    }));
  };

  const changeRestaurant = (day: number) => {
    const currentRest = selectedPlan[day].restaurant;
    const availableRests = cityData.restaurants.filter(r => r.name !== currentRest.name);
    const newRest = availableRests[Math.floor(Math.random() * availableRests.length)];
    setSelectedPlan(prev => ({
      ...prev,
      [day]: { ...prev[day], restaurant: newRest }
    }));
  };

  return (
    <div className="space-y-4">
      {[1, 2, 3, 4, 5, 6, 7].map((day) => {
        const plan = selectedPlan[day];
        return (
          <Collapsible
            key={day}
            open={expandedDay === day}
            onOpenChange={(open) => setExpandedDay(open ? day : null)}
          >
            <Card className="border-l-4 border-l-primary">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <Badge className="text-base px-3 py-1">Day {day}</Badge>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <ChevronDown
                        className={cn(
                          "h-4 w-4 transition-transform",
                          expandedDay === day && "rotate-180"
                        )}
                      />
                    </Button>
                  </CollapsibleTrigger>
                </div>

                <div className="space-y-3">
                  <div className="bg-muted/50 rounded-lg p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-2 flex-1">
                        <MapPin className="h-5 w-5 text-primary mt-0.5" />
                        <div>
                          <p className="font-semibold">{plan.activity.name}</p>
                          <p className="text-sm text-muted-foreground">{plan.activity.desc}</p>
                          <Badge variant="outline" className="mt-1 text-xs">{plan.activity.time}</Badge>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => changeActivity(day)}
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="bg-muted/50 rounded-lg p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-2 flex-1">
                        <Utensils className="h-5 w-5 text-primary mt-0.5" />
                        <div>
                          <p className="font-semibold">{plan.restaurant.name}</p>
                          <p className="text-sm text-muted-foreground">{plan.restaurant.cuisine}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary" className="text-xs">{plan.restaurant.price}</Badge>
                            <span className="text-xs text-muted-foreground">⭐ {plan.restaurant.rating}</span>
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => changeRestaurant(day)}
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                <CollapsibleContent className="mt-3 pt-3 border-t">
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Alternative Activities:</p>
                    <div className="flex flex-wrap gap-2">
                      {cityData.activities
                        .filter(a => a.name !== plan.activity.name)
                        .slice(0, 3)
                        .map((act, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {act.name}
                          </Badge>
                        ))}
                    </div>

                    <p className="text-sm font-medium mt-3">Alternative Restaurants:</p>
                    <div className="flex flex-wrap gap-2">
                      {cityData.restaurants
                        .filter(r => r.name !== plan.restaurant.name)
                        .slice(0, 3)
                        .map((rest, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {rest.name}
                          </Badge>
                        ))}
                    </div>
                  </div>
                </CollapsibleContent>
              </CardContent>
            </Card>
          </Collapsible>
        );
      })}

      <div className="flex justify-center pt-4">
        <Button size="lg" onClick={onFinalize} className="px-8">
          Finalize Itinerary
        </Button>
      </div>
    </div>
  );
};

export default TripPlan;
