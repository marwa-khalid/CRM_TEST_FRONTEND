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

    const response = await axiosInstance.post(`/client-vehicles/import_client_vehicle/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

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