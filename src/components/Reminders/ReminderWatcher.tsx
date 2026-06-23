import React, { useEffect, useRef, useState } from "react";
import { Bell, X } from "lucide-react";
import { listCalendarEvents, type CalendarEvent } from "../../services/CalendarEvents/CalendarEvents";

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

// Offsets to remind at for an event: the ones the user selected (comma-separated,
// may be multiple), or all four defaults if they didn't pick any.
const offsetsFor = (e: CalendarEvent): number[] => {
  const sel = String(e.reminder || "")
    .split(",")
    .map((s) => s.trim())
    .map((k) => REMINDER_MIN[k])
    .filter((n): n is number => !!n);
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

interface Popup { id: string; title: string; startMs: number; timeLabel: string; subtitle: string; }

const ReminderWatcher: React.FC = () => {
  const [popups, setPopups] = useState<Popup[]>([]);
  // In-memory only (resets per session) — no localStorage.
  const shownRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;

    const check = async () => {
      const now = Date.now();
      const today = new Date();
      const start = dateKey(today);
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

      // Completed / cancelled events (or occurrences) lose any pending reminders —
      // future ones are skipped above, and any already on screen are pruned here.
      const closed = new Set<string>();
      events.forEach((e) => {
        const st = (e.status || "").toLowerCase();
        if (st === "completed" || st === "cancelled") closed.add(`${e.id}|${e.start_date}`);
      });

      setPopups((prev) => {
        const kept = closed.size
          ? prev.filter((p) => !closed.has(p.id.split("|").slice(0, 2).join("|")))
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

  const dismissAll = () => setPopups([]);

  return (
    <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[10000] font-['Stack_Sans_Headline']">
      <div className="w-[460px] max-w-[94vw] min-h-[460px] max-h-[80vh] bg-white rounded shadow-2xl border border-neutral-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-neutral-100">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
              <Bell size={20} className="text-blue-500" />
            </span>
            <span className="text-neutral-900 text-[18px] font-weight-600">Reminders</span>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={dismissAll} className="text-blue-500 text-sm font-weight-500 hover:underline">
              Dismiss all
            </button>
            <button onClick={dismissAll} className="text-neutral-400 hover:text-neutral-600" aria-label="Close">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto divide-y divide-neutral-50">
          {popups.map((p) => {
            const minsLeft = Math.max(0, Math.round((p.startMs - Date.now()) / 60000));
            return (
              <div key={p.id} className="flex items-center gap-3 px-6 py-4">
                {/* <Bell size={20} className="text-blue-500 shrink-0" /> */}
                <div className="flex-1 min-w-0">
                  <div className="text-neutral-900 text-[15px] font-weight-600 truncate">{p.title}</div>
                  <div className="text-neutral-500 text-xs truncate">
                    {p.timeLabel}{p.subtitle ? ` ${p.subtitle}` : ""}
                  </div>
                </div>
                <div className="text-neutral-500 text-xs shrink-0">{minsLeft} min</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ReminderWatcher;
