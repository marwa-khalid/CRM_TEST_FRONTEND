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

export interface DepositRefundPayload {
  to: string;
  cc?: string;
  subject?: string;
  registration?: string;
  valeting_fee?: string;
  vehicle_damages?: string;
  excess_ppm?: string;
  hire_charges_unpaid?: string;
}

// Sends the structured (boxed) deposit-refund email; the rest of the data is
// pulled from the hire record on the backend.
export const sendDepositRefund = async (
  hireId: number,
  payload: DepositRefundPayload,
): Promise<SendHireEmailResult> => {
  const { data } = await fleetApi.post(`/fleet/hire/${hireId}/deposit-refund`, payload);
  return data as SendHireEmailResult;
};

// The exact HTML the deposit-refund email will send (for the modal preview).
export const getDepositRefundPreview = async (hireId: number): Promise<string> => {
  try {
    const { data } = await fleetApi.get(`/fleet/hire/${hireId}/deposit-refund/preview`);
    return (data?.html as string) || "";
  } catch {
    return "";
  }
};

export interface PayHirerPayload {
  to: string;
  cc?: string;
  subject?: string;
  amount: string;
  reason: string;
  registration?: string;
}

export const sendPayHirer = async (
  hireId: number,
  payload: PayHirerPayload,
): Promise<SendHireEmailResult> => {
  const { data } = await fleetApi.post(`/fleet/hire/${hireId}/pay-hirer`, payload);
  return data as SendHireEmailResult;
};

export const getPayHirerPreview = async (
  hireId: number,
  payload: Pick<PayHirerPayload, "amount" | "reason" | "registration">,
): Promise<string> => {
  try {
    const { data } = await fleetApi.get(`/fleet/hire/${hireId}/pay-hirer/preview`, { params: payload });
    return (data?.html as string) || "";
  } catch {
    return "";
  }
};
