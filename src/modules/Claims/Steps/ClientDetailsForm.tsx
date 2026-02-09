import { components, type DropdownIndicatorProps, type StylesConfig } from "react-select";
import Vector6 from "../../../assets/AutoClaim_icon/Vector-6.svg";
import Vector5 from "../../../assets/AutoClaim_icon/Vector-5.svg";
import Vulnerable from "../../../assets/AutoClaim_icon/Vulnerable.svg";
import { useEffect, useRef, useState } from "react";
import { CustomDatePicker } from "../Components/DatePicker";
import Select from "react-select";
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

const handlerOptions = [
  { value: "Private Hire Driver", label: "Private Hire Driver" },
  { value: "Taxi Driver", label: "Taxi Driver" },
  { value: "Others", label: "Others" },
];

export const ClientDetailsForm = () => {
  const [personalInfo, setPersonalInfo] = useState({
    firstName: "",
    lastName: "",
    dob: null as Date | null,
    age: "",
    niNumber: "",
    occupation: "",
    customOccupation: "",
    driverCode: "",
    driverBase: "",
    isDayNightDriver: "Yes",
  });

  const [showDobPicker, setShowDobPicker] = useState(false);
const [contactInfo, setContactInfo] = useState({
  address: "",
  postCode: "",
  email: "",
  homePhone: "+44",
  mobileNumber: "+44",
  preferredLanguage: "",
  speaksClearEnglish: "Yes",
  alternativeContact: "No",
});

const languageOptions = [
  { value: "English", label: "English" },
  { value: "Urdu", label: "Urdu" },
  { value: "Punjabi", label: "Punjabi" },
  { value: "Bengali", label: "Bengali" },
  { value: "Other", label: "Other" },
];
  const [bankInfo, setBankInfo] = useState({
    sortCode: "",
    accountNumber: "",
    payNotificationDate: null as Date | null,
  });
const [vatInfo, setVatInfo] = useState({
  isVatRegistered: "No",
});
const [vulnerabilityInfo, setVulnerabilityInfo] = useState({
  isVulnerable: "No",
  reason: "",
});
const handleNotifyManager = () => {
  console.log("Manager Notified");
  // Add your email/notification logic here
};
  const [showPayDatePicker, setShowPayDatePicker] = useState(false);
  // Auto-calculate age when DOB changes
  // Auto-calculate age when DOB changes
  useEffect(() => {
    if (personalInfo.dob) {
      const today = new Date();
      const birthDate = new Date(personalInfo.dob);

      let calculatedAge = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();

      // Adjust age if birthday hasn't occurred yet this year
      if (
        monthDiff < 0 ||
        (monthDiff === 0 && today.getDate() < birthDate.getDate())
      ) {
        calculatedAge--;
      }

      // Use functional update to avoid dependency loops
      setPersonalInfo((prev) => {
        const finalAge = Math.max(0, calculatedAge).toString();
        // Only update if the age has actually changed to prevent infinite loops
        if (prev.age === finalAge) return prev;
        return {
          ...prev,
          age: finalAge,
        };
      });
    }
  }, [personalInfo.dob]); // ONLY depend on dob, not the whole personalInfo object
  return (
    <div className="MainContent w-[788px] ms-[140px] flex-1 inline-flex flex-col items-start gap-6 p-8 overflow-y-auto scrollbar-hide">
      {/* Container matching left-[534px] and top-[157px] from source */}
      <h1 className="text-black text-2xl font-semibold font-['Stack_Sans_Headline']">
        Client Details
      </h1>
      {/* Section 1: Personal Information Section */}
      <div className="self-stretch p-5 rounded-lg border border-gray-100 flex flex-col gap-4">
        {/* Header Aligned Exactly Like Previous Sections */}
        <h2 className="text-black text-xl font-semibold leading-5 font-['Stack_Sans_Headline']">
          Personal Information
        </h2>
        <div className="h-px bg-gray-100 w-full" />

        <div className="flex flex-col gap-6">
          {/* Row 1: First Name & Last Name */}
          <div className="grid grid-cols-12 gap-5 w-full">
            <div className="col-span-6 flex flex-col gap-2">
              <label className="text-gray-700 text-sm font-medium h-[20px] flex items-center">
                First Name
              </label>
              <div className="h-[52px] px-5 bg-white rounded border border-gray-200 flex items-center focus-within:border-blue-500">
                <input
                  placeholder="Enter First Name"
                  className="w-full bg-transparent outline-none text-gray-900 font-light"
                  onChange={(e) =>
                    setPersonalInfo({
                      ...personalInfo,
                      firstName: e.target.value,
                    })
                  }
                />
              </div>
            </div>
            <div className="col-span-6 flex flex-col gap-2">
              <label className="text-gray-700 text-sm font-medium h-[20px] flex items-center">
                Last Name
              </label>
              <div className="h-[52px] px-5 bg-white rounded border border-gray-200 flex items-center focus-within:border-blue-500">
                <input
                  placeholder="Enter Last Name"
                  className="w-full bg-transparent outline-none text-gray-900 font-light"
                  onChange={(e) =>
                    setPersonalInfo({
                      ...personalInfo,
                      lastName: e.target.value,
                    })
                  }
                />
              </div>
            </div>
          </div>

          {/* Row 2: DOB & Age (Auto-calculated) */}
          <div className="grid grid-cols-12 gap-5 w-full">
            <div className="col-span-6 flex flex-col gap-2 relative">
              <label className="text-gray-700 text-sm font-medium h-[20px] flex items-center">
                Date of Birth
              </label>
              <div
                onClick={() => setShowDobPicker(!showDobPicker)}
                className="h-[52px] px-5 bg-white rounded border border-gray-200 flex items-center justify-between cursor-pointer focus-within:border-blue-500"
              >
                <span
                  className={
                    personalInfo.dob
                      ? "text-gray-900 font-light"
                      : "text-gray-300 font-light"
                  }
                >
                  {personalInfo.dob
                    ? personalInfo.dob.toLocaleDateString("sv-SE") // YYYY-MM-DD format
                    : "Date"}
                </span>
                <img src={Vector6} className="w-4 h-4" alt="calendar" />
              </div>

              {/* Date Picker Dropdown */}
              {showDobPicker && (
                <div className="absolute top-[80px] left-0 z-[100] shadow-xl rounded-lg bg-white">
                  <CustomDatePicker
                    selectedDate={personalInfo.dob || new Date()}
                    // Ensure the user cannot pick a future date
                    // maxDate={new Date()}
                    onDateSelect={(date) => {
                      // Double check: only update if date is not in the future
                      if (date <= new Date()) {
                        setPersonalInfo({ ...personalInfo, dob: date });
                        setShowDobPicker(false);
                      }
                    }}
                  />
                </div>
              )}
            </div>

            {/* Age Field (Linked to the same row) */}
            <div className="col-span-6 flex flex-col gap-2">
              <label className="text-gray-700 text-sm font-medium h-[20px] flex items-center">
                Age
              </label>
              <div className="h-[52px] px-5 bg-gray-50 rounded border border-gray-200 flex items-center">
                <input
                  readOnly
                  value={personalInfo.age}
                  placeholder="Age"
                  className={`w-full bg-transparent outline-none font-light ${
                    personalInfo.age ? "text-gray-900" : "text-gray-400"
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Row 3: NI Number (Full Width in Grid context) */}
          <div className="grid grid-cols-12 gap-5 w-full">
            <div className="col-span-12 flex flex-col gap-2">
              <label className="text-gray-700 text-sm font-medium h-[20px] flex items-center">
                NI Number
              </label>
              <div className="h-[52px] px-5 bg-white rounded border border-gray-200 flex items-center focus-within:border-blue-500">
                <input
                  placeholder="e.g. QQ 12 34 56 C"
                  className="w-full bg-transparent outline-none text-gray-900 font-light uppercase"
                />
              </div>
            </div>
          </div>

          {/* Row 4: Occupation & Custom Occupation */}
          <div className="grid grid-cols-12 gap-5 w-full">
            <div className="col-span-6 flex flex-col gap-2">
              <label className="text-gray-700 text-sm font-medium h-[20px] flex items-center">
                Occupation
              </label>
              <Select
                options={handlerOptions}
                placeholder="Select Handler"
                styles={customStyles}
                onChange={(option: any) =>
                  setPersonalInfo({ ...personalInfo, occupation: option.value })
                }
                components={{
                  DropdownIndicator: BlueDropdownIndicator,
                  IndicatorSeparator: () => null,
                }}
              />
            </div>

            {/* Conditional Rendering for 'Others' - Aligned with the Select box */}
            <div
              className={`col-span-6 flex flex-col gap-2 transition-opacity duration-300 ${personalInfo.occupation === "Others" ? "opacity-100" : "opacity-30 pointer-events-none"}`}
            >
              <label className="text-gray-700 text-sm font-medium h-[20px] flex items-center">
                Custom Occupation
              </label>
              <div className="h-[52px] px-5 bg-white rounded border border-gray-200 flex items-center focus-within:border-blue-500">
                <input
                  disabled={personalInfo.occupation !== "Others"}
                  placeholder="Please specify"
                  className="w-full bg-transparent outline-none text-gray-900 font-light"
                />
              </div>
            </div>
          </div>
          {/* Row 5: Driver Code & Day/Night Radio */}
          <div className="grid grid-cols-12 gap-5 w-full">
            <div className="col-span-6 flex flex-col gap-2">
              <label className="text-gray-700 text-sm font-medium h-[20px] flex items-center">
                Driver Code
              </label>
              <div className="h-[52px] px-5 bg-white rounded border border-gray-200 flex items-center focus-within:border-blue-500">
                <input
                  placeholder="Enter Code"
                  className="w-full bg-transparent outline-none text-gray-900 font-light"
                />
              </div>
            </div>
            <div className="col-span-6 flex flex-col gap-2">
              <span className="text-gray-700 text-sm font-medium h-[20px] flex items-center">
                Day/Night Driver?
              </span>
              <div className="h-[52px] flex items-center gap-8">
                {["Yes", "No"].map((option) => (
                  <label
                    key={option}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <div className="relative flex items-center justify-center">
                      <input
                        type="radio"
                        name="dayNightDriver"
                        className="peer appearance-none w-5 h-5 rounded-full border border-gray-300 checked:border-blue-500 checked:bg-blue-50 transition-all"
                        checked={personalInfo.isDayNightDriver === option}
                        onChange={() =>
                          setPersonalInfo({
                            ...personalInfo,
                            isDayNightDriver: option,
                          })
                        }
                      />
                      <div className="absolute w-2 h-2 bg-blue-500 rounded-full opacity-0 peer-checked:opacity-100 transition-opacity" />
                    </div>
                    <span className="text-sm text-gray-700">{option}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Row 6: Driver Base */}
          <div className="grid grid-cols-12 gap-5 w-full">
            <div className="col-span-6 flex flex-col gap-2">
              <label className="text-gray-700 text-sm font-medium h-[20px] flex items-center">
                Driver Base
              </label>
              <div className="h-[52px] px-5 bg-white rounded border border-gray-200 flex items-center focus-within:border-blue-500">
                <input
                  placeholder="Enter Driver Base"
                  className="w-full bg-transparent outline-none text-gray-900 font-light"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Section 2:  Contact Information */}
      <div className="self-stretch p-5 rounded-lg border border-gray-100 flex flex-col gap-4 mt-6">
        <h2 className="text-black text-xl font-semibold leading-5 font-['Stack_Sans_Headline']">
          Contact Information
        </h2>
        <div className="h-px bg-gray-100 w-full" />

        <div className="flex flex-col gap-6">
          {/* Row 1: Full Width Address */}
          <div className="grid grid-cols-12 gap-5 w-full">
            <div className="col-span-12 flex flex-col gap-2">
              <label className="text-gray-700 text-sm font-medium">
                Address
              </label>
              <div className="h-[52px] px-5 bg-white rounded border border-gray-200 flex items-center focus-within:border-blue-500">
                <input
                  placeholder="Enter Address"
                  className="w-full bg-transparent outline-none text-gray-900 font-light"
                  onChange={(e) =>
                    setContactInfo({ ...contactInfo, address: e.target.value })
                  }
                />
              </div>
            </div>
          </div>

          {/* Row 2: Post Code & Email Address */}
          <div className="grid grid-cols-12 gap-5 w-full">
            <div className="col-span-4 flex flex-col gap-2">
              <label className="text-gray-700 text-sm font-medium">
                Post Code
              </label>
              <div className="h-[52px] px-5 bg-white rounded border border-gray-200 flex items-center focus-within:border-blue-500">
                <input
                  placeholder="Enter Code"
                  className="w-full bg-transparent outline-none text-gray-900 font-light"
                  onChange={(e) =>
                    setContactInfo({ ...contactInfo, postCode: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="col-span-8 flex flex-col gap-2">
              <label className="text-gray-700 text-sm font-medium">
                Email Address
              </label>
              <div className="h-[52px] px-5 bg-white rounded border border-gray-200 flex items-center focus-within:border-blue-500">
                <input
                  placeholder="Enter Email"
                  className="w-full bg-transparent outline-none text-gray-900 font-light"
                  onChange={(e) =>
                    setContactInfo({ ...contactInfo, email: e.target.value })
                  }
                />
              </div>
            </div>
          </div>

          {/* Row 3: Home Telephone & Mobile Number */}
          <div className="grid grid-cols-12 gap-5 w-full">
            <div className="col-span-6 flex flex-col gap-2">
              <label className="text-gray-700 text-sm font-medium">
                Home Telephone
              </label>
              <div className="h-[52px] px-5 bg-white rounded border border-gray-200 flex items-center focus-within:border-blue-500">
                <input
                  value={contactInfo.homePhone}
                  onChange={(e) =>
                    setContactInfo({
                      ...contactInfo,
                      homePhone: e.target.value,
                    })
                  }
                  className="w-full bg-transparent outline-none text-gray-900 font-light"
                />
              </div>
            </div>
            <div className="col-span-6 flex flex-col gap-2">
              <label className="text-gray-700 text-sm font-medium">
                Mobile Number
              </label>
              <div className="h-[52px] px-5 bg-white rounded border border-gray-200 flex items-center focus-within:border-blue-500">
                <input
                  value={contactInfo.mobileNumber}
                  onChange={(e) =>
                    setContactInfo({
                      ...contactInfo,
                      mobileNumber: e.target.value,
                    })
                  }
                  className="w-full bg-transparent outline-none text-gray-900 font-light"
                />
              </div>
            </div>
          </div>

          {/* Row 4: Language & English Proficiency */}
          <div className="grid grid-cols-12 gap-5 w-full items-end">
            <div className="col-span-6 flex flex-col gap-2">
              <label className="text-gray-700 text-sm font-medium">
                Client's Preferred Language
              </label>
              <Select
                options={languageOptions}
                placeholder="Select Language"
                styles={customStyles}
                components={{
                  DropdownIndicator: BlueDropdownIndicator,
                  IndicatorSeparator: () => null,
                }}
                onChange={(opt: any) =>
                  setContactInfo({
                    ...contactInfo,
                    preferredLanguage: opt.value,
                  })
                }
              />
            </div>
            <div className="col-span-6 flex flex-col gap-3 pb-2">
              <span className="text-black text-sm font-medium">
                Does the client speak clear english?
              </span>
              <div className="flex gap-8">
                {["Yes", "No"].map((option) => (
                  <label
                    key={option}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <div className="relative flex items-center justify-center">
                      <input
                        type="radio"
                        className="peer appearance-none w-5 h-5 rounded-full border border-gray-300 checked:border-blue-500 checked:bg-blue-50 transition-all"
                        checked={contactInfo.speaksClearEnglish === option}
                        onChange={() =>
                          setContactInfo({
                            ...contactInfo,
                            speaksClearEnglish: option,
                          })
                        }
                      />
                      <div className="absolute w-2 h-2 bg-blue-500 rounded-full opacity-0 peer-checked:opacity-100 transition-opacity" />
                    </div>
                    <span className="text-sm text-gray-700">{option}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Row 5: Alternative Contact Person Request */}
          <div className="col-span-12 flex flex-col gap-3">
            <span className="text-black text-sm font-medium">
              Client has requested that we place all contact through an
              alternative person
            </span>
            <div className="flex gap-8">
              {["Yes", "No"].map((option) => (
                <label
                  key={option}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <div className="relative flex items-center justify-center">
                    <input
                      type="radio"
                      className="peer appearance-none w-5 h-5 rounded-full border border-gray-300 checked:border-blue-500 checked:bg-blue-50 transition-all"
                      checked={contactInfo.alternativeContact === option}
                      onChange={() =>
                        setContactInfo({
                          ...contactInfo,
                          alternativeContact: option,
                        })
                      }
                    />
                    <div className="absolute w-2 h-2 bg-blue-500 rounded-full opacity-0 peer-checked:opacity-100 transition-opacity" />
                  </div>
                  <span className="text-sm text-gray-700">{option}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>
      {/* Section 3:  Bank Details */}
      <div className="self-stretch p-5 rounded-lg border border-gray-100 flex flex-col gap-4 mt-6">
        <div className="self-stretch inline-flex justify-start items-start gap-4">
          <h2 className="text-black text-xl font-semibold leading-5 font-['Stack_Sans_Headline']">
            Bank Details
          </h2>
        </div>
        <div className="h-px bg-gray-100 w-full" />

        <div className="flex flex-col gap-6">
          {/* Row 1: Sort Code & Account Number */}
          <div className="grid grid-cols-12 gap-5 w-full">
            <div className="col-span-6 flex flex-col gap-2">
              <label className="text-gray-700 text-sm font-medium">
                Sort Code
              </label>
              <div className="h-[52px] px-5 bg-white rounded border border-gray-200 flex items-center focus-within:border-blue-500">
                <input
                  placeholder="00-00-00"
                  className="w-full bg-transparent outline-none text-gray-900 font-light"
                  onChange={(e) =>
                    setBankInfo({ ...bankInfo, sortCode: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="col-span-6 flex flex-col gap-2">
              <label className="text-gray-700 text-sm font-medium">
                Account Number
              </label>
              <div className="h-[52px] px-5 bg-white rounded border border-gray-200 flex items-center focus-within:border-blue-500">
                <input
                  placeholder="8 Digits Number"
                  className="w-full bg-transparent outline-none text-gray-900 font-light"
                  maxLength={8}
                  onChange={(e) =>
                    setBankInfo({ ...bankInfo, accountNumber: e.target.value })
                  }
                />
              </div>
            </div>
          </div>

          {/* Row 2: Pay Notification Date */}
          <div className="grid grid-cols-12 gap-5 w-full">
            <div className="col-span-6 flex flex-col gap-2 relative">
              <label className="text-gray-700 text-sm font-medium">
                Pay Notification Date
              </label>
              <div
                onClick={() => setShowPayDatePicker(!showPayDatePicker)}
                className="h-[52px] px-5 bg-white rounded border border-gray-200 flex items-center justify-between cursor-pointer focus-within:border-blue-500"
              >
                <span
                  className={
                    bankInfo.payNotificationDate
                      ? "text-gray-900 font-light"
                      : "text-gray-300 font-light"
                  }
                >
                  {bankInfo.payNotificationDate
                    ? bankInfo.payNotificationDate.toLocaleDateString("sv-SE")
                    : "Date"}
                </span>
                <img src={Vector6} className="w-4 h-4" alt="calendar" />
              </div>

              {showPayDatePicker && (
                <div className="absolute top-[80px] left-0 z-[100] shadow-xl rounded-lg bg-white">
                  <CustomDatePicker
                    selectedDate={bankInfo.payNotificationDate || new Date()}
                    onDateSelect={(date) => {
                      setBankInfo({ ...bankInfo, payNotificationDate: date });
                      setShowPayDatePicker(false);
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      {/* --- Section 4: VAT & Registration --- */}
      <div className="self-stretch p-5 rounded-lg border border-gray-100 flex flex-col gap-4 mt-6">
        {/* Header with Notify Manager Button */}
        <div className="self-stretch flex justify-between items-center">
          <h2 className="text-black text-xl font-semibold leading-5 font-['Stack_Sans_Headline']">
            VAT & Registration
          </h2>
          <button
            onClick={handleNotifyManager}
            className="h-8 px-3 py-2 bg-blue-50 hover:bg-blue-100 rounded flex items-center gap-2.5 transition-colors group"
          >
            <img src={Vector5} alt="" />
            <span className="text-blue-600 text-sm font-normal">
              Notify Manager
            </span>
          </button>
        </div>

        <div className="h-px bg-gray-100 w-full" />

        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-5">
            <span className="text-black text-sm font-medium">
              CI VAT Registered?
            </span>
            <div className="flex gap-8">
              {["Yes", "No"].map((option) => (
                <label
                  key={option}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <div className="relative flex items-center justify-center">
                    <input
                      type="radio"
                      name="vatRegistered"
                      className="peer appearance-none w-5 h-5 rounded-full border border-gray-300 checked:border-blue-500 checked:bg-blue-50 transition-all"
                      checked={vatInfo.isVatRegistered === option}
                      onChange={() => setVatInfo({ isVatRegistered: option })}
                    />
                    <div className="absolute w-2 h-2 bg-blue-500 rounded-full opacity-0 peer-checked:opacity-100 transition-opacity" />
                  </div>
                  <span className="text-sm text-gray-700">{option}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>
      {/* Section 5: Vulnerable Persons Policy */}
      <div className="self-stretch p-5 rounded-lg border border-gray-100 flex flex-col gap-4 mt-6">
        {/* Header with Policy Link Button */}
        <div className="self-stretch flex justify-between items-center">
          <h2 className="text-black text-xl font-semibold leading-5 font-['Stack_Sans_Headline']">
            Vulnerable Persons Policy
          </h2>
          <a
            href="/policy/vulnerable-people" // Hyperlink to the policy
            target="_blank"
            rel="noopener noreferrer"
            className="h-8 px-3 py-2 bg-blue-50 hover:bg-blue-100 rounded flex items-center gap-2.5 transition-colors no-underline"
          >
            <img src={Vulnerable} alt="" />
            <span className="text-blue-600 text-sm font-normal">
              Vulnerable Policy
            </span>
          </a>
        </div>

        <div className="h-px bg-gray-100 w-full" />

        <div className="flex flex-col gap-6">
          {/* Question and Radio Buttons */}
          <div className="flex flex-col gap-5">
            <span className="text-black text-sm font-medium">
              Would you class the driver as a vulnerable person?
            </span>
            <div className="flex gap-8">
              {["Yes", "No"].map((option) => (
                <label
                  key={option}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <div className="relative flex items-center justify-center">
                    <input
                      type="radio"
                      name="vulnerableStatus"
                      className="peer appearance-none w-5 h-5 rounded-full border border-gray-300 checked:border-blue-500 checked:bg-blue-50 transition-all"
                      checked={vulnerabilityInfo.isVulnerable === option}
                      onChange={() =>
                        setVulnerabilityInfo({
                          ...vulnerabilityInfo,
                          isVulnerable: option,
                        })
                      }
                    />
                    <div className="absolute w-2 h-2 bg-blue-500 rounded-full opacity-0 peer-checked:opacity-100 transition-opacity" />
                  </div>
                  <span className="text-sm text-gray-700">{option}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Conditional "Why?" Field and Notify Manager Button */}
          {vulnerabilityInfo.isVulnerable === "Yes" && (
            <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex flex-col gap-2">
                <label className="text-gray-700 text-sm font-medium">
                  Why?
                </label>
                <div className="px-5 py-4 bg-white rounded border border-gray-200 focus-within:border-blue-500">
                  <textarea
                    placeholder="Please provide details regarding the driver's vulnerability..."
                    className="w-full bg-transparent outline-none text-gray-900 font-light min-h-[80px] resize-none"
                    value={vulnerabilityInfo.reason}
                    onChange={(e) =>
                      setVulnerabilityInfo({
                        ...vulnerabilityInfo,
                        reason: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              {/* Notify Manager specifically for Vulnerability */}
              <div className="flex justify-start">
                <button
                  onClick={() =>
                    alert("Alerting supervisor via email...")
                  }
                  className="h-10 px-4 bg-blue-500 hover:bg-blue-600 rounded text-white text-sm font-medium flex items-center gap-2 transition-all shadow-sm"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M22 17a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9.5C2 7 4 5 6.5 5H17.5C20 5 22 7 22 9.5V17Z" />
                    <polyline points="2,9.5 12,15 22,9.5" />
                  </svg>
                  Notify Manager regarding Vulnerability
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};;
