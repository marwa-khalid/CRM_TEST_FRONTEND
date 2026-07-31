import React, { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Download, Eye, History } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  getHire,
  getHireDocuments,
  getHireDocumentFileUrl,
  uploadHireDocument,
  type HireDocument,
  type HireRecord,
} from "../services/hireService";
import {
  getHireVehicleRecord,
  listAllVehicleRecordDocuments,
  getVehicleDocumentFileUrl,
} from "../../vehicles/services/vehicleRecordService";

// Documents come from two stores: the hire (driving licence, taxi badge,
// checklist, user uploads) and the customer-side vehicle record (V5C,
// plating/MOT certificates, service invoices). We show both, tagging each with
// its source so file/preview requests hit the right endpoint.
type LibraryDoc = HireDocument & { __source: "hire" | "vehicle"; __recordId?: number };
import { fleetReference } from "../utils/reference";
import { fileTypeIcon } from "../utils/fileIcon";
import FleetSpinnerLoader from "../components/FleetSpinnerLoader";
import FleetDocumentSlider, { type FleetDocTab } from "../components/FleetDocumentSlider";
import FleetUploadModal from "../components/FleetUploadModal";

const PAGE_SIZE = 10;
const TABS = ["Show All", "Fleet Entrance Document", "User Uploads"] as const;

