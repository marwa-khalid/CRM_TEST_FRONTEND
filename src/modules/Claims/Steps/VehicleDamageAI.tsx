// import { useEffect, useState } from "react";
// import Select from "react-select";
// import { Calendar, Minus, Plus, Upload, X } from "lucide-react";
// import { VehicleCheckModal } from "./VehicleCheckModal";
// import { BlueDropdownIndicator, customStyles } from "./GeneralDetailsForm";
// import downloadd from "../../../assets/AutoClaim_icon/downloadd.svg";
// import Yes from "../../../assets/AutoClaim_icon/Yes.svg";
// import No from "../../../assets/AutoClaim_icon/No.svg";
// import { toast } from "react-toastify";
// import { V5CUploadModalOwner } from "../Components/V5CUploadModalOwner";
// import * as Yup from 'yup'
// import { useFormik } from "formik";
// import { createVehicleDetail, getVehicleDetail, updateVehicle } from "../../../services/Vehicle/vehicle";
// import { cleanPayload } from "./ClientDetailsForm";
// import LeafletAutocompleteMap from "../../../components/GoogleMapAutoComplete/GoogleMapAutoComplete";
// import { getVehicleOwner, updateVehicleOwner, VehicleOwnersApi } from "../../../services/VehicleOwner/vehicleOwner";

// export const VehicleDamageAI = ({ formRef }: any) => {
//   const claimId = localStorage.getItem("claimId");
//   const [showUploadModal, setShowUploadModal] = useState(false);
//   const vehicleOwnerId = localStorage.getItem("vehicleOwnerId");

//   const formik = useFormik({
//     initialValues: {
//       clientTitle: "mr",
//       clientFirstName: "",
//       clientSurname: "",
//       address: "",
//       postcode: "",
//       homeTelephone: "",
//       mobileTelephone: "",
//       email: "",
//       vehiclePaymentBeneficiary: "",
//     },
//     validationSchema: Yup.object().shape({}),
//     onSubmit: async (values: any) => {
//       try {
//         const payload = {
//           gender: "mr",
//           first_name: values.clientFirstName,
//           surname: values.clientSurname,
//           payment_benificiary: values.vehiclePaymentBeneficiary,
//           claim_id: parseInt(claimId),
//           tenant_id: 1,
//           address: {
//             address: values.address,
//             postcode: values.postcode,
//             home_tel: values.homeTelephone,
//             mobile_tel: values.mobileTelephone,
//             email: values.email,
//           },
//         };

//         const payloadToSend = cleanPayload(payload);
//         console.log(parseInt(claimId));
//         // return
//         if (claimId && vehicleOwnerId) {
//           const response = await updateVehicleOwner(
//             payloadToSend,
//             parseInt(claimId),
//           );
//           localStorage.setItem("vehicleOwnerId", response.id);
//         } else {
//           const response =
//             await VehicleOwnersApi.createVehicleOwner(payloadToSend);
//           localStorage.setItem("vehicleOwnerId", response.id);
//         }
//         toast.success("Vehicle Owner details saved successfully");
//       } catch (error) {
//         toast.error("Error saving vehicle ownerdetails");
//         throw error;
//       }
//     },
//   });
//   useEffect(() => {
//     const fetchData = async () => {
//       const ownerData = await getVehicleOwner(parseInt(claimId));
//       console.log(ownerData);
//       const mappedValues = {
//         clientTitle: ownerData?.gender,
//         clientFirstName: ownerData?.first_name,
//         clientSurname: ownerData?.surname,
//         email: ownerData?.address?.email,
//         homeTelephone: ownerData?.address?.home_tel,
//         mobileTelephone: ownerData?.address?.mobile_tel,
//         vehiclePaymentBeneficiary: ownerData?.payment_benificiary,
//         address: ownerData?.address?.address,
//         postcode: ownerData?.address?.postcode,
//       };

