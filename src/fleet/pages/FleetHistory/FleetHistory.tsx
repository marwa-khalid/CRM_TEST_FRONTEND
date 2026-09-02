import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useCurrentUser } from "../../../context/AuthContext";
import { ChevronLeft, Paperclip, ExternalLink, User, ChevronsLeft, ChevronsRight } from "lucide-react";
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
  type CorrespondentOption,
  getHistoryUsers,
  getScopeNotes,
  createScopeNote,
  replyScopeNote,
  editScopeNote,
  editScopeReply,
  deleteScopeNote,
  deleteScopeReply,
  type HistoryNote,
  type HistoryUser,
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

// Correspondent and Handler often resolve to the same person on emails (handler =
// the sender's name, correspondent = the sender's email), so don't show both.
const samePerson = (a?: string | null, b?: string | null): boolean => {
  if (!a || !b) return false;
  const x = a.trim().toLowerCase(), y = b.trim().toLowerCase();
  return x === y || x.split("@")[0] === y.split("@")[0];
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

// Strip the quoted reply history so each message in a thread shows only its own text.
const stripQuotedReply = (html = ""): string => {
  if (!html) return "";
  try {
    const doc = new DOMParser().parseFromString(html, "text/html");
    doc.querySelectorAll(".gmail_quote, .gmail_quote_container, blockquote, .moz-cite-prefix, .yahoo_quoted").forEach((el) => el.remove());
    doc.querySelectorAll('[id*="appendonsend"], [id*="divRplyFwdMsg"]').forEach((marker) => {
      let prev = marker.previousElementSibling;
      while (prev && prev.tagName === "HR") { const p = prev.previousElementSibling; prev.remove(); prev = p; }
      let node: ChildNode | null = marker;
      while (node) { const next = node.nextSibling; node.remove(); node = next; }
    });
    const out = doc.body.innerHTML.trim();
    return out || html;
  } catch {
    return html;
  }
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
  const showHandler = r.handler && !samePerson(r.correspondent, r.handler);
  return (
    <div className="flex flex-col gap-0.5 text-xs">
      {r.correspondent && <div className="text-neutral-500">Correspondent: <span className="text-neutral-700">{r.correspondent}</span></div>}
      {showHandler && <div className="text-neutral-500">Handler: <span className="text-neutral-700">{r.handler}</span></div>}
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

// VM listing card, styled like the claims Case Activity timeline: the action-type
// icon sits in a badge on a vertical line, with the record card attached to it.
// Same data/fields as HistoryCard — only the listing chrome differs.
const TimelineCard = ({ r, active, onClick, threadCount = 1 }: { r: FleetHistoryRecord; active: boolean; onClick: () => void; threadCount?: number }) => {
  const meta = r.action_type ? ACTION_META[r.action_type] : null;
  const doc = isDoc(r);
  const email = isEmail(r);
  const title = doc ? (attachmentsOf(r)[0]?.name || "Document") : "";
  // Emails show their subject in the grey box (like other records' details), not as a plain title.
  const body = doc ? "" : email ? (r.subject || "(No subject)") : (r.details || "");
  // One person on the card (correspondent, else handler) — like the Case Activity
  // timeline. Showing both looked like a duplicate (same icon, near-same value).
  const person = r.correspondent || r.handler || "";
  return (
    <div className="relative group">
      {/* Action icon badge, attached to the line to the card's left. */}
      <div className={`absolute -left-[53px] top-2 w-10 h-10 flex items-center justify-center rounded-md border shadow-sm ${active ? "bg-neutral-900 border-neutral-900" : "bg-neutral-50 border-neutral-200"}`}>
        {meta && <img src={meta.icon} alt="" className="w-5 h-5 object-contain" style={{ filter: active ? "brightness(0) invert(1)" : "brightness(0)" }} />}
      </div>
      <button
        type="button"
        onClick={onClick}
        className={`w-full text-left bg-white border rounded-lg p-4 shadow-sm transition-all flex flex-col ${active ? "border-neutral-400 shadow-md" : "border-neutral-200 hover:shadow-md hover:border-neutral-300"}`}
      >
        {/* Top row: action label chip + title, timestamp on the right. */}
        <div className="flex justify-between items-start gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {meta && <span className="shrink-0 px-2 py-1 bg-neutral-100 rounded text-xs font-weight-600 text-neutral-700">{meta.label}</span>}
            {doc ? (
              <span className="inline-flex items-center gap-2 min-w-0">
                <img src={fileTypeLogo(title)} alt="" className="w-4 h-4 shrink-0 object-contain" />
                <span className="text-black text-base font-semibold truncate">{title}</span>
              </span>
            ) : title ? (
              <h3 className="text-black text-base font-semibold truncate">{title}</h3>
            ) : null}
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {threadCount > 1 && (
              <span title={`${threadCount} messages in this thread`} className="px-2 py-0.5 rounded-full bg-neutral-900 text-white text-xs font-semibold">{threadCount}</span>
            )}
            {!doc && threadCount <= 1 && <AttachmentClip count={attachmentsOf(r).length} />}
            <span className="text-gray-400 text-sm font-light whitespace-nowrap">{fmtPosted(r.posted_at)}</span>
          </div>
        </div>

        {/* Details box (calls / notes / diary / movement). */}
        {body && (
          <div className="mt-3 bg-neutral-100 rounded-lg p-3 text-sm text-neutral-700 whitespace-pre-line line-clamp-3">{body}</div>
        )}

        {/* One person — no Correspondent/Handler labels. */}
        {person && (
          <div className="mt-3 flex items-center gap-1.5 text-neutral-600 text-xs">
            <User size={12} className="text-neutral-400" />{person}
          </div>
        )}
      </button>
    </div>
  );
};

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
      {atts.length > 1 ? (
        <div className="flex items-center gap-3 flex-wrap">
          {atts.map((a, i) => (
            <button key={i} type="button" onClick={() => setSel(i)}
              className={`inline-flex items-center gap-1.5 text-sm rounded-sm ${i === sel ? "px-4 py-1 bg-neutral-900 text-white" : "text-neutral-700 hover:underline"}`}>
              <img src={fileTypeLogo(a.name)} alt="" className={`w-4 h-4 shrink-0 object-contain ${i === sel ? "brightness-0 invert" : ""}`} />
              {a.name}
            </button>
          ))}
        </div>
      ) : (
        <div className="inline-flex items-center gap-2 text-sm font-semibold text-neutral-800">
          <img src={fileTypeLogo(cur.name)} alt="" className="w-4 h-4 shrink-0 object-contain" />
          {cur.name}
        </div>
      )}
      <AttachmentPreview recordId={cur.recordId} index={cur.index} name={cur.name} url={cur.url} />
    </div>
  );
};

// ── History notes (threaded comments + @-mention tagging) ────────────────────
// The same feature as the claim-side Case History notes, so all three history
// screens match. Kept self-contained in fleet (talks to the backend via fleetApi).
const activityRefFor = (r: FleetHistoryRecord): string => {
  const mid = (r.payload as { message_id?: string } | null)?.message_id;
  const raw = String((typeof r.id === "string" && mid) ? mid : r.id);
  return `chist-${raw.replace(/[^A-Za-z0-9]/g, "")}`;
};
const noteInitials = (name?: string): string => {
  const parts = (name || "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "U";
  return ((parts[0][0] || "") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
};
const renderNoteText = (html?: string) => {
  const clean = sanitizeEmailHtml(html || "");
  try {
    const doc = new DOMParser().parseFromString(clean, "text/html");
    const walk = (el: Node) => {
      [...el.childNodes].forEach((c) => {
        if (c.nodeType === 3) {
          const t = c.textContent || "";
          if (/@[A-Za-z0-9._-]+/.test(t)) {
            const span = doc.createElement("span");
            span.innerHTML = t.replace(/@([A-Za-z0-9._-]+)/g, '<span class="text-neutral-900 font-semibold">@$1</span>');
            c.parentNode?.replaceChild(span, c);
          }
        } else if (c.nodeType === 1) walk(c);
      });
    };
    walk(doc.body);
    return { __html: doc.body.innerHTML };
  } catch {
    return { __html: clean };
  }
};
const NoteMentionBox = ({ value, onChange, users, placeholder, autoFocus }: { value: string; onChange: (v: string) => void; users: HistoryUser[]; placeholder: string; autoFocus?: boolean }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [mention, setMention] = useState<{ open: boolean; query: string }>({ open: false, query: "" });
  const matches = mention.open
    ? users.filter((u) => (u.name || "").toLowerCase().includes(mention.query.toLowerCase()) || (u.email || "").toLowerCase().includes(mention.query.toLowerCase())).slice(0, 6)
    : [];
  useEffect(() => { if (ref.current && ref.current.innerHTML !== (value || "")) ref.current.innerHTML = value || ""; }, [value]);
  useEffect(() => { if (autoFocus) ref.current?.focus(); }, [autoFocus]);
  const emit = () => { const el = ref.current; onChange(el && (el.textContent || "").trim() ? el.innerHTML : ""); };
  const exec = (cmd: string) => { ref.current?.focus(); try { document.execCommand(cmd, false); } catch { /* ignore */ } emit(); };
  const detect = () => {
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount || !sel.anchorNode) { setMention({ open: false, query: "" }); return; }
    const m = (sel.anchorNode.textContent || "").slice(0, sel.anchorOffset).match(/@([A-Za-z0-9._-]*)$/);
    setMention(m ? { open: true, query: m[1] } : { open: false, query: "" });
  };
  const pick = (u: HistoryUser) => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount && sel.anchorNode && sel.anchorNode.nodeType === 3) {
      const node = sel.anchorNode; const off = sel.anchorOffset; const full = node.textContent || "";
      const m = full.slice(0, off).match(/@([A-Za-z0-9._-]*)$/);
      if (m) {
        const start = off - m[0].length;
        node.textContent = full.slice(0, start) + `@${u.name} ` + full.slice(off);
        const range = document.createRange();
        range.setStart(node, start + `@${u.name} `.length); range.collapse(true);
        sel.removeAllRanges(); sel.addRange(range);
      }
    }
    setMention({ open: false, query: "" }); emit(); ref.current?.focus();
  };
  return (
    <div className="relative">
      <div className="flex items-center gap-1 px-2 py-1 rounded-t border border-b-0 border-neutral-200 bg-neutral-50">
        {([
          { cmd: "bold", label: "B", cls: "font-bold" },
          { cmd: "italic", label: "I", cls: "italic font-serif" },
          { cmd: "underline", label: "U", cls: "underline" },
          { cmd: "insertUnorderedList", label: "•", cls: "text-lg leading-none" },
        ] as const).map((b) => (
          <button key={b.cmd} type="button" onMouseDown={(e) => { e.preventDefault(); exec(b.cmd); }}
            className={`w-6 h-6 rounded text-xs text-neutral-600 hover:bg-neutral-200 flex items-center justify-center ${b.cls}`}>{b.label}</button>
        ))}
      </div>
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onInput={() => { emit(); detect(); }}
        onKeyUp={detect}
        data-ph={placeholder}
        className="min-h-[60px] w-full px-3 py-2 text-sm rounded-b border border-neutral-200 focus:outline-none focus:border-neutral-500 overflow-auto empty:before:content-[attr(data-ph)] empty:before:text-neutral-300"
      />
      {matches.length > 0 && (
        <div className="absolute z-40 left-0 right-0 bottom-full mb-1 max-h-52 overflow-auto bg-white rounded-lg border border-neutral-200 shadow-xl">
          {matches.map((u) => (
            <button key={u.email || u.name} type="button" onMouseDown={(e) => { e.preventDefault(); pick(u); }} className="w-full text-left px-3 py-2 hover:bg-neutral-50 flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-full bg-neutral-200 text-neutral-700 text-xs font-semibold flex items-center justify-center shrink-0">{noteInitials(u.name)}</span>
              <span className="min-w-0"><span className="block text-sm text-neutral-800 truncate">{u.name}</span><span className="block text-xs text-neutral-400 truncate">{u.email}</span></span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
const NoteMenu = ({ children }: { children: ReactNode }) => (
  <div className="relative shrink-0">
    <button type="button" className="peer w-6 h-6 rounded text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 text-lg leading-none flex items-center justify-center">⋮</button>
    <div className="hidden peer-hover:flex hover:flex absolute right-0 top-full z-30 flex-col bg-white rounded shadow-[0px_4px_16px_0px_rgba(0,0,0,0.12)] border border-neutral-100 py-1 min-w-[120px]">{children}</div>
  </div>
);
const noteMenuItem = "px-3 py-1.5 text-left text-sm hover:bg-neutral-50 whitespace-nowrap";

const FleetNotes = ({ scope, id, activityRef }: { scope: FleetHistoryScope; id: number | string; activityRef: string }) => {
  const { user } = useCurrentUser();
  const [notes, setNotes] = useState<HistoryNote[]>([]);
  const [users, setUsers] = useState<HistoryUser[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyText, setReplyText] = useState("");
  const [editNoteId, setEditNoteId] = useState<number | null>(null);
  const [editNoteText, setEditNoteText] = useState("");
  const [editReplyId, setEditReplyId] = useState<number | null>(null);
  const [editReplyText, setEditReplyText] = useState("");
  const load = useCallback(() => {
    setLoading(true);
    getScopeNotes(activityRef).then(setNotes).catch(() => setNotes([])).finally(() => setLoading(false));
  }, [activityRef]);
  useEffect(() => { load(); setReplyingTo(null); setText(""); setEditNoteId(null); setEditReplyId(null); }, [load]);
  useEffect(() => { getHistoryUsers().then(setUsers).catch(() => {}); }, []);
  const mine = (uid?: number) => user?.id != null && uid != null && Number(uid) === Number(user.id);
  const run = async (fn: () => Promise<unknown>, err: string) => {
    setBusy(true);
    try { await fn(); load(); } catch { toast.error(err); } finally { setBusy(false); }
  };
  const addNote = () => text.trim() && run(async () => { await createScopeNote(scope, id, activityRef, text.trim()); setText(""); }, "Could not add the note.");
  const sendReply = (nid: number) => replyText.trim() && run(async () => { await replyScopeNote(nid, replyText.trim()); setReplyText(""); setReplyingTo(null); }, "Could not post the reply.");
  const saveNote = (nid: number) => editNoteText.trim() && run(async () => { await editScopeNote(nid, editNoteText.trim()); setEditNoteId(null); }, "Could not update the note.");
  const saveReply = (rid: number) => editReplyText.trim() && run(async () => { await editScopeReply(rid, editReplyText.trim()); setEditReplyId(null); }, "Could not update the reply.");
  const delNote = (nid: number) => window.confirm("Delete this note?") && run(() => deleteScopeNote(nid), "Could not delete the note.");
  const delReply = (rid: number) => window.confirm("Delete this reply?") && run(() => deleteScopeReply(rid), "Could not delete the reply.");
  const btn = "px-4 py-1.5 rounded-sm bg-neutral-900 text-white text-xs font-semibold hover:bg-black disabled:opacity-50";
  const cancel = "px-3 py-1.5 rounded-sm text-neutral-500 text-xs hover:bg-neutral-100";

  return (
    <div className="mt-5 pt-4 border-t border-neutral-200 flex flex-col gap-3">
      {busy && <Spinner />}
      <div className="flex items-center gap-2">
        <div className="text-neutral-800 text-sm font-semibold">Notes</div>
        {loading && <span className="w-3.5 h-3.5 rounded-full border-2 border-neutral-300 border-t-neutral-500 animate-spin" />}
      </div>
      <NoteMentionBox value={text} onChange={setText} users={users} placeholder="Add a note… type @ to tag someone" />
      <div className="flex justify-end"><button type="button" onClick={addNote} disabled={busy || !text.trim()} className={btn}>Add Note</button></div>
      {notes.map((n) => (
        <div key={n.id} className="rounded-sm outline outline-1 -outline-offset-1 outline-neutral-200 p-3 flex flex-col gap-2">
          <div className="flex justify-between items-center gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-7 h-7 rounded-full bg-neutral-200 text-neutral-700 text-xs font-semibold flex items-center justify-center shrink-0">{noteInitials(n.createdByName)}</span>
              <div className="min-w-0">
                <div className="text-sm text-black font-semibold truncate">{n.createdByName || "User"}</div>
                {n.createdByRole && <div className="text-xs text-neutral-500 truncate">{n.createdByRole}</div>}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs text-neutral-400 whitespace-nowrap">{fmtPosted(n.createdAt)}</span>
              {editNoteId !== n.id && (
                <NoteMenu>
                  <button type="button" onClick={() => { setReplyingTo(replyingTo === n.id ? null : n.id); setReplyText(""); }} className={`${noteMenuItem} text-neutral-800`}>Reply</button>
                  {mine(n.createdById) && <button type="button" onClick={() => { setEditNoteId(n.id); setEditNoteText(n.text || ""); }} className={`${noteMenuItem} text-neutral-700`}>Edit</button>}
                  {mine(n.createdById) && <button type="button" onClick={() => delNote(n.id)} className={`${noteMenuItem} text-red-500`}>Delete</button>}
                </NoteMenu>
              )}
            </div>
          </div>
          {editNoteId === n.id ? (
            <div className="flex flex-col gap-2">
              <NoteMentionBox value={editNoteText} onChange={setEditNoteText} users={users} placeholder="Edit note" autoFocus />
              <div className="flex justify-end gap-2"><button type="button" onClick={() => setEditNoteId(null)} className={cancel}>Cancel</button><button type="button" onClick={() => saveNote(n.id)} disabled={busy} className={btn}>Save</button></div>
            </div>
          ) : (
            <div className="text-sm text-neutral-700 leading-relaxed" dangerouslySetInnerHTML={renderNoteText(n.text)} />
          )}
          {(n.replies || []).map((rp) => (
            <div key={rp.id} className="ml-4 pl-3 border-l-2 border-neutral-100 flex flex-col gap-1">
              <div className="flex justify-between items-center gap-3">
                <span className="text-xs text-black font-semibold truncate">{rp.createdByName || "User"}</span>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-neutral-400 whitespace-nowrap">{fmtPosted(rp.createdAt)}</span>
                  {mine(rp.createdById) && editReplyId !== rp.id && (
                    <NoteMenu>
                      <button type="button" onClick={() => { setEditReplyId(rp.id); setEditReplyText(rp.text || ""); }} className={`${noteMenuItem} text-neutral-700`}>Edit</button>
                      <button type="button" onClick={() => delReply(rp.id)} className={`${noteMenuItem} text-red-500`}>Delete</button>
                    </NoteMenu>
                  )}
                </div>
              </div>
              {editReplyId === rp.id ? (
                <div className="flex flex-col gap-2">
                  <NoteMentionBox value={editReplyText} onChange={setEditReplyText} users={users} placeholder="Edit reply" autoFocus />
                  <div className="flex justify-end gap-2"><button type="button" onClick={() => setEditReplyId(null)} className={cancel}>Cancel</button><button type="button" onClick={() => saveReply(rp.id)} disabled={busy} className={btn}>Save</button></div>
                </div>
              ) : (
                <div className="text-sm text-neutral-700 leading-relaxed" dangerouslySetInnerHTML={renderNoteText(rp.text)} />
              )}
            </div>
          ))}
          {replyingTo === n.id && (
            <div className="ml-4 flex flex-col gap-2">
              <NoteMentionBox value={replyText} onChange={setReplyText} users={users} placeholder="Write a reply… @ to tag" autoFocus />
              <div className="flex justify-end gap-2"><button type="button" onClick={() => { setReplyingTo(null); setReplyText(""); }} className={cancel}>Cancel</button><button type="button" onClick={() => sendReply(n.id)} disabled={busy || !replyText.trim()} className={btn}>Reply</button></div>
            </div>
          )}
        </div>
      ))}
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

const RecordDetail = ({ r, scope, id, threadMessages, onEmailAction }: { r: FleetHistoryRecord | null; scope: FleetHistoryScope; id: number | string; threadMessages?: FleetHistoryRecord[]; onEmailAction?: (mode: "reply" | "forward", rec: FleetHistoryRecord) => void }) => {
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

  const shell = "grow-[2] min-w-0 basis-0 min-h-0 h-full overflow-y-auto scrollbar-hide px-10 py-6 bg-white rounded-sm outline outline-1 -outline-offset-1 outline-neutral-300 flex flex-col gap-4";
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
        {/* Header row: tabs on the left, Reply / Forward (latest message) on the right. */}
        <div className="flex justify-between items-center gap-3">
          {threadAtts.length > 0 ? (
            <div className="flex items-start gap-6">
              <button type="button" onClick={() => setThreadTab("record")} className={`pb-2 text-sm leading-4 border-b ${threadTab === "record" ? "text-neutral-900 border-neutral-900" : "text-neutral-500 border-transparent"}`}>Email Details</button>
              <button type="button" onClick={() => setThreadTab("attachments")} className={`pb-2 text-sm leading-4 border-b ${threadTab === "attachments" ? "text-neutral-900 border-neutral-900" : "text-neutral-500 border-transparent"}`}>Attachments</button>
            </div>
          ) : (
            <div className="text-black text-xl font-semibold">Record Detail</div>
          )}
          <div className="flex items-center gap-2 shrink-0">
            {threadMessages[0] && <ReplyForward r={threadMessages[0]} onEmailAction={onEmailAction} />}
          </div>
        </div>
        <div className="h-px bg-neutral-200 w-full" />
        {threadAtts.length > 0 && threadTab === "attachments" ? (
          <AttachmentTabs atts={threadAtts} />
        ) : (
          <>
          <div className="flex flex-col">
            {threadMessages.map((m, i) => {
              const p = (m.payload as { from_name?: string; from_email?: string; to?: string[] } | null) || {};
              const from = p.from_name && p.from_email ? `${p.from_name} <${p.from_email}>` : (p.from_name || p.from_email || m.correspondent || "—");
              const to = Array.isArray(p.to) ? p.to.filter(Boolean).join(", ") : "";
              const bodyHtml = (m.payload as { body_html?: string } | null)?.body_html;
              return (
                <div key={String(m.id)} className={`py-4 ${i > 0 ? "border-t border-neutral-200" : "pt-0"}`}>
                  {/* Details, then body — one after another down the thread. */}
                  <div className="flex flex-col gap-0.5 text-sm">
                    <div><span className="text-neutral-500">From: </span><span className="text-neutral-800">{from}</span></div>
                    {to && <div><span className="text-neutral-500">To: </span><span className="text-neutral-800">{to}</span></div>}
                    {m.subject && <div><span className="text-neutral-500">Subject: </span><span className="text-neutral-800">{m.subject}</span></div>}
                    {m.correspondent && <div><span className="text-neutral-500">Correspondent: </span><span className="text-neutral-800">{m.correspondent}</span></div>}
                    {m.handler && !samePerson(m.correspondent, m.handler) && <div><span className="text-neutral-500">Handler: </span><span className="text-neutral-800">{m.handler}</span></div>}
                    <div className="text-xs text-neutral-400 pt-0.5">{fmtPosted(m.posted_at)}</div>
                  </div>
                  <div className="mt-3 text-sm text-neutral-700 leading-relaxed">
                    {bodyHtml
                      ? <div className="[&_img]:max-w-full [&_img]:h-auto [&_a]:text-neutral-900 [&_a]:underline"
                          dangerouslySetInnerHTML={{ __html: sanitizeEmailHtml(stripQuotedReply(bodyHtml || "")) }} />
                      : <div className="whitespace-pre-wrap">{isEmail(m) ? emailBodyText(m) : (m.details || "—")}</div>}
                  </div>
                </div>
              );
            })}
          </div>
          {threadMessages[0] && <FleetNotes scope={scope} id={id} activityRef={activityRefFor(threadMessages[0])} />}
          </>
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
              {r.handler && !samePerson(r.correspondent, r.handler) && <span>Handler: <span className="text-neutral-700">{r.handler}</span></span>}
            </div>
          )}
          {r.subject && <div className="text-neutral-700 text-sm">Subject : <span className="font-semibold">{r.subject}</span></div>}
          <div className="pt-2.5 border-t border-neutral-200 min-h-28">
            {isEmail(r) && (r.payload as { body_html?: string } | null)?.body_html
              ? <div className="text-sm text-neutral-700 leading-relaxed [&_img]:max-w-full [&_img]:h-auto [&_a]:text-neutral-900 [&_a]:underline"
                  dangerouslySetInnerHTML={{ __html: sanitizeEmailHtml(stripQuotedReply((r.payload as { body_html?: string }).body_html || "")) }} />
              : <div className="text-neutral-700 text-sm whitespace-pre-wrap">{isEmail(r) ? emailBodyText(r) : (r.details || "—")}</div>}
          </div>
          <FleetNotes scope={scope} id={id} activityRef={activityRefFor(r)} />
        </>
      )}
      {/* Attachments tab: file-name line-tabs (2+) + the selected attachment's preview. */}
      {hasAtts && threadTab === "attachments" && (
        <AttachmentTabs atts={singleAtts} />
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
  correspondentOptions?: CorrespondentOption[];
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
            options={correspondentOptions}
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
              <textarea value={details} onChange={(e) => handleDetailsChange(e.target.value)} rows={6} placeholder="Write the details… type @ to tag someone" className={`${inputCls} resize-none`} />
              {mention.open && mentionMatches.length > 0 && (
                <div className="absolute z-50 left-0 right-0 bottom-full mb-1 max-h-56 overflow-auto bg-white border border-neutral-200 rounded-lg shadow-xl">
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
  const [corrOptions, setCorrOptions] = useState<CorrespondentOption[]>([]);
  const [corrDefault, setCorrDefault] = useState<string>("");
  const [filterOptions, setFilterOptions] = useState<FleetHistoryFilterOptions>({ correspondents: [], handlers: [], action_types: [] });
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [selectedId, setSelectedId] = useState<number | string | null>(null);
  const [emailModal, setEmailModal] = useState<{ mode: "reply" | "forward"; record: FleetHistoryRecord } | null>(null);
  const [addType, setAddType] = useState<CaseHistoryActionType | null>(null);
  const [page, setPage] = useState(1);
  // Expand the detail pane to full width (hides the listing) to read a whole document wide.
  const [expanded, setExpanded] = useState(false);

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
    // One thread per Outlook conversation (its conversationId); if that's missing,
    // fall back to the normalized subject. Non-email records stay standalone.
    const threadKey = (r: FleetHistoryRecord) => {
      const cid = (r.payload as { conversation_id?: string } | null)?.conversation_id;
      if (cid) return `conv:${cid}`;
      const subj = (r.subject || "")
        .replace(/^(?:\s*(re|fw|fwd|aw|wg)\s*:\s*)+/i, "").replace(/\s+/g, " ").trim().toLowerCase();
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
      .sort((a, b) => timeOf(b.latest) - timeOf(a.latest));
  }, [merged]);

  useEffect(() => { if (merged.length && !merged.some((r) => r.id === selectedId)) setSelectedId(merged[0].id); }, [merged, selectedId]);
  useEffect(() => { setPage(1); }, [search, actionTypes, correspondents, handlers, dateFrom, dateTo]);

  const selected = merged.find((r) => r.id === selectedId) || null;
  const selectedGroup = groups.find((g) => g.messages.some((m) => m.id === selectedId)) || null;
  const totalPages = Math.max(1, Math.ceil(groups.length / PAGE_SIZE));
  const pageGroups = groups.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const startIdx = groups.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const endIdx = Math.min(page * PAGE_SIZE, groups.length);
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
  // Vehicle Management gets the Case Activity timeline listing; fleet hire keeps cards.
  const isVM = scope === "vm_cams" || scope === "vm_skyline";

  // Every handler is available — not just those already on a record.
  const handlerOptions = Array.from(new Set([...allHandlers, ...filterOptions.handlers]));
  // Correspondent default + options: VM-CAMS gives the claim's client email (default)
  // + Third Party emails; Skyline/fleet give the hirer's driver email (correspondentName).
  const effectiveCorrDefault = corrDefault || correspondentName || "";
  const effectiveCorrOptions: CorrespondentOption[] = corrOptions.length
    ? corrOptions
    : (correspondentName ? [{ label: correspondentName, value: correspondentName }] : []);

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
      // Refresh first, THEN select — otherwise the "default to newest" effect
      // clobbers the selection because the new record isn't in the list yet.
      await load();
      setSelectedId(rec.id);
      setPage(1); // the new record is newest → page 1, so it's visible
      getFleetHistoryFilters(scope, id).then(setFilterOptions).catch(() => {});
    } catch {
      toast.error("Could not add the record.");
    }
  };

  return (
    <div className="flex flex-col w-full h-screen overflow-hidden bg-white font-['Stack_Sans_Headline']">
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

      <div className="px-10 py-6 flex flex-col gap-5 flex-1 min-h-0">
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
        <div className="relative flex items-stretch gap-6 flex-1 min-h-0">
          {/* Expand handle in the detail pane's top-right corner: widen to full width and back. */}
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            title={expanded ? "Show listing" : "Expand document view"}
            className="absolute top-2 right-2 z-30 w-7 h-7 rounded bg-white border border-neutral-200 shadow-sm flex items-center justify-center text-neutral-500 hover:text-neutral-900 hover:border-neutral-400"
          >
            {expanded ? <ChevronsRight size={15} /> : <ChevronsLeft size={15} />}
          </button>
          <div
            className={`${expanded ? "hidden" : ""} grow-[3] min-w-0 basis-0 min-h-0 h-full overflow-y-auto scrollbar-hide flex flex-col gap-3 relative rounded-lg transition ${dragOver ? "outline outline-2 outline-dashed outline-neutral-500" : ""}`}
            onDragOver={(e) => { e.preventDefault(); if (!dragOver) setDragOver(true); }}
            onDragLeave={(e) => { if (e.currentTarget === e.target) setDragOver(false); }}
            onDrop={handleDrop}
          >
            {dragOver && <div className="absolute inset-0 z-10 rounded-lg bg-neutral-100/85 flex items-center justify-center text-neutral-700 text-sm pointer-events-none">Drop the Outlook email (.eml / .msg) here</div>}
            {groups.length === 0
              ? (loading ? null : <div className="py-16 text-center text-sm text-neutral-400">No history records yet.</div>)
              : isVM ? (
                <div className="relative border-l border-neutral-200 ml-4 pl-10 space-y-6">
                  {pageGroups.map((g) => <TimelineCard key={g.key} r={g.latest} threadCount={g.count} active={selectedGroup?.key === g.key} onClick={() => setSelectedId(g.latest.id)} />)}
                </div>
              ) : pageGroups.map((g) => <HistoryCard key={g.key} r={g.latest} threadCount={g.count} active={selectedGroup?.key === g.key} onClick={() => setSelectedId(g.latest.id)} />)}

            {groups.length > 0 && (
              <div className="mt-2 border-t border-neutral-100 flex items-center justify-between flex-wrap gap-3 pt-3 pb-2">
                <div className="text-neutral-500 text-sm">
                  Showing <span className="font-semibold text-neutral-700">{startIdx}</span> to{" "}
                  <span className="font-semibold text-neutral-700">{endIdx}</span> of{" "}
                  <span className="font-semibold text-neutral-700">{groups.length}</span> Entries
                </div>
                <div className="flex items-center gap-1">
                  <button type="button" disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="px-3 py-1.5 text-sm text-neutral-600 disabled:text-neutral-300 hover:text-black">Previous</button>
                  {pageNumbers.map((n, i) =>
                    n === "..." ? (
                      <span key={`e${i}`} className="px-2 text-neutral-400">…</span>
                    ) : (
                      <button key={n} type="button" onClick={() => setPage(n)}
                        className={`w-8 h-8 rounded text-sm ${page === n ? "bg-neutral-900 text-white font-semibold" : "text-neutral-600 hover:bg-neutral-50"}`}>
                        {n}
                      </button>
                    ),
                  )}
                  <button type="button" disabled={page === totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className="px-3 py-1.5 text-sm text-neutral-900 disabled:text-neutral-300 hover:text-black">Next</button>
                </div>
              </div>
            )}
          </div>
          <RecordDetail r={selected} scope={scope} id={id} threadMessages={selectedGroup && selectedGroup.count > 1 ? selectedGroup.messages : undefined} onEmailAction={(mode, record) => setEmailModal({ mode, record })} />
        </div>
      </div>

      {addType && <AddRecordForm actionType={addType} onClose={() => setAddType(null)} onSubmit={createRecord} handlerOptions={handlerOptions} correspondentOptions={effectiveCorrOptions} defaultCorrespondent={effectiveCorrDefault} />}
      {emailModal && (
        <FleetEmailModal
          open
          onClose={() => setEmailModal(null)}
          hireId={null}
          title={emailModal.mode === "reply" ? "Reply" : "Forward"}
          defaultTo={emailModal.mode === "reply" ? (emailModal.record.correspondent || "") : ""}
          defaultSubject={(emailModal.mode === "reply" ? "Re: " : "Fwd: ")
            + (emailModal.record.subject || "").replace(/^(?:\s*(re|fw|fwd)\s*:\s*)+/i, "").trim()}
          allowAttachments
          onSent={() => load()}
          sendOverride={async ({ to, subject, body, files }) => {
            if (emailModal.mode === "reply") {
              await fleetReplyEmail(scope, id, emailModal.record, body, files, to, subject);
            } else {
              await fleetForwardEmail(scope, id, emailModal.record, to, subject, body, files);
            }
            return { status: "sent" };
          }}
        />
      )}
    </div>
  );
};

export default FleetHistory;
