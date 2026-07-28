import React, { useRef, useState } from "react";
import { toast } from "react-toastify";
import { FleetTextInput } from "./fields";
import FleetSpinnerLoader from "./FleetSpinnerLoader";
import { sendHireEmail, type SendHireEmailResult } from "../services/emailService";
import PdfIcon from "../assets/FileTypes/PDF.svg";
import DocIcon from "../assets/FileTypes/DOC.svg";
import ExcelIcon from "../assets/FileTypes/Excel.svg";
import PngIcon from "../assets/FileTypes/PNG.svg";

export interface FleetEmailSendArgs {
  to: string;
  cc?: string;
  subject: string;
  body: string;
  files: File[];
}

interface Props {
  open: boolean;
  onClose: () => void;
  hireId: number | null;
  title?: string;
  defaultTo?: string; // prefilled (editable) recipient(s)
  defaultSubject?: string;
  defaultBody?: string;
  // Files already in context (e.g. a generated document) shown pre-attached.
  initialFiles?: File[];
  onSent?: () => void | Promise<void>;
  previewHtml?: string;
  sendOverride?: (args: FleetEmailSendArgs) => Promise<SendHireEmailResult>;
}

const PaperclipIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" aria-hidden>
    <path d="M21 12.5 12.5 21a4.5 4.5 0 0 1-6.4-6.4l8-8a3 3 0 0 1 4.3 4.3l-8 8a1.5 1.5 0 0 1-2.2-2.1l7.3-7.3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const OutlookIcon = ({ className = "w-7 h-7" }: { className?: string }) => (
  <svg viewBox="0 0 32 32" className={className} aria-hidden>
    <rect x="12" y="6" width="16" height="20" rx="2.4" fill="#0A64AD" />
    <rect x="14" y="8" width="12" height="7" rx="1.2" fill="#28A8EA" />
    <rect x="14" y="17" width="12" height="7" rx="1.2" fill="#0078D4" />
    <path d="M12 12.2h17.2v12.6c0 .66-.54 1.2-1.2 1.2H12V12.2Z" fill="#0A64AD" />
    <path d="m12.2 13.1 7.9 5.2 8.9-6.1v12.5c0 .72-.58 1.3-1.3 1.3H13.5c-.72 0-1.3-.58-1.3-1.3V13.1Z" fill="#50D9FF" />
    <path d="m12.2 25.1 6.9-6.2 2.1 1.4 7.6-7.7v12.1c0 .72-.58 1.3-1.3 1.3H13.5c-.52 0-.98-.31-1.18-.76l-.12-.14Z" fill="#0078D4" />
    <rect x="3" y="9" width="14" height="14" rx="2" fill="#0078D4" />
    <path d="M6.2 16c0-3.02 1.64-5.02 4.04-5.02 2.38 0 3.94 1.95 3.94 4.9 0 3.05-1.61 5.14-4.03 5.14-2.38 0-3.95-2-3.95-5.02Zm2.1-.04c0 2.03.72 3.26 1.9 3.26 1.17 0 1.88-1.21 1.88-3.25 0-2-.72-3.18-1.9-3.18-1.15 0-1.88 1.2-1.88 3.17Z" fill="white" />
  </svg>
);

// Split a "a@x.com; b@y.com" string into individual addresses.
const parseEmails = (s: string) => s.split(/[;,\s]+/).map((e) => e.trim()).filter((e) => e.includes("@"));

const attachmentIcon = (name: string, type = "") => {
  const lower = name.toLowerCase();
  if (type.includes("pdf") || lower.endsWith(".pdf")) return PdfIcon;
  if (lower.endsWith(".xls") || lower.endsWith(".xlsx") || lower.endsWith(".csv")) return ExcelIcon;
  if (lower.endsWith(".doc") || lower.endsWith(".docx")) return DocIcon;
  return PngIcon;
};

