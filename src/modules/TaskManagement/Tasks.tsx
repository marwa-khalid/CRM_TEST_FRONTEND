import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  Search,
  Bell,
  Plus,
  List as ListIcon,
  LayoutGrid,
  MoreVertical,
  ChevronDown,
  Inbox,
  Clock3,
  Hourglass,
  AlertCircle,
  CheckCircle2,
  UploadCloud,
} from "lucide-react";
import TotalTasks from '../../assets/TaskManagement/TotalTasks.svg'
import Pending from "../../assets/TaskManagement/Pending.svg";
import InProgress from '../../assets/TaskManagement/InProgress.svg'
import Overdue from '../../assets/TaskManagement/Overdue.svg'
import Complete from "../../assets/TaskManagement/Complete.svg";

import {
  listTasks,
  getTaskStats,
  createTask,
  updateTask,
  uploadTaskFile,
  type TaskFilters,
  type TaskPayload,
} from "../../services/Tasks/Tasks";
import { getClaims } from "../../services/Claims/Claims";
import { API_BASE_URL } from "../../services/axiosConfig";
import { CustomDatePicker } from "../Claims/Components/DatePicker";
import Vector6 from "../../assets/AutoClaim_icon/Vector-6.svg";

// ─── constants ────────────────────────────────────────────────────────────────

const STATUSES = [
  "Pending",
  "In Progress",
  "Overdue",
  "Awaiting Response",
  "Rejected",
  "Completed",
];
const PRIORITIES = ["Low", "Medium", "High"];
const DEPARTMENTS = ["Claims", "Fleet", "Recovery", "Customer Service"];
// Sample users for now (no users endpoint wired yet)
const SAMPLE_USERS = [
  "Ruby ",
  "Imran Dean",
  "Hina Sadaf",
  "John Smith",
  "Olivia Rhye",
  "Michael Brown",
];
const PAGE_SIZE = 10;

// ─── helpers ──────────────────────────────────────────────────────────────────

const statusBadge = (status: string): string => {
  const s = (status || "").toLowerCase();
  if (s === "completed") return "bg-green-100 text-green-600";
  if (s === "in progress") return "bg-yellow-100 text-amber-600";
  if (s === "overdue") return "bg-red-100 text-red-600";
  if (s === "awaiting response") return "bg-blue-100 text-blue-600";
  if (s === "rejected") return "bg-neutral-100 text-neutral-600";
  return "bg-red-50 text-red-500"; // pending / default
};

const priorityBadge = (priority: string): string => {
  const p = (priority || "").toLowerCase();
  if (p === "high") return "bg-red-100 text-red-600";
  if (p === "medium") return "bg-yellow-100 text-amber-600";
  if (p === "low") return "bg-green-100 text-green-600";
  return "bg-neutral-100 text-neutral-600";
};

const formatDate = (value?: string | null): string => {
  if (!value) return "—";
  const [y, m, d] = value.split("-");
  if (!y || !m || !d) return value;
  return `${d}-${m}-${y.slice(2)}`;
};

// Due date + time (story §6: cards show "Due Date and Time")
const formatDue = (t: any): string => {
  const d = formatDate(t.due_date);
  if (d === "—") return d;
  return t.due_time ? `${d} ${t.due_time}` : d;
};

const Badge = ({ text, cls }: { text: string; cls: string }) => (
  <span className={`px-2 py-1 rounded text-[10px] font-weight-600 uppercase ${cls}`}>
    {text}
  </span>
);

