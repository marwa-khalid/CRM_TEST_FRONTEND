import "react-phone-input-2/lib/style.css";
import PhoneInput from "react-phone-input-2";
import Label from "../common/label";
import TopRightIcon from "../common/top-right-icon";
import GoogleMapAutocomplete from "../GoogleMapAutoComplete/GoogleMapAutoComplete";
import CustomSelect from "../ReactSelect/ReactSelect";
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { getLocalTimeZone, today } from "@internationalized/date";
import { ErrorMessage, Field, Formik } from "formik";
import { useParams } from "react-router-dom";
import { config } from "../../../config";
import { DatePicker } from "../application/date-picker/date-picker";
import { debounce } from "lodash";
import { getCompanySuggestions } from "../../services/Referrer/Referrer";
import { useSelector } from "react-redux";
import type { DateValue } from "react-aria-components";
import {
  createPanelSolicitors,
  getPanelSolicitorDetails,
  updatePanelSolicitors,
  sendEmailToPanelSolicitor,
  sendAcceptanceEmailToPanelSolicitor,
} from "../../services/PanelSolicitorDetails/PanelSolicitorDetails";
import { toast } from "react-toastify";
import * as Yup from "yup";
import { DateInput } from "../application/date-picker/date-input";
import { parseCalendarDate } from "../../common/common";
import { Mail } from "lucide-react";

const validationSchema = Yup.object().shape({
  // company_name: Yup.string().required("Company name is required"),
  // reference: Yup.string().required("Reference is required"),
  // recommendation_sent: Yup.mixed(),
  // note: Yup.string().required("Note is required"),
  // claim_id: Yup.number().required("Claim ID is required"),
  // email_sent_date: Yup.string().nullable(),   // not required
  // accepted_sent_date: Yup.string().nullable(), // not required
  // address: Yup.object().shape({
  //   address: Yup.string().required("Address is required"),
  //   postcode: Yup.string().required("Postcode is required"),
  //   mobile_tel: Yup.string().required("Mobile number is required"),
  //   email: Yup.string()
  //     .email("Invalid email format")
  //     .required("Email is required"),
  // }),
});

export interface PanelSolicitorDetailsProps {
  claimData?: any;
  isEditMode?: boolean;
  onSuccess?: () => void;
  handleNext?: (step: number, direction: string) => void;
  skipNext: boolean;
}
export interface Address {
  address: string;
  postcode: string;
  mobile_tel: string;
  email: string;
}

export interface Company {
  company_name: string;
  reference: string;
  recommendation_sent: string;
  note: string;
  claim_id: number;
  email_sent_date: string;
  accepted_sent_date: string;
  address: Address;
}

