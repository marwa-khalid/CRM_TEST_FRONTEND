import fleetApi from "./fleetApi";

const filenameFromDisposition = (header?: string): string | null => {
  if (!header) return null;
  const match = header.match(/filename\*?=(?:UTF-8''|")?([^";]+)/i);
  return match ? decodeURIComponent(match[1].replace(/"/g, "")) : null;
};

const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

export interface VehicleRecord {
  id: number;
  hire_id?: number | null;
  obtained_for_purpose?: string | null;
  contract_type?: string | null;
  company_owned_or_leased?: boolean | null;
  cross_hired_to_us?: boolean | null;
  registration_number?: string | null;
  make?: string | null;
  model?: string | null;
  manufacturer?: string | null;
  variant?: string | null;
  number_of_doors?: string | null;
  number_of_seats?: string | null;
  body_type?: string | null;
  fuel_type?: string | null;
  transmission?: string | null;
  engine_size_cc?: string | null;
  v5c_document_reference?: string | null;
  chassis_number?: string | null;
  date_of_first_registration?: string | null;
  date_delivered?: string | null;
  vehicle_status?: string | null;
  depot_branch?: string | null;
  road_tax_renewed_on?: string | null;
  // Calculated server-side as one year on — read-only here.
  road_tax_expiry_date?: string | null;
  purchaser_name?: string | null;
  purchaser_address?: string | null;
  purchaser_postcode?: string | null;
  purchaser_telephone?: string | null;
  purchaser_email?: string | null;
  vehicle_sold_on?: string | null;
  sold_for_inc_vat?: string | null;
  sold_for_exc_vat?: string | null;
  // Read-only, derived server-side from the Skyline client-side hire screens.
  latest_mileage_obtained?: string | null;
  mileage_obtained_on?: string | null;
}

// The vehicle record is the Customer Side of a hire file — one per hire, created
// server-side on first open so existing hire files pick one up transparently.
export const getHireVehicleRecord = async (hireId: number): Promise<VehicleRecord | null> => {
  try {
    const { data } = await fleetApi.get(`/fleet/hire/${hireId}/vehicle-record`);
    return data;
  } catch {
    return null;
  }
};

export const listVehicleRecords = async (): Promise<VehicleRecord[]> => {
  try {
    const { data } = await fleetApi.get("/fleet/vehicle-record");
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
};

export const getVehicleRecord = async (recordId: number): Promise<VehicleRecord | null> => {
  try {
    const { data } = await fleetApi.get(`/fleet/vehicle-record/${recordId}`);
    return data;
  } catch {
    return null;
  }
};

export const updateVehicleRecord = async (
  recordId: number,
  payload: Record<string, unknown>,
): Promise<VehicleRecord | null> => {
  try {
    const { data } = await fleetApi.patch(`/fleet/vehicle-record/${recordId}`, payload);
    return data;
  } catch {
    return null;
  }
};

export interface ExtractedV5C {
  registration: string;
  make: string;
  model: string;
  manufacturer: string;
  variant: string;
  numberOfDoors: string;
  numberOfSeats: string;
  bodyType: string;
  fuelType: string;
  transmission: string;
  engineSizeCc: string;
  v5cDocumentReference: string;
  chassisNumber: string;
  dateOfFirstRegistration: string;
  dateDelivered: string;
}

const EMPTY_V5C: ExtractedV5C = {
  registration: "", make: "", model: "", manufacturer: "", variant: "",
  numberOfDoors: "", numberOfSeats: "", bodyType: "", fuelType: "",
  transmission: "", engineSizeCc: "", v5cDocumentReference: "",
  chassisNumber: "", dateOfFirstRegistration: "", dateDelivered: "",
};

// OCR a V5C logbook. Never throws — a failed read yields blanks so the user can
// still type the vehicle in by hand.
export const extractV5C = async (file: File): Promise<ExtractedV5C> => {
  const form = new FormData();
  form.append("file", file);
  try {
    const { data } = await fleetApi.post("/fleet/ocr/v5c", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return { ...EMPTY_V5C, ...data };
  } catch {
    return { ...EMPTY_V5C };
  }
};

export const getSaleDocumentsPrintHtml = async (recordId: number): Promise<string> => {
  const { data } = await fleetApi.get(`/fleet/vehicle-record/${recordId}/sale-documents/print-view`, {
    responseType: "text",
  });
  return data as string;
};

export interface FleetSaleEmailPreview {
  to: string;
  subject: string;
  body: string;
  html: string;
}

// "Inform Accounts" email — editable preview (default recipient/subject/body).
export const getSaleAccountsEmailPreview = async (recordId: number): Promise<FleetSaleEmailPreview> => {
  const { data } = await fleetApi.get(`/fleet/vehicle-record/${recordId}/sale/accounts-email/preview`);
  return data;
};

export const sendSaleAccountsEmail = async (
  recordId: number,
  args: { to: string; cc?: string; subject: string; body: string; files?: File[] },
): Promise<void> => {
  const fd = new FormData();
  fd.append("to", args.to);
  if (args.cc) fd.append("cc", args.cc);
  fd.append("subject", args.subject || "");
  fd.append("body", args.body || "");
  (args.files || []).forEach((f) => fd.append("files", f));
  await fleetApi.post(`/fleet/vehicle-record/${recordId}/sale/accounts-email`, fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const downloadSaleDocuments = async (recordId: number): Promise<string> => {
  const res = await fleetApi.get(`/fleet/vehicle-record/${recordId}/sale-documents/download`, {
    responseType: "blob",
  });
  const filename = filenameFromDisposition(res.headers["content-disposition"]) || "Release of Liability and Receipt.docx";
  downloadBlob(res.data as Blob, filename);
  return filename;
};

// Opens the Release of Liability + Sale Receipt in a new tab: preview, Print,
// and print-to-PDF for downloading. The window is opened synchronously so the
// pop-up blocker doesn't reject it after the await.
export const openSaleDocumentsPrintView = async (recordId: number): Promise<void> => {
  const win = window.open("", "_blank", "width=1000,height=800");
  if (!win) throw new Error("Popup blocked");
  try {
    win.opener = null;
  } catch {
    // Some browsers expose opener as read-only; the print view still works.
  }

  win.document.write(`<!doctype html>
    <html>
      <head>
        <title>Vehicle Sale Documents</title>
        <style>
          body{font-family:Arial,sans-serif;margin:24px;color:#111827;background:#fff}
          .loader{border:3px solid #e5e7eb;border-top-color:#111827;border-radius:50%;width:32px;height:32px;animation:spin 1s linear infinite}
          main{min-height:70vh;display:flex;flex-direction:column;gap:16px;align-items:center;justify-content:center}
          @keyframes spin{to{transform:rotate(360deg)}}
        </style>
      </head>
      <body><main><div class="loader"></div><strong>Preparing documents…</strong></main></body>
    </html>`);
  win.document.close();

  try {
    const data = await getSaleDocumentsPrintHtml(recordId);
    win.document.open();
    win.document.write(data as string);
    win.document.close();
    win.focus();
  } catch (error) {
    win.document.open();
    win.document.write(`<!doctype html><html><body style="font-family:Arial,sans-serif;margin:24px;color:#111827"><h1>Could not prepare the documents</h1><p>Please try again.</p></body></html>`);
    win.document.close();
    throw error;
  }
};

export interface VehicleDocument {
  id: number;
  vehicle_record_id: number;
  doc_type?: string | null;
  filename?: string | null;
  file_url?: string | null;
  created_at?: string | null;
}

// Store the uploaded file against the record (kept as history — a replacement
// V5C adds a new row rather than overwriting).
export const uploadVehicleDocument = async (
  recordId: number,
  file: File,
  docType = "v5c",
): Promise<VehicleDocument | null> => {
  const form = new FormData();
  form.append("file", file);
  try {
    const { data } = await fleetApi.post(`/fleet/vehicle-record/${recordId}/documents?doc_type=${docType}`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  } catch {
    return null;
  }
};

// Every uploaded document on a vehicle record (V5C, plating/MOT certificates,
// service invoices) regardless of type — used to surface the customer-side
// uploads in the hire's Documents Library.
export const listAllVehicleRecordDocuments = async (recordId: number): Promise<VehicleDocument[]> => {
  try {
    const { data } = await fleetApi.get(`/fleet/vehicle-record/${recordId}/documents`);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
};

export const listVehicleDocuments = async (
  recordId: number,
  docType = "v5c",
  authorityId?: number,
  serviceId?: number,
): Promise<VehicleDocument[]> => {
  try {
    const authorityQuery = authorityId ? `&authority_id=${authorityId}` : "";
    const serviceQuery = serviceId ? `&service_id=${serviceId}` : "";
    const { data } = await fleetApi.get(
      `/fleet/vehicle-record/${recordId}/documents?doc_type=${docType}${authorityQuery}${serviceQuery}`,
    );
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
};

// Removes a single uploaded document (history row) from a vehicle record.
export const deleteVehicleDocument = async (recordId: number, docId: number): Promise<boolean> => {
  try {
    await fleetApi.delete(`/fleet/vehicle-record/${recordId}/documents/${docId}`);
    return true;
  } catch {
    return false;
  }
};

// Fetches the file (auth-checked) as a blob and returns an object URL the caller
// can open in a new tab — a plain link can't send the Bearer token.
export const getVehicleDocumentFileUrl = async (
  recordId: number,
  docId: number,
): Promise<string | null> => {
  try {
    const res = await fleetApi.get(`/fleet/vehicle-record/${recordId}/documents/${docId}/file`, { responseType: "blob" });
    return URL.createObjectURL(res.data as Blob);
  } catch {
    return null;
  }
};
