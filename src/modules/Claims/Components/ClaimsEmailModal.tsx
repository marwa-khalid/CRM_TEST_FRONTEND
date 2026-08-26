import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export interface ClaimsEmailAttachment {
  name: string;
  content_b64?: string;
  content_type?: string;
}

interface ClaimsEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  /** Rendered email HTML (full document). Shown in an isolated, editable iframe. */
  html: string;
  subject?: string;
  to?: string;
  /** Predetermined attachments (display-only; the caller already sends these). */
  attachments?: ClaimsEmailAttachment[];
  /** When true, the user can attach extra files; they come back in onSend's 5th arg. */
  allowAttach?: boolean;
  /** Hide the To field (e.g. a reply that always goes back to the sender). */
  hideTo?: boolean;
  sendLabel?: string;
  sending?: boolean;
  /** Called with the (possibly edited) HTML + recipients + subject + cc + any
   *  user-added files on Send. */
  onSend: (editedHtml: string, to: string, subject: string, cc: string, files: File[]) => void | Promise<void>;
}

// Split "a@x.com; b@y.com" into individual addresses.
const parseEmails = (s: string) =>
  (s || "").split(/[;,\s]+/).map((e) => e.trim()).filter((e) => e.includes("@"));

// Flatten the edited iframe HTML to plain text — for send endpoints that take a
// plain-text message and HTML-escape it themselves (payment pack, documents,
// Graph reply/forward comment). Block boundaries and <br> become newlines.
export const htmlToPlainText = (html: string): string => {
  const doc = new DOMParser().parseFromString(html || "", "text/html");
  doc.querySelectorAll("br").forEach((br) => br.replaceWith("\n"));
  doc.querySelectorAll("div, p, tr, li").forEach((el) => el.append("\n"));
  return (doc.body.textContent || "").replace(/\n{3,}/g, "\n\n").trim();
};

// Regions hidden in the browser preview but restored verbatim on send, so the
// sent email is never changed: the cid: logo (shows as a broken image in the
// browser) and the "Nationwide Assist Ltd / T:" sign-off footer.
const HIDE_PATTERNS: RegExp[] = [
  /<img[^>]*src=["']cid:[^"']*["'][^>]*>/i,
  /<tr>(?:(?!<\/tr>)[\s\S])*?Nationwide Assist Ltd[\s\S]*?<\/tr>/i,
];

// Outlook brand mark (matches the Fleet modal header).
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

const DocIcon = () => (
  <svg viewBox="0 0 24 24" className="w-8 h-8" aria-hidden>
    <path d="M6 2h8l4 4v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Z" fill="#2c60f1" opacity="0.12" />
    <path d="M6 2h8l4 4v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Z" stroke="#2c60f1" strokeWidth="1.3" fill="none" />
    <path d="M14 2v4h4" stroke="#2c60f1" strokeWidth="1.3" fill="none" />
    <path d="M8 13h8M8 16h6" stroke="#2c60f1" strokeWidth="1.3" strokeLinecap="round" />
  </svg>
);

/**
 * Editable email-preview modal for the Claims side — mirrors the Fleet email
 * modal design in a blue theme. Recipients are pills, Cc is optional, and the
 * subject + body are editable. The body renders in a sandboxed, editable iframe
 * so the real email layout shows (WYSIWYG). The server template is never changed
 * — only this one send uses the edited copy; the cid: logo + sign-off footer are
 * hidden in the preview and restored on send.
 */
