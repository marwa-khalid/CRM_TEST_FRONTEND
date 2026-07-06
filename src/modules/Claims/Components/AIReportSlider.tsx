import React, { useEffect, useMemo, useRef, useState } from "react";
import { X, Download, FileText, Printer, Mail } from "lucide-react";
import Select from "react-select";
import { customStyles, BlueDropdownIndicator } from "../Steps/GeneralDetailsForm";
import EmailAttachmentModal from "../DocumentsLibrary/EmailAttachmentModal";

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
  report_pdf_s3_key?: string;
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

export interface VehicleInfo {
  registration?: string | null;
  make?: string | null;
  model?: string | null;
  year?: string | number | null;
  color?: string | null;
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
  clientVehicle?: VehicleInfo | null;
  thirdPartyVehicle?: VehicleInfo | null;
  vehicleStatusOptions?: string[];
  onSaveToClaim?: (state: ManualAdjustmentState) => void;
  saving?: boolean;
  /** Persisted manual adjustments to prefill the editor (accept/reject, notes, status). */
  initialAdjustments?: Partial<ManualAdjustmentState> | null;
  /** When true the report renders read-only (no editable Manual Adjustments). */
  readOnly?: boolean;
  /** Off-screen capture mode: plain block, no backdrop/fixed positioning, for html2canvas. */
  captureMode?: boolean;
}

export interface ManualAdjustmentState {
  decisions: Record<string, "accepted" | "rejected">;
  notes: string;
  vehicleStatus: string;
}

const locationConfig = [
  { key: "Front", label: "Front", image: BlackFront },
  { key: "Rear", label: "Rear", image: BlackRear },
  { key: "Roof", label: "Roof", image: BlackRoof },
  { key: "Nearside Front", label: "Nearside Front", image: BlackNearsideFront },
  { key: "Nearside Middle", label: "Nearside Middle", image: BlackNearsideMiddle },
  { key: "Nearside Rear", label: "Nearside Rear", image: BlackNearsideRear },
  { key: "Offside Front", label: "Offside Front", image: BlackOffsideFront },
  { key: "Offside Middle", label: "Offside Middle", image: BlackOffsideMiddle },
  { key: "Offside Rear", label: "Offside Rear", image: BlackOffsideRear },
];

