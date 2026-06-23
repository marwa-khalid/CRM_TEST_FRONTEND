import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Plus, Upload, MoreVertical, ChevronDown, Calendar } from "lucide-react";
import { deleteClaim, downloadCSV, getClaims } from "../../services/Claims/Claims.tsx";
import { ConfirmModal } from "../../components/common/ConfirmModal";
import FileIcon from "../../assets/Dashboard/File.svg";
import Clock from "../../assets/Dashboard/Clock.svg";
import Critical from "../../assets/Dashboard/Critical.svg";
import Urgent from "../../assets/Dashboard/Urgent.svg";
import TrendingUp from "../../assets/Dashboard/TrendingUp.svg";
import TrendingDown from "../../assets/Dashboard/TrendingDown.svg";

interface Claim {
  claim_id: number;
  our_reference: string;
  client_name: string;
  incident_date: string | null;
  actual_category: string;
  handler: string;
  case_status: string;
  priority: string;
}

// ─── helpers ──────────────────────────────────────────────────────────────────

const formatDate = (value?: string | null): string => {
  if (!value) return "—";
  const d = new Date(value);
  if (isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
};

const formatCategory = (label: string): string =>
  (label || "")
    .replace(/>=/g, " ≥ ").replace(/<=/g, " ≤ ").replace(/=>/g, " ≥ ").replace(/=< /g, " ≤ ");

const statusBadge = (status: string): string => {
  const s = (status || "").toLowerCase();
  if (s.includes("approve") || s.includes("accept") || s.includes("complete")) return "bg-green-100 text-green-600";
  if (s.includes("process") || s.includes("tbc") || s.includes("progress")) return "bg-yellow-100 text-amber-600";
  if (s.includes("reject") || s.includes("cancel")) return "bg-neutral-100 text-neutral-600";
  return "bg-red-100 text-red-600"; // pending / default
};

const priorityBadge = (priority: string): string => {
  const p = (priority || "").toLowerCase();
  if (p === "high") return "bg-red-100 text-red-600";
  if (p === "medium") return "bg-yellow-100 text-amber-600";
  if (p === "low") return "bg-green-100 text-green-600";
  return "bg-neutral-100 text-neutral-600";
};

const has = (status: string, ...keys: string[]) => {
  const s = (status || "").toLowerCase();
  return keys.some((k) => s.includes(k));
};

// ─── stat card ────────────────────────────────────────────────────────────────

const StatCard = ({
  Icon, iconBg, value, label, trend, up,
}: { Icon: string; iconBg: string; value: number; label: string; trend: string; up: boolean }) => (
  <div className="flex-1 min-w-[180px] rounded-lg border border-neutral-200 p-4 flex flex-col gap-3 font-['Stack_Sans_Headline']">
    <div className="flex items-start justify-between">
      <span className={`w-9 h-9 rounded ${iconBg} flex items-center justify-center`}>
        <img src={Icon} alt="" className="w-4.5 h-4.5" />
      </span>
      <img src={up ? TrendingUp : TrendingDown} alt="" className="h-6" />
    </div>
    <div>
      <div className="text-black text-3xl font-weight-700 leading-9">{value.toLocaleString()}</div>
      <div className="text-neutral-500 text-sm mt-1">{label}</div>
    </div>
    <div className="border-t border-neutral-100 pt-2 flex items-center gap-2">
      <span className={`px-1.5 py-0.5 rounded text-[11px] font-weight-600 ${up ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"}`}>
        {trend}
      </span>
      <span className="text-neutral-400 text-xs">vs last month</span>
    </div>
  </div>
);

// ─── single-select filter dropdown ──────────────────────────────────────────────

const FilterDropdown = ({
  label, value, options, onChange,
}: { label: string; value: string; options: string[]; onChange: (v: string) => void }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    if (open) document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);
  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 text-blue-600 text-sm font-weight-500"
      >
        {value || label} <ChevronDown size={14} />
      </button>
      {open && (
        <div className="absolute z-30 mt-2 left-0 min-w-[180px] max-h-64 overflow-auto bg-white rounded-lg border border-neutral-200 shadow-lg py-1">
          <button
            type="button"
            onClick={() => { onChange(""); setOpen(false); }}
            className={`w-full text-left px-3 py-2 text-sm hover:bg-neutral-50 ${!value ? "text-blue-600 font-weight-500" : "text-neutral-700"}`}
          >
            All {label}
          </button>
          {options.map((o) => (
            <button
              key={o}
              type="button"
              onClick={() => { onChange(o); setOpen(false); }}
              className={`w-full text-left px-3 py-2 text-sm hover:bg-neutral-50 ${value === o ? "text-blue-600 font-weight-500" : "text-neutral-700"}`}
            >
              {o}
            </button>
          ))}
          {options.length === 0 && <div className="px-3 py-2 text-xs text-neutral-400">No options</div>}
        </div>
      )}
    </div>
  );
};

