import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import { ChevronLeft, ChevronDown, Paperclip, ExternalLink } from "lucide-react";
import PdfLogo from "../../../assets/FileTypes/PDF.svg";
import DocLogo from "../../../assets/FileTypes/DOC.svg";
import ExcelLogo from "../../../assets/FileTypes/Excel.svg";
import CsvLogo from "../../../assets/FileTypes/CSV.svg";
import PptLogo from "../../../assets/FileTypes/PPT.svg";
import PngLogo from "../../../assets/FileTypes/PNG.svg";
import { useCaseReference } from "../../../hooks/useCaseReference";
import { CustomDatePicker } from "../Components/DatePicker";
import Vector6 from "../../../assets/AutoClaim_icon/Vector-6.svg";
import { useCurrentUser } from "../../../context/AuthContext";
import SpinnerLoader from "../../../claims/common/SpinnerLoader";
import HistoryActionForm from "./HistoryActionForm";
import {
  getCaseHistory,
  getCaseHistoryFilters,
  getCaseHistoryEmails,
  openEmailAttachment,
  fetchCaseAttachment,
  getCaseAttachmentPages,
  importCaseHistoryEmail,
  type CaseAttachmentPreview,
  // getTenantUsers replaced by useAssignees (same list as Task Management).
  type CaseHistoryRecord,
  type CaseHistoryActionType,
  type CaseHistoryFilterOptions,
  type CaseHistoryAttachment,
} from "../../../services/CaseHistory/caseHistory";
import { useAssignees } from "../../TaskManagement/useAssignees";
import SendLetterIcon from "../../../assets/HistorySection/SendLetter.svg";
import SendEmailIcon from "../../../assets/HistorySection/SendEmail.svg";
import IncomingCallIcon from "../../../assets/HistorySection/IncomingCall.svg";
import OutgoingCallIcon from "../../../assets/HistorySection/OutgoingCall.svg";
import NotesIcon from "../../../assets/HistorySection/Notes.svg";
import DiaryIcon from "../../../assets/HistorySection/Diary.svg";
import ReplyIcon from "../../../assets/case_activity/reply.svg";
import ForwardIcon from "../../../assets/case_activity/forward.svg";
import { ClaimsEmailModal, htmlToPlainText } from "../Components/ClaimsEmailModal";
// Reuse Case Activity's Outlook email send flow — reply/forward go through the same
// Graph endpoints (the whole email feature will eventually live here, not there).
import { replyToEmailGraph, forwardEmailGraph } from "../../../services/HistoryActivities/HistoryActivities";

// ── Action-type presentation (abbreviation + label + icon) ───────────────────
// abbr shows alone on the listing/detail badges; "abbr - label" in the filter.
type ActionMeta = { abbr: string; label: string; icon: string };
const ACTION_META: Record<CaseHistoryActionType, ActionMeta> = {
  send_letter: { abbr: "SL", label: "Send Letter", icon: SendLetterIcon },
  send_email: { abbr: "SE", label: "Send Email", icon: SendEmailIcon },
  incoming_email: { abbr: "IE", label: "Incoming Email", icon: SendEmailIcon },
  incoming_call: { abbr: "IC", label: "Incoming Call", icon: IncomingCallIcon },
  outgoing_call: { abbr: "OC", label: "Outgoing Call", icon: OutgoingCallIcon },
  note: { abbr: "NT", label: "Notes", icon: NotesIcon },
  diary: { abbr: "DY", label: "Diary", icon: DiaryIcon },
};
// The six activity types a user can create via Add Record (the CTA pills).
// Incoming Email is system-generated (drag-drop / Outlook), so it's not here.
const ACTION_ORDER: CaseHistoryActionType[] = [
  "send_letter", "send_email", "incoming_call", "outgoing_call", "note", "diary",
];
// Every type that can appear on a record — powers the Action Type filter.
const ALL_ACTION_TYPES: CaseHistoryActionType[] = [
  "send_letter", "send_email", "incoming_email", "incoming_call", "outgoing_call", "note", "diary",
];

