import React, { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { MessageCircle } from "lucide-react";
import { FleetTextInput } from "./fields";
import FleetSpinnerLoader from "./FleetSpinnerLoader";

export interface FleetWhatsAppModalPayload {
  correspondent: string;
  phrase: string;
  reference: string;
  mobile: string;
  historyDetails: string;
  message: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  title?: string;
  correspondent?: string;
  mobile?: string;
  reference?: string;
  defaultMessage?: string;
  defaultHistoryDetails?: string;
  onSend?: (payload: FleetWhatsAppModalPayload) => Promise<void> | void;
}

const DIVIDER = <div className="h-px bg-neutral-100" />;

// Textarea that grows to fit its content — no inner scrollbar, height follows the text.
const AutoGrowTextarea: React.FC<{
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}> = ({ value, onChange, placeholder, className = "" }) => {
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto"; // reset so shrinking works too
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);
  return (
    <textarea
      ref={ref}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={1}
      className={`resize-none overflow-hidden ${className}`}
    />
  );
};

const FleetWhatsAppModal: React.FC<Props> = ({
  open,
  onClose,
  title = "Send WhatsApp",
  correspondent = "",
  mobile = "",
  reference = "",
  defaultMessage = "",
  defaultHistoryDetails = "",
  onSend,
}) => {
  const [name, setName] = useState(correspondent);
  const [ref, setRef] = useState(reference);
  const [phone, setPhone] = useState(mobile);
  const [historyDetails, setHistoryDetails] = useState(defaultHistoryDetails);
  const [sending, setSending] = useState(false);

  const openedRef = useRef(false);
  useEffect(() => {
    if (open && !openedRef.current) {
      openedRef.current = true;
      setName(correspondent);
      setRef(reference);
      setPhone(mobile);
      setHistoryDetails(defaultHistoryDetails || defaultMessage);
      setSending(false);
    } else if (!open) {
      openedRef.current = false;
    }
  }, [open, correspondent, mobile, reference, defaultMessage, defaultHistoryDetails]);

  if (!open) return null;

  const finalMessage = historyDetails.trim();

  const handleSend = async () => {
    if (!phone.trim()) {
      toast.warn("Please enter a mobile number.");
      return;
    }
    if (!finalMessage) {
      toast.warn("Please enter a WhatsApp message.");
      return;
    }
    if (!onSend) {
      toast.info("WhatsApp isn't configured on this screen yet.");
      return;
    }
    setSending(true);
    try {
      await onSend({
        correspondent: name,
        phrase: finalMessage,
        reference: ref,
        mobile: phone,
        historyDetails,
        message: finalMessage,
      });
      toast.success("WhatsApp message sent.");
      onClose();
    } catch (err) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      toast.error(detail || "Failed to send WhatsApp message.");
    } finally {
      setSending(false);
    }
  };

  const textArea = (label: string, val: string, onChange: (v: string) => void) => (
    <div className="flex flex-col gap-2">
      <span className="text-neutral-700 text-sm font-medium">{label}</span>
      <AutoGrowTextarea
        value={val}
        onChange={onChange}
        className="px-5 py-4 bg-white rounded outline outline-1 -outline-offset-1 outline-neutral-200 text-base text-neutral-900 placeholder:text-neutral-300 focus:outline-neutral-900"
      />
    </div>
  );

  return (
    <div className="fixed inset-0 z-[140] bg-black/40 flex items-center justify-center p-4 font-sans-headline">
      {sending && <FleetSpinnerLoader />}
      <div className="w-[720px] max-w-full max-h-[90vh] bg-white rounded-lg flex flex-col overflow-hidden">
        {/* Sticky header with Send / Close */}
        <div className="px-6 py-4 flex justify-between items-center border-b border-neutral-100 shadow-sm shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <MessageCircle size={22} className="shrink-0 text-green-600" />
            <div className="flex flex-col gap-1 min-w-0">
              <h2 className="text-neutral-900 text-xl font-semibold leading-7 truncate">{title}</h2>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={sending}
              onClick={handleSend}
              className="px-8 py-3 rounded bg-neutral-900 text-white text-base font-medium hover:bg-black disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {sending ? "Sending..." : "Send"}
            </button>
            <button
              type="button"
              disabled={sending}
              onClick={onClose}
              className="px-8 py-3 rounded bg-white text-neutral-900 text-base font-medium outline outline-1 -outline-offset-1 outline-neutral-900 hover:bg-neutral-50 disabled:opacity-50"
            >
              Close
            </button>
          </div>
        </div>

        <div className="p-6 flex flex-col gap-4 overflow-y-auto">
          <FleetTextInput label="Correspondent" placeholder="Enter name" value={name} onChange={setName} />

          <div className="grid grid-cols-2 gap-5">
            <FleetTextInput label="Correspondent Ref." placeholder="Reference" value={ref} onChange={setRef} />
            <FleetTextInput label="Mobile" placeholder="Enter mobile" inputMode="tel" value={phone} onChange={setPhone} />
          </div>

          {DIVIDER}
          {textArea("WhatsApp Message", historyDetails, setHistoryDetails)}
        </div>
      </div>
    </div>
  );
};

export default FleetWhatsAppModal;
