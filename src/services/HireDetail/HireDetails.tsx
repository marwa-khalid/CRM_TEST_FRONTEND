import axiosInstance from "../axiosConfig";

export const getClientVehicleCategory = () => {
  return axiosInstance.get(`/setups/client_vehicle_categories`);
};

export const getActualVehicleCategory = () => {
  return axiosInstance.get(`/setups/actual_vehicle_categories`);
};

export const getAdminFeeType = () => {
  return axiosInstance.get(`/setups/admin_fee_types`);
};

export const updateClientVehicleCategory = (data: any, id: string) => {
  return axiosInstance.put(`/client-vehicle-categories/${id}`, data);
};

export const createClientVehicleCategory = (data: any) => {
  return axiosInstance.post(`/client-vehicle-categories/`, data);
};

export const createHireDetails = (data: any) => {
  return axiosInstance.post(`/hire-details/bulk`, data);
}

export const updateHireDetails = (data: any, id: any) => {
  return axiosInstance.put(`/hire-details/${id}`, data);
}


export const getHireDetails = (id: any) => {
  return axiosInstance.get(`/hire-details/${id}`);
}

export const fetchVehicleExtraData = (id: any) => {
  return axiosInstance.get(`/hire-details/hire-vehicle-provided/${id}`)
}