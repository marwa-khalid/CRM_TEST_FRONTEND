import React, { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { Download, Trash2, Upload } from "lucide-react";
import { fileTypeIcon } from "../utils/fileIcon";
import { updateCalendarEvent, uploadEventAttachment, type FleetEvent } from "../services/eventService";
import { getFleetAttachmentUrl } from "../services/taskService";
import FleetConfirmModal from "./FleetConfirmModal";

const TABS = ["Event Details", "Attachments"] as const;
export type FleetEventDetailTab = (typeof TABS)[number];

const statusDot = (s?: string | null) => {
  const v = (s || "").toLowerCase();
  if (v === "completed") return "bg-green-500";
  if (v === "cancelled" || v === "rejected") return "bg-neutral-400";
  if (v === "in progress") return "bg-neutral-900";
  return "bg-yellow-500"; // scheduled / default
};

const fmtLong = (d?: string | null) => {
  if (!d) return "—";
  const dt = new Date(`${d}T00:00:00`);
  return Number.isNaN(dt.getTime()) ? d : dt.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};
const timeRange = (a?: string | null, b?: string | null) => {
  if (!a && !b) return "All day";
  if (a && b) return `${a} – ${b}`;
  return a || b || "—";
};
const baseName = (p: string) => p.split("/").pop() || p;
const splitPaths = (v?: string | null): string[] => (v || "").split(",").map((s) => s.trim()).filter(Boolean);

// ── Tab 1: Event Details ─────────────────────────────────────────────────────
const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="flex flex-col gap-2 min-w-0">
    <div className="text-neutral-700 text-sm font-medium">{label}</div>
    <div className="text-neutral-600 text-sm font-light break-words">{children}</div>
  </div>
);

const DetailsTab: React.FC<{ ev: FleetEvent }> = ({ ev }) => (
  <div className="flex flex-col gap-6">
    <div className="grid grid-cols-2 gap-6">
      <Field label="Event Type">{ev.event_type || "—"}</Field>
      <div className="flex flex-col gap-2">
        <div className="text-neutral-700 text-sm font-medium">Status</div>
        <div className="flex items-center gap-2 text-sm text-neutral-600">
          <span className={`w-2 h-2 rounded-full ${statusDot(ev.status)}`} />
          {ev.status || "Scheduled"}
        </div>
      </div>
      <Field label="Start Date">{fmtLong(ev.start_date)}</Field>
      <Field label="End Date">{fmtLong(ev.end_date || ev.start_date)}</Field>
      <Field label="Time">{timeRange(ev.start_time, ev.end_time)}</Field>
      <Field label="Vehicle Reg">{ev.vehicle_registration || "—"}</Field>
      <Field label="Location">{ev.location || "—"}</Field>
    </div>
    <div className="flex flex-col gap-2">
      <div className="text-neutral-700 text-sm font-medium">Description</div>
      <div className="text-neutral-600 text-sm font-light whitespace-pre-line">{ev.description || "—"}</div>
    </div>
  </div>
);

