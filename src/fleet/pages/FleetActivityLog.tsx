import React, { useEffect, useMemo, useState } from "react";
import { ArrowLeft, FileText, History, Loader2 } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  getHire,
  getHireAudit,
  getHireDocuments,
  type HireAuditEntry,
  type HireDocument,
  type HireRecord,
} from "../services/hireService";
import { fleetReference } from "../utils/reference";

type ActivityItem = {
  id: string;
  title: string;
  detail: string;
  user?: string;
  date?: string;
  kind: "audit" | "document";
};

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
    .replace(/^pcn\./, "PCN ")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

const fallbackReference = (hire: HireRecord | null, hireId: number | null) => {
  if (!hire?.fleet_reference && !hireId) return "Fleet Activity Log";
  return fleetReference(hire, hireId);
};

const auditToItem = (row: HireAuditEntry): ActivityItem => ({
  id: `audit-${row.id}`,
  title: `${fieldLabel(row.field_changed)} updated`,
  detail: `${row.old_value || "-"} -> ${row.new_value || "-"}`,
  user: row.user || "Current User",
  date: row.changed_at,
  kind: "audit",
});

const docToItem = (doc: HireDocument): ActivityItem => ({
  id: `doc-${doc.id}`,
  title: `${doc.filename || "Document"} uploaded`,
  detail: fieldLabel(doc.doc_type),
  user: "Current User",
  date: doc.created_at || doc.received_on,
  kind: "document",
});

const FleetActivityLog: React.FC = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const hireId = Number(params.get("hire_id")) || null;
  const [hire, setHire] = useState<HireRecord | null>(null);
  const [audit, setAudit] = useState<HireAuditEntry[]>([]);
  const [documents, setDocuments] = useState<HireDocument[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hireId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    Promise.all([getHire(hireId), getHireAudit(hireId), getHireDocuments(hireId)])
      .then(([hireRecord, auditRows, docs]) => {
        setHire(hireRecord);
        setAudit(auditRows);
        setDocuments(docs);
      })
      .finally(() => setLoading(false));
  }, [hireId]);

  const items = useMemo(
    () =>
      [...audit.map(auditToItem), ...documents.map(docToItem)].sort((a, b) => {
        const ad = a.date ? new Date(a.date).getTime() : 0;
        const bd = b.date ? new Date(b.date).getTime() : 0;
        return bd - ad;
      }),
    [audit, documents],
  );

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
          <h1 className="text-black text-2xl font-semibold leading-6">Fleet Activity Log</h1>
          <p className="mt-1 text-neutral-500 text-sm">{fallbackReference(hire, hireId)}</p>
        </div>
      </div>

      <main className="px-10 py-10">
        <section className="max-w-[920px] mx-auto flex flex-col gap-4">
          {loading ? (
            <div className="h-48 flex items-center justify-center text-neutral-500 text-sm gap-2">
              <Loader2 size={18} className="animate-spin" />
              Loading activity...
            </div>
          ) : items.length === 0 ? (
            <div className="h-48 rounded-lg border border-neutral-100 flex flex-col items-center justify-center text-center">
              <History size={24} className="text-neutral-300" />
              <p className="mt-3 text-neutral-900 text-base font-semibold">No activity yet</p>
              <p className="mt-1 text-neutral-500 text-sm">Changes and uploaded documents for this fleet record will appear here.</p>
            </div>
          ) : (
            items.map((item) => (
              <article key={item.id} className="p-5 rounded-lg border border-neutral-100 flex items-start gap-4">
                <div className="w-10 h-10 rounded bg-neutral-100 flex items-center justify-center text-neutral-700">
                  {item.kind === "document" ? <FileText size={18} /> : <History size={18} />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex justify-between gap-4">
                    <h2 className="text-neutral-900 text-base font-semibold">{item.title}</h2>
                    <span className="shrink-0 text-neutral-500 text-sm">{formatDateTime(item.date)}</span>
                  </div>
                  <p className="mt-1 text-neutral-700 text-sm">{item.detail}</p>
                  <p className="mt-2 text-neutral-500 text-xs">By {item.user || "Current User"}</p>
                </div>
              </article>
            ))
          )}
        </section>
      </main>
    </div>
  );
};

export default FleetActivityLog;
