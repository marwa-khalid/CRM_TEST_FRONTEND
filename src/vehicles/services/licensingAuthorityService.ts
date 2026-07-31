import fleetApi from "../../fleet/services/fleetApi";

export const MAX_LICENSING_AUTHORITIES = 4;

export interface LicensingAuthority {
  id: number;
  vehicle_record_id: number;
  position?: number | null;
  // Plating authority contact details
  licensing_authority?: string | null;
  address?: string | null;
  postcode?: string | null;
  telephone?: string | null;
  contact_number?: string | null;
  email_address?: string | null;
  // Plating details
  plate_number?: string | null;
  plating_start_date?: string | null;
  plating_expiry_date?: string | null;
  plating_booked_date?: string | null;
  plating_booked_time?: string | null;
  plating_attended_passed?: boolean | null;
  plating_certificate_name?: string | null;
  plating_certificate_url?: string | null;
  // MOT centre contact details
  mot_centre_name?: string | null;
  mot_address?: string | null;
  mot_postcode?: string | null;
  mot_telephone?: string | null;
  mot_email_address?: string | null;
  // Private hire MOT details
  last_mot_date?: string | null;
  mot_expiry_date?: string | null;
  mot_booked_date?: string | null;
  mot_booked_time?: string | null;
  mot_attended_passed?: boolean | null;
  mot_certificate_name?: string | null;
  mot_certificate_url?: string | null;
}

const base = (recordId: number) => `/vehicles/vehicle-record/${recordId}/licensing-authority`;

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

export const listLicensingAuthorities = async (recordId: number): Promise<LicensingAuthority[]> => {
  try {
    const { data } = await fleetApi.get(base(recordId));
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
};

// Rejects with the backend detail (e.g. the four-authority cap) so the caller
// can surface it rather than silently doing nothing.
export const createLicensingAuthority = async (recordId: number): Promise<LicensingAuthority> => {
  const { data } = await fleetApi.post(base(recordId));
  return data;
};

export const updateLicensingAuthority = async (
  recordId: number,
  authorityId: number,
  payload: Record<string, unknown>,
): Promise<LicensingAuthority | null> => {
  try {
    const { data } = await fleetApi.patch(`${base(recordId)}/${authorityId}`, payload);
    return data;
  } catch {
    return null;
  }
};

export const deleteLicensingAuthority = async (recordId: number, authorityId: number): Promise<boolean> => {
  try {
    await fleetApi.delete(`${base(recordId)}/${authorityId}`);
    return true;
  } catch {
    return false;
  }
};

export type CertificateKind = "plating" | "mot";

export const uploadCertificate = async (
  recordId: number,
  authorityId: number,
  kind: CertificateKind,
  file: File,
): Promise<LicensingAuthority | null> => {
  const form = new FormData();
  form.append("file", file);
  try {
    const { data } = await fleetApi.post(`${base(recordId)}/${authorityId}/certificate/${kind}`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  } catch {
    return null;
  }
};

export const removeCertificate = async (
  recordId: number,
  authorityId: number,
  kind: CertificateKind,
): Promise<LicensingAuthority | null> => {
  try {
    const { data } = await fleetApi.delete(`${base(recordId)}/${authorityId}/certificate/${kind}`);
    return data;
  } catch {
    return null;
  }
};

export interface ExtractedPlating {
  licensingAuthority: string;
  address: string;
  postcode: string;
  telephone: string;
  contactNumber: string;
  emailAddress: string;
  plateNumber: string;
  platingStartDate: string;
  platingExpiryDate: string;
}

export interface ExtractedMot {
  motCentreName: string;
  address: string;
  postcode: string;
  telephone: string;
  emailAddress: string;
  lastMotDate: string;
  motExpiryDate: string;
}

const EMPTY_PLATING: ExtractedPlating = {
  licensingAuthority: "", address: "", postcode: "", telephone: "",
  contactNumber: "", emailAddress: "", plateNumber: "",
  platingStartDate: "", platingExpiryDate: "",
};

const EMPTY_MOT: ExtractedMot = {
  motCentreName: "", address: "", postcode: "", telephone: "",
  emailAddress: "", lastMotDate: "", motExpiryDate: "",
};

const ocr = async <T,>(path: string, file: File, empty: T): Promise<T> => {
  const form = new FormData();
  form.append("file", file);
  try {
    const { data } = await fleetApi.post(path, form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return { ...empty, ...data };
  } catch {
    return { ...empty };
  }
};

export const extractPlatingCertificate = (file: File): Promise<ExtractedPlating> =>
  ocr("/fleet/ocr/plating-certificate", file, EMPTY_PLATING);

export const extractMotCertificate = (file: File): Promise<ExtractedMot> =>
  ocr("/fleet/ocr/mot-certificate", file, EMPTY_MOT);

export const getLicensingLettersPrintHtml = async (recordId: number): Promise<string> => {
  const { data } = await fleetApi.get(`/vehicles/vehicle-record/${recordId}/licensing-letters/print-view`, {
    responseType: "text",
  });
  return data as string;
};

export const downloadLicensingAuthorityLetters = async (recordId: number): Promise<string> => {
  const res = await fleetApi.get(`/vehicles/vehicle-record/${recordId}/licensing-letters/download`, {
    responseType: "blob",
  });
  const filename = filenameFromDisposition(res.headers["content-disposition"]) || "Licensing Authority Letters.zip";
  downloadBlob(res.data as Blob, filename);
  return filename;
};

export interface AppointmentEmailPreview {
  to: string;
  subject: string;
  body: string;
  html: string;
}

// The default recipient (the logged-in user), subject and editable body for the
// plating/MOT confirmation — shown in the preview before sending.
export const getAppointmentEmailPreview = async (
  recordId: number,
  authorityId: number,
  kind: CertificateKind,
): Promise<AppointmentEmailPreview> => {
  const { data } = await fleetApi.get(`${base(recordId)}/${authorityId}/email/${kind}/preview`);
  return data;
};

// "Appointment passed" confirmation — sends the reviewed/edited to, subject and body.
export const sendAppointmentPassedEmail = async (
  recordId: number,
  authorityId: number,
  kind: CertificateKind,
  payload: { to?: string; cc?: string; subject?: string; body?: string } = {},
): Promise<void> => {
  await fleetApi.post(`${base(recordId)}/${authorityId}/email/${kind}`, payload);
};
