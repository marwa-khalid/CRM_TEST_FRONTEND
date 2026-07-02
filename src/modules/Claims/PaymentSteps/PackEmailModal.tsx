import { useState } from "react";
import { X, Mail, Paperclip, FileText } from "lucide-react";
import { toast } from "react-toastify";
import { sendPaymentPackEmail } from "../../../services/ABIBHRCharges/ABIBHRCharges";

// Outlook-style "Compose Email" popup for the Payment Pack screens.

export type PackEmailAttachment = { url: string; name: string; blob: Blob };

const PackEmailModal = ({
  claimId,
  subject: initialSubject = "",
  attachment,
  onClose,
  onSent,
}: {
  claimId?: string | number;
  subject?: string;
  attachment: PackEmailAttachment;
  onClose: () => void;
  onSent?: (sentDate?: string) => void;
}) => {
  const [to, setTo] = useState("");
  const [cc, setCc] = useState("");
  const [subject, setSubject] = useState(initialSubject);
  const [body, setBody] = useState("");
  const [showCc, setShowCc] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const handleSend = async () => {
    if (isSending) return;
    if (!to.trim()) {
      toast.warn("Please enter a recipient email address.");
      return;
    }
    if (!claimId) {
      toast.error("Claim id is missing for this payment pack email.");
      return;
    }

    const payload = new FormData();
    payload.append("to_email", to.trim());
    payload.append("cc_email", cc.trim());
    payload.append("subject", subject.trim());
    payload.append("body", body);
    payload.append("document_name", attachment.name);
    payload.append(
      "attachment",
      new File([attachment.blob], attachment.name, { type: "application/pdf" }),
    );

    try {
      setIsSending(true);
      const response = await sendPaymentPackEmail(claimId, payload);
      toast.success("Payment pack email sent.");
      onSent?.(response.data?.payment_pack_sent_date);
      onClose();
    } catch (error: any) {
      toast.error(
        error?.response?.data?.detail || "Failed to send payment pack email.",
      );
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[210] flex items-center justify-center p-4 font-['Stack_Sans_Headline']">
      <div className="w-[680px] bg-white rounded shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 flex justify-between items-center border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <Mail className="w-5 h-5 text-blue-500" />
            <h2 className="text-neutral-900 text-lg font-weight-600">Compose Email</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Form fields */}
        <div className="flex flex-col divide-y divide-gray-100">
          <div className="px-6 py-3 flex items-center gap-3">
            <span className="text-sm text-gray-400 w-14 shrink-0">To</span>
            <input
              type="email"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="recipient@example.com"
              className="flex-1 text-sm text-neutral-700 font-light outline-none placeholder:text-gray-300"
            />
            <button
              onClick={() => setShowCc(!showCc)}
              className="text-xs text-blue-500 hover:underline shrink-0"
            >
              {showCc ? "Hide Cc" : "Cc"}
            </button>
          </div>

          {showCc && (
            <div className="px-6 py-3 flex items-center gap-3">
              <span className="text-sm text-gray-400 w-14 shrink-0">Cc</span>
              <input
                type="email"
                value={cc}
                onChange={(e) => setCc(e.target.value)}
                placeholder="cc@example.com"
                className="flex-1 text-sm text-neutral-700 font-light outline-none placeholder:text-gray-300"
              />
            </div>
          )}

          <div className="px-6 py-3 flex items-center gap-3">
            <span className="text-sm text-gray-400 w-14 shrink-0">Subject</span>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Enter subject…"
              className="flex-1 text-sm text-neutral-700 font-light outline-none placeholder:text-gray-300"
            />
          </div>

          <div className="px-6 py-3">
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write your message here…"
              rows={6}
              className="w-full text-sm text-neutral-700 font-light outline-none placeholder:text-gray-300 resize-none"
            />
          </div>
        </div>

        {/* Attachment strip — generated PDF */}
        <div className="px-6 py-3 border-t border-gray-100 bg-gray-50">
          <div className="flex items-center gap-2 mb-2">
            <Paperclip className="w-4 h-4 text-gray-400" />
            <span className="text-xs text-gray-500 font-weight-500">1 attachment</span>
          </div>
          <a
            href={attachment.url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2.5 px-3 py-2 bg-white border border-gray-200 rounded-lg shadow-sm hover:border-blue-300 transition-colors max-w-full"
          >
            <span className="w-9 h-9 rounded-md bg-red-50 flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4 text-red-500" />
            </span>
            <span className="min-w-0">
              <span className="block text-xs text-neutral-700 font-weight-500 truncate">
                {attachment.name}
              </span>
              <span className="block text-[10px] text-gray-400 uppercase tracking-wide">PDF</span>
            </span>
          </a>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end items-center gap-3 bg-gray-50">
          <button
            onClick={onClose}
            className="px-5 py-2.5 border border-gray-200 rounded text-sm text-gray-600 hover:bg-gray-100 transition-colors"
          >
            Discard
          </button>
          <button
            onClick={handleSend}
            disabled={isSending}
            className="px-6 py-2.5 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <Mail className="w-4 h-4" />
            {isSending ? "Sending..." : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PackEmailModal;
