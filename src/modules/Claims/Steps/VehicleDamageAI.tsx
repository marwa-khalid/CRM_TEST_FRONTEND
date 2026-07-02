import React, { useState, useRef, useEffect } from "react";
import { toast } from "react-toastify";
import { useCaseReference } from "../../../hooks/useCaseReference";
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


// Reusing the summary field logic from the story
const DamageSummaryRow = ({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) => (
  <div className="w-96 p-4 rounded-lg outline outline-1 outline-offset-[-1px] outline-gray-200 inline-flex flex-col gap-[5px]">
    <div className="text-gray-700 text-2xl font-weight-600 leading-6">
      {value}
    </div>
    <div className="text-gray-700 text-sm font-weight-400 font-light">{label}</div>
  </div>
);

export const VehicleDamageAI = ({ formRef, claimId }: any) => {
  const claimID = claimId;
  const caseReference = useCaseReference(claimId); // per-claim ref (was localStorage)
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
    if (uploadedFiles.length === 0) {
      toast.warn("Please upload images first");
      return;
    }

    setIsAnalyzing(true);
    try {
      const formData = new FormData();
      formData.append("claim_id", String(claimID));
      formData.append("assessment_type", assessmentType);
      uploadedFiles.forEach((file) => formData.append("images", file));

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
  const [currentPredictions, setCurrentPredictions] = useState<any>();

  useEffect(() => {
    setCurrentPredictions(
      aiResult?.images?.[selectedImageIndex]?.predictions || [],
    );
  }, [aiResult, selectedImageIndex]);
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setUploadedFiles((prev) => [...prev, ...files]);
      const newPreviews = files.map((file) => URL.createObjectURL(file));
      setPreviews((prev) => [...prev, ...newPreviews]);
    }
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
        uploaded_by: user?.email || "Claim Handler",
        source_name: "Claim Portal",
        assessment_type: assessmentType,

        images: aiResult?.images || [],
        predictions: getAllDamageRows(),

        audit_trail: [
          {
            doneBy: user?.email || "Claim Handler",
            action: "Generated Collective AI Report",
            timestamp:
              aiResult?.generated_at ||
              aiResult?.images?.[0]?.generated_at ||
              new Date().toISOString(),
          },
        ],
      };
    };

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

            generated_at:
              aiResult?.generated_at ||
              aiResult?.images?.[0]?.generated_at ||
              new Date().toISOString(),

            images: aiResult?.images || [],

            predictions: getAllDamageRows(),

            uploaded_by:
              JSON.parse(localStorage.getItem("activeUser") || "{}")?.email ||
              "Claim Handler",

            source_name: "Claim Portal",

            assessment_type: assessmentType,

            audit_trail: [
              {
                doneBy:
                  JSON.parse(localStorage.getItem("activeUser") || "{}")
                    ?.email || "Claim Handler",
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
          sourceName="Claim Portal"
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
      {/* Actions */}
      {entryMode !== "Manual" && (
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
        <VehicleManualForm formRef={formRef} />
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

              <div className="w-full p-6 bg-white border rounded-lg flex flex-col gap-6">
                <div className="pb-4 border-b">
                  <h3 className="text-xl font-weight-600">
                    Upload Accident Images
                  </h3>
                  <p className="text-gray-500 text-sm">
                    You can upload more than one image
                  </p>
                </div>

                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="p-10 border-2 border-dashed border-gray-200 rounded-lg flex flex-col items-center gap-6 cursor-pointer hover:bg-blue-50"
                >
                  <input
                    type="file"
                    multiple
                    ref={fileInputRef}
                    className="hidden"
                    onChange={handleFileChange}
                    accept="image/*"
                  />
                  <img src={downloadd} alt="upload icon" />
                  <div className="text-center">
                    <div className="text-black font-weight-600">
                      Choose a file or Drag & Drop here
                    </div>
                    <div className="text-gray-500 text-xs uppercase">
                      JPG, PNG
                    </div>
                  </div>
                </div>

                {previews.length > 0 && (
                  <div className="inline-flex items-center justify-start gap-6 p-4 overflow-x-auto">
                    {/* The "+" Placeholder Button [cite: 19, 20] */}
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="w-16 h-16 shrink-0 rounded-lg border border-blue-600 bg-white flex items-center justify-center cursor-pointer hover:bg-blue-50 transition-colors"
                    >
                      <img src={Plus} alt="" />
                    </div>

                    {/* Image Previews */}
                    <div className="flex items-center gap-6">
                      {previews.map((src, i) => (
                        <div key={i} className="relative group">
                          <img
                            src={src}
                            className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                            alt={`preview-${i}`}
                          />
                          {/* Optional: Remove button from old logic */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              const updatedPreviews = [...previews];
                              const updatedFiles = [...uploadedFiles];
                              updatedPreviews.splice(i, 1);
                              updatedFiles.splice(i, 1);
                              setPreviews(updatedPreviews);
                              setUploadedFiles(updatedFiles);
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
                {previews.length > 0 && (
                  <div className="text-end">
                    <button
                      onClick={handleAnalyze}
                      disabled={isAnalyzing || previews.length === 0}
                      className="px-10 py-4 bg-blue-500 rounded text-white text-base font-weight-400 font-['Stack_Sans_Headline'] hover:bg-blue-500 transition"
                    >
                      {isAnalyzing ? "Analyzing..." : "Analyze Images"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* --- ANALYZED STATE (Figma Requirements) --- */
            <div ref={reportRef} className="space-y-6">
              <div className="flex gap-4">
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
                    onClick={() => {
                      setAiResult(null);
                      setSelectedImageIndex(0);
                      setCurrentPredictions([]);
                    }}
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