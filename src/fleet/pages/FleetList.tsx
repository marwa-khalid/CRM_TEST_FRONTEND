import React, { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Loader2, Plus, RefreshCw, Search, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { listHires, deleteHire, type HireRecord } from "../services/hireService";
import { CURRENT_POSITION_OPTIONS } from "../types/hire";
import FleetConfirmModal from "../components/FleetConfirmModal";

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

const fallbackReference = (hire: HireRecord) => {
  const d = hire.file_opened_at ? new Date(hire.file_opened_at) : new Date();
  const yearMonth = Number.isNaN(d.getTime())
    ? new Date().toISOString().slice(0, 7).replace("-", "")
    : `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}`;
  return `FLT-${yearMonth}-${String(hire.id).padStart(3, "0")}`;
};

const positionLabel = (value?: string) =>
  CURRENT_POSITION_OPTIONS.find((option) => option.value === value)?.label || value || "Draft";

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

  const visibleRecords = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return records;
    return records.filter((record) =>
      [
        record.fleet_reference || fallbackReference(record),
        positionLabel(record.current_position),
        record.rental_advisor,
        record.insurance_type,
        record.bank_name,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(needle),
    );
  }, [records, query]);

  return (
    <div className="min-h-screen bg-white font-sans-headline">
      <div className="w-full px-10 py-5 bg-white shadow-[0px_4px_20px_0px_rgba(0,0,0,0.08)] flex justify-between items-center sticky top-0 z-20">
        <div className="flex items-center gap-5">
          <button
            type="button"
            onClick={() => navigate("/single-signon")}
            aria-label="Back"
            className="w-9 h-9 rounded-sm flex items-center justify-center hover:bg-neutral-100"
          >
            <ArrowLeft size={22} />
          </button>
          <div>
            <h1 className="text-black text-2xl font-semibold leading-6">Fleet Records</h1>
            <p className="mt-1 text-neutral-500 text-sm">Test listing for Fleet client-side records</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => navigate("/fleet/hire/new")}
          className="px-6 py-4 bg-neutral-900 rounded-sm text-white text-base font-medium leading-4 hover:bg-black transition-colors inline-flex items-center gap-2"
        >
          <Plus size={18} />
          New Fleet Record
        </button>
      </div>

      <main className="px-10 py-10">
        <section className="max-w-[1120px] mx-auto flex flex-col gap-5">
          <div className="flex items-center justify-between gap-4">
            <div className="h-12 flex-1 max-w-[420px] px-4 border border-neutral-200 rounded-sm flex items-center gap-3">
              <Search size={18} className="text-neutral-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by reference, advisor or status"
                className="w-full outline-none text-sm text-neutral-900 placeholder:text-neutral-400"
              />
            </div>
            <button
              type="button"
              onClick={load}
              className="h-12 px-4 border border-neutral-200 rounded-sm text-sm font-medium text-neutral-900 inline-flex items-center gap-2 hover:bg-neutral-50"
            >
              <RefreshCw size={16} />
              Refresh
            </button>
          </div>

          <div className="border border-neutral-100 rounded-lg overflow-hidden">
            <div className="grid grid-cols-[1.2fr_1fr_1fr_1fr_100px] gap-4 bg-neutral-50 px-5 py-3 text-xs font-semibold text-neutral-500 uppercase">
              <span>Reference</span>
              <span>Opened</span>
              <span>Current Position</span>
              <span>Rental Advisor</span>
              <span className="text-right">Action</span>
            </div>

            {loading ? (
              <div className="h-48 flex items-center justify-center text-neutral-500 text-sm gap-2">
                <Loader2 size={18} className="animate-spin" />
                Loading fleet records...
              </div>
            ) : visibleRecords.length === 0 ? (
              <div className="h-48 flex flex-col items-center justify-center text-center">
                <p className="text-neutral-900 text-base font-semibold">No fleet records yet</p>
                <p className="mt-2 text-neutral-500 text-sm">Create one and it will appear here as FLT-YYYYMM-ID (then SURNAME-YYYYMM-ID once the driver name is added).</p>
              </div>
            ) : (
              visibleRecords.map((record) => {
                const reference = record.fleet_reference || fallbackReference(record);
                return (
                  <div
                    key={record.id}
                    className="w-full grid grid-cols-[1.2fr_1fr_1fr_1fr_100px] gap-4 px-5 py-4 text-left border-t border-neutral-100 hover:bg-neutral-50 transition-colors items-center"
                  >
                    <button
                      type="button"
                      onClick={() => navigate(`/fleet/hire/${record.id}`)}
                      className="text-left text-neutral-900 text-sm font-semibold hover:underline"
                    >
                      {reference}
                    </button>
                    <span className="text-neutral-700 text-sm">{formatDateTime(record.file_opened_at)}</span>
                    <span className="text-neutral-700 text-sm">{positionLabel(record.current_position)}</span>
                    <span className="text-neutral-700 text-sm">{record.rental_advisor || "-"}</span>
                    <span className="text-right flex justify-end items-center gap-3">
                      <button
                        type="button"
                        onClick={() => navigate(`/fleet/hire/${record.id}`)}
                        className="text-blue-600 text-sm font-medium hover:underline"
                      >
                        Open
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(record)}
                        className="text-red-600 hover:text-red-700"
                        title="Delete"
                        aria-label="Delete record"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </main>

      {deleteTarget && (
        <FleetConfirmModal
          title="Delete Fleet Record"
          message={`Are you sure you want to delete ${deleteTarget.fleet_reference || fallbackReference(deleteTarget)}? This cannot be undone.`}
          confirmLabel="Delete"
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
};

export default FleetList;