// Reuses the shared CustomDatePicker (same one used on the claim forms).
// Stores/returns the date as a "YYYY-MM-DD" string.
const DatePickerField = ({
  value,
  onChange,
  placeholder = "Date",
  triggerClassName,
  align = "left",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  triggerClassName?: string;
  align?: "left" | "right";
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);
  return (
    <div className="relative" ref={ref}>
      <div
        onClick={() => setOpen((o) => !o)}
        className={
          triggerClassName ||
          "h-[52px] px-4 bg-white rounded border border-neutral-200 flex items-center justify-between cursor-pointer"
        }
      >
        <span
          className={
            value
              ? "text-neutral-700 font-light"
              : "text-neutral-300 font-light"
          }
        >
          {value || placeholder}
        </span>
        <img src={Vector6} alt="" className="w-4 h-4" />
      </div>
      {open && (
        <div className={`absolute z-40 top-full mt-1 ${align === "right" ? "right-0" : "left-0"} shadow-xl rounded-lg bg-white`}>
          <CustomDatePicker
            selectedDate={value ? new Date(value) : new Date()}
            onDateSelect={(date: Date) => {
              onChange(date.toISOString().split("T")[0]);
              setOpen(false);
            }}
          />
        </div>
      )}
    </div>
  );
};

// ─── summary cards ──────────────────────────────────────────────────────────────

const SUMMARY_META = [
  {
    key: "total",
    label: "Total Tasks",
    bg: "bg-blue-100",
    Icon: TotalTasks,
  },
  {
    key: "pending",
    label: "Pending",
    bg: "bg-red-100",
    Icon: Pending,
  },
  {
    key: "in_progress",
    label: "In progress",
    bg: "bg-yellow-100",
    Icon: InProgress,
  },
  {
    key: "overdue",
    label: "Overdue",
    bg: "bg-red-100",
    Icon: Overdue,
  },
  {
    key: "completed",
    label: "Completed",
    bg: "bg-green-100",
    Icon: Complete,
  },
] as const;

const SummaryCard = ({
  label, value, bg, Icon,
}: { label: string; value: number; bg: string; Icon: any }) => (
  <div className={`${bg} rounded-lg p-5 flex flex-col gap-3`}>
    <div className="flex items-start justify-between">
      <span className="text-neutral-900 text-3xl font-weight-600 leading-8">{value}</span>
       <img src={Icon} alt="" />
     
    </div>
    <span className="text-neutral-700 text-sm font-weight-500">{label}</span>
  </div>
);

// ─── filter dropdown ─────────────────────────────────────────────────────────────

