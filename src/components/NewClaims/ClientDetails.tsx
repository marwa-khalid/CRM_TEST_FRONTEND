import React, {
  useState,
  useEffect,
  forwardRef,
  useImperativeHandle,
  useRef,
} from "react";
import { Mail, ChevronDown } from "lucide-react";
import { useParams } from "react-router-dom";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import {
  createClient,
  getClientByClaimID,
  getLanguages,
  notifyManager,
  updateClient,
  vulnerablePersonPolicy,
} from "../../services/Client/Client.tsx";
import LeafletAutocompleteMap from "../GoogleMapAutoComplete/GoogleMapAutoComplete.tsx";
import CustomSelect from "../ReactSelect/ReactSelect.tsx";
import PhoneInput from "react-phone-input-2";
import { useDispatch, useSelector } from "react-redux";
import { setClaimReferrence } from "../../redux/Claim/claimSlice.tsx";
import { getLocalTimeZone, today } from "@internationalized/date";
import type { DateValue } from "react-aria-components";
import { DatePicker } from "../application/date-picker/date-picker";
import { CalendarDate } from "@internationalized/date";
import { MdArrowOutward } from "react-icons/md";
import { toast } from "react-toastify";
import { parseCalendarDate } from "../../common/common.tsx";

interface FormData {
  clientTitle: string;
  clientFirstName: string;
  clientSurname: string;
  onHirePaymentAmount: string;
  onHirePaidOn: string;
  address: string;
  postcode: string;
  homeTelephone: string;
  mobileTelephone: string;
  email: string;
  clientSpeakEnglish: string;
  clientPreferredLanguage: string;
  alternativeContact: string;
  contactName: string;
  contactTelephone: string;
  sortCode: string;
  accountNumber: string;
  payDriverNotificationDate: string;
  payDriverNotes: string;
  dateOfBirth: string;
  age: string;
  niNumber: string;
  occupation: string;
  vatRegistered: string;
  driverCode: string;
  dayNightDriver: string;
  driverBase: string;
  vulnerablePerson: string;
  vulnerablePersonWhy: string;
  latitude?: number;
  longitude?: number;
}

const validationSchema = Yup.object({
  // clientTitle: Yup.string().required('Title is required'),
  // clientFirstName: Yup.string()
  //   .required('First name is required')
  //   .min(2, 'First name must be at least 2 characters'),
  // clientSurname: Yup.string()
  //   .required('Surname is required')
  //   .min(2, 'Surname must be at least 2 characters'),
  // onHirePaymentAmount: Yup.number()
  //   .required('Payment amount is required')
  //   .min(0, 'Payment amount cannot be negative'),
  // onHirePaidOn: Yup.date().required('Payment date is required'),
  // address: Yup.string().required('Address is required'),
  // postcode: Yup.string().required('Postcode is required'),
  // homeTelephone: Yup.string().required('Home telephone is required'),
  // mobileTelephone: Yup.string().required('Mobile telephone is required'),
  // email: Yup.string()
  //   .email('Invalid email address')
  //   .required('Email is required'),
  // clientSpeakEnglish: Yup.string().required('This field is required'),
  // clientPreferredLanguage: Yup.string().required('Preferred language is required'),
  // alternativeContact: Yup.string().required('This field is required'),
  // contactName: Yup.string().when('alternativeContact', {
  //   is: 'Yes',
  //   then: (schema) => schema.required('Contact name is required when alternative contact is Yes'),
  //   otherwise: (schema) => schema.notRequired()
  // }),
  // contactTelephone: Yup.string().when('alternativeContact', {
  //   is: 'Yes',
  //   then: (schema) => schema.required('Contact telephone is required when alternative contact is Yes'),
  //   otherwise: (schema) => schema.notRequired()
  // }),
  // sortCode: Yup.string()
  //   .required('Sort code is required'),
  // accountNumber: Yup.string()
  //   .required('Account number is required'),
  // payDriverNotificationDate: Yup.date().nullable(),
  // payDriverNotes: Yup.string(),
  // niNumber: Yup.string()
  //   .required('NI Number is required'),
  // occupation: Yup.string().required('Occupation is required'),
  // vatRegistered: Yup.string().required('This field is required'),
  // driverCode: Yup.string().required('Driver code is required'),
  // dayNightDriver: Yup.string().required('This field is required'),
  // driverBase: Yup.string().required('Driver base is required'),
  // vulnerablePerson: Yup.string().required('This field is required'),
  // vulnerablePersonWhy: Yup.string().when('vulnerablePerson', {
  //   is: 'Yes',
  //   then: (schema) => schema.required('Reason is required for vulnerable persons'),
  //   otherwise: (schema) => schema.notRequired()
  // })
});

interface ClientDetailsProps {
  claimData?: any;
  isEditMode?: boolean;
  onSuccess?: () => void;
  formik?: any;
  handleNext?: (step: number, direction: string) => void;
}

