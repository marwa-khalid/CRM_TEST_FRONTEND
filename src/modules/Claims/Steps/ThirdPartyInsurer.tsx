// import { useEffect, useRef, useState } from "react";
// import { useFormik } from "formik";
// import * as Yup from "yup";
// import Select from "react-select";
// import { toast } from "react-toastify";
// // Icons & Assets
// import Vector6 from "../../../assets/AutoClaim_icon/Vector-6.svg";
// import Yes from "../../../assets/AutoClaim_icon/Yes.svg";
// import No from "../../../assets/AutoClaim_icon/No.svg";
// import TopRightIcon from "../../../assets/AutoClaim_icon/Vulnerable.svg";
// import { ABIInsurerModal } from "./ABIInsurerModal";
// // Components & Services
// import { CustomDatePicker } from "../Components/DatePicker";
// import LeafletAutocompleteMap from "../../../components/GoogleMapAutoComplete/GoogleMapAutoComplete";
// import {
//   getHandlers,
//   getLiabilityStances,
//   getMidReasons,
//   getSettlementStatus,
// } from "../../../services/Lookups/Generaldetails";
// import {
//   createThirdPartyInsurer,
//   getThirdPartyInsurer,
//   updateThirdPartyInsurer,
// } from "../../../services/ThirdPartyInsurer/ThirdPartyInsurer";
// import { BlueDropdownIndicator, customStyles } from "./GeneralDetailsForm";
// import { getCompanySuggestions } from "../../../services/Referrer/Referrer";
// import type { DateValue } from "react-aria-components";
// import { getLocalTimeZone } from "@internationalized/date";

// const ThirdPartyInsurer = ({ formRef }: any) => {
//   const claimId = localStorage.getItem("claimId");
//   const tpiId = localStorage.getItem("tpiId");

//   const [modalPopup, setModalPopup] = useState<boolean>(false);
//   const [lookups, setLookups] = useState<any>({
//     handlers: [],
//     reasons: [],
//     stances: [],
//     statuses: [],
//   });
//   console.log(lookups);
//   const [showButton, setShowButton] = useState<boolean>(false);
//   const [showPickers, setShowPickers] = useState<any>({});

//   const formik = useFormik({
//     initialValues: {
//       direct_email: "",
//       insurer_reference: "",
//       policy_number: "",
//       claim_validation: false,
//       handling_reference: "",
//       incorrect_mid_reference: "",
//       incorrect_acc: "",
//       initial_eng_made: "",
//       abi_1st_notif_date: "",
//       payment_pack_date:"",
//       new_mid: "",
//       new_mid_search_ref: "",
//       incorrect_reg: "",
//       new_mid_search_processed: false,
//       abi_insured: "No",
//       liability_accepted_on: "",
//       reason_new_mid_id: null,
//       liability_stance_id: null,
//       settlement_status_id: null,
//       handler_id: null,
//       third_party: {
//         gender: "mr",
//         first_name: "",
//         surname: "",
//         address: {
//           address: "",
//           postcode: "",
//           mobile_tel: "",
//           email: "",
//         },
//       },
//       third_party_insurer: {
//         gender: "mr",
//         first_name: "",
//         surname: "",
//         address: {
//           address: "",
//           postcode: "",
//           mobile_tel: "",
//           email: "",
//         },
//       },
//       third_party_handling: {
//         gender: "mr",
//         first_name: "",
//         surname: "",
//         address: {
//           address: "",
//           postcode: "",
//           mobile_tel: "",
//           email: "",
//         },
//       },
//     },
//     validationSchema: Yup.object({
//       third_party_email: Yup.string().email("Invalid format"),
//       policy_no: Yup.string().when("insurer_name", {
//         is: (val: string) => val && val.length > 0,
//         then: (schema) =>
//           schema.required("Required when Insurer Name provided"),
//       }),
//     }),
//     onSubmit: async (values) => {
//       try {
//         localStorage.setItem("tpiData", JSON.stringify(formik.values));
//         const payload = {
//           ...values,
//           abi_insured: values.abi_insured === "Yes" ? true : false,
//           claim_id: parseInt(claimId),
//           direct_email: values.direct_email,
//           insurer_reference: values.insurer_reference,
//           policy_number: values.policy_number,
//           claim_validation: values.claim_validation,
//           handling_reference: values.handling_reference,
//           incorrect_mid_reference: values.incorrect_mid_reference,
//           incorrect_acc: formatDate(values.incorrect_acc),
//           initial_eng_made: formatDate(values.initial_eng_made),
//           new_mid: formatDate(values.new_mid),
//           new_mid_search_ref: values.new_mid_search_ref,
//           incorrect_reg: values.incorrect_reg,
//           new_mid_search_processed: values.new_mid_search_processed,
//           liability_accepted_on: formatDate(values.liability_accepted_on),
//           reason_new_mid_id: values.reason_new_mid_id,
//           liability_stance_id: values.liability_stance_id,
//           settlement_status_id: values.settlement_status_id,
//           handler_id: values.handler_id,
//           third_party: values.third_party,
//           third_party_insurer: values.third_party_insurer,
//           third_party_handling: values.third_party_handling,
//         };

//         let res;
//         // if (claimId && tpiId) {
//         //   // res = await updateThirdPartyInsurer(payload, parseInt(claimId));
//         //   localStorage.setItem("tpiId", res.id);
//         //   localStorage.setItem("tpiData",JSON.stringify(formik.values))
//         // } else {
//         //   // res = await createThirdPartyInsurer(payload);
//         //   localStorage.setItem("tpiId", res.id);
//         //    localStorage.setItem("tpiData", JSON.stringify(formik.values));
//         // }
//         toast.success("Saved successfully");
//       } catch (error) {
//         localStorage.setItem("tpiData", JSON.stringify(formik.values));
//         // toast.error("Third Party insurer details saving failed");
//         // throw error;
//       }
//     },
//   });
// console.log(formik.values)
//   useEffect(() => {
//     if (formRef) {
//       formRef.current = formik;
//     }
//   }, [formRef, formik]);
// const formatDate = (val: DateValue | string | Date | null) => {
//       if (!val) return null;

//       // Already ISO string (yyyy-mm-dd)
//       if (typeof val === "string") return val;

//       let date: Date;

//       if ("toDate" in val) {
//         date = val.toDate(getLocalTimeZone());
//       } else {
//         date = new Date(val);
//       }

//       if (isNaN(date.getTime())) return null;

//       // ✅ format using local date parts (NO UTC shift)
//       const year = date.getFullYear();
//       const month = String(date.getMonth() + 1).padStart(2, "0");
//       const day = String(date.getDate()).padStart(2, "0");

//       return `${year}-${month}-${day}`;
//     };
//   useEffect(() => {
//     const init = async () => {
//       const [h, r, st, su] = await Promise.all([
//         getHandlers(),
//         getMidReasons(),
//         getLiabilityStances(),
//         getSettlementStatus(),
//       ]);
//       console.log(r);
//       setLookups({
//         handlers: h.data,
//         reasons: r.data,
//         stances: st.data,
//         statuses: su.data,
//       });

