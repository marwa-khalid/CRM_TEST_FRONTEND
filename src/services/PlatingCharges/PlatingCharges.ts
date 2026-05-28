import axiosInstance from "../axiosConfig";

export const getPlatingCharges = (claimId: any) =>
  axiosInstance.get(`/plating-charges/${claimId}`);

export const savePlatingCharges = (payload: any) =>
  axiosInstance.post(`/plating-charges/`, payload);
