import "react-phone-input-2/lib/style.css";
import Label from "../common/label";
import { getLocalTimeZone, today } from "@internationalized/date";
import TopRightIcon from "../common/top-right-icon";
import GoogleMapAutocomplete from "../GoogleMapAutoComplete/GoogleMapAutoComplete";
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  Component,
} from "react";
import { ErrorMessage, Field, Formik } from "formik";
import { useParams, useSearchParams } from "react-router-dom";
import { config } from "../../../config";
import { DatePicker } from "../application/date-picker/date-picker";
import CustomSelect from "../ReactSelect/ReactSelect";
import { debounce } from "lodash";
import { getCompanySuggestions } from "../../services/Referrer/Referrer";
import { useSelector } from "react-redux";
import PhoneInput from "react-phone-input-2";
import type { DateValue } from "react-aria-components";
import { getPanelSolicitorDetails } from "../../services/PanelSolicitorDetails/PanelSolicitorDetails";
import { toast } from "react-toastify";
import { parseCalendarDate } from "../../common/common";
import * as Yup from "yup";
import {
  createThirdPartyInsurer,
  getThirdPartyInsurer,
  updateThirdPartyInsurer,
} from "../../services/ThirdPartyInsurer/ThirdPartyInsurer";
import {
  getHandlers,
  getLiabilityStances,
  getMidReasons,
  getSettlementStatus,
} from "../../services/Lookups/Generaldetails";
import { FaTimes } from "react-icons/fa";
import Modal from "react-responsive-modal";

interface LookupItem {
  id: number;
  label: string;
  sort_order?: number;
  is_active?: boolean;
}

const validationSchema = Yup.object().shape({
  // direct_email: Yup.string().email("Invalid email format").required("Direct email is required"),
  // insurer_reference: Yup.string().required("Insurer reference is required"),
  // policy_number: Yup.number().required("Policy number is required"),
  // claim_validation: Yup.boolean(),
  // handling_reference: Yup.string().required("Handling reference is required"),
  // incorrect_mid_reference: Yup.string().required("Incorrect MID reference is required"),
  // incorrect_acc: Yup.string().nullable(),
  // initial_eng_made: Yup.string().nullable(),
  // new_mid: Yup.string().required("New MID is required"),
  // new_mid_search_ref: Yup.string().required("New MID search reference is required"),
  // incorrect_reg: Yup.string().required("Incorrect registration is required"),
  // new_mid_search_processed: Yup.boolean(),
  // abi_insured: Yup.boolean(),
  // liability_accepted_on: Yup.string().nullable(),
  // reason_new_mid_id: Yup.number().required("Reason for new MID is required"),
  // liability_stance_id: Yup.number().required("Liability stance is required"),
  // settlement_status_id: Yup.number().required("Settlement status is required"),
  // handler_id: Yup.number().required("Handler is required"),
  // third_party: Yup.object().shape({
  //   gender: Yup.string().required("Gender is required"),
  //   first_name: Yup.string().required("First name is required"),
  //   surname: Yup.string().required("Surname is required"),
  //   address: Yup.object().shape({
  //     address: Yup.string().required("Address is required"),
  //     postcode: Yup.string().required("Postcode is required"),
  //     mobile_tel: Yup.string().required("Mobile number is required"),
  //     email: Yup.string().email("Invalid email format").required("Email is required"),
  //   }),
  // }),
  // third_party_insurer: Yup.object().shape({
  //   gender: Yup.string().required("Gender is required"),
  //   first_name: Yup.string().required("First name is required"),
  //   surname: Yup.string().required("Surname is required"),
  //   address: Yup.object().shape({
  //     address: Yup.string().required("Address is required"),
  //     postcode: Yup.string().required("Postcode is required"),
  //     mobile_tel: Yup.string().required("Mobile number is required"),
  //     email: Yup.string().email("Invalid email format").required("Email is required"),
  //   }),
  // }),
  // third_party_handling: Yup.object().shape({
  //   gender: Yup.string().required("Gender is required"),
  //   first_name: Yup.string().required("First name is required"),
  //   surname: Yup.string().required("Surname is required"),
  //   address: Yup.object().shape({
  //     address: Yup.string().required("Address is required"),
  //     postcode: Yup.string().required("Postcode is required"),
  //     mobile_tel: Yup.string().required("Mobile number is required"),
  //     email: Yup.string().email("Invalid email format").required("Email is required"),
  //   }),
  // }),
});

export interface PanelSolicitorDetailsProps {
  claimData?: any;
  isEditMode?: boolean;
  onSuccess?: () => void;
  handleNext?: (step: number, direction: string) => void;
  skipNext: boolean;
}

interface Address {
  address: string;
  postcode: string;
  mobile_tel: string;
  email: string;
}

interface Party {
  gender: string;
  first_name: string;
  surname: string;
  address: Address;
}

interface Company {
  company_name: string;
  address: Address;
  contact_number: string;
  contact_email: string;
}

class ErrorBoundary extends Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div>
          <h2>Something went wrong</h2>
          <p>{this.state.error?.toString()}</p>
        </div>
      );
    }
    return this.props.children;
  }
}

