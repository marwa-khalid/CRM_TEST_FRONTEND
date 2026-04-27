import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { FieldArray, Formik, Field, ErrorMessage, Form } from "formik";
import * as Yup from "yup";
import { FaTrash } from "react-icons/fa6";
import CustomSelect from "../ReactSelect/ReactSelect";
import { DatePicker } from "../application/date-picker/date-picker";
import { getLocalTimeZone, today } from "@internationalized/date";
import { CalendarDate } from "@internationalized/date";
import type { DateValue } from "react-aria-components";
import {
  getFuelType,
  getTaxiType,
  getTransmissionType,
} from "../../services/Lookups/Generaldetails";
import {
  checkStatusJob,
  createVehicleDetail,
  fetchJobResultCall,
  getVehicleDetail,
  updateVehicle,
  uploadVCDoc,
} from "../../services/Vehicle/Vehicle";
import { useParams } from "react-router-dom";
import UploadCSV5Modal from "../VehicleDetailCard/uploadCV5";
import "react-responsive-modal/styles.css";
import { Modal } from "react-responsive-modal";
import { toast } from "react-toastify";
import { getClaimById } from "../../services/Claims/Claims";
import { FaTimes } from "react-icons/fa";
import { parseCalendarDate } from "../../common/common";

type Vehicle = {
  make: string;
  model: string;
  registration: string;
  color: string;
  fuelType: string;
  engineSize: string;
  transmission: string;
  bodyType: string;
  seats: string;
  category: string;
};

type BoroughDetails = {
  name: string;
  taxiType: string;
  clientBadgeNumber: string;
  badgeExpirationDate: string;
  vehicleBadgeNumber: string;
  otherBorough: boolean;
};

type ThirdPartyVehicle = {
  make: string;
  model: string;
  registration: string;
  color: string;
  imagesAvailable: boolean;
};

type FormValues = {
  vehicle: Vehicle;
  borough: BoroughDetails;
  thirdPartyVehicles: ThirdPartyVehicle[];
};

interface VehicleDetailsFormProps {
  claimData?: any;
  isEditMode?: boolean;
  handleNext?: (step: number, direction: string) => void;
  skipNext: boolean;
}

const booleanOptions = [
  { value: "true", label: "Yes" },
  { value: "false", label: "No" },
];

