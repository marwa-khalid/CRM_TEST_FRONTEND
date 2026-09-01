import { useState } from "react";
import type { FleetHistoryRecord } from "../services/fleetHistory";

// Lean Reply / Forward composer for the Fleet History email records. Self-contained
// (no Claims imports) so the Fleet slice stays independently extractable.
const stripPrefix = (s: string) => (s || "").replace(/^(?:\s*(re|fw|fwd)\s*:\s*)+/i, "").trim();

const FleetEmailModal = ({
  mode, record, sending, onClose, onSend,
}: {
  mode: "reply" | "forward";
  record: FleetHistoryRecord;
  sending: boolean;
  onClose: () => void;
  onSend: (to: string, subject: string, comment: string, files: File[]) => void;
}) => {
  const base = stripPrefix(record.subject || "");
  const [to, setTo] = useState(mode === "forward" ? "" : (record.correspondent || ""));
  const [subject, setSubject] = useState((mode === "reply" ? "Re: " : "Fwd: ") + base);
  const [body, setBody] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const input = "w-full px-4 py-3 rounded border border-neutral-200 text-sm text-neutral-800 outline-none focus:border-neutral-500 placeholder:text-neutral-300";

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4">
      <div className="w-[640px] max-w-full bg-white rounded-lg shadow-xl flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-neutral-800">{mode === "reply" ? "Reply" : "Forward"}</h2>
          <button type="button" onClick={onClose} className="text-neutral-400 hover:text-neutral-700 text-2xl leading-none">×</button>
        </div>
        <div className="p-6 flex flex-col gap-4 overflow-y-auto">
          <label className="flex flex-col gap-1.5">
            <span className="text-neutral-700 text-sm font-medium">To</span>
            <input value={to} onChange={(e) => setTo(e.target.value)} placeholder="recipient@email.com" className={input} />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-neutral-700 text-sm font-medium">Subject</span>
            <input value={subject} onChange={(e) => setSubject(e.target.value)} className={input} />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-neutral-700 text-sm font-medium">Message</span>
            <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={8} placeholder="Write your message…" className={`${input} resize-none`} />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-neutral-700 text-sm font-medium">Attachments</span>
            <input type="file" multiple onChange={(e) => setFiles(Array.from(e.target.files || []))} className="text-sm text-neutral-600" />
          </label>
        </div>
        <div className="px-6 py-4 border-t border-neutral-200 flex items-center justify-end gap-3">
          <button type="button" onClick={onClose} className="px-5 py-2 text-sm text-neutral-600 hover:bg-neutral-100 rounded">Cancel</button>
          <button type="button" disabled={sending || !to.trim()} onClick={() => onSend(to.trim(), subject.trim(), body, files)}
            className="px-6 py-2 bg-neutral-900 hover:bg-black disabled:opacity-60 text-white rounded text-sm">
            {sending ? "Sending…" : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FleetEmailModal;