const VEHICLE_STATUS_OPTIONS = ["Roadworthy", "Non-Roadworthy", "Total Loss", "Under Repair"];

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
  return parsed.toLocaleString("en-GB", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
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

const vehicleLine = (v?: VehicleInfo | null) => {
  if (!v) return "";
  const tail = [
    [v.make, v.model].filter(Boolean).join(" "),
    v.year,
    v.color,
  ].filter(Boolean).join(" , ");
  return tail;
};

/**
 * Print-only stylesheet. Hides everything except the slider, then forces it to
 * render as one continuous block so the browser paints it as a single PDF.
 */
const PRINT_STYLES = `
  @media print {
    @page { size: 240mm auto; margin: 10mm; }
    body * { visibility: hidden; }
    [data-pdf-root], [data-pdf-root] * { visibility: visible; }
    [data-pdf-hide], [data-pdf-hide] * { visibility: hidden !important; display: none !important; }
    [data-pdf-root] {
      position: absolute !important; top: 0 !important; left: 0 !important; right: auto !important;
      width: 100% !important; max-width: none !important; height: auto !important; max-height: none !important;
      overflow: visible !important; box-shadow: none !important; transform: none !important;
    }
    [data-pdf-backdrop] { display: none !important; }
    [data-pdf-root] .sticky { position: static !important; }
    [data-pdf-section] { break-inside: avoid; page-break-inside: avoid; }
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
  clientVehicle,
  thirdPartyVehicle,
  vehicleStatusOptions = VEHICLE_STATUS_OPTIONS,
  onSaveToClaim,
  saving = false,
  readOnly = false,
  captureMode = false,
  initialAdjustments = null,
}) => {
  const sliderRef = useRef<HTMLDivElement>(null);

  const fallbackReportId = useMemo(() => {
    const datePart = new Date().toISOString().slice(0, 7).replace("-", "");
    const randomPart = Math.random().toString(36).slice(2, 8).toUpperCase();
    return `RPT-${datePart}-${randomPart}`;
  }, []);

  const allImageItems = useMemo(() => {
    if (reportData?.images?.length) return reportData.images;
    if (currentImage) return [currentImage];
    return [];
  }, [reportData?.images, currentImage]);

  const allData = useMemo(() => {
    if (reportData?.predictions?.length) return reportData.predictions;
    if (reportData?.all_predictions?.length) return reportData.all_predictions;
    const rowsFromImages = allImageItems.flatMap((image, imageIndex) =>
      (image.predictions || []).map((prediction) => ({
        ...prediction,
        image_index: prediction.image_index ?? image.image_index ?? imageIndex,
        vehicle_type: (prediction as any).vehicle_type ?? (image as any).vehicle_type,
      })),
    );
    if (rowsFromImages.length > 0) return rowsFromImages;
    return currentImage?.predictions || [];
  }, [reportData?.predictions, reportData?.all_predictions, allImageItems, currentImage?.predictions]);

  const reference = claimReference || "-";
  const reportId = reportData?.report_id || currentImage?.report_id || fallbackReportId;
  const generatedAt = formatDateTime(reportData?.generated_at || currentImage?.generated_at);
  const uploadedBy = reportData?.uploaded_by || currentImage?.uploaded_by || clientName || "Client";
  const source = reportData?.source_name || currentImage?.source_name || sourceName || "Upload";
  const assessmentLabel = reportData?.assessment_type || currentImage?.assessment_type || selectedType || "-";

  const showClientCard = assessmentLabel !== "Third Party Vehicle Only";
  const showThirdPartyCard =
    assessmentLabel === "Both" || assessmentLabel === "Third Party Vehicle Only";

  // Per-vehicle switching: when the report carries vehicle_type tags AND both
  // cards are shown ("Both"), the vehicle cards act as tabs that filter the
  // images/damages to the selected vehicle.
  const hasVehicleTags = useMemo(
    () =>
      allImageItems.some((img: any) => img.vehicle_type) ||
      allData.some((d: any) => d.vehicle_type),
    [allImageItems, allData],
  );
  const canSwitch = hasVehicleTags && showClientCard && showThirdPartyCard;
  const [selectedVehicle, setSelectedVehicle] = useState<"client" | "third_party">("client");
  useEffect(() => {
    setSelectedVehicle(showClientCard ? "client" : "third_party");
  }, [showClientCard, showThirdPartyCard, assessmentLabel]);

  const imageItems = useMemo(() => {
    if (!canSwitch) return allImageItems;
    return allImageItems.filter(
      (img: any) => (img.vehicle_type || "client") === selectedVehicle,
    );
  }, [allImageItems, canSwitch, selectedVehicle]);

  const data = useMemo(() => {
    if (!canSwitch) return allData;
    return allData.filter(
      (d: any) => (d.vehicle_type || "client") === selectedVehicle,
    );
  }, [allData, canSwitch, selectedVehicle]);

  const total = data.length;
  const high = data.filter((d) => normalizeSeverity(d.severity) === "High").length;
  const med = data.filter((d) => normalizeSeverity(d.severity) === "Medium").length;
  const low = data.filter((d) => normalizeSeverity(d.severity) === "Low").length;

  const auditTrail = reportData?.audit_trail?.length
    ? reportData.audit_trail
    : currentImage?.audit_trail?.length
      ? currentImage.audit_trail
      : [{
          doneBy: uploadedBy || "System",
          action: "Generated Collective AI Report",
          timestamp: reportData?.generated_at || currentImage?.generated_at || new Date().toISOString(),
        }];

  const sideCounts = useMemo(() => {
    return data.reduce((acc: Record<string, number>, item: any) => {
      const side = item.side || item.damage_side || "-";
      acc[side] = (acc[side] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }, [data]);

  // ---- Manual Adjustments (interactive on screen, static in PDF) ----
  const [decisions, setDecisions] = useState<Record<string, "accepted" | "rejected">>({});
  const [notes, setNotes] = useState("");
  const [vehicleStatus, setVehicleStatus] = useState(vehicleStatusOptions[0] || "Roadworthy");

  // Prefill the editor from previously saved manual adjustments.
  useEffect(() => {
    if (!initialAdjustments) return;
    if (initialAdjustments.decisions) setDecisions(initialAdjustments.decisions);
    if (typeof initialAdjustments.notes === "string") setNotes(initialAdjustments.notes);
    if (initialAdjustments.vehicleStatus) setVehicleStatus(initialAdjustments.vehicleStatus);
  }, [initialAdjustments]);

  const handleDownloadPDF = () => setTimeout(() => window.print(), 50);
  const handlePrint = () => setTimeout(() => window.print(), 50);
  const handleSave = () => onSaveToClaim?.({ decisions, notes, vehicleStatus });

  const [emailOpen, setEmailOpen] = useState(false);
  const reportPdfUrl = reportData?.report_pdf_url || reportData?.pdf_report_url || "";
  const reportPdfS3Key = reportData?.report_pdf_s3_key || "";

  if (!isOpen) return null;

  return (
    <>
      {!captureMode && <style>{PRINT_STYLES}</style>}

      {!captureMode && (
        <div data-pdf-backdrop className="fixed inset-0 bg-black/50 z-40 transition-opacity" onClick={onClose} />
      )}

      <div
        ref={sliderRef}
        data-pdf-root
        data-capture={captureMode ? "true" : undefined}
        className={
          captureMode
            ? "relative w-[960px] bg-white font-['Stack_Sans_Headline']"
            : `fixed top-0 right-0 h-full w-[960px] max-w-[95vw] bg-white z-50 shadow-2xl transform transition-transform duration-300 ease-in-out overflow-y-auto font-['Stack_Sans_Headline'] ${
                isOpen ? "translate-x-0" : "translate-x-full"
              }`
        }
      >
        {/* Header */}
        <div className="px-6 py-5 bg-white shadow-sm flex justify-between items-start sticky top-0 z-10">
          <div className="flex-1 flex flex-col gap-3.5">
            <div className="flex justify-between items-start">
              <h1 className="text-neutral-900 text-[24px] font-weight-600 leading-6">
                AI Vehicle Damage Full Report
              </h1>

              <div className="flex items-center gap-3.5" data-pdf-hide>
                <div className="flex gap-3.5 border-r border-gray-200 pr-3.5">
                  <button
                    className="h-8 px-3 py-2 bg-blue-50 rounded flex items-center gap-2 text-blue-600 text-sm font-weight-400 disabled:opacity-50"
                    onClick={handleDownloadPDF}
                  >
                    <Download className="w-4 h-4" /> Download PDF
                  </button>

                  <button
                    className="h-8 px-3 py-2 bg-blue-50 rounded flex items-center gap-2 text-blue-600 text-sm font-weight-400 disabled:opacity-50"
                    onClick={handlePrint}
                  >
                    <Printer className="w-4 h-4" /> Print
                  </button>

                  <button
                    className="h-8 px-3 py-2 bg-blue-50 rounded flex items-center gap-2 text-blue-600 text-sm font-weight-400 disabled:opacity-50"
                    onClick={() => setEmailOpen(true)}
                  >
                    <Mail className="w-4 h-4" /> Email
                  </button>

                  <button
                    className="h-8 px-3 py-2 bg-blue-50 rounded flex items-center gap-2 text-blue-600 text-sm font-weight-400 disabled:opacity-50"
                    onClick={handleSave}
                    disabled={saving || !onSaveToClaim}
                  >
                    <FileText className="w-4 h-4" /> {saving ? "Saving..." : "Save to Claim"}
                  </button>
                </div>

                <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full ml-4">
                  <X className="w-6 h-6 text-gray-400" />
                </button>
              </div>
            </div>

            <div className="p-2 bg-blue-50 rounded flex gap-4 flex-wrap">
              <span className="text-gray-600 text-sm">Claim ID: <span className="font-weight-600">{reference}</span></span>
              <span className="text-gray-600 text-sm">Report ID: <span className="font-weight-600">{reportId}</span></span>
              <span className="text-gray-600 text-sm">Generated: <span className="font-weight-600">{generatedAt}</span></span>
              <span className="text-gray-600 text-sm">Assessment Type: <span className="font-weight-600">{assessmentLabel}</span></span>
            </div>

            <div className="px-2 text-gray-500 text-[11px]">
              Uploaded By: <span className="text-blue-600 font-weight-600">{uploadedBy}</span>
              {" • "}File Name: <span className="font-weight-600 text-gray-700">AI Report</span>
              {" • "}Source: <span className="font-weight-600 text-gray-700">{source}</span>
            </div>
          </div>
        </div>

        <div className="p-6 flex flex-col gap-6">
          {/* ---- Vehicle cards (clickable tabs when "Both") ---- */}
          {(showClientCard || showThirdPartyCard) && (
            <div data-pdf-section className="flex flex-col gap-2">
              <div className="flex gap-6">
                {showClientCard && (() => {
                  const active = !canSwitch ? true : selectedVehicle === "client";
                  return (
                    <div
                      onClick={() => canSwitch && setSelectedVehicle("client")}
                      className={`flex-1 p-5 rounded-lg flex flex-col gap-1 ${canSwitch ? "cursor-pointer transition-colors" : ""} ${
                        active
                          ? "bg-blue-100 "
                          : "bg-white outline outline-1 outline-blue-200"
                      }`}
                    >
                      <div className="text-black text-xl font-weight-600 leading-5">Client Vehicle</div>
                      <div className="text-neutral-700 text-sm">
                        <span className="font-normal">Reg# </span>
                        <span className="font-weight-600">
                          {[clientVehicle?.registration, vehicleLine(clientVehicle)].filter(Boolean).join(", ") || "-"}
                        </span>
                      </div>
                    </div>
                  );
                })()}
                {showThirdPartyCard && (() => {
                  const active = !canSwitch ? !showClientCard : selectedVehicle === "third_party";
                  return (
                    <div
                      onClick={() => canSwitch && setSelectedVehicle("third_party")}
                      className={`flex-1 p-5 rounded-lg flex flex-col gap-1 ${canSwitch ? "cursor-pointer transition-colors" : ""} ${
                        active
                          ? "bg-blue-100 outline outline-2 outline-offset-[-2px] outline-blue-500"
                          : "bg-white outline outline-1 outline-blue-200"
                      }`}
                    >
                      <div className="text-black text-xl font-weight-600 leading-5">Third party Vehicle</div>
                      <div className="text-neutral-700 text-sm">
                        <span className="font-normal">Reg# </span>
                        <span className="font-weight-600">
                          {[thirdPartyVehicle?.registration, vehicleLine(thirdPartyVehicle)].filter(Boolean).join(", ") || "-"}
                        </span>
                      </div>
                    </div>
                  );
                })()}
              </div>
              {canSwitch && (
                <p className="px-1 text-neutral-500 text-xs" data-pdf-hide>
                  Showing {selectedVehicle === "client" ? "client" : "third party"} vehicle — click a card to switch.
                </p>
              )}
            </div>
          )}

          {/* ---- Damage Summary ---- */}
          <div data-pdf-section className="rounded-lg outline outline-1 outline-offset-[-1px] outline-neutral-100 overflow-hidden">
            <div className="grid grid-cols-[1fr_1.2fr_1.2fr_110px_110px_120px_1.3fr] gap-2 p-4 bg-white font-weight-600 text-gray-800 text-sm border-b border-neutral-100">
              <div>DAMAGE SIDE</div>
              <div>AREA OF DAMAGE</div>
              <div>TYPE OF DAMAGE</div>
              <div>SEVERITY</div>
              <div>CONFIDENCE</div>
              <div>DAMAGED POINTS</div>
              <div>SUGGESTED REPAIR</div>
            </div>
            <div className="divide-y divide-neutral-100">
              {data.length > 0 ? (
                data.map((det: any, idx: number) => {
                  const severity = normalizeSeverity(det.severity);
                  const damageType = det.damage_type || det.type_of_damage || det.type || "-";
                  return (
                    <div
                      key={det.detection_id || `${det.class}-${idx}`}
                      className="grid grid-cols-[1fr_1.2fr_1.2fr_110px_110px_120px_1.3fr] gap-2 p-4 items-center text-sm text-neutral-700 bg-white"
                    >
                      <div className="capitalize">{det.side || det.damage_side || "-"}</div>
                      <div className="capitalize">{det.part || det.area_of_damage || det.area || "-"}</div>
                      <div className="capitalize">{damageType}</div>
                      <div>
                        <span className={`px-2 py-1 rounded text-xs font-weight-600 ${
                          severity === "High" ? "bg-red-100 text-red-700"
                          : severity === "Medium" ? "bg-orange-100 text-orange-500"
                          : severity === "Low" ? "bg-green-100 text-green-500"
                          : "bg-neutral-50 text-neutral-500"
                        }`}>{severity}</span>
                      </div>
                      <div>{formatConfidence(det.confidence)}</div>
                      <div>{det.points || 1}</div>
                      <div>{det.suggested_repair || det.repair || getSuggestedRepair(damageType)}</div>
                    </div>
                  );
                })
              ) : (
                <div className="p-6 text-sm text-gray-500">No damages found in this report.</div>
              )}
            </div>
          </div>

          {/* ---- Images with AI Detection ---- */}
          <div data-pdf-section className="p-4 rounded-lg outline outline-1 outline-offset-[-1px] outline-neutral-100 flex flex-col gap-4">
            <div>
              <h3 className="text-black text-xl font-weight-600 leading-5">Images with AI Detection</h3>
              <p className="text-neutral-700 text-sm mt-1">
                {imageItems.length} image{imageItems.length !== 1 ? "s" : ""} • Uploaded
              </p>
            </div>

            <div className="w-full bg-neutral-100 rounded-lg p-3">
              {imageItems.length > 0 ? (
                <div
                  className="grid gap-2"
                  style={{
                    gridTemplateColumns: `repeat(${Math.min(
                      imageItems.length,
                      6,
                    )}, minmax(0, 1fr))`,
                  }}
                >
                  {imageItems.map((image, index) => {
                    const imageUrl = image.annotated_image_url || image.original_image_url || "";
                    return (
                      <div key={image.image_index ?? index} className="h-[155px] rounded overflow-hidden bg-white border border-neutral-200">
                        {imageUrl ? (
                          <img src={imageUrl} alt={`AI Detection ${index + 1}`} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-sm text-gray-400">No image</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="h-40 flex items-center justify-center text-sm text-gray-500">No images available.</div>
              )}
            </div>

            <div className="flex gap-4">
              <LegendItem color="bg-red-600" label={`High Severity (${high})`} />
              <LegendItem color="bg-orange-500" label={`Medium Severity (${med})`} />
              <LegendItem color="bg-green-500" label={`Low Severity (${low})`} />
            </div>
          </div>

          {/* ---- Manual Adjustments ---- */}
          <div data-pdf-section className="p-4 rounded-lg outline outline-1 outline-offset-[-1px] outline-neutral-200 flex flex-col gap-6">
            <h3 className="text-black text-xl font-weight-600 leading-5">Manual Adjustments</h3>

            {data.length > 0 ? (
              <div className="rounded-lg outline outline-1 outline-offset-[-1px] outline-neutral-100 divide-y divide-neutral-100">
                {data.map((det: any, idx: number) => {
                  const id = det.detection_id || `${det.class}-${idx}`;
                  const decision = decisions[id];
                  const code = `DMG-${String(idx + 1).padStart(3, "0")}`;
                  const label = [det.side || det.damage_side, det.part || det.area_of_damage || det.area]
                    .filter(Boolean).join(" - ");
                  const type = det.damage_type || det.type_of_damage || det.type || "-";
                  return (
                    <div key={id} className="p-4 flex justify-between items-center gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-neutral-700 text-sm capitalize truncate">{code} {label}</span>
                        <span className="px-2 py-1 rounded outline outline-1 outline-offset-[-1px] outline-blue-300 text-blue-300 text-xs font-weight-600 capitalize shrink-0">{type}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          disabled={readOnly}
                          onClick={() => setDecisions((p) => ({ ...p, [id]: "accepted" }))}
                          className={`px-2 py-1 rounded outline outline-1 outline-offset-[-1px] text-xs font-weight-600 ${
                            decision === "accepted" ? "bg-green-500 text-white outline-green-500" : "text-green-500 outline-green-500"
                          }`}
                        >Accept</button>
                        <button
                          type="button"
                          disabled={readOnly}
                          onClick={() => setDecisions((p) => ({ ...p, [id]: "rejected" }))}
                          className={`px-2 py-1 rounded outline outline-1 outline-offset-[-1px] text-xs font-weight-600 ${
                            decision === "rejected" ? "bg-red-500 text-white outline-red-500" : "text-red-500 outline-red-500"
                          }`}
                        >Reject</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-neutral-400 text-sm">No manual adjustment data available from source report</div>
            )}

            <div className="flex flex-col gap-2">
              <label className="text-neutral-700 text-sm font-medium">Additional Notes/ Unrelated Damage</label>
              {readOnly ? (
                <div className="min-h-24 px-5 py-4 bg-white rounded outline outline-1 outline-offset-[-1px] outline-neutral-200 text-base font-light text-neutral-700 whitespace-pre-wrap">
                  {notes || "-"}
                </div>
              ) : (
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Value"
                  className="h-24 px-5 py-4 bg-white rounded outline outline-1 outline-offset-[-1px] outline-neutral-200 text-base font-light text-neutral-700 resize-none outline-none focus:outline-blue-300"
                />
              )}
            </div>

            <div className="w-[490px] max-w-full flex flex-col gap-2">
              <label className="text-neutral-700 text-sm font-medium">Vehicle Status</label>
              {readOnly ? (
                <div className="px-5 py-4 bg-white rounded outline outline-1 outline-offset-[-1px] outline-neutral-200 text-base font-light text-neutral-700">
                  {vehicleStatus}
                </div>
              ) : (
                <Select
                  options={vehicleStatusOptions.map((opt) => ({ value: opt, label: opt }))}
                  value={{ value: vehicleStatus, label: vehicleStatus }}
                  onChange={(opt: any) => setVehicleStatus(opt?.value || "")}
                  styles={customStyles}
                  components={{
                    DropdownIndicator: BlueDropdownIndicator,
                    IndicatorSeparator: () => null,
                  }}
                />
              )}
            </div>
          </div>

          {/* ---- Damage By Severity ---- */}
          <div data-pdf-section className="p-4 rounded-lg outline outline-1 outline-offset-[-1px] outline-neutral-200 flex flex-col gap-5">
            <h3 className="text-black text-xl font-weight-600 leading-5">Damage By Severity</h3>
            <div className="flex gap-5">
              <StatBox label="Total Damages" count={total} color="outline-neutral-200" />
              <StatBox label="High Severity" count={high} color="outline-red-500" />
              <StatBox label="Medium Severity" count={med} color="outline-orange-400" />
              <StatBox label="Low Severity" count={low} color="outline-green-500" />
            </div>
          </div>

          {/* ---- Damage By Location ---- */}
          <div data-pdf-section className="px-4 py-3 rounded-lg outline outline-1 outline-offset-[-1px] outline-neutral-200 flex flex-col gap-6">
            <div className="text-black text-xl font-weight-600 leading-5">Damage By Location</div>
            <div className="grid grid-cols-3 w-full gap-4">
              {locationConfig.map((item) => (
                <LocationBox key={item.key} count={sideCounts[item.key] || 0} image={item.image} label={item.label} />
              ))}
            </div>
          </div>

          {/* ---- Audit Trail ---- */}
          <div data-pdf-section className="p-4 rounded-lg outline outline-1 outline-offset-[-1px] outline-neutral-200 flex flex-col gap-5">
            <h3 className="text-black text-xl font-weight-600 leading-5">Audit Trail</h3>
            <div className="rounded-lg outline outline-1 outline-offset-[-1px] outline-neutral-100 overflow-hidden">
              <div className="grid grid-cols-3 gap-3 p-4 bg-white border-b border-neutral-100 font-weight-600 text-gray-800 text-sm">
                <div>DONE BY</div><div>ACTION</div><div>TIMESTAMP</div>
              </div>
              {auditTrail.map((item, index) => (
                <div key={index} className="grid grid-cols-3 gap-3 p-4 text-sm text-gray-600 border-b border-neutral-100 last:border-b-0">
                  <div className="min-w-0 break-words pr-2">{item.doneBy || "-"}</div>
                  <div className="min-w-0 break-words pr-2">{item.action || "-"}</div>
                  <div className="min-w-0">{formatDateTime(item.timestamp)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {emailOpen && (
        <EmailAttachmentModal
          attachments={[
            {
              id: "ai-report",
              file_url: reportPdfUrl,
              file_name: "AI Damage Report.pdf",
              s3_key: reportPdfS3Key,
            },
          ]}
          onClose={() => setEmailOpen(false)}
          onRemoveAttachment={() => setEmailOpen(false)}
        />
      )}
    </>
  );
};

const LegendItem = ({ color, label }: { color: string; label: string }) => (
  <div className="flex items-center gap-1.5">
    <div className={`w-4 h-4 rounded-full ${color}`} />
    <span className="text-neutral-700 text-sm">{label}</span>
  </div>
);

const StatBox = ({ label, count, color }: { label: string; count: number; color: string }) => (
  <div className={`flex-1 p-4 rounded-lg outline outline-1 outline-offset-[-1px] ${color} bg-white flex flex-col gap-1`}>
    <div className="text-gray-700 text-2xl font-weight-600 leading-6">{count}</div>
    <div className="text-gray-600 text-sm">{label}</div>
  </div>
);

const LocationBox = ({ count, image, label }: { count: number; image: string; label: string }) => (
  <div className="h-44 p-4 bg-white rounded-lg outline outline-1 outline-offset-[-1px] outline-neutral-200 flex flex-col justify-center items-center gap-6">
    <div className="text-neutral-900 text-2xl font-weight-600 leading-6">{count}</div>
    <img src={image} alt={label} />
    <div className="text-neutral-700 text-sm font-light text-center">{label}</div>
  </div>
);

export default AIDamageReportSlider;
