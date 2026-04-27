import { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import * as Yup from "yup";
import { useFormik, FormikProvider } from "formik";
import Select from "react-select";
import { Clock, FileText, Mail, MoreVertical } from "lucide-react";
import { today, getLocalTimeZone } from "@internationalized/date";

// Assets & Icons
import Vector6 from "../../../assets/AutoClaim_icon/Vector-6.svg";
import Yes from "../../../assets/AutoClaim_icon/Yes.svg";
import No from "../../../assets/AutoClaim_icon/No.svg";

// Services
import {
  createHireDetails,
  updateHireDetails,
  getActualVehicleCategory,
  getClientVehicleCategory,
  getAdminFeeType,
  getHireDetails,
  fetchVehicleExtraData,
} from "../../../services/HireDetail/HireDetails";
import {
  createHireProvided,
  downloadCheckSheet,
  downloadFeeExemption,
  downloadHireDocumentationAgreement,
  downloadMitigationQuestionnaire,
  downloadStorageRecovery,
  getHireProvided,
  getHireVehicleStatus,
  sendEmails,
  updateHireProvided,
} from "../../../services/HireVehicleProvided/HireVehicleProvided";
import { BlueDropdownIndicator, customStyles } from "./GeneralDetailsForm";
import { CustomDatePicker } from "../Components/DatePicker";
import { parseCalendarDateTimeStamp } from "../../../common/common";
import { CheckoutModal } from "../Components/CheckoutModal";
import { EmailPreviewModal } from "../Components/EmailPreviewModal";
import { OnHireEmailPreviewModal } from "../Components/OnHireEmailPreviewModal";
import { VehicleProvisionSlider } from "../Components/VehicleProvisionSlider";

function openOutlookCompose(to: string, subject: string, body: string) {
  const formattedTo = to.replace(/,/g, ";").replace(/\s+/g, "");
  const encodedTo = encodeURIComponent(formattedTo);
  const encodedSubject = encodeURIComponent(subject);
  const encodedBody = encodeURIComponent(body);

  const officeUrl = `https://outlook.office.com/mail/deeplink/compose?to=${encodedTo}&subject=${encodedSubject}&body=${encodedBody}`;
  const liveUrl = `https://outlook.live.com/mail/0/deeplink/compose?to=${encodedTo}&subject=${encodedSubject}&body=${encodedBody}`;
  const mailtoUrl = `mailto:${formattedTo}?subject=${encodedSubject}&body=${encodedBody}`;

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

export const HireDetailsForm = ({ formRef }: any) => {
  const claimId = localStorage.getItem("claimId");
  const [isLoading, setIsLoading] = useState(false);
  const [adminFeeType, setAdminFeeType] = useState([]);
  const [actualVehicleCategory, setActualVehicleCategory] = useState([]);
  const [clientVehicleCategory, setClientVehicleCategory] = useState([]);
  const [vehicleStatus, setVehicleStatus] = useState([]);
  const [activeVehicleTab, setActiveVehicleTab] = useState(0);
  const DRAFT_KEY = `hire_details_draft_${claimId}`; // Unique key per claim
const inputStyles = `hover:border-neutral-400 focus:border-blue-500 focus:outline-none font-light transition-colors placeholder:font-['Stack_Sans_Headline']`;

  // Picker States
  const [showHireOutPicker, setShowHireOutPicker] = useState(false);
  const [showHireBackPicker, setShowHireBackPicker] = useState(false);
  const [showProvisionStartPicker, setShowProvisionStartPicker] =
    useState(false);
  const [showProvisionEndPicker, setShowProvisionEndPicker] = useState(false);

  const hireOutRef = useRef<HTMLDivElement>(null);
  const hireBackRef = useRef<HTMLDivElement>(null);
  const provStartRef = useRef<HTMLDivElement>(null);
  const provEndRef = useRef<HTMLDivElement>(null);

  //ui states
  const [showActionPopup, setShowActionPopup] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [modalStep, setModalStep] = useState(1);
  const [switchVehicle, setSwitchVehicle] = useState(false);
  const [showSwapBanner, setShowSwapBanner] = useState(false);
  const [showDocsPopup, setShowDocsPopup] = useState<{
    [key: number]: boolean;
  }>({});
  const [showEmailPopup, setShowEmailPopup] = useState<{
    [key: number]: boolean;
  }>({});
  const toggleEmailPopup = (index: number) => {
    setShowDocsPopup({}); // Close docs
    setShowActionPopup(false); // Close action
    setShowEmailPopup((prev) => ({
      [index]: !prev[index], // Only keep current index
    }));
  };

  const toggleDocsPopup = (index: number) => {
    setShowEmailPopup({}); // Close emails
    setShowActionPopup(false); // Close action
    setShowDocsPopup((prev) => ({
      [index]: !prev[index], // Only keep current index
    }));
  };

  const [formData, setFormData] = useState({
    interiorCleanCheckOut: "",
    interiorCleanCheckIn: "",
    interiorDamage: false,
    interiorDamageDescription: "",
    interiorPhotos: [] as File[],
    exteriorCleanCheckOut: "",
    exteriorCleanCheckIn: "",
    exteriorDamage: false,
    exteriorDamageDescription: "",
    exteriorPhotos: [] as File[],
    petrolCheckoutCharge: "",
    petrolChargeAmount: "0",
    petrolChargeReason: "",
    applyDamageCharges: "",
    damageCharges: "0",
    damageChargesPaidNow: 0,
    damageNotes: "",
    valetCharge: 30, // Default £30 as per user story [cite: 124, 131]
  });
 const [checkoutData, setCheckoutData] = useState<{ forms: any[] }>({
   forms: [],
 });
  // Unified Formik
  const formik = useFormik({
    initialValues: {
      thirdPartyVehicles: [
        {
          client_vehicle_category: "",
          actual_vehicle_category: "",
          abi_hire_charge_per_day: 0,
          extra_charge_per_day: 5,
          administration_fee: 37,
          bhr_hire_charge_per_day: 0,
          bhr_extra_charge_per_day: 5,
          bhr_administration_fee: 60,
          cdw_per_day: 15,
          collection_and_delivery_fee: 60,
          no_of_days_hired: 0,
          total_no_of_days_hired: 0,
          total_abi_hire_charge: 0,
          total_bhr_charge: 0,
          abi_insured: false,
          admin_fee_type: "",
          hireOutDate: today(getLocalTimeZone()).toString(),
          hireBackDate: null,
          cross_hired: false,
          hire_vehicle_status_id: null,
          hire_vehicle_registration: "",
          make: "",
          model: "",
          provider_name: "", // File Ref
          fuel_type: "",
          plate_transfer: false,
          
  actionsCompleted: {
    onHire: false,
    offHire: false,
    switchStarted: false,
    switchCompleted: false,
  }
        },
      ],
    },
    onSubmit: async (values) => {
      try {
        const hireId = localStorage.getItem("hireId");
        const hireProvidedId = localStorage.getItem("hireProvidedId");

        const chargesPayload = {
          hire_details: values.thirdPartyVehicles.map((v) => ({
            ...v,
            claim_id: claimId,
            hire_out: v.hireOutDate,
            hire_back: v.hireBackDate,
          })),
        };

        const provisionPayload = {
          claim_id: claimId,
          section_a: { ...formData }, // Unified modal data
          section_b: values.thirdPartyVehicles.map((v) => ({
            ...v,
            cross_hire: v.cross_hired ? 1 : 0,
            plate_transfer: v.plate_transfer ? 1 : 0,
            hire_start_date: v.hireOutDate,
            hire_end_date: v.hireBackDate,
            rate: v.abi_hire_charge_per_day,
          })),
        };

        // await Promise.all([
        //   claimId && hireId
        //     ? updateHireDetails(chargesPayload, claimId)
        //     : createHireDetails(chargesPayload),
        //   claimId && hireProvidedId
        //     ? updateHireProvided(claimId, provisionPayload, false)
        //     : createHireProvided(claimId, provisionPayload, false),
        // ]);

        toast.success("All hire details saved successfully");
      } catch (error) {
        toast.error("Error saving hire information");
        throw error;
      }
    },
  });
  useEffect(() => {
    const fetchLookups = async () => {
      const [clientRes, actualRes, adminRes, statusRes] = await Promise.all([
        getClientVehicleCategory(),
        getActualVehicleCategory(),
        getAdminFeeType(),
        getHireVehicleStatus(),
      ]);
      setClientVehicleCategory(
        clientRes.data.map((i: any) => ({ value: i.id, label: i.label })),
      );
      setActualVehicleCategory(
        actualRes.data.map((i: any) => ({
          value: i.id,
          label: i.label,
          abi_rate: i.abi_rate,
          bhr_rate: i.bhr_rate,
          valet_rate: i.valet_rate,
        })),
      );
      setAdminFeeType(
        adminRes.data.map((i: any) => ({ value: i.id, label: i.label })),
      );
      setVehicleStatus(
        statusRes.data.map((i: any) => ({ value: i.id, label: i.label })),
      );
    };
    fetchLookups();
  }, []);
  // Unified Data Loader
  useEffect(() => {
    if (!claimId) return;
    const loadData = async () => {
      const savedDraft = localStorage.getItem(DRAFT_KEY);

      if (savedDraft) {
        const parsed = JSON.parse(savedDraft);
        formik.setValues(parsed.formikValues);
        console.log(parsed.formikValues);
        setShowSwapBanner(true)
        setCheckoutData(parsed.checkoutFormData);
        // If we have a draft, we can skip the API call or merge them.
        // Usually, draft takes priority for "it just works" feel.
        setIsLoading(false);
        return;
      }
      
      // setIsLoading(true);
      // try {
      //   const provRes = await getHireProvided(claimId);
      //   const detRes = await getHireDetails(claimId);
      //   // getHireVehicleStatus(),
      //   // getClientVehicleCategory(),
      //   // getActualVehicleCategory(),
      //   // getAdminFeeType()
      //   // setVehicleStatus(statusRes.data.map((i: any) => ({ value: i.id, label: i.label })));
      //   // setClientVehicleCategory(clientRes.data.map((i: any) => ({ value: i.id, label: i.label })));
      //   // setActualVehicleCategory(actualRes.data.map((i: any) => ({ value: i.id, label: i.label, abi_rate: i.abi_rate, bhr_rate: i.bhr_rate })));
      //   // setAdminFeeType(adminRes.data.map((i: any) => ({ value: i.id, label: i.label })));

      //   const hireProvided = Array.isArray(provRes?.data) ? provRes.data : [];
      //   const hireDetails = Array.isArray(detRes?.data?.hire_details)
      //     ? detRes.data.hire_details
      //     : [];

      //   const merged = hireProvided.map((prov: any, idx: number) => {
      //     const det = hireDetails[idx] || {};
      //     return {
      //       ...prov,
      //       ...det,
      //       cross_hired: !!prov.cross_hire,
      //       hireOutDate:
      //         prov.hire_start_date ||
      //         det.hire_out ||
      //         today(getLocalTimeZone()).toString(),
      //       hireBackDate: prov.hire_end_date || det.hire_back || null,
      //     };
      //   });

      //   if (merged.length > 0) formik.setValues({ thirdPartyVehicles: merged });
      // } finally {
      //   setIsLoading(false);
      // }
    };
    loadData();
  }, [claimId]);
  useEffect(() => {
    if (claimId && formik.dirty) {
      const draftData = {
        formikValues: formik.values,
        checkoutFormData: checkoutData,
      };
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draftData));
    }
  }, [formik.values, checkoutData, claimId]);
  // Live Calculations (So Far vs Final Days)
  console.log(checkoutData)
  useEffect(() => {
    const vehicle = formik.values.thirdPartyVehicles[activeVehicleTab];
    if (!vehicle || !vehicle.hireOutDate) return;

    const start = new Date(vehicle.hireOutDate);
    const todayDate = new Date();
    const daysSoFar = Math.max(
      0,
      Math.ceil(
        (todayDate.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
      ),
    );

    let finalDays = 0;
    if (vehicle.hireBackDate) {
      finalDays = Math.max(
        0,
        Math.ceil(
          (new Date(vehicle.hireBackDate).getTime() - start.getTime()) /
            (1000 * 60 * 60 * 24),
        ) + 1,
      );
    }

    const abiTotal =
      (Number(vehicle.abi_hire_charge_per_day) +
        Number(vehicle.extra_charge_per_day)) *
        finalDays +
      Number(vehicle.administration_fee);
    const bhrTotal =
      (Number(vehicle.bhr_hire_charge_per_day) +
        Number(vehicle.bhr_extra_charge_per_day)) *
        finalDays +
      Number(vehicle.bhr_administration_fee) +
      15 * finalDays +
      Number(vehicle.collection_and_delivery_fee);

    formik.setFieldValue(
      `thirdPartyVehicles[${activeVehicleTab}].no_of_days_hired`,
      daysSoFar,
    );
    formik.setFieldValue(
      `thirdPartyVehicles[${activeVehicleTab}].total_no_of_days_hired`,
      finalDays,
    );
    formik.setFieldValue(
      `thirdPartyVehicles[${activeVehicleTab}].total_abi_hire_charge`,
      abiTotal.toFixed(2),
    );
    formik.setFieldValue(
      `thirdPartyVehicles[${activeVehicleTab}].total_bhr_charge`,
      bhrTotal.toFixed(2),
    );
  }, [
    formik.values.thirdPartyVehicles[activeVehicleTab]?.hireOutDate,
    formik.values.thirdPartyVehicles[activeVehicleTab]?.hireBackDate,
    formik.values.thirdPartyVehicles[activeVehicleTab]?.abi_hire_charge_per_day,
    formik.values.thirdPartyVehicles[activeVehicleTab]?.bhr_hire_charge_per_day,
    formik.values.thirdPartyVehicles[activeVehicleTab]?.extra_charge_per_day,
  ]);

  useEffect(() => {
    if (formRef) formRef.current = formik;
  }, [formik]);
  const handleDownload = async (docType: string) => {
    const currentClaimId = claimId;
    if (!currentClaimId) return;

    try {
      toast.info("Preparing your document...");
      let response;

      switch (docType) {
        case "Hire_Vehicle_Check_Sheet":
          // This triggers the XLS/PDF generation on the backend
          response = await downloadCheckSheet(currentClaimId);
          break;
        case "Mitigation_Questionnaire":
          response = await downloadMitigationQuestionnaire(currentClaimId);
          break;
        case "Hire_Documentation":
          // Map to your specific fleet instruction download service
          response = await downloadHireDocumentationAgreement(currentClaimId);
          break;
        case "Recovery_Storage":
          response = await downloadStorageRecovery(currentClaimId);
          break;
        case "Fee_Exemption_Form":
          response = await downloadFeeExemption(currentClaimId);
          break;
        default:
          toast.error("Document type not recognized.");
          return;
      }

      // Standard logic to trigger browser download for Blob files (PDF/XLS)
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;

      // Set filename based on type
      if (docType === "Fee_Exemption_Form") {
        const blob = new Blob([response.data], {
          type: "application/pdf",
        });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `${docType}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
        toast.success(`${docType} downloaded successfully`);
      } else {
        const blob = new Blob([response.data], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `${docType}.xlsx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
        toast.success(`${docType} downloaded successfully`);
      }
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Failed to download document.");
    }
  };
  const [emailData, setEmailData] = useState<any>();
  const [onHireEmailData, setOnHireEmailData] = useState<any>();

  const currentVehicle = formik.values.thirdPartyVehicles[activeVehicleTab];
  // Action Handlers
  // Action Handlers for Swap Logic

  const handleQuestionnaireSend = async (
    // email: string,
    sendReminders: boolean,
    option: any,
  ) => {
    // const firstName = values.company_name || "Client";
    try {
      console.log(option);
      if (option === "Inst Fleet to On Hire") {
        const { data } = await sendEmails(claimId, "on_hire");
        console.log(
          actualVehicleCategory.find(
            (opt) => opt.value === currentVehicle.actual_vehicle_category,
          )?.label,
        );
        const templateData = {
          ...data,
          activeUserEmail: JSON.parse(localStorage.getItem("activeUser")).email,
          mobile_tel: `+44 ${data.mobile_tel}`,
          vehicleCategory: actualVehicleCategory.find(
            (opt) => opt.value === currentVehicle.actual_vehicle_category,
          )?.label,
        };
        setOnHireEmailData(templateData);
        console.log("working");
        setOnHirePreviewModalOpen(true);

        // const subject = "New Instruction to Fleet to On Hire Vehicle (CIL)";
        // const body =
        //   `Brand: RTA - Nationwide Assist\n` +
        //   `Reference: ${data.Reference || "N/A"}\n` +
        //   `Referrer: ${data.Referrer || "N/A"}\n` +
        //   `Client: ${data.client_name || "N/A"}\n` +
        //   `Client's Vehicle Mobile No.: ${data.mobile_tel || "N/A"}\n` +
        //   `Does Hirer Require Vehicle Documents: Yes\n\n` +
        //   `Client's Vehicle Details:\n` +
        //   `Reg: ${data.registration || "N/A"}\n` +
        //   `Make/Model: ${data.make || "N/A"} - ${data.model}\n` +
        //   `Body Type: ${data.body_type || "N/A"}\n` +
        //   `Auto: ${data.auto || "N/A"}\n` +
        //   `Engine Size: ${data.engine_size || "N/A"}\n` +
        //   `Fuel Type: ${data.fuel_type || "N/A"}\n` +
        //   `No of Seats inc Driver: ${data.no_of_seats || "N/A"}\n\n` +
        //   `If Taxi Vehicle:\n` +
        //   `Borough: ${data.borough_name || "N/A"}\n` +
        //   `Type of Plate: ${data.plate_type || "N/A"}\n` +
        //   `Driver Base: ${data.driver_base || "N/A"}\n\n` +
        //   `Hi,\n\nPlease contact the Client to arrange a hire vehicle.\n\n` +
        //   `Hire needs to start on ${new Date().toLocaleDateString(
        //     "en-GB",
        //   )}\n\n` +
        //   `We need to provide hire vehicle category XXXX.\n\n` +
        //   `Regards,\nClaim Handler`;

        // openOutlookCompose(data.to, subject, body);
        // toast.success("On Hire email opened in Outlook");
      } else if (option === "Inst Fleet to Off Hire") {
        const { data } = await sendEmails(claimId, "off_hire");
        const templateData = {
          ...data,
          registration: currentVehicle.hire_vehicle_registration,
          activeUserEmail: JSON.parse(localStorage.getItem("activeUser")).email,
          mobile_tel: `+44 ${data.mobile_tel}`,
        };
        setEmailData(templateData);
        setPreviewModalOpen(true);

        // const subject = "New Instruction to Fleet to Off Hire Vehicle (CIL)";

        // Formatting the body to mimic the structure of your HTML design
        // const body =
        //   `--------------------------------------------------\n` +
        //   `REFERENCE:      ${data.Reference || "N/A"}\n` +
        //   `REFERRER:       ${data.Referrer || "N/A"}\n` +
        //   `CLIENT:         ${data.client_name || "N/A"}\n` +
        //   `HIRE VEHICLE:   ${data.registration || "N/A"}\n` +
        //   `CL MOBILE NO:   ${data.mobile_tel || "N/A"}\n` +
        //   `--------------------------------------------------\n\n` +
        //   `Hi,\n\n` +
        //   `Please contact the Client to arrange the off hire of this vehicle for ${new Date().toLocaleDateString("en-GB")}.\n\n` +
        //   `Kind regards,\n` +
        //   `Nationwide Assist IT / Systems Team`;

        // openOutlookCompose(data.to, subject, body);
        // toast.success("Off Hire email prepared in Outlook");
      }
    } catch {}
  };
  const [previewModal, setPreviewModalOpen] = useState<boolean>(false);
  const [onHirePreviewModal, setOnHirePreviewModalOpen] =
    useState<boolean>(false);
  console.log(onHirePreviewModal);
  const testDeepLink = () => {
    setPreviewModalOpen(true);
  };
  const handleAction = (type: string) => {
    const todayStr = new Date().toISOString().split("T")[0];
    const currentVehicles = formik.values.thirdPartyVehicles;
    const activeVehicle = currentVehicles[activeVehicleTab];

    if (type === "onHire") {
      formik.setFieldValue(
        `thirdPartyVehicles[${activeVehicleTab}].hireOutDate`,
        todayStr,
      );
      formik.setFieldValue(
        `thirdPartyVehicles[${activeVehicleTab}].hire_vehicle_status_id`,
        1)

  formik.setFieldValue(
    `thirdPartyVehicles[${activeVehicleTab}].actionsCompleted.onHire`,
    true
  );
      setShowActionPopup(false);
    } else if (type === "switchOff") {
      // 3rd Option: Start Switch (Off-Hire Old)
      setShowCheckoutModal(true);
      setModalStep(1);
      setSwitchVehicle(true); // Flag to indicate we are in a swap process
       formik.setFieldValue(
         `thirdPartyVehicles[${activeVehicleTab}].actionsCompleted.switchStarted`,
         true,
       );
      // We don't close the ActionPopup yet so they can see the next step after modal
    } else if (type === "onHireNew") {
      // 4th Option: Create New Record
      if (currentVehicles.length >= 3) {
        toast.error("Maximum limit of 3 records reached.");
        return;
      }

      // Safety check: Don't allow a new hire if the current one isn't off-hired
      // if (
      //   !activeVehicle.hireBackDate &&
      //   currentVehicles.length === activeVehicleTab + 1
      // ) {
      //   toast.error(
      //     "Please off-hire the current vehicle before switching to a new one.",
      //   );
      //   return;
      // }
  formik.setFieldValue(
    `thirdPartyVehicles[${activeVehicleTab}].actionsCompleted.switchCompleted`,
    true,
  );
      const newRecord = {
        ...formik.initialValues.thirdPartyVehicles[0],
        hireOutDate: todayStr,
        hire_vehicle_status_id: 1, // New record starts as On Hire
        administration_fee: 0, // Subsequent records have 0 admin fee
        collection_and_delivery_fee: 0, // Subsequent records have 0 collection fee
  actionsCompleted: {
    onHire: true, // new one starts ON
    offHire: false,
    switchStarted: false,
    switchCompleted: false,
  },
      };

      formik.setFieldValue("thirdPartyVehicles", [
        ...currentVehicles,
        newRecord,
      ]);
      setActiveVehicleTab(currentVehicles.length); // Move to the new record tab
      setShowSwapBanner(true);
      setShowActionPopup(false);
    } else if (type === "offHire") {
      // 5th Option: Simple Off Hire
      setShowCheckoutModal(true);
      setModalStep(1);
      setSwitchVehicle(false);
      formik.setFieldValue(
        `thirdPartyVehicles[${activeVehicleTab}].actionsCompleted.offHire`,
        true,
      );
    }
  };
  console.log(currentVehicle.actual_vehicle_category);
  // 2. Tab System for multiple records (Vehicle Swap Handling) [cite: 207, 210]
  const renderVehicleTabs = () => (
    <div className="flex gap-4 border-b border-slate-100 mb-4">
      {formik.values.thirdPartyVehicles.map((v, idx) => (
        <button
          key={idx}
          type="button"
          onClick={() => setActiveVehicleTab(idx)}
          className={`px-4 py-2 text-sm font-weight-400 transition-colors ${
            activeVehicleTab === idx
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-slate-400 hover:text-slate-600"
          }`}
        >
          Hire Record {idx + 1} - {v.hire_vehicle_registration || "TBC"}
        </button>
      ))}
    </div>
  );
  const actionPopupRef = useRef<HTMLDivElement>(null);
  const docsPopupRef = useRef<HTMLDivElement>(null);
  const emailPopupRef = useRef<HTMLDivElement>(null);

  // Close all popups when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        actionPopupRef.current &&
        !actionPopupRef.current.contains(event.target as Node) &&
        docsPopupRef.current &&
        !docsPopupRef.current.contains(event.target as Node) &&
        emailPopupRef.current &&
        !emailPopupRef.current.contains(event.target as Node)
      ) {
        setShowActionPopup(false);
        setShowDocsPopup({});
        setShowEmailPopup({});
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  // Seamless Toggles: Close others when opening one

  const toggleActionPopup = () => {
    setShowEmailPopup({});
    setShowDocsPopup({});
    setShowActionPopup(!showActionPopup);
  };
  const [isLogOpen, setIsLogOpen] = useState(false);

  const mockLogs = [
    {
      registration: "AB23 CDE",
      make: "Toyota",
      model: "Camry",
      start: "02-14-2026",
      end: "02-18-2026",
    },
    {
      registration: "CD34 EFG",
      make: "Honda",
      model: "Accord",
      start: "03-05-2026",
      end: "03-10-2026",
    },
    {
      registration: "EF45 HIJ",
      make: "Ford",
      model: "Fusion",
      start: "04-20-2026",
      end: "04-25-2026",
    },
  ];

  return (
    <>
      <FormikProvider value={formik}>
        <div className="MainContent w-full flex flex-col items-start gap-6 py-1 font-['Stack_Sans_Headline']">
          {previewModal && (
            <EmailPreviewModal
              isOpen={previewModal}
              onClose={() => setPreviewModalOpen(false)}
              data={emailData}
            />
          )}

          <VehicleProvisionSlider
            isOpen={isLogOpen}
            onClose={() => setIsLogOpen(false)}
            logs={[]}
          />
          {onHirePreviewModal && (
            <OnHireEmailPreviewModal
              isOpen={onHirePreviewModal}
              onClose={() => setOnHirePreviewModalOpen(false)}
              data={onHireEmailData}
            />
          )}
          <div className="flex items-center justify-between w-full">
            <h1 className="text-neutral-900 text-[24px] font-weight-600">
              Hire Details
            </h1>

            <button
              className="h-8 px-3 py-2 bg-blue-50 rounded flex items-center gap-2 text-blue-600 whitespace-nowrap"
              onClick={() => setIsLogOpen(true)}
            >
              <Clock size={16} />
              <span className="text-sm">Provision Log</span>
            </button>
          </div>
          {/* Vehicle Tabs - Visible only when swap occurs [cite: 209] */}
          {/* Vehicle Banners - Side by Side Swap View */}
          {showSwapBanner && formik.values.thirdPartyVehicles.length > 1 ? (
            <div className="flex gap-6 w-full">
              {formik.values.thirdPartyVehicles.map((v, i) => (
                <div
                  key={i}
                  onClick={() => setActiveVehicleTab(i)}
                  className={`flex-1 p-5 rounded-lg border cursor-pointer flex flex-col items-center gap-4 ${activeVehicleTab === i ? "bg-blue-100 border-blue-200" : "bg-white border-blue-200"}`}
                >
                  <div className="text-center">
                    <div className="text-neutral-900 text-[20px] font-weight-600 leading-5">
                      Vehicle{i + 1}
                    </div>
                    <div className="text-slate-500 text-sm font-weight-400">
                      {v.hire_vehicle_registration || "Reg#"}
                    </div>
                  </div>
                  <div className="flex gap-4 relative">
                    {/* VIEW DOCS BUTTON & POPUP */}
                    <div
                      className="relative"
                      ref={i === activeVehicleTab ? docsPopupRef : null}
                    >
                      <button
                        className="flex gap-2"
                        onClick={() => {
                          setActiveVehicleTab(i);
                          toggleDocsPopup(i);
                        }}
                      >
                        <FileText size={16} /> View Docs
                      </button>
                      {showDocsPopup[i] && (
                        <div className="absolute left-0 top-10 z-[70] w-64 p-4 bg-white shadow-xl border rounded-lg">
                          {/* Item 1: Inst Fleet to On Hire */}
                          <div
                            className="text-primary text-sm cursor-pointer hover:text-blue-600 w-full p-3"
                            onClick={() =>
                              handleDownload("Hire_Vehicle_Check_Sheet")
                            }
                          >
                            Hire Vehicle Check Sheet
                          </div>
                          <div className="self-stretch h-px bg-slate-100"></div>

                          {/* Item 2: Inst Fleet to Off Hire */}
                          <div
                            className="text-primary text-sm cursor-pointer hover:text-blue-600 w-full p-3"
                            onClick={() => handleDownload("Hire_Documentation")}
                          >
                            Hire Documentation
                          </div>
                          <div className="self-stretch h-px bg-slate-100"></div>

                          {/* Item 3: Check Sheet (Usually an XLS or PDF) */}
                          <div
                            className="text-primary text-sm cursor-pointer hover:text-blue-600 w-full p-3"
                            onClick={() => handleDownload("Fee_Exemption_Form")}
                          >
                            Fee Exemption Form
                          </div>
                          <div className="self-stretch h-px bg-slate-100"></div>

                          {/* Item 4: Mitigation Questionnaire */}
                          <div
                            className="text-primary text-sm cursor-pointer hover:text-blue-600 w-full p-3"
                            onClick={() =>
                              handleDownload("Mitigation_Questionnaire")
                            }
                          >
                            Mitigation Questionnaire
                          </div>
                          <div className="self-stretch h-px bg-slate-100"></div>

                          {/* Item 5: Authority Letter */}
                          <div
                            className="text-primary text-sm cursor-pointer hover:text-blue-600 w-full p-3"
                            onClick={() => handleDownload("Recovery_Storage")}
                          >
                            Recovery & Storage
                          </div>
                        </div>
                      )}
                    </div>
                    {/* SEND EMAIL BUTTON & POPUP */}
                    <div
                      className="relative"
                      ref={i === activeVehicleTab ? emailPopupRef : null}
                    >
                      <button
                        className="flex gap-2"
                        onClick={() => {
                          setActiveVehicleTab(i);
                          toggleEmailPopup(i);
                        }}
                      >
                        <Mail size={16} /> Send Email
                      </button>
                      {showEmailPopup[i] && (
                        <div className="absolute left-0 top-10 z-[70] w-64 p-4 bg-white shadow-xl border rounded-lg">
                          {" "}
                          {/* Item 1: Inst Fleet to On Hire */}
                          <div
                            className="text-primary text-sm cursor-pointer hover:text-blue-600 w-full p-3"
                            onClick={() =>
                              handleQuestionnaireSend(
                                true,
                                "Inst Fleet to Off Hire",
                              )
                            }
                          >
                            Inst Fleet to On Hire
                          </div>
                          <div className="self-stretch h-px bg-slate-100"></div>
                          {/* Item 2: Inst Fleet to Off Hire */}
                          <div
                            className="text-primary text-sm cursor-pointer hover:text-blue-600 w-full p-3"
                            onClick={() =>
                              handleQuestionnaireSend(
                                true,
                                "Inst Fleet to Off Hire",
                              )
                            }
                          >
                            Inst Fleet to Off Hire
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // Single Record View
            <div className="w-full p-5 bg-blue-100 rounded-lg flex justify-between items-center">
              <div>
                <div className="text-neutral-900 text-[20px] font-weight-600 leading-5">
                  Vehicle
                </div>
                <div className="text-slate-500 text-sm font-weight-400">
                  Reg# {currentVehicle.hire_vehicle_registration}
                </div>
              </div>
              <div className="flex gap-4">
                <button
                  className="flex items-center gap-2 text-primary text-sm"
                  onClick={() => toggleDocsPopup(activeVehicleTab)}
                >
                  <FileText size={16} /> View Docs
                </button>
                {/* Docs Popup Design */}
                {showDocsPopup[activeVehicleTab] && (
                  // Inside your Docs Popup mapping area:
                  <div className="absolute right-70 top-[290px] z-[60] w-96 p-6 bg-white rounded-lg shadow-[0px_4px_8px_0px_rgba(0,0,0,0.08)] flex flex-col justify-center items-start gap-3 border border-slate-100">
                    {/* Item 1: Inst Fleet to On Hire */}
                    <div
                      className="text-primary text-sm cursor-pointer hover:text-blue-600 w-full"
                      onClick={() => handleDownload("Hire_Vehicle_Check_Sheet")}
                    >
                      Hire Vehicle Check Sheet
                    </div>
                    <div className="self-stretch h-px bg-slate-100"></div>

                    {/* Item 2: Inst Fleet to Off Hire */}
                    <div
                      className="text-primary text-sm cursor-pointer hover:text-blue-600 w-full"
                      onClick={() => handleDownload("Hire_Documentation")}
                    >
                      Hire Documentation
                    </div>
                    <div className="self-stretch h-px bg-slate-100"></div>

                    {/* Item 3: Check Sheet (Usually an XLS or PDF) */}
                    <div
                      className="text-primary text-sm cursor-pointer hover:text-blue-600 w-full"
                      onClick={() => handleDownload("Fee_Exemption_Form")}
                    >
                      Fee Exemption Form
                    </div>
                    <div className="self-stretch h-px bg-slate-100"></div>

                    {/* Item 4: Mitigation Questionnaire */}
                    <div
                      className="text-primary text-sm cursor-pointer hover:text-blue-600 w-full"
                      onClick={() => handleDownload("Mitigation_Questionnaire")}
                    >
                      Mitigation Questionnaire
                    </div>
                    <div className="self-stretch h-px bg-slate-100"></div>

                    {/* Item 5: Authority Letter */}
                    <div
                      className="text-primary text-sm cursor-pointer hover:text-blue-600 w-full"
                      onClick={() => handleDownload("Recovery_Storage")}
                    >
                      Recovery & Storage
                    </div>
                  </div>
                )}
                <button
                  className="flex items-center gap-2 text-primary text-sm"
                  onClick={() => toggleEmailPopup(activeVehicleTab)}
                >
                  <Mail size={16} />
                  Send Email
                </button>
                {showEmailPopup[activeVehicleTab] && (
                  // Inside your Docs Popup mapping area:
                  <div className="absolute right-20 top-[290px]  z-[60] w-96 p-6 bg-white rounded-lg shadow-[0px_4px_8px_0px_rgba(0,0,0,0.08)] flex flex-col justify-center items-start gap-3 border border-slate-100">
                    {/* Item 1: Inst Fleet to On Hire */}
                    <div
                      className="text-primary text-sm cursor-pointer hover:text-blue-600 w-full"
                      onClick={() =>
                        handleQuestionnaireSend(true, "Inst Fleet to On Hire")
                      }
                    >
                      Inst Fleet to On Hire
                    </div>
                    <div className="self-stretch h-px bg-slate-100"></div>

                    {/* Item 2: Inst Fleet to Off Hire */}
                    <div
                      className="text-primary text-sm cursor-pointer hover:text-blue-600 w-full"
                      onClick={() =>
                        handleQuestionnaireSend(true, "Inst Fleet to Off Hire")
                      }
                    >
                      Inst Fleet to Off Hire
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          {/* Section: Vehicle Category */}
          <SectionWrapper title="Vehicle Category">
            <div className="flex gap-5">
              <Dropdown
                label="Client Vehicle Category"
                options={clientVehicleCategory}
                value={currentVehicle.client_vehicle_category}
                onChange={(opt) =>
                  formik.setFieldValue(
                    `thirdPartyVehicles[${activeVehicleTab}].client_vehicle_category`,
                    opt.value,
                  )
                }
              />
              <Dropdown
                label="Actual Vehicle Category"
                options={actualVehicleCategory}
                value={currentVehicle.actual_vehicle_category}
                onChange={(opt: any) => {
                  formik.setFieldValue(
                    `thirdPartyVehicles[${activeVehicleTab}].actual_vehicle_category`,
                    opt.value,
                  );
                  formik.setFieldValue(
                    `thirdPartyVehicles[${activeVehicleTab}].abi_hire_charge_per_day`,
                    Number(opt.abi_rate),
                  );
                  formik.setFieldValue(
                    `thirdPartyVehicles[${activeVehicleTab}].bhr_hire_charge_per_day`,
                    Number(opt.bhr_rate),
                  );
                }}
              />
            </div>
          </SectionWrapper>

          {/* Section: Hire Vehicle Provision (Design Updated with Custom Picker) */}
          <SectionWrapper
            title="Hire Vehicle Provision"
            actionIcon={
              <div className="relative" ref={actionPopupRef}>
                <MoreVertical
                  size={20}
                  className="text-blue-600 cursor-pointer"
                  onClick={toggleActionPopup}
                />
                {showActionPopup && (
                  <div className="absolute right-0 top-8 z-50 p-6 bg-white rounded-lg shadow-xl inline-flex flex-col gap-3 min-w-[330px] border border-slate-100">
                    {/* Option 1: Always available to edit provider */}
                    <div className="text-blue-500 text-sm cursor-pointer hover:bg-slate-50 p-1">
                      Enter Cross-Hire Provider Details
                    </div>
                    <div className="h-px bg-slate-100 w-full" />
                    {/* Option 2: Disable if already has a start date */}
                    <div
                      className={`text-sm p-1 ${
                        currentVehicle.actionsCompleted?.onHire
                          ? "text-slate-300 pointer-events-none"
                          : "text-primary cursor-pointer hover:bg-slate-50"
                      }`}
                      onClick={() => handleAction("onHire")}
                    >
                      On Hire Vehicle
                      {currentVehicle.hire_vehicle_status_id === 1 &&
                        "(Already Active)"}
                    </div>
                    <div className="h-px bg-slate-100 w-full" />
                    {/* Option 3: Disable if already off-hired */}
                    <div
                      className={`text-sm font-weight-400 p-1 ${
                        currentVehicle.actionsCompleted?.switchStarted
                          ? "text-slate-300 pointer-events-none"
                          : "text-primary cursor-pointer hover:bg-slate-50"
                      }`}
                      onClick={() => handleAction("switchOff")}
                    >
                      Start Vehicle Switch (Off-Hire Old)
                    </div>
                    <div className="h-px bg-slate-100 w-full" />
                    {/* Option 4: Enable ONLY if current vehicle is off-hired and we have < 3 records */}
                    <div
                      className={`text-sm font-weight-400 p-1 ${
                        currentVehicle.actionsCompleted?.switchCompleted
                          ? "text-slate-300 pointer-events-none"
                          : "text-primary cursor-pointer hover:bg-slate-50"
                      }`}
                      onClick={() => handleAction("onHireNew")}
                    >
                      Complete Vehicle Switch (On-Hire New)
                    </div>
                    <div className="h-px bg-slate-100 w-full" />
                    {/* Option 5: Disable if already off-hired */}
                    <div
                      className={`text-sm p-1 ${
                        currentVehicle.actionsCompleted?.offHire
                          ? "text-slate-300 pointer-events-none"
                          : "text-primary cursor-pointer hover:bg-slate-50"
                      }`}
                      onClick={() => handleAction("offHire")}
                    >
                      Off Hire Vehicle
                      {currentVehicle.hire_vehicle_status_id === 2 &&
                        "(Completed)"}
                    </div>
                  </div>
                )}
              </div>
            }
          >
            <div className="grid grid-cols-2 gap-5 mb-5">
              <RadioGroup
                label="Has this Hire Vehicle been Cross-Hired to us?"
                value={currentVehicle.cross_hired}
                onChange={(val) =>
                  formik.setFieldValue(
                    `thirdPartyVehicles[${activeVehicleTab}].cross_hired`,
                    val,
                  )
                }
              />
              <Dropdown
                label="Hire Vehicle Status"
                options={vehicleStatus}
                value={currentVehicle.hire_vehicle_status_id}
                onChange={(opt) =>
                  formik.setFieldValue(
                    `thirdPartyVehicles[${activeVehicleTab}].hire_vehicle_status_id`,
                    opt.value,
                  )
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-5 mb-5">
              <InputField
                label="File Reference Number"
                value={currentVehicle.provider_name}
                onChange={(e) =>
                  formik.setFieldValue(
                    `thirdPartyVehicles[${activeVehicleTab}].provider_name`,
                    e.target.value,
                  )
                }
              />
              <InputField
                label="Registration Number"
                value={currentVehicle.hire_vehicle_registration}
                onChange={(e) =>
                  formik.setFieldValue(
                    `thirdPartyVehicles[${activeVehicleTab}].hire_vehicle_registration`,
                    e.target.value,
                  )
                }
              />
              <InputField
                label="Make"
                value={currentVehicle.make}
                onChange={(e) =>
                  formik.setFieldValue(
                    `thirdPartyVehicles[${activeVehicleTab}].make`,
                    e.target.value,
                  )
                }
              />
              <InputField
                label="Model"
                value={currentVehicle.model}
                onChange={(e) =>
                  formik.setFieldValue(
                    `thirdPartyVehicles[${activeVehicleTab}].model`,
                    e.target.value,
                  )
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-5 mb-5">
              <RadioGroup
                label="Plate Transfer"
                value={currentVehicle.plate_transfer}
                onChange={(val) =>
                  formik.setFieldValue(
                    `thirdPartyVehicles[${activeVehicleTab}].plate_transfer`,
                    val,
                  )
                }
              />
              <InputField
                label="Fuel Type"
                value={currentVehicle.fuel_type}
                onChange={(e) =>
                  formik.setFieldValue(
                    `thirdPartyVehicles[${activeVehicleTab}].fuel_type`,
                    e.target.value,
                  )
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-5">
              {/* Design match for Provision Start Date */}
              <div className="flex flex-col gap-2 relative" ref={provStartRef}>
                <label className="text-neutral-700 text-[14px] font-weight-500">
                  Hire Start Date
                </label>
                <div
                  onClick={() =>
                    setShowProvisionStartPicker(!showProvisionStartPicker)
                  }
                  className="h-[52px] px-5 bg-white border border-gray-200 rounded flex items-center justify-between cursor-pointer"
                >
                  <span
                    className={`font-light font-weight-300 ${currentVehicle.hireOutDate ? "text-gray-900" : "text-gray-400"}`}
                  >
                    {currentVehicle.hireOutDate || "Select Date"}
                  </span>
                  <img src={Vector6} alt="" />
                </div>
                {showProvisionStartPicker && (
                  <div className="absolute bottom-[54px] left-0 z-100">
                    <CustomDatePicker
                      selectedDate={
                        currentVehicle.hireOutDate
                          ? new Date(currentVehicle.hireOutDate)
                          : new Date()
                      }
                      onDateSelect={(date) => {
                        formik.setFieldValue(
                          `thirdPartyVehicles[${activeVehicleTab}].hireOutDate`,
                          date.toISOString().split("T")[0],
                        );
                        setShowProvisionStartPicker(false);
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Design match for Provision End Date */}
              <div className="flex flex-col gap-2 relative" ref={provEndRef}>
                <label className="text-neutral-700 text-[14px] font-weight-500">
                  Hire End Date
                </label>
                <div
                  onClick={() =>
                    setShowProvisionEndPicker(!showProvisionEndPicker)
                  }
                  className="h-[52px] px-5 bg-white border border-gray-200 rounded flex items-center justify-between cursor-pointer"
                >
                  <span
                    className={`font-light font-weight-300 ${currentVehicle.hireBackDate ? "text-gray-900" : "text-gray-400"}`}
                  >
                    {currentVehicle.hireBackDate || "Select Date"}
                  </span>
                  <img src={Vector6} alt="" />
                </div>
                {showProvisionEndPicker && (
                  <div className="absolute bottom-[54px] left-0 z-100">
                    <CustomDatePicker
                      selectedDate={
                        currentVehicle.hireBackDate
                          ? new Date(currentVehicle.hireBackDate)
                          : new Date()
                      }
                      onDateSelect={(date) => {
                        formik.setFieldValue(
                          `thirdPartyVehicles[${activeVehicleTab}].hireBackDate`,
                          date.toISOString().split("T")[0],
                        );
                        setShowProvisionEndPicker(false);
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          </SectionWrapper>

          {/* Section: Hire Period */}
          <SectionWrapper title="Hire Period">
            <div className="grid grid-cols-2 gap-5 mb-5">
              <div className="flex flex-col gap-2 relative" ref={hireOutRef}>
                <label className="text-neutral-700 text-[14px] font-weight-500">
                  Hire Out Date & Time
                </label>
                <div
                  onClick={() => setShowHireOutPicker(!showHireOutPicker)}
                  className="h-[52px] px-5 bg-white border border-gray-200 rounded flex items-center justify-between cursor-pointer"
                >
                  <span
                    className={`font-light font-weight-300 ${currentVehicle.hireOutDate ? "text-gray-900" : "text-gray-400"}`}
                  >
                    {currentVehicle.hireOutDate || "Select Date"}
                  </span>
                  <img src={Vector6} alt="" />
                </div>
                {showHireOutPicker && (
                  <div className="absolute bottom-[54px] left-0 z-100">
                    <CustomDatePicker
                      selectedDate={
                        currentVehicle.hireOutDate
                          ? new Date(currentVehicle.hireOutDate)
                          : new Date()
                      }
                      onDateSelect={(date) => {
                        formik.setFieldValue(
                          `thirdPartyVehicles[${activeVehicleTab}].hireOutDate`,
                          date.toISOString().split("T")[0],
                        );
                        setShowHireOutPicker(false);
                      }}
                    />
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-2 relative" ref={hireBackRef}>
                <label className="text-neutral-700 text-[14px] font-weight-500">
                  Hire Back Date & Time
                </label>
                <div
                  onClick={() => setShowHireBackPicker(!showHireBackPicker)}
                  className="h-[52px] px-5 bg-white border border-gray-200 rounded flex items-center justify-between cursor-pointer"
                >
                  <span
                    className={`font-light font-weight-300 ${currentVehicle.hireBackDate ? "text-gray-900" : "text-gray-400"}`}
                  >
                    {currentVehicle.hireBackDate || "Select Date"}
                  </span>
                  <img src={Vector6} alt="" />
                </div>
                {showHireBackPicker && (
                  <div className="absolute bottom-[54px] left-0 z-100">
                    <CustomDatePicker
                      selectedDate={
                        currentVehicle.hireBackDate
                          ? new Date(currentVehicle.hireBackDate)
                          : new Date()
                      }
                      onDateSelect={(date) => {
                        formik.setFieldValue(
                          `thirdPartyVehicles[${activeVehicleTab}].hireBackDate`,
                          date.toISOString().split("T")[0],
                        );
                        setShowHireBackPicker(false);
                      }}
                    />
                  </div>
                )}
              </div>
              <InputField
                label="Number of Days Hire So Far"
                value={currentVehicle.no_of_days_hired.toString()}
                disabled
              />
              <InputField
                label="Final Total Number of Hire Days"
                value={currentVehicle.total_no_of_days_hired.toString()}
                disabled
              />
            </div>
          </SectionWrapper>

          {/* Section: ABI Hire Charges */}
          <SectionWrapper title="ABI Hire Charges">
            <div className="mb-5">
              <RadioGroup
                label="ABI Insurer?"
                value={currentVehicle.abi_insured}
                onChange={(val) =>
                  formik.setFieldValue(
                    `thirdPartyVehicles[${activeVehicleTab}].abi_insured`,
                    val,
                  )
                }
              />
            </div>
            <div className={`grid grid-cols-2 gap-5 mb-5 ""}`}>
              <InputField
                label="ABI Hire Charge Per Day"
                value={currentVehicle.abi_hire_charge_per_day.toString()}
                disabled
              />
              <InputField
                label="Extra Charges Per Day"
                value={currentVehicle.extra_charge_per_day.toString()}
                onChange={(e) =>
                  formik.setFieldValue(
                    `thirdPartyVehicles[${activeVehicleTab}].extra_charge_per_day`,
                    e.target.value,
                  )
                }
              />
              <Dropdown
                label="Admin Fee Type"
                options={adminFeeType}
                value={currentVehicle.admin_fee_type}
                onChange={(opt) =>
                  formik.setFieldValue(
                    `thirdPartyVehicles[${activeVehicleTab}].admin_fee_type`,
                    opt.value,
                  )
                }
              />
              <InputField
                label="Administration Fee"
                value={currentVehicle.administration_fee.toString()}
                disabled
              />
              <InputField
                label="Total ABI Hire Charges"
                value={`£${currentVehicle.total_abi_hire_charge}`}
                disabled
              />
            </div>
          </SectionWrapper>

          {/* Section: BHR Hire Charges */}
          <SectionWrapper title="BHR Hire Charges & Administration Fee Details">
            <div className="grid grid-cols-2 gap-5 mb-5">
              <InputField
                label="BHR Hire Charge Per Day"
                value={currentVehicle.bhr_hire_charge_per_day.toString()}
                disabled
              />
              <InputField
                label="Extra Charges Per Day"
                value={currentVehicle.bhr_extra_charge_per_day.toString()}
                onChange={(e) =>
                  formik.setFieldValue(
                    `thirdPartyVehicles[${activeVehicleTab}].bhr_extra_charge_per_day`,
                    e.target.value,
                  )
                }
              />
              <InputField
                label="Administration Fee"
                value={currentVehicle.bhr_administration_fee.toString()}
                onChange={(e) =>
                  formik.setFieldValue(
                    `thirdPartyVehicles[${activeVehicleTab}].bhr_administration_fee`,
                    e.target.value,
                  )
                }
              />
              <InputField
                label="CDW Charges"
                value={(15 * currentVehicle.total_no_of_days_hired).toString()}
                disabled
              />
              <InputField
                label="Collection & Delivery Fee"
                value={currentVehicle.collection_and_delivery_fee.toString()}
                onChange={(e) =>
                  formik.setFieldValue(
                    `thirdPartyVehicles[${activeVehicleTab}].collection_and_delivery_fee`,
                    e.target.value,
                  )
                }
              />
              <InputField
                label="Total BHR Charges"
                value={`£${currentVehicle.total_bhr_charge}`}
                disabled
              />
            </div>
          </SectionWrapper>
        </div>
      </FormikProvider>
      {showCheckoutModal && (
        <CheckoutModal
          isOpen={showCheckoutModal}
          onClose={() => setShowCheckoutModal(false)}
          onSave={(capturedFormData) => {
            const todayStr = new Date().toISOString().split("T")[0];

            formik.setFieldValue(
              `thirdPartyVehicles[${activeVehicleTab}].hireBackDate`,
              todayStr,
            );
            formik.setFieldValue(
              `thirdPartyVehicles[${activeVehicleTab}].hire_vehicle_status_id`,
              2,
            );

            // 2. Store the data into the 'forms' array at the specific index
            setCheckoutData((prev) => {
              const updatedForms = [...prev.forms];
              updatedForms[activeVehicleTab] = capturedFormData;
              return { ...prev, forms: updatedForms };
            });

            setShowCheckoutModal(false);
            setShowActionPopup(false);
            setShowSwapBanner(true);
            toast.success(
              switchVehicle
                ? "Vehicle off-hired..."
                : "Vehicle off-hired successfully.",
            );
          }}
          // Access from the forms array
          formData={checkoutData.forms[activeVehicleTab] || {}}
          setFormData={(updater: any) => {
            setCheckoutData((prev) => {
              const currentData = prev.forms[activeVehicleTab] || {};
              // Handle functional updates from the modal's setFormData
              const newData =
                typeof updater === "function" ? updater(currentData) : updater;

              const updatedForms = [...prev.forms];
              updatedForms[activeVehicleTab] = newData;
              return { ...prev, forms: updatedForms };
            });
          }}
          step={modalStep}
          setStep={setModalStep}
        />
      )}
    </>
  );
};

// --- Sub-components (Design Unchanged) ---
const SectionWrapper: React.FC<{ title: string; children: React.ReactNode; actionIcon?: React.ReactNode }> = ({ title, children, actionIcon }) => (
  <div className="w-full p-5 rounded-lg border border-slate-100 flex flex-col gap-4">
    <div className="flex justify-between items-center w-full">
      <h3 className="text-neutral-900 text-[20px] font-weight-600 leading-5">{title}</h3>
      {actionIcon}
    </div>
    <div className="w-full h-px bg-slate-100" />
    <div className="pt-2">{children}</div>
  </div>
);
const inputStyles = `hover:border-neutral-400 focus:border-blue-500 focus:outline-none font-light transition-colors placeholder:font-['Stack_Sans_Headline']`;

const InputField: React.FC<{
  label: string;
  value: string;
  onChange?: any;
  disabled?: boolean;
}> = ({ label, value, onChange, disabled }) => (
  <div className="flex flex-col gap-2 w-full">
    <label className="text-slate-700 text-sm font-weight-400">{label}</label>
    <input
      type="text"
      value={value}
      onChange={onChange}
      disabled={disabled}
      className={`w-full h-[52px] px-5 bg-white rounded border border-gray-200 text-neutral-700 ${inputStyles} ${disabled ? "bg-slate-50" : "bg-white"}`}
    />
  </div>
);

const Dropdown: React.FC<{ label: string; options: any; value: any; onChange: any }> = ({ label, options, value, onChange }) => (
  <div className="flex flex-col gap-2 w-full">
    <label className="text-neutral-700 text-[14px] font-weight-500">{label}</label>
    <Select options={options} value={options.find((o: any) => o.value === value)} onChange={onChange} styles={customStyles} components={{ DropdownIndicator: BlueDropdownIndicator, IndicatorSeparator: () => null }} />
  </div>
);

const RadioGroup: React.FC<{ label: string; value: boolean; onChange: (v: boolean) => void }> = ({ label, value, onChange }) => (
  <div className="flex flex-col gap-5 w-full">
    <label className="text-black text-sm font-weight-400">{label}</label>
    <div className="flex gap-5">
      <div onClick={() => onChange(true)} className="flex items-center gap-2 cursor-pointer">
        <img src={value === true ? Yes : No} alt="radio" /> <span>Yes</span>
      </div>
      <div onClick={() => onChange(false)} className="flex items-center gap-2 cursor-pointer">
        <img src={value === false ? Yes : No} alt="radio" /> <span>No</span>
      </div>
    </div>
  </div>
);