const PanelSolicitorDetails = forwardRef(
  ({ handleNext, skipNext }: PanelSolicitorDetailsProps, ref) => {
    const searchParams = new URLSearchParams(window.location.search);
    const claimID = searchParams.get("claimid");
    const { id } = useParams();
    const [suggestions, setSuggestions] = useState<Company[]>([]);
    const [loadingSuggestions, setLoadingSuggestions] = useState(false);
    const [typing, setTyping] = useState(false);
    const now = today(getLocalTimeZone());
    const [isLoading, setIsLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [date, setDate] = useState<DateValue | null>(null);
    const { isClosed } = useSelector((state) => state.isClosed);
    const formikRef = useRef<any>(null);
    const [signedDocsLoading, setSignedDocsLoading] = useState(false);
    const [acceptanceLoading, setAcceptanceLoading] = useState(false);
    const [emailError, setEmailError] = useState<string | null>(null);

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

    const [initialValues, setInitialValues] = useState({
      company_name: "",
      reference: "",
      recommendation_sent: "",
      note: "",
      claim_id: claimID || 0,
      email_sent_date: "",
      accepted_sent_date: "",
      address: {
        address: "",
        postcode: "",
        mobile_tel: "",
        email: "",
      },
    });

    const getEmailPayload = () => {
      const claimId = claimID || id;
      const values = formikRef.current?.values;

      if (!claimId) {
        toast.error("Claim ID not found");
        return null;
      }

      if (!values?.address?.email) {
        toast.error("Email address is required");
        return null;
      }

      if (!values?.company_name) {
        toast.error("Company name is required");
        return null;
      }

      if (!date) {
        toast.error("Recommendation date is required");
        return null;
      }

      return {
        claimId,
        payload: {
          solicitor_email: values.address.email,
          company_name: values.company_name,
          recommendation_date: date ? new Date(date).toISOString().split("T")[0] : null,
        },
      };
    };

    const handleSendSignedDocuments = async () => {
      const data = getEmailPayload();
      if (!data) return;

      setSignedDocsLoading(true);
      setEmailError(null);
      
      try {
        await sendEmailToPanelSolicitor(
          data.payload,
          data.claimId
        );
        toast.success("Signed documents email sent successfully");
      } catch (error: any) {
        console.error(error);
        toast.error("Failed to send signed documents email");
        setEmailError(error.message || "An error occurred");
      } finally {
        setSignedDocsLoading(false);
      }
    };

    const handleClaimAccepted = async () => {
      const data = getEmailPayload();
      if (!data) return;

      setAcceptanceLoading(true);
      setEmailError(null);
      
      try {
        await sendAcceptanceEmailToPanelSolicitor(
          data.payload,
          data.claimId
        );
        toast.success("Claim accepted email sent successfully");
      } catch (error: any) {
        console.error(error);
        toast.error("Failed to send claim accepted email");
        setEmailError(error.message || "An error occurred");
      } finally {
        setAcceptanceLoading(false);
      }
    };

    useEffect(() => {
      window.scrollTo(0, 0);
    }, []);

    useEffect(() => {
      const currentClaimId = claimID || id;
      if (currentClaimId) {
        const loadData = async () => {
          if (currentClaimId) {
            await fetchPanelSolicitosDetails(currentClaimId);
          }
        };
        loadData();
      }
    }, [id, claimID]);

    const fetchPanelSolicitosDetails = async (claim_id: string) => {
      try {
        setIsLoading(true);
        const response = await getPanelSolicitorDetails(claim_id);
        const panelSolicitors = response.data || response;
        if (panelSolicitors) {
          setDate(parseCalendarDate(panelSolicitors.recommendation_sent));
          setIsEditing(true);
          setInitialValues((prev) => ({
            ...prev,
            company_name: panelSolicitors.company_name,
            reference: panelSolicitors.reference,
            recommendation_sent: panelSolicitors.recommendation_sent,
            note: panelSolicitors.note,
            claim_id: claimID || 0,
            email_sent_date: panelSolicitors.email_sent_date,
            accepted_sent_date: panelSolicitors.accepted_sent_date,
            address: {
              address: panelSolicitors.address.address,
              postcode: panelSolicitors.address.postcode,
              mobile_tel: panelSolicitors.address.mobile_tel,
              email: panelSolicitors.address.email,
            },
          }));
        }
      } catch (error) {
        console.error("Error fetching referrer:", error);
      } finally {
        setIsLoading(false);
      }
    };

    const formatDate = (val: string | Date | null) => {
      if (!val) return null;
      const d = new Date(val);
      return d.toISOString().split("T")[0];
    };

    const handleSubmit = async (values: any, key: string) => {
      try {
        const storedClaimId = claimID || id;
        const payload = {
          company_name: values.company_name,
          reference: values.reference,
          recommendation_sent: formatDate(date),
          note: values.note,
          claim_id: storedClaimId,
          email_sent_date: "2025-10-06", //remove from back end
          accepted_sent_date: "2025-10-06", //remove from back end
          address: {
            address: values.address.address,
            postcode: values.address.postcode,
            mobile_tel: values.address.mobile_tel,
            email: values.address.email,
          },
        };

        let response;
        if (storedClaimId && isEditing) {
          response = await updatePanelSolicitors(payload, storedClaimId, key);
        } else {
          response = await createPanelSolicitors(payload, key);
        }

        toast.success("Panel Solicitors Details saved successfully");

        if (handleNext && !skipNext) {
          handleNext(11, "next");
        }
      } catch (error: any) {
        toast.error("Unable to save panel solicitor details");
        console.error("Error submitting form:", error);
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

    return (
      <Formik
        initialValues={initialValues}
        onSubmit={handleSubmit}
        validationSchema={validationSchema}
        innerRef={formikRef}
        enableReinitialize
      >
        {({ values, setFieldValue, form }: any) => {
          const handleSelect = (company: any) => {
            setFieldValue("company_name", company.company_name || "");
            setFieldValue("address.address", company.address || "");
            setFieldValue("address.postcode", company.postcode || "");
            setFieldValue("address.mobile_tel", company.contact_number || "");
            setFieldValue("address.email", company.contact_email || "");

            setSuggestions([]);
            setTyping(false);
          };

          return (
            <form className="space-y-4 mt-12">
              <div className="border-b border-cloudGray mb-5 mt-8">
                <h2 className="text-lg font-weight-600  mb-2 sm:text-xl">
                  Panel Solicitor Details
                </h2>
                <p className="pb-5 text-lightGray text-sm font-normal">
                  Enter details for Panel Solicitor
                </p>
              </div>

              <div className="grid grid-cols-3 gap-4">
                {/* Company Name */}
                <div className="col-span-3 lg:col-span-1">
                  <Label htmlFor="company_name">Company Name</Label>
                </div>
                <div className="col-span-3 lg:col-span-2 relative">
                  <Field name="company_name">
                    {({ field, form, meta }: any) => (
                      <>
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
                                      "company_name",
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
                      </>
                    )}
                  </Field>
                </div>

                {/* Address */}
                <div className="col-span-3 lg:col-span-1">
                  <Label htmlFor="address.address">Address</Label>
                </div>
                <div className="col-span-3 lg:col-span-2">
                  <GoogleMapAutocomplete
                    showMap={false}
                    apiKey={config.apiGoogle}
                    disabled={isClosed}
                    address={values.address.address}
                    onPlaceSelected={(place) => {
                      setFieldValue("address.address", place.address || "");
                      setFieldValue("address.postcode", place.postalCode || "");
                    }}
                  />
                  <ErrorMessage
                    name="address.address"
                    component="div"
                    className="text-red-500 text-xs mt-1"
                  />
                </div>

                {/* Postcode */}
                <div className="col-span-3 lg:col-span-1">
                  <Label htmlFor="address.postcode">Postcode</Label>
                </div>
                <div className="col-span-3 lg:col-span-2">
                  <Field
                    name="address.postcode"
                    type="text"
                    style={{ height: "44px" }}
                    disabled={isClosed}
                    className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg bg-white hover:border-gray-400 focus:outline-none  text-sm sm:text-base"
                  />
                  <ErrorMessage
                    name="address.postcode"
                    component="div"
                    className="text-red-500 text-xs mt-1"
                  />
                </div>

                {/* Telephone */}
                <div className="col-span-3 lg:col-span-1">
                  <Label htmlFor="address.mobile_tel">Telephone Main</Label>
                </div>
                <div className="col-span-3 lg:col-span-2">
                  <Field name="address.mobile_tel">
                    {({ field, form, meta }: any) => (
                      <>
                        <PhoneInput
                          country="gb"
                          placeholder="+44"
                          value={field.value}
                          disabled={isClosed}
                          inputStyle={{
                            width: "100%",
                            height: "44px",
                            fontSize: "16px",
                          }}
                          onChange={(value) =>
                            form.setFieldValue(field.name, value)
                          }
                        />
                        {meta.touched && meta.error && (
                          <div className="text-red-500 text-sm mt-1">
                            {meta.error}
                          </div>
                        )}
                      </>
                    )}
                  </Field>
                </div>

                {/* Email */}
                <div className="col-span-3 lg:col-span-1">
                  <Label htmlFor="address.email">Email</Label>
                </div>
                <div className="col-span-3 lg:col-span-2 relative">
                    <Mail className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4"/>
                  <Field
                    name="address.email"
                    type="email"
                    style={{ height: "44px" }}
                    disabled={isClosed}
                    className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg bg-white hover:border-gray-400 focus:outline-none  text-sm sm:text-base"
                  />
                  <ErrorMessage
                    name="address.email"
                    component="div"
                    className="text-red-500 text-xs mt-1"
                  />
                </div>

                {/* Reference */}
                <div className="col-span-3 lg:col-span-1">
                  <Label htmlFor="reference">Reference</Label>
                </div>
                <div className="col-span-3 lg:col-span-2">
                  <Field
                    name="reference"
                    type="text"
                    style={{ height: "44px" }}
                    disabled={isClosed}
                    className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg bg-white hover:border-gray-400 focus:outline-none  text-sm sm:text-base"
                  />
                  <ErrorMessage
                    name="reference"
                    component="div"
                    className="text-red-500 text-xs mt-1"
                  />
                </div>

                {/* Recommendation Date */}
                <div className="col-span-3 lg:col-span-1">
                  <Label htmlFor="recommendation_sent">
                    Recommendation Sent On
                  </Label>
                </div>
                <div className="col-span-3 lg:col-span-2">
                  <div className="w-full">
                    <Field name="recommendation_sent">
                      {({ form }: any) => (
                        <DatePicker
                          isDisabled={isClosed}
                          value={date}
                          onChange={(newDate) => {
                            setDate(newDate);
                            form.setFieldValue("recommendation_sent", newDate);
                          }}
                          className="w-full"
                        >
                          <DateInput />
                        </DatePicker>
                      )}
                    </Field>
                  </div>
                </div>

                {/* Note */}
                <div className="col-span-3 lg:col-span-1">
                  <Label htmlFor="note">Note</Label>
                </div>
                <div className="col-span-3 lg:col-span-2">
                  <Field
                    as="textarea"
                    name="note"
                    rows={3}
                    disabled={isClosed}
                    placeholder="Describe what happened in detail..."
                    className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg bg-white hover:border-gray-400 focus:outline-none  resize-none "
                  />
                  <div className="flex flex-wrap gap-6 mt-3 text-sm">
                    {/* Send Signed Documents button */}
                    <button
                      type="button"
                      disabled={signedDocsLoading || isClosed}
                      onClick={handleSendSignedDocuments}
                      className="flex items-center gap-1 text-custom hover:underline disabled:text-gray-400 disabled:cursor-not-allowed"
                    >
                      {signedDocsLoading ? (
                        <>
                          <span>Sending Signed Documents...</span>
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-400 mt-[3px] ml-1"></div>
                        </>
                      ) : (
                        <>
                          <span>Send Signed Documents to Panel Solicitors</span>
                          <TopRightIcon className="w-4 h-4" />
                        </>
                      )}
                    </button>

                    {/* Claim Accepted button */}
                    <button
                      type="button"
                      disabled={acceptanceLoading || isClosed}
                      onClick={handleClaimAccepted}
                      className="flex items-center gap-1 text-custom hover:underline disabled:text-gray-400 disabled:cursor-not-allowed"
                    >
                      {acceptanceLoading ? (
                        <>
                          <span>Sending Claim Accepted Email...</span>
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-400 mt-[3px] ml-1"></div>
                        </>
                      ) : (
                        <>
                          <span>Claim Accepted by Panel Solicitor</span>
                          <TopRightIcon className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          );
        }}
      </Formik>
    );
  }
);

PanelSolicitorDetails.displayName = "PanelSolicitorDetails";

export default PanelSolicitorDetails;