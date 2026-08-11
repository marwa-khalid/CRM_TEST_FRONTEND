import React, { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { Download, Trash2, Upload } from "lucide-react";
import { fileTypeIcon } from "../utils/fileIcon";
import {
  updateFleetTask,
  uploadTaskAttachment,
  getFleetTaskNotes,
  addFleetTaskNote,
  deleteFleetTaskNote,
  getFleetTaskHistory,
  getFleetAttachmentUrl,
  type FleetTask,
  type FleetTaskNote,
  type FleetTaskHistoryEvent,
} from "../services/taskService";
import FleetConfirmModal from "./FleetConfirmModal";
import FleetSpinnerLoader from "./FleetSpinnerLoader";

const TABS = ["Task Details", "Attachments", "Notes", "Task History"] as const;
export type FleetTaskDetailTab = (typeof TABS)[number];

// Solid dot colours (match the Fleet badge palette).
const priorityDot = (p?: string | null) => {
  const v = (p || "").toLowerCase();
  if (v === "high") return "bg-red-500";
  if (v === "medium") return "bg-amber-500";
  if (v === "low") return "bg-green-500";
  return "bg-neutral-400";
};
const statusDot = (s?: string | null) => {
  const v = (s || "").toLowerCase();
  if (v === "completed") return "bg-green-500";
  if (v === "in progress") return "bg-neutral-900";
  if (v === "awaiting response") return "bg-yellow-500";
  if (v === "overdue") return "bg-red-500";
  return "bg-neutral-400";
};

const fmtLong = (d?: string | null) => {
  if (!d) return "—";
  const dt = new Date(`${d}T00:00:00`);
  return Number.isNaN(dt.getTime()) ? d : dt.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};
const fmtDateTime = (iso?: string | null) => {
  if (!iso) return "";
  const d = new Date(iso.endsWith("Z") || iso.includes("+") ? iso : `${iso}Z`);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
};
const baseName = (p: string) => p.split("/").pop() || p;
const splitPaths = (v?: string | null): string[] => (v || "").split(",").map((s) => s.trim()).filter(Boolean);

// ── Tab 1: Task Details ──────────────────────────────────────────────────────
const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="flex flex-col gap-2 min-w-0">
    <div className="text-neutral-700 text-sm font-medium">{label}</div>
    <div className="text-neutral-600 text-sm font-light break-words">{children}</div>
  </div>
);

const DetailsTab: React.FC<{ task: FleetTask }> = ({ task }) => (
  <div className="flex flex-col gap-6">
    <div className="grid grid-cols-2 gap-6">
      <Field label="Assigned To">{task.assigned_user || "—"}</Field>
      <Field label="Department">{task.department || "Fleet"}</Field>
      <Field label="Due Date">{fmtLong(task.due_date)}</Field>
      <Field label="Due Time">{task.due_time || "—"}</Field>
      <div className="flex flex-col gap-2">
        <div className="text-neutral-700 text-sm font-medium">Priority</div>
        <div className="flex items-center gap-2 text-sm text-neutral-600">
          <span className={`w-2 h-2 rounded-full ${priorityDot(task.priority)}`} />
          {task.priority || "—"}
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <div className="text-neutral-700 text-sm font-medium">Status</div>
        <div className="flex items-center gap-2 text-sm text-neutral-600">
          <span className={`w-2 h-2 rounded-full ${statusDot(task.status)}`} />
          {task.status || "—"}
        </div>
      </div>
      <Field label="Vehicle Reg">{task.vehicle_registration || "—"}</Field>
    </div>
    <div className="flex flex-col gap-2">
      <div className="text-neutral-700 text-sm font-medium">Description</div>
      <div className="text-neutral-600 text-sm font-light whitespace-pre-line">{task.description || "—"}</div>
    </div>
  </div>
);