//       formik.setValues(mappedValues);
//     };
//     console.log(formik.values);
//     if (claimId && vehicleOwnerId) {
//       fetchData();
//     }
//   }, []);
//   useEffect(() => {
//     if (formRef) {
//       formRef.current = formik;
//     }
//   }, [formRef, formik]);
//   const pollJobStatus = async (jobId: string) => {
//     // Show a global loader for the OCR processing
//     // setLoading(true);
//     try {
//       // Loop or interval to check OCR status
//       // const result = await checkOCRStatus(jobId);
//       // console.log(result)
//       // if (result.status === "completed") {
//       // Pre-fill your Formik fields
//       // formik.setValues({
//       //   ...formik.values,
//       //   clientFirstName: result.data.clientFirstName,
//       //   model: result.data.model,
//       //   registration: result.data.registration,
//       //   colour: result.data.colour,
//       // });
//       toast.success("Data extracted successfully!");
//     } catch (e) {
//       toast.error("OCR extraction failed");
//     } finally {
//       // setLoading(false);
//     }
//   };
//   const handlHomeTelephoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     let value = e.target.value.replace(/\D/g, ""); // remove non-digits

//     if (value.length > 5) {
//       value = value.slice(0, 5) + " " + value.slice(5, 11);
//     }

//     formik.setFieldValue("homeTelephone", value);
//   };
//   const handleMobileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     let value = e.target.value.replace(/\D/g, ""); // remove non-digits

//     if (value.length > 5) {
//       value = value.slice(0, 5) + " " + value.slice(5, 11);
//     }

//     formik.setFieldValue("mobileTelephone", value);
//   };
//   const [assessmentType, setAssessmentType] = useState("Client vehicle only");
//   console.log(formik.values);
//   const options = ["Client vehicle only", "Third Party Vehicle Only", "Both"];
//   return (
//     <>
//       <V5CUploadModalOwner
//         isOpen={showUploadModal}
//         claimId={claimId}
//         formik={formik}
//         onClose={() => setShowUploadModal(false)}
//         onUploadSuccess={(jobId) => pollJobStatus(jobId)}
//       />
//       <div className="MainContent w-[788px] ms-[140px] flex-1 inline-flex flex-col items-start gap-6 p-8 overflow-y-auto scrollbar-hide">
//         {/* Container matching left-[534px] and top-[157px] from source */}
//         <div className="flex justify-between items-center w-full">
//           <div className="flex flex-col justify-start items-start gap-6">
//             <h2 className="text-black text-2xl font-weight-600 leading-6">
//               Ai Based Vehicle Damage Details
//             </h2>
//           </div>

//           {/* Manual Details Button */}
//           <button
//             // onClick={onManualClick}
//             className="h-8 px-3 py-2 rounded border border-[#3B82F6] flex justify-center items-center gap-2.5 hover:bg-blue-50 transition-colors group"
//           >
//             <span className="text-[#3B82F6] text-sm font-weight-300 font-light">
//               Manual Details
//             </span>
//           </button>
//         </div>
//         {/* Section 1: Personal Information Section */}
//         <div className="w-106 mt-10 flex flex-col justify-start items-start gap-5 font-['Stack_Sans_Headline']">
//           {/* Group Label */}
//           <label className="text-black text-sm font-weight-400">
//             What would you like to assess?
//           </label>

//           {/* Options Row */}
//           <div className="flex justify-start items-start gap-5">
//             {options.map((option) => {
//               // const isSelected = value === option;
//               return (
//                 <div
//                   key={option}
//                   onClick={() => setAssessmentType(option)}
//                   className="flex items-center gap-2.5 cursor-pointer"
//                 >
//                   {/* Logic: If isSelected is true, show Yes icon, else show No icon */}
//                   <img
//                     src={assessmentType === option ? Yes : No}
//                     alt={
//                       assessmentType === option ? "Selected" : "Not Selected"
//                     }
//                     className="w-5 h-5"
//                   />