// ── Tab 2: Attachments ───────────────────────────────────────────────────────
const AttachmentsTab: React.FC<{ ev: FleetEvent; onUpdated: (e: FleetEvent) => void; canEdit: boolean }> = ({ ev, onUpdated, canEdit }) => {
  const [removeTarget, setRemoveTarget] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const files = splitPaths(ev.attachment_path);

  const save = async (paths: string[]) => {
    const updated = await updateCalendarEvent(ev.id, { attachment_path: paths.join(",") });
    if (updated) onUpdated(updated);
  };
  const onPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = Array.from(e.target.files || []);
    if (list.length === 0) return;
    setBusy(true);
    try {
      const uploaded = (await Promise.all(list.map((f) => uploadEventAttachment(f)))).filter(Boolean) as { path: string }[];
      if (uploaded.length) { await save([...files, ...uploaded.map((u) => u.path)]); toast.success("Attachment uploaded."); }
    } catch { toast.error("Failed to attach file."); }
    finally { setBusy(false); if (inputRef.current) inputRef.current.value = ""; }
  };
  const confirmRemove = async () => {
    if (!removeTarget) return;
    try { await save(files.filter((x) => x !== removeTarget)); toast.success("Attachment deleted."); }
    catch { toast.error("Couldn't delete."); }
    finally { setRemoveTarget(null); }
  };
  const open = async (p: string) => {
    const url = await getFleetAttachmentUrl(p);
    if (url) window.open(url, "_blank"); else toast.error("Couldn't open the file.");
  };

  return (
    <div className="flex flex-col gap-6">
      <input ref={inputRef} type="file" multiple className="hidden" onChange={onPick} />
      {canEdit && (
        <div className="flex flex-col gap-4">
          <div className="text-neutral-900 text-base font-semibold">Upload Attachment</div>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            className="p-8 rounded-lg border border-neutral-200 flex flex-col items-center gap-3 hover:bg-neutral-50 disabled:opacity-60"
          >
            <Upload size={22} className="text-neutral-500" />
            <div className="flex flex-col items-center gap-1">
              <span className="text-neutral-900 text-sm font-medium">{busy ? "Uploading…" : "Click to upload"}</span>
              <span className="text-neutral-500 text-xs">JPG, PNG, PDF, CSV, Excel, Word, PPT supported</span>
            </div>
          </button>
        </div>
      )}
      <div className="flex flex-col gap-3">
        <div className="text-neutral-700 text-base font-semibold">Attached Files ({files.length})</div>
        {files.length === 0 && <div className="text-neutral-400 text-sm">No attachments yet.</div>}
        {files.map((p) => (
          <div key={p} className="p-3 rounded-lg border border-neutral-200 flex items-center gap-3">
            <img src={fileTypeIcon(p)} alt="" className="w-10 h-10 shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-neutral-900 text-sm font-medium line-clamp-1">{baseName(p)}</div>
            </div>
            <button type="button" onClick={() => open(p)} title="Download" className="p-1.5 text-neutral-500 hover:text-neutral-900"><Download size={16} /></button>
            {canEdit && <button type="button" onClick={() => setRemoveTarget(p)} title="Remove" className="p-1.5 text-neutral-500 hover:text-red-500"><Trash2 size={16} /></button>}
          </div>
        ))}
      </div>
      {removeTarget && (
        <FleetConfirmModal
          title="Remove Attachment"
          message="Are you sure you want to remove this attachment?"
          confirmLabel="Remove"
          onCancel={() => setRemoveTarget(null)}
          onConfirm={confirmRemove}
        />
      )}
    </div>
  );
};

const FleetEventDetailSlider: React.FC<{
  event: FleetEvent;
  initialTab?: FleetEventDetailTab;
  onClose: () => void;
  onEdit: () => void;
  onRefresh: () => void;
}> = ({ event, initialTab = "Event Details", onClose, onEdit, onRefresh }) => {
  const [tab, setTab] = useState<FleetEventDetailTab>(initialTab);
  const [ev, setEv] = useState<FleetEvent>(event);
  const onUpdated = (u: FleetEvent) => { setEv(u); onRefresh(); };
  // System-sourced events (expiry syncs etc.) are read-only — no edit / no attach.
  const canEdit = (ev.source || "manual") !== "system";

  useEffect(() => { setTab(initialTab); setEv(event); }, [initialTab, event]);

  return (
    <div className="fixed inset-0 z-50 flex justify-end font-sans-headline">
      <div className="flex-1 bg-black/30" onClick={onClose} />
      <div className="w-[800px] max-w-full bg-white h-full flex flex-col">
        {/* header */}
        <div className="px-10 pt-5 shadow-[0px_4px_20px_0px_rgba(0,0,0,0.08)] flex flex-col gap-5 shrink-0">
          <div className="flex justify-between items-center gap-4">
            <div className="text-neutral-700 text-base font-semibold truncate">Event: {ev.title}</div>
            <div className="flex items-center gap-3 shrink-0">
              {canEdit && <button type="button" onClick={onEdit} className="px-8 py-3 bg-neutral-900 rounded text-white text-base font-medium hover:bg-black">Edit Event</button>}
              <button type="button" onClick={onClose} className="px-8 py-3 bg-white rounded border border-neutral-300 text-neutral-700 text-base font-medium hover:bg-neutral-50">Close</button>
            </div>
          </div>
          <div className="flex items-start gap-6">
            {TABS.map((name) => (
              <button key={name} type="button" onClick={() => setTab(name)} className="flex flex-col items-start gap-2 pb-0">
                <span className={`text-sm leading-4 ${tab === name ? "text-neutral-900 font-semibold" : "text-neutral-500 hover:text-neutral-700"}`}>{name}</span>
                <span className={`h-0.5 w-full ${tab === name ? "bg-neutral-900" : "bg-transparent"}`} />
              </button>
            ))}
          </div>
        </div>
        {/* body */}
        <div className="flex-1 overflow-auto p-10">
          {tab === "Event Details" && <DetailsTab ev={ev} />}
          {tab === "Attachments" && <AttachmentsTab ev={ev} onUpdated={onUpdated} canEdit={canEdit} />}
        </div>
      </div>
    </div>
  );
};

export default FleetEventDetailSlider;
