import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { listHires, deleteHire, getDueReminders, type HireRecord, type FleetDueReminder } from "../services/hireService";
import { listVehicleRegister, type FleetVehicleRegister } from "../../vehicles/services/vehicleService";
import { listVehicleRecords, type VehicleRecord } from "../../vehicles/services/vehicleRecordService";
import FleetConfirmModal from "../components/FleetConfirmModal";
import FleetReminderPanel from "../components/FleetReminderPanel";
import FleetNotificationBell from "../components/FleetNotificationBell";
import FleetSpinnerLoader from "../components/FleetSpinnerLoader";
import FleetMultiSelectFilter from "../components/FleetMultiSelectFilter";
import { FleetCalendar } from "../components/FleetCalendar";
import { fleetReference } from "../utils/reference";
// Listing-page icons (design set)
import SearchIcon from "../assets/listingpage/search.svg";
import VehiclesIcon from "../assets/listingpage/vehicles.svg";
import CheckIcon from "../assets/listingpage/check.svg";
import OffHireIcon from "../assets/listingpage/offhire.svg";
import ProgressIcon from "../assets/listingpage/progress.svg";
import CheckCircleIcon from "../assets/listingpage/checkcircle.svg";
import RiseIcon from "../assets/listingpage/rise.svg";
import FallIcon from "../assets/listingpage/fall.svg";
import UploadIcon from "../assets/listingpage/upload.svg";
import CalendarIcon from "../assets/listingpage/calendar.svg";
import DotsIcon from "../assets/listingpage/dots-horizontal.svg";
import Delete from "../assets/icons/Remove.svg";

const PAGE_SIZE = 10;

const fallbackReference = (h: HireRecord) => h.fleet_reference || fleetReference(h);
const driverContact = (h: HireRecord) => h.driver_mobile || h.driver_telephone || "";

const shortDate = (value?: string) => {
  if (!value) return "-";
  const d = new Date(value.length <= 10 ? `${value}T00:00:00` : value);
  return Number.isNaN(d.getTime())
    ? "-"
    : d.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "2-digit" });
};

const STATUS_LABEL: Record<string, string> = {
  on_hire: "On Hire", off_hire: "Off Hire", in_repair: "In Repair", available: "Available",
};
const STATUS_BADGE: Record<string, string> = {
  on_hire: "bg-neutral-100 text-neutral-700",
  off_hire: "bg-purple-100 text-purple-600",
  in_repair: "bg-[#ffe9d8] text-[#ff7402]",
  available: "bg-[#d9ffd9] text-[#159215]",
};
const statusLabel = (v?: string) => (v ? STATUS_LABEL[v] || "-" : "-");
const normReg = (s?: string | null) => (s || "").replace(/\s+/g, "").toUpperCase();
const STATUS_OPTIONS = [
  { value: "on_hire", label: "On Hire" },
  { value: "off_hire", label: "Off Hire" },
  { value: "in_repair", label: "In Repair" },
  { value: "available", label: "Available" },
];

// checkbox · Reference · Hirer · Vehicle Reg · Hire Start · Hire End · Email · Contact · Status · kebab
const GRID =
  "grid-cols-[32px_minmax(110px,1fr)_minmax(120px,1fr)_minmax(120px,1fr)_minmax(84px,0.75fr)_minmax(84px,0.75fr)_minmax(190px,1.4fr)_minmax(140px,1.1fr)_minmax(96px,0.85fr)_36px]";

const monthKey = (d: Date) => d.getFullYear() * 12 + d.getMonth();
const openedKey = (r: HireRecord): number | null => {
  if (!r.file_opened_at) return null;
  const d = new Date(r.file_opened_at);
  return Number.isNaN(d.getTime()) ? null : monthKey(d);
};

// ── Small building blocks ──────────────────────────────────────────────────
const Checkbox: React.FC<{ checked: boolean; onChange: () => void; label?: string }> = ({ checked, onChange, label }) => (
  <button type="button" role="checkbox" aria-checked={checked} aria-label={label} onClick={onChange} className="shrink-0 p-0.5">
    <span className={`block w-5 h-5 rounded ${checked ? "bg-neutral-900 border-[6px] border-neutral-300" : "bg-neutral-300"}`} />
  </button>
);

