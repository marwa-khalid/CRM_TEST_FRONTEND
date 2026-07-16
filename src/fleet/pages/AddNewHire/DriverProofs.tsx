import React, { useEffect, useRef, useState } from "react";
import FleetUploadModal from "../../components/FleetUploadModal";
import FleetConfirmModal from "../../components/FleetConfirmModal";
import FleetSpinnerLoader from "../../components/FleetSpinnerLoader";
import { useHire } from "./HireContext";
import {
  uploadHireDocument,
  deleteHireDocument,
  getHireDocuments,
  getHireDocumentFileUrl,
  type HireDocument,
} from "../../services/hireService";
import { extractDriverDetailsFromLicence, extractProofOfAddress } from "../../services/driverService";
import { FleetInlineLoader, FleetSegmented } from "../../components/fields";
import { Eye, FileText } from "lucide-react";
import TrashIcon from '../../assets/icons/Remove.svg'
import PlusIcon from "../../assets/icons/Plus.svg";
import AlertIcon from "../../assets/icons/Alert.svg";
import CheckCircleIcon from "../../assets/icons/CheckCircle.svg";

type DlKey = "dlFront" | "dlBack";
type ProofKind = "bank_statement" | "utility_bill";

interface UploadedDoc {
  previewUrl: string | null; // blob URL from fresh upload or auth-checked backend file endpoint
  viewUrl: string | null;
  isPdf: boolean;
  name: string;
  receivedOn: string;
  docId?: number; // backend id, when persisted
}

const IMG_EXT = /\.(png|jpe?g|gif|webp|bmp)$/i;
const PDF_EXT = /\.pdf$/i;
const PROOF_OPTIONS = [
  { label: "Bank Statement", value: "bank_statement" },
  { label: "Utility Bill", value: "utility_bill" },
];
const fmtReceived = (iso?: string) => {
  if (!iso) return "";
  const d = new Date(/[zZ]|[+-]\d\d:?\d\d$/.test(iso) ? iso : `${iso}Z`);
  if (Number.isNaN(d.getTime())) return "";
  const p = (n: number) => String(n).padStart(2, "0");
  // dd-mm-yy h:MM AM/PM
  const time = d.toLocaleTimeString("en-GB", { hour: "numeric", minute: "2-digit", hour12: true }).toUpperCase();
  return `${p(d.getDate())}-${p(d.getMonth() + 1)}-${String(d.getFullYear()).slice(2)} ${time}`;
};
const latestByDocType = (docs: HireDocument[]) => {
  const latest = new Map<string, HireDocument>();
  [...docs]
    .sort((a, b) => b.id - a.id)
    .forEach((doc) => {
      if (!latest.has(doc.doc_type)) latest.set(doc.doc_type, doc);
    });
  return Array.from(latest.values());
};

const proofPrefix = (kind: ProofKind) => (kind === "utility_bill" ? "utility" : "bank_statement");
const proofDocType = (kind: ProofKind, id: number) => `${proofPrefix(kind)}_${id}`;
const proofKindFromDocType = (docType: string): ProofKind =>
  docType.startsWith("utility_") || docType === "firstUtility" || docType === "secondUtility"
    ? "utility_bill"
    : "bank_statement";
const proofIdFromDocType = (docType: string) => {
  const match = docType.match(/_(\d+)$/);
  if (match) return Number(match[1]) || 1;
  if (docType === "secondUtility") return 2;
  return 1;
};
const isProofDocType = (docType: string) =>
  docType.startsWith("utility_") ||
  docType.startsWith("bank_statement_") ||
  docType === "firstUtility" ||
  docType === "secondUtility";
const proofKindLabel = (kind: ProofKind) => (kind === "utility_bill" ? "Utility Bill" : "Bank Statement");