const FilterDropdown = ({
  label, value, options, onChange,
}: { label: string; value: string; options: string[]; onChange: (v: string) => void }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
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
        {value || label}
        <ChevronDown size={14} />
      </button>
      {open && (
        <div className="absolute z-30 top-full mt-1 left-0 min-w-[180px] bg-white rounded-lg border border-neutral-200 shadow-lg py-1">
          <button
            type="button"
            onClick={() => { onChange(""); setOpen(false); }}
            className="w-full text-left px-4 py-2 text-sm text-neutral-500 hover:bg-neutral-50"
          >
            All {label}
          </button>
          {options.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => { onChange(opt); setOpen(false); }}
              className={`w-full text-left px-4 py-2 text-sm hover:bg-blue-50 ${
                value === opt ? "bg-blue-50 text-blue-600 font-weight-500" : "text-neutral-700"
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── quick actions menu ──────────────────────────────────────────────────────────

const QuickActions = ({
  task, onAction,
}: { task: any; onAction: (action: string, task: any) => void }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  const items = [
    { key: "complete", label: "Mark as Complete" },
    { key: "reassign", label: "Reassign" },
    { key: "note", label: "Add Note" },
    { key: "edit", label: "Edit Task" }
  ];
  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="p-1 text-neutral-400 hover:text-neutral-600 rounded"
      >
        <MoreVertical size={16} />
      </button>
      {open && (
        <div className="absolute z-30 top-full mt-1 right-0 min-w-[170px] bg-white rounded-lg border border-neutral-200 shadow-lg py-1">
          {items.map((it) => (
            <button
              key={it.key}
              type="button"
              onClick={() => { setOpen(false); onAction(it.key, task); }}
              className="w-full text-left px-4 py-2 text-sm text-neutral-700 hover:bg-blue-50"
            >
              {it.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── add / edit task drawer ──────────────────────────────────────────────────────

const EMPTY_FORM: any = {
  title: "",
  description: "",
  assigned_user: "",
  department: "",
  due_date: "",
  due_time: "",
  priority: "Medium",
  status: "Pending",
  claim_id: "",
  claim_reference: "",
  vehicle_registration: "",
  attachment_path: "",
};

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="flex flex-col gap-2">
    <label className="text-neutral-900 text-sm font-weight-600">{label}</label>
    {children}
  </div>
);

const inputCls =
  "w-full h-[52px] px-4 bg-white rounded border border-neutral-200 outline-none text-neutral-700 font-light focus:border-blue-500";
const selectCls = inputCls + " appearance-none cursor-pointer";

const AddTaskDrawer = ({
  open, editing, claims, onClose, onSaved,
}: {
  open: boolean;
  editing: any | null;
  claims: { id: number; ref: string }[];
  onClose: () => void;
  onSaved: () => void;
}) => {
  const [form, setForm] = useState<any>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(editing ? { ...EMPTY_FORM, ...editing, claim_id: editing.claim_id ?? "" } : EMPTY_FORM);
    }
  }, [open, editing]);

  if (!open) return null;

  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.title?.trim()) {
      toast.error("Task Title is required");
      return;
    }
    const payload: TaskPayload = {
      title: form.title,
      description: form.description || null,
      assigned_user: form.assigned_user || null,
      department: form.department || null,
      due_date: form.due_date || null,
      due_time: form.due_time || null,
      priority: form.priority || null,
      status: form.status || null,
      claim_id: form.claim_id ? Number(form.claim_id) : null,
      claim_reference: form.claim_reference || null,
      vehicle_registration: form.vehicle_registration || null,
      attachment_path: form.attachment_path || null,
    };
    setSaving(true);
    try {
      if (editing?.id) await updateTask(editing.id, payload);
      else await createTask(payload);
      toast.success(editing?.id ? "Task updated" : "Task created");
      onSaved();
      onClose();
    } catch {
      toast.error("Failed to save task");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full max-w-[520px] h-full bg-white shadow-xl flex flex-col font-['Stack_Sans_Headline']">
        {/* Header */}
        <div className="h-16 px-6 flex items-center justify-between border-b border-neutral-100 shrink-0">
          <h2 className="text-black text-lg font-weight-600">
            {editing?.id ? "Edit Task" : "Add Task"}
          </h2>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2.5 bg-blue-500 rounded text-white text-sm font-weight-500 hover:bg-blue-600 disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save Task"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 bg-white rounded border border-blue-500 text-blue-500 text-sm font-weight-500 hover:bg-blue-50"
            >
              Close
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-5">
          <Field label="Task Title">
            <input className={inputCls} placeholder="Enter Title" value={form.title}
              onChange={(e) => set("title", e.target.value)} />
          </Field>

          <Field label="Description/Notes">
            <textarea className="w-full min-h-[110px] px-4 py-3 bg-white rounded border border-neutral-200 outline-none text-neutral-700 font-light resize-none focus:border-blue-500"
              placeholder="Add text" value={form.description}
              onChange={(e) => set("description", e.target.value)} />
          </Field>

          <Field label="Assigned User">
            <select className={selectCls} value={form.assigned_user}
              onChange={(e) => set("assigned_user", e.target.value)}>
              <option value="">Value</option>
              {SAMPLE_USERS.map((u) => <option key={u} value={u}>{u}</option>)}
            </select>
          </Field>

          <Field label="Department">
            <select className={selectCls} value={form.department}
              onChange={(e) => set("department", e.target.value)}>
              <option value="">Value</option>
              {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Due Date">
              <DatePickerField value={form.due_date} onChange={(v) => set("due_date", v)} />
            </Field>
            <Field label="Due Time">
              <input type="time" className={inputCls} value={form.due_time}
                onChange={(e) => set("due_time", e.target.value)} />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Priority">
              <select className={selectCls} value={form.priority}
                onChange={(e) => set("priority", e.target.value)}>
                {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </Field>
            <Field label="Status">
              <select className={selectCls} value={form.status}
                onChange={(e) => set("status", e.target.value)}>
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
          </div>

          <Field label="Claim Reference">
            <select className={selectCls} value={form.claim_id}
              onChange={(e) => {
                const id = e.target.value;
                const c = claims.find((x) => String(x.id) === id);
                set("claim_id", id);
                set("claim_reference", c?.ref ?? "");
              }}>
              <option value="">Value</option>
              {claims.map((c) => <option key={c.id} value={c.id}>{c.ref}</option>)}
            </select>
          </Field>

          <Field label="Vehicle Reg.">
            <input className={inputCls} placeholder="Value" value={form.vehicle_registration}
              onChange={(e) => set("vehicle_registration", e.target.value)} />
          </Field>

          <Field label="Attachment Upload">
            <label className="border border-dashed border-neutral-300 rounded-lg p-8 flex flex-col items-center gap-2 cursor-pointer hover:border-blue-400">
              <UploadCloud size={28} className="text-blue-400" />
              <span className="text-neutral-700 text-sm font-weight-600 text-center break-all px-2">
                {uploading
                  ? "Uploading…"
                  : form.attachment_path
                    ? form.attachment_path.split("/").pop() || "File attached"
                    : "Choose a file or Drag & Drop here"}
              </span>
              <span className="text-neutral-400 text-xs">JPG, PNG, PDF, CSV Supported</span>
              <input
                type="file"
                className="hidden"
                accept=".jpg,.jpeg,.png,.pdf,.csv"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setUploading(true);
                  try {
                    const { data } = await uploadTaskFile(file);
                    set("attachment_path", data.path);
                    toast.success("File uploaded");
                  } catch {
                    toast.error("Upload failed");
                  } finally {
                    setUploading(false);
                  }
                }}
              />
            </label>
            {form.attachment_path && !uploading && (
              <a
                href={`${API_BASE_URL.replace(/\/$/, "")}${form.attachment_path}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 text-xs hover:underline mt-1 inline-block"
              >
                View attachment
              </a>
            )}
          </Field>
        </div>
      </div>
    </div>
  );
};

