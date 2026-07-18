import React, { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { FleetTextInput } from "./fields";
import { sendDepositRefund, type DepositRefundDraft } from "../services/emailService";

interface Props {
  open: boolean;
  onClose: () => void;
  hireId: number | null;
  defaultTo?: string;
  previewHtml: string; // exact email HTML, prepared before the modal opens
  draft?: DepositRefundDraft;
}

const parseEmails = (s: string) => s.split(/[;,\s]+/).map((e) => e.trim()).filter((e) => e.includes("@"));

interface RefundForm {
  subject: string;
  ref: string;
  hirer_name: string;
  registration: string;
  deposit: string;
  valeting_fee: string;
  vehicle_damages: string;
  additional_charges: string;
  excess_ppm: string;
  hire_charges_unpaid: string;
  adjusted_from_deposit: string;
  charges_due: string;
  total_deductions: string;
  refund_amount: string;
  bank: string;
  account_name: string;
  sort_code: string;
  account_number: string;
  hire_start: string;
  hire_end: string;
}

const moneyNumber = (value: string) => {
  const parsed = parseFloat(String(value || "").replace(/[^0-9.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
};

const cleanMoney = (value: string) => value.replace(/[^0-9.]/g, "");

const formFromDraft = (draft?: DepositRefundDraft): RefundForm => ({
  subject: "Request Refund Deposit",
  ref: draft?.ref || "",
  hirer_name: draft?.hirer_name || "",
  registration: draft?.registration || "",
  deposit: draft?.deposit_raw || "",
  valeting_fee: draft?.valeting_fee_raw || "0.00",
  vehicle_damages: draft?.vehicle_damages_raw || "0.00",
  additional_charges: draft?.additional_charges_raw || "0.00",
  excess_ppm: draft?.excess_ppm_raw || "0.00",
  hire_charges_unpaid: draft?.hire_charges_unpaid_raw || "0.00",
  adjusted_from_deposit: draft?.adjusted_from_deposit_raw || "0.00",
  charges_due: draft?.charges_due_raw || "0.00",
  total_deductions: draft?.total_deductions_raw || "0.00",
  refund_amount: draft?.refund_amount_raw || "0.00",
  bank: draft?.bank || "",
  account_name: draft?.account_name || "",
  sort_code: draft?.sort_code || "",
  account_number: draft?.account_number || "",
  hire_start: draft?.hire_start || "",
  hire_end: draft?.hire_end || "",
});

const recalcRefund = (current: RefundForm): RefundForm => {
  const chargesDue =
    moneyNumber(current.valeting_fee) +
    moneyNumber(current.vehicle_damages) +
    moneyNumber(current.additional_charges) +
    moneyNumber(current.excess_ppm) +
    moneyNumber(current.hire_charges_unpaid);
  const totalDeductions = chargesDue + moneyNumber(current.adjusted_from_deposit);
  const refund = Math.max(0, moneyNumber(current.deposit) - totalDeductions);
  return {
    ...current,
    charges_due: chargesDue.toFixed(2),
    total_deductions: totalDeductions.toFixed(2),
    refund_amount: refund.toFixed(2),
  };
};

// Editable preview values; the backend renders the actual structured email.
const FleetDepositRefundModal: React.FC<Props> = ({ open, onClose, hireId, defaultTo = "", previewHtml, draft }) => {
  const [recipients, setRecipients] = useState<string[]>(parseEmails(defaultTo));
  const [toInput, setToInput] = useState("");
  const [cc, setCc] = useState("");
  const [showCc, setShowCc] = useState(false);
  const [sending, setSending] = useState(false);
  const [form, setForm] = useState<RefundForm>(formFromDraft(draft));

  const openedRef = useRef(false);
  useEffect(() => {
    if (open && !openedRef.current) {
      openedRef.current = true;
      setRecipients(parseEmails(defaultTo));
      setToInput("");
      setCc("");
      setShowCc(false);
      setSending(false);
      setForm(formFromDraft(draft));
    } else if (!open) {
      openedRef.current = false;
    }
  }, [open, defaultTo, draft]);

  if (!open) return null;

  const commitToInput = () => {
    const parts = parseEmails(toInput);
    if (parts.length) setRecipients((prev) => [...prev, ...parts.filter((e) => !prev.includes(e))]);
    setToInput("");
  };
  const removeRecipient = (i: number) => setRecipients((prev) => prev.filter((_, idx) => idx !== i));
  const onToKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === "," || e.key === ";") {
      e.preventDefault();
      commitToInput();
    } else if (e.key === "Backspace" && !toInput && recipients.length) {
      setRecipients((prev) => prev.slice(0, -1));
    }
  };
  const setField = (key: keyof RefundForm, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
  };
  const setMoneyField = (key: keyof RefundForm, value: string) => {
    const cleaned = cleanMoney(value);
    setForm((current) => recalcRefund({ ...current, [key]: cleaned }));
  };

  const handleSend = async () => {
    const all = [...recipients, ...parseEmails(toInput)];
    if (all.length === 0) {
      toast.warn("Please add at least one recipient email address.");
      return;
    }
    if (!hireId) {
      toast.error("Save the hire before sending an email.");
      return;
    }
    setSending(true);
    try {
      const res = await sendDepositRefund(hireId, {
        to: all.join(", "),
        cc: cc.trim() || undefined,
        subject: form.subject,
        ref: form.ref,
        hirer_name: form.hirer_name,
        registration: form.registration,
        deposit: form.deposit,
        valeting_fee: form.valeting_fee,
        vehicle_damages: form.vehicle_damages,
        additional_charges: form.additional_charges,
        excess_ppm: form.excess_ppm,
        hire_charges_unpaid: form.hire_charges_unpaid,
        adjusted_from_deposit: form.adjusted_from_deposit,
        charges_due: form.charges_due,
        total_deductions: form.total_deductions,
        refund_amount: form.refund_amount,
        bank: form.bank,
        account_name: form.account_name,
        sort_code: form.sort_code,
        account_number: form.account_number,
        hire_start: form.hire_start,
        hire_end: form.hire_end,
      });
      if (res.status === "sent") {
        toast.success("Deposit refund request sent.");
        onClose();
      } else if (res.status === "skipped") {
        toast.info("Email service isn't configured on this environment.");
        onClose();
      } else {
        toast.error(res.detail || "Failed to send email.");
      }
    } catch (err) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      toast.error(detail || "Failed to send email.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[140] bg-black/40 flex items-center justify-center p-4 font-sans-headline">
      <div className="w-[680px] max-w-full h-[88vh] bg-white rounded-lg flex flex-col overflow-hidden">
        <div className="px-6 py-4 flex justify-between items-center border-b border-neutral-100 shrink-0">
          <h2 className="text-neutral-900 text-xl font-semibold leading-5">Request Refund Deposit</h2>
          <button type="button" onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-neutral-100 text-neutral-500 text-xl leading-none">×</button>
        </div>

        {/* Editable To + Cc (fixed) */}
        <div className="px-6 pt-5 flex flex-col gap-4 shrink-0">
          <div className="flex items-end gap-3">
            <div className="flex-1 flex flex-col gap-2 min-w-0">
              <span className="text-neutral-700 text-sm font-medium">To</span>
              <div className="min-h-[52px] px-3 py-2 bg-white rounded outline outline-1 -outline-offset-1 outline-neutral-200 focus-within:outline-neutral-900 flex flex-wrap items-center gap-2">
                {recipients.map((r, i) => (
                  <span key={`${r}-${i}`} className="flex items-center gap-1 pl-3 pr-1.5 py-1 bg-neutral-100 rounded-full text-neutral-800 text-sm max-w-full">
                    <span className="truncate">{r}</span>
                    <button type="button" onClick={() => removeRecipient(i)} className="text-neutral-400 hover:text-red-500 text-base leading-none shrink-0">×</button>
                  </span>
                ))}
                <input
                  type="text"
                  inputMode="email"
                  value={toInput}
                  onChange={(e) => setToInput(e.target.value)}
                  onKeyDown={onToKey}
                  onBlur={commitToInput}
                  placeholder={recipients.length ? "" : "recipient@example.com"}
                  className="flex-1 min-w-[140px] bg-transparent outline-none text-base text-neutral-900 placeholder:text-neutral-300 py-1"
                />
              </div>
            </div>
            <button type="button" onClick={() => setShowCc((s) => !s)} className="h-[52px] px-3 text-neutral-900 text-sm font-medium underline underline-offset-2 shrink-0">
              {showCc ? "Hide Cc" : "Add Cc"}
            </button>
          </div>
          {showCc && <FleetTextInput label="Cc" placeholder="cc@example.com" inputMode="email" value={cc} onChange={setCc} />}
        </div>

        <div className="px-6 pb-4 pt-2 flex-1 min-h-0 overflow-y-auto">
          <div className="flex flex-col gap-4">
            <FleetTextInput label="Subject" value={form.subject} onChange={(v) => setField("subject", v)} />

            <div className="p-4 rounded-lg outline outline-1 -outline-offset-1 outline-neutral-100 flex flex-col gap-4">
              <h3 className="text-neutral-900 text-base font-semibold">Email Values</h3>
              <div className="grid grid-cols-2 gap-4">
                <FleetTextInput label="Fleet Reference" value={form.ref} onChange={(v) => setField("ref", v)} />
                <FleetTextInput label="Hirer Name" value={form.hirer_name} onChange={(v) => setField("hirer_name", v)} />
              </div>
              <FleetTextInput label="Hire Vehicle Registration" value={form.registration} onChange={(v) => setField("registration", v)} />
            </div>

            <div className="p-4 rounded-lg outline outline-1 -outline-offset-1 outline-neutral-100 flex flex-col gap-4">
              <h3 className="text-neutral-900 text-base font-semibold">Refund Breakdown</h3>
              <div className="grid grid-cols-2 gap-4">
                <FleetTextInput label="Deposit Amount" inputMode="decimal" value={form.deposit} onChange={(v) => setMoneyField("deposit", v)} />
                <FleetTextInput label="Valeting Fee" inputMode="decimal" value={form.valeting_fee} onChange={(v) => setMoneyField("valeting_fee", v)} />
                <FleetTextInput label="Vehicle Damages" inputMode="decimal" value={form.vehicle_damages} onChange={(v) => setMoneyField("vehicle_damages", v)} />
                <FleetTextInput label="Additional Charges" inputMode="decimal" value={form.additional_charges} onChange={(v) => setMoneyField("additional_charges", v)} />
                <FleetTextInput label="Excess PPM Charges" inputMode="decimal" value={form.excess_ppm} onChange={(v) => setMoneyField("excess_ppm", v)} />
                <FleetTextInput label="Hire Charges Unpaid" inputMode="decimal" value={form.hire_charges_unpaid} onChange={(v) => setMoneyField("hire_charges_unpaid", v)} />
                <FleetTextInput label="Adjusted From Deposit" inputMode="decimal" value={form.adjusted_from_deposit} onChange={(v) => setMoneyField("adjusted_from_deposit", v)} />
                <FleetTextInput label="Final Charges Due" inputMode="decimal" value={form.charges_due} onChange={(v) => setField("charges_due", cleanMoney(v))} />
                <FleetTextInput label="Total Deductions" inputMode="decimal" value={form.total_deductions} onChange={(v) => setField("total_deductions", cleanMoney(v))} />
                <FleetTextInput label="Refund Amount" inputMode="decimal" value={form.refund_amount} onChange={(v) => setField("refund_amount", cleanMoney(v))} />
              </div>
            </div>

            <div className="p-4 rounded-lg outline outline-1 -outline-offset-1 outline-neutral-100 flex flex-col gap-4">
              <h3 className="text-neutral-900 text-base font-semibold">Bank Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <FleetTextInput label="Bank" value={form.bank} onChange={(v) => setField("bank", v)} />
                <FleetTextInput label="Account Name" value={form.account_name} onChange={(v) => setField("account_name", v)} />
                <FleetTextInput label="Sort Code" value={form.sort_code} onChange={(v) => setField("sort_code", v)} />
                <FleetTextInput label="Account Number" value={form.account_number} onChange={(v) => setField("account_number", v)} />
              </div>
            </div>

            <div className="p-4 rounded-lg outline outline-1 -outline-offset-1 outline-neutral-100 flex flex-col gap-4">
              <h3 className="text-neutral-900 text-base font-semibold">Hire Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <FleetTextInput label="Hire Start Date" value={form.hire_start} onChange={(v) => setField("hire_start", v)} />
                <FleetTextInput label="Hire End Date" value={form.hire_end} onChange={(v) => setField("hire_end", v)} />
              </div>
            </div>

            {previewHtml && (
              <p className="text-neutral-500 text-xs">
                The sent email will use the standard formatted deposit-refund template with these values.
              </p>
            )}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-neutral-100 flex justify-end items-center gap-3 shrink-0">
          <button type="button" onClick={onClose} disabled={sending} className="px-6 py-3 rounded bg-white text-neutral-900 text-base font-medium outline outline-1 -outline-offset-1 outline-neutral-900 hover:bg-neutral-50 disabled:opacity-50">Discard</button>
          <button type="button" onClick={handleSend} disabled={sending} className="px-6 py-3 rounded bg-neutral-900 text-white text-base font-medium hover:bg-black disabled:opacity-70 disabled:cursor-not-allowed">
            {sending ? "Sending…" : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FleetDepositRefundModal;
