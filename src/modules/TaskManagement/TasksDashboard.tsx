import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Search,
  Bell,
  ClipboardList,
  Car,
  PoundSterling,
  Percent,
  AlertTriangle,
  ChevronRight,
  ChevronDown,
  Clock12,
  Calendar as CalendarIcon,
} from "lucide-react";
import PendingFollowups from '../../assets/Dashboard/PendingFollowups.svg'
import Overdue from '../../assets/Dashboard/Overdue.svg'
import Critical from '../../assets/Dashboard/Critical.svg'
import AllTasks from "../../assets/Dashboard/AllTasks.svg";
import TrendingDown from "../../assets/Dashboard/TrendingDown.svg";
import TrendingUp from "../../assets/Dashboard/TrendingUp.svg";
import FileIcon from "../../assets/Dashboard/File.svg";
import Clock from "../../assets/Dashboard/Clock.svg";
import Urgent from "../../assets/Dashboard/Urgent.svg";
import Pound from "../../assets/Dashboard/Pound.svg";
import Cars from "../../assets/Dashboard/Cars.svg";

import { listTasks, type TaskFilters } from "../../services/Tasks/Tasks";
import { SpinnerLoader } from "../../components/common/SpinnerLoader";
import { useCurrentUser } from "../../context/AuthContext";
import NotificationsPanel, {
  type NotifItem,
  buildTaskNotifications,
} from "./Notifications";
import { getNotifications, markNotificationRead, markAllNotificationsRead } from "../../services/Notifications/Notifications";
import { getDashboard, getDashboardTrends, getDashboardIncome } from "../../services/Dashboard/Dashboard";
import { CustomDatePicker } from "../Claims/Components/DatePicker";
import MissingDocumentsSlider from "./MissingDocumentsSlider";
import Select from "react-select";
import { customStyles, BlueDropdownIndicator } from "../Claims/Steps/GeneralDetailsForm";
import FleetOperations from "./FleetDummy";

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

const fmtMoney = (n: any) => "£" + Math.round(Number(n) || 0).toLocaleString();
const fmtNum = (n: any) => (Number(n) || 0).toLocaleString();
const toLocalISO = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

// label/icon/styling are fixed by design; `value` is filled from real data via `key`.
const STAT_CARDS = [
  {
    key: "claims_reported",
    label: "Claims Reported",
    trend: "+8.2% vs last month",
    up: true,
    Icon: FileIcon,
    iconBg: "bg-blue-100",
  },
  {
    key: "vehicles",
    label: "Vehicles on hire",
    trend: "+5.2% vs last month",
    up: true,
    Icon: FileIcon,
    iconBg: "bg-blue-100",
  },
  {
    key: "outstanding_debtors_count",
    label: "Outstanding Debtors",
    trend: "-3.1% vs last month",
    up: false,
    Icon: Clock,
    iconBg: "bg-yellow-100",
  },
  {
    key: "net_income",
    label: "Net Income",
    money: true,
    trend: "+8.2% vs last month",
    up: true,
    Icon: Pound,
    iconBg: "bg-neutral-100",
  },
  {
    key: "availability_pct",
    label: "Fleet Availability",
    pct: true,
    trend: "+1.4% vs last month",
    up: true,
    Icon: Cars,
    iconBg: "bg-blue-100",
  },
  {
    key: "urgent_alerts",
    label: "Urgent Alerts",
    trend: "-2.0% vs last month",
    up: false,
    Icon: Urgent,
    iconBg: "bg-red-100",
  },
] as const;

const ATTENTION = [
  { key: "overdue_claims", label: "Overdue Claims", note: "Claims require immediate attention", tint: "bg-red-100 border-red-100", Icon: Overdue},
  { key: "missing_documents", label: "Missing Documents", note: "Claims require critical documents", tint: "bg-yellow-100 border-yellow-100", Icon: Critical },
  { key: "vehicles_overdue_return", label: "Vehicles Overdue Return", note: "Vehicles past expected return date", tint: "bg-red-100 border-red-100", Icon: Overdue },
] as const;

