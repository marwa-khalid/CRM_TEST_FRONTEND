import axiosInstance from "../axiosConfig";

// Real dashboard aggregates (tenant-scoped) — see backend dashboard_service.py.
export const getDashboard = () => axiosInstance.get("/dashboard");

// Trend series at the granularity for a period: WTD / MTD / YTD.
export const getDashboardTrends = (period: string) =>
  axiosInstance.get("/dashboard/trends", { params: { period } });

// Net income breakdown for a period (WTD / MTD / YTD / CUSTOM with start+end).
export const getDashboardIncome = (period: string, start?: string, end?: string) =>
  axiosInstance.get("/dashboard/income", { params: { period, start, end } });

// Every required document that's missing, per claim.
export const getMissingDocuments = () => axiosInstance.get("/dashboard/missing-documents");
