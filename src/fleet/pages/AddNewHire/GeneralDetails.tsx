import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { FleetTextInput, FleetSelect, FleetReadonlyField, FleetTimeSelect, roundToQuarter } from "../../components/fields";
import PayReimburseHirerModal from "../../components/PayReimburseHirerModal";
import FleetDepositRefundModal from "../../components/FleetDepositRefundModal";
import FleetPayHirerEmailModal from "../../components/FleetPayHirerEmailModal";
import { getDepositRefundPreview, getPayHirerPreview } from "../../services/emailService";
import Calendar from "../../assets/icons/Calendar.svg";
import CloseFileIcon from "../../assets/icons/CloseFile.svg";
import {
  INSURANCE_TYPE_OPTIONS,
  CURRENT_POSITION_OPTIONS,
  type GeneralDetailsForm,
} from "../../types/hire";
import { useHire } from "./HireContext";

// Accounts recipients for the deposit-refund request (editable in the modal).
const REFUND_RECIPIENTS = "marwanationwideassist@outlook.com";
const PAY_HIRER_RECIPIENTS = "marwanationwideassist@outlook.com";

const now = () => new Date();
const fmtDate = (d: Date) => d.toLocaleDateString("en-GB"); // dd/mm/yyyy
const fmtTime = (d: Date) => d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false });
const fromIso = (value?: string) => {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
};

// Sort code as XX-XX-XX (up to 6 digits).
const formatSortCode = (v: string) =>
  v.replace(/\D/g, "").slice(0, 6).replace(/(\d{2})(?=\d)/g, "$1-");

