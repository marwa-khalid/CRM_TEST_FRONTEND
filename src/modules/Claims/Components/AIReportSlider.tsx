import React, { useState,useRef } from "react";
import {
  X,
  Download,
  FileText,
  Mail,
  Printer,
  ChevronDown,
} from "lucide-react";
import type2 from "../../../assets/AutoClaim_icon/Processing.svg";

import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
interface DamageDetection {
  width: number;
  height: number;
  x: number;
  y: number;
  confidence: number;
  class: string;
  detection_id: string;
  part: string;
  damage_type: string;
  severity: "High" | "Medium" | "Low";
  side: string;
}
import BlackFront from "../../../assets/Black/Group.svg";
import CheckIcon from "../../../assets/AutoClaim_icon/checkgreen.svg";
import BlackRear from "../../../assets/Black/Group-1.svg";
import BlackRoof from "../../../assets/Black/Group-2.svg";
import BlackNearsideFront from "../../../assets/Black/Group-3.svg";
import BlackNearsideMiddle from "../../../assets/Black/Group-4.svg";
import BlackNearsideRear from "../../../assets/Black/Group-5.svg";
import BlackOffsideFront from "../../../assets/Black/Group-6.svg";
import BlackOffsideMiddle from "../../../assets/Black/Group-7.svg";
import BlackOffsideRear from "../../../assets/Black/Group-8.svg";
interface SliderProps {
  isOpen: boolean;
  src: any;
  onClose: () => void;
  selectedType: string;
  data: DamageDetection[];
}

