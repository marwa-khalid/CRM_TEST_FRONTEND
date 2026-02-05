import {
  useState,
  useEffect,
  forwardRef,
  useImperativeHandle,
  useRef,
} from "react";
import { ChevronDown, Mail } from "lucide-react";
import { useParams } from "react-router-dom";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import {
  getReferrer,
  createReferrer,
  getCompanySuggestions,
  updateReferrer,
} from "../../services/Referrer/Referrer";
import LeafletAutocompleteMap from "../GoogleMapAutoComplete/GoogleMapAutoComplete";
import debounce from "lodash.debounce";
import CustomSelect from "../ReactSelect/ReactSelect";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import { useSelector } from "react-redux";
import { getLocalTimeZone, today } from "@internationalized/date";
import type { DateValue } from "react-aria-components";
import { DatePicker } from "../application/date-picker/date-picker";
import { CalendarDate } from "@internationalized/date";
import { toast } from "react-toastify";

interface Company {
  id: string;
  company_name?: string;
  address?: string;
  postcode?: string;
  primary_contact_number?: string;
  contact_name?: string;
  contact_number?: string;
  contact_email?: string;
  solicitor?: string;
  third_party_capture?: string;

  driver_commission?: {
    on_hire_amount?: string;
    on_hire_paid_on?: string;
    congestion_charges?: string;
    other_charges?: string;
    off_hire_amount?: string;
    off_hire_paid_on?: string;
  };

  referrer_commission?: {
    on_hire_amount?: string;
    on_hire_paid_on?: string;
    off_hire_amount?: string;
    off_hire_paid_on?: string;
  };
}
interface FormValues {
  referrer_id?: number;
  claim_id?: number;
  companyName: string;
  address: string;
  postcode: string;
  telephoneMain: string;
  email: string;
  contactName: string;
  contactTelephone: string;
  onHirePayment: string;
  paidOn: string;
  congestionCharges: string;
  otherCharges: string;
  offHirePaymentReferrer: string;
  offHirePaidOn: string;
  solicitor: string;
  thirdPartyCapture: string;
  onHirePaymentAmount: string;
  onHirePaymentPaidOn: string;
  offHirePaymentDriver: string;
  offHirePaymentPaidOn: string;
  backEndPaymentAmount: string;
  backEndPaymentPaidOn: string;
}

interface ReferrerDetailsProps {
  claimData?: any;
  Mode?: boolisEditean;
  onSuccess?: () => void;
  handleNext?: (step: number, direction: string) => void;
}

const validationSchema = Yup.object().shape({
  // companyName: Yup.string().required('Company name is required'),
  // address: Yup.string().required('Address is required'),
  // postcode: Yup.string().required('Postcode is required'),
  // email: Yup.string().email('Invalid email format').required('Email is required'),
  // contactName: Yup.string().required('Contact name is required'),
  // contactTelephone: Yup.string().required('Contact telephone is required'),
  // onHirePayment: Yup.string().required('On hire payment is required'),
  // // paidOn: Yup.string().required('Paid on date is required'),
  // congestionCharges: Yup.string().required('Congestion charges are required'),
  // otherCharges: Yup.string().required('Other charges are required'),
  // // offHirePaidOn: Yup.string().required('Off hire paid on date is required'),
  // solicitor: Yup.string().required('Solicitor is required'),
  // thirdPartyCapture: Yup.string().required('Third party capture is required'),
  // onHirePaymentAmount: Yup.string().required('On hire payment amount is required'),
  // // onHirePaymentPaidOn: Yup.string().required('On hire payment paid on date is required'),
  // offHirePaymentDriver: Yup.string().required('Off hire payment amount is required'),
  // offHirePaymentPaidOn: Yup.string().required('Off hire payment paid on date is required'),
});

