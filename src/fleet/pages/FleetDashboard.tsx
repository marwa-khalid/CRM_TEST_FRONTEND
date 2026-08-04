import React, { useState } from "react";
import { Bell } from "lucide-react";
import TrendingUp from "../../assets/Dashboard/TrendingUp.svg";
import TrendingDown from "../../assets/Dashboard/TrendingDown.svg";
import Cars from "../../assets/Dashboard/Cars.svg";
import Pound from "../../assets/Dashboard/Pound.svg";
import Urgent from "../../assets/Dashboard/Urgent.svg";
import FleetMultiSelectFilter from "../components/FleetMultiSelectFilter";
import "./FleetDashboard.css";

// Fleet Dashboard — ported from the approved design mockup to a real React
// component. Layout/visuals live in FleetDashboard.css (scoped under .fleet-dash).
// Sample data is hard-coded for now; wire to fleet services when the APIs land.

// ----- Hire Trend (interactive: WTD/MTD/YTD periods + YoY/MoM comparison) -----
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

  return (
    <div className="card s12 font-['Stack_Sans_Headline']">
      <div className="card-h" style={{ marginBottom: "14px" }}>
        <div className="ttl"><h3>Hire Trend</h3></div>
      </div>
      <div className="trend-filters">
        <div className="seg">
          {["WTD", "MTD", "YTD"].map((p) => (
            <button key={p} className={!mode && period === p ? "on" : undefined}
              onClick={() => { setPeriod(p); setMode(""); }}>{p}</button>
          ))}
        </div>
        <button className={"pillbtn" + (!mode && period === "Custom" ? " on" : "")}
          onClick={() => { setPeriod("Custom"); setMode(""); }}>
          <svg viewBox="0 0 24 24" fill="none"><rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.7" /><path d="M3 9h18M8 3v4M16 3v4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" /></svg>
          Custom
        </button>
        <div className="seg ghost">
          {["YoY", "MoM"].map((m) => (
            <button key={m} className={mode === m ? "on" : undefined}
              onClick={() => setMode(mode === m ? "" : m)}>{m}</button>
          ))}
        </div>
        <button className="drop">Referrer <svg viewBox="0 0 24 24" fill="none"><path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg></button>
        <button className="drop">Status <svg viewBox="0 0 24 24" fill="none"><path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg></button>
        <div className="ht-right">
          <span className="hires-pill">
            {mode
              ? (<><span className={"chg " + (up ? "up" : "down")}>{(up ? "▲ " : "▼ ") + Math.abs(pct).toFixed(1) + "%"}</span>{" " + v.cmp}</>)
              : (<><b>{total}</b> Hires</>)}
          </span>
        </div>
      </div>
      <div className="bar">
        <div className="bar-y">
          {ax.ticks.map((t, i) => (<span key={i} style={{ top: Y(t).toFixed(1) + "%" }}>{t}</span>))}
        </div>
        <div className="bar-plot">
          {ax.ticks.map((t, i) => (<div key={i} className="gl" style={{ top: Y(t).toFixed(1) + "%" }} />))}
          <div className={"bar-cols" + (two ? " two" : "")}>
            {v.vals.map((val, i) => {
              const h = Math.max(1, (val / ax.max) * 100);
              const cls = two && i === 0 ? "bar-cmp" : "bar-cur";
              return (
                <div className="bar-col" key={i}>
                  <div className="btip">{v.labels[i] + " · " + val + " hires"}</div>
                  <div className={cls} style={{ height: h.toFixed(1) + "%" }} />
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <div className={"bar-x" + (two ? " two" : "")}>
        {v.labels.map((l, i) => (<span key={i}>{l}</span>))}
      </div>
      <div className="trend-cap">{v.cap}</div>
    </div>
  );
};

// ----- Vehicle Status Distribution (128 Total donut + legend) -----
// Background colors from the Fleet Operations badges (green/blue/orange/grey) + two shade tints.
const VEH_SEG = [
  { l: "Available", v: 38, c: "#dcfce7" },       // fleet-ops green bg
  { l: "On Hire", v: 54, c: "#d9ebff" },         // fleet-ops blue bg
  { l: "In Repair", v: 12, c: "#ffedd5" },       // fleet-ops orange bg
  { l: "Off Fleet", v: 8, c: "#fee2e2" },        // light red bg
  { l: "Awaiting Plating", v: 9, c: "#bfe0ff" }, // deeper blue tint
  { l: "Awaiting De-fleet", v: 7, c: "#d4d4d8" },// deeper grey tint
];

const VehicleDonut: React.FC = () => {
  const total = VEH_SEG.reduce((s, x) => s + x.v, 0);
  const r = 56, C = 2 * Math.PI * r;
  let off = 0;
  const arcs = VEH_SEG.map((x, i) => {
    const len = (x.v / total) * C;
    const el = (
      <circle key={i} cx="80" cy="80" r={r} fill="none" stroke={x.c} strokeWidth="22"
        strokeDasharray={len.toFixed(2) + " " + (C - len).toFixed(2)}
        strokeDashoffset={(-off).toFixed(2)} transform="rotate(-90 80 80)" />
    );
    off += len;
    return el;
  });
  return (
    <div className="card s5 font-['Stack_Sans_Headline']">
      <div className="card-h"><div className="ttl">
        <span className="wi" style={{ background: "#e8f0fe", color: "#2563eb" }}>
          <svg viewBox="0 0 24 24" fill="none"><path d="M12 3a9 9 0 1 0 9 9h-9V3Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" /><path d="M14 3.2A9 9 0 0 1 20.8 10H14V3.2Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" /></svg>
        </span>
        <h3>Vehicle Status Distribution</h3>
      </div></div>
      <div className="vsd">
        <svg className="donut2" viewBox="0 0 160 160">
          {arcs}
          <text x="80" y="80" textAnchor="middle" className="big">{total}</text>
          <text x="80" y="100" textAnchor="middle" className="sm">Total</text>
        </svg>
        <div className="vsleg">
          {VEH_SEG.map((x, i) => (
            <div className="li" key={i}><span className="dot" style={{ background: x.c }} />{x.l}<span className="v">{x.v}</span></div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ----- Attention Required (hover a row to reveal the vehicle detail popover) -----
type Alert = {
  reg: string; title: string; sub: string; end: string;
  tone: "red" | "amber"; icon: "alert" | "doc";
  cust: string; issue: string; status: string; hire: string;
};
const ALERTS: Alert[] = [
  { reg: "HK18 ZDC", title: "Overdue return — HK18 ZDC", sub: "Priya Nair · due 6 days ago", end: "6d", tone: "red", icon: "alert", cust: "Priya Nair", issue: "Overdue return · 6 days", status: "Overdue Return", hire: "On Hire" },
  { reg: "WV23 MLK", title: "Overdue return — WV23 MLK", sub: "Tomas Bauer · due 4 days ago", end: "4d", tone: "red", icon: "alert", cust: "Tomas Bauer", issue: "Overdue return · 4 days", status: "Overdue Return", hire: "On Hire" },
  { reg: "MA19 KLP", title: "Missing document — MA19 KLP", sub: "Insurance certificate not uploaded", end: "Docs", tone: "amber", icon: "doc", cust: "Aisha Khan", issue: "Insurance certificate missing", status: "Missing Document", hire: "On Hire" },
  { reg: "GF20 TRN", title: "Missing document — GF20 TRN", sub: "V5C logbook not uploaded", end: "Docs", tone: "amber", icon: "doc", cust: "Daniel Whitehouse", issue: "V5C logbook missing", status: "Missing Document", hire: "On Hire" },
];

const AlertIcon: React.FC<{ kind: string }> = ({ kind }) =>
  kind === "doc" ? (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M7 3h7l4 4v14H7z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" /><path d="M13 3v5h5" stroke="currentColor" strokeWidth="1.6" /></svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" /><path d="M12 8v5M12 16v.2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
  );

const AttentionRequired: React.FC = () => (
  <div className="card s6 font-['Stack_Sans_Headline']">
    <div className="card-h">
      <div className="ttl">
        <span
          className="wi"
          style={{ background: "var(--red-s)", color: "var(--red)" }}
        >
          <svg viewBox="0 0 24 24" fill="none">
            <path
              d="M6 16V10a6 6 0 1 1 12 0v6l1.5 2h-15L6 16Z"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
            <path
              d="M10 20a2 2 0 0 0 4 0"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </svg>
        </span>
        <h3>Attention Required</h3>
      </div>
      <span className="chip red">5</span>
    </div>
    <div className="rows">
      {ALERTS.map((a) => {
        const tone =
          a.tone === "red"
            ? { background: "var(--red-s)", color: "var(--red)" }
            : { background: "var(--amber-s)", color: "var(--amber)" };
        return (
          <div className="row" key={a.reg}>
            <div className="lead" style={tone}>
              <AlertIcon kind={a.icon} />
            </div>
            <div className="body">
              <div className="t">{a.title}</div>
              <div className="m">{a.sub}</div>
            </div>
            <div className="end">
              <span className={"chip " + a.tone}>{a.end}</span>
            </div>
            <div className="rowpop" role="tooltip">
              <div className="rp-h">{a.reg}</div>
              <div className="kv">
                <span className="k">Customer</span>
                <span className="v">{a.cust}</span>
              </div>
              <div className="kv">
                <span className="k">Issue</span>
                <span className="v">{a.issue}</span>
              </div>
              <div className="kv">
                <span className="k">Status</span>
                <span className="v">
                  <span className={"chip " + a.tone}>{a.status}</span>
                </span>
              </div>
              <div className="kv">
                <span className="k">Hire</span>
                <span className="v">
                  <span className="chip blue">{a.hire}</span>
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  </div>
);

// ----- Top stat cards (WTD/MTD/YTD tabs + cards — identical to the Claims dashboard) -----
type Kpi = { value: React.ReactNode; label: string; pct: string; up: boolean; iconBg: string; icon: React.ReactNode };
// Icons + backgrounds taken straight from the Claims dashboard stat cards.
const KPI_DATA: Kpi[] = [
  { value: (<>30</>), label: "Vehicles on Hire", pct: "6.4", up: true, iconBg: "bg-blue-100", icon: <img src={Cars} alt="" /> },
  { value: "£38,420", label: "Net Income (MTD)", pct: "11.2", up: true, iconBg: "bg-neutral-100", icon: <img src={Pound} alt="" /> },
  { value: (<>71<span className="text-base text-neutral-400">%</span></>), label: "Fleet Availability", pct: "1.4", up: true, iconBg: "bg-blue-100", icon: <img src={Cars} alt="" /> },
  { value: "7", label: "Urgent Alerts", pct: "2.0", up: false, iconBg: "bg-red-100", icon: <img src={Urgent} alt="" /> },
];

const StatCards: React.FC = () => {
  const [period, setPeriod] = useState("WTD");
  return (
    <div className="s12 font-['Stack_Sans_Headline']">
      <div className="flex flex-col gap-6">
        <div className="rounded outline outline-1 outline-offset-[-1px] outline-blue-200 inline-flex items-center gap-1 w-fit">
          {["WTD", "MTD", "YTD"].map((p) => (
            <button key={p} type="button" onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded text-sm leading-4 ${period === p ? "bg-blue-300 text-white" : "text-blue-500"}`}>{p}</button>
          ))}
        </div>
        <div className="kpi-grid">
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
                  <img src={c.up ? TrendingUp : TrendingDown} alt="" className="w-3.5 h-3.5 shrink-0" />
                  {c.pct}%
                </span>
                <span className="text-xs font-weight-500 text-neutral-500 leading-tight">vs last month</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ----- Skyline Operations (matches the Claims dashboard's Skyline Operations / FleetDummy) -----
type SkyKey = "available" | "hire" | "off" | "repair";
type SkyVehicle = { registration: string; model: string; statusKey: SkyKey; statusLabel: string; hireInfo?: string; customer?: string };
const SKY_STATUS_STYLE: Record<SkyKey, string> = {
  available: "bg-green-100 text-green-700",
  hire: "bg-slate-200 text-blue-600",
  off: "bg-neutral-200 text-neutral-600",
  repair: "bg-orange-100 text-orange-500",
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

const SkyStatusBadge: React.FC<{ v: SkyVehicle }> = ({ v }) => (
  <span className={`inline-flex h-fit w-fit shrink-0 items-center justify-center rounded px-2 py-1 text-xs font-weight-400 font-normal leading-4 ${SKY_STATUS_STYLE[v.statusKey]}`}>
    {v.statusLabel}
  </span>
);

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
    <SkyStatusBadge v={v} />
  </div>
);

const SkylineOperations: React.FC = () => {
  const [regSel, setRegSel] = useState<string[]>([]);
  const [statusSel, setStatusSel] = useState<string[]>([]);
  const toggle = (setter: React.Dispatch<React.SetStateAction<string[]>>, val: string) =>
    setter((s) => (s.includes(val) ? s.filter((x) => x !== val) : [...s, val]));
  const regOptions = SKY_VEHICLES.map((v) => ({ label: v.registration, value: v.registration }));
  const statusOptions = [
    { label: "Available", value: "available" },
    { label: "On Hire", value: "hire" },
    { label: "Off Hire", value: "off" },
  ];
  // Fleet-wide summary (matches the design's totals); the cards below are a sample.
  const summaryItems = [
    { label: "Available", value: 12, className: "bg-green-100 text-green-700" },
    { label: "On Hire", value: 25, className: "bg-blue-100 text-blue-600" },
    { label: "Off Hire", value: 5, className: "bg-gray-200 text-zinc-500" },
  ];
  const filtered = SKY_VEHICLES.filter(
    (v) => (!regSel.length || regSel.includes(v.registration)) && (!statusSel.length || statusSel.includes(v.statusKey)),
  );
  return (
    <section className="s12 w-full rounded-lg border border-neutral-200 px-4 py-6 min-w-0 font-['Stack_Sans_Headline']">
      <div className="flex flex-col gap-10">
        <h2 className="text-xl font-weight-600 leading-5 text-black">Skyline Operations</h2>
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
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {summaryItems.map((item) => (
                <div key={item.label} className={`rounded p-3 text-sm font-weight-400 font-normal leading-4 ${item.className}`}>
                  {item.label} {item.value}
                </div>
              ))}
            </div>
          </div>
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-sm text-neutral-400">No fleet vehicles match.</div>
          ) : (
            <div className="veh-grid">
              {filtered.map((v, i) => (<SkyVehicleCard key={`${v.registration}-${i}`} v={v} />))}
            </div>
          )}
          <div className="flex justify-center pt-4">
            <button type="button" className="inline-flex h-8 items-center justify-center rounded bg-blue-100 px-3 py-2 text-sm font-weight-400 font-normal leading-4 text-blue-600 transition hover:bg-blue-200">
              View All Vehicles
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

const FleetDashboard: React.FC = () => {
  return (
    <div className="fleet-dash font-['Stack_Sans_Headline']">
      <div className="topbar">
        <div className="brand">
          <h1>Fleet Dashboard</h1>
        </div>
        <div className="tb-right">
          <button className="bell" aria-label="Notifications">
            <Bell size={20} />
            <span className="bell-dot"></span>
          </button>
        </div>
      </div>

      <div className="page">
        <div className="grid">
          <StatCards />

          <HireTrend />

          <div className="card s7 font-['Stack_Sans_Headline']">
            <div className="card-h">
              <div className="ttl">
                <span
                  className="wi"
                  style={{ background: "#e8f0fe", color: "#2563eb" }}
                >
                  <svg viewBox="0 0 24 24" fill="none">
                    <rect
                      x="3"
                      y="6"
                      width="18"
                      height="12"
                      rx="2"
                      stroke="currentColor"
                      strokeWidth="1.7"
                    />
                    <path
                      d="M3 10h18M7 15h5"
                      stroke="currentColor"
                      strokeWidth="1.7"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
                <h3>Weekly Payment Schedule</h3>
              </div>
              <span className="valink">View all ›</span>
            </div>
            <div className="tp-row">
              <span className="tp blue">
                Due Today <span className="c">6</span>
              </span>
              <span className="tp gray">
                Due This Week <span className="c">18</span>
              </span>
              <span className="tp red">
                Overdue <span className="c">4</span>
              </span>
              <span className="tp green">
                Received Today <span className="c">11</span>
              </span>
            </div>
            <table className="dtable">
              <thead>
                <tr>
                  <th>Vehicle</th>
                  <th>Customer</th>
                  <th>Weekly Payment</th>
                  <th>Outstanding</th>
                  <th>Due Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <span className="reg">GU72 OPN</span>
                  </td>
                  <td>Alpha Haulage Ltd</td>
                  <td>£525.00</td>
                  <td>£525.00</td>
                  <td>13 May 2025</td>
                  <td className="st-blue">Due Today</td>
                </tr>
                <tr>
                  <td>
                    <span className="reg">FL21 XZM</span>
                  </td>
                  <td>Northline Logistics</td>
                  <td>£650.00</td>
                  <td>£650.00</td>
                  <td>13 May 2025</td>
                  <td className="st-blue">Due Today</td>
                </tr>
                <tr>
                  <td>
                    <span className="reg">WA22 KHG</span>
                  </td>
                  <td>Swift Couriers</td>
                  <td>£475.00</td>
                  <td>£475.00</td>
                  <td>13 May 2025</td>
                  <td className="st-blue">Due Today</td>
                </tr>
                <tr>
                  <td>
                    <span className="reg">BV71 YXT</span>
                  </td>
                  <td>Pinnacle Transport</td>
                  <td>£575.00</td>
                  <td>£575.00</td>
                  <td>14 May 2025</td>
                  <td className="st-orange">This Week</td>
                </tr>
                <tr>
                  <td>
                    <span className="reg">NJ23 LFP</span>
                  </td>
                  <td>Urban Freight Co</td>
                  <td>£525.00</td>
                  <td>£525.00</td>
                  <td>15 May 2025</td>
                  <td className="st-orange">This Week</td>
                </tr>
              </tbody>
            </table>
          </div>

          <VehicleDonut />

          <div className="card s12 font-['Stack_Sans_Headline']">
            <div className="card-h">
              <div className="ttl">
             
                <div>
                  <h3>Task Management</h3>
                </div>
              </div>
              <a className="link">Open board →</a>
            </div>
            <div className="tboard">
              <div>
                <div className="tcol-h">
                  <span
                    className="tcol-ic"
                    style={{ background: "#dbeafe", color: "#2563eb" }}
                  >
                    <svg viewBox="0 0 24 24" fill="none">
                      <path
                        d="M4 6h16M4 12h16M4 18h10"
                        stroke="currentColor"
                        strokeWidth="1.7"
                        strokeLinecap="round"
                      />
                    </svg>
                  </span>
                  <span className="tcol-meta">
                    <span className="c">8</span>
                    <span className="t">All Tasks</span>
                  </span>
                </div>
                <div className="tcards">
                  <div className="tcard" style={{ borderColor: "#bfdbfe" }}>
                    <span className="ti">
                      Collect vehicle from repair - LR21 XVT
                    </span>
                    <span className="due ok">Due: 05/08/2026</span>
                  </div>
                  <div className="tcard" style={{ borderColor: "#bfdbfe" }}>
                    <span className="ti">Upload insurance cert - MA19 KLP</span>
                    <span className="due ok">Due: 06/08/2026</span>
                  </div>
                  <div className="tcard" style={{ borderColor: "#bfdbfe" }}>
                    <span className="ti">
                      Arrange plate transfer - GF20 TRN
                    </span>
                    <span className="due ok">Due: 08/08/2026</span>
                  </div>
                  <div className="tcard" style={{ borderColor: "#bfdbfe" }}>
                    <span className="ti">Chase MOT booking - MA19 KLP</span>
                    <span className="due od">Due: 31/07/2026 · 3d overdue</span>
                  </div>
                  <div className="tcard" style={{ borderColor: "#bfdbfe" }}>
                    <span className="ti">
                      Confirm service booking - LR21 XVT
                    </span>
                    <span className="due ok">Due: 11/08/2026</span>
                  </div>
                </div>
              </div>
              <div>
                <div className="tcol-h">
                  <span
                    className="tcol-ic"
                    style={{ background: "#fee2e2", color: "#ef4444" }}
                  >
                    <svg viewBox="0 0 24 24" fill="none">
                      <circle
                        cx="12"
                        cy="12"
                        r="9"
                        stroke="currentColor"
                        strokeWidth="1.6"
                      />
                      <path
                        d="M12 8v5M12 16v.2"
                        stroke="currentColor"
                        strokeWidth="1.9"
                        strokeLinecap="round"
                      />
                    </svg>
                  </span>
                  <span className="tcol-meta">
                    <span className="c">2</span>
                    <span className="t">Overdue Tasks</span>
                  </span>
                </div>
                <div className="tcards">
                  <div className="tcard" style={{ borderColor: "#fecaca" }}>
                    <span className="ti">Chase MOT booking - MA19 KLP</span>
                    <span className="due od">Due: 31/07/2026 · 3d overdue</span>
                  </div>
                  <div className="tcard" style={{ borderColor: "#fecaca" }}>
                    <span className="ti">
                      Recover overdue payment - HK18 ZDC
                    </span>
                    <span className="due od">Due: 28/07/2026 · 6d overdue</span>
                  </div>
                </div>
              </div>
              <div>
                <div className="tcol-h">
                  <span
                    className="tcol-ic"
                    style={{ background: "#fef9c3", color: "#ca8a04" }}
                  >
                    <svg viewBox="0 0 24 24" fill="none">
                      <circle
                        cx="12"
                        cy="12"
                        r="9"
                        stroke="currentColor"
                        strokeWidth="1.6"
                      />
                      <path
                        d="M12 7v5l3 2"
                        stroke="currentColor"
                        strokeWidth="1.7"
                        strokeLinecap="round"
                      />
                    </svg>
                  </span>
                  <span className="tcol-meta">
                    <span className="c">3</span>
                    <span className="t">Awaiting Response</span>
                  </span>
                </div>
                <div className="tcards">
                  <div className="tcard" style={{ borderColor: "#fde68a" }}>
                    <span className="ti">Await V5C from DVLA - WV23 MLK</span>
                    <span className="due ok">Due: 09/08/2026</span>
                  </div>
                  <div className="tcard" style={{ borderColor: "#fde68a" }}>
                    <span className="ti">
                      Engineer inspection reply - BK75 OYN
                    </span>
                    <span className="due ok">Due: 07/08/2026</span>
                  </div>
                  <div className="tcard" style={{ borderColor: "#fde68a" }}>
                    <span className="ti">Insurer claim update - HK18 ZDC</span>
                    <span className="due ok">Due: 10/08/2026</span>
                  </div>
                </div>
              </div>
              <div>
                <div className="tcol-h">
                  <span
                    className="tcol-ic"
                    style={{ background: "#f5f5f5", color: "#525252" }}
                  >
                    <svg viewBox="0 0 24 24" fill="none">
                      <path
                        d="M6 4v16M6 5h11l-2 3 2 3H6"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                  <span className="tcol-meta">
                    <span className="c">4</span>
                    <span className="t">Pending Followups</span>
                  </span>
                </div>
                <div className="tcards">
                  <div className="tcard" style={{ borderColor: "#d4d4d4" }}>
                    <span className="ti">
                      Follow up deposit refund - GF20 TRN
                    </span>
                    <span className="due ok">Due: 12/08/2026</span>
                  </div>
                  <div className="tcard" style={{ borderColor: "#d4d4d4" }}>
                    <span className="ti">
                      Confirm service booking - LR21 XVT
                    </span>
                    <span className="due ok">Due: 11/08/2026</span>
                  </div>
                  <div className="tcard" style={{ borderColor: "#d4d4d4" }}>
                    <span className="ti">
                      Renew road fund licence - WV23 MLK
                    </span>
                    <span className="due ok">Due: 13/08/2026</span>
                  </div>
                  <div className="tcard" style={{ borderColor: "#d4d4d4" }}>
                    <span className="ti">Schedule vehicle swap - BK75 OYN</span>
                    <span className="due ok">Due: 14/08/2026</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <AttentionRequired />

          <div className="card s6 font-['Stack_Sans_Headline']">
            <div className="card-h">
              <div className="ttl">
                <span
                  className="wi"
                  style={{ background: "#e8f0fe", color: "#2563eb" }}
                >
                  <svg viewBox="0 0 24 24" fill="none">
                    <path
                      d="M14.5 6.5a4 4 0 0 0 4.9 5l-8.4 8.4-2.9-2.9 8.4-8.4a4 4 0 0 1-2-2.1Z"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                <h3>Servicing Due</h3>
              </div>
              <span className="valink">View all ›</span>
            </div>
            <div className="tp-row">
              <span className="tp red">
                Overdue <span className="c">3</span>
              </span>
              <span className="tp orange">
                This Week <span className="c">7</span>
              </span>
              <span className="tp gray">
                This Month <span className="c">14</span>
              </span>
            </div>
            <table className="dtable">
              <thead>
                <tr>
                  <th>Vehicle</th>
                  <th>Current Mileage</th>
                  <th>Remaining / Overdue</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <span className="reg">DX20 UHG</span>
                  </td>
                  <td>124,560 mi</td>
                  <td className="st-red">Overdue by 1,250 mi</td>
                </tr>
                <tr>
                  <td>
                    <span className="reg">NL69 FZY</span>
                  </td>
                  <td>98,765 mi</td>
                  <td className="st-red">Overdue by 320 mi</td>
                </tr>
                <tr>
                  <td>
                    <span className="reg">PF22 RVB</span>
                  </td>
                  <td>76,450 mi</td>
                  <td className="st-green">1,250 mi</td>
                </tr>
                <tr>
                  <td>
                    <span className="reg">KM72 LZP</span>
                  </td>
                  <td>54,210 mi</td>
                  <td className="st-green">2,340 mi</td>
                </tr>
                <tr>
                  <td>
                    <span className="reg">GU23 YWR</span>
                  </td>
                  <td>33,890 mi</td>
                  <td className="st-green">4,110 mi</td>
                </tr>
              </tbody>
            </table>
          </div>

          <SkylineOperations />

          <div className="card s4 font-['Stack_Sans_Headline']">
            <div className="card-h">
              <div className="ttl">
                <span
                  className="wi"
                  style={{ background: "#e8f0fe", color: "#2563eb" }}
                >
                  <svg viewBox="0 0 24 24" fill="none">
                    <path
                      d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3Z"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M9 12l2 2 4-4"
                      stroke="currentColor"
                      strokeWidth="1.7"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                <h3>MOT Expiry</h3>
              </div>
              <span className="valink">View all ›</span>
            </div>
            <div className="tp-row">
              <span className="tp red">
                Expired <span className="c">2</span>
              </span>
              <span className="tp blue">
                Today <span className="c">1</span>
              </span>
              <span className="tp orange">
                7 Days <span className="c">5</span>
              </span>
              <span className="tp gray">
                30 Days <span className="c">13</span>
              </span>
            </div>
            <table className="dtable">
              <thead>
                <tr>
                  <th>Vehicle</th>
                  <th>Expiry Date</th>
                  <th>Remaining Days</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <span className="reg">BX68 YZO</span>
                  </td>
                  <td>12 May 2025</td>
                  <td className="st-red">Expired</td>
                </tr>
                <tr>
                  <td>
                    <span className="reg">VU18 KXL</span>
                  </td>
                  <td>10 May 2025</td>
                  <td className="st-red">Expired</td>
                </tr>
                <tr>
                  <td>
                    <span className="reg">YL24 HBG</span>
                  </td>
                  <td>13 May 2025</td>
                  <td className="st-orange">Today</td>
                </tr>
                <tr>
                  <td>
                    <span className="reg">FP21 KJU</span>
                  </td>
                  <td>17 May 2025</td>
                  <td className="st-orange">4 days</td>
                </tr>
                <tr>
                  <td>
                    <span className="reg">MJ23 XTD</span>
                  </td>
                  <td>18 May 2025</td>
                  <td className="st-orange">5 days</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="card s4 font-['Stack_Sans_Headline']">
            <div className="card-h">
              <div className="ttl">
                <span
                  className="wi"
                  style={{ background: "#e8f0fe", color: "#2563eb" }}
                >
                  <svg viewBox="0 0 24 24" fill="none">
                    <rect
                      x="3"
                      y="7"
                      width="18"
                      height="10"
                      rx="2"
                      stroke="currentColor"
                      strokeWidth="1.6"
                    />
                    <path
                      d="M7 11h2M11 11h2M15 11h2M7 14h10"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
                <h3>Plate Expiry</h3>
              </div>
              <span className="valink">View all ›</span>
            </div>
            <div className="tp-row">
              <span className="tp red">
                Expired <span className="c">1</span>
              </span>
              <span className="tp orange">
                7 Days <span className="c">3</span>
              </span>
              <span className="tp gray">
                30 Days <span className="c">9</span>
              </span>
            </div>
            <table className="dtable">
              <thead>
                <tr>
                  <th>Vehicle</th>
                  <th>Expiry Date</th>
                  <th>Remaining Days</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <span className="reg">HN19 KTP</span>
                  </td>
                  <td>9 May 2025</td>
                  <td className="st-red">Expired</td>
                </tr>
                <tr>
                  <td>
                    <span className="reg">BC21 LMW</span>
                  </td>
                  <td>14 May 2025</td>
                  <td className="st-orange">2 days</td>
                </tr>
                <tr>
                  <td>
                    <span className="reg">TF70 XRD</span>
                  </td>
                  <td>16 May 2025</td>
                  <td className="st-orange">3 days</td>
                </tr>
                <tr>
                  <td>
                    <span className="reg">MK22 VBS</span>
                  </td>
                  <td>19 May 2025</td>
                  <td className="st-orange">6 days</td>
                </tr>
                <tr>
                  <td>
                    <span className="reg">GL68 PNC</span>
                  </td>
                  <td>27 May 2025</td>
                  <td className="st-green">14 days</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="card s4 font-['Stack_Sans_Headline']">
            <div className="card-h">
              <div className="ttl">
                <span
                  className="wi"
                  style={{ background: "#e8f0fe", color: "#2563eb" }}
                >
                  <svg viewBox="0 0 24 24" fill="none">
                    <path
                      d="M7 3h7l4 4v14H7z"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M13 3v5h5M9 13h6M9 16h6"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
                <h3>Road Fund Licence</h3>
              </div>
              <span className="valink">View all ›</span>
            </div>
            <div className="tp-row">
              <span className="tp red">
                Expired <span className="c">1</span>
              </span>
              <span className="tp orange">
                7 Days <span className="c">4</span>
              </span>
              <span className="tp gray">
                30 Days <span className="c">10</span>
              </span>
            </div>
            <table className="dtable">
              <thead>
                <tr>
                  <th>Vehicle</th>
                  <th>Expiry Date</th>
                  <th>Remaining Days</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <span className="reg">YC67 BMO</span>
                  </td>
                  <td>11 May 2025</td>
                  <td className="st-red">Expired</td>
                </tr>
                <tr>
                  <td>
                    <span className="reg">GU24 VPL</span>
                  </td>
                  <td>16 May 2025</td>
                  <td className="st-orange">3 days</td>
                </tr>
                <tr>
                  <td>
                    <span className="reg">FN22 TYG</span>
                  </td>
                  <td>17 May 2025</td>
                  <td className="st-orange">4 days</td>
                </tr>
                <tr>
                  <td>
                    <span className="reg">PL73 HNZ</span>
                  </td>
                  <td>19 May 2025</td>
                  <td className="st-orange">6 days</td>
                </tr>
                <tr>
                  <td>
                    <span className="reg">WA72 FFE</span>
                  </td>
                  <td>25 May 2025</td>
                  <td className="st-green">12 days</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Compliance Summary — last row */}
          <div className="card s12 font-['Stack_Sans_Headline']">
            <div className="card-h" style={{ marginBottom: "18px" }}>
              <div className="ttl">
                <span
                  className="wi"
                  style={{ background: "#e8f0fe", color: "#2563eb" }}
                >
                  <svg viewBox="0 0 24 24" fill="none">
                    <path
                      d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3Z"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M9 12l2 2 4-4"
                      stroke="currentColor"
                      strokeWidth="1.7"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                <h3>Compliance Summary</h3>
              </div>
              <span
                className="valink"
                style={{
                  border: "1px solid var(--line)",
                  borderRadius: "8px",
                  padding: "8px 14px",
                  color: "#374151",
                }}
              >
                View compliance ›
              </span>
            </div>
            <div className="cs-grid">
              <div className="cscard">
                <div className="top">
                  <h4>MOT</h4>
                  <span
                    className="cico"
                    style={{ background: "#e8f0fe", color: "#2563eb" }}
                  >
                    <svg viewBox="0 0 24 24" fill="none">
                      <path
                        d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3Z"
                        stroke="currentColor"
                        strokeWidth="1.7"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M9 12l2 2 4-4"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                </div>
                <div className="ov">
                  <span className="n">2</span>
                  <span className="l">Overdue</span>
                </div>
                <div className="csbar">
                  <span className="red" style={{ width: "10%" }}></span>
                </div>
                <div className="due">
                  <div className="d">
                    <div className="n" style={{ color: "#ea580c" }}>
                      1
                    </div>
                    <div className="l">Due in 7 days</div>
                  </div>
                  <div className="d">
                    <div className="n" style={{ color: "#374151" }}>
                      13
                    </div>
                    <div className="l">Due in 30 days</div>
                  </div>
                </div>
              </div>
              <div className="cscard">
                <div className="top">
                  <h4>Plate</h4>
                  <span
                    className="cico"
                    style={{ background: "#f3e8ff", color: "#a855f7" }}
                  >
                    <svg viewBox="0 0 24 24" fill="none">
                      <rect
                        x="3"
                        y="6"
                        width="18"
                        height="12"
                        rx="2"
                        stroke="currentColor"
                        strokeWidth="1.7"
                      />
                      <path
                        d="M7 10h4M7 14h10M15 10h2"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                      />
                    </svg>
                  </span>
                </div>
                <div className="ov">
                  <span className="n">9</span>
                  <span className="l">Overdue</span>
                </div>
                <div className="csbar">
                  <span className="red" style={{ width: "26%" }}></span>
                </div>
                <div className="due">
                  <div className="d">
                    <div className="n" style={{ color: "#ea580c" }}>
                      5
                    </div>
                    <div className="l">Due in 7 days</div>
                  </div>
                  <div className="d">
                    <div className="n" style={{ color: "#374151" }}>
                      18
                    </div>
                    <div className="l">Due in 30 days</div>
                  </div>
                </div>
              </div>
              <div className="cscard">
                <div className="top">
                  <h4>Road Fund Licence</h4>
                  <span
                    className="cico"
                    style={{ background: "#d9f5f3", color: "#14b8a6" }}
                  >
                    <svg viewBox="0 0 24 24" fill="none">
                      <path
                        d="M7 3h7l4 4v14H7z"
                        stroke="currentColor"
                        strokeWidth="1.7"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M13 3v5h5M9 13h6M9 16h6"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                      />
                    </svg>
                  </span>
                </div>
                <div className="ov">
                  <span className="n">1</span>
                  <span className="l">Overdue</span>
                </div>
                <div className="csbar">
                  <span className="red" style={{ width: "8%" }}></span>
                </div>
                <div className="due">
                  <div className="d">
                    <div className="n" style={{ color: "#ea580c" }}>
                      4
                    </div>
                    <div className="l">Due in 7 days</div>
                  </div>
                  <div className="d">
                    <div className="n" style={{ color: "#374151" }}>
                      10
                    </div>
                    <div className="l">Due in 30 days</div>
                  </div>
                </div>
              </div>
              <div className="cscard">
                <div className="top">
                  <h4>Service</h4>
                  <span
                    className="cico"
                    style={{ background: "#ffedd5", color: "#f97316" }}
                  >
                    <svg viewBox="0 0 24 24" fill="none">
                      <path
                        d="M14.5 6.5a4 4 0 0 0 4.9 5l-8.4 8.4-2.9-2.9 8.4-8.4a4 4 0 0 1-2-2.1Z"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                </div>
                <div className="ov">
                  <span className="n">3</span>
                  <span className="l">Overdue</span>
                </div>
                <div className="csbar">
                  <span className="red" style={{ width: "16%" }}></span>
                </div>
                <div className="due">
                  <div className="d">
                    <div className="n" style={{ color: "#ea580c" }}>
                      7
                    </div>
                    <div className="l">Due in 7 days</div>
                  </div>
                  <div className="d">
                    <div className="n" style={{ color: "#374151" }}>
                      14
                    </div>
                    <div className="l">Due in 30 days</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FleetDashboard;
