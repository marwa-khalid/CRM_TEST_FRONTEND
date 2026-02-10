import Select, { components, type DropdownIndicatorProps, type StylesConfig } from "react-select";
import Vector5 from '../../../assets/AutoClaim_icon/Vector-5.svg'
import Vector9 from "../../../assets/AutoClaim_icon/Vector-9.svg";
import Vector6 from "../../../assets/AutoClaim_icon/Vector-6.svg";
import { useEffect, useRef, useState } from "react";
import { CustomDatePicker } from "../Components/DatePicker";

// Custom Blue Arrow Component for react-select
const BlueDropdownIndicator = (props: DropdownIndicatorProps<any, false>) => {
  return (
    <components.DropdownIndicator {...props}>
      <svg
        width="12"
        height="7"
        viewBox="0 0 12 7"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M1 1L6 6L11 1"
          stroke="#3B82F6"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </components.DropdownIndicator>
  );
};

// Common custom styles for react-select
const customStyles: StylesConfig<any, false> = {
  control: (base, state) => ({
    ...base,
    height: '52px',
    borderRadius: '4px',
    borderColor: state.isFocused ? '#3B82F6' : '#E5E7EB',
    boxShadow: 'none',
    '&:hover': { borderColor: '#3B82F6' },
    paddingLeft: '8px',
    backgroundColor: 'white',
  }),
  placeholder: (base) => ({
    ...base,
    color: '#9CA3AF',
    fontWeight: '300',
    fontSize: '16px',
  }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isSelected ? '#3B82F6' : state.isFocused ? '#EFF6FF' : 'white',
    color: state.isSelected ? 'white' : '#374151',
  }),
};

