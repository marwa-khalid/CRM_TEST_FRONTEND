import React, { useState, useRef } from "react";
import { toast } from "react-toastify";
import { uploadVCDocs } from "../../../services/VehicleOwner/vehicleOwner";
import Complete from "../../../assets/AutoClaim_icon/Complete.svg"
import Upload from "../../../assets/AutoClaim_icon/Upload.svg";
import Processing from "../../../assets/AutoClaim_icon/Processing.svg";
import PdfTypeIcon from "../../../assets/FileTypes/PDF.svg";
import ImgTypeIcon from "../../../assets/FileTypes/PNG.svg";
import { X } from "lucide-react";


interface V5CModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: (jobId: string) => void;
  claimId: string;
  formik:any
}

export const V5CUploadModalOwner: React.FC<V5CModalProps> = ({
  isOpen,
  onClose,
  onUploadSuccess,
  claimId,
  formik,
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  // Single PDF or several images (2–3) — the OCR merges them into one result.
  const [files, setFiles] = useState<File[]>([]);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  if (!isOpen) return null;

  const totalSize = files.reduce((sum, f) => sum + f.size, 0);
  const displayName = files.length === 1 ? files[0].name : `${files.length} files selected`;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length) {
      setFiles(selectedFiles);
      setStep(2);
      await simulateUpload(selectedFiles);
    }
  };

  // This simulates the UI progress bar before calling your actual handleUpload logic
const simulateUpload = async (selectedFiles: File[]) => {
  let currentProgress = 0;
  setIsUploading(true);

  const interval = setInterval(() => {
    currentProgress += 5;
    setProgress(currentProgress);

    if (currentProgress >= 90) {
      clearInterval(interval);
      executeActualUpload(selectedFiles);
    }
  }, 120);
};
const executeActualUpload = async (selectedFiles: File[]) => {
  try {
    const response = await uploadVCDocs(selectedFiles, parseInt(claimId));

setProgress(100);
setStep(3);
setIsUploading(false);
toast.success("File uploaded successfully");

    setTimeout(() => {
      // 1. Safe access to the nested owner data
      const ownerData = response?.client_vehicle_owner_detail?.[0]?.[0];

      if (ownerData) {
        // 2. Map Formik keys to your specific API response keys
        const fieldMapping = {
          clientFirstName: ownerData.first_name,
          clientSurname: ownerData.surname,
          address: ownerData.address,
          postcode: ownerData.postcode,
          vehiclePaymentBeneficiary: ownerData.payment_benificiary,
          email: ownerData.email,
          homeTelephone: ownerData.home_tel,
          mobileTelephone: ownerData.mobile_tel,
          // gender: ownerData.gender // Add if you have a title/gender field
        };

        // 3. Update Formik fields loop
        Object.entries(fieldMapping).forEach(([formikKey, apiValue]) => {
          if (apiValue !== null && apiValue !== undefined && apiValue !== "") {
            formik.setFieldValue(formikKey, apiValue);
          }
        });
      }

   onUploadSuccess(response?.job_id || "mock-job-id");
onClose();

setStep(1);
setProgress(0);
setFiles([]);
setIsUploading(false);
}, 2000);
  } catch (error) {
   setIsUploading(false);
   setStep(1);
   setProgress(0);
   toast.error("Upload failed");
    console.error("OCR Upload Error:", error);
  }
};
  const formatSize = (bytes: number) => (bytes / 1024).toFixed(0) + "KB";

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-[100] p-4">
      <div className="w-[600px] p-6 bg-white rounded-lg flex flex-col gap-6 animate-in zoom-in-95">
        {/* Header */}
        <div className="self-stretch flex justify-between items-center">
          <div className="text-neutral-900 text-[20px] font-weight-600 font-['Stack_Sans_Headline']">
            Upload V5C File
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
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
            multiple
          />

          {/* Icon Mapping */}
          {step === 3 ? (
            <img src={Complete} />
          ) : step === 2 ? (
            <img
              src={Processing}
              className="animate-[spin_2s_linear_infinite]"
            />
          ) : (
            <img src={Upload} />
          )}

          {/* Text Content */}
          <div className="flex flex-col items-center gap-2">
            <div className="text-black text-base font-weight-600 font-['Stack_Sans_Headline']">
              {step === 1 && "Choose file(s) or Drag & Drop here"}
              {step === 2 &&
                `Uploading - ${formatSize(totalSize * (progress / 100))} of ${formatSize(totalSize)}`}
              {step === 3 &&
                `Uploaded - ${formatSize(totalSize)} of ${formatSize(totalSize)}`}
            </div>
            <div className="text-gray-500 text-sm font-normal font-['Stack_Sans_Headline']">
              {step === 1 ? "Single PDF or multiple images (JPG, PNG) supported" : displayName}
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

        {/* Selected files list */}
        {files.length > 0 && (
          <div className="self-stretch flex flex-col gap-2 overflow-auto" style={{ maxHeight: 200 }}>
            {files.map((f, i) => (
              <div
                key={i}
                className="p-3 rounded-lg outline outline-1 outline-offset-[-1px] outline-neutral-200 flex items-center gap-3"
              >
                <img
                  src={f.name.toLowerCase().endsWith(".pdf") ? PdfTypeIcon : ImgTypeIcon}
                  alt=""
                  className="w-9 h-9"
                />
                <div className="flex-1 min-w-0">
                  <div className="text-black text-sm font-weight-500 line-clamp-1">{f.name}</div>
                  <div className="text-gray-400 text-xs">{formatSize(f.size)}</div>
                </div>
                {step === 2 ? (
                  <img src={Processing} className="w-5 h-5 animate-[spin_2s_linear_infinite]" />
                ) : step === 3 ? (
                  <img src={Complete} className="w-5 h-5" />
                ) : null}
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
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
