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
    getCaseReference(claimId).then((r) => {
      if (active) setRef(r);
    });
    return () => {
      active = false;
    };
  }, [claimId]);
  return ref;
};
