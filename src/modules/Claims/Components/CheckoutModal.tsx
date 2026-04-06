// // import React, { useState, useRef } from "react";
// // import { X, Camera, ChevronRight, ChevronLeft } from "lucide-react";
// // import Yes from "../../../assets/AutoClaim_icon/Yes.svg";
// // import No from "../../../assets/AutoClaim_icon/No.svg";
// // import Downloadd from "../../../assets/AutoClaim_icon/Downloadd.svg";


// // interface CheckoutModalProps {
// //   isOpen: boolean;
// //   onClose: () => void;
// //     onSave: (data: any) => void;
// //     formData:any,
// //     setFormData: any,
// //     step: number,
// //     setStep:any
// // }

// // export const CheckoutModal: React.FC<CheckoutModalProps> = ({
// //   isOpen,
// //   onClose,
// //     onSave,
// //     formData, setFormData,
// //   step,setStep
// // }) => {
// //   const fileInputRef = useRef<HTMLInputElement>(null);



// //   const totalCharges = (
// //     parseFloat(formData.valetCharge.toString()) +
// //     parseFloat(formData.petrolChargeAmount || "0") +
// //     parseFloat(formData.damageCharges || "0")
// //   ).toFixed(2); // Total = Valet + Petrol + Damage [cite: 131, 133]

// //   const handleNext = () => setStep((s) => Math.min(s + 1, 3));
// //   const handleBack = () => setStep((s) => Math.max(s - 1, 1));

// //   if (!isOpen) return null;

// //   return (
// //     <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 font-['Stack_Sans_Headline']">
// //       <div className="w-[640px] bg-white rounded-lg p-6 flex flex-col gap-4 shadow-xl">
// //         {/* Header */}
// //         <div className="flex justify-between items-center">
// //           <h2 className="text-black text-xl font-weight-600 leading-5">
// //             Driver Check-Out / Check-In - <br /> Cleanliness & Damage
// //           </h2>
// //           <div className="flex gap-3">
// //             {[1, 2, 3].map((s) => (
// //               <div
// //                 key={s}
// //                 className={`w-3 h-3 rounded-full ${step >= s ? "bg-blue-600" : "bg-zinc-300"}`}
// //               />
// //             ))}
// //           </div>
// //         </div>

// //         <div className="h-px bg-slate-100 w-full" />

// //         {/* Step 1: Interior [cite: 122] */}
// //         {step === 1 && (
// //           <div className="flex flex-col gap-6">
// //             <h3 className="text-black text-base font-weight-600">
// //               Interior (Inside)
// //             </h3>
// //             <ModalRadioGroup
// //               label="Was the interior clean at check-out?"
// //               value={formData.interiorCleanCheckOut}
// //               onChange={(v) =>
// //                 setFormData({ ...formData, interiorCleanCheckOut: v })
// //               }
// //             />
// //             <ModalRadioGroup
// //               label="Was the interior clean at check-in?"
// //               value={formData.interiorCleanCheckIn}
// //               onChange={(v) =>
// //                 setFormData({ ...formData, interiorCleanCheckIn: v })
// //               }
// //             />
// //             <ModalRadioGroup
// //               label="Was any interior damage observed at check-in?"
// //               value={formData.interiorDamage ? "Yes" : "No"}
// //               onChange={(v) =>
// //                 setFormData({ ...formData, interiorDamage: v === "Yes" })
// //               }
// //             />
// //             {formData.interiorDamage && (
// //               <div className="flex flex-col gap-2">
// //                 <label className="text-slate-700 text-sm font-weight-400">
// //                   Describe the interior damage
// //                 </label>
// //                 <textarea
// //                   className="w-full h-24 px-5 py-4 border border-slate-200 rounded text-base font-light outline-none focus:border-blue-500"
// //                   placeholder="Value"
// //                   value={formData.interiorDamageDescription}
// //                   onChange={(e) =>
// //                     setFormData({
// //                       ...formData,
// //                       interiorDamageDescription: e.target.value,
// //                     })
// //                   }
// //                 />
// //               </div>
// //             )}
// //             <PhotoUploadBox label="Add Photos (Optional)" />
// //           </div>
// //         )}

