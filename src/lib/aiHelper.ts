interface TripData {
  source?: string;
  destinations?: string[];
  budget?: string;
  startDate?: string;
  endDate?: string;
  travellers?: string | number;
}

export interface FlightRecommendation {
  airline: string;
  departure: string;
  arrival: string;
  pricePerPersonPKR: number;
}

export interface HotelRecommendation {
  name: string;
  stars: number;
  pricePerNightPKR: number;
  totalStayPKR: number;
}

export interface ItineraryDay {
  day: number;
  activity: string;
  estimatedCostPKR: number;
}

export interface BudgetBreakdown {
  flights: number;
  accommodation: number;
  meals: number;
  activities: number;
  transport: number;
  total: number;
}

export interface TripPackage {
  destination: string | null;
  style: "Luxury" | "Comfort" | "Budget";
  days: number;
  travellers: number;
  totalBudgetPKR: number;
  flights: FlightRecommendation;
  hotel: HotelRecommendation;
  itinerary: ItineraryDay[];
  budgetBreakdown: BudgetBreakdown;
  notes: string[];
  affordable: boolean;
  affordabilityNotes: string[];
  alternatives?: string[];
}

// Mock data for flights and hotels by destination
const flightPrices: Record<string, number> = {
  "Dubai": 45000,
  "London": 75000,
  "New York": 95000,
  "Istanbul": 35000,
};

const hotelsByDestination: Record<string, { [key: number]: { name: string; pricePerNight: number } }> = {
  "Dubai": {
    5: { name: "Burj Al Arab", pricePerNight: 50000 },
    4: { name: "Atlantis The Palm", pricePerNight: 15000 },
    3: { name: "JW Marriott", pricePerNight: 8000 },
  },
  "London": {
    5: { name: "The Ritz London", pricePerNight: 55000 },
    4: { name: "Savoy Hotel", pricePerNight: 18000 },
    3: { name: "Premier Inn", pricePerNight: 7000 },
  },
  "New York": {
    5: { name: "The Plaza", pricePerNight: 60000 },
    4: { name: "St. Regis", pricePerNight: 20000 },
    3: { name: "Holiday Inn", pricePerNight: 9000 },
  },
  "Istanbul": {
    5: { name: "Çırağan Palace", pricePerNight: 45000 },
    4: { name: "Four Seasons", pricePerNight: 12000 },
    3: { name: "Ramada", pricePerNight: 5000 },
  },
};

const sampleActivities: Record<string, string[]> = {
  "Dubai": ["Desert Safari", "Burj Khalifa Visit", "Gold Souk Tour", "Beach Day", "Dubai Mall Shopping"],
  "London": ["Tower of London", "Big Ben & Westminster", "British Museum", "West End Show", "Thames River Cruise"],
  "New York": ["Statue of Liberty", "Central Park Walk", "Broadway Show", "Times Square", "Empire State Building"],
  "Istanbul": ["Hagia Sophia Tour", "Grand Bazaar", "Blue Mosque", "Bosphorus Cruise", "Topkapi Palace"],
};

