import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { Pencil, Repeat, Download, Trash2, Upload } from "lucide-react";
import {
  getCalendarEvent, getCalendarEventAudit, updateCalendarEvent, cancelCalendarEvent,
  deleteCalendarEvent, uploadEventAttachment, REMINDER_OPTIONS,
  type FleetEvent, type FleetEventAudit,
} from "../services/eventService";
import { getFleetAttachmentUrl } from "../services/taskService";
import { getFleetVehicles } from "../services/dashboardService";
import { fileTypeIcon } from "../utils/fileIcon";
import FleetSpinnerLoader from "./FleetSpinnerLoader";
import FleetConfirmModal from "./FleetConfirmModal";

const TABS = ["Event Details", "Linked Record", "Attachments", "Activity Log"] as const;
type EventTab = (typeof TABS)[number];

const baseName = (p: string) => p.split("/").pop() || p;
const splitPaths = (v?: string | null): string[] => (v || "").split(",").map((s) => s.trim()).filter(Boolean);

const fmtLong = (d?: string | null) => {
  if (!d) return "—";
  const dt = new Date(d + "T00:00:00");
  return isNaN(dt.getTime()) ? d : dt.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};
const fmtStamp = (iso?: string | null) =>
  iso
    ? new Date(iso.endsWith("Z") || iso.includes("+") ? iso : iso + "Z").toLocaleString("en-GB", {
        day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
      })
    : "—";
const dateTimeRows = (d?: string | null, t?: string | null) =>
  d ? (<><div>{fmtLong(d)}</div>{t ? <div>{t}</div> : null}</>) : undefined;

// Black-theme status / type chips (no blue).
const statusBadgeCls = (status?: string | null): string => {
  const s = (status || "").toLowerCase();
  if (s === "completed") return "bg-purple-100 text-purple-600";
  if (s === "cancelled" || s === "rejected") return "bg-neutral-100 text-neutral-500";
  return "bg-neutral-100 text-neutral-700"; // Scheduled
};
const eventChipCls = (status?: string | null): string => {
  const s = (status || "").toLowerCase();
  if (s === "cancelled" || s === "rejected") return "bg-neutral-100 text-neutral-400 line-through";
  if (s === "completed") return "bg-purple-100 text-purple-600";
  return "bg-neutral-100 text-neutral-700";
};
const vehicleStatusPillCls = (status?: string | null): string => {
  const s = (status || "").toLowerCase().replace(/_/g, " ");
  if (!s || s === "—" || s === "-") return "bg-neutral-100 text-neutral-500";
  if (s.includes("available")) return "bg-[#d9ffd9] text-[#159215]";
  if (s.includes("weekly hire") || s.includes("on hire")) return "bg-neutral-100 text-neutral-800";
  if (s.includes("service")) return "bg-blue-100 text-blue-700";
  if (s.includes("repair")) return "bg-[#ffe9d8] text-[#ff7402]";
  if (s.includes("sale")) return "bg-pink-100 text-pink-700";
  if (s.includes("off fleet") || s.includes("off hire")) return "bg-teal-100 text-teal-700";
  if (s.includes("plating")) return "bg-violet-100 text-violet-700";
  if (s.includes("de fleet")) return "bg-rose-100 text-rose-700";
  return "bg-neutral-100 text-neutral-700";
};
const VehicleStatusPill: React.FC<{ status?: string | null }> = ({ status }) => (
  <span className={`inline-flex w-fit items-center rounded px-2 py-1 text-xs font-weight-600 ${vehicleStatusPillCls(status)}`}>
    {status || "—"}
  </span>
);

// ── reminders helpers ─────────────────────────────────────────────────────────
const REAL_REMINDERS = REMINDER_OPTIONS.filter((o) => o.value !== "none");
const parseReminders = (raw?: string | null): string[] => {
  const vals = String(raw || "").split(",").map((s) => s.trim()).filter(Boolean);
  if (vals.includes("none")) return ["none"];
  const real = vals.filter((v) => v !== "none");
  return real.length ? real : REAL_REMINDERS.map((o) => o.value);
};
const reminderSummary = (raw?: string | null): string => {
  const vals = parseReminders(raw);
  if (vals.includes("none")) return "Don't remind me";
  return vals.map((v) => REMINDER_OPTIONS.find((o) => o.value === v)?.label || v).join(", ");
};