// //         {/* Step 2: Exterior [cite: 122] */}
// //         {step === 2 && (
// //           <div className="flex flex-col gap-6">
// //             <h3 className="text-black text-base font-weight-600">
// //               Exterior (Outside)
// //             </h3>
// //             <ModalRadioGroup
// //               label="Was the exterior clean at check-out?"
// //               value={formData.exteriorCleanCheckOut}
// //               onChange={(v) =>
// //                 setFormData({ ...formData, exteriorCleanCheckOut: v })
// //               }
// //             />
// //             <ModalRadioGroup
// //               label="Was the exterior clean at check-in?"
// //               value={formData.exteriorCleanCheckIn}
// //               onChange={(v) =>
// //                 setFormData({ ...formData, exteriorCleanCheckIn: v })
// //               }
// //             />
// //             <ModalRadioGroup
// //               label="Was any exterior damage observed at check-in?"
// //               value={formData.exteriorDamage ? "Yes" : "No"}
// //               onChange={(v) =>
// //                 setFormData({ ...formData, exteriorDamage: v === "Yes" })
// //               }
// //             />
// //             {formData.exteriorDamage && (
// //               <div className="flex flex-col gap-2">
// //                 <label className="text-slate-700 text-sm font-weight-400">
// //                   Describe the exterior damage
// //                 </label>
// //                 <textarea
// //                   className="w-full h-24 px-5 py-4 border border-slate-200 rounded text-base font-light outline-none focus:border-blue-500"
// //                   placeholder="Value"
// //                   value={formData.exteriorDamageDescription}
// //                   onChange={(e) =>
// //                     setFormData({
// //                       ...formData,
// //                       exteriorDamageDescription: e.target.value,
// //                     })
// //                   }
// //                 />
// //               </div>
// //             )}
// //             <PhotoUploadBox label="Add Photos (Optional)" />
// //           </div>
// //         )}

// //         {/* Step 3: Charges [cite: 123, 125, 126, 129] */}
// //         {step === 3 && (
// //           <div className="flex flex-col gap-6">
// //             <h3 className="text-black text-base font-weight-600">Charges</h3>
// //             <div className="grid grid-cols-2 gap-5">
// //               <ModalRadioGroup
// //                 label="Apply Petrol Checkout Charge?"
// //                 value={formData.petrolCheckoutCharge}
// //                 onChange={(v) =>
// //                   setFormData({ ...formData, petrolCheckoutCharge: v })
// //                 }
// //               />
// //               <div className="flex flex-col gap-2">
// //                 <label className="text-slate-700 text-sm font-weight-400">
// //                   Petrol Checkout Charges
// //                 </label>
// //                 <div className="flex items-center px-5 py-3 border border-slate-200 rounded bg-white">
// //                   <span className="text-slate-300">£</span>
// //                   <input
// //                     className="ml-2 w-full outline-none font-light"
// //                     value={formData.petrolChargeAmount}
// //                     onChange={(e) =>
// //                       setFormData({
// //                         ...formData,
// //                         petrolChargeAmount: e.target.value,
// //                       })
// //                     }
// //                   />
// //                 </div>
// //               </div>
// //             </div>
// //             <div className="flex flex-col gap-2">
// //               <label className="text-slate-700 text-sm font-weight-400">
// //                 Reason/notes (optional)
// //               </label>
// //               <textarea
// //                 className="w-full h-24 px-5 py-4 border border-slate-200 rounded text-base font-light outline-none"
// //                 placeholder="Value"
// //                 value={formData.petrolChargeReason}
// //                 onChange={(e) =>
// //                   setFormData({
// //                     ...formData,
// //                     petrolChargeReason: e.target.value,
// //                   })
// //                 }
// //               />
// //             </div>
// //             <div className="h-px bg-slate-100" />
// //             <ModalRadioGroup
// //               label="Apply Damage Charges now?"
// //               value={formData.applyDamageCharges}
// //               onChange={(v) =>
// //                 setFormData({ ...formData, applyDamageCharges: v })
// //               }
// //             />
// //             <div className="grid grid-cols-2 gap-4">
// //               <div className="flex flex-col gap-2">
// //                 <label className="text-slate-700 text-sm font-weight-400">
// //                   Damage Charges
// //                 </label>
// //                 <div className="flex items-center px-5 py-3 border border-slate-200 rounded bg-white">
// //                   <span className="text-slate-300">£</span>
// //                   <input
// //                     className="ml-2 w-full outline-none font-light"
// //                     value={formData.damageCharges}
// //                     onChange={(e) =>
// //                       setFormData({
// //                         ...formData,
// //                         damageCharges: e.target.value,
// //                       })
// //                     }
// //                   />
// //                 </div>
// //               </div>
// //               <div className="flex flex-col gap-2">
// //                 <label className="text-slate-700 text-sm font-weight-400">
// //                   Damage Charges Paid Now
// //                 </label>
// //                 <div className="flex items-center px-5 py-3 border border-slate-200 rounded bg-slate-50 font-weight-600">
// //                   <span>£ {totalCharges}</span>
// //                 </div>
// //               </div>
// //             </div>
// //             <div className="flex flex-col gap-2">
// //               <label className="text-slate-700 text-sm font-weight-400">
// //                 Notes (optional)
// //               </label>
// //               <textarea
// //                 className="w-full h-24 px-5 py-4 border border-slate-200 rounded text-base font-light outline-none"
// //                 placeholder="Value"
// //                 value={formData.damageNotes}
// //                 onChange={(e) =>
// //                   setFormData({
// //                     ...formData,
// //                     damageNotes: e.target.value,
// //                   })
// //                 }
// //               />
// //             </div>
// //           </div>
// //         )}

