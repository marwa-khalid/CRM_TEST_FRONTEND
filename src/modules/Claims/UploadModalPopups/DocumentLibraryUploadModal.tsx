import React, { useRef, useState } from "react";
import { X } from "lucide-react";
import { toast } from "react-toastify";
import Complete from "../../../assets/AutoClaim_icon/Complete.svg";
import Upload from "../../../assets/AutoClaim_icon/Upload.svg";
import Processing from "../../../assets/AutoClaim_icon/Processing.svg";
import { uploadLibraryDocument } from "../../../services/DocumentLibrary/DocumentLibrary";

interface DocumentLibraryUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: () => void | Promise<void>;
  claimId: string | number | null;
  category: string;
  tag?: string;
  sourceType?: string;
}

const DocumentLibraryUploadModal: React.FC<DocumentLibraryUploadModalProps> = ({
  isOpen,
  onClose,
  onUploadSuccess,
  claimId,
  category,
  tag = "Manual Upload",
  sourceType = "user_upload",
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const resetModal = () => {
    setStep(1);
    setFile(null);
    setProgress(0);
    setIsUploading(false);
    setIsDragging(false);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleClose = () => {
    if (isUploading) return;
    resetModal();
    onClose();
  };

  const formatSize = (bytes: number) => {
    if (!bytes) return "0KB";

    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(0)}KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(2)}MB`;
  };

  const executeActualUpload = async (selectedFile: File) => {
    if (!claimId) {
      toast.error("Claim ID is missing.");
      resetModal();
      return;
    }

    try {
      const formData = new FormData();

      formData.append("claim_id", String(claimId));
      formData.append("category", category || "User Uploads");
      formData.append("tag", tag);
      formData.append("source_type", sourceType);
      formData.append("file", selectedFile);

      await uploadLibraryDocument(formData);

      setProgress(100);
      setStep(3);
      setIsUploading(false);

      toast.success("Document uploaded successfully.");

      await onUploadSuccess();

      setTimeout(() => {
        resetModal();
        onClose();
      }, 900);
    } catch (error) {
      console.error("Document upload failed:", error);
      toast.error("Upload failed.");

      resetModal();
    }
  };

  const simulateUpload = (selectedFile: File) => {
    let currentProgress = 0;

    setIsUploading(true);
    setStep(2);
    setProgress(0);

    const interval = setInterval(() => {
      currentProgress += 5;
      setProgress(currentProgress);

      if (currentProgress >= 90) {
        clearInterval(interval);
        executeActualUpload(selectedFile);
      }
    }, 120);
  };

  const handleSelectedFile = (selectedFile?: File) => {
    if (!selectedFile) return;

    setFile(selectedFile);
    simulateUpload(selectedFile);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleSelectedFile(e.target.files?.[0]);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (isUploading || step !== 1) return;

    setIsDragging(false);
    handleSelectedFile(e.dataTransfer.files?.[0]);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-[100] p-4 font-['Stack_Sans_Headline']">
      <div className="w-[600px] p-6 bg-white rounded-lg flex flex-col gap-6 animate-in zoom-in-95">
        <div className="self-stretch flex justify-between items-center">
          <div className="text-neutral-900 text-[20px] font-weight-600">
            Upload Document
          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={isUploading}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="h-px bg-gray-100 w-full" />

        <div
          onClick={() => step === 1 && fileInputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            if (!isUploading && step === 1) setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`self-stretch p-10 relative rounded-lg border-2 border-dashed flex flex-col justify-center items-center gap-6 transition-colors
            ${
              step === 1
                ? isDragging
                  ? "border-blue-400 bg-blue-50 cursor-pointer"
                  : "border-gray-200 cursor-pointer hover:bg-blue-50"
                : "border-blue-100 bg-white"
            }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept=".jpg,.jpeg,.png,.webp,.svg,.pdf,.csv"
          />

          {step === 3 ? (
            <img src={Complete} alt="" />
          ) : step === 2 ? (
            <img
              src={Processing}
              alt=""
              className="animate-[spin_2s_linear_infinite]"
            />
          ) : (
            <img src={Upload} alt="" />
          )}

          <div className="flex flex-col items-center gap-2">
            <div className="text-black text-base font-weight-600">
              {step === 1 && "Choose a file or Drag & Drop here"}

              {step === 2 &&
                `Uploaded - ${formatSize(
                  (file?.size || 0) * (progress / 100),
                )} of ${formatSize(file?.size || 0)}`}

              {step === 3 &&
                `Uploaded - ${formatSize(file?.size || 0)} of ${formatSize(
                  file?.size || 0,
                )}`}
            </div>

            <div className="text-gray-500 text-sm font-normal">
              {step === 1
                ? "JPG, PNG, SVG, WEBP, PDF, CSV Supported"
                : file?.name}
            </div>
          </div>

          {(step === 2 || step === 3) && (
            <div className="w-full max-w-[484px] h-3 bg-blue-50 rounded-full relative overflow-hidden">
              <div
                className="absolute left-0 top-0 h-full bg-blue-500 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </div>

        <div className="self-stretch flex justify-end items-center gap-4">
          <button
            type="button"
            onClick={handleClose}
            disabled={isUploading}
            className="px-6 py-4 bg-white border border-blue-600 rounded text-blue-600 text-base font-medium transition-colors hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default DocumentLibraryUploadModal;
