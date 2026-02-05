import axiosInstance from "../axiosConfig";

export const getCoverLevels = async () => {
    try {
      const response = await axiosInstance.get(`/setups/cover_levels`);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error;
    }
  };

  export const getPolicyTypes = async () => {
    try {
      const response = await axiosInstance.get(`/setups/policy_types`);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error;
    }
  };


  export const getClientInsurer = async (id: any) => {
    try{
        const response = await axiosInstance.get(`/insurer-brokers/${id}`)
        return response.data[0]
    } catch(e: any){
        throw e.response?.data || e;
    }
  }

export const updateClientInsurer = async (payload: any, id: any) => {
    try {
        const response = await axiosInstance.put(`/insurer-brokers/${id}`, payload);
        return response.data;
      } catch (error: any) {
        throw error.response?.data || error;
      } 
}

export const createClientInsurer = async (payload: any) => {
    try {
        const response = await axiosInstance.post(`/insurer-brokers/`, payload);
        return response.data;
      } catch (error: any) {
        throw error.response?.data || error;
      } 
}