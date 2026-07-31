import fleetApi from "../../fleet/services/fleetApi";

// Miles between services — the default the user story specifies.
export const SERVICE_INTERVAL_MILES = 10000;

export interface VehicleServiceRecord {
  id: number;
  vehicle_record_id: number;
  position?: number | null;
  garage_name?: string | null;
  address?: string | null;
  postcode?: string | null;
  contact_number?: string | null;
  email?: string | null;
  service_booked_date?: string | null;
  service_booked_time?: string | null;
  serviced_at_mileage?: string | null;
  serviced_on?: string | null;
  next_service_due_at?: string | null;
  case_reference?: string | null;
  invoice_name?: string | null;
  invoice_url?: string | null;
}

const base = (recordId: number) => `/vehicles/vehicle-record/${recordId}/service`;

export const listVehicleServices = async (recordId: number): Promise<VehicleServiceRecord[]> => {
  try {
    const { data } = await fleetApi.get(base(recordId));
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
};

export const createVehicleService = async (recordId: number): Promise<VehicleServiceRecord | null> => {
  try {
    const { data } = await fleetApi.post(base(recordId));
    return data;
  } catch {
    return null;
  }
};

export const updateVehicleService = async (
  recordId: number,
  serviceId: number,
  payload: Record<string, unknown>,
): Promise<VehicleServiceRecord | null> => {
  try {
    const { data } = await fleetApi.patch(`${base(recordId)}/${serviceId}`, payload);
    return data;
  } catch {
    return null;
  }
};

export const deleteVehicleService = async (recordId: number, serviceId: number): Promise<boolean> => {
  try {
    await fleetApi.delete(`${base(recordId)}/${serviceId}`);
    return true;
  } catch {
    return false;
  }
};

export const uploadServiceInvoice = async (
  recordId: number,
  serviceId: number,
  file: File,
): Promise<VehicleServiceRecord | null> => {
  const form = new FormData();
  form.append("file", file);
  try {
    const { data } = await fleetApi.post(`${base(recordId)}/${serviceId}/invoice`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  } catch {
    return null;
  }
};

export interface ExtractedServiceInvoice {
  garageName: string;
  address: string;
  postcode: string;
  contactNumber: string;
  email: string;
  serviceBookedDate: string;
  serviceBookedTime: string;
  servicedAtMileage: string;
  servicedOn: string;
  nextServiceDueAt: string;
  caseReference: string;
}

const EMPTY: ExtractedServiceInvoice = {
  garageName: "", address: "", postcode: "", contactNumber: "", email: "",
  serviceBookedDate: "", serviceBookedTime: "", servicedAtMileage: "",
  servicedOn: "", nextServiceDueAt: "", caseReference: "",
};

export const extractServiceInvoice = async (file: File): Promise<ExtractedServiceInvoice> => {
  const form = new FormData();
  form.append("file", file);
  try {
    const { data } = await fleetApi.post("/fleet/ocr/service-invoice", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return { ...EMPTY, ...data };
  } catch {
    return { ...EMPTY };
  }
};
