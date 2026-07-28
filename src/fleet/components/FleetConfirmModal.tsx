import React from "react";
import { X } from "lucide-react";

interface FleetConfirmModalProps {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string; // kept for API compatibility; the cancel button is now the header ✕
  destructive?: boolean; // red confirm button (default) vs neutral
  onConfirm: () => void;
  onCancel: () => void;
}

// Shared Fleet confirm / delete dialog — same structure as the Claims ConfirmModal,
// in Fleet's black / grey theme. Every Fleet page uses this so delete prompts look
// identical across the whole module. Dismiss via the ✕ in the header.
const FleetConfirmModal: React.FC<FleetConfirmModalProps> = ({
  title,
  message,
  confirmLabel = "Delete",
  destructive = true,
  onConfirm,
  onCancel,
}) => (
  <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/50 p-4 font-sans-headline">
    <div className="w-[420px] max-w-full p-6 bg-white rounded-lg flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <span className="text-black text-xl font-semibold leading-7">{title}</span>
        <button
          type="button"
          onClick={onCancel}
          aria-label="Close"
          className="shrink-0 -mt-1 -mr-1 text-neutral-500 hover:text-neutral-900"
        >
          <X size={20} />
        </button>
      </div>
      <p className="text-neutral-700 text-base font-normal">{message}</p>
      <div className="flex justify-end items-center">
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
