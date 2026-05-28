import axiosInstance from "../axiosConfig";

export const getHireVehicleStatus = () => axiosInstance.get(`/setups/hire_vehicle_statuses`);

export const sendEmailOnHire = (email: string, claimID: string, firstName: string, referrence_no: string, option: string) => axiosInstance.post(`/hire-vehicle-provided/send-email-on-hire`, { email, claimID, firstName, referrence_no, option });

export const createHireProvided = async (id: any, payload: any, switchVehicle: boolean) => {
    return axiosInstance.post(`/hire-vehicle-provided/?switch_vehicle=${switchVehicle}`, payload)
}

export const updateHireProvided = async (id: any, payload: any, switchVehicle: boolean) => {
    return axiosInstance.put(`/hire-vehicle-provided/${id}?switch_vehicle=${switchVehicle}`, payload)
}

export const getHireProvided = async (id: any) => {
    return axiosInstance.get(`/hire-vehicle-provided/${id}`)
}

export const getTableData = async (id: any) => {
    return axiosInstance.get(`/hire-vehicle-provided/section-b/${id}`)
}

export const sendVehicleCheckSheet = async (id: any) => {
    return axiosInstance.post(`/hire-vehicle-provided/send-vehicle-check-sheet/${id}`)
}

export const sendEmails = async (id: any, type: string) => {
    if (!id) throw new Error("Claim ID is required");
  
    const types = [
      "on_hire",
      "off_hire",
      "vehicle_check_sheet",
      "storage_recovery",
      "mitigation_questionnaire",
      "hire_documentation_agreement",
      "send_fee_exemption_form",
    ];
  
    if (!types.includes(type)) {
      throw new Error(`Unsupported email type: ${type}`);
    }
  
    // Build query params: only the requested type is true, all others false
    const params = types.reduce((acc, t) => {
      acc[t] = t === type;
      return acc;
    }, {} as Record<string, boolean>);
  
    return axiosInstance.get(
      `/hire-vehicle-provided/claim-summary/${id}`,
      { params }
    );
  };

  export const downloadFeeExemption = (id: any) => {
    return axiosInstance.get(`hire-vehicle-provided/download-fee-exemption-form/${id}`, {
      responseType: 'blob',
    });
  };
  
  export const downloadCheckSheet = (id: any) => {
    return axiosInstance.get(
      `/hire-vehicle-provided/download-vehicle-check-sheet/${id}`,
      {
        responseType: "arraybuffer",
      }
    );
  };
  
  export const downloadStorageRecovery = (id: any) => {
    return axiosInstance.get(
      `/hire-vehicle-provided/download-storage-recovery/${id}`,
      {
        responseType: "arraybuffer",
      }
    );
  };

  export const downloadMitigationQuestionnaire = (id: any) => {
    return axiosInstance.get(
      `/hire-vehicle-provided/download-mitigation-questionnaire/${id}`,
      {
        responseType: "arraybuffer",
      }
    );
  };

  export const downloadHireDocumentationAgreement = (id: any) => {
    return axiosInstance.get(
      `/hire-vehicle-provided/download-hire-documentation-agreement/${id}`,
      {
        responseType: "arraybuffer",
      }
    );
  };
  
  

export const sendStorageRecovery = async (id: any) => {
    return axiosInstance.post(`/hire-vehicle-provided/send-storage-recovery/${id}`)
}

export const sendHireDocumentationAgreement = async (id: any) => {
    return axiosInstance.post(`/hire-vehicle-provided/send-hire-documentation-agreement/${id}`)
}

export const sendFeeExemption = async (id: any) => {
    return axiosInstance.post(`/hire-vehicle-provided/send-fee-exemption-email?claim_id=${id}`)
}

export const sendMigrationQuestionnaire = async (id: any) => {
    return axiosInstance.post(`/hire-vehicle-provided/send-mitigation-questionnaire/${id}`)
}

export const saveDriverCheckout = async (formData: FormData) => {
    try {
    
        const response = await axiosInstance.post(
          `/driver-checks/single`,
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );
    
        return response.data;
      } catch (error: any) {
        console.error("❌ Error updating driver checkout:", error);
        throw error?.response?.data || error;
      }
}

export const getCheckoutDetails = async (id: any) => {
    return axiosInstance.get(`/driver-checks/claim/${id}`)
}


export const updateDriverCheckout = async (id: number | string, formData: FormData) => {

  try {
 const response = await axiosInstance.put(
      `/driver-checks/update-by-hire-vehicle-image`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    return response.data;
   
  } catch (error: any) {
    console.error("❌ Error updating driver checkout:", error);
    throw error?.response?.data || error;
  }
};

  

export const getVehicleCharge = async (id: any) => {
    return axiosInstance.get(``)
}

export const getDriverChargesByVehicle = async (id: any) => {
    return axiosInstance.get(`/driver-checks/hire-vehicle/${id}`)
}

export const updateDriverChargesByVehicle = async (id: any, payload: any) => {
    return axiosInstance.put(`/driver-checks/hire-vehicle/${id}`, payload)
}

export const deactivateVehicle = async (vehicleId: number | string) => {
  return axiosInstance.put(`/driver-checks/deactivate/${vehicleId}`);
};

export const updateAllDriverChecksForClaim = async (claimId: any, payload: any) => {
  return axiosInstance.put(`/driver-checks/claim/${claimId}/bulk`, payload);
};

export const getHireRecords = async (claimId: any) => {
  return axiosInstance.get(`/hire-records/${claimId}`);
};

export const saveHireRecords = async (payload: any) => {
  return axiosInstance.post(`/hire-records/`, payload);
};

export const saveCheckoutJson = async (payload: any) => {
  return axiosInstance.post(`/driver-checks/save-checkout`, payload);
};

export const sendCheckoutEmail = async (claimId: any, hvpId: any) => {
  return axiosInstance.post(`/driver-checks/hire-vehicle/${hvpId}/checkout-email`, null, {
    params: { claim_id: claimId },
  });
};