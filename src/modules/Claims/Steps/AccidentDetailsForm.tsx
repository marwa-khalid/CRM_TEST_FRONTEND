import Vector6 from "../../../assets/AutoClaim_icon/Vector-6.svg";
import pencil from "../../../assets/AutoClaim_icon/pencil.svg";
import trash from "../../../assets/AutoClaim_icon/trash.svg";
import Yes from "../../../assets/AutoClaim_icon/Yes.svg";
import No from "../../../assets/AutoClaim_icon/No.svg";
import { useCallback, useEffect, useRef, useState } from "react";
import { CustomDatePicker } from "../Components/DatePicker";
import Select from "react-select";
import { Minus, Plus } from "lucide-react";
import { PassengerDetailsModal } from "./PassengerDetailsModal";
import { WitnessDetailsModal } from "./WitnessDetailsmodal";
import { createAccidentDetail, getAccidentDetailById, updateAccidentDetail } from "../../../services/Accidents/accident";
import { toast } from "react-toastify";
import { useFormik } from "formik";
import * as Yup from 'yup'
import LeafletAutocompleteMap from "../../../components/GoogleMapAutoComplete/GoogleMapAutoComplete";
import { deletePassenger, deletePoliceDetail, deleteWitness, getPassengerById, getPoliceDetails, getWitnesses } from "../../../services/Accidents/Cards/Cards";
import { BlueDropdownIndicator, customStyles } from "./GeneralDetailsForm";
import { PoliceDetailsModal } from "./PoliceDetailsModal";

