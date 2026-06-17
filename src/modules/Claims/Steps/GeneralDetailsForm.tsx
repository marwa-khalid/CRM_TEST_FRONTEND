import {
  useState,
  useEffect,
  useRef,
} from "react";
import Select, {
  components,
  type DropdownIndicatorProps,
  type StylesConfig,
} from "react-select";
import { useFormik } from "formik";
import * as Yup from "yup";
import { toast } from "react-toastify";
import { useParams } from "react-router-dom";
// Assets & Icons
import Vector5 from "../../../assets/AutoClaim_icon/Vector-5.svg";
import Vector9 from "../../../assets/AutoClaim_icon/Vector-9.svg";
import Vector10 from "../../../assets/AutoClaim_icon/Vector-10.svg";
import Vector6 from "../../../assets/AutoClaim_icon/Vector-6.svg";
import Yes from "../../../assets/AutoClaim_icon/Yes.svg";
import No from "../../../assets/AutoClaim_icon/No.svg";

// Services & Redux
import {
  ClaimsApi,
  getClaimById,
  notifyManager,
  type ClaimFormPayload,
} from "../../../services/Claims/Claims";
import {
  closeFile,
  getCaseStatuses,
} from "../../../services/Lookups/Generaldetails";
import { CustomDatePicker } from "../Components/DatePicker";

// Custom Blue Arrow Component for react-select
export const BlueDropdownIndicator = (props: DropdownIndicatorProps<any, false>) => {
  return (
    <components.DropdownIndicator {...props}>
      <img src={Vector10} className="w-9 h-2" alt="arrow" />
    </components.DropdownIndicator>
  );
};

// Common custom styles for react-select
export const customStyles: StylesConfig<any, false> = {
  control: (base, state) => ({
    ...base,
    minHeight: "52px",
    height: "52px",
    borderRadius: "4px",
    borderWidth: state.isFocused ? "2px" : "1px",
    borderColor: state.isFocused ? "#0352FD" : "#e5e7eb",
    boxShadow: "none",
    paddingLeft: "8px",
    backgroundColor: "white",
    fontSize: "14px",
    fontWeight: 400, // ✅ normal
    fontFamily: "'Stack Sans Headline', sans-serif",
  }),

  valueContainer: (provided) => ({
    ...provided,
    fontFamily: "'Stack Sans Headline', sans-serif",
    fontSize: "16px",
    fontWeight: 400, // ✅ normal
  }),

  input: (provided) => ({
    ...provided,
    fontFamily: "'Stack Sans Headline', sans-serif",
    fontWeight: 400, // ✅ force normal
    fontSize: "16px",
  }),

  placeholder: (provided) => ({
    ...provided,
    fontFamily: "'Stack Sans Headline', sans-serif",
    color: "#a6aab1",
    fontWeight: 400, // ✅ not bold
    fontSize: "16px",
    opacity: 1,
  }),

  singleValue: (provided) => ({
    ...provided,
    fontFamily: "'Stack Sans Headline', sans-serif",
    fontWeight: 400, // ✅ IMPORTANT (selected value)
    fontSize: "16px",
    color: "#444444",
  }),

  option: (provided, state) => ({
    ...provided,
    fontFamily: "'Stack Sans Headline', sans-serif",
    fontSize: "14px",
    fontWeight: 400, // ✅ IMPORTANT (dropdown items)
    color: state.isSelected ? "#fff" : state.isFocused ? "#286CFF" : "#444444",
    backgroundColor: state.isSelected
      ? "#286CFF"
      : state.isFocused
        ? "#d9ebff"
        : "white",
    cursor: "pointer",
  }),

  menu: (provided) => ({
    ...provided,
    fontFamily: "'Stack Sans Headline', sans-serif",
    fontWeight: 400,
  }),

  menuList: (provided) => ({
    ...provided,
    fontFamily: "'Stack Sans Headline', sans-serif",
    fontWeight: 400,
  }),
};
// --- COMPONENT ---
const GeneralDetailsForm = ({ formRef, claimId, onClaimCreated }: any) => {
  const { id } = useParams();
  const [fileClosedOn, setFileClosedOn] = useState<any>(null);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [closureReason, setClosureReason] = useState("");
  // Rejection reason is captured in a popup when the status is set to "Rejected".
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectDraft, setRejectDraft] = useState("");
  const [showPicker, setShowPicker] = useState(false);
  // Case statuses loaded from the backend so ALL options show (not a hardcoded subset).
  const [caseStatusOptions, setCaseStatusOptions] = useState<{ value: number; label: string }[]>([]);
  useEffect(() => {
    getCaseStatuses()
      .then((r: any) => {
        const rows = Array.isArray(r?.data) ? r.data : [];
        setCaseStatusOptions(rows.map((cs: any) => ({ value: cs.id, label: cs.label })));
      })
      .catch(() => setCaseStatusOptions([]));
  }, []);
     const datepickerRef = useRef<HTMLDivElement>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
  
