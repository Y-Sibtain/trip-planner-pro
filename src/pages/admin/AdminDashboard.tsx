import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAdmin } from "@/hooks/useAdmin";
import { RefreshCw, Users, MapPin, Calendar, BookOpen, TrendingUp, Activity } from "lucide-react";

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
        toast({ title: "Notice", description: "Dashboard data has been loaded." });
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
      toast({ title: "Notice", description: "Dashboard refresh completed." });
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
    <div className="min-h-screen p-4 bg-white dark:bg-gray-900">
      <h1 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-white">Admin Dashboard</h1>

      {/* Graphical Analysis Blocks */}
      <div className="grid md:grid-cols-4 gap-4 mb-8">
        {/* Destinations Card */}
        <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow dark:bg-gradient-to-br dark:from-gray-800 dark:to-gray-900">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Destinations</p>
                <p className="text-4xl font-bold text-gray-900 dark:text-white mt-2">{counts.destinations}</p>
              </div>
              <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-lg">
                <MapPin className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <TrendingUp className="w-4 h-4 text-green-500" />
              <span>Available locations</span>
            </div>
            <div className="mt-4 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-blue-500 to-blue-600" style={{ width: `${Math.min((counts.destinations / 50) * 100, 100)}%` }}></div>
            </div>
          </CardContent>
        </Card>

        {/* Itineraries Card */}
        <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow dark:bg-gradient-to-br dark:from-gray-800 dark:to-gray-900">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Itineraries</p>
                <p className="text-4xl font-bold text-gray-900 dark:text-white mt-2">{counts.itineraries}</p>
              </div>
              <div className="bg-purple-100 dark:bg-purple-900/30 p-3 rounded-lg">
                <Calendar className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <Activity className="w-4 h-4 text-orange-500" />
              <span>Travel packages</span>
            </div>
            <div className="mt-4 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-purple-500 to-purple-600" style={{ width: `${Math.min((counts.itineraries / 100) * 100, 100)}%` }}></div>
            </div>
          </CardContent>
        </Card>

        {/* Profiles Card */}
        <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow dark:bg-gradient-to-br dark:from-gray-800 dark:to-gray-900">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">User Profiles</p>
                <p className="text-4xl font-bold text-gray-900 dark:text-white mt-2">{counts.profiles}</p>
              </div>
              <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-lg">
                <Users className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <TrendingUp className="w-4 h-4 text-green-500" />
              <span>Active users</span>
            </div>
            <div className="mt-4 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-green-500 to-green-600" style={{ width: `${Math.min((counts.profiles / 100) * 100, 100)}%` }}></div>
            </div>
          </CardContent>
        </Card>

        {/* Saved Itineraries Card */}
        <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow dark:bg-gradient-to-br dark:from-gray-800 dark:to-gray-900">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Saved Plans</p>
                <p className="text-4xl font-bold text-gray-900 dark:text-white mt-2">{counts.savedItineraries}</p>
              </div>
              <div className="bg-red-100 dark:bg-red-900/30 p-3 rounded-lg">
                <BookOpen className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <TrendingUp className="w-4 h-4 text-green-500" />
              <span>User-saved plans</span>
            </div>
            <div className="mt-4 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-red-500 to-red-600" style={{ width: `${Math.min((counts.savedItineraries / 200) * 100, 100)}%` }}></div>
            </div>
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

      <div className="flex gap-2 flex-wrap justify-between items-center">
        <div className="flex gap-2 flex-wrap">
          <Button 
            onClick={() => navigate("/admin/admin-bookings")}
            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-lg hover:shadow-lg transition-all-smooth hover:scale-105"
          >
            <BookOpen className="w-4 h-4 mr-2" />
            Manage Bookings
          </Button>
          <Button 
            onClick={() => navigate("/admin/destinations")}
            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-lg hover:shadow-lg transition-all-smooth hover:scale-105"
          >
            <MapPin className="w-4 h-4 mr-2" />
            Manage Destinations
          </Button>
          <Button 
            onClick={() => navigate("/admin/itineraries")}
            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-lg hover:shadow-lg transition-all-smooth hover:scale-105"
          >
            <Calendar className="w-4 h-4 mr-2" />
            Manage Itineraries
          </Button>
          <Button 
            onClick={() => navigate("/admin/users")}
            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-lg hover:shadow-lg transition-all-smooth hover:scale-105"
          >
            <Users className="w-4 h-4 mr-2" />
            Manage Users
          </Button>
        </div>
        <Button 
          onClick={loadDashboard}
          className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-lg hover:shadow-lg transition-all-smooth hover:scale-105"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>
    </div>
  );
};

export default AdminDashboard;