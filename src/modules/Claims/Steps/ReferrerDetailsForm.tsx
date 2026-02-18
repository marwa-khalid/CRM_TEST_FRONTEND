import { components, type DropdownIndicatorProps, type StylesConfig } from "react-select";
import Select from "react-select";
import Vector6 from "../../../assets/AutoClaim_icon/Vector-6.svg";
import { useEffect, useState, useRef } from "react";
import { CustomDatePicker } from "../Components/DatePicker";
import { createReferrer, getCompanySuggestions } from "../../../services/Referrer/Referrer";
import { useLoadScript } from "@react-google-maps/api";

const libraries: "places"[] = ["places"];
import * as Yup from "yup";
import { useFormik } from "formik";
import { toast } from "react-toastify";

// Blue arrow for react-select
const BlueDropdownIndicator = (props: DropdownIndicatorProps<any, false>) => (
  <components.DropdownIndicator {...props}>
    <svg width="12" height="7" viewBox="0 0 12 7" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M1 1L6 6L11 1" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  </components.DropdownIndicator>
);

// React-select styles
const customStyles: StylesConfig<any, false> = {
  control: (base, state) => ({
    ...base,
    height: '52px',
    borderRadius: '4px',
    borderColor: state.isFocused ? '#3B82F6' : '#E5E7EB',
    boxShadow: 'none',
    '&:hover': { borderColor: '#3B82F6' },
    paddingLeft: '8px',
    backgroundColor: 'white',
  }),
  placeholder: (base) => ({ ...base, color: '#9CA3AF', fontWeight: '300', fontSize: '16px' }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isSelected ? '#3B82F6' : state.isFocused ? '#EFF6FF' : 'white',
    color: state.isSelected ? 'white' : '#374151',
  }),
};

export const ReferrerDetailsForm = ({ formRef }: any) => {
  const [referrers, setReferrers] = useState<any[]>([]);
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_API_KEY!,
    libraries,
  });

interface Referrer {
  company_name: string;
  address: string | null;
  post_code: string | null;
}

interface Option {
  label: string;
  value: string;
}
  // Load CSV
  // useEffect(() => {
  //   Papa.parse("/referrers.csv", {
  //     download: true,
  //     header: true,
  //     complete: (results) => setReferrers(results.data),
  //   });
  // }, []);
    const [searchTerm, setSearchTerm] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
   useEffect(() => {
     const fetchReferrers = async () => {
       try {
         const response = await getCompanySuggestions(searchTerm); // Replace with your API endpoint
         
console.log(response)
         // Normalize empty strings to null
        //  const normalized = response.data.map((r) => ({
        //    company_name: r.company_name,
        //    address: r.address?.trim() || null,
        //    post_code: r.postcode?.trim() || null,
        //  }));

         setReferrers(response.data);
       } catch (err) {
         console.error(err);
       }
     };

     fetchReferrers();
   }, [searchTerm]);
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          onHireRef.current &&
          !onHireRef.current.contains(event.target as Node)
        )
          setShowOnHirePicker(false);
        if (
          offHireRef.current &&
          !offHireRef.current.contains(event.target as Node)
        )
          setShowOffHirePicker(false);
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }, []);

console.log(referrers)
  const formik = useFormik({
    initialValues: {
      referrer_id: undefined,
      companyName: "",
      address: "",
      postcode: "",
      contactName: "",
      tel: "",
      email: "",
      onHirePaymentAmount: "",
      onHirePaymentPaidOn: "",
      offHirePaymentDriver: "",
      offHirePaymentPaidOn: "",
      backEndPaymentAmount: "",
      backEndPaymentPaidOn: "",
      congestionCharges: "",
      otherCharges: "",
      solicitor: "",
      thirdPartyCapture: "Not Allowed",
    },
    validationSchema: Yup.object().shape({}),
    onSubmit: async (values: any) => {
      try {
        await createReferrer(values);
        toast.success("Referrer details saved successfully");
      } catch (error) {
        toast.error("Error saving details");
        throw error;
      }
    },
  });

  // Handle company select
