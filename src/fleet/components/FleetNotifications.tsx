import React, { useState } from "react";
import { AlertCircle, AtSign, CheckCheck, ClipboardList, Settings, Truck } from "lucide-react";

// Self-contained Fleet notifications panel — mirrors the Claims design in the
// Fleet black/grey theme, with the Fleet tab set. No Claims imports.

export interface NotifItem {
  id: string;
  tab: string; // Fleet | Tasks | System | Mentions | High Priority
  category: string; // pill label / icon key
  title: string;
  description: string;
  time: string;
  ts?: number;
  unread: boolean;
  taskId?: number;
  notif_id?: number;
}

// ── time helpers ─────────────────────────────────────────────────────────────
const parseTs = (iso?: string | null) => {
  if (!iso) return NaN;
  return new Date(iso.endsWith("Z") || iso.includes("+") ? iso : `${iso}Z`).getTime();
};
export const timeAgo = (iso?: string | null): string => {
  const then = parseTs(iso);
  if (isNaN(then)) return "";
  const m = Math.floor(Math.max(0, Date.now() - then) / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return d === 1 ? "1d ago" : `${d}d ago`;
};
const daysOverdue = (due?: string | null): number => {
  if (!due) return 1;
  const d = new Date(`${due}T00:00:00`).getTime();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.max(1, Math.round((today.getTime() - d) / 86400000));
};
const groupLabel = (ms?: number): string => {
  if (!ms || isNaN(ms)) return "Earlier";
  const d = new Date(ms); d.setHours(0, 0, 0, 0);
  const now = new Date(); now.setHours(0, 0, 0, 0);
  const days = Math.max(0, Math.round((now.getTime() - d.getTime()) / 86400000));
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 28) { const w = Math.floor(days / 7); return `${w} week${w > 1 ? "s" : ""} ago`; }
  if (days < 365) { const mo = Math.max(1, Math.floor(days / 30)); return `${mo} month${mo > 1 ? "s" : ""} ago`; }
  const y = Math.max(1, Math.floor(days / 365)); return `${y} year${y > 1 ? "s" : ""} ago`;
};

// Build Fleet task alerts (overdue → High Priority, due-today → Tasks) from the
// Fleet task list — always Fleet, so nothing from Claims can leak in here.
export const buildFleetTaskNotifications = (overdue: any[], dueToday: any[]): NotifItem[] => {
  const out: NotifItem[] = [];
  overdue.forEach((t) => {
    const days = daysOverdue(t.due_date);
    const ts = parseTs(t.updated_at || t.created_at);
    out.push({
      id: `overdue-${t.id}`,
      tab: "High Priority",
      category: "High Priority",
      title: `Overdue Task: ${t.title}`,
      description: `${days} day${days === 1 ? "" : "s"} overdue${t.vehicle_registration ? " · " + t.vehicle_registration : ""}. ${t.assigned_user ? "Assigned to " + String(t.assigned_user).trim() + "." : ""}`.trim(),
      time: timeAgo(t.updated_at || t.created_at) || "Today",
      ts: isNaN(ts) ? undefined : ts,
      unread: true,
      taskId: t.id,
    });
  });
  dueToday.forEach((t) => {
    const ts = parseTs(t.created_at || t.updated_at);
    out.push({
      id: `due-${t.id}`,
      tab: "Tasks",
      category: "Task",
      title: `Task Due Today: ${t.title}`,
      description: `${t.description || t.title}${t.vehicle_registration ? " · " + t.vehicle_registration : ""}. Due today.`,
      time: timeAgo(t.created_at || t.updated_at) || "Today",
      ts: isNaN(ts) ? undefined : ts,
      unread: true,
      taskId: t.id,
    });
  });
  return out;
};

const TABS: { key: string; label: string }[] = [
  { key: "All", label: "All" },
  { key: "Fleet", label: "Skyline" },
  { key: "Tasks", label: "Tasks" },
  { key: "System", label: "System Alerts" },
  { key: "Mentions", label: "Mentions" },
  { key: "High Priority", label: "High Priority" },
];

// category → icon
const META: Record<string, any> = {
  "High Priority": AlertCircle,
  Task: ClipboardList,
  Mention: AtSign,
  Fleet: Truck,
  "System Alert": Settings,
};
// tab → icon (preferred, so a fleet-marked task still shows a task icon).
const TAB_ICON: Record<string, any> = {
  "High Priority": AlertCircle,
  Tasks: ClipboardList,
  System: Settings,
  Mentions: AtSign,
  Fleet: Truck,
};

