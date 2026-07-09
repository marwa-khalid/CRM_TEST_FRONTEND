import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { FleetTextInput, FleetSelect, FleetReadonlyField } from "../../components/fields";
import PayReimburseHirerModal from "../../components/PayReimburseHirerModal";
import Calendar from "../../assets/icons/Calendar.svg";
import Time from "../../assets/icons/Time.svg";
import CloseFileIcon from "../../assets/icons/CloseFile.svg";
import {
  INSURANCE_TYPE_OPTIONS,
  CURRENT_POSITION_OPTIONS,
  GeneralDetailsForm,
} from "../../types/hire";
import { useHire } from "./HireContext";

const now = () => new Date();
const fmtDate = (d: Date) => d.toLocaleDateString("en-GB"); // dd/mm/yyyy
const fmtTime = (d: Date) => d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

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
  const { save } = useHire();

  // File Opened is auto-populated with the file creation date/time (read-only).
  useEffect(() => {
    const d = now();
    setForm((f) => ({ ...f, fileOpenedDate: fmtDate(d), fileOpenedTime: fmtTime(d) }));
  }, []);

  const set = <K extends keyof GeneralDetailsForm>(key: K, value: GeneralDetailsForm[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleCloseFile = () => {
    if (form.isClosed) return;
    const d = now();
    setForm((f) => ({ ...f, fileClosedOn: `${fmtDate(d)} ${fmtTime(d)}`, isClosed: true }));
    save({ file_closed_at: d.toISOString() });
    toast.success("File closed successfully.");
  };

  // Email is triggered server-side from a predefined template — wired in a later story.
  const handlePaySubmit = ({ amount }: { amount: string; reason: string }) => {
    setPayOpen(false);
    toast.success(`Payment request submitted (£${amount}).`);
  };

  const handleProcessRefund = () => {
    toast.success("Deposit refund request submitted.");
  };

  const disabled = form.isClosed;

  return (
    <div className="w-full max-w-[788px] flex flex-col gap-6 font-['Stack_Sans_Headline']">
      <h2 className="text-black text-2xl font-semibold leading-6">General Details</h2>

      {/* File Status */}
      <section className="p-5 rounded-lg outline outline-1 -outline-offset-1 outline-neutral-100 flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <h3 className="text-black text-xl font-semibold leading-5">File Status</h3>
          <button
            type="button"
            onClick={handleCloseFile}
            disabled={disabled}
            className="h-8 px-3 py-2 bg-neutral-900 rounded-sm flex items-center gap-2 text-white text-sm hover:bg-black disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <img src={CloseFileIcon} alt="" className="w-4 h-4" />
            {disabled ? "File Closed" : "Close File"}
          </button>
        </div>
        <div className="h-px bg-neutral-100" />

        <div className="grid grid-cols-2 gap-5">
          <FleetReadonlyField label="File Opened On" value={form.fileOpenedDate} placeholder="Date" icon={Calendar} />
          <FleetReadonlyField label="Time" value={form.fileOpenedTime} placeholder="Time" icon={Time} />
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
            className="h-9 px-4 py-2 bg-neutral-900 rounded-sm text-white text-sm hover:bg-black disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Pay / Reimburse Hirer
          </button>
          <button
            type="button"
            onClick={handleProcessRefund}
            disabled={disabled}
            className="h-9 px-4 py-2 bg-neutral-900 rounded-sm text-white text-sm hover:bg-black disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Process Deposit Refund
          </button>
        </div>
      </section>

      <PayReimburseHirerModal open={payOpen} onClose={() => setPayOpen(false)} onSubmit={handlePaySubmit} />
    </div>
  );
};

export default GeneralDetails;