const handleCompanySelect = (selected: any) => {
  // Update input field to show full company name
  setSearchTerm(selected.company_name);

  // Close dropdown
  setShowDropdown(false);

  // Set Formik fields (correct backend keys!)
  formik.setFieldValue("companyName", selected.company_name);
  formik.setFieldValue("address", selected.address ?? "");
  formik.setFieldValue("postcode", selected.postcode ?? "");
  formik.setFieldValue("referrer_id", selected.id ?? undefined);
};

  // Date Pickers
  const [showOnHirePicker, setShowOnHirePicker] = useState(false);
  const [showOffHirePicker, setShowOffHirePicker] = useState(false);
  const onHireRef = useRef<HTMLDivElement>(null);
  const offHireRef = useRef<HTMLDivElement>(null);

  const formatDate = (date: Date | null) => {
    if (!date) return "Date";
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };
  return (
    <div className="MainContent w-[788px] ms-[140px] flex-1 flex flex-col gap-6 p-8 overflow-y-auto scrollbar-hide">
      <h1 className="text-black text-2xl font-semibold font-['Stack_Sans_Headline']">
        Referrer Details
      </h1>

      <div className="CaseDetailsSection self-stretch p-5 rounded-lg border border-gray-100 flex flex-col gap-4">
        <h2 className="text-black text-xl font-semibold leading-5">
          Referrer & Reporting Details
        </h2>
        <div className="h-px bg-gray-100 w-full" />
        <div className="flex flex-col gap-4">
          {/* Company Name Dropdown */}
          <div className="flex flex-col gap-2 relative">
            <label className="text-gray-700 text-sm font-medium">
              Company Name
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setShowDropdown(true);
              }}
              onFocus={() => setShowDropdown(true)}
              placeholder="Enter Name"
              className="w-full h-[52px] px-5 bg-white rounded border border-gray-200 text-gray-900 font-light"
            />
            {showDropdown && searchTerm && (
              <div className="absolute top-[80px] left-0 w-full bg-white border border-gray-200 rounded-md shadow-lg z-50 max-h-60 overflow-y-auto">
                {referrers.map((r, i) => (
                  <div
                    key={i}
                    onClick={() => handleCompanySelect(r)}
                    className="px-5 py-3 hover:bg-gray-50 cursor-pointer text-sm text-gray-700 border-b border-gray-50 last:border-none"
                  >
                    {r.company_name}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        {/* Address */}
        <div className="flex flex-col gap-2">
          <label className="text-gray-700 text-sm font-medium">
            Company Address
          </label>
          <input
            name="address"
            value={formik.values.address}
            onChange={(e) => formik.setFieldValue("address", e.target.value)}
            placeholder="Enter Address"
            className="w-full h-[52px] px-5 bg-white rounded border border-gray-200 text-gray-600 font-light"
          />
        </div>
        <div className="flex gap-5">
          <div className="flex-1 flex flex-col gap-2">
            <label className="text-gray-700 text-sm font-medium">
              Contact Name
            </label>
            <input
              name="contactName"
              value={formik.values.contactName}
              onChange={(e) =>
                formik.setFieldValue("contactName", e.target.value)
              }
              placeholder="Enter Name"
              className="w-full h-[52px] px-5 bg-white rounded border border-gray-200 text-gray-600 font-light"
            />
          </div>
        </div>
        {/* Postcode & Contact Name */}
        <div className="flex gap-5">
          <div className="flex-1 flex flex-col gap-2">
            <label className="text-gray-700 text-sm font-medium">
              Post Code
            </label>
            <input
              name="postcode"
              value={formik.values.postcode}
              onChange={(e) => formik.setFieldValue("postcode", e.target.value)}
              placeholder="Enter Postcode"
              className="w-full h-[52px] px-5 bg-white rounded border border-gray-200 text-gray-600 font-light"
            />
          </div>

          <div className="flex-1 flex flex-col gap-2">
            <label className="text-gray-700 text-sm font-medium">
              Email Address
            </label>
            <input
              name="email"
              type="email"
              value={formik.values.email}
              onChange={(e) => formik.setFieldValue("email", e.target.value)}
              placeholder="Enter Email"
              className="w-full h-[52px] px-5 bg-white rounded border border-gray-200 text-gray-600 font-light"
            />
          </div>
        </div>

        {/* Email & Telephone */}
        <div className="flex gap-5">
          <div className="flex-1 flex flex-col gap-2">
            <label className="text-gray-700 text-sm font-medium">
              Mobile Number
            </label>
            <div className="relative h-[52px] px-5 bg-white rounded border border-gray-200 flex items-center gap-2.5">
              <span className="text-gray-300 text-base font-light">+44</span>
              <input
                name="tel"
                type="tel"
                value={formik.values.tel}
                onChange={(e) => formik.setFieldValue("tel", e.target.value)}
                className="w-full bg-transparent outline-none text-gray-900 font-light placeholder:text-gray-300"
              />
            </div>
          </div>
          <div className="flex-1 flex flex-col col-6 gap-2"></div>
        </div>
      </div>
      {/* --- Section 2: Driver Commission Payments --- */}
      <div className="DriverCommissionPayments self-stretch p-5 rounded-lg border border-gray-100 flex flex-col gap-4">
        <h2 className="text-black text-xl font-semibold font-['Stack_Sans_Headline'] leading-5">
          Driver Commission Payments
        </h2>
        <div className="h-px bg-gray-100 w-full" />

        <div className="flex flex-col gap-6 w-full">
          {/* Row 1: On Hire Payment & Date */}
          <div className="grid grid-cols-12 gap-5 w-full">
            <div className="col-span-6 flex flex-col gap-2">
              <label className="text-gray-700 text-sm font-medium">
                On Hire Payment
              </label>
              <div className="h-[52px] px-5 bg-white rounded border border-gray-200 flex items-center gap-2.5 focus-within:border-blue-500 transition-all">
                <span className="text-gray-400 text-base font-light">£</span>
                <input
                  type="text"
                  value={formik.values.onHirePaymentAmount}
                  onChange={(e) =>
                    formik.setFieldValue("onHirePaymentAmount", e.target.value)
                  }
                  className="w-full bg-transparent outline-none text-gray-900 font-light"
                />
              </div>
            </div>

            {/* On Hire Paid On Date Picker */}
            <div className="col-span-6 flex flex-col gap-2 relative">
              <label className="text-gray-700 text-sm font-medium">
                Paid On
              </label>
              <div
                onClick={() => setShowOnHirePicker(!showOnHirePicker)}
                className={`w-full h-[52px] px-5 bg-white rounded border flex items-center justify-between cursor-pointer transition-all
            ${showOnHirePicker ? "border-blue-500 ring-1 ring-blue-500" : "border-gray-200 hover:border-gray-300"}`}
              >
                <span
                  className={`${formik.values.onHirePaymentPaidOn ? "text-gray-900" : "text-gray-400"} font-light`}
                >
                  {formatDate(formik.values.onHirePaymentPaidOn)}
                </span>
                <img src={Vector6} alt="calendar" />
              </div>
              {showOnHirePicker && (
                <div className="absolute bottom-[300px] left-0 z-[100]">
                  <CustomDatePicker
                    selectedDate={
                      formik.values.onHirePaymentPaidOn || new Date()
                    }
                    onDateSelect={(date) => {
                      formik.setFieldValue("onHirePaymentPaidOn", date);
                      setShowOnHirePicker(false);
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Row 2: Off Hire Payment & Date */}
          <div className="grid grid-cols-12 gap-5 w-full">
            <div className="col-span-6 flex flex-col gap-2">
              <label className="text-gray-700 text-sm font-medium">
                Off Hire Payment
              </label>
              <div className="h-[52px] px-5 bg-white rounded border border-gray-200 flex items-center gap-2.5 focus-within:border-blue-500 transition-all">
                <span className="text-gray-400 text-base font-light">£</span>
                <input
                  type="text"
                  value={formik.values.offHirePaymentDriver}
                  onChange={(e) =>
                    formik.setFieldValue("offHirePaymentDriver", e.target.value)
                  }
                  className="w-full bg-transparent outline-none text-gray-900 font-light"
                />
              </div>
            </div>

            {/* Off Hire Paid On Date Picker */}
            <div className="col-span-6 flex flex-col gap-2 relative">
              <label className="text-gray-700 text-sm font-medium">
                Paid On
              </label>
              <div
                onClick={() => setShowOffHirePicker(!showOffHirePicker)}
                className={`w-full h-[52px] px-5 bg-white rounded border flex items-center justify-between cursor-pointer transition-all
            ${showOffHirePicker ? "border-blue-500 ring-1 ring-blue-500" : "border-gray-200 hover:border-gray-300"}`}
              >
                <span
                  className={`${formik.values.offHirePaymentPaidOn ? "text-gray-900" : "text-gray-400"} font-light`}
                >
                  {formatDate(formik.values.offHirePaymentPaidOn)}
                </span>
                <img src={Vector6} alt="calendar" />
              </div>
              {showOffHirePicker && (
                <div className="absolute bottom-[300px] left-0 z-[100]">
                  <CustomDatePicker
                    selectedDate={
                      formik.values.offHirePaymentPaidOn || new Date()
                    }
                    onDateSelect={(date) => {
                      formik.setFieldValue("offHirePaymentPaidOn", date);
                      setShowOffHirePicker(false);
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Row 3: Congestion & Other Charges */}
          <div className="grid grid-cols-12 gap-5 w-full">
            <div className="col-span-6 flex flex-col gap-2">
              <label className="text-gray-700 text-sm font-medium">
                Congestion Charges
              </label>
              <div className="h-[52px] px-5 bg-white rounded border border-gray-200 flex items-center gap-2.5 focus-within:border-blue-500 transition-all">
                <span className="text-gray-400 text-base font-light">£</span>
                <input
                  type="text"
                  value={formik.values.congestionCharges}
                  onChange={(e) =>
                    formik.setFieldValue("congestionCharges", e.target.value)
                  }
                  className="w-full bg-transparent outline-none text-gray-900 font-light"
                />
              </div>
            </div>

            <div className="col-span-6 flex flex-col gap-2">
              <label className="text-gray-700 text-sm font-medium">
                Other Charges
              </label>
              <div className="h-[52px] px-5 bg-white rounded border border-gray-200 flex items-center gap-2.5 focus-within:border-blue-500 transition-all">
                <span className="text-gray-400 text-base font-light">£</span>
                <input
                  type="text"
                  value={formik.values.otherCharges}
                  onChange={(e) =>
                    formik.setFieldValue("otherCharges", e.target.value)
                  }
                  className="w-full bg-transparent outline-none text-gray-900 font-light"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- Section 3: Referrer Commission Review --- */}
      <div className="DriverCommissionPayments self-stretch p-5 rounded-lg border border-gray-100 flex flex-col gap-4">
        <h2 className="text-black text-xl font-semibold font-['Stack_Sans_Headline'] leading-5">
          Referrer Commission Review
        </h2>
        <div className="h-px bg-gray-100 w-full" />

        <div className="flex flex-col gap-6 w-full">
          {/* Row 1: On Hire Payment & Date */}
          <div className="grid grid-cols-12 gap-5 w-full">
            <div className="col-span-6 flex flex-col gap-2">
              <label className="text-gray-700 text-sm font-medium">
                On Hire Payment
              </label>
              <div className="h-[52px] px-5 bg-white rounded border border-gray-200 flex items-center gap-2.5 focus-within:border-blue-500 transition-all">
                <span className="text-gray-400 text-base font-light">£</span>
                <input
                  type="text"
                  value={formik.values.referrerOnHireAmount}
                  onChange={(e) =>
                    formik.setFieldValue("referrerOnHireAmount", e.target.value)
                  }
                  className="w-full bg-transparent outline-none text-gray-900 font-light"
                />
              </div>
            </div>

            {/* On Hire Paid On Date Picker */}
            <div className="col-span-6 flex flex-col gap-2 relative">
              <label className="text-gray-700 text-sm font-medium">
                Paid On
              </label>
              <div
                onClick={() => setShowOnHirePicker(!showOnHirePicker)}
                className={`w-full h-[52px] px-5 bg-white rounded border flex items-center justify-between cursor-pointer transition-all
            ${showOnHirePicker ? "border-blue-500 ring-1 ring-blue-500" : "border-gray-200 hover:border-gray-300"}`}
              >
                <span
                  className={`${formik.values.referrerOnHirePaidOn ? "text-gray-900" : "text-gray-400"} font-light`}
                >
                  {formatDate(formik.values.referrerOnHirePaidOn)}
                </span>
                <img src={Vector6} alt="calendar" />
              </div>
              {showOnHirePicker && (
                <div className="absolute bottom-[300px] left-0 z-[100]">
                  <CustomDatePicker
                    selectedDate={
                      formik.values.referrerOnHirePaidOn || new Date()
                    }
                    onDateSelect={(date) => {
                      formik.setFieldValue("referrerOnHirePaidOn", date);
                      setShowOnHirePicker(false);
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Row 2: Off Hire Payment & Date */}
          <div className="grid grid-cols-12 gap-5 w-full">
            <div className="col-span-6 flex flex-col gap-2">
              <label className="text-gray-700 text-sm font-medium">
                Off Hire Payment
              </label>
              <div className="h-[52px] px-5 bg-white rounded border border-gray-200 flex items-center gap-2.5 focus-within:border-blue-500 transition-all">
                <span className="text-gray-400 text-base font-light">£</span>
                <input
                  type="text"
                  value={formik.values.referrerOffHireAmount}
                  onChange={(e) =>
                    formik.setFieldValue(
                      "referrerOffHireAmount",
                      e.target.value,
                    )
                  }
                  className="w-full bg-transparent outline-none text-gray-900 font-light"
                />
              </div>
            </div>

            {/* Off Hire Paid On Date Picker */}
            <div className="col-span-6 flex flex-col gap-2 relative">
              <label className="text-gray-700 text-sm font-medium">
                Paid On
              </label>
              <div
                onClick={() => setShowOffHirePicker(!showOffHirePicker)}
                className={`w-full h-[52px] px-5 bg-white rounded border flex items-center justify-between cursor-pointer transition-all
            ${showOffHirePicker ? "border-blue-500 ring-1 ring-blue-500" : "border-gray-200 hover:border-gray-300"}`}
              >
                <span
                  className={`${formik.values.referrerOffHirePaidOn ? "text-gray-900" : "text-gray-400"} font-light`}
                >
                  {formatDate(formik.values.referrerOffHirePaidOn)}
                </span>
                <img src={Vector6} alt="calendar" />
              </div>
              {showOffHirePicker && (
                <div className="absolute bottom-[300px] left-0 z-[100]">
                  <CustomDatePicker
                    selectedDate={
                      formik.values.referrerOffHirePaidOn || new Date()
                    }
                    onDateSelect={(date) => {
                      formik.setFieldValue("referrerOffHirePaidOn", date);
                      setShowOffHirePicker(false);
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* --- Section 4: Referrers Nominated Solicitor --- */}
      <div className="self-stretch p-5 rounded-lg border border-gray-100 flex flex-col gap-4">
        <h2 className="text-black text-xl font-semibold leading-5 font-['Stack_Sans_Headline']">
          Referrers Nominated Solicitor (PI must go to)
        </h2>

        <div className="h-px bg-gray-100 w-full" />

        <div className="grid grid-cols-12 gap-5 w-full items-start">
          {/* Left Column: Solicitor */}
          <div className="col-span-6 flex flex-col gap-2">
            <label className="text-gray-700 text-sm font-medium h-[20px] flex items-center">
              Solicitor
            </label>
            <div className="h-[52px] px-5 bg-white rounded border border-gray-200 flex items-center focus-within:border-blue-500 transition-all">
              <input
                type="text"
                name="solicitor"
                placeholder="Enter Solicitor Name"
                value={formik.values.solicitor}
                onChange={(e) =>
                  formik.setFieldValue("solicitor", e.target.value)
                }
                className="w-full bg-transparent outline-none text-gray-900 font-light"
              />
            </div>
          </div>

          {/* Right Column: Third Party Capture */}
          <div className="col-span-6 flex flex-col gap-2">
            <span className="text-gray-700 text-sm font-medium h-[20px] flex items-center">
              Third Party Capture
            </span>

            <div className="h-[52px] flex items-center gap-8">
              {/* Allowed Option */}
              <label className="flex items-center gap-2 cursor-pointer group">
                <div className="relative flex items-center justify-center">
                  <input
                    type="radio"
                    name="thirdPartyCapture"
                    value="allowed"
                    checked={formik.values.thirdPartyCapture === "allowed"}
                    onChange={() =>
                      formik.setFieldValue("thirdPartyCapture", "allowed")
                    }
                    className="peer appearance-none w-5 h-5 rounded-full border border-gray-300 checked:border-blue-500 checked:bg-blue-50 transition-all"
                  />
                  <div className="absolute w-2 h-2 bg-blue-500 rounded-full opacity-0 peer-checked:opacity-100 transition-opacity" />
                </div>
                <span className="text-sm text-gray-700">Allowed</span>
              </label>

              {/* Not Allowed Option */}
              <label className="flex items-center gap-2 cursor-pointer group">
                <div className="relative flex items-center justify-center">
                  <input
                    type="radio"
                    name="thirdPartyCapture"
                    value="notAllowed"
                    checked={formik.values.thirdPartyCapture === "notAllowed"}
                    onChange={() =>
                      formik.setFieldValue("thirdPartyCapture", "notAllowed")
                    }
                    className="peer appearance-none w-5 h-5 rounded-full border border-gray-300 checked:border-blue-500 checked:bg-blue-50 transition-all"
                  />
                  <div className="absolute w-2 h-2 bg-blue-500 rounded-full opacity-0 peer-checked:opacity-100 transition-opacity" />
                </div>
                <span className="text-sm text-gray-700">Not Allowed</span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