// Quick reminder editor (available even for system events, which can't be edited).
const ReminderEditModal: React.FC<{ initial?: string | null; onClose: () => void; onSave: (reminder: string) => Promise<void> | void }> = ({ initial, onClose, onSave }) => {
  const [sel, setSel] = useState<string[]>(() => parseReminders(initial));
  const [saving, setSaving] = useState(false);
  const toggle = (v: string) => {
    setSel((prev) => {
      if (v === "none") return prev.includes("none") ? [] : ["none"];
      const without = prev.filter((x) => x !== "none");
      return without.includes(v) ? without.filter((x) => x !== v) : [...without, v];
    });
  };
  const save = async () => {
    setSaving(true);
    try { await onSave(sel.includes("none") ? "none" : sel.join(",")); onClose(); }
    finally { setSaving(false); }
  };
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-[360px] bg-white rounded-lg p-5 flex flex-col gap-4" onClick={(e) => e.stopPropagation()}>
        <div className="text-neutral-900 text-base font-weight-600">Edit Reminders</div>
        <div className="flex flex-col gap-1">
          {REMINDER_OPTIONS.map((o) => {
            const checked = sel.includes(o.value);
            return (
              <button key={o.value} type="button" onClick={() => toggle(o.value)}
                className={`w-full flex items-center gap-2 p-2.5 rounded text-left ${checked ? "bg-neutral-100" : "hover:bg-neutral-50"}`}>
                <span className={`w-5 h-5 rounded shrink-0 ${checked ? "bg-neutral-900 border-[6px] border-neutral-300" : "bg-neutral-300"}`} />
                <span className="text-neutral-700 text-sm">{o.label}</span>
              </button>
            );
          })}
        </div>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded border border-neutral-300 text-neutral-700 text-sm hover:bg-neutral-50">Cancel</button>
          <button type="button" onClick={save} disabled={saving} className="px-4 py-2 rounded bg-neutral-900 text-white text-sm hover:bg-black disabled:opacity-60">Save</button>
        </div>
      </div>
    </div>
  );
};

// ── shared field ──────────────────────────────────────────────────────────────
const Field: React.FC<{ label: string; children?: React.ReactNode }> = ({ label, children }) => (
  <div className="w-44 flex flex-col gap-1.5">
    <div className="text-neutral-900 text-sm font-weight-600">{label}</div>
    <div className="text-neutral-500 text-sm font-light break-words">{children || "—"}</div>
  </div>
);

// ── Tab 1: details ──────────────────────────────────────────────────────────────
const DetailsTab: React.FC<{ ev: FleetEvent; onEditReminder?: () => void; onCancelRecurrence?: () => void }> = ({ ev, onEditReminder, onCancelRecurrence }) => (
  <div className="flex flex-col gap-6">
    <div className="flex gap-6">
      <Field label="Event Type"><span className={`px-2 py-0.5 rounded text-xs font-weight-600 ${eventChipCls(ev.status)}`}>{ev.event_type || "Event"}</span></Field>
      <Field label="Status"><span className={`px-2 py-0.5 rounded text-xs font-weight-600 ${statusBadgeCls(ev.status)}`}>{ev.status || "Scheduled"}</span></Field>
    </div>
    <div className="flex gap-6">
      <Field label="Starts">{dateTimeRows(ev.start_date, ev.start_time)}</Field>
      <Field label="Ends">{dateTimeRows(ev.end_date, ev.end_time)}</Field>
    </div>
    <div className="flex gap-6">
      <Field label="Department">{ev.department}</Field>
      <Field label="Location">{ev.location}</Field>
    </div>
    <Field label="Assigned User(s)">{(ev.assigned_users || []).join(", ")}</Field>
    <div className="flex gap-6">
      <Field label="Reminder">
        <span className="inline-flex items-center gap-2">
          <span>{reminderSummary(ev.reminder)}</span>
          {onEditReminder && (
            <button type="button" onClick={onEditReminder} title="Edit reminders" className="text-neutral-700 hover:text-neutral-900 shrink-0"><Pencil size={14} /></button>
          )}
        </span>
      </Field>
      <Field label="Recurrence">
        {ev.recurrence_rule ? (
          <span className="inline-flex items-center gap-2">
            <span>{ev.recurrence_rule}</span>
            {onCancelRecurrence && (
              <button type="button" onClick={onCancelRecurrence} title="Stop recurrence" className="text-neutral-700 hover:text-neutral-900 shrink-0"><Repeat size={14} /></button>
            )}
          </span>
        ) : undefined}
      </Field>
    </div>
    <div className="flex flex-col gap-1.5">
      <div className="text-neutral-900 text-sm font-weight-600">Description</div>
      <div className="text-neutral-500 text-sm font-light whitespace-pre-line">{ev.description || "—"}</div>
    </div>
    <div className="flex gap-6">
      <Field label="Created">{fmtStamp(ev.created_at)}</Field>
      <Field label="Last Updated">{fmtStamp(ev.updated_at)}</Field>
    </div>
  </div>
);