//       if (claimId && tpiId) {
//         const res = await getThirdPartyInsurer(parseInt(claimId));
//         if (res.data) {
//           const thirdPartyInsurer = res.data || res;
//           const responsee= JSON.parse(localStorage.getItem("tpiData"))
//           // formik.setValues((prev) => ({
//           //   ...prev,
//           //   direct_email: thirdPartyInsurer.direct_email || "",
//           //   insurer_reference: thirdPartyInsurer.insurer_reference || "",
//           //   policy_number: thirdPartyInsurer.policy_number || "",
//           //   claim_validation: thirdPartyInsurer.claim_validation || false,
//           //   handling_reference: thirdPartyInsurer.handling_reference || "",
//           //   incorrect_mid_reference:
//           //     thirdPartyInsurer.incorrect_mid_reference || "",
//           //   incorrect_acc: formatDate(thirdPartyInsurer.incorrect_acc) || "",
//           //   initial_eng_made:
//           //     formatDate(thirdPartyInsurer.initial_eng_made) || "",
//           //   new_mid: formatDate(thirdPartyInsurer.new_mid) || "",
//           //   new_mid_search_ref: thirdPartyInsurer.new_mid_search_ref || "",
//           //   incorrect_reg: thirdPartyInsurer.incorrect_reg || "",
//           //   new_mid_search_processed:
//           //     thirdPartyInsurer.new_mid_search_processed || false,
//           //   abi_insured: thirdPartyInsurer.abi_insured ? "Yes" : "No",
//           //   liability_accepted_on:
//           //     formatDate(thirdPartyInsurer.liability_accepted_on) || "",
//           //   reason_new_mid_id: thirdPartyInsurer.reason_new_mid_id || null,
//           //   liability_stance_id: thirdPartyInsurer.liability_stance_id || null,
//           //   settlement_status_id:
//           //     thirdPartyInsurer.settlement_status_id || null,
//           //   handler_id: thirdPartyInsurer.handler_id || null,
//           //   third_party: {
//           //     gender: thirdPartyInsurer.third_party?.gender || "mr",
//           //     first_name: thirdPartyInsurer.third_party?.first_name || "",
//           //     surname: thirdPartyInsurer.third_party?.surname || "",
//           //     address: {
//           //       address: thirdPartyInsurer.third_party?.address?.address || "",
//           //       postcode:
//           //         thirdPartyInsurer.third_party?.address?.postcode || "",
//           //       mobile_tel:
//           //         thirdPartyInsurer.third_party?.address?.mobile_tel || "",
//           //       email: thirdPartyInsurer.third_party?.address?.email || "",
//           //     },
//           //   },
//           //   third_party_insurer: {
//           //     gender: thirdPartyInsurer.third_party_insurer?.gender || "mr",
//           //     first_name:
//           //       thirdPartyInsurer.third_party_insurer?.first_name || "",
//           //     surname: thirdPartyInsurer.third_party_insurer?.surname || "",
//           //     address: {
//           //       address:
//           //         thirdPartyInsurer.third_party_insurer?.address?.address || "",
//           //       postcode:
//           //         thirdPartyInsurer.third_party_insurer?.address?.postcode ||
//           //         "",
//           //       mobile_tel:
//           //         thirdPartyInsurer.third_party_insurer?.address?.mobile_tel ||
//           //         "",
//           //       email:
//           //         thirdPartyInsurer.third_party_insurer?.address?.email || "",
//           //     },
//           //   },
//           //   third_party_handling: {
//           //     gender: thirdPartyInsurer.third_party_handling?.gender || "mr",
//           //     first_name:
//           //       thirdPartyInsurer.third_party_handling?.first_name || "",
//           //     surname: thirdPartyInsurer.third_party_handling?.surname || "",
//           //     address: {
//           //       address:
//           //         thirdPartyInsurer.third_party_handling?.address?.address ||
//           //         "",
//           //       postcode:
//           //         thirdPartyInsurer.third_party_handling?.address?.postcode ||
//           //         "",
//           //       mobile_tel:
//           //         thirdPartyInsurer.third_party_handling?.address?.mobile_tel ||
//           //         "",
//           //       email:
//           //         thirdPartyInsurer.third_party_handling?.address?.email || "",
//           //     },
//           //   },
//           // }));
//         formik.setValues(responsee)
//         }

//       };

//     }
//     init();
//   }, [claimId]);
//   const handleCompanySelect = (selected: any) => {
//     // Update input field to show full company name
//     setSearchTerm(selected.company_name);

//     // Close dropdown
//     setShowDropdown(false);

//     // Set Formik fields (correct backend keys!)
//     formik.setFieldValue("third_party_insurer.first_name", selected.company_name);
//     formik.setFieldValue("third_party_insurer.address.address", selected.address ?? "");
//     formik.setFieldValue("third_party_insurer.address.postcode", selected.postcode ?? "");

//   };
//   const [companies, setCompanies] = useState<any[]>([]);

//   const [searchTerm, setSearchTerm] = useState("");

//   const [showDropdown, setShowDropdown] = useState(false);
//    useEffect(() => {
//      const fetchCompanies = async () => {
//        try {

//          const response = await getCompanySuggestions(searchTerm); // Replace with your API endpoint

// console.log(response)
//          // Normalize empty strings to null
//         //  const normalized = response.data.map((r) => ({
//         //    company_name: r.company_name,
//         //    address: r.address?.trim() || null,
//         //    post_code: r.postcode?.trim() || null,
//         //  }));

//          setCompanies(response.data);
//        } catch (err) {
//          console.error(err);
//        }
//      };
//      if (searchTerm) {
//        fetchCompanies();
//      }
//    }, [searchTerm]);
//   const renderInput = (
//     label: string,
//     field: string,
//     placeholder: string,
//     width = "",
//   ) => (
//     <div className={`inline-flex flex-col gap-2 ${width}`}>
//       <label className="text-neutral-700 text-sm font-weight-400">
//         {label}
//       </label>
//       {console.log(field)}
//       <input
//         type="text"
//         name={field}
//         value={formik.values[field]}
//         onChange={(e) => formik.setFieldValue(field, e.target)}
//         placeholder={placeholder}
//         className="px-5 py-4 h-[52px] bg-white rounded border border-neutral-200 text-base font-light outline-none focus:border-blue-500 transition-all"
//       />
//     </div>
//   );
// console.log(formik.values)
//   const renderDatePicker = (label: string, field: string) => {
//     // 1. Create a Ref for this specific picker container
//     const pickerRef = useRef<HTMLDivElement>(null);

//     // 2. Global listener to handle clicking outside
//     useEffect(() => {
//       const handleClickOutside = (event: MouseEvent) => {
//         // If the picker is open and the click is NOT inside this ref, close it
//         if (
//           showPickers[field] &&
//           pickerRef.current &&
//           !pickerRef.current.contains(event.target as Node)
//         ) {
//           setShowPickers((prev: any) => ({ ...prev, [field]: false }));
//         }
//       };

//       // Attach listener when the picker is open
//       if (showPickers[field]) {
//         document.addEventListener("mousedown", handleClickOutside);
//       }

//       // Cleanup the listener when the picker closes or component unmounts
//       return () => {
//         document.removeEventListener("mousedown", handleClickOutside);
//       };
//     }, [showPickers, field]);

//     return (
//       // 3. Attach the Ref to the wrapper div
//       <div ref={pickerRef} className="inline-flex flex-col gap-2 relative">
//         <label className="text-neutral-700 text-sm font-weight-400">{label}</label>
//         <div
//           onClick={() =>
//             setShowPickers({ ...showPickers, [field]: !showPickers[field] })
//           }
//           className="px-5 py-4 bg-white rounded border border-neutral-200 flex justify-between items-center cursor-pointer"
//         >
//           <span
//             className={formik.values[field] ? "text-black" : "text-neutral-300"}
//           >
//             {formik.values[field] || "Date"}
//           </span>
//           <img src={Vector6} alt="calendar" className="w-4 h-4" />
//         </div>

//         {showPickers[field] && (
//           <div className="absolute top-[28px] z-[100] shadow-xl">
//             <CustomDatePicker
//               selectedDate={
//                 formik.values[field]
//                   ? new Date(formik.values[field])
//                   : new Date()
//               }
//               onDateSelect={(date: Date) => {
//                 formik.setFieldValue(field, date.toLocaleDateString("sv-SE"));
//                 setShowPickers({ ...showPickers, [field]: false });
//               }}
//             />
//           </div>
//         )}
//       </div>
//     );
//   };
//     const formatDisplayDate = (dateValue: any) => {
//       if (!dateValue) return "Select Date";
//       const date = new Date(dateValue);
//       if (isNaN(date.getTime())) return "Select Date";
//       return `${date.toLocaleDateString("sv-SE")} ${date
//         .toLocaleTimeString("en-US", {
//           hour: "2-digit",
//           minute: "2-digit",
//           hour12: true,
//         })
//         .toLowerCase()}`;
//     };
//   // Helper to get formatted current date/time for display
//   const getCurrentTimestamp = () => {
//     const now = new Date();
//     return now.toISOString(); // Store as ISO, display with formatDisplayDate helper
//   };

