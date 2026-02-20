import { components, type DropdownIndicatorProps, type StylesConfig } from "react-select";
import Vector6 from "../../../assets/AutoClaim_icon/Vector-6.svg";
import Vector5 from "../../../assets/AutoClaim_icon/Vector-5.svg";
import Vulnerable from "../../../assets/AutoClaim_icon/Vulnerable.svg";
import { useEffect, useRef, useState } from "react";
import { CustomDatePicker } from "../Components/DatePicker";
import Select from "react-select";
import { Calendar, ChevronDown, Clock, MapPin, Minus, Plus } from "lucide-react";
import { PassengerDetailsModal } from "./PassengerDetailsModal";
import { WitnessDetailsModal } from "./WitnessDetailsmodal";
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
          stroke="#0352FD"
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
    borderColor: state.isFocused ? '#0352FD' : '#E5E7EB',
    boxShadow: 'none',
    '&:hover': { borderColor: '#0352FD' },
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
    backgroundColor: state.isSelected ? '#0352FD' : state.isFocused ? '#EFF6FF' : 'white',
    color: state.isSelected ? 'white' : '#374151',
  }),
};

const handlerOptions = [
  { value: "Private Hire Driver", label: "Private Hire Driver" },
  { value: "Taxi Driver", label: "Taxi Driver" },
  { value: "Others", label: "Others" },
];

