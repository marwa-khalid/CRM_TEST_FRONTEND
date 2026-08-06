import React, { useState, useRef, useEffect, useLayoutEffect, useCallback } from "react";
import FleetNotificationBell from "../components/FleetNotificationBell";
import TrendingUp from "../../assets/Dashboard/TrendingUp.svg";
import TrendingDown from "../../assets/Dashboard/TrendingDown.svg";
import AllTasksIcon from "../../assets/Dashboard/AllTasks.svg";
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
import FleetMultiSelectFilter from "../components/FleetMultiSelectFilter";
import FleetSpinnerLoader from "../components/FleetSpinnerLoader";
import FleetMissingDocumentsSlider from "../components/FleetMissingDocumentsSlider";
import {
  getHireTrend, getStats, getVehicleStatus, getWeeklyPayments, getCompliance, getExpiries, getAttention,
  type WeeklyPayments, type PaymentSummary, type Attention, type Compliance, type Expiries,
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

const CardHead: React.FC<{ icon?: React.ReactNode; title: string; sub?: string; right?: React.ReactNode }> = ({ icon, title, sub, right }) => (
  <div className="flex items-center justify-between gap-2.5 mb-4">
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
  blue: "bg-blue-100 text-blue-600", gray: "bg-gray-200 text-zinc-500",
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
}> = ({ head, rows, headText = "text-neutral-500", cellText = "text-neutral-900", rowClass = "py-3" }) => (
  <table className="w-full border-collapse">
    <thead>
      <tr>{head.map((h) => <th key={h} className={`text-left text-sm ${headText} pb-2.5 pt-1 px-2 border-b border-neutral-100`}>{h}</th>)}</tr>
    </thead>
    <tbody>
      {rows.map((r, i) => (
        <tr key={i}>
          {r.map((cell, j) => (
            <td key={j} className={`${rowClass} px-2 border-b border-neutral-100 align-top`}>
              <span className={`${cellText} text-xs font-weight-500 line-clamp-1`}>{Array.isArray(cell) ? cell[0] : cell}</span>
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  </table>
);

// ── Hire Trend (WTD/MTD/YTD periods + YoY/MoM comparison) ─────────────────────
type TrendView = { labels: string[]; vals: number[]; cap: string; cmp?: string };
const HT_VIEWS: Record<string, TrendView> = {
  WTD: { labels: ["Mon", "Tue", "Wed", "Thu", "Fri"], vals: [3, 5, 4, 6, 4], cap: "03-08-26 to 07-08-26" },
  MTD: { labels: ["W1", "W2", "W3", "W4", "W5"], vals: [12, 15, 11, 14, 8], cap: "Aug 2026" },
  YTD: { labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug"], vals: [42, 38, 50, 46, 55, 48, 60, 52], cap: "Jan–Aug 2026" },
  Custom: { labels: ["22 Jun", "29 Jun", "6 Jul", "13 Jul", "20 Jul", "27 Jul"], vals: [10, 13, 11, 15, 12, 14], cap: "22 Jun – 27 Jul 2026" },
  YoY: { labels: ["2025", "2026"], vals: [520, 611], cap: "2025 vs 2026", cmp: "from last year" },
  MoM: { labels: ["Jul", "Aug"], vals: [58, 66], cap: "Jul vs Aug 2026", cmp: "from last month" },
};
function niceAxis(rawMax: number, steps: number) {
  const step = Math.max(1, Math.ceil(Math.max(1, rawMax) / steps));
  const ticks: number[] = [];
  for (let i = 0; i <= steps; i++) ticks.push(step * i);
  return { max: step * steps, ticks };
}
const chevron = <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5"><path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;

const HT_STATUS_OPTS = [{ label: "All Statuses", value: "" }, { label: "On Hire", value: "on_hire" }, { label: "Off Hire", value: "off_hire" }];
const HireTrend: React.FC = () => {
  const [period, setPeriod] = useState("WTD");
  const [mode, setMode] = useState("");
  const [status, setStatus] = useState("");
  const [statusOpen, setStatusOpen] = useState(false);
  const statusRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (statusRef.current && !statusRef.current.contains(e.target as Node)) setStatusOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  // Live vehicle-hire counts from the Fleet backend. Falls back to HT_VIEWS
  // placeholders until data lands (or if the backend isn't reachable).
  const [live, setLive] = useState<TrendView | null>(null);
  useEffect(() => {
    setLive(null); // show the placeholder for the new period until live data lands
    let cancelled = false;
    getHireTrend(period, mode, status).then((r) => {
      if (cancelled || !r || !r.values?.length) return;
      setLive({ labels: r.labels, vals: r.values, cap: r.caption, cmp: r.comparison_note || undefined });
    });
    return () => {
      cancelled = true;
    };
  }, [period, mode, status]);
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
      <h3 className="text-xl font-weight-600 text-neutral-900 mb-3.5">Hire Trend</h3>
      <div className="flex items-center gap-2.5 flex-wrap mb-4">
        <div className="inline-flex items-center gap-0.5 border border-neutral-200 rounded p-0.5">
          {["WTD", "MTD", "YTD"].map((p) => (
            <button key={p} type="button" onClick={() => { setPeriod(p); setMode(""); }} className={segBtn(!mode && period === p)}>{p}</button>
          ))}
        </div>
        <button type="button" onClick={() => { setPeriod("Custom"); setMode(""); }}
          className={`inline-flex items-center gap-1.5 border border-neutral-200 rounded px-3 py-1.5 text-[13px] leading-none ${!mode && period === "Custom" ? "bg-neutral-900 text-white" : "text-zinc-500"}`}>
          <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5"><rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.7" /><path d="M3 9h18M8 3v4M16 3v4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" /></svg>
          Custom
        </button>
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
            ? (<><span className={`font-weight-700 ${up ? "text-green-600" : "text-red-500"}`}>{(up ? "▲ " : "▼ ") + Math.abs(pct).toFixed(1) + "%"}</span> {v.cmp}</>)
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
                  <div className={`relative rounded-t ${isCmp ? "bg-neutral-300" : "bg-neutral-600 group-hover:bg-neutral-700"}`} style={{ height: h.toFixed(1) + "%", width: `${barW}px` }}>
                    <div className="absolute bottom-[calc(100%+6px)] left-1/2 -translate-x-1/2 bg-white border border-neutral-200 rounded-lg px-2.5 py-1 text-[11px] whitespace-nowrap shadow opacity-0 group-hover:opacity-100 transition pointer-events-none z-10">{v.labels[i] + " · " + val + " hires"}</div>
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
const VEH_SEG = [
  { l: "Available", v: 38, c: "#bbf7d0" }, { l: "On Hire", v: 54, c: "#a2cfff" },
  { l: "In Repair", v: 12, c: "#fed7aa" }, { l: "Off Fleet", v: 8, c: "#fecaca" },
  { l: "Awaiting Plating", v: 9, c: "#7ba7ea" }, { l: "Awaiting De-fleet", v: 7, c: "#a1a1aa" },
];
// Colour per status label — presentation stays here; counts come live from the API.
const VEH_COLORS: Record<string, string> = {
  Available: "#bbf7d0", "On Hire": "#a2cfff", "In Repair": "#fed7aa",
  "Off Fleet": "#fecaca", "Awaiting Plating": "#7ba7ea", "Awaiting De-fleet": "#a1a1aa",
};
const VEH_FALLBACK_COLORS = ["#c7d2fe", "#fde68a", "#99f6e4", "#fecaca", "#a1a1aa"];
const VehicleDonut: React.FC = () => {
  // Live vehicle-status distribution; falls back to VEH_SEG placeholders.
  const [seg, setSeg] = useState<{ l: string; v: number; c: string }[] | null>(null);
  useEffect(() => {
    let cancelled = false;
    getVehicleStatus().then((r) => {
      if (cancelled) return;
      setSeg(
        r && r.segments?.length
          ? r.segments.map((s, i) => ({ l: s.label, v: s.value, c: VEH_COLORS[s.label] ?? VEH_FALLBACK_COLORS[i % VEH_FALLBACK_COLORS.length] }))
          : null,
      );
    });
    return () => {
      cancelled = true;
    };
  }, []);
  const data = seg ?? VEH_SEG;
  const total = data.reduce((s, x) => s + x.v, 0) || 1;
  const r = 56, C = 2 * Math.PI * r;
  let off = 0;
  const arcs = data.map((x, i) => {
    const len = (x.v / total) * C;
    const el = <circle key={i} cx="80" cy="80" r={r} fill="none" stroke={x.c} strokeWidth="22" strokeDasharray={`${len.toFixed(2)} ${(C - len).toFixed(2)}`} strokeDashoffset={(-off).toFixed(2)} transform="rotate(-90 80 80)" />;
    off += len;
    return el;
  });
  return (
    <Card span="col-span-12 lg:col-span-5">
      <CardHead
        icon={<GreyIconBox><img src={VehicleStatusIcon} alt="" className="size-6" /></GreyIconBox>}
        title="Vehicle Status Distribution"
      />
      <div className="flex-1 flex items-center content-center gap-6 flex-wrap py-1.5">
        <svg viewBox="0 0 160 160" className="w-[220px] h-[220px] shrink-0">
          {arcs}
          <text x="80" y="80" textAnchor="middle" fontSize="30" fontWeight="700" fill="#111827">{total}</text>
          <text x="80" y="100" textAnchor="middle" fontSize="14" fill="#6b7280">Total</text>
        </svg>
        <div className="flex-1 min-w-[160px] flex flex-col gap-3">
          {data.map((x, i) => (
            <div key={i} className="flex items-center gap-2.5 text-sm">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: x.c }} />
              <span className="flex-1 text-neutral-700 truncate">{x.l}</span>
              <span className="font-weight-600 text-neutral-900 tabular-nums pl-3 pr-2">{x.v}</span>
            </div>
          ))}
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
const AttentionRequired: React.FC = () => {
  const [live, setLive] = useState<Attention | null>(null);
  const [missingOpen, setMissingOpen] = useState(false);
  useEffect(() => {
    let cancelled = false;
    getAttention().then((r) => {
      if (!cancelled) setLive(r);
    });
    return () => {
      cancelled = true;
    };
  }, []);
  return (
    <div className="col-span-12">
      <h2 className="text-neutral-900 text-[20px] font-weight-600 mb-3">Attention Required</h2>
      <div className="flex items-stretch gap-4">
        {ATTENTION.map((a) => {
          const clickable = a.label === "Missing Documents";
          return (
            <div
              key={a.label}
              onClick={clickable ? () => setMissingOpen(true) : undefined}
              className={`flex-1 rounded-lg border ${a.tint} p-4 flex flex-col gap-2 ${clickable ? "cursor-pointer hover:shadow-sm transition" : ""}`}
            >
              <div className="flex items-center gap-4">
                <img src={a.icon} alt="" />
                <div className="flex flex-col">
                  <span className="text-neutral-900 text-[24px] font-weight-600">{live ? live[ATTENTION_KEY[a.label]] : a.value}</span>
                  <span className="text-neutral-700 text-[14px] font-weight-500">{a.label}</span>
                </div>
              </div>
              <div className="my-2 h-px w-full bg-neutral-200" />
              <p className="text-neutral-500 text-[14px]">{a.note}</p>
            </div>
          );
        })}
      </div>
      {missingOpen && <FleetMissingDocumentsSlider onClose={() => setMissingOpen(false)} />}
    </div>
  );
};

// ── Task Management (ditto the Claims dashboard "Tasks Details") ──────────────
type Task = { t: string; due: string; od?: boolean };
type TaskCol = { count: number; label: string; icon: string; iconBg: string; border: string; tasks: Task[] };
const TASK_COLS: TaskCol[] = [
  { count: 8, label: "All Tasks", icon: AllTasksIcon, iconBg: "bg-blue-100", border: "border-blue-200", tasks: [] },
  { count: 2, label: "Overdue Tasks", icon: OverdueIcon, iconBg: "bg-red-100", border: "border-red-200", tasks: [
    { t: "Chase MOT booking - MA19 KLP", due: "Due: 31/07/2026 · Overdue 3 Days", od: true }, { t: "Recover overdue payment - HK18 ZDC", due: "Due: 28/07/2026 · Overdue 6 Days", od: true }] },
  { count: 3, label: "Awaiting Response", icon: CriticalIcon, iconBg: "bg-yellow-100", border: "border-amber-200", tasks: [
    { t: "Await V5C from DVLA - WV23 MLK", due: "Due: 09/08/2026" }, { t: "Engineer inspection reply - BK75 OYN", due: "Due: 07/08/2026" }, { t: "Insurer claim update - HK18 ZDC", due: "Due: 10/08/2026" }] },
  { count: 4, label: "Pending Followups", icon: PendingFollowupsIcon, iconBg: "bg-neutral-100", border: "border-neutral-300", tasks: [
    { t: "Follow up deposit refund - GF20 TRN", due: "Due: 12/08/2026" }, { t: "Confirm service booking - LR21 XVT", due: "Due: 11/08/2026" },
    { t: "Renew road fund licence - WV23 MLK", due: "Due: 13/08/2026" }, { t: "Schedule vehicle swap - BK75 OYN", due: "Due: 14/08/2026" }] },
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
    { count: active.length, label: "All Tasks", icon: AllTasksIcon, iconBg: "bg-blue-100", border: "border-blue-200", tasks: pick(uncovered) },
    { count: overdue.length, label: "Overdue Tasks", icon: OverdueIcon, iconBg: "bg-red-100", border: "border-red-200", tasks: pick(overdue) },
    { count: awaiting.length, label: "Awaiting Response", icon: CriticalIcon, iconBg: "bg-yellow-100", border: "border-amber-200", tasks: pick(awaiting) },
    { count: pending.length, label: "Pending Followups", icon: PendingFollowupsIcon, iconBg: "bg-neutral-100", border: "border-neutral-300", tasks: pick(pending) },
  ];
};
const TaskManagement: React.FC = () => {
  // Live tasks (all users in the tenant, Skyline module); falls back to the
  // TASK_COLS placeholders if the backend returns nothing / is unreachable.
  const [cols, setCols] = useState<TaskCol[] | null>(null);
  useEffect(() => {
    let cancelled = false;
    listFleetTasks({ module: "skyline", all_users: true }).then((tasks) => {
      if (cancelled) return;
      setCols(tasks && tasks.length ? buildTaskCols(tasks) : null);
    });
    return () => {
      cancelled = true;
    };
  }, []);
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
            {col.tasks.map((t, i) => (
              <button key={i} type="button" className={`w-full text-left bg-white rounded-md border ${col.border} p-3 flex flex-col gap-1.5 hover:shadow-sm transition`}>
                <span className="text-neutral-900 text-sm font-weight-500 line-clamp-1">{t.t}</span>
                <span className={`text-xs ${t.od ? "text-red-500" : "text-neutral-400"}`}>{t.due}</span>
              </button>
            ))}
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
const FP_META: Record<string, { icon: React.ReactNode; bar: string }> = {
  vehicles_on_hire: { icon: <img src={FileStatIcon} alt="" className="w-4 h-4" style={FP_ICON_FILTER} />, bar: "bg-blue-500" },
  net_income: { icon: <img src={PoundStatIcon} alt="" className="w-4 h-4" style={FP_ICON_FILTER} />, bar: "bg-emerald-500" },
  fleet_availability: { icon: <img src={CarsStatIcon} alt="" className="w-4 h-4" style={FP_ICON_FILTER} />, bar: "bg-indigo-500" },
};
type FPCard = { key: string; label: string; value: string; pct: string; up: boolean; sub: string; progress: number };
const FP_FALLBACK: FPCard[] = [
  { key: "vehicles_on_hire", label: "Vehicles on Hire", value: "12", pct: "6.4", up: true, sub: "of 42 active units", progress: 29 },
  { key: "net_income", label: "Net Income", value: "£84,290", pct: "12.4", up: true, sub: "Month to date", progress: 74 },
  { key: "fleet_availability", label: "Fleet Availability", value: "70.3%", pct: "2.1", up: false, sub: "43 units available now", progress: 70 },
];
const FleetPerformance: React.FC<{ period: string }> = ({ period }) => {
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
      setLive(
        r.cards.filter((c) => c.key !== "urgent_alerts").slice(0, 3).map((c) => ({
          key: c.key, label: c.label.replace(/\s*\(.*\)$/, ""), value: c.value, pct: c.pct, up: c.up, sub: c.sub, progress: c.progress,
        })),
      );
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [period]);
  const data = live ?? FP_FALLBACK;
  return (
    <div className="col-span-12 bg-white rounded-xl shadow-[0px_1px_3px_0px_rgba(0,0,0,0.05)] border border-neutral-200 overflow-hidden">
      {loading && <FleetSpinnerLoader />}
      <div className="px-5 py-4 border-b border-neutral-100">
        <h3 className="text-xl font-weight-600 text-neutral-900 leading-tight">Fleet Performance</h3>
      </div>
      <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-4">
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
type SkyKey = "available" | "hire" | "off" | "repair";
type SkyVehicle = { registration: string; model: string; statusKey: SkyKey; statusLabel: string; hireInfo?: string; customer?: string };
const SKY_STATUS_STYLE: Record<SkyKey, string> = {
  available: "bg-green-100 text-green-700", hire: "bg-slate-200 text-blue-600",
  off: "bg-neutral-200 text-neutral-600", repair: "bg-orange-100 text-orange-500",
};
const SKY_VEHICLES: SkyVehicle[] = [
  { registration: "BK75 OYN", model: "Ford Transit Custom", statusKey: "hire", statusLabel: "On Hire", hireInfo: "On Hire for 12 Days", customer: "Sarah M. Morgan" },
  { registration: "LR21 XVT", model: "Mercedes Sprinter", statusKey: "hire", statusLabel: "On Hire", hireInfo: "On Hire for 5 Days", customer: "James Okafor" },
  { registration: "MA19 KLP", model: "VW Transporter", statusKey: "hire", statusLabel: "On Hire", hireInfo: "On Hire for 21 Days", customer: "Aisha Khan" },
  { registration: "GF20 TRN", model: "Vauxhall Vivaro", statusKey: "available", statusLabel: "Available" },
  { registration: "HK18 ZDC", model: "Ford Transit", statusKey: "off", statusLabel: "Off Hire" },
  { registration: "WV23 MLK", model: "Peugeot Boxer", statusKey: "repair", statusLabel: "In Repair" },
  { registration: "DA22 KLM", model: "Renault Trafic", statusKey: "available", statusLabel: "Available" },
  { registration: "SN71 PQR", model: "Citroën Relay", statusKey: "hire", statusLabel: "On Hire", hireInfo: "On Hire for 3 Days", customer: "Priya Nair" },
  { registration: "YT19 BND", model: "Ford Transit Custom", statusKey: "hire", statusLabel: "On Hire", hireInfo: "On Hire for 8 Days", customer: "David Bennett" },
  { registration: "KP68 RSV", model: "Mercedes Vito", statusKey: "available", statusLabel: "Available" },
  { registration: "LC22 WFN", model: "VW Crafter", statusKey: "hire", statusLabel: "On Hire", hireInfo: "On Hire for 16 Days", customer: "Grace Adeyemi" },
  { registration: "RG20 TFD", model: "Vauxhall Movano", statusKey: "repair", statusLabel: "In Repair" },
  { registration: "BX71 JLM", model: "Peugeot Expert", statusKey: "off", statusLabel: "Off Hire" },
  { registration: "MH19 QAZ", model: "Renault Master", statusKey: "hire", statusLabel: "On Hire", hireInfo: "On Hire for 2 Days", customer: "Thomas Reed" },
  { registration: "ND23 CPL", model: "Citroën Dispatch", statusKey: "available", statusLabel: "Available" },
  { registration: "PV18 KRT", model: "Toyota Proace", statusKey: "hire", statusLabel: "On Hire", hireInfo: "On Hire for 27 Days", customer: "Lucy Zhang" },
  { registration: "SW72 HGB", model: "Nissan Primastar", statusKey: "off", statusLabel: "Off Hire" },
  { registration: "TN21 DWF", model: "Ford Transit", statusKey: "hire", statusLabel: "On Hire", hireInfo: "On Hire for 11 Days", customer: "Omar Haddad" },
];
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
  vehicles: SkyVehicle[];
  summary: { label: string; value: number; className: string }[];
  onClose: () => void;
}> = ({ vehicles, summary, onClose }) => (
  <div className="fixed inset-0 z-[60] flex justify-end font-['Stack_Sans_Headline']">
    <div className="flex-1 bg-black/30" onClick={onClose} />
    <div className="w-[1120px] max-w-full bg-white h-full flex flex-col p-10 gap-6">
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
        <div className="flex flex-wrap items-center gap-2">
          {summary.map((item) => (
            <div key={item.label} className={`rounded p-3 text-sm font-weight-400 font-normal leading-4 ${item.className}`}>{item.label} {item.value}</div>
          ))}
        </div>
      </div>
      <div className="flex-1 overflow-auto grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4 auto-rows-min">
        {vehicles.map((v, i) => <SkyVehicleCard key={`${v.registration}-${i}`} v={v} />)}
      </div>
    </div>
  </div>
);
const SkylineOperations: React.FC = () => {
  const [regSel, setRegSel] = useState<string[]>([]);
  const [statusSel, setStatusSel] = useState<string[]>([]);
  const [dateSel, setDateSel] = useState<string[]>([]);
  const [sliderOpen, setSliderOpen] = useState(false); // "View All" opens a right-side drawer
  const toggle = (setter: React.Dispatch<React.SetStateAction<string[]>>, val: string) =>
    setter((s) => (s.includes(val) ? s.filter((x) => x !== val) : [...s, val]));
  const regOptions = SKY_VEHICLES.map((v) => ({ label: v.registration, value: v.registration }));
  const statusOptions = [{ label: "Available", value: "available" }, { label: "On Hire", value: "hire" }, { label: "Off Hire", value: "off" }];
  const dateOptions = [{ label: "Today", value: "today" }, { label: "1 Week", value: "1w" }, { label: "1 Month", value: "1m" }];
  const summaryItems = [
    { label: "Available", value: 12, statusKey: "available", className: "bg-green-100 text-green-700" },
    { label: "On Hire", value: 25, statusKey: "hire", className: "bg-blue-100 text-blue-600" },
    { label: "Off Hire", value: 5, statusKey: "off", className: "bg-gray-200 text-zinc-500" },
  ];
  const filtered = SKY_VEHICLES.filter((v) => (!regSel.length || regSel.includes(v.registration)) && (!statusSel.length || statusSel.includes(v.statusKey)));
  const visible = filtered.slice(0, 8);
  return (
    <section className="col-span-12 w-full rounded-lg border border-neutral-200 px-4 py-6 min-w-0">
      <div className="flex flex-col gap-10">
        <h2 className="text-xl font-weight-600 leading-5 text-black">Skyline Vehicles</h2>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-8">
              <div className="flex flex-col gap-1">
                <p className="text-2xl font-weight-600 leading-6 text-black">42 Vehicles</p>
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
            <div className="py-12 text-center text-sm text-neutral-400">No fleet vehicles match.</div>
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
      {sliderOpen && <SkylineVehiclesSlider vehicles={filtered} summary={summaryItems} onClose={() => setSliderOpen(false)} />}
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
const SERVICING_BUCKETS: Record<string, (string | [string, string])[][]> = {
  overdue: [
    ["DX20 UHG", "124,560 mi", ["1,250 mi", "red"]],
    ["NL69 FZY", "98,765 mi", ["320 mi", "red"]],
    ["RJ19 KPL", "142,300 mi", ["890 mi", "red"]],
  ],
  weekly: [
    ["PF22 RVB", "76,450 mi", "—"],
    ["KM72 LZP", "54,210 mi", "—"],
    ["TL21 WSA", "61,020 mi", "—"],
  ],
  monthly: [
    ["GU23 YWR", "33,890 mi", "—"],
    ["HP20 FTN", "45,600 mi", "—"],
    ["VC19 LDR", "72,310 mi", "—"],
  ],
};
const EXPIRY: Expiry[] = [
  { span: "col-span-12 lg:col-span-6", icon: serviceIcon, title: "Servicing Due", tabs: [["red", "Overdue", "3"], ["orange", "Weekly", "7"], ["gray", "Monthly", "14"]], bucketKeys: ["overdue", "weekly", "monthly"], head: ["Vehicle", "Current Mileage", "Overdue"], buckets: SERVICING_BUCKETS, rows: [...SERVICING_BUCKETS.overdue, ...SERVICING_BUCKETS.weekly, ...SERVICING_BUCKETS.monthly] },
  { span: "col-span-12 md:col-span-6 xl:col-span-4", icon: motIcon, title: "MOT Expiry", tabs: [["red", "Expired", "2"], ["blue", "Today", "1"], ["orange", "7 Days", "5"], ["gray", "30 Days", "13"]], head: ["Vehicle", "Expiry Date", "Remaining Days"], rows: [
    ["BX68 YZO", "12 May 2025", ["Expired", "red"]], ["VU18 KXL", "10 May 2025", ["Expired", "red"]], ["YL24 HBG", "13 May 2025", ["Today", "orange"]], ["FP21 KJU", "17 May 2025", ["4 days", "orange"]], ["MJ23 XTD", "18 May 2025", ["5 days", "orange"]]] },
  { span: "col-span-12 md:col-span-6 xl:col-span-4", icon: plate, title: "Plate Expiry", tabs: [["red", "Expired", "1"], ["orange", "7 Days", "3"], ["gray", "30 Days", "9"]], head: ["Vehicle", "Expiry Date", "Remaining Days"], rows: [
    ["HN19 KTP", "9 May 2025", ["Expired", "red"]], ["BC21 LMW", "14 May 2025", ["2 days", "orange"]], ["TF70 XRD", "16 May 2025", ["3 days", "orange"]], ["MK22 VBS", "19 May 2025", ["6 days", "orange"]], ["GL68 PNC", "27 May 2025", ["14 days", "green"]]] },
  { span: "col-span-12 md:col-span-6 xl:col-span-4", icon: roadIcon, title: "Road Fund Licence", tabs: [["red", "Expired", "1"], ["orange", "7 Days", "4"], ["gray", "30 Days", "10"]], head: ["Vehicle", "Expiry Date", "Remaining Days"], rows: [
    ["YC67 BMO", "11 May 2025", ["Expired", "red"]], ["GU24 VPL", "16 May 2025", ["3 days", "orange"]], ["FN22 TYG", "17 May 2025", ["4 days", "orange"]], ["PL73 HNZ", "19 May 2025", ["6 days", "orange"]], ["WA72 FFE", "25 May 2025", ["12 days", "green"]]] },
];
// Build one live expiry card from the API shape (MOT / Plate / Road Fund).
const buildExpiryCard = (title: string, icon: React.ReactNode, span: string, card: Expiries["mot"]): Expiry => ({
  span, icon, title,
  tabs: [
    ["red", "Expired", String(card.tabs.expired)],
    ["blue", "Today", String(card.tabs.today)],
    ["orange", "7 Days", String(card.tabs.d7)],
    ["gray", "30 Days", String(card.tabs.d30)],
  ],
  head: ["Vehicle", "Expiry Date", "Remaining Days"],
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
    <div className="w-[720px] max-w-full bg-white h-full flex flex-col p-10 gap-5">
      <div className="flex justify-between items-start">
        <h2 className="text-black text-2xl font-weight-600 leading-6">{title}</h2>
        <button type="button" onClick={onClose} className="px-10 py-4 bg-neutral-900 rounded text-white text-base font-weight-500 leading-4 hover:bg-black">Close</button>
      </div>
      <div className="h-px bg-neutral-100 w-full" />
      <div className="text-black text-xl font-weight-600 leading-5">{rows.length} Records</div>
      <div className="flex-1 overflow-auto">
        {variant === "cards" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
          <DataTable head={head} rows={rows} headText="text-neutral-600 font-weight-400" cellText="text-neutral-700" />
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
        EXPIRY[0],
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
    const measure = () => {
      const w = el.clientWidth;
      if (w <= 0) return;
      const per = window.innerWidth >= 1024 ? 3 : window.innerWidth >= 640 ? 2 : 1;
      const cw = Math.floor((w - (per - 1) * CAROUSEL_GAP) / per);
      if (cw > 0) setCardW(cw);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener("resize", measure);
    return () => {
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
      className={`absolute top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white border border-neutral-100 shadow-md grid place-items-center text-[#9A9EB2] hover:text-neutral-600 transition-colors ${dir === "l" ? "left-2" : "right-2"}`}>
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
              return (
                <div key={i} className="shrink-0 min-w-0" style={{ width: cardW }}>
                  <div className="rounded-xl border border-neutral-200 p-6 flex flex-col min-w-0 h-full gap-1">
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
                    <div className="overflow-x-auto"><DataTable head={e.head} rows={displayRows} headText="text-neutral-700 font-normal" cellText="text-neutral-500" rowClass="py-4" /></div>
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
  { title: "MOT", icon: <img src={MOTIcon} alt="" className="size-8" />, overdue: 2, bar: 10, d7: 1, d30: 13 },
  { title: "Plate", icon: <img src={PlateIcon} alt="" className="size-8" />, overdue: 9, bar: 26, d7: 5, d30: 18 },
  { title: "Road Fund Licence", icon: <img src={RoadTaxIcon} alt="" className="size-8" />, overdue: 1, bar: 8, d7: 4, d30: 10 },
  { title: "Service", icon: <img src={ServiceIcon} alt="" className="size-8" />, overdue: 3, bar: 16, d7: 7, d30: 14 },
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
      : { ...c, total: 42, compliant: 95, amber: 6 };
  });
  return (
    <div className="col-span-12">
      {/* Category cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {data.map((c) => (
          <div key={c.title} className="bg-white rounded-xl shadow-[0px_1px_4px_0px_rgba(0,0,0,0.05)] border border-neutral-200 px-5 pt-5 pb-4 flex flex-col">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                {c.icon}
                <h4 className="text-neutral-900 text-sm font-weight-600 leading-5 truncate">{c.title}</h4>
              </div>
              <span className="px-2 py-0.5 bg-neutral-100 rounded-full text-neutral-500 text-xs font-weight-600 leading-4 shrink-0">{c.total} total</span>
            </div>
            <div className="mt-4 h-1.5 bg-neutral-100 rounded flex gap-px overflow-hidden">
              <span className="bg-red-500 h-full" style={{ width: `${c.bar}%` }} />
              <span className="bg-amber-400 h-full" style={{ width: `${c.amber}%` }} />
              <span className="bg-emerald-100 h-full flex-1" />
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
  { key: "due_today", tone: "blue", label: "Due Today" },
  { key: "due_this_week", tone: "gray", label: "Due This Week" },
  { key: "overdue", tone: "red", label: "Overdue" },
  { key: "received_today", tone: "green", label: "Received Today" },
];
const WP_FALLBACK_ROWS: (string | [string, string])[][] = [
  ["GU72 OPN", "Alpha Haulage Ltd", "£525.00", "£525.00", "13 May 2025", ["Due Today", "blue"]],
  ["FL21 XZM", "Northline Logistics", "£650.00", "£650.00", "13 May 2025", ["Due Today", "blue"]],
  ["WA22 KHG", "Swift Couriers", "£475.00", "£475.00", "13 May 2025", ["Due Today", "blue"]],
  ["BV71 YXT", "Pinnacle Transport", "£575.00", "£575.00", "14 May 2025", ["This Week", "orange"]],
  ["NJ23 LFP", "Urban Freight Co", "£525.00", "£525.00", "15 May 2025", ["This Week", "orange"]],
];
const WP_FALLBACK_COUNTS: WeeklyPayments["tabs"] = { due_today: 6, due_this_week: 18, overdue: 4, received_today: 11 };
const WP_FALLBACK_SUMMARY: PaymentSummary = {
  total: "£30,490", overdue: "£4,140", due_today: "£1,340", received: "£24,600",
  by_day: [
    { day: "Mon", amount: 3200 }, { day: "Tue", amount: 2400 }, { day: "Wed", amount: 5100 },
    { day: "Thu", amount: 6800 }, { day: "Fri", amount: 5200 }, { day: "Sat", amount: 1600 }, { day: "Sun", amount: 300 },
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
    <aside className="shrink-0 w-40 bg-neutral-50 border border-neutral-100 rounded-lg p-4 flex flex-col gap-4">
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
      : [...live.rows.overdue, ...live.rows.due_today, ...live.rows.due_this_week]
    : WP_FALLBACK_ROWS;
  const displayRows = rows.slice(0, 5);
  return (
    <Card span="col-span-12 lg:col-span-7">
      <CardHead
        icon={<GreyIconBox><img src={WeeklyPaymentIcon} alt="" className="size-4" /></GreyIconBox>}
        title="Weekly Payment Schedule"
      />
      <div className="flex gap-4 min-w-0">
        <WPSummary s={summary} />
        <div className="flex-1 min-w-0 flex flex-col">
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
          {rows.length > 5 && (
            <div className="flex justify-center pt-3">
              <button type="button" onClick={() => setSliderOpen(true)} className="inline-flex h-8 items-center justify-center rounded bg-neutral-900 px-3 py-2 text-sm font-weight-400 font-normal leading-4 text-white transition hover:bg-black whitespace-nowrap">View All ({rows.length})</button>
            </div>
          )}
        </div>
      </div>
      {sliderOpen && <RecordsSlider title="Weekly Payment Schedule" head={["Vehicle", "Customer", "Weekly Payment", "Outstanding", "Due Date", "Status"]} rows={rows} onClose={() => setSliderOpen(false)} />}
    </Card>
  );
};

// ── page ──────────────────────────────────────────────────────────────────────
const FleetDashboard: React.FC = () => {
  // Full-screen loader while the dashboard's data loads (same as the other screens).
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("MTD"); // global period (drives Fleet Performance)
  useEffect(() => {
    let cancelled = false;
    Promise.allSettled([
      getStats("MTD"), getVehicleStatus(), getWeeklyPayments(), getExpiries(),
      getCompliance(), getAttention(), getHireTrend("WTD", ""),
      listFleetTasks({ module: "skyline", all_users: true }),
    ]).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);
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
            <ComplianceSummary />
            {/* Period toggle sits with Fleet Performance — it drives that card. */}
            <div className="col-span-12 flex flex-col gap-3">
              <div className="flex items-center">
                <div className="p-[3px] bg-neutral-100 rounded-lg inline-flex items-center gap-1">
                  {["WTD", "MTD", "YTD"].map((p) => (
                    <button key={p} type="button" onClick={() => setPeriod(p)} className={`px-4 py-[5px] rounded-md text-xs font-weight-600 leading-5 transition ${period === p ? "bg-neutral-900 text-white" : "text-neutral-500 hover:text-neutral-700"}`}>{p}</button>
                  ))}
                </div>
              </div>
              <FleetPerformance period={period} />
            </div>
            <AttentionRequired />
            <HireTrend />
            <WeeklyPayment />
            <VehicleDonut />
            <TaskManagement />
            <ExpiryCarousel />
            <SkylineOperations />
          </div>
        </div>
      </div>
    </div>
  );
};

export default FleetDashboard;
