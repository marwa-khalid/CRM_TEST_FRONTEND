// // import Vector6 from "../../../assets/AutoClaim_icon/Vector-6.svg";
// // import { useEffect, useState, useRef } from "react";
// // import { CustomDatePicker } from "../Components/DatePicker";
// // import * as Yup from "yup";
// // import { useFormik } from "formik";
// // import { toast } from "react-toastify";
// // import Yes from "../../../assets/AutoClaim_icon/Yes.svg";
// // import No from "../../../assets/AutoClaim_icon/No.svg";
// // import Select from 'react-select'
// // import type { DateValue } from "react-aria-components";
// // import { Clock, FileText, Mail, MoreVertical } from "lucide-react";
// // import { createHireDetails, fetchVehicleExtraData, getActualVehicleCategory, getAdminFeeType, getClientVehicleCategory, getHireDetails, updateHireDetails } from "../../../services/HireDetail/HireDetails";
// // import { BlueDropdownIndicator, customStyles } from "./GeneralDetailsForm";
// // import { getHireProvided } from "../../../services/HireVehicleProvided/HireVehicleProvided";
// // import { parseCalendarDateTimeStamp } from "../../../common/common";
// // import { getLocalTimeZone, today } from "@internationalized/date";
// // export const HireDetailsForm = ({ formRef }: any) => {
// //   const [isCrossHired, setIsCrossHired] = useState<boolean>(true);
// //   const [plateTransfer, setPlateTransfer] = useState<boolean>(true);
// //   const [isAbiInsurer, setIsAbiInsurer] = useState<boolean>(true);
// //     const claimId = localStorage.getItem("claimId");

// //   const [hireOutDate] = useState<DateValue | null>(today(getLocalTimeZone()));
// //       const [hireBackDate] = useState<DateValue | null>(null);
// //      const [isLoading, setIsLoading] = useState(false);
// //         const [adminFeeType, setAdminFeeType] = useState([]);
// //         const [adminFeeTypeLoading, setAdminFeeTypeLoading] = useState(false);const [actualVehicleCategory, setActualVehicleCategory] = useState([]);
// //       const [clientVehicleCategory, setClientVehicleCategory] = useState([]);
// //       useEffect(() => {
// //     fetchClientVehicleCategory();
// //     fetchActualVehicleCategory();
// //       }, [])
// //       const [activeVehicleTab, setActiveVehicleTab] = useState(0);

// //     const fetchClientVehicleCategory = async () => {
// //         try {
// //           const res = await getClientVehicleCategory();
// //           setClientVehicleCategory(res.data);
// //         } catch (e) {}
// //       };

// //       const fetchActualVehicleCategory = async () => {
// //         try {
// //           const res = await getActualVehicleCategory();
// //           setActualVehicleCategory(res.data);
// //         } catch (e) {}
// //       };
// //   const fetchAdminFeeType = async () => {
// //         try {
// //           const res = await getAdminFeeType();
// //           setAdminFeeType(res.data);
// //         } catch (e) {}
// //   };
// //   const formik = useFormik({
// //     initialValues: {
// //       thirdPartyVehicles: [
// //         {
// //           client_vehicle_category: "",
// //           actual_vehicle_category: "",
// //           reference: "",
// //           claim_id: claimId || 0,
// //           email_sent_date: "",
// //           accepted_sent_date: "",
// //           hireOutDate: hireOutDate,
// //           hireBackDate: hireBackDate,
// //           no_of_days_hired: 0,
// //           total_no_of_days_hired: 0,
// //           vehicle_file_reference: "",
// //           registration_number: "",
// //           make: "",
// //           model: "",
// //           abi_insured: "",
// //           admin_fee_type: "",
// //           hire_vehicle_provided_id: "",
// //           abi_hire_charge_per_day: "",
// //           extra_charge_per_day: 5,
// //           administration_fee: 37,
// //           bhr_hire_charge_per_day: "",
// //           bhr_extra_charge_per_day: 5,
// //           bhr_administration_fee: 60,
// //           cwd_per_day: 15,
// //           cwd_charge: 0,
// //           collection_and_delivery_fee: 60,
// //           total_abi_hire_charge: 0,
// //           total_bhr_charge: 0,
// //         },
// //       ],
// //     },
// //     validationSchema: Yup.object().shape({}),
// //     onSubmit: async (values: any) => {
// //       try {
// //                 const storedClaimId = claimId;
// //        const hireDetailsPayload = values.thirdPartyVehicles.map(
// //                  (vehicle, index) => {
// //                    const collectionFee = index === 0
// //                  ? parseFloat(vehicle.collection_and_delivery_fee) || 0
// //                  : 0;
// //                    // Calculate days to charge for each vehicle
// //                    const daysToCharge = vehicle.no_of_days_hired || 0;
// //                    const finalHireDays = vehicle.total_no_of_days_hired || 0;

// //                    // Calculate ABI total charge for each vehicle
// //                    const abiTotal = calculateTotalABIHireCharges(
// //                      parseFloat(vehicle.abi_hire_charge_per_day) || 0,
// //                      parseFloat(vehicle.extra_charge_per_day) || 0,
// //                      finalHireDays,
// //                      parseFloat(vehicle.administration_fee) || 0,
// //                      index
// //                    );

// //                    // Calculate CDW charge for each vehicle
// //                    const cwdTotal = calculateCDWCharges(
// //                      parseFloat(vehicle.cwd_per_day) || 15,
// //                      finalHireDays,
// //                      "hire_back"
// //                    );

// //                    // Calculate BHR total charge for each vehicle
// //                    const bhrTotal = calculateTotalBHRCharges(
// //                      parseFloat(vehicle.bhr_hire_charge_per_day) || 0,
// //                      parseFloat(vehicle.bhr_extra_charge_per_day) || 0,
// //                      finalHireDays,
// //                      parseFloat(vehicle.bhr_administration_fee) || 0,
// //                      parseFloat(vehicle.cwd_per_day) || 15,
// //                      // parseFloat(vehicle.collection_and_delivery_fee) || 0,
// //                      collectionFee,
// //                      index
// //                    );

// //                    return {
// //                      hire_out: formatDate(vehicle.hireOutDate),
// //                      hire_back: formatDate(vehicle.hireBackDate),

// //                      no_of_days_hire_so_far: daysToCharge,
// //                      final_total_no_of_hire_days: finalHireDays,

// //                      vehicle_file_reference: vehicle.vehicle_file_reference || "",
// //                      registration_number: vehicle.registration_number || "",
// //                      make: vehicle.make || "",
// //                      model: vehicle.model || "",
// //                      abi_insurer:
// //                        vehicle.abi_insured === "Yes" || vehicle.abi_insured === true
// //                          ? true
// //                          : false,

// //                      // ABI charges
// //                      abi_extra_charges_per_day: vehicle.extra_charge_per_day || 0,
// //                      admin_fee_id: vehicle.admin_fee_type || null,
// //                      abi_administration_fee: vehicle.administration_fee || 0,
// //                      total_abi_hire_charge: abiTotal || 0,

// //                      // BHR charges
// //                      bhr_extra_charges_per_day: vehicle.bhr_extra_charge_per_day || 0,
// //                      bhr_administration_fee: vehicle.bhr_administration_fee || 0,
// //                      cdw_charges: cwdTotal || 0,
// //                      // collection_delivery_fee: vehicle.collection_and_delivery_fee || 0,
// //                      collection_delivery_fee: collectionFee,
// //                      total_bhr_charges: bhrTotal || 0,

// //                      // Vehicle category references
// //                      client_vehicle_category_id:
// //                        vehicle.client_vehicle_category || null,
// //                      actual_vehicle_category_id:
// //                        vehicle.actual_vehicle_category || null,

// //                      hire_vehicle_provided_id: vehicle?.hire_vehicle_provided_id,
// //                      claim_id: storedClaimId || 0,
// //                    };
// //                  }
// //                );

// //                const payload = {
// //                  hire_details: hireDetailsPayload,
// //                };

// //                console.log("Submitting payload:", payload); // For debugging

// //                if (storedClaimId) {
// //                  await updateHireDetails(payload, storedClaimId);
// //                } else {
// //                  await createHireDetails(payload);
// //                }

// //                toast.success("Hire Details saved successfully");

// //       } catch (error) {
// //         toast.error("Error saving hire details");
// //         throw error;
// //       }
// //     },
// //   });
// //   useEffect(() => {
// //     if (formRef) {
// //       formRef.current = formik;
// //     }
// //   }, [formRef, formik]);

// //       useEffect(() => {
// //         const currentClaimId = claimId;
// //         if (!currentClaimId) return;

// //         setIsLoading(true);
// //         const loadData = async () => {
// //           try {
// //             const providedRes = await getHireProvided(currentClaimId);
// //             const hireProvided = Array.isArray(providedRes?.data)
// //               ? providedRes.data
// //               : [];

// //             let hireDetails: any[] = [];
// //             try {
// //               const detailsRes = await getHireDetails(currentClaimId);
// //               hireDetails = Array.isArray(detailsRes?.data?.hire_details)
// //                 ? detailsRes.data.hire_details
// //                 : [];

// //             } catch (err) {
// //               console.warn(
// //                 "⚠️ getHireDetails failed, continuing with empty list:",
// //                 err
// //               );
// //             }

// //             const populatedVehicles = await Promise.all(
// //               hireProvided.map(async (provItem: any, idx: number) => {
// //                 const matchedDetail = hireDetails[idx] || {};

// //                 const clientLabel =
// //                   matchedDetail.client_vehicle_category_id &&
// //                   clientVehicleCategory.find(
// //                     (c: any) => c.id === matchedDetail.client_vehicle_category_id
// //                   )?.label;

// //                 const actualLabel =
// //                   matchedDetail.actual_vehicle_category_id &&
// //                   actualVehicleCategory.find(
// //                     (c: any) => c.id === matchedDetail.actual_vehicle_category_id
// //                   )?.label;

// //                 const adminFeeLabel =
// //                   matchedDetail.admin_fee_id &&
// //                   adminFeeType.find(
// //                     (c: any) => c.id === matchedDetail.admin_fee_id
// //                   )?.label;

// //                 // Call API for each provItem.id
// //                 let extraData = {};
// //                 if (provItem.id) {
// //                   try {
// //                     const res = await fetchVehicleExtraData(provItem.id);
// //                     extraData = res.data || {};
// //                   } catch (err) {
// //                     console.error(
// //                       `Failed to fetch extra data for vehicle ${provItem.id}:`,
// //                       err
// //                     );
// //                   }
// //                 }

// //                 // Calculate hireOutDate and hireBackDate first
// //                 const hireOutDate = provItem.hire_start_date
// //                   ? parseCalendarDateTimeStamp(provItem.hire_start_date)
// //                   : parseCalendarDateTimeStamp(matchedDetail.hire_out) || null;

// //                 const hireBackDate =
// //                   provItem.hire_end_date != null
// //                     ? parseCalendarDateTimeStamp(provItem.hire_end_date)
// //                     : matchedDetail.hire_back
// //                     ? parseCalendarDateTimeStamp(matchedDetail.hire_back)
// //                     : null;

// //                 // 🧮 Calculate number of hire days
// //                 let no_of_days_hired = 0;
// //                 if (hireOutDate && hireBackDate) {
// //                   const diffMs =
// //                     new Date(hireBackDate).getTime() -
// //                     new Date(hireOutDate).getTime();
// //                   no_of_days_hired = Math.max(
// //                     Math.ceil(diffMs / (1000 * 60 * 60 * 24)) + 1
// //                   );
// //                 }

// //                 const total_no_of_days_hired = no_of_days_hired;

// //                 return {
// //                   registration_number: provItem.hire_vehicle_registration || "",
// //                   make: provItem.make || matchedDetail.make || "",
// //                   model: provItem.model || matchedDetail.model || "",
// //                   hireOutDate,
// //                   hireBackDate,

// //                   no_of_days_hired,
// //                   total_no_of_days_hired,

// //                   abi_insured: matchedDetail.abi_insurer || false,
// //                   claim_id: matchedDetail.claim_id || currentClaimId,

// //                   client_vehicle_category:
// //                     matchedDetail.client_vehicle_category_id || "",
// //                   client_vehicle_category_label: clientLabel || "",

// //                   actual_vehicle_category:
// //                     matchedDetail.actual_vehicle_category_id || "",
// //                   actual_vehicle_category_label: actualLabel || "",

// //                   admin_fee_type: matchedDetail.admin_fee_id || "",
// //                   admin_fee_type_label: adminFeeLabel || "",

// //                   abi_hire_charge_per_day: parseFloat(
// //                     extraData.abi_hire_charge_per_day || ""
// //                   ),
// //                   extra_charge_per_day: parseFloat(
// //                     matchedDetail.abi_extra_charges_per_day || 5
// //                   ),
// //                   administration_fee: parseFloat(
// //                     matchedDetail.abi_administration_fee || 37
// //                   ),

// //                   bhr_hire_charge_per_day: parseFloat(
// //                     extraData.bhr_hire_per_day || ""
// //                   ),
// //                   bhr_extra_charge_per_day: parseFloat(
// //                     matchedDetail.bhr_extra_charges_per_day || 5
// //                   ),
// //                   bhr_administration_fee: parseFloat(
// //                     matchedDetail.bhr_administration_fee || 60
// //                   ),

// //                   cwd_per_day: 15,
// //                   cwd_charge: parseFloat(matchedDetail.cdw_charges || 15),
// //                   // collection_and_delivery_fee: parseFloat(
// //                   //   matchedDetail.collection_delivery_fee || 60
// //                   // ),
// //                   collection_and_delivery_fee: idx === 0
// //           ? parseFloat(matchedDetail.collection_delivery_fee || 60)
// //           : 0,
// //                   total_abi_hire_charge: parseFloat(
// //                     matchedDetail.total_abi_hire_charge || 0
// //                   ),
// //                   total_bhr_charge: parseFloat(
// //                     matchedDetail.total_bhr_charges || 0
// //                   ),