export const AccidentDetailsForm = () => {
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
const [attendeeInfo, setAttendeeInfo] = useState({
  anyPassengers: "Yes",
  passengerCount: 1,
  anyWitnesses: "Yes",
  policeAttended: "Yes",
  dashcamFootage: "Yes",
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
});const weatherOptions = [
  { value: "sunny", label: "Sunny" },
  { value: "rainy", label: "Rainy" },
  { value: "cloudy", label: "Cloudy" },
];
const [vulnerabilityInfo, setVulnerabilityInfo] = useState({
  isVulnerable: "No",
  reason: "",
});
const handleNotifyManager = () => {
  console.log("Manager Notified");
  // Add your email/notification logic here
};
  const [witnessModal, openWitnessModal] = useState(false);
    const [passengerModal, openPassengerModal] = useState(false);
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
      {passengerModal && (
        <PassengerDetailsModal onClose={() => openPassengerModal(false)} />
      )}
      {witnessModal && (
        <WitnessDetailsModal onClose={() => openWitnessModal(false)} />
      )}
      {/* Container matching left-[534px] and top-[157px] from source */}
      <h1 className="text-black text-2xl font-semibold font-['Stack_Sans_Headline']">
        Accident Details
      </h1>
      {/* Section 1: Personal Information Section */}
      <div className="self-stretch p-5 rounded-lg border border-gray-100 flex flex-col gap-4">
        {/* Header Aligned Exactly Like Previous Sections */}
        <h2 className="text-black text-xl font-semibold leading-5 font-['Stack_Sans_Headline']">
          Location & Condition Details
        </h2>
        <div className="h-px bg-gray-100 w-full" />

        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Date Input */}
            <div className="flex flex-col gap-2">
              <label className="text-gray-700 text-sm font-medium">Date</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Date"
                  className="w-full px-5 py-4 bg-white rounded border border-gray-200 text-base font-light focus:outline-none focus:ring-2 focus:ring-blue-500/20 placeholder:text-gray-300"
                />
                <Calendar className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-400" />
              </div>
            </div>

            {/* Time Input */}
            <div className="flex flex-col gap-2">
              <label className="text-gray-700 text-sm font-medium">Time</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Enter Time"
                  className="w-full px-5 py-4 bg-white rounded border border-gray-200 text-base font-light focus:outline-none focus:ring-2 focus:ring-blue-500/20 placeholder:text-gray-300"
                />
                <Clock className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
              </div>
            </div>

            {/* Weather Dropdown */}
            <div className="flex flex-col gap-2">
              <label className="text-gray-700 text-sm font-medium">
                Weather Conditions
              </label>
              <Select
                options={weatherOptions}
                placeholder="Select Weather"
                styles={customStyles} // Using your predefined styles
                components={{
                  DropdownIndicator: BlueDropdownIndicator, // Using your custom blue arrow
                  IndicatorSeparator: () => null, // Removes the vertical line for a cleaner look
                }}
                isSearchable={false}
                classNamePrefix="react-select"
              />
            </div>

            {/* Location Input */}
            <div className="flex flex-col gap-2">
              <label className="text-gray-700 text-sm font-medium">
                Location
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Enter Address"
                  className="w-full px-5 py-4 bg-white rounded border border-gray-200 text-base font-light focus:outline-none focus:ring-2 focus:ring-blue-500/20 placeholder:text-gray-300"
                />
                {/* <MapPin className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" /> */}
              </div>
            </div>
          </div>

          {/* Version of Events Textarea */}
          <div className="flex flex-col gap-2">
            <label className="text-gray-700 text-sm font-medium">
              Version of Events
            </label>
            <textarea
              placeholder="Enter Events"
              className="w-full h-32 px-5 py-4 bg-white rounded border border-gray-200 text-base font-light focus:outline-none focus:ring-2 focus:ring-blue-500/20 placeholder:text-gray-300 resize-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Services Date */}
            <div className="flex flex-col gap-2">
              <label className="text-gray-700 text-sm font-medium">
                Services Date
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Date"
                  className="w-full px-5 py-4 bg-white rounded border border-gray-200 text-base font-light focus:outline-none focus:ring-2 focus:ring-blue-500/20 placeholder:text-gray-300"
                />
                <Calendar className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-400" />
              </div>
            </div>

            {/* Services Time */}
            <div className="flex flex-col gap-2">
              <label className="text-gray-700 text-sm font-medium">
                Services Time
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Enter Time"
                  className="w-full px-5 py-4 bg-white rounded border border-gray-200 text-base font-light focus:outline-none focus:ring-2 focus:ring-blue-500/20 placeholder:text-gray-300"
                />
                {/* <Clock className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" /> */}
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Section 2:  Contact Information */}
      <div className="self-stretch p-5 rounded-lg border border-gray-100 flex flex-col gap-4 mt-6">
        <div className="self-stretch p-5 rounded-lg border border-gray-100 flex flex-col gap-4 mt-6">
          <h2 className="text-black text-xl font-semibold leading-5 font-['Stack_Sans_Headline']">
            Attendees
          </h2>
          <div className="h-px bg-gray-100 w-full" />

          {/* Passengers Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-end">
            {/* Radio Group */}
            <div className="flex flex-col gap-5">
              <label className="text-black text-sm font-medium font-['Stack_Sans_Headline']">
                Any Passengers?
              </label>
              <div className="flex items-center gap-5">
                {["Yes", "No"].map((option) => (
                  <label
                    key={option}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <div className="relative flex items-center justify-center">
                      <input
                        type="radio"
                        name="anyPassengers"
                        className="sr-only"
                        checked={attendeeInfo.anyPassengers === option}
                        onChange={() =>
                          setAttendeeInfo({
                            ...attendeeInfo,
                            anyPassengers: option,
                          })
                        }
                      />
                      <div
                        className={`w-5 h-5 rounded-full border-2 ${attendeeInfo.anyPassengers === option ? "border-blue-500 bg-blue-100" : "border-gray-300 bg-white"}`}
                      />
                      {attendeeInfo.anyPassengers === option && (
                        <div className="absolute w-2 h-2 rounded-full bg-blue-600" />
                      )}
                    </div>
                    <span className="text-black text-sm">{option}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Counter Input */}
            <div className="flex flex-col gap-2">
              <label className="text-gray-700 text-sm font-medium">
                Number of Passengers
              </label>
              <div className="flex items-center justify-between px-4 py-3 bg-white rounded border border-gray-200">
                <button
                  onClick={() =>
                    setAttendeeInfo((prev) => ({
                      ...prev,
                      passengerCount: Math.max(0, prev.passengerCount - 1),
                    }))
                  }
                  className="text-blue-500 hover:bg-blue-50 p-1 rounded transition-colors"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="text-black text-base font-light">
                  {attendeeInfo.passengerCount}
                </span>
                <button
                  onClick={() =>
                    setAttendeeInfo((prev) => ({
                      ...prev,
                      passengerCount: prev.passengerCount + 1,
                    }))
                  }
                  className="text-blue-500 hover:bg-blue-50 p-1 rounded transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Passenger Details Info Box */}
          <div className="bg-gray-50 p-4 rounded-lg flex flex-col gap-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-700 text-base font-semibold">
                Passenger Details
              </span>
              <button
                className="flex items-center gap-2 px-3 py-1.5 rounded text-blue-500 text-sm font-medium hover:bg-blue-50 transition-colors"
                onClick={() => openPassengerModal(true)}
              >
                <Plus className="w-4 h-4" />
                Add Passenger Details
              </button>
            </div>
            <p className="text-gray-600 text-sm">
              Add passengers details by clicking on “Add Passenger Details”.
            </p>
          </div>

          <div className="h-px bg-gray-100 w-full my-2" />

          {/* Witnesses Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="flex flex-col gap-5">
              <label className="text-black text-sm font-medium">
                Any Witnesses?
              </label>
              <div className="flex items-center gap-5">
                {["Yes", "No"].map((option) => (
                  <label
                    key={option}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <div className="relative flex items-center justify-center">
                      <input
                        type="radio"
                        name="anyWitnesses"
                        className="sr-only"
                        checked={attendeeInfo.anyWitnesses === option}
                        onChange={() =>
                          setAttendeeInfo({
                            ...attendeeInfo,
                            anyWitnesses: option,
                          })
                        }
                      />
                      <div
                        className={`w-5 h-5 rounded-full border-2 ${attendeeInfo.anyWitnesses === option ? "border-blue-500 bg-blue-100" : "border-gray-300 bg-white"}`}
                      />
                      {attendeeInfo.anyWitnesses === option && (
                        <div className="absolute w-2 h-2 rounded-full bg-blue-600" />
                      )}
                    </div>
                    <span className="text-black text-sm">{option}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Witnesses Details Box */}
          <div className="bg-gray-50 p-4 rounded-lg flex flex-col gap-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-700 text-base font-semibold">
                Witnesses Details
              </span>
              <button
                className="flex items-center gap-2 px-3 py-1.5 rounded text-blue-500 text-sm font-medium hover:bg-blue-50"
                onClick={() => openWitnessModal(true)}
              >
                <Plus className="w-4 h-4" />
                Add Witness Details
              </button>
            </div>
            <p className="text-gray-600 text-sm">
              Add witnesses details by clicking on “Add Witness Details”.
            </p>
          </div>

          <div className="h-px bg-gray-100 w-full my-2" />

          {/* Police Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="flex flex-col gap-5">
              <label className="text-black text-sm font-medium">
                Did Police Attend?
              </label>
              <div className="flex items-center gap-5">
                {["Yes", "No"].map((option) => (
                  <label
                    key={option}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <div className="relative flex items-center justify-center">
                      <input
                        type="radio"
                        name="policeAttended"
                        className="sr-only"
                        checked={attendeeInfo.policeAttended === option}
                        onChange={() =>
                          setAttendeeInfo({
                            ...attendeeInfo,
                            policeAttended: option,
                          })
                        }
                      />
                      <div
                        className={`w-5 h-5 rounded-full border-2 ${attendeeInfo.policeAttended === option ? "border-blue-500 bg-blue-100" : "border-gray-300 bg-white"}`}
                      />
                      {attendeeInfo.policeAttended === option && (
                        <div className="absolute w-2 h-2 rounded-full bg-blue-600" />
                      )}
                    </div>
                    <span className="text-black text-sm">{option}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Police Details Box */}
          <div className="bg-gray-50 p-4 rounded-lg flex flex-col gap-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-700 text-base font-semibold">
                Police Details
              </span>
              <button className="flex items-center gap-2 px-3 py-1.5 rounded text-blue-500 text-sm font-medium hover:bg-blue-50">
                <Plus className="w-4 h-4" />
                Add Police Details
              </button>
            </div>
            <p className="text-gray-600 text-sm">
              Add Police details by clicking on “Add Police Details”.
            </p>
          </div>

          <div className="h-px bg-gray-100 w-full my-2" />

          {/* Dashcam Row */}
          <div className="flex flex-col gap-5">
            <label className="text-black text-sm font-medium">
              Dashcam Footage?
            </label>
            <div className="flex items-center gap-5">
              {["Yes", "No"].map((option) => (
                <label
                  key={option}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <div className="relative flex items-center justify-center">
                    <input
                      type="radio"
                      name="dashcamFootage"
                      className="sr-only"
                      checked={attendeeInfo.dashcamFootage === option}
                      onChange={() =>
                        setAttendeeInfo({
                          ...attendeeInfo,
                          dashcamFootage: option,
                        })
                      }
                    />
                    <div
                      className={`w-5 h-5 rounded-full border-2 ${attendeeInfo.dashcamFootage === option ? "border-blue-500 bg-blue-100" : "border-gray-300 bg-white"}`}
                    />
                    {attendeeInfo.dashcamFootage === option && (
                      <div className="absolute w-2 h-2 rounded-full bg-blue-600" />
                    )}
                  </div>
                  <span className="text-black text-sm">{option}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};;
