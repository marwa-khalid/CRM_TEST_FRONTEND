// import {
//   useState,
//   useEffect,
//   useRef
// } from "react";
// import { useFormik } from "formik";
// import * as Yup from "yup";
// import { toast } from "react-toastify";

// // Assets & Icons
// import upload from "../../../assets/AutoClaim_icon/uploadSmall.svg";
// import Vector6 from "../../../assets/AutoClaim_icon/Vector-6.svg";

// import { CustomDatePicker } from "../Components/DatePicker";
// // Services
// import { createDriverDocumentAgreement, getDriverDocumentAgreement, updateDriverDocumentAgreement } from "../../../services/DriverDocumentAgreement/DriverDocumentAgreement";
// import { parseCalendarDate } from "../../../common/common";

// // --- COMPONENT ---
// const DriverDocumentAgreement = ({ formRef }: any) => {
//   const claimId = localStorage.getItem("claimId");
//   const documentAgreementId = localStorage.getItem("documentAgreementId");

//   useEffect(() => {
//     const fetchDriverDocumentAgreement =async()=> {
//            try {
//              const response = await getDriverDocumentAgreement(parseInt(claimId));
//              const data = response.data || response;
//              if (!data) return

//               formik.setValues(data );
//            } catch (error) {
//              console.error("Error fetching driver document agreement:", error);
//            }
//          }

//     if (claimId && documentAgreementId) {
//       fetchDriverDocumentAgreement();
//     }
//   }, []);

//     const combineDateAndTimeToTimestamp = (date: Date | null, timeStr?: string): string | null => {
//       if (!date) return null;
//       const d = new Date(date);
//       if (timeStr) {
//         const [hh, mm] = timeStr.split(":").map(Number);
//         d.setHours(hh, mm, 0, 0);
//       }
//       return d.toISOString();
//     };
//   const formatDateForInput = (dateValue: any) => {
//     if (!dateValue) return "";
//     // If it's already a string like "2026-03-11T05:00:00", just take the first 10 chars
//     if (typeof dateValue === "string") {
//       return dateValue.split("T")[0];
//     }
//     // If it's a Date object
//     return new Date(dateValue).toLocaleDateString("sv-SE");
//   };
//   const formik = useFormik({
//     initialValues: {},

//     validationSchema: Yup.object().shape({}),
//     onSubmit: async (values: any) => {
//       try {

//         const getTimestamp = (field: string) =>
//           combineDateAndTimeToTimestamp(values[field], values[`${field}_time`]);

//         const payload = {
//           driver_license_received_on: getTimestamp("driver_license_received_on"),
//           license_checks_completed_on: getTimestamp("driver_license_checks_completed_on"),
//           proof_of_address_1_received_on: getTimestamp("proof_of_address_1_received_on"),
//           proof_of_address_2_received_on: getTimestamp("proof_of_address_2_received_on"),
//           pre_hire_bank_statement_received_on: getTimestamp("pre_hire_bank_statement_received_on"),
//           post_hire_bank_statement_received_on: getTimestamp("post_hire_bank_statement_received_on"),
//           taxi_badge_received_on: getTimestamp("taxi_badge_received_on"),
//           v5_received_on: getTimestamp("v5_received_on"),
//           mot_certificate_received_on: getTimestamp("mot_certificate_received_on"),
//           insurance_certificate_received_on: getTimestamp("insurance_certificate_received_on"),
//           suspension_notice_received_on: getTimestamp("suspension_notice_received_on"),
//           suspension_uplift_received_on: getTimestamp("suspension_uplift_received_on"),
//           signed_cha_received_on: getTimestamp("signed_cha_received_on"),
//           signed_mitigation_received_on: getTimestamp("signed_mitigation_received_on"),
//           arf_received_on: getTimestamp("arf_received_on"),
//           signed_cil_agreement_received_on: getTimestamp("signed_cil_agreement_received_on"),
//           claim_id: claimId || 0,
//         };
//         let res;
//         if (claimId && documentAgreementId) {
//           res = await updateDriverDocumentAgreement(payload, parseInt(claimId));
//           localStorage.setItem("documentAgreementId",res.id);
//         } else {
//           res= await createDriverDocumentAgreement(payload);
//           localStorage.setItem("documentAgreementId", res.id);