useEffect(() => {
  const handleClickOutside = (event: MouseEvent) => {
    if (
      datepickerRef.current &&
      !datepickerRef.current.contains(event.target as Node)
    ) {
      setShowPicker(false);
    }
  };

  // Check if showPicker is true before adding (optional but better)
  if (showPicker) {
    document.addEventListener("mousedown", handleClickOutside);
  }

  // Cleanup: This is crucial to prevent memory leaks
  return () => {
    document.removeEventListener("mousedown", handleClickOutside);
  };
}, [showPicker]); // Re-run effect when showPicker changes
  const claimTypeOptions = [
    { value: 1, label: "RTA - NA" },
    { value: 2, label: "RTA - CAMS" },
    { value: 3, label: "Direct Hire - NA" },
    { value: 4, label: "Direct Hire - CAMS" },
    { value:5, label: "PI Only RTA - CAMS" },
    { value: 6, label: "PI Only RTA - NA" },
  ];
  const positionOptions = [
    { value: 1, label: "Awaiting Accident Details" },
    { value: 2, label: "Client is at Fault" },
    {
      value: 3,
      label: "Awaiting Engineer to Inspect Client’s Vehicle",
    },
    { value: 4, label: "Others" },
  ];
  const handlerOptions = [
    { value:1, label: "Imran Dean" },
    { value: 2, label: "Ruby Uddin" },
    { value:3, label: "Hina Sadaf" },
    { value: 4, label: "Akeel Rehman" },
    { value: 5, label: "Alex Berwick" },
    { value:6, label: "Gary Fellows" },
  ];

  const findUsOptions = [
    { value: 1, label: "Existing Account" },
    { value: 2, label: "Driver Referral" },
    { value: 3, label: "Staff Marketing" },
    { value:4, label: "Google Marketing" },
    { value:5, label: "Organic" },
  ];

  const commonStatusOptions = [
    { value: "YES", label: "Yes" },
    { value:"NO", label: "No" },
    { value: "TBC", label: "TBC" },
  ];
  useEffect(() => {
     const fetchData = async () => {
    setIsAnalyzing(true);
       
       const res = await getClaimById(parseInt(claimId))
       const formData= {
          ...res,
          credit_hire_accepted: res.credit_hire_accepted ?"Yes" :"No",
          client_going_abroad: res.client_going_abroad ? "Yes" :"No"
        };
       formik.setValues(formData);
    setIsAnalyzing(false);

     }
     if (claimId) {
       fetchData();
     }
      }, []);

  const formik = useFormik({
    initialValues: {
      id: claimId || 0,
      claim_type_id: null,
      handler_id: null,
      is_locked: false,
      target_debt_id: null,
      source_id: null,
      source_staff_user_id: null,
      case_status_id: null,
      rejection_reason: "",
      credit_hire_accepted: "No",
      non_fault_accident: "NO",
      any_passengers: "NO",
      client_injured: "NO",
      prospects_id: null,
      present_position_id: null,
      client_going_abroad: "No",
      abroad_date: null,
    },

    validationSchema: Yup.object().shape({}),
    onSubmit: async (values: any) => {
      try {
    setIsAnalyzing(true);

        const payload: ClaimFormPayload = {
          ...values,
          file_opened_on: new Date().toLocaleDateString("sv-SE"),
          credit_hire_accepted: values.credit_hire_accepted === "Yes" ? true : false,
          client_going_abroad: values.client_going_abroad === "Yes" ? true : false
        };
        if (values.id) {
          const response = await ClaimsApi.updateClaim(
            parseInt(claimId),
            payload,
          );
          onClaimCreated?.(response.id);
          if (response.claim_type_id) {
            localStorage.setItem(
              "claimType",
              claimTypeOptions.find((opt) => opt.value === response.claim_type_id)
                .label,
            );
          }
        } else {
          const response = await ClaimsApi.submitClaim(payload);
          onClaimCreated?.(response.id);
          localStorage.setItem(
            "claimType",
            claimTypeOptions.find((opt) => opt.value === response.claim_type_id)
              .label,
          );
        }
        toast.success("General Details saved successfully");
      } catch (error) {
        toast.error("Error saving details");
        throw error; // 🔥 important so step doesn't move
      }finally{


    setIsAnalyzing(false);

      }
    },
  });
  // 🔥 expose formik to parent
