import React, { useEffect, useMemo, useRef, useState } from "react";
import Select from "react-select";
import { Search, Filter } from "lucide-react";
import {
  listCalendarEvents, type CalendarEvent, type EventFilters,
} from "../../services/CalendarEvents/CalendarEvents";
import { useAssignees } from "../TaskManagement/useAssignees";
import { EVENT_TYPES, DEPARTMENTS } from "../TaskManagement/calendar/eventMeta";
import EventFormDrawer from "../TaskManagement/calendar/EventFormDrawer";
import EventDetailsDrawer from "../TaskManagement/calendar/EventDetailsDrawer";
import DateField from "../TaskManagement/calendar/DateField";
import { customStyles, BlueDropdownIndicator } from "../Claims/Steps/GeneralDetailsForm";
import { SpinnerLoader } from "../../components/common/SpinnerLoader";
import { getClaims } from "../../services/Claims/Claims";
import { getVehicleOptions } from "../../services/Tasks/Tasks";
import Vector6 from "../../assets/AutoClaim_icon/Vector-6.svg";
import attachmentIcon from "../../assets/TaskManagement/attachment.svg";

/**
 * Teams-style Calendar (teams.live.com/v2 look) — hand-built with plain divs +
 * Segoe UI in the app blue theme. Fully functional: Day / Week / Month / Year /
 * Agenda views, a filters row, search, click-to-create, and the shared event
 * form + details side-drawers (create / edit / complete / cancel / delete).
 */

// Teams / Fluent purple palette.
const PURPLE = "#0352FD";
const PURPLE_DARK = "#2e6bee";
const GRID = "#E1DFDD";
const GRID_SOFT = "#EDEBE9";
const WEEKEND = "#FAF9F8";
const CHIP_BG = "#E8EBFA";
const CHIP_TEXT = "#33344A";
const RED = "#C4314B";

const MONTHS = ["January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"];
const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const WD_FULL = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const WD_INIT = ["M", "T", "W", "T", "F", "S", "S"];

type View = "day" | "week" | "month" | "year" | "agenda";
const VIEW_OPTS: [View, string][] = [["day", "Day"], ["week", "Week"], ["month", "Month"], ["year", "Year"], ["agenda", "Agenda"]];

const toKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
const evMinutes = (t?: string | null) => {
  if (!t || !t.includes(":")) return null;
  const [h, m] = t.split(":").map(Number);
  return h * 60 + (m || 0);
};
const mondayOf = (d: Date) => { const s = new Date(d); s.setDate(d.getDate() - ((d.getDay() + 6) % 7)); s.setHours(0, 0, 0, 0); return s; };

// Demo fallback (shown only if the API is unreachable, e.g. logged out).
const _t = new Date();
const mk = (off: number, sh: number, sm: number, eh: number, em: number, title: string, sub: string): CalendarEvent => {
  const d = new Date(_t); d.setDate(d.getDate() + off); const key = toKey(d);
  return {
    id: Math.floor(Math.random() * 1e9), title, event_type: sub, status: "Scheduled",
    start_date: key, end_date: key,
    start_time: `${String(sh).padStart(2, "0")}:${String(sm).padStart(2, "0")}`,
    end_time: `${String(eh).padStart(2, "0")}:${String(em).padStart(2, "0")}`,
  } as CalendarEvent;
};
const SAMPLE: CalendarEvent[] = [mk(0, 16, 0, 16, 30, "meeting with colleagues", "Microsoft Teams Meeting")];

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const HOUR_PX = 56;
const GUTTER = 56;

// react-select pieces (compact, app-themed) for the filters row.
const rsPortal = typeof document !== "undefined" ? document.body : undefined;
const rsComponents = { DropdownIndicator: BlueDropdownIndicator, IndicatorSeparator: () => null };
// App-standard select (52px, matches General Details) with non-wrapping placeholder.
const filterStyles: any = {
  ...customStyles,
  // Portaled menu must sit above the filter popover (z-40); customStyles doesn't set this.
  menuPortal: (b: any) => ({ ...b, zIndex: 9999 }),
  placeholder: (b: any) => ({ ...b, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }),
  singleValue: (b: any) => ({ ...b, whiteSpace: "nowrap" }),
};
const FilterSelect = ({ value, onChange, options, placeholder, width = 180, searchable = false, clearable = false }:
  { value: string; onChange: (v: string) => void; options: string[]; placeholder: string; width?: number | string; searchable?: boolean; clearable?: boolean }) => (
  <div style={{ width }}>
    <Select
      options={options.map((o) => ({ label: o, value: o }))}
      value={value ? { label: value, value } : null}
      onChange={(o: any) => onChange(o?.value || "")}
      styles={filterStyles} components={rsComponents} menuPortalTarget={rsPortal}
      placeholder={placeholder} isSearchable={searchable} isClearable={clearable}
    />
  </div>
);
const fInput = "h-[52px] px-4 rounded border border-neutral-200 text-sm text-neutral-700 outline-none focus:border-[#5B5FC7] bg-white";

