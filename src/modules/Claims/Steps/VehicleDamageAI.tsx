import React, { useState, useRef, useEffect } from "react";
import { toast } from "react-toastify";
import { useCaseReference } from "../../../hooks/useCaseReference";
import { useCurrentUser } from "../../../context/AuthContext";
import {
  aiAnalyze,
  getLatestVehicleDamageReport,
  saveManualAdjustments,
} from "../../../services/VehicleDamage/VehicleDamage";
import { getClaimVehicles } from "../../../services/Vehicle/vehicle";
import downloadd from "../../../assets/AutoClaim_icon/Downloadd.svg";
import Yes from "../../../assets/AutoClaim_icon/Yes.svg";
import No from "../../../assets/AutoClaim_icon/No.svg";
import Plus from "../../../assets/AutoClaim_icon/Plus.svg";
import AI from "../../../assets/AutoClaim_icon/AI.svg";
import medium from "../../../assets/AutoClaim_icon/medium.svg";
import high from "../../../assets/AutoClaim_icon/high.svg";
import low from "../../../assets/AutoClaim_icon/low.svg";
import VehicleManualForm from "./VehicleManualForm";
import AIDamageReportSlider from "../Components/AIReportSlider";
import ImageDetailSlider from "../Components/ImageDetailSlider";
import Select from "react-select";
import { customStyles, BlueDropdownIndicator } from "./GeneralDetailsForm";

// Keep in sync with the report slider's VEHICLE_STATUS_OPTIONS so a status set
// there (saved via manual adjustments) prefills this dropdown correctly.
const vehicleStatusOptions = [
  { value: "Roadworthy", label: "Roadworthy" },
  { value: "Non-Roadworthy", label: "Non-Roadworthy" },
  { value: "Total Loss", label: "Total Loss" },
  { value: "Under Repair", label: "Under Repair" },
];


