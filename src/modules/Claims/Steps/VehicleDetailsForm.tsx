import Vehicle from "../../../assets/AutoClaim_icon/Vehicle.svg";
import DVLA from "../../../assets/AutoClaim_icon/DVLA.svg"
import Yes from "../../../assets/AutoClaim_icon/Yes.svg";
import No from "../../../assets/AutoClaim_icon/No.svg";
import MID from "../../../assets/AutoClaim_icon/MID.svg";
import { useState } from "react";
import Select from "react-select";
import { Calendar, Edit2, Minus, Plus,Trash2, Upload, X } from "lucide-react";
import { VehicleCheckModal } from "./VehicleCheckModal";
import { DVLAModal } from "./DVLAModal";
import { MIDModal } from "./MIDModal";
import { BlueDropdownIndicator, customStyles } from "./GeneralDetailsForm";
import pencil from "../../../assets/AutoClaim_icon/pencil.svg";
import trash from "../../../assets/AutoClaim_icon/trash.svg";

export const VehicleDetailsForm = () => {

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
  const [checkModal, openModal1] = useState<boolean>(false)
  const [dvlaModal, openModal2] = useState<boolean>(false);
  const [midModal, openModal3] = useState<boolean>(false);
  
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
      <h1 className="text-black text-2xl font-weight-600 font-['Stack_Sans_Headline']">
        Vehicle Details
      </h1>
      {/* Section 1: Personal Information Section */}
      <div className="self-stretch p-5 rounded-lg border border-gray-100 flex flex-col gap-4">
        <div className="flex justify-between items-center w-full">
          <h2 className="text-black text-xl font-weight-600 leading-5 font-['Stack_Sans_Headline']">
            Client's Vehicle Details
          </h2>
          <button className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-600 rounded-md text-sm font-weight-400 hover:bg-blue-100 transition-colors">
            <Upload className="w-4 h-4" />
            Upload V5C File
          </button>
        </div>
        <div className="h-px bg-gray-100 w-full" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Make */}
          <div className="flex flex-col gap-2">
            <label className="text-neutral-900 text-sm font-weight-400">
              Make
            </label>
            <input
              type="text"
              placeholder="Enter Make"
              className="w-full px-5 py-4 bg-white rounded border border-gray-200 text-base font-light focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          {/* Model */}
          <div className="flex flex-col gap-2">
            <label className="text-neutral-900 text-sm font-weight-400">
              Model
            </label>
            <input
              type="text"
              placeholder="Enter Model"
              className="w-full px-5 py-4 bg-white rounded border border-gray-200 text-base font-light focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          {/* Body Type */}
          <div className="flex flex-col gap-2">
            <label className="text-neutral-900 text-sm font-weight-400">
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
            <label className="text-neutral-900 text-sm font-weight-400">
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
            <label className="text-neutral-900 text-sm font-weight-400">
              Color
            </label>
            <input
              type="text"
              placeholder="Enter Color"
              className="w-full px-5 py-4 bg-white rounded border border-gray-200 text-base font-light focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          {/* Fuel Type */}
          <div className="flex flex-col gap-2">
            <label className="text-neutral-900 text-sm font-weight-400">
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
            <label className="text-neutral-900 text-sm font-weight-400">
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
            <label className="text-neutral-900 text-sm font-weight-400">
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
            <label className="text-neutral-900 text-sm font-weight-400">
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
            <label className="text-neutral-900 text-sm font-weight-400">
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
        {/* {claimType !== "RTA – Nationwide Assist" && (
          <div className="mt-4 p-4 bg-blue-50/50 rounded-lg border border-blue-100 flex flex-col gap-2 animate-in fade-in duration-300">
            <label className="text-neutral-900 text-sm font-weight-400">
              Borough
            </label>
            <input
              type="text"
              placeholder="Enter Borough (Mandatory for Nationwide Assist)"
              className="w-full px-5 py-4 bg-white rounded border border-blue-200 text-base focus:ring-2 focus:ring-blue-500/20"
              required
            />
          </div>
        )} */}
      </div>
      {/* Section 2:  Contact Information */}
      {claimType !== "RTA – Nationwide Assist" && (
        <div className="self-stretch p-5 rounded-lg border border-gray-100 flex flex-col gap-4 mt-6 animate-in fade-in duration-500">
          <div className="flex justify-between items-center w-full">
            <h2 className="text-black text-xl font-weight-600 leading-5 font-['Stack_Sans_Headline']">
              Borough Details
            </h2>
          </div>
          <div className="h-px bg-gray-100 w-full" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Borough Name - Mandatory */}
            <div className="flex flex-col gap-2">
              <label className="text-neutral-900 text-sm font-weight-400">
                Borough
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
              <label className="text-neutral-900 text-sm font-weight-400">
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
              <label className="text-neutral-900 text-sm font-weight-400">
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
              <label className="text-neutral-900 text-sm font-weight-400">
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
              <label className="text-neutral-900 text-sm font-weight-400">
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
          <div className="flex justify-between">
            <div className="flex flex-col gap-5">
              <label className="text-black text-sm font-weight-400">
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

                      {boroughInfo.hasOtherBorough === option ? (
                        <img src={Yes} alt="" />
                      ) : (
                        <img src={No} alt="" />
                      )}
                    </div>
                    <span className="text-black text-sm">{option}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Conditional Other Borough Input */}
            <div
              className={`flex flex-col w-[326px] gap-2 transition-opacity duration-300 ${boroughInfo.hasOtherBorough === "Yes" ? "opacity-100" : "opacity-40 pointer-events-none"}`}
            >
              <label className="text-black text-sm font-weight-400">
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
          <h2 className="text-black text-xl font-weight-600">
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
          <div className="flex flex-col gap-3  font-['Stack_Sans_Headline']">
            {thirdPartyVehicles.map((vehicle) => (
              <div
                key={vehicle.id}
                data-layer="Frame 1171277554"
                className="self-stretch px-4 py-3 bg-white border border-gray-100 rounded-lg inline-flex justify-between items-start hover:shadow-sm transition-shadow"
              >
                {/* Left Side: Vehicle Info */}
                <div className="inline-flex flex-col justify-start items-start gap-1">
                  <div className="flex flex-col justify-start items-start gap-1">
                    {/* Make and Model */}
                    <div className="text-neutral-900 text-sm font-weight-600 font-['Stack_Sans_Headline']">
                      {vehicle.make} {vehicle.model}
                    </div>

                    {/* Attributes Row */}
                    <div className="inline-flex justify-start items-start gap-3">
                      {/* Registration */}
                      <div className="flex justify-center items-center gap-2.5 text-xs text-gray-700">
                        <span className="font-weight-600">Reg No:</span>
                        <span className="font-['system-ui']">
                          M{vehicle.registration}
                        </span>
                      </div>

                      {/* Color */}
                      <div className="flex justify-center items-center gap-2.5 text-xs text-neutral-900 pl-3">
                        <span className="font-weight-600">Color:</span>
                        <span className="font-['system-ui']">
                          {vehicle.color}
                        </span>
                      </div>

                      {/* Images Status */}
                      <div className="flex justify-center items-center gap-2.5 text-xs text-neutral-900 pl-3">
                        <span className="font-weight-600">Images:</span>
                        <span className="font-['system-ui']">
                          {vehicle.imagesAvailable === "Yes"
                            ? "Available"
                            : "Not Available"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Side: Actions */}
                <div
                  data-layer="Frame 1171277557"
                  className="flex justify-start items-center gap-4"
                >
                  <button
                    onClick={() => {
                      setCurrentVehicle(vehicle);
                      setIsModalOpen(true);
                    }}
                    className="text-neutral-900 hover:text-blue-500 transition-colors"
                  >
                    <img src={pencil} alt="" />
                  </button>
                  <button
                    onClick={() => removeTPVehicle(vehicle.id)}
                    className="text-red-500 hover:text-red-700 transition-colors"
                  >
                    <img src={trash} alt="" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {checkModal && (
        <VehicleCheckModal
          isOpen={checkModal}
          onClose={() => openModal1(false)}
        />
      )}
      {dvlaModal && (
        <DVLAModal isOpen={dvlaModal} onClose={() => openModal2(false)} />
      )}
      {midModal && (
        <MIDModal isOpen={midModal} onClose={() => openModal3(false)} />
      )}
      {/* MODAL: Third Party Vehicle Entry */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-[800px] flex flex-col gap-6">
            <div className="flex justify-between items-center">
              <h2 className="text-black text-xl font-weight-600">
                Third Party Vehicle Details
              </h2>
              {/* <button onClick={() => setIsModalOpen(false)}>
                <X className="w-6 h-6 text-gray-400" />
              </button> */}
            </div>

            <div className="h-px bg-gray-100 w-full" />

            {/* Input Grid */}
            <div className="grid grid-cols-2 gap-5">
              <div className="flex flex-col gap-2">
                <label className="text-neutral-900 text-sm font-weight-400">
                  Make
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
                <label className="text-neutral-900 text-sm font-weight-400">
                  Model
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
                <label className="text-neutral-900 text-sm font-weight-400">
                  Registration
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
                <label className="text-neutral-900 text-sm font-weight-400">
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
              <label className="text-black text-sm font-weight-400">
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

                    {currentVehicle.imagesAvailable === option ? (
                      <img src={Yes} alt="" />
                    ) : (
                      <img src={No} alt="" />
                    )}
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
                className="px-6 py-4 border border-blue-600 text-blue-600 rounded font-weight-400 hover:bg-blue-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSave(false)}
                className="px-6 py-4 bg-blue-600 text-white rounded font-weight-400 hover:bg-blue-700 disabled:opacity-50"
              >
                Save
              </button>
              <button
                onClick={() => handleSave(true)}
                className="px-6 py-4 bg-blue-600 text-white rounded font-weight-400 hover:bg-blue-700 disabled:opacity-50"
              >
                Save and Add Next Vehicle
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SECTION: Vehicle Checkpoint */}
      <div className="self-stretch p-5 rounded-lg border border-gray-100 flex flex-col gap-4">
        <h2 className="text-black text-xl font-weight-600 leading-5 font-['Stack_Sans_Headline']">
          Vehicle Checkpoint
        </h2>
        <div className="h-px bg-gray-100 w-full" />

        <div className="grid grid-cols-3 gap-5">
          {/* Vehicle Check Card */}
          <button
            onClick={() => openModal1(true)}
            className="p-4 rounded-lg border border-blue-300 flex flex-col items-center gap-2 hover:bg-blue-50 transition-colors group"
          >
            <img src={Vehicle} alt="" />

            <span className="text-blue-500 text-sm font-weight-300">
              Vehicle Check
            </span>
          </button>

          {/* DVLA Card */}
          <a
            // onClick={() => openModal2(true)}
              href="https://www.gov.uk/view-driving-licence/"
            target="_blank"
            className="p-4 rounded-lg border border-blue-300 flex flex-col items-center gap-2 hover:bg-blue-50 transition-colors group"
          >
            <img src={DVLA} alt="" />

            <span className="text-blue-500 text-sm font-weight-300">DVLA</span>
          </a>

          {/* Process MID Card */}
          <a
            href="https://www.askmid.com/"
            target="_blank"
            // onClick={() => openModal3(true)}
            className="p-4 rounded-lg border border-blue-300 flex flex-col items-center gap-2 hover:bg-blue-50 transition-colors group"
          >
            <img src={MID} alt="" />
            <span className="text-blue-500 text-sm font-weight-300">
              Process MID
            </span>
          </a>
        </div>
      </div>
    </div>
  );
};;
