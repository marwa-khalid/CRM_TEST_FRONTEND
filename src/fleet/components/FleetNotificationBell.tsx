import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import FleetNotifications, { buildFleetTaskNotifications, timeAgo, type NotifItem } from "./FleetNotifications";
import { getFleetNotifications, markFleetNotificationRead } from "../services/notificationService";
import { listFleetTasks, type FleetTask } from "../services/taskService";

// Self-contained Fleet notification bell + dropdown. Loads its own data and owns
// read/unread state. Shows ONLY Fleet-relevant notifications (Fleet DB rows +
// Fleet task alerts) so the Fleet feed stays separate from the Claims one.
const isDone = (t: FleetTask) => ["completed", "rejected"].includes((t.status || "").toLowerCase());
const todayISO = () => new Date().toLocaleDateString("sv-SE");

const FleetNotificationBell: React.FC<{ iconSize?: number; onOpenTask?: () => void; module?: string }> = ({ iconSize = 20, onOpenTask, module = "skyline" }) => {
  const navigate = useNavigate();
  // Which notification feed this bell shows: Skyline ("Fleet" tag) or Vehicle
  // Management ("Vehicles" tag). Vehicle expiries + vehicle tasks carry "Vehicles".
  const isVehicleModule = module.startsWith("vehicles");
  const vehicleContext = module.startsWith("vehicles_") ? module.split("_")[1] : "skyline";
  const wantedTag = isVehicleModule ? "Vehicles" : "Fleet";
  const [open, setOpen] = useState(false);
  const [dbNotifs, setDbNotifs] = useState<NotifItem[]>([]);
  const [overdue, setOverdue] = useState<FleetTask[]>([]);
  const [dueToday, setDueToday] = useState<FleetTask[]>([]);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const ref = useRef<HTMLDivElement>(null);

  const fetchDb = useCallback(async () => {
    const rows = await getFleetNotifications();
    // Keep only this module's rows — Skyline sees "Fleet", Vehicle Management sees
    // "Vehicles"; Claims notifications never show in either.
    const scoped = rows.filter((n: any) => n?.tab === wantedTag || n?.category === wantedTag);
    setDbNotifs(scoped.map((n: any) => ({
      id: String(n.id ?? n.notif_id ?? `${n.title}-${n.created_at}`),
      tab: n.tab || wantedTag,
      category: n.category || wantedTag,
      title: n.title || "",
      description: n.description || "",
      time: n.time || timeAgo(n.created_at) || "",
      ts: n.ts ?? (n.created_at ? new Date(String(n.created_at).endsWith("Z") ? n.created_at : `${n.created_at}Z`).getTime() : undefined),
      unread: n.unread ?? !n.read ?? true,
      notif_id: typeof n.id === "number" ? n.id : n.notif_id,
    })));
  }, [wantedTag]);

  const loadTasks = useCallback(async () => {
    const tasks = await listFleetTasks({ module });
    const t = todayISO();
    setOverdue(tasks.filter((x) => x.is_overdue && !isDone(x)));
    setDueToday(tasks.filter((x) => (x.due_date || "").slice(0, 10) === t && !isDone(x)));
  }, [module]);

  useEffect(() => { fetchDb(); loadTasks(); }, [fetchDb, loadTasks]);
  useEffect(() => { if (open) { fetchDb(); loadTasks(); } }, [open, fetchDb, loadTasks]);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    if (open) document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  const notifications = useMemo<NotifItem[]>(
    () => [...dbNotifs, ...buildFleetTaskNotifications(overdue, dueToday)],
    [dbNotifs, overdue, dueToday],
  );
  const unreadCount = notifications.filter((n) => n.unread && !readIds.has(n.id)).length;

  const markAllRead = () => {
    const allRead = notifications.length > 0 && unreadCount === 0;
    setReadIds(allRead ? new Set() : new Set(notifications.map((n) => n.id)));
  };
  const handleClick = (n: NotifItem) => {
    setReadIds((prev) => new Set(prev).add(n.id));
    if (n.notif_id) markFleetNotificationRead(n.notif_id).then(fetchDb);
    if (n.taskId) (onOpenTask ? onOpenTask() : navigate(isVehicleModule ? `/vehicle-management/${vehicleContext}/tasks` : "/fleet/tasks"));
    setOpen(false);
  };

  return (
    <div className="relative" ref={ref}>
      <button type="button" onClick={() => setOpen((o) => !o)} className="relative text-neutral-500 hover:text-neutral-800" aria-label="Notifications">
        <Bell size={iconSize} />
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 bg-red-500 text-white text-[10px] font-semibold rounded-full flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 z-[200]">
          <FleetNotifications items={notifications} readIds={readIds} onMarkAllRead={markAllRead} onItemClick={handleClick} />
        </div>
      )}
    </div>
  );
};

export default FleetNotificationBell;
