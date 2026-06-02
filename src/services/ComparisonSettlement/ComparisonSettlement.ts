import axiosInstance from "../axiosConfig";

export const getComparisonSettlement = (claimId: any) =>
  axiosInstance.get(`/comparison-settlement/${claimId}`);

export const saveComparisonSettlement = (payload: any) =>
  axiosInstance.post(`/comparison-settlement/`, payload);

export const sendComparisonDifferenceEmail = (payload: any) =>
  axiosInstance.post(`/comparison-settlement/send-difference-email`, payload);
