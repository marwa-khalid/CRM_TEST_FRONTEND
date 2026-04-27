import React, { useState, useRef } from "react";
import { X } from "lucide-react";
import { toast } from "react-toastify";
import Complete from "../../../assets/AutoClaim_icon/Complete.svg"
import Upload from "../../../assets/AutoClaim_icon/Upload.svg";
import Processing from "../../../assets/AutoClaim_icon/Processing.svg";
import { uploadVCEngineer } from "../../../services/EngineeringDetails/engineeringDetails";
import { CalendarDate } from "@internationalized/date";

interface V5CModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: (jobId: string) => void;
  claimId: string | number;
  formik: any;
  setReportData:any
}

export const V5CEngineerUploadModal: React.FC<V5CModalProps> = ({
  isOpen,
  onClose,
  onUploadSuccess,
  claimId,
  formik,
  setReportData,
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;
  const parseDateInspection = (dateStr?: string) => {
    if (!dateStr) return undefined;
    const [day, month, year] = dateStr.split("-").map(Number);
    return new CalendarDate(year, month, day);
  };
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setStep(2);
      await simulateUpload(selectedFile);
    }
  };

  // This simulates the UI progress bar before calling your actual handleUpload logic
  const simulateUpload = async (selectedFile: File) => {
    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += 10;
      setProgress(currentProgress);
      if (currentProgress >= 100) {
        clearInterval(interval);
        executeActualUpload(selectedFile);
      }
    }, 150);
  };

  // const dispatch = useDispatch()
  const executeActualUpload = async (selectedFile: File) => {
    try {
      // Calling your actual API function
      const response = await uploadVCEngineer([selectedFile], claimId);
      const jobId = response?.job_id;

      setStep(3);
      toast.success("File uploaded successfully");

      // Delay slightly so user sees the "Green" success state before closing/polling
      setTimeout(() => {
        onUploadSuccess(response.client_vehicle_detail);
        onClose();

        const engineerDetail = response?.engineer_report_details?.[0]?.[0];

        if (engineerDetail) {
          // Map Formik field names to the API response keys

          // dispatch(setOcrEngineer(engineerDetail));
setReportData(engineerDetail)
          const normalizeOcrDate = (dateStr?: string) => {
            if (!dateStr) return "";

            // supports 27-04-2026
            if (dateStr.includes("-")) {
              const [day, month, year] = dateStr.split("-").map(Number);
              if (day && month && year) {
                return `${year}-${String(month).padStart(2, "0")}-${String(
                  day,
                ).padStart(2, "0")}`;
              }
            }

            // supports 27 April 2026
            const parsed = new Date(dateStr);
            if (!Number.isNaN(parsed.getTime())) {
              return parsed.toLocaleDateString("sv-SE");
            }

            return "";
          };

          setReportData(engineerDetail);

          formik.setFieldValue(
            "inspection_date",
            normalizeOcrDate(engineerDetail.inspection_date),
          );
          formik.setFieldValue(
            "engineer_instructed",
            normalizeOcrDate(engineerDetail.engineer_instructed),
          );
          formik.setFieldValue(
            "engineer_report_received_date",
            normalizeOcrDate(engineerDetail.engineer_report_received_date),
          );
          formik.setFieldValue(
            "engineer_fee",
            engineerDetail.engineer_fee || "",
          );
          formik.setFieldValue("engineer_report_received", true);
        }
        setStep(1);
      }, 1500);
    } catch (error) {
      setStep(1);
      toast.error("Upload failed");
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
          />

          {/* Icon Mapping */}
          {step === 3 ? (
            <img src={Complete} />
          ) : step === 2 ? (
            <img src={Processing} />
          ) : (
            <img src={Upload} />
          )}

          {/* Text Content */}
          <div className="flex flex-col items-center gap-2">
            <div className="text-black text-base font-weight-600 font-['Stack_Sans_Headline']">
              {step === 1 && "Choose a file or Drag & Drop here"}
              {step === 2 &&
                `Uploaded - ${formatSize((file?.size || 0) * (progress / 100))} of ${formatSize(file?.size || 0)}`}
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
