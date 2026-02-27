
import { useEffect, useState } from "react";
import Select from "react-select";
import { Calendar, Minus, Plus, Upload, X } from "lucide-react";
import { VehicleCheckModal } from "./VehicleCheckModal";
import { BlueDropdownIndicator, customStyles } from "./GeneralDetailsForm";
import pencil from "../../../assets/AutoClaim_icon/pencil.svg";
import trash from "../../../assets/AutoClaim_icon/trash.svg";
import { toast } from "react-toastify";
import { V5CUploadModalOwner } from "../Components/V5CUploadModalOwner";
import * as Yup from 'yup'
import { useFormik } from "formik";
import { createVehicleDetail, getVehicleDetail, updateVehicle } from "../../../services/Vehicle/vehicle";
import { cleanPayload } from "./ClientDetailsForm";
import LeafletAutocompleteMap from "../../../components/GoogleMapAutoComplete/GoogleMapAutoComplete";
import { getVehicleOwner } from "../../../services/VehicleOwner/vehicleOwner";

export const VehicleOwnerForm = ({ formRef }: any) => {

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
        otherBorough: false,
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
      const res = await getVehicleOwner(parseInt(claimId));
      console.log(res);
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
            otherBorough: res.borough?.any_other_borough?.toString() || "false",
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
    console.log(formik.values)
    if (claimId && vehicleId) {
      fetchData();
    }
  }, []);
    useEffect(() => {
      if (formRef) {
        formRef.current = formik;
      }
    }, [formRef, formik]);
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
      }
     catch (e) {
      toast.error("OCR extraction failed");
    } finally {
      // setLoading(false);
    }
  };
  const handleMobileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, ""); // remove non-digits

    if (value.length > 5) {
      value = value.slice(0, 5) + " " + value.slice(5, 11);
    }

    formik.setFieldValue("contact_number", value);
  };
  return (
    <>
      <V5CUploadModalOwner
        isOpen={showUploadModal}
        claimId={claimId}
        formik={formik}
        onClose={() => setShowUploadModal(false)}
        onUploadSuccess={(jobId) => pollJobStatus(jobId)}
      />
      <div className="MainContent w-[788px] ms-[140px] flex-1 inline-flex flex-col items-start gap-6 p-8 overflow-y-auto scrollbar-hide">
        {/* Container matching left-[534px] and top-[157px] from source */}
        <h1 className="text-black text-2xl font-weight-600 font-['Stack_Sans_Headline']">
          Owner Details
        </h1>
        {/* Section 1: Personal Information Section */}
        <div className="self-stretch p-5 rounded-lg border border-gray-100 flex flex-col gap-4">
          <div className="flex justify-between items-center w-full">
            <h2 className="text-black text-xl font-weight-600 leading-5 font-['Stack_Sans_Headline']">
              Vehicle Owner Details
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
                First Name
              </label>
              <input
                value={formik.values.vehicle.make}
                onChange={(e) =>
                  formik.setFieldValue("vehicle.make", e.target.value)
                }
                type="text"
                placeholder="Enter First Name"
                className="h-[52px] px-5 bg-white rounded border border-gray-200 flex items-center justify-between  focus-within:border-blue-500"
              />
            </div>
            {/* Model */}
            <div className="flex flex-col gap-2">
              <label className="text-neutral-900 text-sm font-weight-400">
                Last Name
              </label>
              <input
                type="text"
                placeholder="Enter Last Name"
                value={formik.values.vehicle.model}
                onChange={(e) =>
                  formik.setFieldValue("vehicle.model", e.target.value)
                }
                className="h-[52px] px-5 bg-white rounded border border-gray-200 flex items-center justify-between  focus-within:border-blue-500"
              />
            </div>
          </div>
          <div className="row flex flex-col gap-2">
            <label className="text-neutral-900 text-sm font-weight-400">
              Address{" "}
            </label>
            <LeafletAutocompleteMap
              showMap={false}
              apiKey={import.meta.env.VITE_GOOGLE_MAP_KEY}
              address={formik.values.address}
              onPlaceSelected={(place) => {
                if (place.name) {
                  formik.setFieldValue("address", place.address);
                  formik.setFieldValue("postcode", place?.postalCode);
                }
              }}
              disabled={false}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Body Type */}
            <div className="flex flex-col gap-2">
              <label className="text-neutral-900 text-sm font-weight-400">
                Post Code{" "}
              </label>
              <input
                type="text"
                value={formik.values.vehicle.bodyType}
                onChange={(e) =>
                  formik.setFieldValue("vehicle.bodyType", e.target.value)
                }
                placeholder="Enter Post Code"
                className="h-[52px] px-5 bg-white rounded border border-gray-200 flex items-center justify-between  focus-within:border-blue-500"
              />
            </div>
            {/* Vehicle Registration */}
            <div className="flex flex-col gap-2">
              <label className="text-neutral-900 text-sm font-weight-400">
                Email
              </label>
              <input
                type="text"
                value={formik.values.vehicle.registration}
                onChange={(e) =>
                  formik.setFieldValue("vehicle.registration", e.target.value)
                }
                placeholder="Enter Email"
                className="h-[52px] px-5 bg-white rounded border border-gray-200 flex items-center justify-between  focus-within:border-blue-500"
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
                <span className="text-gray-700 text-base font-light">+44</span>
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
                <span className="text-gray-700 text-base font-light">+44</span>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Engine Size */}
            <div className="flex flex-col gap-2">
              <label className="text-neutral-900 text-sm font-weight-400">
                Vehicle Payment Beneficiary
              </label>
              <input
                value={formik.values.vehicle.engineSize}
                onChange={(e) =>
                  formik.setFieldValue("vehicle.engineSize", e.target.value)
                }
                type="text"
                placeholder="Enter Beneficiary"
                className="h-[52px] px-5 bg-white rounded border border-gray-200 flex items-center justify-between  focus-within:border-blue-500"
              />
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
      </div>
    </>
  );
};;
