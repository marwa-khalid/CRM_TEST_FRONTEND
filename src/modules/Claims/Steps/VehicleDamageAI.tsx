import React, { useState, useRef, useEffect } from "react";
import { toast } from "react-toastify";
import {
  aiAnalyze,
  getLatestVehicleDamageReport,
} from "../../../services/VehicleDamage/VehicleDamage";
import downloadd from "../../../assets/AutoClaim_icon/Downloadd.svg";
import Yes from "../../../assets/AutoClaim_icon/Yes.svg";
import No from "../../../assets/AutoClaim_icon/No.svg";
import Plus from "../../../assets/AutoClaim_icon/Plus.svg";
import AI from "../../../assets/AutoClaim_icon/AI.svg";
import medium from "../../../assets/AutoClaim_icon/medium.svg";
import high from "../../../assets/AutoClaim_icon/high.svg";
import low from "../../../assets/AutoClaim_icon/low.svg";
import type2 from "../../../assets/AutoClaim_icon/analyzing.svg";
import VehicleManualForm from "./VehicleManualForm";
import AIDamageReportSlider from "../Components/AIReportSlider";


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

export const VehicleDamageAI = ({ formRef }: any) => {
  const claimID = localStorage.getItem("claimId");
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

  // --- State Management ---
  const [assessmentType, setAssessmentType] = useState("Client vehicle only");
  const [open, setOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState<any>(null);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
console.log(uploadedFiles);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
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
    } catch (error: any) {
      const message =
        error?.response?.data?.detail ||
        "AI analysis failed. Please try again.";
      toast.error(message);
    } finally {
      setIsAnalyzing(false);
    }
  };
  console.log(selectedImageIndex);
  console.log(aiResult?.predictions);

  
  const [currentPredictions, setCurrentPredictions] = useState<any>();

  useEffect(() => {
    setCurrentPredictions(
      aiResult?.images?.[selectedImageIndex]?.predictions || [],
    );
  }, [aiResult, selectedImageIndex]);
  console.log(currentPredictions);
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
     
  return (
    <div className="MainContent w-[1157px] flex-1 items-start gap-6 p-8 overflow-y-auto scrollbar-hide font-['Stack_Sans_Headline']">
      {/* Header Section */}
      {open && (
        <AIDamageReportSlider
  isOpen={open}
  currentImage={{
    ...aiResult?.images?.[selectedImageIndex],
    uploaded_by: JSON.parse(localStorage.getItem("activeUser")).email,
    source_name: "Claim Portal",
    assessment_type: assessmentType,
    audit_trail: [
      {
        doneBy:  JSON.parse(localStorage.getItem("activeUser")).email,
        action: "Generated Report",
        timestamp: aiResult?.images?.[selectedImageIndex]?.generated_at,
      },
    ],
  }}
  onClose={() => setOpen(false)}
  selectedType={assessmentType}
  claimReference={localStorage.getItem("CaseReference") || ""}
  clientName={ JSON.parse(localStorage.getItem("activeUser")).email}
  sourceName="Claim Portal"
  // onSaveToClaim={handleSaveToClaim}
/>
      )}
      {isAnalyzing && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-transparent p-6 rounded-xl flex flex-col items-center gap-4 ">
            {/* Spinner */}
            <img
              src={type2}
              className="w-16 h-16 animate-spin"
              style={{ animationDuration: "2s" }}
            />
            <div className="text-white text-sm font-weight-400">
              Analyzing images...
            </div>
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
        <div className="flex gap-4 mb-20">
          <button
            className="bg-blue-100 text-primary px-4 py-2 rounded text-sm"
            onClick={() => {
              const pdfUrl =
                aiResult?.images?.[selectedImageIndex]?.report_pdf_url;
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
                  value={aiResult?.count || 0}
                />
                <DamageSummaryRow
                  label="High Severity Issues"
                  value={aiResult?.high_severity_count || 0}
                />
              </div>
              {/* Image Display Card */}
              <div className="w-full p-4 rounded-lg outline outline-1 outline-gray-100 flex flex-col gap-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-xl font-weight-600">
                      Images with AI Detection
                    </h3>
                    <p className="text-gray-500 text-sm">
                      {previews.length} image • Uploaded
                    </p>
                  </div>
                  <button
                    onClick={() => setAiResult(null)}
                    className="h-8 px-3 py-2 bg-white rounded outline outline-1 outline-blue-600 text-blue-600 text-sm flex items-center gap-2"
                  >
                    <img src={Plus} alt="" /> Add More Images
                  </button>
                </div>

                <div className="flex bg-neutral-50  justify-between items-center mb-4">
                  {aiResult.images?.length > 1 && (
                    <button
                      onClick={() =>
                        setSelectedImageIndex((prev) => Math.max(prev - 1, 0))
                      }
                      disabled={selectedImageIndex === 0}
                      className="px-2 py-1 bg-gray-200 rounded disabled:opacity-50"
                    >
                      ◀
                    </button>
                  )}
                  {/* {
                    console.log(
                      aiResult?.images?.[selectedImageIndex]
                        ?.original_image_url,
                    )!
                  } */}
                  <div className="w-full bg-neutral-50 rounded-lg flex justify-center items-center">
                    <img
                      src={
                        aiResult?.images?.[selectedImageIndex]
                          ?.annotated_image_url ||
                        aiResult?.images?.[selectedImageIndex]
                          ?.original_image_url ||
                        previews[selectedImageIndex]
                      }
                      className="max-h-[350px] object-cover"
                    />
                  </div>
                  {aiResult?.images?.length > 1 && (
                    <button
                      onClick={() =>
                        setSelectedImageIndex((prev) =>
                          Math.min(
                            prev + 1,
                            (aiResult?.images?.length || 1) - 1,
                          ),
                        )
                      }
                      disabled={
                        selectedImageIndex ===
                        (aiResult?.images?.length || 1) - 1
                      }
                      className="px-2 py-1 bg-gray-200 rounded disabled:opacity-50"
                    >
                      ▶
                    </button>
                  )}
                </div>

                <div className="relative w-full flex items-center gap-3 text-left text-sm text-darkslategray">
                  <div className="flex items-center gap-1.5">
                    <img src={high} alt="" />
                    <div className="relative">High Severity</div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <img src={medium} alt="" />

                    <div className="relative">Medium Severity</div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <img src={low} alt="" />

                    <div className="relative">Low Severity</div>
                  </div>
                </div>
              </div>

              {/* Damage Summary Table */}
              <div className="w-full p-4 rounded-lg outline outline-1 outline-gray-100 flex flex-col gap-4">
                <h3 className="text-xl font-weight-600">Damage Summary</h3>
                <div className="border-t border-b border-whitesmoke">
                  <div className="flex p-4 font-weight-600 text-sm border-b text-neutral-900">
                    <div className="w-36">DAMAGE SIDE</div>
                    <div className="w-40">AREA OF DAMAGE</div>
                    <div className="w-44">TYPE OF DAMAGE</div>
                    <div className="w-32">SEVERITY</div>
                    <div className="w-28">CONFIDENCE</div>
                    <div className="w-28">POINTS</div>
                    <div>SUGGESTED REPAIR</div>
                  </div>

                  {currentPredictions.map((item: any, index: number) => (
                    <div
                      key={index}
                      className="flex p-4 text-sm items-start border-b font-weight-400 font-light text-neutral-700"
                    >
                      <div className="w-36 capitalize">{item.side}</div>
                      <div className="w-40 capitalize">{item.part}</div>
                      <div className="w-44 capitalize">{item.damage_type}</div>
                      <div className="w-32">
                        <span
                          className={`px-2 py-1 rounded text-xs font-bold ${
                            item.severity === "High"
                              ? "bg-red-100 text-red-700"
                              : item.severity === "Medium"
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-green-100 text-green-700"
                          }`}
                        >
                          {item.severity}
                        </span>
                      </div>
                      <div className="w-28">
                        {(item.confidence * 100).toFixed(0)}%
                      </div>
                      <div className="w-28">{item.points || 1}</div>
                      <div>
                        <div>
                          {item.damage_type?.toLowerCase() === "dent"
                            ? "Repair & paint"
                            : item.damage_type?.toLowerCase() === "broken"
                              ? "Replace part"
                              : item.damage_type?.toLowerCase() === "crash"
                                ? "Replace or major repair"
                                : item.damage_type?.toLowerCase() === "scratch"
                                  ? "Paint / polish"
                                  : item.damage_type?.toLowerCase() ===
                                      "shattered"
                                    ? "Replace glass"
                                    : "Inspect"}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};