import { useReportCompletion, isAllFilled } from "../Components/ClaimCompletion";
import { useEffect, useRef, useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import Select from "react-select";
import { toast } from "react-toastify";
import Vector6 from "../../../assets/AutoClaim_icon/Vector-6.svg";
import Yes from "../../../assets/AutoClaim_icon/Yes.svg";
import No from "../../../assets/AutoClaim_icon/No.svg";
import TopRightIcon from "../../../assets/AutoClaim_icon/Vulnerable.svg";
import { ABIInsurerModal } from "./ABIInsurerModal";
import { CustomDatePicker } from "../Components/DatePicker";
import { PostcodeLookup } from "../../../claims/common/PostcodeLookup";
import { AddressAutocomplete } from "../../../claims/common/AddressAutocomplete";
import {
  getHandlers,
  getLiabilityStances,
  getMidReasons,
  getSettlementStatus,
} from "../../../services/Lookups/Generaldetails";
import {
  createThirdPartyInsurer,
  getThirdPartyInsurer,
  updateThirdPartyInsurer,
} from "../../../services/ThirdPartyInsurer/ThirdPartyInsurer";
import { BlueDropdownIndicator, customStyles, scrollSelectIntoView } from "./GeneralDetailsForm";
import { getCompanySuggestions } from "../../../services/Referrer/Referrer";
import { getLocalTimeZone } from "@internationalized/date";

// notification stamp dates are not in the backend model — persisted locally per claim
const NOTIF_KEY = (id: string) => `tpi_notif_${id}`;

const ThirdPartyInsurer = ({ formRef, claimId: claimIdProp }: any) => {
  const claimId = claimIdProp || "";

  const [loading, setLoading] = useState(true);
  const [tpiExists, setTpiExists] = useState(false);
  const [showABIModal, setShowABIModal] = useState(false);
  const [lookups, setLookups] = useState<any>({ handlers: [], reasons: [], stances: [], statuses: [] });
  const [showPickers, setShowPickers] = useState<any>({});
  const [companies, setCompanies] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  // The Incorrect MID Search Log is hidden until the user opts in — but it auto-
  // reveals (once) if the claim already has saved MID data, so nothing is hidden.
  const [showMidLog, setShowMidLog] = useState(false);
  const midAutoShown = useRef(false);
  const [notifDates, setNotifDates] = useState(() => {
    const saved = localStorage.getItem(NOTIF_KEY(claimId));
    return saved ? JSON.parse(saved) : { abi_1st_notif_date: "", payment_pack_date: "" };
  });
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const response = await getCompanySuggestions(searchTerm);
        setCompanies(response.data);
      } catch (err) {
        console.error(err);
      }
    };
    if (searchTerm) fetchCompanies();
  }, [searchTerm]);

  // --- HELPERS ---
  const formatDate = (val: any): string | null => {
    if (!val) return null;
    if (typeof val === "string") return val.split("T")[0];
    const date = "toDate" in val ? val.toDate(getLocalTimeZone()) : new Date(val);
    if (isNaN(date.getTime())) return null;
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  const mapBackendToForm = (data: any) => ({
    direct_email: data.direct_email || "",
    insurer_reference: data.insurer_reference || "",
    policy_number: data.policy_number || "",
    claim_validation: data.claim_validation || false,
    handling_reference: data.handling_reference || "",
    incorrect_mid_reference: data.incorrect_mid_reference || "",
    incorrect_acc: formatDate(data.incorrect_acc) || "",
    initial_eng_made: formatDate(data.initial_eng_made) || "",
    new_mid: formatDate(data.new_mid) || "",
    new_mid_search_ref: data.new_mid_search_ref || "",
    incorrect_reg: data.incorrect_reg || "",
    new_mid_search_processed: data.new_mid_search_processed || false,
    abi_insured: data.abi_insured ? "Yes" : "No",
    liability_accepted_on: data.liability_accepted_on || "",
    reason_new_mid_id: data.reason_new_mid_id || null,
    liability_stance_id: data.liability_stance_id || null,
    settlement_status_id: data.settlement_status_id || null,
    handler_id: data.handler_id || null,
    third_party: {
      gender: data.third_party?.gender || "mr",
      first_name: data.third_party?.first_name || "",
      surname: data.third_party?.surname || "",
      address: {
        address: data.third_party?.address?.address || "",
        postcode: data.third_party?.address?.postcode || "",
        mobile_tel: data.third_party?.address?.mobile_tel || "",
        email: data.third_party?.address?.email || "",
      },
    },
    third_party_insurer: {
      gender: data.third_party_insurer?.gender || "mr",
      first_name: data.third_party_insurer?.first_name || "",
      surname: data.third_party_insurer?.surname || "",
      address: {
        address: data.third_party_insurer?.address?.address || "",
        postcode: data.third_party_insurer?.address?.postcode || "",
        mobile_tel: data.third_party_insurer?.address?.mobile_tel || "",
        email: data.third_party_insurer?.address?.email || "",
      },
    },
    third_party_handling: {
      gender: data.third_party_handling?.gender || "mr",
      first_name: data.third_party_handling?.first_name || "",
      surname: data.third_party_handling?.surname || "",
      address: {
        address: data.third_party_handling?.address?.address || "",
        postcode: data.third_party_handling?.address?.postcode || "",
        mobile_tel: data.third_party_handling?.address?.mobile_tel || "",
        email: data.third_party_handling?.address?.email || "",
      },
    },
  });

  const formik = useFormik({
    initialValues: {
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
      abi_insured: "No",
      liability_accepted_on: "",
      reason_new_mid_id: null as number | null,
      liability_stance_id: null as number | null,
      settlement_status_id: null as number | null,
      handler_id: null as number | null,
      third_party: {
        gender: "mr",
        first_name: "",
        surname: "",
        address: { address: "", postcode: "", mobile_tel: "", email: "" },
      },
      third_party_insurer: {
        gender: "mr",
        first_name: "",
        surname: "",
        address: { address: "", postcode: "", mobile_tel: "", email: "" },
      },
      third_party_handling: {
        gender: "mr",
        first_name: "",
        surname: "",
        address: { address: "", postcode: "", mobile_tel: "", email: "" },
      },
    },
    validationSchema: Yup.object({
      direct_email: Yup.string().email("Invalid email format").nullable(),
      policy_number: Yup.string().when("third_party_insurer", {
        is: (tpi: any) => tpi?.first_name?.trim().length > 0,
        then: (s) => s.required("Policy No. is required when Insurer Name is provided"),
      }),
      third_party: Yup.object({
        address: Yup.object({
          email: Yup.string().email("Invalid email format").nullable(),
        }),
      }),
      third_party_insurer: Yup.object({
        address: Yup.object({
          email: Yup.string().email("Invalid email format").nullable(),
        }),
      }),
      third_party_handling: Yup.object({
        address: Yup.object({
          email: Yup.string().email("Invalid email format").nullable(),
        }),
      }),
    }),
    onSubmit: async (values) => {
      try {
        const selectedStance = lookups.stances.find((s: any) => s.id === values.liability_stance_id);
        const stanceLabel = (selectedStance?.label || "").toLowerCase();
        if ((stanceLabel.includes("accept") || stanceLabel === "fault") && !values.liability_accepted_on) {
          toast.error("Liability Accepted On is required for Accepted or Fault stance");
          return;
        }

        const payload = {
          ...values,
          claim_id: parseInt(claimId),
          abi_insured: values.abi_insured === "Yes",
          incorrect_acc: formatDate(values.incorrect_acc),
          initial_eng_made: formatDate(values.initial_eng_made),
          new_mid: formatDate(values.new_mid),
          liability_accepted_on: values.liability_accepted_on || null,
        };

        if (tpiExists) {
          await updateThirdPartyInsurer(payload, parseInt(claimId));
        } else {
          await createThirdPartyInsurer(payload);
          setTpiExists(true);
        }

        toast.success("Third Party Insurer details saved");
      } catch (error) {
        console.error("Error saving TPI:", error);
        toast.error("Failed to save Third Party Insurer details");
      }
    },
  });

  // --- HELPERS ---
  const getNestedValue = (path: string) =>
    path.split(".").reduce((obj: any, key) => (obj && obj[key] !== undefined ? obj[key] : ""), formik.values);

  const getNestedError = (path: string): string | undefined =>
    path.split(".").reduce((obj: any, key) => (obj && obj[key] !== undefined ? obj[key] : undefined), formik.errors) as string | undefined;

  const formatDisplayDate = (dateValue: any) => {
    if (!dateValue) return "Not set";
    const date = new Date(dateValue);
    if (isNaN(date.getTime())) return "Not set";
    return `${date.toLocaleDateString("sv-SE")} ${date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true }).toLowerCase()}`;
  };

  // --- ACTIONS ---
  const handleSendNotification = () => {
    const updated = { ...notifDates, abi_1st_notif_date: new Date().toISOString() };
    setNotifDates(updated);
    localStorage.setItem(NOTIF_KEY(claimId), JSON.stringify(updated));
    toast.success("ABI 1st Notification generated.");
  };

  const handleSendPaymentPack = () => {
    const updated = { ...notifDates, payment_pack_date: new Date().toISOString() };
    setNotifDates(updated);
    localStorage.setItem(NOTIF_KEY(claimId), JSON.stringify(updated));
    toast.success("Payment Pack sent.");
  };

  const handleCompanySelect = (selected: any) => {
    setSearchTerm(selected.company_name);
    setShowDropdown(false);
    formik.setFieldValue("third_party_insurer.first_name", selected.company_name);
    formik.setFieldValue("third_party_insurer.address.address", selected.address || "");
    formik.setFieldValue("third_party_insurer.address.postcode", selected.postcode || "");
  };

  // --- EFFECTS ---
  useEffect(() => {
    const init = async () => {
      try {
        const [h, r, st, su] = await Promise.all([
          getHandlers(),
          getMidReasons(),
          getLiabilityStances(),
          getSettlementStatus(),
        ]);
        setLookups({ handlers: h.data, reasons: r.data, stances: st.data, statuses: su.data });

        if (claimId) {
          try {
            const res = await getThirdPartyInsurer(parseInt(claimId));
            setTpiExists(true);
            formik.setValues(mapBackendToForm(res.data));
            if (res.data?.third_party_insurer?.first_name) {
              setSearchTerm(res.data.third_party_insurer.first_name);
            }
          } catch (err: any) {
            if (err?.response?.status !== 404) console.error(err);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  useEffect(() => {
    if (formRef) formRef.current = formik;
  }, [formik]);

  // Auto-reveal the Incorrect MID Search Log (once) if saved MID data loaded,
  // so opting-out never hides existing data.
  useEffect(() => {
    if (midAutoShown.current) return;
    const v = formik.values;
    if (
      v.incorrect_mid_reference ||
      v.new_mid_search_ref ||
      v.incorrect_reg ||
      v.new_mid ||
      v.incorrect_acc ||
      v.initial_eng_made
    ) {
      setShowMidLog(true);
      midAutoShown.current = true;
    }
  }, [formik.values]);

  useReportCompletion(isAllFilled(formik.values));

  // --- RENDERERS ---
  const renderInput = (label: string, field: string, placeholder: string) => (
    <div className="flex flex-col gap-2 w-full">
      <label className="text-neutral-700 text-sm font-light">{label}</label>
      <input
        type="text"
        value={getNestedValue(field)}
        onChange={(e) => formik.setFieldValue(field, e.target.value)}
        placeholder={placeholder}
        className="px-5 py-4 h-[52px] bg-white rounded border border-neutral-200 text-base font-light outline-none focus:border-blue-500 transition-colors"
      />
      {getNestedError(field) && (
        <span className="text-red-500 text-xs">{getNestedError(field)}</span>
      )}
    </div>
  );

  const renderDatePicker = (label: string, field: string) => {
    const pickerRef = useRef<HTMLDivElement>(null);
    const value = getNestedValue(field);

    useEffect(() => {
      const clickOut = (e: MouseEvent) => {
        if (showPickers[field] && pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
          setShowPickers((prev: any) => ({ ...prev, [field]: false }));
        }
      };
      document.addEventListener("mousedown", clickOut);
      return () => document.removeEventListener("mousedown", clickOut);
    }, [showPickers[field]]);

    return (
      <div ref={pickerRef} className="flex flex-col gap-2 relative w-full">
        <label className="text-neutral-700 text-sm font-light">{label}</label>
        <div
          onClick={() => setShowPickers({ ...showPickers, [field]: !showPickers[field] })}
          className="px-5 py-4 bg-white h-[52px] rounded border border-neutral-200 flex justify-between items-center cursor-pointer hover:border-neutral-400 transition-colors"
        >
          <span className={value ? "text-black" : "text-neutral-300"}>{value || "Date"}</span>
          <img src={Vector6} alt="calendar" className="w-4 h-4" />
        </div>
        {showPickers[field] && (
          <div className="absolute top-[85px] left-0 z-[100] shadow-xl bg-white rounded">
            <CustomDatePicker
              selectedDate={value ? new Date(value) : new Date()}
              onDateSelect={(date: Date) => {
                formik.setFieldValue(field, date.toLocaleDateString("sv-SE"));
                setShowPickers({ ...showPickers, [field]: false });
              }}
            />
          </div>
        )}
      </div>
    );
  };

  const selectedStanceLabel = (lookups.stances.find((s: any) => s.id === formik.values.liability_stance_id)?.label || "").toLowerCase();
  const liabilityAcceptedRequired = selectedStanceLabel.includes("accept") || selectedStanceLabel === "fault";

  return (
    <div className="relative MainContent w-full flex flex-col items-start gap-6 py-1  font-['Stack_Sans_Headline']">
      {loading && (
        <div className="fixed inset-0 z-[9999] bg-[#e8e6df]/80 flex items-center justify-center font-['Stack_Sans_Headline']">
          <div className="relative w-[73px] h-[73px]">
            {Array.from({ length: 12 }).map((_, index) => (
              <span
                key={index}
                className="absolute left-1/2 top-1/2 w-[6px] h-[16px] rounded-full bg-[#9b9b9b] animate-loaderFade"
                style={{
                  transform: `translate(-50%, -50%) rotate(${index * 30}deg) translateY(-25px)`,
                  animationDelay: `${index * 0.08}s`,
                }}
              />
            ))}
          </div>
        </div>
      )}

      <ABIInsurerModal isOpen={showABIModal} onClose={() => setShowABIModal(false)} />

      <h1 className="text-neutral-900 text-[24px] font-weight-600">Third Party Insurer</h1>

      {/* 1. Third Party Details */}
      <div className="self-stretch p-5 rounded-lg border border-neutral-100 flex flex-col gap-4">
        <h2 className="text-neutral-900 text-[20px] font-weight-600">Third Party Details</h2>
        <div className="h-px bg-neutral-100" />
        <div className="flex flex-col gap-2 w-full">
          <label className="text-neutral-700 text-sm font-light">Title</label>
          <Select
            options={[{ value: "mr", label: "Mr" }, { value: "mrs", label: "Mrs" }].sort((a, b) => String(a.label).localeCompare(String(b.label)))}
            styles={customStyles} menuPlacement="bottom" onMenuOpen={scrollSelectIntoView}
            value={[{ value: "mr", label: "Mr" }, { value: "mrs", label: "Mrs" }].find((o) => o.value === formik.values.third_party.gender)}
            onChange={(o: any) => formik.setFieldValue("third_party.gender", o.value)}
            components={{ DropdownIndicator: BlueDropdownIndicator, IndicatorSeparator: () => null }}
          />
        </div>
        <div className="grid grid-cols-2 gap-5">
          {renderInput("Forename", "third_party.first_name", "Enter Forename")}
          {renderInput("Surname", "third_party.surname", "Enter Surname")}
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-neutral-700 text-sm font-light">Address</label>
          <AddressAutocomplete
            address={formik.values.third_party.address.address || ""}
            onChange={(v) => formik.setFieldValue("third_party.address.address", v)}
            onPlaceSelected={(place) => {
              formik.setFieldValue("third_party.address.address", place.address);
              formik.setFieldValue("third_party.address.postcode", place.postcode);
            }}
            inputClassName="px-5 h-[52px] bg-white rounded border border-neutral-200 text-base font-light outline-none focus:border-blue-500 transition-colors w-full"
          />
        </div>
        <div className="grid grid-cols-2 gap-5">
          <div className="flex flex-col gap-2 w-full">
            <label className="text-neutral-700 text-sm font-light">Postcode</label>
            <PostcodeLookup
              postcode={getNestedValue("third_party.address.postcode")}
              onChange={(v) => formik.setFieldValue("third_party.address.postcode", v)}
              onAddressSelect={(addr) => {
                formik.setFieldValue("third_party.address.postcode", addr.postcode);
                formik.setFieldValue("third_party.address.address", [addr.line1, addr.line2, addr.line3].filter(Boolean).join(", "));
              }}
              inputClassName="px-5 h-[52px] bg-white rounded border border-neutral-200 text-base font-light outline-none focus:border-blue-500 transition-colors w-full"
            />
          </div>
          {renderInput("Email Address", "third_party.address.email", "Email")}
        </div>
        <div className="grid grid-cols-2 gap-5">
          {renderInput("Main Tel.", "third_party.address.mobile_tel", "+44")}
          {renderInput("Contact", "third_party.address.mobile_tel", "Contact")}
        </div>
      </div>

      {/* 2. Third Party Insurer Details */}
      <div className="self-stretch p-5 rounded-lg border border-neutral-100 flex flex-col gap-4">
        <h2 className="text-neutral-900 text-[20px] font-weight-600">Third Party Insurer Details</h2>
        <div className="h-px bg-neutral-100" />
        {/* Company Name with autocomplete */}
        <div className="flex flex-col gap-2 relative">
          <label className="text-neutral-700 text-sm font-light">Name</label>
          <input
            type="text"
            value={searchTerm || formik.values.third_party_insurer.first_name}
            onChange={(e) => { setSearchTerm(e.target.value); setShowDropdown(true); }}
            placeholder="Enter Company Name"
            className="w-full h-[52px] px-5 bg-white rounded border border-neutral-200 text-base font-light outline-none focus:border-blue-500 transition-colors"
          />
          {showDropdown && searchTerm && companies.length > 0 && (
            <div className="absolute top-[82px] left-0 w-full bg-white border rounded shadow-lg z-50 max-h-40 overflow-auto">
              {companies.map((c, i) => (
                <div key={i} onClick={() => handleCompanySelect(c)} className="px-4 py-3 hover:bg-gray-50 cursor-pointer text-sm">
                  {c.company_name}
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-neutral-700 text-sm font-light">Address</label>
          <AddressAutocomplete
            address={formik.values.third_party_insurer.address.address || ""}
            onChange={(v) => formik.setFieldValue("third_party_insurer.address.address", v)}
            onPlaceSelected={(place) => {
              formik.setFieldValue("third_party_insurer.address.address", place.address);
              formik.setFieldValue("third_party_insurer.address.postcode", place.postcode);
            }}
            inputClassName="px-5 h-[52px] bg-white rounded border border-neutral-200 text-base font-light outline-none focus:border-blue-500 transition-colors w-full"
          />
        </div>
        <div className="grid grid-cols-2 gap-5">
          <div className="flex flex-col gap-2 w-full">
            <label className="text-neutral-700 text-sm font-light">Postcode</label>
            <PostcodeLookup
              postcode={getNestedValue("third_party_insurer.address.postcode")}
              onChange={(v) => formik.setFieldValue("third_party_insurer.address.postcode", v)}
              onAddressSelect={(addr) => {
                formik.setFieldValue("third_party_insurer.address.postcode", addr.postcode);
                formik.setFieldValue("third_party_insurer.address.address", [addr.line1, addr.line2, addr.line3].filter(Boolean).join(", "));
              }}
              inputClassName="px-5 h-[52px] bg-white rounded border border-neutral-200 text-base font-light outline-none focus:border-blue-500 transition-colors w-full"
            />
          </div>
          {renderInput("Main Tel.", "third_party_insurer.address.mobile_tel", "+44")}
        </div>
        <div className="grid grid-cols-2 gap-5">
          {renderInput("General Email", "third_party_insurer.address.email", "General Email")}
          {renderInput("Direct Email", "direct_email", "Direct Email")}
        </div>
        <div className="grid grid-cols-2 gap-5">
          {renderInput("Reference", "insurer_reference", "Enter Reference")}
          {renderInput("Policy No.", "policy_number", "Enter Policy No.")}
        </div>
        <div
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => formik.setFieldValue("claim_validation", !formik.values.claim_validation)}
        >
          <div className={`w-5 h-5 rounded ${formik.values.claim_validation ? "bg-blue-600 border-[6px] border-blue-200" : "bg-neutral-300"}`} />
          <span className="text-sm">Client’s Claim in Validation</span>
        </div>
        <div>
          <button
            type="button"
            onClick={() => setShowABIModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-primary rounded text-sm hover:bg-blue-200 transition-colors"
          >
            <img src={TopRightIcon} alt="" className="w-4 h-4" />
            Check if ABI Insurer
          </button>
        </div>
      </div>

      {/* 3. Third Party Handling Agent */}
      <div className="self-stretch p-5 rounded-lg border border-neutral-100 flex flex-col gap-4">
        <h2 className="text-neutral-900 text-[20px] font-weight-600">Third Party Handling Agent</h2>
        <div className="h-px bg-neutral-100" />
        {renderInput("Name", "third_party_handling.first_name", "Enter Name")}
        <div className="flex flex-col gap-2">
          <label className="text-neutral-700 text-sm font-light">Address</label>
          <AddressAutocomplete
            address={formik.values.third_party_handling.address.address || ""}
            onChange={(v) => formik.setFieldValue("third_party_handling.address.address", v)}
            onPlaceSelected={(place) => {
              formik.setFieldValue("third_party_handling.address.address", place.address);
              formik.setFieldValue("third_party_handling.address.postcode", place.postcode);
            }}
            inputClassName="px-5 h-[52px] bg-white rounded border border-neutral-200 text-base font-light outline-none focus:border-blue-500 transition-colors w-full"
          />
        </div>
        <div className="grid grid-cols-2 gap-5">
          <div className="flex flex-col gap-2 w-full">
            <label className="text-neutral-700 text-sm font-light">Postcode</label>
            <PostcodeLookup
              postcode={getNestedValue("third_party_handling.address.postcode")}
              onChange={(v) => formik.setFieldValue("third_party_handling.address.postcode", v)}
              onAddressSelect={(addr) => {
                formik.setFieldValue("third_party_handling.address.postcode", addr.postcode);
                formik.setFieldValue("third_party_handling.address.address", [addr.line1, addr.line2, addr.line3].filter(Boolean).join(", "));
              }}
              inputClassName="px-5 h-[52px] bg-white rounded border border-neutral-200 text-base font-light outline-none focus:border-blue-500 transition-colors w-full"
            />
          </div>
          {renderInput("Tel. Main", "third_party_handling.address.mobile_tel", "+44")}
        </div>
        <div className="grid grid-cols-2 gap-5">
          {renderInput("Email Address", "third_party_handling.address.email", "Email")}
          {renderInput("Reference", "handling_reference", "Reference")}
        </div>
      </div>

      {/* 4. Incorrect MID Search Log — hidden until opted in via the checkbox */}
      <div
        className="flex items-center gap-2 cursor-pointer"
        onClick={() => setShowMidLog((v) => !v)}
      >
        <div className={`w-5 h-5 rounded ${showMidLog ? "bg-blue-600 border-[6px] border-blue-200" : "bg-neutral-300"}`} />
        <span className="text-sm">Show Incorrect MID Search Log</span>
      </div>

      {showMidLog && (
      <div className="self-stretch p-5 bg-indigo-50 rounded-lg border border-indigo-100 flex flex-col gap-4">
        <h2 className="text-neutral-900 text-[20px] font-weight-600">Incorrect MID Search Log</h2>
        <div className="h-px bg-indigo-200 opacity-40" />
        <div className="grid grid-cols-2 gap-5">
          {renderInput("Incorrect MID Ref", "incorrect_mid_reference", "Enter 15-digit Ref")}
          <div className="flex flex-col gap-2">
            <label className="text-neutral-700 text-sm font-light">Conducting The New MID?</label>
            <Select
              options={lookups.handlers.map((h: any) => ({ value: h.id, label: h.label }))}
              styles={customStyles} menuPlacement="bottom" onMenuOpen={scrollSelectIntoView}
              placeholder="Select Handler"
              value={lookups.handlers.find((o: any) => o.id === formik.values.handler_id)
                ? { value: formik.values.handler_id, label: lookups.handlers.find((o: any) => o.id === formik.values.handler_id)?.label }
                : null}
              onChange={(o: any) => formik.setFieldValue("handler_id", o.value)}
              components={{ DropdownIndicator: BlueDropdownIndicator, IndicatorSeparator: () => null }}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-5">
          {renderDatePicker("Incorrect Acc", "incorrect_acc")}
          {renderDatePicker("Initial Eng Made", "initial_eng_made")}
        </div>
        <div className="grid grid-cols-2 gap-5">
          {renderDatePicker("New MID Conducted", "new_mid")}
          {renderInput("New MID Search Ref", "new_mid_search_ref", "Enter Ref")}
        </div>
        <div className="grid grid-cols-2 gap-5">
          <div className="flex flex-col gap-2">
            <label className="text-neutral-700 text-sm font-light">Reason for New MID</label>
            <Select
              options={lookups.reasons.map((r: any) => ({ value: r.id, label: r.label }))}
              styles={customStyles} menuPlacement="bottom" onMenuOpen={scrollSelectIntoView}
              placeholder="Select Reason"
              value={lookups.reasons.find((o: any) => o.id === formik.values.reason_new_mid_id)
                ? { value: formik.values.reason_new_mid_id, label: lookups.reasons.find((o: any) => o.id === formik.values.reason_new_mid_id)?.label }
                : null}
              onChange={(o: any) => formik.setFieldValue("reason_new_mid_id", o.value)}
              components={{ DropdownIndicator: BlueDropdownIndicator, IndicatorSeparator: () => null }}
            />
          </div>
          {renderInput("Incorrect Reg", "incorrect_reg", "Enter Reg")}
        </div>
        <div
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => formik.setFieldValue("new_mid_search_processed", !formik.values.new_mid_search_processed)}
        >
          <div className={`w-5 h-5 rounded ${formik.values.new_mid_search_processed ? "bg-blue-600 border-[6px] border-blue-200" : "bg-neutral-300"}`} />
          <span className="text-sm">New MID Search Processed?</span>
        </div>
      </div>
      )}

      {/* 5. Notifications Section */}
      <div className="self-stretch p-5 rounded-lg border border-neutral-100 flex flex-col gap-4">
        <h2 className="text-neutral-900 text-[20px] font-weight-600">Notifications Section</h2>
        <div className="h-px bg-neutral-100" />
        <div className="flex justify-between items-start bg-gray-50 p-4 rounded-lg">
          <div className="flex flex-col gap-2">
            <span className="text-sm text-neutral-700">Send ABI 1st Notification</span>
            <button type="button" onClick={handleSendNotification}
              className="px-4 py-2 bg-blue-100 text-primary rounded text-sm hover:bg-blue-200 transition-all w-fit">
              Send Notification
            </button>
          </div>
          <div className="w-64 flex flex-col gap-1">
            <span className="text-sm text-neutral-700">ABI 1st Notification Sent On</span>
            <p className="text-sm text-neutral-500 font-light">{formatDisplayDate(notifDates.abi_1st_notif_date)}</p>
          </div>
        </div>
        <div className="flex justify-between items-start bg-gray-50 p-4 rounded-lg">
          <div className="flex flex-col gap-2">
            <span className="text-sm text-neutral-700">Send Payment Pack</span>
            <button type="button" onClick={handleSendPaymentPack}
              className="px-4 py-2 bg-blue-100 text-primary rounded text-sm hover:bg-blue-200 transition-all w-fit">
              Send Pack
            </button>
          </div>
          <div className="w-64 flex flex-col gap-1">
            <span className="text-sm text-neutral-700">Payment Pack Sent On</span>
            <p className="text-sm text-neutral-500 font-light">{formatDisplayDate(notifDates.payment_pack_date)}</p>
          </div>
        </div>
      </div>

      {/* 6. Liability Section */}
      <div className="self-stretch p-5 rounded-lg border border-neutral-100 flex flex-col gap-4">
        <h2 className="text-neutral-900 text-[20px] font-weight-600">Liability Section</h2>
        <div className="h-px bg-neutral-100" />
        <div className="flex flex-col gap-3">
          <label className="text-sm font-light">ABI Insurer?</label>
          <div className="flex gap-6">
            {["Yes", "No"].map((opt) => (
              <label key={opt} className="flex items-center gap-2 cursor-pointer">
                <input type="radio" className="hidden" checked={formik.values.abi_insured === opt}
                  onChange={() => formik.setFieldValue("abi_insured", opt)} />
                <img src={formik.values.abi_insured === opt ? Yes : No} className="w-5 h-5" alt="" />
                <span className="text-sm">{opt}</span>
              </label>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-5">
          <div className="flex flex-col gap-2">
            <label className="text-neutral-700 text-sm font-light">Current Liability Stance</label>
            <Select
              options={lookups.stances.map((s: any) => ({ value: s.id, label: s.label }))}
              styles={customStyles} menuPlacement="bottom" onMenuOpen={scrollSelectIntoView}
              placeholder="Select Stance"
              value={lookups.stances.find((o: any) => o.id === formik.values.liability_stance_id)
                ? { value: formik.values.liability_stance_id, label: lookups.stances.find((o: any) => o.id === formik.values.liability_stance_id)?.label }
                : null}
              onChange={(o: any) => formik.setFieldValue("liability_stance_id", o.value)}
              components={{ DropdownIndicator: BlueDropdownIndicator, IndicatorSeparator: () => null }}
            />
          </div>
          <div className="flex flex-col gap-2 w-full">
            <label className="text-neutral-700 text-sm font-light">
              Liability Accepted On{liabilityAcceptedRequired && <span className="text-red-500 ml-1">*</span>}
            </label>
            {renderDatePicker("", "liability_accepted_on")}
          </div>
        </div>
      </div>

      {/* 7. Settlement Status */}
      <div className="self-stretch p-5 rounded-lg border border-neutral-100 flex flex-col gap-4 mb-10">
        <h2 className="text-neutral-900 text-[20px] font-weight-600">Settlement Status</h2>
        <div className="h-px bg-neutral-100" />
        <div className="flex flex-col gap-2 w-full">
          <label className="text-neutral-700 text-sm font-light">Settlement Status</label>
          <Select
            options={lookups.statuses.map((s: any) => ({ value: s.id, label: s.label }))}
            styles={customStyles} menuPlacement="bottom" onMenuOpen={scrollSelectIntoView}
            menuPlacement="top"
            placeholder="Select Settlement Status"
            value={lookups.statuses.find((o: any) => o.id === formik.values.settlement_status_id)
              ? { value: formik.values.settlement_status_id, label: lookups.statuses.find((o: any) => o.id === formik.values.settlement_status_id)?.label }
              : null}
            onChange={(o: any) => formik.setFieldValue("settlement_status_id", o.value)}
            components={{ DropdownIndicator: BlueDropdownIndicator, IndicatorSeparator: () => null }}
          />
        </div>
      </div>
    </div>
  );
};

export default ThirdPartyInsurer;