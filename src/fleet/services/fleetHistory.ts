import fleetApi from "./fleetApi";

// Fleet History — the History section for fleet hires and VM (CAMS / Skyline)
// vehicles. Talks to the shared backend's polymorphic case_history endpoints
// (/case-history/scope/{scope_type}/{scope_id}/...) via fleetApi, so Fleet stays
// self-contained and can be repointed at its own backend with one env var. No
// imports from Claims.

export type FleetHistoryScope = "fleet_hire" | "vm_cams" | "vm_skyline";

export type CaseHistoryActionType =
  | "send_letter"
  | "send_email"
  | "incoming_email"
  | "incoming_call"
  | "outgoing_call"
  | "note"
  | "diary"
  | "movement";

export interface FleetHistoryAttachment {
  name: string;
  url: string;
  size?: string;
}

export interface FleetHistoryRecord {
  id: number | string; // numeric for stored rows; "email:<n>" for live emails
  scope_type: string | null;
  scope_id: number | null;
  action_type: CaseHistoryActionType | null;
  posted_at: string | null;
  correspondent: string | null;
  handler: string | null;
  subject: string | null;
  details: string | null;
  payload: Record<string, unknown> | null;
  created_by: number | null;
  created_at: string | null;
}

export interface FleetHistoryFilterOptions {
  correspondents: string[];
  handlers: string[];
  action_types: string[];
}

export interface FleetHistoryQuery {
  search?: string;
  action_type?: string[];
  correspondent?: string[];
  handler?: string[];
  date_from?: string;
  date_to?: string;
}

export interface FleetHistoryCreate {
  action_type: CaseHistoryActionType;
  correspondent?: string | null;
  handler?: string | null;
  subject?: string | null;
  details?: string | null;
  payload?: Record<string, unknown> | null;
  posted_at?: string | null;
}

const base = (scope: FleetHistoryScope, id: number | string) =>
  `/case-history/scope/${scope}/${id}`;

export const getFleetHistory = async (
  scope: FleetHistoryScope,
  id: number | string,
  query: FleetHistoryQuery = {},
): Promise<FleetHistoryRecord[]> => {
  const { data } = await fleetApi.get(base(scope, id), {
    params: {
      search: query.search || undefined,
      action_type: query.action_type?.length ? query.action_type : undefined,
      correspondent: query.correspondent?.length ? query.correspondent : undefined,
      handler: query.handler?.length ? query.handler : undefined,
      date_from: query.date_from || undefined,
      date_to: query.date_to || undefined,
    },
    paramsSerializer: { indexes: null }, // repeat arrays as ?k=a&k=b
  });
  return Array.isArray(data) ? data : [];
};

// Correspondent options for the Add Record field: for VM-CAMS, the linked claim's
// client email (default) + Third Party emails. Empty for Skyline (driver email is
// supplied from the hire).
export const getFleetCorrespondents = async (
  scope: FleetHistoryScope,
  id: number | string,
): Promise<{ default: string | null; options: string[] }> => {
  try {
    const { data } = await fleetApi.get(`${base(scope, id)}/correspondents`);
    return { default: data?.default ?? null, options: Array.isArray(data?.options) ? data.options : [] };
  } catch {
    return { default: null, options: [] };
  }
};

export const getFleetHistoryFilters = async (
  scope: FleetHistoryScope,
  id: number | string,
): Promise<FleetHistoryFilterOptions> => {
  const { data } = await fleetApi.get(`${base(scope, id)}/filters`);
  return data as FleetHistoryFilterOptions;
};

