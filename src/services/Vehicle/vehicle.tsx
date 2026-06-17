import axiosInstance from "../axiosConfig";


export const createVehicleDetail = async (data: any) => {
    const response = await axiosInstance.post("/client-vehicles/", data);
    return response.data;
  };

export const uploadVCDoc = async (files: File[], id: any) => {
  try {
    const formData = new FormData();
    
    files.forEach((file) => {
      formData.append('files', file);
    });

    const response = await axiosInstance.post(
      `/client-vehicles/import_client_vehicle/?claim_id=${id}`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );

    return response.data;
  } catch (error) {
    console.error("Error uploading documents:", error);
    throw error;
  }
};



  

export const getVehicleDetail = async (id: any) => {
  const response = await axiosInstance.get(`client-vehicles/${id}`);
  return response.data;
};

// Client vehicles for a claim — the claimant's own vehicles from the Vehicle
// Details screen. Returns [] on failure.
export const getClaimVehicles = async (claimId: any) => {
  try {
    const response = await axiosInstance.get(`/client-vehicles/claim/${claimId}`);
    return Array.isArray(response.data) ? response.data : [];
  } catch {
    return [];
  }
};

// Hire (provided) vehicles for a claim — from the Hire Details screen. This is
// the source for the payment-screen vehicle switcher cards (kept separate from
// the client vehicles above). Mapped to a common { id, registration } shape.
export const getHireProvidedVehicles = async (claimId: any) => {
  try {
    const response = await axiosInstance.get(`/hire-vehicle-provided/${claimId}`);
    const list = Array.isArray(response.data) ? response.data : [];
    return list.map((v: any) => ({
      id: v.id,
      registration: v.hire_vehicle_registration ?? null,
      make: v.make ?? null,
      model: v.model ?? null,
    }));
  } catch {
    return [];
  }
};


export const updateVehicle = async (data: any, id: any) => {
  const response = await axiosInstance.put(`/client-vehicles/${id}`, data);
  return response.data;
};

export const checkStatusJob = async (jobId: any) => {
  const response = await axiosInstance.get(`/import-jobs/${jobId}/status`);
  return response.data;
};


export const fetchJobResultCall = async (jobId: any) => {
  const response = await axiosInstance.get(`/import-jobs/${jobId}/result`);
  return response.data;
};