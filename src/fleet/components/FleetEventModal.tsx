import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import Select from "react-select";
import CreatableSelect from "react-select/creatable";
import { FleetTextInput, FleetTextArea, FleetSelect, FleetDateField, FleetTimeSelect } from "./fields";
import {
  createCalendarEvent,
  updateCalendarEvent,
  uploadEventAttachment,
  EVENT_TYPES,
  DEPARTMENTS,
  REMINDER_OPTIONS,
  RECURRENCE_OPTIONS,
  EVENT_STATUSES,
  type FleetEvent,
  type FleetEventPayload,
} from "../services/eventService";
import { useFleetAssignees } from "../hooks/useFleetAssignees";
import { listVehicleRecords } from "../../vehicles/services/vehicleRecordService";
import { listHires } from "../services/hireService";
import UploadFileIcon from "../assets/icons/UploadFile.svg";
import RemoveIcon from "../assets/icons/Remove.svg";
import { fileTypeIcon } from "../utils/fileIcon";
import type { Option } from "../types/hire";

const typeOptions: Option[] = EVENT_TYPES.map((t) => ({ label: t, value: t }));
const statusOptions: Option[] = EVENT_STATUSES.map((t) => ({ label: t, value: t }));
const deptOptions: Option[] = DEPARTMENTS.map((t) => ({ label: t, value: t }));
const recurrenceOptions: Option[] = [{ label: "Does not repeat", value: "" }, ...RECURRENCE_OPTIONS.map((t) => ({ label: t, value: t }))];

const rsPortal = typeof document !== "undefined" ? document.body : undefined;
// Exact copy of the Claims calendar multi-select design (customStyles + multi
// overrides) with the blue accents swapped for black — design unchanged.
const FONT = "'Stack Sans Headline', sans-serif";
const blackStyles: any = {
  control: (base: any, state: any) => ({
    ...base,
    minHeight: "52px",
    height: "auto",
    borderRadius: "4px",
    borderWidth: state.isFocused ? "2px" : "1px",
    borderColor: state.isFocused ? "#171717" : "#e5e7eb",
    boxShadow: "none",
    outline: "none",
    "&:hover": { borderColor: state.isFocused ? "#171717" : "#d4d4d4" },
    paddingLeft: "8px",
    backgroundColor: "white",
    fontSize: "14px",
    fontWeight: 400,
    fontFamily: FONT,
  }),
  valueContainer: (p: any) => ({ ...p, fontFamily: FONT, fontSize: "16px", fontWeight: 400, flexWrap: "wrap" }),
  input: (p: any) => ({ ...p, fontFamily: FONT, fontWeight: 400, fontSize: "16px", outline: "none", boxShadow: "none" }),
  placeholder: (p: any) => ({ ...p, fontFamily: FONT, color: "#a6aab1", fontWeight: 400, fontSize: "16px", opacity: 1 }),
  singleValue: (p: any) => ({ ...p, fontFamily: FONT, fontWeight: 400, fontSize: "16px", color: "#444444" }),
  // Black-theme options for the plain (non-checkbox) selects — react-select defaults
  // the focused/selected option to blue; keep it neutral to match the rest of the modal.
  option: (base: any, state: any) => ({
    ...base,
    fontFamily: FONT,
    fontSize: "14px",
    fontWeight: 400,
    color: "#374151",
    borderRadius: 4,
    cursor: "pointer",
    backgroundColor: state.isSelected ? "#f5f5f5" : state.isFocused ? "#fafafa" : "white",
    ":active": { backgroundColor: "#f5f5f5" },
  }),
  menuPortal: (b: any) => ({ ...b, zIndex: 9999 }),
  menu: (p: any) => ({ ...p, fontFamily: FONT, fontWeight: 400, borderRadius: 6, border: "1px solid #f5f5f5", boxShadow: "0px 4px 4px 0px rgba(0,0,0,0.08)", overflow: "hidden", marginTop: 2, marginBottom: 2 }),
  menuList: (p: any) => ({ ...p, fontFamily: FONT, fontWeight: 400, padding: 8, display: "flex", flexDirection: "column", gap: 4, scrollbarWidth: "none", msOverflowStyle: "none", "::-webkit-scrollbar": { display: "none" } }),
};
// Checkbox-style option row — identical to Claims' CheckboxOption, black not blue.
const CheckboxOption = (props: any) => {
  const { innerRef, innerProps, isSelected, isFocused, label } = props;
  return (
    <div ref={innerRef} {...innerProps} className={`flex items-center gap-2 p-2.5 rounded cursor-pointer ${isSelected ? "bg-neutral-100" : isFocused ? "bg-neutral-50" : ""}`}>
      <span className={`w-5 h-5 rounded shrink-0 ${isSelected ? "bg-neutral-900 border-[6px] border-neutral-300" : "bg-neutral-300"}`} />
      <span className="text-neutral-700 text-sm font-normal leading-4">{label}</span>
    </div>
  );
};

