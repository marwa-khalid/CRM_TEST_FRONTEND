import React, { useEffect, useMemo, useRef, useState } from "react";
import { useCaseReference } from "../../../hooks/useCaseReference";
import { useFormik } from "formik";
import { toast } from "react-toastify";
import {
  getHirePaymentDetails,
  saveHirePaymentDetails,
} from "../../../services/HirePaymentDetails/HirePaymentDetails";
import { getABIBHRCharges } from "../../../services/ABIBHRCharges/ABIBHRCharges";
import { getComparisonSettlement, sendComparisonDifferenceEmail } from "../../../services/ComparisonSettlement/ComparisonSettlement";
import { getHireRecords } from "../../../services/HireDetail/HireDetails";
import { getStorageRecoveryProvider } from "../../../services/StorageRecovery/StorageRecovery";
import { gettingEnginerDetails } from "../../../services/EngineeringDetails/engineeringDetails";
import { getPlatingTotal } from "../../../services/PlatingCharges/PlatingCharges";
import { getRepairData } from "../../../services/RepairAndCost/RepairAndCost";
import { CustomDatePicker } from "../Components/DatePicker";
import Vector6 from "../../../assets/AutoClaim_icon/Vector-6.svg";
import { SpinnerLoader } from "../../../components/common/SpinnerLoader";

// ─── helpers ────────────────────────────────────────────────────────────────

const toF = (v: any): number => parseFloat(String(v ?? 0)) || 0;

// Round to 2 decimals so totals never carry sub-penny drift (e.g. 5070.076 -> 5070.08)
const round2 = (n: number): number => Math.round((n + Number.EPSILON) * 100) / 100;

function fmt(n: number): string {
  return n.toFixed(2);
}

function dateToISO(d: Date): string {
  return d.toISOString().slice(0, 10);
}

// ─── sub-components ─────────────────────────────────────────────────────────

interface CurrencyFieldProps {
  label: string;
  name: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  readOnly?: boolean;
}

