import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { Formik, Field, ErrorMessage, Form } from "formik";
import * as Yup from "yup";
import { FaTimes } from "react-icons/fa";
import { ChevronDown, Mail } from "lucide-react";
import CustomSelect from "../ReactSelect/ReactSelect";
import { DatePicker } from "../application/date-picker/date-picker";
import { getLocalTimeZone, today } from "@internationalized/date";
import { CalendarDate } from "@internationalized/date";
import type { DateValue } from "react-aria-components";
import { useParams } from "react-router-dom";
import UploadCSV5Modal from "../VehicleDetailCard/uploadCV5";
import LeafletAutocompleteMap from "../GoogleMapAutoComplete/GoogleMapAutoComplete";
import "react-responsive-modal/styles.css";
import { Modal } from "react-responsive-modal";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";
import PhoneInput from "react-phone-input-2";
import { MdArrowOutward } from "react-icons/md";
import {
  EngineerDetailsApi,
  gettingEnginerDetails,
  instructEngineer,
  udpateEnginerDetails,
  uploadVCEngineer,
} from "../../services/EngineeringDetails/engineeringDetails";
import { debounce } from "lodash";
import {
  setEngineerReportReceived,
  setOcrEngineer,
} from "../../redux/Engineer/engineerSlice";
import { useDispatch } from "react-redux";
import { getCompanySuggestions } from "../../services/Referrer/Referrer";
import { parseCalendarDate } from "../../common/common";
import {
  checkStatusJob,
  fetchJobResultCall,
} from "../../services/Vehicle/Vehicle";

// Type definitions
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

interface EngineerDetailsFormProps {
  claimData?: any;
  isEditMode?: boolean;
  handleNext?: (step: number, direction: string) => void;
  skipNext: boolean;
}

interface Company {
  id: number;
  company_name: string;
}

const booleanOptions = [
  { value: "true", label: "Yes" },
  { value: "false", label: "No" },
];

