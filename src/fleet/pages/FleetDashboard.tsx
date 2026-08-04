import React, { useState, useRef, useEffect, useCallback } from "react";
import { Bell } from "lucide-react";
import TrendingUp from "../../assets/Dashboard/TrendingUp.svg";
import TrendingDown from "../../assets/Dashboard/TrendingDown.svg";
import Cars from "../../assets/Dashboard/Cars.svg";
import Pound from "../../assets/Dashboard/Pound.svg";
import Urgent from "../../assets/Dashboard/Urgent.svg";
import AllTasksIcon from "../../assets/Dashboard/AllTasks.svg";
import OverdueIcon from "../../assets/Dashboard/Overdue.svg";
import CriticalIcon from "../../assets/Dashboard/Critical.svg";
import PendingFollowupsIcon from "../../assets/Dashboard/PendingFollowups.svg";
import MOTIcon from "../assets/dashboard/MOT.svg";
import RoadTaxIcon from "../assets/dashboard/Road tax.svg";
import ServiceIcon from "../assets/dashboard/Service.svg";
import VehicleStatusIcon from "../assets/dashboard/Vehiclestatus.svg";
import PaymentsIcon from "../assets/dashboard/Payments.svg";
import PlateIcon from "../assets/dashboard/Plate.svg";
import ComplianceIcon from "../assets/dashboard/Compliance.svg";
import FleetMultiSelectFilter from "../components/FleetMultiSelectFilter";

// Fleet Dashboard — pure inline Tailwind (same convention as the Claims dashboard).
// Sample data is hard-coded for now; wire to fleet services when the APIs land.

// ── shared bits ──────────────────────────────────────────────────────────────
const Card: React.FC<{ span: string; className?: string; children: React.ReactNode }> = ({ span, className = "", children }) => (
  <div className={`${span} rounded-xl border border-neutral-200 p-5 flex flex-col min-w-0 ${className}`}>{children}</div>
);

// Sky-tinted, outlined icon box for the compliance / expiry / section-header icons.
const SkyIconBox: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="size-8 bg-sky-100 rounded-lg outline outline-1 outline-offset-[-1px] outline-sky-200 inline-flex justify-center items-center overflow-hidden shrink-0 text-sky-600">
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

