import fleetApi from "./fleetApi";

export interface SendHireEmailPayload {
  to: string;
  cc?: string;
  subject?: string;
  body?: string;
  files?: File[];
}

export interface SendHireEmailResult {
  status: "sent" | "skipped" | "failed";
  via?: string;
  detail?: string;
}

// Send a free-form email (subject/message + attachments) for a hire. Attachments
// are uploaded fresh from the modal, so this is a multipart request.
export const sendHireEmail = async (
  hireId: number,
  { to, cc, subject, body, files }: SendHireEmailPayload,
): Promise<SendHireEmailResult> => {
  const fd = new FormData();
  fd.append("to", to);
  if (cc) fd.append("cc", cc);
  fd.append("subject", subject || "");
  fd.append("body", body || "");
  (files || []).forEach((f) => fd.append("files", f));
  const { data } = await fleetApi.post(`/fleet/hire/${hireId}/email`, fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data as SendHireEmailResult;
};
