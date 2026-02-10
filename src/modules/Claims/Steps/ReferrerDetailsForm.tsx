import { components, type DropdownIndicatorProps, type StylesConfig } from "react-select";
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

const REFERRERS_MASTER_LIST = [
  {
    id: 1,
    name: "Global Claims Ltd",
    address: "123 Business Park, London",
    postcode: "EC1A 1BB",
    contactName: "John Smith",
    tel: "+44 7700 900123",
    email: "john.smith@globalclaims.com"
  },
  {
    id: 2,
    name: "Accident Help Corp",
    address: "45 High Street, Manchester",
    postcode: "M1 4BB",
    contactName: "Sarah Jones",
    tel: "+44 7700 900456",
    email: "contact@accidenthelp.co.uk"
  }
];

export const ReferrerDetailsForm = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [formData, setFormData] = useState({
    companyName: "",
    address: "",
    postcode: "",
    contactName: "",
    tel: "",
    email: "",
  });
  // 1. Centralized Persisted State for Step 2
  const [step2Data, setStep2Data] = usePersistedStep("step2", {
    companyName: "",
    address: "",
    postcode: "",
    contactName: "",
    tel: "",
    email: "",
    onHireAmount: "",
    offHireAmount: "",
    congestionCharges: "",
    otherCharges: "",
    onHireDate: null as string | Date | null,
    offHireDate: null as string | Date | null,
    solicitor: "",
    thirdPartyCapture: "Allowed",
  });

  // 2. Helper to update fields
  const updateField = (field: string, value: any) => {
    setStep2Data((prev) => ({ ...prev, [field]: value }));
  };
  // Filter list based on search term
  const filteredReferrers = REFERRERS_MASTER_LIST.filter((r) =>
    r.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleSelectReferrer = (referrer: any) => {
    setStep2Data((prev) => ({
      ...prev,
      companyName: referrer.name,
      address: referrer.address,
      postcode: referrer.postcode,
      contactName: referrer.contactName,
      tel: referrer.tel,
      email: referrer.email,
    }));
    setSearchTerm(referrer.name);
    setShowDropdown(false);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };
  // Independent states for each Date Picker
  const [onHireDate, setOnHireDate] = useState<Date | null>(null);
  const [showOnHirePicker, setShowOnHirePicker] = useState(false);

  const [offHireDate, setOffHireDate] = useState<Date | null>(null);
  const [showOffHirePicker, setShowOffHirePicker] = useState(false);

  // Refs for clicking outside
  const onHireRef = useRef<HTMLDivElement>(null);
  const offHireRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        onHireRef.current &&
        !onHireRef.current.contains(event.target as Node)
      ) {
        setShowOnHirePicker(false);
      }
      if (
        offHireRef.current &&
        !offHireRef.current.contains(event.target as Node)
      ) {
        setShowOffHirePicker(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const formatDate = (date: Date | null) => {
    if (!date) return "Date";
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const handleNumericInput = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: string,
  ) => {
    const value = e.target.value;
    if (value === "" || /^\d*\.?\d{0,2}$/.test(value)) {
      setPayments((prev) => ({ ...prev, [field]: value }));
    }
  };

  const [payments, setPayments] = useState({
    onHireAmount: "",
    offHireAmount: "",
    congestionCharges: "",
    otherCharges: "",
  });

  // Handler for numeric/currency inputs

  return (
    <div className="MainContent w-[788px] ms-[140px] flex-1 inline-flex flex-col items-start gap-6 p-8 overflow-y-auto scrollbar-hide">
      {/* Container matching left-[534px] and top-[157px] from source */}
      <h1 className="text-black text-2xl font-semibold font-['Stack_Sans_Headline']">
        Refferer Details
      </h1>
      {/* Section 1: Referrer & Reporting Details Section */}
      <div className="CaseDetailsSection self-stretch p-5 rounded-lg border border-gray-100 flex flex-col gap-4">
        <h2 className="text-black text-xl font-semibold leading-5">
          Referrer & Reporting Details
        </h2>
        <div className="h-px bg-gray-100 w-full" />

        <div className="flex flex-col gap-4 ">
          {/* 1. Searchable Lookup Field: Company Name */}
          <div className="flex flex-col gap-2 relative">
            <label className="text-gray-700 text-sm font-medium">
              Company Name
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setShowDropdown(true);
                }}
                onFocus={() => setShowDropdown(true)}
                placeholder="Enter Name"
                className="w-full h-[52px] px-5 bg-white rounded border border-gray-200 text-gray-900 font-light focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              />

              {/* Search Dropdown */}
              {showDropdown && searchTerm && (
                <div className="absolute top-[56px] left-0 w-full bg-white border border-gray-200 rounded-md shadow-lg z-50 max-h-60 overflow-y-auto">
                  {filteredReferrers.length > 0 ? (
                    filteredReferrers.map((r) => (
                      <div
                        key={r.id}
                        onClick={() => handleSelectReferrer(r)}
                        className="px-5 py-3 hover:bg-gray-50 cursor-pointer text-sm text-gray-700 border-b border-gray-50 last:border-none"
                      >
                        {r.name}
                      </div>
                    ))
                  ) : (
                    <div className="px-5 py-3 text-sm text-gray-400 italic">
                      No referrer found. Please add via Configuration Screen.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* 2. Address - Multi-line with Google Suggestion potential */}
          <div className="flex flex-col gap-2">
            <label className="text-gray-700 text-sm font-medium">
              Company Address
            </label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              placeholder="Enter Address"
              className="w-full min-h-[80px] p-5 bg-white rounded border border-gray-200 text-gray-600 font-light focus:border-blue-500 outline-none resize-none"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-gray-700 text-sm font-medium">
              Contact Name
            </label>
            <input
              name="contactName"
              value={formData.contactName}
              placeholder="Enter Name"
              onChange={handleInputChange}
              className="w-full h-[52px] px-5 bg-white rounded border border-gray-200 text-gray-600 font-light"
            />
          </div>
          {/* 3. Postcode & Contact Name */}
          <div className="flex gap-5">
            <div className="flex-1 flex flex-col gap-2">
              <label className="text-gray-700 text-sm font-medium">
                Post Code
              </label>
              <input
                name="postcode"
                value={formData.postcode}
                onChange={handleInputChange}
                placeholder="Enter Code"
                className="w-full h-[52px] px-5 bg-white rounded border border-gray-200 text-gray-600 font-light"
              />
            </div>
            <div className="flex-1 flex flex-col gap-2">
              <label className="text-gray-700 text-sm font-medium">
                Email Address
              </label>
              <input
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Enter Email"
                className="w-full h-[52px] px-5 bg-white rounded border border-gray-200 text-gray-600 font-light"
              />
            </div>
          </div>

          {/* Parent Container defining the 12-column grid */}
          <div className="grid grid-cols-12 gap-5 w-full">
            <div className="col-span-6 flex flex-col gap-2">
              <label className="text-gray-700 text-sm font-medium">
                Mobile Number
              </label>
              <div className="relative h-[52px] px-5 bg-white rounded border border-gray-200 flex items-center gap-2.5 focus-within:border-blue-500 transition-all">
                {/* Visual prefix matching your Figma/HTML snippet */}
                <span className="text-gray-300 text-base font-light font-['Stack_Sans_Headline'] leading-4">
                  +44
                </span>
                <input
                  name="tel"
                  type="tel"
                  value={formData.tel}
                  onChange={handleInputChange}
                  className="w-full bg-transparent outline-none text-gray-900 font-light placeholder:text-gray-300"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Section 2: Driver Commission Payments Section */}
      <div className="DriverCommissionPayments self-stretch p-5 rounded-lg border border-gray-100 flex flex-col gap-4">
        <h2 className="text-black text-xl font-semibold font-['Stack_Sans_Headline'] leading-5">
          Driver Commission Payments
        </h2>
        <div className="h-px bg-gray-100 w-full" />

        <div className="flex flex-col gap-6 w-full">
          {/* Row 1: On Hire Payment & Date */}
          <div className="grid grid-cols-12 gap-5 w-full">
            <div className="col-span-6 flex flex-col gap-2">
              <label className="text-gray-700 text-sm font-medium">
                On Hire Payment
              </label>
              <div className="h-[52px] px-5 bg-white rounded border border-gray-200 flex items-center gap-2.5 focus-within:border-blue-500 transition-all">
                <span className="text-gray-400 text-base font-light">£</span>
                <input
                  type="text"
                  value={payments.onHireAmount}
                  onChange={(e) => handleNumericInput(e, "onHireAmount")}
                  className="w-full bg-transparent outline-none text-gray-900 font-light"
                />
              </div>
            </div>

            {/* CUSTOM DATE PICKER UI */}
            <div
              className="col-span-6 flex flex-col gap-2 relative"
              ref={onHireRef}
            >
              <label className="text-gray-700 text-sm font-medium">
                Paid On
              </label>
              <div
                onClick={() => setShowOnHirePicker(!showOnHirePicker)}
                className={`w-full h-[52px] px-5 bg-white rounded border flex items-center justify-between cursor-pointer transition-all
                  ${showOnHirePicker ? "border-blue-500 ring-1 ring-blue-500" : "border-gray-200 hover:border-gray-300"}`}
              >
                <span
                  className={`${onHireDate ? "text-gray-900" : "text-gray-400"} font-light`}
                >
                  {formatDate(onHireDate)}
                </span>
                <img src={Vector6} alt="calendar" />
              </div>
              {showOnHirePicker && (
                <div className="absolute bottom-[300px] left-0 z-[100]">
                  <CustomDatePicker
                    selectedDate={onHireDate || new Date()}
                    onDateSelect={(date) => {
                      setOnHireDate(date);
                      setShowOnHirePicker(false);
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Row 2: Off Hire Payment & Date */}
          <div className="grid grid-cols-12 gap-5 w-full">
            <div className="col-span-6 flex flex-col gap-2">
              <label className="text-gray-700 text-sm font-medium">
                Off Hire Payment
              </label>
              <div className="h-[52px] px-5 bg-white rounded border border-gray-200 flex items-center gap-2.5 focus-within:border-blue-500 transition-all">
                <span className="text-gray-400 text-base font-light">£</span>
                <input
                  type="text"
                  value={payments.offHireAmount}
                  onChange={(e) => handleNumericInput(e, "offHireAmount")}
                  className="w-full bg-transparent outline-none text-gray-900 font-light"
                />
              </div>
            </div>

            <div
              className="col-span-6 flex flex-col gap-2 relative"
              ref={offHireRef}
            >
              <label className="text-gray-700 text-sm font-medium">
                Paid On
              </label>
              <div
                onClick={() => setShowOffHirePicker(!showOffHirePicker)}
                className={`w-full h-[52px] px-5 bg-white rounded border flex items-center justify-between cursor-pointer transition-all
                  ${showOffHirePicker ? "border-blue-500 ring-1 ring-blue-500" : "border-gray-200 hover:border-gray-300"}`}
              >
                <span
                  className={`${offHireDate ? "text-gray-900" : "text-gray-400"} font-light`}
                >
                  {formatDate(offHireDate)}
                </span>
                <img src={Vector6} alt="calendar" />
              </div>
              {showOffHirePicker && (
                <div className="absolute bottom-[300px] left-0 z-[100]">
                  <CustomDatePicker
                    selectedDate={offHireDate || new Date()}
                    onDateSelect={(date) => {
                      setOffHireDate(date);
                      setShowOffHirePicker(false);
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Row 3: Congestion & Other Charges (6-columns each) */}
          <div className="grid grid-cols-12 gap-5 w-full">
            <div className="col-span-6 flex flex-col gap-2">
              <label className="text-gray-700 text-sm font-medium">
                Congestion Charges
              </label>
              <div className="h-[52px] px-5 bg-white rounded border border-gray-200 flex items-center gap-2.5 focus-within:border-blue-500 transition-all">
                <span className="text-gray-400 text-base font-light">£</span>
                <input
                  type="text"
                  value={payments.congestionCharges}
                  onChange={(e) => handleNumericInput(e, "congestionCharges")}
                  className="w-full bg-transparent outline-none text-gray-900 font-light"
                />
              </div>
            </div>
            <div className="col-span-6 flex flex-col gap-2">
              <label className="text-gray-700 text-sm font-medium">
                Other Charges
              </label>
              <div className="h-[52px] px-5 bg-white rounded border border-gray-200 flex items-center gap-2.5 focus-within:border-blue-500 transition-all">
                <span className="text-gray-400 text-base font-light">£</span>
                <input
                  type="text"
                  value={payments.otherCharges}
                  onChange={(e) => handleNumericInput(e, "otherCharges")}
                  className="w-full bg-transparent outline-none text-gray-900 font-light"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Section 3: Refferer Commission View Section */}
      <div className="DriverCommissionPayments self-stretch p-5 rounded-lg border border-gray-100 flex flex-col gap-4">
        <h2 className="text-black text-xl font-semibold font-['Stack_Sans_Headline'] leading-5">
          Referrer Commission Review
        </h2>
        <div className="h-px bg-gray-100 w-full" />

        <div className="flex flex-col gap-6 w-full">
          {/* Row 1: On Hire Payment & Date */}
          <div className="grid grid-cols-12 gap-5 w-full">
            <div className="col-span-6 flex flex-col gap-2">
              <label className="text-gray-700 text-sm font-medium">
                On Hire Payment
              </label>
              <div className="h-[52px] px-5 bg-white rounded border border-gray-200 flex items-center gap-2.5 focus-within:border-blue-500 transition-all">
                <span className="text-gray-400 text-base font-light">£</span>
                <input
                  type="text"
                  value={payments.onHireAmount}
                  onChange={(e) => handleNumericInput(e, "onHireAmount")}
                  className="w-full bg-transparent outline-none text-gray-900 font-light"
                />
              </div>
            </div>

            {/* CUSTOM DATE PICKER UI */}
            <div
              className="col-span-6 flex flex-col gap-2 relative"
              ref={onHireRef}
            >
              <label className="text-gray-700 text-sm font-medium">
                Paid On
              </label>
              <div
                onClick={() => setShowOnHirePicker(!showOnHirePicker)}
                className={`w-full h-[52px] px-5 bg-white rounded border flex items-center justify-between cursor-pointer transition-all
                  ${showOnHirePicker ? "border-blue-500 ring-1 ring-blue-500" : "border-gray-200 hover:border-gray-300"}`}
              >
                <span
                  className={`${onHireDate ? "text-gray-900" : "text-gray-400"} font-light`}
                >
                  {formatDate(onHireDate)}
                </span>
                <img src={Vector6} alt="calendar" />
              </div>
              {showOnHirePicker && (
                <div className="absolute bottom-[300px] left-0 z-[100]">
                  <CustomDatePicker
                    selectedDate={onHireDate || new Date()}
                    onDateSelect={(date) => {
                      setOnHireDate(date);
                      setShowOnHirePicker(false);
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Row 2: Off Hire Payment & Date */}
          <div className="grid grid-cols-12 gap-5 w-full">
            <div className="col-span-6 flex flex-col gap-2">
              <label className="text-gray-700 text-sm font-medium">
                Off Hire Payment
              </label>
              <div className="h-[52px] px-5 bg-white rounded border border-gray-200 flex items-center gap-2.5 focus-within:border-blue-500 transition-all">
                <span className="text-gray-400 text-base font-light">£</span>
                <input
                  type="text"
                  value={payments.offHireAmount}
                  onChange={(e) => handleNumericInput(e, "offHireAmount")}
                  className="w-full bg-transparent outline-none text-gray-900 font-light"
                />
              </div>
            </div>

            <div
              className="col-span-6 flex flex-col gap-2 relative"
              ref={offHireRef}
            >
              <label className="text-gray-700 text-sm font-medium">
                Paid On
              </label>
              <div
                onClick={() => setShowOffHirePicker(!showOffHirePicker)}
                className={`w-full h-[52px] px-5 bg-white rounded border flex items-center justify-between cursor-pointer transition-all
                  ${showOffHirePicker ? "border-blue-500 ring-1 ring-blue-500" : "border-gray-200 hover:border-gray-300"}`}
              >
                <span
                  className={`${offHireDate ? "text-gray-900" : "text-gray-400"} font-light`}
                >
                  {formatDate(offHireDate)}
                </span>
                <img src={Vector6} alt="calendar" />
              </div>
              {showOffHirePicker && (
                <div className="absolute bottom-[300px] left-0 z-[100]">
                  <CustomDatePicker
                    selectedDate={offHireDate || new Date()}
                    onDateSelect={(date) => {
                      setOffHireDate(date);
                      setShowOffHirePicker(false);
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      {/* --- Section 4: Referrers Nominated Solicitor --- */}
      <div className="self-stretch p-5 rounded-lg border border-gray-100 flex flex-col gap-4">
        <h2 className="text-black text-xl font-semibold leading-5 font-['Stack_Sans_Headline']">
          Referrers Nominated Solicitor (PI must go to)
        </h2>

        <div className="h-px bg-gray-100 w-full" />

        {/* Using grid-cols-12 and items-start to keep labels top-aligned */}
        <div className="grid grid-cols-12 gap-5 w-full items-start">
          {/* Left Column: Solicitor */}
          <div className="col-span-6 flex flex-col gap-2">
            <label className="text-gray-700 text-sm font-medium h-[20px] flex items-center">
              Solicitor
            </label>
            <div className="h-[52px] px-5 bg-white rounded border border-gray-200 flex items-center focus-within:border-blue-500 transition-all">
              <input
                name="solicitor"
                placeholder="Enter Solicitor Name"
                className="w-full bg-transparent outline-none text-gray-900 font-light"
              />
            </div>
          </div>

          {/* Right Column: Third Party Capture */}
          <div className="col-span-6 flex flex-col gap-2">
            {/* MATCHING LABEL HEIGHT: Using h-[20px] to match the Solicitor label exactly */}
            <span className="text-gray-700 text-sm font-medium h-[20px] flex items-center">
              Third Party Capture
            </span>

            {/* MATCHING INPUT HEIGHT: Using h-[52px] to center the radios relative to the input on the left */}
            <div className="h-[52px] flex items-center gap-8">
              {/* Allowed Option */}
              <label className="flex items-center gap-2 cursor-pointer group">
                <div className="relative flex items-center justify-center">
                  <input
                    type="radio"
                    name="thirdPartyCapture"
                    className="peer appearance-none w-5 h-5 rounded-full border border-gray-300 checked:border-blue-500 checked:bg-blue-50 transition-all"
                    defaultChecked
                  />
                  <div className="absolute w-2 h-2 bg-blue-500 rounded-full opacity-0 peer-checked:opacity-100 transition-opacity" />
                </div>
                <span className="text-sm text-gray-700">Allowed</span>
              </label>

              {/* Not Allowed Option */}
              <label className="flex items-center gap-2 cursor-pointer group">
                <div className="relative flex items-center justify-center">
                  <input
                    type="radio"
                    name="thirdPartyCapture"
                    className="peer appearance-none w-5 h-5 rounded-full border border-gray-300 checked:border-blue-500 checked:bg-blue-50 transition-all"
                  />
                  <div className="absolute w-2 h-2 bg-blue-500 rounded-full opacity-0 peer-checked:opacity-100 transition-opacity" />
                </div>
                <span className="text-sm text-gray-700">Not Allowed</span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};;;
