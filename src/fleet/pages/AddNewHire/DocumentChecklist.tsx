import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import RemoveIcon from "../../assets/icons/Remove.svg";
import UploadFileIcon from "../../assets/icons/UploadFile.svg";
import FleetUploadModal from "../../components/FleetUploadModal";
import FleetConfirmModal from "../../components/FleetConfirmModal";
import {
  deleteHireDocument,
  getHireDocuments,
  uploadHireDocument,
  type HireDocument,
} from "../../services/hireService";
import { useHire } from "./HireContext";

const SECTION = "self-stretch p-5 rounded-lg outline outline-1 -outline-offset-1 outline-neutral-100 flex flex-col gap-4";
const H3 = "text-black text-xl font-semibold leading-5";

const CHECKLIST_DOCUMENTS = [
  { key: "checklist_bank_statement", label: "Bank Statement" },
  { key: "checklist_utility_bill", label: "Utility Bill" },
  { key: "checklist_dl_front", label: "Driving License Front" },
  { key: "checklist_dl_back", label: "Driving License Back" },
  { key: "checklist_taxi_badge", label: "Taxi Badge" },
  { key: "checklist_customer_insurance", label: "Customer Insurance (Optional)" },
  { key: "checklist_signed_rental_contract", label: "Signed Rental Contract" },
  { key: "checklist_signed_checkout_sheet", label: "Signed Check-Out Sheet" },
  { key: "checklist_signed_checkin_sheet", label: "Signed Check-In Sheet" },
] as const;

type ChecklistDoc = (typeof CHECKLIST_DOCUMENTS)[number];

const matchesChecklistDoc = (docType: string, checklistKey: string) => {
  if (docType === checklistKey) return true;
  if (checklistKey === "checklist_bank_statement") return docType.startsWith("bank_statement_");
  if (checklistKey === "checklist_utility_bill") return docType.startsWith("utility_") || docType === "firstUtility" || docType === "secondUtility";
  if (checklistKey === "checklist_dl_front") return docType === "driving_licence" || docType === "dlFront";
  if (checklistKey === "checklist_dl_back") return docType === "dlBack";
  if (checklistKey === "checklist_customer_insurance") return docType === "insurance_certificate";
  return false;
};

const toDisplayDateTime = (value?: string) => {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  const date = d
    .toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
    })
    .replace(/\//g, "-");
  const time = d
    .toLocaleTimeString("en-GB", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
    .replace(/\s/g, "")
    .toUpperCase();
  return `${date} . ${time}`;
};

const toDisplayDate = (value?: string) => {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  });
};