// A persisted document -> preview card. Images are loaded through our backend
// file endpoint, not raw S3 URLs, so the browser does not hit S3 CORS/403.
const docToUploaded = async (hireId: number, d: HireDocument): Promise<UploadedDoc> => {
  const viewUrl = await getHireDocumentFileUrl(hireId, d.id);
  const filename = d.filename || "Document";
  const isImage = IMG_EXT.test(filename);
  return {
    previewUrl: isImage ? viewUrl : null,
    viewUrl,
    isPdf: PDF_EXT.test(filename),
    name: filename,
    receivedOn: fmtReceived(d.created_at) || fmtReceived(d.received_on),
    docId: d.id,
  };
};

const revokeDocUrls = (doc?: UploadedDoc | null) => {
  if (!doc) return;
  if (doc.previewUrl) URL.revokeObjectURL(doc.previewUrl);
  if (doc.viewUrl && doc.viewUrl !== doc.previewUrl) URL.revokeObjectURL(doc.viewUrl);
};

// One proof-of-address section holds BOTH a Bank Statement and a Utility Bill.
// `activeKind` is the view currently shown; each kind keeps its own uploaded doc.
// `id` is stable per section (never the array index) so backend docTypes stay
// correct — the two docs persist as `bank_statement_<id>` and `utility_<id>`.
interface ProofSection {
  id: number;
  activeKind: ProofKind;
  docs: Record<ProofKind, UploadedDoc | null>;
}

// The current upload/delete can target a proof view (section index + kind) or a DL card.
type Target =
  | { kind: "proof"; index: number; proofKind: ProofKind }
  | { kind: "dl"; key: DlKey }
  | { kind: "section"; index: number };

const DL_LABELS: Record<DlKey, string> = {
  dlFront: "Driving License Front",
  dlBack: "Driving License Back",
};

const ORDINALS = ["First", "Second", "Third", "Fourth", "Fifth", "Sixth", "Seventh", "Eighth", "Ninth", "Tenth"];
const sectionTitle = (i: number) => `${ORDINALS[i] || `#${i + 1}`} Proof of Address`;

const receivedToday = () => {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  // dd-mm-yy h:MM AM/PM
  const time = d.toLocaleTimeString("en-GB", { hour: "numeric", minute: "2-digit", hour12: true }).toUpperCase();
  return `${p(d.getDate())}-${p(d.getMonth() + 1)}-${String(d.getFullYear()).slice(2)} ${time}`;
};

const normalise = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

