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
    <div className="min-h-screen p-4">
      <Card className="max-w-6xl mx-auto">
        <CardHeader>
          <div className="w-full flex items-center justify-between">
            <div>
              <CardTitle>Explore Destinations</CardTitle>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => navigate("/admin")}>Admin</Button>
            </div>
          </div>
          <div className="mt-2 text-muted-foreground">Search and filter destinations by name, type, country, or cost.</div>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="md:col-span-2 space-y-3">
              <div>
                <Label>Search</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Search by name or highlight (e.g., beach, hike, museum)"
                    value={queryText}
                    onChange={(e) => setQueryText(e.target.value)}
                  />
                  <Button onClick={runSearch}>
                    <Search className="w-4 h-4 mr-2" /> Search
                  </Button>
                </div>
              </div>

              <div>
                <Label>Country / Region</Label>
                <div className="flex gap-2 mt-2">
                  <select value={country} onChange={(e) => setCountry(e.target.value)} className="border rounded p-2">
                    <option value="">All countries</option>
                    {availableCountries.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>

                  <Button variant="outline" onClick={() => { setCountry(""); runSearch(); }}>
                    Clear country
                  </Button>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Label>Price filter (base price)</Label>
              <div className="flex gap-2">
                <Input placeholder="Min (PKR)" type="number" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} />
                <Input placeholder="Max (PKR)" type="number" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} />
              </div>

              <div className="flex gap-2 mt-2">
                <Button onClick={runSearch}>Apply filters</Button>
                <Button variant="outline" onClick={clearFilters}>
                  Reset
                </Button>
              </div>

              <div className="mt-4">
                <Label>Tips</Label>
                <div className="text-sm text-muted-foreground mt-1">
                  Use the search box to match destination names or highlights. Combine filters to narrow results by region, type, or cost.
                </div>
              </div>
            </div>
          </div>

          <div>
            {loading ? (
              <div className="p-8 text-center">Loading...</div>
            ) : results.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">No destinations match your search/filter.</div>
            ) : (
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {results.map((d) => (
                  <div key={d.id} className="border rounded-lg overflow-hidden bg-background">
                    <div className="h-40 bg-slate-100">
                      {d.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={d.image_url} alt={d.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">No image</div>
                      )}
                    </div>
                    <div className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-semibold">{d.name}</div>
                          <div className="text-sm text-muted-foreground">{d.country}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-muted-foreground">From</div>
                          <div className="font-medium">{d.base_price != null ? `PKR ${Number(d.base_price).toFixed(2)}` : "—"}</div>
                        </div>
                      </div>

                      <div className="mt-4 flex gap-2">
                        <Button variant="outline" onClick={() => {
                          // Pre-fill planner with this destination (quick start)
                          navigate("/", { state: { prefill: { source: "", destinations: [d.name], budget: "", startDate: "", endDate: "" } } });
                        }}>
                          Plan
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Destinations;