import React, { createContext, useContext } from "react";
import type { VehicleRecord } from "../services/vehicleRecordService";
import type { HireRecord } from "../../fleet/services/hireService";

interface VehicleContextValue {
  vehicleId: number | null;
  vehicle: VehicleRecord | null;
  /** True while the record for this hire is being fetched/created. */
  loading: boolean;
  /** The Client Side of the same record — customer screens read from it. */
  hire: HireRecord | null;
  /** Buffers the given fields (persisted on navigation), creating the record on first use. */
  save: (partial: Record<string, unknown>) => Promise<void>;
  /** Persists any buffered edits immediately — call before an action that reads the record server-side. */
  flush: () => Promise<void>;
  ensureVehicle: () => Promise<number | null>;
  refresh: () => Promise<void>;
}

const VehicleContext = createContext<VehicleContextValue | null>(null);

export const VehicleProvider: React.FC<{ value: VehicleContextValue; children: React.ReactNode }> = ({
  value,
  children,
}) => <VehicleContext.Provider value={value}>{children}</VehicleContext.Provider>;

export const useVehicle = (): VehicleContextValue => {
  const ctx = useContext(VehicleContext);
  if (!ctx) throw new Error("useVehicle must be used inside a VehicleProvider");
  return ctx;
};
