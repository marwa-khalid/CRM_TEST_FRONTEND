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
export const getHireTrend = async (
  period: string,
  mode: string,
  status = "",
  cmpType = "",
  a = "",
  b = "",
): Promise<HireTrend | null> => {
  try {
    const { data } = await fleetApi.get("/fleet/dashboard/hire-trend", {
      params: {
        period: period.toUpperCase(),
        mode: mode.toUpperCase(),
        status: status || undefined,
        // Custom year/month comparison: cmp_type (year|month) + the two periods.
        cmp_type: cmpType || undefined,
        a: a || undefined,
        b: b || undefined,
      },
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
  sub: string;
  progress: number;
}
export interface StatsResponse {
  period: string;
  compare_label: string;
  cards: StatCard[];
}

// `period` is WTD | MTD | YTD (uppercased for the API). Returns null on failure.
// Mileage-based: remaining = service_due_mileage − current_mileage. Rows are
// [reg, current_mileage, service_due_at, [statusLabel, colour]].
export interface ServicingDue {
  tabs: { overdue: number; within_500: number; within_1000: number };
  rows: { overdue: PaymentRows; within_500: PaymentRows; within_1000: PaymentRows };
}
// `context` (cams | skyline) scopes the card to one Vehicle Management side.
export const getServicingDue = async (context?: string): Promise<ServicingDue | null> => {
  try {
    const { data } = await fleetApi.get("/fleet/dashboard/servicing-due", { params: { context } });
    return data as ServicingDue;
  } catch {
    return null;
  }
};
export const getStats = async (period: string, module?: string): Promise<StatsResponse | null> => {
  try {
    const { data } = await fleetApi.get("/fleet/dashboard/stats", {
      params: { period: period.toUpperCase(), module },
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
// `context` (cams | skyline) scopes the donut to one Vehicle Management side.
export const getVehicleStatus = async (context?: string): Promise<VehicleStatus | null> => {
  try {
    const { data } = await fleetApi.get("/fleet/dashboard/vehicle-status", { params: { context } });
    return data as VehicleStatus;
  } catch {
    return null;
  }
};

// Live vehicle list for the "Skyline Vehicles" section. Returns null on failure
// (so the UI can tell "no vehicles" apart from "backend unreachable").
export interface FleetVehicleRow {
  registration: string;
  model: string;
  statusKey: "available" | "hire" | "off" | "repair" | "sale";
  offHiredToday?: boolean; // off-hired today (now Available) — drives the daily "Off Hire" filter
  statusLabel: string;
  hireInfo?: string;
  customer?: string;
}
// `context` (cams | skyline) scopes the list to one Vehicle Management side.
export const getFleetVehicles = async (context?: string): Promise<FleetVehicleRow[] | null> => {
  try {
    const { data } = await fleetApi.get("/fleet/dashboard/vehicles", { params: { context } });
    return Array.isArray(data?.items) ? data.items : [];
  } catch {
    return null;
  }
};

// Weekly payment schedule (Due Today / This Week / Overdue / Received Today +
// the actionable rows). Rows come pre-shaped for the dashboard's DataTable.
type PaymentRows = (string | [string, string])[][];
export interface PaymentSummary {
  total: string;
  overdue: string;
  due_today: string;
  received: string;
  by_day: { day: string; amount: number }[];
}
export interface WeeklyPayments {
  tabs: { due_today: number; due_this_week: number; overdue: number; received_today: number; all: number };
  // Rows grouped by bucket so the dashboard tabs can filter to one bucket; `all` = every payment (View All).
  rows: { due_today: PaymentRows; due_this_week: PaymentRows; overdue: PaymentRows; received_today: PaymentRows; all: PaymentRows };
  // Left-panel roll-up: money by bucket + received-so-far this week + per-weekday chart.
  summary?: PaymentSummary;
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
  categories: { key: string; title: string; overdue: number; bar: number; d7: number; d30: number; total: number; compliant: number; amber: number }[];
}
// `context` (cams | skyline) scopes compliance to one Vehicle Management side.
export const getCompliance = async (context?: string): Promise<Compliance | null> => {
  try {
    const { data } = await fleetApi.get("/fleet/dashboard/compliance", { params: { context } });
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
  service: ExpiryCard;
}
// `context` (cams | skyline) scopes the expiry cards to one Vehicle Management side.
export const getExpiries = async (context?: string): Promise<Expiries | null> => {
  try {
    const { data } = await fleetApi.get("/fleet/dashboard/expiries", { params: { context } });
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
// `side` (skyline | vehicles) scopes the Missing Documents count to driver docs
// vs vehicle docs; `context` (cams | skyline) scopes vehicle docs to one VM side.
export const getAttention = async (side = "vehicles", context?: string): Promise<Attention | null> => {
  try {
    const { data } = await fleetApi.get("/fleet/dashboard/attention", { params: { side, context } });
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
export const getMissingDocuments = async (side = "vehicles", context?: string): Promise<MissingDoc[]> => {
  try {
    const { data } = await fleetApi.get("/fleet/dashboard/missing-documents", { params: { side, context } });
    return Array.isArray(data?.items) ? data.items : [];
  } catch {
    return [];
  }
};

// Vehicles out past their expected return date (Attention "Overdue Returns" slider).
export interface OverdueReturn {
  registration: string;
  model: string;
  driver: string;
  due_date: string;
  days_overdue: number;
  hire_id: number | null;
}
export const getOverdueReturns = async (): Promise<OverdueReturn[]> => {
  try {
    const { data } = await fleetApi.get("/fleet/dashboard/overdue-returns");
    return Array.isArray(data?.items) ? data.items : [];
  } catch {
    return [];
  }
};

// Owed weekly payments past their due date (Attention "Overdue Payments" slider).
export interface OverduePayment {
  registration: string;
  driver: string;
  amount: string;
  due_date: string;
  days_overdue: number;
  hire_id: number | null;
}
export const getOverduePayments = async (): Promise<OverduePayment[]> => {
  try {
    const { data } = await fleetApi.get("/fleet/dashboard/overdue-payments");
    return Array.isArray(data?.items) ? data.items : [];
  } catch {
    return [];
  }
};
