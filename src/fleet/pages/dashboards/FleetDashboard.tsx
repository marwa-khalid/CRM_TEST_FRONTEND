import React, { useState } from "react";
import { DashboardShell, SkylineFleetStats, AttentionRequired, HireTrend, WeeklyPayment, TaskManagement } from "./common";

// ── Skyline (fleet hire) dashboard ────────────────────────────────────────────
// Composes the shared dashboard widgets into the Skyline layout. All the building
// blocks live in ./common (shared with the Vehicle-Management dashboards).
const FleetDashboard: React.FC = () => {
  const [period, setPeriod] = useState("MTD"); // drives Fleet Performance
  return (
    <DashboardShell side="skyline">
      <div className="flex flex-col gap-10">
        <div className="flex justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="rounded outline outline-1 -outline-offset-1 outline-neutral-900 inline-flex items-center gap-1">
              {[{ v: "TDY", l: "Today" }, { v: "WTD", l: "WTD" }, { v: "MTD", l: "MTD" }, { v: "YTD", l: "YTD" }].map(({ v, l }) => (
                <button key={v} type="button" onClick={() => setPeriod(v)} className={`px-4 py-2 rounded text-sm leading-4 transition ${period === v ? "bg-neutral-900 text-white" : "text-neutral-700 hover:text-neutral-900"}`}>{l}</button>
              ))}
            </div>
          </div>
          <button type="button" className="px-10 py-4 bg-neutral-900 rounded text-white text-base font-weight-500 leading-4 hover:bg-black">Add Hire</button>
        </div>
        <SkylineFleetStats period={period} />
        <AttentionRequired side="skyline" />
        <HireTrend />
        <WeeklyPayment />
        <TaskManagement module="skyline" />
      </div>
    </DashboardShell>
  );
};

export default FleetDashboard;
