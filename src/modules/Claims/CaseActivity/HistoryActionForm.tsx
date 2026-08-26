import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import {
  createCaseHistory,
  getTenantUsers,
  getCaseCorrespondents,
  type CaseHistoryActionType,
  type CaseHistoryRecord,
  type CaseCorrespondent,
} from "../../../services/CaseHistory/caseHistory";
import {
  FormShell, LabeledInput, LabeledSelect, LabeledTextArea, LabeledDate, LabeledTime,
  LabeledUkPhone, normalizeUkPhone,
  RichTextEditor, DiaryFollowUp, EMPTY_DIARY, diaryHasContent, diaryRecordFrom,
  CASE_CORRESPONDENTS, LETTER_TEMPLATES, NOTE_CATEGORIES, CALL_TYPES, DIARY_ACTIONS,
  FieldLabel, type DiaryValue,
} from "./historyFormKit";
import SendLetterIcon from "../../../assets/HistorySection/SendLetter.svg";
import SendEmailIcon from "../../../assets/HistorySection/SendEmail.svg";
import IncomingCallIcon from "../../../assets/HistorySection/IncomingCall.svg";
import OutgoingCallIcon from "../../../assets/HistorySection/OutgoingCall.svg";
import NotesIcon from "../../../assets/HistorySection/Notes.svg";
import DiaryIcon from "../../../assets/HistorySection/Diary.svg";

const CONFIG: Record<CaseHistoryActionType, { title: string; icon: string; sendLabel: string }> = {
  send_letter: { title: "Send Letter", icon: SendLetterIcon, sendLabel: "Send" },
  send_email: { title: "Send Email", icon: SendEmailIcon, sendLabel: "Send" },
  // Incoming Email is system-generated (drag-drop / Outlook), never created via this
  // form — present only so the config covers every action type.
  incoming_email: { title: "Incoming Email", icon: SendEmailIcon, sendLabel: "Save Record" },
  incoming_call: { title: "Incoming Calls", icon: IncomingCallIcon, sendLabel: "Save Record" },
  outgoing_call: { title: "Outgoing Calls", icon: OutgoingCallIcon, sendLabel: "Save Record" },
  note: { title: "Add Notes", icon: NotesIcon, sendLabel: "Save Record" },
  diary: { title: "Add Diary", icon: DiaryIcon, sendLabel: "Save Record" },
};

interface Props {
  actionType: CaseHistoryActionType;
  claimId: string | number;
  caseReference: string;
  handlerName: string;
  onClose: () => void;
  onCreated: (rec: CaseHistoryRecord) => void;
}