//                   <span className="text-black text-sm font-weight-300 font-light">
//                     {option}
//                   </span>
//                 </div>
//               );
//             })}
//           </div>
//         </div>
//         <div className="mt-10 w-[748px] p-6 bg-white rounded-lg flex flex-col justify-start items-start gap-6 font-['Stack_Sans_Headline']">
//           {/* Title Section */}
//           <div className="self-stretch flex flex-col justify-center items-start gap-1">
//             <h3 className="text-black text-xl font-weight-600 leading-5">
//               Upload Accident Images
//             </h3>
//             <p className="text-slate-500 text-sm font-weight-300 font-light">
//               You can upload more than one image
//             </p>
//           </div>

//           {/* Divider */}
//           <div className="self-stretch h-px bg-slate-100" />

//           {/* Upload Box */}
//           <div
//             // onDragOver={handleDragOver}
//             // onDragLeave={handleDragLeave}
//             // onDrop={handleDrop}
//             // onClick={() => fileInputRef.current?.click()}
//             className={`self-stretch p-10 rounded-lg border-2 border-dashed flex flex-col justify-center items-center gap-6 cursor-pointer transition-all

//             `}
//           >
//             <input
//               type="file"
//               // ref={fileInputRef}
//               multiple
//               accept="image/png, image/jpeg"
//               className="hidden"
//               // onChange={(e) =>
//               //   e.target.files && onFilesSelected(e.target.files)
//               // }
//             />

//             {/* Icon (Vector Replacement) */}
//              <img src={downloadd} alt="" />

//             <div className="flex flex-col justify-start items-center gap-2 text-center">
//               <div className="text-black text-base font-weight-600">
//                 Choose a file or Drag & Drop here
//               </div>
//               <div className="text-slate-500 text-sm font-weight-300 font-light uppercase tracking-wider">
//                 JPG, PNG
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </>
//   );
// };;

import React, { useState, useRef, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useParams } from "react-router-dom";
import { toast } from "react-toastify";
import {
  aiAnalyze,
  saveDamageDetails,
} from "../../../services/VehicleDamage/VehicleDamage";
import downloadd from "../../../assets/AutoClaim_icon/downloadd.svg";
import Yes from "../../../assets/AutoClaim_icon/Yes.svg";
import No from "../../../assets/AutoClaim_icon/No.svg";
import Plus from "../../../assets/AutoClaim_icon/Plus.svg";
import AI from "../../../assets/AutoClaim_icon/AI.svg";

import VehicleManualForm from "./VehiclemanualForm";