//         }

//         toast.success("Driver Document Agreement saved successfully");

//       } catch (error: any) {
//         toast.error("Unable to save driver document agreement");
//         throw error
//          }

//     },
//   });
//   // 🔥 expose formik to parent
//   useEffect(() => {
//     if (formRef) {
//       formRef.current = formik;
//     }
//   }, [formRef, formik]);
//   console.log(formik.values);

//   const DocumentRow: React.FC<{ label: string; dateLabel: string,fieldName:string }> = ({
//     label,
//     dateLabel,
//     fieldName
//   }) => {
//     const [showPicker, setShowPicker] = useState(false);
//     const containerRef = useRef<HTMLDivElement>(null);
//     // Handle clicking outside to close the picker
//     const formatDisplayDate = (dateValue: any) => {
//       if (!dateValue) return "Select Date";

//       const date = new Date(dateValue);
//       if (isNaN(date.getTime())) return "Select Date";

//       // Format the Date part: YYYY-MM-DD
//       const datePart = date.toLocaleDateString("sv-SE");

//       // Format the Time part: hh:mm am/pm
//       const timePart = date
//         .toLocaleTimeString("en-US", {
//           hour: "2-digit",
//           minute: "2-digit",
//           hour12: true,
//         })
//         .toLowerCase();

//       return `${datePart} ${timePart}`;
//     };
//     useEffect(() => {
//       const handleClickOutside = (event: MouseEvent) => {
//         if (
//           containerRef.current &&
//           !containerRef.current.contains(event.target as Node)
//         ) {
//           setShowPicker(false);
//         }
//       };
//       if (showPicker) {
//         document.addEventListener("mousedown", handleClickOutside);
//       }
//       return () =>
//         document.removeEventListener("mousedown", handleClickOutside);
//     }, [showPicker]);
//     console.log(formik.values)
//     return (
//       <div className="py-2 flex grid grid-cols-2 gap-2">
//         {/* Upload Section */}
//         <div className="flex flex-col justify-start items-start gap-2">
//           <div className="text-neutral-700 text-sm font-weight-400 font-['Stack_Sans_Headline']">
//             {label}
//           </div>
//           <div className="px-4  h-[51px] bg-white rounded outline outline-1 -outline-offset-1 outline-gray-200 flex justify-start items-center gap-2.5 cursor-pointer hover:bg-neutral-50 transition-colors">
//             <img src={upload} alt="upload" />
//             <div className="flex flex-col justify-start items-start">
//               <div className=" text-neutral-500 text-sm font-weight-600 ">
//                 Choose a file or Drag & Drop -{" "}
//                 <span className="text-xs font-weight-300 font-light">
//                   JPG, PNG, PDF
//                 </span>
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Date Picker Section */}
//         <div
//           ref={containerRef}
//           className="flex flex-col justify-start items-start gap-2 relative"
//         >
//           <label className="self-stretch text-neutral-700 text-sm font-weight-400 font-['Stack_Sans_Headline']">
//             {dateLabel}
//           </label>

//           <div
//             onClick={() => setShowPicker(!showPicker)}
//             className={`w-full h-[52px] px-5 bg-white rounded border flex items-center justify-between cursor-pointer transition-all
//           ${showPicker ? "border-blue-500 ring-1 ring-blue-500" : "border-gray-200 hover:border-gray-300"}`}
//           >
//             <span
//               className={`${formik.values[fieldName] ? "text-gray-900" : "text-gray-400"} font-['system-ui'] text-base`}
//             >
//               {formatDisplayDate(formik.values[fieldName]) || "Date"}
//             </span>
//             <img src={Vector6} alt="calendar" />
//           </div>

//           {showPicker && (
//             <div className="absolute top-[28px] left-0 z-[100] shadow-xl">
//               <CustomDatePicker
//                 selectedDate={
//                   formik.values[fieldName]
//                     ? new Date(formik.values[fieldName])
//                     : new Date()
//                 }
//                 onDateSelect={(date) => {
//                   formik.setFieldValue(
//                     fieldName,
//                     date.toLocaleDateString("sv-SE"),
//                   );
//                   setShowPicker(false);
//                 }}
//               />
//             </div>
//           )}
//         </div>
//       </div>
//     );
//   };
//   return (
//     <div className="MainContent w-[788px] ms-[140px] flex-1 inline-flex flex-col items-start gap-6 p-8 overflow-y-auto scrollbar-hide font-['Stack_Sans_Headline']">
//       <h1 className="self-stretch text-black text-2xl font-weight-600 font-['Stack_Sans_Headline'] leading-6">
//         Driver Documents & Agreements
//       </h1>

