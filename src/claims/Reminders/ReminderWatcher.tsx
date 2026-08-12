import React, { useEffect, useRef, useState } from "react";
import { Bell, X } from "lucide-react";
import Select from "react-select";
import { listCalendarEvents, type CalendarEvent } from "../../services/CalendarEvents/CalendarEvents";
import { customStyles, BlueDropdownIndicator } from "../../modules/Claims/Steps/GeneralDetailsForm";

/**
 * Global, Teams-style reminder watcher. Mounted once at the app root so the
 * "Reminders" panel appears on whatever screen the user is on. For every
 * upcoming event it fires a reminder at all four offsets (1 day / 1 hour /
 * 30 min / 15 min before start).
 */

const OFFSETS = [1440, 60, 30, 15]; // minutes before start (default when none chosen)
const REMINDER_MIN: Record<string, number> = { "15m": 15, "30m": 30, "1h": 60, "1d": 1440 };
const POLL_MS = 60_000;       // re-check every minute
const CATCHUP_MS = 90_000;    // only fire if the reminder became due within this window

// Daily overdue nudge state — which task was nudged on which day — persisted in
// localStorage so a same-day page reload doesn't re-fire it (that was the "pops
// up all the time" problem). Keyed "taskId|YYYY-MM-DD"; entries older than 45
// days are pruned on read so it never grows unbounded.
const OVERDUE_STORE_KEY = "reminder_overdue_daily_shown";
const readOverdueShown = (): Record<string, number> => {
  try {
    const raw = JSON.parse(localStorage.getItem(OVERDUE_STORE_KEY) || "{}");
    const cutoff = Date.now() - 45 * 86_400_000;
    const out: Record<string, number> = {};
    for (const [k, v] of Object.entries(raw)) if (typeof v === "number" && v >= cutoff) out[k] = v;
    return out;
  } catch {
    return {};
  }
};
const writeOverdueShown = (map: Record<string, number>) => {
  try {
    localStorage.setItem(OVERDUE_STORE_KEY, JSON.stringify(map));
  } catch {
    /* storage full / unavailable — non-fatal */
  }
};

// Offsets to remind at for an event: the ones the user selected (comma-separated,
// may be multiple), or all four defaults if they didn't pick any. "none" means the
// user chose "Don't remind me" — auto reminders are turned off entirely.
const offsetsFor = (e: CalendarEvent): number[] => {
  const raw = String(e.reminder || "").split(",").map((s) => s.trim()).filter(Boolean);
  if (raw.includes("none")) return [];
  const sel = raw.map((k) => REMINDER_MIN[k]).filter((n): n is number => !!n);
  return sel.length ? sel : OFFSETS;
};

const pad = (n: number) => String(n).padStart(2, "0");
const dateKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

const formatTime12 = (t?: string | null) => {
  if (!t || !t.includes(":")) return "";
  const [hh, mm] = t.split(":").map(Number);
  const ampm = hh >= 12 ? "PM" : "AM";
  const h12 = hh % 12 === 0 ? 12 : hh % 12;
  return `${h12}:${pad(mm || 0)} ${ampm}`;
};

const eventStartMs = (e: CalendarEvent): number | null => {
  if (!e.start_date || !e.start_time || !e.start_time.includes(":")) return null; // timed events only
  const [y, m, d] = e.start_date.split("-").map(Number);
  const [hh, mm] = e.start_time.split(":").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d, hh || 0, mm || 0).getTime();
};

const MONTHS_FULL = ["January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"];

// "09:30 16 June 2026" — the headline date/time for the selected reminder.
const formatDetailDateTime = (ms: number) => {
  const d = new Date(ms);
  return `${pad(d.getHours())}:${pad(d.getMinutes())} ${d.getDate()} ${MONTHS_FULL[d.getMonth()]} ${d.getFullYear()}`;
};

