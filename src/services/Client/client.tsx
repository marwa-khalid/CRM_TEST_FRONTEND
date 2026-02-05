import axiosInstance from "../axiosConfig";


export const getClients = async (params: any) => {
  try {
    const response = await axiosInstance.get('/clients/', {
      params: {
        page: params.page || 1,
        limit: params.limit || 10,
        search: params.search || '',
        status: params.status || 'active',
        sortBy: params.sortBy || 'createdAt',
        sortOrder: params.sortOrder || 'desc',
        ...params
      }
    });
    return response.data;
  } catch (error: any) {
    throw error.response?.data || error;
  }
};

// Get single client by ID
export const getClient = async (clientId: any) => {
  try {
    const response = await axiosInstance.get(`/clients/${clientId}`);
    return response.data;
  } catch (error: any) {
    throw error.response?.data || error;
  }
};

export const getClientByClaimID = async (claim_id: string | number) => {
  try {
    const response = await axiosInstance.get(`/clients/claim/${claim_id}`);
    return response.data;
  } catch (error: any) {
    throw error.response?.data || error;
  }
};

// Create new client
export const createClient = async (clientData: any) => {
  try {
    const response = await axiosInstance.post('/clients/', clientData);
    return response.data;
  } catch (error: any) {
    throw error.response?.data || error;
  }
};

// Update existing client
export const updateClient = async (clientId: string | number, clientData: any) => {
  try {
    const response = await axiosInstance.put(`/clients/${clientId}`, clientData);
    return response.data;
  } catch (error: any) {
    throw error.response?.data || error;
  }
};

// Deactivate client (soft delete)
export const deactivateClient = async (clientId : any) => {
  try {
    const response = await axiosInstance.delete(`/clients/${clientId}`);
    return response.data;
  } catch (error: any) {
    throw error.response?.data || error;
  }
};

// Reactivate client (if supported by backend)
export const reactivateClient = async (clientId: any) => {
  try {
    const response = await axiosInstance.patch(`/clients/${clientId}/reactivate`);
    return response.data;
  } catch (error: any) {
    throw error.response?.data || error;
  }
};

// Search clients
export const searchClients = async (searchTerm: any, params = {}) => {
  try {
    const response = await axiosInstance.get('/clients/', {
      params: {
        search: searchTerm,
        ...params
      }
    });
    return response.data;
  } catch (error: any) {
    throw error.response?.data || error;
  }
};

// Get client statistics
export const getClientStats = async () => {
  try {
    const response = await axiosInstance.get('/clients/stats');
    return response.data;
  } catch (error: any) {
    throw error.response?.data || error;
  }
};

// Export clients data
export const exportClients = async (format = 'csv', params = {}) => {
  try {
    const response = await axiosInstance.get('/clients/export', {
      params: {
        format,
        ...params
      },
      responseType: 'blob'
    });
    return response.data;
  } catch (error: any) {
    throw error.response?.data || error;
  }
};

// Client types and constants
export const CLIENT_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  PENDING: 'pending'
};

export const CLIENT_TYPES = {
  INDIVIDUAL: 'individual',
  BUSINESS: 'business',
  ORGANIZATION: 'organization'
};

export const getLanguages = async () => {
  try {
    const response = await axiosInstance.get(`/setups/languages`);
    return response.data;
  } catch (error: any) {
    throw error.response?.data || error;
  }
};


export const vulnerablePersonPolicy = (id: any) => {
  return axiosInstance.get(`/clients/download-vulnerable-persons-policy-doc/${id}`, {
    responseType: "arraybuffer",
  })
}

export const notifyManager = (id: any) => {
  return axiosInstance.get(`/clients/preview-vulnerable-notify?claim_id=${id}`)
}