const UploadPrompt = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-12 h-12 text-neutral-300" aria-hidden>
    <path d="M12 15V4m0 0 4 4m-4-4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const DocumentCard: React.FC<{
  label: string;
  doc: UploadedDoc | null;
  onUploadClick: () => void;
  onRemove: () => void;
  uploadLabel?: string; // dropzone caption; falls back to `label`
  proofKind?: ProofKind;
  onProofKindChange?: (value: string) => void;
  onRemoveSection?: () => void; // when set, shows a "Remove" control for the whole section
}> = ({ label, doc, onUploadClick, onRemove, uploadLabel, proofKind, onProofKindChange, onRemoveSection }) => (
  <section className="p-5 rounded-lg outline outline-1 -outline-offset-1 outline-neutral-100 flex flex-col gap-4">
    <div className="flex flex-wrap items-center gap-3">
      <h3 className="text-black text-xl font-semibold leading-5 mr-auto">{label}</h3>
      {proofKind && onProofKindChange && (
        // Switch between the Bank Statement / Utility Bill views of this section —
        // always enabled so either view can be uploaded independently.
        <FleetSegmented options={PROOF_OPTIONS} value={proofKind} onChange={onProofKindChange} />
      )}
      {doc && (
        <span className="text-black text-sm">Received On: {doc.receivedOn}</span>
      )}
      {onRemoveSection && (
        <button
          type="button"
          onClick={onRemoveSection}
          title="Remove this proof of address section"
          className="h-8 px-3 py-2 rounded outline outline-1 -outline-offset-1 outline-neutral-500 inline-flex items-center gap-2 text-neutral-600 text-sm hover:bg-red-50"
        >
          {/* <img src={TrashIcon} alt="" className="w-4 h-4" /> */}
          Remove
        </button>
      )}
    </div>
    <div className="h-px bg-neutral-100" />

    {doc ? (
      <div className="flex flex-col items-center gap-4">
        {doc.previewUrl ? (
          <img
            src={doc.previewUrl}
            alt={label}
            className="max-h-72 max-w-full rounded object-contain"
          />
        ) : (
          <div className="w-full p-4 rounded outline outline-1 -outline-offset-1 outline-neutral-200 flex items-center justify-between gap-4">
            <div className="min-w-0 flex items-center gap-3">
              <span className="w-10 h-10 shrink-0 rounded bg-red-50 text-red-600 flex items-center justify-center">
                <FileText size={20} />
              </span>
              <div className="min-w-0">
                <div className="truncate text-neutral-900 text-sm font-medium">{doc.name}</div>
                <div className="text-neutral-500 text-xs">{doc.isPdf ? "PDF document" : "Document"}</div>
              </div>
            </div>
            {doc.viewUrl && (
              <button
                type="button"
                onClick={() => window.open(doc.viewUrl!, "_blank", "noopener,noreferrer")}
                className="h-8 px-3 py-2 shrink-0 bg-white rounded outline outline-1 -outline-offset-1 outline-neutral-900 flex items-center gap-2 text-neutral-900 text-sm hover:bg-neutral-50"
              >
                <Eye size={16} />
                View
              </button>
            )}
          </div>
        )}
        <div className="h-px bg-neutral-100 w-full" />
        <button
          type="button"
          onClick={onRemove}
          className="h-8 px-3 py-2 self-center bg-white rounded outline outline-1 -outline-offset-1 outline-neutral-900 flex items-center gap-2 text-neutral-900 text-sm hover:bg-neutral-50"
        >
          <img src={TrashIcon} alt="" className="w-4 h-4" />
          Remove
        </button>
      </div>
    ) : (
      <button
        type="button"
        onClick={onUploadClick}
        className="p-6 rounded-lg border-2 border-dashed border-neutral-200 flex flex-col items-center justify-center gap-4 hover:bg-neutral-50 transition-colors"
      >
        <UploadPrompt />
        <div className="flex flex-col items-center gap-1">
          <span className="text-black text-base font-semibold">{uploadLabel ?? label}</span>
          <span className="text-black text-sm">JPG, PNG, PDF Supported</span>
        </div>
      </button>
    )}
  </section>
);

// Each address part (split on commas) on its own line, postcode last.
const AddressBlock: React.FC<{ address: string; postcode: string }> = ({ address, postcode }) => {
  const lines = address.split(",").map((s) => s.trim()).filter(Boolean);
  return lines.length || postcode ? (
    <div className="text-black text-sm flex flex-col gap-0.5">
      {lines.map((l, i) => <span key={i}>{l}</span>)}
      {postcode && <span>{postcode}</span>}
    </div>
  ) : (
    <div className="text-black text-sm">Not detected</div>
  );
};

