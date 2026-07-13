import React, { useState, useEffect, useRef } from "react";
import { toast } from "react-toastify";
import { FleetTextInput, FleetDateField, FleetInlineLoader, FleetPostcodeLookup } from "../../components/fields";
import FleetUploadModal from "../../components/FleetUploadModal";
import type { DriverDetailsForm } from "../../types/hire";
import { extractDriverDetailsFromLicence } from "../../services/driverService";
import { getHireDocuments, uploadHireDocument } from "../../services/hireService";
import { useHire } from "./HireContext";

const LICENCE_DOC_TYPE = "driving_licence";
const IMG_EXT = /\.(png|jpe?g|gif|webp|bmp)$/i;

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

// Fields the licence OCR tries to fill. Any that come back empty are flagged as
// low-confidence (red) so the user knows to verify / enter them manually.
const OCR_FIELDS: (keyof DriverDetailsForm)[] = ["name", "address", "postcode", "drivingLicenceNumber", "dateOfBirth"];
const LOW_CONFIDENCE_MSG = "Low confidence OCR result - please verify.";

const DriverDetails: React.FC = () => {
  const [form, setForm] = useState<DriverDetailsForm>(EMPTY);
  // OCR-target fields that came back empty on the last extraction (show red + hint).
  const [lowConfidence, setLowConfidence] = useState<Set<keyof DriverDetailsForm>>(new Set());
  const [uploadOpen, setUploadOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [licenceName, setLicenceName] = useState("");
  const [ocrLoading, setOcrLoading] = useState(false);

  const { hire, hireId, save } = useHire();
  const hydrated = useRef(false);
  const licenceHydrated = useRef(false);

  // Restore the saved licence preview on reopen (the image is persisted as a doc).
  useEffect(() => {
    if (licenceHydrated.current || !hireId) return;
    licenceHydrated.current = true;
    getHireDocuments(hireId).then((docs) => {
      const lic = docs.find((d) => d.doc_type === LICENCE_DOC_TYPE);
      if (lic) {
        setLicenceName(lic.filename || "Driving licence");
        if (IMG_EXT.test(lic.filename || "")) setPreviewUrl(lic.file_url || null);
      }
    });
  }, [hireId]);

  // Pre-fill from the saved hire once (reopen an existing hire / after creation).
  useEffect(() => {
    if (hydrated.current || !hire) return;
    hydrated.current = true;
    setForm({
      name: hire.driver_name || "",
      address: hire.driver_address || "",
      postcode: hire.driver_postcode || "",
      email: hire.driver_email || "",
      telephone: hire.driver_telephone || "",
      mobile: hire.driver_mobile || "",
      drivingLicenceNumber: hire.driving_licence_number || "",
      nationalInsuranceNumber: hire.national_insurance_number || "",
      dateOfBirth: hire.date_of_birth || "",
    });
  }, [hire]);

  const set = <K extends keyof DriverDetailsForm>(key: K, value: DriverDetailsForm[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    // Editing a flagged field clears its low-confidence warning (user is verifying it).
    setLowConfidence((prev) => {
      if (!prev.has(key)) return prev;
      const next = new Set(prev);
      next.delete(key);
      return next;
    });
  };

  // Field-level save on blur (mirrors the Claims side).
  const saveField = (key: keyof DriverDetailsForm) => {
    save({ [TO_BACKEND[key]]: form[key] });
  };

  const handleUploaded = async (file: File) => {
    setLicenceName(file.name);
    if (previewUrl && previewUrl.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(file.type.startsWith("image/") ? URL.createObjectURL(file) : null);
    // Persist the licence image so the preview survives leaving/reopening the screen.
    if (hireId) uploadHireDocument(hireId, LICENCE_DOC_TYPE, file);

    // Real OCR extract + auto-populate (Name/Address/Postcode/DL Number/DOB). The
    // rest (Email/Telephone/Mobile/NI Number) are manual per the story.
    setOcrLoading(true);
    let data;
    try {
      data = await extractDriverDetailsFromLicence(file);
    } finally {
      setOcrLoading(false);
    }
    const map: [keyof DriverDetailsForm, string][] = [
      ["name", data.name],
      ["address", data.address],
      ["postcode", data.postcode],
      ["drivingLicenceNumber", data.drivingLicenceNumber],
      ["dateOfBirth", data.dateOfBirth],
    ];
    const updates: Partial<DriverDetailsForm> = {};
    const back: Record<string, string> = {};
    const filled = new Set<keyof DriverDetailsForm>();
    for (const [key, value] of map) {
      if (value) {
        updates[key] = value;
        back[TO_BACKEND[key]] = value;
        filled.add(key);
      }
    }
    setForm((f) => ({ ...f, ...updates }));
    // Flag every OCR-target field the extraction couldn't fill.
    setLowConfidence(new Set(OCR_FIELDS.filter((k) => !filled.has(k))));
    if (Object.keys(back).length) save(back); // persist only what OCR found
    if (filled.size) toast.success("Driver details extracted from licence.");
    else toast.info("Couldn't read the licence — please enter the details manually.");
  };

  return (
    <div className="w-full max-w-[788px] flex flex-col gap-6 font-sans-headline">
      <h2 className="text-black text-2xl font-semibold leading-6">Driver Details</h2>
      {ocrLoading && <FleetInlineLoader text="Reading licence…" />}

      {/* Driving License upload + preview */}
      <section className="p-5 rounded-lg outline outline-1 -outline-offset-1 outline-neutral-100 flex flex-col gap-4">
        <h3 className="text-black text-xl font-semibold leading-5">Driving License</h3>
        <div className="h-px bg-neutral-100" />

        {licenceName ? (
          <div className="flex flex-col gap-3">
            <div className="p-4 rounded-lg outline outline-1 -outline-offset-1 outline-neutral-200 flex flex-col items-center gap-3">
              {previewUrl ? (
                <img src={previewUrl} alt="Driving licence" className="max-h-64 max-w-full rounded object-contain" />
              ) : (
                <div className="px-6 py-8 text-neutral-500 text-sm">PDF uploaded — {licenceName}</div>
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-neutral-500 text-sm truncate">{licenceName}</span>
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
          error={lowConfidence.has("name") ? LOW_CONFIDENCE_MSG : undefined}
        />
        <FleetTextInput
          label="Address"
          placeholder="Enter Address"
          value={form.address}
          onChange={(v) => set("address", v)}
          onBlur={() => saveField("address")}
          error={lowConfidence.has("address") ? LOW_CONFIDENCE_MSG : undefined}
        />

        <div className="grid grid-cols-2 gap-5">
          <FleetPostcodeLookup
            label="Post Code"
            postcode={form.postcode}
            onChange={(v) => set("postcode", v)}
            onBlur={() => saveField("postcode")}
            error={lowConfidence.has("postcode") ? LOW_CONFIDENCE_MSG : undefined}
            onAddressSelect={(addr) => {
              set("address", addr.address);
              set("postcode", addr.postcode);
              save({ [TO_BACKEND.address]: addr.address, [TO_BACKEND.postcode]: addr.postcode });
            }}
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
            error={lowConfidence.has("drivingLicenceNumber") ? LOW_CONFIDENCE_MSG : undefined}
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
            error={lowConfidence.has("dateOfBirth") ? LOW_CONFIDENCE_MSG : undefined}
          />
          <div />
        </div>
      </section>

      <FleetUploadModal open={uploadOpen} onClose={() => setUploadOpen(false)} onUploaded={handleUploaded} />
    </div>
  );
};

export default DriverDetails;
