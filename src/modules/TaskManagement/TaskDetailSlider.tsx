import React, { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import {
  updateTask, getAttachmentUrl,
  getTaskNotes, addTaskNote, deleteTaskNote, getTaskHistory,
} from "../../services/Tasks/Tasks";
import Delete from '../../assets/TaskManagement/Delete.svg'
import Download from "../../assets/TaskManagement/Download.svg";

import { getUsers } from "../../services/Notifications/Notifications";
import TaskAttachmentModal, { fileLogo } from "./TaskAttachmentModal";
import { ConfirmModal } from "../../components/common/ConfirmModal";
import upload from '../../assets/TaskManagement/upload.svg'
const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// Render a saved note: @mentions in blue, **bold**, *italic*.
const renderNote = (text: string) => {
  let html = escapeHtml(text || "").replace(/\n/g, "<br/>");
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/(^|[^*])\*([^*\n]+?)\*(?!\*)/g, "$1<em>$2</em>");
  html = html.replace(/@([A-Za-z0-9._-]+)/g, '<span class="text-blue-500 font-weight-500">@$1</span>');
  return { __html: html };
};

const fmtNoteTime = (iso?: string) => {
  if (!iso) return "";
  const d = new Date(iso.endsWith("Z") || iso.includes("+") ? iso : iso + "Z");
  return d.toLocaleString("en-GB", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" });
};

const TABS = ["Task Details", "Attachments", "Notes", "Task History"] as const;
export type TaskDetailTab = (typeof TABS)[number];

const priorityCls = (p?: string) => {
  const v = (p || "").toLowerCase();
  if (v === "high") return "bg-red-500";
  if (v === "medium") return "bg-amber-500";
  if (v === "low") return "bg-green-500";
  return "bg-neutral-400";
};
const statusCls = (s?: string) => {
  const v = (s || "").toLowerCase();
  if (v === "completed") return "bg-green-500";
  if (v === "in progress") return "bg-yellow-500";
  if (v === "overdue") return "bg-red-500";
  if (v === "awaiting response") return "bg-blue-500";
  if (v === "rejected") return "bg-neutral-500";
  return "bg-neutral-400";
};

const fmtLong = (d?: string | null) => {
  if (!d) return "—";
  const dt = new Date(d + "T00:00:00");
  if (isNaN(dt.getTime())) return d;
  return dt.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};
const baseName = (p: string) => p.split("/").pop() || p;

// ─── Tab 1: details ──────────────────────────────────────────────────────────────
const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="w-48 flex flex-col gap-2">
    <div className="text-neutral-700 text-sm font-weight-500">{label}</div>
    <div className="text-neutral-700 text-sm font-weight-400 font-light">{children}</div>
  </div>
);

const DetailsTab = ({ task, onReassign }: { task: any; onReassign: () => void }) => (
  <div className="flex flex-col gap-6">
    <div className="flex gap-6">
      <div className="w-48 flex flex-col gap-2">
        <div className="text-neutral-700 text-sm font-weight-500">Assigned To</div>
        <div className="flex flex-col gap-1">
          <span className="text-neutral-700 text-sm font-weight-400 font-light">{task.assigned_user || "—"}</span>
          <button type="button" onClick={onReassign} className="text-blue-500 text-xs text-left">Reassign</button>
        </div>
      </div>
      <Field label="Department">{task.department || "—"}</Field>
    </div>
    <div className="flex gap-6">
      <Field label="Due Date">{fmtLong(task.due_date)}</Field>
      <Field label="Due Time">{task.due_time || "—"}</Field>
    </div>
    <div className="flex gap-6">
      <div className="w-48 flex flex-col gap-2">
        <div className="text-neutral-700 text-sm font-weight-500">Priority</div>
        <div><span className={`px-2 py-1 rounded text-white text-xs font-weight-600 uppercase ${priorityCls(task.priority)}`}>{task.priority || "—"}</span></div>
      </div>
      <div className="w-48 flex flex-col gap-2">
        <div className="text-neutral-700 text-sm font-weight-500">Status</div>
        <div><span className={`px-2 py-1 rounded text-white text-xs font-weight-600 uppercase ${statusCls(task.status)}`}>{task.status || "—"}</span></div>
      </div>
    </div>
    <Field label="Claim Reference">{task.claim_reference || "—"}</Field>
    <Field label="Vehicle Reg">{task.vehicle_registration || "—"}</Field>
    <div className="flex flex-col gap-2">
      <div className="text-neutral-700 text-sm font-weight-500">Description</div>
      <div className="text-neutral-700 text-sm font-weight-400 font-light whitespace-pre-line">{task.description || "—"}</div>
    </div>
  </div>
);