const VehicleDetailsForm = forwardRef<any, VehicleDetailsFormProps>(
  ({ claimData, isEditMode, handleNext, skipNext }, ref) => {
    const { id } = useParams();
    const searchParams = new URLSearchParams(window.location.search);
    const claimID = searchParams.get("claimid");

    const [fuelTypes, setFuelTypes] = useState([]);
    const [transmissionTypes, setTransmissionTypes] = useState([]);
    const [taxiTypes, setTaxiTypes] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [uploadModal, setUploadModal] = useState(false);
    const [vehicleModal, setVehicleModal] = useState(false);
    const [dvlaModal, setDvlaModal] = useState(false);
    const [midModal, setMidModal] = useState(false);
    const [claimType, setClaimType] = useState(null);
    const [jobID, setJobId] = useState("");
    const [confirmation, setConfirmation] = useState(false);
    const [vehicleToDelete, setVehicleToDelete] = useState(null);

    const now = today(getLocalTimeZone());

    const [expirationDate, setExpirationDate] = useState<DateValue | null>(
      null
    );
    const [isEditing, setIsEditing] = useState(false);

    const formikRef = useRef<any>(null);
    const dropdownRef = useRef(null);

    const [confirming, setConfirming] = useState(false);
    const [fieldError, setFieldError] = useState({});
    const [loading, setLoading] = useState(false);

    const [initialValues, setInitialValues] = useState<FormData>({
      vehicle: {
        make: "",
        model: "",
        registration: "",
        color: "",
        fuelType: null,
        engineSize: "",
        transmission: null,
        bodyType: "",
        seats: "",
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
        {
          make: "",
          model: "",
          registration: "",
          color: "",
          imagesAvailable: true,
        },
      ],
    });

    // Validation schema
    const validationSchema = Yup.object({
      // vehicle: Yup.object({
      //   make: Yup.string().required('Make is required'),
      //   model: Yup.string().required('Model is required'),
      //   registration: Yup.string().required('Registration is required'),
      //   color: Yup.string().required('Color is required'),
      //   fuelType: Yup.string().required('Fuel type is required'),
      //   engineSize: Yup.string().required('Engine size is required'),
      //   transmission: Yup.string().required('Transmission is required'),
      //   bodyType: Yup.string().required('Body type is required'),
      //   seats: Yup.string().required('Number of seats is required'),
      //   category: Yup.string().required('Vehicle category is required'),
      // }),
      // borough: Yup.object({
      //   name: Yup.string().required('Borough name is required'),
      //   taxiType: Yup.string().required('Taxi type is required'),
      //   clientBadgeNumber: Yup.string().required('Client badge number is required'),
      //   // Uncomment if badgeExpirationDate is required
      //   // badgeExpirationDate: Yup.string().required('Badge expiration date is required'),
      //   vehicleBadgeNumber: Yup.string().required('Vehicle badge number is required'),
      //   otherBorough: Yup.boolean()
      //     .oneOf([true, false], 'Please specify if other borough')
      //     .required('Please specify if other borough'),
      // }),
      // thirdPartyVehicles: Yup.array().of(
      //   Yup.object({
      //     make: Yup.string().required('Make is required'),
      //     model: Yup.string().required('Model is required'),
      //     registration: Yup.string().required('Registration is required'),
      //     color: Yup.string().required('Color is required'),
      //     imagesAvailable: Yup.boolean()
      //       .oneOf([true, false], 'Please specify if images are available')
      //       .required('Please specify if images are available'),
      //   })
      // ),
    });

    useEffect(() => {
      fetchFuelType();
      fetchTransmissionType();
      fetchTaxiType();
      fetchDetails();
      fetchClaimData();
    }, []);

    useEffect(() => {
      window.scrollTo(0, 0);
    }, []);

    useEffect(() => {
      function handleClickOutside(event: any) {
        if (
          dropdownRef.current &&
          !dropdownRef.current.contains(event.target)
        ) {
          setIsOpen(false);
        }
      }
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }, []);

    const fetchClaimData = async () => {
      try {
        const data = await getClaimById(parseInt(id || claimID));
        setClaimType(data?.claim_type_id);
      } catch (error) {
        console.error("Failed to fetch claim data:", error);
      } finally {
      }
    };

    const fetchDetails = async () => {
      try {
        const res = await getVehicleDetail(claimID || id);

        const mappedValues: FormValues = {
          vehicle: {
            make: res.make || "",
            model: res.model || "",
            registration: res.registration || "",
            color: res.color || "",
            fuelType: res.fuel_type_id || "",
            engineSize: res.engine_size || "",
            transmission: res.transmission_id || "",
            bodyType: res.body_type || "",
            seats: res.number_of_seat?.toString() || "",
            category: res.vehicle_category || "",
          },
          borough: {
            name: res.borough?.borough_name || "",
            taxiType: res.borough?.taxi_type_id || "",
            clientBadgeNumber: res.borough?.client_badge_number || "",
            badgeExpirationDate: "" || "",
            vehicleBadgeNumber: res.borough?.vehicle_badge_number || "",
            // otherBorough: res.borough?.any_other_borough || false,
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

        setExpirationDate(
          parseCalendarDate(res.borough?.badge_expiration_date)
        );
        setInitialValues(mappedValues);
        setIsEditing(true);
      } catch (e) {
        console.error("Failed to fetch details:", e);
      }
    };

    const fetchFuelType = async () => {
      try {
        const res = await getFuelType();
        setFuelTypes(res?.data);
      } catch (e) {}
    };

    const fetchTransmissionType = async () => {
      try {
        const res = await getTransmissionType();
        setTransmissionTypes(res?.data);
      } catch (e) {}
    };

    const fetchTaxiType = async () => {
      try {
        const res = await getTaxiType();
        setTaxiTypes(res?.data);
      } catch (e) {}
    };

    useImperativeHandle(ref, () => ({
      submitForm: async () => {
        if (!formikRef.current) {
          throw new Error("Form not available");
        }

        await formikRef.current.submitForm();

        return true;
      },
    }));

    // const formatCalendarDate = (date?: CalendarDate) => {
    //   if (!date) return undefined;
    //   const jsDate = new Date(date.year, date.month - 1, date.day);
    //   return jsDate.toISOString().split("T")[0];
    // };
    const formatCalendarDate = (date?: CalendarDate) => {
      if (!date) return undefined;

      const year = date.year;
      const month = String(date.month).padStart(2, "0");
      const day = String(date.day).padStart(2, "0");

      return `${year}-${month}-${day}`;
    };

    const toggleDropdown = () => {
      setIsOpen(!isOpen);
    };

    const handleSubmit = async (values: any) => {
      const expirationFormattedDate = formatCalendarDate(expirationDate);
      const storedClaimId = id || claimID;
      try {
        const payload = {
          claim_id: storedClaimId,
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
            badge_expiration_date: expirationFormattedDate,
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

        if (storedClaimId && isEditing) {
          await updateVehicle(payload, storedClaimId);
        } else {
          await createVehicleDetail(payload);
        }
        toast.success("Vehicle Details saved successfully");
        if (handleNext && !skipNext) handleNext(6, "next");
      } catch (e) {
        toast.error("Unable to save vehicle details");
      }
    };

    const handleSetInitialValues = (response: any) => {
      const vehicleDetails = response;

      setInitialValues((prev) => ({
        ...prev,
        vehicle: {
          make: vehicleDetails.make || "",
          model: vehicleDetails.model || "",
          registration: vehicleDetails.registration || "",
          color: vehicleDetails.color || "",
          fuelType: vehicleDetails.fuel_type_id || "",
          engineSize: vehicleDetails.engine_size || "",
          transmission: vehicleDetails.transmission_id || "",
          bodyType: vehicleDetails.body_type || "",
          seats: vehicleDetails["number_of_seat"] || "",
          category: vehicleDetails.vehicle_category || "",
        },
      }));

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
    };

    const handleUpload = async (uploadedFiles: any) => {
      setConfirming(true);
      try {
        const response = await uploadVCDoc(uploadedFiles, id || claimID);
        const jobId = response?.job_id;
        setJobId(jobId);
        setLoading(true);
        setUploadModal(false);
        toast.success("File uploaded successfully");
        await pollJobStatus(jobId);
      } catch (e) {
        console.error(e);
        toast.error("Unable to upload file");
      } finally {
        setConfirming(false);
      }
    };

    const pollJobStatus = async (jobId: string) => {
      const POLL_INTERVAL = 3000;
      const MAX_ATTEMPTS = 400;

      for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
        try {
          const res = await checkStatusJob(jobId);
          if (res.status === "completed") {
            await fetchJobResult(jobId);
            return;
          }

          if (res.status === "failed") {
            toast.error(res.error || "Import job failed");
            return;
          }

          await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL));
        } catch (err) {
          console.error("Error checking job status:", err);
          toast.error("Error checking job status");
          return;
        }
      }

      toast.error("Timed out waiting for job completion");
    };

    const fetchJobResult = async (jobId: string) => {
      try {
        const res = await fetchJobResultCall(jobId);
        if (res.status === "completed") {
          handleSetInitialValues(res?.result[0][0]);
          toast.success("Import completed successfully");
        } else if (res.status === 202) {
          toast.info("Job still processing...");
        } else if (res.status === 500) {
          const errorData = await res.json();
          toast.error(`Job failed: ${errorData.error || "Unknown error"}`);
        }
      } catch (err) {
        console.error("Error fetching job result:", err);
        toast.error("Error fetching job result");
      } finally {
        setLoading(false);
      }
    };

    if (loading) {
      return (
        <div className={`flex justify-center items-center h-screen bg-gray-50`}>
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      );
    }

    return (
      <>
        <Formik
          innerRef={formikRef}
          initialValues={initialValues}
          validationSchema={validationSchema}
          enableReinitialize
          onSubmit={handleSubmit}
        >
          {({ values, setFieldValue }) => (
            <Form className="bg-white p-0 mt-10">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-lg font-weight-600  mb-2 sm:text-xl">
                    Client's Vehicle Details
                  </h1>
                  <p className="text-sm text-gray-600  mb-4 sm:text-sm sm:mb-6">
                    Enter the client vehicle details below.
                  </p>
                </div>
                <div className="flex gap-4 items-center">
                  <button
                    type="button"
                    onClick={() => {
                      setUploadModal(true);
                    }}
                    className="px-4 py-2 bg-white-600 text-gray-800 rounded-lg hover:bg-gray-100 focus:outline-none border focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
                  >
                    Upload V5C File
                  </button>
                  <div
                    ref={dropdownRef}
                    className="relative inline-block text-left"
                  >
                    <button
                      type="button"
                      onClick={toggleDropdown}
                      className="px-4 py-2 bg-white-600 text-gray-800 rounded-lg hover:bg-gray-100 focus:outline-none border focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
                    >
                      Vehicle Checkpoint
                    </button>

                    {/* Dropdown Menu */}
                    {isOpen && (
                      <div className="absolute right-0 mt-2 w-[180px] bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                        <ul className="py-1 text-sm text-gray-700">
                          <li>
                            <button
                              type="button"
                              className="block px-4 py-2 hover:bg-[#252B37] hover:text-white w-full text-left"
                              onClick={() => {
                                setVehicleModal(true);
                                setIsOpen(false);
                              }}
                            >
                              Vehicle Check
                            </button>
                          </li>
                          <li>
                            <button
                              type="button"
                              className="block px-4 py-2 hover:bg-[#252B37] hover:text-white w-full text-left"
                              onClick={() => {
                                setIsOpen(false);
                                window.open(
                                  "https://www.gov.uk/view-driving-licence",
                                  "_blank"
                                );
                              }}
                            >
                              DVLA
                            </button>
                          </li>
                          <li>
                            <button
                              type="button"
                              className="block px-4 py-2 hover:bg-[#252B37] hover:text-white w-full text-left"
                              onClick={() => {
                                setIsOpen(false);
                                window.open(
                                  "https://www.askmid.com/",
                                  "_blank"
                                );
                              }}
                            >
                              Process MID
                            </button>
                          </li>
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {/* Make */}
                <Field name="vehicle.make">
                  {({ field, form }: any) => {
                    const error = form.errors["vehicle.make"];
                    const touched = form.touched["vehicle.make"];
                    const hasError =
                      fieldError["vehicle.make"] || (touched && error);

                    return (
                      <div className="flex flex-col sm:flex-row items-start mt-4 group relative">
                        <label className="w-full sm:w-1/4 text-sm font-medium mb-1 sm:mb-0">
                          Make
                        </label>
                        <div className="w-full sm:w-3/4 relative">
                          <input
                            {...field}
                            onChange={(e) => {
                              form.setFieldValue(field.name, e.target.value);
                              if (e.target.value) {
                                setFieldError((prevState: any) => {
                                  const newState = { ...prevState };
                                  delete newState["vehicle.make"];
                                  return newState;
                                });
                                form.setFieldError(field.name, undefined);
                              }
                            }}
                            className={`w-full p-2 sm:p-3 border rounded-lg bg-white hover:border-gray-400 focus:outline-none  ${
                              hasError ? "border-red-500" : "border-gray-300"
                            }`}
                          />

                          {fieldError["vehicle.make"] ? (
                            <p className="text-red-500 text-xs">
                              {fieldError["vehicle.make"]}
                            </p>
                          ) : (
                            ""
                          )}
                          <ErrorMessage
                            name="vehicle.make"
                            component="div"
                            className="text-red-500 text-xs mt-1"
                          />
                        </div>
                      </div>
                    );
                  }}
                </Field>

                {/* Model */}
                <Field name="vehicle.model">
                  {({ field, form }: any) => {
                    const error = form.errors["vehicle.model"];
                    const touched = form.touched["vehicle.model"];
                    const hasError =
                      fieldError["vehicle.model"] || (touched && error);

                    return (
                      <div className="flex flex-col sm:flex-row items-start mt-4 group relative">
                        <label className="w-full sm:w-1/4 text-sm font-medium mb-1 sm:mb-0">
                          Model
                        </label>
                        <div className="w-full sm:w-3/4 relative">
                          <input
                            {...field}
                            onChange={(e) => {
                              form.setFieldValue(field.name, e.target.value);
                              if (e.target.value) {
                                setFieldError((prevState: any) => {
                                  const newState = { ...prevState };
                                  delete newState["vehicle.model"];
                                  return newState;
                                });
                                form.setFieldError(field.name, undefined);
                              }
                            }}
                            className={`w-full p-2 sm:p-3 border rounded-lg bg-white hover:border-gray-400 focus:outline-none  ${
                              hasError ? "border-red-500" : "border-gray-300"
                            }`}
                          />

                          {fieldError["vehicle.model"] ? (
                            <p className="text-red-500 text-xs">
                              {fieldError["vehicle.model"]}
                            </p>
                          ) : (
                            ""
                          )}
                          <ErrorMessage
                            name="vehicle.make"
                            component="div"
                            className="text-red-500 text-xs mt-1"
                          />
                        </div>
                      </div>
                    );
                  }}
                </Field>

                {/* Body Type */}
                <Field name="vehicle.bodyType">
                  {({ field, form }: any) => {
                    const error = form.errors["vehicle.bodyType"];
                    const touched = form.touched["vehicle.bodyType"];
                    const hasError =
                      fieldError["vehicle.bodyType"] || (touched && error);

                    return (
                      <div className="flex flex-col sm:flex-row items-start mt-4 group relative">
                        <label className="w-full sm:w-1/4 text-sm font-medium mb-1 sm:mb-0">
                          Body Type
                        </label>
                        <div className="w-full sm:w-3/4 relative">
                          <input
                            {...field}
                            onChange={(e) => {
                              form.setFieldValue(field.name, e.target.value);
                              if (e.target.value) {
                                setFieldError((prevState: any) => {
                                  const newState = { ...prevState };
                                  delete newState["vehicle.bodyType"];
                                  return newState;
                                });
                                form.setFieldError(field.name, undefined);
                              }
                            }}
                            className={`w-full p-2 sm:p-3 border rounded-lg bg-white hover:border-gray-400 focus:outline-none  ${
                              hasError ? "border-red-500" : "border-gray-300"
                            }`}
                          />

                          {fieldError["vehicle.bodyType"] ? (
                            <p className="text-red-500 text-xs">
                              {fieldError["vehicle.bodyType"]}
                            </p>
                          ) : (
                            ""
                          )}
                          <ErrorMessage
                            name="vehicle.make"
                            component="div"
                            className="text-red-500 text-xs mt-1"
                          />
                        </div>
                      </div>
                    );
                  }}
                </Field>

                {/* Registration */}
                <Field name="vehicle.registration">
                  {({ field, form }: any) => {
                    const error = form.errors["vehicle.registration"];
                    const touched = form.touched["vehicle.registration"];
                    const hasError =
                      fieldError["vehicle.registration"] || (touched && error);

                    return (
                      <div className="flex flex-col sm:flex-row items-start mt-4 group relative">
                        <label className="w-full sm:w-1/4 text-sm font-medium mb-1 sm:mb-0">
                          Registration
                        </label>
                        <div className="w-full sm:w-3/4 relative">
                          <input
                            {...field}
                            onChange={(e) => {
                              form.setFieldValue(field.name, e.target.value);
                              if (e.target.value) {
                                setFieldError((prevState: any) => {
                                  const newState = { ...prevState };
                                  delete newState["vehicle.registration"];
                                  return newState;
                                });
                                form.setFieldError(field.name, undefined);
                              }
                            }}
                            className={`w-full p-2 sm:p-3 border rounded-lg bg-white hover:border-gray-400 focus:outline-none  ${
                              hasError ? "border-red-500" : "border-gray-300"
                            }`}
                          />

                          {fieldError["vehicle.registration"] ? (
                            <p className="text-red-500 text-xs">
                              {fieldError["vehicle.registration"]}
                            </p>
                          ) : (
                            ""
                          )}
                          <ErrorMessage
                            name="vehicle.make"
                            component="div"
                            className="text-red-500 text-xs mt-1"
                          />
                        </div>
                      </div>
                    );
                  }}
                </Field>

                {/* Color */}
                <Field name="vehicle.color">
                  {({ field, form }: any) => {
                    const error = form.errors["vehicle.color"];
                    const touched = form.touched["vehicle.color"];
                    const hasError =
                      fieldError["vehicle.color"] || (touched && error);

                    return (
                      <div className="flex flex-col sm:flex-row items-start mt-4 group relative">
                        <label className="w-full sm:w-1/4 text-sm font-medium mb-1 sm:mb-0">
                          Color
                        </label>
                        <div className="w-full sm:w-3/4 relative">
                          <input
                            {...field}
                            onChange={(e) => {
                              form.setFieldValue(field.name, e.target.value);
                              if (e.target.value) {
                                setFieldError((prevState: any) => {
                                  const newState = { ...prevState };
                                  delete newState["vehicle.color"];
                                  return newState;
                                });
                                form.setFieldError(field.name, undefined);
                              }
                            }}
                            className={`w-full p-2 sm:p-3 border rounded-lg bg-white hover:border-gray-400 focus:outline-none  ${
                              hasError ? "border-red-500" : "border-gray-300"
                            }`}
                          />

                          {fieldError["vehicle.color"] ? (
                            <p className="text-red-500 text-xs">
                              {fieldError["vehicle.color"]}
                            </p>
                          ) : (
                            ""
                          )}
                          <ErrorMessage
                            name="vehicle.make"
                            component="div"
                            className="text-red-500 text-xs mt-1"
                          />
                        </div>
                      </div>
                    );
                  }}
                </Field>

                {/* Fuel Type */}
                <Field name="vehicle.fuelType">
                  {({ field, form }: any) => {
                    const error = form.errors["vehicle.fuelType"];
                    const touched = form.touched["vehicle.fuelType"];
                    const hasError =
                      fieldError["vehicle.fuelType"] || (touched && error);

                    return (
                      <div className="flex flex-col sm:flex-row items-start mt-4 group relative">
                        <label className="w-full sm:w-1/4 text-sm font-medium mb-1 sm:mb-0">
                          Fuel Type
                        </label>
                        <div className="w-full sm:w-3/4 relative">
                          <CustomSelect
                            options={fuelTypes.map((c: any) => ({
                              value: c.id,
                              label: c.label,
                            }))}
                            placeholder="Select Fuel Type"
                            value={
                              fuelTypes
                                .map((c: any) => ({
                                  value: c.id,
                                  label: c.label,
                                }))
                                .find(
                                  (opt: any) => opt.value === field.value
                                ) || null
                            }
                            onChange={(opt) => {
                              form.setFieldValue(
                                "vehicle.fuelType",
                                opt?.value || ""
                              );
                              if (opt?.value) {
                                setFieldError((prevState: any) => {
                                  const newState = { ...prevState };
                                  delete newState["vehicle.fuelType"];
                                  return newState;
                                });
                                form.setFieldError(field.name, undefined);
                              }
                            }}
                            className={`w-full border rounded-lg bg-white hover:border-gray-400 focus:outline-none  ${
                              hasError ? "border-red-500" : "border-gray-300"
                            }`}
                          />

                          {fieldError["vehicle.fuelType"] ? (
                            <p className="text-red-500 text-xs">
                              {fieldError["vehicle.fuelType"]}
                            </p>
                          ) : (
                            ""
                          )}
                          <ErrorMessage
                            name="vehicle.make"
                            component="div"
                            className="text-red-500 text-xs mt-1"
                          />
                        </div>
                      </div>
                    );
                  }}
                </Field>

                {/* Engine Size */}
                <Field name="vehicle.engineSize">
                  {({ field, form }: any) => {
                    const error = form.errors["vehicle.engineSize"];
                    const touched = form.touched["vehicle.engineSize"];
                    const hasError =
                      fieldError["vehicle.engineSize"] || (touched && error);

                    return (
                      <div className="flex flex-col sm:flex-row items-start mt-4 group relative">
                        <label className="w-full sm:w-1/4 text-sm font-medium mb-1 sm:mb-0">
                          Engine Size
                        </label>
                        <div className="w-full sm:w-3/4 relative">
                          <input
                            {...field}
                            onChange={(e) => {
                              form.setFieldValue(field.name, e.target.value);
                              if (e.target.value) {
                                setFieldError((prevState: any) => {
                                  const newState = { ...prevState };
                                  delete newState["vehicle.engineSize"];
                                  return newState;
                                });
                                form.setFieldError(field.name, undefined);
                              }
                            }}
                            className={`w-full p-2 sm:p-3 border rounded-lg bg-white hover:border-gray-400 focus:outline-none  ${
                              hasError ? "border-red-500" : "border-gray-300"
                            }`}
                          />

                          {fieldError["vehicle.engineSize"] ? (
                            <p className="text-red-500 text-xs">
                              {fieldError["vehicle.engineSize"]}
                            </p>
                          ) : (
                            ""
                          )}
                          <ErrorMessage
                            name="vehicle.make"
                            component="div"
                            className="text-red-500 text-xs mt-1"
                          />
                        </div>
                      </div>
                    );
                  }}
                </Field>

                {/* Transmission */}
                <Field name="vehicle.transmission">
                  {({ field, form }: any) => {
                    const error = form.errors["vehicle.transmission"];
                    const touched = form.touched["vehicle.transmission"];
                    const hasError =
                      fieldError["vehicle.transmission"] || (touched && error);

                    return (
                      <div className="flex flex-col sm:flex-row items-start mt-4 group relative">
                        <label className="w-full sm:w-1/4 text-sm font-medium mb-1 sm:mb-0">
                          Transmission
                        </label>
                        <div className="w-full sm:w-3/4 relative">
                          <CustomSelect
                            options={transmissionTypes.map((c: any) => ({
                              value: c.id,
                              label: c.label,
                            }))}
                            placeholder="Select Transmission"
                            value={
                              transmissionTypes
                                .map((c: any) => ({
                                  value: c.id,
                                  label: c.label,
                                }))
                                .find(
                                  (opt: any) => opt.value === field.value
                                ) || null
                            }
                            onChange={(opt) => {
                              form.setFieldValue(
                                "vehicle.transmission",
                                opt?.value || ""
                              );
                              if (opt?.value !== "") {
                                setFieldError((prevState: any) => {
                                  const newState = { ...prevState };
                                  delete newState["vehicle.transmission"];
                                  return newState;
                                });
                                form.setFieldError(field.name, undefined);
                              }
                            }}
                            className={`w-full border rounded-[10px] bg-white hover:border-gray-400 focus:outline-none  ${
                              fieldError["vehicle.transmission"]
                                ? "border-red-500"
                                : "border-gray-300"
                            }`}
                          />
                          {fieldError["vehicle.transmission"] ? (
                            <p className="text-red-500 text-xs">
                              {fieldError["vehicle.transmission"]}
                            </p>
                          ) : (
                            ""
                          )}
                          <ErrorMessage
                            name="vehicle.make"
                            component="div"
                            className="text-red-500 text-xs mt-1"
                          />
                        </div>
                      </div>
                    );
                  }}
                </Field>

                {/* Seats */}
                <Field name="vehicle.seats">
                  {({ field, form }: any) => {
                    const error = form.errors["vehicle.seats"];
                    const touched = form.touched["vehicle.seats"];
                    const hasError =
                      fieldError["vehicle.seats"] || (touched && error);

                    return (
                      <div className="flex flex-col sm:flex-row items-start mt-4 group relative">
                        <label className="w-full sm:w-1/4 text-sm font-medium mb-1 sm:mb-0">
                          Number of Seats
                        </label>
                        <div className="w-full sm:w-3/4 relative">
                          <input
                            {...field}
                            required
                            onChange={(e) => {
                              form.setFieldValue(field.name, e.target.value);
                              if (e.target.value) {
                                setFieldError((prevState: any) => {
                                  const newState = { ...prevState };
                                  delete newState["vehicle.seats"];
                                  return newState;
                                });
                                form.setFieldError(field.name, undefined);
                              }
                            }}
                            className={`w-full p-2 sm:p-3 border rounded-lg bg-white hover:border-gray-400 focus:outline-none  ${
                              hasError ? "border-red-500" : "border-gray-300"
                            }`}
                          />

                          {fieldError["vehicle.seats"] ? (
                            <p className="text-red-500 text-xs">
                              {fieldError["vehicle.seats"]}
                            </p>
                          ) : (
                            ""
                          )}
                          <ErrorMessage
                            name="vehicle.make"
                            component="div"
                            className="text-red-500 text-xs mt-1"
                          />
                        </div>
                      </div>
                    );
                  }}
                </Field>

                {/* Category */}
                <Field name="vehicle.category">
                  {({ field, form }: any) => {
                    const error = form.errors["vehicle.category"];
                    const touched = form.touched["vehicle.category"];
                    const hasError =
                      fieldError["vehicle.category"] || (touched && error);

                    return (
                      <div className="flex flex-col sm:flex-row items-start mt-4 group relative">
                        <label className="w-full sm:w-1/4 text-sm font-medium mb-1 sm:mb-0">
                          Category
                        </label>
                        <div className="w-full sm:w-3/4 relative">
                          <input
                            {...field}
                            onChange={(e) => {
                              form.setFieldValue(field.name, e.target.value);
                              if (e.target.value) {
                                setFieldError((prevState: any) => {
                                  const newState = { ...prevState };
                                  delete newState["vehicle.category"];
                                  return newState;
                                });
                                form.setFieldError(field.name, undefined);
                              }
                            }}
                            className={`w-full p-2 sm:p-3 border rounded-lg bg-white hover:border-gray-400 focus:outline-none  ${
                              hasError ? "border-red-500" : "border-gray-300"
                            }`}
                          />

                          {fieldError["vehicle.category"] ? (
                            <p className="text-red-500 text-xs">
                              {fieldError["vehicle.category"]}
                            </p>
                          ) : (
                            ""
                          )}
                          <ErrorMessage
                            name="vehicle.make"
                            component="div"
                            className="text-red-500 text-xs mt-1"
                          />
                        </div>
                      </div>
                    );
                  }}
                </Field>
              </div>
              <hr className="mb-4 sm:mb-6 mt-6" />

              {/* Borough Section */}
              {claimType === 1 && (
                <>
                  <h1 className="text-lg font-weight-600 text-gray-900 mb-2">
                    Borough Details
                  </h1>
                  <p className="text-sm text-gray-600  mb-4 sm:text-sm sm:mb-6">
                    Enter the borough details below.
                  </p>
                  <hr className="mb-4 sm:mb-6 mt-8" />

                  <div className="space-y-4">
                    {/* Borough name */}
                    <Field name="borough.name">
                      {({ field }: any) => (
                        <div className="flex flex-col sm:flex-row items-start mt-4">
                          <label className="w-full sm:w-1/4 text-sm font-medium mb-1 sm:mb-0">
                            Borough Name
                          </label>
                          <div className="w-full sm:w-3/4">
                            <input
                              {...field}
                              className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg bg-white hover:border-gray-400 focus:outline-none "
                            />
                            <ErrorMessage
                              name="borough.name"
                              component="div"
                              className="text-red-500 text-xs mt-1"
                            />
                          </div>
                        </div>
                      )}
                    </Field>

                    {/* Taxi Type */}
                    <Field name="borough.taxiType">
                      {({ field }: any) => (
                        <div className="flex flex-col sm:flex-row items-start mt-4 w-full">
                          <label className="w-full sm:w-1/4 text-sm font-medium mb-1 sm:mb-0">
                            Taxi Type
                          </label>
                          <div className="w-full sm:w-3/4">
                            <CustomSelect
                              options={taxiTypes.map((c: any) => ({
                                value: c.id,
                                label: c.label,
                              }))}
                              placeholder="Select Taxi Type"
                              value={
                                taxiTypes
                                  .map((c: any) => ({
                                    value: c.id,
                                    label: c.label,
                                  }))
                                  .find(
                                    (opt: any) => opt.value === field.value
                                  ) || null
                              }
                              onChange={(opt) =>
                                setFieldValue(
                                  "borough.taxiType",
                                  opt?.value || ""
                                )
                              }
                            />
                            <ErrorMessage
                              name="borough.taxiType"
                              component="div"
                              className="text-red-500 text-xs mt-1"
                            />
                          </div>
                        </div>
                      )}
                    </Field>

                    {/* Badge Fields */}
                    <Field name="borough.clientBadgeNumber">
                      {({ field }: any) => (
                        <div className="flex flex-col sm:flex-row items-start mt-4">
                          <label className="w-full sm:w-1/4 text-sm font-medium mb-1 sm:mb-0">
                            Client Badge Number
                          </label>
                          <div className="w-full sm:w-3/4">
                            <input
                              {...field}
                              className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg bg-white hover:border-gray-400 focus:outline-none "
                            />
                            <ErrorMessage
                              name="borough.clientBadgeNumber"
                              component="div"
                              className="text-red-500 text-xs mt-1"
                            />
                          </div>
                        </div>
                      )}
                    </Field>

                    <Field name="borough.badgeExpirationDate">
                      {({ field }: any) => (
                        <div className="flex flex-col sm:flex-row items-start mt-4">
                          <label className="w-full sm:w-1/4 text-sm font-medium mb-1 sm:mb-0">
                            Badge Expiration Date
                          </label>
                          <div className="w-full sm:w-3/4">
                            <DatePicker
                              value={expirationDate}
                              onChange={setExpirationDate}
                              className="w-full"
                            />
                            <ErrorMessage
                              name="borough.badgeExpirationDate"
                              component="div"
                              className="text-red-500 text-xs mt-1"
                            />
                          </div>
                        </div>
                      )}
                    </Field>

                    <Field name="borough.vehicleBadgeNumber">
                      {({ field }: any) => (
                        <div className="flex flex-col sm:flex-row items-start mt-4">
                          <label className="w-full sm:w-1/4 text-sm font-medium mb-1 sm:mb-0">
                            Vehicle Badge Number
                          </label>
                          <div className="w-full sm:w-3/4">
                            <input
                              {...field}
                              className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg bg-white hover:border-gray-400 focus:outline-none "
                            />
                            <ErrorMessage
                              name="borough.vehicleBadgeNumber"
                              component="div"
                              className="text-red-500 text-xs mt-1"
                            />
                          </div>
                        </div>
                      )}
                    </Field>

                    {/* Other borough */}
                    <Field name="borough.otherBorough">
                      {({ field, form }: any) => (
                        <div className="flex flex-col sm:flex-row items-start mt-4">
                          <label className="w-full sm:w-1/4 text-sm font-medium mb-1 sm:mb-0">
                            Other Borough?
                          </label>
                          <div className="w-full sm:w-3/4">
                            <div className="flex gap-4">
                              <label className="flex items-center">
                                <Field
                                  type="radio"
                                  name="borough.otherBorough"
                                  value="true"
                                  className="w-4 h-4 accent-[#414651] border-gray-300 focus:ring-custom-500"
                                />
                                <span className="ml-2 text-sm text-gray-700">
                                  Yes
                                </span>
                              </label>
                              <label className="flex items-center">
                                <Field
                                  type="radio"
                                  name="borough.otherBorough"
                                  value="false"
                                  className="w-4 h-4 accent-[#414651] border-gray-300 focus:ring-custom-500"
                                />
                                <span className="ml-2 text-sm text-gray-700">
                                  No
                                </span>
                              </label>
                            </div>
                            <ErrorMessage
                              name="borough.otherBorough"
                              component="div"
                              className="text-red-500 text-xs mt-1"
                            />
                          </div>
                        </div>
                      )}
                    </Field>
                  </div>
                </>
              )}

              <hr className="mb-4 sm:mb-6 mt-8" />

              {/* Third Party Vehicles */}
              <div className="flex justify-between">
                <div>
                  <h1 className="text-lg font-weight-600 text-gray-900 mb-2">
                    Third Party Vehicles
                  </h1>
                  <p className="text-sm text-gray-600  mb-4 sm:text-sm sm:mb-6">
                    Enter the third party vehicle details below.
                  </p>
                </div>
                <div>
                  <button
                    type="button"
                    onClick={() => {
                      const vehicles = [...values.thirdPartyVehicles];
                      vehicles.push({
                        make: "",
                        model: "",
                        registration: "",
                        color: "",
                        imagesAvailable: false,
                      });
                      setFieldValue("thirdPartyVehicles", vehicles);
                    }}
                    className="px-4 py-2 bg-white-600 text-gray-800 rounded-lg hover:bg-gray-100 focus:outline-none border focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
                  >
                    Add Another Vehicle
                  </button>
                </div>
              </div>

              <hr className="mb-4 sm:mb-6 mt-8" />
              <FieldArray name="thirdPartyVehicles">
                {({ remove, push }) => (
                  <div>
                    {values.thirdPartyVehicles.map((v, index) => (
                      <div key={index} className="my-2 rounded">
                        <div className="flex justify-between">
                          <div>
                            <h1 className="text-xl font-bold mt-6">
                              Third Party Vehicles{" "}
                              {values.thirdPartyVehicles.length > 1
                                ? index + 1
                                : ""}
                            </h1>
                          </div>
                          <div>
                            {values.thirdPartyVehicles.length > 1 && (
                              <button
                                type="button"
                                onClick={() => {
                                  setVehicleToDelete(index);
                                  setConfirmation(true);
                                }}
                                className="flex items-center gap-2 text-custom mt-4"
                              >
                                <span>Remove Vehicle</span>
                                <FaTrash />
                              </button>
                            )}
                          </div>
                        </div>

                        <Modal
                          open={confirmation}
                          onClose={() => setConfirmation(false)}
                          center
                          closeIcon={
                            <FaTimes
                              size={18}
                              className="text-gray-500 hover:text-gray-700"
                            />
                          }
                        >
                          <div className="p-4">
                            <h2 className="text-lg font-weight-600 text-gray-800 mb-3">
                              Are you sure?
                            </h2>
                            <p className="text-sm text-gray-600 mb-6">
                              Do you really want to delete this vehicle?
                            </p>

                            <div className="flex justify-end space-x-3">
                              <button
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
                                onClick={() => {
                                  if (vehicleToDelete !== null) {
                                    remove(vehicleToDelete);
                                    setVehicleToDelete(null);
                                  }
                                  setConfirmation(false);
                                }}
                              >
                                Yes, Delete
                              </button>
                              <button
                                className="px-4 py-2 bg-white text-gray-800 border rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 transition-colors"
                                onClick={() => {
                                  setVehicleToDelete(null);
                                  setConfirmation(false);
                                }}
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        </Modal>

                        {/* Make */}
                        <Field name={`thirdPartyVehicles.${index}.make`}>
                          {({ field }: any) => (
                            <div className="flex flex-col sm:flex-row items-start mt-4">
                              <label className="w-full sm:w-1/4 text-sm font-medium mb-1 sm:mb-0">
                                Make
                              </label>
                              <div className="w-full sm:w-3/4">
                                <input
                                  required
                                  {...field}
                                  className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg bg-white hover:border-gray-400 focus:outline-none "
                                />
                                <ErrorMessage
                                  name={`thirdPartyVehicles.${index}.make`}
                                  component="div"
                                  className="text-red-500 text-xs mt-1"
                                />
                              </div>
                            </div>
                          )}
                        </Field>

                        {/* Model */}
                        <Field name={`thirdPartyVehicles.${index}.model`}>
                          {({ field }: any) => (
                            <div className="flex flex-col sm:flex-row items-start mt-4">
                              <label className="w-full sm:w-1/4 text-sm font-medium mb-1 sm:mb-0">
                                Model
                              </label>
                              <div className="w-full sm:w-3/4">
                                <input
                                  {...field}
                                  className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg bg-white hover:border-gray-400 focus:outline-none "
                                />
                                <ErrorMessage
                                  name={`thirdPartyVehicles.${index}.model`}
                                  component="div"
                                  className="text-red-500 text-xs mt-1"
                                />
                              </div>
                            </div>
                          )}
                        </Field>

                        {/* Registration */}
                        <Field
                          name={`thirdPartyVehicles.${index}.registration`}
                        >
                          {({ field }: any) => (
                            <div className="flex flex-col sm:flex-row items-start mt-4">
                              <label className="w-full sm:w-1/4 text-sm font-medium mb-1 sm:mb-0">
                                Registration
                              </label>
                              <div className="w-full sm:w-3/4">
                                <input
                                  {...field}
                                  className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg bg-white hover:border-gray-400 focus:outline-none "
                                />
                                <ErrorMessage
                                  name={`thirdPartyVehicles.${index}.registration`}
                                  component="div"
                                  className="text-red-500 text-xs mt-1"
                                />
                              </div>
                            </div>
                          )}
                        </Field>

                        {/* Color */}
                        <Field name={`thirdPartyVehicles.${index}.color`}>
                          {({ field }: any) => (
                            <div className="flex flex-col sm:flex-row items-start mt-4">
                              <label className="w-full sm:w-1/4 text-sm font-medium mb-1 sm:mb-0">
                                Color
                              </label>
                              <div className="w-full sm:w-3/4">
                                <input
                                  {...field}
                                  className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg bg-white hover:border-gray-400 focus:outline-none "
                                />
                                <ErrorMessage
                                  name={`thirdPartyVehicles.${index}.color`}
                                  component="div"
                                  className="text-red-500 text-xs mt-1"
                                />
                              </div>
                            </div>
                          )}
                        </Field>

                        {/* Images Available */}
                        <Field
                          name={`thirdPartyVehicles.${index}.imagesAvailable`}
                        >
                          {({ field }: any) => (
                            <div className="flex flex-col sm:flex-row items-start mt-4">
                              <label className="w-full sm:w-1/4 text-sm font-medium mb-1 sm:mb-0">
                                Images Available
                              </label>
                              <div className="w-full sm:w-3/4">
                                <CustomSelect
                                  options={booleanOptions}
                                  value={booleanOptions.find(
                                    (opt) =>
                                      String(opt.value) === String(field.value)
                                  )}
                                  onChange={(opt) =>
                                    setFieldValue(
                                      `thirdPartyVehicles.${index}.imagesAvailable`,
                                      opt?.value === "true"
                                    )
                                  }
                                />
                                <ErrorMessage
                                  name={`thirdPartyVehicles.${index}.imagesAvailable`}
                                  component="div"
                                  className="text-red-500 text-xs mt-1"
                                />
                              </div>
                            </div>
                          )}
                        </Field>
                      </div>
                    ))}
                  </div>
                )}
              </FieldArray>
            </Form>
          )}
        </Formik>
        <UploadCSV5Modal
          isOpen={uploadModal}
          onClose={() => setUploadModal(false)}
          onUpload={handleUpload}
          confirming={confirming}
        />

        <Modal
          open={vehicleModal}
          onClose={() => {
            setVehicleModal(false);
          }}
          classNames={{
            overlay: "custom-overlay",
            modal: "custom-modal",
          }}
          closeIcon={
            <FaTimes size={2} className="text-[#717680] font-normal w-5 h-5" />
          }
        >
          <h2 className="text-[16px] mb-4 text-center">Car Check</h2>
          <hr />
          <iframe
            src="https://www.carcheck.co.uk/"
            width="100%"
            height="700"
            title="Car Check"
            className="border-none"
          ></iframe>
        </Modal>

        <Modal
          open={dvlaModal}
          onClose={() => setDvlaModal(false)}
          classNames={{
            overlay: "custom-overlay",
            modal: "custom-modal",
          }}
          closeIcon={
            <FaTimes size={2} className="text-[#717680] font-normal w-5 h-5" />
          }
        >
          <h2 className="text-[16px] text-center flex-1">DVLA</h2>
          <hr />

          <iframe
            src="https://www.gov.uk/view-driving-licence"
            width="100%"
            height="100%"
            title="Car Check"
            className="border-none"
          ></iframe>
        </Modal>

        <Modal
          open={midModal}
          onClose={() => setMidModal(false)}
          classNames={{
            overlay: "custom-overlay",
            modal: "custom-modal",
          }}
          closeIcon={
            <FaTimes size={2} className="text-[#717680] font-normal w-5 h-5" />
          }
        >
          <h2 className="text-[16px] text-center flex-1">Process MID</h2>
          <hr />
          <iframe
            src="https://www.askmid.com/"
            width="100%"
            height="100%"
            title="Car Check"
            className="border-none"
          ></iframe>
        </Modal>
      </>
    );
  }
);

VehicleDetailsForm.displayName = "VehicleDetailsForm";

export default VehicleDetailsForm;
