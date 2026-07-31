import axiosInstance from "../axiosConfig";

// The shared vehicle register (fleet_vehicle_register) is the pool of registered
// vehicles that feeds BOTH the Skyline and Claims hire reg dropdowns. Claims
// reaches it through the same /fleet endpoint (same backend + Bearer/cookie auth)
// without importing anything from the fleet frontend slice, so that slice stays
// independently extractable.
//
// `is_active` means the vehicle is currently on hire somewhere (Claims OR Skyline)
// and therefore unavailable to the other side — this is the mutual-exclusivity flag.
export interface VehicleRegisterEntry {
  id: number;
  registration_number: string;
  make: string;
  model: string;
  transmission?: string;
  is_active: boolean;
}

export const listVehicleRegister = async (): Promise<VehicleRegisterEntry[]> => {
  try {
    const { data } = await axiosInstance.get("/vehicles/vehicle-register");
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
};

export const upsertVehicleRegister = async (
  payload: Partial<VehicleRegisterEntry> & { registration_number: string },
): Promise<VehicleRegisterEntry | null> => {
  try {
    const { data } = await axiosInstance.post("/vehicles/vehicle-register", payload);
    return data ?? null;
  } catch {
    return null;
  }
};
