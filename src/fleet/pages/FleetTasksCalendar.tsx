import React, { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, ChevronLeft, ChevronRight, Filter, Paperclip, Plus, Search } from "lucide-react";
import { toast } from "react-toastify";
import FleetTaskModal from "../components/FleetTaskModal";
import FleetEventModal from "../components/FleetEventModal";
import FleetTaskDetailSlider from "../components/FleetTaskDetailSlider";
import FleetEventDetailSlider from "../components/FleetEventDetailSlider";
import FleetPageHeader from "../components/FleetPageHeader";
import FleetSpinnerLoader from "../components/FleetSpinnerLoader";
import { FleetCalendar } from "../components/FleetCalendar";
import { FleetSelect } from "../components/fields";
import type { Option } from "../types/hire";
import CalendarIcon from "../assets/listingpage/calendar.svg";
import { listFleetTasks, type FleetTask } from "../services/taskService";
import { listCalendarEvents, EXPIRY_EVENT_SOURCE_TYPES, type FleetEvent } from "../services/eventService";
import { listAllExpiries, type FleetDueReminder } from "../services/hireService";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MINI_WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

// Claims-calendar view set (Day / Week / Month / Agenda) plus Fleet's own Year.
type View = "day" | "week" | "month" | "agenda" | "year";
const VIEWS: { key: View; label: string }[] = [
  { key: "day", label: "Day" },
  { key: "week", label: "Week" },
  { key: "month", label: "Month" },
  { key: "agenda", label: "Agenda" },
  { key: "year", label: "Year" },
];

