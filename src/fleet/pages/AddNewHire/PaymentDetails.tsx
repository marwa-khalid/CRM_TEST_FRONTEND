import React, { useState, useMemo } from "react";
import { toast } from "react-toastify";
import { FleetTextInput, FleetMoneyInput, FleetSelect, FleetDateField, formatMoney } from "../../components/fields";
import { useHire } from "./HireContext";
import type { Option } from "../../types/hire";

const ADDITIONAL_CHARGES_OPTIONS: Option[] = [
  { label: "None", value: "none" },
  { label: "Cleaning Fee", value: "cleaning" },
  { label: "Late Return", value: "late_return" },
  { label: "Fuel", value: "fuel" },
  { label: "Admin Fee", value: "admin" },
  { label: "Other", value: "other" },
];

const STATUS_OPTIONS: Option[] = [
  { label: "Paid", value: "paid" },
  { label: "Partial", value: "partial" },
  { label: "Pending", value: "pending" },
];

interface PaymentForm {
  hireStartDate: string; hireEndDate: string; vehicleCostPerDay: string;
  numberOfWeeklyPayments: string; paymentDay: string; securityDeposit: string;
  weeklyHirePayment: string; totalPlannedHireCost: string; initialAmountDue: string;
  damageCharges: string; additionalCharges: string;
}
const EMPTY: PaymentForm = {
  hireStartDate: "", hireEndDate: "", vehicleCostPerDay: "", numberOfWeeklyPayments: "",
  paymentDay: "", securityDeposit: "", weeklyHirePayment: "", totalPlannedHireCost: "",
  initialAmountDue: "", damageCharges: "", additionalCharges: "",
};

const TO_BACKEND: Record<keyof PaymentForm, string> = {
  hireStartDate: "payment_hire_start_date", hireEndDate: "payment_hire_end_date",
  vehicleCostPerDay: "vehicle_cost_per_day", numberOfWeeklyPayments: "number_of_weekly_payments",
  paymentDay: "payment_day", securityDeposit: "security_deposit", weeklyHirePayment: "weekly_hire_payment",
  totalPlannedHireCost: "total_planned_hire_cost", initialAmountDue: "initial_amount_due",
  damageCharges: "payment_damage_charges", additionalCharges: "additional_charges",
};

interface PaymentRow {
  week: number; dueAmount: string; status: string; paidAmount: string; paymentDate: string; notes: string;
}

const SECTION = "self-stretch p-5 rounded-lg outline outline-1 -outline-offset-1 outline-neutral-100 flex flex-col gap-4";
const H3 = "text-black text-xl font-semibold leading-5";
const money = (n: number) => `£${n.toFixed(2)}`;

const RecordPaymentModal: React.FC<{
  row: PaymentRow;
  onCancel: () => void;
  onSave: (r: PaymentRow) => void;
}> = ({ row, onCancel, onSave }) => {
  const [r, setR] = useState<PaymentRow>({ ...row, paidAmount: row.paidAmount || row.dueAmount });
  return (
    <div className="fixed inset-0 z-[110] bg-black/40 flex items-center justify-center p-4">
      <div className="w-[640px] max-w-full p-6 bg-white rounded-lg flex flex-col gap-4 font-sans-headline">
        <div className="text-black text-xl font-semibold leading-5">Record Payment</div>
        <div className="grid grid-cols-2 gap-5">
          <FleetTextInput label="Week" value={String(r.week)} onChange={() => {}} disabled />
          <FleetTextInput label="Due Amount" value={`£${r.dueAmount}`} onChange={() => {}} disabled />
        </div>
        <div className="grid grid-cols-2 gap-5">
          <FleetMoneyInput label="Paid Amount" value={r.paidAmount} onChange={(v) => setR((s) => ({ ...s, paidAmount: v }))} />
          <FleetDateField label="Payment Date" value={r.paymentDate} onChange={(v) => setR((s) => ({ ...s, paymentDate: v }))} />
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-neutral-700 text-sm font-medium">Notes</span>
          <textarea
            value={r.notes}
            onChange={(e) => setR((s) => ({ ...s, notes: e.target.value }))}
            placeholder="Value"
            rows={3}
            className="h-24 px-5 py-4 bg-white rounded-sm outline outline-1 -outline-offset-1 outline-neutral-200 text-base text-neutral-900 placeholder:text-neutral-300 focus:outline-neutral-900 resize-none"
          />
        </div>
        <div className="w-72">
          <FleetSelect label="Status" value={r.status} options={STATUS_OPTIONS} onChange={(v) => setR((s) => ({ ...s, status: v }))} />
        </div>
        <div className="h-px bg-neutral-100" />
        <div className="flex justify-end items-center gap-4">
          <button type="button" onClick={onCancel} className="px-6 py-4 rounded-sm bg-white text-neutral-900 text-base font-medium outline outline-1 -outline-offset-1 outline-neutral-900 hover:bg-neutral-50">Cancel</button>
          <button type="button" onClick={() => onSave({ ...r, paidAmount: formatMoney(r.paidAmount) })} className="px-6 py-4 rounded-sm bg-neutral-900 text-white text-base font-medium hover:bg-black">Save</button>
        </div>
      </div>
    </div>
  );
};

