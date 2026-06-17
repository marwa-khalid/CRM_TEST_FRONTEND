import React, { useEffect, useMemo, useState } from "react";
import Select from "react-select";
import { toast } from "react-toastify";
import {
  createCalendarEvent,
  updateCalendarEvent,
  type CalendarEvent,
} from "../../../services/CalendarEvents/CalendarEvents";
import { getClaims } from "../../../services/Claims/Claims";
import { uploadTaskFile } from "../../../services/Tasks/Tasks";
import { useAssignees } from "../useAssignees";
import {
  EVENT_TYPES, DEPARTMENTS, REMINDER_OPTIONS, RECURRENCE_OPTIONS, EVENT_STATUSES,
} from "./eventMeta";
import { customStyles, BlueDropdownIndicator } from "../../Claims/Steps/GeneralDetailsForm";
import DateField from "./DateField";
import { SpinnerLoader } from "../../../components/common/SpinnerLoader";

const EMPTY: any = {
  title: "", event_type: "", status: "Scheduled",
  start_date: "", start_time: "", end_date: "", end_time: "",
  assigned_users: [], department: "", description: "", location: "",
  reminder: "", recurrence_rule: "", attachment_path: "", attachment_name: "",
  claim_id: "", claim_reference: "", case_reference: "", vehicle_registration: "",
};

const labelCls = "text-neutral-700 text-sm font-weight-500";
const inputCls =
  "w-full h-[52px] px-4 bg-white rounded border border-neutral-200 outline-none text-sm text-neutral-700 focus:border-blue-500";

const rsComponents = { DropdownIndicator: BlueDropdownIndicator, IndicatorSeparator: () => null };
const rsPortal = typeof document !== "undefined" ? document.body : undefined;
// Multi-select needs to grow with chips; keep the rest of the shared look.
const multiStyles: any = {
  ...customStyles,
  control: (base: any, state: any) => ({
    ...(customStyles.control as any)(base, state),
    height: "auto",
    minHeight: "52px",
  }),
};