export const getFleetHistoryEmails = async (
  scope: FleetHistoryScope,
  id: number | string,
  reference?: string, // the vehicle reg — mailbox emails mentioning it surface here
): Promise<FleetHistoryRecord[]> => {
  try {
    const { data } = await fleetApi.get(`${base(scope, id)}/emails`, {
      params: reference ? { reference } : undefined,
    });
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
};

export const createFleetHistory = async (
  scope: FleetHistoryScope,
  id: number | string,
  payload: FleetHistoryCreate,
): Promise<FleetHistoryRecord> => {
  const { data } = await fleetApi.post(base(scope, id), payload);
  return data as FleetHistoryRecord;
};

// Log a generated/downloaded document (e.g. a hire Agreement → SL) into a fleet
// hire / VM vehicle history, storing the file so it's previewable.
export const logFleetHistoryDocument = async (
  scope: FleetHistoryScope,
  id: number | string,
  file: File | Blob,
  opts: { details: string; actionType?: CaseHistoryActionType; subject?: string; correspondent?: string; handler?: string; source?: string; fileName?: string },
): Promise<FleetHistoryRecord> => {
  const form = new FormData();
  const name = opts.fileName || (file instanceof File ? file.name : "document.pdf");
  form.append("file", file, name);
  form.append("details", opts.details);
  form.append("action_type", opts.actionType || "send_letter");
  if (opts.subject) form.append("subject", opts.subject);
  if (opts.correspondent) form.append("correspondent", opts.correspondent);
  if (opts.handler) form.append("handler", opts.handler);
  form.append("source", opts.source || "document");
  const { data } = await fleetApi.post(`${base(scope, id)}/log-document`, form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data as FleetHistoryRecord;
};

// Reply to a fleet email — sends via the shared send path and logs a Send Email (SE)
// record on this fleet scope (so it threads with the original).
export const fleetReplyEmail = async (
  scope: FleetHistoryScope,
  id: number | string,
  record: FleetHistoryRecord,
  comment: string,
  files: File[] = [],
  toEmail?: string,
  subject?: string,
): Promise<void> => {
  const fd = new FormData();
  fd.append("message_id", ((record.payload as { message_id?: string } | null)?.message_id) || "");
  fd.append("comment", comment || "");
  fd.append("scope_type", scope);
  fd.append("scope_id", String(id));
  fd.append("to_email", toEmail || record.correspondent || "");
  fd.append("subject", subject || record.subject || "");
  files.forEach((f) => fd.append("files", f));
  await fleetApi.post("/case-activity/email/reply-with-attachments", fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const fleetForwardEmail = async (
  scope: FleetHistoryScope,
  id: number | string,
  record: FleetHistoryRecord,
  toEmail: string,
  subject: string,
  comment: string,
  files: File[] = [],
): Promise<void> => {
  const fd = new FormData();
  const mid = (record.payload as { message_id?: string } | null)?.message_id;
  if (mid && mid !== "None" && mid !== "null") fd.append("message_id", mid);
  fd.append("to_email", toEmail || "");
  fd.append("subject", subject || record.subject || "");
  fd.append("comment", comment || "");
  fd.append("scope_type", scope);
  fd.append("scope_id", String(id));
  files.forEach((f) => fd.append("files", f));
  await fleetApi.post("/case-activity/email/forward-with-attachments", fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const importFleetHistoryEmail = async (
  scope: FleetHistoryScope,
  id: number | string,
  file: File,
): Promise<FleetHistoryRecord> => {
  const form = new FormData();
  form.append("file", file, file.name || "email.eml");
  const { data } = await fleetApi.post(`${base(scope, id)}/import-email`, form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data as FleetHistoryRecord;
};

// Attachment helpers (records store an S3 key; the URL routes through the record).
export const openFleetAttachment = async (url: string): Promise<void> => {
  const res = await fleetApi.get(url, { responseType: "blob" });
  const blobUrl = URL.createObjectURL(res.data as Blob);
  window.open(blobUrl, "_blank", "noopener,noreferrer");
  setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
};

export const fetchFleetAttachment = async (
  url: string,
): Promise<{ url: string; type: string }> => {
  const res = await fleetApi.get(url, { responseType: "blob" });
  const blob = res.data as Blob;
  return { url: URL.createObjectURL(blob), type: blob.type || "" };
};

export interface FleetAttachmentPreview {
  type: "pdf" | "image" | "html" | "unsupported";
  file_name?: string;
  url?: string;
  html?: string;
  pages?: { page: number; image: string }[];
}

// Rendered page images / Word-HTML for a stored attachment (same endpoint as
// claims), so the fleet detail pane can preview documents like the Document Library.
export const getFleetAttachmentPages = async (
  recordId: number | string,
  index: number,
): Promise<FleetAttachmentPreview> => {
  const { data } = await fleetApi.get(`/case-history/${recordId}/attachment/${index}/pages`);
  return data as FleetAttachmentPreview;
};
