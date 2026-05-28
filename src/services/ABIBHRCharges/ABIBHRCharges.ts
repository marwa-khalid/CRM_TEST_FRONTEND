import axiosInstance from "../axiosConfig";

export const getABIBHRCharges = (claimId: any) =>
  axiosInstance.get(`/abi-bhr-charges/${claimId}`);

export const saveABIBHRCharges = (payload: any) =>
  axiosInstance.post(`/abi-bhr-charges/`, payload);
