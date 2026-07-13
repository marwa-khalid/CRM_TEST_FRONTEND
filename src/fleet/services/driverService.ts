import type { DriverDetailsForm } from "../types/hire";
import fleetApi from "./fleetApi";

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
  licenceStart: string; // dd-mm-yyyy
  licenceEnd: string; // dd-mm-yyyy
}

const EMPTY_DRIVER: ExtractedDriver = {
  name: "",
  address: "",
  postcode: "",
  drivingLicenceNumber: "",
  dateOfBirth: "",
  licenceStart: "",
  licenceEnd: "",
};

// Real OCR of an uploaded driving licence via the self-contained Fleet backend
// (free Tesseract, optional Vision). Best-effort: returns blanks on failure so
// the upload flow never errors and the user can type the fields manually.
export const extractDriverDetailsFromLicence = async (
  file: File,
): Promise<ExtractedDriver> => {
  const form = new FormData();
  form.append("file", file);
  try {
    const { data } = await fleetApi.post("/fleet/ocr/driving-licence", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return { ...EMPTY_DRIVER, ...data };
  } catch {
    return { ...EMPTY_DRIVER };
  }
};

export interface ExtractedAddress {
  address: string;
  postcode: string;
}

// Real OCR of a proof-of-address (utility bill) -> address + postcode.
export const extractProofOfAddress = async (
  file: File,
): Promise<ExtractedAddress> => {
  const form = new FormData();
  form.append("file", file);
  try {
    const { data } = await fleetApi.post("/fleet/ocr/proof-of-address", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return { address: data.address ?? "", postcode: data.postcode ?? "" };
  } catch {
    return { address: "", postcode: "" };
  }
};

export interface ExtractedInsuranceCertificate {
  policyStartDate: string;
  policyEndDate: string;
}

const EMPTY_INSURANCE: ExtractedInsuranceCertificate = {
  policyStartDate: "",
  policyEndDate: "",
};

export const extractInsuranceCertificate = async (
  file: File,
): Promise<ExtractedInsuranceCertificate> => {
  const form = new FormData();
  form.append("file", file);
  try {
    const { data } = await fleetApi.post("/fleet/ocr/insurance-certificate", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return { ...EMPTY_INSURANCE, ...data };
  } catch {
    return { ...EMPTY_INSURANCE };
  }
};
