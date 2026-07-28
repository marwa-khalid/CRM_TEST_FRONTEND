import React, { useEffect, useMemo, useState } from "react";
// Temporary cross-module use — these expiry blocks live on the Claims dashboard
// for now and read real Fleet data. To be moved to the Fleet-side dashboard later.
import { listAllExpiries, type FleetDueReminder } from "../../fleet/services/hireService";
import FleetMultiSelectFilter from "../../fleet/components/FleetMultiSelectFilter";

type PlateStatus = "expired" | "upcoming" | "urgent";

type ExpiryVehicle = {
  registration: string;
  model: string;
  status: PlateStatus;
  authority: string;
  expiryDate: string;
};

const STATUS_STYLE: Record<PlateStatus, { label: string; className: string; expiryClassName: string }> = {
  expired: { label: "Expired", className: "bg-red-100 text-red-400", expiryClassName: "text-red-500" },
  upcoming: { label: "Upcoming", className: "bg-blue-100 text-blue-500", expiryClassName: "text-neutral-500" },
  urgent: { label: "Urgent", className: "bg-orange-100 text-orange-500", expiryClassName: "text-red-500" },
};

const daysUntil = (iso: string): number => {
  const d = new Date(`${iso.slice(0, 10)}T00:00:00`).getTime();
  const today = new Date(); today.setHours(0, 0, 0, 0);
  return Math.round((d - today.getTime()) / 86400000);
};
const statusFor = (iso: string): PlateStatus => {
  const n = daysUntil(iso);
  if (n < 0) return "expired";
  if (n <= 14) return "urgent";
  return "upcoming";
};
const fmtDate = (iso: string): string => {
  const d = new Date(`${iso.slice(0, 10)}T00:00:00`);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString("en-GB");
};

function StatusBadge({ status }: { status: PlateStatus }) {
  const s = STATUS_STYLE[status];
  return (
    <span className={`inline-flex items-center justify-center rounded px-2 py-1 text-[14px] font-weight-400 font-normal ${s.className}`}>
      {s.label}
    </span>
  );
}

function VehicleCard({ vehicle }: { vehicle: ExpiryVehicle }) {
  const s = STATUS_STYLE[vehicle.status];
  return (
    <div className="flex min-h-32 flex-col gap-5 rounded-lg border border-neutral-200 p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h3 className="text-sm font-weight-500 text-black">{vehicle.registration}</h3>
          <p className="text-[14px] font-weight-400 font-normal text-neutral-700">{vehicle.model}</p>
        </div>
        <StatusBadge status={vehicle.status} />
      </div>
      <div className="flex flex-col gap-2">
        <p className="text-[14px] font-weight-400 font-normal text-neutral-500">
          Authority: <span className="font-weight-600">{vehicle.authority}</span>
        </p>
        <p className={`text-[14px] font-weight-400 font-normal ${s.expiryClassName}`}>
          Expiry Date: {vehicle.expiryDate}
        </p>
      </div>
    </div>
  );
}

// Shared, operational expiry section (Plate / MOT) — reads real fleet expiries.
export default function FleetExpirySection({
  kind, title, authorityLabel = "Authority",
}: { kind: "plating" | "mot"; title: string; authorityLabel?: string }) {
  const [rows, setRows] = useState<FleetDueReminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [regSel, setRegSel] = useState<string[]>([]);
  const [authSel, setAuthSel] = useState<string[]>([]);
  const toggle = (setter: React.Dispatch<React.SetStateAction<string[]>>, v: string) =>
    setter((s) => (s.includes(v) ? s.filter((x) => x !== v) : [...s, v]));

  useEffect(() => {
    let cancelled = false;
    listAllExpiries()
      .then((all) => { if (!cancelled) setRows(all.filter((r) => r.kind === kind)); })
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [kind]);

  const vehicles: ExpiryVehicle[] = useMemo(
    () =>
      rows
        .slice()
        .sort((a, b) => a.expiry_date.localeCompare(b.expiry_date))
        .map((r) => ({
          registration: r.vehicle || "—",
          model: r.make_model || "—",
          status: statusFor(r.expiry_date),
          authority: r.authority || "—",
          expiryDate: fmtDate(r.expiry_date),
        })),
    [rows],
  );

  const regOptions = useMemo(
    () => Array.from(new Set(vehicles.map((v) => v.registration).filter((r) => r && r !== "—"))).sort().map((r) => ({ label: r, value: r })),
    [vehicles],
  );
  const authOptions = useMemo(
    () => Array.from(new Set(vehicles.map((v) => v.authority).filter((a) => a && a !== "—"))).sort().map((a) => ({ label: a, value: a })),
    [vehicles],
  );
  const shown = vehicles.filter(
    (v) => (!regSel.length || regSel.includes(v.registration)) && (!authSel.length || authSel.includes(v.authority)),
  );

  const summaryItems = [
    { label: "Expired", value: vehicles.filter((v) => v.status === "expired").length, className: "bg-red-100 text-red-500" },
    { label: "Upcoming", value: vehicles.filter((v) => v.status === "upcoming").length, className: "bg-blue-100 text-blue-600" },
    { label: "Urgent", value: vehicles.filter((v) => v.status === "urgent").length, className: "bg-orange-100 text-orange-500" },
  ];

  return (
    <section className="w-full rounded-lg border border-neutral-200 px-4 py-6 font-['Stack_Sans_Headline']">
      <div className="flex flex-col gap-10">
        <h2 className="text-xl font-weight-600 leading-5 text-black">{title}</h2>

        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-8">
              <p className="text-2xl font-weight-600 leading-6 text-black">{vehicles.length} Vehicles</p>
              <div className="flex items-center gap-5">
                <FleetMultiSelectFilter label="Registration" options={regOptions} selected={regSel} onToggle={(v) => toggle(setRegSel, v)} onClear={() => setRegSel([])} />
                <FleetMultiSelectFilter label={authorityLabel} options={authOptions} selected={authSel} onToggle={(v) => toggle(setAuthSel, v)} onClear={() => setAuthSel([])} />
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

          {loading ? (
            <div className="py-12 text-center text-sm text-neutral-400">Loading expiries…</div>
          ) : shown.length === 0 ? (
            <div className="py-12 text-center text-sm text-neutral-400">No {kind === "mot" ? "MOT" : "plate"} expiries.</div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {shown.slice(0, 8).map((vehicle, index) => (
                <VehicleCard key={`${vehicle.registration}-${index}`} vehicle={vehicle} />
              ))}
            </div>
          )}

          <div className="flex justify-center pt-4">
            <button
              type="button"
              onClick={() => window.location.assign("/fleet")}
              className="inline-flex h-8 items-center justify-center rounded bg-blue-100 px-3 py-2 text-sm font-weight-400 font-normal leading-4 text-blue-600 transition hover:bg-blue-200"
            >
              View All Vehicles
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
