import axiosInstance from "../../axiosConfig";

export interface Passenger {
  id?: number;
  gender: string;
  name: string;
  contact: string;
  injuries: string;
  statement: string;
  accident_detail?: number;
  is_active?: boolean;
  [key: string]: any;
}

export const getPassengers = async (accidentId?: number): Promise<Passenger[]> => {
  const url = accidentId 
    ? `/accident-details/passenger/?accident_detail=${accidentId}`
    : '/accident-details/passenger/';
  
  const response = await axiosInstance.get(url);
  return response.data;
};
export const getQuestionnaireStatus = async (
  claimId: number,
  witnessId: number,
) => {
  try {
    const response = await axiosInstance.get(
      `/email/questionnaire-status/${claimId}/${witnessId}`,
    );
    return response.data;
  } catch (error) {
    console.error("Failed to fetch questionnaire status", error);
    return null;
  }
};
export const getPassengerById = async (id: number): Promise<Passenger> => {
  const response = await axiosInstance.get(`/accident-details/passenger/${id}`);
  return response.data;
};

export const getPassengerByPassengerId = async (id: number): Promise<Passenger> => {
  const response = await axiosInstance.get(`/accident-details/passenger/by-id/${id}`);
  return response.data;
};

export const createPassenger = async (data: any): Promise<any> => {
  const response = await axiosInstance.post('/accident-details/passenger/', data);
  return response.data;
};

export const updatePassenger = async (id: number, data: Partial<Passenger>): Promise<Passenger> => {
  const response = await axiosInstance.put(`/accident-details/update-passenger/${id}`, data);
  return response.data;
};

export const deletePassenger = async (id: number): Promise<void> => {
  await axiosInstance.patch(`/accident-details/deactive-passenger/${id}`);
};

// Police Detail Interfaces and API calls
export interface PoliceDetail {
  id?: number;
  officer_name: string;
  badge_number: string;
  station: string;
  report_number: string;
  details: string;
  accident_detail?: number;
  is_active?: boolean;
  [key: string]: any;
}

export const getPoliceDetails = async (accidentId?: number): Promise<PoliceDetail[]> => {
  const url = accidentId 
    ? `/accident-details/police-detail/${accidentId}`
    : `/accident-details/police-detail/${accidentId}`;
  
  const response = await axiosInstance.get(url);
  return response.data;
};

export const getPoliceDetailById = async (id: number): Promise<PoliceDetail> => {
  const response = await axiosInstance.get(`/accident-details/police-detail/by_id/${id}`);
  return response.data;
};

export const createPoliceDetail = async (data: any): Promise<any> => {
  const response = await axiosInstance.post('/accident-details/police-detail/', data);
  return response.data;
};

export const updatePoliceDetail = async (id: number, data: Partial<PoliceDetail>): Promise<PoliceDetail> => {
  const response = await axiosInstance.put(`/accident-details/update-police/${id}`, data);
  return response.data;
};

export const deletePoliceDetail = async (id: number): Promise<void> => {
  await axiosInstance.patch(`/accident-details/deactive-police/${id}`);
};

// Witness Interfaces and API calls
export interface Witness {
  id?: number;
  name: string;
  contact: string;
  statement: string;
  accident_detail?: number;
  is_active?: boolean;
  [key: string]: any;
}

export const getWitnesses = async (accidentId?: number): Promise<Witness[]> => {
  const url = accidentId 
    ? `/accident-details/witness-detail/${accidentId}`
    : '/accident-details/witness-detail/';
  
  const response = await axiosInstance.get(url);
  return response.data;
};

export const getWitnessById = async (id: number): Promise<Witness> => {
  const response = await axiosInstance.get(`/accident-details/witness/${id}`);
  return response.data;
};

export const createWitness = async (data: any): Promise<any> => {
  const response = await axiosInstance.post('/accident-details/witness/', data);
  return response.data;
};

export const updateWitness = async (id: number, data: Partial<Witness>): Promise<Witness> => {
  const response = await axiosInstance.put(`/accident-details/update-witness/${id}`, data);
  return response.data;
};

export const deleteWitness = async (id: number): Promise<void> => {
  await axiosInstance.patch(`/accident-details/deactive-witness/${id}`);
};

export const sendEmail = async (email: any, claimID: any, firstName: any, referrence_no: any, option: any) => {
  console.log(option)
    console.log(email)
      console.log(referrence_no);
  const data = {
    witness_email: email,
    witness_name: firstName,
    reference: referrence_no,
    option: option.id
  }
  const response = await axiosInstance.post(`/witnesses/send-witness-email/${claimID}`, data);
  return response.data;
}

export const formSubmitquestionaire = async (data:any, jwt:any) => {
  const response = await axiosInstance.post(`/witnesses/save?token=${jwt}`, data);
  return response.data;
}

export const getQuestionnaireFromId = async (id: any) => {
  const response = await axiosInstance.get(`/witnesses/get/${id}`);
  return response.data;
}