// Reusing the summary field logic from the story
const DamageSummaryRow = ({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) => (
  <div className="flex-1 min-w-[200px] p-4 rounded-lg outline outline-1 outline-offset-[-1px] outline-gray-200 inline-flex flex-col gap-[5px]">
    <div className="text-gray-700 text-2xl font-weight-600 leading-6">
      {value}
    </div>
    <div className="text-gray-700 text-sm font-weight-400 font-light">{label}</div>
  </div>
);

export const VehicleDamageAI = ({ formRef, claimId }: any) => {
  const claimID = claimId;
  const caseReference = useCaseReference(claimId); // per-claim ref (was localStorage)
  const { user: currentUser } = useCurrentUser();
  // Claim handler shown on the AI report = the backend's stored handler name,
  // else the logged-in user's name (email before "@").
  const reportHandler = () =>
    aiResult?.uploaded_by || currentUser?.name || "Claim Handler";
useEffect(() => {
  const loadSavedReport = async () => {
    try {
      const data = await getLatestVehicleDamageReport(claimID!);

      const payload = data?.report_payload;
      if (!payload) return;

      setAiResult({
        predictions: payload.all_predictions || [],
        images: payload.images || [],
        count: payload.count || 0,
        high_severity_count: payload.high_severity_count || 0,
        uploaded_by: payload.uploaded_by || "",
        report_pdf_url: payload.report_pdf_url || "",
        report_pdf_s3_key: payload.report_pdf_s3_key || "",
        report_payload: payload,
      });

      setAssessmentType(payload.assessmentType || "Client vehicle only");
      setSavedAdjustments(payload.manual_adjustments || null);
      setSelectedImageIndex(payload.selectedImageIndex || 0);
      setCurrentPredictions(
        payload.images?.[payload.selectedImageIndex || 0]?.predictions || [],
      );
      // setPreviews(
      //   payload.images?.map(
      //     (img: any) => img.annotated_image_url || img.original_image_url,
      //   ) || [],
      // );
      setPreviews(
        payload.images?.map(
          (img: any) => img.original_image_url || img.annotated_image_url,
        ) || [],
      );
    } catch (err) {
      console.error("Failed to load saved report", err);
    }
  };

  if (claimID) loadSavedReport();
}, [claimID]);

  // --- Vehicle cards (client + third-party) for the report header ---
  const [clientVehicle, setClientVehicle] = useState<any>(null);
  const [thirdPartyVehicle, setThirdPartyVehicle] = useState<any>(null);
  useEffect(() => {
    if (!claimID) return;
    getClaimVehicles(claimID)
      .then((list: any[]) => {
        const v = Array.isArray(list) ? list[0] : null;
        if (!v) return;
        setClientVehicle({
          registration: v.registration ?? v.reg ?? null,
          make: v.make ?? null,
          model: v.model ?? null,
          year: v.year ?? v.manufacture_year ?? null,
          color: v.color ?? v.colour ?? null,
        });
        const tp = v.third_party_vehicle_detail || v.third_party_vehicle || null;
        if (tp) {
          setThirdPartyVehicle({
            registration: tp.registration ?? null,
            make: tp.make ?? null,
            model: tp.model ?? null,
            year: tp.year ?? null,
            color: tp.color ?? tp.colour ?? null,
          });
        }
      })
      .catch(() => {});
  }, [claimID]);

  // --- State Management ---
  const [assessmentType, setAssessmentType] = useState("Client vehicle only");
  const [open, setOpen] = useState(false);
  const [imageSliderOpen, setImageSliderOpen] = useState(false);
  const [sliderImageIndex, setSliderImageIndex] = useState<number>(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState<any>(null);
  // Manual adjustments persisted with the report (prefill the slider on reopen).
  const [savedAdjustments, setSavedAdjustments] = useState<any>(null);
  const [savingAdjustments, setSavingAdjustments] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Second upload box (third-party vehicle) — only used when "Both" is selected.
  const [tpFiles, setTpFiles] = useState<File[]>([]);
  const [tpPreviews, setTpPreviews] = useState<string[]>([]);
  const tpFileInputRef = useRef<HTMLInputElement>(null);
  // Vehicle Status shown beside the summary cards on the analyzed screen.
  const [vehicleStatus, setVehicleStatus] = useState<string>("");
  // Autosave baseline (last-persisted status) + debounce timer, so prefilling
  // never triggers a save and only a real user change persists.
  const lastSavedStatusRef = useRef<string | null>(null);
  const statusSaveTimer = useRef<any>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // Save manual adjustments → backend rebuilds the PDF (ReportLab) and re-points
  // the documents-library file; reflect the fresh PDF url in the open slider.
  const handleSaveAdjustments = async (state: {
    decisions: Record<string, "accepted" | "rejected">;
    notes: string;
    vehicleStatus: string;
  }) => {
    if (!claimID) return;
    setSavingAdjustments(true);
    try {
      const res = await saveManualAdjustments({
        claim_id: claimID,
        decisions: state.decisions || {},
        notes: state.notes || "",
        vehicleStatus: state.vehicleStatus || "Roadworthy",
      });
      setSavedAdjustments(state);
      const freshUrl = res?.pdf_report_url;
      if (freshUrl) {
        setAiResult((prev: any) => ({
          ...(prev || {}),
          report_pdf_url: freshUrl,
          pdf_report_url: freshUrl,
        }));
      }
      toast.success("Manual adjustments saved & report updated");
    } catch (error) {
      toast.error("Failed to save manual adjustments");
    } finally {
      setSavingAdjustments(false);
    }
  };

  // --- AI Integration Logic (from old VehicleDamage.tsx) ---
  const handleAnalyze = async () => {
    const isBoth = assessmentType === "Both";
    if (isBoth) {
      if (uploadedFiles.length === 0 || tpFiles.length === 0) {
        toast.warn("Please upload images for both the client and third party vehicles");
        return;
      }
    } else if (uploadedFiles.length === 0) {
      toast.warn("Please upload images first");
      return;
    }

    setIsAnalyzing(true);
    try {
      const formData = new FormData();
      formData.append("claim_id", String(claimID));
      formData.append("assessment_type", assessmentType);
      // For "Both", `images` = client vehicle, `third_party_images` = third party.
      // Otherwise the single set goes in `images` (tagged by assessment_type).
      uploadedFiles.forEach((file) => formData.append("images", file));
      if (isBoth) {
        tpFiles.forEach((file) => formData.append("third_party_images", file));
      }

      const response = await aiAnalyze(formData);
      setAiResult(response);
      setCurrentPredictions(
        response.predictions?.filter(
          (p: any) => p.image_index === selectedImageIndex,
        ) || [],
      );
      // Filter predictions for current image
      toast.success("AI Analysis Complete");
      // PDF is now generated on the backend (secure ReportLab path); no frontend capture.
    } catch (error: any) {
      const message =
        error?.response?.data?.detail ||
        "AI analysis failed. Please try again.";
      toast.error(message);
    } finally {
      setIsAnalyzing(false);
    }
  };
  // "Add more images" — upload only NEW images; the backend merges the already
  // analysed ones (no re-analysis) into one consolidated report.
  const [addImagesOpen, setAddImagesOpen] = useState(false);
  const [newImageFiles, setNewImageFiles] = useState<File[]>([]);
  const newImageInputRef = useRef<HTMLInputElement>(null);

  const handleNewImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setNewImageFiles((prev) => [...prev, ...Array.from(e.target.files as FileList)]);
    }
  };

  const handleAnalyzeNew = async () => {
    if (newImageFiles.length === 0) {
      toast.warn("Please add images first");
      return;
    }
    setIsAnalyzing(true);
    try {
      const formData = new FormData();
      formData.append("claim_id", String(claimID));
      formData.append("assessment_type", assessmentType);
      newImageFiles.forEach((file) => formData.append("images", file));
      // Already-analysed images are merged server-side (not re-analysed).
      formData.append("existing_images", JSON.stringify(aiResult?.images || []));

      const response = await aiAnalyze(formData);
      setAiResult(response);
      setSelectedImageIndex(0);
      setCurrentPredictions(response.images?.[0]?.predictions || []);
      setNewImageFiles([]);
      setAddImagesOpen(false);
      toast.success("New images analysed and merged");
    } catch (error: any) {
      const message =
        error?.response?.data?.detail || "AI analysis failed. Please try again.";
      toast.error(message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const [currentPredictions, setCurrentPredictions] = useState<any>();

  useEffect(() => {
    setCurrentPredictions(
      aiResult?.images?.[selectedImageIndex]?.predictions || [],
    );
  }, [aiResult, selectedImageIndex]);
  // Prefill the main-screen Vehicle Status from saved manual adjustments, and
  // keep the autosave baseline in sync so prefilling never triggers a save.
  useEffect(() => {
    const saved = savedAdjustments?.vehicleStatus || "";
    if (saved) setVehicleStatus(saved);
    lastSavedStatusRef.current = saved;
  }, [savedAdjustments]);

  // Auto-save the main-screen Vehicle Status when the handler changes it.
  // Persists via the manual-adjustments path (stores the status in the report +
  // rebuilds the PDF), preserving any existing accept/reject decisions & notes.
  useEffect(() => {
    if (!claimID || !aiResult) return;
    if (lastSavedStatusRef.current === null) return;        // not initialised yet
    if (vehicleStatus === lastSavedStatusRef.current) return; // unchanged / just prefilled

    clearTimeout(statusSaveTimer.current);
    statusSaveTimer.current = setTimeout(async () => {
      const status = vehicleStatus;
      try {
        const res = await saveManualAdjustments({
          claim_id: claimID,
          decisions: savedAdjustments?.decisions || {},
          notes: savedAdjustments?.notes || "",
          vehicleStatus: status || "Roadworthy",
        });
        lastSavedStatusRef.current = status;
        setSavedAdjustments((prev: any) => ({ ...(prev || {}), vehicleStatus: status }));
        const freshUrl = res?.pdf_report_url;
        if (freshUrl) {
          setAiResult((prev: any) => ({
            ...(prev || {}),
            report_pdf_url: freshUrl,
            pdf_report_url: freshUrl,
          }));
        }
        toast.success("Vehicle status saved");
      } catch (err) {
        toast.error("Failed to save vehicle status");
      }
    }, 700);

    return () => clearTimeout(statusSaveTimer.current);
  }, [vehicleStatus, claimID, aiResult]);
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setUploadedFiles((prev) => [...prev, ...files]);
      const newPreviews = files.map((file) => URL.createObjectURL(file));
      setPreviews((prev) => [...prev, ...newPreviews]);
    }
  };
  const handleTpFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setTpFiles((prev) => [...prev, ...files]);
      const newPreviews = files.map((file) => URL.createObjectURL(file));
      setTpPreviews((prev) => [...prev, ...newPreviews]);
    }
  };
  const removeClientImage = (i: number) => {
    setPreviews((prev) => prev.filter((_, idx) => idx !== i));
    setUploadedFiles((prev) => prev.filter((_, idx) => idx !== i));
  };
  const removeTpImage = (i: number) => {
    setTpPreviews((prev) => prev.filter((_, idx) => idx !== i));
    setTpFiles((prev) => prev.filter((_, idx) => idx !== i));
  };
  const [entryMode, setEntryMode] = useState<string>("Manual");
     const reportRef = useRef<HTMLDivElement>(null);
    const getAllDamageRows = () => {
      const rowsFromImages =
        aiResult?.images?.flatMap((image: any, imageIndex: number) =>
          (image.predictions || []).map((prediction: any) => ({
            ...prediction,
            image_index: prediction.image_index ?? imageIndex,
          })),
        ) || [];

      if (rowsFromImages.length > 0) return rowsFromImages;

      return aiResult?.predictions || [];
    };

    const getAllDetectionImages = () => {
      if (aiResult?.images?.length > 0) {
        return aiResult.images.map((image: any, index: number) => ({
          id: image.id || index,
          src:
            image.annotated_image_url ||
            image.original_image_url ||
            previews[index],
        }));
      }

      return previews.map((src, index) => ({
        id: index,
        src,
      }));
    };

    const getSeverityCount = (severity: string) => {
      return getAllDamageRows().filter(
        (item: any) =>
          String(item.severity || "").toLowerCase() === severity.toLowerCase(),
      ).length;
    };

    const getSuggestedRepair = (damageType?: string) => {
      const type = String(damageType || "").toLowerCase();

      if (type === "dent") return "Repair";
      if (type === "broken") return "Replace part";
      if (type === "crash") return "Major repair";
      if (type === "scratch") return "Paint / polish";
      if (type === "shattered") return "Replace glass";

      return "Inspect";
    };

    const formatConfidence = (confidence: any) => {
      if (confidence === undefined || confidence === null) return "-";

      if (String(confidence).includes("%")) return confidence;

      const value = Number(confidence);

      if (Number.isNaN(value)) return "-";

      if (value <= 1) return `${(value * 100).toFixed(0)}%`;

      return `${value.toFixed(0)}%`;
    }; 
    const getReportId = () => {
      if (aiResult?.report_id) return aiResult.report_id;
      if (aiResult?.reportId) return aiResult.reportId;

      const claimRef = caseReference || "CLAIM";
      return `RPT-${claimRef.replace(/[^a-zA-Z0-9]/g, "").toUpperCase()}-${Date.now()
        .toString()
        .slice(-6)}`;
    };

    const getCollectivePdfUrl = () => {
      return (
        aiResult?.report_pdf_url ||
        aiResult?.pdf_report_url ||
        aiResult?.pdf_url ||
        aiResult?.images?.[0]?.report_pdf_url ||
        ""
      );
    };

    const buildCollectiveReport = () => {
      const user = JSON.parse(localStorage.getItem("activeUser") || "{}");

      return {
        report_id: getReportId(),
        report_pdf_url: getCollectivePdfUrl(),
        generated_at:
          aiResult?.generated_at ||
          aiResult?.images?.[0]?.generated_at ||
          new Date().toISOString(),

        claim_reference: caseReference || "",
        uploaded_by: reportHandler(),
        source_name: "Upload",
        assessment_type: assessmentType,

        images: aiResult?.images || [],
        predictions: getAllDamageRows(),

        audit_trail: [
          {
            doneBy: reportHandler(),
            action: "Generated Collective AI Report",
            timestamp:
              aiResult?.generated_at ||
              aiResult?.images?.[0]?.generated_at ||
              new Date().toISOString(),
          },
        ],
      };
    };

    // Reusable upload box (used once for single modes, twice for "Both").
    const renderUploadBox = (opts: {
      title: string;
      previews: string[];
      inputRef: React.RefObject<HTMLInputElement>;
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
      onRemove: (i: number) => void;
    }) => (
      <div className="w-full p-6 bg-white border rounded-lg flex flex-col gap-6">
        <div className="pb-4 border-b">
          <h3 className="text-xl font-weight-600">{opts.title}</h3>
          <p className="text-gray-500 text-sm">You can upload more than one image</p>
        </div>

        <div
          onClick={() => opts.inputRef.current?.click()}
          className="p-10 border-2 border-dashed border-gray-200 rounded-lg flex flex-col items-center gap-6 cursor-pointer hover:bg-blue-50"
        >
          <input
            type="file"
            multiple
            ref={opts.inputRef}
            className="hidden"
            onChange={opts.onChange}
            accept="image/*"
          />
          <img src={downloadd} alt="upload icon" />
          <div className="text-center">
            <div className="text-black font-weight-600">
              Choose a file or Drag & Drop here
            </div>
            <div className="text-gray-500 text-xs uppercase">JPG, PNG</div>
          </div>
        </div>

        {opts.previews.length > 0 && (
          <div className="inline-flex items-center justify-start gap-6 p-4 overflow-x-auto">
            <div
              onClick={() => opts.inputRef.current?.click()}
              className="w-16 h-16 shrink-0 rounded-lg border border-blue-600 bg-white flex items-center justify-center cursor-pointer hover:bg-blue-50 transition-colors"
            >
              <img src={Plus} alt="" />
            </div>

            <div className="flex items-center gap-6">
              {opts.previews.map((src, i) => (
                <div key={i} className="relative group">
                  <img
                    src={src}
                    className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                    alt={`preview-${i}`}
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      opts.onRemove(i);
                    }}
                    className="absolute -top-1 -right-1 bg-white text-red-500 rounded-full w-5 h-5 flex items-center justify-center text-xs shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );

  return (
    <div className="MainContent w-full flex flex-col items-stretch gap-6 py-6 font-['Stack_Sans_Headline']">
      {" "}
      {/* Header Section */}
      <ImageDetailSlider
        isOpen={imageSliderOpen}
        onClose={() => setImageSliderOpen(false)}
        imageSrc={getAllDetectionImages()[sliderImageIndex]?.src || ""}
        predictions={
          aiResult?.images?.[sliderImageIndex]?.predictions ||
          (aiResult?.predictions || []).filter(
            (p: any) => p.image_index === sliderImageIndex,
          )
        }
        imageIndex={sliderImageIndex}
      />

      {addImagesOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
          <div className="w-[600px] p-6 bg-white rounded-lg flex flex-col gap-6 font-['Stack_Sans_Headline']">
            <div className="flex justify-between items-center">
              <div className="text-neutral-900 text-[20px] font-weight-600">Add More Images</div>
              <button
                onClick={() => { setAddImagesOpen(false); setNewImageFiles([]); }}
                className="text-gray-400 hover:text-gray-600 text-xl leading-none"
              >
                ×
              </button>
            </div>
            <div className="h-px bg-gray-100 w-full" />

            <div
              onClick={() => newImageInputRef.current?.click()}
              className="p-10 rounded-lg border-2 border-dashed border-gray-200 flex flex-col items-center gap-3 cursor-pointer hover:bg-blue-50 transition-colors"
            >
              <img src={AI} alt="" className="w-8 h-8" />
              <div className="text-center">
                <div className="text-black text-base font-weight-600">Choose images or Drag &amp; Drop here</div>
                <div className="text-gray-500 text-sm">Only the new images will be analysed &amp; merged</div>
              </div>
              <input
                type="file"
                multiple
                accept="image/*"
                ref={newImageInputRef}
                onChange={handleNewImagesChange}
                className="hidden"
              />
            </div>

            {newImageFiles.length > 0 && (
              <div className="flex flex-col gap-2 max-h-52 overflow-auto">
                {newImageFiles.map((f, i) => (
                  <div key={i} className="p-3 rounded-lg outline outline-1 outline-offset-[-1px] outline-neutral-200 flex items-center gap-3">
                    <img src={URL.createObjectURL(f)} alt="" className="w-9 h-9 rounded object-cover" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-black line-clamp-1">{f.name}</div>
                      <div className="text-xs text-gray-400">{(f.size / 1024).toFixed(0)}KB</div>
                    </div>
                    <button
                      onClick={() => setNewImageFiles((prev) => prev.filter((_, idx) => idx !== i))}
                      className="text-gray-400 hover:text-red-500 text-lg leading-none"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end items-center gap-4">
              <button
                onClick={() => { setAddImagesOpen(false); setNewImageFiles([]); }}
                className="px-6 py-3 bg-white border border-blue-600 rounded text-blue-600 text-base font-medium hover:bg-blue-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAnalyzeNew}
                disabled={isAnalyzing || newImageFiles.length === 0}
                className="px-6 py-3 bg-blue-600 rounded text-white text-base font-medium disabled:opacity-50"
              >
                {isAnalyzing ? "Analysing…" : "Analyse New Images"}
              </button>
            </div>
          </div>
        </div>
      )}

      {open && (
        <AIDamageReportSlider
          isOpen={open}
          reportData={{
            report_id:
              aiResult?.report_id ||
              aiResult?.reportId ||
              aiResult?.images?.[0]?.report_id ||
              undefined,

            report_pdf_url:
              aiResult?.report_pdf_url ||
              aiResult?.pdf_report_url ||
              aiResult?.images?.[0]?.report_pdf_url ||
              "",

            report_pdf_s3_key:
              aiResult?.report_pdf_s3_key ||
              aiResult?.report_payload?.report_pdf_s3_key ||
              "",

            generated_at:
              aiResult?.generated_at ||
              aiResult?.images?.[0]?.generated_at ||
              new Date().toISOString(),

            images: aiResult?.images || [],

            predictions: getAllDamageRows(),

            uploaded_by: reportHandler(),

            source_name: "Upload",

            assessment_type: assessmentType,

            audit_trail: [
              {
                doneBy: reportHandler(),
                action: "Generated Collective AI Report",
                timestamp:
                  aiResult?.generated_at ||
                  aiResult?.images?.[0]?.generated_at ||
                  new Date().toISOString(),
              },
            ],
          }}
          onClose={() => setOpen(false)}
          selectedType={assessmentType}
          claimReference={caseReference || ""}
          clientName={
            JSON.parse(localStorage.getItem("activeUser") || "{}")?.email || ""
          }
          sourceName="Upload"
          clientVehicle={clientVehicle}
          thirdPartyVehicle={thirdPartyVehicle}
          initialAdjustments={savedAdjustments}
          onSaveToClaim={handleSaveAdjustments}
          saving={savingAdjustments}
        />
      )}
      {isAnalyzing && (
        <div className="fixed inset-0 z-[9999] bg-[#e8e6df]/80 flex items-center justify-center font-['Stack_Sans_Headline']">
          <div className="relative w-[73px] h-[73px]">
            {Array.from({ length: 12 }).map((_, index) => (
              <span
                key={index}
                className="absolute left-1/2 top-1/2 w-[6px] h-[16px] rounded-full bg-[#9b9b9b] animate-loaderFade"
                style={{
                  transform: `translate(-50%, -50%) rotate(${index * 30}deg) translateY(-25px)`,
                  animationDelay: `${index * 0.08}s`,
                }}
              />
            ))}
          </div>
        </div>
      )}
      <div
        className={`flex justify-between items-center w-full ${entryMode === "Manual" ? "mb-10" : "mb-3"} `}
      >
        <h2 className="text-black text-2xl font-weight-600 leading-6">
          {entryMode === "Manual"
            ? "Vehicle Damage Details"
            : "AI Based Vehicle Damage Details"}
        </h2>
        {entryMode === "Manual" ? (
          <img
            src={AI}
            className="cursor-pointer"
            onClick={() => setEntryMode("AI")}
            alt=""
          />
        ) : (
          <button
            className="h-8 px-3 py-2 rounded border border-blue-500 text-blue-500 text-sm hover:bg-blue-50"
            onClick={() => setEntryMode("Manual")}
          >
            Manual Details
          </button>
        )}
      </div>
      {/* Actions — only once a report exists (no images/report = nothing to download or view) */}
      {entryMode !== "Manual" && aiResult && (
        <div className="flex gap-4">
          <button
            className="bg-blue-100 text-primary px-4 py-2 rounded text-sm"
            onClick={() => {
              const pdfUrl =
                aiResult?.report_pdf_url ||
                aiResult?.pdf_report_url ||
                aiResult?.images?.[0]?.report_pdf_url;

              if (pdfUrl) window.open(pdfUrl, "_blank");
            }}
          >
            Download PDF
          </button>
          <button
            className="bg-blue-100 text-primary px-4 py-2 rounded text-sm"
            onClick={() => setOpen(true)}
          >
            {/* <img src={Document} alt="" /> */}
            View Full Report
          </button>
        </div>
      )}
      {entryMode === "Manual" ? (
        <VehicleManualForm formRef={formRef} claimId={claimID} />
      ) : (
        <>
          {!aiResult ? (
            /* --- UPLOAD STATE --- */
            <div className="space-y-10">
              <div>
                <label className="text-black text-sm block mb-5">
                  What would you like to assess?
                </label>
                <div className="flex gap-5">
                  {[
                    "Client vehicle only",
                    "Third Party Vehicle Only",
                    "Both",
                  ].map((option) => (
                    <div
                      key={option}
                      className="flex items-center gap-2.5 cursor-pointer"
                      onClick={() => setAssessmentType(option)}
                    >
                      <img
                        src={assessmentType === option ? Yes : No}
                        className="w-5 h-5"
                        alt="toggle"
                      />
                      <span className="text-sm font-light">{option}</span>
                    </div>
                  ))}
                </div>
              </div>

              {assessmentType === "Both" ? (
                /* Two boxes (client + third party), one analyze button. */
                <div className="flex flex-col gap-6">
                  {renderUploadBox({
                    title: "Upload Client Vehicle Images",
                    previews,
                    inputRef: fileInputRef,
                    onChange: handleFileChange,
                    onRemove: removeClientImage,
                  })}
                  {renderUploadBox({
                    title: "Upload Third Party Vehicle Images",
                    previews: tpPreviews,
                    inputRef: tpFileInputRef,
                    onChange: handleTpFileChange,
                    onRemove: removeTpImage,
                  })}
                  {(previews.length > 0 || tpPreviews.length > 0) && (
                    <div className="text-end">
                      <button
                        onClick={handleAnalyze}
                        disabled={
                          isAnalyzing ||
                          previews.length === 0 ||
                          tpPreviews.length === 0
                        }
                        className="px-10 py-4 bg-blue-500 rounded text-white text-base font-weight-400 font-['Stack_Sans_Headline'] hover:bg-blue-500 transition disabled:opacity-50"
                      >
                        {isAnalyzing ? "Analyzing..." : "Analyze Images"}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col gap-6">
                  {renderUploadBox({
                    title:
                      assessmentType === "Third Party Vehicle Only"
                        ? "Upload Third Party Vehicle Images"
                        : "Upload Client Vehicle Images",
                    previews,
                    inputRef: fileInputRef,
                    onChange: handleFileChange,
                    onRemove: removeClientImage,
                  })}
                  {previews.length > 0 && (
                    <div className="text-end">
                      <button
                        onClick={handleAnalyze}
                        disabled={isAnalyzing || previews.length === 0}
                        className="px-10 py-4 bg-blue-500 rounded text-white text-base font-weight-400 font-['Stack_Sans_Headline'] hover:bg-blue-500 transition disabled:opacity-50"
                      >
                        {isAnalyzing ? "Analyzing..." : "Analyze Images"}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            /* --- ANALYZED STATE (Figma Requirements) --- */
            <div ref={reportRef} className="space-y-6">
              <div className="flex gap-4 items-stretch">
                <DamageSummaryRow
                  label="Total Damages Identified"
                  value={aiResult?.count || getAllDamageRows().length || 0}
                />

                <DamageSummaryRow
                  label="High Severity Issues"
                  value={
                    aiResult?.high_severity_count ||
                    getSeverityCount("High") ||
                    0
                  }
                />

                <div className="flex-1 min-w-[220px] flex flex-col gap-1.5 justify-center">
                  <label className="text-neutral-700 text-sm">Vehicle Status</label>
                  <Select
                    options={vehicleStatusOptions}
                    value={
                      vehicleStatusOptions.find((o) => o.value === vehicleStatus) ||
                      null
                    }
                    onChange={(opt: any) => setVehicleStatus(opt?.value || "")}
                    placeholder="Value"
                    styles={customStyles}
                    components={{
                      DropdownIndicator: BlueDropdownIndicator,
                      IndicatorSeparator: () => null,
                    }}
                  />
                </div>
              </div>

              <div className="w-full p-4 rounded-lg outline outline-1 outline-gray-100 flex flex-col gap-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-xl font-weight-600">
                      Images with AI Detection
                    </h3>

                    <p className="text-gray-500 text-sm">
                      {getAllDetectionImages().length} image
                      {getAllDetectionImages().length !== 1 ? "s" : ""} •
                      Uploaded
                    </p>
                  </div>

                  <button
                    onClick={() => setAddImagesOpen(true)}
                    className="h-8 px-3 py-2 bg-white rounded outline outline-1 outline-blue-600 text-blue-600 text-sm flex items-center gap-2"
                  >
                    <img src={Plus} alt="" />
                    Add More Images
                  </button>
                </div>

                <div className="w-full bg-neutral-100 rounded-lg p-3">
                  <div
                    className="grid gap-2"
                    style={{
                      gridTemplateColumns: `repeat(${Math.min(
                        getAllDetectionImages().length || 1,
                        6,
                      )}, minmax(0, 1fr))`,
                    }}
                  >
                    {getAllDetectionImages().map(
                      (image: any, index: number) => (
                        <button
                          key={image.id}
                          type="button"
                          onClick={() => {
                            setSelectedImageIndex(index);
                            setSliderImageIndex(index);
                            setImageSliderOpen(true);
                          }}
                          className="w-full h-[150px] rounded overflow-hidden bg-white border border-neutral-200 hover:border-blue-400 transition-colors"
                        >
                          <img
                            src={image.src}
                            alt={`AI Detection ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ),
                    )}
                  </div>
                </div>

                <div className="relative w-full flex items-center gap-3 text-left text-sm text-darkslategray">
                  <div className="flex items-center gap-1.5">
                    <img src={high} alt="" />
                    <div className="relative">
                      High Severity ({getSeverityCount("High")})
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <img src={medium} alt="" />
                    <div className="relative">
                      Medium Severity ({getSeverityCount("Medium")})
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <img src={low} alt="" />
                    <div className="relative">
                      Low Severity ({getSeverityCount("Low")})
                    </div>
                  </div>
                </div>
              </div>

              <div className="w-full p-4 rounded-lg outline outline-1 outline-gray-100 flex flex-col gap-4">
                <h3 className="text-xl font-weight-600">Damage Summary</h3>

                <div className="border border-gray-100 rounded-lg overflow-hidden">
                  <table className="w-full text-sm table-fixed">
                    <thead>
                      <tr className="bg-white border-b text-neutral-900 font-weight-600">
                        <th className="text-left px-4 py-3 w-[14%]">DAMAGE SIDE</th>
                        <th className="text-left px-4 py-3 w-[16%]">AREA OF DAMAGE</th>
                        <th className="text-left px-4 py-3 w-[16%]">TYPE OF DAMAGE</th>
                        <th className="text-left px-4 py-3 w-[12%]">SEVERITY</th>
                        <th className="text-left px-4 py-3 w-[12%]">CONFIDENCE</th>
                        <th className="text-left px-4 py-3 w-[10%]">POINTS</th>
                        <th className="text-left px-4 py-3">SUGGESTED REPAIR</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getAllDamageRows().length > 0 ? (
                        getAllDamageRows().map((item: any, index: number) => {
                          const severity = item.severity || "-";
                          const damageType =
                            item.damage_type ||
                            item.type_of_damage ||
                            item.type ||
                            "-";
                          return (
                            <tr
                              key={index}
                              className="border-b last:border-b-0 font-light text-neutral-700"
                            >
                              <td className="px-4 py-3 capitalize">
                                {item.damage_side || item.side || "-"}
                              </td>
                              <td className="px-4 py-3 capitalize">
                                {item.area_of_damage || item.area || item.part || "-"}
                              </td>
                              <td className="px-4 py-3 capitalize">{damageType}</td>
                              <td className="px-4 py-3">
                                <span
                                  className={`px-2 py-1 rounded text-xs font-weight-600 ${
                                    severity === "High"
                                      ? "bg-red-100 text-red-500"
                                      : severity === "Medium"
                                        ? "bg-orange-100 text-orange-500"
                                        : "bg-green-100 text-green-500"
                                  }`}
                                >
                                  {severity}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                {formatConfidence(item.confidence)}
                              </td>
                              <td className="px-4 py-3">{item.points || 1}</td>
                              <td className="px-4 py-3">
                                {item.suggested_repair ||
                                  item.repair ||
                                  getSuggestedRepair(damageType)}
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={7} className="px-4 py-3 text-neutral-400">
                            No damage summary available.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};