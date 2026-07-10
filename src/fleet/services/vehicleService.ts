import fleetApi from "./fleetApi";

// Hire vehicles (a hire holds many — each swap adds one). All best-effort: the
// screen keeps working from local state if the backend isn't up/migrated yet.

export const createVehicle = async (hireId: number): Promise<Record<string, unknown> | null> => {
  try {
    const { data } = await fleetApi.post(`/fleet/hire/${hireId}/vehicles`);
    return data ?? null;
  } catch {
    return null;
  }
};

export const listVehicles = async (hireId: number): Promise<Record<string, unknown>[]> => {
  try {
    const { data } = await fleetApi.get(`/fleet/hire/${hireId}/vehicles`);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
};

export const updateVehicle = async (
  hireId: number,
  vehicleId: number,
  partial: Record<string, unknown>,
): Promise<void> => {
  try {
    await fleetApi.patch(`/fleet/hire/${hireId}/vehicles/${vehicleId}`, partial);
  } catch {
    /* best-effort field-level save */
  }
};