//       {/* Section 1: Proofs Checklist */}
//       <div className="self-stretch p-5 rounded-lg outline outline-1 outline-neutral-100 flex flex-col justify-start items-start gap-4">
//         <div className="text-black text-xl font-weight-600 font-['Stack_Sans_Headline'] leading-5">
//           Driver Proofs Check List
//         </div>

//         <div className="self-stretch h-px bg-neutral-100" />
//         <DocumentRow
//           label="Upload Driving License"
//           dateLabel="Driving Licence Received On"
//           fieldName="driver_license_received_on"
//         />

//         <div className="self-stretch h-px bg-neutral-100" />
//         <DocumentRow
//           label="Driving License Checks"
//           dateLabel="Driving Licence Received On"
//           fieldName="license_checks_completed_on"
//         />

//         <div className="self-stretch h-px bg-neutral-100" />
//         <DocumentRow
//           label="Proof of Address"
//           dateLabel="Proof of Address 1 Received on"
//           fieldName="proof_of_address_1_received_on"
//         />

//         <div className="self-stretch h-px bg-neutral-100" />
//         <DocumentRow
//           label="Proof of Address 2"
//           dateLabel="Proof of Address 2 Received On"
//           fieldName="proof_of_address_2_received_on"
//         />

//         <div className="self-stretch h-px bg-neutral-100" />
//         <DocumentRow
//           label="Bank Statement (Pre-Hire)"
//           dateLabel="Bank Statement Received On (Pre-Hire)"
//           fieldName="pre_hire_bank_statement_received_on"
//         />

//         <div className="self-stretch h-px bg-neutral-100" />
//         <DocumentRow
//           label="Bank Statement (Post-Hire)"
//           dateLabel="Bank Statement Received On (Post-Hire)"
//           fieldName="post_hire_bank_statement_received_on"
//         />

//         <div className="self-stretch h-px bg-neutral-100" />
//         <DocumentRow
//           label="Taxi Badge"
//           dateLabel="Taxi Badge Received On"
//           fieldName="taxi_badge_received_on"
//         />

//         <div className="self-stretch h-px bg-neutral-100" />
//         <DocumentRow
//           label="V5"
//           dateLabel="V5 Received On"
//           fieldName="v5_received_on"
//         />

//         <div className="self-stretch h-px bg-neutral-100" />
//         <DocumentRow
//           label="MOT Certificate"
//           dateLabel="MOT Certificate Received On"
//           fieldName="mot_certificate_received_on"
//         />

//         <div className="self-stretch h-px bg-neutral-100" />
//         <DocumentRow
//           label="Insurance Certificate"
//           dateLabel="Insurance Certificate Received On"
//           fieldName="insurance_certificate_received_on"
//         />

//         <div className="self-stretch h-px bg-neutral-100" />
//         <DocumentRow
//           label="Suspension Notice"
//           dateLabel="Suspension Notice Received On"
//           fieldName="suspension_notice_received_on"
//         />

//         <div className="self-stretch h-px bg-neutral-100" />
//         <DocumentRow
//           label="Suspension UPLIFT"
//           dateLabel="Suspension UPLIFT Received On"
//           fieldName="suspension_uplift_received_on"
//         />
//       </div>

//       {/* Section 2: Agreements & Statements */}
//       <div className="self-stretch p-5 rounded-lg outline outline-1 outline-neutral-100 flex flex-col justify-start items-start gap-4">
//         <div className="text-black text-xl font-weight-600 font-['Stack_Sans_Headline'] leading-5">
//           Agreements & Statements Check List Section
//         </div>

//         <div className="self-stretch h-px bg-neutral-100" />
//         <DocumentRow
//           label="Signed CHA"
//           dateLabel="Signed CHA Received On"
//           fieldName="signed_cha_received_on"
//         />

