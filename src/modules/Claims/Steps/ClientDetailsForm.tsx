import Vector6 from "../../../assets/AutoClaim_icon/Vector-6.svg";
import Vector5 from "../../../assets/AutoClaim_icon/Vector-5.svg";
import Vulnerable from "../../../assets/AutoClaim_icon/Vulnerable.svg";
import { useEffect, useRef, useState } from "react";
import { CustomDatePicker } from "../Components/DatePicker";
import Select from "react-select";
import { createClient, getClientByClaimID, updateClient, vulnerablePersonPolicy } from "../../../services/Client/client";
import { toast } from "react-toastify";
import { useFormik } from "formik";
import * as Yup from "yup"
import { notifyManager } from "../../../services/Claims/Claims";
import { PostcodeLookup } from "../../../components/common/PostcodeLookup";
import { AddressAutocomplete } from "../../../components/common/AddressAutocomplete";
import { BlueDropdownIndicator, customStyles } from "./GeneralDetailsForm";
import Yes from "../../../assets/AutoClaim_icon/Yes.svg";
import No from "../../../assets/AutoClaim_icon/No.svg";
import CreditCard from "../../../assets/AutoClaim_icon/MID.svg";
import { PayDriverModal } from "./PayDriverModal";
import { VulnerablePolicyModal } from "./VulnerablePolicyModal";