//   const handleSendNotification = () => {
//     // Logic to trigger backend system notification generation would go here
//     formik.setFieldValue("abi_1st_notif_date", getCurrentTimestamp());
//     toast.success("ABI 1st Notification generated and date stamped.");
//   };

//   const handleSendPaymentPack = () => {
//     // Logic to trigger backend payment pack sending would go here
//     formik.setFieldValue("payment_pack_date", getCurrentTimestamp());
//     toast.success("Payment Pack sent and date stamped.");
//   };
//   return (
//     <div className="w-[788px] ms-[140px]  flex flex-col gap-6 p-8 font-['Stack_Sans_Headline']">
//       {modalPopup && (
//         <ABIInsurerModal
//           isOpen={modalPopup}
//           onClose={() => setModalPopup(false)}
//         />
//       )}
//       <h1 className="text-neutral-900 text-[24px] font-weight-600">
//         Third Party Insurer
//       </h1>

//       {/* Section 1: Third Party Details */}
//       <div className="self-stretch p-5 rounded-lg border border-neutral-100 flex flex-col gap-4">
//         <h2 className="text-neutral-900 text-[20px] font-weight-600">
//           Third Party Details
//         </h2>
//         <div className="h-px bg-neutral-100" />

//         <div className="flex flex-col gap-2 w-full">
//           <label className="text-neutral-700 text-sm font-weight-400">
//             Title
//           </label>
//           <Select
//             options={[
//               { value: "mr", label: "Mr" },
//               { value: "mrs", label: "Mrs" },
//             ]}
//             styles={customStyles}
//             value={[{ value: "mr", label: "Mr" }].find(
//               (o) => o.value === formik.values.third_party?.gender,
//             )}
//             onChange={(o: any) =>
//               formik.setFieldValue("third_party.gender", o.value)
//             }
//             components={{
//               DropdownIndicator: BlueDropdownIndicator,
//               IndicatorSeparator: () => null,
//             }}
//           />
//         </div>

//         <div className="grid grid-cols-2 gap-5">
//           {renderInput("Forename", "third_party.first_name", "Enter Forename")}
//           {renderInput("Surname", "third_party.surname", "Enter Surname")}
//         </div>

//         <div className="flex flex-col gap-2 flex-1">
//           <label className="text-neutral-700 text-sm font-weight-400">
//             Address
//           </label>

//           <LeafletAutocompleteMap
//             showMap={false}
//             apiKey={import.meta.env.VITE_GOOGLE_MAP_KEY}
//             address={formik.values.third_party?.address?.address}
//             onPlaceSelected={(place) => {
//               if (place.name) {
//                 formik.setFieldValue(
//                   "third_party.address.address",
//                   place.address,
//                 );
//                 formik.setFieldValue(
//                   "third_party.address.postcode",
//                   place?.postalCode,
//                 );
//               }
//             }}
//             disabled={false}
//           />
//         </div>

//         <div className="grid grid-cols-2  gap-5">
//           {renderInput(
//             "Postcode",
//             "third_party.address.postcode",
//             "Enter Postcode",
//           )}
//           {renderInput("Email", "third_party.address.email", "Enter Email")}
//         </div>

//         <div className="grid grid-cols-2  gap-5">
//           {renderInput("Telephone", "third_party.address.mobile_tel", "+44")}
//           {renderInput(
//             "Contact",
//             "third_party.address.mobile_tel",
//             "Enter Contact",
//           )}
//         </div>
//       </div>

//       {/* Section 2: Third Party Insurer Details */}
//       <div className="self-stretch p-5 rounded-lg border border-neutral-100 flex flex-col gap-4">
//         <h2 className="text-neutral-900 text-[20px] font-weight-600">
//           Third Party Insurer Details
//         </h2>
//         <div className="h-px bg-neutral-100" />

//         <div className="flex flex-col gap-2 relative">
//           <label className="text-neutral-700 text-[14px] font-weight-500">
//             Company Name
//           </label>
//           <input
//             type="text"
//             value={searchTerm || formik.values.third_party_insurer?.first_name}
//             onChange={(e) => {
//               setSearchTerm(e.target.value);
//               setShowDropdown(true);
//             }}
//             onFocus={() => setShowDropdown(true)}
//             placeholder="Enter Name"
//             className="w-full h-[52px] px-5 bg-white rounded border border-gray-200 text-gray-900 font-['system-ui']"
//           />
//           {showDropdown && searchTerm && (
//             <div className="absolute top-[80px] left-0 w-full bg-white border border-gray-200 rounded-md shadow-lg z-50 max-h-60 overflow-y-auto">
//               {companies.map((r, i) => (
//                 <div
//                   key={i}
//                   onClick={() => handleCompanySelect(r)}
//                   className="px-5 py-3 hover:bg-gray-50 cursor-pointer text-sm text-gray-700 border-b border-gray-50 last:border-none"
//                 >
//                   {r.company_name}
//                 </div>
//               ))}
//             </div>
//           )}
//         </div>
//         <div className="flex flex-col gap-2 flex-1">
//           <label className="text-neutral-700 text-sm font-weight-400">
//             Address
//           </label>
//           <LeafletAutocompleteMap
//             showMap={false}
//             apiKey={import.meta.env.VITE_GOOGLE_MAP_KEY}
//             address={formik.values.third_party_insurer?.address?.address}
//             onPlaceSelected={(place) => {
//               if (place.name) {
//                 formik.setFieldValue(
//                   "third_party_insurer.address.address",
//                   place.address,
//                 );
//                 formik.setFieldValue(
//                   "third_party_insurer.address.postcode",
//                   place.postalCode,
//                 );
//               }
//             }}
//             disabled={false}
//           />
//         </div>

//         <div className="grid grid-cols-2  gap-5">
//           {renderInput(
//             "Postcode",
//             "third_party_insurer.address.postcode",
//             "Enter Postcode",
//           )}
//           {renderInput(
//             "Main Telephone",
//             "third_party_insurer.address.mobile_tel",
//             "+44",
//           )}
//         </div>

//         <div className="grid grid-cols-2  gap-5">
//           {renderInput(
//             "General Email",
//             "third_party_insurer.address.email",
//             "Enter Email",
//           )}
//           {renderInput("Direct Email", "direct_email", "Enter Email")}
//         </div>

//         <div className="grid grid-cols-2  gap-5">
//           {renderInput("Reference", "insurer_ref", "Enter Reference")}
//           {renderInput("Policy Number", "policy_no", "Enter Policy Number")}
//         </div>

//         <div
//           className="flex items-center gap-2"
//           onClick={() =>
//             formik.setFieldValue(
//               "claim_in_validation",
//               !formik.values.claim_validation,
//             )
//           }
//         >
//           {formik.values.claim_validation ? (
//             <div className="w-5 h-5 bg-blue-500 rounded border-[6px] border-blue-200" />
//           ) : (
//             <div className="w-5 h-5 bg-neutral-300 rounded" />
//           )}
//           <span className="text-sm">Client’s Claim in Validation</span>
//         </div>

//         <div className="flex justify-between items-center">
//           <div
//             className="flex items-center gap-2"
//             onClick={() => setShowButton(!showButton)}
//           >
//             {showButton ? (
//               <div className="w-5 h-5 bg-blue-500 rounded border-[6px] border-blue-200" />
//             ) : (
//               <div className="w-5 h-5 bg-neutral-300 rounded" />
//             )}