const INCOME_CARDS = [
  { key: "hire", label: "Hire Income", color: "#A3CFFF" },
  { key: "storage", label: "Storage", color: "#FFF1D7" },
  { key: "recovery", label: "Recovery", color: "#93F293" },
  { key: "admin", label: "Admin Fee", color: "#87D6EA" },
  { key: "engineer", label: "Engineer Fee", color: "#F2D993" },
] as const;

const INCOME_TYPE_OPTIONS = [
  { value: "all", label: "All Income" },
  { value: "hire", label: "Hire Income" },
  { value: "storage", label: "Storage" },
  { value: "recovery", label: "Recovery" },
  { value: "admin", label: "Admin Fee" },
  { value: "engineer", label: "Engineer Fee" },
];

// ─── data-driven SVG/CSS charts (no chart library) ───────────────────────────────

type Pt = { label: string; value: number };

const niceMax = (max: number) => {
  if (max <= 0) return 1;
  const pow = Math.pow(10, Math.floor(Math.log10(max)));
  return Math.ceil(max / pow) * pow || 1;
};

// Cardinal-spline (smooth) path through the points, in a 0..100 coordinate box.
const cardinalPath = (pts: { x: number; y: number }[]) => {
  if (pts.length < 2) return pts.length ? `M ${pts[0].x},${pts[0].y}` : "";
  const at = (i: number) => pts[Math.max(0, Math.min(pts.length - 1, i))];
  let d = `M ${pts[0].x},${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = at(i - 1), p1 = at(i), p2 = at(i + 1), p3 = at(i + 2);
    const c1x = p1.x + (p2.x - p0.x) / 6, c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6, c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${c1x},${c1y} ${c2x},${c2y} ${p2.x},${p2.y}`;
  }
  return d;
};

