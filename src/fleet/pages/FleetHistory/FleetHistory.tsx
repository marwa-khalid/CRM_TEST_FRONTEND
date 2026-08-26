import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, Paperclip, ExternalLink } from "lucide-react";
import { toast } from "react-toastify";
import FleetMultiSelectFilter from "../../components/FleetMultiSelectFilter";
import PdfLogo from "../../../assets/FileTypes/PDF.svg";
import DocLogo from "../../../assets/FileTypes/DOC.svg";
import ExcelLogo from "../../../assets/FileTypes/Excel.svg";
import CsvLogo from "../../../assets/FileTypes/CSV.svg";
import PptLogo from "../../../assets/FileTypes/PPT.svg";
import PngLogo from "../../../assets/FileTypes/PNG.svg";
import {
  getFleetHistory,
  getFleetHistoryFilters,
  getFleetHistoryEmails,
  createFleetHistory,
  importFleetHistoryEmail,
  openFleetAttachment,
  fetchFleetAttachment,
  type FleetHistoryScope,
  type FleetHistoryRecord,
  type FleetHistoryFilterOptions,
  type FleetHistoryAttachment,
  type CaseHistoryActionType,
} from "../../services/fleetHistory";

// ── Action-type presentation (abbreviation + label) ──────────────────────────
const ACTION_META: Record<CaseHistoryActionType, { abbr: string; label: string }> = {
  send_letter: { abbr: "SL", label: "Send Letter" },
  send_email: { abbr: "SE", label: "Send Email" },
  incoming_email: { abbr: "IE", label: "Incoming Email" },
  incoming_call: { abbr: "IC", label: "Incoming Call" },
  outgoing_call: { abbr: "OC", label: "Outgoing Call" },
  note: { abbr: "NT", label: "Notes" },
  diary: { abbr: "DY", label: "Diary" },
};
const CREATE_ORDER: CaseHistoryActionType[] = [
  "send_letter", "send_email", "incoming_call", "outgoing_call", "note", "diary",
];
const ALL_TYPES: CaseHistoryActionType[] = [
  "send_letter", "send_email", "incoming_email", "incoming_call", "outgoing_call", "note", "diary",
];

const PAGE_SIZE = 10;

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

