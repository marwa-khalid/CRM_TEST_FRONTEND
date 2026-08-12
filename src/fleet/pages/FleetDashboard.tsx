import React, { useState, useRef, useEffect, useLayoutEffect, useCallback } from "react";
import FleetNotificationBell from "../components/FleetNotificationBell";
import TrendingUp from "../../assets/Dashboard/TrendingUp.svg";
import TrendingDown from "../../assets/Dashboard/TrendingDown.svg";
import AllTasksIcon from "../assets/dashboard//AllTasks.svg";
import OverdueIcon from "../../assets/Dashboard/Overdue.svg";
import CriticalIcon from "../../assets/Dashboard/Critical.svg";
import PendingFollowupsIcon from "../../assets/Dashboard/PendingFollowups.svg";
import MOTIcon from "../assets/dashboard/MOT-Icon-Black.svg";
import RoadTaxIcon from "../assets/dashboard/Road-Fund-Licence-Icon-Black.svg";
import ServiceIcon from "../assets/dashboard/Service-Icon-Black.svg";
import VehicleStatusIcon from "../assets/dashboard/Vehiclestatus.svg";
import WeeklyPaymentIcon from "../assets/dashboard/WeeklyPayment.svg";
import PlateIcon from "../assets/dashboard/Plate-Icon-Black.svg";
import FileStatIcon from "../../assets/Dashboard/File.svg";
import PoundStatIcon from "../../assets/Dashboard/Pound.svg";
import CarsStatIcon from "../../assets/Dashboard/Cars.svg";
import UrgentStatIcon from "../../assets/Dashboard/Urgent.svg";
import FleetMultiSelectFilter from "../components/FleetMultiSelectFilter";
import FleetSpinnerLoader from "../components/FleetSpinnerLoader";
import FleetMissingDocumentsSlider from "../components/FleetMissingDocumentsSlider";
import FleetAttentionSlider, { type AttentionCard } from "../components/FleetAttentionSlider";
import {
  getHireTrend, getStats, getVehicleStatus, getWeeklyPayments, getCompliance, getExpiries, getAttention,
  getMissingDocuments, getOverdueReturns, getOverduePayments, getFleetVehicles,
  type WeeklyPayments, type PaymentSummary, type Attention, type Compliance, type Expiries, type MissingDoc,
} from "../services/dashboardService";
import { listFleetTasks, type FleetTask } from "../services/taskService";

// Fleet Dashboard — pure inline Tailwind (same convention as the Claims dashboard).
// Sample data is hard-coded for now; wire to fleet services when the APIs land.

// ── shared bits ──────────────────────────────────────────────────────────────
const Card: React.FC<{ span: string; className?: string; children: React.ReactNode }> = ({ span, className = "", children }) => (
  <div className={`${span} rounded-xl border border-neutral-200 p-5 flex flex-col min-w-0 ${className}`}>{children}</div>
);

// Sky-tinted, outlined icon box for the compliance / expiry / section-header icons.
// Grey icon box (same neutral background as the Fleet Performance metric icons).
const GreyIconBox: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="size-8 bg-neutral-100 rounded-lg inline-flex justify-center items-center overflow-hidden shrink-0">
    {children}
  </span>
);

const CardHead: React.FC<{ icon?: React.ReactNode; title: string; sub?: string; right?: React.ReactNode; center?: boolean }> = ({ icon, title, sub, right, center }) => (
  <div className={`flex items-center gap-2.5 mb-4 ${center ? "justify-center" : "justify-between"}`}>
    <div className="flex items-center gap-2.5 min-w-0">
      {icon}
      <div className="min-w-0">
        <h3 className="text-xl font-weight-600 text-neutral-900 leading-tight">{title}</h3>
        {sub && <span className="text-[11.5px] text-neutral-400">{sub}</span>}
      </div>
    </div>
    {right}
  </div>
);


// Same chip design as the Skyline Operations summary boxes (solid tint, no border).
const TP: Record<string, string> = {
  violet: "bg-violet-100 text-violet-600", gray: "bg-gray-200 text-zinc-500",
  yellow: "bg-yellow-100 text-yellow-700",
  red: "bg-red-100 text-red-600", orange: "bg-orange-100 text-orange-600", green: "bg-green-100 text-green-700",
};
const TabPills: React.FC<{ tabs: [string, string, string][] }> = ({ tabs }) => (
  <div className="flex flex-wrap gap-1.5 mb-3.5">
    {tabs.map(([tone, label, count]) => (
      <span key={label} className={`rounded px-2 py-1.5 text-xs font-weight-400 font-normal leading-4 ${TP[tone]}`}>
        {label} {count}
      </span>
    ))}
  </div>
);

