import React, { useEffect, useMemo, useRef, useState } from "react";
import { useFormik } from "formik";
import { toast } from "react-toastify";
import { getABIBHRCharges, saveABIBHRCharges, generatePaymentPack } from "../../../services/ABIBHRCharges/ABIBHRCharges";
import { getPlatingCharges } from "../../../services/PlatingCharges/PlatingCharges";
import { getStorageRecoveryProvider } from "../../../services/StorageRecovery/StorageRecovery";
import { gettingEnginerDetails } from "../../../services/EngineeringDetails/engineeringDetails";
import { getHireRecords } from "../../../services/HireDetail/HireDetails";
import { CustomDatePicker } from "../Components/DatePicker";
import Vector6 from "../../../assets/AutoClaim_icon/Vector-6.svg";
import Plus from "../../../assets/AutoClaim_icon/Plus.svg";
import { SpinnerLoader } from "../../../components/common/SpinnerLoader";


// ─── helpers ───────────────────────────────────────────────────────────────────

const toF = (v: any): number => parseFloat(String(v ?? 0)) || 0;

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + "Z");
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function diffDays(dateStr: string): number {
  const base = new Date(dateStr + "Z");
  const now = new Date();
  return Math.max(0, Math.floor((now.getTime() - base.getTime()) / 86400000));
}

function fmt(n: number): string {
  return n === 0 ? "0.00" : n.toFixed(2);
}

function dateToISO(d: Date): string {
  return d.toISOString().slice(0, 10);
}

// ─── main component ────────────────────────────────────────────────────────────

