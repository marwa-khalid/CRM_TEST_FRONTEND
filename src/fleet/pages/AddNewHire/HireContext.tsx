import { createContext, useContext } from "react";
import type { HireRecord } from "../../services/hireService";

// Shared hire context: the created hire id + a field-level save helper. Steps call
// `save({ backend_field: value })` on blur/change to persist to the Fleet backend.
export interface HireContextValue {
  hireId: number | null;
  hire: HireRecord | null;
  save: (partial: Record<string, unknown>) => Promise<void> | void;
}

const HireContext = createContext<HireContextValue>({ hireId: null, hire: null, save: () => {} });

export const useHire = () => useContext(HireContext);
export const HireProvider = HireContext.Provider;