// Local yyyy-mm-dd (no toISOString — avoids the BST off-by-one).
const localISO = (d: Date): string => d.toLocaleDateString("sv-SE");
const isoFor = (year: number, monthIdx: number, day: number) =>
  `${year}-${String(monthIdx + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
// "HH:mm" -> minutes since midnight, or null if there's no usable time (all-day).
const toMinutes = (t?: string | null): number | null => {
  if (!t || !t.includes(":")) return null;
  const [h, m] = t.split(":").map(Number);
  return h * 60 + (m || 0);
};

const isDone = (t: FleetTask) => (t.status || "").toLowerCase() === "completed";

type Entry =
  | { kind: "task"; task: FleetTask }
  | { kind: "event"; event: FleetEvent }
  | { kind: "expiry"; expiry: FleetDueReminder };

const entryStyle = (entry: Entry): { pill: string; dot: string; text: string; strike: boolean; title: string } => {
  if (entry.kind === "event") {
    // Manual calendar events — Fleet black/grey theme (not blue).
    return { pill: "bg-neutral-100 hover:bg-neutral-200", dot: "bg-neutral-700", text: "text-neutral-700", strike: false, title: entry.event.title };
  }
  if (entry.kind === "expiry") {
    // Road fund / plate / MOT expiries — same purple as tasks (Task Management),
    // informational (not editable).
    return { pill: "bg-purple-100 hover:bg-purple-200", dot: "bg-purple-500", text: "text-purple-800", strike: false, title: entry.expiry.title };
  }
  const t = entry.task;
  // Completed = green and overdue = red always win; otherwise a task is purple.
  if (isDone(t)) return { pill: "bg-green-100 hover:bg-green-200", dot: "bg-green-500", text: "text-green-700", strike: true, title: t.title };
  if (t.is_overdue) return { pill: "bg-red-100 hover:bg-red-200", dot: "bg-red-500", text: "text-red-700", strike: false, title: t.title };
  return { pill: "bg-purple-100 hover:bg-purple-200", dot: "bg-purple-500", text: "text-purple-800", strike: false, title: t.title };
};

const entryTimeOf = (e: Entry): string =>
  e.kind === "event" ? e.event.start_time || "" : e.kind === "task" ? e.task.due_time || "" : "";
const entryEndOf = (e: Entry): string => (e.kind === "event" ? e.event.end_time || "" : "");
const entryKey = (e: Entry): string =>
  e.kind === "event" ? `e${e.event.id}` : e.kind === "task" ? `t${e.task.id}` : `x${e.expiry.kind}-${e.expiry.vehicle}-${e.expiry.expiry_date}`;
const entryLabel = (e: Entry): string => (e.kind === "event" ? "Event" : e.kind === "expiry" ? "Expiry" : "Task");
const titleOf = (e: Entry): string => (e.kind === "event" ? e.event.title : e.kind === "task" ? e.task.title : e.expiry.title);
const vehicleOf = (e: Entry): string =>
  e.kind === "event" ? e.event.vehicle_registration || "" : e.kind === "task" ? e.task.vehicle_registration || "" : e.expiry.vehicle || "";
const assignedOf = (e: Entry): string => (e.kind === "task" ? e.task.assigned_user || "" : "");
const sortByTime = (a: Entry, b: Entry) => entryTimeOf(a).localeCompare(entryTimeOf(b));
// Chip look shared by month + time-grid: coloured fill + left accent bar.
const chipCls = (e: Entry): string => {
  const s = entryStyle(e);
  return `${s.pill} ${s.text} border-l-[3px] border-current rounded`;
};

// Agenda helpers (Teams-style rows): a light source tint + a secondary line.
const agendaTint = (e: Entry): string => {
  if (e.kind === "event") return "bg-neutral-50";
  if (e.kind === "expiry") return "bg-purple-50";
  const t = e.task;
  if (isDone(t)) return "bg-green-50";
  if (t.is_overdue) return "bg-red-50";
  return "bg-purple-50";
};
const agendaSubtitle = (e: Entry): string => {
  if (e.kind === "event") return e.event.event_type || "Event";
  if (e.kind === "expiry") return `Expiry${e.expiry.vehicle ? " · " + e.expiry.vehicle : ""}`;
  const t = e.task;
  return `Task${t.assigned_user ? " · " + t.assigned_user : ""}${t.vehicle_registration ? " · " + t.vehicle_registration : ""}`;
};
const hasAttachment = (e: Entry): boolean =>
  Boolean(e.kind === "event" ? e.event.attachment_path : e.kind === "task" ? e.task.attachment_path : false);

// Filter by entry kind (Events / Tasks / Expiries), mirroring the Claims "All Types".
const TYPE_OPTIONS: Option[] = [
  { label: "All Types", value: "" },
  { label: "Events", value: "event" },
  { label: "Tasks", value: "task" },
  { label: "Expiries", value: "expiry" },
];

// Hour rows for the Day / Week time grid (full 24h, scrolled to ~07:00).
const HOURS = Array.from({ length: 24 }, (_, i) => i);
const HOUR_PX = 48;

// Close a popup when the user clicks outside it.
const useOutside = (onClose: () => void) => {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onClose(); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [onClose]);
  return ref;
};

// From / To date field for the filters popover (Fleet's own calendar).
const DateField: React.FC<{ value: string; onChange: (v: string) => void; placeholder: string }> = ({ value, onChange, placeholder }) => {
  const [open, setOpen] = useState(false);
  const ref = useOutside(() => setOpen(false));
  const selected = value ? new Date(`${value}T00:00:00`) : null;
  return (
    <div className="relative" ref={ref}>
      <button type="button" onClick={() => setOpen((o) => !o)} className="w-full h-[52px] px-4 rounded border border-neutral-200 bg-white flex items-center justify-between gap-2 hover:border-neutral-400">
        <span className={`text-sm ${value ? "text-neutral-700" : "text-neutral-400"}`}>{selected ? selected.toLocaleDateString("en-GB") : placeholder}</span>
        <img src={CalendarIcon} alt="" className="w-4 h-4 shrink-0" />
      </button>
      {open && (
        <FleetCalendar selectedDate={selected} onSelect={(d) => { onChange(d.toLocaleDateString("sv-SE")); setOpen(false); }} />
      )}
    </div>
  );
};

const FleetTasksCalendar: React.FC<{ module?: string }> = ({ module = "skyline" }) => {
  const [tasks, setTasks] = useState<FleetTask[]>([]);
  const [events, setEvents] = useState<FleetEvent[]>([]);
  const [expiries, setExpiries] = useState<FleetDueReminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>("month");
  const [cursor, setCursor] = useState(() => new Date());
  const now = new Date();

  // Toolbar: a view dropdown + a filters popover opened by the filter icon.
  const [viewMenuOpen, setViewMenuOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  // Filters (Fleet-appropriate — no Department/Claim ref).
  const [fType, setFType] = useState("");
  const [fUser, setFUser] = useState("");
  const [fVehicle, setFVehicle] = useState("");
  const [fSearch, setFSearch] = useState("");
  const [fFrom, setFFrom] = useState("");
  const [fTo, setFTo] = useState("");

  const [editingTask, setEditingTask] = useState<FleetTask | null>(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<FleetEvent | null>(null);
  const [eventDate, setEventDate] = useState<string | null>(null);
  const [showEventModal, setShowEventModal] = useState(false);
  // Clicking an existing entry opens a read-first details slider (with an Edit
  // button), not the edit modal directly — mirrors the Claims calendar.
  const [detailEvent, setDetailEvent] = useState<FleetEvent | null>(null);
  const [detailTask, setDetailTask] = useState<FleetTask | null>(null);

  const load = async () => {
    setLoading(true);
    // Vehicle expiries (road fund / plate / MOT) belong to Vehicle Management, so
    // only its calendar plots them; Skyline's calendar shows tasks + manual events.
    const [t, e, x] = await Promise.all([
      listFleetTasks({ module }),
      listCalendarEvents({ module }),
      module === "vehicles" ? listAllExpiries() : Promise.resolve([]),
    ]);
    setTasks(t);
    // Drop the auto-synced expiry system-events — expiries are plotted from the
    // dedicated endpoint below, so keeping these would double each one up.
    setEvents(e.filter((ev) => !EXPIRY_EVENT_SOURCE_TYPES.includes(ev.source_type || "")));
    setExpiries(x);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  // "All Users" (task assignees) + "All Vehicles" (regs across every entry).
  const userOptions = useMemo<Option[]>(() => {
    const names = Array.from(new Set(tasks.map((t) => (t.assigned_user || "").trim()).filter(Boolean))).sort();
    return [{ label: "All Users", value: "" }, ...names.map((n) => ({ label: n, value: n }))];
  }, [tasks]);
  const vehicleOptions = useMemo<Option[]>(() => {
    const regs = new Set<string>();
    events.forEach((e) => { const v = (e.vehicle_registration || "").trim(); if (v) regs.add(v); });
    tasks.forEach((t) => { const v = (t.vehicle_registration || "").trim(); if (v) regs.add(v); });
    expiries.forEach((x) => { const v = (x.vehicle || "").trim(); if (v) regs.add(v); });
    return [{ label: "All Vehicles", value: "" }, ...Array.from(regs).sort().map((v) => ({ label: v, value: v }))];
  }, [events, tasks, expiries]);

  const filterCount = [fType, fUser, fVehicle, fSearch, fFrom, fTo].filter(Boolean).length;
  const filtersActive = filterCount > 0;
  const clearFilters = () => { setFType(""); setFUser(""); setFVehicle(""); setFSearch(""); setFFrom(""); setFTo(""); };

  // Events (by start date) + tasks (by due date) + vehicle expiries (by expiry
  // date), grouped per day, after applying the filters (incl. the From/To window).
  const entriesByDate = useMemo(() => {
    const map = new Map<string, Entry[]>();
    const add = (key: string, entry: Entry) => { const list = map.get(key) || []; list.push(entry); map.set(key, list); };
    const inWindow = (key: string) => (!fFrom || key >= fFrom) && (!fTo || key <= fTo);
    const needle = fSearch.trim().toLowerCase();
    const matches = (e: Entry): boolean => {
      if (fType && e.kind !== fType) return false;
      if (fUser && assignedOf(e) !== fUser) return false;
      if (fVehicle && vehicleOf(e) !== fVehicle) return false;
      if (needle && !`${titleOf(e)} ${vehicleOf(e)} ${assignedOf(e)}`.toLowerCase().includes(needle)) return false;
      return true;
    };
    events.forEach((e) => { const key = (e.start_date || "").slice(0, 10); if (key && inWindow(key)) { const en: Entry = { kind: "event", event: e }; if (matches(en)) add(key, en); } });
    tasks.forEach((t) => { const key = (t.due_date || "").slice(0, 10); if (key && inWindow(key)) { const en: Entry = { kind: "task", task: t }; if (matches(en)) add(key, en); } });
    expiries.forEach((x) => { const key = (x.expiry_date || "").slice(0, 10); if (key && inWindow(key)) { const en: Entry = { kind: "expiry", expiry: x }; if (matches(en)) add(key, en); } });
    return map;
  }, [tasks, events, expiries, fType, fUser, fVehicle, fSearch, fFrom, fTo]);

  // Month grid (6 weeks) around the cursor.
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

  // Sun..Sat week around the cursor (for the Week time grid).
  const weekDays = useMemo(() => {
    const s = new Date(cursor);
    s.setDate(cursor.getDate() - cursor.getDay());
    return Array.from({ length: 7 }, (_, i) => { const d = new Date(s); d.setDate(s.getDate() + i); return d; });
  }, [cursor]);

  const todayISO = localISO(now);
  const goToday = () => setCursor(new Date());
  const shift = (delta: number) =>
    setCursor((c) => {
      if (view === "day") return new Date(c.getFullYear(), c.getMonth(), c.getDate() + delta);
      if (view === "week") return new Date(c.getFullYear(), c.getMonth(), c.getDate() + delta * 7);
      if (view === "year") return new Date(c.getFullYear() + delta, c.getMonth(), 1);
      return new Date(c.getFullYear(), c.getMonth() + delta, 1); // month + agenda
    });

  const title =
    view === "day"
      ? cursor.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
      : view === "week"
        ? `${weekDays[0].toLocaleDateString("en-GB", { day: "numeric", month: "short" })} – ${weekDays[6].toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`
        : view === "year"
          ? String(cursor.getFullYear())
          : `${MONTHS[cursor.getMonth()]} ${cursor.getFullYear()}`;

  const openNewEvent = (iso?: string) => { setEditingEvent(null); setEventDate(iso || null); setShowEventModal(true); };
  const openEditEvent = (event: FleetEvent) => { setEditingEvent(event); setEventDate(null); setShowEventModal(true); };
  const openEditTask = (task: FleetTask) => { setEditingTask(task); setShowTaskModal(true); };
  // Expiries are read-only (auto-derived from vehicle records), so no modal.
  const openEntry = (entry: Entry) => {
    if (entry.kind === "event") return setDetailEvent(entry.event);
    if (entry.kind === "task") return setDetailTask(entry.task);
  };

  // Agenda is all-time (like the Teams calendar) — the From/To filters narrow it.
  const agendaDates = useMemo(() => [...entriesByDate.keys()].sort(), [entriesByDate]);

  // Day / Week time grid — hour rows with entries positioned by time; all-day
  // entries (incl. expiries) pinned at the top of each column.
  const TimeGrid: React.FC<{ cols: Date[] }> = ({ cols }) => {
    const template = `56px repeat(${cols.length}, 1fr)`;
    return (
      <div className="rounded border border-neutral-200 overflow-hidden bg-white shadow-sm">
        {/* Header: big day number + weekday */}
        <div className="grid border-b border-neutral-200" style={{ gridTemplateColumns: template }}>
          <div />
          {cols.map((d, i) => {
            const isToday = sameDay(d, now);
            return (
              <div key={i} className={`px-3 py-2 border-l border-neutral-100 ${isToday ? "border-t-2 border-t-neutral-900 bg-neutral-50" : ""}`}>
                <div className={`text-xl font-bold leading-7 ${isToday ? "text-neutral-900" : "text-neutral-800"}`}>{d.getDate()}</div>
                <div className={`text-xs ${isToday ? "text-neutral-900 font-medium" : "text-neutral-500"}`}>
                  {d.toLocaleDateString("en-GB", { weekday: "long" })}
                </div>
              </div>
            );
          })}
        </div>
        {/* Body (scrollable, opens at ~07:00) */}
        <div
          className="max-h-[600px] overflow-y-auto pt-3"
          ref={(el) => { if (el && !el.dataset.scrolled) { el.scrollTop = 7 * HOUR_PX; el.dataset.scrolled = "1"; } }}
        >
          <div className="grid" style={{ gridTemplateColumns: template }}>
            {/* Hour numbers */}
            <div className="relative">
              {HOURS.map((h) => (
                <div key={h} style={{ height: HOUR_PX }} className="relative">
                  <span className="absolute -top-2 right-2 text-[11px] text-neutral-400">{h}</span>
                </div>
              ))}
            </div>
            {/* Day columns */}
            {cols.map((d, ci) => {
              const isToday = sameDay(d, now);
              const iso = localISO(d);
              const isPast = iso < todayISO; // past days keep colours but render dimmer
              const dayEntries = entriesByDate.get(iso) || [];
              const timed = dayEntries.filter((e) => toMinutes(entryTimeOf(e)) != null);
              const allDay = dayEntries.filter((e) => toMinutes(entryTimeOf(e)) == null);
              return (
                <div
                  key={ci}
                  className={`relative border-l border-neutral-100 ${isToday ? "bg-neutral-50/60" : ""}`}
                  style={{ height: HOURS.length * HOUR_PX }}
                  onClick={() => openNewEvent(iso)}
                >
                  {HOURS.map((h) => (
                    <div key={h} style={{ height: HOUR_PX }} className="border-b border-neutral-100">
                      <div className="h-1/2 border-b border-dashed border-neutral-100" />
                    </div>
                  ))}
                  {/* all-day entries pinned at the top */}
                  {allDay.map((e, idx) => (
                    <button
                      key={entryKey(e)}
                      type="button"
                      onClick={(ev) => { ev.stopPropagation(); openEntry(e); }}
                      title={titleOf(e)}
                      className={`absolute left-1 right-1 px-2 py-0.5 text-[11px] font-semibold truncate ${chipCls(e)} ${isPast ? "opacity-60" : ""}`}
                      style={{ top: 2 + idx * 22, zIndex: 6 }}
                    >
                      {titleOf(e)}
                    </button>
                  ))}
                  {/* timed entries (sized by duration; tasks default to 60 min) */}
                  {timed.map((e) => {
                    const start = toMinutes(entryTimeOf(e)) as number;
                    const endM = toMinutes(entryEndOf(e));
                    const dur = endM && endM > start ? endM - start : 60;
                    const top = (start / 60) * HOUR_PX;
                    const height = Math.max(22, (dur / 60) * HOUR_PX - 3);
                    return (
                      <button
                        key={entryKey(e)}
                        type="button"
                        onClick={(ev) => { ev.stopPropagation(); openEntry(e); }}
                        title={titleOf(e)}
                        className={`absolute left-1 right-1 px-2 py-1 text-left overflow-hidden ${chipCls(e)} ${isPast ? "opacity-60" : ""}`}
                        style={{ top, height, zIndex: 7 }}
                      >
                        <div className="text-[11px] font-semibold truncate leading-4">{titleOf(e)}</div>
                        <div className="text-[10px] opacity-70 truncate leading-3">{entryTimeOf(e)} · {entryLabel(e)}</div>
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-white font-sans-headline">
      {loading && <FleetSpinnerLoader />}
      <FleetPageHeader title="Calendar" />

      <main className="px-10 py-10">
        <section className="max-w-[1120px] mx-auto flex flex-col gap-5">
          {/* Toolbar: Today / prev-next / title / filters  ·  view dropdown / New Event */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <button type="button" onClick={goToday} className="h-9 px-4 rounded border border-neutral-200 text-neutral-700 text-sm font-medium hover:bg-neutral-50">Today</button>
              <button type="button" onClick={() => shift(-1)} aria-label="Previous" className="w-8 h-8 inline-flex items-center justify-center rounded text-neutral-500 hover:bg-neutral-100"><ChevronLeft size={18} /></button>
              <button type="button" onClick={() => shift(1)} aria-label="Next" className="w-8 h-8 inline-flex items-center justify-center rounded text-neutral-500 hover:bg-neutral-100"><ChevronRight size={18} /></button>
              <h2 className="text-neutral-900 text-lg font-semibold min-w-[150px] px-1">{title}</h2>

              {/* Filters icon + popover */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setFiltersOpen((o) => !o)}
                  title="Filters"
                  className="relative w-9 h-9 inline-flex items-center justify-center rounded bg-white border border-neutral-200 text-neutral-700 hover:bg-neutral-50"
                >
                  <Filter size={16} />
                  {filterCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-neutral-900 text-white text-[10px] font-semibold flex items-center justify-center border-2 border-white">{filterCount}</span>
                  )}
                </button>
                {filtersOpen && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setFiltersOpen(false)} />
                    <div className="absolute left-0 mt-2 z-40 w-[440px] rounded bg-white shadow-xl p-4 border border-neutral-200">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[15px] font-semibold text-neutral-900">Filters</span>
                        {filtersActive && (
                          <button type="button" onClick={clearFilters} className="text-[13px] text-neutral-600 hover:underline">Clear all</button>
                        )}
                      </div>
                      <div className="flex flex-col gap-3">
                        <div className="flex flex-col gap-1">
                          <span className="text-[12px] text-neutral-500">Search</span>
                          <div className="relative">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 z-10" />
                            <input
                              value={fSearch}
                              onChange={(e) => setFSearch(e.target.value)}
                              placeholder="Search"
                              className="h-[52px] w-full pl-9 pr-4 rounded border border-neutral-200 outline-none text-sm text-neutral-900 placeholder:text-neutral-400 font-light focus:border-neutral-400"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="flex flex-col gap-1"><span className="text-[12px] text-neutral-500">Type</span><FleetSelect placeholder="All Types" value={fType} options={TYPE_OPTIONS} onChange={setFType} menuPortal unsorted /></div>
                          <div className="flex flex-col gap-1"><span className="text-[12px] text-neutral-500">Assigned To</span><FleetSelect placeholder="All Users" value={fUser} options={userOptions} onChange={setFUser} menuPortal /></div>
                          <div className="col-span-2 flex flex-col gap-1"><span className="text-[12px] text-neutral-500">Vehicle Reg</span><FleetSelect placeholder="All Vehicles" value={fVehicle} options={vehicleOptions} onChange={setFVehicle} menuPortal /></div>
                          <div className="flex flex-col gap-1"><span className="text-[12px] text-neutral-500">From</span><DateField value={fFrom} onChange={setFFrom} placeholder="From" /></div>
                          <div className="flex flex-col gap-1"><span className="text-[12px] text-neutral-500">To</span><DateField value={fTo} onChange={setFTo} placeholder="To" /></div>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* View dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setViewMenuOpen((o) => !o)}
                  className="h-9 px-3 inline-flex items-center gap-2 rounded bg-white border border-neutral-200 text-sm text-neutral-800 hover:bg-neutral-50"
                >
                  {VIEWS.find((v) => v.key === view)?.label}
                  <ChevronDown size={14} />
                </button>
                {viewMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setViewMenuOpen(false)} />
                    <div className="absolute right-0 mt-1 z-40 w-40 rounded bg-white py-1 shadow-lg border border-neutral-200">
                      {VIEWS.map((v) => (
                        <button
                          key={v.key}
                          type="button"
                          onClick={() => { setView(v.key); setViewMenuOpen(false); }}
                          className={`w-full text-left px-3 py-2 text-sm hover:bg-neutral-50 flex items-center justify-between ${view === v.key ? "text-neutral-900 font-semibold" : "text-neutral-700"}`}
                        >
                          {v.label}
                          {view === v.key && <Check size={14} />}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
              <button
                type="button"
                onClick={() => openNewEvent()}
                className="h-9 px-5 bg-neutral-900 rounded text-white text-sm font-medium inline-flex items-center gap-2 hover:bg-black transition-colors"
              >
                <Plus size={18} />
                New Event
              </button>
            </div>
          </div>

          {/* ── WEEK / DAY (time grid) ─────────────────────────────── */}
          {view === "week" && <TimeGrid cols={weekDays} />}
          {view === "day" && <TimeGrid cols={[cursor]} />}

          {/* ── MONTH ─────────────────────────────────────────────── */}
          {view === "month" && (
            <div className="rounded border border-neutral-200 overflow-hidden bg-white shadow-sm">
              <div className="grid grid-cols-7 bg-neutral-50 border-b border-neutral-200">
                {WEEKDAYS.map((day) => (
                  <div key={day} className="px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-neutral-400 text-center">{day}</div>
                ))}
              </div>
              <div className="grid grid-cols-7">
                {monthCells.map((cell, i) => {
                  const entries = entriesByDate.get(cell.iso) || [];
                  const isToday = cell.iso === todayISO;
                  // Past days (before today) keep their colours but render dimmer.
                  const isPast = cell.iso < todayISO;
                  const isWeekend = cell.date.getDay() === 0 || cell.date.getDay() === 6;
                  return (
                    <div
                      key={cell.iso + i}
                      onClick={() => openNewEvent(cell.iso)}
                      title="Click to add an event"
                      className={`group relative min-h-[128px] border-b border-r border-neutral-100 last:border-r-0 p-1.5 flex flex-col gap-1.5 cursor-pointer transition-colors ${
                        isToday
                          ? "bg-neutral-100 ring-1 ring-inset ring-neutral-300 hover:bg-neutral-100"
                          : cell.inMonth
                            ? `${isWeekend ? "bg-neutral-50/40" : "bg-white"} hover:bg-neutral-50`
                            : "bg-neutral-50/60 hover:bg-neutral-50"
                      } ${(i + 1) % 7 === 0 ? "border-r-0" : ""}`}
                    >
                      <div className="flex items-center justify-between px-0.5">
                        <span className={`min-w-[28px] h-7 px-1.5 rounded-full flex items-center justify-center text-[13px] ${
                          isToday ? "bg-neutral-900 text-white font-bold shadow" : cell.inMonth ? "text-neutral-800 font-semibold group-hover:bg-neutral-100" : "text-neutral-300"
                        }`}>
                          {cell.date.getDate()}
                        </span>
                        <span className="w-5 h-5 rounded-full bg-neutral-900 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"><Plus size={12} /></span>
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
                              className={`flex items-center gap-1.5 text-left pl-2 pr-2 py-1 text-[11px] font-semibold truncate transition-all hover:shadow-sm hover:-translate-y-px ${chipCls(entry)} ${isPast ? "opacity-60" : ""}`}
                            >
                              <span className={`truncate ${style.strike ? "line-through" : ""}`}>
                                {entryTimeOf(entry) ? <span className="opacity-70 font-medium">{entryTimeOf(entry)} </span> : ""}{style.title}
                              </span>
                            </button>
                          );
                        })}
                        {entries.length > 3 && (
                          <span className="text-[11px] text-neutral-400 font-medium px-1.5">+{entries.length - 3} more</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── AGENDA (Teams-style) ──────────────────────────────── */}
          {view === "agenda" && (
            agendaDates.length === 0 ? (
              <div className="py-12 text-center text-sm text-neutral-500">You're up to date!</div>
            ) : (
              <div className="max-w-3xl w-full mx-auto flex flex-col gap-5">
                {agendaDates.map((dateKey) => {
                  const d = new Date(`${dateKey}T00:00:00`);
                  const isToday = dateKey === todayISO;
                  const past = dateKey < todayISO;
                  const list = entriesByDate.get(dateKey)!.slice().sort(sortByTime);
                  return (
                    <div key={dateKey}>
                      {/* Date header — big day number + weekday, month, year */}
                      <div className="flex items-baseline gap-2 mb-2 pb-2 border-b border-neutral-200">
                        <span className={`text-[20px] font-semibold ${isToday ? "text-neutral-900" : "text-neutral-800"}`}>{d.getDate()}</span>
                        <span className={`text-[13px] ${isToday ? "text-neutral-900" : "text-neutral-500"}`}>
                          {d.toLocaleDateString("en-GB", { weekday: "long" })}, {d.toLocaleDateString("en-GB", { month: "short" })} {d.getFullYear()}
                          {isToday && " · Today"}
                        </span>
                      </div>
                      <div className="flex flex-col gap-2">
                        {list.map((entry) => {
                          const style = entryStyle(entry);
                          const time = entryTimeOf(entry);
                          return (
                            <button
                              key={entryKey(entry)}
                              type="button"
                              onClick={() => openEntry(entry)}
                              className={`flex items-stretch gap-3 rounded-md p-3 text-left border border-neutral-200 transition hover:brightness-95 ${agendaTint(entry)}`}
                            >
                              {/* Left source-colour bar */}
                              <div className={`w-1 rounded shrink-0 ${style.dot}`} style={{ opacity: past ? 0.45 : 1 }} />
                              <div className="w-20 shrink-0 text-[13px] text-neutral-500">{time || "All day"}</div>
                              <div className="min-w-0 flex-1">
                                <div className={`text-[14px] font-semibold truncate ${style.strike ? "line-through text-neutral-400" : "text-neutral-900"}`}>{style.title}</div>
                                <div className="text-[12px] text-neutral-500 truncate">{agendaSubtitle(entry)}</div>
                              </div>
                              {hasAttachment(entry) && <Paperclip size={14} className="self-center shrink-0 text-neutral-400" aria-label="Has attachment" />}
                            </button>
                          );
                        })}
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
                  <div key={mi} className="rounded border border-neutral-200 bg-white shadow-sm p-3">
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
                              isT ? "bg-neutral-900 text-white font-semibold" : has ? "bg-neutral-200 text-neutral-800 font-medium" : "text-neutral-600 hover:bg-neutral-100"
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
        </section>
      </main>

      {showEventModal && (
        <FleetEventModal
          event={editingEvent}
          module={module}
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
          module={module}
          onClose={() => setShowTaskModal(false)}
          onSaved={() => {
            setShowTaskModal(false);
            toast.success("Task updated.");
            load();
          }}
        />
      )}

      {/* Read-first detail sliders (Edit button opens the modal) — clicking an
          existing event / task on the calendar opens these, not the edit modal. */}
      {detailEvent && (
        <FleetEventDetailSlider
          event={detailEvent}
          onClose={() => setDetailEvent(null)}
          onEdit={() => { openEditEvent(detailEvent); setDetailEvent(null); }}
          onRefresh={load}
        />
      )}
      {detailTask && (
        <FleetTaskDetailSlider
          task={detailTask}
          onClose={() => setDetailTask(null)}
          onEdit={() => { openEditTask(detailTask); setDetailTask(null); }}
          onRefresh={load}
        />
      )}
    </div>
  );
};

export default FleetTasksCalendar;
