import { components, type DropdownIndicatorProps, type StylesConfig } from "react-select";
import Vector6 from "../../../assets/AutoClaim_icon/Vector-6.svg";
import Vector5 from "../../../assets/AutoClaim_icon/Vector-5.svg";
import Vulnerable from "../../../assets/AutoClaim_icon/Vulnerable.svg";
import { useEffect, useRef, useState } from "react";
import { CustomDatePicker } from "../Components/DatePicker";
import Select from "react-select";
import { Activity, Calendar, ChevronDown, Clock, FileText, MapPin, Minus, Plus, Search, Trash2, Upload, X } from "lucide-react";
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

export const VehicleDetailsForm = () => {
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
  });
  const weatherOptions = [
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
  const fuelOptions = [
    { value: "Petrol", label: "Petrol" },
    { value: "Diesel", label: "Diesel" },
    { value: "Electric", label: "Electric" },
    { value: "Hybrid", label: "Hybrid" },
  ];

  const transmissionOptions = [
    { value: "Automatic", label: "Automatic" },
    { value: "Manual", label: "Manual" },
  ];

  const categoryOptions = [
    { value: "PCO", label: "PCO" },
    { value: "Standard", label: "Standard" },
    { value: "Commercial", label: "Commercial" },
  ];const taxiTypeOptions = [
    { value: "Hackney", label: "Hackney" },
    { value: "Private Hire", label: "Private Hire" },
  ];const [boroughInfo, setBoroughInfo] = useState({
    boroughName: "",
    taxiType: null,
    clientBadgeNumber: "",
    badgeExpiryDate: "",
    vehicleBadgeNumber: "",
    hasOtherBorough: "No",
    otherBoroughName: "",
  });
  const [claimType, setClaimType] = useState<
    "RTA – CAMS" | "RTA – Nationwide Assist"
  >("RTA – CAMS");
  const [vehicleInfo, setVehicleInfo] = useState({
    make: "",
    model: "",
    bodyType: "",
    registration: "",
    color: "",
    fuelType: null,
    engineSize: "",
    transmission: null,
    seats: 5,
    category: null,
    borough: "",
  });
  // 2. Add/Remove Logic for Dynamic Sections
  const addTPVehicle = () => {
    const newId = thirdPartyVehicles.length + 1;
    setThirdPartyVehicles([
      ...thirdPartyVehicles,
      {
        id: newId,
        make: "",
        model: "",
        registration: "",
        color: "",
        hasImages: "No",
      },
    ]);
  };

  const removeTPVehicle = (id: number) => {
    if (thirdPartyVehicles.length > 1) {
      setThirdPartyVehicles(thirdPartyVehicles.filter((v) => v.id !== id));
    }
  };
  const [currentVehicle, setCurrentVehicle] = useState({
    make: "",
    model: "",
    registration: "",
    color: "",
    imagesAvailable: "Yes",
  });

  // Validation Logic based on Acceptance Criteria
  const isVehicleValid =
    currentVehicle.make && currentVehicle.model && currentVehicle.registration;
const [isModalOpen, setIsModalOpen] = useState(false);
const [thirdPartyVehicles, setThirdPartyVehicles] = useState([]);
  const handleSave = (addNext = false) => {
    if (!isVehicleValid) {
      alert("Please fill in mandatory fields: Make, Model, and Registration.");
      return;
    }

    setThirdPartyVehicles([
      ...thirdPartyVehicles,
      { ...currentVehicle, id: Date.now() },
    ]);

    if (addNext) {
      setCurrentVehicle({
        make: "",
        model: "",
        registration: "",
        color: "",
        imagesAvailable: "Yes",
      });
    } else {
      setIsModalOpen(false);
      setCurrentVehicle({
        make: "",
        model: "",
        registration: "",
        color: "",
        imagesAvailable: "Yes",
      });
    }
  };
  return (
    <div className="MainContent w-[788px] ms-[140px] flex-1 inline-flex flex-col items-start gap-6 p-8 overflow-y-auto scrollbar-hide">
      {/* Container matching left-[534px] and top-[157px] from source */}
      <h1 className="text-black text-2xl font-semibold font-['Stack_Sans_Headline']">
        Vehicle Details
      </h1>
      {/* Section 1: Personal Information Section */}
      <div className="self-stretch p-5 rounded-lg border border-gray-100 flex flex-col gap-4">
        <div className="flex justify-between items-center w-full">
          <h2 className="text-black text-xl font-semibold leading-5 font-['Stack_Sans_Headline']">
            Client's Vehicle Details
          </h2>
          <button className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-600 rounded-md text-sm font-medium hover:bg-blue-100 transition-colors">
            <Upload className="w-4 h-4" />
            Upload V5C File
          </button>
        </div>
        <div className="h-px bg-gray-100 w-full" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Make */}
          <div className="flex flex-col gap-2">
            <label className="text-gray-700 text-sm font-medium">Make</label>
            <input
              type="text"
              placeholder="Enter Make"
              className="w-full px-5 py-4 bg-white rounded border border-gray-200 text-base font-light focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          {/* Model */}
          <div className="flex flex-col gap-2">
            <label className="text-gray-700 text-sm font-medium">Model</label>
            <input
              type="text"
              placeholder="Enter Model"
              className="w-full px-5 py-4 bg-white rounded border border-gray-200 text-base font-light focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          {/* Body Type */}
          <div className="flex flex-col gap-2">
            <label className="text-gray-700 text-sm font-medium">
              Body Type
            </label>
            <input
              type="text"
              placeholder="Enter Body Type"
              className="w-full px-5 py-4 bg-white rounded border border-gray-200 text-base font-light focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          {/* Vehicle Registration */}
          <div className="flex flex-col gap-2">
            <label className="text-gray-700 text-sm font-medium">
              Vehicle Registration
            </label>
            <input
              type="text"
              placeholder="Enter Registration"
              className="w-full px-5 py-4 bg-white rounded border border-gray-200 text-base font-light focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          {/* Color */}
          <div className="flex flex-col gap-2">
            <label className="text-gray-700 text-sm font-medium">Color</label>
            <input
              type="text"
              placeholder="Enter Color"
              className="w-full px-5 py-4 bg-white rounded border border-gray-200 text-base font-light focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          {/* Fuel Type */}
          <div className="flex flex-col gap-2">
            <label className="text-gray-700 text-sm font-medium">
              Fuel Type
            </label>
            <Select
              options={fuelOptions}
              placeholder="Select Type"
              styles={customStyles}
              components={{
                DropdownIndicator: BlueDropdownIndicator,
                IndicatorSeparator: () => null,
              }}
            />
          </div>
          {/* Engine Size */}
          <div className="flex flex-col gap-2">
            <label className="text-gray-700 text-sm font-medium">
              Engine Size
            </label>
            <input
              type="number"
              placeholder="Enter Size (cc)"
              className="w-full px-5 py-4 bg-white rounded border border-gray-200 text-base font-light focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          {/* Transmission */}
          <div className="flex flex-col gap-2">
            <label className="text-gray-700 text-sm font-medium">
              Transmission
            </label>
            <Select
              options={transmissionOptions}
              placeholder="Select Type"
              styles={customStyles}
              components={{
                DropdownIndicator: BlueDropdownIndicator,
                IndicatorSeparator: () => null,
              }}
            />
          </div>
          {/* Number of Seats */}
          <div className="flex flex-col gap-2">
            <label className="text-gray-700 text-sm font-medium">
              Number of Seats (Inc. Driver)
            </label>
            <div className="flex items-center justify-between px-4 py-3 bg-white rounded border border-gray-200 h-[52px]">
              <button
                onClick={() =>
                  setVehicleInfo((v) => ({
                    ...v,
                    seats: Math.max(1, v.seats - 1),
                  }))
                }
                className="text-blue-500"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="text-black">{vehicleInfo.seats}</span>
              <button
                onClick={() =>
                  setVehicleInfo((v) => ({ ...v, seats: v.seats + 1 }))
                }
                className="text-blue-500"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
          {/* Category */}
          <div className="flex flex-col gap-2">
            <label className="text-gray-700 text-sm font-medium">
              Vehicle Category
            </label>
            <Select
              options={categoryOptions}
              placeholder="Select Category"
              styles={customStyles}
              components={{
                DropdownIndicator: BlueDropdownIndicator,
                IndicatorSeparator: () => null,
              }}
            />
          </div>
        </div>

        {/* Conditional Borough Section */}
        {claimType === "RTA – Nationwide Assist" && (
          <div className="mt-4 p-4 bg-blue-50/50 rounded-lg border border-blue-100 flex flex-col gap-2 animate-in fade-in duration-300">
            <label className="text-gray-700 text-sm font-medium">
              Borough <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Enter Borough (Mandatory for Nationwide Assist)"
              className="w-full px-5 py-4 bg-white rounded border border-blue-200 text-base focus:ring-2 focus:ring-blue-500/20"
              required
            />
          </div>
        )}
      </div>
      {/* Section 2:  Contact Information */}
      {claimType === "RTA – Nationwide Assist" && (
        <div className="self-stretch p-5 rounded-lg border border-gray-100 flex flex-col gap-4 mt-6 animate-in fade-in duration-500">
          <div className="flex justify-between items-center w-full">
            <h2 className="text-black text-xl font-semibold leading-5 font-['Stack_Sans_Headline']">
              Borough Details
            </h2>
          </div>
          <div className="h-px bg-gray-100 w-full" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Borough Name - Mandatory */}
            <div className="flex flex-col gap-2">
              <label className="text-gray-700 text-sm font-medium">
                Borough <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Enter Name"
                className="w-full px-5 py-4 bg-white rounded border border-gray-200 text-base font-light focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                required
              />
            </div>

            {/* Taxi Type Dropdown */}
            <div className="flex flex-col gap-2">
              <label className="text-gray-700 text-sm font-medium">
                Taxi Type
              </label>
              <Select
                options={taxiTypeOptions}
                placeholder="Select Type"
                styles={customStyles}
                components={{
                  DropdownIndicator: BlueDropdownIndicator,
                  IndicatorSeparator: () => null,
                }}
              />
            </div>

            {/* Client Badge Number */}
            <div className="flex flex-col gap-2">
              <label className="text-gray-700 text-sm font-medium">
                Client Badge Number
              </label>
              <input
                type="number"
                placeholder="Enter Number"
                className="w-full px-5 py-4 bg-white rounded border border-gray-200 text-base font-light focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            {/* Badge Expiry Date */}
            <div className="flex flex-col gap-2">
              <label className="text-gray-700 text-sm font-medium">
                Badge Expiry Date
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Date"
                  className="w-full px-5 py-4 bg-white rounded border border-gray-200 text-base font-light focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
                <Calendar className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-400" />
              </div>
            </div>

            {/* Vehicle Badge Number */}
            <div className="flex flex-col gap-2">
              <label className="text-gray-700 text-sm font-medium">
                Vehicle Badge Number
              </label>
              <input
                type="number"
                placeholder="Enter Number"
                className="w-full px-5 py-4 bg-white rounded border border-gray-200 text-base font-light focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          <div className="h-px bg-gray-100 w-full my-2" />

          {/* Other Borough Toggle Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-end">
            <div className="flex flex-col gap-5">
              <label className="text-black text-sm font-medium">
                Any Other Borough?
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
                        name="otherBorough"
                        className="sr-only"
                        checked={boroughInfo.hasOtherBorough === option}
                        onChange={() =>
                          setBoroughInfo({
                            ...boroughInfo,
                            hasOtherBorough: option,
                          })
                        }
                      />
                      <div
                        className={`w-5 h-5 rounded-full border-2 ${boroughInfo.hasOtherBorough === option ? "border-blue-500 bg-blue-100" : "border-gray-300 bg-white"}`}
                      />
                      {boroughInfo.hasOtherBorough === option && (
                        <div className="absolute w-2 h-2 rounded-full bg-blue-600" />
                      )}
                    </div>
                    <span className="text-black text-sm">{option}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Conditional Other Borough Input */}
            <div
              className={`flex flex-col gap-2 transition-opacity duration-300 ${boroughInfo.hasOtherBorough === "Yes" ? "opacity-100" : "opacity-40 pointer-events-none"}`}
            >
              <label className="text-gray-700 text-sm font-medium">
                Borough
              </label>
              <input
                type="text"
                placeholder="Enter Name"
                disabled={boroughInfo.hasOtherBorough === "No"}
                className="w-full px-5 py-4 bg-white rounded border border-gray-200 text-base font-light focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>
        </div>
      )}

      {/* SECTION: Third Party Vehicles */}
      <div className="self-stretch p-5 bg-gray-50 rounded-lg border border-gray-100 flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <h2 className="text-black text-xl font-semibold">
            Third Party Vehicles
          </h2>
          <button
            onClick={() => setIsModalOpen(true)}
            className="h-8 px-3 py-2 rounded flex items-center gap-2.5 text-blue-500 hover:bg-blue-50 border border-blue-100"
          >
            <Plus className="w-4 h-4" /> Add Vehicle
          </button>
        </div>

        {thirdPartyVehicles.length === 0 ? (
          <p className="text-gray-600 text-sm">
            Add Third Party Vehicle details by clicking on “Add Vehicle”
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {thirdPartyVehicles.map((v) => (
              <div
                key={v.id}
                className="p-4 bg-white border border-gray-200 rounded flex justify-between items-center"
              >
                <div>
                  <p className="font-semibold">
                    {v.make} {v.model}
                  </p>
                  <p className="text-sm text-gray-500">
                    {v.registration} • {v.color}
                  </p>
                </div>
                <button
                  onClick={() =>
                    setThirdPartyVehicles(
                      thirdPartyVehicles.filter((item) => item.id !== v.id),
                    )
                  }
                  className="text-red-500 p-2 hover:bg-red-50 rounded"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL: Third Party Vehicle Entry */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-[800px] flex flex-col gap-6">
            <div className="flex justify-between items-center">
              <h2 className="text-black text-xl font-semibold">
                Third Party Vehicle Details
              </h2>
              <button onClick={() => setIsModalOpen(false)}>
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>

            <div className="h-px bg-gray-100 w-full" />

            {/* Input Grid */}
            <div className="grid grid-cols-2 gap-5">
              <div className="flex flex-col gap-2">
                <label className="text-gray-700 text-sm font-medium">
                  Make <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className="px-5 py-4 border border-gray-200 rounded outline-none focus:ring-2 focus:ring-blue-500/20"
                  placeholder="Enter Make"
                  value={currentVehicle.make}
                  onChange={(e) =>
                    setCurrentVehicle({
                      ...currentVehicle,
                      make: e.target.value,
                    })
                  }
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-gray-700 text-sm font-medium">
                  Model <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className="px-5 py-4 border border-gray-200 rounded outline-none focus:ring-2 focus:ring-blue-500/20"
                  placeholder="Enter Model"
                  value={currentVehicle.model}
                  onChange={(e) =>
                    setCurrentVehicle({
                      ...currentVehicle,
                      model: e.target.value,
                    })
                  }
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-gray-700 text-sm font-medium">
                  Registration <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className="px-5 py-4 border border-gray-200 rounded outline-none focus:ring-2 focus:ring-blue-500/20"
                  placeholder="Enter Registration"
                  value={currentVehicle.registration}
                  onChange={(e) =>
                    setCurrentVehicle({
                      ...currentVehicle,
                      registration: e.target.value,
                    })
                  }
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-gray-700 text-sm font-medium">
                  Color
                </label>
                <input
                  type="text"
                  className="px-5 py-4 border border-gray-200 rounded outline-none focus:ring-2 focus:ring-blue-500/20"
                  placeholder="Enter Color"
                  value={currentVehicle.color}
                  onChange={(e) =>
                    setCurrentVehicle({
                      ...currentVehicle,
                      color: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            {/* Images Radio Group */}
            <div className="flex flex-col gap-4">
              <label className="text-black text-sm font-medium">
                Images Available
              </label>
              <div className="flex gap-5">
                {["Yes", "No"].map((option) => (
                  <label
                    key={option}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="imgAvail"
                      className="hidden"
                      checked={currentVehicle.imagesAvailable === option}
                      onChange={() =>
                        setCurrentVehicle({
                          ...currentVehicle,
                          imagesAvailable: option,
                        })
                      }
                    />
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${currentVehicle.imagesAvailable === option ? "border-blue-500" : "border-gray-300"}`}
                    >
                      {currentVehicle.imagesAvailable === option && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full" />
                      )}
                    </div>
                    <span className="text-sm">{option}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="h-px bg-gray-100 w-full" />

            {/* Modal Actions */}
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-4 border border-blue-600 text-blue-600 rounded font-medium hover:bg-blue-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSave(false)}
                className="px-6 py-4 bg-blue-600 text-white rounded font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                Save
              </button>
              <button
                onClick={() => handleSave(true)}
                className="px-6 py-4 bg-blue-600 text-white rounded font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                Save and Add Next Vehicle
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SECTION: Vehicle Checkpoint */}
      <div className="self-stretch p-5 rounded-lg border border-gray-100 flex flex-col gap-4">
        <h2 className="text-black text-xl font-semibold leading-5 font-['Stack_Sans_Headline']">
          Vehicle Checkpoint
        </h2>
        <div className="h-px bg-gray-100 w-full" />

        <div className="grid grid-cols-3 gap-5">
          {/* Vehicle Check Card */}
          <a
            href="https://www.carcheck.co.uk/"
            target="_self"
            className="p-4 rounded-lg border border-blue-300 flex flex-col items-center gap-2 hover:bg-blue-50 transition-colors group"
          >
            <Search className="w-5 h-5 text-blue-500" />
            <span className="text-blue-500 text-sm font-normal">
              Vehicle Check
            </span>
          </a>

          {/* DVLA Card */}
          <a
            href="https://www.gov.uk/view-driving-licence"
            target="_self"
            className="p-4 rounded-lg border border-blue-300 flex flex-col items-center gap-2 hover:bg-blue-50 transition-colors group"
          >
            <FileText className="w-5 h-5 text-blue-500" />
            <span className="text-blue-500 text-sm font-normal">DVLA</span>
          </a>

          {/* Process MID Card */}
          <a
            href="https://www.askmid.com/"
            target="_self"
            className="p-4 rounded-lg border border-blue-300 flex flex-col items-center gap-2 hover:bg-blue-50 transition-colors group"
          >
            <Activity className="w-5 h-5 text-blue-500" />
            <span className="text-blue-500 text-sm font-normal">
              Process MID
            </span>
          </a>
        </div>
      </div>

      {/* SECTION: Third Party Vehicle Section (Dynamic) */}
      <div className="self-stretch flex flex-col gap-6">
        {thirdPartyVehicles.map((vehicle, index) => (
          <div
            key={vehicle.id}
            className="p-5 rounded-lg border border-gray-100 flex flex-col gap-4 bg-white relative"
          >
            <div className="flex justify-between items-center">
              <h2 className="text-black text-xl font-semibold leading-5">
                Third Party Vehicle {index + 1}
              </h2>
              {index > 0 && (
                <button
                  onClick={() => removeTPVehicle(vehicle.id)}
                  className="text-red-500 flex items-center gap-1 text-sm hover:underline"
                >
                  <Trash2 className="w-4 h-4" /> Remove
                </button>
              )}
            </div>
            <div className="h-px bg-gray-100 w-full" />

            <div className="grid grid-cols-2 gap-5">
              <div className="flex flex-col gap-2">
                <label className="text-gray-700 text-sm font-medium">
                  Make
                </label>
                <input
                  type="text"
                  placeholder="Enter Make"
                  className="w-full px-5 py-4 bg-white rounded border border-gray-200 text-base font-light"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-gray-700 text-sm font-medium">
                  Model
                </label>
                <input
                  type="text"
                  placeholder="Enter Model"
                  className="w-full px-5 py-4 bg-white rounded border border-gray-200 text-base font-light"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-gray-700 text-sm font-medium">
                  Vehicle Registration
                </label>
                <input
                  type="text"
                  placeholder="Enter Registration"
                  className="w-full px-5 py-4 bg-white rounded border border-gray-200 text-base font-light"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-gray-700 text-sm font-medium">
                  Colour
                </label>
                <input
                  type="text"
                  placeholder="Enter Colour"
                  className="w-full px-5 py-4 bg-white rounded border border-gray-200 text-base font-light"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-gray-700 text-sm font-medium">
                  Images of Third Party Vehicle Available?
                </label>
                <Select
                  options={[
                    { value: "Yes", label: "Yes" },
                    { value: "No", label: "No" },
                  ]}
                  styles={customStyles}
                  components={{
                    DropdownIndicator: BlueDropdownIndicator,
                    IndicatorSeparator: () => null,
                  }}
                />
              </div>
            </div>
          </div>
        ))}

        {/* <button
          onClick={addTPVehicle}
          className="self-start flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded border border-blue-200 font-medium hover:bg-blue-100 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add More Third Party Vehicle
        </button> */}
      </div>
    </div>
  );
};;