const Row: React.FC<{ item: NotifItem; read: boolean; onClick: () => void; showCategory: boolean }> = ({
  item, read, onClick, showCategory,
}) => {
  const Icon = TAB_ICON[item.tab] || META[item.category] || Settings;
  const unread = item.unread && !read;
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left px-4 py-3 border-b border-neutral-50 last:border-0 flex gap-3 hover:bg-neutral-50 ${unread ? "bg-neutral-100/60" : "bg-white"}`}
    >
      <span className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-neutral-100">
        <Icon size={16} className="text-neutral-700" />
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          {showCategory ? (
            <span className="px-2 py-[2px] rounded border border-neutral-200 text-[10px] font-medium text-neutral-600 shrink-0">{item.category}</span>
          ) : (
            <span className="flex-1 min-w-0 truncate text-sm font-semibold text-neutral-900">{item.title}</span>
          )}
          <div className="flex flex-col items-end gap-1 shrink-0 ml-auto">
            <span className="text-[11px] text-neutral-400">{item.time}</span>
            {unread && <span className="w-2 h-2 rounded-full bg-neutral-900" />}
          </div>
        </div>
        {showCategory && <div className="text-sm font-semibold text-neutral-900 mt-1 truncate">{item.title}</div>}
        <div className="text-xs text-neutral-500 mt-0.5 line-clamp-2">{item.description}</div>
      </div>
    </button>
  );
};

const FleetNotifications: React.FC<{
  items: NotifItem[];
  readIds: Set<string>;
  onMarkAllRead: () => void;
  onItemClick: (item: NotifItem) => void;
}> = ({ items, readIds, onMarkAllRead, onItemClick }) => {
  const [tab, setTab] = useState("All");
  const unreadCount = items.filter((n) => n.unread && !readIds.has(n.id)).length;
  const allRead = items.length > 0 && unreadCount === 0;
  const visible = (tab === "All" ? items : items.filter((n) => n.tab === tab))
    .slice()
    .sort((a, b) => (b.ts ?? 0) - (a.ts ?? 0));

  const groups: { label: string; rows: NotifItem[] }[] = [];
  const idx = new Map<string, number>();
  for (const n of visible) {
    const label = groupLabel(n.ts);
    let i = idx.get(label);
    if (i === undefined) { i = groups.length; idx.set(label, i); groups.push({ label, rows: [] }); }
    groups[i].rows.push(n);
  }

  return (
    <div className="w-[400px] max-w-[92vw] bg-white rounded-lg border border-neutral-200 shadow-xl font-sans-headline overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between border-b border-neutral-100">
        <div className="flex items-center gap-2">
          <span className="text-base font-semibold text-neutral-900">Notifications</span>
          {unreadCount > 0 && (
            <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-neutral-900 text-white text-[11px] font-semibold flex items-center justify-center">{unreadCount}</span>
          )}
        </div>
        <button
          type="button"
          onClick={onMarkAllRead}
          title={allRead ? "Mark all as unread" : "Mark all as read"}
          className={allRead ? "text-neutral-900" : "text-neutral-400 hover:text-neutral-900"}
        >
          <CheckCheck size={18} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 px-2 border-b border-neutral-100 overflow-x-auto scrollbar-hide">
        {TABS.map((tb) => (
          <button
            key={tb.key}
            type="button"
            onClick={() => setTab(tb.key)}
            className={`px-3 py-2.5 text-sm whitespace-nowrap border-b-2 -mb-px ${
              tab === tb.key ? "border-neutral-900 text-neutral-900 font-medium" : "border-transparent text-neutral-500 hover:text-neutral-700"
            }`}
          >
            {tb.label}
          </button>
        ))}
      </div>

      {/* Body */}
      <div className="max-h-[460px] overflow-auto">
        {visible.length === 0 ? (
          <div className="px-4 py-10 text-center text-neutral-400 text-sm">No notifications</div>
        ) : (
          groups.map((g) => (
            <React.Fragment key={g.label}>
              <div className="px-4 py-1.5 bg-neutral-100 text-neutral-600 text-[14px] font-medium">{g.label}</div>
              {g.rows.map((n) => (
                <Row key={n.id} item={n} read={readIds.has(n.id)} onClick={() => onItemClick(n)} showCategory={tab === "All"} />
              ))}
            </React.Fragment>
          ))
        )}
      </div>
    </div>
  );
};

export default FleetNotifications;