const FleetEmailModal: React.FC<Props> = ({
  open,
  onClose,
  hireId,
  title = "Send Email",
  defaultTo = "",
  defaultSubject = "",
  defaultBody = "",
  initialFiles = [],
  onSent,
  previewHtml = "",
  sendOverride,
}) => {
  const [recipients, setRecipients] = useState<string[]>(parseEmails(defaultTo));
  const [toInput, setToInput] = useState("");
  const [cc, setCc] = useState("");
  const [showCc, setShowCc] = useState(false);
  const [subject, setSubject] = useState(defaultSubject);
  const [body, setBody] = useState(defaultBody);
  const [files, setFiles] = useState<File[]>(initialFiles);
  const [sending, setSending] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset the form each time the modal is (re)opened.
  const openedRef = useRef(false);
  React.useEffect(() => {
    if (open && !openedRef.current) {
      openedRef.current = true;
      setRecipients(parseEmails(defaultTo)); setToInput(""); setCc(""); setShowCc(false);
      setSubject(defaultSubject); setBody(defaultBody);
      setFiles(initialFiles); setSending(false);
    } else if (!open) {
      openedRef.current = false;
    }
  }, [open, defaultTo, defaultSubject, defaultBody, initialFiles]);

  if (!open) return null;

  const addFiles = (list: FileList | null) => {
    if (!list) return;
    setFiles((prev) => [...prev, ...Array.from(list)]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };
  const removeFile = (idx: number) => setFiles((prev) => prev.filter((_, i) => i !== idx));

  // Turn the typed text into recipient pill(s).
  const commitToInput = () => {
    const parts = parseEmails(toInput);
    if (parts.length) setRecipients((prev) => [...prev, ...parts.filter((e) => !prev.includes(e))]);
    setToInput("");
  };
  const removeRecipient = (idx: number) => setRecipients((prev) => prev.filter((_, i) => i !== idx));
  const onToKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === "," || e.key === ";") {
      e.preventDefault();
      commitToInput();
    } else if (e.key === "Backspace" && !toInput && recipients.length) {
      setRecipients((prev) => prev.slice(0, -1));
    }
  };

  const handleSend = async () => {
    const allRecipients = [...recipients, ...parseEmails(toInput)];
    if (allRecipients.length === 0) {
      toast.warn("Please add at least one recipient email address.");
      return;
    }
    if (!hireId && !sendOverride) {
      toast.error("Save the hire before sending an email.");
      return;
    }
    setSending(true);
    try {
      const payload = { to: allRecipients.join(", "), cc: cc.trim() || undefined, subject, body, files };
      const res = sendOverride ? await sendOverride(payload) : await sendHireEmail(hireId, payload);
      if (res.status === "sent") {
        toast.success("Email sent.");
        await onSent?.();
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
      {sending && <FleetSpinnerLoader />}
      <div className="w-[640px] max-w-full bg-white rounded-lg flex flex-col overflow-hidden">
        <div className="px-6 py-4 flex justify-between items-center border-b border-neutral-100">
          <div className="flex items-center gap-3 min-w-0">
            <OutlookIcon />
            <div className="flex flex-col gap-1 min-w-0">
              <h2 className="text-neutral-900 text-xl font-semibold leading-7 truncate">
                {title}
              </h2>
              {/* <span className="text-[#0078D4] text-xs font-medium">Outlook email preview</span> */}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-neutral-100 text-neutral-500 text-xl leading-none"
          >
            ×
          </button>
        </div>

        <div className="p-6 flex flex-col gap-4 max-h-[70vh] overflow-y-auto">
          <div className="flex items-end gap-3">
            <div className="flex-1 flex flex-col gap-2 min-w-0">
              <span className="text-neutral-700 text-sm font-medium">To</span>
              <div className="min-h-[52px] px-3 py-2 bg-white rounded outline outline-1 -outline-offset-1 outline-neutral-200 focus-within:outline-neutral-900 flex flex-wrap items-center gap-2">
                {recipients.map((r, i) => (
                  <span
                    key={`${r}-${i}`}
                    className="flex items-center gap-1 pl-3 pr-1.5 py-1 bg-neutral-100 rounded-full text-neutral-800 text-sm max-w-full"
                  >
                    <span className="truncate">{r}</span>
                    <button
                      type="button"
                      onClick={() => removeRecipient(i)}
                      className="text-neutral-400 hover:text-red-500 text-base leading-none shrink-0"
                    >
                      ×
                    </button>
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
            <button
              type="button"
              onClick={() => setShowCc((s) => !s)}
              className="h-[52px] px-3 text-neutral-900 text-sm font-medium underline underline-offset-2 shrink-0"
            >
              {showCc ? "Hide Cc" : "Add Cc"}
            </button>
          </div>
          {showCc && (
            <FleetTextInput
              label="Cc"
              placeholder="cc@example.com"
              inputMode="email"
              value={cc}
              onChange={setCc}
            />
          )}
          <FleetTextInput
            label="Subject"
            placeholder="Enter subject"
            value={subject}
            onChange={setSubject}
          />

          {previewHtml ? (
            <div className="flex flex-col gap-2">
              <span className="text-neutral-700 text-sm font-medium">
                Preview
              </span>
              <iframe
                title={`${title} preview`}
                srcDoc={previewHtml}
                className="w-full h-[360px] rounded outline outline-1 -outline-offset-1 outline-neutral-200 bg-white"
              />
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <span className="text-neutral-700 text-sm font-medium">
                Message
              </span>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Write your message here..."
                rows={6}
                className="px-5 py-4 bg-white rounded outline outline-1 -outline-offset-1 outline-neutral-200 text-base text-neutral-900 placeholder:text-neutral-300 focus:outline-neutral-900 resize-none"
              />
            </div>
          )}

          {/* Attachments */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              {/* <div className="flex items-center gap-2 text-neutral-700 text-sm font-medium">
                <PaperclipIcon />
                {files.length} attachment{files.length !== 1 ? "s" : ""}
              </div> */}
              {/* <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="h-8 px-3 py-2 bg-white rounded outline outline-1 -outline-offset-1 outline-neutral-900 text-neutral-900 text-sm hover:bg-neutral-50"
              >
                Add Attachment
              </button> */}
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={(e) => addFiles(e.target.files)}
              />
            </div>
            {files.length > 0 && (
              <div className="flex flex-col gap-2">
                {files.map((f, i) => (
                  <div
                    key={`${f.name}-${i}`}
                    className="flex items-center justify-between gap-3 px-3 py-2 rounded outline outline-1 -outline-offset-1 outline-neutral-200"
                  >
                    <div className="min-w-0 flex items-center gap-3">
                      <img src={attachmentIcon(f.name, f.type)} alt="" className="w-8 h-8 shrink-0" />
                      <span className="text-neutral-700 text-sm truncate">
                        {f.name}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(i)}
                      className="text-neutral-400 hover:text-red-500 text-lg leading-none shrink-0"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-neutral-100 flex justify-end items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={sending}
            className="px-6 py-3 rounded bg-white text-neutral-900 text-base font-medium outline outline-1 -outline-offset-1 outline-neutral-900 hover:bg-neutral-50 disabled:opacity-50"
          >
            Discard
          </button>
          <button
            type="button"
            onClick={handleSend}
            disabled={sending}
            className="px-6 py-3 rounded bg-neutral-900 text-white text-base font-medium hover:bg-neutral-600 disabled:opacity-70 disabled:cursor-not-allowed inline-flex items-center gap-2"
          >
            {/* <OutlookIcon className="w-5 h-5" /> */}
            {sending ? "Sending…" : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FleetEmailModal;
