import axiosInstance from "../axiosConfig";

export const getCaseDocuments = async (caseId: string) => {
  return axiosInstance.get(`/documents/case/${caseId}`);
};

export const uploadDocument = async (
  caseId: string,
  category: string,
  file: File,
) => {
  const formData = new FormData();
  formData.append("file", file);
  // Using a hardcoded user for now to satisfy audit trail requirements
  const response = await axiosInstance.post(
    `/documents/upload/${caseId}`,
    formData,
    {
      params: { category, uploaded_by: "Current_User" },
    },
  );
  return response.data;
};
export const getDocumentPresignedUrl = async (documentId: number | string) => {
  const response = await axiosInstance.get(
    `/document-library/${documentId}/presigned-url`,
  );
  return response.data;
};
export const getDocumentLibrary = async (claimId: number | string) => {
  const response = await axiosInstance.get(
    `/document-library/claim/${claimId}`,
  );
  return response.data;
};
export const getAllDocumentLibrary = async () => {
  const response = await axiosInstance.get("/document-library", {
    params: {
      scope: "all",
    },
  });

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

export const getClaimPhotos = async (claimId: string | number) => {
  const response = await axiosInstance.get(
    `/document-library/claim/${claimId}/photos`,
  );

  return response.data;
};

export const getDocumentPreviewPages = async (documentId: number | string) => {
  const response = await axiosInstance.get(
    `/document-library/${documentId}/preview-pages`,
  );

  return response.data;
};