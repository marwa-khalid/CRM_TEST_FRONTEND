import type { HireRecord } from "../services/hireService";

const surnameOf = (name?: string | null): string => {
  const parts = (name || "").trim().split(/\s+/).filter(Boolean);
  return parts.length ? parts[parts.length - 1].toUpperCase() : "";
};

// Fleet reference `SK-{SURNAME}-{id}` (Skyline) — matches the backend format and
// deliberately differs from the Claims reference so the two never collide.
// Computed live from the current driver surname; `SK-{id}` until it's entered.
// Prefers the backend-stored value when present.
export const fleetReference = (
  hire: Pick<HireRecord, "id" | "driver_name" | "fleet_reference"> | null,
  fallbackId?: number | null,
): string => {
  if (hire?.fleet_reference) return hire.fleet_reference;
  const id = hire?.id ?? fallbackId ?? null;
  if (!id) return "";
  const surname = surnameOf(hire?.driver_name);
  return surname ? `SK-${surname}-${id}` : `SK-${id}`;
};
