import React, { useState, useEffect, useRef } from "react";
import { toast } from "react-toastify";
import { FleetTextInput, FleetDateField } from "../../components/fields";
import FleetUploadModal from "../../components/FleetUploadModal";
import FleetSpinnerLoader from "../../components/FleetSpinnerLoader";
import { extractTaxiBadge } from "../../services/driverService";
import {
  getHireDocuments,
  uploadHireDocument,
  deleteHireDocument,
  getHireDocumentFileUrl,
} from "../../services/hireService";
import type { TaxiBadgeForm } from "../../types/hire";
import { useHire } from "./HireContext";

const BADGE_DOC_TYPE = "taxi_badge";
const IMG_EXT = /\.(png|jpe?g|gif|webp|bmp)$/i;
const LOW_CONFIDENCE_MSG = "Low Confidence OCR Result - Please Verify";

const TO_BACKEND: Record<keyof TaxiBadgeForm, string> = {
  badgeNumber: "taxi_badge_number",
  name: "taxi_badge_name",
  expiry: "taxi_badge_expiry",
  council: "taxi_badge_council",
  badgeType: "taxi_badge_type",
};

const EMPTY: TaxiBadgeForm = {
  badgeNumber: "",
  name: "",
  expiry: "",
  council: "",
  badgeType: "",
};

// OCR returns dd-mm-yyyy; the date field + backend want yyyy-mm-dd.
const toIsoDate = (value: string): string => {
  const match = /^(\d{2})-(\d{2})-(\d{4})$/.exec(value.trim());
  return match ? `${match[3]}-${match[2]}-${match[1]}` : value;
};