const PAGE_SIZE = 10;

function Claims() {
  const navigate = useNavigate();
  const tenant_id = localStorage.getItem("tenant_id");

  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [fType, setFType] = useState("");
  const [fStatus, setFStatus] = useState("");
  const [fPriority, setFPriority] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [menuFor, setMenuFor] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Claim | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const fetchClaims = async () => {
    try {
      setLoading(true);
      const response: any = await getClaims(tenant_id);
      const data = Array.isArray(response) ? response : response?.data || response;
      const rows: Claim[] = (data || []).map((c: any) => ({
        claim_id: c.claim_id,
        our_reference: c.our_reference || "N/A",
        client_name: c.client_name || "N/A",
        incident_date: c.incident_date || null,
        actual_category: formatCategory(c.actual_category || "N/A"),
        handler: c.handler || "Unassigned",
        case_status: c.case_status || "N/A",
        priority: c.priority || "N/A",
      }));
      setClaims(rows);
    } catch {
      setClaims([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchClaims(); }, []);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuFor(null); };
    if (menuFor !== null) document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [menuFor]);

  // distinct filter options derived from the data
  const typeOptions = useMemo(() => [...new Set(claims.map((c) => c.actual_category).filter((v) => v && v !== "N/A"))].sort(), [claims]);
  const statusOptions = useMemo(() => [...new Set(claims.map((c) => c.case_status).filter((v) => v && v !== "N/A"))].sort(), [claims]);
  const priorityOptions = useMemo(() => [...new Set(claims.map((c) => c.priority).filter((v) => v && v !== "N/A"))].sort(), [claims]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const fromT = from ? new Date(from + "T00:00:00").getTime() : null;
    const toT = to ? new Date(to + "T23:59:59").getTime() : null;
    return claims.filter((c) => {
      const matchesSearch = !q ||
        c.client_name.toLowerCase().includes(q) ||
        c.our_reference.toLowerCase().includes(q) ||
        c.handler.toLowerCase().includes(q);
      const matchesType = !fType || c.actual_category === fType;
      const matchesStatus = !fStatus || c.case_status === fStatus;
      const matchesPriority = !fPriority || c.priority === fPriority;
      let matchesDate = true;
      if ((fromT || toT) && c.incident_date) {
        const t = new Date(c.incident_date).getTime();
        if (fromT && t < fromT) matchesDate = false;
        if (toT && t > toT) matchesDate = false;
      }
      return matchesSearch && matchesType && matchesStatus && matchesPriority && matchesDate;
    });
  }, [claims, search, fType, fStatus, fPriority, from, to]);

  useEffect(() => { setPage(1); }, [search, fType, fStatus, fPriority, from, to]);

  // attention stat counts (derived from real claims)
  const stats = useMemo(() => ({
    total: claims.length,
    pending: claims.filter((c) => has(c.case_status, "pending")).length,
    processing: claims.filter((c) => has(c.case_status, "process", "tbc", "progress")).length,
    approved: claims.filter((c) => has(c.case_status, "approve", "accept", "complete")).length,
    high: claims.filter((c) => (c.priority || "").toLowerCase() === "high").length,
  }), [claims]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageClaims = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const startIdx = filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const endIdx = Math.min(page * PAGE_SIZE, filtered.length);

  const allOnPageSelected = pageClaims.length > 0 && pageClaims.every((c) => selected.has(c.claim_id));
  const toggleAll = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allOnPageSelected) pageClaims.forEach((c) => next.delete(c.claim_id));
      else pageClaims.forEach((c) => next.add(c.claim_id));
      return next;
    });
  };
  const toggleOne = (id: number) =>
    setSelected((prev) => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });

  const handleExport = async () => {
    try {
      const res: any = await downloadCSV(tenant_id);
      const blob = new Blob([res], { type: "text/csv" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "Claims Report.csv";
      link.click();
    } catch { /* ignore */ }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try { await deleteClaim(deleteTarget.claim_id); await fetchClaims(); } catch { /* ignore */ }
    finally { setDeleteTarget(null); }
  };

  // page-number list with ellipsis
  const pageNumbers = useMemo(() => {
    const out: (number | "...")[] = [];
    const add = (n: number | "...") => out.push(n);
    if (totalPages <= 9) { for (let i = 1; i <= totalPages; i++) add(i); return out; }
    add(1);
    const start = Math.max(2, page - 2), end = Math.min(totalPages - 1, page + 2);
    if (start > 2) add("...");
    for (let i = start; i <= end; i++) add(i);
    if (end < totalPages - 1) add("...");
    add(totalPages);
    return out;
  }, [totalPages, page]);

  const Checkbox = ({ checked, onChange }: { checked: boolean; onChange: () => void }) => (
    <div onClick={(e) => { e.stopPropagation(); onChange(); }} className="cursor-pointer shrink-0 p-0.5" role="checkbox" aria-checked={checked}>
      <div className={`w-5 h-5 rounded ${checked ? "bg-blue-600 border-[6px] border-blue-200" : "bg-neutral-300"}`} />
    </div>
  );

  return (
    <div className="min-h-screen bg-white font-['Stack_Sans_Headline']">
      {/* header */}
      <div className="px-10 py-6 flex items-center justify-between border-b border-neutral-100">
        <h1 className="text-black text-2xl font-weight-600">Claims</h1>
        <div className="flex items-center gap-5 text-neutral-400">
          <Search size={20} />
          <span className="w-px h-5 bg-neutral-200" />
        </div>
      </div>

      <div className="px-10 py-6 flex flex-col gap-6">
        {/* stat cards */}
        <div className="flex gap-4 flex-wrap">
          <StatCard Icon={FileIcon} iconBg="bg-blue-100" value={stats.total} label="Total Claims" trend="+8.2%" up />
          <StatCard Icon={Clock} iconBg="bg-red-100" value={stats.pending} label="Pending" trend="+12.4%" up />
          <StatCard Icon={Clock} iconBg="bg-yellow-100" value={stats.processing} label="Processing" trend="-2.2%" up={false} />
          <StatCard Icon={Critical} iconBg="bg-green-100" value={stats.approved} label="Approved" trend="-2.2%" up={false} />
          <StatCard Icon={Urgent} iconBg="bg-red-100" value={stats.high} label="High Priority" trend="-2.2%" up={false} />
        </div>

        {/* search + actions */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="relative flex-1 min-w-[260px] max-w-xl">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-300" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Claim number / Client / Assigned to"
              className="w-full pl-11 pr-4 py-3.5 bg-white rounded-lg border border-neutral-200 text-sm text-neutral-700 placeholder:text-neutral-300 focus:outline-blue-500"
            />
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate("/new-claim")}
              className="flex items-center gap-2 px-6 py-3.5 bg-blue-600 rounded text-white text-sm font-weight-500 hover:bg-blue-700"
            >
              <Plus size={16} /> Add Claim
            </button>
            <button
              type="button"
              onClick={handleExport}
              className="flex items-center gap-2 px-6 py-3.5 bg-white rounded border border-blue-500 text-blue-600 text-sm font-weight-500 hover:bg-blue-50"
            >
              <Upload size={16} /> Export
            </button>
          </div>
        </div>

        {/* filters */}
        <div className="flex items-center gap-8 flex-wrap">
          <FilterDropdown label="Claim Type" value={fType} options={typeOptions} onChange={setFType} />
          <FilterDropdown label="Status" value={fStatus} options={statusOptions} onChange={setFStatus} />
          <FilterDropdown label="Priority" value={fPriority} options={priorityOptions} onChange={setFPriority} />
          <div className="flex items-center gap-3 ml-auto">
            <span className="text-neutral-700 text-sm">Date Range</span>
            <div className="relative">
              <input type="date" value={from} onChange={(e) => setFrom(e.target.value)}
                className="w-36 h-11 pl-3 pr-2 bg-white rounded border border-neutral-200 text-sm text-neutral-700 focus:outline-blue-500" />
              {!from && <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-300 text-sm">From</span>}
            </div>
            <div className="relative">
              <input type="date" value={to} onChange={(e) => setTo(e.target.value)}
                className="w-36 h-11 pl-3 pr-2 bg-white rounded border border-neutral-200 text-sm text-neutral-700 focus:outline-blue-500" />
              {!to && <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-300 text-sm">To</span>}
            </div>
          </div>
        </div>

        {/* table */}
        <div className="rounded-lg border border-neutral-100 overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-neutral-100 text-neutral-500 text-xs uppercase">
                <th className="px-4 py-3 w-12"><Checkbox checked={allOnPageSelected} onChange={toggleAll} /></th>
                <th className="px-4 py-3 font-weight-600">Client</th>
                <th className="px-4 py-3 font-weight-600">Claim No.</th>
                <th className="px-4 py-3 font-weight-600">Type</th>
                <th className="px-4 py-3 font-weight-600">Incident Date</th>
                <th className="px-4 py-3 font-weight-600">Assigned To</th>
                <th className="px-4 py-3 font-weight-600">Status</th>
                <th className="px-4 py-3 font-weight-600">Priority</th>
                <th className="px-4 py-3 w-10" />
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={9} className="px-4 py-10 text-center text-neutral-400 text-xl">Loading claims…</td></tr>
              )}
              {!loading && pageClaims.length === 0 && (
                <tr><td colSpan={9} className="px-4 py-10 text-center text-neutral-400 text-xl">No claims found.</td></tr>
              )}
              {!loading && pageClaims.map((c) => (
                <tr
                  key={c.claim_id}
                  onClick={() => navigate(`/claim/${c.claim_id}`)}
                  className="border-b border-neutral-50 last:border-0 hover:bg-neutral-50 cursor-pointer"
                >
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <Checkbox checked={selected.has(c.claim_id)} onChange={() => toggleOne(c.claim_id)} />
                  </td>
                  <td className="px-4 py-3 text-neutral-800 text-sm font-weight-500">{c.client_name}</td>
                  <td className="px-4 py-3 text-neutral-700 text-sm">{c.our_reference}</td>
                  <td className="px-4 py-3 text-neutral-700 text-sm">{c.actual_category}</td>
                  <td className="px-4 py-3 text-neutral-700 text-sm">{formatDate(c.incident_date)}</td>
                  <td className="px-4 py-3 text-neutral-700 text-sm">{c.handler}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-[10px] font-weight-600 uppercase ${statusBadge(c.case_status)}`}>
                      {c.case_status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-[10px] font-weight-600 uppercase ${priorityBadge(c.priority)}`}>
                      {c.priority}
                    </span>
                  </td>
                  <td className="px-4 py-3 relative" onClick={(e) => e.stopPropagation()}>
                    <button type="button" onClick={() => setMenuFor(menuFor === c.claim_id ? null : c.claim_id)} className="text-neutral-400 hover:text-neutral-700">
                      <MoreVertical size={16} />
                    </button>
                    {menuFor === c.claim_id && (
                      <div ref={menuRef} className="absolute right-4 top-10 z-20 min-w-[150px] bg-white rounded-lg border border-neutral-200 shadow-lg py-1">
                        <button type="button" onClick={() => { setMenuFor(null); navigate(`/claim/${c.claim_id}`); }}
                          className="w-full text-left px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50">View / Edit</button>
                        <button type="button" onClick={() => { setMenuFor(null); setDeleteTarget(c); }}
                          className="w-full text-left px-3 py-2 text-sm text-red-500 hover:bg-red-50">Delete</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* pagination */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="text-neutral-500 text-sm">
            Showing <span className="font-weight-600 text-neutral-700">{startIdx}</span> to{" "}
            <span className="font-weight-600 text-neutral-700">{endIdx}</span> of{" "}
            <span className="font-weight-600 text-neutral-700">{filtered.length}</span> Entries
          </div>
          <div className="flex items-center gap-1">
            <button type="button" disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1.5 text-sm text-neutral-600 disabled:text-neutral-300 hover:text-blue-600">Previous</button>
            {pageNumbers.map((n, i) =>
              n === "..." ? (
                <span key={`e${i}`} className="px-2 text-neutral-400">…</span>
              ) : (
                <button key={n} type="button" onClick={() => setPage(n)}
                  className={`w-8 h-8 rounded text-sm ${page === n ? "bg-blue-100 text-blue-600 font-weight-600" : "text-neutral-600 hover:bg-neutral-50"}`}>
                  {n}
                </button>
              ),
            )}
            <button type="button" disabled={page === totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="px-3 py-1.5 text-sm text-blue-600 disabled:text-neutral-300 hover:text-blue-700">Next</button>
          </div>
        </div>
      </div>

      {deleteTarget && (
        <ConfirmModal
          title="Delete Claim"
          message={`Are you sure you want to delete claim ${deleteTarget.our_reference}?`}
          confirmLabel="Delete"
          onCancel={() => setDeleteTarget(null)}
          onConfirm={confirmDelete}
        />
      )}
    </div>
  );
}

export default Claims;
