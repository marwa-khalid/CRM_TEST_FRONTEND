import Vehicle from "../../../assets/AutoClaim_icon/Vehicle.svg";
import DVLA from "../../../assets/AutoClaim_icon/DVLA.svg"
import Yes from "../../../assets/AutoClaim_icon/Yes.svg";
import No from "../../../assets/AutoClaim_icon/No.svg";
import MID from "../../../assets/AutoClaim_icon/MID.svg";
import { useEffect, useState } from "react";
import Select from "react-select";
import { Calendar, Edit2, Minus, Plus,Trash2, Upload, X } from "lucide-react";
import { VehicleCheckModal } from "./VehicleCheckModal";
import { BlueDropdownIndicator, customStyles } from "./GeneralDetailsForm";
import pencil from "../../../assets/AutoClaim_icon/pencil.svg";
import trash from "../../../assets/AutoClaim_icon/trash.svg";
import { toast } from "react-toastify";
import { V5CUploadModal } from "../Components/V5CUploadModal";
import * as Yup from 'yup'
import { ErrorMessage, useFormik } from "formik";
import { createVehicleDetail, getVehicleDetail, updateVehicle } from "../../../services/Vehicle/Vehicle";
import { cleanPayload } from "./ClientDetailsForm";
export const VehicleDetailsForm = ({ formRef }: any) => {

  const fuelOptions = [
    { value: 1, label: "Petrol" },
    { value: 2, label: "Diesel" },
    { value: 3, label: "Electric" },
    { value: 4, label: "Hybrid" },
  ];

  const transmissionOptions = [
    { value: 1, label: "Automatic" },
    { value: 2, label: "Manual" },
  ];

  const categoryOptions = [
    { value: "PCO", label: "PCO" },
    { value: "Standard", label: "Standard" },
    { value: "Commercial", label: "Commercial" },
  ];const taxiTypeOptions = [
    { value: 1, label: "Hackney" },
    { value: 2, label: "Private Hire" },
  ];

  const removeTPVehicle = (id: number) => {
    if (formik.values.thirdPartyVehicles.length > 1) {
      formik.setFieldValue("thirdPartyVehicles",formik.values.thirdPartyVehicles.filter((v) => v.id !== id));
    }
  };
  const [currentVehicle, setCurrentVehicle] = useState({
    make: "",
    model: "",
    registration: "",
    color: "",
    imagesAvailable: "Yes",
  });
  const claimId = localStorage.getItem("claimId")
  const claimType = localStorage.getItem("claimType");
  // Validation Logic based on Acceptance Criteria
  const [checkModal, openModal1] = useState<boolean>(false)
  
  const isVehicleValid =
    currentVehicle.make && currentVehicle.model && currentVehicle.registration;
const [isModalOpen, setIsModalOpen] = useState(false);
  const handleSave = (addNext = false) => {
    if (!isVehicleValid) {
      alert("Please fill in mandatory fields: Make, Model, and Registration.");
      return;
    }

    formik.setFieldValue("thirdPartyVehicles",([
      ...formik.values.thirdPartyVehicles,
      { ...currentVehicle, id: Date.now() },
    ]));

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
  const [showUploadModal, setShowUploadModal] = useState(false);
  const vehicleId = localStorage.getItem("vehicleId");

  const formik = useFormik({
    initialValues: {
      vehicle: {
        make: "",
        model: "",
        registration: "",
        color: "",
        fuelType: null,
        engineSize: "",
        transmission: null,
        bodyType: "",
        seats: 0,
        category: null,
      },
      borough: {
        name: "",
        taxiType: null,
        clientBadgeNumber: "",
        badgeExpirationDate: "",
        vehicleBadgeNumber: "",
        otherBorough: "No",
      },
      thirdPartyVehicles: [
        
      ],
    },
    validationSchema: Yup.object().shape({}),
    onSubmit: async (values: any) => {
      try {
        const payload = {
          claim_id: parseInt(claimId),
          make: values.vehicle.make,
          model: values.vehicle.model,
          body_type: values.vehicle.bodyType,
          registration: values.vehicle.registration,
          color: values.vehicle.color,
          fuel_type_id: values.vehicle.fuelType,
          engine_size: values.vehicle.engineSize,
          transmission_id: values.vehicle.transmission,
          number_of_seat: values.vehicle.seats,
          vehicle_category: values.vehicle.category,

          borough: {
            borough_name: values.borough.name,
            taxi_type_id: values.borough.taxiType,
            client_badge_number: values.borough.clientBadgeNumber,
            badge_expiration_date: values.borough.badgeExpirationDate,
            vehicle_badge_number: values.borough.vehicleBadgeNumber,
            any_other_borough:
              values.borough.otherBorough === "Yes"? true:false,
            other_borough_name: values.borough.otherBoroughName || "",
          },

          third_party_vehicles: values.thirdPartyVehicles.map((v: any) => ({
            make: v.make,
            model: v.model,
            registration: v.registration,
            color: v.color,
            images_available: v.imagesAvailable,
          })),
        };
        const payloadToSend = cleanPayload(payload);
        // return
        if (claimId && vehicleId) {
          const response = await updateVehicle(
            payloadToSend,
            parseInt(claimId),
          );
          localStorage.setItem("vehicleId", response.id);
        } else {
          const response = await createVehicleDetail(payloadToSend);
          localStorage.setItem("vehicleId", response.id);
        }
        toast.success("Vehicle details saved successfully");
      } catch (error) {
        toast.error("Error saving vehicle details");
        throw error;
      }
    },
  });
  const [fieldError, setFieldError] = useState({});
  useEffect(() => {
    const fetchData = async () => {
      const res = await getVehicleDetail(parseInt(claimId));
     const mappedValues = {
          vehicle: {
            make: res.make || "",
            model: res.model || "",
            registration: res.registration || "",
            color: res.color || "",
            fuelType: res.fuel_type_id || "",
            engineSize: res.engine_size || "",
            transmission: res.transmission_id || "",
            bodyType: res.body_type || "",
            seats: res.number_of_seat?.toString() || 0,
            category: res.vehicle_category || "",
          },
          borough: {
            name: res.borough?.borough_name || "",
            taxiType: res.borough?.taxi_type_id || "",
            clientBadgeNumber: res.borough?.client_badge_number || "",
            badgeExpirationDate: res.borough?.badge_expiration_date || "",
            vehicleBadgeNumber: res.borough?.vehicle_badge_number || "",
            otherBorough: res.borough?.any_other_borough ? "Yes":"No",
          },
          thirdPartyVehicles:
            res.third_party_vehicles?.map((v) => ({
              make: v.make || "",
              model: v.model || "",
              registration: v.registration || "",
              color: v.color || "",
              imagesAvailable: v.images_available ?? true,
            })) || [],
        };

      formik.setValues(mappedValues);
    };
    if (claimId && vehicleId) {
      fetchData();
    }
  }, []);
    useEffect(() => {
      if (formRef) {
        formRef.current = formik;
      }
    }, [formRef, formik]);
  const pollJobStatus = async (vehicleDetails: any) => {
    // Show a global loader for the OCR processing
    // setLoading(true);
    try {
      // Loop or interval to check OCR status
      // const result = await checkOCRStatus(jobId);
      // console.log(result)
      // if (result.status === "completed") {
      // Pre-fill your Formik fields
      // formik.setValues({
      //   ...formik.values,
      //   make: result.data.make,
      //   model: result.data.model,
      //   registration: result.data.registration,
      //   colour: result.data.colour,
      // });
      const newErrors: Record<string, string> = {};


      if (!vehicleDetails.make)
        newErrors["vehicle.make"] =
          "Low confidence OCR result - please verify.";
      if (!vehicleDetails.model)
        newErrors["vehicle.model"] =
          "Low confidence OCR result - please verify.";
      if (!vehicleDetails.registration)
        newErrors["vehicle.registration"] =
          "Low confidence OCR result - please verify.";
      if (!vehicleDetails.color)
        newErrors["vehicle.color"] =
          "Low confidence OCR result - please verify.";
      if (!vehicleDetails.fuel_type_id)
        newErrors["vehicle.fuelType"] =
          "Low confidence OCR result - please verify.";
      if (!vehicleDetails.engine_size)
        newErrors["vehicle.engineSize"] =
          "Low confidence OCR result - please verify.";
      if (!vehicleDetails.transmission_id)
        newErrors["vehicle.transmission"] =
          "Low confidence OCR result - please verify.";
      if (!vehicleDetails.body_type)
        newErrors["vehicle.bodyType"] =
          "Low confidence OCR result - please verify.";
      if (!vehicleDetails["number_of_seat"])
        newErrors["vehicle.seats"] =
          "Low confidence OCR result - please verify.";
      if (!vehicleDetails.vehicle_category)
        newErrors["vehicle.category"] =
          "Low confidence OCR result - please verify.";

      setFieldError(newErrors);
      toast.success("Data extracted successfully!");
    } catch (e) {
      toast.error("OCR extraction failed");
    } finally {
      // setLoading(false);
    }
  };
  return (
    <>
      <V5CUploadModal
        isOpen={showUploadModal}
        claimId={claimId}
        formik={formik}
        onClose={() => setShowUploadModal(false)}
        onUploadSuccess={(jobId) => pollJobStatus(jobId)}
      />
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
            <button
              onClick={() => setShowUploadModal(true)}
              className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-600 rounded-md text-sm font-weight-400 hover:bg-blue-100 transition-colors"
            >
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
                value={formik.values.vehicle.make}
                onChange={(e) => {
                  formik.setFieldValue("vehicle.make", e.target.value);
                  if (e.target.value) {
                    setFieldError((prevState: any) => {
                      const newState = { ...prevState };
                      delete newState["vehicle.make"];
                      return newState;
                    });
                    formik.setFieldError("vehicle.make", undefined);
                  }
                }}
                type="text"
                placeholder="Enter Make"
                className={`w-full px-5 py-4 bg-white rounded border  ${fieldError["vehicle.make"] ? "border-red-500" : "border-gray-200"} text-base font-light focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
              />
              {fieldError["vehicle.make"] ? (
                <p className="text-red-500 text-xs">
                  {fieldError["vehicle.make"]}
                </p>
              ) : (
                ""
              )}
            </div>
            {/* Model */}
            <div className="flex flex-col gap-2">
              <label className="text-neutral-900 text-sm font-weight-400">
                Model
              </label>
              <input
                type="text"
                placeholder="Enter Model"
                value={formik.values.vehicle.model}
                onChange={(e) => {
                  formik.setFieldValue("vehicle.model", e.target.value);
                  if (e.target.value) {
                    setFieldError((prevState: any) => {
                      const newState = { ...prevState };
                      delete newState["vehicle.model"];
                      return newState;
                    });
                    formik.setFieldError("vehicle.model", undefined);
                  }
                }}
                className={`w-full px-5 py-4 bg-white rounded border  ${fieldError["vehicle.model"] ? "border-red-500" : "border-gray-200"} text-base font-light focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
              />
              {fieldError["vehicle.model"] ? (
                <p className="text-red-500 text-xs">
                  {fieldError["vehicle.model"]}
                </p>
              ) : (
                ""
              )}
              {/* {fieldError["vehicle.model"] &&
                <ErrorMessage
                  name="vehicle.model"
                  component="div"
                  className="text-red-500 text-xs mt-1"
                />} */}
            </div>
            {/* Body Type */}
            <div className="flex flex-col gap-2">
              <label className="text-neutral-900 text-sm font-weight-400">
                Body Type
              </label>
              <input
                type="text"
                value={formik.values.vehicle.bodyType}
                onChange={(e) => {
                  formik.setFieldValue("vehicle.bodyType", e.target.value);
                  if (e.target.value) {
                    setFieldError((prevState: any) => {
                      const newState = { ...prevState };
                      delete newState["vehicle.bodyType"];
                      return newState;
                    });
                    formik.setFieldError("vehicle.bodyType", undefined);
                  }
                }}
                placeholder="Enter Body Type"
                className="w-full px-5 py-4 bg-white rounded border border-gray-200 text-base font-light focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
              {fieldError["vehicle.bodyType"] ? (
                <p className="text-red-500 text-xs">
                  {fieldError["vehicle.bodyType"]}
                </p>
              ) : (
                ""
              )}
            </div>
            {/* Vehicle Registration */}
            <div className="flex flex-col gap-2">
              <label className="text-neutral-900 text-sm font-weight-400">
                Vehicle Registration
              </label>
              <input
                type="text"
                value={formik.values.vehicle.registration}
                onChange={(e) => {
                  formik.setFieldValue("vehicle.registration", e.target.value);
                  if (e.target.value) {
                    setFieldError((prevState: any) => {
                      const newState = { ...prevState };
                      delete newState["vehicle.registration"];
                      return newState;
                    });
                    formik.setFieldError("vehicle.registration", undefined);
                  }
                }}
                placeholder="Enter Registration"
                className="w-full px-5 py-4 bg-white rounded border border-gray-200 text-base font-light focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
              {fieldError["vehicle.registration"] ? (
                <p className="text-red-500 text-xs">
                  {fieldError["vehicle.registration"]}
                </p>
              ) : (
                ""
              )}
            </div>
            {/* Color */}
            <div className="flex flex-col gap-2">
              <label className="text-neutral-900 text-sm font-weight-400">
                Color
              </label>
              <input
                type="text"
                placeholder="Enter Color"
                value={formik.values.vehicle.color}
                onChange={(e) => {
                  formik.setFieldValue("vehicle.color", e.target.value);
                  if (e.target.value) {
                    setFieldError((prevState: any) => {
                      const newState = { ...prevState };
                      delete newState["vehicle.color"];
                      return newState;
                    });
                    formik.setFieldError("vehicle.color", undefined);
                  }
                }}
                className="h-[52px] px-5 bg-white rounded border border-gray-200 flex items-center justify-between cursor-pointer focus-within:border-blue-500"
              />
              {fieldError["vehicle.color"] ? (
                <p className="text-red-500 text-xs">
                  {fieldError["vehicle.color"]}
                </p>
              ) : (
                ""
              )}
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
                value={fuelOptions.find(
                  (op) => op.value === formik.values.vehicle.fuelType,
                )}
                onChange={(e) => {
                  formik.setFieldValue("vehicle.fuelType", e.value);

                  if (e.value) {
                    setFieldError((prevState: any) => {
                      const newState = { ...prevState };
                      delete newState["vehicle.fuelType"];
                      return newState;
                    });
                    formik.setFieldError("vehicle.fuelType", undefined);
                  }
                }}
              />
              {fieldError["vehicle.fuelType"] ? (
                <p className="text-red-500 text-xs">
                  {fieldError["vehicle.fuelType"]}
                </p>
              ) : (
                ""
              )}
            </div>
            {/* Engine Size */}
            <div className="flex flex-col gap-2">
              <label className="text-neutral-900 text-sm font-weight-400">
                Engine Size
              </label>
              <input
                value={formik.values.vehicle.engineSize}
                onChange={(e) => {
                  formik.setFieldValue("vehicle.engineSize", e.target.value);

                  if (e.target.value) {
                    setFieldError((prevState: any) => {
                      const newState = { ...prevState };
                      delete newState["vehicle.engineSize"];
                      return newState;
                    });
                    formik.setFieldError("vehicle.engineSize", undefined);
                  }
                }}
                type="number"
                placeholder="Enter Size (cc)"
                className="h-[52px] px-5 bg-white rounded border border-gray-200 flex items-center justify-between cursor-pointer focus-within:border-blue-500"
              />
              {fieldError["vehicle.engineSize"] ? (
                <p className="text-red-500 text-xs">
                  {fieldError["vehicle.engineSize"]}
                </p>
              ) : (
                ""
              )}
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
                value={transmissionOptions.find(
                  (op) => op.value === formik.values.vehicle.transmission,
                )}
                onChange={(e) => {
                  formik.setFieldValue("vehicle.transmission", e.value);

                  if (e.value) {
                    setFieldError((prevState: any) => {
                      const newState = { ...prevState };
                      delete newState["vehicle.transmission"];
                      return newState;
                    });
                    formik.setFieldError("vehicle.transmission", undefined);
                  }
                }}
              />
              {fieldError["vehicle.transmission"] ? (
                <p className="text-red-500 text-xs">
                  {fieldError["vehicle.transmission"]}
                </p>
              ) : (
                ""
              )}
            </div>
            {/* Number of Seats */}
            <div className="flex flex-col gap-2">
              <label className="text-neutral-900 text-sm font-weight-400">
                Number of Seats (Inc. Driver)
              </label>
              <div className="flex items-center justify-between px-4 py-3 bg-white rounded border border-gray-200 h-[52px]">
                <button
                  onClick={() =>
                    formik.setFieldValue(
                      "vehicle.seats",
                      Math.max(1, formik.values.vehicle.seats - 1),
                    )
                  }
                  className="text-blue-500"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="text-black">
                  {formik.values.vehicle.seats}
                </span>
                <button
                  onClick={() =>
                    formik.setFieldValue(
                      "vehicle.seats",
                      Math.max(1, formik.values.vehicle.seats + 1),
                    )
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
                value={categoryOptions.find(
                  (op) => op.value === formik.values.vehicle.category,
                )}
                onChange={(e) => {
                  formik.setFieldValue("vehicle.category", e.value);

                  if (e.value) {
                    setFieldError((prevState: any) => {
                      const newState = { ...prevState };
                      delete newState["vehicle.category"];
                      return newState;
                    });
                    formik.setFieldError("vehicle.category", undefined);
                  }
                }}
                components={{
                  DropdownIndicator: BlueDropdownIndicator,
                  IndicatorSeparator: () => null,
                }}
              />
              {fieldError["vehicle.category"] ? (
                <p className="text-red-500 text-xs">
                  {fieldError["vehicle.category"]}
                </p>
              ) : (
                ""
              )}
            </div>
          </div>

          {/* Conditional Borough Section */}
          {/* {claimType !== "RTA - NA" && (
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
        {claimType === "RTA - NA" && (
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
                  value={formik.values.borough.name}
                  onChange={(e) =>
                    formik.setFieldValue("borough.name", e.target.value)
                  }
                  placeholder="Enter Name"
                  className="w-full h-[52px] px-5 py-4 bg-white rounded border border-gray-200 text-base font-light focus:outline-none focus:ring-2 focus:ring-blue-500/20"
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
                  value={taxiTypeOptions.find(
                    (op) => op.value === formik.values.taxiType,
                  )}
                  onChange={(e) =>
                    formik.setFieldValue("borough.taxiType", e.value)
                  }
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
                  value={formik.values.borough.clientBadgeNumber}
                  onChange={(e) =>
                    formik.setFieldValue(
                      "borough.clientBadgeNumber",
                      e.target.value,
                    )
                  }
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
                  value={formik.values.borough.vehicleBadgeNumber}
                  onChange={(e) =>
                    formik.setFieldValue(
                      "borough.vehicleBadgeNumber",
                      e.target.value,
                    )
                  }
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
                          checked={formik.values.borough.otherBorough}
                          onChange={(option) =>
                            formik.setFieldValue("borough.otherBorough", option)
                          }
                        />

                        {formik.values.borough.otherBorough === option ? (
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
                className={`flex flex-col w-[326px] gap-2 transition-opacity duration-300 ${formik.values.borough.otherBorough ? "opacity-100" : "opacity-40 pointer-events-none"}`}
              >
                <label className="text-black text-sm font-weight-400">
                  Borough
                </label>
                <input
                  type="text"
                  placeholder="Enter Name"
                  disabled={!formik.values.borough.otherBorough}
                  value={formik.values.borough.otherBoroughName}
                  onChange={(e) =>
                    formik.setFieldValue(
                      "borough.otherBoroughName",
                      e.target.value,
                    )
                  }
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

          {formik.values.thirdPartyVehicles.length === 0 ? (
            <p className="text-gray-600 text-sm">
              Add Third Party Vehicle details by clicking on “Add Vehicle”
            </p>
          ) : (
            <div className="flex flex-col gap-3  font-['Stack_Sans_Headline']">
              {formik.values.thirdPartyVehicles.map((vehicle: any) => (
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

              <span className="text-blue-500 text-sm font-weight-300">
                DVLA
              </span>
            </a>

            {/* Process MID Card */}
            <a
              href="https://www.askmid.com/"
              target="_blank"
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
    </>
  );
};;
