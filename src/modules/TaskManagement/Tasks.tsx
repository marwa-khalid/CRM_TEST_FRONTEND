import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import Select from "react-select";
import CreatableSelect from "react-select/creatable";
import {
  Search,
  Bell,
  Plus,
  List as ListIcon,
  LayoutGrid,
  MoreVertical,
  ChevronDown,
  UploadCloud,
  Check,
  X,
  Trash2,
} from "lucide-react";
import NotificationsPanel, { type NotifItem, buildTaskNotifications } from "./Notifications";
import TotalTasks from '../../assets/TaskManagement/TotalTasks.svg'
import Pending from "../../assets/TaskManagement/Pending.svg";
import InProgress from '../../assets/TaskManagement/InProgress.svg'
import Overdue from '../../assets/TaskManagement/Overdue.svg'
import Complete from "../../assets/TaskManagement/Complete.svg";

import {
  listTasks,
  getTaskStats,
  getVehicleOptions,
  createTask,
  updateTask,
  deleteTask,
  type TaskFilters,
  type TaskPayload,
} from "../../services/Tasks/Tasks";
import { getClaims } from "../../services/Claims/Claims";
import { API_BASE_URL } from "../../services/axiosConfig";
import { CustomDatePicker } from "../Claims/Components/DatePicker";
import { customStyles, BlueDropdownIndicator } from "../Claims/Steps/GeneralDetailsForm";
import { ConfirmModal } from "../../components/common/ConfirmModal";
import { SpinnerLoader } from "../../components/common/SpinnerLoader";
import TaskAttachmentModal, { fileLogo } from "./TaskAttachmentModal";
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
  "Imran Dean",
  "Hina Sadaf",
  "Ruby Ud Din",
  "Akeel Rehman",
  "Tariq Hussain",
  "Ali Pervaiz",
  "Alex"
];

// Filter keys that support multi-select
const MULTI_KEYS = [
  "priority",
  "status",
  "department",
  "assigned_user",
  "claim_reference",
  "vehicle_registration",
] as const;
type MultiKey = (typeof MULTI_KEYS)[number];
type MultiState = Record<MultiKey, string[]>;

// react-select shares the same styling as the claim forms; portal the menu so
// it isn't clipped by the scrollable drawer body.
const selectStyles: any = {
  ...customStyles,
  menuPortal: (base: any) => ({ ...base, zIndex: 80 }),
};
const opt = (v: string) => ({ label: v, value: v });
const opts = (arr: string[]) => arr.map(opt);

// 15-minute interval time options (editable via CreatableSelect)
const TIME_OPTIONS = (() => {
  const times: { label: string; value: string }[] = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 15) {
      const t = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
      times.push({ label: t, value: t });
    }
  }
  return times;
})();
const normalizeTime = (value: string) => {
  if (!value) return "";
  const [hour, minute] = value.split(":");
  const h = Math.min(Math.max(Number(hour || 0), 0), 23);
  const m = Math.min(Math.max(Number(minute || 0), 0), 59);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
};
const isValidTime = (value: string) => /^([01]?\d|2[0-3]):[0-5]\d$/.test(value);

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

