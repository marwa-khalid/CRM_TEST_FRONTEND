import React from "react";
import {
  CheckCheck,
  AlertCircle,
  FileText,
  ClipboardList,
  AtSign,
  Truck,
  Settings,
} from "lucide-react";

// ─── types ──────────────────────────────────────────────────────────────────────

export type NotifTab =
  | "Tasks"
  | "Claims"
  | "Mentions"
  | "Fleet"
  | "System"
  | "High Priority";

export interface NotifItem {
  id: string;
  tab: NotifTab;
  category: string; // pill label
  title: string;
  description: string;
  time: string;
  group: "Today" | "Yesterday" | "Earlier";
  ts?: number; // epoch ms of the event — for sorting + grouping
  unread: boolean;
  taskId?: number;
  task_id?: number;
  notif_id?: number; // backend notification row id (for mark-as-read)
  claim_id?: number | null; // linked claim (click-through)
}

// ─── feed builders (shared by Tasks screen + Dashboard) ──────────────────────────

const parseTs = (iso?: string | null) => {
  if (!iso) return NaN;
  // Postgres timestamps arrive without "Z" — treat them as UTC
  return new Date(iso.endsWith("Z") || iso.includes("+") ? iso : iso + "Z").getTime();
};
export const timeAgo = (iso?: string | null): string => {
  const then = parseTs(iso);
  if (isNaN(then)) return "";
  const diff = Math.max(0, Date.now() - then);
  const m = Math.floor(diff / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return d === 1 ? "1d ago" : `${d}d ago`;
};
export const daysOverdue = (due?: string | null): number => {
  if (!due) return 1;
  const d = new Date(due + "T00:00:00").getTime();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.max(1, Math.round((today.getTime() - d) / 86400000));
};

const _sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

// Today / Yesterday / Earlier from an epoch-ms timestamp.
export const groupOf = (ms?: number): "Today" | "Yesterday" | "Earlier" => {
  if (!ms || isNaN(ms)) return "Earlier";
  const d = new Date(ms);
  const now = new Date();
  if (_sameDay(d, now)) return "Today";
  const y = new Date(now);
  y.setDate(now.getDate() - 1);
  if (_sameDay(d, y)) return "Yesterday";
  return "Earlier";
};

// Relative bucket label: Today → Yesterday → "N days ago" → "N weeks ago" →
// "N months ago" → "N years ago".
export const groupLabel = (ms?: number): string => {
  if (!ms || isNaN(ms)) return "Earlier";
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const days = Math.max(0, Math.round((now.getTime() - d.getTime()) / 86400000));
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 28) {
    const w = Math.floor(days / 7);
    return `${w} week${w > 1 ? "s" : ""} ago`;
  }
  if (days < 365) {
    const mo = Math.max(1, Math.floor(days / 30));
    return `${mo} month${mo > 1 ? "s" : ""} ago`;
  }
  const y = Math.max(1, Math.floor(days / 365));
  return `${y} year${y > 1 ? "s" : ""} ago`;
};

// Non-task categories (Claims, Mentions, Fleet, System) will be wired
// to their own modules later. Empty for now — only real task notifications show.
export const STATIC_NOTIFS: NotifItem[] = [];

// Combine real task alerts (overdue + due-today) with the static placeholders.
export const buildTaskNotifications = (overdue: any[], dueToday: any[]): NotifItem[] => {
  const real: NotifItem[] = [];
  overdue.forEach((t) => {
    const days = daysOverdue(t.due_date);
    const ts = parseTs(t.updated_at || t.created_at);
    real.push({
      id: `overdue-${t.id}`,
      tab: "High Priority",
      category: "High Priority",
      title: `Overdue Task: ${t.title}`,
      description: `${days} day${days === 1 ? "" : "s"} overdue${
        t.claim_reference ? " · " + t.claim_reference : ""
      }. ${t.assigned_user ? "Assigned to " + String(t.assigned_user).trim() + "." : "Escalated to manager."}`,
      time: timeAgo(t.updated_at || t.created_at) || "Today",
      group: groupOf(ts),
      ts: isNaN(ts) ? undefined : ts,
      unread: true,
      taskId: t.id,
    });
  });
  dueToday.forEach((t) => {
    const ts = parseTs(t.created_at || t.updated_at);
    real.push({
      id: `due-${t.id}`,
      tab: "Tasks",
      category: "Task",
      title: `Task Due Today: ${t.title}`,
      description: `${t.description ? t.description : t.title}${
        t.vehicle_registration ? " · " + t.vehicle_registration : ""
      }. Due today.`,
      time: timeAgo(t.created_at || t.updated_at) || "Today",
      group: groupOf(ts),
      ts: isNaN(ts) ? undefined : ts,
      unread: true,
      taskId: t.id,
    });
  });
  return [...real, ...STATIC_NOTIFS];
};

// Categories per the story (section 9). Fleet is kept but has no triggers yet.
const TABS: { key: string; label: string }[] = [
  { key: "All", label: "All" },
  { key: "Claims", label: "Claims" },
  { key: "Fleet", label: "Fleet" },
  { key: "Tasks", label: "Tasks" },
  { key: "System", label: "System Alerts" },
  { key: "Mentions", label: "Mentions" },
  { key: "High Priority", label: "High Priority" },
];

