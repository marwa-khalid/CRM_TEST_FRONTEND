// src/services/Accidents/accidents.ts
import axiosInstance from "../axiosConfig";

export interface AccidentDetail {
  id?: number;
  location: string;
  description?: string;
  is_active?: boolean;
  [key: string]: any;
}

export const createAccidentDetail = async (data: AccidentDetail) => {
  const response = await axiosInstance.post("/accident-details/", data);
  return response.data;
};

export const getAccidentDetails = async () => {
  const response = await axiosInstance.get("/accident-details/");
  return response.data;
};

export const getAccidentDetailById = async (id: number) => {
  try{
    const response = await axiosInstance.get(`/accident-details/accident/${id}`);
    return response.data;
  } catch(e: any){
    throw e.response?.data || e;
  }
};

export const updateAccidentDetail = async (id: number | string, data: AccidentDetail) => {
  const response = await axiosInstance.put(`/accident-details/${id}`, data);
  return response.data;
};

export const deactivateAccidentDetail = async (id: number) => {
  const response = await axiosInstance.patch(`/accident-details/${id}`, {
    is_active: false,
  });
  return response.data;
};