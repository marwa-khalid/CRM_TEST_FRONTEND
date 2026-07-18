import React, { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Loader2, Plus } from "lucide-react";
import { toast } from "react-toastify";
import FleetTaskModal from "../components/FleetTaskModal";
import { listFleetTasks, type FleetTask } from "../services/taskService";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

// Local yyyy-mm-dd (no toISOString — avoids the BST off-by-one).
const localISO = (d: Date): string => d.toLocaleDateString("sv-SE");

const priorityDot = (value?: string | null): string => {
  const p = (value || "").toLowerCase();
  if (p === "high") return "bg-red-500";
  if (p === "medium") return "bg-amber-500";
  if (p === "low") return "bg-green-500";
  return "bg-neutral-400";
};
const isDone = (t: FleetTask) => (t.status || "").toLowerCase() === "completed";

const FleetTasksCalendar: React.FC = () => {
  const [tasks, setTasks] = useState<FleetTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [cursor, setCursor] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
  const [editing, setEditing] = useState<FleetTask | null>(null);
  const [createDate, setCreateDate] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  const load = async () => {
    setLoading(true);
    setTasks(await listFleetTasks());
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  // Tasks grouped by their due date (yyyy-mm-dd).
  const byDate = useMemo(() => {
    const map = new Map<string, FleetTask[]>();
    tasks.forEach((t) => {
      if (!t.due_date) return;
      const key = t.due_date.slice(0, 10);
      const list = map.get(key) || [];
      list.push(t);
      map.set(key, list);
    });
    return map;
  }, [tasks]);

  // Build the 6-week grid covering the visible month.
  const cells = useMemo(() => {
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const firstWeekday = new Date(year, month, 1).getDay(); // 0=Sun
    const start = new Date(year, month, 1 - firstWeekday);
    return Array.from({ length: 42 }, (_, i) => {
      const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
      return { date, iso: localISO(date), inMonth: date.getMonth() === month };
    });
  }, [cursor]);

  const todayISO = localISO(new Date());
  const shiftMonth = (delta: number) => setCursor((c) => new Date(c.getFullYear(), c.getMonth() + delta, 1));
  const goToday = () => { const d = new Date(); setCursor(new Date(d.getFullYear(), d.getMonth(), 1)); };

  const openNew = (iso?: string) => { setEditing(null); setCreateDate(iso || null); setShowModal(true); };
  const openEdit = (task: FleetTask) => { setEditing(task); setCreateDate(null); setShowModal(true); };

  return (
    <div className="min-h-screen bg-white font-sans-headline">
      <div className="w-full px-10 py-5 bg-white shadow-[0px_4px_20px_0px_rgba(0,0,0,0.08)] sticky top-0 z-20">
        <div className="max-w-[1120px] mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-black text-2xl font-semibold leading-6">Calendar</h1>
            <p className="mt-1 text-neutral-500 text-sm">Fleet tasks by due date</p>
          </div>
          <button
            type="button"
            onClick={() => openNew()}
            className="px-6 py-4 bg-neutral-900 rounded text-white text-base font-medium leading-4 hover:bg-black transition-colors inline-flex items-center gap-2"
          >
            <Plus size={18} />
            New Task
          </button>
        </div>
      </div>

      <main className="px-10 py-10">
        <section className="max-w-[1120px] mx-auto flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => shiftMonth(-1)} aria-label="Previous month" className="w-9 h-9 rounded border border-neutral-200 flex items-center justify-center hover:bg-neutral-50">
                <ChevronLeft size={18} />
              </button>
              <h2 className="text-neutral-900 text-xl font-semibold w-52 text-center">
                {MONTHS[cursor.getMonth()]} {cursor.getFullYear()}
              </h2>
              <button type="button" onClick={() => shiftMonth(1)} aria-label="Next month" className="w-9 h-9 rounded border border-neutral-200 flex items-center justify-center hover:bg-neutral-50">
                <ChevronRight size={18} />
              </button>
            </div>
            <button type="button" onClick={goToday} className="h-10 px-4 border border-neutral-200 rounded text-sm font-medium text-neutral-900 hover:bg-neutral-50">
              Today
            </button>
          </div>

          {loading ? (
            <div className="h-96 flex items-center justify-center text-neutral-500 text-sm gap-2">
              <Loader2 size={18} className="animate-spin" />
              Loading calendar…
            </div>
          ) : (
            <div className="border border-neutral-100 rounded-lg overflow-hidden">
              <div className="grid grid-cols-7 bg-neutral-50 border-b border-neutral-100">
                {WEEKDAYS.map((day) => (
                  <div key={day} className="px-3 py-2 text-xs font-semibold text-neutral-500 uppercase text-center">{day}</div>
                ))}
              </div>
              <div className="grid grid-cols-7">
                {cells.map((cell, i) => {
                  const dayTasks = byDate.get(cell.iso) || [];
                  const isToday = cell.iso === todayISO;
                  return (
                    <div
                      key={cell.iso + i}
                      onClick={() => openNew(cell.iso)}
                      className={`min-h-[104px] border-b border-r border-neutral-100 p-2 flex flex-col gap-1 cursor-pointer transition-colors ${
                        cell.inMonth ? "bg-white hover:bg-neutral-50" : "bg-neutral-50/50"
                      } ${(i + 1) % 7 === 0 ? "border-r-0" : ""}`}
                    >
                      <div className="flex justify-end">
                        <span className={`text-xs w-6 h-6 flex items-center justify-center rounded-full ${
                          isToday ? "bg-neutral-900 text-white font-semibold" : cell.inMonth ? "text-neutral-700" : "text-neutral-300"
                        }`}>
                          {cell.date.getDate()}
                        </span>
                      </div>
                      <div className="flex flex-col gap-1">
                        {dayTasks.slice(0, 3).map((task) => (
                          <button
                            key={task.id}
                            type="button"
                            onClick={(e) => { e.stopPropagation(); openEdit(task); }}
                            title={task.title}
                            className="w-full flex items-center gap-1.5 px-1.5 py-1 rounded bg-neutral-100 hover:bg-neutral-200 text-left"
                          >
                            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${priorityDot(task.priority)}`} />
                            <span className={`text-[11px] truncate ${isDone(task) ? "line-through text-neutral-400" : "text-neutral-700"}`}>
                              {task.title}
                            </span>
                          </button>
                        ))}
                        {dayTasks.length > 3 && (
                          <span className="text-[11px] text-neutral-400 pl-1.5">+{dayTasks.length - 3} more</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex items-center gap-4 text-xs text-neutral-500">
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-500" /> High</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500" /> Medium</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-green-500" /> Low</span>
            <span className="text-neutral-400">· Click a day to add a task, or a task to edit it.</span>
          </div>
        </section>
      </main>

      {showModal && (
        <FleetTaskModal
          task={editing}
          defaultDate={createDate || undefined}
          onClose={() => setShowModal(false)}
          onSaved={() => {
            setShowModal(false);
            toast.success(editing ? "Task updated." : "Task created.");
            load();
          }}
        />
      )}
    </div>
  );
};

export default FleetTasksCalendar;
