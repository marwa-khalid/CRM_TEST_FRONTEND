import React, { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Clock, Eye, LayoutGrid, List as ListIcon, ListTodo, Loader2, MessageSquareReply, Paperclip, Plus, RefreshCw, Search } from "lucide-react";
import { toast } from "react-toastify";
import FleetConfirmModal from "../components/FleetConfirmModal";
import FleetTaskModal from "../components/FleetTaskModal";
import FleetPageHeader from "../components/FleetPageHeader";
import { FleetSelect } from "../components/fields";
import {
  listFleetTasks,
  deleteFleetTask,
  TASK_STATUSES,
  TASK_PRIORITIES,
  type FleetTask,
} from "../services/taskService";
import type { Option } from "../types/hire";
import TrashIcon from "../assets/icons/Remove.svg";

const ALL: Option = { label: "All", value: "" };
const statusOptions: Option[] = [ALL, ...TASK_STATUSES.map((s) => ({ label: s, value: s }))];
const priorityOptions: Option[] = [ALL, ...TASK_PRIORITIES.map((p) => ({ label: p, value: p }))];

const statusBadge = (value?: string | null): string => {
  const s = (value || "").toLowerCase();
  if (s === "completed") return "bg-green-100 text-green-600";
  if (s === "in progress") return "bg-blue-100 text-blue-600";
  if (s === "awaiting response") return "bg-yellow-100 text-yellow-700";
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

const LIST_GRID = "grid-cols-[2fr_1fr_0.9fr_1.2fr_1fr_80px]";

type StatIcon = React.ComponentType<{ size?: number; className?: string }>;
const StatCard: React.FC<{ title: string; value: number; Icon: StatIcon; accent: string }> = ({ title, value, Icon, accent }) => (
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

const FleetTasks: React.FC = () => {
  const [tasks, setTasks] = useState<FleetTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [editing, setEditing] = useState<FleetTask | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<FleetTask | null>(null);
  const [view, setView] = useState<"card" | "list">("card"); // card is the default

  const load = async () => {
    setLoading(true);
    setTasks(await listFleetTasks());
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  // Counts derive from the loaded tasks by their actual status. Overdue is a red
  // visual state on the row/badge, not a separate status bucket.
  const statCards = useMemo(() => {
    const byStatus = (label: string) =>
      tasks.filter((t) => (t.status || "").toLowerCase() === label.toLowerCase()).length;
    return [
      { title: "Total", value: tasks.length, Icon: ListTodo, accent: "bg-neutral-100 text-neutral-700" },
      { title: "Pending", value: byStatus("Pending"), Icon: Clock, accent: "bg-neutral-100 text-neutral-600" },
      { title: "In Progress", value: byStatus("In Progress"), Icon: Loader2, accent: "bg-amber-100 text-amber-600" },
      { title: "Awaiting Response", value: byStatus("Awaiting Response"), Icon: MessageSquareReply, accent: "bg-blue-100 text-blue-600" },
      { title: "Completed", value: byStatus("Completed"), Icon: CheckCircle2, accent: "bg-green-100 text-green-600" },
    ];
  }, [tasks]);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return tasks.filter((t) => {
      if (statusFilter && (t.status || "") !== statusFilter) return false;
      if (priorityFilter && (t.priority || "") !== priorityFilter) return false;
      if (!needle) return true;
      return [t.title, t.assigned_user, t.vehicle_registration, t.department]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(needle);
    });
  }, [tasks, query, statusFilter, priorityFilter]);

  const openNew = () => { setEditing(null); setShowModal(true); };
  const openEdit = (task: FleetTask) => { setEditing(task); setShowModal(true); };

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

  return (
    <div className="min-h-screen bg-white font-sans-headline">
      <FleetPageHeader title="Tasks" />

      <main className="px-10 py-10">
        <section className="max-w-[1120px] mx-auto flex flex-col gap-5">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {statCards.map((s) => (
              <StatCard key={s.title} {...s} />
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="h-12 flex-1 min-w-[240px] max-w-[420px] px-4 border border-neutral-200 rounded flex items-center gap-3">
              <Search size={18} className="text-neutral-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search tasks…"
                className="w-full outline-none text-sm text-neutral-900 placeholder:text-neutral-400"
              />
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={openNew}
                className="h-12 px-6 bg-neutral-900 rounded text-white text-sm font-medium inline-flex items-center gap-2 hover:bg-black transition-colors"
              >
                <Plus size={18} />
                New Task
              </button>
              <div className="w-40"><FleetSelect placeholder="Status" value={statusFilter} options={statusOptions} onChange={setStatusFilter} menuPortal /></div>
              <div className="w-36"><FleetSelect placeholder="Priority" value={priorityFilter} options={priorityOptions} onChange={setPriorityFilter} menuPortal unsorted /></div>
              <button
                type="button"
                onClick={load}
                className="h-12 px-4 border border-neutral-200 rounded text-sm font-medium text-neutral-900 inline-flex items-center gap-2 hover:bg-neutral-50"
              >
                <RefreshCw size={16} />
                Refresh
              </button>
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
            </div>
          </div>

          {loading ? (
            <div className="h-48 flex items-center justify-center text-neutral-500 text-sm gap-2">
              <Loader2 size={18} className="animate-spin" />
              Loading tasks…
            </div>
          ) : visible.length === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center text-center gap-1">
              <p className="text-neutral-900 text-base font-semibold">No tasks</p>
              <p className="text-neutral-500 text-sm">Create your first task to get started.</p>
            </div>
          ) : view === "list" ? (
            <div className="border border-neutral-100 rounded-lg overflow-hidden">
              <div className={`grid ${LIST_GRID} gap-4 bg-neutral-50 px-5 py-3 text-xs font-semibold text-neutral-500 uppercase`}>
                <span>Task</span>
                <span>Status</span>
                <span>Priority</span>
                <span>Due</span>
                <span>Assigned</span>
                <span>Action</span>
              </div>
              {visible.map((task) => (
                <div
                  key={task.id}
                  className={`w-full grid ${LIST_GRID} gap-4 px-5 py-4 text-left border-t border-neutral-100 hover:bg-neutral-50 transition-colors items-center`}
                >
                  <button type="button" onClick={() => openEdit(task)} className="text-left min-w-0">
                    <span className="flex items-center gap-1.5 min-w-0">
                      <span className="text-neutral-900 text-sm font-semibold truncate hover:underline">{task.title}</span>
                      {task.attachment_path && (
                        <Paperclip size={13} className="shrink-0 text-neutral-400" aria-label="Has attachment" />
                      )}
                    </span>
                    {task.vehicle_registration && (
                      <span className="block text-neutral-400 text-xs mt-0.5">{task.vehicle_registration}</span>
                    )}
                  </button>
                  <span>
                    {/* Status keeps its own colour (Pending stays grey even when overdue);
                        overdue is shown by the red due date + the Overdue widget. */}
                    <span className={`px-2 py-1 rounded text-xs font-medium ${statusBadge(task.status)}`}>
                      {task.status || "Pending"}
                    </span>
                  </span>
                  <span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${priorityBadge(task.priority)}`}>{task.priority || "—"}</span>
                  </span>
                  <span className={`text-sm ${task.is_overdue ? "text-red-600 font-medium" : "text-neutral-700"}`}>
                    {fmtDue(task.due_date, task.due_time)}
                  </span>
                  <span className="text-neutral-700 text-sm truncate">{task.assigned_user || "—"}</span>
                  <span className="flex justify-start items-center gap-3">
                    <button type="button" onClick={() => openEdit(task)} aria-label="View / edit">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button type="button" onClick={() => setDeleteTarget(task)} aria-label="Delete task" title="Delete">
                      <img src={TrashIcon} alt="" />
                    </button>
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {visible.map((task) => (
                <div
                  key={task.id}
                  className="p-4 rounded-lg outline outline-1 -outline-offset-1 outline-neutral-200 bg-white flex flex-col gap-3 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between gap-2">
                    <button type="button" onClick={() => openEdit(task)} className="text-left min-w-0 flex-1">
                      <span className="flex items-start gap-1.5 min-w-0">
                        <span className="text-neutral-900 text-sm font-semibold hover:underline line-clamp-2">{task.title}</span>
                        {task.attachment_path && (
                          <Paperclip size={13} className="shrink-0 mt-0.5 text-neutral-400" aria-label="Has attachment" />
                        )}
                      </span>
                    </button>
                    <div className="shrink-0 flex items-center gap-3">
                      <button type="button" onClick={() => openEdit(task)} aria-label="View / edit">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button type="button" onClick={() => setDeleteTarget(task)} aria-label="Delete task" title="Delete">
                        <img src={TrashIcon} alt="" />
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${statusBadge(task.status)}`}>
                      {task.status || "Pending"}
                    </span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${priorityBadge(task.priority)}`}>{task.priority || "—"}</span>
                  </div>
                  <div className="h-px bg-neutral-100" />
                  <div className="flex flex-col gap-1.5 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-neutral-400">Due</span>
                      <span className={task.is_overdue ? "text-red-600 font-medium" : "text-neutral-700"}>{fmtDue(task.due_date, task.due_time)}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-neutral-400">Assigned</span>
                      <span className="text-neutral-700 truncate max-w-[60%]">{task.assigned_user || "—"}</span>
                    </div>
                    {task.vehicle_registration && (
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-neutral-400">Vehicle</span>
                        <span className="text-neutral-700">{task.vehicle_registration}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {showModal && (
        <FleetTaskModal
          task={editing}
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
    </div>
  );
};

export default FleetTasks;
