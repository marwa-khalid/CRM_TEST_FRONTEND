import axiosInstance from "../axiosConfig";

export const getReferrer = (claim_id: number | string) => {
  return axiosInstance.get(`/referrers/${claim_id}`);
};

export const updateReferrer = (data: any, id: number | string) => {
  return axiosInstance.put(`/referrers/${id}`, data);
};

export const deleteReferrer = (company_name: string) => {
  return axiosInstance.delete(`/referrers/${company_name}`);
};

export const createReferrer = (data: { 
  company_name: string; 
  address: string; 
  postcode: string; 
  contact_name: string;
  contact_number: string;
  contact_email: string;
  solicitor: string; 
  third_party_capture: string; 
}) => {
  return axiosInstance.post(`/referrers/`, data);
};

export const searchReferrers = (query: string) => {
  return axiosInstance.get(`/referrers/search/${query}`);
};


export const getAllReferrerCommissions = () => {
  return axiosInstance.get(`/referrer-commissions`);
};

export const addReferrerCommission = (data: { 
  referrer_id: number;
  on_hire_amount: number; 
  on_hire_paid_on: string; 
  off_hire_amount: number; 
  off_hire_paid_on: string; 
}) => {
  return axiosInstance.post(`/referrer-commissions`, data);
};

export const getReferrerCommission = (commission_id: number) => {
  return axiosInstance.get(`/referrer-commissions/${commission_id}`);
};

// Update Referrer Commission
export const updateReferrerCommission = (commission_id: number, data: { 
  referrer_id: number;
  on_hire_amount: number; 
  on_hire_paid_on: string; 
  off_hire_amount: number; 
  off_hire_paid_on: string; 
}) => {
  return axiosInstance.put(`/referrer-commissions/${commission_id}`, data);
};

// Delete Referrer Commission
export const deleteReferrerCommission = (commission_id: number) => {
  return axiosInstance.delete(`/referrer-commissions/${commission_id}`);
};

// ---------------- Driver Commissions ----------------

// Get All Driver Commissions
export const getAllDriverCommissions = () => {
  return axiosInstance.get(`/driver-commissions`);
};

// Add Driver Commission
export const addDriverCommission = (data: { 
  claim_id: number;
  on_hire_amount: number; 
  on_hire_paid_on: string; 
  congestion_charges: number;
  other_charges: number;
  off_hire_amount: number; 
  off_hire_paid_on: string; 
}) => {
  return axiosInstance.post(`/driver-commissions`, data);
};

// Get Driver Commission by ID
export const getDriverCommission = (commission_id: number) => {
  return axiosInstance.get(`/driver-commissions/${commission_id}`);
};

// Update Driver Commission
export const updateDriverCommission = (commission_id: number, data: { 
  claim_id: number;
  on_hire_amount: number; 
  on_hire_paid_on: string; 
  congestion_charges: number;
  other_charges: number;
  off_hire_amount: number; 
  off_hire_paid_on: string; 
}) => {
  return axiosInstance.put(`/driver-commissions/${commission_id}`, data);
};

// Delete Driver Commission
export const deleteDriverCommission = (commission_id: number) => {
  return axiosInstance.delete(`/driver-commissions/${commission_id}`);
};

export const getCompanySuggestions = (query: string) => {
  return axiosInstance.get(`/referrers/search/${query}`);
};