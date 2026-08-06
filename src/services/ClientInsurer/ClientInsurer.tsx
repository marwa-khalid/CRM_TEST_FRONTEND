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

// ── Client-insurer company master (Company Name autocomplete) ────────────────
// Separate lookup, mirroring the Referrer company search: type-ahead suggestions
// plus the ability to add a brand-new insurer company to the master list.
export const getInsurerCompanySuggestions = (query: string) => {
  return axiosInstance.get(`/insurer-companies/search/${encodeURIComponent(query)}`);
};

export const addInsurerCompany = (payload: {
  company_name: string;
  address?: string;
  postcode?: string;
}) => {
  return axiosInstance.post(`/insurer-companies/`, payload);
};

// OCR a Certificate of Motor Insurance (PDF/image) → fields to pre-fill the form.
export const extractInsurerCertificate = async (file: File) => {
  const formData = new FormData();
  formData.append("file", file);
  const response = await axiosInstance.post(`/insurer-brokers/certificate-ocr`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data as {
    company_name?: string;
    policy_holder?: string;
    policy_number?: string;
    reference?: string;
    address?: string;
    postcode?: string;
    policy_cover_level?: string;
    sdp?: boolean;
    private_hire?: boolean;
  };
};