// ── Tab 2: linked record (module-aware) ────────────────────────────────────────
// Skyline events link a Skyline (hire) reference; Vehicle Management events show
// only the vehicle registration + that vehicle's status.
const LinkedTab: React.FC<{ ev: FleetEvent; isVehicles: boolean; vehicleStatus: string }> = ({ ev, isVehicles, vehicleStatus }) => {
  if (isVehicles) {
    if (!ev.vehicle_registration) return <div className="text-neutral-400 text-sm">No vehicle is linked to this event.</div>;
    return (
      <div className="flex flex-col gap-6">
        <div className="flex gap-6">
          <Field label="Vehicle Registration">{ev.vehicle_registration}</Field>
          <Field label="Status"><VehicleStatusPill status={vehicleStatus} /></Field>
        </div>
      </div>
    );
  }
  const skyRef = ev.claim_reference || ev.case_reference;
  if (!skyRef && !ev.vehicle_registration) return <div className="text-neutral-400 text-sm">No record is linked to this event.</div>;
  return (
    <div className="flex flex-col gap-6">
      <div className="flex gap-6">
        <Field label="Skyline Reference">{skyRef}</Field>
        <Field label="Vehicle Registration">{ev.vehicle_registration}</Field>
      </div>
    </div>
  );
};

// ── Tab 3: attachments ────────────────────────────────────────────────────────
const AttachmentsTab: React.FC<{ ev: FleetEvent; onUpdated: (e: FleetEvent) => void; canEdit: boolean }> = ({ ev, onUpdated, canEdit }) => {
  const [removeTarget, setRemoveTarget] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const files = splitPaths(ev.attachment_path);

  const save = async (paths: string[]) => {
    const updated = await updateCalendarEvent(ev.id, {
      title: ev.title,
      attachment_path: paths.join(","),
      attachment_name: paths.length ? baseName(paths[0]) : null,
    });
    if (updated) onUpdated(updated);
  };
  const onPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = Array.from(e.target.files || []);
    if (list.length === 0) return;
    setBusy(true);
    try {
      const uploaded = (await Promise.all(list.map((f) => uploadEventAttachment(f)))).filter(Boolean) as { path: string }[];
      if (uploaded.length) { await save([...files, ...uploaded.map((u) => u.path)]); toast.success("Attachment added."); }
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
      {busy && <FleetSpinnerLoader />}
      {canEdit && (
        <div className="flex flex-col gap-4">
          <div className="text-neutral-900 text-base font-weight-600">Upload Attachment</div>
          <button type="button" onClick={() => inputRef.current?.click()} className="p-8 rounded-lg border border-neutral-200 flex flex-col items-center gap-3 hover:bg-neutral-50">
            <Upload size={22} className="text-neutral-500" />
            <div className="flex flex-col items-center gap-1">
              <span className="text-neutral-900 text-sm font-weight-500">Click to upload</span>
              <span className="text-neutral-500 text-xs">JPG, PNG, PDF, CSV, Excel, Word, PPT supported</span>
            </div>
          </button>
        </div>
      )}
      <div className="flex flex-col gap-3">
        <div className="text-neutral-700 text-base font-weight-600">Attached Files ({files.length})</div>
        {files.length === 0 && <div className="text-neutral-400 text-sm">No attachments yet.</div>}
        {files.map((p) => (
          <div key={p} className="p-3 rounded-lg border border-neutral-200 flex items-center gap-3">
            <img src={fileTypeIcon(p)} alt="" className="w-10 h-10 shrink-0" />
            <div className="flex-1 min-w-0"><div className="text-neutral-900 text-sm font-weight-500 line-clamp-1">{baseName(p)}</div></div>
            <button type="button" onClick={() => open(p)} title="Download" className="p-1.5 text-neutral-500 hover:text-neutral-900"><Download size={16} /></button>
            {canEdit && <button type="button" onClick={() => setRemoveTarget(p)} title="Remove" className="p-1.5 text-neutral-500 hover:text-red-500"><Trash2 size={16} /></button>}
          </div>
        ))}
      </div>
      {removeTarget && (
        <FleetConfirmModal title="Remove Attachment" message="Are you sure you want to remove this attachment?" confirmLabel="Remove" onCancel={() => setRemoveTarget(null)} onConfirm={confirmRemove} />
      )}
    </div>
  );
};

