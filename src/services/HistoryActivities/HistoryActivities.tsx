import Claims from "../../modules/Claims/ClaimsList";
import axiosInstance from "../axiosConfig";

export const getHistoryActivity = (claim_id: number) => {
  return axiosInstance.get(`/history/files`, {
    params: { claim_id },
  });
};

export const getTenantHistoryActivity = (tenant_id: number) => {
  return axiosInstance.get(`/history/tenant-files`, {
    params: { tenant_id },
  });
};

export const getClaimFiles = (claim_id: number) => {
  return axiosInstance.get(`/history/claim/${claim_id}/files`, {
    params: { claim_id },
  });
};

export const deactivateHistoryRecord = (id: number) => {
  return axiosInstance.put(`/history/deactivate/${id}`, { params: { id } });
};

export const uploadClaimFiles = (claim_id: number, files: File[]) => {
  const formData = new FormData();
  files.forEach((file) => formData.append("files", file));

  return axiosInstance.post(`/history/upload?claim_id=${claim_id}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const downloadClaimFile = (id: number) => {
  return axiosInstance.get(`/history/download/${id}`, {
    responseType: "blob",
  });
};

//paginated Tenant History Activity
export const getTenatHistory = (
  tenant_id: number,
  page: number,
  page_size: number,
) => {
  return axiosInstance.get(`/history/paginated-tenant-files`, {
    params: { tenant_id, page, page_size },
  });
};

//paginated Claim History Activity
export const getClaimHistory = (
  claim_id: number,
  page: number,
  page_size: number,
) => {
  return axiosInstance.get(`/history/paginated-files`, {
    params: { claim_id, page, page_size },
  });
};

export const searchClaimFiles = (
  claim_id: number,
  page: number,
  page_size: number,
  search?: string,
  start_date?: string,
  end_date?: string,
) => {
  return axiosInstance.get(`/history/search-claim-files`, {
    params: {
      claim_id,
      page,
      page_size,
      ...(search ? { search } : {}),
      ...(start_date && end_date ? { start_date, end_date } : {}),
    },
  });
};

export const searchTenantFiles = (
  tenant_id: number,
  page: number,
  page_size: number,
  search?: string,
  start_date?: string,
  end_date?: string,
) => {
  return axiosInstance.get(`/history/search-tenant-files`, {
    params: {
      tenant_id,
      page,
      page_size,
      ...(search ? { search } : {}),
      ...(start_date && end_date ? { start_date, end_date } : {}),
    },
  });
};

export const getCaseActivity = async (claimId: number | string) => {
  const response = await axiosInstance.get(`/case-activity/claim/${claimId}`);
  return response.data;
};

export const replyToEmailGraph = async (
  activity: any,
  comment: string,
  files: File[] = [],
) => {
  const formData = new FormData();

  formData.append("message_id", activity.meta?.message_id || "");
  formData.append("comment", comment || "");
  formData.append("use_graph", "true");

  files.forEach((file) => {
    formData.append("files", file);
  });

  const response = await axiosInstance.post(
    `/case-activity/email/reply-with-attachments`,
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
    },
  );

  return response.data;
};
export const forwardEmailGraph = async (
  activity: any,
  to_email: string,
  comment: string,
  files: File[] = [],
  subject?: string,
) => {
  const formData = new FormData();

  if (
    activity?.message_id &&
    activity.message_id !== "None" &&
    activity.message_id !== "null"
  ) {
    formData.append("message_id", activity.message_id);
  }

  formData.append("to_email", to_email || "");
  formData.append("comment", comment || "");
  formData.append(
    "subject",
    subject || activity?.subject || activity?.title || "",
  );
  formData.append("use_graph", "true");

  files.forEach((file) => {
    formData.append("files", file);
  });

  const response = await axiosInstance.post(
    `/case-activity/email/forward-with-attachments`,
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
    },
  );

  return response.data;
};

export const getAllCaseActivity = async () => {
  const response = await axiosInstance.get(`/case-activity/all`, {
    params: { include_emails: true },
  });
  return response.data;
};

export const getEmailAttachmentUrl = (fileUrl?: string) => {
  if (!fileUrl) return "#";
  if (fileUrl.startsWith("http")) return fileUrl;

  const baseURL = axiosInstance.defaults.baseURL || "";
  return `${baseURL}${fileUrl}`;
};

export const getEmailAttachmentBlob = (fileUrl: string) => {
  return axiosInstance.get(fileUrl, {
    responseType: "blob",
  });
};

export const getCaseActivityPresignedUrl = async (s3Key: string) => {
  const response = await axiosInstance.get(
    `/case-activity/document/presigned-url`,
    {
      params: { s3_key: s3Key },
    },
  );

  return response.data?.url;
};

export const createCaseNote = async (
  claimId: string | number,
  payload: { note: string; created_by?: string },
) => {
  const response = await axiosInstance.post(
    `/claims/${claimId}/notes`,
    payload,
  );
  return response.data;
};

export const getActivityNotes = async (
  activityId: number | string,
) => {
  const response = await axiosInstance.get(
    `/case-activity/activities/${activityId}/notes`,
  );

  return response.data;
};

// Standalone note threads created from the Notes tab (no backing activity).
// Pass a claimId to scope to one claim, omit for the all-cases view.
export const getManualNoteThreads = async (claimId?: number | string) => {
  const response = await axiosInstance.get(`/case-activity/manual-notes`, {
    params: claimId ? { claim_id: claimId } : {},
  });
  return Array.isArray(response.data) ? response.data : [];
};

export const createActivityNote = async (
  claimId: number | string,
  activityId: number | string,
  payload: { note: string },
) => {
  const response = await axiosInstance.post(
    `/case-activity/claims/${claimId}/activities/${activityId}/notes`,
    payload,
  );

  return response.data;
};

export const createActivityReply = async (
  noteId: number | string,
  payload: { reply: string },
) => {
  const response = await axiosInstance.post(
    `/case-activity/notes/${noteId}/reply`,
    payload,
  );

  return response.data;
};

export const deleteActivityNote = async (
  noteId: number | string,
) => {
  return axiosInstance.delete(
    `/case-activity/notes/${noteId}`,
  );
};

export const deleteActivityReply = async (
  replyId: number | string,
) => {
  return axiosInstance.delete(
    `/case-activity/note-replies/${replyId}`,
  );
};
