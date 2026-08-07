// Best-effort current user name from localStorage / the JWT — mirrors the logic
// in FleetShell / VehicleManagementShell, exposed as a helper so forms can seed
// "Assigned To" (and similar) with the logged-in user by default.
const decodeJwt = (token: string): Record<string, unknown> | null => {
  try {
    const payload = token.split(".")[1];
    return JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
  } catch {
    return null;
  }
};

export const getCurrentUserName = (): string => {
  const ls = (k: string) => localStorage.getItem(k) || "";
  let name = ls("user_name") || ls("userName") || ls("name") || ls("fullName") || "";
  let email = ls("email") || ls("pendingLoginEmail") || "";
  if (!name || !email) {
    const claims = decodeJwt(ls("access_token"));
    if (claims) {
      name = name || String(claims.name || claims.full_name || "");
      email = email || String(claims.email || claims.sub || "");
    }
  }
  if (!name && email) {
    name = email
      .split("@")[0]
      .replace(/[._-]+/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }
  return name;
};
