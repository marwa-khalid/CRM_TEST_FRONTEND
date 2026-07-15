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
