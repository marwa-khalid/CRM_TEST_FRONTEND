import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Search,
  Bell,
  ChevronDown,
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
import Vector6 from "../../assets/AutoClaim_icon/Vector-6.svg";

import { listTasks, type TaskFilters } from "../../services/Tasks/Tasks";
import { useCurrentUser } from "../../context/AuthContext";
import NotificationsPanel, {
  type NotifItem,
  buildTaskNotifications,
} from "./Notifications";
import { getNotifications, markNotificationRead, markAllNotificationsRead, markAllNotificationsUnread } from "../../services/Notifications/Notifications";
import {
  getDashboard,
  getDashboardCollection,
  getDashboardIncome,
  getDashboardTrends,
  getTrendOptions,
} from "../../services/Dashboard/Dashboard";
import { CustomDatePicker } from "../Claims/Components/DatePicker";
import MissingDocumentsSlider from "./MissingDocumentsSlider";
import StorageRecoverySlider from "./StorageRecoverySlider";
import Select from "react-select";
import { customStyles, BlueDropdownIndicator } from "../Claims/Steps/GeneralDetailsForm";
import FleetOperations from "./FleetDummy";
import PlateExpiry from "./PlateExpiryDummy";

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

const COLLECTION_PAYMENT_OPTIONS = [
  { value: "paid", label: "Paid" },
  { value: "pending", label: "Pending" },
] as const;

type CollectionPaymentStatus = (typeof COLLECTION_PAYMENT_OPTIONS)[number]["value"];

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
type SeriesLabels = { current: string; previous: string };