// //                   reference: matchedDetail.reference || "",
// //                   hire_vehicle_provided_id: provItem.id,
// //                   vehicle_file_reference:
// //                     matchedDetail.vehicle_file_reference || "",

// //                   // Merge extra data from API
// //                   ...extraData,
// //                 };
// //               })
// //             );

// //             if (populatedVehicles.length === 0) {
// //               populatedVehicles.push({
// //                 registration_number: "",
// //                 make: "",
// //                 model: "",
// //                 hireOutDate: null,
// //                 hireBackDate: null,
// //                 no_of_days_hired: 0,
// //                 total_no_of_days_hired: 0,
// //                 abi_insured: false,
// //                 client_vehicle_category: "",
// //                 actual_vehicle_category: "",
// //                 admin_fee_type: "",
// //                 abi_hire_charge_per_day: "",
// //                 extra_charge_per_day: 5,
// //                 administration_fee: 37,
// //                 bhr_hire_charge_per_day: "",
// //                 bhr_extra_charge_per_day: 5,
// //                 bhr_administration_fee: 60,
// //                 cwd_charge: 15,
// //                 collection_and_delivery_fee: 60,
// //                 total_abi_hire_charge: 0,
// //                 total_bhr_charge: 0,
// //                 reference: "",
// //                 vehicle_file_reference: "",
// //               });
// //             }

// //             setInitialValues((prev) => ({
// //               ...prev,
// //               thirdPartyVehicles: populatedVehicles,
// //             }));
// //           } catch (error) {
// //             console.error("❌ Failed to fetch hire data:", error);
// //           } finally {
// //             setIsLoading(false);
// //           }
// //         };

// //         loadData();
// //       }, [
// //         claimId,
// //         clientVehicleCategory,
// //         actualVehicleCategory,
// //         adminFeeType,
// //       ]);

// //       const formatDate = (val: string | Date | null) => {
// //         if (!val) return null;
// //         const d = new Date(val);
// //         return d.toISOString().split("T")[0];
// //       };
// //   return (
// //     <div className="MainContent w-[788px] ms-[140px] flex-1 flex flex-col gap-6 p-8 overflow-y-auto scrollbar-hide font-['Stack_Sans_Headline'] ">
// //       <div className="flex justify-between">
// //         <h1 className="text-black text-2xl font-weight-600 font-['Stack_Sans_Headline']">
// //           Hire Details{" "}
// //         </h1>
// //         <button className="h-8 px-3 py-2 bg-blue-50 rounded flex items-center gap-2.5 text-blue-600 hover:bg-blue-100 transition-colors">
// //           <Clock size={16} className="text-blue-600" />
// //           <span className="text-sm font-normal">Provision Log</span>
// //         </button>
// //       </div>
// //       {/* Vehicle Summary Banner */}
// //       <div className="w-full p-5 bg-blue-50 rounded-lg flex justify-between items-center gap-4">
// //         <div className="flex-1 flex flex-col gap-1">
// //           <div className="text-black text-xl font-weight-600 leading-5">
// //             Vehicle1
// //           </div>
// //           <div className="text-slate-600 text-sm font-weight-400">Reg#</div>
// //         </div>
// //         <div className="flex items-center gap-4">
// //           <button className="h-8 px-3 py-2 rounded flex items-center gap-2 text-blue-500 hover:bg-white transition-all">
// //             <FileText size={16} />
// //             <span className="text-sm">View Docs</span>
// //           </button>
// //           <button className="h-8 px-3 py-2 rounded flex items-center gap-2 text-blue-500 hover:bg-white transition-all">
// //             <Mail size={16} />
// //             <span className="text-sm">Send Email</span>
// //           </button>
// //         </div>
// //       </div>

// //       {/* Vehicle Category Section */}
// //       <SectionWrapper title="Vehicle Category">
// //         <div className="flex gap-5">
// //           <Dropdown
// //             label="Client Vehicle Category"
// //             placeholder="Select Category"
// //             options={clientVehicleCategory}
// //             onChange={}
// //           />
// //           <Dropdown
// //             label="Actual Vehicle Category"
// //             placeholder="Select Category"
// //             options={actualVehicleCategory}
// //             onChange={}
// //           />
// //         </div>
// //       </SectionWrapper>

// //       {/* Hire Vehicle Provision Section */}
// //       <SectionWrapper
// //         title="Hire Vehicle Provision"
// //         actionIcon={<MoreVertical size={20} className="text-blue-600" />}
// //       >
// //         <div className="flex gap-5 flex-wrap mb-5">
// //           <RadioGroup
// //             label="Has this Hire Vehicle been Cross-Hired to us?"
// //             name="cross-hire"
// //             value={isCrossHired}
// //             onChange={setIsCrossHired}
// //           />
// //           <Dropdown label="Hire Vehicle Status" placeholder="Select Category" />
// //         </div>

// //         <div className="grid grid-cols-2 gap-5 mb-5">
// //           <InputField label="File Reference Number" placeholder="Ref Number" />
// //           <InputField label="Registration Number" placeholder="Reg Number" />
// //           <InputField label="Make" placeholder="Enter Make" />
// //           <InputField label="Model" placeholder="Enter Model" />
// //         </div>

// //         <div className="grid grid-cols-2 gap-5 mb-5">
// //           <RadioGroup
// //             label="Plate Transfer"
// //             name="plate-transfer"
// //             value={plateTransfer}
// //             onChange={setPlateTransfer}
// //           />
// //           <InputField label="Fuel Type" placeholder="Enter Type" />
// //         </div>

// //         <div className="grid grid-cols-2 gap-5">
// //           <DatePicker label="Hire Start Date" />
// //           <DatePicker label="Hire End Date" />
// //         </div>
// //       </SectionWrapper>

// //       {/* Hire Period Section */}
// //       <SectionWrapper title="Hire Period">
// //         <div className="grid grid-cols-2 gap-5 mb-5">
// //           <DatePicker label="Hire Out Date & Time" />
// //           <DatePicker label="Hire Back Date & Time" />
// //           <InputField label="Number of Days Hire So Far" placeholder="0" />
// //           <InputField label="Final Total Number of Hire Days" placeholder="0" />
// //         </div>
// //       </SectionWrapper>

// //       {/* ABI Hire Charges Section */}
// //       <SectionWrapper title="ABI Hire Charges">
// //         <div className="mb-5">
// //           <RadioGroup
// //             label="ABI Insurer?"
// //             name="abi-insurer"
// //             value={isAbiInsurer}
// //             onChange={setIsAbiInsurer}
// //           />
// //         </div>
// //         <div className="grid grid-cols-2 gap-5 mb-5">
// //           <InputField label="ABI Hire Charge Per Day" value="£250" />
// //           <InputField label="Extra Charges Per Day" value="£5" />
// //           <Dropdown label="Admin Fee Type" placeholder="Select Category" options={adminFeeType} onChange={()=>formik.setFieldValue(adminFeeType,)}/>
// //           <InputField label="Administration Fee" value="£250" />
// //           <InputField label="Total ABI Hire Charges" value="£250" />
// //         </div>
// //       </SectionWrapper>
// //       {/* BHR Hire Charges Section */}
// //       <SectionWrapper title="BHR Hire Charges & Administration Fee Details">
// //         <div className="grid grid-cols-2 gap-5 mb-5">
// //           <InputField label="BHR Hire Charge Per Day" value="£250" />
// //           <InputField label="Extra Charges Per Day" value="£5" />
// //         </div>

// //         <div className="grid grid-cols-2 gap-5 mb-5">
// //           <InputField label="Administration Fee" value="£250" />
// //           <InputField label="CDW Charges" value="£250" />
// //         </div>

// //         <div className="grid grid-cols-2 gap-5">
// //           <InputField label="Collection & Delivery Fee" value="£250" />
// //           <InputField
// //             label="Total BHR Charges"
// //             value="£250"
// //             // You might want to add a specific class here if this is a calculated total
// //             // className="bg-slate-50 font-weight-600"
// //           />
// //         </div>
// //       </SectionWrapper>
// //     </div>
// //   );
// // };

// // /**
// //  * Reusable Sub-components
// //  */

// // const SectionWrapper: React.FC<{
// //   title: string;
// //   children: React.ReactNode;
// //   actionIcon?: React.ReactNode;
// // }> = ({ title, children, actionIcon }) => (
// //   <div className="w-full p-5 rounded-lg border border-slate-100 flex flex-col gap-4">
// //     <div className="flex justify-between items-center w-full">
// //       <h3 className="text-black text-xl font-weight-600 leading-5">{title}</h3>
// //       {actionIcon}
// //     </div>
// //     <div className="w-full h-px bg-slate-100" />
// //     <div className="pt-2">{children}</div>
// //   </div>
// // );

// // const InputField: React.FC<{
// //   label: string;
// //   placeholder?: string;
// //   value?: string;
// // }> = ({ label, placeholder, value }) => (
// //   <div className="flex flex-col gap-2 w-full">
// //     <label className="text-slate-700 text-sm font-weight-400">{label}</label>
// //     <input
// //       type="text"
// //       defaultValue={value}
// //       placeholder={placeholder}
// //       className="px-5 py-3 bg-white border border-slate-200 rounded text-base font-light focus:outline-blue-500 placeholder:text-slate-300"
// //     />
// //   </div>
// // );

// // const Dropdown: React.FC<{
// //   label: string;
// //   placeholder: string;
// //   options:any;
// //   onChange:any;
// // }> = ({ label, placeholder, options, onChange }) => (
// //   <div className="flex flex-col gap-2 w-full max-w-[384px]">
// //     <label className="text-gray-700 text-sm font-weight-400">{label}</label>
// //     <Select
// //       options={options}
// //       // value={options.find(
// //       //   (option) => option.value === formik.values.weather,
// //       // )}
// //     onChange={onChange}
// //       placeholder={placeholder}
// //       styles={customStyles} // Using your predefined styles
// //       components={{
// //         DropdownIndicator: BlueDropdownIndicator, // Using your custom blue arrow
// //         IndicatorSeparator: () => null, // Removes the vertical line for a cleaner look
// //       }}
// //       isSearchable={false}
// //       classNamePrefix="react-select"
// //     />
// //   </div>
// // );

// // const DatePicker: React.FC<{ label: string }> = ({ label }) => (
// //   <div className="flex flex-col gap-2 w-full">
// //     <label className="text-slate-700 text-sm font-weight-400">{label}</label>
// //     <div className="px-5 py-3 bg-white border border-slate-200 rounded flex justify-between items-center cursor-pointer">
// //       <span className="text-slate-300 text-base font-light">Date</span>
// //       <img src={Vector6} alt="" />
// //     </div>
// //   </div>
// // );

// // const RadioGroup: React.FC<{
// //   label: string;
// //   name: string;
// //   value: boolean;
// //   onChange: (v: boolean) => void;
// // }> = ({ label, name, value, onChange }) => (
// //   <div className="flex flex-col gap-5 w-full max-w-[384px]">
// //     <label className="text-black text-sm font-weight-400">{label}</label>
// //     <div className="flex gap-5">
// //       <label className="flex items-center gap-2 cursor-pointer">
// //         <div className="relative flex items-center justify-center">
// //           <input
// //             type="radio"
// //             name={name}
// //             checked={value === true}
// //             onChange={() => onChange(true)}
// //             className="sr-only"
// //           />

// //           {value === true ? <img src={Yes}/>: <img src={No}/>}
// //         </div>
// //         <span className="text-sm">Yes</span>
// //       </label>
// //       <label className="flex items-center gap-2 cursor-pointer">
// //         <div className="relative flex items-center justify-center">
// //           <input
// //             type="radio"
// //             name={name}
// //             checked={value === false}
// //             onChange={() => onChange(false)}
// //             className="sr-only"
// //           />
// //           {value === false ? <img src={Yes} /> : <img src={No} />}
// //         </div>
// //         <span className="text-sm">No</span>
// //       </label>
// //     </div>
// //   </div>
// // );

// import { useEffect, useRef, useState } from "react";
// import { toast } from "react-toastify";
// import * as Yup from "yup";
// import { useFormik } from "formik";
// import Select from "react-select";
// import { Clock, FileText, Mail, MoreVertical } from "lucide-react";
// import { today, getLocalTimeZone } from "@internationalized/date";

// // Assets & Icons
// import Vector6 from "../../../assets/AutoClaim_icon/Vector-6.svg";
// import Yes from "../../../assets/AutoClaim_icon/Yes.svg";
// import No from "../../../assets/AutoClaim_icon/No.svg";

// // Services & Components
// import {
//   createHireDetails,
//   updateHireDetails,
//   getActualVehicleCategory,
//   getClientVehicleCategory,
//   getAdminFeeType,
//   getHireDetails,
//   fetchVehicleExtraData,
// } from "../../../services/HireDetail/HireDetails";
// import { createHireProvided, getHireProvided, getHireVehicleStatus, updateHireProvided } from "../../../services/HireVehicleProvided/HireVehicleProvided";
// import { BlueDropdownIndicator, customStyles } from "./GeneralDetailsForm";
// import { CustomDatePicker } from "../Components/DatePicker";
// import { parseCalendarDateTimeStamp } from "../../../common/common";

