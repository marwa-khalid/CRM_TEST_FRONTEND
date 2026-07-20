import React, { useEffect, useMemo, useState } from "react";
import { Car, CircleCheck, Eye, Files, Loader2, Plus, RefreshCw, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { listHires, deleteHire, type HireRecord } from "../services/hireService";
import FleetConfirmModal from "../components/FleetConfirmModal";
import { fleetReference } from "../utils/reference";
import TrashIcon from '../assets/icons/Remove.svg'
const formatDateTime = (value?: string) => {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const fallbackReference = (hire: HireRecord) => fleetReference(hire);

const hireStatusLabel = (value?: string) =>
  value === "on_hire" ? "On Hire" : value === "off_hire" ? "Off Hire" : "-";
const hireStatusClass = (value?: string) =>
  value === "on_hire" ? "text-green-600" : value === "off_hire" ? "text-blue-600" : "text-neutral-400";

// Reference · Driver · Contact · Email · Vehicle Reg · Status · Opened · Action
const LIST_GRID = "grid-cols-[minmax(140px,1.05fr)_minmax(120px,0.95fr)_minmax(115px,0.85fr)_minmax(170px,1.3fr)_minmax(100px,0.75fr)_minmax(85px,0.65fr)_minmax(120px,0.9fr)_76px]";

// Mobile is the primary contact; fall back to the landline.
const driverContact = (hire: HireRecord) => hire.driver_mobile || hire.driver_telephone || "";

type StatIcon = React.ComponentType<{ size?: number; className?: string }>;

// Fleet-themed summary widget (neutral palette to match the Fleet side).
const FleetStatCard: React.FC<{ title: string; value: number; Icon: StatIcon; accent: string }> = ({
  title,
  value,
  Icon,
  accent,
}) => (
  <div className="p-4 rounded-lg outline outline-1 -outline-offset-1 outline-neutral-200 bg-white flex flex-col gap-3">
    <span className={`w-9 h-9 rounded flex items-center justify-center ${accent}`}>
      <Icon size={18} />
    </span>
    <div className="flex flex-col gap-0.5">
      <div className="text-black text-3xl font-semibold leading-9">{value}</div>
      <div className="text-neutral-500 text-sm font-medium">{title}</div>
    </div>
  </div>
);

const FleetList: React.FC = () => {
  const navigate = useNavigate();
  const [records, setRecords] = useState<HireRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  const load = async () => {
    setLoading(true);
    setRecords(await listHires());
    setLoading(false);
  };

  const [deleteTarget, setDeleteTarget] = useState<HireRecord | null>(null);

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const target = deleteTarget;
    setDeleteTarget(null);
    setRecords((rs) => rs.filter((r) => r.id !== target.id)); // optimistic
    const ok = await deleteHire(target.id);
    if (ok) {
      toast.success("Fleet record deleted.");
    } else {
      toast.error("Couldn't delete the record.");
      load(); // revert on failure
    }
  };

  useEffect(() => {
    load();
  }, []);

  // Summary widgets — counts across ALL records (not the search filter). On/Off Hire
  // are driven by each record's last (most recently added) vehicle's hire_status.
  const stats = useMemo(() => {
    const countStatus = (value: string) => records.filter((r) => (r.last_vehicle_hire_status || "") === value).length;
    return [
      { title: "Total Hires", value: records.length, Icon: Files, accent: "bg-neutral-100 text-neutral-700" },
      { title: "On Hires", value: countStatus("on_hire"), Icon: Car, accent: "bg-green-100 text-green-600" },
      { title: "Off Hires", value: countStatus("off_hire"), Icon: CircleCheck, accent: "bg-blue-100 text-blue-600" },
    ];
  }, [records]);

  const visibleRecords = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return records;
    return records.filter((record) =>
      [
        record.fleet_reference || fallbackReference(record),
        record.driver_name,
        driverContact(record),
        record.driver_email,
        record.last_vehicle_registration,
        hireStatusLabel(record.last_vehicle_hire_status),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(needle),
    );
  }, [records, query]);

  return (
    <div className="min-h-screen bg-white font-sans-headline">
      <div className="w-full px-4 sm:px-6 lg:px-10 py-5 bg-white shadow-[0px_4px_20px_0px_rgba(0,0,0,0.08)] lg:sticky lg:top-0 z-20">
        <div className="w-full flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div className="flex items-center gap-5">
            <div>
              <h1 className="text-black text-2xl font-semibold leading-6">Fleet Records</h1>
              <p className="mt-1 text-neutral-500 text-sm">Fleet client-side records</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate("/fleet/hire/new")}
            className="w-full sm:w-auto px-6 py-4 bg-neutral-900 rounded text-white text-base font-medium leading-4 hover:bg-black transition-colors inline-flex items-center justify-center gap-2"
          >
            <Plus size={18} />
            Add New Hire
          </button>
        </div>
      </div>

      <main className="px-4 sm:px-6 lg:px-10 py-6 lg:py-10">
        <section className="w-full flex flex-col gap-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {stats.map((stat) => (
              <FleetStatCard key={stat.title} {...stat} />
            ))}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="h-12 w-full sm:flex-1 sm:max-w-[420px] px-4 border border-neutral-200 rounded flex items-center gap-3">
              <Search size={18} className="text-neutral-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by reference, driver, contact, email or reg"
                className="w-full outline-none text-sm text-neutral-900 placeholder:text-neutral-400"
              />
            </div>
            <button
              type="button"
              onClick={load}
              className="h-12 w-full sm:w-auto px-4 border border-neutral-200 rounded text-sm font-medium text-neutral-900 inline-flex items-center justify-center gap-2 hover:bg-neutral-50"
            >
              <RefreshCw size={16} />
              Refresh
            </button>
          </div>

          <div className="border border-neutral-100 rounded-lg overflow-x-auto">
            <div className="min-w-[980px]">
            <div className={`grid ${LIST_GRID} gap-4 bg-neutral-50 px-5 py-3 text-xs font-semibold text-neutral-500 uppercase`}>
              <span>Reference</span>
              <span>Driver</span>
              <span>Contact</span>
              <span>Email</span>
              <span>Vehicle Reg</span>
              <span>Status</span>
              <span>Opened</span>
              <span >Action</span>
            </div>

            {loading ? (
              <div className="h-48 flex items-center justify-center text-neutral-500 text-sm gap-2 border-t border-neutral-100">
                <Loader2 size={18} className="animate-spin" />
                Loading fleet records...
              </div>
            ) : visibleRecords.length === 0 ? (
              <div className="h-48 flex flex-col items-center justify-center text-center border-t border-neutral-100">
                <p className="text-neutral-900 text-base font-semibold">No fleet records yet</p>
              </div>
            ) : (
              visibleRecords.map((record) => {
                const reference = record.fleet_reference || fallbackReference(record);
                return (
                  <div
                    key={record.id}
                    className={`w-full grid ${LIST_GRID} gap-4 px-5 py-4 text-left border-t border-neutral-100 hover:bg-neutral-50 transition-colors items-center`}
                  >
                    <button
                      type="button"
                      onClick={() => navigate(`/fleet/hire/${record.id}`)}
                      className="text-left text-neutral-900 text-sm font-semibold hover:underline"
                    >
                      {reference}
                    </button>
                    <span className="text-neutral-700 text-sm truncate">{record.driver_name || "-"}</span>
                    <span className="text-neutral-700 text-sm truncate">{driverContact(record) || "-"}</span>
                    <span className="text-neutral-700 text-sm truncate" title={record.driver_email || ""}>
                      {record.driver_email || "-"}
                    </span>
                    <span className="text-neutral-700 text-sm">{record.last_vehicle_registration || "-"}</span>
                    <span className={`text-sm font-medium ${hireStatusClass(record.last_vehicle_hire_status)}`}>
                      {hireStatusLabel(record.last_vehicle_hire_status)}
                    </span>
                    <span className="text-neutral-700 text-sm">{formatDateTime(record.file_opened_at)}</span>
                    <span className="text-start flex justify-start items-center gap-3">
                      <button
                        type="button"
                        onClick={() => navigate(`/fleet/hire/${record.id}`)}
                      >
                    <Eye className="w-4 h-4"/>
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(record)}
                        title="Delete"
                        aria-label="Delete record"
                      >
                        <img src={TrashIcon} alt="" />
                      </button>
                    </span>
                  </div>
                );
              })
            )}
            </div>
          </div>
        </section>
      </main>

      {deleteTarget && (
        <FleetConfirmModal
          title="Delete Fleet Record"
          message={`Are you sure you want to delete ${deleteTarget.fleet_reference || fallbackReference(deleteTarget)}?`}
          confirmLabel="Delete"
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
};

export default FleetList;
