import React from "react";
import { fileTypeIcon } from "../utils/fileIcon";
import { formatUploadedAt, type FleetDoc } from "./FleetDocumentList";
import UploadFileIcon from "../assets/icons/UploadFile.svg";

// The latest uploaded file as a single grey row (file-type logo + name + upload
// time) with a "Remove & Upload Again" CTA on the right — the older Figma design.
// The full upload history lives inside the upload modal.
const FleetUploadedFileBar: React.FC<{
  doc?: FleetDoc | null;
  ctaLabel?: string;
  onCta: () => void;
  onView?: (docId: number) => void;
}> = ({ doc, ctaLabel = "Remove & Upload Again", onCta, onView }) => {
  if (!doc) return null;
  return (
    <div className="self-stretch px-4 py-3 bg-neutral-100 rounded-lg flex items-center justify-between gap-4">
      <div className="flex items-center gap-3 min-w-0">
        <img src={fileTypeIcon(doc.filename)} alt="" className="w-8 h-8 shrink-0" />
        <div className="min-w-0">
          {onView ? (
            <button
              type="button"
              onClick={() => onView(doc.id)}
              title="View file"
              className="block max-w-full truncate text-left text-neutral-900 text-sm font-medium hover:underline"
            >
              {doc.filename || "Document"}
            </button>
          ) : (
            <div className="text-neutral-900 text-sm font-medium truncate">{doc.filename || "Document"}</div>
          )}
          <div className="text-neutral-500 text-xs">Uploaded {formatUploadedAt(doc.created_at)}</div>
        </div>
      </div>
      <button
        type="button"
        onClick={onCta}
        className="shrink-0 h-8 px-3 rounded outline outline-1 -outline-offset-1 outline-neutral-900 text-neutral-900 text-sm inline-flex items-center gap-2 hover:bg-neutral-50"
      >
        <img src={UploadFileIcon} alt="" className="w-4 h-4" />
        {ctaLabel}
      </button>
    </div>
  );
};

export default FleetUploadedFileBar;
