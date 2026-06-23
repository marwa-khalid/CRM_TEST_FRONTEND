interface ConfirmModalProps {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal = ({
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
}: ConfirmModalProps) => (
  <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/50 font-['Stack_Sans_Headline']">
    <div className="w-[420px] p-6 bg-white rounded-lg flex flex-col gap-6">
      <span className="text-black text-xl font-weight-600 leading-5">{title}</span>
      <p className="text-neutral-700 text-base font-normal">{message}</p>
      <div className="pt-10 flex justify-end items-center gap-4">
        <button
          className="px-6 py-4 bg-white rounded outline outline-1 outline-offset-[-1px] outline-blue-500 flex justify-center items-center gap-2.5"
          onClick={onCancel}
        >
          <span className="text-blue-500 text-base font-weight-400 leading-4">{cancelLabel}</span>
        </button>
        <button
          className="px-6 py-4 bg-blue-500 rounded flex justify-center items-center gap-2.5"
          onClick={onConfirm}
        >
          <span className="text-white text-base font-weight-400 leading-4">{confirmLabel}</span>
        </button>
      </div>
    </div>
  </div>
);
