import axiosInstance from "../axiosConfig";

export const getPlatingCharges = (claimId: any, vehicleId?: any) =>
  axiosInstance.get(`/plating-charges/${claimId}`, {
    params: vehicleId != null ? { vehicle_id: vehicleId } : {},
  });

// Total plating across all of a claim's vehicles (for the ABI Billed Breakdown).
export const getPlatingTotal = (claimId: any) =>
  axiosInstance.get(`/plating-charges/${claimId}/total`);

export const savePlatingCharges = (payload: any) =>
  axiosInstance.post(`/plating-charges/`, payload);