const TaxiBadgeDetails: React.FC = () => {
  const [form, setForm] = useState<TaxiBadgeForm>(EMPTY);
  const [ocrAttempted, setOcrAttempted] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [badgeName, setBadgeName] = useState("");
  const [badgeLoading, setBadgeLoading] = useState(false);

  const { hire, hireId, save } = useHire();
  const hydrated = useRef(false);
  const badgeHydrated = useRef(false);

  // Restore the saved badge image on reopen.
  useEffect(() => {
    if (badgeHydrated.current || !hireId) return;
    badgeHydrated.current = true;
    setBadgeLoading(true);
    getHireDocuments(hireId)
      .then(async (docs) => {
        const badge = docs.filter((d) => d.doc_type === BADGE_DOC_TYPE).sort((a, b) => b.id - a.id)[0];
        if (badge) {
          setBadgeName(badge.filename || "Taxi badge");
          if (IMG_EXT.test(badge.filename || "")) {
            setPreviewUrl(await getHireDocumentFileUrl(hireId, badge.id));
          }
        }
      })
      .finally(() => setBadgeLoading(false));
  }, [hireId]);

  // Pre-fill from the saved hire once.
  useEffect(() => {
    if (hydrated.current || !hire) return;
    hydrated.current = true;
    setForm({
      badgeNumber: hire.taxi_badge_number || "",
      name: hire.taxi_badge_name || "",
      expiry: hire.taxi_badge_expiry || "",
      council: hire.taxi_badge_council || "",
      badgeType: hire.taxi_badge_type || "",
    });
  }, [hire]);

  const set = <K extends keyof TaxiBadgeForm>(key: K, value: TaxiBadgeForm[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const saveField = (key: keyof TaxiBadgeForm) => save({ [TO_BACKEND[key]]: form[key] || null });

  const handleUploaded = async (file: File) => {
    setBadgeName(file.name);
    if (previewUrl && previewUrl.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(file.type.startsWith("image/") ? URL.createObjectURL(file) : null);

    // Persist the badge image, replacing any previous one.
    if (hireId) {
      getHireDocuments(hireId).then((existing) => {
        existing
          .filter((d) => d.doc_type === BADGE_DOC_TYPE)
          .forEach((d) => deleteHireDocument(hireId, d.id));
        uploadHireDocument(hireId, BADGE_DOC_TYPE, file);
      });
    }

    const data = await extractTaxiBadge(file);
    const updates: Partial<TaxiBadgeForm> = {};
    if (data.badgeNumber) updates.badgeNumber = data.badgeNumber;
    if (data.name) updates.name = data.name;
    if (data.expiry) updates.expiry = toIsoDate(data.expiry);
    if (data.council) updates.council = data.council;
    if (data.badgeType) updates.badgeType = data.badgeType;

    // Uploading a badge is a clean REPLACE so a previous badge's data can't linger.
    setForm({ ...EMPTY, ...updates });
    setOcrAttempted(true);

    const fullSave: Record<string, string | null> = {};
    (Object.keys(TO_BACKEND) as (keyof TaxiBadgeForm)[]).forEach((k) => {
      fullSave[TO_BACKEND[k]] = (updates[k] as string) || null;
    });
    save(fullSave);

    if (Object.keys(updates).length) toast.success("Taxi badge details extracted.");
    else toast.info("Couldn't read the badge — please enter the details manually.");
  };

  return (
    <div className="w-full max-w-[788px] flex flex-col gap-6 font-sans-headline">
      {badgeLoading && <FleetSpinnerLoader />}
      <h2 className="text-black text-2xl font-semibold leading-6">Taxi Badge</h2>

      {/* Badge upload + preview */}
      <section className="p-5 rounded-lg outline outline-1 -outline-offset-1 outline-neutral-100 flex flex-col gap-4">
        <h3 className="text-black text-xl font-semibold leading-5">Taxi Badge</h3>
        <div className="h-px bg-neutral-100" />

        {badgeName ? (
          <div className="flex flex-col gap-3">
            <div className="p-4 rounded-lg outline outline-1 -outline-offset-1 outline-neutral-200 flex flex-col items-center gap-3">
              {previewUrl ? (
                <img src={previewUrl} alt="Taxi badge" className="max-h-64 max-w-full rounded object-contain" />
              ) : (
                <div className="px-6 py-8 text-neutral-500 text-sm">PDF uploaded — {badgeName}</div>
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-neutral-500 text-sm truncate">{badgeName}</span>
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
            className="p-6 rounded-lg border-2 border-dashed border-neutral-200 flex flex-col items-center justify-center gap-4 hover:bg-neutral-50 transition-colors"
          >
            <svg viewBox="0 0 24 24" fill="none" className="w-12 h-12 text-neutral-300" aria-hidden>
              <path d="M12 15V4m0 0 4 4m-4-4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <div className="flex flex-col items-center gap-1">
              <span className="text-black text-base font-semibold">Upload Taxi Badge</span>
              <span className="text-black text-sm">JPG, PNG, PDF Supported</span>
            </div>
          </button>
        )}
      </section>

      {/* Badge details — auto-filled from the badge, all editable. */}
      <section className="p-5 rounded-lg outline outline-1 -outline-offset-1 outline-neutral-100 flex flex-col gap-4">
        <h3 className="text-black text-xl font-semibold leading-5">Badge Details</h3>
        <div className="h-px bg-neutral-100" />

        <div className="grid grid-cols-2 gap-5">
          <FleetTextInput
            label="Badge / Licence Number"
            placeholder="e.g. 25/05927"
            value={form.badgeNumber}
            onChange={(v) => set("badgeNumber", v)}
            onBlur={() => saveField("badgeNumber")}
            error={ocrAttempted && !form.badgeNumber ? LOW_CONFIDENCE_MSG : undefined}
          />
          <FleetTextInput
            label="Name on Badge"
            placeholder="Enter Name"
            value={form.name}
            onChange={(v) => set("name", v)}
            onBlur={() => saveField("name")}
            error={ocrAttempted && !form.name ? LOW_CONFIDENCE_MSG : undefined}
          />
        </div>

        <div className="grid grid-cols-2 gap-5">
          <FleetDateField
            label="Badge Expiry Date"
            value={form.expiry}
            onChange={(v) => {
              set("expiry", v);
              save({ [TO_BACKEND.expiry]: v || null });
            }}
            error={ocrAttempted && !form.expiry ? LOW_CONFIDENCE_MSG : undefined}
          />
          <FleetTextInput
            label="Badge Type"
            placeholder="e.g. Private Hire Driver"
            value={form.badgeType}
            onChange={(v) => set("badgeType", v)}
            onBlur={() => saveField("badgeType")}
            error={ocrAttempted && !form.badgeType ? LOW_CONFIDENCE_MSG : undefined}
          />
        </div>

        <FleetTextInput
          label="Issuing Council / Authority"
          placeholder="e.g. Solihull Metropolitan Borough Council"
          value={form.council}
          onChange={(v) => set("council", v)}
          onBlur={() => saveField("council")}
          error={ocrAttempted && !form.council ? LOW_CONFIDENCE_MSG : undefined}
        />
      </section>

      <FleetUploadModal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onUploaded={handleUploaded}
        title="Upload Taxi Badge"
      />
    </div>
  );
};

export default TaxiBadgeDetails;
