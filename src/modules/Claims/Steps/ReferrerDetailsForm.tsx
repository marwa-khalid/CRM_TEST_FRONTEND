import { components, type DropdownIndicatorProps, type StylesConfig } from "react-select";
import Vector6 from "../../../assets/AutoClaim_icon/Vector-6.svg";
import { useEffect, useState, useRef } from "react";
import { CustomDatePicker } from "../Components/DatePicker";
import { createReferrer, getCompanySuggestions, getReferrer, updateReferrer } from "../../../services/Referrer/Referrer";
import LeafletAutocompleteMap from "../../../components/GoogleMapAutoComplete/GoogleMapAutoComplete";
import * as Yup from "yup";
import { useFormik } from "formik";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";

// Blue arrow for react-select
const BlueDropdownIndicator = (props: DropdownIndicatorProps<any, false>) => (
  <components.DropdownIndicator {...props}>
    <svg width="12" height="7" viewBox="0 0 12 7" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M1 1L6 6L11 1" stroke="#0352FD" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  </components.DropdownIndicator>
);

// React-select styles
const customStyles: StylesConfig<any, false> = {
  control: (base, state) => ({
    ...base,
    height: '52px',
    borderRadius: '4px',
    borderColor: state.isFocused ? '#0352FD' : '#E5E7EB',
    boxShadow: 'none',
    '&:hover': { borderColor: '#0352FD' },
    paddingLeft: '8px',
    backgroundColor: 'white',
  }),
  placeholder: (base) => ({ ...base, color: '#9CA3AF', fontWeight: '300', fontSize: '16px' }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isSelected ? '#0352FD' : state.isFocused ? '#EFF6FF' : 'white',
    color: state.isSelected ? 'white' : '#374151',
  }),
};

