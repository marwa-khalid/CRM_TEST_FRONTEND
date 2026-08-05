import fleetApi from "./fleetApi";

// Fleet dashboard aggregations. Best-effort like the rest of the Fleet services:
// every call returns null (never throws) if the Fleet backend isn't reachable,
// so the dashboard can fall back to placeholder data and never render broken.

export interface HireTrend {
  labels: string[];
  values: number[];
  caption: string;
  comparison_note: string | null;
}

// Hire Trend graph. `period` is WTD | MTD | YTD | Custom; `mode` is "" | YoY | MoM
// (both uppercased for the API). Returns null on any failure.
export const getHireTrend = async (period: string, mode: string): Promise<HireTrend | null> => {
  try {
    const { data } = await fleetApi.get("/fleet/dashboard/hire-trend", {
      params: { period: period.toUpperCase(), mode: mode.toUpperCase() },
    });
    return data as HireTrend;
  } catch {
    return null;
  }
};

// Top stat cards. Each card carries a stable `key` the UI maps to its icon.
// `up` = the change was favourable (fewer Urgent Alerts counts as favourable).
export interface StatCard {
  key: string;
  label: string;
  value: string;
  pct: string;
  up: boolean;
}
export interface StatsResponse {
  period: string;
  compare_label: string;
  cards: StatCard[];
}

// `period` is WTD | MTD | YTD (uppercased for the API). Returns null on failure.
export const getStats = async (period: string): Promise<StatsResponse | null> => {
  try {
    const { data } = await fleetApi.get("/fleet/dashboard/stats", {
      params: { period: period.toUpperCase() },
    });
    return data as StatsResponse;
  } catch {
    return null;
  }
};

// Vehicle-status distribution for the donut. Returns null on failure.
export interface VehicleStatus {
  total: number;
  segments: { label: string; value: number }[];
}
export const getVehicleStatus = async (): Promise<VehicleStatus | null> => {
  try {
    const { data } = await fleetApi.get("/fleet/dashboard/vehicle-status");
    return data as VehicleStatus;
  } catch {
    return null;
  }
};

// Weekly payment schedule (Due Today / This Week / Overdue / Received Today +
// the actionable rows). Rows come pre-shaped for the dashboard's DataTable.
type PaymentRows = (string | [string, string])[][];
export interface WeeklyPayments {
  tabs: { due_today: number; due_this_week: number; overdue: number; received_today: number };
  // Rows grouped by bucket so the dashboard tabs can filter to one bucket.
  rows: { due_today: PaymentRows; due_this_week: PaymentRows; overdue: PaymentRows; received_today: PaymentRows };
}
export const getWeeklyPayments = async (): Promise<WeeklyPayments | null> => {
  try {
    const { data } = await fleetApi.get("/fleet/dashboard/weekly-payments");
    return data as WeeklyPayments;
  } catch {
    return null;
  }
};

// Compliance summary — per-category overdue / % bar / due-in-7 / due-in-30.
export interface Compliance {
  categories: { key: string; title: string; overdue: number; bar: number; d7: number; d30: number }[];
}
export const getCompliance = async (): Promise<Compliance | null> => {
  try {
    const { data } = await fleetApi.get("/fleet/dashboard/compliance");
    return data as Compliance;
  } catch {
    return null;
  }
};

// Expiry cards (road_fund / mot / plate) — tab counts + rows grouped by bucket.
type ExpiryRows = (string | [string, string])[][];
export interface ExpiryCard {
  tabs: { expired: number; today: number; d7: number; d30: number };
  rows: { expired: ExpiryRows; today: ExpiryRows; d7: ExpiryRows; d30: ExpiryRows };
}
export interface Expiries {
  road_fund: ExpiryCard;
  mot: ExpiryCard;
  plate: ExpiryCard;
}
export const getExpiries = async (): Promise<Expiries | null> => {
  try {
    const { data } = await fleetApi.get("/fleet/dashboard/expiries");
    return data as Expiries;
  } catch {
    return null;
  }
};

// Attention-required tiles.
export interface Attention {
  overdue_returns: number;
  missing_documents: number;
  overdue_payments: number;
}
export const getAttention = async (): Promise<Attention | null> => {
  try {
    const { data } = await fleetApi.get("/fleet/dashboard/attention");
    return data as Attention;
  } catch {
    return null;
  }
};

// Vehicles missing a required document (drives the Attention "Missing Documents" slider).
export interface MissingDoc {
  label: string;
  registration: string;
  hire_id: number | null;
}
export const getMissingDocuments = async (): Promise<MissingDoc[]> => {
  try {
    const { data } = await fleetApi.get("/fleet/dashboard/missing-documents");
    return Array.isArray(data?.items) ? data.items : [];
  } catch {
    return [];
  }
};
