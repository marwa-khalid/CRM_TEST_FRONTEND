import axiosInstance from "../axiosConfig";

// Case History section (the History screen opened from a claim). Separate from the
// file-based Case Activity feed. All records are scoped to a claim.

export type CaseHistoryActionType =
  | "send_letter"
  | "send_email"
  | "incoming_email"
  | "incoming_call"
  | "outgoing_call"
  | "note"
  | "diary";

export interface CaseHistoryAttachment {
  name: string;
  url: string;
  size?: string;
}

export interface CaseHistoryRecord {
  // Numeric for stored records; "email:<n>" for live Outlook emails.
  id: number | string;
  claim_id: number;
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

export interface CaseHistoryFilterOptions {
  correspondents: string[];
  handlers: string[];
  action_types: string[];
}

export interface CaseHistoryQuery {
  search?: string;
  action_type?: string[];
  correspondent?: string[];
  handler?: string[];
  date_from?: string; // YYYY-MM-DD
  date_to?: string; // YYYY-MM-DD
}

export interface CaseHistoryCreate {
  action_type: CaseHistoryActionType;
  correspondent?: string | null;
  handler?: string | null;
  subject?: string | null;
  details?: string | null;
  payload?: Record<string, unknown> | null;
  posted_at?: string | null;
}

// List a claim's history (newest first), with optional search + filters.
export const getCaseHistory = async (
  claimId: number | string,
  query: CaseHistoryQuery = {},
): Promise<CaseHistoryRecord[]> => {
  const { data } = await axiosInstance.get(`/case-history/claim/${claimId}`, {
    params: {
      search: query.search || undefined,
      action_type: query.action_type?.length ? query.action_type : undefined,
      correspondent: query.correspondent?.length ? query.correspondent : undefined,
      handler: query.handler?.length ? query.handler : undefined,
      date_from: query.date_from || undefined,
      date_to: query.date_to || undefined,
    },
    // Repeat array params as ?action_type=a&action_type=b (FastAPI List[str]).
    paramsSerializer: {
      indexes: null,
    },
  });
  return Array.isArray(data) ? data : [];
};

// Case-referenced emails from the configured Outlook mailbox, shaped as read-only
// History records (id = "email:<n>", attachments in payload). Best-effort.
export const getCaseHistoryEmails = async (
  claimId: number | string,
): Promise<CaseHistoryRecord[]> => {
  try {
    const { data } = await axiosInstance.get(`/case-history/claim/${claimId}/emails`);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
};

// Import a dragged-in Outlook email file (.eml / .msg) as a Send Email record.
export const importCaseHistoryEmail = async (
  claimId: number | string,
  file: File,
): Promise<CaseHistoryRecord> => {
  const form = new FormData();
  form.append("file", file);
  const { data } = await axiosInstance.post(
    `/case-history/claim/${claimId}/import-email`,
    form,
    { headers: { "Content-Type": "multipart/form-data" } },
  );
  return data as CaseHistoryRecord;
};

// Log a downloaded/generated document (e.g. a Payment Pack PDF → SL) as a Case
// History record, storing the file so it's viewable in the detail pane.
export const logCaseHistoryDocument = async (
  claimId: number | string,
  file: File | Blob,
  opts: { details: string; actionType?: CaseHistoryActionType; subject?: string; correspondent?: string; source?: string; fileName?: string },
): Promise<CaseHistoryRecord> => {
  const form = new FormData();
  const name = opts.fileName || (file instanceof File ? file.name : "document.pdf");
  form.append("file", file, name);
  form.append("details", opts.details);
  form.append("action_type", opts.actionType || "send_letter");
  if (opts.subject) form.append("subject", opts.subject);
  if (opts.correspondent) form.append("correspondent", opts.correspondent);
  form.append("source", opts.source || "document");
  const { data } = await axiosInstance.post(
    `/case-history/claim/${claimId}/log-document`,
    form,
    { headers: { "Content-Type": "multipart/form-data" } },
  );
  return data as CaseHistoryRecord;
};

// Fetch an email attachment (authenticated) and open it in a new tab.
export const openEmailAttachment = async (url: string): Promise<void> => {
  const res = await axiosInstance.get(url, { responseType: "blob" });
  const blobUrl = URL.createObjectURL(res.data as Blob);
  window.open(blobUrl, "_blank", "noopener,noreferrer");
  setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
};

// Fetch an attachment (authenticated) and return an object URL + its MIME type,
// for inline preview in the detail pane. Caller must revoke the URL.
export const fetchCaseAttachment = async (
  url: string,
): Promise<{ url: string; type: string }> => {
  const res = await axiosInstance.get(url, { responseType: "blob" });
  const blob = res.data as Blob;
  return { url: URL.createObjectURL(blob), type: blob.type || "" };
};

export interface CaseAttachmentPreview {
  type: "pdf" | "image" | "html" | "unsupported";
  file_name?: string;
  url?: string; // for images (data URI)
  html?: string; // for Word/HTML documents
  pages?: { page: number; image: string }[]; // for PDFs (data URIs)
}

// Rendered page images for a stored attachment (PDF → one PNG per page), so the
// detail pane shows the document like the Document Library — no PDF viewer.
export const getCaseAttachmentPages = async (
  recordId: number | string,
  index: number,
): Promise<CaseAttachmentPreview> => {
  const { data } = await axiosInstance.get(`/case-history/${recordId}/attachment/${index}/pages`);
  return data as CaseAttachmentPreview;
};

// Distinct correspondents / handlers / action types for the filter dropdowns.
export const getCaseHistoryFilters = async (
  claimId: number | string,
): Promise<CaseHistoryFilterOptions> => {
  const { data } = await axiosInstance.get(`/case-history/claim/${claimId}/filters`);
  return data as CaseHistoryFilterOptions;
};

// Single record (Record Detail pane).
export const getCaseHistoryRecord = async (
  recordId: number | string,
): Promise<CaseHistoryRecord> => {
  const { data } = await axiosInstance.get(`/case-history/${recordId}`);
  return data as CaseHistoryRecord;
};

export interface CaseCorrespondent {
  role: string;
  name: string | null;
  email: string | null;
  phone: string | null;
}

// Third-party email addresses on the claim — Correspondent dropdown + outgoing-call
// phone auto-fill.
export const getCaseCorrespondents = async (
  claimId: number | string,
): Promise<CaseCorrespondent[]> => {
  try {
    const { data } = await axiosInstance.get(`/case-history/claim/${claimId}/correspondents`);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
};

export interface TenantUser {
  id: number;
  email: string;
  name: string;
}

// Tenant users — populates the "Assigned User" dropdown (diary follow-ups).
export const getTenantUsers = async (): Promise<TenantUser[]> => {
  try {
    const { data } = await axiosInstance.get(`/users`);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
};

// Create a new history record (Add Record → one of the 6 activity types).
export const createCaseHistory = async (
  claimId: number | string,
  payload: CaseHistoryCreate,
): Promise<CaseHistoryRecord> => {
  const { data } = await axiosInstance.post(`/case-history/claim/${claimId}`, payload);
  return data as CaseHistoryRecord;
};