// ── Tab 4: activity log ─────────────────────────────────────────────────────────
const ActivityTab: React.FC<{ ev: FleetEvent; audit: FleetEventAudit[] }> = ({ ev, audit }) => (
  <div className="flex flex-col gap-6">
    <div className="flex gap-6">
      <Field label="Created">{fmtStamp(ev.created_at)}</Field>
      <Field label="Last Updated">{fmtStamp(ev.updated_at)}</Field>
    </div>
    <div className="flex flex-col gap-3">
      <div className="text-neutral-700 text-base font-weight-600">Audit Trail</div>
      {audit.length === 0 && <div className="text-neutral-400 text-sm">No activity recorded yet.</div>}
      {audit.map((a) => (
        <div key={a.id} className="p-4 bg-neutral-100 rounded-lg flex flex-col gap-1">
          <div className="text-neutral-900 text-sm font-weight-600 capitalize">{a.action || "Updated"}</div>
          {a.detail && <div className="text-neutral-500 text-sm">{a.detail}</div>}
          <div className="pt-1 text-neutral-500 text-xs">{fmtStamp(a.created_at)}</div>
        </div>
      ))}
    </div>
  </div>
);

const FleetEventDetailSlider: React.FC<{
  eventId: number;
  /** For a recurring series: the specific occurrence date the user opened (YYYY-MM-DD). */
  occurrenceDate?: string | null;
  /** Status of that specific occurrence (may differ from the base series). */
  occurrenceStatus?: string | null;
  onClose: () => void;
  onEdit: (ev: FleetEvent) => void;
  onChanged: () => void;
  /** Calendar context — "vehicles" (VM) or "skyline". Authoritative for the Linked Record
   *  tab, so a VM event shows only the vehicle reg + status (never the Skyline Reference),
   *  even if the event's own stored module is unset. */
  module?: string;
}> = ({ eventId, occurrenceDate, occurrenceStatus, onClose, onEdit, onChanged, module }) => {
  const navigate = useNavigate();
  const [ev, setEv] = useState<FleetEvent | null>(null);
  const [audit, setAudit] = useState<FleetEventAudit[]>([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState<EventTab>("Event Details");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [reminderOpen, setReminderOpen] = useState(false);
  const [vehicleStatus, setVehicleStatus] = useState("—");
  const [tabLoading, setTabLoading] = useState(false);

  // Brief grey overlay on tab switch so async tab content doesn't flash/glitch in.
  const switchTab = (t: EventTab) => { setTab(t); setTabLoading(true); };
  useEffect(() => {
    if (!tabLoading) return;
    const id = setTimeout(() => setTabLoading(false), 350);
    return () => clearTimeout(id);
  }, [tabLoading]);

  const reloadAudit = (id: number) => getCalendarEventAudit(id).then(setAudit).catch(() => setAudit([]));
  useEffect(() => {
    setTab("Event Details");
    setLoading(true);
    getCalendarEvent(eventId).then((e) => setEv(e)).finally(() => setLoading(false));
    reloadAudit(eventId);
  }, [eventId]);

  // Vehicle Management events show the linked vehicle's live status in Linked Record.
  useEffect(() => {
    if ((module || ev?.module) !== "vehicles" || !ev?.vehicle_registration) { setVehicleStatus("—"); return; }
    const norm = (r: string) => r.replace(/\s+/g, "").toUpperCase();
    getFleetVehicles().then((rows) => {
      const match = rows.find((v) => norm(v.registration) === norm(ev.vehicle_registration || ""));
      setVehicleStatus(match?.statusLabel || "—");
    });
  }, [module, ev?.module, ev?.vehicle_registration]);

  const isSystem = (ev?.source || "manual") === "system";
  const fromTaskMgmt = ev?.source_type === "task_due" || !!ev?.task_id;
  const isEngineerInspection = ev?.event_type === "Engineer Inspection" || ev?.source_type === "engineer_inspection";
  const isSystemGenerated = isSystem || fromTaskMgmt || isEngineerInspection;
  const editable = !isSystemGenerated;
  const visibleTabs = isSystemGenerated ? TABS.filter((t) => t !== "Activity Log") : TABS;
  const recurring = !!ev?.recurrence_rule;
  const isVehicles = (module || ev?.module) === "vehicles";
  const occDate = recurring ? (occurrenceDate || ev?.start_date || null) : null;
  const effStatus = occDate ? (occurrenceStatus || ev?.status) : ev?.status;
  const viewEv: FleetEvent | null = ev && occDate ? { ...ev, start_date: occDate, end_date: occDate, status: effStatus } : ev;

  const badge = isSystemGenerated
    ? { cls: "bg-purple-100 text-purple-600", label: "System Generated" }
    : { cls: "bg-neutral-100 text-neutral-700", label: "Manual Event" };

  const act = async (fn: () => Promise<unknown>, ok: string) => {
    setBusy(true);
    try { await fn(); toast.success(ok); onChanged(); onClose(); }
    catch { toast.error("Action failed."); }
    finally { setBusy(false); }
  };
  const viewRecord = () => {
    if (ev?.claim_id) { navigate(`/add-claim/${ev.claim_id}`); return; }
    toast.info("No linked claim record on this event.");
  };
  const saveReminder = async (reminder: string) => {
    if (!ev) return;
    setBusy(true);
    try { const u = await updateCalendarEvent(ev.id, { title: ev.title, reminder }); if (u) setEv(u); onChanged(); toast.success("Reminders updated."); }
    catch { toast.error("Action failed."); }
    finally { setBusy(false); }
  };
  const cancelRecurrence = async () => {
    if (!ev) return;
    setBusy(true);
    try { const u = await updateCalendarEvent(ev.id, { title: ev.title, recurrence_rule: null }); if (u) setEv(u); onChanged(); reloadAudit(ev.id); toast.success("Recurrence cancelled."); }
    catch { toast.error("Action failed."); }
    finally { setBusy(false); }
  };

  return (
    <div className="fixed inset-0 z-[60] flex justify-end font-['Stack_Sans_Headline']">
      {(loading || busy || tabLoading) && <FleetSpinnerLoader />}
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full max-w-[560px] h-full bg-white shadow-xl flex flex-col">
        {/* header */}
        <div className="px-6 pt-5 shadow-[0px_4px_20px_0px_rgba(0,0,0,0.08)] flex flex-col gap-5 shrink-0">
          <div className="flex justify-between items-start gap-3">
            <div className="flex items-center gap-2 min-w-0 flex-wrap">
              <span className="text-neutral-700 text-base font-weight-600 truncate">{ev?.title || "Event Details"}</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-weight-600 shrink-0 ${badge.cls}`}>{badge.label}</span>
              {recurring && (
                <span className="px-2 py-0.5 rounded text-[10px] font-weight-600 shrink-0 bg-neutral-100 text-neutral-600">Recurring</span>
              )}
            </div>
            <div className="flex items-center gap-3 shrink-0">
              {editable && <button type="button" onClick={() => ev && onEdit(ev)} className="px-6 py-3 bg-neutral-900 rounded text-white text-sm font-weight-500 leading-4 hover:bg-black">Edit</button>}
              <button type="button" onClick={onClose} className="px-6 py-3 bg-white rounded border border-neutral-300 text-neutral-700 text-sm font-weight-500 leading-4 hover:bg-neutral-50">Close</button>
            </div>
          </div>
          <div className="flex items-start gap-6">
            {visibleTabs.map((t) => (
              <button key={t} type="button" onClick={() => switchTab(t)} className="flex flex-col items-start gap-2 pb-0">
                <span className={`text-sm leading-4 whitespace-nowrap ${tab === t ? "text-neutral-900 font-weight-600" : "text-neutral-500 hover:text-neutral-700"}`}>{t}</span>
                <span className={`h-0.5 w-full ${tab === t ? "bg-neutral-900" : "bg-transparent"}`} />
              </button>
            ))}
          </div>
        </div>

        {/* body */}
        <div className="flex-1 overflow-auto p-6 flex flex-col gap-4">
          {recurring && (
            <div className="px-3 py-2 rounded bg-neutral-100 text-neutral-600 text-xs">
              This is a recurring event. Complete, cancel or delete here affects
              <span className="font-weight-600"> only this occurrence{occDate ? ` (${fmtLong(occDate)})` : ""}</span> — the rest of the series stays unchanged.
            </div>
          )}
          {viewEv && tab === "Event Details" && (
            <DetailsTab ev={viewEv} onEditReminder={isSystemGenerated ? () => setReminderOpen(true) : undefined} onCancelRecurrence={recurring && editable ? cancelRecurrence : undefined} />
          )}
          {viewEv && tab === "Linked Record" && <LinkedTab ev={viewEv} isVehicles={isVehicles} vehicleStatus={vehicleStatus} />}
          {ev && tab === "Attachments" && (
            <AttachmentsTab ev={ev} canEdit={editable} onUpdated={(u) => { setEv(u); onChanged(); reloadAudit(u.id); }} />
          )}
          {viewEv && tab === "Activity Log" && <ActivityTab ev={viewEv} audit={audit} />}
        </div>

        {/* actions */}
        <div className="border-t border-neutral-100 px-6 py-4 flex items-center justify-between shrink-0">
          {editable ? (
            <button type="button" onClick={() => setConfirmDelete(true)} className="px-3 py-2 rounded text-red-500 border border-red-500 text-sm hover:bg-red-50">Delete</button>
          ) : <span />}
          <div className="flex items-center gap-2">
            {ev?.claim_id && (
              <button type="button" onClick={viewRecord} className="px-4 py-2 rounded border border-neutral-500 text-neutral-700 text-sm hover:bg-neutral-100">View Claim</button>
            )}
            {editable && effStatus !== "Cancelled" && effStatus !== "Completed" && (
              <button type="button" onClick={() => ev && act(() => cancelCalendarEvent(ev.id, occDate), "Event cancelled.")} className="px-4 py-2 rounded border border-neutral-500 text-neutral-700 text-sm hover:bg-neutral-100">Cancel Event</button>
            )}
          </div>
        </div>
      </div>

      {confirmDelete && (
        <FleetConfirmModal
          title={recurring ? "Delete This Occurrence" : "Delete Event"}
          message={recurring
            ? `This removes only the ${occDate ? fmtLong(occDate) + " " : ""}occurrence. The rest of the recurring series stays unchanged.`
            : "Are you sure you want to delete this event?"}
          confirmLabel="Delete"
          onCancel={() => setConfirmDelete(false)}
          onConfirm={() => { setConfirmDelete(false); if (ev) act(() => deleteCalendarEvent(ev.id, occDate), "Event deleted."); }}
        />
      )}
      {reminderOpen && ev && (
        <ReminderEditModal initial={ev.reminder} onClose={() => setReminderOpen(false)} onSave={saveReminder} />
      )}
    </div>
  );
};

export default FleetEventDetailSlider;
