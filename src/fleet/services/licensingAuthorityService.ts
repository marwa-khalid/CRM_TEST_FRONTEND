import fleetApi from "./fleetApi";

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

const base = (recordId: number) => `/fleet/vehicle-record/${recordId}/licensing-authority`;

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

// Opens the generated letters in a new tab: preview on screen, Print button for
// printing, and print-to-PDF for downloading. Written into a window opened
// synchronously so the pop-up blocker doesn't reject it after the await.
export const openLicensingLettersPrintView = async (recordId: number): Promise<void> => {
  const win = window.open("", "_blank", "noopener,noreferrer,width=1000,height=800");
  if (!win) throw new Error("Popup blocked");

  win.document.write(`<!doctype html>
    <html>
      <head>
        <title>Licensing Authority Letters</title>
        <style>
          body{font-family:Arial,sans-serif;margin:24px;color:#111827;background:#fff}
          .loader{border:3px solid #e5e7eb;border-top-color:#111827;border-radius:50%;width:32px;height:32px;animation:spin 1s linear infinite}
          main{min-height:70vh;display:flex;flex-direction:column;gap:16px;align-items:center;justify-content:center}
          @keyframes spin{to{transform:rotate(360deg)}}
        </style>
      </head>
      <body><main><div class="loader"></div><strong>Preparing letters…</strong></main></body>
    </html>`);
  win.document.close();

  try {
    const { data } = await fleetApi.get(`/fleet/vehicle-record/${recordId}/licensing-letters/print-view`, {
      responseType: "text",
    });
    win.document.open();
    win.document.write(data as string);
    win.document.close();
    win.focus();
  } catch (error) {
    win.document.open();
    win.document.write(`<!doctype html><html><body style="font-family:Arial,sans-serif;margin:24px;color:#111827"><h1>Could not prepare the letters</h1><p>Please try again.</p></body></html>`);
    win.document.close();
    throw error;
  }
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