// ── History card ─────────────────────────────────────────────────────────────
const HistoryCard = ({ r, active, onClick }: { r: FleetHistoryRecord; active: boolean; onClick: () => void }) => {
  const meta = r.action_type ? ACTION_META[r.action_type] : null;
  const atts = attachmentsOf(r).length;
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left p-5 rounded-lg outline outline-1 -outline-offset-1 transition ${active ? "bg-neutral-50 outline-neutral-300" : "bg-transparent outline-neutral-100 hover:outline-neutral-200"}`}
    >
      <div className="flex justify-between items-center gap-3">
        <span className="text-sm text-neutral-500">{fmtPosted(r.posted_at)}</span>
        <span className="flex items-center gap-2 shrink-0">
          {atts > 0 && (
            <span className="inline-flex items-center gap-1 text-neutral-400 text-xs">
              <Paperclip className="w-3.5 h-3.5" />{atts}
            </span>
          )}
          {meta && (
            <span className="px-3 py-1.5 bg-neutral-900 rounded-sm text-white text-xs" title={meta.label}>{meta.abbr}</span>
          )}
        </span>
      </div>
      {(r.correspondent || r.handler) && (
        <div className="mt-2 text-xs text-neutral-500 flex flex-wrap gap-x-4">
          {r.correspondent && <span>Correspondent: <span className="text-neutral-700">{r.correspondent}</span></span>}
          {r.handler && <span>Handler: <span className="text-neutral-700">{r.handler}</span></span>}
        </div>
      )}
      <div className={`mt-2 text-neutral-700 text-sm ${isEmail(r) ? "truncate" : ""}`}>
        {isEmail(r) ? (r.subject || "(No subject)") : (r.details || "—")}
      </div>
    </button>
  );
};

// ── Detail pane ──────────────────────────────────────────────────────────────
const RecordDetail = ({ r }: { r: FleetHistoryRecord | null }) => {
  const [preview, setPreview] = useState<{ url: string; type: string; name: string } | null>(null);
  const [loadingIdx, setLoadingIdx] = useState<number | null>(null);
  const rid = r?.id;
  useEffect(() => { setPreview(null); }, [rid]);
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview.url); }, [preview]);

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

  const shell = "flex-1 min-w-0 basis-0 min-h-[calc(100vh-220px)] px-8 py-6 bg-white rounded-lg outline outline-1 -outline-offset-1 outline-neutral-300 flex flex-col gap-4";
  if (!r) {
    return (
      <div className={shell}>
        <div className="text-black text-xl font-semibold">Record Detail</div>
        <div className="h-px bg-neutral-200 w-full" />
        <div className="flex-1 flex items-center justify-center text-sm text-neutral-400">Select a record to preview its details.</div>
      </div>
    );
  }
  const meta = r.action_type ? ACTION_META[r.action_type] : null;
  return (
    <div className={shell}>
      {loadingIdx !== null && <Spinner />}
      <div className="flex justify-between items-center gap-3">
        <div className="text-black text-xl font-semibold">Record Detail</div>
        <div className="flex items-center gap-2 shrink-0">
          {attachmentsOf(r).length > 0 && (
            <span className="inline-flex items-center gap-1 text-neutral-400 text-xs"><Paperclip className="w-4 h-4" />{attachmentsOf(r).length}</span>
          )}
          {meta && <span className="px-4 py-2 bg-neutral-900 rounded-sm text-white text-xs" title={meta.label}>{meta.abbr}</span>}
        </div>
      </div>
      <div className="h-px bg-neutral-200 w-full" />
      <div className="text-sm"><span className="text-neutral-500">Posted: </span><span className="text-neutral-700">{fmtPosted(r.posted_at)}</span></div>
      {(r.correspondent || r.handler) && (
        <div className="text-sm text-neutral-500 flex flex-wrap gap-x-6 gap-y-1">
          {r.correspondent && <span>Correspondent: <span className="text-neutral-700">{r.correspondent}</span></span>}
          {r.handler && <span>Handler: <span className="text-neutral-700">{r.handler}</span></span>}
        </div>
      )}
      {!isDoc(r) && r.subject && <div className="text-neutral-700 text-sm">Subject : <span className="font-semibold">{r.subject}</span></div>}
      {!isDoc(r) && (
        <div className="pt-2.5 border-t border-neutral-200 min-h-28">
          {isEmail(r) && (r.payload as { body_html?: string } | null)?.body_html
            ? <div className="text-sm text-neutral-700 leading-relaxed break-words overflow-x-auto [&_img]:max-w-full [&_table]:max-w-full [&_a]:text-neutral-900 [&_a]:underline"
                dangerouslySetInnerHTML={{ __html: sanitizeEmailHtml((r.payload as { body_html?: string }).body_html || "") }} />
            : <div className="text-neutral-700 text-sm whitespace-pre-wrap">{isEmail(r) ? emailBodyText(r) : (r.details || "—")}</div>}
        </div>
      )}
      {attachmentsOf(r).length > 0 && (
        <div className="flex flex-col gap-2 pt-2">
          <div className="text-neutral-500 text-xs uppercase tracking-wide">Attachments ({attachmentsOf(r).length})</div>
          {attachmentsOf(r).map((a, i) => (
            <div key={i} className={`flex items-center gap-2.5 px-3 py-2 rounded-sm outline outline-1 -outline-offset-1 ${preview?.name === a.name ? "outline-neutral-300 bg-neutral-50" : "outline-neutral-200 hover:bg-neutral-50"}`}>
              <img src={fileTypeLogo(a.name)} alt="" className="w-5 h-5 shrink-0 object-contain" />
              <button type="button" onClick={() => openInline(a, i)} title="Preview here" className="text-sm text-neutral-700 truncate flex-1 text-left">{a.name}</button>
              {a.size && <span className="text-xs text-neutral-400 shrink-0">{a.size}</span>}
              <button type="button" onClick={() => openFleetAttachment(a.url)} title="Open in a new tab" className="text-neutral-700 hover:text-black shrink-0"><ExternalLink className="w-4 h-4" /></button>
            </div>
          ))}
        </div>
      )}
      {preview && (
        <div className="flex flex-col gap-2 pt-2">
          <div className="flex items-center justify-between">
            <span className="text-neutral-700 text-sm font-semibold truncate">{preview.name}</span>
            <button type="button" onClick={() => setPreview(null)} className="text-neutral-400 hover:text-neutral-700 text-xl leading-none px-2">×</button>
          </div>
          {preview.type.startsWith("image/")
            ? <img src={preview.url} alt={preview.name} className="max-w-full rounded-sm outline outline-1 outline-neutral-200" />
            : <iframe src={preview.url} title={preview.name} className="w-full h-[600px] rounded-sm outline outline-1 -outline-offset-1 outline-neutral-200 bg-white" />}
        </div>
      )}
    </div>
  );
};

// ── Add Record slide-over (lean form covering the 6 types) ───────────────────
const AddRecordForm = ({
  actionType, onClose, onSubmit,
}: {
  actionType: CaseHistoryActionType;
  onClose: () => void;
  onSubmit: (payload: { correspondent?: string; handler?: string; subject?: string; details?: string; posted_at?: string }) => Promise<void>;
}) => {
  const meta = ACTION_META[actionType];
  const [correspondent, setCorrespondent] = useState("");
  const [handler, setHandler] = useState("");
  const [subject, setSubject] = useState("");
  const [details, setDetails] = useState("");
  const [saving, setSaving] = useState(false);
  const showSubject = ["send_letter", "send_email"].includes(actionType);

  const submit = async () => {
    if (saving) return;
    setSaving(true);
    try {
      await onSubmit({
        correspondent: correspondent.trim() || undefined,
        handler: handler.trim() || undefined,
        subject: showSubject ? subject.trim() || undefined : undefined,
        details: details.trim() || undefined,
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
          <Field label="Correspondent"><input value={correspondent} onChange={(e) => setCorrespondent(e.target.value)} placeholder="Who the activity is with" className={inputCls} /></Field>
          <Field label="Handler"><input value={handler} onChange={(e) => setHandler(e.target.value)} placeholder="Who recorded it" className={inputCls} /></Field>
          {showSubject && <Field label="Subject"><input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject" className={inputCls} /></Field>}
          <Field label={actionType === "note" ? "Note" : "Details"}>
            <textarea value={details} onChange={(e) => setDetails(e.target.value)} rows={8} placeholder="Write the details…" className={`${inputCls} resize-none`} />
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
  scope, id, title, onBack, emailReference,
}: {
  scope: FleetHistoryScope;
  id: number | string;
  title: string;
  onBack?: () => void;
  // The vehicle registration — mailbox emails that mention it appear in this history.
  emailReference?: string;
}) => {
  const [records, setRecords] = useState<FleetHistoryRecord[]>([]);
  const [emails, setEmails] = useState<FleetHistoryRecord[]>([]);
  const [filterOptions, setFilterOptions] = useState<FleetHistoryFilterOptions>({ correspondents: [], handlers: [], action_types: [] });
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [selectedId, setSelectedId] = useState<number | string | null>(null);
  const [addType, setAddType] = useState<CaseHistoryActionType | null>(null);
  const [page, setPage] = useState(1);

  const [search, setSearch] = useState("");
  const [actionTypes, setActionTypes] = useState<string[]>([]);
  const [correspondents, setCorrespondents] = useState<string[]>([]);
  const [handlers, setHandlers] = useState<string[]>([]);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const rows = await getFleetHistory(scope, id, { search, action_type: actionTypes, correspondent: correspondents, handler: handlers });
      setRecords(rows);
    } finally {
      setLoading(false);
    }
  }, [scope, id, search, actionTypes, correspondents, handlers]);

  useEffect(() => { const t = setTimeout(load, 250); return () => clearTimeout(t); }, [load]);
  useEffect(() => {
    if (!id) return;
    getFleetHistoryFilters(scope, id).then(setFilterOptions).catch(() => {});
    getFleetHistoryEmails(scope, id, emailReference).then(setEmails).catch(() => {});
  }, [scope, id, emailReference]);

  const merged = useMemo(() => {
    const term = search.trim().toLowerCase();
    const emailsF = emails.filter((e) => {
      if (actionTypes.length && !(e.action_type && actionTypes.includes(e.action_type))) return false;
      if (correspondents.length && !(e.correspondent && correspondents.includes(e.correspondent))) return false;
      if (handlers.length && !(e.handler && handlers.includes(e.handler))) return false;
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
  }, [records, emails, search, actionTypes, correspondents, handlers]);

  useEffect(() => { if (merged.length && !merged.some((r) => r.id === selectedId)) setSelectedId(merged[0].id); }, [merged, selectedId]);
  useEffect(() => { setPage(1); }, [search, actionTypes, correspondents, handlers]);

  const selected = merged.find((r) => r.id === selectedId) || null;
  const totalPages = Math.max(1, Math.ceil(merged.length / PAGE_SIZE));
  const pageRecords = merged.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handlerOptions = Array.from(new Set([...filterOptions.handlers]));

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

  const createRecord = async (payload: { correspondent?: string; handler?: string; subject?: string; details?: string }) => {
    if (!addType) return;
    try {
      const rec = await createFleetHistory(scope, id, { action_type: addType, ...payload });
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

      <header className="px-10 py-5 bg-white shadow-[0px_4px_20px_0px_rgba(0,0,0,0.08)] flex items-center gap-4 sticky top-0 z-20">
        {onBack && <button type="button" onClick={onBack} className="text-neutral-700 hover:text-black"><ChevronLeft size={22} /></button>}
        <h1 className="text-neutral-900 text-2xl font-semibold">History — {title}</h1>
      </header>

      <div className="px-10 py-6 flex flex-col gap-5">
        {/* Add Record pills */}
        <div className="flex items-center gap-2 flex-wrap justify-end">
          {CREATE_ORDER.map((t) => (
            <button key={t} type="button" onClick={() => setAddType(t)} className="px-3 py-2 rounded-sm bg-neutral-900 text-white text-xs inline-flex items-center gap-1.5 hover:bg-black">
              <span className="font-semibold">{ACTION_META[t].abbr}</span> {ACTION_META[t].label}
            </button>
          ))}
        </div>

        {/* Search + filters — same widgets as the VM / Skyline listing. */}
        <div className="flex flex-wrap items-center gap-6">
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search history…" className="w-[420px] max-w-full px-5 py-3 rounded-lg border border-neutral-200 text-sm outline-none focus:border-neutral-400" />
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
        </div>

        {/* Body: list + detail (50/50) */}
        <div className="flex items-start gap-6">
          <div
            className={`flex-1 min-w-0 basis-0 flex flex-col gap-3 relative rounded-lg transition ${dragOver ? "outline outline-2 outline-dashed outline-neutral-500" : ""}`}
            onDragOver={(e) => { e.preventDefault(); if (!dragOver) setDragOver(true); }}
            onDragLeave={(e) => { if (e.currentTarget === e.target) setDragOver(false); }}
            onDrop={handleDrop}
          >
            {dragOver && <div className="absolute inset-0 z-10 rounded-lg bg-neutral-100/85 flex items-center justify-center text-neutral-700 text-sm pointer-events-none">Drop the Outlook email (.eml / .msg) here</div>}
            {merged.length === 0
              ? (loading ? null : <div className="py-16 text-center text-sm text-neutral-400">No history records yet.</div>)
              : pageRecords.map((r) => <HistoryCard key={String(r.id)} r={r} active={r.id === selectedId} onClick={() => setSelectedId(r.id)} />)}

            {merged.length > 0 && (
              <div className="flex items-center justify-between flex-wrap gap-3 pt-2">
                <div className="text-neutral-500 text-sm">
                  Showing {merged.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1} to {Math.min(page * PAGE_SIZE, merged.length)} of {merged.length} Entries
                </div>
                <div className="flex items-center gap-1">
                  <button type="button" disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="px-3 py-1.5 text-sm text-neutral-600 disabled:text-neutral-300 hover:text-black">Previous</button>
                  <span className="px-2 text-sm text-neutral-600">{page} / {totalPages}</span>
                  <button type="button" disabled={page === totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} className="px-3 py-1.5 text-sm text-neutral-900 disabled:text-neutral-300 hover:text-black">Next</button>
                </div>
              </div>
            )}
          </div>
          <RecordDetail r={selected} />
        </div>
      </div>

      {addType && <AddRecordForm actionType={addType} onClose={() => setAddType(null)} onSubmit={createRecord} />}
    </div>
  );
};

export default FleetHistory;
