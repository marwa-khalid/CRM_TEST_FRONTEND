import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import FleetNotificationBell from "../../components/FleetNotificationBell";
import TrendingUp from "../../../assets/Dashboard/TrendingUp.svg";
import TrendingDown from "../../../assets/Dashboard/TrendingDown.svg";
import AllTasksIcon from "../../assets/dashboard//AllTasks.svg";
import OverdueIcon from "../../../assets/Dashboard/Overdue.svg";
import CriticalIcon from "../../../assets/Dashboard/Critical.svg";
import PendingFollowupsIcon from "../../../assets/Dashboard/PendingFollowups.svg";
import MOTNewIcon from "../../assets/dashboard/newicons/MOT.svg";
import PlateNewIcon from "../../assets/dashboard/newicons/PLATE.svg";
import RoadFundNewIcon from "../../assets/dashboard/newicons/roadfund.svg";
import ServicingDueNewIcon from "../../assets/dashboard/newicons/servicingdue.svg";
import FleetNewIcon from "../../assets/dashboard/newicons/fleet.svg";
import VehiclesOnHireIcon from "../../assets/dashboard/newicons/vehiclesonhire.svg";
import MissingDocIcon from "../../assets/dashboard/newicons/awaiting.svg";
import UrgentNewIcon from "../../assets/dashboard/newicons/urgent.svg";
import TrendingUpIcon from "../../assets/dashboard/newicons/TrendingUp.svg";
import TrendingDownIcon from "../../assets/dashboard/newicons/TrendingDown.svg";
import IncomeNewIcon from "../../assets/dashboard/newicons/income.svg";
import FileStatIcon from "../../../assets/Dashboard/File.svg";
import PoundStatIcon from "../../../assets/Dashboard/Pound.svg";
import CarsStatIcon from "../../../assets/Dashboard/Cars.svg";
import UrgentStatIcon from "../../../assets/Dashboard/Urgent.svg";
import FleetMultiSelectFilter from "../../components/FleetMultiSelectFilter";
import FleetSpinnerLoader from "../../components/FleetSpinnerLoader";
import FleetMissingDocumentsSlider from "../../components/FleetMissingDocumentsSlider";
import FleetAttentionSlider, { type AttentionCard } from "../../components/FleetAttentionSlider";
import {
  getHireTrend, getStats, getVehicleStatus, getWeeklyPayments, getCompliance, getExpiries, getServicingDue, getAttention,
  getMissingDocuments, getOverdueReturns, getOverduePayments, getFleetVehicles,
  type WeeklyPayments, type PaymentSummary, type Attention, type Expiries, type ServicingDue, type MissingDoc, type StatsResponse, type ExpiryCard,
} from "../../services/dashboardService";
import { listFleetTasks, type FleetTask } from "../../services/taskService";

// Changes whenever the local calendar day flips (checked every 30s + on tab focus), so
// time-sensitive buckets (Due Today / Overdue) re-fetch and roll over at midnight without
// a manual reload. Include the returned key in a fetch effect's dependency array.
function useDateKey(): string {
  const [key, setKey] = useState(() => new Date().toDateString());
  useEffect(() => {
    let midnightTimer = 0;
    const sync = () => setKey((prev) => {
      const now = new Date().toDateString();
      return prev === now ? prev : now;
    });
    // Fire exactly at the next local midnight (+2s so the clock has flipped), then reschedule.
    const scheduleMidnight = () => {
      const now = new Date();
      const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 2);
      midnightTimer = window.setTimeout(() => { sync(); scheduleMidnight(); }, next.getTime() - now.getTime());
    };
    scheduleMidnight();
    const id = window.setInterval(sync, 30000); // safety net (throttled/backgrounded tabs, clock changes)
    const onVisible = () => { if (document.visibilityState === "visible") sync(); };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", sync);
    return () => {
      window.clearTimeout(midnightTimer);
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", sync);
    };
  }, []);
  return key;
}

// Fleet Dashboard — pure inline Tailwind (same convention as the Claims dashboard).
// Sample data is hard-coded for now; wire to fleet services when the APIs land.

// ── shared bits ──────────────────────────────────────────────────────────────
export const Card: React.FC<{ span: string; className?: string; children: React.ReactNode }> = ({ span, className = "", children }) => (
  <div className={`${span} rounded-xl border border-neutral-200 p-5 flex flex-col min-w-0 ${className}`}>{children}</div>
);