// ─── pagination ──────────────────────────────────────────────────────────────────

const Pagination = ({
  page, totalPages, onChange,
}: { page: number; totalPages: number; onChange: (p: number) => void }) => {
  if (totalPages <= 1) return null;
  const pages: (number | string)[] = [];
  const max = Math.min(totalPages, 8);
  for (let i = 1; i <= max; i++) pages.push(i);
  if (totalPages > 8) { pages.push("…"); pages.push(totalPages); }
  return (
    <div className="flex items-center text-sm font-['Inter']">
      <button disabled={page === 1} onClick={() => onChange(page - 1)}
        className="h-9 px-3 bg-white rounded-l border border-neutral-200 text-neutral-600 disabled:opacity-40">
        Previous
      </button>
      {pages.map((p, i) =>
        typeof p === "number" ? (
          <button key={i} onClick={() => onChange(p)}
            className={`w-9 h-9 border border-neutral-200 -ml-px ${p === page ? "bg-blue-100 text-black" : "bg-white text-neutral-600"}`}>
            {p}
          </button>
        ) : (
          <span key={i} className="w-9 h-9 border border-neutral-200 -ml-px bg-white text-neutral-400 flex items-center justify-center">…</span>
        ),
      )}
      <button disabled={page === totalPages} onClick={() => onChange(page + 1)}
        className="h-9 px-3 -ml-px bg-white rounded-r border border-neutral-200 text-blue-500 disabled:opacity-40">
        Next
      </button>
    </div>
  );
};

// ─── main ────────────────────────────────────────────────────────────────────────