const HistoryActionForm = ({ actionType, claimId, caseReference, handlerName, onClose, onCreated }: Props) => {
  const cfg = CONFIG[actionType];

  // Shared / per-type fields
  const [correspondent, setCorrespondent] = useState("");
  const [details, setDetails] = useState(""); // History Details / Note Content
  const [template, setTemplate] = useState("");
  const [to, setTo] = useState("");
  const [cc, setCc] = useState("");
  const [bcc, setBcc] = useState("");
  const [subject, setSubject] = useState(actionType === "send_email" && caseReference ? `Re: ${caseReference}` : "");
  const [body, setBody] = useState("");
  const [callType, setCallType] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [noteTitle, setNoteTitle] = useState("");
  const [noteCategory, setNoteCategory] = useState("");
  // Standalone diary
  const [diaryAction, setDiaryAction] = useState("");
  const [assignedUser, setAssignedUser] = useState("");
  const [diaryTemplate, setDiaryTemplate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [dueTime, setDueTime] = useState("");
  // Editable generated letter (story: the user can edit before completing).
  const [letterBody, setLetterBody] = useState("");
  const [letterEdited, setLetterEdited] = useState(false);
  // Embedded diary (letter / email)
  const [diaryOpen, setDiaryOpen] = useState(false);
  const [diary, setDiary] = useState<DiaryValue>(EMPTY_DIARY);

  const [users, setUsers] = useState<string[]>([]);
  const [correspondents, setCorrespondents] = useState<CaseCorrespondent[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getTenantUsers().then((list) => setUsers(list.map((u) => u.name).filter(Boolean)));
    if (claimId) getCaseCorrespondents(claimId).then(setCorrespondents);
  }, [claimId]);

  // Correspondent options = third-party emails (fall back to roles if none captured).
  const correspondentEmails = correspondents.map((c) => c.email).filter(Boolean) as string[];
  const corrOptions = correspondentEmails.length ? correspondentEmails : CASE_CORRESPONDENTS;
  const phoneByEmail: Record<string, string> = Object.fromEntries(
    correspondents.filter((c) => c.email).map((c) => [c.email as string, c.phone || ""]),
  );
  // Outgoing call: selecting a correspondent auto-fills its phone number.
  const pickOutgoingCorrespondent = (v: string) => {
    setCorrespondent(v);
    if (phoneByEmail[v]) setPhoneNumber(normalizeUkPhone(phoneByEmail[v]));
  };

  // Default the History Details to the selected phrase for INCOMING calls only
  // (outgoing calls should not auto-populate).
  useEffect(() => {
    if (actionType === "incoming_call" && callType && !details.trim()) {
      setDetails(callType);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [callType]);

  const preview = useMemo(() => {
    const who = correspondent || "[Correspondent]";
    const tmpl = template ? `: ${template}` : "";
    return `Dear ${who},\n\nRe: Case Reference – ${caseReference || "—"}\n\n[Letter body will be generated here based on selected template${tmpl}...]\n\nYours sincerely,\n${handlerName || "—"}`;
  }, [correspondent, template, caseReference, handlerName]);

  // Seed the editable letter from the generated template until the user edits it.
  useEffect(() => {
    if (actionType === "send_letter" && !letterEdited) setLetterBody(preview);
  }, [actionType, preview, letterEdited]);

  const valid = useMemo(() => {
    switch (actionType) {
      case "send_letter": return Boolean(template && details.trim());
      case "send_email": return Boolean(to.trim() && details.trim());
      case "incoming_call":
      case "outgoing_call": return Boolean(callType);
      case "note": return Boolean(details.trim());
      case "diary": return Boolean(diaryAction && (details.trim() || dueDate));
      default: return false;
    }
  }, [actionType, template, details, to, callType, diaryAction, dueDate]);

  const buildMain = () => {
    const handler = handlerName || null;
    switch (actionType) {
      case "send_letter":
        return {
          action_type: "send_letter" as const, correspondent: correspondent || null, handler,
          subject: caseReference ? `Re: Case Reference – ${caseReference}` : null,
          details, payload: { template, letter: letterBody },
        };
      case "send_email":
        return {
          action_type: "send_email" as const, correspondent: to || null, handler, subject: subject || null,
          details, payload: { template, to, cc, bcc, body },
        };
      case "incoming_call":
        return {
          action_type: "incoming_call" as const, correspondent: correspondent || null, handler, subject: null,
          details: details || callType, payload: { call_type: callType },
        };
      case "outgoing_call":
        return {
          action_type: "outgoing_call" as const, correspondent: correspondent || null, handler, subject: null,
          details, payload: { call_type: callType, phone_number: phoneNumber },
        };
      case "note":
        return {
          action_type: "note" as const, correspondent: null, handler, subject: noteTitle || null,
          details, payload: { category: noteCategory },
        };
      case "diary":
        return {
          action_type: "diary" as const, correspondent: correspondent || null, handler,
          subject: diaryAction ? `Diary: ${diaryAction}` : "Diary",
          details, payload: { action: diaryAction, assigned_to: assignedUser, template: diaryTemplate, due_date: dueDate, due_time: dueTime },
        };
    }
  };

  const save = async () => {
    if (!valid || saving) return;
    setSaving(true);
    try {
      const main = buildMain();
      const rec = await createCaseHistory(claimId, main as any);
      // Embedded diary follow-up (Letter / Email) becomes its own Diary record.
      if ((actionType === "send_letter" || actionType === "send_email") && diaryHasContent(diary)) {
        await createCaseHistory(claimId, diaryRecordFrom(diary, handlerName, actionType) as any);
      }
      toast.success(`${cfg.title} saved to history`);
      onCreated(rec);
      onClose();
    } catch {
      toast.error(`Could not save ${cfg.title}`);
    } finally {
      setSaving(false);
    }
  };

  const historyDetailsField = (label = "History Details") => (
    <LabeledTextArea label={label} value={details} onChange={setDetails} placeholder="Enter Details" />
  );

  return (
    <FormShell icon={cfg.icon} title={cfg.title} sendLabel={cfg.sendLabel} saving={saving} onSend={save} onClose={onClose}>
      {actionType === "send_letter" && (
        <div className="flex flex-col lg:flex-row gap-12">
          <div className="w-full lg:w-[384px] flex flex-col gap-6">
            <LabeledSelect label="Correspondent" value={correspondent} onChange={setCorrespondent} options={corrOptions} />
            <LabeledSelect label="Template" value={template} onChange={setTemplate} options={LETTER_TEMPLATES} />
            {historyDetailsField()}
            <DiaryFollowUp open={diaryOpen} onToggle={() => setDiaryOpen((o) => !o)} value={diary} onChange={setDiary} users={users} correspondentOptions={corrOptions} />
          </div>
          <div className="w-full lg:w-[384px] flex flex-col gap-2">
            <FieldLabel>Preview <span className="text-neutral-400 font-normal">(editable)</span></FieldLabel>
            <textarea
              value={letterBody}
              onChange={(e) => { setLetterBody(e.target.value); setLetterEdited(true); }}
              className="h-72 p-4 rounded-sm outline outline-1 -outline-offset-1 outline-neutral-200 text-neutral-700 text-sm resize-none focus:outline-blue-400"
            />
          </div>
        </div>
      )}

      {actionType === "send_email" && (
        <div className="w-full max-w-[556px] flex flex-col gap-6">
          <LabeledSelect label="Template" value={template} onChange={setTemplate} options={LETTER_TEMPLATES} placeholder="No template" />
          <LabeledInput label="To" value={to} onChange={setTo} placeholder="recipient@email.com" />
          <LabeledInput label="CC" value={cc} onChange={setCc} />
          <LabeledInput label="BCC" value={bcc} onChange={setBcc} />
          <LabeledInput label="Subject" value={subject} onChange={setSubject} />
          {historyDetailsField()}
          <div className="flex flex-col gap-3">
            <FieldLabel>Email Body</FieldLabel>
            <RichTextEditor html={body} onChange={setBody} />
          </div>
          <DiaryFollowUp open={diaryOpen} onToggle={() => setDiaryOpen((o) => !o)} value={diary} onChange={setDiary} users={users} correspondentOptions={corrOptions} />
        </div>
      )}

      {actionType === "incoming_call" && (
        <div className="w-full max-w-[556px] flex flex-col gap-6">
          <LabeledSelect label="Correspondent" value={correspondent} onChange={setCorrespondent} options={corrOptions} />
          <LabeledSelect label="Call Type" value={callType} onChange={setCallType} options={CALL_TYPES} />
          {historyDetailsField()}
        </div>
      )}

      {actionType === "outgoing_call" && (
        <div className="w-full max-w-[556px] flex flex-col gap-6">
          <LabeledSelect label="Correspondent" value={correspondent} onChange={pickOutgoingCorrespondent} options={corrOptions} />
          <LabeledSelect label="Call Type" value={callType} onChange={setCallType} options={CALL_TYPES} />
          <LabeledUkPhone label="Phone Number" value={phoneNumber} onChange={setPhoneNumber} />
          {historyDetailsField()}
        </div>
      )}

      {actionType === "note" && (
        <div className="w-full max-w-[556px] flex flex-col gap-6">
          <LabeledInput label="Note Title / Subject" value={noteTitle} onChange={setNoteTitle} placeholder="Note title" />
          <LabeledSelect label="Note Type / Category" value={noteCategory} onChange={setNoteCategory} options={NOTE_CATEGORIES} />
          {historyDetailsField("Note Content")}
        </div>
      )}

      {actionType === "diary" && (
        <div className="w-full max-w-[556px] flex flex-col gap-6">
          <LabeledSelect label="Action" value={diaryAction} onChange={setDiaryAction} options={DIARY_ACTIONS} />
          <LabeledSelect label="Assigned User" value={assignedUser} onChange={setAssignedUser} options={users} />
          <LabeledSelect label="Correspondent" value={correspondent} onChange={setCorrespondent} options={corrOptions} />
          <LabeledSelect label="Template" value={diaryTemplate} onChange={setDiaryTemplate} options={LETTER_TEMPLATES} placeholder="No template" />
          <div className="flex flex-col sm:flex-row gap-5">
            <div className="flex-1"><LabeledDate label="Due Date" value={dueDate} onChange={setDueDate} /></div>
            <div className="flex-1"><LabeledTime label="Due Time" value={dueTime} onChange={setDueTime} /></div>
          </div>
          <LabeledTextArea label="Notes / Description" value={details} onChange={setDetails} placeholder="Enter diary notes..." heightCls="h-20" />
        </div>
      )}
    </FormShell>
  );
};

export default HistoryActionForm;
