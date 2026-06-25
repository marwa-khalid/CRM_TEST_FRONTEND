import React, { useEffect, useLayoutEffect, useMemo, useRef, useState, lazy, Suspense } from "react";
import { SpinnerLoader } from "../../components/common/SpinnerLoader";

// Lazy-loaded views — code-split so switching between Claims / Dashboard / Tasks
// / Calendar / Settings shows a loader while the view's chunk loads.
const AccountSettingsContent = lazy(() => import("./AccountSettings"));
import {
  LayoutDashboard,
  FileText,
  Briefcase,
  Calendar,
  CheckSquare,
  BarChart3,
  Settings,
  HelpCircle,
  Search,
  MoreVertical,
  Upload,
  ChevronDown,
  X,
  Trash2,
} from "lucide-react";
import { toast } from "react-toastify";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import Logo from "../../assets/AutoClaim_icon/logo.svg";
import logout from "../../assets/AutoClaim_icon/logout.svg";
import Vector4 from "../../assets/AutoClaim_icon/Vector-4.svg";
import FileIcon from '../../assets/case_activity/file.svg'
import StatFile from "../../assets/Dashboard/File.svg";
import Pending from "../../assets/TaskManagement/Pending.svg";
import Processing from "../../assets/TaskManagement/InProgress.svg";
import Complete from "../../assets/TaskManagement/Complete.svg";

import StatClock from "../../assets/Dashboard/Clock.svg";
import StatCritical from "../../assets/Dashboard/Critical.svg";
import StatUrgent from "../../assets/Dashboard/Urgent.svg";
import TrendingUp from "../../assets/Dashboard/TrendingUp.svg";
import TrendingDown from "../../assets/Dashboard/TrendingDown.svg";

import { Link, useNavigate } from "react-router-dom";
import { getClaims, deleteClaim, updateClaimStatus } from "../../services/Claims/Claims";
import { getCaseStatuses } from "../../services/Lookups/Generaldetails";
import { ConfirmModal } from "../../components/common/ConfirmModal";
import NotificationBell from "../../components/Notifications/NotificationBell";
import { CustomDatePicker } from "../Claims/Components/DatePicker";
import { useCurrentUser } from "../../context/AuthContext";
import type { TaskFilters } from "../../services/Tasks/Tasks";

const Tasks = lazy(() => import("../TaskManagement/Tasks"));
const TasksDashboard = lazy(() => import("../TaskManagement/TasksDashboard"));
const TasksCalendar = lazy(() => import("../CalendarExamples/TeamsCalendarExample"));

type ActivePage = "claims" | "settings" | "tasks" | "dashboard" | "calendar";

const CASE_ACTIVITY_ROUTE = "/case-activity";
const DOCUMENT_LIBRARY_ROUTE = "/document-library";

