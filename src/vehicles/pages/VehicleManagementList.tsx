import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { X, Trash2 } from "lucide-react";
import {
  listVehicleRecords,
  deleteVehicleRecord,
  type VehicleRecord,
} from "../services/vehicleRecordService";
import { listVehicleRegister, type FleetVehicleRegister } from "../services/vehicleService";
import { getDueReminders, type FleetDueReminder } from "../../fleet/services/hireService";
import FleetReminderPanel from "../../fleet/components/FleetReminderPanel";
import FleetNotificationBell from "../../fleet/components/FleetNotificationBell";
import FleetSpinnerLoader from "../../fleet/components/FleetSpinnerLoader";
import FleetConfirmModal from "../../fleet/components/FleetConfirmModal";
import FleetMultiSelectFilter from "../../fleet/components/FleetMultiSelectFilter";
import SearchIcon from "../../fleet/assets/listingpage/search.svg";
import VehiclesIcon from "../../fleet/assets/listingpage/vehicles.svg";
import CheckIcon from "../../fleet/assets/listingpage/check.svg";
import ProgressIcon from "../../fleet/assets/listingpage/progress.svg";
import CheckCircleIcon from "../../fleet/assets/listingpage/checkcircle.svg";
import TagIcon from "../../fleet/assets/listingpage/tag.svg";
import RiseIcon from "../../fleet/assets/listingpage/rise.svg";
import FallIcon from "../../fleet/assets/listingpage/fall.svg";
import UploadIcon from "../../fleet/assets/listingpage/upload.svg";
import DotsIcon from "../../fleet/assets/listingpage/dots-horizontal.svg";

const PAGE_SIZE = 10;

const normReg = (s?: string | null) => (s || "").replace(/\s+/g, "").toUpperCase();

// A registered vehicle's live status: on hire (from the shared register's is_active
// flag), in repair (from its own Vehicle Details status), otherwise available.
type VStatus = "on_hire" | "in_repair" | "for_sale" | "available";
const STATUS_LABEL: Record<VStatus, string> = {
  on_hire: "On Hire",
  in_repair: "In Repair",
  for_sale: "For Sale",
  available: "Available",
};
const STATUS_BADGE: Record<VStatus, string> = {
  on_hire: "bg-neutral-100 text-neutral-700",
  in_repair: "bg-[#ffe9d8] text-[#ff7402]",
  for_sale: "bg-pink-100 text-pink-700",
  available: "bg-[#d9ffd9] text-[#159215]",
};
const STATUS_OPTIONS = [
  { value: "on_hire", label: "On Hire" },
  { value: "in_repair", label: "In Repair" },
  { value: "for_sale", label: "For Sale" },
  { value: "available", label: "Available" },
];

const GRID =
  "grid-cols-[32px_minmax(120px,1fr)_minmax(120px,1fr)_minmax(120px,1fr)_minmax(120px,1fr)_minmax(110px,0.9fr)_minmax(120px,0.9fr)_36px]";

// Square checkbox — matches the Skyline listing / Task Management checkbox.
const Checkbox: React.FC<{ checked: boolean; onChange: () => void; label?: string }> = ({ checked, onChange, label }) => (
  <button type="button" role="checkbox" aria-checked={checked} aria-label={label} onClick={onChange} className="shrink-0 p-0.5">
    <span className={`block w-5 h-5 rounded ${checked ? "bg-neutral-900 border-[6px] border-neutral-300" : "bg-neutral-300"}`} />
  </button>
);

