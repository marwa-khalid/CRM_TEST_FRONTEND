import React, { useState, useEffect, useMemo, useRef } from "react";
import { toast } from "react-toastify";
import { FleetTextInput, FleetMoneyInput, FleetSelect, FleetDateField, FleetInlineLoader, currentTime24, formatMoney, formatTime24 } from "../../components/fields";
import FleetSpinnerLoader from "../../components/FleetSpinnerLoader";
import FleetWhatsAppModal from "../../components/FleetWhatsAppModal";
import FleetConfirmModal from "../../components/FleetConfirmModal";
import { useHire } from "./HireContext";
import {
  listPayments,
  syncSchedule,
  recordPaymentTransaction,
  updatePaymentTransaction,
  deletePaymentTransaction,
  type PaymentTransaction,
  extractPaymentReceipt,
  type PaymentRow,
} from "../../services/paymentService";
import RemoveIcon from "../../assets/icons/Remove.svg";
import PencilIcon from "../../assets/icons/PencilIcon.svg";
import UploadFileIcon from "../../assets/icons/UploadFile.svg";
import { sendFleetWhatsApp } from "../../services/whatsappService";
import { deleteVehicle, listVehicles, updateVehicle } from "../../services/vehicleService";
import { uploadHireDocument } from "../../services/hireService";
import type { Option } from "../../types/hire";

const STATUS_OPTIONS: Option[] = [
  { label: "Pending", value: "pending" },
  { label: "Partially Paid", value: "partial" },
  { label: "Received", value: "received" },
];
const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const PAYMENT_DAY_OPTIONS: Option[] = WEEKDAYS.map((day) => ({ label: day, value: day }));
const TODAY_PAYMENT_DAY = new Date().toLocaleDateString("en-GB", { weekday: "long" });
const DEFAULT_PAYMENT_DAY = PAYMENT_DAY_OPTIONS.find((option) => option.value === TODAY_PAYMENT_DAY)?.value || PAYMENT_DAY_OPTIONS[0]?.value || "";

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

const SECTION = "self-stretch p-5 rounded-lg outline outline-1 -outline-offset-1 outline-neutral-100 flex flex-col gap-4";
const H3 = "text-black text-xl font-semibold leading-5";
const PAYMENT_SCHEDULE_GRID = "grid-cols-[44px_1fr_1fr_1fr_1fr_0.9fr_136px]";
const money = (n: number) => `£${n.toFixed(2)}`;
const ERROR = "text-red-500 text-xs";
const PAYMENT_MODE_OPTIONS: Option[] = [
  { label: "Cash", value: "cash" },
  { label: "Bank Transfer", value: "bank_transfer" },
  { label: "Adjusted in Security Deposit", value: "security_deposit" },
];
const paymentModeLabel = (value?: string | null): string => (
  PAYMENT_MODE_OPTIONS.find((option) => option.value === value)?.label || "Cash"
);

type HireVehicleRecord = Record<string, unknown>;

const vehicleSummaryKey = (vehicle: HireVehicleRecord, index: number): string =>
  vehicle.id ? String(vehicle.id) : `vehicle-${index}`;

const rowsTotalDue = (paymentRows: PaymentRow[] = []): number =>
  paymentRows.reduce((sum, row) => sum + num(row.due_amount), 0);

const rowsTotalReceived = (paymentRows: PaymentRow[] = []): number =>
  paymentRows.reduce((sum, row) => sum + num(row.paid_amount), 0);

const rowsDepositAdjusted = (paymentRows: PaymentRow[] = []): number =>
  paymentRows.reduce(
    (sum, row) => sum + (row.transactions ?? []).reduce(
      (transactionSum, transaction) =>
        transaction.payment_mode === "security_deposit"
          ? transactionSum + num(transaction.amount)
          : transactionSum,
      0,
    ),
    0,
  );

