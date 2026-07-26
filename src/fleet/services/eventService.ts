import fleetApi from "./fleetApi";

// Fleet-owned calendar-event client. Reuses the shared /calendar-events backend
// via fleetApi (same backend, same Bearer token) — no Claims imports. Events are
// meetings/appointments/reminders on the Fleet calendar (shown in blue), separate
// from tasks (purple).

export const EVENT_TYPES = ["Meeting", "Appointment", "Reminder", "Follow-Up", "Other"] as const;

export interface FleetEvent {
  id: number;
  title: string;
  event_type?: string | null;
  status?: string | null;
  start_date?: string | null; // yyyy-mm-dd
  start_time?: string | null; // HH:mm
  end_date?: string | null;
  end_time?: string | null;
  description?: string | null;
  location?: string | null;
  attachment_path?: string | null;
  attachment_name?: string | null;
  vehicle_registration?: string | null;
  source?: string | null;       // "manual" | "system"
  source_type?: string | null;  // e.g. plating_expiry / mot_expiry / road_fund_licence_expiry
}

// The backend source_type values for the auto-synced vehicle-expiry events. The
// Fleet calendar plots expiries from a dedicated endpoint, so these system
// events are filtered out to avoid showing each expiry twice.
export const EXPIRY_EVENT_SOURCE_TYPES = ["road_fund_licence_expiry", "plating_expiry", "mot_expiry"];

export interface FleetEventPayload {
  title: string;
  event_type?: string | null;
  start_date?: string | null;
  start_time?: string | null;
  end_date?: string | null;
  end_time?: string | null;
  description?: string | null;
  location?: string | null;
  attachment_path?: string | null;
  attachment_name?: string | null;
  vehicle_registration?: string | null;
}

const clean = (params: Record<string, unknown>) =>
  Object.fromEntries(Object.entries(params).filter(([, v]) => v !== "" && v !== null && v !== undefined));

export const listCalendarEvents = async (params: { start?: string; end?: string } = {}): Promise<FleetEvent[]> => {
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

export const deleteCalendarEvent = async (id: number): Promise<boolean> => {
  try {
    await fleetApi.delete(`/calendar-events/${id}`);
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
