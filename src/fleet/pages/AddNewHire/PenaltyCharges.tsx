import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import FleetUploadModal from "../../components/FleetUploadModal";
import FleetBulkUploadModal from "../../components/FleetBulkUploadModal";
import FleetConfirmModal from "../../components/FleetConfirmModal";
import FleetSpinnerLoader from "../../components/FleetSpinnerLoader";
import {
  FleetDateField,
  FleetSelect,
  FleetTextArea,
  FleetTextInput,
  FleetTimeSelect,
  FleetPostcodeLookup,
  FleetAddressAutocomplete,
} from "../../components/fields";
import {
  addPcnNote,
  deletePcnDocument,
  getHireAudit,
  getPcnDocuments,
  getPcnNotes,
  getPcnReminders,
  getPenaltyCharge,
  savePcnReminder,
  savePenaltyCharge,
  uploadPcnDocument,
  type HireAuditEntry,
  type PcnDocument,
  type PcnNote,
  type PcnReminder,
} from "../../services/hireService";
import {
  LIABILITY_TRANSFER_STATUS_OPTIONS,
  PCN_STATUS_OPTIONS,
  type PcnForm,
} from "../../types/hire";
import { useHire } from "./HireContext";
import RemoveIcon from "../../assets/icons/Remove.svg";
import UploadFileIcon from "../../assets/icons/UploadFile.svg";
import PdfIcon from "../../assets/FileTypes/PDF.svg";
import DocIcon from "../../assets/FileTypes/DOC.svg";
import ExcelIcon from "../../assets/FileTypes/Excel.svg";
import PngIcon from "../../assets/FileTypes/PNG.svg";

const SECTION = "self-stretch p-5 rounded-lg outline outline-1 -outline-offset-1 outline-neutral-100 flex flex-col gap-4";
const H3 = "text-black text-xl font-semibold leading-5";
const BTN_DARK = "h-8 px-3 py-2 inline-flex items-center justify-center bg-neutral-900 rounded text-white text-sm leading-none hover:bg-black disabled:opacity-40 disabled:cursor-not-allowed";
const BTN_OUTLINE = "h-8 px-3 py-2 inline-flex items-center justify-center bg-white rounded outline outline-1 -outline-offset-1 outline-neutral-900 text-neutral-900 text-sm leading-none hover:bg-neutral-50";

const EMPTY_FORM: PcnForm = {
  councilName: "",
  councilAddress: "",
  councilPostcode: "",
  pcnNumber: "",
  offenceDate: "",
  pcnStatus: "",
  liabilityTransferStatus: "",
  responseDeadline: "",
};

const DOCUMENT_TYPES = [
  { key: "pcn_notice", label: "PCN Notice", multiple: false },
  { key: "appeal_letters", label: "Appeal Letters", multiple: true },
  { key: "liability_transfer_letters", label: "Liability Transfer Letters", multiple: true },
  { key: "payment_receipts", label: "Payment Receipts", multiple: true },
  { key: "supporting_documents", label: "Supporting Documents", multiple: true },
  { key: "council_correspondence", label: "Council Correspondence", multiple: true },
] as const;

const REMINDERS = [
  { key: "council_response_deadline", label: "Council response deadline" },
  { key: "appeal_deadline", label: "Appeal deadline" },
  { key: "payment_due_date", label: "Payment due date" },
  { key: "follow_up_reminder", label: "Follow-up reminders" },
] as const;

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

const toDisplayDateTime = (value?: string) => {
  if (!value) return "";
  // Postgres timestamps come back without a "Z"; treat them as UTC so the local
  // time is correct rather than offset by the timezone.
  const iso = /[zZ]|[+-]\d\d:?\d\d$/.test(value) ? value : `${value}Z`;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return value;
  return `${d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  })} . ${d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false })}`;
};

