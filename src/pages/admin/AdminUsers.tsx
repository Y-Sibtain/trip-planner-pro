import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAdmin } from "@/hooks/useAdmin";

/**
 * Admin Users page
 * - Lists profiles and roles
 * - Allows promoting/demoting to admin by inserting/deleting rows in user_roles (admin-only)
 * - Allows soft-deleting profile (set deleted_at) or restoring
 *
 * Note: permanent deletion of auth user should be done using a server endpoint that uses the service_role key.
 */
const AdminUsers = () => {
  const { isAdmin, loading: adminLoading } = useAdmin();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [profiles, setProfiles] = useState<
    { id: string; full_name?: string | null; phone?: string | null; location?: string | null; deleted_at?: string | null }[]
  >([]);
  const [roles, setRoles] = useState<Record<string, string[]>>({}); // user_id -> [roles]
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      navigate("/");
    } else if (!adminLoading && isAdmin) {
      loadUsers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, adminLoading]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      // Load profiles
      const { data: profData, error: profErr } = await supabase.from("profiles").select("id, full_name, phone, location, deleted_at").order("created_at", { ascending: false });
      if (profErr) {
        console.error("Failed to fetch profiles:", profErr);
        toast({ title: "Error", description: "Failed to load profiles.", variant: "destructive" });
        setProfiles([]);
        setRoles({});
        setLoading(false);
        return;
      }
      setProfiles(profData || []);

      // Load roles table
      const { data: rolesData, error: rolesErr } = await supabase.from("user_roles").select("user_id, role");
      if (rolesErr) {
        console.error("Failed to fetch roles:", rolesErr);
        setRoles({});
        return;
      }
      const map: Record<string, string[]> = {};
      (rolesData || []).forEach((r: any) => {
        map[r.user_id] = map[r.user_id] || [];
        map[r.user_id].push(r.role);
      });
      setRoles(map);
    } catch (err) {
      console.error("loadUsers error:", err);
      toast({ title: "Error", description: "Failed to load users.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const promoteToAdmin = async (userId: string) => {
    if (!confirm("Promote this user to admin?")) return;
    try {
      const { error } = await supabase.from("user_roles").insert([{ user_id: userId, role: "admin" }]);
      if (error) {
        toast({ title: "Failed", description: error.message, variant: "destructive" });
        return;
      }
      toast({ title: "Promoted", description: "User granted admin role." });
      loadUsers();
    } catch (err) {
      console.error("promote error:", err);
      toast({ title: "Error", description: "Failed to promote user.", variant: "destructive" });
    }
  };

  const demoteFromAdmin = async (userId: string) => {
    if (!confirm("Remove admin role from this user?")) return;
    try {
      const { error } = await supabase.from("user_roles").delete().match({ user_id: userId, role: "admin" });
      if (error) {
        toast({ title: "Failed", description: error.message, variant: "destructive" });
        return;
      }
      toast({ title: "Demoted", description: "Admin role removed." });
      loadUsers();
    } catch (err) {
      console.error("demote error:", err);
      toast({ title: "Error", description: "Failed to demote user.", variant: "destructive" });
    }
  };

  const softDeleteProfile = async (userId: string) => {
    if (!confirm("Soft-delete this profile (set deleted_at)? This hides the profile from users.")) return;
    try {
      const { error } = await supabase.from("profiles").update({ deleted_at: new Date().toISOString() }).eq("id", userId);
      if (error) {
        toast({ title: "Failed", description: error.message, variant: "destructive" });
        return;
      }
      toast({ title: "Soft-deleted", description: "Profile soft-deleted." });
      loadUsers();
    } catch (err) {
      console.error("soft-delete error:", err);
      toast({ title: "Error", description: "Failed to soft-delete profile.", variant: "destructive" });
    }
  };

  const restoreProfile = async (userId: string) => {
    if (!confirm("Restore this profile?")) return;
    try {
      const { error } = await supabase.from("profiles").update({ deleted_at: null }).eq("id", userId);
      if (error) {
        toast({ title: "Failed", description: error.message, variant: "destructive" });
        return;
      }
      toast({ title: "Restored", description: "Profile restored." });
      loadUsers();
    } catch (err) {
      console.error("restore error:", err);
      toast({ title: "Error", description: "Failed to restore profile.", variant: "destructive" });
    }
  };

  if (adminLoading || loading) {
    return <div className="min-h-screen flex items-center justify-center p-4">Loading users…</div>;
  }

  return (
    <div className="min-h-screen p-4">
      <h1 className="text-2xl font-semibold mb-4">Manage Users</h1>

      <Card>
        <CardHeader>
          <CardTitle>Users & Roles</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Roles</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {profiles.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="text-xs">{p.id}</TableCell>
                  <TableCell>{p.full_name || "-"}</TableCell>
                  <TableCell>{p.phone || "-"}</TableCell>
                  <TableCell>{p.location || "-"}</TableCell>
                  <TableCell>{(roles[p.id] || []).join(", ") || "-"}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {(roles[p.id] || []).includes("admin") ? (
                        <Button size="sm" variant="outline" onClick={() => demoteFromAdmin(p.id)}>
                          Remove admin
                        </Button>
                      ) : (
                        <Button size="sm" onClick={() => promoteToAdmin(p.id)}>
                          Promote to admin
                        </Button>
                      )}
                      {p.deleted_at ? (
                        <Button size="sm" variant="ghost" onClick={() => restoreProfile(p.id)}>
                          Restore
                        </Button>
                      ) : (
                        <Button size="sm" variant="destructive" onClick={() => softDeleteProfile(p.id)}>
                          Soft-delete
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminUsers;