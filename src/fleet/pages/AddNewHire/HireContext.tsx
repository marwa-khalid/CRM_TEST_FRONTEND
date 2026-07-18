import { createContext, useContext } from "react";
import type { HireRecord } from "../../services/hireService";

// Shared hire context: the created hire id + a field-level save helper. Steps call
// `save({ backend_field: value })` on blur/change to persist to the Fleet backend.
export interface HireContextValue {
  hireId: number | null;
  hire: HireRecord | null;
  save: (partial: Record<string, unknown>) => Promise<void> | void;
  // The vehicle the user last made active — shared so the Hire Vehicle Details
  // and Payment Details screens open on the SAME card (kept by vehicle id, which
  // is stable across each screen's own vehicle list).
  activeVehicleId: number | null;
  setActiveVehicleId: (id: number | null) => void;
}

const HireContext = createContext<HireContextValue>({
  hireId: null,
  hire: null,
  save: () => {},
  activeVehicleId: null,
  setActiveVehicleId: () => {},
});

export const useHire = () => useContext(HireContext);
export const HireProvider = HireContext.Provider;
