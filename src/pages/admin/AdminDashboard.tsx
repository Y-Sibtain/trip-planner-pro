import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAdmin } from "@/hooks/useAdmin";

/**
 * Admin Dashboard
 * - Shows counts for key tables (destinations, itineraries, profiles, saved itineraries)
 * - Shows top users by number of saved itineraries (joined with profiles)
 *
 * Requires the current user to be admin (useAdmin hook).
 */
const AdminDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAdmin, loading: adminLoading } = useAdmin();

  const [loading, setLoading] = useState(false);
  const [counts, setCounts] = useState({
    destinations: 0,
    itineraries: 0,
    profiles: 0,
    savedItineraries: 0,
  });
  const [topUsers, setTopUsers] = useState<
    { user_id: string; full_name?: string | null; email?: string | null; savedCount: number }[]
  >([]);

  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      // Not an admin — redirect or show nothing
      navigate("/");
    } else if (!adminLoading && isAdmin) {
      loadDashboard();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, adminLoading]);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      // Note: using count via select with head=false and count:'exact'
      const [{ data: destData, error: destErr }, { data: itinData, error: itinErr }, { data: profData, error: profErr }, { data: savedData, error: savedErr }] = await Promise.all([
        supabase.from("destinations").select("id", { count: "exact", head: false }),
        supabase.from("itineraries").select("id", { count: "exact", head: false }),
        supabase.from("profiles").select("id", { count: "exact", head: false }),
        supabase.from("saved_itineraries").select("id", { count: "exact", head: false }),
      ]);

      if (destErr || itinErr || profErr || savedErr) {
        console.warn("Count errors", { destErr, itinErr, profErr, savedErr });
        toast({ title: "Error", description: "Failed to fetch some counts.", variant: "destructive" });
      }

      setCounts({
        destinations: (destData as any[] | null)?.length || 0,
        itineraries: (itinData as any[] | null)?.length || 0,
        profiles: (profData as any[] | null)?.length || 0,
        savedItineraries: (savedData as any[] | null)?.length || 0,
      });

      // For top users, fetch saved_itineraries (owner_id) and aggregate client-side,
      // then fetch profile names for those owners.
      const { data: savedRows, error: savedRowsErr } = await supabase
        .from("saved_itineraries")
        .select("owner_id")
        .order("created_at", { ascending: false })
        .limit(1000); // adjust as needed

      if (savedRowsErr) {
        console.warn("Failed to fetch saved rows:", savedRowsErr);
        setTopUsers([]);
        return;
      }
      // Aggregate counts
      const map = new Map<string, number>();
      (savedRows || []).forEach((r: any) => {
        const id = r.owner_id;
        if (!id) return;
        map.set(id, (map.get(id) || 0) + 1);
      });
      const entries = Array.from(map.entries()).map(([user_id, savedCount]) => ({ user_id, savedCount }));
      entries.sort((a, b) => b.savedCount - a.savedCount);
      const top = entries.slice(0, 10);

      // Fetch profile names for these users
      const ownerIds = top.map((t) => t.user_id);
      const { data: profiles, error: profilesErr } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", ownerIds);

      if (profilesErr) {
        console.warn("Failed to fetch profiles for top users:", profilesErr);
      }
      const profileMap = new Map<string, string | null>();
      (profiles || []).forEach((p: any) => profileMap.set(p.id, p.full_name || null));

      // Try to fetch emails via user_roles/profile mapping is limited — auth.users cannot be read client-side.
      // For email, you'd use a server endpoint (service_role) — we omit email here to avoid exposing service role.
      setTopUsers(
        top.map((t) => ({
          user_id: t.user_id,
          full_name: profileMap.get(t.user_id) ?? null,
          email: null,
          savedCount: t.savedCount,
        }))
      );
    } catch (err) {
      console.error("Dashboard load error:", err);
      toast({ title: "Error", description: "Failed to load dashboard.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (adminLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div>Loading admin dashboard…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4">
      <h1 className="text-2xl font-semibold mb-4">Admin Dashboard</h1>

      <div className="grid md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Destinations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{counts.destinations}</div>
            <div className="text-sm text-muted-foreground mt-2">Total destinations</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Itineraries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{counts.itineraries}</div>
            <div className="text-sm text-muted-foreground mt-2">Admin-managed itineraries</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Profiles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{counts.profiles}</div>
            <div className="text-sm text-muted-foreground mt-2">User profiles</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Saved plans</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{counts.savedItineraries}</div>
            <div className="text-sm text-muted-foreground mt-2">Saved itineraries by users</div>
          </CardContent>
        </Card>
      </div>

      <div className="mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Top users by saved itineraries</CardTitle>
          </CardHeader>
          <CardContent>
            {topUsers.length === 0 ? (
              <div className="text-muted-foreground">No data yet.</div>
            ) : (
              <div className="space-y-2">
                {topUsers.map((u) => (
                  <div key={u.user_id} className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{u.full_name ?? u.user_id}</div>
                      <div className="text-sm text-muted-foreground">{u.email ?? "email not available (server-only)"}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{u.savedCount}</div>
                      <div className="text-sm text-muted-foreground">saved</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-2">
        <Button onClick={loadDashboard}>Refresh</Button>
        <Button variant="outline" onClick={() => navigate("/admin/users")}>
          Manage users
        </Button>
        <Button variant="ghost" onClick={() => navigate("/admin")}>
          Manage content
        </Button>
      </div>
    </div>
  );
};

export default AdminDashboard;