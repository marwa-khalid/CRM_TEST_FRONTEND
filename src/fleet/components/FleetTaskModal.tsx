import React, { useState } from "react";
import { FleetTextInput, FleetTextArea, FleetSelect, FleetDateField, FleetTimeSelect } from "./fields";
import {
  createFleetTask,
  updateFleetTask,
  TASK_STATUSES,
  TASK_PRIORITIES,
  TASK_DEPARTMENTS,
  type FleetTask,
  type FleetTaskPayload,
} from "../services/taskService";
import type { Option } from "../types/hire";

const toOptions = (values: readonly string[]): Option[] => values.map((v) => ({ label: v, value: v }));

interface Props {
  task: FleetTask | null; // null = create
  defaultDate?: string; // yyyy-mm-dd — seeds Due Date when creating from the calendar
  onClose: () => void;
  onSaved: () => void;
}

const FleetTaskModal: React.FC<Props> = ({ task, defaultDate, onClose, onSaved }) => {
  const [form, setForm] = useState<FleetTaskPayload>({
    title: task?.title || "",
    description: task?.description || "",
    department: task?.department || "Fleet",
    assigned_user: task?.assigned_user || "",
    due_date: task?.due_date || defaultDate || "",
    due_time: task?.due_time || "",
    priority: task?.priority || "Medium",
    status: task?.status || "Pending",
    vehicle_registration: task?.vehicle_registration || "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = <K extends keyof FleetTaskPayload>(key: K, value: FleetTaskPayload[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    if (!form.title.trim()) {
      setError("Give the task a title.");
      return;
    }
    setSaving(true);
    // Send nulls (not empty strings) for the optional fields the backend treats as dates/enums.
    const payload: FleetTaskPayload = {
      ...form,
      title: form.title.trim(),
      description: form.description || null,
      assigned_user: form.assigned_user || null,
      due_date: form.due_date || null,
      due_time: form.due_time || null,
      vehicle_registration: form.vehicle_registration || null,
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
    <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/40 p-4 font-sans-headline">
      <div className="w-[640px] max-w-full max-h-[92vh] bg-white rounded-lg flex flex-col overflow-hidden">
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
            <FleetTextInput
              label="Assigned To"
              placeholder="Name or email"
              value={form.assigned_user || ""}
              onChange={(v) => set("assigned_user", v)}
            />
          </div>

          <FleetTextInput
            label="Vehicle Reg (optional)"
            placeholder="e.g. AB12 CDE"
            value={form.vehicle_registration || ""}
            onChange={(v) => set("vehicle_registration", v)}
          />

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