const CurrencyField: React.FC<CurrencyFieldProps> = ({
  label, name, value, onChange, readOnly = false,
}) => (
  <div className="flex flex-col gap-2 w-full">
    <label className="text-neutral-700 text-sm font-weight-500 font-['Stack_Sans_Headline']">
      {label}
    </label>
    <div
      className={`h-[52px] px-5 rounded border flex items-center gap-2 ${
        readOnly
          ? "bg-slate-50 border-neutral-200"
          : "bg-white border-neutral-200 focus-within:border-blue-500"
      }`}
    >
      <span className="text-neutral-500 text-base font-light leading-4 select-none">£</span>
      <input
        type="number"
        step="0.01"
        name={name}
        value={value}
        onChange={onChange}
        readOnly={readOnly}
        placeholder="0.00"
        className="flex-1 bg-transparent outline-none text-base text-neutral-700 font-light leading-4 placeholder:text-neutral-300"
      />
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
    <div className="flex flex-col gap-2 w-full">
      <label className="text-neutral-700 text-sm font-weight-500 font-['Stack_Sans_Headline']">
        {label}
      </label>
      <div className="relative flex flex-col" ref={containerRef}>
        <div
          onClick={onToggle}
          className="h-[52px] px-5 bg-white border border-neutral-200 rounded flex items-center justify-between cursor-pointer"
        >
          <span className={value ? "text-neutral-700 text-base font-light" : "text-neutral-300 text-base font-light"}>
            {value || "Date"}
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

// ─── main component ──────────────────────────────────────────────────────────

const HirePaymentDetailsForm = ({ paymentFormRef, claimId }: any) => {
  const claimRef = useCaseReference(claimId); // per-claim ref (was localStorage)

  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [showReceivedPicker, setShowReceivedPicker] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notifying, setNotifying] = useState(false);
  const receivedRef = useRef<HTMLDivElement>(null);

  // System (billed) values loaded from multiple source screens
  const [totalExclVAT, setTotalExclVAT] = useState(0);

  const formik = useFormik({
    initialValues: {
      payment_amount: "" as string | number,
      received_date: "",
      payment_reason: "",
      payments_received_total: "" as string | number,
      write_off_amount: "" as string | number,
      payment_outstanding_incl_vat: "" as string | number,
      payment_outstanding_excl_vat: "" as string | number,
    },
    onSubmit: async (values) => {
      if (!claimId) return;
      try {
        await saveHirePaymentDetails({
          claim_id: Number(claimId),
          payment_amount: values.payment_amount !== "" ? Number(values.payment_amount) : null,
          received_date: values.received_date || null,
          payment_reason: values.payment_reason || null,
          payments_received_total: values.payments_received_total !== "" ? Number(values.payments_received_total) : null,
          write_off_amount: values.write_off_amount !== "" ? Number(values.write_off_amount) : null,
          payment_outstanding_incl_vat: values.payment_outstanding_incl_vat !== "" ? Number(values.payment_outstanding_incl_vat) : null,
          payment_outstanding_excl_vat: values.payment_outstanding_excl_vat !== "" ? Number(values.payment_outstanding_excl_vat) : null,
        });
        toast.success("Hire payment details saved");
      } catch {
        toast.error("Failed to save");
        throw new Error("save failed");
      }
    },
  });

  useEffect(() => {
    if (paymentFormRef) paymentFormRef.current = formik;
  }, [formik]);

  // Close date picker on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (receivedRef.current && !receivedRef.current.contains(e.target as Node))
        setShowReceivedPicker(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Load invoice number from ABI&BHR screen
  useEffect(() => {
    if (!claimId) return;
    getABIBHRCharges(claimId)
      .then(({ data }: any) => {
        setInvoiceNumber(data?.invoice_number ?? "");
      })
      .catch(() => {});
  }, [claimId]);

  // Load system (billed) values — same 5 service calls as comparison form
  useEffect(() => {
    if (!claimId) return;

    let hireCosts = 0;
    let adminFee = 0;
    let cdw = 0;
    let cdFee = 0;
    let storage = 0;
    let recovery = 0;
    let repair = 0;
    let plating = 0;
    let engineer = 0;

    const recalc = () => {
      // Round each line item to 2dp before summing so the total matches the
      // generated pack (which rounds per cell) to the penny.
      const excl =
        round2(hireCosts) + round2(adminFee) + round2(cdw) + round2(cdFee) +
        round2(storage) + round2(recovery) + round2(repair) + round2(plating) + round2(engineer);
      setTotalExclVAT(round2(excl));
    };

    getHireRecords(claimId)
      .then(({ data }: any) => {
        const records: any[] = Array.isArray(data) ? data : [];
        const first = records[0];
        if (!first) return;
        // Hire = Σ(each vehicle's own rate × its own days) — matches screens 2 & 3.
        // (Using total days × the first vehicle's rate over-stated multi-vehicle hire.)
        hireCosts = records.reduce((sum: number, r: any) => {
          const d = toF(r.final_total_no_of_hire_days ?? r.no_of_days_hire_so_far);
          return sum + d * toF(r.abi_hire_charge_per_day);
        }, 0);
        adminFee = toF(first.abi_administration_fee);
        // CDW and C&D fee are BHR-only — not part of the ABI actual cost (= 0 here,
        // same as the Comparison screen).
        cdw = 0;
        cdFee = 0;
        recalc();
      })
      .catch(() => {});

    getStorageRecoveryProvider(claimId)
      .then(({ data }: any) => {
        storage = (data?.storages ?? []).reduce((s: number, r: any) => s + toF(r.total_storage_charges), 0);
        recovery = (data?.recoveries ?? []).reduce((s: number, r: any) => s + toF(r.recovery_charges), 0);
        recalc();
      })
      .catch(() => {});

    gettingEnginerDetails(claimId)
      .then((data: any) => {
        engineer = toF(data?.engineer_fee ?? data?.actual_fee);
        recalc();
      })
      .catch(() => {});

    getPlatingTotal(claimId)
      .then(({ data }: any) => {
        plating = toF(data?.total_plating_cost);  // total across all vehicles
        recalc();
      })
      .catch(() => {});

    getRepairData(claimId)
      .then((data: any) => {
        // Use the EXCL-VAT repair (sub_total), same as the Comparison screen —
        // VAT is applied once to the whole total below, so total_inc_vat here
        // would double-count VAT on the repair.
        repair = toF(data?.sub_total);
        recalc();
      })
      .catch(() => {});
  }, [claimId]);

  // Load saved form data; if no saved data, pre-populate payment_amount from agreed settlement
  useEffect(() => {
    if (!claimId) { setLoading(false); return; }
    getHirePaymentDetails(claimId)
      .then(({ data }: any) => {
        const s = data?.saved;
        if (s) {
          formik.setValues({
            payment_amount: s.payment_amount ?? "",
            received_date: s.received_date ?? "",
            payment_reason: s.payment_reason ?? "",
            payments_received_total: s.payments_received_total ?? "",
            write_off_amount: s.write_off_amount ?? "",
            payment_outstanding_incl_vat: s.payment_outstanding_incl_vat ?? "",
            payment_outstanding_excl_vat: s.payment_outstanding_excl_vat ?? "",
          });
        } else {
          // Pre-populate payment_amount from agreed incl. VAT
          getComparisonSettlement(claimId)
            .then(({ data: cData }: any) => {
              const cs = cData?.saved;
              if (!cs) return;
              const rateMult = 1 + toF(cs.abi_rate_band) / 100;
              const hireDays = cs.agreed_hire_days !== null ? toF(cs.agreed_hire_days) : 0;
              const hireRate = cs.agreed_hire_rate !== null ? toF(cs.agreed_hire_rate) : 0;
              const agreedHire = hireDays * hireRate * rateMult;
              const agreedAdditional = toF(cs.agreed_additional_fees) * rateMult;
              const agreedPenalties = toF(cs.agreed_penalties);
              const agreedExcl = agreedHire + agreedAdditional + agreedPenalties;
              const agreedIncl = agreedExcl * 1.2;
              formik.setFieldValue("payment_amount", fmt(agreedIncl));
            })
            .catch(() => {});
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [claimId]);

  // ─── computed derived values ──────────────────────────────────────────────

  const totalInclVAT = useMemo(() => round2(totalExclVAT * 1.2), [totalExclVAT]);

  const paymentAmt = toF(formik.values.payment_amount);

  // Auto-compute section 3 values unless user has overridden them
  const paymentsReceivedAuto = useMemo(() => paymentAmt, [paymentAmt]);
  const outstandingInclAuto = useMemo(
    () => round2(Math.max(0, totalInclVAT - paymentAmt)),
    [totalInclVAT, paymentAmt]
  );
  const outstandingExclAuto = useMemo(
    () => round2(Math.max(0, totalExclVAT - paymentAmt)),
    [totalExclVAT, paymentAmt]
  );

  // Payments Received Total mirrors the Payment Amount (they display the same amount)
  useEffect(() => {
    formik.setFieldValue("payments_received_total", formik.values.payment_amount);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formik.values.payment_amount]);

  const divider = <div className="self-stretch h-px bg-neutral-100" />;

  // Notify the manager that the amount received is less than the actual payable amount
  // Write off the outstanding (excl. VAT) amount — records it for the email + save
  const handleWriteOff = () => {
    const outstandingExcl =
      formik.values.payment_outstanding_excl_vat !== ""
        ? toF(formik.values.payment_outstanding_excl_vat)
        : outstandingExclAuto;
    formik.setFieldValue("write_off_amount", fmt(round2(outstandingExcl)));
    toast.success("Outstanding (Excl. VAT) written off");
  };

  const handleNotifyManager = async () => {
    if (!claimId || notifying) return;
    const actual = round2(totalInclVAT);
    const received = round2(
      formik.values.payments_received_total !== ""
        ? toF(formik.values.payments_received_total)
        : paymentsReceivedAuto,
    );
    const outstanding = round2(
      formik.values.payment_outstanding_incl_vat !== ""
        ? toF(formik.values.payment_outstanding_incl_vat)
        : outstandingInclAuto,
    );
    const writeOff = round2(
      formik.values.write_off_amount !== "" ? toF(formik.values.write_off_amount) : 0,
    );

    let user: any = {};
    try {
      user = JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      user = {};
    }

    setNotifying(true);
    try {
      await sendComparisonDifferenceEmail({
        claim_id: Number(claimId),
        recipient_email: user.email,
        recipient_name: user.first_name,
        actual_amount: actual,
        amount_received: received,
        outstanding_difference: outstanding,
        write_off_amount: writeOff,
        payment_reason: formik.values.payment_reason || "Payment reason not provided!",
      });
      toast.success("Manager Notified");
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || "Failed to notify manager");
    } finally {
      setNotifying(false);
    }
  };

  return (
    <div className="w-full mt-3 flex flex-col gap-6 font-['Stack_Sans_Headline']">
      {loading && <SpinnerLoader />}
      <h1 className="text-black text-2xl font-weight-600 leading-6">
        Hire Payment Details &amp; Recovery Management
      </h1>

      {/* ── Section 1: Billed Costs ── */}
      <section className="self-stretch p-5 rounded-lg border border-neutral-100 flex flex-col gap-4">
        <div className="self-stretch flex items-start justify-between">
          <h2 className="text-black text-xl font-weight-600 leading-5">
            Billed Costs:
          </h2>
          <div className="text-sm leading-snug">
            <span className="text-neutral-700 font-weight-600 font-['Stack_Sans_Headline']">
              {claimRef}
            </span>
            {invoiceNumber && (
              <span className="ms-10 text-neutral-700 font-weight-400 font-['Stack_Sans_Headline']">
                {" "}
                Invoice# {invoiceNumber}
              </span>
            )}
          </div>
        </div>
        {divider}
        <div className="flex gap-5">
          {/* Total Excl. VAT card */}
          <div className="w-96 p-4 rounded-lg border border-blue-200 flex flex-col gap-1">
            <div className="text-neutral-900 text-xl font-weight-600 leading-5">
              {fmt(totalExclVAT)}
            </div>
            <div className="text-neutral-700 text-sm font-weight-600 font-['Stack_Sans_Headline']">
              Total Actual Cost (Excl. VAT)
            </div>
          </div>
          {/* Total Incl. VAT card */}
          <div className="w-96 p-4 rounded-lg border border-blue-200 flex flex-col gap-1">
            <div className="text-neutral-900 text-xl font-weight-600 leading-5">
              {fmt(totalInclVAT)}
            </div>
            <div className="text-neutral-700 text-sm font-weight-600 font-['Stack_Sans_Headline']">
              Total Actual Cost (Incl. VAT)
            </div>
          </div>
        </div>
      </section>

      {/* ── Section 2: Agreed Settlement Breakdown ── */}
      <section className="self-stretch p-5 rounded-lg border border-neutral-100 flex flex-col gap-4">
        <h2 className="text-black text-xl font-weight-600 leading-5">
          Agreed Settlement Breakdown
        </h2>
        {divider}
        <div className="grid grid-cols-2 gap-5">
          <CurrencyField
            label="Payment Amount"
            name="payment_amount"
            value={formik.values.payment_amount}
            onChange={formik.handleChange}
          />
          <DatePickerField
            label="Received Date"
            value={formik.values.received_date}
            onSelect={(d) =>
              formik.setFieldValue("received_date", dateToISO(d))
            }
            show={showReceivedPicker}
            containerRef={receivedRef}
            onToggle={() => setShowReceivedPicker((p) => !p)}
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-neutral-700 text-sm font-weight-500 font-['Stack_Sans_Headline']">
            Payment Reason / Misc Details
          </label>
          <textarea
            name="payment_reason"
            value={formik.values.payment_reason}
            onChange={formik.handleChange}
            placeholder="Enter Reason"
            rows={4}
            className="w-full h-24 px-5 py-4 bg-white border border-neutral-200 rounded text-base text-neutral-700 font-light resize-none outline-none focus:border-blue-500 placeholder:text-neutral-300"
          />
        </div>
      </section>

      {/* ── Section 3: Calculations & Adjustments ── */}
      <section className="self-stretch p-5 rounded-lg border border-neutral-100 flex flex-col gap-4 mb-10">
        <div className="flex justify-between">
          {" "}
          <h2 className="text-black text-xl font-weight-600 leading-5">
            Calculations &amp; Adjustments
          </h2>
          <button
            onClick={handleNotifyManager}
            disabled={notifying}
            type="button"
            className="h-8 px-3 py-2 text-blue-500 bg-blue-100 hover:bg-blue-100 rounded flex items-center gap-2.5 transition-colors group disabled:opacity-60"
          >
            {notifying ? "Notifying..." : "Notify Manager"}
          </button>
        </div>
        {divider}
        <div className="grid grid-cols-2 gap-5">
          <CurrencyField
            label="Payments Received Total"
            name="payments_received_total"
            value={formik.values.payment_amount}
            onChange={formik.handleChange}
            readOnly
          />
          <CurrencyField
            label="Payment Outstanding (Incl. VAT)"
            name="payment_outstanding_incl_vat"
            value={
              formik.values.payment_outstanding_incl_vat !== ""
                ? formik.values.payment_outstanding_incl_vat
                : fmt(outstandingInclAuto)
            }
            onChange={formik.handleChange}
          />
        </div>
        <div className="grid grid-cols-2 gap-5">
          <CurrencyField
            label="Payment Outstanding (Excl. VAT)"
            name="payment_outstanding_excl_vat"
            value={
              formik.values.payment_outstanding_excl_vat !== ""
                ? formik.values.payment_outstanding_excl_vat
                : fmt(outstandingExclAuto)
            }
            onChange={formik.handleChange}
          />
          {formik.values.write_off_amount !== "" && (
           
              <CurrencyField
                label="Write Off (Exc. VAT)"
                name="write_off_amount"
                value={formik.values.write_off_amount}
                onChange={formik.handleChange}
                readOnly
              />
          )}
        </div>
        <div className="flex flex-col gap-4">
          <div>
            <button
              type="button"
              onClick={handleWriteOff}
              className="h-9 px-4 py-2 text-blue-500 bg-blue-100 hover:bg-blue-200 rounded text-sm font-weight-500 transition-colors"
            >
              Write Off
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HirePaymentDetailsForm;
