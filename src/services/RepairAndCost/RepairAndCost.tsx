

import axiosInstance from "../axiosConfig";

export const costRepairApi = {
  createVehicleRepair: async (payload: {
    labour: number;
    paintMaterials: number;
    parts: number;
    specialistCost: number;
    jobHire: number;
    subTotal: number;
    vat: number;
    totalIncVat: number;
    cilTotalReceived: number;
    actualRepairParts: number;
    actualRepairLabour: number;
    netCilAmount: number;
    cilAgreed: boolean;
    roadworthyCilFeeAgreed: boolean;
    agreementReceived: string | null;
    engRepSentToTPI: string | null;
    cilChequeReceived: string | null;
    cilChequeSentToCL: string | null;
    cilRemovalConfirmationRec: string | null;
    vehiclePaymentBeneficiary: string;
    repairInst: string | null;
    repairAuth: string | null;
    estimationReceived: string | null;
    repairStart: string | null;
    repairCompleted: string | null;
  }) => {
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

export const sendCILAgreement = (id: any) => {
  return axiosInstance.get(`/clients/download-cil-agreement-letter/${id}`, {
    responseType: "arraybuffer",
  })
} 

export const sendCILAgreementClient = (id: any) => {
  return axiosInstance.get(`/clients/download-send-cil-to-client/${id}`, {
    responseType: "arraybuffer",
  })
} 