const ThirdPartyInsurer = forwardRef(
  ({ handleNext, skipNext }: PanelSolicitorDetailsProps, ref) => {
    const searchParams = new URLSearchParams(window.location.search);
    const claimID = searchParams.get("claimid");
    const { id } = useParams();
    const [handlers, setHandlers] = useState<LookupItem[]>([]);
    const [midReason, setMidReason] = useState<LookupItem[]>([]);
    const [settlementStatus, setSettlementStatus] = useState<LookupItem[]>([]);
    const [liabilityStances, setLiabilityStances] = useState<LookupItem[]>([]);

    const [suggestions, setSuggestions] = useState<Company[]>([]);
    const [loadingSuggestions, setLoadingSuggestions] = useState(false);
    const [showMidSearchLog, setShowMidSearchLog] = useState(false);

    const [typing, setTyping] = useState(false);
    const now = today(getLocalTimeZone());
    const [isLoading, setIsLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [incorrectAccDate, setIncorrectAccDate] = useState<DateValue | null>(
      null
    );
    const [initialEngMadeDate, setInitialEngMadeDate] =
      useState<DateValue | null>(null);
    const [newConductDate, setNewConductDate] = useState<DateValue | null>();
    const [insurerModal, setInsurerModal] = useState(false);
    const [liabilityAcceptedDate, setLiabilityAcceptedDate] =
      useState<DateValue | null>(null);
    const { isClosed } = useSelector((state: any) => state.isClosed);
    const formikRef = useRef<any>(null);

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
      direct_email: "",
      insurer_reference: "",
      policy_number: "",
      claim_validation: false,
      handling_reference: "",
      incorrect_mid_reference: "",
      incorrect_acc: "",
      initial_eng_made: "",
      new_mid: "",
      new_mid_search_ref: "",
      incorrect_reg: "",
      new_mid_search_processed: false,
      abi_insured: false,
      liability_accepted_on: "",
      reason_new_mid_id: null,
      liability_stance_id: null,
      settlement_status_id: null,
      handler_id: null,
      third_party: {
        gender: "mr",
        first_name: "",
        surname: "",
        address: {
          address: "",
          postcode: "",
          mobile_tel: "",
          email: "",
        },
      },
      third_party_insurer: {
        gender: "mr",
        first_name: "",
        surname: "",
        address: {
          address: "",
          postcode: "",
          mobile_tel: "",
          email: "",
        },
      },
      third_party_handling: {
        gender: "mr",
        first_name: "",
        surname: "",
        address: {
          address: "",
          postcode: "",
          mobile_tel: "",
          email: "",
        },
      },
    });

    useEffect(() => {
      window.scrollTo(0, 0);
    }, []);

    useEffect(() => {
      const currentClaimId = claimID || id;
      if (currentClaimId) {
        const loadData = async () => {
          await fetchThirdPartyInsurer(currentClaimId);
        };
        loadData();
      }

      getDropdownData();
    }, [id, claimID]);

    const getDropdownData = async () => {
      const [handler, reason, settlementStatus, liability] = await Promise.all([
        getHandlers(),
        getMidReasons(),
        getSettlementStatus(),
        getLiabilityStances(),
      ]);
      setHandlers(handler.data);
      setMidReason(reason.data);
      setSettlementStatus(settlementStatus.data);
      setLiabilityStances(liability.data);
    };

    const fetchThirdPartyInsurer = async (claim_id: string) => {
      try {
        setIsLoading(true);
        const response = await getThirdPartyInsurer(claim_id);
        const thirdPartyInsurer = response.data || response;
        if (thirdPartyInsurer) {
          setIsEditing(true);
          setLiabilityAcceptedDate(
            parseCalendarDate(thirdPartyInsurer.liability_accepted_on)
          );
          setIncorrectAccDate(
            parseCalendarDate(thirdPartyInsurer.incorrect_acc?.split("T")[0])
          );
          setInitialEngMadeDate(
            parseCalendarDate(thirdPartyInsurer.initial_eng_made?.split("T")[0])
          );
          setNewConductDate(parseCalendarDate(thirdPartyInsurer.new_mid));
          setInitialValues({
            direct_email: thirdPartyInsurer.direct_email || "",
            insurer_reference: thirdPartyInsurer.insurer_reference || "",
            policy_number: thirdPartyInsurer.policy_number || "",
            claim_validation: thirdPartyInsurer.claim_validation || false,
            handling_reference: thirdPartyInsurer.handling_reference || "",
            incorrect_mid_reference:
              thirdPartyInsurer.incorrect_mid_reference || "",
            incorrect_acc: formatDate(thirdPartyInsurer.incorrect_acc) || "",
            initial_eng_made:
              formatDate(thirdPartyInsurer.initial_eng_made) || "",
            new_mid: formatDate(thirdPartyInsurer.new_mid) || "",
            new_mid_search_ref: thirdPartyInsurer.new_mid_search_ref || "",
            incorrect_reg: thirdPartyInsurer.incorrect_reg || "",
            new_mid_search_processed:
              thirdPartyInsurer.new_mid_search_processed || false,
            abi_insured: thirdPartyInsurer.abi_insured || false,
            liability_accepted_on:
              formatDate(thirdPartyInsurer.liability_accepted_on) || "",
            reason_new_mid_id: thirdPartyInsurer.reason_new_mid_id || null,
            liability_stance_id: thirdPartyInsurer.liability_stance_id || null,
            settlement_status_id:
              thirdPartyInsurer.settlement_status_id || null,
            handler_id: thirdPartyInsurer.handler_id || null,
            third_party: {
              gender: thirdPartyInsurer.third_party?.gender || "mr",
              first_name: thirdPartyInsurer.third_party?.first_name || "",
              surname: thirdPartyInsurer.third_party?.surname || "",
              address: {
                address: thirdPartyInsurer.third_party?.address?.address || "",
                postcode:
                  thirdPartyInsurer.third_party?.address?.postcode || "",
                mobile_tel:
                  thirdPartyInsurer.third_party?.address?.mobile_tel || "",
                email: thirdPartyInsurer.third_party?.address?.email || "",
              },
            },
            third_party_insurer: {
              gender: thirdPartyInsurer.third_party_insurer?.gender || "mr",
              first_name:
                thirdPartyInsurer.third_party_insurer?.first_name || "",
              surname: thirdPartyInsurer.third_party_insurer?.surname || "",
              address: {
                address:
                  thirdPartyInsurer.third_party_insurer?.address?.address || "",
                postcode:
                  thirdPartyInsurer.third_party_insurer?.address?.postcode ||
                  "",
                mobile_tel:
                  thirdPartyInsurer.third_party_insurer?.address?.mobile_tel ||
                  "",
                email:
                  thirdPartyInsurer.third_party_insurer?.address?.email || "",
              },
            },
            third_party_handling: {
              gender: thirdPartyInsurer.third_party_handling?.gender || "mr",
              first_name:
                thirdPartyInsurer.third_party_handling?.first_name || "",
              surname: thirdPartyInsurer.third_party_handling?.surname || "",
              address: {
                address:
                  thirdPartyInsurer.third_party_handling?.address?.address ||
                  "",
                postcode:
                  thirdPartyInsurer.third_party_handling?.address?.postcode ||
                  "",
                mobile_tel:
                  thirdPartyInsurer.third_party_handling?.address?.mobile_tel ||
                  "",
                email:
                  thirdPartyInsurer.third_party_handling?.address?.email || "",
              },
            },
          });
        }
      } catch (error) {
        console.error("Error fetching Third Party Insurer details:", error);
        // toast.error('Failed to load Third Party Insurer details');
      } finally {
        setIsLoading(false);
      }
    };

    // const formatDate = (val: DateValue | string | Date | null) => {
    //   if (!val) return null;
    //   if (typeof val === 'string') return val;
    //   if ('toDate' in val) {
    //     const d = val.toDate(getLocalTimeZone());
    //     return d.toISOString().split("T")[0];
    //   }
    //   const d = new Date(val);
    //   return isNaN(d.getTime()) ? null : d.toISOString().split("T")[0];
    // };
    const formatDate = (val: DateValue | string | Date | null) => {
      if (!val) return null;

      // Already ISO string (yyyy-mm-dd)
      if (typeof val === "string") return val;

      let date: Date;

      if ("toDate" in val) {
        date = val.toDate(getLocalTimeZone());
      } else {
        date = new Date(val);
      }

      if (isNaN(date.getTime())) return null;

      // ✅ format using local date parts (NO UTC shift)
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");

      return `${year}-${month}-${day}`;
    };

    const handleSubmit = async (values: any, actions: any, key?: string) => {
      try {
        const storedClaimId = claimID || id || 0;
        const payload = {
          claim_id: storedClaimId,
          direct_email: values.direct_email,
          insurer_reference: values.insurer_reference,
          policy_number: values.policy_number,
          claim_validation: values.claim_validation,
          handling_reference: values.handling_reference,
          incorrect_mid_reference: values.incorrect_mid_reference,
          incorrect_acc: formatDate(incorrectAccDate),
          initial_eng_made: formatDate(initialEngMadeDate),
          new_mid: formatDate(newConductDate),
          new_mid_search_ref: values.new_mid_search_ref,
          incorrect_reg: values.incorrect_reg,
          new_mid_search_processed: values.new_mid_search_processed,
          abi_insured: values.abi_insured,
          liability_accepted_on: formatDate(liabilityAcceptedDate),
          reason_new_mid_id: values.reason_new_mid_id,
          liability_stance_id: values.liability_stance_id,
          settlement_status_id: values.settlement_status_id,
          handler_id: values.handler_id,
          third_party: values.third_party,
          third_party_insurer: values.third_party_insurer,
          third_party_handling: values.third_party_handling,
        };

        let response;
        if (storedClaimId && isEditing) {
          response = await updateThirdPartyInsurer(payload, storedClaimId);
        } else {
          response = await createThirdPartyInsurer(payload);
        }

        toast.success("Third Party Insurer Details saved successfully");
        if (handleNext && !skipNext) {
          handleNext(15, "next");
        }
        actions.setSubmitting(false);
      } catch (error: any) {
        toast.error("Unable to save Third Party Insurer");
        console.error("Error submitting form:", error);
        actions.setSubmitting(false);
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
      <ErrorBoundary>
        <div className="sm:pt-8 pb-8 sm:pb-12 sm:pr-4 lg:pr-10 bg-white">
          <Formik
            initialValues={initialValues}
            onSubmit={handleSubmit}
            validationSchema={validationSchema}
            innerRef={formikRef}
            enableReinitialize
          >
            {({ values, setFieldValue }) => {
              const handleSelect = (company: Company, section: string) => {
                const newValues = {
                  company_name: company.company_name || "",
                  address: {
                    address: company.address?.address || "",
                    postcode: company.address?.postcode || "",
                    mobile_tel: company.contact_number || "",
                    email: company.contact_email || "",
                  },
                };

                Object.entries(newValues).forEach(([key, value]) => {
                  if (key === "address" && typeof value === "object") {
                    Object.entries(value).forEach(([subKey, subValue]) => {
                      setFieldValue(`${section}.address.${subKey}`, subValue);
                    });
                  } else {
                    setFieldValue(`${section}.${key}`, value);
                  }
                });

                setInitialValues((prev) => ({
                  ...prev,
                  [section]: {
                    ...prev[section],
                    address: newValues.address,
                  },
                }));
                setSuggestions([]);
                setTyping(false);
              };

              return (
                <>
                  {/* Third Party Details */}
                  <div className="border-b border-cloudGray mb-5 mt-4">
                    <h2 className="text-lg font-weight-600  mb-2 sm:text-xl">
                      Third Party Details
                    </h2>
                    <p className="pb-5 text-lightGray text-sm font-normal">
                      Enter details for Third Party
                    </p>
                  </div>
                  <form className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="col-span-3 lg:col-span-1">
                        <Label htmlFor="third_party.gender">
                          Third Party Name
                        </Label>
                      </div>
                      <div className="col-span-3 lg:col-span-2">
                        <div className="flex flex-col sm:flex-row w-full gap-2 sm:gap-3">
                          <Field name="third_party.gender">
                            {({ field, form, meta }: any) => {
                              const genderOptions = [
                                { value: "mr", label: "Mr." },
                                { value: "mrs", label: "Mrs." },
                                { value: "ms", label: "Ms." },
                              ];
                              return (
                                <div className="w-full sm:w-1/6">
                                  <CustomSelect
                                    options={genderOptions}
                                    value={
                                      genderOptions.find(
                                        (opt) => opt.value === field.value
                                      ) || genderOptions[0]
                                    }
                                    onChange={(option) =>
                                      form.setFieldValue(
                                        field.name,
                                        option ? option.value : ""
                                      )
                                    }
                                    disabled={isClosed}
                                  />
                                  {meta.touched && meta.error && (
                                    <div className="text-red-500 text-xs mt-1">
                                      {meta.error}
                                    </div>
                                  )}
                                </div>
                              );
                            }}
                          </Field>
                          <div className="flex-1">
                            <Field
                              type="text"
                              name="third_party.first_name"
                              placeholder="First Name"
                              style={{ height: "44px" }}
                              disabled={isClosed}
                              className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg bg-white hover:border-gray-400 focus:ring-2 focus:ring-custom-200 focus:outline-none  text-sm sm:text-base"
                            />
                            <ErrorMessage
                              name="third_party.first_name"
                              component="div"
                              className="text-red-500 text-xs mt-1"
                            />
                          </div>
                          <div className="flex-1">
                            <Field
                              type="text"
                              name="third_party.surname"
                              placeholder="Surname"
                              style={{ height: "44px" }}
                              disabled={isClosed}
                              className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg bg-white hover:border-gray-400 focus:ring-2 focus:ring-custom-200 focus:outline-none  text-sm sm:text-base"
                            />
                            <ErrorMessage
                              name="third_party.surname"
                              component="div"
                              className="text-red-500 text-xs mt-1"
                            />
                          </div>
                        </div>
                      </div>
                      <div className="col-span-3 lg:col-span-1">
                        <Label htmlFor="third_party.address.address">
                          Address
                        </Label>
                      </div>
                      <div className="col-span-3 lg:col-span-2">
                        <GoogleMapAutocomplete
                          showMap={false}
                          apiKey={config.apiGoogle}
                          disabled={isClosed}
                          address={values.third_party.address.address}
                          onPlaceSelected={(place) => {
                            if (place && place.address) {
                              setFieldValue(
                                "third_party.address.address",
                                place.address
                              );
                              setFieldValue(
                                "third_party.address.postcode",
                                place.postalCode || ""
                              );
                            }
                          }}
                        />
                        <ErrorMessage
                          name="third_party.address.address"
                          component="div"
                          className="text-red-500 text-xs mt-1"
                        />
                      </div>
                      <div className="col-span-3 lg:col-span-1">
                        <Label htmlFor="third_party.address.postcode">
                          Postcode
                        </Label>
                      </div>
                      <div className="col-span-3 lg:col-span-2">
                        <Field
                          name="third_party.address.postcode"
                          type="text"
                          style={{ height: "44px" }}
                          disabled={isClosed}
                          className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg bg-white hover:border-gray-400 focus:outline-none  text-sm sm:text-base"
                        />
                        <ErrorMessage
                          name="third_party.address.postcode"
                          component="div"
                          className="text-red-500 text-xs mt-1"
                        />
                      </div>
                      {/* Telephone main  */}
                      <div className="col-span-3 lg:col-span-1">
                        <Label htmlFor="third_party.address.mobile_tel">
                          Telephone Main
                        </Label>
                      </div>
                      <div className="col-span-3 lg:col-span-2">
                        <Field name="third_party.address.mobile_tel">
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
                                <div className="text-red-500 text-xs mt-1">
                                  {meta.error}
                                </div>
                              )}
                            </>
                          )}
                        </Field>
                        <ErrorMessage
                          name="third_party.address.mobile_tel"
                          component="div"
                          className="text-red-500 text-xs mt-1"
                        />
                      </div>
                      {/* Contract  */}
                      {/* <div className="col-span-3 lg:col-span-1">
                        <Label htmlFor="third_party.address.mobile_tel">Contract</Label>
                      </div>
                      <div className="col-span-3 lg:col-span-2">
                        <Field name="third_party.address.mobile_tel">
                          {({ field, form, meta }: any) => (
                            <>
                              <PhoneInput
                                country="gb"
                                value={field.value}
                                disabled={isClosed}
                                inputStyle={{ width: '700px', height: '44px' }}
                                onChange={(value) => form.setFieldValue(field.name, value)}
                              />
                              {meta.touched && meta.error && (
                                <div className="text-red-500 text-xs mt-1">{meta.error}</div>
                              )}
                            </>
                          )}
                        </Field>
                        <ErrorMessage name="third_party.address.mobile_tel" component="div" className="text-red-500 text-xs mt-1" />
                      </div> */}

                      <div className="col-span-3 lg:col-span-1">
                        <Label htmlFor="third_party.address.email">Email</Label>
                      </div>
                      <div className="col-span-3 lg:col-span-2">
                        <Field
                          name="third_party.address.email"
                          type="email"
                          style={{ height: "44px" }}
                          disabled={isClosed}
                          className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg bg-white hover:border-gray-400 focus:outline-none  text-sm sm:text-base"
                        />
                        <div className="absolute right-3 top-1/3 transform -translate-y-1/2 text-gray-500">
                          <a
                            href={`https://outlook.office.com/mail/deeplink/compose?to=${values.third_party.address.email}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {/* <Mail01 className="h-4 w-4" /> */}
                          </a>
                        </div>
                        <ErrorMessage
                          name="third_party.address.email"
                          component="div"
                          className="text-red-500 text-xs mt-1"
                        />
                      </div>
                    </div>
                    <div className="mt-8 border-t border-cloudGray" />
                  </form>

                  {/* Third Party Insurance Details */}
                  <div className="border-b border-cloudGray my-5">
                    <h2 className="text-secondary text-lg font-weight-600">
                      Third Party Insurer Details
                    </h2>
                    <p className="pb-5 text-lightGray text-sm font-normal">
                      Enter details for Third Party Insurer
                    </p>
                  </div>
                  <form className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="col-span-3 lg:col-span-1">
                        <Label htmlFor="third_party_insurer.gender">
                          Third Party Insurer Name
                        </Label>
                      </div>
                      <div className="col-span-3 lg:col-span-2">
                        <div className="flex flex-col sm:flex-row w-full gap-2 sm:gap-3">
                          <Field name="third_party_insurer.gender">
                            {({ field, form, meta }: any) => {
                              const genderOptions = [
                                { value: "mr", label: "Mr." },
                                { value: "mrs", label: "Mrs." },
                                { value: "ms", label: "Ms." },
                              ];
                              return (
                                <div className="w-full sm:w-1/6">
                                  <CustomSelect
                                    options={genderOptions}
                                    value={
                                      genderOptions.find(
                                        (opt) => opt.value === field.value
                                      ) || genderOptions[0]
                                    }
                                    onChange={(option) =>
                                      form.setFieldValue(
                                        field.name,
                                        option ? option.value : ""
                                      )
                                    }
                                    disabled={isClosed}
                                  />
                                  {meta.touched && meta.error && (
                                    <div className="text-red-500 text-xs mt-1">
                                      {meta.error}
                                    </div>
                                  )}
                                </div>
                              );
                            }}
                          </Field>
                          <div className="flex-1">
                            <Field
                              type="text"
                              name="third_party_insurer.first_name"
                              placeholder="First Name"
                              style={{ height: "44px" }}
                              disabled={isClosed}
                              className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg bg-white hover:border-gray-400 focus:ring-2 focus:ring-custom-200 focus:outline-none  text-sm sm:text-base"
                            />
                            <ErrorMessage
                              name="third_party_insurer.first_name"
                              component="div"
                              className="text-red-500 text-xs mt-1"
                            />
                          </div>
                          <div className="flex-1">
                            <Field
                              type="text"
                              name="third_party_insurer.surname"
                              placeholder="Surname"
                              style={{ height: "44px" }}
                              disabled={isClosed}
                              className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg bg-white hover:border-gray-400 focus:ring-2 focus:ring-custom-200 focus:outline-none  text-sm sm:text-base"
                            />
                            <ErrorMessage
                              name="third_party_insurer.surname"
                              component="div"
                              className="text-red-500 text-xs mt-1"
                            />
                          </div>
                        </div>
                      </div>
                      <div className="col-span-3 lg:col-span-1">
                        <Label htmlFor="third_party_insurer.address.address">
                          Address
                        </Label>
                      </div>
                      <div className="col-span-3 lg:col-span-2">
                        <GoogleMapAutocomplete
                          showMap={false}
                          apiKey={config.apiGoogle}
                          disabled={isClosed}
                          address={values.third_party_insurer.address.address}
                          onPlaceSelected={(place) => {
                            if (place && place.address) {
                              setFieldValue(
                                "third_party_insurer.address.address",
                                place.address
                              );
                              setFieldValue(
                                "third_party_insurer.address.postcode",
                                place.postalCode || ""
                              );
                            }
                          }}
                        />
                        <ErrorMessage
                          name="third_party_insurer.address.address"
                          component="div"
                          className="text-red-500 text-xs mt-1"
                        />
                      </div>
                      <div className="col-span-3 lg:col-span-1">
                        <Label htmlFor="third_party_insurer.address.postcode">
                          Postcode
                        </Label>
                      </div>
                      <div className="col-span-3 lg:col-span-2">
                        <Field
                          name="third_party_insurer.address.postcode"
                          type="text"
                          style={{ height: "44px" }}
                          disabled={isClosed}
                          className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg bg-white hover:border-gray-400 focus:outline-none  text-sm sm:text-base"
                        />
                        <ErrorMessage
                          name="third_party_insurer.address.postcode"
                          component="div"
                          className="text-red-500 text-xs mt-1"
                        />
                      </div>
                      <div className="col-span-3 lg:col-span-1">
                        <Label htmlFor="third_party_insurer.address.mobile_tel">
                          Telephone Main
                        </Label>
                      </div>
                      <div className="col-span-3 lg:col-span-2">
                        <Field name="third_party_insurer.address.mobile_tel">
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
                                <div className="text-red-500 text-xs mt-1">
                                  {meta.error}
                                </div>
                              )}
                            </>
                          )}
                        </Field>
                        <ErrorMessage
                          name="third_party_insurer.address.mobile_tel"
                          component="div"
                          className="text-red-500 text-xs mt-1"
                        />
                      </div>
                      <div className="col-span-3 lg:col-span-1">
                        <Label htmlFor="third_party_insurer.address.email">
                          General Email
                        </Label>
                      </div>
                      <div className="col-span-3 lg:col-span-2">
                        <Field
                          name="third_party_insurer.address.email"
                          type="email"
                          style={{ height: "44px" }}
                          disabled={isClosed}
                          className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg bg-white hover:border-gray-400 focus:outline-none  text-sm sm:text-base"
                        />
                        <div className="absolute right-3 top-1/3 transform -translate-y-1/2 text-gray-500">
                          <a
                            href={`https://outlook.office.com/mail/deeplink/compose?to=${values.third_party_insurer.address.email}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {/* <Mail01 className="h-4 w-4" /> */}
                          </a>
                        </div>
                        <ErrorMessage
                          name="third_party_insurer.address.email"
                          component="div"
                          className="text-red-500 text-xs mt-1"
                        />
                      </div>
                      <div className="col-span-3 lg:col-span-1">
                        <Label htmlFor="direct_email">Direct Email</Label>
                      </div>
                      <div className="col-span-3 lg:col-span-2">
                        <Field
                          name="direct_email"
                          type="email"
                          style={{ height: "44px" }}
                          disabled={isClosed}
                          className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg bg-white hover:border-gray-400 focus:outline-none  text-sm sm:text-base"
                        />
                        <div className="absolute right-3 top-1/3 transform -translate-y-1/2 text-gray-500">
                          <a
                            href={`https://outlook.office.com/mail/deeplink/compose?to=${values.direct_email}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {/* <Mail01 className="h-4 w-4" /> */}
                          </a>
                        </div>
                        <ErrorMessage
                          name="direct_email"
                          component="div"
                          className="text-red-500 text-xs mt-1"
                        />
                      </div>
                      <div className="col-span-3 lg:col-span-1">
                        <Label htmlFor="insurer_reference">Reference</Label>
                      </div>
                      <div className="col-span-3 lg:col-span-2">
                        <Field
                          name="insurer_reference"
                          type="text"
                          style={{ height: "44px" }}
                          disabled={isClosed}
                          className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg bg-white hover:border-gray-400 focus:outline-none  text-sm sm:text-base"
                        />
                        <ErrorMessage
                          name="insurer_reference"
                          component="div"
                          className="text-red-500 text-xs mt-1"
                        />
                      </div>
                      <div className="col-span-3 lg:col-span-1">
                        <Label htmlFor="policy_number">Policy Number</Label>
                      </div>
                      <div className="col-span-3 lg:col-span-2">
                        <Field
                          name="policy_number"
                          type="text"
                          style={{ height: "44px" }}
                          disabled={isClosed}
                          className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg bg-white hover:border-gray-400 focus:outline-none  text-sm sm:text-base"
                        />
                        <ErrorMessage
                          name="policy_number"
                          component="div"
                          className="text-red-500 text-xs mt-1"
                        />
                      </div>
                      <div className="col-span-3 lg:col-span-1">
                        <Label htmlFor="claim_validation">
                          Client's Claim in Validation?
                        </Label>
                      </div>
                      <div className="col-span-3 justify-between lg:col-span-2 lg:flex">
                        <label className="flex items-center">
                          <Field
                            type="checkbox"
                            name="claim_validation"
                            disabled={isClosed}
                            className="w-4 h-4 accent-[#00249c] border-gray-300 focus:ring-custom-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">
                            Yes
                          </span>
                        </label>
                        <div
                          className="flex gap-1 text-xs text-custom hover:cursor-pointer hover:underline"
                          // onClick={() => setInsurerModal(true)}
                          onClick={() =>
                            window.open(
                              "https://www.gtacredithire.com/chc-insurer-details/",
                              "_blank",
                              "noopener,noreferrer"
                            )
                          }
                        >
                          <p className="text-sm">Check if ABI Insurer</p>
                          <TopRightIcon />
                        </div>
                      </div>
                    </div>
                    <div className="mt-8 border-t border-cloudGray" />
                  </form>

                  {/* Third Party Handling Agent */}
                  <div className="border-b border-cloudGray my-5">
                    <h2 className="text-secondary text-lg font-weight-600">
                      Third Party Handling Agent
                    </h2>
                    <p className="pb-5 text-lightGray text-sm font-normal">
                      Enter details for Third Party Handling Agent
                    </p>
                  </div>
                  <form className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="col-span-3 lg:col-span-1">
                        <Label htmlFor="third_party_handling.gender">
                          Third Party Handling Agent Name
                        </Label>
                      </div>
                      <div className="col-span-3 lg:col-span-2">
                        <div className="flex flex-col sm:flex-row w-full gap-2 sm:gap-3">
                          <Field name="third_party_handling.gender">
                            {({ field, form, meta }: any) => {
                              const genderOptions = [
                                { value: "mr", label: "Mr." },
                                { value: "mrs", label: "Mrs." },
                                { value: "ms", label: "Ms." },
                              ];
                              return (
                                <div className="w-full sm:w-1/6">
                                  <CustomSelect
                                    options={genderOptions}
                                    value={
                                      genderOptions.find(
                                        (opt) => opt.value === field.value
                                      ) || genderOptions[0]
                                    }
                                    onChange={(option) =>
                                      form.setFieldValue(
                                        field.name,
                                        option ? option.value : ""
                                      )
                                    }
                                    disabled={isClosed}
                                  />
                                  {meta.touched && meta.error && (
                                    <div className="text-red-500 text-xs mt-1">
                                      {meta.error}
                                    </div>
                                  )}
                                </div>
                              );
                            }}
                          </Field>
                          <div className="flex-1">
                            <Field
                              type="text"
                              name="third_party_handling.first_name"
                              placeholder="First Name"
                              style={{ height: "44px" }}
                              disabled={isClosed}
                              className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg bg-white hover:border-gray-400 focus:ring-2 focus:ring-custom-200 focus:outline-none  text-sm sm:text-base"
                            />
                            <ErrorMessage
                              name="third_party_handling.first_name"
                              component="div"
                              className="text-red-500 text-xs mt-1"
                            />
                          </div>
                          <div className="flex-1">
                            <Field
                              type="text"
                              name="third_party_handling.surname"
                              placeholder="Surname"
                              style={{ height: "44px" }}
                              disabled={isClosed}
                              className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg bg-white hover:border-gray-400 focus:ring-2 focus:ring-custom-200 focus:outline-none  text-sm sm:text-base"
                            />
                            <ErrorMessage
                              name="third_party_handling.surname"
                              component="div"
                              className="text-red-500 text-xs mt-1"
                            />
                          </div>
                        </div>
                      </div>
                      <div className="col-span-3 lg:col-span-1">
                        <Label htmlFor="third_party_handling.address.address">
                          Address
                        </Label>
                      </div>
                      <div className="col-span-3 lg:col-span-2">
                        <GoogleMapAutocomplete
                          showMap={false}
                          apiKey={config.apiGoogle}
                          disabled={isClosed}
                          address={values.third_party_handling.address.address}
                          onPlaceSelected={(place) => {
                            if (place && place.address) {
                              setFieldValue(
                                "third_party_handling.address.address",
                                place.address
                              );
                              setFieldValue(
                                "third_party_handling.address.postcode",
                                place.postalCode || ""
                              );
                            }
                          }}
                        />
                        <ErrorMessage
                          name="third_party_handling.address.address"
                          component="div"
                          className="text-red-500 text-xs mt-1"
                        />
                      </div>
                      <div className="col-span-3 lg:col-span-1">
                        <Label htmlFor="third_party_handling.address.postcode">
                          Postcode
                        </Label>
                      </div>
                      <div className="col-span-3 lg:col-span-2">
                        <Field
                          name="third_party_handling.address.postcode"
                          type="text"
                          style={{ height: "44px" }}
                          disabled={isClosed}
                          className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg bg-white hover:border-gray-400 focus:outline-none  text-sm sm:text-base"
                        />
                        <ErrorMessage
                          name="third_party_handling.address.postcode"
                          component="div"
                          className="text-red-500 text-xs mt-1"
                        />
                      </div>
                      <div className="col-span-3 lg:col-span-1">
                        <Label htmlFor="third_party_handling.address.mobile_tel">
                          Telephone Main
                        </Label>
                      </div>
                      <div className="col-span-3 lg:col-span-2">
                        <Field name="third_party_handling.address.mobile_tel">
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
                                <div className="text-red-500 text-xs mt-1">
                                  {meta.error}
                                </div>
                              )}
                            </>
                          )}
                        </Field>
                        <ErrorMessage
                          name="third_party_handling.address.mobile_tel"
                          component="div"
                          className="text-red-500 text-xs mt-1"
                        />
                      </div>
                      <div className="col-span-3 lg:col-span-1">
                        <Label htmlFor="third_party_handling.address.email">
                          Email
                        </Label>
                      </div>
                      <div className="col-span-3 lg:col-span-2">
                        <Field
                          name="third_party_handling.address.email"
                          type="email"
                          style={{ height: "44px" }}
                          disabled={isClosed}
                          className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg bg-white hover:border-gray-400 focus:outline-none  text-sm sm:text-base"
                        />
                        <div className="absolute right-3 top-1/3 transform -translate-y-1/2 text-gray-500">
                          <a
                            href={`https://outlook.office.com/mail/deeplink/compose?to=${values.third_party_handling.address.email}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {/* <Mail01 className="h-4 w-4" /> */}
                          </a>
                        </div>
                        <ErrorMessage
                          name="third_party_handling.address.email"
                          component="div"
                          className="text-red-500 text-xs mt-1"
                        />
                      </div>
                      <div className="col-span-3 lg:col-span-1">
                        <Label htmlFor="handling_reference">Reference</Label>
                      </div>
                      <div className="col-span-3 lg:col-span-2">
                        <Field
                          name="handling_reference"
                          type="text"
                          style={{ height: "44px" }}
                          disabled={isClosed}
                          className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg bg-white hover:border-gray-400 focus:outline-none  text-sm sm:text-base"
                        />
                        <ErrorMessage
                          name="handling_reference"
                          component="div"
                          className="text-red-500 text-xs mt-1"
                        />
                      </div>
                    </div>
                    <div className="mt-8 border-t border-cloudGray" />
                  </form>

                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      {/* Incorrect MID Reference */}
                      <div className="col-span-3 lg:col-span-1 my-4">
                        <Label htmlFor="showMidSearchLog">
                          Incorrect MID Search Log
                        </Label>
                      </div>
                      <div className="col-span-3 justify-between lg:col-span-2 lg:flex my-4">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            id="showMidSearchLog"
                            checked={showMidSearchLog}
                            onChange={(e) =>
                              setShowMidSearchLog(e.target.checked)
                            }
                            disabled={isClosed}
                            className="w-4 h-4 accent-[#00249c] border-gray-300 focus:ring-custom-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">
                            Yes
                          </span>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Incorrect MID Search Log */}
                  {showMidSearchLog && (
                    <div className="py-5 px-6 bg-error-rose">
                      <div className="border-b border-cloudGray my-5">
                        <h2 className="text-secondary text-lg font-weight-600">
                          Incorrect MID Search Log
                        </h2>
                        <p className="pb-5 text-lightGray text-sm font-normal">
                          Details for Incorrect MID Search Log
                        </p>
                      </div>
                      <form className="space-y-4">
                        <div className="grid grid-cols-3 gap-4">
                          {/* Incorrect MID Reference */}
                          <div className="col-span-3 lg:col-span-1">
                            <Label htmlFor="incorrect_mid_reference">
                              Incorrect MID Reference
                            </Label>
                          </div>
                          <div className="col-span-3 lg:col-span-2">
                            <Field
                              name="incorrect_mid_reference"
                              type="text"
                              style={{ height: "44px" }}
                              disabled={isClosed}
                              className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg bg-white hover:border-gray-400 focus:outline-none  text-sm sm:text-base"
                            />
                            <ErrorMessage
                              name="incorrect_mid_reference"
                              component="div"
                              className="text-red-500 text-xs mt-1"
                            />
                          </div>

                          {/* Conducting the new MID */}
                          <div className="col-span-3 lg:col-span-1">
                            <Label htmlFor="handler_id">
                              Conducting the new MID
                            </Label>
                          </div>
                          <div className="col-span-3 lg:col-span-2">
                            <Field name="handler_id">
                              {({ field, form, meta }: any) => (
                                <div>
                                  <CustomSelect
                                    options={handlers.map((h: any) => ({
                                      value: h.id,
                                      label: h.label,
                                    }))}
                                    value={
                                      handlers
                                        .map((h: any) => ({
                                          value: h.id,
                                          label: h.label,
                                        }))
                                        .find(
                                          (opt: any) =>
                                            opt.value === field.value
                                        ) || { value: "", label: "" }
                                    }
                                    onChange={(option) =>
                                      form.setFieldValue(
                                        "handler_id",
                                        option ? option.value : 0
                                      )
                                    }
                                    placeholder="Select reason"
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

                          {/* Incorrect Acc */}
                          <div className="col-span-3 lg:col-span-1">
                            <Label htmlFor="incorrect_acc">Incorrect Acc</Label>
                          </div>
                          <div className="col-span-3 lg:col-span-2">
                            <Field name="incorrect_acc">
                              {({ field, form }: any) => (
                                <DatePicker
                                  isDisabled={isClosed}
                                  value={incorrectAccDate}
                                  onChange={(newDate) => {
                                    setIncorrectAccDate(newDate);
                                    form.setFieldValue(
                                      "incorrect_acc",
                                      formatDate(newDate)
                                    );
                                  }}
                                  className="w-full"
                                />
                              )}
                            </Field>
                            <ErrorMessage
                              name="incorrect_acc"
                              component="div"
                              className="text-red-500 text-xs mt-1"
                            />
                          </div>
                          <div className="col-span-3 lg:col-span-1">
                            {/* Initial Eng made  */}
                            <Label htmlFor="initial_eng_made">
                              Initial Eng Made
                            </Label>
                          </div>
                          <div className="col-span-3 lg:col-span-2">
                            <Field name="initial_eng_made">
                              {({ field, form }: any) => (
                                <DatePicker
                                  isDisabled={isClosed}
                                  value={initialEngMadeDate}
                                  onChange={(newDate) => {
                                    setInitialEngMadeDate(newDate);
                                    form.setFieldValue(
                                      "initial_eng_made",
                                      formatDate(newDate)
                                    );
                                  }}
                                  className="w-full"
                                />
                              )}
                            </Field>
                            <ErrorMessage
                              name="initial_eng_made"
                              component="div"
                              className="text-red-500 text-xs mt-1"
                            />
                          </div>

                          <div className="col-span-3 lg:col-span-1">
                            {/* New Mid conduct */}
                            <Label htmlFor="new_mid">New MID Conduct</Label>
                          </div>
                          {/* <div className="col-span-3 lg:col-span-2">
                          <Field
                            name="new_mid"
                            type="text"
                            style={{ height: '44px' }}
                            disabled={isClosed}
                            className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg bg-white hover:border-gray-400 focus:outline-none  text-sm sm:text-base"
                          />
                          <ErrorMessage name="new_mid" component="div" className="text-red-500 text-xs mt-1" />
                        </div> */}
                          <div className="col-span-3 lg:col-span-2">
                            <Field name="new_mid">
                              {({ field, form }: any) => (
                                <DatePicker
                                  isDisabled={isClosed}
                                  value={newConductDate}
                                  onChange={(newDate) => {
                                    setNewConductDate(newDate);
                                    form.setFieldValue(
                                      "new_mid",
                                      formatDate(newDate)
                                    );
                                  }}
                                  className="w-full"
                                />
                              )}
                            </Field>
                            <ErrorMessage
                              name="initial_eng_made"
                              component="div"
                              className="text-red-500 text-xs mt-1"
                            />
                          </div>
                          {/* New MID Search Ref */}
                          <div className="col-span-3 lg:col-span-1">
                            <Label htmlFor="new_mid_search_ref">
                              New MID Search Ref
                            </Label>
                          </div>
                          <div className="col-span-3 lg:col-span-2">
                            <Field
                              name="new_mid_search_ref"
                              as="textarea"
                              rows={3}
                              disabled={isClosed}
                              placeholder="Describe new MID search details..."
                              className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg bg-white hover:border-gray-400 focus:outline-none  resize-none"
                            />
                            <ErrorMessage
                              name="new_mid_search_ref"
                              component="div"
                              className="text-red-500 text-xs mt-1"
                            />
                          </div>

                          {/*Conducting new MID */}
                          <div className="col-span-3 lg:col-span-1">
                            <Label htmlFor="reason_new_mid_id">
                              Reason for new MID?
                            </Label>
                          </div>
                          <div className="col-span-3 lg:col-span-2">
                            <Field name="reason_new_mid_id">
                              {({ field, form, meta }: any) => (
                                <div>
                                  <CustomSelect
                                    options={midReason.map((h: any) => ({
                                      value: h.id,
                                      label: h.label,
                                    }))}
                                    value={
                                      midReason
                                        .map((h: any) => ({
                                          value: h.id,
                                          label: h.label,
                                        }))
                                        .find(
                                          (opt: any) =>
                                            opt.value === field.value
                                        ) || { value: "", label: "" }
                                    }
                                    onChange={(option) =>
                                      form.setFieldValue(
                                        "reason_new_mid_id",
                                        option ? option.value : 0
                                      )
                                    }
                                    placeholder="Select reason"
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

                          {/* Incorrect Reg */}
                          <div className="col-span-3 lg:col-span-1">
                            <Label htmlFor="incorrect_reg">Incorrect Reg</Label>
                          </div>
                          <div className="col-span-3 lg:col-span-2">
                            <Field
                              name="incorrect_reg"
                              type="text"
                              style={{ height: "44px" }}
                              disabled={isClosed}
                              className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg bg-white hover:border-gray-400 focus:outline-none  text-sm sm:text-base"
                            />
                            <ErrorMessage
                              name="incorrect_reg"
                              component="div"
                              className="text-red-500 text-xs mt-1"
                            />
                          </div>

                          {/* New Mid Search Processed */}
                          <div className="col-span-3 lg:col-span-1">
                            <Label htmlFor="new_mid_search_processed">
                              New MID Search Processed?
                            </Label>
                          </div>
                          <div className="col-span-3 justify-between lg:col-span-2 lg:flex">
                            <label className="flex items-center">
                              <Field
                                type="checkbox"
                                name="new_mid_search_processed"
                                disabled={isClosed}
                                className="w-4 h-4 accent-[#00249c] border-gray-300 focus:ring-custom-500"
                              />
                              <span className="ml-2 text-sm text-gray-700">
                                Yes
                              </span>
                            </label>
                          </div>
                        </div>
                        <div className="mt-8 border-t border-cloudGray" />
                      </form>
                    </div>
                  )}

                  {/* Notification Details */}
                  <div className="border-b border-cloudGray my-5">
                    <h2 className="text-secondary text-lg font-weight-600">
                      Notification Details
                    </h2>
                    <p className="pb-5 text-lightGray text-sm font-normal">
                      Enter details for Notification
                    </p>
                  </div>
                  <form className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="col-span-3 lg:col-span-1">
                        <Label htmlFor="abi_insured">
                          ABI First Notification
                        </Label>
                      </div>
                      <div className="col-span-3 justify-between lg:col-span-2 lg:flex">
                        <div className="flex gap-1 text-xs text-custom hover:cursor-pointer hover:underline">
                          <p className="text-sm">Send Notification</p>
                          <TopRightIcon />
                        </div>
                        <label className="flex items-center text-sm text-lightGray font-normal">
                          sent on:{" "}
                          {values.created_at
                            ? new Date(values.created_at).toLocaleString()
                            : "00/00/0000, 00:00 AM"}
                        </label>
                      </div>
                      <div className="col-span-3 lg:col-span-1">
                        <Label htmlFor="payment_pack">Payment Pack</Label>
                      </div>
                      <div className="col-span-3 justify-between lg:col-span-2 lg:flex">
                        <div
                          className="flex gap-1 text-xs text-custom hover:cursor-pointer hover:underline"
                          onClick={() =>
                            formikRef.current
                              .submitForm()
                              .then(() =>
                                handleSubmit(
                                  formikRef.current.values,
                                  { setSubmitting: () => {} },
                                  "send_payment_pack"
                                )
                              )
                          }
                        >
                          <p className="text-sm">Send Payment Pack</p>
                          <TopRightIcon />
                        </div>
                        <label className="flex items-center text-sm text-lightGray font-normal">
                          sent on:{" "}
                          {values.updated_at
                            ? new Date(values.updated_at).toLocaleString()
                            : "00/00/0000, 00:00 AM"}
                        </label>
                      </div>
                    </div>
                    <div className="mt-8 border-t border-cloudGray" />
                  </form>

                  {/* Liability Details */}
                  <div>
                    <div className="border-b border-cloudGray my-5">
                      <h2 className="text-secondary text-lg font-weight-600">
                        Liability Details
                      </h2>
                      <p className="pb-5 text-lightGray text-sm font-normal">
                        Details for Liability
                      </p>
                    </div>
                    <form className="space-y-4">
                      <div className="grid grid-cols-3 gap-4">
                        <div className="col-span-3 lg:col-span-1">
                          <Label htmlFor="abi_insured">ABI Insurer</Label>
                        </div>
                        <div className="col-span-3 justify-between lg:col-span-2 lg:flex">
                          <label className="flex items-center">
                            <Field
                              type="checkbox"
                              name="abi_insured"
                              disabled={isClosed}
                              className="w-4 h-4 accent-[#00249c] border-gray-300 focus:ring-custom-500"
                            />
                            <span className="ml-2 text-sm text-gray-700">
                              Yes
                            </span>
                          </label>
                        </div>
                        {/* Liability Stance */}
                        <div className="col-span-3 lg:col-span-1">
                          <Label htmlFor="liability_stance_id">
                            Liability Stance
                          </Label>
                        </div>
                        <div className="col-span-3 lg:col-span-2">
                          <Field name="liability_stance_id">
                            {({ field, form, meta }: any) => (
                              <div>
                                <CustomSelect
                                  options={liabilityStances.map((h: any) => ({
                                    value: h.id,
                                    label: h.label,
                                  }))}
                                  value={
                                    liabilityStances
                                      .map((h: any) => ({
                                        value: h.id,
                                        label: h.label,
                                      }))
                                      .find(
                                        (opt: any) => opt.value === field.value
                                      ) || { value: "", label: "" }
                                  }
                                  onChange={(option) =>
                                    form.setFieldValue(
                                      "liability_stance_id",
                                      option ? option.value : 0
                                    )
                                  }
                                  placeholder="Select liability stance"
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

                        {/* Laibility accepted on */}

                        {(() => {
                          const selectedStance = liabilityStances.find(
                            (s: any) => s.id === values.liability_stance_id
                          );
                          const showLiabilityAcceptedOn =
                            selectedStance &&
                            (selectedStance.label === "Accepted" ||
                              selectedStance.label === "Fault");

                          return showLiabilityAcceptedOn ? (
                            <>
                              <div className="col-span-3 lg:col-span-1">
                                <Label htmlFor="liability_accepted_on">
                                  Liability Accepted On
                                </Label>
                              </div>
                              <div className="col-span-3 lg:col-span-2">
                                <Field name="liability_accepted_on">
                                  {({ field, form }: any) => (
                                    <DatePicker
                                      isDisabled={isClosed}
                                      value={liabilityAcceptedDate}
                                      onChange={(newDate) => {
                                        setLiabilityAcceptedDate(newDate);
                                        form.setFieldValue(
                                          "liability_accepted_on",
                                          formatDate(newDate)
                                        );
                                      }}
                                      className="w-full"
                                    />
                                  )}
                                </Field>
                                <ErrorMessage
                                  name="liability_accepted_on"
                                  component="div"
                                  className="text-red-500 text-xs mt-1"
                                />
                              </div>
                            </>
                          ) : null;
                        })()}

                        {/* Settlement status  */}
                        <div className="col-span-3 lg:col-span-1">
                          <Label htmlFor="settlement_status_id">
                            Settlement Status
                          </Label>
                        </div>
                        <div className="col-span-3 lg:col-span-2">
                          <Field name="settlement_status_id">
                            {({ field, form, meta }: any) => (
                              <div>
                                <CustomSelect
                                  options={settlementStatus.map((h: any) => ({
                                    value: h.id,
                                    label: h.label,
                                  }))}
                                  value={
                                    settlementStatus
                                      .map((h: any) => ({
                                        value: h.id,
                                        label: h.label,
                                      }))
                                      .find(
                                        (opt: any) => opt.value === field.value
                                      ) || { value: "", label: "" }
                                  }
                                  onChange={(option) =>
                                    form.setFieldValue(
                                      "settlement_status_id",
                                      option ? option.value : 0
                                    )
                                  }
                                  placeholder="Select settlement status"
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
                      <div className="mt-8 border-t border-cloudGray" />
                    </form>
                  </div>
                </>
              );
            }}
          </Formik>
        </div>
        <Modal
          open={insurerModal}
          onClose={() => {
            setInsurerModal(false);
          }}
          classNames={{
            overlay: "custom-overlay",
            modal: "custom-modal",
          }}
          closeIcon={
            <FaTimes size={2} className="text-[#717680] font-normal w-5 h-5" />
          }
        >
          <h2 className="text-[16px] mb-4 text-center">Insurer Detail</h2>
          <hr />
          <iframe
            src="https://www.gtacredithire.com/chc-insurer-details/"
            width="100%"
            height="700"
            title="Insurer Detail"
            className="border-none"
          ></iframe>
        </Modal>
      </ErrorBoundary>
    );
  }
);

ThirdPartyInsurer.displayName = "ThirdPartyInsurer";

export default ThirdPartyInsurer;
