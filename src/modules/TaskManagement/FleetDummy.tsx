import { useEffect, useMemo, useState } from "react";
// Temporary cross-module use — this Fleet Operations block lives on the Claims
// dashboard for now and reads real Fleet data. Moves to the Fleet dashboard later.
import { listVehicleRegister, type FleetVehicleRegister } from "../../fleet/services/vehicleService";
import { listHires, type HireRecord } from "../../fleet/services/hireService";
import FleetMultiSelectFilter from "../../fleet/components/FleetMultiSelectFilter";

type StatusKey = "available" | "hire" | "off" | "repair";

type Vehicle = {
  registration: string;
  model: string;
  statusKey: StatusKey;
  statusLabel: string;
  hireInfo?: string;
  customer?: string;
};

const STATUS_STYLE: Record<StatusKey, string> = {
  available: "bg-green-100 text-green-700",
  hire: "bg-slate-200 text-blue-600",
  off: "bg-neutral-200 text-neutral-600",
  repair: "bg-orange-100 text-orange-500",
};
const STATUS_MAP: Record<string, { key: StatusKey; label: string }> = {
  on_hire: { key: "hire", label: "On Hire" },
  off_hire: { key: "off", label: "Off Hire" },
  in_repair: { key: "repair", label: "In Repair" },
  available: { key: "available", label: "Available" },
};

const normReg = (v?: string | null) => (v || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
const daysSince = (iso?: string | null): number | null => {
  if (!iso) return null;
  const d = new Date(iso.length <= 10 ? `${iso}T00:00:00` : iso).getTime();
  return Number.isNaN(d) ? null : Math.max(1, Math.round((Date.now() - d) / 86400000));
};

function StatusBadge({ vehicle }: { vehicle: Vehicle }) {
  return (
    <span className={`inline-flex h-fit w-fit shrink-0 items-center justify-center rounded px-2 py-1 text-xs font-weight-400 font-normal leading-4 ${STATUS_STYLE[vehicle.statusKey]}`}>
      {vehicle.statusLabel}
    </span>
  );
}

function VehicleCard({ vehicle }: { vehicle: Vehicle }) {
  return (
    <div className="flex min-h-32 flex-1 items-start justify-between rounded-lg border border-neutral-200 p-4">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h3 className="text-sm font-weight-500 text-black">{vehicle.registration}</h3>
          <p className="text-xs font-weight-400 font-normal text-neutral-700">{vehicle.model}</p>
        </div>
        {vehicle.hireInfo && (
          <div className="flex flex-col gap-1">
            <p className="text-xs font-weight-400 font-normal text-neutral-700">{vehicle.hireInfo}</p>
            {vehicle.customer && <p className="text-xs font-weight-400 font-normal text-neutral-500">{vehicle.customer}</p>}
          </div>
        )}
      </div>
      <StatusBadge vehicle={vehicle} />
    </div>
  );
}

export default function FleetOperations() {
  const [register, setRegister] = useState<FleetVehicleRegister[]>([]);
  const [hires, setHires] = useState<HireRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [regSel, setRegSel] = useState<string[]>([]);
  const [statusSel, setStatusSel] = useState<string[]>([]);
  const [showAll, setShowAll] = useState(false);
  const toggle = (setter: React.Dispatch<React.SetStateAction<string[]>>, v: string) =>
    setter((s) => (s.includes(v) ? s.filter((x) => x !== v) : [...s, v]));

  useEffect(() => {
    let cancelled = false;
    Promise.all([listVehicleRegister(), listHires()])
      .then(([reg, hs]) => {
        if (cancelled) return;
        setRegister(Array.isArray(reg) ? reg : []);
        setHires(Array.isArray(hs) ? hs : []);
      })
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, []);

  // Latest hire per registration — prefer an on-hire one so a returned-then-rehired
  // vehicle reads as On Hire.
  const hireByReg = useMemo(() => {
    const m = new Map<string, HireRecord>();
    hires.forEach((h) => {
      const key = normReg(h.last_vehicle_registration);
      if (!key) return;
      const existing = m.get(key);
      if (!existing || (h.last_vehicle_hire_status || "") === "on_hire") m.set(key, h);
    });
    return m;
  }, [hires]);

  const vehicles: Vehicle[] = register.map((v) => {
    const hire = hireByReg.get(normReg(v.registration_number));
    const raw = (hire?.last_vehicle_hire_status || (v.is_active ? "on_hire" : "available")).toLowerCase();
    const st = STATUS_MAP[raw] || STATUS_MAP.available;
    const days = st.key === "hire" ? daysSince(hire?.last_vehicle_hire_start) : null;
    return {
      registration: v.registration_number || "—",
      model: [v.make, v.model].filter(Boolean).join(" ") || "—",
      statusKey: st.key,
      statusLabel: st.label,
      hireInfo: days ? `On Hire for ${days} Day${days === 1 ? "" : "s"}` : undefined,
      customer: st.key === "hire" ? hire?.driver_name || undefined : undefined,
    };
  });

  const regOptions = useMemo(
    () => Array.from(new Set(register.map((v) => v.registration_number).filter(Boolean))).sort().map((r) => ({ label: r as string, value: r as string })),
    [register],
  );
  const statusOptions = [
    { label: "Available", value: "available" },
    { label: "On Hire", value: "hire" },
    { label: "Off Hire", value: "off" },
  ];
  const filteredVehicles = vehicles.filter(
    (v) => (!regSel.length || regSel.includes(v.registration)) && (!statusSel.length || statusSel.includes(v.statusKey)),
  );

  const countKey = (k: StatusKey) => vehicles.filter((v) => v.statusKey === k).length;
  const summaryItems = [
    { label: "Available", value: countKey("available"), className: "bg-green-100 text-green-700" },
    { label: "On Hire", value: countKey("hire"), className: "bg-blue-100 text-blue-600" },
    { label: "Off Hire", value: countKey("off"), className: "bg-gray-200 text-zinc-500" },
  ];

  return (
    <section className="w-full rounded-lg border border-neutral-200 px-4 py-6 font-['Stack_Sans_Headline']">
      <div className="flex flex-col gap-10">
        <h2 className="text-xl font-weight-600 leading-5 text-black">Fleet Operations</h2>

        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-8">
              <div className="flex flex-col gap-1">
                <p className="text-2xl font-weight-600 leading-6 text-black">{register.length} Vehicles</p>
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

          {loading ? (
            <div className="py-12 text-center text-sm text-neutral-400">Loading fleet…</div>
          ) : filteredVehicles.length === 0 ? (
            <div className="py-12 text-center text-sm text-neutral-400">No fleet vehicles match.</div>
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
              {(showAll ? filteredVehicles : filteredVehicles.slice(0, 8)).map((vehicle, index) => (
                <VehicleCard key={`${vehicle.registration}-${index}`} vehicle={vehicle} />
              ))}
            </div>
          )}

          {!showAll && filteredVehicles.length > 8 && (
            <div className="flex justify-center pt-4">
              <button
                type="button"
                onClick={() => setShowAll(true)}
                className="inline-flex h-8 items-center justify-center rounded bg-blue-100 px-3 py-2 text-sm font-weight-400 font-normal leading-4 text-blue-600 transition hover:bg-blue-200"
              >
                View All Vehicles
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
