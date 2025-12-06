import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import ShatterButton from "@/components/ui/shatter-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, DollarSign, Calendar, Search, X, Plus, Users, ChevronDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";

export interface TripFormData {
  source: string;
  destinations: string[];
  budget: string;
  startDate: string;
  endDate: string;
  // optional per-destination second dates (for destination 2)
  startDate2?: string;
  endDate2?: string;
  // optional per-destination third dates (for destination 3)
  startDate3?: string;
  endDate3?: string;
  destination2?: string;
  destination3?: string;
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
  const [destination3Input, setDestination3Input] = useState("");
  const [destination3, setDestination3] = useState<string>("");
  const [showDestination3, setShowDestination3] = useState(false);
  const [startDate2, setStartDate2] = useState("");
  const [endDate2, setEndDate2] = useState("");
  const [startDate3, setStartDate3] = useState("");
  const [endDate3, setEndDate3] = useState("");
  const [budget, setBudget] = useState("");
  const [travellers, setTravellers] = useState("");
  const [showSourceDropdown, setShowSourceDropdown] = useState(false);
  const [showDestinationDropdown, setShowDestinationDropdown] = useState(false);

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
        if (data.startDate2) setStartDate2(data.startDate2);
        if (data.endDate2) setEndDate2(data.endDate2);
        if (data.startDate3) setStartDate3(data.startDate3);
        if (data.endDate3) setEndDate3(data.endDate3);
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
      const allDestinations = [...destinations];
      if (destination2) allDestinations.push(destination2);
      if (destination3) allDestinations.push(destination3);
      onFormStateChange({
        source,
        destinations: allDestinations,
        budget,
        startDate,
        endDate,
        startDate2,
        endDate2,
        destination2,
        destination3,
        startDate3,
        endDate3,
        travellers,
      });
    }
  }, [source, destinations, budget, startDate, endDate, startDate2, endDate2, startDate3, endDate3, destination2, destination3, travellers, onFormStateChange]);

  // When Destination 2 is shown, default its start date to the end date of Destination 1
  // Update startDate2 whenever endDate changes (always sync, not just on initial set)
  useEffect(() => {
    if (showDestination2) {
      if (endDate) {
        setStartDate2(endDate);
      }
    }
  }, [showDestination2, endDate]);

  // When Destination 3 is shown, default its start date to the end date of Destination 2
  // Update startDate3 whenever endDate2 changes (always sync, not just on initial set)
  useEffect(() => {
    if (showDestination3) {
      if (endDate2) {
        setStartDate3(endDate2);
      }
    }
  }, [showDestination3, endDate2]);

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

    // Destination 2 validation: startDate2 is auto-filled and non-editable; ensure endDate2 exists and is on/after startDate2
    if (showDestination2 || destination2) {
      if (!startDate2) {
        toast({ title: "Validation error", description: "Start Date for Destination 2 is not set.", variant: "destructive" });
        return;
      }
      if (!endDate2) {
        toast({ title: "Validation error", description: "Please enter an end date for Destination 2.", variant: "destructive" });
        return;
      }
      if (new Date(endDate2) < new Date(startDate2)) {
        toast({ title: "Validation error", description: "End Date for Destination 2 cannot be before its Start Date.", variant: "destructive" });
        return;
      }
    }

    // Destination 3 validation: startDate3 is auto-filled (from endDate2) and non-editable; ensure endDate3 exists and is on/after startDate3
    if (showDestination3 || destination3) {
      if (!startDate3) {
        toast({ title: "Validation error", description: "Start Date for Destination 3 is not set.", variant: "destructive" });
        return;
      }
      if (!endDate3) {
        toast({ title: "Validation error", description: "Please enter an end date for Destination 3.", variant: "destructive" });
        return;
      }
      if (new Date(endDate3) < new Date(startDate3)) {
        toast({ title: "Validation error", description: "End Date for Destination 3 cannot be before its Start Date.", variant: "destructive" });
        return;
      }
    }
    const parsedBudget = Number(budget);
    if (budget && (Number.isNaN(parsedBudget) || parsedBudget < 0)) {
      toast({ title: "Validation error", description: "Enter a valid budget (positive number) or leave empty.", variant: "destructive" });
      return;
    }

    // Travellers is optional - default to 1 if not provided
    const parsedTravellers = travellers ? Number(travellers) : 1;
    if (Number.isNaN(parsedTravellers) || parsedTravellers < 1) {
      toast({ title: "Validation error", description: "Enter a valid number of travellers (minimum 1).", variant: "destructive" });
      return;
    }

    // All good — pass data up
    onSearch({
      source: source.trim(),
      destinations: (() => {
        const all = [...destinations];
        if (destination2) all.push(destination2);
        if (destination3) all.push(destination3);
        return all;
      })(),
      budget: budget.trim(),
      startDate,
      endDate,
      startDate2,
      endDate2,
      startDate3,
      endDate3,
      destination2,
      destination3,
      travellers: String(parsedTravellers),
    });
  };

  // Filtered suggestion list for autocomplete dropdown
  // Only show dropdown when user is typing (destinationInput is not empty)
  const filteredSuggestions = destinationInput
    ? suggestions.filter((s) => s.toLowerCase().includes(destinationInput.toLowerCase()) && !destinations.includes(s)).slice(0, 6)
    : showDestinationDropdown
    ? suggestions.filter((s) => !destinations.includes(s)).slice(0, 6)
    : [];

  // Filtered suggestions for Destination 2
  const filteredDestination2Suggestions = destination2Input
    ? suggestions.filter((s) => s.toLowerCase().includes(destination2Input.toLowerCase()) && s !== destinations[0] && s !== destination3).slice(0, 6)
    : [];

  // Filtered suggestions for Destination 3
  const filteredDestination3Suggestions = destination3Input
    ? suggestions.filter((s) => s.toLowerCase().includes(destination3Input.toLowerCase()) && s !== destinations[0] && s !== destination2).slice(0, 6)
    : [];

  // Filtered source suggestions for source dropdown (single-select)
  const filteredSourceSuggestions = sourceInput
    ? sourceSuggestions.filter((s) => s.toLowerCase().includes(sourceInput.toLowerCase())).slice(0, 6)
    : showSourceDropdown
    ? sourceSuggestions.slice(0, 6)
    : [];

  return (
    <div className="w-full max-w-3xl mx-auto px-4">
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Source Field */}
        <div>
          <Label htmlFor="source" className="flex items-center gap-2 text-black dark:text-white font-semibold mb-2">
            <MapPin className="w-4 h-4 text-blue-500" /> {t('source')}
          </Label>
          <div className="relative">
            <div className="w-full px-3 py-2 rounded-lg glass border border-gray-300 text-gray-900 placeholder-gray-500 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-400/20 transition-all-smooth flex items-center gap-2 flex-wrap">
              {source && (
                <div className="inline-flex items-center gap-2 glass px-3 py-1 rounded-full border border-blue-300 bg-blue-50">
                  <span className="text-sm text-gray-900">{source}</span>
                  <button type="button" onClick={() => setSource("")} className="p-0.5 hover:text-blue-600 transition-all">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}

              <input
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
                disabled={source.length > 0}
                className="flex-1 min-w-[140px] bg-transparent outline-none px-1 py-2 disabled:opacity-70"
              />
              
              <button
                type="button"
                onClick={() => setShowSourceDropdown(!showSourceDropdown)}
                className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex-shrink-0"
                title="Show suggestions"
              >
                <ChevronDown className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              </button>
            </div>
            {(sourceInput || showSourceDropdown) && (filteredSourceSuggestions.length > 0 || loadingSuggestions) && (
              <div className="absolute z-20 mt-1 w-full glass rounded-lg shadow-md border border-gray-300 overflow-hidden bg-white max-h-64 overflow-y-auto">
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
                        setShowSourceDropdown(false);
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
            {!showDestination2 && (
              <button
                type="button"
                onClick={() => setShowDestination2(true)}
                title="Click to add Destination 2"
                className="p-2 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-all text-blue-500 hover:text-blue-600"
              >
                <Plus className="w-5 h-5" />
              </button>
            )}
          </div>
          <div className="relative">
            <div className="w-full px-3 py-2 rounded-lg glass border border-gray-300 text-gray-900 placeholder-gray-500 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-400/20 transition-all-smooth flex items-center gap-2 flex-wrap">
              {destinations.map((d) => (
                <div key={d} className="inline-flex items-center gap-2 glass px-3 py-1 rounded-full border border-blue-300 bg-blue-50">
                  <span className="text-sm text-gray-900">{d}</span>
                  <button type="button" onClick={() => removeDestination(d)} className="p-0.5 hover:text-blue-600 transition-all">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}

              <input
                placeholder={t('destination_placeholder')}
                value={destinationInput}
                onChange={(e) => setDestinationInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    if (filteredSuggestions.length > 0) {
                      addDestination(filteredSuggestions[0]);
                      setShowDestinationDropdown(false);
                    } else if (destinationInput.trim()) {
                      addDestination(destinationInput);
                    }
                  }
                }}
                disabled={destinations.length >= 1}
                className="flex-1 min-w-[140px] bg-transparent outline-none px-1 py-2 disabled:opacity-70"
              />
              
              <button
                type="button"
                onClick={() => setShowDestinationDropdown(!showDestinationDropdown)}
                className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex-shrink-0"
                title="Show suggestions"
              >
                <ChevronDown className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              </button>
            </div>
            {(destinationInput || showDestinationDropdown) && (filteredSuggestions.length > 0 || loadingSuggestions) && (
              <div className="absolute z-20 mt-1 w-full glass rounded-lg shadow-md border border-gray-300 overflow-hidden bg-white max-h-64 overflow-y-auto">
                {loadingSuggestions ? (
                  <div className="p-3 text-sm text-gray-600">Loading...</div>
                ) : filteredSuggestions.length > 0 ? (
                  filteredSuggestions.map((s) => (
                    <button
                      key={s}
                      type="button"
                      className="w-full text-left p-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-all border-b border-gray-200 last:border-b-0"
                      onClick={() => {
                        addDestination(s);
                        setShowDestinationDropdown(false);
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

          {/* Destination 2 Field (Optional) */}
          {showDestination2 && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <Label className="flex items-center gap-2 text-black dark:text-white font-semibold">
                  <Search className="w-4 h-4 text-blue-500" /> Destination 2
                </Label>
                <div className="flex gap-2">
                  {!showDestination3 && (
                    <button
                      type="button"
                      onClick={() => setShowDestination3(true)}
                      title="Click to add Destination 3"
                      className="p-2 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-all text-blue-500 hover:text-blue-600"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                        // If Destination 3 exists, move it to Destination 2
                        if (destination3) {
                          setDestination2(destination3);
                          setDestination2Input("");
                          setStartDate2(startDate3);
                          setEndDate2(endDate3);
                          setDestination3("");
                          setDestination3Input("");
                          setStartDate3("");
                          setEndDate3("");
                          setShowDestination3(false);
                        } else {
                          setShowDestination2(false);
                          setDestination2("");
                          setDestination2Input("");
                          setStartDate2("");
                          setEndDate2("");
                        }
                    }}
                    title="Click to remove Destination 2"
                    className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-all text-red-500 hover:text-red-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="relative">
                <div className="w-full px-3 py-2 rounded-lg glass border border-gray-300 text-gray-900 placeholder-gray-500 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-400/20 transition-all-smooth flex items-center gap-2 flex-wrap">
                  {destination2 && (
                    <div className="inline-flex items-center gap-2 glass px-3 py-1 rounded-full border border-blue-300 bg-blue-50">
                      <span className="text-sm text-gray-900">{destination2}</span>
                      <button type="button" onClick={() => setDestination2("")} className="p-0.5 hover:text-blue-600 transition-all">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                  <input
                    placeholder={t('destination_placeholder')}
                    value={destination2Input}
                    onChange={(e) => setDestination2Input(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        if (filteredDestination2Suggestions.length > 0) {
                          const selected = filteredDestination2Suggestions[0];
                          if (selected !== destinations[0] && selected !== destination3) {
                            setDestination2(selected);
                            setDestination2Input("");
                          } else {
                            toast({ title: "Duplicate destination", description: "This destination is already selected." });
                          }
                        } else if (destination2Input.trim()) {
                          const trimmed = destination2Input.trim();
                          if (trimmed !== destinations[0] && trimmed !== destination3) {
                            setDestination2(trimmed);
                            setDestination2Input("");
                          } else {
                            toast({ title: "Duplicate destination", description: "This destination is already selected." });
                          }
                        }
                      }
                    }}
                    disabled={destination2.length > 0}
                    className="flex-1 min-w-[140px] bg-transparent outline-none px-1 py-2 disabled:opacity-70"
                  />
                </div>
                {destination2Input && (filteredDestination2Suggestions.length > 0 || loadingSuggestions) && (
                  <div className="absolute z-20 mt-1 w-full glass rounded-lg shadow-md border border-gray-300 overflow-hidden bg-white">
                    {loadingSuggestions ? (
                      <div className="p-3 text-sm text-gray-600">Loading...</div>
                    ) : filteredDestination2Suggestions.length > 0 ? (
                      filteredDestination2Suggestions.map((s) => (
                        <button
                          key={s}
                          type="button"
                          className="w-full text-left p-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-all border-b border-gray-200 last:border-b-0"
                          onClick={() => {
                            if (s !== destinations[0] && s !== destination3) {
                              setDestination2(s);
                              setDestination2Input("");
                            } else {
                              toast({ title: "Duplicate destination", description: "This destination is already selected." });
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

          {/* Destination 3 Field (Optional) */}
          {showDestination3 && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <Label className="flex items-center gap-2 text-black dark:text-white font-semibold">
                  <Search className="w-4 h-4 text-blue-500" /> Destination 3
                </Label>
                <button
                  type="button"
                  onClick={() => {
                    setShowDestination3(false);
                    setDestination3("");
                    setDestination3Input("");
                    setStartDate3("");
                    setEndDate3("");
                  }}
                  title="Click to remove Destination 3"
                  className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-all text-red-500 hover:text-red-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="relative">
                <div className="w-full px-3 py-2 rounded-lg glass border border-gray-300 text-gray-900 placeholder-gray-500 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-400/20 transition-all-smooth flex items-center gap-2 flex-wrap">
                  {destination3 && (
                    <div className="inline-flex items-center gap-2 glass px-3 py-1 rounded-full border border-blue-300 bg-blue-50">
                      <span className="text-sm text-gray-900">{destination3}</span>
                      <button type="button" onClick={() => setDestination3("")} className="p-0.5 hover:text-blue-600 transition-all">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                  <input
                    placeholder={t('destination_placeholder')}
                    value={destination3Input}
                    onChange={(e) => setDestination3Input(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        if (filteredDestination3Suggestions.length > 0) {
                          const selected = filteredDestination3Suggestions[0];
                          if (selected !== destinations[0] && selected !== destination2) {
                            setDestination3(selected);
                            setDestination3Input("");
                          } else {
                            toast({ title: "Duplicate destination", description: "This destination is already selected." });
                          }
                        } else if (destination3Input.trim()) {
                          const trimmed = destination3Input.trim();
                          if (trimmed !== destinations[0] && trimmed !== destination2) {
                            setDestination3(trimmed);
                            setDestination3Input("");
                          } else {
                            toast({ title: "Duplicate destination", description: "This destination is already selected." });
                          }
                        }
                      }
                    }}
                    disabled={destination3.length > 0}
                    className="flex-1 min-w-[140px] bg-transparent outline-none px-1 py-2 disabled:opacity-70"
                  />
                </div>
                {destination3Input && (filteredDestination3Suggestions.length > 0 || loadingSuggestions) && (
                  <div className="absolute z-20 mt-1 w-full glass rounded-lg shadow-md border border-gray-300 overflow-hidden bg-white">
                    {loadingSuggestions ? (
                      <div className="p-3 text-sm text-gray-600">Loading...</div>
                    ) : filteredDestination3Suggestions.length > 0 ? (
                      filteredDestination3Suggestions.map((s) => (
                        <button
                          key={s}
                          type="button"
                          className="w-full text-left p-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-all border-b border-gray-200 last:border-b-0"
                          onClick={() => {
                            if (s !== destinations[0] && s !== destination2) {
                              setDestination3(s);
                              setDestination3Input("");
                            } else {
                              toast({ title: "Duplicate destination", description: "This destination is already selected." });
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
              className="w-full px-4 py-3 rounded-lg glass border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 dark:bg-gray-700/30 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all-smooth"
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
            {showDestination2 && (
              <div className="mt-3">
                <Label className="text-xs font-medium text-gray-700 dark:text-gray-200 mb-1">Start Date (Destination 2)</Label>
                <Input
                  type="date"
                  value={startDate2}
                  disabled
                  min={minDate}
                  className="w-full px-4 py-2 rounded-lg glass border border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all-smooth"
                />
              </div>
            )}
            {showDestination3 && (
              <div className="mt-3">
                <Label className="text-xs font-medium text-gray-700 dark:text-gray-200 mb-1">Start Date (Destination 3)</Label>
                <Input
                  type="date"
                  value={startDate3}
                  disabled
                  min={minDate}
                  className="w-full px-4 py-2 rounded-lg glass border border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all-smooth"
                />
              </div>
            )}
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
            {showDestination2 && (
              <div className="mt-3">
                <Label className="text-xs font-medium text-gray-700 dark:text-gray-200 mb-1">End Date (Destination 2)</Label>
                <Input
                  type="date"
                  value={endDate2}
                  onChange={(e) => setEndDate2(e.target.value)}
                  min={startDate2 || minDate}
                  className="w-full px-4 py-2 rounded-lg glass border border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all-smooth"
                />
              </div>
            )}
            {showDestination3 && (
              <div className="mt-3">
                <Label className="text-xs font-medium text-gray-700 dark:text-gray-200 mb-1">End Date (Destination 3)</Label>
                <Input
                  type="date"
                  value={endDate3}
                  onChange={(e) => setEndDate3(e.target.value)}
                  min={startDate3 || minDate}
                  className="w-full px-4 py-2 rounded-lg glass border border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all-smooth"
                />
              </div>
            )}
          </div>

          {/* Travellers */}
          <div>
            <Label className="flex items-center gap-2 text-black dark:text-white font-semibold mb-2 text-sm">
                <Users className="w-4 h-4 text-blue-500" /> {t('travellers')}
              </Label>
              <Input
                placeholder={t('travellers_placeholder')}
              value={travellers}
              onChange={(e) => setTravellers(e.target.value)}
              type="number"
              min="1"
              max="50"
              className="w-full px-4 py-3 rounded-lg glass border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 dark:bg-gray-700/30 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all-smooth"
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