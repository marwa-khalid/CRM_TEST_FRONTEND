import React, { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Paperclip, Plus } from "lucide-react";
import { toast } from "react-toastify";
import FleetTaskModal from "../components/FleetTaskModal";
import FleetEventModal from "../components/FleetEventModal";
import FleetSpinnerLoader from "../components/FleetSpinnerLoader";
import { listFleetTasks, type FleetTask } from "../services/taskService";
import { listCalendarEvents, type FleetEvent } from "../services/eventService";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MINI_WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

type View = "month" | "day" | "agenda" | "year";
const VIEWS: View[] = ["month", "day", "agenda", "year"];

// Local yyyy-mm-dd (no toISOString — avoids the BST off-by-one).
const localISO = (d: Date): string => d.toLocaleDateString("sv-SE");
const isoFor = (year: number, monthIdx: number, day: number) =>
  `${year}-${String(monthIdx + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

const isDone = (t: FleetTask) => (t.status || "").toLowerCase() === "completed";

type Entry = { kind: "task"; task: FleetTask } | { kind: "event"; event: FleetEvent };

const entryStyle = (entry: Entry): { pill: string; dot: string; text: string; strike: boolean; title: string } => {
  if (entry.kind === "event") {
    return { pill: "bg-blue-100 hover:bg-blue-200", dot: "bg-blue-500", text: "text-blue-800", strike: false, title: entry.event.title };
  }
  const t = entry.task;
  // Completed = green and overdue = red always win; otherwise a task is purple.
  if (isDone(t)) return { pill: "bg-green-100 hover:bg-green-200", dot: "bg-green-500", text: "text-green-700", strike: true, title: t.title };
  if (t.is_overdue) return { pill: "bg-red-100 hover:bg-red-200", dot: "bg-red-500", text: "text-red-700", strike: false, title: t.title };
  return { pill: "bg-purple-100 hover:bg-purple-200", dot: "bg-purple-500", text: "text-purple-800", strike: false, title: t.title };
};

const entryTimeOf = (e: Entry): string => (e.kind === "event" ? e.event.start_time || "" : e.task.due_time || "");
const entryKey = (e: Entry): string => (e.kind === "event" ? `e${e.event.id}` : `t${e.task.id}`);
const sortByTime = (a: Entry, b: Entry) => entryTimeOf(a).localeCompare(entryTimeOf(b));
const hasAttachment = (e: Entry): boolean =>
  Boolean(e.kind === "event" ? e.event.attachment_path : e.task.attachment_path);

const FleetTasksCalendar: React.FC = () => {
  const [tasks, setTasks] = useState<FleetTask[]>([]);
  const [events, setEvents] = useState<FleetEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>("month");
  const [cursor, setCursor] = useState(() => new Date());

  const [editingTask, setEditingTask] = useState<FleetTask | null>(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<FleetEvent | null>(null);
  const [eventDate, setEventDate] = useState<string | null>(null);
  const [showEventModal, setShowEventModal] = useState(false);

  const load = async () => {
    setLoading(true);
    const [t, e] = await Promise.all([listFleetTasks(), listCalendarEvents()]);
    setTasks(t);
    setEvents(e);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  // Events (by start date) + tasks (by due date), grouped per day. Events first.
  const entriesByDate = useMemo(() => {
    const map = new Map<string, Entry[]>();
    const add = (key: string, entry: Entry) => { const list = map.get(key) || []; list.push(entry); map.set(key, list); };
    events.forEach((e) => { if (e.start_date) add(e.start_date.slice(0, 10), { kind: "event", event: e }); });
    tasks.forEach((t) => { if (t.due_date) add(t.due_date.slice(0, 10), { kind: "task", task: t }); });
    return map;
  }, [tasks, events]);

  const monthCells = useMemo(() => {
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const firstWeekday = new Date(year, month, 1).getDay();
    const start = new Date(year, month, 1 - firstWeekday);
    return Array.from({ length: 42 }, (_, i) => {
      const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
      return { date, iso: localISO(date), inMonth: date.getMonth() === month };
    });
  }, [cursor]);

  const todayISO = localISO(new Date());
  const goToday = () => setCursor(new Date());
  const shift = (delta: number) =>
    setCursor((c) => {
      if (view === "day") return new Date(c.getFullYear(), c.getMonth(), c.getDate() + delta);
      if (view === "year") return new Date(c.getFullYear() + delta, c.getMonth(), 1);
      return new Date(c.getFullYear(), c.getMonth() + delta, 1); // month + agenda
    });

  const title =
    view === "day"
      ? cursor.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
      : view === "year"
        ? String(cursor.getFullYear())
        : `${MONTHS[cursor.getMonth()]} ${cursor.getFullYear()}`;

  const openNewEvent = (iso?: string) => { setEditingEvent(null); setEventDate(iso || null); setShowEventModal(true); };
  const openEditEvent = (event: FleetEvent) => { setEditingEvent(event); setEventDate(null); setShowEventModal(true); };
  const openEditTask = (task: FleetTask) => { setEditingTask(task); setShowTaskModal(true); };
  const openEntry = (entry: Entry) => (entry.kind === "event" ? openEditEvent(entry.event) : openEditTask(entry.task));

  // Shared list-row (day + agenda views).
  const EntryRow: React.FC<{ entry: Entry }> = ({ entry }) => {
    const style = entryStyle(entry);
    const time = entryTimeOf(entry);
    return (
      <button
        type="button"
        onClick={() => openEntry(entry)}
        className="w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-neutral-50"
      >
        <span className={`w-2 h-2 rounded-full shrink-0 ${style.dot}`} />
        <span className="w-14 shrink-0 text-xs text-neutral-500">{time || "—"}</span>
        <span className={`flex-1 truncate text-sm ${style.strike ? "line-through text-neutral-400" : "text-neutral-900"}`}>{style.title}</span>
        {hasAttachment(entry) && <Paperclip size={13} className="shrink-0 text-neutral-400" aria-label="Has attachment" />}
        <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${style.pill} ${style.text}`}>{entry.kind === "event" ? "Event" : "Task"}</span>
      </button>
    );
  };

  const dayISO = localISO(cursor);
  const dayEntries = (entriesByDate.get(dayISO) || []).slice().sort(sortByTime);

  const agendaMonthPrefix = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}`;
  const agendaDates = useMemo(
    () => [...entriesByDate.keys()].filter((k) => k.startsWith(agendaMonthPrefix)).sort(),
    [entriesByDate, agendaMonthPrefix],
  );

  return (
    <div className="min-h-screen bg-white font-sans-headline">
      {loading && <FleetSpinnerLoader />}
      <div className="w-full px-10 py-5 bg-white shadow-[0px_4px_20px_0px_rgba(0,0,0,0.08)] sticky top-0 z-20">
        <div className="max-w-[1120px] mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-black text-2xl font-semibold leading-6">Calendar</h1>
            <p className="mt-1 text-neutral-500 text-sm">Fleet events &amp; task due dates</p>
          </div>
          <button
            type="button"
            onClick={() => openNewEvent()}
            className="px-6 py-4 bg-neutral-900 rounded text-white text-base font-medium leading-4 hover:bg-black transition-colors inline-flex items-center gap-2"
          >
            <Plus size={18} />
            New Event
          </button>
        </div>
      </div>

      <main className="px-10 py-10">
        <section className="max-w-[1120px] mx-auto flex flex-col gap-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => shift(-1)} aria-label="Previous" className="w-9 h-9 rounded border border-neutral-200 flex items-center justify-center hover:bg-neutral-50">
                <ChevronLeft size={18} />
              </button>
              <h2 className="text-neutral-900 text-xl font-semibold text-center whitespace-nowrap px-2">{title}</h2>
              <button type="button" onClick={() => shift(1)} aria-label="Next" className="w-9 h-9 rounded border border-neutral-200 flex items-center justify-center hover:bg-neutral-50">
                <ChevronRight size={18} />
              </button>
              <button type="button" onClick={goToday} className="h-9 px-4 border border-neutral-200 rounded text-sm font-medium text-neutral-900 hover:bg-neutral-50">
                Today
              </button>
            </div>

            {/* View switcher */}
            <div className="flex items-center rounded border border-neutral-200 overflow-hidden">
              {VIEWS.map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setView(v)}
                  className={`h-9 px-3.5 text-sm capitalize ${v !== "month" ? "border-l border-neutral-200" : ""} ${
                    view === v ? "bg-neutral-900 text-white" : "bg-white text-neutral-600 hover:bg-neutral-50"
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          {/* ── MONTH ─────────────────────────────────────────────── */}
          {view === "month" && (
            <div className="border border-neutral-100 rounded-lg overflow-hidden">
              <div className="grid grid-cols-7 bg-neutral-50 border-b border-neutral-100">
                {WEEKDAYS.map((day) => (
                  <div key={day} className="px-3 py-2 text-xs font-semibold text-neutral-500 uppercase text-center">{day}</div>
                ))}
              </div>
              <div className="grid grid-cols-7">
                {monthCells.map((cell, i) => {
                  const entries = entriesByDate.get(cell.iso) || [];
                  const isToday = cell.iso === todayISO;
                  return (
                    <div
                      key={cell.iso + i}
                      onClick={() => openNewEvent(cell.iso)}
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
                        {entries.slice(0, 3).map((entry) => {
                          const style = entryStyle(entry);
                          return (
                            <button
                              key={entryKey(entry)}
                              type="button"
                              onClick={(ev) => { ev.stopPropagation(); openEntry(entry); }}
                              title={style.title}
                              className={`w-full flex items-center gap-1.5 px-1.5 py-1 rounded ${style.pill} text-left`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${style.dot}`} />
                              <span className={`text-[11px] truncate ${style.strike ? "line-through" : ""} ${style.text}`}>{style.title}</span>
                            </button>
                          );
                        })}
                        {entries.length > 3 && (
                          <span className="text-[11px] text-neutral-400 pl-1.5">+{entries.length - 3} more</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── DAY ───────────────────────────────────────────────── */}
          {view === "day" && (
            <div className="border border-neutral-100 rounded-lg overflow-hidden">
              <div className="px-4 py-3 bg-neutral-50 border-b border-neutral-100 flex items-center justify-between">
                <span className="text-sm font-semibold text-neutral-700">
                  {cursor.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}
                </span>
                <button type="button" onClick={() => openNewEvent(dayISO)} className="text-sm text-neutral-600 hover:text-neutral-900 inline-flex items-center gap-1">
                  <Plus size={14} /> Add event
                </button>
              </div>
              {dayEntries.length === 0 ? (
                <div className="py-16 flex flex-col items-center justify-center gap-2 text-center">
                  <p className="text-neutral-400 text-sm">Nothing scheduled for this day.</p>
                  <button type="button" onClick={() => openNewEvent(dayISO)} className="text-sm text-neutral-900 font-medium underline">Add an event</button>
                </div>
              ) : (
                <div className="divide-y divide-neutral-100">
                  {dayEntries.map((entry) => <EntryRow key={entryKey(entry)} entry={entry} />)}
                </div>
              )}
            </div>
          )}

          {/* ── AGENDA ────────────────────────────────────────────── */}
          {view === "agenda" && (
            agendaDates.length === 0 ? (
              <div className="border border-neutral-100 rounded-lg py-16 text-center text-neutral-400 text-sm">
                No events or tasks in {MONTHS[cursor.getMonth()]} {cursor.getFullYear()}.
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {agendaDates.map((dateKey) => {
                  const list = entriesByDate.get(dateKey)!.slice().sort(sortByTime);
                  const d = new Date(`${dateKey}T00:00:00`);
                  return (
                    <div key={dateKey} className="border border-neutral-100 rounded-lg overflow-hidden">
                      <div className={`px-4 py-2 border-b border-neutral-100 text-sm font-semibold flex items-center gap-2 ${dateKey === todayISO ? "bg-neutral-900 text-white" : "bg-neutral-50 text-neutral-700"}`}>
                        {d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}
                        {dateKey === todayISO && <span className="text-[11px] font-normal opacity-80">· Today</span>}
                      </div>
                      <div className="divide-y divide-neutral-100">
                        {list.map((entry) => <EntryRow key={entryKey(entry)} entry={entry} />)}
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          )}

          {/* ── YEAR ──────────────────────────────────────────────── */}
          {view === "year" && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {MONTHS.map((mName, mi) => {
                const year = cursor.getFullYear();
                const startWeekday = new Date(year, mi, 1).getDay();
                const daysInMonth = new Date(year, mi + 1, 0).getDate();
                return (
                  <div key={mi} className="border border-neutral-100 rounded-lg p-3">
                    <button
                      type="button"
                      onClick={() => { setCursor(new Date(year, mi, 1)); setView("month"); }}
                      className="text-sm font-semibold text-neutral-800 hover:underline mb-2"
                    >
                      {mName}
                    </button>
                    <div className="grid grid-cols-7 gap-0.5 text-[10px]">
                      {MINI_WEEKDAYS.map((d, i) => <span key={i} className="text-neutral-400 text-center h-5 flex items-center justify-center">{d}</span>)}
                      {Array.from({ length: startWeekday }).map((_, i) => <span key={`b${i}`} />)}
                      {Array.from({ length: daysInMonth }).map((_, di) => {
                        const day = di + 1;
                        const iso = isoFor(year, mi, day);
                        const has = entriesByDate.has(iso);
                        const isT = iso === todayISO;
                        return (
                          <button
                            key={iso}
                            type="button"
                            onClick={() => { setCursor(new Date(year, mi, day)); setView("day"); }}
                            className={`h-5 rounded flex items-center justify-center ${
                              isT ? "bg-neutral-900 text-white font-semibold" : has ? "bg-purple-100 text-purple-800 font-medium" : "text-neutral-600 hover:bg-neutral-100"
                            }`}
                          >
                            {day}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-4 text-xs text-neutral-500">
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-500" /> Events</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-purple-500" /> Tasks</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-green-500" /> Completed</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-500" /> Overdue</span>
          </div>
        </section>
      </main>

      {showEventModal && (
        <FleetEventModal
          event={editingEvent}
          defaultDate={eventDate || undefined}
          onClose={() => setShowEventModal(false)}
          onSaved={() => {
            setShowEventModal(false);
            toast.success(editingEvent ? "Event updated." : "Event created.");
            load();
          }}
        />
      )}

      {showTaskModal && (
        <FleetTaskModal
          task={editingTask}
          onClose={() => setShowTaskModal(false)}
          onSaved={() => {
            setShowTaskModal(false);
            toast.success("Task updated.");
            load();
          }}
        />
      )}
    </div>
  );
};

export default FleetTasksCalendar;
