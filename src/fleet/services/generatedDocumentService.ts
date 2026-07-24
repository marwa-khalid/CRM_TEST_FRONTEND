import fleetApi from "./fleetApi";

export type GeneratedDocumentKey =
  | "raise_hire_documentation"
  | "raise_authority_letter"
  | "raise_vehicle_inspection_sheet";

export interface GeneratedDocumentFile {
  key: string;
  filename: string;
  content_type: string;
  size: number;
}

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

export const listGeneratedDocumentFiles = async (
  hireId: number,
  documentKey: GeneratedDocumentKey,
  vehicleId?: number,
): Promise<GeneratedDocumentFile[]> => {
  const { data } = await fleetApi.get(`/fleet/hire/${hireId}/generated-documents/${documentKey}`, {
    params: vehicleId ? { vehicle_id: vehicleId } : undefined,
  });
  return Array.isArray(data) ? data : [];
};

export const downloadGeneratedDocumentBundle = async (
  hireId: number,
  documentKey: GeneratedDocumentKey,
  vehicleId?: number,
): Promise<string> => {
  // When the document is a single file, download it directly instead of a zip.
  const files = await listGeneratedDocumentFiles(hireId, documentKey, vehicleId);
  if (files.length === 1) {
    const file = files[0];
    const res = await fleetApi.get(
      `/fleet/hire/${hireId}/generated-documents/${documentKey}/files/${file.key}`,
      {
        responseType: "blob",
        params: vehicleId ? { vehicle_id: vehicleId } : undefined,
      },
    );
    const filename = filenameFromDisposition(res.headers["content-disposition"]) || file.filename;
    downloadBlob(res.data as Blob, filename);
    return filename;
  }

  const res = await fleetApi.get(`/fleet/hire/${hireId}/generated-documents/${documentKey}/download`, {
    responseType: "blob",
    params: vehicleId ? { vehicle_id: vehicleId } : undefined,
  });
  const filename = filenameFromDisposition(res.headers["content-disposition"]) || "generated-documents.zip";
  downloadBlob(res.data as Blob, filename);
  return filename;
};

export const getGeneratedDocumentFiles = async (
  hireId: number,
  documentKey: GeneratedDocumentKey,
  vehicleId?: number,
): Promise<File[]> => {
  const files = await listGeneratedDocumentFiles(hireId, documentKey, vehicleId);
  const downloads = await Promise.all(
    files.map(async (file) => {
      const res = await fleetApi.get(
        `/fleet/hire/${hireId}/generated-documents/${documentKey}/files/${file.key}`,
        {
          responseType: "blob",
          params: vehicleId ? { vehicle_id: vehicleId } : undefined,
        },
      );
      const blob = res.data as Blob;
      return new File([blob], file.filename, { type: file.content_type || blob.type });
    }),
  );
  return downloads;
};

export const openGeneratedDocumentPrintView = async (
  hireId: number,
  documentKey: GeneratedDocumentKey,
  vehicleId?: number,
): Promise<void> => {
  const win = window.open("", "_blank", "width=1000,height=800");
  if (!win) {
    throw new Error("Popup blocked");
  }
  try {
    win.opener = null;
  } catch {
    // Some browsers expose opener as read-only; the print view still works.
  }

  win.document.write(`<!doctype html>
    <html>
      <head>
        <title>Printable Documents</title>
        <style>
          body{font-family:Arial,sans-serif;margin:24px;color:#111827;background:#fff}
          .loader{border:3px solid #e5e7eb;border-top-color:#111827;border-radius:50%;width:32px;height:32px;animation:spin 1s linear infinite}
          main{min-height:70vh;display:flex;flex-direction:column;gap:16px;align-items:center;justify-content:center}
          @keyframes spin{to{transform:rotate(360deg)}}
        </style>
      </head>
      <body>
        <main><div class="loader"></div><strong>Preparing print view…</strong></main>
      </body>
    </html>`);
  win.document.close();

  try {
    const { data } = await fleetApi.get(`/fleet/hire/${hireId}/generated-documents/${documentKey}/print-view`, {
      responseType: "text",
      params: vehicleId ? { vehicle_id: vehicleId } : undefined,
    });
    win.document.open();
    win.document.write(data as string);
    win.document.close();
    win.focus();
  } catch (error) {
    win.document.open();
    win.document.write(`<!doctype html><html><body style="font-family:Arial,sans-serif;margin:24px;color:#111827"><h1>Could not prepare print view</h1><p>Please try again.</p></body></html>`);
    win.document.close();
    throw error;
  }
};