// //         <div className="h-px bg-slate-100 w-full" />

// //         {/* Footer Buttons */}
// //         <div className="flex justify-between">
// //           {step > 1 ? (
// //             <button
// //               className="px-10 py-4 bg-white border border-blue-600 text-blue-600 rounded-lg text-base font-weight-400 flex items-center gap-2"
// //               onClick={handleBack}
// //             >
// //               <ChevronLeft size={18} /> Back
// //             </button>
// //           ) :<button className="invisible"></button>}
// //           <div className="flex justify-end gap-4">
// //             <button
// //               className="px-10 py-4 bg-white border border-blue-600 text-blue-600 rounded-lg text-base font-weight-400 flex items-center gap-2"
// //               onClick={onClose}
// //             >
// //               Cancel
// //             </button>

// //             <button
// //               className="px-10 py-4 bg-blue-600 text-white rounded-lg text-base font-weight-400 flex items-center gap-2"
// //               onClick={step === 3 ? () => onSave(formData) : handleNext}
// //             >
// //               {step === 3 ? "Save" : "Next"}{" "}
// //               {/* {step < 3 && <ChevronRight size={18} />} */}
// //             </button>
// //           </div>
// //         </div>
// //       </div>
// //     </div>
// //   );
// // };

// // // Reusable Components
// // const ModalRadioGroup = ({ label, value, onChange }: any) => (
// //   <div className="flex flex-col gap-5">
// //     <label className="text-black text-sm font-weight-400">{label}</label>
// //     <div className="flex gap-5">
// //       {["Yes", "No"].map((opt) => (
// //         <div
// //           key={opt}
// //           className="flex items-center gap-2 cursor-pointer"
// //           onClick={() => onChange(opt)}
// //         >
// //           <img src={value === opt ? Yes : No} alt="radio" />
// //           <span className="text-sm font-normal">{opt}</span>
// //         </div>
// //       ))}
// //     </div>
// //   </div>
// // );

// // const PhotoUploadBox = ({ label }: { label: string }) => (
// //   <div className="w-full p-6 rounded-lg border border-slate-200 flex flex-col justify-center items-center gap-6 cursor-pointer hover:bg-slate-50">
// //     <div className="w-12 h-12 rounded-full flex items-center justify-center">
// //       <img src={Downloadd} alt="" />
// //     </div>
// //     <span className="text-black text-base font-weight-600">{label}</span>
// //   </div>
// // );
// import React, { useState, useRef, useEffect } from "react";
// import { X, Camera, ChevronRight, ChevronLeft } from "lucide-react";
// import Yes from "../../../assets/AutoClaim_icon/Yes.svg";
// import No from "../../../assets/AutoClaim_icon/No.svg";
// import Downloadd from "../../../assets/AutoClaim_icon/Downloadd.svg";

