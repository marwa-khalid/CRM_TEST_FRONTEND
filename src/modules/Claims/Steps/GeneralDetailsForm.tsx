import {
  useState,
  useEffect,
  forwardRef,
  useImperativeHandle,
  useRef,
} from "react";
import Select, {
  components,
  type DropdownIndicatorProps,
  type StylesConfig,
} from "react-select";
import { Formik, Form, Field, useFormik } from "formik";
import * as Yup from "yup";
import { toast } from "react-toastify";
import { useParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import { CalendarDate } from "@internationalized/date";

// Assets & Icons
import Vector5 from "../../../assets/AutoClaim_icon/Vector-5.svg";
import Vector9 from "../../../assets/AutoClaim_icon/Vector-9.svg";
import Vector10 from "../../../assets/AutoClaim_icon/Vector-10.svg";
import Vector6 from "../../../assets/AutoClaim_icon/Vector-6.svg";

// Services & Redux
import {
  ClaimsApi,
  getClaimById,
  notifyManager,
  type ClaimFormPayload,
} from "../../../services/Claims/Claims";
import {
  closeFile,
  getPresentPositions,
} from "../../../services/Lookups/Generaldetails";
import { setClaimId, setClaimReferrence, setIsClosed } from "../../../redux/Claim/claimSlice";
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
    height: "52px",
    borderRadius: "4px",
    borderWidth: state.isFocused ? "2px" : "1px",
    borderColor: state.isFocused ? "#d9ebff" : "#CCCCCC",
    boxShadow: "none",
    paddingLeft: "8px",
    backgroundColor: "white",
    fontSize: "14px",
    fontWeight: 400,
    fontStyle: "light",
    fontFamily: "system-ui",
  }),

  input: (provided) => ({
    ...provided,
    fontWeight: 300,
    fontSize: "16px",
    fontStyle: "light",
  }),

  placeholder: (provided) => ({
    ...provided,
    color: "#D0D5DD",
    fontWeight: 300,
    fontSize: "16px",
    opacity: 1,
    fontStyle: "light",
  }),

  singleValue: (provided) => ({
    ...provided,
    fontWeight: 400,
    fontSize: "16px",
    color: "#444444",
    fontStyle: "light",
  }),

  option: (provided, state) => ({
    ...provided,
    fontSize: "14px",
    fontWeight: 400,
    color: state.isSelected ? "#fff" : state.isFocused ? "#286CFF" : "#444444",
    backgroundColor: state.isSelected
      ? "#286CFF"
      : state.isFocused
        ? "#d9ebff"
        : "white",
    cursor: "pointer",
    fontStyle: "light",
  }),
};
// --- COMPONENT ---
const GeneralDetailsForm = ({ formRef }: any) => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const formikRef = useRef<any>(null);
  const [lookups, setLookups] = useState<any>(null);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [closureReason, setClosureReason] = useState("");
  const [showPicker, setShowPicker] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
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
  const claimId = localStorage.getItem("claimId");
   useEffect(() => {
     const fetchData = async () => {
       const res = await getClaimById(parseInt(claimId))
       formik.setValues(res)
     }
     if (claimId) {
       fetchData();
     }
      }, []);

  const formik = useFormik({
    initialValues: {
      claim_id: claimId || 0,
      claim_type_id: null,
      handler_id: null,
      is_locked:false,
      target_debt_id: null,
      source_id: null,
      source_staff_user_id: null,
      case_status_id: null,
      credit_hire_accepted: false,
      non_fault_accident: "NO",
      any_passengers: "NO",
      client_injured: "NO",
      prospects_id: null,
      present_position_id: null,
      client_going_abroad: false,
      abroad_date: null,
    },

    validationSchema: Yup.object().shape({}),
    onSubmit: async (values: any) => {
      try {
        const payload: ClaimFormPayload = {
          ...values,
          file_opened_on: new Date().toISOString().split("T")[0],
        };
        console.log(payload);
        if (values.id) {
          const response = await ClaimsApi.updateClaim(
            parseInt(claimId),
            payload,
          );
          localStorage.setItem("claimId", response.id);
          localStorage.setItem(
            "claimType",
            claimTypeOptions.find(
              (opt) => opt.value === response.claim_type_id,
            ).label,
          );

        } else {
          const response = await ClaimsApi.submitClaim(payload);
          localStorage.setItem("claimId", response.id);
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
      }
    },
  });
  // 🔥 expose formik to parent
useEffect(() => {
  if (formRef) {
    formRef.current = formik;
  }
}, [formRef, formik]);
console.log(formik.values)
  const handleNotifyManager = async () => {
    try {
      await notifyManager(parseInt(claimId));
      toast.success("Manager Notified");
    } catch (e) {
      toast.error("Failed to notify manager");
    }
  };

  const handleCloseFile = async () => {
    try {
      await closeFile({ reason: closureReason, claim_id: parseInt(claimId) });
      setIsClosed(true);
      setShowCloseModal(false);
      toast.success("File closed successfully");
    } catch (e) {
      toast.error("Failed to close file");
    }
  };
  return (
    <div className="MainContent w-[788px] ms-[140px] flex-1 inline-flex flex-col items-start gap-6 p-8 overflow-y-auto scrollbar-hide font-['Stack_Sans_Headline']">
      <h1 className="text-black text-2xl font-weight-600">General Details</h1>

      <div className="w-full flex flex-col gap-6">
        {/* --- CASE DETAILS SECTION --- */}
        <div className="CaseDetailsSection self-stretch p-5 rounded-lg border border-gray-100 flex flex-col gap-4">
          <h2 className="text-black text-xl font-weight-600 leading-5">
            Case Details
          </h2>
          <div className="h-px bg-gray-100 w-full" />

          <div className="grid grid-cols-2 gap-x-5 gap-y-4">
            {/* 1. Claim Type */}
            <div className="flex flex-col gap-2">
              <label className="text-gray-700 text-sm font-weight-500">
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
              <label className="text-gray-700 text-sm font-weight-500 ">
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
              <label className="text-gray-700 text-sm font-weight-500 ">
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
              <label className="text-gray-700 text-sm font-weight-500 ">
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
                <label className="text-gray-700 text-sm font-weight-500 ">
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
              <label className="text-gray-700 text-sm font-weight-500 ">
                Case Status
              </label>
              <Select
                options={[
                  { value: 1, label: "Accepted" },
                  { value: 2, label: "TBC" },
                  { value: 3, label: "Claim Rejected" },
                  { value: 4, label: "Claim Cancelled" },
                ]}
                value={[
                  { value: 1, label: "Accepted" },
                  { value: 2, label: "TBC" },
                  { value: 3, label: "Claim Rejected" },
                  { value: 4, label: "Claim Cancelled" },
                ].find(
                  (option) => option.value === formik.values.case_status_id,
                )} // Controlled from step1Data
                onChange={(val) =>
                  formik.setFieldValue("case_status_id", val.value)
                }
                placeholder="Select Status"
                styles={customStyles}
                components={{
                  DropdownIndicator: BlueDropdownIndicator,
                  IndicatorSeparator: () => null,
                }}
              />
            </div>

            {/* 6. Credit Hire Accepted? (Radio) */}
            <div className="flex flex-col gap-2">
              <label className="text-gray-700 text-sm font-weight-500 ">
                Credit Hire Accepted?
              </label>
              <div className="flex gap-6 items-center h-[52px]">
                <label className="flex items-center gap-2 cursor-pointer">
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
                </label>
              </div>
            </div>

            {/* 7. Non-Fault Accident? */}
            <div className="flex flex-col gap-2">
              <label className="text-gray-700 text-sm font-weight-500 ">
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
              <label className="text-gray-700 text-sm font-weight-500 ">
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
              <label className="text-gray-700 text-sm font-weight-500 ">
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
              <label className="text-gray-700 text-sm font-weight-500 ">
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
            <h2 className="text-black text-xl font-weight-600">
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
              <label className="text-gray-700 text-sm font-weight-500 ">
                File Opened On
              </label>
              <div className="h-[52px] px-5 bg-gray-50 rounded border border-gray-200 flex items-center justify-between text-gray-500">
                <span>{new Date().toISOString().split("T")[0]}</span>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-gray-700 text-sm font-weight-500 ">
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
        </div>

        {/* --- PRESENT POSITION --- */}
        <div className="PresentFilePositionSection p-5 rounded-lg border border-gray-100 flex flex-col gap-4 mb-10">
          <div className="flex justify-between items-center">
            <h2 className="text-black text-xl font-weight-600">
              Present File Position
            </h2>
            {formik.values.client_going_abroad && (
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
              <label className="text-gray-700 text-sm font-weight-500 ">
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
              <span className="text-gray-700 text-sm font-weight-500 ">
                Client going abroad soon?
              </span>
              <div className="flex gap-10 h-[52px] items-center">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={formik.values.client_going_abroad}
                    onChange={() =>
                      formik.setFieldValue("client_going_abroad", true)
                    }
                    className="w-5 h-5 accent-blue-500"
                  />
                  <span className="text-sm">Yes</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={!formik.values.client_going_abroad}
                    onChange={() =>
                      formik.setFieldValue("client_going_abroad", false)
                    }
                    className="w-5 h-5 accent-blue-500"
                  />
                  <span className="text-sm">No</span>
                </label>
              </div>
            </div>

            {formik.values.client_going_abroad && (
              <div className="flex flex-col gap-2 relative" ref={containerRef}>
                <label className="text-gray-700 text-sm font-weight-500 ">
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
                  <div className="absolute bottom-[60px] left-0 z-50">
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

      {/* Close File Modal */}
      {showCloseModal && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex justify-center items-center z-50">
          <div className="ModalInput p-6 bg-white rounded-lg shadow-xl inline-flex flex-col gap-5">
            <div className="d-flex flex-col gap-2">
              {" "}
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