const docTypeLabel = (doc: HireDocument): string =>
  (doc.doc_type || "")
    .replace(/^checklist_/, "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase()) || "Document";

// No source flag on fleet docs yet — categorise by doc_type keyword.
const categoryOf = (doc: HireDocument): string => {
  const t = (doc.doc_type || "").toLowerCase();
  return /user|upload|manual|misc|other/.test(t) ? "User Uploads" : "Fleet Entrance Document";
};

const relativeTime = (value?: string): string => {
  if (!value) return "";
  const d = new Date(value.endsWith("Z") || value.includes("+") ? value : `${value}Z`).getTime();
  if (Number.isNaN(d)) return "";
  const s = Math.max(0, Math.floor((Date.now() - d) / 1000));
  if (s < 60) return `${s} sec${s === 1 ? "" : "s"} ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} min${m === 1 ? "" : "s"} ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hour${h === 1 ? "" : "s"} ago`;
  const days = Math.floor(h / 24);
  if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;
  const w = Math.floor(days / 7);
  if (w < 4) return `${w} week${w === 1 ? "" : "s"} ago`;
  const mo = Math.floor(days / 30);
  if (mo < 12) return `${mo} month${mo === 1 ? "" : "s"} ago`;
  return `${Math.floor(days / 365)} year${Math.floor(days / 365) === 1 ? "" : "s"} ago`;
};

const ActionButton: React.FC<{ Icon: any; label: string; onClick: () => void }> = ({ Icon, label, onClick }) => (
  <button type="button" onClick={onClick} className="h-8 px-3 rounded flex items-center gap-2 text-neutral-900 hover:bg-neutral-100 transition-colors">
    <Icon size={16} />
    <span className="text-sm font-light">{label}</span>
  </button>
);

const FleetDocumentLibrary: React.FC = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const hireId = Number(params.get("hire_id")) || null;

  const [hire, setHire] = useState<HireRecord | null>(null);
  const [documents, setDocuments] = useState<LibraryDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("Show All");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [uploadOpen, setUploadOpen] = useState(false);

  const [detailDoc, setDetailDoc] = useState<LibraryDoc | null>(null);
  const [detailTab, setDetailTab] = useState<FleetDocTab>("File Preview");

  const load = async () => {
    if (!hireId) { setLoading(false); return; }
    setLoading(true);
    const [h, hireDocs, record] = await Promise.all([
      getHire(hireId),
      getHireDocuments(hireId),
      getHireVehicleRecord(hireId),
    ]);
    const vehicleDocs = record ? await listAllVehicleRecordDocuments(record.id) : [];
    setHire(h);
    const merged: LibraryDoc[] = [
      ...hireDocs.map((d) => ({ ...d, __source: "hire" as const })),
      ...vehicleDocs.map((d) => ({ ...(d as unknown as HireDocument), __source: "vehicle" as const, __recordId: record!.id })),
    ];
    // Sort newest-first by upload time, falling back to id within a source.
    merged.sort((a, b) => {
      const ta = new Date(a.created_at || "").getTime() || 0;
      const tb = new Date(b.created_at || "").getTime() || 0;
      return tb - ta || b.id - a.id;
    });
    setDocuments(merged);
    setLoading(false);
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [hireId]);
  useEffect(() => { setPage(1); }, [activeTab, query]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return documents.filter((d) => {
      if (activeTab !== "Show All" && categoryOf(d) !== activeTab) return false;
      if (needle && !(d.filename || "").toLowerCase().includes(needle)) return false;
      return true;
    });
  }, [documents, activeTab, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const startEntry = filtered.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const endEntry = Math.min(safePage * PAGE_SIZE, filtered.length);
  const pageItems = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const pages = totalPages <= 8 ? Array.from({ length: totalPages }, (_, i) => i + 1) : [1, 2, 3, 4, 5, 6, 7, 8, "dots", totalPages];

  const resolveUrl = (doc: LibraryDoc): Promise<string | null> =>
    doc.__source === "vehicle" && doc.__recordId
      ? getVehicleDocumentFileUrl(doc.__recordId, doc.id)
      : hireId ? getHireDocumentFileUrl(hireId, doc.id) : Promise.resolve(null);

  const openFile = async (doc: LibraryDoc) => {
    const url = await resolveUrl(doc);
    if (url) window.open(url, "_blank", "noopener,noreferrer");
  };
  const openDetail = (doc: LibraryDoc, tab: FleetDocTab) => { setDetailTab(tab); setDetailDoc(doc); };

  // The upload modal drives its own progress; on success we refresh the list.
  const handleUploaded = async (file: File) => {
    if (!hireId) return;
    await uploadHireDocument(hireId, "user_upload", file);
    await load();
  };

  return (
    <div className="min-h-screen bg-white font-sans-headline">
      {/* Not while the upload modal is open — it shows its own progress overlay,
          so the page-level loader would stack a second overlay on top of it. */}
      {loading && !uploadOpen && <FleetSpinnerLoader />}

      <FleetUploadModal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onUploaded={handleUploaded}
        title="Upload Document"
        accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv"
      />

      <FleetDocumentSlider
        open={detailDoc !== null}
        doc={detailDoc}
        hireId={hireId}
        source={detailDoc?.__source}
        recordId={detailDoc?.__recordId ?? null}
        category={detailDoc ? categoryOf(detailDoc) : ""}
        initialTab={detailTab}
        onClose={() => setDetailDoc(null)}
      />

      {/* Header */}
      <div className="w-full px-10 py-5 bg-white shadow-[0px_4px_20px_0px_rgba(0,0,0,0.08)] flex justify-between items-center">
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => navigate(hireId ? `/fleet/hire/${hireId}` : "/fleet")}
            className="inline-flex items-center gap-1 cursor-pointer text-neutral-600 hover:text-neutral-900"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-xs font-semibold">Back to Skyline Record</span>
          </button>
          <div className="text-black text-2xl font-semibold leading-6">Skyline Documents Library</div>
          <p className="text-neutral-500 text-sm">{fleetReference(hire, hireId)}</p>
        </div>
        <button
          type="button"
          onClick={() => setUploadOpen(true)}
          disabled={!hireId}
          className="px-10 py-4 bg-neutral-900 rounded text-white text-base font-medium hover:bg-black transition disabled:opacity-50"
        >
          Upload Document
        </button>
      </div>

      <div className="flex flex-col items-center py-16">
        {/* Search */}
        <div className="w-full max-w-[1000px] mb-6">
          <div className="w-full px-5 py-4 bg-white rounded border border-neutral-200 flex items-center gap-3">
            <input
              type="text"
              placeholder="Search Document"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full text-neutral-700 text-base font-light focus:outline-none placeholder:text-neutral-400"
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="w-full max-w-[1000px] flex flex-wrap items-center gap-3 mb-8">
          {TABS.map((tab) => {
            const active = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-2 rounded flex items-center gap-2 text-sm transition-all border ${
                  active ? "bg-neutral-900 border-neutral-900 text-white" : "bg-neutral-100 border-transparent text-neutral-700 hover:bg-neutral-200"
                }`}
              >
                <span className="font-light">{tab}</span>
              </button>
            );
          })}
        </div>

        {/* Rows */}
        <div className="w-full max-w-[1003px] flex flex-col gap-5">
          {!loading && pageItems.length === 0 ? (
            <div className="py-16 rounded-lg border border-dashed border-neutral-200 text-center text-neutral-400 text-sm">
              No documents found.
            </div>
          ) : (
            pageItems.map((doc) => (
              <div key={`${doc.__source}-${doc.id}`} className="w-full p-4 rounded-lg border border-neutral-100 flex justify-between items-center hover:bg-neutral-50 transition">
                <div className="flex items-start gap-6 min-w-0">
                  <div className="w-12 h-12 bg-neutral-100 rounded flex items-center justify-center shrink-0">
                    <img src={fileTypeIcon(doc.filename)} alt="" className="w-7 h-7" />
                  </div>
                  <div className="flex flex-col gap-2 min-w-0">
                    <h3 className="text-neutral-900 text-base font-medium leading-4 truncate">{doc.filename || "Document"}</h3>
                    <p className="text-neutral-500 text-sm font-light">
                      {docTypeLabel(doc)} • {relativeTime(doc.created_at || doc.received_on)}
                    </p>
                    <div className="flex gap-1.5">
                      {(activeTab === "Show All" ? [categoryOf(doc)] : []).map((tag) => (
                        <span key={tag} className="px-2 py-1 bg-neutral-100 rounded text-neutral-700 text-xs font-semibold">{tag}</span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <ActionButton Icon={Eye} label="Preview" onClick={() => openDetail(doc, "File Preview")} />
                  <ActionButton Icon={Download} label="Download" onClick={() => openFile(doc)} />
                  <ActionButton Icon={History} label="Version" onClick={() => openDetail(doc, "Version History")} />
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {filtered.length > 0 && (
          <div className="w-full max-w-[1003px] mt-10 flex justify-between items-center">
            <div className="text-xs">
              <span className="text-neutral-600">Showing </span>
              <span className="text-black font-semibold">{startEntry}</span>
              <span className="text-neutral-600"> to </span>
              <span className="text-black font-semibold">{endEntry}</span>
              <span className="text-neutral-600"> of </span>
              <span className="text-black font-semibold">{filtered.length}</span>
              <span className="text-neutral-600"> Entries</span>
            </div>
            <div className="flex items-center text-sm">
              <button
                type="button"
                disabled={safePage === 1}
                onClick={() => setPage(safePage - 1)}
                className="h-9 px-3 bg-white rounded-l outline outline-1 -outline-offset-1 outline-neutral-200 flex items-center disabled:opacity-50 text-neutral-600"
              >
                Previous
              </button>
              {pages.map((p, i) =>
                p === "dots" ? (
                  <div key={`d${i}`} className="w-9 h-9 bg-white outline outline-1 -outline-offset-1 outline-neutral-200 flex items-center justify-center text-neutral-600">…</div>
                ) : (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPage(Number(p))}
                    className={`w-9 h-9 outline outline-1 -outline-offset-1 outline-neutral-200 flex items-center justify-center ${safePage === p ? "bg-neutral-900 text-white" : "bg-white text-neutral-600"}`}
                  >
                    {p}
                  </button>
                ),
              )}
              <button
                type="button"
                disabled={safePage === totalPages}
                onClick={() => setPage(safePage + 1)}
                className="h-9 px-3 bg-white rounded-r outline outline-1 -outline-offset-1 outline-neutral-200 flex items-center disabled:opacity-50 text-neutral-900 font-medium"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FleetDocumentLibrary;
