import { createContext, useContext } from "react";

// Shared hire context: the created hire id + a field-level save helper. Steps call
// `save({ backend_field: value })` on blur/change to persist to the Fleet backend.
export interface HireContextValue {
  hireId: number | null;
  save: (partial: Record<string, unknown>) => void;
}

const HireContext = createContext<HireContextValue>({ hireId: null, save: () => {} });

export const useHire = () => useContext(HireContext);
export const HireProvider = HireContext.Provider;