// "02-22-26  5:30PM"
const fmtPosted = (iso: string | null): string => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const yy = String(d.getFullYear()).slice(-2);
  let h = d.getHours();
  const ap = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${mm}-${dd}-${yy}  ${h}:${min}${ap}`;
};

// ── Action badge (blue pill with icon) ───────────────────────────────────────
const ActionBadge = ({ type }: { type: CaseHistoryActionType | null }) => {
  if (!type) return null;
  const meta = ACTION_META[type];
  return (
    <span className="shrink-0 px-4 py-2 bg-blue-100 rounded-sm inline-flex items-center gap-2 whitespace-nowrap" title={meta.label}>
      <img src={meta.icon} alt="" className="w-4 h-4" />
      <span className="text-blue-500 text-xs font-['Stack_Sans_Headline']">{meta.abbr}</span>
    </span>
  );
};

// Note category chip — makes the note's tag identifiable on the History record.
const NoteTag = ({ r }: { r: CaseHistoryRecord }) => {
  const cat = r.action_type === "note" ? (r.payload?.category as string) || "" : "";
  if (!cat) return null;
  return (
    <span className="shrink-0 px-2 py-1 rounded-sm bg-neutral-100 text-neutral-600 text-xs whitespace-nowrap">
      {cat}
    </span>
  );
};

// Email attachments live in payload.attachments (from the Outlook fetch).
const attachmentsOf = (r: CaseHistoryRecord): CaseHistoryAttachment[] =>
  ((r.payload && (r.payload as { attachments?: CaseHistoryAttachment[] }).attachments) || []);

// True for actual emails (fetched from Outlook or dragged in) — these show the
// subject on the card and the full body only in the detail pane.
const emailSource = (r: CaseHistoryRecord): boolean => {
  const s = (r.payload as { source?: string } | null)?.source;
  return s === "email" || s === "imported_email";
};
const emailBody = (r: CaseHistoryRecord): string => {
  const p = (r.payload as { body_text?: string; body_html?: string } | null) || {};
  if (p.body_text && p.body_text.trim()) return p.body_text;
  if (p.body_html) return p.body_html.replace(/<[^>]+>/g, " ").replace(/\n{3,}/g, "\n\n").trim();
  return r.details || "—";
};

// Sanitize an email's HTML so its real template renders safely in the detail pane
// (mirrors Case Activity): drop scripts/iframes, unresolvable cid: images, and any
// inline event handlers / javascript: URLs.
const sanitizeEmailHtml = (html = ""): string => {
  if (!html) return "";
  const doc = new DOMParser().parseFromString(html, "text/html");
  doc.querySelectorAll("script, style, iframe, object, embed").forEach((el) => el.remove());
  doc.querySelectorAll('img[src^="cid:"], img[src^="CID:"]').forEach((el) => el.remove());
  doc.body.querySelectorAll("*").forEach((el) => {
    [...el.attributes].forEach((attr) => {
      const name = attr.name.toLowerCase();
      const value = attr.value.toLowerCase();
      if (name.startsWith("on") || value.includes("javascript:")) el.removeAttribute(attr.name);
    });
  });
  return doc.body.innerHTML;
};

// Render the original email design (HTML) when present, else the cleaned text.
const EmailBodyView = ({ r }: { r: CaseHistoryRecord }) => {
  const html = (r.payload as { body_html?: string } | null)?.body_html || "";
  if (html && /<[a-z][\s\S]*>/i.test(html)) {
    return (
      <div
        className="text-sm text-neutral-700 leading-relaxed break-words overflow-x-auto [&_img]:max-w-full [&_table]:max-w-full [&_a]:text-blue-600 [&_a]:underline"
        dangerouslySetInnerHTML={{ __html: sanitizeEmailHtml(html) }}
      />
    );
  }
  return (
    <div className="text-neutral-700 text-sm font-['Stack_Sans_Headline'] whitespace-pre-wrap">
      {emailBody(r)}
    </div>
  );
};

// A logged document record (Payment Pack PDF, etc.) — its detail pane shows only
// the document (icon + name → click to preview), not a text body.
const isDocRecord = (r: CaseHistoryRecord): boolean =>
  (r.payload as { source?: string } | null)?.source === "document";

// Reply/Forward are only possible for real Outlook emails carrying a Graph
// message_id (fetched live). Dragged-in .eml/.msg imports have no live thread.
const emailMessageId = (r: CaseHistoryRecord): string =>
  ((r.payload as { message_id?: string } | null)?.message_id || "").trim();
const canReplyForward = (r: CaseHistoryRecord): boolean =>
  emailSource(r) && !!emailMessageId(r);

// Shape a History email record like a Case Activity "Email" activity so the shared
// replyToEmailGraph / forwardEmailGraph services can target the same Graph message.
const toEmailActivity = (r: CaseHistoryRecord) => {
  const mid = emailMessageId(r);
  return {
    type: "Email",
    message_id: mid,
    subject: r.subject || "",
    title: r.subject || "",
    meta: { message_id: mid },
  };
};

// Match Case Activity's Re:/Fwd: subject prefixing.
const shareSubject = (mode: "reply" | "forward", subject: string): string => {
  const base = subject || "Case Activity";
  const lower = base.toLowerCase();
  if (mode === "forward") return lower.startsWith("fwd:") ? base : `Fwd: ${base}`;
  return lower.startsWith("re:") ? base : `Re: ${base}`;
};

// Paperclip with an attachment-count badge (top-right of a record).
const AttachmentClip = ({ count }: { count: number }) => {
  if (!count) return null;
  return (
    <span className="relative inline-flex items-center justify-center text-neutral-500 shrink-0" title={`${count} attachment${count === 1 ? "" : "s"}`}>
      <Paperclip size={16} />
      <span className="absolute -top-2 -right-2 min-w-[15px] h-[15px] px-1 rounded-full bg-blue-500 text-white text-[9px] leading-none inline-flex items-center justify-center">{count}</span>
    </span>
  );
};

// File-type icon for the attachment list — uses the shared FileTypes logos.
const fileTypeLogo = (name: string): string => {
  const ext = (name.split(".").pop() || "").toLowerCase();
  if (ext === "pdf") return PdfLogo;
  if (["doc", "docx", "rtf", "odt"].includes(ext)) return DocLogo;
  if (["xls", "xlsx", "ods"].includes(ext)) return ExcelLogo;
  if (ext === "csv") return CsvLogo;
  if (["ppt", "pptx"].includes(ext)) return PptLogo;
  if (["png", "jpg", "jpeg", "gif", "webp", "heic", "bmp", "svg"].includes(ext)) return PngLogo;
  return DocLogo;
};
const fileIcon = (name: string) => (
  <img src={fileTypeLogo(name)} alt="" className="w-5 h-5 shrink-0 object-contain" />
);

// ── Correspondent / Handler lines ────────────────────────────────────────────
const PeopleLines = ({ r }: { r: CaseHistoryRecord }) => (
  <div className="flex flex-col items-start gap-1">
    <div className="text-neutral-700 text-sm font-['Stack_Sans_Headline']">
      Correspondent : <span className="font-semibold">{r.correspondent || "—"}</span>
    </div>
    <div className="text-neutral-700 text-sm font-['Stack_Sans_Headline']">
      Handler : <span className="font-semibold">{r.handler || "—"}</span>
    </div>
  </div>
);

// ── Multi-select filter dropdown (Action Type / Correspondent / Handler) ──────
const FilterDropdown = ({
  label, options, selected, onChange,
}: {
  label: string;
  options: { value: string; label: string }[];
  selected: string[];
  onChange: (next: string[]) => void;
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  const toggle = (v: string) =>
    onChange(selected.includes(v) ? selected.filter((x) => x !== v) : [...selected, v]);
  // Always show a count once anything is picked — even a single selection shows
  // "(1)", never the selected option's name.
  const displayLabel = selected.length === 0 ? label : `${label} (${selected.length})`;
  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 text-blue-600 text-sm font-weight-500"
      >
        {displayLabel}
        <ChevronDown size={14} />
      </button>
      {open && (
        <div className={`absolute z-30 mt-2 left-0 min-w-[180px] bg-white rounded-lg border border-neutral-200 shadow-lg py-1 ${options.length > 8 ? "max-h-64 overflow-auto" : ""}`}>
          <button
            type="button"
            onClick={() => onChange([])}
            className={`w-full text-left px-3 py-2 text-sm hover:bg-neutral-50 ${selected.length === 0 ? "text-blue-600 font-weight-500" : "text-neutral-700"}`}
          >
            Clear Filter
          </button>
          {options.length === 0 ? (
            <div className="px-3 py-2 text-xs text-neutral-400">No options</div>
          ) : (
            options.map((o) => (
              <button
                key={o.value}
                type="button"
                onClick={() => toggle(o.value)}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-neutral-50 flex items-center gap-2.5 ${selected.includes(o.value) ? "text-blue-600 font-weight-500" : "text-neutral-700"}`}
              >
                {/* Blue-theme checkbox (same as the claim listing). */}
                <span className={`w-5 h-5 rounded shrink-0 ${selected.includes(o.value) ? "bg-blue-600 border-[6px] border-blue-200" : "bg-neutral-300"}`} />
                {o.label}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};