const fileIconFor = (filename?: string) => {
  const lower = (filename || "").toLowerCase();
  if (lower.endsWith(".pdf")) return PdfIcon;
  if (lower.endsWith(".doc") || lower.endsWith(".docx")) return DocIcon;
  if (lower.endsWith(".xls") || lower.endsWith(".xlsx") || lower.endsWith(".csv")) return ExcelIcon;
  return PngIcon;
};

// One document type rendered in the checklist style: a label, an upload box per
// file (icon + filename + remove) with an "Uploaded by" line, and a "Received On"
// column. Multiple-file types keep an extra empty box to add another file.
const PcnDocumentRow: React.FC<{
  type: (typeof DOCUMENT_TYPES)[number];
  docs: PcnDocument[];
  onUpload: () => void;
  onRemove: (doc: PcnDocument) => void;
}> = ({ type, docs, onUpload, onRemove }) => {
  const showAdd = type.multiple || docs.length === 0;
  // Single-file types only ever show the latest upload (re-uploading replaces it
  // on screen); multi-file types list all.
  const visibleDocs = type.multiple ? docs : docs.slice(-1);
  return (
    <div className="self-stretch py-2 grid grid-cols-1 md:grid-cols-[1fr_240px] gap-4 items-start">
      {/* Left: type label + file box(es) + the add-another box. */}
      <div className="flex flex-col gap-2 min-w-0">
        <label className="text-neutral-700 text-sm font-medium">{type.label}</label>
        {visibleDocs.map((doc) => (
          <div key={doc.id} className="flex flex-col gap-2 min-w-0">
            <button
              type="button"
              onClick={onUpload}
              className="h-[52px] px-4 bg-white rounded outline outline-1 -outline-offset-1 outline-neutral-200 flex items-center justify-between gap-3 hover:bg-neutral-50"
            >
              <div className="min-w-0 flex items-center gap-3">
                <img src={fileIconFor(doc.filename)} alt="" className="w-8 h-8 shrink-0" />
                <span className="max-w-full truncate text-sm text-neutral-900 font-medium">
                  {doc.filename || "Document"}
                </span>
              </div>
              <span
                role="button"
                tabIndex={0}
                onClick={(event) => {
                  event.stopPropagation();
                  onRemove(doc);
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    event.stopPropagation();
                    onRemove(doc);
                  }
                }}
                title="Remove document"
                className="w-5 h-5 shrink-0 hover:opacity-70"
              >
                <img src={RemoveIcon} alt="" className="w-5 h-5" />
              </span>
            </button>
            <div className="text-sm">
              <span className="text-neutral-700">Uploaded by: </span>
              <span className="text-neutral-900">{doc.uploaded_by || "Current User"}</span>
            </div>
          </div>
        ))}
        {showAdd && (
          <button
            type="button"
            onClick={onUpload}
            className="h-[52px] px-4 bg-white rounded outline outline-1 -outline-offset-1 outline-neutral-200 flex items-center gap-3 hover:bg-neutral-50"
          >
            <img src={UploadFileIcon} alt="" className="w-8 h-8 shrink-0" />
            <div className="min-w-0 flex flex-col items-start gap-1">
              <span className="max-w-full truncate text-sm text-neutral-500">
                {docs.length ? "Add another file" : "Upload file"}
              </span>
              <span className="text-neutral-400 text-xs">JPG, PNG, PDF supported</span>
            </div>
          </button>
        )}
      </div>

      {/* Right: Received On — always visible (like the checklist), one aligned box per file. */}
      <div className="flex flex-col gap-2 min-w-0">
        <label className="text-neutral-700 text-sm font-medium">Received On</label>
        {visibleDocs.map((doc) => {
          const dateTime = toDisplayDateTime(doc.created_at) || toDisplayDate(doc.received_on);
          return (
            <div key={doc.id} className="flex flex-col gap-2 min-w-0">
              <div className="h-[52px] px-5 bg-white rounded outline outline-1 -outline-offset-1 outline-neutral-200 flex items-center">
                <span className={`text-sm ${dateTime ? "text-neutral-900" : "text-neutral-400"}`}>
                  {dateTime || "Date / Time"}
                </span>
              </div>
              {/* Invisible spacer that height-matches the "Uploaded by" line on the
                  left, so each date box stays aligned with its file box. */}
              <div className="text-sm invisible select-none" aria-hidden>Uploaded by: .</div>
            </div>
          );
        })}
        {showAdd && (
          <div className="h-[52px] px-5 bg-white rounded outline outline-1 -outline-offset-1 outline-neutral-200 flex items-center">
            <span className="text-sm text-neutral-400">Date / Time</span>
          </div>
        )}
      </div>
    </div>
  );
};


