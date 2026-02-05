import axiosInstance from "../axiosConfig";

export const updateVehicleDamage = async (data: any) => {
  try {
    const response = await axiosInstance.put(`/client-vehicles/damage-update`, data);
    return response.data;
  } catch (error: any) {
    throw error;
  }
};

export const aiAnalyze = async (formData: FormData): Promise<any> => {
  try {

    const response = await axiosInstance.post(
      "/car-damage-detection/detect?include_summary=true&include_annotated_image=true",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    return response.data;
  } catch (error: any) {
    console.error("AI Analyze Error:", error);
    throw error;
  }
};


export const aiAnalyzeSingle = async (formData: FormData, type: string): Promise<any> => {
  try {

    if(type === 'payload'){
      const response = await axiosInstance.post("/car-damage-detection/get-image-report", formData)
      return response.data;
    } else{
      const response = await axiosInstance.post(
        "/car-damage-detection/get-image-report",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
  
      return response.data;
    }
  } catch (error: any) {
    console.error("AI Analyze Error:", error);
    throw error;
  }
};



export const generateClientReport = async (claim_id: any, type:any, version: any) => {
  try {
    const response = await axiosInstance.get(`/damage-reports/versions/${claim_id}/${type}/${version}`);
    return response.data;
  } catch (error: any) {
    console.error("Generate Report Error:", error);
    throw error;
  }
}

export const generateThirdPartyReport = async (claim_id: any, type:any, version: any) => {
  try {
    const response = await axiosInstance.get(`/damage-reports/versions/${claim_id}/${type}/${version}`);
    return response.data;
  } catch (error: any) {
    console.error("Generate Report Error:", error);
    throw error;
  }
}

export const getReportList = async (claim_id: any, type: any) => {
  try {
    const response = await axiosInstance.get(`/damage-reports/versions/history/${claim_id}/${type}`);
    return response.data;
  } catch (error: any) {
    console.error("Generate Report Error:", error);
    throw error;
  }
}


export const saveDamageDetails = async (payload: any): Promise<any> => {
    const response = await axiosInstance.post("/client-vehicles/damage/ai", payload
      // {
      //   headers: {
      //     "Content-Type": "multipart/form-data",
      //   },
      // }
    );

    return response.data;
};

export const sendEmailReport = async (claim_id: any, data: any) => {
  try{
    const res = await axiosInstance.post(`/client-vehicles/damage-report/${claim_id}/send-email`, data)
    return res.data
  } catch(e){
    throw e;
  }
}