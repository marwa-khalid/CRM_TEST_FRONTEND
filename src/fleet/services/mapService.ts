import fleetApi from "./fleetApi";

// Fleet Map client — vehicle GPS positions from the shared backend (self-seeds
// demo data if empty). No Claims imports; keeps the Fleet slice self-contained.

export interface FleetMapVehicle {
  id: number;
  registration: string;
  make?: string | null;
  model?: string | null;
  status?: string | null; // On Hire | Available | In Repair | Off Road
  driver_name?: string | null;
  latitude: number;
  longitude: number;
  speed_mph?: number | null;
  heading?: number | null;
  location_label?: string | null;
  depot?: string | null;
  mileage?: number | null;
  plate_expiry?: string | null;
  mot_expiry?: string | null;
  last_updated?: string | null;
}

export const listFleetMapVehicles = async (): Promise<FleetMapVehicle[]> => {
  try {
    const { data } = await fleetApi.get("/fleet/map/vehicles");
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.warn("Unable to load fleet map vehicles.", error);
    return [];
  }
};
