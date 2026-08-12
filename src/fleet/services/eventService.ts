import fleetApi from "./fleetApi";

// Fleet-owned calendar-event client. Reuses the shared /calendar-events backend
// via fleetApi (same backend, same Bearer token) — no Claims imports. Events are
// meetings/appointments/reminders on the Fleet calendar (shown in blue), separate
// from tasks (purple).

export const EVENT_TYPES = ["Meeting", "Appointment", "Reminder", "Follow-Up", "Other"] as const;
export const DEPARTMENTS = ["Claims", "Fleet", "Recovery"];
export const REMINDER_OPTIONS = [
  { value: "none", label: "Don't remind me" },
  { value: "15m", label: "15 minutes before" },
  { value: "30m", label: "30 minutes before" },
  { value: "1h", label: "1 hour before" },
  { value: "1d", label: "1 day before" },
];
export const RECURRENCE_OPTIONS = ["Daily", "Weekly", "Monthly", "Yearly"];
// "Completed" is not selectable on the form (events aren't manually completed here);
// it can still arrive from Task Management for display.
export const EVENT_STATUSES = ["Scheduled", "Cancelled"];

export interface FleetEvent {
  id: number;
  title: string;
  event_type?: string | null;
  status?: string | null;
  start_date?: string | null; // yyyy-mm-dd
  start_time?: string | null; // HH:mm
  end_date?: string | null;
  end_time?: string | null;
  assigned_users?: string[];
  department?: string | null;
  description?: string | null;
  location?: string | null;
  reminder?: string | null;
  recurrence_rule?: string | null;
  attachment_path?: string | null;
  attachment_name?: string | null;
  claim_id?: number | null;
  claim_reference?: string | null;
  case_reference?: string | null;
  case_status?: string | null;
  task_id?: number | null;
  vehicle_registration?: string | null;
  source?: string | null;       // "manual" | "system"
  source_type?: string | null;  // e.g. plating_expiry / mot_expiry / road_fund_licence_expiry
  module?: string | null;       // owning app: claims | skyline | vehicles
  created_at?: string | null;
  updated_at?: string | null;
}

// One row of an event's audit trail (Activity Log tab).
export interface FleetEventAudit {
  id: number;
  action?: string;
  detail?: string;
  user_id?: number;
  created_at?: string;
}

// The backend source_type values for the auto-synced vehicle-expiry events. The
// Fleet calendar plots expiries from a dedicated endpoint, so these system
// events are filtered out to avoid showing each expiry twice.
export const EXPIRY_EVENT_SOURCE_TYPES = ["road_fund_licence_expiry", "plating_expiry", "mot_expiry"];

export interface FleetEventPayload {
  title: string;
  module?: string | null;   // skyline / vehicles — owning app (defaults per caller)
  event_type?: string | null;
  status?: string | null;
  start_date?: string | null;
  start_time?: string | null;
  end_date?: string | null;
  end_time?: string | null;
  assigned_users?: string[];
  department?: string | null;
  description?: string | null;
  location?: string | null;
  reminder?: string | null;
  recurrence_rule?: string | null;
  attachment_path?: string | null;
  attachment_name?: string | null;
  claim_id?: number | null;
  claim_reference?: string | null;
  vehicle_registration?: string | null;
}

const clean = (params: Record<string, unknown>) =>
  Object.fromEntries(Object.entries(params).filter(([, v]) => v !== "" && v !== null && v !== undefined));

export const listCalendarEvents = async (params: { start?: string; end?: string; module?: string } = {}): Promise<FleetEvent[]> => {
  try {
    const { data } = await fleetApi.get("/calendar-events", { params: clean(params) });
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.warn("Unable to load calendar events.", error);
    return [];
  }
};

export const createCalendarEvent = async (payload: FleetEventPayload): Promise<FleetEvent | null> => {
  try {
    const { data } = await fleetApi.post("/calendar-events", { department: "Fleet", ...payload });
    return data ?? null;
  } catch (error) {
    console.warn("Unable to create event.", error);
    return null;
  }
};

export const updateCalendarEvent = async (id: number, payload: Partial<FleetEventPayload>): Promise<FleetEvent | null> => {
  try {
    const { data } = await fleetApi.put(`/calendar-events/${id}`, payload);
    return data ?? null;
  } catch (error) {
    console.warn("Unable to update event.", error);
    return null;
  }
};

// Full single event (all fields) — used by the details slider.
export const getCalendarEvent = async (id: number): Promise<FleetEvent | null> => {
  try {
    const { data } = await fleetApi.get(`/calendar-events/${id}`);
    return data ?? null;
  } catch (error) {
    console.warn("Unable to load event.", error);
    return null;
  }
};

// Audit trail for the Activity Log tab.
export const getCalendarEventAudit = async (id: number): Promise<FleetEventAudit[]> => {
  try {
    const { data } = await fleetApi.get(`/calendar-events/${id}/audit`);
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.warn("Unable to load event audit.", error);
    return [];
  }
};

// occurrenceDate (YYYY-MM-DD) targets a single occurrence of a recurring series;
// omit it to act on a one-off event or the whole series base.
export const completeCalendarEvent = async (id: number, occurrenceDate?: string | null): Promise<FleetEvent | null> => {
  try {
    const { data } = await fleetApi.post(`/calendar-events/${id}/complete`, null, {
      params: occurrenceDate ? { occurrence_date: occurrenceDate } : undefined,
    });
    return data ?? null;
  } catch (error) {
    console.warn("Unable to complete event.", error);
    return null;
  }
};

export const cancelCalendarEvent = async (id: number, occurrenceDate?: string | null): Promise<FleetEvent | null> => {
  try {
    const { data } = await fleetApi.post(`/calendar-events/${id}/cancel`, null, {
      params: occurrenceDate ? { occurrence_date: occurrenceDate } : undefined,
    });
    return data ?? null;
  } catch (error) {
    console.warn("Unable to cancel event.", error);
    return null;
  }
};

export const deleteCalendarEvent = async (id: number, occurrenceDate?: string | null): Promise<boolean> => {
  try {
    await fleetApi.delete(`/calendar-events/${id}`, {
      params: occurrenceDate ? { occurrence_date: occurrenceDate } : undefined,
    });
    return true;
  } catch (error) {
    console.warn("Unable to delete event.", error);
    return false;
  }
};

// Reuses the shared /tasks/upload endpoint (S3 with local fallback) — returns the
// stored path + original filename to persist on the event.
export const uploadEventAttachment = async (file: File): Promise<{ path: string; filename: string } | null> => {
  const fd = new FormData();
  fd.append("file", file);
  try {
    const { data } = await fleetApi.post("/tasks/upload", fd, { headers: { "Content-Type": "multipart/form-data" } });
    if (!data?.path) return null;
    return { path: data.path, filename: data.filename || file.name };
  } catch (error) {
    console.warn("Unable to upload attachment.", error);
    return null;
  }
};