// "Date Added" — the record's created date (Postgres timestamps may lack a Z).
const fmtDateAdded = (s?: string | null) => {
  if (!s) return "—";
  const iso = /[zZ]|[+-]\d\d:?\d\d$/.test(s) ? s : s.replace(" ", "T") + "Z";
  const d = new Date(iso);
  return isNaN(d.getTime()) ? "—" : d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

// Month bucket used for the stat cards' "vs last month" trend.
const monthKey = (d: Date) => d.getFullYear() * 12 + d.getMonth();
const createdMonthKey = (s?: string | null): number | null => {
  if (!s) return null;
  const iso = /[zZ]|[+-]\d\d:?\d\d$/.test(s) ? s : s.replace(" ", "T") + "Z";
  const d = new Date(iso);
  return isNaN(d.getTime()) ? null : monthKey(d);
};

// ── Stat card (same design as the Skyline listing) ──────────────────────────
interface StatConfig {
  title: string;
  value: number;
  icon: string;
  tile: string;
  trendPct: number;
  darkIcon?: boolean; // force a coloured icon SVG to black (neutral tiles)
}
const StatCard: React.FC<StatConfig> = ({ title, value, icon, tile, trendPct, darkIcon }) => {
  const positive = trendPct >= 0;
  const badge =
    trendPct > 0
      ? "bg-[#d9ffd9] text-[#159215]"
      : trendPct < 0
        ? "bg-[#ffe3e4] text-[#e5484d]"
        : "bg-neutral-100 text-neutral-500";
  return (
    <div className="flex-1 min-w-0 p-4 rounded-lg border border-[#ccc] bg-white flex flex-col gap-3">
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-sm flex items-center justify-center ${tile}`}>
          <img src={icon} alt="" className="w-5 h-5" style={darkIcon ? { filter: "brightness(0)" } : undefined} />
        </div>
        <img src={positive ? RiseIcon : FallIcon} alt="" className="w-12 h-12 object-contain" />
      </div>
      <div className="flex flex-col gap-1">
        <div className="text-black text-4xl font-semibold leading-10">{value}</div>
        <div className="text-[#888] text-sm font-medium">{title}</div>
      </div>
      <div className="h-px bg-[#ccc]" />
      <div className="flex items-center gap-2">
        <span className={`px-1.5 py-1 rounded-tl-sm rounded-tr-sm rounded-bl-sm rounded-br-lg text-xs font-semibold ${badge}`}>
          {trendPct > 0 ? "+" : ""}
          {trendPct}%
        </span>
        <span className="text-[#888] text-sm">vs last month</span>
      </div>
    </div>
  );
};

/** Vehicle Management landing — the shared vehicle pool that feeds the Claims and
 *  Skyline hire dropdowns. Same widgets + table language as the Skyline listing. */
const VehicleManagementList: React.FC = () => {
  const navigate = useNavigate();
  const { context } = useParams();
  const [vehicles, setVehicles] = useState<VehicleRecord[]>([]);
  const [register, setRegister] = useState<FleetVehicleRegister[]>([]);
  const [loading, setLoading] = useState(true);

  const [query, setQuery] = useState("");
  const [statusSel, setStatusSel] = useState<string[]>([]);
  const [transmissionSel, setTransmissionSel] = useState<string[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [bulkConfirm, setBulkConfirm] = useState(false);
  const [reminders, setReminders] = useState<FleetDueReminder[]>([]);
  const [showReminders, setShowReminders] = useState(false);
  const [page, setPage] = useState(1);
  const [menu, setMenu] = useState<{ id: number; top: number; right: number } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<VehicleRecord | null>(null);

  const load = async () => {
    setLoading(true);
    const [recs, reg] = await Promise.all([listVehicleRecords(context), listVehicleRegister()]);
    setVehicles(recs);
    setRegister(reg);
    setSelected(new Set());
    setLoading(false);
  };
  useEffect(() => {
    load();
  }, [context]);

  // Reminders popup on each visit — Vehicle Management owns the vehicle-document
  // reminders (MOT / Plate / Road Fund).
  useEffect(() => {
    getDueReminders("vehicles").then((due) => {
      setReminders(due);
      if (due.length) setShowReminders(true);
    });
  }, []);

  // On-hire lookup by normalised registration (the shared exclusivity flag).
  const activeRegs = useMemo(() => {
    const s = new Set<string>();
    register.forEach((r) => {
      if (r.is_active) s.add(normReg(r.registration_number));
    });
    return s;
  }, [register]);

  const statusOf = (v: VehicleRecord): VStatus => {
    const st = (v.vehicle_status || "").toLowerCase().replace(/_/g, " ");
    // On hire either by the vehicle's own status or by being on a live hire (the
    // shared register). Same precedence the dashboard donut uses, so they agree.
    if (st === "weekly hire" || st === "on hire" || (v.registration_number && activeRegs.has(normReg(v.registration_number)))) return "on_hire";
    if (st.includes("repair")) return "in_repair";
    if (st.includes("sale")) return "for_sale";
    return "available";
  };

  const stats = useMemo<StatConfig[]>(() => {
    const bySt = (s: VStatus) => vehicles.filter((v) => statusOf(v) === s);
    // "vs last month" = vehicles added this month vs last month (by created_at),
    // same basis as the Skyline hire list. 100% when there was nothing last month.
    const thisKey = monthKey(new Date());
    const lastKey = thisKey - 1;
    const trendFor = (subset: VehicleRecord[]) => {
      let t = 0, l = 0;
      subset.forEach((v) => {
        const k = createdMonthKey(v.created_at);
        if (k === thisKey) t += 1;
        else if (k === lastKey) l += 1;
      });
      return l === 0 ? (t > 0 ? 100 : 0) : Math.round(((t - l) / l) * 100);
    };
    const onHire = bySt("on_hire");
    const inRepair = bySt("in_repair");
    const forSale = bySt("for_sale");
    const available = bySt("available");
    return [
      { title: "Total Vehicles", value: vehicles.length, icon: VehiclesIcon, tile: "bg-[#eee]", trendPct: trendFor(vehicles), darkIcon: true },
      { title: "On Hire", value: onHire.length, icon: CheckIcon, tile: "bg-[#eee]", trendPct: trendFor(onHire), darkIcon: true },
      { title: "In Repair", value: inRepair.length, icon: ProgressIcon, tile: "bg-[#fff1d7]", trendPct: trendFor(inRepair) },
      { title: "For Sale", value: forSale.length, icon: TagIcon, tile: "bg-[#fce7f3]", trendPct: trendFor(forSale) },
      { title: "Available", value: available.length, icon: CheckCircleIcon, tile: "bg-[#d9ffd9]", trendPct: trendFor(available) },
    ];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vehicles, activeRegs]);

  // Distinct transmission values present in the data, for the Transmission filter.
  const transmissionOptions = useMemo(() => {
    const set = new Set<string>();
    vehicles.forEach((v) => {
      const t = (v.transmission || "").trim();
      if (t) set.add(t);
    });
    return Array.from(set).sort().map((t) => ({ label: t, value: t }));
  }, [vehicles]);

  const filtered = useMemo(() => {
    return vehicles.filter((v) => {
      if (query.trim()) {
        const hay = [v.registration_number, v.make, v.model, v.transmission]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!hay.includes(query.trim().toLowerCase())) return false;
      }
      if (statusSel.length && !statusSel.includes(statusOf(v))) return false;
      if (transmissionSel.length && !transmissionSel.includes((v.transmission || "").trim())) return false;
      return true;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vehicles, query, statusSel, transmissionSel, activeRegs]);

  useEffect(() => {
    setPage(1);
  }, [query, statusSel, transmissionSel]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * PAGE_SIZE;
  const pageItems = filtered.slice(start, start + PAGE_SIZE);
  const pageNumbers = useMemo<(number | "…")[]>(() => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const out: (number | "…")[] = [1];
    const lo = Math.max(2, safePage - 1);
    const hi = Math.min(totalPages - 1, safePage + 1);
    if (lo > 2) out.push("…");
    for (let n = lo; n <= hi; n++) out.push(n);
    if (hi < totalPages - 1) out.push("…");
    out.push(totalPages);
    return out;
  }, [totalPages, safePage]);

  // Open a blank editor. The DB row is only created once the user actually enters
  // data (deferred creation in VehicleManagementRecord), so backing out here
  // leaves no empty record behind.
  const register_ = () => navigate(`/vehicle-management/${context}/new`);

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const ok = await deleteVehicleRecord(deleteTarget.id);
    setDeleteTarget(null);
    if (ok) {
      toast.success("Vehicle deleted.");
      load();
    } else {
      toast.error("Could not delete the vehicle.");
    }
  };

  // Multi-select (checkboxes + bulk action bar), scoped to the current page.
  const allOnPageSelected = pageItems.length > 0 && pageItems.every((v) => selected.has(v.id));
  const toggleAll = () =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (allOnPageSelected) pageItems.forEach((v) => next.delete(v.id));
      else pageItems.forEach((v) => next.add(v.id));
      return next;
    });
  const toggleOne = (id: number) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const confirmBulkDelete = async () => {
    const ids = [...selected];
    setBulkConfirm(false);
    if (!ids.length) return;
    const results = await Promise.allSettled(ids.map((id) => deleteVehicleRecord(id)));
    const failed = results.filter((r) => r.status === "rejected" || r.value === false).length;
    setSelected(new Set());
    if (failed) toast.error(`${failed} vehicle(s) couldn't be deleted.`);
    else toast.success(`${ids.length} vehicle(s) deleted.`);
    load();
  };

  const exportCsv = () => {
    const rows = [
      ["Registration", "Make", "Model", "Transmission", "Status", "Date"],
      ...filtered.map((v) => [
        v.registration_number || "",
        v.make || "",
        v.model || "",
        v.transmission || "",
        STATUS_LABEL[statusOf(v)],
        fmtDateAdded(v.created_at),
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "vehicles.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-white font-sans-headline">
      {loading && <FleetSpinnerLoader />}

      {/* Topbar */}
      <div className="h-20 px-4 sm:px-6 lg:px-10 flex items-center justify-between border-b border-[#eee]">
        <h1 className="text-black text-2xl font-semibold">Vehicle Management &ndash; {context === "cams" ? "CAMS" : "Skyline"}</h1>
        <div className="flex items-center gap-6">
          <img src={SearchIcon} alt="Search" className="w-5 h-5" />
          <FleetNotificationBell module={`vehicles_${context || "skyline"}`} />
        </div>
      </div>

      <main className="px-4 sm:px-6 lg:px-10 py-6 flex flex-col gap-10">
        {/* Stat cards */}
        <div className="flex flex-col sm:flex-row items-stretch gap-4">
          {stats.map((s) => (
            <StatCard key={s.title} {...s} />
          ))}
        </div>

        <div className="flex flex-col gap-4">
          {/* Search + actions */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by Registration / Make / Model"
              className="w-full lg:max-w-[491px] h-12 px-5 rounded bg-white border border-neutral-200 outline-none text-sm text-neutral-900 placeholder:text-neutral-400 font-light focus:border-neutral-400"
            />
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={register_}
                className="h-12 px-10 bg-black rounded text-white text-base font-medium inline-flex items-center justify-center gap-2 hover:bg-neutral-800"
              >
                Register Vehicle
              </button>
              <button
                type="button"
                onClick={exportCsv}
                className="h-12 px-6 rounded bg-white border border-black text-black text-base font-medium inline-flex items-center justify-center gap-2.5 hover:bg-neutral-50"
              >
                <img src={UploadIcon} alt="" className="w-4 h-4" />
                Export
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
            <FleetMultiSelectFilter
              label="Status"
              options={STATUS_OPTIONS}
              selected={statusSel}
              onToggle={(v) => setStatusSel((s) => (s.includes(v) ? s.filter((x) => x !== v) : [...s, v]))}
              onClear={() => setStatusSel([])}
            />
            <FleetMultiSelectFilter
              label="Transmission"
              options={transmissionOptions}
              selected={transmissionSel}
              onToggle={(v) => setTransmissionSel((s) => (s.includes(v) ? s.filter((x) => x !== v) : [...s, v]))}
              onClear={() => setTransmissionSel([])}
            />
          </div>

          {/* Active filter pills */}
          {(statusSel.length > 0 || transmissionSel.length > 0) && (
            <div className="flex items-center gap-2 flex-wrap">
              {statusSel.map((v) => (
                <span key={`st-${v}`} className="flex items-center gap-2 pl-3 pr-2 py-1.5 bg-white rounded-full border border-neutral-200 text-sm text-neutral-700">
                  {STATUS_LABEL[v as VStatus]}
                  <button
                    type="button"
                    onClick={() => setStatusSel((s) => s.filter((x) => x !== v))}
                    className="text-neutral-400 hover:text-neutral-700"
                    aria-label={`Remove ${STATUS_LABEL[v as VStatus]} filter`}
                  >
                    <X size={14} />
                  </button>
                </span>
              ))}
              {transmissionSel.map((v) => (
                <span key={`tr-${v}`} className="flex items-center gap-2 pl-3 pr-2 py-1.5 bg-white rounded-full border border-neutral-200 text-sm text-neutral-700">
                  {v}
                  <button
                    type="button"
                    onClick={() => setTransmissionSel((s) => s.filter((x) => x !== v))}
                    className="text-neutral-400 hover:text-neutral-700"
                    aria-label={`Remove ${v} filter`}
                  >
                    <X size={14} />
                  </button>
                </span>
              ))}
              <button type="button" onClick={() => { setStatusSel([]); setTransmissionSel([]); }} className="ml-1 text-sm text-neutral-600 hover:underline">
                Clear all
              </button>
            </div>
          )}

          {/* Bulk action bar — appears when any vehicle is selected. */}
          {selected.size > 0 && (
            <div className="flex items-center justify-between px-4 py-3 bg-[#eee] text-black rounded">
              <span className="text-sm font-medium">{selected.size} Selected</span>
              <div className="flex items-center gap-6 text-sm">
                <button type="button" onClick={() => setSelected(new Set())} className="hover:opacity-80">
                  Clear
                </button>
                <button type="button" onClick={() => setBulkConfirm(true)} className="flex items-center gap-1.5 hover:text-red-600">
                  <Trash2 size={16} /> Delete
                </button>
              </div>
            </div>
          )}

          {/* Table */}
          <div className="border border-[#eee] rounded-lg overflow-x-auto">
            <div className="min-w-[760px]">
              <div className={`grid ${GRID} gap-2 bg-[#eee] px-4 h-[52px] items-center text-sm font-semibold text-black`}>
                <Checkbox checked={allOnPageSelected} onChange={toggleAll} label="Select all" />
                <span>REGISTRATION</span>
                <span>MAKE</span>
                <span>MODEL</span>
                <span>TRANSMISSION</span>
                <span>STATUS</span>
                <span>DATE</span>
                <span />
              </div>

              {loading ? null : pageItems.length === 0 ? (
                <div className="h-48 flex flex-col items-center justify-center text-center border-t border-[#eee]">
                  <p className="text-neutral-900 text-base font-semibold">No vehicles found</p>
                  <p className="text-neutral-500 text-sm mt-1">Register a vehicle, or adjust the search / filters.</p>
                </div>
              ) : (
                pageItems.map((v) => {
                  const st = statusOf(v);
                  return (
                    <div key={v.id} className={`grid ${GRID} gap-2 px-4 py-3 items-center text-sm border-t border-[#eee] hover:bg-neutral-50`}>
                      <Checkbox checked={selected.has(v.id)} onChange={() => toggleOne(v.id)} label={`Select ${v.registration_number || "vehicle"}`} />
                      <button type="button" onClick={() => navigate(`/vehicle-management/${context}/${v.id}`)} className="text-left text-neutral-900 font-medium hover:underline truncate">
                        {v.registration_number || "—"}
                      </button>
                      <span className="text-neutral-700 truncate">{v.make || "—"}</span>
                      <span className="text-neutral-700 truncate">{v.model || "—"}</span>
                      <span className="text-neutral-700 truncate">{v.transmission || "—"}</span>
                      <span>
                        <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${STATUS_BADGE[st]}`}>
                          {STATUS_LABEL[st]}
                        </span>
                      </span>
                      <span className="text-neutral-700 truncate">{fmtDateAdded(v.created_at)}</span>
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            setMenu((m) => (m?.id === v.id ? null : { id: v.id, top: rect.bottom + 4, right: window.innerWidth - rect.right }));
                          }}
                          aria-label="Row actions"
                          className="p-1 rounded hover:bg-neutral-100"
                        >
                          <img src={DotsIcon} alt="" className="w-4 h-4 rotate-90" />
                        </button>
                        {menu?.id === v.id && (
                          <>
                            <div className="fixed inset-0 z-[80]" onClick={() => setMenu(null)} />
                            <div style={{ position: "fixed", top: menu.top, right: menu.right }} className="z-[90] w-32 bg-white rounded-lg shadow-lg border border-neutral-200 py-1">
                              <button type="button" onClick={() => { setMenu(null); navigate(`/vehicle-management/${context}/${v.id}`); }} className="w-full text-left px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50">
                                View
                              </button>
                              <button type="button" onClick={() => { setMenu(null); setDeleteTarget(v); }} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-neutral-50">
                                Delete
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Footer: count + pagination */}
          {!loading && filtered.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs text-[#4a5565]">
                Showing <span className="font-semibold text-[#101828]">{start + 1}</span> to{" "}
                <span className="font-semibold text-[#101828]">{Math.min(start + PAGE_SIZE, filtered.length)}</span> of{" "}
                <span className="font-semibold text-[#101828]">{filtered.length}</span> Entries
              </div>
              <div className="flex items-center text-sm">
                <button type="button" disabled={safePage <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="px-3 py-2 rounded-l border border-[#e5e7eb] font-medium text-neutral-700 disabled:opacity-40 hover:bg-neutral-50">
                  Previous
                </button>
                {pageNumbers.map((n, i) =>
                  n === "…" ? (
                    <span key={`e${i}`} className="w-9 h-9 -ml-px border border-[#e5e7eb] flex items-center justify-center text-neutral-400">…</span>
                  ) : (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setPage(n)}
                      className={`w-9 h-9 -ml-px border border-[#e5e7eb] flex items-center justify-center font-medium ${n === safePage ? "bg-[#eee] text-[#101828]" : "bg-white text-neutral-700 hover:bg-neutral-50"}`}
                    >
                      {n}
                    </button>
                  ),
                )}
                <button type="button" disabled={safePage >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} className="px-3 py-2 rounded-r -ml-px border border-[#e5e7eb] font-medium text-neutral-700 disabled:opacity-40 hover:bg-neutral-50">
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {deleteTarget && (
        <FleetConfirmModal
          title="Delete Vehicle"
          message={`Are you sure you want to delete ${deleteTarget.registration_number || "this vehicle"}?`}
          confirmLabel="Delete"
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {bulkConfirm && (
        <FleetConfirmModal
          title="Delete Vehicles"
          message={`Are you sure you want to delete ${selected.size} vehicle${selected.size === 1 ? "" : "s"}?`}
          confirmLabel="Delete"
          onConfirm={confirmBulkDelete}
          onCancel={() => setBulkConfirm(false)}
        />
      )}

      {/* Reminders panel (shown on each visit) — vehicle documents (MOT / Plate / Road Fund). */}
      {showReminders && reminders.length > 0 && (
        <FleetReminderPanel reminders={reminders} onClose={() => setShowReminders(false)} />
      )}
    </div>
  );
};

export default VehicleManagementList;
