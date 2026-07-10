import fleetApi from "./fleetApi";

export interface PaymentRow {
  id: number;
  week: number;
  due_amount?: string;
  status?: string;
  paid_amount?: string;
  payment_date?: string;
  notes?: string;
}

export const listPayments = async (hireId: number): Promise<PaymentRow[]> => {
  try {
    const { data } = await fleetApi.get(`/fleet/hire/${hireId}/payments`);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
};

// Ensure weeks 1..count exist with the given due amount (preserves recorded data).
export const syncSchedule = async (hireId: number, count: number, dueAmount: string): Promise<PaymentRow[]> => {
  try {
    const { data } = await fleetApi.post(`/fleet/hire/${hireId}/payments/schedule`, {
      count,
      due_amount: dueAmount || null,
    });
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
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