export const ReferrerDetailsForm = ({ formRef }: any) => {
  const [companies, setCompanies] = useState<any[]>([]);
  // const { isLoaded } = useLoadScript({
  //   googleMapsApiKey: process.env.REACT_APP_GOOGLE_API_KEY!,
  //   libraries,
  // });

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
  //     complete: (results) => setCompanies(results.data),
  //   });
  // }, []);
    const [searchTerm, setSearchTerm] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
   useEffect(() => {
     const fetchCompanies = async () => {
       try {
         
         const response = await getCompanySuggestions(searchTerm); // Replace with your API endpoint
         
console.log(response)
         // Normalize empty strings to null
        //  const normalized = response.data.map((r) => ({
        //    company_name: r.company_name,
        //    address: r.address?.trim() || null,
        //    post_code: r.postcode?.trim() || null,
        //  }));

         setCompanies(response.data);
       } catch (err) {
         console.error(err);
       }
     };
     if (searchTerm) {
       fetchCompanies();
     }
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
useEffect(() => {
  const handleClickOutside = (event: MouseEvent) => {
    if (onHireRef2.current && !onHireRef2.current.contains(event.target as Node))
      setShowOnHirePicker2(false);
    if (
      offHireRef2.current &&
      !offHireRef2.current.contains(event.target as Node)
    )
      setShowOffHirePicker2(false);
  };
  document.addEventListener("mousedown", handleClickOutside);
  return () => document.removeEventListener("mousedown", handleClickOutside);
}, []);

const handleMobileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  let value = e.target.value.replace(/\D/g, ""); // remove non-digits

  if (value.length > 5) {
    value = value.slice(0, 5) + " " + value.slice(5, 11);
  }

  formik.setFieldValue("contact_number", value);
};
const cleanPayload = (obj: any) => {
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

  const claimId = localStorage.getItem("claimId")
  const referrerId = localStorage.getItem("referrerId");
  
  const formik = useFormik({
    initialValues: {
      claim_id: claimId || null,
      id: referrerId || null,
      company_name:null,
      address: null,
      postcode: null,
      primary_contact_number: null,
      country: "UK",
      contact_name: null,
      contact_number: null,
      contact_email: null,
      solicitor: null,
      third_party_capture: "Not Allowed",
      driver_commission: {
        on_hire_amount: null,
        on_hire_paid_on: null,
        congestion_charges: null,
        other_charges: null,
        off_hire_amount: null,
        off_hire_paid_on: null,
      },
      referrer_commission: {
        on_hire_amount: null,
        on_hire_paid_on: null,
        off_hire_amount: null,
        off_hire_paid_on: null,
      },
    },
    validationSchema: Yup.object().shape({}),
    onSubmit: async (values: any) => {
      try {
        const payload = {
          ...values,
          on_hire_payment: parseFloat(values.onHirePayment) || "",
          driver_commission: {
            congestion_charges:
              parseFloat(values.driver_commission.congestion_charges) || "",
            other_charges:
              parseFloat(values.driver_commission.other_charges) || "",
            off_hire_amount:
              parseFloat(values.driver_commission.off_hire_amount) || "",
            off_hire_paid_on: values.driver_commission.off_hire_paid_on,
            on_hire_amount:
              parseFloat(values.driver_commission.onHirePayment) || "",
            on_hire_paid_on: values.driver_commission.on_hire_paid_on,
          },
          referrer_commission: {
            on_hire_amount: values.referrer_commission.on_hire_amount,
            on_hire_paid_on: values.referrer_commission.on_hire_paid_on,
            off_hire_amount: values.referrer_commission.off_hire_amount,
            off_hire_paid_on: values.referrer_commission.off_hire_paid_on,
          },
          claim_id:claimId || null
        };

        const payloadToSend = cleanPayload(payload);
        console.log(payloadToSend);
        // return
        if (referrerId) {
          const response = await updateReferrer(payloadToSend, claimId);
          localStorage.setItem("referrerId", response.data.id);
        } else {
          const response = await createReferrer(payloadToSend);
          localStorage.setItem("referrerId", response.data.id);
        }
        toast.success("Referrer details saved successfully");
      } catch (error) {
        toast.error("Error saving referrer details");
        throw error;
      }
    },
  });
     useEffect(() => {
       const fetchData = async () => {
         const res = await getReferrer(parseInt(claimId))
         console.log(res)
         formik.setValues(res.data)
       }
       if (claimId && referrerId) {
         fetchData();
       }
        }, []);
  
useEffect(() => {
  if (formRef) {
    formRef.current = formik;
  }
}, [formRef, formik]);

  // Handle company select
const handleCompanySelect = (selected: any) => {
  // Update input field to show full company name
  setSearchTerm(selected.company_name);

  // Close dropdown
  setShowDropdown(false);

  // Set Formik fields (correct backend keys!)
  formik.setFieldValue("company_name", selected.company_name);
  formik.setFieldValue("address", selected.address ?? "");
  formik.setFieldValue("postcode", selected.postcode ?? "");
  formik.setFieldValue("referrer_id", selected.id ?? undefined);
};
   const { isClosed, selectedPosition } = useSelector(
     (state:any) => state.isClosed,
   );
  // Date Pickers
  const [showOnHirePicker, setShowOnHirePicker] = useState(false);
  const [showOffHirePicker, setShowOffHirePicker] = useState(false);
  const onHireRef = useRef<HTMLDivElement>(null);
  const offHireRef = useRef<HTMLDivElement>(null);
    const [showOnHirePicker2, setShowOnHirePicker2] = useState(false);
    const [showOffHirePicker2, setShowOffHirePicker2] = useState(false);
    const onHireRef2 = useRef<HTMLDivElement>(null);
    const offHireRef2 = useRef<HTMLDivElement>(null);

  const formatDate = (date: Date | null) => {
    if (!date) return "Date";
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };
  return (
    <div className="MainContent w-[788px] ms-[140px] flex-1 flex flex-col gap-6 p-8 overflow-y-auto scrollbar-hide font-['Stack_Sans_Headline'] ">
      <h1 className="text-black text-2xl font-weight-600 font-['Stack_Sans_Headline']">
        Referrer Details
      </h1>

      <div className="CaseDetailsSection self-stretch p-5 rounded-lg border border-gray-100 flex flex-col gap-4">
        <h2 className="text-black text-xl font-weight-600 leading-5">
          Referrer & Reporting Details
        </h2>
        <div className="h-px bg-gray-100 w-full" />
        <div className="flex flex-col gap-4">
          {/* Company Name Dropdown */}
          <div className="flex flex-col gap-2 relative">
            <label className="text-gray-700 text-sm font-weight-400">
              Company Name
            </label>
            <input
              type="text"
              value={searchTerm || formik.values.company_name}
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
                {companies.map((r, i) => (
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
          <label className="text-gray-700 text-sm font-weight-400">
            Company Address
          </label>
          {/* <input
            name="address"
            value={formik.values.address}
            onChange={(e) => formik.setFieldValue("address", e.target.value)}
            placeholder="Enter Address"
            className="w-full h-[52px] px-5 bg-white rounded border border-gray-200 text-gray-600 font-light"
          /> */}
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
        <div className="flex gap-5">
          <div className="flex-1 flex flex-col gap-2">
            <label className="text-gray-700 text-sm font-weight-400">
              Contact Name
            </label>
            <input
              name="contact_name"
              value={formik.values.contact_name}
              onChange={(e) =>
                formik.setFieldValue("contact_name", e.target.value)
              }
              placeholder="Enter Name"
              className="w-full h-[52px] px-5 bg-white rounded border border-gray-200 text-gray-600 font-light"
            />
          </div>
        </div>
        {/* Postcode & Contact Name */}
        <div className="flex gap-5">
          <div className="flex-1 flex flex-col gap-2">
            <label className="text-gray-700 text-sm font-weight-400">
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

          <div className="flex-1 flex flex-col gap-2 focus-within:border-blue-500 transition-all">
            <label className="text-gray-700 text-sm font-weight-400">
              Email Address
            </label>
            <input
              name="contact_email"
              type="email"
              value={formik.values.contact_email}
              onChange={(e) =>
                formik.setFieldValue("contact_email", e.target.value)
              }
              placeholder="Enter Email"
              className="w-full h-[52px] px-5 bg-white rounded border border-gray-200 text-gray-600 font-light focus-within:border-blue-500 transition-all"
            />
          </div>
        </div>

        {/* Email & Telephone */}
        <div className="flex gap-5">
          <div className="flex-1 flex flex-col gap-2">
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
          <div className="flex-1 flex flex-col col-6 gap-2"></div>
        </div>
      </div>
      {/* --- Section 2: Driver Commission Payments --- */}
      <div className="DriverCommissionPayments self-stretch p-5 rounded-lg border border-gray-100 flex flex-col gap-4">
        <h2 className="text-black text-xl font-weight-600 font-['Stack_Sans_Headline'] leading-5">
          Driver Commission Payments
        </h2>
        <div className="h-px bg-gray-100 w-full" />

        <div className="flex flex-col gap-6 w-full">
          {/* Row 1: On Hire Payment & Date */}
          <div className="grid grid-cols-12 gap-5 w-full">
            <div className="col-span-6 flex flex-col gap-2">
              <label className="text-gray-700 text-sm font-weight-400">
                On Hire Payment
              </label>
              <div className="h-[52px] px-5 bg-white rounded border border-gray-200 flex items-center gap-2.5 focus-within:border-blue-500 transition-all">
                <span className="text-gray-400 text-base font-light">£</span>
                <input
                  type="text"
                  value={formik.values.driver_commission.on_hire_amount}
                  onChange={(e) =>
                    formik.setFieldValue(
                      "driver_commission.on_hire_amount",
                      e.target.value,
                    )
                  }
                  className="w-full bg-transparent outline-none text-gray-900 font-light"
                />
              </div>
            </div>

            {/* On Hire Paid On Date Picker */}
            <div className="col-span-6 flex flex-col gap-2 relative">
              <label className="text-gray-700 text-sm font-weight-400">
                Paid On
              </label>
              <div
                onClick={() => setShowOnHirePicker(!showOnHirePicker)}
                className={`w-full h-[52px] px-5 bg-white rounded border flex items-center justify-between cursor-pointer transition-all
            ${showOnHirePicker ? "border-blue-500 ring-1 ring-blue-500" : "border-gray-200 hover:border-gray-300"}`}
              >
                <span
                  className={`${formik.values.driver_commission.on_hire_paid_on ? "text-gray-900" : "text-gray-400"} font-light`}
                >
                  {formatDate(formik.values.driver_commission.on_hire_paid_on)}
                </span>
                <img src={Vector6} alt="calendar" />
              </div>
              {showOnHirePicker && (
                <div className="absolute bottom-[300px] left-0 z-[100]">
                  <CustomDatePicker
                    selectedDate={
                      formik.values.driver_commission.on_hire_paid_on ||
                      new Date()
                    }
                    onDateSelect={(date) => {
                      formik.setFieldValue(
                        "driver_commission.on_hire_paid_on",
                        date,
                      );
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
              <label className="text-gray-700 text-sm font-weight-400">
                Off Hire Payment
              </label>
              <div className="h-[52px] px-5 bg-white rounded border border-gray-200 flex items-center gap-2.5 focus-within:border-blue-500 transition-all">
                <span className="text-gray-400 text-base font-light">£</span>
                <input
                  type="text"
                  value={formik.values.driver_commission.off_hire_amount}
                  onChange={(e) =>
                    formik.setFieldValue(
                      "driver_commission.off_hire_amount",
                      e.target.value,
                    )
                  }
                  className="w-full bg-transparent outline-none text-gray-900 font-light"
                />
              </div>
            </div>

            {/* Off Hire Paid On Date Picker */}
            <div className="col-span-6 flex flex-col gap-2 relative">
              <label className="text-gray-700 text-sm font-weight-400">
                Paid On
              </label>
              <div
                onClick={() => setShowOffHirePicker(!showOffHirePicker)}
                className={`w-full h-[52px] px-5 bg-white rounded border flex items-center justify-between cursor-pointer transition-all
            ${showOffHirePicker ? "border-blue-500 ring-1 ring-blue-500" : "border-gray-200 hover:border-gray-300"}`}
              >
                <span
                  className={`${formik.values.driver_commission.off_hire_paid_on ? "text-gray-900" : "text-gray-400"} font-light`}
                >
                  {formatDate(formik.values.driver_commission.off_hire_paid_on)}
                </span>
                <img src={Vector6} alt="calendar" />
              </div>
              {showOffHirePicker && (
                <div className="absolute bottom-[300px] left-0 z-[100]">
                  <CustomDatePicker
                    selectedDate={
                      formik.values.driver_commission.off_hire_paid_on ||
                      new Date()
                    }
                    onDateSelect={(date) => {
                      formik.setFieldValue(
                        "driver_commission.off_hire_paid_on",
                        date,
                      );
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
              <label className="text-gray-700 text-sm font-weight-400">
                Congestion Charges
              </label>
              <div className="h-[52px] px-5 bg-white rounded border border-gray-200 flex items-center gap-2.5 focus-within:border-blue-500 transition-all">
                <span className="text-gray-400 text-base font-light">£</span>
                <input
                  type="text"
                  value={formik.values.congestion_charges}
                  onChange={(e) =>
                    formik.setFieldValue("congestion_charges", e.target.value)
                  }
                  className="w-full bg-transparent outline-none text-gray-900 font-light"
                />
              </div>
            </div>

            <div className="col-span-6 flex flex-col gap-2">
              <label className="text-gray-700 text-sm font-weight-400">
                Other Charges
              </label>
              <div className="h-[52px] px-5 bg-white rounded border border-gray-200 flex items-center gap-2.5 focus-within:border-blue-500 transition-all">
                <span className="text-gray-400 text-base font-light">£</span>
                <input
                  type="text"
                  value={formik.values.other_charges}
                  onChange={(e) =>
                    formik.setFieldValue("other_charges", e.target.value)
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
        <h2 className="text-black text-xl font-weight-600 font-['Stack_Sans_Headline'] leading-5">
          Referrer Commission Review
        </h2>
        <div className="h-px bg-gray-100 w-full" />

        <div className="flex flex-col gap-6 w-full">
          {/* Row 1: On Hire Payment & Date */}
          <div className="grid grid-cols-12 gap-5 w-full">
            <div className="col-span-6 flex flex-col gap-2">
              <label className="text-gray-700 text-sm font-weight-400">
                On Hire Payment
              </label>
              <div className="h-[52px] px-5 bg-white rounded border border-gray-200 flex items-center gap-2.5 focus-within:border-blue-500 transition-all">
                <span className="text-gray-400 text-base font-light">£</span>
                <input
                  type="text"
                  value={formik.values.referrer_commission.on_hire_amount}
                  onChange={(e) =>
                    formik.setFieldValue(
                      "referrer_commission.on_hire_amount",
                      e.target.value,
                    )
                  }
                  className="w-full bg-transparent outline-none text-gray-900 font-light"
                />
              </div>
            </div>

            {/* On Hire Paid On Date Picker */}
            <div className="col-span-6 flex flex-col gap-2 relative">
              <label className="text-gray-700 text-sm font-weight-400">
                Paid On
              </label>
              <div
                onClick={() => setShowOnHirePicker2(!showOnHirePicker2)}
                className={`w-full h-[52px] px-5 bg-white rounded border flex items-center justify-between cursor-pointer transition-all
            ${showOnHirePicker2 ? "border-blue-500 ring-1 ring-blue-500" : "border-gray-200 hover:border-gray-300"}`}
              >
                <span
                  className={`${formik.values.referrer_commission.on_hire_paid_on ? "text-gray-900" : "text-gray-400"} font-light`}
                >
                  {formatDate(
                    formik.values.referrer_commission.on_hire_paid_on,
                  )}
                </span>
                <img src={Vector6} alt="calendar" />
              </div>
              {showOnHirePicker2 && (
                <div className="absolute bottom-[300px] left-0 z-[100]">
                  <CustomDatePicker
                    selectedDate={
                      formik.values.referrer_commission.on_hire_paid_on ||
                      new Date()
                    }
                    onDateSelect={(date) => {
                      formik.setFieldValue(
                        "referrer_commission.on_hire_paid_on",
                        date,
                      );
                      setShowOnHirePicker2(false);
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Row 2: Off Hire Payment & Date */}
          <div className="grid grid-cols-12 gap-5 w-full">
            <div className="col-span-6 flex flex-col gap-2">
              <label className="text-gray-700 text-sm font-weight-400">
                Off Hire Payment
              </label>
              <div className="h-[52px] px-5 bg-white rounded border border-gray-200 flex items-center gap-2.5 focus-within:border-blue-500 transition-all">
                <span className="text-gray-400 text-base font-light">£</span>
                <input
                  type="text"
                  value={formik.values.referrer_commission.off_hire_amount}
                  onChange={(e) =>
                    formik.setFieldValue(
                      "referrer_commission.off_hire_amount",
                      e.target.value,
                    )
                  }
                  className="w-full bg-transparent outline-none text-gray-900 font-light"
                />
              </div>
            </div>

            {/* Off Hire Paid On Date Picker */}
            <div className="col-span-6 flex flex-col gap-2 relative">
              <label className="text-gray-700 text-sm font-weight-400">
                Paid On
              </label>
              <div
                onClick={() => setShowOffHirePicker2(!showOffHirePicker2)}
                className={`w-full h-[52px] px-5 bg-white rounded border flex items-center justify-between cursor-pointer transition-all
            ${showOffHirePicker2 ? "border-blue-500 ring-1 ring-blue-500" : "border-gray-200 hover:border-gray-300"}`}
              >
                <span
                  className={`${formik.values.referrer_commission.off_hire_paid_on ? "text-gray-900" : "text-gray-400"} font-light`}
                >
                  {formatDate(
                    formik.values.referrer_commission.off_hire_paid_on,
                  )}
                </span>
                <img src={Vector6} alt="calendar" />
              </div>
              {showOffHirePicker2 && (
                <div className="absolute bottom-[300px] left-0 z-[100]">
                  <CustomDatePicker
                    selectedDate={
                      formik.values.referrer_commission.off_hire_paid_on ||
                      new Date()
                    }
                    onDateSelect={(date) => {
                      formik.setFieldValue(
                        "referrer_commission.off_hire_paid_on",
                        date,
                      );
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
        <h2 className="text-black text-xl font-weight-600 leading-5 font-['Stack_Sans_Headline']">
          Referrers Nominated Solicitor (PI must go to)
        </h2>

        <div className="h-px bg-gray-100 w-full" />

        <div className="grid grid-cols-12 gap-5 w-full items-start">
          {/* Left Column: Solicitor */}
          <div className="col-span-6 flex flex-col gap-2">
            <label className="text-gray-700 text-sm font-weight-400 h-[20px] flex items-center">
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
            <span className="text-gray-700 text-sm font-weight-400 h-[20px] flex items-center">
              Third Party Capture
            </span>

            <div className="h-[52px] flex items-center gap-8">
              {/* Allowed Option */}
              <label className="flex items-center gap-2 cursor-pointer group">
                <div className="relative flex items-center justify-center">
                  <input
                    type="radio"
                    name="third_party_capture"
                    value="allowed"
                    checked={formik.values.third_party_capture === "allowed"}
                    onChange={() =>
                      formik.setFieldValue("third_party_capture", "allowed")
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
                    name="third_party_capture"
                    value="notAllowed"
                    checked={formik.values.third_party_capture === "notAllowed"}
                    onChange={() =>
                      formik.setFieldValue("third_party_capture", "notAllowed")
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