export interface ClientDetailsHandle {
  submitForm: () => Promise<boolean>;
}
const ClientDetails = forwardRef<ClientDetailsHandle, ClientDetailsProps>(
  (
    {
      claimData,
      isEditMode,
      onSuccess,
      formik: parentFormik,
      handleNext,
      skipNext,
    },
    ref
  ) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const { id } = useParams();
    const searchParams = new URLSearchParams(window.location.search);
    const claimID = searchParams.get("claimid");
    const [languageOptions, setLanguageOptions] = useState([]);
    const now = today(getLocalTimeZone());
    const [dateOfBirth, setDateOfBirth] = useState<DateValue | null>(null);
    const [payDriverNotificationDate, setPayDriverNotificationDate] =
      useState<DateValue | null>(null);
    const [age, setAge] = useState("");

    const { isClosed } = useSelector((state) => state.isClosed);
    const dispatch = useDispatch();

    const formikRef = useRef<any>(null);

    const [initialValues, setInitialValues] = useState<FormData>({
      clientTitle: "Mr.",
      clientFirstName: "",
      clientSurname: "",
      onHirePaymentAmount: "0.00",
      onHirePaidOn: "",
      address: "",
      postcode: "",
      customOccupation: "",
      homeTelephone: "",
      mobileTelephone: "",
      email: "",
      id: "",
      clientSpeakEnglish: "Yes",
      clientPreferredLanguage: null,
      alternativeContact: "No",
      contactName: "",
      contactTelephone: "",
      sortCode: "",
      accountNumber: "",
      payDriverNotificationDate: "",
      payDriverNotes: "",
      dateOfBirth: "",
      age: "",
      niNumber: "",
      occupation: "",
      vatRegistered: "Yes",
      driverCode: "",
      dayNightDriver: "Yes",
      driverBase: "",
      vulnerablePerson: "No",
      vulnerablePersonWhy: "",
    });

    useEffect(() => {
      window.scrollTo(0, 0);
    }, []);

    useEffect(() => {
      const currentClaimId = claimID || id;
      if (currentClaimId) {
        const loadData = async () => {
          await fetchClientDetails(currentClaimId);
          getLanguages().then((res) => {
            if (res && Array.isArray(res)) {
              const mapped = res.map((lang) => ({
                value: lang.id,
                label: lang.label,
              }));
              setLanguageOptions(mapped);
            }
          });
        };
        loadData();
      }
    }, [id, claimID]);

    const handleVulnarablePersonPolicy = async () => {
      try {
        const res = await vulnerablePersonPolicy(id || claimID);
        const blob = new Blob([res.data], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });

        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "Vulnerable_Person_Policy.doc";
        document.body.appendChild(link);
        link.click();

        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
      } catch (e) {}
    };

    function openOutlookCompose(to: string, subject: string, body: string) {
      const formattedTo = to.replace(/,/g, ";").replace(/\s+/g, "");
      const encodedTo = encodeURIComponent(formattedTo);
      const encodedSubject = encodeURIComponent(subject);
      const encodedBody = encodeURIComponent(body);

      const officeUrl = `https://outlook.office.com/mail/deeplink/compose?to=${encodedTo}&subject=${encodedSubject}&body=${encodedBody}`;
      const liveUrl = `https://outlook.live.com/mail/0/deeplink/compose?to=${encodedTo}&subject=${encodedSubject}&body=${encodedBody}`;
      const mailtoUrl = `mailto:${encodedTo}?subject=${encodedSubject}&body=${encodedBody}`;

      const newTab = window.open(officeUrl, "_blank");

      if (!newTab) {
        window.location.href = mailtoUrl;
        return;
      }

      setTimeout(() => {
        try {
          window.open(liveUrl, "_blank");
        } catch (e) {
          console.warn("Live URL popup blocked or failed", e);
        }
      }, 1000);
    }

    const handleNotifyManager = async () => {
      try {
        const res = await notifyManager(id || searchParams.get("claimid"));
        const subject = res?.data?.data?.subject;
        const to = res?.data?.data?.to_semicolon || res?.data?.data?.to;
        const body =
          `Case No: ${res.data.data.reference}\n` +
          `Client: ${res?.data.data.client_name}\n\n` +
          `Date: ${res?.data.data.date}\n\n` +
          `Hi,\n${res?.data?.data?.message_body}.\n\nBest Regards,\n${res?.data?.data?.handler}`;
        openOutlookCompose(to, subject, body);
        toast.success("Manager Notification email sent");
      } catch (e) {}
    };

    const fetchClientDetails = async (currentClaimId: string | number) => {
      try {
        const res = await getClientByClaimID(currentClaimId);
        const clientData = res.data || res;

        const mappedValues = {
          clientTitle: clientData.gender || "",
          clientFirstName: clientData.first_name || "",
          clientSurname: clientData.surname || "",
          onHirePaymentAmount: "0.00",
          onHirePaidOn: "",
          id: clientData?.id,
          address: clientData.address?.address || "",
          postcode: clientData.address?.postcode || "",
          homeTelephone: clientData.address?.home_tel || "",
          mobileTelephone: clientData.address?.mobile_tel || "",
          email: clientData.address?.email || "",
          clientSpeakEnglish: clientData.speaks_clear_english ? "Yes" : "No",
          clientPreferredLanguage: clientData.language_id || null,
          alternativeContact: clientData.contact_via_alternative_person
            ? "Yes"
            : "No",
          contactName: clientData.alter_person || "",
          contactTelephone: clientData.alter_number || "",
          sortCode: clientData.sort_code || "",
          language_id: clientData.language_id,
          accountNumber: clientData.account_number || "",
          payDriverNotificationDate: "", // Adjust based on your data
          payDriverNotes: clientData.bank_details_note || "",
          niNumber: clientData.ni_number || "",
          occupation: clientData.occupation || "",
          customOccupation:
            clientData?.occupation !== "Private Hire Driver" ||
            clientData?.occupation !== "Taxi Driver"
              ? clientData?.occupation
              : "",
          vatRegistered: clientData.ci_vat_registered ? "Yes" : "No",
          driverCode: clientData.driver_code || "",
          dayNightDriver: clientData.day_driver ? "Yes" : "No",
          driverBase: clientData.driver_base || "",
          vulnerablePerson: clientData.is_vulnerable ? "Yes" : "No",
          vulnerablePersonWhy: clientData.vulnerable_note || "",
        };
        setDateOfBirth(parseCalendarDate(clientData?.date_of_birth));
        setAge(clientData?.age);
        localStorage.setItem("surname", clientData.surname);
        setIsEditing(true);
        setInitialValues(mappedValues);
      } catch (e: any) {
        console.log(e);
        if (e.detail === "Client not found") {
          setIsEditing(false);
        }
      }
    };

    const formatCalendarDate = (date?: CalendarDate): string | undefined => {
      if (!date) return undefined;
      const jsDate = new Date(date.year, date.month - 1, date.day);
      const yyyy = jsDate.getFullYear();
      const mm = String(jsDate.getMonth() + 1).padStart(2, "0");
      const dd = String(jsDate.getDate()).padStart(2, "0");
      return `${yyyy}-${mm}-${dd}`;
    };

    const handleSubmit = async (values: FormData) => {
      setLoading(true);
      setError(null);
      setSuccess(false);
      const storedClaimId = id || claimID;

      try {
        const clientData = {
          gender: values.clientTitle,
          first_name: values.clientFirstName,
          surname: values.clientSurname,
          age: age || 0,
          occupation:
            values.occupation !== "Other"
              ? values.occupation
              : values.customOccupation,
          date_of_birth: formatCalendarDate(dateOfBirth),
          ni_number: values.niNumber,
          driver_code: values.driverCode,
          day_driver: values.dayNightDriver === "Yes",
          driver_base: values.driverBase,
          // id: initialValues?.id,
          sort_code: values.sortCode,
          account_number: values.accountNumber,
          bank_details_note: values.payDriverNotes,
          ci_vat_registered: values.vatRegistered === "Yes",
          is_vulnerable: values.vulnerablePerson === "Yes",
          vulnerable_note: values.vulnerablePersonWhy,
          language_id: values.clientPreferredLanguage,
          speaks_clear_english: values.clientSpeakEnglish === "Yes",
          contact_via_alternative_person: values.alternativeContact === "Yes",
          alter_person: values.contactName,
          alter_number: values.contactTelephone,
          claim_id: parseInt(storedClaimId) || 0,
          address: {
            address: values.address,
            postcode: values.postcode,
            home_tel: values.homeTelephone,
            mobile_tel: values.mobileTelephone,
            email: values.email,
            latitude: values.latitude,
            longitude: values.longitude,
          },
        };

        localStorage.setItem("surname", clientData.surname);

        let newClient;
        if (storedClaimId && isEditing) {
          newClient = await updateClient(storedClaimId, clientData);
        } else {
          newClient = await createClient(clientData);
        }

        toast.success("Client Details saved successfully");
        const date = new Date(newClient?.created_at);
        const yyyymm = `${date.getFullYear()}${String(
          date.getMonth() + 1
        ).padStart(2, "0")}`;
        const paddedId = String(storedClaimId).padStart(4, "0");
        if (newClient?.surname === null || newClient?.surname === "") {
          localStorage.setItem(
            "reference_number",
            `${newClient.surname}-${yyyymm}-${paddedId}`
          );
          dispatch(setClaimReferrence(`Add New Claim`));
        } else {
          localStorage.setItem(
            "reference_number",
            `${newClient.surname}-${yyyymm}-${paddedId}`
          );
          dispatch(
            setClaimReferrence(`${newClient.surname}-${yyyymm}-${paddedId}`)
          );
        }
        setSuccess(true);

        if (parentFormik) {
          Object.entries(values).forEach(([key, value]) => {
            parentFormik.setFieldValue(key, value);
          });
        }

        if (onSuccess) onSuccess();
        if (handleNext && !skipNext) handleNext(4, "next");

        return newClient;
      } catch (error: any) {
        console.error("Error creating client:", error);
        toast.error("Unable to save client details");
        throw error;
      } finally {
        setLoading(false);
      }
    };

    const handlePlaceSelected = (
      place: {
        name: string;
        lat: number;
        lng: number;
        address: string;
        postalCode: string;
      },
      formik: any
    ) => {
      const currentFormik = parentFormik || formik;
      if (currentFormik) {
        currentFormik.setFieldValue(
          "address",
          place.address || place.name || ""
        );
        currentFormik.setFieldValue("postcode", place.postalCode || "");

        if (place.lat) currentFormik.setFieldValue("latitude", place.lat);
        if (place.lng) currentFormik.setFieldValue("longitude", place.lng);
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

    const getFieldError = (fieldName: keyof FormData, formik: any) => {
      return formik.touched[fieldName] && formik.errors[fieldName] ? (
        <div className="text-red-500 text-xs mt-1">
          {formik.errors[fieldName]}
        </div>
      ) : null;
    };

    const calculateAge = (calendarDate: any) => {
      if (!calendarDate) return undefined;
      const birthDate = new Date(
        calendarDate.year,
        calendarDate.month - 1,
        calendarDate.day
      );
      const today = new Date();

      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();

      if (
        monthDiff < 0 ||
        (monthDiff === 0 && today.getDate() < birthDate.getDate())
      ) {
        age--;
      }

      return age;
    };

    const calculateDOB = (e: any) => {
      const ageCalculated = calculateAge(e);
      setAge(ageCalculated);
    };

    return (
      <Formik
        innerRef={formikRef}
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
        enableReinitialize
      >
        {(formik) => (
          <Form className="flex-0 mt-10">
            <div className="flex flex-col">
              <div className="bg-white border-b border-gray-200 mb-6">
                <div className="bg-white mb-6">
                  <h2 className="text-lg font-semibold  mb-2 sm:text-xl">
                    Personal Information
                  </h2>
                  <p className="text-sm text-gray-600">
                    Enter your personal information here
                  </p>
                  <hr className="mt-6 w-full" />
                </div>

                <div className="py-6">
                  {/* Client Name */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-4 sm:mb-6">
                    <label className="w-full sm:w-1/4 text-sm font-medium text-gray-700">
                      Client Name
                    </label>
                    <div className="flex flex-col sm:flex-row w-full sm:w-3/4 gap-2 sm:gap-3">
                      <Field name="clientTitle">
                        {({ field, form, meta }: any) => {
                          const titleOptions = [
                            { value: "mr", label: "Mr." },
                            { value: "mrs", label: "Mrs." },
                            { value: "ms", label: "Ms." },
                          ];

                          return (
                            <div className="w-full sm:w-1/6">
                              <CustomSelect
                                options={titleOptions}
                                value={
                                  titleOptions.find(
                                    (opt) => opt.value === field.value
                                  ) || titleOptions[0]
                                }
                                onChange={(option) => {
                                  form.setFieldValue(
                                    field.name,
                                    option ? option.value : ""
                                  );
                                }}
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
                          name="clientFirstName"
                          placeholder="First Name"
                          style={{ height: "44px" }}
                          disabled={isClosed}
                          className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg bg-white hover:border-gray-400 focus:ring-2 focus:ring-custom-200 focus:outline-none  text-sm sm:text-base"
                        />
                        {getFieldError("clientFirstName", formik)}
                      </div>
                      <div className="flex-1">
                        <Field
                          type="text"
                          name="clientSurname"
                          placeholder="Surname"
                          style={{ height: "44px" }}
                          disabled={isClosed}
                          className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg bg-white hover:border-gray-400 focus:ring-2 focus:ring-custom-200 focus:outline-none  text-sm sm:text-base"
                        />
                        {getFieldError("clientSurname", formik)}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-4 sm:mb-6">
                    <label className="w-full sm:w-1/4 text-sm font-medium text-gray-700">
                      Date of Birth
                    </label>

                    <div className="w-full sm:w-3/4">
                      <Field name="dateOfBirth">
                        {() => {
                          const todayDate = today(getLocalTimeZone());
                          const maxDate = new CalendarDate(
                            todayDate.year - 18,
                            todayDate.month,
                            todayDate.day
                          );
                          const minDate = new CalendarDate(
                            todayDate.year - 100,
                            todayDate.month,
                            todayDate.day
                          );

                          return (
                            <DatePicker
                              className="w-full rounded-lg"
                              isDisabled={isClosed}
                              minValue={minDate}
                              maxValue={maxDate}
                              value={dateOfBirth}
                              onChange={(e) => {
                                setDateOfBirth(e);
                                calculateDOB(e);
                              }}
                            />
                          );
                        }}
                      </Field>

                      {getFieldError("dateOfBirth", formik)}
                    </div>
                  </div>

                  {/* Age */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-4 sm:mb-6">
                    <label className="w-full sm:w-1/4 text-sm font-medium text-gray-700">
                      Age
                    </label>
                    <div className="w-full sm:w-3/4">
                      <Field
                        type="number"
                        name="age"
                        value={age}
                        style={{ height: "44px" }}
                        readOnly
                        disabled={isClosed}
                        className="w-full focus:ring-2 focus:ring-custom-200 focus:outline-none p-2 sm:p-3 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed text-sm sm:text-base"
                      />

                      {getFieldError("age", formik)}
                    </div>
                  </div>
                  {/* NI Number */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-4 sm:mb-6">
                    <label className="w-full sm:w-1/4 text-sm font-medium text-gray-700">
                      NI Number
                    </label>
                    <div className="w-full sm:w-3/4">
                      <Field
                        type="text"
                        name="niNumber"
                        disabled={isClosed}
                        style={{ height: "44px" }}
                        placeholder=""
                        className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg bg-white hover:border-gray-400 focus:ring-2 focus:ring-custom-200 focus:outline-none  text-sm sm:text-base"
                      />
                      {getFieldError("niNumber", formik)}
                    </div>
                  </div>
                  {/* Occupation */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-4 sm:mb-6">
                    <label className="w-full sm:w-1/4 text-sm font-medium text-gray-700">
                      Occupation
                    </label>
                    <div className="w-full sm:w-3/4">
                      {/* <Field
                        type="text"
                        name="occupation"
                        disabled={isClosed}
                        style={{ height: '44px' }}
                        className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg bg-white hover:border-gray-400 focus:ring-2 focus:ring-custom-200 focus:outline-none  text-sm sm:text-base"
                      /> */}
                      <Field name="occupation">
                        {({ field, form, meta }: any) => {
                          const options = [
                            {
                              value: "Private Hire Driver",
                              label: "Private Hire Driver",
                            },
                            { value: "Taxi Driver", label: "Taxi Driver" },
                            { value: "Other", label: "Other" },
                          ];

                          const currentOccupation =
                            field.value || field.occupation;
                          const isOccupationValid = options.some(
                            (option) => option.value === currentOccupation
                          );

                          if (
                            !isOccupationValid &&
                            currentOccupation !== "Other"
                          ) {
                            form.setFieldValue("occupation", "Other");
                          }

                          return (
                            <div>
                              <CustomSelect
                                options={options}
                                value={
                                  options.find(
                                    (opt) => opt.value === field.value
                                  ) || null
                                }
                                onChange={(option) =>
                                  form.setFieldValue(
                                    "occupation",
                                    option
                                      ? option.value
                                      : "Private Hire Driver"
                                  )
                                }
                                placeholder="Select Occupation"
                                disabled={isClosed}
                              />
                            </div>
                          );
                        }}
                      </Field>
                      {getFieldError("occupation", formik)}
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-4 sm:mb-6">
                    <label className="w-full sm:w-1/4 text-sm font-medium text-gray-700"></label>
                    <div className="w-full sm:w-3/4">
                      {formik.values.occupation === "Other" && (
                        <div className="mt-3">
                          <input
                            type="text"
                            id="customOccupation"
                            name="customOccupation"
                            className="w-full p-2 border rounded-lg focus:outline-none"
                            value={formik.values.customOccupation}
                            onChange={(e) => {
                              formik.setFieldValue(
                                "customOccupation",
                                e.target.value
                              );
                            }}
                            placeholder="Enter custom occupation"
                            disabled={isClosed}
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-4 sm:mb-6">
                    <label className="w-full sm:w-1/4 text-sm font-medium text-gray-700">
                      Driver Code
                    </label>
                    <div className="w-full sm:w-3/4">
                      <Field
                        type="text"
                        name="driverCode"
                        style={{ height: "44px" }}
                        disabled={isClosed}
                        className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg bg-white hover:border-gray-400 focus:ring-2 focus:ring-custom-200 focus:outline-none  text-sm sm:text-base"
                      />
                      {getFieldError("driverCode", formik)}
                    </div>
                  </div>
                  {/* Day/Night Driver */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-4 sm:mb-6">
                    <label className="w-full sm:w-1/4 text-sm font-medium text-gray-700">
                      Day/Night Driver
                    </label>
                    <div className="w-full sm:w-3/4">
                      <Field name="dayNightDriver">
                        {({ field, form }: any) => {
                          const options = [
                            { value: "No", label: "No" },
                            { value: "Yes", label: "Yes" },
                          ];

                          return (
                            <div>
                              <CustomSelect
                                options={options}
                                value={
                                  options.find(
                                    (opt) => opt.value === field.value
                                  ) || null
                                }
                                onChange={(option) =>
                                  form.setFieldValue(
                                    "dayNightDriver",
                                    option ? option.value : "No"
                                  )
                                }
                                placeholder="Select driver option"
                                disabled={isClosed}
                              />
                            </div>
                          );
                        }}
                      </Field>
                      <ErrorMessage
                        name="dayNightDriver"
                        component="div"
                        className="text-red-500 text-xs mt-1"
                      />
                      {/* <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" /> */}
                    </div>
                  </div>
                  {/* Driver Base */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-4 sm:mb-6">
                    <label className="w-full sm:w-1/4 text-sm font-medium text-gray-700">
                      Driver Base
                    </label>
                    <div className="w-full sm:w-3/4">
                      <Field
                        type="text"
                        disabled={isClosed}
                        style={{ height: "44px" }}
                        name="driverBase"
                        className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg bg-white hover:border-gray-400 focus:ring-2 focus:ring-custom-200 focus:outline-none  text-sm sm:text-base"
                      />
                      {getFieldError("driverBase", formik)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* Contact Details Section */}
            <div className="bg-white border-b border-gray-200 mb-6">
              <div className="pb-6 flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">
                    Contact Information
                  </h2>
                  <p className="text-sm text-gray-600">
                    Enter the Contact Information
                  </p>
                </div>
              </div>
            </div>
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-4 sm:mb-6">
                <label className="w-full sm:w-1/4 text-sm font-medium text-gray-700 sm:mt-3">
                  Address
                </label>
                <div className="w-full sm:w-3/4">
                  <div className="mt-4">
                    <LeafletAutocompleteMap
                      showMap={false}
                      apiKey={import.meta.env.VITE_GOOGLE_MAP_KEY}
                      address={initialValues.address}
                      onPlaceSelected={(place) =>
                        handlePlaceSelected(place, formik)
                      }
                      disabled={isClosed}
                    />
                  </div>
                  {/* )} */}
                </div>
              </div>

              {/* Postcode */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-4 sm:mb-6">
                <label className="w-full sm:w-1/4 text-sm font-medium text-gray-700">
                  Postcode
                </label>
                <div className="w-full sm:w-3/4">
                  <Field
                    type="text"
                    name="postcode"
                    style={{ height: "44px" }}
                    disabled={isClosed}
                    className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg bg-white hover:border-gray-400 focus:ring-2 focus:ring-custom-200 focus:outline-none  text-sm sm:text-base"
                  />
                  {getFieldError("postcode", formik)}
                </div>
              </div>
              {/* Home Telephone */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-4 sm:mb-6">
                <label className="w-full sm:w-1/4 text-sm font-medium text-gray-700">
                  Home Telephone
                </label>
                <div className="w-full sm:w-3/4">
                  <Field name="homeTelephone">
                    {({ field, form }: any) => (
                      <PhoneInput
                        country="gb"
                        value={field.value}
                        placeholder='+44'
                        onChange={(value) =>
                          form.setFieldValue(field.name, value)
                        }
                        inputStyle={{
                          width: "100%",
                          height: "44px",
                          fontSize: "16px",
                        }}
                        containerStyle={{ width: "100%" }}
                        disabled={isClosed}
                      />
                    )}
                  </Field>
                  {getFieldError("homeTelephone", formik)}
                </div>
              </div>
              {/* Mobile Telephone */}
              <div className="flex sm:items-center gap-2 ">
                <label className="w-full sm:w-1/4 text-sm font-medium text-gray-700">
                  Mobile Number
                </label>
                <div className="w-full sm:w-3/4">
                  <Field name="mobileTelephone">
                    {({ field, form }: any) => (
                      <PhoneInput
                        country="gb"
                        value={field.value}
                        placeholder='+44'
                        onChange={(value) =>
                          form.setFieldValue(field.name, value)
                        }
                        inputStyle={{
                          width: "100%",
                          height: "44px",
                          fontSize: "16px",
                        }}
                        containerStyle={{ width: "100%" }}
                        disabled={isClosed}
                      />
                    )}
                  </Field>
                  {getFieldError("mobileTelephone", formik)}
                </div>
              </div>
              {/* Email */}
              <div className="flex flex-col mt-4 sm:flex-row sm:items-center gap-2 mb-6 sm:mb-2">
                <label className="w-full sm:w-1/4 text-sm font-medium text-gray-700">
                  Email
                </label>
                <div className="relative w-full sm:w-3/4">
                  <Field
                    type="email"
                    name="email"
                    style={{ height: "44px" }}
                    disabled={isClosed}
                    className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg bg-white hover:border-gray-400 focus:ring-2 focus:ring-custom-200 focus:outline-none"
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                    <Mail className="h-4 w-4" />
                  </div>
                  {getFieldError("email", formik)}
                </div>
              </div>

              <div>
                {/* Preferred Language */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-4 mt-3 sm:mb-6">
                  <label className="w-full sm:w-1/4 text-sm font-medium text-gray-700">
                    Client's Preferred Language
                  </label>
                  <div className="w-full sm:w-3/4">
                    <Field name="clientPreferredLanguage">
                      {({ field, form, meta }: any) => {
                        return (
                          <div className="w-full">
                            <CustomSelect
                              options={languageOptions}
                              value={
                                languageOptions.find(
                                  (opt) => opt.value === field.value
                                ) || null
                              }
                              onChange={(option) =>
                                form.setFieldValue(
                                  field.name,
                                  option ? option.value : ""
                                )
                              }
                              placeholder="Select preferred language"
                              disabled={isClosed}
                            />
                          </div>
                        );
                      }}
                    </Field>

                    {getFieldError("clientPreferredLanguage", formik)}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-4 sm:mb-6">
                  <label className="w-full sm:w-1/4 text-sm font-medium text-gray-700">
                    Does the client speak clear english?
                  </label>
                  <div className="w-full sm:w-3/4 flex gap-4">
                    <label className="flex items-center">
                      <Field
                        type="radio"
                        name="clientSpeakEnglish"
                        value="Yes"
                        disabled={isClosed}
                        className="w-4 h-4 accent-[#414651] border-gray-300 focus:ring-custom-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Yes</span>
                    </label>
                    <label className="flex items-center">
                      <Field
                        type="radio"
                        name="clientSpeakEnglish"
                        value="No"
                        disabled={isClosed}
                        className="w-4 h-4 accent-[#414651] border-gray-300 focus:ring-custom-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">No</span>
                    </label>
                  </div>
                </div>

                {/* Alternative Contact */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-4 sm:mb-6">
                  <label className="w-full sm:w-1/4 text-sm font-medium text-gray-700">
                    Client has requested that we place all contact through an
                    alternative person
                  </label>
                  <div className="w-full sm:w-3/4 flex gap-4">
                    <label className="flex items-center">
                      <Field
                        type="radio"
                        name="alternativeContact"
                        value="Yes"
                        disabled={isClosed}
                        className="w-4 h-4 accent-[#414651] border-gray-300 focus:ring-custom-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Yes</span>
                    </label>
                    <label className="flex items-center">
                      <Field
                        type="radio"
                        name="alternativeContact"
                        value="No"
                        disabled={isClosed}
                        className="w-4 h-4 accent-[#414651] border-gray-300 focus:ring-custom-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">No</span>
                    </label>
                  </div>
                  {getFieldError("alternativeContact", formik)}
                </div>

                {/* Contact Name */}
                {formik.values.alternativeContact === "Yes" && (
                  <>
                    {/* Contact Name */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-4 sm:mb-6">
                      <label className="w-full sm:w-1/4 text-sm font-medium text-gray-700">
                        Contact Name
                      </label>
                      <div className="w-full sm:w-3/4">
                        <Field
                          type="text"
                          name="contactName"
                          style={{ height: "44px" }}
                          disabled={isClosed}
                          className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg bg-white hover:border-gray-400 focus:ring-2 focus:ring-custom-200 focus:outline-none  text-sm sm:text-base"
                        />
                        {getFieldError("contactName", formik)}
                      </div>
                    </div>
                    {/* Contact Telephone */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-4 sm:mb-6">
                      <label className="w-full sm:w-1/4 text-sm font-medium text-gray-700">
                        Contact Telephone
                      </label>
                      <div className="w-full sm:w-3/4">
                        <Field
                          type="tel"
                          name="contactTelephone"
                          disabled={isClosed}
                          style={{ height: "44px" }}
                          className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg bg-white hover:border-gray-400 focus:ring-2 focus:ring-custom-200 focus:outline-none  text-sm sm:text-base"
                        />
                        {getFieldError("contactTelephone", formik)}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
            {/* Bank Details Section */}
            <div className="bg-white border-y border-gray-200 ">
              <div className="py-6 border-b border-gray-200 flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">
                    Bank Details
                  </h2>
                  <p className="text-sm text-gray-600">Enter Bank Details</p>
                </div>
                <button
                  onClick={() => {
                    window.open(
                      "https://onlinebusiness.lloydsbank.co.uk/business/logon/login.jsp?LBGAc=T1BUT1VUTVVMVElNRVNTQUdF.MQ==.QU1DVlNfMjMwRDY0M0U1QTI1NTA5ODBBNDk1REI2JTQwQWRvYmVPcmc=.MQ==.QU1DVl8yMzBENjQzRTVBMjU1MDk4MEE0OTVEQjYlNDBBZG9iZU9yZw==.LTIxMjExNzkwMzN8TUNJRFRTfDIwMDY5fE1DTUlEfDgyMzE1NTA0NTUzMjUyMTA2OTQxNzUwNTE3MzQyMjk2MjgyMjYzfE1DQUFNTEgtMTczNDUxNjk1Nnw2fE1DQUFNQi0xNzM0NTE2OTU2fDZHMXluWWNMUHVpUXhZWnJzel9wa3FmTEc5eU1YQnBiMnpYNWR2SmRZUUp6UFhJbWRqMHl8TUNPUFRPVVQtMTczMzkxOTM1NnN8Tk9ORXxNQ0FJRHxOT05FfHZWZXJzaW9ufDUuMy4w.QU1DVl8yMzBENjQzRTVBMjU1MDk4MEE0OTVEQjYlNDBBZG9iZU9yZw==.LTIxMjExNzkwMzN8TUNJRFRTfDIwMDY5fE1DTUlEfDgyMzE1NTA0NTUzMjUyMTA2OTQxNzUwNTE3MzQyMjk2MjgyMjYzfE1DQUFNTEgtMTczNDUxNjk1Nnw2fE1DQUFNQi0xNzM0NTE2OTU2fDZHMXluWWNMUHVpUXhZWnJzel9wa3FmTEc5eU1YQnBiMnpYNWR2SmRZUUp6UFhJbWRqMHl8TUNPUFRPVVQtMTczMzkxOTM1NnN8Tk9ORXxNQ0FJRHxOT05FfHZWZXJzaW9ufDUuMy4w.QU1DVl84Rjk5MTYwRTU3MUZDMDQyN0YwMDAxMDElNDBBZG9iZU9yZw==.LTExMjQxMDY2ODB8TUNNSUR8MjM0NTY3OTExMTI0NzU3NTg5MzE5OTM0ODE5MjQ1NDg2MzU2ODF8TUNBSUR8Tk9ORXx2VmVyc2lvbnw1LjIuMA==.TEJHYzM=.eXN1c3RyeDAyMDBYNExGbGxveWRzYmFua2NvbQ==.T1BUT1VUTVVMVEk=.MDowfGMxOjF8YzM6MHxjNTowfGM0OjB8YzI6MA==.QU1DVl8yMzBENjQzRTVBMjU1MDk4MEE0OTVEQjYlNDBBZG9iZU9yZw==.LTIxMjExNzkwMzN8TUNJRFRTfDIwMDY5fE1DTUlEfDgyMzE1NTA0NTUzMjUyMTA2OTQxNzUwNTE3MzQyMjk2MjgyMjYzfE1DQUFNTEgtMTczNDUxNjk1Nnw2fE1DQUFNQi0xNzM0NTE2OTU2fDZHMXluWWNMUHVpUXhZWnJzel9wa3FmTEc5eU1YQnBiMnpYNWR2SmRZUUp6UFhJbWRqMHl8TUNPUFRPVVQtMTczMzkxOTM1NnN8Tk9ORXxNQ0FJRHxOT05FfHZWZXJzaW9ufDUuMy4w.dHM=.bWJxY3FzbWs=&LBGAc=T1BUT1VUTVVMVElNRVNTQUdF.MQ==.QU1DVlNfMjMwRDY0M0U1QTI1NTA5ODBBNDk1REI2JTQwQWRvYmVPcmc=.MQ==.QU1DVl8yMzBENjQzRTVBMjU1MDk4MEE0OTVEQjYlNDBBZG9iZU9yZw==.LTIxMjExNzkwMzN8TUNJRFRTfDIwMDY5fE1DTUlEfDgyMzE1NTA0NTUzMjUyMTA2OTQxNzUwNTE3MzQyMjk2MjgyMjYzfE1DQUFNTEgtMTczNDUxNjk1Nnw2fE1DQUFNQi0xNzM0NTE2OTU2fDZHMXluWWNMUHVpUXhZWnJzel9wa3FmTEc5eU1YQnBiMnpYNWR2SmRZUUp6UFhJbWRqMHl8TUNPUFRPVVQtMTczMzkxOTM1NnN8Tk9ORXxNQ0FJRHxOT05FfHZWZXJzaW9ufDUuMy4w.QU1DVl8yMzBENjQzRTVBMjU1MDk4MEE0OTVEQjYlNDBBZG9iZU9yZw==.LTIxMjExNzkwMzN8TUNJRFRTfDIwMDY5fE1DTUlEfDgyMzE1NTA0NTUzMjUyMTA2OTQxNzUwNTE3MzQyMjk2MjgyMjYzfE1DQUFNTEgtMTczNDUxNjk1Nnw2fE1DQUFNQi0xNzM0NTE2OTU2fDZHMXluWWNMUHVpUXhZWnJzel9wa3FmTEc5eU1YQnBiMnpYNWR2SmRZUUp6UFhJbWRqMHl8TUNPUFRPVVQtMTczMzkxOTM1NnN8Tk9ORXxNQ0FJRHxOT05FfHZWZXJzaW9ufDUuMy4w.QU1DVl84Rjk5MTYwRTU3MUZDMDQyN0YwMDAxMDElNDBBZG9iZU9yZw==.LTExMjQxMDY2ODB8TUNNSUR8MjM0NTY3OTExMTI0NzU3NTg5MzE5OTM0ODE5MjQ1NDg2MzU2ODF8TUNBSUR8Tk9ORXx2VmVyc2lvbnw1LjIuMA==.TEJHYzM=.eXN1c3RyeDAyMDBYNExGbGxveWRzYmFua2NvbQ==.T1BUT1VUTVVMVEk=.MDowfGMxOjF8YzM6MHxjNTowfGM0OjB8YzI6MA==.QU1DVl8yMzBENjQzRTVBMjU1MDk4MEE0OTVEQjYlNDBBZG9iZU9yZw==.LTIxMjExNzkwMzN8TUNJRFRTfDIwMDY5fE1DTUlEfDgyMzE1NTA0NTUzMjUyMTA2OTQxNzUwNTE3MzQyMjk2MjgyMjYzfE1DQUFNTEgtMTczNDUxNjk1Nnw2fE1DQUFNQi0xNzM0NTE2OTU2fDZHMXluWWNMUHVpUXhZWnJzel9wa3FmTEc5eU1YQnBiMnpYNWR2SmRZUUp6UFhJbWRqMHl8TUNPUFRPVVQtMTczMzkxOTM1NnN8Tk9ORXxNQ0FJRHxOT05FfHZWZXJzaW9ufDUuMy4w.dHM=.bWJxY3J4OGk=&LBGAc=T1BUT1VUTVVMVElNRVNTQUdF.MQ==.QU1DVlNfMjMwRDY0M0U1QTI1NTA5ODBBNDk1REI2JTQwQWRvYmVPcmc=.MQ==.QU1DVl8yMzBENjQzRTVBMjU1MDk4MEE0OTVEQjYlNDBBZG9iZU9yZw==.LTIxMjExNzkwMzN8TUNJRFRTfDIwMDY5fE1DTUlEfDgyMzE1NTA0NTUzMjUyMTA2OTQxNzUwNTE3MzQyMjk2MjgyMjYzfE1DQUFNTEgtMTczNDUxNjk1Nnw2fE1DQUFNQi0xNzM0NTE2OTU2fDZHMXluWWNMUHVpUXhZWnJzel9wa3FmTEc5eU1YQnBiMnpYNWR2SmRZUUp6UFhJbWRqMHl8TUNPUFRPVVQtMTczMzkxOTM1NnN8Tk9ORXxNQ0FJRHxOT05FfHZWZXJzaW9ufDUuMy4w.QU1DVl8yMzBENjQzRTVBMjU1MDk4MEE0OTVEQjYlNDBBZG9iZU9yZw==.LTIxMjExNzkwMzN8TUNJRFRTfDIwMDY5fE1DTUlEfDgyMzE1NTA0NTUzMjUyMTA2OTQxNzUwNTE3MzQyMjk2MjgyMjYzfE1DQUFNTEgtMTczNDUxNjk1Nnw2fE1DQUFNQi0xNzM0NTE2OTU2fDZHMXluWWNMUHVpUXhZWnJzel9wa3FmTEc5eU1YQnBiMnpYNWR2SmRZUUp6UFhJbWRqMHl8TUNPUFRPVVQtMTczMzkxOTM1NnN8Tk9ORXxNQ0FJRHxOT05FfHZWZXJzaW9ufDUuMy4w.QU1DVl84Rjk5MTYwRTU3MUZDMDQyN0YwMDAxMDElNDBBZG9iZU9yZw==.LTExMjQxMDY2ODB8TUNNSUR8MjM0NTY3OTExMTI0NzU3NTg5MzE5OTM0ODE5MjQ1NDg2MzU2ODF8TUNBSUR8Tk9ORXx2VmVyc2lvbnw1LjIuMA==.TEJHYzM=.eXN1c3RyeDAyMDBYNExGbGxveWRzYmFua2NvbQ==.T1BUT1VUTVVMVEk=.MDowfGMxOjF8YzM6MHxjNTowfGM0OjB8YzI6MA==.QU1DVl8yMzBENjQzRTVBMjU1MDk4MEE0OTVEQjYlNDBBZG9iZU9yZw==.LTIxMjExNzkwMzN8TUNJRFRTfDIwMDY5fE1DTUlEfDgyMzE1NTA0NTUzMjUyMTA2OTQxNzUwNTE3MzQyMjk2MjgyMjYzfE1DQUFNTEgtMTczNDUxNjk1Nnw2fE1DQUFNQi0xNzM0NTE2OTU2fDZHMXluWWNMUHVpUXhZWnJzel9wa3FmTEc5eU1YQnBiMnpYNWR2SmRZUUp6UFhJbWRqMHl8TUNPUFRPVVQtMTczMzkxOTM1NnN8Tk9ORXxNQ0FJRHxOT05FfHZWZXJzaW9ufDUuMy4w.dHM=.bWJxY3M4MmQ=&LBGAc=T1BUT1VUTVVMVElNRVNTQUdF.MQ==.QU1DVlNfMjMwRDY0M0U1QTI1NTA5ODBBNDk1REI2JTQwQWRvYmVPcmc=.MQ==.QU1DVl8yMzBENjQzRTVBMjU1MDk4MEE0OTVEQjYlNDBBZG9iZU9yZw==.LTIxMjExNzkwMzN8TUNJRFRTfDIwMDY5fE1DTUlEfDgyMzE1NTA0NTUzMjUyMTA2OTQxNzUwNTE3MzQyMjk2MjgyMjYzfE1DQUFNTEgtMTczNDUxNjk1Nnw2fE1DQUFNQi0xNzM0NTE2OTU2fDZHMXluWWNMUHVpUXhZWnJzel9wa3FmTEc5eU1YQnBiMnpYNWR2SmRZUUp6UFhJbWRqMHl8TUNPUFRPVVQtMTczMzkxOTM1NnN8Tk9ORXxNQ0FJRHxOT05FfHZWZXJzaW9ufDUuMy4w.QU1DVl8yMzBENjQzRTVBMjU1MDk4MEE0OTVEQjYlNDBBZG9iZU9yZw==.LTIxMjExNzkwMzN8TUNJRFRTfDIwMDY5fE1DTUlEfDgyMzE1NTA0NTUzMjUyMTA2OTQxNzUwNTE3MzQyMjk2MjgyMjYzfE1DQUFNTEgtMTczNDUxNjk1Nnw2fE1DQUFNQi0xNzM0NTE2OTU2fDZHMXluWWNMUHVpUXhZWnJzel9wa3FmTEc5eU1YQnBiMnpYNWR2SmRZUUp6UFhJbWRqMHl8TUNPUFRPVVQtMTczMzkxOTM1NnN8Tk9ORXxNQ0FJRHxOT05FfHZWZXJzaW9ufDUuMy4w.QU1DVl84Rjk5MTYwRTU3MUZDMDQyN0YwMDAxMDElNDBBZG9iZU9yZw==.LTExMjQxMDY2ODB8TUNNSUR8MjM0NTY3OTExMTI0NzU3NTg5MzE5OTM0ODE5MjQ1NDg2MzU2ODF8TUNBSUR8Tk9ORXx2VmVyc2lvbnw1LjIuMA==.TEJHYzM=.eXN1c3RyeDAyMDBYNExGbGxveWRzYmFua2NvbQ==.T1BUT1VUTVVMVEk=.MDowfGMxOjF8YzM6MHxjNTowfGM0OjB8YzI6MA==.QU1DVl8yMzBENjQzRTVBMjU1MDk4MEE0OTVEQjYlNDBBZG9iZU9yZw==.LTIxMjExNzkwMzN8TUNJRFRTfDIwMDY5fE1DTUlEfDgyMzE1NTA0NTUzMjUyMTA2OTQxNzUwNTE3MzQyMjk2MjgyMjYzfE1DQUFNTEgtMTczNDUxNjk1Nnw2fE1DQUFNQi0xNzM0NTE2OTU2fDZHMXluWWNMUHVpUXhZWnJzel9wa3FmTEc5eU1YQnBiMnpYNWR2SmRZUUp6UFhJbWRqMHl8TUNPUFRPVVQtMTczMzkxOTM1NnN8Tk9ORXxNQ0FJRHxOT05FfHZWZXJzaW9ufDUuMy4w.dHM=.bWJxZGR2em0=&LBGAc=T1BUT1VUTVVMVElNRVNTQUdF.MQ==.QU1DVlNfMjMwRDY0M0U1QTI1NTA5ODBBNDk1REI2JTQwQWRvYmVPcmc=.MQ==.QU1DVl8yMzBENjQzRTVBMjU1MDk4MEE0OTVEQjYlNDBBZG9iZU9yZw==.LTIxMjExNzkwMzN8TUNJRFRTfDIwMDY5fE1DTUlEfDgyMzE1NTA0NTUzMjUyMTA2OTQxNzUwNTE3MzQyMjk2MjgyMjYzfE1DQUFNTEgtMTczNDUxNjk1Nnw2fE1DQUFNQi0xNzM0NTE2OTU2fDZHMXluWWNMUHVpUXhZWnJzel9wa3FmTEc5eU1YQnBiMnpYNWR2SmRZUUp6UFhJbWRqMHl8TUNPUFRPVVQtMTczMzkxOTM1NnN8Tk9ORXxNQ0FJRHxOT05FfHZWZXJzaW9ufDUuMy4w.QU1DVl8yMzBENjQzRTVBMjU1MDk4MEE0OTVEQjYlNDBBZG9iZU9yZw==.LTIxMjExNzkwMzN8TUNJRFRTfDIwMDY5fE1DTUlEfDgyMzE1NTA0NTUzMjUyMTA2OTQxNzUwNTE3MzQyMjk2MjgyMjYzfE1DQUFNTEgtMTczNDUxNjk1Nnw2fE1DQUFNQi0xNzM0NTE2OTU2fDZHMXluWWNMUHVpUXhZWnJzel9wa3FmTEc5eU1YQnBiMnpYNWR2SmRZUUp6UFhJbWRqMHl8TUNPUFRPVVQtMTczMzkxOTM1NnN8Tk9ORXxNQ0FJRHxOT05FfHZWZXJzaW9ufDUuMy4w.QU1DVl84Rjk5MTYwRTU3MUZDMDQyN0YwMDAxMDElNDBBZG9iZU9yZw==.LTExMjQxMDY2ODB8TUNNSUR8MjM0NTY3OTExMTI0NzU3NTg5MzE5OTM0ODE5MjQ1NDg2MzU2ODF8TUNBSUR8Tk9ORXx2VmVyc2lvbnw1LjIuMA==.TEJHYzM=.eXN1c3RyeDAyMDBYNExGbGxveWRzYmFua2NvbQ==.T1BUT1VUTVVMVEk=.MDowfGMxOjF8YzM6MHxjNTowfGM0OjB8YzI6MA==.QU1DVl8yMzBENjQzRTVBMjU1MDk4MEE0OTVEQjYlNDBBZG9iZU9yZw==.LTIxMjExNzkwMzN8TUNJRFRTfDIwMDY5fE1DTUlEfDgyMzE1NTA0NTUzMjUyMTA2OTQxNzUwNTE3MzQyMjk2MjgyMjYzfE1DQUFNTEgtMTczNDUxNjk1Nnw2fE1DQUFNQi0xNzM0NTE2OTU2fDZHMXluWWNMUHVpUXhZWnJzel9wa3FmTEc5eU1YQnBiMnpYNWR2SmRZUUp6UFhJbWRqMHl8TUNPUFRPVVQtMTczMzkxOTM1NnN8Tk9ORXxNQ0FJRHxOT05FfHZWZXJzaW9ufDUuMy4w.dHM=.bWJxZGR4aXE=&LBGAc=QU1DVlNfMjMwRDY0M0U1QTI1NTA5ODBBNDk1REI2JTQwQWRvYmVPcmc=.MQ==.T1BUT1VUTVVMVElNRVNTQUdF.MQ==.QU1DVl8yMzBENjQzRTVBMjU1MDk4MEE0OTVEQjYlNDBBZG9iZU9yZw==.LTIxMjExNzkwMzN8TUNJRFRTfDIwMzkyfE1DTUlEfDgwNTgzMjc0NTY0MzY1OTk3MDQyMTg3NjQ1MzQzNzQ5NTE5MDIwfE1DQUFNTEgtMTc2MjQ0MTUyNHw2fE1DQUFNQi0xNzYyNDQxNTI0fDZHMXluWWNMUHVpUXhZWnJzel9wa3FmTEc5eU1YQnBiMnpYNWR2SmRZUUp6UFhJbWRqMHl8TUNPUFRPVVQtMTc2MTg0MzkyNXN8Tk9ORXxNQ0FJRHxOT05FfHZWZXJzaW9ufDUuMy4w.TEJHYzM=.eXQ0eTl4MTAyMDBYNExGbGxveWRzYmFua2NvbQ==.T1BUT1VUTVVMVEk=.MDowfGMxOjF8YzM6MHxjNTowfGM0OjB8YzI6MA==.dHM=.bWhkazUyOTc=#ts:1472813081682,cp.WT_FPC:id%3D0894a421-147f-4162-ac0a-bcd0781f62c2%3Alv%3D1472809477992%3Ass%3D1472809477992,?WT.ac=lloyds-bb-logon-header-primary-logon-business",
                      "_blank"
                    );
                  }}
                  type="button"
                  className="text-black text-sm font-medium border border-gray rounded-lg px-3 py-2"
                >
                  Pay Driver
                </button>
              </div>
              <div className="">
                <div className="mt-3">
                  <div>
                    {/* Sort Code */}
                    <div className="flex flex-col  sm:flex-row sm:items-center gap-2 mb-4 sm:mb-6">
                      <label className="w-full sm:w-1/4 text-sm font-medium text-gray-700">
                        Sort Code
                      </label>
                      <div className="w-full sm:w-3/4">
                        <Field
                          type="text"
                          name="sortCode"
                          style={{ height: "44px" }}
                          placeholder="00-00-00"
                          onChange={(
                            e: React.ChangeEvent<HTMLInputElement>
                          ) => {
                            let value = e.target.value.replace(/\D/g, "");
                            if (value.length > 6) value = value.slice(0, 6);
                            let formatted =
                              value.match(/.{1,2}/g)?.join("-") || value;
                            formik.setFieldValue("sortCode", formatted);
                          }}
                          disabled={isClosed}
                          value={formik.values.sortCode}
                          className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg bg-white hover:border-gray-400 focus:ring-2 focus:ring-custom-200 focus:outline-none  text-sm sm:text-base"
                        />

                        {getFieldError("sortCode", formik)}
                      </div>
                    </div>

                    {/* Account Number */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-4 sm:mb-6">
                      <label className="w-full sm:w-1/4 text-sm font-medium text-gray-700">
                        Account Number
                      </label>
                      <div className="w-full sm:w-3/4">
                        <Field
                          type="text"
                          name="accountNumber"
                          style={{ height: "44px" }}
                          placeholder="8 digits"
                          onChange={(
                            e: React.ChangeEvent<HTMLInputElement>
                          ) => {
                            let value = e.target.value.replace(/\D/g, "");
                            if (value.length > 8) value = value.slice(0, 8);
                            formik.setFieldValue("accountNumber", value);
                          }}
                          disabled={isClosed}
                          value={formik.values.accountNumber}
                          className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg bg-white hover:border-gray-400 focus:ring-2 focus:ring-custom-200 focus:outline-none  text-sm sm:text-base"
                        />

                        {getFieldError("accountNumber", formik)}
                      </div>
                    </div>
                  </div>

                  {/* Pay Driver Notification Date */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-6">
                    <label className="sm:w-2/4 text-sm font-medium text-gray-700 sm:mb-0">
                      Pay Notification Date
                    </label>
                    <div className="w-5/6 sm:w-[152%]">
                      <Field
                        name="payDriverNotificationDate"
                        className="w-full p-3 border border-gray-300 rounded-lg bg-white cursor-pointer focus:outline-none "
                      >
                        {({ field, form }: any) => (
                          <DatePicker
                            isDisabled={isClosed}
                            value={payDriverNotificationDate}
                            onChange={setPayDriverNotificationDate}
                            className="w-full rounded-lg "
                          />
                        )}
                      </Field>
                    </div>
                    {getFieldError("payDriverNotificationDate", formik)}
                  </div>

                  {/* Pay Driver Notes */}
                  <div className="flex flex-col sm:flex-row sm:items-start gap-2 mb-4 sm:mb-6">
                    <label className="sm:w-1/4 text-sm font-medium text-gray-700 sm:mt-2">
                      Pay Driver Notes
                    </label>
                    <div className="w-full sm:w-3/4">
                      <Field
                        as="textarea"
                        name="payDriverNotes"
                        placeholder="Type here..."
                        rows={4}
                        disabled={isClosed}
                        className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg bg-white hover:border-gray-400 focus:ring-2 focus:ring-custom-200 focus:outline-none  resize-none text-sm sm:text-base"
                      />
                      {getFieldError("payDriverNotes", formik)}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Age & Occupation Section */}
            <div className="bg-white border-b border-gray-200 mb-6">
              <div className="py-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">
                  VAT & Resgistration
                </h2>
                <p className="text-sm text-gray-600">
                  Enter VAT and Registeration details
                </p>
              </div>

              <div className="">
                <div className="">
                  <div>
                    <div>
                      {/* VAT Registered */}
                      <div className="flex flex-col mt-6 sm:flex-row sm:items-center gap-2 mb-4 sm:mb-6">
                        <label className="w-full sm:w-1/4 text-sm font-medium text-gray-700">
                          CI VAT Registered?
                        </label>
                        <div className="w-full sm:w-3/4 flex gap-4">
                          <label className="flex items-center">
                            <Field
                              type="radio"
                              name="vatRegistered"
                              value="Yes"
                              disabled={isClosed}
                              className="w-4 h-4 accent-[#414651] border-gray-300 focus:ring-custom-500"
                            />

                            <span className="ml-2 text-sm text-gray-700">
                              Yes
                            </span>
                          </label>
                          <label className="flex items-center">
                            <Field
                              type="radio"
                              name="vatRegistered"
                              value="No"
                              disabled={isClosed}
                              className="w-4 h-4 accent-[#414651] border-gray-300 focus:ring-custom-500"
                            />
                            <span className="ml-2 text-sm text-gray-700">
                              No
                            </span>
                          </label>
                        </div>
                        {getFieldError("vatRegistered", formik)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Vulnerable Persons Policy Section */}
              <div className="bg-white mb-6">
                <div className="flex py-6 border-y border-gray-200 justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-2">
                      Vulnerable Persons Policy
                    </h2>
                    <p className="text-sm text-gray-600"></p>
                  </div>
                  <div>
                    <button
                      onClick={() => {
                        handleNotifyManager();
                      }}
                      type="button"
                      className="text-black text-sm font-medium border border-gray rounded-lg px-3 py-2"
                    >
                      Notify Manager
                    </button>
                  </div>
                </div>

                <div className="py-6">
                  <div className="">
                    <div>
                      {/* Vulnerable Person */}
                      <div>
                        <div
                          onClick={() => {
                            handleVulnarablePersonPolicy();
                          }}
                          className="flex  justify-end"
                        >
                          <p className="text-[#414651] cursor-pointer flex text-sm">
                            Vulnarable Person Policy{" "}
                            <MdArrowOutward className="text-[#414651] mt-[3px] ml-2" />
                          </p>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-4 sm:mb-6">
                          <label className="w-full sm:w-1/4 text-sm font-medium text-gray-700">
                            Would you class the driver as a vulnerable person?
                          </label>
                          <div className="w-full sm:w-3/4 flex gap-4">
                            <label className="flex items-center">
                              <Field
                                type="radio"
                                name="vulnerablePerson"
                                value="Yes"
                                disabled={isClosed}
                                className="w-4 h-4 accent-[#414651] border-gray-300 focus:ring-custom-500"
                              />
                              <span className="ml-2 text-sm text-gray-700">
                                Yes
                              </span>
                            </label>
                            <label className="flex items-center">
                              <Field
                                type="radio"
                                name="vulnerablePerson"
                                value="No"
                                disabled={isClosed}
                                className="w-4 h-4 accent-[#414651] border-gray-300 focus:ring-custom-500"
                              />
                              <span className="ml-2 text-sm text-gray-700">
                                No
                              </span>
                            </label>
                          </div>
                          {getFieldError("vulnerablePerson", formik)}
                        </div>
                      </div>

                      {/* Vulnerable Person Why */}
                      {formik.values.vulnerablePerson === "Yes" && (
                        <div className="flex flex-col sm:flex-row sm:items-start gap-2 mb-4 sm:mb-6">
                          <label className="w-full sm:w-1/4 text-sm font-medium text-gray-700 sm:mt-3">
                            Why?
                          </label>
                          <div className="w-full sm:w-3/4">
                            <Field
                              as="textarea"
                              name="vulnerablePersonWhy"
                              placeholder="Explain why this person is considered vulnerable"
                              rows={4}
                              disabled={isClosed}
                              className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg bg-white hover:border-gray-400 focus:ring-2 focus:ring-custom-200 focus:outline-none  resize-none text-sm sm:text-base"
                            />
                            {getFieldError("vulnerablePersonWhy", formik)}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Form>
        )}
      </Formik>
    );
  }
);

ClientDetails.displayName = "ClientDetails";

export default ClientDetails;
