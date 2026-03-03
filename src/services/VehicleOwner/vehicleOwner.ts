import axiosInstance from "../axiosConfig";

export const VehicleOwnersApi = {
  createVehicleOwner: async (payload: {
    gender: string;
    first_name: string;
    surname: string;
    payment_benificiary: string;
    claim_id: number;
    tenant_id: number;
    address: {
      address: string;
      postcode: string;
      home_tel: string;
      mobile_tel: string;
      email: string;
    };
  }) => {
    try {
      const response = await axiosInstance.post("/vehicle-owners/", payload);
      return response.data;
    } catch (error) {
      console.error("Error creating vehicle owner:", error);
      throw error;
    }
  },
};


export const uploadVCDocs = async (files: File[], id: any) => {
  try {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });

    const response = await axiosInstance.post(
      `/vehicle-owners/import-vehicle-owner/?claim_id=${id}`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        timeout: 300000,
      },
    );

    return response.data;
  } catch (error) {
    console.error("Error uploading documents:", error);
    throw error;
  }
};


export const getVehicleOwner = async (id: any) => {
  const response = await axiosInstance.get(`vehicle-owners/${id}`);
  return response.data;
};


export const updateVehicleOwner = async (payload: any, id: any) => {

    try {
      const response = await axiosInstance.put(`/vehicle-owners/${id}`, payload);
      return response.data;
    } catch (error) {
      console.error("Error creating vehicle owner:", error);
      throw error;
    }
}