// Reusing the summary field logic from the story
const DamageSummaryRow = ({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) => (
  <div className="w-96 p-4 rounded-lg outline outline-1 outline-offset-[-1px] outline-gray-200 inline-flex flex-col gap-[5px]">
    <div className="text-gray-700 text-2xl font-weight-600 leading-6">
      {value}
    </div>
    <div className="text-gray-700 text-sm font-weight-400 font-light">{label}</div>
  </div>
);

export const VehicleDamageAI = ({ formRef }: any) => {
 
  const searchParams = new URLSearchParams(window.location.search);
  const claimID = localStorage.getItem("claimId")

  // --- State Management ---
  const [assessmentType, setAssessmentType] = useState("Client vehicle only");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState<any>(null);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [vehicleStatus, setVehicleStatus] = useState("Unroadworthy");

  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- AI Integration Logic (from old VehicleDamage.tsx) ---
  const handleAnalyze = async () => {
    if (uploadedFiles.length === 0) {
      toast.warn("Please upload images first");
      return;
    }

    setIsAnalyzing(true);
    try {
      const formData = new FormData();
      uploadedFiles.forEach((file) => formData.append("images", file));
      formData.append("include_summary", "true");
      formData.append("include_annotated_image", "true");

      const response = await aiAnalyze(formData);
      setAiResult(response);

      // Auto-save damage details as per old logic
      const payload = transformToSavePayload(response);
      await saveDamageDetails(payload);

      toast.success("AI Analysis Complete");
    } catch (error) {
      console.error("Analysis failed", error);
      toast.error("Detection failed - Try again");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const transformToSavePayload = (response: any) => {
    const report = response.normalized_report;
    return {
      claim_id: parseInt(claimID),
      damage_side: report?.damage_side || "",
      area_of_damage: report?.area_of_damage || "",
      severity: report?.severity || "",
      confidence_percent: report?.confidence_percent || 0,
      images:
        response?.annotated_images?.map((img: any) => img.file_path) ||
        previews,
    };
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setUploadedFiles((prev) => [...prev, ...files]);
      const newPreviews = files.map((file) => URL.createObjectURL(file));
      setPreviews((prev) => [...prev, ...newPreviews]);
    }
  };
  const [entryMode, setEntryMode] = useState<string>("Manual")
  console.log(entryMode);
  return (
    <div className="MainContent w-[1157px] flex-1 items-start gap-6 p-8 overflow-y-auto scrollbar-hide font-['Stack_Sans_Headline']">
      {/* Header Section */}
      <div className="flex justify-between items-center w-full mb-10">
        <h2 className="text-black text-2xl font-weight-600 leading-6">
          {entryMode === "Manual"
            ? "Vehicle Damage Details"
            : "AI Based Vehicle Damage Details"}
        </h2>
        {entryMode === "Manual" ? (
          <img
            src={AI}
            className="cursor-pointer"
            onClick={() => setEntryMode("AI")}
            alt=""
          />
        ) : (
          <button
            className="h-8 px-3 py-2 rounded border border-blue-500 text-blue-500 text-sm hover:bg-blue-50"
            onClick={() => setEntryMode("Manual")}
          >
            Manual Details
          </button>
        )}
      </div>
      {entryMode === "Manual" ? (
        <VehicleManualForm formRef={formRef} />

      ) : (
        <>
          {!aiResult ? (
            /* --- UPLOAD STATE --- */
            <div className="space-y-10">
              <div>
                <label className="text-black text-sm block mb-5">
                  What would you like to assess?
                </label>
                <div className="flex gap-5">
                  {[
                    "Client vehicle only",
                    "Third Party Vehicle Only",
                    "Both",
                  ].map((option) => (
                    <div
                      key={option}
                      className="flex items-center gap-2.5 cursor-pointer"
                      onClick={() => setAssessmentType(option)}
                    >
                      <img
                        src={assessmentType === option ? Yes : No}
                        className="w-5 h-5"
                        alt="toggle"
                      />
                      <span className="text-sm font-light">{option}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="w-full p-6 bg-white border rounded-lg flex flex-col gap-6">
                <div className="pb-4 border-b">
                  <h3 className="text-xl font-weight-600">
                    Upload Accident Images
                  </h3>
                  <p className="text-gray-500 text-sm">
                    You can upload more than one image
                  </p>
                </div>

                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="p-10 border-2 border-dashed border-gray-200 rounded-lg flex flex-col items-center gap-6 cursor-pointer hover:bg-blue-50"
                >
                  <input
                    type="file"
                    multiple
                    ref={fileInputRef}
                    className="hidden"
                    onChange={handleFileChange}
                    accept="image/*"
                  />
                  <img src={downloadd} alt="upload icon" />
                  <div className="text-center">
                    <div className="text-black font-weight-600">
                      Choose a file or Drag & Drop here
                    </div>
                    <div className="text-gray-500 text-xs uppercase">
                      JPG, PNG
                    </div>
                  </div>
                </div>

                {previews.length > 0 && (
                  <div className="inline-flex items-center justify-start gap-6 p-4 overflow-x-auto">
                    {/* The "+" Placeholder Button [cite: 19, 20] */}
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="w-16 h-16 shrink-0 rounded-lg border border-blue-600 bg-white flex items-center justify-center cursor-pointer hover:bg-blue-50 transition-colors"
                    >
                      <img src={Plus} alt="" />
                    </div>
                    {/* Image Previews */}
                    <div className="flex items-center gap-6">
                      {previews.map((src, i) => (
                        <div key={i} className="relative group">
                          <img
                            src={src}
                            className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                            alt={`preview-${i}`}
                          />
                          {/* Optional: Remove button from old logic */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              const updatedPreviews = [...previews];
                              const updatedFiles = [...uploadedFiles];
                              updatedPreviews.splice(i, 1);
                              updatedFiles.splice(i, 1);
                              setPreviews(updatedPreviews);
                              setUploadedFiles(updatedFiles);
                            }}
                            className="absolute -top-1 -right-1 bg-white text-red-500 rounded-full w-5 h-5 flex items-center justify-center text-xs shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {previews.length > 0 && (
                  <div className="text-end">
                    <button
                      onClick={handleAnalyze}
                      disabled={isAnalyzing || previews.length === 0}
                      className="px-10 py-4 bg-blue-500 rounded text-white text-base font-weight-400 font-['Stack_Sans_Headline'] hover:bg-blue-500 transition"
                    >
                      {isAnalyzing ? "Analyzing..." : "Analyze Images"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* --- ANALYZED STATE (Figma Requirements) --- */
            <div className="space-y-6">
              <div className="flex gap-4">
                <DamageSummaryRow
                  label="Total Damages Identified"
                  value={
                    aiResult.normalized_report
                      ?.total_damaged_points_identified || 0
                  }
                />
                <DamageSummaryRow
                  label="High Severity Issues"
                  value={aiResult.raw_result?.summary?.high_severity_count || 0}
                />
              </div>

              {/* Image Display Card */}
              <div className="w-full p-4 rounded-lg outline outline-1 outline-gray-100 flex flex-col gap-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-xl font-weight-600">
                      Images with AI Detection
                    </h3>
                    <p className="text-gray-500 text-sm">
                      {previews.length} image • Uploaded
                    </p>
                  </div>
                  <button
                    onClick={() => setAiResult(null)}
                    className="h-8 px-3 py-2 bg-white rounded outline outline-1 outline-blue-600 text-blue-600 text-sm flex items-center gap-2"
                  >
                    <img src={Plus} alt="" /> Add More Images
                  </button>
                </div>
                <div className="w-full bg-gray-100 rounded-lg flex justify-center items-center p-4">
                  <img
                    src={
                      aiResult.annotated_images?.[0]?.file_path || previews[0]
                    }
                    className="max-h-80 object-contain"
                  />
                </div>
              </div>

              {/* Damage Summary Table */}
              <div className="w-full p-4 rounded-lg outline outline-1 outline-gray-100 flex flex-col gap-4">
                <h3 className="text-xl font-weight-600">Damage Summary</h3>
                <div className="border rounded-lg overflow-hidden">
                  <div className="flex bg-gray-50 p-4 font-weight-600 text-sm border-b">
                    <div className="w-36">DAMAGE SIDE</div>
                    <div className="w-40">AREA</div>
                    <div className="w-44">TYPE</div>
                    <div className="w-32">SEVERITY</div>
                    <div className="w-28">CONFIDENCE</div>
                    <div>REPAIR ACTION</div>
                  </div>
                  <div className="flex p-4 text-sm items-center">
                    <div className="w-36">
                      {aiResult.normalized_report?.damage_side}
                    </div>
                    <div className="w-40">
                      {aiResult.normalized_report?.area_of_damage}
                    </div>
                    <div className="w-44">
                      {aiResult.normalized_report?.type_of_damage}
                    </div>
                    <div className="w-32">
                      <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-bold">
                        {aiResult.normalized_report?.severity}
                      </span>
                    </div>
                    <div className="w-28">
                      {aiResult.normalized_report?.confidence_percent}%
                    </div>
                    <div>
                      {aiResult.normalized_report?.suggested_repair_action}
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-4">
                <button className="bg-blue-100 text-blue-600 px-4 py-2 rounded text-sm">
                  Download PDF
                </button>
                <button className="bg-blue-100 text-blue-600 px-4 py-2 rounded text-sm">
                  View Full Report
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};