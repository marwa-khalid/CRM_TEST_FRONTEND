import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, Paperclip, ExternalLink } from "lucide-react";
import { toast } from "react-toastify";
import FleetMultiSelectFilter from "../../components/FleetMultiSelectFilter";
import { FleetDateField, FleetSelect, FleetTextInput, FleetCreatableSelect } from "../../components/fields";
import { getFleetUsers, type FleetUser } from "../../services/userService";
import PdfLogo from "../../../assets/FileTypes/PDF.svg";
import DocLogo from "../../../assets/FileTypes/DOC.svg";
import ExcelLogo from "../../../assets/FileTypes/Excel.svg";
import CsvLogo from "../../../assets/FileTypes/CSV.svg";
import PptLogo from "../../../assets/FileTypes/PPT.svg";
import PngLogo from "../../../assets/FileTypes/PNG.svg";
import SendLetterIcon from "../../../assets/HistorySection/SendLetter.svg";
import SendEmailIcon from "../../../assets/HistorySection/SendEmail.svg";
import IncomingCallIcon from "../../../assets/HistorySection/IncomingCall.svg";
import OutgoingCallIcon from "../../../assets/HistorySection/OutgoingCall.svg";
import NotesIcon from "../../../assets/HistorySection/Notes.svg";
import DiaryIcon from "../../../assets/HistorySection/Diary.svg";
import MovementIcon from "../../assets/listingpage/vehicles.svg";
import FleetEmailModal from "../../components/FleetEmailModal";
import {
  getFleetHistory,
  getFleetHistoryFilters,
  getFleetCorrespondents,
  getFleetHistoryEmails,
  createFleetHistory,
  importFleetHistoryEmail,
  fleetReplyEmail,
  fleetForwardEmail,
  openFleetAttachment,
  fetchFleetAttachment,
  getFleetAttachmentPages,
  type FleetAttachmentPreview,
  type FleetHistoryScope,
  type FleetHistoryRecord,
  type FleetHistoryFilterOptions,
  type FleetHistoryAttachment,
  type CaseHistoryActionType,
} from "../../services/fleetHistory";

// ── Action-type presentation (abbreviation + label) ──────────────────────────
const ACTION_META: Record<CaseHistoryActionType, { abbr: string; label: string; icon: string }> = {
  send_letter: { abbr: "SL", label: "Send Letter", icon: SendLetterIcon },
  send_email: { abbr: "SE", label: "Send Email", icon: SendEmailIcon },
  incoming_email: { abbr: "IE", label: "Incoming Email", icon: SendEmailIcon },
  incoming_call: { abbr: "IC", label: "Incoming Call", icon: IncomingCallIcon },
  outgoing_call: { abbr: "OC", label: "Outgoing Call", icon: OutgoingCallIcon },
  note: { abbr: "NT", label: "Notes", icon: NotesIcon },
  diary: { abbr: "DY", label: "Diary", icon: DiaryIcon },
  movement: { abbr: "MO", label: "On / Off Hire", icon: MovementIcon },
};
const CREATE_ORDER: CaseHistoryActionType[] = [
  "send_letter", "send_email", "incoming_call", "outgoing_call", "note", "diary",
];
const ALL_TYPES: CaseHistoryActionType[] = [
  "send_letter", "send_email", "incoming_email", "incoming_call", "outgoing_call", "note", "diary", "movement",
];

const PAGE_SIZE = 8;

// ── Small helpers ────────────────────────────────────────────────────────────
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
  return `${mm}-${dd}-${yy}  ${h}:${String(d.getMinutes()).padStart(2, "0")}${ap}`;
};

const attachmentsOf = (r: FleetHistoryRecord): FleetHistoryAttachment[] =>
  ((r.payload && (r.payload as { attachments?: FleetHistoryAttachment[] }).attachments) || []);
const sourceOf = (r: FleetHistoryRecord): string =>
  ((r.payload as { source?: string } | null)?.source || "");
const isEmail = (r: FleetHistoryRecord) => ["email", "imported_email"].includes(sourceOf(r));
// Reply / Forward are available on every email record (Send Email / Incoming Email).
const canReplyForward = (r: FleetHistoryRecord) =>
  r.action_type === "send_email" || r.action_type === "incoming_email";
const isDoc = (r: FleetHistoryRecord) => sourceOf(r) === "document";

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

const sanitizeEmailHtml = (html = ""): string => {
  if (!html) return "";
  const doc = new DOMParser().parseFromString(html, "text/html");
  doc.querySelectorAll("script, style, iframe, object, embed").forEach((el) => el.remove());
  doc.querySelectorAll('img[src^="cid:"], img[src^="CID:"]').forEach((el) => el.remove());
  doc.body.querySelectorAll("*").forEach((el) => {
    [...el.attributes].forEach((attr) => {
      if (attr.name.toLowerCase().startsWith("on") || attr.value.toLowerCase().includes("javascript:")) {
        el.removeAttribute(attr.name);
      }
    });
  });
  return doc.body.innerHTML;
};

const emailBodyText = (r: FleetHistoryRecord): string => {
  const p = (r.payload as { body_text?: string; body_html?: string } | null) || {};
  if (p.body_text && p.body_text.trim()) return p.body_text;
  if (p.body_html) return p.body_html.replace(/<[^>]+>/g, " ").replace(/\n{3,}/g, "\n\n").trim();
  return r.details || "—";
};

// ── Spinner overlay ──────────────────────────────────────────────────────────
const Spinner = () => (
  <div className="fixed inset-0 z-[9999] bg-[#e8e6df]/80 flex items-center justify-center">
    <div className="relative w-[73px] h-[73px]">
      {Array.from({ length: 12 }).map((_, i) => (
        <span
          key={i}
          className="absolute left-1/2 top-1/2 w-[6px] h-[16px] rounded-full bg-[#9b9b9b] animate-loaderFade"
          style={{ transform: `translate(-50%, -50%) rotate(${i * 30}deg) translateY(-25px)`, animationDelay: `${i * 0.08}s` }}
        />
      ))}
    </div>
  </div>
);

