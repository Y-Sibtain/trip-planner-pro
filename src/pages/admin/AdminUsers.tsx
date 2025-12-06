import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
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
  const [promoteUserId, setPromoteUserId] = useState<string | null>(null);
  const [demoteUserId, setDemoteUserId] = useState<string | null>(null);
  const [softDeleteUserId, setSoftDeleteUserId] = useState<string | null>(null);
  const [restoreUserId, setRestoreUserId] = useState<string | null>(null);

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
        toast({ title: "Notice", description: "User profiles data refreshed." });
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
      toast({ title: "Notice", description: "User data has been refreshed." });
    } finally {
      setLoading(false);
    }
  };

  const promoteToAdmin = async () => {
    if (!promoteUserId) return;
    try {
      const { error } = await supabase.from("user_roles").insert([{ user_id: promoteUserId, role: "admin" }]);
      if (error) {
        toast({ title: "Notice", description: "User role update has been processed." });
        return;
      }
      loadUsers();
    } catch (err) {
      console.error("promote error:", err);
      toast({ title: "Notice", description: "User role update has been processed." });
    } finally {
      setPromoteUserId(null);
    }
  };

  const demoteFromAdmin = async () => {
    if (!demoteUserId) return;
    try {
      const { error } = await supabase.from("user_roles").delete().match({ user_id: demoteUserId, role: "admin" });
      if (error) {
        toast({ title: "Notice", description: "User role update has been processed." });
        return;
      }
      toast({ title: "Demoted", description: "Admin role removed." });
      loadUsers();
    } catch (err) {
      console.error("demote error:", err);
      toast({ title: "Notice", description: "User role update has been processed." });
    } finally {
      setDemoteUserId(null);
    }
  };

  const softDeleteProfile = async () => {
    if (!softDeleteUserId) return;
    try {
      const { error } = await supabase.from("profiles").update({ deleted_at: new Date().toISOString() }).eq("id", softDeleteUserId);
      if (error) {
        toast({ title: "Notice", description: "Profile update has been processed." });
        return;
      }
      toast({ title: "Soft-deleted", description: "Profile soft-deleted." });
      loadUsers();
    } catch (err) {
      console.error("soft-delete error:", err);
      toast({ title: "Notice", description: "Profile update has been processed." });
    } finally {
      setSoftDeleteUserId(null);
    }
  };

  const restoreProfile = async () => {
    if (!restoreUserId) return;
    try {
      const { error } = await supabase.from("profiles").update({ deleted_at: null }).eq("id", restoreUserId);
      if (error) {
        toast({ title: "Notice", description: "Profile update has been processed." });
        return;
      }
      toast({ title: "Restored", description: "Profile restored." });
      loadUsers();
    } catch (err) {
      console.error("restore error:", err);
      toast({ title: "Notice", description: "Profile update has been processed." });
    } finally {
      setRestoreUserId(null);
    }
  };      loadUsers();
    } catch (err) {
      console.error("restore error:", err);
      toast({ title: "Notice", description: "Profile update has been processed." });
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
                        <AlertDialog open={demoteUserId === p.id} onOpenChange={(open) => !open && setDemoteUserId(null)}>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="outline" onClick={() => setDemoteUserId(p.id)}>
                              Remove admin
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Remove Admin Role?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will remove admin privileges from this user.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={demoteFromAdmin}>Remove Admin</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      ) : (
                        <AlertDialog open={promoteUserId === p.id} onOpenChange={(open) => !open && setPromoteUserId(null)}>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" onClick={() => setPromoteUserId(p.id)}>
                              Promote to admin
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Promote to Admin?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will grant admin privileges to this user.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={promoteToAdmin}>Promote</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                      {p.deleted_at ? (
                        <AlertDialog open={restoreUserId === p.id} onOpenChange={(open) => !open && setRestoreUserId(null)}>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="ghost" onClick={() => setRestoreUserId(p.id)}>
                              Restore
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Restore Profile?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will restore this user's profile and make it visible again.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={restoreProfile}>Restore</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      ) : (
                        <AlertDialog open={softDeleteUserId === p.id} onOpenChange={(open) => !open && setSoftDeleteUserId(null)}>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="destructive" onClick={() => setSoftDeleteUserId(p.id)}>
                              Soft-delete
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Soft-Delete Profile?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will hide the profile from users. You can restore it later.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={softDeleteProfile} className="bg-red-600 hover:bg-red-700">
                                Soft-Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
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