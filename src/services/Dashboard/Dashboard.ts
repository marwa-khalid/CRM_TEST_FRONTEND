import axiosInstance from "../axiosConfig";

// Real dashboard aggregates (tenant-scoped) — see backend dashboard_service.py.
// Headline stats are all-time tenant totals.
export const getDashboard = (period?: string) =>
  axiosInstance.get("/dashboard", { params: period ? { period } : {} });

// Trend series for claims and hired vehicles.
// mode: YoY compares the selected period with the same period last year.
// mode: MoM shows month-over-month movement for the selected period.
// Optionally filtered by referrer (source channel) and/or claim status.
export const getDashboardTrends = (
  period: string,
  mode?: string,
  referrer?: string,
  status?: string,
  start?: string,
  end?: string,
) =>
  axiosInstance.get("/dashboard/trends", {
    params: {
      period,
      mode,
      referrer: referrer || undefined,
      status: status || undefined,
      start: start || undefined,
      end: end || undefined,
    },
  });

// Referrer + status options for the trend filters.
export const getTrendOptions = () => axiosInstance.get("/dashboard/trend-options");

// Net income breakdown for a period (WTD / MTD / YTD / CUSTOM with start+end).
export const getDashboardIncome = (period: string, start?: string, end?: string) =>
  axiosInstance.get("/dashboard/income", { params: { period, start, end } });

// Collection performance for a period and payment status (paid / pending).
export const getDashboardCollection = (period: string, paymentStatus?: string) =>
  axiosInstance.get("/dashboard/collection", {
    params: { period, payment_status: paymentStatus },
  });

// Every required document that's missing, per claim.
export const getMissingDocuments = () => axiosInstance.get("/dashboard/missing-documents");

// Storage & Recovery summary + per-vehicle breakdown (for the sliders).
export const getStorageRecovery = () => axiosInstance.get("/dashboard/storage-recovery");
