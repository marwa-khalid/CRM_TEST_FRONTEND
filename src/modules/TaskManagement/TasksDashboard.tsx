import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Search,
  Bell,
  ClipboardList,
  Car,
  PoundSterling,
  Percent,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  FileWarning,
  Truck,
  ChevronRight,
  ChevronDown,
  Clock3,
} from "lucide-react";
import PendingFollowups from '../../assets/Dashboard/PendingFollowups.svg'
import Overdue from '../../assets/Dashboard/Overdue.svg'
import Critical from '../../assets/Dashboard/Critical.svg'
import AllTasks from "../../assets/Dashboard/AllTasks.svg";

import { listTasks, type TaskFilters } from "../../services/Tasks/Tasks";
import { SpinnerLoader } from "../../components/common/SpinnerLoader";
import NotificationsPanel, {
  type NotifItem,
  buildTaskNotifications,
} from "./Notifications";

// ─── helpers ──────────────────────────────────────────────────────────────────

const formatDate = (value?: string | null): string => {
  if (!value) return "—";
  const [y, m, d] = value.split("-");
  if (!y || !m || !d) return value;
  return `${d}-${m}-${y.slice(2)}`;
};

const overdueDays = (due?: string | null): number => {
  if (!due) return 0;
  const d = new Date(due + "T00:00:00").getTime();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.round((today.getTime() - d) / 86400000);
  return diff > 0 ? diff : 0;
};

// ─── static dashboard data (hard-coded per design) ───────────────────────────────

const PERIODS = ["WTD", "MTD", "YTD", "Custom"];

const STAT_CARDS = [
  { label: "Claims Reported", value: "47", trend: "+8.2% vs last month", up: true, Icon: ClipboardList, iconBg: "bg-blue-50", iconColor: "text-blue-500" },
  { label: "Vehicles", value: "31", trend: "+5.2% vs last month", up: true, Icon: Car, iconBg: "bg-sky-50", iconColor: "text-sky-500" },
  { label: "Outstanding Debtors", value: "31", trend: "-3.1% vs last month", up: false, Icon: PoundSterling, iconBg: "bg-amber-50", iconColor: "text-amber-500" },
  { label: "Net Income", value: "£486,250", trend: "+8.2% vs last month", up: true, Icon: PoundSterling, iconBg: "bg-green-50", iconColor: "text-green-500" },
  { label: "Availability", value: "78%", trend: "+1.4% vs last month", up: true, Icon: Percent, iconBg: "bg-indigo-50", iconColor: "text-indigo-500" },
  { label: "Urgent Alerts", value: "31", trend: "-2.0% vs last month", up: false, Icon: AlertTriangle, iconBg: "bg-red-50", iconColor: "text-red-500" },
];

const ATTENTION = [
  { value: "47", label: "Overdue Claims", note: "28 Claims require immediate attention", tint: "bg-red-50 border-red-100", Icon: AlertCircle, iconColor: "text-red-500" },
  { value: "20", label: "Missing Documents", note: "20 Claims require critical Documents", tint: "bg-amber-50 border-amber-100", Icon: FileWarning, iconColor: "text-amber-500" },
  { value: "20", label: "Vehicles Overdue Return", note: "20 Vehicles past expected return date", tint: "bg-red-50 border-red-100", Icon: Truck, iconColor: "text-red-500" },
];

const INCOME_CARDS = [
  { value: "£72,400", label: "Hire Income" },
  { value: "£34,200", label: "Storage" },
  { value: "£8,250", label: "Admin Fee" },
  { value: "£4,250", label: "Engineer Fee" },
];

// ─── functional Tasks Details columns ────────────────────────────────────────────

interface ColumnDef {
  key: string;
  label: string;
  Icon: any;
  iconBg: string;
  iconColor?: string;
  cardBorder: string; // inner task-card border, tinted to the column colour
  filter: TaskFilters;
}

const COLUMNS: ColumnDef[] = [
  { key: "mine", label: "My Tasks", Icon: AllTasks, iconBg: "bg-blue-100",  cardBorder: "border-blue-200", filter: {} },
  { key: "overdue", label: "Overdue Tasks", Icon: Overdue, iconBg: "bg-red-100", cardBorder: "border-red-200", filter: { status: "Overdue" } },
  { key: "critical", label: "Critical Tasks", Icon: Critical, iconBg: "bg-yellow-100", cardBorder: "border-amber-200", filter: { priority: "High" } },
  { key: "followups", label: "Pending Followups", Icon: PendingFollowups, iconBg: "bg-neutral-100",cardBorder: "border-neutral-300", filter: { status: "Awaiting Response" } },
];

