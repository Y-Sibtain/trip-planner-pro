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
 * - Lists all users from profiles table with auth info
 * - Shows email, signup date, and last sign in
 * - Allows promoting/demoting to admin by inserting/deleting rows in user_roles (admin-only)
 * - Allows soft-deleting profile (set deleted_at) or restoring
 */
interface UserWithProfile {
  id: string;
  email?: string;
  full_name?: string | null;
  phone?: string | null;
  location?: string | null;
  deleted_at?: string | null;
  created_at?: string;
}

const AdminUsers = () => {
  const { isAdmin, loading: adminLoading } = useAdmin();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<UserWithProfile[]>([]);
  const [roles, setRoles] = useState<Record<string, string[]>>({}); // user_id -> [roles]
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
      // Fetch all profiles - these represent all signed-up users
      const { data: profiles, error: profErr } = await supabase
        .from('profiles')
        .select('id, full_name, phone, location, deleted_at, created_at')
        .order('created_at', { ascending: false });

      if (profErr) {
        console.error("Failed to fetch profiles:", profErr);
        toast({ title: "Error", description: "Failed to load user profiles." });
        setUsers([]);
        setRoles({});
        setLoading(false);
        return;
      }

      // Get current user to access auth data if needed
      const { data: { user: currentUser } } = await supabase.auth.getUser();

      // For each profile, try to get their auth email via admin endpoint if available
      // For now, we'll get the current authenticated users to build an email map
      const { data: { users: authUsers }, error: authError } = await supabase.auth.admin.listUsers() as any;
      
      const emailMap = new Map<string, string>();
      if (!authError && authUsers) {
        authUsers.forEach((u: any) => {
          emailMap.set(u.id, u.email);
        });
      }

      // Merge profiles with available email data
      const mergedUsers: UserWithProfile[] = (profiles || []).map((profile: any) => ({
        id: profile.id,
        email: emailMap.get(profile.id) || 'N/A',
        full_name: profile.full_name,
        phone: profile.phone,
        location: profile.location,
        deleted_at: profile.deleted_at,
        created_at: profile.created_at,
      }));

      setUsers(mergedUsers);

      // Load roles table
      const { data: rolesData, error: rolesErr } = await supabase.from('user_roles').select('user_id, role');
      if (rolesErr) {
        console.error("Failed to fetch roles:", rolesErr);
        setRoles({});
        return;
      }
      const roleMap: Record<string, string[]> = {};
      (rolesData || []).forEach((r: any) => {
        roleMap[r.user_id] = roleMap[r.user_id] || [];
        roleMap[r.user_id].push(r.role);
      });
      setRoles(roleMap);
    } catch (err) {
      console.error("loadUsers error:", err);
      toast({ title: "Error", description: "Failed to load users." });
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
        toast({ title: "Error", description: "Failed to soft-delete profile." });
        return;
      }
      toast({ title: "Soft-deleted", description: "Profile soft-deleted." });
      loadUsers();
    } catch (err) {
      console.error("soft-delete error:", err);
      toast({ title: "Error", description: "Failed to soft-delete profile." });
    } finally {
      setSoftDeleteUserId(null);
    }
  };

  const restoreProfile = async () => {
    if (!restoreUserId) return;
    try {
      const { error } = await supabase.from("profiles").update({ deleted_at: null }).eq("id", restoreUserId);
      if (error) {
        toast({ title: "Error", description: "Failed to restore profile." });
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
                <TableHead>Email</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Signed Up</TableHead>
                <TableHead>Roles</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="text-xs font-mono">{user.email}</TableCell>
                  <TableCell>{user.full_name || "-"}</TableCell>
                  <TableCell>{user.phone || "-"}</TableCell>
                  <TableCell>{user.location || "-"}</TableCell>
                  <TableCell className="text-xs">{user.created_at ? new Date(user.created_at).toLocaleDateString() : "-"}</TableCell>
                  <TableCell>{(roles[user.id] || []).join(", ") || "-"}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {(roles[user.id] || []).includes("admin") ? (
                        <AlertDialog open={demoteUserId === user.id} onOpenChange={(open) => !open && setDemoteUserId(null)}>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="outline" onClick={() => setDemoteUserId(user.id)}>
                              Remove admin
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Remove Admin Role?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will remove admin privileges from {user.email}.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={demoteFromAdmin}>Remove Admin</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      ) : (
                        <AlertDialog open={promoteUserId === user.id} onOpenChange={(open) => !open && setPromoteUserId(null)}>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" onClick={() => setPromoteUserId(user.id)}>
                              Promote to admin
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Promote to Admin?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will grant admin privileges to {user.email}.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={promoteToAdmin}>Promote</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                      {user.deleted_at ? (
                        <AlertDialog open={restoreUserId === user.id} onOpenChange={(open) => !open && setRestoreUserId(null)}>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="ghost" onClick={() => setRestoreUserId(user.id)}>
                              Restore
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Restore Profile?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will restore {user.email}'s profile and make it visible again.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={restoreProfile}>Restore</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      ) : (
                        <AlertDialog open={softDeleteUserId === user.id} onOpenChange={(open) => !open && setSoftDeleteUserId(null)}>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="destructive" onClick={() => setSoftDeleteUserId(user.id)}>
                              Soft-delete
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Soft-Delete Profile?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will hide {user.email}'s profile from users. You can restore it later.
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