// ── History card (left column) ───────────────────────────────────────────────
const HistoryCard = ({
  r, active, onClick,
}: { r: CaseHistoryRecord; active: boolean; onClick: () => void }) => (
  <button
    type="button"
    onClick={onClick}
    className={`w-full text-left p-4 rounded-sm outline outline-1 -outline-offset-1 flex flex-col gap-2 transition ${
      active ? "bg-[#F7FBFF] outline-blue-200" : "bg-transparent outline-neutral-100"
    }`}
  >
    <div className="flex justify-between items-center gap-3">
      <div className="text-sm font-['Stack_Sans_Headline']">
        <span className="text-neutral-500">Posted: </span>
        <span className="text-neutral-700">{fmtPosted(r.posted_at)}</span>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {/* PP / document records aren't "attachments" — no clip/count. */}
        {!isDocRecord(r) && <AttachmentClip count={attachmentsOf(r).length} />}
        <NoteTag r={r} />
        <ActionBadge type={r.action_type} />
      </div>
    </div>
    <PeopleLines r={r} />
    <div className="self-stretch pt-2.5 border-t border-neutral-200">
      {isDocRecord(r) && attachmentsOf(r)[0] ? (
        // PP / document record: show the file logo + name on the card.
        <div className="flex items-center gap-2.5">
          <img src={fileTypeLogo(attachmentsOf(r)[0].name)} alt="" className="w-5 h-5 shrink-0 object-contain" />
          <span className="text-neutral-700 text-sm font-['Stack_Sans_Headline'] truncate">
            {attachmentsOf(r)[0].name}
          </span>
        </div>
      ) : (
        <div className={`text-neutral-700 text-sm font-['Stack_Sans_Headline'] ${emailSource(r) ? "truncate" : ""}`}>
          {emailSource(r) ? (r.subject || "(No subject)") : (r.details || "—")}
        </div>
      )}
    </div>
  </button>
);

