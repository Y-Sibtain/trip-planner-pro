import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { TripFormData } from "@/components/TripPlannerForm";
import { Edit3, RefreshCw, Save } from "lucide-react";
import { useBooking } from "@/contexts/BookingContext";

type DayPlan = {
  dayIndex: number;
  date: string;
  destination: string;
  title: string;
  activities: string[];
  cost: {
    accommodation: number;
    food: number;
    transport: number;
    activities: number;
    other?: number;
  };
};

type GeneratedItinerary = {
  title: string;
  totalDays: number;
  days: DayPlan[];
  totals: {
    accommodation: number;
    food: number;
    transport: number;
    activities: number;
    other: number;
    grandTotal: number;
  };
  meta: {
    perDestinationSummary: {
      destination: string;
      nights: number;
      estimatedCost: number;
    }[];
    // optional: include original trip input for reload convenience
    tripInput?: TripFormData;
    source?: string;
    destinations?: string[];
  };
};

interface TripResultsProps {
  tripData: TripFormData | null;
  allowSave?: boolean;
}

const DEFAULTS = {
  transportPerDestination: 200, // rough estimate per destination (round-trip)
  foodPerDay: 50,
  activityPerDay: 30,
  defaultAccommodationPerNight: 120,
};

const formatCurrency = (v: number) =>
  v.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 2 });

const daysBetweenInclusive = (start: string, end: string) => {
  const s = new Date(start);
  const e = new Date(end);
  const ms = e.getTime() - s.getTime();
  const days = Math.floor(ms / (1000 * 60 * 60 * 24)) + 1;
  return days > 0 ? days : 1;
};

