import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

/**
 * Tracks per-screen "completion" so the claim sidebar can show a green check
 * (checkgreen.svg) only when EVERY field on a screen is filled in.
 *
 * Only the currently-mounted claim form reports, so completion is stored
 * against whichever step is active. Each form computes whether it is fully
 * filled and calls `useReportCompletion(complete)`.
 */

type CompletionContextValue = {
  /** Report completion for the currently-active claim step. */
  report: (complete: boolean) => void;
};

const ClaimCompletionContext = createContext<CompletionContextValue>({
  report: () => {},
});

/** True when a single field value counts as "filled". */
const isFieldFilled = (v: any): boolean => {
  if (v === null || v === undefined) return false;
  if (typeof v === "string") return v.trim() !== "";
  if (typeof v === "number") return !Number.isNaN(v);
  if (typeof v === "boolean") return true; // a checkbox/toggle always has an answer
  // A Date has no enumerable own-properties, so it must be checked before the
  // generic object branch (otherwise a valid date reads as "empty").
  if (v instanceof Date) return !Number.isNaN(v.getTime());
  if (Array.isArray(v)) return v.length > 0 && v.every(isFieldFilled);
  if (typeof v === "object") {
    const vals = Object.values(v);
    return vals.length > 0 && vals.every(isFieldFilled);
  }
  return true;
};

/**
 * Strict: true only when EVERY field on the form is filled (not even one left).
 * Pass an object of the form's values. To exclude a field that is conditionally
 * hidden, omit it or set it to a non-empty sentinel before calling.
 */
export const isAllFilled = (values: any): boolean => {
  if (!values || typeof values !== "object") return false;
  const vals = Object.values(values);
  if (vals.length === 0) return false;
  return vals.every(isFieldFilled);
};

export const ClaimCompletionProvider = ({
  activeStep,
  onChange,
  children,
  claimId,
  screenKeys,
  initialMap,
  onPersist,
}: {
  activeStep: number;
  onChange: (map: Record<number, boolean>) => void;
  children: React.ReactNode;
  /** Claim being edited; persistence is skipped until it exists. */
  claimId?: string | number;
  /** Stable server key per step index (parallel to the sidebar steps). */
  screenKeys?: string[];
  /** Completion loaded once from the server; live reports take precedence. */
  initialMap?: Record<number, boolean>;
  /** Persist one screen's flag to the backend. */
  onPersist?: (screenKey: string, complete: boolean) => void;
}) => {
  const activeStepRef = useRef(activeStep);
  // Keep the active step fresh synchronously so a child effect that fires right
  // after a step change reports against the correct step.
  activeStepRef.current = activeStep;

  const [map, setMap] = useState<Record<number, boolean>>({});
  // Last value persisted per step, so we only PUT when a flag actually flips.
  const lastPersisted = useRef<Record<number, boolean>>({});

  // Seed from the server map when it arrives; anything already reported live wins.
  useEffect(() => {
    if (!initialMap) return;
    lastPersisted.current = { ...initialMap, ...lastPersisted.current };
    setMap((prev) => ({ ...initialMap, ...prev }));
  }, [initialMap]);

  const report = useCallback((complete: boolean) => {
    const idx = activeStepRef.current;
    setMap((prev) => (prev[idx] === complete ? prev : { ...prev, [idx]: complete }));
  }, []);

  useEffect(() => {
    onChange(map);
  }, [map, onChange]);

  // Persist each step whose completion flag changed (fires only on an actual flip).
  useEffect(() => {
    if (!claimId || !screenKeys) return;
    Object.entries(map).forEach(([k, val]) => {
      const idx = Number(k);
      const key = screenKeys[idx];
      if (key && lastPersisted.current[idx] !== val) {
        lastPersisted.current[idx] = val as boolean;
        onPersist?.(key, val as boolean);
      }
    });
  }, [map, claimId, screenKeys, onPersist]);

  return (
    <ClaimCompletionContext.Provider value={{ report }}>
      {children}
    </ClaimCompletionContext.Provider>
  );
};

/**
 * Call once inside a claim step form with a boolean saying whether every field
 * on the screen is filled. The sidebar shows a green check when true.
 */
export const useReportCompletion = (complete: boolean, enabled = true) => {
  const { report } = useContext(ClaimCompletionContext);

  useEffect(() => {
    if (!enabled) return;
    report(complete);
  }, [complete, enabled, report]);
};