export function generateTripPackage(data: TripData): TripPackage {
  const dest = (data.destinations && data.destinations[0]) || "Dubai";
  const travellers = Number(data.travellers || 1) || 1;

  let days = 3;
  if (data.startDate && data.endDate) {
    try {
      const start = new Date(data.startDate);
      const end = new Date(data.endDate);
      const diff = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);
      days = Math.max(1, diff);
    } catch (e) {
      days = 3;
    }
  }

  // Parse budget - trim and check for actual value
  const budgetInput = String(data.budget || "").trim();
  let budgetNum = budgetInput ? Number(budgetInput.replace(/[^0-9.-]+/g, "")) : 0;
  budgetNum = isNaN(budgetNum) || budgetNum < 0 ? 0 : budgetNum;
  
  // If no budget provided, use default per-person budget and multiply by travellers
  if (budgetNum === 0) {
    const defaultPerPersonBudget = 150000; // Default per-person budget in PKR
    budgetNum = defaultPerPersonBudget * travellers;
  }

  // Determine travel style
  const perPersonBudget = budgetNum / travellers;
  let style: TripPackage['style'] = "Budget";
  let recommendedStars = 3;
  if (perPersonBudget / days >= 50000) {
    style = "Luxury";
    recommendedStars = 5;
  } else if (perPersonBudget / days >= 15000) {
    style = "Comfort";
    recommendedStars = 4;
  } else {
    style = "Budget";
    recommendedStars = 3;
  }

  // Get flight price
  const flightPrice = flightPrices[dest as keyof typeof flightPrices] || 50000;
  // Get hotel options for destination
  const hotelOptions = hotelsByDestination[dest as keyof typeof hotelsByDestination] || hotelsByDestination["Dubai"];

  // Helper to compute totals for a given star hotel
  const computeTotalsForStar = (star: number) => {
    const hd = hotelOptions[star] || hotelOptions[3];
    const perNight = hd.pricePerNight;
    const hotelTotalLocal = perNight * (days - 1) * travellers;
    const flightsTotalLocal = flightPrice * travellers;
    const mealsCostLocal = days * 3000 * travellers;
    const coreTotal = flightsTotalLocal + hotelTotalLocal + mealsCostLocal;
    return { hd, perNight, hotelTotalLocal, flightsTotalLocal, mealsCostLocal, coreTotal };
  };

  // Start with recommended stars and try to fit core costs into budget by downgrading if needed
  let chosenStar = recommendedStars;
  let chosenHotelData = hotelOptions[chosenStar] || hotelOptions[3];
  let flightsTotal = flightPrice * travellers;
  let hotelTotal = chosenHotelData.pricePerNight * (days - 1) * travellers;
  let mealsCost = days * 3000 * travellers;
  let coreTotal = flightsTotal + hotelTotal + mealsCost;
  const affordabilityNotes: string[] = [];
  const alternatives: string[] = [];
  let affordable = true;

  if (coreTotal > budgetNum) {
    // Attempt downgrades (recommendedStars down to 3)
    let fit = false;
    for (let s = recommendedStars; s >= 3; s--) {
      const t = computeTotalsForStar(s);
      if (t.coreTotal <= budgetNum) {
        chosenStar = s;
        chosenHotelData = t.hd;
        flightsTotal = t.flightsTotalLocal;
        hotelTotal = t.hotelTotalLocal;
        mealsCost = t.mealsCostLocal;
        coreTotal = t.coreTotal;
        if (s < recommendedStars) {
          affordabilityNotes.push(`To fit your budget, accommodation was downgraded from ${recommendedStars}★ to ${s}★ (${t.hd.name}).`);
        }
        fit = true;
        break;
      }
    }

    if (!fit) {
      // Even cheapest hotel doesn't fit with flights + meals. Calculate minimum possible and shortfall.
      affordable = false;
      
      // Compute minimum possible: flights + cheapest hotel (3 stars) + meals
      const minHotelOption = hotelOptions[3] || { name: "Budget Hotel", pricePerNight: 5000 };
      const minHotelCost = minHotelOption.pricePerNight * (days - 1) * travellers;
      const minCoreTotal = flightsTotal + minHotelCost + mealsCost;
      const minShortfall = Math.max(0, minCoreTotal - budgetNum);
      
      if (flightsTotal <= budgetNum) {
        affordabilityNotes.push("Your budget doesn't cover flights + accommodation + meals for the selected dates.");
        affordabilityNotes.push(`Minimum trip needed: ₨${minCoreTotal.toLocaleString()} (flights + cheapest hotel + meals).`);
        affordabilityNotes.push(`You need ₨${minShortfall.toLocaleString()} more to book the minimum possible trip.`);
        alternatives.push(`Flights only: ₨${flightsTotal.toLocaleString()} (this fits your budget).`);
      } else {
        const shortfall = flightsTotal - budgetNum;
        affordabilityNotes.push("Your budget is too low to cover basic flight costs for these travellers and dates.");
        affordabilityNotes.push(`You need at least an additional ₨${shortfall.toLocaleString()} to cover flights.`);
        alternatives.push(`Minimum needed for flights: ₨${flightsTotal.toLocaleString()}`);
      }
    }
  }

  // Prepare activity/transport allocations only if affordable
  let activitiesCost = 0;
  let transportCost = 0;
  if (affordable) {
    const remaining = Math.max(0, budgetNum - (flightsTotal + hotelTotal + mealsCost));
    activitiesCost = Math.floor(remaining * 0.5); // 50% of remaining for activities
    transportCost = Math.max(0, remaining - activitiesCost); // Rest for transport
  }

  // Generate itinerary
  const activities = sampleActivities[dest as keyof typeof sampleActivities] || sampleActivities["Dubai"];
  const itinerary: ItineraryDay[] = [];
  for (let i = 1; i <= days; i++) {
    const activity = activities[i % activities.length];
    const activityCost = i < days ? Math.floor(activitiesCost / (days - 1)) : 0; // Skip last day
    itinerary.push({
      day: i,
      activity: i === 1 ? "Arrival & Check-in" : i === days ? "Departure" : activity,
      estimatedCostPKR: activityCost,
    });
  }

  const notes: string[] = [];
  notes.push(`✈️ Flight: ${data.source || "Islamabad"} → ${dest}`);
  notes.push(`🏨 Hotel: ${chosenHotelData.name} (${chosenStar} stars)`);
  notes.push(`📅 Duration: ${days} days, ${travellers} ${travellers === 1 ? "person" : "people"}`);
  notes.push(`💰 Total Budget: ₨${budgetNum.toLocaleString()}`);

  const breakdownTotal = flightsTotal + hotelTotal + mealsCost + activitiesCost + transportCost;

  if (affordabilityNotes.length === 0 && chosenStar < recommendedStars) {
    affordabilityNotes.push(`Accommodation downgraded to ${chosenStar}★ to fit your budget.`);
  }

  if (!affordable && affordabilityNotes.length === 0) {
    affordabilityNotes.push("We could not create a complete package within your budget. See alternatives provided.");
  }

  return {
    destination: dest,
    style,
    days,
    travellers,
    totalBudgetPKR: budgetNum,
    flights: {
      airline: "National Carrier",
      departure: `${data.source || "Islamabad"} (08:00 AM)`,
      arrival: `${dest} (02:00 PM)`,
      pricePerPersonPKR: flightPrice,
    },
    hotel: {
      name: chosenHotelData.name,
      stars: chosenStar,
      pricePerNightPKR: chosenHotelData.pricePerNight,
      totalStayPKR: hotelTotal,
    },
    itinerary,
    budgetBreakdown: {
      flights: flightsTotal,
      accommodation: hotelTotal,
      meals: mealsCost,
      activities: Math.floor(activitiesCost),
      transport: Math.floor(transportCost),
      total: Math.floor(breakdownTotal),
    },
    notes,
    affordable,
    affordabilityNotes,
    alternatives: alternatives.length ? alternatives : undefined,
  };
}

export default generateTripPackage;

