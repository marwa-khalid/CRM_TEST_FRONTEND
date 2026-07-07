import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Search,
  Bell,
  ChevronDown,
  Calendar as CalendarIcon,
  LayoutGrid,
  Minimize2,
  X,
} from "lucide-react";
import { SpinnerLoader } from "../../components/common/SpinnerLoader";
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
// 2-decimal money (e.g. £2,132.78) — used where the exact pennies matter.
const fmtMoney2 = (n: any) =>
  "£" + (Number(n) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
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
    key: "outstanding_debtors_billed",
    label: "Outstanding Debtors",
    money: true,
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

type Pt = { label: string; value: number; range?: string };

const niceMax = (max: number) => {
  if (max <= 0) return 1;
  const pow = Math.pow(10, Math.floor(Math.log10(max)));
  return Math.ceil(max / pow) * pow || 1;
};

// Evenly-spaced Y-axis ticks (equal intervals, no rounding gaps like 0,1,3,4,5).
// integer=true → counts: the smallest whole-number step that fits, so a max of 9
// tops out at 12 (step 3), not 20. integer=false → money: a "nice" 1/2/2.5/5×10ⁿ
// step so ticks read as round currency values.
const niceAxis = (rawMax: number, steps = 4, integer = false) => {
  const safe = Math.max(integer ? 1 : 1e-6, rawMax);
  let step: number;
  if (integer) {
    step = Math.max(1, Math.ceil(safe / steps)); // tight equal integer intervals
  } else {
    const rough = safe / steps;
    const pow = Math.pow(10, Math.floor(Math.log10(rough)));
    const frac = rough / pow;
    step = (frac <= 1 ? 1 : frac <= 2 ? 2 : frac <= 2.5 ? 2.5 : frac <= 5 ? 5 : 10) * pow;
  }
  const max = step * steps;
  const ticks = Array.from({ length: steps + 1 }, (_, i) => (integer ? Math.round(step * i) : step * i));
  return { max, ticks };
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
  const { max, ticks } = niceAxis(Math.max(5, ...points.map((p) => p.value), ...(compare?.map((p) => p.value) || [])), 6);
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
            <span key={i} className="absolute -translate-x-1/2 whitespace-nowrap text-[11px] text-neutral-400" style={{ left: `${c.x}%` }}>{c.label}</span>
          ))}
        </div>
      </div>
    </div>
  );
};

// % change of current vs previous, shown only in comparison tooltips
// (e.g. "+12.4% from last year"). Green when up, red when down.
const PctBadge: React.FC<{ cur: number; prev: number; label?: string }> = ({ cur, prev, label }) => {
  // Normalise by the larger of the two so the figure is bounded to ±100%:
  // 0→9 = 100%, 4→9 = 55.6%, 9→4 = -55.6%. (Plain (cur-prev)/prev gives 125%.)
  const denom = Math.max(prev, cur);
  const pct = denom > 0 ? Math.round(((cur - prev) / denom) * 1000) / 10 : 0;
  const up = cur >= prev;
  return (
    <span className="flex items-center gap-1.5 mt-0.5">
      <span className={`flex items-center gap-1 shrink-0 whitespace-nowrap text-[11px] font-weight-700 px-1.5 py-0.5 rounded ${up ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"}`}>
        {/* Arrow (matches the KPI cards) instead of a +/- sign. */}
        <img src={up ? TrendingUp : TrendingDown} alt="" className="w-3 h-3 shrink-0" />
        {Math.abs(pct)}%
      </span>
      {label && <span className="text-neutral-400 whitespace-nowrap">{label}</span>}
    </span>
  );
};

// WTD covers the working week (Mon–Fri). Small DD-MM-YY caption shown under the
// chart, e.g. "23-06-26 to 27-06-26".
const wtdRangeLabel = (): string => {
  const fmt = (d: Date) =>
    `${String(d.getDate()).padStart(2, "0")}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getFullYear()).slice(-2)}`;
  const now = new Date();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7)); // back to Monday
  const friday = new Date(monday);
  friday.setDate(monday.getDate() + 4);
  return `${fmt(monday)} to ${fmt(friday)}`;
};

// "Total number" pill (soft blue) — shows the count + unit (e.g. "7 claims" /
// "9 Hires"), sitting at the right of the trend filters row.
const TrendTotalCard: React.FC<{ value: number; unit: string }> = ({ value, unit }) => (
  <div className="flex items-center gap-1.5 bg-blue-50 rounded-full px-3.5 py-1.5 shrink-0">
    <span className="text-blue-500 text-2xl font-weight-700 leading-none">{fmtNum(value)}</span>
    <span className="text-blue-300 text-[11px] font-weight-600 leading-none">{unit}</span>
  </div>
);