// interface CheckoutModalProps {
//   isOpen: boolean;
//   onClose: () => void;
//   onSave: (data: any) => void;
//   formData: any;
//   setFormData: any;
//   step: number;
//   setStep: any;
// }

// export const CheckoutModal: React.FC<CheckoutModalProps> = ({
//   isOpen,
//   onClose,
//   onSave,
//   formData,
//   setFormData,
//   step,
//   setStep,
// }) => {
//   const fileInputRef = useRef<HTMLInputElement>(null);

//   // Default structure for safety
//   const defaultFormData = {
//     interiorCleanCheckOut: "",
//     interiorCleanCheckIn: "",
//     interiorDamage: false,
//     interiorDamageDescription: "",
//     interiorPhotos: [],
//     exteriorCleanCheckOut: "",
//     exteriorCleanCheckIn: "",
//     exteriorDamage: false,
//     exteriorDamageDescription: "",
//     exteriorPhotos: [],
//     petrolCheckoutCharge: "",
//     petrolChargeAmount: "0",
//     petrolChargeReason: "",
//     applyDamageCharges: "",
//     damageCharges: "0",
//     damageNotes: "",
//     valetCharge: 30,
//   };

//   // Merge with provided formData safely
//   // const safeFormData = { ...defaultFormData, ...formData };

//   // Total Charges
//   const totalCharges = (
//     parseFloat(formData.valetCharge?.toString() || "0") +
//     parseFloat(formData.petrolChargeAmount || "0") +
//     parseFloat(formData.damageCharges || "0")
//   ).toFixed(2);

//   const handleNext = () => setStep((s: number) => Math.min(s + 1, 3));
//   const handleBack = () => setStep((s: number) => Math.max(s - 1, 1));

//   // Reset modal state when opening
//   useEffect(() => {
//     if (isOpen) {
//       setStep(1);
//       if (!formData || Object.keys(formData).length === 0) {
//         setFormData({ ...defaultFormData });
//       }
//     }
//   }, [isOpen]);

//   const handleClose = () => {
//     setStep(1);
//     onClose();
//   };

//   if (!isOpen) return null;

//   return (
//     <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 font-['Stack_Sans_Headline']">
//       <div className="w-[640px] bg-white rounded-lg p-6 flex flex-col gap-4 shadow-xl">
//         {/* Header */}
//         <div className="flex justify-between items-center">
//           <h2 className="text-black text-xl font-weight-600 leading-5">
//             Driver Check-Out / Check-In - <br /> Cleanliness & Damage
//           </h2>
//           <div className="flex gap-3">
//             {[1, 2, 3].map((s) => (
//               <div
//                 key={s}
//                 className={`w-3 h-3 rounded-full ${
//                   step >= s ? "bg-blue-600" : "bg-zinc-300"
//                 }`}
//               />
//             ))}
//           </div>
//         </div>

//         <div className="h-px bg-slate-100 w-full" />

//         {/* Step 1: Interior */}
//         {step === 1 && (
//           <div className="flex flex-col gap-6">
//             <h3 className="text-black text-base font-weight-600">
//               Interior (Inside)
//             </h3>
//             <ModalRadioGroup
//               label="Was the interior clean at check-out?"
//               value={formData.interiorCleanCheckOut}
//               onChange={(v) =>
//                 setFormData((prev: any) => ({
//                   ...prev,
//                   interiorCleanCheckOut: v,
//                 }))
//               }
//             />
//             <ModalRadioGroup
//               label="Was the interior clean at check-in?"
//               value={formData.interiorCleanCheckIn}
//               onChange={(v) =>
//                 setFormData((prev: any) => ({
//                   ...prev,
//                   interiorCleanCheckIn: v,
//                 }))
//               }
//             />
//             <ModalRadioGroup
//               label="Was any interior damage observed at check-in?"
//               value={formData.interiorDamage ? "Yes" : "No"}
//               onChange={(v) =>
//                 setFormData((prev: any) => ({
//                   ...prev,
//                   interiorDamage: v === "Yes",
//                 }))
//               }
//             />
//             {formData.interiorDamage && (
//               <div className="flex flex-col gap-2">
//                 <label className="text-slate-700 text-sm font-weight-400">
//                   Describe the interior damage
//                 </label>
//                 <textarea
//                   className="w-full h-24 px-5 py-4 border border-slate-200 rounded text-base font-light outline-none focus:border-blue-500"
//                   placeholder="Value"
//                   value={formData.interiorDamageDescription}
//                   onChange={(e) =>
//                     setFormData((prev: any) => ({
//                       ...prev,
//                       interiorDamageDescription: e.target.value,
//                     }))
//                   }
//                 />
//               </div>
//             )}
//             <PhotoUploadBox label="Add Photos (Optional)" />
//           </div>
//         )}

