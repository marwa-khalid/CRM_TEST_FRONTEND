

import axiosInstance from "../axiosConfig";

export const costRepairApi = {
  createVehicleRepair: async (payload:any) => {
    try {
      const response = await axiosInstance.post("/route-repairs/", payload);
      return response.data;
    } catch (error) {
      console.error("Error creating vehicle repair:", error);
      throw error;
    }
  },
};


export const updateCostRepair = async ( id: number , payload: any,) => {

    try {
      const response = await axiosInstance.put(`/route-repairs/${id}`, payload);
      return response.data;
    } catch (error) {
      console.error("Error creating vehicle owner:", error);
      throw error;
    }
}


export const getRepairData = async (id: any) => {
  const response = await axiosInstance.get(`route-repairs/${id}`);
  return response.data;
};


export const sendCILAgreementClient = (id: any) => {
  return axiosInstance.get(`/clients/download-send-cil-to-client/${id}`, {
    responseType: "arraybuffer",
  })
} 


export const sendCILAgreement = (claimId: number, to_email?: string) =>
  axiosInstance.post(`/route-repairs/send-cil-agreement/${claimId}`, {
    to_email,
  });

export const sendCILToClient = (claimId: number, to_email?: string) =>
  axiosInstance.post(`/route-repairs/send-cil-client/${claimId}`, {
    to_email,
  });

export const sendEngReportToTPI = (claimId: number, to_email: string) =>
  axiosInstance.post(`/route-repairs/send-eng-report-tpi/${claimId}`, {
    to_email,
  });

export const instructFleetOffHireFromRepair = (
  claimId: number,
  to_email?: string,
) =>
  axiosInstance.post(`/route-repairs/instruct-fleet-off-hire/${claimId}`, {
    to_email,
  });