import axiosInstance from "../axiosConfig";

export const getDriverDocumentAgreement = (claim_id: number | string) => {
  return axiosInstance.get(`/driver-documents/${claim_id}`);
};

export const updateDriverDocumentAgreement = async (
  data: any,
  id: number | string,
) => {
  const response = await axiosInstance.put(`/driver-documents/${id}`, data);
  return response.data;
};

export const createDriverDocumentAgreement = async (data: any) => {
  const response = await axiosInstance.post(`/driver-documents/`, data);
  return response.data;
};

export const uploadDriverDocumentAgreementFile = async (
  claimId: number | string,
  fieldName: string,
  file: File,
) => {
  const formData = new FormData();
  formData.append("field_name", fieldName);
  formData.append("file", file);

  const response = await axiosInstance.post(
    `/driver-documents/${claimId}/upload`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  );

  return response.data;
};
