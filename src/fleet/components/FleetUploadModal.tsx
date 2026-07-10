import React, { useRef, useState } from "react";

interface Props {
  open: boolean;
  onClose: () => void;
  onUploaded: (file: File) => void; // parent handles preview + OCR extraction
  title?: string;
  accept?: string;
}

const UploadIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-10 h-10 text-neutral-400" aria-hidden>
    <path d="M12 15V4m0 0 4 4m-4-4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const fmtSize = (bytes: number) => (bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(0)}KB` : `${(bytes / (1024 * 1024)).toFixed(1)}MB`);

// Claims-style upload flow (choose -> progress -> done) in the black/grey Fleet theme.
const FleetUploadModal: React.FC<Props> = ({
  open, onClose, onUploaded, title = "Upload Driving License", accept = ".jpg,.jpeg,.png,.pdf",
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  if (!open) return null;

  const reset = () => {
    setStep(1);
    setProgress(0);
    setFile(null);
  };
  const close = () => {
    reset();
    onClose();
  };

  const handleFile = (f: File) => {
    setFile(f);
    setStep(2);
    let p = 0;
    const timer = setInterval(() => {
      p += 12;
      setProgress(Math.min(p, 100));
      if (p >= 100) {
        clearInterval(timer);
        setStep(3);
        setTimeout(() => {
          onUploaded(f);
          close();
        }, 700);
      }
    }, 100);
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/40 p-4 font-sans-headline">
      <div className="w-[600px] max-w-full p-6 bg-white rounded-lg flex flex-col gap-6">
        <div className="flex justify-between items-center">
          <div className="text-neutral-900 text-xl font-semibold">{title}</div>
          <button type="button" onClick={close} className="text-neutral-400 hover:text-neutral-700 text-xl leading-none">×</button>
        </div>
        <div className="h-px bg-neutral-100" />

        <div
          onClick={() => step === 1 && inputRef.current?.click()}
          className={`p-10 rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-4 transition-colors ${
            step === 1 ? "border-neutral-200 cursor-pointer hover:bg-neutral-50" : "border-neutral-200 bg-white"
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
          />
          {step === 3 ? (
            <span className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
              <span className="w-3 h-1.5 border-l-2 border-b-2 border-white -rotate-45 -translate-y-[1px]" />
            </span>
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
          </div>

          {(step === 2 || step === 3) && (
            <div className="w-full max-w-[420px] h-2 bg-neutral-100 rounded-full overflow-hidden">
              <div className="h-full bg-neutral-900 rounded-full transition-all duration-200" style={{ width: `${progress}%` }} />
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={close}
            className="px-6 py-3 bg-white rounded-sm outline outline-1 -outline-offset-1 outline-black text-neutral-900 text-base font-medium hover:bg-neutral-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default FleetUploadModal;