// "in 5 minutes" / "in 2 hours" / "3 days overdue" — the right-hand list label.
const relativeLabel = (ms: number, now: number) => {
  const diff = ms - now;
  const mins = Math.max(1, Math.round(Math.abs(diff) / 60000));
  const unit =
    mins < 60 ? `${mins} minute${mins === 1 ? "" : "s"}`
    : mins < 1440 ? `${Math.round(mins / 60)} hour${Math.round(mins / 60) === 1 ? "" : "s"}`
    : `${Math.round(mins / 1440)} day${Math.round(mins / 1440) === 1 ? "" : "s"}`;
  return diff >= 0 ? `in ${unit}` : `${unit} overdue`;
};

// Snooze intervals (minutes) offered in the footer dropdown.
const SNOOZE_OPTIONS = [
  { label: "5 minutes", value: 5 },
  { label: "10 minutes", value: 10 },
  { label: "15 minutes", value: 15 },
  { label: "30 minutes", value: 30 },
  { label: "1 hour", value: 60 },
  { label: "2 hours", value: 120 },
  { label: "1 day", value: 1440 },
];

// App-standard selector look (same as the calendar/form selects), with the menu
// portalled above the reminder panel (which sits at z-[10000]).
const snoozeSelectStyles: any = {
  ...customStyles,
  menuPortal: (base: any) => ({ ...base, zIndex: 100001 }),
  // Keep the menu short and scrollable so it never overflows the screen.
  menuList: (base: any) => ({ ...base, maxHeight: 180 }),
};
const rsPortal = typeof document !== "undefined" ? document.body : undefined;

interface Popup { id: string; title: string; startMs: number; timeLabel: string; subtitle: string; }