//         {/* Step 2: Exterior */}
//         {step === 2 && (
//           <div className="flex flex-col gap-6">
//             <h3 className="text-black text-base font-weight-600">
//               Exterior (Outside)
//             </h3>
//             <ModalRadioGroup
//               label="Was the exterior clean at check-out?"
//               value={formData.exteriorCleanCheckOut}
//               onChange={(v) =>
//                 setFormData((prev: any) => ({
//                   ...prev,
//                   exteriorCleanCheckOut: v,
//                 }))
//               }
//             />
//             <ModalRadioGroup
//               label="Was the exterior clean at check-in?"
//               value={formData.exteriorCleanCheckIn}
//               onChange={(v) =>
//                 setFormData((prev: any) => ({
//                   ...prev,
//                   exteriorCleanCheckIn: v,
//                 }))
//               }
//             />
//             <ModalRadioGroup
//               label="Was any exterior damage observed at check-in?"
//               value={formData.exteriorDamage ? "Yes" : "No"}
//               onChange={(v) =>
//                 setFormData((prev: any) => ({
//                   ...prev,
//                   exteriorDamage: v === "Yes",
//                 }))
//               }
//             />
//             {formData.exteriorDamage && (
//               <div className="flex flex-col gap-2">
//                 <label className="text-slate-700 text-sm font-weight-400">
//                   Describe the exterior damage
//                 </label>
//                 <textarea
//                   className="w-full h-24 px-5 py-4 border border-slate-200 rounded text-base font-light outline-none focus:border-blue-500"
//                   placeholder="Value"
//                   value={formData.exteriorDamageDescription}
//                   onChange={(e) =>
//                     setFormData((prev: any) => ({
//                       ...prev,
//                       exteriorDamageDescription: e.target.value,
//                     }))
//                   }
//                 />
//               </div>
//             )}
//             <PhotoUploadBox label="Add Photos (Optional)" />
//           </div>
//         )}

//         {/* Step 3: Charges */}
//         {step === 3 && (
//           <div className="flex flex-col gap-6">
//             <h3 className="text-black text-base font-weight-600">Charges</h3>
//             <div className="grid grid-cols-2 gap-5">
//               <ModalRadioGroup
//                 label="Apply Petrol Checkout Charge?"
//                 value={formData.petrolCheckoutCharge}
//                 onChange={(v) =>
//                   setFormData((prev: any) => ({
//                     ...prev,
//                     petrolCheckoutCharge: v,
//                   }))
//                 }
//               />
//               <div className="flex flex-col gap-2">
//                 <label className="text-slate-700 text-sm font-weight-400">
//                   Petrol Checkout Charges
//                 </label>
//                 <div className="flex items-center px-5 py-3 border border-slate-200 rounded bg-white">
//                   <span className="text-slate-300">£</span>
//                   <input
//                     className="ml-2 w-full outline-none font-light"
//                     value={formData.petrolChargeAmount}
//                     onChange={(e) =>
//                       setFormData((prev: any) => ({
//                         ...prev,
//                         petrolChargeAmount: e.target.value,
//                       }))
//                     }
//                   />
//                 </div>
//               </div>
//             </div>