// Format a Date as a LOCAL "YYYY-MM-DD". Using toISOString() here would shift
// the day by the timezone offset (e.g. picking the 9th would store the 8th).
const toLocalISODate = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
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
  const popRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);
  // Position the calendar with fixed coords, anchored under the box and clamped
  // to the viewport so it can never overflow off-screen.
  useLayoutEffect(() => {
    if (!open || !ref.current) { setPos(null); return; }
    const r = ref.current.getBoundingClientRect();
    const w = popRef.current?.offsetWidth || 320;
    let left = align === "right" ? r.right - w : r.left;
    left = Math.max(8, Math.min(left, window.innerWidth - w - 8));
    // Open just below the field.
    const top = r.bottom - 50;
    setPos({ top, left });
  }, [open, align]);
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
        <div
          ref={popRef}
          style={{
            position: "fixed",
            top: pos?.top ?? 0,
            left: pos?.left ?? 0,
            visibility: pos ? "visible" : "hidden",
            zIndex: 60,
          }}
          className="shadow-xl rounded-lg bg-white"
        >
          <CustomDatePicker
            selectedDate={value ? new Date(value + "T00:00:00") : new Date()}
            onDateSelect={(date: Date) => {
              onChange(toLocalISODate(date));
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

// ─── multi-select filter dropdown ────────────────────────────────────────────────

const MultiFilterDropdown = ({
  label, options, selected, onToggle, onClear,
}: {
  label: string;
  options: string[];
  selected: string[];
  onToggle: (v: string) => void;
  onClear: () => void;
}) => {
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
        {selected.length > 0 && (
          <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-blue-500 text-white text-[11px] flex items-center justify-center">
            {selected.length}
          </span>
        )}
        {label}
        <ChevronDown size={14} />
      </button>
      {open && (
        <div className="absolute z-30 top-full mt-1 left-0 min-w-[210px] bg-white rounded-lg border border-neutral-200 shadow-lg py-1 max-h-72 overflow-auto">
          {selected.length > 0 && (
            <button
              type="button"
              onClick={onClear}
              className="w-full text-left px-4 py-2 text-xs text-neutral-500 hover:bg-neutral-50 border-b border-neutral-100"
            >
              Clear {label}
            </button>
          )}
          {options.length === 0 ? (
            <div className="px-4 py-2 text-sm text-neutral-400">No options</div>
          ) : (
            options.map((o) => {
              const checked = selected.includes(o);
              return (
                <button
                  key={o}
                  type="button"
                  onClick={() => onToggle(o)}
                  className="w-full flex items-center gap-2 text-left px-4 py-2 text-sm hover:bg-blue-50 text-neutral-700"
                >
                  <span
                    className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                      checked ? "bg-blue-500 border-blue-500" : "border-neutral-300"
                    }`}
                  >
                    {checked && <Check size={12} className="text-white" />}
                  </span>
                  <span className="truncate">{o}</span>
                </button>
              );
            })
          )}
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
    { key: "edit", label: "Edit Task" },
    { key: "delete", label: "Delete Task", danger: true },
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
        <div className="absolute z-30 top-full mt-1 right-0 min-w-[180px] bg-white rounded-lg border border-neutral-200 shadow-lg py-1">
          {items.map((it) => (
            <button
              key={it.key}
              type="button"
              onClick={() => { setOpen(false); onAction(it.key, task); }}
              className={`w-full text-left px-4 py-2 text-sm hover:bg-blue-50 ${
                (it as any).danger ? "text-red-600 hover:bg-red-50" : "text-neutral-700"
              }`}
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

const AddTaskDrawer = ({
  open, editing, claims, vehicleRegs, onClose, onSaved,
}: {
  open: boolean;
  editing: any | null;
  claims: { id: number; ref: string }[];
  vehicleRegs: string[];
  onClose: () => void;
  onSaved: () => void;
}) => {
  const [form, setForm] = useState<any>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [attachmentOpen, setAttachmentOpen] = useState(false);

  const claimOptions = claims.map((c) => ({ label: c.ref, value: String(c.id) }));

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

  const selectProps = {
    styles: selectStyles,
    menuPortalTarget: typeof document !== "undefined" ? document.body : undefined,
    components: { DropdownIndicator: BlueDropdownIndicator, IndicatorSeparator: () => null },
  } as any;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {saving && <SpinnerLoader />}
      {attachmentOpen && (
        <TaskAttachmentModal
          onClose={() => setAttachmentOpen(false)}
          onUploaded={(path) => set("attachment_path", path)}
        />
      )}
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full max-w-[600px] h-full bg-white shadow-xl flex flex-col font-['Stack_Sans_Headline']">
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
        <div className="flex-1 always-scrollbar p-6 flex flex-col gap-5">
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
            <Select
              options={opts(SAMPLE_USERS)}
              value={form.assigned_user ? opt(form.assigned_user) : null}
              onChange={(o: any) => set("assigned_user", o?.value || "")}
              placeholder="Select user"
              isClearable
              {...selectProps}
            />
          </Field>

          <Field label="Department">
            <Select
              options={opts(DEPARTMENTS)}
              value={form.department ? opt(form.department) : null}
              onChange={(o: any) => set("department", o?.value || "")}
              placeholder="Select department"
              isClearable
              {...selectProps}
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Due Date">
              <DatePickerField value={form.due_date} onChange={(v) => set("due_date", v)} />
            </Field>
            <Field label="Due Time">
              <CreatableSelect
                options={TIME_OPTIONS}
                value={form.due_time ? { label: form.due_time, value: form.due_time } : null}
                onChange={(o: any) => set("due_time", o?.value || "")}
                onCreateOption={(input: string) => {
                  if (isValidTime(input)) set("due_time", normalizeTime(input));
                  else toast.error("Please enter time in HH:mm format");
                }}
                placeholder="Select or type time"
                isSearchable
                {...selectProps}
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Priority">
              <Select
                options={opts(PRIORITIES)}
                value={form.priority ? opt(form.priority) : null}
                onChange={(o: any) => set("priority", o?.value || "")}
                placeholder="Select priority"
                {...selectProps}
              />
            </Field>
            <Field label="Status">
              <Select
                options={opts(STATUSES)}
                value={form.status ? opt(form.status) : null}
                onChange={(o: any) => set("status", o?.value || "")}
                placeholder="Select status"
                {...selectProps}
              />
            </Field>
          </div>

          <Field label="Claim Reference">
            <Select
              options={claimOptions}
              value={form.claim_id ? claimOptions.find((c) => c.value === String(form.claim_id)) ?? null : null}
              onChange={(o: any) => {
                set("claim_id", o?.value || "");
                set("claim_reference", o?.label || "");
              }}
              placeholder="Select claim"
              isClearable
              isSearchable
              {...selectProps}
            />
          </Field>

          <Field label="Vehicle Reg.">
            <CreatableSelect
              options={opts(vehicleRegs)}
              value={form.vehicle_registration ? opt(form.vehicle_registration) : null}
              onChange={(o: any) => set("vehicle_registration", o?.value || "")}
              onCreateOption={(input: string) => set("vehicle_registration", input.trim())}
              placeholder="Select or add registration"
              formatCreateLabel={(input: string) => `Add "${input}"`}
              isClearable
              isSearchable
              {...selectProps}
            />
          </Field>

          <Field label="Attachment Upload">
            {form.attachment_path ? (
              <div className="flex items-center gap-3 p-3 rounded-lg border border-neutral-200">
                <img src={fileLogo(form.attachment_path)} alt="" className="w-9 h-9" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-neutral-800 truncate">
                    {form.attachment_path.split("/").pop()}
                  </div>
                  <a
                    href={`${API_BASE_URL.replace(/\/$/, "")}${form.attachment_path}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 text-xs hover:underline"
                  >
                    View attachment
                  </a>
                </div>
                <div className="flex items-center gap-3">
                  {/* <button
                    type="button"
                    onClick={() => setAttachmentOpen(true)}
                    className="text-blue-500 text-xs hover:underline"
                  >
                    Replace
                  </button> */}
                  <button
                    type="button"
                    onClick={() => set("attachment_path", "")}
                    className="text-neutral-400 hover:text-red-500"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setAttachmentOpen(true)}
                className="w-full border border-dashed border-neutral-300 rounded-lg p-8 flex flex-col items-center gap-2 cursor-pointer hover:border-blue-400"
              >
                <UploadCloud size={28} className="text-blue-400" />
                <span className="text-neutral-700 text-sm font-weight-600">Add Attachment</span>
                <span className="text-neutral-400 text-xs">JPG, PNG, PDF, CSV Supported</span>
              </button>
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
            className={`w-9 h-9 border border-neutral-200 -ml-px ${p === page ? "bg-blue-100 text-black font-weight-600" : "bg-white text-neutral-600"}`}>
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

const seedMulti = (init?: TaskFilters): MultiState => ({
  priority: init?.priority ? [init.priority] : [],
  status: init?.status ? [init.status] : [],
  department: init?.department ? [init.department] : [],
  assigned_user: init?.assigned_user ? [init.assigned_user] : [],
  claim_reference: init?.claim_reference ? [init.claim_reference] : [],
  vehicle_registration: init?.vehicle_registration ? [init.vehicle_registration] : [],
});

const Tasks: React.FC<{ initialFilters?: TaskFilters }> = ({ initialFilters }) => {
  const navigate = useNavigate();

  const [stats, setStats] = useState<any>({ total: 0, pending: 0, in_progress: 0, overdue: 0, completed: 0 });
  const [tasks, setTasks] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [view, setView] = useState<"list" | "card">("list");
  const [search, setSearch] = useState("");
  const [multi, setMulti] = useState<MultiState>(seedMulti(initialFilters));
  const [dateRange, setDateRange] = useState({
    due_from: initialFilters?.due_from || "",
    due_to: initialFilters?.due_to || "",
  });
  const [loading, setLoading] = useState(false);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [claims, setClaims] = useState<{ id: number; ref: string }[]>([]);
  const [vehicleRegs, setVehicleRegs] = useState<string[]>([]);

  // selection + delete
  const [selected, setSelected] = useState<number[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [bulkConfirm, setBulkConfirm] = useState(false);

  // Notifications
  const [notifOpen, setNotifOpen] = useState(false);
  const [overdueTasks, setOverdueTasks] = useState<any[]>([]);
  const [dueToday, setDueToday] = useState<any[]>([]);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const notifRef = useRef<HTMLDivElement>(null);

  // List view shows 10 per page, card view shows 9 per page
  const pageSize = view === "card" ? 9 : 10;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const buildParams = (): TaskFilters => ({
    priority: multi.priority.join(",") || undefined,
    status: multi.status.join(",") || undefined,
    department: multi.department.join(",") || undefined,
    assigned_user: multi.assigned_user.join(",") || undefined,
    claim_reference: multi.claim_reference.join(",") || undefined,
    vehicle_registration: multi.vehicle_registration.join(",") || undefined,
    due_from: dateRange.due_from || undefined,
    due_to: dateRange.due_to || undefined,
  });

  const fetchOverdue = () => {
    listTasks({ status: "Overdue", page_size: 50 })
      .then(({ data }) => setOverdueTasks(data?.items ?? []))
      .catch(() => setOverdueTasks([]));
  };

  const fetchDueToday = () => {
    const today = new Date().toISOString().split("T")[0];
    listTasks({ due_from: today, due_to: today, page_size: 50 })
      .then(({ data }) =>
        setDueToday(
          (data?.items ?? []).filter(
            (t: any) => !["Completed", "Rejected"].includes(t.status),
          ),
        ),
      )
      .catch(() => setDueToday([]));
  };

  // Build the notification feed: real task alerts + static placeholders
  const notifications = useMemo<NotifItem[]>(
    () => buildTaskNotifications(overdueTasks, dueToday),
    [overdueTasks, dueToday],
  );

  const unreadCount = notifications.filter((n) => n.unread && !readIds.has(n.id)).length;

  const markAllRead = () => setReadIds(new Set(notifications.map((n) => n.id)));
  const handleNotifClick = (n: NotifItem) => {
    setReadIds((prev) => new Set(prev).add(n.id));
    if (n.taskId) {
      const task = [...overdueTasks, ...dueToday].find((t) => t.id === n.taskId);
      if (task) {
        setEditing(task);
        setDrawerOpen(true);
      }
    }
    setNotifOpen(false);
  };

  const fetchStats = () => {
    getTaskStats().then(({ data }) => setStats(data)).catch(() => {});
  };

  const fetchTasks = () => {
    setLoading(true);
    listTasks({ ...buildParams(), search, page, page_size: pageSize })
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

  // Distinct vehicle registrations (tenant-wide) for the Vehicle Reg. dropdown + filter
  const fetchVehicleOptions = () => {
    getVehicleOptions()
      .then(({ data }) => setVehicleRegs(Array.isArray(data) ? data : []))
      .catch(() => {});
  };
  useEffect(() => { fetchVehicleOptions(); }, []);

  // Notifications: prime the lists on mount; close panel on outside click
  useEffect(() => { fetchOverdue(); fetchDueToday(); }, []);
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
  }, [search, multi, dateRange, page, pageSize]);

  // ----- filter handlers -----
  const toggleFilter = (key: MultiKey, value: string) => {
    setPage(1);
    setMulti((m) => {
      const arr = m[key];
      return { ...m, [key]: arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value] };
    });
  };
  const clearFilter = (key: MultiKey) => {
    setPage(1);
    setMulti((m) => ({ ...m, [key]: [] }));
  };
  const removeFilter = (key: MultiKey, value: string) => {
    setPage(1);
    setMulti((m) => ({ ...m, [key]: m[key].filter((v) => v !== value) }));
  };
  const clearAllFilters = () => {
    setPage(1);
    setMulti(seedMulti());
  };
  const setDate = (key: "due_from" | "due_to", value: string) => {
    setPage(1);
    setDateRange((d) => ({ ...d, [key]: value }));
  };

  const refresh = () => { fetchTasks(); fetchStats(); fetchOverdue(); fetchDueToday(); fetchVehicleOptions(); };

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
        else toast.info("No linked claim");
      } else if (action === "delete") {
        setDeleteTarget(task);
      }
    } catch {
      toast.error("Action failed");
    }
  };

  const openClaim = (task: any) => {
    if (task.claim_id) navigate(`/add-claim/${task.claim_id}`);
  };

  // ----- selection -----
  const allSelected = tasks.length > 0 && tasks.every((t) => selected.includes(t.id));
  const toggleAll = () => {
    const ids = tasks.map((t) => t.id);
    setSelected((s) =>
      allSelected ? s.filter((id) => !ids.includes(id)) : Array.from(new Set([...s, ...ids])),
    );
  };
  const toggleOne = (id: number) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const confirmDeleteSingle = async () => {
    if (!deleteTarget) return;
    try {
      await deleteTask(deleteTarget.id);
      toast.success("Task deleted");
      setSelected((s) => s.filter((id) => id !== deleteTarget.id));
      refresh();
    } catch {
      toast.error("Failed to delete task");
    } finally {
      setDeleteTarget(null);
    }
  };
  const confirmDeleteBulk = async () => {
    try {
      await Promise.all(selected.map((id) => deleteTask(id)));
      toast.success(`${selected.length} task(s) deleted`);
      setSelected([]);
      refresh();
    } catch {
      toast.error("Failed to delete tasks");
    } finally {
      setBulkConfirm(false);
    }
  };

  const rangeStart = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, total);

  const activePills = MULTI_KEYS.flatMap((k) => multi[k].map((v) => ({ key: k, value: v })));

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
                if (!notifOpen) {
                  fetchOverdue();
                  fetchDueToday();
                }
              }}
              className="relative text-neutral-500 hover:text-neutral-700"
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 bg-red-500 text-white text-[10px] font-weight-600 rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>
            {notifOpen && (
              <div className="absolute right-0 top-full mt-2 z-50">
                <NotificationsPanel
                  items={notifications}
                  readIds={readIds}
                  onMarkAllRead={markAllRead}
                  onItemClick={handleNotifClick}
                />
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
                onClick={() => {
                  setView("list");
                  setPage(1);
                }}
                className={`px-3 py-2.5 flex items-center gap-1.5 text-sm ${view === "list" ? "bg-blue-500 text-white" : "bg-white text-neutral-600"}`}
              >
                <ListIcon size={16} />
              </button>
              <button
                type="button"
                onClick={() => {
                  setView("card");
                  setPage(1);
                }}
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
        <div className="flex items-center gap-6 flex-wrap mb-3">
          <div className="flex items-center gap-12 flex-wrap">
            <MultiFilterDropdown
              label="Priority"
              options={PRIORITIES}
              selected={multi.priority}
              onToggle={(v) => toggleFilter("priority", v)}
              onClear={() => clearFilter("priority")}
            />
            <MultiFilterDropdown
              label="Status"
              options={STATUSES}
              selected={multi.status}
              onToggle={(v) => toggleFilter("status", v)}
              onClear={() => clearFilter("status")}
            />
            <MultiFilterDropdown
              label="Department"
              options={DEPARTMENTS}
              selected={multi.department}
              onToggle={(v) => toggleFilter("department", v)}
              onClear={() => clearFilter("department")}
            />
            <MultiFilterDropdown
              label="Assigned to"
              options={SAMPLE_USERS}
              selected={multi.assigned_user}
              onToggle={(v) => toggleFilter("assigned_user", v)}
              onClear={() => clearFilter("assigned_user")}
            />
            <MultiFilterDropdown
              label="Claim"
              options={claims.map((c) => c.ref)}
              selected={multi.claim_reference}
              onToggle={(v) => toggleFilter("claim_reference", v)}
              onClear={() => clearFilter("claim_reference")}
            />
            <MultiFilterDropdown
              label="Vehicle Reg."
              options={vehicleRegs}
              selected={multi.vehicle_registration}
              onToggle={(v) => toggleFilter("vehicle_registration", v)}
              onClear={() => clearFilter("vehicle_registration")}
            />
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-neutral-700 text-sm">Date Range</span>
            <DatePickerField
              value={dateRange.due_from}
              onChange={(v) => setDate("due_from", v)}
              placeholder="From"
              align="right"
              triggerClassName="w-36 h-11 px-3 bg-white rounded border border-neutral-200 flex items-center justify-between cursor-pointer text-sm"
            />
            <DatePickerField
              value={dateRange.due_to}
              onChange={(v) => setDate("due_to", v)}
              placeholder="To"
              align="right"
              triggerClassName="w-36 h-11 px-3 bg-white rounded border border-neutral-200 flex items-center justify-between cursor-pointer text-sm"
            />
            {(dateRange.due_from || dateRange.due_to) && (
              <button
                type="button"
                onClick={() => {
                  setPage(1);
                  setDateRange({ due_from: "", due_to: "" });
                }}
                title="Clear date range"
                className="flex items-center gap-1.5 h-11 px-3.5 rounded-full bg-blue-50 text-blue-500 text-sm font-weight-500 hover:bg-red-50 hover:text-red-500 transition-colors"
              >
                <X size={15} /> Clear
              </button>
            )}
          </div>
        </div>

        {/* Active filter pills */}
        {activePills.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap mb-5">
            {activePills.map(({ key, value }) => (
              <span
                key={`${key}-${value}`}
                className="flex items-center gap-2 pl-3 pr-2 py-1.5 bg-white rounded-full border border-neutral-200 text-sm text-neutral-700"
              >
                {value}
                <button
                  type="button"
                  onClick={() => removeFilter(key, value)}
                  className="text-neutral-400 hover:text-neutral-700"
                >
                  <X size={14} />
                </button>
              </span>
            ))}
            <button
              type="button"
              onClick={clearAllFilters}
              className="text-blue-500 text-sm font-weight-500 hover:underline ml-1"
            >
              Clear all
            </button>
          </div>
        )}

        {/* Bulk action bar */}
        {selected.length > 0 && (
          <div className="flex items-center justify-between mb-3 px-4 py-2.5 bg-blue-50 rounded border border-blue-100">
            <span className="text-sm text-neutral-700">
              {selected.length} selected
            </span>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setSelected([])}
                className="text-neutral-500 text-sm hover:underline"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => setBulkConfirm(true)}
                className="flex items-center gap-1.5 text-red-600 text-sm font-weight-500 hover:underline"
              >
                <Trash2 size={15} /> Delete selected
              </button>
            </div>
          </div>
        )}

        {/* Content */}
        {loading && <SpinnerLoader />}
        {tasks.length === 0 ? (
          !loading && (
            <div className="py-20 text-center text-neutral-400 text-sm">
              No tasks found.
            </div>
          )
        ) : view === "list" ? (
          <div className="rounded-lg border border-neutral-100 overflow-hidden">
            <table className="w-full border-collapse">
              <thead>
                <tr className="h-12 bg-neutral-100 text-neutral-900 text-sm font-weight-600 text-left">
                  <th className="px-4 w-10">
                    <input
                      type="checkbox"
                      className="w-4 h-4 accent-blue-500 cursor-pointer align-middle"
                      checked={allSelected}
                      onChange={toggleAll}
                    />
                  </th>
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
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        className="w-4 h-4 accent-blue-500 cursor-pointer align-middle mt-0.5"
                        checked={selected.includes(t.id)}
                        onChange={() => toggleOne(t.id)}
                      />
                    </td>
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
                {/* Separator between details and status/priority */}
                <div className="h-px bg-neutral-100 w-full mt-1" />
                <div className="flex items-center justify-between pt-1">
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
        vehicleRegs={vehicleRegs}
        onClose={() => {
          setDrawerOpen(false);
          setEditing(null);
        }}
        onSaved={refresh}
      />

      {deleteTarget && (
        <ConfirmModal
          title="Delete Task"
          message={`Are you sure you want to delete "${deleteTarget.title}"?`}
          confirmLabel="Delete"
          onCancel={() => setDeleteTarget(null)}
          onConfirm={confirmDeleteSingle}
        />
      )}

      {bulkConfirm && (
        <ConfirmModal
          title="Delete Tasks"
          message={`Are you sure you want to delete ${selected.length} selected task(s)?`}
          confirmLabel="Delete"
          onCancel={() => setBulkConfirm(false)}
          onConfirm={confirmDeleteBulk}
        />
      )}
    </>
  );
};

export default Tasks;
