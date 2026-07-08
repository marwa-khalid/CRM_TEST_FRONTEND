/**
 * Parse a timestamp that came from the backend.
 *
 * Postgres returns naive UTC strings with no timezone suffix (e.g.
 * "2026-07-08T14:00:00" or "2026-07-08 14:00:00"). `new Date(...)` wrongly
 * interprets those as LOCAL time, so a row created "just now" reads hours off
 * for anyone not on UTC (e.g. UTC+5 -> "5 hours ago"). We append "Z" so the
 * browser parses it as UTC. Already-zoned strings and date-only strings are
 * left untouched.
 */
export const parseServerDate = (
  value?: string | number | Date | null,
): Date | null => {
  if (value === null || value === undefined || value === "") return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (typeof value === "number") {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const s = String(value).trim();
  if (!s) return null;
  const hasTimezone = /([zZ]|[+-]\d{2}:?\d{2})$/.test(s);
  const hasTime = s.includes("T") || /\d{1,2}:\d{2}/.test(s);
  // Only date+time strings without a zone need the "Z"; leave date-only as-is
  // (JS already treats a bare ISO date as UTC midnight).
  const normalized = !hasTimezone && hasTime ? s.replace(" ", "T") + "Z" : s;
  const d = new Date(normalized);
  return Number.isNaN(d.getTime()) ? null : d;
};

/** Milliseconds since epoch for a backend timestamp (fallback = 0). */
export const serverTime = (value?: string | number | Date | null): number => {
  const d = parseServerDate(value);
  return d ? d.getTime() : 0;
};
