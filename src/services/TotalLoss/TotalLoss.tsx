import axiosInstance from "../axiosConfig";


export const fetchCategories = async () => {
    const response = await axiosInstance.get(`setups/salvage_categories?include_inactive=false`);
    return response.data;
  };

  export const fetchRetaining = async () => {
    const response = await axiosInstance.get(`setups/retaining_salvages?include_inactive=false`);
    return response.data;
  };


  export const fetchAgrees = async () => {
    const response = await axiosInstance.get(`setups/pav_agrees?include_inactive=false`);
    return response.data;
  };

  export const fetchKeeping = async () => {
    const response = await axiosInstance.get(`setups/keeping_salvages?include_inactive=false`);
    return response.data;
  };

  export const createTotalLoss = async (claim_id: any, payload: any) => {
    const response = await axiosInstance.post(`total-loss/`, payload)
    return response?.data
  }

  export const updateTotalLoss = async (claim_id: any, payload: any) => {
    const response = await axiosInstance.put(`total-loss/${claim_id}`, payload)
    return response?.data
  }

  export const getTotalLoss = async (claim_id: any) => {
    const response = await axiosInstance.get(`total-loss/${claim_id}`)
    return response.data
  }

  // TotalLoss.ts

export const sendPAVToClient = (claimId: number, to_email?: string) =>
  axiosInstance.post(`/total-loss/send-pav-client/${claimId}`, {
    to_email,
  });

export const sendTotalLossEngReportToTPI = (
  claimId: number,
  to_email?: string,
) =>
  axiosInstance.post(`/total-loss/send-eng-report-tpi/${claimId}`, {
    to_email: to_email ?? null,
  });

export const instructFleetOffHireFromTotalLoss = (
  claimId: number,
  to_email?: string,
) =>
  axiosInstance.post(`/total-loss/instruct-fleet-off-hire/${claimId}`, {
    to_email,
  });