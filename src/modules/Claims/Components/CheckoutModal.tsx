import React, { useState, useRef, useEffect } from "react";
import { X, Camera, ChevronRight, ChevronLeft, Loader2 } from "lucide-react";
import Yes from "../../../assets/AutoClaim_icon/Yes.svg";
import No from "../../../assets/AutoClaim_icon/No.svg";
import Downloadd from "../../../assets/AutoClaim_icon/Downloadd.svg";
import { deleteDriverCheckImage } from "../../../services/HireVehicleProvided/HireVehicleProvided";

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  formData: any;
  setFormData: any;
  step: number;
  setStep: any;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  onSave,
  formData,
  setFormData,
  step,
  setStep,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Updated to use "Yes"/"No" strings by default
  const defaultFormData = {
    interiorCleanCheckOut: "No",
    interiorCleanCheckIn: "No",
    interiorDamage: "No",
    interiorDamageDescription: "",
    interiorPhotos: [],
    exteriorCleanCheckOut: "No",
    exteriorCleanCheckIn: "No",
    exteriorDamage: "No",
    exteriorDamageDescription: "",
    exteriorPhotos: [],
    petrolCheckoutCharge: "No",
    petrolChargeAmount: "0",
    petrolChargeReason: "",
    applyDamageCharges: "No",
    damageCharges: "0",
    damageNotes: "",
    valetCharge: 30,
  };

  const totalCharges = (
    parseFloat(formData.valetCharge?.toString() || "0") +
    parseFloat(formData.petrolChargeAmount || "0") +
    parseFloat(formData.damageCharges || "0")
  ).toFixed(2);

  const handleNext = () => setStep((s: number) => Math.min(s + 1, 3));
  const handleBack = () => setStep((s: number) => Math.max(s - 1, 1));

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      if (!formData || Object.keys(formData).length === 0) {
        setFormData(defaultFormData);
      }
    }
  }, [isOpen]);

  // Valet charge is always £30
  useEffect(() => {
    if (formData.valetCharge !== 30) {
      setFormData((prev: any) => ({ ...prev, valetCharge: 30 }));
    }
  }, []);

  const handleClose = () => {
    if (submitting) return;
    setStep(1);
    onClose();
  };

  // Saving the checkout also triggers the confirmation email, which can take a
  // moment — show a loader on the Save button until it resolves.
  const [submitting, setSubmitting] = useState(false);
  const handleSave = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      await onSave(formData);
    } finally {
      setSubmitting(false);
    }
  };

  // Delete an already-saved photo (server-side) and drop it from the form state.
  const handleRemoveExistingImage = async (
    key: "interiorImages" | "exteriorImages",
    id: number,
  ) => {
    try {
      await deleteDriverCheckImage(id);
    } catch {
      // Ignore API failure — still remove it from the view.
    }
    setFormData((prev: any) => ({
      ...prev,
      [key]: (prev[key] || []).filter((img: any) => img.id !== id),
    }));
  };

  if (!isOpen) return null;
