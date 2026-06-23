import React, { useEffect, useMemo, useState } from "react";
import Select from "react-select";
import CreatableSelect from "react-select/creatable";
import { toast } from "react-toastify";
import { X, UploadCloud } from "lucide-react";
import {
  createCalendarEvent,
  updateCalendarEvent,
  type CalendarEvent,
} from "../../../services/CalendarEvents/CalendarEvents";
import { getClaims } from "../../../services/Claims/Claims";
import { getAttachmentUrl } from "../../../services/Tasks/Tasks";
import { useAssignees } from "../useAssignees";
import {
  EVENT_TYPES, DEPARTMENTS, REMINDER_OPTIONS, RECURRENCE_OPTIONS, EVENT_STATUSES,
} from "./eventMeta";
import { customStyles, BlueDropdownIndicator } from "../../Claims/Steps/GeneralDetailsForm";
import DateField from "./DateField";
import TaskAttachmentModal, { fileLogo } from "../TaskAttachmentModal";
import { SpinnerLoader } from "../../../components/common/SpinnerLoader";

const EMPTY: any = {
  title: "", event_type: "", status: "Scheduled",
  start_date: "", start_time: "", end_date: "", end_time: "",
  assigned_users: [], department: "", description: "", location: "",
  reminder: "", recurrence_rule: "", attachment_path: "", attachment_name: "",
  claim_id: "", claim_reference: "", vehicle_registration: "",
};

const labelCls = "text-neutral-900 text-[14px] font-weight-600";
const inputCls =
  "w-full h-[52px] px-4 bg-white rounded border border-neutral-200 outline-none text-[14px] text-neutral-700 focus:border-blue-500";

const rsComponents = { DropdownIndicator: BlueDropdownIndicator, IndicatorSeparator: () => null };
const rsPortal = typeof document !== "undefined" ? document.body : undefined;
// Portaled menus must sit above the drawer (z-[60]); customStyles doesn't set this,
// so the dropdowns were opening *behind* the drawer and looked empty.
const menuPortalFix = { menuPortal: (b: any) => ({ ...b, zIndex: 9999 }) };
const formStyles: any = { ...customStyles, ...menuPortalFix };
// Multi-select needs to grow with chips; keep the rest of the shared look.
const multiStyles: any = {
  ...customStyles,
  ...menuPortalFix,
  control: (base: any, state: any) => ({
    ...(customStyles.control as any)(base, state),
    height: "auto",
    minHeight: "52px",
  }),
};

