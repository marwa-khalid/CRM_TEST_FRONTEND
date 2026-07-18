import React, { useState } from "react";
import { FleetTextInput, FleetMoneyInput, FleetDateField, FleetTimeSelect } from "./fields";
import FleetSpinnerLoader from "./FleetSpinnerLoader";

export interface CheckoutData {
  mileageStart: string;
  mileageEnd: string;
  checkoutDate: string;
  checkoutTime: string;
  cleanliness: string; // one of CLEANLINESS keys
  damageCharges: string;
  damageNotes: string;
}

export const EMPTY_CHECKOUT: CheckoutData = {
  mileageStart: "", mileageEnd: "", checkoutDate: "", checkoutTime: "",
  cleanliness: "", damageCharges: "", damageNotes: "",
};

const CLEANLINESS = [
  { key: "inside_outside_clean", label: "Inside and Outside Clean" },
  { key: "inside_dirty_outside_clean", label: "Inside Dirty and Outside Clean" },
  { key: "inside_clean_outside_dirty", label: "Inside Clean and Outside Dirty" },
  { key: "inside_outside_dirty", label: "Inside and Outside Dirty" },
];

const Radio: React.FC<{ checked: boolean; label: string; onClick: () => void }> = ({ checked, label, onClick }) => (
  <button type="button" onClick={onClick} className="flex items-center gap-2">
    <span className={`w-5 h-5 rounded-full flex items-center justify-center ${checked ? "bg-neutral-200" : "bg-neutral-300"}`}>
      <span className={`w-2 h-2 rounded-full ${checked ? "bg-neutral-900" : "bg-white"}`} />
    </span>
    <span className="text-black text-sm">{label}</span>
  </button>
);

const Dots: React.FC<{
  step: number;
  totalSteps: number;
  disabled?: boolean;
  onSelect: (step: number) => void;
}> = ({ step, totalSteps, disabled, onSelect }) => (
  <div className="flex items-center gap-3">
    {Array.from({ length: totalSteps }, (_, index) => index + 1).map((s) => (
      <button
        key={s}
        type="button"
        disabled={disabled}
        onClick={() => onSelect(s)}
        aria-label={`Go to checkout step ${s}`}
        className={`w-3 h-3 rounded-full transition-colors ${
          s === step ? "bg-neutral-900" : "bg-neutral-200 hover:bg-neutral-400"
        } disabled:cursor-not-allowed disabled:hover:bg-neutral-200`}
      />
    ))}
  </div>
);

const OUTLINE_BTN = "px-6 py-4 rounded bg-white text-neutral-900 text-base font-medium outline outline-1 -outline-offset-1 outline-neutral-900 hover:bg-neutral-50";
const DARK_BTN = "px-6 py-4 rounded bg-neutral-900 text-white text-base font-medium hover:bg-black";

