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

// Map a file name / path to one of the available file-type logos (used by the
// drawer to show the attached file after upload).
export const fileLogo = (nameOrPath?: string | null): string => {
  const ext = (nameOrPath || "").split(".").pop()?.toLowerCase() || "";
  if (["csv", "xls", "xlsx"].includes(ext)) return CSV;
  if (["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(ext)) return PNG;
  return PDF; // pdf + everything else
};

const TaskAttachmentModal = ({
  onClose, onUploaded,
}: {
  onClose: () => void;
  onUploaded: (path: string, filename: string) => void;
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setStep(2);
      await simulateUpload(selectedFile);
    }
  };

  // Simulates the progress bar before the actual upload completes.
  const simulateUpload = async (selectedFile: File) => {
    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += 5;
      setProgress(currentProgress);
      if (currentProgress >= 90) {
        clearInterval(interval);
        executeActualUpload(selectedFile);
      }
    }, 120);
  };

  const executeActualUpload = async (selectedFile: File) => {
    try {
      const { data } = await uploadTaskFile(selectedFile);
      setProgress(100); // force complete
      setStep(3); // green state
      toast.success("File uploaded successfully");

      setTimeout(() => {
        onUploaded(data.path, data.filename || selectedFile.name);
        onClose();
        setStep(1);
        setProgress(0);
        setFile(null);
      }, 1500);
    } catch (error) {
      setStep(1);
      setProgress(0);
      toast.error("Upload failed");
    }
  };

  const formatSize = (bytes: number) => (bytes / 1024).toFixed(0) + "KB";

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-[200] p-4 font-['Stack_Sans_Headline']">
      <div className="w-[600px] p-6 bg-white rounded-lg flex flex-col gap-6">
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

        {/* Body Container */}
        <div
          onClick={() => step === 1 && fileInputRef.current?.click()}
          className={`self-stretch p-10 relative rounded-lg border-2 border-dashed flex flex-col justify-center items-center gap-6 transition-colors
            ${step === 1 ? "border-gray-200 cursor-pointer hover:bg-blue-50" : "border-blue-100 bg-white"}`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept=".jpg,.png,.pdf,.csv"
          />

          {/* Icon Mapping */}
          {step === 3 ? (
            <img src={Complete} />
          ) : step === 2 ? (
            <img src={Processing} className="animate-[spin_2s_linear_infinite]" />
          ) : (
            <img src={Upload} />
          )}

          {/* Text Content */}
          <div className="flex flex-col items-center gap-2">
            <div className="text-black text-base font-weight-600 font-['Stack_Sans_Headline']">
              {step === 1 && "Choose a file or Drag & Drop here"}
              {step === 2 &&
                `Uploading - ${formatSize((file?.size || 0) * (progress / 100))} of ${formatSize(file?.size || 0)}`}
              {step === 3 &&
                `Uploaded - ${formatSize(file?.size || 0)} of ${formatSize(file?.size || 0)}`}
            </div>
            <div className="text-gray-500 text-sm font-normal font-['Stack_Sans_Headline']">
              {step === 1 ? "JPG, PNG, PDF, CSV Supported" : file?.name}
            </div>
          </div>

          {/* Progress Bar (Steps 2 & 3) */}
          {(step === 2 || step === 3) && (
            <div className="w-full max-w-[484px] h-3 bg-blue-50 rounded-full relative overflow-hidden">
              <div
                className="absolute left-0 top-0 h-full bg-blue-500 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="self-stretch flex justify-end items-center gap-4">
          <button
            onClick={onClose}
            className="px-6 py-4 bg-white border border-blue-600 rounded text-blue-600 text-base font-medium transition-colors hover:bg-blue-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskAttachmentModal;
