import React, { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "react-toastify";
import { FleetTextInput, FleetSelect, FleetCreatableSelect, FleetDateField, FleetInlineLoader, currentTime24, formatTime24 } from "../../components/fields";
import FleetUploadModal from "../../components/FleetUploadModal";
import FleetEmailModal, { type FleetEmailSendArgs } from "../../components/FleetEmailModal";
import FleetProvisionSlider from "../../components/FleetProvisionSlider";
import FleetCheckoutModal, { EMPTY_CHECKOUT } from "../../components/FleetCheckoutModal";
import FleetConfirmModal from "../../components/FleetConfirmModal";
import FleetSpinnerLoader from "../../components/FleetSpinnerLoader";
import type { CheckoutData } from "../../components/FleetCheckoutModal";
import { Eye } from "lucide-react";
import DownloadIcon from "../../assets/icons/Download.svg";
import EmailIcon from "../../assets/icons/Email.svg";
import PrintIcon from "../../assets/icons/Print.svg";
import RemoveIcon from "../../assets/icons/Remove.svg";
import UploadFileIcon from "../../assets/icons/UploadFile.svg";
import PDFIcon from "../../assets/FileTypes/PDF.svg";
import PNGIcon from "../../assets/FileTypes/PNG.svg";
import DOCIcon from "../../assets/FileTypes/DOC.svg";
import {
  deleteHireDocument,
  getHireDocumentFileUrl,
  getHireDocuments,
  uploadHireDocument,
} from "../../services/hireService";
import {
  downloadGeneratedDocumentBundle,
  getGeneratedDocumentFiles,
  openGeneratedDocumentPrintView,
  type GeneratedDocumentKey,
} from "../../services/generatedDocumentService";
import { sendOnHireEmail, type SendHireEmailResult } from "../../services/emailService";
import { sendOnHireWhatsApp } from "../../services/whatsappService";
import {
  createVehicle,
  listVehicleRegister,
  listVehicles,
  deleteVehicle,
  updateVehicle,
  upsertVehicleRegister,
  type FleetVehicleRegister,
} from "../../services/vehicleService";
import { extractInsuranceCertificate } from "../../services/driverService";
import {
  BOROUGH_OPTIONS,
  SWAP_REASON_OPTIONS,
  INSURANCE_TYPE_OPTIONS,
  type HireVehicleForm,
} from "../../types/hire";
import { useHire } from "./HireContext";

interface Vehicle extends HireVehicleForm {
  id?: number; // backend id
  checkout: CheckoutData;
  insuranceCertName: string;
  insuranceCertId?: number;
  insuranceCertViewUrl: string | null;
  insuranceCertIsPdf: boolean;
  hireStartTime: string;
}

const EMPTY_VEHICLE: Vehicle = {
  vehicleCostPerWeek: "", deposit: "", borough: "", registrationNumber: "", make: "",
  model: "", transmission: "", hireStatus: "", swapCar: "", swapReason: "", swapReasonText: "",
  hireStartDate: "", hireStartTime: "", hireEndDate: "", totalHirePeriod: "", hireInsuranceType: "", dateReceived: "",
  policyStartDate: "", policyEndDate: "", crossHireProviderName: "", crossHireContactDetails: "",
  crossHireRate: "", checkout: { ...EMPTY_CHECKOUT }, insuranceCertName: "", insuranceCertViewUrl: null,
  insuranceCertIsPdf: false,
};

const s = (v: unknown) => (v == null ? "" : String(v));
const d = (v: unknown) => (v ? String(v) : ""); // date passthrough

// Backend record (snake) -> local Vehicle (camel).
const fromRecord = (r: Record<string, unknown>): Vehicle => ({
  id: r.id as number,
  vehicleCostPerWeek: s(r.vehicle_cost_per_week), deposit: s(r.deposit), borough: s(r.borough),
  registrationNumber: s(r.registration_number), make: s(r.make), model: s(r.model), transmission: s(r.transmission),
  hireStatus: s(r.hire_status), swapCar: s(r.swap_car), swapReason: s(r.swap_reason), swapReasonText: s(r.swap_reason_text),
  hireStartDate: d(r.hire_start_date), hireStartTime: s(r.hire_start_time), hireEndDate: d(r.hire_end_date), totalHirePeriod: s(r.total_hire_period),
  hireInsuranceType: s(r.hire_insurance_type), dateReceived: d(r.insurance_date_received),
  policyStartDate: d(r.policy_start_date), policyEndDate: d(r.policy_end_date),
  crossHireProviderName: s(r.cross_hire_provider_name), crossHireContactDetails: s(r.cross_hire_contact_details),
  crossHireRate: s(r.cross_hire_rate),
  checkout: {
    mileageStart: s(r.mileage_start), mileageEnd: s(r.mileage_end), checkoutDate: d(r.checkout_date),
    checkoutTime: s(r.checkout_time), cleanliness: s(r.checkout_cleanliness),
    damageCharges: s(r.damage_charges), damageNotes: s(r.damage_notes),
  },
  insuranceCertName: "",
  insuranceCertViewUrl: null,
  insuranceCertIsPdf: false,
});

const computePeriod = (start: string, end: string): string => {
  if (!start || !end) return "";
  const a = new Date(`${start}T00:00:00`).getTime();
  const b = new Date(`${end}T00:00:00`).getTime();
  const days = Math.round((b - a) / 86400000);
  if (Number.isNaN(days) || days < 0) return "";
  const w = Math.floor(days / 7);
  const rem = days % 7;
  return `${w} week${w !== 1 ? "s" : ""}${rem ? ` ${rem} day${rem !== 1 ? "s" : ""}` : ""}`;
};

// Today as yyyy-mm-dd in local time (avoids the BST off-by-one).
const today = () => new Date().toLocaleDateString("sv-SE");
const displayDate = (value: string) => {
  if (!value) return "";
  const dte = new Date(`${value}T00:00:00`);
  if (Number.isNaN(dte.getTime())) return value;
  return dte.toLocaleDateString("en-GB");
};
const normaliseReg = (value: string) => value.replace(/[^a-z0-9]/gi, "").toUpperCase();

const ClockIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" aria-hidden>
    <path d="M12 7v5l3 2M3 12a9 9 0 1 0 18 0 9 9 0 0 0-18 0Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const UploadPrompt = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-12 h-12 text-neutral-300" aria-hidden>
    <path d="M12 15V4m0 0 4 4m-4-4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const SECTION = "self-stretch p-5 rounded-lg outline outline-1 -outline-offset-1 outline-neutral-100 flex flex-col gap-4";
const H3 = "text-black text-xl font-semibold leading-5";
const OUTLINE_BTN = "px-6 py-3 rounded bg-white text-neutral-900 text-base font-medium outline outline-1 -outline-offset-1 outline-neutral-900 hover:bg-neutral-50";
const GENERATED_DOCUMENTS: Array<{ label: string; key?: GeneratedDocumentKey }> = [
  { label: "Raise Hire Documentation", key: "raise_hire_documentation" },
  { label: "Raise Authority Letter", key: "raise_authority_letter" },
  { label: "Raise Vehicle Inspection Sheet", key: "raise_vehicle_inspection_sheet" },
];
const TRANSMISSION_OPTIONS = [
  { label: "Automatic", value: "Automatic" },
  { label: "Manual", value: "Manual" },
];
const INSURANCE_DOC_TYPE = "insurance_certificate";
const PDF_EXT = /\.pdf$/i;
const IMAGE_EXT = /\.(png|jpe?g|gif|webp|bmp)$/i;

const fileIconFor = (filename: string) => {
  if (PDF_EXT.test(filename)) return PDFIcon;
  if (IMAGE_EXT.test(filename)) return PNGIcon;
  return DOCIcon;
};

const Radio: React.FC<{ checked: boolean; label: string; onClick: () => void }> = ({ checked, label, onClick }) => (
  <button type="button" onClick={onClick} className="flex items-center gap-2">
    <span className={`w-5 h-5 rounded-full flex items-center justify-center ${checked ? "bg-neutral-200" : "bg-neutral-300"}`}>
      <span className={`w-2 h-2 rounded-full ${checked ? "bg-neutral-900" : "bg-white"}`} />
    </span>
    <span className="text-black text-sm">{label}</span>
  </button>
);

const IconButton: React.FC<{ icon: string; label: string; onClick: () => void; disabled?: boolean }> = ({
  icon,
  label,
  onClick,
  disabled = false,
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    title={label}
    aria-label={label}
    className="w-5 h-5 flex items-center justify-center hover:opacity-70 disabled:opacity-40 disabled:cursor-not-allowed"
  >
    <img src={icon} alt="" className="w-4 h-4" />
  </button>
);

const CrossHiredModal: React.FC<{
  initial: { providerName: string; contactDetails: string; rate: string };
  onClose: () => void;
  onSave: (v: { providerName: string; contactDetails: string; rate: string }) => void;
}> = ({ initial, onClose, onSave }) => {
  const [v, setV] = useState(initial);
  return (
    <div className="fixed inset-0 z-[110] bg-black/40 flex items-center justify-center p-4">
      <div className="w-[640px] max-w-full p-6 bg-white rounded-lg flex flex-col gap-4 font-sans-headline">
        <div className="text-neutral-900 text-xl font-semibold leading-5">If Vehicle Cross-Hired to Us</div>
        <FleetTextInput label="Provider name" placeholder="Provider name" value={v.providerName} onChange={(x) => setV((st) => ({ ...st, providerName: x }))} />
        <FleetTextInput label="Contact Details" placeholder="Contact details" value={v.contactDetails} onChange={(x) => setV((st) => ({ ...st, contactDetails: x }))} />
        <FleetTextInput label="Rate" placeholder="Rate" value={v.rate} onChange={(x) => setV((st) => ({ ...st, rate: x }))} />
        <div className="h-px bg-neutral-100" />
        <div className="flex justify-end items-center gap-4">
          <button type="button" onClick={onClose} className={OUTLINE_BTN}>Cancel</button>
          <button type="button" onClick={() => onSave(v)} className="px-6 py-3 rounded bg-neutral-900 text-white text-base font-medium hover:bg-black">Next</button>
        </div>
      </div>
    </div>
  );
};

const HireVehicleDetails: React.FC = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([{ ...EMPTY_VEHICLE }]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [certOpen, setCertOpen] = useState(false);
  const [crossOpen, setCrossOpen] = useState(false);
  const [provisionOpen, setProvisionOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [emailTitle, setEmailTitle] = useState("Email Document");
  const [emailTo, setEmailTo] = useState("");
  const [emailSubject, setEmailSubject] = useState<string | null>(null);
  const [emailBody, setEmailBody] = useState("");
  const [emailFiles, setEmailFiles] = useState<File[]>([]);
  const [emailAfterSend, setEmailAfterSend] = useState<(() => void | Promise<void>) | null>(null);
  const [emailPreviewHtml, setEmailPreviewHtml] = useState("");
  const [emailSendOverride, setEmailSendOverride] = useState<((args: FleetEmailSendArgs) => Promise<SendHireEmailResult>) | null>(null);
  const [vehicleRegister, setVehicleRegister] = useState<FleetVehicleRegister[]>([]);
  const [insuranceOcrLoading, setInsuranceOcrLoading] = useState(false);
  const [deleteCertOpen, setDeleteCertOpen] = useState(false);
  const [deleteVehicleIndex, setDeleteVehicleIndex] = useState<number | null>(null);
  const [generatedActionLoading, setGeneratedActionLoading] = useState<string | null>(null);
  const [initialLoading, setInitialLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const { hire, hireId, activeVehicleId, setActiveVehicleId, registerFlusher } = useHire();

  const active = vehicles[activeIndex];
  const onHire = active.hireStatus === "on_hire";
  const offHire = active.hireStatus === "off_hire";
  const customerOwnInsurance = active.hireInsuranceType === "customer_own";
  const selectedRegisterVehicle = vehicleRegister.find((item) => normaliseReg(item.registration_number) === normaliseReg(active.registrationNumber));
  const vehicleUnavailable = Boolean(selectedRegisterVehicle?.is_active && active.hireStatus !== "on_hire");
  const registrationOptions = vehicleRegister.map((item) => ({
    value: item.registration_number,
    label: `${item.registration_number}`,
  }));

  // Load existing vehicles for this hire (or create the first one).
  useEffect(() => {
    if (!hireId) {
      setInitialLoading(false);
      return;
    }

    let active = true;
    setInitialLoading(true);
    (async () => {
      try {
        const [list, docs, register] = await Promise.all([listVehicles(hireId), getHireDocuments(hireId), listVehicleRegister()]);
        const cert = docs.filter((doc) => doc.doc_type === INSURANCE_DOC_TYPE).sort((a, b) => b.id - a.id)[0];
        const certViewUrl = cert ? await getHireDocumentFileUrl(hireId, cert.id) : null;
        const certPatch = {
          insuranceCertName: cert?.filename || "",
          insuranceCertId: cert?.id,
          insuranceCertViewUrl: certViewUrl,
          insuranceCertIsPdf: PDF_EXT.test(cert?.filename || ""),
        };

        if (!active) return;
        setVehicleRegister(register);
        if (list.length > 0) {
          const mapped = list.map((record) => ({ ...fromRecord(record), ...certPatch }));
          setVehicles(mapped);
          // Open the card the user last made active (shared with Payment Details);
          // fall back to the first vehicle.
          const resolved = activeVehicleId != null ? mapped.findIndex((v) => Number(v.id) === activeVehicleId) : -1;
          const initialIdx = resolved >= 0 ? resolved : 0;
          setActiveIndex(initialIdx);
          setActiveVehicleId(mapped[initialIdx]?.id != null ? Number(mapped[initialIdx].id) : null);
        } else {
          const created = await createVehicle(hireId);
          if (active && created) {
            setVehicles([{ ...EMPTY_VEHICLE, id: created.id as number, ...certPatch }]);
          }
        }
      } finally {
        if (active) setInitialLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [hireId]);

  const patch = (updates: Partial<Vehicle>) =>
    setVehicles((vs) => vs.map((v, i) => (i === activeIndex ? { ...v, ...updates } : v)));
  const set = (key: keyof HireVehicleForm, value: string) => patch({ [key]: value } as Partial<Vehicle>);

  // Make a card active AND publish it to the shared context so Payment Details
  // opens on the same vehicle (and vice-versa).
  const selectVehicle = (index: number) => {
    setActiveIndex(index);
    const id = vehicles[index]?.id;
    setActiveVehicleId(id != null ? Number(id) : null);
  };

  const mergeRegisterRow = (row: FleetVehicleRegister) => {
    setVehicleRegister((items) => {
      const exists = items.some((item) => normaliseReg(item.registration_number) === normaliseReg(row.registration_number));
      const next = exists
        ? items.map((item) => normaliseReg(item.registration_number) === normaliseReg(row.registration_number) ? row : item)
        : [...items, row];
      return [...next].sort((a, b) => a.registration_number.localeCompare(b.registration_number));
    });
  };

  const saveRegisterFromVehicle = async (vehicle: Vehicle) => {
    const registrationNumber = normaliseReg(vehicle.registrationNumber);
    if (!registrationNumber) return;
    const row = await upsertVehicleRegister({
      registration_number: registrationNumber,
      make: vehicle.make,
      model: vehicle.model,
      transmission: vehicle.transmission,
    });
    if (row) mergeRegisterRow(row);
  };

  const handleRegistrationSelect = async (registrationNumber: string) => {
    const normalisedRegistration = normaliseReg(registrationNumber);
    const selected = vehicleRegister.find((item) => normaliseReg(item.registration_number) === normalisedRegistration);
    const updates: Partial<Vehicle> = {
      registrationNumber: normalisedRegistration,
      make: selected?.make || "",
      model: selected?.model || "",
      transmission: selected?.transmission || "",
    };
    patch(updates);
    await saveActive({
      registration_number: normalisedRegistration || null,
      make: updates.make || null,
      model: updates.model || null,
      transmission: updates.transmission || null,
    });
    await saveRegisterFromVehicle({ ...active, ...updates });
  };

  // Per-field typing is buffered (per hire-vehicle id) and flushed once on
  // navigation, so a screenful of edits is one PATCH instead of one-per-field.
  const pendingRef = useRef<Record<number, Record<string, unknown>>>({});

  // Persist a partial (snake-cased columns) to the active vehicle immediately —
  // used by deliberate actions (status, checkout, registration select). Any
  // buffered copy of the same fields is dropped so a later flush can't overwrite
  // what this action just wrote.
  const saveActive = (partial: Record<string, unknown>) => {
    const v = vehicles[activeIndex];
    if (hireId && v?.id) {
      const buf = pendingRef.current[v.id];
      if (buf) Object.keys(partial).forEach((k) => delete buf[k]);
      return updateVehicle(hireId, v.id, partial);
    }
    return Promise.resolve();
  };
  const bufferField = (partial: Record<string, unknown>) => {
    const v = vehicles[activeIndex];
    if (!v?.id) return;
    pendingRef.current[v.id] = { ...(pendingRef.current[v.id] || {}), ...partial };
  };
  const flushFields = useCallback(async () => {
    if (!hireId) return;
    const buffers = pendingRef.current;
    pendingRef.current = {};
    for (const [idStr, partial] of Object.entries(buffers)) {
      if (partial && Object.keys(partial).length) await updateVehicle(hireId, Number(idStr), partial);
    }
  }, [hireId]);
  useEffect(() => registerFlusher(flushFields), [registerFlusher, flushFields]);

  const onHireDate = (key: "hireStartDate" | "hireEndDate", column: string, value: string) => {
    const dateTime = value ? currentTime24() : "";
    const nextStartTime = key === "hireStartDate" ? (formatTime24(active.hireStartTime) || dateTime) : formatTime24(active.hireStartTime);
    const nextEndTime = key === "hireEndDate" ? (formatTime24(active.checkout.checkoutTime) || dateTime) : formatTime24(active.checkout.checkoutTime);
    setVehicles((vs) =>
      vs.map((v, i) => {
        if (i !== activeIndex) return v;
        const next = { ...v, [key]: value };
        if (key === "hireStartDate") {
          next.hireStartTime = value ? nextStartTime : "";
        }
        if (key === "hireEndDate") {
          next.checkout = {
            ...next.checkout,
            checkoutDate: value || next.checkout.checkoutDate,
            checkoutTime: value ? nextEndTime : "",
          };
        }
        next.totalHirePeriod = computePeriod(next.hireStartDate, next.hireEndDate);
        return next;
      }),
    );
    const partial: Record<string, unknown> = { [column]: value || null, total_hire_period: computePeriod(
      key === "hireStartDate" ? value : active.hireStartDate,
      key === "hireEndDate" ? value : active.hireEndDate,
    ) };
    if (key === "hireStartDate") partial.hire_start_time = value ? nextStartTime : null;
    if (key === "hireEndDate") {
      partial.checkout_date = value || null;
      partial.checkout_time = value ? nextEndTime : null;
    }
    saveActive(partial);
  };

  const handleCert = async (file: File) => {
    const received = today();
    let uploadedDocId: number | undefined;
    let viewUrl: string | null = null;
    if (hireId) {
      const existing = await getHireDocuments(hireId);
      const uploaded = await uploadHireDocument(hireId, INSURANCE_DOC_TYPE, file);
      if (!uploaded?.id) {
        throw new Error("Insurance certificate upload failed. Please try again.");
      }
      uploadedDocId = uploaded?.id;
      await Promise.all(
        existing
          .filter((doc) => doc.doc_type === INSURANCE_DOC_TYPE)
          .map((doc) => deleteHireDocument(hireId, doc.id)),
      );
      viewUrl = uploadedDocId ? await getHireDocumentFileUrl(hireId, uploadedDocId) : null;
    }
    const fallbackViewUrl = viewUrl || URL.createObjectURL(file);
    patch({
      insuranceCertName: file.name,
      insuranceCertId: uploadedDocId,
      insuranceCertViewUrl: fallbackViewUrl,
      insuranceCertIsPdf: PDF_EXT.test(file.name),
      dateReceived: received,
    });

    setInsuranceOcrLoading(true);
    try {
      const data = await extractInsuranceCertificate(file);
      const updates: Partial<Vehicle> = {
        insuranceCertName: file.name,
        insuranceCertId: uploadedDocId,
        insuranceCertViewUrl: fallbackViewUrl,
        insuranceCertIsPdf: PDF_EXT.test(file.name),
        dateReceived: received,
        policyStartDate: data.policyStartDate || active.policyStartDate,
        policyEndDate: data.policyEndDate || active.policyEndDate,
      };
      patch(updates);
      saveActive({
        insurance_date_received: received,
        policy_start_date: updates.policyStartDate || null,
        policy_end_date: updates.policyEndDate || null,
      });
      if (data.policyStartDate || data.policyEndDate) {
        toast.success("Insurance certificate uploaded and policy dates extracted.");
      } else {
        toast.info("Insurance certificate uploaded. Please enter the policy dates manually.");
      }
    } finally {
      setInsuranceOcrLoading(false);
    }
  };

  const viewInsuranceCertificate = () => {
    if (!active.insuranceCertViewUrl) {
      toast.info("Certificate preview is not ready yet.");
      return;
    }
    window.open(active.insuranceCertViewUrl, "_blank", "noopener,noreferrer");
  };

  const confirmDeleteCertificate = async () => {
    if (hireId) {
      if (active.insuranceCertId) {
        await deleteHireDocument(hireId, active.insuranceCertId);
      } else {
        const docs = await getHireDocuments(hireId);
        await Promise.all(
          docs
            .filter((doc) => doc.doc_type === INSURANCE_DOC_TYPE)
            .map((doc) => deleteHireDocument(hireId, doc.id)),
        );
      }
    }
    patch({
      insuranceCertName: "",
      insuranceCertId: undefined,
      insuranceCertViewUrl: null,
      insuranceCertIsPdf: false,
      dateReceived: "",
      policyStartDate: "",
      policyEndDate: "",
    });
    saveActive({
      insurance_date_received: null,
      policy_start_date: null,
      policy_end_date: null,
    });
    setDeleteCertOpen(false);
    toast.success("Insurance certificate deleted.");
  };

  const handleInsuranceType = (value: string) => {
    if (value === "customer_own") {
      set("hireInsuranceType", value);
      saveActive({ hire_insurance_type: value });
      return;
    }
    patch({
      hireInsuranceType: value,
      dateReceived: "",
      policyStartDate: "",
      policyEndDate: "",
    });
    saveActive({
      hire_insurance_type: value,
      insurance_date_received: null,
      policy_start_date: null,
      policy_end_date: null,
    });
  };

  const completeCheckout = async (cd: CheckoutData) => {
    // Off Hire → auto-populate Hire End Date (today) + recompute the period.
    const end = cd.checkoutDate || today();
    const endTime = formatTime24(cd.checkoutTime) || currentTime24();
    const checkout = { ...cd, checkoutDate: end, checkoutTime: endTime };
    const period = computePeriod(active.hireStartDate, end);
    setActionLoading("off_hire");
    try {
      patch({ checkout, hireStatus: "off_hire", hireEndDate: end, totalHirePeriod: period });
      await saveActive({
        mileage_start: cd.mileageStart, mileage_end: cd.mileageEnd, checkout_date: end,
        checkout_time: endTime, checkout_cleanliness: cd.cleanliness, damage_charges: cd.damageCharges,
        damage_notes: cd.damageNotes, hire_status: "off_hire", hire_end_date: end, total_hire_period: period,
      });
      setVehicleRegister((items) =>
        items.map((item) =>
          normaliseReg(item.registration_number) === normaliseReg(active.registrationNumber)
            ? { ...item, is_active: false }
            : item,
        ),
      );
      setCheckoutOpen(false);
      toast.success("Vehicle checked out (off hire).");
    } catch {
      toast.error("Could not mark vehicle off hire. Please try again.");
    } finally {
      setActionLoading(null);
    }
  };

  // "Switching Hirer" — create a NEW vehicle card and make it active.
  // The user still needs to select the vehicle and use On Hire, so the
  // email/SMS notification flow runs with complete vehicle details.
  const switchVehicle = async () => {
    if (!hireId) {
      toast.warn("Save the hire before switching vehicle.");
      return;
    }
    setActionLoading("switch_vehicle");
    try {
      const created = await createVehicle(hireId);
      if (!created?.id) throw new Error("Vehicle create failed");
      const newVehicle: Vehicle = { ...EMPTY_VEHICLE, id: created.id as number };
      setVehicles((vs) => [...vs, newVehicle]);
      setActiveIndex(vehicles.length);
      setActiveVehicleId(created.id as number);
      toast.success("New hire vehicle added. Select the vehicle details, then mark it on hire.");
    } catch {
      toast.error("Could not switch vehicle. Please try again.");
    } finally {
      setActionLoading(null);
    }
  };

  const requestDeleteVehicle = (index: number) => {
    if (vehicles.length <= 1) {
      toast.warn("At least one hire vehicle card is required.");
      return;
    }
    setDeleteVehicleIndex(index);
  };

  const confirmDeleteVehicle = async () => {
    if (deleteVehicleIndex === null) return;
    const target = vehicles[deleteVehicleIndex];
    if (!target) {
      setDeleteVehicleIndex(null);
      return;
    }
    if (target.id && hireId) {
      const deleted = await deleteVehicle(hireId, target.id);
      if (!deleted) {
        toast.error("Could not delete vehicle. Please try again.");
        return;
      }
    }

    const remaining = vehicles.filter((_, index) => index !== deleteVehicleIndex);
    const nextIndex = activeIndex < deleteVehicleIndex ? activeIndex : Math.max(0, activeIndex - 1);
    setVehicles(remaining);
    setActiveIndex(nextIndex);
    setActiveVehicleId(remaining[nextIndex]?.id != null ? Number(remaining[nextIndex].id) : null);
    setDeleteVehicleIndex(null);
    toast.success("Vehicle deleted.");
  };

  const setStatus = (status: string) => { set("hireStatus", status); saveActive({ hire_status: status }); };

  const applyOnHire = async (start: string, startTime: string) => {
    const period = computePeriod(start, active.hireEndDate);
    patch({ hireStatus: "on_hire", hireStartDate: start, hireStartTime: startTime, totalHirePeriod: period });
    setVehicleRegister((items) =>
      items.map((item) =>
        normaliseReg(item.registration_number) === normaliseReg(active.registrationNumber)
          ? { ...item, is_active: true }
          : item,
      ),
    );
    await saveActive({
      hire_status: "on_hire",
      hire_start_date: start,
      hire_start_time: startTime,
      total_hire_period: period,
    });
    if (hireId) {
      try {
        await sendOnHireWhatsApp(hireId);
        toast.success("On-hire WhatsApp message sent.");
      } catch (err) {
        const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
        toast.warn(detail || "Vehicle marked on hire, but the WhatsApp message could not be sent.");
      }
    }
    toast.success("Vehicle marked on hire.");
  };

  // On Hire -> prepare the automated email preview. The modal send action then
  // sends the structured email, stamps the date/time, and sends the SMS.
  const onHireClick = async () => {
    if (vehicleUnavailable) {
      toast.warn("This vehicle is already on hire for another fleet record.");
      return;
    }
    if (!hireId) {
      toast.warn("Save the hire before marking the vehicle on hire.");
      return;
    }
    if (!active.registrationNumber || !active.make || !active.model) {
      toast.warn("Select a registration number before marking the vehicle on hire.");
      return;
    }
    if (!hire?.driver_email) {
      toast.warn("Add the hirer email on Driver Details before marking the vehicle on hire.");
      return;
    }
    const start = today();
    const startTime = currentTime24();
    const hireStart = `${displayDate(start)} ${startTime}`;
    const subject = `Vehicle On Hire - ${active.registrationNumber}`;

    const body = [
      `Dear ${hire.driver_name || "Hirer"},`,
      "",
      "Please see the vehicle details below.",
      "",
      `Registration: ${active.registrationNumber}`,
      `Make: ${active.make}`,
      `Model: ${active.model}`,
      `Hire Start: ${hireStart}`,
      "",
      "Please keep this email for your records during the hire period.",
      "If you need assistance during the hire, please contact Skyline Car Hire (UK) Ltd.",
      "Please note that in the event of a road traffic accident you must call 0800 410 1999.",
      "",
      "Kind regards,",
      "Skyline Car Hire (UK) Ltd",
    ].join("\n");

    setActionLoading("on_hire_preview");
    try {
      // The modal shows an EDITABLE message (to/cc/subject/body). The actual email that
      // sends is always the structured (boxed) template — the free-form body is not used.
      setEmailTitle("On-Hire Email");
      setEmailTo(hire.driver_email);
      setEmailSubject(subject);
      setEmailBody(body);
      setEmailFiles([]);
      setEmailPreviewHtml("");
      setEmailSendOverride(() => async ({ to, cc, subject: nextSubject }: FleetEmailSendArgs) =>
        sendOnHireEmail(hireId, {
          to,
          cc,
          subject: nextSubject,
          registration: active.registrationNumber,
          make: active.make,
          model: active.model,
          hire_start: hireStart,
        }),
      );
      setEmailAfterSend(() => async () => {
        setActionLoading("on_hire");
        try {
          await applyOnHire(start, startTime);
        } catch {
          toast.error("Email sent, but the vehicle could not be marked on hire.");
        } finally {
          setActionLoading(null);
        }
      });
    } catch (err) {
      const detail = (err as { response?: { data?: { detail?: string } }; message?: string })?.response?.data?.detail;
      toast.error(detail || (err as Error)?.message || "Could not prepare on-hire email preview.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleGeneratedAction = async (
    action: "print" | "download" | "email",
    document: { label: string; key?: GeneratedDocumentKey },
  ) => {
    if (!hireId) {
      toast.warn("Save the hire before generating documents.");
      return;
    }
    if (!document.key) {
      toast.info(`${document.label} will be wired next.`);
      return;
    }
    const vehicleId = active.id;
    if (!vehicleId) {
      toast.warn("Save the hire vehicle before generating documents.");
      return;
    }
    const loadingKey = `${document.key}:${action}`;
    setGeneratedActionLoading(loadingKey);
    try {
      if (action === "email") {
        const files = await getGeneratedDocumentFiles(hireId, document.key, vehicleId);
        setEmailTitle("Email Document");
        setEmailTo("");
        setEmailFiles(files);
        setEmailSubject(`${document.label} - ${active.registrationNumber || "Fleet Hire"}`);
        setEmailBody(`Please find attached: ${document.label}.`);
        setEmailAfterSend(null);
        return;
      }

      if (action === "print") {
        await openGeneratedDocumentPrintView(hireId, document.key, vehicleId);
        toast.success("Printable view opened.");
      } else {
        await downloadGeneratedDocumentBundle(hireId, document.key, vehicleId);
        toast.success("Hire documents downloaded.");
      }
    } catch {
      toast.error(`Failed to prepare ${document.label}.`);
    } finally {
      setGeneratedActionLoading(null);
    }
  };

  const closeEmailModal = () => {
    setEmailTitle("Email Document");
    setEmailTo("");
    setEmailSubject(null);
    setEmailBody("");
    setEmailFiles([]);
    setEmailAfterSend(null);
    setEmailPreviewHtml("");
    setEmailSendOverride(null);
  };

  return (
    <div className="w-full max-w-[788px] flex flex-col gap-6 font-sans-headline">
      {initialLoading && <FleetSpinnerLoader />}
      {actionLoading && <FleetSpinnerLoader />}
      {generatedActionLoading && <FleetSpinnerLoader />}
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-black text-2xl font-semibold leading-6">Hire Vehicle Details</h2>
        <button type="button" onClick={() => setProvisionOpen(true)} className="h-8 px-3 py-2 bg-neutral-900 rounded flex items-center gap-2 text-white text-sm hover:bg-black">
          <ClockIcon />
          Provision Log
        </button>
      </div>

      {/* Vehicle cards */}
      <div className="flex gap-6">
        {vehicles.map((v, i) => {
          const isActive = i === activeIndex;
          return (
            <div
              key={v.id ?? i}
              className={`flex-1 p-5 rounded-lg outline outline-1 -outline-offset-1 flex items-start gap-4 ${
                isActive ? "bg-neutral-100 outline-neutral-700" : "bg-white outline-neutral-200"
              }`}
            >
              <button
                type="button"
                onClick={() => selectVehicle(i)}
                className="flex-1 min-w-0 rounded-lg flex flex-col items-start gap-1 text-left"
              >
                <div className={`${isActive ? "text-neutral-900" : "text-neutral-500"} text-xl font-semibold leading-5`}>Vehicle{i + 1}</div>
                <div className={`${isActive ? "text-neutral-700" : "text-neutral-500"} text-sm font-medium truncate max-w-full`}>{v.registrationNumber || "Reg#"}</div>
              </button>
              <button
                type="button"
                onClick={() => requestDeleteVehicle(i)}
                className="w-5 h-5 shrink-0 flex items-center justify-center"
                title={`Delete Vehicle${i + 1}`}
              >
                <img src={RemoveIcon} alt="" className="w-4 h-4 opacity-60" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Hire Vehicle Details (bound to the active vehicle) */}
      <section className={SECTION}>
        <h3 className={H3}>Hire Vehicle Details</h3>
        <div className="h-px bg-neutral-100" />
        <div className="grid grid-cols-2 gap-5">
          <FleetTextInput label="Vehicle Cost Per Week" placeholder="Enter Cost" inputMode="decimal" value={active.vehicleCostPerWeek} onChange={(v) => set("vehicleCostPerWeek", v)} onBlur={() => bufferField({ vehicle_cost_per_week: active.vehicleCostPerWeek })} />
          {/* Swap vehicles carry the deposit taken on Vehicle1 — only the first card collects it. */}
          {activeIndex === 0 ? (
            <FleetTextInput label="Security Deposit" placeholder="Enter Deposit" inputMode="decimal" value={active.deposit} onChange={(v) => set("deposit", v)} onBlur={() => bufferField({ deposit: active.deposit })} />
          ) : (
            <div />
          )}
        </div>
        <div className="grid grid-cols-2 gap-5">
          <FleetSelect label="Borough" value={active.borough} options={BOROUGH_OPTIONS} onChange={(v) => { set("borough", v); bufferField({ borough: v }); }} />
          <div />
        </div>
        <div className="grid grid-cols-2 gap-5">
          <FleetCreatableSelect
            label="Registration Number"
            placeholder="Search Reg Number"
            value={active.registrationNumber}
            options={registrationOptions}
            onChange={handleRegistrationSelect}
          />
          <div />
        </div>
        <div className="grid grid-cols-2 gap-5">
          <FleetTextInput
            label="Make"
            placeholder="Auto-filled from registration"
            value={active.make}
            onChange={(v) => set("make", v)}
            onBlur={async () => {
              bufferField({ make: active.make || null });
              await saveRegisterFromVehicle(active);
            }}
          />
          <FleetTextInput
            label="Model"
            placeholder="Auto-filled from registration"
            value={active.model}
            onChange={(v) => set("model", v)}
            onBlur={async () => {
              bufferField({ model: active.model || null });
              await saveRegisterFromVehicle(active);
            }}
          />
        </div>
        <div className="grid grid-cols-2 gap-5">
          <FleetSelect
            label="Transmission"
            placeholder="Select Transmission"
            value={active.transmission}
            options={TRANSMISSION_OPTIONS}
            onChange={async (v) => {
              set("transmission", v);
              bufferField({ transmission: v || null });
              await saveRegisterFromVehicle({ ...active, transmission: v });
            }}
          />
          <div />
        </div>
      </section>

      {/* On / Off hire */}
      <section className={SECTION}>
        <div className="flex justify-between items-center gap-4">
          <span />
          <div className="flex items-center gap-4">
            {vehicleUnavailable && (
              <span className="px-4 py-2 rounded-full bg-neutral-100 text-neutral-700 text-sm font-medium whitespace-nowrap">
                Vehicle not available - already on hire.
              </span>
            )}
            <button
              type="button"
              disabled={offHire || onHire || vehicleUnavailable}
              onClick={onHireClick}
              className={`px-10 py-4 rounded text-base font-medium outline outline-1 -outline-offset-1 ${
                offHire || onHire || vehicleUnavailable
                  ? "bg-white text-neutral-300 outline-neutral-200 cursor-not-allowed"
                  : "bg-white text-neutral-900 outline-neutral-900 hover:bg-neutral-50"
              }`}
            >
              On Hire
            </button>
            <button
              type="button"
              disabled={offHire}
              onClick={() => setCheckoutOpen(true)}
              className={`px-10 py-4 rounded text-base font-medium outline outline-1 -outline-offset-1 ${
                offHire
                  ? "bg-white text-neutral-300 outline-neutral-200 cursor-not-allowed"
                  : "bg-white text-neutral-900 outline-neutral-900 hover:bg-neutral-50"
              }`}
            >
              Off Hire
            </button>
          </div>
        </div>
      </section>

      {/* Swap — Yes/No always visible; reason + CTAs appear on "Yes". */}
      <section className={SECTION}>
        <div className="flex items-start gap-5">
          <div className="w-96 flex flex-col gap-5">
            <span className="text-neutral-700 text-sm font-medium">Do you want to swap the car?</span>
            <div className="flex items-center gap-5">
              <Radio checked={active.swapCar === "yes"} label="Yes" onClick={() => { set("swapCar", "yes"); bufferField({ swap_car: "yes" }); }} />
              <Radio checked={active.swapCar === "no"} label="No" onClick={() => { set("swapCar", "no"); bufferField({ swap_car: "no" }); }} />
            </div>
          </div>
          {active.swapCar === "yes" && (
            <div className="flex-1">
              <FleetSelect label="Swap Reason" value={active.swapReason} options={SWAP_REASON_OPTIONS} onChange={(v) => { set("swapReason", v); bufferField({ swap_reason: v }); }} />
            </div>
          )}
        </div>

        {active.swapCar === "yes" && (
          <>
            <div className="flex flex-col gap-2">
              <span className="text-neutral-700 text-sm font-medium">Reason</span>
              <textarea
                value={active.swapReasonText}
                onChange={(e) => set("swapReasonText", e.target.value)}
                onBlur={() => bufferField({ swap_reason_text: active.swapReasonText })}
                placeholder="Reason to swap"
                rows={3}
                className="h-24 px-5 py-4 bg-white rounded outline outline-1 -outline-offset-1 outline-neutral-200 text-base text-neutral-900 placeholder:text-neutral-300 focus:outline-neutral-900 resize-none"
              />
            </div>
            <div className="flex justify-end items-center gap-4">
              <button type="button" onClick={() => setCrossOpen(true)} className={OUTLINE_BTN}>If Vehicle Cross-Hired to Us</button>
              <button type="button" onClick={switchVehicle} className={OUTLINE_BTN}>Switching Hirer into Different Hire Vehicle</button>
            </div>
          </>
        )}
      </section>

      {/* Hire Dates & Duration */}
      <section className={SECTION}>
        <h3 className={H3}>Hire Dates &amp; Duration</h3>
        <div className="h-px bg-neutral-100" />
        <div className="grid grid-cols-2 gap-5">
          <div className="flex flex-col gap-1">
            <FleetDateField label="Hire Start Date" value={active.hireStartDate} onChange={(v) => onHireDate("hireStartDate", "hire_start_date", v)} />
            {active.hireStartDate && active.hireStartTime && (
              <span className="text-neutral-500 text-sm">{formatTime24(active.hireStartTime)}</span>
            )}
          </div>
          <div className="flex flex-col gap-1">
            <FleetDateField label="Hire End Date" value={active.hireEndDate} onChange={(v) => onHireDate("hireEndDate", "hire_end_date", v)} />
            {active.hireEndDate && active.checkout.checkoutTime && (
              <span className="text-neutral-500 text-sm">{formatTime24(active.checkout.checkoutTime)}</span>
            )}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-5">
          <FleetTextInput label="Total Hire Period" placeholder="Auto-calculated" value={active.totalHirePeriod} onChange={(v) => set("totalHirePeriod", v)} onBlur={() => bufferField({ total_hire_period: active.totalHirePeriod })} />
          <div />
        </div>
      </section>

      <section className={SECTION}>
        <h3 className={H3}>Generate Hire Documents</h3>
        <div className="h-px bg-neutral-100" />
        {GENERATED_DOCUMENTS.map((document, index) => {
          const busy = generatedActionLoading?.startsWith(`${document.key || document.label}:`) || false;
          return (
          <React.Fragment key={document.label}>
            <div className="self-stretch flex justify-between items-start gap-4">
              <div className="flex items-center gap-2">
                <div className="text-neutral-700 text-sm font-semibold">{document.label}</div>
              </div>
              <div className="flex items-center gap-4">
                {/* <IconButton icon={PrintIcon} label={`Print ${document.label}`} disabled={busy} onClick={() => handleGeneratedAction("print", document)} /> */}
                <IconButton icon={DownloadIcon} label={`Download ${document.label}`} disabled={busy} onClick={() => handleGeneratedAction("download", document)} />
                <IconButton icon={EmailIcon} label={`Email ${document.label}`} disabled={busy} onClick={() => handleGeneratedAction("email", document)} />
              </div>
            </div>
            {index < GENERATED_DOCUMENTS.length - 1 && <div className="h-px bg-neutral-100" />}
          </React.Fragment>
        );
        })}
      </section>

      {/* Hire Vehicle Insurance Details */}
      <section className={SECTION}>
        <h3 className={H3}>Hire Vehicle Insurance Details</h3>
        <div className="h-px bg-neutral-100" />
        <div className="grid grid-cols-2 gap-5">
          <FleetSelect
            label="Insurance Type"
            value={active.hireInsuranceType}
            options={INSURANCE_TYPE_OPTIONS}
            onChange={handleInsuranceType}
            menuPlacement="bottom"
          />
          <div />
        </div>

        {customerOwnInsurance && (
          <>
            <div className="h-px bg-neutral-100" />
            {insuranceOcrLoading && <FleetInlineLoader text="Reading insurance certificate..." />}

            {active.insuranceCertName ? (
              <div className="p-4 rounded-lg outline outline-1 -outline-offset-1 outline-neutral-200 flex items-center justify-between gap-4">
                <div className="min-w-0 flex items-center gap-3">
                  <img src={fileIconFor(active.insuranceCertName)} alt="" className="w-10 h-10 shrink-0" />
                  <div className="min-w-0 flex flex-col gap-1">
                    <span className="truncate text-neutral-900 text-sm font-medium">{active.insuranceCertName}</span>
                    <span className="text-neutral-500 text-xs">
                      {active.insuranceCertIsPdf ? "PDF document" : "Insurance certificate"}
                    </span>
                  </div>
                </div>
                <div className="shrink-0 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={viewInsuranceCertificate}
                    title="View certificate"
                    aria-label="View certificate"
                    className="w-9 h-9 rounded bg-white outline outline-1 -outline-offset-1 outline-neutral-200 flex items-center justify-center text-neutral-900 hover:bg-neutral-50"
                  >
                    <Eye size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setCertOpen(true)}
                    title="Replace certificate"
                    aria-label="Replace certificate"
                    className="w-9 h-9 rounded bg-white outline outline-1 -outline-offset-1 outline-neutral-200 flex items-center justify-center hover:bg-neutral-50"
                  >
                    <img src={UploadFileIcon} alt="" className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteCertOpen(true)}
                    title="Delete certificate"
                    aria-label="Delete certificate"
                    className="w-9 h-9 rounded bg-white outline outline-1 -outline-offset-1 outline-neutral-200 flex items-center justify-center hover:bg-neutral-50"
                  >
                    <img src={RemoveIcon} alt="" className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <button type="button" onClick={() => setCertOpen(true)} className="p-6 rounded-lg border-2 border-dashed border-neutral-200 flex flex-col items-center justify-center gap-4 hover:bg-neutral-50">
                <UploadPrompt />
                <div className="flex flex-col items-center gap-1">
                  <span className="text-black text-base font-semibold">Upload Insurance Certificate</span>
                  <span className="text-black text-sm">JPG, PNG, PDF Supported</span>
                </div>
              </button>
            )}

            <div className="grid grid-cols-2 gap-5">
              <FleetDateField label="Date Received" value={active.dateReceived} onChange={(v) => { set("dateReceived", v); bufferField({ insurance_date_received: v || null }); }} />
              <div />
            </div>
            <div className="grid grid-cols-2 gap-5">
              <FleetDateField label="Policy Start Date" value={active.policyStartDate} onChange={(v) => { set("policyStartDate", v); bufferField({ policy_start_date: v || null }); }} />
              <FleetDateField label="Policy End Date" value={active.policyEndDate} onChange={(v) => { set("policyEndDate", v); bufferField({ policy_end_date: v || null }); }} />
            </div>
          </>
        )}
      </section>

      <FleetProvisionSlider
        isOpen={provisionOpen}
        onClose={() => setProvisionOpen(false)}
        logs={vehicles
          .filter((v) => v.registrationNumber || v.make || v.model)
          .map((v) => ({
            registration: v.registrationNumber,
            make: v.make,
            model: v.model,
            start: v.hireStartDate,
            end: v.hireStatus === "off_hire" ? v.hireEndDate || v.checkout.checkoutDate : "",
          }))}
      />

      {crossOpen && (
        <CrossHiredModal
          initial={{ providerName: active.crossHireProviderName, contactDetails: active.crossHireContactDetails, rate: active.crossHireRate }}
          onClose={() => setCrossOpen(false)}
          onSave={(v) => {
            patch({ crossHireProviderName: v.providerName, crossHireContactDetails: v.contactDetails, crossHireRate: v.rate });
            saveActive({ cross_hire_provider_name: v.providerName, cross_hire_contact_details: v.contactDetails, cross_hire_rate: v.rate });
            setCrossOpen(false);
            toast.success("Cross-hire details saved.");
          }}
        />
      )}

      {checkoutOpen && (
        <FleetCheckoutModal initial={active.checkout} onCancel={() => setCheckoutOpen(false)} onComplete={completeCheckout} />
      )}

      <FleetUploadModal open={certOpen} onClose={() => setCertOpen(false)} onUploaded={handleCert} title="Upload Insurance Certificate" />
      {deleteCertOpen && (
        <FleetConfirmModal
          title="Delete Insurance Certificate"
          message={`Are you sure you want to delete ${active.insuranceCertName || "this certificate"}?`}
          confirmLabel="Delete"
          onCancel={() => setDeleteCertOpen(false)}
          onConfirm={confirmDeleteCertificate}
        />
      )}
      {deleteVehicleIndex !== null && (
        <FleetConfirmModal
          title="Delete Vehicle"
          message={`Are you sure you want to delete Vehicle${deleteVehicleIndex + 1}?`}
          confirmLabel="Delete"
          onCancel={() => setDeleteVehicleIndex(null)}
          onConfirm={confirmDeleteVehicle}
        />
      )}
      <FleetEmailModal
        open={emailSubject !== null}
        onClose={closeEmailModal}
        hireId={hireId}
        title={emailTitle}
        defaultTo={emailTo}
        defaultSubject={emailSubject || ""}
        defaultBody={emailBody}
        initialFiles={emailFiles}
        onSent={emailAfterSend || undefined}
        previewHtml={emailPreviewHtml}
        sendOverride={emailSendOverride || undefined}
      />
    </div>
  );
};

export default HireVehicleDetails;
