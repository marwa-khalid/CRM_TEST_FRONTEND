import React, { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import Upload from "../../../assets/AutoClaim_icon/Upload.svg";
import Complete from "../../../assets/AutoClaim_icon/Complete.svg";
import Processing from "../../../assets/AutoClaim_icon/Processing.svg";

interface DriverDocumentUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  acceptedText?: string;
  onFileSelect: (file: File) => Promise<void>;
}

export const DriverDocumentUploadModal: React.FC<
  DriverDocumentUploadModalProps
> = ({
  isOpen,
  onClose,
  title,
  acceptedText = "JPG, PNG, PDF Supported",
  onFileSelect,
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) {
      setStep(1);
      setSelectedFile(null);
      setError("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const formatSize = (bytes: number) => {
    if (!bytes) return "0 KB";
    return `${Math.round(bytes / 1024)} KB`;
  };

  const handleInternalFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setError("");
      setSelectedFile(file);
      setStep(2);

      await onFileSelect(file);

      setStep(3);

      setTimeout(() => {
        onClose();
      }, 900);
    } catch (err) {
      console.error(err);
      setStep(1);
      setError("Upload failed. Please try again.");
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-[200] p-4">
      <div className="w-[600px] p-6 bg-white rounded-lg flex flex-col gap-6 animate-in zoom-in-95">
        <div className="self-stretch flex justify-between items-center">
          <div className="text-neutral-900 text-[20px] font-weight-600 font-['Stack_Sans_Headline']">
            {title}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="h-px bg-gray-100 w-full" />

        <div
          onClick={() => step === 1 && fileInputRef.current?.click()}
          className={`self-stretch p-10 relative rounded-lg border-2 border-dashed flex flex-col justify-center items-center gap-6 transition-colors ${
            step === 1
              ? "border-gray-200 cursor-pointer hover:bg-blue-50"
              : "border-blue-100 bg-white"
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleInternalFileChange}
            className="hidden"
            accept=".jpg,.jpeg,.png,.pdf"
          />

          {step === 3 ? (
            <img src={Complete} alt="complete" />
          ) : step === 2 ? (
            <img
              src={Processing}
              alt="processing"
              className="w-16 h-16 animate-spin [animation-duration:2s]"
            />
          ) : (
            <img src={Upload} alt="upload" />
          )}

          <div className="flex flex-col items-center gap-2 text-center">
            <div className="text-black text-base font-weight-600 font-['Stack_Sans_Headline']">
              {step === 1 && "Choose a file or Drag & Drop here"}
              {step === 2 && "Uploading document..."}
              {step === 3 && "Upload complete"}
            </div>

            <div className="text-gray-500 text-sm font-normal font-['Stack_Sans_Headline'] break-all">
              {step === 1 ? acceptedText : selectedFile?.name}
            </div>

            {selectedFile && (
              <div className="text-xs text-gray-400 font-['Stack_Sans_Headline']">
                {formatSize(selectedFile.size)}
              </div>
            )}

            {error && (
              <div className="text-sm text-red-500 font-['Stack_Sans_Headline']">
                {error}
              </div>
            )}
          </div>

          {(step === 2 || step === 3) && (
            <div className="w-full max-w-[484px] h-3 bg-blue-50 rounded-full relative overflow-hidden">
              <div
                className={`absolute left-0 top-0 h-full rounded-full transition-all duration-300 ${
                  step === 3
                    ? "bg-green-500 w-full"
                    : "bg-blue-500 w-full animate-pulse"
                }`}
              />
            </div>
          )}
        </div>

        <div className="self-stretch flex justify-end items-center gap-4">
          <button
            type="button"
            onClick={onClose}
            disabled={step === 2}
            className={`px-6 py-4 border border-blue-600 rounded text-base font-medium transition-colors ${
              step === 2
                ? "bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed"
                : "bg-white text-blue-600 hover:bg-blue-50"
            }`}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