const num = (value: unknown): number => {
  const parsed = parseFloat(String(value ?? "").replace(/[^0-9.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
};

const readonlyMoney = (value: number): string => value.toFixed(2);
const remainingDue = (row: PaymentRow): number => Math.max(0, num(row.due_amount) - num(row.paid_amount));
const calculatedStatus = (row: PaymentRow): string => {
  const due = num(row.due_amount);
  const paid = num(row.paid_amount);
  if (paid <= 0) return "pending";
  if (due > 0 && paid < due) return "partial";
  return "received";
};
// Show per-payment sub-records when a week is paid in parts — i.e. 2+ payments, OR a
// single payment that doesn't cover the full due (a part-payment you can still edit/
// delete). A single payment that clears the whole week needs no breakdown; it's edited
// via the summary row's "Edit Payment" button instead.
const shouldShowPaymentBreakdown = (row: PaymentRow): boolean => {
  const txns = row.transactions ?? [];
  if (txns.length === 0) return false;
  if (txns.length === 1 && num(txns[0].amount) >= num(row.due_amount)) return false;
  return true;
};
const statusLabel = (value: string) => {
  if (value === "paid") return "Received";
  return STATUS_OPTIONS.find((o) => o.value === value)?.label ?? "Pending";
};

const formatPaymentDay = (value: string): string => {
  if (!value) return "-";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-GB", { weekday: "long" });
};

const formatTablePaymentDateParts = (dateValue?: string, timeValue?: string): { date: string; time: string } => {
  if (!dateValue) return { date: "-", time: "" };
  const date = new Date(`${dateValue}T00:00:00`);
  const formattedDate = Number.isNaN(date.getTime())
    ? dateValue
    : date.toLocaleDateString("en-GB").replace(/\//g, "-");
  return { date: formattedDate, time: formatTime24(timeValue) };
};

const isBlank = (value: unknown): boolean => value === undefined || value === null || String(value).trim() === "";
const DashCell: React.FC<{ className?: string }> = ({ className = "" }) => (
  <span className={`block text-start text-neutral-400 ${className}`}>-</span>
);
const MoneyCell: React.FC<{ value: unknown; className?: string }> = ({ value, className = "" }) => (
  isBlank(value)
    ? <DashCell className={className} />
    : <span className={className}>£{num(value).toFixed(2)}</span>
);

const PaymentDateCell: React.FC<{ dateValue?: string | null; timeValue?: string | null; className?: string }> = ({
  dateValue,
  timeValue,
  className = "",
}) => {
  const { date, time } = formatTablePaymentDateParts(dateValue || "", timeValue || "");
  if (date === "-") return <DashCell className={className} />;
  return (
    <span className={`flex flex-col leading-5 ${className}`}>
      <span>{date}</span>
      {time && <span className="text-neutral-400 text-xs">{time}</span>}
    </span>
  );
};

// Local YYYY-MM-DD (avoids the BST off-by-one that toISOString() causes).
const todayLocalISO = (): string => new Date().toLocaleDateString("sv-SE");
// The OCR returns dd-mm-yyyy; the date field wants yyyy-mm-dd.
const ddmmyyyyToIso = (value: string): string => {
  const m = value.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
  return m ? `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}` : value;
};

const paymentReminderPhrase = () =>
  "PAYDUE - Skyline Car Hire (UK) Ltd have tried to contact you today as your weekly payment for the hire vehicle is due.";

const paymentReminderMessage = () =>
  "Skyline Car Hire (UK) Ltd have tried to contact you today as your weekly payment for the hire vehicle is due. Please note that you should make payment today in order to avoid any penalties being applied in line with our agreement at £35.00 for any payments made late followed by £2.00 per day thereafter until the payment amount is settled.";

const priceRisePhrase = () =>
  "PRICERISE - Skyline Car Hire (UK) Ltd would like to inform you of a change to your hire vehicle weekly payment.";

const priceRiseMessage = (weeklyAmount: number) =>
  `Skyline Car Hire (UK) Ltd would like to inform you that the weekly hire payment for your hire vehicle is now ${money(weeklyAmount)}. Please contact us today if you need to discuss the updated payment arrangement.`;

const weeklyPaymentsFromDates = (start: string, end: string): number => {
  if (!start || !end) return 0;
  const startTime = new Date(`${start}T00:00:00`).getTime();
  const endTime = new Date(`${end}T00:00:00`).getTime();
  const days = Math.round((endTime - startTime) / 86400000);
  if (Number.isNaN(days) || days <= 0) return 0;
  return Math.ceil(days / 7);
};

interface NewTransaction {
  amount: string;
  payment_mode: string;
  payment_date: string | null;
  payment_time: string | null;
  notes: string | null;
}

const RecordPaymentModal: React.FC<{
  row: PaymentRow;
  editTransactionId: number | null; // null = add a new part-payment; else edit that one
  saving: boolean;
  onCancel: () => void;
  onSave: (transaction: NewTransaction, editTransactionId: number | null, receiptFile: File | null) => void | Promise<void>;
}> = ({ row, editTransactionId, saving, onCancel, onSave }) => {
  const alreadyPaid = num(row.paid_amount);
  const dueRemaining = remainingDue(row);
  const txns = row.transactions ?? [];
  // Edit the specific part-payment the user clicked the pencil on; otherwise add a new one.
  const editingTxn = editTransactionId != null ? txns.find((t) => t.id === editTransactionId) ?? null : null;
  const isEdit = !!editingTxn;
  const [paidAmount, setPaidAmount] = useState(
    editingTxn ? num(editingTxn.amount).toFixed(2) : dueRemaining ? dueRemaining.toFixed(2) : "",
  );
  const [paymentDate, setPaymentDate] = useState(editingTxn?.payment_date || todayLocalISO());
  const [paymentMode, setPaymentMode] = useState(editingTxn?.payment_mode || "cash");
  const [notes, setNotes] = useState(editingTxn?.notes || "");
  const [receipt, setReceipt] = useState<File | null>(null);
  const [reading, setReading] = useState(false);
  const receiptInput = useRef<HTMLInputElement>(null);

  // Reading a bank transfer receipt pre-fills the fields below. Only blank fields
  // are filled so a value the user already typed is never overwritten; the mode
  // switches to Bank Transfer since that's what a receipt evidences.
  const handleReceipt = async (file: File) => {
    setReceipt(file);
    setReading(true);
    try {
      const parsed = await extractPaymentReceipt(file);
      if (parsed.amount) setPaidAmount(parsed.amount);
      if (parsed.paymentDate) setPaymentDate(ddmmyyyyToIso(parsed.paymentDate));
      setPaymentMode("bank_transfer");
      const readNote = [parsed.reference && `Ref: ${parsed.reference}`, parsed.payer && `From: ${parsed.payer}`]
        .filter(Boolean)
        .join(" · ");
      if (readNote) setNotes((current) => (current.trim() ? current : readNote));
      const missing = !parsed.amount || !parsed.paymentDate;
      if (missing) toast.info("Receipt read — please check the amount and date.");
      else toast.success("Receipt read.");
    } finally {
      setReading(false);
    }
  };
  const thisAmount = num(paidAmount);
  // In edit mode the amount replaces the edited transaction, so exclude it from "already paid".
  const otherPaid = alreadyPaid - (editingTxn ? num(editingTxn.amount) : 0);
  const totalAfterThisPayment = otherPaid + thisAmount;
  const remainingAfterThisPayment = Math.max(0, num(row.due_amount) - totalAfterThisPayment);
  const status = calculatedStatus({ ...row, paid_amount: totalAfterThisPayment.toFixed(2) });
  const canSave = !saving && thisAmount > 0;
  return (
    <div className="fixed inset-0 z-[110] bg-black/40 flex items-center justify-center p-4">
      {saving && <FleetSpinnerLoader />}
      <div className="w-[640px] max-w-full max-h-[92vh] overflow-y-auto p-6 bg-white rounded-lg flex flex-col gap-4 font-sans-headline">
        <div className="text-black text-xl font-semibold leading-5">{isEdit ? "Edit Payment" : "Record Payment"} — Week {row.week}</div>

        {/*
        Existing part-payments are hidden for the demo. Keep this block here so
        split-payment history can be restored once the workflow is agreed.
        {txns.length > 0 && (
          <div className="flex flex-col gap-2">
            <span className="text-neutral-700 text-sm font-medium">Payment history ({txns.length})</span>
            <div className="rounded outline outline-1 -outline-offset-1 outline-neutral-200 divide-y divide-neutral-100">
              {txns.map((t) => (
                <div key={t.id} className="flex items-center gap-3 px-3 py-2 text-sm">
                  <span className="w-20 shrink-0 text-neutral-900 font-medium">£{num(t.amount).toFixed(2)}</span>
                  <PaymentDateCell dateValue={t.payment_date} timeValue={t.payment_time} className="w-32 shrink-0 text-neutral-600" />
                  <span className="w-32 shrink-0 text-neutral-600">{paymentModeLabel(t.payment_mode)}</span>
                  <span className="flex-1 min-w-0 truncate text-neutral-500" title={t.notes || ""}>{t.notes || "—"}</span>
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => onDeleteTransaction(t.id)}
                    title="Remove this payment"
                    className="shrink-0 hover:opacity-70 disabled:opacity-40"
                  >
                    <img src={RemoveIcon} alt="Remove" className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <div className="flex items-center gap-3 px-3 py-2 text-sm bg-neutral-50">
                <span className="w-20 shrink-0 text-neutral-900 font-semibold">£{alreadyPaid.toFixed(2)}</span>
                <span className="text-neutral-500">Total paid so far</span>
              </div>
            </div>
          </div>
        )}
        */}

        <div className="h-px bg-neutral-100" />
        {/* Receipt first — reading it fills the fields below. */}
        <div className="flex flex-col gap-2">
          <span className="text-neutral-700 text-sm font-medium">Bank Transfer Receipt</span>
          <input
            ref={receiptInput}
            type="file"
            accept="image/*,.pdf"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleReceipt(file);
              e.target.value = "";
            }}
          />
          <button
            type="button"
            disabled={reading}
            onClick={() => receiptInput.current?.click()}
            className="px-5 py-4 bg-white rounded outline outline-1 -outline-offset-1 outline-neutral-200 flex items-center gap-3 text-left hover:outline-neutral-900 disabled:opacity-60"
          >
            <img src={UploadFileIcon} alt="" className="w-4 h-4 shrink-0" />
            <span className="flex-1 min-w-0 truncate text-base text-neutral-900">
              {reading ? "Reading receipt…" : receipt?.name || "Upload receipt to fill in the payment"}
            </span>
            {receipt && !reading && <span className="shrink-0 text-sm text-neutral-500">Replace</span>}
          </button>
        </div>

        <div className="h-px bg-neutral-100" />
        <div className="text-neutral-700 text-sm font-medium">{isEdit ? "Edit payment" : "Add a payment"}</div>
        <div className="grid grid-cols-2 gap-5">
          <FleetMoneyInput label="Payment Received" value={paidAmount} onChange={setPaidAmount} />
          <FleetDateField label="Payment Date" value={paymentDate} onChange={setPaymentDate} />
        </div>
        <div className="grid grid-cols-2 gap-5">
          <FleetSelect label="Payment Mode" value={paymentMode} options={PAYMENT_MODE_OPTIONS} onChange={setPaymentMode} />
          {/* Live-computed helpers — not disabled, they just reflect the amount you type. */}
          <FleetTextInput label="Remaining Due" value={`£${remainingAfterThisPayment.toFixed(2)}`} onChange={() => {}} />
        </div>
        <div className="grid grid-cols-2 gap-5">
          <FleetTextInput label="Status After This Payment" value={statusLabel(status)} onChange={() => {}} />
          <div />
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-neutral-700 text-sm font-medium">Note for this payment</span>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. bank transfer, cash, part payment…"
            rows={2}
            className="px-5 py-4 bg-white rounded outline outline-1 -outline-offset-1 outline-neutral-200 text-base text-neutral-900 placeholder:text-neutral-300 focus:outline-neutral-900 resize-none"
          />
        </div>
        <div className="h-px bg-neutral-100" />
        <div className="flex justify-end items-center gap-4">
          <button
            type="button"
            disabled={saving}
            onClick={onCancel}
            className={`px-6 py-4 rounded bg-white text-base font-medium outline outline-1 -outline-offset-1 ${
              saving ? "text-neutral-300 outline-neutral-200 cursor-not-allowed" : "text-neutral-900 outline-neutral-900 hover:bg-neutral-50"
            }`}
          >
            Close
          </button>
          <button
            type="button"
            disabled={!canSave}
            onClick={() => onSave({
              amount: formatMoney(thisAmount.toFixed(2)),
              payment_mode: paymentMode,
              payment_date: paymentDate || null,
              payment_time: editingTxn?.payment_time || currentTime24(),
              notes: notes || null,
            }, editingTxn?.id ?? null, receipt)}
            className={`px-6 py-4 rounded text-white text-base font-medium ${
              canSave ? "bg-neutral-900 hover:bg-black" : "bg-neutral-400 cursor-not-allowed"
            }`}
          >
            {isEdit ? "Save Changes" : "Add Payment"}
          </button>
        </div>
      </div>
    </div>
  );
};

const PaymentDetails: React.FC = () => {
  const [form, setForm] = useState<PaymentForm>(EMPTY);
  const [rows, setRows] = useState<PaymentRow[]>([]);
  const [summaryRowsByVehicleId, setSummaryRowsByVehicleId] = useState<Record<string, PaymentRow[]>>({});
  const [recordId, setRecordId] = useState<number | null>(null);
  const [editTxnId, setEditTxnId] = useState<number | null>(null); // sub-record being edited
  const [vehicles, setVehicles] = useState<HireVehicleRecord[]>([]);
  const [activeVehicleIndex, setActiveVehicleIndex] = useState(0);
  const [deleteVehicleIndex, setDeleteVehicleIndex] = useState<number | null>(null);
  const [deleteTxn, setDeleteTxn] = useState<{ weekId: number; txnId: number } | null>(null);
  const [validation, setValidation] = useState<{ weeks?: string; deposit?: string }>({});
  const [initialLoading, setInitialLoading] = useState(false);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [vehiclesLoaded, setVehiclesLoaded] = useState(false);
  const [recordSaving, setRecordSaving] = useState(false);
  const [messageKind, setMessageKind] = useState<"reminder" | "price_rise" | null>(null);
  const { hire, hireId, save, activeVehicleId: sharedVehicleId, setActiveVehicleId } = useHire();
  const hydrated = useRef(false);
  const lastDerivedSave = useRef("");
  const lastScheduleSync = useRef("");

  // Pre-fill from the saved hire once (reopen an existing hire / after creation).
  useEffect(() => {
    if (hydrated.current || !hire) return;
    hydrated.current = true;
    setForm({
      hireStartDate: hire.payment_hire_start_date || "",
      hireEndDate: hire.payment_hire_end_date || "",
      vehicleCostPerDay: hire.vehicle_cost_per_day || "",
      numberOfWeeklyPayments: hire.number_of_weekly_payments || "",
      paymentDay: hire.payment_day || "",
      securityDeposit: hire.security_deposit || "",
      weeklyHirePayment: hire.weekly_hire_payment || "",
      totalPlannedHireCost: hire.total_planned_hire_cost || "",
      initialAmountDue: hire.initial_amount_due || "",
      damageCharges: hire.payment_damage_charges || "",
      additionalCharges: hire.additional_charges || "",
    });
  }, [hire]);

  // Load the hire's vehicle cards once the hire id is known. Payment rows are
  // loaded separately for the active card so card balances never leak.
  useEffect(() => {
    if (!hireId) {
      setRows([]);
      setSummaryRowsByVehicleId({});
      setVehicles([]);
      setActiveVehicleIndex(0);
      setInitialLoading(false);
      setVehiclesLoaded(false);
      return;
    }

    let active = true;
    setVehiclesLoaded(false);
    setInitialLoading(true);
    listVehicles(hireId)
      .then((vehicleRows) => {
        if (!active) return;
        setVehicles(vehicleRows);
        // Open the same card the user last made active on Hire Vehicle Details.
        const resolved = sharedVehicleId != null
          ? vehicleRows.findIndex((v) => Number((v as { id?: unknown }).id) === sharedVehicleId)
          : -1;
        const initialIdx = resolved >= 0 ? resolved : 0;
        setActiveVehicleIndex(initialIdx);
        const initialId = (vehicleRows[initialIdx] as { id?: unknown } | undefined)?.id;
        setActiveVehicleId(initialId != null ? Number(initialId) : null);
      })
      .finally(() => {
        if (active) {
          setInitialLoading(false);
          setVehiclesLoaded(true);
        }
      });

    return () => {
      active = false;
    };
  }, [hireId]);

  const set = (key: keyof PaymentForm, value: string) => setForm((f) => ({ ...f, [key]: value }));
  const persist = (col: string, value: string) => save({ [col]: value || null });
  const saveField = (key: keyof PaymentForm) => persist(TO_BACKEND[key], form[key]);

  // Switch the active card AND publish it so Hire Vehicle Details stays in sync.
  const selectPaymentVehicle = (index: number) => {
    setActiveVehicleIndex(index);
    const id = (vehicles[index] as { id?: unknown } | undefined)?.id;
    setActiveVehicleId(id != null ? Number(id) : null);
  };

  useEffect(() => {
    if (activeVehicleIndex > 0 && activeVehicleIndex >= vehicles.length) {
      setActiveVehicleIndex(Math.max(0, vehicles.length - 1));
    }
  }, [activeVehicleIndex, vehicles.length]);

  const paymentVehicle = vehicles[activeVehicleIndex] || null;
  const activeVehicleId = paymentVehicle?.id ? Number(paymentVehicle.id) : null;
  const hireStartDate = paymentVehicle
    ? String(paymentVehicle.hire_start_date || "")
    : String(form.hireStartDate || "");
  const hireEndDate = paymentVehicle
    ? String(paymentVehicle.hire_end_date || "")
    : String(form.hireEndDate || "");
  const vehicleCostPerDay = paymentVehicle
    ? num(paymentVehicle.vehicle_cost_per_week) / 7
    : num(hire?.vehicle_cost_per_day || form.vehicleCostPerDay);
  const damageCharges = paymentVehicle ? num(paymentVehicle.damage_charges) : num(form.damageCharges);
  const additionalChargeAmount = paymentVehicle ? num(paymentVehicle.additional_charges) : num(form.additionalCharges);
  const damageChargesInput = paymentVehicle ? String(paymentVehicle.damage_charges ?? "") : form.damageCharges;
  const additionalChargesInput = paymentVehicle ? String(paymentVehicle.additional_charges ?? "") : form.additionalCharges;
  const dateDerivedWeeks = weeklyPaymentsFromDates(hireStartDate, hireEndDate);
  // Weekly-payment count is per-vehicle (each card keeps its own; new vehicles start blank).
  const numberOfWeeklyPayments = paymentVehicle
    ? String(paymentVehicle.number_of_weekly_payments ?? "")
    : form.numberOfWeeklyPayments;
  const weeks = Math.max(0, parseInt(numberOfWeeklyPayments || "0", 10) || 0);
  const weekly = vehicleCostPerDay * 7;
  const securityDeposit = paymentVehicle ? String(paymentVehicle.deposit ?? "0") : form.securityDeposit;
  const deposit = num(securityDeposit);
  const totalPlanned = weeks * weekly;
  const initialDue = deposit + weekly;
  const vehicleSummaries = useMemo(
    () =>
      vehicles.map((vehicle, index) => {
        const key = vehicleSummaryKey(vehicle, index);
        const isActiveVehicle = index === activeVehicleIndex;
        const paymentRows = isActiveVehicle ? rows : (summaryRowsByVehicleId[key] || []);
        const plannedFromRows = rowsTotalDue(paymentRows);
        const vehicleWeekly = num(vehicle.vehicle_cost_per_week);
        const vehicleWeeks = weeklyPaymentsFromDates(
          String(vehicle.hire_start_date || ""),
          String(vehicle.hire_end_date || ""),
        );
        const plannedHireCost = plannedFromRows || (vehicleWeeks * vehicleWeekly);
        const received = rowsTotalReceived(paymentRows);
        const adjustedFromDeposit = rowsDepositAdjusted(paymentRows);
        const vehicleDamageCharges = num(vehicle.damage_charges);
        const vehicleAdditionalCharges = num(vehicle.additional_charges);
        const grossCharges = plannedHireCost + vehicleDamageCharges + vehicleAdditionalCharges;

        // Off-hire = settlement reached. Only then is the deposit reconciled; before
        // that the vehicle has no hire_end_date and the deposit is just held.
        const offHire = String(vehicle.hire_status || "") === "off_hire" || !!vehicle.hire_end_date;
        return {
          key,
          label: `Vehicle${index + 1}`,
          registration: String(vehicle.registration_number || "Reg#"),
          plannedHireCost,
          received,
          adjustedFromDeposit,
          damageCharges: vehicleDamageCharges,
          additionalCharges: vehicleAdditionalCharges,
          grossCharges,
          chargesDue: Math.max(0, grossCharges - received),
          depositHeld: index === 0 ? num(vehicle.deposit) : 0,
          offHire,
        };
      }),
    [activeVehicleIndex, rows, summaryRowsByVehicleId, vehicles],
  );
  const combinedDepositHeld = vehicleSummaries.reduce((sum, summary) => sum + summary.depositHeld, 0);
  const combinedDepositAdjusted = vehicleSummaries.reduce((sum, summary) => sum + summary.adjustedFromDeposit, 0);
  // What the driver still owes: unpaid weekly hire (incl. any extra week from an off-hire
  // date extension, which is already added to the schedule) + post-hire charges (damage +
  // additional). Deposit-adjusted payments are already excluded (they count as received).
  const combinedUnpaidHire = vehicleSummaries.reduce(
    (sum, summary) => sum + Math.max(0, summary.plannedHireCost - summary.received),
    0,
  );
  const combinedPostHireCharges = vehicleSummaries.reduce(
    (sum, summary) => sum + summary.damageCharges + summary.additionalCharges,
    0,
  );
  const combinedObligations = combinedUnpaidHire + combinedPostHireCharges;
  // The deposit is reconciled once it's engaged — either the hire is off-hired
  // (settlement) OR the user has adjusted a payment into it. Until then an untouched
  // deposit on an active hire is just held (driver owes the full unpaid hire).
  const settled = vehicleSummaries.length > 0 && vehicleSummaries.every((summary) => summary.offHire);
  const depositEngaged = combinedDepositAdjusted > 0;
  const combinedDepositAvailable =
    settled || depositEngaged ? Math.max(0, combinedDepositHeld - combinedDepositAdjusted) : 0;
  // ONE final figure: net the obligations against the deposit. >0 owes, <0 refundable.
  const netPosition = combinedObligations - combinedDepositAvailable;
  const finalOutcome =
    netPosition > 0
      ? `Driver owes ${money(netPosition)}`
      : netPosition < 0
        ? `${money(-netPosition)} refundable`
        : "No balance due";
  const finalOutcomeTone = netPosition > 0 ? "outstanding" : "clear";
  const messagePhrase =
    messageKind === "reminder"
      ? paymentReminderPhrase()
      : messageKind === "price_rise"
        ? priceRisePhrase()
        : "";
  const messageBody =
    messageKind === "reminder"
      ? paymentReminderMessage()
      : messageKind === "price_rise"
        ? priceRiseMessage(weekly)
        : "";

  useEffect(() => {
    if (!hireId || !vehiclesLoaded) return;
    if (vehicles.length > 0 && !activeVehicleId) return;
    let active = true;
    lastScheduleSync.current = "";
    setRows([]);
    setScheduleLoading(true);
    listPayments(hireId, activeVehicleId)
      .then((paymentRows) => {
        if (!active) return;
        setRows(paymentRows);
        if (activeVehicleId) {
          setSummaryRowsByVehicleId((current) => ({ ...current, [String(activeVehicleId)]: paymentRows }));
        }
      })
      .catch(() => {
        if (active) toast.error("Could not load payment schedule for this vehicle.");
      })
      .finally(() => {
        if (active) setScheduleLoading(false);
      });

    return () => {
      active = false;
    };
  }, [hireId, activeVehicleId, vehicles.length, vehiclesLoaded]);

  useEffect(() => {
    if (!hireId || !vehiclesLoaded || vehicles.length === 0) {
      setSummaryRowsByVehicleId({});
      return;
    }

    const vehicleIds = vehicles
      .map((vehicle) => (vehicle.id ? Number(vehicle.id) : null))
      .filter((id): id is number => Boolean(id));
    if (vehicleIds.length === 0) {
      setSummaryRowsByVehicleId({});
      return;
    }

    let active = true;
    Promise.all(
      vehicleIds.map(async (vehicleId) => {
        const paymentRows = await listPayments(hireId, vehicleId);
        return [String(vehicleId), paymentRows] as const;
      }),
    ).then((entries) => {
      if (!active) return;
      setSummaryRowsByVehicleId(Object.fromEntries(entries));
    });

    return () => {
      active = false;
    };
  }, [
    hireId,
    vehiclesLoaded,
    vehicles.map((vehicle) => String(vehicle.id || "")).join("|"),
  ]);

  useEffect(() => {
    if (!hireId || form.paymentDay || !DEFAULT_PAYMENT_DAY) return;
    set("paymentDay", DEFAULT_PAYMENT_DAY);
    persist(TO_BACKEND.paymentDay, DEFAULT_PAYMENT_DAY);
  }, [hireId, form.paymentDay, save]);

  useEffect(() => {
    if (!dateDerivedWeeks) return;
    const nextWeeks = String(dateDerivedWeeks);
    if (paymentVehicle) {
      // Already matches -> no-op (prevents a re-render loop, since editing vehicles
      // changes paymentVehicle which is intentionally not a dependency here).
      if (String(paymentVehicle.number_of_weekly_payments ?? "") === nextWeeks) return;
      setVehicles((current) =>
        current.map((veh, i) => (i === activeVehicleIndex ? { ...veh, number_of_weekly_payments: nextWeeks } : veh)),
      );
    } else {
      setForm((current) => (
        current.numberOfWeeklyPayments === nextWeeks ? current : { ...current, numberOfWeeklyPayments: nextWeeks }
      ));
    }
  }, [dateDerivedWeeks, activeVehicleIndex]);

  useEffect(() => {
    const derived = {
      payment_hire_start_date: hireStartDate || null,
      payment_hire_end_date: hireEndDate || null,
      vehicle_cost_per_day: vehicleCostPerDay ? vehicleCostPerDay.toFixed(2) : null,
      number_of_weekly_payments: weeks ? String(weeks) : null,
      weekly_hire_payment: weekly ? weekly.toFixed(2) : null,
      total_planned_hire_cost: totalPlanned ? totalPlanned.toFixed(2) : null,
      initial_amount_due: initialDue ? initialDue.toFixed(2) : null,
      payment_damage_charges: damageCharges ? damageCharges.toFixed(2) : "0.00",
      additional_charges: additionalChargeAmount ? additionalChargeAmount.toFixed(2) : "0.00",
    };
    const signature = JSON.stringify(derived);
    if (!hireId || signature === lastDerivedSave.current) return;
    lastDerivedSave.current = signature;
    save(derived);
  }, [
    hireId,
    hireStartDate,
    hireEndDate,
    weeks,
    vehicleCostPerDay,
    weekly,
    totalPlanned,
    initialDue,
    damageCharges,
    additionalChargeAmount,
    save,
  ]);

  // Persist the weekly schedule (weeks 1..count) to the backend, preserving any
  // already-recorded payment data. Called after the count / weekly amount changes.
  const syncScheduleNow = async () => {
    if (!hireId || !vehiclesLoaded || (vehicles.length > 0 && !activeVehicleId)) return;
    const count = Math.max(0, parseInt(numberOfWeeklyPayments || "0", 10) || 0);
    const weeklyAmt = weekly;
    const signature = `${activeVehicleId || "hire"}:${count}:${weeklyAmt.toFixed(2)}`;
    setScheduleLoading(true);
    try {
      const nextRows = await syncSchedule(
        hireId,
        count,
        weeklyAmt ? weeklyAmt.toFixed(2) : "",
        weeklyAmt ? weeklyAmt.toFixed(2) : "",
        activeVehicleId,
      );
      setRows(nextRows);
      if (activeVehicleId) {
        setSummaryRowsByVehicleId((current) => ({ ...current, [String(activeVehicleId)]: nextRows }));
      }
      lastScheduleSync.current = signature;
    } catch {
      toast.error("Could not update weekly payment schedule.");
    } finally {
      setScheduleLoading(false);
    }
  };

  useEffect(() => {
    if (!hireId || !vehiclesLoaded || (vehicles.length > 0 && !activeVehicleId) || weeks <= 0 || weekly <= 0) return;
    const signature = `${activeVehicleId || "hire"}:${weeks}:${weekly.toFixed(2)}`;
    if (signature === lastScheduleSync.current) return;
    let active = true;
    setScheduleLoading(true);
    syncSchedule(hireId, weeks, weekly.toFixed(2), weekly.toFixed(2), activeVehicleId)
      .then((nextRows) => {
        if (!active) return;
        setRows(nextRows);
        if (activeVehicleId) {
          setSummaryRowsByVehicleId((current) => ({ ...current, [String(activeVehicleId)]: nextRows }));
        }
        lastScheduleSync.current = signature;
      })
      .catch(() => {
        if (active) toast.error("Could not update weekly payment schedule.");
      })
      .finally(() => {
        if (active) setScheduleLoading(false);
      });

    return () => {
      active = false;
    };
  }, [hireId, weeks, weekly, activeVehicleId, vehicles.length, vehiclesLoaded]);

  const saveWeeks = async () => {
    const count = parseInt(numberOfWeeklyPayments || "0", 10) || 0;
    setValidation((v) => ({ ...v, weeks: undefined }));
    if (hireId && paymentVehicle?.id) {
      await updateVehicle(hireId, Number(paymentVehicle.id), { number_of_weekly_payments: String(count) });
    } else {
      await persist(TO_BACKEND.numberOfWeeklyPayments, String(count));
    }
    await syncScheduleNow();
  };
  const saveDeposit = async () => {
    setValidation((v) => ({ ...v, deposit: undefined }));
    if (hireId && paymentVehicle?.id) {
      await updateVehicle(hireId, Number(paymentVehicle.id), { deposit: securityDeposit });
    } else {
      await saveField("securityDeposit");
    }
  };

  const setSecurityDeposit = (value: string) => {
    if (!paymentVehicle) {
      set("securityDeposit", value);
      return;
    }
    setVehicles((current) =>
      current.map((vehicle, index) => (index === activeVehicleIndex ? { ...vehicle, deposit: value } : vehicle)),
    );
  };
  const setPaymentVehicleField = (key: string, value: string, partial: Record<string, unknown>) => {
    if (!paymentVehicle) return;
    setVehicles((current) =>
      current.map((vehicle, index) => (index === activeVehicleIndex ? { ...vehicle, [key]: value } : vehicle)),
    );
    if (hireId && paymentVehicle.id) updateVehicle(hireId, Number(paymentVehicle.id), partial);
  };

  const recordRow = rows.find((r) => r.id === recordId) || null;

  // Open the Record Payment modal — either to add a new part-payment (txnId null) or to
  // edit a specific existing one (via a sub-record's pencil).
  const openPaymentModal = (weekId: number, txnId: number | null) => {
    setEditTxnId(txnId);
    setRecordId(weekId);
  };
  const closePaymentModal = () => {
    setRecordId(null);
    setEditTxnId(null);
  };

  const handleDeleteTransaction = async (paymentId: number, transactionId: number) => {
    if (!hireId) return;
    const updated = await deletePaymentTransaction(hireId, paymentId, transactionId);
    if (updated) {
      setRows((rs) => rs.map((r) => (r.id === paymentId ? updated : r)));
      if (activeVehicleId) {
        setSummaryRowsByVehicleId((current) => ({
          ...current,
          [String(activeVehicleId)]: (current[String(activeVehicleId)] || rows).map((row) =>
            row.id === paymentId ? updated : row,
          ),
        }));
      }
      toast.success("Payment removed.");
    } else {
      toast.error("Could not remove payment. Please try again.");
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
    if (deleteVehicleIndex === null || !hireId) return;
    const target = vehicles[deleteVehicleIndex];
    const vehicleId = target?.id ? Number(target.id) : null;
    if (vehicleId) {
      const deleted = await deleteVehicle(hireId, vehicleId);
      if (!deleted) {
        toast.error("Could not delete vehicle. Please try again.");
        return;
      }
    }

    const remaining = vehicles.filter((_, index) => index !== deleteVehicleIndex);
    const nextIndex = activeVehicleIndex < deleteVehicleIndex ? activeVehicleIndex : Math.max(0, activeVehicleIndex - 1);
    setVehicles(remaining);
    if (vehicleId) {
      setSummaryRowsByVehicleId((current) => {
        const next = { ...current };
        delete next[String(vehicleId)];
        return next;
      });
    }
    setActiveVehicleIndex(nextIndex);
    const nextId = (remaining[nextIndex] as { id?: unknown } | undefined)?.id;
    setActiveVehicleId(nextId != null ? Number(nextId) : null);
    setRows([]);
    setDeleteVehicleIndex(null);
    toast.success("Vehicle deleted.");
  };

  return (
    <div className="w-full max-w-[788px] flex flex-col gap-6 font-sans-headline">
      {initialLoading && <FleetSpinnerLoader />}
      <h2 className="text-black text-2xl font-semibold leading-6">Payment Details - Weekly Hire Payments &amp; Off-Hire Settlement</h2>

      {vehicles.length > 0 && (
        <div className="flex gap-6">
          {vehicles.map((vehicle, index) => {
            const isActive = index === activeVehicleIndex;
            return (
              <div
                key={String(vehicle.id ?? index)}
                className={`flex-1 p-5 rounded-lg outline outline-1 -outline-offset-1 flex items-start gap-4 ${
                  isActive ? "bg-neutral-100 outline-neutral-700" : "bg-white outline-neutral-200"
                }`}
              >
                <button
                  type="button"
                  onClick={() => selectPaymentVehicle(index)}
                  className="flex-1 min-w-0 rounded-lg flex flex-col items-start gap-1 text-left"
                >
                  <div className={`${isActive ? "text-neutral-900" : "text-neutral-500"} text-xl font-semibold leading-5`}>Vehicle{index + 1}</div>
                  <div className={`${isActive ? "text-neutral-700" : "text-neutral-500"} text-sm font-medium truncate max-w-full`}>
                    {String(vehicle.registration_number || "Reg#")}
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => requestDeleteVehicle(index)}
                  className="w-5 h-5 shrink-0 flex items-center justify-center"
                  title={`Delete Vehicle${index + 1}`}
                >
                  <img src={RemoveIcon} alt="" className="w-4 h-4 opacity-60" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Payment Details */}
      <section className={SECTION}>
        <h3 className={H3}>Payment Details</h3>
        <div className="h-px bg-neutral-100" />
        <div className="grid grid-cols-2 gap-5">
          <FleetDateField
            label="Hire Start Date"
            value={hireStartDate}
            onChange={(v) => {
              if (paymentVehicle) setPaymentVehicleField("hire_start_date", v, { hire_start_date: v || null });
              else { set("hireStartDate", v); persist(TO_BACKEND.hireStartDate, v); }
            }}
          />
          <FleetDateField
            label="Hire End Date"
            value={hireEndDate}
            onChange={(v) => {
              if (paymentVehicle) setPaymentVehicleField("hire_end_date", v, { hire_end_date: v || null });
              else { set("hireEndDate", v); persist(TO_BACKEND.hireEndDate, v); }
            }}
          />
        </div>
        <div className="grid grid-cols-2 gap-5">
          <FleetMoneyInput label="Vehicle Cost Per Day" value={readonlyMoney(vehicleCostPerDay)} onChange={() => {}} />
          <div />
        </div>
        <div className="grid grid-cols-2 gap-5">
          <div className="flex flex-col gap-1">
            <FleetTextInput
              label="Number of Weekly Payments"
              placeholder="Enter"
              inputMode="numeric"
              value={numberOfWeeklyPayments}
              onChange={(v) => {
                const clean = v.replace(/[^0-9]/g, "");
                if (paymentVehicle) {
                  setVehicles((current) =>
                    current.map((veh, i) => (i === activeVehicleIndex ? { ...veh, number_of_weekly_payments: clean } : veh)),
                  );
                } else {
                  set("numberOfWeeklyPayments", clean);
                }
              }}
              onBlur={saveWeeks}
            />
            {validation.weeks && <span className={ERROR}>{validation.weeks}</span>}
          </div>
          <FleetSelect
            label="Payment Day"
            value={form.paymentDay || DEFAULT_PAYMENT_DAY}
            options={PAYMENT_DAY_OPTIONS}
            unsorted
            onChange={(v) => { set("paymentDay", v); persist(TO_BACKEND.paymentDay, v); }}
          />
        </div>
        <div className="grid grid-cols-2 gap-5">
          <div className="flex flex-col gap-1">
            <FleetMoneyInput label="Security Deposit" value={securityDeposit} onChange={setSecurityDeposit} onBlur={saveDeposit} />
            {validation.deposit && <span className={ERROR}>{validation.deposit}</span>}
          </div>
          <FleetMoneyInput label="Weekly Hire Payment" value={readonlyMoney(weekly)} onChange={() => {}} />
        </div>
        <div className="grid grid-cols-2 gap-5">
          <FleetMoneyInput label="Total Hire Cost" value={readonlyMoney(totalPlanned)} onChange={() => {}} highlight />
          <FleetMoneyInput label="Initial Amount Due" value={readonlyMoney(initialDue)} onChange={() => {}} highlight />
        </div>
        <div className="py-2 flex flex-wrap gap-4">
          <button
            type="button"
            onClick={() => setMessageKind("reminder")}
            className="flex-1 min-w-[220px] h-9 px-3 py-2 rounded outline outline-1 -outline-offset-1 outline-neutral-900 text-neutral-900 text-sm hover:bg-neutral-50"
          >
            Send Payment Reminder
          </button>
          <button
            type="button"
            onClick={() => setMessageKind("price_rise")}
            className="flex-1 min-w-[220px] h-9 px-3 py-2 rounded outline outline-1 -outline-offset-1 outline-neutral-900 text-neutral-900 text-sm hover:bg-neutral-50"
          >
            Inform Hirer of Price Rise
          </button>
        </div>
      </section>

      {/* Weekly Payment Schedule */}
      <section className={SECTION}>
        <h3 className={H3}>Weekly Payment Schedule</h3>
        <div className="h-px bg-neutral-100" />
        <div className="relative rounded-lg outline outline-1 -outline-offset-1 outline-neutral-100 overflow-hidden">
          {scheduleLoading && (
            <div className="absolute inset-0 z-10 bg-white/80 flex items-center justify-center">
              <FleetInlineLoader text="Updating payment schedule..." />
            </div>
          )}
          <div className="w-full flex flex-col gap-2 p-2">
            <div className={`grid ${PAYMENT_SCHEDULE_GRID} gap-2 px-3 h-11 items-center text-neutral-900 text-xs font-semibold`}>
              <span>WEEK</span><span>DUE AMOUNT</span><span>STATUS</span><span className="text-center">PAID AMOUNT</span><span>PAYMENT DATE</span><span className="text-center">NOTES</span><span>ACTION</span>
            </div>
            {rows.length === 0 ? (
              <div className="px-4 h-12 flex items-center justify-center text-center text-neutral-400 text-sm">Enter the number of weekly payments to generate the schedule.</div>
            ) : (
              rows.map((r) => {
                const txns = r.transactions ?? [];
                // A single payment that clears the week has no sub-record — the summary
                // button edits that one payment instead of adding another.
                const editSinglePayment = txns.length === 1 && !shouldShowPaymentBreakdown(r);
                // Once the week is fully received there's nothing left to record — hide
                // the "Record Payment" button (it returns when it drops to pending/partial).
                // The single-full-payment "Edit Payment" button stays, as the only handle
                // on that payment.
                const fullyReceived = calculatedStatus(r) === "received";
                // Summary note: the single payment's note when there's just one; for a
                // week paid in parts the notes live on each sub-record below.
                const rowNote = txns.length === 1 ? (txns[0].notes || "") : (r.notes || "");
                return (
                  <div key={r.id} className="rounded-lg outline outline-1 -outline-offset-1 outline-neutral-200 p-2 flex flex-col gap-2">
                    {/* Summary row — PAID AMOUNT is the sum of the week's part-payments. */}
                    <div className={`grid ${PAYMENT_SCHEDULE_GRID} gap-2 px-3 py-1 items-center text-neutral-700 text-sm`}>
                      <span>{r.week}</span>
                      <MoneyCell value={r.due_amount} />
                      <span>{statusLabel(calculatedStatus(r))}</span>
                      <MoneyCell value={r.paid_amount} className="text-center" />
                      <PaymentDateCell dateValue={r.payment_date} timeValue={r.payment_time} />
                      <span className="block min-w-0 truncate text-center" title={rowNote}>{rowNote || <span className="text-neutral-400">-</span>}</span>
                      {(editSinglePayment || !fullyReceived) ? (
                        <button
                          type="button"
                          onClick={() => openPaymentModal(r.id, editSinglePayment ? txns[0].id : null)}
                          className="w-full h-8 px-2 bg-neutral-900 rounded text-white text-sm hover:bg-black inline-flex items-center justify-center whitespace-nowrap"
                        >
                          {editSinglePayment ? "Edit Payment" : "Record Payment"}
                        </button>
                      ) : (
                        <span />
                      )}
                    </div>
                    {/* Only weeks paid in parts get sub-records; each part-payment has its
                        amount / date / note in one grey pill + edit (pencil) + delete (trash). */}
                    {shouldShowPaymentBreakdown(r) &&
                      txns.map((t) => (
                        <div key={t.id} className={`grid ${PAYMENT_SCHEDULE_GRID} gap-2 items-stretch text-neutral-700 text-sm`}>
                          <span /><span /><span />
                          {/* Amount + date + note, aligned under PAID / PAYMENT DATE / NOTES. */}
                          <div className="col-span-3 -ml-2 py-2.5 bg-neutral-100 rounded-l-lg grid grid-cols-3 gap-2 items-center">
                            <span className="pl-2 text-center">£{num(t.amount).toFixed(2)}</span>
                            <PaymentDateCell dateValue={t.payment_date} timeValue={t.payment_time} className="text-neutral-700" />
                            <span className="block min-w-0 truncate pr-1 text-center" title={t.notes || ""}>{t.notes || <span className="text-neutral-400">-</span>}</span>
                          </div>
                          {/* Icons — same grey, content-width, stretched to the same height so the
                              two halves read as one seamless pill (not stretched to the column end). */}
                          <div className="-ml-2 pr-2 self-stretch bg-neutral-100 rounded-r-lg w-fit flex items-center gap-4">
                            <button type="button" title="Edit this payment" onClick={() => openPaymentModal(r.id, t.id)} className="hover:opacity-70">
                              <img src={PencilIcon} alt="Edit" className="w-4 h-4" />
                            </button>
                            <button type="button" title="Delete this payment" onClick={() => setDeleteTxn({ weekId: r.id, txnId: t.id })} className="hover:opacity-70">
                              <img src={RemoveIcon} alt="Delete" className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </section>

      {/* Charges */}
      <section className={SECTION}>
        <h3 className={H3}>Charges</h3>
        <div className="h-px bg-neutral-100" />
        <div className="grid grid-cols-2 gap-5">
          <FleetMoneyInput
            label="Vehicle Damage Charges"
            value={damageChargesInput}
            onChange={(v) => {
              if (paymentVehicle) setPaymentVehicleField("damage_charges", v, { damage_charges: v || null });
              else set("damageCharges", v);
            }}
            onBlur={() => {
              if (!paymentVehicle) saveField("damageCharges");
            }}
          />
          <FleetMoneyInput
            label="Additional Charges"
            value={additionalChargesInput}
            onChange={(v) => {
              if (paymentVehicle) setPaymentVehicleField("additional_charges", v, { additional_charges: v || null });
              else set("additionalCharges", v);
            }}
            onBlur={() => {
              if (!paymentVehicle) saveField("additionalCharges");
            }}
          />
        </div>
        <div className="grid grid-cols-2 gap-5">
          <FleetTextInput
            label="Damage Reason"
            value={String(paymentVehicle?.damage_notes || "")}
            onChange={(v) => {
              if (paymentVehicle) setPaymentVehicleField("damage_notes", v, { damage_notes: v || null });
            }}
            placeholder="-"
          />
          <FleetTextInput
            label="Additional Charges Reason"
            value={String(paymentVehicle?.additional_charges_reason || "")}
            onChange={(v) => {
              if (paymentVehicle) setPaymentVehicleField("additional_charges_reason", v, { additional_charges_reason: v || null });
            }}
            placeholder="-"
          />
        </div>
      </section>

      {/* Final Payment Summary */}
      <section className={SECTION}>
        <h3 className={H3}>Final Payment Summary</h3>
        <div className="h-px bg-neutral-100" />
        {vehicleSummaries.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {vehicleSummaries.map((summary, index) => (
              <div
                key={summary.key}
                className={`flex flex-col gap-2 ${index > 0 ? "md:border-l md:border-neutral-200 md:pl-6" : "md:pr-6"}`}
              >
                <div className="mb-1">
                  <div className="text-neutral-900 text-base font-semibold">{summary.label}</div>
                  <div className="text-neutral-500 text-xs">{summary.registration}</div>
                </div>
                {[
                  ["Planned Hire Cost:", money(summary.plannedHireCost)],
                  ["Payments Received:", money(summary.received)],
                  ["Final Charges Due:", money(summary.chargesDue)],
                  ["Security Deposit:", money(summary.depositHeld)],
                  ["Adjusted From Deposit:", money(summary.adjustedFromDeposit)],
                ].map(([label, val]) => (
                  <div key={label} className="text-sm flex justify-between gap-3">
                    <span className="text-neutral-700">{label}</span>
                    <span className="text-neutral-900 font-medium">{val}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-neutral-400 text-sm">No vehicle summary available yet.</div>
        )}

        <div className="h-px bg-neutral-100" />
        <div className="flex items-center justify-between gap-4">
          <span className="text-neutral-900 text-sm font-semibold">Overall Final Outcome:</span>
          <span
            className={`px-4 py-2 rounded text-sm font-semibold ${
              finalOutcomeTone === "outstanding"
                ? "bg-red-50 text-red-700 outline outline-1 -outline-offset-1 outline-red-200"
                : "bg-green-50 text-green-700 outline outline-1 -outline-offset-1 outline-green-200"
            }`}
          >
            {finalOutcome}
          </span>
        </div>
      </section>

      {recordRow && (
        <RecordPaymentModal
          row={recordRow}
          editTransactionId={editTxnId}
          saving={recordSaving}
          onCancel={() => {
            if (!recordSaving) closePaymentModal();
          }}
          onSave={async (transaction, editTransactionId, receiptFile) => {
            const id = recordRow.id;
            setRecordSaving(true);
            try {
              if (hireId) {
                const updated = editTransactionId
                  ? await updatePaymentTransaction(hireId, id, editTransactionId, transaction)
                  : await recordPaymentTransaction(hireId, id, transaction);
                if (!updated) throw new Error("Payment save failed");
                // Store the receipt after the payment is saved — a failed upload
                // must not lose a recorded payment.
                if (receiptFile) {
                  try {
                    await uploadHireDocument(hireId, "payment_receipt", receiptFile);
                  } catch {
                    toast.warn("Payment saved, but the receipt could not be uploaded.");
                  }
                }
                setRows((rs) => rs.map((r) => (r.id === id ? updated : r)));
                if (activeVehicleId) {
                  setSummaryRowsByVehicleId((current) => ({
                    ...current,
                    [String(activeVehicleId)]: (current[String(activeVehicleId)] || rows).map((row) =>
                      row.id === id ? updated : row,
                    ),
                  }));
                }
              }
              closePaymentModal();
              toast.success(editTransactionId ? "Payment updated." : "Payment recorded.");
            } catch {
              toast.error("Could not save payment. Please try again.");
            } finally {
              setRecordSaving(false);
            }
          }}
        />
      )}

      <FleetWhatsAppModal
        open={messageKind !== null}
        onClose={() => setMessageKind(null)}
        title={messageKind === "price_rise" ? "Inform Hirer of Price Rise" : "Send Payment Reminder"}
        correspondent={hire?.driver_name ? `Hirer - ${hire.driver_name}` : "Hirer"}
        mobile={hire?.driver_mobile || ""}
        reference={hire?.fleet_reference || ""}
        defaultMessage={messagePhrase}
        defaultHistoryDetails={messageBody}
        onSend={async (payload) => {
          if (!hireId) throw new Error("Save the hire before sending a WhatsApp message.");
          await sendFleetWhatsApp(hireId, {
            mobile: payload.mobile,
            message: payload.message,
            correspondent: payload.correspondent,
            reference: payload.reference,
            phrase: payload.phrase,
            history_details: payload.historyDetails,
            kind: messageKind || undefined,
          });
        }}
      />
      {deleteVehicleIndex !== null && (
        <FleetConfirmModal
          title="Delete Vehicle"
          message={`Are you sure you want to delete Vehicle${deleteVehicleIndex + 1}?`}
          confirmLabel="Delete"
          onCancel={() => setDeleteVehicleIndex(null)}
          onConfirm={confirmDeleteVehicle}
        />
      )}

      {deleteTxn && (
        <FleetConfirmModal
          title="Delete Payment"
          message="Are you sure you want to delete this payment?"
          confirmLabel="Delete"
          onCancel={() => setDeleteTxn(null)}
          onConfirm={async () => {
            const target = deleteTxn;
            setDeleteTxn(null);
            await handleDeleteTransaction(target.weekId, target.txnId);
          }}
        />
      )}
    </div>
  );
};

export default PaymentDetails;