// Smooth line chart with Y-axis, dotted gridlines, dot markers + hover tooltip.
const LineChart: React.FC<{ points: Pt[] }> = ({ points }) => {
  const [hover, setHover] = useState<number | null>(null);
  const max = niceMax(Math.max(5, ...points.map((p) => p.value)));
  const STEPS = 6;
  const ticks = Array.from({ length: STEPS + 1 }, (_, i) => Math.round((max / STEPS) * i));
  const n = Math.max(1, points.length - 1);
  const X = (i: number) => (i / n) * 100;
  const Y = (v: number) => 100 - (v / max) * 100;
  const coords = points.map((p, i) => ({ x: X(i), y: Y(p.value), v: p.value, label: p.label }));
  const path = cardinalPath(coords);
  const H = 224;

  return (
    <div>
      <div className="flex">
        {/* Y axis labels */}
        <div className="relative w-8 shrink-0" style={{ height: H }}>
          {ticks.map((t) => (
            <span key={t} className="absolute right-1.5 -translate-y-1/2 text-[10px] text-neutral-400" style={{ top: `${Y(t)}%` }}>{t}</span>
          ))}
        </div>
        {/* Plot */}
        <div className="relative flex-1" style={{ height: H }}>
          {ticks.map((t) => (
            <div key={t} className="absolute left-0 right-0 border-t border-dashed border-neutral-200" style={{ top: `${Y(t)}%` }} />
          ))}
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full overflow-visible">
            <path d={path} fill="none" stroke="#0352FD" strokeWidth="2" vectorEffect="non-scaling-stroke" />
          </svg>
          {coords.map((c, i) => (
            <div
              key={i}
              className="absolute -translate-x-1/2 -translate-y-1/2 z-10"
              style={{ left: `${c.x}%`, top: `${c.y}%` }}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
            >
              <div className="w-2.5 h-2.5 rounded-full bg-blue-600 border-2 border-white shadow cursor-pointer" />
              {hover === i && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 whitespace-nowrap bg-neutral-900 text-white text-[11px] px-2 py-1 rounded shadow-lg">
                  {c.label}: <span className="font-weight-600">{c.v}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      {/* X axis labels (aligned under the dots) */}
      <div className="flex mt-2">
        <div className="w-8 shrink-0" />
        <div className="relative flex-1 h-4">
          {coords.map((c, i) => (
            <span key={i} className="absolute -translate-x-1/2 text-[11px] text-neutral-400" style={{ left: `${c.x}%` }}>{c.label}</span>
          ))}
        </div>
      </div>
    </div>
  );
};

// Compact money tick (£3k / £950).
const fmtTick = (v: number) => (v >= 1000 ? `£${(v / 1000).toFixed(v % 1000 === 0 ? 0 : 1)}k` : `£${v}`);

// Vertical bars with Y-axis, dotted gridlines + hover tooltip.
const BarChart: React.FC<{ points: Pt[] }> = ({ points }) => {
  const [hover, setHover] = useState<number | null>(null);
  const max = niceMax(Math.max(5, ...points.map((p) => p.value)));
  const STEPS = 6;
  const ticks = Array.from({ length: STEPS + 1 }, (_, i) => Math.round((max / STEPS) * i));
  const Y = (v: number) => 100 - (v / max) * 100;
  const H = 224;
  return (
    <div>
      <div className="flex">
        <div className="relative w-11 shrink-0" style={{ height: H }}>
          {ticks.map((t) => (
            <span key={t} className="absolute right-1.5 -translate-y-1/2 text-[10px] text-neutral-400" style={{ top: `${Y(t)}%` }}>{fmtTick(t)}</span>
          ))}
        </div>
        <div className="relative flex-1" style={{ height: H }}>
          {ticks.map((t) => (
            <div key={t} className="absolute left-0 right-0 border-t border-dashed border-neutral-200" style={{ top: `${Y(t)}%` }} />
          ))}
          <div className="absolute inset-0 flex items-end gap-3 px-2">
            {points.map((p, i) => (
              <div
                key={i}
                className="flex-1 h-full flex items-end justify-center relative"
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
              >
                <div
                  className="w-full max-w-[24px] rounded-t bg-blue-500 hover:bg-blue-600 transition-colors"
                  style={{ height: `${Math.max(1, (p.value / max) * 100)}%` }}
                />
                {hover === i && (
                  <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 whitespace-nowrap bg-neutral-900 text-white text-[11px] px-2 py-1 rounded shadow-lg z-10">
                    {p.label}: <span className="font-weight-600">{fmtMoney(p.value)}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="flex mt-2">
        <div className="w-11 shrink-0" />
        <div className="flex-1 flex gap-3 px-2 text-[11px] text-neutral-400">
          {points.map((p, i) => <span key={i} className="flex-1 text-center">{p.label}</span>)}
        </div>
      </div>
    </div>
  );
};

// Horizontal bars (debtors age).
const HBars: React.FC<{ rows: { label: string; amount: number }[] }> = ({ rows }) => {
  const max = Math.max(1, ...rows.map((r) => r.amount));
  const colors = ["#3b82f6", "#22c55e", "#f59e0b", "#ef4444"];
  return (
    <div className="flex flex-col gap-3">
      {rows.map((r, i) => (
        <div key={i} className="flex items-center gap-3">
          <span className="w-14 text-xs text-neutral-500">{r.label}</span>
          <div className="flex-1 h-3 rounded-full bg-neutral-100 overflow-hidden">
            <div className="h-full rounded-full" style={{ width: `${(r.amount / max) * 100}%`, background: colors[i % 4] }} />
          </div>
          <span className="w-24 text-right text-xs font-weight-600 text-neutral-700">{fmtMoney(r.amount)}</span>
        </div>
      ))}
    </div>
  );
};

// Donut (collection %).
const Donut: React.FC<{ pct: number }> = ({ pct }) => {
  const r = 52, c = 2 * Math.PI * r;
  const off = c * (1 - Math.max(0, Math.min(100, pct)) / 100);
  return (
    <div className="relative w-36 h-36">
      <svg viewBox="0 0 140 140" className="w-full h-full -rotate-90">
        <circle cx="70" cy="70" r={r} fill="none" stroke="#E5E7EB" strokeWidth="16" />
        <circle cx="70" cy="70" r={r} fill="none" stroke="#2563EB" strokeWidth="16" strokeDasharray={c} strokeDashoffset={off} strokeLinecap="round" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-weight-600 text-neutral-900">{pct}%</span>
        <span className="text-[11px] text-neutral-400">Collected</span>
      </div>
    </div>
  );
};

// Stacked proportion bar (net income breakdown).
const SegBar: React.FC<{ parts: { value: number; color: string }[] }> = ({ parts }) => {
  const total = Math.max(1, parts.reduce((s, p) => s + p.value, 0));
  return (
    <div className="flex h-3 rounded-full overflow-hidden bg-neutral-100">
      {parts.map((p, i) => (
        <div key={i} style={{ width: `${(p.value / total) * 100}%`, background: p.color }} />
      ))}
    </div>
  );
};

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
  { key: "all", label: "All Tasks", Icon: AllTasks, iconBg: "bg-blue-100",  cardBorder: "border-blue-200", filter: {} },
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
  const filter: TaskFilters = col.filter;

  useEffect(() => {
    setLoading(true);
    // "All Tasks" shows the remainder — everything that ISN'T already in the
    // Overdue / Critical / Pending-Followups columns, so nothing repeats.
    const params = col.key === "all" ? { page_size: 100 } : { ...filter, page_size: 10 };
    listTasks(params)
      .then(({ data }) => {
        let rows = data?.items ?? [];
        if (col.key === "all") {
          rows = rows.filter(
            (t: any) =>
              !t.is_overdue &&
              (t.priority || "").toLowerCase() !== "high" &&
              t.status !== "Awaiting Response",
          );
          setItems(rows);
          setCount(rows.length);
        } else {
          setItems(rows);
          setCount(data?.total ?? 0);
        }
      })
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
  const { user } = useCurrentUser();
  const me = user?.name || ""; // logged-in user's name (email-before-@)
  const [dash, setDash] = useState<any>(null); // real dashboard aggregates
  const [missingOpen, setMissingOpen] = useState(false);
  useEffect(() => {
    getDashboard().then(({ data }) => setDash(data)).catch(() => setDash(null));
  }, []);
  const [period, setPeriod] = useState("WTD");
  const [incomePeriod, setIncomePeriod] = useState("YTD");
  const [incomeType, setIncomeType] = useState("all"); // Net Income breakdown filter
  const [incomeFrom, setIncomeFrom] = useState("");
  const [incomeTo, setIncomeTo] = useState("");
  const [incomeBreakdown, setIncomeBreakdown] = useState<any>({});
  const [calOpen, setCalOpen] = useState<null | "from" | "to">(null);
  const calRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (incomePeriod === "Custom") {
      if (incomeFrom && incomeTo) {
        getDashboardIncome("CUSTOM", incomeFrom, incomeTo).then(({ data }) => setIncomeBreakdown(data || {})).catch(() => {});
      }
    } else {
      getDashboardIncome(incomePeriod).then(({ data }) => setIncomeBreakdown(data || {})).catch(() => {});
    }
  }, [incomePeriod, incomeFrom, incomeTo]);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (calRef.current && !calRef.current.contains(e.target as Node)) setCalOpen(null); };
    if (calOpen) document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [calOpen]);
  const [trendPeriod, setTrendPeriod] = useState("YTD");
  const [trendMode, setTrendMode] = useState("YoY");
  const [hirePeriod, setHirePeriod] = useState("YTD");
  const [hireMode, setHireMode] = useState("YoY");

  // notifications
  const [notifOpen, setNotifOpen] = useState(false);
  const [overdue, setOverdue] = useState<any[]>([]);
  const [dueToday, setDueToday] = useState<any[]>([]);
  const [dbNotifs, setDbNotifs] = useState<NotifItem[]>([]);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const notifRef = useRef<HTMLDivElement>(null);

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
    getNotifications()
      .then(({ data }) => setDbNotifs(Array.isArray(data) ? data : []))
      .catch(() => setDbNotifs([]));
  }, []);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
    };
    if (notifOpen) document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [notifOpen]);

  const fetchDbNotifs = () =>
    getNotifications()
      .then(({ data }) => setDbNotifs(Array.isArray(data) ? data : []))
      .catch(() => setDbNotifs([]));

  const notifications = useMemo<NotifItem[]>(
    () => [...dbNotifs, ...buildTaskNotifications(overdue, dueToday)],
    [dbNotifs, overdue, dueToday],
  );
  const unreadCount = notifications.filter((n) => n.unread && !readIds.has(n.id)).length;
  const markAllRead = () => {
    setReadIds(new Set(notifications.map((n) => n.id)));
    markAllNotificationsRead().then(fetchDbNotifs).catch(() => {});
  };
  const handleNotifClick = (n: NotifItem) => {
    setReadIds((prev) => new Set(prev).add(n.id));
    if (n.notif_id) markNotificationRead(n.notif_id).then(fetchDbNotifs).catch(() => {});
    if (n.taskId) onOpen?.({});
    setNotifOpen(false);
  };

  const open = (f: TaskFilters) => onOpen?.(f);

  // value helpers off the real aggregates (fallback "—" until loaded)
  const statValue = (c: any) => {
    const v = dash?.stats?.[c.key];
    if (v == null) return "—";
    if (c.money) return fmtMoney(v);
    if (c.pct) return `${v}%`;
    return fmtNum(v);
  };
  const attnValue = (a: any) => fmtNum(dash?.attention?.[a.key] ?? 0);
  // Real month-over-month trend (falls back to the static text until loaded).
  const trendOf = (c: any) => dash?.trends?.[c.key];
  const trendUp = (c: any) => (trendOf(c) ? trendOf(c).up : c.up);
  const trendText = (c: any) =>
    trendOf(c) ? `${trendOf(c).up ? "+" : "-"}${trendOf(c).pct}% vs last month` : c.trend;
  const incomeValue = (c: any) => fmtMoney(incomeBreakdown?.[c.key] ?? 0);
  const breakdown = incomeBreakdown || {};
  const shownCards =
    incomeType === "all" ? INCOME_CARDS : INCOME_CARDS.filter((c) => c.key === incomeType);
  // Trend series re-fetched per the chart's period filter.
  const [claimsTrend, setClaimsTrend] = useState<Pt[]>([]);
  const [hireTrend, setHireTrend] = useState<Pt[]>([]);
  useEffect(() => {
    getDashboardTrends(trendPeriod).then(({ data }) => setClaimsTrend(data?.claims_trend || [])).catch(() => {});
  }, [trendPeriod]);
  useEffect(() => {
    getDashboardTrends(hirePeriod).then(({ data }) => setHireTrend(data?.hire_trend || [])).catch(() => {});
  }, [hirePeriod]);
  const debtorsAge = dash?.debtors_age || [];
  const collection = dash?.collection_ytd || { pct: 0, collected: 0, outstanding: 0 };
  const storageRecovery = dash?.storage_recovery || { storage: 0, recovery: 0 };

  return (
    <>
      {/* Header */}
      <div className="h-20 px-10 py-4 border-b border-neutral-100 flex items-center justify-between shrink-0 font-['Stack_Sans_Headline']">
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
            <div
              key={c.label}
              className="rounded-lg border border-neutral-200 p-4 flex flex-col gap-3"
            >
              <div className="flex items-start gap-4 items-center">
                <span
                  className={`w-9 h-9 rounded ${c.iconBg} flex items-center justify-center`}
                >
                  <img src={c.Icon} alt="" />
                </span>
                {trendUp(c) ? (
                  <img src={TrendingUp} alt="" />
                ) : (
                  <img src={TrendingDown} alt="" />
                )}
              </div>
              <div className="text-neutral-900 text-2xl font-weight-600 leading-7">
                {statValue(c)}
              </div>
              <div className="text-neutral-500 text-xs">{c.label}</div>
              <div
                className={`text-[11px] ${trendUp(c) ? "text-green-500" : "text-red-500"}`}
              >
                {trendText(c)}
              </div>
            </div>
          ))}
        </div>

        {/* Attention required */}
        <div>
          <h2 className="text-neutral-900 text-[20px] font-weight-600 mb-3">
            Attention Required
          </h2>
          <div className="flex items-stretch gap-4">
            {ATTENTION.map((a) => (
              <div
                key={a.label}
                onClick={a.key === "missing_documents" ? () => setMissingOpen(true) : undefined}
                className={`flex-1 rounded-lg border ${a.tint} p-4 flex flex-col gap-2 ${
                  a.key === "missing_documents" ? "cursor-pointer hover:shadow-sm" : ""
                }`}
              >
                <div className="flex items-center gap-2">
                  <img src={a.Icon} alt="" />
                  <span className="text-neutral-900 text-2xl font-weight-600">
                    {attnValue(a)}
                  </span>
                  <span className="text-neutral-700 text-sm font-weight-500">
                    {a.label}
                  </span>
                </div>
                <p className="text-neutral-500 text-xs">{a.note}</p>
              </div>
            ))}
            {/* <button
              type="button"
              className="w-10 shrink-0 rounded-lg border border-neutral-200 flex items-center justify-center text-neutral-400 hover:text-neutral-700"
            >
              <ChevronRight size={20} />
            </button> */}
          </div>
        </div>

        {/* Tasks Details (functional) */}
        <div>
          <h2 className="text-neutral-900 text-[20px] font-weight-600 mb-4">
            Tasks Details
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
            {COLUMNS.map((col) => (
              <Column key={col.key} col={col} me={me} onOpen={open} />
            ))}
          </div>
        </div>

        {/* Net Income Breakdown */}
        <div className="rounded-lg border border-neutral-200 p-5">
          <h2 className="text-neutral-900 text-[20px] font-weight-600 mb-4">
            Net Income Breakdown
          </h2>
          <div className="flex items-center flex-wrap gap-3 mb-6">
            <PeriodTabs active={incomePeriod} onChange={setIncomePeriod} />
            {incomePeriod === "Custom" && (
              <div ref={calRef} className="flex items-center gap-2">
                {(["from", "to"] as const).map((which) => {
                  const val = which === "from" ? incomeFrom : incomeTo;
                  const set = which === "from" ? setIncomeFrom : setIncomeTo;
                  return (
                    <div key={which} className="relative">
                      <div
                        onClick={() => setCalOpen((o) => (o === which ? null : which))}
                        className="h-9 px-3 rounded border border-neutral-200 text-sm text-neutral-600 flex items-center gap-2 cursor-pointer min-w-[120px] justify-between"
                      >
                        <span className={val ? "text-neutral-700" : "text-neutral-400"}>{val || (which === "from" ? "From" : "To")}</span>
                        <CalendarIcon size={14} className="text-neutral-400" />
                      </div>
                      {calOpen === which && (
                        <div className="absolute top-full left-0 z-50 mt-1 shadow-xl rounded-lg bg-white">
                          <CustomDatePicker
                            selectedDate={val ? new Date(val + "T00:00:00") : new Date()}
                            onDateSelect={(d: Date) => { set(toLocalISO(d)); setCalOpen(null); }}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            <div className="w-44">
              <Select
                options={INCOME_TYPE_OPTIONS}
                value={INCOME_TYPE_OPTIONS.find((o) => o.value === incomeType)}
                onChange={(o: any) => setIncomeType(o?.value || "all")}
                styles={customStyles}
                components={{ DropdownIndicator: BlueDropdownIndicator, IndicatorSeparator: () => null }}
                isSearchable={false}
                placeholder="Income Type"
              />
            </div>
          </div>
          {/* figures — each amount/label starts where its bar segment starts */}
          <div className="flex items-end">
            {shownCards.map((c) => {
              const val = Number(breakdown[c.key]) || 0;
              return (
                <div
                  key={c.key}
                  style={{ flexGrow: Math.max(val, 1), flexBasis: 0, minWidth: 110 }}
                  className="flex flex-col gap-2 pr-4"
                >
                  <div className="text-neutral-900 text-xl font-weight-600 whitespace-nowrap">
                    {fmtMoney(val)}
                  </div>
                  <div className="text-neutral-500 text-xs whitespace-nowrap">{c.label}</div>
                </div>
              );
            })}
          </div>
          {/* proportional bar — segments share the same widths as the figures above */}
          <div className="flex h-2 mt-3 rounded-full overflow-hidden">
            {shownCards.map((c) => {
              const val = Number(breakdown[c.key]) || 0;
              return (
                <div
                  key={c.key}
                  style={{ flexGrow: Math.max(val, 1), flexBasis: 0, minWidth: 110, background: c.color }}
                />
              );
            })}
          </div>
          {/* <div className="flex flex-wrap gap-4 mt-3">
            {INCOME_CARDS.map((c) => (
              <div
                key={c.key}
                className="flex items-center gap-2 text-xs text-neutral-500"
              >
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ background: c.color }}
                />{" "}
                {c.label}
              </div>
            ))}
          </div> */}
        </div>

        {/* Claims Trend */}
        <div className="rounded-lg border border-neutral-200 p-5">
          <h2 className="text-neutral-900 text-[20px] font-weight-600 mb-4">
            Claims Trend
          </h2>
          <div className="flex items-center flex-wrap gap-3 mb-6">
            <PeriodTabs active={trendPeriod} onChange={setTrendPeriod} />
            <div className="flex items-center bg-neutral-100 rounded-md p-0.5 text-sm">
              {["YoY", "MoM"].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setTrendMode(m)}
                  className={`px-3 py-1.5 rounded ${trendMode === m ? "bg-white text-blue-600 shadow-sm" : "text-neutral-500"}`}
                >
                  {m}
                </button>
              ))}
            </div>
            <button type="button" className="flex items-center gap-2 h-9 px-3 rounded border border-neutral-200 text-sm text-neutral-600">
              Referrer <ChevronDown size={14} />
            </button>
            <button type="button" className="flex items-center gap-2 h-9 px-3 rounded border border-neutral-200 text-sm text-neutral-600">
              Status <ChevronDown size={14} />
            </button>
          </div>
          <LineChart points={claimsTrend} />
          <div className="flex items-center justify-center gap-2 mt-4 text-xs text-neutral-400">
            <span className="w-1.5 h-1.5 rounded-full bg-neutral-300" />
            {claimsTrend.length > 0
              ? `${claimsTrend[0].label} to ${claimsTrend[claimsTrend.length - 1].label} ${new Date().getFullYear()}`
              : ""}
          </div>
        </div>

        {/* Hire Trend */}
        <div className="rounded-lg border border-neutral-200 p-5">
          <h2 className="text-neutral-900 text-[20px] font-weight-600 mb-4">
            Hire Trend
          </h2>
          <div className="flex items-center flex-wrap gap-3 mb-6">
            <PeriodTabs active={hirePeriod} onChange={setHirePeriod} />
            <div className="flex items-center bg-neutral-100 rounded-md p-0.5 text-sm">
              {["YoY", "MoM"].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setHireMode(m)}
                  className={`px-3 py-1.5 rounded ${hireMode === m ? "bg-white text-blue-600 shadow-sm" : "text-neutral-500"}`}
                >
                  {m}
                </button>
              ))}
            </div>
            <button type="button" className="flex items-center gap-2 h-9 px-3 rounded border border-neutral-200 text-sm text-neutral-600">
              Referrer <ChevronDown size={14} />
            </button>
            <button type="button" className="flex items-center gap-2 h-9 px-3 rounded border border-neutral-200 text-sm text-neutral-600">
              Status <ChevronDown size={14} />
            </button>
          </div>
          <BarChart points={hireTrend} />
          <div className="flex items-center justify-center gap-2 mt-4 text-xs text-neutral-400">
            <span className="w-1.5 h-1.5 rounded-full bg-neutral-300" />
            {hireTrend.length > 0
              ? `${hireTrend[0].label} to ${hireTrend[hireTrend.length - 1].label} ${new Date().getFullYear()}`
              : ""}
          </div>
        </div>

        {/* Debtors Age + Collection Performance */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="rounded-lg border border-neutral-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-neutral-900 text-[20px] font-weight-600">
                Debtors Age Analysis
              </h2>
              <span className="text-neutral-900 text-[20px] font-weight-600">
                {fmtMoney(
                  debtorsAge.reduce(
                    (s: number, r: any) => s + (Number(r.amount) || 0),
                    0,
                  ),
                )}
              </span>
            </div>
            <HBars rows={debtorsAge} />
          </div>
          <div className="rounded-lg border border-neutral-200 p-5">
            <h2 className="text-neutral-900 text-[20px] font-weight-600 mb-4">
              Collection Performance YTD
            </h2>
            <div className="flex items-center gap-6">
              <Donut pct={collection.pct} />
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2.5">
                  <span className="w-3 h-3 rounded-full bg-blue-600 shrink-0" />
                  <div>
                    <div className="text-neutral-900 text-lg font-weight-600">{fmtMoney(collection.collected)}</div>
                    <div className="text-neutral-500 text-xs">Collected</div>
                  </div>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="w-3 h-3 rounded-full bg-neutral-200 shrink-0" />
                  <div>
                    <div className="text-neutral-900 text-lg font-weight-600">{fmtMoney(collection.outstanding)}</div>
                    <div className="text-neutral-500 text-xs">Outstanding</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Storage & Recovery + Operational Insights */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="rounded-lg border border-neutral-200 p-5">
            <h2 className="text-neutral-900 text-[20px] font-weight-600 mb-4">
              Storage &amp; Recovery
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg border border-neutral-100 p-4">
                <div className="text-neutral-900 text-2xl font-weight-600">
                  {fmtMoney(storageRecovery.storage)}
                </div>
                <div className="text-neutral-500 text-xs mt-1">
                  Storage Charges
                </div>
              </div>
              <div className="rounded-lg border border-neutral-100 p-4">
                <div className="text-neutral-900 text-2xl font-weight-600">
                  {fmtMoney(storageRecovery.recovery)}
                </div>
                <div className="text-neutral-500 text-xs mt-1">
                  Recovery Charges
                </div>
              </div>
            </div>
          </div>
          <div className="rounded-lg border border-neutral-200 p-5">
            <h2 className="text-neutral-900 text-[20px] font-weight-600 mb-4">
              Operational Insights
            </h2>
            <div className="flex flex-col divide-y divide-neutral-100">
              {[
                {
                  label: "Active Claims",
                  value: fmtNum(dash?.stats?.claims_reported ?? 0),
                },
                {
                  label: "Vehicles",
                  value: fmtNum(dash?.stats?.vehicles ?? 0),
                },
                {
                  label: "Urgent Alerts",
                  value: fmtNum(dash?.stats?.urgent_alerts ?? 0),
                },
                {
                  label: "Outstanding Debtors",
                  value: fmtNum(dash?.stats?.outstanding_debtors_count ?? 0),
                },
                // { label: "Collection Rate", value: `${collection.pct}%` },
              ].map((r) => (
                <div
                  key={r.label}
                  className="flex items-center justify-between py-2.5"
                >
                  <span className="text-neutral-500 text-sm">{r.label}</span>
                  <span className="text-neutral-900 text-sm font-weight-600">
                    {r.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Fleet Operations (static mock — Fleet not yet designed) */}
        {/* <div className="rounded-lg border border-neutral-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-neutral-900 text-[20px] font-weight-600">
              Fleet Operations
            </h2>
            <span className="text-neutral-400 text-xs">45 Vehicles</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {[
              {
                reg: "BX21 ABC",
                status: "On Hire",
                tint: "bg-green-50 text-green-600",
              },
              {
                reg: "LM19 KJD",
                status: "Off Hire",
                tint: "bg-neutral-100 text-neutral-600",
              },
              {
                reg: "GT70 PLO",
                status: "Maintenance",
                tint: "bg-amber-50 text-amber-600",
              },
            ].map((v) => (
              <div
                key={v.reg}
                className="rounded-lg border border-neutral-100 p-4 flex items-center justify-between"
              >
                <span className="text-neutral-900 text-sm font-weight-600">
                  {v.reg}
                </span>
                <span
                  className={`text-[11px] px-2 py-1 rounded-full ${v.tint}`}
                >
                  {v.status}
                </span>
              </div>
            ))}
          </div>
        </div> */}
<FleetOperations/>
        {/* Plate Expiry (static mock) */}
        <div className="rounded-lg border border-neutral-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-neutral-900 text-[20px] font-weight-600">
              Plate Expiry
            </h2>
            <span className="text-neutral-400 text-xs">32 Vehicles</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {[
              {
                reg: "BX21 ABC",
                exp: "12 days",
                tint: "bg-red-50 text-red-600",
              },
              {
                reg: "LM19 KJD",
                exp: "28 days",
                tint: "bg-amber-50 text-amber-600",
              },
              {
                reg: "GT70 PLO",
                exp: "60 days",
                tint: "bg-green-50 text-green-600",
              },
            ].map((v) => (
              <div
                key={v.reg}
                className="rounded-lg border border-neutral-100 p-4 flex items-center justify-between"
              >
                <span className="text-neutral-900 text-sm font-weight-600">
                  {v.reg}
                </span>
                <span
                  className={`text-[11px] px-2 py-1 rounded-full ${v.tint}`}
                >
                  Expires in {v.exp}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {missingOpen && <MissingDocumentsSlider onClose={() => setMissingOpen(false)} />}
    </>
  );
};

export default TasksDashboard;
