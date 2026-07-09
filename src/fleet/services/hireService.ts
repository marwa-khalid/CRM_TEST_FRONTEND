import fleetApi from "./fleetApi";

// All calls are best-effort: if the Fleet backend isn't running/migrated yet, the
// screens still work client-side (create/save fail silently and return null/void).

export const createHire = async (): Promise<number | null> => {
  try {
    const { data } = await fleetApi.post("/fleet/hire");
    return data?.id ?? null;
  } catch {
    return null;
  }
};

export const updateHire = async (
  hireId: number,
  partial: Record<string, unknown>,
): Promise<void> => {
  try {
    await fleetApi.patch(`/fleet/hire/${hireId}`, partial);
  } catch {
    /* ignore — field-level save is best-effort */
  }
};

export interface HireDocument {
  id: number;
  doc_type: string;
  filename?: string;
  file_url?: string;
  received_on?: string;
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

export const deleteHireDocument = async (hireId: number, docId: number): Promise<void> => {
  try {
    await fleetApi.delete(`/fleet/hire/${hireId}/documents/${docId}`);
  } catch {
    /* ignore */
  }
};
