import React, { useMemo } from "react";
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
  width: number;
  height: number;
  x: number;
  y: number;
  confidence: number;
  class: string;
  detection_id?: string;
  part: string;
  damage_type: string;
  severity: "High" | "Medium" | "Low";
  side: string;
  points?: number;
}

interface AuditTrailItem {
  doneBy?: string;
  action?: string;
  timestamp?: string;
}

interface ReportImageItem {
  image_index: number;
  original_filename?: string;
  original_image_url?: string;
  annotated_image_url?: string;
  report_pdf_url?: string;
  predictions?: DamageDetection[];
  report_id?: string | number;
  generated_at?: string;

  // dynamic fields
  uploaded_by?: string;
  source_name?: string;
  assessment_type?: string;
  audit_trail?: AuditTrailItem[];
}

interface SliderProps {
  isOpen: boolean;
  currentImage?: ReportImageItem | null;
  onClose: () => void;
  selectedType?: string;
  claimReference?: string;
  clientName?: string;
  sourceName?: string;
  // onSaveToClaim?: () => void;
}

const getSuggestedRepair = (damageType?: string) => {
  const type = (damageType || "").toLowerCase();

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

const AIDamageReportSlider: React.FC<SliderProps> = ({
  isOpen,
  currentImage,
  onClose,
  selectedType,
  claimReference,
  clientName,
  sourceName,
  // onSaveToClaim,
}) => {
  const data = useMemo(
    () => currentImage?.predictions || [],
    [currentImage?.predictions],
  );

  const total = data.length;
  const high = data.filter((d) => d.severity === "High").length;
  const med = data.filter((d) => d.severity === "Medium").length;
  const low = data.filter((d) => d.severity === "Low").length;

  const reference = claimReference || "-";
  const reportId = currentImage?.report_id || "-";
  const generatedAt = formatDateTime(currentImage?.generated_at);
  const uploadedBy = currentImage?.uploaded_by || clientName || "Client";
  const source = currentImage?.source_name || sourceName || "AI Assessment";
  const assessmentLabel = currentImage?.assessment_type || selectedType || "-";

  const displayImageUrl =
    currentImage?.annotated_image_url || currentImage?.original_image_url || "";

  const pdfUrl = currentImage?.report_pdf_url || "";

  const auditTrail = currentImage?.audit_trail?.length
    ? currentImage.audit_trail
    : [
        {
          doneBy: uploadedBy || "System",
          action: "Generated Report",
          timestamp: currentImage?.generated_at || "-",
        },
      ];

  const sideCounts = useMemo(() => {
    return data.reduce(
      (acc: Record<string, number>, item) => {
        const side = item.side;
        acc[side] = (acc[side] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );
  }, [data]);

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 z-40 transition-opacity"
        onClick={onClose}
      />

      <div
        className={`fixed top-0 right-0 h-full w-[1000px] max-w-[95vw] bg-white z-50 shadow-2xl transform transition-transform duration-300 ease-in-out overflow-y-auto ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="px-6 py-5 bg-white shadow-sm flex justify-between items-start sticky top-0 z-10">
          <div className="flex-1 flex flex-col gap-3.5">
            <div className="flex justify-between items-start">
              <h1 className="text-neutral-900 text-[24px] font-weight-600 font-['Stack_Sans_Headline'] leading-6">
                AI Vehicle Damage Full Report
              </h1>

              <div className="flex items-center gap-3.5">
                <div className="flex gap-3.5 border-r border-gray-200 pr-3.5">
                  <button
                    className="h-8 px-3 py-2 bg-blue-50 rounded flex items-center gap-2 text-blue-600 text-sm font-weight-400 disabled:opacity-50"
                    onClick={() => {
                      if (pdfUrl) window.open(pdfUrl, "_blank");
                    }}
                    disabled={!pdfUrl}
                  >
                    <Download className="w-4 h-4" /> Download PDF
                  </button>

                  <button
                    className="h-8 px-3 py-2 bg-blue-50 rounded flex items-center gap-2 text-blue-600 text-sm font-weight-400 disabled:opacity-50"
                    // onClick={onSaveToClaim}
                    // disabled={!onSaveToClaim}
                  >
                    <FileText className="w-4 h-4" /> Save to Claim
                  </button>
                </div>

                <div className="flex gap-3.5">
                  <button
                    onClick={onClose}
                    className="p-2 hover:bg-gray-100 rounded-full ml-4"
                  >
                    <X className="w-6 h-6 text-gray-400" />
                  </button>
                </div>
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
              <span className="font-weight-600 text-gray-700">
                {currentImage?.original_filename || "-"}
              </span>{" "}
              • Source:{" "}
              <span className="font-weight-600 text-gray-700">{source}</span>
            </div>
          </div>
        </div>

        <div className="p-6 flex flex-col gap-6">
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
              {data.length > 0 ? (
                data.map((det, idx) => (
                  <div
                    key={det.detection_id || `${det.class}-${idx}`}
                    className="grid grid-cols-7 gap-2 p-4 items-center text-sm text-gray-700 bg-white"
                  >
                    <div className="capitalize">{det.side || "-"}</div>
                    <div className="font-weight-400 capitalize">
                      {det.part || "-"}
                    </div>
                    <div className="capitalize">{det.damage_type || "-"}</div>
                    <div>
                      <span
                        className={`px-2 py-1 rounded text-xs font-weight-600 ${
                          det.severity === "High"
                            ? "bg-red-50 text-red-700"
                            : det.severity === "Medium"
                              ? "bg-orange-50 text-orange-700"
                              : "bg-green-50 text-green-700"
                        }`}
                      >
                        {det.severity || "-"}
                      </span>
                    </div>
                    <div>
                      {typeof det.confidence === "number"
                        ? `${(det.confidence * 100).toFixed(0)}%`
                        : "-"}
                    </div>
                    <div>{det.points || 1}</div>
                    <div className="font-weight-400">
                      {getSuggestedRepair(det.damage_type)}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6 text-sm text-gray-500">
                  No damages found for this image.
                </div>
              )}
            </div>
          </div>

          <div className="p-4 rounded-lg border border-gray-100 flex flex-col gap-4">
            <div>
              <h3 className="text-neutral-900 text-[20px] font-weight-600 leading-5">
                Images with AI Detection
              </h3>
            </div>

            <div className="h-80 bg-gray-100 rounded-lg flex items-center justify-center relative overflow-hidden">
              {displayImageUrl ? (
                <img
                  src={displayImageUrl}
                  className="h-full object-contain"
                  alt="AI detection output"
                />
              ) : (
                <div className="text-sm text-gray-500">No image available</div>
              )}
            </div>

            <div className="flex gap-4">
              <LegendItem color="bg-red-600" label="High Severity" />
              <LegendItem color="bg-orange-500" label="Medium Severity" />
              <LegendItem color="bg-green-500" label="Low Severity" />
            </div>
          </div>

          <div className="p-4 rounded-lg border border-neutral-200 flex flex-col gap-5">
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

          <div className="px-4 py-3 rounded-lg border border-neutral-200 flex flex-col justify-start items-start gap-6">
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

          <div className="p-4 rounded-lg border border-gray-200 flex flex-col gap-5">
            <h3 className="text-neutral-900 text-[20px] font-weight-600 leading-5">
              Audit Trail
            </h3>

            <div className="border border-gray-100 rounded-lg overflow-hidden">
              <div className="grid grid-cols-[220px_1fr_220px] p-4 bg-white border-b font-weight-600 text-gray-800 text-sm">
                <div>DONE BY</div>
                <div>ACTION</div>
                <div>TIMESTAMP</div>
              </div>

              {auditTrail.map((item, index) => (
                <div
                  key={index}
                  className="grid grid-cols-[220px_1fr_220px] p-4 text-sm text-gray-600 border-b last:border-b-0"
                >
                  <div>{item.doneBy || "-"}</div>
                  <div>{item.action || "-"}</div>
                  <div>{formatDateTime(item.timestamp)}</div>
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