// 3-step vehicle checkout (off-hire): Mileage & Return -> Cleanliness -> Charges & Notes.
export const FleetCheckoutModal: React.FC<{
  initial?: CheckoutData;
  onCancel: () => void;
  onComplete: (d: CheckoutData) => void | Promise<void>;
}> = ({ initial, onCancel, onComplete }) => {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<CheckoutData>(initial ?? EMPTY_CHECKOUT);
  const [submitting, setSubmitting] = useState(false);
  const set = <K extends keyof CheckoutData>(k: K, v: CheckoutData[K]) => setData((d) => ({ ...d, [k]: v }));
  const isCleanReturn = data.cleanliness === "inside_outside_clean";
  const totalSteps = isCleanReturn ? 2 : 3;
  const submit = async (payload: CheckoutData) => {
    setSubmitting(true);
    try {
      await onComplete(payload);
    } finally {
      setSubmitting(false);
    }
  };
  const completeCleanReturn = () => submit({ ...data, damageCharges: "0", damageNotes: "" });

  return (
    <div className="fixed inset-0 z-[110] bg-black/40 flex items-center justify-center p-4">
      {submitting && <FleetSpinnerLoader />}
      <div className="w-[680px] max-w-full h-[75vh] max-h-[92vh] p-6 bg-white rounded-lg flex flex-col gap-4 font-sans-headline overflow-y-auto">
        <div className="flex justify-between items-center">
          <h3 className="text-black text-xl font-semibold leading-5">
            {step === 1 ? "Mileage & Return Details" : step === 2 ? "Vehicle Cleanliness - Hire Start & Hire End" : "Charges & Notes"}
          </h3>
          <Dots step={step} totalSteps={totalSteps} disabled={submitting} onSelect={setStep} />
        </div>
        <div className="h-px bg-neutral-100" />

        {step === 1 && (
          <>
            <div className="grid grid-cols-2 gap-5">
              <FleetTextInput label="Mileage at Hire Start" placeholder="Mileage" inputMode="numeric" value={data.mileageStart} onChange={(v) => set("mileageStart", v)} />
              <FleetTextInput label="Mileage at Hire End" placeholder="Mileage" inputMode="numeric" value={data.mileageEnd} onChange={(v) => set("mileageEnd", v)} />
            </div>
            <div className="grid grid-cols-2 gap-5">
              <FleetDateField label="Date" value={data.checkoutDate} onChange={(v) => set("checkoutDate", v)} />
              <FleetTimeSelect label="Time" value={data.checkoutTime} onChange={(v) => set("checkoutTime", v)} />
            </div>
          </>
        )}

        {step === 2 && (
          <div className="flex flex-col gap-5">
            {CLEANLINESS.map((c) => (
              <div key={c.key} className="flex flex-col gap-3">
                <span className="text-neutral-700 text-sm font-medium">{c.label}</span>
                <div className="flex items-center gap-5">
                  <Radio checked={data.cleanliness === c.key} label="Yes" onClick={() => set("cleanliness", c.key)} />
                  <Radio checked={data.cleanliness !== c.key} label="No" onClick={() => set("cleanliness", data.cleanliness === c.key ? "" : data.cleanliness)} />
                </div>
              </div>
            ))}
          </div>
        )}

        {step === 3 && (
          <>
            <div className="text-black text-base font-semibold">Charges</div>
            <div className="w-80">
              <FleetMoneyInput label="Vehicle Damage Charges" value={data.damageCharges} onChange={(v) => set("damageCharges", v)} />
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-neutral-700 text-sm font-medium">Damage Notes / Comments</span>
              <textarea
                value={data.damageNotes}
                onChange={(e) => set("damageNotes", e.target.value)}
                placeholder="Value"
                rows={3}
                className="h-24 px-5 py-4 bg-white rounded outline outline-1 -outline-offset-1 outline-neutral-200 text-base text-neutral-900 placeholder:text-neutral-300 focus:outline-neutral-900 resize-none"
              />
            </div>
          </>
        )}

        <div className="h-px bg-neutral-100 mt-auto" />
        <div className="flex justify-end items-center gap-4">
          <button type="button" onClick={onCancel} disabled={submitting} className={`${OUTLINE_BTN} disabled:opacity-50 disabled:cursor-not-allowed`}>Cancel</button>
          {step === 1 ? (
            <button type="button" onClick={() => setStep(2)} disabled={submitting} className={`${DARK_BTN} disabled:opacity-70 disabled:cursor-not-allowed`}>Next</button>
          ) : step === 2 && isCleanReturn ? (
            <button type="button" onClick={completeCleanReturn} disabled={submitting} className={`${DARK_BTN} disabled:opacity-70 disabled:cursor-not-allowed`}>Save</button>
          ) : step < 3 ? (
            <button type="button" onClick={() => setStep(3)} disabled={submitting} className={`${DARK_BTN} disabled:opacity-70 disabled:cursor-not-allowed`}>Next</button>
          ) : (
            <button type="button" onClick={() => submit(data)} disabled={submitting} className={`${DARK_BTN} disabled:opacity-70 disabled:cursor-not-allowed`}>Save</button>
          )}
        </div>
      </div>
    </div>
  );
};

export default FleetCheckoutModal;
