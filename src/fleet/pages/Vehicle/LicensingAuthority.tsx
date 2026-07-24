import React, { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { Plus, Mail } from "lucide-react";
import { FleetTextInput, FleetDateField, FleetTimeSelect, FleetAddressAutocomplete, FleetPostcodeLookup, FleetUkMobileInput } from "../../components/fields";
import FleetSpinnerLoader from "../../components/FleetSpinnerLoader";
import FleetUploadModal from "../../components/FleetUploadModal";
import FleetEmailModal, { type FleetEmailSendArgs } from "../../components/FleetEmailModal";
import FleetConfirmModal from "../../components/FleetConfirmModal";
import FleetUploadedFileBar from "../../components/FleetUploadedFileBar";
import UploadFileIcon from "../../assets/icons/UploadFile.svg";
import RemoveIcon from "../../assets/icons/Remove.svg";
import {
  listVehicleDocuments,
  getVehicleDocumentFileUrl,
  type VehicleDocument,
} from "../../services/vehicleRecordService";
import {
  createLicensingAuthority,
  deleteLicensingAuthority,
  extractMotCertificate,
  extractPlatingCertificate,
  listLicensingAuthorities,
  getAppointmentEmailPreview,
  sendAppointmentPassedEmail,
  updateLicensingAuthority,
  uploadCertificate,
  MAX_LICENSING_AUTHORITIES,
  type CertificateKind,
  type LicensingAuthority as Authority,
} from "../../services/licensingAuthorityService";
import { useVehicle } from "./VehicleContext";

const SECTION = "self-stretch p-5 rounded-lg outline outline-1 -outline-offset-1 outline-neutral-100 flex flex-col gap-4";
const H3 = "text-black text-xl font-semibold leading-5";
const BTN_DARK = "h-8 px-3 py-2 bg-neutral-900 rounded text-white text-sm inline-flex items-center justify-center gap-2 hover:bg-black disabled:opacity-70";
const LOW_CONFIDENCE_MSG = "Low Confidence OCR Result - Please Verify";

const PLATING_OCR_FIELDS = [
  "licensing_authority",
  "address",
  "postcode",
  "telephone",
  "contact_number",
  "email_address",
  "plate_number",
  "plating_start_date",
  "plating_expiry_date",
] as const;

const MOT_OCR_FIELDS = [
  "mot_centre_name",
  "mot_address",
  "mot_postcode",
  "mot_telephone",
  "mot_email_address",
  "last_mot_date",
  "mot_expiry_date",
] as const;

// OCR returns dd-mm-yyyy; the date field wants yyyy-mm-dd.
const toIsoDate = (value: string): string => {
  const m = value.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
  return m ? `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}` : value;
};

const Checkbox: React.FC<{ checked: boolean; label: string; onChange: (v: boolean) => void }> = ({
  checked,
  label,
  onChange,
}) => (
  <button type="button" onClick={() => onChange(!checked)} className="flex items-center gap-2 text-left">
    <span
      className={`w-5 h-5 shrink-0 rounded-sm flex items-center justify-center ${
        checked ? "bg-neutral-900 border-[6px] border-neutral-500" : "bg-neutral-300"
      }`}
    />
    <span className="text-black text-sm leading-4">{label}</span>
  </button>
);

const LicensingAuthority: React.FC = () => {
  const { vehicle, loading: recordLoading } = useVehicle();
  const recordId = vehicle?.id ?? null;

  const [authorities, setAuthorities] = useState<Authority[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [uploadKind, setUploadKind] = useState<CertificateKind | null>(null);
  const [email, setEmail] = useState<
    { kind: CertificateKind; authorityId: number; to: string; subject: string; body: string; html: string } | null
  >(null);
  const [preparingEmail, setPreparingEmail] = useState(false);
  const [platingDocs, setPlatingDocs] = useState<VehicleDocument[]>([]);
  const [motDocs, setMotDocs] = useState<VehicleDocument[]>([]);
  // Never a blank white page — render the form and overlay the loader until ready.
  const [pageReady, setPageReady] = useState(false);
  // Delete goes through a confirmation modal rather than removing immediately.
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null);
  // Shows a loader while a certificate is fetched for viewing (the eye icon).
  const [viewingDoc, setViewingDoc] = useState(false);
  // Shows a loader while the active card's certificates are (re)fetched on switch.
  const [certsLoading, setCertsLoading] = useState(false);
  // Per authority: fields the latest OCR upload did not return.
  const [ocrMissing, setOcrMissing] = useState<Record<number, Record<string, boolean>>>({});

  const active = authorities[activeIndex] ?? null;
  const activeId = active?.id ?? null;
  const missing = (field: string): string | undefined => {
    const value = active ? (active as unknown as Record<string, unknown>)[field] : undefined;
    return activeId && ocrMissing[activeId]?.[field] && !String(value ?? "").trim()
      ? LOW_CONFIDENCE_MSG
      : undefined;
  };

  // Certificate history for the active authority — every uploaded plating/MOT
  // certificate stays viewable (latest + "Show all"), like the V5C on screen 1.
  // Keyed on the id (not the record object) so editing a field doesn't refetch.
  const loadCertificates = useCallback(async () => {
    if (!recordId || !activeId) {
      setPlatingDocs([]);
      setMotDocs([]);
      return;
    }
    setCertsLoading(true);
    try {
      const [plating, mot] = await Promise.all([
        listVehicleDocuments(recordId, "plating", activeId),
        listVehicleDocuments(recordId, "mot", activeId),
      ]);
      setPlatingDocs(plating);
      setMotDocs(mot);
    } finally {
      setCertsLoading(false);
    }
  }, [recordId, activeId]);

  useEffect(() => {
    loadCertificates();
  }, [loadCertificates]);

  const openDocument = async (docId: number) => {
    if (!recordId) return;
    setViewingDoc(true);
    try {
      const url = await getVehicleDocumentFileUrl(recordId, docId);
      if (url) window.open(url, "_blank", "noopener,noreferrer");
      else toast.error("Could not open the file.");
    } finally {
      setViewingDoc(false);
    }
  };

  const load = useCallback(async () => {
    if (!recordId) return;
    setLoading(true);
    try {
      let rows = await listLicensingAuthorities(recordId);
      // Every vehicle has at least one authority, so the form is never empty.
      if (rows.length === 0) {
        try {
          const created = await createLicensingAuthority(recordId);
          rows = [created];
        } catch {
          rows = [];
        }
      }
      setAuthorities(rows);
      setActiveIndex((i) => Math.min(i, Math.max(0, rows.length - 1)));
    } finally {
      setLoading(false);
      setPageReady(true);
    }
  }, [recordId]);

  useEffect(() => {
    load();
  }, [load]);

  // Patch one field and keep the local row in step with the server's response.
  const patch = async (field: string, value: unknown) => patchMany({ [field]: value });

  // Several fields at once — used when a postcode/address lookup fills both.
  const patchMany = async (fields: Record<string, unknown>) => {
    if (!recordId || !active) return;
    setAuthorities((rows) =>
      rows.map((r) => (r.id === active.id ? { ...r, ...fields } : r)),
    );
    setOcrMissing((prev) => {
      const current = { ...(prev[active.id] || {}) };
      Object.entries(fields).forEach(([field, value]) => {
        if (value !== null && value !== undefined && String(value).trim() !== "") {
          delete current[field];
        }
      });
      return { ...prev, [active.id]: current };
    });
    const updated = await updateLicensingAuthority(recordId, active.id, fields);
    if (updated) {
      setAuthorities((rows) => rows.map((r) => (r.id === updated.id ? updated : r)));
    }
  };

  const handleAdd = async () => {
    if (!recordId) return;
    setBusy(true);
    try {
      const created = await createLicensingAuthority(recordId);
      setAuthorities((rows) => [...rows, created]);
      setActiveIndex(authorities.length);
    } catch (err) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      toast.warn(detail || `A vehicle can have at most ${MAX_LICENSING_AUTHORITIES} licensing authorities.`);
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteAt = async (index: number) => {
    const target = authorities[index];
    if (!recordId || !target) return;
    setBusy(true);
    try {
      await deleteLicensingAuthority(recordId, target.id);
      let remaining = authorities.filter((r) => r.id !== target.id);
      // Every vehicle keeps at least one authority — recreate a blank if the
      // last one was removed, so the form never disappears.
      if (remaining.length === 0) {
        try {
          const created = await createLicensingAuthority(recordId);
          remaining = [created];
        } catch {
          remaining = [];
        }
      }
      setAuthorities(remaining);
      // Keep the active tab in range after removing one.
      setActiveIndex((i) => Math.max(0, Math.min(i, remaining.length - 1)));
    } finally {
      setBusy(false);
    }
  };

  // A single upload fills BOTH the contact block and the detail block, per the
  // user story. Only blank fields are filled, so amendments survive a re-upload.
  const handleCertificate = async (kind: CertificateKind, file: File) => {
    if (!recordId || !active) return;
    // Progress is shown by the upload modal, so no full-screen spinner here.
    {
      const stored = await uploadCertificate(recordId, active.id, kind, file);
      if (!stored) {
        throw new Error("Could not upload the certificate.");
      }
      setAuthorities((rows) => rows.map((r) => (r.id === stored.id ? stored : r)));

      const payload: Record<string, unknown> = {};
      if (kind === "plating") {
        const p = await extractPlatingCertificate(file);
        const extracted = {
          licensing_authority: p.licensingAuthority,
          address: p.address,
          postcode: p.postcode,
          telephone: p.telephone,
          contact_number: p.contactNumber,
          email_address: p.emailAddress,
          plate_number: p.plateNumber,
          plating_start_date: p.platingStartDate ? toIsoDate(p.platingStartDate) : "",
          plating_expiry_date: p.platingExpiryDate ? toIsoDate(p.platingExpiryDate) : "",
        };
        if (p.licensingAuthority) payload.licensing_authority = p.licensingAuthority;
        if (p.address) payload.address = p.address;
        if (p.postcode) payload.postcode = p.postcode;
        if (p.telephone) payload.telephone = p.telephone;
        if (p.contactNumber) payload.contact_number = p.contactNumber;
        if (p.emailAddress) payload.email_address = p.emailAddress;
        if (p.plateNumber) payload.plate_number = p.plateNumber;
        if (p.platingStartDate) payload.plating_start_date = toIsoDate(p.platingStartDate);
        if (p.platingExpiryDate) payload.plating_expiry_date = toIsoDate(p.platingExpiryDate);
        setOcrMissing((prev) => {
          const current = { ...(prev[active.id] || {}) };
          PLATING_OCR_FIELDS.forEach((field) => {
            if (extracted[field]) delete current[field];
            else current[field] = true;
          });
          return { ...prev, [active.id]: current };
        });
      } else {
        const m = await extractMotCertificate(file);
        const extracted = {
          mot_centre_name: m.motCentreName,
          mot_address: m.address,
          mot_postcode: m.postcode,
          mot_telephone: m.telephone,
          mot_email_address: m.emailAddress,
          last_mot_date: m.lastMotDate ? toIsoDate(m.lastMotDate) : "",
          mot_expiry_date: m.motExpiryDate ? toIsoDate(m.motExpiryDate) : "",
        };
        if (m.motCentreName) payload.mot_centre_name = m.motCentreName;
        if (m.address) payload.mot_address = m.address;
        if (m.postcode) payload.mot_postcode = m.postcode;
        if (m.telephone) payload.mot_telephone = m.telephone;
        if (m.emailAddress) payload.mot_email_address = m.emailAddress;
        if (m.lastMotDate) payload.last_mot_date = toIsoDate(m.lastMotDate);
        if (m.motExpiryDate) payload.mot_expiry_date = toIsoDate(m.motExpiryDate);
        setOcrMissing((prev) => {
          const current = { ...(prev[active.id] || {}) };
          MOT_OCR_FIELDS.forEach((field) => {
            if (extracted[field]) delete current[field];
            else current[field] = true;
          });
          return { ...prev, [active.id]: current };
        });
      }

      // Every upload is kept as history, so refresh the document list for this
      // authority once the new certificate is stored.
      await loadCertificates();

      const count = Object.keys(payload).length;
      if (!count) {
        toast.warn("Certificate saved, but nothing could be read from it. Please enter the details manually.");
        return;
      }
      const updated = await updateLicensingAuthority(recordId, active.id, payload);
      if (updated) setAuthorities((rows) => rows.map((r) => (r.id === updated.id ? updated : r)));
      toast.success(`Certificate read — ${count} field${count === 1 ? "" : "s"} filled. Please check before saving.`);
    }
  };

  // Uploading again keeps the previous certificate in the history rather than
  // replacing it, so this just opens the picker.
  const pickCertificate = (kind: CertificateKind) => setUploadKind(kind);

  // Open the email preview: fetch the default recipient (logged-in user), subject
  // and editable body, then show the shared email modal to review/edit/send.
  const sendConfirmation = async (kind: CertificateKind) => {
    if (!recordId || !active) return;
    const label = kind === "plating" ? "Plating" : "MOT";
    setPreparingEmail(true);
    try {
      const preview = await getAppointmentEmailPreview(recordId, active.id, kind);
      setEmail({ kind, authorityId: active.id, ...preview });
    } catch {
      toast.error(`Could not prepare the ${label} confirmation email.`);
    } finally {
      setPreparingEmail(false);
    }
  };

  return (
    <div className="w-full max-w-[788px] flex flex-col gap-6 font-sans-headline">
      {(recordLoading || loading || busy || viewingDoc || certsLoading || !recordId || !pageReady) && <FleetSpinnerLoader />}

      {/* Labeled loader while the email preview is being prepared. */}
      {preparingEmail && (
        <div className="fixed inset-0 z-[9999] bg-[#e8e6df]/80 flex items-center justify-center font-sans-headline">
          <div className="bg-white rounded-lg px-8 py-6 flex flex-col items-center gap-4 shadow-[0px_4px_20px_0px_rgba(0,0,0,0.12)]">
            <div className="w-8 h-8 border-[3px] border-neutral-200 border-t-neutral-900 rounded-full animate-spin" />
            <span className="text-neutral-900 text-sm font-medium">Preparing email preview…</span>
          </div>
        </div>
      )}

      <FleetUploadModal
        open={uploadKind !== null}
        onClose={() => setUploadKind(null)}
        onUploaded={(file) => handleCertificate(uploadKind!, file)}
        title={uploadKind === "mot" ? "Upload MOT Centre Certificate" : "Upload Plating Expiry Certificate"}
        accept="image/*,.pdf"
        history={uploadKind === "mot" ? motDocs : uploadKind === "plating" ? platingDocs : []}
        onView={openDocument}
      />

      <div className="flex justify-between items-center">
        <h2 className="text-black text-2xl font-semibold leading-6">Licensing Authority</h2>
        <button
          type="button"
          disabled={busy || authorities.length >= MAX_LICENSING_AUTHORITIES}
          onClick={handleAdd}
          className={BTN_DARK}
          title={
            authorities.length >= MAX_LICENSING_AUTHORITIES
              ? `A vehicle can have at most ${MAX_LICENSING_AUTHORITIES} licensing authorities.`
              : undefined
          }
        >
          <Plus size={16} />
          Add Licensing Authority
        </button>
      </div>

      {/* Authority cards — one per authority, each with its own delete icon.
          Always one row of equal-width cards (max 4), so they never wrap. */}
      {authorities.length > 0 && (
        <div className="flex gap-3">
          {authorities.map((a, i) => {
            const isActive = i === activeIndex;
            return (
              <div
                key={a.id}
                className={`flex-1 basis-0 min-w-0 p-4 rounded-lg outline outline-1 -outline-offset-1 flex items-start gap-2 ${
                  isActive ? "bg-white outline-neutral-700" : "bg-white outline-neutral-200"
                }`}
              >
                <button
                  type="button"
                  onClick={() => setActiveIndex(i)}
                  className="flex-1 min-w-0 flex flex-col items-start gap-1 text-left"
                >
                  <span className={`text-base font-semibold leading-tight ${isActive ? "text-neutral-900" : "text-neutral-400"}`}>
                    Licensing Authority {a.position ?? i + 1}
                  </span>
                  <span className={`text-xs truncate max-w-full ${isActive ? "text-neutral-700" : "text-neutral-400"}`}>
                    {a.licensing_authority || "UK Licensing Authority"}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteIndex(i)}
                  className="w-5 h-5 shrink-0 flex items-center justify-center rounded hover:bg-neutral-100"
                  title={`Delete Licensing Authority ${a.position ?? i + 1}`}
                >
                  <img src={RemoveIcon} alt="Delete" className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {active && (
        <>
          {/* Section A — plating authority contact details */}
          <section className={SECTION}>
            <div className="flex justify-between items-center gap-4">
              <h3 className={H3}>Plating Authority Contact Details</h3>
              {platingDocs.length === 0 && (
                <button type="button" disabled={busy} onClick={() => pickCertificate("plating")} className={`${BTN_DARK} shrink-0`}>
                  <img src={UploadFileIcon} alt="" className="w-4 h-4 brightness-0 invert" />
                  Upload Plating Certificate
                </button>
              )}
            </div>
            <FleetUploadedFileBar doc={platingDocs[0]} onCta={() => pickCertificate("plating")} onView={openDocument} />
            <FleetTextInput label="Licensing Authority" placeholder="Enter Licensing Authority" value={active.licensing_authority || ""} onChange={(v) => patch("licensing_authority", v)} error={missing("licensing_authority")} />
            <FleetAddressAutocomplete
              label="Address"
              placeholder="Enter Address"
              address={active.address || ""}
              onChange={(v) => patch("address", v)}
              onPlaceSelected={(place) => patchMany({ address: place.address, ...(place.postcode ? { postcode: place.postcode } : {}) })}
              error={missing("address")}
            />
            <div className="grid grid-cols-2 gap-5">
              <FleetPostcodeLookup
                label="Postcode"
                placeholder="Enter Postcode"
                postcode={active.postcode || ""}
                onChange={(v) => patch("postcode", v)}
                onAddressSelect={(addr) => patchMany({ address: addr.address, postcode: addr.postcode })}
                error={missing("postcode")}
              />
              <FleetTextInput label="Home Telephone" placeholder="Enter Home Telephone" inputMode="tel" value={active.telephone || ""} onChange={(v) => patch("telephone", v)} error={missing("telephone")} />
            </div>
            <div className="grid grid-cols-2 gap-5">
              <FleetUkMobileInput label="Mobile Number" value={active.contact_number || ""} onChange={(v) => patch("contact_number", v)} error={missing("contact_number")} />
              <FleetTextInput label="Email Address" placeholder="Enter Email Address" inputMode="email" value={active.email_address || ""} onChange={(v) => patch("email_address", v)} error={missing("email_address")} />
            </div>
          </section>

          {/* Plating details */}
          <section className={SECTION}>
            <h3 className={H3}>Plating Details</h3>
            <div className="grid grid-cols-2 gap-5">
              <FleetTextInput label="Plate Number" placeholder="Enter Plate Number" value={active.plate_number || ""} onChange={(v) => patch("plate_number", v)} error={missing("plate_number")} />
              <div />
            </div>
            <div className="grid grid-cols-2 gap-5">
              <FleetDateField label="Plating Start Date" value={active.plating_start_date || ""} onChange={(v) => patch("plating_start_date", v || null)} error={missing("plating_start_date")} />
              <FleetDateField label="Plating Expiry Date" value={active.plating_expiry_date || ""} onChange={(v) => patch("plating_expiry_date", v || null)} error={missing("plating_expiry_date")} />
            </div>
            <div className="grid grid-cols-2 gap-5">
              <FleetDateField label="Plating Booked For" value={active.plating_booked_date || ""} onChange={(v) => patch("plating_booked_date", v || null)} />
              <FleetTimeSelect label="&nbsp;" value={active.plating_booked_time || ""} onChange={(v) => patch("plating_booked_time", v || null)} />
            </div>
            <div className="flex justify-between items-center gap-4">
              <Checkbox
                label="Plating Appointment Attended &amp; Passed"
                checked={!!active.plating_attended_passed}
                onChange={(v) => patch("plating_attended_passed", v)}
              />
              <button
                type="button"
                disabled={!active.plating_attended_passed}
                title={active.plating_attended_passed ? undefined : "Mark the appointment attended & passed first"}
                onClick={() => sendConfirmation("plating")}
                className={`${BTN_DARK} shrink-0`}
              >
                <Mail size={16} />
                Send Email Confirmation
              </button>
            </div>
          </section>

          {/* Section B1 — MOT centre contact details */}
          <section className={SECTION}>
            <div className="flex justify-between items-center gap-4">
              <h3 className={H3}>MOT Centre Contact Details</h3>
              {motDocs.length === 0 && (
                <button type="button" disabled={busy} onClick={() => pickCertificate("mot")} className={`${BTN_DARK} shrink-0`}>
                  <img src={UploadFileIcon} alt="" className="w-4 h-4 brightness-0 invert" />
                  Upload MOT Centre Certificate
                </button>
              )}
            </div>
            <div className="h-px bg-neutral-100" />
            <FleetUploadedFileBar doc={motDocs[0]} onCta={() => pickCertificate("mot")} onView={openDocument} />
            <FleetTextInput label="MOT Centre Name" placeholder="Enter MOT Centre Name" value={active.mot_centre_name || ""} onChange={(v) => patch("mot_centre_name", v)} error={missing("mot_centre_name")} />
            <FleetAddressAutocomplete
              label="Address"
              placeholder="Enter Address"
              address={active.mot_address || ""}
              onChange={(v) => patch("mot_address", v)}
              onPlaceSelected={(place) => patchMany({ mot_address: place.address, ...(place.postcode ? { mot_postcode: place.postcode } : {}) })}
              error={missing("mot_address")}
            />
            <div className="grid grid-cols-2 gap-5">
              <FleetPostcodeLookup
                label="Postcode"
                placeholder="Enter Postcode"
                postcode={active.mot_postcode || ""}
                onChange={(v) => patch("mot_postcode", v)}
                onAddressSelect={(addr) => patchMany({ mot_address: addr.address, mot_postcode: addr.postcode })}
                error={missing("mot_postcode")}
              />
              <FleetTextInput label="Telephone" placeholder="Enter Telephone" inputMode="tel" value={active.mot_telephone || ""} onChange={(v) => patch("mot_telephone", v)} error={missing("mot_telephone")} />
            </div>
            <div className="grid grid-cols-2 gap-5">
              <FleetTextInput label="Email Address" placeholder="Enter Email Address" inputMode="email" value={active.mot_email_address || ""} onChange={(v) => patch("mot_email_address", v)} error={missing("mot_email_address")} />
              <div />
            </div>
          </section>

          {/* Section B2 — private hire MOT details */}
          <section className={SECTION}>
            <h3 className={H3}>Private Hire MOT Details</h3>
            <div className="h-px bg-neutral-100" />
            <div className="grid grid-cols-2 gap-5">
              <FleetDateField label="Last MOT Date" value={active.last_mot_date || ""} onChange={(v) => patch("last_mot_date", v || null)} error={missing("last_mot_date")} />
              <FleetDateField label="MOT Expiry Date" value={active.mot_expiry_date || ""} onChange={(v) => patch("mot_expiry_date", v || null)} error={missing("mot_expiry_date")} />
            </div>
            <div className="grid grid-cols-2 gap-5">
              <FleetDateField label="MOT Booked For" value={active.mot_booked_date || ""} onChange={(v) => patch("mot_booked_date", v || null)} />
              <FleetTimeSelect label="&nbsp;" value={active.mot_booked_time || ""} onChange={(v) => patch("mot_booked_time", v || null)} />
            </div>
            <div className="flex justify-between items-center gap-4">
              <Checkbox
                label="MOT Appointment Attended &amp; Passed"
                checked={!!active.mot_attended_passed}
                onChange={(v) => patch("mot_attended_passed", v)}
              />
              <button
                type="button"
                disabled={!active.mot_attended_passed}
                title={active.mot_attended_passed ? undefined : "Mark the appointment attended & passed first"}
                onClick={() => sendConfirmation("mot")}
                className={`${BTN_DARK} shrink-0`}
              >
                <Mail size={16} />
                Send Email Confirmation
              </button>
            </div>
          </section>

          {/* {authorities.length > 1 && (
            <button
              type="button"
              onClick={() => setDeleteIndex(activeIndex)}
              className="self-start text-sm text-neutral-500 hover:text-neutral-900 underline"
            >
              Remove Licensing Authority {active.position ?? activeIndex + 1}
            </button>
          )} */}
        </>
      )}

      {deleteIndex !== null && authorities[deleteIndex] && (
        <FleetConfirmModal
          title="Delete Licensing Authority"
          message={`Are you sure you want to delete this record?`}
          confirmLabel="Delete"
          onConfirm={() => {
            const index = deleteIndex;
            setDeleteIndex(null);
            handleDeleteAt(index);
          }}
          onCancel={() => setDeleteIndex(null)}
        />
      )}

      {/* Preview → edit → send. Recipient defaults to the logged-in user. */}
      <FleetEmailModal
        open={email !== null}
        onClose={() => setEmail(null)}
        hireId={vehicle?.hire_id ?? null}
        title={email?.kind === "mot" ? "MOT Confirmation" : "Plating Confirmation"}
        defaultTo={email?.to || ""}
        defaultSubject={email?.subject || ""}
        defaultBody={email?.body || ""}
        sendOverride={async (args: FleetEmailSendArgs) => {
          if (!recordId || !email) return { status: "failed" as const };
          await sendAppointmentPassedEmail(recordId, email.authorityId, email.kind, {
            to: args.to,
            cc: args.cc,
            subject: args.subject,
            body: args.body,
          });
          return { status: "sent" as const };
        }}
      />
    </div>
  );
};

export default LicensingAuthority;