// Attachment count for an event (attachment_path may be comma-separated).
const attCount = (e: CalendarEvent) =>
  String(e.attachment_path || "").split(",").map((s) => s.trim()).filter(Boolean).length;

// Full paperclip + count badge (agenda / details).
const AttachmentBadge = ({ count }: { count: number }) => {
  if (!count) return null;
  return (
    <span className="relative inline-flex shrink-0 w-4 h-4" title={`${count} attachment${count === 1 ? "" : "s"}`}>
      <img src={attachmentIcon} alt="" className="w-4 h-4" />
      <span className="absolute -top-2 -left-2 min-w-[15px] h-[15px] px-1 rounded-full bg-blue-200 text-blue-500 text-[10px] font-weight-600 flex items-center justify-center leading-none">{count}</span>
    </span>
  );
};

// Compact inline paperclip + count for small event chips.
const AttachmentInline = ({ count }: { count: number }) => {
  if (!count) return null;
  return (
    <span className="inline-flex items-center gap-0.5 shrink-0" title={`${count} attachment${count === 1 ? "" : "s"}`}>
      <img src={attachmentIcon} alt="" className="w-3 h-3 opacity-70" />
      <span className="text-[10px] font-weight-600 opacity-80">{count}</span>
    </span>
  );
};

const OutlineBtn: React.FC<{ children: React.ReactNode; onClick?: () => void }> = ({ children, onClick }) => (
  <button type="button" onClick={onClick}
    className="h-9 px-3 inline-flex items-center gap-2 rounded-md bg-white text-[13px] text-[#242424] hover:bg-[#f5f5f5]"
    style={{ border: "1px solid #D1D1D1" }}>
    {children}
  </button>
);
const Chevron = ({ d = "down" }: { d?: "down" | "left" | "right" }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {d === "down" && <path d="M6 9l6 6 6-6" />}
    {d === "left" && <path d="M15 18l-6-6 6-6" />}
    {d === "right" && <path d="M9 18l6-6-6-6" />}
  </svg>
);

