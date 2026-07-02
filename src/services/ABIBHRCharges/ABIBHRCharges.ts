import axiosInstance from "../axiosConfig";

export const getABIBHRCharges = (claimId: any) =>
  axiosInstance.get(`/abi-bhr-charges/${claimId}`);

export const saveABIBHRCharges = (payload: any) =>
  axiosInstance.post(`/abi-bhr-charges/`, payload);

export const generatePaymentPack = (claimId: string | number) =>
  axiosInstance.post(`/abi-bhr-charges/payment-pack/${claimId}`, null, {
    responseType: "blob",
  });

export const sendPaymentPackEmail = (
  claimId: string | number,
  payload: FormData,
) =>
  axiosInstance.post(
    `/abi-bhr-charges/payment-pack/${claimId}/send-email`,
    payload,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  );
