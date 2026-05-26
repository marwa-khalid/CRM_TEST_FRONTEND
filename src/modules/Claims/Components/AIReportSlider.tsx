import React, { useMemo, useRef } from "react";
import { X, Download, FileText } from "lucide-react";

import BlackFront from "../../../assets/Black/Group.svg";
import BlackRear from "../../../assets/Black/Group-1.svg";
import BlackRoof from "../../../assets/Black/Group-2.svg";
import BlackNearsideFront from "../../../assets/Black/Group-3.svg";
import BlackNearsideMiddle from "../../../assets/Black/Group-4.svg";
import BlackNearsideRear from "../../../assets/Black/Group-5.svg";
import BlackOffsideFront from "../../../assets/Black/Group-6.svg";
import BlackOffsideMiddle from "../../../assets/Black/Group-7.svg";
import BlackOffsideRear from "../../../assets/Black/Group-8.svg";

interface DamageDetection {
  width?: number;
  height?: number;
  x?: number;
  y?: number;
  confidence?: number | string;
  class?: string;
  detection_id?: string;
  part?: string;
  area?: string;
  area_of_damage?: string;
  damage_type?: string;
  type_of_damage?: string;
  type?: string;
  severity?: "High" | "Medium" | "Low" | string;
  side?: string;
  damage_side?: string;
  points?: number;
  suggested_repair?: string;
  repair?: string;
  image_index?: number;
}

interface AuditTrailItem {
  doneBy?: string;
  action?: string;
  timestamp?: string;
}

interface ReportImageItem {
  image_index?: number;
  original_filename?: string;
  original_image_url?: string;
  annotated_image_url?: string;
  report_pdf_url?: string;
  predictions?: DamageDetection[];
  report_id?: string | number;
  generated_at?: string;
  uploaded_by?: string;
  source_name?: string;
  assessment_type?: string;
  audit_trail?: AuditTrailItem[];
}

interface CollectiveReportData {
  report_id?: string | number;
  report_pdf_url?: string;
  pdf_report_url?: string;
  generated_at?: string;
  images?: ReportImageItem[];
  predictions?: DamageDetection[];
  all_predictions?: DamageDetection[];
  uploaded_by?: string;
  source_name?: string;
  assessment_type?: string;
  audit_trail?: AuditTrailItem[];
}

interface SliderProps {
  isOpen: boolean;
  reportData?: CollectiveReportData | null;
  currentImage?: ReportImageItem | null;
  onClose: () => void;
  selectedType?: string;
  claimReference?: string;
  clientName?: string;
  sourceName?: string;
}

const locationConfig = [
  { key: "Front", label: "Front", image: BlackFront },
  { key: "Rear", label: "Rear", image: BlackRear },
  { key: "Roof", label: "Roof", image: BlackRoof },
  { key: "Nearside Front", label: "Nearside Front", image: BlackNearsideFront },
  {
    key: "Nearside Middle",
    label: "Nearside Middle",
    image: BlackNearsideMiddle,
  },
  { key: "Nearside Rear", label: "Nearside Rear", image: BlackNearsideRear },
  { key: "Offside Front", label: "Offside Front", image: BlackOffsideFront },
  { key: "Offside Middle", label: "Offside Middle", image: BlackOffsideMiddle },
  { key: "Offside Rear", label: "Offside Rear", image: BlackOffsideRear },
];

const getSuggestedRepair = (damageType?: string) => {
  const type = String(damageType || "").toLowerCase();
  if (type === "dent") return "Repair & paint";
  if (type === "broken") return "Replace part";
  if (type === "crash") return "Replace or major repair";
  if (type === "scratch") return "Paint / polish";
  if (type === "shattered") return "Replace glass";
  return "Inspect";
};

const formatDateTime = (value?: string) => {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString();
};

const normalizeSeverity = (severity?: string) => {
  const value = String(severity || "").toLowerCase();
  if (value === "high") return "High";
  if (value === "medium") return "Medium";
  if (value === "low") return "Low";
  return "-";
};

const formatConfidence = (confidence: any) => {
  if (confidence === undefined || confidence === null) return "-";
  if (String(confidence).includes("%")) return confidence;
  const value = Number(confidence);
  if (Number.isNaN(value)) return "-";
  if (value <= 1) return `${(value * 100).toFixed(0)}%`;
  return `${value.toFixed(0)}%`;
};

/**
 * Print-only stylesheet. Hides everything except the slider, then forces
 * the slider to render as a normal block at full scroll height so the
 * browser paints it as one continuous PDF page (no slicing, no missing
 * sections, no broken images — because the browser itself is doing the
 * rendering, exactly as it does on screen).
 */
