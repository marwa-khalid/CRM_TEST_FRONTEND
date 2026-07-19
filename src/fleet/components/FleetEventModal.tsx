import React, { useState } from "react";
import { toast } from "react-toastify";
import { FleetTextInput, FleetTextArea, FleetSelect, FleetDateField, FleetTimeSelect } from "./fields";
import {
  createCalendarEvent,
  updateCalendarEvent,
  uploadEventAttachment,
  EVENT_TYPES,
  type FleetEvent,
  type FleetEventPayload,
} from "../services/eventService";
import UploadFileIcon from "../assets/icons/UploadFile.svg";
import RemoveIcon from "../assets/icons/Remove.svg";
import { fileTypeIcon } from "../utils/fileIcon";
import type { Option } from "../types/hire";

const typeOptions: Option[] = EVENT_TYPES.map((t) => ({ label: t, value: t }));

interface Props {
  event: FleetEvent | null; // null = create
  defaultDate?: string; // yyyy-mm-dd — seeds Start Date when creating from the calendar
  onClose: () => void;
  onSaved: () => void;
}

const FleetEventModal: React.FC<Props> = ({ event, defaultDate, onClose, onSaved }) => {
  const [form, setForm] = useState<FleetEventPayload>({
    title: event?.title || "",
    event_type: event?.event_type || "Meeting",
    start_date: event?.start_date || defaultDate || "",
    start_time: event?.start_time || "",
    end_date: event?.end_date || "",
    end_time: event?.end_time || "",
    location: event?.location || "",
    description: event?.description || "",
    attachment_path: event?.attachment_path || "",
    attachment_name: event?.attachment_name || "",
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const set = <K extends keyof FleetEventPayload>(key: K, value: FleetEventPayload[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    const res = await uploadEventAttachment(file);
    setUploading(false);
    if (!res) {
      toast.error("Couldn't upload the attachment.");
      return;
    }
    setForm((prev) => ({ ...prev, attachment_path: res.path, attachment_name: res.filename }));
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      setError("Give the event a title.");
      return;
    }
    setSaving(true);
    const payload: FleetEventPayload = {
      ...form,
      title: form.title.trim(),
      start_date: form.start_date || null,
      start_time: form.start_time || null,
      end_date: form.end_date || null,
      end_time: form.end_time || null,
      location: form.location || null,
      description: form.description || null,
      attachment_path: form.attachment_path || null,
      attachment_name: form.attachment_name || null,
    };
    const result = event ? await updateCalendarEvent(event.id, payload) : await createCalendarEvent(payload);
    setSaving(false);
    if (!result) {
      setError("Couldn't save the event. Please try again.");
      return;
    }
    onSaved();
  };

  return (
    <div
      className="fixed inset-0 z-[130] flex justify-end bg-black/40 font-sans-headline"
      onClick={() => { if (!saving) onClose(); }}
    >
      <div
        className="w-[560px] max-w-full h-full bg-white flex flex-col overflow-hidden shadow-2xl animate-in slide-in-from-right duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 flex justify-between items-center border-b border-neutral-100 shrink-0">
          <div className="text-neutral-900 text-xl font-semibold">{event ? "Edit Event" : "New Event"}</div>
          <button type="button" onClick={onClose} disabled={saving} className="text-neutral-400 hover:text-neutral-700 text-xl leading-none disabled:opacity-40">×</button>
        </div>

        <div className="p-6 flex flex-col gap-4 overflow-y-auto">
          <FleetTextInput
            label="Title"
            placeholder="e.g. Depot inspection meeting"
            value={form.title}
            onChange={(v) => { set("title", v); if (error) setError(""); }}
          />

          <div className="grid grid-cols-2 gap-4">
            <FleetSelect label="Event Type" value={form.event_type || ""} options={typeOptions} onChange={(v) => set("event_type", v)} menuPortal />
            <FleetTextInput label="Location" placeholder="Where" value={form.location || ""} onChange={(v) => set("location", v)} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FleetDateField label="Start Date" value={form.start_date || ""} onChange={(v) => set("start_date", v)} />
            <FleetTimeSelect label="Start Time" value={form.start_time || ""} onChange={(v) => set("start_time", v)} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FleetDateField label="End Date" value={form.end_date || ""} onChange={(v) => set("end_date", v)} />
            <FleetTimeSelect label="End Time" value={form.end_time || ""} onChange={(v) => set("end_time", v)} />
          </div>

          <FleetTextArea label="Description" placeholder="Add any detail…" value={form.description || ""} onChange={(v) => set("description", v)} rows={3} />

          {/* Attachment */}
          <div className="flex flex-col gap-2">
            <span className="text-neutral-700 text-sm font-medium">Attachment</span>
            {form.attachment_name ? (
              <div className="h-[52px] px-4 rounded outline outline-1 -outline-offset-1 outline-neutral-200 flex items-center justify-between gap-3">
                <div className="min-w-0 flex items-center gap-3">
                  <img src={fileTypeIcon(form.attachment_name)} alt="" className="w-8 h-8 shrink-0" />
                  <span className="truncate text-sm text-neutral-900">{form.attachment_name}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, attachment_path: "", attachment_name: "" }))}
                  title="Remove attachment"
                  className="w-5 h-5 shrink-0 hover:opacity-70"
                >
                  <img src={RemoveIcon} alt="" className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <label className={`h-[52px] px-4 rounded outline outline-1 -outline-offset-1 outline-neutral-200 flex items-center gap-3 cursor-pointer hover:bg-neutral-50 ${uploading ? "opacity-60" : ""}`}>
                <img src={UploadFileIcon} alt="" className="w-6 h-6 shrink-0" />
                <span className="text-sm text-neutral-500">{uploading ? "Uploading…" : "Attach a file (JPG, PNG, PDF, DOC)"}</span>
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.pdf,.doc,.docx,.xls,.xlsx,.csv"
                  className="hidden"
                  disabled={uploading}
                  onChange={(e) => { handleFile(e.target.files?.[0]); e.target.value = ""; }}
                />
              </label>
            )}
          </div>

          {error && <div className="text-red-500 text-sm">{error}</div>}
        </div>

        <div className="px-6 py-4 border-t border-neutral-100 flex justify-end items-center gap-3 shrink-0">
          <button type="button" onClick={onClose} disabled={saving} className="px-6 py-3 bg-white rounded outline outline-1 -outline-offset-1 outline-black text-neutral-900 text-base font-medium hover:bg-neutral-50 disabled:opacity-40">Cancel</button>
          <button type="button" onClick={handleSave} disabled={saving || uploading} className="px-6 py-3 rounded bg-neutral-900 text-white text-base font-medium hover:bg-black disabled:opacity-50">
            {saving ? "Saving…" : event ? "Save Changes" : "Create Event"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FleetEventModal;
