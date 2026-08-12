import fleetApi from "./fleetApi";

// All calls are best-effort: if the Fleet backend isn't running/migrated yet, the
// screens still work client-side (create/save fail silently and return null/void).

export interface HireRecord {
  id: number;
  tenant_id?: number;
  fleet_reference?: string;
  file_opened_at?: string;
  file_closed_at?: string;
  insurance_type?: string;
  rental_advisor?: string;
  current_position?: string;
  hirer_type?: string;
  taxi_badge_number?: string;
  taxi_badge_name?: string;
  taxi_badge_expiry?: string;
  taxi_badge_council?: string;
  taxi_badge_type?: string;
  // Derived (list view): the most recently added hire vehicle's status + registration + dates.
  last_vehicle_hire_status?: string;
  last_vehicle_registration?: string;
  last_vehicle_hire_start?: string;
  last_vehicle_hire_end?: string;
  bank_name?: string;
  account_name?: string;
  sort_code?: string;
  account_number?: string;
  // Driver Details
  driver_name?: string;
  driver_address?: string;
  driver_postcode?: string;
  driver_email?: string;
  driver_telephone?: string;
  driver_mobile?: string;
  driving_licence_number?: string;
  national_insurance_number?: string;
  date_of_birth?: string;
  driving_licence_start?: string;
  driving_licence_end?: string;
  // GDPR & Marketing
  where_found?: string;
  privacy_notice_explained?: string;
  privacy_notice_date?: string;
  privacy_notice_method?: string;
  lawful_basis?: string;
  email_consent?: string;
  email_consent_date?: string;
  email_consent_method?: string;
  sms_consent?: string;
  phone_consent?: string;
  postal_consent?: string;
  reason_for_withdrawal?: string;
  // Payment Details
  payment_hire_start_date?: string;
  payment_hire_end_date?: string;
  vehicle_cost_per_day?: string;
  number_of_weekly_payments?: string;
  payment_day?: string;
  security_deposit?: string;
  weekly_hire_payment?: string;
  total_planned_hire_cost?: string;
  initial_amount_due?: string;
  payment_damage_charges?: string;
  additional_charges?: string;
  // Vehicle (legacy columns on the hire row)
  registration_number?: string;
}

