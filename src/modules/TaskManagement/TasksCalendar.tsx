import React, { useEffect, useMemo, useState } from "react";
import Select from "react-select";
import { ChevronLeft, ChevronRight, Plus, Search } from "lucide-react";
import {
  listCalendarEvents, type CalendarEvent, type EventFilters,
} from "../../services/CalendarEvents/CalendarEvents";
import { useAssignees } from "./useAssignees";
import { EVENT_TYPES, DEPARTMENTS, eventChipCls, statusBadgeCls } from "./calendar/eventMeta";
import EventFormDrawer from "./calendar/EventFormDrawer";
import EventDetailsDrawer from "./calendar/EventDetailsDrawer";
import DateField from "./calendar/DateField";
import { customStyles, BlueDropdownIndicator } from "../Claims/Steps/GeneralDetailsForm";
import { SpinnerLoader } from "../../components/common/SpinnerLoader";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"];

const toKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

const inputCls = "h-9 px-3 rounded border border-neutral-200 text-sm text-neutral-700 outline-none focus:border-blue-500 bg-white";
// Filter-row text/date inputs match the 52px height of the app-standard react-selects.
const filterInputCls = "h-[52px] px-4 rounded border border-neutral-200 text-sm text-neutral-700 outline-none focus:border-blue-500 bg-white";
const rsComponents = { DropdownIndicator: BlueDropdownIndicator, IndicatorSeparator: () => null };
const rsPortal = typeof document !== "undefined" ? document.body : undefined;

// App-standard react-select for the filter bar (matches forms/dashboard selectors).
const FilterSelect = ({
  value, onChange, options, placeholder, width = 170,
}: { value: string; onChange: (v: string) => void; options: string[]; placeholder: string; width?: number }) => (
  <div style={{ width }}>
    <Select
      options={options.map((o) => ({ label: o, value: o }))}
      value={value ? { label: value, value } : null}
      onChange={(o: any) => onChange(o?.value || "")}
      styles={customStyles}
      components={rsComponents}
      menuPortalTarget={rsPortal}
      placeholder={placeholder}
      isClearable
      isSearchable={false}
    />
  </div>
);

