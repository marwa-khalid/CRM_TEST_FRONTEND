import React, { useEffect, useState } from "react";
import { ArrowLeft, Eye, FileText, Loader2 } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  getHire,
  getHireDocumentFileUrl,
  getHireDocuments,
  type HireDocument,
  type HireRecord,
} from "../services/hireService";
import { fleetReference } from "../utils/reference";

const formatDateTime = (value?: string) => {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  const date = d.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "2-digit" }).replace(/\//g, "-");
  const time = d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false });
  return `${date} . ${time}`;
};

const fieldLabel = (value: string) =>
  value
    .replace(/^checklist_/, "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

const fallbackReference = (hire: HireRecord | null, hireId: number | null) => {
  if (!hire?.fleet_reference && !hireId) return "Fleet Documents Library";
  return fleetReference(hire, hireId);
};

const FleetDocumentLibrary: React.FC = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const hireId = Number(params.get("hire_id")) || null;
  const [hire, setHire] = useState<HireRecord | null>(null);
  const [documents, setDocuments] = useState<HireDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [openingId, setOpeningId] = useState<number | null>(null);

  useEffect(() => {
    if (!hireId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    Promise.all([getHire(hireId), getHireDocuments(hireId)])
      .then(([hireRecord, docs]) => {
        setHire(hireRecord);
        setDocuments([...docs].sort((a, b) => b.id - a.id));
      })
      .finally(() => setLoading(false));
  }, [hireId]);

  const openDocument = async (doc: HireDocument) => {
    if (!hireId) return;
    setOpeningId(doc.id);
    try {
      const url = await getHireDocumentFileUrl(hireId, doc.id);
      if (url) window.open(url, "_blank", "noopener,noreferrer");
    } finally {
      setOpeningId(null);
    }
  };

  return (
    <div className="min-h-screen bg-white font-sans-headline">
      <div className="w-full px-10 py-5 bg-white shadow-[0px_4px_20px_0px_rgba(0,0,0,0.08)] flex items-center gap-5 sticky top-0 z-20">
        <button
          type="button"
          onClick={() => navigate(hireId ? `/fleet/hire/${hireId}` : "/fleet")}
          aria-label="Back"
          className="w-9 h-9 rounded flex items-center justify-center hover:bg-neutral-100"
        >
          <ArrowLeft size={22} />
        </button>
        <div>
          <h1 className="text-black text-2xl font-semibold leading-6">Fleet Documents Library</h1>
          <p className="mt-1 text-neutral-500 text-sm">{fallbackReference(hire, hireId)}</p>
        </div>
      </div>

      <main className="px-10 py-10">
        <section className="max-w-[980px] mx-auto flex flex-col gap-4">
          {loading ? (
            <div className="h-48 flex items-center justify-center text-neutral-500 text-sm gap-2">
              <Loader2 size={18} className="animate-spin" />
              Loading documents...
            </div>
          ) : documents.length === 0 ? (
            <div className="h-48 rounded-lg border border-neutral-100 flex flex-col items-center justify-center text-center">
              <FileText size={24} className="text-neutral-300" />
              <p className="mt-3 text-neutral-900 text-base font-semibold">No documents yet</p>
              <p className="mt-1 text-neutral-500 text-sm">Documents uploaded against this fleet record will appear here.</p>
            </div>
          ) : (
            documents.map((doc) => (
              <article key={doc.id} className="p-5 rounded-lg border border-neutral-100 flex items-center justify-between gap-4">
                <div className="min-w-0 flex items-center gap-4">
                  <div className="w-11 h-11 rounded bg-neutral-100 flex items-center justify-center text-neutral-700">
                    <FileText size={19} />
                  </div>
                  <div className="min-w-0">
                    <h2 className="truncate text-neutral-900 text-base font-semibold">{doc.filename || "Document"}</h2>
                    <p className="mt-1 text-neutral-500 text-sm">{fieldLabel(doc.doc_type)}</p>
                  </div>
                </div>
                <div className="shrink-0 flex items-center gap-5">
                  <span className="text-neutral-700 text-sm">{formatDateTime(doc.created_at || doc.received_on)}</span>
                  <button
                    type="button"
                    onClick={() => openDocument(doc)}
                    disabled={openingId === doc.id}
                    className="h-9 px-3 rounded outline outline-1 -outline-offset-1 outline-neutral-900 flex items-center gap-2 text-neutral-900 text-sm hover:bg-neutral-50 disabled:opacity-60"
                  >
                    {openingId === doc.id ? <Loader2 size={16} className="animate-spin" /> : <Eye size={16} />}
                    View
                  </button>
                </div>
              </article>
            ))
          )}
        </section>
      </main>
    </div>
  );
};

export default FleetDocumentLibrary;