// export const HireDetailsForm = ({ formRef }: any) => {
//   const claimId = localStorage.getItem("claimId");
//   const [isLoading, setIsLoading] = useState(false);
//   const [adminFeeType, setAdminFeeType] = useState([]);
//   const [actualVehicleCategory, setActualVehicleCategory] = useState([]);
//   const [clientVehicleCategory, setClientVehicleCategory] = useState([]);
//   const [activeVehicleTab, setActiveVehicleTab] = useState(0);
//   const hireOutRef = useRef<HTMLDivElement>(null);
//   const hireBackRef = useRef<HTMLDivElement>(null);
//   const [showHireBackPicker, setShowHireBackPicker] = useState(false);
//   const [showHireOutPicker, setShowHireOutPicker] = useState(false);
//       const [vehicleStatus, setVehicleStatus] = useState([]);
//       useEffect(() => {
//         getHireVehicleStatus().then((res) => {
//           if (res.data && Array.isArray(res.data)) {
//             const formattedOptions = res.data.map((item) => ({
//               label: item.label,
//               value: item.id,
//             }));
//             setVehicleStatus(formattedOptions);
//           }
//         });
//       }, []);
  
//   const [checkOutModal, setCheckoutModal] = useState<boolean>(false)
//     const [switchVehicle, setSwitchVehicle] = useState(false);
//     const items = [
//       {
//         label: "Inst Fleet to On Hire",
//         email: "fleet@example.com",
//         activity: "Instruction sent: On Hire",
//         description: "Email to Fleet with claim + vehicle details",
//       },
//       {
//         label: "Inst Fleet to Off Hire",
//         email: "fleet@example.com",
//         activity: "Instruction sent: Off Hire",
//         description: "Email to Fleet",
//       },
//       {
//         label: "Hire Vehicle Check Sheet",
//         email: "fleet@example.com",
//         description: "Email with checklist link or attachment",
//       },
//       {
//         label: "Recovery & Storage",
//         email: "recovery@example.com",
//         description: "Email to recovery partner with pickup details",
//       },
//       {
//         label: "Mitigation Questionnaire",
//         email: "hirer@example.com",
//         description: "Email to hirer with secure form link",
//       },
//       {
//         label: "Hire Documentation",
//         email: "docs@example.com",
//         description: "Email with required document links/list",
//       },
//       {
//         label: "Fee Exemption Form",
//         email: "docs@example.com",
//         description: "Email with form link",
//       },
//     ];
//     const defaultVehicle = {
//       client_vehicle_category_id: "",
//       actual_vehicle_category_id: "",
//       cross_hired: false,
//       hire_vehicle_status_id: "",
//       hire_vehicle_registration: "",
//       make: "",
//       provider_name: "",
//       rate: null,
//       contact_number: "",
//       model: "",
//       hire_start_date: null,
//       hire_end_date: null,
//       fuel_type: "",
//       plate_transfer: false,
//     };
//   const [formData, setFormData] = useState({
//     interiorCleanCheckOut: "",
//     interiorCleanCheckIn: "",
//     interiorDamage: false,
//     interiorDamageDescription: "",
//     interiorPhotos: [],
//     applyDamageCharges: "",
//     exteriorCleanCheckOut: "",
//     exteriorCleanCheckIn: "",
//     exteriorDamage: false,
//     petrolChargeAmount: "",
//     exteriorDamageDescription: "",
//     exteriorPhotos: [],
//     petrolCheckoutCharge: "",
//     petrolChargeReason: "",
//     damageCharges: "",
//     damageChargesPaidNow: 0,
//     damageNotes: "",
//     valetCharge: 0,
//   });
//   useEffect(() => {
//     const handleClickOutside = (event: MouseEvent) => {
//       if (
//         hireOutRef.current &&
//         !hireOutRef.current.contains(event.target as Node)
//       )
//         setShowHireOutPicker(false);
//       if (
//         hireBackRef.current &&
//         !hireBackRef.current.contains(event.target as Node)
//       )
//         setShowHireBackPicker(false);
//     };
//     // document.addEventListener("mousedown", handleClickOutside);
//     return () => document.removeEventListener("mousedown", handleClickOutside);
//   }, []);
//   // 1. Initialize Formik
//   const formik = useFormik({
//     initialValues: {
//       // Section B data (Calculations & Hire Charges)
//       thirdPartyVehicles: [
//         {
//           client_vehicle_category:"",
//           actual_vehicle_category: "",
//           abi_hire_charge_per_day: 0,
//           extra_charge_per_day: 5,
//           administration_fee: 37,
//           bhr_hire_charge_per_day: 0,
//           bhr_extra_charge_per_day: 5,
//           bhr_administration_fee: 60,
//           cdw_per_day: 15,
//           collection_and_delivery_fee: 60,
//           no_of_days_hired: 0,
//           total_no_of_days_hired: 0,
//           total_abi_hire_charge: 0,
//           total_bhr_charge: 0,
//           hireOutDate: today(getLocalTimeZone()),
//           hireBackDate: null,

//           // Section A data (Hire Vehicle Provision) integrated here
//           cross_hired: false,
//           hire_vehicle_status_id: "",
//           hire_vehicle_registration: "",
//           make: "",
//           model: "",
//           provider_name: "", // Used for File Reference Number
//           fuel_type: "",
//           plate_transfer: false,
//         },
//       ],
//     },
//     validationSchema: Yup.object().shape({
//       thirdPartyVehicles: Yup.array().of(
//         Yup.object().shape({
//           actual_vehicle_category: Yup.string().required("Required"),
//         }),
//       ),
//     }),
//     onSubmit: async (values) => {
//       const currentClaimId = claimId;
//       const hireId = localStorage.getItem("hireId");
//       const hireProvidedId = localStorage.getItem("hireProvidedId");

//       const index = activeVehicleTab;
//       const currentVehicle = values.thirdPartyVehicles[index];

//       try {
//         // --- 1. PAYLOAD FOR HIRE CHARGES (Financials) ---
//         const chargesPayload = {
//           hire_details: values.thirdPartyVehicles.map((v) => ({
//             ...v,
//             claim_id: currentClaimId,
//             hire_out: v.hireOutDate?.toString(),
//             hire_back: v.hireBackDate?.toString(),
//           })),
//         };

//         // --- 2. PAYLOAD FOR HIRE PROVIDED (Section A & B) ---
//         const provisionPayload = {
//           claim_id: currentClaimId,
//           section_a: {
//             // inst_fleet_on_hire: formData.inst_fleet_on_hire,
//             // inst_fleet_off_hire: formData.inst_fleet_off_hire,
//             // hire_vehicle_check_sheet: formData.hire_vehicle_check_sheet,
//             // recovery_storage: formData.recovery_storage,
//             // mitigation_questionnaire: formData.mitigation_questionnaire,
//             // hire_documentation: formData.hire_documentation,
//             // fee_exemption_form: formData.fee_exemption_form,
//             // send_licensing_document_account: formData.send_licensing_document_account,
//             // request_updated_insurance_schedule:
//             //   formData.request_updated_insurance_schedule,
//             // raise_authority_letter: formData.raise_authority_letter,
//           },
//           section_b: values.thirdPartyVehicles.map((v: any) => ({
//             ...v,
//             cross_hire: v.cross_hired ? 1 : 0,
//             plate_transfer: v.plate_transfer ? 1 : 0,
//             hire_start_date: formatCalendarDate(v.hireOutDate),
//             hire_end_date: formatCalendarDate(v.hireBackDate),
//             rate: v.abi_hire_charge_per_day
//               ? parseFloat(v.abi_hire_charge_per_day)
//               : null,
//           })),
//         };
//         // --- 3. CALL SEPARATE APIS ---
//         // Using Promise.all so they run in parallel; both must succeed
//         await Promise.all([
//           // API 1: Hire Details (Charges)
//           currentClaimId && hireId
//             ? updateHireDetails(chargesPayload, currentClaimId)
//             : createHireDetails(chargesPayload),

//           // API 2: Hire Provided (Vehicle Provision)
//           claimId && hireProvidedId
//             ? updateHireProvided(
//                 currentClaimId,
//                 provisionPayload,
//                 switchVehicle,
//               )
//             : createHireProvided(
//                 currentClaimId,
//                 provisionPayload,
//                 switchVehicle,
//               ),
//         ]);

//         toast.success(
//           "All hire details and provision information saved successfully",
//         );
//         localStorage.setItem("hireId", res1.id);
//         localStorage.setItem("hireProvidedId", res2.id);
//       } catch (error) {
//         toast.error("Error saving hire information");
//         throw error;
//       }
//     },
//   });
// useEffect(() => {
//   const currentClaimId = claimId;
//   if (!currentClaimId) return;

//   const loadUnifiedData = async () => {
//     setIsLoading(true);
//     try {
//       // 1. Fetch both data sources in parallel
//       const [providedRes, detailsRes] = await Promise.all([
//         getHireProvided(currentClaimId),
//         getHireDetails(currentClaimId).catch((err) => {
//           console.warn("⚠️ getHireDetails failed, using empty defaults", err);
//           return { data: { hire_details: [] } };
//         }),
//       ]);

//       const hireProvided = Array.isArray(providedRes?.data)
//         ? providedRes.data
//         : [];
//       const hireDetails = Array.isArray(detailsRes?.data?.hire_details)
//         ? detailsRes.data.hire_details
//         : [];

//       // 2. Map and Merge Data
//       const populatedVehicles = await Promise.all(
//         hireProvided.map(async (provItem: any, idx: number) => {
//           const matchedDetail = hireDetails[idx] || {};

//           // Lookups for labels
//           const clientLabel =
//             clientVehicleCategory.find(
//               (c: any) =>
//                 c.id ===
//                 (matchedDetail.client_vehicle_category_id ||
//                   provItem.client_vehicle_category_id),
//             )?.label || "";
//           const actualLabel =
//             actualVehicleCategory.find(
//               (c: any) =>
//                 c.id ===
//                 (matchedDetail.actual_vehicle_category_id ||
//                   provItem.actual_vehicle_category_id),
//             )?.label || "";
//           const adminFeeLabel =
//             adminFeeType.find((c: any) => c.id === matchedDetail.admin_fee_id)
//               ?.label || "";

//           // Fetch extra daily rates based on the Actual Category ID
//           let extraRates = { abi_hire_charge_per_day: 0, bhr_hire_per_day: 0 };
//           const categoryId =
//             provItem.actual_vehicle_category_id ||
//             matchedDetail.actual_vehicle_category_id;
//           if (categoryId) {
//             try {
//               const res = await fetchVehicleExtraData(categoryId);
//               extraRates = res.data || extraRates;
//             } catch (err) {
//               console.error(
//                 `Failed to fetch rates for category ${categoryId}`,
//                 err,
//               );
//             }
//           }

//           // Date Parsing
//           const hireOutDate = provItem.hire_start_date
//             ? parseCalendarDateTimeStamp(provItem.hire_start_date)
//             : matchedDetail.hire_out
//               ? parseCalendarDateTimeStamp(matchedDetail.hire_out)
//               : null;
//           const hireBackDate = provItem.hire_end_date
//             ? parseCalendarDateTimeStamp(provItem.hire_end_date)
//             : matchedDetail.hire_back
//               ? parseCalendarDateTimeStamp(matchedDetail.hire_back)
//               : null;

//           // 🧮 Calculate Days So Far vs Final Days
//           const startDate = hireOutDate
//             ? new Date(hireOutDate.toString())
//             : null;
//           const today = new Date();

//           let daysSoFar = 0;
//           if (startDate) {
//             const diffSoFar = today.getTime() - startDate.getTime();
//             daysSoFar = Math.max(
//               0,
//               Math.ceil(diffSoFar / (1000 * 60 * 60 * 24)),
//             );
//           }

//           let totalFinalDays = 0;
//           if (startDate && hireBackDate) {
//             const endDate = new Date(hireBackDate.toString());
//             const diffFinal = endDate.getTime() - startDate.getTime();
//             totalFinalDays = Math.max(
//               0,
//               Math.ceil(diffFinal / (1000 * 60 * 60 * 24)) + 1,
//             );
//           }

//           return {
//             // Provisioning Fields
//             id: provItem.id,
//             hire_vehicle_registration: provItem.hire_vehicle_registration || "",
//             make: provItem.make || matchedDetail.make || "",
//             model: provItem.model || matchedDetail.model || "",
//             fuel_type: provItem.fuel_type || "",
//             cross_hired: !!provItem.cross_hire,
//             plate_transfer: !!provItem.plate_transfer,
//             hire_vehicle_status_id: provItem.hire_vehicle_status_id || "",
//             provider_name: provItem.provider_name || "", // File Reference

//             // Date Fields
//             hireOutDate,
//             hireBackDate,
//             no_of_days_hired: daysSoFar, // Days So Far
//             total_no_of_days_hired: totalFinalDays, // Final Total

//             // Category & Labels
//             client_vehicle_category:
//               matchedDetail.client_vehicle_category_id ||
//               provItem.client_vehicle_category_id ||
//               "",
//             client_vehicle_category_label: clientLabel,
//             actual_vehicle_category:
//               matchedDetail.actual_vehicle_category_id ||
//               provItem.actual_vehicle_category_id ||
//               "",
//             actual_vehicle_category_label: actualLabel,

//             // Financial Fields (ABI)
//             abi_insured: matchedDetail.abi_insurer || false,
//             abi_hire_charge_per_day: extraRates.abi_hire_charge_per_day || 0,
//             extra_charge_per_day: parseFloat(
//               matchedDetail.abi_extra_charges_per_day || 5,
//             ),
//             administration_fee: parseFloat(
//               matchedDetail.abi_administration_fee || 37,
//             ),
//             total_abi_hire_charge: parseFloat(
//               matchedDetail.total_abi_hire_charge || 0,
//             ),