const TeamsCalendarExample: React.FC = () => {
  const today = new Date();
  const [view, setView] = useState<View>("week");
  const [anchor, setAnchor] = useState(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; });
  const [events, setEvents] = useState<CalendarEvent[]>(SAMPLE);
  const [loading, setLoading] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [dateMenuOpen, setDateMenuOpen] = useState(false);
  const [jumpYear, setJumpYear] = useState(() => new Date().getFullYear());
  const [reloadKey, setReloadKey] = useState(0);
  const scrolled = useRef(false);
  const assignees = useAssignees();

  // Claim-ref and vehicle-reg dropdown options.
  const [claimRefs, setClaimRefs] = useState<string[]>([]);
  const [vehicleRegs, setVehicleRegs] = useState<string[]>([]);
  useEffect(() => {
    // Claims come from the claims list (claim reference).
    getClaims()
      .then((res: any) => {
        const arr = Array.isArray(res) ? res : res?.data ?? res?.items ?? [];
        const refs = new Set<string>();
        arr.forEach((c: any) => {
          const ref = c.our_reference || c.claim_no || c.claim_number;
          if (ref) refs.add(String(ref));
        });
        setClaimRefs([...refs]);
      })
      .catch(() => {});
    // Vehicles come from the same tenant-wide source as Task Management.
    getVehicleOptions()
      .then(({ data }) => setVehicleRegs(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

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
  // The clicked occurrence date — a recurring series shares one id across days,
  // so we remember which day (and its status) was opened to scope per-occurrence actions.
  const [detailsDate, setDetailsDate] = useState<string | null>(null);
  const [detailsStatus, setDetailsStatus] = useState<string | null>(null);
  const openDetails = (e: CalendarEvent) => { setDetailsId(e.id); setDetailsDate(e.start_date || null); setDetailsStatus(e.status || null); };
  const closeDetails = () => { setDetailsId(null); setDetailsDate(null); setDetailsStatus(null); };

  const weekDays = useMemo(() => {
    const s = mondayOf(anchor);
    return Array.from({ length: 7 }, (_, i) => { const d = new Date(s); d.setDate(s.getDate() + i); return d; });
  }, [anchor]);

  // Month grid: ONLY the current month's days (1 … last), weekday-aligned. Leading
  // and trailing slots are blank — we never spill into the previous / next month.
  const monthGrid = useMemo(() => {
    const y = anchor.getFullYear(), m = anchor.getMonth();
    const lead = (new Date(y, m, 1).getDay() + 6) % 7; // Monday-based offset of the 1st
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const cells: (Date | null)[] = [];
    for (let i = 0; i < lead; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(y, m, d));
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [anchor]);

  // Visible date range per view (date-range filter overrides the bounds).
  const range = useMemo(() => {
    let start: string, end: string;
    if (view === "day") { start = end = toKey(anchor); }
    else if (view === "week") { start = toKey(weekDays[0]); end = toKey(weekDays[6]); }
    else if (view === "month") {
      const y = anchor.getFullYear(), m = anchor.getMonth();
      start = toKey(new Date(y, m, 1)); end = toKey(new Date(y, m + 1, 0));
    }
    else if (view === "year") { start = `${anchor.getFullYear()}-01-01`; end = `${anchor.getFullYear()}-12-31`; }
    else { start = `${today.getFullYear() - 5}-01-01`; end = `${today.getFullYear() + 5}-12-31`; } // agenda: show all (past + future)
    if (fFrom) start = fFrom;
    if (fTo) end = fTo;
    return { start, end };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, anchor, weekDays, fFrom, fTo]);

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
      .catch(() => setEvents(SAMPLE))
      .finally(() => setLoading(false));
  }, [range.start, range.end, fType, fUser, fDept, fClaim, fVehicle, search, reloadKey]);

  const byDay = useMemo(() => {
    const m: Record<string, CalendarEvent[]> = {};
    events.forEach((e) => { if (e.start_date) (m[e.start_date] = m[e.start_date] || []).push(e); });
    return m;
  }, [events]);

  const move = (delta: number) => {
    const d = new Date(anchor);
    if (view === "day") d.setDate(d.getDate() + delta);
    else if (view === "week" || view === "agenda") d.setDate(d.getDate() + delta * 7);
    else if (view === "month") d.setMonth(d.getMonth() + delta);
    else d.setFullYear(d.getFullYear() + delta);
    setAnchor(d);
  };
  const goToday = () => { const d = new Date(); d.setHours(0, 0, 0, 0); setAnchor(d); };
  const pick = (v: View) => { setView(v); setMenuOpen(false); };

  const openCreate = (d?: Date, time?: string) => {
    const ds = d ? toKey(d) : toKey(today);
    setEditing({ start_date: ds, end_date: ds, start_time: time, status: "Scheduled" });
    setFormOpen(true);
  };
  const openEdit = (ev: CalendarEvent) => { setEditing(ev); setDetailsId(null); setFormOpen(true); };
  const refresh = () => setReloadKey((k) => k + 1);
  const clearFilters = () => { setFType(""); setFUser(""); setFDept(""); setFClaim(""); setFVehicle(""); setFFrom(""); setFTo(""); setSearch(""); };
  const hasFilters = fType || fUser || fDept || fClaim || fVehicle || fFrom || fTo || search;
  const filterCount = [fType, fUser, fDept, fClaim, fVehicle, fFrom, fTo, search].filter(Boolean).length;
  // "You're up to date!" shows only when there are no events today or later in view.
  const upcomingCount = useMemo(() => {
    const todayKey = toKey(today);
    return events.filter((e) => e.start_date && e.start_date >= todayKey).length;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events]);

  // One colour per SOURCE — Task Management items vs Calendar-created events —
  // regardless of pending/in-progress. Generic overrides apply to both:
  // completed = green, overdue = red, cancelled = grey.
  // Engineer Inspections are system events too, but get their own colour so they
  // don't read the same as Task Management deadlines.
  const isEngineerInspection = (e: CalendarEvent) =>
    e.event_type === "Engineer Inspection" || e.source_type === "engineer_inspection";
  // Task Management = task deadlines synced in (not engineer inspections).
  const isTaskMgmt = (e: CalendarEvent) =>
    e.source_type === "task_due" || !!e.task_id ||
    (e.source === "system" && !isEngineerInspection(e));

  const chipClsFor = (e: CalendarEvent) => {
    const st = (e.status || "").toLowerCase();
    if (st === "cancelled") return "bg-neutral-100 text-neutral-400 line-through";
    if (st === "completed") return "bg-green-100 text-green-600";
    if (e.start_date && e.start_date < toKey(today)) return "bg-red-100 text-red-600"; // overdue
    if (isEngineerInspection(e)) return "bg-purple-100 text-purple-600"; // Engineer Inspection
    return isTaskMgmt(e)
      ? "bg-yellow-100 text-yellow-500"   // Task Management
      : "bg-blue-100 text-blue-500";    // created on the Calendar
  };

  // Light source-tint background for the Agenda rows (matches the chip colours),
  // so events are distinguishable without colouring the label text itself.
  const chipBgFor = (e: CalendarEvent) => {
    const st = (e.status || "").toLowerCase();
    if (st === "cancelled") return "bg-neutral-100/50";
    if (st === "completed") return "bg-green-100/40";
    if (e.start_date && e.start_date < toKey(today)) return "bg-red-100/40";
    if (isEngineerInspection(e)) return "bg-purple-100/40"; // Engineer Inspection
    return isTaskMgmt(e) ? "bg-amber-100/40" : "bg-blue-100/40";
  };

  // Dropdown options = claims-list values unioned with anything seen on loaded events.
  const claimOpts = useMemo(() => {
    const s = new Set(claimRefs);
    events.forEach((e) => { if (e.claim_reference) s.add(e.claim_reference); });
    return [...s];
  }, [claimRefs, events]);
  const vehicleOpts = useMemo(() => {
    const s = new Set(vehicleRegs);
    events.forEach((e) => { if (e.vehicle_registration) s.add(e.vehicle_registration); });
    return [...s];
  }, [vehicleRegs, events]);

  const title = view === "year"
    ? `${anchor.getFullYear()}`
    : view === "week"
      ? `${MONTHS[weekDays[3].getMonth()]} ${weekDays[3].getFullYear()}`
      : `${MONTHS[anchor.getMonth()]} ${anchor.getFullYear()}`;

  const nowTop = ((today.getHours() * 60 + today.getMinutes()) / 60) * HOUR_PX;

  // -------------------------------------------------- time grid (day / week)
  const TimeGrid = ({ cols, outline }: { cols: Date[]; outline: boolean }) => {
    const gtCols = `${GUTTER}px repeat(${cols.length}, 1fr)`;
    const showNow = cols.some((c) => sameDay(c, today));
    return (
      <>
        <div>
        <div className="grid" style={{ gridTemplateColumns: gtCols }}>
          <div style={{ borderBottom: `1px solid ${GRID}` }} />
          {cols.map((d, i) => {
            const isToday = sameDay(d, today);
            const prevIsToday = i > 0 && sameDay(cols[i - 1], today);
            return (
              <div key={i} className="px-3 py-2"
                style={{
                  // today's right edge = next column's blue left border (avoids a doubled blue+grey line)
                  borderLeft: outline && (isToday || prevIsToday) ? `1px solid ${PURPLE}` : cols.length > 1 ? `1px solid ${GRID}` : undefined,
                  borderRight: outline && isToday && i === cols.length - 1 ? `1px solid ${PURPLE}` : undefined,
                  // today = a clean blue box (top + bottom blue); white bg + raised z-index cover the toolbar's grey line so the top isn't doubled
                  borderTop: outline && isToday ? `1px solid ${PURPLE}` : undefined,
                  borderBottom: outline && isToday ? `1px solid ${PURPLE}` : `1px solid ${GRID}`,
                  marginTop: outline && isToday ? -2 : 0,
                  background: outline && isToday ? "#fff" : undefined,
                  position: outline && isToday ? "relative" : undefined,
                  zIndex: outline && isToday ? 1 : undefined,
                }}>
                <div className="text-[22px] font-weight-600 leading-7" style={{ color: isToday ? PURPLE : "#242424" }}>{d.getDate()}</div>
                <div className="text-[12px]" style={{ color: isToday ? PURPLE : "#616161" }}>{WD_FULL[(d.getDay() + 6) % 7]}</div>
              </div>
            );
          })}
        </div>
        </div>
        <div className="overflow-y-auto" style={{ maxHeight: "calc(100vh - 220px)" }}
          ref={(el) => { if (el && !scrolled.current) { el.scrollTop = 8 * HOUR_PX; scrolled.current = true; } }}>
          <div className="grid" style={{ gridTemplateColumns: gtCols }}>
            <div className="relative">
              {HOURS.map((h) => (
                <div key={h} style={{ height: HOUR_PX }} className="relative">
                  {/* first label sits flush at the top so it isn't clipped; the rest center on their hour line */}
                  <span className="absolute right-2 text-[12px]" style={{ color: "#616161", top: h === 0 ? 0 : -8 }}>{h}</span>
                </div>
              ))}
            </div>
            {cols.map((d, ci) => {
              const isToday = sameDay(d, today);
              const prevIsToday = ci > 0 && sameDay(cols[ci - 1], today);
              const isWeekend = d.getDay() === 0 || d.getDay() === 6;
              const evs = events.filter((e) => e.start_date === toKey(d) && evMinutes(e.start_time) != null);
              return (
                <div key={ci} className="relative"
                  style={{
                    height: HOURS.length * HOUR_PX,
                    background: isToday ? "rgba(91,95,199,0.05)" : isWeekend && cols.length > 1 ? WEEKEND : "#fff",
                    // today's right edge = next column's blue left border (avoids a doubled blue+grey line)
                    borderLeft: outline && (isToday || prevIsToday) ? `1px solid ${PURPLE}` : cols.length > 1 ? `1px solid ${GRID}` : undefined,
                    borderRight: outline && isToday && ci === cols.length - 1 ? `1px solid ${PURPLE}` : undefined,
                  }}
                  onClick={(ev) => {
                    const rect = (ev.currentTarget as HTMLElement).getBoundingClientRect();
                    const mins = Math.max(0, Math.floor(((ev.clientY - rect.top) / HOUR_PX) * 60));
                    openCreate(d, `${String(Math.floor(mins / 60)).padStart(2, "0")}:00`);
                  }}>
                  {HOURS.map((h) => (
                    <div key={h} style={{ height: HOUR_PX, borderBottom: `1px solid ${GRID_SOFT}` }}>
                      <div style={{ height: "50%", borderBottom: `1px dashed ${GRID_SOFT}` }} />
                    </div>
                  ))}
                  {showNow && isToday && (
                    <>
                      <div className="absolute z-20" style={{ top: nowTop, left: -4, width: 8, height: 8, borderRadius: 9999, background: RED }} />
                      <div className="absolute left-0 right-0 z-20" style={{ top: nowTop, height: 2, background: RED }} />
                    </>
                  )}
                  {evs.map((e) => {
                    const start = evMinutes(e.start_time) as number;
                    const endM = evMinutes(e.end_time);
                    const dur = endM && endM > start ? endM - start : 30;
                    const top = (start / 60) * HOUR_PX;
                    // Floor the height to fit the two-line label (title + type) so
                    // point-in-time deadlines don't spill text past a tiny slot.
                    const minHeight = Math.max(40, (dur / 60) * HOUR_PX - 2);
                    return (
                      <button key={`${e.id}-${e.start_date}`} type="button" title={e.title}
                        onClick={(ev) => { ev.stopPropagation(); openDetails(e); }}
                        className={`absolute text-left overflow-hidden border-l-[3px] border-current ${chipClsFor(e)}`}
                        style={{ top: top + 1, left: 3, right: 3, minHeight, borderRadius: 4, padding: "4px 8px" }}>
                        <div className="text-[12px] font-weight-600 truncate leading-4">{e.title}</div>
                        <div className="flex items-center gap-1 leading-4">
                          {e.event_type && <span className="text-[11px] truncate opacity-70">{e.event_type}</span>}
                          <AttachmentInline count={attCount(e)} />
                        </div>
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </>
    );
  };

  // -------------------------------------------------- month
  const MonthView = () => (
    <div className="flex-1 overflow-auto" style={{ maxHeight: "calc(100vh - 200px)" }}>
      <div className="grid grid-cols-7" style={{ borderBottom: `1px solid ${GRID}` }}>
        {WD_FULL.map((w) => <div key={w} className="px-3 py-2 text-[12px] font-weight-600" style={{ color: "#616161", borderLeft: `1px solid ${GRID}` }}>{w}</div>)}
      </div>
      <div className="grid grid-cols-7">
        {monthGrid.map((d, i) => {
          // Blank slot before the 1st / after the last day — keeps weekday columns
          // aligned without showing any other month's dates.
          if (!d) {
            return <div key={`blank-${i}`} style={{ minHeight: 110, borderLeft: `1px solid ${GRID}`, borderBottom: `1px solid ${GRID}`, background: "#FBFBFA" }} />;
          }
          const isToday = sameDay(d, today);
          const isWeekend = d.getDay() === 0 || d.getDay() === 6;
          const evs = byDay[toKey(d)] || [];
          return (
            <div key={i} onClick={() => openCreate(d)} title="Click to add an event"
              style={{ minHeight: 110, borderLeft: `1px solid ${GRID}`, borderBottom: `1px solid ${GRID}`, background: isWeekend ? WEEKEND : "#fff" }}
              className="p-1.5 cursor-pointer hover:bg-blue-50/40">
              <div className="flex justify-start mb-1">
                <span className="inline-flex items-center justify-center text-[13px] font-weight-600" style={{ minWidth: 24, height: 24, borderRadius: 9999, background: isToday ? PURPLE : "transparent", color: isToday ? "#fff" : "#242424" }}>{d.getDate()}</span>
              </div>
              <div className="flex flex-col gap-1">
                {evs.slice(0, 3).map((e) => (
                  <button key={`${e.id}-${e.start_date}`} type="button" title={e.title} onClick={(ev) => { ev.stopPropagation(); openDetails(e); }}
                    className={`flex items-center gap-1 text-left text-[11px] font-weight-600 border-l-[3px] border-current ${chipClsFor(e)}`}
                    style={{ borderRadius: 4, padding: "2px 6px" }}>
                    <span className="truncate">{e.start_time ? <span className="opacity-70">{e.start_time} </span> : ""}{e.title}</span>
                    <AttachmentInline count={attCount(e)} />
                  </button>
                ))}
                {evs.length > 3 && <span className="text-[11px] px-1" style={{ color: "#616161" }}>+{evs.length - 3} more</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  // -------------------------------------------------- year
  const MiniMonth = ({ m }: { m: number }) => {
    const y = anchor.getFullYear();
    const start = mondayOf(new Date(y, m, 1));
    const cells = Array.from({ length: 42 }, (_, i) => { const d = new Date(start); d.setDate(start.getDate() + i); return d; });
    return (
      <button type="button" onClick={() => { setAnchor(new Date(y, m, 1)); setView("month"); }}
        className="text-left rounded-lg p-3 hover:bg-[#f5f5f5] transition-colors" style={{ border: `1px solid ${GRID}` }}>
        <div className="text-[14px] font-weight-600 mb-2" style={{ color: m === today.getMonth() && y === today.getFullYear() ? PURPLE : "#242424" }}>{MONTHS[m]}</div>
        <div className="grid grid-cols-7 gap-y-0.5">
          {WD_INIT.map((w, i) => <div key={i} className="text-center text-[10px]" style={{ color: "#999" }}>{w}</div>)}
          {cells.map((d, i) => {
            const inMonth = d.getMonth() === m;
            const isToday = sameDay(d, today);
            return (
              <div key={i} className="flex items-center justify-center">
                <span className="inline-flex items-center justify-center text-[11px]"
                  style={{ width: 18, height: 18, borderRadius: 9999, background: isToday ? PURPLE : "transparent", color: isToday ? "#fff" : inMonth ? "#242424" : "#c8c8c8", fontWeight: isToday ? 600 : 400 }}>
                  {d.getDate()}
                </span>
              </div>
            );
          })}
        </div>
      </button>
    );
  };
  const YearView = () => (
    <div className="flex-1 overflow-auto p-6" style={{ maxHeight: "calc(100vh - 200px)" }}>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 12 }, (_, m) => <MiniMonth key={m} m={m} />)}
      </div>
    </div>
  );

  // -------------------------------------------------- agenda
  const agendaGroups = useMemo(() => {
    const sorted = [...events].filter((e) => e.start_date)
      .sort((a, b) => `${a.start_date}${a.start_time || ""}`.localeCompare(`${b.start_date}${b.start_time || ""}`));
    const groups: { date: string; rows: CalendarEvent[] }[] = [];
    const idx: Record<string, number> = {};
    sorted.forEach((e) => {
      const k = e.start_date as string;
      if (idx[k] === undefined) { idx[k] = groups.length; groups.push({ date: k, rows: [] }); }
      groups[idx[k]].rows.push(e);
    });
    return groups;
  }, [events]);
  const AgendaView = () => (
    <div className="flex-1 overflow-auto p-6" style={{ maxHeight: "calc(100vh - 200px)" }}>
      <div className="max-w-3xl mx-auto flex flex-col gap-5">
        {agendaGroups.length === 0 && <div className="text-center text-[13px] py-12" style={{ color: "#616161" }}>You're up to date!</div>}
        {agendaGroups.map((g) => {
          const d = new Date(g.date + "T00:00:00");
          const isToday = sameDay(d, today);
          return (
            <div key={g.date}>
              <div className="flex items-baseline gap-2 mb-2 pb-2" style={{ borderBottom: `1px solid ${GRID}` }}>
                <span className="text-[20px] font-weight-600" style={{ color: isToday ? PURPLE : "#242424" }}>{d.getDate()}</span>
                <span className="text-[13px]" style={{ color: isToday ? PURPLE : "#616161" }}>
                  {WD_FULL[(d.getDay() + 6) % 7]}, {MONTHS_SHORT[d.getMonth()]} {d.getFullYear()}
                </span>
              </div>
              <div className="flex flex-col gap-2">
                {g.rows.map((e) => (
                  <button key={`${e.id}-${e.start_date}`} type="button" onClick={() => openDetails(e)}
                    className={`flex items-stretch gap-3 rounded-md p-3 text-left transition hover:brightness-95 ${chipBgFor(e)}`} style={{ border: `1px solid ${GRID}` }}>
                    <div className={chipClsFor(e)} style={{ width: 4, borderRadius: 4, background: "currentColor" }} />
                    <div className="w-20 shrink-0 text-[13px]" style={{ color: "#616161" }}>{e.start_time || "All day"}</div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[14px] font-weight-600 truncate" style={{ color: "#242424" }}>{e.title}</div>
                      {e.event_type && <div className="text-[12px] truncate" style={{ color: "#616161" }}>{e.event_type}</div>}
                    </div>
                    <div className="self-center pl-1"><AttachmentBadge count={attCount(e)} /></div>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white flex flex-col relative font-['Stack_Sans_Headline']" style={{ color: "#242424" }}>
      {loading && <SpinnerLoader />}
      {/* header */}
      <div className="flex items-center justify-between px-6 h-16 border-b shrink-0" style={{ borderColor: GRID }}>
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-[6px] flex items-center justify-center" style={{ background: PURPLE }}>
            <img src={Vector6} alt="calendar" className="w-4 h-4" style={{ filter: "brightness(0) invert(1)" }} />
          </div>
          <span className="text-[20px] font-weight-600">Calendar</span>
        </div>
        <div className="flex items-center gap-2">
      
          <button type="button" onClick={() => openCreate()} className="h-9 px-4 inline-flex items-center gap-2 rounded-md text-white text-[13px] font-weight-600" style={{ background: PURPLE }}
            onMouseEnter={(e) => (e.currentTarget.style.background = PURPLE_DARK)} onMouseLeave={(e) => (e.currentTarget.style.background = PURPLE)}>
            <span className="text-[16px] leading-none">+</span> Add Event
          </button>
        </div>
      </div>

      {/* toolbar */}
      <div className="flex items-center justify-between px-6 h-14 border-b shrink-0 relative" style={{ borderColor: GRID }}>
        <div className="flex items-center gap-2">
          <OutlineBtn onClick={goToday}>
            <img src={Vector6} alt="calendar" className="w-[15px] h-[15px]" />
            Today
          </OutlineBtn>
          <button type="button" onClick={() => move(-1)} className="w-8 h-8 inline-flex items-center justify-center rounded-md hover:bg-[#f0f0f0]" aria-label="Previous"><Chevron d="left" /></button>
          <button type="button" onClick={() => move(1)} className="w-8 h-8 inline-flex items-center justify-center rounded-md hover:bg-[#f0f0f0]" aria-label="Next"><Chevron d="right" /></button>
          <div className="relative">
            <button type="button"
              onClick={() => { setJumpYear((view === "year" ? anchor.getFullYear() : weekDays[3].getFullYear())); setDateMenuOpen((o) => !o); }}
              className="inline-flex items-center gap-1.5 px-2 h-8 rounded-md hover:bg-[#f0f0f0]">
              <span className="text-[16px] font-weight-600">{title}</span><Chevron />
            </button>
            {dateMenuOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setDateMenuOpen(false)} />
                <div className="absolute left-0 mt-2 z-40 w-64 rounded-lg bg-white shadow-xl p-3" style={{ border: `1px solid ${GRID}` }}>
                  <div className="flex items-center justify-between mb-2">
                    <button type="button" onClick={() => setJumpYear((y) => y - 1)} className="w-7 h-7 inline-flex items-center justify-center rounded-md hover:bg-[#f0f0f0]"><Chevron d="left" /></button>
                    <span className="text-[14px] font-weight-600">{jumpYear}</span>
                    <button type="button" onClick={() => setJumpYear((y) => y + 1)} className="w-7 h-7 inline-flex items-center justify-center rounded-md hover:bg-[#f0f0f0]"><Chevron d="right" /></button>
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    {MONTHS_SHORT.map((m, i) => {
                      const isCur = i === anchor.getMonth() && jumpYear === anchor.getFullYear();
                      return (
                        <button key={m} type="button"
                          onClick={() => { setAnchor(new Date(jumpYear, i, 1)); if (view === "year") setView("month"); setDateMenuOpen(false); }}
                          className="px-2 py-1.5 rounded text-[13px] hover:bg-blue-50"
                          style={isCur ? { background: PURPLE, color: "#fff" } : { color: "#242424" }}>
                          {m}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Filters icon + popover */}
          <div className="relative">
            <button type="button" onClick={() => setFiltersOpen((o) => !o)} title="Filters"
              className="relative w-9 h-9 inline-flex items-center justify-center rounded-md bg-white hover:bg-[#f5f5f5]"
              style={{ border: "1px solid #D1D1D1" }}>
              <Filter size={16} />
              {filterCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 rounded-full text-white text-[10px] font-weight-600 flex items-center justify-center border-2 border-white" style={{ background: PURPLE }}>
                  {filterCount}
                </span>
              )}
            </button>
            {filtersOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setFiltersOpen(false)} />
                <div className="absolute left-0 mt-2 z-40 w-[440px] rounded-lg bg-white shadow-xl p-4" style={{ border: `1px solid ${GRID}` }}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[15px] font-weight-600">Filters</span>
                    {hasFilters && (
                      <button type="button" onClick={clearFilters} className="text-[13px] hover:underline" style={{ color: PURPLE }}>Clear all</button>
                    )}
                  </div>
                  <div className="flex flex-col gap-3">
                    <div className="flex flex-col gap-1">
                      <span className="text-[12px] text-neutral-500">Search</span>
                      <div className="relative">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 z-10" />
                        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search events" className={fInput + " pl-9 w-full"} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1"><span className="text-[12px] text-neutral-500">Event Type</span><FilterSelect value={fType} onChange={setFType} options={EVENT_TYPES} placeholder="All types" width="100%" /></div>
                      <div className="flex flex-col gap-1"><span className="text-[12px] text-neutral-500">Assigned User</span><FilterSelect value={fUser} onChange={setFUser} options={assignees} placeholder="All users" width="100%" /></div>
                      <div className="flex flex-col gap-1"><span className="text-[12px] text-neutral-500">Department</span><FilterSelect value={fDept} onChange={setFDept} options={DEPARTMENTS} placeholder="All departments" width="100%" /></div>
                      <div className="flex flex-col gap-1"><span className="text-[12px] text-neutral-500">Claim Ref</span><FilterSelect value={fClaim} onChange={setFClaim} options={claimOpts} placeholder="All claims" width="100%" searchable clearable /></div>
                      <div className="flex flex-col gap-1"><span className="text-[12px] text-neutral-500">Vehicle Reg</span><FilterSelect value={fVehicle} onChange={setFVehicle} options={vehicleOpts} placeholder="All vehicles" width="100%" searchable clearable /></div>
                      <div />
                      <div className="flex flex-col gap-1"><span className="text-[12px] text-neutral-500">From</span><DateField value={fFrom} onChange={setFFrom} placeholder="From" className="w-full" /></div>
                      <div className="flex flex-col gap-1"><span className="text-[12px] text-neutral-500">To</span><DateField value={fTo} onChange={setFTo} placeholder="To" className="w-full" /></div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {upcomingCount === 0 && (
            <span className="text-[13px]" style={{ color: "#616161" }}>You're up to date!</span>
          )}
          <div className="relative">
            <button type="button" onClick={() => setMenuOpen((o) => !o)}
              className="h-9 px-3 inline-flex items-center gap-2 rounded-md bg-white text-[13px] hover:bg-[#f5f5f5]" style={{ border: "1px solid #D1D1D1" }}>
              <img src={Vector6} alt="calendar" className="w-[15px] h-[15px]" />
              {VIEW_OPTS.find(([v]) => v === view)?.[1]}
              <Chevron />
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 mt-1 z-40 w-40 rounded-md bg-white py-1 shadow-lg" style={{ border: `1px solid ${GRID}` }}>
                  {VIEW_OPTS.map(([v, label]) => (
                    <button key={v} type="button" onClick={() => pick(v)}
                      className="w-full text-left px-3 py-2 text-[13px] hover:bg-[#f5f5f5] flex items-center justify-between"
                      style={{ color: view === v ? PURPLE : "#242424", fontWeight: view === v ? 600 : 400 }}>
                      {label}
                      {view === v && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={PURPLE} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* body */}
      {view === "day" && <TimeGrid cols={[anchor]} outline={false} />}
      {view === "week" && <TimeGrid cols={weekDays} outline />}
      {view === "month" && <MonthView />}
      {view === "year" && <YearView />}
      {view === "agenda" && <AgendaView />}

      <EventFormDrawer open={formOpen} editing={editing} onClose={() => setFormOpen(false)} onSaved={refresh} />
      <EventDetailsDrawer open={detailsId != null} eventId={detailsId} occurrenceDate={detailsDate} occurrenceStatus={detailsStatus} onClose={closeDetails} onEdit={openEdit} onChanged={refresh} />
    </div>
  );
};

export default TeamsCalendarExample;
