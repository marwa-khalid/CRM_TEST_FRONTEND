import axiosInstance from "../axiosConfig";

export const EngineerDetailsApi = {
  createEngineerDetails: async (payload: {
    company_name: string;
    vehicle_payment_beneficiary: string;
    reference: string;
    currency: string;
    actual_fee: number;
    invoice_received_on: string | null;
    invoice_paid_on: string | null;
    invoice_settled_on: string | null;
    invoice_settled_amount: number;
    engineer_report_received: boolean;
    engineer_instructed: string | null;
    inspection_date: string | null;
    engineer_report_received_date: string | null;
    engineer_fee: number;
    site: string;
    claim_id: number | string;
    engineer_address: {
      address: string;
      postcode: string;
      mobile_tel: string;
      email: string;
    };
    vehicle_address: {
      address: string;
      postcode: string;
      mobile_tel: string;
      email: string;
    };
  }) => {
    try {
      const response = await axiosInstance.post("/engineer-details/", payload);
      return response.data;
    } catch (error) {
      console.error("Error creating engineer details:", error);
      throw error;
    }
  },
};

export const searchCompanyName = async (id: any) => {
  const response = await axiosInstance.get(`/engineer-details/company/${id}`);
  return response.data;
};

export const gettingEnginerDetails = async (id: any) => {
  const response = await axiosInstance.get(`/engineer-details/${id}`);
  return response.data;
};

// put api 
export const udpateEnginerDetails = async (payload: any, id: any) => {
  const response = await axiosInstance.put(`/engineer-details/${id}`, payload);
  return response.data;
};

const engineerEmailBody = (payload: any) => ({
  engineer_email: payload.email,
  engineer_company: payload.company,
  engineer_address: payload.address,
  engineer_postcode: payload.postCode,
  current_location: payload.location,
});

// Render the instruct-engineer email for the editable preview modal (no send).
// Returns { to, subject, html, attachments: [{ name }] }.
export const previewEngineerInstruction = async (payload: any, id: any) => {
  const res = await axiosInstance.post(
    `engineer-details/instruction-preview/${id}`,
    engineerEmailBody(payload),
  );
  return res.data;
};

export const instructEngineer = async (payload: any, id: any) => {
  const res = await axiosInstance.post(`engineer-details/send-instruction/${id}`, {
    ...engineerEmailBody(payload),
    // Edited copy from the preview modal (optional) — sent verbatim if present.
    html_override: payload.html ?? null,
    subject_override: payload.subject ?? null,
    cc_override: payload.cc || null,
  })
  return res.data
}


export const uploadVCEngineer = async (files: File[], id: any) => {
  try {
    const formData = new FormData();
    
    files.forEach((file) => {
      formData.append('files', file);
    });

    const response = await axiosInstance.post(`/engineer-details/import-engineer-detail/?claim_id=${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  } catch (error) {
    console.error("Error uploading documents:", error);
    throw error;
  }
};
// Company Name autocomplete for the Engineer Details screen (name + address).
export const getEngineerCompanySuggestions = (query: string) => {
  return axiosInstance.get(
    `/engineer-details/companies/search/${encodeURIComponent(query)}`,
  );
};
