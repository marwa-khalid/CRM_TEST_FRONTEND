import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { Pencil, Ban, Repeat } from "lucide-react";
import {
  getCalendarEvent, updateCalendarEvent, cancelCalendarEvent,
  deleteCalendarEvent, getCalendarEventAudit, type CalendarEvent, type EventAudit,
} from "../../../services/CalendarEvents/CalendarEvents";
import { getAttachmentUrl } from "../../../services/Tasks/Tasks";
import { statusBadgeCls, eventChipCls, REMINDER_OPTIONS } from "./eventMeta";
import { SpinnerLoader } from "../../../claims/common/SpinnerLoader";
import { ConfirmModal } from "../../../claims/common/ConfirmModal";
import TaskAttachmentModal, { fileLogo } from "../TaskAttachmentModal";
import Download from "../../../assets/TaskManagement/Download.svg";
import Delete from "../../../assets/TaskManagement/Delete.svg";
import upload from "../../../assets/TaskManagement/upload.svg";

const TABS = ["Event Details", "Linked Record", "Attachments", "Activity Log"] as const;
type EventTab = (typeof TABS)[number];

const baseName = (p: string) => p.split("/").pop() || p;

const fmtLong = (d?: string | null) => {
  if (!d) return "—";
  const dt = new Date(d + "T00:00:00");
  if (isNaN(dt.getTime())) return d;
  return dt.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};
// Date on the first row, time on the next (used for Starts / Ends).
const dateTimeRows = (d?: string | null, t?: string | null) =>
  d ? (
    <>
      <div>{fmtLong(d)}</div>
      {t ? <div>{t}</div> : null}
    </>
  ) : undefined;
const fmtStamp = (iso?: string | null) =>
  iso
    ? new Date(iso.endsWith("Z") || iso.includes("+") ? iso : iso + "Z").toLocaleString("en-GB", {
        day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
      })
    : "—";

// ─── shared field ────────────────────────────────────────────────────────────────
const Field = ({ label, children }: { label: string; children?: React.ReactNode }) => (
  <div className="w-44 flex flex-col gap-1.5">
    <div className="text-neutral-900 text-sm font-weight-600">{label}</div>
    <div className="text-neutral-500 text-sm font-light break-words">{children || "—"}</div>
  </div>
);

// ─── reminders helpers + edit popup ─────────────────────────────────────────────
const REAL_REMINDERS = REMINDER_OPTIONS.filter((o) => o.value !== "none");
// Parse the comma-separated reminder string. Empty = all four defaults (tasks
// start with every reminder); "none" = don't remind.
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

// Quick reminder editor — multiselect (same checkbox look as the Add/Edit form),
// available even for system events (which can't otherwise be edited).
const ReminderEditModal = ({ initial, onClose, onSave }: {
  initial?: string | null;
  onClose: () => void;
  onSave: (reminder: string) => Promise<void> | void;
}) => {
  const [sel, setSel] = useState<string[]>(() => parseReminders(initial));
  const [saving, setSaving] = useState(false);
  const toggle = (v: string) => {
    setSel((prev) => {
      if (v === "none") return prev.includes("none") ? [] : ["none"]; // exclusive
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
                className={`w-full flex items-center gap-2 p-2.5 rounded text-left ${checked ? "bg-blue-100" : "hover:bg-neutral-50"}`}>
                <span className={`w-5 h-5 rounded shrink-0 ${checked ? "bg-blue-500 border-[6px] border-blue-200" : "bg-neutral-300"}`} />
                <span className="text-neutral-700 text-sm">{o.label}</span>
              </button>
            );
          })}
        </div>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded border border-neutral-300 text-neutral-700 text-sm hover:bg-neutral-50">Cancel</button>
          <button type="button" onClick={save} disabled={saving} className="px-4 py-2 rounded bg-blue-500 text-white text-sm hover:bg-blue-600 disabled:opacity-60">Save</button>
        </div>
      </div>
    </div>
  );
};