//             <span className="text-sm">ABI Insurer?</span>
//           </div>
//           {showButton && (
//             <a
//               href="https://www.gtacredithire.com/chc-insurer-details/"
//               target="_blank"
//               className="flex items-center gap-2 h-8 px-3 py-2 bg-blue-100 text-primary rounded text-sm"
//             >
//               <img src={TopRightIcon} alt="" />
//               Check if ABI Insurer
//             </a>
//           )}
//         </div>
//       </div>

//       {/* Section 4: Incorrect MID Search Log */}
//       <div className="self-stretch p-5 bg-indigo-50 rounded-lg border border-neutral-100 flex flex-col gap-4">
//         <h2 className="text-neutral-900 text-[20px] font-weight-600">
//           Incorrect MID Search Log
//         </h2>
//         <div className="h-px bg-neutral-100 opacity-20" />

//         <div className="grid grid-cols-2  gap-5">
//           {renderInput("Incorrect MID Ref", "incorrect_mid_ref", "Enter Ref")}
//           <div className="flex flex-col gap-2">
//             <label className="text-neutral-700 text-sm font-weight-400">
//               Conducting The New MID?
//             </label>
//             <Select
//               options={lookups.handlers.map((h: any) => ({
//                 value: h.id,
//                 label: h.label,
//               }))}
//               styles={customStyles}
//               placeholder="Select Category"
//               value={lookups.handlers.find(
//                 (o: any) => o.id === formik.values.handler_id,
//               )}
//               onChange={(o: any) => formik.setFieldValue("handler_id", o.value)}
//               components={{
//                 DropdownIndicator: BlueDropdownIndicator,
//                 IndicatorSeparator: () => null,
//               }}
//             />
//           </div>
//         </div>

//         <div className="grid grid-cols-2 gap-5">
//           {renderDatePicker("Incorrect Acc", "incorrect_acc")}
//           {renderDatePicker("Initial Eng Made", "initial_eng_made")}
//         </div>

//         <div className="grid grid-cols-2 gap-5">
//           {renderDatePicker("New MID Conducted", "new_mid")}
//           {renderInput("New MID Search Ref", "new_mid_search_ref", "Enter Ref")}
//         </div>

//         <div className="grid grid-cols-2 gap-5">
//           <div className="flex flex-col gap-2">
//             <label className="text-neutral-700 text-sm font-weight-400">
//               Reason for New MID
//             </label>
//             <Select
//               options={lookups.reasons.map((r: any) => ({
//                 value: r.id,
//                 label: r.label,
//               }))}
//               styles={customStyles}
//               placeholder="Select Category"
//               onChange={(o: any) =>
//                 formik.setFieldValue("reason_new_mid_id", o.value)
//               }
//               value={formik.values.reason_new_mid_id}
//               components={{
//                 DropdownIndicator: BlueDropdownIndicator,
//                 IndicatorSeparator: () => null,
//               }}
//             />
//           </div>
//           {renderInput("Incorrect Reg", "incorrect_reg", "Enter Reg")}
//         </div>

//         <div
//           className="flex items-center gap-2"
//           onClick={() =>
//             formik.setFieldValue(
//               "new_mid_search_processed",
//               !formik.values.new_mid_search_processed,
//             )
//           }
//         >
//           {formik.values.new_mid_search_processed ? (
//             <div className="w-5 h-5 bg-blue-500 rounded border-[6px] border-blue-200" />
//           ) : (
//             <div className="w-5 h-5 bg-neutral-300 rounded" />
//           )}

//           <span className="text-sm font-weight-300 font-light">
//             New MID Search Processed ?
//           </span>
//         </div>
//       </div>

//       {/* Section 6: Liability Section */}
//       <div className="self-stretch p-5 rounded-lg border border-neutral-100 flex flex-col gap-4">
//         <h2 className="text-neutral-900 text-[20px] font-weight-600">
//           Liability Section
//         </h2>
//         <div className="h-px bg-neutral-100" />
//         <div className="flex flex-col gap-5">
//           <label className="text-black text-sm font-weight-400 font-['Stack_Sans_Headline']">
//             ABI Insurer ?
//           </label>
//           <div className="flex items-center gap-5">
//             {["Yes", "No"].map((option) => (
//               <label
//                 key={option}
//                 className="flex items-center gap-2 cursor-pointer"
//               >
//                 <div className="relative flex items-center justify-center">
//                   <input
//                     type="radio"
//                     name="abi_insured"
//                     className="sr-only"
//                     checked={formik.values.abi_insured === option}
//                     onChange={() => formik.setFieldValue("abi_insured", option)}
//                   />

//                   {formik.values.abi_insured === option ? (
//                     <img src={Yes} />
//                   ) : (
//                     <img src={No} />
//                   )}
//                 </div>

//                 <span className="text-black text-sm">{option}</span>
//               </label>
//             ))}
//           </div>
//         </div>
//         <div className="grid grid-cols-2 gap-5">
//           <div className="flex flex-col gap-2">
//             <label className="text-neutral-700 text-sm font-weight-400">
//               Current Liability Stance
//             </label>
//             <Select
//               options={lookups.stances.map((s: any) => ({
//                 value: s.id,
//                 label: s.label,
//               }))}
//               value={formik.values.liability_stance_id}
//               styles={customStyles}
//               placeholder="Select Category"
//               onChange={(o: any) =>
//                 formik.setFieldValue("liability_stance_id", o)
//               }
//               components={{
//                 DropdownIndicator: BlueDropdownIndicator,
//                 IndicatorSeparator: () => null,
//               }}
//             />
//           </div>
//           {renderDatePicker("Liability Accepted on", "liability_accepted_on")}
//         </div>
//       </div>
//       {/* Section 5: Notifications Section */}
//       <div className="self-stretch p-5 rounded-lg border border-neutral-100 flex flex-col justify-start items-start gap-4">
//         <div className="self-stretch rounded-lg inline-flex justify-start items-center gap-4">
//           <div className="text-neutral-900 text-[20px] font-weight-600 leading-5">
//             Notifications Section
//           </div>
//         </div>

//         <div className="self-stretch h-px bg-neutral-100" />

//         {/* ABI 1st Notification Row */}
//         <div className="self-stretch inline-flex justify-between items-start">
//           <div className="inline-flex flex-col justify-center items-start gap-2">
//             <div className="text-neutral-700 text-sm font-normal">
//               Send ABI 1st Notification
//             </div>
//             <button
//               type="button"
//               onClick={handleSendNotification}
//               className="h-8 px-3 py-2 bg-blue-100 text-primary rounded inline-flex justify-center items-center gap-2.5 text-sm font-normal hover:bg-indigo-200 transition-colors"
//             >
//               Send Notification
//             </button>
//           </div>
//           <div className="w-96 inline-flex flex-col justify-center items-start gap-2">
//             <div className="text-neutral-700 text-sm font-weight-400">
//               ABI 1st Notification Sent On
//             </div>
//             <div className="text-neutral-700 text-sm font-normal">
//               {formik.values.abi_1st_notif_date
//                 ? formatDisplayDate(formik.values.abi_1st_notif_date)
//                 : "00-00-00 00:00AM"}
//             </div>
//           </div>
//         </div>

//         <div className="self-stretch h-px bg-neutral-100" />

