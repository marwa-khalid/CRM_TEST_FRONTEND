import React, { useEffect, useMemo, useRef, useState } from "react";
import { Bell, X } from "lucide-react";
import { FleetSelect } from "./fields";
import type { FleetDueReminder } from "../services/hireService";

// Fleet reminders panel — same shape as the Claims ReminderWatcher (header /
// scrollable list / snooze + dismiss footer), in the Fleet black-and-white theme.

const SNOOZE_OPTIONS = [
  { label: "5 minutes", value: "5" },
  { label: "10 minutes", value: "10" },
  { label: "15 minutes", value: "15" },
  { label: "30 minutes", value: "30" },
  { label: "1 hour", value: "60" },
];

const KIND_LABEL: Record<string, string> = {
  road_tax: "Road Fund Licence",
  plating: "Plate Expiry",
  mot: "MOT Expiry",
  service: "Service Due",
  driving_licence: "Driving Licence",
  taxi_badge: "Taxi Badge",
};

const fmtDate = (iso: string) => {
  const d = new Date(`${iso}T00:00:00`);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString("en-GB");
};

// "expires in 3 days" / "expired 2 days ago" / "expires today".
const duePhrase = (iso: string) => {
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return "";
  const days = Math.round((d.getTime() - new Date().setHours(0, 0, 0, 0)) / 86_400_000);
  if (days < 0) return `Expired ${Math.abs(days)} day${Math.abs(days) === 1 ? "" : "s"} ago`;
  if (days === 0) return "Expires today";
  return `Expires in ${days} day${days === 1 ? "" : "s"}`;
};

interface Props {
  reminders: FleetDueReminder[];
  onClose: () => void;
}

const FleetReminderPanel: React.FC<Props> = ({ reminders, onClose }) => {
  const items = useMemo(() => reminders.map((r, i) => ({ ...r, _id: i })), [reminders]);
  const [hidden, setHidden] = useState<Set<number>>(new Set());
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [snoozeMin, setSnoozeMin] = useState("15");
  const timers = useRef<number[]>([]);

  useEffect(() => () => timers.current.forEach((t) => clearTimeout(t)), []);

  const visible = items.filter((r) => !hidden.has(r._id));

  const snooze = () => {
    if (selectedId == null) return;
    const id = selectedId;
    setHidden((h) => new Set(h).add(id));
    setSelectedId(null);
    const t = window.setTimeout(
      () => setHidden((h) => { const n = new Set(h); n.delete(id); return n; }),
      Number(snoozeMin) * 60_000,
    );
    timers.current.push(t);
  };

  const dismiss = () => {
    if (selectedId == null) return;
    setHidden((h) => new Set(h).add(selectedId));
    setSelectedId(null);
  };

  return (
    <div className="fixed inset-0 z-[900] flex items-center justify-center bg-black/40 p-4 font-sans-headline">
      <div className="w-[580px] max-w-[94vw] min-h-[460px] max-h-[80vh] bg-white rounded shadow-2xl border border-neutral-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
          <div className="flex items-center gap-3">
            <span className="w-9 h-9 rounded-full bg-neutral-900 flex items-center justify-center shrink-0">
              <Bell size={18} className="text-white" />
            </span>
            <span className="text-neutral-900 text-base font-semibold">
              Reminders{visible.length ? ` (${visible.length})` : ""}
            </span>
          </div>
          <button type="button" onClick={onClose} className="text-neutral-400 hover:text-neutral-700" aria-label="Close">
            <X size={18} />
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto divide-y divide-neutral-100" onClick={() => setSelectedId(null)}>
          {visible.length === 0 ? (
            <div className="h-full min-h-[280px] flex flex-col items-center justify-center text-center px-6">
              <span className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center mb-3">
                <Bell size={22} className="text-neutral-400" />
              </span>
              <p className="text-neutral-900 text-sm font-semibold">You're all caught up</p>
              <p className="text-neutral-500 text-xs mt-1">No reminders to show right now.</p>
            </div>
          ) : (
            visible.map((r) => {
              const overdue = duePhrase(r.expiry_date).startsWith("Expired");
              return (
                <button
                  key={r._id}
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setSelectedId((cur) => (cur === r._id ? null : r._id)); }}
                  className={`w-full flex items-start px-6 py-3 text-left text-neutral-900 ${
                    selectedId === r._id ? "bg-neutral-100 outline outline-1 -outline-offset-1 outline-neutral-300" : "hover:bg-neutral-50"
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-semibold">{KIND_LABEL[r.kind] || "Reminder"}</span>
                      <span className="text-xs shrink-0 text-neutral-500">{fmtDate(r.expiry_date)}</span>
                    </div>
                    <div className="text-xs truncate text-neutral-500">{r.vehicle}</div>
                    <div className={`text-xs font-semibold truncate ${overdue ? "text-[#e5484d]" : "text-neutral-900"}`}>
                      {duePhrase(r.expiry_date)}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-neutral-100 px-6 py-4 flex flex-col gap-3">
          <div className="text-neutral-500 text-xs">Click Snooze to be reminded in:</div>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="w-[150px]">
                <FleetSelect
                  value={snoozeMin}
                  options={SNOOZE_OPTIONS}
                  onChange={setSnoozeMin}
                  unsorted
                  menuPortal
                  menuPlacement="top"
                />
              </div>
              <button
                type="button"
                onClick={snooze}
                disabled={selectedId == null}
                className="h-[52px] px-4 rounded bg-neutral-100 text-neutral-900 text-sm font-semibold hover:bg-neutral-200 disabled:opacity-50"
              >
                Snooze
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={dismiss}
                disabled={selectedId == null}
                className="h-[52px] px-4 rounded border border-neutral-300 text-neutral-700 text-sm font-semibold hover:bg-neutral-50 disabled:opacity-50"
              >
                Dismiss
              </button>
              <button
                type="button"
                onClick={onClose}
                className="h-[52px] px-4 rounded bg-neutral-900 text-white text-sm font-semibold hover:bg-black"
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

export default FleetReminderPanel;
