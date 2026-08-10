import React, { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, LayoutGrid, List as ListIcon, MoreVertical, Paperclip, X } from "lucide-react";
import { toast } from "react-toastify";
import FleetConfirmModal from "../components/FleetConfirmModal";
import FleetTaskModal from "../components/FleetTaskModal";
import FleetPageHeader from "../components/FleetPageHeader";
import FleetSpinnerLoader from "../components/FleetSpinnerLoader";
import { FleetCalendar } from "../components/FleetCalendar";
import FleetMultiSelectFilter from "../components/FleetMultiSelectFilter";
import CalendarIcon from "../assets/listingpage/calendar.svg";
import {
  listFleetTasks,
  deleteFleetTask,
  updateFleetTask,
  TASK_STATUSES,
  TASK_PRIORITIES,
  type FleetTask,
} from "../services/taskService";
import FleetTaskDetailSlider, { type FleetTaskDetailTab } from "../components/FleetTaskDetailSlider";
import FleetReassignModal from "../components/FleetReassignModal";
import { useFleetAssignees } from "../hooks/useFleetAssignees";
import type { Option } from "../types/hire";
import TrashIcon from "../assets/icons/Remove.svg";
import TotalTasksIcon from "../assets/listingpage/totaltasks.svg";
import PendingIcon from "../assets/listingpage/pending.svg";
import ProgressIcon from "../assets/listingpage/progress.svg";
import AlertIcon from "../assets/icons/Alert.svg";
import CompletedIcon from "../assets/listingpage/checkcircle.svg";

const ALL: Option = { label: "All", value: "" };
const statusOptions: Option[] = [ALL, ...TASK_STATUSES.map((s) => ({ label: s, value: s }))];
const priorityOptions: Option[] = [ALL, ...TASK_PRIORITIES.map((p) => ({ label: p, value: p }))];

const statusBadge = (value?: string | null): string => {
  const s = (value || "").toLowerCase();
  if (s === "completed") return "bg-green-100 text-green-600";
  if (s === "in progress") return "bg-yellow-100 text-yellow-700";
  if (s === "awaiting response") return "bg-yellow-100 text-yellow-700";
  if (s === "overdue") return "bg-red-100 text-red-600";
  return "bg-neutral-100 text-neutral-600"; // pending / default
};
const priorityBadge = (value?: string | null): string => {
  const p = (value || "").toLowerCase();
  if (p === "high") return "bg-red-100 text-red-600";
  if (p === "medium") return "bg-amber-100 text-amber-600";
  if (p === "low") return "bg-green-100 text-green-600";
  return "bg-neutral-100 text-neutral-600";
};

const fmtDue = (date?: string | null, time?: string | null): string => {
  if (!date) return "—";
  const d = new Date(`${date}T00:00:00`);
  const day = Number.isNaN(d.getTime()) ? date : d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  return time ? `${day} · ${time}` : day;
};

// checkbox · Task · Assigned to · Vehicle · Due Date · Status · Priority · kebab
const LIST_GRID = "grid-cols-[28px_minmax(240px,2fr)_minmax(120px,1fr)_minmax(110px,0.9fr)_minmax(96px,0.8fr)_minmax(96px,0.8fr)_minmax(88px,0.7fr)_32px]";

// Small grey square checkbox matching the design.
const TaskCheckbox: React.FC<{ checked: boolean; onChange: () => void; label?: string }> = ({ checked, onChange, label }) => (
  <button type="button" role="checkbox" aria-checked={checked} aria-label={label} onClick={onChange} className="shrink-0">
    <span className={`block w-5 h-5 rounded-sm ${checked ? "bg-neutral-900 border-[6px] border-neutral-300" : "bg-neutral-300"}`} />
  </button>
);

// Close a popup when the user clicks outside it.
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

// Date field — calendar.svg trigger + Fleet's own popup calendar (same as the listing).
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

