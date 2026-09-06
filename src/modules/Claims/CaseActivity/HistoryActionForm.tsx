import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import {
  createCaseHistory,
  getTenantUsers,
  getCaseCorrespondents,
  type CaseHistoryActionType,
  type CaseHistoryRecord,
  type CaseCorrespondent,
  type TenantUser,
} from "../../../services/CaseHistory/caseHistory";
import {
  FormShell, LabeledInput, LabeledSelect, LabeledTextArea, LabeledDate, LabeledTime,
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
  // Cc / Bcc are hidden behind links (like a normal email client) until clicked.
  const [showCc, setShowCc] = useState(false);
  const [showBcc, setShowBcc] = useState(false);
  const [subject, setSubject] = useState(actionType === "send_email" && caseReference ? `Re: ${caseReference}` : "");
  const [body, setBody] = useState("");
  const [callType, setCallType] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [noteTitle, setNoteTitle] = useState("");
  const [noteCategory, setNoteCategory] = useState("");
  // Standalone diary
  const [diaryAction, setDiaryAction] = useState("");
  const [assignedUser, setAssignedUser] = useState("");
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

  // @-mention tagging in the details/note box (mirrors the Case Activity note box).
  const [mentionUsers, setMentionUsers] = useState<TenantUser[]>([]);
  const [mention, setMention] = useState<{ open: boolean; query: string }>({ open: false, query: "" });

  useEffect(() => {
    getTenantUsers().then((list) => {
      setMentionUsers(Array.isArray(list) ? list : []);
      setUsers(list.map((u) => u.name).filter(Boolean));
    });
    if (claimId) getCaseCorrespondents(claimId).then(setCorrespondents);
  }, [claimId]);

  const handleDetailsChange = (value: string) => {
    setDetails(value);
    const m = value.match(/@([A-Za-z0-9._-]*)$/); // an @-token at the caret
    setMention(m ? { open: true, query: m[1] } : { open: false, query: "" });
  };
  const insertMention = (u: TenantUser) => {
    setDetails((prev) => prev.replace(/@([A-Za-z0-9._-]*)$/, `@${u.name} `));
    setMention({ open: false, query: "" });
  };
  const mentionMatches = mention.open
    ? mentionUsers
        .filter(
          (u) =>
            (u.name || "").toLowerCase().includes(mention.query.toLowerCase()) ||
            (u.email || "").toLowerCase().includes(mention.query.toLowerCase()),
        )
        .slice(0, 6)
    : [];

  // Correspondent options = third-party emails (fall back to roles if none captured).
  const correspondentEmails = correspondents.map((c) => c.email).filter(Boolean) as string[];
  const corrOptions = correspondentEmails.length ? correspondentEmails : CASE_CORRESPONDENTS;
  const phoneByEmail: Record<string, string> = Object.fromEntries(
    correspondents.filter((c) => c.email).map((c) => [c.email as string, c.phone || ""]),
  );
  // Outgoing call: selecting a correspondent types its phone number straight into
  // the (still editable) Phone Number field, replacing whatever was there.
  const pickOutgoingCorrespondent = (v: string) => {
    setCorrespondent(v);
    setPhoneNumber(phoneByEmail[v] || ""); // keep the number as stored (e.g. 0734080118)
  };

  // Strip the leading abbreviation (e.g. "CL - Call to Client" → "Call to Client").
  const callTypeText = (ct: string) => (ct || "").replace(/^\s*[A-Za-z]+\s*-\s*/, "").trim();

  // Set the History Details to the selected call type's text for INCOMING and
  // OUTGOING calls, updating whenever the call type changes. A note the user typed
  // themselves (text that isn't one of the call-type phrases) is preserved.
  useEffect(() => {
    if ((actionType !== "incoming_call" && actionType !== "outgoing_call") || !callType) return;
    const cur = details.trim();
    const isAutoFilled = cur === "" || CALL_TYPES.some((ct) => callTypeText(ct) === cur);
    if (isAutoFilled) setDetails(callTypeText(callType));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [callType]);

  const preview = useMemo(() => {
    const who = correspondent || "[Correspondent]";
    if (template === "Accident Report Form") {
      return `Dear ${who},\n\nRe: Case Reference – ${caseReference || "—"}\n\nPlease find enclosed the Accident Report Form, pre-filled with the details we hold for this case. Kindly review, complete any outstanding sections, sign and return it to us at your earliest convenience.\n\nYours sincerely,\n${handlerName || "—"}`;
    }
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
          details: details || callTypeText(callType), payload: { call_type: callType },
        };
      case "outgoing_call":
        return {
          action_type: "outgoing_call" as const, correspondent: correspondent || null, handler, subject: null,
          details: details || callTypeText(callType), payload: { call_type: callType, phone_number: phoneNumber },
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
          details, payload: { action: diaryAction, assigned_to: assignedUser, due_date: dueDate, due_time: dueTime },
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
      toast.success(actionType === "diary" ? "Diary record saved" : `${cfg.title} saved to history`);
      onCreated(rec);
      onClose();
    } catch {
      toast.error(`Could not save ${cfg.title}`);
    } finally {
      setSaving(false);
    }
  };

  const historyDetailsField = (label = "Details") => (
    <div className="relative">
      <LabeledTextArea label={label} value={details} onChange={handleDetailsChange} placeholder="Enter Details — type @ to tag someone" />
      {mention.open && mentionMatches.length > 0 && (
        <div className="absolute z-50 left-0 right-0 top-full mt-1 max-h-56 overflow-auto bg-white border border-neutral-200 rounded-lg shadow-xl">
          {mentionMatches.map((u) => (
            <button
              key={u.id}
              type="button"
              onClick={() => insertMention(u)}
              className="w-full text-left px-4 py-2.5 flex items-center gap-3 hover:bg-blue-50"
            >
              <span className="w-7 h-7 rounded-full bg-blue-100 text-blue-500 text-xs font-weight-600 flex items-center justify-center shrink-0">
                {(u.name || "?").charAt(0).toUpperCase()}
              </span>
              <span className="flex flex-col min-w-0">
                <span className="text-sm text-blue-500 font-weight-500 truncate">@{u.name}</span>
                <span className="text-xs text-neutral-400 truncate">{u.email}</span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
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
          <div className="flex flex-col gap-1.5">
            <LabeledInput label="To" value={to} onChange={setTo} placeholder="recipient@email.com" />
            {(!showCc || !showBcc) && (
              <div className="flex gap-4 pl-1">
                {!showCc && <button type="button" onClick={() => setShowCc(true)} className="text-sm text-blue-500 hover:underline">Add Cc</button>}
                {!showBcc && <button type="button" onClick={() => setShowBcc(true)} className="text-sm text-blue-500 hover:underline">Add Bcc</button>}
              </div>
            )}
          </div>
          {showCc && (
            <div className="flex items-end gap-2">
              <div className="flex-1"><LabeledInput label="CC" value={cc} onChange={setCc} placeholder="cc@email.com" /></div>
              <button type="button" onClick={() => { setShowCc(false); setCc(""); }} className="h-[52px] px-2 text-neutral-400 hover:text-red-500 text-xl leading-none shrink-0" title="Remove Cc">×</button>
            </div>
          )}
          {showBcc && (
            <div className="flex items-end gap-2">
              <div className="flex-1"><LabeledInput label="BCC" value={bcc} onChange={setBcc} placeholder="bcc@email.com" /></div>
              <button type="button" onClick={() => { setShowBcc(false); setBcc(""); }} className="h-[52px] px-2 text-neutral-400 hover:text-red-500 text-xl leading-none shrink-0" title="Remove Bcc">×</button>
            </div>
          )}
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
          <LabeledInput label="Phone Number" value={phoneNumber} onChange={setPhoneNumber} placeholder="0734080118" />
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