const Field = ({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) => (
  <div className="flex flex-col gap-1.5">
    <label className={labelCls}>
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    {children}
  </div>
);

// react-select for a simple list of string options (app-standard styling).
const StrSelect = ({
  value, onChange, options, placeholder, isClearable = true,
}: { value: any; onChange: (v: string) => void; options: string[]; placeholder?: string; isClearable?: boolean }) => (
  <Select
    options={options.map((o) => ({ label: o, value: o }))}
    value={value ? { label: value, value } : null}
    onChange={(o: any) => onChange(o?.value || "")}
    styles={customStyles}
    components={rsComponents}
    menuPortalTarget={rsPortal}
    placeholder={placeholder}
    isClearable={isClearable}
    isSearchable={false}
  />
);

const EventFormDrawer = ({
  open, editing, onClose, onSaved,
}: {
  open: boolean;
  editing: Partial<CalendarEvent> | null;
  onClose: () => void;
  onSaved: () => void;
}) => {
  const [form, setForm] = useState<any>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [claims, setClaims] = useState<{ id: number; ref: string }[]>([]);
  const assignees = useAssignees();

  useEffect(() => {
    getClaims()
      .then((res: any) => {
        const arr = Array.isArray(res) ? res : res?.data ?? res?.items ?? [];
        setClaims(
          arr.map((c: any) => ({
            id: c.claim_id ?? c.id,
            ref: c.our_reference || c.claim_no || c.claim_number || `CLM-${c.claim_id ?? c.id}`,
          })).filter((c: any) => c.id),
        );
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (open) {
      setForm(editing ? { ...EMPTY, ...editing, assigned_users: editing.assigned_users ?? [] } : EMPTY);
    }
  }, [open, editing]);

  const claimOptions = useMemo(() => claims.map((c) => ({ label: c.ref, value: c.id })), [claims]);
  const assigneeOptions = useMemo(() => assignees.map((u) => ({ label: u, value: u })), [assignees]);

  if (!open) return null;
  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const { data } = await uploadTaskFile(file);
      set("attachment_path", data?.path || "");
      set("attachment_name", data?.filename || file.name);
      toast.success("Attachment uploaded");
    } catch {
      toast.error("Upload failed");
    }
  };

  const handleSave = async () => {
    if (!form.title?.trim()) return toast.error("Event Title is required");
    if (!form.event_type) return toast.error("Event Type is required");
    if (!form.start_date || !form.end_date) return toast.error("Start and End dates are required");
    if (!form.assigned_users?.length) return toast.error("At least one Assigned User is required");

    const selClaim = claims.find((c) => c.id === Number(form.claim_id));
    const payload: Partial<CalendarEvent> = {
      title: form.title,
      event_type: form.event_type,
      status: form.status || "Scheduled",
      start_date: form.start_date || null,
      start_time: form.start_time || null,
      end_date: form.end_date || null,
      end_time: form.end_time || null,
      assigned_users: form.assigned_users || [],
      department: form.department || null,
      description: form.description || null,
      location: form.location || null,
      reminder: form.reminder || null,
      recurrence_rule: form.recurrence_rule || null,
      attachment_path: form.attachment_path || null,
      attachment_name: form.attachment_name || null,
      claim_id: form.claim_id ? Number(form.claim_id) : null,
      claim_reference: form.claim_id ? (selClaim?.ref ?? form.claim_reference ?? null) : (form.claim_reference || null),
      case_reference: form.case_reference || null,
      vehicle_registration: form.vehicle_registration || null,
    };
    setSaving(true);
    try {
      if (editing?.id) await updateCalendarEvent(editing.id, payload);
      else await createCalendarEvent(payload);
      toast.success(editing?.id ? "Event updated" : "Event created");
      onSaved();
      onClose();
    } catch {
      toast.error("Failed to save event");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex justify-end font-['Stack_Sans_Headline']">
      {saving && <SpinnerLoader />}
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full max-w-[620px] h-full bg-white shadow-xl flex flex-col">
        <div className="h-16 px-6 flex items-center justify-between border-b border-neutral-100 shrink-0">
          <h2 className="text-black text-lg font-weight-600">{editing?.id ? "Edit Event" : "Add Event"}</h2>
          <div className="flex items-center gap-3">
            <button type="button" onClick={handleSave} disabled={saving}
              className="px-5 py-2.5 bg-blue-500 rounded text-white text-sm font-weight-500 hover:bg-blue-600 disabled:opacity-60">
              {saving ? "Saving..." : "Save Event"}
            </button>
            <button type="button" onClick={onClose}
              className="px-5 py-2.5 bg-white rounded border border-blue-500 text-blue-500 text-sm font-weight-500 hover:bg-blue-50">
              Close
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-6 flex flex-col gap-5">
          <Field label="Event Title" required>
            <input className={inputCls} value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="Event title" />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Event Type" required>
              <StrSelect value={form.event_type} onChange={(v) => set("event_type", v)} options={EVENT_TYPES} placeholder="Select type" />
            </Field>
            <Field label="Status">
              <StrSelect value={form.status} onChange={(v) => set("status", v || "Scheduled")} options={EVENT_STATUSES} placeholder="Status" isClearable={false} />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Start Date" required>
              <DateField value={form.start_date} onChange={(v) => set("start_date", v)} />
            </Field>
            <Field label="Start Time">
              <input type="time" className={inputCls} value={form.start_time || ""} onChange={(e) => set("start_time", e.target.value)} />
            </Field>
            <Field label="End Date" required>
              <DateField value={form.end_date} onChange={(v) => set("end_date", v)} />
            </Field>
            <Field label="End Time">
              <input type="time" className={inputCls} value={form.end_time || ""} onChange={(e) => set("end_time", e.target.value)} />
            </Field>
          </div>

          <Field label="Assigned Users" required>
            <Select
              isMulti
              options={assigneeOptions}
              value={(form.assigned_users || []).map((u: string) => ({ label: u, value: u }))}
              onChange={(vals: any) => set("assigned_users", (vals || []).map((v: any) => v.value))}
              styles={multiStyles}
              components={{ IndicatorSeparator: () => null }}
              menuPortalTarget={rsPortal}
              placeholder="Assign to users"
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Department">
              <StrSelect value={form.department} onChange={(v) => set("department", v)} options={DEPARTMENTS} placeholder="Select department" />
            </Field>
            <Field label="Location">
              <input className={inputCls} value={form.location} onChange={(e) => set("location", e.target.value)} placeholder="Location" />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Reminder">
              <Select
                options={REMINDER_OPTIONS}
                value={REMINDER_OPTIONS.find((r) => r.value === form.reminder) || null}
                onChange={(o: any) => set("reminder", o?.value || "")}
                styles={customStyles}
                components={rsComponents}
                menuPortalTarget={rsPortal}
                isClearable
                isSearchable={false}
                placeholder="No reminder"
              />
            </Field>
            <Field label="Recurrence">
              <StrSelect value={form.recurrence_rule} onChange={(v) => set("recurrence_rule", v)} options={RECURRENCE_OPTIONS} placeholder="Does not repeat" />
            </Field>
          </div>

          <div className="pt-2 border-t border-neutral-100">
            <span className="text-neutral-500 text-xs font-weight-600 uppercase tracking-wide">Linked Records</span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Claim Reference">
              <Select
                options={claimOptions}
                value={claimOptions.find((o) => o.value === Number(form.claim_id)) || null}
                onChange={(o: any) => set("claim_id", o?.value ?? "")}
                isClearable
                styles={customStyles}
                components={rsComponents}
                menuPortalTarget={rsPortal}
                placeholder="Link a claim"
              />
            </Field>
            <Field label="Case Reference">
              <input className={inputCls} value={form.case_reference} onChange={(e) => set("case_reference", e.target.value)} placeholder="Case ref" />
            </Field>
          </div>

          <Field label="Vehicle Registration">
            <input className={inputCls} value={form.vehicle_registration} onChange={(e) => set("vehicle_registration", e.target.value)} placeholder="e.g. AB12 CDE" />
          </Field>

          <Field label="Description">
            <textarea className={inputCls + " h-24 py-2 resize-none"} value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Description" />
          </Field>

          <Field label="Attachment">
            <div className="flex items-center gap-3">
              <label className="px-4 py-2 rounded border border-blue-500 text-blue-500 text-sm cursor-pointer hover:bg-blue-50">
                Upload
                <input type="file" className="hidden" onChange={handleUpload} />
              </label>
              {form.attachment_name && <span className="text-sm text-neutral-600 truncate">{form.attachment_name}</span>}
            </div>
          </Field>
        </div>
      </div>
    </div>
  );
};

export default EventFormDrawer;