export const CardHead: React.FC<{ icon?: React.ReactNode; title: string; sub?: string; right?: React.ReactNode; center?: boolean }> = ({ icon, title, sub, right, center }) => (
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




// ── Hire Trend (WTD/MTD/YTD periods + YoY/MoM comparison) ─────────────────────
export type TrendView = { labels: string[]; vals: number[]; cap: string; cmp?: string };
// Zero placeholders — shown only until /dashboard/hire-trend returns. Labels/captions
// keep the axis shape; the bars read 0 rather than inventing a trend.
export const HT_VIEWS: Record<string, TrendView> = {
  WTD: { labels: ["Mon", "Tue", "Wed", "Thu", "Fri"], vals: [0, 0, 0, 0, 0], cap: "" },
  MTD: { labels: ["Week 1", "Week 2", "Week 3", "Week 4", "Week 5"], vals: [0, 0, 0, 0, 0], cap: "" },
  YTD: { labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"], vals: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], cap: "" },
  // Custom = a two-period year/month comparison (like Claims), so the placeholder
  // is a 2-bar previous-vs-current — never a long day series.
  Custom: { labels: [String(new Date().getFullYear() - 1), String(new Date().getFullYear())], vals: [0, 0], cap: `${new Date().getFullYear() - 1} vs ${new Date().getFullYear()}` },
  YoY: { labels: [String(new Date().getFullYear() - 1), String(new Date().getFullYear())], vals: [0, 0], cap: "", cmp: "from last year" },
  MoM: { labels: ["Prev", "This"], vals: [0, 0], cap: "", cmp: "from last month" },
};
export function niceAxis(rawMax: number, steps: number) {
  const step = Math.max(1, Math.ceil(Math.max(1, rawMax) / steps));
  const ticks: number[] = [];
  for (let i = 0; i <= steps; i++) ticks.push(step * i);
  return { max: step * steps, ticks };
}
export const chevron = <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5"><path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;

// ── Hire-trend Custom compare (Year vs Year / Month vs Month) — mirrors the
// Claims dashboard's CustomCompare, re-themed neutral for Fleet. ──────────────
export const PICKER_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export const fmtCmp = (type: "year" | "month", v: string) => {
  if (type === "year") return v || "—";
  const [y, m] = (v || "").split("-");
  return y && m ? `${PICKER_MONTHS[parseInt(m) - 1]} ${y}` : "—";
};
export const GridPicker: React.FC<{ mode: "year" | "month"; value: string; onPick: (v: string) => void }> = ({ mode, value, onPick }) => {
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
export const CustomCompare: React.FC<{
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

export const HT_STATUS_OPTS = [{ label: "All Statuses", value: "" }, { label: "On Hire", value: "on_hire" }, { label: "Off Hire", value: "off_hire" }];
export const HireTrend: React.FC = () => {
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
        <div className="inline-flex items-center gap-1 rounded outline outline-1 -outline-offset-1 outline-neutral-900">
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
        <div className="inline-flex items-center gap-1 rounded outline outline-1 -outline-offset-1 outline-neutral-900">
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
export const VEH_COLORS: Record<string, string> = {
  Available: "#86efac",        // green-300
  "On Hire": "#93c5fd",        // blue-300
  "In Service": "#d8b4fe",     // purple-300 (not in the mockup's 6 — kept distinct)
  "In Repair": "#fdba74",      // orange-300
  "For Sale": "#f9a8d4",       // pink-300 (not in the mockup's 6 — kept distinct)
  "Off Hire": "#fca5a5",       // red-300 (backend canonical "Off Fleet" is shown as Off Hire in VM)
  "Awaiting Plating": "#fcd34d", // amber-300
  "Awaiting De Fleet": "#7dd3fc", // sky-300
};
// The donut legend mirrors the Vehicle Details availability dropdown. On Hire is
// the dashboard label for live on-hire vehicles; Off Fleet is the dashboard label for
// off-hire vehicles.
export const VEH_ALWAYS_LEGEND: { l: string; c: string }[] = [
  { l: "Available", c: VEH_COLORS.Available },
  { l: "On Hire", c: VEH_COLORS["On Hire"] },
  { l: "In Service", c: VEH_COLORS["In Service"] },
  { l: "In Repair", c: VEH_COLORS["In Repair"] },
  { l: "For Sale", c: VEH_COLORS["For Sale"] },
  { l: "Off Hire", c: VEH_COLORS["Off Hire"] },
  { l: "Awaiting Plating", c: VEH_COLORS["Awaiting Plating"] },
  { l: "Awaiting De Fleet", c: VEH_COLORS["Awaiting De Fleet"] },
];
export const VEH_FALLBACK_COLORS = ["#c7d2fe", "#fde68a", "#99f6e4", "#fecaca", "#a1a1aa"];
export const VEH_SEG = VEH_ALWAYS_LEGEND.map(({ l, c }) => ({ l, v: 0, c }));
export const normaliseVehicleStatusLabel = (label: string) => {
  const cleaned = label.trim().replace(/[_-]/g, " ").replace(/\s+/g, " ");
  const lower = cleaned.toLowerCase();
  if (lower === "on hire" || lower === "weekly hire") return "On Hire";
  if (lower === "off hire" || lower === "off fleet") return "Off Hire";
  if (lower === "awaiting de fleet") return "Awaiting De Fleet";
  const known = VEH_ALWAYS_LEGEND.find((x) => x.l.toLowerCase() === lower);
  return known?.l || cleaned;
};
export const mapVehicleSegments = (segments: { label: string; value: number }[]) => {
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
export const VehicleDonut: React.FC<{ side?: string; context?: string; span?: string }> = ({ side, context, span }) => {
  // Live vehicle-status distribution; falls back to VEH_SEG placeholders.
  const [seg, setSeg] = useState<{ l: string; v: number; c: string }[] | null>(null);
  const [hover, setHover] = useState<number | null>(null); // hovered arc → its count shows in the centre
  useEffect(() => {
    let cancelled = false;
    getVehicleStatus(context).then((r) => {
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
  }, [context]);
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
    const el = (
      <circle
        key={i} cx="80" cy="80" r={r} fill="none" stroke={x.c} strokeWidth="22"
        strokeDasharray={`${len.toFixed(2)} ${(C - len).toFixed(2)}`} strokeDashoffset={(-off).toFixed(2)}
        transform="rotate(-90 80 80)"
        opacity={hover == null || hover === i ? 1 : 0.3}
        style={{ cursor: x.v > 0 ? "pointer" : "default", transition: "opacity 0.12s" }}
        onMouseEnter={() => x.v > 0 && setHover(i)}
        onMouseLeave={() => setHover(null)}
      />
    );
    off += len;
    return el;
  });
  return (
    <Card span={span ?? (side === "vehicles" ? "col-span-12 lg:col-span-8" : "col-span-12 lg:col-span-5")} className={span ? "" : (side === "vehicles" ? "lg:ml-6" : "")}>
      <CardHead title="Vehicle Status Distribution" />
      <div className="flex-1 flex flex-col items-center justify-center gap-10 py-2">
        <svg viewBox="0 0 160 160" className="w-[300px] h-[300px] max-w-full shrink-0">
          <circle cx="80" cy="80" r={r} fill="none" stroke="#f1f1f1" strokeWidth="22" />
          {arcs}
          {/* Centre shows the total by default, and the hovered segment's value on hover */}
          <g style={{ pointerEvents: "none" }}>
            <text x="80" y="78" textAnchor="middle" fontSize="20" fontWeight="700" fill="#111827">
              {hover != null && data[hover] ? data[hover].v : actualTotal}
            </text>
            <text x="80" y="93" textAnchor="middle" fontSize="7.5" fontWeight="500" fill="#6b7280">
              {hover != null && data[hover] ? data[hover].l : "Total Fleet"}
            </text>
          </g>
        </svg>
        {data.length === 0 ? (
          <div className="text-neutral-400 text-sm">No vehicles in the fleet yet.</div>
        ) : (
          <div className="grid grid-cols-2 gap-x-10 gap-y-4">
            {legendData.map((x, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <span className="w-4 h-4 rounded-full shrink-0" style={{ background: x.c }} />
                <span className="w-36 text-neutral-700 font-weight-500">{x.l}</span>
                <span className="text-neutral-700 text-base font-weight-600 tabular-nums">{x.v}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
};

// ── Attention Required (ditto the Claims dashboard "Attention Required") ───────
export const ATTENTION = [
  { value: 6, label: "Overdue Returns", note: "Vehicles past expected return date", tint: "bg-red-100 border-red-100", icon: OverdueIcon },
  { value: 4, label: "Missing Documents", note: "Vehicles missing required documents", tint: "bg-yellow-100 border-yellow-100", icon: MissingDocIcon },
  { value: 3, label: "Overdue Payments", note: "Hire payments past their due date", tint: "bg-red-100 border-red-100", icon: OverdueIcon },
] as const;
export const ATTENTION_KEY: Record<string, keyof Attention> = {
  "Overdue Returns": "overdue_returns",
  "Missing Documents": "missing_documents",
  "Overdue Payments": "overdue_payments",
};
export type AttentionTile = "Overdue Returns" | "Missing Documents" | "Overdue Payments";
export const AttentionRequired: React.FC<{ side: "skyline" | "vehicles"; context?: string }> = ({ side, context }) => {
  const [live, setLive] = useState<Attention | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false); // full-screen overlay while a tile's rows load
  const [open, setOpen] = useState<AttentionTile | null>(null);
  const [missingItems, setMissingItems] = useState<MissingDoc[]>([]);
  const [returnCards, setReturnCards] = useState<AttentionCard[]>([]);
  const [paymentCards, setPaymentCards] = useState<AttentionCard[]>([]);
  useEffect(() => {
    let cancelled = false;
    getAttention(side, context).then((r) => {
      if (!cancelled) setLive(r);
    });
    return () => {
      cancelled = true;
    };
  }, [side, context]);
  const daysBadge = (n: number) => `${n} Day${n === 1 ? "" : "s"} Overdue`;
  // Show the normal full-screen overlay spinner first, then open the slider once
  // its rows are in hand (so it opens already filled, never with an inline spinner).
  const openTile = async (tile: AttentionTile) => {
    setLoadingDetail(true);
    try {
      if (tile === "Missing Documents") {
        setMissingItems(await getMissingDocuments(side, context));
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
export type Task = { t: string; due: string; od?: boolean };
export type TaskCol = { count: number; label: string; icon: string; iconBg: string; border: string; tasks: Task[] };
// Empty skeleton shown before live tasks load / when there are none — the four
// columns at 0, no demo tasks (real counts come from buildTaskCols on the API data).
export const TASK_COLS: TaskCol[] = [
  { count: 0, label: "All Tasks", icon: AllTasksIcon, iconBg: "bg-blue-100", border: "border-blue-200", tasks: [] },
  { count: 0, label: "Overdue Tasks", icon: OverdueIcon, iconBg: "bg-red-100", border: "border-red-200", tasks: [] },
  { count: 0, label: "Awaiting Response", icon: CriticalIcon, iconBg: "bg-yellow-100", border: "border-amber-200", tasks: [] },
  { count: 0, label: "Pending Followups", icon: PendingFollowupsIcon, iconBg: "bg-neutral-100", border: "border-neutral-300", tasks: [] },
];
// Map a live task to the card's { t, due, od } shape (matches the dummy format).
export const fmtTask = (t: FleetTask): Task => {
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
export const buildTaskCols = (tasks: FleetTask[]): TaskCol[] => {
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
    { count: active.length, label: "All Tasks", icon: AllTasksIcon, iconBg: "bg-blue-100", border: "border-blue-200", tasks: pick(uncovered) },
    { count: overdue.length, label: "Overdue Tasks", icon: OverdueIcon, iconBg: "bg-red-100", border: "border-red-200", tasks: pick(overdue) },
    { count: awaiting.length, label: "Awaiting Response", icon: CriticalIcon, iconBg: "bg-yellow-100", border: "border-amber-200", tasks: pick(awaiting) },
    { count: pending.length, label: "Pending Followups", icon: PendingFollowupsIcon, iconBg: "bg-neutral-100", border: "border-neutral-300", tasks: pick(pending) },
  ];
};
export const TaskManagement: React.FC<{ module: string }> = ({ module }) => {
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
  const navigate = useNavigate();
  // Skyline tasks live at /fleet/tasks; each vehicle side at /vehicle-management/<ctx>/tasks
  // — the same module→route mapping the notification bell uses.
  const tasksRoute = module === "skyline" ? "/fleet/tasks" : `/vehicle-management/${module.replace("vehicles_", "")}/tasks`;
  return (
    <div className="col-span-12">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-neutral-900 text-[20px] font-weight-600">Task Management</h2>
        <button type="button" onClick={() => navigate(tasksRoute)} className="h-8 px-3 py-2 rounded-sm outline outline-1 -outline-offset-1 outline-neutral-900 text-neutral-700 text-sm leading-4 hover:bg-neutral-50">View All</button>
      </div>
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
export const FP_ICON_FILTER = { filter: "brightness(0) invert(0.2)" } as const;
export const FP_URGENT_ICON_FILTER = {
  filter: "brightness(0) saturate(100%) invert(36%) sepia(95%) saturate(2285%) hue-rotate(337deg) brightness(97%) contrast(93%)",
} as const;
export const FP_META: Record<string, { icon: React.ReactNode; bar: string }> = {
  vehicles_on_hire: { icon: <img src={FileStatIcon} alt="" className="w-4 h-4" style={FP_ICON_FILTER} />, bar: "bg-neutral-700" },
  net_income: { icon: <img src={PoundStatIcon} alt="" className="w-4 h-4" style={FP_ICON_FILTER} />, bar: "bg-emerald-500" },
  fleet_availability: { icon: <img src={CarsStatIcon} alt="" className="w-4 h-4" style={FP_ICON_FILTER} />, bar: "bg-violet-500" },
  urgent_alerts: { icon: <img src={UrgentStatIcon} alt="" className="w-4 h-4" style={FP_URGENT_ICON_FILTER} />, bar: "bg-red-500" },
};
// Order the Fleet Performance cards, urgent alerts last.
export const FP_ORDER = ["vehicles_on_hire", "net_income", "fleet_availability", "urgent_alerts"];
// ── Skyline Operations (matches the Claims dashboard's Skyline Operations) ─────
export type SkyKey = "available" | "hire" | "off" | "repair" | "sale" | "other";
export type SkyVehicle = { registration: string; model: string; statusKey: SkyKey; statusLabel: string; hireInfo?: string; customer?: string; reference?: string; offHiredToday?: boolean };
// The "Off Hire" chip is a *daily* filter: it selects vehicles off-hired today (which are
// now Available, shown with their Available tag), not a status. Every other chip matches statusKey.
// "Off Hire" is a daily event, not a status: an off-hired vehicle reads Available,
// so the Off Hire chip selects Available vehicles off-hired *today*. Every other chip
// matches the vehicle's status key.
export const skyMatches = (v: SkyVehicle, key: string) => (key === "off" ? !!v.offHiredToday : v.statusKey === key);
export const SKY_STATUS_STYLE: Record<SkyKey, string> = {
  available: "bg-green-100 text-green-700", hire: "bg-neutral-100 text-neutral-800",
  off: "bg-teal-100 text-teal-700", repair: "bg-orange-100 text-orange-500",
  sale: "bg-pink-100 text-pink-700", other: "bg-neutral-100 text-neutral-700",
};
// Status badge colours for the vehicle cards, mirroring the donut's VEH_COLORS hues
// (each is the -100/-700 pairing of the same family the donut uses at -300).
export const VEH_BADGE: Record<string, string> = {
  "Available": "bg-green-100 text-green-700",
  "On Hire": "bg-blue-100 text-blue-700",
  "In Service": "bg-purple-100 text-purple-700",
  "In Repair": "bg-orange-100 text-orange-600",
  "For Sale": "bg-pink-100 text-pink-700",
  "Off Hire": "bg-red-100 text-red-600",
  "Awaiting Plating": "bg-amber-100 text-amber-700",
  "Awaiting De Fleet": "bg-sky-100 text-sky-700",
};
export const SkyVehicleCard: React.FC<{ v: SkyVehicle }> = ({ v }) => (
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
          {v.reference && <p className="text-xs font-weight-400 font-normal text-neutral-500">{v.reference}</p>}
        </div>
      )}
    </div>
    <span className={`inline-flex h-fit w-fit shrink-0 items-center justify-center rounded px-2 py-1 text-xs font-weight-400 font-normal leading-4 ${VEH_BADGE[normaliseVehicleStatusLabel(v.statusLabel)] ?? SKY_STATUS_STYLE[v.statusKey]}`}>{v.statusLabel === "Off Fleet" ? "Off Hire" : v.statusLabel}</span>
  </div>
);
// Right-side drawer showing every vehicle card (opened by "View All Vehicles").
// Self-contained Registration + Status filters and a 4-up card grid (figma design).
export const SLIDER_STATUS_OPTS = [
  { label: "Available", value: "available" }, { label: "On Hire", value: "hire" },
  { label: "Off Hire", value: "off" }, { label: "In Repair", value: "repair" }, { label: "For Sale", value: "sale" },
  { label: "Others", value: "other" },
];
export const SkylineVehiclesSlider: React.FC<{
  vehicles: SkyVehicle[]; // full list; the slider filters it by its own controls
  summary: { label: string; value: number; statusKey: string; className: string }[];
  title: string; // side-aware heading (CAMS Vehicles / Skyline Vehicles)
  // Filters selected on the section carry into the slider (it opens pre-filtered
  // to the same Registration/Status selection the user already made).
  initialRegSel?: string[];
  initialStatusSel?: string[];
  onClose: () => void;
}> = ({ vehicles, summary, title, initialRegSel = [], initialStatusSel = [], onClose }) => {
  const [regSel, setRegSel] = useState<string[]>(initialRegSel);
  const [statusSel, setStatusSel] = useState<string[]>(initialStatusSel);
  const toggle = (setter: React.Dispatch<React.SetStateAction<string[]>>, val: string) =>
    setter((s) => (s.includes(val) ? s.filter((x) => x !== val) : [...s, val]));
  const regOptions = vehicles.map((v) => ({ label: v.registration, value: v.registration }));
  const shown = vehicles.filter(
    (v) => (!regSel.length || regSel.includes(v.registration)) && (!statusSel.length || statusSel.some((k) => skyMatches(v, k))),
  );
  return (
    <div className="fixed inset-0 z-[60] flex justify-end font-['Stack_Sans_Headline']">
      <div className="flex-1 bg-black/30" onClick={onClose} />
      <div className="w-[950px] max-w-full bg-white h-full flex flex-col p-10 gap-5 overflow-auto">
        <div className="flex justify-between items-center">
          <h2 className="text-black text-2xl font-weight-600 leading-6">{title}</h2>
          <button type="button" onClick={onClose} className="px-10 py-4 bg-neutral-900 rounded-sm text-white text-base font-weight-500 leading-4 hover:bg-black">Close</button>
        </div>
        <div className="h-px bg-neutral-200 w-full" />
        <div className="flex flex-wrap justify-between items-center gap-4">
          <div className="flex flex-wrap items-center gap-8">
            <p className="text-2xl font-weight-600 leading-6 text-black">{vehicles.length} Vehicles</p>
            <FleetMultiSelectFilter label="Registration" options={regOptions} selected={regSel} onToggle={(v) => toggle(setRegSel, v)} onClear={() => setRegSel([])} />
            <FleetMultiSelectFilter label="Status" options={SLIDER_STATUS_OPTS} selected={statusSel} onToggle={(v) => toggle(setStatusSel, v)} onClear={() => setStatusSel([])} />
          </div>
          {/* Status chips double as filters — click to narrow the list. */}
          <div className="flex flex-wrap items-center gap-2">
            {summary.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => toggle(setStatusSel, item.statusKey)}
                className={`rounded-sm p-3 text-sm font-weight-400 font-normal leading-4 transition ${item.className} ${statusSel.includes(item.statusKey) ? "ring-2 ring-offset-1 ring-neutral-400" : statusSel.length ? "opacity-50 hover:opacity-100" : "hover:opacity-80"}`}
              >
                {item.label} {item.value}
              </button>
            ))}
          </div>
        </div>
        {shown.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-sm text-neutral-400">No vehicles match.</div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 auto-rows-min">
            {shown.map((v, i) => <SkyVehicleCard key={`${v.registration}-${i}`} v={v} />)}
          </div>
        )}
      </div>
    </div>
  );
};
export const SkylineOperations: React.FC<{ context?: string }> = ({ context }) => {
  const [regSel, setRegSel] = useState<string[]>([]);
  const [statusSel, setStatusSel] = useState<string[]>([]);
  const [dateSel, setDateSel] = useState<string[]>([]);
  const [sliderOpen, setSliderOpen] = useState(false); // "View All" opens a right-side drawer
  // Live vehicle list (empty when the fleet has no vehicles). No demo fallback —
  // the section reflects reality, so deleting vehicles clears it.
  const [vehicles, setVehicles] = useState<SkyVehicle[] | null>(null);
  useEffect(() => {
    let cancelled = false;
    getFleetVehicles(context).then((r) => {
      if (!cancelled) setVehicles(r as SkyVehicle[] | null);
    });
    return () => {
      cancelled = true;
    };
  }, [context]);
  const data = vehicles ?? [];
  // Section heading follows the VM side so the CAMS page never reads "Skyline Vehicles".
  const vehLabel = context === "cams" ? "CAMS Vehicles" : "Skyline Vehicles";
  const toggle = (setter: React.Dispatch<React.SetStateAction<string[]>>, val: string) =>
    setter((s) => (s.includes(val) ? s.filter((x) => x !== val) : [...s, val]));
  const regOptions = data.map((v) => ({ label: v.registration, value: v.registration }));
  const statusOptions = [{ label: "Available", value: "available" }, { label: "On Hire", value: "hire" }, { label: "Off Hire", value: "off" }, { label: "In Repair", value: "repair" }, { label: "For Sale", value: "sale" }, { label: "Others", value: "other" }];
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
    { label: "Others", value: countBy("other"), statusKey: "other", className: "bg-neutral-100 text-neutral-700" },
  ];
  const filtered = data.filter((v) => (!regSel.length || regSel.includes(v.registration)) && (!statusSel.length || statusSel.some((k) => skyMatches(v, k))));
  const visible = filtered.slice(0, 8);
  return (
    <section className="col-span-12 w-full rounded-lg border border-neutral-200 px-4 py-6 min-w-0">
      <div className="flex flex-col gap-10">
        <div className="flex justify-between items-center gap-3">
          <h2 className="text-xl font-weight-600 leading-5 text-black">{vehLabel}</h2>
          <button type="button" onClick={() => setSliderOpen(true)} className="h-8 px-3 py-2 rounded-sm outline outline-1 -outline-offset-1 outline-neutral-900 text-neutral-700 text-sm leading-4 hover:bg-neutral-50">View All Vehicles</button>
        </div>
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
                  className={`rounded p-3 text-sm font-weight-400 font-normal leading-4 transition ${VEH_BADGE[item.label] ?? item.className} ${statusSel.includes(item.statusKey) ? "ring-2 ring-offset-1 ring-neutral-400" : statusSel.length ? "opacity-50 hover:opacity-100" : "hover:opacity-80"}`}
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
        </div>
      </div>
      {sliderOpen && <SkylineVehiclesSlider vehicles={data} summary={summaryItems} title={vehLabel} initialRegSel={regSel} initialStatusSel={statusSel} onClose={() => setSliderOpen(false)} />}
    </section>
  );
};

// ── Weekly Payment Schedule ───────────────────────────────────────────────────
export const WP_FALLBACK_SUMMARY: PaymentSummary = {
  total: "£0", overdue: "£0", due_today: "£0", received: "£0",
  by_day: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => ({ day, amount: 0, overdue: 0 })),
};

// "Received v/s Overdue" weekly area chart (green = received, red = overdue).
export const WeeklyPaymentGraph: React.FC<{ data: { day: string; amount: number; overdue: number }[] }> = ({ data }) => {
  // Weekdays only — Sat/Sun dropped from the schedule graph.
  const days = (data.length ? data : ["Mon", "Tue", "Wed", "Thu", "Fri"].map((day) => ({ day, amount: 0, overdue: 0 }))).slice(0, 5);
  const received = days.map((d) => d.amount);
  const overdue = days.map((d) => d.overdue);
  // Nice y-axis with headroom: the top gridline always sits above the peak so the
  // curve never touches the ceiling (e.g. a 1,250 peak tops out at 1,500).
  const peak = Math.max(...received, ...overdue, 0);
  const niceStep = (raw: number) => {
    const pow = Math.pow(10, Math.floor(Math.log10(Math.max(raw, 1))));
    const u = raw / pow;
    const s = u <= 1 ? 1 : u <= 1.5 ? 1.5 : u <= 2 ? 2 : u <= 2.5 ? 2.5 : u <= 3 ? 3 : u <= 5 ? 5 : 10;
    return s * pow;
  };
  // Aim for ~6 evenly-spaced gridlines with a little headroom above the peak, so the
  // axis reads full (not 3 lonely ticks) and the curve never touches the ceiling.
  const top = peak > 0 ? peak * 1.15 : 1000;
  const step = niceStep(top / 6);
  let yMax = Math.ceil(top / step) * step;
  if (yMax <= peak) yMax += step;
  const ticks: number[] = [];
  for (let t = 0; t <= yMax + 1e-6; t += step) ticks.push(Math.round(t));
  const n = days.length;
  // Normalised 0–100 space; the SVG then stretches to fill the column height
  // (strokes stay crisp via non-scaling-stroke, labels/dots live in HTML so they never distort).
  const X = (i: number) => (i / Math.max(1, n - 1)) * 100;
  const Y = (v: number) => 100 - (v / yMax) * 100;
  const smooth = (vals: number[]) => {
    const p = vals.map((v, i) => [X(i), Y(v)] as [number, number]);
    if (p.length < 2) return "";
    let d = `M ${p[0][0].toFixed(2)} ${p[0][1].toFixed(2)}`;
    for (let i = 0; i < p.length - 1; i++) {
      const p0 = p[i - 1] || p[i], p1 = p[i], p2 = p[i + 1], p3 = p[i + 2] || p2;
      const c1x = p1[0] + (p2[0] - p0[0]) / 6, c1y = p1[1] + (p2[1] - p0[1]) / 6;
      const c2x = p2[0] - (p3[0] - p1[0]) / 6, c2y = p2[1] - (p3[1] - p1[1]) / 6;
      d += ` C ${c1x.toFixed(2)} ${c1y.toFixed(2)}, ${c2x.toFixed(2)} ${c2y.toFixed(2)}, ${p2[0].toFixed(2)} ${p2[1].toFixed(2)}`;
    }
    return d;
  };
  const area = (vals: number[]) => `${smooth(vals)} L 100 100 L 0 100 Z`;
  // Tooltip shown just above a hovered dot (not a full-column hover, not pinned to the top).
  const tip = (i: number) => (
    <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 z-10 hidden group-hover:block whitespace-nowrap rounded-md bg-white border border-neutral-200 px-2 py-1.5 text-[10px] leading-tight text-neutral-700 shadow-lg">
      <div className="font-weight-600 mb-0.5 text-neutral-900">{days[i].day.slice(0, 3).toUpperCase()}</div>
      <div className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-green-500" />Received £{received[i].toLocaleString()}</div>
      <div className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-red-500" />Overdue £{overdue[i].toLocaleString()}</div>
    </div>
  );
  return (
    <div className="flex-1 min-h-0 flex flex-col" style={{ minHeight: 280 }}>
      <div className="flex-1 min-h-0 flex">
        {/* y-axis labels — evenly spaced, so they line up with the gridlines */}
        <div className="w-12 shrink-0 flex flex-col justify-between items-end pr-2 text-[10px] leading-none text-neutral-400 tabular-nums">
          {[...ticks].reverse().map((t, i) => <span key={i}>{t.toLocaleString()}</span>)}
        </div>
        {/* plot — SVG stretches to fill the remaining height */}
        <div className="relative flex-1 min-w-0">
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full">
            <defs>
              <linearGradient id="wpGreen" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#86efac" stopOpacity="0.55" /><stop offset="100%" stopColor="#86efac" stopOpacity="0" /></linearGradient>
              <linearGradient id="wpRed" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#fca5a5" stopOpacity="0.5" /><stop offset="100%" stopColor="#fca5a5" stopOpacity="0" /></linearGradient>
            </defs>
            {ticks.map((t, i) => <line key={i} x1="0" y1={Y(t)} x2="100" y2={Y(t)} stroke="#e5e5e5" strokeWidth="1" strokeDasharray="4 4" vectorEffect="non-scaling-stroke" />)}
            <path d={area(received)} fill="url(#wpGreen)" />
            <path d={area(overdue)} fill="url(#wpRed)" />
            <path d={smooth(received)} fill="none" stroke="#22c55e" strokeWidth="2" vectorEffect="non-scaling-stroke" />
            <path d={smooth(overdue)} fill="none" stroke="#ef4444" strokeWidth="2" vectorEffect="non-scaling-stroke" />
          </svg>
          {/* round data dots — each is its own hover target (16px hit area, small visible dot) */}
          {received.map((v, i) => v > 0 && (
            <span key={`g${i}`} className="group absolute -translate-x-1/2 -translate-y-1/2 flex items-center justify-center cursor-pointer" style={{ left: `${X(i)}%`, top: `${Y(v)}%`, width: 16, height: 16 }}>
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 ring-2 ring-white" />
              {tip(i)}
            </span>
          ))}
          {overdue.map((v, i) => v > 0 && (
            <span key={`r${i}`} className="group absolute -translate-x-1/2 -translate-y-1/2 flex items-center justify-center cursor-pointer" style={{ left: `${X(i)}%`, top: `${Y(v)}%`, width: 16, height: 16 }}>
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 ring-2 ring-white" />
              {tip(i)}
            </span>
          ))}
        </div>
      </div>
      {/* x-axis labels — pl matches the y-label column so they sit under the plot.
          A day with no dot (received & overdue both 0 — the point lies on the axis) turns
          its label into the hover target instead, showing the same tooltip as a dot would. */}
      <div className="pl-12 flex justify-between text-[10px] leading-none text-neutral-400 pt-2">
        {days.map((d, i) => {
          const label = d.day.slice(0, 3).toUpperCase();
          return received[i] === 0 && overdue[i] === 0
            ? <span key={i} className="group relative cursor-default">{label}{tip(i)}</span>
            : <span key={i}>{label}</span>;
        })}
      </div>
    </div>
  );
};
export const WeeklyPayment: React.FC = () => {
  const [live, setLive] = useState<WeeklyPayments | null>(null);
  const [tab, setTab] = useState<string>("all");
  const [sliderOpen, setSliderOpen] = useState(false); // "View All" opens a right-side slider
  const dateKey = useDateKey();
  useEffect(() => {
    let cancelled = false;
    getWeeklyPayments().then((r) => { if (!cancelled) setLive(r); });
    return () => { cancelled = true; };
  }, [dateKey]);
  const summary = live?.summary ?? WP_FALLBACK_SUMMARY;
  const rowsByTab: Record<string, (string | [string, string])[][]> = {
    all: live?.rows.all ?? [], overdue: live?.rows.overdue ?? [], due_today: live?.rows.due_today ?? [],
    due_this_week: live?.rows.due_this_week ?? [], received_today: live?.rows.received_today ?? [],
  };
  const t = live?.tabs;
  const tabs: [string, string, number][] = [
    ["all", "All", t?.all ?? 0], ["overdue", "Overdue", t?.overdue ?? 0], ["received_today", "Received", t?.received_today ?? 0],
    ["due_today", "Due Today", t?.due_today ?? 0], ["due_this_week", "Due This Week", t?.due_this_week ?? 0],
  ];
  // "All" already excludes previous-week overdue backlog (the backend keeps that to the
  // Overdue tab), so each tab just shows its own rows — first 5 here, the rest in "View All".
  const shown = (rowsByTab[tab] ?? []).slice(0, 5);
  return (
    <Card span="col-span-12">
      <div className="flex flex-col lg:flex-row gap-10">
        {/* Left — schedule list */}
        <div className="flex-1 min-w-0 flex flex-col gap-4">
          <div className="flex justify-between items-center gap-3">
            <h2 className="text-black text-xl font-weight-600 leading-5">Weekly Payment Schedule</h2>
            <button type="button" onClick={() => setSliderOpen(true)} className="h-8 px-3 py-2 rounded-sm outline outline-1 -outline-offset-1 outline-neutral-900 text-neutral-700 text-sm leading-4 hover:bg-neutral-50">View All</button>
          </div>
          <div className="flex flex-wrap gap-3">
            {tabs.map(([k, label, count]) => (
              <button key={k} type="button" onClick={() => setTab(k)}
                className={`px-3 py-1 rounded-full inline-flex gap-2 text-xs ${tab === k ? "bg-neutral-700 text-white" : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"}`}>
                <span>{label}</span><span>{count}</span>
              </button>
            ))}
          </div>
          <div className="flex flex-col gap-3">
            {shown.length === 0 ? (
              <div className="py-10 text-center text-xs text-neutral-400">No payments here.</div>
            ) : shown.map((r, i) => <WPPaymentCard key={i} r={r} />)}
          </div>
        </div>
        {/* Right — Received v/s Overdue graph */}
        <div className="flex-1 min-w-0 flex flex-col gap-4">
          <h2 className="text-black text-xl font-weight-600 leading-5">Weekly Payment Graph</h2>
          <span className="text-neutral-700 text-sm">Received v/s Overdue</span>
          <WeeklyPaymentGraph data={summary.by_day} />
        </div>
      </div>
      {sliderOpen && <WeeklyPaymentSlider data={live} onClose={() => setSliderOpen(false)} />}
    </Card>
  );
};

// ── page ──────────────────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════
// Vehicle Management dashboard — figma redesign (VM side only). New components so
// the Skyline hire dashboard + shared widgets are untouched. All read the same live
// endpoints the old VM widgets used.
// ══════════════════════════════════════════════════════════════════════════════

// Four compliance cards (MOT / Plate / Road Fund / Servicing Due), each Overdue /
// Due Today / Due in 7 Days / Due in 30 Days from the live expiry buckets.
export const VM_COMPLIANCE: { key: keyof Expiries; title: string; icon: string; ring: string; head: string }[] = [
  { key: "mot", title: "MOT", icon: MOTNewIcon, ring: "outline-blue-200", head: "bg-blue-100" },
  { key: "plate", title: "Plate", icon: PlateNewIcon, ring: "outline-yellow-300", head: "bg-yellow-100" },
  { key: "road_fund", title: "Road Fund", icon: RoadFundNewIcon, ring: "outline-green-300", head: "bg-green-100" },
  { key: "service", title: "Servicing Due", icon: ServicingDueNewIcon, ring: "outline-purple-400", head: "bg-purple-200" },
];
export const ServicingDuePopup: React.FC<{
  row: (string | [string, string])[];
  onClose: () => void;
  hover?: boolean; // hover mode: transparent + click-through, so the row keeps hover
}> = ({ row, onClose, hover }) => {
  const registration = row[0] as string;

  // Convert values like "48,200", "48200", or "48,200 mi" → 48200
  const parseMileage = (value: unknown) => {
    const parsed = Number(String(value ?? "").replace(/[^0-9.-]/g, ""));

    return Number.isFinite(parsed) ? parsed : 0;
  };

  const currentMileage = parseMileage(row[1]);
  const nextServiceAt = parseMileage(row[2]);

  const remaining = nextServiceAt - currentMileage;

  const formatMileage = (value: number) =>
    `${value.toLocaleString("en-GB")} mi`;

  return (
    <div
      className={`fixed inset-0 z-[80] flex items-center justify-center p-4 font-['Stack_Sans_Headline'] ${hover ? "pointer-events-none" : "bg-black/30"}`}
      onClick={hover ? undefined : onClose}
    >
      <div
        className="w-[520px] max-w-full px-5 pt-5 pb-6 bg-white rounded-lg flex flex-col gap-3 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center">
          <h2 className=" text-black text-xl font-semibold ">
            Servicing Due
          </h2>

        </div>

        {/* Divider */}
        <div className="h-px w-full bg-neutral-100" />

        {/* Vehicle details */}
        <div className="py-1 flex flex-col gap-1">
          <div className="text-black text-base font-semibold">
            {registration}
          </div>

          <div className="text-neutral-700 text-sm">
            Current Mileage:{" "}
            <span className="font-semibold">
              {formatMileage(currentMileage)}
            </span>
          </div>
        </div>

        {/* Mileage cards */}
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Next Service */}
          <div className="flex-1 px-5 py-3 rounded-lg outline outline-1 -outline-offset-1 outline-neutral-200 flex flex-col justify-center gap-1">
            <div className="text-neutral-900 text-2xl font-weight-600 leading-6">
              {formatMileage(nextServiceAt)}
            </div>

            <div className="text-neutral-700 text-xs">Next Service At</div>
          </div>

          {/* Remaining */}
          <div className="flex-1 px-5 py-3 rounded-lg outline outline-1 -outline-offset-1 outline-neutral-200 flex flex-col justify-center gap-1">
            <div
              className={`text-2xl font-weight-600 leading-6 ${
                remaining < 0 ? "text-red-500" : "text-neutral-900"
              }`}
            >
              {remaining < 0
                ? `${Math.abs(remaining).toLocaleString("en-GB")} mi`
                : formatMileage(remaining)}
            </div>

            <div className="text-neutral-700 text-xs">
              {remaining < 0 ? "Overdue By" : "Remaining"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
  };
export const RoadFundExpiryPopup: React.FC<{
  row: (string | [string, string])[];
  bucket: { label: string; tone: string };
  onClose: () => void;
  hover?: boolean; // hover mode: transparent + click-through, so the row keeps hover
}> = ({ row, bucket, onClose, hover }) => {
  const registration = (row[0] as string) || "—";
  const expiryDate = (row[1] as string) || "—";
  const hireStatus = (row[5] as string) || "—";

  const parseDate = (value: string) => {
    if (!value || value === "—") return null;

    const date = new Date(value);

    return Number.isNaN(date.getTime()) ? null : date;
  };

  const expiry = parseDate(expiryDate);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (expiry) {
    expiry.setHours(0, 0, 0, 0);
  }

  const daysRemaining = expiry
    ? Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    : null;

  const isExpired = daysRemaining !== null && daysRemaining < 0;

  const formatDate = (value: string) => {
    const date = parseDate(value);

    if (!date) return value;

    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const badgeClass =
    bucket.tone === "red"
      ? "bg-red-100 text-red-500"
      : bucket.tone === "yellow"
        ? "bg-yellow-100 text-yellow-700"
        : bucket.tone === "blue"
          ? "bg-blue-100 text-blue-500"
          : bucket.tone === "orange"
            ? "bg-orange-100 text-orange-500"
            : "bg-neutral-100 text-neutral-700";

  return (
    <div
      className={`fixed inset-0 z-[80] flex items-center justify-center p-4 font-['Stack_Sans_Headline'] ${hover ? "pointer-events-none" : "bg-black/30"}`}
      onClick={hover ? undefined : onClose}
    >
      <div
        className="w-[520px] max-w-full px-5 pt-5 pb-6 bg-white rounded-lg flex flex-col gap-3 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center">
          <h2 className="text-black text-xl font-weight-600 leading-5">
            Road Fund Expiry
          </h2>

        </div>

        {/* Divider */}
        <div className="h-px w-full bg-neutral-100" />

        {/* Vehicle Details */}
        <div className="py-4 flex justify-between items-start gap-4">
          <div className="flex flex-col gap-1 min-w-0">
            <div className="text-black text-base font-semibold">
              {registration}
            </div>

            <div className="text-neutral-700 text-sm">
              Hire Status: <span className="font-semibold">{hireStatus}</span>
            </div>
          </div>

          {/* Expiry Status */}
          <div className="flex flex-col items-start gap-1 shrink-0">
            <span className={`px-2 py-1 rounded-sm text-xs ${badgeClass}`}>
              {bucket.label}
            </span>

            <span className="text-neutral-500 text-xs">
              {formatDate(expiryDate)}
            </span>
          </div>
        </div>

        {/* Days Remaining */}
        <div className="w-full">
          <div className="w-full px-5 py-3 rounded-lg outline outline-1 -outline-offset-1 outline-neutral-200 flex flex-col justify-center items-start gap-1">
            <div
              className={`text-2xl font-semibold leading-6 ${
                isExpired ? "text-red-500" : "text-neutral-900"
              }`}
            >
              {daysRemaining === null ? "—" : Math.abs(daysRemaining)}
            </div>

            <div className="text-neutral-700 text-xs">
              {isExpired ? "Days Overdue" : "Days Remaining"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export const MOTExpiryPopup: React.FC<{
  row: (string | [string, string])[];
  bucket: { label: string; tone: string };
  onClose: () => void;
  hover?: boolean; // hover mode: transparent + click-through, so the row keeps hover
}> = ({ row, bucket, onClose, hover }) => {
  const registration = (row[0] as string) || "—";
  const expiryDate = (row[1] as string) || "—";
  const hireStatus = (row[5] as string) || "—";
  // Driver only applies while the vehicle is on hire. The driver name is slot 3
  // (slot 2 is the days-remaining badge, e.g. ["Expired","red"]); otherwise show "—".
  const driver = (row[3] as string) || "";
  const customerName = hireStatus.trim().toLowerCase() === "on hire" && driver && driver !== "—" ? driver : "—";

  const parseDate = (value: string) => {
    if (!value || value === "—") return null;

    // Handles normal ISO/date strings returned by the backend.
    const date = new Date(value);

    return Number.isNaN(date.getTime()) ? null : date;
  };

  const expiry = parseDate(expiryDate);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (expiry) {
    expiry.setHours(0, 0, 0, 0);
  }

  const daysRemaining = expiry
    ? Math.ceil(
        (expiry.getTime() - today.getTime()) /
          (1000 * 60 * 60 * 24)
      )
    : null;

  const isExpired = daysRemaining !== null && daysRemaining < 0;

  const formatDate = (value: string) => {
    const date = parseDate(value);

    if (!date) return value;

    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const badgeClass =
    bucket.tone === "red"
      ? "bg-red-100 text-red-500"
      : bucket.tone === "yellow"
        ? "bg-yellow-100 text-yellow-700"
        : bucket.tone === "blue"
          ? "bg-blue-100 text-blue-500"
          : bucket.tone === "orange"
            ? "bg-orange-100 text-orange-500"
            : "bg-neutral-100 text-neutral-700";

  return (
    <div
      className={`fixed inset-0 z-[80] flex items-center justify-center p-4 font-['Stack_Sans_Headline'] ${hover ? "pointer-events-none" : "bg-black/30"}`}
      onClick={hover ? undefined : onClose}
    >
      <div
        className="w-[520px] max-w-full px-5 pt-5 pb-6 bg-white rounded-lg flex flex-col gap-3 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center">
          <h2 className="text-black text-xl font-weight-600 leading-5">
            MOT Expiry
          </h2>

        </div>

        {/* Divider */}
        <div className="h-px w-full bg-neutral-100" />

        {/* Vehicle details */}
        <div className="py-4 flex justify-between items-start gap-4">
          <div className="flex flex-col gap-1 min-w-0">
            <div className="text-black text-base font-semibold">
              {registration}
            </div>

            <div className="text-neutral-700 text-sm">
              Customer Name:{" "}
              <span className="font-semibold">{customerName}</span>
            </div>

            <div className="text-neutral-700 text-sm">
              Hire Status: <span className="font-semibold">{hireStatus}</span>
            </div>
          </div>

          <div className="flex flex-col items-start gap-1 shrink-0">
            <span className={`px-2 py-1 rounded-sm text-xs ${badgeClass}`}>
              {bucket.label}
            </span>

            <span className="text-neutral-500 text-xs">
              {formatDate(expiryDate)}
            </span>
          </div>
        </div>

        {/* Days Remaining */}
        <div className="w-full">
          <div className="w-full px-5 py-3 rounded-lg outline outline-1 -outline-offset-1 outline-neutral-200 flex flex-col justify-center items-start gap-1">
            <div
              className={`text-2xl font-weight-600 leading-6 ${
                isExpired ? "text-red-500" : "text-neutral-900"
              }`}
            >
              {daysRemaining === null ? "—" : Math.abs(daysRemaining)}
            </div>

            <div className="text-neutral-700 text-xs">
              {isExpired ? "Days Overdue" : "Days Remaining"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export const VMComplianceCards: React.FC<{ context?: string }> = ({ context }) => {
  const [data, setData] = useState<Expiries | null>(null);
  const dateKey = useDateKey();
  useEffect(() => {
    let cancelled = false;
    getExpiries(context).then((r) => { if (!cancelled) setData(r); });
    return () => { cancelled = true; };
  }, [context, dateKey]);
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
      {VM_COMPLIANCE.map((c) => {
        const t = data?.[c.key]?.tabs ?? { expired: 0, today: 0, d7: 0, d30: 0 };
        const total = t.expired + t.today + t.d7 + t.d30;
        const rows: [string, number, boolean][] = [
          ["Overdue", t.expired, true], ["Due Today", t.today, false],
          ["Due in 7 Days", t.d7, false], ["Due in 30 Days", t.d30, false],
        ];
        return (
          <div key={c.key} className={`p-4 rounded-lg outline outline-1 -outline-offset-1 ${c.ring} flex flex-col gap-2`}>
            <div className={`${c.head} rounded-lg flex items-center gap-3 pr-3`}>
              <span className="p-3 rounded flex items-center justify-center"><img src={c.icon} alt="" className="size-6" /></span>
              <span className="text-black text-xl font-weight-600 leading-5">{c.title}</span>
              <span className="ml-auto text-black text-xl font-weight-600 leading-5 tabular-nums">{total}</span>
            </div>
            <div className="p-3 flex flex-col gap-2">
              {rows.map(([label, val, danger]) => (
                <div key={label} className="flex justify-between items-start">
                  <span className={`text-sm font-weight-500 ${danger ? "text-red-500" : "text-neutral-700"}`}>{label}</span>
                  <span className={`text-base font-weight-600 tabular-nums ${danger ? "text-red-500" : "text-neutral-700"}`}>{val}</span>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// Fleet Performance — two cards (Fleet Utilization + Urgent Alerts) with a trend
// arrow and a period-over-period delta badge.
export const vmTrend = (up: boolean) => (
  <img src={up ? TrendingUpIcon : TrendingDownIcon} alt="" className="w-12 h-12 object-contain" />
);
export const VMFleetPerformance: React.FC<{ period: string; context?: string }> = ({ period, context }) => {
  const [live, setLive] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState(false); // full-screen spinner while the period refetch runs (like Hire Trend)
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getStats(period, context ? `vehicles_${context}` : "vehicles")
      .then((r) => { if (!cancelled) setLive(r); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [period, context]);
  const byKey = new Map((live?.cards ?? []).map((c) => [c.key, c]));
  const compare = live?.compare_label ?? "vs last month";
  const cards = [
    { c: byKey.get("fleet_availability"), icon: FleetNewIcon, iconBg: "bg-blue-100" },
    { c: byKey.get("urgent_alerts"), icon: UrgentNewIcon, iconBg: "bg-red-100" },
  ];
  return (
    <div className="p-4 rounded-lg outline outline-1 -outline-offset-1 outline-neutral-200 flex flex-col gap-6">
      {loading && <FleetSpinnerLoader />}
      <h2 className="text-black text-xl font-weight-600 leading-5">Fleet Performance</h2>
      <div className="flex flex-col sm:flex-row gap-6">
        {cards.map(({ c, icon, iconBg }, i) => {
          const up = c?.up ?? true;
          return (
            <div key={i} className="flex-1 p-4 rounded-lg outline outline-1 -outline-offset-1 outline-neutral-200 flex flex-col gap-3">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-4">
                  <span className={`p-3 ${iconBg} rounded flex items-center justify-center`}><img src={icon} alt="" className="size-6" /></span>
                  {vmTrend(up)}
                </div>
                <div className="flex flex-col items-start gap-1 text-right">
                  <div className="text-black text-2xl font-weight-600 leading-6">{c?.value ?? "—"}</div>
                  <div className="text-neutral-500 text-sm font-weight-500">{(c?.label ?? "").replace(/\s*\(.*\)$/, "")}</div>
                </div>
              </div>
              <div className="h-px bg-neutral-200" />
              <div className="flex items-center gap-2">
                <span className={`px-1 py-0.5 rounded text-xs font-weight-600 ${up ? "bg-green-100 text-green-600" : "bg-red-100 text-red-500"}`}>{up ? "+" : "-"}{c?.pct ?? "0"}%</span>
                <span className="text-neutral-500 text-sm">{compare}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Servicing Due — mileage list with All / Overdue / within-500 / within-1000 tabs.
export type ServTab = "all" | "overdue" | "within_500" | "within_1000";

export const ServicingRow: React.FC<{
  r: (string | [string, string])[];
  onClick?: () => void;
  onHoverIn?: () => void;
  onHoverOut?: () => void;
}> = ({ r, onClick, onHoverIn, onHoverOut }) => {
  const reg = r[0] as string;
  const cur = r[1] as string;
  const due = r[2] as string;

  const status = r[3] as [string, string];
  const overdue = Array.isArray(status) && status[1] === "red";

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={onHoverIn}
      onMouseLeave={onHoverOut}
      className="w-full text-left py-3 border-b border-neutral-100 flex justify-between items-center gap-3 hover:bg-neutral-50 transition"
    >
      <div className="flex flex-col gap-1 min-w-0 flex-1">
        <span className="text-black text-sm font-weight-500">
          {reg}
        </span>

        {/* Give "Current" a fixed width so "Due at" sits just to its right (near it),
            landing at the same x on every card instead of at the old 50% column. */}
        <div className="flex gap-2 text-xs text-neutral-700">
          <span className="whitespace-nowrap w-32 shrink-0">
            Current:{" "}
            <span className="font-weight-600">{cur} mi</span>
          </span>

          <span className="whitespace-nowrap">
            Due at:{" "}
            <span className="font-weight-600">{due} mi</span>
          </span>
        </div>
      </div>

      <span
        className={`shrink-0 px-3 py-1 rounded-sm text-xs whitespace-nowrap ${
          overdue
            ? "bg-red-100 text-red-500"
            : "bg-neutral-100 text-neutral-700"
        }`}
      >
        {Array.isArray(status) ? status[0] : ""}
      </span>
    </button>
  );
  };

export const servicingRowsByTab = (data: ServicingDue | null): Record<ServTab, (string | [string, string])[][]> => ({
  all: data ? [...data.rows.overdue, ...data.rows.within_500, ...data.rows.within_1000] : [],
  overdue: data?.rows.overdue ?? [],
  within_500: data?.rows.within_500 ?? [],
  within_1000: data?.rows.within_1000 ?? [],
});
export const ServicingTabsRow: React.FC<{ data: ServicingDue | null; tab: ServTab; setTab: (t: ServTab) => void }> = ({ data, tab, setTab }) => {
  const tt = data?.tabs;
  const tabs: [ServTab, string, number][] = [
    ["all", "All", tt ? tt.overdue + tt.within_500 + tt.within_1000 : 0],
    ["overdue", "Overdue", tt?.overdue ?? 0],
    ["within_500", "Due within 500 miles", tt?.within_500 ?? 0],
    ["within_1000", "Due within 1,000 miles", tt?.within_1000 ?? 0],
  ];
  return (
    <div className="flex flex-wrap gap-3">
      {tabs.map(([k, label, count]) => (
        <button key={k} type="button" onClick={() => setTab(k)}
          className={`px-3 py-1 rounded-full inline-flex gap-2 text-xs ${tab === k ? "bg-neutral-700 text-white" : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"}`}>
          <span>{label}</span><span>{count}</span>
        </button>
      ))}
    </div>
  );
};
export const ServicingDueSlider: React.FC<{ data: ServicingDue | null; onClose: () => void }> = ({ data, onClose }) => {
  const [tab, setTab] = useState<ServTab>("all");
  const shown = servicingRowsByTab(data)[tab];
  return (
    <div className="fixed inset-0 z-[60] flex justify-end font-['Stack_Sans_Headline']">
      <div className="flex-1 bg-black/30" onClick={onClose} />
      <div className="w-[700px] max-w-full bg-white h-full flex flex-col p-10 gap-5 overflow-auto">
        <div className="flex justify-between items-center">
          <h2 className="text-black text-2xl font-weight-600 leading-6">Servicing Due</h2>
          <button type="button" onClick={onClose} className="px-10 py-4 bg-neutral-900 rounded-sm text-white text-base font-weight-500 leading-4 hover:bg-black">Close</button>
        </div>
        <div className="h-px bg-neutral-200 w-full" />
        <ServicingTabsRow data={data} tab={tab} setTab={setTab} />
        {shown.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-sm text-neutral-400">No vehicles here.</div>
        ) : (
          <div className="flex flex-col">{shown.map((r, i) => <ServicingRow key={i} r={r} />)}</div>
        )}
      </div>
    </div>
  );
};
export const VMServicingDue: React.FC<{ context?: string }> = ({ context }) => {
  const [data, setData] = useState<ServicingDue | null>(null);
  const [tab, setTab] = useState<ServTab>("all");
  const [sliderOpen, setSliderOpen] = useState(false);
  useEffect(() => {
    let cancelled = false;
    getServicingDue(context).then((r) => { if (!cancelled) setData(r); });
    return () => { cancelled = true; };
  }, [context]);
  const shown = servicingRowsByTab(data)[tab];
  return (
    <div className="flex-1 min-w-0 px-4 py-6 rounded-lg outline outline-1 -outline-offset-1 outline-neutral-200 flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-start">
          <h2 className="text-black text-xl font-weight-600 leading-5">
            Servicing Due
          </h2>
          <button
            type="button"
            onClick={() => setSliderOpen(true)}
            className="h-8 px-3 py-2 rounded-sm outline outline-1 -outline-offset-1 outline-neutral-900 text-neutral-700 text-sm leading-4 hover:bg-neutral-50"
          >
            View All Vehicles
          </button>
        </div>
        <ServicingTabsRow data={data} tab={tab} setTab={setTab} />
      </div>
      <div className="flex flex-col">
        {shown.length === 0 ? (
          <div className="py-10 text-center text-xs text-neutral-400">
            No vehicles here.
          </div>
        ) : (
          shown
            .slice(0, 6)
            .map((r, i) => (
              <ServicingRow key={i} r={r} />
            ))
        )}
      </div>
      {sliderOpen && (
        <ServicingDueSlider data={data} onClose={() => setSliderOpen(false)} />
      )}
    </div>
  );
};

// Expiry sections (replace the carousel): MOT + Road Fund as lists, Plate as cards.
export const VM_EXP_BUCKETS: { key: "expired" | "today" | "d7" | "d30"; label: string; tone: string }[] = [
  { key: "expired", label: "Expired", tone: "red" },
  { key: "today", label: "Due Today", tone: "gray" },
  { key: "d7", label: "Due in 7 Days", tone: "yellow" },
  { key: "d30", label: "Due in 30 Days", tone: "blue" },
];
export const EXP_TONE: Record<string, string> = {
  red: "bg-red-100 text-red-500", gray: "bg-neutral-100 text-neutral-700",
  yellow: "bg-yellow-100 text-yellow-600", blue: "bg-blue-100 text-blue-500",
  orange: "bg-orange-100 text-orange-500", violet: "bg-violet-100 text-violet-600",
};
const EXP_MONTHS: Record<string, number> = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
};
const parseExpiryDisplayDate = (value: string) => {
  const text = value.trim();
  if (!text || text === "—") return null;

  const named = text.match(/^(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4})$/);
  if (named) {
    const month = EXP_MONTHS[named[2].toLowerCase()];
    if (month !== undefined) return new Date(Number(named[3]), month, Number(named[1]));
  }

  const iso = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (iso) return new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));

  const numeric = text.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2}|\d{4})$/);
  if (numeric) {
    const a = Number(numeric[1]);
    const b = Number(numeric[2]);
    const year = Number(numeric[3].length === 2 ? `20${numeric[3]}` : numeric[3]);
    const day = b > 12 ? b : a;
    const month = b > 12 ? a - 1 : b - 1;
    return new Date(year, month, day);
  }

  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};
const expiryDaysLabel = (dateStr: string, fallback: string, fallbackTone: string) => {
  const expiry = parseExpiryDisplayDate(dateStr);
  if (!expiry) return { label: fallback || "—", overdue: fallbackTone === "red" };

  expiry.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const days = Math.ceil((expiry.getTime() - today.getTime()) / 86400000);
  const count = Math.abs(days);
  return {
    label: `${count} Day${count === 1 ? "" : "s"} ${days < 0 ? "Overdue" : "Remaining"}`,
    overdue: days < 0,
  };
};
type ExpiryRowVariant = "default" | "statusCard";
// One outlined-card row for an expiry item (reg + hire status + bucket badge + date).
// Shared by the MOT / Road Fund dashboard sections and their sliders.
export const ExpiryRow: React.FC<{
  r: (string | [string, string])[];
  bucket: { label: string; tone: string };
  variant?: ExpiryRowVariant;
  onClick?: () => void;
  onHoverIn?: () => void;
  onHoverOut?: () => void;
}> = ({ r, bucket, variant = "default", onClick, onHoverIn, onHoverOut }) => {
  const reg = r[0] as string;
  const dateStr = r[1] as string;
  const status = (r[5] as string) || "";
  // Driver only applies while on hire (slot 3 is the driver; otherwise "—").
  const driver = (r[3] as string) || "";
  const customer = status.trim().toLowerCase() === "on hire" && driver && driver !== "—" ? driver : "—";
  const remaining = (Array.isArray(r[2]) ? r[2] : [(r[2] as string) || "", bucket.tone]) as [string, string];
  const remainingDays = expiryDaysLabel(dateStr, remaining[0], remaining[1] ?? bucket.tone);

  if (variant === "statusCard") {
    return (
      <button
        type="button"
        onClick={onClick}
        onMouseEnter={onHoverIn}
        onMouseLeave={onHoverOut}
        className="w-full text-left px-4 py-3 rounded-lg outline outline-1 -outline-offset-1 outline-neutral-200 flex flex-col items-start gap-2 hover:bg-neutral-50 transition"
      >
        <div className="w-full flex justify-between items-start gap-3">
          <div className="flex flex-col items-start gap-1 min-w-0">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-black text-sm font-weight-500 truncate">
                {reg}
              </span>

              {status && (
                <span className="text-blue-500 text-xs font-weight-600 shrink-0">
                  {status}
                </span>
              )}
            </div>

            {customer !== "—" && (
              <span className="text-neutral-700 text-xs truncate">
                {customer}
              </span>
            )}
          </div>

          <div className="flex flex-col items-end gap-1 shrink-0">
            <span
              className={`px-2 py-1 rounded-sm text-xs whitespace-nowrap ${
                EXP_TONE[bucket.tone] ?? EXP_TONE[remaining[1]] ?? EXP_TONE.gray
              }`}
            >
              {bucket.label}
            </span>

            <span className={`text-xs whitespace-nowrap ${remainingDays.overdue ? "text-red-500" : "text-neutral-500"}`}>
              {remainingDays.label}
            </span>
          </div>
        </div>

        <span className="text-neutral-500 text-xs">
          Expiry Date: {dateStr}
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={onHoverIn}
      onMouseLeave={onHoverOut}
      className="w-full text-left px-4 py-3 rounded-lg outline outline-1 -outline-offset-1 outline-neutral-200 flex flex-col gap-1 hover:bg-neutral-50 transition"
    >
      <div className="flex justify-between items-center gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-black text-sm font-weight-500 truncate">
            {reg}
          </span>

          {status && (
            <span className="text-blue-500 text-xs font-weight-600 shrink-0">
              {status}
            </span>
          )}
        </div>

        <span
          className={`shrink-0 px-2 py-1 rounded-sm text-xs whitespace-nowrap ${
            EXP_TONE[remaining[1]] ?? EXP_TONE[bucket.tone]
          }`}
        >
          {remaining[0] || bucket.label}
        </span>
      </div>

      <span className="text-neutral-500 text-xs">
        Expiry Date: {dateStr}
      </span>
      <span className="text-neutral-500 text-xs">
        Customer: {customer}
      </span>
    </button>
  );
};
// Drawer opened by an expiry section's "View All Vehicles" — tabs + Vehicle Status
// filter + full list of outlined rows.
export const ExpiryListSlider: React.FC<{ title: string; card?: ExpiryCard; rowVariant?: ExpiryRowVariant; onClose: () => void }> = ({ title, card, rowVariant, onClose }) => {
  const [tab, setTab] = useState<string>("all");
  const [statusSel, setStatusSel] = useState<string[]>([]);
 
  const tabs = card?.tabs ?? { expired: 0, today: 0, d7: 0, d30: 0 };
  const total = tabs.expired + tabs.today + tabs.d7 + tabs.d30;
  const flat = card ? VM_EXP_BUCKETS.flatMap((b) => (card.rows[b.key] || []).map((r) => ({ r, b }))) : [];
  // Show every vehicle-status type in the filter, even ones absent from this list.
  const statusOptions = VEH_ALWAYS_LEGEND.map(({ l }) => ({ label: l, value: l }));
  const shown = flat.filter((x) =>
    (tab === "all" || x.b.key === tab) && (!statusSel.length || statusSel.includes(x.r[5] as string)),
  );
  return (
    <div className="fixed inset-0 z-[60] flex justify-end font-['Stack_Sans_Headline']">
      <div className="flex-1 bg-black/30" onClick={onClose} />
      <div className="w-[700px] max-w-full bg-white h-full flex flex-col p-10 gap-5 overflow-auto">
        <div className="flex justify-between items-center">
          <h2 className="text-black text-2xl font-weight-600 leading-6">{title}</h2>
          <button type="button" onClick={onClose} className="px-10 py-4 bg-neutral-900 rounded-sm text-white text-base font-weight-500 leading-4 hover:bg-black">Close</button>
        </div>
        <div className="h-px bg-neutral-200 w-full" />
        <VMExpiryTabs tab={tab} setTab={setTab} tabs={tabs} total={total} />
        <div className="flex flex-wrap items-center gap-8">
          <p className="text-2xl font-weight-600 leading-6 text-black">{total} Vehicles</p>
          <FleetMultiSelectFilter label="Vehicle Status" options={statusOptions} selected={statusSel}
            onToggle={(v) => setStatusSel((s) => (s.includes(v) ? s.filter((x) => x !== v) : [...s, v]))} onClear={() => setStatusSel([])} />
        </div>
        {shown.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-sm text-neutral-400">No vehicles match.</div>
        ) : (
          <div className="flex flex-col gap-3">
           {shown.map(({ r, b }, i) => (
  <ExpiryRow key={i} r={r} bucket={b} variant={rowVariant} />
))}
          </div>
        )}
      </div>
    </div>
  );
};
export const VMExpiryTabs = ({ tab, setTab, tabs, total }: { tab: string; setTab: (t: string) => void; tabs: ExpiryCard["tabs"]; total: number }) => {
  const pills: [string, string, number][] = [["all", "All", total], ...VM_EXP_BUCKETS.map((b) => [b.key, b.label, tabs[b.key]] as [string, string, number])];
  return (
    <div className="flex flex-wrap gap-3">
      {pills.map(([k, label, count]) => (
        <button key={k} type="button" onClick={() => setTab(k)}
          className={`px-3 py-1 rounded-full inline-flex gap-2 text-xs ${tab === k ? "bg-neutral-700 text-white" : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"}`}>
          <span>{label}</span><span>{count}</span>
        </button>
      ))}
    </div>
  );
};
export const VMExpiryList: React.FC<{ title: string; card?: ExpiryCard; rowVariant?: ExpiryRowVariant }> = ({ title, card, rowVariant }) => {
  const [tab, setTab] = useState<string>("all");
  const [sliderOpen, setSliderOpen] = useState(false);
  const tabs = card?.tabs ?? { expired: 0, today: 0, d7: 0, d30: 0 };
  const total = tabs.expired + tabs.today + tabs.d7 + tabs.d30;
  const flat = card ? VM_EXP_BUCKETS.flatMap((b) => (card.rows[b.key] || []).map((r) => ({ r, b }))) : [];
  const shown = (tab === "all" ? flat : flat.filter((x) => x.b.key === tab)).slice(0, 5);
  return (
    <div className="flex-1 min-w-0 px-4 py-6 rounded-lg outline outline-1 -outline-offset-1 outline-neutral-200 flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <h2 className="text-black text-xl font-weight-600 leading-5">
            {title}
          </h2>
          <button
            type="button"
            onClick={() => setSliderOpen(true)}
            className="h-8 px-3 py-2 rounded-sm outline outline-1 -outline-offset-1 outline-neutral-900 text-neutral-700 text-sm leading-4 hover:bg-neutral-50"
          >
            View All Vehicles
          </button>
        </div>
        <VMExpiryTabs tab={tab} setTab={setTab} tabs={tabs} total={total} />
        <div className="text-black text-2xl font-weight-600 leading-6">
          {total} Vehicles
        </div>
      </div>
      <div className="flex flex-col gap-3">
        {shown.length === 0 ? (
          <div className="py-10 text-center text-xs text-neutral-400">
            No vehicles here.
          </div>
        ) : (
          shown.map(({ r, b }, i) => (
            <ExpiryRow key={i} r={r} bucket={b} variant={rowVariant} />
          ))
        )}
      </div>
      {sliderOpen && (
        <ExpiryListSlider
          title={title}
          card={card}
          rowVariant={rowVariant}
          onClose={() => setSliderOpen(false)}
        />
      )}
    </div>
  );
};
type PlateBucketRow = { r: (string | [string, string])[]; bucket: typeof VM_EXP_BUCKETS[number] };
const plateBucketRows = (card?: ExpiryCard): PlateBucketRow[] =>
  card ? VM_EXP_BUCKETS.flatMap((bucket) => (card.rows[bucket.key] || []).map((r) => ({ r, bucket }))) : [];
export const PlateCard: React.FC<{ row: PlateBucketRow }> = ({ row }) => {
  const { r, bucket } = row;
  const reg = r[0] as string, dateStr = r[1] as string, authority = r[3] as string, model = (r[4] as string) || "";
  const authorityLabel = authority && authority !== "—" ? authority : "—";
  const expiryClass = bucket.key === "expired" ? "text-red-500" : "text-neutral-500";

  return (
    <div className="h-full p-4 rounded-lg outline outline-1 -outline-offset-1 outline-neutral-200 flex flex-col justify-between items-start gap-5">
      <div className="w-full flex justify-between items-start gap-3">
        <div className="flex flex-col items-start gap-1 min-w-0">
          <span className="text-black text-sm font-weight-500 truncate">
            {reg}
          </span>
          {model && (
            <span className="text-neutral-700 text-xs truncate">
              {model}
            </span>
          )}
        </div>

        <span className={`shrink-0 px-2 py-1 rounded-sm text-xs font-normal whitespace-nowrap ${EXP_TONE[bucket.tone] ?? EXP_TONE.gray}`}>
          {bucket.label}
        </span>
      </div>

      <div className="flex flex-col items-start gap-2">
        <span className="text-neutral-500 text-xs">
          Authority: <span className="font-weight-600">{authorityLabel}</span>
        </span>
        <span className={`text-xs ${expiryClass}`}>
          Expiry Date: {dateStr}
        </span>
      </div>
    </div>
  );
};
export const PlateExpirySlider: React.FC<{ card?: ExpiryCard; onClose: () => void }> = ({ card, onClose }) => {
  const [tab, setTab] = useState<string>("all");
  const [statusSel, setStatusSel] = useState<string[]>([]);
  const tabs = card?.tabs ?? { expired: 0, today: 0, d7: 0, d30: 0 };
  const total = tabs.expired + tabs.today + tabs.d7 + tabs.d30;
  const all = plateBucketRows(card);
  const statusOptions = VEH_ALWAYS_LEGEND.map(({ l }) => ({ label: l, value: l }));
  const shown = all.filter((x) =>
    (tab === "all" || x.bucket.key === tab) && (!statusSel.length || statusSel.includes(x.r[5] as string)),
  );
  return (
    <div className="fixed inset-0 z-[60] flex justify-end font-['Stack_Sans_Headline']">
      <div className="flex-1 bg-black/30" onClick={onClose} />
      <div className="w-[970px] max-w-full bg-white h-full flex flex-col p-10 gap-5 overflow-auto">
        <div className="flex justify-between items-center">
          <h2 className="text-black text-2xl font-weight-600 leading-6">Plate Expiry</h2>
          <button type="button" onClick={onClose} className="px-10 py-4 bg-neutral-900 rounded-sm text-white text-base font-weight-500 leading-4 hover:bg-black">Close</button>
        </div>
        <div className="h-px bg-neutral-200 w-full" />
        <VMExpiryTabs tab={tab} setTab={setTab} tabs={tabs} total={total} />
        <div className="flex flex-wrap items-center gap-8">
          <p className="text-2xl font-weight-600 leading-6 text-black">{total} Vehicles</p>
          <FleetMultiSelectFilter label="Vehicle Status" options={statusOptions} selected={statusSel}
            onToggle={(v) => setStatusSel((s) => (s.includes(v) ? s.filter((x) => x !== v) : [...s, v]))} onClear={() => setStatusSel([])} />
        </div>
        {shown.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-sm text-neutral-400">No vehicles match.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-3 auto-rows-min">
            {shown.map((row, i) => <PlateCard key={i} row={row} />)}
          </div>
        )}
      </div>
    </div>
  );
};
export const VMPlateExpiry: React.FC<{ card?: ExpiryCard }> = ({ card }) => {
  const [tab, setTab] = useState<string>("all");
  const [sliderOpen, setSliderOpen] = useState(false);
  const tabs = card?.tabs ?? { expired: 0, today: 0, d7: 0, d30: 0 };
  const total = tabs.expired + tabs.today + tabs.d7 + tabs.d30;
  const all = plateBucketRows(card);
  const shown = (tab === "all" ? all : all.filter((x) => x.bucket.key === tab)).slice(0, 5);
  return (
    <div className="w-full flex-1 min-w-0 px-4 py-6 rounded-lg outline outline-1 -outline-offset-1 outline-neutral-200 flex flex-col gap-10">
      <div className="flex flex-col gap-5">
        <div className="flex justify-between items-center">
          <h2 className="text-black text-xl font-weight-600 leading-5">Plate Expiry</h2>
          <button type="button" onClick={() => setSliderOpen(true)} className="h-8 px-3 py-2 rounded-sm outline outline-1 -outline-offset-1 outline-neutral-900 text-neutral-700 text-sm leading-4 hover:bg-neutral-50">View All Vehicles</button>
        </div>
        <div className="flex flex-col gap-4">
          <VMExpiryTabs tab={tab} setTab={setTab} tabs={tabs} total={total} />
          <div className="text-black text-2xl font-weight-600 leading-6">{total} Vehicles</div>
        </div>
      </div>
      {shown.length === 0 ? (
        <div className="py-10 text-center text-xs text-neutral-400">No vehicles here.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {shown.map((row, i) => <PlateCard key={i} row={row} />)}
        </div>
      )}
      {sliderOpen && <PlateExpirySlider card={card} onClose={() => setSliderOpen(false)} />}
    </div>
  );
};
export const VMExpiryZone: React.FC<{ context?: string }> = ({ context }) => {
  const [data, setData] = useState<Expiries | null>(null);
  const dateKey = useDateKey();
  useEffect(() => {
    let cancelled = false;
    getExpiries(context).then((r) => { if (!cancelled) setData(r); });
    return () => { cancelled = true; };
  }, [context, dateKey]);
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col lg:flex-row gap-5">
        <VMExpiryList title="MOT Expiry" card={data?.mot} rowVariant="statusCard" />
        <VMExpiryList title="Road Fund Expiry" card={data?.road_fund} rowVariant="statusCard" />
      </div>
      <div className="flex flex-col lg:flex-row gap-5">
        <VMPlateExpiry card={data?.plate} />
      </div>
    </div>
  );
};

// ── Skyline hire dashboard (figma redesign) ───────────────────────────────────
// Four stat cards (Vehicles on Hire / Net Income / Fleet Utilization / Urgent
// Alerts) in the new card style — icon + trend + value + delta badge.
export const SK_STAT_ICONBG: Record<string, string> = {
  vehicles_on_hire: "bg-blue-100", net_income: "bg-neutral-100",
  fleet_availability: "bg-blue-100", urgent_alerts: "bg-red-100",
};
// New per-card icons (added as the client supplies them); falls back to FP_META otherwise.
export const SK_STAT_ICON: Record<string, string> = {
  vehicles_on_hire: VehiclesOnHireIcon,
  fleet_availability: FleetNewIcon,
  urgent_alerts: UrgentNewIcon,
  net_income: IncomeNewIcon,
};
export const SkylineFleetStats: React.FC<{ period: string }> = ({ period }) => {
  const [live, setLive] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState(false); // full-screen spinner while the period refetch runs (like Hire Trend)
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getStats(period, "skyline")
      .then((r) => { if (!cancelled) setLive(r); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [period]);
  const byKey = new Map((live?.cards ?? []).map((c) => [c.key, c]));
  const compare = live?.compare_label ?? "vs last month";
  return (
    <div className="flex flex-col sm:flex-row gap-6">
      {loading && <FleetSpinnerLoader />}
      {FP_ORDER.map((k) => {
        const c = byKey.get(k);
        const up = c?.up ?? true;
        return (
          <div key={k} className="flex-1 p-4 rounded-lg outline outline-1 -outline-offset-1 outline-neutral-200 flex flex-col gap-3">
            <div className="flex items-center gap-4">
              <span className={`p-3 ${SK_STAT_ICONBG[k]} rounded-sm flex items-center justify-center`}>{SK_STAT_ICON[k] ? <img src={SK_STAT_ICON[k]} alt="" className="size-6" /> : FP_META[k]?.icon}</span>
              {vmTrend(up)}
            </div>
            <div className="flex flex-col gap-1">
              <div className="text-black text-2xl font-weight-600 leading-6">{c?.value ?? "—"}</div>
              <div className="text-neutral-500 text-sm font-weight-500">{(c?.label ?? "").replace(/\s*\(.*\)$/, "")}</div>
            </div>
            <div className="h-px bg-neutral-200" />
            <div className="flex items-center gap-2">
              <span className={`px-1 py-0.5 rounded-sm text-xs font-weight-600 ${up ? "bg-green-100 text-green-700" : "bg-red-100 text-red-500"}`}>{up ? "+" : "-"}{c?.pct ?? "0"}%</span>
              <span className="text-neutral-500 text-sm">{compare}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// Weekly Payment Schedule slider — card rows opened by the section's "View All".
export const WP_TONE: Record<string, string> = {
  red: "bg-red-100 text-red-500", gray: "bg-blue-100 text-blue-500", blue: "bg-blue-100 text-blue-500",
  yellow: "bg-yellow-100 text-yellow-700", green: "bg-green-100 text-green-700",
};
// Full-detail preview shown while hovering a payment row on the dashboard (not the slider).
export const WPPaymentPreview: React.FC<{ reg: string; cust: string; hireStatus: string; status: [string, string]; dueDate: string; weekly: string; balance: string; partial?: string }> = ({ reg, cust, hireStatus, status, dueDate, weekly, balance, partial }) => (
  <div className="w-[440px] max-w-[92vw] px-5 pt-5 pb-6 bg-white rounded-lg shadow-2xl border border-neutral-200 flex flex-col gap-3">
    <div className="text-black text-xl font-weight-600 leading-5">Weekly Payment Schedule</div>
    <div className="h-px bg-neutral-100 w-full" />
    <div className="py-1 flex justify-between items-start">
      <div className="flex flex-col gap-1 min-w-0">
        <div className="text-black text-base font-weight-600">{reg}</div>
        <div><span className="text-neutral-700 text-sm">Customer: </span><span className="text-neutral-700 text-sm font-weight-600">{cust}</span></div>
        <div><span className="text-neutral-700 text-sm">Hire Status: </span><span className="text-neutral-700 text-sm font-weight-600">{hireStatus}</span></div>
      </div>
      <div className="flex flex-col items-end gap-1 shrink-0">
        {Array.isArray(status) && <span className={`px-2 py-1 rounded-sm text-xs whitespace-nowrap ${WP_TONE[status[1]] ?? "bg-neutral-100 text-neutral-600"}`}>{status[0]}</span>}
        <div className="text-neutral-500 text-xs">Due Date: {dueDate}</div>
      </div>
    </div>
    <div className="flex justify-start items-start gap-4">
      <div className="flex-1 px-4 py-3 rounded-lg outline outline-1 -outline-offset-1 outline-neutral-200 flex flex-col justify-center items-start gap-1">
        <div className="text-neutral-900 text-2xl font-weight-600 leading-6">{weekly}</div>
        <div className="text-neutral-700 text-xs">Weekly:</div>
      </div>
      {partial && (
        <div className="flex-1 px-4 py-3 rounded-lg outline outline-1 -outline-offset-1 outline-neutral-200 flex flex-col justify-center items-start gap-1">
          <div className="text-neutral-900 text-2xl font-weight-600 leading-6">{partial}</div>
          <div className="text-neutral-700 text-xs">Partial Received:</div>
        </div>
      )}
      <div className="flex-1 px-4 py-3 rounded-lg outline outline-1 -outline-offset-1 outline-neutral-200 flex flex-col justify-center items-start gap-1">
        <div className="text-neutral-900 text-2xl font-weight-600 leading-6">{balance}</div>
        <div className="text-neutral-700 text-xs">Balance:</div>
      </div>
    </div>
  </div>
);
export const WPPaymentCard: React.FC<{ r: (string | [string, string])[]; hoverPreview?: boolean }> = ({ r, hoverPreview }) => {
  const reg = r[0] as string, cust = r[1] as string, weekly = r[2] as string, balance = r[3] as string, dueDate = r[4] as string;
  const status = r[5] as [string, string];
  const hireStatus = (r[6] as string) || "—";
  const partial = (r[7] as string) || "";
  const overdue = Array.isArray(status) && status[1] === "red";
  const received = Array.isArray(status) && status[1] === "green";
  // A part-paid installment (owed, with some money already in) shows an extra "Partial
  // Received" line between Weekly and Balance; fully-paid / unpaid rows don't.
  const showPartial = !received && (parseFloat(partial.replace(/[£,]/g, "")) || 0) > 0;
  return (
    <div className={`group relative p-4 rounded-lg outline outline-1 -outline-offset-1 ${overdue ? "outline-red-500" : "outline-neutral-200"} flex justify-between items-start gap-3`}>
      <div className="flex flex-col gap-1 min-w-0">
        <div className="flex items-start gap-3">
          {/* fixed-width reg/customer column so every status pill lines up at the same x */}
          <div className="flex flex-col gap-1 w-40 shrink-0">
            <span className="text-black text-sm font-weight-500 truncate">{reg}</span>
            <span className="text-neutral-700 text-xs truncate">{cust}</span>
          </div>
          {Array.isArray(status) && <span className={`shrink-0 px-2 py-1 rounded-sm text-xs whitespace-nowrap ${WP_TONE[status[1]] ?? "bg-neutral-100 text-neutral-600"}`}>{status[0]}</span>}
        </div>
        <span className="text-neutral-500 text-xs">Due Date: {dueDate}</span>
      </div>
      <div className="flex flex-col shrink-0">
        <div className="flex items-center gap-1"><span className="w-28 text-neutral-700 text-xs whitespace-nowrap">Weekly: </span><span className="text-neutral-900 text-sm font-weight-600">{weekly}</span></div>
        {showPartial && <div className="flex items-center gap-1"><span className="w-28 text-neutral-700 text-xs whitespace-nowrap">Partial Received: </span><span className="text-neutral-900 text-sm font-weight-600">{partial}</span></div>}
        <div className="flex items-center gap-1"><span className="w-28 text-neutral-700 text-xs whitespace-nowrap">Balance: </span><span className="text-neutral-900 text-sm font-weight-600">{balance}</span></div>
      </div>
      {hoverPreview && (
        <div className="pointer-events-none fixed inset-0 z-[60] hidden group-hover:flex items-center justify-center">
          <WPPaymentPreview reg={reg} cust={cust} hireStatus={hireStatus} status={status} dueDate={dueDate} weekly={weekly} balance={balance} partial={showPartial ? partial : ""} />
        </div>
      )}
    </div>
  );
};
export const WeeklyPaymentSlider: React.FC<{ data: WeeklyPayments | null; onClose: () => void }> = ({ data, onClose }) => {
  const [tab, setTab] = useState<string>("all");
  const rowsByTab: Record<string, (string | [string, string])[][]> = {
    all: data?.rows.all ?? [], overdue: data?.rows.overdue ?? [], due_today: data?.rows.due_today ?? [],
    due_this_week: data?.rows.due_this_week ?? [], received_today: data?.rows.received_today ?? [],
  };
  const t = data?.tabs;
  const tabs: [string, string, number][] = [
    ["all", "All", t?.all ?? 0], ["overdue", "Overdue", t?.overdue ?? 0], ["received_today", "Received", t?.received_today ?? 0],
    ["due_today", "Due Today", t?.due_today ?? 0], ["due_this_week", "Due This Week", t?.due_this_week ?? 0],
  ];
  // "All" shows this week's schedule in date order (already chronological from the backend),
  // then previous-week overdue backlog appended at the very end. Other tabs show their rows.
  const keyOf = (r: (string | [string, string])[]) => `${r[0]}|${r[4]}`;
  const allRows = rowsByTab.all ?? [];
  const currentKeys = new Set(allRows.map(keyOf));
  const prevOverdue = (rowsByTab.overdue ?? []).filter((r) => !currentKeys.has(keyOf(r)));
  const shown = tab === "all" ? [...allRows, ...prevOverdue] : (rowsByTab[tab] ?? []);
  return (
    <div className="fixed inset-0 z-[60] flex justify-end font-['Stack_Sans_Headline']">
      <div className="flex-1 bg-black/30" onClick={onClose} />
      <div className="w-[900px] max-w-full bg-white h-full flex flex-col p-10 gap-5 overflow-auto">
        <div className="flex justify-between items-center">
          <h2 className="text-black text-2xl font-weight-600 leading-6">Weekly Payment Schedule</h2>
          <button type="button" onClick={onClose} className="px-10 py-4 bg-neutral-900 rounded-sm text-white text-base font-weight-500 leading-4 hover:bg-black">Close</button>
        </div>
        <div className="h-px bg-neutral-200 w-full" />
        <div className="flex flex-wrap gap-3">
          {tabs.map(([k, label, count]) => (
            <button key={k} type="button" onClick={() => setTab(k)}
              className={`px-3 py-1 rounded-full inline-flex gap-2 text-xs ${tab === k ? "bg-neutral-700 text-white" : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"}`}>
              <span>{label}</span><span>{count}</span>
            </button>
          ))}
        </div>
        {shown.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-sm text-neutral-400">No payments here.</div>
        ) : (
          <div className="flex flex-col gap-3">{shown.map((r, i) => <WPPaymentCard key={i} r={r} />)}</div>
        )}
      </div>
    </div>
  );
};


// ── Shared dashboard shell: top bar + first-load spinner + centred content. ────
export const DashboardShell: React.FC<{ side?: "skyline" | "vehicles"; context?: string; children: React.ReactNode }> = ({ side = "skyline", context, children }) => {
  const [loading, setLoading] = useState(true);
  const taskModule = context ? `vehicles_${context}` : side === "vehicles" ? "vehicles" : "skyline";
  useEffect(() => {
    let cancelled = false;
    Promise.allSettled([
      getStats("MTD", taskModule), getVehicleStatus(context), getWeeklyPayments(), getExpiries(context),
      getCompliance(context), getAttention(side, context), getHireTrend("WTD", ""),
      listFleetTasks({ module: taskModule, all_users: true }),
    ]).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [side, taskModule, context]);
  return (
    <div className="min-h-screen bg-white text-neutral-900 font-['Stack_Sans_Headline']">
      {loading && <FleetSpinnerLoader />}
      <div className="sticky top-0 z-20 h-[80px] px-7 border-b border-[#eee] bg-white flex items-center justify-between">
        <span className="text-neutral-900 text-2xl font-weight-600 leading-6">Dashboard</span>
        <FleetNotificationBell module={taskModule} />
      </div>
      <div className="flex flex-col items-center">
        <div className="w-full max-w-[1440px] px-7 pt-6 pb-14">{children}</div>
      </div>
    </div>
  );
};
