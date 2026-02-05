import axiosInstance from "../axiosConfig";

export const getDriverDocumentAgreement = (claim_id: number | string) => {
  return axiosInstance.get(`/driver-documents/${claim_id}`);
};

export const updateDriverDocumentAgreement = async (data: any, id: number | string) => {
  const response = await axiosInstance.put(`/driver-documents/${id}`, data);
  return response.data;
};

export const createDriverDocumentAgreement = async (data: {
  // Driver Proofs Check List Section
  driver_licence_received_on: string | null;
  driver_licence_checks_completed_on: string | null;
  proof_of_address_1_received_on: string | null;
  proof_of_address_2_received_on: string | null;
  bank_statement_received_on_pre_hire: string | null;
  bank_statement_received_on_post_hire: string | null;
  taxi_badge_received_on: string | null;
  v5_received_on: string | null;
  mot_certificate_received_on: string | null;
  insurance_certificate_received_on: string | null;
  suspension_notice_received_on: string | null;
  suspension_uplift_received_on: string | null;
  
  // Agreements & Statements Check List Section
  signed_cha_received_on: string | null;
  signed_mitigation_received_on: string | null;
  arf_received_on: string | null;
  signed_cil_agreement_received_on: string | null;
  
  claim_id: number | string;
}) => {
  const response = await axiosInstance.post(`/driver-documents/`, data);
  return response.data;
};
