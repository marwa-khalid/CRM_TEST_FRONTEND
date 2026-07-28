import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Bell } from "lucide-react";
import { listTasks } from "../../services/Tasks/Tasks";
import NotificationsPanel, {
  type NotifItem,
  buildTaskNotifications,
} from "../../modules/TaskManagement/Notifications";
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  markAllNotificationsUnread,
} from "../../services/Notifications/Notifications";

// Self-contained notification bell + dropdown panel. Owns its own data loading
// and read/unread state so it can be dropped into any screen's header (Dashboard,
// Tasks, Claim List, …). `onOpenTask` lets the host navigate when a task
// notification is clicked.
const NotificationBell: React.FC<{ onOpenTask?: () => void; iconSize?: number }> = ({
  onOpenTask,
  iconSize = 20,
}) => {
  const [notifOpen, setNotifOpen] = useState(false);
  const [overdue, setOverdue] = useState<any[]>([]);
  const [dueToday, setDueToday] = useState<any[]>([]);
  const [dbNotifs, setDbNotifs] = useState<NotifItem[]>([]);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const notifRef = useRef<HTMLDivElement>(null);

  const fetchDbNotifs = useCallback(() => {
    return getNotifications()
      // Fleet notifications live on the Fleet bell — keep them out of Claims.
      .then(({ data }) =>
        setDbNotifs((Array.isArray(data) ? data : []).filter((n: any) => n?.tab !== "Fleet" && n?.category !== "Fleet")),
      )
      .catch(() => setDbNotifs([]));
  }, []);

  useEffect(() => {
    listTasks({ status: "Overdue", page_size: 50 })
      .then(({ data }) => setOverdue((data?.items ?? []).filter((t: any) => t.department !== "Fleet")))
      .catch(() => setOverdue([]));
    const today = new Date().toISOString().split("T")[0];
    listTasks({ due_from: today, due_to: today, page_size: 50 })
      .then(({ data }) =>
        setDueToday(
          (data?.items ?? []).filter((t: any) => t.department !== "Fleet" && !["Completed", "Rejected"].includes(t.status)),
        ),
      )
      .catch(() => setDueToday([]));
    fetchDbNotifs();
  }, [fetchDbNotifs]);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
    };
    if (notifOpen) document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [notifOpen]);

  useEffect(() => {
    if (notifOpen) fetchDbNotifs();
  }, [fetchDbNotifs, notifOpen]);

  const notifications = useMemo<NotifItem[]>(
    () => [...dbNotifs, ...buildTaskNotifications(overdue, dueToday)],
    [dbNotifs, overdue, dueToday],
  );
  const unreadCount = notifications.filter((n) => n.unread && !readIds.has(n.id)).length;
  const allRead = notifications.length > 0 && unreadCount === 0;
  const markAllRead = () => {
    if (allRead) {
      setReadIds(new Set());
      markAllNotificationsUnread().then(fetchDbNotifs).catch(() => {});
    } else {
      setReadIds(new Set(notifications.map((n) => n.id)));
      markAllNotificationsRead().then(fetchDbNotifs).catch(() => {});
    }
  };
  const handleNotifClick = (n: NotifItem) => {
    setReadIds((prev) => new Set(prev).add(n.id));
    if (n.notif_id) markNotificationRead(n.notif_id).then(fetchDbNotifs).catch(() => {});
    if (n.taskId) onOpenTask?.();
    setNotifOpen(false);
  };

  return (
    <div className="relative" ref={notifRef}>
      <button
        type="button"
        onClick={() => setNotifOpen((o) => !o)}
        className="relative text-neutral-500 hover:text-neutral-700"
      >
        <Bell size={iconSize} />
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 bg-red-500 text-white text-[10px] font-weight-600 rounded-full flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>
      {notifOpen && (
        <div className="absolute right-0 top-full mt-2 z-50">
          <NotificationsPanel
            items={notifications}
            readIds={readIds}
            onMarkAllRead={markAllRead}
            onItemClick={handleNotifClick}
          />
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
