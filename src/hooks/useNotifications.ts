import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useBooking } from "@/contexts/BookingContext";
import { useToast } from "@/hooks/use-toast";

type NotificationRow = {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message?: string;
  data?: any;
  read: boolean;
  created_at: string;
};

export const useNotifications = () => {
  const { user } = useBooking();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = useCallback(async () => {
    if (!user?.id) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from<NotificationRow>("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(200);

      if (error) {
        console.error("Failed to fetch notifications:", error);
        return;
      }
      setNotifications(data || []);
      setUnreadCount((data || []).filter((n) => !n.read).length);
    } catch (err) {
      console.error("Fetch notifications error:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    if (!user?.id) return;

    // Subscribe to realtime inserts for this user's notifications
    // Using Supabase Realtime v2 channel pattern
    const channel = supabase.channel(`public:notifications:user:${user.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        (payload) => {
          const newRow = payload.new as NotificationRow;
          // Put at top
          setNotifications((prev) => [newRow, ...prev]);
          setUnreadCount((prev) => prev + 1);
          // Show immediate toast for certain types
          const toastVariant = newRow.type === "error" ? "destructive" : undefined;
          toast({
            title: newRow.title,
            description: newRow.message,
            variant: toastVariant,
          });
        }
      )
      .subscribe();

    return () => {
      // unsubscribe
      channel.unsubscribe();
    };
  }, [user, toast]);

  const markAsRead = async (id: string) => {
    try {
      const { error } = await supabase.from("notifications").update({ read: true }).eq("id", id);
      if (error) {
        console.error("Failed to mark notification read:", error);
        return;
      }
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Mark read error:", err);
    }
  };

  const markAllRead = async () => {
    if (!user?.id) return;
    try {
      const { error } = await supabase.from("notifications").update({ read: true }).eq("user_id", user.id).eq("read", false);
      if (error) {
        console.error("Failed to mark all read:", error);
        return;
      }
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("Mark all read error:", err);
    }
  };

  const clearNotifications = async () => {
    // Optionally allow users to delete their notifications
    if (!user?.id) return;
    try {
      const { error } = await supabase.from("notifications").delete().eq("user_id", user.id);
      if (error) {
        console.error("Failed to clear notifications:", error);
        return;
      }
      setNotifications([]);
      setUnreadCount(0);
    } catch (err) {
      console.error("Clear notifications error:", err);
    }
  };

  return {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    markAsRead,
    markAllRead,
    clearNotifications,
  };
};

export default useNotifications;