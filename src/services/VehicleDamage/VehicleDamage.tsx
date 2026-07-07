import axiosInstance from "../axiosConfig";
import type { AxiosRequestConfig } from "axios";

export const updateVehicleDamage = async (data: any) => {
  try {
    const response = await axiosInstance.put(`/client-vehicles/damage-update`, data);
    return response.data;
  } catch (error: any) {
    throw error;
  }
};

export const aiAnalyze = async (
  formData: FormData,
  config: AxiosRequestConfig = {},
) => {
  const response = await axiosInstance.post(
    `/vehicle-damage-reports/analyze`,
    formData,
    {
      ...config,
      headers: {
        ...(config.headers || {}),
        "Content-Type": "multipart/form-data",
      },
      // AI analysis runs many images through Roboflow and takes well over the
      // default 30s timeout; allow up to 5 minutes so axios doesn't cancel it.
      timeout: config.timeout || 300000,
    },
  );
  return response.data;
};

export const saveDamageDetails = async (payload: any) => {
  const response = await axiosInstance.post(
    `/vehicle-damage-reports/reports`,
    payload,
  );
  return response.data;
};

// Save the handler's manual adjustments; the backend regenerates the report PDF
// (ReportLab) and re-points the documents-library file. Returns the fresh PDF url.
export const saveManualAdjustments = async (payload: {
  claim_id: number | string;
  decisions: Record<string, "accepted" | "rejected">;
  notes: string;
  vehicleStatus: string;
}) => {
  const response = await axiosInstance.post(
    `/vehicle-damage-reports/save-adjustments`,
    payload,
    // The server rebuilds an SVG-heavy PDF; allow well beyond the default 30s.
    { timeout: 300000 },
  );
  return response.data;
};

export const getLatestVehicleDamageReport = async (
  claimId: number | string,
) => {
  const response = await axiosInstance.get(
    `/vehicle-damage-reports/claim/${claimId}/latest`,
  );
  return response.data;
};

export const uploadVehicleDamageReport = async (formData: FormData) => {
  const response = await axiosInstance.post(
    `/vehicle-damage-reports/sync-pdf`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      // PDF generation (SVG-heavy) can exceed the default 30s timeout.
      timeout: 300000,
    },
  );
  return response.data;
};