interface TaskStat {
  title: string;
  value: number;
  icon: string;
  bg: string;
  trend: number;
  darkIcon?: boolean; // force the icon to black (used by the neutral "Total Tasks" card)
}
const StatCard: React.FC<TaskStat> = ({ title, value, icon, bg, trend, darkIcon }) => (
  <div className={`flex-1 min-w-0 p-4 rounded-lg ${bg} flex flex-col gap-4`}>
    <div className="flex items-start justify-between gap-3">
      <div className="flex flex-col gap-1">
        <div className="text-black text-2xl font-semibold leading-6">{value}</div>
        <div className="text-neutral-700 text-sm font-medium">{title}</div>
      </div>
      <span className="p-3 rounded-sm shrink-0">
        <img src={icon} alt="" className="w-5 h-5" style={darkIcon ? { filter: "brightness(0)" } : undefined} />
      </span>
    </div>
    <div className="flex items-center gap-2">
      <span className={`text-xs font-semibold ${trend > 0 ? "text-[#159215]" : trend < 0 ? "text-[#e5484d]" : "text-neutral-500"}`}>
        {trend > 0 ? "+" : ""}{trend}%
      </span>
      <span className="text-neutral-700 text-sm">vs last month</span>
    </div>
  </div>
);

const FleetTasks: React.FC<{ module?: string }> = ({ module = "skyline" }) => {
  const [tasks, setTasks] = useState<FleetTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [statusSel, setStatusSel] = useState<string[]>([]);
  const [prioritySel, setPrioritySel] = useState<string[]>([]);
  const [assignedSel, setAssignedSel] = useState<string[]>([]);
  const [regSel, setRegSel] = useState<string[]>([]);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [editing, setEditing] = useState<FleetTask | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<FleetTask | null>(null);
  const [reassignTarget, setReassignTarget] = useState<FleetTask | null>(null);
  const assignees = useFleetAssignees();
  const [view, setView] = useState<"card" | "list">("card"); // card is the default
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [bulkConfirm, setBulkConfirm] = useState(false); // bulk-delete confirmation
  const [bulkMenu, setBulkMenu] = useState<null | "status" | "reassign">(null);
  const bulkMenuRef = useOutside(() => setBulkMenu(null));
  // Row-actions menu: id + fixed viewport coords so it escapes any overflow clip.
  const [menu, setMenu] = useState<{ id: number; top: number; right: number } | null>(null);
  // Detail slider (4 tabs — Task Details / Attachments / Notes / Task History).
  const [detailTask, setDetailTask] = useState<FleetTask | null>(null);
  const [detailTab, setDetailTab] = useState<FleetTaskDetailTab>("Task Details");

  const load = async () => {
    setLoading(true);
    setTasks(await listFleetTasks({ module }));
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  // Counts by status (+ Overdue) with a real month-over-month trend from created_at.
  const statCards = useMemo<TaskStat[]>(() => {
    const monthKey = (d: Date) => d.getFullYear() * 12 + d.getMonth();
    const thisKey = monthKey(new Date());
    const lastKey = thisKey - 1;
    const trendFor = (subset: FleetTask[]) => {
      let t = 0, l = 0;
      subset.forEach((x) => {
        if (!x.created_at) return;
        const d = new Date(x.created_at);
        if (Number.isNaN(d.getTime())) return;
        const k = monthKey(d);
        if (k === thisKey) t += 1;
        else if (k === lastKey) l += 1;
      });
      return l === 0 ? (t > 0 ? 100 : 0) : Math.round(((t - l) / l) * 100);
    };
    const byStatus = (label: string) => tasks.filter((t) => (t.status || "").toLowerCase() === label.toLowerCase());
    const overdue = tasks.filter((t) => t.is_overdue);
    return [
      { title: "Total Tasks", value: tasks.length, icon: TotalTasksIcon, bg: "bg-neutral-100", trend: trendFor(tasks), darkIcon: true },
      { title: "Pending", value: byStatus("Pending").length, icon: PendingIcon, bg: "bg-[#ffe3e4]", trend: trendFor(byStatus("Pending")) },
      { title: "In Progress", value: byStatus("In Progress").length, icon: ProgressIcon, bg: "bg-[#fff1d7]", trend: trendFor(byStatus("In Progress")) },
      { title: "Overdue", value: overdue.length, icon: AlertIcon, bg: "bg-[#ffe3e4]", trend: trendFor(overdue) },
      { title: "Completed", value: byStatus("Completed").length, icon: CompletedIcon, bg: "bg-[#d9ffd9]", trend: trendFor(byStatus("Completed")) },
    ];
  }, [tasks]);

  // "Assigned to" / "Vehicle Reg" option lists, built from the tasks themselves.
  const assignedOptions = useMemo<Option[]>(() => {
    const names = Array.from(new Set(tasks.map((t) => (t.assigned_user || "").trim()).filter(Boolean)));
    return [{ label: "All Assignees", value: "" }, ...names.map((n) => ({ label: n, value: n }))];
  }, [tasks]);
  const regOptions = useMemo<Option[]>(() => {
    const regs = Array.from(new Set(tasks.map((t) => (t.vehicle_registration || "").trim()).filter(Boolean)));
    return [{ label: "All Vehicles", value: "" }, ...regs.map((r) => ({ label: r, value: r }))];
  }, [tasks]);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return tasks.filter((t) => {
      if (statusSel.length && !statusSel.includes(t.status || "")) return false;
      if (prioritySel.length && !prioritySel.includes(t.priority || "")) return false;
      if (assignedSel.length && !assignedSel.includes(t.assigned_user || "")) return false;
      if (regSel.length && !regSel.includes(t.vehicle_registration || "")) return false;
      if (fromDate && (!t.due_date || t.due_date < fromDate)) return false;
      if (toDate && (!t.due_date || t.due_date > toDate)) return false;
      if (!needle) return true;
      return [t.title, t.assigned_user, t.vehicle_registration, t.department]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(needle);
    });
  }, [tasks, query, statusSel, prioritySel, assignedSel, regSel, fromDate, toDate]);

  // Active-filter chips shown below the toolbar (each removable).
  const activePills = useMemo(() => {
    const pills: { key: string; label: string; clear: () => void }[] = [];
    const remove = (setter: React.Dispatch<React.SetStateAction<string[]>>, v: string) => setter((s) => s.filter((x) => x !== v));
    statusSel.forEach((v) => pills.push({ key: `status-${v}`, label: `Status: ${v}`, clear: () => remove(setStatusSel, v) }));
    prioritySel.forEach((v) => pills.push({ key: `priority-${v}`, label: `Priority: ${v}`, clear: () => remove(setPrioritySel, v) }));
    assignedSel.forEach((v) => pills.push({ key: `assigned-${v}`, label: `Assigned: ${v}`, clear: () => remove(setAssignedSel, v) }));
    regSel.forEach((v) => pills.push({ key: `reg-${v}`, label: `Vehicle: ${v}`, clear: () => remove(setRegSel, v) }));
    if (fromDate) pills.push({ key: "from", label: `From: ${new Date(`${fromDate}T00:00:00`).toLocaleDateString("en-GB")}`, clear: () => setFromDate("") });
    if (toDate) pills.push({ key: "to", label: `To: ${new Date(`${toDate}T00:00:00`).toLocaleDateString("en-GB")}`, clear: () => setToDate("") });
    return pills;
  }, [statusSel, prioritySel, assignedSel, regSel, fromDate, toDate]);

  const clearAllFilters = () => {
    setStatusSel([]); setPrioritySel([]); setAssignedSel([]); setRegSel([]); setFromDate(""); setToDate("");
  };
  const toggle = (setter: React.Dispatch<React.SetStateAction<string[]>>, v: string) =>
    setter((s) => (s.includes(v) ? s.filter((x) => x !== v) : [...s, v]));

  const openNew = () => { setEditing(null); setShowModal(true); };
  const openEdit = (task: FleetTask) => { setEditing(task); setShowModal(true); };
  const openDetail = (task: FleetTask, tab: FleetTaskDetailTab = "Task Details") => { setDetailTab(tab); setDetailTask(task); };

  // Open the fixed-position row-actions menu from a kebab button's rect.
  const openMenu = (e: React.MouseEvent<HTMLButtonElement>, id: number) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMenu((m) => (m?.id === id ? null : { id, top: rect.bottom + 4, right: window.innerWidth - rect.right }));
  };

  const markComplete = async (task: FleetTask) => {
    setTasks((rs) => rs.map((r) => (r.id === task.id ? { ...r, status: "Completed" } : r))); // optimistic
    const updated = await updateFleetTask(task.id, { status: "Completed" });
    if (updated) toast.success("Marked as complete."); else { toast.error("Couldn't update the task."); load(); }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const target = deleteTarget;
    setDeleteTarget(null);
    setTasks((rs) => rs.filter((r) => r.id !== target.id)); // optimistic
    const ok = await deleteFleetTask(target.id);
    if (ok) {
      toast.success("Task deleted.");
    } else {
      toast.error("Couldn't delete the task.");
      load();
    }
  };

  const confirmBulkDelete = async () => {
    const ids = [...selected];
    if (ids.length === 0) return;
    setBulkConfirm(false);
    setTasks((rs) => rs.filter((r) => !selected.has(r.id))); // optimistic
    setSelected(new Set());
    const results = await Promise.allSettled(ids.map((id) => deleteFleetTask(id)));
    const failed = results.filter((r) => r.status === "rejected" || (r.status === "fulfilled" && r.value === false)).length;
    if (failed) {
      toast.error(`Couldn't delete ${failed} task${failed === 1 ? "" : "s"}.`);
      load();
    } else {
      toast.success(`${ids.length} task${ids.length === 1 ? "" : "s"} deleted.`);
    }
  };

  // Bulk status / reassign update for the selected tasks.
  const bulkUpdate = async (patch: Parameters<typeof updateFleetTask>[1]) => {
    const ids = [...selected];
    if (ids.length === 0) return;
    setBulkMenu(null);
    setTasks((rs) => rs.map((r) => (selected.has(r.id) ? { ...r, ...(patch as Partial<FleetTask>) } : r))); // optimistic
    setSelected(new Set());
    const results = await Promise.allSettled(ids.map((id) => updateFleetTask(id, patch)));
    const failed = results.filter((r) => r.status === "rejected" || (r.status === "fulfilled" && r.value === null)).length;
    if (failed) {
      toast.error(`Couldn't update ${failed} task${failed === 1 ? "" : "s"}.`);
      load();
    } else {
      toast.success(`${ids.length} task${ids.length === 1 ? "" : "s"} updated.`);
    }
  };

  return (
    <div className="min-h-screen bg-white font-sans-headline">
      {loading && <FleetSpinnerLoader />}
      <FleetPageHeader title="Tasks" />

      <main className="px-10 py-10">
        <section className="max-w-[1120px] mx-auto flex flex-col gap-5">
          <div className="flex flex-col sm:flex-row items-stretch gap-4">
            {statCards.map((s) => (
              <StatCard key={s.title} {...s} />
            ))}
          </div>

          {/* Search + actions */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search task"
              className="w-full lg:max-w-[491px] h-12 px-5 rounded bg-white border border-neutral-200 outline-none text-sm text-neutral-900 placeholder:text-neutral-400 font-light focus:border-neutral-400"
            />
            <div className="flex items-center gap-3">
              {/* Card (default) / List view toggle. */}
              <div className="h-12 flex items-center rounded border border-neutral-200 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setView("card")}
                  title="Card view"
                  aria-label="Card view"
                  className={`h-full px-3 flex items-center ${view === "card" ? "bg-neutral-900 text-white" : "bg-white text-neutral-500 hover:bg-neutral-50"}`}
                >
                  <LayoutGrid size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => setView("list")}
                  title="List view"
                  aria-label="List view"
                  className={`h-full px-3 flex items-center border-l border-neutral-200 ${view === "list" ? "bg-neutral-900 text-white" : "bg-white text-neutral-500 hover:bg-neutral-50"}`}
                >
                  <ListIcon size={16} />
                </button>
              </div>
              <button
                type="button"
                onClick={openNew}
                className="h-12 px-10 bg-black rounded text-white text-base font-medium inline-flex items-center justify-center gap-2 hover:bg-neutral-800"
              >
                Add Task
              </button>
            </div>
          </div>

          {/* Filters — borderless multi-select (same shape as the Fleet listing). */}
          <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-7 flex-wrap">
            <FleetMultiSelectFilter label="Status" options={statusOptions.filter((o) => o.value)} selected={statusSel} onToggle={(v) => toggle(setStatusSel, v)} onClear={() => setStatusSel([])} />
            <FleetMultiSelectFilter label="Priority" options={priorityOptions.filter((o) => o.value)} selected={prioritySel} onToggle={(v) => toggle(setPrioritySel, v)} onClear={() => setPrioritySel([])} />
            <FleetMultiSelectFilter label="Assigned To" options={assignedOptions.filter((o) => o.value)} selected={assignedSel} onToggle={(v) => toggle(setAssignedSel, v)} onClear={() => setAssignedSel([])} />
            <FleetMultiSelectFilter label="Vehicle Reg" options={regOptions.filter((o) => o.value)} selected={regSel} onToggle={(v) => toggle(setRegSel, v)} onClear={() => setRegSel([])} />
            <div className="flex items-center gap-2 md:ml-auto">
              <span className="text-sm text-[#444] shrink-0">Date Range</span>
              <DateField value={fromDate} onChange={setFromDate} placeholder="From" />
              <DateField value={toDate} onChange={setToDate} placeholder="To" />
            </div>
          </div>

          {/* Active filter pills — each removable, plus Clear all. */}
          {activePills.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              {activePills.map((p) => (
                <span key={p.key} className="flex items-center gap-2 pl-3 pr-2 py-1.5 bg-white rounded-full border border-neutral-200 text-sm text-neutral-700">
                  {p.label}
                  <button type="button" onClick={p.clear} className="text-neutral-400 hover:text-neutral-700" aria-label={`Remove ${p.label} filter`}>
                    <X size={14} />
                  </button>
                </span>
              ))}
              <button type="button" onClick={clearAllFilters} className="ml-1 text-sm text-neutral-600 hover:underline">
                Clear all
              </button>
            </div>
          )}

          {/* Bulk action bar — appears when any task is selected (either view). */}
          {selected.size > 0 && (
            <div className="flex items-center justify-between px-4 py-3 bg-[#eee] text-black rounded">
              <span className="text-sm font-medium">{selected.size} Selected</span>
              <div ref={bulkMenuRef} className="flex items-center gap-6 text-sm">
                <button type="button" onClick={() => setSelected(new Set())} className="hover:opacity-80">
                  Clear
                </button>
                <button type="button" onClick={() => bulkUpdate({ status: "Completed" })} className="flex items-center gap-1.5 hover:text-green-600">
                  <Check size={15} /> Mark as Complete
                </button>
                <div className="relative">
                  <button type="button" onClick={() => setBulkMenu((m) => (m === "status" ? null : "status"))} className="flex items-center gap-1.5">
                    Change Status <ChevronDown size={14} />
                  </button>
                  {bulkMenu === "status" && (
                    <div className="absolute right-0 top-full mt-1 w-44 bg-white border border-neutral-200 rounded shadow-lg z-30">
                      {TASK_STATUSES.map((s) => (
                        <div key={s} onClick={() => bulkUpdate({ status: s })} className="px-4 py-2 text-neutral-700 hover:bg-neutral-50 cursor-pointer">
                          {s}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="relative">
                  <button type="button" onClick={() => setBulkMenu((m) => (m === "reassign" ? null : "reassign"))} className="flex items-center gap-1.5">
                    Reassign <ChevronDown size={14} />
                  </button>
                  {bulkMenu === "reassign" && (
                    <div className="absolute right-0 top-full mt-1 w-44 max-h-56 overflow-auto bg-white border border-neutral-200 rounded shadow-lg z-30">
                      {assignees.map((u) => (
                        <div key={u} onClick={() => bulkUpdate({ assigned_user: u })} className="px-4 py-2 text-neutral-700 hover:bg-neutral-50 cursor-pointer">
                          {u}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <button type="button" onClick={() => setBulkConfirm(true)} className="flex items-center gap-1.5 hover:text-red-600">
                  <img src={TrashIcon} alt="" className="w-4 h-4" /> Delete
                </button>
              </div>
            </div>
          )}

          {loading ? null : visible.length === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center text-center gap-1">
              <p className="text-neutral-900 text-base font-semibold">No tasks</p>
              <p className="text-neutral-500 text-sm">Create your first task to get started.</p>
            </div>
          ) : view === "list" ? (
            <div className="border border-neutral-100 rounded-lg overflow-x-auto">
              <div className="min-w-[920px]">
                <div className={`grid ${LIST_GRID} gap-2 bg-neutral-100 px-4 h-12 items-center text-neutral-900 text-sm font-semibold`}>
                  <TaskCheckbox
                    checked={visible.length > 0 && visible.every((t) => selected.has(t.id))}
                    onChange={() =>
                      setSelected((prev) => {
                        const next = new Set(prev);
                        const allOn = visible.every((t) => next.has(t.id));
                        visible.forEach((t) => (allOn ? next.delete(t.id) : next.add(t.id)));
                        return next;
                      })
                    }
                    label="Select all"
                  />
                  <span>TASK</span>
                  <span>ASSIGNED TO</span>
                  <span>VEHICLE</span>
                  <span>DUE DATE</span>
                  <span>STATUS</span>
                  <span>PRIORITY</span>
                  <span />
                </div>
                {visible.map((task) => (
                  <div
                    key={task.id}
                    className={`grid ${LIST_GRID} gap-2 px-4 py-3 items-start text-sm border-t border-neutral-100 hover:bg-neutral-50 transition-colors`}
                  >
                    <TaskCheckbox
                      checked={selected.has(task.id)}
                      onChange={() =>
                        setSelected((prev) => {
                          const next = new Set(prev);
                          if (next.has(task.id)) next.delete(task.id);
                          else next.add(task.id);
                          return next;
                        })
                      }
                      label={`Select ${task.title}`}
                    />
                    <div className="min-w-0">
                      <button type="button" onClick={() => openEdit(task)} className="text-left flex items-center gap-1.5 max-w-full">
                        <span className="text-neutral-900 text-sm font-semibold truncate hover:underline">{task.title}</span>
                        {task.attachment_path && <Paperclip size={13} className="shrink-0 text-neutral-400" aria-label="Has attachment" />}
                      </button>
                      {task.description && <p className="text-neutral-500 text-xs mt-0.5 line-clamp-2">{task.description}</p>}
                    </div>
                    <span className="text-neutral-600 truncate">{task.assigned_user || "—"}</span>
                    <span className="text-neutral-600 truncate">{task.vehicle_registration || "—"}</span>
                    <span className={task.is_overdue ? "text-red-600 font-medium" : "text-neutral-600"}>{fmtDue(task.due_date, task.due_time)}</span>
                    <span>
                      <span className={`inline-flex items-center px-2 py-1 rounded text-[10px] font-medium uppercase ${statusBadge(task.status)}`}>
                        {task.status || "Pending"}
                      </span>
                    </span>
                    <span>
                      <span className={`inline-flex items-center px-2 py-1 rounded text-[10px] font-medium uppercase ${priorityBadge(task.priority)}`}>
                        {task.priority || "—"}
                      </span>
                    </span>
                    <div className="flex justify-end">
                      <button
                        type="button"
                        aria-label="Row actions"
                        onClick={(e) => openMenu(e, task.id)}
                        className="text-neutral-400 hover:text-neutral-700"
                      >
                        <MoreVertical size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {visible.map((task) => {
                const overdue = task.is_overdue && (task.status || "").toLowerCase() !== "completed";
                return (
                  <div
                    key={task.id}
                    className="rounded-lg border border-neutral-200 p-5 flex gap-2.5 hover:shadow-sm transition"
                  >
                    <div className="self-start">
                      <TaskCheckbox
                        checked={selected.has(task.id)}
                        onChange={() =>
                          setSelected((prev) => {
                            const next = new Set(prev);
                            if (next.has(task.id)) next.delete(task.id);
                            else next.add(task.id);
                            return next;
                          })
                        }
                        label={`Select ${task.title}`}
                      />
                    </div>
                    {/* All card data sits in a column aligned next to the checkbox. */}
                    <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                      {/* title + description + kebab */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <button
                            type="button"
                            onClick={() => openDetail(task)}
                            className="text-left text-neutral-900 text-base font-semibold hover:underline line-clamp-2"
                          >
                            {task.title}
                          </button>
                          {task.description && (
                            <div className="text-neutral-500 text-sm mt-1 line-clamp-2">{task.description}</div>
                          )}
                        </div>
                        <div className="shrink-0 flex items-center gap-2">
                          {task.attachment_path && <Paperclip size={14} className="text-neutral-400" aria-label="Has attachment" />}
                          <button type="button" aria-label="Task actions" onClick={(e) => openMenu(e, task.id)} className="p-1 text-neutral-400 hover:text-neutral-700 rounded">
                            <MoreVertical size={16} />
                          </button>
                        </div>
                      </div>

                      {task.vehicle_registration && (
                        <div className="text-sm text-neutral-600">{task.vehicle_registration}</div>
                      )}
                      <div className="text-sm text-neutral-700">
                        Assigned to: <span className="font-semibold">{task.assigned_user || "—"}</span>
                      </div>

                      {/* footer pinned to the bottom */}
                      <div className="mt-auto">
                        <div className="h-px bg-neutral-100 w-full" />
                        <div className="flex items-center justify-between pt-3 gap-2">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${statusBadge(overdue ? "Overdue" : task.status)}`}>
                              {overdue ? "Overdue" : task.status || "Pending"}
                            </span>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${priorityBadge(task.priority)}`}>{task.priority || "—"}</span>
                          </div>
                          <span className="text-neutral-600 text-xs">
                            Due: <span className={`font-semibold ${overdue ? "text-red-600" : ""}`}>{fmtDue(task.due_date, task.due_time)}</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>

      {/* Shared row-actions menu (list + card), fixed-positioned to escape clipping. */}
      {menu && (() => {
        const task = visible.find((t) => t.id === menu.id);
        if (!task) return null;
        return (
          <>
            <div className="fixed inset-0 z-[80]" onClick={() => setMenu(null)} />
            <div style={{ position: "fixed", top: menu.top, right: menu.right }} className="z-[90] w-44 bg-white rounded-lg shadow-lg border border-neutral-200 py-1">
              <button type="button" onClick={() => { setMenu(null); openDetail(task); }} className="w-full text-left px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50">
                View Details
              </button>
              {(task.status || "").toLowerCase() !== "completed" && (
                <button type="button" onClick={() => { setMenu(null); markComplete(task); }} className="w-full text-left px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50">
                  Mark as Complete
                </button>
              )}
              <button type="button" onClick={() => { setMenu(null); setReassignTarget(task); }} className="w-full text-left px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50">
                Reassign
              </button>
              <button type="button" onClick={() => { setMenu(null); openEdit(task); }} className="w-full text-left px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50">
                Edit
              </button>
              <button type="button" onClick={() => { setMenu(null); setDeleteTarget(task); }} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-neutral-50">
                Delete
              </button>
            </div>
          </>
        );
      })()}

      {detailTask && (
        <FleetTaskDetailSlider
          key={`${detailTask.id}-${detailTab}`}
          task={detailTask}
          initialTab={detailTab}
          onClose={() => setDetailTask(null)}
          onEdit={() => { setEditing(detailTask); setShowModal(true); setDetailTask(null); }}
          onRefresh={load}
        />
      )}

      {showModal && (
        <FleetTaskModal
          task={editing}
          module={module}
          onClose={() => setShowModal(false)}
          onSaved={() => {
            setShowModal(false);
            toast.success(editing ? "Task updated." : "Task created.");
            load();
          }}
        />
      )}

      {deleteTarget && (
        <FleetConfirmModal
          title="Delete Task"
          message={`Are you sure you want to delete "${deleteTarget.title}"? This cannot b`}
          confirmLabel="Delete"
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {bulkConfirm && (
        <FleetConfirmModal
          title="Delete Tasks"
          message={`Are you sure you want to delete ${selected.size} task${selected.size === 1 ? "" : "s"}? This cannot be undone.`}
          confirmLabel="Delete"
          onConfirm={confirmBulkDelete}
          onCancel={() => setBulkConfirm(false)}
        />
      )}

      {reassignTarget && (
        <FleetReassignModal
          task={reassignTarget}
          onClose={() => setReassignTarget(null)}
          onDone={() => { setReassignTarget(null); load(); }}
        />
      )}
    </div>
  );
};

export default FleetTasks;