const AIDamageReportSlider: React.FC<SliderProps> = ({
  isOpen,
  src,
  onClose,
  selectedType,
  data,
}) => {
  const [activeVehicle, setActiveVehicle] = useState(selectedType);

  if (!isOpen) return null;

  // Dynamic Stats from API Data
  const total = data.length;
  const high = data.filter((d) => d.severity === "High").length;
  const med = data.filter((d) => d.severity === "Medium").length;
    const low = data.filter((d) => d.severity === "Low").length;
    console.log(data);
    const reference = localStorage.getItem("CaseReference")
    const sideCounts = data.reduce((acc, item) => {
      const side = item.side;
      acc[side] = (acc[side] || 0) + 1;
      return acc;
    }, {});


    const reportRef = useRef<HTMLDivElement>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

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
    <>
      {/* Overlay Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Slide-out Panel */}
      <div
        ref={reportRef}
        className={`fixed top-0 right-0 h-full w-[1000px] max-w-[95vw] bg-white z-50 shadow-2xl transform transition-transform duration-300 ease-in-out overflow-y-auto ${isOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        {/* Header Section (Matching Figma) */}
        <div className="px-6 py-5 bg-white shadow-sm flex justify-between items-start sticky top-0 z-10">
          <div className="flex-1 flex flex-col gap-3.5">
            <div className="flex justify-between items-start">
              <h1 className="text-black text-2xl font-weight-600 font-['Stack_Sans_Headline'] leading-6">
                AI Vehicle Damage Full Report
              </h1>
              <div className="flex items-center gap-3.5">
                <div className="flex gap-3.5 border-r border-gray-200 pr-3.5 hide-in-pdf">
                  <button
                    className="h-8 px-3 py-2 bg-blue-50 rounded flex items-center gap-2 text-blue-600 text-sm font-weight-400"
                    onClick={handleDownloadPDF}
                  >
                    <Download className="w-4 h-4" /> Download PDF
                  </button>
                  <button className="h-8 px-3 py-2 bg-blue-50 rounded flex items-center gap-2 text-blue-600 text-sm font-weight-400">
                    <FileText className="w-4 h-4" /> Save to Claim
                  </button>
                </div>
                <div className="flex gap-3.5 hide-in-pdf">
                  {/* <button className="h-8 p-2 rounded flex items-center gap-2 text-blue-400 text-sm">
                    <Mail className="w-4 h-4" /> Email
                  </button>
                  <button className="h-8 p-2 rounded flex items-center gap-2 text-blue-400 text-sm">
                    <Printer className="w-4 h-4" /> Print
                  </button> */}
                  <button
                    onClick={onClose}
                    className="p-2 hover:bg-gray-100 rounded-full ml-4"
                  >
                    <X className="w-6 h-6 text-gray-400" />
                  </button>
                </div>
              </div>
            </div>

            {/* ID Bar */}
            <div className="p-2 bg-blue-50 rounded flex gap-4">
              <span className="text-gray-600 text-sm">
                Claim ID: <span className="font-weight-600">{reference}</span>
              </span>
              <span className="text-gray-600 text-sm">
                Report ID:{" "}
                <span className="font-weight-600">RPT-AI-00847-002</span>
              </span>
              <span className="text-gray-600 text-sm">
                Generated:{" "}
                <span className="font-weight-600">09 Mar 2026, 19:25</span>
              </span>
            </div>

            <div className="px-2 text-gray-500 text-[11px]">
              Uploaded By:{" "}
              <span className="text-blue-600 font-weight-600">
                Marwa Khalid
              </span>{" "}
              • File Name:{" "}
              <span className="font-weight-600 text-gray-700">
                {src.original_filename}
              </span>{" "}
              • Source:{" "}
              <span className="font-weight-600 text-gray-700">
                Claim Portal
              </span>{" "}
              - 02-22-26 5:30PM
            </div>
          </div>
        </div>

        <div className="p-6 flex flex-col gap-6">
          {/* Vehicle Selection Section */}
          <div className="flex gap-6 w-[788px]">
            {/* <div
              className={`flex-1 p-5 rounded-lg border transition-all ${activeVehicle === "client" ? "bg-blue-50 border-blue-200" : "bg-blue-100"}`}
            >
              <h3 className="text-black text-xl font-weight-600 leading-5 mb-1">
                Client Vehicle
              </h3>
              {/* <p className="text-gray-600 text-sm">
                Reg#{" "}
                <span className="font-weight-600 text-gray-700 text-sm">
                  AB21 CDE, Toyota Camry-2022, Black
                </span>
              </p> 
            </div> */}
            {/* <div
              className={`flex-1 p-5 rounded-lg border transition-all ${activeVehicle === "third_party" ? "bg-blue-50 border-blue-200" : "bg-white border-gray-200"}`}
            >
              <h3 className="text-black text-xl font-weight-600 leading-5 mb-1">
                Third party Vehicle
              </h3>
              <p className="text-gray-600 text-sm">
                Reg#{" "}
                <span className="font-weight-600 text-gray-700 text-sm">
                  AB21 CDE, Honda Accord-2022, White
                </span>
              </p>
            </div> */}
          </div>

          {/* Main Damage Table */}
          <div className="rounded-lg border border-gray-200">
            <div className="grid grid-cols-7 gap-2 p-4 bg-white font-weight-600 text-gray-800 text-sm border-b">
              <div>DAMAGE SIDE</div>
              <div>AREA OF DAMAGE</div>
              <div>TYPE OF DAMAGE</div>
              <div>SEVERITY</div>
              <div>CONFIDENCE</div>
              <div>DAMAGED POINTS</div>
              <div>SUGGESTED REPAIR</div>
            </div>
            <div className="divide-y divide-gray-100">
              {data.map((det) => (
                <div
                  key={det.detection_id}
                  className="grid grid-cols-7 gap-2 p-4 items-center text-sm text-gray-700 bg-white"
                >
                  <div className="capitalize">{det.side}</div>
                  <div className="font-weight-400 capitalize">{det.part}</div>
                  <div className="capitalize">{det.damage_type}</div>
                  <div>
                    <span
                      className={`px-2 py-1 rounded text-xs font-weight-600 ${
                        det.severity === "High"
                          ? "bg-red-50 text-red-700"
                          : "bg-green-50 text-green-700"
                      }`}
                    >
                      {det.severity}
                    </span>
                  </div>
                  <div>{(det.confidence * 100).toFixed(0)}%</div>
                  <div>1</div>
                  <div className="font-weight-400">Repair</div>
                </div>
              ))}
            </div>
          </div>
          {console.log(sideCounts)!}
          {/* Image Detection Preview */}
          <div className="p-4 rounded-lg border border-gray-100 flex flex-col gap-4">
            <div>
              <h3 className="text-black text-xl font-weight-600 leading-5">
                Images with AI Detection
              </h3>
              {/* <p className="text-gray-500 text-sm mt-1">1 image • Uploaded</p> */}
            </div>
            <div className="h-80 bg-gray-100 rounded-lg flex items-center justify-center relative overflow-hidden">
              <img
                src={src.file_path}
                className="h-full object-contain"
                alt="AI detection output"
              />
            </div>
            <div className="flex gap-4">
              <LegendItem color="bg-red-600" label="High Severity" />
              <LegendItem color="bg-orange-500" label="Medium Severity" />
              <LegendItem color="bg-green-500" label="Low Severity" />
            </div>
          </div>

          {/* Damage Stats Cards */}
          <div className="p-4 rounded-lg border border-neutral-200 flex flex-col gap-5">
            <h3 className="text-black text-xl font-weight-600 leading-5">
              Damage By Severity
            </h3>
            <div className="flex gap-5">
              <StatBox
                label="Total Damages"
                count={total}
                color="border-gray-200"
              />
              <StatBox
                label="High Severity"
                count={high}
                color="border-red-500"
              />
              <StatBox
                label="Medium Severity"
                count={med}
                color="border-orange-400"
              />
              <StatBox
                label="Low Severity"
                count={low}
                color="border-green-500"
              />
            </div>
          </div>
          <div className="px-4 py-3 rounded-lg  border border-neutral-200 inline-flex flex-col justify-start items-start gap-6">
            <div
              data-layer="Damage By Location"
              className="DamageByLocation justify-start text-black text-xl font-weight-600 font-['Stack_Sans_Headline'] leading-5"
            >
              Damage By Location
            </div>
            <div className="grid grid-cols-3 w-full inline-flex justify-start items-center gap-4">
              <div className="   h-44 p-4 bg-white rounded-lg border border-neutral-200 inline-flex flex-col justify-end items-center gap-6">
                <div
                  data-layer="2"
                  className="justify-start text-neutral-900 text-2xl font-weight-600 font-['Stack_Sans_Headline'] leading-6 border-neutral-200"
                >
                  {sideCounts["Front"] || "0"}
                </div>
                <img src={BlackFront} alt="" />
                <div
                  data-layer="Front"
                  className="Front justify-start text-neutral-700 text-sm font-weight-300 font-light font-['Stack_Sans_Headline']"
                >
                  Front
                </div>
              </div>
              <div
                data-layer="Frame 1171277714"
                className="Frame1171277714  h-44 p-4 bg-white rounded-lg border border-neutral-200 inline-flex flex-col justify-start items-center gap-6"
              >
                <div
                  data-layer="0"
                  className="justify-start text-neutral-900 text-2xl font-weight-600 font-['Stack_Sans_Headline'] leading-6 border-neutral-200"
                >
                  {sideCounts["Rear"] || "0"}
                </div>
                <img src={BlackRear} alt="" />
                <div
                  data-layer="Rear"
                  className="Rear justify-start text-neutral-700 text-sm font-weight-300 font-light font-['Stack_Sans_Headline']"
                >
                  Rear
                </div>
              </div>
              <div
                data-layer="Frame 1171277715"
                className="Frame1171277715 h-44 p-4 bg-white rounded-lg border border-neutral-200 inline-flex flex-col justify-end items-center gap-3"
              >
                <div
                  data-layer="0"
                  className="justify-start text-neutral-900 text-2xl font-weight-600 font-['Stack_Sans_Headline'] leading-6 border-neutral-200"
                >
                  {sideCounts["Roof"] || "0"}
                </div>
                <img src={BlackRoof} alt="" />

                <div
                  data-layer="Roof"
                  className="Roof justify-start text-neutral-700 text-sm font-weight-300 font-light font-['Stack_Sans_Headline']"
                >
                  Roof
                </div>
              </div>
            </div>
            <div
              data-layer="Frame 1171277720"
              className="grid grid-cols-3 w-full  inline-flex justify-start items-center gap-4"
            >
              <div
                data-layer="Frame 1171277712"
                className="Frame1171277712 w-74  h-44 p-4 bg-white rounded-lg border border-neutral-200 inline-flex flex-col justify-center items-center gap-6"
              >
                <div
                  data-layer="0"
                  className="justify-start text-neutral-900 text-2xl font-weight-600 font-['Stack_Sans_Headline'] leading-6 border-neutral-200"
                >
                  {sideCounts["Nearside Front"] || "0"}
                </div>

                <img src={BlackNearsideFront} alt="" />
                <div
                  data-layer="Nearside Front"
                  className="NearsideFront justify-start text-neutral-700 text-sm font-weight-300 font-light font-['Stack_Sans_Headline']"
                >
                  Nearside Front
                </div>
              </div>
              <div
                data-layer="Frame 1171277713"
                className="Frame1171277713 w-74  h-44 p-4 bg-white rounded-lg border border-neutral-200 inline-flex flex-col justify-center items-center gap-6"
              >
                <div
                  data-layer="0"
                  className="justify-start text-neutral-900 text-2xl font-weight-600 font-['Stack_Sans_Headline'] leading-6 border-neutral-200"
                >
                  {sideCounts["Nearside Middle"] || "0"}
                </div>
                <img src={BlackNearsideMiddle} alt="" />

                <div
                  data-layer="Nearside Middle"
                  className="NearsideMiddle justify-start text-neutral-700 text-sm font-weight-300 font-light font-['Stack_Sans_Headline']"
                >
                  Nearside Middle
                </div>
              </div>
              <div
                data-layer="Frame 1171277714"
                className="Frame1171277714 w-74  h-44 p-4 bg-white rounded-lg border border-neutral-200 inline-flex flex-col justify-center items-center gap-6"
              >
                <div
                  data-layer="0"
                  className="justify-start text-neutral-900 text-2xl font-weight-600 font-['Stack_Sans_Headline'] leading-6 border-neutral-200"
                >
                  {sideCounts["Nearside Rear"] || "0"}
                </div>
                <img src={BlackNearsideRear} alt="" />
                <div
                  data-layer="Nearside Rear"
                  className="NearsideRear justify-start text-neutral-700 text-sm font-weight-300 font-light font-['Stack_Sans_Headline']"
                >
                  Nearside Rear
                </div>
              </div>
            </div>
            <div
              data-layer="Frame 1171277718"
              className="grid grid-cols-3 w-full  inline-flex justify-start items-center gap-4"
            >
              <div
                data-layer="Frame 1171277715"
                className="Frame1171277715 w-74  h-44 p-4 bg-white rounded-lg border border-neutral-200 inline-flex flex-col justify-center items-center gap-6"
              >
                <div
                  data-layer="0"
                  className="justify-start text-neutral-900 text-2xl font-weight-600 font-['Stack_Sans_Headline'] leading-6 border-neutral-200"
                >
                  {sideCounts["Offside Front"] || "0"}
                </div>
                <img src={BlackOffsideFront} alt="" />

                <div
                  data-layer="Offside Front"
                  className="OffsideFront justify-start text-neutral-700 text-sm font-weight-300 font-light font-['Stack_Sans_Headline']"
                >
                  Offside Front
                </div>
              </div>
              <div
                data-layer="Frame 1171277716"
                className="Frame1171277716 w-74  h-44 p-4 bg-white rounded-lg border border-neutral-200 inline-flex flex-col justify-end items-center gap-6"
              >
                <div
                  data-layer="0"
                  className="justify-start text-neutral-900 text-2xl font-weight-600 font-['Stack_Sans_Headline'] leading-6 border-neutral-200"
                >
                  {sideCounts["Offside Middle"] || "0"}
                </div>
                <img src={BlackOffsideMiddle} alt="" />
                <div
                  data-layer="Offside Middle"
                  className="OffsideMiddle justify-start text-neutral-700 text-sm font-weight-300 font-light font-['Stack_Sans_Headline']"
                >
                  Offside Middle
                </div>
              </div>
              <div
                data-layer="Frame 1171277717"
                className="Frame1171277717 w-74  h-44 p-4 bg-white rounded-lg border border-neutral-200 inline-flex flex-col justify-end items-center gap-6"
              >
                <div
                  data-layer="0"
                  className="justify-start text-neutral-900 text-2xl font-weight-600 font-['Stack_Sans_Headline'] leading-6 border-neutral-200"
                >
                  {sideCounts["Offside Rear"] || "0"}
                </div>
                <img src={BlackOffsideRear} alt="" />
                <div
                  data-layer="Offside Rear"
                  className="OffsideRear justify-start text-neutral-700 text-sm font-weight-300 font-light font-['Stack_Sans_Headline']"
                >
                  Offside Rear
                </div>
              </div>
            </div>
          </div>
          {/* Audit Trail (Matching Design) */}
          <div className="p-4 rounded-lg border border-gray-200 flex flex-col gap-5">
            <h3 className="text-black text-xl font-weight-600 leading-5">
              Audit Trail
            </h3>
            <div className="border border-gray-100 rounded-lg overflow-hidden">
              <div className="flex justify-between p-4 bg-white border-b font-weight-600 text-gray-800 text-sm">
                <div className="flex gap-2">
                  <div className="w-64">DONE BY</div>
                  <div className="w-80">ACTION</div>
                </div>
                <div>TIMESTAMP</div>
              </div>
              <div className="flex justify-between p-4 text-sm text-gray-600">
                <div className="flex gap-2">
                  <div className="w-64">Marwa Khalid</div>
                  <div className="w-80">Generated Report</div>
                </div>
                <div>20-03-26 . 4:39PM</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* {isAnalyzing && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-9999">
          <div className="bg-red p-6 rounded-xl flex flex-col items-center gap-4 ">
          
            <img
              src={type2}
              className="w-16 h-16 animate-spin"
              style={{ animationDuration: "2s" }}
            />
            <div className="text-blue-200 text-sm font-weight-400">
              Downloading pdf...
            </div>
          </div>
        </div>
      )} */}
    </>
  );
};

// Sub-components for cleaner code
const LegendItem = ({ color, label }: { color: string; label: string }) => (
  <div className="flex items-center gap-1.5">
    <div className={`w-4 h-4 rounded-full ${color}`} />
    <span className="text-gray-700 text-sm">{label}</span>
  </div>
);

const StatBox = ({
  label,
  count,
  color,
}: {
  label: string;
  count: number;
  color: string;
}) => (
  <div
    className={`flex-1 p-4 rounded-lg border ${color} bg-white flex flex-col gap-1`}
  >
    <div className="text-gray-700 text-2xl font-weight-600 leading-6">
      {count}
    </div>
    <div className="text-gray-600 text-sm">{label}</div>
  </div>
);

export default AIDamageReportSlider;
