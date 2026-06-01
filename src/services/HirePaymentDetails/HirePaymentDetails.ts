import axiosInstance from "../axiosConfig";

export const getHirePaymentDetails = (claimId: any) =>
  axiosInstance.get(`/hire-payment-details/${claimId}`);

export const saveHirePaymentDetails = (payload: any) =>
  axiosInstance.post(`/hire-payment-details/`, payload);