const formatMoneyOnBlur = (field: string) => {
  const value = parseFloat(formData[field] || "0");

  setFormData((prev: any) => ({
    ...prev,
    [field]: Number.isNaN(value) ? "0.00" : value.toFixed(2),
  }));
};
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 font-['Stack_Sans_Headline']">
      <div className="w-[640px] bg-white rounded-lg p-6 flex flex-col gap-4 shadow-xl">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h2 className="text-neutral-900 text-[20px] font-weight-600 leading-5">
            Driver Check-Out / Check-In - <br /> Cleanliness & Damage
          </h2>
          <div className="flex gap-3">
            {[1, 2, 3].map((s) => (
              <button
                key={s}
                type="button"
                aria-label={`Go to step ${s}`}
                onClick={() => setStep(s)}
                className={`w-3 h-3 rounded-full cursor-pointer transition-transform hover:scale-125 ${
                  step === s
                    ? "bg-blue-600 ring-2 ring-blue-200"
                    : step > s
                      ? "bg-blue-600"
                      : "bg-zinc-300"
                }`}
              />
            ))}
          </div>
        </div>

        <div className="h-px bg-slate-100 w-full" />

        {/* Step 1: Interior */}
        {step === 1 && (
          <div className="flex flex-col gap-6">
            <h3 className="text-black text-base font-weight-600">
              Interior (Inside)
            </h3>
            <ModalRadioGroup
              label="Was the interior clean at check-out?"
              value={formData.interiorCleanCheckOut}
              onChange={(v) =>
                setFormData((prev: any) => ({
                  ...prev,
                  interiorCleanCheckOut: v,
                }))
              }
            />
            <ModalRadioGroup
              label="Was the interior clean at check-in?"
              value={formData.interiorCleanCheckIn}
              onChange={(v) =>
                setFormData((prev: any) => ({
                  ...prev,
                  interiorCleanCheckIn: v,
                }))
              }
            />
            <ModalRadioGroup
              label="Was any interior damage observed at check-in?"
              value={formData.interiorDamage}
              onChange={(v) =>
                setFormData((prev: any) => ({ ...prev, interiorDamage: v }))
              }
            />
            {formData.interiorDamage === "Yes" && (
              <div className="flex flex-col gap-2">
                <label className="text-slate-700 text-sm font-weight-400">
                  Describe the interior damage
                </label>
                <textarea
                  className="w-full h-24 px-5 py-4 border border-slate-200 rounded text-base font-light outline-none focus:border-blue-500"
                  placeholder="Value"
                  value={formData.interiorDamageDescription}
                  onChange={(e) =>
                    setFormData((prev: any) => ({
                      ...prev,
                      interiorDamageDescription: e.target.value,
                    }))
                  }
                />
              </div>
            )}
            <PhotoUploadBox
              label="Add Photos (Optional)"
              photos={formData.interiorPhotos || []}
              existingImages={formData.interiorImages || []}
              onRemoveExisting={(id: number) =>
                handleRemoveExistingImage("interiorImages", id)
              }
              onAdd={(files: File[]) =>
                setFormData((prev: any) => ({
                  ...prev,
                  interiorPhotos: [...(prev.interiorPhotos || []), ...files],
                }))
              }
              onRemove={(idx: number) =>
                setFormData((prev: any) => ({
                  ...prev,
                  interiorPhotos: (prev.interiorPhotos || []).filter(
                    (_: any, i: number) => i !== idx,
                  ),
                }))
              }
            />
          </div>
        )}

        {/* Step 2: Exterior */}
        {step === 2 && (
          <div className="flex flex-col gap-6">
            <h3 className="text-black text-base font-weight-600">
              Exterior (Outside)
            </h3>
            <ModalRadioGroup
              label="Was the exterior clean at check-out?"
              value={formData.exteriorCleanCheckOut}
              onChange={(v) =>
                setFormData((prev: any) => ({
                  ...prev,
                  exteriorCleanCheckOut: v,
                }))
              }
            />
            <ModalRadioGroup
              label="Was the exterior clean at check-in?"
              value={formData.exteriorCleanCheckIn}
              onChange={(v) =>
                setFormData((prev: any) => ({
                  ...prev,
                  exteriorCleanCheckIn: v,
                }))
              }
            />
            <ModalRadioGroup
              label="Was any exterior damage observed at check-in?"
              value={formData.exteriorDamage}
              onChange={(v) =>
                setFormData((prev: any) => ({ ...prev, exteriorDamage: v }))
              }
            />
            {formData.exteriorDamage === "Yes" && (
              <div className="flex flex-col gap-2">
                <label className="text-slate-700 text-sm font-weight-400">
                  Describe the exterior damage
                </label>
                <textarea
                  className="w-full h-24 px-5 py-4 border border-slate-200 rounded text-base font-light outline-none focus:border-blue-500"
                  placeholder="Value"
                  value={formData.exteriorDamageDescription}
                  onChange={(e) =>
                    setFormData((prev: any) => ({
                      ...prev,
                      exteriorDamageDescription: e.target.value,
                    }))
                  }
                />
              </div>
            )}
            <PhotoUploadBox
              label="Add Photos (Optional)"
              photos={formData.exteriorPhotos || []}
              existingImages={formData.exteriorImages || []}
              onRemoveExisting={(id: number) =>
                handleRemoveExistingImage("exteriorImages", id)
              }
              onAdd={(files: File[]) =>
                setFormData((prev: any) => ({
                  ...prev,
                  exteriorPhotos: [...(prev.exteriorPhotos || []), ...files],
                }))
              }
              onRemove={(idx: number) =>
                setFormData((prev: any) => ({
                  ...prev,
                  exteriorPhotos: (prev.exteriorPhotos || []).filter(
                    (_: any, i: number) => i !== idx,
                  ),
                }))
              }
            />
          </div>
        )}

        {/* Step 3: Charges */}
        {step === 3 && (
          <div className="flex flex-col gap-6 overflow-y-auto max-h-[400px] pr-2">
            <h3 className="text-black text-base font-weight-600">Charges</h3>

            <ModalRadioGroup
              label="Apply Petrol Checkout Charge?"
              value={formData.petrolCheckoutCharge}
              onChange={(v) =>
                setFormData((prev: any) => ({
                  ...prev,
                  petrolCheckoutCharge: v,
                  petrolChargeAmount: v === "No" ? "0" : prev.petrolChargeAmount,
                  petrolChargeReason: v === "No" ? "" : prev.petrolChargeReason,
                }))
              }
            />

            {formData.petrolCheckoutCharge === "Yes" && (
              <>
                <div className="flex flex-col gap-2">
                  <label className="text-slate-700 text-sm font-weight-400">
                    Petrol Checkout Charges
                  </label>
                  <div className="flex items-center px-5 py-3 border border-slate-200 rounded bg-white">
                    <span className="text-slate-300">£</span>
                    <input
                      className="ml-2 w-full outline-none font-light"
                      value={formData.petrolChargeAmount}
                      onChange={(e) =>
                        setFormData((prev: any) => ({
                          ...prev,
                          petrolChargeAmount: e.target.value,
                        }))
                      }
                      onBlur={() => formatMoneyOnBlur("petrolChargeAmount")}
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-slate-700 text-sm font-weight-400">
                    Reason/notes (optional)
                  </label>
                  <textarea
                    className="w-full h-24 px-5 py-4 border border-slate-200 rounded text-base font-light outline-none"
                    placeholder="Value"
                    value={formData.petrolChargeReason}
                    onChange={(e) =>
                      setFormData((prev: any) => ({
                        ...prev,
                        petrolChargeReason: e.target.value,
                      }))
                    }
                  />
                </div>
              </>
            )}

            <div className="h-px bg-slate-100" />

            <ModalRadioGroup
              label="Apply Damage Charges now?"
              value={formData.applyDamageCharges}
              onChange={(v) =>
                setFormData((prev: any) => ({
                  ...prev,
                  applyDamageCharges: v,
                  damageCharges: v === "No" ? "0" : prev.damageCharges,
                  damageNotes: v === "No" ? "" : prev.damageNotes,
                }))
              }
            />

            {formData.applyDamageCharges === "Yes" && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-slate-700 text-sm font-weight-400">
                      Damage Charges
                    </label>
                    <div className="flex items-center px-5 py-3 border border-slate-200 rounded bg-white">
                      <span className="text-slate-300">£</span>
                      <input
                        className="ml-2 w-full outline-none font-light"
                        value={formData.damageCharges}
                        onChange={(e) =>
                          setFormData((prev: any) => ({
                            ...prev,
                            damageCharges: e.target.value,
                          }))
                        }
                        onBlur={() => formatMoneyOnBlur("damageCharges")}
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-slate-700 text-sm font-weight-400">
                      Damage Charges Paid Now
                    </label>
                    <div className="flex items-center px-5 py-3 border border-slate-200 rounded bg-slate-50 font-weight-600">
                      <span>£ {totalCharges}</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-slate-700 text-sm font-weight-400">
                    Notes (optional)
                  </label>
                  <textarea
                    className="w-full h-24 px-5 py-4 border border-slate-200 rounded text-base font-light outline-none"
                    placeholder="Value"
                    value={formData.damageNotes}
                    onChange={(e) =>
                      setFormData((prev: any) => ({
                        ...prev,
                        damageNotes: e.target.value,
                      }))
                    }
                  />
                </div>
              </>
            )}
          </div>
        )}

        <div className="h-px bg-slate-100 w-full" />

        {/* Footer Buttons */}
        <div className="flex justify-between">
          {step > 1 ? (
            <button
              disabled={submitting}
              className="px-10 py-4 bg-white border border-blue-600 text-blue-600 rounded-lg text-base font-weight-400 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleBack}
            >
              <ChevronLeft size={18} /> Back
            </button>
          ) : (
            <div className="w-[120px]" />
          )}
          <div className="flex justify-end gap-4">
            <button
              disabled={submitting}
              className="px-10 py-4 bg-white border border-blue-600 text-blue-600 rounded-lg text-base font-weight-400 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleClose}
            >
              Cancel
            </button>

            <button
              disabled={submitting}
              className="px-10 py-4 bg-blue-600 text-white rounded-lg text-base font-weight-400 flex items-center justify-center gap-2 min-w-[140px] disabled:opacity-70 disabled:cursor-not-allowed"
              onClick={step === 3 ? handleSave : handleNext}
            >
              {step === 3 ? (
                submitting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" /> Saving…
                  </>
                ) : (
                  "Save"
                )
              ) : (
                "Next"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Reusable Components
const ModalRadioGroup = ({ label, value, onChange }: any) => (
  <div className="flex flex-col gap-5">
    <label className="text-black text-sm font-weight-400">{label}</label>
    <div className="flex gap-5">
      {["Yes", "No"].map((opt) => (
        <div
          key={opt}
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => onChange(opt)}
        >
          {/* Logic to render Yes.svg if active, else No.svg */}
          <img src={value === opt ? Yes : No} alt="radio" className="w-5 h-5" />
          <span className="text-sm font-normal">{opt}</span>
        </div>
      ))}
    </div>
  </div>
);

