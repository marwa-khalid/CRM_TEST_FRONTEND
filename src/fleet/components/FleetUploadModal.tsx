import React, { useRef, useState } from "react";
import { Eye } from "lucide-react";
import { fileTypeIcon } from "../utils/fileIcon";
import { formatUploadedAt, type FleetDoc } from "./FleetDocumentList";

interface Props {
  open: boolean;
  onClose: () => void;
  // May be async — the modal stays open (showing progress) until it resolves, and
  // shows an error (staying open) if it rejects. Parent handles preview + OCR.
  onUploaded: (file: File) => void | Promise<void>;
  title?: string;
  accept?: string;
  // Previously-uploaded files, shown as a history list inside the modal.
  history?: FleetDoc[];
  onView?: (docId: number) => void;
}

const UploadIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-10 h-10 text-neutral-400" aria-hidden>
    <path d="M12 15V4m0 0 4 4m-4-4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const fmtSize = (bytes: number) => (bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(0)}KB` : `${(bytes / (1024 * 1024)).toFixed(1)}MB`);

// Claims-style upload flow (choose -> uploading -> done) in the black/grey Fleet
// theme. Crucially, it waits for the parent's real upload to finish before it
// closes, so the file/toast are already there when the modal disappears.
const FleetUploadModal: React.FC<Props> = ({
  open, onClose, onUploaded, title = "Upload Driving License", accept = ".jpg,.jpeg,.png,.pdf",
  history, onView,
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1); // 1 choose · 2 uploading · 3 done
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  if (!open) return null;

  const reset = () => {
    setStep(1);
    setProgress(0);
    setFile(null);
    setError("");
  };
  const close = () => {
    reset();
    onClose();
  };

  // The OCR gives no real progress events, so the percentage eases toward 95% —
  // fast at first, then adding less each tick so it keeps climbing without
  // stalling on one number — and snaps to 100% when the upload actually resolves.
  const handleFile = async (f: File) => {
    setFile(f);
    setError("");
    setStep(2);
    setProgress(0);
    const timer = setInterval(() => {
      setProgress((p) => (p >= 95 ? 95 : Math.min(95, p + Math.max(1, Math.round((95 - p) * 0.08)))));
    }, 220);
    try {
      await Promise.resolve(onUploaded(f));
      clearInterval(timer);
      setProgress(100);
      setStep(3);
      setTimeout(close, 600);
    } catch (e) {
      clearInterval(timer);
      setProgress(0);
      setStep(1);
      setError(e instanceof Error && e.message ? e.message : "Upload failed. Please try again.");
    }
  };

  const busy = step === 2;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/40 p-4 font-sans-headline">
      <div className="w-[600px] max-w-full p-6 bg-white rounded-lg flex flex-col gap-6">
        <div className="flex justify-between items-center">
          <div className="text-neutral-900 text-xl font-semibold">{title}</div>
          <button
            type="button"
            onClick={close}
            disabled={busy}
            className="text-neutral-400 hover:text-neutral-700 text-xl leading-none disabled:opacity-40 disabled:cursor-not-allowed"
          >
            ×
          </button>
        </div>
        <div className="h-px bg-neutral-100" />

        <div
          onClick={() => step === 1 && inputRef.current?.click()}
          className={`p-10 rounded-lg border-2 border-dashed border-neutral-200 flex flex-col items-center justify-center gap-4 transition-colors ${
            step === 1 ? "cursor-pointer hover:bg-neutral-50" : "bg-white"
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              e.target.value = ""; // allow re-selecting the same file after an error
              if (f) handleFile(f);
            }}
          />
          {step === 3 ? (
            <span className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
              <span className="w-3 h-1.5 border-l-2 border-b-2 border-white -rotate-45 -translate-y-[1px]" />
            </span>
          ) : step === 2 ? (
            <span className="w-10 h-10 rounded-full border-[3px] border-neutral-200 border-t-neutral-900 animate-spin" aria-hidden />
          ) : (
            <UploadIcon />
          )}
          <div className="flex flex-col items-center gap-1 text-center">
            <div className="text-black text-base font-semibold">
              {step === 1 && "Choose file or Drag & Drop here"}
              {step === 2 && `Uploading — ${progress}%`}
              {step === 3 && "Upload complete"}
            </div>
            <div className="text-neutral-500 text-sm">
              {step === 1 ? "JPG, PNG, PDF Supported" : file ? `${file.name} · ${fmtSize(file.size)}` : ""}
            </div>
            {error && <div className="text-red-500 text-sm">{error}</div>}
          </div>

          {(step === 2 || step === 3) && (
            <div className="w-full max-w-[420px] h-2 bg-neutral-100 rounded-full overflow-hidden">
              <div className="h-full bg-neutral-900 rounded-full transition-all duration-200" style={{ width: `${progress}%` }} />
            </div>
          )}
        </div>

        {/* Previously Uploaded — hidden for now at the user's request. Kept here so
            it can be switched back on in a few days; do not delete.
        {history && history.length > 0 && (
          <div className="flex flex-col gap-2">
            <div className="text-neutral-700 text-sm font-medium">Previously Uploaded ({history.length})</div>
            <div className="max-h-[190px] overflow-y-auto flex flex-col gap-2 pr-1">
              {history.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center gap-3 px-3 py-2 rounded outline outline-1 -outline-offset-1 outline-neutral-200 bg-white"
                >
                  <img src={fileTypeIcon(doc.filename)} alt="" className="w-6 h-6 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-neutral-900 text-sm truncate">{doc.filename || "Document"}</div>
                    <div className="text-neutral-500 text-xs">Uploaded {formatUploadedAt(doc.created_at)}</div>
                  </div>
                  {onView && (
                    <button
                      type="button"
                      onClick={() => onView(doc.id)}
                      title="View file"
                      className="shrink-0 w-8 h-8 flex items-center justify-center rounded hover:bg-neutral-100 text-neutral-700"
                    >
                      <Eye size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        */}

        <div className="flex justify-end">
          <button
            type="button"
            onClick={close}
            disabled={busy}
            className="px-6 py-3 bg-white rounded outline outline-1 -outline-offset-1 outline-black text-neutral-900 text-base font-medium hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default FleetUploadModal;
