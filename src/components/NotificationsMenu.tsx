import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell } from "lucide-react";
import useNotifications from "@/hooks/useNotifications";
import { formatDistanceToNowStrict } from "date-fns";

export const NotificationsMenu = () => {
  const { notifications, unreadCount, markAsRead, markAllRead, fetchNotifications } = useNotifications();
  const [open, setOpen] = useState(false);

  const handleOpen = (v: boolean) => {
    setOpen(v);
    if (v) {
      // when opened, refresh and optionally mark visible ones as read
      fetchNotifications();
    }
  };

  return (
    <DropdownMenu open={open} onOpenChange={handleOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1">{unreadCount}</Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="p-2 flex items-center justify-between">
          <div className="font-medium">Notifications</div>
          <div className="flex gap-2">
            <button className="text-sm text-muted-foreground" onClick={() => markAllRead()}>
              Mark all read
            </button>
          </div>
        </div>
        {notifications.length === 0 ? (
          <DropdownMenuItem className="text-sm text-muted-foreground">No notifications</DropdownMenuItem>
        ) : (
          notifications.map((n) => (
            <DropdownMenuItem
              key={n.id}
              onClick={() => {
                if (!n.read) markAsRead(n.id);
                // Optionally navigate or open details based on n.data
              }}
              className={`flex flex-col items-start gap-1 ${!n.read ? "bg-muted/10" : ""}`}
            >
              <div className="flex justify-between w-full">
                <div className="font-medium">{n.title}</div>
                <div className="text-xs text-muted-foreground">
                  {formatDistanceToNowStrict(new Date(n.created_at), { addSuffix: true })}
                </div>
              </div>
              <div className="text-sm text-muted-foreground line-clamp-2">{n.message}</div>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default NotificationsMenu;