export const listHires = async (): Promise<HireRecord[]> => {
  try {
    const { data } = await fleetApi.get("/fleet/hire");
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
};

export const deleteHire = async (hireId: number): Promise<boolean> => {
  try {
    await fleetApi.delete(`/fleet/hire/${hireId}`);
    return true;
  } catch {
    return false;
  }
};

export const getHire = async (hireId: number): Promise<HireRecord | null> => {
  try {
    const { data } = await fleetApi.get(`/fleet/hire/${hireId}`);
    return data ?? null;
  } catch {
    return null;
  }
};

export const createHire = async (): Promise<HireRecord | null> => {
  try {
    const { data } = await fleetApi.post("/fleet/hire");
    return data ?? null;
  } catch {
    return null;
  }
};

export const updateHire = async (
  hireId: number,
  partial: Record<string, unknown>,
): Promise<HireRecord | null> => {
  try {
    const { data } = await fleetApi.patch(`/fleet/hire/${hireId}`, partial);
    return data ?? null;
  } catch {
    /* ignore — field-level save is best-effort */
    return null;
  }
};

export interface HireCompletionSummary {
  vehicle_present: number;
  vehicle_total: number;
  proof_present: number;
  proof_total: number;
  document_present: number;
  document_total: number;
  pcn_present: number;
  pcn_total: number;
}

export const getHireCompletionSummary = async (hireId: number): Promise<HireCompletionSummary | null> => {
  try {
    const { data } = await fleetApi.get(`/fleet/hire/${hireId}/completion-summary`);
    return data ?? null;
  } catch {
    return null;
  }
};

export interface HireDocument {
  id: number;
  doc_type: string;
  filename?: string;
  file_url?: string;
  received_on?: string;
  created_at?: string;
}

export const uploadHireDocument = async (
  hireId: number,
  docType: string,
  file: File,
): Promise<HireDocument | null> => {
  const fd = new FormData();
  fd.append("doc_type", docType);
  fd.append("file", file);
  try {
    const { data } = await fleetApi.post(`/fleet/hire/${hireId}/documents`, fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data ?? null;
  } catch {
    return null;
  }
};

export const getHireDocuments = async (hireId: number): Promise<HireDocument[]> => {
  try {
    const { data } = await fleetApi.get(`/fleet/hire/${hireId}/documents`);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
};

// Fetch a stored document's bytes (auth-checked, S3 or local) as an object URL so it
// can be shown in an <img>/<a> — the raw file_url isn't directly loadable.
export const getHireDocumentFileUrl = async (hireId: number, docId: number): Promise<string | null> => {
  try {
    const res = await fleetApi.get(`/fleet/hire/${hireId}/documents/${docId}/file`, { responseType: "blob" });
    return URL.createObjectURL(res.data as Blob);
  } catch {
    return null;
  }
};

export const deleteHireDocument = async (hireId: number, docId: number): Promise<void> => {
  try {
    await fleetApi.delete(`/fleet/hire/${hireId}/documents/${docId}`);
  } catch {
    /* ignore */
  }
};

export interface HireAuditEntry {
  id: number;
  user?: string;
  field_changed: string;
  old_value?: string;
  new_value?: string;
  changed_at?: string;
}

// Newest-first change log for a hire (drives the GDPR Audit Log).
export const getHireAudit = async (hireId: number): Promise<HireAuditEntry[]> => {
  try {
    const { data } = await fleetApi.get(`/fleet/hire/${hireId}/audit`);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
};

export interface PcnData {
  id?: number;
  hire_id?: number;
  council_name?: string;
  council_address?: string;
  council_postcode?: string;
  pcn_number?: string;
  offence_date?: string;
  pcn_status?: string;
  liability_transfer_status?: string;
  response_deadline?: string;
}

export interface PcnDocument {
  id: number;
  doc_type: string;
  filename?: string;
  file_url?: string;
  received_on?: string;
  uploaded_by?: string;
  created_at?: string;
}

export interface PcnNote {
  id: number;
  note: string;
  created_by_name?: string;
  created_at?: string;
}

export interface PcnReminder {
  id?: number;
  reminder_type: string;
  reminder_date?: string;
  reminder_time?: string;
}

export const getPenaltyCharge = async (hireId: number): Promise<PcnData | null> => {
  try {
    const { data } = await fleetApi.get(`/fleet/hire/${hireId}/pcn`);
    return data ?? null;
  } catch {
    return null;
  }
};

export const savePenaltyCharge = async (
  hireId: number,
  partial: PcnData,
): Promise<PcnData | null> => {
  try {
    const { data } = await fleetApi.patch(`/fleet/hire/${hireId}/pcn`, partial);
    return data ?? null;
  } catch {
    return null;
  }
};

export const getPcnDocuments = async (hireId: number): Promise<PcnDocument[]> => {
  try {
    const { data } = await fleetApi.get(`/fleet/hire/${hireId}/pcn/documents`);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
};

export const uploadPcnDocument = async (
  hireId: number,
  docType: string,
  file: File,
): Promise<PcnDocument | null> => {
  const fd = new FormData();
  fd.append("doc_type", docType);
  fd.append("file", file);
  try {
    const { data } = await fleetApi.post(`/fleet/hire/${hireId}/pcn/documents`, fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data ?? null;
  } catch {
    return null;
  }
};

export const deletePcnDocument = async (hireId: number, docId: number): Promise<void> => {
  try {
    await fleetApi.delete(`/fleet/hire/${hireId}/pcn/documents/${docId}`);
  } catch {
    /* ignore */
  }
};

export const getPcnNotes = async (hireId: number): Promise<PcnNote[]> => {
  try {
    const { data } = await fleetApi.get(`/fleet/hire/${hireId}/pcn/notes`);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
};

export const addPcnNote = async (hireId: number, note: string): Promise<PcnNote | null> => {
  try {
    const { data } = await fleetApi.post(`/fleet/hire/${hireId}/pcn/notes`, { note });
    return data ?? null;
  } catch {
    return null;
  }
};

export const getPcnReminders = async (hireId: number): Promise<PcnReminder[]> => {
  try {
    const { data } = await fleetApi.get(`/fleet/hire/${hireId}/pcn/reminders`);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
};

export const savePcnReminder = async (
  hireId: number,
  reminderType: string,
  payload: Pick<PcnReminder, "reminder_date" | "reminder_time">,
): Promise<PcnReminder | null> => {
  try {
    const { data } = await fleetApi.put(`/fleet/hire/${hireId}/pcn/reminders/${reminderType}`, payload);
    return data ?? null;
  } catch {
    return null;
  }
};

// Fleet expiry reminders (road tax / plate / MOT) currently due — read-only view.
export interface FleetDueReminder {
  kind: string;
  title: string;
  vehicle: string;
  make_model?: string | null;
  authority?: string | null;
  expiry_date: string;
  hire_id?: number | null;
}

// `side`: "vehicles" → vehicle docs (Road Fund / Plate / MOT); "skyline" → driver
// docs (Driving Licence / Taxi Badge). Vehicle docs don't belong to the hire list.
export const getDueReminders = async (side = "vehicles"): Promise<FleetDueReminder[]> => {
  try {
    const { data } = await fleetApi.get("/fleet/reminders/due", { params: { side } });
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
};

// Every vehicle expiry (road fund / plate / MOT) with its actual date — for the
// Fleet calendar (not limited to the 7-day due window like getDueReminders).
export const listAllExpiries = async (context?: string): Promise<FleetDueReminder[]> => {
  try {
    const { data } = await fleetApi.get("/fleet/reminders/expiries", { params: { context } });
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
};