const FieldLabel: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="flex flex-col gap-2">
    <span className="text-neutral-700 text-sm font-medium">{label}</span>
    {children}
  </div>
);

interface Props {
  event: FleetEvent | null; // null = create
  defaultDate?: string; // yyyy-mm-dd — seeds Start Date when creating from the calendar
  onClose: () => void;
  onSaved: () => void;
  module?: string; // skyline / vehicles — which app's calendar this event belongs to
}

const FleetEventModal: React.FC<Props> = ({ event, defaultDate, onClose, onSaved, module = "skyline" }) => {
  const [form, setForm] = useState<FleetEventPayload>({
    title: event?.title || "",
    event_type: event?.event_type || "Meeting",
    status: event?.status || "Scheduled",
    start_date: event?.start_date || defaultDate || "",
    start_time: event?.start_time || "",
    end_date: event?.end_date || "",
    end_time: event?.end_time || "",
    assigned_users: event?.assigned_users || [],
    department: event?.department || "Fleet",
    location: event?.location || "",
    reminder: event?.reminder || "",
    recurrence_rule: event?.recurrence_rule || "",
    description: event?.description || "",
    claim_reference: event?.claim_reference || "",
    vehicle_registration: event?.vehicle_registration || "",
    attachment_path: event?.attachment_path || "",
    attachment_name: event?.attachment_name || "",
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  // Skyline calendars link a Skyline (hire) reference; Vehicle Management calendars
  // link only a vehicle (reg + status) — never a claim reference.
  const isVehicles = (event?.module || module) === "vehicles";
  const assignees = useFleetAssignees();
  const [vehicleRegs, setVehicleRegs] = useState<string[]>([]);
  const [hireRefs, setHireRefs] = useState<string[]>([]);
  useEffect(() => {
    // Use live Vehicle Management records here. The register powers hire lookups
    // and can contain stale lookup rows that should not appear in task/calendar UI.
    listVehicleRecords().then((rows) => setVehicleRegs(rows.map((r) => r.registration_number || "").filter(Boolean)));
    if (!isVehicles) listHires().then((rows) => setHireRefs(rows.map((r) => r.fleet_reference || "").filter(Boolean)));
  }, [isVehicles]);
  const hireRefOptions = useMemo<Option[]>(() => {
    const set = new Set<string>(hireRefs);
    if (form.claim_reference) set.add(form.claim_reference);
    return [...set].sort().map((r) => ({ label: r, value: r }));
  }, [hireRefs, form.claim_reference]);
  const assigneeOptions = useMemo<Option[]>(() => {
    const set = new Set<string>(assignees);
    (form.assigned_users || []).forEach((u) => set.add(u));
    return [...set].map((n) => ({ label: n, value: n }));
  }, [assignees, form.assigned_users]);
  const vehicleOptions = useMemo<Option[]>(() => {
    const set = new Set<string>(vehicleRegs);
    if (form.vehicle_registration) set.add(form.vehicle_registration);
    return [...set].sort().map((r) => ({ label: r, value: r }));
  }, [vehicleRegs, form.vehicle_registration]);

  const set = <K extends keyof FleetEventPayload>(key: K, value: FleetEventPayload[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    const res = await uploadEventAttachment(file);
    setUploading(false);
    if (!res) { toast.error("Couldn't upload the attachment."); return; }
    setForm((prev) => ({ ...prev, attachment_path: res.path, attachment_name: res.filename }));
  };

  const handleSave = async () => {
    if (!form.title.trim()) { setError("Give the event a title."); return; }
    setSaving(true);
    const payload: FleetEventPayload = {
      ...form,
      module: event ? form.module : module, // preserve on edit; stamp on create
      title: form.title.trim(),
      status: form.status || "Scheduled",
      start_date: form.start_date || null,
      start_time: form.start_time || null,
      end_date: form.end_date || null,
      end_time: form.end_time || null,
      assigned_users: form.assigned_users || [],
      department: form.department || null,
      location: form.location || null,
      reminder: form.reminder || null,
      recurrence_rule: form.recurrence_rule || null,
      description: form.description || null,
      claim_reference: isVehicles ? null : (form.claim_reference || null),
      vehicle_registration: form.vehicle_registration || null,
      attachment_path: form.attachment_path || null,
      attachment_name: form.attachment_name || null,
    };
    const result = event ? await updateCalendarEvent(event.id, payload) : await createCalendarEvent(payload);
    setSaving(false);
    if (!result) { setError("Couldn't save the event. Please try again."); return; }
    onSaved();
  };

  const reminderValue = REMINDER_OPTIONS.filter((r) => String(form.reminder || "").split(",").map((s) => s.trim()).includes(r.value));

  return (
    <div className="fixed inset-0 z-[130] flex justify-end bg-black/40 font-sans-headline" onClick={() => { if (!saving) onClose(); }}>
      <div className="w-[620px] max-w-full h-full bg-white flex flex-col overflow-hidden shadow-2xl animate-in slide-in-from-right duration-200" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-4 flex justify-between items-center border-b border-neutral-100 shrink-0">
          <div className="text-neutral-900 text-xl font-semibold">{event ? "Edit Event" : "Add Event"}</div>
          <div className="flex items-center gap-3">
            <button type="button" onClick={handleSave} disabled={saving || uploading} className="px-5 py-2.5 rounded bg-neutral-900 text-white text-sm font-medium hover:bg-black disabled:opacity-50">{saving ? "Saving…" : "Save Event"}</button>
            <button type="button" onClick={onClose} disabled={saving} className="px-5 py-2.5 bg-white rounded border border-neutral-300 text-neutral-700 text-sm font-medium hover:bg-neutral-50 disabled:opacity-40">Close</button>
          </div>
        </div>

        <div className="p-6 flex flex-col gap-5 overflow-y-auto">
          <FleetTextInput label="Event Title" placeholder="e.g. Depot inspection meeting" value={form.title} onChange={(v) => { set("title", v); if (error) setError(""); }} />

          <div className="grid grid-cols-2 gap-4">
            <FleetSelect label="Event Type" value={form.event_type || ""} options={typeOptions} onChange={(v) => set("event_type", v)} menuPortal />
            <FleetSelect label="Status" value={form.status || "Scheduled"} options={statusOptions} onChange={(v) => set("status", v || "Scheduled")} menuPortal />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FleetDateField label="Start Date" value={form.start_date || ""} onChange={(v) => set("start_date", v)} />
            <FleetTimeSelect label="Start Time" value={form.start_time || ""} onChange={(v) => set("start_time", v)} />
            <FleetDateField label="End Date" value={form.end_date || ""} onChange={(v) => set("end_date", v)} />
            <FleetTimeSelect label="End Time" value={form.end_time || ""} onChange={(v) => set("end_time", v)} />
          </div>

          <FieldLabel label="Assigned Users">
            <Select
              isMulti
              closeMenuOnSelect={false}
              hideSelectedOptions={false}
              options={assigneeOptions}
              value={(form.assigned_users || []).map((u) => ({ label: u, value: u }))}
              onChange={(vals: any) => set("assigned_users", (vals || []).map((v: any) => v.value))}
              styles={blackStyles}
              components={{ Option: CheckboxOption, IndicatorSeparator: () => null }}
              menuPortalTarget={rsPortal}
              placeholder="Assign to users"
            />
          </FieldLabel>

          <div className="grid grid-cols-2 gap-4">
            <FleetSelect label="Department" value={form.department || ""} options={deptOptions} onChange={(v) => set("department", v)} menuPortal />
            <FleetTextInput label="Location" placeholder="Where" value={form.location || ""} onChange={(v) => set("location", v)} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FieldLabel label="Reminder">
              <Select
                isMulti
                closeMenuOnSelect={false}
                hideSelectedOptions={false}
                options={REMINDER_OPTIONS}
                value={reminderValue}
                onChange={(opts: any) => {
                  const vals = (opts || []).map((o: any) => o.value);
                  // "Don't remind me" is exclusive.
                  const next = vals.includes("none")
                    ? (vals[vals.length - 1] === "none" ? ["none"] : vals.filter((v: string) => v !== "none"))
                    : vals;
                  set("reminder", next.join(","));
                }}
                styles={blackStyles}
                components={{ Option: CheckboxOption, IndicatorSeparator: () => null }}
                menuPortalTarget={rsPortal}
                isSearchable={false}
                isClearable={false}
                placeholder="No reminder"
              />
            </FieldLabel>
            <FleetSelect label="Recurrence" value={form.recurrence_rule || ""} options={recurrenceOptions} onChange={(v) => set("recurrence_rule", v)} menuPortal />
          </div>

          <div className="pt-2 border-t border-neutral-100">
            <span className="text-neutral-500 text-xs font-semibold uppercase tracking-wide">Linked Records</span>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {!isVehicles && (
              <FieldLabel label="Skyline Reference">
                <CreatableSelect
                  options={hireRefOptions}
                  value={form.claim_reference ? { label: form.claim_reference, value: form.claim_reference } : null}
                  onChange={(o: any) => set("claim_reference", o?.value || "")}
                  onCreateOption={(input: string) => set("claim_reference", input.trim())}
                  styles={blackStyles}
                  components={{ IndicatorSeparator: () => null }}
                  menuPortalTarget={rsPortal}
                  isClearable
                  placeholder="Link a Skyline reference"
                  formatCreateLabel={(input: string) => `Add "${input}"`}
                />
              </FieldLabel>
            )}
            {isVehicles && (
              <FieldLabel label="Vehicle Registration">
                <CreatableSelect
                  options={vehicleOptions}
                  value={form.vehicle_registration ? { label: form.vehicle_registration, value: form.vehicle_registration } : null}
                  onChange={(o: any) => set("vehicle_registration", o?.value || "")}
                  onCreateOption={(input: string) => set("vehicle_registration", input.trim())}
                  styles={blackStyles}
                  components={{ IndicatorSeparator: () => null }}
                  menuPortalTarget={rsPortal}
                  isClearable
                  placeholder="Select or add registration"
                  formatCreateLabel={(input: string) => `Add "${input}"`}
                />
              </FieldLabel>
            )}
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
                <button type="button" onClick={() => setForm((prev) => ({ ...prev, attachment_path: "", attachment_name: "" }))} title="Remove attachment" className="w-5 h-5 shrink-0 hover:opacity-70">
                  <img src={RemoveIcon} alt="" className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <label className={`h-[52px] px-4 rounded outline outline-1 -outline-offset-1 outline-neutral-200 flex items-center gap-3 cursor-pointer hover:bg-neutral-50 ${uploading ? "opacity-60" : ""}`}>
                <img src={UploadFileIcon} alt="" className="w-6 h-6 shrink-0" />
                <span className="text-sm text-neutral-500">{uploading ? "Uploading…" : "Attach a file (JPG, PNG, PDF, DOC)"}</span>
                <input type="file" accept=".jpg,.jpeg,.png,.pdf,.doc,.docx,.xls,.xlsx,.csv" className="hidden" disabled={uploading} onChange={(e) => { handleFile(e.target.files?.[0]); e.target.value = ""; }} />
              </label>
            )}
          </div>

          {error && <div className="text-red-500 text-sm">{error}</div>}
        </div>
      </div>
    </div>
  );
};

export default FleetEventModal;
