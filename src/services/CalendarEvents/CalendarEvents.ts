import axiosInstance from "../axiosConfig";

export interface CalendarEvent {
  id: number;
  title: string;
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
  case_reference?: string | null;
  task_id?: number | null;
  vehicle_registration?: string | null;
  source?: string | null;
  source_type?: string | null;
  source_ref_id?: number | null;
  module?: string | null; // owning app: claims | skyline | vehicles
  created_at?: string | null;
  updated_at?: string | null;
  claimant_name?: string | null;
  case_status?: string | null;
}

export interface EventFilters {
  start?: string;
  end?: string;
  event_type?: string;
  assigned_user?: string;
  department?: string;
  claim_reference?: string;
  vehicle_registration?: string;
  search?: string;
  status?: string;
}

const clean = (params: Record<string, any>) =>
  Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== "" && v !== null && v !== undefined),
  );

export const listCalendarEvents = (params: EventFilters = {}) =>
  axiosInstance.get<CalendarEvent[]>("/calendar-events", { params: clean(params) });

export const getCalendarEvent = (id: number) =>
  axiosInstance.get<CalendarEvent>(`/calendar-events/${id}`);

export const createCalendarEvent = (payload: Partial<CalendarEvent>) =>
  axiosInstance.post<CalendarEvent>("/calendar-events", payload);

export const updateCalendarEvent = (id: number, payload: Partial<CalendarEvent>) =>
  axiosInstance.put<CalendarEvent>(`/calendar-events/${id}`, payload);

// occurrenceDate (YYYY-MM-DD) targets a single occurrence of a recurring series;
// omit it to act on a one-off event or the whole series base.
export const completeCalendarEvent = (id: number, occurrenceDate?: string | null) =>
  axiosInstance.post<CalendarEvent>(`/calendar-events/${id}/complete`, null, {
    params: occurrenceDate ? { occurrence_date: occurrenceDate } : undefined,
  });

export const cancelCalendarEvent = (id: number, occurrenceDate?: string | null) =>
  axiosInstance.post<CalendarEvent>(`/calendar-events/${id}/cancel`, null, {
    params: occurrenceDate ? { occurrence_date: occurrenceDate } : undefined,
  });

export const deleteCalendarEvent = (id: number, occurrenceDate?: string | null) =>
  axiosInstance.delete(`/calendar-events/${id}`, {
    params: occurrenceDate ? { occurrence_date: occurrenceDate } : undefined,
  });

export interface EventAudit {
  id: number;
  action?: string;
  detail?: string;
  user_id?: number;
  created_at?: string;
}
export const getCalendarEventAudit = (id: number) =>
  axiosInstance.get<EventAudit[]>(`/calendar-events/${id}/audit`);