const Tasks: React.FC<{ initialFilters?: TaskFilters }> = ({ initialFilters }) => {
  const navigate = useNavigate();

  const [stats, setStats] = useState<any>({ total: 0, pending: 0, in_progress: 0, overdue: 0, completed: 0 });
  const [tasks, setTasks] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [view, setView] = useState<"list" | "card">("list");
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<TaskFilters>(initialFilters ?? {});
  const [loading, setLoading] = useState(false);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [claims, setClaims] = useState<{ id: number; ref: string }[]>([]);
  const [vehicleRegs, setVehicleRegs] = useState<string[]>([]);

  // Overdue notifications
  const [notifOpen, setNotifOpen] = useState(false);
  const [overdueTasks, setOverdueTasks] = useState<any[]>([]);
  const notifRef = useRef<HTMLDivElement>(null);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const fetchOverdue = () => {
    listTasks({ status: "Overdue", page_size: 50 })
      .then(({ data }) => setOverdueTasks(data?.items ?? []))
      .catch(() => setOverdueTasks([]));
  };

  const fetchStats = () => {
    getTaskStats().then(({ data }) => setStats(data)).catch(() => {});
  };

  const fetchTasks = () => {
    setLoading(true);
    listTasks({ ...filters, search, page, page_size: PAGE_SIZE })
      .then(({ data }) => {
        setTasks(data?.items ?? []);
        setTotal(data?.total ?? 0);
      })
      .catch(() => { setTasks([]); setTotal(0); })
      .finally(() => setLoading(false));
  };

  // Load claims for the Claim Reference dropdown
  useEffect(() => {
    getClaims()
      .then((res: any) => {
        const arr = Array.isArray(res) ? res : res?.data ?? res?.items ?? [];
        setClaims(
          arr
            .map((c: any) => ({
              id: c.claim_id ?? c.id,
              ref: c.our_reference || c.claim_no || c.claim_number || `CLM-${c.claim_id ?? c.id}`,
            }))
            .filter((c: any) => c.id),
        );
      })
      .catch(() => {});
  }, []);

  useEffect(() => { fetchStats(); }, []);

  // Distinct vehicle registrations for the Vehicle Reg. filter dropdown
  useEffect(() => {
    listTasks({ page_size: 100 })
      .then(({ data }) => {
        const regs = Array.from(
          new Set((data?.items ?? []).map((t: any) => t.vehicle_registration).filter(Boolean)),
        ) as string[];
        setVehicleRegs(regs);
      })
      .catch(() => {});
  }, []);

  // Overdue notifications: prime the list on mount; close panel on outside click
  useEffect(() => { fetchOverdue(); }, []);
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
    };
    if (notifOpen) document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [notifOpen]);

  // Debounced search + filter/page driven fetch
  useEffect(() => {
    const t = setTimeout(fetchTasks, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, filters, page]);

  const setFilter = (key: keyof TaskFilters, value: string) => {
    setPage(1);
    setFilters((f) => ({ ...f, [key]: value || undefined }));
  };

  const refresh = () => { fetchTasks(); fetchStats(); fetchOverdue(); };

  const handleAction = async (action: string, task: any) => {
    try {
      if (action === "complete") {
        await updateTask(task.id, { status: "Completed" });
        toast.success("Task marked complete");
        refresh();
      } else if (action === "edit") {
        setEditing(task);
        setDrawerOpen(true);
      } else if (action === "note") {
        const note = window.prompt("Add note", task.notes || "");
        if (note !== null) { await updateTask(task.id, { notes: note }); toast.success("Note added"); refresh(); }
      } else if (action === "reassign") {
        const user = window.prompt("Reassign to", task.assigned_user || "");
        if (user !== null) { await updateTask(task.id, { assigned_user: user }); toast.success("Task reassigned"); refresh(); }
      } else if (action === "open_claim") {
        if (task.claim_id) navigate(`/add-claim/${task.claim_id}`);
      }
    } catch {
      toast.error("Action failed");
    }
  };

  const openClaim = (task: any) => {
    if (task.claim_id) navigate(`/add-claim/${task.claim_id}`);
  };

  const rangeStart = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(page * PAGE_SIZE, total);

  return (
    <>
      {/* Header */}
      <div className="h-20 px-10 py-4 border-b border-neutral-100 flex justify-between items-center shrink-0">
        <h1 className="text-neutral-900 text-2xl font-weight-600">Tasks</h1>
        <div className="flex items-center gap-6 text-neutral-500">
          <Search size={20} />
          <div className="relative" ref={notifRef}>
            <button
              type="button"
              onClick={() => {
                setNotifOpen((o) => !o);
                if (!notifOpen) fetchOverdue();
              }}
              className="relative text-neutral-500 hover:text-neutral-700"
            >
              <Bell size={20} />
              {stats.overdue > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 bg-red-500 text-white text-[10px] font-weight-600 rounded-full flex items-center justify-center">
                  {stats.overdue}
                </span>
              )}
            </button>
            {notifOpen && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-lg border border-neutral-200 shadow-xl z-50 font-['Stack_Sans_Headline']">
                <div className="px-4 py-3 border-b border-neutral-100 flex items-center justify-between">
                  <span className="text-sm font-weight-600 text-neutral-900">
                    Overdue Tasks
                  </span>
                  <span className="text-xs text-red-500 font-weight-600">
                    {stats.overdue}
                  </span>
                </div>
                <div className="max-h-80 overflow-auto">
                  {overdueTasks.length === 0 ? (
                    <div className="px-4 py-6 text-center text-neutral-400 text-sm">
                      No overdue tasks
                    </div>
                  ) : (
                    overdueTasks.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => {
                          setEditing(t);
                          setDrawerOpen(true);
                          setNotifOpen(false);
                        }}
                        className="w-full text-left px-4 py-3 border-b border-neutral-50 last:border-0 hover:bg-red-50"
                      >
                        <div className="flex items-start gap-2">
                          <AlertCircle
                            size={16}
                            className="text-red-500 mt-0.5 shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="text-sm font-weight-600 text-neutral-900 truncate">
                              {t.title}
                            </div>
                            <div className="text-xs text-neutral-500">
                              Due {formatDue(t)}
                              {t.assigned_user ? ` · ${t.assigned_user}` : ""}
                            </div>
                            {t.claim_reference && (
                              <div className="text-xs text-blue-500">
                                {t.claim_reference}
                              </div>
                            )}
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
                {stats.overdue > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setFilter("status", "Overdue");
                      setNotifOpen(false);
                    }}
                    className="w-full px-4 py-2.5 text-center text-sm text-blue-500 font-weight-500 hover:bg-blue-50 border-t border-neutral-100"
                  >
                    View all overdue
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <section className="px-10 py-6 flex-1 overflow-auto font-['Stack_Sans_Headline']">
        {/* Summary cards */}
        <div className="grid grid-cols-5 gap-4 mb-6">
          {SUMMARY_META.map((m) => (
            <SummaryCard
              key={m.key}
              label={m.label}
              value={stats[m.key] ?? 0}
              bg={m.bg}
              Icon={m.Icon}
            />
          ))}
        </div>

        {/* Search + view toggle + add */}
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex-1 max-w-[520px] px-5 py-3 bg-white rounded border border-neutral-200 flex items-center">
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search task"
              className="w-full outline-none text-base font-light text-neutral-700 placeholder:text-neutral-300"
            />
          </div>
          <div className="flex items-center gap-3">
            {/* View toggle CTA */}
            <div className="flex items-center rounded border border-neutral-200 overflow-hidden">
              <button
                type="button"
                onClick={() => setView("list")}
                className={`px-3 py-2.5 flex items-center gap-1.5 text-sm ${view === "list" ? "bg-blue-500 text-white" : "bg-white text-neutral-600"}`}
              >
                <ListIcon size={16} />
              </button>
              <button
                type="button"
                onClick={() => setView("card")}
                className={`px-3 py-2.5 flex items-center gap-1.5 text-sm ${view === "card" ? "bg-blue-500 text-white" : "bg-white text-neutral-600"}`}
              >
                <LayoutGrid size={16} />
              </button>
            </div>
            <button
              type="button"
              onClick={() => {
                setEditing(null);
                setDrawerOpen(true);
              }}
              className="px-8 py-3 bg-blue-500 rounded text-white text-base font-weight-500 hover:bg-blue-600 flex items-center gap-2"
            >
              <Plus size={18} /> Add Task
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-6 flex-wrap mb-5">
          <div className="flex items-center gap-12 flex-wrap">
            <FilterDropdown
              label="Priority"
              value={filters.priority || ""}
              options={PRIORITIES}
              onChange={(v) => setFilter("priority", v)}
            />
            <FilterDropdown
              label="Status"
              value={filters.status || ""}
              options={STATUSES}
              onChange={(v) => setFilter("status", v)}
            />
            <FilterDropdown
              label="Department"
              value={filters.department || ""}
              options={DEPARTMENTS}
              onChange={(v) => setFilter("department", v)}
            />
            <FilterDropdown
              label="Assigned to"
              value={filters.assigned_user || ""}
              options={SAMPLE_USERS}
              onChange={(v) => setFilter("assigned_user", v)}
            />
            <FilterDropdown
              label="Claim"
              value={filters.claim_reference || ""}
              options={claims.map((c) => c.ref)}
              onChange={(v) => setFilter("claim_reference", v)}
            />
            <FilterDropdown
              label="Vehicle Reg."
              value={filters.vehicle_registration || ""}
              options={vehicleRegs}
              onChange={(v) => setFilter("vehicle_registration", v)}
            />
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-neutral-700 text-sm">Date Range</span>
            <DatePickerField
              value={filters.due_from || ""}
              onChange={(v) => setFilter("due_from", v)}
              placeholder="From"
              align="left"
              triggerClassName="w-36 h-11 px-3 bg-white rounded border border-neutral-200 flex items-center justify-between cursor-pointer text-sm"
            />
            <DatePickerField
              value={filters.due_to || ""}
              onChange={(v) => setFilter("due_to", v)}
              placeholder="To"
              align="left"
              triggerClassName="w-36 h-11 px-3 bg-white rounded border border-neutral-200 flex items-center justify-between cursor-pointer text-sm"
            />
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="py-20 text-center text-neutral-400 text-sm">
            Loading tasks…
          </div>
        ) : tasks.length === 0 ? (
          <div className="py-20 text-center text-neutral-400 text-sm">
            No tasks found.
          </div>
        ) : view === "list" ? (
          <div className="rounded-lg border border-neutral-100 overflow-hidden">
            <table className="w-full border-collapse">
              <thead>
                <tr className="h-12 bg-neutral-100 text-neutral-900 text-sm font-weight-600 text-left">
                  <th className="px-4">TASK</th>
                  <th className="px-4">DEPARTMENT</th>
                  <th className="px-4 w-[125px]">ASSIGNED TO</th>
                  <th className="px-4 w-[180px]">CLAIM</th>
                  <th className="px-4">VEHICLE</th>
                  <th className="px-4 w-[140px]">DUE DATE</th>
                  <th className="px-4 w-[113px]">STATUS</th>
                  <th className="px-4">PRIORITY</th>
                  <th className="px-4 w-10" />
                </tr>
              </thead>
              <tbody>
                {tasks.map((t) => (
                  <tr
                    key={t.id}
                    className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50 align-top"
                  >
                    <td className="px-4 py-4 max-w-[300px]">
                      <div className="text-neutral-900 text-sm font-weight-600">
                        {t.title}
                      </div>
                      {t.description && (
                        <div className="text-neutral-500 text-xs font-weight-400 mt-1 line-clamp-2">
                          {t.description}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4 text-sm text-neutral-700 ">
                      {t.department || "—"}
                    </td>
                    <td className="px-4 py-4 text-sm text-neutral-700 ">
                      {t.assigned_user || "—"}
                    </td>
                    <td className="px-4 py-4 text-sm">
                      {t.claim_reference ? (
                        <button
                          onClick={() => openClaim(t)}
                          className="text-blue-300 hover:underline"
                        >
                          {t.claim_reference}
                        </button>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-4 text-sm text-neutral-700">
                      {t.vehicle_registration || "—"}
                    </td>
                    <td className="px-4 py-4 text-sm text-neutral-700">
                      {formatDue(t)}
                    </td>
                    <td className="px-4 py-4">
                      <Badge
                        text={
                          t.is_overdue &&
                          (t.status || "").toLowerCase() !== "completed"
                            ? "Overdue"
                            : t.status
                        }
                        cls={statusBadge(
                          t.is_overdue &&
                            (t.status || "").toLowerCase() !== "completed"
                            ? "Overdue"
                            : t.status,
                        )}
                      />
                    </td>
                    <td className="px-4 py-4">
                      <Badge
                        text={t.priority}
                        cls={priorityBadge(t.priority)}
                      />
                    </td>
                    <td className="px-4 py-4">
                      <QuickActions task={t} onAction={handleAction} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {tasks.map((t) => (
              <div
                key={t.id}
                className="rounded-lg border border-neutral-200 p-5 flex flex-col gap-3 hover:shadow-sm transition"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-neutral-900 text-base font-weight-600">
                      {t.title}
                    </div>
                    {t.description && (
                      <div className="text-neutral-500 text-sm mt-1 line-clamp-2">
                        {t.description}
                      </div>
                    )}
                  </div>
                  <QuickActions task={t} onAction={handleAction} />
                </div>
                <div className="text-sm">
                  {t.claim_reference && (
                    <span
                      className="text-blue-500 cursor-pointer hover:underline mr-2"
                      onClick={() => openClaim(t)}
                    >
                      {t.claim_reference}
                    </span>
                  )}
                  <span className="text-neutral-600">
                    {t.vehicle_registration || ""}
                  </span>
                </div>
                <div className="text-sm text-neutral-700">
                  Assigned to:{" "}
                  <span className="font-weight-600">
                    {t.assigned_user || "—"}
                  </span>
                </div>
                <div className="text-sm text-neutral-700">
                  Department:{" "}
                  <span className="font-weight-600">{t.department || "—"}</span>
                </div>
                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-2">
                    <Badge
                      text={
                        t.is_overdue &&
                        (t.status || "").toLowerCase() !== "completed"
                          ? "Overdue"
                          : t.status
                      }
                      cls={statusBadge(
                        t.is_overdue &&
                          (t.status || "").toLowerCase() !== "completed"
                          ? "Overdue"
                          : t.status,
                      )}
                    />
                    <Badge text={t.priority} cls={priorityBadge(t.priority)} />
                  </div>
                  <span className="text-neutral-600 text-xs">
                    Due: <span className="font-weight-600">{formatDue(t)}</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer / pagination */}
        <div className="mt-6 flex justify-between items-center">
          <div className="text-xs">
            <span className="text-neutral-600">Showing </span>
            <span className="text-black font-weight-600">{rangeStart}</span>
            <span className="text-neutral-600"> to </span>
            <span className="text-black font-weight-600">{rangeEnd}</span>
            <span className="text-neutral-600"> of </span>
            <span className="text-black font-weight-600">{total}</span>
            <span className="text-neutral-600"> Entries</span>
          </div>
          <Pagination page={page} totalPages={totalPages} onChange={setPage} />
        </div>
      </section>

      <AddTaskDrawer
        open={drawerOpen}
        editing={editing}
        claims={claims}
        onClose={() => {
          setDrawerOpen(false);
          setEditing(null);
        }}
        onSaved={refresh}
      />
    </>
  );
};

export default Tasks;