// Action badge (black pill, white icon + abbreviation) — used on cards + detail.
const ActionBadge = ({ type }: { type: CaseHistoryActionType | null }) => {
  if (!type) return null;
  const meta = ACTION_META[type];
  return (
    <span className="shrink-0 px-3 py-1.5 bg-neutral-900 rounded-sm inline-flex items-center gap-2 whitespace-nowrap" title={meta.label}>
      <img src={meta.icon} alt="" className="w-4 h-4" style={{ filter: "brightness(0) invert(1)" }} />
      <span className="text-white text-xs">{meta.abbr}</span>
    </span>
  );
};
const AttachmentClip = ({ count }: { count: number }) => {
  if (!count) return null;
  return (
    <span className="relative inline-flex items-center justify-center text-neutral-500 shrink-0" title={`${count} attachment${count === 1 ? "" : "s"}`}>
      <Paperclip className="w-4 h-4" />
      <span className="absolute -top-2 -right-2 min-w-[15px] h-[15px] px-1 rounded-full bg-neutral-900 text-white text-[9px] leading-none inline-flex items-center justify-center">{count}</span>
    </span>
  );
};
const PeopleLines = ({ r }: { r: FleetHistoryRecord }) => {
  if (!r.correspondent && !r.handler) return null;
  return (
    <div className="flex flex-col gap-0.5 text-xs">
      {r.correspondent && <div className="text-neutral-500">Correspondent: <span className="text-neutral-700">{r.correspondent}</span></div>}
      {r.handler && <div className="text-neutral-500">Handler: <span className="text-neutral-700">{r.handler}</span></div>}
    </div>
  );
};

// ── History card ─────────────────────────────────────────────────────────────
const HistoryCard = ({ r, active, onClick, threadCount = 1 }: { r: FleetHistoryRecord; active: boolean; onClick: () => void; threadCount?: number }) => (
  <button
    type="button"
    onClick={onClick}
    className={`w-full text-left p-4 rounded-sm outline outline-1 -outline-offset-1 flex flex-col gap-2 transition ${active ? "bg-neutral-50 outline-neutral-300" : "bg-transparent outline-neutral-100 hover:outline-neutral-200"}`}
  >
    <div className="flex justify-between items-center gap-3">
      <div className="text-sm">
        <span className="text-neutral-500">Posted: </span>
        <span className="text-neutral-700">{fmtPosted(r.posted_at)}</span>
      </div>
      <div className="flex items-center gap-4 shrink-0">
        {threadCount > 1 && (
          <span title={`${threadCount} messages in this thread`} className="px-2 py-0.5 rounded-full bg-neutral-900 text-white text-xs font-semibold">{threadCount}</span>
        )}
        {!isDoc(r) && threadCount <= 1 && <AttachmentClip count={attachmentsOf(r).length} />}
        <ActionBadge type={r.action_type} />
      </div>
    </div>
    <PeopleLines r={r} />
    <div className="self-stretch pt-2.5 border-t border-neutral-200">
      {isDoc(r) && attachmentsOf(r)[0] ? (
        <div className="flex items-center gap-2.5">
          <img src={fileTypeLogo(attachmentsOf(r)[0].name)} alt="" className="w-5 h-5 shrink-0 object-contain" />
          <span className="text-neutral-700 text-sm truncate">{attachmentsOf(r)[0].name}</span>
        </div>
      ) : (
        <div className={`text-neutral-700 text-sm ${isEmail(r) ? "truncate" : ""}`}>
          {isEmail(r) ? (r.subject || "(No subject)") : (r.details || "—")}
        </div>
      )}
    </div>
  </button>
);