// ─── Tab 1: details ──────────────────────────────────────────────────────────────
const DetailsTab = ({
  ev,
  onEditReminder,
  onCancelRecurrence,
}: {
  ev: CalendarEvent;
  onEditReminder?: () => void;
  onCancelRecurrence?: () => void;
}) => (
  <div className="flex flex-col gap-6">
    <div className="flex gap-6">
      <Field label="Event Type">
        <span
          className={`px-2 py-0.5 rounded text-xs font-weight-600 ${eventChipCls(ev.event_type, ev.status)}`}
        >
          {ev.event_type || "Event"}
        </span>
      </Field>
      <Field label="Status">
        <span
          className={`px-2 py-0.5 rounded text-xs font-weight-600 ${statusBadgeCls(ev.status)}`}
        >
          {ev.status || "Scheduled"}
        </span>
      </Field>
    </div>
    <div className="flex gap-6">
      <Field label="Starts">{dateTimeRows(ev.start_date, ev.start_time)}</Field>
      <Field label="Ends">{dateTimeRows(ev.end_date, ev.end_time)}</Field>
    </div>
    <div className="flex gap-6">
      <Field label="Department">{ev.department}</Field>
      <Field label="Location">{ev.location}</Field>
    </div>
    <Field label="Assigned User(s)">
      {(ev.assigned_users || []).join(", ")}
    </Field>
    <div className="flex gap-6">
      <Field label="Reminder">
        <span className="inline-flex items-center gap-2">
          <span>{reminderSummary(ev.reminder)}</span>
          {/* Quick reminder edit is only for system events — manual events use Edit. */}
          {onEditReminder && (
            <button
              type="button"
              onClick={onEditReminder}
              title="Edit reminders"
              className="text-blue-500 hover:text-blue-600 shrink-0"
            >
              <Pencil size={14} />
            </button>
          )}
        </span>
      </Field>
      <Field label="Recurrence">
        {ev.recurrence_rule ? (
          <span className="inline-flex items-center gap-2">
            <span>{ev.recurrence_rule}</span>
            {onCancelRecurrence && (
              <button
                type="button"
                onClick={onCancelRecurrence}
                title="Stop recurrence"
                className="text-blue-500 hover:text-blue-600 shrink-0"
              >
                <Repeat size={14} />
              </button>
            )}
          </span>
        ) : undefined}
      </Field>
    </div>
    <div className="flex flex-col gap-1.5">
      <div className="text-neutral-900 text-sm font-weight-600">
        Description
      </div>
      <div className="text-neutral-500 text-sm font-light whitespace-pre-line">
        {ev.description || "—"}
      </div>
    </div>
    {/* Created / Last Updated (replaces the Activity Log for system events). */}
    <div className="flex gap-6">
      <Field label="Created">{fmtStamp(ev.created_at)}</Field>
      <Field label="Last Updated">{fmtStamp(ev.updated_at)}</Field>
    </div>
  </div>
);

