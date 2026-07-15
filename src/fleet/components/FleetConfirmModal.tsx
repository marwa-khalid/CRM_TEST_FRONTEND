import React from "react";

interface FleetConfirmModalProps {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean; // red confirm button (default) vs neutral
  onConfirm: () => void;
  onCancel: () => void;
}

// Shared Fleet confirm / delete dialog — same structure as the Claims ConfirmModal,
// in Fleet's black / grey theme. Every Fleet page uses this so delete prompts look
// identical across the whole module.
const FleetConfirmModal: React.FC<FleetConfirmModalProps> = ({
  title,
  message,
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  destructive = true,
  onConfirm,
  onCancel,
}) => (
  <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/50 p-4 font-sans-headline">
    <div className="w-[420px] max-w-full p-6 bg-white rounded-lg flex flex-col gap-6">
      <span className="text-black text-xl font-semibold leading-5">{title}</span>
      <p className="text-neutral-700 text-base font-normal">{message}</p>
      <div className="pt-10 flex justify-end items-center gap-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-4 bg-white rounded outline outline-1 -outline-offset-1 outline-neutral-900 text-neutral-900 text-base font-medium leading-4 hover:bg-neutral-50"
        >
          {cancelLabel}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className={`px-6 py-4 rounded text-white text-base font-medium leading-4 ${
            destructive ? "bg-red-600 hover:bg-red-700" : "bg-neutral-900 hover:bg-black"
          }`}
        >
          {confirmLabel}
        </button>
      </div>
    </div>
  </div>
);

export default FleetConfirmModal;