// ── Record Detail pane (right column) ────────────────────────────────────────
const RecordDetail = ({ r, onCreateNew, onEmailAction }: { r: CaseHistoryRecord | null; onCreateNew: (t: CaseHistoryActionType) => void; onEmailAction: (mode: "reply" | "forward", r: CaseHistoryRecord) => void }) => {
  // Inline document preview (Payment Pack PDFs, email attachments) — shown right
  // here in the detail pane rather than a new tab.
  const [preview, setPreview] = useState<{ url: string; type: string; name: string } | null>(null);
  const [loadingIdx, setLoadingIdx] = useState<number | null>(null);
  // PP / document records render as page images (like the Document Library), not a
  // browser PDF viewer.
  const [docPages, setDocPages] = useState<CaseAttachmentPreview | null>(null);
  const [docLoading, setDocLoading] = useState(false);
  const recordId = r?.id;
  useEffect(() => { setPreview(null); }, [recordId]);
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview.url); }, [preview]);

  const openInline = async (a: CaseHistoryAttachment, i: number) => {
    if (!a.url) return;
    try {
      setLoadingIdx(i);
      const { url, type } = await fetchCaseAttachment(a.url);
      setPreview((prev) => { if (prev) URL.revokeObjectURL(prev.url); return { url, type, name: a.name }; });
    } catch {
      toast.error("Could not open the document.");
    } finally {
      setLoadingIdx(null);
    }
  };

  // PP / document records: auto-load page images so the detail shows the actual
  // document (rendered pages), without a click and without a PDF viewer.
  useEffect(() => {
    let alive = true;
    setDocPages(null);
    if (r && isDocRecord(r) && attachmentsOf(r)[0]?.url) {
      setDocLoading(true);
      getCaseAttachmentPages(r.id, 0)
        .then((p) => { if (alive) setDocPages(p); })
        .catch(() => { /* keep the download row as fallback */ })
        .finally(() => { if (alive) setDocLoading(false); });
    }
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recordId]);

  if (!r) {
    return (
      <div className="flex-1 min-w-0 min-h-[calc(100vh-200px)] px-10 py-6 bg-white rounded-sm outline outline-1 -outline-offset-1 outline-blue-200 flex flex-col gap-4">
        <div className="text-black text-xl font-semibold font-['Stack_Sans_Headline'] leading-5">Record Detail</div>
        <div className="h-px bg-neutral-200 w-full" />
        <div className="flex-1 flex items-center justify-center text-sm text-neutral-400">
          Select a record to preview its details.
        </div>
      </div>
    );
  }
  const meta = r.action_type ? ACTION_META[r.action_type] : null;
  return (
    <div className="flex-1 min-w-0 min-h-[calc(100vh-200px)] bg-white rounded-sm outline outline-1 -outline-offset-1 outline-blue-200 flex flex-col px-10 py-6 gap-4">
      {(loadingIdx !== null || docLoading) && <SpinnerLoader />}
      {/* PP / document records: header shows the document name. */}
      {isDocRecord(r) && (
        <>
          <div className="self-stretch flex justify-between items-start">
            <div className="text-black text-xl font-semibold font-['Stack_Sans_Headline'] leading-5">
              Attachment : {attachmentsOf(r)[0]?.name || "Document"}
            </div>
          </div>
          <div className="h-px bg-neutral-200 w-full" />
        </>
      )}
      {!isDocRecord(r) && (
        <>
          <div className="flex justify-between items-center gap-3">
            <div className="text-black text-xl font-semibold font-['Stack_Sans_Headline'] leading-5">Record Detail</div>
            <div className="flex items-center gap-2 shrink-0">
              {canReplyForward(r) && (
                <>
                  <button
                    type="button"
                    onClick={() => onEmailAction("reply", r)}
                    className="px-3 py-1.5 rounded-sm outline outline-1 -outline-offset-1 outline-blue-500 inline-flex items-center gap-1.5 hover:bg-blue-50"
                  >
                    <img src={ReplyIcon} alt="" className="w-3.5 h-3.5" />
                    <span className="text-blue-500 text-xs">Reply</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onEmailAction("forward", r)}
                    className="px-3 py-1.5 rounded-sm outline outline-1 -outline-offset-1 outline-blue-500 inline-flex items-center gap-1.5 hover:bg-blue-50"
                  >
                    <img src={ForwardIcon} alt="" className="w-3.5 h-3.5" />
                    <span className="text-blue-500 text-xs">Forward</span>
                  </button>
                </>
              )}
              <AttachmentClip count={attachmentsOf(r).length} />
              <NoteTag r={r} />
              <ActionBadge type={r.action_type} />
            </div>
          </div>
          <div className="h-px bg-neutral-200 w-full" />
        </>
      )}
      <div className="flex flex-col gap-2">
        {/* PP / document records: only the document preview — no posted/correspondent/
            handler/attachments meta. */}
        {!isDocRecord(r) && (
          <>
            <div className="text-sm font-['Stack_Sans_Headline']">
              <span className="text-neutral-500">Posted: </span>
              <span className="text-neutral-700">{fmtPosted(r.posted_at)}</span>
            </div>
            <PeopleLines r={r} />
          </>
        )}
        {!isDocRecord(r) && r.subject && (
          <div className="text-neutral-700 text-sm font-['Stack_Sans_Headline']">
            Subject : <span className="font-semibold">{r.subject}</span>
          </div>
        )}
        {!isDocRecord(r) && (
          <div className="pt-2.5 border-t border-neutral-200 min-h-32">
            {emailSource(r) ? (
              <EmailBodyView r={r} />
            ) : (
              <div className="text-neutral-700 text-sm font-['Stack_Sans_Headline'] whitespace-pre-wrap">
                {r.details || "—"}
              </div>
            )}
          </div>
        )}
        {!isDocRecord(r) && attachmentsOf(r).length > 0 && (
          <div className="flex flex-col gap-2 pt-2">
            <div className="text-neutral-500 text-xs font-weight-600 uppercase tracking-wide">
              Attachments ({attachmentsOf(r).length})
            </div>
            {attachmentsOf(r).map((a, i) => (
              <div
                key={i}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-sm outline outline-1 -outline-offset-1 ${
                  preview?.name === a.name ? "outline-blue-300 bg-[#F7FBFF]" : "outline-neutral-200 hover:bg-neutral-50"
                }`}
              >
                {fileIcon(a.name)}
                <button
                  type="button"
                  onClick={() => openInline(a, i)}
                  title="Preview here"
                  className="text-sm text-neutral-700 truncate flex-1 text-left"
                >
                  {a.name}
                </button>
                {loadingIdx === i && <span className="text-xs text-neutral-400 shrink-0">Loading…</span>}
                {a.size && <span className="text-xs text-neutral-400 shrink-0">{a.size}</span>}
                <button
                  type="button"
                  onClick={() => openEmailAttachment(a.url)}
                  title="Open in a new tab"
                  className="text-blue-500 hover:text-blue-700 shrink-0"
                >
                  <ExternalLink className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* PP / document records: rendered page images (Document Library style).
            The document name is shown in the pane header above. */}
        {isDocRecord(r) && (
          <div className="flex flex-col gap-3">
            <div className="flex flex-col items-center gap-2">
              {docPages?.type === "pdf" && docPages.pages?.map((pg) => (
                <img
                  key={pg.page}
                  src={pg.image}
                  alt={`Page ${pg.page}`}
                  className="w-full h-auto object-contain bg-white rounded"
                />
              ))}
              {docPages?.type === "image" && docPages.url && (
                <img src={docPages.url} alt={docPages.file_name || ""} className="w-full h-auto object-contain rounded" />
              )}
              {docPages?.type === "html" && docPages.html && (
                // Word/HTML: cap every element to the pane width, shrink tables/fonts,
                // and let anything still too wide scroll rather than overflow the page.
                <div className="w-full overflow-x-auto">
                  <div
                    className="text-xs text-neutral-800 leading-relaxed break-words [&_*]:!max-w-full [&_table]:!w-full [&_td]:break-words [&_img]:!h-auto"
                    dangerouslySetInnerHTML={{ __html: sanitizeEmailHtml(docPages.html) }}
                  />
                </div>
              )}
              {!docLoading && docPages?.type === "unsupported" && (
                <div className="py-8 text-sm text-neutral-400">Preview not available — use “Open in a new tab”.</div>
              )}
            </div>
          </div>
        )}

        {/* Inline preview of a clicked email attachment (non-document records). */}
        {!isDocRecord(r) && preview && (
          <div className="flex flex-col gap-2 pt-2">
            <div className="flex items-center justify-between">
              <span className="text-neutral-700 text-sm font-semibold truncate">{preview.name}</span>
              <button
                type="button"
                onClick={() => setPreview(null)}
                className="text-neutral-400 hover:text-neutral-700 text-xl leading-none px-2"
              >
                ×
              </button>
            </div>
            {preview.type.startsWith("image/") ? (
              <img src={preview.url} alt={preview.name} className="max-w-full rounded-sm outline outline-1 outline-neutral-200" />
            ) : (
              <iframe
                src={preview.url}
                title={preview.name}
                className="w-full h-[600px] rounded-sm outline outline-1 -outline-offset-1 outline-neutral-200 bg-white"
              />
            )}
          </div>
        )}
      </div>
      {!isDocRecord(r) && meta && r.action_type && (
        <button
          type="button"
          onClick={() => onCreateNew(r.action_type as CaseHistoryActionType)}
          className="px-4 py-2 rounded-sm outline outline-1 -outline-offset-1 outline-blue-500 inline-flex items-center gap-2 hover:bg-blue-50 w-fit"
        >
          <img src={meta.icon} alt="" className="w-4 h-4" />
          <span className="text-blue-500 text-xs font-['Stack_Sans_Headline']">Create New {meta.label}</span>
        </button>
      )}
    </div>
  );
};

// ── Screen ───────────────────────────────────────────────────────────────────
const CaseHistory = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const claimId = useMemo(() => {
    const sp = new URLSearchParams(location.search);
    return sp.get("claim_id") || sp.get("claimId") || "";
  }, [location.search]);
  const caseReference = useCaseReference(claimId);
  const { user } = useCurrentUser();
  const handlerName =
    [user?.first_name, user?.last_name].filter(Boolean).join(" ") || user?.name || "";

  const [records, setRecords] = useState<CaseHistoryRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<number | string | null>(null);
  const [emails, setEmails] = useState<CaseHistoryRecord[]>([]);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 8;
  const [addType, setAddType] = useState<CaseHistoryActionType | null>(null);
  const [emailModal, setEmailModal] = useState<{ mode: "reply" | "forward"; record: CaseHistoryRecord } | null>(null);
  const [emailSending, setEmailSending] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [importing, setImporting] = useState(false);
  // Show the overlay loader while a filter change re-fetches (not while typing in
  // search — that would flash the overlay over the input on every keystroke).
  const [filterBusy, setFilterBusy] = useState(false);

  // Filters
  const [search, setSearch] = useState("");
  const [actionTypes, setActionTypes] = useState<string[]>([]);
  const [correspondents, setCorrespondents] = useState<string[]>([]);
  const [handlers, setHandlers] = useState<string[]>([]);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [filterOptions, setFilterOptions] = useState<CaseHistoryFilterOptions>({ correspondents: [], handlers: [], action_types: [] });
  const users = useAssignees();

  const load = useCallback(async () => {
    if (!claimId) return;
    setLoading(true);
    try {
      const rows = await getCaseHistory(claimId, {
        search, action_type: actionTypes, correspondent: correspondents,
        handler: handlers, date_from: dateFrom, date_to: dateTo,
      });
      setRecords(rows);
    } finally {
      setLoading(false);
    }
  }, [claimId, search, actionTypes, correspondents, handlers, dateFrom, dateTo]);

  // Debounce so typing/filtering doesn't spam the API.
  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  // Clear the filter-change overlay once the re-fetch settles.
  useEffect(() => { if (!loading) setFilterBusy(false); }, [loading]);

  useEffect(() => {
    if (claimId) {
      getCaseHistoryFilters(claimId).then(setFilterOptions).catch(() => {});
      getCaseHistoryEmails(claimId).then(setEmails).catch(() => {});
    }
  }, [claimId]);

  // Handler filter lists every tenant user (plus any handler already on records),
  // not just whoever happens to have created history so far.
  const handlerOptions = Array.from(new Set([...users, ...filterOptions.handlers]));

  // Merge stored records with the live Outlook emails (client-side filtered to
  // match the active filters), newest first.
  const merged = useMemo(() => {
    const term = search.trim().toLowerCase();
    const from = dateFrom ? new Date(`${dateFrom}T00:00:00`) : null;
    const to = dateTo ? new Date(`${dateTo}T23:59:59`) : null;
    const emailsFiltered = emails.filter((e) => {
      // Each fetched email carries its own action_type (send_email vs incoming_email).
      if (actionTypes.length && !(e.action_type && actionTypes.includes(e.action_type))) return false;
      if (correspondents.length && !(e.correspondent && correspondents.includes(e.correspondent))) return false;
      if (handlers.length && !(e.handler && handlers.includes(e.handler))) return false;
      if (from && (!e.posted_at || new Date(e.posted_at) < from)) return false;
      if (to && (!e.posted_at || new Date(e.posted_at) > to)) return false;
      if (term) {
        const hay = `${e.subject || ""} ${e.details || ""} ${e.correspondent || ""} ${e.handler || ""}`.toLowerCase();
        if (!hay.includes(term)) return false;
      }
      return true;
    });
    // Drop a live Outlook email if a stored record already represents it — by Graph
    // message_id, or by same subject + same minute (covers e.g. the engineer
    // instruct email that we persist and Outlook also returns from Sent Items).
    const storedMsgIds = new Set(
      records.map((r) => ((r.payload as { message_id?: string } | null)?.message_id || "").trim()).filter(Boolean),
    );
    const minuteKey = (r: CaseHistoryRecord) =>
      `${(r.subject || "").trim().toLowerCase()}|${(r.posted_at || "").slice(0, 16)}`;
    const storedKeys = new Set(records.map(minuteKey));
    const emailsDeduped = emailsFiltered.filter((e) => {
      const mid = ((e.payload as { message_id?: string } | null)?.message_id || "").trim();
      if (mid && storedMsgIds.has(mid)) return false;
      if (storedKeys.has(minuteKey(e))) return false;
      return true;
    });
    return [...records, ...emailsDeduped].sort((a, b) => {
      const ta = a.posted_at ? new Date(a.posted_at).getTime() : 0;
      const tb = b.posted_at ? new Date(b.posted_at).getTime() : 0;
      return tb - ta;
    });
  }, [records, emails, search, actionTypes, correspondents, handlers, dateFrom, dateTo]);

  // Default the Record Detail pane to the current (newest) record.
  useEffect(() => {
    if (merged.length && !merged.some((r) => r.id === selectedId)) {
      setSelectedId(merged[0].id);
    }
  }, [merged, selectedId]);

  const selected = merged.find((r) => r.id === selectedId) || null;

  // Pagination (10 per page) — same design as the claim listing page.
  const totalPages = Math.max(1, Math.ceil(merged.length / PAGE_SIZE));
  const pageRecords = merged.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const startIdx = merged.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const endIdx = Math.min(page * PAGE_SIZE, merged.length);
  const pageNumbers = useMemo(() => {
    const out: (number | "...")[] = [];
    if (totalPages <= 9) { for (let i = 1; i <= totalPages; i++) out.push(i); return out; }
    out.push(1);
    const start = Math.max(2, page - 2), end = Math.min(totalPages - 1, page + 2);
    if (start > 2) out.push("...");
    for (let i = start; i <= end; i++) out.push(i);
    if (end < totalPages - 1) out.push("...");
    out.push(totalPages);
    return out;
  }, [totalPages, page]);
  useEffect(() => { setPage(1); }, [search, actionTypes, correspondents, handlers, dateFrom, dateTo]);
  useEffect(() => { if (page > totalPages) setPage(totalPages); }, [totalPages, page]);

  const handlePick = (t: CaseHistoryActionType) => {
    setAddType(t);
  };

  const handleCreated = (rec: CaseHistoryRecord) => {
    setSelectedId(rec.id);
    load();
    if (claimId) getCaseHistoryFilters(claimId).then(setFilterOptions).catch(() => {});
  };

  // Drag an Outlook email onto the list to import it as a record. Outlook rarely
  // hands over a clean .eml/.msg file: the email may arrive under dataTransfer.items,
  // with no extension, or only as raw message text — so we take whatever we can get
  // and let the backend sniff the content to pick the right parser.
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const dt = e.dataTransfer;

    let files: File[] = Array.from(dt.files || []);
    // Some sources (incl. Outlook) expose the dropped item only via items[].
    if (!files.length && dt.items) {
      for (const it of Array.from(dt.items)) {
        if (it.kind === "file") {
          const f = it.getAsFile();
          if (f) files.push(f);
        }
      }
    }
    // Last resort: the raw message was dropped as text (headers + body).
    if (!files.length) {
      const raw = dt.getData("text/plain") || dt.getData("text/rfc822") || "";
      if (/^\s*(from|subject|date|to)\s*:/im.test(raw)) {
        files = [new File([raw], "dropped.eml", { type: "message/rfc822" })];
      }
    }
    if (!files.length) {
      const kinds = Array.from(dt.types || []).join(", ") || "nothing";
      toast.info(`Couldn't read the dropped email (got: ${kinds}). Try dragging it from the Outlook desktop app.`);
      return;
    }
    setImporting(true);
    try {
      let last: CaseHistoryRecord | null = null;
      for (const f of files) {
        try {
          last = await importCaseHistoryEmail(claimId, f);
          toast.success(`Imported: ${last.subject || "email"}`);
        } catch {
          toast.error(`Could not import ${f.name}`);
        }
      }
      await load();
      if (claimId) getCaseHistoryFilters(claimId).then(setFilterOptions).catch(() => {});
      if (last) setSelectedId(last.id);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="flex flex-col w-full min-h-screen bg-white font-['Stack_Sans_Headline']">
      {((loading && records.length === 0) || filterBusy) && <SpinnerLoader />}
      {importing && <SpinnerLoader />}

      {/* Header */}
      <header className="px-10 py-5 bg-white shadow-[0px_4px_20px_0px_rgba(0,0,0,0.08)] flex justify-between items-center sticky top-0 z-20">
        <div className="flex flex-col gap-1">
          <button
            onClick={() => (claimId ? navigate(`/add-claim/${claimId}`) : navigate(-1))}
            className="flex items-center gap-1 text-blue-300 text-xs font-semibold hover:text-blue-500"
          >
            <ChevronLeft size={16} /> Back to Claim Details
          </button>
          <h1 className="text-2xl font-semibold text-black leading-6">
            CASE HISTORY: {caseReference || "—"}
          </h1>
        </div>
        {/* Add-record pills — one click opens the chosen activity's form. */}
        <div className="flex items-center gap-2 flex-wrap justify-end">
          {ACTION_ORDER.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => handlePick(t)}
              className="px-3 py-2 rounded-sm bg-blue-100 text-blue-600 text-xs inline-flex items-center gap-1.5 hover:bg-blue-200"
            >
              <img src={ACTION_META[t].icon} alt="" className="w-4 h-4" /> {ACTION_META[t].label}
            </button>
          ))}
        </div>
      </header>

      <div className="p-10 flex flex-col gap-6">
        {/* Filter bar */}
        <div className="flex flex-wrap justify-between items-center gap-4">
          <div className="flex flex-wrap items-center gap-8">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search history"
              className="w-[491px] max-w-full px-5 py-4 rounded-sm outline outline-1 -outline-offset-1 outline-neutral-200 text-base font-light text-neutral-700 placeholder:text-neutral-300 focus:outline-blue-300"
            />
            <div className="flex items-center gap-4">
              <FilterDropdown
                label="Action Type"
                options={ALL_ACTION_TYPES.map((t) => ({ value: t, label: `${ACTION_META[t].abbr} - ${ACTION_META[t].label}` }))}
                selected={actionTypes}
                onChange={(v) => { setFilterBusy(true); setActionTypes(v); }}
              />
              <FilterDropdown
                label="Correspondent"
                options={filterOptions.correspondents.map((c) => ({ value: c, label: c }))}
                selected={correspondents}
                onChange={(v) => { setFilterBusy(true); setCorrespondents(v); }}
              />
              <FilterDropdown
                label="Handler"
                options={handlerOptions.map((h) => ({ value: h, label: h }))}
                selected={handlers}
                onChange={(v) => { setFilterBusy(true); setHandlers(v); }}
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-neutral-700 text-sm">Date Range</span>
            <DateField value={dateFrom} onChange={(v) => { setFilterBusy(true); setDateFrom(v); }} placeholder="From" />
            <DateField value={dateTo} onChange={(v) => { setFilterBusy(true); setDateTo(v); }} placeholder="To" />
          </div>
        </div>

        {/* Body: list + detail */}
        <div className="flex justify-between items-start gap-6">
          <div
            className={`flex-1 min-w-0 basis-0 flex flex-col gap-4 relative rounded-lg transition ${dragOver ? "outline outline-2 outline-dashed outline-blue-400" : ""}`}
            onDragOver={(e) => { e.preventDefault(); if (!dragOver) setDragOver(true); }}
            onDragLeave={(e) => { if (e.currentTarget === e.target) setDragOver(false); }}
            onDrop={handleDrop}
          >
            {dragOver && (
              <div className="absolute inset-0 z-10 rounded-lg bg-blue-50/85 flex items-center justify-center text-blue-600 text-sm font-weight-500 pointer-events-none">
                Drop the Outlook email (.eml / .msg) here to add it to history
              </div>
            )}
            {merged.length === 0 ? (
              loading ? null : (
                <div className="py-16 text-center text-sm text-neutral-400">No history records yet.</div>
              )
            ) : (
              pageRecords.map((r) => (
                <HistoryCard key={String(r.id)} r={r} active={r.id === selectedId} onClick={() => setSelectedId(r.id)} />
              ))
            )}

            {merged.length > 0 && (
              <div className="flex items-center justify-between flex-wrap gap-3 pt-2">
                <div className="text-neutral-500 text-sm">
                  Showing <span className="font-weight-600 text-neutral-700">{startIdx}</span> to{" "}
                  <span className="font-weight-600 text-neutral-700">{endIdx}</span> of{" "}
                  <span className="font-weight-600 text-neutral-700">{merged.length}</span> Entries
                </div>
                <div className="flex items-center gap-1">
                  <button type="button" disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="px-3 py-1.5 text-sm text-neutral-600 disabled:text-neutral-300 hover:text-blue-600">Previous</button>
                  {pageNumbers.map((n, i) =>
                    n === "..." ? (
                      <span key={`e${i}`} className="px-2 text-neutral-400">…</span>
                    ) : (
                      <button key={n} type="button" onClick={() => setPage(n)}
                        className={`w-8 h-8 rounded text-sm ${page === n ? "bg-blue-100 text-blue-600 font-weight-600" : "text-neutral-600 hover:bg-neutral-50"}`}>
                        {n}
                      </button>
                    ),
                  )}
                  <button type="button" disabled={page === totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className="px-3 py-1.5 text-sm text-blue-600 disabled:text-neutral-300 hover:text-blue-700">Next</button>
                </div>
              </div>
            )}
          </div>
          <RecordDetail
            r={selected}
            onCreateNew={(t) => setAddType(t)}
            onEmailAction={(mode, record) => setEmailModal({ mode, record })}
          />
        </div>
      </div>

      {addType && (
        <HistoryActionForm
          actionType={addType}
          claimId={claimId}
          caseReference={caseReference || ""}
          handlerName={handlerName}
          onClose={() => setAddType(null)}
          onCreated={handleCreated}
        />
      )}

      {emailModal && (
        <ClaimsEmailModal
          isOpen={!!emailModal}
          onClose={() => setEmailModal(null)}
          title={emailModal.mode === "reply" ? "Reply" : "Forward"}
          html={'<div style="font-family:Arial,sans-serif;font-size:14px;color:#111827"><p></p></div>'}
          subject={shareSubject(emailModal.mode, emailModal.record.subject || "")}
          to=""
          hideTo={emailModal.mode === "reply"}
          allowAttach
          sending={emailSending}
          sendLabel={emailModal.mode === "reply" ? "Send Reply" : "Forward"}
          onSend={async (editedHtml, to, subject, _cc, files) => {
            const rec = emailModal.record;
            if (emailModal.mode === "forward" && !to.trim()) { toast.info("Add at least one recipient."); return; }
            const activity = toEmailActivity(rec);
            const comment = htmlToPlainText(editedHtml);
            try {
              setEmailSending(true);
              if (emailModal.mode === "reply") {
                await replyToEmailGraph(activity, comment, files);
              } else {
                await forwardEmailGraph(activity, to, comment, files, subject);
              }
              toast.success(emailModal.mode === "reply" ? "Reply sent successfully." : "Email forwarded successfully.");
              setEmailModal(null);
              load();
              if (claimId) getCaseHistoryEmails(claimId).then(setEmails).catch(() => {});
            } catch (err) {
              console.error("Case History email action failed:", err);
              toast.error("Failed to send email.");
            } finally {
              setEmailSending(false);
            }
          }}
        />
      )}
    </div>
  );
};

// Date field matching the General Details form: a clickable box with the Vector-6
// calendar icon that opens the shared CustomDatePicker popup. Saves the day as a
// local YYYY-MM-DD (sv-SE) so it never shifts a day in BST.
const DateField = ({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    if (open) document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);
  return (
    <div className="w-36 relative" ref={ref}>
      <div
        onClick={() => setOpen((o) => !o)}
        className="h-[52px] px-5 bg-white rounded-sm outline outline-1 -outline-offset-1 outline-neutral-200 flex items-center justify-between cursor-pointer"
      >
        <span className={value ? "text-neutral-700 text-sm" : "text-neutral-300 text-base font-light"}>
          {value || placeholder}
        </span>
        <img src={Vector6} alt="" className="w-4 h-4" />
      </div>
      {open && (
        <div className="absolute top-full left-0 z-50 mt-1">
          <CustomDatePicker
            selectedDate={value ? new Date(`${value}T00:00:00`) : new Date()}
            onDateSelect={(date: Date) => {
              onChange(date.toLocaleDateString("sv-SE"));
              setOpen(false);
            }}
          />
        </div>
      )}
    </div>
  );
};

export default CaseHistory;