const EmptyUploadCard: React.FC<{ doc: ChecklistDoc; onClick: () => void }> = ({ doc, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="self-stretch p-6 rounded-lg outline outline-1 -outline-offset-1 outline-neutral-200 flex flex-col justify-center items-center gap-6 hover:bg-neutral-50 transition-colors"
  >
    <img src={UploadFileIcon} alt="" className="w-12 h-12" />
    <div className="flex flex-col items-center gap-2 text-center">
      <div className="text-black text-base font-semibold">{doc.label}</div>
      <div className="text-black text-sm">JPG, PNG, PDF Supported</div>
    </div>
  </button>
);

const UploadedDocumentCard: React.FC<{
  docType: ChecklistDoc;
  uploaded: HireDocument;
  onRemove: () => void;
}> = ({ docType, uploaded, onRemove }) => (
  <div className="self-stretch p-4 rounded-lg outline outline-1 -outline-offset-1 outline-neutral-200 flex flex-col gap-2">
    <div className="text-black text-base font-semibold">{docType.label}</div>
    <div className="self-stretch flex justify-between items-center gap-4">
      <div className="min-w-0 flex flex-wrap items-center gap-4">
        <a
          href={uploaded.file_url || undefined}
          target="_blank"
          rel="noreferrer"
          className="max-w-[190px] p-2 rounded-sm outline outline-1 -outline-offset-1 outline-neutral-700 text-black text-sm truncate"
        >
          {uploaded.filename || "Document"}
        </a>
        <div className="text-sm">
          <span className="text-neutral-700">Uploaded by: </span>
          <span className="text-neutral-900">Current User</span>
        </div>
        <div className="text-neutral-700 text-sm">
          {toDisplayDateTime(uploaded.created_at) || toDisplayDate(uploaded.received_on)}
        </div>
      </div>
      <button type="button" onClick={onRemove} title="Remove document" className="w-5 h-5 shrink-0 hover:opacity-70">
        <img src={RemoveIcon} alt="" className="w-5 h-5" />
      </button>
    </div>
  </div>
);

const DocumentChecklist: React.FC = () => {
  const { hireId } = useHire();
  const [documents, setDocuments] = useState<HireDocument[]>([]);
  const [activeUpload, setActiveUpload] = useState<ChecklistDoc | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<HireDocument | null>(null);

  useEffect(() => {
    if (!hireId) return;
    getHireDocuments(hireId).then(setDocuments);
  }, [hireId]);

  const documentsByChecklistKey = useMemo(
    () =>
      CHECKLIST_DOCUMENTS.reduce<Record<string, HireDocument>>((acc, checklistDoc) => {
        const latestExact = [...documents]
          .sort((a, b) => b.id - a.id)
          .find((doc) => doc.doc_type === checklistDoc.key);
        const latestAlias = [...documents]
          .sort((a, b) => b.id - a.id)
          .find((doc) => matchesChecklistDoc(doc.doc_type, checklistDoc.key));
        const matched = latestExact || latestAlias;
        if (matched) acc[checklistDoc.key] = matched;
        return acc;
      }, {}),
    [documents],
  );

  const handleUpload = async (file: File) => {
    if (!hireId || !activeUpload) return;
    const uploaded = await uploadHireDocument(hireId, activeUpload.key, file);
    if (!uploaded) {
      // Throw so the upload modal shows the error and stays open.
      throw new Error("Unable to upload document.");
    }
    setDocuments((current) => [
      ...current.filter((doc) => doc.doc_type !== activeUpload.key),
      uploaded,
    ]);
    toast.success("Document uploaded.");
  };

  const confirmDelete = async () => {
    if (!hireId || !deleteTarget) return;
    await deleteHireDocument(hireId, deleteTarget.id);
    setDocuments((current) => current.filter((doc) => doc.id !== deleteTarget.id));
    setDeleteTarget(null);
    toast.success("Document removed.");
  };

  return (
    <div className="w-full max-w-[788px] flex flex-col gap-6 font-sans-headline">
      <h2 className="text-black text-2xl font-semibold leading-6">Documents Checklist</h2>

      <section className={SECTION}>
        <h3 className={H3}>Signed Documents Upload</h3>
        <div className="h-px bg-neutral-100" />
        {CHECKLIST_DOCUMENTS.map((docType) => {
          const uploaded = documentsByChecklistKey[docType.key];
          return uploaded ? (
            <UploadedDocumentCard
              key={docType.key}
              docType={docType}
              uploaded={uploaded}
              onRemove={() => setDeleteTarget(uploaded)}
            />
          ) : (
            <EmptyUploadCard key={docType.key} doc={docType} onClick={() => setActiveUpload(docType)} />
          );
        })}
      </section>

      <FleetUploadModal
        open={activeUpload !== null}
        onClose={() => setActiveUpload(null)}
        onUploaded={handleUpload}
        title={activeUpload ? activeUpload.label : "Upload Document"}
      />

      {deleteTarget && (
        <FleetConfirmModal
          title="Remove Document"
          message={`Are you sure you want to remove ${deleteTarget.filename || "this document"}?`}
          confirmLabel="Remove"
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
};

export default DocumentChecklist;