// ─── Tab 2: attachments ────────────────────────────────────────────────────────────
const AttachmentsTab = ({ task, onUpdated }: { task: any; onUpdated: (t: any) => void }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<string | null>(null);
  const files: string[] = (task.attachment_path || "").split(",").map((s: string) => s.trim()).filter(Boolean);

  const save = async (paths: string[]) => {
    const { data } = await updateTask(task.id, { attachment_path: paths.join(",") });
    onUpdated(data);
  };
  const onUploaded = async (path: string) => {
    try { await save([...files, path]); } catch { toast.error("Failed to attach file"); }
  };
  const confirmRemove = async () => {
    if (!removeTarget) return;
    try { await save(files.filter((x) => x !== removeTarget)); toast.success("Attachment removed"); }
    catch { toast.error("Failed"); }
    finally { setRemoveTarget(null); }
  };
  const open = async (p: string) => {
    try { const { data } = await getAttachmentUrl(p); window.open(data?.url || data, "_blank"); } catch { toast.error("Could not open"); }
  };

  return (
    <div className="flex flex-col gap-6">
      {modalOpen && (
        <TaskAttachmentModal
          onClose={() => setModalOpen(false)}
          onUploaded={onUploaded}
        />
      )}
      <div className="flex flex-col gap-4">
        <div className="text-neutral-900 text-base font-weight-600">
          Upload Attachment
        </div>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="p-8 rounded-lg outline outline-1 outline-offset-[-1px] outline-neutral-200 flex flex-col items-center gap-3 hover:bg-neutral-50"
        >
          <img src={upload} alt="" />
          <div className="flex flex-col items-center gap-1">
            <span className="text-blue-500 text-sm font-weight-500">
              Click to upload or drag and drop
            </span>
            <span className="text-neutral-500 text-xs">
              JPG, PNG, PDF, CSV Supported
            </span>
          </div>
        </button>
      </div>
      <div className="flex flex-col gap-3">
        <div className="text-neutral-700 text-base font-weight-600">
          Attached Files ({files.length})
        </div>
        {files.length === 0 && (
          <div className="text-neutral-400 text-sm">No attachments yet.</div>
        )}
        {files.map((p) => (
          <div
            key={p}
            className="p-3 rounded-lg outline outline-1 outline-offset-[-1px] outline-neutral-200 flex items-center gap-3"
          >
            <img src={fileLogo(p)} alt="" className="w-10 h-10" />
            <div className="flex-1 min-w-0">
              <div className="text-black text-sm font-weight-500 line-clamp-1">
                {baseName(p)}
              </div>
            </div>
            <button
              type="button"
              onClick={() => open(p)}
              title="Download"
              className="text-neutral-500 hover:text-blue-500"
            >
              <img src={Download} alt="" />{" "}
            </button>
            <button
              type="button"
              onClick={() => setRemoveTarget(p)}
              title="Remove"
              className="text-neutral-500 hover:text-red-500"
            >
              <img src={Delete} alt="" />{" "}
            </button>
          </div>
        ))}
      </div>
      {removeTarget && (
        <ConfirmModal
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

// ─── Tab 3: notes ──────────────────────────────────────────────────────────────────
const NotesTab = ({ task }: { task: any }) => {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [notes, setNotes] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [mention, setMention] = useState<{ open: boolean; query: string; at: number }>({ open: false, query: "", at: 0 });
  const taRef = useRef<HTMLTextAreaElement>(null);

  const load = () => getTaskNotes(task.id).then(({ data }) => setNotes(Array.isArray(data) ? data : [])).catch(() => {});
  useEffect(() => {
    load();
    getUsers().then(({ data }) => setUsers(Array.isArray(data) ? data : [])).catch(() => {});
  }, [task.id]);

  const onChange = (v: string) => {
    setText(v);
    const caret = taRef.current?.selectionStart ?? v.length;
    const m = v.slice(0, caret).match(/@([A-Za-z0-9._-]*)$/);
    setMention(m ? { open: true, query: m[1], at: caret - m[0].length } : { open: false, query: "", at: 0 });
  };
  const insertMention = (u: any) => {
    const caret = taRef.current?.selectionStart ?? text.length;
    setText(text.slice(0, mention.at) + `@${u.name} ` + text.slice(caret));
    setMention({ open: false, query: "", at: 0 });
    setTimeout(() => taRef.current?.focus(), 0);
  };
  const wrap = (marker: string) => {
    const ta = taRef.current;
    if (!ta) return;
    const s = ta.selectionStart, e = ta.selectionEnd;
    const sel = text.slice(s, e) || "text";
    setText(text.slice(0, s) + marker + sel + marker + text.slice(e));
    setTimeout(() => ta.focus(), 0);
  };
  const matches = mention.open
    ? users.filter((u) =>
        (u.name || "").toLowerCase().includes(mention.query.toLowerCase()) ||
        (u.email || "").toLowerCase().includes(mention.query.toLowerCase()),
      ).slice(0, 6)
    : [];

  const submit = async () => {
    if (!text.trim()) return;
    setBusy(true);
    try { await addTaskNote(task.id, text.trim()); setText(""); load(); toast.success("Note added"); }
    catch { toast.error("Failed to add note"); } finally { setBusy(false); }
  };
  const remove = async (id: number) => {
    try { await deleteTaskNote(id); load(); } catch { toast.error("Failed"); }
  };

  return (
    <div className="flex flex-col gap-7">
      <div className="text-black text-base font-weight-600">Add Note</div>
      <div className="flex flex-col items-end gap-3">
        <div className="self-stretch relative rounded outline outline-1 outline-offset-[-1px] outline-neutral-200 focus-within:outline-blue-500">
          <textarea ref={taRef} value={text} onChange={(e) => onChange(e.target.value)} placeholder="Enter Text — type @ to tag"
            className="w-full h-28 px-5 pt-4 bg-white text-neutral-700 text-base font-light resize-none outline-none placeholder:text-neutral-300" />
          <div className="flex items-center gap-4 px-5 py-2 border-t border-neutral-100">
            <button type="button" onClick={() => wrap("**")} title="Bold" className="text-neutral-700 font-weight-700 text-sm w-5">B</button>
            <button type="button" onClick={() => wrap("*")} title="Italic" className="text-neutral-700 italic text-sm w-5">i</button>
          </div>
          {mention.open && matches.length > 0 && (
            <div className="absolute z-20 left-4 bottom-full mb-1 w-64 max-h-56 overflow-auto bg-white border border-neutral-200 rounded-lg shadow-xl">
              {matches.map((u) => (
                <button key={u.id} type="button" onClick={() => insertMention(u)} className="w-full text-left px-4 py-2.5 flex items-center gap-3 hover:bg-blue-100">
                  <span className="w-7 h-7 rounded-full bg-blue-100 text-blue-500 text-xs font-weight-600 flex items-center justify-center shrink-0">{(u.name || "?").charAt(0).toUpperCase()}</span>
                  <span className="flex flex-col min-w-0">
                    <span className="text-sm text-blue-500 font-weight-500 truncate">@{u.name}</span>
                    <span className="text-xs text-neutral-400 truncate">{u.email}</span>
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
        <button type="button" onClick={submit} disabled={busy}
          className="h-8 px-4 bg-blue-100 rounded text-blue-600 text-sm disabled:opacity-60">Submit</button>
      </div>
      <div className="flex flex-col gap-3">
        {notes.map((n) => (
          <div key={n.id} className="p-4 rounded outline outline-1 outline-offset-[-1px] outline-blue-200 flex flex-col gap-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-300 text-sm font-weight-500">{(n.author_name || "U").slice(0, 2).toUpperCase()}</span>
                <div className="flex flex-col">
                  <span className="text-black text-sm font-weight-500">{n.author_name}</span>
                  <span className="text-neutral-500 text-xs">Claim Handler</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-neutral-500 text-sm">{fmtNoteTime(n.created_at)}</span>
                <button type="button" onClick={() => remove(n.id)} className="text-neutral-300 hover:text-red-500">
                <img src={Delete} alt="" /></button>
              </div>
            </div>
            <div className="text-neutral-700 text-sm" dangerouslySetInnerHTML={renderNote(n.text)} />
          </div>
        ))}
        {notes.length === 0 && <div className="text-neutral-400 text-sm">No notes yet.</div>}
      </div>
    </div>
  );
};

// ─── Tab 4: history (real) ────────────────────────────────────────────────────────
const HistoryTab = ({ task }: { task: any }) => {
  const [events, setEvents] = useState<any[]>([]);
  useEffect(() => {
    getTaskHistory(task.id).then(({ data }) => setEvents(Array.isArray(data) ? data : [])).catch(() => {});
  }, [task.id]);
  const fmt = (w?: string) =>
    w ? new Date(w.endsWith("Z") || w.includes("+") ? w : w + "Z").toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "";
  return (
    <div className="flex flex-col gap-6">
      <div className="text-neutral-700 text-base font-weight-600">Task History</div>
      <div className="flex flex-col gap-2">
        {events.map((e) => (
          <div key={e.id} className="p-4 bg-blue-100 rounded-lg flex flex-col gap-1">
            <div className="text-black text-sm font-weight-600">{e.title}</div>
            {e.detail && <div className="text-neutral-500 text-sm">{e.detail}</div>}
            <div className="pt-1 flex items-center gap-2 text-neutral-500 text-xs">
              <span>{fmt(e.created_at)}</span>
              <span>{e.actor_name}</span>
            </div>
          </div>
        ))}
        {events.length === 0 && <div className="text-neutral-400 text-sm">No history yet.</div>}
      </div>
    </div>
  );
};

const TaskDetailSlider = ({
  task, onClose, onEdit, onReassign, onRefresh, initialTab = "Task Details",
}: {
  task: any;
  onClose: () => void;
  onEdit: () => void;
  onReassign: () => void;
  onRefresh: () => void;
  initialTab?: TaskDetailTab;
}) => {
  const [tab, setTab] = useState<TaskDetailTab>(initialTab);
  const [t, setT] = useState(task);
  const onUpdated = (u: any) => { setT(u); onRefresh(); };

  useEffect(() => {
    setTab(initialTab);
  }, [initialTab, task.id]);

  return (
    <div className="fixed inset-0 z-50 flex justify-end font-['Stack_Sans_Headline']">
      <div className="flex-1 bg-black/30" onClick={onClose} />
      <div className="w-[800px] max-w-full bg-white h-full flex flex-col">
        {/* header */}
        <div className="px-10 pt-5 shadow-[0px_4px_20px_0px_rgba(0,0,0,0.08)] flex flex-col gap-5 shrink-0">
          <div className="flex justify-between items-center">
            <div className="text-neutral-700 text-base font-weight-600">Task: {t.title}</div>
            <div className="flex items-center gap-3">
              <button type="button" onClick={onEdit} className="px-10 py-4 bg-blue-500 rounded text-white text-base font-weight-500 leading-4">Edit Task</button>
              <button type="button" onClick={onClose} className="px-10 py-4 bg-white rounded outline outline-1 outline-offset-[-1px] outline-blue-500 text-blue-500 text-base font-weight-500 leading-4">Close</button>
            </div>
          </div>
          <div className="flex items-start gap-6">
            {TABS.map((t) => (
              <button key={t} type="button" onClick={() => setTab(t)} className="flex flex-col items-start gap-2 pb-0">
                <span className={`text-sm leading-4 ${tab === t ? "text-neutral-900" : "text-blue-500"}`}>{t}</span>
                <span className={`h-0.5 w-full ${tab === t ? "bg-blue-500" : "bg-transparent"}`} />
              </button>
            ))}
          </div>
        </div>
        {/* body */}
        <div className="flex-1 overflow-auto p-10">
          {tab === "Task Details" && <DetailsTab task={t} onReassign={onReassign} />}
          {tab === "Attachments" && <AttachmentsTab task={t} onUpdated={onUpdated} />}
          {tab === "Notes" && <NotesTab task={t} />}
          {tab === "Task History" && <HistoryTab task={t} />}
        </div>
      </div>
    </div>
  );
};

export default TaskDetailSlider;
