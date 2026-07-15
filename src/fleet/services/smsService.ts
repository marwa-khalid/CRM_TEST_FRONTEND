import fleetApi from "./fleetApi";

export interface FleetSmsPayload {
  mobile?: string;
  message: string;
  correspondent?: string;
  reference?: string;
  sms_phrase?: string;
  history_details?: string;
  kind?: string;
}

export interface FleetSmsResult {
  status: "sent" | "failed";
  provider?: string;
  to?: string;
  sid?: string;
  message_id?: string;
  detail?: string;
}

export const sendFleetSms = async (hireId: number, payload: FleetSmsPayload): Promise<FleetSmsResult> => {
  const { data } = await fleetApi.post(`/fleet/hire/${hireId}/sms`, payload);
  return data;
};

export const sendOnHireSms = async (hireId: number): Promise<FleetSmsResult> => {
  const { data } = await fleetApi.post(`/fleet/hire/${hireId}/sms/on-hire`);
  return data;
};