const useOutside = (onClose: () => void) => {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [onClose]);
  return ref;
};

// Date field — calendar.svg trigger + Fleet's own popup calendar (kept in-module).
const DateField: React.FC<{ value: string; onChange: (v: string) => void; placeholder: string }> = ({ value, onChange, placeholder }) => {
  const [open, setOpen] = useState(false);
  const ref = useOutside(() => setOpen(false));
  const selected = value ? new Date(`${value}T00:00:00`) : null;
  return (
    <div className="relative" ref={ref}>
      <button type="button" onClick={() => setOpen((o) => !o)} className="w-[150px] h-12 px-5 rounded bg-white border border-neutral-200 flex items-center justify-between gap-2 hover:border-neutral-400">
        <span className={`text-sm font-light ${value ? "text-neutral-700" : "text-neutral-400"}`}>
          {selected ? selected.toLocaleDateString("en-GB") : placeholder}
        </span>
        <img src={CalendarIcon} alt="" className="w-4 h-4 shrink-0" />
      </button>
      {open && (
        <FleetCalendar
          selectedDate={selected}
          onSelect={(d) => {
            onChange(d.toLocaleDateString("sv-SE"));
            setOpen(false);
          }}
        />
      )}
    </div>
  );
};

// ── Stat card ──────────────────────────────────────────────────────────────
interface StatConfig {
  title: string;
  value: number;
  icon: string;
  tile: string;
  trendPct: number;
  darkIcon?: boolean; // force a coloured icon SVG to black (neutral tiles)
  tint?: string; // recolour the icon to this exact colour (masked), e.g. purple Off Hire
}
const StatCard: React.FC<StatConfig> = ({ title, value, icon, tile, trendPct, darkIcon, tint }) => {
  const positive = trendPct >= 0;
  const badge = trendPct > 0 ? "bg-[#d9ffd9] text-[#159215]" : trendPct < 0 ? "bg-[#ffe3e4] text-[#e5484d]" : "bg-neutral-100 text-neutral-500";
  return (
    <div className="flex-1 min-w-0 p-4 rounded-lg border border-[#ccc] bg-white flex flex-col gap-3">
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-sm flex items-center justify-center ${tile}`}>
          {tint ? (
            <span
              aria-hidden
              className="w-5 h-5 inline-block"
              style={{
                backgroundColor: tint,
                WebkitMaskImage: `url(${icon})`,
                maskImage: `url(${icon})`,
                WebkitMaskRepeat: "no-repeat",
                maskRepeat: "no-repeat",
                WebkitMaskSize: "contain",
                maskSize: "contain",
                WebkitMaskPosition: "center",
                maskPosition: "center",
              }}
            />
          ) : (
            <img src={icon} alt="" className="w-5 h-5" style={darkIcon ? { filter: "brightness(0)" } : undefined} />
          )}
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
          {trendPct > 0 ? "+" : ""}{trendPct}%
        </span>
        <span className="text-[#888] text-sm">vs last month</span>
      </div>
    </div>
  );
};

const FleetList: React.FC = () => {
  const navigate = useNavigate();
  const [records, setRecords] = useState<HireRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const [query, setQuery] = useState("");
  const [regSel, setRegSel] = useState<string[]>([]);
  const [statusSel, setStatusSel] = useState<string[]>([]);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  // Row-actions menu: id + fixed viewport coords so it escapes the table's
  // horizontal-scroll overflow clipping (which otherwise hides it, worst with one row).
  const [menu, setMenu] = useState<{ id: number; top: number; right: number } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<HireRecord | null>(null);
  const [bulkConfirm, setBulkConfirm] = useState(false);
  const [register, setRegister] = useState<FleetVehicleRegister[]>([]);
  const [vehicleRecords, setVehicleRecords] = useState<VehicleRecord[]>([]);
  const [reminders, setReminders] = useState<FleetDueReminder[]>([]);
  const [showReminders, setShowReminders] = useState(false);

  const load = async () => {
    setLoading(true);
    const [hires, reg, vrecs] = await Promise.all([listHires(), listVehicleRegister(), listVehicleRecords()]);
    setRecords(hires);
    setRegister(reg);
    setVehicleRecords(vrecs);
    setSelected(new Set());
    setLoading(false);
  };
  useEffect(() => {
    load();
  }, []);

  // Reminders popup — shown on every visit to the listing (temporary, for now).
  // Skyline (hire) list only surfaces driver-doc reminders; vehicle docs (MOT /
  // Plate / Road Fund) belong to the Vehicle Management list, not here.
  useEffect(() => {
    getDueReminders("skyline").then((due) => {
      setReminders(due);
      if (due.length) setShowReminders(true);
    });
  }, []);

  // A vehicle marked "In Repair" on its Vehicle Details record overrides the
  // hire's on/off-hire status on the listing. Matched by hire id, then registration.
  const inRepair = useMemo(() => {
    const hireIds = new Set<number>();
    const regs = new Set<string>();
    vehicleRecords.forEach((v) => {
      if ((v.vehicle_status || "").toLowerCase().includes("repair")) {
        if (v.hire_id != null) hireIds.add(v.hire_id);
        if (v.registration_number) regs.add(normReg(v.registration_number));
      }
    });
    return { hireIds, regs };
  }, [vehicleRecords]);

  const effectiveStatus = useCallback(
    (r: HireRecord): string =>
      inRepair.hireIds.has(r.id) ||
      (!!r.last_vehicle_registration && inRepair.regs.has(normReg(r.last_vehicle_registration)))
        ? "in_repair"
        : (r.last_vehicle_hire_status || ""),
    [inRepair],
  );

  const stats = useMemo<StatConfig[]>(() => {
    const thisKey = monthKey(new Date());
    const lastKey = thisKey - 1;
    const trendFor = (subset: HireRecord[]) => {
      let t = 0, l = 0;
      subset.forEach((r) => {
        const k = openedKey(r);
        if (k === thisKey) t += 1;
        else if (k === lastKey) l += 1;
      });
      return l === 0 ? (t > 0 ? 100 : 0) : Math.round(((t - l) / l) * 100);
    };
    const by = (v: string) => records.filter((r) => effectiveStatus(r) === v);
    // Available = vehicles in the fleet register still free for hire (not on hire).
    const availableCars = register.filter((v) => !v.is_active).length;
    return [
      { title: "Total Hires", value: records.length, icon: VehiclesIcon, tile: "bg-[#eee]", trendPct: trendFor(records), darkIcon: true },
      { title: "On Hire", value: by("on_hire").length, icon: CheckIcon, tile: "bg-[#eee]", trendPct: trendFor(by("on_hire")), darkIcon: true },
      { title: "Off Hire", value: by("off_hire").length, icon: OffHireIcon, tile: "bg-purple-100", trendPct: trendFor(by("off_hire")) },
      // Linked to the Vehicle Details "In Repair" status (per vehicle record), not hires.
      { title: "In Repair", value: vehicleRecords.filter((v) => (v.vehicle_status || "").toLowerCase().includes("repair")).length, icon: ProgressIcon, tile: "bg-[#fff1d7]", trendPct: 0 },
      { title: "Available", value: availableCars, icon: CheckCircleIcon, tile: "bg-[#d9ffd9]", trendPct: 0 },
    ];
  }, [records, register, vehicleRecords, effectiveStatus]);

  // Vehicle registration options — every reg in the fleet register + on a record.
  const vehicleOptions = useMemo(() => {
    const regs = new Set<string>();
    register.forEach((v) => { if (v.registration_number) regs.add(v.registration_number); });
    records.forEach((r) => { if (r.last_vehicle_registration) regs.add(r.last_vehicle_registration); });
    return [
      { label: "All Vehicles", value: "" },
      ...[...regs].sort().map((r) => ({ label: r, value: r })),
    ];
  }, [register, records]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return records.filter((r) => {
      if (needle) {
        const hay = [fallbackReference(r), r.driver_name, driverContact(r), r.driver_email, r.last_vehicle_registration, statusLabel(effectiveStatus(r))]
          .filter(Boolean).join(" ").toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      if (regSel.length && !regSel.includes(r.last_vehicle_registration || "")) return false;
      if (statusSel.length && !statusSel.includes(effectiveStatus(r))) return false;
      const d = (r.last_vehicle_hire_start || r.file_opened_at || "").slice(0, 10);
      if (fromDate && (!d || d < fromDate)) return false;
      if (toDate && (!d || d > toDate)) return false;
      return true;
    });
  }, [records, query, regSel, statusSel, fromDate, toDate, effectiveStatus]);

  useEffect(() => {
    setPage(1);
  }, [query, regSel, statusSel, fromDate, toDate]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * PAGE_SIZE;
  const pageItems = filtered.slice(start, start + PAGE_SIZE);

  const allOnPageSelected = pageItems.length > 0 && pageItems.every((r) => selected.has(r.id));
  const toggleAll = () =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (allOnPageSelected) pageItems.forEach((r) => next.delete(r.id));
      else pageItems.forEach((r) => next.add(r.id));
      return next;
    });
  const toggleOne = (id: number) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const target = deleteTarget;
    setDeleteTarget(null);
    setRecords((rs) => rs.filter((r) => r.id !== target.id));
    const ok = await deleteHire(target.id);
    if (ok) toast.success("Fleet record deleted.");
    else {
      toast.error("Couldn't delete the record.");
      load();
    }
  };

  const confirmBulkDelete = async () => {
    const ids = [...selected];
    setBulkConfirm(false);
    if (!ids.length) return;
    setRecords((rs) => rs.filter((r) => !selected.has(r.id)));
    const results = await Promise.allSettled(ids.map((id) => deleteHire(id)));
    const failed = results.filter((r) => r.status === "rejected" || r.value === false).length;
    setSelected(new Set());
    if (failed) {
      toast.error(`${failed} record(s) couldn't be deleted.`);
      load();
    } else {
      toast.success(`${ids.length} record(s) deleted.`);
    }
  };

  const exportCsv = () => {
    const rows = selected.size ? filtered.filter((r) => selected.has(r.id)) : filtered;
    if (!rows.length) {
      toast.info("Nothing to export.");
      return;
    }
    const header = ["Reference No.", "Hirer Name", "Email", "Vehicle Reg", "Hire Start", "Hire End", "Contact No.", "Status"];
    const body = rows.map((r) => [
      fallbackReference(r), r.driver_name || "", r.driver_email || "", r.last_vehicle_registration || "",
      r.last_vehicle_hire_start || "", r.last_vehicle_hire_end || "", driverContact(r), statusLabel(effectiveStatus(r)),
    ]);
    const csv = [header, ...body].map((cols) => cols.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `fleet-records-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const pageNumbers = useMemo(() => {
    const nums: (number | "…")[] = [];
    if (totalPages <= 9) {
      for (let i = 1; i <= totalPages; i += 1) nums.push(i);
    } else {
      const win = new Set([1, 2, safePage - 1, safePage, safePage + 1, totalPages - 1, totalPages]);
      let prev = 0;
      for (let i = 1; i <= totalPages; i += 1) {
        if (win.has(i) && i >= 1 && i <= totalPages) {
          if (i - prev > 1) nums.push("…");
          nums.push(i);
          prev = i;
        }
      }
    }
    return nums;
  }, [totalPages, safePage]);

  return (
    <div className="min-h-screen bg-white font-sans-headline">
      {loading && <FleetSpinnerLoader />}
      {/* Topbar */}
      <div className="h-20 px-4 sm:px-6 lg:px-10 flex items-center justify-between border-b border-[#eee]">
        <h1 className="text-black text-2xl font-semibold">Skyline</h1>
        <div className="flex items-center gap-6">
          <img src={SearchIcon} alt="Search" className="w-5 h-5" />
          <FleetNotificationBell />
        </div>
      </div>

      <main className="px-4 sm:px-6 lg:px-10 py-6 lg:py-6 flex flex-col gap-10">
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
              placeholder="Search by Reference No. / Hirer Name / Vehicle Reg"
              className="w-full lg:max-w-[491px] h-12 px-5 rounded bg-white border border-neutral-200 outline-none text-sm text-neutral-900 placeholder:text-neutral-400 font-light focus:border-neutral-400"
            />
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => navigate("/fleet/hire/new")}
                className="h-12 px-10 bg-black rounded text-white text-base font-medium inline-flex items-center justify-center gap-2 hover:bg-neutral-800"
              >
                Add Hire
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

          {/* Filters — borderless multi-select (Vehicle + Status), same shape. */}
          <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
            <FleetMultiSelectFilter
              label="Vehicle"
              options={vehicleOptions.filter((o) => o.value)}
              selected={regSel}
              onToggle={(v) => setRegSel((s) => (s.includes(v) ? s.filter((x) => x !== v) : [...s, v]))}
              onClear={() => setRegSel([])}
            />
            <FleetMultiSelectFilter
              label="Status"
              options={STATUS_OPTIONS}
              selected={statusSel}
              onToggle={(v) => setStatusSel((s) => (s.includes(v) ? s.filter((x) => x !== v) : [...s, v]))}
              onClear={() => setStatusSel([])}
            />
            <div className="flex items-center gap-2 md:ml-auto">
              <span className="text-sm text-[#444] shrink-0">Date Range</span>
              <DateField value={fromDate} onChange={setFromDate} placeholder="From" />
              <DateField value={toDate} onChange={setToDate} placeholder="To" />
              {(fromDate || toDate) && (
                <button
                  type="button"
                  onClick={() => { setFromDate(""); setToDate(""); }}
                  className="text-xs text-[#0352fd] hover:underline"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Active filter pills — selected vehicles + statuses as removable chips. */}
          {(statusSel.length > 0 || regSel.length > 0) && (
            <div className="flex items-center gap-2 flex-wrap">
              {regSel.map((v) => (
                <span key={`reg-${v}`} className="flex items-center gap-2 pl-3 pr-2 py-1.5 bg-white rounded-full border border-neutral-200 text-sm text-neutral-700">
                  {v}
                  <button type="button" onClick={() => setRegSel((s) => s.filter((x) => x !== v))} className="text-neutral-400 hover:text-neutral-700" aria-label={`Remove ${v} filter`}>
                    <X size={14} />
                  </button>
                </span>
              ))}
              {statusSel.map((v) => (
                <span key={`st-${v}`} className="flex items-center gap-2 pl-3 pr-2 py-1.5 bg-white rounded-full border border-neutral-200 text-sm text-neutral-700">
                  {statusLabel(v)}
                  <button
                    type="button"
                    onClick={() => setStatusSel((s) => s.filter((x) => x !== v))}
                    className="text-neutral-400 hover:text-neutral-700"
                    aria-label={`Remove ${statusLabel(v)} filter`}
                  >
                    <X size={14} />
                  </button>
                </span>
              ))}
              <button type="button" onClick={() => { setStatusSel([]); setRegSel([]); }} className="ml-1 text-sm text-neutral-600 hover:underline">
                Clear all
              </button>
            </div>
          )}

          {/* Bulk action bar (Claims-style) */}
          {selected.size > 0 && (
            <div className="flex items-center justify-between px-4 py-3 bg-[#eee] text-black rounded">
              <span className="text-sm font-medium">{selected.size} Selected</span>
              <div className="flex items-center gap-6 text-sm">
                <button type="button" onClick={() => setSelected(new Set())} className="hover:opacity-80">
                  Clear
                </button>
                <button type="button" onClick={() => setBulkConfirm(true)} className="flex items-center gap-1.5 hover:text-red-600">
                  <img src={Delete} alt="" /> Delete
                </button>
              </div>
            </div>
          )}

          {/* Table */}
          <div className="border border-[#eee] rounded-lg overflow-x-auto">
            <div className="min-w-[1080px]">
              <div className={`grid ${GRID} gap-2 bg-[#eee] px-4 h-[52px] items-center text-sm font-semibold text-black`}>
                <Checkbox checked={allOnPageSelected} onChange={toggleAll} label="Select all" />
                <span>REFERENCE NO.</span>
                <span>HIRER NAME</span>
                <span>VEHICLE REG</span>
                <span>HIRE START</span>
                <span>HIRE END</span>
                <span>EMAIL</span>
                <span>CONTACT NO.</span>
                <span>STATUS</span>
                <span />
              </div>

              {loading ? null : pageItems.length === 0 ? (
                <div className="h-48 flex flex-col items-center justify-center text-center border-t border-[#eee]">
                  <p className="text-neutral-900 text-base font-semibold">No fleet records found</p>
                  <p className="text-neutral-500 text-sm mt-1">Try adjusting the search or filters.</p>
                </div>
              ) : (
                pageItems.map((r) => (
                  <div key={r.id} className={`grid ${GRID} gap-2 px-4 py-3 items-center text-sm border-t border-[#eee] hover:bg-neutral-50`}>
                    <Checkbox checked={selected.has(r.id)} onChange={() => toggleOne(r.id)} label={`Select ${fallbackReference(r)}`} />
                    <button type="button" onClick={() => navigate(`/fleet/hire/${r.id}`)} className="text-left text-neutral-700  hover:underline truncate">
                      {fallbackReference(r)}
                    </button>
                    <span className="text-neutral-700 truncate">{r.driver_name || "-"}</span>
                    <span className="text-neutral-700 truncate">{r.last_vehicle_registration || "-"}</span>
                    <span className="text-[#535862]">{shortDate(r.last_vehicle_hire_start)}</span>
                    <span className="text-[#535862]">{shortDate(r.last_vehicle_hire_end)}</span>
                    <span className="text-neutral-700 truncate" title={r.driver_email || ""}>{r.driver_email || "-"}</span>
                    <span className="text-[#535762] font-inter truncate">{driverContact(r) || "-"}</span>
                    <span>
                      {effectiveStatus(r) ? (
                        <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${STATUS_BADGE[effectiveStatus(r)] || "bg-neutral-100 text-neutral-600"}`}>
                          {statusLabel(effectiveStatus(r))}
                        </span>
                      ) : (
                        <span className="text-neutral-400">-</span>
                      )}
                    </span>
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          setMenu((m) => (m?.id === r.id ? null : { id: r.id, top: rect.bottom + 4, right: window.innerWidth - rect.right }));
                        }}
                        aria-label="Row actions"
                        className="p-1 rounded hover:bg-neutral-100"
                      >
                        <img src={DotsIcon} alt="" className="w-4 h-4 rotate-90" />
                      </button>
                      {menu?.id === r.id && (
                        <>
                          <div className="fixed inset-0 z-[80]" onClick={() => setMenu(null)} />
                          <div style={{ position: "fixed", top: menu.top, right: menu.right }} className="z-[90] w-32 bg-white rounded-lg shadow-lg border border-neutral-200 py-1">
                            <button type="button" onClick={() => { setMenu(null); navigate(`/fleet/hire/${r.id}`); }} className="w-full text-left px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50">
                              View
                            </button>
                            <button type="button" onClick={() => { setMenu(null); setDeleteTarget(r); }} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-neutral-50">
                              Delete
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                ))
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
          title="Delete Skyline Record"
          message={`Are you sure you want to delete ${fallbackReference(deleteTarget)}?`}
          confirmLabel="Delete"
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
      {bulkConfirm && (
        <FleetConfirmModal
          title="Delete Skyline Records"
          message={`Are you sure you want to delete ${selected.size} selected record(s)?`}
          confirmLabel="Delete"
          onConfirm={confirmBulkDelete}
          onCancel={() => setBulkConfirm(false)}
        />
      )}

      {/* Reminders panel (temporary — shown on each visit to the listing). */}
      {showReminders && reminders.length > 0 && (
        <FleetReminderPanel
          reminders={reminders}
          onClose={() => setShowReminders(false)}
        />
      )}
    </div>
  );
};

export default FleetList;