export const GeneralDetailsForm = () => {
  const usePersistedStep = <T,>(
    key: string,
    defaultValue: T,
  ): [T, (val: T | ((prev: T) => T)) => void] => {
    const [state, setState] = useState<T>(() => {
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : defaultValue;
    });

    useEffect(() => {
      localStorage.setItem(key, JSON.stringify(state));
    }, [key, state]);

    return [state, setState];
  };
  const [step1Data, setStep1Data] = usePersistedStep("step1", {
    claimType: null,
    handler: null,
    targetDebt: null,
    staffMemberName:null,
    findUsSource: null,
    caseStatus: null,
    creditHire: false,
    nonFaultAccident:false,
    nonFault: null,
    passengers: null,
    clientInjured: null,
    prospects: null,
    goingAbroad: false,
    selectedDate: null,
    presentPosition: null,
  });
  // 2. Helper to update nested fields without losing others
  const updateField = (field: string, value: any) => {
    setStep1Data((prev) => ({ ...prev, [field]: value }));
  };
  // Options from Document
  const claimTypeOptions = [
    { value: "RTA-NA", label: "RTA - NA" },
    { value: "RTA-CAMS", label: "RTA - CAMS" },
    { value: "Direct-NA", label: "Direct Hire - NA" },
    { value: "Direct-CAMS", label: "Direct Hire - CAMS" },
    { value: "PI-CAMS", label: "PI Only RTA - CAMS" },
    { value: "PI-NA", label: "PI Only RTA - NA" },
  ];

  const handlerOptions = [
    { value: "Imran", label: "Imran Dean" },
    { value: "Ruby", label: "Ruby Uddin" },
    { value: "Hina", label: "Hina Sadaf" },
    { value: "Akeel", label: "Akeel Rehman" },
    { value: "Alex", label: "Alex Berwick" },
    { value: "Gary", label: "Gary Fellows" },
  ];

  const findUsOptions = [
    { value: "Existing", label: "Existing Account" },
    { value: "Referral", label: "Driver Referral" },
    { value: "Staff Marketing", label: "Staff Marketing" },
    { value: "Google", label: "Google Marketing" },
    { value: "Organic", label: "Organic" },
  ];

  const commonStatusOptions = [
    { value: "Yes", label: "Yes" },
    { value: "No", label: "No" },
    { value: "TBC", label: "TBC" },
  ];
  const [showPicker, setShowPicker] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close picker when clicking outside the component
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setShowPicker(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

const formatDate = (date: Date | string | null) => {
  if (!date) return "Date";

  // If it's a string (from localStorage), turn it back into a Date object
  const dateObj = typeof date === "string" ? new Date(date) : date;

  // Check if the date is valid to prevent "Invalid Date" errors
  if (isNaN(dateObj.getTime())) return "Select Date";

  return dateObj.toLocaleDateString("sv-SE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [isClosed, setIsClosed] = useState(false);
  const [closeReason, setCloseReason] = useState("");
  const [openedDate] = useState(new Date().toLocaleDateString("sv-SE"));
  const [fileClosed, setFileClosed] = useState<string | null>(null);
  const [username] = useState(""); // Example auto-gen username
  const [presentPosition, setPresentPosition] = useState<any>(null);
  const handleSubmitClose = () => {
    if (closeReason.trim()) {
      setIsClosed(true);
      setShowCloseModal(false);
      setCloseReason;
      ("");
    }
  };
  const positionOptions = [
    { value: "Awaiting Details", label: "Awaiting Accident Details" },
    { value: "Client Fault", label: "Client is at Fault" },
    {
      value: "Awaiting Engineer",
      label: "Awaiting Engineer to Inspect Client’s Vehicle",
    },
    { value: "Others", label: "Others" },
  ];

  const handleNotifyManager = () => {
    alert("Automated email sent to Claims & Fleet Group list.");
  };
  return (
    <div className="MainContent w-[788px] ms-[140px] flex-1 inline-flex flex-col items-start gap-6 p-8 overflow-y-auto scrollbar-hide">
      {showCloseModal && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex justify-center items-center z-50">
          <div className="ModalInput p-6 bg-white rounded-lg shadow-xl inline-flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <div className="text-gray-900 text-xl font-semibold">
                Close File
              </div>
              <div className="text-gray-700 text-sm">
                Please provide a reason below for closing this case
              </div>
            </div>
            <textarea
              className="w-96 h-40 p-4 bg-white rounded-lg border border-gray-200 focus:outline-blue-500 resize-none"
              placeholder="Enter reason..."
              value={closeReason}
              onChange={(e) => setCloseReason(e.target.value)}
            />
            <div className="w-96 inline-flex justify-end items-center gap-4">
              <button
                onClick={() => setShowCloseModal(false)}
                className="px-6 py-3 border border-blue-500 text-blue-500 rounded-lg font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitClose}
                className="px-6 py-3 bg-blue-500 text-white rounded-lg font-medium"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Container matching left-[534px] and top-[157px] from source */}
      <h1 className="text-black text-2xl font-semibold font-['Stack_Sans_Headline']">
        General Details
      </h1>

      {/* --- CASE DETAILS SECTION --- */}
      <div className="CaseDetailsSection self-stretch p-5 rounded-lg border border-gray-100 flex flex-col gap-4">
        <h2 className="text-black text-xl font-semibold leading-5">
          Case Details
        </h2>
        <div className="h-px bg-gray-100 w-full" />

        <div className="grid grid-cols-2 gap-x-5 gap-y-4">
          {/* 1. Claim Type */}
          <div className="flex flex-col gap-2">
            <label className="text-gray-700 text-sm font-medium">
              Claim type
            </label>
            <Select
              options={claimTypeOptions}
              placeholder="Select Claim Type"
              value={step1Data.claimType} // Controlled from step1Data
              styles={customStyles}
              onChange={(val) => updateField("claimType", val)}
              components={{
                DropdownIndicator: BlueDropdownIndicator,
                IndicatorSeparator: () => null,
              }}
            />
          </div>

          {/* 2. Handler */}
          <div className="flex flex-col gap-2">
            <label className="text-gray-700 text-sm font-medium">Handler</label>
            <Select
              options={handlerOptions}
              placeholder="Select Handler"
              styles={customStyles}
              value={step1Data.handler} // Controlled from step1Data
              onChange={(val) => updateField("handler", val)}
              components={{
                DropdownIndicator: BlueDropdownIndicator,
                IndicatorSeparator: () => null,
              }}
            />
          </div>

          {/* 3. Target Debt */}
          <div className="flex flex-col gap-2">
            <label className="text-gray-700 text-sm font-medium">
              Target Debt
            </label>
            <Select
              options={[
                { value: "Target", label: "Target" },
                { value: "Non-Target", label: "Non-Target" },
              ]}
              placeholder="Select Target Debt"
              styles={customStyles}
              value={step1Data.targetDebt} // Controlled from step1Data
              onChange={(val) => updateField("targetDebt", val)}
              components={{
                DropdownIndicator: BlueDropdownIndicator,
                IndicatorSeparator: () => null,
              }}
            />
          </div>

          {/* 4. How Did Customer Find Us? */}
          <div className="flex flex-col gap-2">
            <label className="text-gray-700 text-sm font-medium">
              How did the customer find us?
            </label>
            <Select
              options={findUsOptions}
              value={step1Data.findUsSource} // Controlled from step1Data
              placeholder="Select Source"
              onChange={(val) => updateField("findUsSource", val)}
              styles={customStyles}
              components={{
                DropdownIndicator: BlueDropdownIndicator,
                IndicatorSeparator: () => null,
              }}
            />
          </div>

          {/* CONDITIONAL: Staff Member Name (Appears when Staff Marketing selected) */}
          {step1Data.findUsSource?.label === "Staff Marketing" && (
            <div className="col-span-2 flex flex-col gap-2 animate-in fade-in duration-300">
              <label className="text-gray-700 text-sm font-medium">
                Staff Member Name
              </label>
              <Select
                placeholder="Select Staff Member..."
                styles={customStyles}
                options={handlerOptions}
                value={step1Data.staffMemberName} // Controlled from step1Data
                onChange={(val) => updateField("staffMemberName", val)}
                components={{
                  DropdownIndicator: BlueDropdownIndicator,
                  IndicatorSeparator: () => null,
                }}
              />
            </div>
          )}

          {/* 5. Case Status */}
          <div className="flex flex-col gap-2">
            <label className="text-gray-700 text-sm font-medium">
              Case Status
            </label>
            <Select
              options={[
                { value: "Accepted", label: "Accepted" },
                { value: "TBC", label: "TBC" },
                { value: "Rejected", label: "Claim Rejected" },
                { value: "Cancelled", label: "Claim Cancelled" },
              ]}
              value={step1Data.caseStatus} // Controlled from step1Data
              onChange={(val) => updateField("caseStatus", val)}
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
            <label className="text-gray-700 text-sm font-medium">
              Credit Hire Accepted?
            </label>
            <div className="flex gap-6 items-center h-[52px]">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="creditHire"
                  className="w-5 h-5 accent-blue-500"
                  checked={step1Data.creditHire}
                  onChange={(val) => updateField("creditHire", true)}
                />
                <span className="text-sm">Yes</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="creditHire"
                  className="w-5 h-5 accent-blue-500"
                  checked={!step1Data.creditHire}
                  onChange={(val) => updateField("creditHire", false)}
                />
                <span className="text-sm">No</span>
              </label>
            </div>
          </div>

          {/* 7. Non-Fault Accident? */}
          <div className="flex flex-col gap-2">
            <label className="text-gray-700 text-sm font-medium">
              Non-Fault Accident?
            </label>
            <Select
              options={commonStatusOptions}
              styles={customStyles}
              value={step1Data.nonFault} // Controlled from step1Data
              onChange={(val) => updateField("nonFault", val)}
              components={{
                DropdownIndicator: BlueDropdownIndicator,
                IndicatorSeparator: () => null,
              }}
            />
          </div>

          {/* 8. Any Passengers? */}
          <div className="flex flex-col gap-2">
            <label className="text-gray-700 text-sm font-medium">
              Any Passengers?
            </label>
            <Select
              options={commonStatusOptions}
              styles={customStyles}
              value={step1Data.passengers} // Controlled from step1Data
              onChange={(val) => updateField("passengers", val)}
              components={{
                DropdownIndicator: BlueDropdownIndicator,
                IndicatorSeparator: () => null,
              }}
            />
          </div>

          {/* 9. Client Injured? */}
          <div className="flex flex-col gap-2">
            <label className="text-gray-700 text-sm font-medium">
              Client Injured?
            </label>
            <Select
              options={commonStatusOptions}
              styles={customStyles}
              value={step1Data.clientInjured} // Controlled from step1Data
              onChange={(val) => updateField("clientInjured", val)}
              components={{
                DropdownIndicator: BlueDropdownIndicator,
                IndicatorSeparator: () => null,
              }}
            />
          </div>

          {/* 10. Prospects of File */}
          <div className="flex flex-col gap-2">
            <label className="text-gray-700 text-sm font-medium">
              Prospects of File
            </label>
            <Select
              options={[
                { value: "50/50", label: "50/50 Fault" },
                { value: "Non-Fault", label: "Non-Fault" },
                { value: "Uninsured", label: "TP Uninsured" },
              ]}
              value={step1Data.prospects} // Controlled from step1Data
              onChange={(val) => updateField("prospects", val)}
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
      {/* --- POSITION DETAILS SECTION --- */}
      <div className="PositionSection p-5 self-stretch rounded-lg border border-gray-100 flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <h2 className="text-black text-xl font-semibold">Position Details</h2>
          <button
            onClick={() => setShowCloseModal(true)}
            className="flex gap-1 items-center px-4 py-2 bg-blue-50 text-blue-600 rounded-md font-medium text-sm hover:bg-blue-100 transition"
          >
            <img src={Vector9} alt="" />
            Close File
          </button>
        </div>

        <div className="h-px bg-gray-100 w-full" />
        <div className="grid grid-cols-2 gap-5">
          <div className="flex flex-col gap-2">
            <label className="text-gray-700 text-sm font-medium">
              File Opened On
            </label>
            <div className="h-[52px] px-5 bg-gray-50 rounded border border-gray-200 flex justify-between items-center">
              <span className="text-gray-500 font-light">{openedDate}</span>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                className="text-blue-500"
              >
                <path
                  d="M8 7V3M16 7V3M7 11H17M5 21H19C20.1046 21 21 20.1046 21 19V7C21 5.89543 20.1046 5 19 5H5C3.89543 5 3 5.89543 3 7V19C3 20.1046 3.89543 21 5 21Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-gray-700 text-sm font-medium">
              Claim Entrants Username
            </label>
            <div className="h-[52px] px-5 bg-gray-50 rounded border border-gray-200 flex items-center">
              <span className="text-gray-500 font-light">{username}</span>
            </div>
          </div>
        </div>
      </div>
      {/* --- PRESENT FILE POSITION SECTION --- */}
      <div className="PresentFilePositionSection self-stretch p-5 rounded-lg border border-gray-100 flex flex-col gap-4 mb-10">
        <div className="flex justify-between items-center">
          <h2 className="text-black text-xl font-semibold">
            Present File Position
          </h2>
          {step1Data.goingAbroad && (
            <button
              className="flex gap-1 items-center px-4 py-2 bg-blue-50 text-blue-600 rounded-md font-medium text-sm hover:bg-blue-100 transition"
              onClick={handleNotifyManager}
            >
              <img src={Vector5} alt="" />
              <span>Notify Manager</span>
            </button>
          )}
        </div>
        <div className="h-px bg-gray-100 w-full" />
        <div className="w-[384px] flex flex-col gap-2">
          <label className="text-gray-700 text-sm font-medium">
            Present File Position
          </label>
          <Select
            options={positionOptions}
            placeholder="Select File Position"
            styles={customStyles}
            value={step1Data.presentPosition} // Controlled from step1Data
            onChange={(val) => updateField("presentPosition", val)}
            components={{
              DropdownIndicator: BlueDropdownIndicator,
              IndicatorSeparator: () => null,
            }}
          />
        </div>
        <div className="h-px bg-gray-100 w-full" />
        {/* Use items-start to align the top of both columns */}
        <div className="flex gap-10 items-start justify-between">
          {/* Left Column: Radio Buttons */}
          <div className="flex flex-col gap-2">
            {" "}
            {/* Changed gap-4 to gap-2 to match the Date label gap */}
            <span className="text-gray-700 text-sm font-medium h-[20px] flex items-center">
              Client going abroad soon?
            </span>
            {/* Centering the radio buttons inside a 52px height container to match input height */}
            <div className="flex gap-10 h-[52px] items-center">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="goingAbroad"
                  className="w-5 h-5 accent-blue-500"
                  checked={step1Data.goingAbroad}
                  onChange={() => updateField("goingAbroad", true)}
                />
                <span className="text-sm">Yes</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="goingAbroad"
                  className="w-5 h-5 accent-blue-500"
                  checked={!step1Data.goingAbroad}
                  onChange={() => updateField("goingAbroad", false)}
                />
                <span className="text-sm">No</span>
              </label>
            </div>
          </div>

          {/* Right Column: Date Picker */}
          {step1Data.goingAbroad && (
            <div className="relative">
              <div
                ref={containerRef}
                className="w-[384px] flex flex-col gap-2 animate-in slide-in-from-left-2 duration-300"
              >
                <label className="text-gray-700 text-sm font-medium h-[20px] flex items-center">
                  Date
                </label>

                <div className="relative">
                  <div
                    onClick={() => setShowPicker(!showPicker)}
                    className={`w-full h-[52px] px-5 bg-white rounded border flex items-center justify-between cursor-pointer transition-all
              ${showPicker ? "border-blue-500 ring-1 ring-blue-500" : "border-gray-200 hover:border-gray-300"}`}
                  >
                    <span
                      className={`${step1Data.selectedDate ? "text-gray-900" : "text-gray-400"} font-light`}
                    >
                      {step1Data.selectedDate &&
                        formatDate(step1Data.selectedDate)}
                    </span>
                    <img src={Vector6} alt="" />
                  </div>

                  {/* Date Picker Popover - Positioning Fixed */}
                  {showPicker && (
                    <div className="absolute bottom-[390px] left-0 z-[100]">
                      <CustomDatePicker
                        selectedDate={step1Data.selectedDate || new Date()}
                        onDateSelect={(date) => {
                          updateField("selectedDate", date);
                          setShowPicker(false);
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      {/* </div> */}
    </div>
  );
};;