const TaskCard = ({ t, border, onClick }: { t: any; border: string; onClick: () => void }) => {
  const od = t.is_overdue && (t.status || "").toLowerCase() !== "completed";
  const odays = overdueDays(t.due_date);
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left bg-white rounded-md border ${border} p-3 flex flex-col gap-1.5 hover:shadow-sm transition`}
    >
      <span className="text-neutral-900 text-sm font-weight-500 line-clamp-1">
        {t.title}
        {t.claim_reference ? ` - ${t.claim_reference}` : ""}
      </span>
      {t.due_date && (
        <span className={`text-xs ${od ? "text-red-500" : "text-neutral-400"}`}>
          Due: {formatDate(t.due_date)}
          {od && odays > 0 ? ` · Overdue ${odays} Day${odays === 1 ? "" : "s"}` : ""}
        </span>
      )}
    </button>
  );
};

const Column = ({
  col, me, onOpen,
}: { col: ColumnDef; me: string; onOpen: (f: TaskFilters) => void }) => {
  const [items, setItems] = useState<any[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const filter: TaskFilters = col.key === "mine" && me ? { assigned_user: me } : col.filter;

  useEffect(() => {
    setLoading(true);
    listTasks({ ...filter, page_size: 10 })
      .then(({ data }) => { setItems(data?.items ?? []); setCount(data?.total ?? 0); })
      .catch(() => { setItems([]); setCount(0); })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me]);

  return (
    <div className="rounded-xl border border-neutral-200 p-4 flex flex-col gap-4 min-w-0">
      {/* header: icon + count + label */}
      <button type="button" onClick={() => onOpen(filter)} className="flex items-center gap-3 text-left">
        <span className={`w-10 h-10 rounded ${col.iconBg} flex items-center justify-center shrink-0`}>
          <img src={col.Icon} alt="" />
        </span>
        <div className="flex flex-col">
          <span className="text-neutral-900 text-xl font-weight-600 leading-6">{count}</span>
          <span className="text-neutral-500 text-xs">{col.label}</span>
        </div>
      </button>
      {/* task list */}
      <div className="flex flex-col gap-3 max-h-[440px] overflow-auto pr-1">
        {loading ? null : items.length === 0 ? (
          <div className="text-neutral-400 text-xs py-6 text-center border border-dashed border-neutral-200 rounded-md">
            No tasks
          </div>
        ) : (
          items.map((t) => <TaskCard key={t.id} t={t} border={col.cardBorder} onClick={() => onOpen(filter)} />)
        )}
      </div>
    </div>
  );
};

// ─── period tabs ─────────────────────────────────────────────────────────────────

const PeriodTabs = ({ active, onChange }: { active: string; onChange: (p: string) => void }) => (
  <div className="inline-flex items-center bg-neutral-100 rounded p-1 gap-1">
    {PERIODS.map((p) => (
      <button
        key={p}
        type="button"
        onClick={() => onChange(p)}
        className={`px-4 py-1.5 rounded text-sm ${
          active === p ? "bg-blue-500 text-white" : "text-neutral-600 hover:text-neutral-900"
        }`}
      >
        {p}
      </button>
    ))}
  </div>
);

// ─── main ─────────────────────────────────────────────────────────────────────

const TasksDashboard: React.FC<{ onOpen?: (f: TaskFilters) => void }> = ({ onOpen }) => {
  const [me, setMe] = useState("");
  const [period, setPeriod] = useState("WTD");
  const [incomePeriod, setIncomePeriod] = useState("WTD");

  // notifications
  const [notifOpen, setNotifOpen] = useState(false);
  const [overdue, setOverdue] = useState<any[]>([]);
  const [dueToday, setDueToday] = useState<any[]>([]);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const u = JSON.parse(localStorage.getItem("user") || "{}");
      setMe([u.first_name, u.last_name].filter(Boolean).join(" "));
    } catch {
      setMe("");
    }
  }, []);

  useEffect(() => {
    listTasks({ status: "Overdue", page_size: 50 })
      .then(({ data }) => setOverdue(data?.items ?? []))
      .catch(() => setOverdue([]));
    const today = new Date().toISOString().split("T")[0];
    listTasks({ due_from: today, due_to: today, page_size: 50 })
      .then(({ data }) =>
        setDueToday(
          (data?.items ?? []).filter((t: any) => !["Completed", "Rejected"].includes(t.status)),
        ),
      )
      .catch(() => setDueToday([]));
  }, []);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
    };
    if (notifOpen) document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [notifOpen]);

  const notifications = useMemo<NotifItem[]>(
    () => buildTaskNotifications(overdue, dueToday),
    [overdue, dueToday],
  );
  const unreadCount = notifications.filter((n) => n.unread && !readIds.has(n.id)).length;
  const markAllRead = () => setReadIds(new Set(notifications.map((n) => n.id)));
  const handleNotifClick = (n: NotifItem) => {
    setReadIds((prev) => new Set(prev).add(n.id));
    if (n.taskId) onOpen?.({});
    setNotifOpen(false);
  };

  const open = (f: TaskFilters) => onOpen?.(f);

  return (
    <>
      {/* Header */}
      <div className="h-20 px-10 py-4 border-b border-neutral-100 flex items-center justify-between shrink-0">
        <h1 className="text-neutral-900 text-2xl font-weight-600">Dashboard</h1>
        <div className="flex items-center gap-6 text-neutral-500">
          <Search size={20} />
          <div className="relative" ref={notifRef}>
            <button
              type="button"
              onClick={() => setNotifOpen((o) => !o)}
              className="relative text-neutral-500 hover:text-neutral-700"
            >
              <Bell size={20} />
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
        </div>
      </div>

      <section className="px-10 py-6 flex-1 overflow-auto font-['Stack_Sans_Headline'] flex flex-col gap-8">
        {/* Period tabs */}
        <PeriodTabs active={period} onChange={setPeriod} />

        {/* Stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
          {STAT_CARDS.map((c) => (
            <div key={c.label} className="rounded-lg border border-neutral-200 p-4 flex flex-col gap-3">
              <div className="flex items-start justify-between">
                <span className={`w-9 h-9 rounded-lg ${c.iconBg} flex items-center justify-center`}>
                  <c.Icon size={18} className={c.iconColor} />
                </span>
                {c.up ? (
                  <TrendingUp size={18} className="text-green-500" />
                ) : (
                  <TrendingDown size={18} className="text-red-500" />
                )}
              </div>
              <div className="text-neutral-900 text-2xl font-weight-600 leading-7">{c.value}</div>
              <div className="text-neutral-500 text-xs">{c.label}</div>
              <div className={`text-[11px] ${c.up ? "text-green-500" : "text-red-500"}`}>{c.trend}</div>
            </div>
          ))}
        </div>

        {/* Attention required */}
        <div>
          <h2 className="text-neutral-900 text-lg font-weight-600 mb-3">Attention Required</h2>
          <div className="flex items-stretch gap-4">
            {ATTENTION.map((a) => (
              <div key={a.label} className={`flex-1 rounded-lg border ${a.tint} p-4 flex flex-col gap-2`}>
                <div className="flex items-center gap-2">
                  <a.Icon size={18} className={a.iconColor} />
                  <span className="text-neutral-900 text-2xl font-weight-600">{a.value}</span>
                  <span className="text-neutral-700 text-sm font-weight-500">{a.label}</span>
                </div>
                <p className="text-neutral-500 text-xs">{a.note}</p>
              </div>
            ))}
            <button
              type="button"
              className="w-10 shrink-0 rounded-lg border border-neutral-200 flex items-center justify-center text-neutral-400 hover:text-neutral-700"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        {/* Tasks Details (functional) */}
        <div>
          <h2 className="text-neutral-900 text-lg font-weight-600 mb-4">Tasks Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
            {COLUMNS.map((col) => (
              <Column key={col.key} col={col} me={me} onOpen={open} />
            ))}
          </div>
        </div>

        {/* Net Income Breakdown */}
        <div className="rounded-lg border border-neutral-200 p-5">
          <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
            <h2 className="text-neutral-900 text-lg font-weight-600">Net Income Breakdown</h2>
            <div className="flex items-center gap-3">
              <PeriodTabs active={incomePeriod} onChange={setIncomePeriod} />
              <button
                type="button"
                className="flex items-center gap-2 h-9 px-3 rounded border border-neutral-200 text-sm text-neutral-600"
              >
                Income Type <ChevronDown size={14} />
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
            {INCOME_CARDS.map((c) => (
              <div key={c.label} className="rounded-lg border border-neutral-100 p-4">
                <div className="text-neutral-900 text-xl font-weight-600">{c.value}</div>
                <div className="text-neutral-500 text-xs mt-1">{c.label}</div>
              </div>
            ))}
          </div>
          {/* Static area chart */}
          <svg viewBox="0 0 600 180" preserveAspectRatio="none" className="w-full h-44">
            <defs>
              <linearGradient id="incomeFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#22c55e" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path
              d="M0,120 C80,60 140,140 200,90 C260,50 320,130 380,80 C440,40 520,110 600,70 L600,180 L0,180 Z"
              fill="url(#incomeFill)"
            />
            <path
              d="M0,120 C80,60 140,140 200,90 C260,50 320,130 380,80 C440,40 520,110 600,70"
              fill="none"
              stroke="#22c55e"
              strokeWidth="2.5"
            />
          </svg>
        </div>
      </section>
    </>
  );
};

export default TasksDashboard;
