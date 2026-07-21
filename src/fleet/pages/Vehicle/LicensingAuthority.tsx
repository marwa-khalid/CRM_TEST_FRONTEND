import React, { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { Plus, Mail } from "lucide-react";
import { FleetTextInput, FleetDateField, FleetTimeSelect } from "../../components/fields";
import FleetSpinnerLoader from "../../components/FleetSpinnerLoader";
import UploadFileIcon from "../../assets/icons/UploadFile.svg";
import {
  createLicensingAuthority,
  deleteLicensingAuthority,
  extractMotCertificate,
  extractPlatingCertificate,
  listLicensingAuthorities,
  removeCertificate,
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
const BTN_OUTLINE = "h-8 px-3 py-2 rounded outline outline-1 -outline-offset-1 outline-neutral-900 text-neutral-900 text-sm inline-flex items-center justify-center gap-2 hover:bg-neutral-50 disabled:opacity-60";

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

// Before upload: a dark button in the card header. After upload: a grey bar
// naming the file with "Remove & Upload Again".
const CertificateBar: React.FC<{
  label: string;
  filename?: string | null;
  busy: boolean;
  onPick: () => void;
}> = ({ label, filename, busy, onPick }) =>
  filename ? (
    <div className="self-stretch px-4 py-2 bg-neutral-100 rounded flex justify-between items-center gap-4">
      <span className="min-w-0 truncate text-black text-sm" title={filename}>{label}</span>
      <button type="button" disabled={busy} onClick={onPick} className={`${BTN_OUTLINE} shrink-0`}>
        <img src={UploadFileIcon} alt="" className="w-4 h-4" />
        Remove &amp; Upload Again
      </button>
    </div>
  ) : null;

const LicensingAuthority: React.FC = () => {
  const { vehicle } = useVehicle();
  const recordId = vehicle?.id ?? null;

  const [authorities, setAuthorities] = useState<Authority[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const platingInput = useRef<HTMLInputElement>(null);
  const motInput = useRef<HTMLInputElement>(null);

  const active = authorities[activeIndex] ?? null;

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
    }
  }, [recordId]);

  useEffect(() => {
    load();
  }, [load]);

  // Patch one field and keep the local row in step with the server's response.
  const patch = async (field: string, value: unknown) => {
    if (!recordId || !active) return;
    setAuthorities((rows) =>
      rows.map((r) => (r.id === active.id ? { ...r, [field]: value } : r)),
    );
    const updated = await updateLicensingAuthority(recordId, active.id, { [field]: value });
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

  const handleDelete = async () => {
    if (!recordId || !active || authorities.length <= 1) return;
    setBusy(true);
    try {
      await deleteLicensingAuthority(recordId, active.id);
      setAuthorities((rows) => rows.filter((r) => r.id !== active.id));
      setActiveIndex((i) => Math.max(0, i - 1));
    } finally {
      setBusy(false);
    }
  };

  // A single upload fills BOTH the contact block and the detail block, per the
  // user story. Only blank fields are filled, so amendments survive a re-upload.
  const handleCertificate = async (kind: CertificateKind, file: File) => {
    if (!recordId || !active) return;
    setBusy(true);
    try {
      const stored = await uploadCertificate(recordId, active.id, kind, file);
      if (!stored) {
        toast.error("Could not upload the certificate.");
        return;
      }
      setAuthorities((rows) => rows.map((r) => (r.id === stored.id ? stored : r)));

      const payload: Record<string, unknown> = {};
      if (kind === "plating") {
        const p = await extractPlatingCertificate(file);
        if (p.licensingAuthority) payload.licensing_authority = p.licensingAuthority;
        if (p.address) payload.address = p.address;
        if (p.postcode) payload.postcode = p.postcode;
        if (p.telephone) payload.telephone = p.telephone;
        if (p.contactNumber) payload.contact_number = p.contactNumber;
        if (p.emailAddress) payload.email_address = p.emailAddress;
        if (p.plateNumber) payload.plate_number = p.plateNumber;
        if (p.platingStartDate) payload.plating_start_date = toIsoDate(p.platingStartDate);
        if (p.platingExpiryDate) payload.plating_expiry_date = toIsoDate(p.platingExpiryDate);
      } else {
        const m = await extractMotCertificate(file);
        if (m.motCentreName) payload.mot_centre_name = m.motCentreName;
        if (m.address) payload.mot_address = m.address;
        if (m.postcode) payload.mot_postcode = m.postcode;
        if (m.telephone) payload.mot_telephone = m.telephone;
        if (m.emailAddress) payload.mot_email_address = m.emailAddress;
        if (m.lastMotDate) payload.last_mot_date = toIsoDate(m.lastMotDate);
        if (m.motExpiryDate) payload.mot_expiry_date = toIsoDate(m.motExpiryDate);
      }

      const count = Object.keys(payload).length;
      if (!count) {
        toast.warn("Certificate saved, but nothing could be read from it. Please enter the details manually.");
        return;
      }
      const updated = await updateLicensingAuthority(recordId, active.id, payload);
      if (updated) setAuthorities((rows) => rows.map((r) => (r.id === updated.id ? updated : r)));
      toast.success(`Certificate read — ${count} field${count === 1 ? "" : "s"} filled. Please check before saving.`);
    } finally {
      setBusy(false);
    }
  };

  const pickCertificate = async (kind: CertificateKind) => {
    if (!recordId || !active) return;
    const has = kind === "plating" ? active.plating_certificate_name : active.mot_certificate_name;
    if (has) {
      const cleared = await removeCertificate(recordId, active.id, kind);
      if (cleared) setAuthorities((rows) => rows.map((r) => (r.id === cleared.id ? cleared : r)));
    }
    (kind === "plating" ? platingInput : motInput).current?.click();
  };

  const sendConfirmation = async (kind: CertificateKind) => {
    if (!recordId || !active) return;
    const label = kind === "plating" ? "Plating" : "MOT";
    setBusy(true);
    try {
      await sendAppointmentPassedEmail(recordId, active.id, kind);
      toast.success(`${label} confirmation email sent to the Fleet inbox.`);
    } catch (err) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      toast.error(detail || `Could not send the ${label} confirmation email.`);
    } finally {
      setBusy(false);
    }
  };

  if (!recordId) {
    return (
      <div className="flex-1 min-w-0 font-sans-headline">
        <span className="text-neutral-400 text-sm">Open the Vehicle Details screen first.</span>
      </div>
    );
  }

  return (
    <div className="flex-1 min-w-0 flex flex-col gap-6 font-sans-headline">
      {(loading || busy) && <FleetSpinnerLoader />}

      <input
        ref={platingInput}
        type="file"
        accept="image/*,.pdf"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleCertificate("plating", file);
          e.target.value = "";
        }}
      />
      <input
        ref={motInput}
        type="file"
        accept="image/*,.pdf"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleCertificate("mot", file);
          e.target.value = "";
        }}
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

      {/* Tabs — only once there's more than one, matching the design. */}
      {authorities.length > 1 && (
        <div className="flex gap-6">
          {authorities.map((a, i) => {
            const isActive = i === activeIndex;
            return (
              <button
                key={a.id}
                type="button"
                onClick={() => setActiveIndex(i)}
                className={`flex-1 p-5 rounded-lg outline outline-1 -outline-offset-1 flex flex-col items-start gap-1 text-left ${
                  isActive ? "bg-white outline-neutral-700" : "bg-white outline-neutral-200"
                }`}
              >
                <span className={`text-xl font-semibold leading-5 ${isActive ? "text-neutral-900" : "text-neutral-400"}`}>
                  Licensing Authority {a.position ?? i + 1}
                </span>
                <span className={`text-sm truncate max-w-full ${isActive ? "text-neutral-700" : "text-neutral-400"}`}>
                  {a.licensing_authority || "UK Licensing Authority"}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {active && (
        <>
          {/* Section A — plating authority contact details */}
          <section className={SECTION}>
            <div className="flex justify-between items-center gap-4">
              <h3 className={H3}>Plating Authority Contact Details &amp; Plating Details</h3>
              {!active.plating_certificate_name && (
                <button type="button" disabled={busy} onClick={() => pickCertificate("plating")} className={`${BTN_DARK} shrink-0`}>
                  <img src={UploadFileIcon} alt="" className="w-4 h-4 brightness-0 invert" />
                  Upload Plating Expiry Certificate
                </button>
              )}
            </div>
            <CertificateBar
              label="Plating Expiry Certificate"
              filename={active.plating_certificate_name}
              busy={busy}
              onPick={() => pickCertificate("plating")}
            />
            <FleetTextInput label="Licensing Authority" placeholder="Enter Licensing Authority" value={active.licensing_authority || ""} onChange={(v) => patch("licensing_authority", v)} />
            <FleetTextInput label="Address" placeholder="Enter Address" value={active.address || ""} onChange={(v) => patch("address", v)} />
            <div className="grid grid-cols-2 gap-5">
              <FleetTextInput label="Postcode" placeholder="Enter Postcode" value={active.postcode || ""} onChange={(v) => patch("postcode", v)} />
              <FleetTextInput label="Telephone" placeholder="Enter Telephone" inputMode="tel" value={active.telephone || ""} onChange={(v) => patch("telephone", v)} />
            </div>
            <div className="grid grid-cols-2 gap-5">
              <FleetTextInput label="Contact Number" placeholder="Enter Contact Number" inputMode="tel" value={active.contact_number || ""} onChange={(v) => patch("contact_number", v)} />
              <FleetTextInput label="Email Address" placeholder="Enter Email Address" inputMode="email" value={active.email_address || ""} onChange={(v) => patch("email_address", v)} />
            </div>
          </section>

          {/* Plating details */}
          <section className={SECTION}>
            <h3 className={H3}>Plating Details</h3>
            <div className="grid grid-cols-2 gap-5">
              <FleetTextInput label="Plate Number" placeholder="Enter Plate Number" value={active.plate_number || ""} onChange={(v) => patch("plate_number", v)} />
              <div />
            </div>
            <div className="grid grid-cols-2 gap-5">
              <FleetDateField label="Plating Start Date" value={active.plating_start_date || ""} onChange={(v) => patch("plating_start_date", v || null)} />
              <FleetDateField label="Plating Expiry Date" value={active.plating_expiry_date || ""} onChange={(v) => patch("plating_expiry_date", v || null)} />
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
              {active.plating_certificate_name && (
                <button type="button" onClick={() => sendConfirmation("plating")} className={`${BTN_DARK} shrink-0`}>
                  <Mail size={16} />
                  Send Email Confirmation
                </button>
              )}
            </div>
          </section>

          {/* Section B — MOT centre + private hire MOT details */}
          <section className={SECTION}>
            <div className="flex justify-between items-center gap-4">
              <h3 className={H3}>MOT Centre Contact Details &amp; Private Hire MOT Details</h3>
              {!active.mot_certificate_name && (
                <button type="button" disabled={busy} onClick={() => pickCertificate("mot")} className={`${BTN_DARK} shrink-0`}>
                  <img src={UploadFileIcon} alt="" className="w-4 h-4 brightness-0 invert" />
                  Upload MOT Centre Certificate
                </button>
              )}
            </div>
            <div className="h-px bg-neutral-100" />
            <CertificateBar
              label="MOT Centre Certificate"
              filename={active.mot_certificate_name}
              busy={busy}
              onPick={() => pickCertificate("mot")}
            />
            <FleetTextInput label="MOT Centre Name" placeholder="Enter MOT Centre Name" value={active.mot_centre_name || ""} onChange={(v) => patch("mot_centre_name", v)} />
            <FleetTextInput label="Address" placeholder="Enter Address" value={active.mot_address || ""} onChange={(v) => patch("mot_address", v)} />
            <div className="grid grid-cols-2 gap-5">
              <FleetTextInput label="Postcode" placeholder="Enter Postcode" value={active.mot_postcode || ""} onChange={(v) => patch("mot_postcode", v)} />
              <FleetTextInput label="Telephone" placeholder="Enter Telephone" inputMode="tel" value={active.mot_telephone || ""} onChange={(v) => patch("mot_telephone", v)} />
            </div>
            <div className="grid grid-cols-2 gap-5">
              <FleetTextInput label="Email Address" placeholder="Enter Email Address" inputMode="email" value={active.mot_email_address || ""} onChange={(v) => patch("mot_email_address", v)} />
              <div />
            </div>
            <div className="grid grid-cols-2 gap-5">
              <FleetDateField label="Last MOT Date" value={active.last_mot_date || ""} onChange={(v) => patch("last_mot_date", v || null)} />
              <FleetDateField label="MOT Expiry Date" value={active.mot_expiry_date || ""} onChange={(v) => patch("mot_expiry_date", v || null)} />
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
              {active.mot_certificate_name && (
                <button type="button" onClick={() => sendConfirmation("mot")} className={`${BTN_DARK} shrink-0`}>
                  <Mail size={16} />
                  Send Email Confirmation
                </button>
              )}
            </div>
          </section>

          {authorities.length > 1 && (
            <button
              type="button"
              onClick={handleDelete}
              className="self-start text-sm text-neutral-500 hover:text-neutral-900 underline"
            >
              Remove Licensing Authority {active.position ?? activeIndex + 1}
            </button>
          )}
        </>
      )}
    </div>
  );
};

export default LicensingAuthority;
