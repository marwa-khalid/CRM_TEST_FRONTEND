import Vector6 from "../../../assets/AutoClaim_icon/Vector-6.svg";
import { useEffect, useState, useRef } from "react";
import { CustomDatePicker } from "../Components/DatePicker";
import {
  createReferrer,
  getCompanySuggestions,
  getReferrer,
  updateReferrer,
} from "../../../services/Referrer/Referrer";
import LeafletAutocompleteMap from "../../../components/GoogleMapAutoComplete/GoogleMapAutoComplete";
import * as Yup from "yup";
import { useFormik } from "formik";
import { toast } from "react-toastify";
import Yes from "../../../assets/AutoClaim_icon/Yes.svg";
import No from "../../../assets/AutoClaim_icon/No.svg";
import type2 from "../../../assets/AutoClaim_icon/analyzing.svg";

export const ReferrerDetailsForm = ({ formRef }: any) => {
  const claimId = localStorage.getItem("claimId");
  const referrerId = localStorage.getItem("referrerId");

  const [companies, setCompanies] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  const [showOnHirePicker, setShowOnHirePicker] = useState(false);
  const [showOffHirePicker, setShowOffHirePicker] = useState(false);
  const [showOnHirePicker2, setShowOnHirePicker2] = useState(false);
  const [showOffHirePicker2, setShowOffHirePicker2] = useState(false);

  const onHireRef = useRef<HTMLDivElement>(null);
  const offHireRef = useRef<HTMLDivElement>(null);
  const onHireRef2 = useRef<HTMLDivElement>(null);
  const offHireRef2 = useRef<HTMLDivElement>(null);

  const inputStyles = `hover:border-neutral-400 focus:border-blue-500 focus:outline-none font-light transition-colors`;

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

  const formatMoney = (value: any) => {
    if (value === null || value === undefined || value === "") return "";
    const num = Number(value);
    if (Number.isNaN(num)) return "";
    return num.toFixed(2);
  };
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const formatMoneyOnBlur = (fieldName: string, value: any) => {
    formik.setFieldValue(fieldName, formatMoney(value));
  };

  const formik = useFormik({
    initialValues: {
      claim_id: claimId ? Number(claimId) : null,
      id: referrerId || null,
      company_name: "",
      address: "",
      postcode: "",
      primary_contact_number: "",
      country: "UK",
      contact_name: "",
      contact_number: "",
      contact_email: "",
      solicitor: "",
      third_party_capture: "Not Allowed",
      driver_commission: {
        on_hire_amount: "",
        on_hire_paid_on: "",
        congestion_charges: "",
        other_charges: "",
        off_hire_amount: "",
        off_hire_paid_on: "",
      },
      referrer_commission: {
        on_hire_amount: "",
        on_hire_paid_on: "",
        off_hire_amount: "",
        off_hire_paid_on: "",
      },
    },
    validationSchema: Yup.object().shape({}),
    onSubmit: async (values: any) => {
      try {
    setIsAnalyzing(true);
        
        const payload = {
          ...values,
          claim_id: claimId ? Number(claimId) : null,

          driver_commission: {
            on_hire_amount: formatMoney(
              values.driver_commission?.on_hire_amount,
            ),
            on_hire_paid_on: values.driver_commission?.on_hire_paid_on || null,

            off_hire_amount: formatMoney(
              values.driver_commission?.off_hire_amount,
            ),
            off_hire_paid_on:
              values.driver_commission?.off_hire_paid_on || null,

            congestion_charges: formatMoney(
              values.driver_commission?.congestion_charges,
            ),
            other_charges: formatMoney(values.driver_commission?.other_charges),
          },

          referrer_commission: {
            on_hire_amount: formatMoney(
              values.referrer_commission?.on_hire_amount,
            ),
            on_hire_paid_on:
              values.referrer_commission?.on_hire_paid_on || null,

            off_hire_amount: formatMoney(
              values.referrer_commission?.off_hire_amount,
            ),
            off_hire_paid_on:
              values.referrer_commission?.off_hire_paid_on || null,
          },
        };

        const payloadToSend = cleanPayload(payload);

        let response;

        if (referrerId) {
          response = await updateReferrer(payloadToSend, claimId);
        } else {
          response = await createReferrer(payloadToSend);
        }

        localStorage.setItem("referrerId", response.data.id);
        toast.success("Referrer details saved successfully");
      } catch (error) {
        toast.error("Error saving referrer details");
        throw error;
      }finally{
    setIsAnalyzing(false);

      }
    },
  });

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const response = await getCompanySuggestions(searchTerm);
        setCompanies(response.data || []);
      } catch (err) {
        console.error(err);
      }
    };

    if (searchTerm) {
      fetchCompanies();
    } else {
      setCompanies([]);
    }
  }, [searchTerm]);

  useEffect(() => {
    const fetchData = async () => {
      
      if (!claimId) return;
    setIsAnalyzing(true);

      const res = await getReferrer(Number(claimId));

      formik.setValues({
        ...formik.initialValues,
        ...res.data,
        company_name: res.data?.company_name || "",
        address: res.data?.address || "",
        postcode: res.data?.postcode || "",
        contact_name: res.data?.contact_name || "",
        contact_number: res.data?.contact_number || "",
        contact_email: res.data?.contact_email || "",
        solicitor: res.data?.solicitor || "",
        third_party_capture: res.data?.third_party_capture || "Not Allowed",

        driver_commission: {
          ...formik.initialValues.driver_commission,
          ...res.data?.driver_commission,
          on_hire_amount: formatMoney(
            res.data?.driver_commission?.on_hire_amount,
          ),
          off_hire_amount: formatMoney(
            res.data?.driver_commission?.off_hire_amount,
          ),
          congestion_charges: formatMoney(
            res.data?.driver_commission?.congestion_charges,
          ),
          other_charges: formatMoney(
            res.data?.driver_commission?.other_charges,
          ),
        },

        referrer_commission: {
          ...formik.initialValues.referrer_commission,
          ...res.data?.referrer_commission,
          on_hire_amount: formatMoney(
            res.data?.referrer_commission?.on_hire_amount,
          ),
          off_hire_amount: formatMoney(
            res.data?.referrer_commission?.off_hire_amount,
          ),
        },
      });

      setSearchTerm(res.data?.company_name || "");
    setIsAnalyzing(false);

    };

    if (claimId && referrerId) {
      fetchData();
    }
  }, [claimId, referrerId]);

  useEffect(() => {
    if (formRef) {
      formRef.current = formik;
    }
  }, [formRef, formik]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        onHireRef.current &&
        !onHireRef.current.contains(event.target as Node)
      ) {
        setShowOnHirePicker(false);
      }

      if (
        offHireRef.current &&
        !offHireRef.current.contains(event.target as Node)
      ) {
        setShowOffHirePicker(false);
      }

      if (
        onHireRef2.current &&
        !onHireRef2.current.contains(event.target as Node)
      ) {
        setShowOnHirePicker2(false);
      }

      if (
        offHireRef2.current &&
        !offHireRef2.current.contains(event.target as Node)
      ) {
        setShowOffHirePicker2(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMobileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "");
    value = value.slice(0, 10);

    if (value.length > 4) {
      value = value.slice(0, 4) + " " + value.slice(4);
    }

    formik.setFieldValue("contact_number", value);
  };

  const handleCompanySelect = (selected: any) => {
    setSearchTerm(selected.company_name || "");
    setShowDropdown(false);

    formik.setFieldValue("company_name", selected.company_name || "");
    formik.setFieldValue("address", selected.address || "");
    formik.setFieldValue("postcode", selected.postcode || "");
    formik.setFieldValue("referrer_id", selected.id || undefined);
  };

  return (
    <div className="MainContent w-full flex flex-col items-start gap-6 py-1 font-['Stack_Sans_Headline']">
      <h1 className="text-neutral-900 text-[24px] font-weight-600">
        Referrer Details
      </h1>
{isAnalyzing && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-transparent p-6 rounded-xl flex flex-col items-center gap-4 ">
            {/* Spinner */}
            <img
              src={type2}
              className="w-16 h-16 animate-spin"
              style={{ animationDuration: "2s" }}
            />
            {/* <div className="text-white text-sm font-weight-400">
              Analyzing images...
            </div> */}
          </div>
        </div>
      )}
      <div className="self-stretch p-5 rounded-lg border border-neutral-100 flex flex-col gap-4">
        <h2 className="text-neutral-900 text-[20px] font-weight-600 leading-5">
          Referrer & Reporting Details
        </h2>

        <div className="h-px bg-gray-100 w-full" />

        <div className="flex flex-col gap-2 relative">
          <label className="text-neutral-700 text-[14px] font-weight-500">
            Company Name
          </label>

          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              const value = e.target.value;
              setSearchTerm(value);
              formik.setFieldValue("company_name", value);
              setShowDropdown(true);
            }}
            onFocus={() => setShowDropdown(true)}
            placeholder="Enter Name"
            className={`w-full h-[52px] px-5 bg-white rounded text-neutral-700 border border-gray-200 ${inputStyles}`}
          />

          {showDropdown && searchTerm && (
            <div className="absolute top-[80px] left-0 w-full bg-white border border-gray-200 rounded-md shadow-lg z-50 max-h-60 overflow-y-auto">
              {companies.length > 0 ? (
                companies.map((r, i) => (
                  <div
                    key={i}
                    onClick={() => handleCompanySelect(r)}
                    className="px-5 py-3 hover:bg-gray-50 cursor-pointer text-sm text-gray-700 border-b border-gray-50 last:border-none"
                  >
                    {r.company_name}
                  </div>
                ))
              ) : (
                <div className="px-5 py-3 text-sm text-gray-400">
                  No company found
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-neutral-700 text-[14px] font-weight-500">
            Company Address
          </label>

          <LeafletAutocompleteMap
            showMap={false}
            apiKey={import.meta.env.VITE_GOOGLE_MAP_KEY}
            address={formik.values.address || ""}
            onPlaceSelected={(place) => {
              if (place?.name || place?.address) {
                formik.setFieldValue("address", place.address || "");
                formik.setFieldValue("postcode", place?.postalCode || "");
              }
            }}
            disabled={false}
          />
        </div>

        <div className="flex gap-5">
          <div className="flex-1 flex flex-col gap-2">
            <label className="text-neutral-700 text-[14px] font-weight-500">
              Contact Name
            </label>

            <input
              name="contact_name"
              value={formik.values.contact_name || ""}
              onChange={(e) =>
                formik.setFieldValue("contact_name", e.target.value)
              }
              placeholder="Enter Name"
              className={`w-full h-[52px] px-5 bg-white rounded border border-gray-200 text-neutral-700 ${inputStyles}`}
            />
          </div>
        </div>

        <div className="flex gap-5">
          <div className="flex-1 flex flex-col gap-2">
            <label className="text-neutral-700 text-[14px] font-weight-500">
              Post Code
            </label>

            <input
              name="postcode"
              value={formik.values.postcode || ""}
              onChange={(e) => formik.setFieldValue("postcode", e.target.value)}
              placeholder="Enter Postcode"
              className={`w-full h-[52px] px-5 bg-white rounded border border-gray-200 text-neutral-700 ${inputStyles}`}
            />
          </div>

          <div className="flex-1 flex flex-col gap-2">
            <label className="text-neutral-700 text-[14px] font-weight-500">
              Email Address
            </label>

            <input
              name="contact_email"
              type="email"
              value={formik.values.contact_email || ""}
              onChange={(e) =>
                formik.setFieldValue("contact_email", e.target.value)
              }
              placeholder="Enter Email"
              className={`w-full h-[52px] px-5 bg-white rounded border border-gray-200 text-neutral-700 ${inputStyles}`}
            />
          </div>
        </div>

        <div className="flex gap-5">
          <div className="flex-1 flex flex-col gap-2">
            <label className="text-neutral-700 text-[14px] font-weight-500">
              Mobile Number
            </label>

            <div className="relative h-[52px] px-5 bg-white rounded border border-gray-200 flex items-center gap-2.5 focus-within:border-blue-500 transition-all">
              <span className="text-gray-400 text-base">+44</span>

              <input
                name="contact_number"
                type="tel"
                onChange={handleMobileChange}
                maxLength={11}
                value={formik.values.contact_number || ""}
                className="w-full bg-transparent outline-none text-neutral-900 mb-0.5 font-light placeholder:text-gray-300"
              />
            </div>
          </div>

          <div className="flex-1 flex flex-col gap-2" />
        </div>
      </div>

      <div className="self-stretch p-5 rounded-lg border border-gray-100 flex flex-col gap-4">
        <h2 className="text-neutral-900 text-[20px] font-weight-600 leading-5">
          Driver Commission Payments
        </h2>

        <div className="h-px bg-gray-100 w-full" />

        <div className="flex flex-col gap-6 w-full">
          <div className="grid grid-cols-12 gap-5 w-full">
            <div className="col-span-6 flex flex-col gap-2">
              <label className="text-neutral-700 text-[14px] font-weight-500">
                On Hire Payment
              </label>

              <div className="h-[52px] px-5 bg-white rounded border border-gray-200 flex items-center gap-2.5 focus-within:border-blue-500 transition-all">
                <span className="text-gray-400 text-base font-light">£</span>

                <input
                  type="text"
                  value={formik.values.driver_commission?.on_hire_amount || ""}
                  onChange={(e) =>
                    formik.setFieldValue(
                      "driver_commission.on_hire_amount",
                      e.target.value,
                    )
                  }
                  onBlur={(e) =>
                    formatMoneyOnBlur(
                      "driver_commission.on_hire_amount",
                      e.target.value,
                    )
                  }
                  className="w-full bg-transparent outline-none text-gray-900 font-light"
                />
              </div>
            </div>

            <div
              className="col-span-6 flex flex-col gap-2 relative"
              ref={onHireRef}
            >
              <label className="text-neutral-700 text-[14px] font-weight-500">
                Paid On
              </label>

              <div
                onClick={() => setShowOnHirePicker(!showOnHirePicker)}
                className={`w-full h-[52px] px-5 bg-white rounded border flex items-center justify-between cursor-pointer transition-all ${
                  showOnHirePicker
                    ? "border-blue-500 ring-1 ring-blue-500"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <span
                  className={`${
                    formik.values.driver_commission?.on_hire_paid_on
                      ? "text-gray-900"
                      : "text-gray-400"
                  } font-light`}
                >
                  {formik.values.driver_commission?.on_hire_paid_on || "Date"}
                </span>

                <img src={Vector6} alt="calendar" />
              </div>

              {showOnHirePicker && (
                <div className="absolute bottom-[53px] left-0 z-[100]">
                  <CustomDatePicker
                    selectedDate={
                      formik.values.driver_commission?.on_hire_paid_on
                        ? new Date(
                            formik.values.driver_commission.on_hire_paid_on,
                          )
                        : new Date()
                    }
                    onDateSelect={(date) => {
                      formik.setFieldValue(
                        "driver_commission.on_hire_paid_on",
                        date.toLocaleDateString("sv-SE"),
                      );
                      setShowOnHirePicker(false);
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-12 gap-5 w-full">
            <div className="col-span-6 flex flex-col gap-2">
              <label className="text-neutral-700 text-[14px] font-weight-500">
                Off Hire Payment
              </label>

              <div className="h-[52px] px-5 bg-white rounded border border-gray-200 flex items-center gap-2.5 focus-within:border-blue-500 transition-all">
                <span className="text-gray-400 text-base font-light">£</span>

                <input
                  type="text"
                  value={formik.values.driver_commission?.off_hire_amount || ""}
                  onChange={(e) =>
                    formik.setFieldValue(
                      "driver_commission.off_hire_amount",
                      e.target.value,
                    )
                  }
                  onBlur={(e) =>
                    formatMoneyOnBlur(
                      "driver_commission.off_hire_amount",
                      e.target.value,
                    )
                  }
                  className="w-full bg-transparent outline-none text-gray-900 font-light"
                />
              </div>
            </div>

            <div
              className="col-span-6 flex flex-col gap-2 relative"
              ref={offHireRef}
            >
              <label className="text-neutral-700 text-[14px] font-weight-500">
                Paid On
              </label>

              <div
                onClick={() => setShowOffHirePicker(!showOffHirePicker)}
                className={`w-full h-[52px] px-5 bg-white rounded border flex items-center justify-between cursor-pointer transition-all ${
                  showOffHirePicker
                    ? "border-blue-500 ring-1 ring-blue-500"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <span
                  className={`${
                    formik.values.driver_commission?.off_hire_paid_on
                      ? "text-gray-900"
                      : "text-gray-400"
                  } font-light`}
                >
                  {formik.values.driver_commission?.off_hire_paid_on || "Date"}
                </span>

                <img src={Vector6} alt="calendar" />
              </div>

              {showOffHirePicker && (
                <div className="absolute bottom-[53px] left-0 z-[100]">
                  <CustomDatePicker
                    selectedDate={
                      formik.values.driver_commission?.off_hire_paid_on
                        ? new Date(
                            formik.values.driver_commission.off_hire_paid_on,
                          )
                        : new Date()
                    }
                    onDateSelect={(date) => {
                      formik.setFieldValue(
                        "driver_commission.off_hire_paid_on",
                        date.toLocaleDateString("sv-SE"),
                      );
                      setShowOffHirePicker(false);
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-12 gap-5 w-full">
            <div className="col-span-6 flex flex-col gap-2">
              <label className="text-neutral-700 text-[14px] font-weight-500">
                Congestion Charges
              </label>

              <div className="h-[52px] px-5 bg-white rounded border border-gray-200 flex items-center gap-2.5 focus-within:border-blue-500 transition-all">
                <span className="text-gray-400 text-base font-light">£</span>

                <input
                  type="text"
                  value={
                    formik.values.driver_commission?.congestion_charges || ""
                  }
                  onChange={(e) =>
                    formik.setFieldValue(
                      "driver_commission.congestion_charges",
                      e.target.value,
                    )
                  }
                  onBlur={(e) =>
                    formatMoneyOnBlur(
                      "driver_commission.congestion_charges",
                      e.target.value,
                    )
                  }
                  className="w-full bg-transparent outline-none text-gray-900 font-light"
                />
              </div>
            </div>

            <div className="col-span-6 flex flex-col gap-2">
              <label className="text-neutral-700 text-[14px] font-weight-500">
                Other Charges
              </label>

              <div className="h-[52px] px-5 bg-white rounded border border-gray-200 flex items-center gap-2.5 focus-within:border-blue-500 transition-all">
                <span className="text-gray-400 text-base font-light">£</span>

                <input
                  type="text"
                  value={formik.values.driver_commission?.other_charges || ""}
                  onChange={(e) =>
                    formik.setFieldValue(
                      "driver_commission.other_charges",
                      e.target.value,
                    )
                  }
                  onBlur={(e) =>
                    formatMoneyOnBlur(
                      "driver_commission.other_charges",
                      e.target.value,
                    )
                  }
                  className="w-full bg-transparent outline-none text-gray-900 font-light"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="self-stretch p-5 rounded-lg border border-gray-100 flex flex-col gap-4">
        <h2 className="text-neutral-900 text-[20px] font-weight-600 leading-5">
          Referrer Commission Payment
        </h2>

        <div className="h-px bg-gray-100 w-full" />

        <div className="flex flex-col gap-6 w-full">
          <div className="grid grid-cols-12 gap-5 w-full">
            <div className="col-span-6 flex flex-col gap-2">
              <label className="text-neutral-700 text-[14px] font-weight-500">
                On Hire Payment
              </label>

              <div className="h-[52px] px-5 bg-white rounded border border-gray-200 flex items-center gap-2.5 focus-within:border-blue-500 transition-all">
                <span className="text-gray-400 text-base font-light">£</span>

                <input
                  type="text"
                  value={
                    formik.values.referrer_commission?.on_hire_amount || ""
                  }
                  onChange={(e) =>
                    formik.setFieldValue(
                      "referrer_commission.on_hire_amount",
                      e.target.value,
                    )
                  }
                  onBlur={(e) =>
                    formatMoneyOnBlur(
                      "referrer_commission.on_hire_amount",
                      e.target.value,
                    )
                  }
                  className="w-full bg-transparent outline-none text-gray-900 font-light"
                />
              </div>
            </div>

            <div
              className="col-span-6 flex flex-col gap-2 relative"
              ref={onHireRef2}
            >
              <label className="text-neutral-700 text-[14px] font-weight-500">
                Paid On
              </label>

              <div
                onClick={() => setShowOnHirePicker2(!showOnHirePicker2)}
                className={`w-full h-[52px] px-5 bg-white rounded border flex items-center justify-between cursor-pointer transition-all ${
                  showOnHirePicker2
                    ? "border-blue-500 ring-1 ring-blue-500"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <span
                  className={`${
                    formik.values.referrer_commission?.on_hire_paid_on
                      ? "text-gray-900"
                      : "text-gray-400"
                  } font-light`}
                >
                  {formik.values.referrer_commission?.on_hire_paid_on || "Date"}
                </span>

                <img src={Vector6} alt="calendar" />
              </div>

              {showOnHirePicker2 && (
                <div className="absolute bottom-[53px] left-0 z-[100]">
                  <CustomDatePicker
                    selectedDate={
                      formik.values.referrer_commission?.on_hire_paid_on
                        ? new Date(
                            formik.values.referrer_commission.on_hire_paid_on,
                          )
                        : new Date()
                    }
                    onDateSelect={(date) => {
                      formik.setFieldValue(
                        "referrer_commission.on_hire_paid_on",
                        date.toLocaleDateString("sv-SE"),
                      );
                      setShowOnHirePicker2(false);
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-12 gap-5 w-full">
            <div className="col-span-6 flex flex-col gap-2">
              <label className="text-neutral-700 text-[14px] font-weight-500">
                Off Hire Payment
              </label>

              <div className="h-[52px] px-5 bg-white rounded border border-gray-200 flex items-center gap-2.5 focus-within:border-blue-500 transition-all">
                <span className="text-gray-400 text-base font-light">£</span>

                <input
                  type="text"
                  value={
                    formik.values.referrer_commission?.off_hire_amount || ""
                  }
                  onChange={(e) =>
                    formik.setFieldValue(
                      "referrer_commission.off_hire_amount",
                      e.target.value,
                    )
                  }
                  onBlur={(e) =>
                    formatMoneyOnBlur(
                      "referrer_commission.off_hire_amount",
                      e.target.value,
                    )
                  }
                  className="w-full bg-transparent outline-none text-gray-900 font-light"
                />
              </div>
            </div>

            <div
              className="col-span-6 flex flex-col gap-2 relative"
              ref={offHireRef2}
            >
              <label className="text-neutral-700 text-[14px] font-weight-500">
                Paid On
              </label>

              <div
                onClick={() => setShowOffHirePicker2(!showOffHirePicker2)}
                className={`w-full h-[52px] px-5 bg-white rounded border flex items-center justify-between cursor-pointer transition-all ${
                  showOffHirePicker2
                    ? "border-blue-500 ring-1 ring-blue-500"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <span
                  className={`${
                    formik.values.referrer_commission?.off_hire_paid_on
                      ? "text-gray-900"
                      : "text-gray-400"
                  } font-light`}
                >
                  {formik.values.referrer_commission?.off_hire_paid_on ||
                    "Date"}
                </span>

                <img src={Vector6} alt="calendar" />
              </div>

              {showOffHirePicker2 && (
                <div className="absolute bottom-[53px] left-0 z-[100]">
                  <CustomDatePicker
                    selectedDate={
                      formik.values.referrer_commission?.off_hire_paid_on
                        ? new Date(
                            formik.values.referrer_commission.off_hire_paid_on,
                          )
                        : new Date()
                    }
                    onDateSelect={(date) => {
                      formik.setFieldValue(
                        "referrer_commission.off_hire_paid_on",
                        date.toLocaleDateString("sv-SE"),
                      );
                      setShowOffHirePicker2(false);
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="self-stretch p-5 rounded-lg border border-gray-100 flex flex-col gap-4">
        <h2 className="text-neutral-900 text-[20px] font-weight-600 leading-5">
          Referrers Nominated Solicitor (PI must go to)
        </h2>

        <div className="h-px bg-gray-100 w-full" />

        <div className="grid grid-cols-12 gap-5 w-full items-start">
          <div className="col-span-6 flex flex-col gap-2">
            <label className="text-neutral-700 text-[14px] font-weight-500 h-[20px] flex items-center">
              Solicitor
            </label>

            <input
              type="text"
              name="solicitor"
              placeholder="Enter Solicitor Name"
              value={formik.values.solicitor || ""}
              onChange={(e) =>
                formik.setFieldValue("solicitor", e.target.value)
              }
              className={`w-full h-[52px] px-5 bg-white rounded border border-gray-200 outline-none text-neutral-700 font-light ${inputStyles}`}
            />
          </div>

          <div className="col-span-6 flex flex-col gap-2">
            <span className="text-neutral-700 text-[14px] font-weight-500 h-[20px] flex items-center">
              Third Party Capture
            </span>

            <div className="h-[52px] flex items-center gap-8">
              {["Allowed", "Not Allowed"].map((option) => (
                <label
                  key={option}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <div className="relative flex items-center justify-center">
                    <input
                      type="radio"
                      name="third_party_capture"
                      className="peer appearance-none transition-all"
                      checked={formik.values.third_party_capture === option}
                      onChange={() =>
                        formik.setFieldValue("third_party_capture", option)
                      }
                    />

                    {formik.values.third_party_capture === option ? (
                      <img src={Yes} alt="yes" />
                    ) : (
                      <img src={No} alt="no" />
                    )}
                  </div>

                  <span className="text-sm text-gray-700">{option}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