//             <div className="flex flex-col gap-2">
//               <label className="text-slate-700 text-sm font-weight-400">
//                 Reason/notes (optional)
//               </label>
//               <textarea
//                 className="w-full h-24 px-5 py-4 border border-slate-200 rounded text-base font-light outline-none"
//                 placeholder="Value"
//                 value={formData.petrolChargeReason}
//                 onChange={(e) =>
//                   setFormData((prev: any) => ({
//                     ...prev,
//                     petrolChargeReason: e.target.value,
//                   }))
//                 }
//               />
//             </div>

//             <div className="h-px bg-slate-100" />

//             <ModalRadioGroup
//               label="Apply Damage Charges now?"
//               value={formData.applyDamageCharges}
//               onChange={(v) =>
//                 setFormData((prev: any) => ({
//                   ...prev,
//                   applyDamageCharges: v,
//                 }))
//               }
//             />

//             <div className="grid grid-cols-2 gap-4">
//               <div className="flex flex-col gap-2">
//                 <label className="text-slate-700 text-sm font-weight-400">
//                   Damage Charges
//                 </label>
//                 <div className="flex items-center px-5 py-3 border border-slate-200 rounded bg-white">
//                   <span className="text-slate-300">£</span>
//                   <input
//                     className="ml-2 w-full outline-none font-light"
//                     value={formData.damageCharges}
//                     onChange={(e) =>
//                       setFormData((prev: any) => ({
//                         ...prev,
//                         damageCharges: e.target.value,
//                       }))
//                     }
//                   />
//                 </div>
//               </div>
//               <div className="flex flex-col gap-2">
//                 <label className="text-slate-700 text-sm font-weight-400">
//                   Damage Charges Paid Now
//                 </label>
//                 <div className="flex items-center px-5 py-3 border border-slate-200 rounded bg-slate-50 font-weight-600">
//                   <span>£ {totalCharges}</span>
//                 </div>
//               </div>
//             </div>

//             <div className="flex flex-col gap-2">
//               <label className="text-slate-700 text-sm font-weight-400">
//                 Notes (optional)
//               </label>
//               <textarea
//                 className="w-full h-24 px-5 py-4 border border-slate-200 rounded text-base font-light outline-none"
//                 placeholder="Value"
//                 value={formData.damageNotes}
//                 onChange={(e) =>
//                   setFormData((prev: any) => ({
//                     ...prev,
//                     damageNotes: e.target.value,
//                   }))
//                 }
//               />
//             </div>
//           </div>
//         )}

//         <div className="h-px bg-slate-100 w-full" />

//         {/* Footer Buttons */}
//         <div className="flex justify-between">
//           {step > 1 ? (
//             <button
//               className="px-10 py-4 bg-white border border-blue-600 text-blue-600 rounded-lg text-base font-weight-400 flex items-center gap-2"
//               onClick={handleBack}
//             >
//               <ChevronLeft size={18} /> Back
//             </button>
//           ) : (
//             <button className="invisible"></button>
//           )}
//           <div className="flex justify-end gap-4">
//             <button
//               className="px-10 py-4 bg-white border border-blue-600 text-blue-600 rounded-lg text-base font-weight-400 flex items-center gap-2"
//               onClick={handleClose}
//             >
//               Cancel
//             </button>

//             <button
//               className="px-10 py-4 bg-blue-600 text-white rounded-lg text-base font-weight-400 flex items-center gap-2"
//               onClick={
//                 step === 3
//                   ? () => {
//                       onSave(formData);
//                       setStep(1);
//                     }
//                   : handleNext
//               }
//             >
//               {step === 3 ? "Save" : "Next"}{" "}
//             </button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// // Reusable Components
// const ModalRadioGroup = ({ label, value, onChange }: any) => (
//   <div className="flex flex-col gap-5">
//     <label className="text-black text-sm font-weight-400">{label}</label>
//     <div className="flex gap-5">
//       {["Yes", "No"].map((opt) => (
//         <div
//           key={opt}
//           className="flex items-center gap-2 cursor-pointer"
//           onClick={() => onChange(opt)}
//         >
//           <img src={value === opt ? Yes : No} alt="radio" />
//           <span className="text-sm font-normal">{opt}</span>
//         </div>
//       ))}
//     </div>
//   </div>
// );