const PRINT_STYLES = `
  @media print {
    @page {
      size: 240mm auto;
      margin: 10mm;
    }

    /* Hide everything by default. */
    body * {
      visibility: hidden;
    }

    /* Show only the slider and its descendants. */
    [data-pdf-root],
    [data-pdf-root] * {
      visibility: visible;
    }

    /* Hide action buttons inside the slider. */
    [data-pdf-hide],
    [data-pdf-hide] * {
      visibility: hidden !important;
      display: none !important;
    }

    /* Un-fix the slider so the browser captures full content height. */
    [data-pdf-root] {
      position: absolute !important;
      top: 0 !important;
      left: 0 !important;
      right: auto !important;
      width: 100% !important;
      max-width: none !important;
      height: auto !important;
      max-height: none !important;
      overflow: visible !important;
      box-shadow: none !important;
      transform: none !important;
    }

    /* Hide the dark backdrop. */
    [data-pdf-backdrop] {
      display: none !important;
    }

    /* Un-stick the slider header. */
    [data-pdf-root] .sticky {
      position: static !important;
    }

    /* Prevent sections from being split across pages where possible. */
    [data-pdf-section] {
      break-inside: avoid;
      page-break-inside: avoid;
    }
  }
`;

const AIDamageReportSlider: React.FC<SliderProps> = ({
  isOpen,
  reportData,
  currentImage,
  onClose,
  selectedType,
  claimReference,
  clientName,
  sourceName,
}) => {
  const sliderRef = useRef<HTMLDivElement>(null);

  const fallbackReportId = useMemo(() => {
    const datePart = new Date().toISOString().slice(0, 7).replace("-", "");
    const randomPart = Math.random().toString(36).slice(2, 8).toUpperCase();
    return `RPT-${datePart}-${randomPart}`;
  }, []);

  const imageItems = useMemo(() => {
    if (reportData?.images?.length) return reportData.images;
    if (currentImage) return [currentImage];
    return [];
  }, [reportData?.images, currentImage]);

  const data = useMemo(() => {
    if (reportData?.predictions?.length) return reportData.predictions;
    if (reportData?.all_predictions?.length) return reportData.all_predictions;
    const rowsFromImages = imageItems.flatMap((image, imageIndex) =>
      (image.predictions || []).map((prediction) => ({
        ...prediction,
        image_index: prediction.image_index ?? image.image_index ?? imageIndex,
      })),
    );
    if (rowsFromImages.length > 0) return rowsFromImages;
    return currentImage?.predictions || [];
  }, [
    reportData?.predictions,
    reportData?.all_predictions,
    imageItems,
    currentImage?.predictions,
  ]);

  const total = data.length;
  const high = data.filter(
    (d) => normalizeSeverity(d.severity) === "High",
  ).length;
  const med = data.filter(
    (d) => normalizeSeverity(d.severity) === "Medium",
  ).length;
  const low = data.filter(
    (d) => normalizeSeverity(d.severity) === "Low",
  ).length;

  const reference = claimReference || "-";
  const reportId =
    reportData?.report_id || currentImage?.report_id || fallbackReportId;
  const generatedAt = formatDateTime(
    reportData?.generated_at || currentImage?.generated_at,
  );
  const uploadedBy =
    reportData?.uploaded_by ||
    currentImage?.uploaded_by ||
    clientName ||
    "Client";
  const source =
    reportData?.source_name ||
    currentImage?.source_name ||
    sourceName ||
    "AI Assessment";
  const assessmentLabel =
    reportData?.assessment_type ||
    currentImage?.assessment_type ||
    selectedType ||
    "-";

  const auditTrail = reportData?.audit_trail?.length
    ? reportData.audit_trail
    : currentImage?.audit_trail?.length
      ? currentImage.audit_trail
      : [
          {
            doneBy: uploadedBy || "System",
            action: "Generated Collective AI Report",
            timestamp:
              reportData?.generated_at ||
              currentImage?.generated_at ||
              new Date().toISOString(),
          },
        ];

  const sideCounts = useMemo(() => {
    return data.reduce(
      (acc: Record<string, number>, item: any) => {
        const side = item.side || item.damage_side || "-";
        acc[side] = (acc[side] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );
  }, [data]);

  const handleDownloadPDF = () => {
    // Give the browser one tick to apply scroll state, then open native print
    // dialog. User picks "Save as PDF" as the destination.
    setTimeout(() => window.print(), 50);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Inject print-only styles. */}
      <style>{PRINT_STYLES}</style>

      <div
        data-pdf-backdrop
        className="fixed inset-0 bg-black/50 z-40 transition-opacity"
        onClick={onClose}
      />

      <div
        ref={sliderRef}
        data-pdf-root
        className={`fixed top-0 right-0 h-full w-[900px] max-w-[95vw] bg-white z-50 shadow-2xl transform transition-transform duration-300 ease-in-out overflow-y-auto ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="px-6 py-5 bg-white shadow-sm flex justify-between items-start sticky top-0 z-10">
          <div className="flex-1 flex flex-col gap-3.5">
            <div className="flex justify-between items-start">
              <h1 className="text-neutral-900 text-[24px] font-weight-600 font-['Stack_Sans_Headline'] leading-6">
                AI Vehicle Damage Full Report
              </h1>

              <div className="flex items-center gap-3.5" data-pdf-hide>
                <div className="flex gap-3.5 border-r border-gray-200 pr-3.5">
                  <button
                    className="h-8 px-3 py-2 bg-blue-50 rounded flex items-center gap-2 text-blue-600 text-sm font-weight-400 disabled:opacity-50"
                    onClick={handleDownloadPDF}
                  >
                    <Download className="w-4 h-4" />
                    Download PDF
                  </button>

                  <button className="h-8 px-3 py-2 bg-blue-50 rounded flex items-center gap-2 text-blue-600 text-sm font-weight-400 disabled:opacity-50">
                    <FileText className="w-4 h-4" />
                    Save to Claim
                  </button>
                </div>

                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 rounded-full ml-4"
                >
                  <X className="w-6 h-6 text-gray-400" />
                </button>
              </div>
            </div>

            <div className="p-2 bg-blue-50 rounded flex gap-4 flex-wrap">
              <span className="text-gray-600 text-sm">
                Claim ID: <span className="font-weight-600">{reference}</span>
              </span>
              <span className="text-gray-600 text-sm">
                Report ID: <span className="font-weight-600">{reportId}</span>
              </span>
              <span className="text-gray-600 text-sm">
                Generated:{" "}
                <span className="font-weight-600">{generatedAt}</span>
              </span>
              <span className="text-gray-600 text-sm">
                Assessment Type:{" "}
                <span className="font-weight-600">{assessmentLabel}</span>
              </span>
            </div>

            <div className="px-2 text-gray-500 text-[11px]">
              Uploaded By:{" "}
              <span className="text-blue-600 font-weight-600">
                {uploadedBy}
              </span>{" "}
              • File Name:{" "}
              <span className="font-weight-600 text-gray-700">AI Report</span> •
              Source:{" "}
              <span className="font-weight-600 text-gray-700">{source}</span>
            </div>
          </div>
        </div>

        <div className="p-6 flex flex-col gap-6">
          <div
            data-pdf-section
            className="p-4 rounded-lg border border-gray-100 flex flex-col gap-4"
          >
            <div>
              <h3 className="text-neutral-900 text-[20px] font-weight-600 leading-5">
                Images with AI Detection
              </h3>
              <p className="text-gray-500 text-sm mt-1">
                {imageItems.length} image{imageItems.length !== 1 ? "s" : ""} •
                Uploaded
              </p>
            </div>

            <div className="w-full bg-neutral-100 rounded-lg p-3">
              {imageItems.length > 0 ? (
                <div className="grid grid-cols-6 gap-2">
                  {imageItems.map((image, index) => {
                    const imageUrl =
                      image.annotated_image_url ||
                      image.original_image_url ||
                      "";
                    return (
                      <div
                        key={image.image_index ?? index}
                        className="h-[155px] rounded overflow-hidden bg-white border border-neutral-200"
                      >
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            alt={`AI Detection ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-sm text-gray-400">
                            No image
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="h-40 flex items-center justify-center text-sm text-gray-500">
                  No images available.
                </div>
              )}
            </div>

            <div className="flex gap-4">
              <LegendItem
                color="bg-red-600"
                label={`High Severity (${high})`}
              />
              <LegendItem
                color="bg-orange-500"
                label={`Medium Severity (${med})`}
              />
              <LegendItem
                color="bg-green-500"
                label={`Low Severity (${low})`}
              />
            </div>
          </div>

          <div
            data-pdf-section
            className="p-4 rounded-lg border border-gray-100 flex flex-col gap-4"
          >
            <h3 className="text-neutral-900 text-[20px] font-weight-600 leading-5">
              Damage Summary
            </h3>

            <div className="rounded-lg border border-gray-200 overflow-hidden">
              <div className="grid grid-cols-[1fr_1.2fr_1.2fr_90px_90px_90px_1.3fr] gap-2 p-4 bg-white font-weight-600 text-gray-800 text-sm border-b">
                <div>DAMAGE SIDE</div>
                <div>AREA OF DAMAGE</div>
                <div>TYPE OF DAMAGE</div>
                <div>SEVERITY</div>
                <div>CONFIDENCE</div>
                <div>POINTS</div>
                <div>SUGGESTED REPAIR</div>
              </div>

              <div className="divide-y divide-gray-100">
                {data.length > 0 ? (
                  data.map((det: any, idx: number) => {
                    const severity = normalizeSeverity(det.severity);
                    const damageType =
                      det.damage_type || det.type_of_damage || det.type || "-";

                    return (
                      <div
                        key={det.detection_id || `${det.class}-${idx}`}
                        className="grid grid-cols-[1fr_1.2fr_1.2fr_90px_90px_90px_1.3fr] gap-2 p-4 items-center text-sm text-gray-700 bg-white"
                      >
                        <div className="capitalize">
                          {det.side || det.damage_side || "-"}
                        </div>
                        <div className="capitalize">
                          {det.part || det.area_of_damage || det.area || "-"}
                        </div>
                        <div className="capitalize">{damageType}</div>
                        <div>
                          <span
                            className={`px-2 py-1 rounded text-xs font-weight-600 ${
                              severity === "High"
                                ? "bg-red-100 text-red-500"
                                : severity === "Medium"
                                  ? "bg-orange-100 text-orange-500"
                                  : severity === "Low"
                                    ? "bg-green-100 text-green-500"
                                    : "bg-gray-50 text-gray-500"
                            }`}
                          >
                            {severity}
                          </span>
                        </div>
                        <div>{formatConfidence(det.confidence)}</div>
                        <div>{det.points || 1}</div>
                        <div className="font-weight-400">
                          {det.suggested_repair ||
                            det.repair ||
                            getSuggestedRepair(damageType)}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-6 text-sm text-gray-500">
                    No damages found in this report.
                  </div>
                )}
              </div>
            </div>
          </div>

          <div
            data-pdf-section
            className="p-4 rounded-lg border border-neutral-200 flex flex-col gap-5"
          >
            <h3 className="text-neutral-900 text-[20px] font-weight-600 leading-5">
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

          <div
            data-pdf-section
            className="px-4 py-3 rounded-lg border border-neutral-200 flex flex-col justify-start items-start gap-6"
          >
            <div className="justify-start text-neutral-900 text-[20px] font-weight-600 font-['Stack_Sans_Headline'] leading-5">
              Damage By Location
            </div>

            <div className="grid grid-cols-3 w-full gap-4">
              {locationConfig.map((item) => (
                <LocationBox
                  key={item.key}
                  count={sideCounts[item.key] || 0}
                  image={item.image}
                  label={item.label}
                />
              ))}
            </div>
          </div>

          <div
            data-pdf-section
            className="p-4 rounded-lg border border-gray-200 flex flex-col gap-5"
          >
            <h3 className="text-neutral-900 text-[20px] font-weight-600 leading-5">
              Audit Trail
            </h3>

            <div className="border border-gray-100 rounded-lg overflow-hidden">
              <div className="grid grid-cols-3 gap-3 p-4 bg-white border-b font-weight-600 text-gray-800 text-sm">
                <div>DONE BY</div>
                <div>ACTION</div>
                <div>TIMESTAMP</div>
              </div>

              {auditTrail.map((item, index) => (
                <div
                  key={index}
                  className="grid grid-cols-3 gap-3 p-4 text-sm text-gray-600 border-b last:border-b-0"
                >
                  <div className="min-w-0 break-words pr-2">
                    {item.doneBy || "-"}
                  </div>
                  <div className="min-w-0 break-words pr-2">
                    {item.action || "-"}
                  </div>
                  <div className="min-w-0">
                    {formatDateTime(item.timestamp)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

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

const LocationBox = ({
  count,
  image,
  label,
}: {
  count: number;
  image: string;
  label: string;
}) => (
  <div className="h-44 p-4 bg-white rounded-lg border border-neutral-200 flex flex-col justify-center items-center gap-6">
    <div className="justify-start text-neutral-900 text-2xl font-weight-600 font-['Stack_Sans_Headline'] leading-6">
      {count}
    </div>
    <img src={image} alt={label} />
    <div className="justify-start text-neutral-700 text-sm font-weight-300 font-light font-['Stack_Sans_Headline'] text-center">
      {label}
    </div>
  </div>
);

export default AIDamageReportSlider;