export const AccidentDetailsForm = ({ formRef }: any) => {
  const weatherOptions = [
    { value: 1, label: "Dry" },
    { value: 2, label: "Wet" },
    { value: 3, label: "Snowy" },
    { value: 4, label: "Icy" },
    { value: 5, label: "Foggy" },
    { value: 6, label: "Sunny" },
    { value: 7, label: "Rainy" },
  ];
  const toISODateTime = (date: Date | null, time: string | null) => {
    if (!date) return null;

    // Clone the date to avoid mutating the original
    const jsDate = new Date(date.getTime());

    if (time && time.includes(":")) {
      const [hours, minutes] = time.split(":").map(Number);
      if (!isNaN(hours) && !isNaN(minutes)) {
        jsDate.setHours(hours, minutes, 0, 0);
      }
    } else {
      // Default to midnight if time is missing
      jsDate.setHours(0, 0, 0, 0);
    }

    // Build ISO string manually for the backend
    const yyyy = jsDate.getFullYear();
    const mm = String(jsDate.getMonth() + 1).padStart(2, "0");
    const dd = String(jsDate.getDate()).padStart(2, "0");
    const hh = String(jsDate.getHours()).padStart(2, "0");
    const min = String(jsDate.getMinutes()).padStart(2, "0");

    return `${yyyy}-${mm}-${dd}T${hh}:${min}:00`;
  };
  const accidentId = localStorage.getItem("accidentId");
  const claimId = localStorage.getItem("claimId");
  const cleanPayload = (obj: any) => {
    if (obj === "") return null;

    if (Array.isArray(obj)) {
      return obj.map(cleanPayload);
    }

    if (obj !== null && typeof obj === "object") {
      return Object.fromEntries(
        Object.entries(obj).map(([key, value]) => [key, cleanPayload(value)]),
      );
    }

    return obj;
  };

  const formik = useFormik({
    initialValues: {
      date: "",
      time: "",
      weather: null,
      location: "",
      versionOfEvents: "",
      servicesDate: "",
      servicesTime: "",
      passengers: "No",
      numPassengers: 0,
      hasWitnesses: "No",
      policeAttended: "No",
      dashcamFootage: "No",
    },
    validationSchema: Yup.object().shape({}),
    onSubmit: async (values: any) => {
      try {
        const dateTimeString = toISODateTime(values.date, values.time);
        const serviceDateTimeString = toISODateTime(
          values.servicesDate,
          values.servicesTime,
        );
        const accidentData = {
          location: values.location,
          description: values.versionOfEvents,
          date_time: dateTimeString,
          condition: values.weather,
          service_date_time: serviceDateTimeString,
          any_passenger: values.passengers === "Yes",
          passenger_no: values.passengers === "Yes" ? values.numPassengers : 0,
          witness: values.hasWitnesses === "Yes",
          police_attend: values.policeAttended === "Yes",
          dash_footage: values.dashcamFootage === "Yes",
          claim_id: parseInt(claimId) || null,
          is_active: true,
        };
        const payloadToSend = cleanPayload(accidentData);
        // return
        if (claimId && accidentId) {
          const response = await updateAccidentDetail(
            parseInt(claimId),
            payloadToSend,
          );
          localStorage.setItem("accidentId", response.id);
        } else {
          const response = await createAccidentDetail(payloadToSend);
          localStorage.setItem("accidentId", response.id);
        }
        toast.success("Accident details saved successfully");
      } catch (error) {
        toast.error("Error saving accident details");
        throw error;
      }
    },
  });
  useEffect(() => {
    const fetchData = async () => {
      const accidentData = await getAccidentDetailById(parseInt(claimId));

      const mappedValues = {
        date: accidentData.date_time ? new Date(accidentData.date_time) : "",

        // Extract time string (HH:mm)
        time: accidentData.date_time
          ? new Date(accidentData.date_time).toLocaleTimeString("en-GB", {
            hour: "2-digit",
            minute: "2-digit",
          })
          : "",

        servicesDate: accidentData.service_date_time
          ? new Date(accidentData.service_date_time)
          : "",
        servicesTime: accidentData.service_date_time
          ? new Date(accidentData.service_date_time).toLocaleTimeString(
            "en-GB",
            { hour: "2-digit", minute: "2-digit" },
          )
          : "",
        weather: accidentData.condition || null,
        location: accidentData.location || "",
        versionOfEvents: accidentData.description || "",

        passengers: accidentData.any_passenger ? "Yes" : "No",
        numPassengers: accidentData.passenger_no || 0,
        hasWitnesses: accidentData.witness ? "Yes" : "No",
        policeAttended: accidentData.police_attend ? "Yes" : "No",
        dashcamFootage: accidentData.dash_footage ? "Yes" : "No",
      };
      // setDate(parseCalendarDate((accidentData.date_time as string)?.split('T')[0]));
      // setServiceDate(parseCalendarDate(accidentData.service_date_time?.split('T')[0]));
      formik.setValues(mappedValues);
    };
    if (claimId && accidentId) {
      fetchData();
    }
  }, []);
  useEffect(() => {
    if (formRef) {
      formRef.current = formik;
    }
  }, [formRef, formik]);
  useEffect(() => {
    if (formik.values.passengers === "No") {
      formik.setFieldValue("numPassengers", 0);
    }
  }, [formik.values.passengers]);
  const [passengerModal, setPassengerModalOpen] = useState(false);
  const [policeModal, setPoliceModal] = useState(false);

  const [showPayDatePicker, setShowPayDatePicker] = useState(false);
  const [showServiceDatePicker, setShowServiceDatePicker] = useState(false);
  // Inside AccidentDetailsForm
  const [passengersList, setPassengersList] = useState<any[]>([]);

  // Reuse the logic from the old dev to fetch the list
  const refreshPassengers = useCallback(async () => {
    if (!claimId) return;
    try {
      const response = await getPassengerById(Number(claimId));
      // Normalize response as the old dev did
      const data = Array.isArray(response)
        ? response
        : response?.passengers || [];
      setPassengersList(data);
    } catch (err) {
      console.error("Failed to fetch passengers", err);
    }
  }, [claimId]);
  const [policeList, setPoliceList] = useState<any[]>([]);

  const refreshPolice = useCallback(async () => {
    if (!claimId) return;
    try {
      const response = await getPoliceDetails(Number(claimId));
      // Normalize response as the old dev did
   
      setPoliceList(response);
    } catch (err) {
      console.error("Failed to fetch police details", err);
    }
  }, [claimId]);

  // Fetch on mount
  useEffect(() => {
    refreshPassengers();
  }, [refreshPassengers]);
  useEffect(() => {
    refreshPolice();
  }, [refreshPolice]);
  console.log(passengersList.length);
  useEffect(() => {
    if (passengersList.length > 0) {
      formik.setFieldValue("passengers", "Yes");
      formik.setFieldValue("numPassengers", passengersList.length);
    }
  }, [passengersList.length]);

  const [editingPassenger, setEditingPassenger] = useState<any>(null);
  const handleEditClick = (passenger: any) => {
    // Format the telephone back to the "5 space 6" format for the UI
    const rawPhone = passenger.address?.mobile_tel?.replace("+44", "") || "";
    const formattedPhone =
      rawPhone.length > 5
        ? `${rawPhone.substring(0, 5)} ${rawPhone.substring(5, 11)}`
        : rawPhone;

    setEditingPassenger({
      id: passenger.id,
      title: { value: passenger.gender, label: passenger.gender },
      firstName: passenger.first_name,
      surname: passenger.surname,
      address: passenger.address?.address,
      postCode: passenger.address?.postcode,
      email: passenger.address?.email,
      telephone: formattedPhone,
    });
    setPassengerModalOpen(true);
  };
  const handleAddClick = () => {
    setEditingPassenger(null); // Clear for new passenger
    setPassengerModalOpen(true);
  };
  const [selectedPolice, setSelectedPolice] = useState<any>(null);
  const handleEditPolice = (record: any) => {
    // Format the telephone back to the "5 space 6" format for the UI
    setSelectedPolice(record);
    setPoliceModal(true);
  };
  const handleAddPolice = () => {
    setSelectedPolice(null); // Clear for new passenger
    setPoliceModal(true);
  };
  const handleDeletePassenger = async (passengerId: number) => {
    try {
      await deletePassenger(passengerId);
      setPassengersList((prev) => prev.filter((p) => p.id !== passengerId));
      toast.success("Passenger detail deleted successfully");
    } catch (err: any) {
      toast.error("Failed to delete passenger");
    } finally {
      refreshPassengers();
    }
  };
  const handleDeleteWitness = async (witnessId: number) => {
    try {
      await deleteWitness(witnessId);
      setWitnessesList((prev) => prev.filter((p) => p.id !== witnessId));
      toast.success("Witness detail deleted successfully");
    } catch (err: any) {
      toast.error("Failed to delete Witness");
    } finally {
      refreshWitnesses();
    }
  };
  const handleDeletePolice = async (policeId: number) => {
    try {
      await deletePoliceDetail(policeId);
      setPoliceList((prev) => prev.filter((p) => p.id !== policeId));
      toast.success("Police detail deleted successfully");
    } catch (err: any) {
      toast.error("Failed to delete police detail");
    } finally {
      refreshPolice();
    }
  };
  // Inside AccidentDetailsForm
  const [witnessesList, setWitnessesList] = useState<any[]>([]);
  const [isWitnessModalOpen, setIsWitnessModalOpen] = useState(false);
  const [editingWitness, setEditingWitness] = useState<any>(null);

  const refreshWitnesses = useCallback(async () => {
    if (!claimId) return;
    try {
      const response = await getWitnesses(parseInt(claimId)); // Using the service from reference
      setWitnessesList(Array.isArray(response) ? response : []);
    } catch (err) {
      console.error("Failed to fetch witnesses", err);
    }
  }, [claimId]);

  useEffect(() => {
    refreshWitnesses();
  }, [refreshWitnesses]);

  const handleEditWitness = (witness: any) => {
    // Format phone for the UI (5 space 6 digits)
    const rawPhone = witness.address?.mobile_tel?.replace("+44", "") || "";
    const formattedPhone =
      rawPhone.length > 5
        ? `${rawPhone.substring(0, 5)} ${rawPhone.substring(5, 11)}`
        : rawPhone;

    setEditingWitness({
      id: witness.id,
      title: { value: witness.gender, label: witness.gender },
      firstName: witness.first_name,
      surname: witness.surname,
      address: witness.address?.address,
      postCode: witness.address?.postcode,
      email: witness.address?.email,
      telephone: formattedPhone,
      isIndependent: witness.is_independent ? "Yes" : "No", // Assuming backend sends boolean
    });
    setIsWitnessModalOpen(true);
  };

  const formatWitnessDate = (isoString: string) => {
    const date = new Date(isoString);

    // Get Day, Month, Year
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear().toString().slice(-2);

    // Get Time (12-hour format)
    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'

    return `${day}-${month}-${year}  ${hours}:${minutes}${ampm}`;
  };
  useEffect(() => {
    if (witnessesList.length > 0) {
      formik.setFieldValue("hasWitnesses", "Yes");
    }
  }, [witnessesList.length]);
  return (
    <div className="MainContent w-[788px] ms-[140px] flex-1 inline-flex flex-col items-start gap-6 p-8 overflow-y-auto scrollbar-hide font-['Stack_Sans_Headline']">
      {passengerModal && (
        <PassengerDetailsModal
          onClose={() => {
            setPassengerModalOpen(false);
            refreshPassengers(); // Refresh list when modal closes
          }}
          claimId={claimId}
          initialData={editingPassenger}
        />
      )}
      {isWitnessModalOpen && (
        <WitnessDetailsModal
          onClose={() => {
            setIsWitnessModalOpen(false);
            refreshWitnesses();
          }}
          claimId={claimId}
          initialData={editingWitness}
        />
      )}
      {policeModal && (
        <PoliceDetailsModal
          claimId={claimId}
          initialData={selectedPolice}
          onClose={() => {
            setPoliceModal(false);
            refreshPolice(); // Refresh list after edit/save
          }}
        />
      )}
      {/* Container matching left-[534px] and top-[157px] from source */}
      <h1 className="text-black text-2xl font-weight-600 font-['Stack_Sans_Headline']">
        Accident Details
      </h1>
      {/* Section 1: Personal Information Section */}
      <div className="self-stretch p-5 rounded-lg border border-gray-100 flex flex-col gap-4">
        {/* Header Aligned Exactly Like Previous Sections */}
        <h2 className="text-black text-xl font-weight-600 leading-5 font-['Stack_Sans_Headline']">
          Location & Condition Details
        </h2>
        <div className="h-px bg-gray-100 w-full" />

        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Date Input */}
            <div className="flex flex-col gap-2 relative">
              <label className="text-gray-700 text-sm font-weight-400">
                Date
              </label>
              <div
                onClick={() => setShowPayDatePicker(!showPayDatePicker)}
                className="h-[52px] px-5 bg-white rounded border border-gray-200 flex items-center justify-between cursor-pointer focus-within:border-blue-500"
              >
                <span
                  className={
                    formik.values.date
                      ? "text-gray-900 font-['system-ui']"
                      : "text-gray-300 font-['system-ui']"
                  }
                >
                  {formik.values.date
                    ? formik.values.date.toLocaleDateString("sv-SE") // YYYY-MM-DD format
                    : "Date"}
                </span>
                <img src={Vector6} className="w-4 h-4" alt="calendar" />
              </div>

              {/* Date Picker Dropdown */}
              {showPayDatePicker && (
                <div className="absolute top-[25px] left-0 z-[100] shadow-xl rounded-lg bg-white">
                  <CustomDatePicker
                    selectedDate={formik.values.date || new Date()}
                    // Ensure the user cannot pick a future date
                    // maxDate={new Date()}
                    onDateSelect={(date) => {
                      // Double check: only update if date is not in the future
                      if (date <= new Date()) {
                        formik.setFieldValue("date", date);
                        setShowPayDatePicker(false);
                      }
                    }}
                  />
                </div>
              )}
            </div>

            {/* Time Input */}
            <div className="flex flex-col gap-2">
              <label className="text-gray-700 text-sm font-weight-400">
                Time
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formik.values.time}
                  onChange={(e) => formik.setFieldValue("time", e.target.value)}
                  placeholder="Enter Time"
                  className="h-[52px] w-full px-5 py-4 bg-white rounded border border-gray-200 text-base font-['system-ui'] focus:outline-none focus:ring-2 focus:ring-blue-500/20 placeholder:text-gray-300"
                />
                {/* <Clock className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" /> */}
              </div>
            </div>

            {/* Weather Dropdown */}
            <div className="flex flex-col gap-2">
              <label className="text-gray-700 text-sm font-weight-400">
                Weather Conditions
              </label>
              <Select
                options={weatherOptions}
                value={weatherOptions.find(
                  (option) => option.value === formik.values.weather,
                )}
                onChange={(e) => formik.setFieldValue("weather", e.value)}
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
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-gray-700 text-sm font-weight-400">
              Location
            </label>
            <LeafletAutocompleteMap
              showMap={true}
              apiKey={import.meta.env.VITE_GOOGLE_MAP_KEY}
              address={formik.values.location}
              onPlaceSelected={(place) => {
                if (place.name) {
                  formik.setFieldValue("location", place.address);
                  // formik.setFieldValue("postcode", place?.postalCode);
                }
              }}
              disabled={false}
            />
          </div>
          {/* Version of Events Textarea */}
          <div className="flex flex-col gap-2">
            <label className="text-gray-700 text-sm font-weight-400">
              Version of Events
            </label>
            <textarea
              onChange={(e) =>
                formik.setFieldValue("versionOfEvents", e.target.value)
              }
              value={formik.values.versionOfEvents}
              placeholder="Enter Events"
              className="w-full h-32 px-5 py-4 bg-white rounded border border-gray-200 text-base font-['system-ui'] focus:outline-none focus:ring-2 focus:ring-blue-500/20 placeholder:text-gray-300 resize-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Services Date */}
            <div className="flex flex-col gap-2 relative">
              <label className="text-gray-700 text-sm font-weight-400">
                Services Date
              </label>
              <div
                onClick={() => setShowServiceDatePicker(!showServiceDatePicker)}
                className="h-[52px] px-5 bg-white rounded border border-gray-200 flex items-center justify-between cursor-pointer focus-within:border-blue-500"
              >
                <span
                  className={
                    formik.values.servicesDate
                      ? "text-gray-900 font-['system-ui']"
                      : "text-gray-300 font-['system-ui']"
                  }
                >
                  {formik.values.servicesDate
                    ? formik.values.servicesDate.toLocaleDateString("sv-SE")
                    : "Date"}
                </span>
                <img src={Vector6} className="w-4 h-4" alt="calendar" />
              </div>
              {showServiceDatePicker && (
                <div className="absolute top-[25px] left-0 z-[100] shadow-xl rounded-lg bg-white">
                  <CustomDatePicker
                    selectedDate={formik.values.servicesDate || new Date()}
                    onDateSelect={(date) => {
                      formik.setFieldValue("servicesDate", date);
                      setShowServiceDatePicker(false);
                    }}
                  />
                </div>
              )}
            </div>

            {/* Services Time */}
            <div className="flex flex-col gap-2">
              <label className="text-gray-700 text-sm font-weight-400">
                Services Time
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Enter Time"
                  value={formik.values.servicesTime}
                  onChange={(e) =>
                    formik.setFieldValue("servicesTime", e.target.value)
                  }
                  className="h-[53px] w-full px-5 py-4 bg-white rounded border border-gray-200 text-base font-['system-ui'] focus:outline-none focus:ring-2 focus:ring-blue-500/20 placeholder:text-gray-300"
                />
                {/* <Clock className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" /> */}
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Section 2:  Contact Information */}
      <div className="self-stretch p-5 rounded-lg border border-gray-100 flex flex-col gap-4 mt-6">
        <h2 className="text-black text-xl font-weight-600 leading-5 font-['Stack_Sans_Headline']">
          Attendees
        </h2>
        <div className="h-px bg-gray-100 w-full" />

        {/* Passengers Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-end ">
          {/* Radio Group */}
          <div className="flex flex-col gap-5">
            <label className="text-black text-sm font-weight-400 font-['Stack_Sans_Headline']">
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
                      name="passengers"
                      className="sr-only"
                      checked={formik.values.passengers === option}
                      onChange={() =>
                        formik.setFieldValue("passengers", option)
                      }
                    />

                    {formik.values.passengers === option ? (
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
          {/* Counter Input */}
          {formik.values.passengers === "Yes" && (
            <div className="flex flex-col gap-2">
              <label className="text-gray-700 text-sm font-weight-400">
                Number of Passengers
              </label>
              <div className="flex items-center justify-between px-4 py-3 bg-white rounded border border-gray-200">
                <button
                  onClick={() =>
                    formik.setFieldValue(
                      "numPassengers",
                      Math.max(0, formik.values.numPassengers - 1),
                    )
                  }
                  className="text-blue-500 hover:bg-blue-50 p-1 rounded transition-colors"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="text-black text-base font-['system-ui']">
                  {formik.values.numPassengers}
                </span>
                <button
                  onClick={() =>
                    formik.setFieldValue(
                      "numPassengers",
                      formik.values.numPassengers + 1,
                    )
                  }
                  className="text-blue-500 hover:bg-blue-50 p-1 rounded transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Passenger Details Info Box */}
        {/* <div className="bg-gray-50 p-4 rounded-lg flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-700 text-base font-weight-600">
              Passenger Details
            </span>
            <button
              className="flex items-center gap-2 px-3 py-1.5 rounded text-blue-500 text-sm font-weight-400 hover:bg-blue-50 transition-colors"
              onClick={() => setPassengerModalOpen(true)}
            >
              <Plus className="w-4 h-4" />
              Add Passenger Details
            </button>
          </div>
          <p className="text-gray-600 text-sm">
            Add passengers details by clicking on “Add Passenger Details”.
          </p>
        </div> */}
        <div className="bg-gray-50 p-4 rounded-lg flex flex-col gap-3">
          {/* Header */}
          <div className="flex justify-between items-center">
            <span className="text-gray-700 text-base font-weight-600">
              Passenger Details
            </span>
            <button
              className="flex items-center gap-2 px-3 py-1.5 rounded text-blue-500 text-sm font-weight-400 hover:bg-blue-50 transition-colors"
              onClick={handleAddClick}
            >
              <Plus className="w-4 h-4" />
              Add Passenger Details
            </button>
          </div>

          {/* Passenger List Rendering */}
          {passengersList.length > 0 ? (
            <div className="flex flex-col gap-3">
              {passengersList.map((p) => (
                <div
                  key={p.id}
                  className="bg-white p-4 rounded-lg border border-gray-100 flex justify-between items-start shadow-sm"
                >
                  <div className="flex flex-col gap-1">
                    <h4 className="text-gray-900 font-weight-600 text-sm">
                      {p.first_name} {p.surname}
                    </h4>
                    <div className="flex items-center gap-2 text-gray-500 text-xs">
                      {p.address?.email && <span>{p.address?.email}</span>}
                      {p.address?.email && " "}
                      <span>{p.address?.mobile_tel}</span>
                    </div>
                    <p className="text-gray-500 text-xs">
                      {p.address?.address} {p.address?.address && "-"}{" "}
                      {p.address?.postcode}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      className="p-1 hover:bg-gray-100 rounded text-gray-400"
                      onClick={() => handleEditClick(p)} // Pass the whole passenger object
                    >
                      <img src={pencil} className="w-4 h-4" alt="edit" />
                    </button>

                    <button
                      className="p-1 hover:bg-red-50 rounded text-red-400"
                      onClick={() => handleDeletePassenger(p.id)}
                    >
                      <img src={trash} className="w-4 h-4" alt="delete" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Placeholder if empty */
            <p className="text-gray-600 text-sm">
              Add passengers details by clicking on “Add Passenger Details”.
            </p>
          )}
        </div>

        {/* Your Modal Component */}

        <div className="h-px bg-gray-100 w-full my-2" />

        {/* Witnesses Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="flex flex-col gap-5">
            <label className="text-black text-sm font-weight-400">
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
                      name="hasWitnesses"
                      className="sr-only"
                      checked={formik.values.hasWitnesses === option}
                      onChange={() =>
                        formik.setFieldValue("hasWitnesses", option)
                      }
                    />

                    {formik.values.hasWitnesses === option ? (
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
        </div>

        {/* Witnesses Details Box */}
        <div className="bg-gray-50 p-4 rounded-lg flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-700 text-base font-weight-600">
              Witnesses Details
            </span>
            <button
              className="flex items-center gap-2 px-3 py-1.5 rounded text-blue-500 text-sm font-weight-400 hover:bg-blue-50"
              onClick={() => {
                setEditingWitness(null);
                setIsWitnessModalOpen(true);
              }}
            >
              <Plus className="w-4 h-4" />
              Add Witness Details
            </button>
          </div>

          {witnessesList.length > 0 ? (
            witnessesList.map((w) => (
              <div
                key={w.id}
                className="bg-white p-4 rounded-lg border border-gray-100 flex flex-col shadow-sm"
              >
                <div className="flex justify-between items-start">
                  <div className="flex flex-col gap-1">
                    <h4 className="text-gray-900  text-sm">
                      {w.first_name} {w.surname}
                      {/* <span className="ml-2 text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">
                        {w.is_independent ? "Independent" : "Known"}
                      </span> */}
                    </h4>
                    <div className="flex items-center gap-2 text-gray-500 text-xs">
                      <span>{w.address?.email}</span>
                      <span>{w.address?.mobile_tel}</span>
                    </div>
                    <p className="text-gray-500 text-xs">
                      {w.address?.address}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      className="p-1 hover:bg-gray-100 rounded text-gray-400"
                      onClick={() => handleEditWitness(w)}
                    >
                      <img src={pencil} className="w-4 h-4" alt="edit" />
                    </button>
                    <button
                      className="p-1 hover:bg-red-50 rounded text-red-400"
                      onClick={() => handleDeleteWitness(w.id)}
                    >
                      <img src={trash} className="w-4 h-4" alt="delete" />
                    </button>
                  </div>
                </div>
                <div className="h-px bg-gray-100 w-full my-2" />
                <div className="flex justify-start items-center text-gray-700 text-xs font-normal font-['Stack_Sans_Headline']">
                  {/* {console.log(w.created_at)!} */}
                  Questionnaire Link Sent : {formatWitnessDate(w.created_at)}
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-600 text-sm">
              Add witnesses details by clicking on “Add Witness Details”.
            </p>
          )}
        </div>

        <div className="h-px bg-gray-100 w-full my-2" />

        {/* Police Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="flex flex-col gap-5">
            <label className="text-black text-sm font-weight-400">
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
                      checked={formik.values.policeAttended === option}
                      onChange={() =>
                        formik.setFieldValue("policeAttended", option)
                      }
                    />
                    {formik.values.policeAttended === option ? (
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
        </div>

        {/* Police Details Box */}
        <div className="bg-gray-50 p-4 rounded-lg flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-700 text-base font-weight-600">
              Police Details
            </span>
            <button
              onClick={handleAddPolice}
              className="flex items-center gap-2 px-3 py-1.5 rounded text-blue-500 text-sm font-weight-400 hover:bg-blue-50"
            >
              <Plus className="w-4 h-4" />
              Add Police Details
            </button>
          </div>
          <div className="grid gap-3">
            {policeList.length > 0 ? (
              policeList.map((record: any) => (
                <div
                  key={record.id}
                  data-layer="Frame 1171277554"
                  className="self-stretch px-4 py-3 bg-white border border-gray-100 rounded-lg inline-flex justify-between items-start transition-shadow hover:shadow-sm"
                >
                  {/* Left Section: Details */}
                  <div
                    data-layer="Frame 1171277556"
                    className="inline-flex flex-col justify-start items-start gap-1"
                  >
                    {/* Name and Reference */}
                    <div
                      data-layer="Frame 1171277555"
                      className="inline-flex justify-start items-center gap-2"
                    >
                      <div className="text-gray-700 text-sm font-weight-600 font-['Stack_Sans_Headline']">
                        {record.name}
                      </div>
                      <div className="flex justify-center items-center gap-1 text-xs">
                        <span className="text-gray-700 font-weight-600 font-['Stack_Sans_Headline']">
                          Ref. no:{" "}
                        </span>
                        <span className="text-gray-700 font-normal font-['Stack_Sans_Headline']">
                          {record.reference_no}
                        </span>
                      </div>
                    </div>

                    {/* Station Address */}
                    <div className="text-gray-700 text-xs font-normal font-['Stack_Sans_Headline'] max-w-[500px]">
                      {record.station_name}
                      {record.station_address
                        ? `, ${record.station_address}`
                        : ""}
                    </div>

                    {/* Received Date */}
                    <div className="text-xs">
                      <span className="text-gray-700 font-weight-600 font-['Stack_Sans_Headline']">
                        Incident Report Received on:{" "}
                      </span>
                      <span className="text-gray-700 font-normal font-['Stack_Sans_Headline']">
                        {formatWitnessDate(record.report_received_date)}
                      </span>
                    </div>
                  </div>

                  {/* Right Section: Actions */}
                  <div
                    data-layer="Frame 1171277557"
                    className="flex justify-start items-center gap-4 pt-1"
                  >
                    <button
                      onClick={() => handleEditPolice(record)}
                      className="hover:opacity-70 transition-opacity"
                      title="Edit"
                    >
                      <img src={pencil} className="w-4 h-4" alt="edit" />
                    </button>
                    <button
                      onClick={() => handleDeletePolice(record.id)}
                      className="hover:opacity-70 transition-opacity"
                      title="Delete"
                    >
                      <img src={trash} className="w-4 h-4" alt="delete" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-600 text-sm p-4 border border-dashed border-gray-200 rounded-lg text-center">
                Add Police details by clicking on “Add Police Details”.
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="h-px bg-gray-100 w-full my-2" />

      {/* Dashcam Row */}
      <div className="flex flex-col gap-5">
        <label className="text-black text-sm font-weight-400">
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
                  checked={formik.values.dashcamFootage === option}
                  onChange={() =>
                    formik.setFieldValue("dashcamFootage", option)
                  }
                />
                {formik.values.dashcamFootage === option ? (
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
    </div>
  );
};