const LineChart: React.FC<{ points: Pt[]; compare?: Pt[]; labels?: SeriesLabels }> = ({ points, compare, labels }) => {
  const [hover, setHover] = useState<number | null>(null);
  const max = niceMax(Math.max(5, ...points.map((p) => p.value), ...(compare?.map((p) => p.value) || [])));
  const STEPS = 6;
  const ticks = Array.from({ length: STEPS + 1 }, (_, i) => Math.round((max / STEPS) * i));
  const n = Math.max(1, points.length - 1);
  const X = (i: number) => (i / n) * 100;
  const Y = (v: number) => 100 - (v / max) * 100;
  const coords = points.map((p, i) => ({ x: X(i), y: Y(p.value), v: p.value, label: p.label }));
  const path = cardinalPath(coords);
  const cmpCoords = (compare || []).map((p, i) => ({ x: X(i), y: Y(p.value), v: p.value }));
  const cmpPath = compare && compare.length ? cardinalPath(cmpCoords) : "";
  const H = 224;

  return (
    <div>
      <div className="flex">
        {/* Y axis labels */}
        <div className="relative w-8 shrink-0" style={{ height: H }}>
          {ticks.map((t, i) => (
            <span key={i} className="absolute right-1.5 -translate-y-1/2 text-[10px] text-neutral-400" style={{ top: `${Y(t)}%` }}>{t}</span>
          ))}
        </div>
        {/* Plot */}
        <div className="relative flex-1" style={{ height: H }}>
          {ticks.map((t, i) => (
            <div key={i} className="absolute left-0 right-0 border-t border-dashed border-neutral-200" style={{ top: `${Y(t)}%` }} />
          ))}
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full overflow-visible">
            {cmpPath && (
              <path d={cmpPath} fill="none" stroke="#9CA3AF" strokeWidth="2" strokeDasharray="4 3" vectorEffect="non-scaling-stroke" />
            )}
            <path d={path} fill="none" stroke="#0352FD" strokeWidth="2" vectorEffect="non-scaling-stroke" />
          </svg>
          {/* comparison dots (grey) */}
          {cmpCoords.map((c, i) => (
            <div key={`c${i}`} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${c.x}%`, top: `${c.y}%` }}>
              <div className="w-2 h-2 rounded-full bg-neutral-400 border-2 border-white" />
            </div>
          ))}
          {/* current dots (blue) with tooltip */}
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
                  {compare && compare.length ? (
                    <div className="flex flex-col gap-0.5">
                      <span>{labels?.current || "Current"}: <span className="font-weight-600">{c.v}</span></span>
                      <span>{labels?.previous || "Previous"}: <span className="font-weight-600">{compare[i]?.value ?? 0}</span></span>
                    </div>
                  ) : (
                    <>{c.label}: <span className="font-weight-600">{c.v}</span></>
                  )}
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

// Legend for the two trend series (current vs comparison).
const TrendLegend: React.FC<{ labels?: SeriesLabels; prevColor: string; curColor: string }> = ({ labels, prevColor, curColor }) =>
  labels ? (
    <div className="flex items-center justify-center gap-5 mt-4 text-xs text-neutral-500">
      <span className="flex items-center gap-2">
        <span className="w-2.5 h-2.5 rounded-full" style={{ background: prevColor }} />
        {labels.previous}
      </span>
      <span className="flex items-center gap-2">
        <span className="w-2.5 h-2.5 rounded-full" style={{ background: curColor }} />
        {labels.current}
      </span>
    </div>
  ) : null;

// Compact money tick (£3k / £950).
const fmtTick = (v: number) => (v >= 1000 ? `£${(v / 1000).toFixed(v % 1000 === 0 ? 0 : 1)}k` : `£${v}`);

// Vertical bars with Y-axis, dotted gridlines + hover tooltip.
const BarChart: React.FC<{
  points: Pt[];
  compare?: Pt[];
  labels?: SeriesLabels;
  tickFormatter?: (value: number) => string;
  valueFormatter?: (value: number) => string;
}> = ({ points, compare, labels, tickFormatter = fmtTick, valueFormatter = fmtMoney }) => {
  const [hover, setHover] = useState<number | null>(null);
  const hasCompare = !!(compare && compare.length);
  const max = niceMax(Math.max(5, ...points.map((p) => p.value), ...(compare?.map((p) => p.value) || [])));
  const STEPS = 6;
  const ticks = Array.from({ length: STEPS + 1 }, (_, i) => Math.round((max / STEPS) * i));
  const Y = (v: number) => 100 - (v / max) * 100;
  const H = 224;
  return (
    <div>
      <div className="flex">
        <div className="relative w-11 shrink-0" style={{ height: H }}>
          {ticks.map((t, i) => (
            <span key={i} className="absolute right-1.5 -translate-y-1/2 text-[10px] text-neutral-400" style={{ top: `${Y(t)}%` }}>{tickFormatter(t)}</span>
          ))}
        </div>
        <div className="relative flex-1" style={{ height: H }}>
          {ticks.map((t, i) => (
            <div key={i} className="absolute left-0 right-0 border-t border-dashed border-neutral-200" style={{ top: `${Y(t)}%` }} />
          ))}
          <div className="absolute inset-0 flex items-end gap-3 px-2">
            {points.map((p, i) => (
              <div
                key={i}
                className="flex-1 h-full flex items-end justify-center gap-0.5 relative"
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
              >
                {hasCompare && (
                  <div
                    className="w-full max-w-[12px] rounded-t bg-blue-200"
                    style={{ height: `${Math.max(1, ((compare![i]?.value || 0) / max) * 100)}%` }}
                  />
                )}
                <div
                  className={`w-full ${hasCompare ? "max-w-[12px]" : "max-w-[24px]"} rounded-t bg-blue-500 hover:bg-blue-600 transition-colors`}
                  style={{ height: `${Math.max(1, (p.value / max) * 100)}%` }}
                />
                {hover === i && (
                  <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 whitespace-nowrap bg-neutral-900 text-white text-[11px] px-2 py-1 rounded shadow-lg z-10">
                    {hasCompare ? (
                      <div className="flex flex-col gap-0.5">
                        <span>{labels?.current || "Current"}: <span className="font-weight-600">{valueFormatter(p.value)}</span></span>
                        <span>{labels?.previous || "Previous"}: <span className="font-weight-600">{valueFormatter(compare![i]?.value || 0)}</span></span>
                      </div>
                    ) : (
                      <>{p.label}: <span className="font-weight-600">{valueFormatter(p.value)}</span></>
                    )}
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

// Collection donut: two arcs — Actual Collection (dark) over Billed (light).
const CollectionDonut: React.FC<{ actual: number; billed: number }> = ({ actual, billed }) => {
  const r = 52, c = 2 * Math.PI * r;
  const total = (actual || 0) + (billed || 0);
  const darkLen = total > 0 ? (actual / total) * c : 0;
  return (
    <div className="w-44 h-44 shrink-0">
      <svg viewBox="0 0 140 140" className="w-full h-full -rotate-90">
        <circle cx="70" cy="70" r={r} fill="none" stroke="#A3CFFF" strokeWidth="22" />
        <circle
          cx="70" cy="70" r={r} fill="none" stroke="#2563EB" strokeWidth="22"
          strokeDasharray={`${darkLen} ${c - darkLen}`}
        />
      </svg>
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
    // Dashboard cards are a system-wide overview (all users), not just mine.
    const params = col.key === "all"
      ? { page_size: 100, all_users: true }
      : { ...filter, page_size: 10, all_users: true };
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

// ─── trend filter dropdown (Referrer / Status) ───────────────────────────────────

const TrendFilter = ({
  label, value, options, onChange,
}: { label: string; value: string; options: string[]; onChange: (v: string) => void }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);
  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-2 h-9 px-3 rounded border text-sm ${
          value ? "border-blue-300 text-blue-600" : "border-neutral-200 text-neutral-600"
        }`}
      >
        {value || label} <ChevronDown size={14} />
      </button>
      {open && (
        <div className="absolute z-30 mt-1 right-0 min-w-[170px] max-h-60 overflow-auto bg-white rounded-lg border border-neutral-200 shadow-lg py-1">
          <button
            type="button"
            onClick={() => { onChange(""); setOpen(false); }}
            className={`w-full text-left px-3 py-2 text-sm hover:bg-neutral-50 ${
              !value ? "text-blue-600 font-weight-500" : "text-neutral-700"
            }`}
          >
            All {label}s
          </button>
          {options.map((o) => (
            <button
              key={o}
              type="button"
              onClick={() => { onChange(o); setOpen(false); }}
              className={`w-full text-left px-3 py-2 text-sm hover:bg-neutral-50 ${
                value === o ? "text-blue-600 font-weight-500" : "text-neutral-700"
              }`}
            >
              {o}
            </button>
          ))}
          {options.length === 0 && (
            <div className="px-3 py-2 text-xs text-neutral-400">No options</div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── period tabs ─────────────────────────────────────────────────────────────────

const PeriodTabs = ({ active, onChange }: { active: string; onChange: (p: string) => void }) => (
  <div className="inline-flex items-center gap-2 font-['Stack_Sans_Headline']">
    {/* WTD / MTD / YTD grouped in one outlined pill */}
    <div className="rounded outline outline-1 outline-offset-[-1px] outline-blue-200 flex items-center gap-1">
      {["WTD", "MTD", "YTD"].map((p) => (
        <button
          key={p}
          type="button"
          onClick={() => onChange(p)}
          className={`px-4 py-2 rounded text-sm leading-4 ${
            active === p ? "bg-blue-300 text-white" : "text-blue-500"
          }`}
        >
          {p}
        </button>
      ))}
    </div>
    {/* Custom as its own outlined box with a calendar icon */}
    <button
      type="button"
      onClick={() => onChange("Custom")}
      className={`px-3 py-2 rounded outline outline-1 outline-offset-[-1px] outline-blue-200 flex items-center gap-2 text-sm leading-4 ${
        active === "Custom" ? "bg-blue-300 text-white" : "text-blue-500"
      }`}
    >
      <img src={Vector6} alt="" className="w-3.5 h-3.5" />
      Custom
    </button>
  </div>
);

// Reusable From/To date range picker shown when a graph's period is "Custom".
// Self-contained: owns its open/click-outside state so each graph is independent.
const CustomRange = ({
  from, to, onFrom, onTo,
}: { from: string; to: string; onFrom: (v: string) => void; onTo: (v: string) => void }) => {
  const [open, setOpen] = useState<null | "from" | "to">(null);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(null); };
    if (open) document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);
  return (
    <div ref={ref} className="flex items-center gap-2">
      {(["from", "to"] as const).map((which) => {
        const val = which === "from" ? from : to;
        const set = which === "from" ? onFrom : onTo;
        return (
          <div key={which} className="relative">
            <div
              onClick={() => setOpen((o) => (o === which ? null : which))}
              className="h-9 px-3 rounded border border-neutral-200 text-sm text-neutral-600 flex items-center gap-2 cursor-pointer min-w-[120px] justify-between"
            >
              <span className={val ? "text-neutral-700" : "text-neutral-400"}>
                {val || (which === "from" ? "From" : "To")}
              </span>
              <CalendarIcon size={14} className="text-neutral-400" />
            </div>
            {open === which && (
              <div className="absolute top-full left-0 z-50 mt-1 shadow-xl rounded-lg bg-white">
                <CustomDatePicker
                  selectedDate={val ? new Date(val + "T00:00:00") : new Date()}
                  onDateSelect={(d: Date) => { set(toLocalISO(d)); setOpen(null); }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

// ─── main ─────────────────────────────────────────────────────────────────────

const TasksDashboard: React.FC<{ onOpen?: (f: TaskFilters) => void }> = ({ onOpen }) => {
  const { user } = useCurrentUser();
  const me = user?.name || ""; // logged-in user's name (email-before-@)
  const [dash, setDash] = useState<any>(null); // real dashboard aggregates
  const [missingOpen, setMissingOpen] = useState(false);
  const [srOpen, setSrOpen] = useState<null | "storage" | "recovery">(null);
  const [collPeriod, setCollPeriod] = useState<"MTD" | "YTD" | "All Time">("YTD");
  const [collectionPayment, setCollectionPayment] = useState<CollectionPaymentStatus | null>(null);
  const [collectionPerf, setCollectionPerf] = useState<any>(null);
  const [period, setPeriod] = useState("WTD");
  // Headline aggregates are all-time totals; the selected period is kept for the UI.
  useEffect(() => {
    getDashboard(period).then(({ data }) => setDash(data)).catch(() => setDash(null));
  }, [period]);
  useEffect(() => {
    if (!collectionPayment) {
      setCollectionPerf(null);
      return;
    }
    const apiPeriod = collPeriod === "All Time" ? "ALL" : collPeriod;
    getDashboardCollection(apiPeriod, collectionPayment)
      .then(({ data }) => setCollectionPerf(data || null))
      .catch(() => setCollectionPerf(null));
  }, [collPeriod, collectionPayment]);
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
  const [trendRef, setTrendRef] = useState("");
  const [trendStatus, setTrendStatus] = useState("");
  const [trendFrom, setTrendFrom] = useState("");
  const [trendTo, setTrendTo] = useState("");
  const [hirePeriod, setHirePeriod] = useState("YTD");
  const [hireMode, setHireMode] = useState("YoY");
  const [hireRef, setHireRef] = useState("");
  const [hireStatus, setHireStatus] = useState("");
  const [hireFrom, setHireFrom] = useState("");
  const [hireTo, setHireTo] = useState("");
  const [trendOptions, setTrendOptions] = useState<{ referrers: string[]; statuses: string[] }>({
    referrers: [],
    statuses: [],
  });

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
  const allRead = notifications.length > 0 && unreadCount === 0;
  // Double-check toggle: if everything's already read, flip all back to unread.
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
  const breakdown = incomeBreakdown || {};
  const shownCards =
    incomeType === "all" ? INCOME_CARDS : INCOME_CARDS.filter((c) => c.key === incomeType);
  // Trend series re-fetched per the chart's period filter.
  const [claimsTrend, setClaimsTrend] = useState<Pt[]>([]);
  const [claimsTrendPrev, setClaimsTrendPrev] = useState<Pt[]>([]);
  const [trendLabels, setTrendLabels] = useState<SeriesLabels>();
  const [hireTrend, setHireTrend] = useState<Pt[]>([]);
  const [hireTrendPrev, setHireTrendPrev] = useState<Pt[]>([]);
  const [hireLabels, setHireLabels] = useState<SeriesLabels>();
  useEffect(() => {
    // A Custom range only fetches once both dates are picked.
    if (trendPeriod === "Custom" && !(trendFrom && trendTo)) return;
    getDashboardTrends(trendPeriod, trendMode, trendRef, trendStatus, trendFrom, trendTo)
      .then(({ data }) => {
        setClaimsTrend(data?.claims_trend || []);
        setClaimsTrendPrev(data?.claims_trend_prev || []);
        setTrendLabels(data?.series_labels);
      }).catch(() => {});
  }, [trendPeriod, trendMode, trendRef, trendStatus, trendFrom, trendTo]);
  useEffect(() => {
    if (hirePeriod === "Custom" && !(hireFrom && hireTo)) return;
    getDashboardTrends(hirePeriod, hireMode, hireRef, hireStatus, hireFrom, hireTo)
      .then(({ data }) => {
        setHireTrend(data?.hire_trend || []);
        setHireTrendPrev(data?.hire_trend_prev || []);
        setHireLabels(data?.series_labels);
      }).catch(() => {});
  }, [hirePeriod, hireMode, hireRef, hireStatus, hireFrom, hireTo]);
  useEffect(() => {
    getTrendOptions()
      .then(({ data }) => setTrendOptions({
        referrers: Array.isArray(data?.referrers) ? data.referrers : [],
        statuses: Array.isArray(data?.statuses) ? data.statuses : [],
      }))
      .catch(() => {});
  }, []);
  const debtorsAge = dash?.debtors_age || [];
  const collection = collectionPerf || dash?.collection_ytd || {
    pct: 0, collected: 0, outstanding: 0, rate: 0, actual_collection: 0, billed: 0,
  };
  const storageRecovery = dash?.storage_recovery || {
    storage: { total: 0, count: 0 },
    recovery: { total: 0, count: 0 },
  };

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
              <div className="mt-2 h-px w-full bg-neutral-200" />
              <div className="mt-2 flex items-center gap-3">
                <span
                  className={`rounded px-2 py-1 text-sm font-weight-600 ${
                    trendUp(c)
                      ? "bg-green-100 text-green-500"
                      : "bg-red-100 text-red-500"
                  }`}
                >
                  {trendText(c).split("%")[0]}%
                </span>

                <span className="text-[14px] font-weight-500 text-neutral-500">
                  vs last month
                </span>
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
                onClick={
                  a.key === "missing_documents"
                    ? () => setMissingOpen(true)
                    : undefined
                }
                className={`flex-1 rounded-lg border ${a.tint} p-4 flex flex-col gap-2 ${
                  a.key === "missing_documents"
                    ? "cursor-pointer hover:shadow-sm"
                    : ""
                }`}
              >
                <div className="flex items-center gap-4">
                  <img src={a.Icon} alt="" />
                  <div className="flex flex-col">
                    {" "}
                    <span className="text-neutral-900 text-[24px] font-weight-600">
                      {attnValue(a)}
                    </span>
                    <span className="text-neutral-700 text-[14px] font-weight-500">
                      {a.label}
                    </span>
                  </div>
                </div>
                <div className="my-2 h-px w-full bg-neutral-200" />
                <p className="text-neutral-500 text-[14px]">{a.note}</p>
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
                        onClick={() =>
                          setCalOpen((o) => (o === which ? null : which))
                        }
                        className="h-9 px-3 rounded border border-neutral-200 text-sm text-neutral-600 flex items-center gap-2 cursor-pointer min-w-[120px] justify-between"
                      >
                        <span
                          className={
                            val ? "text-neutral-700" : "text-neutral-400"
                          }
                        >
                          {val || (which === "from" ? "From" : "To")}
                        </span>
                        <CalendarIcon size={14} className="text-neutral-400" />
                      </div>
                      {calOpen === which && (
                        <div className="absolute top-full left-0 z-50 mt-1 shadow-xl rounded-lg bg-white">
                          <CustomDatePicker
                            selectedDate={
                              val ? new Date(val + "T00:00:00") : new Date()
                            }
                            onDateSelect={(d: Date) => {
                              set(toLocalISO(d));
                              setCalOpen(null);
                            }}
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
                components={{
                  DropdownIndicator: BlueDropdownIndicator,
                  IndicatorSeparator: () => null,
                }}
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
                  style={{
                    flexGrow: Math.max(val, 1),
                    flexBasis: 0,
                    minWidth: 110,
                  }}
                  className="flex flex-col gap-2 pr-4"
                >
                  <div className="text-neutral-900 text-xl font-weight-600 whitespace-nowrap">
                    {fmtMoney(val)}
                  </div>
                  <div className="text-neutral-500 text-xs whitespace-nowrap">
                    {c.label}
                  </div>
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
                  style={{
                    flexGrow: Math.max(val, 1),
                    flexBasis: 0,
                    minWidth: 110,
                    background: c.color,
                  }}
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
            {trendPeriod === "Custom" && (
              <CustomRange from={trendFrom} to={trendTo} onFrom={setTrendFrom} onTo={setTrendTo} />
            )}
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
            <TrendFilter label="Referrer" value={trendRef} options={trendOptions.referrers} onChange={setTrendRef} />
            <TrendFilter label="Status" value={trendStatus} options={trendOptions.statuses} onChange={setTrendStatus} />
          </div>
          <LineChart points={claimsTrend} compare={claimsTrendPrev} labels={trendLabels} />
          <TrendLegend labels={trendLabels} prevColor="#9CA3AF" curColor="#0352FD" />
        </div>

        {/* Hire Trend */}
        <div className="rounded-lg border border-neutral-200 p-5">
          <h2 className="text-neutral-900 text-[20px] font-weight-600 mb-4">
            Hire Trend
          </h2>
          <div className="flex items-center flex-wrap gap-3 mb-6">
            <PeriodTabs active={hirePeriod} onChange={setHirePeriod} />
            {hirePeriod === "Custom" && (
              <CustomRange from={hireFrom} to={hireTo} onFrom={setHireFrom} onTo={setHireTo} />
            )}
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
            <TrendFilter label="Referrer" value={hireRef} options={trendOptions.referrers} onChange={setHireRef} />
            <TrendFilter label="Status" value={hireStatus} options={trendOptions.statuses} onChange={setHireStatus} />
          </div>
          <BarChart
            points={hireTrend}
            compare={hireTrendPrev}
            labels={hireLabels}
            tickFormatter={fmtNum}
            valueFormatter={(value) => `${fmtNum(value)} vehicle${value === 1 ? "" : "s"}`}
          />
          <TrendLegend labels={hireLabels} prevColor="#BFDBFE" curColor="#0352FD" />
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
                  dash?.debtors_total ??
                    debtorsAge.reduce((s: number, r: any) => s + (Number(r.amount) || 0), 0),
                )}
              </span>
            </div>
            <HBars rows={debtorsAge} />
          </div>
          <div className="rounded-lg border border-neutral-200 px-4 py-6 flex flex-col gap-10">
            <div className="flex flex-col gap-5">
              <h2 className="text-black text-xl font-weight-600 leading-5">
                Collection Performance {collPeriod}
              </h2>
              <div className="flex items-center gap-5">
                <div className="rounded outline outline-1 outline-blue-200 flex items-center gap-1">
                  {(["MTD", "YTD", "All Time"] as const).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setCollPeriod(p)}
                      className={`px-4 py-2 rounded text-sm leading-4 ${
                        collPeriod === p ? "bg-blue-300 text-white" : "text-blue-500"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
                <div className="w-32">
                  <Select
                    options={COLLECTION_PAYMENT_OPTIONS}
                    value={COLLECTION_PAYMENT_OPTIONS.find((o) => o.value === collectionPayment) || null}
                    onChange={(o: any) => setCollectionPayment(o?.value || null)}
                    styles={customStyles}
                    components={{
                      DropdownIndicator: BlueDropdownIndicator,
                      IndicatorSeparator: () => null,
                    }}
                    isSearchable={false}
                    placeholder="Payment"
                  />
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between gap-8">
              <div className="flex flex-col gap-5">
                <div className="flex flex-col gap-1">
                  <div className="text-black text-2xl font-weight-600 leading-6">
                    {collection.rate ?? 0}%
                  </div>
                  <div className="text-neutral-500 text-sm font-weight-500">Collection rate</div>
                </div>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-5">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full shrink-0" style={{ background: "#2563EB" }} />
                      <span className="text-black text-sm font-weight-600 w-36">Agreed Amount</span>
                    </div>
                    <span className="text-black text-sm font-weight-600">
                      {fmtMoney(collection.actual_collection)}
                    </span>
                  </div>
                  <div className="flex items-center gap-5">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full shrink-0" style={{ background: "#A3CFFF" }} />
                      <span className="text-black text-sm font-weight-600 w-36">Actual Amount</span>
                    </div>
                    <span className="text-black text-sm font-weight-600">
                      {fmtMoney(collection.billed)}
                    </span>
                  </div>
                </div>
              </div>
              <CollectionDonut
                actual={collection.actual_collection || 0}
                billed={collection.billed || 0}
              />
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
        <FleetOperations />
        {/* Plate Expiry (static mock) */}
        {/* <div className="rounded-lg border border-neutral-200 p-5">
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
        </div> */}
        <PlateExpiry />
        {/* Storage & Recovery + Operational Insights */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="rounded-lg border border-neutral-200 px-4 py-6 flex flex-col gap-6">
            <h2 className="text-black text-xl font-weight-600 leading-5">
              Storage &amp; Recovery
            </h2>
            <div className="flex flex-col gap-1">
              {[
                {
                  type: "storage" as const,
                  label: "Standard Storage",
                  data: storageRecovery.storage,
                },
                {
                  type: "recovery" as const,
                  label: "Recovery Active",
                  data: storageRecovery.recovery,
                },
              ].map((row, i) => (
                <React.Fragment key={row.type}>
                  {i > 0 && <div className="h-px bg-neutral-100 w-full" />}
                  <div className="p-3 rounded-lg flex flex-col gap-2">
                    <div className="flex justify-between items-start">
                      <div className="flex flex-col gap-1">
                        <div className="text-neutral-700 text-sm">
                          {row.label}
                        </div>
                        <div className="text-neutral-700 text-xs">
                          {row.data.count} Vehicles
                        </div>
                      </div>
                      <div className="text-black text-2xl font-weight-600 leading-6">
                        {fmtMoney(row.data.total)}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSrOpen(row.type)}
                      className="h-8 px-3 py-2 bg-blue-100 rounded inline-flex justify-center items-center text-blue-600 text-sm leading-4 self-start"
                    >
                      View All
                    </button>
                  </div>
                </React.Fragment>
              ))}
            </div>
          </div>
          <div className="rounded-lg border border-neutral-200 px-4 py-6 flex flex-col gap-6">
            <h2 className="text-black text-xl font-weight-600 leading-5">
              Operational Insights
            </h2>
            <div className="flex flex-col gap-3">
              {[
                {
                  label: "New Claims",
                  value: fmtNum(dash?.stats?.claims_reported ?? 0),
                },
                {
                  label: "Approved Claims",
                  value: fmtNum(dash?.stats?.approved_claims ?? 0),
                },
                {
                  label: "Vehicle Hires",
                  value: fmtNum(dash?.stats?.vehicles ?? 0),
                },
                {
                  label: "Avg Resolution Time",
                  value: `${fmtNum(dash?.stats?.avg_resolution_days ?? 0)} Days`,
                },
              ].map((r, i) => (
                <React.Fragment key={r.label}>
                  {i > 0 && <div className="h-px bg-neutral-100 w-full" />}
                  <div className="py-1 flex justify-between items-start">
                    <span className="text-neutral-700 text-sm">{r.label}</span>
                    <span className="text-black text-2xl font-weight-600 leading-6">
                      {r.value}
                    </span>
                  </div>
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </section>

      {missingOpen && (
        <MissingDocumentsSlider onClose={() => setMissingOpen(false)} />
      )}
      {srOpen && (
        <StorageRecoverySlider type={srOpen} onClose={() => setSrOpen(null)} />
      )}
    </>
  );
};

export default TasksDashboard;