// ─── Tab: attachments ───────────────────────────────────────────────────────────────
const AttachmentsTab = ({
  ev, onUpdated, canEdit,
}: {
  ev: CalendarEvent;
  onUpdated: (e: CalendarEvent) => void;
  canEdit: boolean;
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<string | null>(null);
  const files: string[] = String(ev.attachment_path || "").split(",").map((s) => s.trim()).filter(Boolean);

  const save = async (paths: string[]) => {
    const { data } = await updateCalendarEvent(ev.id, {
      // title is required by the shared create/update schema — send it so the
      // attachment-only PUT validates.
      title: ev.title,
      attachment_path: paths.join(","),
      attachment_name: paths.length ? baseName(paths[0]) : null,
    });
    onUpdated(data);
  };
  const onUploaded = async (uploaded: { path: string; filename: string }[]) => {
    try { await save([...files, ...uploaded.map((u) => u.path)]); toast.success("Attachment Added"); }
    catch { toast.error("Failed to attach file"); }
  };
  const confirmRemove = async () => {
    if (!removeTarget) return;
    try { await save(files.filter((x) => x !== removeTarget)); toast.success("Attachment Deleted"); }
    catch { toast.error("Failed"); }
    finally { setRemoveTarget(null); }
  };
  const open = async (p: string) => {
    try { const { data } = await getAttachmentUrl(p); window.open((data as any)?.url || data, "_blank"); }
    catch { toast.error("Could not open"); }
  };

  return (
    <div className="flex flex-col gap-6">
      {modalOpen && (
        <TaskAttachmentModal onClose={() => setModalOpen(false)} onUploaded={onUploaded} />
      )}
      {canEdit && (
        <div className="flex flex-col gap-4">
          <div className="text-neutral-900 text-base font-weight-600">Upload Attachment</div>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="p-8 rounded-lg outline outline-1 outline-offset-[-1px] outline-neutral-200 flex flex-col items-center gap-3 hover:bg-neutral-50"
          >
            <img src={upload} alt="" />
            <div className="flex flex-col items-center gap-1">
              <span className="text-blue-500 text-sm font-weight-500">Click to upload or drag and drop</span>
              <span className="text-neutral-500 text-xs">JPG, PNG, PDF, CSV, Excel, Word, PPT Supported</span>
            </div>
          </button>
        </div>
      )}
      <div className="flex flex-col gap-3">
        <div className="text-neutral-700 text-base font-weight-600">Attached Files ({files.length})</div>
        {files.length === 0 && <div className="text-neutral-400 text-sm">No attachments yet.</div>}
        {files.map((p) => (
          <div key={p} className="p-3 rounded-lg outline outline-1 outline-offset-[-1px] outline-neutral-200 flex items-center gap-3">
            <img src={fileLogo(p)} alt="" className="w-10 h-10" />
            <div className="flex-1 min-w-0">
              <div className="text-black text-sm font-weight-500 line-clamp-1">{baseName(p)}</div>
            </div>
            <button type="button" onClick={() => open(p)} title="Download" className="text-neutral-500 hover:text-blue-500">
              <img src={Download} alt="" />
            </button>
            {canEdit && (
              <button type="button" onClick={() => setRemoveTarget(p)} title="Remove" className="text-neutral-500 hover:text-red-500">
                <img src={Delete} alt="" />
              </button>
            )}
          </div>
        ))}
      </div>
      {removeTarget && (
        <ConfirmModal
          title="Delete Attachment"
          message="Are you sure you want to delete this attachment?"
          confirmLabel="Delete"
          onCancel={() => setRemoveTarget(null)}
          onConfirm={confirmRemove}
        />
      )}
    </div>
  );
};

// ─── Tab 2: linked record ──────────────────────────────────────────────────────────
const LinkedTab = ({ ev, onViewRecord }: { ev: CalendarEvent; onViewRecord: () => void }) => {
  const claimRef = ev.claim_reference || ev.case_reference; // same thing — show once
  const has = claimRef || ev.case_status || ev.vehicle_registration || ev.task_id;
  if (!has)
    return <div className="text-neutral-400 text-sm">No record is linked to this event.</div>;
  return (
    <div className="flex flex-col gap-6">
      <div className="flex gap-6">
        <Field label="Claim Reference">
          {claimRef ? (
            ev.claim_id ? (
              <button
                type="button"
                onClick={onViewRecord}
                className="text-blue-500 hover:underline text-left"
                title="Open claim record"
              >
                {claimRef}
              </button>
            ) : (
              claimRef
            )
          ) : undefined}
        </Field>
        <Field label="Case Status">{ev.case_status}</Field>
      </div>
      <div className="flex gap-6">
        <Field label="Vehicle Registration">{ev.vehicle_registration}</Field>
        <Field label="Task">{ev.task_id ? `#${ev.task_id}` : undefined}</Field>
      </div>
      {/* {ev.claim_id && (
        <button
          type="button"
          onClick={onViewRecord}
          className="self-start px-4 py-2 rounded bg-blue-500 text-white text-sm hover:bg-blue-600"
        >
          View Claim Record
        </button>
      )} */}
    </div>
  );
};

// ─── Tab 3: activity log ────────────────────────────────────────────────────────────
const ActivityTab = ({ ev, audit }: { ev: CalendarEvent; audit: EventAudit[] }) => (
  <div className="flex flex-col gap-6">
    <div className="flex gap-6">
      <Field label="Created">{fmtStamp(ev.created_at)}</Field>
      <Field label="Last Updated">{fmtStamp(ev.updated_at)}</Field>
    </div>
    <div className="flex flex-col gap-3">
      <div className="text-neutral-700 text-base font-weight-600">Audit Trail</div>
      {audit.length === 0 && <div className="text-neutral-400 text-sm">No activity recorded yet.</div>}
      {audit.map((a) => (
        <div key={a.id} className="p-4 bg-blue-100 rounded-lg flex flex-col gap-1">
          <div className="text-black text-sm font-weight-600 capitalize">{a.action || "Updated"}</div>
          {a.detail && <div className="text-neutral-500 text-sm">{a.detail}</div>}
          <div className="pt-1 text-neutral-500 text-xs">{fmtStamp(a.created_at)}</div>
        </div>
      ))}
    </div>
  </div>
);

const EventDetailsDrawer = ({
  open, eventId, occurrenceDate, occurrenceStatus, onClose, onEdit, onChanged,
}: {
  open: boolean;
  eventId: number | null;
  /** For a recurring series: the specific occurrence date the user opened (YYYY-MM-DD). */
  occurrenceDate?: string | null;
  /** Status of that specific occurrence (may differ from the base series). */
  occurrenceStatus?: string | null;
  onClose: () => void;
  onEdit: (ev: CalendarEvent) => void;
  onChanged: () => void;
}) => {
  const navigate = useNavigate();
  const [ev, setEv] = useState<CalendarEvent | null>(null);
  const [audit, setAudit] = useState<EventAudit[]>([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState<EventTab>("Event Details");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [reminderOpen, setReminderOpen] = useState(false);

  useEffect(() => {
    if (!open || !eventId) return;
    setTab("Event Details");
    setLoading(true);
    getCalendarEvent(eventId)
      .then(({ data }) => setEv(data))
      .catch(() => setEv(null))
      .finally(() => setLoading(false));
    getCalendarEventAudit(eventId)
      .then(({ data }) => setAudit(Array.isArray(data) ? data : []))
      .catch(() => setAudit([]));
  }, [open, eventId]);

  if (!open) return null;

  const isSystem = (ev?.source || "manual") === "system";
  const fromTaskMgmt = ev?.source_type === "task_due" || !!ev?.task_id;
  const isEngineerInspection = ev?.event_type === "Engineer Inspection" || ev?.source_type === "engineer_inspection";
  // Any non-manual event (Task Management deadlines, engineer inspections, other
  // system events) is system-generated: it cannot be edited, completed, cancelled
  // or deleted, and shows the purple "System Generated" pill.
  const isSystemGenerated = isSystem || fromTaskMgmt || isEngineerInspection;
  const editable = !isSystemGenerated;
  // System events have no useful audit trail — drop the Activity Log tab (the
  // Created / Last Updated stamps now live on the Event Details tab instead).
  const visibleTabs = isSystemGenerated ? TABS.filter((t) => t !== "Activity Log") : TABS;
  // For a recurring series, actions target the specific occurrence the user opened
  // (today's standup), never the whole series.
  const recurring = !!ev?.recurrence_rule;
  const occDate = recurring ? (occurrenceDate || ev?.start_date || null) : null;
  // Status shown / acted on: a recurring occurrence may differ from the base series.
  const effStatus = occDate ? (occurrenceStatus || ev?.status) : ev?.status;

  // What we render: a recurring occurrence shows its own date + status, not the base.
  const viewEv: CalendarEvent | null =
    ev && occDate ? { ...ev, start_date: occDate, end_date: occDate, status: effStatus } : ev;

  const badge = isSystemGenerated
    ? { cls: "bg-purple-100 text-purple-600", label: "System Generated" }
    : { cls: "bg-blue-100 text-blue-600", label: "Manual Event" };

  const act = async (fn: () => Promise<any>, ok: string) => {
    setBusy(true);
    try { await fn(); toast.success(ok); onChanged(); onClose(); }
    catch { toast.error("Action failed"); }
    finally { setBusy(false); }
  };

  const viewRecord = () => {
    if (ev?.claim_id) { navigate(`/add-claim/${ev.claim_id}`); return; }
    toast.info("No linked claim record on this event");
  };

  // Quick reminder update (works for system events too, which can't otherwise be edited).
  const saveReminder = async (reminder: string) => {
    if (!ev) return;
    setBusy(true);
    try {
      const { data } = await updateCalendarEvent(ev.id, { title: ev.title, reminder });
      setEv(data);
      onChanged();
      toast.success("Reminders updated");
    } catch {
      toast.error("Action failed");
    } finally {
      setBusy(false);
    }
  };

  // Turn a recurring event into a one-off (clears the recurrence rule) without
  // having to open Edit and change the dropdown. Stays on the drawer.
  const cancelRecurrence = async () => {
    if (!ev) return;
    setBusy(true);
    try {
      const { data } = await updateCalendarEvent(ev.id, { title: ev.title, recurrence_rule: null });
      setEv(data);
      onChanged();
      getCalendarEventAudit(ev.id)
        .then(({ data }) => setAudit(Array.isArray(data) ? data : []))
        .catch(() => {});
      toast.success("Recurrence cancelled");
    } catch {
      toast.error("Action failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex justify-end font-['Stack_Sans_Headline']">
      {(loading || busy) && <SpinnerLoader />}
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full max-w-[560px] h-full bg-white shadow-xl flex flex-col">
        {/* header */}
        <div className="px-6 pt-5 shadow-[0px_4px_20px_0px_rgba(0,0,0,0.08)] flex flex-col gap-5 shrink-0">
          <div className="flex justify-between items-start gap-3">
            <div className="flex flex-col gap-2 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-neutral-700 text-base font-weight-600 truncate">
                  {ev?.title || "Event Details"}
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-weight-600 shrink-0 ${badge.cls}`}
                >
                  {badge.label}
                </span>
                {recurring && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-weight-600 shrink-0 bg-indigo-100 text-indigo-600">
                    Recurring{occDate ? ` · ${fmtLong(occDate)}` : ""}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              {editable && (
                <button
                  type="button"
                  onClick={() => ev && onEdit(ev)}
                  className="px-6 py-3 bg-blue-500 rounded text-white text-sm font-weight-500 leading-4 hover:bg-blue-600"
                >
                  Edit
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 bg-white rounded outline outline-1 outline-offset-[-1px] outline-blue-500 text-blue-500 text-sm font-weight-500 leading-4 hover:bg-blue-50"
              >
                Close
              </button>
            </div>
          </div>
          <div className="flex items-start gap-6">
            {visibleTabs.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className="flex flex-col items-start gap-2 pb-0"
              >
                <span
                  className={`text-sm leading-4 whitespace-nowrap ${tab === t ? "text-neutral-900" : "text-blue-500"}`}
                >
                  {t}
                </span>
                <span
                  className={`h-0.5 w-full ${tab === t ? "bg-blue-500" : "bg-transparent"}`}
                />
              </button>
            ))}
          </div>
        </div>

        {/* body */}
        <div className="flex-1 overflow-auto p-6 flex flex-col gap-4">
          {recurring && (
            <div className="px-3 py-2 rounded bg-blue-50 text-blue-500 text-xs">
              This is a recurring event. Complete, cancel or delete here affects
              <span className="font-weight-600">
                {" "}
                only this occurrence{occDate ? ` (${fmtLong(occDate)})` : ""}
              </span>{" "}
              — the rest of the series stays unchanged.
            </div>
          )}
          {viewEv && tab === "Event Details" && (
            <DetailsTab
              ev={viewEv}
              onEditReminder={isSystemGenerated ? () => setReminderOpen(true) : undefined}
              onCancelRecurrence={recurring && editable ? cancelRecurrence : undefined}
            />
          )}
          {viewEv && tab === "Linked Record" && (
            <LinkedTab ev={viewEv} onViewRecord={viewRecord} />
          )}
          {ev && tab === "Attachments" && (
            <AttachmentsTab ev={ev} canEdit={editable} onUpdated={(u) => {
              setEv(u);
              onChanged();
              // Refresh the audit so the attachment entry shows in Activity Log.
              getCalendarEventAudit(u.id).then(({ data }) => setAudit(Array.isArray(data) ? data : [])).catch(() => {});
            }} />
          )}
          {viewEv && tab === "Activity Log" && (
            <ActivityTab ev={viewEv} audit={audit} />
          )}
        </div>

        {/* actions */}
        <div className="border-t border-neutral-100 px-6 py-4 flex items-center justify-between shrink-0">
          {editable ? (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="px-3 py-2 rounded text-red-500 border border-red-500 text-sm hover:bg-red-100"
            >
              Delete
            </button>
          ) : <span />}
          <div className="flex items-center gap-2">
            {ev?.claim_id && (
              <button
                type="button"
                onClick={viewRecord}
                className="px-4 py-2 rounded border border-blue-500 text-blue-500 text-sm hover:bg-blue-50"
              >
                View Claim
              </button>
            )}
            {editable && effStatus !== "Cancelled" && effStatus !== "Completed" && (
              <button
                type="button"
                onClick={() =>
                  ev &&
                  act(
                    () => cancelCalendarEvent(ev.id, occDate),
                    "Event cancelled",
                  )
                }
                className="px-4 py-2 rounded border border-neutral-500 text-neutral-500 text-sm hover:bg-neutral-100"
              >
                Cancel Event
              </button>
            )}
          </div>
        </div>
      </div>

      {confirmDelete && (
        <ConfirmModal
          title={recurring ? "Delete This Occurrence" : "Delete Event"}
          message={
            recurring
              ? `This removes only the ${occDate ? fmtLong(occDate) + " " : ""}occurrence. The rest of the recurring series stays unchanged.`
              : "Are you sure you want to delete this event?"
          }
          confirmLabel="Delete"
          onCancel={() => setConfirmDelete(false)}
          onConfirm={() => {
            setConfirmDelete(false);
            ev &&
              act(() => deleteCalendarEvent(ev.id, occDate), "Event deleted");
          }}
        />
      )}

      {reminderOpen && ev && (
        <ReminderEditModal
          initial={ev.reminder}
          onClose={() => setReminderOpen(false)}
          onSave={saveReminder}
        />
      )}
    </div>
  );
};

export default EventDetailsDrawer;