// Data table (Weekly Payment + expiry cards). Cell text matches the task-card title style.
const DataTable: React.FC<{
  head: string[];
  rows: (string | [string, string])[][];
  headText?: string;
  cellText?: string;
  rowClass?: string;
  cellClamp?: string;
}> = ({ head, rows, headText = "text-neutral-500", cellText = "text-neutral-900", rowClass = "py-3", cellClamp = "line-clamp-1" }) => (
  <table className="w-full border-collapse">
    <thead>
      <tr>{head.map((h) => <th key={h} className={`text-left text-sm whitespace-nowrap ${headText} pb-2.5 pt-1 px-2 border-b border-neutral-100`}>{h}</th>)}</tr>
    </thead>
    <tbody>
      {rows.length === 0 ? (
        <tr>
          <td colSpan={Math.max(1, head.length)} className="py-3 px-2 text-center text-xs font-weight-500 text-neutral-400">Nothing to show yet.</td>
        </tr>
      ) : (
        rows.map((r, i) => (
          <tr key={i}>
            {r.map((cell, j) => (
              <td key={j} className={`${rowClass} px-2 ${i < rows.length - 1 ? "border-b border-neutral-100" : ""} align-top`}>
                {Array.isArray(cell) ? (
                  <span className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-weight-500 whitespace-nowrap ${TP[cell[1]] ?? "bg-neutral-100 text-neutral-600"}`}>{cell[0]}</span>
                ) : (
                  <span className={`${cellText} text-xs font-weight-500 ${cellClamp}`}>{cell}</span>
                )}
              </td>
            ))}
          </tr>
        ))
      )}
    </tbody>
  </table>
);

// ── Hire Trend (WTD/MTD/YTD periods + YoY/MoM comparison) ─────────────────────
type TrendView = { labels: string[]; vals: number[]; cap: string; cmp?: string };
// Zero placeholders — shown only until /dashboard/hire-trend returns. Labels/captions
// keep the axis shape; the bars read 0 rather than inventing a trend.
const HT_VIEWS: Record<string, TrendView> = {
  WTD: { labels: ["Mon", "Tue", "Wed", "Thu", "Fri"], vals: [0, 0, 0, 0, 0], cap: "" },
  MTD: { labels: ["Week 1", "Week 2", "Week 3", "Week 4", "Week 5"], vals: [0, 0, 0, 0, 0], cap: "" },
  YTD: { labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"], vals: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], cap: "" },
  // Custom = a two-period year/month comparison (like Claims), so the placeholder
  // is a 2-bar previous-vs-current — never a long day series.
  Custom: { labels: [String(new Date().getFullYear() - 1), String(new Date().getFullYear())], vals: [0, 0], cap: `${new Date().getFullYear() - 1} vs ${new Date().getFullYear()}` },
  YoY: { labels: [String(new Date().getFullYear() - 1), String(new Date().getFullYear())], vals: [0, 0], cap: "", cmp: "from last year" },
  MoM: { labels: ["Prev", "This"], vals: [0, 0], cap: "", cmp: "from last month" },
};
function niceAxis(rawMax: number, steps: number) {
  const step = Math.max(1, Math.ceil(Math.max(1, rawMax) / steps));
  const ticks: number[] = [];
  for (let i = 0; i <= steps; i++) ticks.push(step * i);
  return { max: step * steps, ticks };
}
const chevron = <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5"><path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;

// ── Hire-trend Custom compare (Year vs Year / Month vs Month) — mirrors the
// Claims dashboard's CustomCompare, re-themed neutral for Fleet. ──────────────
const PICKER_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const fmtCmp = (type: "year" | "month", v: string) => {
  if (type === "year") return v || "—";
  const [y, m] = (v || "").split("-");
  return y && m ? `${PICKER_MONTHS[parseInt(m) - 1]} ${y}` : "—";
};
const GridPicker: React.FC<{ mode: "year" | "month"; value: string; onPick: (v: string) => void }> = ({ mode, value, onPick }) => {
  const now = new Date();
  const parsedYear = (() => { const y = parseInt((value || "").slice(0, 4)); return Number.isFinite(y) && y > 1970 ? y : now.getFullYear(); })();
  const parsedMonth = mode === "month" ? parseInt((value || "").split("-")[1] || "0") : 0;
  const [view, setView] = useState<"year" | "month">(mode === "year" ? "year" : "month");
  const [year, setYear] = useState(parsedYear);
  const maxYear = now.getFullYear();
  const maxMonth = now.getMonth() + 1;
  const [windowEnd, setWindowEnd] = useState(parsedYear >= maxYear - 11 && parsedYear <= maxYear ? maxYear : Math.min(parsedYear, maxYear));
  const cell = "h-10 rounded-md text-sm flex items-center justify-center cursor-pointer transition-colors";
  const idle = "bg-white hover:bg-neutral-100 text-neutral-700";
  const sel = "bg-neutral-900 text-white";
  const disabledCls = "text-neutral-300 cursor-not-allowed";
  const wrap = "w-[252px] bg-white rounded-lg border border-neutral-200 shadow-xl p-3";
  const navCls = (disabled: boolean) => `px-2 ${disabled ? disabledCls : "text-neutral-500 hover:text-neutral-900"}`;
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
              <button key={y} type="button" disabled={disabled} className={`${cell} ${disabled ? disabledCls : isSel ? sel : idle}`}
                onClick={() => { if (disabled) return; setYear(y); if (mode === "year") onPick(String(y)); else setView("month"); }}>{y}</button>
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
        <button type="button" onClick={() => { setWindowEnd(year >= maxYear - 11 && year <= maxYear ? maxYear : Math.min(year, maxYear)); setView("year"); }} className="text-sm font-weight-600 text-neutral-800 hover:text-neutral-900">{year}</button>
        <button type="button" disabled={year >= maxYear} onClick={() => setYear((y) => Math.min(maxYear, y + 1))} className={navCls(year >= maxYear)}>›</button>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {PICKER_MONTHS.map((m, idx) => {
          const disabled = year > maxYear || (year === maxYear && (idx + 1) > maxMonth);
          const isSel = (idx + 1) === parsedMonth && year === parsedYear;
          return (
            <button key={m} type="button" disabled={disabled} className={`${cell} ${disabled ? disabledCls : isSel ? sel : idle}`}
              onClick={() => { if (disabled) return; onPick(`${year}-${String(idx + 1).padStart(2, "0")}`); }}>{m}</button>
          );
        })}
      </div>
    </div>
  );
};
const CustomCompare: React.FC<{
  type: "year" | "month"; a: string; b: string;
  onType: (t: "year" | "month") => void; onA: (v: string) => void; onB: (v: string) => void;
}> = ({ type, a, b, onType, onA, onB }) => {
  const [open, setOpen] = useState<null | "a" | "b">(null);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(null); };
    if (open) document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);
  const trigger = "h-8 px-3 min-w-[110px] rounded border border-neutral-200 bg-white text-neutral-700 text-[13px] flex items-center justify-between gap-2 hover:bg-neutral-50";
  return (
    <div ref={ref} className="flex items-center gap-2">
      <div className="rounded border border-neutral-200 flex items-center p-0.5">
        {(["year", "month"] as const).map((t) => (
          <button key={t} type="button" onClick={() => onType(t)} className={`px-3 py-1 rounded text-[13px] leading-4 ${type === t ? "bg-neutral-900 text-white" : "text-zinc-500"}`}>
            {t === "year" ? "Year" : "Month"}
          </button>
        ))}
      </div>
      <div className="relative">
        <button type="button" className={trigger} onClick={() => setOpen((o) => (o === "a" ? null : "a"))}>{fmtCmp(type, a)} {chevron}</button>
        {open === "a" && <div className="absolute top-full left-0 z-50 mt-1"><GridPicker mode={type} value={a} onPick={(v) => { onA(v); setOpen(null); }} /></div>}
      </div>
      <span className="text-neutral-400 text-[13px]">vs</span>
      <div className="relative">
        <button type="button" className={trigger} onClick={() => setOpen((o) => (o === "b" ? null : "b"))}>{fmtCmp(type, b)} {chevron}</button>
        {open === "b" && <div className="absolute top-full left-0 z-50 mt-1"><GridPicker mode={type} value={b} onPick={(v) => { onB(v); setOpen(null); }} /></div>}
      </div>
    </div>
  );
};

const HT_STATUS_OPTS = [{ label: "All Statuses", value: "" }, { label: "On Hire", value: "on_hire" }, { label: "Off Hire", value: "off_hire" }];
const HireTrend: React.FC = () => {
  const [period, setPeriod] = useState("WTD");
  const [mode, setMode] = useState("");
  const [status, setStatus] = useState("");
  const [statusOpen, setStatusOpen] = useState(false);
  const statusRef = useRef<HTMLDivElement>(null);
  // Custom year/month comparison (default: last year vs this year).
  const [cmpType, setCmpType] = useState<"year" | "month">("year");
  const [cmpA, setCmpA] = useState(String(new Date().getFullYear() - 1));
  const [cmpB, setCmpB] = useState(String(new Date().getFullYear()));
  useEffect(() => {
    const h = (e: MouseEvent) => { if (statusRef.current && !statusRef.current.contains(e.target as Node)) setStatusOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  // Live vehicle-hire counts from the Fleet backend. Falls back to HT_VIEWS
  // placeholders until data lands (or if the backend isn't reachable).
  const [live, setLive] = useState<TrendView | null>(null);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    // Don't clear to the placeholder on every filter change — that flashes fake
    // values before the real data lands. Keep the current bars (dimmed) until the
    // new response arrives; the placeholder only shows before the first load.
    let cancelled = false;
    setLoading(true);
    getHireTrend(
      period, mode, status,
      period === "Custom" ? cmpType : "",
      period === "Custom" ? cmpA : "",
      period === "Custom" ? cmpB : "",
    ).then((r) => {
      if (cancelled) return;
      if (r && r.values?.length) {
        setLive({ labels: r.labels, vals: r.values, cap: r.caption, cmp: r.comparison_note || undefined });
      }
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [period, mode, status, cmpType, cmpA, cmpB]);
  const v = live ?? HT_VIEWS[mode || period];
  const two = v.vals.length <= 2;
  const barW = two ? 84 : Math.round(Math.min(64, Math.max(36, 360 / v.vals.length))); // wider when fewer bars
  const ax = niceAxis(Math.max(...v.vals), 4);
  const Y = (x: number) => 100 - (x / ax.max) * 100;
  const total = v.vals.reduce((a, b) => a + b, 0);
  const pct = v.vals[0] ? ((v.vals[1] - v.vals[0]) / v.vals[0]) * 100 : 0;
  const up = pct >= 0;
  const segBtn = (active: boolean) => `px-4 py-1.5 rounded text-[13px] leading-none ${active ? "bg-neutral-900 text-white" : "text-zinc-500"}`;

  return (
    <Card span="col-span-12">
      {loading && <FleetSpinnerLoader />}
      <h3 className="text-xl font-weight-600 text-neutral-900 mb-3.5">Hire Trend</h3>
      <div className="flex items-center gap-2.5 flex-wrap mb-4">
        <div className="inline-flex items-center gap-0.5 border border-neutral-200 rounded p-0.5">
          {["WTD", "MTD", "YTD"].map((p) => (
            <button key={p} type="button" onClick={() => { setPeriod(p); setMode(""); }} className={segBtn(!mode && period === p)}>{p}</button>
          ))}
        </div>
        <button type="button" onClick={() => {
            // Entering Custom always defaults to a clean year compare (last year vs
            // this year) so it opens as 2 bars, never a long day range.
            if (period !== "Custom") {
              const d = new Date();
              setCmpType("year");
              setCmpA(String(d.getFullYear() - 1));
              setCmpB(String(d.getFullYear()));
            }
            setPeriod("Custom");
            setMode("");
          }}
          className={`inline-flex items-center gap-1.5 border border-neutral-200 rounded px-3 py-1.5 text-[13px] leading-none ${!mode && period === "Custom" ? "bg-neutral-900 text-white" : "text-zinc-500"}`}>
          <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5"><rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.7" /><path d="M3 9h18M8 3v4M16 3v4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" /></svg>
          Custom
        </button>
        {period === "Custom" && !mode && (
          <CustomCompare
            type={cmpType}
            a={cmpA}
            b={cmpB}
            onType={(t) => {
              setCmpType(t);
              // Re-seed the two periods so the compare is always a clean 2-bar view:
              // year → last year vs this year; month → last month vs this month.
              const d = new Date();
              if (t === "year") {
                setCmpA(String(d.getFullYear() - 1));
                setCmpB(String(d.getFullYear()));
              } else {
                const prev = new Date(d.getFullYear(), d.getMonth() - 1, 1);
                setCmpA(`${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, "0")}`);
                setCmpB(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
              }
            }}
            onA={setCmpA}
            onB={setCmpB}
          />
        )}
        <div className="inline-flex items-center gap-0.5 border border-neutral-200 rounded p-0.5">
          {["YoY", "MoM"].map((m) => (
            <button key={m} type="button" onClick={() => setMode(mode === m ? "" : m)} className={segBtn(mode === m)}>{m}</button>
          ))}
        </div>
        <div className="relative" ref={statusRef}>
          <button type="button" onClick={() => setStatusOpen((o) => !o)} className={`inline-flex items-center gap-1.5 text-[13px] px-1 py-1.5 ${status ? "text-neutral-900 font-weight-500" : "text-zinc-500"}`}>
            {status ? HT_STATUS_OPTS.find((o) => o.value === status)?.label : "Status"} {chevron}
          </button>
          {statusOpen && (
            <div className="absolute left-0 top-full mt-1 z-20 min-w-[140px] rounded border border-neutral-200 bg-white shadow-md py-1">
              {HT_STATUS_OPTS.map((o) => (
                <button key={o.value} type="button" onClick={() => { setStatus(o.value); setStatusOpen(false); }} className={`w-full text-left px-3 py-1.5 text-[13px] hover:bg-neutral-100 ${status === o.value ? "text-neutral-900 font-weight-600" : "text-neutral-600"}`}>
                  {o.label}
                </button>
              ))}
            </div>
          )}
        </div>
        <span className="ml-auto inline-flex items-center gap-1.5 bg-neutral-100 text-neutral-700 rounded-full px-4 py-2 text-[13px] whitespace-nowrap">
          {mode
            ? (<><span className={`inline-flex items-center gap-1 font-weight-700 ${up ? "text-green-600" : "text-red-500"}`}><img src={up ? TrendingUp : TrendingDown} alt="" className="w-3.5 h-3.5" />{Math.abs(pct).toFixed(1) + "%"}</span> {v.cmp}</>)
            : (<><b className="text-neutral-900 font-weight-700 tabular-nums">{total}</b> Hires</>)}
        </span>
      </div>
      <div className="flex">
        <div className="relative w-8 shrink-0 h-[220px]">
          {ax.ticks.map((t, i) => <span key={i} className="absolute right-1.5 -translate-y-1/2 text-[10px] text-neutral-400 tabular-nums" style={{ top: Y(t).toFixed(1) + "%" }}>{t}</span>)}
        </div>
        <div className="relative flex-1 h-[220px]">
          {ax.ticks.map((t, i) => <div key={i} className="absolute left-0 right-0 border-t border-dashed border-neutral-200" style={{ top: Y(t).toFixed(1) + "%" }} />)}
          <div className={`absolute inset-0 flex items-end px-2 ${two ? "gap-[60px] justify-center" : "gap-3"}`}>
            {v.vals.map((val, i) => {
              const h = Math.max(1, (val / ax.max) * 100);
              const isCmp = two && i === 0;
              return (
                <div key={i} className={`h-full flex items-end justify-center relative group ${two ? "flex-none" : "flex-1"}`}>
                  <div className={`relative rounded-t ${isCmp ? "bg-neutral-200" : "bg-neutral-400 group-hover:bg-neutral-500"}`} style={{ height: h.toFixed(1) + "%", width: `${barW}px` }}>
                    <div className="absolute bottom-[calc(100%+6px)] left-1/2 -translate-x-1/2 bg-white border border-neutral-200 rounded-lg px-2.5 py-1 text-[11px] whitespace-nowrap shadow opacity-0 group-hover:opacity-100 transition pointer-events-none z-10">{`${val} ${val === 1 ? "hire" : "hires"}`}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <div className={`flex px-2 mt-2 ml-8 ${two ? "gap-[60px] justify-center" : "gap-3"}`}>
        {v.labels.map((l, i) => <span key={i} className={`text-center text-[10px] text-neutral-400 ${two ? "flex-none w-[84px]" : "flex-1"}`}>{l}</span>)}
      </div>
      <div className="text-center text-[11px] text-neutral-400 mt-2 tabular-nums">{v.cap}</div>
    </Card>
  );
};

// ── Vehicle Status Distribution (128 Total donut + legend) ────────────────────
// Colour per status label — presentation stays here; counts come live from the API.
const VEH_COLORS: Record<string, string> = {
  Available: "#bbf7d0",
  "On Hire": "#6b7280",
  "In Service": "#bae6fd",
  "In Repair": "#fed7aa",
  "For Sale": "#f9a8d4",
  "Off Fleet": "#99f6e4",
  "Awaiting Plating": "#ddd6fe",
  "Awaiting De Fleet": "#d4d4d8",
};
// The donut legend mirrors the Vehicle Details availability dropdown. On Hire is
// the dashboard label for live on-hire vehicles; Off Fleet is the dashboard label for
// off-hire vehicles.
const VEH_ALWAYS_LEGEND: { l: string; c: string }[] = [
  { l: "Available", c: VEH_COLORS.Available },
  { l: "On Hire", c: VEH_COLORS["On Hire"] },
  { l: "In Service", c: VEH_COLORS["In Service"] },
  { l: "In Repair", c: VEH_COLORS["In Repair"] },
  { l: "For Sale", c: VEH_COLORS["For Sale"] },
  { l: "Off Fleet", c: VEH_COLORS["Off Fleet"] },
  { l: "Awaiting Plating", c: VEH_COLORS["Awaiting Plating"] },
  { l: "Awaiting De Fleet", c: VEH_COLORS["Awaiting De Fleet"] },
];
const VEH_FALLBACK_COLORS = ["#c7d2fe", "#fde68a", "#99f6e4", "#fecaca", "#a1a1aa"];
const VEH_SEG = VEH_ALWAYS_LEGEND.map(({ l, c }) => ({ l, v: 0, c }));
const normaliseVehicleStatusLabel = (label: string) => {
  const cleaned = label.trim().replace(/[_-]/g, " ").replace(/\s+/g, " ");
  const lower = cleaned.toLowerCase();
  if (lower === "on hire" || lower === "weekly hire") return "On Hire";
  if (lower === "off hire") return "Off Fleet";
  if (lower === "awaiting de fleet") return "Awaiting De Fleet";
  const known = VEH_ALWAYS_LEGEND.find((x) => x.l.toLowerCase() === lower);
  return known?.l || cleaned;
};
const mapVehicleSegments = (segments: { label: string; value: number }[]) => {
  const totals = new Map(VEH_ALWAYS_LEGEND.map(({ l }) => [l, 0]));
  segments.forEach((s) => {
    const label = normaliseVehicleStatusLabel(s.label);
    totals.set(label, (totals.get(label) || 0) + (Number(s.value) || 0));
  });
  return [...totals.entries()].map(([l, v], i) => ({
    l,
    v,
    c: VEH_COLORS[l] ?? VEH_FALLBACK_COLORS[i % VEH_FALLBACK_COLORS.length],
  }));
};
const VehicleDonut: React.FC<{ side?: string }> = ({ side }) => {
  // Live vehicle-status distribution; falls back to VEH_SEG placeholders.
  const [seg, setSeg] = useState<{ l: string; v: number; c: string }[] | null>(null);
  useEffect(() => {
    let cancelled = false;
    getVehicleStatus().then((r) => {
      if (cancelled) return;
      // Use the live result whenever the backend responds — even an empty list
      // (no vehicles) is real data. Only fall back to the placeholder when the
      // call fails (r === null), not when the fleet legitimately has 0 vehicles.
      setSeg(
        r
          ? mapVehicleSegments(r.segments)
          : null,
      );
    });
    return () => {
      cancelled = true;
    };
  }, []);
  const data = seg ?? VEH_SEG;
  // Legend always includes every availability status, even at 0 (the arcs still come from
  // `data`, so a 0 entry just adds a legend row, no visible slice).
  const legendData = [...data];
  VEH_ALWAYS_LEGEND.forEach(({ l, c }) => {
    if (!legendData.some((x) => x.l === l)) legendData.push({ l, v: 0, c });
  });
  const actualTotal = data.reduce((s, x) => s + x.v, 0);
  const total = actualTotal || 1; // avoid divide-by-zero in the arc proportions
  const r = 56, C = 2 * Math.PI * r;
  let off = 0;
  const arcs = data.map((x, i) => {
    const len = (x.v / total) * C;
    const el = <circle key={i} cx="80" cy="80" r={r} fill="none" stroke={x.c} strokeWidth="22" strokeDasharray={`${len.toFixed(2)} ${(C - len).toFixed(2)}`} strokeDashoffset={(-off).toFixed(2)} transform="rotate(-90 80 80)" />;
    off += len;
    return el;
  });
  return (
    <Card span={side === "vehicles" ? "col-span-12 lg:col-span-8" : "col-span-12 lg:col-span-5"} className={side === "vehicles" ? "lg:ml-6" : ""}>
      <CardHead
        icon={<GreyIconBox><img src={VehicleStatusIcon} alt="" className="size-6" /></GreyIconBox>}
        title="Vehicle Status Distribution"
      />
      <div className={`flex-1 flex items-center py-1.5 ${side === "vehicles" ? "flex-nowrap gap-14" : "flex-wrap content-center gap-6"}`}>
        <svg viewBox="0 0 160 160" className={`shrink-0 ${side === "vehicles" ? "w-[190px] h-[190px]" : "w-[220px] h-[220px]"}`}>
          <circle cx="80" cy="80" r={r} fill="none" stroke="#f1f1f1" strokeWidth="22" />
          {arcs}
          <text x="80" y="80" textAnchor="middle" fontSize="30" fontWeight="700" fill="#111827">{actualTotal}</text>
          <text x="80" y="100" textAnchor="middle" fontSize="14" fill="#6b7280">Total</text>
        </svg>
        <div className={`flex flex-col ${side === "vehicles" ? "gap-2 flex-1 min-w-0" : "gap-3 flex-1 min-w-[160px]"}`}>
          {data.length === 0 ? (
            <div className="text-neutral-400 text-sm">No vehicles in the fleet yet.</div>
          ) : (
            legendData.map((x, i) => (
              <div key={i} className="flex items-center gap-2.5 text-sm">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: x.c }} />
                <span className="flex-1 truncate text-neutral-700">{x.l}</span>
                <span className={`font-weight-600 text-neutral-900 tabular-nums pr-1 ${side === "vehicles" ? "pl-12" : "pl-3 pr-2"}`}>{x.v}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </Card>
  );
};

// ── Attention Required (ditto the Claims dashboard "Attention Required") ───────
const ATTENTION = [
  { value: 6, label: "Overdue Returns", note: "Vehicles past expected return date", tint: "bg-red-100 border-red-100", icon: OverdueIcon },
  { value: 4, label: "Missing Documents", note: "Vehicles missing required documents", tint: "bg-yellow-100 border-yellow-100", icon: CriticalIcon },
  { value: 3, label: "Overdue Payments", note: "Hire payments past their due date", tint: "bg-red-100 border-red-100", icon: OverdueIcon },
] as const;
const ATTENTION_KEY: Record<string, keyof Attention> = {
  "Overdue Returns": "overdue_returns",
  "Missing Documents": "missing_documents",
  "Overdue Payments": "overdue_payments",
};
type AttentionTile = "Overdue Returns" | "Missing Documents" | "Overdue Payments";
const AttentionRequired: React.FC<{ side: "skyline" | "vehicles" }> = ({ side }) => {
  const [live, setLive] = useState<Attention | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false); // full-screen overlay while a tile's rows load
  const [open, setOpen] = useState<AttentionTile | null>(null);
  const [missingItems, setMissingItems] = useState<MissingDoc[]>([]);
  const [returnCards, setReturnCards] = useState<AttentionCard[]>([]);
  const [paymentCards, setPaymentCards] = useState<AttentionCard[]>([]);
  useEffect(() => {
    let cancelled = false;
    getAttention(side).then((r) => {
      if (!cancelled) setLive(r);
    });
    return () => {
      cancelled = true;
    };
  }, [side]);
  const daysBadge = (n: number) => `${n} Day${n === 1 ? "" : "s"} Overdue`;
  // Show the normal full-screen overlay spinner first, then open the slider once
  // its rows are in hand (so it opens already filled, never with an inline spinner).
  const openTile = async (tile: AttentionTile) => {
    setLoadingDetail(true);
    try {
      if (tile === "Missing Documents") {
        setMissingItems(await getMissingDocuments(side));
      } else if (tile === "Overdue Returns") {
        const rows = await getOverdueReturns();
        setReturnCards(rows.map((r) => ({
          heading: r.registration,
          sub: r.model,
          lines: [{ label: "Driver", value: r.driver }, { label: "Return Due", value: r.due_date }],
          badge: daysBadge(r.days_overdue),
          hire_id: r.hire_id,
        })));
      } else {
        const rows = await getOverduePayments();
        setPaymentCards(rows.map((r) => ({
          heading: r.registration,
          sub: r.driver,
          lines: [{ label: "Amount", value: r.amount }, { label: "Due", value: r.due_date }],
          badge: daysBadge(r.days_overdue),
          hire_id: r.hire_id,
        })));
      }
      setOpen(tile);
    } finally {
      setLoadingDetail(false);
    }
  };
  return (
    <div className={side === "vehicles" ? "col-span-12 lg:col-span-4 self-start rounded-xl border border-neutral-200 p-5 flex flex-col min-w-0" : "col-span-12"}>
      {loadingDetail && <FleetSpinnerLoader />}
      <h2 className={`text-neutral-900 font-weight-600 ${side === "vehicles" ? "flex items-center h-8 text-xl leading-tight mb-4" : "text-[20px] mb-3"}`}>Attention Required</h2>
      <div className="flex items-stretch gap-4">
        {ATTENTION.filter((a) => side !== "vehicles" || a.label === "Missing Documents").map((a) => (
          <div
            key={a.label}
            onClick={() => openTile(a.label as AttentionTile)}
            className={`${side === "vehicles" ? "w-full" : "flex-1"} rounded-lg border ${a.tint} p-4 flex flex-col gap-2 cursor-pointer hover:shadow-sm transition`}
          >
            <div className="flex items-center gap-4">
              <img src={a.icon} alt="" />
              <div className="flex flex-col">
                <span className="text-neutral-900 text-[24px] font-weight-600">{live ? live[ATTENTION_KEY[a.label]] : a.value}</span>
                <span className="text-neutral-700 text-[14px] font-weight-500">{a.label}</span>
              </div>
            </div>
            <div className="my-2 h-px w-full bg-neutral-200" />
            <p className="text-neutral-500 text-[14px]">{a.label === "Missing Documents" && side === "skyline" ? "Drivers missing required documents" : a.note}</p>
          </div>
        ))}
      </div>
      {open === "Missing Documents" && (
        <FleetMissingDocumentsSlider side={side} items={missingItems} onClose={() => setOpen(null)} />
      )}
      {open === "Overdue Returns" && (
        <FleetAttentionSlider title="Overdue Returns" cards={returnCards} searchPlaceholder="Enter Vehicle Reg" onClose={() => setOpen(null)} />
      )}
      {open === "Overdue Payments" && (
        <FleetAttentionSlider title="Overdue Payments" cards={paymentCards} searchPlaceholder="Enter Vehicle Reg" onClose={() => setOpen(null)} />
      )}
    </div>
  );
};

// ── Task Management (ditto the Claims dashboard "Tasks Details") ──────────────
type Task = { t: string; due: string; od?: boolean };
type TaskCol = { count: number; label: string; icon: string; iconBg: string; border: string; tasks: Task[] };
// Empty skeleton shown before live tasks load / when there are none — the four
// columns at 0, no demo tasks (real counts come from buildTaskCols on the API data).
const TASK_COLS: TaskCol[] = [
  { count: 0, label: "All Tasks", icon: AllTasksIcon, iconBg: "bg-neutral-100", border: "border-neutral-300", tasks: [] },
  { count: 0, label: "Overdue Tasks", icon: OverdueIcon, iconBg: "bg-red-100", border: "border-red-200", tasks: [] },
  { count: 0, label: "Awaiting Response", icon: CriticalIcon, iconBg: "bg-yellow-100", border: "border-amber-200", tasks: [] },
  { count: 0, label: "Pending Followups", icon: PendingFollowupsIcon, iconBg: "bg-neutral-100", border: "border-neutral-300", tasks: [] },
];
// Map a live task to the card's { t, due, od } shape (matches the dummy format).
const fmtTask = (t: FleetTask): Task => {
  const reg = t.vehicle_registration ? ` - ${t.vehicle_registration}` : "";
  let due = "";
  if (t.due_date) {
    const [y, m, d] = t.due_date.split("-");
    due = `Due: ${d}/${m}/${y}`;
    if (t.is_overdue) {
      const days = Math.max(1, Math.round((Date.now() - new Date(`${t.due_date}T00:00:00`).getTime()) / 86400000));
      due += ` · Overdue ${days} Day${days === 1 ? "" : "s"}`;
    }
  }
  return { t: `${t.title}${reg}`, due, od: t.is_overdue };
};
// Derive the four dashboard columns from the live task list. A task can appear in
// several columns (an overdue Pending task shows under All, Overdue and Pending).
const buildTaskCols = (tasks: FleetTask[]): TaskCol[] => {
  const pick = (list: FleetTask[]) => list.slice(0, 6).map(fmtTask);
  const active = tasks.filter((t) => !["Completed", "Rejected"].includes(t.status || ""));
  // Mutually exclusive: an overdue task shows only under Overdue, so nothing is
  // listed in two columns. Pending Followups = pending tasks not yet overdue.
  const overdue = tasks.filter((t) => t.is_overdue);
  const awaiting = tasks.filter((t) => (t.status || "") === "Awaiting Response" && !t.is_overdue);
  const pending = tasks.filter((t) => (t.status || "") === "Pending" && !t.is_overdue);
  // All Tasks lists only what has no column of its own (e.g. In Progress); the
  // Overdue / Awaiting / Pending tasks live under their own headings.
  const uncovered = active.filter((t) => !t.is_overdue && (t.status || "") !== "Awaiting Response" && (t.status || "") !== "Pending");
  return [
    { count: active.length, label: "All Tasks", icon: AllTasksIcon, iconBg: "bg-neutral-100", border: "border-neutral-300", tasks: pick(uncovered) },
    { count: overdue.length, label: "Overdue Tasks", icon: OverdueIcon, iconBg: "bg-red-100", border: "border-red-200", tasks: pick(overdue) },
    { count: awaiting.length, label: "Awaiting Response", icon: CriticalIcon, iconBg: "bg-yellow-100", border: "border-amber-200", tasks: pick(awaiting) },
    { count: pending.length, label: "Pending Followups", icon: PendingFollowupsIcon, iconBg: "bg-neutral-100", border: "border-neutral-300", tasks: pick(pending) },
  ];
};
const TaskManagement: React.FC<{ module: string }> = ({ module }) => {
  // Live tasks (all users in the tenant) for this dashboard's module (skyline /
  // vehicles); falls back to the TASK_COLS placeholders if none / unreachable.
  const [cols, setCols] = useState<TaskCol[] | null>(null);
  useEffect(() => {
    let cancelled = false;
    listFleetTasks({ module, all_users: true }).then((tasks) => {
      if (cancelled) return;
      setCols(tasks && tasks.length ? buildTaskCols(tasks) : null);
    });
    return () => {
      cancelled = true;
    };
  }, [module]);
  const data = cols ?? TASK_COLS;
  return (
    <div className="col-span-12">
      <h2 className="text-neutral-900 text-[20px] font-weight-600 mb-4">Task Management</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        {data.map((col) => (
        <div key={col.label} className="rounded-xl border border-neutral-200 p-4 flex flex-col gap-4 min-w-0">
          <button type="button" className="flex items-center gap-3 text-left">
            <span className={`w-10 h-10 rounded ${col.iconBg} flex items-center justify-center shrink-0`}>
              <img src={col.icon} alt="" />
            </span>
            <div className="flex flex-col">
              <span className="text-neutral-900 text-xl font-weight-600 leading-6">{col.count}</span>
              <span className="text-neutral-500 text-xs">{col.label}</span>
            </div>
          </button>
          <div className="flex flex-col gap-3 max-h-[440px] overflow-auto pr-1">
            {col.tasks.length === 0 ? (
              <div className="text-neutral-400 text-xs py-6 text-center border border-dashed border-neutral-200 rounded-md">
                No tasks here.
              </div>
            ) : (
              col.tasks.map((t, i) => (
                <button key={i} type="button" className={`w-full text-left bg-white rounded-md border ${col.border} p-3 flex flex-col gap-1.5 hover:shadow-sm transition`}>
                  <span className="text-neutral-900 text-sm font-weight-500 line-clamp-1">{t.t}</span>
                  <span className={`text-xs ${t.od ? "text-red-500" : "text-neutral-400"}`}>{t.due}</span>
                </button>
              ))
            )}
          </div>
        </div>
      ))}
    </div>
  </div>
  );
};

// ── Top stat cards (icons + backgrounds taken from the Claims dashboard) ───────
// ── Fleet Performance (3 headline metrics, live from /dashboard/stats) ─────────
// Claim-side stat-card icons, recoloured to a dark black-grey (they ship blue).
const FP_ICON_FILTER = { filter: "brightness(0) invert(0.2)" } as const;
const FP_URGENT_ICON_FILTER = {
  filter: "brightness(0) saturate(100%) invert(36%) sepia(95%) saturate(2285%) hue-rotate(337deg) brightness(97%) contrast(93%)",
} as const;
const FP_META: Record<string, { icon: React.ReactNode; bar: string }> = {
  vehicles_on_hire: { icon: <img src={FileStatIcon} alt="" className="w-4 h-4" style={FP_ICON_FILTER} />, bar: "bg-neutral-700" },
  net_income: { icon: <img src={PoundStatIcon} alt="" className="w-4 h-4" style={FP_ICON_FILTER} />, bar: "bg-emerald-500" },
  fleet_availability: { icon: <img src={CarsStatIcon} alt="" className="w-4 h-4" style={FP_ICON_FILTER} />, bar: "bg-violet-500" },
  urgent_alerts: { icon: <img src={UrgentStatIcon} alt="" className="w-4 h-4" style={FP_URGENT_ICON_FILTER} />, bar: "bg-red-500" },
};
// Order the Fleet Performance cards, urgent alerts last.
const FP_ORDER = ["vehicles_on_hire", "net_income", "fleet_availability", "urgent_alerts"];
type FPCard = { key: string; label: string; value: string; pct: string; up: boolean; sub: string; progress: number };
// Zero placeholders — shown only if /dashboard/stats doesn't return. No fake numbers:
// a fleet with no data reads 0, not invented figures.
const FP_FALLBACK: FPCard[] = [
  { key: "vehicles_on_hire", label: "Vehicles on Hire", value: "0", pct: "0", up: true, sub: "of 0 active vehicles", progress: 0 },
  { key: "net_income", label: "Net Income", value: "£0", pct: "0", up: true, sub: "Month to date", progress: 0 },
  { key: "fleet_availability", label: "Fleet Availability", value: "0%", pct: "0", up: true, sub: "0 vehicles available now", progress: 0 },
  { key: "urgent_alerts", label: "Urgent Alerts", value: "0", pct: "0", up: true, sub: "needs attention", progress: 0 },
];
const FleetPerformance: React.FC<{ period: string; side?: string }> = ({ period, side }) => {
  const [live, setLive] = useState<FPCard[] | null>(null);
  const [compare, setCompare] = useState("vs last month");
  // Loader while a period switch (WTD/MTD/YTD) refetches, so the delay reads as
  // "working", not "nothing happened".
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getStats(period).then((r) => {
      if (cancelled || !r) return;
      setCompare(r.compare_label);
      const byKey = new Map(r.cards.map((c) => [c.key, c]));
      setLive(
        FP_ORDER.flatMap((k) => {
          const c = byKey.get(k);
          return c ? [{ key: c.key, label: c.label.replace(/\s*\(.*\)$/, ""), value: c.value, pct: c.pct, up: c.up, sub: c.sub, progress: c.progress }] : [];
        }),
      );
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [period]);
  // On Vehicle Management only Fleet Availability + Urgent Alerts are relevant.
  const all = live ?? FP_FALLBACK;
  const data = side === "vehicles" ? all.filter((c) => c.key === "fleet_availability" || c.key === "urgent_alerts") : all;
  return (
    <div className="col-span-12 bg-white rounded-xl shadow-[0px_1px_3px_0px_rgba(0,0,0,0.05)] border border-neutral-200 overflow-hidden">
      {loading && <FleetSpinnerLoader />}
      <div className="px-5 py-4 border-b border-neutral-100">
        <h3 className="text-xl font-weight-600 text-neutral-900 leading-tight">Fleet Performance</h3>
      </div>
      <div className={`p-5 grid grid-cols-1 sm:grid-cols-2 ${data.length <= 2 ? "lg:grid-cols-2" : "lg:grid-cols-4"} gap-4`}>
        {data.map((c) => (
          <div key={c.key} className="rounded-lg border border-neutral-200 p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="w-9 h-9 bg-neutral-100 rounded-lg inline-flex items-center justify-center">{FP_META[c.key]?.icon}</span>
              <img src={c.up ? TrendingUp : TrendingDown} alt="" className="w-11 h-11" />
            </div>
            <div className="text-neutral-900 text-2xl font-weight-600 leading-7 tabular-nums">{c.value}</div>
            <div className="text-neutral-500 text-xs">{c.label}</div>
            <div className="h-px w-full bg-neutral-200" />
            <div className="flex items-center gap-2">
              <span className={`flex items-center gap-1 shrink-0 whitespace-nowrap rounded px-2 py-1 text-sm font-weight-600 ${c.up ? "bg-green-100 text-green-500" : "bg-red-100 text-red-500"}`}>
                <img src={c.up ? TrendingUp : TrendingDown} alt="" className="w-3.5 h-3.5 shrink-0" />{c.pct}%
              </span>
              <span className="text-xs font-weight-500 text-neutral-500 leading-tight">{compare}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ── Skyline Operations (matches the Claims dashboard's Skyline Operations) ─────
type SkyKey = "available" | "hire" | "off" | "repair" | "sale";
type SkyVehicle = { registration: string; model: string; statusKey: SkyKey; statusLabel: string; hireInfo?: string; customer?: string; offHiredToday?: boolean };
// The "Off Hire" chip is a *daily* filter: it selects vehicles off-hired today (which are
// now Available, shown with their Available tag), not a status. Every other chip matches statusKey.
const skyMatches = (v: SkyVehicle, key: string) => (key === "off" ? !!v.offHiredToday : v.statusKey === key);
const SKY_STATUS_STYLE: Record<SkyKey, string> = {
  available: "bg-green-100 text-green-700", hire: "bg-neutral-100 text-neutral-800",
  off: "bg-teal-100 text-teal-700", repair: "bg-orange-100 text-orange-500",
  sale: "bg-pink-100 text-pink-700",
};
const SkyVehicleCard: React.FC<{ v: SkyVehicle }> = ({ v }) => (
  <div className="flex min-h-32 flex-1 items-start justify-between rounded-lg border border-neutral-200 bg-neutral-50 p-4">
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h3 className="text-sm font-weight-500 text-black">{v.registration}</h3>
        <p className="text-xs font-weight-400 font-normal text-neutral-700">{v.model}</p>
      </div>
      {v.hireInfo && (
        <div className="flex flex-col gap-1">
          <p className="text-xs font-weight-400 font-normal text-neutral-700">{v.hireInfo}</p>
          {v.customer && <p className="text-xs font-weight-400 font-normal text-neutral-500">{v.customer}</p>}
        </div>
      )}
    </div>
    <span className={`inline-flex h-fit w-fit shrink-0 items-center justify-center rounded px-2 py-1 text-xs font-weight-400 font-normal leading-4 ${SKY_STATUS_STYLE[v.statusKey]}`}>{v.statusLabel}</span>
  </div>
);
// Right-side drawer showing every vehicle card (opened by "View All Vehicles").
const SkylineVehiclesSlider: React.FC<{
  vehicles: SkyVehicle[]; // full list; the slider filters it by the status chips
  summary: { label: string; value: number; statusKey: string; className: string }[];
  statusSel: string[];
  onToggleStatus: (key: string) => void;
  onClose: () => void;
}> = ({ vehicles, summary, statusSel, onToggleStatus, onClose }) => {
  const shown = vehicles.filter((v) => !statusSel.length || statusSel.some((k) => skyMatches(v, k)));
  return (
    <div className="fixed inset-0 z-[60] flex justify-end font-['Stack_Sans_Headline']">
      <div className="flex-1 bg-black/30" onClick={onClose} />
      <div className="w-[920px] max-w-full bg-white h-full flex flex-col p-10 gap-6">
        <div className="flex justify-between items-start">
          <h2 className="text-black text-2xl font-weight-600 leading-6">Skyline Vehicles</h2>
          <button type="button" onClick={onClose} className="px-10 py-4 bg-neutral-900 rounded text-white text-base font-weight-500 leading-4 hover:bg-black">Close</button>
        </div>
        <div className="h-px bg-neutral-100 w-full" />
        <div className="flex flex-wrap justify-between items-center gap-4">
          <div className="flex flex-col gap-1">
            <p className="text-2xl font-weight-600 leading-6 text-black">{vehicles.length} Vehicles</p>
            <p className="text-sm font-weight-500 text-zinc-500">Total Fleet</p>
          </div>
          {/* Status chips double as filters — click to narrow the list (same as the main card). */}
          <div className="flex flex-wrap items-center gap-2">
            {summary.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => onToggleStatus(item.statusKey)}
                className={`rounded p-3 text-sm font-weight-400 font-normal leading-4 transition ${item.className} ${statusSel.includes(item.statusKey) ? "ring-2 ring-offset-1 ring-neutral-400" : statusSel.length ? "opacity-50 hover:opacity-100" : "hover:opacity-80"}`}
              >
                {item.label} {item.value}
              </button>
            ))}
          </div>
        </div>
        {shown.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-sm text-neutral-400">No vehicles match.</div>
        ) : (
          <div className="flex-1 overflow-auto grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 auto-rows-min">
            {shown.map((v, i) => <SkyVehicleCard key={`${v.registration}-${i}`} v={v} />)}
          </div>
        )}
      </div>
    </div>
  );
};
const SkylineOperations: React.FC = () => {
  const [regSel, setRegSel] = useState<string[]>([]);
  const [statusSel, setStatusSel] = useState<string[]>([]);
  const [dateSel, setDateSel] = useState<string[]>([]);
  const [sliderOpen, setSliderOpen] = useState(false); // "View All" opens a right-side drawer
  // Live vehicle list (empty when the fleet has no vehicles). No demo fallback —
  // the section reflects reality, so deleting vehicles clears it.
  const [vehicles, setVehicles] = useState<SkyVehicle[] | null>(null);
  useEffect(() => {
    let cancelled = false;
    getFleetVehicles().then((r) => {
      if (!cancelled) setVehicles(r as SkyVehicle[] | null);
    });
    return () => {
      cancelled = true;
    };
  }, []);
  const data = vehicles ?? [];
  const toggle = (setter: React.Dispatch<React.SetStateAction<string[]>>, val: string) =>
    setter((s) => (s.includes(val) ? s.filter((x) => x !== val) : [...s, val]));
  const regOptions = data.map((v) => ({ label: v.registration, value: v.registration }));
  const statusOptions = [{ label: "Available", value: "available" }, { label: "On Hire", value: "hire" }, { label: "Off Hire", value: "off" }, { label: "In Repair", value: "repair" }, { label: "For Sale", value: "sale" }];
  const dateOptions = [{ label: "Today", value: "today" }, { label: "1 Week", value: "1w" }, { label: "1 Month", value: "1m" }];
  // Counts derived from the actual vehicle list so the total, the status chips and
  // the "View All" slider always reconcile.
  const countBy = (k: SkyKey) => data.filter((v) => skyMatches(v, k)).length;
  const summaryItems = [
    { label: "Available", value: countBy("available"), statusKey: "available", className: "bg-green-100 text-green-700" },
    { label: "On Hire", value: countBy("hire"), statusKey: "hire", className: "bg-neutral-100 text-neutral-800" },
    { label: "Off Hire", value: countBy("off"), statusKey: "off", className: "bg-teal-100 text-teal-700" },
    { label: "In Repair", value: countBy("repair"), statusKey: "repair", className: "bg-orange-100 text-orange-500" },
    { label: "For Sale", value: countBy("sale"), statusKey: "sale", className: "bg-pink-100 text-pink-700" },
  ];
  const filtered = data.filter((v) => (!regSel.length || regSel.includes(v.registration)) && (!statusSel.length || statusSel.some((k) => skyMatches(v, k))));
  const visible = filtered.slice(0, 8);
  return (
    <section className="col-span-12 w-full rounded-lg border border-neutral-200 px-4 py-6 min-w-0">
      <div className="flex flex-col gap-10">
        <h2 className="text-xl font-weight-600 leading-5 text-black">Skyline Vehicles</h2>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-8">
              <div className="flex flex-col gap-1">
                <p className="text-2xl font-weight-600 leading-6 text-black">{data.length} Vehicles</p>
                <p className="text-sm font-weight-500 text-zinc-500">Total Fleet</p>
              </div>
              <div className="flex items-center gap-5">
                <FleetMultiSelectFilter label="Registration" options={regOptions} selected={regSel} onToggle={(v) => toggle(setRegSel, v)} onClear={() => setRegSel([])} />
                <FleetMultiSelectFilter label="Status" options={statusOptions} selected={statusSel} onToggle={(v) => toggle(setStatusSel, v)} onClear={() => setStatusSel([])} />
                <FleetMultiSelectFilter label="Date" options={dateOptions} selected={dateSel} onToggle={(v) => toggle(setDateSel, v)} onClear={() => setDateSel([])} />
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {summaryItems.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => toggle(setStatusSel, item.statusKey)}
                  className={`rounded p-3 text-sm font-weight-400 font-normal leading-4 transition ${item.className} ${statusSel.includes(item.statusKey) ? "ring-2 ring-offset-1 ring-neutral-400" : statusSel.length ? "opacity-50 hover:opacity-100" : "hover:opacity-80"}`}
                >
                  {item.label} {item.value}
                </button>
              ))}
            </div>
          </div>
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-sm text-neutral-400">{data.length === 0 ? "No vehicles in the fleet yet." : "No fleet vehicles match."}</div>
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
              {visible.map((v, i) => <SkyVehicleCard key={`${v.registration}-${i}`} v={v} />)}
            </div>
          )}
          {filtered.length > 8 && (
            <div className="flex justify-center pt-4">
              <button type="button" onClick={() => setSliderOpen(true)} className="inline-flex h-8 items-center justify-center rounded bg-neutral-900 px-3 py-2 text-sm font-weight-400 font-normal leading-4 text-white transition hover:bg-black">View All Vehicles</button>
            </div>
          )}
        </div>
      </div>
      {sliderOpen && <SkylineVehiclesSlider vehicles={data} summary={summaryItems} statusSel={statusSel} onToggleStatus={(k) => toggle(setStatusSel, k)} onClose={() => setSliderOpen(false)} />}
    </section>
  );
};

// ── Expiry cards + Compliance Summary ─────────────────────────────────────────
// These icons are 28×28 and include their own rounded background box, so they
// render directly (no SkyIconBox wrapper) in the carousel cards.
const plate = <img src={PlateIcon} alt="" className="size-8" />;
const motIcon = <img src={MOTIcon} alt="" className="size-8" />;
const roadIcon = <img src={RoadTaxIcon} alt="" className="size-8" />;
const serviceIcon = <img src={ServiceIcon} alt="" className="size-8" />;

type Expiry = { span: string; icon: React.ReactNode; title: string; tabs: [string, string, string][]; head: string[]; rows: (string | [string, string])[][]; buckets?: Record<string, (string | [string, string])[][]>; bucketKeys?: string[] };
// Tab order → bucket key for the live expiry cards (parallel to buildExpiryCard's tabs).
const EXPIRY_BUCKETS = ["expired", "today", "d7", "d30"];
// Servicing Due is a mileage placeholder; give it bucketed rows so its tabs filter too.
// Cleared for now — Servicing Due shows no rows until it's wired to live data.
const SERVICING_BUCKETS: Record<string, (string | [string, string])[][]> = {
  overdue: [],
  weekly: [],
  monthly: [],
};
const EXPIRY: Expiry[] = [
  { span: "col-span-12 lg:col-span-6", icon: serviceIcon, title: "Servicing Due", tabs: [["red", "Overdue", "0"], ["orange", "Weekly", "0"], ["violet", "Monthly", "0"]], bucketKeys: ["overdue", "weekly", "monthly"], head: ["Vehicle", "Current Mileage", "Overdue", "Driver"], buckets: SERVICING_BUCKETS, rows: [...SERVICING_BUCKETS.overdue, ...SERVICING_BUCKETS.weekly, ...SERVICING_BUCKETS.monthly] },
  { span: "col-span-12 md:col-span-6 xl:col-span-4", icon: motIcon, title: "MOT Expiry", tabs: [["red", "Expired", "2"], ["gray", "Today", "1"], ["orange", "7 Days", "5"], ["violet", "30 Days", "13"]], head: ["Vehicle", "Expiry Date", "Remaining Days"], rows: [
    ["BX68 YZO", "12 May 2025", ["Expired", "red"]], ["VU18 KXL", "10 May 2025", ["Expired", "red"]], ["YL24 HBG", "13 May 2025", ["Today", "orange"]], ["FP21 KJU", "17 May 2025", ["4 days", "orange"]], ["MJ23 XTD", "18 May 2025", ["5 days", "orange"]]] },
  { span: "col-span-12 md:col-span-6 xl:col-span-4", icon: plate, title: "Plate Expiry", tabs: [["red", "Expired", "1"], ["orange", "7 Days", "3"], ["violet", "30 Days", "9"]], head: ["Vehicle", "Expiry Date", "Remaining Days"], rows: [
    ["HN19 KTP", "9 May 2025", ["Expired", "red"]], ["BC21 LMW", "14 May 2025", ["2 days", "orange"]], ["TF70 XRD", "16 May 2025", ["3 days", "orange"]], ["MK22 VBS", "19 May 2025", ["6 days", "orange"]], ["GL68 PNC", "27 May 2025", ["14 days", "green"]]] },
  { span: "col-span-12 md:col-span-6 xl:col-span-4", icon: roadIcon, title: "Road Fund Licence", tabs: [["red", "Expired", "1"], ["orange", "7 Days", "4"], ["violet", "30 Days", "10"]], head: ["Vehicle", "Expiry Date", "Remaining Days"], rows: [
    ["YC67 BMO", "11 May 2025", ["Expired", "red"]], ["GU24 VPL", "16 May 2025", ["3 days", "orange"]], ["FN22 TYG", "17 May 2025", ["4 days", "orange"]], ["PL73 HNZ", "19 May 2025", ["6 days", "orange"]], ["WA72 FFE", "25 May 2025", ["12 days", "green"]]] },
];
// Build one live expiry card from the API shape (MOT / Plate / Road Fund).
const buildExpiryCard = (title: string, icon: React.ReactNode, span: string, card: Expiries["mot"]): Expiry => ({
  span, icon, title,
  tabs: [
    ["red", "Expired", String(card.tabs.expired)],
    ["gray", "Today", String(card.tabs.today)],
    ["orange", "7 Days", String(card.tabs.d7)],
    ["violet", "30 Days", String(card.tabs.d30)],
  ],
  head: ["Vehicle", "Expiry Date", "Remaining Days", "Driver"],
  rows: [...card.rows.expired, ...card.rows.today, ...card.rows.d7, ...card.rows.d30],
  buckets: card.rows,
  bucketKeys: EXPIRY_BUCKETS,
});
// Expiries carousel — always flows one direction (cards are triplicated so the
// motion never reverses). Servicing Due stays a mileage placeholder; the other
// three are live.
const CAROUSEL = [EXPIRY[0], EXPIRY[1], EXPIRY[2], EXPIRY[3]];
// Right-side drawer showing the full record set for one expiry card.
const RecordsSlider: React.FC<{
  title: string;
  head: string[];
  rows: (string | [string, string])[][];
  onClose: () => void;
  variant?: "table" | "cards";
}> = ({ title, head, rows, onClose, variant = "table" }) => (
  <div className="fixed inset-0 z-[60] flex justify-end font-['Stack_Sans_Headline']">
    <div className="flex-1 bg-black/30" onClick={onClose} />
    <div className={`${variant === "cards" ? "w-[920px]" : "w-[860px]"} max-w-full bg-white h-full flex flex-col p-10 gap-5`}>
      <div className="flex justify-between items-start">
        <h2 className="text-black text-2xl font-weight-600 leading-6">{title}</h2>
        <button type="button" onClick={onClose} className="px-10 py-4 bg-neutral-900 rounded text-white text-base font-weight-500 leading-4 hover:bg-black">Close</button>
      </div>
      <div className="h-px bg-neutral-100 w-full" />
      <div className="text-black text-xl font-weight-600 leading-5">{rows.length} Records</div>
      <div className="flex-1 overflow-auto">
        {variant === "cards" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {rows.map((r, i) => {
              const status = r.find((c) => Array.isArray(c)) as [string, string] | undefined;
              return (
                <div key={i} className="rounded-lg border border-neutral-200 p-4 flex flex-col gap-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-neutral-900 text-sm font-weight-600 truncate">{typeof r[0] === "string" ? r[0] : r[0]?.[0]}</span>
                    {status && <span className={`shrink-0 rounded px-2 py-1 text-xs font-weight-500 ${TP[status[1]] ?? "bg-neutral-100 text-neutral-600"}`}>{status[0]}</span>}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {r.slice(1).map((c, j) => Array.isArray(c) ? null : (
                      <div key={j} className="flex items-center justify-between text-xs">
                        <span className="text-neutral-400">{head[j + 1]}</span>
                        <span className="text-neutral-700 font-weight-500 text-right">{c}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <DataTable head={head} rows={rows} headText="text-neutral-900 font-weight-400" cellText="text-neutral-500" cellClamp="whitespace-nowrap" />
        )}
      </div>
    </div>
  </div>
);
const CAROUSEL_GAP = 24; // matches the track's gap-6
const ExpiryCarousel: React.FC = () => {
  const [expiries, setExpiries] = useState<Expiries | null>(null);
  // Active bucket filter per card (keyed by title so all copies in the loop sync).
  const [filters, setFilters] = useState<Record<string, string | null>>({});
  // "View All" opens a right-side slider with the full record set for that card.
  const [sliderData, setSliderData] = useState<{ title: string; head: string[]; rows: (string | [string, string])[][] } | null>(null);
  const paused = Object.values(filters).some(Boolean) || sliderData !== null;
  useEffect(() => {
    let cancelled = false;
    getExpiries().then((r) => {
      if (!cancelled) setExpiries(r);
    });
    return () => {
      cancelled = true;
    };
  }, []);
  const cards: Expiry[] = expiries
    ? [
        buildExpiryCard("Servicing Due", EXPIRY[0].icon, EXPIRY[0].span, expiries.service),
        buildExpiryCard("MOT Expiry", motIcon, EXPIRY[1].span, expiries.mot),
        buildExpiryCard("Plate Expiry", plate, EXPIRY[2].span, expiries.plate),
        buildExpiryCard("Road Fund Licence", roadIcon, EXPIRY[3].span, expiries.road_fund),
      ]
    : CAROUSEL;
  const track = [...cards, ...cards, ...cards];
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(cards.length); // start in the middle set
  const [cardW, setCardW] = useState(0);
  const [animate, setAnimate] = useState(false);
  const stepW = cardW + CAROUSEL_GAP;

  // Fit exactly `per` cards to the viewport with an INTEGER pixel width, so every
  // card edge and every slide step lands on a whole pixel — no sub-pixel rounding
  // that shaves the edge card (the old calc((100% - …)/3) basis did). Re-measured
  // on any width change via ResizeObserver.
  useLayoutEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    let raf = 0;
    const measure = () => {
      const w = el.clientWidth;
      if (w <= 0) {
        // Viewport not laid out yet (e.g. still behind the page loader) — retry
        // next frame so the cards don't stay stuck at width 0 (invisible).
        raf = requestAnimationFrame(measure);
        return;
      }
      const per = window.innerWidth >= 1024 ? 3 : window.innerWidth >= 640 ? 2 : 1;
      const cw = Math.floor((w - (per - 1) * CAROUSEL_GAP) / per);
      if (cw > 0) setCardW(cw);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener("resize", measure);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  // Re-enable the transition the frame after any non-animated (snap) reposition,
  // including the initial jump into the middle set.
  useEffect(() => {
    if (!animate) {
      const r = requestAnimationFrame(() => setAnimate(true));
      return () => cancelAnimationFrame(r);
    }
  }, [animate]);

  const advance = useCallback((delta: number) => {
    setAnimate(true);
    setIndex((i) => i + delta);
  }, []);

  useEffect(() => {
    if (paused) return; // pause autoplay while a card is filtered or the slider is open
    const id = setInterval(() => advance(1), 7000);
    return () => clearInterval(id);
  }, [advance, paused]);

  // When a slide finishes on an edge copy, jump back into the middle set with no
  // animation so the motion always continues in one seamless direction. Guard
  // against transitions that bubble up from child elements (card hovers, tooltip
  // fades) — only the track's own transform slide may trigger the snap, otherwise
  // stray events decrement index repeatedly and translate the track off-screen
  // (the "completely white" flash).
  const onSettled = (e: React.TransitionEvent) => {
    if (e.target !== trackRef.current || e.propertyName !== "transform") return;
    if (index >= cards.length * 2) {
      setAnimate(false);
      setIndex((i) => i - cards.length);
    } else if (index < cards.length) {
      setAnimate(false);
      setIndex((i) => i + cards.length);
    }
  };

  const arrow = (dir: "l" | "r") => (
    <button type="button" aria-label={dir === "l" ? "Previous" : "Next"} onClick={() => advance(dir === "l" ? -1 : 1)}
      className={`absolute top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white border border-neutral-100 shadow-md grid place-items-center text-[#9A9EB2] hover:text-neutral-600 transition-colors ${dir === "l" ? "-left-3" : "-right-3"}`}>
      <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6">
        <path d="M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {dir === "l" ? (
          <><path d="M5 12L11 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><path d="M5 12L11 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></>
        ) : (
          <><path d="M19 12L13 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><path d="M19 12L13 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></>
        )}
      </svg>
    </button>
  );
  return (
    <div className="col-span-12">
      <div className="relative">
        {arrow("l")}
        <div ref={viewportRef} className="overflow-hidden">
          <div ref={trackRef} onTransitionEnd={onSettled}
            className="flex items-stretch gap-6"
            style={{ transform: `translateX(-${index * stepW}px)`, transition: animate ? "transform 0.45s ease" : "none" }}>
            {track.map((e, i) => {
              const active = filters[e.title] ?? null;
              const rows = e.buckets && active ? e.buckets[active] : e.rows;
              const displayRows = rows.slice(0, 5);
              // Driver only shows in the "View All" slider — drop that trailing
              // column from the compact carousel card.
              const hasDriver = e.head[e.head.length - 1] === "Driver";
              const cardHead = hasDriver ? e.head.slice(0, -1) : e.head;
              const cardRows = hasDriver ? displayRows.map((r) => r.slice(0, -1)) : displayRows;
              return (
                <div key={i} className="shrink-0 min-w-0" style={{ width: cardW }}>
                  <div className="rounded-xl border border-neutral-200 p-6 flex flex-col min-w-0 h-full min-h-[360px] gap-1">
                    <CardHead
                      icon={e.icon}
                      title={e.title}
                      right={<button type="button" onClick={() => setSliderData({ title: e.title, head: e.head, rows })} className="inline-flex h-8 items-center justify-center rounded bg-neutral-900 px-3 py-2 text-sm font-weight-400 font-normal leading-4 text-white transition hover:bg-black whitespace-nowrap">View All</button>}
                    />
                    {e.buckets ? (
                      <div className="flex flex-wrap gap-1.5 mb-3.5">
                        {e.tabs.map(([tone, label, count], ti) => {
                          const bkey = e.bucketKeys?.[ti] ?? "";
                          return (
                            <button
                              key={label}
                              type="button"
                              onClick={() => setFilters((f) => ({ ...f, [e.title]: f[e.title] === bkey ? null : bkey }))}
                              className={`rounded px-2 py-1.5 text-xs font-weight-400 font-normal leading-4 transition ${TP[tone]} ${active === bkey ? "ring-2 ring-offset-1 ring-neutral-400" : active ? "opacity-50 hover:opacity-100" : "hover:opacity-80"}`}
                            >
                              {label} {count}
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <TabPills tabs={e.tabs} />
                    )}
                    <div className="overflow-x-auto"><DataTable head={cardHead} rows={cardRows} headText="text-neutral-700 font-normal" cellText="text-neutral-500" rowClass="py-4" /></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        {arrow("r")}
      </div>
      {sliderData && <RecordsSlider title={sliderData.title} head={sliderData.head} rows={sliderData.rows} variant="cards" onClose={() => setSliderData(null)} />}
    </div>
  );
};

type Comp = { title: string; icon: React.ReactNode; overdue: number; bar: number; d7: number; d30: number };
const COMPLIANCE: Comp[] = [
  { title: "MOT", icon: <img src={MOTIcon} alt="" className="size-8" />, overdue: 0, bar: 0, d7: 0, d30: 0 },
  { title: "Plate", icon: <img src={PlateIcon} alt="" className="size-8" />, overdue: 0, bar: 0, d7: 0, d30: 0 },
  { title: "Road Fund Licence", icon: <img src={RoadTaxIcon} alt="" className="size-8" />, overdue: 0, bar: 0, d7: 0, d30: 0 },
  { title: "Service", icon: <img src={ServiceIcon} alt="" className="size-8" />, overdue: 0, bar: 0, d7: 0, d30: 0 },
];
const ComplianceSummary: React.FC = () => {
  // Live per-category compliance (matched by title); keeps the icons defined here.
  const [live, setLive] = useState<Compliance | null>(null);
  useEffect(() => {
    let cancelled = false;
    getCompliance().then((r) => {
      if (!cancelled) setLive(r);
    });
    return () => {
      cancelled = true;
    };
  }, []);
  const byTitle = new Map((live?.categories ?? []).map((c) => [c.title, c]));
  const data = COMPLIANCE.map((c) => {
    const l = byTitle.get(c.title);
    return l
      ? { ...c, overdue: l.overdue, bar: l.bar, d7: l.d7, d30: l.d30, total: l.total, compliant: l.compliant, amber: l.amber }
      : { ...c, total: 0, compliant: 0, amber: 0 };
  });
  return (
    <div className="col-span-12">
      {/* Category cards */}
      <div className="grid grid-cols-4 gap-3">
        {data.map((c) => (
          <div key={c.title} className="bg-white rounded-xl shadow-[0px_1px_4px_0px_rgba(0,0,0,0.05)] border border-neutral-200 px-5 pt-5 pb-4 flex flex-col">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                {c.icon}
                <h4 className="text-neutral-900 text-sm font-weight-600 leading-5 truncate">{c.title}</h4>
              </div>
              <span className="px-2 py-0.5 bg-neutral-100 rounded-full text-neutral-500 text-xs font-weight-600 leading-4 shrink-0">{c.total} total</span>
            </div>
            {/* Bar maps to the three stat boxes: red = overdue, orange = due within 7d,
                amber = due within 30d; the emerald track shows the compliant remainder. */}
            <div className="mt-4 h-1.5 bg-emerald-100 rounded flex gap-px overflow-hidden">
              <span className="bg-red-500 h-full" style={{ width: `${((c.overdue || 0) / (c.total || 1)) * 100}%` }} />
              <span className="bg-orange-400 h-full" style={{ width: `${((c.d7 || 0) / (c.total || 1)) * 100}%` }} />
              <span className="bg-amber-300 h-full" style={{ width: `${(Math.max(0, (c.d30 || 0) - (c.d7 || 0)) / (c.total || 1)) * 100}%` }} />
            </div>
            <div className="mt-3.5 grid grid-cols-3 gap-2">
              <div className="bg-red-50 rounded-lg outline outline-1 outline-offset-[-1px] outline-red-200 px-2 py-2.5 flex flex-col items-center">
                <span className="text-red-600 text-xl font-weight-600 leading-5 tabular-nums">{c.overdue}</span>
                <span className="text-red-600 text-[10px] font-weight-500 uppercase tracking-tight mt-1">Overdue</span>
              </div>
              <div className="bg-amber-50 rounded-lg outline outline-1 outline-offset-[-1px] outline-amber-200 px-2 py-2.5 flex flex-col items-center">
                <span className="text-amber-800 text-xl font-weight-600 leading-5 tabular-nums">{c.d7}</span>
                <span className="text-amber-600 text-[10px] font-weight-500 uppercase tracking-tight mt-1">7 Days</span>
              </div>
              <div className="bg-neutral-50 rounded-lg outline outline-1 outline-offset-[-1px] outline-neutral-200 px-2 py-2.5 flex flex-col items-center">
                <span className="text-neutral-700 text-xl font-weight-600 leading-5 tabular-nums">{c.d30}</span>
                <span className="text-neutral-400 text-[10px] font-weight-500 uppercase tracking-tight mt-1">30 Days</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ── Weekly Payment Schedule ───────────────────────────────────────────────────
type WPBucket = keyof WeeklyPayments["rows"];
const WP_TABS: { key: WPBucket; tone: string; label: string }[] = [
  { key: "due_today", tone: "gray", label: "Due Today" },
  { key: "due_this_week", tone: "yellow", label: "Due This Week" },
  { key: "overdue", tone: "red", label: "Overdue" },
  { key: "received_today", tone: "green", label: "Received Today" },
];
// Empty/zero placeholders — no invented payments when /dashboard/weekly-payments is unavailable.
const WP_FALLBACK_ROWS: (string | [string, string])[][] = [];
const WP_FALLBACK_COUNTS: WeeklyPayments["tabs"] = { due_today: 0, due_this_week: 0, overdue: 0, received_today: 0, all: 0 };
const WP_FALLBACK_SUMMARY: PaymentSummary = {
  total: "£0", overdue: "£0", due_today: "£0", received: "£0",
  by_day: [
    { day: "Mon", amount: 0 }, { day: "Tue", amount: 0 }, { day: "Wed", amount: 0 },
    { day: "Thu", amount: 0 }, { day: "Fri", amount: 0 }, { day: "Sat", amount: 0 }, { day: "Sun", amount: 0 },
  ],
};

// Left-hand roll-up panel: total this week + owed/received breakdown + a per-weekday
// mini chart. Grey-toned to match the Fleet theme; uses the app's own fonts.
const WPSummary: React.FC<{ s: PaymentSummary }> = ({ s }) => {
  const max = Math.max(1, ...s.by_day.map((d) => d.amount));
  const rows: [string, string, string][] = [
    ["Overdue", s.overdue, "text-red-600"],
    ["Due Today", s.due_today, "text-amber-600"],
    ["Received", s.received, "text-green-600"],
  ];
  return (
    <aside className="flex-[2] min-w-0 bg-neutral-50 border border-neutral-100 rounded-lg p-4 flex flex-col gap-4">
      <div>
        <div className="text-2xl font-weight-600 text-neutral-900 tabular-nums leading-tight">{s.total}</div>
        <div className="text-xs text-neutral-400 mt-1">Total this week</div>
      </div>
      <div className="flex flex-col gap-2">
        {rows.map(([label, value, tone]) => (
          <div key={label} className="flex items-center justify-between">
            <span className="text-xs text-neutral-400">{label}</span>
            <span className={`text-xs font-weight-500 tabular-nums ${tone}`}>{value}</span>
          </div>
        ))}
      </div>
      <div className="mt-auto">
        <div className="flex items-end gap-1 h-20">
          {s.by_day.map((d) => (
            // Full-height hover target so even short/empty bars show their amount.
            <div key={d.day} className="group relative flex-1 h-full flex items-end justify-center">
              <div
                className={`w-full rounded-sm transition-colors ${d.amount === max ? "bg-neutral-400" : "bg-neutral-200"} group-hover:bg-neutral-500`}
                style={{ height: `${Math.max(4, (d.amount / max) * 100)}%` }}
              />
              <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1 z-10 whitespace-nowrap rounded bg-neutral-900 px-1.5 py-0.5 text-[10px] text-white shadow opacity-0 transition group-hover:opacity-100">
                {d.day}: £{d.amount.toLocaleString()}
              </div>
            </div>
          ))}
        </div>
        <div className="flex mt-1.5">
          {s.by_day.map((d) => <span key={d.day} className="flex-1 text-center text-[9px] text-neutral-400">{d.day[0]}</span>)}
        </div>
      </div>
    </aside>
  );
};
const WeeklyPayment: React.FC = () => {
  // Live cross-hire schedule; the four tabs filter the table to a single bucket
  // (click again to clear). Falls back to placeholders if the backend is unreachable.
  const [live, setLive] = useState<WeeklyPayments | null>(null);
  const [active, setActive] = useState<WPBucket | null>(null);
  const [sliderOpen, setSliderOpen] = useState(false); // "View All" opens a right-side slider
  useEffect(() => {
    let cancelled = false;
    getWeeklyPayments().then((r) => {
      if (!cancelled) setLive(r);
    });
    return () => {
      cancelled = true;
    };
  }, []);
  const counts = live?.tabs ?? WP_FALLBACK_COUNTS;
  const summary = live?.summary ?? WP_FALLBACK_SUMMARY;
  const rows: (string | [string, string])[][] = live
    ? active
      ? live.rows[active]
      : [...live.rows.overdue, ...live.rows.due_today, ...live.rows.due_this_week, ...live.rows.received_today]
    : WP_FALLBACK_ROWS;
  const displayRows = rows.slice(0, 5);
  const allRows = live?.rows.all ?? rows; // "View All" lists every payment — received, upcoming and owed.
  return (
    <Card span="col-span-12">
      <CardHead
        icon={<GreyIconBox><img src={WeeklyPaymentIcon} alt="" className="size-4" /></GreyIconBox>}
        title="Weekly Payment Schedule"
      />
      <div className="flex gap-4 min-w-0">
        <WPSummary s={summary} />
        <div className="flex-[4] min-w-0 flex flex-col">
          <div className="flex flex-wrap gap-1.5 mb-3.5">
            {WP_TABS.map(({ key, tone, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => { setActive((a) => (a === key ? null : key)); setSliderOpen(false); }}
                className={`rounded px-2 py-1.5 text-xs font-weight-400 font-normal leading-4 transition ${TP[tone]} ${active === key ? "ring-2 ring-offset-1 ring-neutral-400" : active ? "opacity-50 hover:opacity-100" : "hover:opacity-80"}`}
              >
                {label} {counts[key]}
              </button>
            ))}
          </div>
          <div className="overflow-x-auto">
            <DataTable
              head={["Vehicle", "Customer", "Weekly Payment", "Outstanding", "Due Date", "Status"]}
              rows={displayRows}
              headText="text-neutral-800 font-normal"
              cellText="text-neutral-500"
            />
          </div>
          <div className="flex justify-center pt-3">
            <button type="button" onClick={() => setSliderOpen(true)} className="inline-flex h-8 items-center justify-center rounded bg-neutral-900 px-3 py-2 text-sm font-weight-400 font-normal leading-4 text-white transition hover:bg-black whitespace-nowrap">View All</button>
          </div>
        </div>
      </div>
      {sliderOpen && <RecordsSlider title="All Payments" head={["#", "Vehicle", "Customer", "Weekly Payment", "Outstanding", "Due Date", "Status"]} rows={allRows.map((r, i) => [String(i + 1), ...r])} onClose={() => setSliderOpen(false)} />}
    </Card>
  );
};

// ── page ──────────────────────────────────────────────────────────────────────
const FleetDashboard: React.FC<{ side?: "skyline" | "vehicles" }> = ({ side = "skyline" }) => {
  // Full-screen loader while the dashboard's data loads (same as the other screens).
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("MTD"); // global period (drives Fleet Performance)
  const taskModule = side === "vehicles" ? "vehicles" : "skyline";
  useEffect(() => {
    let cancelled = false;
    Promise.allSettled([
      getStats("MTD"), getVehicleStatus(), getWeeklyPayments(), getExpiries(),
      getCompliance(), getAttention(side), getHireTrend("WTD", ""),
      listFleetTasks({ module: taskModule, all_users: true }),
    ]).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [side, taskModule]);
  return (
    <div className="min-h-screen bg-white text-neutral-900 font-['Stack_Sans_Headline']">
      {loading && <FleetSpinnerLoader />}
      {/* Top bar */}
      <div className="sticky top-0 z-20 h-[80px] px-7 border-b border-[#eee] bg-white flex items-center justify-between">
        <span className="text-neutral-900 text-2xl font-weight-600 leading-6">Dashboard</span>
        <FleetNotificationBell />
      </div>

      {/* Content */}
      <div className="flex flex-col items-center">
        <div className="w-full max-w-[1440px] px-7 pt-6 pb-14">
          <div className="grid grid-cols-12 gap-x-4 gap-y-8">
            {side === "vehicles" && <ComplianceSummary />}
            {/* Period toggle sits with Fleet Performance — it drives that card. */}
            <div className="col-span-12 flex flex-col gap-3">
              <div className="flex items-center">
                <div className="p-[3px] bg-neutral-100 rounded-lg inline-flex items-center gap-1">
                  {[{ v: "TDY", l: "Today" }, { v: "WTD", l: "WTD" }, { v: "MTD", l: "MTD" }, { v: "YTD", l: "YTD" }].map(({ v, l }) => (
                    <button key={v} type="button" onClick={() => setPeriod(v)} className={`px-4 py-[5px] rounded-md text-xs font-weight-600 leading-5 transition ${period === v ? "bg-neutral-900 text-white" : "text-neutral-500 hover:text-neutral-700"}`}>{l}</button>
                  ))}
                </div>
              </div>
              <FleetPerformance period={period} side={side} />
            </div>
            <AttentionRequired side={side} />
            {side !== "vehicles" && <HireTrend />}
            {side !== "vehicles" && <WeeklyPayment />}
            {side === "vehicles" && <VehicleDonut side={side} />}
            <TaskManagement module={taskModule} />
            {side === "vehicles" && <ExpiryCarousel />}
            {side === "vehicles" && <SkylineOperations />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FleetDashboard;
