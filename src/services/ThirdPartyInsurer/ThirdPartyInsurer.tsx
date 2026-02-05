import axiosInstance from "../axiosConfig";

export const getThirdPartyInsurer = (claimId: number | string) => {
  return axiosInstance.get(`/third-party-insurer/${claimId}`);
};

export const updateThirdPartyInsurer = async (data: any, claimId: number | string) => {
  const response = await axiosInstance.put(`/third-party-insurer/${claimId}`, data);
  return response.data
};

export const createThirdPartyInsurer = async (data:any) => {
  const response = await axiosInstance.post(`/third-party-insurer/`, data);
  return response.data
};