const TasksCalendar: React.FC<{ onOpen?: (f: any) => void }> = () => {
  const [view, setView] = useState<"month" | "week" | "day" | "agenda">("month");
  const [cursor, setCursor] = useState(() => {
    const d = new Date(); d.setDate(1); d.setHours(0, 0, 0, 0); return d;
  });
  // Anchor day for the Day / Week time-grid views.
  const [anchor, setAnchor] = useState(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; });
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const today = new Date();
  const assignees = useAssignees();

  // filters
  const [search, setSearch] = useState("");
  const [fType, setFType] = useState("");
  const [fUser, setFUser] = useState("");
  const [fDept, setFDept] = useState("");
  const [fClaim, setFClaim] = useState("");
  const [fVehicle, setFVehicle] = useState("");
  const [fFrom, setFFrom] = useState("");
  const [fTo, setFTo] = useState("");

  // drawers
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<CalendarEvent> | null>(null);
  const [detailsId, setDetailsId] = useState<number | null>(null);

  const gridStart = useMemo(() => {
    const s = new Date(cursor); s.setDate(1 - s.getDay()); return s;
  }, [cursor]);
  const days = useMemo(
    () => Array.from({ length: 42 }, (_, i) => { const d = new Date(gridStart); d.setDate(gridStart.getDate() + i); return d; }),
    [gridStart],
  );

  // Days shown in the Week view (Sun..Sat around the anchor).
  const weekDays = useMemo(() => {
    const s = new Date(anchor); s.setDate(anchor.getDate() - anchor.getDay());
    return Array.from({ length: 7 }, (_, i) => { const d = new Date(s); d.setDate(s.getDate() + i); return d; });
  }, [anchor]);

  // Visible range per view.
  const range = useMemo(() => {
    if (view === "month") return { start: toKey(days[0]), end: toKey(days[41]) };
    if (view === "week") return { start: toKey(weekDays[0]), end: toKey(weekDays[6]) };
    if (view === "day") return { start: toKey(anchor), end: toKey(anchor) };
    const start = fFrom || toKey(today);
    const end = fTo || toKey(new Date(today.getFullYear(), today.getMonth() + 2, today.getDate()));
    return { start, end };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, gridStart, weekDays, anchor, fFrom, fTo]);

  useEffect(() => {
    setLoading(true);
    const params: EventFilters = {
      start: range.start, end: range.end,
      event_type: fType || undefined, assigned_user: fUser || undefined,
      department: fDept || undefined, claim_reference: fClaim || undefined,
      vehicle_registration: fVehicle || undefined, search: search || undefined,
    };
    listCalendarEvents(params)
      .then(({ data }) => setEvents(Array.isArray(data) ? data : []))
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  }, [range.start, range.end, fType, fUser, fDept, fClaim, fVehicle, search, reloadKey]);

  const byDay = useMemo(() => {
    const m: Record<string, CalendarEvent[]> = {};
    events.forEach((e) => { if (e.start_date) (m[e.start_date] = m[e.start_date] || []).push(e); });
    return m;
  }, [events]);

  const move = (delta: number) => {
    if (view === "month") { const d = new Date(cursor); d.setMonth(d.getMonth() + delta); setCursor(d); }
    else if (view === "week") { const d = new Date(anchor); d.setDate(d.getDate() + delta * 7); setAnchor(d); }
    else { const d = new Date(anchor); d.setDate(d.getDate() + delta); setAnchor(d); }
  };
  const goToday = () => {
    const d = new Date(); d.setHours(0, 0, 0, 0);
    const m = new Date(d); m.setDate(1);
    setCursor(m); setAnchor(d);
  };

  const openCreate = (d?: Date, time?: string) => {
    const ds = d ? toKey(d) : toKey(today);
    setEditing({ start_date: ds, end_date: ds, start_time: time, status: "Scheduled" });
    setFormOpen(true);
  };
  const openEdit = (ev: CalendarEvent) => { setEditing(ev); setDetailsId(null); setFormOpen(true); };
  const refresh = () => setReloadKey((k) => k + 1);

  const clearFilters = () => {
    setFType(""); setFUser(""); setFDept(""); setFClaim(""); setFVehicle(""); setFFrom(""); setFTo(""); setSearch("");
  };

  // Agenda: upcoming events grouped by date.
  const agendaGroups = useMemo(() => {
    const sorted = [...events].sort((a, b) =>
      `${a.start_date || ""}${a.start_time || ""}`.localeCompare(`${b.start_date || ""}${b.start_time || ""}`));
    const groups: { date: string; rows: CalendarEvent[] }[] = [];
    const idx: Record<string, number> = {};
    sorted.forEach((e) => {
      const k = e.start_date || "No date";
      if (idx[k] === undefined) { idx[k] = groups.length; groups.push({ date: k, rows: [] }); }
      groups[idx[k]].rows.push(e);
    });
    return groups;
  }, [events]);

  const viewBtn = (key: "month" | "week" | "day" | "agenda", label: string) => (
    <button type="button" onClick={() => setView(key)}
      className={`px-4 py-2 rounded text-sm ${view === key ? "bg-blue-500 text-white" : "text-blue-500 hover:bg-blue-50"}`}>
      {label}
    </button>
  );

  // Title for the current nav window.
  const navTitle = view === "month"
    ? `${MONTHS[cursor.getMonth()]} ${cursor.getFullYear()}`
    : view === "day"
      ? anchor.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long", year: "numeric" })
      : view === "week"
        ? `${weekDays[0].toLocaleDateString(undefined, { day: "numeric", month: "short" })} – ${weekDays[6].toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}`
        : "Upcoming Events";

  // Hour rows for the Day/Week time grid (07:00–21:00).
  const HOURS = Array.from({ length: 15 }, (_, i) => i + 7);
  const HOUR_PX = 48;
  const evMinutes = (t?: string | null) => {
    if (!t || !t.includes(":")) return null;
    const [h, m] = t.split(":").map(Number);
    return h * 60 + (m || 0);
  };
  const TimeGrid = ({ cols }: { cols: Date[] }) => (
    <div className="rounded-lg border border-neutral-200 overflow-hidden">
      <div className="grid" style={{ gridTemplateColumns: `60px repeat(${cols.length}, 1fr)` }}>
        <div className="bg-neutral-50 border-b border-neutral-200" />
        {cols.map((d, i) => {
          const isToday = sameDay(d, today);
          return (
            <div key={i} className={`px-2 py-2 text-center border-b border-l border-neutral-200 ${isToday ? "bg-blue-50" : "bg-neutral-50"}`}>
              <div className="text-[11px] text-neutral-500">{WEEKDAYS[d.getDay()]}</div>
              <div className={`text-sm font-weight-600 ${isToday ? "text-blue-600" : "text-neutral-800"}`}>{d.getDate()}</div>
            </div>
          );
        })}
      </div>
      <div className="grid" style={{ gridTemplateColumns: `60px repeat(${cols.length}, 1fr)` }}>
        {/* hour labels */}
        <div className="relative">
          {HOURS.map((h) => (
            <div key={h} style={{ height: HOUR_PX }} className="text-[11px] text-neutral-400 px-2 -mt-1.5 text-right border-r border-neutral-100">
              {String(h).padStart(2, "0")}:00
            </div>
          ))}
        </div>
        {cols.map((d, ci) => {
          const dayKey = toKey(d);
          const evs = events.filter((e) => e.start_date === dayKey);
          const timed = evs.filter((e) => evMinutes(e.start_time) != null);
          const allDay = evs.filter((e) => evMinutes(e.start_time) == null);
          return (
            <div key={ci} className="relative border-l border-neutral-100"
              style={{ height: HOURS.length * HOUR_PX }}
              onClick={(ev) => {
                const rect = (ev.currentTarget as HTMLElement).getBoundingClientRect();
                const mins = Math.max(0, Math.round(((ev.clientY - rect.top) / HOUR_PX) * 60) + HOURS[0] * 60);
                const hh = String(Math.floor(mins / 60)).padStart(2, "0");
                openCreate(d, `${hh}:00`);
              }}>
              {HOURS.map((h) => <div key={h} style={{ height: HOUR_PX }} className="border-b border-neutral-50" />)}
              {/* all-day events pinned at top */}
              {allDay.map((e, idx) => (
                <button key={e.id} type="button" onClick={(ev) => { ev.stopPropagation(); setDetailsId(e.id); }}
                  title={e.title}
                  className={`absolute left-1 right-1 px-1.5 py-0.5 rounded text-[11px] truncate ${eventChipCls(e.event_type, e.status)}`}
                  style={{ top: 2 + idx * 20, zIndex: 5 }}>
                  {e.title}
                </button>
              ))}
              {/* timed events */}
              {timed.map((e) => {
                const start = (evMinutes(e.start_time) as number) - HOURS[0] * 60;
                const top = Math.max(0, (start / 60) * HOUR_PX);
                return (
                  <button key={e.id} type="button" onClick={(ev) => { ev.stopPropagation(); setDetailsId(e.id); }}
                    title={e.title}
                    className={`absolute left-1 right-1 px-1.5 py-1 rounded text-[11px] text-left overflow-hidden ${eventChipCls(e.event_type, e.status)}`}
                    style={{ top, height: HOUR_PX - 4, zIndex: 6 }}>
                    <span className="font-weight-600">{e.start_time}</span> {e.title}
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <>
      <div className="h-20 px-10 py-4 border-b border-neutral-100 flex items-center justify-between shrink-0">
        <h1 className="text-neutral-900 text-2xl font-weight-600">Calendar</h1>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search events"
              className={inputCls + " pl-9 w-56"} />
          </div>
          <button type="button" onClick={() => openCreate()}
            className="h-10 px-4 rounded bg-blue-500 text-white text-sm font-weight-500 flex items-center gap-2 hover:bg-blue-600">
            <Plus size={16} /> Add Event
          </button>
        </div>
      </div>

      <section className="px-10 py-6 flex-1 overflow-auto font-['Stack_Sans_Headline'] relative">
        {loading && <SpinnerLoader />}

        {/* Top bar: nav + view switch */}
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            {view !== "agenda" ? (
              <>
                <button type="button" onClick={() => move(-1)} className="w-9 h-9 rounded border border-neutral-200 flex items-center justify-center text-neutral-600 hover:bg-neutral-50"><ChevronLeft size={18} /></button>
                <h2 className="text-neutral-900 text-lg font-weight-600 min-w-[200px] text-center">{navTitle}</h2>
                <button type="button" onClick={() => move(1)} className="w-9 h-9 rounded border border-neutral-200 flex items-center justify-center text-neutral-600 hover:bg-neutral-50"><ChevronRight size={18} /></button>
                <button type="button" onClick={goToday} className="h-9 px-4 rounded border border-blue-500 text-blue-500 text-sm font-weight-500 hover:bg-blue-50">Today</button>
              </>
            ) : (
              <h2 className="text-neutral-900 text-lg font-weight-600">Upcoming Events</h2>
            )}
          </div>
          <div className="flex items-center gap-1 p-0.5 rounded border border-blue-200">
            {viewBtn("day", "Day")}
            {viewBtn("week", "Week")}
            {viewBtn("month", "Month")}
            {viewBtn("agenda", "Agenda")}
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap mb-5">
          <FilterSelect value={fType} onChange={setFType} options={EVENT_TYPES} placeholder="All Types" />
          <FilterSelect value={fUser} onChange={setFUser} options={assignees} placeholder="All Users" />
          <FilterSelect value={fDept} onChange={setFDept} options={DEPARTMENTS} placeholder="All Departments" width={180} />
          <input value={fClaim} onChange={(e) => setFClaim(e.target.value)} placeholder="Claim ref" className={filterInputCls + " w-36"} />
          <input value={fVehicle} onChange={(e) => setFVehicle(e.target.value)} placeholder="Vehicle reg" className={filterInputCls + " w-36"} />
          {view === "agenda" && (
            <>
              <DateField value={fFrom} onChange={setFFrom} placeholder="From" className="w-40" />
              <DateField value={fTo} onChange={setFTo} placeholder="To" className="w-40" />
            </>
          )}
          <button type="button" onClick={clearFilters} className="h-[52px] px-3 text-sm text-neutral-500 hover:text-neutral-700">Clear</button>
        </div>

        {/* WEEK / DAY TIME-GRID VIEWS */}
        {view === "week" && <TimeGrid cols={weekDays} />}
        {view === "day" && <TimeGrid cols={[anchor]} />}

        {/* MONTH VIEW */}
        {view === "month" && (
          <div className="rounded-lg border border-neutral-200 overflow-hidden">
            <div className="grid grid-cols-7 bg-neutral-50 border-b border-neutral-200">
              {WEEKDAYS.map((w) => <div key={w} className="px-3 py-2 text-xs font-weight-600 text-neutral-500">{w}</div>)}
            </div>
            <div className="grid grid-cols-7">
              {days.map((d, i) => {
                const inMonth = d.getMonth() === cursor.getMonth();
                const isToday = sameDay(d, today);
                const dayEvents = byDay[toKey(d)] || [];
                return (
                  <div key={i} onClick={() => openCreate(d)} title="Click to add an event"
                    className={`group relative min-h-[120px] border-b border-r border-neutral-100 p-2 flex flex-col gap-1 cursor-pointer hover:bg-blue-50/40 ${inMonth ? "bg-white" : "bg-neutral-50/50"}`}>
                    <div className="flex items-center justify-between">
                      <span className={`w-7 h-7 rounded-full flex items-center justify-center text-sm ${isToday ? "bg-blue-500 text-white font-weight-600" : inMonth ? "text-neutral-700" : "text-neutral-300"}`}>{d.getDate()}</span>
                      <Plus size={14} className="text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div className="flex flex-col gap-1">
                      {dayEvents.slice(0, 3).map((e) => (
                        <button key={e.id} type="button"
                          onClick={(ev) => { ev.stopPropagation(); setDetailsId(e.id); }}
                          title={e.title}
                          className={`flex items-center gap-1 text-left px-1.5 py-0.5 rounded text-[11px] truncate ${eventChipCls(e.event_type, e.status)}`}>
                          {e.source === "system" && <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70 shrink-0" />}
                          {e.start_time ? `${e.start_time} ` : ""}{e.title}
                        </button>
                      ))}
                      {dayEvents.length > 3 && (
                        <span className="text-[11px] text-blue-500 px-1.5">+{dayEvents.length - 3} more</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* AGENDA VIEW */}
        {view === "agenda" && (
          <div className="flex flex-col gap-5">
            {agendaGroups.length === 0 && (
              <div className="text-neutral-400 text-sm py-10 text-center border border-dashed border-neutral-200 rounded-lg">No events in this period.</div>
            )}
            {agendaGroups.map((g) => (
              <div key={g.date} className="rounded-lg border border-neutral-200 overflow-hidden">
                <div className="px-4 py-2 bg-neutral-50 text-sm font-weight-600 text-neutral-700 border-b border-neutral-100">
                  {g.date === "No date" ? "No date" : new Date(g.date + "T00:00:00").toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                </div>
                <div className="divide-y divide-neutral-50">
                  {g.rows.map((e) => (
                    <button key={e.id} type="button" onClick={() => setDetailsId(e.id)}
                      className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-neutral-50">
                      <span className={`w-2.5 h-2.5 rounded-full ${eventChipCls(e.event_type, e.status).split(" ")[0]}`} />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-weight-600 text-neutral-900 truncate">{e.title}</div>
                        <div className="text-xs text-neutral-500 truncate">
                          {e.event_type}{e.start_time ? ` · ${e.start_time}` : ""}{e.assigned_users?.length ? ` · ${e.assigned_users.join(", ")}` : ""}
                          {e.claim_reference ? ` · ${e.claim_reference}` : ""}
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[11px] font-weight-600 shrink-0 ${statusBadgeCls(e.status)}`}>{e.status || "Scheduled"}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <EventFormDrawer open={formOpen} editing={editing} onClose={() => setFormOpen(false)} onSaved={refresh} />
      <EventDetailsDrawer open={detailsId != null} eventId={detailsId} onClose={() => setDetailsId(null)} onEdit={openEdit} onChanged={refresh} />
    </>
  );
};

export default TasksCalendar;
