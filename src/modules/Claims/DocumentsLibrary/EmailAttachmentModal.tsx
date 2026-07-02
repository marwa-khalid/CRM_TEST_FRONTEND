import React, { useState } from "react";
import { X, Mail, Paperclip, Loader2 } from "lucide-react";
import { toast } from "react-toastify";
import { sendDocumentLibraryEmail } from "../../../services/DocumentLibrary/DocumentLibrary";

interface Photo {
  id: string | number;
  file_url: string;
  file_name: string;
  s3_key?: string;
}

interface Props {
  attachments: Photo[];
  onClose: () => void;
  onRemoveAttachment: (id: string | number) => void;
}

const EmailAttachmentModal: React.FC<Props> = ({
  attachments,
  onClose,
  onRemoveAttachment,
}) => {
  const [to, setTo] = useState("");
  const [cc, setCc] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [showCc, setShowCc] = useState(false);
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!to.trim()) {
      toast.warn("Please enter a recipient email address.");
      return;
    }
    const files = attachments
      .map((a) => ({
        s3_key: a.s3_key || String(a.id),
        file_name: a.file_name,
      }))
      .filter((a) => a.s3_key);
    if (files.length === 0) {
      toast.warn("No attachments selected to send.");
      return;
    }
    try {
      setSending(true);
      await sendDocumentLibraryEmail({
        to,
        cc,
        subject,
        body,
        attachments: files,
      });
      toast.success("Email sent.");
      onClose();
    } catch (err: any) {
      toast.error(
        err?.response?.data?.detail || "Failed to send email. Please try again.",
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[200] flex items-center justify-center p-4 font-['Stack_Sans_Headline']">
      <div className="w-[680px] bg-white rounded shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 flex justify-between items-center border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <Mail className="w-5 h-5 text-blue-500" />
            <h2 className="text-neutral-900 text-lg font-weight-600">
              Compose Email
            </h2>
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
          {/* To */}
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

          {/* Cc (optional) */}
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

          {/* Subject */}
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

          {/* Body */}
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

        {/* Attachments strip */}
        <div className="px-6 py-3 border-t border-gray-100 bg-gray-50">
          <div className="flex items-center gap-2 mb-2">
            <Paperclip className="w-4 h-4 text-gray-400" />
            <span className="text-xs text-gray-500 font-weight-500">
              {attachments.length} attachment{attachments.length !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="flex gap-3 flex-wrap">
            {attachments.map((photo) => (
              <div key={photo.id} className="relative group">
                <img
                  src={photo.file_url}
                  alt={photo.file_name}
                  className="w-16 h-16 object-cover rounded-lg border border-gray-200 shadow-sm"
                />
                <button
                  onClick={() => onRemoveAttachment(photo.id)}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-gray-700 text-white rounded-full flex items-center justify-center text-[11px] leading-none opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                >
                  ×
                </button>
                <div className="mt-1 max-w-[64px] text-[10px] text-gray-400 truncate text-center">
                  {photo.file_name}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex justify-between items-center bg-gray-50">
          <span className="text-xs text-gray-400">
            {attachments.length} / 5 attachments
          </span>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={sending}
              className="px-5 py-2.5 border border-gray-200 rounded text-sm text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-50"
            >
              Discard
            </button>
            <button
              onClick={handleSend}
              disabled={sending}
              className="px-6 py-2.5 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 transition-colors flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {sending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Sending…
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4" />
                  Send
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailAttachmentModal;
