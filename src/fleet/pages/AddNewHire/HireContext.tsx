import { createContext, useContext } from "react";
import type { HireRecord } from "../../services/hireService";

// Shared hire context: the created hire id + a field-level save helper. Steps call
// `save({ backend_field: value })` on blur/change. Rather than PATCH on every
// keystroke, edits are buffered and flushed once when the user navigates away
// (sidebar step, Save & Next, Back, Activity Log / Documents Library) — so a
// screenful of edits costs one request instead of dozens.
export interface HireContextValue {
  hireId: number | null;
  hire: HireRecord | null;
  save: (partial: Record<string, unknown>) => Promise<void> | void;
  // The vehicle the user last made active — shared so the Hire Vehicle Details
  // and Payment Details screens open on the SAME card (kept by vehicle id, which
  // is stable across each screen's own vehicle list).
  activeVehicleId: number | null;
  setActiveVehicleId: (id: number | null) => void;
  // Screens that persist through their own API (Licensing, Servicing) register a
  // flush callback here; the wizard runs every registered flusher before it
  // navigates. Returns an unregister fn for cleanup on unmount.
  registerFlusher: (fn: () => Promise<void>) => () => void;
}

const HireContext = createContext<HireContextValue>({
  hireId: null,
  hire: null,
  save: () => {},
  activeVehicleId: null,
  setActiveVehicleId: () => {},
  registerFlusher: () => () => {},
});

export const useHire = () => useContext(HireContext);
export const HireProvider = HireContext.Provider;
