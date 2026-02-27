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
import { useFormik } from "formik";
import { createVehicleDetail, getVehicleDetail, updateVehicle } from "../../../services/Vehicle/Vehicle";
import { cleanPayload } from "./ClientDetailsForm";
import TotalLossView from "../Components/TotalLossModal";
import RepairCostRouteModal from "../Components/RepairCostModal";
export const EngineerDetailsForm = ({ formRef }: any) => {
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
  ];
  const taxiTypeOptions = [
    { value: 1, label: "Hackney" },
    { value: 2, label: "Private Hire" },
  ];

  const removeTPVehicle = (id: number) => {
    if (formik.values.thirdPartyVehicles.length > 1) {
      formik.setFieldValue(
        "thirdPartyVehicles",
        formik.values.thirdPartyVehicles.filter((v) => v.id !== id),
      );
    }
  };
  const [currentVehicle, setCurrentVehicle] = useState({
    make: "",
    model: "",
    registration: "",
    color: "",
    imagesAvailable: "Yes",
  });
  const claimId = localStorage.getItem("claimId");
  const claimType = localStorage.getItem("claimType");
  // Validation Logic based on Acceptance Criteria
  const [lossModal, openModal1] = useState<boolean>(false);
  const [repairModal, openModal2] = useState<boolean>(false);

  const isVehicleValid =
    currentVehicle.make && currentVehicle.model && currentVehicle.registration;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const handleSave = (addNext = false) => {
    if (!isVehicleValid) {
      alert("Please fill in mandatory fields: Make, Model, and Registration.");
      return;
    }

    formik.setFieldValue("thirdPartyVehicles", [
      ...formik.values.thirdPartyVehicles,
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
        otherBorough: false,
      },
      thirdPartyVehicles: [],
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
              values.borough.otherBorough === "true" ||
              values.borough.otherBorough === true,
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
        console.log(parseInt(claimId));
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
  useEffect(() => {
    const fetchData = async () => {
      // const res = await getVehicleDetail(parseInt(claimId));
      // console.log(res);
      // const mappedValues = {
      //   vehicle: {
      //     make: res.make || "",
      //     model: res.model || "",
      //     registration: res.registration || "",
      //     color: res.color || "",
      //     fuelType: res.fuel_type_id || "",
      //     engineSize: res.engine_size || "",
      //     transmission: res.transmission_id || "",
      //     bodyType: res.body_type || "",
      //     seats: res.number_of_seat?.toString() || 0,
      //     category: res.vehicle_category || "",
      //   },
      //   borough: {
      //     name: res.borough?.borough_name || "",
      //     taxiType: res.borough?.taxi_type_id || "",
      //     clientBadgeNumber: res.borough?.client_badge_number || "",
      //     badgeExpirationDate: res.borough?.badge_expiration_date || "",
      //     vehicleBadgeNumber: res.borough?.vehicle_badge_number || "",
      //     otherBorough: res.borough?.any_other_borough?.toString() || "false",
      //   },
      //   thirdPartyVehicles:
      //     res.third_party_vehicles?.map((v) => ({
      //       make: v.make || "",
      //       model: v.model || "",
      //       registration: v.registration || "",
      //       color: v.color || "",
      //       imagesAvailable: v.images_available ?? true,
      //     })) || [],
      // };

      // formik.setValues(mappedValues);
    };
    console.log(formik.values);
    if (claimId && vehicleId) {
      fetchData();
    }
  }, []);
  useEffect(() => {
    if (formRef) {
      formRef.current = formik;
    }
  }, [formRef, formik]);
    const handleMobileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, ""); // remove non-digits

    if (value.length > 5) {
      value = value.slice(0, 5) + " " + value.slice(5, 11);
    }

    formik.setFieldValue("contact_number", value);
  };
  const pollJobStatus = async (jobId: string) => {
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
          Engineer Details
        </h1>
        {/* Section 1: Personal Information Section */}
        <div className="self-stretch p-5 rounded-lg border border-gray-100 flex flex-col gap-4">
          <div className="flex justify-between items-center w-full">
            <h2 className="text-black text-xl font-weight-600 leading-5 font-['Stack_Sans_Headline']">
              Engineer Details
            </h2>
            <button
              onClick={() => setShowUploadModal(true)}
              className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-600 rounded-md text-sm font-weight-400 hover:bg-blue-100 transition-colors"
            >
              {/* <Upload className="w-4 h-4" /> */}
              Instruct Engineer
            </button>
          </div>
          <div className="h-px bg-gray-100 w-full" />

          {/* Make */}
          <div className="flex flex-col gap-2">
            <label className="text-neutral-900 text-sm font-weight-400">
              Company Name
            </label>
            <input
              value={formik.values.vehicle.make}
              onChange={(e) =>
                formik.setFieldValue("vehicle.make", e.target.value)
              }
              type="text"
              placeholder="Enter Company Name"
              className="w-full px-5 py-4 bg-white rounded border border-gray-200 text-base font-light focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          {/* Body Type */}
          <div className="flex flex-col gap-2">
            <label className="text-neutral-900 text-sm font-weight-400">
              Address
            </label>
            <input
              type="text"
              value={formik.values.vehicle.bodyType}
              onChange={(e) =>
                formik.setFieldValue("vehicle.bodyType", e.target.value)
              }
              placeholder="Enter Address"
              className="w-full px-5 py-4 bg-white rounded border border-gray-200 text-base font-light focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Vehicle Registration */}
            <div className="flex flex-col gap-2">
              <label className="text-neutral-900 text-sm font-weight-400">
                Postcode
              </label>
              <input
                type="text"
                value={formik.values.vehicle.registration}
                onChange={(e) =>
                  formik.setFieldValue("vehicle.registration", e.target.value)
                }
                placeholder="Enter Postcode"
                className="w-full px-5 py-4 bg-white rounded border border-gray-200 text-base font-light focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            {/* Color */}
            <div className="flex flex-col gap-2">
              <label className="text-neutral-900 text-sm font-weight-400">
                Email
              </label>
              <input
                type="text"
                placeholder="Enter email"
                value={formik.values.vehicle.color}
                onChange={(e) =>
                  formik.setFieldValue("vehicle.color", e.target.value)
                }
                className="w-full px-5 py-4 bg-white rounded border border-gray-200 text-base font-light focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Color */}
            <div className="flex flex-col gap-2">
              <label className="text-gray-700 text-sm font-weight-400">
                Home Telephone
              </label>
              <div className="relative h-[52px] px-5 bg-white rounded border border-gray-200 flex items-center gap-2.5 focus-within:border-blue-500 transition-all">
                <span className="text-gray-300 text-base font-light">+44</span>
                <input
                  name="contact_number"
                  type="tel"
                  onChange={handleMobileChange}
                  maxLength={12}
                  value={formik.values.contact_number}
                  className="w-full bg-transparent outline-none text-gray-900 font-light placeholder:text-gray-300"
                />
              </div>
            </div>
            {/* Fuel Type */}
            <div className="flex flex-col gap-2">
              <label className="text-gray-700 text-sm font-weight-400">
                Mobile Number
              </label>
              <div className="relative h-[52px] px-5 bg-white rounded border border-gray-200 flex items-center gap-2.5 focus-within:border-blue-500 transition-all">
                <span className="text-gray-300 text-base font-light">+44</span>
                <input
                  name="contact_number"
                  type="tel"
                  onChange={handleMobileChange}
                  maxLength={12}
                  value={formik.values.contact_number}
                  className="w-full bg-transparent outline-none text-gray-900 font-light placeholder:text-gray-300"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 2:  Contact Information */}

        <div className="self-stretch p-5 rounded-lg border border-gray-100 flex flex-col gap-4 mt-6 animate-in fade-in duration-500">
          <div className="flex justify-between items-center w-full">
            <h2 className="text-black text-xl font-weight-600 leading-5 font-['Stack_Sans_Headline']">
              Vehicle Location
            </h2>
          </div>
          <div className="h-px bg-gray-100 w-full" />
          <div className="flex flex-col gap-2">
            <label className="text-neutral-900 text-sm font-weight-400">
              Site
            </label>
            <input
              type="text"
              value={formik.values.borough.name}
              onChange={(e) =>
                formik.setFieldValue("borough.name", e.target.value)
              }
              placeholder="Enter Site"
              className="w-full px-5 py-4 bg-white rounded border border-gray-200 text-base font-light focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-neutral-900 text-sm font-weight-400">
              Address
            </label>
            <input
              type="text"
              value={formik.values.borough.name}
              onChange={(e) =>
                formik.setFieldValue("borough.name", e.target.value)
              }
              placeholder="Enter Address"
              className="w-full px-5 py-4 bg-white rounded border border-gray-200 text-base font-light focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              required
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Borough Name - Mandatory */}

            {/* Taxi Type Dropdown */}
            <div className="flex flex-col gap-2">
              <label className="text-neutral-900 text-sm font-weight-400">
                Postcode
              </label>
              <input
                type="text"
                value={formik.values.vehicle.registration}
                onChange={(e) =>
                  formik.setFieldValue("vehicle.registration", e.target.value)
                }
                placeholder="Enter Postcode"
                className="w-full px-5 py-4 bg-white rounded border border-gray-200 text-base font-light focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>
        </div>

        {/* SECTION: Third Party Vehicles */}
        <div className="self-stretch p-5 rounded-lg border border-gray-100 flex flex-col gap-4 mt-6 animate-in fade-in duration-500">
          <div className="flex flex-col gap-4">
            <h2 className="text-black text-xl font-semibold font-sans">
              Engineer Fees
            </h2>
            <div className="w-full h-px bg-gray-100" />
          </div>

          <div className="flex flex-col gap-5">
            {/* Actual Fee Row */}
            <div className="w-full md:w-1/2">
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Actual Fee
              </label>
              <div className="relative">
                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300 text-base font-light">
                  £
                </span>
                <input
                  type="number"
                  placeholder="0.00"
                  className="w-full pl-10 pr-5 py-4 bg-white rounded border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-base font-light"
                />
              </div>
            </div>

            {/* Invoice Received & Paid Row */}
            <div className="flex flex-col md:flex-row gap-5">
              <div className="flex-1">
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  Invoice Received On
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Date"
                    onFocus={(e) => (e.target.type = "date")}
                    onBlur={(e) => (e.target.type = "text")}
                    className="w-full px-5 py-4 bg-white rounded border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-base font-light text-gray-400"
                  />
                  <Calendar className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-400 pointer-events-none" />
                </div>
              </div>

              <div className="flex-1">
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  Invoice Paid On
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Date"
                    onFocus={(e) => (e.target.type = "date")}
                    onBlur={(e) => (e.target.type = "text")}
                    className="w-full px-5 py-4 bg-white rounded border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-base font-light text-gray-400"
                  />
                  <Calendar className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-400 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Invoice Settled Row */}
            <div className="flex flex-col md:flex-row gap-5">
              <div className="flex-1">
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  Invoice Settled On
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Date"
                    onFocus={(e) => (e.target.type = "date")}
                    onBlur={(e) => (e.target.type = "text")}
                    className="w-full px-5 py-4 bg-white rounded border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-base font-light text-gray-400"
                  />
                  <Calendar className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-400 pointer-events-none" />
                </div>
              </div>

              <div className="flex-1">
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  Invoice Settled Amount
                </label>
                <div className="relative">
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300 text-base font-light">
                    £
                  </span>
                  <input
                    type="number"
                    placeholder="0.00"
                    className="w-full pl-10 pr-5 py-4 bg-white rounded border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-base font-light"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        {lossModal && (
          <TotalLossView isOpen={lossModal} onClose={() => openModal1(false)} />
        )}
        {/* {dvlaModal && (
          <DVLAModal isOpen={dvlaModal} onClose={() => openModal2(false)} />
        )} */}
        {repairModal && (
          <RepairCostRouteModal isOpen={repairModal} onClose={() => openModal2(false)} />
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
          <div className="flex justify-between items-center w-full">
            <h2 className="text-black text-xl font-semibold font-sans">
              Engineer Report & Instructions Details
            </h2>
            <button className="h-8 px-3 py-2 bg-blue-50 hover:bg-blue-100 rounded flex items-center gap-2 transition-colors group">
              <Plus className="w-3 h-3 text-blue-600" />
              <span className="text-blue-600 text-sm font-normal">
                Upload Report
              </span>
            </button>
          </div>

          <div className="w-full h-px bg-gray-100" />

          {/* Action Toggle Buttons */}
          <div className="flex flex-col md:flex-row gap-5">
            
            <button onClick={() => openModal2(true)} className="flex-1 px-10 py-4 bg-white rounded border border-blue-600 text-blue-600 text-base font-medium hover:bg-blue-50 transition-colors">
              Repair Costs & Route
            </button>
            <button
              className="flex-1 px-10 py-4 bg-white rounded border border-blue-600 text-blue-600 text-base font-medium hover:bg-blue-50 transition-colors"
              onClick={() => openModal1(true)}
            >
              Total Loss
            </button>
          </div>

          <div className="w-full h-px bg-gray-100 mt-2" />

          {/* Date and Fee Inputs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Row 1 */}
            <div className="flex flex-col gap-2">
              <label className="text-gray-700 text-sm font-medium">
                Engineer Instructed
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Date"
                  onFocus={(e) => (e.target.type = "date")}
                  className="w-full px-5 py-4 bg-white rounded border border-gray-200 text-base font-light text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
                <Calendar className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-400 pointer-events-none" />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-gray-700 text-sm font-medium">
                Inspection Date
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Date"
                  onFocus={(e) => (e.target.type = "date")}
                  className="w-full px-5 py-4 bg-white rounded border border-gray-200 text-base font-light text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
                <Calendar className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-400 pointer-events-none" />
              </div>
            </div>

            {/* Row 2 */}
            <div className="flex flex-col gap-2">
              <label className="text-gray-700 text-sm font-medium">
                Engineer’s Report Received
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Date"
                  onFocus={(e) => (e.target.type = "date")}
                  className="w-full px-5 py-4 bg-white rounded border border-gray-200 text-base font-light text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
                <Calendar className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-400 pointer-events-none" />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-gray-700 text-sm font-medium">
                Engineer’s Fee
              </label>
              <div className="relative">
                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300 text-base font-light">
                  £
                </span>
                <input
                  type="number"
                  placeholder="0.00"
                  className="w-full pl-10 pr-5 py-4 bg-white rounded border border-gray-200 text-base font-light focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};;
