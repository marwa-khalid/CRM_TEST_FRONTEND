import axiosInstance from "../axiosConfig";

export const getPanelSolicitorDetails = (claim_id: number | string) => {
  return axiosInstance.get(`/panel-solicitors/${claim_id}`);
};

export const updatePanelSolicitors = async (data: any, id: number | string, key: string) => {
  if(key === 'send_email'){
    const response = await axiosInstance.put(`/panel-solicitors/${id}?send_email=true&send_acceptance_email=false`, data);
    return response.data
  } else if(key === 'send_acceptance_email'){
    const response = await axiosInstance.put(`/panel-solicitors/${id}?send_email=false&send_acceptance_email=true`, data);
    return response.data
  } else{
    const response = await axiosInstance.put(`/panel-solicitors/${id}`, data);
    return response.data
  }
};

export const createPanelSolicitors = async (data:{
  company_name: string;
  reference: string;
  recommendation_sent: string;
  note: string;
  claim_id: number;
  email_sent_date: string;
  accepted_sent_date: string;
  address: {
    address: string;
    postcode: string;
    mobile_tel: string;
    email: string;
  };
}, key: string) => {
  if(key === 'send_email'){
    const response = await axiosInstance.post(`/panel-solicitors/?send_email=true&send_acceptance_email=false`, data);
    return response.data
  } else if(key === 'send_acceptance_email'){
    const response = await axiosInstance.post(`/panel-solicitors/?send_email=false&send_acceptance_email=true`, data);
    return response.data
  } else{
    const response = await axiosInstance.post(`/panel-solicitors/`, data);
    return response.data
  }
 
};

export const sendEmailToPanelSolicitor = (data: any, claimId: number | string) => {
  return axiosInstance.post(`/panel-solicitors/send-email/${claimId}`, data);
};

export const sendAcceptanceEmailToPanelSolicitor = (data: any, claimId: number | string) => {
  return axiosInstance.post(`/panel-solicitors/send-acceptance-email/${claimId}`, data);
};