const mapApiToForm = (data: any): PcnForm => ({
  councilName: data?.council_name ?? "",
  councilAddress: data?.council_address ?? "",
  councilPostcode: data?.council_postcode ?? "",
  pcnNumber: data?.pcn_number ?? "",
  offenceDate: data?.offence_date ?? "",
  pcnStatus: data?.pcn_status ?? "",
  liabilityTransferStatus: data?.liability_transfer_status ?? "",
  responseDeadline: data?.response_deadline ?? "",
});

const mapFormToApi = (form: PcnForm) => ({
  council_name: form.councilName,
  council_address: form.councilAddress,
  council_postcode: form.councilPostcode,
  pcn_number: form.pcnNumber,
  offence_date: form.offenceDate || null,
  pcn_status: form.pcnStatus,
  liability_transfer_status: form.liabilityTransferStatus,
  response_deadline: form.responseDeadline || null,
});

const PenaltyCharges: React.FC = () => {
  const { hireId } = useHire();
  const [form, setForm] = useState<PcnForm>(EMPTY_FORM);
  const [documents, setDocuments] = useState<PcnDocument[]>([]);
  const [notes, setNotes] = useState<PcnNote[]>([]);
  const [audit, setAudit] = useState<HireAuditEntry[]>([]);
  const [reminders, setReminders] = useState<Record<string, PcnReminder>>({});
  const [activeUpload, setActiveUpload] = useState<(typeof DOCUMENT_TYPES)[number] | null>(null);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<PcnDocument | null>(null);
  const [noteDraft, setNoteDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [addingNote, setAddingNote] = useState(false);
  const [initialLoading, setInitialLoading] = useState(false);

  const load = async (showLoader = false) => {
    if (!hireId) {
      setInitialLoading(false);
      return;
    }

    if (showLoader) setInitialLoading(true);
    try {
      const [pcn, docs, pcnNotes, pcnReminders, auditRows] = await Promise.all([
        getPenaltyCharge(hireId),
        getPcnDocuments(hireId),
        getPcnNotes(hireId),
        getPcnReminders(hireId),
        getHireAudit(hireId),
      ]);
      if (pcn) setForm(mapApiToForm(pcn));
      setDocuments(docs);
      setNotes(pcnNotes);
      setReminders(
        pcnReminders.reduce<Record<string, PcnReminder>>((acc, item) => {
          acc[item.reminder_type] = item;
          return acc;
        }, {}),
      );
      setAudit(auditRows.filter((row) => row.field_changed.startsWith("pcn.")));
    } finally {
      if (showLoader) setInitialLoading(false);
    }
  };

  useEffect(() => {
    load(true);
  }, [hireId]);

  const set = <K extends keyof PcnForm>(key: K, value: PcnForm[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  const savePartial = async (partial: Partial<PcnForm>) => {
    if (!hireId) return;
    await savePenaltyCharge(hireId, mapFormToApi({ ...form, ...partial }));
    const auditRows = await getHireAudit(hireId);
    setAudit(auditRows.filter((row) => row.field_changed.startsWith("pcn.")));
  };

  const saveAll = async () => {
    if (!hireId) {
      toast.error("Hire record is not ready yet.");
      return;
    }
    setSaving(true);
    const saved = await savePenaltyCharge(hireId, mapFormToApi(form));
    setSaving(false);
    if (saved) {
      toast.success("Penalty charge saved.");
      load();
    } else {
      toast.error("Unable to save penalty charge.");
    }
  };

  const docsByType = useMemo(
    () =>
      documents.reduce<Record<string, PcnDocument[]>>((acc, doc) => {
        acc[doc.doc_type] = [...(acc[doc.doc_type] || []), doc];
        return acc;
      }, {}),
    [documents],
  );

  const handleDocumentUpload = async (file: File) => {
    if (!hireId || !activeUpload) return;
    const uploaded = await uploadPcnDocument(hireId, activeUpload.key, file);
    if (!uploaded) {
      // Throw so the upload modal shows the error and stays open.
      throw new Error("Unable to upload document.");
    }
    toast.success("Document uploaded.");
    setDocuments((current) => [...current, uploaded]);
    setAudit(await getHireAudit(hireId).then((rows) => rows.filter((row) => row.field_changed.startsWith("pcn."))));
  };

  // Bulk tray: upload one file under the chosen section; throw so the row is flagged.
  const handleBulkUpload = async (docType: string, file: File): Promise<PcnDocument> => {
    if (!hireId) throw new Error("No hire selected.");
    const uploaded = await uploadPcnDocument(hireId, docType, file);
    if (!uploaded) throw new Error("Upload failed.");
    return uploaded;
  };

  const handleBulkUploaded = async (docs: PcnDocument[]) => {
    // Single-file types keep only the newest; multiple-file types append.
    const singleTypes = new Set<string>(DOCUMENT_TYPES.filter((t) => !t.multiple).map((t) => t.key));
    setDocuments((current) => {
      const replaced = new Set(docs.filter((d) => singleTypes.has(d.doc_type)).map((d) => d.doc_type));
      return [...current.filter((d) => !replaced.has(d.doc_type)), ...docs];
    });
    toast.success(`${docs.length} document${docs.length === 1 ? "" : "s"} uploaded.`);
    if (hireId) {
      setAudit(await getHireAudit(hireId).then((rows) => rows.filter((row) => row.field_changed.startsWith("pcn."))));
    }
  };

  const confirmDeleteDocument = async () => {
    if (!hireId || !deleteTarget) return;
    await deletePcnDocument(hireId, deleteTarget.id);
    setDocuments((current) => current.filter((item) => item.id !== deleteTarget.id));
    setDeleteTarget(null);
    toast.success("Document deleted.");
  };

  const submitNote = async () => {
    if (!hireId || !noteDraft.trim()) return;
    setAddingNote(true);
    try {
      const note = await addPcnNote(hireId, noteDraft);
      if (note) {
        setNoteDraft("");
        setNotes((current) => [note, ...current]);
        setAudit(await getHireAudit(hireId).then((rows) => rows.filter((row) => row.field_changed.startsWith("pcn."))));
        toast.success("Note added.");
      } else {
        toast.error("Couldn't add the note. Please try again.");
      }
    } finally {
      setAddingNote(false);
    }
  };

  const updateReminder = async (
    reminderType: string,
    patch: Pick<PcnReminder, "reminder_date" | "reminder_time">,
  ) => {
    if (!hireId) return;
    const current = reminders[reminderType] || { reminder_type: reminderType };
    const saved = await savePcnReminder(hireId, reminderType, {
      reminder_date: patch.reminder_date ?? current.reminder_date ?? "",
      reminder_time: patch.reminder_time ?? current.reminder_time ?? "",
    });
    if (saved) {
      setReminders((items) => ({ ...items, [reminderType]: saved }));
    }
  };

  return (
    <div className="w-full max-w-[788px] flex flex-col gap-6 font-sans-headline">
      {(initialLoading || addingNote) && <FleetSpinnerLoader />}
      <h2 className="text-black text-2xl font-semibold leading-6">
        Penalty Charges - PCN Management
      </h2>

      <section className={SECTION}>
        <h3 className={H3}>Council Details Section</h3>
        <div className="h-px bg-neutral-100" />
        <FleetTextInput
          label="Council Name"
          placeholder="Enter"
          value={form.councilName}
          onChange={(v) => set("councilName", v)}
          onBlur={() => savePartial({ councilName: form.councilName })}
        />
        <FleetAddressAutocomplete
          label="Council Address"
          placeholder="Enter Address"
          address={form.councilAddress}
          onChange={(v) => set("councilAddress", v)}
          onBlur={() => savePartial({ councilAddress: form.councilAddress })}
          onPlaceSelected={(place) => {
            set("councilAddress", place.address);
            if (place.postcode) set("councilPostcode", place.postcode);
            savePartial({
              councilAddress: place.address,
              ...(place.postcode ? { councilPostcode: place.postcode } : {}),
            });
          }}
        />
        <div className="grid grid-cols-2 gap-5">
          <FleetPostcodeLookup
            label="Council PostCode"
            postcode={form.councilPostcode}
            onChange={(v) => set("councilPostcode", v.toUpperCase())}
            onBlur={() =>
              savePartial({ councilPostcode: form.councilPostcode })
            }
            onAddressSelect={(addr) => {
              set("councilAddress", addr.address);
              set("councilPostcode", addr.postcode);
              savePartial({
                councilAddress: addr.address,
                councilPostcode: addr.postcode,
              });
            }}
          />
          <div />
        </div>
      </section>

      <section className={SECTION}>
        <h3 className={H3}>PCN Details Section</h3>
        <div className="h-px bg-neutral-100" />
        <div className="grid grid-cols-2 gap-5">
          <FleetTextInput
            label="PCN Number"
            placeholder="Enter Number"
            value={form.pcnNumber}
            onChange={(v) => set("pcnNumber", v)}
            onBlur={() => savePartial({ pcnNumber: form.pcnNumber })}
          />
          <FleetDateField
            label="Date of Offence"
            value={form.offenceDate}
            onChange={(v) => {
              set("offenceDate", v);
              savePartial({ offenceDate: v });
            }}
          />
        </div>
        <div className="grid grid-cols-2 gap-5">
          <FleetSelect
            label="PCN Status"
            value={form.pcnStatus}
            options={PCN_STATUS_OPTIONS}
            onChange={(v) => {
              set("pcnStatus", v);
              savePartial({ pcnStatus: v });
            }}
          />
          <FleetSelect
            label="Liability Transfer Status"
            value={form.liabilityTransferStatus}
            options={LIABILITY_TRANSFER_STATUS_OPTIONS}
            onChange={(v) => {
              set("liabilityTransferStatus", v);
              savePartial({ liabilityTransferStatus: v });
            }}
          />
        </div>
        <div className="grid grid-cols-2 gap-5">
          <FleetDateField
            label="Response Deadline"
            value={form.responseDeadline}
            onChange={(v) => {
              set("responseDeadline", v);
              savePartial({ responseDeadline: v });
            }}
          />
          <div />
        </div>
      </section>

      <section className={SECTION}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className={H3}>Documents</h3>
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
        <div className="h-px bg-neutral-100" />
        {DOCUMENT_TYPES.map((type, index) => (
          <React.Fragment key={type.key}>
            <PcnDocumentRow
              type={type}
              docs={docsByType[type.key] || []}
              onUpload={() => setActiveUpload(type)}
              onRemove={(doc) => setDeleteTarget(doc)}
            />
            {index < DOCUMENT_TYPES.length - 1 && (
              <div className="h-px bg-neutral-100" />
            )}
          </React.Fragment>
        ))}

        <div className="self-stretch flex justify-center">
          <button
            type="button"
            onClick={() =>
              toast.info(
                "Liability transfer letter generation will use the saved PCN details.",
              )
            }
            className="h-8 w-fit px-3 py-2 bg-neutral-900 rounded inline-flex justify-center items-center gap-2.5"
          >
            <span className="text-white text-sm font-normal font-['Stack_Sans_Headline'] leading-4">
              Generate Liability Transfer Letter
            </span>
          </button>
        </div>
      </section>

      <section className={SECTION}>
        <div className="flex justify-between items-center">
          <h3 className={H3}>Timeline / Activity Log</h3>
          <button type="button" className={BTN_OUTLINE}>
            View Complete Activity Log
          </button>
        </div>
        {audit.length > 0 && (
          <div className="flex flex-col gap-2">
            {audit.slice(0, 5).map((row) => (
              <div
                key={row.id}
                className="p-3 bg-neutral-50 rounded text-sm text-neutral-700"
              >
                <span className="text-neutral-900">{row.user || "User"}</span>{" "}
                updated {row.field_changed.replace("pcn.", "")}
                {row.changed_at && (
                  <span> · {toDisplayDateTime(row.changed_at)}</span>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      <section className={SECTION}>
        <h3 className={H3}>Set Reminders</h3>
        <div className="h-px bg-neutral-100" />
        {REMINDERS.map((reminder) => {
          const value = reminders[reminder.key] || {
            reminder_type: reminder.key,
          };
          return (
            <div key={reminder.key} className="flex flex-col gap-4">
              <div className="text-black text-base font-semibold">
                {reminder.label}
              </div>
              <div className="grid grid-cols-2 gap-5">
                <FleetDateField
                  label="Date & Time"
                  value={value.reminder_date || ""}
                  onChange={(v) =>
                    updateReminder(reminder.key, { reminder_date: v })
                  }
                />
                <FleetTimeSelect
                  label="Time"
                  value={value.reminder_time || ""}
                  onChange={(v) =>
                    updateReminder(reminder.key, { reminder_time: v })
                  }
                />
              </div>
            </div>
          );
        })}
      </section>

      <section className={SECTION}>
        <h3 className={H3}>Notes</h3>
        {notes.map((note) => (
          <div
            key={note.id}
            className="self-stretch p-5 bg-neutral-100 rounded-lg outline outline-1 outline-neutral-100 flex flex-col gap-2"
          >
            <div className="text-neutral-700 text-sm">{note.note}</div>
            <div className="text-neutral-500 text-xs">
              {note.created_by_name || "User"}{" "}
              {note.created_at ? `- ${toDisplayDateTime(note.created_at)}` : ""}
            </div>
          </div>
        ))}
        <div className="h-px bg-neutral-100" />
        <FleetTextArea
          label="Add Notes"
          placeholder="Notes"
          value={noteDraft}
          onChange={setNoteDraft}
        />
        <div className="flex justify-end">
          <button
            type="button"
            onClick={submitNote}
            className={BTN_DARK}
            disabled={!noteDraft.trim() || addingNote}
          >
            {addingNote ? "Adding..." : "Add Note"}
          </button>
        </div>
      </section>

      <section className="self-stretch p-5 rounded outline outline-1 outline-neutral-100 flex justify-center">
        <button
          type="button"
          onClick={saveAll}
          disabled={saving}
          className={BTN_DARK}
        >
          <span>{saving ? "Saving..." : "Save Penalty Charge"}</span>
        </button>
      </section>

      <FleetUploadModal
        open={activeUpload !== null}
        onClose={() => setActiveUpload(null)}
        onUploaded={handleDocumentUpload}
        title={activeUpload ? activeUpload.label : "Upload Document"}
      />

      <FleetBulkUploadModal
        open={bulkOpen}
        onClose={() => setBulkOpen(false)}
        sections={DOCUMENT_TYPES}
        onUpload={handleBulkUpload}
        onUploaded={handleBulkUploaded}
      />

      {deleteTarget && (
        <FleetConfirmModal
          title="Delete Document"
          message={`Are you sure you want to delete ${deleteTarget.filename || "this document"}?`}
          confirmLabel="Delete"
          onConfirm={confirmDeleteDocument}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
};

export default PenaltyCharges;