const TripResults = ({ tripData, allowSave = true }: TripResultsProps) => {
  const { toast } = useToast();
  const { user } = useBooking();
  const [generating, setGenerating] = useState(false);
  const [itinerary, setItinerary] = useState<GeneratedItinerary | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const originalRef = useRef<GeneratedItinerary | null>(null);

  // Budget management state (simple controls)
  const [budgetInput, setBudgetInput] = useState<string>("");
  const [appliedBudget, setAppliedBudget] = useState<number | null>(null);
  const [autoAdjust, setAutoAdjust] = useState<boolean>(true);

  useEffect(() => {
    if (tripData) {
      generateItinerary(tripData);
      setBudgetInput(tripData.budget || "");
      setAppliedBudget(null);
    } else {
      setItinerary(null);
      originalRef.current = null;
      setBudgetInput("");
      setAppliedBudget(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tripData]);

  useEffect(() => {
    if (!autoAdjust) return;
    const handler = setTimeout(() => {
      if (!budgetInput || !itinerary) return;
      const parsed = Number(budgetInput);
      if (!Number.isNaN(parsed) && parsed > 0) {
        applyBudget(parsed);
      }
    }, 450);
    return () => clearTimeout(handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [budgetInput, autoAdjust]);

  const generateItinerary = async (data: TripFormData) => {
    setGenerating(true);
    setEditing(false);
    try {
      const totalDays = daysBetweenInclusive(data.startDate, data.endDate);

      // Try to enrich with destination metadata
      const { data: destRows, error: destErr } = await supabase
        .from("destinations")
        .select("id, name, base_price, highlights")
        .in("name", data.destinations as string[]);

      if (destErr) {
        console.warn("Failed to fetch destination metadata:", destErr);
      }

      const destMap = new Map<string, any>();
      (destRows || []).forEach((r: any) => destMap.set(r.name, r));

      // Allocate days to each destination
      const destCount = data.destinations.length || 1;
      const basePerDest = Math.floor(totalDays / destCount);
      let remainder = totalDays % destCount;
      const allocation: Record<string, number> = {};
      data.destinations.forEach((d) => {
        allocation[d] = basePerDest + (remainder > 0 ? 1 : 0);
        if (remainder > 0) remainder -= 1;
      });

      // Optionally fetch itineraries per destination to enrich activities/prices
      const destIdMap = new Map<string, any>();
      for (const destName of data.destinations) {
        const row = destMap.get(destName);
        if (row?.id) {
          const { data: its, error: itsErr } = await supabase
            .from("itineraries")
            .select("id, title, description, duration_days, price, activities, included_services")
            .eq("destination_id", row.id)
            .limit(5);
          if (!itsErr && its && its.length > 0) {
            const match = its.reduce((best: any | null, cur: any) => {
              if (!best) return cur;
              const target = allocation[destName];
              const diffCur = Math.abs((cur.duration_days || target) - target);
              const diffBest = Math.abs((best.duration_days || target) - target);
              return diffCur < diffBest ? cur : best;
            }, null);
            destIdMap.set(destName, { destRow: row, itinerary: match });
          } else {
            destIdMap.set(destName, { destRow: row, itinerary: null });
          }
        } else {
          destIdMap.set(destName, { destRow: null, itinerary: null });
        }
      }

      // Build day-by-day
      const days: DayPlan[] = [];
      let cursor = new Date(data.startDate);
      let dayIndex = 1;
      const perDestinationSummary: GeneratedItinerary["meta"]["perDestinationSummary"] = [];

      for (const destName of data.destinations) {
        const nights = allocation[destName];
        const destInfo = destIdMap.get(destName);

        const accommodationPerNight =
          destInfo?.destRow?.base_price ??
          (destInfo?.itinerary?.price && destInfo?.itinerary?.duration_days
            ? Number(destInfo.itinerary.price) / Math.max(1, destInfo.itinerary.duration_days)
            : DEFAULTS.defaultAccommodationPerNight);

        const transportEstimate = DEFAULTS.transportPerDestination;

        const activitiesPool: string[] =
          (destInfo?.itinerary?.activities as string[])?.length
            ? destInfo.itinerary.activities
            : (destInfo?.itinerary?.included_services as string[])?.length
            ? destInfo.itinerary.included_services
            : (destInfo?.destRow?.highlights as string[])?.slice(0, 6) || [
                `City tour in ${destName}`,
                `Visit main attractions`,
                `Local market & food tasting`,
                `Evening cultural show`,
              ];

        let localActivityIdx = 0;
        let destTotalEstimated = 0;

        for (let i = 0; i < nights; i++) {
          const dateStr = new Date(cursor).toISOString().slice(0, 10);
          const dayActivities = [
            i === 0 ? `Arrive in ${destName}, check-in` : `Explore ${destName}`,
            activitiesPool[localActivityIdx % activitiesPool.length] || `Explore ${destName}`,
            "Try local restaurant",
          ];
          localActivityIdx++;

          const accommodation = Number(accommodationPerNight || DEFAULTS.defaultAccommodationPerNight);
          const food = DEFAULTS.foodPerDay;
          const activitiesCost = DEFAULTS.activityPerDay;
          const transport = i === 0 ? transportEstimate : 0;

          const dayCost = accommodation + food + activitiesCost + transport;
          destTotalEstimated += dayCost;

          days.push({
            dayIndex,
            date: dateStr,
            destination: destName,
            title: `${destName} - Day ${i + 1}`,
            activities: dayActivities,
            cost: {
              accommodation,
              food,
              transport,
              activities: activitiesCost,
            },
          });

          const next = new Date(cursor);
          next.setDate(next.getDate() + 1);
          cursor = next;
          dayIndex++;
        }

        perDestinationSummary.push({
          destination: destName,
          nights,
          estimatedCost: Math.round(destTotalEstimated),
        });
      }

      // Totals
      const totals = days.reduce(
        (acc, d) => {
          acc.accommodation += d.cost.accommodation;
          acc.food += d.cost.food;
          acc.transport += d.cost.transport;
          acc.activities += d.cost.activities;
          return acc;
        },
        { accommodation: 0, food: 0, transport: 0, activities: 0 }
      );

      const grandTotal = totals.accommodation + totals.food + totals.transport + totals.activities;

      const generated: GeneratedItinerary = {
        title: `${data.destinations.join(" → ")} (${data.startDate} — ${data.endDate})`,
        totalDays,
        days,
        totals: {
          accommodation: Math.round(totals.accommodation),
          food: Math.round(totals.food),
          transport: Math.round(totals.transport),
          activities: Math.round(totals.activities),
          other: 0,
          grandTotal: Math.round(grandTotal),
        },
        meta: {
          perDestinationSummary,
          tripInput: data,
          source: data.source,
          destinations: data.destinations,
        },
      };

      // Save original for scaling/restores
      originalRef.current = JSON.parse(JSON.stringify(generated));
      setItinerary(generated);

      // Budget analysis
      if (data.budget) {
        const budgetNum = Number(data.budget);
        if (!Number.isNaN(budgetNum)) {
          if (budgetNum < generated.totals.grandTotal) {
            toast({
              title: "Budget warning",
              description: `Estimated trip cost ${formatCurrency(generated.totals.grandTotal)} exceeds your budget ${formatCurrency(
                budgetNum
              )}. Consider increasing your budget or reducing destinations.`,
              variant: "destructive",
            });
          } else {
            toast({
              title: "Within budget",
              description: `Estimated trip cost ${formatCurrency(generated.totals.grandTotal)} is within your budget ${formatCurrency(budgetNum)}.`,
            });
          }
        }
      }
    } catch (err) {
      console.error("Itinerary generation error:", err);
      toast({ title: "Error", description: "Failed to generate itinerary.", variant: "destructive" });
      setItinerary(null);
      originalRef.current = null;
    } finally {
      setGenerating(false);
    }
  };

  const recalculateTotals = (current: GeneratedItinerary) => {
    const totals = current.days.reduce(
      (acc, d) => {
        acc.accommodation += d.cost.accommodation;
        acc.food += d.cost.food;
        acc.transport += d.cost.transport;
        acc.activities += d.cost.activities;
        return acc;
      },
      { accommodation: 0, food: 0, transport: 0, activities: 0 }
    );
    const grand = totals.accommodation + totals.food + totals.transport + totals.activities + (current.totals.other || 0);
    setItinerary({
      ...current,
      totals: {
        accommodation: Math.round(totals.accommodation),
        food: Math.round(totals.food),
        transport: Math.round(totals.transport),
        activities: Math.round(totals.activities),
        other: current.totals.other || 0,
        grandTotal: Math.round(grand),
      },
    });
  };

  const updateDay = (dayIndex: number, patch: Partial<DayPlan>) => {
    if (!itinerary) return;
    const days = itinerary.days.map((d) => (d.dayIndex === dayIndex ? { ...d, ...patch } : d));
    const updated = { ...itinerary, days };
    recalculateTotals(updated);
  };

  // Budget scaling algorithm - simple proportional scale from original
  const applyBudget = (budgetValue: number) => {
    if (!originalRef.current) {
      toast({ title: "No itinerary", description: "Generate an itinerary before applying a budget.", variant: "destructive" });
      return;
    }
    if (budgetValue <= 0 || Number.isNaN(budgetValue)) {
      toast({ title: "Invalid budget", description: "Enter a positive budget amount.", variant: "destructive" });
      return;
    }

    const base = originalRef.current.totals.grandTotal;
    if (budgetValue >= base) {
      const restored = JSON.parse(JSON.stringify(originalRef.current)) as GeneratedItinerary;
      setItinerary(restored);
      setAppliedBudget(budgetValue);
      toast({ title: "Budget applied", description: `Budget ${formatCurrency(budgetValue)} is enough. No scaling applied.` });
      return;
    }

    const scale = budgetValue / base;
    const scaled = JSON.parse(JSON.stringify(originalRef.current)) as GeneratedItinerary;

    scaled.days = scaled.days.map((d) => {
      const accommodation = Math.max(10, Math.round(d.cost.accommodation * scale));
      const food = Math.max(1, Math.round(d.cost.food * scale));
      const activities = Math.max(0, Math.round(d.cost.activities * scale));
      // transport lowered less aggressively
      const transport = Math.max(0, Math.round(d.cost.transport * Math.min(1, scale + 0.25)));

      return {
        ...d,
        cost: { ...d.cost, accommodation, food, activities, transport },
      } as DayPlan;
    });

    const totals = scaled.days.reduce(
      (acc, d) => {
        acc.accommodation += d.cost.accommodation;
        acc.food += d.cost.food;
        acc.transport += d.cost.transport;
        acc.activities += d.cost.activities;
        return acc;
      },
      { accommodation: 0, food: 0, transport: 0, activities: 0 }
    );
    const grand = totals.accommodation + totals.food + totals.transport + totals.activities;
    scaled.totals = {
      accommodation: Math.round(totals.accommodation),
      food: Math.round(totals.food),
      transport: Math.round(totals.transport),
      activities: Math.round(totals.activities),
      other: scaled.totals.other || 0,
      grandTotal: Math.round(grand),
    };

    setItinerary(scaled);
    setAppliedBudget(budgetValue);

    const diff = budgetValue - scaled.totals.grandTotal;
    if (diff < 0) {
      toast({
        title: "Budget adjusted",
        description: `We scaled the itinerary but the estimate (${formatCurrency(scaled.totals.grandTotal)}) is still ${formatCurrency(
          Math.abs(diff)
        )} over your budget.`,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Budget applied",
        description: `Itinerary scaled to fit your budget. New estimate: ${formatCurrency(scaled.totals.grandTotal)}.`,
      });
    }
  };

  const resetToGenerated = () => {
    if (!originalRef.current) return;
    setItinerary(JSON.parse(JSON.stringify(originalRef.current)));
    setAppliedBudget(null);
    setBudgetInput(tripData?.budget || "");
    toast({ title: "Restored", description: "Itinerary restored to original generated values." });
  };

  const handleSaveItinerary = async () => {
    if (!itinerary) return;
    setSaving(true);
    try {
      const { data: sessionData } = await supabase.auth.getUser();
      const userId = sessionData?.user?.id;
      if (!userId) {
        toast({ title: "Not signed in", description: "Sign in to save itineraries.", variant: "destructive" });
        setSaving(false);
        return;
      }

      // include original trip input in meta for easier reload
      const payload = {
        owner_id: userId,
        title: itinerary.title,
        plan: itinerary,
        total_price: itinerary.totals.grandTotal,
      };

      const { data: insertData, error } = await supabase.from("saved_itineraries").insert([payload]).select().maybeSingle();
      if (error) {
        console.warn("Could not save itinerary:", error);
        toast({
          title: "Save failed",
          description:
            "Failed to save itinerary. Ensure the 'saved_itineraries' table exists with correct RLS or contact admin. (You can still copy details manually.)",
          variant: "destructive",
        });
        setSaving(false);
        return;
      }

      // create persistent notification for the user
      try {
        await supabase.from("notifications").insert([
          {
            user_id: userId,
            type: "itinerary_saved",
            title: "Itinerary saved",
            message: `Your itinerary "${itinerary.title}" was saved successfully.`,
            data: { saved_itinerary_id: insertData?.id || null },
          },
        ]);
      } catch (notifErr) {
        console.warn("Failed to create notification:", notifErr);
      }

      toast({ title: "Itinerary saved", description: "Your itinerary was saved to your account." });
    } catch (err: any) {
      console.error("Save itinerary error:", err);
      toast({ title: "Error", description: err?.message ?? "Failed to save itinerary.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (!tripData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Your trip results will appear here</CardTitle>
        </CardHeader>
        <CardContent>
          Use the planner form to generate a suggested itinerary based on destinations, dates and budget.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4" aria-live="polite">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-xl font-semibold">Generated Itinerary</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => generateItinerary(tripData)} disabled={generating}>
            <RefreshCw className="w-4 h-4 mr-2" /> Regenerate
          </Button>
          <Button variant="ghost" onClick={() => setEditing(!editing)}>
            <Edit3 className="w-4 h-4 mr-2" /> {editing ? "Preview" : "Edit"}
          </Button>
          {allowSave && (
            <Button onClick={handleSaveItinerary} disabled={saving || generating}>
              <Save className="w-4 h-4 mr-2" /> Save Itinerary
            </Button>
          )}
        </div>
      </div>

      {generating && (
        <Card>
          <CardContent>Generating itinerary…</CardContent>
        </Card>
      )}

      {itinerary && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>{itinerary.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <h3 className="font-medium">Summary</h3>
                  <p>Total days: {itinerary.totalDays}</p>
                  <p>
                    Estimated cost: <strong>{formatCurrency(itinerary.totals.grandTotal)}</strong>
                  </p>
                  <div className="mt-2">
                    <h4 className="font-medium">Breakdown</h4>
                    <ul className="list-disc ml-5">
                      <li>Accommodation: {formatCurrency(itinerary.totals.accommodation)}</li>
                      <li>Food: {formatCurrency(itinerary.totals.food)}</li>
                      <li>Transport: {formatCurrency(itinerary.totals.transport)}</li>
                      <li>Activities: {formatCurrency(itinerary.totals.activities)}</li>
                      {itinerary.totals.other ? <li>Other: {formatCurrency(itinerary.totals.other)}</li> : null}
                    </ul>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium">Per-destination</h3>
                  <ul className="list-disc ml-5">
                    {itinerary.meta.perDestinationSummary.map((p) => (
                      <li key={p.destination}>
                        {p.destination} — {p.nights} night(s) — est. {formatCurrency(p.estimatedCost)}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="font-medium">Budget Control</h3>
                  <div className="space-y-2">
                    <label className="text-sm text-muted-foreground">Set target budget (USD)</label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        className="border rounded p-2 flex-1"
                        value={budgetInput}
                        onChange={(e) => setBudgetInput(e.target.value)}
                        placeholder="e.g., 2500"
                        min={0}
                        step="1"
                      />
                      <Button
                        onClick={() => {
                          const parsed = Number(budgetInput);
                          if (Number.isNaN(parsed) || parsed <= 0) {
                            toast({ title: "Invalid budget", description: "Enter a valid number.", variant: "destructive" });
                            return;
                          }
                          applyBudget(parsed);
                        }}
                      >
                        Apply
                      </Button>
                    </div>

                    <div className="flex items-center gap-2">
                      <input id="autoAdjust" type="checkbox" checked={autoAdjust} onChange={(e) => setAutoAdjust(e.target.checked)} />
                      <label htmlFor="autoAdjust" className="text-sm">
                        Auto-adjust as I type
                      </label>
                    </div>

                    <div className="flex gap-2">
                      <Button variant="outline" onClick={resetToGenerated} disabled={!originalRef.current}>
                        Reset
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => {
                          if (appliedBudget) {
                            toast({ title: "Applied budget", description: `Budget in effect: ${formatCurrency(appliedBudget)}` });
                          } else {
                            toast({ title: "No budget applied", description: "No target budget has been applied." });
                          }
                        }}
                      >
                        Info
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-3">
            {itinerary.days.map((d) => (
              <Card key={d.dayIndex}>
                <CardHeader>
                  <div className="flex items-center justify-between w-full">
                    <div>
                      <div className="text-sm text-muted-foreground">
                        Day {d.dayIndex} • {d.date} • {d.destination}
                      </div>
                      <div className="font-semibold">{d.title}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">Estimated</div>
                      <div className="font-medium">{formatCurrency(d.cost.accommodation + d.cost.food + d.cost.activities + d.cost.transport)}</div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium">Activities</h4>
                      {editing ? (
                        <textarea
                          className="w-full border rounded p-2"
                          value={d.activities.join("\n")}
                          onChange={(e) => updateDay(d.dayIndex, { activities: e.target.value.split("\n").map((s) => s.trim()).filter(Boolean) })}
                        />
                      ) : (
                        <ul className="list-disc ml-5">
                          {d.activities.map((a, i) => (
                            <li key={i}>{a}</li>
                          ))}
                        </ul>
                      )}
                    </div>

                    <div>
                      <h4 className="font-medium">Costs</h4>
                      <div className="grid grid-cols-2 gap-2">
                        <label className="text-sm text-muted-foreground">Accommodation</label>
                        <input
                          type="number"
                          value={d.cost.accommodation}
                          onChange={(e) => updateDay(d.dayIndex, { cost: { ...d.cost, accommodation: Number(e.target.value) } })}
                          className="border rounded p-1"
                          disabled={!editing}
                        />
                        <label className="text-sm text-muted-foreground">Food</label>
                        <input
                          type="number"
                          value={d.cost.food}
                          onChange={(e) => updateDay(d.dayIndex, { cost: { ...d.cost, food: Number(e.target.value) } })}
                          className="border rounded p-1"
                          disabled={!editing}
                        />
                        <label className="text-sm text-muted-foreground">Activities</label>
                        <input
                          type="number"
                          value={d.cost.activities}
                          onChange={(e) => updateDay(d.dayIndex, { cost: { ...d.cost, activities: Number(e.target.value) } })}
                          className="border rounded p-1"
                          disabled={!editing}
                        />
                        <label className="text-sm text-muted-foreground">Transport</label>
                        <input
                          type="number"
                          value={d.cost.transport}
                          onChange={(e) => updateDay(d.dayIndex, { cost: { ...d.cost, transport: Number(e.target.value) } })}
                          className="border rounded p-1"
                          disabled={!editing}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {editing && (
            <div className="flex justify-end gap-2">
              <Button
                onClick={() => {
                  if (itinerary) {
                    recalculateTotals(itinerary);
                    setEditing(false);
                    toast({ title: "Itinerary updated", description: "Recalculated totals saved to view." });
                  }
                }}
              >
                Apply changes & Recalculate
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default TripResults;