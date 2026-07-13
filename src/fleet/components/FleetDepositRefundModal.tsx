import React, { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { FleetTextInput } from "./fields";
import { sendDepositRefund } from "../services/emailService";

interface Props {
  open: boolean;
  onClose: () => void;
  hireId: number | null;
  defaultTo?: string;
  previewHtml: string; // exact email HTML, prepared before the modal opens
}

const parseEmails = (s: string) => s.split(/[;,\s]+/).map((e) => e.trim()).filter((e) => e.includes("@"));

// Read-only preview of the exact email that will be sent; only To + Cc are editable.
const FleetDepositRefundModal: React.FC<Props> = ({ open, onClose, hireId, defaultTo = "", previewHtml }) => {
  const [recipients, setRecipients] = useState<string[]>(parseEmails(defaultTo));
  const [toInput, setToInput] = useState("");
  const [cc, setCc] = useState("");
  const [showCc, setShowCc] = useState(false);
  const [sending, setSending] = useState(false);

  const openedRef = useRef(false);
  useEffect(() => {
    if (open && !openedRef.current) {
      openedRef.current = true;
      setRecipients(parseEmails(defaultTo));
      setToInput("");
      setCc("");
      setShowCc(false);
      setSending(false);
    } else if (!open) {
      openedRef.current = false;
    }
  }, [open, defaultTo]);

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
      const res = await sendDepositRefund(hireId, { to: all.join(", "), cc: cc.trim() || undefined });
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
              <div className="min-h-[52px] px-3 py-2 bg-white rounded-sm outline outline-1 -outline-offset-1 outline-neutral-200 focus-within:outline-neutral-900 flex flex-wrap items-center gap-2">
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
          <span className="text-neutral-700 text-sm font-medium">Preview</span>
        </div>

        {/* The email preview fills the rest and is the ONLY scroll area */}
        <div className="px-6 pb-4 pt-2 flex-1 min-h-0">
          <iframe
            title="Deposit refund email preview"
            srcDoc={previewHtml}
            className="w-full h-full rounded-sm outline outline-1 -outline-offset-1 outline-neutral-200 bg-white"
          />
        </div>

        <div className="px-6 py-4 border-t border-neutral-100 flex justify-end items-center gap-3 shrink-0">
          <button type="button" onClick={onClose} disabled={sending} className="px-6 py-3 rounded-sm bg-white text-neutral-900 text-base font-medium outline outline-1 -outline-offset-1 outline-neutral-900 hover:bg-neutral-50 disabled:opacity-50">Discard</button>
          <button type="button" onClick={handleSend} disabled={sending} className="px-6 py-3 rounded-sm bg-neutral-900 text-white text-base font-medium hover:bg-black disabled:opacity-70 disabled:cursor-not-allowed">
            {sending ? "Sending…" : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FleetDepositRefundModal;
