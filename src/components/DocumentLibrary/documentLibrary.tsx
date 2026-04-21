import axiosInstance from "../../../src/services/axiosConfig";

export const getDocumentLibrary = async (claimId: number | string) => {
  const response = await axiosInstance.get(
    `/document-library/claim/${claimId}`,
  );
  return response.data;
};

export const getDocumentDetail = async (documentId: number | string) => {
  const response = await axiosInstance.get(`/document-library/${documentId}`);
  return response.data;
};

export const uploadLibraryDocument = async (formData: FormData) => {
  const response = await axiosInstance.post(
    `/document-library/upload`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  );
  return response.data;
};

export const createDocumentShareLink = async (
  documentId: number | string,
  expiresInSeconds: number = 3600,
) => {
  const formData = new FormData();
  formData.append("expires_in_seconds", String(expiresInSeconds));

  const response = await axiosInstance.post(
    `/document-library/${documentId}/share-link`,
    formData,
  );
  return response.data;
};

export const registerDocumentPreview = async (documentId: number | string) => {
  return axiosInstance.post(`/document-library/${documentId}/preview`);
};

export const registerDocumentDownload = async (documentId: number | string) => {
  return axiosInstance.post(`/document-library/${documentId}/download`);
};
