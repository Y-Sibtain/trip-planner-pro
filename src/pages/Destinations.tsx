import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Search, Filter } from "lucide-react";

type DestinationRow = {
  id: string;
  name: string;
  country: string | null;
  image_url: string | null;
  base_price: number | null;
};

const Destinations = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [queryText, setQueryText] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [country, setCountry] = useState<string>("");
  const [minPrice, setMinPrice] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");
  const [results, setResults] = useState<DestinationRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [availableCountries, setAvailableCountries] = useState<string[]>([]);

  const fetchCountries = async () => {
    try {
      const { data, error } = await supabase
        .from("destinations")
        .select("country")
        .neq("country", null)
        .order("country", { ascending: true });

      if (error) {
        console.warn("Failed to load countries:", error);
        return;
      }
      const unique = Array.from(new Set((data || []).map((r: any) => r.country))).filter(Boolean) as string[];
      setAvailableCountries(unique);
    } catch (err) {
      console.error("Error fetching countries:", err);
    }
  };

  useEffect(() => {
    fetchCountries();
    // initial load
    runSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const buildQuery = () => {
    // Start query
    let q: any = supabase.from("destinations").select("id, name, country, image_url, base_price, highlights, type");

    // Text search (name or description only - remove highlights::text cast)
    if (queryText.trim()) {
      const t = queryText.trim();
      q = q.or(`name.ilike.%${t}%`);
    }

    // Country filter
    if (country) {
      q = q.eq("country", country);
    }

    // Price filters
    const min = Number(minPrice);
    const max = Number(maxPrice);
    if (!Number.isNaN(minPrice as any) && minPrice !== "") {
      if (!Number.isNaN(min)) q = q.gte("base_price", min);
    }
    if (!Number.isNaN(maxPrice as any) && maxPrice !== "") {
      if (!Number.isNaN(max)) q = q.lte("base_price", max);
    }

    q = q.order("name", { ascending: true }).limit(200);
    return q;
  };

  const runSearch = async () => {
    setLoading(true);
    try {
      let q: any = supabase
        .from("destinations")
        .select("id, name, country, image_url, base_price");

      // Text search
      if (queryText.trim()) {
        const t = queryText.trim();
        q = q.or(`name.ilike.%${t}%`);
      }

      // Country filter
      if (country) {
        q = q.eq("country", country);
      }

      // Price filters
      if (minPrice && !isNaN(Number(minPrice))) {
        q = q.gte("base_price", Number(minPrice));
      }
      if (maxPrice && !isNaN(Number(maxPrice))) {
        q = q.lte("base_price", Number(maxPrice));
      }

      q = q.order("name", { ascending: true }).limit(200);

      const { data, error } = await q;

      if (error) {
        console.error("Search error:", error.message, error.details, error.hint);
        toast({
          title: "Search failed",
          description: error.message || "Could not fetch destinations",
          variant: "destructive",
        });
        setResults([]);
        return;
      }

      setResults((data || []) as DestinationRow[]);
    } catch (err) {
      console.error("Run search error:", err);
      toast({
        title: "Search failed",
        variant: "destructive",
      });
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setQueryText("");
    setSelectedCategories([]);
    setCountry("");
    setMinPrice("");
    setMaxPrice("");
    runSearch();
  };

  return (
    <div className="min-h-screen bg-white relative overflow-hidden p-4">
      {/* Subtle background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-100 rounded-full blur-3xl opacity-20"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-50 rounded-full blur-3xl opacity-10"></div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-5xl font-bold text-gray-900 mb-2">Explore Destinations</h1>
          <p className="text-gray-600">Search and filter destinations by name, country, or price</p>
        </div>

        {/* Search & Filters Section */}
        <div className="glass p-8 rounded-lg border border-gray-200 backdrop-blur-sm shadow-md mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Search */}
            <div className="md:col-span-2 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Search Destinations</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Search by name or highlights..."
                    value={queryText}
                    onChange={(e) => setQueryText(e.target.value)}
                    className="flex-1 px-4 py-3 rounded-lg glass border border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all-smooth"
                  />
                  <Button 
                    onClick={runSearch}
                    className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-lg hover:shadow-lg transition-all-smooth"
                  >
                    <Search className="w-4 h-4 mr-2" /> Search
                  </Button>
                </div>
              </div>

              {/* Country Filter */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Country / Region</label>
                <div className="flex gap-2">
                  <select 
                    value={country} 
                    onChange={(e) => setCountry(e.target.value)}
                    className="flex-1 px-4 py-3 rounded-lg glass border border-gray-300 text-gray-900 bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all-smooth"
                  >
                    <option value="">All countries</option>
                    {availableCountries.map((c) => (
                      <option key={c} value={c} className="bg-white">
                        {c}
                      </option>
                    ))}
                  </select>
                  <Button 
                    variant="outline" 
                    onClick={() => { setCountry(""); runSearch(); }}
                    className="border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    Clear
                  </Button>
                </div>
              </div>
            </div>

            {/* Price Filter */}
            <div className="space-y-4">
              <label className="block text-sm font-semibold text-gray-900 mb-2">Price Range</label>
              <div className="flex gap-2">
                <input 
                  type="number" 
                  placeholder="Min (PKR)" 
                  value={minPrice} 
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="flex-1 px-4 py-3 rounded-lg glass border border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all-smooth text-sm"
                />
                <input 
                  type="number" 
                  placeholder="Max (PKR)" 
                  value={maxPrice} 
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="flex-1 px-4 py-3 rounded-lg glass border border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all-smooth text-sm"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <Button 
                  onClick={runSearch}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-lg hover:shadow-lg transition-all-smooth text-sm"
                >
                  Apply
                </Button>
                <Button 
                  onClick={clearFilters}
                  className="flex-1 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 font-semibold rounded-lg transition-all-smooth text-sm"
                >
                  Reset
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Results */}
        <div>
          {loading ? (
            <div className="glass p-12 rounded-2xl border border-cyan-500/20 text-center">
              <div className="inline-flex items-center justify-center">
                <div className="relative w-12 h-12">
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full animate-spin" style={{maskImage: 'conic-gradient(transparent 75%, black)'}}></div>
                </div>
              </div>
              <p className="text-cyan-200 mt-4 font-semibold">Searching destinations...</p>
            </div>
          ) : results.length === 0 ? (
            <div className="glass p-12 rounded-2xl border border-cyan-500/20 text-center">
              <p className="text-cyan-200/70 text-lg">No destinations match your search/filter.</p>
              <p className="text-cyan-200/50 text-sm mt-2">Try adjusting your filters or search terms</p>
            </div>
          ) : (
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {results.map((d) => (
                <div 
                  key={d.id}
                  className="group glass rounded-xl overflow-hidden border border-cyan-500/20 backdrop-blur-lg hover:border-cyan-400/50 hover:glow-primary transition-all-smooth hover:scale-105 cursor-pointer"
                >
                  {/* Image */}
                  <div className="h-48 bg-gradient-to-br from-slate-800 to-slate-900 overflow-hidden relative">
                    {d.image_url ? (
                      <img 
                        src={d.image_url} 
                        alt={d.name} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-cyan-200/50 text-3xl">📍</div>
                    )}
                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent"></div>
                  </div>

                  {/* Content */}
                  <div className="p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-bold text-white text-lg group-hover:text-cyan-300 transition-colors">{d.name}</h3>
                        <p className="text-cyan-200/60 text-sm">{d.country || 'Unknown'}</p>
                      </div>
                    </div>

                    {/* Price */}
                    <div className="border-t border-cyan-500/10 pt-3">
                      <p className="text-xs text-cyan-200/50 mb-1">Starting from</p>
                      <p className="text-lg font-bold text-gradient">
                        {d.base_price != null ? `PKR ${Number(d.base_price).toLocaleString()}` : "—"}
                      </p>
                    </div>

                    {/* Plan Button */}
                    <Button 
                      className="w-full bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-900 font-semibold rounded-lg glow-primary hover:scale-105 transition-all-smooth mt-4"
                      onClick={() => {
                        navigate("/", { state: { prefill: { source: "", destinations: [d.name], budget: "", startDate: "", endDate: "" } } });
                      }}
                    >
                      Plan Trip →
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Destinations;