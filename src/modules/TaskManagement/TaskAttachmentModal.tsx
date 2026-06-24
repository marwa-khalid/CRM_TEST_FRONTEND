import React, { useRef, useState } from "react";
import { X } from "lucide-react";
import { toast } from "react-toastify";
import { uploadTaskFile } from "../../services/Tasks/Tasks";
import Complete from "../../assets/AutoClaim_icon/Complete.svg";
import Upload from "../../assets/AutoClaim_icon/Upload.svg";
import Processing from "../../assets/AutoClaim_icon/Processing.svg";
import PDF from "../../assets/FileTypes/PDF.svg";
import PNG from "../../assets/FileTypes/PNG.svg";
import CSV from "../../assets/FileTypes/CSV.svg";
import DOC from "../../assets/FileTypes/DOC.svg";
import PPT from "../../assets/FileTypes/PPT.svg";
import Excel from "../../assets/FileTypes/Excel.svg";

// Map a file name / path to one of the available file-type logos (used by the
// drawer to show the attached file after upload).
export const fileLogo = (nameOrPath?: string | null): string => {
  const ext = (nameOrPath || "").split(".").pop()?.toLowerCase() || "";
  if (["xls", "xlsx"].includes(ext)) return Excel;
  if (ext === "csv") return CSV;
  if (["doc", "docx"].includes(ext)) return DOC;
  if (["ppt", "pptx"].includes(ext)) return PPT;
  if (["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(ext)) return PNG;
  return PDF; // pdf + everything else
};

export type UploadedFile = { path: string; filename: string };

type Row = {
  file: File;
  status: "uploading" | "done" | "error";
  path?: string;
  filename?: string;
};

const formatSize = (bytes: number) => (bytes / 1024).toFixed(0) + "KB";

const TaskAttachmentModal = ({
  onClose, onUploaded,
}: {
  onClose: () => void;
  // Called once with every successfully-uploaded file when the batch finishes.
  onUploaded: (files: UploadedFile[]) => void;
}) => {
  // Single-file flow keeps the original KB progress view.
  const [single, setSingle] = useState<{ file: File; progress: number; step: 2 | 3 } | null>(null);
  // Multi-file flow shows a per-file list.
  const [rows, setRows] = useState<Row[]>([]);
  const [busy, setBusy] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── single file: simulate progress to 90%, then upload (original behaviour) ──
  const startSingle = (file: File) => {
    setBusy(true);
    setSingle({ file, progress: 0, step: 2 });
    let p = 0;
    const interval = setInterval(() => {
      p += 5;
      setSingle((s) => (s ? { ...s, progress: Math.min(p, 90) } : s));
      if (p >= 90) {
        clearInterval(interval);
        (async () => {
          try {
            const { data } = await uploadTaskFile(file);
            setSingle((s) => (s ? { ...s, progress: 100, step: 3 } : s));
            toast.success("File uploaded successfully");
            const item: UploadedFile = { path: data.path, filename: data.filename || file.name };
            setTimeout(() => { onUploaded([item]); onClose(); }, 1200);
          } catch {
            toast.error("Upload failed");
            setSingle(null);
            setBusy(false);
          }
        })();
      }
    }, 120);
  };

  // ── many files: upload sequentially, showing each file's status in a list ──
  const startMulti = async (files: File[]) => {
    setBusy(true);
    const startIndex = rows.length;
    setRows((r) => [...r, ...files.map((f) => ({ file: f, status: "uploading" as const }))]);

    const succeeded: UploadedFile[] = [];
    for (let i = 0; i < files.length; i++) {
      const idx = startIndex + i;
      try {
        const { data } = await uploadTaskFile(files[i]);
        const item: UploadedFile = { path: data.path, filename: data.filename || files[i].name };
        succeeded.push(item);
        setRows((r) => r.map((row, j) => (j === idx ? { ...row, status: "done", ...item } : row)));
      } catch {
        setRows((r) => r.map((row, j) => (j === idx ? { ...row, status: "error" } : row)));
      }
    }

    setBusy(false);
    if (succeeded.length) {
      toast.success(`${succeeded.length} file${succeeded.length === 1 ? "" : "s"} uploaded successfully`);
      setTimeout(() => { onUploaded(succeeded); onClose(); }, 900);
    } else {
      toast.error("Upload failed");
    }
  };

  const startUpload = (files: File[]) => {
    if (!files.length || busy) return;
    if (files.length === 1 && rows.length === 0) startSingle(files[0]);
    else startMulti(files);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    e.target.value = ""; // allow re-selecting the same file
    if (files.length) startUpload(files);
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files || []);
    if (files.length) startUpload(files);
  };

  const empty = !single && rows.length === 0;
  const multiAllDone = !busy && rows.length > 0 && rows.every((r) => r.status === "done");
  const doneCount = rows.filter((r) => r.status === "done").length;
  // Cumulative KB uploaded across the batch (done files), for the overall readout.
  const totalBytes = rows.reduce((s, r) => s + (r.file.size || 0), 0);
  const doneBytes = rows.filter((r) => r.status === "done").reduce((s, r) => s + (r.file.size || 0), 0);
  const multiPct = totalBytes ? Math.round((doneBytes / totalBytes) * 100) : 0;

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-[200] p-4 font-['Stack_Sans_Headline']">
      <div className="w-[600px] max-h-[90vh] p-6 bg-white rounded-lg flex flex-col gap-6">
        {/* Header */}
        <div className="self-stretch flex justify-between items-center">
          <div className="text-neutral-900 text-[20px] font-weight-600 font-['Stack_Sans_Headline']">
            Upload Attachment
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="h-px bg-gray-100 w-full" />

        {/* Drop zone */}
        <div
          onClick={() => !busy && fileInputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          className={`self-stretch p-10 relative rounded-lg border-2 border-dashed flex flex-col justify-center items-center gap-6 transition-colors
            ${empty ? "border-gray-200 cursor-pointer hover:bg-blue-50" : "border-blue-100"} ${busy ? "" : "cursor-pointer"}`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            multiple
            className="hidden"
            accept=".jpg,.jpeg,.png,.pdf,.csv,.xls,.xlsx,.doc,.docx,.ppt,.pptx"
          />

          {/* Icon */}
          {single?.step === 3 || multiAllDone ? (
            <img src={Complete} />
          ) : busy ? (
            <img src={Processing} className="animate-[spin_2s_linear_infinite]" />
          ) : (
            <img src={Upload} />
          )}

          {/* Text + (single-file) progress */}
          <div className="flex flex-col items-center gap-2 w-full">
            <div className="text-black text-base font-weight-600 font-['Stack_Sans_Headline']">
              {empty && "Choose a file or Drag & Drop here"}
              {single && single.step === 2 &&
                `Uploading - ${formatSize((single.file.size || 0) * (single.progress / 100))} of ${formatSize(single.file.size || 0)}`}
              {single && single.step === 3 &&
                `Uploaded - ${formatSize(single.file.size || 0)} of ${formatSize(single.file.size || 0)}`}
              {!single && rows.length > 0 && busy &&
                `Uploading ${doneCount + 1} of ${rows.length} — ${formatSize(doneBytes)} of ${formatSize(totalBytes)}`}
              {!single && multiAllDone &&
                `Uploaded ${doneCount} file${doneCount === 1 ? "" : "s"} — ${formatSize(totalBytes)}`}
            </div>
            <div className="text-gray-500 text-sm font-normal font-['Stack_Sans_Headline']">
              {empty ? "JPG, PNG, PDF, CSV, Excel, Word, PPT Supported — select multiple at once"
                : single ? single.file.name
                : "Click to add more files"}
            </div>

            {/* Progress bar — single uses simulated %, multi uses KB completed. */}
            {(single || rows.length > 0) && (
              <div className="w-full max-w-[484px] mt-2 h-3 bg-blue-50 rounded-full relative overflow-hidden">
                <div
                  className="absolute left-0 top-0 h-full bg-blue-500 rounded-full transition-all duration-300"
                  style={{ width: `${single ? single.progress : multiPct}%` }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Selected files list — only for multiple files */}
        {rows.length > 0 && (
          <div className="self-stretch flex flex-col gap-2 overflow-auto" style={{ maxHeight: 220 }}>
            {rows.map((r, i) => (
              <div key={i} className="p-3 rounded-lg outline outline-1 outline-offset-[-1px] outline-neutral-200 flex items-center gap-3">
                <img src={fileLogo(r.file.name)} alt="" className="w-9 h-9" />
                <div className="flex-1 min-w-0">
                  <div className="text-black text-sm font-weight-500 line-clamp-1">{r.file.name}</div>
                  <div className="text-gray-400 text-xs">{formatSize(r.file.size)}</div>
                </div>
                {r.status === "uploading" && (
                  <img src={Processing} className="w-5 h-5 animate-[spin_2s_linear_infinite]" />
                )}
                {r.status === "done" && <img src={Complete} className="w-5 h-5" />}
                {r.status === "error" && <span className="text-red-500 text-xs font-weight-600">Failed</span>}
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="self-stretch flex justify-end items-center gap-4">
          <button
            onClick={onClose}
            className="px-6 py-4 bg-white border border-blue-600 rounded text-blue-600 text-base font-medium transition-colors hover:bg-blue-50"
          >
            {single?.step === 3 || multiAllDone ? "Done" : "Cancel"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskAttachmentModal;