//             // Financial Fields (BHR)
//             bhr_hire_charge_per_day: extraRates.bhr_hire_per_day || 0,
//             bhr_extra_charge_per_day: parseFloat(
//               matchedDetail.bhr_extra_charges_per_day || 5,
//             ),
//             bhr_administration_fee: parseFloat(
//               matchedDetail.bhr_administration_fee || 60,
//             ),
//             cdw_per_day: 15,
//             collection_and_delivery_fee:
//               idx === 0
//                 ? parseFloat(matchedDetail.collection_delivery_fee || 60)
//                 : 0,
//             total_bhr_charge: parseFloat(matchedDetail.total_bhr_charges || 0),

//             admin_fee_type: matchedDetail.admin_fee_id || "",
//             admin_fee_type_label: adminFeeLabel,
//           };
//         }),
//       );

//       // 3. Fallback for Empty State
//       if (populatedVehicles.length === 0) {
//         populatedVehicles.push({
//           ...defaultVehicle, // Spread your default object
//           no_of_days_hired: 0,
//           total_no_of_days_hired: 0,
//           extra_charge_per_day: 5,
//           administration_fee: 37,
//           bhr_extra_charge_per_day: 5,
//           bhr_administration_fee: 60,
//           cdw_per_day: 15,
//           collection_and_delivery_fee: 60,
//         });
//       }

//       formik.setValues({ thirdPartyVehicles: populatedVehicles });
//       // Handle Tab Visibility logic (if hire_end_date exists, show the end-hire fields)
//       const endHireTabs = populatedVehicles.reduce((acc: any, v, idx) => {
//         acc[idx] = !!v.hireBackDate;
//         return acc;
//       }, {});
//       setShowEndHireTabs(endHireTabs);
//     } catch (error) {
//       console.error("❌ Failed to unify hire data:", error);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   loadUnifiedData();
// }, [claimId, clientVehicleCategory, actualVehicleCategory, adminFeeType]);

//   // 2. Business Logic: Calculations
//   useEffect(() => {
//     const vehicle = formik.values.thirdPartyVehicles[activeVehicleTab];
//     if (!vehicle || !vehicle.hireOutDate) return;

//     const startDate = new Date(vehicle.hireOutDate.toString());
//     const today = new Date();

//     // 1. Calculate "Number of Days Hire So Far" (From Start to Today)
//     const diffSoFar = today.getTime() - startDate.getTime();
//     const daysSoFar = Math.max(0, Math.ceil(diffSoFar / (1000 * 60 * 60 * 24)));

//     // 2. Calculate "Final Total Number of Hire Days" (From Start to End Date)
//     let finalDays = 0;
//     if (vehicle.hireBackDate) {
//       const endDate = new Date(vehicle.hireBackDate.toString());
//       const diffFinal = endDate.getTime() - startDate.getTime();
//       // +1 usually accounts for including the final day of hire
//       finalDays = Math.max(0, Math.ceil(diffFinal / (1000 * 60 * 60 * 24)) + 1);
//     }

//     // 3. Calculation Formulas based on Final Days
//     const abiRate = Number(vehicle.abi_hire_charge_per_day) || 0;
//     const bhrRate = Number(vehicle.bhr_hire_charge_per_day) || 0;
//     const extra = Number(vehicle.extra_charge_per_day) || 0;

//     // ABI: ((Charge + Extra) * Days) + Admin Fee
//     const abiTotal =
//       (abiRate + extra) * finalDays + Number(vehicle.administration_fee);

//     // BHR: ((Charge + Extra) * Days) + Admin + (CDW * Days) + Collection
//     const cdwTotal = Number(vehicle.cdw_per_day) * finalDays;
//     const bhrTotal =
//       (bhrRate + extra) * finalDays +
//       Number(vehicle.bhr_administration_fee) +
//       cdwTotal +
//       Number(vehicle.collection_and_delivery_fee);

//     // Update Formik state
//     formik.setFieldValue(
//       `thirdPartyVehicles[${activeVehicleTab}].no_of_days_hired`,
//       daysSoFar,
//     );
//     formik.setFieldValue(
//       `thirdPartyVehicles[${activeVehicleTab}].total_no_of_days_hired`,
//       finalDays,
//     );
//     formik.setFieldValue(
//       `thirdPartyVehicles[${activeVehicleTab}].total_abi_hire_charge`,
//       abiTotal.toFixed(2),
//     );
//     formik.setFieldValue(
//       `thirdPartyVehicles[${activeVehicleTab}].total_bhr_charge`,
//       bhrTotal.toFixed(2),
//     );
//   }, [
//     formik.values.thirdPartyVehicles[activeVehicleTab]?.hireOutDate,
//     formik.values.thirdPartyVehicles[activeVehicleTab]?.hireBackDate,
//     formik.values.thirdPartyVehicles[activeVehicleTab]?.abi_hire_charge_per_day,
//     formik.values.thirdPartyVehicles[activeVehicleTab]?.bhr_hire_charge_per_day,
//     formik.values.thirdPartyVehicles[activeVehicleTab]?.extra_charge_per_day,
//   ]);
//   // 3. Data Fetching
//   useEffect(() => {
//     const fetchLookups = async () => {
//       const [clientRes, actualRes, adminRes] = await Promise.all([
//         getClientVehicleCategory(),
//         getActualVehicleCategory(),
//         getAdminFeeType(),
//       ]);
//       setClientVehicleCategory(
//         clientRes.data.map((i: any) => ({ value: i.id, label: i.label })),
//       );
//       setActualVehicleCategory(
//         actualRes.data.map((i: any) => ({
//           value: i.id,
//           label: i.label,
//           abi_rate: i.abi_rate,
//           bhr_rate: i.bhr_rate,
//           valet_rate: i.valet_rate,
//         })),
//       );
//       setAdminFeeType(
//         adminRes.data.map((i: any) => ({ value: i.id, label: i.label })),
//       );
//     };
//     fetchLookups();
//   }, []);

//   useEffect(() => {
//     if (formRef) formRef.current = formik;
//   }, [formik]);
//   useEffect(() => {
//     const vehicle = formik.values.thirdPartyVehicles[activeVehicleTab];
//     const days = vehicle.no_of_days_hired || 0;

//     const abiTotal =
//       (Number(vehicle.abi_hire_charge_per_day) +
//         Number(vehicle.extra_charge_per_day)) *
//         days +
//       Number(vehicle.administration_fee);
//     const bhrTotal =
//       (Number(vehicle.bhr_hire_charge_per_day) +
//         Number(vehicle.bhr_extra_charge_per_day)) *
//         days +
//       Number(vehicle.bhr_administration_fee);

//     formik.setFieldValue(
//       `thirdPartyVehicles[${activeVehicleTab}].total_abi_hire_charge`,
//       abiTotal.toFixed(2),
//     );
//     formik.setFieldValue(
//       `thirdPartyVehicles[${activeVehicleTab}].total_bhr_charge`,
//       bhrTotal.toFixed(2),
//     );
//   }, [
//     formik.values.thirdPartyVehicles[activeVehicleTab]?.abi_hire_charge_per_day,
//     formik.values.thirdPartyVehicles[activeVehicleTab]?.bhr_hire_charge_per_day,
//     formik.values.thirdPartyVehicles[activeVehicleTab]?.no_of_days_hired,
//   ]);
//   const currentVehicle = formik.values.thirdPartyVehicles[activeVehicleTab];
//   console.log(currentVehicle);
//   return (
//     <div className="MainContent w-[788px] ms-[140px] flex-1 flex flex-col gap-6 p-8 overflow-y-auto scrollbar-hide font-['Stack_Sans_Headline']">
//       {/* {checkOutModal &&
//         <CheckOutModal formData={formData} setFormData={setFormData} />
//       } */}
//       <div className="flex justify-between">
//         <h1 className="text-black text-2xl font-weight-600">Hire Details</h1>
//         <button className="h-8 px-3 py-2 bg-blue-50 rounded flex items-center gap-2.5 text-blue-600">
//           <Clock size={16} /> <span className="text-sm">Provision Log</span>
//         </button>
//       </div>

//       <SectionWrapper title="Vehicle Category">
//         <div className="flex gap-5">
//           <Dropdown
//             label="Client Vehicle Category"
//             options={clientVehicleCategory}
//             value={currentVehicle.client_vehicle_category}
//             onChange={(opt) =>
//               formik.setFieldValue(
//                 `thirdPartyVehicles[${activeVehicleTab}].client_vehicle_category`,
//                 opt.value,
//               )
//             }
//           />
//           <Dropdown
//             label="Actual Vehicle Category"
//             options={actualVehicleCategory}
//             value={currentVehicle.actual_vehicle_category}
//             onChange={async (opt: any) => {
//               formik.setFieldValue(
//                 `thirdPartyVehicles[${activeVehicleTab}].actual_vehicle_category`,
//                 opt.value,
//               );
//               console.log(opt);
//               // Auto-populate charges based on category [cite: 56, 72, 86]
//               // const extra = await fetchVehicleExtraData(opt.value);
//               formik.setFieldValue(
//                 `thirdPartyVehicles[${activeVehicleTab}].abi_hire_charge_per_day`,
//                 Number(opt.abi_rate),
//               );
//               formik.setFieldValue(
//                 `thirdPartyVehicles[${activeVehicleTab}].bhr_hire_charge_per_day`,
//                 Number(opt.bhr_rate),
//               );
//             }}
//           />
//         </div>
//       </SectionWrapper>
//       {/* Hire Vehicle Provision Section */}
//       <SectionWrapper
//         title="Hire Vehicle Provision"
//         actionIcon={<MoreVertical size={20} className="text-blue-600" />}
//       >
//         {formikVehicle.values.hireVehicle.map((vehicle, index) => (
//           <div key={index}>
//             <div className="flex gap-5 flex-wrap mb-5">
//               <RadioGroup
//                 label="Has this Hire Vehicle been Cross-Hired to us?"
//                 name={`hireVehicle[${index}].cross_hired`}
//                 value={vehicle.cross_hired}
//                 onChange={(val) =>
//                   formikVehicle.setFieldValue(
//                     `hireVehicle[${index}].cross_hired`,
//                     val,
//                   )
//                 }
//               />
//               <Dropdown
//                 label="Hire Vehicle Status"
//                 options={vehicleStatus}
//                 value={vehicleStatus.find(
//                   (opt) => opt.value === vehicle.hire_vehicle_status_id,
//                 )}
//                 onChange={(opt) =>
//                   formikVehicle.setFieldValue(
//                     `hireVehicle[${index}].hire_vehicle_status_id`,
//                     opt.value,
//                   )
//                 }
//               />
//             </div>

//             <div className="grid grid-cols-2 gap-5 mb-5">
//               <InputField
//                 label="File Reference Number"
//                 name={`hireVehicle[${index}].provider_name`} // Mapping to your provider_name or similar
//                 value={vehicle.provider_name}
//                 onChange={formikVehicle.handleChange}
//               />
//               <InputField
//                 label="Registration Number"
//                 name={`hireVehicle[${index}].hire_vehicle_registration`}
//                 value={vehicle.hire_vehicle_registration}
//                 onChange={formikVehicle.handleChange}
//               />
//               <InputField
//                 label="Make"
//                 name={`hireVehicle[${index}].make`}
//                 value={vehicle.make}
//                 onChange={formikVehicle.handleChange}
//               />
//               <InputField
//                 label="Model"
//                 name={`hireVehicle[${index}].model`}
//                 value={vehicle.model}
//                 onChange={formikVehicle.handleChange}
//               />
//             </div>

//             <div className="grid grid-cols-2 gap-5 mb-5">
//               <RadioGroup
//                 label="Plate Transfer"
//                 name={`hireVehicle[${index}].plate_transfer`}
//                 value={vehicle.plate_transfer}
//                 onChange={(val) =>
//                   formikVehicle.setFieldValue(
//                     `hireVehicle[${index}].plate_transfer`,
//                     val,
//                   )
//                 }
//               />
//               <InputField
//                 label="Fuel Type"
//                 name={`hireVehicle[${index}].fuel_type`}
//                 value={vehicle.fuel_type}
//                 onChange={formikVehicle.handleChange}
//               />
//             </div>

