import fleetApi from "./fleetApi";

export interface PaymentTransaction {
  id: number;
  payment_id: number;
  amount?: string;
  payment_mode?: string;
  payment_date?: string;
  payment_time?: string;
  notes?: string;
  created_at?: string;
}

export interface PaymentRow {
  id: number;
  vehicle_id?: number | null;
  week: number;
  due_amount?: string;
  status?: string;
  paid_amount?: string;
  payment_date?: string;
  payment_time?: string;
  notes?: string;
  transactions?: PaymentTransaction[];
}

export const listPayments = async (hireId: number, vehicleId?: number | null): Promise<PaymentRow[]> => {
  try {
    const { data } = await fleetApi.get(`/fleet/hire/${hireId}/payments`, {
      params: vehicleId ? { vehicle_id: vehicleId } : undefined,
    });
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
};

// Ensure weeks 1..count exist with the given due amount (preserves recorded data).
export const syncSchedule = async (
  hireId: number,
  count: number,
  dueAmount: string,
  initialDueAmount?: string,
  vehicleId?: number | null,
): Promise<PaymentRow[]> => {
  const { data } = await fleetApi.post(`/fleet/hire/${hireId}/payments/schedule`, {
    count,
    due_amount: dueAmount || null,
    initial_due_amount: initialDueAmount || null,
  }, {
    params: vehicleId ? { vehicle_id: vehicleId } : undefined,
  });
  return Array.isArray(data) ? data : [];
};

export const updatePayment = async (
  hireId: number,
  paymentId: number,
  partial: Record<string, unknown>,
): Promise<PaymentRow | null> => {
  try {
    const { data } = await fleetApi.patch(`/fleet/hire/${hireId}/payments/${paymentId}`, partial);
    return data ?? null;
  } catch {
    return null;
  }
};

// Append one dated payment to a week; the backend rolls up the week's total,
// status and latest date and returns the updated week row (with all transactions).
export const recordPaymentTransaction = async (
  hireId: number,
  paymentId: number,
  transaction: { amount: string; payment_mode?: string | null; payment_date?: string | null; payment_time?: string | null; notes?: string | null },
): Promise<PaymentRow | null> => {
  try {
    const { data } = await fleetApi.post(`/fleet/hire/${hireId}/payments/${paymentId}/transactions`, transaction);
    return data ?? null;
  } catch {
    return null;
  }
};

// Edit an existing payment (amount / mode / date / notes); backend re-rolls the week.
export const updatePaymentTransaction = async (
  hireId: number,
  paymentId: number,
  transactionId: number,
  transaction: { amount?: string | null; payment_mode?: string | null; payment_date?: string | null; payment_time?: string | null; notes?: string | null },
): Promise<PaymentRow | null> => {
  try {
    const { data } = await fleetApi.patch(
      `/fleet/hire/${hireId}/payments/${paymentId}/transactions/${transactionId}`,
      transaction,
    );
    return data ?? null;
  } catch {
    return null;
  }
};

export const deletePaymentTransaction = async (
  hireId: number,
  paymentId: number,
  transactionId: number,
): Promise<PaymentRow | null> => {
  try {
    const { data } = await fleetApi.delete(`/fleet/hire/${hireId}/payments/${paymentId}/transactions/${transactionId}`);
    return data ?? null;
  } catch {
    return null;
  }
};

export interface ExtractedReceipt {
  amount: string;
  paymentDate: string;
  reference: string;
  payer: string;
  payee: string;
  sortCode: string;
  accountNumber: string;
  paymentMode: string;
}

const EMPTY_RECEIPT: ExtractedReceipt = {
  amount: "", paymentDate: "", reference: "", payer: "",
  payee: "", sortCode: "", accountNumber: "", paymentMode: "bank_transfer",
};

// OCR a bank transfer receipt so the Record Payment fields can be pre-filled.
// Never throws — a failed read just yields blanks for the user to type in.
export const extractPaymentReceipt = async (file: File): Promise<ExtractedReceipt> => {
  const form = new FormData();
  form.append("file", file);
  try {
    const { data } = await fleetApi.post("/fleet/ocr/payment-receipt", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return { ...EMPTY_RECEIPT, ...data };
  } catch {
    return { ...EMPTY_RECEIPT };
  }
};