//         <div className="self-stretch h-px bg-neutral-100" />
//         <DocumentRow
//           label="Signed Mitigation"
//           dateLabel="Signed Mitigation Received On"
//           fieldName="signed_mitigation_received_on"
//         />

//         <div className="self-stretch h-px bg-neutral-100" />
//         <DocumentRow
//           label="ARF"
//           dateLabel="ARF Received On"
//           fieldName="arf_received_on"
//         />

//         <div className="self-stretch h-px bg-neutral-100" />
//         <DocumentRow
//           label="Signed CIL Agreement"
//           dateLabel="Signed CIL Agreement Received On"
//           fieldName="signed_cil_agreement_received_on"
//         />
//       </div>
//     </div>
//   );
// };

// export default DriverDocumentAgreement;

import { useState, useEffect, useRef } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { toast } from "react-toastify";

// Icons
import uploadIcon from "../../../assets/AutoClaim_icon/uploadSmall.svg";
import Vector6 from "../../../assets/AutoClaim_icon/Vector-6.svg";
import { CustomDatePicker } from "../Components/DatePicker";

// Services
import {
  createDriverDocumentAgreement,
  getDriverDocumentAgreement,
  updateDriverDocumentAgreement,
} from "../../../services/DriverDocumentAgreement/DriverDocumentAgreement";