const PaymentDetails: React.FC = () => {
  const [form, setForm] = useState<PaymentForm>(EMPTY);
  const [rows, setRows] = useState<PaymentRow[]>([]);
  const [recordIdx, setRecordIdx] = useState<number | null>(null);
  const { save } = useHire();

  const set = (key: keyof PaymentForm, value: string) => setForm((f) => ({ ...f, [key]: value }));
  const persist = (col: string, value: string) => save({ [col]: value || null });
  const saveField = (key: keyof PaymentForm) => persist(TO_BACKEND[key], form[key]);

  const weeks = Math.max(0, parseInt(form.numberOfWeeklyPayments || "0", 10) || 0);
  const weekly = parseFloat(form.weeklyHirePayment || "0") || 0;
  const deposit = parseFloat(form.securityDeposit || "0") || 0;
  const totalPlanned = weeks * weekly;
  const initialDue = deposit + weekly;

  // Regenerate the weekly schedule when weeks / weekly amount change (keeps
  // already-recorded rows' data where the week still exists).
  React.useEffect(() => {
    setRows((prev) =>
      Array.from({ length: weeks }, (_, i) => {
        const existing = prev[i];
        return existing
          ? { ...existing, dueAmount: weekly ? weekly.toFixed(2) : existing.dueAmount }
          : { week: i + 1, dueAmount: weekly ? weekly.toFixed(2) : "", status: "pending", paidAmount: "", paymentDate: "", notes: "" };
      }),
    );
  }, [weeks, weekly]);

  const totalReceived = useMemo(() => rows.reduce((sum, r) => sum + (parseFloat(r.paidAmount) || 0), 0), [rows]);
  const finalChargesDue = (parseFloat(form.damageCharges) || 0);
  const depositAdjustment = deposit;
  const finalOutcome = finalChargesDue > 0 ? "Damage" : "No Damage";

  const statusLabel = (v: string) => STATUS_OPTIONS.find((o) => o.value === v)?.label ?? "Pending";

  return (
    <div className="w-full max-w-[788px] flex flex-col gap-6 font-sans-headline">
      <h2 className="text-black text-2xl font-semibold leading-6">Payment Details - Weekly Hire Payments &amp; Off-Hire Settlement</h2>

      {/* Payment Details */}
      <section className={SECTION}>
        <h3 className={H3}>Payment Details</h3>
        <div className="h-px bg-neutral-100" />
        <div className="grid grid-cols-2 gap-5">
          <FleetDateField label="Hire Start Date" value={form.hireStartDate} onChange={(v) => { set("hireStartDate", v); persist(TO_BACKEND.hireStartDate, v); }} />
          <FleetDateField label="Hire End Date" value={form.hireEndDate} onChange={(v) => { set("hireEndDate", v); persist(TO_BACKEND.hireEndDate, v); }} />
        </div>
        <div className="grid grid-cols-2 gap-5">
          <FleetMoneyInput label="Vehicle Cost Per Day" value={form.vehicleCostPerDay} onChange={(v) => set("vehicleCostPerDay", v)} onBlur={() => saveField("vehicleCostPerDay")} />
          <div />
        </div>
        <div className="grid grid-cols-2 gap-5">
          <FleetTextInput label="Number of Weekly Payments" placeholder="Enter" inputMode="numeric" value={form.numberOfWeeklyPayments} onChange={(v) => set("numberOfWeeklyPayments", v.replace(/[^0-9]/g, ""))} onBlur={() => saveField("numberOfWeeklyPayments")} />
          <FleetDateField label="Payment Day" value={form.paymentDay} onChange={(v) => { set("paymentDay", v); persist(TO_BACKEND.paymentDay, v); }} />
        </div>
        <div className="grid grid-cols-2 gap-5">
          <FleetMoneyInput label="Security Deposit" value={form.securityDeposit} onChange={(v) => set("securityDeposit", v)} onBlur={() => saveField("securityDeposit")} />
          <FleetMoneyInput label="Weekly Hire Payment" value={form.weeklyHirePayment} onChange={(v) => set("weeklyHirePayment", v)} onBlur={() => saveField("weeklyHirePayment")} />
        </div>
        <div className="grid grid-cols-2 gap-5">
          <FleetMoneyInput label="Total Planned Hire Cost" value={form.totalPlannedHireCost || (totalPlanned ? totalPlanned.toFixed(2) : "")} onChange={(v) => set("totalPlannedHireCost", v)} onBlur={() => saveField("totalPlannedHireCost")} />
          <FleetMoneyInput label="Initial Amount Due" value={form.initialAmountDue || (initialDue ? initialDue.toFixed(2) : "")} onChange={(v) => set("initialAmountDue", v)} onBlur={() => saveField("initialAmountDue")} />
        </div>
      </section>

      {/* Weekly Payment Schedule */}
      <section className={SECTION}>
        <h3 className={H3}>Weekly Payment Schedule</h3>
        <div className="h-px bg-neutral-100" />
        <div className="rounded-lg outline outline-1 -outline-offset-1 outline-neutral-100 overflow-hidden">
          <div className="grid grid-cols-6 gap-2 px-4 h-12 items-center text-neutral-900 text-sm font-semibold border-b border-neutral-100">
            <span>WEEK</span><span>DUE AMOUNT</span><span>STATUS</span><span>PAID AMOUNT</span><span>PAYMENT DATE</span><span>ACTION</span>
          </div>
          {rows.length === 0 ? (
            <div className="px-4 h-12 flex items-center text-neutral-400 text-sm">Enter the number of weekly payments to generate the schedule.</div>
          ) : (
            rows.map((r, i) => (
              <div key={i} className="grid grid-cols-6 gap-2 px-4 py-3 items-center text-neutral-700 text-sm border-b border-neutral-100 last:border-b-0">
                <span>{r.week}</span>
                <span>{r.dueAmount ? `£${r.dueAmount}` : "-"}</span>
                <span>{statusLabel(r.status)}</span>
                <span>{r.paidAmount ? `£${r.paidAmount}` : "-"}</span>
                <span>{r.paymentDate || "-"}</span>
                <span>
                  <button type="button" onClick={() => setRecordIdx(i)} className="h-8 px-3 py-2 bg-neutral-900 rounded-sm text-white text-sm hover:bg-black">Record Payment</button>
                </span>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Charges */}
      <section className={SECTION}>
        <h3 className={H3}>Charges</h3>
        <div className="h-px bg-neutral-100" />
        <div className="grid grid-cols-2 gap-5">
          <FleetMoneyInput label="Vehicle Damage Charges" value={form.damageCharges} onChange={(v) => set("damageCharges", v)} onBlur={() => saveField("damageCharges")} />
          <FleetSelect label="Additional Charges" value={form.additionalCharges} options={ADDITIONAL_CHARGES_OPTIONS} onChange={(v) => { set("additionalCharges", v); persist(TO_BACKEND.additionalCharges, v); }} />
        </div>
      </section>

      {/* Final Payment Summary */}
      <section className={SECTION}>
        <h3 className={H3}>Final Payment Summary</h3>
        <div className="h-px bg-neutral-100" />
        {[
          ["Total Weekly Payments Received:", money(totalReceived)],
          ["Final Charges Due:", money(finalChargesDue)],
          ["Deposit Adjustment:", money(depositAdjustment)],
          ["Final Outcome:", finalOutcome],
        ].map(([label, val]) => (
          <div key={label} className="text-sm">
            <span className="text-neutral-700">{label} </span>
            <span className="text-neutral-900 font-medium">{val}</span>
          </div>
        ))}
      </section>

      {recordIdx !== null && rows[recordIdx] && (
        <RecordPaymentModal
          row={rows[recordIdx]}
          onCancel={() => setRecordIdx(null)}
          onSave={(updated) => {
            setRows((rs) => rs.map((r, i) => (i === recordIdx ? updated : r)));
            setRecordIdx(null);
            toast.success("Payment recorded.");
          }}
        />
      )}
    </div>
  );
};

export default PaymentDetails;
