import React, { useMemo, useState } from "react";
import { toast } from "react-toastify";
import { FleetSelect } from "./fields";
import { reassignFleetTask, type FleetTask } from "../services/taskService";
import { useFleetAssignees } from "../hooks/useFleetAssignees";
import FleetSpinnerLoader from "./FleetSpinnerLoader";
import type { Option } from "../types/hire";

// Black-theme toggle switch (mirrors the Claims reassign toggles).
const Toggle: React.FC<{ on: boolean; onClick: () => void }> = ({ on, onClick }) => (
  <button type="button" onClick={onClick} className={`relative w-11 h-6 rounded-full transition-colors ${on ? "bg-neutral-900" : "bg-neutral-300"}`} aria-pressed={on}>
    <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${on ? "left-[22px]" : "left-0.5"}`} />
  </button>
);

// Reassign a fleet/vehicle task — same fields + flow as the Claims Reassign modal,
// in the Fleet black theme (Current Assignee, New Assignee, Reason, notify toggles).
const FleetReassignModal: React.FC<{ task: FleetTask; onClose: () => void; onDone: () => void }> = ({ task, onClose, onDone }) => {
  const assignees = useFleetAssignees();
  const [newAssignee, setNewAssignee] = useState("");
  const [reason, setReason] = useState("");
  const [notifyNew, setNotifyNew] = useState(true);
  const [notifyPrev, setNotifyPrev] = useState(false);
  const [saving, setSaving] = useState(false);

  const options = useMemo<Option[]>(() => assignees.map((u) => ({ label: u, value: u })), [assignees]);

  const submit = async () => {
    if (!newAssignee) { toast.error("Select a new assignee."); return; }
    setSaving(true);
    const ok = await reassignFleetTask(task.id, {
      new_assignee: newAssignee,
      reason: reason || undefined,
      notify_new: notifyNew,
      notify_previous: notifyPrev,
    });
    setSaving(false);
    if (ok) { toast.success("Task reassigned."); onDone(); }
    else toast.error("Failed to reassign task.");
  };

  const labelCls = "self-stretch text-neutral-700 text-sm font-weight-500";

  return (
    <div className="fixed inset-0 z-[60] bg-black/30 flex items-center justify-center p-4 font-['Stack_Sans_Headline']" onClick={() => { if (!saving) onClose(); }}>
      {saving && <FleetSpinnerLoader />}
      <div className="w-[797px] max-w-full p-6 bg-white rounded-lg outline outline-1 outline-neutral-100 flex flex-col gap-6" onClick={(e) => e.stopPropagation()}>
        <div className="text-black text-xl font-weight-600 leading-5">Reassign Task</div>
        <div className="h-px bg-neutral-100" />

        <div className="flex flex-col gap-4">
          <div className="flex items-start gap-5">
            <div className="flex-1 flex flex-col gap-2">
              <div className={labelCls}>Current Assignee</div>
              <div className="self-stretch px-5 py-4 bg-neutral-50 rounded outline outline-1 outline-offset-[-1px] outline-neutral-200 flex items-center">
                <span className="text-neutral-500 text-base font-light leading-4">{task.assigned_user || "—"}</span>
              </div>
            </div>
            <div className="flex-1 flex flex-col gap-2">
              <div className={labelCls}>New Assignee</div>
              <FleetSelect value={newAssignee} options={options} onChange={setNewAssignee} placeholder="Select" menuPortal />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className={labelCls}>Reassignment Reason</div>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter Reason"
              className="self-stretch h-24 px-5 py-4 bg-white rounded outline outline-1 outline-offset-[-1px] outline-neutral-200 text-neutral-700 text-base font-light resize-none placeholder:text-neutral-300 focus:outline-neutral-900"
            />
          </div>

          <div className="flex items-center gap-5">
            <div className="w-52 text-black text-sm font-weight-500">Notify New Assignee</div>
            <Toggle on={notifyNew} onClick={() => setNotifyNew((v) => !v)} />
          </div>
          <div className="flex items-center gap-5">
            <div className="w-52 text-black text-sm font-weight-500">Notify Previous Assignee</div>
            <Toggle on={notifyPrev} onClick={() => setNotifyPrev((v) => !v)} />
          </div>
        </div>

        <div className="h-px bg-neutral-100" />
        <div className="flex justify-end items-center gap-4">
          <button type="button" onClick={onClose} className="px-6 py-4 bg-white rounded outline outline-1 outline-offset-[-1px] outline-neutral-300 text-neutral-700 text-base font-weight-500 leading-4 hover:bg-neutral-50">Cancel</button>
          <button type="button" onClick={submit} disabled={saving} className="px-6 py-4 bg-neutral-900 rounded text-white text-base font-weight-500 leading-4 hover:bg-black disabled:opacity-60">Reassign</button>
        </div>
      </div>
    </div>
  );
};

export default FleetReassignModal;
