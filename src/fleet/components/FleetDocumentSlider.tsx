import React, { useEffect, useState } from "react";
import { Download, ExternalLink, Loader2 } from "lucide-react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { fileTypeIcon } from "../utils/fileIcon";
import { getHireDocumentFileUrl, type HireDocument } from "../services/hireService";
import { getVehicleDocumentFileUrl } from "../../vehicles/services/vehicleRecordService";

// Render PDF pages with pdf.js (same engine as the Claims document library) so
// the preview shows page-by-page instead of the browser's native PDF viewer. The
// worker resolves to react-pdf's pdfjs-dist (5.4.296) via the vite.config alias,
// so the worker version matches the API version.
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();

export type FleetDocTab = "File Preview" | "Meta Data" | "Version History" | "Audit Log";
const TABS: FleetDocTab[] = ["File Preview", "Meta Data", "Version History", "Audit Log"];

const ext = (name?: string) => (name || "").split(".").pop()?.toLowerCase() || "";
const isImage = (name?: string) => ["png", "jpg", "jpeg", "gif", "webp", "bmp"].includes(ext(name));
const isPdf = (name?: string) => ext(name) === "pdf";

const docLabel = (doc: HireDocument): string =>
  (doc.doc_type || "")
    .replace(/^checklist_/, "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase()) || "Document";

const fmtDateTime = (value?: string): string => {
  if (!value) return "—";
  const d = new Date(value.endsWith("Z") || value.includes("+") ? value : `${value}Z`);
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
};

const Field: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div className="flex items-center justify-between py-3 border-b border-neutral-100">
    <span className="text-neutral-500 text-sm">{label}</span>
    <span className="text-neutral-900 text-sm font-medium text-right break-words max-w-[60%]">{value}</span>
  </div>
);

