import fleetApi from "./fleetApi";

// Tenant users — for task assignment. Reuses the shared /users endpoint via
// fleetApi (same backend, same Bearer token). No Claims imports.
export interface FleetUser {
  id: number;
  email: string;
  name: string;
}

export const getFleetUsers = async (): Promise<FleetUser[]> => {
  try {
    const { data } = await fleetApi.get("/users");
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
};
