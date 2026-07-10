import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import FleetUploadModal from "../../components/FleetUploadModal";
import {
  FleetDateField,
  FleetSelect,
  FleetTextArea,
  FleetTextInput,
  FleetTimeSelect,
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

const SECTION = "self-stretch p-5 rounded-lg outline outline-1 -outline-offset-1 outline-neutral-100 flex flex-col gap-4";
const H3 = "text-black text-xl font-semibold leading-5";
const BTN_DARK = "h-8 px-3 py-2 bg-neutral-900 rounded-sm text-white text-sm hover:bg-black disabled:opacity-40 disabled:cursor-not-allowed";
const BTN_OUTLINE = "h-8 px-3 py-2 bg-white rounded-sm outline outline-1 -outline-offset-1 outline-neutral-900 text-neutral-900 text-sm hover:bg-neutral-50";

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
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return `${d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  })} . ${d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`;
};

const UploadPrompt = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-12 h-12 text-neutral-300" aria-hidden>
    <path d="M12 15V4m0 0 4 4m-4-4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const TrashIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" aria-hidden>
    <path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m2 0v12a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

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
  const [deleteTarget, setDeleteTarget] = useState<PcnDocument | null>(null);
  const [noteDraft, setNoteDraft] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    if (!hireId) return;
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
  };

  useEffect(() => {
    load();
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
    if (uploaded) {
      toast.success("Document uploaded.");
      setDocuments((current) => [...current, uploaded]);
      setAudit(await getHireAudit(hireId).then((rows) => rows.filter((row) => row.field_changed.startsWith("pcn."))));
    } else {
      toast.error("Unable to upload document.");
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
    const note = await addPcnNote(hireId, noteDraft);
    if (note) {
      setNoteDraft("");
      setNotes((current) => [note, ...current]);
      setAudit(await getHireAudit(hireId).then((rows) => rows.filter((row) => row.field_changed.startsWith("pcn."))));
      toast.success("Note added.");
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
      <h2 className="text-black text-2xl font-semibold leading-6">Penalty Charges - PCN Management</h2>

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
        <FleetTextInput
          label="Council Address"
          placeholder="Enter"
          value={form.councilAddress}
          onChange={(v) => set("councilAddress", v)}
          onBlur={() => savePartial({ councilAddress: form.councilAddress })}
        />
        <div className="grid grid-cols-2 gap-5">
          <FleetTextInput
            label="Council PostCode"
            placeholder="Enter"
            value={form.councilPostcode}
            onChange={(v) => set("councilPostcode", v.toUpperCase())}
            onBlur={() => savePartial({ councilPostcode: form.councilPostcode })}
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
        <h3 className={H3}>Documents</h3>
        <div className="h-px bg-neutral-100" />
        {DOCUMENT_TYPES.map((type) => {
          const rows = docsByType[type.key] || [];
          const canUpload = type.multiple || rows.length === 0;
          return (
            <div
              key={type.key}
              className={`self-stretch rounded-lg outline outline-1 -outline-offset-1 outline-neutral-200 ${
                rows.length ? "p-4 flex flex-col gap-2" : "p-6"
              }`}
            >
              {rows.length ? (
                <>
                  <div className="flex justify-between items-center gap-4">
                    <div className="text-black text-base font-semibold">{type.label}</div>
                    {canUpload && (
                      <button type="button" onClick={() => setActiveUpload(type)} className={BTN_OUTLINE}>
                        Add File
                      </button>
                    )}
                  </div>
                  {rows.map((doc) => (
                    <div key={doc.id} className="flex justify-between items-center gap-4">
                      <div className="min-w-0 flex flex-wrap items-center gap-4">
                        <a
                          href={doc.file_url || undefined}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2 rounded-sm outline outline-1 -outline-offset-1 outline-neutral-700 text-black text-sm truncate max-w-[180px]"
                        >
                          {doc.filename || "Document"}
                        </a>
                        <span className="text-neutral-700 text-sm">
                          Uploaded by: <span className="text-neutral-900">{doc.uploaded_by || "Current User"}</span>
                        </span>
                        <span className="text-neutral-700 text-sm">
                          {toDisplayDateTime(doc.created_at) || toDisplayDate(doc.received_on)}
                        </span>
                      </div>
                      <button type="button" onClick={() => setDeleteTarget(doc)} className="text-neutral-900 hover:text-red-600">
                        <TrashIcon />
                      </button>
                    </div>
                  ))}
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setActiveUpload(type)}
                  className="w-full flex flex-col justify-center items-center gap-6 hover:bg-neutral-50 transition-colors"
                >
                  <UploadPrompt />
                  <div className="flex flex-col items-center gap-2 text-center">
                    <div className="text-black text-base font-semibold">
                      {type.label}
                      {type.multiple && <span className="text-sm font-normal"> (You Can Add Multiple)</span>}
                    </div>
                    <div className="text-black text-sm">JPG, PNG, PDF Supported</div>
                  </div>
                </button>
              )}
            </div>
          );
        })}
        <button
          type="button"
          onClick={() => toast.info("Liability transfer letter generation will use the saved PCN details.")}
          className={BTN_DARK}
        >
          Generate Liability Transfer Letter
        </button>
      </section>

      <section className={SECTION}>
        <div className="flex justify-between items-center">
          <h3 className={H3}>Timeline / Activity Log</h3>
          <button type="button" className={BTN_OUTLINE}>View Complete Activity Log</button>
        </div>
        {audit.length > 0 && (
          <div className="flex flex-col gap-2">
            {audit.slice(0, 5).map((row) => (
              <div key={row.id} className="p-3 bg-neutral-50 rounded-sm text-sm text-neutral-700">
                <span className="text-neutral-900">{row.user || "User"}</span> updated {row.field_changed.replace("pcn.", "")}
                {row.changed_at && <span> · {toDisplayDateTime(row.changed_at)}</span>}
              </div>
            ))}
          </div>
        )}
      </section>

      <section className={SECTION}>
        <h3 className={H3}>Set Reminders</h3>
        <div className="h-px bg-neutral-100" />
        {REMINDERS.map((reminder) => {
          const value = reminders[reminder.key] || { reminder_type: reminder.key };
          return (
            <div key={reminder.key} className="flex flex-col gap-4">
              <div className="text-black text-base font-semibold">{reminder.label}</div>
              <div className="grid grid-cols-2 gap-5">
                <FleetDateField
                  label="Date & Time"
                  value={value.reminder_date || ""}
                  onChange={(v) => updateReminder(reminder.key, { reminder_date: v })}
                />
                <FleetTimeSelect
                  label="Time"
                  value={value.reminder_time || ""}
                  onChange={(v) => updateReminder(reminder.key, { reminder_time: v })}
                />
              </div>
            </div>
          );
        })}
      </section>

      <section className={SECTION}>
        <h3 className={H3}>Notes</h3>
        {notes.map((note) => (
          <div key={note.id} className="self-stretch p-5 bg-neutral-100 rounded-lg outline outline-1 outline-neutral-100 flex flex-col gap-2">
            <div className="text-neutral-700 text-sm">{note.note}</div>
            <div className="text-neutral-500 text-xs">
              {note.created_by_name || "User"} {note.created_at ? `- ${toDisplayDateTime(note.created_at)}` : ""}
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
          <button type="button" onClick={submitNote} className={BTN_DARK} disabled={!noteDraft.trim()}>
            Add Note
          </button>
        </div>
      </section>

      <section className="self-stretch p-5 rounded-lg outline outline-1 -outline-offset-1 outline-neutral-100 flex justify-center">
        <button type="button" onClick={saveAll} disabled={saving} className={BTN_DARK}>
          {saving ? "Saving..." : "Save Penalty Charge"}
        </button>
      </section>

      <FleetUploadModal
        open={activeUpload !== null}
        onClose={() => setActiveUpload(null)}
        onUploaded={handleDocumentUpload}
        title={activeUpload ? activeUpload.label : "Upload Document"}
      />

      {deleteTarget && (
        <div className="fixed inset-0 z-[130] bg-black/40 flex items-center justify-center p-4 font-sans-headline">
          <div className="w-[420px] max-w-full bg-white rounded-lg p-6 flex flex-col gap-4">
            <div className="text-neutral-900 text-xl font-semibold">Delete Document</div>
            <div className="text-neutral-700 text-sm">
              Are you sure you want to delete {deleteTarget.filename || "this document"}?
            </div>
            <div className="h-px bg-neutral-100" />
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setDeleteTarget(null)} className={BTN_OUTLINE}>
                Cancel
              </button>
              <button type="button" onClick={confirmDeleteDocument} className="h-8 px-3 py-2 bg-red-600 rounded-sm text-white text-sm hover:bg-red-700">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PenaltyCharges;
