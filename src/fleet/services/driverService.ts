import type { DriverDetailsForm } from "../types/hire";

// Field-level save (like the Claims side). TODO: wire to the Fleet backend
// (fleetApi.patch on the driver record) once the endpoint exists. Silent no-op
// for now so the pattern is in place without erroring against a missing route.
export const saveDriverField = async (
  _field: keyof DriverDetailsForm,
  _value: string,
): Promise<void> => {
  // e.g. await fleetApi.patch(`/fleet/hire/${hireId}/driver`, { [_field]: _value });
  return;
};

export interface ExtractedDriver {
  name: string;
  address: string;
  postcode: string;
  drivingLicenceNumber: string;
  dateOfBirth: string; // yyyy-mm-dd
}

// OCR extraction from the uploaded driving licence. TODO: replace this stub with
// the real Fleet OCR call (fleetApi). Returns sample data so the auto-populate +
// preview flow is visible client-side.
export const extractDriverDetailsFromLicence = (_file: File): ExtractedDriver => ({
  name: "David William Donald Cameron",
  address: "10 Downing Street, London",
  postcode: "SW1A 2AA",
  drivingLicenceNumber: "CAMER009011DW9AB99",
  dateOfBirth: "1966-10-09",
});
