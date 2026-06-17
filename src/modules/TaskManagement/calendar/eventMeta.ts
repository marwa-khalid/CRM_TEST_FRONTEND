// Event types, departments and option lists for the Calendar module (per the
// Calendar Management & Event Scheduling story).

export const EVENT_TYPES = [
  "Appointment",
  "Meeting",
  "Engineer Inspection",
  "Vehicle Collection",
  "Vehicle Delivery",
  "Vehicle Return",
  "Reminder",
  "Follow-Up",
  "Internal Meeting",
  "Task Deadline",
];

export const DEPARTMENTS = [
  "Claims",
  "Fleet",
  "Recovery",
  "Storage",
  "Engineering",
  "Administration",
];

export const REMINDER_OPTIONS = [
  { value: "15m", label: "15 minutes before" },
  { value: "30m", label: "30 minutes before" },
  { value: "1h", label: "1 hour before" },
  { value: "1d", label: "1 day before" },
];

export const RECURRENCE_OPTIONS = ["Daily", "Weekly", "Monthly", "Yearly"];

export const EVENT_STATUSES = ["Scheduled", "Completed", "Cancelled"];

// Chip colour per event type — bg-*-100 / text-*-600 to match the app theme.
const TYPE_COLORS: Record<string, string> = {
  Appointment: "bg-blue-100 text-blue-600",
  Meeting: "bg-blue-100 text-blue-600",
  "Internal Meeting": "bg-indigo-100 text-indigo-600",
  "Engineer Inspection": "bg-purple-100 text-purple-600",
  "Vehicle Collection": "bg-green-100 text-green-600",
  "Vehicle Delivery": "bg-teal-100 text-teal-600",
  "Vehicle Return": "bg-amber-100 text-amber-600",
  Reminder: "bg-yellow-100 text-amber-600",
  "Follow-Up": "bg-orange-100 text-orange-600",
  "Task Deadline": "bg-red-100 text-red-600",
};

export const eventChipCls = (event_type?: string | null, status?: string | null): string => {
  if ((status || "").toLowerCase() === "cancelled") return "bg-neutral-100 text-neutral-400 line-through";
  if ((status || "").toLowerCase() === "completed") return "bg-green-100 text-green-600";
  return TYPE_COLORS[event_type || ""] || "bg-blue-100 text-blue-600";
};

export const statusBadgeCls = (status?: string | null): string => {
  const s = (status || "").toLowerCase();
  if (s === "completed") return "bg-green-100 text-green-600";
  if (s === "cancelled") return "bg-neutral-100 text-neutral-500";
  return "bg-blue-100 text-blue-600"; // Scheduled
};

// Short label for a time string "HH:MM" (kept as-is; falls back to "").
export const fmtTime = (t?: string | null) => (t ? t : "");
