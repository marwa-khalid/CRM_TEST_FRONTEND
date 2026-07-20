import fleetApi from "./fleetApi";

// Fleet messaging goes out over WhatsApp (replaced the old SMS sending).
export interface FleetWhatsAppPayload {
  mobile?: string;
  message: string;
  correspondent?: string;
  reference?: string;
  phrase?: string;
  history_details?: string;
  kind?: string;
}

export interface FleetWhatsAppResult {
  status: "sent" | "failed";
  provider?: string;
  to?: string;
  sid?: string;
  message_id?: string;
  detail?: string;
}

export const sendFleetWhatsApp = async (
  hireId: number,
  payload: FleetWhatsAppPayload,
): Promise<FleetWhatsAppResult> => {
  const { data } = await fleetApi.post(`/fleet/hire/${hireId}/whatsapp`, payload);
  return data;
};

export const sendOnHireWhatsApp = async (hireId: number): Promise<FleetWhatsAppResult> => {
  const { data } = await fleetApi.post(`/fleet/hire/${hireId}/whatsapp/on-hire`);
  return data;
};