// 15-minute interval time picker (same UX as the Add Task form's Due Time).
const TIME_OPTIONS = (() => {
  const times: { label: string; value: string }[] = [];
  for (let h = 0; h < 24; h++) for (let m = 0; m < 60; m += 15) {
    const t = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    times.push({ label: t, value: t });
  }
  return times;
})();
const normalizeTime = (value: string) => {
  if (!value) return "";
  const [hour, minute] = value.split(":");
  const h = Math.min(Math.max(Number(hour || 0), 0), 23);
  const m = Math.min(Math.max(Number(minute || 0), 0), 59);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
};
const isValidTime = (value: string) => /^([01]?\d|2[0-3]):[0-5]\d$/.test(value);
const TimeSelect = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
  <CreatableSelect
    options={TIME_OPTIONS}
    value={value ? { label: value, value } : null}
    onChange={(o: any) => onChange(o?.value || "")}
    onCreateOption={(input: string) => {
      if (isValidTime(input)) onChange(normalizeTime(input));
      else toast.error("Please enter time in HH:mm format");
    }}
    styles={formStyles} components={rsComponents} menuPortalTarget={rsPortal}
    placeholder="Select or type time" isSearchable
  />
);

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
  value, onChange, options, placeholder
}: { value: any; onChange: (v: string) => void; options: string[]; placeholder?: string; }) => (
  <Select
    options={options.map((o) => ({ label: o, value: o }))}
    value={value ? { label: value, value } : null}
    onChange={(o: any) => onChange(o?.value || "")}
    styles={formStyles}
    components={rsComponents}
    menuPortalTarget={rsPortal}
    placeholder={placeholder}
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
  const [attachmentOpen, setAttachmentOpen] = useState(false);
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

  const handleSave = async () => {
    // Validation intentionally removed — saving must never be blocked for now.
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
          <h2 className="text-black text-[20px] font-weight-600">{editing?.id ? "Edit Event" : "Add Event"}</h2>
          <div className="flex items-center gap-3">
            <button type="button" onClick={handleSave} disabled={saving}
              className="px-5 py-2.5 bg-blue-500 rounded text-white text-[14px] font-weight-500 hover:bg-blue-600 disabled:opacity-60">
              {saving ? "Saving..." : "Save Event"}
            </button>
            <button type="button" onClick={onClose}
              className="px-5 py-2.5 bg-white rounded border border-blue-500 text-blue-500 text-[14px] font-weight-500 hover:bg-blue-50">
              Close
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-6 flex flex-col gap-5">
          <Field label="Event Title">
            <input className={inputCls} value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="Event title" />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Event Type">
              <StrSelect value={form.event_type} onChange={(v) => set("event_type", v)} options={EVENT_TYPES} placeholder="Select type" />
            </Field>
            <Field label="Status">
              <StrSelect value={form.status} onChange={(v) => set("status", v || "Scheduled")} options={EVENT_STATUSES} placeholder="Status" />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Start Date">
              <DateField value={form.start_date} onChange={(v) => set("start_date", v)} />
            </Field>
            <Field label="Start Time">
              <TimeSelect value={form.start_time || ""} onChange={(v) => set("start_time", v)} />
            </Field>
            <Field label="End Date">
              <DateField value={form.end_date} onChange={(v) => set("end_date", v)} />
            </Field>
            <Field label="End Time">
              <TimeSelect value={form.end_time || ""} onChange={(v) => set("end_time", v)} />
            </Field>
          </div>

          <Field label="Assigned Users">
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
                isMulti
                closeMenuOnSelect={false}
                hideSelectedOptions={false}
                options={REMINDER_OPTIONS}
                value={REMINDER_OPTIONS.filter((r) =>
                  String(form.reminder || "").split(",").map((s) => s.trim()).includes(r.value)
                )}
                onChange={(opts: any) =>
                  set("reminder", (opts || []).map((o: any) => o.value).join(","))
                }
                styles={{
                  ...formStyles,
                  control: (b: any, s: any) => ({
                    ...(typeof formStyles.control === "function" ? formStyles.control(b, s) : b),
                    height: "auto",
                    minHeight: 52,
                  }),
                  valueContainer: (b: any) => ({ ...b, flexWrap: "wrap" }),
                }}
                components={rsComponents}
                menuPortalTarget={rsPortal}
                isSearchable={false}
                placeholder="No reminder"
              />
            </Field>
            <Field label="Recurrence">
              <StrSelect value={form.recurrence_rule} onChange={(v) => set("recurrence_rule", v)} options={RECURRENCE_OPTIONS} placeholder="Does not repeat" />
            </Field>
          </div>

          <div className="pt-2 border-t border-neutral-100">
            <span className="text-neutral-500 text-xs font-weight-600 uppercase tracking-wide">Linked Records </span>
          </div>

          <Field label="Claim Reference">
            <Select
              options={claimOptions}
              value={claimOptions.find((o) => o.value === Number(form.claim_id)) || null}
              onChange={(o: any) => set("claim_id", o?.value ?? "")}

              styles={formStyles}
              components={rsComponents}
              menuPortalTarget={rsPortal}
              placeholder="Link a claim"
            />
          </Field>

          <Field label="Vehicle Registration">
            <input className={inputCls} value={form.vehicle_registration} onChange={(e) => set("vehicle_registration", e.target.value)} placeholder="e.g. AB12 CDE" />
          </Field>

          <Field label="Description">
            <textarea className={inputCls + " h-24 py-2 resize-none"} value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Description" />
          </Field>

          <Field label="Attachment">
            {(() => {
              const files = String(form.attachment_path || "").split(",").map((s: string) => s.trim()).filter(Boolean);
              return (
              <div className="flex flex-col gap-3">
                {files.map((p: string) => (
                  <div key={p} className="flex items-center gap-3 p-3 rounded-lg border border-neutral-200">
                    <img src={fileLogo(p)} alt="" className="w-9 h-9" />
                    <div className="flex-1 min-w-0">
                      <div className="text-[14px] text-neutral-800 truncate">{p.split("/").pop()}</div>
                      <button type="button"
                        onClick={async () => {
                          try {
                            const { data } = await getAttachmentUrl(p);
                            if (data?.url) window.open(data.url, "_blank", "noopener,noreferrer");
                          } catch { toast.error("Could not open attachment"); }
                        }}
                        className="text-blue-500 text-xs hover:underline">
                        View attachment
                      </button>
                    </div>
                    <button type="button"
                      onClick={() => {
                        const next = files.filter((x: string) => x !== p);
                        set("attachment_path", next.join(","));
                        set("attachment_name", next.length ? (next[0].split("/").pop() || "") : "");
                      }}
                      className="text-neutral-400 hover:text-red-500">
                      <X size={16} />
                    </button>
                  </div>
                ))}
                <button type="button" onClick={() => setAttachmentOpen(true)}
                  className="w-full border border-dashed border-neutral-300 rounded-lg p-8 flex flex-col items-center gap-2 cursor-pointer hover:border-blue-400">
                  <UploadCloud size={28} className="text-blue-400" />
                  <span className="text-neutral-700 text-[14px] font-weight-600">{files.length ? "Add More Attachments" : "Add Attachment"}</span>
                  <span className="text-neutral-400 text-xs">JPG, PNG, PDF, CSV Supported</span>
                </button>
              </div>
              );
            })()}
          </Field>
        </div>
      </div>

      {attachmentOpen && (
        <TaskAttachmentModal
          onClose={() => setAttachmentOpen(false)}
          onUploaded={(uploaded) => setForm((f: any) => {
            const cur = String(f.attachment_path || "").split(",").map((s: string) => s.trim()).filter(Boolean);
            const next = [...cur, ...uploaded.map((u) => u.path)];
            return { ...f, attachment_path: next.join(","), attachment_name: next.length ? (next[0].split("/").pop() || "") : "" };
          })}
        />
      )}
    </div>
  );
};

export default EventFormDrawer;
