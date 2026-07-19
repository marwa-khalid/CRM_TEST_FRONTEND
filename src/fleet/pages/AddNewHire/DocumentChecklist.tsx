import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import RemoveIcon from "../../assets/icons/Remove.svg";
import UploadFileIcon from "../../assets/icons/UploadFile.svg";
import PdfIcon from "../../assets/FileTypes/PDF.svg";
import DocIcon from "../../assets/FileTypes/DOC.svg";
import ExcelIcon from "../../assets/FileTypes/Excel.svg";
import PngIcon from "../../assets/FileTypes/PNG.svg";
import FleetUploadModal from "../../components/FleetUploadModal";
import FleetBulkUploadModal from "../../components/FleetBulkUploadModal";
import FleetConfirmModal from "../../components/FleetConfirmModal";
import FleetSpinnerLoader from "../../components/FleetSpinnerLoader";
import {
  deleteHireDocument,
  getHireDocuments,
  uploadHireDocument,
  type HireDocument,
} from "../../services/hireService";
import { useHire } from "./HireContext";

const SECTION = "self-stretch p-5 rounded-lg outline outline-1 -outline-offset-1 outline-neutral-100 flex flex-col gap-4";
const H3 = "text-black text-xl font-semibold leading-5";

// Logged-in user's display name = the part before @ in their email. Read from the
// JWT (access_token) claims, falling back to the login email in localStorage.
const currentUserName = (): string => {
  const beforeAt = (email?: string | null) => (email && email.includes("@") ? email.split("@")[0] : email || "");
  try {
    const token = localStorage.getItem("access_token");
    if (token) {
      const payload = JSON.parse(atob(token.split(".")[1] || ""));
      const fromToken = beforeAt(payload.email) || beforeAt(payload.sub) || payload.name;
      if (fromToken) return fromToken;
    }
  } catch {
    /* malformed token — fall through */
  }
  return beforeAt(localStorage.getItem("pendingLoginEmail")) || "Current User";
};

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
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })
    .replace(/\s/g, "");
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

const fileIconFor = (filename?: string) => {
  const lower = (filename || "").toLowerCase();
  if (lower.endsWith(".pdf")) return PdfIcon;
  if (lower.endsWith(".doc") || lower.endsWith(".docx")) return DocIcon;
  if (lower.endsWith(".xls") || lower.endsWith(".xlsx") || lower.endsWith(".csv")) return ExcelIcon;
  return PngIcon;
};

