import { useEffect, useState } from "react";
import { getCaseReference } from "../services/Claims/Claims";

/**
 * Per-claim case reference, fetched from the backend for the given claim id.
 * Replaces the old single global `localStorage.getItem("CaseReference")` so the
 * reference is always correct for the claim currently being viewed.
 */
export const useCaseReference = (claimId?: string | number | null): string => {
  const [ref, setRef] = useState("");
  useEffect(() => {
    let active = true;
    if (!claimId) {
      setRef("");
      return;
    }
    const load = () =>
      getCaseReference(claimId).then((r) => {
        if (active) setRef(r);
      });
    load();
    // Refresh immediately when the reference is invalidated elsewhere (e.g. the
    // client surname was just saved) instead of waiting for a page reload.
    const onUpdated = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail == null || String(detail) === String(claimId)) load();
    };
    window.addEventListener("case-reference-updated", onUpdated);
    return () => {
      active = false;
      window.removeEventListener("case-reference-updated", onUpdated);
    };
  }, [claimId]);
  return ref;
};
