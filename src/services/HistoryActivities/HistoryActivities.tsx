import Claims from "../../modules/Claims/ClaimsList";
import axiosInstance from "../axiosConfig";

export const getHistoryActivity = (claim_id: number) => {
  return axiosInstance.get(`/history/files`, {
    params: { claim_id },
  });
};

export const getTenantHistoryActivity = (tenant_id: number) => {
  return axiosInstance.get(`/history/tenant-files`, {
    params: { tenant_id },
  });
};

export const getClaimFiles = (claim_id: number) => {
  return axiosInstance.get(`/history/claim/${claim_id}/files`, {
    params: { claim_id },
  });
};

export const deactivateHistoryRecord = (id: number) => {
  return axiosInstance.put(`/history/deactivate/${id}`, { params: { id } });
};

export const uploadClaimFiles = (claim_id: number, files: File[]) => {
  const formData = new FormData();
  files.forEach((file) => formData.append("files", file));

  return axiosInstance.post(`/history/upload?claim_id=${claim_id}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const downloadClaimFile = (id: number) => {
  return axiosInstance.get(`/history/download/${id}`, {
    responseType: "blob",
  });
};

//paginated Tenant History Activity
export const getTenatHistory = (
  tenant_id: number,
  page: number,
  page_size: number
) => {
  return axiosInstance.get(`/history/paginated-tenant-files`, {
    params: { tenant_id, page, page_size },
  });
};

//paginated Claim History Activity
export const getClaimHistory = (
  claim_id: number,
  page: number,
  page_size: number
) => {
  return axiosInstance.get(`/history/paginated-files`, {
    params: { claim_id, page, page_size },
  });
};

export const searchClaimFiles = (
  claim_id: number,
  page: number,
  page_size: number,
  search?: string,
  start_date?: string,
  end_date?: string
) => {
  return axiosInstance.get(`/history/search-claim-files`, {
    params: {
      claim_id,
      page,
      page_size,
      ...(search ? { search } : {}),
      ...(start_date && end_date ? { start_date, end_date } : {}),
    },
  });
};

export const searchTenantFiles = (
  tenant_id: number,
  page: number,
  page_size: number,
  search?: string,
  start_date?: string,
  end_date?: string
) => {
  return axiosInstance.get(`/history/search-tenant-files`, {
    params: {
      tenant_id,
      page,
      page_size,
      ...(search ? { search } : {}),
      ...(start_date && end_date ? { start_date, end_date } : {}),
    },
  });
};

export const getCaseActivity = async (claimId: number | string) => {
  const response = await axiosInstance.get(`/case-activity/claim/${claimId}`);
  return response.data;
};