// const PhotoUploadBox = ({ label }: { label: string }) => (
//   <div className="w-full p-6 rounded-lg border border-slate-200 flex flex-col justify-center items-center gap-6 cursor-pointer hover:bg-slate-50">
//     <div className="w-12 h-12 rounded-full flex items-center justify-center">
//       <img src={Downloadd} alt="" />
//     </div>
//     <span className="text-black text-base font-weight-600">{label}</span>
//   </div>
// );

import React, { useState, useRef, useEffect } from "react";
import { X, Camera, ChevronRight, ChevronLeft } from "lucide-react";
import Yes from "../../../assets/AutoClaim_icon/Yes.svg";
import No from "../../../assets/AutoClaim_icon/No.svg";
import Downloadd from "../../../assets/AutoClaim_icon/Downloadd.svg";

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
      // Initialize with default strings if empty
      if (!formData || Object.keys(formData).length === 0) {
        setFormData(defaultFormData);
      }
    }
  }, [isOpen]);

  const handleClose = () => {
    setStep(1);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 font-['Stack_Sans_Headline']">
      <div className="w-[640px] bg-white rounded-lg p-6 flex flex-col gap-4 shadow-xl">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h2 className="text-black text-xl font-weight-600 leading-5">
            Driver Check-Out / Check-In - <br /> Cleanliness & Damage
          </h2>
          <div className="flex gap-3">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`w-3 h-3 rounded-full ${
                  step >= s ? "bg-blue-600" : "bg-zinc-300"
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
            <PhotoUploadBox label="Add Photos (Optional)" />
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
            <PhotoUploadBox label="Add Photos (Optional)" />
          </div>
        )}

        {/* Step 3: Charges */}
        {step === 3 && (
          <div className="flex flex-col gap-6 overflow-y-auto max-h-[400px] pr-2">
            <h3 className="text-black text-base font-weight-600">Charges</h3>
            <div className="grid grid-cols-2 gap-5">
              <ModalRadioGroup
                label="Apply Petrol Checkout Charge?"
                value={formData.petrolCheckoutCharge}
                onChange={(v) =>
                  setFormData((prev: any) => ({
                    ...prev,
                    petrolCheckoutCharge: v,
                  }))
                }
              />
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
                  />
                </div>
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

            <div className="h-px bg-slate-100" />

            <ModalRadioGroup
              label="Apply Damage Charges now?"
              value={formData.applyDamageCharges}
              onChange={(v) =>
                setFormData((prev: any) => ({ ...prev, applyDamageCharges: v }))
              }
            />
            

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
          </div>
        )}

        <div className="h-px bg-slate-100 w-full" />

        {/* Footer Buttons */}
        <div className="flex justify-between">
          {step > 1 ? (
            <button
              className="px-10 py-4 bg-white border border-blue-600 text-blue-600 rounded-lg text-base font-weight-400 flex items-center gap-2"
              onClick={handleBack}
            >
              <ChevronLeft size={18} /> Back
            </button>
          ) : (
            <div className="w-[120px]" />
          )}
          <div className="flex justify-end gap-4">
            <button
              className="px-10 py-4 bg-white border border-blue-600 text-blue-600 rounded-lg text-base font-weight-400 flex items-center gap-2"
              onClick={handleClose}
            >
              Cancel
            </button>

            <button
              className="px-10 py-4 bg-blue-600 text-white rounded-lg text-base font-weight-400 flex items-center gap-2"
              onClick={
                step === 3
                  ? () => {
                      onSave(formData);
                    }
                  : handleNext
              }
            >
              {step === 3 ? "Save" : "Next"}
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

const PhotoUploadBox = ({ label }: { label: string }) => (
  <div className="w-full p-6 rounded-lg border border-slate-200 flex flex-col justify-center items-center gap-6 cursor-pointer hover:bg-slate-50">
    <div className="w-12 h-12 rounded-full flex items-center justify-center">
      <img src={Downloadd} alt="upload" />
    </div>
    <span className="text-black text-base font-weight-600">{label}</span>
  </div>
);
