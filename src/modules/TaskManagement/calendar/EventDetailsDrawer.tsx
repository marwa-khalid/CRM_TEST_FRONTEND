import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  getCalendarEvent, completeCalendarEvent, cancelCalendarEvent, deleteCalendarEvent,
  getCalendarEventAudit, type CalendarEvent, type EventAudit,
} from "../../../services/CalendarEvents/CalendarEvents";
import { getAttachmentUrl } from "../../../services/Tasks/Tasks";
import { statusBadgeCls } from "./eventMeta";
import { SpinnerLoader } from "../../../components/common/SpinnerLoader";

const Row = ({ label, value }: { label: string; value?: React.ReactNode }) =>
  value ? (
    <div className="flex flex-col gap-0.5 py-2 border-b border-neutral-50 last:border-0">
      <span className="text-neutral-400 text-xs">{label}</span>
      <span className="text-neutral-800 text-sm">{value}</span>
    </div>
  ) : null;

const fmtDateTime = (d?: string | null, t?: string | null) =>
  d ? `${d}${t ? ` ${t}` : ""}` : "—";

const EventDetailsDrawer = ({
  open, eventId, onClose, onEdit, onChanged,
}: {
  open: boolean;
  eventId: number | null;
  onClose: () => void;
  onEdit: (ev: CalendarEvent) => void;
  onChanged: () => void;
}) => {
  const navigate = useNavigate();
  const [ev, setEv] = useState<CalendarEvent | null>(null);
  const [audit, setAudit] = useState<EventAudit[]>([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open || !eventId) return;
    setLoading(true);
    getCalendarEvent(eventId)
      .then(({ data }) => setEv(data))
      .catch(() => setEv(null))
      .finally(() => setLoading(false));
    getCalendarEventAudit(eventId).then(({ data }) => setAudit(Array.isArray(data) ? data : [])).catch(() => setAudit([]));
  }, [open, eventId]);

  if (!open) return null;

  const isSystem = (ev?.source || "manual") === "system";

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

  const openAttachment = async () => {
    if (!ev?.attachment_path) return;
    try {
      const { data } = await getAttachmentUrl(ev.attachment_path);
      if (data?.url) window.open(data.url, "_blank");
    } catch { toast.error("Could not open attachment"); }
  };

  return (
    <div className="fixed inset-0 z-[60] flex justify-end font-['Stack_Sans_Headline']">
      {(loading || busy) && <SpinnerLoader />}
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full max-w-[460px] h-full bg-white shadow-xl flex flex-col">
        <div className="h-16 px-6 flex items-center justify-between border-b border-neutral-100 shrink-0">
          <div className="flex items-center gap-2">
            <h2 className="text-black text-lg font-weight-600">Event Details</h2>
            <span className={`px-2 py-0.5 rounded text-[10px] font-weight-600 ${isSystem ? "bg-purple-100 text-purple-600" : "bg-blue-100 text-blue-600"}`}>
              {isSystem ? "System Generated" : "Manual Event"}
            </span>
          </div>
          <button type="button" onClick={onClose} className="text-neutral-400 hover:text-neutral-700 text-xl leading-none">×</button>
        </div>

        {ev && (
          <div className="flex-1 overflow-auto p-6 flex flex-col">
            <div className="flex items-start justify-between gap-3 mb-2">
              <h3 className="text-neutral-900 text-base font-weight-600">{ev.title}</h3>
              <span className={`px-2 py-0.5 rounded text-[11px] font-weight-600 shrink-0 ${statusBadgeCls(ev.status)}`}>
                {ev.status || "Scheduled"}
              </span>
            </div>

            <Row label="Event Type" value={ev.event_type} />
            <Row label="Start" value={fmtDateTime(ev.start_date, ev.start_time)} />
            <Row label="End" value={fmtDateTime(ev.end_date, ev.end_time)} />
            <Row label="Assigned User(s)" value={(ev.assigned_users || []).join(", ") || "—"} />
            <Row label="Department" value={ev.department} />
            <Row label="Location" value={ev.location} />
            <Row label="Reminder" value={ev.reminder} />
            <Row label="Recurrence" value={ev.recurrence_rule} />
            <Row label="Description" value={ev.description} />

            {(ev.claim_reference || ev.claimant_name || ev.case_status || ev.vehicle_registration || ev.case_reference || ev.task_id) && (
              <div className="mt-4 mb-1">
                <span className="text-neutral-500 text-xs font-weight-600 uppercase tracking-wide">Linked Record</span>
              </div>
            )}
            <Row label="Claim Reference" value={ev.claim_reference} />
            <Row label="Claimant Name" value={ev.claimant_name} />
            <Row label="Case Status" value={ev.case_status} />
            <Row label="Case Reference" value={ev.case_reference} />
            <Row label="Vehicle Registration" value={ev.vehicle_registration} />
            <Row label="Task" value={ev.task_id ? `#${ev.task_id}` : undefined} />

            {ev.attachment_name && (
              <Row label="Attachment" value={
                <button type="button" onClick={openAttachment} className="text-blue-500 hover:underline">
                  {ev.attachment_name}
                </button>
              } />
            )}

            <Row label="Created" value={ev.created_at ? new Date(ev.created_at).toLocaleString() : undefined} />
            <Row label="Last Updated" value={ev.updated_at ? new Date(ev.updated_at).toLocaleString() : undefined} />

            {audit.length > 0 && (
              <div className="mt-4">
                <span className="text-neutral-500 text-xs font-weight-600 uppercase tracking-wide">Activity</span>
                <div className="mt-2 flex flex-col gap-1.5">
                  {audit.map((a) => (
                    <div key={a.id} className="flex items-center gap-2 text-xs text-neutral-500">
                      <span className="capitalize text-neutral-700 font-weight-500">{a.action}</span>
                      <span className="text-neutral-300">·</span>
                      <span>{a.created_at ? new Date(a.created_at).toLocaleString() : ""}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="border-t border-neutral-100 p-4 flex flex-wrap gap-2 shrink-0">
          {ev?.claim_id && (
            <button type="button" onClick={viewRecord} className="px-4 py-2 rounded bg-blue-500 text-white text-sm hover:bg-blue-600">View Record</button>
          )}
          <button type="button" onClick={() => ev && onEdit(ev)} className="px-4 py-2 rounded border border-blue-500 text-blue-500 text-sm hover:bg-blue-50">Edit</button>
          {ev?.status !== "Completed" && (
            <button type="button" onClick={() => ev && act(() => completeCalendarEvent(ev.id), "Event completed")} className="px-4 py-2 rounded border border-green-500 text-green-600 text-sm hover:bg-green-50">Complete</button>
          )}
          {ev?.status !== "Cancelled" && (
            <button type="button" onClick={() => ev && act(() => cancelCalendarEvent(ev.id), "Event cancelled")} className="px-4 py-2 rounded border border-amber-500 text-amber-600 text-sm hover:bg-amber-50">Cancel</button>
          )}
          <button type="button" onClick={() => ev && act(() => deleteCalendarEvent(ev.id), "Event deleted")} className="px-4 py-2 rounded border border-red-500 text-red-500 text-sm hover:bg-red-50">Delete</button>
        </div>
      </div>
    </div>
  );
};

export default EventDetailsDrawer;
