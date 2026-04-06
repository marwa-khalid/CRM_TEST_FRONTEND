import React, { useState, useRef, useEffect } from "react";
import { toast } from "react-toastify";
import {
  aiAnalyze,
  saveDamageDetails,
} from "../../../services/VehicleDamage/VehicleDamage";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import downloadd from "../../../assets/AutoClaim_icon/Downloadd.svg";
import Yes from "../../../assets/AutoClaim_icon/Yes.svg";
import No from "../../../assets/AutoClaim_icon/No.svg";
import Plus from "../../../assets/AutoClaim_icon/Plus.svg";
import AI from "../../../assets/AutoClaim_icon/AI.svg";
import medium from "../../../assets/AutoClaim_icon/medium.svg";
import high from "../../../assets/AutoClaim_icon/high.svg";
import low from "../../../assets/AutoClaim_icon/low.svg";
import type2 from "../../../assets/AutoClaim_icon/analyzing.svg";
import Document from "../../../assets/AutoClaim_icon/Document.svg";

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

  // --- State Management ---
  const [assessmentType, setAssessmentType] = useState("Client vehicle only");
  const [open, setOpen] = useState(false);


  // <AIDamageReportSlider
  //   isOpen={open}
  //   onClose={() => setOpen(false)}
  //   selectedType={type}
  //   data={apiData}
  // />

  // ===== SAMPLE DATA FORMAT =====
  // const apiData = [
  //   {
  //     type: "client",
  //     side: "Front",
  //     area: "Bonnet",
  //     damage: "Dent",
  //     severity: "High",
  //     confidence: 70,
  //     points: 2,
  //     repair: "Repair",
  //     image: "https://placehold.co/300"
  //   }
  // ];

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState<any>(null);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);

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
      uploadedFiles.forEach((file) => formData.append("images", file));
      formData.append("include_summary", "true");
      formData.append("include_annotated_image", "true");

      const response = await aiAnalyze(formData);
      setAiResult(response);
      setCurrentPredictions(
        response.predictions?.filter(
          (p: any) => p.image_index === selectedImageIndex,
        ) || [],
      );
      // Filter predictions for current image

      // Auto-save damage details as per old logic
      const payload = transformToSavePayload(response);
      await saveDamageDetails(payload);

      toast.success("AI Analysis Complete");
    } catch (error) {
      console.error("Analysis failed", error);
      // toast.error("Detection failed - Try again");
    } finally {
      setIsAnalyzing(false);
    }
  };
  console.log(selectedImageIndex);
  console.log(aiResult?.predictions);
  const transformToSavePayload = (response: any) => {
    const report = response.normalized_report;
    return {
      claim_id: parseInt(claimID),
      damage_side: report?.damage_side || "",
      area_of_damage: report?.area_of_damage || "",
      severity: report?.severity || "",
      confidence_percent: report?.confidence_percent || 0,
      images:
        response?.annotated_images?.map((img: any) => img.file_path) ||
        previews,
    };
  };
  const [currentPredictions, setCurrentPredictions] = useState<any>();

  useEffect(() => {
    setCurrentPredictions(
      aiResult?.predictions?.filter(
        (p: any) => p.image_index === selectedImageIndex,
      ) || [],
    );
  }, [aiResult?.predictions, selectedImageIndex]);
  console.log(currentPredictions);
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setUploadedFiles((prev) => [...prev, ...files]);
      const newPreviews = files.map((file) => URL.createObjectURL(file));
      setPreviews((prev) => [...prev, ...newPreviews]);
    }
  };
  //   const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   if (e.target.files) {
  //     const files = Array.from(e.target.files);

  //     // Append to existing files
  //     setUploadedFiles((prev) => [...prev, ...files]);

  //     const newPreviews = files.map((file) => URL.createObjectURL(file));
  //     setPreviews((prev) => [...prev, ...newPreviews]);
  //   }
  // };
  // useEffect(() => {
  //   if (uploadedFiles.length > 0 && aiResult) {
  //     handleAnalyze(); // re-run analysis with new images
  //   }
  // }, [uploadedFiles]);
  const [entryMode, setEntryMode] = useState<string>("Manual");
  console.log(currentPredictions);
     const reportRef = useRef<HTMLDivElement>(null);
     const handleDownloadPDF = async () => {
    const element = reportRef.current;
    if (!element) return;
  
    // 1. Prepare the element for capture
    // Sometimes browsers struggle with 'overflow-y-auto' during capture.
    // We temporarily ensure the element calculates its full height.
    const originalStyle = element.style.height;
    element.style.height = 'auto'; 
  
         try {
        setIsAnalyzing(true)
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        // KEY FIXES HERE:
        windowHeight: element.scrollHeight, // Tells it the "window" is as tall as the content
        height: element.scrollHeight, // Captures the full scrollable area
        y: 0, // Start from the very top of the element
        scrollX: 0,
        scrollY: 0,
        backgroundColor: "#ffffff", // Ensure background isn't transparent
        // --- KEY ADDITION HERE ---
        // This function modifies a copy of the HTML before rendering
        onclone: (clonedDoc) => {
          // Find all elements with the specific class and hide them
          const elementsToHide = clonedDoc.querySelectorAll(".hide-in-pdf");
          elementsToHide.forEach((el) => {
            // We set visibility to hidden to keep the layout consistent
            // (or display: none if you want to collapse the space)
            (el as HTMLElement).style.visibility = "hidden";
          });
        },
      });
  
      const imgData = canvas.toDataURL('image/png');
      
      // 2. Dynamic PDF Sizing
      const pdf = new jsPDF({
        orientation: 'p',
        unit: 'px',
        // We set the PDF format to the actual size of the content 
        // so it's one long continuous page (standard for AI reports)
        format: [canvas.width / 2, canvas.height / 2], 
      });
  
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
  
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Full-AI-Damage-Report-${Date.now()}.pdf`);
  
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      // Restore original style
             element.style.height = originalStyle;
        setIsAnalyzing(false)
             
    }
  };
  return (
    <div className="MainContent w-[1157px] flex-1 items-start gap-6 p-8 overflow-y-auto scrollbar-hide font-['Stack_Sans_Headline']">
      {/* Header Section */}
      {open && (
        <AIDamageReportSlider
          isOpen={open}
          src={
            aiResult?.annotated_images?.[selectedImageIndex] ||
            previews[selectedImageIndex]
          }
          onClose={() => setOpen(false)}
          selectedType={assessmentType}
          data={currentPredictions}
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
            onClick={handleDownloadPDF}
          >
            {/* <img src={Document} alt="" /> */}
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
                      {/* <input
                        type="file"
                        multiple
                        ref={fileInputRef}
                        className="hidden"
                        onChange={handleFileChange}
                        accept="image/*"
                      /> */}
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
            <div className="space-y-6">
              <div className="flex gap-4">
                <DamageSummaryRow
                  label="Total Damages Identified"
                  value={
                    aiResult.normalized_report
                      ?.total_damaged_points_identified || 0
                  }
                />
                <DamageSummaryRow
                  label="High Severity Issues"
                  value={aiResult?.summary?.high_severity_count}
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
                  {/* <button
                    onClick={() => fileInputRef.current?.click()} // just open file picker
                    className="h-8 px-3 py-2 bg-white rounded outline outline-1 outline-blue-600 text-blue-600 text-sm flex items-center gap-2"
                  >
                    <input
                      type="file"
                      multiple
                      ref={fileInputRef}
                      className="hidden"
                      onChange={handleFileChange}
                      accept="image/*"
                    />
                    <img src={Plus} alt="" /> Add More Images
                  </button> */}
                </div>
                {/* <div className="w-full bg-neutral-100 rounded-lg flex justify-center items-center">
                  <img
                    src={
                      aiResult.annotated_images?.[0]?.file_path || previews[0]
                    }
                    className="max-h-[350px] object-fit"
                  />
                </div> */}
                <div className="flex bg-neutral-50  justify-between items-center mb-4">
                      {aiResult.annotated_images?.length > 1 &&
                        <button
                          onClick={() =>
                            setSelectedImageIndex((prev) => Math.max(prev - 1, 0))
                          }
                          disabled={selectedImageIndex === 0}
                          className="px-2 py-1 bg-gray-200 rounded disabled:opacity-50"
                        >
                          ◀
                        </button>}
                  <div className="w-full bg-neutral-50 rounded-lg flex justify-center items-center">
                    <img
                      src={
                        aiResult.annotated_images?.[selectedImageIndex]
                          ?.file_path || previews[selectedImageIndex]
                      }
                      className="max-h-[350px] object-cover"
                    />
                      </div>
                      {aiResult.annotated_images?.length > 1 &&
                        <button
                          onClick={() =>
                            setSelectedImageIndex((prev) =>
                              Math.min(prev + 1, previews.length - 1),
                            )
                          }
                          disabled={selectedImageIndex === previews.length - 1}
                          className="px-2 py-1 bg-gray-200 rounded disabled:opacity-50"
                        >
                          ▶
                        </button>}
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
                  {/* <div className="flex p-4 text-sm items-center">
                    <div className="w-36">
                      {aiResult.normalized_report?.damage_side}
                    </div>
                    <div className="w-40">
                      {aiResult.normalized_report?.area_of_damage}
                    </div>
                    <div className="w-44">
                      {aiResult.normalized_report?.type_of_damage}
                    </div>
                    <div className="w-32">
                      <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-bold">
                        {aiResult.normalized_report?.severity}
                      </span>
                    </div>
                    <div className="w-28">
                      {aiResult.normalized_report?.confidence_percent}%
                    </div>
                    <div>
                      {aiResult.normalized_report?.suggested_repair_action}
                    </div>
                  </div> */}
                  {/* {aiResult.predictions?.map((item: any, index: number) => (
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
                        {item.damage_type === "dent"
                          ? "Repair & paint"
                          : item.damage_type === "broken"
                            ? "Replace part"
                            : "Inspect"}
                      </div>
                    </div>
                  ))} */}
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
                        {item.damage_type === "dent"
                          ? "Repair & paint"
                          : item.damage_type === "broken"
                            ? "Replace part"
                            : "Inspect"}
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