// ── Tab 2: Attachments ───────────────────────────────────────────────────────
const AttachmentsTab: React.FC<{ task: FleetTask; onUpdated: (t: FleetTask) => void; readOnly?: boolean }> = ({ task, onUpdated, readOnly }) => {
  const [removeTarget, setRemoveTarget] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const files = splitPaths(task.attachment_path);

  const save = async (paths: string[]) => {
    const updated = await updateFleetTask(task.id, { attachment_path: paths.join(",") });
    if (updated) onUpdated(updated);
  };
  const onPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = Array.from(e.target.files || []);
    if (list.length === 0) return;
    setBusy(true);
    try {
      const uploaded = (await Promise.all(list.map((f) => uploadTaskAttachment(f)))).filter(Boolean) as { path: string }[];
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
      {!readOnly && (
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
            {!readOnly && <button type="button" onClick={() => setRemoveTarget(p)} title="Remove" className="p-1.5 text-neutral-500 hover:text-red-500"><Trash2 size={16} /></button>}
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

// ── Tab 3: Notes ─────────────────────────────────────────────────────────────
const NotesTab: React.FC<{ taskId: number; readOnly?: boolean }> = ({ taskId, readOnly }) => {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [notes, setNotes] = useState<FleetTaskNote[]>([]);

  const load = () => getFleetTaskNotes(taskId).then(setNotes);
  useEffect(() => { load(); }, [taskId]);

  const submit = async () => {
    if (!text.trim()) return;
    setBusy(true);
    const created = await addFleetTaskNote(taskId, text.trim());
    setBusy(false);
    if (created) { setText(""); load(); toast.success("Note added."); }
    else toast.error("Couldn't add the note.");
  };
  const remove = async (id: number) => {
    if (await deleteFleetTaskNote(id)) load(); else toast.error("Couldn't delete.");
  };

  return (
    <div className="flex flex-col gap-6">
      {!readOnly && (
        <>
          <div className="text-neutral-900 text-base font-semibold">Add Note</div>
          <div className="flex flex-col items-end gap-3">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Enter note…"
              className="w-full h-28 px-5 py-4 bg-white rounded border border-neutral-200 text-neutral-700 text-sm font-light resize-none outline-none focus:border-neutral-900 placeholder:text-neutral-300"
            />
            <button type="button" onClick={submit} disabled={busy} className="h-9 px-5 bg-neutral-900 rounded text-white text-sm font-medium disabled:opacity-60 hover:bg-black">
              Submit
            </button>
          </div>
        </>
      )}
      <div className="flex flex-col gap-3">
        {notes.length === 0 && <div className="text-neutral-400 text-sm">No notes yet.</div>}
        {notes.map((n) => (
          <div key={n.id} className="p-4 rounded-lg border border-neutral-200 flex flex-col gap-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 bg-neutral-100 rounded-full flex items-center justify-center text-neutral-600 text-sm font-medium">{(n.author_name || "U").slice(0, 2).toUpperCase()}</span>
                <span className="text-neutral-900 text-sm font-medium">{n.author_name || "User"}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-neutral-500 text-xs">{fmtDateTime(n.created_at)}</span>
                {!readOnly && <button type="button" onClick={() => remove(n.id)} className="text-neutral-300 hover:text-red-500"><Trash2 size={15} /></button>}
              </div>
            </div>
            <div className="text-neutral-700 text-sm whitespace-pre-line">{n.text}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ── Tab 4: Task History ──────────────────────────────────────────────────────
const HistoryTab: React.FC<{ taskId: number }> = ({ taskId }) => {
  const [events, setEvents] = useState<FleetTaskHistoryEvent[]>([]);
  useEffect(() => { getFleetTaskHistory(taskId).then(setEvents); }, [taskId]);
  return (
    <div className="flex flex-col gap-6">
      <div className="text-neutral-700 text-base font-semibold">Task History</div>
      <div className="flex flex-col gap-2">
        {events.length === 0 && <div className="text-neutral-400 text-sm">No history yet.</div>}
        {events.map((e) => (
          <div key={e.id} className="p-4 bg-neutral-100 rounded-lg flex flex-col gap-1">
            <div className="text-neutral-900 text-sm font-semibold">{e.title}</div>
            {e.detail && <div className="text-neutral-500 text-sm">{e.detail}</div>}
            <div className="pt-1 flex items-center gap-2 text-neutral-500 text-xs">
              <span>{fmtDateTime(e.created_at)}</span>
              {e.actor_name && <span>· {e.actor_name}</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const FleetTaskDetailSlider: React.FC<{
  task: FleetTask;
  initialTab?: FleetTaskDetailTab;
  onClose: () => void;
  onEdit: () => void;
  onRefresh: () => void;
  // Match the calendar drawer width and show attachments/notes
  // read-only (adding is done on the Task Management screen); empty tabs are hidden.
  readOnly?: boolean;
}> = ({ task, initialTab = "Task Details", onClose, onEdit, onRefresh, readOnly }) => {
  const [tab, setTab] = useState<FleetTaskDetailTab>(initialTab);
  const [t, setT] = useState<FleetTask>(task);
  const [noteCount, setNoteCount] = useState(0);
  const [tabLoading, setTabLoading] = useState(false);
  const onUpdated = (u: FleetTask) => { setT(u); onRefresh(); };

  // Brief grey overlay on tab switch so async tab content doesn't flash/glitch in.
  const switchTab = (name: FleetTaskDetailTab) => { setTab(name); setTabLoading(true); };
  useEffect(() => {
    if (!tabLoading) return;
    const id = setTimeout(() => setTabLoading(false), 350);
    return () => clearTimeout(id);
  }, [tabLoading]);

  useEffect(() => { setTab(initialTab); }, [initialTab, task.id]);
  // Read-only (calendar) mode hides the Notes tab when the task has none, so fetch the count up-front.
  useEffect(() => {
    if (!readOnly) return;
    getFleetTaskNotes(task.id).then((n) => setNoteCount(n.length));
  }, [readOnly, task.id]);

  const attCount = splitPaths(t.attachment_path).length;
  const tabs: readonly FleetTaskDetailTab[] = readOnly
    ? TABS.filter((name) => !((name === "Attachments" && attCount === 0) || (name === "Notes" && noteCount === 0)))
    : TABS;
  const activeTab: FleetTaskDetailTab = tabs.includes(tab) ? tab : "Task Details";

  return (
    <div className="fixed inset-0 z-50 flex justify-end font-sans-headline">
      {tabLoading && <FleetSpinnerLoader />}
      <div className="flex-1 bg-black/30" onClick={onClose} />
      <div className="w-[620px] max-w-full bg-white h-full flex flex-col shadow-2xl">
        {/* header */}
        <div className="px-6 pt-5 shadow-[0px_4px_20px_0px_rgba(0,0,0,0.08)] flex flex-col gap-5 shrink-0">
          <div className="flex justify-between items-center gap-4">
            <div className="text-neutral-700 text-base font-semibold truncate">Task: {t.title}</div>
            <div className="flex items-center gap-3 shrink-0">
              <button type="button" onClick={onEdit} className="px-8 py-3 bg-neutral-900 rounded text-white text-base font-medium hover:bg-black">Edit Task</button>
              <button type="button" onClick={onClose} className="px-8 py-3 bg-white rounded border border-neutral-300 text-neutral-700 text-base font-medium hover:bg-neutral-50">Close</button>
            </div>
          </div>
          <div className="flex items-start gap-6">
            {tabs.map((name) => (
              <button key={name} type="button" onClick={() => switchTab(name)} className="flex flex-col items-start gap-2 pb-0">
                <span className={`text-sm leading-4 ${activeTab === name ? "text-neutral-900 font-semibold" : "text-neutral-500 hover:text-neutral-700"}`}>{name}</span>
                <span className={`h-0.5 w-full ${activeTab === name ? "bg-neutral-900" : "bg-transparent"}`} />
              </button>
            ))}
          </div>
        </div>
        {/* body */}
        <div className="flex-1 overflow-auto p-6">
          {activeTab === "Task Details" && <DetailsTab task={t} />}
          {activeTab === "Attachments" && <AttachmentsTab task={t} onUpdated={onUpdated} readOnly={readOnly} />}
          {activeTab === "Notes" && <NotesTab taskId={t.id} readOnly={readOnly} />}
          {activeTab === "Task History" && <HistoryTab taskId={t.id} />}
        </div>
      </div>
    </div>
  );
};

export default FleetTaskDetailSlider;
