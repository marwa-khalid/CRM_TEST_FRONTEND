import axiosInstance from "../axiosConfig";

export interface ClaimFormPayload {
  claim_type_id: number;
  handler_id: number;
  target_debt_id: number;
  source_id: number;
  source_staff_user_id: number;
  case_status_id: number;
  credit_hire_accepted: boolean;
  non_fault_accident: "YES" | "NO" | "TBC";
  any_passengers: "YES" | "NO" | "TBC";
  client_injured: "YES" | "NO" | "TBC";
  prospects_id: number;
  file_opened_on: string;
  file_closed_on: string | null;
  present_position_id: number;
  file_position_id: number;
  client_going_abroad: boolean;
  client_going_abroad_date: string | null;
  date: string;
  abroad_date?: string;
}

interface LookupItem {
  id: number;
  label: string;
  sort_order?: number;
  is_active?: boolean;
}

export const ClaimsApi = {
  submitClaim: async (payload: ClaimFormPayload) => {
    try {
      const response = await axiosInstance.post("/claims", {
        claim_type_id: payload.claim_type_id,
        handler_id: payload.handler_id,
        target_debt_id: payload.target_debt_id,
        source_id: payload.source_id,
        source_staff_user_id: payload.source_staff_user_id,
        case_status_id: payload.case_status_id,
        credit_hire_accepted: payload.credit_hire_accepted,
        non_fault_accident: payload.non_fault_accident,
        any_passengers: payload.any_passengers,
        client_injured: payload.client_injured,
        prospects_id: payload.prospects_id,
        file_opened_on: payload.file_opened_on,
        file_closed_on: payload.file_closed_on,
        present_position_id: payload.present_position_id,
        file_position_id: payload.file_position_id,
        client_going_abroad: payload.client_going_abroad,
        client_going_abroad_date: payload.client_going_abroad_date,
        date: payload.date,
        abroad_date: payload.abroad_date
      });
      return response.data;
    } catch (error) {
      console.error("Error submitting claim:", error);
      throw error;
    }
  },

  getLookupData: async () => {
    try {
      const endpoints = [
        "/setups/claim-types",
        "/setups/handlers",
        "/setups/target-debts",
        "/setups/case-statuses",
        "/setups/sources",
        "/setups/prospects",
        "/setups/file-positions"
      ];

      const [
        claimTypes,
        handlers,
        targetDebts,
        caseStatuses,
        sources,
        prospects,
        filePositions
      ] = await Promise.all(
        endpoints.map(endpoint => axiosInstance.get(endpoint))
      );

      return {
        claimTypes: claimTypes.data as LookupItem[],
        handlers: handlers.data as LookupItem[],
        targetDebts: targetDebts.data as LookupItem[],
        caseStatuses: caseStatuses.data as LookupItem[],
        sources: sources.data as LookupItem[],
        prospects: prospects.data as LookupItem[],
        filePositions: filePositions.data as LookupItem[]
      };
    } catch (error) {
      console.error("Error fetching lookup data:", error);
      throw error;
    }
  },

  getClaimById: async (claimId: number) => {
    try {
      const response = await axiosInstance.get(`/claims/${claimId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching claim ${claimId}:`, error);
      throw error;
    }
  },

  updateClaim: async (claimId: number, payload: ClaimFormPayload) => {
    try {
      const response = await axiosInstance.put(`/claims/${claimId}`, {
        claim_type_id: payload.claim_type_id,
        handler_id: payload.handler_id,
        target_debt_id: payload.target_debt_id,
        source_id: payload.source_id,
        source_staff_user_id: payload.source_staff_user_id,
        case_status_id: payload.case_status_id,
        credit_hire_accepted: payload.credit_hire_accepted,
        non_fault_accident: payload.non_fault_accident,
        any_passengers: payload.any_passengers,
        client_injured: payload.client_injured,
        prospects_id: payload.prospects_id,
        file_opened_on: payload.file_opened_on,
        file_closed_on: payload.file_closed_on,
        present_position_id: payload.present_position_id,
        file_position_id: payload.file_position_id,
        client_going_abroad: payload.client_going_abroad,
        client_going_abroad_date: payload.client_going_abroad_date,
        date: payload.date,
        abroad_date: payload.abroad_date
      });
      return response.data;
    } catch (error) {
      console.error(`Error updating claim ${claimId}:`, error);
      throw error;
    }
  }
};

export const convertToApiPayload = (formData: any): ClaimFormPayload => {
  return {
    claim_type_id: formData.claim_type_id || 0,
    handler_id: formData.handler_id || 0,
    target_debt_id: formData.target_debt_id || 0,
    source_id: formData.source_id || 0,
    source_staff_user_id: formData.source_staff_user_id || 0,
    case_status_id: formData.case_status_id || 0,
    credit_hire_accepted: formData.credit_hire_accepted || false,
    non_fault_accident: formData.non_fault_accident || "TBC",
    any_passengers: formData.any_passengers || "TBC",
    client_injured: formData.client_injured || "TBC",
    prospects_id: formData.prospects_id || 0,
    file_opened_on: formData.file_opened_on || new Date().toISOString().split('T')[0],
    file_closed_on: formData.file_closed_on || null,
    present_position_id: formData.present_position_id || 0,
    file_position_id: formData.file_position_id || 0,
    client_going_abroad: formData.client_going_abroad || false,
    client_going_abroad_date: formData.client_going_abroad_date || null,
    date: formData.date || new Date().toISOString().split('T')[0],
    abroad_date: formData.abroad_date || undefined
  };
};


export const getClaims = async () => {
  try {
    const response = await axiosInstance.get(`/claims/claims-list`);
    return response.data;
  } catch (error) {
    console.error("Error fetching claims:", error);
    throw error;
  }
};

// Add this function to export getClaimById
export const getClaimById = async (id: number) => {
  try {
    const response = await axiosInstance.get(`/claims/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching claim:", error);
    throw error;
  }
};

export const deleteClaim = async (id: number) => {
  try {
    const response = await axiosInstance.delete(`/claims/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching claim:", error);
    throw error;
  }
}

// Partial update — only case_status_id (backend uses exclude_unset, so other
// fields are untouched). Used by the claims-list bulk "Change Status" action.
export const updateClaimStatus = (id: number, caseStatusId: number) =>
  axiosInstance.put(`/claims/${id}`, { case_status_id: caseStatusId });

export const downloadCSV = async (id: string) => {
  try {
    const response = await axiosInstance.get(`/claims/claims-list-csv?tenant_id=${id}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching claim:", error);
    throw error;
  }
}

export const notifyManager = (id: any) => {
  // Recipient is derived server-side from the auth cookie (no localStorage).
  return axiosInstance.post(`/claims/${id}/notify-manager`);
}

// Per-claim case reference (e.g. SURNAME-YYYYMM-00019), derived server-side.
// Cached per claim id so repeated reads don't refetch.
const _caseRefCache = new Map<string, string>();
export const getCaseReference = async (claimId: string | number): Promise<string> => {
  const key = String(claimId ?? "");
  if (!key) return "";
  if (_caseRefCache.has(key)) return _caseRefCache.get(key)!;
  try {
    const { data } = await axiosInstance.get(`/claims/${key}/reference`);
    const ref = data?.reference || "";
    _caseRefCache.set(key, ref);
    return ref;
  } catch {
    return "";
  }
};