const DriverProofs: React.FC = () => {
  const [sections, setSections] = useState<ProofSection[]>([
    { id: 1, activeKind: "bank_statement", docs: { bank_statement: null, utility_bill: null } },
  ]);
  // Global Bank Statement / Utility Bill switch — flips ALL sections at once.
  const [activeKind, setActiveKind] = useState<ProofKind>("bank_statement");
  const nextSectionId = useRef(2);
  const [dl, setDl] = useState<Record<DlKey, UploadedDoc | null>>({ dlFront: null, dlBack: null });
  const [activeUpload, setActiveUpload] = useState<Target | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Target | null>(null);
  // OCR results driving the licence dates + address comparison. Proof OCR is keyed
  // by docType so either view of section 1 can drive the compare as you switch.
  const [dlOcr, setDlOcr] = useState({
    address: "9 Anderson Drive Aberdeen Pe",
    postcode: "AB",
    start: "",
    end: "",
  });
  const [proofOcr, setProofOcr] = useState<Record<string, { address: string; postcode: string }>>({});
  const [ocrLoading, setOcrLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(false);
  const { hireId } = useHire();

  const makeDoc = (file: File): UploadedDoc => ({
    previewUrl: file.type.startsWith("image/") ? URL.createObjectURL(file) : null,
    viewUrl: URL.createObjectURL(file),
    isPdf: file.type === "application/pdf" || PDF_EXT.test(file.name),
    name: file.name,
    receivedOn: receivedToday(),
  });

  // Store to the backend and return the new doc id — awaited by the upload modal
  // so it stays open until the document is actually persisted.
  const uploadDoc = async (docType: string, file: File): Promise<number | null> => {
    if (!hireId) return null;
    const doc = await uploadHireDocument(hireId, docType, file);
    return doc?.id ?? null;
  };

  const deleteExistingDocType = async (docType: string) => {
    if (!hireId) return;
    const existing = await getHireDocuments(hireId);
    await Promise.all(
      existing
        .filter((doc) => doc.doc_type === docType)
        .map((doc) => deleteHireDocument(hireId, doc.id)),
    );
  };

  // Re-OCR a saved image (best-effort) so the address compare returns on reopen.
  const urlToFile = async (url: string, name: string): Promise<File | null> => {
    try {
      const res = await fetch(url);
      if (!res.ok) return null;
      const blob = await res.blob();
      return new File([blob], name || "doc", { type: blob.type });
    } catch {
      return null;
    }
  };

  const persistedDocToFile = async (doc: HireDocument, name: string): Promise<File | null> => {
    if (!hireId) return null;
    const url = await getHireDocumentFileUrl(hireId, doc.id);
    if (!url) return null;
    const file = await urlToFile(url, name);
    URL.revokeObjectURL(url);
    return file;
  };

  // Restore uploaded previews (and re-run the address compare) when reopening a hire.
  const hydrated = useRef(false);
  useEffect(() => {
    if (hydrated.current || !hireId) {
      setInitialLoading(false);
      return;
    }
    hydrated.current = true;
    (async () => {
      setInitialLoading(true);
      try {
        const docs = latestByDocType(await getHireDocuments(hireId));
        const proofs = docs
          .filter((d) => isProofDocType(d.doc_type))
          .sort((a, b) => proofIdFromDocType(a.doc_type) - proofIdFromDocType(b.doc_type));
        if (proofs.length) {
          // Group the flat doc list into sections (by id); each holds up to two views.
          const byId = new Map<number, ProofSection>();
          for (const d of proofs) {
            const id = proofIdFromDocType(d.doc_type);
            const kind = proofKindFromDocType(d.doc_type);
            let sec = byId.get(id);
            if (!sec) { sec = { id, activeKind: kind, docs: { bank_statement: null, utility_bill: null } }; byId.set(id, sec); }
            sec.docs[kind] = await docToUploaded(hireId, d);
          }
          const secs = Array.from(byId.values()).map((s) => ({
            ...s,
            activeKind: (s.docs.bank_statement ? "bank_statement" : "utility_bill") as ProofKind,
          }));
          setSections(secs);
          // Land the global switch on whichever view section 1 has a document for.
          if (secs[0]) setActiveKind(secs[0].docs.bank_statement ? "bank_statement" : "utility_bill");
          nextSectionId.current = Math.max(...secs.map((s) => s.id)) + 1;
        }
        const front = docs.find((d) => d.doc_type === "dlFront");
        const back = docs.find((d) => d.doc_type === "dlBack");
        if (front || back) {
          const [frontDoc, backDoc] = await Promise.all([
            front ? docToUploaded(hireId, front) : null,
            back ? docToUploaded(hireId, back) : null,
          ]);
          setDl({ dlFront: frontDoc, dlBack: backDoc });
        }
        // Best-effort re-OCR of section 1's proofs (both views) + licence front so the
        // compare returns immediately whichever view is selected on reopen.
        const firstId = proofs.length ? proofIdFromDocType(proofs[0].doc_type) : null;
        const firstProofs = firstId != null ? proofs.filter((d) => proofIdFromDocType(d.doc_type) === firstId) : [];
        if (firstProofs.length || front) {
          setOcrLoading(true);
          try {
            for (const d of firstProofs) {
              const f = await persistedDocToFile(d, d.filename || "proof");
              if (f) {
                const r = await extractProofOfAddress(f);
                const key = proofDocType(proofKindFromDocType(d.doc_type), proofIdFromDocType(d.doc_type));
                setProofOcr((m) => ({ ...m, [key]: { address: r.address, postcode: r.postcode } }));
              }
            }
            if (front) {
              const f = await persistedDocToFile(front, front.filename || "licence");
              if (f) { const r = await extractDriverDetailsFromLicence(f); setDlOcr({ address: r.address, postcode: r.postcode, start: r.licenceStart, end: r.licenceEnd }); }
            }
          } finally {
            setOcrLoading(false);
          }
        }
      } catch (error) {
        console.warn("Unable to restore driver proof documents.", error);
      } finally {
        setInitialLoading(false);
      }
    })();
  }, [hireId]);

  const addSection = () =>
    setSections((s) => {
      const id = nextSectionId.current++;
      return [...s, { id, activeKind: "bank_statement", docs: { bank_statement: null, utility_bill: null } }];
    });

  const sectionHasDocs = (s?: ProofSection) => !!(s && (s.docs.bank_statement || s.docs.utility_bill));

  // Remove an entire added section (both views). Deletes any uploaded docs from the
  // backend and clears their OCR; then drops the section from the list.
  const removeSectionAt = (index: number) => {
    const section = sections[index];
    if (!section) return;
    (["bank_statement", "utility_bill"] as ProofKind[]).forEach((kind) => {
      const doc = section.docs[kind];
      if (doc?.docId && hireId) deleteHireDocument(hireId, doc.docId);
      revokeDocUrls(doc);
    });
    setProofOcr((m) => {
      const n = { ...m };
      delete n[proofDocType("bank_statement", section.id)];
      delete n[proofDocType("utility_bill", section.id)];
      return n;
    });
    setSections((secs) => secs.filter((_, idx) => idx !== index));
  };

  // Empty sections drop immediately; a section holding uploads asks first.
  const onRemoveSectionClick = (index: number) => {
    const section = sections[index];
    if (section && sectionHasDocs(section)) setDeleteTarget({ kind: "section", index });
    else removeSectionAt(index);
  };

  const targetLabel = (t: Target) => {
    if (t.kind === "proof") return `${sectionTitle(t.index)} — ${proofKindLabel(t.proofKind)}`;
    if (t.kind === "section") return sectionTitle(t.index);
    return DL_LABELS[t.key];
  };

  const uploadTargetLabel = (t: Target) => {
    if (t.kind === "proof") return proofKindLabel(t.proofKind);
    return targetLabel(t);
  };

  const handleUploaded = async (file: File) => {
    const target = activeUpload;
    if (!target) return;

    if (target.kind === "proof") {
      const i = target.index;
      const kind = target.proofKind;
      const section = sections[i];
      if (!section) return;
      const docType = proofDocType(kind, section.id);
      setSections((secs) => {
        const next = [...secs];
        const sec = next[i];
        if (!sec) return secs;
        revokeDocUrls(sec.docs[kind]);
        next[i] = { ...sec, docs: { ...sec.docs, [kind]: makeDoc(file) } };
        return next;
      });
      // Section-1 proofs drive the address comparison (either view).
      if (i === 0) {
        setOcrLoading(true);
        extractProofOfAddress(file)
          .then((d) => setProofOcr((m) => ({ ...m, [docType]: { address: d.address, postcode: d.postcode } })))
          .finally(() => setOcrLoading(false));
      }
      await deleteExistingDocType(docType);
      const id = await uploadDoc(docType, file);
      if (id) {
        setSections((secs) => {
          const next = [...secs];
          const sec = next[i];
          if (sec?.docs[kind]) next[i] = { ...sec, docs: { ...sec.docs, [kind]: { ...sec.docs[kind]!, docId: id } } };
          return next;
        });
      }
      return;
    }

    if (target.kind !== "dl") return;
    const key = target.key;
    setDl((prev) => {
      revokeDocUrls(prev[key]);
      return { ...prev, [key]: makeDoc(file) };
    });
    if (key === "dlFront") {
      setOcrLoading(true);
      extractDriverDetailsFromLicence(file)
        .then((d) => setDlOcr({ address: d.address, postcode: d.postcode, start: d.licenceStart, end: d.licenceEnd }))
        .finally(() => setOcrLoading(false));
    }
    await deleteExistingDocType(key);
    const id = await uploadDoc(key, file);
    if (id) setDl((prev) => (prev[key] ? { ...prev, [key]: { ...prev[key]!, docId: id } } : prev));
  };

  const doRemove = (target: Target) => {
    if (target.kind === "section") {
      removeSectionAt(target.index);
      return;
    }
    if (target.kind === "proof") {
      const i = target.index;
      const kind = target.proofKind;
      const section = sections[i];
      const doc = section?.docs[kind] || null;
      if (doc?.docId && hireId) deleteHireDocument(hireId, doc.docId);
      revokeDocUrls(doc);
      const docType = section ? proofDocType(kind, section.id) : "";
      // Clear just this view; the section stays (it may still hold the other view).
      setSections((secs) => secs.map((s, idx) => (idx === i ? { ...s, docs: { ...s.docs, [kind]: null } } : s)));
      setProofOcr((m) => {
        const n = { ...m };
        delete n[docType];
        return n;
      });
      return;
    }
    if (target.kind !== "dl") return;
    const key = target.key;
    const ex = dl[key];
    if (ex?.docId && hireId) deleteHireDocument(hireId, ex.docId);
    revokeDocUrls(ex);
    setDl((prev) => ({ ...prev, [key]: null }));
    if (key === "dlFront") setDlOcr({ address: "", postcode: "", start: "", end: "" });
  };

  const section1 = sections[0];
  const activeProofDoc = section1?.docs[activeKind] || null;
  const activeProofDocType = section1 ? proofDocType(activeKind, section1.id) : "";
  const activeProofOcr = proofOcr[activeProofDocType] || { address: "", postcode: "" };
  const selectedProofLabel = proofKindLabel(activeKind);
  const showLicenceDates = !!dl.dlFront;
  const showCompare = !!activeProofDoc && !!dl.dlFront;
  const dlFull = [dlOcr.address, dlOcr.postcode].filter(Boolean).join(", ");
  const utilFull = [activeProofOcr.address, activeProofOcr.postcode].filter(Boolean).join(", ");
  const bothPresent = !!dlFull && !!utilFull;
  const addressesMatch = bothPresent && normalise(dlFull) === normalise(utilFull);

  return (
    <div className="w-full max-w-[788px] flex flex-col gap-6 font-sans-headline">
      {initialLoading && <FleetSpinnerLoader />}
      <h2 className="text-black text-2xl font-semibold leading-6">
        Driver Proofs &amp; License Checks with Address Match
      </h2>
      {ocrLoading && <FleetInlineLoader text="Reading document…" />}

      {/* Global switch — flips every proof-of-address section between Bank Statement
          and Utility Bill at once. */}
      <section className="p-5 rounded-lg outline outline-1 -outline-offset-1 outline-neutral-100 flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-black text-xl font-semibold leading-5">Upload Documents</h3>
        <FleetSegmented options={PROOF_OPTIONS} value={activeKind} onChange={(v) => setActiveKind(v as ProofKind)} />
      </section>

      {/* Every section shows the globally-selected view; each still keeps its own upload. */}
      {sections.map((section, i) => (
        <DocumentCard
          key={`section-${section.id}`}
          label={proofKindLabel(activeKind)}
          uploadLabel={proofKindLabel(activeKind)}
          doc={section.docs[activeKind]}
          onUploadClick={() => setActiveUpload({ kind: "proof", index: i, proofKind: activeKind })}
          onRemove={() => setDeleteTarget({ kind: "proof", index: i, proofKind: activeKind })}
          // The first section is the primary proof (always present); added ones can be removed.
          onRemoveSection={i > 0 ? () => onRemoveSectionClick(i) : undefined}
        />
      ))}

      {/* Only offer "Add Another" once the first section actually has a document. */}
      {sectionHasDocs(sections[0]) && (
        <div className="self-stretch flex flex-col items-center">
          <button
            type="button"
            onClick={addSection}
            className="h-8 px-3 py-2 rounded outline outline-1 -outline-offset-1 outline-neutral-900 inline-flex justify-center items-center gap-2.5 text-neutral-900 text-sm font-normal leading-4 hover:bg-neutral-50"
          >
            <img src={PlusIcon} alt="" className="w-4 h-4" />
            Add Another {proofKindLabel(activeKind)}
          </button>
        </div>
      )}

      {(Object.keys(DL_LABELS) as DlKey[]).map((key) => (
        <DocumentCard
          key={key}
          label={DL_LABELS[key]}
          doc={dl[key]}
          onUploadClick={() => setActiveUpload({ kind: "dl", key })}
          onRemove={() => setDeleteTarget({ kind: "dl", key })}
        />
      ))}

      {showLicenceDates && (
        <section className="p-5 rounded-lg outline outline-1 -outline-offset-1 outline-neutral-100 flex flex-col gap-4">
          <h3 className="text-black text-xl font-semibold leading-5">
            Driving License Start/End
          </h3>
          <div className="h-px bg-neutral-100" />
          <div className="flex flex-col gap-3">
            <div className="text-black text-sm">
              Driving License Start Date :{" "}
              <span className="font-semibold">{dlOcr.start || "—"}</span>
            </div>
            <div className="text-black text-sm">
              Driving License End Date :{" "}
              <span className="font-semibold">{dlOcr.end || "—"}</span>
            </div>
          </div>
        </section>
      )}

      {showCompare && (
        <section className="px-5 py-4 rounded-lg outline outline-1 -outline-offset-1 outline-neutral-100 flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <h3 className="text-black text-xl font-semibold leading-5">
              Compare Address
            </h3>
            {!bothPresent ? (
              <div className="p-2 bg-neutral-100 rounded flex items-center gap-2 text-neutral-600 text-sm">
                Reading…
              </div>
            ) : addressesMatch ? (
              <div className="p-2 bg-green-100 rounded flex items-center gap-2.5 text-black text-sm">
                <img src={CheckCircleIcon} alt="" className="w-5 h-5" />
                Matched
              </div>
            ) : (
              <div className="p-2 bg-red-100 rounded flex items-center gap-2 text-black text-sm">
                <img src={AlertIcon} alt="" className="w-5 h-5" />
                Mismatch
              </div>
            )}
          </div>
          {bothPresent &&
            (addressesMatch ? (
              <div className="px-4 py-2 bg-green-100 rounded text-neutral-700 text-sm">
                Address matched between Driving Licence and {selectedProofLabel}
              </div>
            ) : (
              <div className="px-4 py-2 bg-red-100 rounded text-neutral-700 text-sm">
                Address does not match between Driving Licence and {selectedProofLabel}
              </div>
            ))}
          <div className="flex items-start gap-6">
            <div className="flex-1 p-5 rounded-lg outline outline-1 -outline-offset-1 outline-neutral-100 flex flex-col gap-3">
              <div className="text-black text-base font-semibold">
                Driving License Address
              </div>
              <AddressBlock address={dlOcr.address} postcode={dlOcr.postcode} />
            </div>
            <div className="flex-1 p-5 rounded-lg outline outline-1 -outline-offset-1 outline-neutral-100 flex flex-col gap-3">
              <div className="text-black text-base font-semibold">
                {selectedProofLabel} Address
              </div>
              <AddressBlock address={activeProofOcr.address} postcode={activeProofOcr.postcode} />
            </div>
          </div>
        </section>
      )}

      <FleetUploadModal
        open={activeUpload !== null}
        onClose={() => setActiveUpload(null)}
        onUploaded={handleUploaded}
        title={activeUpload ? uploadTargetLabel(activeUpload) : "Upload Document"}
      />

      {deleteTarget && (
        <FleetConfirmModal
          title="Delete Document"
          message={`Are you sure you want to delete ${targetLabel(deleteTarget)}?`}
          confirmLabel="Delete"
          onConfirm={() => {
            doRemove(deleteTarget);
            setDeleteTarget(null);
          }}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
};

export default DriverProofs;