const ABIBHRCharges = ({ paymentFormRef, claimId }: any) => {

  // ABI base rates (read-only, from hire records)
  const [abiDailyRate, setAbiDailyRate] = useState(0);
  const [abiExtraCharges, setAbiExtraCharges] = useState(0);
  const [abiAdminFee, setAbiAdminFee] = useState(0);
  const [bhrAdminFee, setBhrAdminFee] = useState(0);
  const [noOfDays, setNoOfDays] = useState(0);

  // Billed breakdown (auto-fetched, read-only)
  const [storageCharges, setStorageCharges] = useState(0);
  const [recoveryCharges, setRecoveryCharges] = useState(0);
  const [engineerCharges, setEngineerCharges] = useState(0);
  const [platingCharges, setPlatingCharges] = useState(0);

  // Date picker visibility state
  const [showRaisedPicker, setShowRaisedPicker] = useState(false);
  const [showSentPicker, setShowSentPicker] = useState(false);
  const [showPaidPicker, setShowPaidPicker] = useState(false);
  const [showPenaltyDue30Picker, setShowPenaltyDue30Picker] = useState(false);
  const [showPenaltyDue60Picker, setShowPenaltyDue60Picker] = useState(false);
  const [showPenaltyDue61Picker, setShowPenaltyDue61Picker] = useState(false);
  const [showPenaltyDue90Picker, setShowPenaltyDue90Picker] = useState(false);
  const raisedRef = useRef<HTMLDivElement>(null);
  const sentRef = useRef<HTMLDivElement>(null);
  const paidRef = useRef<HTMLDivElement>(null);
  const penaltyDue30Ref = useRef<HTMLDivElement>(null);
  const penaltyDue60Ref = useRef<HTMLDivElement>(null);
  const penaltyDue61Ref = useRef<HTMLDivElement>(null);
  const penaltyDue90Ref = useRef<HTMLDivElement>(null);

  const [penaltyDueDate30, setPenaltyDueDate30] = useState("");
  const [penaltyDueDate60, setPenaltyDueDate60] = useState("");
  const [penaltyDueDate61, setPenaltyDueDate61] = useState("");
  const [penaltyDueDate90, setPenaltyDueDate90] = useState("");

  const [isGenerating, setIsGenerating] = useState(false);
  const [loading, setLoading] = useState(true);

  // Formik — only the Payment Pack Sent Detail fields are saved to DB
  const formik = useFormik({
    initialValues: {
      payment_pack_raised_date: "",
      payment_pack_sent_date: "",
      invoice_number: "",
      date_hire_paid: "",
    },
    onSubmit: async (values) => {
      if (!claimId) return;
      try {
        await saveABIBHRCharges({
          claim_id: Number(claimId),
          payment_pack_raised_date: values.payment_pack_raised_date || null,
          payment_pack_sent_date: values.payment_pack_sent_date || null,
          invoice_number: values.invoice_number || null,
          date_hire_paid: values.date_hire_paid || null,
        });
        toast.success("ABI & BHR charges saved");
      } catch {
        toast.error("Failed to save charges");
        throw new Error("save failed");
      }
    },
  });

  // Expose to parent so "Save & Next" works
  useEffect(() => {
    if (paymentFormRef) paymentFormRef.current = formik;
  }, [formik]);

  // Close date pickers when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (raisedRef.current && !raisedRef.current.contains(e.target as Node))
        setShowRaisedPicker(false);
      if (sentRef.current && !sentRef.current.contains(e.target as Node))
        setShowSentPicker(false);
      if (paidRef.current && !paidRef.current.contains(e.target as Node))
        setShowPaidPicker(false);
      if (penaltyDue30Ref.current && !penaltyDue30Ref.current.contains(e.target as Node))
        setShowPenaltyDue30Picker(false);
      if (penaltyDue60Ref.current && !penaltyDue60Ref.current.contains(e.target as Node))
        setShowPenaltyDue60Picker(false);
      if (penaltyDue61Ref.current && !penaltyDue61Ref.current.contains(e.target as Node))
        setShowPenaltyDue61Picker(false);
      if (penaltyDue90Ref.current && !penaltyDue90Ref.current.contains(e.target as Node))
        setShowPenaltyDue90Picker(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Auto-set penalty due dates when raised date changes
  useEffect(() => {
    const rd = formik.values.payment_pack_raised_date;
    if (rd) {
      setPenaltyDueDate30(addDays(rd, 30));
      setPenaltyDueDate60(addDays(rd, 60));
      setPenaltyDueDate61(addDays(rd, 61));
      setPenaltyDueDate90(addDays(rd, 90));
    }
  }, [formik.values.payment_pack_raised_date]);

  // Load ABI/BHR rates from hire records
  useEffect(() => {
    if (!claimId) return;
    getHireRecords(claimId)
      .then(({ data }: any) => {
        const records: any[] = Array.isArray(data) ? data : [];
        const first = records[0];
        if (!first) return;
        setAbiDailyRate(toF(first.abi_hire_charge_per_day));
        setAbiExtraCharges(toF(first.abi_extra_charges_per_day));
        setAbiAdminFee(toF(first.abi_administration_fee));
        setBhrAdminFee(toF(first.bhr_administration_fee));
        // Total days = sum of every vehicle's total hire days
        setNoOfDays(
          records.reduce(
            (sum: number, r: any) =>
              sum + toF(r.final_total_no_of_hire_days ?? r.no_of_days_hire_so_far),
            0,
          ),
        );
      })
      .catch(() => {});
  }, [claimId]);

  // Load billed breakdown data from other screens
  useEffect(() => {
    if (!claimId) return;

    getStorageRecoveryProvider(claimId)
      .then(({ data }: any) => {
        const s = (data?.storages ?? []).reduce((sum: number, r: any) => sum + toF(r.total_storage_charges), 0);
        const r = (data?.recoveries ?? []).reduce((sum: number, r: any) => sum + toF(r.recovery_charges), 0);
        setStorageCharges(s);
        setRecoveryCharges(r);
      })
      .catch(() => {});

    gettingEnginerDetails(claimId)
      .then((data: any) => {
        setEngineerCharges(toF(data?.engineer_fee ?? data?.actual_fee));
      })
      .catch(() => {});

    getPlatingCharges(claimId)
      .then(({ data }: any) => {
        setPlatingCharges(toF(data?.total_plating_cost));
      })
      .catch(() => {});
  }, [claimId]);

  // Load saved Payment Pack Sent Detail
  useEffect(() => {
    if (!claimId) { setLoading(false); return; }
    getABIBHRCharges(claimId)
      .then(({ data }: any) => {
        if (!data) return;
        formik.setValues({
          payment_pack_raised_date: data.payment_pack_raised_date ?? "",
          payment_pack_sent_date: data.payment_pack_sent_date ?? "",
          invoice_number: data.invoice_number ?? "",
          date_hire_paid: data.date_hire_paid ?? "",
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [claimId]);

  // ── Generate Payment Pack ──────────────────────────────────────────────────
  const handleGeneratePaymentPack = async () => {
    if (!claimId || isGenerating) return;
    try {
      setIsGenerating(true);
      const response = await generatePaymentPack(claimId);
      const blob = new Blob([response.data], { type: "application/zip" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const disposition = response.headers?.["content-disposition"] ?? "";
      const match = disposition.match(/filename="([^"]+)"/);
      a.download = match ? match[1] : `PaymentPack_Claim${claimId}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      // Refresh the raised date field since the backend may have set it
      getABIBHRCharges(claimId)
        .then(({ data }: any) => {
          if (data?.payment_pack_raised_date) {
            formik.setFieldValue("payment_pack_raised_date", data.payment_pack_raised_date);
          }
        })
        .catch(() => {});

      toast.success("Payment pack generated and downloaded");
    } catch {
      toast.error("Failed to generate payment pack");
    } finally {
      setIsGenerating(false);
    }
  };

  // ── computed values ────────────────────────────────────────────────────────────
  const rd = formik.values.payment_pack_raised_date;

  const daysExpired = useMemo(() => (rd ? diffDays(rd) : null), [rd]);

  // 0-30 section
  const totalHire030 = useMemo(
    () => ((abiDailyRate + abiExtraCharges) * noOfDays)  + abiAdminFee,
    [abiDailyRate, abiExtraCharges, abiAdminFee, noOfDays]
  );

  // 31-60 section (+10%)
  const rate3160 = abiDailyRate * 1.1;
  const extra3160 = abiExtraCharges * 1.1;
  const admin3160 = abiAdminFee * 1.1;
  const totalHire3160 = ((rate3160 + extra3160) * noOfDays)  + admin3160;
console.log(rate3160)
console.log(extra3160)
console.log(admin3160);

  // 61+ section (+20%)
  const rate61plus = abiDailyRate * 1.2;
  const extra61plus = abiExtraCharges * 1.2;
  const admin61plus = abiAdminFee * 1.2;
  const totalHire61plus = ((rate61plus + extra61plus) * noOfDays)  + admin61plus;
console.log(rate61plus)

  // 90+ BHR (+35%)
  const bhrDailyRate = abiDailyRate * 1.35;
  const bhrExtra = abiExtraCharges * 1.35;
  const bhrAdmin = bhrAdminFee; // BHR administration fee from hire records (not surged)
  const totalHire90 = ((bhrDailyRate + bhrExtra ) * noOfDays) + bhrAdmin;

  // Billed Breakdown total (Credit Hire already includes admin)
  const totalOutlay =
    totalHire030 + abiAdminFee + storageCharges + recoveryCharges + engineerCharges + platingCharges;

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div className="w-full mt-3 flex flex-col justify-start items-start gap-6 bg-white font-['Stack_Sans_Headline']">
      {loading && <SpinnerLoader />}
      <div className="w-full flex items-center justify-between">
        <h1 className="text-black text-2xl font-weight-600 leading-6">
          ABI &amp; BHR Charges
        </h1>
        <button
          type="button"
          onClick={handleGeneratePaymentPack}
          disabled={isGenerating}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-100 disabled:bg-blue-100 text-blue-500 text-sm font-weight-500 rounded transition-all"
        >
          {isGenerating ? (
            <>
              <svg
                className="animate-spin w-4 h-4"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8H4z"
                />
              </svg>
              Generating...
            </>
          ) : (
            <>
            <img src={Plus} alt="" />
              Generate Payment Pack
            </>
          )}
        </button>
      </div>
      {/* Section 1: Payment Pack Sent Detail */}
      <section className="self-stretch p-5 rounded-lg border border-neutral-100 flex flex-col justify-start items-start gap-4">
        <div className="w-full flex items-center justify-between">
          <h2 className="text-neutral-900 text-xl font-weight-600 leading-5">
            Payment Pack Sent Detail
          </h2>
        </div>
        <div className="self-stretch h-px bg-neutral-100" />

        <div className="w-full grid grid-cols-2 gap-5">
          <DatePickerField
            label="Payment Pack Raised Date"
            value={formik.values.payment_pack_raised_date}
            onSelect={(d) =>
              formik.setFieldValue("payment_pack_raised_date", dateToISO(d))
            }
            show={showRaisedPicker}
            containerRef={raisedRef}
            onToggle={() => setShowRaisedPicker((p) => !p)}
          />
          <DatePickerField
            label="Payment Pack Sent Date"
            value={formik.values.payment_pack_sent_date}
            onSelect={(d) =>
              formik.setFieldValue("payment_pack_sent_date", dateToISO(d))
            }
            show={showSentPicker}
            containerRef={sentRef}
            onToggle={() => setShowSentPicker((p) => !p)}
          />
        </div>

        <div className="w-full grid grid-cols-2 gap-5">
          <TextField
            label="Invoice Number"
            name="invoice_number"
            value={formik.values.invoice_number}
            onChange={formik.handleChange}
            placeholder="Enter invoice number"
          />
          <ReadonlyField
            label="Number of Hired Days"
            value={noOfDays ? String(noOfDays) : ""}
            symbol=""
          />
        </div>

        <div className="w-full grid grid-cols-2 gap-5">
          <DatePickerField
            label="Date Hire Paid"
            value={formik.values.date_hire_paid}
            onSelect={(d) =>
              formik.setFieldValue("date_hire_paid", dateToISO(d))
            }
            show={showPaidPicker}
            containerRef={paidRef}
            onToggle={() => setShowPaidPicker((p) => !p)}
          />
          <ReadonlyField
            label="Days Expired from Payment Required"
            value={daysExpired !== null ? String(daysExpired) : ""}
            symbol=""
            suffix=" days"
          />
        </div>
      </section>

      {/* Section 2: Payment Pack Charges */}
      <section className="self-stretch p-5 rounded-lg border border-neutral-100 flex flex-col justify-start items-start gap-4">
        <h2 className="self-stretch text-neutral-900 text-xl font-weight-600 leading-5">
          Payment Pack Charges
        </h2>

        {/* 0–30 Days */}
        <div className="self-stretch flex flex-col gap-4 mt-2">
          <h3 className="text-black text-base font-weight-600">
            ABI Charges (0–30 Days)
          </h3>
          <div className="self-stretch h-px bg-neutral-100" />
          <div className="w-full grid grid-cols-2 gap-5">
            <ReadonlyField label="Daily Rate (ABI)" value={fmt(abiDailyRate)} />
            <ReadonlyField label="Extra Charges" value={fmt(abiExtraCharges)} />
          </div>
          <div className="w-full grid grid-cols-2 gap-5">
            <ReadonlyField label="Admin Charges" value={fmt(abiAdminFee)} />
            <ReadonlyField label="Total Hire Charge" value={fmt(totalHire030)} />
          </div>
          <div className="w-full grid grid-cols-2 gap-5">
            <ReadonlyField label="Penalty Due Date" value={penaltyDueDate30} symbol="" />
          </div>
        </div>

        {/* 31–60 Days (+10%) */}
        <div className="self-stretch flex flex-col gap-4 mt-4">
          <h3 className="text-black text-base font-weight-600">
            31–60 Days Charges (+10%)
          </h3>
          <div className="self-stretch h-px bg-neutral-100" />
          <div className="w-full grid grid-cols-2 gap-5">
            <ReadonlyField label="Daily Rate (ABI)" value={fmt(rate3160)} />
            <ReadonlyField label="Extra Charges" value={fmt(extra3160)} />
          </div>
          <div className="w-full grid grid-cols-2 gap-5">
            <ReadonlyField label="Admin Charges" value={fmt(admin3160)} />
            <ReadonlyField label="Total Hire Charge" value={fmt(totalHire3160)} />
          </div>
          <div className="w-full grid grid-cols-2 gap-5">
            <ReadonlyField label="Penalty Due Date" value={penaltyDueDate60} symbol="" />
          </div>
        </div>

        {/* 61+ Days (+20%) */}
        <div className="self-stretch flex flex-col gap-4 mt-4">
          <h3 className="text-black text-base font-weight-600">
            61+ Days Charges (+20%)
          </h3>
          <div className="self-stretch h-px bg-neutral-100" />
          <div className="w-full grid grid-cols-2 gap-5">
            <ReadonlyField label="Daily Rate (ABI)" value={fmt(rate61plus)} />
            <ReadonlyField label="Extra Charges" value={fmt(extra61plus)} />
          </div>
          <div className="w-full grid grid-cols-2 gap-5">
            <ReadonlyField label="Admin Charges" value={fmt(admin61plus)} />
            <ReadonlyField label="Total Hire Charge" value={fmt(totalHire61plus)} />
          </div>
          <div className="w-full grid grid-cols-2 gap-5">
            <ReadonlyField label="Penalty Due Date" value={penaltyDueDate61} symbol="" />
          </div>
        </div>

        {/* 90 Days + BHR (+35%) */}
        <div className="self-stretch flex flex-col gap-4 mt-4">
          <h3 className="text-black text-base font-weight-600">
            90 Days + BHR (35% Surge)
          </h3>
          <div className="self-stretch h-px bg-neutral-100" />
          <div className="w-full grid grid-cols-2 gap-5">
            <ReadonlyField label="Daily Rate (BHR)" value={fmt(bhrDailyRate)} />
            <ReadonlyField label="Extra Charges" value={fmt(bhrExtra)} />
          </div>
          <div className="w-full grid grid-cols-2 gap-5">
            <ReadonlyField label="Admin Charges" value={fmt(bhrAdmin)} />
            <ReadonlyField label="Total Hire Charge" value={fmt(totalHire90)} />
          </div>
          <div className="w-full grid grid-cols-2 gap-5">
            <ReadonlyField label="Penalty Due Date" value={penaltyDueDate90} symbol="" />
          </div>
        </div>
      </section>

      {/* Section 3: Billed Breakdown */}
      <section className="self-stretch p-5 rounded-lg border border-neutral-100 flex flex-col justify-start items-start gap-4 mb-10">
        <h2 className="self-stretch text-neutral-900 text-xl font-weight-600 leading-5">
          Billed Breakdown Section (ABI 30 days Rate)
        </h2>
        <div className="self-stretch h-px bg-neutral-100" />
        <div className="w-full grid grid-cols-2 gap-5">
          <ReadonlyField label="Credit Hire" value={fmt(totalHire030)} />
          <ReadonlyField label="Admin Charges" value={fmt(abiAdminFee)} />
        </div>
        <div className="w-full grid grid-cols-2 gap-5">
          <ReadonlyField label="Storage Charges" value={fmt(storageCharges)} />
          <ReadonlyField
            label="Recovery Charges"
            value={fmt(recoveryCharges)}
          />
        </div>
        <div className="w-full grid grid-cols-2 gap-5">
          <ReadonlyField
            label="Engineers Charges"
            value={fmt(engineerCharges)}
          />
          <ReadonlyField label="Plating Charges" value={fmt(platingCharges)} />
        </div>
        <div className="w-full grid grid-cols-2 gap-5">
          <ReadonlyField label="Total Outlay" value={fmt(totalOutlay)} />
        </div>
      </section>
    </div>
  );
};

// ─── reusable field components ─────────────────────────────────────────────────

interface ReadonlyFieldProps {
  label: string;
  value: string;
  symbol?: string;
  suffix?: string;
}

const ReadonlyField: React.FC<ReadonlyFieldProps> = ({ label, value, symbol = "£", suffix }) => (
  <div className="flex flex-col justify-start items-start gap-2">
    <label className="self-stretch text-neutral-700 text-sm font-weight-400 font-['Stack_Sans_Headline']">
      {label}
    </label>
    <div className="self-stretch px-5 py-4 bg-slate-50 rounded border border-neutral-200 flex justify-start items-center gap-2.5">
      {symbol !== "" && (
        <span className="text-neutral-400 text-base font-light leading-4 select-none">
          {symbol}
        </span>
      )}
      <span className="text-neutral-600 text-base font-light leading-4">
        {value ? `${value}${suffix ?? ""}` : "—"}
      </span>
    </div>
  </div>
);

interface DatePickerFieldProps {
  label: string;
  value: string;
  onSelect: (d: Date) => void;
  show: boolean;
  containerRef: React.RefObject<HTMLDivElement>;
  onToggle: () => void;
}

const DatePickerField: React.FC<DatePickerFieldProps> = ({
  label, value, onSelect, show, containerRef, onToggle,
}) => {
  const selectedDate = value ? new Date(value + "T00:00:00") : new Date();

  return (
    <div className="flex flex-col gap-2">
      <label className="text-neutral-700 text-[14px] font-weight-500">
        {label}
      </label>
      <div className="flex flex-col gap-2 relative" ref={containerRef}>
        <div
          onClick={onToggle}
          className="h-[52px] px-5 bg-white border border-gray-200 rounded flex items-center justify-between cursor-pointer"
        >
          <span className={value ? "text-gray-900" : "text-gray-400"}>
            {value || "Select Date"}
          </span>
          <img src={Vector6} alt="" />
        </div>
        {show && (
          <CustomDatePicker
            selectedDate={selectedDate}
            onDateSelect={(d) => { onSelect(d); onToggle(); }}
          />
        )}
      </div>
    </div>
  );
};

interface TextFieldProps {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
}

const TextField: React.FC<TextFieldProps> = ({ label, name, value, onChange, placeholder }) => (
  <div className="flex flex-col justify-start items-start gap-2">
    <label className="self-stretch text-neutral-700 text-sm font-weight-400 font-['Stack_Sans_Headline']">
      {label}
    </label>
    <div className="self-stretch px-5 py-4 bg-white rounded border border-neutral-200 flex justify-start items-center gap-2.5 focus-within:border-blue-500 transition-colors">
      <input
        type="text"
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full bg-transparent outline-none text-black text-base font-light leading-4 placeholder:text-neutral-300"
      />
    </div>
  </div>
);

export default ABIBHRCharges;
