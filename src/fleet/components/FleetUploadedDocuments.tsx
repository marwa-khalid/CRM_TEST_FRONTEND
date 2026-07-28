import React, { useState } from "react";
import { ChevronDown } from "lucide-react";
import TrashIcon from "../assets/icons/Remove.svg";
import type { VehicleDocument } from "../services/vehicleRecordService";

// Uploaded documents — Figma "Current" report card + "Previous Reports (N)" list
// with per-row dates, remove icons and a Show All Reports expander. Shared across
// Vehicle Details (grey), Servicing and Licensing Authority (blue).
type Variant = "blue" | "grey";
const THEME: Record<Variant, { outline: string; file: string; currentPill: string; showAll: string; heading: string }> = {
  blue: {
    outline: "outline-blue-200",
    file: "text-blue-600",
    currentPill: "bg-blue-100 text-blue-500",
    showAll: "text-blue-500",
    heading: "text-neutral-900 text-base font-medium leading-4",
  },
  grey: {
    outline: "outline-neutral-200",
    file: "text-neutral-900",
    currentPill: "bg-neutral-900 text-white",
    showAll: "text-neutral-900",
    heading: "text-neutral-500 text-sm font-semibold uppercase tracking-wide leading-4",
  },
};

// dd-mm-yy (Postgres timestamps lack a "Z" — append it so it's read as UTC).
const shortDate = (iso?: string | null): string => {
  if (!iso) return "";
  const d = new Date(iso.endsWith("Z") || iso.includes("+") ? iso : `${iso}Z`);
  return Number.isNaN(d.getTime())
    ? ""
    : d.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "2-digit" }).replace(/\//g, "-");
};

const RemoveBtn: React.FC<{ onClick: () => void }> = ({ onClick }) => (
  <button type="button" onClick={onClick} aria-label="Remove" title="Remove" className="shrink-0 text-neutral-700 hover:opacity-70">
    <img src={TrashIcon} alt="" className="w-4 h-4" />
  </button>
);

const FleetUploadedDocuments: React.FC<{
  docs: VehicleDocument[];
  onView: (id: number) => void;
  onRemove: (doc: VehicleDocument) => void;
  variant?: Variant;
}> = ({ docs, onView, onRemove, variant = "blue" }) => {
  const [showAll, setShowAll] = useState(false);
  if (docs.length === 0) return null;
  const t = THEME[variant];
  const FILE = `${t.file} text-base font-medium font-sans-headline leading-4 truncate text-left hover:underline`;
  const [current, ...previous] = docs;
  const shown = showAll ? previous : previous.slice(0, 2);
  return (
    <div className="flex flex-col gap-3">
      {/* Current */}
      <div className={`self-stretch px-4 py-3 rounded-sm outline outline-1 -outline-offset-1 ${t.outline} flex items-center justify-between gap-3`}>
        <div className="flex items-center gap-3 min-w-0">
          <button type="button" onClick={() => onView(current.id)} className={FILE}>{current.filename || "Document"}</button>
          <span className={`px-3 py-1 rounded-full text-xs shrink-0 ${t.currentPill}`}>Current</span>
        </div>
        <RemoveBtn onClick={() => onRemove(current)} />
      </div>

      {/* Previous reports */}
      {previous.length > 0 && (
        <div className={`self-stretch px-4 py-3 rounded-sm outline outline-1 -outline-offset-1 ${t.outline} flex flex-col gap-3`}>
          <div className={t.heading}>Previous Reports ({previous.length})</div>
          {shown.map((doc, i) => (
            <React.Fragment key={doc.id}>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <button type="button" onClick={() => onView(doc.id)} className={FILE}>{doc.filename || "Document"}</button>
                  <span className="px-3 py-1 bg-neutral-100 rounded-full text-neutral-500 text-xs shrink-0">{shortDate(doc.created_at)}</span>
                </div>
                <RemoveBtn onClick={() => onRemove(doc)} />
              </div>
              {i < shown.length - 1 && <div className="h-px bg-neutral-200" />}
            </React.Fragment>
          ))}
          {previous.length > 2 && (
            <button type="button" onClick={() => setShowAll((s) => !s)} className={`inline-flex items-center gap-2 text-sm font-medium ${t.showAll}`}>
              {showAll ? "Show Less" : "Show All Reports"}
              <ChevronDown size={16} className={`transition-transform ${showAll ? "rotate-180" : ""}`} />
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default FleetUploadedDocuments;