const GeneralDetails: React.FC = () => {
  const [form, setForm] = useState<GeneralDetailsForm>({
    fileOpenedDate: "",
    fileOpenedTime: "",
    fileClosedOn: "",
    insuranceType: "",
    rentalAdvisor: "",
    currentPosition: "",
    bankName: "",
    accountName: "",
    sortCode: "",
    accountNumber: "",
    isClosed: false,
  });
  const [payOpen, setPayOpen] = useState(false);
  const [payEmailOpen, setPayEmailOpen] = useState(false);
  const [preparingPayEmail, setPreparingPayEmail] = useState(false);
  const [payPreview, setPayPreview] = useState("");
  const [payDraft, setPayDraft] = useState({ amount: "", reason: "" });
  const [refundOpen, setRefundOpen] = useState(false);
  const [preparingRefund, setPreparingRefund] = useState(false);
  const [refundPreview, setRefundPreview] = useState("");
  const { hire, hireId, save } = useHire();

  // File Opened date is auto-populated (read-only); the time defaults to now,
  // rounded to the nearest 15-min slot, and stays editable via the dropdown.
  useEffect(() => {
    const opened = fromIso(hire?.file_opened_at) || now();
    const closed = fromIso(hire?.file_closed_at);
    setForm((f) => ({
      ...f,
      fileOpenedDate: fmtDate(opened),
      fileOpenedTime: roundToQuarter(opened.getHours(), opened.getMinutes()),
      fileClosedOn: closed ? `${fmtDate(closed)} ${fmtTime(closed)}` : "",
      insuranceType: hire?.insurance_type || "",
      rentalAdvisor: hire?.rental_advisor || "",
      currentPosition: hire?.current_position || "",
      bankName: hire?.bank_name || "",
      accountName: hire?.account_name || "",
      sortCode: hire?.sort_code || "",
      accountNumber: hire?.account_number || "",
      isClosed: Boolean(closed),
    }));
  }, [hire]);

  const set = <K extends keyof GeneralDetailsForm>(key: K, value: GeneralDetailsForm[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleCloseFile = () => {
    if (form.isClosed) return;
    const d = now();
    setForm((f) => ({ ...f, fileClosedOn: `${fmtDate(d)} ${fmtTime(d)}`, isClosed: true }));
    save({ file_closed_at: d.toISOString() });
    toast.success("File closed successfully.");
  };

  const handlePaySubmit = async ({ amount, reason }: { amount: string; reason: string }) => {
    setPayOpen(false);
    if (!hireId) {
      toast.error("Save the hire before requesting a payment.");
      return;
    }
    const draft = { amount, reason };
    setPayDraft(draft);
    setPreparingPayEmail(true);
    try {
      setPayPreview(await getPayHirerPreview(hireId, draft));
      setPayEmailOpen(true);
    } finally {
      setPreparingPayEmail(false);
    }
  };

  // Prepare the email preview first, then open the fully-populated modal.
  const handleProcessRefund = async () => {
    if (!hireId) {
      toast.error("Save the hire before requesting a refund.");
      return;
    }
    setPreparingRefund(true);
    try {
      setRefundPreview(await getDepositRefundPreview(hireId));
      setRefundOpen(true);
    } finally {
      setPreparingRefund(false);
    }
  };

  const disabled = form.isClosed;

  return (
    <div className="w-full max-w-[788px] flex flex-col gap-6 font-sans-headline">
      <h2 className="text-black text-2xl font-semibold leading-6">General Details</h2>

      {/* File Status */}
      <section className="p-5 rounded-lg outline outline-1 -outline-offset-1 outline-neutral-100 flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <h3 className="text-black text-xl font-semibold leading-5">File Status</h3>
          <button
            type="button"
            onClick={handleCloseFile}
            disabled={disabled}
            className="h-8 px-3 py-2 bg-neutral-900 rounded flex items-center gap-2 text-white text-sm hover:bg-black disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <img src={CloseFileIcon} alt="" className="w-4 h-4" />
            {disabled ? "File Closed" : "Close File"}
          </button>
        </div>
        <div className="h-px bg-neutral-100" />

        <div className="grid grid-cols-2 gap-5">
          <FleetReadonlyField label="File Opened On" value={form.fileOpenedDate} placeholder="Date" icon={Calendar} />
          <FleetTimeSelect label="Time" value={form.fileOpenedTime} onChange={(v) => set("fileOpenedTime", v)} disabled={disabled} />
        </div>
        <div className="grid grid-cols-2 gap-5">
          <FleetReadonlyField label="File Closed On" value={form.fileClosedOn} placeholder="Date" icon={Calendar} />
          <div />
        </div>
        <div className="grid grid-cols-2 gap-5">
          <FleetSelect
            label="Insurance Type"
            value={form.insuranceType}
            options={INSURANCE_TYPE_OPTIONS}
            onChange={(v) => {
              set("insuranceType", v);
              save({ insurance_type: v });
            }}
            disabled={disabled}
          />
          <FleetTextInput
            label="Rental Advisor"
            placeholder="Enter Name"
            value={form.rentalAdvisor}
            onChange={(v) => set("rentalAdvisor", v)}
            onBlur={() => save({ rental_advisor: form.rentalAdvisor })}
            disabled={disabled}
          />
        </div>
        <div className="grid grid-cols-2 gap-5">
          <FleetSelect
            label="Current Position"
            value={form.currentPosition}
            options={CURRENT_POSITION_OPTIONS}
            onChange={(v) => {
              set("currentPosition", v);
              save({ current_position: v });
            }}
            disabled={disabled}
          />
          <div />
        </div>
      </section>

      {/* Bank Details */}
      <section className="p-5 rounded-lg outline outline-1 -outline-offset-1 outline-neutral-100 flex flex-col gap-4">
        <h3 className="text-black text-xl font-semibold leading-5">Bank Details</h3>
        <div className="h-px bg-neutral-100" />

        <div className="grid grid-cols-2 gap-5">
          <FleetTextInput
            label="Bank Name"
            placeholder="Enter Name"
            value={form.bankName}
            onChange={(v) => set("bankName", v)}
            onBlur={() => save({ bank_name: form.bankName })}
            disabled={disabled}
          />
          <FleetTextInput
            label="Account Name"
            placeholder="Enter Name"
            value={form.accountName}
            onChange={(v) => set("accountName", v)}
            onBlur={() => save({ account_name: form.accountName })}
            disabled={disabled}
          />
        </div>
        <div className="grid grid-cols-2 gap-5">
          <FleetTextInput
            label="Sort Code"
            placeholder="XX-XX-XX"
            value={form.sortCode}
            inputMode="numeric"
            maxLength={8}
            onChange={(v) => set("sortCode", formatSortCode(v))}
            onBlur={() => save({ sort_code: form.sortCode })}
            disabled={disabled}
          />
          <FleetTextInput
            label="Account Number"
            placeholder="Enter Number"
            value={form.accountNumber}
            inputMode="numeric"
            maxLength={8}
            onChange={(v) => set("accountNumber", v.replace(/\D/g, "").slice(0, 8))}
            onBlur={() => save({ account_number: form.accountNumber })}
            disabled={disabled}
          />
        </div>

        <div className="py-4 flex flex-wrap items-center gap-4">
          <button
            type="button"
            onClick={() => setPayOpen(true)}
            disabled={disabled}
            className="h-9 px-4 py-2 bg-neutral-900 rounded text-white text-sm hover:bg-black disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Pay / Reimburse Hirer
          </button>
          <button
            type="button"
            onClick={handleProcessRefund}
            disabled={disabled || preparingRefund}
            className="h-9 px-4 py-2 bg-neutral-900 rounded text-white text-sm hover:bg-black disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Process Deposit Refund
          </button>
        </div>
      </section>

      <PayReimburseHirerModal open={payOpen} onClose={() => setPayOpen(false)} onSubmit={handlePaySubmit} />

      {(preparingRefund || preparingPayEmail) && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/30 font-sans-headline">
          <div className="bg-white rounded-lg px-8 py-6 flex items-center gap-4 shadow-xl">
            <span className="animate-spin h-6 w-6 rounded-full border-[3px] border-neutral-200 border-t-neutral-900" />
            <span className="text-sm font-medium text-neutral-700">Preparing email preview…</span>
          </div>
        </div>
      )}

      <FleetPayHirerEmailModal
        open={payEmailOpen}
        onClose={() => setPayEmailOpen(false)}
        hireId={hireId}
        defaultTo={PAY_HIRER_RECIPIENTS}
        amount={payDraft.amount}
        reason={payDraft.reason}
        previewHtml={payPreview}
      />

      <FleetDepositRefundModal
        open={refundOpen}
        onClose={() => setRefundOpen(false)}
        hireId={hireId}
        defaultTo={REFUND_RECIPIENTS}
        previewHtml={refundPreview}
      />
    </div>
  );
};

export default GeneralDetails;
