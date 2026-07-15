import React, { useState, useEffect, useRef } from "react";
import { toast } from "react-toastify";
import {
  FleetTextInput,
  FleetDateField,
  FleetPostcodeLookup,
  FleetAddressAutocomplete,
  FleetUkMobileInput,
  formatUkMobileDisplay,
  isValidUkMobile,
  toUkMobileE164,
} from "../../components/fields";
import FleetUploadModal from "../../components/FleetUploadModal";
import type { DriverDetailsForm } from "../../types/hire";
import { extractDriverDetailsFromLicence } from "../../services/driverService";
import { getHireDocuments, uploadHireDocument, deleteHireDocument, getHireDocumentFileUrl } from "../../services/hireService";
import FleetSpinnerLoader from "../../components/FleetSpinnerLoader";
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
const LOW_CONFIDENCE_MSG = "Low Confidence OCR Result - Please Verify";

const DriverDetails: React.FC = () => {
  const [form, setForm] = useState<DriverDetailsForm>(EMPTY);
  // True after a licence upload — any OCR-target field still empty then is flagged red.
  const [ocrAttempted, setOcrAttempted] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [licenceName, setLicenceName] = useState("");
  const [licenceLoading, setLicenceLoading] = useState(false);

  const { hire, hireId, save } = useHire();
  const hydrated = useRef(false);
  const licenceHydrated = useRef(false);

  // Restore the saved licence preview on reopen (the image is persisted as a doc and
  // streamed back through the auth-checked file endpoint).
  useEffect(() => {
    if (licenceHydrated.current || !hireId) return;
    licenceHydrated.current = true;
    setLicenceLoading(true);
    getHireDocuments(hireId)
      .then(async (docs) => {
        // Newest licence doc (in case an old one hasn't finished deleting yet).
        const lic = docs.filter((d) => d.doc_type === LICENCE_DOC_TYPE).sort((a, b) => b.id - a.id)[0];
        if (lic) {
          setLicenceName(lic.filename || "Driving licence");
          if (IMG_EXT.test(lic.filename || "")) {
            setPreviewUrl(await getHireDocumentFileUrl(hireId, lic.id));
          }
        }
      })
      .finally(() => setLicenceLoading(false));
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
      mobile: formatUkMobileDisplay(hire.driver_mobile || ""),
      drivingLicenceNumber: hire.driving_licence_number || "",
      nationalInsuranceNumber: hire.national_insurance_number || "",
      dateOfBirth: hire.date_of_birth || "",
    });
  }, [hire]);

  const set = <K extends keyof DriverDetailsForm>(key: K, value: DriverDetailsForm[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  // Field-level save on blur (mirrors the Claims side).
  const saveField = (key: keyof DriverDetailsForm) => {
    if (key === "mobile" && form.mobile && !isValidUkMobile(form.mobile)) return;
    const value = key === "mobile" ? toUkMobileE164(form.mobile) : form[key];
    save({ [TO_BACKEND[key]]: value });
  };

  const handleUploaded = async (file: File) => {
    setLicenceName(file.name);
    if (previewUrl && previewUrl.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(file.type.startsWith("image/") ? URL.createObjectURL(file) : null);
    // Persist the licence image (REPLACING any previous one) so the preview that
    // restores on reopen is the newly-uploaded licence, not a stale one.
    if (hireId) {
      getHireDocuments(hireId).then((existing) => {
        existing
          .filter((d) => d.doc_type === LICENCE_DOC_TYPE)
          .forEach((d) => deleteHireDocument(hireId, d.id));
        uploadHireDocument(hireId, LICENCE_DOC_TYPE, file);
      });
    }

    // Real OCR extract (Name/Address/Postcode/DL Number/DOB). Loading is shown by
    // the upload modal itself, so no separate spinner here.
    const data = await extractDriverDetailsFromLicence(file);
    const map: [keyof DriverDetailsForm, string][] = [
      ["name", data.name],
      ["address", data.address],
      ["postcode", data.postcode],
      ["drivingLicenceNumber", data.drivingLicenceNumber],
      ["dateOfBirth", data.dateOfBirth],
    ];
    const updates: Partial<DriverDetailsForm> = {};
    const filled = new Set<keyof DriverDetailsForm>();
    for (const [key, value] of map) {
      if (value) {
        updates[key] = value;
        filled.add(key);
      }
    }
    // Uploading a licence is a clean REPLACE: empty the form, then fill with the new
    // licence's data (so stale values / a previous licence's data don't linger).
    setForm({ ...EMPTY, ...updates });
    // Now any OCR-target field left empty renders the red "verify" hint (reactively).
    setOcrAttempted(true);
    // Persist the whole replaced form — new OCR values, everything else cleared.
    const fullSave: Record<string, string> = {};
    (Object.keys(TO_BACKEND) as (keyof DriverDetailsForm)[]).forEach((k) => {
      fullSave[TO_BACKEND[k]] = k === "mobile" ? toUkMobileE164((updates[k] as string) || "") : ((updates[k] as string) || "");
    });
    save(fullSave);
    if (filled.size) toast.success("Driver details extracted from licence.");
    else toast.info("Couldn't read the licence — please enter the details manually.");
  };

  return (
    <div className="w-full max-w-[788px] flex flex-col gap-6 font-sans-headline">
      {licenceLoading && <FleetSpinnerLoader />}
      <h2 className="text-black text-2xl font-semibold leading-6">Driver Details</h2>

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
          error={ocrAttempted && !form.name ? LOW_CONFIDENCE_MSG : undefined}
        />
        <FleetAddressAutocomplete
          label="Address"
          placeholder="Enter Address"
          address={form.address}
          onChange={(v) => set("address", v)}
          onBlur={() => saveField("address")}
          onPlaceSelected={(place) => {
            set("address", place.address);
            if (place.postcode) set("postcode", place.postcode);
            save({
              [TO_BACKEND.address]: place.address,
              ...(place.postcode ? { [TO_BACKEND.postcode]: place.postcode } : {}),
            });
          }}
          error={ocrAttempted && !form.address ? LOW_CONFIDENCE_MSG : undefined}
        />

        <div className="grid grid-cols-2 gap-5">
          <FleetPostcodeLookup
            label="Post Code"
            placeholder="Enter Code"
            postcode={form.postcode}
            onChange={(v) => set("postcode", v)}
            onBlur={() => saveField("postcode")}
            error={ocrAttempted && !form.postcode ? LOW_CONFIDENCE_MSG : undefined}
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
            error={ocrAttempted && !form.email ? LOW_CONFIDENCE_MSG : undefined}
          />
        </div>

        <div className="grid grid-cols-2 gap-5">
          <FleetTextInput
            label="Home Telephone"
            placeholder="Enter Number"
            inputMode="tel"
            value={form.telephone}
            onChange={(v) => set("telephone", v)}
            onBlur={() => saveField("telephone")}
            error={ocrAttempted && !form.telephone ? LOW_CONFIDENCE_MSG : undefined}
          />
          <FleetUkMobileInput
            label="Mobile Number"
            value={form.mobile}
            onChange={(v) => set("mobile", v)}
            onBlur={() => saveField("mobile")}
            error={
              form.mobile && !isValidUkMobile(form.mobile)
                ? "Enter a valid UK mobile number"
                : ocrAttempted && !form.mobile
                  ? LOW_CONFIDENCE_MSG
                  : undefined
            }
          />
        </div>

        <div className="grid grid-cols-2 gap-5">
          <FleetTextInput
            label="Driving Licence Number"
            placeholder="Enter Number"
            value={form.drivingLicenceNumber}
            onChange={(v) => set("drivingLicenceNumber", v)}
            onBlur={() => saveField("drivingLicenceNumber")}
            error={ocrAttempted && !form.drivingLicenceNumber ? LOW_CONFIDENCE_MSG : undefined}
          />
          <FleetTextInput
            label="National Insurance Number"
            placeholder="Enter Number"
            value={form.nationalInsuranceNumber}
            onChange={(v) => set("nationalInsuranceNumber", v)}
            onBlur={() => saveField("nationalInsuranceNumber")}
            error={ocrAttempted && !form.nationalInsuranceNumber ? LOW_CONFIDENCE_MSG : undefined}
          />
        </div>

        <div className="grid grid-cols-2 gap-5">
          <FleetDateField
            label="Date of Birth"
            value={form.dateOfBirth}
            onChange={(v) => set("dateOfBirth", v)}
            onBlur={() => saveField("dateOfBirth")}
            error={ocrAttempted && !form.dateOfBirth ? LOW_CONFIDENCE_MSG : undefined}
          />
          <div />
        </div>
      </section>

      <FleetUploadModal open={uploadOpen} onClose={() => setUploadOpen(false)} onUploaded={handleUploaded} />
    </div>
  );
};

export default DriverDetails;