const ViewAll: React.FC = () => <button type="button" className="inline-flex h-8 items-center justify-center rounded bg-blue-100 px-3 py-2 text-sm font-weight-400 font-normal leading-4 text-blue-600 transition hover:bg-blue-200 whitespace-nowrap">View All</button>;

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
const DataTable: React.FC<{ head: string[]; rows: (string | [string, string])[][] }> = ({ head, rows }) => (
  <table className="w-full border-collapse">
    <thead>
      <tr>{head.map((h) => <th key={h} className="text-left text-xs text-neutral-500 pb-2.5 pt-1 px-2 border-b border-neutral-100">{h}</th>)}</tr>
    </thead>
    <tbody>
      {rows.map((r, i) => (
        <tr key={i}>
          {r.map((cell, j) => (
            <td key={j} className="py-3 px-2 border-b border-neutral-100 align-top">
              <span className="text-neutral-900 text-sm font-weight-500 line-clamp-1">{Array.isArray(cell) ? cell[0] : cell}</span>
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

const HireTrend: React.FC = () => {
  const [period, setPeriod] = useState("WTD");
  const [mode, setMode] = useState("");
  const v = HT_VIEWS[mode || period];
  const two = v.vals.length <= 2;
  const ax = niceAxis(Math.max(...v.vals), 4);
  const Y = (x: number) => 100 - (x / ax.max) * 100;
  const total = v.vals.reduce((a, b) => a + b, 0);
  const pct = v.vals[0] ? ((v.vals[1] - v.vals[0]) / v.vals[0]) * 100 : 0;
  const up = pct >= 0;
  const segBtn = (active: boolean) => `px-4 py-1.5 rounded-md text-[13px] leading-none ${active ? "bg-blue-300 text-white" : "text-blue-600"}`;

  return (
    <Card span="col-span-12">
      <h3 className="text-xl font-weight-600 text-neutral-900 mb-3.5">Hire Trend</h3>
      <div className="flex items-center gap-2.5 flex-wrap mb-4">
        <div className="inline-flex items-center gap-0.5 border border-blue-200 rounded-lg p-0.5">
          {["WTD", "MTD", "YTD"].map((p) => (
            <button key={p} type="button" onClick={() => { setPeriod(p); setMode(""); }} className={segBtn(!mode && period === p)}>{p}</button>
          ))}
        </div>
        <button type="button" onClick={() => { setPeriod("Custom"); setMode(""); }}
          className={`inline-flex items-center gap-1.5 border border-blue-200 rounded-lg px-3 py-1.5 text-[13px] leading-none ${!mode && period === "Custom" ? "bg-blue-300 text-white" : "text-blue-600"}`}>
          <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5"><rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.7" /><path d="M3 9h18M8 3v4M16 3v4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" /></svg>
          Custom
        </button>
        <div className="inline-flex items-center gap-0.5 border border-blue-200 rounded-lg p-0.5">
          {["YoY", "MoM"].map((m) => (
            <button key={m} type="button" onClick={() => setMode(mode === m ? "" : m)} className={segBtn(mode === m)}>{m}</button>
          ))}
        </div>
        <button type="button" className="inline-flex items-center gap-1.5 text-[13px] text-blue-600 px-1 py-1.5">Referrer {chevron}</button>
        <button type="button" className="inline-flex items-center gap-1.5 text-[13px] text-blue-600 px-1 py-1.5">Status {chevron}</button>
        <span className="ml-auto inline-flex items-center gap-1.5 bg-blue-100 text-blue-600 rounded-full px-4 py-2 text-[13px] whitespace-nowrap">
          {mode
            ? (<><span className={`font-weight-700 ${up ? "text-green-600" : "text-red-500"}`}>{(up ? "▲ " : "▼ ") + Math.abs(pct).toFixed(1) + "%"}</span> {v.cmp}</>)
            : (<><b className="text-blue-500 font-weight-700 tabular-nums">{total}</b> Hires</>)}
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
                  <div className="absolute bottom-[calc(100%+6px)] left-1/2 -translate-x-1/2 bg-white border border-neutral-200 rounded-lg px-2.5 py-1 text-[11px] whitespace-nowrap shadow opacity-0 group-hover:opacity-100 transition pointer-events-none z-10">{v.labels[i] + " · " + val + " hires"}</div>
                  <div className={`rounded-t ${two ? "w-[84px]" : "w-3.5"} ${isCmp ? "bg-blue-200" : "bg-blue-500 group-hover:bg-blue-600"}`} style={{ height: h.toFixed(1) + "%" }} />
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
const VehicleDonut: React.FC = () => {
  const total = VEH_SEG.reduce((s, x) => s + x.v, 0);
  const r = 56, C = 2 * Math.PI * r;
  let off = 0;
  const arcs = VEH_SEG.map((x, i) => {
    const len = (x.v / total) * C;
    const el = <circle key={i} cx="80" cy="80" r={r} fill="none" stroke={x.c} strokeWidth="22" strokeDasharray={`${len.toFixed(2)} ${(C - len).toFixed(2)}`} strokeDashoffset={(-off).toFixed(2)} transform="rotate(-90 80 80)" />;
    off += len;
    return el;
  });
  return (
    <Card span="col-span-12 lg:col-span-5">
      <CardHead
        icon={<SkyIconBox><img src={VehicleStatusIcon} alt="" className="size-4" /></SkyIconBox>}
        title="Vehicle Status Distribution"
      />
      <div className="flex-1 flex items-center content-center gap-6 flex-wrap py-1.5">
        <svg viewBox="0 0 160 160" className="w-[220px] h-[220px] shrink-0">
          {arcs}
          <text x="80" y="80" textAnchor="middle" fontSize="30" fontWeight="700" fill="#111827">{total}</text>
          <text x="80" y="100" textAnchor="middle" fontSize="14" fill="#6b7280">Total</text>
        </svg>
        <div className="flex-1 min-w-[160px] flex flex-col gap-3">
          {VEH_SEG.map((x, i) => (
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
const AttentionRequired: React.FC = () => (
  <div className="col-span-12">
    <h2 className="text-neutral-900 text-[20px] font-weight-600 mb-3">Attention Required</h2>
    <div className="flex items-stretch gap-4">
      {ATTENTION.map((a) => (
        <div key={a.label} className={`flex-1 rounded-lg border ${a.tint} p-4 flex flex-col gap-2`}>
          <div className="flex items-center gap-4">
            <img src={a.icon} alt="" />
            <div className="flex flex-col">
              <span className="text-neutral-900 text-[24px] font-weight-600">{a.value}</span>
              <span className="text-neutral-700 text-[14px] font-weight-500">{a.label}</span>
            </div>
          </div>
          <div className="my-2 h-px w-full bg-neutral-200" />
          <p className="text-neutral-500 text-[14px]">{a.note}</p>
        </div>
      ))}
    </div>
  </div>
);

// ── Task Management (ditto the Claims dashboard "Tasks Details") ──────────────
type Task = { t: string; due: string; od?: boolean };
type TaskCol = { count: number; label: string; icon: string; iconBg: string; border: string; tasks: Task[] };
const TASK_COLS: TaskCol[] = [
  { count: 8, label: "All Tasks", icon: AllTasksIcon, iconBg: "bg-blue-100", border: "border-blue-200", tasks: [
    { t: "Collect vehicle from repair - LR21 XVT", due: "Due: 05/08/2026" }, { t: "Upload insurance cert - MA19 KLP", due: "Due: 06/08/2026" },
    { t: "Arrange plate transfer - GF20 TRN", due: "Due: 08/08/2026" }, { t: "Chase MOT booking - MA19 KLP", due: "Due: 31/07/2026 · Overdue 3 Days", od: true },
    { t: "Confirm service booking - LR21 XVT", due: "Due: 11/08/2026" }] },
  { count: 2, label: "Overdue Tasks", icon: OverdueIcon, iconBg: "bg-red-100", border: "border-red-200", tasks: [
    { t: "Chase MOT booking - MA19 KLP", due: "Due: 31/07/2026 · Overdue 3 Days", od: true }, { t: "Recover overdue payment - HK18 ZDC", due: "Due: 28/07/2026 · Overdue 6 Days", od: true }] },
  { count: 3, label: "Awaiting Response", icon: CriticalIcon, iconBg: "bg-yellow-100", border: "border-amber-200", tasks: [
    { t: "Await V5C from DVLA - WV23 MLK", due: "Due: 09/08/2026" }, { t: "Engineer inspection reply - BK75 OYN", due: "Due: 07/08/2026" }, { t: "Insurer claim update - HK18 ZDC", due: "Due: 10/08/2026" }] },
  { count: 4, label: "Pending Followups", icon: PendingFollowupsIcon, iconBg: "bg-neutral-100", border: "border-neutral-300", tasks: [
    { t: "Follow up deposit refund - GF20 TRN", due: "Due: 12/08/2026" }, { t: "Confirm service booking - LR21 XVT", due: "Due: 11/08/2026" },
    { t: "Renew road fund licence - WV23 MLK", due: "Due: 13/08/2026" }, { t: "Schedule vehicle swap - BK75 OYN", due: "Due: 14/08/2026" }] },
];
const TaskManagement: React.FC = () => (
  <div className="col-span-12">
    <h2 className="text-neutral-900 text-[20px] font-weight-600 mb-4">Task Management</h2>
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
      {TASK_COLS.map((col) => (
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

// ── Top stat cards (icons + backgrounds taken from the Claims dashboard) ───────
type Kpi = { value: React.ReactNode; label: string; pct: string; up: boolean; iconBg: string; icon: React.ReactNode };
const KPI_DATA: Kpi[] = [
  { value: "30", label: "Vehicles on Hire", pct: "6.4", up: true, iconBg: "bg-blue-100", icon: <img src={Cars} alt="" /> },
  { value: "£38,420", label: "Net Income (MTD)", pct: "11.2", up: true, iconBg: "bg-neutral-100", icon: <img src={Pound} alt="" /> },
  { value: "71%", label: "Fleet Availability", pct: "1.4", up: true, iconBg: "bg-blue-100", icon: <img src={Cars} alt="" /> },
  { value: "7", label: "Urgent Alerts", pct: "2.0", up: false, iconBg: "bg-red-100", icon: <img src={Urgent} alt="" /> },
];
const StatCards: React.FC = () => {
  const [period, setPeriod] = useState("WTD");
  return (
    <div className="col-span-12 flex flex-col gap-6">
      <div className="rounded outline outline-1 outline-offset-[-1px] outline-blue-200 inline-flex items-center gap-1 w-fit">
        {["WTD", "MTD", "YTD"].map((p) => (
          <button key={p} type="button" onClick={() => setPeriod(p)} className={`px-4 py-2 rounded text-sm leading-4 ${period === p ? "bg-blue-300 text-white" : "text-blue-500"}`}>{p}</button>
        ))}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {KPI_DATA.map((c) => (
          <div key={c.label} className="rounded-lg border border-neutral-200 p-4 flex flex-col gap-3">
            <div className="flex items-center gap-4">
              <span className={`w-9 h-9 rounded ${c.iconBg} flex items-center justify-center`}>{c.icon}</span>
              <img src={c.up ? TrendingUp : TrendingDown} alt="" />
            </div>
            <div className="text-neutral-900 text-2xl font-weight-600 leading-7">{c.value}</div>
            <div className="text-neutral-500 text-xs">{c.label}</div>
            <div className="mt-2 h-px w-full bg-neutral-200" />
            <div className="mt-2 flex items-center gap-2">
              <span className={`flex items-center gap-1 shrink-0 whitespace-nowrap rounded px-2 py-1 text-sm font-weight-600 ${c.up ? "bg-green-100 text-green-500" : "bg-red-100 text-red-500"}`}>
                <img src={c.up ? TrendingUp : TrendingDown} alt="" className="w-3.5 h-3.5 shrink-0" />{c.pct}%
              </span>
              <span className="text-xs font-weight-500 text-neutral-500 leading-tight">vs last month</span>
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
];
const SkyVehicleCard: React.FC<{ v: SkyVehicle }> = ({ v }) => (
  <div className="flex min-h-32 flex-1 items-start justify-between rounded-lg border border-neutral-200 p-4">
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
const SkylineOperations: React.FC = () => {
  const [regSel, setRegSel] = useState<string[]>([]);
  const [statusSel, setStatusSel] = useState<string[]>([]);
  const [dateSel, setDateSel] = useState<string[]>([]);
  const toggle = (setter: React.Dispatch<React.SetStateAction<string[]>>, val: string) =>
    setter((s) => (s.includes(val) ? s.filter((x) => x !== val) : [...s, val]));
  const regOptions = SKY_VEHICLES.map((v) => ({ label: v.registration, value: v.registration }));
  const statusOptions = [{ label: "Available", value: "available" }, { label: "On Hire", value: "hire" }, { label: "Off Hire", value: "off" }];
  const dateOptions = [{ label: "Today", value: "today" }, { label: "1 Week", value: "1w" }, { label: "1 Month", value: "1m" }];
  const summaryItems = [
    { label: "Available", value: 12, className: "bg-green-100 text-green-700" },
    { label: "On Hire", value: 25, className: "bg-blue-100 text-blue-600" },
    { label: "Off Hire", value: 5, className: "bg-gray-200 text-zinc-500" },
  ];
  const filtered = SKY_VEHICLES.filter((v) => (!regSel.length || regSel.includes(v.registration)) && (!statusSel.length || statusSel.includes(v.statusKey)));
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
                <div key={item.label} className={`rounded p-3 text-sm font-weight-400 font-normal leading-4 ${item.className}`}>{item.label} {item.value}</div>
              ))}
            </div>
          </div>
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-sm text-neutral-400">No fleet vehicles match.</div>
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
              {filtered.map((v, i) => <SkyVehicleCard key={`${v.registration}-${i}`} v={v} />)}
            </div>
          )}
          <div className="flex justify-center pt-4">
            <button type="button" className="inline-flex h-8 items-center justify-center rounded bg-blue-100 px-3 py-2 text-sm font-weight-400 font-normal leading-4 text-blue-600 transition hover:bg-blue-200">View All Vehicles</button>
          </div>
        </div>
      </div>
    </section>
  );
};

// ── Expiry cards + Compliance Summary ─────────────────────────────────────────
const complianceIcon = <img src={ComplianceIcon} alt="" className="size-4" />;
const plate = <img src={PlateIcon} alt="" className="size-4" />;
const motIcon = <img src={MOTIcon} alt="" className="size-4" />;
const roadIcon = <img src={RoadTaxIcon} alt="" className="size-4" />;
const serviceIcon = <img src={ServiceIcon} alt="" className="size-4" />;

type Expiry = { span: string; icon: React.ReactNode; title: string; tabs: [string, string, string][]; head: string[]; rows: (string | [string, string])[][] };
const EXPIRY: Expiry[] = [
  { span: "col-span-12 lg:col-span-6", icon: serviceIcon, title: "Servicing Due", tabs: [["red", "Overdue", "3"], ["orange", "Weekly", "7"], ["gray", "Monthly", "14"]], head: ["Vehicle", "Current Mileage", "Overdue"], rows: [
    ["DX20 UHG", "124,560 mi", ["1,250 mi", "red"]], ["NL69 FZY", "98,765 mi", ["320 mi", "red"]],
    ["PF22 RVB", "76,450 mi", "—"], ["KM72 LZP", "54,210 mi", "—"], ["GU23 YWR", "33,890 mi", "—"]] },
  { span: "col-span-12 md:col-span-6 xl:col-span-4", icon: motIcon, title: "MOT Expiry", tabs: [["red", "Expired", "2"], ["blue", "Today", "1"], ["orange", "7 Days", "5"], ["gray", "30 Days", "13"]], head: ["Vehicle", "Expiry Date", "Remaining Days"], rows: [
    ["BX68 YZO", "12 May 2025", ["Expired", "red"]], ["VU18 KXL", "10 May 2025", ["Expired", "red"]], ["YL24 HBG", "13 May 2025", ["Today", "orange"]], ["FP21 KJU", "17 May 2025", ["4 days", "orange"]], ["MJ23 XTD", "18 May 2025", ["5 days", "orange"]]] },
  { span: "col-span-12 md:col-span-6 xl:col-span-4", icon: plate, title: "Plate Expiry", tabs: [["red", "Expired", "1"], ["orange", "7 Days", "3"], ["gray", "30 Days", "9"]], head: ["Vehicle", "Expiry Date", "Remaining Days"], rows: [
    ["HN19 KTP", "9 May 2025", ["Expired", "red"]], ["BC21 LMW", "14 May 2025", ["2 days", "orange"]], ["TF70 XRD", "16 May 2025", ["3 days", "orange"]], ["MK22 VBS", "19 May 2025", ["6 days", "orange"]], ["GL68 PNC", "27 May 2025", ["14 days", "green"]]] },
  { span: "col-span-12 md:col-span-6 xl:col-span-4", icon: roadIcon, title: "Road Fund Licence", tabs: [["red", "Expired", "1"], ["orange", "7 Days", "4"], ["gray", "30 Days", "10"]], head: ["Vehicle", "Expiry Date", "Remaining Days"], rows: [
    ["YC67 BMO", "11 May 2025", ["Expired", "red"]], ["GU24 VPL", "16 May 2025", ["3 days", "orange"]], ["FN22 TYG", "17 May 2025", ["4 days", "orange"]], ["PL73 HNZ", "19 May 2025", ["6 days", "orange"]], ["WA72 FFE", "25 May 2025", ["12 days", "green"]]] },
];
// Expiries carousel — always flows one direction. The cards are duplicated so
// when it passes the first set it wraps back by exactly one set-width (invisible,
// since the content is identical there), so the motion never reverses.
const CAROUSEL = [EXPIRY[0], EXPIRY[1], EXPIRY[2], EXPIRY[3]];
const ExpiryCarousel: React.FC = () => {
  const ref = useRef<HTMLDivElement>(null);
  const advance = useCallback((delta: number) => {
    const el = ref.current;
    if (!el) return;
    const first = el.firstElementChild as HTMLElement | null;
    const stepW = first ? first.offsetWidth + 16 : el.clientWidth;
    const wrapDist = CAROUSEL.length * stepW;
    if (delta > 0 && el.scrollLeft >= wrapDist - 1) el.scrollLeft -= wrapDist;
    if (delta < 0 && el.scrollLeft <= 1) el.scrollLeft += wrapDist;
    el.scrollBy({ left: delta * stepW, behavior: "smooth" });
  }, []);
  useEffect(() => {
    const id = setInterval(() => advance(1), 7000);
    return () => clearInterval(id);
  }, [advance]);
  const arrow = (dir: "l" | "r") => (
    <button type="button" aria-label={dir === "l" ? "Previous" : "Next"} onClick={() => advance(dir === "l" ? -1 : 1)}
      className={`absolute top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white border border-neutral-100 shadow-md grid place-items-center text-[#9A9EB2] hover:text-neutral-600 transition-colors ${dir === "l" ? "left-0 -translate-x-full" : "right-0 translate-x-full"}`}>
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
        <div ref={ref} className="flex items-stretch gap-4 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {[...CAROUSEL, ...CAROUSEL].map((e, i) => (
            <div key={i} className="shrink-0 min-w-0 basis-full sm:basis-[calc((100%_-_1rem)/2)] lg:basis-[calc((100%_-_2rem)/3)]">
              <div className="rounded-xl border border-neutral-200 p-5 flex flex-col min-w-0 h-full">
                <CardHead icon={<SkyIconBox>{e.icon}</SkyIconBox>} title={e.title} right={<ViewAll />} />
                <TabPills tabs={e.tabs} />
                <div className="overflow-x-auto"><DataTable head={e.head} rows={e.rows} /></div>
              </div>
            </div>
          ))}
        </div>
        {arrow("r")}
      </div>
    </div>
  );
};

type Comp = { title: string; icon: React.ReactNode; overdue: number; bar: number; d7: number; d30: number };
const COMPLIANCE: Comp[] = [
  { title: "MOT", icon: motIcon, overdue: 2, bar: 10, d7: 1, d30: 13 },
  { title: "Plate", icon: plate, overdue: 9, bar: 26, d7: 5, d30: 18 },
  { title: "Road Fund Licence", icon: roadIcon, overdue: 1, bar: 8, d7: 4, d30: 10 },
  { title: "Service", icon: serviceIcon, overdue: 3, bar: 16, d7: 7, d30: 14 },
];
const ComplianceSummary: React.FC = () => (
  <Card span="col-span-12">
    <CardHead
      icon={<SkyIconBox>{complianceIcon}</SkyIconBox>} title="Compliance Summary"
    />
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {COMPLIANCE.map((c) => (
        <div key={c.title} className="border border-neutral-200 rounded-xl p-[18px] flex flex-col gap-4">
          <div className="flex items-start justify-between gap-2">
            <h4 className="text-[15px] font-weight-600 text-neutral-900">{c.title}</h4>
            <SkyIconBox>{c.icon}</SkyIconBox>
          </div>
          <div className="flex items-baseline gap-2"><span className="text-3xl font-weight-700 text-[#f26d6d] leading-none">{c.overdue}</span><span className="text-[13px] text-neutral-400">Overdue</span></div>
          <div className="h-2 rounded-md bg-green-300 overflow-hidden flex"><span className="h-full bg-[#e97070]" style={{ width: `${c.bar}%` }} /></div>
          <div className="flex gap-7">
            <div><div className="text-xl font-weight-700 leading-none text-orange-600">{c.d7}</div><div className="text-xs text-neutral-400 mt-1">Due in 7 days</div></div>
            <div><div className="text-xl font-weight-700 leading-none text-neutral-700">{c.d30}</div><div className="text-xs text-neutral-400 mt-1">Due in 30 days</div></div>
          </div>
        </div>
      ))}
    </div>
  </Card>
);

// ── Weekly Payment Schedule ───────────────────────────────────────────────────
const WeeklyPayment: React.FC = () => (
  <Card span="col-span-12 lg:col-span-7">
    <CardHead
      icon={<SkyIconBox><img src={PaymentsIcon} alt="" className="size-4" /></SkyIconBox>}
      title="Weekly Payment Schedule" right={<ViewAll />}
    />
    <TabPills tabs={[["blue", "Due Today", "6"], ["gray", "Due This Week", "18"], ["red", "Overdue", "4"], ["green", "Received Today", "11"]]} />
    <div className="overflow-x-auto">
      <DataTable
        head={["Vehicle", "Customer", "Weekly Payment", "Outstanding", "Due Date", "Status"]}
        rows={[
          ["GU72 OPN", "Alpha Haulage Ltd", "£525.00", "£525.00", "13 May 2025", ["Due Today", "blue"]],
          ["FL21 XZM", "Northline Logistics", "£650.00", "£650.00", "13 May 2025", ["Due Today", "blue"]],
          ["WA22 KHG", "Swift Couriers", "£475.00", "£475.00", "13 May 2025", ["Due Today", "blue"]],
          ["BV71 YXT", "Pinnacle Transport", "£575.00", "£575.00", "14 May 2025", ["This Week", "orange"]],
          ["NJ23 LFP", "Urban Freight Co", "£525.00", "£525.00", "15 May 2025", ["This Week", "orange"]],
        ]}
      />
    </div>
  </Card>
);

// ── page ──────────────────────────────────────────────────────────────────────
const FleetDashboard: React.FC = () => (
  <div className="min-h-screen bg-white text-neutral-900 font-['Stack_Sans_Headline']">
    <div className="sticky top-0 z-20 h-20 px-10 py-4 border-b border-neutral-100 bg-white flex items-center justify-between">
      <h1 className="text-neutral-900 text-2xl font-weight-600">Fleet Dashboard</h1>
      <button type="button" aria-label="Notifications" className="relative text-neutral-500 hover:text-neutral-700">
        <Bell size={20} />
        <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-red-500 border-2 border-white" />
      </button>
    </div>

    <div className="px-10 py-6">
      <div className="grid grid-cols-12 gap-x-4 gap-y-12">
        <StatCards />
        <AttentionRequired />
        <HireTrend />
        <WeeklyPayment />
        <VehicleDonut />
        <TaskManagement />
        <ExpiryCarousel />
        <SkylineOperations />
        <ComplianceSummary />
      </div>
    </div>
  </div>
);

export default FleetDashboard;
