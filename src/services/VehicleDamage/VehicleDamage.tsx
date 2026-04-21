import axiosInstance from "../axiosConfig";

export const updateVehicleDamage = async (data: any) => {
  try {
    const response = await axiosInstance.put(`/client-vehicles/damage-update`, data);
    return response.data;
  } catch (error: any) {
    throw error;
  }
};

export const aiAnalyze = async (formData: FormData) => {
  const response = await axiosInstance.post(
    `/vehicle-damage-reports/analyze`,
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
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
    },
  );
  return response.data;
};