export const ClaimsEmailModal = ({
  isOpen,
  onClose,
  title = "Send Email",
  html,
  subject,
  to,
  attachments = [],
  allowAttach = false,
  hideTo = false,
  sendLabel,
  sending = false,
  onSend,
}: ClaimsEmailModalProps) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [recipients, setRecipients] = useState<string[]>([]);
  const [toInput, setToInput] = useState("");
  const [cc, setCc] = useState("");
  const [showCc, setShowCc] = useState(false);
  const [subjectValue, setSubjectValue] = useState("");
  const [addedFiles, setAddedFiles] = useState<File[]>([]);

  // Swap each hidden region for a marker for display; keep the originals so we
  // can restore them on send (the sent email is unchanged).
  const hiddenRegions: { marker: string; original: string }[] = [];
  let displayHtml = html;
  HIDE_PATTERNS.forEach((re, i) => {
    const m = displayHtml.match(re);
    if (m) {
      const marker = `<!--PH${i}-->`;
      hiddenRegions.push({ marker, original: m[0] });
      displayHtml = displayHtml.replace(re, marker);
    }
  });

  useEffect(() => {
    if (isOpen) {
      setRecipients(parseEmails(String(to || "")));
      setToInput("");
      setCc("");
      setShowCc(false);
      setSubjectValue(String(subject || ""));
      setAddedFiles([]);
    }
  }, [isOpen, to, subject]);

  // Push fresh HTML into the iframe whenever it changes, then make the whole
  // document editable (designMode is more reliable than body.contentEditable).
  useEffect(() => {
    if (!isOpen) return;
    const iframe = iframeRef.current;
    if (!iframe) return;
    const doc = iframe.contentDocument;
    if (!doc) return;
    doc.open();
    doc.write(displayHtml || "");
    doc.close();
    try { doc.designMode = "on"; } catch { /* ignore */ }
  }, [isOpen, displayHtml]);

  if (!isOpen) return null;

  // Read the edited HTML back and restore every hidden region (marker → original).
  const readEditedHtml = (): string => {
    let edited = iframeRef.current?.contentDocument?.documentElement?.outerHTML || displayHtml || "";
    hiddenRegions.forEach(({ marker, original }) => {
      edited = edited.replace(marker, () => original);
    });
    return edited;
  };

  // --- Recipient pills ---
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

  // --- Attachments: open the base64 content in a new tab ---
  const openAttachment = (att: ClaimsEmailAttachment) => {
    if (!att.content_b64) return;
    try {
      const bin = atob(att.content_b64);
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      const url = URL.createObjectURL(
        new Blob([bytes], { type: att.content_type || "application/octet-stream" }),
      );
      window.open(url, "_blank");
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch {
      /* ignore malformed content */
    }
  };

  const handleSend = () => {
    const all = [...recipients, ...parseEmails(toInput)];
    onSend(readEditedHtml(), all.join(", "), subjectValue, cc.trim(), addedFiles);
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 p-4 font-['Stack_Sans_Headline']">
      <div className="w-[640px] max-w-full max-h-[92vh] bg-white rounded-lg flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="px-6 py-4 flex justify-between items-center border-b border-neutral-100">
          <div className="flex items-center gap-3 min-w-0">
            <OutlookIcon />
            <h2 className="text-neutral-900 text-xl font-semibold leading-7 truncate">{title}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-neutral-100 text-neutral-500 text-xl leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="p-6 flex flex-col gap-4 overflow-y-auto">
          {/* To (pills) + Add Cc */}
          {!hideTo && (
          <div className="flex items-end gap-3">
            <div className="flex-1 flex flex-col gap-2 min-w-0">
              <span className="text-neutral-700 text-sm font-medium">To</span>
              <div className="min-h-[52px] px-3 py-2 bg-white rounded border border-neutral-200 focus-within:border-blue-500 flex flex-wrap items-center gap-2">
                {recipients.map((r, i) => (
                  <span
                    key={`${r}-${i}`}
                    className="flex items-center gap-1 pl-3 pr-1.5 py-1 bg-blue-50 rounded-full text-blue-700 text-sm max-w-full"
                  >
                    <span className="truncate">{r}</span>
                    <button
                      type="button"
                      onClick={() => removeRecipient(i)}
                      className="text-blue-400 hover:text-red-500 text-base leading-none shrink-0"
                      aria-label={`Remove ${r}`}
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
              className="h-[52px] px-3 text-blue-600 text-sm font-medium underline underline-offset-2 shrink-0"
            >
              {showCc ? "Hide Cc" : "Add Cc"}
            </button>
          </div>
          )}

          {showCc && (
            <div className="flex flex-col gap-2">
              <span className="text-neutral-700 text-sm font-medium">Cc</span>
              <input
                type="text"
                inputMode="email"
                value={cc}
                onChange={(e) => setCc(e.target.value)}
                placeholder="cc@example.com"
                className="h-[52px] px-5 bg-white rounded border border-neutral-200 outline-none text-base text-neutral-900 placeholder:text-neutral-300 focus:border-blue-500"
              />
            </div>
          )}

          {/* Subject */}
          <div className="flex flex-col gap-2">
            <span className="text-neutral-700 text-sm font-medium">Subject</span>
            <input
              type="text"
              value={subjectValue}
              onChange={(e) => setSubjectValue(e.target.value)}
              placeholder="Enter subject"
              className="h-[52px] px-5 bg-white rounded border border-neutral-200 outline-none text-base text-neutral-900 placeholder:text-neutral-300 focus:border-blue-500"
            />
          </div>

          {/* Message (editable, isolated iframe) */}
          <div className="flex flex-col gap-2">
            <span className="text-neutral-700 text-sm font-medium">Message</span>
            <iframe
              ref={iframeRef}
              title="Email preview"
              className="w-full h-[300px] rounded border border-neutral-200 bg-white focus-within:border-blue-500"
            />
          </div>

          {/* Attachments — click to open in a new tab */}
          {attachments.length > 0 && (
            <div className="flex flex-col gap-2">
              <span className="text-neutral-700 text-sm font-medium">
                {attachments.length} attachment{attachments.length !== 1 ? "s" : ""}
              </span>
              {attachments.map((a) => (
                <button
                  key={a.name}
                  type="button"
                  onClick={() => openAttachment(a)}
                  disabled={!a.content_b64}
                  title={a.content_b64 ? "Open in new tab" : a.name}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg bg-blue-50/60 hover:bg-blue-50 text-left disabled:cursor-default"
                >
                  <DocIcon />
                  <div className="min-w-0 flex flex-col">
                    <span className="text-neutral-800 text-sm font-medium truncate">{a.name}</span>
                    <span className="text-blue-600 text-xs">
                      {a.content_b64 ? "Open in new tab" : "Attached"}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* User-added file attachments */}
          {allowAttach && (
            <div className="flex flex-col gap-2">
              {addedFiles.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {addedFiles.map((f, i) => (
                    <span key={`${f.name}-${i}`} className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-sm">
                      <span className="max-w-[180px] truncate">{f.name}</span>
                      <button
                        type="button"
                        onClick={() => setAddedFiles((prev) => prev.filter((_, idx) => idx !== i))}
                        className="text-blue-400 hover:text-red-500 leading-none"
                        aria-label={`Remove ${f.name}`}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-2 text-blue-600 text-sm font-medium w-fit"
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                </svg>
                Attach files
              </button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={(e) => {
                  const picked = Array.from(e.target.files || []);
                  if (picked.length) setAddedFiles((prev) => [...prev, ...picked]);
                  e.target.value = "";
                }}
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-neutral-100 flex justify-end items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={sending}
            className="px-6 py-3 rounded bg-white text-blue-600 text-base font-medium outline outline-1 -outline-offset-1 outline-blue-600 hover:bg-blue-50 disabled:opacity-50"
          >
            Discard
          </button>
          <button
            type="button"
            onClick={handleSend}
            disabled={sending}
            className="px-6 py-3 rounded bg-blue-600 text-white text-base font-medium hover:bg-blue-700 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {sending ? "Sending…" : (sendLabel || "Send")}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default ClaimsEmailModal;