const ReferrerDetails = forwardRef(
  ({ onSuccess, handleNext, skipNext }: ReferrerDetailsProps, ref) => {
    const { id } = useParams();
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [claimId, setClaimId] = useState<number | null>(null);
    const [suggestions, setSuggestions] = useState<Company[]>([]);
    const [typing, setTyping] = useState(false);
    const [loadingSuggestions, setLoadingSuggestions] = useState(false);
    const formikRef = useRef<any>(null);
    const now = today(getLocalTimeZone());

    const [offHirePaidOn, setOffHirePaidOn] = useState<DateValue | null>(null);
    const [paidOn, setPaidOn] = useState<DateValue | null>(null);
    const [onHirePaymentPaidOn, setOnHirePaymentPaidOn] =
      useState<DateValue | null>(null);
    const [offHirePaymentPaidOn, setOffHirePaymentPaidOn] =
      useState<DateValue | null>(null);

    const { isClosed, selectedPosition } = useSelector(
      (state) => state.isClosed
    );

    const searchParams = new URLSearchParams(window.location.search);
    const claimID = searchParams.get("claimid");

    const [initialValues, setInitialValues] = useState<FormValues>({
      referrer_id: undefined,
      claim_id: claimId || undefined,
      companyName: "",
      address: "",
      postcode: "",
      telephoneMain: "",
      email: "",
      contactName: "",
      contactTelephone: "",
      onHirePayment: "",
      paidOn: "",
      congestionCharges: "",
      otherCharges: "",
      offHirePaymentReferrer: "",
      offHirePaidOn: "",//Driver com
      solicitor: "",
      thirdPartyCapture: "Not Allowed",
      onHirePaymentAmount: "",
      onHirePaymentPaidOn: "",//referrer com
      offHirePaymentDriver: "",
      offHirePaymentPaidOn: "",
      backEndPaymentAmount: "",
      backEndPaymentPaidOn: "",
    });

    useEffect(() => {
      window.scrollTo(0, 0);
    }, []);

    useEffect(() => {
      const currentClaimId = claimID || id;
      if (currentClaimId) {
        const loadData = async () => {
          if (currentClaimId) {
            await fetchReferrer(currentClaimId);
          }
        };
        loadData();
      }
    }, [id, claimID]);

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

    const parseCalendarDate = (dateStr?: string) => {
      if (!dateStr) return undefined;
      const [year, month, day] = dateStr.split("-").map(Number);
      if (!year || !month || !day) return undefined;
      return new CalendarDate(year, month, day);
    };

    const fetchReferrer = async (claim_id: string) => {
      try {
        setIsLoading(true);
        const response = await getReferrer(claim_id);
        const referrerData = response.data || response;

        if (referrerData) {
          setIsEditing(true);
          setInitialValues({
            referrer_id: referrerData.id,
            claim_id: claim_id,
            companyName: referrerData.company_name || "",
            address: referrerData.address || "",
            postcode: referrerData.postcode || "",
            telephoneMain: referrerData.primary_contact_number || "",
            email: referrerData.email || referrerData.contact_email || "",
            contactName: referrerData.contact_name || "",
            contactTelephone: referrerData.contact_number || "",
            onHirePayment:
              referrerData.driver_commission.on_hire_amount?.toString() || "",
            paidOn: referrerData.driver_commission.on_hire_paid_on || "",
            congestionCharges:
              referrerData.driver_commission.congestion_charges?.toString() ||
              "",
            otherCharges:
              referrerData.driver_commission.other_charges?.toString() || "",
            offHirePaymentReferrer:
              referrerData.referrer_commission.off_hire_payment?.toString() ||
              referrerData.referrer_commission.off_hire_amount?.toString() ||
              "",
            offHirePaidOn:
              referrerData.referrer_commission.off_hire_paid_on || "",
            solicitor: referrerData.solicitor || "",
            thirdPartyCapture: referrerData.third_party_capture || "Allowed",
            onHirePaymentAmount:
              referrerData.referrer_commission.on_hire_amount?.toString() || "",
            onHirePaymentPaidOn:
              referrerData.driver_commission.on_hire_paid_on || "",
            offHirePaymentDriver:
              referrerData.driver_commission.off_hire_amount?.toString() ||
              "",
            offHirePaymentPaidOn:
              referrerData.driver_commission.off_hire_paid_on || "",
          });
          setOffHirePaymentPaidOn(
            parseCalendarDate(referrerData.referrer_commission.off_hire_paid_on)
          );
          setOffHirePaidOn(
            parseCalendarDate(referrerData.driver_commission.off_hire_paid_on)
          );
          setOnHirePaymentPaidOn(
            parseCalendarDate(referrerData.referrer_commission.on_hire_paid_on)
          );
          setPaidOn(
            parseCalendarDate(referrerData.driver_commission.on_hire_paid_on)
          );
        }
      } catch (error) {
        console.error("Error fetching referrer:", error);
        // Set initial values to default if fetch fails
        setInitialValues({
          referrer_id: undefined,
          claim_id: claimId || undefined,
          companyName: "",
          address: "",
          postcode: "",
          telephoneMain: "",
          email: "",
          contactName: "",
          contactTelephone: "",
          onHirePayment: "",
          paidOn: "",
          congestionCharges: "",
          otherCharges: "",
          offHirePaymentReferrer: "",
          offHirePaidOn: "",
          solicitor: "",
          thirdPartyCapture: "Not Allowed",
          onHirePaymentAmount: "",
          onHirePaymentPaidOn: "",
          offHirePaymentDriver: "",
          offHirePaymentPaidOn: "",
          backEndPaymentAmount: "",
          backEndPaymentPaidOn: "",
        });
      } finally {
        setIsLoading(false);
      }
    };

    const formatDate = (val: string | Date | null) => {
      if (!val) return null;
      const d = new Date(val);
      return d.toISOString().split("T")[0];
    };

    const handleSubmit = async (values: FormValues) => {
      try {
        setIsLoading(true);
        const storedClaimId = id || claimID;
        const storedReferrerId = localStorage.getItem("currentReferrerId");
        const payload = {
          claim_id: storedClaimId,
          referrer_id: storedReferrerId
            ? parseInt(storedReferrerId, 10)
            : values.referrer_id,
          company_name: values.companyName,
          address: values.address.address || values.address,
          postcode: values.postcode,
          primary_contact_number: "3123",
          contact_email: values.email,
          contact_name: values.contactName,
          contact_number: values.contactTelephone,
          on_hire_payment: parseFloat(values.onHirePayment) || "",
          paidOn: paidOn,
          driver_commission: {
            congestion_charges: parseFloat(values.congestionCharges) || "",
            other_charges: parseFloat(values.otherCharges) || "",
            off_hire_amount: parseFloat(values.offHirePaymentDriver) || "",
            off_hire_paid_on: formatDate(offHirePaidOn),
            on_hire_amount: parseFloat(values.onHirePayment) || "",
            on_hire_paid_on: formatDate(paidOn),
          },
          referrer_commission: {
            on_hire_amount: values.onHirePaymentAmount,
            on_hire_paid_on: formatDate(onHirePaymentPaidOn),
            off_hire_amount: values.offHirePaymentReferrer,
            off_hire_paid_on: formatDate(offHirePaymentPaidOn),
          },
          solicitor: values.solicitor,
          third_party_capture: values.thirdPartyCapture,
        };
        let response: any;
        if (storedClaimId && isEditing) {
          response = await updateReferrer(payload, storedClaimId);
        } else {
          response = await createReferrer(payload);
        }

        toast.success("Referrer Details saved successfully");
        if (response.data?.claim_id) {
          localStorage.setItem(
            "currentClaimId",
            response.data.claim_id.toString()
          );
        }

        if (onSuccess) {
          onSuccess();
        }
        if (handleNext && selectedPosition.key !== "sideBar") {
          handleNext(3, "next");
        }
      } catch (error: any) {
        toast.error("Unable to save referral details");
        console.error("Error submitting form:", error);
      } finally {
        setIsLoading(false);
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

    const formatToTwoDecimals = (value: string): string => {
      if (value === "" || value === null || value === undefined) return "";

      const num = parseFloat(value);
      if (isNaN(num)) return value;

      return num.toFixed(2);
    };
    return (
      <div className=" sm:pt-8 pb-8 sm:pb-12 sm:pr-4 lg:pr-10 bg-white">
        <Formik
          innerRef={formikRef}
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
          enableReinitialize
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
              handleBlur(e); // Call Formik's original blur handler
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
                onHirePayment: company.driver_commission?.on_hire_amount || "",
                paidOn: company.driver_commission?.on_hire_paid_on || "",
                congestionCharges:
                  company.driver_commission?.congestion_charges || "",
                otherCharges: company.driver_commission?.other_charges || "",
                offHirePaymentReferrer:
                  company.referrer_commission?.off_hire_amount || "",
                offHirePaidOn:
                  company.driver_commission?.off_hire_paid_on || "",
                onHirePaymentAmount:
                  company.referrer_commission?.on_hire_amount || "",
                onHirePaymentPaidOn:
                  company.referrer_commission?.on_hire_paid_on || "",
                offHirePaymentDriver:
                  company.driver_commission?.off_hire_amount || "",
                offHirePaymentPaidOn:
                  company.referrer_commission?.off_hire_paid_on || "",
                solicitor: company.solicitor || "",
                thirdPartyCapture: company.third_party_capture || "",
                referrer_id: company.id || "",
              };

              // 1) Update Formik live values
              Object.entries(newValues).forEach(([key, value]) => {
                setFieldValue(key, value);
              });

              // 2) Update initial values (for reinitialization support)
              setInitialValues((prev) => ({
                ...prev,
                ...newValues,
              }));

              setSuggestions([]);
              setTyping(false);
            };

            return (
              <Form>
                <Field type="hidden" name="referrer_id" />
                <Field type="hidden" name="claim_id" />

                <div className="flex-1 p-0 sm:p-0 mt-2">
                  {/* Referrer & Reporting Details Section */}
                  <div className="bg-white mb-6">
                    <div className="pb-6">
                      <h2 className="text-lg font-semibold  mb-2 sm:text-xl">
                        Referrer & Reporting Details
                      </h2>
                      <p className="text-sm text-gray-600">
                        Please provide the referrer's company information and
                        contact details.
                      </p>
                      <hr className="mt-6 ml-[20px] w-full" />
                    </div>
                    <div className="w-[102%]">
                      <div className="">
                        <div
                          className="flex flex-col mt-2 sm:flex-row sm:items-center"
                          style={{ height: "100px" }}
                        >
                          <label className="w-full sm:w-1/4 text-sm font-medium text-gray-700">
                            Company Name
                          </label>
                          <div className="w-full ml-2 sm:w-3/4 relative">
                            <Field name="companyName">
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
                                            className="px-4 py-3 hover:bg-[#252B37] cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors duration-150 group"
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
                                              <div className="text-sm text-gray-600 group-hover:text-white truncate">
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
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-start gap-2 mb-4">
                          <label className="w-full sm:w-1/4 text-sm font-medium text-gray-700">
                            Address
                          </label>
                          <div className="w-full sm:w-3/4">
                            <LeafletAutocompleteMap
                              showMap={false}
                              apiKey={import.meta.env.VITE_GOOGLE_MAP_KEY}
                              address={initialValues.address}
                              onPlaceSelected={(place) => {
                                if (place.name) {
                                  setFieldValue("address", place.address);
                                  setFieldValue("postcode", place?.postalCode);
                                }
                              }}
                              disabled={isClosed}
                            />
                            <ErrorMessage
                              name="address"
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
                              name="postcode"
                              type="text"
                              style={{ height: "44px" }}
                              disabled={isClosed}
                              className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg bg-white hover:border-gray-400 focus:outline-none  text-sm sm:text-base"
                            />
                            <ErrorMessage
                              name="postcode"
                              component="div"
                              className="text-red-500 text-xs mt-1"
                            />
                          </div>
                        </div>
                      </div>

                      <div>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-4">
                          <label className="w-full sm:w-1/4 text-sm font-medium text-gray-700">
                            Email
                          </label>
                          <div className="relative w-full sm:w-3/4">
                            <Field
                              name="email"
                              type="email"
                              style={{ height: "44px" }}
                              disabled={isClosed}
                              className="w-full pl-10 pr-3 sm:pl-10 sm:pr-3 border border-gray-300 rounded-lg bg-white hover:border-gray-400 focus:outline-none text-sm sm:text-base"
                            />
                            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                              <a
                                href="https://outlook.office.com/mail/deeplink/compose?to=usaleem651@gmail.com"
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <Mail className="h-4 w-4" />
                              </a>
                            </div>
                            <ErrorMessage
                              name="email"
                              component="div"
                              className="text-red-500 text-xs mt-1"
                            />
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-4">
                          <label className="w-full sm:w-1/4 text-sm font-medium text-gray-700">
                            Contact Name
                          </label>
                          <div className="relative w-full sm:w-3/4">
                            <Field
                              name="contactName"
                              type="text"
                              style={{ height: "44px" }}
                              disabled={isClosed}
                              className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg bg-white hover:border-gray-400 focus:outline-none  text-sm sm:text-base"
                            />
                            <ErrorMessage
                              name="contactName"
                              component="div"
                              className="text-red-500 text-xs mt-1"
                            />
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-4">
                          <label className="w-full sm:w-1/4 text-sm font-medium text-gray-700">
                            Mobile Number
                          </label>

                          <Field name="contactTelephone">
                            {({ field, form, meta }: any) => (
                              <div className="w-full sm:w-3/4">
                                <PhoneInput
                                  country="gb"
                                  value={field.value}
                                  disabled={isClosed}
                                  placeholder="+44"
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
                              </div>
                            )}
                          </Field>
                          <ErrorMessage
                            name="contactTelephone"
                            component="div"
                            className="text-red-500 text-xs mt-1"
                          />
                        </div>
                      </div>
                    </div>
                    <hr className="text-slate-300" />
                  </div>

                  {/* Driver Commission Payments Section */}
                  <div className="bg-white border-b border-gray-200 mb-6">
                    <div className="border-b border-gray-200">
                      <h2 className="text-lg font-semibold text-gray-900 mb-2">
                        Driver Commission Payments
                      </h2>
                      <p className="text-sm mb-2 text-gray-600">
                        Enter Driver Commision Details{" "}
                      </p>
                    </div>

                    <div className="py-6 w-[102%]">
                      <div className="grid gap-8">
                        <div>
                          {/* On Hire Payment */}
                          <div className="flex flex-col sm:flex-row sm:items-start gap-2 mb-4">
                            <label className="w-full mr-4 sm:w-1/4 text-sm font-medium text-gray-700">
                              On Hire Payment
                            </label>
                            <div className="flex flex-col sm:flex-row w-full sm:w-3/4 gap-2">
                              <div className="flex flex-1 border border-gray-300 rounded-lg bg-white h-10 sm:h-12">
                                <div className="flex items-center px-2 sm:px-3 rounded-lg">
                                  <span className="text-sm sm:text-base">
                                    £
                                  </span>
                                </div>
                                <Field
                                  name="onHirePayment"
                                  type="number"
                                  step="0.01"
                                  placeholder="0.00"
                                  style={{ height: "44px" }}
                                  disabled={isClosed}
                                  className="flex-1 p-2 sm:p-3 text-sm sm:text-base focus:outline-none"
                                  onBlur={(
                                    e: React.FocusEvent<HTMLInputElement>
                                  ) => handleNumberBlur(e, "onHirePayment")}
                                />
                                {/* <div className="relative w-16 sm:w-20">
                                <select className="w-full h-full px-2 sm:px-3 rounded-lg bg-white appearance-none cursor-pointer focus:outline-none text-sm sm:text-base">
                                  <option>GBP</option>
                                </select>
                                <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-gray-500 pointer-events-none" />
                              </div> */}
                              </div>
                            </div>
                          </div>

                          {/* Paid On */}
                          <div className="flex flex-col sm:flex-row sm:items-start gap-2 mb-4">
                            <label className="w-1/4 mr-8 text-sm font-medium text-gray-700">
                              Paid On
                            </label>
                            <div className=" w-[81%]">
                              <Field name="paidOn">
                                {({ field, form }: any) => (
                                  <DatePicker
                                    isDisabled={isClosed}
                                    value={paidOn}
                                    onChange={setPaidOn}
                                    className=" mt-1 z-1"
                                  />
                                )}
                              </Field>
                            </div>
                          </div>

                          {/* Congestion Charges */}
                          <div className="flex flex-col sm:flex-row sm:items-start gap-2 mb-4">
                            <label className="w-full sm:w-1/4  mr-4  text-sm font-medium text-gray-700">
                              Congestion Charges
                            </label>
                            <div className="flex flex-col sm:flex-row w-full sm:w-3/4 gap-2">
                              <div className="flex flex-1 border border-gray-300 rounded-lg bg-white h-10 sm:h-12">
                                <div className="flex items-center px-2 sm:px-3 rounded-lg">
                                  <span className="text-sm sm:text-base">
                                    £
                                  </span>
                                </div>
                                <Field
                                  name="congestionCharges"
                                  type="number"
                                  step="0.01"
                                  placeholder="0.00"
                                  style={{ height: "44px" }}
                                  disabled={isClosed}
                                  className="flex-1 p-2 sm:p-3 text-sm sm:text-base focus:outline-none"
                                  onBlur={(
                                    e: React.FocusEvent<HTMLInputElement>
                                  ) => handleNumberBlur(e, "congestionCharges")}
                                />
                                {/* <div className="relative w-16 sm:w-20">
                                <select disabled={isClosed} className="w-full h-full px-2 sm:px-3 rounded-lg bg-white appearance-none cursor-pointer focus:outline-none text-sm sm:text-base">
                                  <option>GBP</option>
                                </select>
                                <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-gray-500 pointer-events-none" />
                              </div> */}
                              </div>
                            </div>
                          </div>

                          {/* Other Charges */}
                          <div className="flex flex-col sm:flex-row sm:items-start gap-2 mb-4">
                            <label className="w-full sm:w-1/4 text-sm  mr-4  font-medium text-gray-700">
                              Other Charges
                            </label>
                            <div className="flex flex-col sm:flex-row w-full sm:w-3/4 gap-2">
                              <div className="flex flex-1 border border-gray-300 rounded-lg bg-white h-10 sm:h-12">
                                <div className="flex items-center px-2 sm:px-3 rounded-lg">
                                  <span className="text-sm sm:text-base">
                                    £
                                  </span>
                                </div>
                                <Field
                                  name="otherCharges"
                                  type="number"
                                  style={{ height: "44px" }}
                                  disabled={isClosed}
                                  step="0.01"
                                  placeholder="0.00"
                                  className="flex-1 p-2 sm:p-3 text-sm sm:text-base focus:outline-none"
                                  onBlur={(
                                    e: React.FocusEvent<HTMLInputElement>
                                  ) => handleNumberBlur(e, "otherCharges")}
                                />
                                {/* <div className="relative w-16 sm:w-20">
                                <select disabled={isClosed} className="w-full h-full px-2 sm:px-3 rounded-lg bg-white appearance-none cursor-pointer focus:outline-none text-sm sm:text-base">
                                  <option>GBP</option>
                                </select>
                                <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-gray-500 pointer-events-none" />
                              </div> */}
                              </div>
                            </div>
                          </div>

                          {/* Off Hire Payment */}
                          <div className="flex flex-col sm:flex-row sm:items-start gap-2 mb-4">
                            <label className="w-full  mr-4  sm:w-1/4 text-sm font-medium text-gray-700">
                              Off Hire Payment
                            </label>
                            <div className="flex flex-col sm:flex-row w-full sm:w-3/4 gap-2">
                              <div className="flex flex-1 border border-gray-300 rounded-lg bg-white h-10 sm:h-12">
                                <div className="flex items-center px-2 sm:px-3 rounded-lg">
                                  <span className="text-sm sm:text-base">
                                    £
                                  </span>
                                </div>
                                {/* Driver Commission Payments */}
                                <Field
                                  name="offHirePaymentDriver"
                                  type="number"
                                  step="0.01"
                                  style={{ height: "40px" }}
                                  disabled={isClosed}
                                  placeholder="0.00"
                                  className="flex-1 p-2 sm:p-3 text-sm sm:text-base focus:outline-none"
                                  onBlur={(
                                    e: React.FocusEvent<HTMLInputElement>
                                  ) => handleNumberBlur(e, "offHirePaymentDriver")}
                                />
                                {/* <div className="relative w-16 sm:w-20">
                                <select className="w-full h-full px-2 sm:px-3 rounded-lg bg-white appearance-none cursor-pointer focus:outline-none text-sm sm:text-base">
                                  <option>GBP</option>
                                </select>
                                <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-gray-500 pointer-events-none" />
                              </div> */}
                              </div>
                            </div>
                          </div>

                          {/* Off Hire Paid On */}
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-4">
                            <label className="w-full  mr-4  sm:w-1/4 text-sm font-medium text-gray-700">
                              Off Hire Paid On
                            </label>
                            <div className=" w-[82%]  sm:w-3/4">
                              <Field
                                name="offHirePaidOn"
                                className="w-full p-3 border border-gray-300 rounded-lg bg-white cursor-pointer focus:outline-none "
                              >
                                {({ field }) => (
                                  <DatePicker
                                    isDisabled={isClosed}
                                    value={offHirePaidOn}
                                    onChange={setOffHirePaidOn}
                                    className="mt-1 z-50"
                                  />
                                )}
                              </Field>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Referrer Commission Review Section */}
                  <div className="bg-white w-[126%]">
                    <div className="pb-6 border-b border-gray-200">
                      <h2 className="text-lg font-semibold text-gray-900 mb-2">
                        Referrer Commission Review
                      </h2>
                      <p className="text-sm text-gray-600">
                        Enter Referrer Commision review details
                      </p>
                    </div>

                    <div className="py-6">
                      {/* On Hire Payment Amount + Paid On */}
                      <div className="flex flex-col sm:flex-row sm:items-center mb-4">
                        <label className="w-full sm:w-1/4  text-sm font-medium text-gray-700">
                          On Hire Payment Amount
                        </label>
                        <div className="flex ml-7 flex-col sm:flex-row w-full sm:w-3/4 gap-2">
                          <div className="flex flex-1 border border-gray-300 ml-[-65px] rounded-lg bg-white h-10 sm:h-12">
                            <div className="flex items-center px-2 sm:px-3 rounded-lg">
                              <span className="text-sm sm:text-base">£</span>
                            </div>
                            <Field
                              name="onHirePaymentAmount"
                              type="number"
                              style={{ height: "44px" }}
                              step="0.01"
                              disabled={isClosed}
                              placeholder="0.00"
                              className="flex-1 p-2 sm:p-3 text-sm sm:text-base focus:outline-none"
                              onBlur={(e: React.FocusEvent<HTMLInputElement>) => 
                              handleNumberBlur(e, 'onHirePaymentAmount')}
                            />
                            {/* <div className="relative w-14 sm:w-20">
                            <select disabled={isClosed} className="w-full h-full px-2 sm:px-3 rounded-lg bg-white appearance-none cursor-pointer focus:outline-none text-sm sm:text-base">
                              <option>GBP</option>
                            </select>
                            <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-gray-500 pointer-events-none" />
                          </div> */}
                          </div>

                          <div className="flex-1 relative">
                            <label className="text-xs sm:text-sm font-medium text-gray-700 mx-10 ">
                              Paid On
                            </label>
                            <Field
                              name="onHirePaymentPaidOn"
                              className="w-full p-3 border border-gray-300 rounded-lg bg-white cursor-pointer focus:outline-none "
                            >
                              {({ field }) => (
                                <div className="relative inline-block mb-8">
                                  <DatePicker
                                    isDisabled={isClosed}
                                    value={onHirePaymentPaidOn}
                                    onChange={setOnHirePaymentPaidOn}
                                    className="absolute top-full left-0 mt-1 z-10"
                                  />
                                </div>
                              )}
                            </Field>
                          </div>
                        </div>
                      </div>

                      {/* Off Hire Payment Amount + Paid On */}
                      <div className="flex flex-col sm:flex-row sm:items-center mb-4">
                        <label className="w-full sm:w-1/4  text-sm font-medium text-gray-700">
                          Off Hire Payment Amount
                        </label>
                        <div className="flex ml-7 flex-col sm:flex-row w-full sm:w-3/4 gap-2">
                          <div className="flex flex-1 border border-gray-300 ml-[-65px] rounded-lg bg-white h-10 sm:h-12">
                            <div className="flex items-center px-2 sm:px-3 rounded-lg">
                              <span className="text-sm sm:text-base">£</span>
                            </div>
                            {/* Referrer Commission Review */}
                            <Field
                              name="offHirePaymentReferrer"
                              type="number"
                              step="0.01"
                              style={{ height: "44px" }}
                              disabled={isClosed}
                              placeholder="0.00"
                              className="flex-1 p-2 sm:p-3 text-sm sm:text-base focus:outline-none"
                              onBlur={(e: React.FocusEvent<HTMLInputElement>) => 
                              handleNumberBlur(e, 'offHirePaymentReferrer')}
                            />
                            {/* <div className="relative w-16 sm:w-20">
                            <select disabled={isClosed} className="w-full h-full px-2 sm:px-3 rounded-lg bg-white appearance-none cursor-pointer focus:outline-none text-sm sm:text-base">
                              <option>GBP</option>
                            </select>
                            <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-gray-500 pointer-events-none" />
                          </div> */}
                          </div>
                          <div className="flex-1 relative">
                            <label className="text-xs sm:text-sm font-medium text-gray-700 mx-10 ">
                              Paid On
                            </label>
                            <Field
                              name="offHirePaymentPaidOn"
                              className="w-full p-3 border border-gray-300 rounded-lg bg-white cursor-pointer focus:outline-none "
                            >
                              {({ field }) => (
                                <div className="relative inline-block mb-8">
                                  <DatePicker
                                    isDisabled={isClosed}
                                    value={offHirePaymentPaidOn}
                                    onChange={setOffHirePaymentPaidOn}
                                    className="absolute top-full left-0 mt-1 z-10"
                                  />
                                </div>
                              )}
                            </Field>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Referrers Nominated Solicitor Section */}
                  <div className="bg-white border-b border-gray-200 mb-6 w-[102%]">
                    <div className="pb-6 border-b border-gray-200">
                      <h2 className="text-lg font-semibold text-gray-900 mb-2">
                        Referrers Nominated Solicitor (PI must go to)
                      </h2>
                      <p className="text-sm text-gray-600"></p>
                    </div>
                    <div className="py-6">
                      <div className="grid gap-8">
                        <div>
                          {/* Solicitor */}
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-4">
                            <label className="w-full  mr-6 sm:w-1/4 text-sm font-medium text-gray-700">
                              Solicitor
                            </label>
                            <div className="relative w-full sm:w-3/4">
                              <Field
                                placeholder="Enter Solicitor Name"
                                name="solicitor"
                                type="text"
                                style={{ height: "44px" }}
                                disabled={isClosed}
                                className="w-full  sm:p-3 border  border-gray-300 rounded-lg bg-white hover:border-gray-400 focus:outline-none  text-sm sm:text-base"
                              />
                            </div>
                          </div>
                          <div>
                            {/* Third Party Capture */}
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-4">
                              <label className="w-full mr-6 sm:w-1/4 text-sm font-medium text-gray-700">
                                Third Party Capture
                              </label>
                              <div className="flex flex-wrap gap-2 sm:gap-4 w-full sm:w-3/4">
                                <label className="flex items-center cursor-pointer">
                                  <Field
                                    type="radio"
                                    name="thirdPartyCapture"
                                    value="Allowed"
                                    disabled={isClosed}
                                    className="w-4 h-4 accent-[#414651] border-gray-300 focus:ring-custom-500"
                                  />
                                  <span className="ml-1 sm:ml-2 text-xs sm:text-sm text-gray-700">
                                    Allowed
                                  </span>
                                </label>
                                <label className="flex items-center cursor-pointer">
                                  <Field
                                    type="radio"
                                    name="thirdPartyCapture"
                                    value="Not Allowed"
                                    disabled={isClosed}
                                    className="w-4 h-4 accent-[#414651] border-gray-300 focus:ring-custom-500"
                                  />
                                  <span className="ml-1 sm:ml-2 text-xs sm:text-sm text-gray-700">
                                    Not Allowed
                                  </span>
                                </label>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Form>
            );
          }}
        </Formik>
      </div>
    );
  }
);
ReferrerDetails.displayName = "ReferrerDetails";

export default ReferrerDetails;
