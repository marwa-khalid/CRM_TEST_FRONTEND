import React, { useState } from "react";

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: { amount: string; reason: string }) => void;
}

// "Pay / Reimburse Hirer" pop-up: amount + reason, both mandatory to submit.
const PayReimburseHirerModal: React.FC<Props> = ({ open, onClose, onSubmit }) => {
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");

  if (!open) return null;

  const canSubmit = amount.trim() !== "" && reason.trim() !== "";

  const reset = () => {
    setAmount("");
    setReason("");
  };

  const submit = () => {
    if (!canSubmit) return;
    onSubmit({ amount: amount.trim(), reason: reason.trim() });
    reset();
  };

  const close = () => {
    reset();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/40 p-4 font-sans-headline">
      <div className="w-[440px] max-w-full p-6 bg-white rounded-lg shadow-[0px_2px_8px_0px_rgba(0,0,0,0.08)] flex flex-col gap-6">
        <h2 className="text-neutral-900 text-xl font-semibold leading-5">Pay / Reimburse Hirer</h2>

        <div className="flex flex-col gap-2">
          <label className="text-neutral-700 text-sm font-medium">How much do we owe to the hirer?</label>
          <div className="px-5 py-4 bg-white rounded outline outline-1 -outline-offset-1 outline-neutral-200 flex items-center gap-2 focus-within:outline-blue-500">
            <span className="text-neutral-500 text-base">£</span>
            <input
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ""))}
              placeholder="0.00"
              className="flex-1 bg-transparent outline-none text-base text-neutral-900 placeholder:text-neutral-300"
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-neutral-700 text-sm font-medium">Reason for Payment</label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Value"
            rows={3}
            className="h-24 px-5 py-4 bg-white rounded outline outline-1 -outline-offset-1 outline-neutral-200 text-base text-neutral-900 placeholder:text-neutral-300 focus:outline-blue-500 resize-none"
          />
        </div>

        <div className="flex justify-end items-center gap-4">
          <button
            type="button"
            onClick={close}
            className="px-6 py-4 bg-white rounded outline outline-1 -outline-offset-1 outline-black text-neutral-900 text-base font-medium leading-4 hover:bg-neutral-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={!canSubmit}
            className="px-6 py-4 bg-neutral-900 rounded text-white text-base font-medium leading-4 hover:bg-black disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
};

export default PayReimburseHirerModal;