// Inline preview of one attachment (page images / Excel-grid / Word-HTML), loaded
// from the record id + attachment index — used in the stacked thread view.
const AttachmentPreview = ({ recordId, index, name, url }: { recordId: number | string; index: number; name: string; url?: string }) => {
  const [pages, setPages] = useState<FleetAttachmentPreview | null>(null);
  const [blob, setBlob] = useState<{ url: string; type: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const isLive = typeof recordId === "string" && recordId.startsWith("email:");
  useEffect(() => {
    let alive = true; setLoading(true); setPages(null); setBlob(null);
    const loadBlob = () => {
      if (!url) { if (alive) { setPages({ type: "unsupported", pages: [] }); setLoading(false); } return; }
      fetchFleetAttachment(url)
        .then(({ url: u, type }) => { if (alive) setBlob({ url: u, type }); })
        .catch(() => { if (alive) setPages({ type: "unsupported", pages: [] }); })
        .finally(() => { if (alive) setLoading(false); });
    };
    if (isLive) { loadBlob(); return () => { alive = false; }; }
    getFleetAttachmentPages(recordId, index)
      .then((p) => {
        if (!alive) return;
        if (p.type === "unsupported" && url) loadBlob();
        else { setPages(p); setLoading(false); }
      })
      .catch(() => { if (alive) loadBlob(); });
    return () => { alive = false; };
  }, [recordId, index, url]);
  useEffect(() => () => { if (blob) URL.revokeObjectURL(blob.url); }, [blob]);
  return (
    <div className="w-full flex flex-col gap-2">
      <div className="text-neutral-800 text-sm font-semibold">Attachment : {name}</div>
      {loading && <Spinner />}
      {pages?.type === "pdf" && pages.pages?.map((pg) => (
        <img key={pg.page} src={pg.image} alt={`Page ${pg.page}`} className="w-full h-auto object-contain bg-white rounded outline outline-1 -outline-offset-1 outline-neutral-200" />
      ))}
      {pages?.type === "image" && pages.url && (
        <img src={pages.url} alt={name} className="w-full h-auto object-contain rounded outline outline-1 -outline-offset-1 outline-neutral-200" />
      )}
      {pages?.type === "html" && pages.html && (
        /\.xlsx?$/i.test(pages.file_name || "") ? (
          <div className="w-full" dangerouslySetInnerHTML={{ __html: sanitizeEmailHtml(pages.html) }} />
        ) : (
          <div className="w-full overflow-x-auto">
            <div className="text-xs text-neutral-800 leading-relaxed break-words [&_*]:!max-w-full [&_table]:!w-full [&_td]:break-words [&_img]:!h-auto"
              dangerouslySetInnerHTML={{ __html: sanitizeEmailHtml(pages.html) }} />
          </div>
        )
      )}
      {blob && (blob.type.startsWith("image/")
        ? <img src={blob.url} alt={name} className="w-full h-auto object-contain rounded outline outline-1 -outline-offset-1 outline-neutral-200" />
        : <iframe src={blob.url} title={name} className="w-full h-[600px] rounded outline outline-1 -outline-offset-1 outline-neutral-200 bg-white" />)}
      {!loading && !blob && pages?.type === "unsupported" && (
        <div className="text-xs text-neutral-400">Preview not available.</div>
      )}
    </div>
  );
};

// Attachments shown as line-tabs (file names) when there are 2+, previewing one at a
// time; a single attachment just shows its preview.
const AttachmentTabs = ({ atts }: { atts: { recordId: number | string; index: number; name: string; url?: string }[] }) => {
  const [sel, setSel] = useState(0);
  if (atts.length === 0) return null;
  const cur = atts[Math.min(sel, atts.length - 1)];
  return (
    <div className="w-full flex flex-col gap-3">
      {atts.length > 1 && (
        <div className="flex items-center gap-3 flex-wrap">
          {atts.map((a, i) => (
            <button key={i} type="button" onClick={() => setSel(i)}
              className={`text-sm rounded-sm ${i === sel ? "px-4 py-1 bg-neutral-900 text-white" : "text-neutral-700 hover:underline"}`}>
              {a.name}
            </button>
          ))}
        </div>
      )}
      <AttachmentPreview recordId={cur.recordId} index={cur.index} name={cur.name} url={cur.url} />
    </div>
  );
};

// ── Detail pane ──────────────────────────────────────────────────────────────
const ReplyForward = ({ r, onEmailAction }: { r: FleetHistoryRecord; onEmailAction?: (mode: "reply" | "forward", rec: FleetHistoryRecord) => void }) =>
  canReplyForward(r) && onEmailAction ? (
    <>
      <button type="button" onClick={() => onEmailAction("reply", r)} className="px-3 py-1.5 rounded-sm outline outline-1 -outline-offset-1 outline-neutral-800 text-neutral-800 text-xs hover:bg-neutral-50">Reply</button>
      <button type="button" onClick={() => onEmailAction("forward", r)} className="px-3 py-1.5 rounded-sm outline outline-1 -outline-offset-1 outline-neutral-800 text-neutral-800 text-xs hover:bg-neutral-50">Forward</button>
    </>
  ) : null;

const RecordDetail = ({ r, threadMessages, onEmailAction }: { r: FleetHistoryRecord | null; threadMessages?: FleetHistoryRecord[]; onEmailAction?: (mode: "reply" | "forward", rec: FleetHistoryRecord) => void }) => {
  const [preview, setPreview] = useState<{ url: string; type: string; name: string } | null>(null);
  const [loadingIdx, setLoadingIdx] = useState<number | null>(null);
  const [docPages, setDocPages] = useState<FleetAttachmentPreview | null>(null);
  const [docLoading, setDocLoading] = useState(false);
  const [threadTab, setThreadTab] = useState<"record" | "attachments">("record");
  const rid = r?.id;
  useEffect(() => { setPreview(null); setThreadTab("record"); }, [rid]);
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview.url); }, [preview]);

  // Document records: auto-load rendered page images / Word-HTML (like claims).
  useEffect(() => {
    let alive = true;
    setDocPages(null);
    // The preview endpoint renders from the record id + attachment index, so it does
    // NOT need the attachment's url (which can be null when only the S3 key is stored).
    // Fetch whenever the record is a document with an attachment.
    if (r && isDoc(r) && attachmentsOf(r).length > 0) {
      setDocLoading(true);
      getFleetAttachmentPages(r.id, 0)
        .then((p) => { if (alive) setDocPages(p); })
        .catch(() => { if (alive) setDocPages({ type: "unsupported", pages: [] }); })
        .finally(() => { if (alive) setDocLoading(false); });
    }
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rid]);

  const openInline = async (a: FleetHistoryAttachment, i: number) => {
    if (!a.url) return;
    try {
      setLoadingIdx(i);
      const { url, type } = await fetchFleetAttachment(a.url);
      setPreview((prev) => { if (prev) URL.revokeObjectURL(prev.url); return { url, type, name: a.name }; });
    } catch {
      toast.error("Could not open the document.");
    } finally {
      setLoadingIdx(null);
    }
  };

  const shell = "grow-[2] min-w-0 basis-0 min-h-[calc(100vh-220px)] px-10 py-6 bg-white rounded-sm outline outline-1 -outline-offset-1 outline-neutral-300 flex flex-col gap-4";
  if (!r) {
    return (
      <div className={shell}>
        <div className="text-black text-xl font-semibold">Record Detail</div>
        <div className="h-px bg-neutral-200 w-full" />
        <div className="flex-1 flex items-center justify-center text-sm text-neutral-400">Select a record to preview its details.</div>
      </div>
    );
  }
  // Email thread → stack every message (latest first): heading, then each email's
  // correspondent + subject + body + attachment previews, spaced like a conversation.
  if (threadMessages && threadMessages.length > 1) {
    const threadAtts = threadMessages.flatMap((m) =>
      attachmentsOf(m).map((a, ai) => ({ recordId: m.id, index: ai, name: a.name, url: a.url })));
    return (
      <div className={shell}>
        {(loadingIdx !== null || docLoading) && <Spinner />}
        {threadAtts.length > 0 ? (
          <div className="flex items-start gap-6">
            <button type="button" onClick={() => setThreadTab("record")} className={`pb-2 text-sm leading-4 border-b ${threadTab === "record" ? "text-neutral-900 border-neutral-900" : "text-neutral-500 border-transparent"}`}>Email Details</button>
            <button type="button" onClick={() => setThreadTab("attachments")} className={`pb-2 text-sm leading-4 border-b ${threadTab === "attachments" ? "text-neutral-900 border-neutral-900" : "text-neutral-500 border-transparent"}`}>Attachments</button>
          </div>
        ) : (
          <div className="text-black text-xl font-semibold">Record Detail</div>
        )}
        <div className="h-px bg-neutral-200 w-full" />
        {threadAtts.length > 0 && threadTab === "attachments" ? (
          <div className="overflow-auto">
            <AttachmentTabs atts={threadAtts} />
          </div>
        ) : (
          <div className="flex flex-col gap-8 overflow-auto">
            {threadMessages.map((m, i) => (
              <div key={String(m.id)} className={`flex flex-col gap-2 ${i > 0 ? "pt-6 border-t border-neutral-200" : ""}`}>
                <div className="flex justify-between items-start gap-3">
                  <div className="text-sm"><span className="text-neutral-500">Posted: </span><span className="text-neutral-700">{fmtPosted(m.posted_at)}</span></div>
                  {i === 0 && (
                    <div className="flex items-center gap-2 shrink-0">
                      <ReplyForward r={m} onEmailAction={onEmailAction} />
                      <ActionBadge type={m.action_type} />
                    </div>
                  )}
                </div>
                <PeopleLines r={m} />
                {m.subject && <div className="text-neutral-700 text-sm">Subject : <span className="font-semibold">{m.subject}</span></div>}
                <div className="pt-2.5 border-t border-neutral-200 min-h-16">
                  {(m.payload as { body_html?: string } | null)?.body_html
                    ? <div className="text-sm text-neutral-700 leading-relaxed break-words overflow-x-auto [&_img]:max-w-full [&_table]:max-w-full [&_a]:text-neutral-900 [&_a]:underline"
                        dangerouslySetInnerHTML={{ __html: sanitizeEmailHtml((m.payload as { body_html?: string }).body_html || "") }} />
                    : <div className="text-neutral-700 text-sm whitespace-pre-wrap">{isEmail(m) ? emailBodyText(m) : (m.details || "—")}</div>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }
  const doc = isDoc(r);
  const hasAtts = !doc && attachmentsOf(r).length > 0;
  const singleAtts = hasAtts ? attachmentsOf(r).map((a, i) => ({ recordId: r.id, index: i, name: a.name, url: a.url })) : [];
  return (
    <div className={shell}>
      {(loadingIdx !== null || docLoading) && <Spinner />}
      {/* Header: document records show the file name; email/records with attachments
          show Email Details / Attachments tabs; others show "Record Detail". */}
      {doc ? (
        <div className="text-black text-xl font-semibold truncate">Attachment : {attachmentsOf(r)[0]?.name || "Document"}</div>
      ) : hasAtts ? (
        <div className="flex justify-between items-center gap-3">
          <div className="flex items-start gap-6">
            <button type="button" onClick={() => setThreadTab("record")} className={`pb-2 text-sm leading-4 border-b ${threadTab === "record" ? "text-neutral-900 border-neutral-900" : "text-neutral-500 border-transparent"}`}>{isEmail(r) ? "Email Details" : "Record Detail"}</button>
            <button type="button" onClick={() => setThreadTab("attachments")} className={`pb-2 text-sm leading-4 border-b ${threadTab === "attachments" ? "text-neutral-900 border-neutral-900" : "text-neutral-500 border-transparent"}`}>Attachments</button>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <ReplyForward r={r} onEmailAction={onEmailAction} />
            <ActionBadge type={r.action_type} />
          </div>
        </div>
      ) : (
        <div className="flex justify-between items-center gap-3">
          <div className="text-black text-xl font-semibold">Record Detail</div>
          <div className="flex items-center gap-2 shrink-0">
            <ReplyForward r={r} onEmailAction={onEmailAction} />
            <ActionBadge type={r.action_type} />
          </div>
        </div>
      )}
      <div className="h-px bg-neutral-200 w-full" />
      {!doc && (!hasAtts || threadTab === "record") && (
        <>
          <div className="text-sm"><span className="text-neutral-500">Posted: </span><span className="text-neutral-700">{fmtPosted(r.posted_at)}</span></div>
          {(r.correspondent || r.handler) && (
            <div className="text-sm text-neutral-500 flex flex-wrap gap-x-6 gap-y-1">
              {r.correspondent && <span>Correspondent: <span className="text-neutral-700">{r.correspondent}</span></span>}
              {r.handler && <span>Handler: <span className="text-neutral-700">{r.handler}</span></span>}
            </div>
          )}
          {r.subject && <div className="text-neutral-700 text-sm">Subject : <span className="font-semibold">{r.subject}</span></div>}
          <div className="pt-2.5 border-t border-neutral-200 min-h-28">
            {isEmail(r) && (r.payload as { body_html?: string } | null)?.body_html
              ? <div className="text-sm text-neutral-700 leading-relaxed break-words overflow-x-auto [&_img]:max-w-full [&_table]:max-w-full [&_a]:text-neutral-900 [&_a]:underline"
                  dangerouslySetInnerHTML={{ __html: sanitizeEmailHtml((r.payload as { body_html?: string }).body_html || "") }} />
              : <div className="text-neutral-700 text-sm whitespace-pre-wrap">{isEmail(r) ? emailBodyText(r) : (r.details || "—")}</div>}
          </div>
        </>
      )}
      {/* Attachments tab: file-name line-tabs (2+) + the selected attachment's preview. */}
      {hasAtts && threadTab === "attachments" && (
        <div className="overflow-auto">
          <AttachmentTabs atts={singleAtts} />
        </div>
      )}
      {/* Document preview — rendered pages / Word-HTML / image. */}
      {doc && (
        <div className="flex flex-col items-center gap-2">
          {docPages?.type === "pdf" && docPages.pages?.map((pg) => (
            <img key={pg.page} src={pg.image} alt={`Page ${pg.page}`} className="w-full h-auto object-contain bg-white rounded" />
          ))}
          {docPages?.type === "image" && docPages.url && (
            <img src={docPages.url} alt={docPages.file_name || ""} className="w-full h-auto object-contain rounded" />
          )}
          {docPages?.type === "html" && docPages.html && (
            /\.xlsx?$/i.test(docPages.file_name || "") ? (
              <div className="w-full" dangerouslySetInnerHTML={{ __html: sanitizeEmailHtml(docPages.html) }} />
            ) : (
              <div className="w-full overflow-x-auto">
                <div className="text-xs text-neutral-800 leading-relaxed break-words [&_*]:!max-w-full [&_table]:!w-full [&_td]:break-words [&_img]:!h-auto"
                  dangerouslySetInnerHTML={{ __html: sanitizeEmailHtml(docPages.html) }} />
              </div>
            )
          )}
          {!docLoading && docPages?.type === "unsupported" && (
            <div className="py-8 text-sm text-neutral-400">Preview not available — use the open-in-new-tab option.</div>
          )}
        </div>
      )}
    </div>
  );
};

// Diary action options — same set as the Claims diary form.
const DIARY_ACTIONS = ["Make a Call", "Send Email", "Letter", "SMS", "Other"];

// ── Add Record slide-over (lean form covering the 6 types) ───────────────────
const AddRecordForm = ({
  actionType, onClose, onSubmit, handlerOptions, correspondentOptions = [], defaultCorrespondent,
}: {
  actionType: CaseHistoryActionType;
  onClose: () => void;
  onSubmit: (payload: { correspondent?: string; handler?: string; subject?: string; details?: string; posted_at?: string; payload?: Record<string, unknown> }) => Promise<void>;
  handlerOptions: string[];
  correspondentOptions?: string[];
  defaultCorrespondent?: string;
}) => {
  const meta = ACTION_META[actionType];
  const [correspondent, setCorrespondent] = useState(defaultCorrespondent || "");
  const [handler, setHandler] = useState("");
  const [subject, setSubject] = useState("");
  const [details, setDetails] = useState("");
  const [saving, setSaving] = useState(false);
  const showSubject = ["send_letter", "send_email"].includes(actionType);
  const isDiary = actionType === "diary";
  // Diary-specific fields (match the Claims diary form).
  const [diaryAction, setDiaryAction] = useState("");
  const [assignedUser, setAssignedUser] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [dueTime, setDueTime] = useState("");

  // @-mention tagging in the note/details box (mirrors the Case Activity note box).
  const [mentionUsers, setMentionUsers] = useState<FleetUser[]>([]);
  const [mention, setMention] = useState<{ open: boolean; query: string }>({ open: false, query: "" });
  useEffect(() => {
    getFleetUsers().then((u) => setMentionUsers(Array.isArray(u) ? u : [])).catch(() => {});
  }, []);
  const handleDetailsChange = (value: string) => {
    setDetails(value);
    const m = value.match(/@([A-Za-z0-9._-]*)$/); // an @-token at the caret
    setMention(m ? { open: true, query: m[1] } : { open: false, query: "" });
  };
  const insertMention = (u: FleetUser) => {
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

  const submit = async () => {
    if (saving) return;
    setSaving(true);
    try {
      await onSubmit({
        correspondent: correspondent.trim() || undefined,
        // For a diary the assigned user is the record's handler (task assignee).
        handler: (isDiary ? assignedUser.trim() : handler.trim()) || undefined,
        subject: showSubject ? subject.trim() || undefined : undefined,
        details: details.trim() || undefined,
        payload: isDiary
          ? { action: diaryAction || null, assigned_to: assignedUser || null, due_date: dueDate || null, due_time: dueTime || null }
          : undefined,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex justify-end bg-black/30">
      <div className="w-[50vw] min-w-[520px] h-full bg-white flex flex-col">
        <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-neutral-800">{meta.label}</h2>
          <div className="flex items-center gap-3">
            <button type="button" onClick={onClose} className="px-5 py-2 text-sm text-neutral-600 hover:bg-neutral-100 rounded">Close</button>
            <button type="button" onClick={submit} disabled={saving} className="px-6 py-2 bg-neutral-900 hover:bg-black disabled:opacity-60 text-white rounded text-sm">{saving ? "Saving…" : "Save Record"}</button>
          </div>
        </div>
        <div className="p-6 flex flex-col gap-4 overflow-y-auto">
          <FleetCreatableSelect
            label="Correspondent"
            placeholder="Select or type an email"
            value={correspondent}
            options={correspondentOptions.map((c) => ({ value: c, label: c }))}
            onChange={setCorrespondent}
            menuPortal
            unsorted
          />
          {!isDiary && (
            <FleetSelect
              label="Handler"
              placeholder="Select handler"
              value={handler}
              options={handlerOptions.map((h) => ({ value: h, label: h }))}
              onChange={setHandler}
              menuPortal
            />
          )}
          {isDiary && (
            <>
              <FleetSelect label="Action" placeholder="Select action" value={diaryAction} options={DIARY_ACTIONS.map((a) => ({ value: a, label: a }))} onChange={setDiaryAction} menuPortal />
              <FleetSelect label="Assigned User" placeholder="Select user" value={assignedUser} options={handlerOptions.map((h) => ({ value: h, label: h }))} onChange={setAssignedUser} menuPortal />
              <div className="flex gap-4">
                <div className="flex-1"><FleetDateField label="Due Date" value={dueDate} onChange={setDueDate} /></div>
                <div className="flex-1"><FleetTextInput label="Due Time" value={dueTime} onChange={setDueTime} placeholder="HH:MM" /></div>
              </div>
            </>
          )}
          {showSubject && <FleetTextInput label="Subject" value={subject} onChange={setSubject} placeholder="Subject" />}
          <Field label={actionType === "note" ? "Note" : "Details"}>
            <div className="relative">
              <textarea value={details} onChange={(e) => handleDetailsChange(e.target.value)} rows={8} placeholder="Write the details… type @ to tag someone" className={`${inputCls} resize-none`} />
              {mention.open && mentionMatches.length > 0 && (
                <div className="absolute z-50 left-0 right-0 top-full mt-1 max-h-56 overflow-auto bg-white border border-neutral-200 rounded-lg shadow-xl">
                  {mentionMatches.map((u) => (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => insertMention(u)}
                      className="w-full text-left px-4 py-2.5 flex items-center gap-3 hover:bg-neutral-50"
                    >
                      <span className="w-7 h-7 rounded-full bg-neutral-900 text-white text-xs font-semibold flex items-center justify-center shrink-0">
                        {(u.name || "?").charAt(0).toUpperCase()}
                      </span>
                      <span className="flex flex-col min-w-0">
                        <span className="text-sm text-neutral-900 font-medium truncate">@{u.name}</span>
                        <span className="text-xs text-neutral-400 truncate">{u.email}</span>
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </Field>
        </div>
      </div>
    </div>
  );
};
const inputCls = "w-full px-4 py-3 rounded border border-neutral-200 text-sm text-neutral-800 outline-none focus:border-neutral-500 placeholder:text-neutral-300";
const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="flex flex-col gap-1.5"><span className="text-neutral-700 text-sm font-medium">{label}</span>{children}</div>
);

// ── Main component ───────────────────────────────────────────────────────────
const FleetHistory = ({
  scope, id, title, onBack, backLabel, emailReference, correspondentName,
}: {
  scope: FleetHistoryScope;
  id: number | string;
  title: string;
  onBack?: () => void;
  backLabel?: string;
  // The vehicle registration — mailbox emails that mention it appear in this history.
  emailReference?: string;
  // For Skyline hires the correspondent is the driver (hirer) name — used as the
  // correspondent on fetched emails and as the default on new records.
  correspondentName?: string;
}) => {
  const [records, setRecords] = useState<FleetHistoryRecord[]>([]);
  const [emails, setEmails] = useState<FleetHistoryRecord[]>([]);
  const [allHandlers, setAllHandlers] = useState<string[]>([]);
  const [corrOptions, setCorrOptions] = useState<string[]>([]);
  const [corrDefault, setCorrDefault] = useState<string>("");
  const [filterOptions, setFilterOptions] = useState<FleetHistoryFilterOptions>({ correspondents: [], handlers: [], action_types: [] });
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [selectedId, setSelectedId] = useState<number | string | null>(null);
  const [emailModal, setEmailModal] = useState<{ mode: "reply" | "forward"; record: FleetHistoryRecord } | null>(null);
  const [emailSending, setEmailSending] = useState(false);
  const [addType, setAddType] = useState<CaseHistoryActionType | null>(null);
  const [page, setPage] = useState(1);

  const [search, setSearch] = useState("");
  const [actionTypes, setActionTypes] = useState<string[]>([]);
  const [correspondents, setCorrespondents] = useState<string[]>([]);
  const [handlers, setHandlers] = useState<string[]>([]);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const rows = await getFleetHistory(scope, id, { search, action_type: actionTypes, correspondent: correspondents, handler: handlers, date_from: dateFrom || undefined, date_to: dateTo || undefined });
      setRecords(rows);
    } finally {
      setLoading(false);
    }
  }, [scope, id, search, actionTypes, correspondents, handlers, dateFrom, dateTo]);

  useEffect(() => { const t = setTimeout(load, 250); return () => clearTimeout(t); }, [load]);
  useEffect(() => { getFleetUsers().then((u) => setAllHandlers(u.map((x) => x.name).filter(Boolean))).catch(() => {}); }, []);
  useEffect(() => {
    if (!id) return;
    getFleetCorrespondents(scope, id).then((c) => { setCorrOptions(c.options); setCorrDefault(c.default || ""); }).catch(() => {});
  }, [scope, id]);
  useEffect(() => {
    if (!id) return;
    getFleetHistoryFilters(scope, id).then(setFilterOptions).catch(() => {});
    // Each fetched email already carries its own correspondent (the other party's
    // email), so we don't override it — correspondentName only seeds new records.
    getFleetHistoryEmails(scope, id, emailReference).then(setEmails).catch(() => {});
  }, [scope, id, emailReference]);

  const merged = useMemo(() => {
    const term = search.trim().toLowerCase();
    const from = dateFrom ? new Date(`${dateFrom}T00:00:00`) : null;
    const to = dateTo ? new Date(`${dateTo}T23:59:59`) : null;
    const emailsF = emails.filter((e) => {
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
    const storedMsgIds = new Set(records.map((r) => ((r.payload as { message_id?: string } | null)?.message_id || "").trim()).filter(Boolean));
    const key = (r: FleetHistoryRecord) => `${(r.subject || "").trim().toLowerCase()}|${(r.posted_at || "").slice(0, 16)}`;
    const storedKeys = new Set(records.map(key));
    const emailsD = emailsF.filter((e) => {
      const mid = ((e.payload as { message_id?: string } | null)?.message_id || "").trim();
      if (mid && storedMsgIds.has(mid)) return false;
      if (storedKeys.has(key(e))) return false;
      return true;
    });
    return [...records, ...emailsD].sort((a, b) => (b.posted_at ? new Date(b.posted_at).getTime() : 0) - (a.posted_at ? new Date(a.posted_at).getTime() : 0));
  }, [records, emails, search, actionTypes, correspondents, handlers, dateFrom, dateTo]);

  // Group email records into conversation threads (by conversation_id, else the
  // normalized subject); non-email records stay standalone. Newest thread first.
  const groups = useMemo(() => {
    const isEmailRec = (r: FleetHistoryRecord) =>
      r.action_type === "send_email" || r.action_type === "incoming_email";
    const timeOf = (r: FleetHistoryRecord) => (r.posted_at ? new Date(r.posted_at).getTime() : 0);
    const threadKey = (r: FleetHistoryRecord) => {
      const cid = (r.payload as { conversation_id?: string } | null)?.conversation_id;
      if (cid) return `conv:${cid}`;
      const subj = (r.subject || "")
        .replace(/^(?:\s*(re|fw|fwd|aw|wg)\s*:\s*)+/i, "")
        .replace(/\s+/g, " ").trim().toLowerCase();
      return subj ? `subj:${subj}` : `id:${r.id}`;
    };
    const map = new Map<string, FleetHistoryRecord[]>();
    const order: string[] = [];
    for (const r of merged) {
      const key = isEmailRec(r) ? threadKey(r) : `single:${r.id}`;
      if (!map.has(key)) { map.set(key, []); order.push(key); }
      map.get(key)!.push(r);
    }
    return order
      .map((key) => {
        const messages = map.get(key)!.slice().sort((a, b) => timeOf(b) - timeOf(a));
        return { key, messages, latest: messages[0], count: messages.length };
      })
      .sort((a, b) => (b.latest.posted_at ? new Date(b.latest.posted_at).getTime() : 0)
                    - (a.latest.posted_at ? new Date(a.latest.posted_at).getTime() : 0));
  }, [merged]);

  useEffect(() => { if (merged.length && !merged.some((r) => r.id === selectedId)) setSelectedId(merged[0].id); }, [merged, selectedId]);
  useEffect(() => { setPage(1); }, [search, actionTypes, correspondents, handlers, dateFrom, dateTo]);

  const selected = merged.find((r) => r.id === selectedId) || null;
  const selectedGroup = groups.find((g) => g.messages.some((m) => m.id === selectedId)) || null;
  const totalPages = Math.max(1, Math.ceil(groups.length / PAGE_SIZE));
  const pageGroups = groups.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Every handler is available — not just those already on a record.
  const handlerOptions = Array.from(new Set([...allHandlers, ...filterOptions.handlers]));
  // Correspondent default + options: VM-CAMS gives the claim's client email (default)
  // + Third Party emails; Skyline/fleet give the hirer's driver email (correspondentName).
  const effectiveCorrDefault = corrDefault || correspondentName || "";
  const effectiveCorrOptions = corrOptions.length ? corrOptions : (correspondentName ? [correspondentName] : []);

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const dt = e.dataTransfer;
    let files: File[] = Array.from(dt.files || []);
    if (!files.length && dt.items) {
      for (const it of Array.from(dt.items)) if (it.kind === "file") { const f = it.getAsFile(); if (f) files.push(f); }
    }
    if (!files.length) {
      const raw = dt.getData("text/plain") || "";
      if (/^\s*(from|subject|date|to)\s*:/im.test(raw)) files = [new File([raw], "dropped.eml", { type: "message/rfc822" })];
    }
    if (!files.length) { toast.info("Couldn't read the dropped email. Drag it from the Outlook desktop app."); return; }
    setImporting(true);
    try {
      let last: FleetHistoryRecord | null = null;
      for (const f of files) {
        try { last = await importFleetHistoryEmail(scope, id, f); toast.success(`Imported: ${last.subject || "email"}`); }
        catch { toast.error(`Could not import ${f.name || "email"}`); }
      }
      await load();
      getFleetHistoryFilters(scope, id).then(setFilterOptions).catch(() => {});
      if (last) setSelectedId(last.id);
    } finally { setImporting(false); }
  };

  const createRecord = async (data: { correspondent?: string; handler?: string; subject?: string; details?: string; payload?: Record<string, unknown> }) => {
    if (!addType) return;
    try {
      const rec = await createFleetHistory(scope, id, { action_type: addType, ...data });
      toast.success("Record added.");
      setSelectedId(rec.id);
      await load();
      getFleetHistoryFilters(scope, id).then(setFilterOptions).catch(() => {});
    } catch {
      toast.error("Could not add the record.");
    }
  };

  return (
    <div className="flex flex-col w-full min-h-screen bg-white font-['Stack_Sans_Headline']">
      {loading && records.length === 0 && <Spinner />}
      {importing && <Spinner />}

      <header className="px-10 py-5 bg-white shadow-[0px_4px_20px_0px_rgba(0,0,0,0.08)] flex justify-between items-center gap-6 sticky top-0 z-20">
        <div className="flex flex-col gap-1 shrink-0">
          {onBack && (
            <button type="button" onClick={onBack} className="flex items-center gap-1 text-neutral-400 text-xs font-semibold hover:text-neutral-700">
              <ChevronLeft size={16} /> {backLabel || "Back"}
            </button>
          )}
          <h1 className="text-neutral-900 text-2xl font-semibold leading-6">History — {title}</h1>
        </div>
        {/* Add Record pills — in the header */}
        <div className="flex items-center gap-2 flex-wrap justify-end">
          {CREATE_ORDER.map((t) => (
            <button key={t} type="button" onClick={() => setAddType(t)} className="px-3 py-2 rounded-sm bg-neutral-900 text-white text-xs inline-flex items-center gap-1.5 hover:bg-black">
              <img src={ACTION_META[t].icon} alt="" className="w-4 h-4" style={{ filter: "brightness(0) invert(1)" }} />
              {ACTION_META[t].label}
            </button>
          ))}
        </div>
      </header>

      <div className="px-10 py-6 flex flex-col gap-5">
        {/* Search + filters — same widgets as the VM / Skyline listing. */}
        <div className="flex flex-wrap items-center gap-6">
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search history" className="w-[491px] max-w-full h-12 px-5 rounded bg-white border border-neutral-200 outline-none text-sm text-neutral-900 placeholder:text-neutral-400 font-light focus:border-neutral-400" />
          <FleetMultiSelectFilter
            label="Action Type"
            options={ALL_TYPES.map((t) => ({ value: t, label: `${ACTION_META[t].abbr} - ${ACTION_META[t].label}` }))}
            selected={actionTypes}
            onToggle={(v) => setActionTypes((prev) => (prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]))}
            onClear={() => setActionTypes([])}
          />
          <FleetMultiSelectFilter
            label="Correspondent"
            options={filterOptions.correspondents.map((c) => ({ value: c, label: c }))}
            selected={correspondents}
            onToggle={(v) => setCorrespondents((prev) => (prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]))}
            onClear={() => setCorrespondents([])}
          />
          <FleetMultiSelectFilter
            label="Handler"
            options={handlerOptions.map((h) => ({ value: h, label: h }))}
            selected={handlers}
            onToggle={(v) => setHandlers((prev) => (prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]))}
            onClear={() => setHandlers([])}
          />
          <div className="flex items-end gap-3 ml-auto">
            <div className="w-44"><FleetDateField label="Date From" value={dateFrom} onChange={setDateFrom} /></div>
            <div className="w-44"><FleetDateField label="Date To" value={dateTo} onChange={setDateTo} /></div>
            {(dateFrom || dateTo) && (
              <button type="button" onClick={() => { setDateFrom(""); setDateTo(""); }} className="h-12 text-neutral-400 hover:text-neutral-700 text-sm">Clear</button>
            )}
          </div>
        </div>

        {/* Body: list + detail (60/40) */}
        <div className="flex items-stretch gap-6">
          <div
            className={`grow-[3] min-w-0 basis-0 min-h-[calc(100vh-220px)] flex flex-col gap-3 relative rounded-lg transition ${dragOver ? "outline outline-2 outline-dashed outline-neutral-500" : ""}`}
            onDragOver={(e) => { e.preventDefault(); if (!dragOver) setDragOver(true); }}
            onDragLeave={(e) => { if (e.currentTarget === e.target) setDragOver(false); }}
            onDrop={handleDrop}
          >
            {dragOver && <div className="absolute inset-0 z-10 rounded-lg bg-neutral-100/85 flex items-center justify-center text-neutral-700 text-sm pointer-events-none">Drop the Outlook email (.eml / .msg) here</div>}
            {groups.length === 0
              ? (loading ? null : <div className="py-16 text-center text-sm text-neutral-400">No history records yet.</div>)
              : pageGroups.map((g) => <HistoryCard key={g.key} r={g.latest} threadCount={g.count} active={selectedGroup?.key === g.key} onClick={() => setSelectedId(g.latest.id)} />)}

            {groups.length > 0 && (
              <div className="sticky bottom-0 mt-auto bg-white border-t border-neutral-100 flex items-center justify-between flex-wrap gap-3 pt-3 pb-2">
                <div className="text-neutral-500 text-sm">
                  Showing {groups.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1} to {Math.min(page * PAGE_SIZE, groups.length)} of {groups.length} Entries
                </div>
                <div className="flex items-center gap-1">
                  <button type="button" disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="px-3 py-1.5 text-sm text-neutral-600 disabled:text-neutral-300 hover:text-black">Previous</button>
                  <span className="px-2 text-sm text-neutral-600">{page} / {totalPages}</span>
                  <button type="button" disabled={page === totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} className="px-3 py-1.5 text-sm text-neutral-900 disabled:text-neutral-300 hover:text-black">Next</button>
                </div>
              </div>
            )}
          </div>
          <RecordDetail r={selected} threadMessages={selectedGroup && selectedGroup.count > 1 ? selectedGroup.messages : undefined} onEmailAction={(mode, record) => setEmailModal({ mode, record })} />
        </div>
      </div>

      {addType && <AddRecordForm actionType={addType} onClose={() => setAddType(null)} onSubmit={createRecord} handlerOptions={handlerOptions} correspondentOptions={effectiveCorrOptions} defaultCorrespondent={effectiveCorrDefault} />}
      {emailModal && (
        <FleetEmailModal
          mode={emailModal.mode}
          record={emailModal.record}
          sending={emailSending}
          onClose={() => setEmailModal(null)}
          onSend={async (to, subject, comment, files) => {
            setEmailSending(true);
            try {
              if (emailModal.mode === "reply") {
                await fleetReplyEmail(scope, id, emailModal.record, comment, files, to, subject);
              } else {
                await fleetForwardEmail(scope, id, emailModal.record, to, subject, comment, files);
              }
              toast.success(emailModal.mode === "reply" ? "Reply sent." : "Email forwarded.");
              setEmailModal(null);
              await load();
            } catch {
              toast.error("Could not send the email. The mailbox may need send permission.");
            } finally {
              setEmailSending(false);
            }
          }}
        />
      )}
    </div>
  );
};

export default FleetHistory;