useEffect(() => {
  if (formRef) {
    formRef.current = formik;
  }
}, [formRef, formik]);

  const handleNotifyManager = async () => {
    try {
      await notifyManager(parseInt(formik.values.id));
      toast.success("Manager Notified");
    } catch (e) {
      toast.error("Failed to notify manager");
    }
  };

  const handleCloseFile = async () => {
    try {
      await closeFile({ reason: closureReason, claim_id: parseInt(claimId) });
      // setIsClosed(true);
      setFileClosedOn(
        new Date().toLocaleDateString("sv-SE"),
      );
      setShowCloseModal(false);
      toast.success("File closed successfully");
      // navigate("/dashboard")
    } catch (e) {
      toast.error("Failed to close file");
    }
  };
  return (
   <div className="MainContent w-full flex flex-col items-start gap-6 py-1 font-['Stack_Sans_Headline']">
      <h1 className="text-neutral-900 text-[24px] font-weight-600">General Details</h1>
      {isAnalyzing && (
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
      <div className="w-full flex flex-col gap-6">
        {/* --- CASE DETAILS SECTION --- */}
        <div className="CaseDetailsSection self-stretch p-5 rounded-lg border border-gray-100 flex flex-col gap-4">
          <h2 className="text-black text-[20px] font-weight-600 leading-5">
            Case Details
          </h2>
          <div className="h-px bg-gray-100 w-full" />

          <div className="grid grid-cols-2 gap-x-5 gap-y-4">
            {/* 1. Claim Type */}
            <div className="flex flex-col gap-2">
              <label className="text-neutral-700 text-[14px] font-weight-500">
                Claim type
              </label>
              <Select
                options={claimTypeOptions}
                placeholder="Select Claim Type"
                // className="text-sm text-darkGray font-weight-100"
                value={claimTypeOptions.find(
                  (option) => option.value === formik.values.claim_type_id,
                )} // Controlled from step1Data
                styles={customStyles}
                onChange={(val) =>
                  formik.setFieldValue("claim_type_id", val.value)
                }
                components={{
                  DropdownIndicator: BlueDropdownIndicator,
                  IndicatorSeparator: () => null,
                }}
              />
            </div>

            {/* 2. Handler */}
            <div className="flex flex-col gap-2">
              <label className="text-neutral-700 text-[14px] font-weight-500">
                Handler
              </label>
              <Select
                options={handlerOptions}
                placeholder="Select Handler"
                styles={customStyles}
                value={handlerOptions.find(
                  (option) => option.value === formik.values.handler_id,
                )} // Controlled from step1Data
                onChange={(val) =>
                  formik.setFieldValue("handler_id", val.value)
                }
                components={{
                  DropdownIndicator: BlueDropdownIndicator,
                  IndicatorSeparator: () => null,
                }}
              />
            </div>

            {/* 3. Target Debt */}
            <div className="flex flex-col gap-2">
              <label className="text-neutral-700 text-[14px] font-weight-500">
                Target Debt
              </label>
              <Select
                options={[
                  { value: 1, label: "Target" },
                  { value: 2, label: "Non-Target" },
                ]}
                placeholder="Select Target Debt"
                styles={customStyles}
                value={[
                  { value: 1, label: "Target" },
                  { value: 2, label: "Non-Target" },
                ].find(
                  (option) => option.value === formik.values.target_debt_id,
                )} // Controlled from step1Data
                onChange={(val) =>
                  formik.setFieldValue("target_debt_id", val.value)
                }
                components={{
                  DropdownIndicator: BlueDropdownIndicator,
                  IndicatorSeparator: () => null,
                }}
              />
            </div>

            {/* 4. How Did Customer Find Us? */}
            <div className="flex flex-col gap-2">
              <label className="text-neutral-700 text-[14px] font-weight-500">
                How did the customer find us?
              </label>
              <Select
                options={findUsOptions}
                value={findUsOptions.find(
                  (option) => option.value === formik.values.source_id,
                )} // Controlled from step1Data
                placeholder="Select Source"
                onChange={(val) => formik.setFieldValue("source_id", val.value)}
                styles={customStyles}
                components={{
                  DropdownIndicator: BlueDropdownIndicator,
                  IndicatorSeparator: () => null,
                }}
              />
            </div>
            {/* CONDITIONAL: Staff Member Name (Appears when Staff Marketing selected) */}
            {formik.values.source_id === 3 && (
              <div className="col-span-2 flex flex-col gap-2 animate-in fade-in duration-300">
                <label className="text-neutral-700 text-[14px] font-weight-500">
                  Staff Member Name
                </label>
                <Select
                  placeholder="Select Staff Member..."
                  styles={customStyles}
                  options={handlerOptions}
                  value={handlerOptions.find(
                    (option) =>
                      option.value === formik.values.source_staff_user_id,
                  )} // Controlled from step1Data
                  onChange={(val) =>
                    formik.setFieldValue("source_staff_user_id", val.value)
                  }
                  components={{
                    DropdownIndicator: BlueDropdownIndicator,
                    IndicatorSeparator: () => null,
                  }}
                />
              </div>
            )}

            {/* 5. Case Status */}
            <div className="flex flex-col gap-2">
              <label className="text-neutral-700 text-[14px] font-weight-500">
                Case Status
              </label>
              <Select
                options={caseStatusOptions}
                value={
                  caseStatusOptions.find(
                    (option) => option.value === formik.values.case_status_id,
                  ) || null
                } // Controlled from step1Data
                onChange={(val) => {
                  formik.setFieldValue("case_status_id", val?.value ?? null);
                  // Pop up the rejection-reason box when the status becomes Rejected.
                  if ((val?.label || "").toLowerCase() === "rejected") {
                    setRejectDraft(formik.values.rejection_reason || "");
                    setRejectModalOpen(true);
                  }
                }}
                placeholder="Select Status"
                styles={customStyles}
                components={{
                  DropdownIndicator: BlueDropdownIndicator,
                  IndicatorSeparator: () => null,
                }}
              />
            </div>

            {/* 5b. Rejection Reason — opens in a popup when the status is "Rejected" */}
            {(
              caseStatusOptions
                .find((o) => o.value === formik.values.case_status_id)
                ?.label || ""
            ).toLowerCase() === "rejected" && (
              <div className="flex flex-col gap-2">
                <label className="text-neutral-700 text-[14px] font-weight-500">
                  Rejection Reason
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setRejectDraft(formik.values.rejection_reason || "");
                    setRejectModalOpen(true);
                  }}
                  className="w-full text-left px-4 py-3 rounded border border-neutral-200 text-[14px] outline-none hover:border-blue-500"
                >
                  {formik.values.rejection_reason ? (
                    <span className="block truncate text-neutral-700">
                      {formik.values.rejection_reason}
                    </span>
                  ) : (
                    <span className="text-neutral-300">
                      Add rejection reason...
                    </span>
                  )}
                </button>
              </div>
            )}

            {/* 6. Credit Hire Accepted? (Radio) */}
            <div className="flex flex-col gap-2">
              <label className="text-neutral-700 text-[14px] font-weight-500">
                Credit Hire Accepted?
              </label>
              <div className="flex gap-6 items-center h-[52px]">
                {["Yes", "No"].map((option) => (
                  <label
                    key={option}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <div className="relative flex items-center justify-center">
                      <input
                        type="radio"
                        name="credit_hire_accepted"
                        className="sr-only"
                        checked={formik.values.credit_hire_accepted === option}
                        onChange={() =>
                          formik.setFieldValue("credit_hire_accepted", option)
                        }
                      />
                      {formik.values.credit_hire_accepted === option ? (
                        <img src={Yes} />
                      ) : (
                        <img src={No} />
                      )}
                    </div>
                    <span className="text-black text-sm">{option}</span>
                  </label>
                ))}
                {/* <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="credit_hire_accepted"
                    className="w-5 h-5 accent-blue-500"
                    checked={formik.values.credit_hire_accepted}
                    onChange={() =>
                      formik.setFieldValue("credit_hire_accepted", true)
                    }
                  />
                  <span className="text-sm">Yes</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="credit_hire_accepted"
                    className="w-5 h-5 accent-blue-500"
                    checked={!formik.values.credit_hire_accepted}
                    onChange={() =>
                      formik.setFieldValue("credit_hire_accepted", false)
                    }
                  />
                  <span className="text-sm">No</span>
                </label> */}
              </div>
            </div>

            {/* 7. Non-Fault Accident? */}
            <div className="flex flex-col gap-2">
              <label className="text-neutral-700 text-[14px] font-weight-500">
                Non-Fault Accident?
              </label>
              <Select
                options={commonStatusOptions}
                styles={customStyles}
                value={commonStatusOptions.find(
                  (option) => option.value === formik.values.non_fault_accident,
                )} // Controlled from step1Data
                onChange={(val) =>
                  formik.setFieldValue("non_fault_accident", val.value)
                }
                components={{
                  DropdownIndicator: BlueDropdownIndicator,
                  IndicatorSeparator: () => null,
                }}
              />
            </div>

            {/* 8. Any Passengers? */}
            <div className="flex flex-col gap-2">
              <label className="text-neutral-700 text-[14px] font-weight-500">
                Any Passengers?
              </label>
              <Select
                options={commonStatusOptions}
                styles={customStyles}
                value={commonStatusOptions.find(
                  (option) => option.value === formik.values.any_passengers,
                )} // Controlled from step1Data
                onChange={(val) =>
                  formik.setFieldValue("any_passengers", val.value)
                }
                components={{
                  DropdownIndicator: BlueDropdownIndicator,
                  IndicatorSeparator: () => null,
                }}
              />
            </div>

            {/* 9. Client Injured? */}
            <div className="flex flex-col gap-2">
              <label className="text-neutral-700 text-[14px] font-weight-500">
                Client Injured?
              </label>
              <Select
                options={commonStatusOptions}
                styles={customStyles}
                value={commonStatusOptions.find(
                  (option) => option.value === formik.values.client_injured,
                )} // Controlled from step1Data
                onChange={(val) =>
                  formik.setFieldValue("client_injured", val.value)
                }
                components={{
                  DropdownIndicator: BlueDropdownIndicator,
                  IndicatorSeparator: () => null,
                }}
              />
            </div>

            {/* 10. Prospects of File */}
            <div className="flex flex-col gap-2">
              <label className="text-neutral-700 text-[14px] font-weight-500">
                Prospects of File
              </label>
              <Select
                options={[
                  { value: 1, label: "50/50 Fault" },
                  { value: 2, label: "Non-Fault" },
                  { value: 3, label: "TP Uninsured" },
                ]}
                value={[
                  { value: 1, label: "50/50 Fault" },
                  { value: 2, label: "Non-Fault" },
                  { value: 3, label: "TP Uninsured" },
                ].find((option) => option.value === formik.values.prospects_id)} // Controlled from step1Data
                onChange={(val) =>
                  formik.setFieldValue("prospects_id", val.value)
                }
                placeholder="Select Prospect"
                styles={customStyles}
                components={{
                  DropdownIndicator: BlueDropdownIndicator,
                  IndicatorSeparator: () => null,
                }}
              />
            </div>
          </div>
        </div>

        {/* --- POSITION DETAILS --- */}
        <div className="PositionSection p-5 self-stretch rounded-lg border border-gray-100 flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <h2 className="text-neutral-900 text-[20px] font-weight-600">
              Position Details
            </h2>
            <button
              type="button"
              onClick={() => setShowCloseModal(true)}
              className="flex gap-1 items-center px-4 py-2 bg-blue-50 text-blue-600 rounded-md font-weight-500  text-sm"
            >
              <img src={Vector9} alt="" /> Close File
            </button>
          </div>
          <div className="h-px bg-gray-100 w-full" />
          <div className="grid grid-cols-2 gap-5">
            <div className="flex flex-col gap-2">
              <label className="text-neutral-700 text-[14px] font-weight-500">
                File Opened On
              </label>
              <div className="h-[52px] px-5 bg-gray-50 rounded border border-gray-200 flex items-center justify-between text-gray-500">
                <span>{new Date().toLocaleDateString("sv-SE")}</span>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-neutral-700 text-[14px] font-weight-500">
                Claim Entrants Username
              </label>
              <div className="h-[52px] px-5 bg-gray-50 rounded border border-gray-200 flex items-center text-gray-500">
                <span>
                  {
                    handlerOptions.find(
                      (option) => option.value === formik.values.handler_id,
                    )?.label
                  }
                </span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-5">
            <div className="flex flex-col gap-2">
              <label className="text-neutral-700 text-[14px] font-weight-500">
                File Closed On
              </label>
              <div className="h-[52px] px-5 bg-gray-50 rounded border border-gray-200 flex items-center justify-between text-gray-500">
                <span>{fileClosedOn}</span>
              </div>
            </div>
          </div>
        </div>

        {/* --- PRESENT POSITION --- */}
        <div className="PresentFilePositionSection p-5 rounded-lg border border-gray-100 flex flex-col gap-4 mb-10">
          <div className="flex justify-between items-center">
            <h2 className="text-neutral-900 text-[20px] font-weight-600">
              Present File Position
            </h2>
            {formik.values.client_going_abroad==="Yes" && (
              <button
                type="button"
                onClick={handleNotifyManager}
                className="flex gap-1 items-center px-4 py-2 bg-blue-50 text-blue-600 rounded-md text-sm"
              >
                <img src={Vector5} alt="" /> Notify Manager
              </button>
            )}
          </div>
          <div className="h-px bg-gray-100 w-full" />

          <div className="grid grid-cols-2">
            <div className="flex flex-col gap-2">
              <label className="text-neutral-700 text-[14px] font-weight-500">
                Present File Position
              </label>
              <Select
                options={positionOptions}
                styles={customStyles}
                value={positionOptions.find(
                  (option) =>
                    option.value === formik.values.present_position_id,
                )}
                placeholder="Select Present File Position"
                onChange={(val) =>
                  formik.setFieldValue("present_position_id", val?.value)
                }
                components={{
                  DropdownIndicator: BlueDropdownIndicator,
                  IndicatorSeparator: () => null,
                }}
              />
            </div>
          </div>

          <div className="h-px bg-gray-100 w-full" />
          <div className="grid grid-cols-2 items-start justify-between">
            <div className="flex flex-col gap-2">
              <span className="text-neutral-700 text-[14px] font-weight-500">
                Client going abroad soon?
              </span>
              <div className="flex gap-10 h-[52px] items-center">
                {["Yes", "No"].map((option) => (
                  <label
                    key={option}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <div className="relative flex items-center justify-center">
                      <input
                        type="radio"
                        name="client_going_abroad"
                        className="sr-only"
                        checked={formik.values.client_going_abroad === option}
                        onChange={() =>
                          formik.setFieldValue("client_going_abroad", option)
                        }
                      />
                      {formik.values.client_going_abroad === option ? (
                        <img src={Yes} />
                      ) : (
                        <img src={No} />
                      )}
                    </div>
                    <span className="text-black text-sm">{option}</span>
                  </label>
                ))}
              </div>
            </div>

            {formik.values.client_going_abroad === "Yes"  && (
              <div className="flex flex-col gap-2 relative" ref={datepickerRef}>
                <label className="text-neutral-700 text-[14px] font-weight-500">
                  Date
                </label>
                <div
                  onClick={() => setShowPicker(!showPicker)}
                  className="h-[52px] px-5 bg-white border border-gray-200 rounded flex items-center justify-between cursor-pointer"
                >
                  <span
                    className={
                      formik.values.abroad_date
                        ? "text-gray-900"
                        : "text-gray-400"
                    }
                  >
                    {formik.values.abroad_date || "Select Date"}
                  </span>
                  <img src={Vector6} alt="" />
                </div>
                {showPicker && (
                  <div className="absolute bottom-[423px] left-0 z-50">
                    <CustomDatePicker
                      selectedDate={
                        formik.values.abroad_date
                          ? new Date(formik.values.abroad_date)
                          : new Date()
                      }
                      onDateSelect={(date) => {
                        formik.setFieldValue(
                          "abroad_date",
                          date.toISOString().split("T")[0],
                        );
                        setShowPicker(false);
                      }}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Rejection Reason Modal */}
      {rejectModalOpen && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex justify-center items-center z-50">
          <div className="ModalInput p-6 bg-white rounded-lg shadow-xl inline-flex flex-col gap-5">
            <div className="d-flex flex-col gap-2">
              <h2 className="text-xl font-weight-600">Rejection Reason</h2>
              <small className="text-neutral-700 font-weight-400">
                Please provide a reason for rejecting this claim
              </small>
            </div>

            <textarea
              className="w-96 h-40 p-4 border border-gray-200 rounded-lg outline-none focus:border-blue-200 focus:ring-2 focus:ring-blue-200"
              placeholder="Reason..."
              value={rejectDraft}
              onChange={(e) => setRejectDraft(e.target.value)}
            />
            <div className="flex justify-end gap-4">
              <button
                type="button"
                onClick={() => setRejectModalOpen(false)}
                className="px-6 py-3 border border-blue-500 text-blue-500 rounded"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  formik.setFieldValue("rejection_reason", rejectDraft);
                  setRejectModalOpen(false);
                }}
                className="px-6 py-3 bg-blue-500 text-white rounded"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Close File Modal */}
      {showCloseModal && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex justify-center items-center z-50">
          <div className="ModalInput p-6 bg-white rounded-lg shadow-xl inline-flex flex-col gap-5">
            <div className="d-flex flex-col gap-2">
              <h2 className="text-xl font-weight-600">Close File</h2>
              <small className="text-neutral-700 font-weight-400">
                Please provide a reason below for closing this case
              </small>
            </div>

            <textarea
              className="w-96 h-40 p-4 border border-gray-200 rounded-lg outline-none focus:border-blue-200 focus:ring-2 focus:ring-blue-200"
              placeholder="Reason..."
              value={closureReason}
              onChange={(e) => setClosureReason(e.target.value)}
            />
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setShowCloseModal(false)}
                className="px-6 py-3 border border-blue-500 text-blue-500 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleCloseFile}
                className="px-6 py-3 bg-blue-500 text-white rounded"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default GeneralDetailsForm;