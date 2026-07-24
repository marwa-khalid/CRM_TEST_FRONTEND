import React, { useState } from "react";
import { Eye } from "lucide-react";
import { fileTypeIcon } from "../utils/fileIcon";

export interface FleetDoc {
  id: number;
  filename?: string | null;
  created_at?: string | null;
}

const SECTION = "self-stretch p-5 rounded-lg outline outline-1 -outline-offset-1 outline-neutral-100 flex flex-col gap-4";
const H3 = "text-black text-xl font-semibold leading-5";

// "23/07/2026 at 22:00" — date + 24-hour time.
export const formatUploadedAt = (value?: string | null): string => {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  const date = d.toLocaleDateString("en-GB");
  const time = d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false });
  return `${date} at ${time}`;
};

/**
 * Uploaded-document history. Shows only the latest by default so it stays one
 * row; a "Show all (N)" toggle expands the rest into a fixed-height scrollable
 * list, so it never grows unbounded no matter how many files exist.
 *
 * `inline` drops the outer card + divider so it can sit inside another section
 * (e.g. a licensing-authority block) rather than standing alone as its own card.
 */
const FleetDocumentList: React.FC<{
  title: string;
  documents: FleetDoc[];
  onView: (docId: number) => void;
  inline?: boolean;
}> = ({ title, documents, onView, inline = false }) => {
  const [showAll, setShowAll] = useState(false);
  if (documents.length === 0) return null;

  const visible = showAll ? documents : documents.slice(0, 1);

  if (inline) {
    return (
      <div className="self-stretch flex flex-col gap-2">
        <div className="flex justify-between items-center gap-3">
          <span className="text-neutral-700 text-sm font-medium">{title}</span>
          {documents.length > 1 && (
            <button
              type="button"
              onClick={() => setShowAll((v) => !v)}
              className="text-sm text-neutral-600 hover:text-neutral-900 underline"
            >
              {showAll ? "Show latest only" : `Show all (${documents.length})`}
            </button>
          )}
        </div>
        <div className={`flex flex-col gap-2 ${showAll ? "max-h-[240px] overflow-y-auto pr-1" : ""}`}>
          {visible.map((doc, i) => (
            <div
              key={doc.id}
              className="flex items-center gap-3 px-4 py-3 rounded outline outline-1 -outline-offset-1 outline-neutral-200 bg-white"
            >
              <img src={fileTypeIcon(doc.filename)} alt="" className="w-6 h-6 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-neutral-900 text-sm font-medium truncate">
                    {doc.filename || "Document"}
                  </span>
                  {i === 0 && (
                    <span className="shrink-0 text-[11px] px-2 py-0.5 rounded-full bg-neutral-900 text-white">Latest</span>
                  )}
                </div>
                <span className="text-neutral-500 text-xs">Uploaded {formatUploadedAt(doc.created_at)}</span>
              </div>
              <button
                type="button"
                onClick={() => onView(doc.id)}
                title="View file"
                className="shrink-0 w-8 h-8 flex items-center justify-center rounded hover:bg-neutral-100 text-neutral-700"
              >
                <Eye size={18} />
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <section className={SECTION}>
      <div className="flex justify-between items-center gap-3">
        <h3 className={H3}>{title}</h3>
        {documents.length > 1 && (
          <button
            type="button"
            onClick={() => setShowAll((v) => !v)}
            className="text-sm text-neutral-600 hover:text-neutral-900 underline"
          >
            {showAll ? "Show latest only" : `Show all (${documents.length})`}
          </button>
        )}
      </div>
      <div className="h-px bg-neutral-100" />
      <div className={`flex flex-col gap-2 ${showAll ? "max-h-[240px] overflow-y-auto pr-1" : ""}`}>
        {visible.map((doc, i) => (
          <div
            key={doc.id}
            className="flex items-center gap-3 px-4 py-3 rounded outline outline-1 -outline-offset-1 outline-neutral-200 bg-white"
          >
            <img src={fileTypeIcon(doc.filename)} alt="" className="w-6 h-6 shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-neutral-900 text-sm font-medium truncate">
                  {doc.filename || "Document"}
                </span>
                {i === 0 && (
                  <span className="shrink-0 text-[11px] px-2 py-0.5 rounded-full bg-neutral-900 text-white">Latest</span>
                )}
              </div>
              <span className="text-neutral-500 text-xs">Uploaded {formatUploadedAt(doc.created_at)}</span>
            </div>
            <button
              type="button"
              onClick={() => onView(doc.id)}
              title="View file"
              className="shrink-0 w-8 h-8 flex items-center justify-center rounded hover:bg-neutral-100 text-neutral-700"
            >
              <Eye size={18} />
            </button>
          </div>
        ))}
      </div>
    </section>
  );
};

export default FleetDocumentList;