const PhotoUploadBox = ({
  label,
  photos = [],
  existingImages = [],
  onAdd,
  onRemove,
  onRemoveExisting,
}: {
  label: string;
  photos?: File[];
  existingImages?: { id: number; url: string }[];
  onAdd?: (files: File[]) => void;
  onRemove?: (idx: number) => void;
  onRemoveExisting?: (id: number) => void;
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div className="w-full flex flex-col gap-3">
      <div
        onClick={() => inputRef.current?.click()}
        className="w-full p-6 rounded-lg border border-slate-200 flex flex-col justify-center items-center gap-6 cursor-pointer hover:bg-slate-50"
      >
        <div className="w-12 h-12 rounded-full flex items-center justify-center">
          <img src={Downloadd} alt="upload" />
        </div>
        <span className="text-black text-base font-weight-600">{label}</span>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          const files = Array.from(e.target.files || []);
          if (files.length && onAdd) onAdd(files);
          e.target.value = "";
        }}
      />
      {(existingImages.length > 0 || photos.length > 0) && (
        <div className="flex flex-wrap gap-3">
          {existingImages.map((img, i) => (
            <div
              key={`existing-${img.id}`}
              className="relative w-20 h-20 rounded-md overflow-hidden border border-slate-200"
            >
              <img
                src={img.url}
                alt={`saved-photo-${i + 1}`}
                className="w-full h-full object-cover"
              />
              {onRemoveExisting && (
                <button
                  type="button"
                  onClick={() => onRemoveExisting(img.id)}
                  className="absolute top-0 right-0 w-5 h-5 flex items-center justify-center bg-black/60 text-white text-xs rounded-bl"
                >
                  ×
                </button>
              )}
            </div>
          ))}
          {photos.map((file, i) => (
            <div
              key={i}
              className="relative w-20 h-20 rounded-md overflow-hidden border border-slate-200"
            >
              <img
                src={file instanceof File ? URL.createObjectURL(file) : (file as any)}
                alt={`photo-${i + 1}`}
                className="w-full h-full object-cover"
              />
              {onRemove && (
                <button
                  type="button"
                  onClick={() => onRemove(i)}
                  className="absolute top-0 right-0 w-5 h-5 flex items-center justify-center bg-black/60 text-white text-xs rounded-bl"
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