const FleetDocumentSlider: React.FC<{
  open: boolean;
  doc: HireDocument | null;
  hireId: number | null;
  // Which store the doc lives in — vehicle-record docs are fetched by recordId.
  source?: "hire" | "vehicle";
  recordId?: number | null;
  category: string;
  initialTab?: FleetDocTab;
  onClose: () => void;
}> = ({ open, doc, hireId, source = "hire", recordId = null, category, initialTab = "File Preview", onClose }) => {
  const [tab, setTab] = useState<FleetDocTab>(initialTab);
  const [url, setUrl] = useState<string | null>(null);
  const [loadingUrl, setLoadingUrl] = useState(false);
  const [numPages, setNumPages] = useState(0);

  useEffect(() => { setTab(initialTab); }, [initialTab, doc?.id]);

  useEffect(() => {
    if (!open || !doc) return;
    const fetchUrl =
      source === "vehicle" && recordId
        ? getVehicleDocumentFileUrl(recordId, doc.id)
        : hireId ? getHireDocumentFileUrl(hireId, doc.id) : Promise.resolve(null);
    setUrl(null);
    setNumPages(0);
    setLoadingUrl(true);
    fetchUrl.then((u) => setUrl(u)).finally(() => setLoadingUrl(false));
  }, [open, doc?.id, hireId, source, recordId]);

  if (!open || !doc) return null;
  const openFile = () => url && window.open(url, "_blank", "noopener,noreferrer");

  return (
    <div className="fixed inset-0 z-[150] font-sans-headline">
      <div className="fixed inset-0 bg-black/30" onClick={onClose} />
      <div className="fixed top-0 right-0 h-full w-[820px] max-w-full bg-white shadow-2xl overflow-y-auto">
        {/* Header */}
        <div className="px-10 pt-5 bg-white shadow-[0px_4px_20px_0px_rgba(0,0,0,0.08)] sticky top-0 z-10 flex flex-col gap-5">
          <div className="flex justify-between items-center gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <img src={fileTypeIcon(doc.filename)} alt="" className="w-9 h-9 shrink-0" />
              <div className="min-w-0">
                <div className="text-neutral-900 text-base font-semibold truncate">{doc.filename || "Document"}</div>
                <div className="text-neutral-500 text-xs">{docLabel(doc)}</div>
              </div>
            </div>
            <button type="button" onClick={onClose} className="shrink-0 px-8 py-3 bg-white rounded border border-neutral-300 text-neutral-700 text-base font-medium hover:bg-neutral-50">
              Close
            </button>
          </div>
          <div className="flex items-start gap-6">
            {TABS.map((t) => (
              <button key={t} type="button" onClick={() => setTab(t)} className="flex flex-col items-start gap-2 pb-0">
                <span className={`text-sm leading-4 ${tab === t ? "text-neutral-900 font-semibold" : "text-neutral-500 hover:text-neutral-700"}`}>{t}</span>
                <span className={`h-0.5 w-full ${tab === t ? "bg-neutral-900" : "bg-transparent"}`} />
              </button>
            ))}
          </div>
        </div>

        <div className="p-10">
          <div className="flex justify-end items-center gap-3 mb-6">
            <button type="button" onClick={openFile} disabled={!url} className="h-9 px-3 rounded flex items-center gap-2 text-neutral-900 hover:bg-neutral-100 disabled:opacity-50 text-sm">
              <Download size={16} /> Download
            </button>
            <button type="button" onClick={openFile} disabled={!url} className="h-9 px-3 rounded flex items-center gap-2 text-neutral-900 hover:bg-neutral-100 disabled:opacity-50 text-sm">
              <ExternalLink size={16} /> Open
            </button>
          </div>

          {/* File Preview */}
          {tab === "File Preview" && (
            <div className="rounded-xl border border-neutral-100 p-4 min-h-[400px] flex items-center justify-center bg-neutral-50">
              {loadingUrl ? (
                <span className="flex items-center gap-2 text-neutral-500 text-sm"><Loader2 size={18} className="animate-spin" /> Loading preview…</span>
              ) : !url ? (
                <span className="text-neutral-400 text-sm">Preview unavailable.</span>
              ) : isImage(doc.filename) ? (
                <img src={url} alt={doc.filename} className="max-w-full max-h-[560px] object-contain rounded bg-white" />
              ) : isPdf(doc.filename) ? (
                <div className="w-full flex flex-col items-center gap-6">
                  <Document
                    file={url}
                    onLoadSuccess={({ numPages: n }) => setNumPages(n)}
                    loading={<span className="flex items-center gap-2 text-neutral-500 text-sm"><Loader2 size={18} className="animate-spin" /> Rendering pages…</span>}
                    error={<span className="text-neutral-400 text-sm">Couldn’t render this PDF. <button type="button" onClick={openFile} className="text-neutral-900 font-medium underline">Open the file</button></span>}
                  >
                    {Array.from({ length: numPages }).map((_, i) => (
                      <Page
                        key={i}
                        pageNumber={i + 1}
                        width={720}
                        renderTextLayer={false}
                        renderAnnotationLayer={false}
                        className="mb-6 bg-white rounded shadow-[0px_2px_10px_0px_rgba(0,0,0,0.08)] overflow-hidden"
                      />
                    ))}
                  </Document>
                </div>
              ) : (
                <button type="button" onClick={openFile} className="flex flex-col items-center gap-3 text-neutral-500">
                  <img src={fileTypeIcon(doc.filename)} alt="" className="w-14 h-14" />
                  <span className="text-sm">No inline preview — <span className="text-neutral-900 font-medium underline">open the file</span></span>
                </button>
              )}
            </div>
          )}

          {/* Meta Data */}
          {tab === "Meta Data" && (
            <div className="flex flex-col">
              <Field label="File Name" value={doc.filename || "—"} />
              <Field label="Category" value={category} />
              <Field label="Document Type" value={docLabel(doc)} />
              <Field label="Uploaded" value={fmtDateTime(doc.created_at)} />
              <Field label="File Type" value={ext(doc.filename).toUpperCase() || "—"} />
            </div>
          )}

          {/* Version History */}
          {tab === "Version History" && (
            <div className="flex flex-col gap-3">
              <div className="text-neutral-700 text-base font-semibold">Version History</div>
              <div className="p-4 rounded-lg border border-neutral-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="px-2 py-1 rounded-full bg-neutral-900 text-white text-[10px] font-medium">Current</span>
                  <span className="text-neutral-900 text-sm font-medium">{doc.filename || "Document"}</span>
                </div>
                <span className="text-neutral-500 text-xs">{fmtDateTime(doc.created_at)}</span>
              </div>
            </div>
          )}

          {/* Audit Log */}
          {tab === "Audit Log" && (
            <div className="flex flex-col gap-3">
              <div className="text-neutral-700 text-base font-semibold">Audit Log</div>
              <div className="p-4 bg-neutral-100 rounded-lg flex flex-col gap-1">
                <div className="text-neutral-900 text-sm font-semibold">Document uploaded</div>
                <div className="text-neutral-500 text-xs">{fmtDateTime(doc.created_at)}</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FleetDocumentSlider;
