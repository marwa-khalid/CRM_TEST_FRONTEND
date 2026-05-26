// Add these functions to your existing HistoryActivities service file.
// They call the three new backend endpoints added to case_activity.py.

import axios from "axios"; // or replace with your fetch wrapper

const BASE = import.meta.env.VITE_API_BASE_URL || "";

// -------------------------------------------------------------------------
// replyToEmail
// Returns a mailto: URL from the backend, then opens it in the browser.
// This pops open the user's default mail client (Outlook desktop / web)
// pre-filled with the reply.
// -------------------------------------------------------------------------
export async function replyToEmail(activity: any): Promise<void> {
  const res = await axios.post(`${BASE}/case-activity/email/reply`, {
    message_id: activity.meta?.message_id || "",
    sender_email: activity.sender_email || "",
    subject: activity.subject || "",
    body_text: activity.body_text || activity.body_preview || "",
    comment: "", // populated if you add a compose box later
    use_graph: false, // set true to send server-side via Graph
  });

  const mailto: string = res.data?.mailto || "";
  if (mailto) {
    // Opens Outlook (desktop or web) pre-filled for reply
    window.open(mailto, "_blank");
  }
}

// -------------------------------------------------------------------------
// forwardEmail
// Returns a mailto: URL from the backend, then opens it in the browser.
// The body includes original content + attachment names as a hint.
// -------------------------------------------------------------------------
export async function forwardEmail(activity: any): Promise<void> {
  const attachmentNames: string[] = (activity.attachments || [])
    .map((a: any) => a.file_name)
    .filter(Boolean);

  const res = await axios.post(`${BASE}/case-activity/email/forward`, {
    message_id: activity.meta?.message_id || "",
    subject: activity.subject || "",
    body_text: activity.body_text || activity.body_preview || "",
    to_email: "", // user fills in recipient in Outlook
    comment: "",
    attachment_names: attachmentNames,
    use_graph: false, // set true to send server-side via Graph
  });

  const mailto: string = res.data?.mailto || "";
  if (mailto) {
    window.open(mailto, "_blank");
  }
}

// -------------------------------------------------------------------------
// getEmailAttachmentUrl
// Returns the proxied download URL for an Outlook email attachment.
// The attachment.file_url already contains the correct path
// (/case-activity/email-attachment/{msgId}/{attId}) set by the backend.
// Just prepend the API base if needed.
// -------------------------------------------------------------------------
export function getEmailAttachmentUrl(fileUrl: string): string {
  if (!fileUrl) return "#";
  // If already absolute, return as-is
  if (fileUrl.startsWith("http")) return fileUrl;
  return `${BASE}${fileUrl}`;
}
