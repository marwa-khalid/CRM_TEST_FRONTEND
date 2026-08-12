import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { FleetTextInput, FleetTextArea, FleetSelect, FleetCreatableSelect, FleetDateField, FleetTimeSelect } from "./fields";
import { useFleetAssignees } from "../hooks/useFleetAssignees";
import { listVehicleRecords } from "../../vehicles/services/vehicleRecordService";
import {
  createFleetTask,
  updateFleetTask,
  uploadTaskAttachment,
  TASK_STATUSES,
  TASK_PRIORITIES,
  TASK_DEPARTMENTS,
  type FleetTask,
  type FleetTaskPayload,
} from "../services/taskService";
import UploadFileIcon from "../assets/icons/UploadFile.svg";
import RemoveIcon from "../assets/icons/Remove.svg";
import { fileTypeIcon } from "../utils/fileIcon";
import { getCurrentUserName } from "../utils/currentUser";
import type { Option } from "../types/hire";

const toOptions = (values: readonly string[]): Option[] => values.map((v) => ({ label: v, value: v }));

interface Props {
  task: FleetTask | null; // null = create
  defaultDate?: string; // yyyy-mm-dd — seeds Due Date when creating from the calendar
  onClose: () => void;
  onSaved: () => void;
  module?: string; // skyline / vehicles_<context> — which app's list this task belongs to
}

const FleetTaskModal: React.FC<Props> = ({ task, defaultDate, onClose, onSaved, module = "skyline" }) => {
  const vehicleContext = module.startsWith("vehicles_") ? module.split("_")[1] : undefined;
  const [form, setForm] = useState<FleetTaskPayload>({
    title: task?.title || "",
    description: task?.description || "",
    department: task?.department || "Fleet",
    // New tasks default to the logged-in user (still changeable); edits keep the task's own.
    assigned_user: task ? (task.assigned_user || "") : getCurrentUserName(),
    due_date: task?.due_date || defaultDate || "",
    due_time: task?.due_time || "",
    priority: task?.priority || "Medium",
    status: task?.status || "Pending",
    vehicle_registration: task?.vehicle_registration || "",
    attachment_path: task?.attachment_path || "",
    attachment_name: task?.attachment_name || "",
    module: task?.module || module,
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  // Assigned To — same options as the Claims side (real users + shared samples).
  const assignees = useFleetAssignees();
  // Vehicle Reg — live Vehicle Management records only. The register is a lookup
  // table and may include old rows that no longer exist in VM.
  const [vehicleRegs, setVehicleRegs] = useState<string[]>([]);
  useEffect(() => {
    listVehicleRecords(vehicleContext).then((rows) => setVehicleRegs(rows.map((r) => r.registration_number || "").filter(Boolean)));
  }, [vehicleContext]);

  const set = <K extends keyof FleetTaskPayload>(key: K, value: FleetTaskPayload[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const assigneeOptions = useMemo<Option[]>(() => {
    const set = new Set<string>(assignees);
    if (form.assigned_user) set.add(form.assigned_user);
    return [...set].map((n) => ({ label: n, value: n }));
  }, [assignees, form.assigned_user]);

  const vehicleOptions = useMemo<Option[]>(() => {
    const set = new Set<string>(vehicleRegs);
    if (form.vehicle_registration) set.add(form.vehicle_registration);
    return [...set].sort().map((r) => ({ label: r, value: r }));
  }, [vehicleRegs, form.vehicle_registration]);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    const res = await uploadTaskAttachment(file);
    setUploading(false);
    if (!res) {
      toast.error("Couldn't upload the attachment.");
      return;
    }
    setForm((prev) => ({ ...prev, attachment_path: res.path, attachment_name: res.filename }));
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      setError("Give the task a title.");
      return;
    }
    setSaving(true);
    // Send nulls (not empty strings) for the optional fields the backend treats as dates/enums.
    const payload: FleetTaskPayload = {
      ...form,
      module: task ? (task.module || module) : module, // preserve on edit; stamp on create
      title: form.title.trim(),
      description: form.description || null,
      assigned_user: form.assigned_user || null,
      due_date: form.due_date || null,
      due_time: form.due_time || null,
      vehicle_registration: form.vehicle_registration || null,
      attachment_path: form.attachment_path || null,
      attachment_name: form.attachment_name || null,
    };
    const result = task ? await updateFleetTask(task.id, payload) : await createFleetTask(payload);
    setSaving(false);
    if (!result) {
      setError("Couldn't save the task. Please try again.");
      return;
    }
    onSaved();
  };

  return (
    <div
      className="fixed inset-0 z-[130] flex justify-end bg-black/40 font-sans-headline"
      onClick={() => { if (!saving) onClose(); }}
    >
      {/* Right-hand slide-over drawer (not a centered popup). */}
      <div
        className="w-[560px] max-w-full h-full bg-white flex flex-col overflow-hidden shadow-2xl animate-in slide-in-from-right duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 flex justify-between items-center border-b border-neutral-100 shrink-0">
          <div className="text-neutral-900 text-xl font-semibold">{task ? "Edit Task" : "New Task"}</div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="text-neutral-400 hover:text-neutral-700 text-xl leading-none disabled:opacity-40"
          >
            ×
          </button>
        </div>

        <div className="p-6 flex flex-col gap-4 overflow-y-auto">
          <FleetTextInput
            label="Title"
            placeholder="e.g. Chase driver for signed contract"
            value={form.title}
            onChange={(v) => { set("title", v); if (error) setError(""); }}
          />
          <FleetTextArea
            label="Description"
            placeholder="Add any detail…"
            value={form.description || ""}
            onChange={(v) => set("description", v)}
            rows={3}
          />

          <div className="grid grid-cols-2 gap-4">
            <FleetSelect
              label="Status"
              value={form.status || ""}
              options={toOptions(TASK_STATUSES)}
              onChange={(v) => set("status", v)}
              menuPortal
            />
            <FleetSelect
              label="Priority"
              value={form.priority || ""}
              options={toOptions(TASK_PRIORITIES)}
              onChange={(v) => set("priority", v)}
              menuPortal
              unsorted
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FleetDateField label="Due Date" value={form.due_date || ""} onChange={(v) => set("due_date", v)} />
            <FleetTimeSelect label="Due Time" value={form.due_time || ""} onChange={(v) => set("due_time", v)} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FleetSelect
              label="Department"
              value={form.department || ""}
              options={toOptions(TASK_DEPARTMENTS)}
              onChange={(v) => set("department", v)}
              menuPortal
            />
            <FleetSelect
              label="Assigned To"
              placeholder="Select user"
              value={form.assigned_user || ""}
              options={assigneeOptions}
              onChange={(v) => set("assigned_user", v)}
              menuPortal
            />
          </div>

          <FleetCreatableSelect
            label="Vehicle Reg (optional)"
            placeholder="Select or add a vehicle"
            value={form.vehicle_registration || ""}
            options={vehicleOptions}
            onChange={(v) => set("vehicle_registration", v)}
            menuPortal
          />

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
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="px-6 py-3 bg-white rounded outline outline-1 -outline-offset-1 outline-black text-neutral-900 text-base font-medium hover:bg-neutral-50 disabled:opacity-40"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-3 rounded bg-neutral-900 text-white text-base font-medium hover:bg-black disabled:opacity-50"
          >
            {saving ? "Saving…" : task ? "Save Changes" : "Create Task"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FleetTaskModal;