//             <div className="grid grid-cols-2 gap-5">
//               <CustomDatePicker
//                 label="Hire Start Date"
//                 value={vehicle.hire_start_date}
//                 onChange={(date) =>
//                   formikVehicle.setFieldValue(
//                     `hireVehicle[${index}].hire_start_date`,
//                     date,
//                   )
//                 }
//               />
//               <CustomDatePicker
//                 label="Hire End Date"
//                 value={vehicle.hire_end_date}
//                 onChange={(date) =>
//                   formikVehicle.setFieldValue(
//                     `hireVehicle[${index}].hire_end_date`,
//                     date,
//                   )
//                 }
//               />
//             </div>
//           </div>
//         ))}
//       </SectionWrapper>
//       <SectionWrapper title="Hire Period">
//         <div className="grid grid-cols-2 gap-5 mb-5">
//           <div className="flex flex-col gap-2 relative" ref={hireOutRef}>
//             <label className="text-gray-700 text-sm font-weight-500 ">
//               Hire Out Date & Time
//             </label>
//             <div
//               onClick={() => setShowHireOutPicker(!showHireOutPicker)}
//               className="h-[52px] px-5 bg-white border border-gray-200 rounded flex items-center justify-between cursor-pointer"
//             >
//               <span
//                 className={`
//                              font-light font-weight-300
//                             ${
//                               currentVehicle.hireOutDate
//                                 ? "text-gray-900"
//                                 : "text-gray-400"
//                             }`}
//               >
//                 {currentVehicle.hireOutDate || "Select Date"}
//               </span>
//               <img src={Vector6} alt="" />
//             </div>
//             {showHireOutPicker && (
//               <div className="absolute bottom-[54px] left-0 z-100">
//                 <CustomDatePicker
//                   selectedDate={
//                     currentVehicle.hireOutDate
//                       ? new Date(currentVehicle.hireOutDate)
//                       : new Date()
//                   }
//                   onDateSelect={(date) => {
//                     formik.setFieldValue(
//                       `thirdPartyVehicles[${activeVehicleTab}].hireOutDate`,
//                       date.toISOString().split("T")[0],
//                     );
//                     setShowHireOutPicker(false);
//                   }}
//                 />
//               </div>
//             )}
//           </div>
//           <div className="flex flex-col gap-2 relative" ref={hireBackRef}>
//             <label className="text-gray-700 text-sm font-weight-500 ">
//               Hire Back Date & Time
//             </label>
//             <div
//               onClick={() => setShowHireBackPicker(!showHireBackPicker)}
//               className="h-[52px] px-5 bg-white border border-gray-200 rounded flex items-center justify-between cursor-pointer"
//             >
//               <span
//                 className={`
//                              font-light font-weight-300
//                             ${
//                               currentVehicle.hireBackDate
//                                 ? "text-gray-900"
//                                 : "text-gray-400"
//                             }`}
//               >
//                 {currentVehicle.hireBackDate || "Select Date"}
//               </span>
//               <img src={Vector6} alt="" />
//             </div>
//             {showHireBackPicker && (
//               <div className="absolute bottom-[54px] left-0 z-100">
//                 <CustomDatePicker
//                   selectedDate={
//                     currentVehicle.hireBackDate
//                       ? new Date(currentVehicle.hireBackDate)
//                       : new Date()
//                   }
//                   onDateSelect={(date) => {
//                     formik.setFieldValue(
//                       `thirdPartyVehicles[${activeVehicleTab}].hireBackDate`,
//                       date.toISOString().split("T")[0],
//                     );
//                     setShowHireBackPicker(false);
//                   }}
//                 />
//               </div>
//             )}
//           </div>
//           <InputField
//             label="Number of Days Hire So Far"
//             value={currentVehicle.no_of_days_hired.toString()}
//             disabled
//           />
//           <InputField
//             label="Final Total Number of Hire Days"
//             value={currentVehicle.total_no_of_days_hired.toString()}
//             disabled
//           />
//         </div>
//       </SectionWrapper>

//       <SectionWrapper title="ABI Hire Charges">
//         <div className="mb-5">
//           <RadioGroup
//             label="ABI Insurer?"
//             value={currentVehicle.abi_insured}
//             onChange={(val) =>
//               formik.setFieldValue(
//                 `thirdPartyVehicles[${activeVehicleTab}].abi_insured`,
//                 val,
//               )
//             }
//           />
//         </div>
//         <div
//           className={`grid grid-cols-2 gap-5 mb-5 ${!currentVehicle.abi_insured ? "opacity-50 pointer-events-none" : ""}`}
//         >
//           <InputField
//             label="ABI Hire Charge Per Day"
//             value={currentVehicle.abi_hire_charge_per_day.toString()}
//             disabled
//           />
//           <InputField
//             label="Extra Charges Per Day"
//             value={currentVehicle.extra_charge_per_day.toString()}
//             onChange={(e) =>
//               formik.setFieldValue(
//                 `thirdPartyVehicles[${activeVehicleTab}].extra_charge_per_day`,
//                 e.target.value,
//               )
//             }
//           />
//           <Dropdown
//             label="Admin Fee Type"
//             options={adminFeeType}
//             value={currentVehicle.admin_fee_type}
//             onChange={(opt) =>
//               formik.setFieldValue(
//                 `thirdPartyVehicles[${activeVehicleTab}].admin_fee_type`,
//                 opt.value,
//               )
//             }
//           />
//           <InputField
//             label="Administration Fee"
//             value={currentVehicle.administration_fee.toString()}
//             disabled
//           />
//           <InputField
//             label="Total ABI Hire Charges"
//             value={`£${currentVehicle.total_abi_hire_charge}`}
//             disabled
//           />
//         </div>
//       </SectionWrapper>

//       <SectionWrapper title="BHR Hire Charges">
//         <div className="grid grid-cols-2 gap-5 mb-5">
//           <InputField
//             label="BHR Hire Charge Per Day"
//             value={currentVehicle.bhr_hire_charge_per_day.toString()}
//             disabled
//           />
//           <InputField
//             label="Extra Charges Per Day"
//             value={currentVehicle.bhr_extra_charge_per_day.toString()}
//           />
//           <InputField
//             label="Administration Fee"
//             value={currentVehicle.bhr_administration_fee.toString()}
//           />
//           <InputField
//             label="CDW Charges"
//             value={(
//               currentVehicle.cdw_per_day * currentVehicle.total_no_of_days_hired
//             ).toString()}
//             disabled
//           />
//           <InputField
//             label="Collection & Delivery Fee"
//             value={currentVehicle.collection_and_delivery_fee.toString()}
//           />
//           <InputField
//             label="Total BHR Charges"
//             value={`£${currentVehicle.total_bhr_charge}`}
//             disabled
//           />
//         </div>
//       </SectionWrapper>
//     </div>
//   );
// };;;

// // --- Helper Components ---

// const SectionWrapper: React.FC<{
//   title: string;
//   children: React.ReactNode;
// }> = ({ title, children }) => (
//   <div className="w-full p-5 rounded-lg border border-slate-100 flex flex-col gap-4">
//     <h3 className="text-black text-xl font-weight-600">{title}</h3>
//     <div className="w-full h-px bg-slate-100" />
//     <div className="pt-2">{children}</div>
//   </div>
// );

// const InputField: React.FC<{
//   label: string;
//   value: string;
//   onChange?: any;
//   disabled?: boolean;
// }> = ({ label, value, onChange, disabled }) => (
//   <div className="flex flex-col gap-2 w-full">
//     <label className="text-slate-700 text-sm font-weight-400">{label}</label>
//     <input
//       type="text"
//       value={value}
//       onChange={onChange}
//       disabled={disabled}
//       className={`px-5 py-3 border border-slate-200 rounded text-base font-light ${disabled ? "bg-slate-50" : "bg-white"}`}
//     />
//   </div>
// );

// const Dropdown: React.FC<{
//   label: string;
//   options: any;
//   value: any;
//   onChange: any;
// }> = ({ label, options, value, onChange }) => (
//   <div className="flex flex-col gap-2 w-full">
//     <label className="text-gray-700 text-sm font-weight-400">{label}</label>
//     <Select
//       options={options}
//       value={options.find((o: any) => o.value === value)}
//       onChange={onChange}
//       styles={customStyles}
//       components={{
//         DropdownIndicator: BlueDropdownIndicator,
//         IndicatorSeparator: () => null,
//       }}
//     />
//   </div>
// );

// const RadioGroup: React.FC<{
//   label: string;
//   value: boolean;
//   onChange: (v: boolean) => void;
// }> = ({ label, value, onChange }) => (
//   <div className="flex flex-col gap-5 w-full">
//     <label className="text-black text-sm font-weight-400">{label}</label>
//     <div className="flex gap-5">
//       <div
//         onClick={() => onChange(true)}
//         className="flex items-center gap-2 cursor-pointer"
//       >
//         <img src={value === true ? Yes : No} alt="radio" /> <span>Yes</span>
//       </div>
//       <div
//         onClick={() => onChange(false)}
//         className="flex items-center gap-2 cursor-pointer"
//       >
//         <img src={value === false ? Yes : No} alt="radio" /> <span>No</span>
//       </div>
//     </div>
//   </div>
// );

import { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import * as Yup from "yup";
import { useFormik, FormikProvider } from "formik";
import Select from "react-select";
import { Clock, FileText, Mail, MoreVertical } from "lucide-react";
import { today, getLocalTimeZone } from "@internationalized/date";

// Assets & Icons
import Vector6 from "../../../assets/AutoClaim_icon/Vector-6.svg";
import Yes from "../../../assets/AutoClaim_icon/Yes.svg";
import No from "../../../assets/AutoClaim_icon/No.svg";

// Services
import {
  createHireDetails,
  updateHireDetails,
  getActualVehicleCategory,
  getClientVehicleCategory,
  getAdminFeeType,
  getHireDetails,
  fetchVehicleExtraData,
} from "../../../services/HireDetail/HireDetails";
import {
  createHireProvided,
  downloadCheckSheet,
  downloadFeeExemption,
  downloadHireDocumentationAgreement,
  downloadMitigationQuestionnaire,
  downloadStorageRecovery,
  getHireProvided,
  getHireVehicleStatus,
  sendEmails,
  updateHireProvided,
} from "../../../services/HireVehicleProvided/HireVehicleProvided";
import { BlueDropdownIndicator, customStyles } from "./GeneralDetailsForm";
import { CustomDatePicker } from "../Components/DatePicker";
import { parseCalendarDateTimeStamp } from "../../../common/common";
import { CheckoutModal } from "../Components/CheckoutModal";

function openOutlookCompose(to: string, subject: string, body: string) {
  const formattedTo = to.replace(/,/g, ";").replace(/\s+/g, "");
  const encodedTo = encodeURIComponent(formattedTo);
  const encodedSubject = encodeURIComponent(subject);
  const encodedBody = encodeURIComponent(body);

  const officeUrl = `https://outlook.office.com/mail/deeplink/compose?to=${encodedTo}&subject=${encodedSubject}&body=${encodedBody}`;
  const liveUrl = `https://outlook.live.com/mail/0/deeplink/compose?to=${encodedTo}&subject=${encodedSubject}&body=${encodedBody}`;
  const mailtoUrl = `mailto:${formattedTo}?subject=${encodedSubject}&body=${encodedBody}`;

  const newTab = window.open(officeUrl, "_blank");

  if (!newTab) {
    window.location.href = mailtoUrl;
    return;
  }

  setTimeout(() => {
    try {
      window.open(liveUrl, "_blank");
    } catch (e) {
      console.warn("Live URL popup blocked or failed", e);
    }
  }, 1000);
}

export const HireDetailsForm = ({ formRef }: any) => {
  const claimId = localStorage.getItem("claimId");
  const [isLoading, setIsLoading] = useState(false);
  const [adminFeeType, setAdminFeeType] = useState([]);
  const [actualVehicleCategory, setActualVehicleCategory] = useState([]);
  const [clientVehicleCategory, setClientVehicleCategory] = useState([]);
  const [vehicleStatus, setVehicleStatus] = useState([]);
  const [activeVehicleTab, setActiveVehicleTab] = useState(0);

  // Picker States
  const [showHireOutPicker, setShowHireOutPicker] = useState(false);
  const [showHireBackPicker, setShowHireBackPicker] = useState(false);
  const [showProvisionStartPicker, setShowProvisionStartPicker] =
    useState(false);
  const [showProvisionEndPicker, setShowProvisionEndPicker] = useState(false);

  const hireOutRef = useRef<HTMLDivElement>(null);
  const hireBackRef = useRef<HTMLDivElement>(null);
  const provStartRef = useRef<HTMLDivElement>(null);
  const provEndRef = useRef<HTMLDivElement>(null);

  //ui states
  const [showActionPopup, setShowActionPopup] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [modalStep, setModalStep] = useState(1);
  const [switchVehicle, setSwitchVehicle] = useState(false);
  const [showSwapBanner, setShowSwapBanner] = useState(false);
const [showDocsPopup, setShowDocsPopup] = useState<{ [key: number]: boolean }>(
  {},
);
  const [showEmailPopup, setShowEmailPopup] = useState<{ [key: number]: boolean }>(
  {},
);const toggleEmailPopup = (index: number) => {
  setShowEmailPopup((prev) => ({
    ...prev,
    [index]: !prev[index],
  }));
};

const toggleDocsPopup = (index: number) => {
  setShowDocsPopup((prev) => ({
    ...prev,
    [index]: !prev[index],
  }));
};
  const [formData, setFormData] = useState({
    interiorCleanCheckOut: "",
    interiorCleanCheckIn: "",
    interiorDamage: false,
    interiorDamageDescription: "",
    interiorPhotos: [] as File[],
    exteriorCleanCheckOut: "",
    exteriorCleanCheckIn: "",
    exteriorDamage: false,
    exteriorDamageDescription: "",
    exteriorPhotos: [] as File[],
    petrolCheckoutCharge: "",
    petrolChargeAmount: "0",
    petrolChargeReason: "",
    applyDamageCharges: "",
    damageCharges: "0",
    damageChargesPaidNow: 0,
    damageNotes: "",
    valetCharge: 30, // Default £30 as per user story [cite: 124, 131]
  });

  // Unified Formik
  const formik = useFormik({
    initialValues: {
      thirdPartyVehicles: [
        {
          client_vehicle_category: "",
          actual_vehicle_category: "",
          abi_hire_charge_per_day: 0,
          extra_charge_per_day: 5,
          administration_fee: 37,
          bhr_hire_charge_per_day: 0,
          bhr_extra_charge_per_day: 5,
          bhr_administration_fee: 60,
          cdw_per_day: 15,
          collection_and_delivery_fee: 60,
          no_of_days_hired: 0,
          total_no_of_days_hired: 0,
          total_abi_hire_charge: 0,
          total_bhr_charge: 0,
          abi_insured: false,
          admin_fee_type: "",
          hireOutDate: today(getLocalTimeZone()).toString(),
          hireBackDate: null,
          cross_hired: false,
          hire_vehicle_status_id: null,
          hire_vehicle_registration: "",
          make: "",
          model: "",
          provider_name: "", // File Ref
          fuel_type: "",
          plate_transfer: false,
        },
      ],
    },
    onSubmit: async (values) => {
      try {
        const hireId = localStorage.getItem("hireId");
        const hireProvidedId = localStorage.getItem("hireProvidedId");

        const chargesPayload = {
          hire_details: values.thirdPartyVehicles.map((v) => ({
            ...v,
            claim_id: claimId,
            hire_out: v.hireOutDate,
            hire_back: v.hireBackDate,
          })),
        };

        const provisionPayload = {
          claim_id: claimId,
          section_a: { ...formData }, // Unified modal data
          section_b: values.thirdPartyVehicles.map((v) => ({
            ...v,
            cross_hire: v.cross_hired ? 1 : 0,
            plate_transfer: v.plate_transfer ? 1 : 0,
            hire_start_date: v.hireOutDate,
            hire_end_date: v.hireBackDate,
            rate: v.abi_hire_charge_per_day,
          })),
        };

        await Promise.all([
          claimId && hireId
            ? updateHireDetails(chargesPayload, claimId)
            : createHireDetails(chargesPayload),
          claimId && hireProvidedId
            ? updateHireProvided(claimId, provisionPayload, false)
            : createHireProvided(claimId, provisionPayload, false),
        ]);

        toast.success("All hire details saved successfully");
      } catch (error) {
        toast.error("Error saving hire information");
      }
    },
  });
  useEffect(() => {
    const fetchLookups = async () => {
      const [clientRes, actualRes, adminRes, statusRes] = await Promise.all([
        getClientVehicleCategory(),
        getActualVehicleCategory(),
        getAdminFeeType(),
        getHireVehicleStatus(),
      ]);
      setClientVehicleCategory(
        clientRes.data.map((i: any) => ({ value: i.id, label: i.label })),
      );
      setActualVehicleCategory(
        actualRes.data.map((i: any) => ({
          value: i.id,
          label: i.label,
          abi_rate: i.abi_rate,
          bhr_rate: i.bhr_rate,
          valet_rate: i.valet_rate,
        })),
      );
      setAdminFeeType(
        adminRes.data.map((i: any) => ({ value: i.id, label: i.label })),
      );
      setVehicleStatus(
        statusRes.data.map((i: any) => ({ value: i.id, label: i.label })),
      );
    };
    fetchLookups();
  }, []);
  // Unified Data Loader
  useEffect(() => {
    if (!claimId) return;
    const loadData = async () => {
      setIsLoading(true);
      try {
        const provRes = await getHireProvided(claimId);
        const detRes = await getHireDetails(claimId);
        // getHireVehicleStatus(),
        // getClientVehicleCategory(),
        // getActualVehicleCategory(),
        // getAdminFeeType()
        // setVehicleStatus(statusRes.data.map((i: any) => ({ value: i.id, label: i.label })));
        // setClientVehicleCategory(clientRes.data.map((i: any) => ({ value: i.id, label: i.label })));
        // setActualVehicleCategory(actualRes.data.map((i: any) => ({ value: i.id, label: i.label, abi_rate: i.abi_rate, bhr_rate: i.bhr_rate })));
        // setAdminFeeType(adminRes.data.map((i: any) => ({ value: i.id, label: i.label })));

        const hireProvided = Array.isArray(provRes?.data) ? provRes.data : [];
        const hireDetails = Array.isArray(detRes?.data?.hire_details)
          ? detRes.data.hire_details
          : [];

        const merged = hireProvided.map((prov: any, idx: number) => {
          const det = hireDetails[idx] || {};
          return {
            ...prov,
            ...det,
            cross_hired: !!prov.cross_hire,
            hireOutDate:
              prov.hire_start_date ||
              det.hire_out ||
              today(getLocalTimeZone()).toString(),
            hireBackDate: prov.hire_end_date || det.hire_back || null,
          };
        });

        if (merged.length > 0) formik.setValues({ thirdPartyVehicles: merged });
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [claimId]);

  // Live Calculations (So Far vs Final Days)
  useEffect(() => {
    const vehicle = formik.values.thirdPartyVehicles[activeVehicleTab];
    if (!vehicle || !vehicle.hireOutDate) return;

    const start = new Date(vehicle.hireOutDate);
    const todayDate = new Date();
    const daysSoFar = Math.max(
      0,
      Math.ceil(
        (todayDate.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
      ),
    );

    let finalDays = 0;
    if (vehicle.hireBackDate) {
      finalDays = Math.max(
        0,
        Math.ceil(
          (new Date(vehicle.hireBackDate).getTime() - start.getTime()) /
            (1000 * 60 * 60 * 24),
        ) + 1,
      );
    }

    const abiTotal =
      (Number(vehicle.abi_hire_charge_per_day) +
        Number(vehicle.extra_charge_per_day)) *
        finalDays +
      Number(vehicle.administration_fee);
    const bhrTotal =
      (Number(vehicle.bhr_hire_charge_per_day) +
        Number(vehicle.bhr_extra_charge_per_day)) *
        finalDays +
      Number(vehicle.bhr_administration_fee) +
      15 * finalDays +
      Number(vehicle.collection_and_delivery_fee);

    formik.setFieldValue(
      `thirdPartyVehicles[${activeVehicleTab}].no_of_days_hired`,
      daysSoFar,
    );
    formik.setFieldValue(
      `thirdPartyVehicles[${activeVehicleTab}].total_no_of_days_hired`,
      finalDays,
    );
    formik.setFieldValue(
      `thirdPartyVehicles[${activeVehicleTab}].total_abi_hire_charge`,
      abiTotal.toFixed(2),
    );
    formik.setFieldValue(
      `thirdPartyVehicles[${activeVehicleTab}].total_bhr_charge`,
      bhrTotal.toFixed(2),
    );
  }, [
    formik.values.thirdPartyVehicles[activeVehicleTab]?.hireOutDate,
    formik.values.thirdPartyVehicles[activeVehicleTab]?.hireBackDate,
    formik.values.thirdPartyVehicles[activeVehicleTab]?.abi_hire_charge_per_day,
    formik.values.thirdPartyVehicles[activeVehicleTab]?.bhr_hire_charge_per_day,
    formik.values.thirdPartyVehicles[activeVehicleTab]?.extra_charge_per_day,
  ]);

  useEffect(() => {
    if (formRef) formRef.current = formik;
  }, [formik]);
const handleDownload = async (docType: string) => {
  const currentClaimId = claimId;
  if (!currentClaimId) return;

  try {
    toast.info("Preparing your document...");
    let response;

    switch (docType) {
      case "Hire_Vehicle_Check_Sheet":
        // This triggers the XLS/PDF generation on the backend
        response = await downloadCheckSheet(currentClaimId);
        break;
      case "Mitigation_Questionnaire":
        response = await downloadMitigationQuestionnaire(currentClaimId);
        break;
      case "Hire_Documentation":
        // Map to your specific fleet instruction download service
        response = await downloadHireDocumentationAgreement(currentClaimId);
        break;
      case "Recovery_Storage":
        response = await downloadStorageRecovery(currentClaimId);
        break;
      case "Fee_Exemption_Form":
        response = await downloadFeeExemption(currentClaimId);
        break;
      default:
        toast.error("Document type not recognized.");
        return;
    }

    // Standard logic to trigger browser download for Blob files (PDF/XLS)
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;

    // Set filename based on type
    if (docType === "Fee_Exemption_Form") {
      const blob = new Blob([response.data], {
        type: "application/pdf",
      });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download =`${docType}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
      toast.success(`${docType} downloaded successfully`);
    } else {
      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `${docType}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
      toast.success(`${docType} downloaded successfully`);
    }
  } catch (error) {
    console.error("Download error:", error);
    toast.error("Failed to download document.");
  }
};
  const currentVehicle = formik.values.thirdPartyVehicles[activeVehicleTab];
  // Action Handlers
  // Action Handlers for Swap Logic
  const handleQuestionnaireSend = async (
    // email: string,
    sendReminders: boolean,
    option: any
  ) => {
    // const firstName = values.company_name || "Client";
    try {
      if (option === "Inst Fleet to On Hire") {
        const { data } = await sendEmails(claimId, "on_hire");
        const subject =
          "New Instruction to Fleet to On Hire Vehicle (CIL)";
        const body =
          `Brand: RTA - Nationwide Assist\n` +
          `Reference: ${data.Reference || "N/A"}\n` +
          `Referrer: ${data.Referrer || "N/A"}\n` +
          `Client: ${data.client_name || "N/A"}\n` +
          `Client's Vehicle Mobile No.: ${data.mobile_tel || "N/A"
          }\n` +
          `Does Hirer Require Vehicle Documents: Yes\n\n` +
          `Client's Vehicle Details:\n` +
          `Reg: ${data.registration || "N/A"}\n` +
          `Make/Model: ${data.make || "N/A"} - ${data.model}\n` +
          `Body Type: ${data.body_type || "N/A"}\n` +
          `Auto: ${data.auto || "N/A"}\n` +
          `Engine Size: ${data.engine_size || "N/A"}\n` +
          `Fuel Type: ${data.fuel_type || "N/A"}\n` +
          `No of Seats inc Driver: ${data.no_of_seats || "N/A"}\n\n` +
          `If Taxi Vehicle:\n` +
          `Borough: ${data.borough_name || "N/A"}\n` +
          `Type of Plate: ${data.plate_type || "N/A"}\n` +
          `Driver Base: ${data.driver_base || "N/A"}\n\n` +
          `Hi,\n\nPlease contact the Client to arrange a hire vehicle.\n\n` +
          `Hire needs to start on ${new Date().toLocaleDateString(
            "en-GB"
          )}\n\n` +
          `We need to provide hire vehicle category XXXX.\n\n` +
          `Regards,\nClaim Handler`;

        openOutlookCompose(data.to, subject, body);
        toast.success("On Hire email opened in Outlook");
      } else if (option === "Inst Fleet to Off Hire") {
        const { data } = await sendEmails(claimId, "off_hire");
        const subject =
          "New Instruction to Fleet to Off Hire Vehicle (CIL)";
        const body =
          `Reference: ${data.Reference || "N/A"}\n` +
          `Referrer: ${data.Referrer || "N/A"}\n` +
          `Client: ${data.client_name || "N/A"}\n\n` +
          `Hi,\nPlease contact the Client to arrange the off hire of this vehicle for ${new Date().toLocaleDateString(
            "en-GB"
          )}.\n\nRegards,\nClaim Handler`;
        toast.success("Off Hire email opened in Outlook");
        openOutlookCompose(data.to, subject, body);
      }
    } catch { }
  }

                const handleAction = (type: string) => {
   const todayStr = new Date().toISOString().split("T")[0];
   const currentVehicles = formik.values.thirdPartyVehicles;
   const activeVehicle = currentVehicles[activeVehicleTab];

   if (type === "onHire") {
     formik.setFieldValue(
       `thirdPartyVehicles[${activeVehicleTab}].hireOutDate`,
       todayStr,
     );
     formik.setFieldValue(
       `thirdPartyVehicles[${activeVehicleTab}].hire_vehicle_status_id`,
       1,
     ); // Value 1 for On Hire
     setShowActionPopup(false);
   } else if (type === "switchOff") {
     // 3rd Option: Start Switch (Off-Hire Old)
     setShowCheckoutModal(true);
     setModalStep(1);
     setSwitchVehicle(true); // Flag to indicate we are in a swap process
     // We don't close the ActionPopup yet so they can see the next step after modal
   } else if (type === "onHireNew") {
     // 4th Option: Create New Record
     if (currentVehicles.length >= 3) {
       toast.error("Maximum limit of 3 records reached.");
       return;
     }

     // Safety check: Don't allow a new hire if the current one isn't off-hired
     if (
       !activeVehicle.hireBackDate &&
       currentVehicles.length === activeVehicleTab + 1
     ) {
       toast.error(
         "Please off-hire the current vehicle before switching to a new one.",
       );
       return;
     }

     const newRecord = {
       ...formik.initialValues.thirdPartyVehicles[0],
       hireOutDate: todayStr,
       hire_vehicle_status_id: 1, // New record starts as On Hire
       administration_fee: 0, // Subsequent records have 0 admin fee
       collection_and_delivery_fee: 0, // Subsequent records have 0 collection fee
     };

     formik.setFieldValue("thirdPartyVehicles", [
       ...currentVehicles,
       newRecord,
     ]);
     setActiveVehicleTab(currentVehicles.length); // Move to the new record tab
     setShowSwapBanner(true);
     setShowActionPopup(false);
   } else if (type === "offHire") {
     // 5th Option: Simple Off Hire
     setShowCheckoutModal(true);
     setModalStep(1);
     setSwitchVehicle(false);
   }
 };
  // 2. Tab System for multiple records (Vehicle Swap Handling) [cite: 207, 210]
  const renderVehicleTabs = () => (
    <div className="flex gap-4 border-b border-slate-100 mb-4">
      {formik.values.thirdPartyVehicles.map((v, idx) => (
        <button
          key={idx}
          type="button"
          onClick={() => setActiveVehicleTab(idx)}
          className={`px-4 py-2 text-sm font-weight-400 transition-colors ${
            activeVehicleTab === idx
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-slate-400 hover:text-slate-600"
          }`}
        >
          Hire Record {idx + 1} - {v.hire_vehicle_registration || "TBC"}
        </button>
      ))}
    </div>
  );
  console.log(formik.values.thirdPartyVehicles.length);
  return (
    <>
      <FormikProvider value={formik}>
        <div className="MainContent w-[788px] ms-[140px] flex-1 flex flex-col gap-6 p-8 overflow-y-auto scrollbar-hide font-['Stack_Sans_Headline']">
          <div className="flex justify-between">
            <h1 className="text-black text-2xl font-weight-600">
              Hire Details
            </h1>
            <button className="h-8 px-3 py-2 bg-blue-50 rounded flex items-center gap-2.5 text-blue-600">
              <Clock size={16} /> <span className="text-sm">Provision Log</span>
            </button>
          </div>
          {/* Vehicle Tabs - Visible only when swap occurs [cite: 209] */}
          {/* Vehicle Banners - Side by Side Swap View */}
          {showSwapBanner && formik.values.thirdPartyVehicles.length > 1 ? (
            <div className="flex gap-6 w-full">
              {formik.values.thirdPartyVehicles.map((v, i) => (
                <div
                  key={i}
                  onClick={() => setActiveVehicleTab(i)}
                  className={`flex-1 p-5 rounded-lg border cursor-pointer flex flex-col items-center gap-4 ${activeVehicleTab === i ? "bg-blue-100 border-blue-200" : "bg-white border-blue-200"}`}
                >
                  <div className="text-center">
                    <div className="text-black text-xl font-weight-600 leading-5">
                      Vehicle{i + 1}
                    </div>
                    <div className="text-slate-500 text-sm font-weight-400">
                      {v.hire_vehicle_registration || "Reg#"}
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div
                      className="flex items-center gap-2 text-primary text-sm"
                      onClick={() => toggleDocsPopup(activeVehicleTab)}
                    >
                      <FileText size={16} /> View Docs
                    </div>
                    {/* Docs Popup Design */}
                    {showDocsPopup[activeVehicleTab] && (
                      // Inside your Docs Popup mapping area:
                      <div className="absolute right-80 top-[328px] z-[60] w-96 p-6 bg-white rounded-lg shadow-[0px_4px_8px_0px_rgba(0,0,0,0.08)] flex flex-col justify-center items-start gap-3 border border-slate-100">
                        {/* Item 1: Inst Fleet to On Hire */}
                        <div
                          className="text-primary text-sm cursor-pointer hover:text-blue-600 w-full"
                          onClick={() =>
                            handleDownload("Hire_Vehicle_Check_Sheet")
                          }
                        >
                          Hire Vehicle Check Sheet
                        </div>
                        <div className="self-stretch h-px bg-slate-100"></div>

                        {/* Item 2: Inst Fleet to Off Hire */}
                        <div
                          className="text-primary text-sm cursor-pointer hover:text-blue-600 w-full"
                          onClick={() => handleDownload("Hire_Documentation")}
                        >
                          Hire Documentation
                        </div>
                        <div className="self-stretch h-px bg-slate-100"></div>

                        {/* Item 3: Check Sheet (Usually an XLS or PDF) */}
                        <div
                          className="text-primary text-sm cursor-pointer hover:text-blue-600 w-full"
                          onClick={() => handleDownload("Fee_Exemption_Form")}
                        >
                          Fee Exemption Form
                        </div>
                        <div className="self-stretch h-px bg-slate-100"></div>

                        {/* Item 4: Mitigation Questionnaire */}
                        <div
                          className="text-primary text-sm cursor-pointer hover:text-blue-600 w-full"
                          onClick={() =>
                            handleDownload("Mitigation_Questionnaire")
                          }
                        >
                          Mitigation Questionnaire
                        </div>
                        <div className="self-stretch h-px bg-slate-100"></div>

                        {/* Item 5: Authority Letter */}
                        <div
                          className="text-primary text-sm cursor-pointer hover:text-blue-600 w-full"
                          onClick={() => handleDownload("Recovery_Storage")}
                        >
                          Recovery & Storage
                        </div>
                      </div>
                    )}
                    <div
                      className="flex items-center gap-2 text-primary text-sm"
                      onClick={() => toggleEmailPopup(activeVehicleTab)}
                    >
                      <Mail size={16} />
                      Send Email
                    </div>
                    {showEmailPopup[activeVehicleTab] && (
                      // Inside your Docs Popup mapping area:
                      <div className="absolute right-20 top-[328px]  z-[60] w-96 p-6 bg-white rounded-lg shadow-[0px_4px_8px_0px_rgba(0,0,0,0.08)] flex flex-col justify-center items-start gap-3 border border-slate-100">
                        {/* Item 1: Inst Fleet to On Hire */}
                        <div
                          className="text-primary text-sm cursor-pointer hover:text-blue-600 w-full"
                          onClick={() =>
                            handleQuestionnaireSend(
                              true,
                              "Inst Fleet to Off Hire",
                            )
                          }
                        >
                          Inst Fleet to On Hire
                        </div>
                        <div className="self-stretch h-px bg-slate-100"></div>

                        {/* Item 2: Inst Fleet to Off Hire */}
                        <div
                          className="text-primary text-sm cursor-pointer hover:text-blue-600 w-full"
                          onClick={() =>
                            handleQuestionnaireSend(
                              true,
                              "Inst Fleet to Off Hire",
                            )
                          }
                        >
                          Inst Fleet to Off Hire
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // Single Record View
            currentVehicle.hireBackDate && (
              <div className="w-full p-5 bg-blue-100 rounded-lg flex justify-between items-center">
                <div>
                  <div className="text-black text-xl font-weight-600 leading-5">
                    Vehicle1
                  </div>
                  <div className="text-slate-500 text-sm font-weight-400">
                    Reg# {currentVehicle.hire_vehicle_registration}
                  </div>
                </div>
                <div className="flex gap-4">
                  <button
                    className="flex items-center gap-2 text-primary text-sm"
                    onClick={() => toggleDocsPopup(activeVehicleTab)}
                  >
                    <FileText size={16} /> View Docs
                  </button>
                  {/* Docs Popup Design */}
                  {showDocsPopup[activeVehicleTab] && (
                    // Inside your Docs Popup mapping area:
                    <div className="absolute right-70 top-[290px] z-[60] w-96 p-6 bg-white rounded-lg shadow-[0px_4px_8px_0px_rgba(0,0,0,0.08)] flex flex-col justify-center items-start gap-3 border border-slate-100">
                      {/* Item 1: Inst Fleet to On Hire */}
                      <div
                        className="text-primary text-sm cursor-pointer hover:text-blue-600 w-full"
                        onClick={() =>
                          handleDownload("Hire_Vehicle_Check_Sheet")
                        }
                      >
                        Hire Vehicle Check Sheet
                      </div>
                      <div className="self-stretch h-px bg-slate-100"></div>

                      {/* Item 2: Inst Fleet to Off Hire */}
                      <div
                        className="text-primary text-sm cursor-pointer hover:text-blue-600 w-full"
                        onClick={() => handleDownload("Hire_Documentation")}
                      >
                        Hire Documentation
                      </div>
                      <div className="self-stretch h-px bg-slate-100"></div>

                      {/* Item 3: Check Sheet (Usually an XLS or PDF) */}
                      <div
                        className="text-primary text-sm cursor-pointer hover:text-blue-600 w-full"
                        onClick={() => handleDownload("Fee_Exemption_Form")}
                      >
                        Fee Exemption Form
                      </div>
                      <div className="self-stretch h-px bg-slate-100"></div>

                      {/* Item 4: Mitigation Questionnaire */}
                      <div
                        className="text-primary text-sm cursor-pointer hover:text-blue-600 w-full"
                        onClick={() =>
                          handleDownload("Mitigation_Questionnaire")
                        }
                      >
                        Mitigation Questionnaire
                      </div>
                      <div className="self-stretch h-px bg-slate-100"></div>

                      {/* Item 5: Authority Letter */}
                      <div
                        className="text-primary text-sm cursor-pointer hover:text-blue-600 w-full"
                        onClick={() => handleDownload("Recovery_Storage")}
                      >
                        Recovery & Storage
                      </div>
                    </div>
                  )}
                  <div
                    className="flex items-center gap-2 text-primary text-sm"
                    onClick={() => toggleEmailPopup(activeVehicleTab)}
                  >
                    <Mail size={16} />
                    Send Email
                  </div>
                  {showEmailPopup[activeVehicleTab] && (
                    // Inside your Docs Popup mapping area:
                    <div className="absolute right-20 top-[290px]  z-[60] w-96 p-6 bg-white rounded-lg shadow-[0px_4px_8px_0px_rgba(0,0,0,0.08)] flex flex-col justify-center items-start gap-3 border border-slate-100">
                      {/* Item 1: Inst Fleet to On Hire */}
                      <div
                        className="text-primary text-sm cursor-pointer hover:text-blue-600 w-full"
                        onClick={() =>
                          handleQuestionnaireSend(
                            true,
                            "Inst Fleet to Off Hire",
                          )
                        }
                      >
                        Inst Fleet to On Hire
                      </div>
                      <div className="self-stretch h-px bg-slate-100"></div>

                      {/* Item 2: Inst Fleet to Off Hire */}
                      <div
                        className="text-primary text-sm cursor-pointer hover:text-blue-600 w-full"
                        onClick={() =>
                          handleQuestionnaireSend(
                            true,
                            "Inst Fleet to Off Hire",
                          )
                        }
                      >
                        Inst Fleet to Off Hire
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          )}
          {/* Section: Vehicle Category */}
          <SectionWrapper title="Vehicle Category">
            <div className="flex gap-5">
              <Dropdown
                label="Client Vehicle Category"
                options={clientVehicleCategory}
                value={currentVehicle.client_vehicle_category}
                onChange={(opt) =>
                  formik.setFieldValue(
                    `thirdPartyVehicles[${activeVehicleTab}].client_vehicle_category`,
                    opt.value,
                  )
                }
              />
              <Dropdown
                label="Actual Vehicle Category"
                options={actualVehicleCategory}
                value={currentVehicle.actual_vehicle_category}
                onChange={(opt: any) => {
                  formik.setFieldValue(
                    `thirdPartyVehicles[${activeVehicleTab}].actual_vehicle_category`,
                    opt.value,
                  );
                  formik.setFieldValue(
                    `thirdPartyVehicles[${activeVehicleTab}].abi_hire_charge_per_day`,
                    Number(opt.abi_rate),
                  );
                  formik.setFieldValue(
                    `thirdPartyVehicles[${activeVehicleTab}].bhr_hire_charge_per_day`,
                    Number(opt.bhr_rate),
                  );
                }}
              />
            </div>
          </SectionWrapper>

          {/* Section: Hire Vehicle Provision (Design Updated with Custom Picker) */}
          <SectionWrapper
            title="Hire Vehicle Provision"
            actionIcon={
              <div className="relative">
                <MoreVertical
                  size={20}
                  className="text-blue-600 cursor-pointer"
                  onClick={() => setShowActionPopup(!showActionPopup)}
                />
                {showActionPopup && (
                  <div className="absolute right-0 top-8 z-50 p-6 bg-white rounded-lg shadow-xl inline-flex flex-col gap-3 min-w-[310px] border border-slate-100">
                    {/* Option 1: Always available to edit provider */}
                    <div className="text-primary text-sm cursor-pointer hover:bg-slate-50 p-1">
                      Enter Cross-Hire Provider Details
                    </div>
                    <div className="h-px bg-slate-100 w-full" />

                    {/* Option 2: Disable if already has a start date */}
                    <div
                      className={`text-sm p-1 ${currentVehicle.hire_vehicle_status_id === 1 ? "text-slate-400 cursor-not-allowed" : "text-primary cursor-pointer hover:bg-slate-50"}`}
                      onClick={() =>
                        currentVehicle.hire_vehicle_status_id !== 1 &&
                        handleAction("onHire")
                      }
                    >
                      On Hire Vehicle
                    </div>
                    <div className="h-px bg-slate-100 w-full" />

                    {/* Option 3: Disable if already off-hired */}
                    <div
                      className={`text-sm font-weight-400 p-1 ${currentVehicle.hireBackDate || currentVehicle.hire_vehicle_status_id === 2 || currentVehicle.hire_vehicle_status_id === null || currentVehicle.hire_vehicle_status_id === "" ? "text-slate-400 cursor-not-allowed" : "text-primary cursor-pointer hover:bg-slate-50"}`}
                      onClick={() =>
                        !currentVehicle.hireBackDate &&
                        handleAction("switchOff")
                      }
                    >
                      Start Vehicle Switch (Off-Hire Old)
                    </div>
                    <div className="h-px bg-slate-100 w-full" />

                    {/* Option 4: Enable ONLY if current vehicle is off-hired and we have < 3 records */}
                    <div
                      className={`text-sm font-medium p-1 ${!currentVehicle.hireBackDate || formik.values.thirdPartyVehicles.length >= 3 ? "text-slate-400 cursor-not-allowed" : "text-primary cursor-pointer hover:bg-slate-50"}`}
                      onClick={() =>
                        currentVehicle.hireBackDate &&
                        formik.values.thirdPartyVehicles.length < 3 &&
                        handleAction("onHireNew")
                      }
                    >
                      Complete Vehicle Switch (On-Hire New)
                    </div>
                    <div className="h-px bg-slate-100 w-full" />

                    {/* Option 5: Disable if already off-hired */}
                    <div
                      className={`text-sm p-1 ${currentVehicle.hireBackDate || currentVehicle.hire_vehicle_status_id === 2 || currentVehicle.hire_vehicle_status_id === null || currentVehicle.hire_vehicle_status_id === "" ? "text-slate-400 cursor-not-allowed" : "text-primary cursor-pointer hover:bg-slate-50"}`}
                      onClick={() =>
                        !currentVehicle.hireBackDate && handleAction("offHire")
                      }
                    >
                      Off Hire Vehicle
                    </div>
                  </div>
                )}
              </div>
            }
          >
            <div className="grid grid-cols-2 gap-5 mb-5">
              <RadioGroup
                label="Has this Hire Vehicle been Cross-Hired to us?"
                value={currentVehicle.cross_hired}
                onChange={(val) =>
                  formik.setFieldValue(
                    `thirdPartyVehicles[${activeVehicleTab}].cross_hired`,
                    val,
                  )
                }
              />
              <Dropdown
                label="Hire Vehicle Status"
                options={vehicleStatus}
                value={currentVehicle.hire_vehicle_status_id}
                onChange={(opt) =>
                  formik.setFieldValue(
                    `thirdPartyVehicles[${activeVehicleTab}].hire_vehicle_status_id`,
                    opt.value,
                  )
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-5 mb-5">
              <InputField
                label="File Reference Number"
                value={currentVehicle.provider_name}
                onChange={(e) =>
                  formik.setFieldValue(
                    `thirdPartyVehicles[${activeVehicleTab}].provider_name`,
                    e.target.value,
                  )
                }
              />
              <InputField
                label="Registration Number"
                value={currentVehicle.hire_vehicle_registration}
                onChange={(e) =>
                  formik.setFieldValue(
                    `thirdPartyVehicles[${activeVehicleTab}].hire_vehicle_registration`,
                    e.target.value,
                  )
                }
              />
              <InputField
                label="Make"
                value={currentVehicle.make}
                onChange={(e) =>
                  formik.setFieldValue(
                    `thirdPartyVehicles[${activeVehicleTab}].make`,
                    e.target.value,
                  )
                }
              />
              <InputField
                label="Model"
                value={currentVehicle.model}
                onChange={(e) =>
                  formik.setFieldValue(
                    `thirdPartyVehicles[${activeVehicleTab}].model`,
                    e.target.value,
                  )
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-5 mb-5">
              <RadioGroup
                label="Plate Transfer"
                value={currentVehicle.plate_transfer}
                onChange={(val) =>
                  formik.setFieldValue(
                    `thirdPartyVehicles[${activeVehicleTab}].plate_transfer`,
                    val,
                  )
                }
              />
              <InputField
                label="Fuel Type"
                value={currentVehicle.fuel_type}
                onChange={(e) =>
                  formik.setFieldValue(
                    `thirdPartyVehicles[${activeVehicleTab}].fuel_type`,
                    e.target.value,
                  )
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-5">
              {/* Design match for Provision Start Date */}
              <div className="flex flex-col gap-2 relative" ref={provStartRef}>
                <label className="text-gray-700 text-sm font-weight-500">
                  Hire Start Date
                </label>
                <div
                  onClick={() =>
                    setShowProvisionStartPicker(!showProvisionStartPicker)
                  }
                  className="h-[52px] px-5 bg-white border border-gray-200 rounded flex items-center justify-between cursor-pointer"
                >
                  <span
                    className={`font-light font-weight-300 ${currentVehicle.hireOutDate ? "text-gray-900" : "text-gray-400"}`}
                  >
                    {currentVehicle.hireOutDate || "Select Date"}
                  </span>
                  <img src={Vector6} alt="" />
                </div>
                {showProvisionStartPicker && (
                  <div className="absolute bottom-[54px] left-0 z-100">
                    <CustomDatePicker
                      selectedDate={
                        currentVehicle.hireOutDate
                          ? new Date(currentVehicle.hireOutDate)
                          : new Date()
                      }
                      onDateSelect={(date) => {
                        formik.setFieldValue(
                          `thirdPartyVehicles[${activeVehicleTab}].hireOutDate`,
                          date.toISOString().split("T")[0],
                        );
                        setShowProvisionStartPicker(false);
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Design match for Provision End Date */}
              <div className="flex flex-col gap-2 relative" ref={provEndRef}>
                <label className="text-gray-700 text-sm font-weight-500">
                  Hire End Date
                </label>
                <div
                  onClick={() =>
                    setShowProvisionEndPicker(!showProvisionEndPicker)
                  }
                  className="h-[52px] px-5 bg-white border border-gray-200 rounded flex items-center justify-between cursor-pointer"
                >
                  <span
                    className={`font-light font-weight-300 ${currentVehicle.hireBackDate ? "text-gray-900" : "text-gray-400"}`}
                  >
                    {currentVehicle.hireBackDate || "Select Date"}
                  </span>
                  <img src={Vector6} alt="" />
                </div>
                {showProvisionEndPicker && (
                  <div className="absolute bottom-[54px] left-0 z-100">
                    <CustomDatePicker
                      selectedDate={
                        currentVehicle.hireBackDate
                          ? new Date(currentVehicle.hireBackDate)
                          : new Date()
                      }
                      onDateSelect={(date) => {
                        formik.setFieldValue(
                          `thirdPartyVehicles[${activeVehicleTab}].hireBackDate`,
                          date.toISOString().split("T")[0],
                        );
                        setShowProvisionEndPicker(false);
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          </SectionWrapper>

          {/* Section: Hire Period */}
          <SectionWrapper title="Hire Period">
            <div className="grid grid-cols-2 gap-5 mb-5">
              <div className="flex flex-col gap-2 relative" ref={hireOutRef}>
                <label className="text-gray-700 text-sm font-weight-500">
                  Hire Out Date & Time
                </label>
                <div
                  onClick={() => setShowHireOutPicker(!showHireOutPicker)}
                  className="h-[52px] px-5 bg-white border border-gray-200 rounded flex items-center justify-between cursor-pointer"
                >
                  <span
                    className={`font-light font-weight-300 ${currentVehicle.hireOutDate ? "text-gray-900" : "text-gray-400"}`}
                  >
                    {currentVehicle.hireOutDate || "Select Date"}
                  </span>
                  <img src={Vector6} alt="" />
                </div>
                {showHireOutPicker && (
                  <div className="absolute bottom-[54px] left-0 z-100">
                    <CustomDatePicker
                      selectedDate={
                        currentVehicle.hireOutDate
                          ? new Date(currentVehicle.hireOutDate)
                          : new Date()
                      }
                      onDateSelect={(date) => {
                        formik.setFieldValue(
                          `thirdPartyVehicles[${activeVehicleTab}].hireOutDate`,
                          date.toISOString().split("T")[0],
                        );
                        setShowHireOutPicker(false);
                      }}
                    />
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-2 relative" ref={hireBackRef}>
                <label className="text-gray-700 text-sm font-weight-500">
                  Hire Back Date & Time
                </label>
                <div
                  onClick={() => setShowHireBackPicker(!showHireBackPicker)}
                  className="h-[52px] px-5 bg-white border border-gray-200 rounded flex items-center justify-between cursor-pointer"
                >
                  <span
                    className={`font-light font-weight-300 ${currentVehicle.hireBackDate ? "text-gray-900" : "text-gray-400"}`}
                  >
                    {currentVehicle.hireBackDate || "Select Date"}
                  </span>
                  <img src={Vector6} alt="" />
                </div>
                {showHireBackPicker && (
                  <div className="absolute bottom-[54px] left-0 z-100">
                    <CustomDatePicker
                      selectedDate={
                        currentVehicle.hireBackDate
                          ? new Date(currentVehicle.hireBackDate)
                          : new Date()
                      }
                      onDateSelect={(date) => {
                        formik.setFieldValue(
                          `thirdPartyVehicles[${activeVehicleTab}].hireBackDate`,
                          date.toISOString().split("T")[0],
                        );
                        setShowHireBackPicker(false);
                      }}
                    />
                  </div>
                )}
              </div>
              <InputField
                label="Number of Days Hire So Far"
                value={currentVehicle.no_of_days_hired.toString()}
                disabled
              />
              <InputField
                label="Final Total Number of Hire Days"
                value={currentVehicle.total_no_of_days_hired.toString()}
                disabled
              />
            </div>
          </SectionWrapper>

          {/* Section: ABI Hire Charges */}
          <SectionWrapper title="ABI Hire Charges">
            <div className="mb-5">
              <RadioGroup
                label="ABI Insurer?"
                value={currentVehicle.abi_insured}
                onChange={(val) =>
                  formik.setFieldValue(
                    `thirdPartyVehicles[${activeVehicleTab}].abi_insured`,
                    val,
                  )
                }
              />
            </div>
            <div
              className={`grid grid-cols-2 gap-5 mb-5 ${!currentVehicle.abi_insured ? "opacity-50 pointer-events-none" : ""}`}
            >
              <InputField
                label="ABI Hire Charge Per Day"
                value={currentVehicle.abi_hire_charge_per_day.toString()}
                disabled
              />
              <InputField
                label="Extra Charges Per Day"
                value={currentVehicle.extra_charge_per_day.toString()}
                onChange={(e) =>
                  formik.setFieldValue(
                    `thirdPartyVehicles[${activeVehicleTab}].extra_charge_per_day`,
                    e.target.value,
                  )
                }
              />
              <Dropdown
                label="Admin Fee Type"
                options={adminFeeType}
                value={currentVehicle.admin_fee_type}
                onChange={(opt) =>
                  formik.setFieldValue(
                    `thirdPartyVehicles[${activeVehicleTab}].admin_fee_type`,
                    opt.value,
                  )
                }
              />
              <InputField
                label="Administration Fee"
                value={currentVehicle.administration_fee.toString()}
                disabled
              />
              <InputField
                label="Total ABI Hire Charges"
                value={`£${currentVehicle.total_abi_hire_charge}`}
                disabled
              />
            </div>
          </SectionWrapper>

          {/* Section: BHR Hire Charges */}
          <SectionWrapper title="BHR Hire Charges & Administration Fee Details">
            <div className="grid grid-cols-2 gap-5 mb-5">
              <InputField
                label="BHR Hire Charge Per Day"
                value={currentVehicle.bhr_hire_charge_per_day.toString()}
                disabled
              />
              <InputField
                label="Extra Charges Per Day"
                value={currentVehicle.bhr_extra_charge_per_day.toString()}
                onChange={(e) =>
                  formik.setFieldValue(
                    `thirdPartyVehicles[${activeVehicleTab}].bhr_extra_charge_per_day`,
                    e.target.value,
                  )
                }
              />
              <InputField
                label="Administration Fee"
                value={currentVehicle.bhr_administration_fee.toString()}
                onChange={(e) =>
                  formik.setFieldValue(
                    `thirdPartyVehicles[${activeVehicleTab}].bhr_administration_fee`,
                    e.target.value,
                  )
                }
              />
              <InputField
                label="CDW Charges"
                value={(15 * currentVehicle.total_no_of_days_hired).toString()}
                disabled
              />
              <InputField
                label="Collection & Delivery Fee"
                value={currentVehicle.collection_and_delivery_fee.toString()}
                onChange={(e) =>
                  formik.setFieldValue(
                    `thirdPartyVehicles[${activeVehicleTab}].collection_and_delivery_fee`,
                    e.target.value,
                  )
                }
              />
              <InputField
                label="Total BHR Charges"
                value={`£${currentVehicle.total_bhr_charge}`}
                disabled
              />
            </div>
          </SectionWrapper>
        </div>
      </FormikProvider>
      {showCheckoutModal && (
        <CheckoutModal
          isOpen={showCheckoutModal}
          onClose={() => setShowCheckoutModal(false)}
          onSave={(capturedFormData) => {
            const todayStr = new Date().toISOString().split("T")[0];

            // 1. Update the current vehicle being off-hired
            formik.setFieldValue(
              `thirdPartyVehicles[${activeVehicleTab}].hireBackDate`,
              todayStr,
            );
            formik.setFieldValue(
              `thirdPartyVehicles[${activeVehicleTab}].hire_vehicle_status_id`,
              2,
            ); // Value 2 for Off Hire

            // 2. Store the cleanliness/damage data into the form state
            setFormData(capturedFormData);

            // 3. UI logic
            setShowCheckoutModal(false);
            setShowActionPopup(false);
            setShowSwapBanner(true); // Display the banner since it now has an end date

            toast.success(
              switchVehicle
                ? "Vehicle off-hired. You can now On-Hire the new vehicle."
                : "Vehicle off-hired successfully.",
            );
          }}
          formData={formData}
          setFormData={setFormData}
          step={modalStep}
          setStep={setModalStep}
        />
      )}
    </>
  );
};;;;;

// --- Sub-components (Design Unchanged) ---
const SectionWrapper: React.FC<{ title: string; children: React.ReactNode; actionIcon?: React.ReactNode }> = ({ title, children, actionIcon }) => (
  <div className="w-full p-5 rounded-lg border border-slate-100 flex flex-col gap-4">
    <div className="flex justify-between items-center w-full">
      <h3 className="text-black text-xl font-weight-600 leading-5">{title}</h3>
      {actionIcon}
    </div>
    <div className="w-full h-px bg-slate-100" />
    <div className="pt-2">{children}</div>
  </div>
);

const InputField: React.FC<{ label: string; value: string; onChange?: any; disabled?: boolean }> = ({ label, value, onChange, disabled }) => (
  <div className="flex flex-col gap-2 w-full">
    <label className="text-slate-700 text-sm font-weight-400">{label}</label>
    <input type="text" value={value} onChange={onChange} disabled={disabled} className={`px-5 py-3 border border-slate-200 rounded text-base font-light ${disabled ? "bg-slate-50" : "bg-white"}`} />
  </div>
);

const Dropdown: React.FC<{ label: string; options: any; value: any; onChange: any }> = ({ label, options, value, onChange }) => (
  <div className="flex flex-col gap-2 w-full">
    <label className="text-gray-700 text-sm font-weight-400">{label}</label>
    <Select options={options} value={options.find((o: any) => o.value === value)} onChange={onChange} styles={customStyles} components={{ DropdownIndicator: BlueDropdownIndicator, IndicatorSeparator: () => null }} />
  </div>
);

const RadioGroup: React.FC<{ label: string; value: boolean; onChange: (v: boolean) => void }> = ({ label, value, onChange }) => (
  <div className="flex flex-col gap-5 w-full">
    <label className="text-black text-sm font-weight-400">{label}</label>
    <div className="flex gap-5">
      <div onClick={() => onChange(true)} className="flex items-center gap-2 cursor-pointer">
        <img src={value === true ? Yes : No} alt="radio" /> <span>Yes</span>
      </div>
      <div onClick={() => onChange(false)} className="flex items-center gap-2 cursor-pointer">
        <img src={value === false ? Yes : No} alt="radio" /> <span>No</span>
      </div>
    </div>
  </div>
);