//         {/* Payment Pack Row */}
//         <div className="self-stretch inline-flex justify-between items-start">
//           <div className="inline-flex flex-col justify-start items-start gap-4">
//             <div className="text-neutral-700 text-sm font-normal">
//               Send Payment Pack
//             </div>
//             <button
//               type="button"
//               onClick={handleSendPaymentPack}
//               className="h-8 px-3 py-2 bg-blue-100 text-primary  rounded inline-flex justify-center items-center gap-2.5 text-sm font-normal hover:bg-indigo-200 transition-colors"
//             >
//               Send Pack
//             </button>
//           </div>
//           <div className="w-96 inline-flex flex-col justify-center items-start gap-2">
//             <div className="text-neutral-700 text-sm font-weight-400">
//               Payment Pack Sent On
//             </div>
//             <div className="text-neutral-700 text-sm font-normal">
//               {formik.values.payment_pack_date
//                 ? formatDisplayDate(formik.values.payment_pack_date)
//                 : "00-00-00 00:00AM"}
//             </div>
//           </div>
//         </div>
//       </div>
//       {/* Section 7: Settlement Status */}
//       <div className="self-stretch p-5 rounded-lg border border-neutral-100 flex flex-col gap-4">
//         <h2 className="text-neutral-900 text-[20px] font-weight-600">
//           Settlement Status
//         </h2>
//         <div className="h-px bg-neutral-100" />
//         <div className="flex flex-col gap-2 w-96">
//           <label className="text-neutral-700 text-sm font-weight-400">
//             Settlement Status
//           </label>
//           <Select
//             options={lookups.statuses.map((s: any) => ({
//               value: s.id,
//               label: s.label,
//             }))}
//             menuPlacement="top"
//             styles={customStyles}
//             placeholder="Select Category"
//             onChange={(o: any) =>
//               formik.setFieldValue("settlement_status_id", o.value)
//             }
//             components={{
//               DropdownIndicator: BlueDropdownIndicator,
//               IndicatorSeparator: () => null,
//             }}
//           />
//         </div>
//       </div>
//     </div>
//   );
// };;

// export default ThirdPartyInsurer;

