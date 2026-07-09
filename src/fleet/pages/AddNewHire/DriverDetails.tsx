import React, { useState } from "react";
import { toast } from "react-toastify";
import { FleetTextInput, FleetDateField } from "../../components/fields";
import FleetUploadModal from "../../components/FleetUploadModal";
import { DriverDetailsForm } from "../../types/hire";
import { extractDriverDetailsFromLicence } from "../../services/driverService";
import { useHire } from "./HireContext";

// Form field -> backend column (fleet_hire).
const TO_BACKEND: Record<keyof DriverDetailsForm, string> = {
  name: "driver_name",
  address: "driver_address",
  postcode: "driver_postcode",
  email: "driver_email",
  telephone: "driver_telephone",
  mobile: "driver_mobile",
  drivingLicenceNumber: "driving_licence_number",
  nationalInsuranceNumber: "national_insurance_number",
  dateOfBirth: "date_of_birth",
};

const EMPTY: DriverDetailsForm = {
  name: "",
  address: "",
  postcode: "",
  email: "",
  telephone: "",
  mobile: "",
  drivingLicenceNumber: "",
  nationalInsuranceNumber: "",
  dateOfBirth: "",
};

const UploadPrompt = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-12 h-12 text-neutral-300" aria-hidden>
    <path d="M12 15V4m0 0 4 4m-4-4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const DriverDetails: React.FC = () => {
  const [form, setForm] = useState<DriverDetailsForm>(EMPTY);
  const [ocrFields, setOcrFields] = useState<Set<keyof DriverDetailsForm>>(new Set());
  const [uploadOpen, setUploadOpen] = useState(false);
  const [licenceFile, setLicenceFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const { save } = useHire();

  const set = <K extends keyof DriverDetailsForm>(key: K, value: DriverDetailsForm[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  // Field-level save on blur (mirrors the Claims side).
  const saveField = (key: keyof DriverDetailsForm) => {
    save({ [TO_BACKEND[key]]: form[key] });
  };

  const handleUploaded = (file: File) => {
    setLicenceFile(file);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(file.type.startsWith("image/") ? URL.createObjectURL(file) : null);

    // OCR extract + auto-populate (Name/Address/Postcode/DL Number/DOB). The rest
    // (Email/Telephone/Mobile/NI Number) are manual per the story.
    const data = extractDriverDetailsFromLicence(file);
    setForm((f) => ({
      ...f,
      name: data.name,
      address: data.address,
      postcode: data.postcode,
      drivingLicenceNumber: data.drivingLicenceNumber,
      dateOfBirth: data.dateOfBirth,
    }));
    setOcrFields(new Set(["name", "address", "postcode", "drivingLicenceNumber", "dateOfBirth"]));
    // Persist the OCR-extracted fields.
    save({
      driver_name: data.name,
      driver_address: data.address,
      driver_postcode: data.postcode,
      driving_licence_number: data.drivingLicenceNumber,
      date_of_birth: data.dateOfBirth,
    });
    toast.success("Driver details extracted from licence.");
  };

  return (
    <div className="w-full max-w-[788px] flex flex-col gap-6 font-['Stack_Sans_Headline']">
      <h2 className="text-black text-2xl font-semibold leading-6">Driver Details</h2>

      {/* Driving License upload + preview */}
      <section className="p-5 rounded-lg outline outline-1 -outline-offset-1 outline-neutral-100 flex flex-col gap-4">
        <h3 className="text-black text-xl font-semibold leading-5">Driving License</h3>
        <div className="h-px bg-neutral-100" />

        {licenceFile ? (
          <div className="flex flex-col gap-3">
            <div className="p-4 rounded-lg outline outline-1 -outline-offset-1 outline-neutral-200 flex flex-col items-center gap-3">
              {previewUrl ? (
                <img src={previewUrl} alt="Driving licence" className="max-h-64 max-w-full rounded object-contain" />
              ) : (
                <div className="px-6 py-8 text-neutral-500 text-sm">PDF uploaded — {licenceFile.name}</div>
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-neutral-500 text-sm truncate">{licenceFile.name}</span>
              <button
                type="button"
                onClick={() => setUploadOpen(true)}
                className="text-neutral-900 text-sm font-medium underline underline-offset-2"
              >
                Replace
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setUploadOpen(true)}
            className="p-10 rounded-lg border-2 border-dashed border-neutral-200 flex flex-col items-center justify-center gap-4 hover:bg-neutral-50 transition-colors"
          >
            <UploadPrompt />
            <div className="flex flex-col items-center gap-1">
              <span className="text-black text-base font-semibold">Upload Driving License</span>
              <span className="text-black text-sm font-normal">JPG, PNG, PDF Supported</span>
            </div>
          </button>
        )}
      </section>

      {/* License Details */}
      <section className="p-5 rounded-lg outline outline-1 -outline-offset-1 outline-neutral-100 flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h3 className="text-black text-xl font-semibold leading-5">License Details</h3>
          <div className="h-px bg-neutral-100" />
        </div>

        <FleetTextInput
          label="Name"
          placeholder="Enter Name"
          value={form.name}
          onChange={(v) => set("name", v)}
          onBlur={() => saveField("name")}
          ocrFilled={ocrFields.has("name")}
        />
        <FleetTextInput
          label="Address"
          placeholder="Enter Address"
          value={form.address}
          onChange={(v) => set("address", v)}
          onBlur={() => saveField("address")}
          ocrFilled={ocrFields.has("address")}
        />

        <div className="grid grid-cols-2 gap-5">
          <FleetTextInput
            label="Post Code"
            placeholder="Enter Code"
            value={form.postcode}
            onChange={(v) => set("postcode", v)}
            onBlur={() => saveField("postcode")}
            ocrFilled={ocrFields.has("postcode")}
          />
          <FleetTextInput
            label="Email"
            placeholder="Enter Email"
            inputMode="email"
            value={form.email}
            onChange={(v) => set("email", v)}
            onBlur={() => saveField("email")}
          />
        </div>

        <div className="grid grid-cols-2 gap-5">
          <FleetTextInput
            label="Telephone"
            placeholder="Enter Number"
            inputMode="tel"
            value={form.telephone}
            onChange={(v) => set("telephone", v)}
            onBlur={() => saveField("telephone")}
          />
          <FleetTextInput
            label="Mobile"
            placeholder="Enter Number"
            inputMode="tel"
            value={form.mobile}
            onChange={(v) => set("mobile", v)}
            onBlur={() => saveField("mobile")}
          />
        </div>

        <div className="grid grid-cols-2 gap-5">
          <FleetTextInput
            label="Driving Licence Number"
            placeholder="Enter Number"
            value={form.drivingLicenceNumber}
            onChange={(v) => set("drivingLicenceNumber", v)}
            onBlur={() => saveField("drivingLicenceNumber")}
            ocrFilled={ocrFields.has("drivingLicenceNumber")}
          />
          <FleetTextInput
            label="National Insurance Number"
            placeholder="Enter Number"
            value={form.nationalInsuranceNumber}
            onChange={(v) => set("nationalInsuranceNumber", v)}
            onBlur={() => saveField("nationalInsuranceNumber")}
          />
        </div>

        <div className="grid grid-cols-2 gap-5">
          <FleetDateField
            label="Date of Birth"
            value={form.dateOfBirth}
            onChange={(v) => set("dateOfBirth", v)}
            onBlur={() => saveField("dateOfBirth")}
            ocrFilled={ocrFields.has("dateOfBirth")}
          />
          <div />
        </div>
      </section>

      <FleetUploadModal open={uploadOpen} onClose={() => setUploadOpen(false)} onUploaded={handleUploaded} />
    </div>
  );
};

export default DriverDetails;
