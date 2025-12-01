import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import ShatterButton from "@/components/ui/shatter-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, DollarSign, Calendar, Search, X, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";

export interface TripFormData {
  source: string;
  destinations: string[];
  budget: string;
  startDate: string;
  endDate: string;
  travellers: string;
}

interface TripPlannerFormProps {
  onSearch: (data: TripFormData) => void;
  onFormStateChange?: (data: TripFormData) => void;
  onAskAI?: () => void;
}

const TripPlannerForm = ({ onSearch, onFormStateChange, onAskAI }: TripPlannerFormProps) => {
  const [source, setSource] = useState("");
  const [sourceInput, setSourceInput] = useState("");
  const [sourceSuggestions, setSourceSuggestions] = useState<string[]>([]);
  const [destinationInput, setDestinationInput] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [destinations, setDestinations] = useState<string[]>([]);
  const [destination2Input, setDestination2Input] = useState("");
  const [destination2, setDestination2] = useState<string>("");
  const [showDestination2, setShowDestination2] = useState(false);
  const [budget, setBudget] = useState("");
  const [travellers, setTravellers] = useState("");

  // Load initial data from localStorage if available
  useEffect(() => {
    const savedData = localStorage.getItem('tripData');
    if (savedData) {
      try {
        const data = JSON.parse(savedData);
        if (data.source) setSource(data.source);
        if (data.destinations && data.destinations.length > 0) setDestinations(data.destinations);
        if (data.budget) setBudget(data.budget);
        if (data.startDate) setStartDate(data.startDate);
        if (data.endDate) setEndDate(data.endDate);
        if (data.travellers) setTravellers(data.travellers);
      } catch (e) {
        console.error('Failed to load saved trip data:', e);
      }
    }
  }, []);
  // Helper to format a Date as YYYY-MM-DD (safe for `input[type=date]`)
  const formatDate = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  // Minimum selectable date: today (allow today and any future date)
  const today = new Date();
  const minDate = formatDate(today);

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const { toast } = useToast();
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const { t } = useLanguage();

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
    if (destinations.length >= 1) {
      toast({ title: "Maximum reached", description: "You can select only one destination." });
      return;
    }
    setDestinations((d) => [...d, trimmed]);
    setDestinationInput("");
  };

  const removeDestination = (name: string) => {
    setDestinations((d) => d.filter((x) => x !== name));
  };

  // Notify parent component of form state changes
  useEffect(() => {
    if (onFormStateChange) {
      onFormStateChange({
        source,
        destinations,
        budget,
        startDate,
        endDate,
        travellers,
      });
    }
  }, [source, destinations, budget, startDate, endDate, travellers, onFormStateChange]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Client-side validation
    if (!source.trim()) {
      toast({ title: "Validation error", description: "Please enter a source city or airport.", variant: "destructive" });
      return;
    }
    if (destinations.length === 0) {
      toast({ title: "Validation error", description: "Please select a destination.", variant: "destructive" });
      return;
    }
    if (destinations.length > 1) {
      toast({ title: "Validation error", description: "You can select only one destination.", variant: "destructive" });
      return;
    }
    if (!startDate || !endDate) {
      toast({ title: "Validation error", description: "Please enter both start and end dates.", variant: "destructive" });
      return;
    }
    // Ensure selected dates are today or in the future
    if (startDate < minDate) {
      toast({ title: "Validation error", description: "Start date must be today or in the future.", variant: "destructive" });
      return;
    }
    if (endDate < minDate) {
      toast({ title: "Validation error", description: "End date must be today or in the future.", variant: "destructive" });
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

    // Travellers is required
    if (!travellers || travellers.trim() === "") {
      toast({ title: "Validation error", description: "Please enter the number of travellers.", variant: "destructive" });
      return;
    }
    const parsedTravellers = Number(travellers);
    if (Number.isNaN(parsedTravellers) || parsedTravellers < 1) {
      toast({ title: "Validation error", description: "Enter a valid number of travellers (minimum 1).", variant: "destructive" });
      return;
    }

    // All good — pass data up
    onSearch({
      source: source.trim(),
      destinations,
      budget: budget.trim(),
      startDate,
      endDate,
      travellers: travellers.trim(),
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
    <div className="w-full">
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Source Field */}
        <div>
          <Label htmlFor="source" className="flex items-center gap-2 text-black dark:text-white font-semibold mb-2">
            <MapPin className="w-4 h-4 text-blue-500" /> {t('source')}
          </Label>
          <div className="relative">
            <Input
              id="source"
              placeholder={t('source_placeholder')}
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
              className="w-full px-4 py-3 rounded-lg glass border border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all-smooth"
            />
            {source && (
              <div className="mt-2 inline-flex items-center gap-2 glass px-3 py-1 rounded-full border border-gray-300 bg-gray-50">
                <span className="text-sm text-gray-900">{source}</span>
                <button type="button" onClick={() => setSource("")} className="p-0.5 hover:text-blue-500 transition-all">
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
            {sourceInput && (filteredSourceSuggestions.length > 0 || loadingSuggestions) && (
              <div className="absolute z-20 mt-1 w-full glass rounded-lg shadow-md border border-gray-300 overflow-hidden bg-white">
                {loadingSuggestions ? (
                  <div className="p-3 text-sm text-gray-600">Loading...</div>
                ) : filteredSourceSuggestions.length > 0 ? (
                  filteredSourceSuggestions.map((s) => (
                    <button
                      key={s}
                      type="button"
                      className="w-full text-left p-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-all border-b border-gray-200 last:border-b-0"
                      onClick={() => {
                        setSource(s);
                        setSourceInput("");
                      }}
                    >
                      {s}
                    </button>
                  ))
                ) : (
                  <div className="p-3 text-sm text-gray-600">No cities found</div>
                )}
              </div>
            )}
          </div>
          </div>

        {/* Destinations Field */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <Label className="flex items-center gap-2 text-black dark:text-white font-semibold">
              <Search className="w-4 h-4 text-blue-500" /> {t('destinations_label')}
            </Label>
            <button
              type="button"
              onClick={() => setShowDestination2(!showDestination2)}
              title="Click to add another Destination"
              className="p-2 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-all text-blue-500 hover:text-blue-600"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
          <div className="flex gap-2 flex-wrap mb-3">
            {destinations.map((d) => (
              <div key={d} className="inline-flex items-center gap-2 glass px-3 py-1 rounded-full border border-blue-300 bg-blue-50">
                <span className="text-sm text-gray-900">{d}</span>
                <button type="button" onClick={() => removeDestination(d)} className="p-0.5 hover:text-blue-600 transition-all">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
          <div className="relative">
            <Input
              placeholder={t('destination_placeholder')}
              value={destinationInput}
              onChange={(e) => setDestinationInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addDestination(destinationInput);
                }
              }}
              className="w-full px-4 py-3 rounded-lg glass border border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all-smooth"
            />
            {destinationInput && (filteredSuggestions.length > 0 || loadingSuggestions) && (
              <div className="absolute z-20 mt-1 w-full glass rounded-lg shadow-md border border-gray-300 overflow-hidden bg-white">
                {loadingSuggestions ? (
                  <div className="p-3 text-sm text-gray-600">Loading...</div>
                ) : filteredSuggestions.length > 0 ? (
                  filteredSuggestions.map((s) => (
                    <button
                      key={s}
                      type="button"
                      className="w-full text-left p-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-all border-b border-gray-200 last:border-b-0"
                      onClick={() => addDestination(s)}
                    >
                      {s}
                    </button>
                  ))
                ) : (
                  <div className="p-3 text-sm text-gray-600">No destinations found</div>
                )}
              </div>
            )}
          </div>

          {/* Destination 2 Field (Optional) */}
          {showDestination2 && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Label className="flex items-center gap-2 text-black dark:text-white font-semibold mb-2">
                <Search className="w-4 h-4 text-blue-500" /> Destination 2
              </Label>
              {destination2 && (
                <div className="mb-3 inline-flex items-center gap-2 glass px-3 py-1 rounded-full border border-blue-300 bg-blue-50">
                  <span className="text-sm text-gray-900">{destination2}</span>
                  <button type="button" onClick={() => setDestination2("")} className="p-0.5 hover:text-blue-600 transition-all">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
              <div className="relative">
                <Input
                  placeholder="Type destination and press Enter or select from suggestions"
                  value={destination2Input}
                  onChange={(e) => setDestination2Input(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      const trimmed = destination2Input.trim();
                      if (trimmed && trimmed !== destinations[0]) {
                        setDestination2(trimmed);
                        setDestination2Input("");
                      }
                    }
                  }}
                  className="w-full px-4 py-3 rounded-lg glass border border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all-smooth"
                />
                {destination2Input && (filteredSuggestions.length > 0 || loadingSuggestions) && (
                  <div className="absolute z-20 mt-1 w-full glass rounded-lg shadow-md border border-gray-300 overflow-hidden bg-white">
                    {loadingSuggestions ? (
                      <div className="p-3 text-sm text-gray-600">Loading...</div>
                    ) : filteredSuggestions.length > 0 ? (
                      filteredSuggestions.map((s) => (
                        <button
                          key={s}
                          type="button"
                          className="w-full text-left p-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-all border-b border-gray-200 last:border-b-0"
                          onClick={() => {
                            if (s !== destinations[0]) {
                              setDestination2(s);
                              setDestination2Input("");
                            } else {
                              toast({ title: "Duplicate destination", description: "This destination is already selected as Destination 1." });
                            }
                          }}
                        >
                          {s}
                        </button>
                      ))
                    ) : (
                      <div className="p-3 text-sm text-gray-600">No destinations found</div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Budget, Dates, Travellers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Budget */}
          <div>
            <Label className="flex items-center gap-2 text-black dark:text-white font-semibold mb-2 text-sm">
                <DollarSign className="w-4 h-4 text-blue-500" /> {t('budget_optional')}
              </Label>
              <Input
                placeholder={t('budget_placeholder')}
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              type="number"
              min={0}
              step={1000}
              className="w-full px-4 py-3 rounded-lg glass border border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all-smooth"
            />
          </div>

          {/* Start Date */}
          <div>
            <Label className="flex items-center gap-2 text-black dark:text-white font-semibold mb-2 text-sm">
                <Calendar className="w-4 h-4 text-blue-500" /> {t('start_date')}
              </Label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              min={minDate}
              className="w-full px-4 py-3 rounded-lg glass border border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all-smooth"
            />
          </div>

          {/* End Date */}
          <div>
            <Label className="flex items-center gap-2 text-black dark:text-white font-semibold mb-2 text-sm">
              <Calendar className="w-4 h-4 text-blue-500" /> {t('end_date')}
            </Label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              min={startDate || minDate}
              className="w-full px-4 py-3 rounded-lg glass border border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all-smooth"
            />
          </div>

          {/* Travellers */}
          <div>
            <Label className="flex items-center gap-2 text-black dark:text-white font-semibold mb-2 text-sm">
                👥 {t('travellers')}
              </Label>
              <Input
                placeholder={t('travellers_placeholder')}
              value={travellers}
              onChange={(e) => setTravellers(e.target.value)}
              type="number"
              min="1"
              max="20"
              required
              className="w-full px-4 py-3 rounded-lg glass border border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all-smooth"
            />
          </div>
        </div>

          <div className="flex justify-end gap-1 items-center pt-4">
            <Button
              type="button"
              onClick={onAskAI}
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold px-6 py-2 rounded-lg hover:shadow-lg transition-all-smooth"
            >
              {t('ask_ai')}
            </Button>
            <ShatterButton shatterColor="#3b82f6">
                <Button
                  type="submit"
                  className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold px-6 py-2 rounded-lg hover:shadow-lg transition-all-smooth"
                >
                  {t('plan_my_trip')}
                </Button>
            </ShatterButton>
          </div>
        </form>
      </div>
    );
};

export default TripPlannerForm;