const DriverDocumentAgreement = ({ formRef }: any) => {
  const claimId = localStorage.getItem("claimId");
  const documentAgreementId = localStorage.getItem("documentAgreementId");

  // --- HELPERS ---
  const formatDisplayDate = (dateValue: any) => {
    if (!dateValue) return "Select Date";
    const date = new Date(dateValue);
    if (isNaN(date.getTime())) return "Select Date";
    return `${date.toLocaleDateString("sv-SE")} ${date
      .toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
      .toLowerCase()}`;
  };

  const truncateFilename = (name: string) => {
    return name.length > 30 ? name.substring(0, 37) + "..." : name;
  };

  const getFileFromStorage = (fieldName: string) => {
    const saved = localStorage.getItem(`file_${claimId}_${fieldName}`);
    return saved ? JSON.parse(saved) : null;
  };

  // --- FORMIK ---
  const formik = useFormik({
    initialValues: {
      driver_license_received_on: "",
      license_checks_completed_on: "",
      proof_of_address_1_received_on: "",
      proof_of_address_2_received_on: "",
      pre_hire_bank_statement_received_on: "",
      post_hire_bank_statement_received_on: "",
      taxi_badge_received_on: "",
      v5_received_on: "",
      mot_certificate_received_on: "",
      insurance_certificate_received_on: "",
      suspension_notice_received_on: "",
      suspension_uplift_received_on: "",
      signed_cha_received_on: "",
      signed_mitigation_received_on: "",
      arf_received_on: "",
      signed_cil_agreement_received_on: "",
    },
    onSubmit: async (values: any) => {
      try {
        const payload = {
          ...values,
          claim_id: claimId ? parseInt(claimId) : 0,
        };
        let res;
        if (claimId && documentAgreementId) {
          res = await updateDriverDocumentAgreement(payload, parseInt(claimId));
        } else {
          res = await createDriverDocumentAgreement(payload);
          localStorage.setItem("documentAgreementId", res.id);
        }
        toast.success("Driver Document Agreement saved successfully");
      } catch (error) {
        toast.error("Unable to save documents");
      }
    },
  });

  useEffect(() => {
    const fetchDocs = async () => {
      try {
        const response = await getDriverDocumentAgreement(parseInt(claimId!));
        const data = response.data || response;
        if (data) formik.setValues(data);
      } catch (e) {
        console.error(e);
      }
    };
    if (claimId && documentAgreementId) fetchDocs();
  }, []);

  // Expose to parent
  useEffect(() => {
    if (formRef) formRef.current = formik;
  }, [formik]);

  // --- SUB-COMPONENT ---
  const DocumentRow: React.FC<{
    label: string;
    dateLabel: string;
    fieldName: string;
  }> = ({ label, dateLabel, fieldName }) => {
    const [showPicker, setShowPicker] = useState(false);
    const [localFile, setLocalFile] = useState<{
      name: string;
      type: string;
    } | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
      const saved = getFileFromStorage(fieldName);
      if (saved) setLocalFile({ name: saved.name, type: saved.type });
    }, [fieldName]);

    useEffect(() => {
      const handleClickOutside = (e: MouseEvent) => {
        if (
          containerRef.current &&
          !containerRef.current.contains(e.target as Node)
        )
          setShowPicker(false);
      };
      if (showPicker)
        document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }, [showPicker]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        localStorage.setItem(
          `file_${claimId}_${fieldName}`,
          JSON.stringify({
            name: file.name,
            type: file.type,
            data: base64String,
          }),
        );
        setLocalFile({ name: file.name, type: file.type });
        // Auto-populate date when file is uploaded
        formik.setFieldValue(fieldName, new Date().toISOString());
        toast.info(`${file.name} uploaded locally`);
      };
      reader.readAsDataURL(file);
    };

    // Handle file removal
    const handleRemoveFile = (e: React.MouseEvent) => {
      e.stopPropagation(); // Prevent triggering the file input click
      localStorage.removeItem(`file_${claimId}_${fieldName}`);
      setLocalFile(null);
      formik.setFieldValue(fieldName, ""); // Clear the date associated with the upload
      toast.info(`Document removed: ${label}`);
    };

    return (
      <div className="py-2 grid grid-cols-2 gap-4 items-center font-['Stack_Sans_Headline']">
        {/* Upload Area */}
        <div className="flex flex-col gap-2">
          <label className="text-neutral-700 text-sm font-weight-400">
            {label}
          </label>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept=".jpg,.jpeg,.png,.pdf"
            onChange={handleFileChange}
          />
          <div
            onClick={() => fileInputRef.current?.click()}
            className="group px-4 h-[52px] bg-white rounded border border-gray-200 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-all"
          >
            <div className="flex items-center gap-3 overflow-hidden">
              {localFile ? (
                <>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold text-white shrink-0 ${localFile.type.includes("pdf") ? "bg-red-500" : "bg-blue-500"}`}
                  >
                    {localFile.type.includes("pdf") ? "PDF" : "IMG"}
                  </span>
                  <span className="text-sm text-gray-700 font-weight-400 truncate max-w-[180px]">
                    {truncateFilename(localFile.name)}
                  </span>
                </>
              ) : (
                <>
                  <img src={uploadIcon} alt="upload" className="w-5 h-5" />
                  <span className="text-neutral-500 text-sm">
                    Upload file{" "}
                    <span className="text-xs font-weight-300 font-light">
                      (JPG, PNG, PDF)
                    </span>
                  </span>
                </>
              )}
            </div>

            {/* 🔥 Remove Button 🔥 */}
            {localFile && (
              <button
                onClick={handleRemoveFile}
                className="p-1.5 rounded-full hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                title="Remove file"
              >
                x
              </button>
            )}
          </div>
        </div>

        {/* Date Picker Area (Readonly display) */}
        <div ref={containerRef} className="flex flex-col gap-2 relative">
          <label className="text-neutral-700 text-sm">{dateLabel}</label>
          <div
            onClick={() => setShowPicker(!showPicker)}
            className={`w-full h-[52px] px-5 bg-white rounded border flex items-center justify-between cursor-pointer transition-all ${showPicker ? "border-blue-500 ring-1 ring-blue-500" : "border-gray-200"}`}
          >
            <span
              className={`${formik.values[fieldName] ? "text-gray-900" : "text-gray-400"} text-sm`}
            >
              {formatDisplayDate(formik.values[fieldName])}
            </span>
            <img src={Vector6} alt="calendar" />
          </div>

          {/* {showPicker && (
            <div className="absolute top-[80px] left-0 z-[100] shadow-2xl">
              <CustomDatePicker
                selectedDate={
                  formik.values[fieldName]
                    ? new Date(formik.values[fieldName])
                    : new Date()
                }
                onDateSelect={(date) => {
                  formik.setFieldValue(fieldName, date.toISOString());
                  setShowPicker(false);
                }}
              />
            </div>
          )} */}
        </div>
      </div>
    );
  };;

  return (
    <div className="w-[788px] ms-[140px] flex flex-col gap-6 p-8 font-['Stack_Sans_Headline']">
      <h1 className="text-black text-2xl font-weight-600">
        Driver Documents & Agreements
      </h1>

      <div className="p-5 rounded-lg border border-neutral-100 flex flex-col gap-4 shadow-sm">
        <h2 className="text-xl font-weight-600">Driver Proofs Check List</h2>

        <div className="self-stretch h-px bg-neutral-100" />
        <DocumentRow
          label="Upload Driving License"
          dateLabel="Driving Licence Received On"
          fieldName="driver_license_received_on"
        />

        <div className="self-stretch h-px bg-neutral-100" />
        <DocumentRow
          label="Driving License Checks"
          dateLabel="Driving Licence Received On"
          fieldName="license_checks_completed_on"
        />

        <div className="self-stretch h-px bg-neutral-100" />
        <DocumentRow
          label="Proof of Address"
          dateLabel="Proof of Address 1 Received on"
          fieldName="proof_of_address_1_received_on"
        />

        <div className="self-stretch h-px bg-neutral-100" />
        <DocumentRow
          label="Proof of Address 2"
          dateLabel="Proof of Address 2 Received On"
          fieldName="proof_of_address_2_received_on"
        />

        <div className="self-stretch h-px bg-neutral-100" />
        <DocumentRow
          label="Bank Statement (Pre-Hire)"
          dateLabel="Bank Statement Received On (Pre-Hire)"
          fieldName="pre_hire_bank_statement_received_on"
        />

        <div className="self-stretch h-px bg-neutral-100" />
        <DocumentRow
          label="Bank Statement (Post-Hire)"
          dateLabel="Bank Statement Received On (Post-Hire)"
          fieldName="post_hire_bank_statement_received_on"
        />

        <div className="self-stretch h-px bg-neutral-100" />
        <DocumentRow
          label="Taxi Badge"
          dateLabel="Taxi Badge Received On"
          fieldName="taxi_badge_received_on"
        />

        <div className="self-stretch h-px bg-neutral-100" />
        <DocumentRow
          label="V5"
          dateLabel="V5 Received On"
          fieldName="v5_received_on"
        />

        <div className="self-stretch h-px bg-neutral-100" />
        <DocumentRow
          label="MOT Certificate"
          dateLabel="MOT Certificate Received On"
          fieldName="mot_certificate_received_on"
        />

        <div className="self-stretch h-px bg-neutral-100" />
        <DocumentRow
          label="Insurance Certificate"
          dateLabel="Insurance Certificate Received On"
          fieldName="insurance_certificate_received_on"
        />

        <div className="self-stretch h-px bg-neutral-100" />
        <DocumentRow
          label="Suspension Notice"
          dateLabel="Suspension Notice Received On"
          fieldName="suspension_notice_received_on"
        />

        <div className="self-stretch h-px bg-neutral-100" />
        <DocumentRow
          label="Suspension UPLIFT"
          dateLabel="Suspension UPLIFT Received On"
          fieldName="suspension_uplift_received_on"
        />
      </div>

      {/* Section 2: Agreements & Statements */}
      <div className=" p-5 rounded-lg border border-neutral-100 flex flex-col gap-4 shadow-sm">
        <div className="text-black text-xl font-weight-600 font-['Stack_Sans_Headline'] leading-5">
          Agreements & Statements Check List Section
        </div>

        <div className="self-stretch h-px bg-neutral-100" />
        <DocumentRow
          label="Signed CHA"
          dateLabel="Signed CHA Received On"
          fieldName="signed_cha_received_on"
        />

        <div className="self-stretch h-px bg-neutral-100" />
        <DocumentRow
          label="Signed Mitigation"
          dateLabel="Signed Mitigation Received On"
          fieldName="signed_mitigation_received_on"
        />

        <div className="self-stretch h-px bg-neutral-100" />
        <DocumentRow
          label="ARF"
          dateLabel="ARF Received On"
          fieldName="arf_received_on"
        />

        <div className="self-stretch h-px bg-neutral-100" />
        <DocumentRow
          label="Signed CIL Agreement"
          dateLabel="Signed CIL Agreement Received On"
          fieldName="signed_cil_agreement_received_on"
        />
      </div>
    </div>
  );
};

export default DriverDocumentAgreement;