// category → icon + colour
const META: Record<string, { Icon: any; color: string; bg: string }> = {
  "High Priority": {
    Icon: AlertCircle,
    color: "text-blue-500",
    bg: "bg-blue-100",
  },
  Claim: { Icon: FileText, color: "text-blue-500", bg: "bg-blue-100" },
  Task: { Icon: ClipboardList, color: "text-blue-500", bg: "bg-blue-100" },
  Mention: { Icon: AtSign, color: "text-blue-500", bg: "bg-blue-100" },
  Fleet: { Icon: Truck, color: "text-blue-500", bg: "bg-blue-100" },
  "System Alert": { Icon: Settings, color: "text-blue-500", bg: "bg-blue-100" },
};

const Row = ({
  item,
  read,
  onClick,
  showCategory,
}: {
  item: NotifItem;
  read: boolean;
  onClick: () => void;
  showCategory: boolean;
}) => {
  const meta = META[item.category] || META["System Alert"];
  const Icon = meta.Icon;
  const unread = item.unread && !read;
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left px-4 py-3 border-b border-neutral-50 last:border-0 flex gap-3 hover:bg-neutral-50 ${
        unread ? "bg-blue-100/30" : "bg-white"
      }`}
    >
      <span
        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${meta.bg}`}
      >
        <Icon size={16} className={meta.color} />
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          {/* On a specific tab the category pill is hidden, so the title takes
              its place on the top row — keeps the layout aligned (no empty band). */}
          {showCategory ? (
            <span className="px-2 py-[2px] rounded border border-neutral-200 text-[10px] font-weight-500 text-neutral-600 shrink-0">
              {item.category}
            </span>
          ) : (
            <span className="flex-1 min-w-0 truncate text-sm font-weight-600 text-neutral-900">
              {item.title}
            </span>
          )}
          <div className="flex flex-col items-end gap-1 shrink-0 ml-auto">
            <span className="text-[11px] text-neutral-400">{item.time}</span>
            {unread && <span className="w-2 h-2 rounded-full bg-blue-500" />}
          </div>
        </div>
        {showCategory && (
          <div className="text-sm font-weight-600 text-neutral-900 mt-1 truncate">
            {item.title}
          </div>
        )}
        <div className="text-xs text-neutral-500 mt-0.5 line-clamp-2">
          {item.description}
        </div>
      </div>
    </button>
  );
};

const Notifications: React.FC<{
  items: NotifItem[];
  readIds: Set<string>;
  onMarkAllRead: () => void;
  onItemClick: (item: NotifItem) => void;
}> = ({ items, readIds, onMarkAllRead, onItemClick }) => {
  const [tab, setTab] = React.useState("All");

  const unreadCount = items.filter((n) => n.unread && !readIds.has(n.id)).length;
  const allRead = items.length > 0 && unreadCount === 0;
  const visible = (tab === "All" ? items : items.filter((n) => n.tab === tab))
    .slice()
    .sort((a, b) => (b.ts ?? 0) - (a.ts ?? 0)); // most recent first
  // Bucket into dynamic, recency-ordered groups by relative age
  // (Today → Yesterday → N days ago → N weeks ago → N months ago → …).
  // visible is already sorted newest-first, so first-seen order = recency order.
  const groups: { label: string; rows: NotifItem[] }[] = [];
  const groupIndex = new Map<string, number>();
  for (const n of visible) {
    const label = groupLabel(n.ts);
    let idx = groupIndex.get(label);
    if (idx === undefined) {
      idx = groups.length;
      groupIndex.set(label, idx);
      groups.push({ label, rows: [] });
    }
    groups[idx].rows.push(n);
  }

  const Section = ({ label, rows }: { label: string; rows: NotifItem[] }) =>
    rows.length === 0 ? null : (
      <>
        <div className="px-4 py-1.5 bg-blue-100 text-neutral-600 text-[14px] font-weight-500">
          {label}
        </div>
        {rows.map((n) => (
          <Row
            key={n.id}
            item={n}
            read={readIds.has(n.id)}
            onClick={() => onItemClick(n)}
            showCategory={tab === "All"}
          />
        ))}
      </>
    );

  return (
    <div className="w-[400px] max-w-[92vw] bg-white rounded-lg border border-neutral-200 shadow-xl font-['Stack_Sans_Headline'] overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between border-b border-neutral-100">
        <div className="flex items-center gap-2">
          <span className="text-base font-weight-600 text-neutral-900">Notifications</span>
          {unreadCount > 0 && (
            <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-blue-500 text-white text-[11px] font-weight-600 flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={onMarkAllRead}
          title={allRead ? "Mark all as unread" : "Mark all as read"}
          className={allRead ? "text-blue-500" : "text-neutral-400 hover:text-blue-500"}
        >
          <CheckCheck size={18} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 px-2 border-b border-neutral-100 overflow-x-auto no-scrollbar">
        {TABS.map((tb) => (
          <button
            key={tb.key}
            type="button"
            onClick={() => setTab(tb.key)}
            className={`px-3 py-2.5 text-sm whitespace-nowrap border-b-2 -mb-px ${
              tab === tb.key
                ? "border-blue-500 text-blue-500 font-weight-500"
                : "border-transparent text-neutral-500 hover:text-neutral-700"
            }`}
          >
            {tb.label}
          </button>
        ))}
      </div>

      {/* Body */}
      <div className="max-h-[460px] overflow-auto">
        {visible.length === 0 ? (
          <div className="px-4 py-10 text-center text-neutral-400 text-sm">
            No notifications
          </div>
        ) : (
          <>
            {groups.map((g) => (
              <Section key={g.label} label={g.label} rows={g.rows} />
            ))}
          </>
        )}
      </div>
    </div>
  );
};

export default Notifications;
