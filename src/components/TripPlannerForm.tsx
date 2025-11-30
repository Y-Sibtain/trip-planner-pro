import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, DollarSign, Calendar, Search, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export interface TripFormData {
  source: string;
  destinations: string[];
  budget: string;
  startDate: string;
  endDate: string;
}

interface TripPlannerFormProps {
  onSearch: (data: TripFormData) => void;
}

const TripPlannerForm = ({ onSearch }: TripPlannerFormProps) => {
  const [source, setSource] = useState("");
  const [sourceInput, setSourceInput] = useState("");
  const [sourceSuggestions, setSourceSuggestions] = useState<string[]>([]);
  const [destinationInput, setDestinationInput] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [destinations, setDestinations] = useState<string[]>([]);
  const [budget, setBudget] = useState("");
  // Helper to format a Date as YYYY-MM-DD (safe for `input[type=date]`)
  const formatDate = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  // Minimum selectable date: tomorrow (disallow today and any past date)
  const today = new Date();
  const minDate = formatDate(new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1));

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const { toast } = useToast();
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  // Fetch all destination names and source airports for autocomplete suggestions (cached on mount)
  useEffect(() => {
    let mounted = true;
    const fetchSuggestions = async () => {
      setLoadingSuggestions(true);
      try {
        const { data, error } = await supabase
          .from("destinations")
          .select("name")
          .order("name", { ascending: true });
        if (error) {
          console.warn("Failed to load destination suggestions:", error);
          return;
        }
        if (!mounted) return;
        setSuggestions((data || []).map((d: any) => d.name));
        // For now, also use destination names as possible source airports
        setSourceSuggestions((data || []).map((d: any) => d.name));
      } catch (err) {
        console.error("Error loading suggestions:", err);
      } finally {
        setLoadingSuggestions(false);
      }
    };
    fetchSuggestions();
    return () => {
      mounted = false;
    };
  }, []);

  const addDestination = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (destinations.includes(trimmed)) {
      toast({ title: "Duplicate destination", description: "This destination is already selected." });
      return;
    }
    if (destinations.length >= 3) {
      toast({ title: "Maximum reached", description: "You can select up to 3 destinations." });
      return;
    }
    setDestinations((d) => [...d, trimmed]);
    setDestinationInput("");
  };

  const removeDestination = (name: string) => {
    setDestinations((d) => d.filter((x) => x !== name));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Client-side validation
    if (!source.trim()) {
      toast({ title: "Validation error", description: "Please enter a source city or airport.", variant: "destructive" });
      return;
    }
    if (destinations.length === 0) {
      toast({ title: "Validation error", description: "Select at least one destination (up to 3).", variant: "destructive" });
      return;
    }
    if (destinations.length > 3) {
      toast({ title: "Validation error", description: "You can select a maximum of 3 destinations.", variant: "destructive" });
      return;
    }
    if (!startDate || !endDate) {
      toast({ title: "Validation error", description: "Please enter both start and end dates.", variant: "destructive" });
      return;
    }
    // Ensure selected dates are after today (disallow today and any past date)
    if (startDate < minDate) {
      toast({ title: "Validation error", description: "Start date must be after today.", variant: "destructive" });
      return;
    }
    if (endDate < minDate) {
      toast({ title: "Validation error", description: "End date must be after today.", variant: "destructive" });
      return;
    }
    if (new Date(startDate) > new Date(endDate)) {
      toast({ title: "Validation error", description: "Start date must be before or equal to end date.", variant: "destructive" });
      return;
    }
    const parsedBudget = Number(budget);
    if (budget && (Number.isNaN(parsedBudget) || parsedBudget < 0)) {
      toast({ title: "Validation error", description: "Enter a valid budget (positive number) or leave empty.", variant: "destructive" });
      return;
    }

    // All good — pass data up
    onSearch({
      source: source.trim(),
      destinations,
      budget: budget.trim(),
      startDate,
      endDate,
    });
  };

  // Filtered suggestion list for autocomplete dropdown
  // Only show dropdown when user is typing (destinationInput is not empty)
  const filteredSuggestions = destinationInput
    ? suggestions.filter((s) => s.toLowerCase().includes(destinationInput.toLowerCase()) && !destinations.includes(s)).slice(0, 6)
    : [];

  // Filtered source suggestions for source dropdown (single-select)
  const filteredSourceSuggestions = sourceInput
    ? sourceSuggestions.filter((s) => s.toLowerCase().includes(sourceInput.toLowerCase())).slice(0, 6)
    : [];

  return (
    <Card className="w-full">
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="source" className="flex items-center gap-2">
              <MapPin className="w-4 h-4" /> Source
            </Label>
            <div className="relative">
              <Input
                id="source"
                placeholder="Type a source city or airport"
                value={sourceInput}
                onChange={(e) => setSourceInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    if (filteredSourceSuggestions.length > 0) {
                      setSource(filteredSourceSuggestions[0]);
                      setSourceInput("");
                    }
                  }
                }}
              />
              {source && (
                <div className="mt-2 inline-flex items-center gap-2 bg-muted px-3 py-1 rounded-full">
                  <span className="text-sm">{source}</span>
                  <button type="button" onClick={() => setSource("")} aria-label={`Remove ${source}`} className="p-0.5">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
              {sourceInput && (filteredSourceSuggestions.length > 0 || loadingSuggestions) && (
                <div className="absolute z-20 mt-1 w-full bg-gray-200 border rounded-md shadow">
                  {loadingSuggestions ? (
                    <div className="p-2 text-sm text-muted-foreground">Loading...</div>
                  ) : filteredSourceSuggestions.length > 0 ? (
                    filteredSourceSuggestions.map((s) => (
                      <button
                        key={s}
                        type="button"
                        className="w-full text-left p-2 hover:bg-muted/50"
                        onClick={() => {
                          setSource(s);
                          setSourceInput("");
                        }}
                      >
                        {s}
                      </button>
                    ))
                  ) : (
                    <div className="p-2 text-sm text-muted-foreground">No sources match your search</div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div>
            <Label className="flex items-center gap-2">
              <Search className="w-4 h-4" /> Destinations (up to 3)
            </Label>
            <div className="flex gap-2 flex-wrap mb-2">
              {destinations.map((d) => (
                <div key={d} className="inline-flex items-center gap-2 bg-muted px-3 py-1 rounded-full">
                  <span className="text-sm">{d}</span>
                  <button type="button" onClick={() => removeDestination(d)} aria-label={`Remove ${d}`} className="p-0.5">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
            <div className="relative">
              <Input
                placeholder="Type a destination and press Enter or select from suggestions"
                value={destinationInput}
                onChange={(e) => setDestinationInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addDestination(destinationInput);
                  }
                }}
              />
              {destinationInput && (filteredSuggestions.length > 0 || loadingSuggestions) && (
                <div className="absolute z-20 mt-1 w-full bg-gray-200 border rounded-md shadow">
                  {loadingSuggestions ? (
                    <div className="p-2 text-sm text-muted-foreground">Loading...</div>
                  ) : filteredSuggestions.length > 0 ? (
                    filteredSuggestions.map((s) => (
                      <button
                        key={s}
                        type="button"
                        className="w-full text-left p-2 hover:bg-muted/50"
                        onClick={() => addDestination(s)}
                      >
                        {s}
                      </button>
                    ))
                  ) : (
                    <div className="p-2 text-sm text-muted-foreground">No destinations match your search</div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <Label className="flex items-center gap-2">
                <DollarSign className="w-4 h-4" /> Budget (optional)
              </Label>
              <Input
                placeholder="Total budget (PKR)"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                type="number"
                min={0}
                step="0.01"
              />
            </div>
            <div>
              <Label className="flex items-center gap-2">
                <Calendar className="w-4 h-4" /> Start Date
              </Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} min={minDate} />
            </div>
            <div>
              <Label className="flex items-center gap-2">
                <Calendar className="w-4 h-4" /> End Date
              </Label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} min={minDate} />
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit">Generate Itinerary</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default TripPlannerForm;