const EngineerDetails = forwardRef(
  ({ handleNext, skipNext }: EngineerDetailsFormProps, ref) => {
    const { id } = useParams();
    const searchParams = new URLSearchParams(window.location.search);
    const claimID = searchParams.get("claimid");
    const dispatch = useDispatch();
    const engineer_report_received = useSelector(
      (state: any) => state?.engineer?.engineer_report_received
    );

    const [uploadModal, setUploadModal] = useState(false);
    const [vehicleModal, setVehicleModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [dvlaModal, setDvlaModal] = useState(false);
    const [midModal, setMidModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [confirming, setConfirming] = useState(false);
    const [suggestions, setSuggestions] = useState<Company[]>([]);
    const [loadingSuggestions, setLoadingSuggestions] = useState(false);
    const [typing, setTyping] = useState(false);
    const [data, setData] = useState<any>(null);
    const [instructing, setInstructing] = useState<any>(false);

    const now = today(getLocalTimeZone());

    const [invoiceReceivedOn, setInvoiceReceivedOn] =
      useState<DateValue | null>(null);
    const [invoicePaidOn, setInvoicePaidOn] = useState<DateValue | null>(null);
    const [invoiceSettledOn, setInvoiceSettledOn] = useState<DateValue | null>(
      null
    );
    const [engineerInstructed, setEngineerInstructed] =
      useState<DateValue | null>(null);
    const [inspectionDate, setInspectionDate] = useState<DateValue | null>(
      null
    );
    const [engineerReportReceivedDate, setEngineerReportReceivedDate] =
      useState<DateValue | null>(null);

    const { isClosed, selectedPosition } = useSelector(
      (state: any) => state.isClosed
    );

    const formikRef = useRef<any>(null);

    const [initialValues, setInitialValues] = useState({
      companyName: "",
      vehicle_payment_beneficiary: "",
      reference: "",
      currency: "GBP",
      actual_fee: "",
      invoice_received_on: "",
      invoice_paid_on: "",
      invoice_settled_on: "",
      invoice_settled_amount: "",
      engineer_report_received: false,
      engineer_instructed: "",
      inspection_date: "",
      engineer_report_received_date: "",
      engineer_fee: "",
      site: "",
      engineer_address: {
        address: "",
        postcode: "",
        landline_tel: "",
        mobile_tel: "",
        email: "",
      },
      vehicle_address: {
        address: "",
        postcode: "",
        mobile_tel: "",
        email: "",
      },
    });

    // Validation schema
    const validationSchema = Yup.object({});

    useEffect(() => {
      fetchDetails();
    }, []);

    useEffect(() => {
      window.scrollTo(0, 0);
    }, []);

    const fetchDetails = async () => {
      try {
        const res = await gettingEnginerDetails(claimID || id);
        const mappedValues = {
          companyName: res.companyName || "",
          vehicle_payment_beneficiary: res.vehicle_payment_beneficiary || "",
          reference: res.reference || "",
          currency: res.currency || "GBP",
          actual_fee: res.actual_fee || "",
          invoice_received_on: res.invoice_received_on || "",
          invoice_paid_on: res.invoice_paid_on || "",
          invoice_settled_on: res.invoice_settled_on || "",
          invoice_settled_amount: res.invoice_settled_amount || "",
          engineer_report_received: res.engineer_report_received || false,
          engineer_instructed: res.engineer_instructed || "",
          inspection_date: res.inspection_date || "",
          engineer_report_received_date:
            res.engineer_report_received_date || "",
          engineer_fee: res.engineer_fee || "",
          site: res.site || "",
          engineer_address: {
            address: res.engineer_address?.address || "",
            postcode: res.engineer_address?.postcode || "",
            landline_tel: res.engineer_address?.landline_tel || "",
            mobile_tel: res.engineer_address?.mobile_tel || "",
            email: res.engineer_address?.email || "",
          },
          vehicle_address: {
            address: res.vehicle_address?.address || "",
            postcode: res.vehicle_address?.postcode || "",
            mobile_tel: res.vehicle_address?.mobile_tel || "",
            email: res.vehicle_address?.email || "",
          },
        };

        setInvoiceReceivedOn(parseCalendarDate(res.invoice_received_on));
        setInvoicePaidOn(parseCalendarDate(res.invoice_paid_on));
        setInvoiceSettledOn(parseCalendarDate(res.invoice_settled_on));
        setEngineerInstructed(parseCalendarDate(res.engineer_instructed));
        setInspectionDate(parseCalendarDate(res.inspection_date));
        setEngineerReportReceivedDate(
          parseCalendarDate(res.engineer_report_received_date)
        );
        setInitialValues(mappedValues);
        setIsEditing(true);
      } catch (e) {
        console.error("Failed to fetch details:", e);
        setIsEditing(false);
      }
    };

    // const formatCalendarDate = (date?: CalendarDate) => {
    //   if (!date) return undefined;
    //   const jsDate = new Date(date.year, date.month - 1, date.day);
    //   return jsDate.toISOString().split("T")[0];
    // };
    const formatCalendarDate = (date?: CalendarDate) => {
      if (!date) return undefined;

      const jsDate = new Date(Date.UTC(date.year, date.month - 1, date.day));

      const year = jsDate.getUTCFullYear();
      const month = String(jsDate.getUTCMonth() + 1).padStart(2, "0");
      const day = String(jsDate.getUTCDate()).padStart(2, "0");

      return `${year}-${month}-${day}`;
    };

    const fetchSuggestions = debounce(async (query: string) => {
      if (!query) {
        setSuggestions([]);
        return;
      }
      setLoadingSuggestions(true);
      try {
        const response = await getCompanySuggestions(query);
        const rawSuggestions = response.data || response;
        const uniqueByCompany = rawSuggestions.filter(
          (item: any, index: number, self: any[]) =>
            index ===
            self.findIndex(
              (s) =>
                s.company_name?.toLowerCase() ===
                item.company_name?.toLowerCase()
            )
        );
        setSuggestions(uniqueByCompany);
      } catch (error) {
        console.error("Failed to fetch company suggestions:", error);
        setSuggestions([]);
      } finally {
        setLoadingSuggestions(false);
      }
    }, 300);

    useEffect(() => {
      if (id || claimID) {
        const fetchOwner = async () => {
          try {
            const EnginerDetails = await gettingEnginerDetails(id || claimID);
            setData(EnginerDetails);
            handleSetInitialValues(EnginerDetails);
          } catch (err) {
            console.error("Error fetching vehicle owner details:", err);
          }
        };
        fetchOwner();
      } else {
        console.warn(
          "⚠️ No id found in route params. Check your <Route path> definition."
        );
      }
    }, [id]);

    const handleSubmit = async (values: any) => {
      const storedClaimId = id || claimID;
      try {
        const payload = {
          company_name: values.companyName,
          vehicle_payment_beneficiary: values.vehicle_payment_beneficiary,
          reference: values.reference,
          currency: values.currency,
          actual_fee: Number(values.actual_fee),
          invoice_received_on: formatCalendarDate(invoiceReceivedOn),
          invoice_paid_on: formatCalendarDate(invoicePaidOn),
          invoice_settled_on: formatCalendarDate(invoiceSettledOn),
          invoice_settled_amount: Number(values.invoice_settled_amount),
          engineer_report_received: engineer_report_received === true,
          engineer_instructed: formatCalendarDate(engineerInstructed),
          inspection_date: formatCalendarDate(inspectionDate),
          engineer_report_received_date: formatCalendarDate(
            engineerReportReceivedDate
          ),
          engineer_fee: Number(values.engineer_fee),
          site: values.site,
          claim_id: storedClaimId,
          engineer_address: {
            address: values.engineer_address.address,
            postcode: values.engineer_address.postcode,
            mobile_tel: values.engineer_address.landline_tel,
            email: values.engineer_address.email,
          },
          vehicle_address: {
            address: values.vehicle_address.address,
            postcode: values.vehicle_address.postcode,
            mobile_tel: values.vehicle_address.mobile_tel,
            email: values.vehicle_address.email,
          },
        };

        if ((claimID || id) && isEditing === true) {
          await udpateEnginerDetails(payload, claimID || id);
          toast.success("Engineer Details saved successfully");
        } else {
          await EngineerDetailsApi.createEngineerDetails(payload);
          toast.success("Engineer Details saved successfully");
        }
        setTimeout(() => {
          const navigateValue = localStorage.getItem("navigate");
          if (navigateValue !== "true") {
            if (engineer_report_received === true) {
              handleNext(8, "next");
            } else {
              handleNext(10, "next");
            }
          } else {
            return;
          }
        }, 100);
      } catch (e) {
        toast.error("Unable to save engineer details");
      }
    };

    useImperativeHandle(ref, () => ({
      submitForm: async () => {
        if (!formikRef.current) {
          throw new Error("Formik instance not available");
        }
        await formikRef.current.submitForm();
        return true;
      },
    }));

    const handleSetInitialValues = (response: any) => {
      const EngineerDetails = response;
      dispatch(
        setEngineerReportReceived(EngineerDetails.engineer_report_received)
      );
      setInitialValues((prev) => ({
        ...prev,
        companyName: EngineerDetails.company_name || "",
        vehicle_payment_beneficiary:
          EngineerDetails.vehicle_payment_beneficiary || "",
        reference: EngineerDetails.reference || "",
        currency: EngineerDetails.currency || "GBP",
        actual_fee: EngineerDetails.actual_fee || "",
        invoice_received_on: EngineerDetails.invoice_received_on || "",
        invoice_paid_on: EngineerDetails.invoice_paid_on || "",
        invoice_settled_on: EngineerDetails.invoice_settled_on || "",
        invoice_settled_amount: EngineerDetails.invoice_settled_amount || "",
        engineer_report_received: engineer_report_received || false,
        engineer_instructed: EngineerDetails.engineer_instructed || "",
        inspection_date: EngineerDetails.inspection_date || "",
        engineer_report_received_date:
          EngineerDetails.engineer_report_received_date || "",
        engineer_fee: EngineerDetails.engineer_fee || "",
        site: EngineerDetails.site || "",
        claim_id: EngineerDetails.claim_id || "",
        tenant_id: EngineerDetails.tenant_id || "",
        engineer_address: {
          address: EngineerDetails.engineer_address?.address || "",
          postcode: EngineerDetails.engineer_address?.postcode || "",
          landline_tel: EngineerDetails.engineer_address?.mobile_tel || "",
          mobile_tel: EngineerDetails.engineer_address?.mobile_tel || "",
          email: EngineerDetails.engineer_address?.email || "",
          id: EngineerDetails.engineer_address?.id || "",
        },
        vehicle_address: {
          address: EngineerDetails.vehicle_address?.address || "",
          postcode: EngineerDetails.vehicle_address?.postcode || "",
          mobile_tel: EngineerDetails.vehicle_address?.mobile_tel || "",
          email: EngineerDetails.vehicle_address?.email || "",
          id: EngineerDetails.vehicle_address?.id || "",
        },
      }));
    };

    const parseDateInspection = (dateStr?: string) => {
      if (!dateStr) return undefined;
      const [day, month, year] = dateStr.split("-").map(Number);
      return new CalendarDate(year, month, day);
    };

    const handleUpload = async (uploadedFiles: any) => {
      setConfirming(true);
      try {
        const response = await uploadVCEngineer(uploadedFiles, id || claimID);
        const jobId = response?.job_id;
        // NOTE: We set loading true, but we DO NOT unmount the form in the JSX anymore
        setLoading(true);

        if (!jobId) {
          toast.error("No job ID returned from upload");
          setConfirming(false);
          setLoading(false);
          return;
        }

        setUploadModal(false);
        toast.success("File uploaded successfully, processing...");

        await pollJobStatus(jobId);
      } catch (e) {
        console.error(e);
        toast.error("Unable to upload file");
        setLoading(false);
      } finally {
        setConfirming(false);
      }
    };

    const pollJobStatus = async (jobId: string) => {
      const POLL_INTERVAL = 3000;
      const MAX_ATTEMPTS = 40;

      for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
        try {
          const res = await checkStatusJob(jobId);
          if (res.status === "completed") {
            await fetchJobResult(jobId);
            return;
          }

          if (res.status === "failed") {
            toast.error(data.error || "Import job failed");
            setLoading(false);
            return;
          }

          await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL));
        } catch (err) {
          console.error("Error checking job status:", err);
          toast.error("Error checking job status");
          setLoading(false);
          return;
        }
      }

      toast.error("Timed out waiting for job completion");
      setLoading(false);
    };

    const fetchJobResult = async (jobId: string) => {
      try {
        const res = await fetchJobResultCall(jobId);
        if (res.status === "completed") {
          const engineerDetail = res.result?.engineer_detail[0];

          if (!engineerDetail) {
            toast.error("No engineer details found in result");
            return;
          }

          dispatch(setOcrEngineer(engineerDetail));

          const inspectionDate = parseDateInspection(
            engineerDetail.inspection_date
          );
          const receivedDate = parseDateInspection(
            engineerDetail.engineer_report_received_date
          );
          const instructedDate = parseDateInspection(
            engineerDetail.engineer_instructed
          );

          // FIX: Use setFieldValue to update Formik without resetting the form (avoiding setInitialValues)
          if (formikRef.current) {
            formikRef.current.setFieldValue("inspection_date", inspectionDate);
            formikRef.current.setFieldValue(
              "engineer_instructed",
              instructedDate
            );
            formikRef.current.setFieldValue(
              "engineer_report_received_date",
              receivedDate
            );
            formikRef.current.setFieldValue(
              "engineer_fee",
              engineerDetail.engineer_fee
            );
          }

          // Update local state for DatePickers
          setInspectionDate(inspectionDate);
          setEngineerReportReceivedDate(receivedDate);
          setEngineerInstructed(instructedDate);

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

    const handleInstructEngineer = async (values: any) => {
      setInstructing(true);
      try {
        const payload = {
          email: values.engineer_address.email,
          company: values.companyName,
          address: values.engineer_address.address,
          postCode: values.engineer_address.postcode,
          location: values.vehicle_address.address,
        };
        await instructEngineer(payload, id || claimID);
        toast.success("Email sent with instructions");
      } catch (e) {
        toast.error("Unable to send email");
      } finally {
        setInstructing(false);
      }
    };

    const handleRadioChange = (value: boolean) => {
      dispatch(setEngineerReportReceived(value));
    };

    const checkRequiredFields = (values: object) => {
      return (
        values.companyName &&
        values.engineer_address.address &&
        values.engineer_address.postcode &&
        values.engineer_address.landline_tel &&
        values.engineer_address.email &&
        values.vehicle_payment_beneficiary &&
        values.reference &&
        values.vehicle_address?.address
      );
    };

    const formatToTwoDecimals = (value: string): string => {
      if (value === "" || value === null || value === undefined) return "";

      const num = parseFloat(value);
      if (isNaN(num)) return value;

      return num.toFixed(2);
    };

    return (
      <>
        {/* FIX: Loading Overlay instead of replacing the entire component */}
        {loading && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-50 z-[9999] flex justify-center items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        )}

        <Formik
          innerRef={formikRef}
          initialValues={initialValues}
          validationSchema={validationSchema}
          enableReinitialize
          onSubmit={handleSubmit}
        >
          {({ values, setFieldValue, handleBlur }) => {
            const handleNumberBlur = (
              e: React.FocusEvent<HTMLInputElement>,
              fieldName: string
            ) => {
              const value = e.target.value;
              if (value) {
                const formatted = formatToTwoDecimals(value);
                setFieldValue(fieldName, formatted);
              }
              handleBlur(e);
            };
            const handleSelect = (company: Company) => {
              const newValues = {
                address: company.address || "",
                companyName: company.company_name || "",
                email: company.contact_email || "",
                contactName: company.contact_name || "",
                contactTelephone: company.contact_number || "",
                postcode: company.postcode || "",
                telephoneMain: company.primary_contact_number || "",
              };

              const engineerAddress = {
                address: company.address || "",
                postcode: company.postcode || "",
                landline_tel: company.contact_number || "",
                email: company.contact_email || "",
              };

              Object.entries(newValues).forEach(([key, value]) => {
                setFieldValue(key, value);
              });

              setInitialValues((prev) => ({
                ...prev,
                engineer_address: engineerAddress,
                ...newValues,
              }));

              setSuggestions([]);
              setTyping(false);
            };

            return (
              <Form className="bg-white p-0 mt-10">
                <div className="flex justify-between items-center">
                  <div>
                    <h1 className="text-lg font-weight-600  mb-2 sm:text-xl">
                      Engineer Details
                    </h1>
                    <p className="text-sm text-gray-600 mb-4 sm:text-sm sm:mb-6">
                      Enter the client vehicle details below.
                    </p>
                  </div>
                  <div className="flex gap-4 items-center">
                    <button
                      type="button"
                      disabled={!checkRequiredFields(values)}
                      onClick={() => {
                        handleInstructEngineer(values);
                      }}
                      className={`${
                        !checkRequiredFields(values)
                          ? "cursor-not-allowed"
                          : "cursor-pointer hover:bg-gray-100"
                      } px-4 py-2 bg-white-600 text-gray-800 rounded-lg  focus:outline-none border focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors`}
                    >
                      {instructing ? "Sending Email" : "Instruct Engineer"}
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="w-[100%]">
                    <Field name="companyName">
                      {({ field, form, meta }: any) => (
                        <div
                          className="flex flex-col mt-2 sm:flex-row sm:items-center"
                          style={{ height: "100px" }}
                        >
                          <label className="w-full sm:w-1/4 text-sm font-medium text-gray-700">
                            Company Name
                          </label>
                          <div className="w-full ml-2 sm:w-3/4 relative">
                            <input
                              type="text"
                              {...field}
                              onChange={(e) => {
                                const value = e.target.value;
                                field.onChange(e);
                                fetchSuggestions(value);
                                setTyping(!!value);
                              }}
                              onFocus={() => {
                                if (field.value && !suggestions.length) {
                                  fetchSuggestions(field.value);
                                }
                                setTyping(!!field.value);
                              }}
                              onBlur={() => {
                                // close suggestions reliably
                                setTimeout(() => {
                                  setSuggestions([]);
                                  setTyping(false);
                                }, 150);
                              }}
                              placeholder="Type company name"
                              disabled={isClosed}
                              className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg bg-white hover:border-gray-400 focus:outline-none text-sm sm:text-base"
                              style={{ height: "44px" }}
                            />

                            {/* Custom Suggestions Dropdown */}
                            {suggestions.length > 0 && typing && (
                              <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
                                {loadingSuggestions ? (
                                  <div className="px-4 py-3 text-gray-400 text-sm">
                                    Loading...
                                  </div>
                                ) : (
                                  suggestions.map((company) => (
                                    <div
                                      key={company.id}
                                      className="px-4 py-3 cursor-pointer border-b border-gray-100 last:border-b-0 hover:bg-[#252B37] transition-colors duration-150 group"
                                      onMouseDown={(e) => {
                                        e.preventDefault();
                                        form.setFieldValue(
                                          "companyName",
                                          company.company_name || ""
                                        );
                                        handleSelect(company);
                                        setSuggestions([]);
                                        setTyping(false);
                                      }}
                                    >
                                      <div className="font-medium text-gray-900 group-hover:text-white">
                                        {company.company_name}
                                      </div>
                                      {company.address && (
                                        <div className="text-sm text-gray-600 truncate group-hover:text-white">
                                          {company.address}
                                        </div>
                                      )}
                                    </div>
                                  ))
                                )}
                              </div>
                            )}

                            {meta.touched && meta.error && (
                              <div className="text-red-500 text-xs mt-1">
                                {meta.error}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </Field>

                    <div className="flex flex-col sm:flex-row sm:items-start gap-2 mb-4">
                      <label className="w-full sm:w-1/4 text-sm font-medium text-gray-700">
                        Address
                      </label>
                      <div className="w-full sm:w-3/4">
                        <LeafletAutocompleteMap
                          showMap={false}
                          apiKey={import.meta.env.VITE_GOOGLE_MAP_KEY}
                          address={initialValues.engineer_address.address}
                          onPlaceSelected={(place) => {
                            if (place.name) {
                              setFieldValue(
                                "engineer_address.address",
                                place.address
                              );
                              setFieldValue(
                                "engineer_address.postcode",
                                place?.postalCode
                              );
                            }
                          }}
                          disabled={isClosed}
                        />
                        <ErrorMessage
                          name="engineer_address.address"
                          component="div"
                          className="text-red-500 text-xs mt-1"
                        />
                      </div>
                    </div>
                    {/* ... Rest of the form components remain identical ... */}
                    {/* ... (Including all fields, dates, etc.) ... */}
                    {/* Ensure you copy the rest of the form JSX here just like before */}

                    {/* For brevity in the solution block, the rest of the JSX structure is identical to your original code. 
                        The critical changes were removing the early return for `loading` and adding the overlay above. */}

                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-4">
                      <label className="w-full sm:w-1/4 text-sm font-medium text-gray-700">
                        Postcode
                      </label>
                      <div className="relative w-full sm:w-3/4">
                        <Field
                          name="engineer_address.postcode"
                          type="text"
                          style={{ height: "44px" }}
                          disabled={isClosed}
                          className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg bg-white hover:border-gray-400 focus:outline-none  text-sm sm:text-base"
                        />
                        <ErrorMessage
                          name="engineer_address.postcode"
                          component="div"
                          className="text-red-500 text-xs mt-1"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-4 sm:mb-6">
                      <label className="w-full sm:w-1/4 text-sm font-medium text-gray-700">
                        Telephone
                      </label>
                      <div className="w-full sm:w-3/4">
                        <Field name="engineer_address.landline_tel">
                          {({ field, form, meta }: any) => (
                            <div className="w-full">
                              <PhoneInput
                                country="gb"
                                value={field.value}
                                placeholder="+44"
                                onChange={(value) =>
                                  form.setFieldValue(field.name, value)
                                }
                                inputStyle={{
                                  width: "100%",
                                  height: "44px",
                                  fontSize: "16px",
                                }}
                                containerStyle={{
                                  width: "100%",
                                }}
                                disabled={isClosed}
                              />
                              {meta.touched && meta.error && (
                                <div className="text-red-500 text-xs mt-1">
                                  {meta.error}
                                </div>
                              )}
                            </div>
                          )}
                        </Field>
                      </div>
                    </div>

                    <div className="flex flex-col mt-4 sm:flex-row sm:items-center gap-2 mb-6 sm:mb-2">
                      <label className="w-full sm:w-1/4 text-sm font-medium text-gray-700">
                        Email
                      </label>
                      <div className="relative w-full sm:w-3/4">
                        <Field
                          type="email"
                          name="engineer_address.email"
                          disabled={isClosed}
                          className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg bg-white hover:border-gray-400 focus:ring-2 focus:ring-custom-200 focus:outline-none  text-sm sm:text-base"
                        />
                        <div className="absolute right-3 top-[22px] transform -translate-y-1/2 text-gray-500">
                          <Mail className="h-4 w-4" />
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col mt-4 sm:flex-row sm:items-center gap-2 mb-6 sm:mb-2">
                      <label className="w-full sm:w-1/4 text-sm font-medium text-gray-700">
                        Vehicle Payment Beneficiary
                      </label>
                      <div className="relative w-full sm:w-3/4">
                        <Field
                          type="text"
                          name="vehicle_payment_beneficiary"
                          disabled={isClosed}
                          placeholder="Enter beneficiary name"
                          className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg bg-white hover:border-gray-400 focus:ring-2 focus:ring-custom-200 focus:outline-none  text-sm sm:text-base"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col mt-4 sm:flex-row sm:items-center gap-2 mb-6 sm:mb-2">
                      <label className="w-full sm:w-1/4 text-sm font-medium text-gray-700">
                        Reference
                      </label>
                      <div className="relative w-full sm:w-3/4">
                        <Field
                          type="text"
                          name="reference"
                          disabled={isClosed}
                          placeholder="Enter Reference Number"
                          className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg bg-white hover:border-gray-400 focus:ring-2 focus:ring-custom-200 focus:outline-none  text-sm sm:text-base"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <hr className="mb-4 sm:mb-6 mt-6" />

                <h1 className="text-lg font-weight-600 text-gray-900 mb-2">
                  Vehicle Location
                </h1>
                <p className="text-sm text-gray-600 mb-4 sm:text-sm sm:mb-6">
                  Enter the borough details below.
                </p>

                <div className="flex flex-col mt-4 sm:flex-row sm:items-center gap-2 mb-6 sm:mb-2">
                  <label className="w-full sm:w-1/4 text-sm font-medium text-gray-700">
                    Site
                  </label>
                  <div className="relative w-full sm:w-3/4">
                    <Field
                      type="text"
                      name="site"
                      disabled={isClosed}
                      placeholder=""
                      className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg bg-white hover:border-gray-400 focus:ring-2 focus:ring-custom-200 focus:outline-none  text-sm sm:text-base"
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-start gap-2 mb-4 mt-7">
                  <label className="w-full sm:w-1/4 text-sm font-medium text-gray-700">
                    Address
                  </label>
                  <div className="w-full sm:w-3/4">
                    <LeafletAutocompleteMap
                      showMap={false}
                      apiKey={import.meta.env.VITE_GOOGLE_MAP_KEY}
                      address={initialValues.vehicle_address.address}
                      onPlaceSelected={(place) => {
                        if (place.name) {
                          setFieldValue(
                            "vehicle_address.address",
                            place.address
                          );
                          setFieldValue(
                            "vehicle_address.postcode",
                            place?.postalCode
                          );
                        }
                      }}
                      disabled={isClosed}
                    />
                    <ErrorMessage
                      name="vehicle_address.address"
                      component="div"
                      className="text-red-500 text-xs mt-1"
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-4">
                  <label className="w-full sm:w-1/4 text-sm font-medium text-gray-700">
                    Postcode
                  </label>
                  <div className="relative w-full sm:w-3/4">
                    <Field
                      name="vehicle_address.postcode"
                      type="text"
                      style={{ height: "44px" }}
                      disabled={isClosed}
                      className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg bg-white hover:border-gray-400 focus:outline-none  text-sm sm:text-base"
                    />
                    <ErrorMessage
                      name="vehicle_address.postcode"
                      component="div"
                      className="text-red-500 text-xs mt-1"
                    />
                  </div>
                </div>

                <hr className="mb-4 sm:mb-6 mt-8" />

                <div className="w-[98%] bg-white border-b border-gray-200 mb-6">
                  <div className="border-b border-gray-200">
                    <h2 className="text-lg font-weight-600 text-gray-900 mb-2">
                      Engineer Fees
                    </h2>
                    <p className="text-sm mb-2 text-gray-600">
                      Enter engineer fees details
                    </p>
                  </div>

                  <div className="py-6 w-[102%]">
                    <div className="grid gap-8">
                      <div>
                        <div className="flex flex-col sm:flex-row sm:items-start gap-2 mb-4">
                          <label className="w-full mr-4 sm:w-1/4 text-sm font-medium text-gray-700">
                            Actual Fee
                          </label>
                          <div className="flex flex-col sm:flex-row w-full sm:w-3/4 gap-2">
                            <div className="flex flex-1 border border-gray-300 rounded-lg bg-white h-10 sm:h-12">
                              <div className="flex items-center px-2 sm:px-3 rounded-lg">
                                <span className="text-sm sm:text-base">£</span>
                              </div>
                              <Field
                                name="actual_fee"
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                style={{ height: "44px" }}
                                disabled={isClosed}
                                className="flex-1 p-2 sm:p-3 text-sm sm:text-base focus:outline-none"
                                onBlur={(
                                  e: React.FocusEvent<HTMLInputElement>
                                ) => handleNumberBlur(e, "actual_fee")}
                              />
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-start gap-2 mb-4">
                          <label className="w-1/4 mr-8 text-sm font-medium text-gray-700">
                            Invoice Received On
                          </label>
                          <div className="w-[81%]">
                            <Field name="invoice_received_on">
                              {({ field, form }: any) => (
                                <DatePicker
                                  isDisabled={isClosed}
                                  value={invoiceReceivedOn}
                                  onChange={setInvoiceReceivedOn}
                                  className="mt-1 z-50"
                                />
                              )}
                            </Field>
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-start gap-2 mb-4">
                          <label className="w-1/4 mr-8 text-sm font-medium text-gray-700">
                            Invoice Paid On
                          </label>
                          <div className="w-[81%]">
                            <Field name="invoice_paid_on">
                              {({ field, form }: any) => (
                                <DatePicker
                                  isDisabled={isClosed}
                                  value={invoicePaidOn}
                                  onChange={setInvoicePaidOn}
                                  className="mt-1 z-50"
                                />
                              )}
                            </Field>
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-start gap-2 mb-4">
                          <label className="w-1/4 mr-8 text-sm font-medium text-gray-700">
                            Invoice Settled On
                          </label>
                          <div className="w-[81%]">
                            <Field name="invoice_settled_on">
                              {({ field, form }: any) => (
                                <DatePicker
                                  isDisabled={isClosed}
                                  value={invoiceSettledOn}
                                  onChange={setInvoiceSettledOn}
                                  className="mt-1 z-50"
                                />
                              )}
                            </Field>
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-start mb-4">
                          <label className="w-full sm:w-1/4 mr-4 text-sm font-medium text-gray-700">
                            Invoice Settled Amount
                          </label>
                          <div className="flex flex-col sm:flex-row w-full sm:w-3/4 gap-2">
                            <div className="flex flex-1 border border-gray-300 rounded-lg bg-white h-10 sm:h-12">
                              <div className="flex items-center px-2 sm:px-3 rounded-lg">
                                <span className="text-sm sm:text-base">£</span>
                              </div>
                              <Field
                                name="invoice_settled_amount"
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                style={{ height: "44px" }}
                                disabled={isClosed}
                                className="flex-1 p-2 sm:p-3 text-sm sm:text-base focus:outline-none"
                                onBlur={(
                                  e: React.FocusEvent<HTMLInputElement>
                                ) =>
                                  handleNumberBlur(e, "invoice_settled_amount")
                                }
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between w-full">
                    <div>
                      <h1 className="text-lg font-weight-600 text-gray-900 mb-2">
                        Engineer Report & Instructions Details
                      </h1>
                      <p className="text-sm text-gray-600 mb-4 sm:text-sm sm:mb-6">
                        Enter the third party vehicle details below.
                      </p>
                    </div>
                    <div>
                      <button
                        type="button"
                        onClick={() => setUploadModal(true)}
                        className="px-4 ml-96 py-2 bg-white-600 text-gray-800 rounded-lg hover:bg-gray-100 focus:outline-none border focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
                      >
                        Upload Report
                      </button>
                    </div>
                  </div>

                  <hr />

                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-4 sm:mb-6 mt-7">
                    <label className="w-full sm:w-1/4 text-sm font-medium text-gray-700">
                      Engineer Report Received?
                    </label>
                    <div className="w-full sm:w-3/4 flex gap-4 ml-4">
                      <label className="flex items-center">
                        <Field
                          type="radio"
                          name="engineer_report_received"
                          value="true"
                          checked={engineer_report_received === true}
                          onChange={() => handleRadioChange(true)}
                          disabled={isClosed}
                          className="w-4 h-4 accent-[#414651] border-gray-300 focus:ring-custom-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">Yes</span>
                      </label>
                      <label className="flex items-center">
                        <Field
                          type="radio"
                          name="engineer_report_received"
                          value="false"
                          checked={engineer_report_received === false}
                          onChange={() => handleRadioChange(false)}
                          disabled={isClosed}
                          className="w-4 h-4 accent-[#414651] border-gray-300 focus:ring-custom-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">No</span>
                      </label>
                    </div>
                  </div>
                  {engineer_report_received === true ? (
                    <div className="flex justify-start ml-72">
                      <div
                        className="flex cursor-pointer"
                        onClick={() => {
                          if (handleNext) {
                            handleNext(8, "next");
                          }
                        }}
                      >
                        <h2 className="text-sm cursor-pointer mb-4 font-weight-600 text-[#414651]">
                          Repair Costs & Route Details
                        </h2>
                        <MdArrowOutward className="text-[#414651] mt-[3px] ml-1" />
                      </div>
                      <div
                        className="flex cursor-pointer ml-4"
                        onClick={() => {
                          if (handleNext) {
                            handleSubmit(values);
                            localStorage.setItem("navigate", "true");
                            handleNext(9, "sideBar");
                          }
                        }}
                      >
                        <h2 className="text-sm cursor-pointer mb-4 font-weight-600 text-[#414651]">
                          Total Loss Details
                        </h2>
                        <MdArrowOutward className="text-[#414651] mt-[3px] ml-1" />
                      </div>
                    </div>
                  ) : null}

                  <div className="flex flex-col sm:flex-row sm:items-start gap-2 mb-4">
                    <label className="w-1/4 mr-8 text-sm font-medium text-gray-700">
                      Engineer Instructed
                    </label>
                    <div className="w-[81%]">
                      <Field name="engineer_instructed">
                        {({ field, form }: any) => (
                          <DatePicker
                            isDisabled={isClosed}
                            value={engineerInstructed}
                            onChange={setEngineerInstructed}
                            className="mt-1 z-50"
                          />
                        )}
                      </Field>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-start gap-2 mb-4">
                    <label className="w-1/4 mr-8 text-sm font-medium text-gray-700">
                      Inspection Date
                    </label>
                    <div className="w-[81%]">
                      <Field name="inspection_date">
                        {({ field, form }: any) => (
                          <DatePicker
                            isDisabled={isClosed}
                            value={inspectionDate}
                            onChange={(date: Date) => {
                              setInspectionDate(date);
                              form.setFieldValue("inspection_date", date);
                            }}
                            className="mt-1 z-50"
                          />
                        )}
                      </Field>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-start gap-2 mb-4">
                    <label className="w-1/4 mr-8 text-sm font-medium text-gray-700">
                      Engineer’s Report Received
                    </label>
                    <div className="w-[81%]">
                      <Field name="engineer_report_received_date">
                        {({ field, form }: any) => (
                          <DatePicker
                            isDisabled={isClosed}
                            value={engineerReportReceivedDate}
                            onChange={setEngineerReportReceivedDate}
                            className="mt-1 z-50"
                          />
                        )}
                      </Field>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-start mb-4">
                    <label className="w-full sm:w-1/4 mr-4 text-sm font-medium text-gray-700">
                      Engineer’s Fee
                    </label>
                    <div className="flex flex-col sm:flex-row w-full sm:w-3/4 gap-2">
                      <div className="flex flex-1 border border-gray-300 rounded-lg bg-white h-10 sm:h-12">
                        <div className="flex items-center px-2 sm:px-3 rounded-lg">
                          <span className="text-sm sm:text-base">£</span>
                        </div>
                        <Field
                          name="engineer_fee"
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          style={{ height: "44px" }}
                          disabled={isClosed}
                          className="flex-1 p-2 sm:p-3 text-sm sm:text-base focus:outline-none"
                          onBlur={(e: React.FocusEvent<HTMLInputElement>) =>
                            handleNumberBlur(e, "engineer_fee")
                          }
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </Form>
            );
          }}
        </Formik>
        <UploadCSV5Modal
          isOpen={uploadModal}
          onClose={() => setUploadModal(false)}
          onUpload={handleUpload}
          confirming={confirming}
           title="Upload Engineer Report"
           description="Upload and attach files to this project"
        />

        <Modal
          open={vehicleModal}
          onClose={() => setVehicleModal(false)}
          classNames={{ overlay: "custom-overlay", modal: "custom-modal" }}
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
          classNames={{ overlay: "custom-overlay", modal: "custom-modal" }}
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
          classNames={{ overlay: "custom-overlay", modal: "custom-modal" }}
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
EngineerDetails.displayName = "EngineerDetails";
export default EngineerDetails;