const ReminderWatcher: React.FC<{ accent?: "blue" | "black" }> = ({ accent = "blue" }) => {
  const [popups, setPopups] = useState<Popup[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [snoozeMin, setSnoozeMin] = useState(5);
  const [, forceTick] = useState(0); // refresh the relative-time labels
  // In-memory only (resets per session) — no localStorage.
  const shownRef = useRef<Set<string>>(new Set());
  const snoozeTimers = useRef<number[]>([]);

  // Re-render every minute so "in 5 minutes" / "1 hour overdue" stay current.
  useEffect(() => {
    const t = setInterval(() => forceTick((x) => x + 1), 60_000);
    return () => { clearInterval(t); snoozeTimers.current.forEach(clearTimeout); };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const check = async () => {
      // Don't poll on the login / auth screens (no session yet → 401s).
      const path = window.location.pathname;
      if (path.startsWith("/login") || path.startsWith("/auth")) return;

      const now = Date.now();
      const today = new Date();
      const todayKey = dateKey(today);
      // Upcoming events (before-start offsets) + still-overdue tasks (a daily
      // nudge until done), so look back a few months to catch older deadlines.
      const start = dateKey(new Date(today.getFullYear(), today.getMonth(), today.getDate() - 90));
      const end = dateKey(new Date(today.getFullYear(), today.getMonth(), today.getDate() + 2));

      let events: CalendarEvent[] = [];
      try {
        const { data } = await listCalendarEvents({ start, end });
        events = Array.isArray(data) ? data : [];
      } catch {
        return; // not logged in / offline — just skip this tick
      }
      if (cancelled) return;

      const newPopups: Popup[] = [];
      events.forEach((e) => {
        const startMs = eventStartMs(e);
        if (!startMs || startMs <= now) return;
        const st = (e.status || "").toLowerCase();
        if (st === "cancelled" || st === "completed") return;

        offsetsFor(e).forEach((min) => {
          const remMs = startMs - min * 60000;
          const key = `${e.id}|${e.start_date}|${min}`;
          if (shownRef.current.has(key)) return;
          if (now >= remMs && now < startMs) {
            if (now - remMs <= CATCHUP_MS) {
              newPopups.push({
                id: key,
                title: e.title || "Event",
                startMs,
                timeLabel: formatTime12(e.start_time),
                subtitle: e.event_type || "",
              });
            }
            // mark shown even if stale, so it never fires late
            shownRef.current.add(key);
          }
        });
      });

      // Daily overdue nudge: while a task is past its deadline and still not done,
      // remind ONCE PER DAY — at (or after) its due time each day — every day until
      // it's completed. The per-day flag is persisted in localStorage, so a same-
      // day reload doesn't re-fire it (no "pops up on every screen all the time").
      const overdueShown = readOverdueShown();
      let overdueDirty = false;
      events.forEach((e) => {
        const isTaskEvent = (e as any).source_type === "task_due" || !!(e as any).task_id;
        if (!isTaskEvent || !e.start_date || !e.start_time || !e.start_time.includes(":")) return;
        const startMs = eventStartMs(e);
        if (!startMs || startMs > now) return; // only overdue (past-due) tasks
        const st = (e.status || "").toLowerCase();
        if (st === "cancelled" || st === "completed" || st === "rejected") return;

        // Fire once today, at/after the task's due time on this day.
        const [hh, mm] = e.start_time.split(":").map(Number);
        const todayDueMs = new Date(
          today.getFullYear(), today.getMonth(), today.getDate(), hh || 0, mm || 0,
        ).getTime();
        if (now < todayDueMs) return;

        const dayKey = `${e.id}|${todayKey}`;
        if (overdueShown[dayKey]) return; // already nudged for this task today
        overdueShown[dayKey] = now;
        overdueDirty = true;
        newPopups.push({
          id: `overdue|${e.id}|${e.start_date}|${todayKey}`,
          title: e.title || "Overdue Task",
          startMs,
          timeLabel: formatTime12(e.start_time),
          subtitle: e.event_type || "",
        });
      });
      if (overdueDirty) writeOverdueShown(overdueShown);

      // Completed / cancelled events lose any pending reminders — pruned here by
      // event id (handles both the offset and the overdue popup id formats).
      const closed = new Set<string>();
      events.forEach((e) => {
        const st = (e.status || "").toLowerCase();
        if (st === "completed" || st === "cancelled") closed.add(String(e.id));
      });

      setPopups((prev) => {
        const kept = closed.size
          ? prev.filter((p) => {
              const parts = p.id.split("|");
              const eid = parts[0] === "overdue" ? parts[1] : parts[0];
              return !closed.has(eid);
            })
          : prev;
        if (!newPopups.length && kept.length === prev.length) return prev; // nothing changed
        return [...kept, ...newPopups];
      });
    };

    check();
    const t = setInterval(check, POLL_MS);
    return () => { cancelled = true; clearInterval(t); };
  }, []);

  if (!popups.length) return null;

  // No auto-selection: the detail panel only appears once a reminder is clicked,
  // so a single reminder isn't shown twice (detail + list row).
  const selected = popups.find((p) => p.id === selectedId) || null;
  const now = Date.now();

  const dismissAll = () => setPopups([]);
  const dismiss = (id: string) => setPopups((prev) => prev.filter((p) => p.id !== id));
  // Snooze the selected reminder: hide it now, re-show it after the chosen delay.
  const snooze = () => {
    if (!selected) return;
    const p = selected;
    dismiss(p.id);
    const timer = window.setTimeout(() => {
      setPopups((prev) => (prev.some((x) => x.id === p.id) ? prev : [...prev, p]));
    }, snoozeMin * 60000);
    snoozeTimers.current.push(timer);
  };

  // Accent theme — Claims screens stay blue; the Vehicle Management screen uses
  // the Fleet black/neutral theme so the popup matches its surroundings.
  const isDark = accent === "black";
  const T = {
    bellBg: isDark ? "bg-neutral-100" : "bg-blue-100",
    bellIcon: isDark ? "text-neutral-700" : "text-blue-500",
    selRow: isDark ? "bg-neutral-100" : "bg-blue-100",
    subtitle: isDark ? "text-neutral-600" : "text-blue-500",
    snoozeBtn: isDark ? "bg-neutral-100 text-neutral-800 hover:bg-neutral-200" : "bg-blue-100 text-blue-500 hover:bg-blue-200",
    dismissAll: isDark ? "bg-neutral-900 hover:bg-black" : "bg-blue-500 hover:bg-blue-600",
  };

  return (
    <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[10000] font-['Stack_Sans_Headline']">
      <div className="w-[580px] max-w-[94vw] min-h-[460px] max-h-[80vh] bg-white rounded shadow-2xl border border-neutral-200 overflow-hidden flex flex-col">
        {/* Header: bell + "N Reminder(s)" count */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
          <div className="flex items-center gap-3">
            <span className={`w-9 h-9 rounded-full ${T.bellBg} flex items-center justify-center shrink-0`}>
              <Bell size={18} className={T.bellIcon} />
            </span>
            <span className="text-neutral-900 text-[16px] font-weight-600">
              {popups.length} Reminder{popups.length === 1 ? "" : "(s)"}
            </span>
          </div>
          <button onClick={dismissAll} className="text-neutral-400 hover:text-neutral-600" aria-label="Close">
            <X size={18} />
          </button>
        </div>

        {/* Selectable list — each row shows title, date/time and event type;
            clicking the empty space below deselects. */}
        <div className="flex-1 overflow-y-auto divide-y divide-neutral-100" onClick={() => setSelectedId(null)}>
          {popups.map((p) => {
            const isSel = selected?.id === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={(e) => { e.stopPropagation(); setSelectedId(p.id); }}
                className={`w-full flex items-start gap-3 px-6 py-3 text-left text-neutral-900 ${
                  isSel ? T.selRow : "hover:bg-neutral-50"
                }`}
              >
                <div className="flex-1 min-w-0 ms-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-[14px] font-weight-600">{p.title}</span>
                    <span className="text-xs shrink-0 text-neutral-500">
                      {relativeLabel(p.startMs, now)}
                    </span>
                  </div>
                  <div className="text-xs truncate text-neutral-500">
                    {formatDetailDateTime(p.startMs)}
                  </div>
                  {p.subtitle && (
                    <div className={`text-xs font-weight-600 truncate ${T.subtitle}`}>
                      {p.subtitle}
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer: snooze + dismiss controls */}
        <div className="border-t border-neutral-100 px-6 py-4 flex flex-col gap-3">
          <div className="text-neutral-500 text-xs">Click Snooze to be reminded in:</div>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="w-[150px]">
                <Select
                  options={SNOOZE_OPTIONS}
                  value={SNOOZE_OPTIONS.find((o) => o.value === snoozeMin) || null}
                  onChange={(o: any) => setSnoozeMin(o?.value ?? 5)}
                  styles={snoozeSelectStyles}
                  maxMenuHeight={180}
                  components={{ DropdownIndicator: isDark ? undefined : BlueDropdownIndicator, IndicatorSeparator: () => null }}
                  isSearchable={false}
                  menuPlacement="bottom"
                  menuPortalTarget={rsPortal}
                />
              </div>
              <button
                onClick={snooze}
                disabled={!selected}
                className={`h-[52px] px-4 rounded ${T.snoozeBtn} text-sm font-weight-600 disabled:opacity-50`}
              >
                Snooze
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => selected && dismiss(selected.id)}
                disabled={!selected}
                className="h-[52px] px-4 rounded border border-neutral-300 text-neutral-700 text-sm font-weight-600 hover:bg-neutral-50 disabled:opacity-50"
              >
                Dismiss
              </button>
              <button
                onClick={dismissAll}
                className={`h-[52px] px-4 rounded ${T.dismissAll} text-white text-sm font-weight-600`}
              >
                Dismiss All
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReminderWatcher;
