import axiosInstance from "../axiosConfig";

export const getDirectHirePayment = (claimId: any) =>
  axiosInstance.get(`/direct-hire-payment/${claimId}`);

export const saveDirectHirePayment = (payload: any) =>
  axiosInstance.post(`/direct-hire-payment/`, payload);