import { useEffect, useRef, useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import Select from "react-select";
import { toast } from "react-toastify";
import Vector6 from "../../../assets/AutoClaim_icon/Vector-6.svg";
import Yes from "../../../assets/AutoClaim_icon/Yes.svg";
import No from "../../../assets/AutoClaim_icon/No.svg";
import TopRightIcon from "../../../assets/AutoClaim_icon/Vulnerable.svg";
import { ABIInsurerModal } from "./ABIInsurerModal";
import { CustomDatePicker } from "../Components/DatePicker";
import { PostcodeLookup } from "../../../components/common/PostcodeLookup";
import { AddressAutocomplete } from "../../../components/common/AddressAutocomplete";
import {
  getHandlers,
  getLiabilityStances,
  getMidReasons,
  getSettlementStatus,
} from "../../../services/Lookups/Generaldetails";
import {
  createThirdPartyInsurer,
  getThirdPartyInsurer,
  updateThirdPartyInsurer,
} from "../../../services/ThirdPartyInsurer/ThirdPartyInsurer";
import { BlueDropdownIndicator, customStyles } from "./GeneralDetailsForm";
import { getCompanySuggestions } from "../../../services/Referrer/Referrer";
import { getLocalTimeZone } from "@internationalized/date";

// notification stamp dates are not in the backend model — persisted locally per claim
const NOTIF_KEY = (id: string) => `tpi_notif_${id}`;

const ThirdPartyInsurer = ({ formRef, claimId: claimIdProp }: any) => {
  const claimId = claimIdProp || "";

  const [loading, setLoading] = useState(true);
  const [tpiExists, setTpiExists] = useState(false);
  const [showABIModal, setShowABIModal] = useState(false);
  const [lookups, setLookups] = useState<any>({ handlers: [], reasons: [], stances: [], statuses: [] });
  const [showPickers, setShowPickers] = useState<any>({});
  const [companies, setCompanies] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [notifDates, setNotifDates] = useState(() => {
    const saved = localStorage.getItem(NOTIF_KEY(claimId));
    return saved ? JSON.parse(saved) : { abi_1st_notif_date: "", payment_pack_date: "" };
  });
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const response = await getCompanySuggestions(searchTerm);
        setCompanies(response.data);
      } catch (err) {
        console.error(err);
      }
    };
    if (searchTerm) fetchCompanies();
  }, [searchTerm]);

  // --- HELPERS ---
  const formatDate = (val: any): string | null => {
    if (!val) return null;
    if (typeof val === "string") return val.split("T")[0];
    const date = "toDate" in val ? val.toDate(getLocalTimeZone()) : new Date(val);
    if (isNaN(date.getTime())) return null;
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  const mapBackendToForm = (data: any) => ({
    direct_email: data.direct_email || "",
    insurer_reference: data.insurer_reference || "",
    policy_number: data.policy_number || "",
    claim_validation: data.claim_validation || false,
    handling_reference: data.handling_reference || "",
    incorrect_mid_reference: data.incorrect_mid_reference || "",
    incorrect_acc: formatDate(data.incorrect_acc) || "",
    initial_eng_made: formatDate(data.initial_eng_made) || "",
    new_mid: formatDate(data.new_mid) || "",
    new_mid_search_ref: data.new_mid_search_ref || "",
    incorrect_reg: data.incorrect_reg || "",
    new_mid_search_processed: data.new_mid_search_processed || false,
    abi_insured: data.abi_insured ? "Yes" : "No",
    liability_accepted_on: data.liability_accepted_on || "",
    reason_new_mid_id: data.reason_new_mid_id || null,
    liability_stance_id: data.liability_stance_id || null,
    settlement_status_id: data.settlement_status_id || null,
    handler_id: data.handler_id || null,
    third_party: {
      gender: data.third_party?.gender || "mr",
      first_name: data.third_party?.first_name || "",
      surname: data.third_party?.surname || "",
      address: {
        address: data.third_party?.address?.address || "",
        postcode: data.third_party?.address?.postcode || "",
        mobile_tel: data.third_party?.address?.mobile_tel || "",
        email: data.third_party?.address?.email || "",
      },
    },
    third_party_insurer: {
      gender: data.third_party_insurer?.gender || "mr",
      first_name: data.third_party_insurer?.first_name || "",
      surname: data.third_party_insurer?.surname || "",
      address: {
        address: data.third_party_insurer?.address?.address || "",
        postcode: data.third_party_insurer?.address?.postcode || "",
        mobile_tel: data.third_party_insurer?.address?.mobile_tel || "",
        email: data.third_party_insurer?.address?.email || "",
      },
    },
    third_party_handling: {
      gender: data.third_party_handling?.gender || "mr",
      first_name: data.third_party_handling?.first_name || "",
      surname: data.third_party_handling?.surname || "",
      address: {
        address: data.third_party_handling?.address?.address || "",
        postcode: data.third_party_handling?.address?.postcode || "",
        mobile_tel: data.third_party_handling?.address?.mobile_tel || "",
        email: data.third_party_handling?.address?.email || "",
      },
    },
  });

  const formik = useFormik({
    initialValues: {
      direct_email: "",
      insurer_reference: "",
      policy_number: "",
      claim_validation: false,
      handling_reference: "",
      incorrect_mid_reference: "",
      incorrect_acc: "",
      initial_eng_made: "",
      new_mid: "",
      new_mid_search_ref: "",
      incorrect_reg: "",
      new_mid_search_processed: false,
      abi_insured: "No",
      liability_accepted_on: "",
      reason_new_mid_id: null as number | null,
      liability_stance_id: null as number | null,
      settlement_status_id: null as number | null,
      handler_id: null as number | null,
      third_party: {
        gender: "mr",
        first_name: "",
        surname: "",
        address: { address: "", postcode: "", mobile_tel: "", email: "" },
      },
      third_party_insurer: {
        gender: "mr",
        first_name: "",
        surname: "",
        address: { address: "", postcode: "", mobile_tel: "", email: "" },
      },
      third_party_handling: {
        gender: "mr",
        first_name: "",
        surname: "",
        address: { address: "", postcode: "", mobile_tel: "", email: "" },
      },
    },
    validationSchema: Yup.object({
      direct_email: Yup.string().email("Invalid email format").nullable(),
      policy_number: Yup.string().when("third_party_insurer", {
        is: (tpi: any) => tpi?.first_name?.trim().length > 0,
        then: (s) => s.required("Policy No. is required when Insurer Name is provided"),
      }),
      third_party: Yup.object({
        address: Yup.object({
          email: Yup.string().email("Invalid email format").nullable(),
        }),
      }),
      third_party_insurer: Yup.object({
        address: Yup.object({
          email: Yup.string().email("Invalid email format").nullable(),
        }),
      }),
      third_party_handling: Yup.object({
        address: Yup.object({
          email: Yup.string().email("Invalid email format").nullable(),
        }),
      }),
    }),
    onSubmit: async (values) => {
      try {
        const selectedStance = lookups.stances.find((s: any) => s.id === values.liability_stance_id);
        const stanceLabel = (selectedStance?.label || "").toLowerCase();
        if ((stanceLabel.includes("accept") || stanceLabel === "fault") && !values.liability_accepted_on) {
          toast.error("Liability Accepted On is required for Accepted or Fault stance");
          return;
        }

        const payload = {
          ...values,
          claim_id: parseInt(claimId),
          abi_insured: values.abi_insured === "Yes",
          incorrect_acc: formatDate(values.incorrect_acc),
          initial_eng_made: formatDate(values.initial_eng_made),
          new_mid: formatDate(values.new_mid),
          liability_accepted_on: values.liability_accepted_on || null,
        };

        if (tpiExists) {
          await updateThirdPartyInsurer(payload, parseInt(claimId));
        } else {
          await createThirdPartyInsurer(payload);
          setTpiExists(true);
        }

        toast.success("Third Party Insurer details saved");
      } catch (error) {
        console.error("Error saving TPI:", error);
        toast.error("Failed to save Third Party Insurer details");
      }
    },
  });

  // --- HELPERS ---
  const getNestedValue = (path: string) =>
    path.split(".").reduce((obj: any, key) => (obj && obj[key] !== undefined ? obj[key] : ""), formik.values);

  const getNestedError = (path: string): string | undefined =>
    path.split(".").reduce((obj: any, key) => (obj && obj[key] !== undefined ? obj[key] : undefined), formik.errors) as string | undefined;

  const formatDisplayDate = (dateValue: any) => {
    if (!dateValue) return "Not set";
    const date = new Date(dateValue);
    if (isNaN(date.getTime())) return "Not set";
    return `${date.toLocaleDateString("sv-SE")} ${date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true }).toLowerCase()}`;
  };

  // --- ACTIONS ---
  const handleSendNotification = () => {
    const updated = { ...notifDates, abi_1st_notif_date: new Date().toISOString() };
    setNotifDates(updated);
    localStorage.setItem(NOTIF_KEY(claimId), JSON.stringify(updated));
    toast.success("ABI 1st Notification generated.");
  };

  const handleSendPaymentPack = () => {
    const updated = { ...notifDates, payment_pack_date: new Date().toISOString() };
    setNotifDates(updated);
    localStorage.setItem(NOTIF_KEY(claimId), JSON.stringify(updated));
    toast.success("Payment Pack sent.");
  };

  const handleCompanySelect = (selected: any) => {
    setSearchTerm(selected.company_name);
    setShowDropdown(false);
    formik.setFieldValue("third_party_insurer.first_name", selected.company_name);
    formik.setFieldValue("third_party_insurer.address.address", selected.address || "");
    formik.setFieldValue("third_party_insurer.address.postcode", selected.postcode || "");
  };

  // --- EFFECTS ---
  useEffect(() => {
    const init = async () => {
      try {
        const [h, r, st, su] = await Promise.all([
          getHandlers(),
          getMidReasons(),
          getLiabilityStances(),
          getSettlementStatus(),
        ]);
        setLookups({ handlers: h.data, reasons: r.data, stances: st.data, statuses: su.data });

        if (claimId) {
          try {
            const res = await getThirdPartyInsurer(parseInt(claimId));
            setTpiExists(true);
            formik.setValues(mapBackendToForm(res.data));
            if (res.data?.third_party_insurer?.first_name) {
              setSearchTerm(res.data.third_party_insurer.first_name);
            }
          } catch (err: any) {
            if (err?.response?.status !== 404) console.error(err);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  useEffect(() => {
    if (formRef) formRef.current = formik;
  }, [formik]);

  // --- RENDERERS ---
  const renderInput = (label: string, field: string, placeholder: string) => (
    <div className="flex flex-col gap-2 w-full">
      <label className="text-neutral-700 text-sm font-light">{label}</label>
      <input
        type="text"
        value={getNestedValue(field)}
        onChange={(e) => formik.setFieldValue(field, e.target.value)}
        placeholder={placeholder}
        className="px-5 py-4 h-[52px] bg-white rounded border border-neutral-200 text-base font-light outline-none focus:border-blue-500 transition-colors"
      />
      {getNestedError(field) && (
        <span className="text-red-500 text-xs">{getNestedError(field)}</span>
      )}
    </div>
  );

  const renderDatePicker = (label: string, field: string) => {
    const pickerRef = useRef<HTMLDivElement>(null);
    const value = getNestedValue(field);

    useEffect(() => {
      const clickOut = (e: MouseEvent) => {
        if (showPickers[field] && pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
          setShowPickers((prev: any) => ({ ...prev, [field]: false }));
        }
      };
      document.addEventListener("mousedown", clickOut);
      return () => document.removeEventListener("mousedown", clickOut);
    }, [showPickers[field]]);

    return (
      <div ref={pickerRef} className="flex flex-col gap-2 relative w-full">
        <label className="text-neutral-700 text-sm font-light">{label}</label>
        <div
          onClick={() => setShowPickers({ ...showPickers, [field]: !showPickers[field] })}
          className="px-5 py-4 bg-white h-[52px] rounded border border-neutral-200 flex justify-between items-center cursor-pointer hover:border-neutral-400 transition-colors"
        >
          <span className={value ? "text-black" : "text-neutral-300"}>{value || "Date"}</span>
          <img src={Vector6} alt="calendar" className="w-4 h-4" />
        </div>
        {showPickers[field] && (
          <div className="absolute top-[85px] left-0 z-[100] shadow-xl bg-white rounded">
            <CustomDatePicker
              selectedDate={value ? new Date(value) : new Date()}
              onDateSelect={(date: Date) => {
                formik.setFieldValue(field, date.toLocaleDateString("sv-SE"));
                setShowPickers({ ...showPickers, [field]: false });
              }}
            />
          </div>
        )}
      </div>
    );
  };

  const selectedStanceLabel = (lookups.stances.find((s: any) => s.id === formik.values.liability_stance_id)?.label || "").toLowerCase();
  const liabilityAcceptedRequired = selectedStanceLabel.includes("accept") || selectedStanceLabel === "fault";

  return (
    <div className="relative MainContent w-full flex flex-col items-start gap-6 py-1 font-[‘Stack_Sans_Headline’]">
      {loading && (
        <div className="fixed inset-0 z-[9999] bg-[#e8e6df]/80 flex items-center justify-center font-['Stack_Sans_Headline']">
          <div className="relative w-[73px] h-[73px]">
            {Array.from({ length: 12 }).map((_, index) => (
              <span
                key={index}
                className="absolute left-1/2 top-1/2 w-[6px] h-[16px] rounded-full bg-[#9b9b9b] animate-loaderFade"
                style={{
                  transform: `translate(-50%, -50%) rotate(${index * 30}deg) translateY(-25px)`,
                  animationDelay: `${index * 0.08}s`,
                }}
              />
            ))}
          </div>
        </div>
      )}

      <ABIInsurerModal isOpen={showABIModal} onClose={() => setShowABIModal(false)} />

      <h1 className="text-neutral-900 text-[24px] font-weight-600">Third Party Insurer</h1>

      {/* 1. Third Party Details */}
      <div className="self-stretch p-5 rounded-lg border border-neutral-100 flex flex-col gap-4">
        <h2 className="text-neutral-900 text-[20px] font-weight-600">Third Party Details</h2>
        <div className="h-px bg-neutral-100" />
        <div className="flex flex-col gap-2 w-full">
          <label className="text-neutral-700 text-sm font-light">Title</label>
          <Select
            options={[{ value: "mr", label: "Mr" }, { value: "mrs", label: "Mrs" }]}
            styles={customStyles}
            value={[{ value: "mr", label: "Mr" }, { value: "mrs", label: "Mrs" }].find((o) => o.value === formik.values.third_party.gender)}
            onChange={(o: any) => formik.setFieldValue("third_party.gender", o.value)}
            components={{ DropdownIndicator: BlueDropdownIndicator, IndicatorSeparator: () => null }}
          />
        </div>
        <div className="grid grid-cols-2 gap-5">
          {renderInput("Forename", "third_party.first_name", "Enter Forename")}
          {renderInput("Surname", "third_party.surname", "Enter Surname")}
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-neutral-700 text-sm font-light">Address</label>
          <AddressAutocomplete
            address={formik.values.third_party.address.address || ""}
            onChange={(v) => formik.setFieldValue("third_party.address.address", v)}
            onPlaceSelected={(place) => {
              formik.setFieldValue("third_party.address.address", place.address);
              formik.setFieldValue("third_party.address.postcode", place.postcode);
            }}
            inputClassName="px-5 h-[52px] bg-white rounded border border-neutral-200 text-base font-light outline-none focus:border-blue-500 transition-colors w-full"
          />
        </div>
        <div className="grid grid-cols-2 gap-5">
          <div className="flex flex-col gap-2 w-full">
            <label className="text-neutral-700 text-sm font-light">Postcode</label>
            <PostcodeLookup
              postcode={getNestedValue("third_party.address.postcode")}
              onChange={(v) => formik.setFieldValue("third_party.address.postcode", v)}
              onAddressSelect={(addr) => {
                formik.setFieldValue("third_party.address.postcode", addr.postcode);
                formik.setFieldValue("third_party.address.address", [addr.line1, addr.line2, addr.line3].filter(Boolean).join(", "));
              }}
              inputClassName="px-5 h-[52px] bg-white rounded border border-neutral-200 text-base font-light outline-none focus:border-blue-500 transition-colors w-full"
            />
          </div>
          {renderInput("Email Address", "third_party.address.email", "Email")}
        </div>
        <div className="grid grid-cols-2 gap-5">
          {renderInput("Main Tel.", "third_party.address.mobile_tel", "+44")}
          {renderInput("Contact", "third_party.address.mobile_tel", "Contact")}
        </div>
      </div>

      {/* 2. Third Party Insurer Details */}
      <div className="self-stretch p-5 rounded-lg border border-neutral-100 flex flex-col gap-4">
        <h2 className="text-neutral-900 text-[20px] font-weight-600">Third Party Insurer Details</h2>
        <div className="h-px bg-neutral-100" />
        {/* Company Name with autocomplete */}
        <div className="flex flex-col gap-2 relative">
          <label className="text-neutral-700 text-sm font-light">Name</label>
          <input
            type="text"
            value={searchTerm || formik.values.third_party_insurer.first_name}
            onChange={(e) => { setSearchTerm(e.target.value); setShowDropdown(true); }}
            placeholder="Enter Company Name"
            className="w-full h-[52px] px-5 bg-white rounded border border-neutral-200 text-base font-light outline-none focus:border-blue-500 transition-colors"
          />
          {showDropdown && searchTerm && companies.length > 0 && (
            <div className="absolute top-[82px] left-0 w-full bg-white border rounded shadow-lg z-50 max-h-40 overflow-auto">
              {companies.map((c, i) => (
                <div key={i} onClick={() => handleCompanySelect(c)} className="px-4 py-3 hover:bg-gray-50 cursor-pointer text-sm">
                  {c.company_name}
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-neutral-700 text-sm font-light">Address</label>
          <AddressAutocomplete
            address={formik.values.third_party_insurer.address.address || ""}
            onChange={(v) => formik.setFieldValue("third_party_insurer.address.address", v)}
            onPlaceSelected={(place) => {
              formik.setFieldValue("third_party_insurer.address.address", place.address);
              formik.setFieldValue("third_party_insurer.address.postcode", place.postcode);
            }}
            inputClassName="px-5 h-[52px] bg-white rounded border border-neutral-200 text-base font-light outline-none focus:border-blue-500 transition-colors w-full"
          />
        </div>
        <div className="grid grid-cols-2 gap-5">
          <div className="flex flex-col gap-2 w-full">
            <label className="text-neutral-700 text-sm font-light">Postcode</label>
            <PostcodeLookup
              postcode={getNestedValue("third_party_insurer.address.postcode")}
              onChange={(v) => formik.setFieldValue("third_party_insurer.address.postcode", v)}
              onAddressSelect={(addr) => {
                formik.setFieldValue("third_party_insurer.address.postcode", addr.postcode);
                formik.setFieldValue("third_party_insurer.address.address", [addr.line1, addr.line2, addr.line3].filter(Boolean).join(", "));
              }}
              inputClassName="px-5 h-[52px] bg-white rounded border border-neutral-200 text-base font-light outline-none focus:border-blue-500 transition-colors w-full"
            />
          </div>
          {renderInput("Main Tel.", "third_party_insurer.address.mobile_tel", "+44")}
        </div>
        <div className="grid grid-cols-2 gap-5">
          {renderInput("General Email", "third_party_insurer.address.email", "General Email")}
          {renderInput("Direct Email", "direct_email", "Direct Email")}
        </div>
        <div className="grid grid-cols-2 gap-5">
          {renderInput("Reference", "insurer_reference", "Enter Reference")}
          {renderInput("Policy No.", "policy_number", "Enter Policy No.")}
        </div>
        <div
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => formik.setFieldValue("claim_validation", !formik.values.claim_validation)}
        >
          <div className={`w-5 h-5 rounded ${formik.values.claim_validation ? "bg-blue-600 border-[6px] border-blue-200" : "bg-neutral-300"}`} />
          <span className="text-sm">Client’s Claim in Validation</span>
        </div>
        <div>
          <button
            type="button"
            onClick={() => setShowABIModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-primary rounded text-sm hover:bg-blue-200 transition-colors"
          >
            <img src={TopRightIcon} alt="" className="w-4 h-4" />
            Check if ABI Insurer
          </button>
        </div>
      </div>

      {/* 3. Third Party Handling Agent */}
      <div className="self-stretch p-5 rounded-lg border border-neutral-100 flex flex-col gap-4">
        <h2 className="text-neutral-900 text-[20px] font-weight-600">Third Party Handling Agent</h2>
        <div className="h-px bg-neutral-100" />
        {renderInput("Name", "third_party_handling.first_name", "Enter Name")}
        <div className="flex flex-col gap-2">
          <label className="text-neutral-700 text-sm font-light">Address</label>
          <AddressAutocomplete
            address={formik.values.third_party_handling.address.address || ""}
            onChange={(v) => formik.setFieldValue("third_party_handling.address.address", v)}
            onPlaceSelected={(place) => {
              formik.setFieldValue("third_party_handling.address.address", place.address);
              formik.setFieldValue("third_party_handling.address.postcode", place.postcode);
            }}
            inputClassName="px-5 h-[52px] bg-white rounded border border-neutral-200 text-base font-light outline-none focus:border-blue-500 transition-colors w-full"
          />
        </div>
        <div className="grid grid-cols-2 gap-5">
          <div className="flex flex-col gap-2 w-full">
            <label className="text-neutral-700 text-sm font-light">Postcode</label>
            <PostcodeLookup
              postcode={getNestedValue("third_party_handling.address.postcode")}
              onChange={(v) => formik.setFieldValue("third_party_handling.address.postcode", v)}
              onAddressSelect={(addr) => {
                formik.setFieldValue("third_party_handling.address.postcode", addr.postcode);
                formik.setFieldValue("third_party_handling.address.address", [addr.line1, addr.line2, addr.line3].filter(Boolean).join(", "));
              }}
              inputClassName="px-5 h-[52px] bg-white rounded border border-neutral-200 text-base font-light outline-none focus:border-blue-500 transition-colors w-full"
            />
          </div>
          {renderInput("Tel. Main", "third_party_handling.address.mobile_tel", "+44")}
        </div>
        <div className="grid grid-cols-2 gap-5">
          {renderInput("Email Address", "third_party_handling.address.email", "Email")}
          {renderInput("Reference", "handling_reference", "Reference")}
        </div>
      </div>

      {/* 4. Incorrect MID Search Log — visually distinct (indigo background) */}
      <div className="self-stretch p-5 bg-indigo-50 rounded-lg border border-indigo-100 flex flex-col gap-4">
        <h2 className="text-neutral-900 text-[20px] font-weight-600">Incorrect MID Search Log</h2>
        <div className="h-px bg-indigo-200 opacity-40" />
        <div className="grid grid-cols-2 gap-5">
          {renderInput("Incorrect MID Ref", "incorrect_mid_reference", "Enter 15-digit Ref")}
          <div className="flex flex-col gap-2">
            <label className="text-neutral-700 text-sm font-light">Conducting The New MID?</label>
            <Select
              options={lookups.handlers.map((h: any) => ({ value: h.id, label: h.label }))}
              styles={customStyles}
              placeholder="Select Handler"
              value={lookups.handlers.find((o: any) => o.id === formik.values.handler_id)
                ? { value: formik.values.handler_id, label: lookups.handlers.find((o: any) => o.id === formik.values.handler_id)?.label }
                : null}
              onChange={(o: any) => formik.setFieldValue("handler_id", o.value)}
              components={{ DropdownIndicator: BlueDropdownIndicator, IndicatorSeparator: () => null }}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-5">
          {renderDatePicker("Incorrect Acc", "incorrect_acc")}
          {renderDatePicker("Initial Eng Made", "initial_eng_made")}
        </div>
        <div className="grid grid-cols-2 gap-5">
          {renderDatePicker("New MID Conducted", "new_mid")}
          {renderInput("New MID Search Ref", "new_mid_search_ref", "Enter Ref")}
        </div>
        <div className="grid grid-cols-2 gap-5">
          <div className="flex flex-col gap-2">
            <label className="text-neutral-700 text-sm font-light">Reason for New MID</label>
            <Select
              options={lookups.reasons.map((r: any) => ({ value: r.id, label: r.label }))}
              styles={customStyles}
              placeholder="Select Reason"
              value={lookups.reasons.find((o: any) => o.id === formik.values.reason_new_mid_id)
                ? { value: formik.values.reason_new_mid_id, label: lookups.reasons.find((o: any) => o.id === formik.values.reason_new_mid_id)?.label }
                : null}
              onChange={(o: any) => formik.setFieldValue("reason_new_mid_id", o.value)}
              components={{ DropdownIndicator: BlueDropdownIndicator, IndicatorSeparator: () => null }}
            />
          </div>
          {renderInput("Incorrect Reg", "incorrect_reg", "Enter Reg")}
        </div>
        <div
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => formik.setFieldValue("new_mid_search_processed", !formik.values.new_mid_search_processed)}
        >
          <div className={`w-5 h-5 rounded ${formik.values.new_mid_search_processed ? "bg-blue-600 border-[6px] border-blue-200" : "bg-neutral-300"}`} />
          <span className="text-sm">New MID Search Processed?</span>
        </div>
      </div>

      {/* 5. Notifications Section */}
      <div className="self-stretch p-5 rounded-lg border border-neutral-100 flex flex-col gap-4">
        <h2 className="text-neutral-900 text-[20px] font-weight-600">Notifications Section</h2>
        <div className="h-px bg-neutral-100" />
        <div className="flex justify-between items-start bg-gray-50 p-4 rounded-lg">
          <div className="flex flex-col gap-2">
            <span className="text-sm text-neutral-700">Send ABI 1st Notification</span>
            <button type="button" onClick={handleSendNotification}
              className="px-4 py-2 bg-blue-100 text-primary rounded text-sm hover:bg-blue-200 transition-all w-fit">
              Send Notification
            </button>
          </div>
          <div className="w-64 flex flex-col gap-1">
            <span className="text-sm text-neutral-700">ABI 1st Notification Sent On</span>
            <p className="text-sm text-neutral-500 font-light">{formatDisplayDate(notifDates.abi_1st_notif_date)}</p>
          </div>
        </div>
        <div className="flex justify-between items-start bg-gray-50 p-4 rounded-lg">
          <div className="flex flex-col gap-2">
            <span className="text-sm text-neutral-700">Send Payment Pack</span>
            <button type="button" onClick={handleSendPaymentPack}
              className="px-4 py-2 bg-blue-100 text-primary rounded text-sm hover:bg-blue-200 transition-all w-fit">
              Send Pack
            </button>
          </div>
          <div className="w-64 flex flex-col gap-1">
            <span className="text-sm text-neutral-700">Payment Pack Sent On</span>
            <p className="text-sm text-neutral-500 font-light">{formatDisplayDate(notifDates.payment_pack_date)}</p>
          </div>
        </div>
      </div>

      {/* 6. Liability Section */}
      <div className="self-stretch p-5 rounded-lg border border-neutral-100 flex flex-col gap-4">
        <h2 className="text-neutral-900 text-[20px] font-weight-600">Liability Section</h2>
        <div className="h-px bg-neutral-100" />
        <div className="flex flex-col gap-3">
          <label className="text-sm font-light">ABI Insurer?</label>
          <div className="flex gap-6">
            {["Yes", "No"].map((opt) => (
              <label key={opt} className="flex items-center gap-2 cursor-pointer">
                <input type="radio" className="hidden" checked={formik.values.abi_insured === opt}
                  onChange={() => formik.setFieldValue("abi_insured", opt)} />
                <img src={formik.values.abi_insured === opt ? Yes : No} className="w-5 h-5" alt="" />
                <span className="text-sm">{opt}</span>
              </label>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-5">
          <div className="flex flex-col gap-2">
            <label className="text-neutral-700 text-sm font-light">Current Liability Stance</label>
            <Select
              options={lookups.stances.map((s: any) => ({ value: s.id, label: s.label }))}
              styles={customStyles}
              placeholder="Select Stance"
              value={lookups.stances.find((o: any) => o.id === formik.values.liability_stance_id)
                ? { value: formik.values.liability_stance_id, label: lookups.stances.find((o: any) => o.id === formik.values.liability_stance_id)?.label }
                : null}
              onChange={(o: any) => formik.setFieldValue("liability_stance_id", o.value)}
              components={{ DropdownIndicator: BlueDropdownIndicator, IndicatorSeparator: () => null }}
            />
          </div>
          <div className="flex flex-col gap-2 w-full">
            <label className="text-neutral-700 text-sm font-light">
              Liability Accepted On{liabilityAcceptedRequired && <span className="text-red-500 ml-1">*</span>}
            </label>
            {renderDatePicker("", "liability_accepted_on")}
          </div>
        </div>
      </div>

      {/* 7. Settlement Status */}
      <div className="self-stretch p-5 rounded-lg border border-neutral-100 flex flex-col gap-4">
        <h2 className="text-neutral-900 text-[20px] font-weight-600">Settlement Status</h2>
        <div className="h-px bg-neutral-100" />
        <div className="flex flex-col gap-2 w-full">
          <label className="text-neutral-700 text-sm font-light">Settlement Status</label>
          <Select
            options={lookups.statuses.map((s: any) => ({ value: s.id, label: s.label }))}
            styles={customStyles}
            menuPlacement="top"
            placeholder="Select Settlement Status"
            value={lookups.statuses.find((o: any) => o.id === formik.values.settlement_status_id)
              ? { value: formik.values.settlement_status_id, label: lookups.statuses.find((o: any) => o.id === formik.values.settlement_status_id)?.label }
              : null}
            onChange={(o: any) => formik.setFieldValue("settlement_status_id", o.value)}
            components={{ DropdownIndicator: BlueDropdownIndicator, IndicatorSeparator: () => null }}
          />
        </div>
      </div>
    </div>
  );
};

export default ThirdPartyInsurer;