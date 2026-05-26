import React from "react";
import { X } from "lucide-react";

interface Prediction {
  damage_side?: string;
  side?: string;
  area_of_damage?: string;
  area?: string;
  part?: string;
  damage_type?: string;
  type_of_damage?: string;
  type?: string;
  severity?: string;
  confidence?: number | string;
  points?: number;
  suggested_repair?: string;
  repair?: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  imageSrc: string;
  predictions: Prediction[];
  imageIndex: number;
}

const getSuggestedRepair = (damageType?: string) => {
  const t = String(damageType || "").toLowerCase();
  if (t === "dent") return "Repair";
  if (t === "broken") return "Replace part";
  if (t === "crash") return "Major repair";
  if (t === "scratch") return "Paint / polish";
  if (t === "shattered") return "Replace glass";
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

const normalizeSeverity = (severity?: string) => {
  const v = String(severity || "").toLowerCase();
  if (v === "high") return "High";
  if (v === "medium") return "Medium";
  if (v === "low") return "Low";
  return "-";
};

const ImageDetailSlider: React.FC<Props> = ({
  isOpen,
  onClose,
  imageSrc,
  predictions,
  imageIndex,
}) => {
  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />

      <div
        className={`fixed top-0 right-0 h-full w-[1068px] max-w-[95vw] bg-white z-50 shadow-2xl overflow-y-auto transform transition-transform duration-300 ease-in-out font-['Stack_Sans_Headline'] ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="px-6 py-5 flex justify-between items-center sticky top-0 bg-white border-b z-10">
          <h2 className="text-neutral-900 text-2xl font-weight-600">
            Damage Detail
          </h2>
          <button
            onClick={onClose}
            className="px-10 py-4 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 transition-colors"
          >
            Close
          </button>
        </div>

        <div className="p-6 flex flex-col gap-6">
          {/* Image section */}
          <div className="flex flex-col gap-3">
            <h3 className="text-neutral-900 text-xl font-weight-600">
              Image Details
            </h3>

            <div className="w-full rounded-lg overflow-hidden bg-neutral-100 flex items-center justify-center min-h-[280px]">
              {imageSrc ? (
                <img
                  src={imageSrc}
                  alt={`Detection ${imageIndex + 1}`}
                  className="w-full h-full object-contain max-h-[380px]"
                />
              ) : (
                <span className="text-gray-400 text-sm">
                  No image available
                </span>
              )}
            </div>

            {/* Legend */}
            <div className="flex gap-5">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-red-500 inline-block" />
                <span className="text-sm text-gray-700">High Severity</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-orange-400 inline-block" />
                <span className="text-sm text-gray-700">Medium Severity</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-green-500 inline-block" />
                <span className="text-sm text-gray-700">Low Severity</span>
              </div>
            </div>
          </div>

          {/* Damage table */}
          <div className="border border-gray-100 rounded-lg overflow-hidden">
            <table className="w-full text-sm table-fixed">
              <thead>
                <tr className="bg-white border-b text-neutral-900 font-weight-600 text-xs uppercase tracking-wide">
                  <th className="text-left px-3 py-3 w-[16%]">Damage Side</th>
                  <th className="text-left px-3 py-3 w-[18%]">Area of Damage</th>
                  <th className="text-left px-3 py-3 w-[15%]">Type of Damage</th>
                  <th className="text-left px-3 py-3 w-[13%]">Severity</th>
                  <th className="text-left px-3 py-3 w-[12%]">Confidence</th>
                  <th className="text-left px-3 py-3 w-[10%]">Points</th>
                  <th className="text-left px-3 py-3">Suggested Repair</th>
                </tr>
              </thead>
              <tbody>
                {predictions.length > 0 ? (
                  predictions.map((item, i) => {
                    const severity = normalizeSeverity(item.severity);
                    const damageType =
                      item.damage_type ||
                      item.type_of_damage ||
                      item.type ||
                      "-";
                    return (
                      <tr
                        key={i}
                        className="border-b last:border-b-0 font-light text-neutral-700"
                      >
                        <td className="px-3 py-3 capitalize">
                          {item.damage_side || item.side || "-"}
                        </td>
                        <td className="px-3 py-3 capitalize">
                          {item.area_of_damage ||
                            item.area ||
                            item.part ||
                            "-"}
                        </td>
                        <td className="px-3 py-3 capitalize">{damageType}</td>
                        <td className="px-3 py-3">
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
                        </td>
                        <td className="px-3 py-3">
                          {formatConfidence(item.confidence)}
                        </td>
                        <td className="px-3 py-3">{item.points || 1}</td>
                        <td className="px-3 py-3">
                          {item.suggested_repair ||
                            item.repair ||
                            getSuggestedRepair(damageType)}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-3 py-6 text-neutral-400 text-center"
                    >
                      No damage data for this image.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
};

export default ImageDetailSlider;