// Prettier line chart used ONLY for the Claims Trend: gradient area fill under a
// smooth line, hollow markers, and a clean white tooltip (instead of black).
const ClaimsTrendChart: React.FC<{ points: Pt[]; compare?: Pt[]; labels?: SeriesLabels; comparisonLabel?: string }> = ({ points, compare, labels, comparisonLabel }) => {
  const [hover, setHover] = useState<number | null>(null);
  // Which series' dot is hovered, so only one tooltip (at that dot) shows.
  const [hoverPrev, setHoverPrev] = useState(false);
  const { max, ticks } = niceAxis(Math.max(0, ...points.map((p) => p.value), ...(compare?.map((p) => p.value) || [])), 4, true);
  const n = Math.max(1, points.length - 1);
  const X = (i: number) => (i / n) * 100;
  const Y = (v: number) => 100 - (v / max) * 100;
  const coords = points.map((p, i) => ({ x: X(i), y: Y(p.value), v: p.value, label: p.label, range: p.range }));
  const path = cardinalPath(coords);
  const areaPath = coords.length
    ? `${path} L ${coords[coords.length - 1].x},100 L ${coords[0].x},100 Z`
    : "";
  const cmpCoords = (compare || []).map((p, i) => ({ x: X(i), y: Y(p.value), v: p.value }));
  const cmpPath = compare && compare.length ? cardinalPath(cmpCoords) : "";
  const H = 240;

  return (
    <div>
      <div className="flex">
        <div className="relative w-8 shrink-0" style={{ height: H }}>
          {ticks.map((t, i) => (
            <span key={i} className="absolute right-1.5 -translate-y-1/2 text-[10px] text-neutral-400" style={{ top: `${Y(t)}%` }}>{t}</span>
          ))}
        </div>
        <div className="relative flex-1" style={{ height: H }}>
          {ticks.map((t, i) => (
            <div key={i} className="absolute left-0 right-0 border-t border-neutral-100" style={{ top: `${Y(t)}%` }} />
          ))}
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full overflow-visible">
            <defs>
              <linearGradient id="claimsTrendFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0352FD" stopOpacity="0.18" />
                <stop offset="100%" stopColor="#0352FD" stopOpacity="0" />
              </linearGradient>
            </defs>
            {/* Area shade only for the single-series view; comparison shows clean lines (no shade). */}
            {!(compare && compare.length) && areaPath && <path d={areaPath} fill="url(#claimsTrendFill)" stroke="none" />}
            {cmpPath && (
              <path d={cmpPath} fill="none" stroke="#a2cfff" strokeWidth="2.5" strokeDasharray="5 3" vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" />
            )}
            <path d={path} fill="none" stroke="#0352FD" strokeWidth="2.5" vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {cmpCoords.map((c, i) => (
            <div
              key={`c${i}`}
              className="absolute -translate-x-1/2 -translate-y-1/2 z-10"
              style={{ left: `${c.x}%`, top: `${c.y}%` }}
              onMouseEnter={() => { setHover(i); setHoverPrev(true); }}
              onMouseLeave={() => setHover(null)}
            >
              <div className="w-2.5 h-2.5 rounded-full bg-blue-200 border-2 border-white cursor-pointer transition-transform hover:scale-125" />
              {hover === i && hoverPrev && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 whitespace-nowrap bg-white text-neutral-700 text-[11px] px-3 py-2 rounded-lg shadow-xl border border-neutral-100 z-20">
                  <div className="flex flex-col gap-1">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-blue-500" />
                      <span className="text-neutral-500">{coords[i]?.range || coords[i]?.label}:</span>
                      <span className="font-weight-600 text-neutral-900">{coords[i]?.v ?? 0} claim{(coords[i]?.v ?? 0) === 1 ? "" : "s"}</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-blue-200" />
                      <span className="text-neutral-500">{compare?.[i]?.range || labels?.previous || "Previous"}:</span>
                      <span className="font-weight-600 text-neutral-900">{c.v} claim{c.v === 1 ? "" : "s"}</span>
                    </span>
                    <PctBadge cur={coords[i]?.v ?? 0} prev={c.v} label={comparisonLabel} />
                  </div>
                </div>
              )}
            </div>
          ))}
          {coords.map((c, i) => (
            <div
              key={i}
              className="absolute -translate-x-1/2 -translate-y-1/2 z-10"
              style={{ left: `${c.x}%`, top: `${c.y}%` }}
              onMouseEnter={() => { setHover(i); setHoverPrev(false); }}
              onMouseLeave={() => setHover(null)}
            >
              <div className="w-3 h-3 rounded-full bg-blue-500 border-2 border-white shadow cursor-pointer transition-transform hover:scale-125" />
              {hover === i && !hoverPrev && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 whitespace-nowrap bg-white text-neutral-700 text-[11px] px-3 py-2 rounded-lg shadow-xl border border-neutral-100 z-20">
                  {compare && compare.length ? (
                    <div className="flex flex-col gap-1">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-blue-500" />
                        <span className="text-neutral-500">{c.range || c.label}:</span>
                        <span className="font-weight-600 text-neutral-900">{c.v} claim{c.v === 1 ? "" : "s"}</span>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-blue-200" />
                        <span className="text-neutral-500">{compare[i]?.range || labels?.previous || "Previous"}:</span>
                        <span className="font-weight-600 text-neutral-900">{compare[i]?.value ?? 0} claim{(compare[i]?.value ?? 0) === 1 ? "" : "s"}</span>
                      </span>
                      <PctBadge cur={c.v} prev={compare[i]?.value ?? 0} label={comparisonLabel} />
                    </div>
                  ) : (
                    <span className="font-weight-600 text-neutral-900">{c.v} claim{c.v === 1 ? "" : "s"}</span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      <div className="flex mt-2">
        <div className="w-8 shrink-0" />
        <div className="relative flex-1 h-4">
          {coords.map((c, i) => (
            <span key={i} className="absolute -translate-x-1/2 whitespace-nowrap text-[11px] text-neutral-400" style={{ left: `${c.x}%` }}>{c.label}</span>
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

// Two-total "overall" comparison (YoY/MoM summary): two KPI tiles instead of a
// sparse 2-point chart. points = [baseline, current]; unit e.g. "claims".
const KpiCompare: React.FC<{ points: Pt[]; unit: string }> = ({ points, unit }) => {
  if (!points || points.length < 2) return null;
  const [a, b] = points;
  // Normalise by the larger value so the change is bounded to ±100%.
  const denom = Math.max(a.value, b.value);
  const delta = denom > 0 ? Math.round(((b.value - a.value) / denom) * 100) : 0;
  const up = b.value >= a.value;
  return (
    <div className="flex gap-4 py-8 font-['Stack_Sans_Headline']">
      <div className="flex-1 rounded-xl border border-neutral-200 p-6">
        <div className="text-neutral-500 text-sm font-weight-600 mb-4">{a.label}</div>
        <div className="text-neutral-800 text-[44px] font-weight-700 leading-none">{a.value}</div>
        <div className="text-neutral-400 text-sm mt-3">total {unit}</div>
      </div>
      <div className="flex-1 rounded-xl border-2 border-blue-200 bg-blue-50/50 p-6">
        <div className="flex items-center justify-between mb-4">
          <span className="text-blue-600 text-sm font-weight-600">{b.label}</span>
          <span className={`flex items-center gap-1 text-xs font-weight-600 px-2 py-0.5 rounded-full ${up ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"}`}>
            {/* Same trending arrow as the KPI cards. */}
            <img src={up ? TrendingUp : TrendingDown} alt="" className="w-3 h-3" />
            {Math.abs(delta)}%
          </span>
        </div>
        <div className="text-blue-600 text-[44px] font-weight-700 leading-none">{b.value}</div>
        <div className="text-neutral-400 text-sm mt-3">total {unit} &nbsp;·&nbsp; vs {a.value} in {a.label}</div>
      </div>
    </div>
  );
};

// Compact money tick (£3k / £950).
const fmtTick = (v: number) => (v >= 1000 ? `£${(v / 1000).toFixed(v % 1000 === 0 ? 0 : 1)}k` : `£${v}`);

// Vertical bars with Y-axis, dotted gridlines + hover tooltip.
const BarChart: React.FC<{
  points: Pt[];
  compare?: Pt[];
  labels?: SeriesLabels;
  tickFormatter?: (value: number) => string;
  valueFormatter?: (value: number) => string;
  // Per-bar colors for a single-series chart (e.g. the 2-point summary so the
  // two blocks read as distinct periods rather than one flat colour).
  barColors?: string[];
  comparisonLabel?: string;
}> = ({ points, compare, labels, tickFormatter = fmtTick, valueFormatter = fmtMoney, barColors, comparisonLabel }) => {
  const [hover, setHover] = useState<number | null>(null);
  const hasCompare = !!(compare && compare.length);
  // Bar width scales with how many bars there are so a 2-point summary or a
  // 4-quarter view reads as solid bars instead of thin lines lost in whitespace.
  const n = Math.max(1, points.length);
  const barW = n <= 2 ? 96 : n <= 4 ? 64 : n <= 7 ? 36 : 24;
  const cmpW = Math.round(barW * 0.5);
  const { max, ticks } = niceAxis(Math.max(0, ...points.map((p) => p.value), ...(compare?.map((p) => p.value) || [])), 4, true);
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
          <div className={`absolute inset-0 flex items-end px-2 ${n <= 2 ? "justify-center gap-8" : "gap-3"}`}>
            {points.map((p, i) => (
              <div
                key={i}
                className={`${n <= 2 ? "flex-none" : "flex-1"} h-full flex items-end justify-center relative`}
                style={n <= 2 ? { width: barW } : undefined}
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
              >
                {/* Tight pair: the current + comparison bars sit right next to each other. */}
                <div className="h-full flex items-end gap-0.5">
                  {hasCompare && (
                    <div
                      className="rounded-t bg-blue-200"
                      style={{ width: cmpW, height: `${Math.max(1, ((compare![i]?.value || 0) / max) * 100)}%` }}
                    />
                  )}
                  <div
                    className={`rounded-t transition-colors ${!hasCompare && barColors?.[i] ? "" : "bg-blue-500 hover:bg-blue-600"}`}
                    style={{
                      width: hasCompare ? cmpW : barW,
                      height: `${Math.max(1, (p.value / max) * 100)}%`,
                      background: !hasCompare && barColors?.[i] ? barColors[i] : undefined,
                    }}
                  />
                </div>
                {hover === i && (
                  <div
                    className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap bg-white text-neutral-700 text-[11px] px-3 py-2 rounded-lg shadow-xl border border-neutral-100 z-20"
                    style={{
                      // Sit just above the top of the (taller) bar, not the top of the column.
                      bottom: `calc(${Math.max(
                        (p.value / max) * 100,
                        hasCompare ? ((compare![i]?.value || 0) / max) * 100 : 0,
                      )}% + 8px)`,
                    }}
                  >
                    {hasCompare ? (
                      <div className="flex flex-col gap-1">
                        <span className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-blue-500" />
                          <span className="text-neutral-500">{p.range || p.label}:</span>
                          <span className="font-weight-600 text-neutral-900">{valueFormatter(p.value)}</span>
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-blue-200" />
                          <span className="text-neutral-500">{compare![i]?.range || labels?.previous || "Previous"}:</span>
                          <span className="font-weight-600 text-neutral-900">{valueFormatter(compare![i]?.value || 0)}</span>
                        </span>
                        <PctBadge cur={p.value} prev={compare![i]?.value || 0} label={comparisonLabel} />
                      </div>
                    ) : (
                      <span className="font-weight-600 text-neutral-900">{valueFormatter(p.value)}</span>
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
        <div className={`flex-1 flex px-2 text-[11px] text-neutral-400 ${n <= 2 ? "justify-center gap-8" : "gap-3"}`}>
          {points.map((p, i) => (
            <span key={i} className={`${n <= 2 ? "flex-none" : "flex-1"} text-center`} style={n <= 2 ? { width: barW } : undefined}>{p.label}</span>
          ))}
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

// Collection donut: two arcs — Agreed/Collected (dark) over Billed (light).
// Hovering a segment dims the other and shows its label + value in the centre.
const CollectionDonut: React.FC<{
  actual: number; billed: number;
  actualLabel?: string; billedLabel?: string; fmt?: (n: number) => string;
}> = ({ actual, billed, actualLabel = "Agreed Amount", billedLabel = "Actual Amount", fmt = (n) => String(n) }) => {
  const r = 52, c = 2 * Math.PI * r;
  const total = (actual || 0) + (billed || 0);
  const darkLen = total > 0 ? (actual / total) * c : 0;
  const [hover, setHover] = useState<null | "actual" | "billed">(null);
  return (
    <div className="relative w-44 h-44 shrink-0">
      <svg viewBox="0 0 140 140" className="w-full h-full -rotate-90">
        <circle
          cx="70" cy="70" r={r} fill="none" stroke="#A3CFFF" strokeWidth="22"
          className="cursor-pointer transition-opacity"
          style={{ opacity: !hover || hover === "billed" ? 1 : 0.5 }}
          onMouseEnter={() => setHover("billed")} onMouseLeave={() => setHover(null)}
        />
        <circle
          cx="70" cy="70" r={r} fill="none" stroke="#2563EB" strokeWidth="22"
          strokeDasharray={`${darkLen} ${c - darkLen}`}
          className="cursor-pointer transition-opacity"
          style={{ opacity: !hover || hover === "actual" ? 1 : 0.5 }}
          onMouseEnter={() => setHover("actual")} onMouseLeave={() => setHover(null)}
        />
      </svg>
      {/* Centre shows the Agreed amount by default; hovering the light arc shows
          the other (billed/actual) value instead. */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
        <span className="text-[11px] text-neutral-500">{hover === "billed" ? billedLabel : actualLabel}</span>
        <span className="text-[15px] font-weight-700 text-neutral-900">{fmt(hover === "billed" ? billed : actual)}</span>
      </div>
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
  // All Tasks: count = every active task (In Progress + Overdue + Pending +
  // Awaiting Response — excludes Completed/Rejected); list shows In-Progress tasks.
  { key: "all", label: "All Tasks", Icon: AllTasks, iconBg: "bg-blue-100",  cardBorder: "border-blue-200", filter: {} },
  { key: "overdue", label: "Overdue Tasks", Icon: Overdue, iconBg: "bg-red-100", cardBorder: "border-red-200", filter: { status: "Overdue" } },
  // Exclude overdue so a past-due task only shows under Overdue, not here too.
  { key: "awaiting", label: "Awaiting Response", Icon: Critical, iconBg: "bg-yellow-100", cardBorder: "border-amber-200", filter: { status: "Awaiting Response", exclude_overdue: true } },
  { key: "followups", label: "Pending Followups", Icon: PendingFollowups, iconBg: "bg-neutral-100",cardBorder: "border-neutral-300", filter: { status: "Pending", exclude_overdue: true } },
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
    // Dashboard task cards are user-specific (only the logged-in user's tasks),
    // same scoping as the Task Management list.
    if (col.key === "all") {
      // List the In-Progress (not overdue) tasks; count every active task — the
      // OR of the four statuses returns distinct rows, so it's the true sum of
      // In Progress + Overdue + Pending + Awaiting Response (no Completed/Rejected).
      Promise.all([
        listTasks({ status: "In Progress", page_size: 100 }),
        listTasks({ status: "In Progress,Pending,Awaiting Response,Overdue", page_size: 1 }),
      ])
        .then(([listRes, countRes]) => {
          setItems((listRes.data?.items ?? []).filter((t: any) => !t.is_overdue));
          setCount(countRes.data?.total ?? 0);
        })
        .catch(() => { setItems([]); setCount(0); })
        .finally(() => setLoading(false));
    } else {
      listTasks({ ...filter, page_size: 10 })
        .then(({ data }) => { setItems(data?.items ?? []); setCount(data?.total ?? 0); })
        .catch(() => { setItems([]); setCount(0); })
        .finally(() => setLoading(false));
    }
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
  label, value, options, onChange, allLabel,
}: { label: string; value: string; options: string[]; onChange: (v: string) => void; allLabel?: string }) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);
  // Reset the search box each time the dropdown closes.
  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  // Alphabetical order, then filter by the search box.
  const sorted = [...options].sort((a, b) =>
    String(a).localeCompare(String(b), undefined, { sensitivity: "base" }),
  );
  const filtered = query.trim()
    ? sorted.filter((o) => o.toLowerCase().includes(query.trim().toLowerCase()))
    : sorted;
  // Only bother with a search box once the list is long enough to warrant it.
  const showSearch = options.length > 6;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-2 p-2 rounded text-sm leading-4 text-blue-500 font-['Stack_Sans_Headline'] ${
          value ? "font-weight-600" : ""
        }`}
      >
        {value || label}
        <ChevronDown size={14} className={`text-blue-500 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute z-30 mt-1 right-0 min-w-[170px] max-h-60 overflow-auto bg-white rounded-lg border border-neutral-200 shadow-lg py-1">
          {showSearch && (
            <div className="px-2 pt-1 pb-2 sticky top-0 bg-white">
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={`Search ${label.toLowerCase()}…`}
                className="w-full px-2 py-1.5 text-sm rounded border border-neutral-200 outline-none focus:border-blue-400 text-neutral-700 placeholder:text-neutral-400"
              />
            </div>
          )}
          <button
            type="button"
            onClick={() => { onChange(""); setOpen(false); }}
            className={`w-full text-left px-3 py-2 text-sm hover:bg-neutral-50 ${
              !value ? "text-blue-600 font-weight-500" : "text-neutral-700"
            }`}
          >
            {allLabel || `All ${label}`}
          </button>
          {filtered.map((o) => (
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
          {filtered.length === 0 && (
            <div className="px-3 py-2 text-xs text-neutral-400">
              {options.length === 0 ? "No options" : "No matches"}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── period tabs ─────────────────────────────────────────────────────────────────

const PeriodTabs = ({ active, onChange, hideCustom = false }: { active: string; onChange: (p: string) => void; hideCustom?: boolean }) => (
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
    {!hideCustom && (
      <button
        type="button"
        onClick={() => onChange("Custom")}
        className={`px-3 py-2 rounded outline outline-1 outline-offset-[-1px] outline-blue-200 flex items-center gap-2 text-sm leading-4 ${
          active === "Custom" ? "bg-blue-300 text-white" : "text-blue-500"
        }`}
      >
        <img
          src={Vector6}
          alt=""
          className="w-3.5 h-3.5"
          // Invert to white when the button is active (blue bg) so the icon stays visible.
          style={active === "Custom" ? { filter: "brightness(0) invert(1)" } : undefined}
        />
        Custom
      </button>
    )}
  </div>
);

const InlineDashboardLoader = () => (
  <div className="absolute inset-0 z-20 rounded-lg bg-white/75 flex items-center justify-center font-['Stack_Sans_Headline']">
    <div className="flex flex-col items-center gap-3 rounded-lg bg-white/90 px-5 py-4 shadow-sm border border-neutral-100">
      <div className="relative w-[48px] h-[48px]">
        {Array.from({ length: 12 }).map((_, index) => (
          <span
            key={index}
            className="absolute left-1/2 top-1/2 w-[4px] h-[11px] rounded-full bg-[#9b9b9b] animate-loaderFade"
            style={{
              transform: `translate(-50%, -50%) rotate(${index * 30}deg) translateY(-17px)`,
              animationDelay: `${index * 0.08}s`,
            }}
          />
        ))}
      </div>
      <span className="text-neutral-500 text-sm">Loading dashboard stats...</span>
    </div>
  </div>
);

// Custom comparison picker (Claims + Hire trend only): compare two years
// month-by-month, or two months week-by-week. "A vs B" — A is the baseline (grey),
// B is the current (blue) series.
const PICKER_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// White-block grid picker (like the reference). mode="year" → a grid of years.
// mode="month" → months grid with a clickable year header; clicking the year
// shows a year grid, picking a year returns to the months grid (→ "May 2024").
const GridPicker = ({ mode, value, onPick }: {
  mode: "year" | "month"; value: string; onPick: (v: string) => void;
}) => {
  const now = new Date();
  const parsedYear = (() => { const y = parseInt((value || "").slice(0, 4)); return Number.isFinite(y) && y > 1970 ? y : now.getFullYear(); })();
  const parsedMonth = mode === "month" ? parseInt((value || "").split("-")[1] || "0") : 0;
  const [view, setView] = useState<"year" | "month">(mode === "year" ? "year" : "month");
  const [year, setYear] = useState(parsedYear);
  // The year grid ends at the current year (no future years padded in).
  const _maxY = now.getFullYear();
  const [windowEnd, setWindowEnd] = useState(
    parsedYear >= _maxY - 11 && parsedYear <= _maxY ? _maxY : Math.min(parsedYear, _maxY),
  );

  const cell = "h-10 rounded-md text-sm flex items-center justify-center cursor-pointer transition-colors";
  const idle = "bg-white hover:bg-blue-50 text-neutral-700";
  const sel = "bg-blue-600 text-white";
  const disabledCls = "text-neutral-300 cursor-not-allowed";
  const wrap = "w-[252px] bg-white rounded-lg border border-neutral-200 shadow-xl p-3 font-['Stack_Sans_Headline']";
  // No future periods — cap at the current year / month.
  const maxYear = now.getFullYear();
  const maxMonth = now.getMonth() + 1;
  const navCls = (disabled: boolean) => `px-2 ${disabled ? disabledCls : "text-neutral-500 hover:text-blue-600"}`;

  if (view === "year") {
    const years = Array.from({ length: 12 }, (_, i) => windowEnd - 11 + i);
    return (
      <div className={wrap}>
        <div className="flex items-center justify-between px-1 mb-2">
          <button type="button" onClick={() => setWindowEnd((w) => w - 12)} className={navCls(false)}>‹</button>
          <span className="text-sm font-weight-600 text-neutral-800">{windowEnd - 11} – {windowEnd}</span>
          <button type="button" disabled={windowEnd >= maxYear} onClick={() => setWindowEnd((w) => Math.min(maxYear, w + 12))} className={navCls(windowEnd >= maxYear)}>›</button>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {years.map((y) => {
            const disabled = y > maxYear;
            const isSel = y === (mode === "year" ? parsedYear : year);
            return (
              <button key={y} type="button" disabled={disabled}
                className={`${cell} ${disabled ? disabledCls : isSel ? sel : idle}`}
                onClick={() => { if (disabled) return; setYear(y); if (mode === "year") onPick(String(y)); else setView("month"); }}>
                {y}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className={wrap}>
      <div className="flex items-center justify-between px-1 mb-2">
        <button type="button" onClick={() => setYear((y) => y - 1)} className={navCls(false)}>‹</button>
        <button type="button" onClick={() => { setWindowEnd(year >= maxYear - 11 && year <= maxYear ? maxYear : Math.min(year, maxYear)); setView("year"); }} className="text-sm font-weight-600 text-neutral-800 hover:text-blue-600">{year}</button>
        <button type="button" disabled={year >= maxYear} onClick={() => setYear((y) => Math.min(maxYear, y + 1))} className={navCls(year >= maxYear)}>›</button>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {PICKER_MONTHS.map((m, idx) => {
          const disabled = year > maxYear || (year === maxYear && (idx + 1) > maxMonth);
          const isSel = (idx + 1) === parsedMonth && year === parsedYear;
          return (
            <button key={m} type="button" disabled={disabled}
              className={`${cell} ${disabled ? disabledCls : isSel ? sel : idle}`}
              onClick={() => { if (disabled) return; onPick(`${year}-${String(idx + 1).padStart(2, "0")}`); }}>
              {m}
            </button>
          );
        })}
      </div>
    </div>
  );
};

const fmtCmp = (type: "year" | "month", v: string) => {
  if (type === "year") return v || "—";
  const [y, m] = (v || "").split("-");
  return y && m ? `${PICKER_MONTHS[parseInt(m) - 1]} ${y}` : "—";
};

const CustomCompare = ({
  type, a, b, onType, onA, onB,
}: {
  type: "year" | "month"; a: string; b: string;
  onType: (t: "year" | "month") => void;
  onA: (v: string) => void; onB: (v: string) => void;
}) => {
  const [open, setOpen] = useState<null | "a" | "b">(null);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(null); };
    if (open) document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);
  const trigger = "h-9 px-3 min-w-[112px] rounded outline outline-1 outline-offset-[-1px] outline-blue-200 bg-white text-blue-600 text-sm flex items-center justify-between gap-2 hover:bg-blue-50";
  return (
    <div ref={ref} className="flex items-center gap-2 font-['Stack_Sans_Headline']">
      <div className="rounded outline outline-1 outline-offset-[-1px] outline-blue-200 flex items-center">
        {(["year", "month"] as const).map((t) => (
          <button key={t} type="button" onClick={() => onType(t)}
            className={`px-3 py-2 rounded text-sm leading-4 ${type === t ? "bg-blue-300 text-white" : "text-blue-500"}`}>
            {t === "year" ? "Year" : "Month"}
          </button>
        ))}
      </div>
      <div className="relative">
        <button type="button" className={trigger} onClick={() => setOpen((o) => (o === "a" ? null : "a"))}>
          {fmtCmp(type, a)} <img src={Vector6} alt="" className="w-3 h-3" />
        </button>
        {open === "a" && (
          <div className="absolute top-full left-0 z-50 mt-1">
            <GridPicker mode={type} value={a} onPick={(v) => { onA(v); setOpen(null); }} />
          </div>
        )}
      </div>
      <span className="text-neutral-400 text-sm">vs</span>
      <div className="relative">
        <button type="button" className={trigger} onClick={() => setOpen((o) => (o === "b" ? null : "b"))}>
          {fmtCmp(type, b)} <img src={Vector6} alt="" className="w-3 h-3" />
        </button>
        {open === "b" && (
          <div className="absolute top-full left-0 z-50 mt-1">
            <GridPicker mode={type} value={b} onPick={(v) => { onB(v); setOpen(null); }} />
          </div>
        )}
      </div>
    </div>
  );
};

// Borderless label + chevron dropdown (matches the Figma "Aging ▾" filter trigger).
const MiniDropdown: React.FC<{
  value: string;
  options: string[];
  onChange: (v: string) => void;
}> = ({ value, options, onChange }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    if (open) document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);
  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="p-2 rounded flex items-center gap-2 text-blue-500 text-sm leading-4 font-['Stack_Sans_Headline'] hover:bg-blue-50"
      >
        {value}
        <ChevronDown size={14} className="text-blue-500" />
      </button>
      {open && (
        <div className="absolute top-full left-0 z-30 mt-1 min-w-[150px] bg-white rounded-lg border border-neutral-200 shadow-lg py-1">
          {options.map((o) => (
            <div
              key={o}
              onClick={() => { onChange(o); setOpen(false); }}
              className={`px-4 py-2 text-sm cursor-pointer hover:bg-blue-50 ${value === o ? "text-blue-600 font-weight-600" : "text-neutral-700"}`}
            >
              {o}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── main ─────────────────────────────────────────────────────────────────────

const TasksDashboard: React.FC<{ onOpen?: (f: TaskFilters) => void }> = ({ onOpen }) => {
  const { user } = useCurrentUser();
  const me = user?.name || ""; // logged-in user's name (email-before-@)
  const [dash, setDash] = useState<any>(null); // real dashboard aggregates
  const [loaded, setLoaded] = useState(false); // keep the loader up until headline data is in
  const [statsLoading, setStatsLoading] = useState(false); // top-widget period refetch (WTD/MTD/YTD/Custom)
  const [missingOpen, setMissingOpen] = useState(false);
  const [srOpen, setSrOpen] = useState<null | "storage" | "recovery">(null);
  const [collPeriod, setCollPeriod] = useState<"MTD" | "YTD" | "All Time">("YTD");
  // Debtors Age Analysis filters (see Figma). Period changes the "Current …" label;
  // Status is a display filter.
  const [debtorsPeriod, setDebtorsPeriod] = useState("MTD");
  const [debtorsStatus, setDebtorsStatus] = useState("All Status");
  const [collectionPayment, setCollectionPayment] = useState<CollectionPaymentStatus | null>(null);
  const [collectionPerf, setCollectionPerf] = useState<any>(null);
  const [period, setPeriod] = useState("MTD");
  // Custom date range for the TOP stat cards only (when period === "Custom").
  // This filter is scoped to the top widgets — it does NOT drive the charts
  // below, which each have their own period selector.
  const [gFrom, setGFrom] = useState("");
  const [gTo, setGTo] = useState("");
  const [gCalOpen, setGCalOpen] = useState<null | "from" | "to">(null);
  const gCalRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (gCalRef.current && !gCalRef.current.contains(e.target as Node)) setGCalOpen(null); };
    if (gCalOpen) document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [gCalOpen]);
  // Top stat cards are scoped to the selected period (WTD/MTD/YTD/Custom).
  useEffect(() => {
    if (period === "Custom") {
      // Wait for a full range before fetching; keep the UI up meanwhile.
      if (!gFrom || !gTo) {
        setLoaded(true);
        return;
      }
      setStatsLoading(true);
      getDashboard("CUSTOM", gFrom, gTo)
        .then(({ data }) => setDash(data))
        .catch(() => setDash(null))
        .finally(() => {
          setLoaded(true);
          setStatsLoading(false);
        });
    } else {
      setStatsLoading(true);
      getDashboard(period)
        .then(({ data }) => setDash(data))
        .catch(() => setDash(null))
        .finally(() => {
          setLoaded(true);
          setStatsLoading(false);
        });
    }
  }, [period, gFrom, gTo]);
  useEffect(() => {
    // Always fetch so the MTD / YTD / All-Time period works on its own; the
    // paid/pending dropdown is an optional extra filter (undefined = all).
    const apiPeriod = collPeriod === "All Time" ? "ALL" : collPeriod;
    getDashboardCollection(apiPeriod, collectionPayment || undefined)
      .then(({ data }) => setCollectionPerf(data || null))
      .catch(() => setCollectionPerf(null));
  }, [collPeriod, collectionPayment]);
  const [incomePeriod, setIncomePeriod] = useState("WTD");
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
  const [trendPeriod, setTrendPeriod] = useState("WTD");
  // No comparison mode selected by default — just the current period. Picking
  // YoY/MoM shows a 2-point summary; the expand toggle drills into quarters/weeks.
  const [trendMode, setTrendMode] = useState("");
  const [trendExpanded, setTrendExpanded] = useState(true);
  const [trendRef, setTrendRef] = useState("");
  const [trendStatus, setTrendStatus] = useState("");
  // Custom comparison (replaces the date range): Year (2024 vs 2026) or Month (Jan vs Dec).
  const [trendCmpType, setTrendCmpType] = useState<"year" | "month">("year");
  const [trendCmpA, setTrendCmpA] = useState(String(new Date().getFullYear() - 1));
  const [trendCmpB, setTrendCmpB] = useState(String(new Date().getFullYear()));
  const [hirePeriod, setHirePeriod] = useState("WTD");
  const [hireMode, setHireMode] = useState("");
  const [hireExpanded, setHireExpanded] = useState(true);
  const [hireRef, setHireRef] = useState("");
  const [hireStatus, setHireStatus] = useState("");
  const [hireCmpType, setHireCmpType] = useState<"year" | "month">("year");
  const [hireCmpA, setHireCmpA] = useState(String(new Date().getFullYear() - 1));
  const [hireCmpB, setHireCmpB] = useState(String(new Date().getFullYear()));
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

  // The top period tabs are scoped to the TOP stat cards only — they no longer
  // cascade to the charts below (Income, Claims/Hire trends, Collection,
  // Debtors), each of which keeps its own independent period selector.
  const applyGlobalPeriod = (p: string) => {
    if (p !== period) setStatsLoading(true);
    setPeriod(p);
    // Picking a preset clears any top-widget custom range.
    if (p !== "Custom") {
      setGFrom("");
      setGTo("");
    }
  };
  // Top-widget custom range (does not touch the charts below).
  const setGlobalRange = (from: string, to: string) => {
    setGFrom(from); setGTo(to);
  };

  // value helpers off the real aggregates (fallback "—" until loaded)
  const statValue = (c: any) => {
    const v = dash?.stats?.[c.key];
    if (v == null) return "—";
    if (c.money) return fmtMoney2(v);  // show exact pennies (e.g. £2,637.78)
    if (c.pct) return `${v}%`;
    return fmtNum(v);
  };
  const attnValue = (a: any) => fmtNum(dash?.attention?.[a.key] ?? 0);
  // Real month-over-month trend (falls back to the static text until loaded).
  const trendOf = (c: any) => dash?.trends?.[c.key];
  const trendUp = (c: any) => (trendOf(c) ? trendOf(c).up : c.up);
  // Magnitude of the change, capped at 100% and rounded to 1 dp so it never
  // overflows the badge (a percentage never exceeds 100).
  const trendPct = (c: any) => {
    const raw = trendOf(c) ? Number(trendOf(c).pct) : parseFloat(String(c.trend).replace(/[^0-9.]/g, "")) || 0;
    return Math.round(Math.min(100, Math.abs(raw)) * 10) / 10;
  };
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
    // YoY/MoM start as a 2-point summary; expanding drills into quarters/weeks.
    // Custom = a year/month comparison (view carries the granularity, A/B the periods).
    let view: string | undefined;
    let from: string | undefined;
    let to: string | undefined;
    if (trendMode) {
      view = trendExpanded ? "detail" : "summary";
    } else if (trendPeriod === "Custom") {
      // Claims Trend's own custom compare (Year/Month) — independent of the top
      // stat-card period filter.
      if (!trendCmpA || !trendCmpB) return;
      view = trendCmpType;
      from = trendCmpA;
      to = trendCmpB;
    }
    getDashboardTrends(trendPeriod, trendMode, trendRef, trendStatus, from, to, view)
      .then(({ data }) => {
        setClaimsTrend(data?.claims_trend || []);
        setClaimsTrendPrev(data?.claims_trend_prev || []);
        setTrendLabels(data?.series_labels);
      }).catch(() => {});
  }, [trendPeriod, trendMode, trendExpanded, trendRef, trendStatus, trendCmpType, trendCmpA, trendCmpB]);
  useEffect(() => {
    let view: string | undefined;
    let from: string | undefined;
    let to: string | undefined;
    if (hireMode) {
      view = hireExpanded ? "detail" : "summary";
    } else if (hirePeriod === "Custom") {
      // Hire Trend's own custom compare (Year/Month) — independent of the top
      // stat-card period filter.
      if (!hireCmpA || !hireCmpB) return;
      view = hireCmpType;
      from = hireCmpA;
      to = hireCmpB;
    }
    getDashboardTrends(hirePeriod, hireMode, hireRef, hireStatus, from, to, view)
      .then(({ data }) => {
        setHireTrend(data?.hire_trend || []);
        setHireTrendPrev(data?.hire_trend_prev || []);
        setHireLabels(data?.series_labels);
      }).catch(() => {});
  }, [hirePeriod, hireMode, hireExpanded, hireRef, hireStatus, hireCmpType, hireCmpA, hireCmpB]);
  useEffect(() => {
    getTrendOptions()
      .then(({ data }) => setTrendOptions({
        referrers: Array.isArray(data?.referrers) ? data.referrers : [],
        statuses: Array.isArray(data?.statuses) ? data.statuses : [],
      }))
      .catch(() => {});
  }, []);
  const debtorsAge = dash?.debtors_age || [];
  // All buckets shown (0-30 / 31-60 / 61-90 / 90+) — no aging filter.
  const shownDebtors = debtorsAge;
  const debtorsTotal = shownDebtors.reduce((s: number, r: any) => s + (Number(r.amount) || 0), 0);
  const debtorsMax = Math.max(1, ...shownDebtors.map((r: any) => Number(r.amount) || 0));
  const collection = collectionPerf || dash?.collection_ytd || {
    pct: 0, collected: 0, outstanding: 0, rate: 0, actual_collection: 0, billed: 0,
  };
  const storageRecovery = dash?.storage_recovery || {
    storage: { total: 0, count: 0 },
    recovery: { total: 0, count: 0 },
  };

  return (
    <>
      {/* Keep the full-screen loader up until the headline data has loaded, so the
          page doesn't flash empty after the lazy chunk resolves. */}
      {!loaded && <SpinnerLoader />}
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
        {/* Global period tabs — cascade WTD/MTD/YTD (or a Custom date range) to
            every chart below. The Custom range drives the date-range charts
            (Income + Claims/Hire trends). */}
        <div className="flex items-center gap-3 flex-wrap">
          <PeriodTabs active={period} onChange={applyGlobalPeriod} />
          {period === "Custom" && (
            <div ref={gCalRef} className="flex items-center gap-2">
              {(["from", "to"] as const).map((which) => {
                const val = which === "from" ? gFrom : gTo;
                return (
                  <div key={which} className="relative">
                    <div
                      onClick={() => setGCalOpen((o) => (o === which ? null : which))}
                      className="h-9 px-3 rounded border border-neutral-200 text-sm text-neutral-600 flex items-center gap-2 cursor-pointer min-w-[120px] justify-between"
                    >
                      <span className={val ? "text-neutral-700" : "text-neutral-400"}>
                        {val || (which === "from" ? "From" : "To")}
                      </span>
                     <img src={Vector6} alt="" />
                    </div>
                    {gCalOpen === which && (
                      <div className="absolute bottom-[54px] left-0 z-50 mt-1 shadow-xl rounded-lg bg-white">
                        <CustomDatePicker
                          selectedDate={val ? new Date(val + "T00:00:00") : new Date()}
                          onDateSelect={(d: Date) => {
                            const iso = toLocalISO(d);
                            which === "from" ? setGlobalRange(iso, gTo) : setGlobalRange(gFrom, iso);
                            setGCalOpen(null);
                          }}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="relative">
          {loaded && statsLoading && <InlineDashboardLoader />}
          <div
            className={`flex flex-col gap-8 ${
              loaded && statsLoading ? "pointer-events-none opacity-60" : ""
            }`}
          >
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
              <div className="mt-2 flex items-center gap-2">
                <span
                  className={`flex items-center gap-1 shrink-0 whitespace-nowrap rounded px-2 py-1 text-sm font-weight-600 ${
                    trendUp(c)
                      ? "bg-green-100 text-green-500"
                      : "bg-red-100 text-red-500"
                  }`}
                >
                  <img src={trendUp(c) ? TrendingUp : TrendingDown} alt="" className="w-3.5 h-3.5 shrink-0" />
                  {trendPct(c)}%
                </span>

                <span className="text-xs font-weight-500 text-neutral-500 leading-tight">
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
                    {fmtMoney2(val)}
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
            {/* WTD/MTD/YTD and YoY/MoM are independent toggles: picking a period
                clears the comparison mode, and picking YoY/MoM clears the period
                highlight — only one group is ever active at a time. */}
            <PeriodTabs
              active={trendMode ? "" : trendPeriod}
              onChange={(p) => { setTrendPeriod(p); setTrendMode(""); }}
            />
            {!trendMode && trendPeriod === "Custom" && (
              <CustomCompare
                type={trendCmpType} a={trendCmpA} b={trendCmpB}
                onType={(t) => {
                  setTrendCmpType(t);
                  const y = new Date();
                  if (t === "year") { setTrendCmpA(String(y.getFullYear() - 1)); setTrendCmpB(String(y.getFullYear())); }
                  else { setTrendCmpA(`${y.getFullYear()}-01`); setTrendCmpB(`${y.getFullYear()}-${String(y.getMonth() + 1).padStart(2, "0")}`); }
                }}
                onA={setTrendCmpA} onB={setTrendCmpB}
              />
            )}
            <div className="rounded outline outline-1 outline-offset-[-1px] outline-blue-200 flex items-center gap-1 font-['Stack_Sans_Headline']">
              {["YoY", "MoM"].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => { setTrendMode(trendMode === m ? "" : m); setTrendExpanded(true); }}
                  className={`px-4 py-2 rounded text-sm leading-4 ${trendMode === m ? "bg-blue-300 text-white" : "text-blue-500"}`}
                >
                  {m}
                </button>
              ))}
            </div>
            <TrendFilter label="Referrer" value={trendRef} options={trendOptions.referrers} onChange={setTrendRef} />
            <TrendFilter label="Status" value={trendStatus} options={trendOptions.statuses} onChange={setTrendStatus} />
            {/* Expand a YoY/MoM summary (2 points) into the quarter / week comparison. */}
            {trendMode && (
              <button
                type="button"
                onClick={() => setTrendExpanded((e) => !e)}
                title={
                  trendExpanded
                    ? "Show overall totals"
                    : trendMode === "YoY"
                    ? "Compare quarters (this FY vs last FY)"
                    : "Compare weeks (this month vs last month)"
                }
                className="ml-auto flex items-center justify-center w-9 h-9 rounded outline outline-1 outline-offset-[-1px] outline-blue-200 text-blue-500 hover:bg-blue-50"
              >
                {trendExpanded ? <Minimize2 size={16} /> : <LayoutGrid size={16} />}
              </button>
            )}
            {/* WTD/MTD/YTD → total pill, right-aligned in the filters row. */}
            {!trendMode && trendPeriod !== "Custom" && (
              <div className="ml-auto">
                <TrendTotalCard value={claimsTrend.reduce((s, p) => s + p.value, 0)} unit="Claims" />
              </div>
            )}
          </div>
          {(() => {
            const isSummary = trendMode && !trendExpanded;            // YoY/MoM overall
            const isCustom = !trendMode && trendPeriod === "Custom";   // custom year or month
            if (isSummary || isCustom) {
              // Two totals read clearest as KPI tiles. Custom sums its quarters/weeks
              // into a single total per period for each card.
              const kpiPts: Pt[] = isSummary ? claimsTrend : [
                { label: trendLabels?.previous || "Previous", value: claimsTrendPrev.reduce((s, p) => s + p.value, 0) },
                { label: trendLabels?.current || "Current", value: claimsTrend.reduce((s, p) => s + p.value, 0) },
              ];
              return <KpiCompare points={kpiPts} unit="claims" />;
            }
            return (
              <>
                <ClaimsTrendChart
                  points={claimsTrend}
                  compare={claimsTrendPrev}
                  labels={claimsTrendPrev.length ? trendLabels : undefined}
                  comparisonLabel={trendMode ? (trendMode === "MoM" ? "from last month" : "from last year") : `from ${trendLabels?.previous || "previous"}`}
                />
                {!trendMode && trendPeriod === "YTD" && (
                  <div className="text-center text-[12px] text-neutral-400 mt-1">{new Date().getFullYear()}</div>
                )}
                {!trendMode && trendPeriod === "WTD" && (
                  <div className="text-center text-[12px] text-neutral-400 mt-1">{wtdRangeLabel()}</div>
                )}
                <TrendLegend labels={claimsTrendPrev.length ? trendLabels : undefined} prevColor="#a2cfff" curColor="#0352FD" />
              </>
            );
          })()}
        </div>

        {/* Hire Trend */}
        <div className="rounded-lg border border-neutral-200 p-5">
          <h2 className="text-neutral-900 text-[20px] font-weight-600 mb-4">
            Hire Trend
          </h2>
          <div className="flex items-center flex-wrap gap-3 mb-6">
            {/* WTD/MTD/YTD and YoY/MoM are independent toggles (same as Claims Trend). */}
            <PeriodTabs
              active={hireMode ? "" : hirePeriod}
              onChange={(p) => { setHirePeriod(p); setHireMode(""); }}
            />
            {!hireMode && hirePeriod === "Custom" && (
              <CustomCompare
                type={hireCmpType} a={hireCmpA} b={hireCmpB}
                onType={(t) => {
                  setHireCmpType(t);
                  const y = new Date();
                  if (t === "year") { setHireCmpA(String(y.getFullYear() - 1)); setHireCmpB(String(y.getFullYear())); }
                  else { setHireCmpA(`${y.getFullYear()}-01`); setHireCmpB(`${y.getFullYear()}-${String(y.getMonth() + 1).padStart(2, "0")}`); }
                }}
                onA={setHireCmpA} onB={setHireCmpB}
              />
            )}
            <div className="rounded outline outline-1 outline-offset-[-1px] outline-blue-200 flex items-center gap-1 font-['Stack_Sans_Headline']">
              {["YoY", "MoM"].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => { setHireMode(hireMode === m ? "" : m); setHireExpanded(true); }}
                  className={`px-4 py-2 rounded text-sm leading-4 ${hireMode === m ? "bg-blue-300 text-white" : "text-blue-500"}`}
                >
                  {m}
                </button>
              ))}
            </div>
            <TrendFilter label="Referrer" value={hireRef} options={trendOptions.referrers} onChange={setHireRef} />
            <TrendFilter label="Status" value={hireStatus} options={["On Hire", "Off Hire"]} onChange={setHireStatus} />
            {/* Right side of the filters row: total pill (WTD/MTD/YTD) or change
                badge (YoY/MoM/Custom), plus the expand toggle. */}
            <div className="ml-auto flex items-center gap-3">
              {(() => {
                const isSummary = hireMode && !hireExpanded;
                const isCustom = !hireMode && hirePeriod === "Custom";
                if (isSummary && hireTrend.length === 2) {
                  const cmpLabel = hireMode === "MoM" ? "from last month" : "from last year";
                  return <PctBadge cur={hireTrend[1].value} prev={hireTrend[0].value} label={cmpLabel} />;
                }
                if (isCustom) {
                  const prevV = hireTrendPrev.reduce((s, p) => s + p.value, 0);
                  const curV = hireTrend.reduce((s, p) => s + p.value, 0);
                  return <PctBadge cur={curV} prev={prevV} label={`from ${hireLabels?.previous || "previous"}`} />;
                }
                if (!hireMode && hirePeriod !== "Custom") {
                  return <TrendTotalCard value={hireTrend.reduce((s, p) => s + p.value, 0)} unit="Hires" />;
                }
                return null;
              })()}
              {/* Expand a YoY/MoM summary (2 points) into the quarter / week comparison. */}
              {hireMode && (
                <button
                  type="button"
                  onClick={() => setHireExpanded((e) => !e)}
                  title={
                    hireExpanded
                      ? "Show overall totals"
                      : hireMode === "YoY"
                      ? "Compare quarters (this FY vs last FY)"
                      : "Compare weeks (this month vs last month)"
                  }
                  className="flex items-center justify-center w-9 h-9 rounded outline outline-1 outline-offset-[-1px] outline-blue-200 text-blue-500 hover:bg-blue-50"
                >
                  {hireExpanded ? <Minimize2 size={16} /> : <LayoutGrid size={16} />}
                </button>
              )}
            </div>
          </div>
          {(() => {
            const isSummary = hireMode && !hireExpanded;             // YoY/MoM overall
            const isCustom = !hireMode && hirePeriod === "Custom";    // custom year or month
            const overall = isSummary || isCustom;
            // Custom overall sums its quarters/weeks into one total bar per period.
            const pts: Pt[] = isCustom ? [
              { label: hireLabels?.previous || "Previous", value: hireTrendPrev.reduce((s, p) => s + p.value, 0) },
              { label: hireLabels?.current || "Current", value: hireTrend.reduce((s, p) => s + p.value, 0) },
            ] : hireTrend;
            const cmp = overall ? [] : hireTrendPrev;                 // overall = two distinct bars, no compare series
            // Standard YoY/MoM = "from last year/month"; custom picks arbitrary
            // periods so use the actual baseline (e.g. "from 2024" / "from May 2024").
            const cmpLabel = hireMode ? (hireMode === "MoM" ? "from last month" : "from last year") : `from ${hireLabels?.previous || "previous"}`;
            return (
              <>
                <BarChart
                  points={pts}
                  compare={cmp}
                  labels={cmp.length ? hireLabels : undefined}
                  tickFormatter={fmtNum}
                  valueFormatter={(value) => `${fmtNum(value)} vehicle${value === 1 ? "" : "s"}`}
                  barColors={overall ? ["#a2cfff", "#0352FD"] : undefined}
                  comparisonLabel={cmpLabel}
                />
                {/* The overall increase/decrease badge now sits top-right of the card. */}
                {!hireMode && hirePeriod === "YTD" && (
                  <div className="text-center text-[12px] text-neutral-400 mt-1">{new Date().getFullYear()}</div>
                )}
                {!hireMode && hirePeriod === "WTD" && (
                  <div className="text-center text-[12px] text-neutral-400 mt-1">{wtdRangeLabel()}</div>
                )}
                <TrendLegend labels={cmp.length ? hireLabels : undefined} prevColor="#a2cfff" curColor="#0352FD" />
              </>
            );
          })()}
        </div>

        {/* Debtors Age + Collection Performance */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="rounded-lg border border-neutral-200 px-4 py-6 flex flex-col gap-10 font-['Stack_Sans_Headline']">
            {/* Header + filters */}
            <div className="flex flex-col gap-5">
              <h2 className="text-black text-xl font-weight-600 leading-5">
                Debtors Age Analysis
              </h2>
              <div className="flex items-center gap-5 flex-wrap">
                {/* Period toggle */}
                <div className="rounded outline outline-1 outline-offset-[-1px] outline-blue-200 flex items-center gap-1">
                  {["MTD", "YTD", "All Time"].map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setDebtorsPeriod(p)}
                      className={`px-4 py-2 rounded text-sm leading-4 ${
                        debtorsPeriod === p ? "bg-blue-300 text-white" : "text-blue-500"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
                {/* <MiniDropdown
                  value={debtorsStatus}
                  options={["All Status", "Outstanding", "Partially Paid", "Paid"]}
                  onChange={setDebtorsStatus}
                /> */}
              </div>
            </div>

            {/* Total + bars */}
            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-1">
                <div className="text-black text-2xl font-weight-600 leading-6">
                  {fmtMoney2(debtorsTotal)}
                </div>
                <div className="text-neutral-500 text-sm font-weight-500">
                  Current {debtorsPeriod}
                </div>
              </div>
              <div className="flex flex-col gap-3">
                {shownDebtors.length === 0 && (
                  <div className="text-neutral-400 text-sm py-4 text-center">No debtors in this view.</div>
                )}
                {shownDebtors.map((r: any) => (
                  <div key={r.label} className="flex flex-col gap-1.5">
                    <div className="flex justify-between items-center">
                      <span className="text-black text-sm font-weight-600">{r.label}</span>
                      <span className="text-black text-sm font-weight-600">{fmtMoney2(r.amount)}</span>
                    </div>
                    <div className="w-full h-2.5 rounded-full bg-neutral-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-blue-300"
                        style={{ width: `${Math.max(2, (Number(r.amount) / debtorsMax) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
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
                <TrendFilter
                  label="Payment"
                  allLabel="Payment"
                  value={collectionPayment ? (collectionPayment === "paid" ? "Paid" : "Pending") : ""}
                  options={["Paid", "Pending"]}
                  onChange={(v) => setCollectionPayment(v ? (v.toLowerCase() as CollectionPaymentStatus) : null)}
                />
              </div>
            </div>
            <div className="flex items-center justify-between gap-8">
              <div className="flex flex-col gap-5">
                <div className="flex flex-col gap-1">
                  <div className="text-black text-2xl font-weight-600 leading-6">
                    {collection.rate ?? 0}%
                  </div>
                  <div className="text-neutral-500 text-sm font-weight-500">Collection Rate</div>
                </div>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-5">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full shrink-0" style={{ background: "#2563EB" }} />
                      <span className="text-black text-sm font-weight-600 w-36">Agreed Amount</span>
                    </div>
                    <span className="text-black text-sm font-weight-600">
                      {fmtMoney2(collection.actual_collection)}
                    </span>
                  </div>
                  <div className="flex items-center gap-5">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full shrink-0" style={{ background: "#A3CFFF" }} />
                      <span className="text-black text-sm font-weight-600 w-36">Actual Amount</span>
                    </div>
                    <span className="text-black text-sm font-weight-600">
                      {fmtMoney2(collection.billed)}
                    </span>
                  </div>
                </div>
              </div>
              <CollectionDonut
                actual={collection.actual_collection || 0}
                billed={collection.billed || 0}
                actualLabel="Agreed Amount"
                billedLabel="Actual Amount"
                fmt={fmtMoney2}
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
              Daily Operational Insights
            </h2>
            <div className="flex flex-col gap-3">
              {[
                {
                  label: "New Claims",
                  value: fmtNum(dash?.stats?.claims_created_today ?? 0),
                },
                {
                  label: "Approved Claims",
                  value: fmtNum(dash?.stats?.approved_claims_today ?? 0),
                },
                {
                  label: "Vehicle Hires",
                  value: fmtNum(dash?.stats?.vehicle_hires_today ?? 0),
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