const ChecklistDocumentRow: React.FC<{
  docType: ChecklistDoc;
  uploaded?: HireDocument;
  onUpload: () => void;
  onRemove: () => void;
}> = ({ docType, uploaded, onUpload, onRemove }) => {
  const dateTime = toDisplayDateTime(uploaded?.created_at) || toDisplayDate(uploaded?.received_on);
  return (
    <div className="self-stretch py-2 grid grid-cols-1 md:grid-cols-[1fr_240px] gap-4 items-start">
      <div className="flex flex-col gap-2 min-w-0">
        <label className="text-neutral-700 text-sm font-medium">{docType.label}</label>
        <button
          type="button"
          onClick={onUpload}
          className="group h-[52px] px-4 bg-white rounded outline outline-1 -outline-offset-1 outline-neutral-200 flex items-center justify-between gap-3 hover:bg-neutral-50"
        >
          <div className="min-w-0 flex items-center gap-3">
            <img src={uploaded ? fileIconFor(uploaded.filename) : UploadFileIcon} alt="" className="w-8 h-8 shrink-0" />
            <div className="min-w-0 flex flex-col items-start gap-1">
              <span className={`max-w-full truncate text-sm ${uploaded ? "text-neutral-900 font-medium" : "text-neutral-500"}`}>
                {uploaded?.filename || "Upload file"}
              </span>
              {!uploaded && <span className="text-neutral-400 text-xs">JPG, PNG, PDF supported</span>}
            </div>
          </div>
          {uploaded && (
            <span
              role="button"
              tabIndex={0}
              onClick={(event) => {
                event.stopPropagation();
                onRemove();
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  event.stopPropagation();
                  onRemove();
                }
              }}
              title="Remove document"
              className="w-5 h-5 shrink-0 hover:opacity-70"
            >
              <img src={RemoveIcon} alt="" className="w-5 h-5" />
            </span>
          )}
        </button>
        {uploaded && (
          <div className="text-sm">
            <span className="text-neutral-700">Uploaded by: </span>
            <span className="text-neutral-900">{currentUserName()}</span>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2 min-w-0">
        <label className="text-neutral-700 text-sm font-medium">Received On</label>
        <div className="h-[52px] px-5 bg-white rounded outline outline-1 -outline-offset-1 outline-neutral-200 flex items-center">
          <span className={`text-sm ${dateTime ? "text-neutral-900" : "text-neutral-400"}`}>
            {dateTime || "Date / Time"}
          </span>
        </div>
      </div>
    </div>
  );
};

const DocumentChecklist: React.FC = () => {
  const { hireId } = useHire();
  const [documents, setDocuments] = useState<HireDocument[]>([]);
  const [activeUpload, setActiveUpload] = useState<ChecklistDoc | null>(null);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<HireDocument | null>(null);
  const [initialLoading, setInitialLoading] = useState(false);

  useEffect(() => {
    if (!hireId) {
      setDocuments([]);
      setInitialLoading(false);
      return;
    }

    let active = true;
    setInitialLoading(true);
    getHireDocuments(hireId)
      .then((items) => {
        if (active) setDocuments(items);
      })
      .finally(() => {
        if (active) setInitialLoading(false);
      });

    return () => {
      active = false;
    };
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

  // Bulk tray: upload one file under a chosen section; throw so the row is flagged.
  const handleBulkUpload = async (docType: string, file: File): Promise<HireDocument> => {
    if (!hireId) throw new Error("No hire selected.");
    const uploaded = await uploadHireDocument(hireId, docType, file);
    if (!uploaded) throw new Error("Upload failed.");
    return uploaded;
  };

  const handleBulkUploaded = (docs: HireDocument[]) => {
    setDocuments((current) => {
      const replaced = new Set(docs.map((d) => d.doc_type));
      return [...current.filter((doc) => !replaced.has(doc.doc_type)), ...docs];
    });
    toast.success(`${docs.length} document${docs.length === 1 ? "" : "s"} uploaded.`);
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
      {initialLoading && <FleetSpinnerLoader />}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-black text-2xl font-semibold leading-6">Documents Checklist</h2>
        <button
          type="button"
          onClick={() => setBulkOpen(true)}
          disabled={!hireId}
          className="flex items-center gap-2 px-5 py-3 rounded bg-neutral-900 text-white text-sm font-medium hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <img src={UploadFileIcon} alt="" className="w-4 h-4 brightness-0 invert" />
          Upload All Documents
        </button>
      </div>

      <section className={SECTION}>
        <h3 className={H3}>Signed Documents Upload</h3>
        <div className="h-px bg-neutral-100" />
        {CHECKLIST_DOCUMENTS.map((docType) => {
          const uploaded = documentsByChecklistKey[docType.key];
          return (
            <React.Fragment key={docType.key}>
              <ChecklistDocumentRow
                docType={docType}
                uploaded={uploaded}
                onUpload={() => setActiveUpload(docType)}
                onRemove={() => uploaded && setDeleteTarget(uploaded)}
              />
              {docType.key !== CHECKLIST_DOCUMENTS[CHECKLIST_DOCUMENTS.length - 1].key && <div className="h-px bg-neutral-100" />}
            </React.Fragment>
          );
        })}
      </section>

      <FleetUploadModal
        open={activeUpload !== null}
        onClose={() => setActiveUpload(null)}
        onUploaded={handleUpload}
        title={activeUpload ? activeUpload.label : "Upload Document"}
      />

      <FleetBulkUploadModal
        open={bulkOpen}
        onClose={() => setBulkOpen(false)}
        sections={CHECKLIST_DOCUMENTS}
        onUpload={handleBulkUpload}
        onUploaded={handleBulkUploaded}
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