const Dashboard: React.FC = () => {
  const { user: authUser } = useCurrentUser();
  const navigate = useNavigate();

  const [activePage, setActivePage] = useState<ActivePage>("dashboard");
  const [taskFilter, setTaskFilter] = useState<TaskFilters | undefined>(undefined);
  const [claims, setClaims] = useState<any[]>([]);
  const [claimsLoading, setClaimsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [multi, setMulti] = useState<{ type: string[]; status: string[] }>({
    type: [], status: [],
  });
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 10;

  // selection / bulk actions
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [bulkMenu, setBulkMenu] = useState<null | "status">(null);
  const [bulkConfirm, setBulkConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [rowMenu, setRowMenu] = useState<number | null>(null);
  const [exportMenu, setExportMenu] = useState(false);
  const [caseStatuses, setCaseStatuses] = useState<{ id: number; label: string }[]>([]);
  const bulkMenuRef = useRef<HTMLDivElement>(null);
  const rowMenuRef = useRef<HTMLDivElement>(null);
  const exportRef = useRef<HTMLDivElement>(null);

  // close menus on outside click
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (bulkMenuRef.current && !bulkMenuRef.current.contains(e.target as Node)) setBulkMenu(null);
      if (rowMenuRef.current && !rowMenuRef.current.contains(e.target as Node)) setRowMenu(null);
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) setExportMenu(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  useEffect(() => {
    getCaseStatuses()
      .then((r: any) => setCaseStatuses(Array.isArray(r?.data) ? r.data : []))
      .catch(() => setCaseStatuses([]));
  }, []);

  const sidebarItems = [
    { name: "Dashboard", icon: LayoutDashboard },
    { name: "Claims", icon: FileText },
    { name: "Cases", icon: Briefcase },
    { name: "Tasks", icon: CheckSquare },
    { name: "Calendar", icon: Calendar },
    { name: "Reports", icon: BarChart3 },
  ];

  const fallbackClaims = [
    {
      client: "Olivia Rhye",
      claimNo: "ACC-2024-001",
      type: "Vehicle damage",
      date: "Jan 13, 2025",
      assigned: "John Smith",
      status: "PENDING",
      priority: "HIGH",
    },
    {
      client: "Olivia Rhye",
      claimNo: "ACC-2024-001",
      type: "Vehicle damage",
      date: "Jan 13, 2025",
      assigned: "John Smith",
      status: "PENDING",
      priority: "HIGH",
    },
    {
      client: "Liam Johnson",
      claimNo: "ACC-2024-002",
      type: "Property damage",
      date: "Jan 15, 2025",
      assigned: "Emily Davis",
      status: "APPROVED",
      priority: "HIGH",
    },
    {
      client: "Sophia Lee",
      claimNo: "ACC-2024-003",
      type: "Injury claim",
      date: "Jan 20, 2025",
      assigned: "Michael Brown",
      status: "PROCESSING",
      priority: "HIGH",
    },
  ];

  useEffect(() => {
    const fetchClaims = async () => {
      try {
        const res = await getClaims();

        if (Array.isArray(res)) {
          setClaims(res);
          return;
        }

        if (Array.isArray(res?.data)) {
          setClaims(res.data);
          return;
        }

        if (Array.isArray(res?.items)) {
          setClaims(res.items);
          return;
        }

        setClaims([]);
      } catch (error) {
        console.error("Failed to fetch claims:", error);
        setClaims([]);
      } finally {
        setClaimsLoading(false);
      }
    };

    fetchClaims();
  }, []);

  const normalizeClaim = (claim: any) => {
    return {
      ...claim,
      client: claim.client_name || "—",
      claimNo: claim.our_reference || claim.claim_no || claim.claim_number || "—",
      // Claim Type comes from the General Details "Claim Type" dropdown, NOT the
      // hire-provided vehicle category (actual_category).
      type: claim.claim_type || claim.claim_type_name || "—",
      incidentRaw: claim.incident_date || claim.accident_date || claim.date || null,
      date: formatDate(claim.incident_date || claim.accident_date || claim.date),
      assigned: claim.handler || claim.assigned_to || claim.handler_name || "—",
      status: claim.case_status || claim.status || "—",
      reason: claim.rejection_reason || claim.reason || "",
    };
  };

  const tableRows = useMemo(() => {
    return claims.map((claim) => normalizeClaim(claim));
  }, [claims]);

  // distinct filter options from the data
  const typeOptions = useMemo(
    () => [...new Set(tableRows.map((r) => r.type).filter((v) => v && v !== "—"))].sort(),
    [tableRows],
  );
  // Status filter shows every configured case status (not just those present in
  // the current rows); falls back to the data-derived set until the list loads.
  const statusOptions = useMemo(() => {
    const all = caseStatuses.map((cs) => cs.label).filter(Boolean);
    if (all.length) return all;
    return [...new Set(tableRows.map((r) => r.status).filter((v) => v && v !== "—"))].sort();
  }, [caseStatuses, tableRows]);
  const filteredRows = useMemo(() => {
    const query = searchQuery.toLowerCase();
    const fromT = fromDate ? new Date(fromDate + "T00:00:00").getTime() : null;
    const toT = toDate ? new Date(toDate + "T23:59:59").getTime() : null;

    return tableRows.filter((claim) => {
      const matchesSearch =
        !query ||
        [claim.client, claim.claimNo, claim.type, claim.assigned, claim.status]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(query));
      const matchesType = multi.type.length === 0 || multi.type.includes(claim.type);
      const matchesStatus = multi.status.length === 0 || multi.status.includes(claim.status);
      let matchesDate = true;
      if ((fromT || toT) && claim.incidentRaw) {
        const t = new Date(claim.incidentRaw).getTime();
        if (fromT && t < fromT) matchesDate = false;
        if (toT && t > toT) matchesDate = false;
      }
      return matchesSearch && matchesType && matchesStatus && matchesDate;
    });
  }, [tableRows, searchQuery, multi, fromDate, toDate]);

  useEffect(() => { setCurrentPage(1); }, [multi, fromDate, toDate, searchQuery]);

  // ── filter helpers (multi-select pills) ────────────────────────────────────
  const toggleFilter = (key: "type" | "status", value: string) =>
    setMulti((m) => ({
      ...m,
      [key]: m[key].includes(value) ? m[key].filter((v) => v !== value) : [...m[key], value],
    }));
  const clearFilter = (key: "type" | "status") =>
    setMulti((m) => ({ ...m, [key]: [] }));
  const clearAllFilters = () => setMulti({ type: [], status: [] });
  const activePills = (["type", "status"] as const).flatMap((k) =>
    multi[k].map((value) => ({ key: k, value })),
  );

  // ── selection / bulk actions ───────────────────────────────────────────────
  const pageRows = filteredRows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const allOnPageSelected = pageRows.length > 0 && pageRows.every((r) => r.claim_id && selected.has(r.claim_id));
  const toggleAll = () =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (allOnPageSelected) pageRows.forEach((r) => r.claim_id && next.delete(r.claim_id));
      else pageRows.forEach((r) => r.claim_id && next.add(r.claim_id));
      return next;
    });
  const toggleOne = (id: number) =>
    setSelected((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const refetchClaims = async () => {
    try {
      const res: any = await getClaims();
      const data = Array.isArray(res) ? res : res?.data || res?.items || [];
      setClaims(Array.isArray(data) ? data : []);
    } catch { /* ignore */ }
  };

  const confirmBulkDelete = async () => {
    try {
      const results = await Promise.allSettled([...selected].map((id) => deleteClaim(id)));
      const ok = results.filter((r) => r.status === "fulfilled").length;
      const failed = results.length - ok;
      if (ok) toast.success(`${ok} claim(s) deleted`);
      if (failed) {
        const rej = results.find((r) => r.status === "rejected") as any;
        // Surfaces the payment-pack block reason (409) when present.
        toast.error(rej?.reason?.response?.data?.detail || `${failed} claim(s) could not be deleted`);
      }
      setSelected(new Set());
      await refetchClaims();
    } catch { toast.error("Failed to delete some claims"); }
    finally { setBulkConfirm(false); }
  };
  const bulkSetStatus = async (statusId: number, label: string) => {
    setBulkMenu(null);
    try {
      await Promise.all([...selected].map((id) => updateClaimStatus(id, statusId)));
      toast.success(`Status changed to ${label}`);
      setSelected(new Set());
      await refetchClaims();
    } catch { toast.error("Failed to update some claims"); }
  };
  const confirmDeleteOne = async () => {
    if (!deleteTarget?.claim_id) { setDeleteTarget(null); return; }
    try { await deleteClaim(deleteTarget.claim_id); toast.success("Claim deleted"); await refetchClaims(); }
    catch (e: any) {
      // 409 = blocked because the payment pack has been generated.
      toast.error(e?.response?.data?.detail || "Failed to delete claim");
    }
    finally { setDeleteTarget(null); }
  };

  // ── export (Excel / PDF) ────────────────────────────────────────────────────
  const EXPORT_COLS = ["Client", "Claim No.", "Type", "Incident Date", "Assigned To", "Reason", "Status"];
  const exportRowsData = () =>
    filteredRows.map((r) => [r.client, r.claimNo, r.type, r.date, r.assigned, r.reason || "", r.status]);
  const exportExcel = () => {
    setExportMenu(false);
    const ws = XLSX.utils.aoa_to_sheet([EXPORT_COLS, ...exportRowsData()]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Claims");
    XLSX.writeFile(wb, "Claims.xlsx");
  };
  const exportPdf = () => {
    setExportMenu(false);
    const doc = new jsPDF({ orientation: "landscape" });
    doc.text("Claims", 14, 14);
    autoTable(doc, {
      head: [EXPORT_COLS],
      body: exportRowsData(),
      startY: 20,
      styles: { fontSize: 8 },
      // Header uses the app's blue-100 (#d9ebff) with dark text, matching the theme.
      headStyles: { fillColor: [217, 235, 255], textColor: [23, 23, 23] },
    });
    doc.save("Claims.pdf");
  };

  // figma stat cards — real counts derived from the claims
  const has = (v: string, ...keys: string[]) => keys.some((k) => (v || "").toLowerCase().includes(k));
  const totalClaims = claims.length;
  const pendingCount = tableRows.filter((c) => has(c.status, "pending")).length;
  const processingCount = tableRows.filter((c) => has(c.status, "process", "tbc", "progress")).length;
  const approvedCount = tableRows.filter((c) => has(c.status, "approve", "accept", "complete")).length;

  const stats = [
    {
      title: "Total Claims",
      value: totalClaims,
      icon: StatFile,
      iconBg: "bg-blue-100",
      trend: "+8.2%",
      up: true,
    },
    {
      title: "Pending",
      value: pendingCount,
      icon: Pending,
      iconBg: "bg-red-100",
      trend: "+12.4%",
      up: true,
    },
    {
      title: "Processing",
      value: processingCount,
      icon: Processing,
      iconBg: "bg-yellow-100",
      trend: "-2.2%",
      up: false,
    },
    {
      title: "Approved",
      value: approvedCount,
      icon: Complete,
      iconBg: "bg-green-100",
      trend: "-2.2%",
      up: false,
    },
  ];

  const handleSidebarClick = (name: string) => {
    if (name === "Claims") {
      setActivePage("claims");
    } else if (name === "Tasks") {
      setActivePage("tasks");
    } else if (name === "Dashboard") {
      setActivePage("dashboard");
    } else if (name === "Calendar") {
      setActivePage("calendar");
    }
  };

  // Open the Tasks screen pre-filtered (used by the Dashboard task columns)
  const goToTasks = (filter?: TaskFilters) => {
    setTaskFilter(filter);
    setActivePage("tasks");
  };

  return (
    <div className="flex min-h-screen bg-white font-['Stack_Sans_Headline']">
      <aside className="w-60 border-r border-neutral-100 flex flex-col shrink-0 bg-white">
        <div className="h-16 px-5 py-6 flex justify-between items-center border-b border-neutral-100">
          <img src={Logo} alt="Logo" className="w-8 h-8 object-contain" />
          <img src={logout} alt="" />
        </div>

        <nav className="flex-1 py-6">
          {sidebarItems.map((item) => {
            const isSelected =
              (item.name === "Claims" && activePage === "claims") ||
              (item.name === "Tasks" && activePage === "tasks") ||
              (item.name === "Dashboard" && activePage === "dashboard") ||
              (item.name === "Calendar" && activePage === "calendar");

            return (
              <button
                key={item.name}
                type="button"
                onClick={() => handleSidebarClick(item.name)}
                className={`w-full px-5 py-3 flex items-center gap-3 text-sm transition-colors ${
                  isSelected
                    ? "bg-blue-100 border-l-4 border-blue-300 text-blue-700"
                    : "border-l-4 border-transparent text-neutral-700 hover:bg-neutral-50"
                }`}
              >
                <item.icon size={20} />
                <span className="font-weight-400">{item.name}</span>
              </button>
            );
          })}

          <div className="px-4 pt-4 pb-1">
            <span className="text-neutral-500 text-xs font-weight-600">
              PLATFORM
            </span>
          </div>

          <button
            type="button"
            onClick={() => setActivePage("settings")}
            className={`w-full px-5 py-3 flex items-center gap-3 text-sm transition-colors ${
              activePage === "settings"
                ? "bg-blue-100 border-l-4 border-blue-300 text-blue-700"
                : "border-l-4 border-transparent text-neutral-700 hover:bg-neutral-50"
            }`}
          >
            <Settings size={20} />
            <span className="font-weight-400">Settings</span>
          </button>

          <button
            type="button"
            className="w-full px-5 py-3 flex items-center gap-3 text-sm border-l-4 border-transparent text-neutral-700 hover:bg-neutral-50"
          >
            <HelpCircle size={20} />
            <span className="font-weight-400">Help</span>
          </button>
        </nav>

        <div className="border-t border-neutral-100 p-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-weight-600">
              {(authUser?.name || "?").charAt(0).toUpperCase()}
            </div>
            <span className="text-black text-base font-weight-500">
              {authUser?.name || "User"}
            </span>
          </div>
          <div className="text-neutral-300 text-sm">↕</div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        {activePage === "claims" && (
          <>
            {/* Keep the loader up until claims are fetched so the table doesn't
                show empty and then pop in a second later. */}
            {claimsLoading && <SpinnerLoader />}
            <div className="h-20 px-10 py-4 border-b border-neutral-100 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <h1 className="text-neutral-900 text-2xl font-weight-600 leading-6">
                  Claims
                </h1>

                <div
                  className="ActivityLogContainer flex justify-start items-center gap-1 cursor-pointer group"
                  onClick={() => navigate("/case-activity?scope=all")}
                >
                  <img src={Vector4} alt="" />
                  <div className="ActivityLogText text-blue-300 text-xs font-weight-600 font-['Stack_Sans_Headline'] group-hover:underline">
                    View Activity Log
                  </div>
                </div>
                <div
                  className="ActivityLogContainer flex justify-start items-center gap-1 cursor-pointer group"
                  onClick={() => navigate("/document-library?scope=all")}
                >
                  <img src={FileIcon} alt="" />
                  <div className="ActivityLogText text-blue-300 text-xs font-weight-600 font-['Stack_Sans_Headline'] group-hover:underline">
                    Documents Library
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-6 text-neutral-500">
                <Search size={20} />
                <NotificationBell onOpenTask={() => goToTasks()} />
              </div>
            </div>

            <section className="px-10 py-6 flex-1 overflow-auto">
              <div className="grid grid-cols-5 gap-4 mb-10">
                {stats.map((stat) => (
                  <StatCard key={stat.title} {...stat} />
                ))}
              </div>

              <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center">
                  <div className="w-[491px] px-5 py-4 bg-white rounded outline outline-1 outline-offset-[-1px] outline-neutral-200 flex items-center">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                      placeholder="Claim number / Client / Assigned to"
                      className="w-full outline-none text-base font-light text-neutral-700 placeholder:text-neutral-300"
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => { setSelectMode((s) => !s); setSelected(new Set()); }}
                      className={`text-sm font-weight-500 ${selectMode ? "text-blue-600" : "text-neutral-600 hover:text-blue-600"}`}
                    >
                      {selectMode ? "Cancel" : "Select"}
                    </button>

                    <button
                      type="button"
                      onClick={() => navigate("/add-claim")}
                      className="px-10 py-4 bg-blue-500 rounded flex justify-center items-center gap-2.5 text-white text-base font-weight-500 leading-4 hover:bg-blue-600 transition"
                    >
                      Add Claim
                    </button>

                    <div className="relative" ref={exportRef}>
                      <button
                        type="button"
                        onClick={() => setExportMenu((o) => !o)}
                        className="px-6 py-4 bg-white rounded outline outline-1 outline-offset-[-1px] outline-blue-500 flex justify-center items-center gap-2.5 text-blue-500 text-base font-weight-500 leading-4 hover:bg-blue-50 transition"
                      >
                        <Upload size={16} />
                        Export
                        <ChevronDown size={16} />
                      </button>
                      {exportMenu && (
                        <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-lg outline outline-1 outline-neutral-200 shadow-lg py-1 z-30">
                          <button type="button" onClick={exportExcel} className="w-full text-left px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50">
                            Export as Excel
                          </button>
                          <button type="button" onClick={exportPdf} className="w-full text-left px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50">
                            Export as PDF
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-6 flex-wrap">
                  <div className="flex items-center gap-6">
                    <MultiFilterDropdown label="Claim Type" options={typeOptions} selected={multi.type} onToggle={(v) => toggleFilter("type", v)} onClear={() => clearFilter("type")} />
                    <MultiFilterDropdown label="Status" options={statusOptions} selected={multi.status} onToggle={(v) => toggleFilter("status", v)} onClear={() => clearFilter("status")} />
                  </div>

                  <div className="ml-auto flex flex-col items-end gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-neutral-700 text-sm font-weight-400">Date Range</span>
                      <DatePickerField value={fromDate} onChange={setFromDate} placeholder="From" />
                      <DatePickerField value={toDate} onChange={setToDate} placeholder="To" />
                    </div>
                    {(fromDate || toDate) && (
                      <button
                        type="button"
                        onClick={() => { setFromDate(""); setToDate(""); }}
                        className="flex items-center gap-1.5 h-6 px-3.5 rounded bg-blue-100 text-blue-500 text-xs font-weight-500"
                      >
                        <X size={14} /> Clear Date Filter
                      </button>
                    )}
                  </div>
                </div>

                {/* active filter pills */}
                {activePills.length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap">
                    {activePills.map(({ key, value }) => (
                      <span key={`${key}-${value}`} className="flex items-center gap-2 pl-3 pr-2 py-1.5 bg-white rounded-full border border-neutral-200 text-sm text-neutral-700">
                        {value}
                        <button type="button" onClick={() => toggleFilter(key, value)} className="text-neutral-400 hover:text-neutral-700">
                          <X size={14} />
                        </button>
                      </span>
                    ))}
                    <button type="button" onClick={clearAllFilters} className="text-blue-500 text-sm font-weight-500 hover:underline ml-1">
                      Clear all
                    </button>
                  </div>
                )}

                {/* bulk action bar */}
                {selected.size > 0 && (
                  <div className="flex items-center justify-between px-4 py-3 bg-blue-100 text-blue-500 rounded">
                    <span className="text-sm">{selected.size} Selected</span>
                    <div ref={bulkMenuRef} className="flex items-center gap-6 text-sm">
                      <button type="button" onClick={() => setBulkConfirm(true)} className="flex items-center gap-1.5 hover:text-red-600">
                        <Trash2 size={15} /> Delete
                      </button>
                      <div className="relative">
                        <button type="button" onClick={() => setBulkMenu((m) => (m === "status" ? null : "status"))} className="flex items-center gap-1.5">
                          Change Status <ChevronDown size={14} />
                        </button>
                        {bulkMenu === "status" && (
                          <div className="absolute right-0 top-full mt-1 w-48 max-h-56 overflow-auto bg-white border border-neutral-200 rounded shadow-lg z-30">
                            {caseStatuses.length === 0 && <div className="px-4 py-2 text-xs text-neutral-400">No statuses</div>}
                            {caseStatuses.map((cs) => (
                              <div key={cs.id} onClick={() => bulkSetStatus(cs.id, cs.label)} className="px-4 py-2 text-neutral-700 hover:bg-blue-50 cursor-pointer">
                                {cs.label}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <div className="rounded-lg outline outline-1 outline-neutral-100 overflow-hidden">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="h-12 bg-neutral-100">
                        {selectMode && (
                          <TableHeader className="w-10">
                            <Checkbox checked={allOnPageSelected} onChange={toggleAll} />
                          </TableHeader>
                        )}
                        <TableHeader>CLIENT</TableHeader>
                        <TableHeader>CLAIM NO.</TableHeader>
                        <TableHeader>TYPE</TableHeader>
                        <TableHeader>INCIDENT DATE</TableHeader>
                        <TableHeader>ASSIGNED TO</TableHeader>
                        <TableHeader>REASON</TableHeader>
                        <TableHeader>STATUS</TableHeader>
                        <TableHeader className="w-10" />
                      </tr>
                    </thead>

                    <tbody>
                      {pageRows.length === 0 && (
                        <tr><td colSpan={selectMode ? 9 : 8} className="px-4 py-10 text-center text-neutral-400 text-xl">No claims found.</td></tr>
                      )}
                      {pageRows.map((claim, index) => (
                        <tr
                          key={`${claim.claimNo}-${index}`}
                          className="border-b border-neutral-100 last:border-b-0 hover:bg-neutral-50 transition cursor-pointer"
                          onClick={() => {
                            navigate(claim.claim_id ? `/add-claim/${claim.claim_id}` : "/add-claim");
                          }}
                        >
                          {selectMode && (
                            <TableCell className="w-10" onClick={(e: any) => e.stopPropagation()}>
                              <Checkbox checked={!!claim.claim_id && selected.has(claim.claim_id)} onChange={() => claim.claim_id && toggleOne(claim.claim_id)} />
                            </TableCell>
                          )}

                          <TableCell>{claim.client}</TableCell>
                          <TableCell>{claim.claimNo}</TableCell>
                          <TableCell>{claim.type}</TableCell>
                          <TableCell>{claim.date}</TableCell>
                          <TableCell>{claim.assigned}</TableCell>

                          <TableCell>
                            {claim.reason ? (
                              <span
                                className="block max-w-[220px] text-neutral-600 text-sm line-clamp-2"
                                title={claim.reason}
                              >
                                {claim.reason}
                              </span>
                            ) : (
                              <span className="text-neutral-300">—</span>
                            )}
                          </TableCell>

                          <TableCell>
                            <StatusBadge status={claim.status} />
                          </TableCell>

                          <TableCell className="w-10 text-right relative" onClick={(e: any) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={() => setRowMenu(rowMenu === claim.claim_id ? null : claim.claim_id)}
                              className="px-2 py-1 text-neutral-300 hover:text-neutral-500"
                            >
                              <MoreVertical size={16} />
                            </button>
                            {rowMenu === claim.claim_id && (
                              <div ref={rowMenuRef} className="absolute right-4 top-9 z-20 min-w-[150px] bg-white rounded-lg border border-neutral-200 shadow-lg py-1 text-left">
                                <button type="button" onClick={() => { setRowMenu(null); navigate(claim.claim_id ? `/add-claim/${claim.claim_id}` : "/add-claim"); }} className="w-full text-left px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50">
                                  View / Edit
                                </button>
                                <button type="button" onClick={() => { setRowMenu(null); setDeleteTarget(claim); }} className="w-full text-left px-3 py-2 text-sm text-red-500 hover:bg-red-50">
                                  Delete
                                </button>
                              </div>
                            )}
                          </TableCell>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-6 w-full inline-flex justify-between items-center">
                  <div className="text-center">
                    <span className="text-neutral-600 text-xs font-weight-400">
                      Showing{" "}
                    </span>
                    <span className="text-black text-xs font-weight-600">
                      {filteredRows.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1}
                    </span>
                    <span className="text-neutral-600 text-xs font-weight-400">
                      {" "}
                      to{" "}
                    </span>
                    <span className="text-black text-xs font-weight-600">
                      {Math.min(currentPage * PAGE_SIZE, filteredRows.length)}
                    </span>
                    <span className="text-neutral-600 text-xs font-weight-400">
                      {" "}
                      of{" "}
                    </span>
                    <span className="text-black text-xs font-weight-600">
                      {filteredRows.length}
                    </span>
                    <span className="text-neutral-600 text-xs font-weight-400">
                      {" "}
                      Entries
                    </span>
                  </div>

                  <Pagination
                    currentPage={currentPage}
                    totalPages={Math.ceil(filteredRows.length / PAGE_SIZE)}
                    onPageChange={setCurrentPage}
                  />
                </div>
              </div>
            </section>
          </>
        )}

        {activePage !== "claims" && (
          <Suspense
            fallback={
              <section className="flex-1 relative min-h-[300px]">
                <SpinnerLoader />
              </section>
            }
          >
            {activePage === "settings" && (
              <section className="flex-1 overflow-auto">
                <AccountSettingsContent onClose={() => setActivePage("claims")} />
              </section>
            )}
            {activePage === "tasks" && <Tasks initialFilters={taskFilter} />}
            {activePage === "dashboard" && <TasksDashboard onOpen={goToTasks} />}
            {activePage === "calendar" && <TasksCalendar onOpenTasks={() => goToTasks()} />}
          </Suspense>
        )}
      </main>

      {deleteTarget && (
        <ConfirmModal
          title="Delete Claim"
          message={`Are you sure you want to delete claim ${deleteTarget.claimNo || ""}?`}
          confirmLabel="Delete"
          onCancel={() => setDeleteTarget(null)}
          onConfirm={confirmDeleteOne}
        />
      )}
      {bulkConfirm && (
        <ConfirmModal
          title="Delete Claims"
          message={`Are you sure you want to delete ${selected.size} selected claim(s)?`}
          confirmLabel="Delete"
          onCancel={() => setBulkConfirm(false)}
          onConfirm={confirmBulkDelete}
        />
      )}
    </div>
  );
};

const StatCard = ({ title, value, icon, iconBg, trend, up }: any) => (
  <div className="p-4 rounded-lg outline outline-1 outline-offset-[-1px] outline-neutral-200 flex flex-col gap-3">
    <div className="flex items-start justify-between">
      <span className={`w-9 h-9 rounded ${iconBg} flex items-center justify-center`}>
        <img src={icon} alt="" className="w-4.5 h-4.5" />
      </span>
      <img src={up ? TrendingUp : TrendingDown} alt="" className="h-6" />
    </div>
    <div className="flex flex-col gap-1">
      <div className="text-black text-4xl font-weight-700 leading-10">{value}</div>
      <div className="text-neutral-500 text-sm font-weight-500">{title}</div>
    </div>
    <div className="border-t border-neutral-100 pt-2 flex items-center gap-2">
      <span className={`px-1.5 py-0.5 rounded text-[11px] font-weight-600 ${up ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"}`}>
        {trend}
      </span>
      <span className="text-neutral-400 text-xs">vs last month</span>
    </div>
  </div>
);

// Single-select filter dropdown (blue label + chevron), matches the dashboard.
// Custom selection box (matches Task Management).
const Checkbox = ({ checked, onChange }: { checked: boolean; onChange: () => void }) => (
  <div onClick={onChange} className="cursor-pointer shrink-0 p-0.5" role="checkbox" aria-checked={checked}>
    <div className={`w-5 h-5 rounded ${checked ? "bg-blue-600 border-[6px] border-blue-200" : "bg-neutral-300"}`} />
  </div>
);

// Multi-select filter dropdown (checkboxes + count badge + clear) — same as Tasks.
const MultiFilterDropdown = ({
  label, options, selected, onToggle, onClear,
}: { label: string; options: string[]; selected: string[]; onToggle: (v: string) => void; onClear: () => void }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 text-blue-500 text-sm font-weight-500 hover:opacity-80"
      >
        {selected.length > 0 && (
          <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-blue-500 text-white text-[11px] flex items-center justify-center">
            {selected.length}
          </span>
        )}
        {label}
        <ChevronDown size={14} />
      </button>
      {open && (
        <div className="absolute z-30 top-full mt-1 left-0 w-max min-w-[176px] max-w-[300px] bg-white rounded-md shadow-[0px_4px_4px_0px_rgba(0,0,0,0.08)] border border-neutral-100 p-2 max-h-72 overflow-auto scrollbar-hide flex flex-col gap-1">
          {selected.length > 0 && (
            <button type="button" onClick={onClear} className="w-full text-left p-2.5 text-xs text-neutral-500 hover:bg-neutral-50 rounded-sm">
              Clear {label}
            </button>
          )}
          {options.length === 0 ? (
            <div className="p-2.5 text-sm text-neutral-400">No options</div>
          ) : (
            options.map((o) => {
              const checked = selected.includes(o);
              return (
                <button
                  key={o}
                  type="button"
                  onClick={() => onToggle(o)}
                  className={`w-full flex items-center gap-2 text-left p-2.5 rounded-sm transition-colors ${
                    checked ? "bg-blue-100" : "hover:bg-neutral-50"
                  }`}
                >
                  <span
                    className={`w-5 h-5 rounded-sm shrink-0 ${
                      checked ? "bg-blue-500 border-[6px] border-blue-200" : "bg-neutral-300"
                    }`}
                  />
                  <span className="text-neutral-700 text-sm font-normal leading-4 truncate">{o}</span>
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

// Date field with the shared popup CustomDatePicker (same as the claim forms / Tasks).
const toLocalISO = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};
const fmtDateLabel = (v: string) => {
  if (!v) return "";
  const [y, m, d] = v.split("-");
  return y && m && d ? `${d}-${m}-${y.slice(2)}` : v;
};
const DatePickerField = ({
  value, onChange, placeholder,
}: { value: string; onChange: (v: string) => void; placeholder: string }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const popRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    if (open) document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);
  // Fixed-position popup, clamped to the viewport so it can never render off-screen.
  useLayoutEffect(() => {
    if (!open || !ref.current) { setPos(null); return; }
    const r = ref.current.getBoundingClientRect();
    const w = popRef.current?.offsetWidth || 320;
    let left = r.right - w;
    left = Math.max(8, Math.min(left, window.innerWidth - w - 8));
    setPos({ top: r.bottom + 6, left });
  }, [open]);
  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-36 px-4 py-3.5 bg-white rounded outline outline-1 outline-offset-[-1px] outline-neutral-200 flex justify-between items-center"
      >
        <span className={`text-sm leading-4 ${value ? "text-neutral-700 font-light" : "text-neutral-300 font-light"}`}>
          {value ? fmtDateLabel(value) : placeholder}
        </span>
        <Calendar size={16} className="text-blue-300" />
      </button>
      {open && (
        <div
          ref={popRef}
          style={{ position: "fixed", top: pos?.top ?? 0, left: pos?.left ?? 0, visibility: pos ? "visible" : "hidden", zIndex: 60 }}
          className="bg-white rounded-lg shadow-xl"
        >
          <CustomDatePicker
            selectedDate={value ? new Date(value + "T00:00:00") : new Date()}
            onDateSelect={(d: Date) => { onChange(toLocalISO(d)); setOpen(false); }}
          />
        </div>
      )}
    </div>
  );
};

const TableHeader = ({
  children,
  className = "",
}: {
  children?: React.ReactNode;
  className?: string;
}) => (
  <th
    className={`px-4 py-3 text-left text-neutral-900 text-sm font-weight-600 ${className}`}
  >
    {children}
  </th>
);

const TableCell = ({
  children,
  className = "",
  onClick,
}: {
  children?: React.ReactNode;
  className?: string;
  onClick?: (e: React.MouseEvent<HTMLTableCellElement>) => void;
}) => (
  <td
    onClick={onClick}
    className={`px-4 py-3 text-neutral-700 text-sm font-weight-400 ${className}`}
  >
    {children}
  </td>
);

const StatusBadge = ({ status }: { status: string }) => {
  const s = status?.toLowerCase() || "";
  if (s.includes("cancel") || s.includes("closed")) {
    return (
      <span className="px-2 py-1 bg-neutral-100 rounded text-neutral-600 text-[10px] font-weight-500 font-['Outfit']">
        {status}
      </span>
    );
  }
  if (s.includes("complet") || s.includes("settled") || s.includes("approved") || s.includes("accept")) {
    return (
      <span className="px-2 py-1 bg-[#DDF8D5] rounded text-[#2BAA00] text-[10px] font-weight-500 font-['Outfit']">
        {status}
      </span>
    );
  }
  if (s.includes("process") || s.includes("progress") || s.includes("pending")) {
    return (
      <span className="px-2 py-1 bg-[#FFF6D1] rounded text-[#E69500] text-[10px] font-weight-500 font-['Outfit']">
        {status}
      </span>
    );
  }
  return (
    <span className="px-2 py-1 bg-[#FFC3C4] rounded text-[#CA0000] text-[10px] font-weight-500 font-['Outfit']">
      {status || "—"}
    </span>
  );
};

const PriorityBadge = ({ priority }: { priority: string }) => {
  const p = priority?.toLowerCase() || "";
  if (p === "high") {
    return (
      <span className="px-2 py-1 bg-[#FFC3C4] rounded text-[#CA0000] text-[10px] font-weight-500 font-['Outfit']">
        High
      </span>
    );
  }
  if (p === "medium") {
    return (
      <span className="px-2 py-1 bg-[#FFF6D1] rounded text-[#E69500] text-[10px] font-weight-500 font-['Outfit']">
        Medium
      </span>
    );
  }
  if (p === "low") {
    return (
      <span className="px-2 py-1 bg-[#DDF8D5] rounded text-[#2BAA00] text-[10px] font-weight-500 font-['Outfit']">
        Low
      </span>
    );
  }
  return (
    <span className="px-2 py-1 bg-neutral-100 rounded text-neutral-600 text-[10px] font-weight-500 font-['Outfit']">
      {priority || "—"}
    </span>
  );
};

const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) => {
  const pages = Math.max(1, totalPages);

  // Page numbers with ellipsis: 1 … (cur-1) cur (cur+1) … last
  const nums: (number | "...")[] = [];
  if (pages <= 8) {
    for (let i = 1; i <= pages; i++) nums.push(i);
  } else {
    nums.push(1);
    const start = Math.max(2, currentPage - 1);
    const end = Math.min(pages - 1, currentPage + 1);
    if (start > 2) nums.push("...");
    for (let i = start; i <= end; i++) nums.push(i);
    if (end < pages - 1) nums.push("...");
    nums.push(pages);
  }

  return (
    <div className="flex justify-start items-center shadow-[0px_1px_0.5px_0.05px_rgba(29,41,61,0.02)] font-['Inter'] text-sm">
      <button
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
        className="h-9 px-3 py-2 bg-white rounded-tl rounded-bl outline outline-1 outline-offset-[-1px] outline-neutral-200 flex justify-center items-center disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <span className="text-neutral-600 text-sm font-weight-500 leading-5">
          Previous
        </span>
      </button>

      {nums.map((page, i) =>
        page === "..." ? (
          <span key={`e${i}`} className="w-9 h-9 flex justify-center items-center text-neutral-400 outline outline-1 outline-offset-[-1px] outline-neutral-200 bg-white">…</span>
        ) : (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`w-9 h-9 px-3 py-2 outline outline-1 outline-offset-[-1px] outline-neutral-200 flex justify-center items-center ${
              page === currentPage ? "bg-blue-100" : "bg-white"
            }`}
          >
            <span className={`text-sm font-weight-500 leading-5 ${page === currentPage ? "text-black" : "text-neutral-600"}`}>
              {page}
            </span>
          </button>
        ),
      )}

      <button
        disabled={currentPage === pages}
        onClick={() => onPageChange(currentPage + 1)}
        className="h-9 px-3 py-2 bg-white rounded-tr rounded-br outline outline-1 outline-offset-[-1px] outline-neutral-200 flex justify-center items-center disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <span className="text-blue-500 text-sm font-weight-500 leading-5">
          Next
        </span>
      </button>
    </div>
  );
};

const formatDate = (value: any) => {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
};

export default Dashboard;