const handlerOptions = [
  { value: "Private Hire Driver", label: "Private Hire Driver" },
  { value: "Taxi Driver", label: "Taxi Driver" },
  { value: "Others", label: "Others" },
];
export const cleanPayload = (obj: any) => {
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


export const ClientDetailsForm = ({ formRef }: any) => {


  const [showDobPicker, setShowDobPicker] = useState(false);

  
  const clientId = localStorage.getItem("clientId");
  const claimId = localStorage.getItem("claimId");

  const formik = useFormik({
    initialValues: {
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
      dependents: "",
      partner: "No",
      children: "",
      caringForElderly: "No",
      dependentsDetails: "",
    },
    validationSchema: Yup.object().shape({}),
    onSubmit: async (values: any) => {
      try {
        const payload = {
          gender: values.clientTitle,
          first_name: values.clientFirstName,
          surname: values.clientSurname,
          age: values.age || 0,
          occupation:
            values.occupation !== "Others"
              ? values.occupation
              : values.customOccupation,
          date_of_birth: values.dateOfBirth ? values.dateOfBirth?.toLocaleDateString("sv-SE") : null,
          ni_number: values.niNumber,
          driver_code: values.driverCode,
          day_driver: values.dayNightDriver === "Yes",
          driver_base: values.driverBase,
          // id: initialValues?.id,
          sort_code: values.sortCode,
          account_number: values.accountNumber,
          bank_details_note: values.payDriverNotes,
          pay_notification_date: values.payDriverNotificationDate ? values.payDriverNotificationDate?.toLocaleDateString("sv-SE") : null,
          ci_vat_registered: values.vatRegistered === "Yes",
          is_vulnerable: values.vulnerablePerson === "Yes",
          vulnerable_note: values.vulnerablePersonWhy,
          language_id: values.clientPreferredLanguage,
          speaks_clear_english: values.clientSpeakEnglish === "Yes",
          contact_via_alternative_person: values.alternativeContact === "Yes",
          alter_person: values.contactName,
          alter_number: values.contactTelephone,
          dependents: values.dependents || null,
          partner: values.partner === "Yes",
          children: values.children || null,
          caring_for_elderly: values.caringForElderly === "Yes",
          dependents_details: values.dependentsDetails || null,
          claim_id: parseInt(claimId) || 0,
          address: {
            address: values.address,
            postcode: values.postcode,
            home_tel: values.homeTelephone,
            mobile_tel: values.mobileTelephone,
            email: values.email,
          },
        };
        const payloadToSend = cleanPayload(payload);
        // return
        let response
        if (claimId && clientId) {
           response = await updateClient(
            parseInt(claimId),
            payloadToSend,
          );
          localStorage.setItem("clientId", response.id);
        } else {
           response = await createClient(payloadToSend);
          localStorage.setItem("clientId", response.id);
        }
       

      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const yearMonth = `${year}${month}`;

      // 2. Clean Surname (Remove spaces and uppercase)
      const cleanSurname = response.surname.replace(/\s+/g, "").toUpperCase();

      // 3. Format Claim ID to 4 digits (e.g., 22 -> 0022)
      const paddedId = String(claimId).padStart(4, "0");

      // 4. Create the final reference
      const caseReference = `${cleanSurname}-${yearMonth}-${paddedId}`;

      // 5. Store in Local Storage
      localStorage.setItem("CaseReference", caseReference);
        toast.success("Client details saved successfully");
      } catch (error) {
        toast.error("Error saving client details");
        throw error;
      }
    },
  });
  useEffect(() => {
    if (formik.values.occupation !== "Others") {
      formik.setFieldValue("customOccupation", "");
    }
  }, [formik.values.occupation]);
  useEffect(() => {
    const fetchData = async () => {
      const clientData = await getClientByClaimID(parseInt(claimId));
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
            dateOfBirth: new Date(clientData.date_of_birth) || null,
            contactTelephone: clientData.alter_number || "",
            sortCode: clientData.sort_code || "",
            accountNumber: clientData.account_number || "",
            payDriverNotificationDate: clientData.pay_notification_date ? new Date(clientData.pay_notification_date) : "",
            payDriverNotes: clientData.bank_details_note || "",
            niNumber: clientData.ni_number || "",
            occupation:
              clientData?.occupation !== "Private Hire Driver" && 
              clientData?.occupation !== "Taxi Driver" ?"Others": clientData?.occupation ,
            customOccupation:
              clientData?.occupation !== "Private Hire Driver" &&
              clientData?.occupation !== "Taxi Driver"
                ? clientData?.occupation
                : "",
            vatRegistered: clientData.ci_vat_registered ? "Yes" : "No",
            driverCode: clientData.driver_code || "",
            dayNightDriver: clientData.day_driver ? "Yes" : "No",
            driverBase: clientData.driver_base || "",
            vulnerablePerson: clientData.is_vulnerable ? "Yes" : "No",
            vulnerablePersonWhy: clientData.vulnerable_note || "",
            dependents: clientData.dependents || "",
            partner: clientData.partner ? "Yes" : "No",
            children: clientData.children || "",
            caringForElderly: clientData.caring_for_elderly ? "Yes" : "No",
            dependentsDetails: clientData.dependents_details || "",
          };
      formik.setValues(mappedValues);
    };
   
    if (claimId && clientId) {
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

    if (value.length > 4) {
      value = value.slice(0, 4) + " " + value.slice(4);
    }

    formik.setFieldValue("mobileTelephone", value);
  };
    const handleHomeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      // let value = e.target.value.replace(/\D/g, ""); // remove non-digits

      // if (value.length > 4) {
      //   value = value.slice(0, 4) + " " + value.slice(4);
      // }

      formik.setFieldValue("homeTelephone", e.target.value);
    };
  const [docModalOpen,setDocModalOpen]=useState<boolean>(false)
  const handleVulnerablePersonPolicy = () => {
    setDocModalOpen(true);
    // const link = document.createElement("a");
    // link.href = VulnerableFile;
    // // Set the extension to .docx to match your import
    // link.download = "Vulnerable_Person_Policy.docx";
    // document.body.appendChild(link);
    // link.click();
    // document.body.removeChild(link);
  };


  const languageOptions = [
    { value: 1, label: "English" },
    { value: 2, label: "Urdu" },
    { value: 3, label: "Punjabi" },
    { value:4, label: "Bengali" },
    { value: 5, label: "Other" },
  ];
   const handleNotifyManager = async () => {
      try {
        await notifyManager(parseInt(claimId));
        toast.success("Manager Notified");
      } catch (e) {
        toast.error("Failed to notify manager");
      }
    };
  const [showPayDatePicker, setShowPayDatePicker] = useState(false);
    const payDateRef = useRef<HTMLDivElement>(null);
    const dobRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
          if (
            payDateRef.current &&
            !payDateRef.current.contains(event.target as Node)
          )
            setShowPayDatePicker(false);
          if (
            dobRef.current &&
            !dobRef.current.contains(event.target as Node)
          )
            setShowDobPicker(false);
         
        };
      if (payDateRef) {
        document.addEventListener("mousedown", handleClickOutside);
      }
      if (dobRef) {
        document.addEventListener("mousedown", handleClickOutside);
      }
        return () =>
          document.removeEventListener("mousedown", handleClickOutside);
      }, []);
  
  // Auto-calculate age when DOB changes
  useEffect(() => {
    if (!formik.values.dateOfBirth) return undefined;
    const birthDate = new Date(
      formik.values.dateOfBirth.getFullYear(),
      formik.values.dateOfBirth.getMonth(),
      formik.values.dateOfBirth.getDate(),
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

    formik.setFieldValue("age", age.toString());
  }, [formik.values.dateOfBirth]); // ONLY depend on dob, not the whole personalInfo object
  useEffect(() => {
    if (formik.values.vulnerablePerson === "No") {
    formik.setFieldValue("vulnerablePersonWhy","");
    }
  }, [formik.values.vulnerablePerson]);
    const [payDriverModal, openModal] = useState<boolean>(false);
const inputStyles = `hover:border-neutral-400 focus:border-blue-500 focus:outline-none font-light transition-colors`;
  
  return (
    <>
      {docModalOpen && (
        <VulnerablePolicyModal
          isOpen={docModalOpen}
          onClose={() => setDocModalOpen(false)}
        />
      )}
      {payDriverModal && (
        <PayDriverModal
          isOpen={payDriverModal}
          onClose={() => openModal(false)}
        />
      )}
      <div className="MainContent w-full flex flex-col items-start gap-6 py-1 font-['Stack_Sans_Headline']">
        {/* Container matching left-[534px] and top-[157px] from source */}
        <h1 className="text-neutral-900 text-[24px] font-weight-600 font-['Stack_Sans_Headline']">
          Client Details
        </h1>
        {/* Section 1: Personal Information Section */}
        <div className="self-stretch p-5 rounded-lg border border-gray-100 flex flex-col gap-4">
          {/* Header Aligned Exactly Like Previous Sections */}
          <h2 className="text-neutral-900 text-[20px] font-weight-600 leading-5 font-['Stack_Sans_Headline']">
            Personal Information
          </h2>
          <div className="h-px bg-gray-100 w-full" />

          <div className="flex flex-col gap-6">
            {/* Row 1: First Name & Last Name */}
            <div className="grid grid-cols-12 gap-5 w-full">
              <div className="col-span-6 flex flex-col gap-2">
                <label className="text-gray-700 text-sm font-weight-400 h-[20px] flex items-center">
                  First Name
                </label>

                <input
                  placeholder="Enter First Name"
                  value={formik.values.clientFirstName}
                  className={`w-full h-[52px] px-5 bg-white rounded border border-gray-200 outline-none text-neutral-700 font-light text-neutral-700 ${inputStyles}`}
                  onChange={(e) =>
                    formik.setFieldValue("clientFirstName", e.target.value)
                  }
                />
              </div>
              <div className="col-span-6 flex flex-col gap-2">
                <label className="text-gray-700 text-sm font-weight-400 h-[20px] flex items-center">
                  Last Name
                </label>
                <input
                  placeholder="Enter Last Name"
                  className={`w-full h-[52px] px-5 bg-white rounded border border-gray-200 outline-none text-neutral-700 font-light text-neutral-700 ${inputStyles}`}
                  value={formik.values.clientSurname}
                  onChange={(e) =>
                    formik.setFieldValue("clientSurname", e.target.value)
                  }
                />
              </div>
            </div>

            {/* Row 2: DOB & Age (Auto-calculated) */}
            <div className="grid grid-cols-12 gap-5 w-full">
              <div
                className="col-span-6 flex flex-col gap-2 relative"
                ref={dobRef}
              >
                <label className="text-gray-700 text-sm font-weight-400 h-[20px] flex items-center">
                  Date of Birth
                </label>
                <div
                  onClick={() => setShowDobPicker(!showDobPicker)}
                  className="h-[52px] px-5 bg-white rounded border border-gray-200 flex items-center justify-between cursor-pointer focus-within:border-blue-500"
                >
                  <span
                    className={
                      formik.values.dateOfBirth
                        ? "text-neutral-700 font-light"
                        : "text-gray-300 font-light"
                    }
                  >
                    {formik.values.dateOfBirth
                      ? formik.values.dateOfBirth.toLocaleDateString("sv-SE") // YYYY-MM-DD format
                      : "Date"}
                  </span>
                  <img src={Vector6} className="w-4 h-4" alt="calendar" />
                </div>

                {/* Date Picker Dropdown */}
                {showDobPicker && (
                  <div className="absolute top-[28px] left-0 z-[100] shadow-xl rounded-lg bg-white">
                    <CustomDatePicker
                      selectedDate={formik.values.dateOfBirth || new Date()}
                      // Ensure the user cannot pick a future date
                      // maxDate={new Date()}
                      onDateSelect={(date) => {
                        // Double check: only update if date is not in the future
                        if (date <= new Date()) {
                          formik.setFieldValue("dateOfBirth", date);
                          setShowDobPicker(false);
                        }
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Age Field (Linked to the same row) */}
              <div className="col-span-6 flex flex-col gap-2">
                <label className="text-gray-700 text-sm font-weight-400 h-[20px] flex items-center">
                  Age
                </label>
                <div className="h-[52px] px-5 bg-gray-50 rounded border border-gray-200 flex items-center">
                  <input
                    readOnly
                    value={formik.values.age}
                    placeholder="Age"
                    className={`w-full bg-transparent outline-none font-light ${
                      formik.values.age ? "text-neutral-700" : "text-gray-400"
                    }`}
                  />
                </div>
              </div>
            </div>

            {/* Row 3: NI Number (Full Width in Grid context) */}
            <div className="grid grid-cols-12 gap-5 w-full">
              <div className="col-span-12 flex flex-col gap-2">
                <label className="text-gray-700 text-sm font-weight-400 h-[20px] flex items-center">
                  NI Number
                </label>
                <input
                  value={formik.values.niNumber}
                  onChange={(e) =>
                    formik.setFieldValue("niNumber", e.target.value)
                  }
                  placeholder="e.g. QQ 12 34 56 C"
                  className={`w-full h-[52px] px-5 bg-white rounded border border-gray-200 outline-none text-neutral-700 font-light text-neutral-700 ${inputStyles}`}
                />
              </div>
            </div>

            {/* Row 4: Occupation & Custom Occupation */}
            <div className="grid grid-cols-12 gap-5 w-full">
              <div className="col-span-6 flex flex-col gap-2">
                <label className="text-gray-700 text-sm font-weight-400 h-[20px] flex items-center">
                  Occupation
                </label>
                <Select
                  options={handlerOptions}
                  placeholder="Select Occupation"
                  styles={customStyles}
                  value={handlerOptions.find(
                    (option) => option.value === formik.values.occupation,
                  )}
                  onChange={(option: any) =>
                    formik.setFieldValue("occupation", option.value)
                  }
                  components={{
                    DropdownIndicator: BlueDropdownIndicator,
                    IndicatorSeparator: () => null,
                  }}
                />
              </div>
              {/* Conditional Rendering for 'Others' - Aligned with the Select box */}
              {formik.values.occupation === "Others" && (
                <div
                  className={`col-span-6 flex flex-col gap-2 transition-opacity duration-300 ${formik.values.occupation === "Others" ? "opacity-100" : "opacity-30 pointer-events-none"}`}
                >
                  <label className="text-gray-700 text-sm font-weight-400 h-[20px] flex items-center">
                    Custom Occupation
                  </label>
                  <div className="h-[52px] px-5 bg-white rounded border border-gray-200 flex items-center focus-within:border-blue-500">
                    <input
                      disabled={formik.values.occupation !== "Others"}
                      placeholder="Please specify"
                      value={formik.values.customOccupation}
                      onChange={(e) =>
                        formik.setFieldValue("customOccupation", e.target.value)
                      }
                      className={`w-full h-[52px] px-5 bg-white rounded border border-gray-200 outline-none text-neutral-700 font-light text-neutral-700 ${inputStyles}`}
                    />
                  </div>
                </div>
              )}
            </div>
            {/* Row 5: Driver Code & Day/Night Radio */}
            <div className="grid grid-cols-12 gap-5 w-full">
              <div className="col-span-6 flex flex-col gap-2">
                <label className="text-gray-700 text-sm font-weight-400 h-[20px] flex items-center">
                  Driver Code
                </label>
                <input
                  placeholder="Enter Code"
                  className={`w-full h-[52px] px-5 bg-white rounded border border-gray-200 outline-none text-neutral-700 font-light text-neutral-700 ${inputStyles}`}
                  value={formik.values.driverCode}
                  onChange={(e) =>
                    formik.setFieldValue("driverCode", e.target.value)
                  }
                />
              </div>
              <div className="col-span-6 flex flex-col gap-2">
                <span className="text-gray-700 text-sm font-weight-400 h-[20px] flex items-center">
                  Day/Night Driver?
                </span>
                <div className="h-[52px] flex items-center gap-8">
                  {["Yes", "No"].map((option) => (
                    <label
                      key={option}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <div className="relative flex items-center justify-center">
                        <input
                          type="radio"
                          name="dayNightDriver"
                          className="peer appearance-none transition-all"
                          checked={formik.values.dayNightDriver === option}
                          onChange={() =>
                            formik.setFieldValue("dayNightDriver", option)
                          }
                        />
                        {formik.values.dayNightDriver === option ? (
                          <img src={Yes} />
                        ) : (
                          <img src={No} />
                        )}
                      </div>
                      <span className="text-sm text-gray-700">{option}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Row 6: Driver Base */}
            <div className="grid grid-cols-12 gap-5 w-full">
              <div className="col-span-6 flex flex-col gap-2">
                <label className="text-gray-700 text-sm font-weight-400 h-[20px] flex items-center">
                  Driver Base
                </label>
                <input
                  placeholder="Enter Driver Base"
                  className={`w-full h-[52px] px-5 bg-white rounded border border-gray-200 outline-none text-neutral-700 font-light text-neutral-700 ${inputStyles}`}
                  value={formik.values.driverBase}
                  onChange={(e) =>
                    formik.setFieldValue("driverBase", e.target.value)
                  }
                />
              </div>
            </div>
          </div>
        </div>
        {/* Section 1b: Dependents & Caring Responsibilities */}
        <div className="self-stretch p-5 rounded-lg border border-gray-100 flex flex-col gap-4 mt-6">
          <h2 className="text-neutral-900 text-[20px] font-weight-600 leading-5 font-['Stack_Sans_Headline']">
            Dependents &amp; Caring Responsibilities
          </h2>
          <div className="h-px bg-gray-100 w-full" />

          <div className="flex flex-col gap-6">
            {/* Row 1: Dependents & Partner */}
            <div className="grid grid-cols-12 gap-5 w-full items-end">
              <div className="col-span-6 flex flex-col gap-2">
                <label className="text-gray-700 text-sm font-weight-400 h-[20px] flex items-center">
                  Dependents
                </label>
                <input
                  placeholder="Enter number of dependents"
                  value={formik.values.dependents}
                  onChange={(e) => formik.setFieldValue("dependents", e.target.value)}
                  className={`w-full h-[52px] px-5 bg-white rounded border border-gray-200 outline-none text-neutral-700 font-light ${inputStyles}`}
                />
              </div>
              <div className="col-span-6 flex flex-col gap-3 pb-2">
                <span className="text-black text-sm font-weight-400">Partner</span>
                <div className="flex gap-8">
                  {["Yes", "No"].map((option) => (
                    <label key={option} className="flex items-center gap-2 cursor-pointer">
                      <div className="relative flex items-center justify-center">
                        <input
                          type="radio"
                          name="partner"
                          className="peer appearance-none transition-all"
                          checked={formik.values.partner === option}
                          onChange={() => formik.setFieldValue("partner", option)}
                        />
                        {formik.values.partner === option ? (
                          <img src={Yes} />
                        ) : (
                          <img src={No} />
                        )}
                      </div>
                      <span className="text-sm text-gray-700">{option}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Row 2: Children & Caring for elderly */}
            <div className="grid grid-cols-12 gap-5 w-full items-end">
              <div className="col-span-6 flex flex-col gap-2">
                <label className="text-gray-700 text-sm font-weight-400 h-[20px] flex items-center">
                  Children
                </label>
                <input
                  placeholder="Enter Name"
                  value={formik.values.children}
                  onChange={(e) => formik.setFieldValue("children", e.target.value)}
                  className={`w-full h-[52px] px-5 bg-white rounded border border-gray-200 outline-none text-neutral-700 font-light ${inputStyles}`}
                />
              </div>
              <div className="col-span-6 flex flex-col gap-3 pb-2">
                <span className="text-black text-sm font-weight-400">
                  Caring for elderly/vulnerable persons?
                </span>
                <div className="flex gap-8">
                  {["Yes", "No"].map((option) => (
                    <label key={option} className="flex items-center gap-2 cursor-pointer">
                      <div className="relative flex items-center justify-center">
                        <input
                          type="radio"
                          name="caringForElderly"
                          className="peer appearance-none transition-all"
                          checked={formik.values.caringForElderly === option}
                          onChange={() => formik.setFieldValue("caringForElderly", option)}
                        />
                        {formik.values.caringForElderly === option ? (
                          <img src={Yes} />
                        ) : (
                          <img src={No} />
                        )}
                      </div>
                      <span className="text-sm text-gray-700">{option}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Row 3: Provide details */}
            <div className="grid grid-cols-12 gap-5 w-full">
              <div className="col-span-12 flex flex-col gap-2">
                <label className="text-gray-700 text-sm font-weight-400 h-[20px] flex items-center">
                  Provide details
                </label>
                <textarea
                  placeholder="Enter details..."
                  value={formik.values.dependentsDetails}
                  onChange={(e) => formik.setFieldValue("dependentsDetails", e.target.value)}
                  className={`w-full bg-white border border-gray-200 rounded outline-none text-neutral-700 font-light min-h-[52px] resize-none px-5 py-4 ${inputStyles}`}
                />
              </div>
            </div>
          </div>
        </div>
        {/* Section 2:  Contact Information */}
        <div className="self-stretch p-5 rounded-lg border border-gray-100 flex flex-col gap-4 mt-6">
          <h2 className="text-neutral-900 text-[20px] font-weight-600 leading-5 font-['Stack_Sans_Headline']">
            Contact Information
          </h2>
          <div className="h-px bg-gray-100 w-full" />

          <div className="flex flex-col gap-6">
            {/* Row 1: Full Width Address */}
            <div className="grid grid-cols-12 gap-5 w-full">
              <div className="col-span-12 flex flex-col gap-2">
                <label className="text-neutral-700 text-[14px] font-weight-500">
                  Address
                </label>
                {/* <div className="h-[52px] px-5 bg-white rounded border border-gray-200 flex items-center focus-within:border-blue-500">
                <input
                  placeholder="Enter Postcode to Search"
                 className={`w-full h-[52px] px-5 bg-white rounded border border-gray-200 outline-none text-neutral-700 font-light text-neutral-700 ${inputStyles}`}
                  onChange={(e) =>
                    formik.setFieldValue("address", e.target.value)
                  }
                />
              </div> */}
                <AddressAutocomplete
                  address={formik.values.address || ""}
                  onChange={(v) => formik.setFieldValue("address", v)}
                  onPlaceSelected={(place) => {
                    formik.setFieldValue("address", place.address);
                    formik.setFieldValue("postcode", place.postcode);
                  }}
                  inputClassName={`w-full h-[52px] px-5 bg-white rounded border border-gray-200 outline-none text-neutral-700 font-light ${inputStyles}`}
                />
              </div>
            </div>

            {/* Row 2: Post Code & Email Address */}
            <div className="grid grid-cols-12 gap-5 w-full">
              <div className="col-span-4 flex flex-col gap-2">
                <label className="text-neutral-700 text-[14px] font-weight-500">
                  Post Code
                </label>
                <PostcodeLookup
                  postcode={formik.values.postcode}
                  onChange={(v) => formik.setFieldValue("postcode", v)}
                  onAddressSelect={(addr) => {
                    formik.setFieldValue("postcode", addr.postcode);
                    formik.setFieldValue("address", [addr.line1, addr.line2, addr.line3].filter(Boolean).join(", "));
                  }}
                  inputClassName={`w-full h-[52px] px-5 bg-white rounded border border-gray-200 outline-none text-neutral-700 font-light ${inputStyles}`}
                />
              </div>
              <div className="col-span-8 flex flex-col gap-2">
                <label className="text-neutral-700 text-[14px] font-weight-500">
                  Email Address
                </label>
                <input
                  placeholder="Enter Email"
                  className={`w-full h-[52px] px-5 bg-white rounded border border-gray-200 outline-none text-neutral-700 font-light text-neutral-700 ${inputStyles}`}
                  value={formik.values.email}
                  onChange={(e) =>
                    formik.setFieldValue("email", e.target.value)
                  }
                />
              </div>
            </div>

            {/* Row 3: Home Telephone & Mobile Number */}
            <div className="grid grid-cols-12 gap-5 w-full">
              <div className="col-span-6 flex flex-col gap-2">
                <label className="text-neutral-700 text-[14px] font-weight-500">
                  Home Telephone
                </label>
                <div className="relative h-[52px] px-5 bg-white rounded border border-gray-200 flex items-center gap-2.5 focus-within:border-blue-500 transition-all">
                  {/* <span className="text-gray-400 text-base font-light">+44</span> */}
                  <input
                    name="contact_number"
                    type="text"
                    onChange={handleHomeChange}
                    maxLength={15}
                    value={formik.values.homeTelephone}
                    className="w-full bg-transparent mb-0.5 outline-none text-gray-900 font-light placeholder:text-gray-300"
                  />
                </div>
              </div>
              <div className="col-span-6 flex flex-col gap-2">
                <label className="text-neutral-700 text-[14px] font-weight-500">
                  Mobile Number
                </label>
                <div className="relative h-[52px] px-5 bg-white rounded border border-gray-200 flex items-center gap-2.5 focus-within:border-blue-500 transition-all">
                  <span className="text-gray-400 text-base font-light">
                    +44
                  </span>
                  <input
                    name="mobileTelephone"
                    type="tel"
                    onChange={handleMobileChange}
                    maxLength={11}
                    value={formik.values.mobileTelephone}
                    className="w-full bg-transparent mb-0.5 outline-none text-neutral-700 font-light placeholder:text-gray-300"
                  />
                </div>
              </div>
            </div>

            {/* Row 4: Language & English Proficiency */}
            <div className="grid grid-cols-12 gap-5 w-full items-end">
              <div className="col-span-6 flex flex-col gap-2">
                <label className="text-neutral-700 text-[14px] font-weight-500">
                  Client's Preferred Language
                </label>
                <Select
                  options={languageOptions}
                  placeholder="Select Language"
                  styles={customStyles}
                  components={{
                    DropdownIndicator: BlueDropdownIndicator,
                    IndicatorSeparator: () => null,
                  }}
                  value={languageOptions.find(
                    (option) =>
                      option.value === formik.values.clientPreferredLanguage,
                  )}
                  onChange={(opt: any) =>
                    formik.setFieldValue("clientPreferredLanguage", opt.value)
                  }
                />
              </div>
              <div className="col-span-6 flex flex-col gap-3 pb-2">
                <span className="text-black text-sm font-weight-400">
                  Does the client speak clear english?
                </span>
                <div className="flex gap-8">
                  {["Yes", "No"].map((option) => (
                    <label
                      key={option}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <div className="relative flex items-center justify-center">
                        <input
                          type="radio"
                          className="peer appearance-none transition-all"
                          checked={formik.values.clientSpeakEnglish === option}
                          onChange={() =>
                            formik.setFieldValue("clientSpeakEnglish", option)
                          }
                        />
                        {formik.values.clientSpeakEnglish === option ? (
                          <img src={Yes} />
                        ) : (
                          <img src={No} />
                        )}{" "}
                      </div>
                      <span className="text-sm text-gray-700">{option}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Row 5: Alternative Contact Person Request */}
            <div className="col-span-12 flex flex-col gap-3">
              <span className="text-black text-sm font-weight-400">
                Client has requested that we place all contact through an
                alternative person
              </span>
              <div className="flex gap-8">
                {["Yes", "No"].map((option) => (
                  <label
                    key={option}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <div className="relative flex items-center justify-center">
                      <input
                        type="radio"
                        className="peer appearance-none transition-all"
                        checked={formik.values.alternativeContact === option}
                        onChange={() =>
                          formik.setFieldValue("alternativeContact", option)
                        }
                      />
                      {formik.values.alternativeContact === option ? (
                        <img src={Yes} />
                      ) : (
                        <img src={No} />
                      )}{" "}
                    </div>
                    <span className="text-sm text-gray-700">{option}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
        {/* Section 3:  Bank Details */}
        <div className="self-stretch p-5 rounded-lg border border-gray-100 flex flex-col gap-4 mt-6">
          <div className="self-stretch flex justify-between items-center">
            <h2 className="text-neutral-900 text-[20px] font-weight-600 leading-5 font-['Stack_Sans_Headline']">
              Bank Details
            </h2>

            <a
              href="https://onlinebusiness.lloydsbank.co.uk/business/logon/login.jsp?LBGAc=T1BUT1VUTVVMVElNRVNTQUdF.MQ==.QU1DVlNfMjMwRDY0M0U1QTI1NTA5ODBBNDk1REI2JTQwQWRvYmVPcmc=.MQ==.QU1DVl8yMzBENjQzRTVBMjU1MDk4MEE0OTVEQjYlNDBBZG9iZU9yZw==.LTIxMjExNzkwMzN8TUNJRFRTfDIwMDY5fE1DTUlEfDgyMzE1NTA0NTUzMjUyMTA2OTQxNzUwNTE3MzQyMjk2MjgyMjYzfE1DQUFNTEgtMTczNDUxNjk1Nnw2fE1DQUFNQi0xNzM0NTE2OTU2fDZHMXluWWNMUHVpUXhZWnJzel9wa3FmTEc5eU1YQnBiMnpYNWR2SmRZUUp6UFhJbWRqMHl8TUNPUFRPVVQtMTczMzkxOTM1NnN8Tk9ORXxNQ0FJRHxOT05FfHZWZXJzaW9ufDUuMy4w.QU1DVl8yMzBENjQzRTVBMjU1MDk4MEE0OTVEQjYlNDBBZG9iZU9yZw==.LTIxMjExNzkwMzN8TUNJRFRTfDIwMDY5fE1DTUlEfDgyMzE1NTA0NTUzMjUyMTA2OTQxNzUwNTE3MzQyMjk2MjgyMjYzfE1DQUFNTEgtMTczNDUxNjk1Nnw2fE1DQUFNQi0xNzM0NTE2OTU2fDZHMXluWWNMUHVpUXhZWnJzel9wa3FmTEc5eU1YQnBiMnpYNWR2SmRZUUp6UFhJbWRqMHl8TUNPUFRPVVQtMTczMzkxOTM1NnN8Tk9ORXxNQ0FJRHxOT05FfHZWZXJzaW9ufDUuMy4w.QU1DVl84Rjk5MTYwRTU3MUZDMDQyN0YwMDAxMDElNDBBZG9iZU9yZw==.LTExMjQxMDY2ODB8TUNNSUR8MjM0NTY3OTExMTI0NzU3NTg5MzE5OTM0ODE5MjQ1NDg2MzU2ODF8TUNBSUR8Tk9ORXx2VmVyc2lvbnw1LjIuMA==.TEJHYzM=.eXN1c3RyeDAyMDBYNExGbGxveWRzYmFua2NvbQ==.T1BUT1VUTVVMVEk=.MDowfGMxOjF8YzM6MHxjNTowfGM0OjB8YzI6MA==.QU1DVl8yMzBENjQzRTVBMjU1MDk4MEE0OTVEQjYlNDBBZG9iZU9yZw==.LTIxMjExNzkwMzN8TUNJRFRTfDIwMDY5fE1DTUlEfDgyMzE1NTA0NTUzMjUyMTA2OTQxNzUwNTE3MzQyMjk2MjgyMjYzfE1DQUFNTEgtMTczNDUxNjk1Nnw2fE1DQUFNQi0xNzM0NTE2OTU2fDZHMXluWWNMUHVpUXhZWnJzel9wa3FmTEc5eU1YQnBiMnpYNWR2SmRZUUp6UFhJbWRqMHl8TUNPUFRPVVQtMTczMzkxOTM1NnN8Tk9ORXxNQ0FJRHxOT05FfHZWZXJzaW9ufDUuMy4w.dHM=.bWJxY3FzbWs=&LBGAc=T1BUT1VUTVVMVElNRVNTQUdF.MQ==.QU1DVlNfMjMwRDY0M0U1QTI1NTA5ODBBNDk1REI2JTQwQWRvYmVPcmc=.MQ==.QU1DVl8yMzBENjQzRTVBMjU1MDk4MEE0OTVEQjYlNDBBZG9iZU9yZw==.LTIxMjExNzkwMzN8TUNJRFRTfDIwMDY5fE1DTUlEfDgyMzE1NTA0NTUzMjUyMTA2OTQxNzUwNTE3MzQyMjk2MjgyMjYzfE1DQUFNTEgtMTczNDUxNjk1Nnw2fE1DQUFNQi0xNzM0NTE2OTU2fDZHMXluWWNMUHVpUXhZWnJzel9wa3FmTEc5eU1YQnBiMnpYNWR2SmRZUUp6UFhJbWRqMHl8TUNPUFRPVVQtMTczMzkxOTM1NnN8Tk9ORXxNQ0FJRHxOT05FfHZWZXJzaW9ufDUuMy4w.QU1DVl8yMzBENjQzRTVBMjU1MDk4MEE0OTVEQjYlNDBBZG9iZU9yZw==.LTIxMjExNzkwMzN8TUNJRFRTfDIwMDY5fE1DTUlEfDgyMzE1NTA0NTUzMjUyMTA2OTQxNzUwNTE3MzQyMjk2MjgyMjYzfE1DQUFNTEgtMTczNDUxNjk1Nnw2fE1DQUFNQi0xNzM0NTE2OTU2fDZHMXluWWNMUHVpUXhZWnJzel9wa3FmTEc5eU1YQnBiMnpYNWR2SmRZUUp6UFhJbWRqMHl8TUNPUFRPVVQtMTczMzkxOTM1NnN8Tk9ORXxNQ0FJRHxOT05FfHZWZXJzaW9ufDUuMy4w.QU1DVl84Rjk5MTYwRTU3MUZDMDQyN0YwMDAxMDElNDBBZG9iZU9yZw==.LTExMjQxMDY2ODB8TUNNSUR8MjM0NTY3OTExMTI0NzU3NTg5MzE5OTM0ODE5MjQ1NDg2MzU2ODF8TUNBSUR8Tk9ORXx2VmVyc2lvbnw1LjIuMA==.TEJHYzM=.eXN1c3RyeDAyMDBYNExGbGxveWRzYmFua2NvbQ==.T1BUT1VUTVVMVEk=.MDowfGMxOjF8YzM6MHxjNTowfGM0OjB8YzI6MA==.QU1DVl8yMzBENjQzRTVBMjU1MDk4MEE0OTVEQjYlNDBBZG9iZU9yZw==.LTIxMjExNzkwMzN8TUNJRFRTfDIwMDY5fE1DTUlEfDgyMzE1NTA0NTUzMjUyMTA2OTQxNzUwNTE3MzQyMjk2MjgyMjYzfE1DQUFNTEgtMTczNDUxNjk1Nnw2fE1DQUFNQi0xNzM0NTE2OTU2fDZHMXluWWNMUHVpUXhZWnJzel9wa3FmTEc5eU1YQnBiMnpYNWR2SmRZUUp6UFhJbWRqMHl8TUNPUFRPVVQtMTczMzkxOTM1NnN8Tk9ORXxNQ0FJRHxOT05FfHZWZXJzaW9ufDUuMy4w.dHM=.bWJxY3J4OGk=&LBGAc=T1BUT1VUTVVMVElNRVNTQUdF.MQ==.QU1DVlNfMjMwRDY0M0U1QTI1NTA5ODBBNDk1REI2JTQwQWRvYmVPcmc=.MQ==.QU1DVl8yMzBENjQzRTVBMjU1MDk4MEE0OTVEQjYlNDBBZG9iZU9yZw==.LTIxMjExNzkwMzN8TUNJRFRTfDIwMDY5fE1DTUlEfDgyMzE1NTA0NTUzMjUyMTA2OTQxNzUwNTE3MzQyMjk2MjgyMjYzfE1DQUFNTEgtMTczNDUxNjk1Nnw2fE1DQUFNQi0xNzM0NTE2OTU2fDZHMXluWWNMUHVpUXhZWnJzel9wa3FmTEc5eU1YQnBiMnpYNWR2SmRZUUp6UFhJbWRqMHl8TUNPUFRPVVQtMTczMzkxOTM1NnN8Tk9ORXxNQ0FJRHxOT05FfHZWZXJzaW9ufDUuMy4w.QU1DVl8yMzBENjQzRTVBMjU1MDk4MEE0OTVEQjYlNDBBZG9iZU9yZw==.LTIxMjExNzkwMzN8TUNJRFRTfDIwMDY5fE1DTUlEfDgyMzE1NTA0NTUzMjUyMTA2OTQxNzUwNTE3MzQyMjk2MjgyMjYzfE1DQUFNTEgtMTczNDUxNjk1Nnw2fE1DQUFNQi0xNzM0NTE2OTU2fDZHMXluWWNMUHVpUXhZWnJzel9wa3FmTEc5eU1YQnBiMnpYNWR2SmRZUUp6UFhJbWRqMHl8TUNPUFRPVVQtMTczMzkxOTM1NnN8Tk9ORXxNQ0FJRHxOT05FfHZWZXJzaW9ufDUuMy4w.QU1DVl84Rjk5MTYwRTU3MUZDMDQyN0YwMDAxMDElNDBBZG9iZU9yZw==.LTExMjQxMDY2ODB8TUNNSUR8MjM0NTY3OTExMTI0NzU3NTg5MzE5OTM0ODE5MjQ1NDg2MzU2ODF8TUNBSUR8Tk9ORXx2VmVyc2lvbnw1LjIuMA==.TEJHYzM=.eXN1c3RyeDAyMDBYNExGbGxveWRzYmFua2NvbQ==.T1BUT1VUTVVMVEk=.MDowfGMxOjF8YzM6MHxjNTowfGM0OjB8YzI6MA==.QU1DVl8yMzBENjQzRTVBMjU1MDk4MEE0OTVEQjYlNDBBZG9iZU9yZw==.LTIxMjExNzkwMzN8TUNJRFRTfDIwMDY5fE1DTUlEfDgyMzE1NTA0NTUzMjUyMTA2OTQxNzUwNTE3MzQyMjk2MjgyMjYzfE1DQUFNTEgtMTczNDUxNjk1Nnw2fE1DQUFNQi0xNzM0NTE2OTU2fDZHMXluWWNMUHVpUXhZWnJzel9wa3FmTEc5eU1YQnBiMnpYNWR2SmRZUUp6UFhJbWRqMHl8TUNPUFRPVVQtMTczMzkxOTM1NnN8Tk9ORXxNQ0FJRHxOT05FfHZWZXJzaW9ufDUuMy4w.dHM=.bWJxY3M4MmQ=&LBGAc=T1BUT1VUTVVMVElNRVNTQUdF.MQ==.QU1DVlNfMjMwRDY0M0U1QTI1NTA5ODBBNDk1REI2JTQwQWRvYmVPcmc=.MQ==.QU1DVl8yMzBENjQzRTVBMjU1MDk4MEE0OTVEQjYlNDBBZG9iZU9yZw==.LTIxMjExNzkwMzN8TUNJRFRTfDIwMDY5fE1DTUlEfDgyMzE1NTA0NTUzMjUyMTA2OTQxNzUwNTE3MzQyMjk2MjgyMjYzfE1DQUFNTEgtMTczNDUxNjk1Nnw2fE1DQUFNQi0xNzM0NTE2OTU2fDZHMXluWWNMUHVpUXhZWnJzel9wa3FmTEc5eU1YQnBiMnpYNWR2SmRZUUp6UFhJbWRqMHl8TUNPUFRPVVQtMTczMzkxOTM1NnN8Tk9ORXxNQ0FJRHxOT05FfHZWZXJzaW9ufDUuMy4w.QU1DVl8yMzBENjQzRTVBMjU1MDk4MEE0OTVEQjYlNDBBZG9iZU9yZw==.LTIxMjExNzkwMzN8TUNJRFRTfDIwMDY5fE1DTUlEfDgyMzE1NTA0NTUzMjUyMTA2OTQxNzUwNTE3MzQyMjk2MjgyMjYzfE1DQUFNTEgtMTczNDUxNjk1Nnw2fE1DQUFNQi0xNzM0NTE2OTU2fDZHMXluWWNMUHVpUXhZWnJzel9wa3FmTEc5eU1YQnBiMnpYNWR2SmRZUUp6UFhJbWRqMHl8TUNPUFRPVVQtMTczMzkxOTM1NnN8Tk9ORXxNQ0FJRHxOT05FfHZWZXJzaW9ufDUuMy4w.QU1DVl84Rjk5MTYwRTU3MUZDMDQyN0YwMDAxMDElNDBBZG9iZU9yZw==.LTExMjQxMDY2ODB8TUNNSUR8MjM0NTY3OTExMTI0NzU3NTg5MzE5OTM0ODE5MjQ1NDg2MzU2ODF8TUNBSUR8Tk9ORXx2VmVyc2lvbnw1LjIuMA==.TEJHYzM=.eXN1c3RyeDAyMDBYNExGbGxveWRzYmFua2NvbQ==.T1BUT1VUTVVMVEk=.MDowfGMxOjF8YzM6MHxjNTowfGM0OjB8YzI6MA==.QU1DVl8yMzBENjQzRTVBMjU1MDk4MEE0OTVEQjYlNDBBZG9iZU9yZw==.LTIxMjExNzkwMzN8TUNJRFRTfDIwMDY5fE1DTUlEfDgyMzE1NTA0NTUzMjUyMTA2OTQxNzUwNTE3MzQyMjk2MjgyMjYzfE1DQUFNTEgtMTczNDUxNjk1Nnw2fE1DQUFNQi0xNzM0NTE2OTU2fDZHMXluWWNMUHVpUXhZWnJzel9wa3FmTEc5eU1YQnBiMnpYNWR2SmRZUUp6UFhJbWRqMHl8TUNPUFRPVVQtMTczMzkxOTM1NnN8Tk9ORXxNQ0FJRHxOT05FfHZWZXJzaW9ufDUuMy4w.dHM=.bWJxZGR2em0=&LBGAc=T1BUT1VUTVVMVElNRVNTQUdF.MQ==.QU1DVlNfMjMwRDY0M0U1QTI1NTA5ODBBNDk1REI2JTQwQWRvYmVPcmc=.MQ==.QU1DVl8yMzBENjQzRTVBMjU1MDk4MEE0OTVEQjYlNDBBZG9iZU9yZw==.LTIxMjExNzkwMzN8TUNJRFRTfDIwMDY5fE1DTUlEfDgyMzE1NTA0NTUzMjUyMTA2OTQxNzUwNTE3MzQyMjk2MjgyMjYzfE1DQUFNTEgtMTczNDUxNjk1Nnw2fE1DQUFNQi0xNzM0NTE2OTU2fDZHMXluWWNMUHVpUXhZWnJzel9wa3FmTEc5eU1YQnBiMnpYNWR2SmRZUUp6UFhJbWRqMHl8TUNPUFRPVVQtMTczMzkxOTM1NnN8Tk9ORXxNQ0FJRHxOT05FfHZWZXJzaW9ufDUuMy4w.QU1DVl8yMzBENjQzRTVBMjU1MDk4MEE0OTVEQjYlNDBBZG9iZU9yZw==.LTIxMjExNzkwMzN8TUNJRFRTfDIwMDY5fE1DTUlEfDgyMzE1NTA0NTUzMjUyMTA2OTQxNzUwNTE3MzQyMjk2MjgyMjYzfE1DQUFNTEgtMTczNDUxNjk1Nnw2fE1DQUFNQi0xNzM0NTE2OTU2fDZHMXluWWNMUHVpUXhZWnJzel9wa3FmTEc5eU1YQnBiMnpYNWR2SmRZUUp6UFhJbWRqMHl8TUNPUFRPVVQtMTczMzkxOTM1NnN8Tk9ORXxNQ0FJRHxOT05FfHZWZXJzaW9ufDUuMy4w.QU1DVl84Rjk5MTYwRTU3MUZDMDQyN0YwMDAxMDElNDBBZG9iZU9yZw==.LTExMjQxMDY2ODB8TUNNSUR8MjM0NTY3OTExMTI0NzU3NTg5MzE5OTM0ODE5MjQ1NDg2MzU2ODF8TUNBSUR8Tk9ORXx2VmVyc2lvbnw1LjIuMA==.TEJHYzM=.eXN1c3RyeDAyMDBYNExGbGxveWRzYmFua2NvbQ==.T1BUT1VUTVVMVEk=.MDowfGMxOjF8YzM6MHxjNTowfGM0OjB8YzI6MA==.QU1DVl8yMzBENjQzRTVBMjU1MDk4MEE0OTVEQjYlNDBBZG9iZU9yZw==.LTIxMjExNzkwMzN8TUNJRFRTfDIwMDY5fE1DTUlEfDgyMzE1NTA0NTUzMjUyMTA2OTQxNzUwNTE3MzQyMjk2MjgyMjYzfE1DQUFNTEgtMTczNDUxNjk1Nnw2fE1DQUFNQi0xNzM0NTE2OTU2fDZHMXluWWNMUHVpUXhZWnJzel9wa3FmTEc5eU1YQnBiMnpYNWR2SmRZUUp6UFhJbWRqMHl8TUNPUFRPVVQtMTczMzkxOTM1NnN8Tk9ORXxNQ0FJRHxOT05FfHZWZXJzaW9ufDUuMy4w.dHM=.bWJxZGR4aXE=&LBGAc=QU1DVlNfMjMwRDY0M0U1QTI1NTA5ODBBNDk1REI2JTQwQWRvYmVPcmc=.MQ==.T1BUT1VUTVVMVElNRVNTQUdF.MQ==.QU1DVl8yMzBENjQzRTVBMjU1MDk4MEE0OTVEQjYlNDBBZG9iZU9yZw==.LTIxMjExNzkwMzN8TUNJRFRTfDIwMzkyfE1DTUlEfDgwNTgzMjc0NTY0MzY1OTk3MDQyMTg3NjQ1MzQzNzQ5NTE5MDIwfE1DQUFNTEgtMTc2MjQ0MTUyNHw2fE1DQUFNQi0xNzYyNDQxNTI0fDZHMXluWWNMUHVpUXhZWnJzel9wa3FmTEc5eU1YQnBiMnpYNWR2SmRZUUp6UFhJbWRqMHl8TUNPUFRPVVQtMTc2MTg0MzkyNXN8Tk9ORXxNQ0FJRHxOT05FfHZWZXJzaW9ufDUuMy4w.TEJHYzM=.eXQ0eTl4MTAyMDBYNExGbGxveWRzYmFua2NvbQ==.T1BUT1VUTVVMVEk=.MDowfGMxOjF8YzM6MHxjNTowfGM0OjB8YzI6MA==.dHM=.bWhkazUyOTc=#ts:1472813081682/"
              // onClick={() => openModal(true)}
              target="_blank"
              className="h-8 px-3 py-2 bg-blue-100 hover:bg-blue-100 rounded flex items-center gap-2.5 transition-colors group"
            >
              <img src={CreditCard} alt="" />
              <span className="text-blue-600 text-sm font-normal">
                Pay Driver Here
              </span>
            </a>
          </div>
          <div className="h-px bg-gray-100 w-full" />

          <div className="flex flex-col gap-6">
            {/* Row 1: Sort Code & Account Number */}
            <div className="grid grid-cols-12 gap-5 w-full">
              <div className="col-span-6 flex flex-col gap-2">
                <label className="text-neutral-700 text-[14px] font-weight-500">
                  Sort Code
                </label>
                <input
                  type="text"
                  placeholder="00-00-00"
                  maxLength={8} // 6 digits + 2 hyphens
                  className={`w-full h-[52px] px-5 bg-white rounded border border-gray-200 outline-none text-neutral-700 font-light text-neutral-700 ${inputStyles}`}
                  value={formik.values.sortCode || ""}
                  onChange={(e) => {
                    let value = e.target.value.replace(/\D/g, ""); // Remove all non-digits

                    // Apply the 00-00-00 pattern
                    let formatted = value;
                    if (value.length > 2 && value.length <= 4) {
                      formatted = `${value.slice(0, 2)}-${value.slice(2)}`;
                    } else if (value.length > 4) {
                      formatted = `${value.slice(0, 2)}-${value.slice(2, 4)}-${value.slice(4, 6)}`;
                    }

                    formik.setFieldValue("sortCode", formatted);
                  }}
                />
              </div>
              <div className="col-span-6 flex flex-col gap-2">
                <label className="text-neutral-700 text-[14px] font-weight-500">
                  Account Number
                </label>
                <input
                  placeholder="8 Digits Number"
                  className={`w-full h-[52px] px-5 bg-white rounded border border-gray-200 outline-none text-neutral-700 font-light text-neutral-700 ${inputStyles}`}
                  maxLength={8}
                  value={formik.values.accountNumber}
                  onChange={(e) =>
                    formik.setFieldValue("accountNumber", e.target.value)
                  }
                />
              </div>
            </div>

            {/* Row 2: Pay Notification Date */}
            <div className="grid grid-cols-12 gap-5 w-full">
              <div
                className="col-span-6 flex flex-col gap-2 relative"
                ref={payDateRef}
              >
                <label className="text-neutral-700 text-[14px] font-weight-500">
                  Pay Notification Date
                </label>
                <div
                  onClick={() => setShowPayDatePicker(!showPayDatePicker)}
                  className="h-[52px] px-5 bg-white rounded border border-gray-200 flex items-center justify-between cursor-pointer focus-within:border-blue-500"
                >
                  <span
                    className={
                      formik.values.payDriverNotificationDate
                        ? "text-neutral-700 font-light"
                        : "text-gray-300 font-light"
                    }
                  >
                    {formik.values.payDriverNotificationDate
                      ? formik.values.payDriverNotificationDate.toLocaleDateString(
                          "sv-SE",
                        )
                      : "Date"}
                  </span>
                  <img src={Vector6} className="w-4 h-4" alt="calendar" />
                </div>

                {showPayDatePicker && (
                  <div className="absolute bottom-[53px] left-0 z-[100] shadow-xl rounded-lg bg-white">
                    <CustomDatePicker
                      selectedDate={
                        formik.values.payDriverNotificationDate || new Date()
                      }
                      onDateSelect={(date) => {
                        formik.setFieldValue("payDriverNotificationDate", date);
                        setShowPayDatePicker(false);
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        {/* --- Section 4: VAT & Registration --- */}
        <div className="self-stretch p-5 rounded-lg border border-gray-100 flex flex-col gap-4 mt-6">
          {/* Header with Notify Manager Button */}
          <div className="self-stretch flex justify-between items-center">
            <h2 className="text-neutral-900 text-[20px] font-weight-600 leading-5 font-['Stack_Sans_Headline']">
              VAT & Registration
            </h2>
          </div>

          <div className="h-px bg-gray-100 w-full" />

          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-5">
              <span className="text-black text-sm font-weight-400">
                CI VAT Registered?
              </span>
              <div className="flex gap-8">
                {["Yes", "No"].map((option) => (
                  <label
                    key={option}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <div className="relative flex items-center justify-center">
                      <input
                        type="radio"
                        name="vatRegistered"
                        className="peer appearance-none transition-all"
                        checked={formik.values.vatRegistered === option}
                        onChange={() =>
                          formik.setFieldValue("vatRegistered", option)
                        }
                      />
                      {formik.values.vatRegistered === option ? (
                        <img src={Yes} />
                      ) : (
                        <img src={No} />
                      )}{" "}
                    </div>
                    <span className="text-sm text-gray-700">{option}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
        {/* Section 5: Vulnerable Persons Policy */}
        <div className="self-stretch p-5 rounded-lg border border-gray-100 flex flex-col gap-4 mt-6">
          {/* Header with Policy Link Button */}
          <div className="self-stretch flex justify-between items-center  cursor-pointer ">
            <h2 className="text-neutral-900 text-[20px] font-weight-600 leading-5 font-['Stack_Sans_Headline']">
              Vulnerable Persons Policy
            </h2>
            <div className="flex gap-4">
              {formik.values.vulnerablePerson === "Yes" && (
                <button
                  onClick={handleNotifyManager}
                  className="h-8 px-3 py-2 bg-blue-100 hover:bg-blue-100 rounded flex items-center gap-2.5 transition-colors group"
                >
                  <img src={Vector5} alt="" />
                  <span className="text-blue-600 text-sm font-normal">
                    Notify Manager
                  </span>
                </button>
              )}
              {/* {formik.values.vulnerablePerson === "Yes" && ( */}
              <button
                className="h-8 px-3 py-2 bg-blue-100 hover:bg-blue-100 rounded flex items-center gap-2.5 transition-colors group"
                onClick={handleVulnerablePersonPolicy}
                // download="Vulnerable_Person_Policy.docx"
              >
                <img src={Vulnerable} alt="" />
                <span className="text-blue-600 text-sm font-normal">
                  Vulnerable Policy
                </span>
              </button>
              {/* )} */}
            </div>
          </div>

          <div className="h-px bg-gray-100 w-full" />

          <div className="flex flex-col gap-6">
            {/* Question and Radio Buttons */}
            <div className="flex flex-col gap-5">
              <span className="text-black text-sm font-weight-400">
                Would you class the driver as a vulnerable person?
              </span>
              <div className="flex gap-8">
                {["Yes", "No"].map((option) => (
                  <label
                    key={option}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <div className="relative flex items-center justify-center">
                      <input
                        type="radio"
                        name="vulnerableStatus"
                        className="peer appearance-none transition-all"
                        checked={formik.values.vulnerablePerson === option}
                        onChange={() =>
                          formik.setFieldValue("vulnerablePerson", option)
                        }
                      />
                      {formik.values.vulnerablePerson === option ? (
                        <img src={Yes} />
                      ) : (
                        <img src={No} />
                      )}
                    </div>
                    <span className="text-sm text-gray-700">{option}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Conditional "Why?" Field and Notify Manager Button */}
            {formik.values.vulnerablePerson === "Yes" && (
              <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="flex flex-col gap-2">
                  <label className="text-neutral-700 text-[14px] font-weight-500">
                    Provide Reason
                  </label>
                  <textarea
                    placeholder="Please provide details regarding the driver's vulnerability..."
                    className={`w-full bg-transparent border border-gray-200 rounded outline-none text-neutral-700 font-light min-h-[130px] resize-none px-5 py-4 ${inputStyles}`}
                    value={formik.values.vulnerablePersonWhy}
                    onChange={(e) =>
                      formik.setFieldValue(
                        "vulnerablePersonWhy",
                        e.target.value,
                      )
                    }
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};