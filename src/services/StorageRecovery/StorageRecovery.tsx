import axiosInstance from "../axiosConfig";

// Address interface
interface Address {
  address: string;
  postcode: string;
  mobile_tel: string;
  email: string;
}

// Storage interface
interface Storage {
  storage_provider: string;
  name: string;
  claim_id: number;
  start_date: string; // ISO date string
  end_date: string;   // ISO date string
  total_storage_days: number;
  currency: string;   // e.g., "GBP"
  charge_per_day: number;
  total_storage_charges: number;
  address: Address;
}

// Recovery interface
interface Recovery {
  recovery_provider: string;
  name: string;
  claim_id: number;
  date_of_recovery: string; // ISO date string
  currency: string;         // e.g., "GBP"
  recovery_charges: number;
  address: Address;
}

// Root interface
export interface ClaimData {
  storages: Storage[];
  recoveries: Recovery[];
}


export const getStorageRecoveryProvider =async (claimId: number | string) => {
  const response = await axiosInstance.get(`/storage-recovery/${claimId}`);
  return response;
};

export const getStorageProvider = (query: number | string) => {
  return axiosInstance.get(`/storage-recovery/search-storage/${query}`);
};

export const getRecoveryProvider = (query: number | string) => {
  return axiosInstance.get(`/storage-recovery/search-recovery/${query}`);
};

export const updateStorageRecovery = async (data: any, claimId: number | string) => {
  const response = await axiosInstance.put(`/storage-recovery/${claimId}`, data);
  return response.data
};

export const createStorageRecovery = async (data:ClaimData) => {
  const response = await axiosInstance.post(`/storage-recovery/`, data);
  return response.data
};





