import "react-phone-input-2/lib/style.css";
import React from "react";
import Label from "../common/label.tsx";
import { getLocalTimeZone, today } from "@internationalized/date";
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { ErrorMessage, Field, FieldArray, Formik } from "formik";
import { useParams } from "react-router-dom";
import { DatePicker } from "../application/date-picker/date-picker.tsx";
import CustomSelect from "../ReactSelect/ReactSelect.tsx";
import * as Yup from "yup";
import { Dropdown } from "../base/dropdown/dropdown.tsx";
import "react-responsive-modal/styles.css";
import { Modal } from "react-responsive-modal";
import {
  createHireProvided,
  downloadCheckSheet,
  downloadFeeExemption,
  downloadHireDocumentationAgreement,
  downloadMitigationQuestionnaire,
  downloadStorageRecovery,
  getDriverChargesByVehicle,
  getHireProvided,
  getHireVehicleStatus,
  getTableData,
  saveDriverCheckout,
  sendEmailOnHire,
  sendEmails,
  sendFeeExemption,
  sendHireDocumentationAgreement,
  sendMigrationQuestionnaire,
  sendStorageRecovery,
  sendVehicleCheckSheet,
  updateDriverCheckout,
  updateHireProvided,
  deactivateVehicle,
} from "../../services/HireVehicleProvided/HireVehicleProvided.tsx";
import { Table, TableCard } from "../application/table/table.tsx";
import { parseCalendarDate } from "../../common/common.tsx";
import { FaTimes } from "react-icons/fa";
import PhoneInput from "react-phone-input-2";
import { IoDocumentAttachOutline } from "react-icons/io5";
import { FaFileExcel, FaFilePdf } from "react-icons/fa6";
import { toast } from "react-toastify";
import CustomDatePicker from "../DatePicker/CustomDatePicker.tsx";
import {
  getActualVehicleCategory,
  getClientVehicleCategory,
} from "../../services/HireDetail/HireDetails.tsx";
import TopRightIcon from "../common/top-right-icon.tsx";
import { API_BASE_URL } from "../../services/axiosConfig.ts";

// Helper function to format numbers to 2 decimal places
const formatToTwoDecimals = (
  value: string | number | null | undefined
): string => {
  if (value === "" || value === null || value === undefined) return "";

  const stringValue =
    typeof value === "number" ? value.toString() : String(value);

  // Remove any non-numeric characters except decimal point and minus sign
  const cleanedValue = stringValue.replace(/[^\d.-]/g, "");

  // Parse as float
  const num = parseFloat(cleanedValue);
  if (isNaN(num)) return stringValue;

  // Format to 2 decimal places
  return num.toFixed(2);
};

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

const validationSchema = Yup.object().shape({});

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

type HireVehicleEmailActionsProps = {
  handleQuestionnaireSend: (
    email: string,
    flag: boolean,
    address?: string
  ) => void;
  values: {
    address: {
      address?: string;
    };
  };
};

const formatVehicleCategoryLabel = (label: string): string => {
  if (!label) return label;
  return label
    .replace(/>=/g, " ≥ ")
    .replace(/<=/g, " ≤ ")
    .replace(/=>/g, " ≥ ")
    .replace(/=< /g, " ≤ ")
    .replace(/greater than or equal to/gi, " ≥ ")
    .replace(/less than or equal to/gi, " ≤ ");
};

const HireVehicleEmailActions: React.FC<HireVehicleEmailActionsProps> = ({
  handleQuestionnaireSend,
  values,
}) => {
  const items = [
    {
      label: "Inst Fleet to On Hire",
      email: "fleet@example.com",
      activity: "Instruction sent: On Hire",
      description: "Email to Fleet with claim + vehicle details",
    },
    {
      label: "Inst Fleet to Off Hire",
      email: "fleet@example.com",
      activity: "Instruction sent: Off Hire",
      description: "Email to Fleet",
    },
    {
      label: "Hire Vehicle Check Sheet",
      email: "fleet@example.com",
      description: "Email with checklist link or attachment",
    },
    {
      label: "Recovery & Storage",
      email: "recovery@example.com",
      description: "Email to recovery partner with pickup details",
    },
    {
      label: "Mitigation Questionnaire",
      email: "hirer@example.com",
      description: "Email to hirer with secure form link",
    },
    {
      label: "Hire Documentation",
      email: "docs@example.com",
      description: "Email with required document links/list",
    },
    {
      label: "Fee Exemption Form",
      email: "docs@example.com",
      description: "Email with form link",
    },
  ];

  return (
    <div className="flex justify-end">
      <Dropdown.Root>
        <>
          <Dropdown.DotsButton />
          <Dropdown.Popover>
            <Dropdown.Menu>
              <Dropdown.Section>
                {items.map((item) => (
                  <Dropdown.Item
                    key={item.label}
                    onAction={() =>
                      handleQuestionnaireSend(item.email, true, item.label)
                    }
                    className={(state) =>
                      [
                        "flex items-start gap-2 transition-colors duration-150 rounded-md px-2 py-2",
                        state.isFocused ? "bg-gray-100" : "",
                        "hover:bg-gray-100 cursor-pointer",
                      ].join(" ")
                    }
                  >
                    <div className="flex items-start gap-2">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-800">
                          {item.label}
                        </span>
                      </div>
                    </div>
                  </Dropdown.Item>
                ))}
              </Dropdown.Section>
            </Dropdown.Menu>
          </Dropdown.Popover>
        </>
      </Dropdown.Root>
    </div>
  );
};

// Local YYYY-MM-DD for "today" — using toISOString() would return UTC, which in
// timezones ahead of UTC rolls back to the previous day (the "2nd becomes 1st" bug).
const localTodayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const HireVehicleProvided = forwardRef(
  ({ handleNext, skipNext }: PanelSolicitorDetailsProps, ref) => {
    const searchParams = new URLSearchParams(window.location.search);
    const claimID = searchParams.get("claimid");
    const { id } = useParams();
    const [hireVehicleStatus, setHireVehicleStatus] = useState([]);
    const [hireVehicleStatusLoading, setHireVehicleStatusLoading] =
      useState(false);
    const [suggestions, setSuggestions] = useState<Company[]>([]);
    const [typing, setTyping] = useState(false);
    const now = today(getLocalTimeZone());
    const [isEditing, setIsEditing] = useState(false);
    const [vehicleStatus, setVehicleStatus] = useState([]);
    const formikRef = useRef<any>(null);
    const [offHireModal, setOffHireModal] = useState(false);
    const [vehicleForModal, setVehicleForModal] = useState<Vehicle | null>(
      null
    );
    const [tableData, setTableData] = useState([]);
    const [switchVehicle, setSwitchVehicle] = useState(false);
    const [showEndHireTabs, setShowEndHireTabs] = useState<{
      [key: number]: boolean;
    }>({});
    const [actualVehicleCategory, setActualVehicleCategory] = useState([]);
    const [clientVehicleCategory, setClientVehicleCategory] = useState([]);
    const [currentVehicleId, setCurrentVehicleId] = useState(null);
    const [isModalEditing, setIsModalEditing] = useState(false);
    const [images, setImages] = useState([]);
    const [exteriorImages, setExteriorImages] = useState([]);
    const fileInputRef = useRef(null);
    const fileInputExteriorRef = useRef(null);
    const [confirmationOpen, setConfirmationOpen] = useState(false);
    const [selectedVehicle, setSelectedVehicle] = useState<number | null>(null);

    const [formData, setFormData] = useState({
      interiorCleanCheckOut: "",
      interiorCleanCheckIn: "",
      interiorDamage: false,
      interiorDamageDescription: "",
      interiorPhotos: [],
      applyDamageCharges: "",
      exteriorCleanCheckOut: "",
      exteriorCleanCheckIn: "",
      exteriorDamage: false,
      petrolChargeAmount: "",
      exteriorDamageDescription: "",
      exteriorPhotos: [],
      petrolCheckoutCharge: "",
      petrolChargeReason: "",
      damageCharges: "",
      damageChargesPaidNow: 0,
      damageNotes: "",
      valetCharge: 0,
    });

    const defaultVehicle = {
      client_vehicle_category_id: "",
      actual_vehicle_category_id: "",
      cross_hired: false,
      hire_vehicle_status_id: "",
      hire_vehicle_registration: "",
      make: "",
      provider_name: "",
      rate: null,
      contact_number: "",
      model: "",
      hire_start_date: null,
      hire_end_date: null,
      fuel_type: "",
      plate_transfer: false,
    };

    const [initialValues, setInitialValues] = useState({
      hireVehicle: [defaultVehicle],
    });

    const items = [
      {
        label: "On Hire Vehicle",
        email: "fleet@example.com",
        activity: "Instruction sent: Off Hire",
        description: "Email to Fleet",
      },
      {
        label: "Switch Vehicle – Off Hire Old",
        email: "recovery@example.com",
        description: "Email to recovery partner with pickup details",
      },
      {
        label: "Switch Vehicle – On Hire New",
        email: "hirer@example.com",
        description: "Email to hirer with secure form link",
      },
      {
        label: "Off Hire Vehicle",
        email: "fleet@example.com",
        description: "Email with checklist link or attachment",
      },
    ];

    useEffect(() => {
      window.scrollTo(0, 0);
    }, []);

    useEffect(() => {
      getHireVehicleStatus().then((res) => {
        if (res.data && Array.isArray(res.data)) {
          const formattedOptions = res.data.map((item) => ({
            label: item.label,
            value: item.id,
          }));
          setVehicleStatus(formattedOptions);
        }
      });
    }, []);

    useEffect(() => {
      fetchClientVehicleCategory();
      fetchActualVehicleCategory();
    }, []);

    const fetchClientVehicleCategory = async () => {
      try {
        const res = await getClientVehicleCategory();
        const formattedCategories = res.data.map((item: any) => ({
          ...item,
          label: formatVehicleCategoryLabel(item.label),
        }));
        setClientVehicleCategory(formattedCategories);
      } catch (e) {
        console.error("Error fetching client vehicle category:", e);
      }
    };

    const fetchActualVehicleCategory = async () => {
      try {
        const res = await getActualVehicleCategory();
        const formattedCategories = res.data.map((item: any) => ({
          ...item,
          label: formatVehicleCategoryLabel(item.label),
        }));
        setActualVehicleCategory(formattedCategories);
      } catch (e) {
        console.error("Error fetching actual vehicle category:", e);
      }
    };

    useEffect(() => {
      const currentClaimId = claimID || id;
      if (!currentClaimId) return;

      const loadData = async () => {
        try {
          const res = await getHireProvided(currentClaimId);
          if (Array.isArray(res.data) && res.data.length > 0) {
            const mappedVehicles = res.data.map((item: any) => {
              const clientLabel = clientVehicleCategory.find(
                (c: any) => c.id === item.client_vehicle_category_id
              )?.label;

              const actualLabel = actualVehicleCategory.find(
                (c: any) => c.id === item.actual_vehicle_category_id
              )?.label;

              return {
                cross_hired: !!item.cross_hire,
                hire_vehicle_status_id: item.hire_vehicle_status_id ?? "",
                hire_vehicle_registration: item.hire_vehicle_registration ?? "",
                make: item.make ?? "",
                model: item.model ?? "",
                id: item.id ?? "",
                client_vehicle_category_id:
                  item?.client_vehicle_category_id ?? "",
                client_vehicle_category_label: clientLabel ?? "",
                actual_vehicle_category_id:
                  item?.actual_vehicle_category_id ?? "",
                actual_vehicle_category_label: actualLabel ?? "",
                hire_start_date:
                  parseCalendarDate(item.hire_start_date) ?? null,
                hire_end_date: parseCalendarDate(item.hire_end_date) ?? null,
                fuel_type: item.fuel_type ?? "",
                plate_transfer: item.plate_transfer ?? false,
              };
            });

            const defaultShowTabs = mappedVehicles.reduce(
              (acc: Record<number, boolean>, v, idx) => {
                acc[idx] = !!v.hire_end_date;
                return acc;
              },
              {}
            );

            setInitialValues({ hireVehicle: mappedVehicles });
            setShowEndHireTabs(defaultShowTabs);
            setIsEditing(true);
          } else {
            setInitialValues({ hireVehicle: [defaultVehicle] });
          }
        } catch (error) {
          console.error("Failed to fetch hire vehicle data:", error);
          setInitialValues({ hireVehicle: [defaultVehicle] });
        }
      };

      loadData();
    }, [id, claimID]);

    useEffect(() => {
      const currentClaimId = claimID || id;
      if (!currentClaimId) return;

      const loadTableData = async () => {
        try {
          const res = await getTableData(currentClaimId);
          const newData = res?.data || [];

          setTableData((prev) => {
            const updated = [...prev];

            newData.forEach((item) => {
              const reg = item.hire_vehicle_registration?.trim()?.toUpperCase();
              if (!reg) return;

              const existingIndex = updated.findIndex(
                (v) =>
                  v.hire_vehicle_registration?.trim()?.toUpperCase() === reg
              );

              if (existingIndex >= 0) {
                updated[existingIndex] = { ...updated[existingIndex], ...item };
              } else {
                updated.push(item);
              }
            });

            const uniqueByReg = Array.from(
              new Map(
                updated.map((item) => [
                  item.hire_vehicle_registration?.trim()?.toUpperCase(),
                  item,
                ])
              ).values()
            );

            return uniqueByReg;
          });
        } catch (e) {
          console.error("Error loading table data:", e);
        }
      };

      loadTableData();
    }, [claimID, id]);

    const formatCalendarDate = (date?: CalendarDate) => {
      if (!date) return undefined;
      const year = date.year;
      const month = String(date.month).padStart(2, "0");
      const day = String(date.day).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    const handleSubmit = async (values: any, key: string) => {
      try {
        const storedClaimId = claimID || id;

        const formattedHireVehicles = values.hireVehicle.map(
          (vehicle: any) => ({
            ...vehicle,
            hire_start_date: formatCalendarDate(vehicle.hire_start_date),
            hire_end_date: formatCalendarDate(vehicle.hire_end_date),
            rate: vehicle.rate ? parseFloat(formatToTwoDecimals(vehicle.rate)) : null,
          })
        );

        const payload = {
          claim_id: storedClaimId,
          section_a: {
            inst_fleet_on_hire: values.inst_fleet_on_hire,
            inst_fleet_off_hire: values.inst_fleet_off_hire,
            hire_vehicle_check_sheet: values.hire_vehicle_check_sheet,
            recovery_storage: values.recovery_storage,
            mitigation_questionnaire: values.mitigation_questionnaire,
            hire_documentation: values.hire_documentation,
            fee_exemption_form: values.fee_exemption_form,
            send_licensing_document_account:
              values.send_licensing_document_account,
            request_updated_insurance_schedule:
              values.request_updated_insurance_schedule,
            raise_authority_letter: values.raise_authority_letter,
          },
          section_b: formattedHireVehicles,
        };

        let response;
        if (storedClaimId && isEditing) {
          response = await updateHireProvided(
            storedClaimId,
            payload,
            switchVehicle
          );
        } else {
          response = await createHireProvided(
            storedClaimId,
            payload,
            switchVehicle
          );
        }

        toast.success("Hire Vehicle Provided saved successfully");

        if (handleNext && !skipNext) {
          handleNext(16, "next");
        }
      } catch (error: any) {
        toast.error("Unable to save hire provided details");
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

    const handleModalFormChange = (name, e) => {
      setFormData((prevData) => ({
        ...prevData,
        [name]: e,
      }));
    };

    const handleModalCheckboxChange = (e) => {
      const { name, checked } = e.target;
      setFormData((prevData) => ({
        ...prevData,
        [name]: checked,
      }));
    };

    const handleAddImage = () => {
      fileInputRef.current?.click();
    };
    const handleAddExteriorImage = () => {
      fileInputExteriorRef.current.click();
    };

    const handleFileChange = (e) => {
      const files = Array.from(e.target.files || []);
      setFormData((prev) => ({
        ...prev,
        interiorPhotos: [...(prev.interiorPhotos || []), ...files],
      }));
      const newPreviews = files.map((file) => URL.createObjectURL(file));
      setImages((prev) => [...prev, ...newPreviews]);
    };

    const handleFileExteriorChange = (e) => {
      const files = Array.from(e.target.files || []);
      setFormData((prev) => ({
        ...prev,
        exteriorPhotos: [...(prev.exteriorPhotos || []), ...files],
      }));
      const newPreviews = files.map((file) => URL.createObjectURL(file));
      setExteriorImages((prev) => [...prev, ...newPreviews]);
    };

    const handleValetCharge = (typeData: string, value: string) => {
      setFormData((prevData) => {
        const interiorValue =
          typeData === "interiorCleanCheckIn"
            ? value
            : prevData.interiorCleanCheckIn;
        const exteriorValue =
          typeData === "exteriorCleanCheckIn"
            ? value
            : prevData.exteriorCleanCheckIn;

        const valetCharge =
          interiorValue === "Yes" && exteriorValue === "Yes" ? 0 : 30;

        return {
          ...prevData,
          [typeData]: value,
          valetCharge,
        };
      });
    };

    const handleCheckoutSubmit = async (e) => {
      e.preventDefault();
      try {
        if (isModalEditing) {
          const formDataPayload = new FormData();
          formDataPayload.append("currency", "GBP");
          formDataPayload.append(
            "interior_clean_at_check_out",
            formData.interiorCleanCheckOut === "Yes"
          );
          formDataPayload.append(
            "interior_clean_at_check_in",
            formData.interiorCleanCheckIn === "Yes"
          );
          formDataPayload.append(
            "interior_damage_at_check_in",
            formData.interiorDamage || false
          );
          formDataPayload.append(
            "describe_interior_damage",
            formData.interiorDamageDescription || ""
          );
          formDataPayload.append("hire_vehicle_provided_id", currentVehicleId);
          formDataPayload.append("claim_id", id || claimID);

          formDataPayload.append(
            "exterior_clean_at_check_out",
            formData.exteriorCleanCheckOut === "Yes"
          );
          formDataPayload.append(
            "exterior_clean_at_check_in",
            formData.exteriorCleanCheckIn === "Yes"
          );
          formDataPayload.append(
            "exterior_damage_at_check_in",
            formData.exteriorDamage || false
          );
          formDataPayload.append(
            "describe_exterior_damage",
            formData.exteriorDamageDescription || ""
          );

          formDataPayload.append(
            "apply_petrol_checkout_charges",
            formData.petrolCheckoutCharge === "Yes"
          );
          formDataPayload.append(
            "petrol_checkout_charges",
            parseFloat(formatToTwoDecimals(formData.petrolChargeAmount)) || 0
          );
          formDataPayload.append(
            "petrol_charges_note",
            formData.petrolChargeReason || ""
          );

          formDataPayload.append(
            "apply_damage_charges",
            formData.applyDamageCharges === "Yes"
          );
          formDataPayload.append(
            "damage_charges",
            parseFloat(formatToTwoDecimals(formData.damageCharges)) || 0
          );
          formDataPayload.append(
            "damage_charges_paid_now",
            parseFloat(formatToTwoDecimals(formData.damageChargesPaidNow)) || 0
          );
          formDataPayload.append(
            "damage_charges_note",
            formData.damageNotes || ""
          );
          formDataPayload.append(
            "damage_charges_paid",
            (formData.applyDamageCharges === "Yes" &&
              parseFloat(formatToTwoDecimals(formData.damageChargesPaidNow)) > 0) ||
              false
          );

          formDataPayload.append(
            "valet_charges",
            parseFloat(formatToTwoDecimals(formData.valetCharge)) || 0
          );

          const totalDriverCheckoutCharges =
            (parseFloat(formatToTwoDecimals(formData.petrolChargeAmount)) || 0) +
            (parseFloat(formatToTwoDecimals(formData.damageCharges)) || 0) +
            (parseFloat(formatToTwoDecimals(formData.valetCharge)) || 0);

          formDataPayload.append(
            "total_driver_checkout_charges",
            totalDriverCheckoutCharges
          );

          if (formData.interiorPhotos && formData.interiorPhotos.length > 0) {
            formData.interiorPhotos.forEach((file) => {
              formDataPayload.append("interior_files", file);
            });
          }

          if (formData.exteriorPhotos && formData.exteriorPhotos.length > 0) {
            formData.exteriorPhotos.forEach((file) => {
              formDataPayload.append("exterior_files", file);
            });
          }

          await updateDriverCheckout(currentVehicleId, formDataPayload);
          setOffHireModal(false);
        } else {
          const formDataPayload = new FormData();
          formDataPayload.append("currency", "GBP");
          formDataPayload.append(
            "interior_clean_at_check_out",
            formData.interiorCleanCheckOut === "Yes"
          );
          formDataPayload.append(
            "interior_clean_at_check_in",
            formData.interiorCleanCheckIn === "Yes"
          );
          formDataPayload.append(
            "interior_damage_at_check_in",
            formData.interiorDamage || false
          );
          formDataPayload.append(
            "describe_interior_damage",
            formData.interiorDamageDescription || ""
          );
          formDataPayload.append("hire_vehicle_provided_id", currentVehicleId);
          formDataPayload.append("claim_id", id || claimID);

          formDataPayload.append(
            "exterior_clean_at_check_out",
            formData.exteriorCleanCheckOut === "Yes"
          );
          formDataPayload.append(
            "exterior_clean_at_check_in",
            formData.exteriorCleanCheckIn === "Yes"
          );
          formDataPayload.append(
            "exterior_damage_at_check_in",
            formData.exteriorDamage || false
          );
          formDataPayload.append(
            "describe_exterior_damage",
            formData.exteriorDamageDescription || ""
          );

          formDataPayload.append(
            "apply_petrol_checkout_charges",
            formData.petrolCheckoutCharge === "Yes"
          );
          formDataPayload.append(
            "petrol_checkout_charges",
            parseFloat(formatToTwoDecimals(formData.petrolChargeAmount)) || 0
          );
          formDataPayload.append(
            "petrol_charges_note",
            formData.petrolChargeReason || ""
          );

          formDataPayload.append(
            "apply_damage_charges",
            formData.applyDamageCharges === "Yes"
          );
          formDataPayload.append(
            "damage_charges",
            parseFloat(formatToTwoDecimals(formData.damageCharges)) || 0
          );
          formDataPayload.append(
            "damage_charges_paid_now",
            parseFloat(formatToTwoDecimals(formData.damageChargesPaidNow)) || 0
          );
          formDataPayload.append(
            "damage_charges_note",
            formData.damageNotes || ""
          );
          formDataPayload.append(
            "damage_charges_paid",
            (formData.applyDamageCharges === "Yes" &&
              parseFloat(formatToTwoDecimals(formData.damageChargesPaidNow)) > 0) ||
              false
          );

          formDataPayload.append(
            "valet_charges",
            parseFloat(formatToTwoDecimals(formData.valetCharge)) || 0
          );

          const totalDriverCheckoutCharges =
            (parseFloat(formatToTwoDecimals(formData.petrolChargeAmount)) || 0) +
            (parseFloat(formatToTwoDecimals(formData.damageCharges)) || 0) +
            (parseFloat(formatToTwoDecimals(formData.valetCharge)) || 0);

          formDataPayload.append(
            "total_driver_checkout_charges",
            totalDriverCheckoutCharges
          );

          if (formData.interiorPhotos && formData.interiorPhotos.length > 0) {
            formData.interiorPhotos.forEach((file) => {
              formDataPayload.append("interior_files", file);
            });
          }

          if (formData.exteriorPhotos && formData.exteriorPhotos.length > 0) {
            formData.exteriorPhotos.forEach((file) => {
              formDataPayload.append("exterior_files", file);
            });
          }

          await saveDriverCheckout(formDataPayload);
          setOffHireModal(false);
        }
      } catch (e) {
        console.error("Error during checkout submit:", e);
      } finally {
        toast.success("Driver Checkout Charges created successfully");
      }
    };

    const handleViewCharges = async (veh: any, shouldOpenModal = true) => {
      if (!veh?.id) {
        console.warn("No vehicle ID provided");
        if (shouldOpenModal) setOffHireModal(true);
        return;
      }

      setCurrentVehicleId(veh.id);

      try {
        const res = await getDriverChargesByVehicle(veh.id);

        if (res?.data) {
          const data = res.data;
          const providedItem = actualVehicleCategory.find(
            (c: any) => c.id === veh.actual_vehicle_category_id
          );
          const actualLabel = providedItem?.label?.toUpperCase() || "";

          let valetCharge = 0;
          if (
            /CV[1-4]|CM[1-3]|RV[1-2]|CP[1-3]|CS[1-5]/.test(actualLabel) ||
            /XHIRE\s*T12/i.test(actualLabel) ||
            /T12\s*>\s*3\s*YRS|T12\s*<\s*3\s*YRS|T12.*50\/50/i.test(actualLabel)
          ) {
            valetCharge = 50;
          } else if (
            /T10\s*>\s*3\s*YRS|T10\s*<\s*3\s*YRS|T10.*50\/50/i.test(
              actualLabel
            ) ||
            /^M[1-6]?|F[1-9]?|M3\s*TOURAN/i.test(actualLabel)
          ) {
            valetCharge = 40;
          } else {
            valetCharge = Number(data.valet_charges) || 0;
          }

          setFormData({
            interiorCleanCheckOut: data.interior_clean_at_check_out
              ? "Yes"
              : "No",
            interiorCleanCheckIn: data.interior_clean_at_check_in
              ? "Yes"
              : "No",
            interiorDamage: data.interior_damage_at_check_in ?? false,
            interiorDamageDescription: data.describe_interior_damage ?? "",
            interiorPhotos: [],
            exteriorCleanCheckOut: data.exterior_clean_at_check_out
              ? "Yes"
              : "No",
            exteriorCleanCheckIn: data.exterior_clean_at_check_in
              ? "Yes"
              : "No",
            exteriorDamage: data.exterior_damage_at_check_in ?? false,
            exteriorDamageDescription: data.describe_exterior_damage ?? "",
            exteriorPhotos: [],
            applyDamageCharges: data.apply_damage_charges ? "Yes" : "No",
            petrolCheckoutCharge: data.apply_petrol_checkout_charges
              ? "Yes"
              : "No",
            petrolChargeAmount: data.petrol_checkout_charges ?? 0,
            petrolChargeReason: data.petrol_charges_note ?? "",
            damageCharges: data.damage_charges ?? 0,
            damageChargesPaidNow: data.damage_charges_paid_now ?? 0,
            damageNotes: data.damage_charges_note ?? "",
            valetCharge: valetCharge,
          });

          setImages(
            data.interior_images?.map((img) =>
              img.url.replace("https://localhost:8009/", API_BASE_URL)
            ) || []
          );

          setExteriorImages(
            data.exterior_images?.map((img) =>
              img.url.replace("https://localhost:8009/", API_BASE_URL)
            ) || []
          );

          setIsModalEditing(true);
        } else {
          resetFormData();
          setIsModalEditing(false);
        }
      } catch (e) {
        console.error("Error fetching driver charges:", e);
        resetFormData();
        setIsModalEditing(false);
      } finally {
        if (shouldOpenModal) {
          setOffHireModal(true);
        }
      }
    };

    const resetFormData = () => {
      setFormData({
        interiorCleanCheckOut: "",
        interiorCleanCheckIn: "",
        interiorDamage: false,
        interiorDamageDescription: "",
        interiorPhotos: [],
        applyDamageCharges: "",
        exteriorCleanCheckOut: "",
        exteriorCleanCheckIn: "",
        exteriorDamage: false,
        petrolChargeAmount: "",
        exteriorDamageDescription: "",
        exteriorPhotos: [],
        petrolCheckoutCharge: "",
        petrolChargeReason: "",
        damageCharges: "",
        damageChargesPaidNow: 0,
        damageNotes: "",
        valetCharge: 0,
      });
      setImages([]);
      setExteriorImages([]);
    };

    const uniqueTableData = tableData.filter((v, i, arr) => {
      if (!v.hire_vehicle_registration) {
        return false;
      }

      const firstIndexById = arr.findIndex((t) => t.id === v.id);
      if (i === firstIndexById && firstIndexById !== -1) {
        return true;
      }

      const firstIndexByReg = arr.findIndex(
        (t) =>
          t.hire_vehicle_registration === v.hire_vehicle_registration &&
          v.hire_vehicle_registration
      );
      return i === firstIndexByReg;
    });

    return (
      <div className=" sm:pt-8 pb-8 sm:pb-12 sm:pr-4 lg:pr-10 bg-white">
        <Formik
          initialValues={initialValues}
          onSubmit={handleSubmit}
          validationSchema={validationSchema}
          innerRef={formikRef}
          enableReinitialize
        >
          {({ values, setFieldValue, errors, touched }: any) => {
            const [activeTab, setActiveTab] = useState(0);

            // NEW: useEffect to sync tableData with hireVehicle array
            useEffect(() => {
              const vehicles = values?.hireVehicle || [];

              // Filter out empty/default vehicles
              const validVehicles = vehicles.filter(
                (vehicle: any, index: number) => {
                  const hasData =
                    vehicle?.hire_vehicle_registration ||
                    vehicle?.make ||
                    vehicle?.model ||
                    vehicle?.hire_start_date ||
                    vehicle?.hire_end_date;
                  return hasData && vehicle !== defaultVehicle;
                }
              );

              // Update tableData with all current valid vehicles
              setTableData((prevData: any[]) => {
                const newTableData = [...prevData];

                validVehicles.forEach((vehicle: any, index: number) => {
                  const vehicleId = vehicle.id || `tab-${index}`;
                  const existingIndex = newTableData.findIndex(
                    (v) => v.id === vehicleId
                  );

                  const vehicleData = {
                    ...vehicle,
                    id: vehicleId,
                    hire_start_date: vehicle.hire_start_date,
                    hire_end_date: vehicle.hire_end_date,
                  };

                  if (existingIndex >= 0) {
                    newTableData[existingIndex] = vehicleData;
                  } else {
                    newTableData.push(vehicleData);
                  }
                });

                // Clean up any entries that don't correspond to current vehicles
                const validVehicleIds = validVehicles.map(
                  (v: any, i: number) => v.id || `tab-${i}`
                );
                const cleanedData = newTableData.filter((item) =>
                  validVehicleIds.includes(item.id)
                );

                // Also filter out duplicate IDs
                const seenIds = new Set();
                return cleanedData.filter((item) => {
                  if (seenIds.has(item.id)) {
                    return false;
                  }
                  seenIds.add(item.id);
                  return true;
                });
              });
            }, [values?.hireVehicle]);

            const handleSelectCategory = (
              company: any,
              vehicleIndex: number = 0,
              type: "client" | "actual" | "adminFee"
            ) => {
              if (!company) return;

              const abiRate = parseFloat(company.abi_rate ?? 0);
              const bhrRate = parseFloat(company.bhr_rate ?? 0);
              const id = company.id ?? 0;
              const label = formatVehicleCategoryLabel(company.label ?? "");

              if (type === "client") {
                setFieldValue(
                  `hireVehicle.${vehicleIndex}.client_vehicle_category_id`,
                  id
                );
                setFieldValue(
                  `hireVehicle.${vehicleIndex}.client_vehicle_category_label`,
                  label
                );

                const currentActualCategory =
                  formikRef?.current?.values?.hireVehicle?.[vehicleIndex]
                    ?.actual_vehicle_category_id;

                if (!currentActualCategory) {
                  setFieldValue(
                    `hireVehicle.${vehicleIndex}.actual_vehicle_category_id`,
                    id
                  );
                  setFieldValue(
                    `hireVehicle.${vehicleIndex}.actual_vehicle_category_label`,
                    label
                  );
                }

                setFieldValue(
                  `hireVehicle.${vehicleIndex}.abi_hire_charge_per_day`,
                  abiRate
                );
                setFieldValue(
                  `hireVehicle.${vehicleIndex}.bhr_hire_charge_per_day`,
                  bhrRate
                );
              } else if (type === "actual") {
                setFieldValue(
                  `hireVehicle.${vehicleIndex}.actual_vehicle_category_id`,
                  id
                );
                setFieldValue(
                  `hireVehicle.${vehicleIndex}.actual_vehicle_category_label`,
                  label
                );
                setFieldValue(
                  `hireVehicle.${vehicleIndex}.abi_hire_charge_per_day`,
                  abiRate
                );
                setFieldValue(
                  `hireVehicle.${vehicleIndex}.bhr_hire_charge_per_day`,
                  bhrRate
                );
              } else if (type === "adminFee") {
                setFieldValue(`hireVehicle.${vehicleIndex}.admin_fee_type`, id);
                setFieldValue(
                  `hireVehicle.${vehicleIndex}.admin_fee_type_label`,
                  label
                );
              }
            };

            const handleQuestionnaireSend = async (
              email: string,
              sendReminders: boolean,
              option: any
            ) => {
              const firstName = values.company_name || "Client";
              try {
                if (option === "Inst Fleet to On Hire") {
                  const { data } = await sendEmails(id || claimID, "on_hire");
                  const subject =
                    "New Instruction to Fleet to On Hire Vehicle (CIL)";
                  const body =
                    `Brand: RTA - Nationwide Assist\n` +
                    `Reference: ${data.Reference || "N/A"}\n` +
                    `Referrer: ${data.Referrer || "N/A"}\n` +
                    `Client: ${data.client_name || "N/A"}\n` +
                    `Client's Vehicle Mobile No.: ${
                      data.mobile_tel || "N/A"
                    }\n` +
                    `Does Hirer Require Vehicle Documents: Yes\n\n` +
                    `Client's Vehicle Details:\n` +
                    `Reg: ${data.registration || "N/A"}\n` +
                    `Make/Model: ${data.make || "N/A"} - ${data.model}\n` +
                    `Body Type: ${data.body_type || "N/A"}\n` +
                    `Auto: ${data.auto || "N/A"}\n` +
                    `Engine Size: ${data.engine_size || "N/A"}\n` +
                    `Fuel Type: ${data.fuel_type || "N/A"}\n` +
                    `No of Seats inc Driver: ${data.no_of_seats || "N/A"}\n\n` +
                    `If Taxi Vehicle:\n` +
                    `Borough: ${data.borough_name || "N/A"}\n` +
                    `Type of Plate: ${data.plate_type || "N/A"}\n` +
                    `Driver Base: ${data.driver_base || "N/A"}\n\n` +
                    `Hi,\n\nPlease contact the Client to arrange a hire vehicle.\n\n` +
                    `Hire needs to start on ${new Date().toLocaleDateString(
                      "en-GB"
                    )}\n\n` +
                    `We need to provide hire vehicle category XXXX.\n\n` +
                    `Regards,\nClaim Handler`;

                  openOutlookCompose(data.to, subject, body);
                  toast.success("On Hire email opened in Outlook");
                } else if (option === "Inst Fleet to Off Hire") {
                  const { data } = await sendEmails(id || claimID, "off_hire");
                  const subject =
                    "New Instruction to Fleet to Off Hire Vehicle (CIL)";
                  const body =
                    `Reference: ${data.Reference || "N/A"}\n` +
                    `Referrer: ${data.Referrer || "N/A"}\n` +
                    `Client: ${data.client_name || "N/A"}\n\n` +
                    `Hi,\nPlease contact the Client to arrange the off hire of this vehicle for ${new Date().toLocaleDateString(
                      "en-GB"
                    )}.\n\nRegards,\nClaim Handler`;
                    toast.success("Off Hire email opened in Outlook");
                  openOutlookCompose(data.to, subject, body);
                } else if (option === "Hire Vehicle Check Sheet") {
                  const res = await downloadCheckSheet(id || claimID);
                  const blob = new Blob([res.data], {
                    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                  });
                  const link = document.createElement("a");
                  link.href = URL.createObjectURL(blob);
                  link.download = "Hire_Vehicle_Check_Sheet.xlsx";
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  URL.revokeObjectURL(link.href);
                  toast.success("Hire Vehicle Check Sheet downloaded successfully"); 
                } else if (option === "Recovery & Storage") {
                  const res = await downloadStorageRecovery(id || claimID);
                  const blob = new Blob([res.data], {
                    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                  });
                  const link = document.createElement("a");
                  link.href = URL.createObjectURL(blob);
                  link.download = "Recovery_And_Storage.xlsx";
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  URL.revokeObjectURL(link.href);
                  toast.success("Recovery & Storage document downloaded successfully");
                } else if (option === "Mitigation Questionnaire") {
                  const res = await downloadMitigationQuestionnaire(
                    id || claimID
                  );
                  const blob = new Blob([res.data], {
                    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                  });
                  const link = document.createElement("a");
                  link.href = URL.createObjectURL(blob);
                  link.download = "Mitigation_Questionnaire.xlsx";
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  URL.revokeObjectURL(link.href);
                  toast.success("Mitigation Questionnaire downloaded successfully"); 
                } else if (option === "Hire Documentation") {
                  const res = await downloadHireDocumentationAgreement(
                    id || claimID
                  );
                  const blob = new Blob([res.data], {
                    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                  });
                  const link = document.createElement("a");
                  link.href = URL.createObjectURL(blob);
                  link.download = "Hire_Documentation_Agreement.xlsx";
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  URL.revokeObjectURL(link.href);
                  toast.success("Hire Documentation Agreement downloaded successfully"); 
                } else if (option === "Fee Exemption Form") {
                  const res = await downloadFeeExemption(id || claimID);
                  const blob = new Blob([res.data], {
                    type: "application/pdf",
                  });
                  const link = document.createElement("a");
                  link.href = URL.createObjectURL(blob);
                  link.download = "Fee_Exemption_Form.pdf";
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  URL.revokeObjectURL(link.href);
                  toast.success(`${option} downloaded successfully`);
                } else {
                  console.log("No match found for", option);
                  toast.warning(`Action "${option}" is not implemented yet`); 
                }
              } catch (e) {
                console.error("Unable to send email / open compose:", e);
                toast.error(`Failed to process "${option}" action`);              }
            };

            const handleSelect = (company: any) => {
              const newValues = {
                company_name: company.company_name || "",
                address: {
                  address: company.address || "",
                  postcode: company.postcode || "",
                  mobile_tel: company.contact_number || "",
                  email: company.contact_email || "",
                },
              };

              Object.entries(newValues).forEach(([key, value]) => {
                if (key === "address" && typeof value === "object") {
                  Object.entries(value as Record<string, any>).forEach(
                    ([subKey, subValue]) => {
                      setFieldValue(`address.${subKey}`, subValue);
                    }
                  );
                } else {
                  setFieldValue(key, value);
                }
              });

              setInitialValues((prev: any) => ({
                ...prev,
                company_name: company.company_name,
                address: newValues.address,
              }));
              setSuggestions([]);
              setTyping(false);
            };

            const handleDeleteTab = async (indexToRemove: number) => {
              const vehicleToDelete = values.hireVehicle[indexToRemove];

              if (vehicleToDelete?.id) {
                try {
                  await deactivateVehicle(vehicleToDelete.id);
                  toast.success("Vehicle deactivated successfully");
                } catch (error: any) {
                  if (
                    error.response?.data?.detail ===
                    "Hire vehicle record not found"
                  ) {
                    console.warn(
                      "Vehicle not found in backend, removing from UI only"
                    );
                  } else {
                    console.error("Failed to deactivate vehicle:", error);
                    toast.error("Failed to deactivate vehicle");
                    return;
                  }
                }
              }

              const updatedVehicles = values.hireVehicle.filter(
                (_: any, i: number) => i !== indexToRemove
              );

              // Update Formik state
              setFieldValue("hireVehicle", updatedVehicles);

              // Remove from tableData
              const vehicleIdToRemove =
                vehicleToDelete?.id || `tab-${indexToRemove}`;
              setTableData((prevTableData) =>
                prevTableData.filter((vehicle) => {
                  // Remove by ID if it matches
                  if (vehicle.id === vehicleIdToRemove) {
                    return false;
                  }
                  return true;
                })
              );

              if (activeTab === indexToRemove) {
                setActiveTab(Math.max(0, indexToRemove - 1));
              } else if (activeTab > indexToRemove) {
                setActiveTab(activeTab - 1);
              }
            };

            const handleProvisionItems = async (item: any, push: any) => {
              if (item.label === "On Hire Vehicle") {
                const formattedDate = localTodayStr();
                const calendarDate = parseCalendarDate(formattedDate);
                setFieldValue(
                  `hireVehicle.${activeTab}.hire_start_date`,
                  calendarDate
                );
                setShowEndHireTabs((prev: any) => ({
                  ...prev,
                  [activeTab]: false,
                }));
                setFieldValue(`hireVehicle.${activeTab}.hire_end_date`, null);

                const onHireOpt = vehicleStatus.find(
                  (opt: any) =>
                    opt.label?.toLowerCase() === "on hire" ||
                    opt.value === "on_hire"
                );
                if (onHireOpt) {
                  setFieldValue(
                    `hireVehicle.${activeTab}.hire_vehicle_status_id`,
                    onHireOpt.value
                  );
                }
              } else if (item.label === "Switch Vehicle – On Hire New") {
                const formattedDate = localTodayStr();
                const calendarDate = parseCalendarDate(formattedDate);

                // Set switch vehicle flag for backend
                setSwitchVehicle(true);

                // 1. KEEP current vehicle's hire end date as null (no change)
                // 2. KEEP current vehicle's status as is (not changing to "Off Hire")

                // 3. Create new vehicle entry with "On Hire" status
                push({
                  cross_hired: false,
                  hire_vehicle_status_id: "", // Will be set to "On Hire" below
                  hire_vehicle_registration: "",
                  make: "",
                  model: "",
                  hire_start_date: calendarDate, // Start date = today
                  hire_end_date: null, // No end date for new vehicle
                  fuel_type: "",
                  plate_transfer: false,
                });

                // Set the new vehicle's status to "On Hire"
                const onHireOpt = vehicleStatus.find(
                  (opt: any) =>
                    opt.label?.toLowerCase() === "on hire" ||
                    opt.value === "on_hire"
                );

                // Update the NEW vehicle's status (the one we just added)
                if (onHireOpt) {
                  // The new vehicle is at index: values.hireVehicle.length (before push)
                  // After push, it's at index: values.hireVehicle.length - 1
                  const newVehicleIndex = values.hireVehicle.length; // Because we haven't updated the form yet

                  // We need to update after a small delay to ensure the new field exists
                  setTimeout(() => {
                    setFieldValue(
                      `hireVehicle.${newVehicleIndex}.hire_vehicle_status_id`,
                      onHireOpt.value
                    );
                  }, 0);
                }

                // 4. Switch to new vehicle tab
                setActiveTab(values.hireVehicle.length);
              } else if (item.label === "Off Hire Vehicle") {
                setShowEndHireTabs((prev: any) => ({
                  ...prev,
                  [activeTab]: true,
                }));
                const formattedDate = localTodayStr();
                const calendarDate = parseCalendarDate(formattedDate);
                setFieldValue(
                  `hireVehicle.${activeTab}.hire_end_date`,
                  calendarDate
                );

                const offHireOpt = vehicleStatus.find(
                  (opt: any) =>
                    opt.label?.toLowerCase() === "off hire" ||
                    opt.value === "off_hire"
                );
                if (offHireOpt) {
                  setFieldValue(
                    `hireVehicle.${activeTab}.hire_vehicle_status_id`,
                    offHireOpt.value
                  );
                }

                const specificVehicle = values.hireVehicle?.[activeTab];
                if (specificVehicle?.id) {
                  try {
                    await handleViewCharges(specificVehicle);
                    setOffHireModal(true);
                    setVehicleForModal(specificVehicle);
                  } catch (error) {
                    console.error("Error fetching driver charges:", error);
                    setOffHireModal(true);
                    setVehicleForModal(specificVehicle);
                  }
                } else {
                  setOffHireModal(true);
                  setVehicleForModal(specificVehicle);
                }
              } else if (item.label === "Switch Vehicle – Off Hire Old") {
                setShowEndHireTabs((prev: any) => ({
                  ...prev,
                  [activeTab]: true,
                }));
                const formattedDate = localTodayStr();
                const calendarDate = parseCalendarDate(formattedDate);
                setFieldValue(
                  `hireVehicle.${activeTab}.hire_end_date`,
                  calendarDate
                );
                setSwitchVehicle(true);

                const offHireOpt = vehicleStatus.find(
                  (opt: any) =>
                    opt.label?.toLowerCase() === "off hire" ||
                    opt.value === "off_hire"
                );
                if (offHireOpt) {
                  setFieldValue(
                    `hireVehicle.${activeTab}.hire_vehicle_status_id`,
                    offHireOpt.value
                  );
                }

                const specificVehicle = values.hireVehicle?.[activeTab];
                if (specificVehicle?.id) {
                  try {
                    await handleViewCharges(specificVehicle);
                    setOffHireModal(true);
                    setVehicleForModal(specificVehicle);
                  } catch (error) {
                    console.error("Error fetching driver charges:", error);
                    setOffHireModal(true);
                    setVehicleForModal(specificVehicle);
                  }
                } else {
                  setOffHireModal(true);
                  setVehicleForModal(specificVehicle);
                }
              }
            };

            return (
              <div>
                <div className="border-b border-cloudGray mb-5 mt-4">
                  <div className="flex justify-between">
                    <div>
                      <h2 className="text-lg font-weight-600  mb-2 sm:text-xl">
                        Credit Hire Documentation & Instructions
                      </h2>
                      <p className="pb-5 text-lightGray text-sm font-normal"></p>
                    </div>
                    <div>
                      <HireVehicleEmailActions
                        handleQuestionnaireSend={handleQuestionnaireSend}
                        values={values}
                      />
                    </div>
                  </div>
                </div>

                <FieldArray name="hireVehicle">
                  {({ push }) => (
                    <div>
                      <div className="flex gap-5 border-b border-cloudGray py-5 mb-5">
                        {values?.hireVehicle?.map((_: any, index: number) => (
                          <div key={index} className="flex items-center gap-2">
                            <p
                              className={`
                                text-sm cursor-pointer underline decoration-2 underline-offset-[24px]
                                ${
                                  activeTab === index
                                    ? "text-custom decoration-custom"
                                    : "text-stormGray decoration-transparent"
                                }
                              `}
                              onClick={() => setActiveTab(index)}
                            >
                              {values.hireVehicle.length === 1 ? (
                                <>
                                  Vehicle{" "}
                                  <span className="font-weight-600">
                                    {values.hireVehicle?.[index]
                                      ?.hire_vehicle_registration || ""}
                                  </span>
                                </>
                              ) : (
                                <>
                                  Vehicle{" "}
                                  <span className="font-weight-600">
                                    {values.hireVehicle?.[index]
                                      ?.hire_vehicle_registration || index + 1}
                                  </span>
                                </>
                              )}
                            </p>

                            {values?.hireVehicle?.length > 1 && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedVehicle(index);
                                  setConfirmationOpen(true);
                                }}
                                className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                                title="Remove vehicle"
                              >
                                ✕
                              </button>
                            )}
                          </div>
                        ))}
                      </div>

                      {values?.hireVehicle?.[activeTab] && (
                        <div>
                          <div className="flex justify-between border-b border-cloudGray mb-5">
                            <div>
                              <h2 className="text-secondary text-lg font-weight-600">
                                Vehicle Category
                              </h2>
                              <p className="pb-5 text-lightGray text-sm font-normal">
                                Enter details for Vehicle Category
                              </p>
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-4">
                            <div className="col-span-3 lg:col-span-1">
                              <Label
                                htmlFor={`hireVehicle.${activeTab}.client_vehicle_category_id`}
                              >
                                Client Vehicle Category
                              </Label>
                            </div>
                            <div className="col-span-3 lg:col-span-2">
                              <Field
                                name={`hireVehicle.${activeTab}.client_vehicle_category_id`}
                              >
                                {({ form }: any) => {
                                  const options = clientVehicleCategory.map(
                                    (c: any) => ({
                                      value: c.id,
                                      label: formatVehicleCategoryLabel(
                                        c.label
                                      ),
                                    })
                                  );
                                  const selectedValue =
                                    form.values.hireVehicle[activeTab]
                                      ?.client_vehicle_category_id;
                                  const value = selectedValue
                                    ? {
                                        value: selectedValue,
                                        label:
                                          form.values.hireVehicle[activeTab]
                                            .client_vehicle_category_label ||
                                          options.find(
                                            (o) => o.value === selectedValue
                                          )?.label ||
                                          "",
                                      }
                                    : null;
                                  return (
                                    <CustomSelect
                                      key={`client-category-${activeTab}`}
                                      options={options}
                                      value={value}
                                      onChange={(option: any) => {
                                        if (option) {
                                          form.setFieldValue(
                                            `hireVehicle.${activeTab}.client_vehicle_category_id`,
                                            option.value
                                          );
                                          form.setFieldValue(
                                            `hireVehicle.${activeTab}.client_vehicle_category_label`,
                                            option.label
                                          );
                                          const selectedCompany =
                                            clientVehicleCategory.find(
                                              (c: any) => c.id === option.value
                                            );
                                          if (selectedCompany) {
                                            handleSelectCategory(
                                              selectedCompany,
                                              activeTab,
                                              "client"
                                            );
                                          }
                                        } else {
                                          form.setFieldValue(
                                            `hireVehicle.${activeTab}.client_vehicle_category_id`,
                                            ""
                                          );
                                          form.setFieldValue(
                                            `hireVehicle.${activeTab}.client_vehicle_category_label`,
                                            ""
                                          );
                                        }
                                      }}
                                      placeholder="Type client vehicle category"
                                    />
                                  );
                                }}
                              </Field>
                            </div>

                            <div className="col-span-3 lg:col-span-1">
                              <Label
                                htmlFor={`hireVehicle.${activeTab}.actual_vehicle_category_id`}
                              >
                                Actual Vehicle Category
                              </Label>
                            </div>
                            <div className="col-span-3 lg:col-span-2">
                              <Field
                                name={`hireVehicle.${activeTab}.actual_vehicle_category_id`}
                              >
                                {({ form }: any) => {
                                  const options = actualVehicleCategory.map(
                                    (c: any) => ({
                                      value: c.id,
                                      label: formatVehicleCategoryLabel(
                                        c.label
                                      ),
                                    })
                                  );
                                  const selectedValue =
                                    form.values.hireVehicle[activeTab]
                                      ?.actual_vehicle_category_id;
                                  const value = selectedValue
                                    ? {
                                        value: selectedValue,
                                        label:
                                          form.values.hireVehicle[activeTab]
                                            .actual_vehicle_category_label ||
                                          options.find(
                                            (o) => o.value === selectedValue
                                          )?.label ||
                                          "",
                                      }
                                    : null;
                                  return (
                                    <CustomSelect
                                      key={`actual-category-${activeTab}`}
                                      options={options}
                                      value={value}
                                      onInputChange={(inputValue: string) => {
                                        if (inputValue)
                                          fetchActualVehicleCategory(
                                            inputValue
                                          );
                                      }}
                                      onChange={(option: any) => {
                                        if (option) {
                                          form.setFieldValue(
                                            `hireVehicle.${activeTab}.actual_vehicle_category_id`,
                                            option.value
                                          );
                                          form.setFieldValue(
                                            `hireVehicle.${activeTab}.actual_vehicle_category_label`,
                                            option.label
                                          );
                                          const selectedCompany =
                                            actualVehicleCategory.find(
                                              (c: any) => c.id === option.value
                                            );
                                          if (selectedCompany) {
                                            handleSelectCategory(
                                              selectedCompany,
                                              activeTab,
                                              "actual"
                                            );
                                          }
                                        } else {
                                          form.setFieldValue(
                                            `hireVehicle.${activeTab}.actual_vehicle_category_id`,
                                            ""
                                          );
                                          form.setFieldValue(
                                            `hireVehicle.${activeTab}.actual_vehicle_category_label`,
                                            ""
                                          );
                                        }
                                      }}
                                      placeholder="Type actual vehicle category"
                                    />
                                  );
                                }}
                              </Field>
                            </div>
                          </div>
                        </div>
                      )}

                      <hr className="mt-8 mb-8" />

                      <div className="border-b border-cloudGray mb-5 flex justify-between">
                        <div>
                          <h2 className="text-secondary text-lg font-weight-600">
                            Hire Vehicle Provision
                          </h2>
                          <p className="pb-5 text-lightGray text-sm font-normal">
                            Enter details for Hire Vehicle Provision Details
                          </p>
                        </div>
                        <Dropdown.Root>
                          <>
                            <Dropdown.DotsButton />
                            <Dropdown.Popover>
                              <Dropdown.Menu>
                                <Dropdown.Section>
                                  {items.map((item) => (
                                    <Dropdown.Item
                                      key={item.label}
                                      onAction={() =>
                                        handleProvisionItems(item, push)
                                      }
                                      className={(state) =>
                                        [
                                          "flex items-start gap-2 transition-colors duration-150 rounded-md px-2 py-2",
                                          state.isFocused ? "bg-gray-100" : "",
                                          "hover:bg-gray-100 cursor-pointer",
                                        ].join(" ")
                                      }
                                    >
                                      <div className="flex items-start gap-2">
                                        <div className="flex flex-col">
                                          <span className="text-sm font-medium text-gray-800">
                                            {item.label}
                                          </span>
                                        </div>
                                      </div>
                                    </Dropdown.Item>
                                  ))}
                                </Dropdown.Section>
                              </Dropdown.Menu>
                            </Dropdown.Popover>
                          </>
                        </Dropdown.Root>
                      </div>

                      {values.hireVehicle?.[activeTab] && (
                        <form className="space-y-4">
                          <div className="mt-8 border-t border-cloudGray" />

                          <div
                            className={`flex justify-end gap-1 text-xs text-custom ${
                              !values.hireVehicle?.[activeTab]
                                ?.hire_vehicle_registration
                                ? "hover:cursor-not-allowed"
                                : "cursor-pointer hover:underline"
                            }`}
                            onClick={() => {
                              if (
                                !values.hireVehicle?.[activeTab]
                                  ?.hire_vehicle_registration
                              )
                                return;
                              handleViewCharges(values?.hireVehicle[activeTab]);
                            }}
                          >
                            <p className="text-sm">View driver charges</p>
                            <TopRightIcon />
                          </div>

                          <div className="grid grid-cols-3 gap-4">
                            <div className="col-span-3 lg:col-span-1">
                              <Label
                                htmlFor={`hireVehicle.${activeTab}.cross_hired`}
                              >
                                Has this Hire Vehicle been Cross-Hired to us?
                              </Label>
                            </div>
                            <div className="col-span-3 lg:col-span-2">
                              <Field
                                name={`hireVehicle.${activeTab}.cross_hired`}
                              >
                                {({ form, meta }: any) => {
                                  const crossHiredOptions = [
                                    { value: false, label: "No" },
                                    { value: true, label: "Yes" },
                                  ];
                                  return (
                                    <div className="w-full">
                                      <CustomSelect
                                        options={crossHiredOptions}
                                        value={
                                          crossHiredOptions.find(
                                            (opt) =>
                                              opt.value ===
                                              form.values.hireVehicle?.[
                                                activeTab
                                              ]?.cross_hired
                                          ) || null
                                        }
                                        onChange={(option: any) =>
                                          form.setFieldValue(
                                            `hireVehicle.${activeTab}.cross_hired`,
                                            option?.value ?? false
                                          )
                                        }
                                        placeholder="Select option"
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
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-4">
                            <div className="col-span-3 lg:col-span-1">
                              <Label
                                htmlFor={`hireVehicle.${activeTab}.hire_vehicle_status_id`}
                              >
                                Hire Vehicle Status
                              </Label>
                            </div>
                            <div className="col-span-3 lg:col-span-2">
                              <Field
                                name={`hireVehicle.${activeTab}.hire_vehicle_status_id`}
                              >
                                {({ form }: any) => (
                                  <>
                                    <CustomSelect
                                      key={`hireVehicle.${activeTab}.hire_vehicle_status_id`}
                                      options={vehicleStatus}
                                      value={
                                        vehicleStatus.find(
                                          (opt: any) =>
                                            opt.value ===
                                            form.values.hireVehicle[activeTab]
                                              ?.hire_vehicle_status_id
                                        ) || null
                                      }
                                      onChange={(option: any) => {
                                        if (option) {
                                          form.setFieldValue(
                                            `hireVehicle.${activeTab}.hire_vehicle_status_id`,
                                            option.value
                                          );
                                          const selectedCompany =
                                            hireVehicleStatus.find(
                                              (c: any) => c.id === option.value
                                            );
                                          if (selectedCompany)
                                            handleSelect(selectedCompany);
                                        } else {
                                          form.setFieldValue(
                                            `hireVehicle.${activeTab}.hire_vehicle_status_id`,
                                            ""
                                          );
                                        }
                                      }}
                                      placeholder="Type hire vehicle status"
                                    />
                                    {hireVehicleStatusLoading && (
                                      <div className="absolute right-3 top-2 text-gray-400 text-sm">
                                        Loading...
                                      </div>
                                    )}
                                  </>
                                )}
                              </Field>
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-4">
                            <div className="col-span-3 lg:col-span-1">
                              <Label
                                htmlFor={`hireVehicle.${activeTab}.hire_vehicle_registration`}
                              >
                                Hire Vehicle Registration
                              </Label>
                            </div>
                            <div className="col-span-3 lg:col-span-2">
                              <Field
                                name={`hireVehicle.${activeTab}.hire_vehicle_registration`}
                              >
                                {({ field, form }: any) => (
                                  <input
                                    {...field}
                                    type="text"
                                    style={{ height: "44px" }}
                                    className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg bg-white hover:border-gray-400 focus:outline-none  text-sm sm:text-base"
                                    onChange={(e) => {
                                      const newValue = e.target.value;
                                      form.setFieldValue(field.name, newValue);
                                    }}
                                  />
                                )}
                              </Field>
                              <ErrorMessage
                                name={`hireVehicle.${activeTab}.hire_vehicle_registration`}
                                component="div"
                                className="text-red-500 text-xs mt-1"
                              />
                            </div>
                          </div>

                          {values?.hireVehicle?.[activeTab]?.cross_hired && (
                            <>
                              <div className="grid grid-cols-3 gap-4">
                                <div className="col-span-3 lg:col-span-1">
                                  <Label
                                    htmlFor={`hireVehicle.${activeTab}.provider_name`}
                                  >
                                    Provider Name
                                  </Label>
                                </div>
                                <div className="col-span-3 lg:col-span-2">
                                  <Field
                                    name={`hireVehicle.${activeTab}.provider_name`}
                                    type="text"
                                    style={{ height: "44px" }}
                                    className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg bg-white hover:border-gray-400 focus:outline-none  text-sm sm:text-base"
                                  />
                                  <ErrorMessage
                                    name={`hireVehicle.${activeTab}.provider_name`}
                                    component="div"
                                    className="text-red-500 text-xs mt-1"
                                  />
                                </div>

                                <div className="col-span-3 lg:col-span-1">
                                  <Label
                                    htmlFor={`hireVehicle.${activeTab}.rate`}
                                  >
                                    Rate
                                  </Label>
                                </div>
                                <div className="col-span-3 lg:col-span-2">
                                  <div className="flex flex-1 border border-gray-300 rounded-lg bg-white h-10 sm:h-12">
                                    <div className="flex items-center px-2 sm:px-3 rounded-lg">
                                      <span className="text-sm sm:text-base">
                                        £
                                      </span>
                                    </div>
                                    <Field
                                      name={`hireVehicle.${activeTab}.rate`}
                                    >
                                      {({ field, form }: any) => (
                                        <input
                                          {...field}
                                          type="number"
                                          step="0.01"
                                          min="0"
                                          placeholder="0.00"
                                          value={field.value ?? ""}
                                          style={{ height: "44px" }}
                                          className="flex-1 py-2 sm:py-3 text-sm sm:text-base focus:outline-none border-none"
                                          onKeyPress={(e) => {
                                            if (!/[0-9.]/.test(e.key)) {
                                              e.preventDefault();
                                            }
                                            if (
                                              e.key === "." &&
                                              e.target.value.includes(".")
                                            ) {
                                              e.preventDefault();
                                            }
                                          }}
                                          onChange={(e) => {
                                            const value = e.target.value;
                                            // Allow empty string for clearing
                                            if (value === "") {
                                              form.setFieldValue(
                                                field.name,
                                                null
                                              );
                                              return;
                                            }
                                            // Only allow numbers and one decimal point
                                            const validValue = value
                                              .replace(/[^0-9.]/g, "")
                                              .replace(/(\..*)\./g, "$1");
                                            
                                            // Ensure it's a valid number
                                            if (!isNaN(parseFloat(validValue)) && isFinite(validValue)) {
                                              form.setFieldValue(
                                                field.name,
                                                validValue
                                              );
                                            }
                                          }}
                                          onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
                                            if (field.value) {
                                              const formatted = formatToTwoDecimals(
                                                field.value
                                              );
                                              form.setFieldValue(
                                                field.name,
                                                formatted
                                              );
                                            }
                                          }}
                                        />
                                      )}
                                    </Field>
                                  </div>
                                  <ErrorMessage
                                    name={`hireVehicle.${activeTab}.rate`}
                                    component="div"
                                    className="text-red-500 text-xs mt-1"
                                  />
                                </div>

                                <div className="col-span-3 lg:col-span-1">
                                  <Label
                                    htmlFor={`hireVehicle.${activeTab}.contact_number`}
                                  >
                                    Contact Number
                                  </Label>
                                </div>
                                <div className="col-span-3 lg:col-span-2">
                                  <PhoneInput
                                    country={"gb"}
                                    placeholder="+44"
                                    onChange={(phone: string) =>
                                      setFieldValue(
                                        `hireVehicle.${activeTab}.contact_number`,
                                        phone
                                      )
                                    }
                                    inputStyle={{ fontSize: "16px" }}
                                    inputClass="!w-full !h-11 !text-sm !rounded-lg !border-gray-300 focus:!border-custom-400 focus:!shadow focus:!shadow-gray-100 disabled:!bg-gray-100 disabled:!cursor-not-allowed"
                                    buttonClass="!h-11 !border-gray-300 disabled:!bg-gray-100"
                                  />
                                  <ErrorMessage
                                    name={`hireVehicle.${activeTab}.contact_number`}
                                    component="div"
                                    className="text-red-500 text-xs mt-1"
                                  />
                                </div>
                              </div>
                            </>
                          )}

                          <div className="grid grid-cols-3 gap-4">
                            <div className="col-span-3 lg:col-span-1">
                              <Label htmlFor={`hireVehicle.${activeTab}.make`}>
                                Make
                              </Label>
                            </div>
                            <div className="col-span-3 lg:col-span-2">
                              <Field name={`hireVehicle.${activeTab}.make`}>
                                {({ field, form }: any) => (
                                  <input
                                    {...field}
                                    type="text"
                                    onChange={(e) => {
                                      form.setFieldValue(
                                        field.name,
                                        e.target.value
                                      );
                                    }}
                                    className="w-full p-2 border rounded-lg focus:outline-none"
                                  />
                                )}
                              </Field>
                              <ErrorMessage
                                name={`hireVehicle.${activeTab}.make`}
                                component="div"
                                className="text-red-500 text-xs mt-1"
                              />
                            </div>

                            <div className="col-span-3 lg:col-span-1">
                              <Label htmlFor={`hireVehicle.${activeTab}.model`}>
                                Model
                              </Label>
                            </div>
                            <div className="col-span-3 lg:col-span-2">
                              <Field name={`hireVehicle.${activeTab}.model`}>
                                {({ field, form }: any) => (
                                  <input
                                    {...field}
                                    type="text"
                                    style={{ height: "44px" }}
                                    className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg bg-white hover:border-gray-400 focus:outline-none  text-sm sm:text-base"
                                    onChange={(e) => {
                                      form.setFieldValue(
                                        field.name,
                                        e.target.value
                                      );
                                    }}
                                  />
                                )}
                              </Field>
                              <ErrorMessage
                                name={`hireVehicle.${activeTab}.model`}
                                component="div"
                                className="text-red-500 text-xs mt-1"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-4">
                            <div className="col-span-3 lg:col-span-1">
                              <Label
                                htmlFor={`hireVehicle.${activeTab}.hire_start_date`}
                              >
                                Hire Start Date
                              </Label>
                            </div>
                            <div className="col-span-3 lg:col-span-2">
                              <Field
                                name={`hireVehicle.${activeTab}.hire_start_date`}
                              >
                                {({ form }: any) => {
                                  const selectedDate =
                                    form.values.hireVehicle[activeTab]
                                      ?.hire_start_date;
                                  const localTime =
                                    new Date().toLocaleTimeString([], {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    });
                                  return (
                                    <>
                                      <DatePicker
                                        value={selectedDate}
                                        onChange={(newDate: any) => {
                                          form.setFieldValue(
                                            `hireVehicle.${activeTab}.hire_start_date`,
                                            newDate
                                          );
                                        }}
                                        className="w-full focus:outline-none"
                                      />
                                      {selectedDate && (
                                        <p className="text-sm text-gray-600 mt-1">
                                          <span className="font-medium">
                                            Captured at: {localTime}
                                          </span>
                                        </p>
                                      )}
                                    </>
                                  );
                                }}
                              </Field>
                            </div>

                            {showEndHireTabs?.[activeTab] && (
                              <>
                                <div className="col-span-3 lg:col-span-1">
                                  <Label
                                    htmlFor={`hireVehicle.${activeTab}.hire_end_date`}
                                  >
                                    Hire End Date
                                  </Label>
                                </div>
                                <div className="col-span-3 lg:col-span-2">
                                  <Field
                                    name={`hireVehicle.${activeTab}.hire_end_date`}
                                  >
                                    {({ form }: any) => {
                                      const selectedDate =
                                        form.values.hireVehicle[activeTab]
                                          ?.hire_end_date;
                                      const currentTime =
                                        new Date().toLocaleTimeString([], {
                                          hour: "2-digit",
                                          minute: "2-digit",
                                        });
                                      return (
                                        <>
                                          <DatePicker
                                            value={selectedDate}
                                            onChange={(newDate: any) => {
                                              form.setFieldValue(
                                                `hireVehicle.${activeTab}.hire_end_date`,
                                                newDate
                                              );
                                            }}
                                            className="w-full"
                                          />
                                          {selectedDate && (
                                            <p className="text-sm text-gray-600 mt-1">
                                              <span className="font-medium">
                                                Captured at: {currentTime}
                                              </span>
                                            </p>
                                          )}
                                        </>
                                      );
                                    }}
                                  </Field>
                                </div>
                              </>
                            )}
                          </div>

                          <div className="grid grid-cols-3 gap-4">
                            <div className="col-span-3 lg:col-span-1">
                              <Label
                                htmlFor={`hireVehicle.${activeTab}.fuel_type`}
                              >
                                Fuel Type
                              </Label>
                            </div>
                            <div className="col-span-3 lg:col-span-2">
                              <Field
                                name={`hireVehicle.${activeTab}.fuel_type`}
                                type="text"
                                style={{ height: "44px" }}
                                className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg bg-white hover:border-gray-400 focus:outline-none  text-sm sm:text-base"
                              />
                              <ErrorMessage
                                name={`hireVehicle.${activeTab}.fuel_type`}
                                component="div"
                                className="text-red-500 text-xs mt-1"
                              />
                            </div>

                            <div className="col-span-3 lg:col-span-1">
                              <Label
                                htmlFor={`hireVehicle.${activeTab}.plate_transfer`}
                              >
                                Plate Transfer
                              </Label>
                            </div>
                            <div className="col-span-3 justify-between lg:col-span-2 lg:flex">
                              <Label className="flex items-center">
                                <Field
                                  type="checkbox"
                                  name={`hireVehicle.${activeTab}.plate_transfer`}
                                  className="w-4 h-4 accent-[#00249c] border-gray-300 focus:ring-custom-500"
                                />
                                <span className="ml-2 text-sm text-gray-700">
                                  Yes
                                </span>
                              </Label>
                            </div>
                          </div>

                          <div className="mt-8 border-t border-cloudGray" />
                        </form>
                      )}
                    </div>
                  )}
                </FieldArray>

                <div className="mt-8">
                  <h3 className="text-lg font-weight-600 text-gray-900 mb-4">
                    Hire Vehicle Provision Log
                  </h3>
                  <TableCard.Root
                    size="sm"
                    className="border border-gray-200 rounded-lg overflow-hidden"
                  >
                    <Table aria-label="Vehicle Details">
                      <React.Fragment>
                        <Table.Header className="bg-gray-100 text-gray-700">
                          <Table.Head
                            id="registration"
                            label="Registration"
                            isRowHeader
                          />
                          <Table.Head id="make" label="Make" />
                          <Table.Head id="model" label="Model" />
                          <Table.Head id="hire_start" label="Hire Start" />
                          <Table.Head id="hire_end" label="Hire End" />
                        </Table.Header>

                        <Table.Body items={uniqueTableData}>
                          {(vehicle: any) => (
                            <Table.Row
                              id={
                                vehicle.id?.toString() ||
                                Math.random().toString()
                              }
                              key={vehicle.id || Math.random().toString()}
                              className="hover:bg-gray-50 transition-colors duration-150"
                            >
                              <Table.Cell className="whitespace-nowrap text-gray-700 font-medium text-sm">
                                {vehicle.hire_vehicle_registration || "N/A"}
                              </Table.Cell>
                              <Table.Cell className="whitespace-nowrap text-gray-700 font-medium text-sm">
                                {vehicle.make || "N/A"}
                              </Table.Cell>
                              <Table.Cell className="whitespace-nowrap text-gray-700 font-medium text-sm">
                                {vehicle.model || "N/A"}
                              </Table.Cell>
                              <Table.Cell className="whitespace-nowrap text-gray-700 font-medium text-sm">
                                {vehicle.hire_start_date
                                  ? vehicle.hire_start_date.toString()
                                  : "N/A"}
                              </Table.Cell>
                              <Table.Cell className="whitespace-nowrap text-gray-700 font-medium text-sm">
                                {vehicle.hire_end_date
                                  ? vehicle.hire_end_date.toString()
                                  : "N/A"}
                              </Table.Cell>
                            </Table.Row>
                          )}
                        </Table.Body>
                      </React.Fragment>
                    </Table>
                  </TableCard.Root>
                </div>

                <Modal
                  open={confirmationOpen}
                  onClose={() => setConfirmationOpen(false)}
                  center
                  closeIcon={
                    <FaTimes
                      size={18}
                      className="text-gray-500 hover:text-gray-700"
                    />
                  }
                >
                  <div className="p-4">
                    <h2 className="text-lg font-weight-600 text-gray-800 mb-3">
                      Are you sure?
                    </h2>
                    <p className="text-sm text-gray-600 mb-6">
                      Do you really want to delete this vehicle?
                    </p>
                    <div className="flex justify-end space-x-3">
                      <button
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
                        onClick={async () => {
                          if (selectedVehicle !== null) {
                            await handleDeleteTab(selectedVehicle);
                            setConfirmationOpen(false);
                            setSelectedVehicle(null);
                          }
                        }}
                      >
                        Yes, Delete
                      </button>
                      <button
                        className="px-4 py-2 bg-white text-gray-800 border rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 transition-colors"
                        onClick={() => setConfirmationOpen(false)}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </Modal>
              </div>
            );
          }}
        </Formik>

        <Modal
          open={offHireModal}
          onClose={() => setOffHireModal(false)}
          classNames={{ overlay: "custom-overlay", modal: "custom-modal" }}
          closeIcon={
            <FaTimes size={24} className="text-[#717680] font-normal w-5 h-5" />
          }
        >
          <div className="flex flex-col h-full max-h-[90vh]">
            <div className="flex-shrink-0 border-b border-cloudGray py-5 mb-5">
              <p className="text-xl font-weight-600">Vehicle Checkout</p>
            </div>

            <div className="flex-grow overflow-y-auto pr-2">
              <form className="space-y-4" onSubmit={handleCheckoutSubmit}>
                <div className="space-y-4">
                  <p className="text-lg font-weight-600">Interior (Inside)</p>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-3 lg:col-span-1">
                      <Label>Was the interior clean at check-out?</Label>
                    </div>
                    <div className="col-span-3 lg:col-span-2">
                      <CustomSelect
                        name="interiorCleanCheckOut"
                        options={[
                          { value: "Yes", label: "Yes" },
                          { value: "No", label: "No" },
                        ]}
                        value={
                          formData.interiorCleanCheckOut
                            ? {
                                value: formData.interiorCleanCheckOut,
                                label: formData.interiorCleanCheckOut,
                              }
                            : null
                        }
                        onChange={(option) => {
                          handleModalFormChange(
                            "interiorCleanCheckOut",
                            option ? option.value : ""
                          );
                        }}
                        placeholder="Select"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-3 lg:col-span-1">
                      <Label>Was the interior clean at check-in?</Label>
                    </div>
                    <div className="col-span-3 lg:col-span-2">
                      <CustomSelect
                        name="interiorCleanCheckIn"
                        options={[
                          { value: "Yes", label: "Yes" },
                          { value: "No", label: "No" },
                        ]}
                        value={
                          formData.interiorCleanCheckIn
                            ? {
                                value: formData.interiorCleanCheckIn,
                                label: formData.interiorCleanCheckIn,
                              }
                            : null
                        }
                        onChange={(option) => {
                          handleModalFormChange(
                            "interiorCleanCheckIn",
                            option ? option.value : ""
                          );
                          handleValetCharge(
                            "interiorCleanCheckIn",
                            option.value
                          );
                        }}
                        placeholder="Select"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-3 lg:col-span-1">
                      <Label>
                        Was any interior damage observed at check-in?
                      </Label>
                    </div>
                    <div className="col-span-3 lg:col-span-2">
                      <input
                        type="checkbox"
                        name="interiorDamage"
                        checked={formData.interiorDamage}
                        onChange={handleModalCheckboxChange}
                      />
                    </div>
                  </div>

                  {formData.interiorDamage && (
                    <>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="col-span-3 lg:col-span-1">
                          <Label>Describe the interior damage</Label>
                        </div>
                        <div className="col-span-3 lg:col-span-2">
                          <textarea
                            className="w-full p-2 border border-gray-300 rounded-md"
                            name="interiorDamageDescription"
                            value={formData.interiorDamageDescription}
                            onChange={(e) =>
                              handleModalFormChange(
                                "interiorDamageDescription",
                                e.target.value
                              )
                            }
                            required
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div className="col-span-3 lg:col-span-1">
                          <Label>Add interior photos (optional)</Label>
                        </div>
                        <div className="col-span-3 lg:col-span-2">
                          <div className="flex gap-3 overflow-x-auto mb-4">
                            {images.map((src, idx) => (
                              <img
                                key={idx}
                                src={src}
                                className="h-20 w-20 rounded-md object-cover hover:cursor-pointer border border-gray-200"
                              />
                            ))}

                            <button
                              type="button"
                              onClick={handleAddImage}
                              className={`flex items-center justify-center h-20 w-20 border-2 border-dashed border-gray-300 rounded-md text-3xl font-light text-gray-400 hover:border-blue-500 hover:text-blue-500`}
                            >
                              +
                            </button>
                          </div>

                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            ref={fileInputRef}
                            className="hidden"
                            onChange={handleFileChange}
                          />
                        </div>
                      </div>
                    </>
                  )}
                </div>
                <hr className="mt-4" />

                <div className="space-y-4">
                  <p className="text-lg font-weight-600">Exterior (Outside)</p>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-3 lg:col-span-1">
                      <Label>Was the exterior clean at check-out?</Label>
                    </div>
                    <div className="col-span-3 lg:col-span-2">
                      <CustomSelect
                        name="exteriorCleanCheckOut"
                        options={[
                          { value: "Yes", label: "Yes" },
                          { value: "No", label: "No" },
                        ]}
                        value={
                          formData.exteriorCleanCheckOut
                            ? {
                                value: formData.exteriorCleanCheckOut,
                                label: formData.exteriorCleanCheckOut,
                              }
                            : null
                        }
                        onChange={(option) => {
                          handleModalFormChange(
                            "exteriorCleanCheckOut",
                            option ? option.value : ""
                          );
                        }}
                        placeholder="Select"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-3 lg:col-span-1">
                      <Label>Was the exterior clean at check-in?</Label>
                    </div>
                    <div className="col-span-3 lg:col-span-2">
                      <CustomSelect
                        name="exteriorCleanCheckIn"
                        options={[
                          { value: "Yes", label: "Yes" },
                          { value: "No", label: "No" },
                        ]}
                        value={
                          formData.exteriorCleanCheckIn
                            ? {
                                value: formData.exteriorCleanCheckIn,
                                label: formData.exteriorCleanCheckIn,
                              }
                            : null
                        }
                        onChange={(option) => {
                          handleModalFormChange(
                            "exteriorCleanCheckIn",
                            option ? option.value : ""
                          );
                          handleValetCharge(
                            "exteriorCleanCheckIn",
                            option?.value
                          );
                        }}
                        placeholder="Select"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-3 lg:col-span-1">
                      <Label>
                        Was any exterior damage observed at check-in?
                      </Label>
                    </div>
                    <div className="col-span-3 lg:col-span-2">
                      <input
                        type="checkbox"
                        className="p-2 sm:p-3 border border-gray-300 rounded-lg bg-white hover:border-gray-400 focus:outline-none text-sm sm:text-base"
                        name="exteriorDamage"
                        checked={formData.exteriorDamage}
                        onChange={handleModalCheckboxChange}
                      />
                    </div>
                  </div>

                  {formData.exteriorDamage && (
                    <>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="col-span-3 lg:col-span-1">
                          <Label>Describe the exterior damage</Label>
                        </div>
                        <div className="col-span-3 lg:col-span-2">
                          <textarea
                            className="w-full p-2 border border-gray-300 rounded-md"
                            name="exteriorDamageDescription"
                            value={formData.exteriorDamageDescription}
                            onChange={(e) =>
                              handleModalFormChange(
                                "exteriorDamageDescription",
                                e.target.value
                              )
                            }
                            required
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div className="col-span-3 lg:col-span-1">
                          <Label>Add exterior photos (optional)</Label>
                        </div>
                        <div className="col-span-3 lg:col-span-2">
                          <div className="flex gap-3 overflow-x-auto mb-4">
                            {exteriorImages.map((src, idx) => (
                              <img
                                key={idx}
                                src={src}
                                className="h-20 w-20 rounded-md object-cover hover:cursor-pointer border border-gray-200"
                              />
                            ))}

                            <button
                              type="button"
                              onClick={handleAddExteriorImage}
                              className={`flex items-center justify-center h-20 w-20 border-2 border-dashed border-gray-300 rounded-md text-3xl font-light text-gray-400 hover:border-blue-500 hover:text-blue-500`}
                            >
                              +
                            </button>
                          </div>

                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            ref={fileInputExteriorRef}
                            className="hidden"
                            onChange={handleFileExteriorChange}
                          />
                        </div>
                      </div>
                    </>
                  )}
                </div>
                <hr className="mt-4" />

                <div className="space-y-4">
                  <p className="text-lg font-weight-600">Charges</p>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-3 lg:col-span-1">
                      <Label>Apply Petrol Checkout Charge?</Label>
                    </div>
                    <div className="col-span-3 lg:col-span-2">
                      <CustomSelect
                        name="petrolCheckoutCharge"
                        options={[
                          { value: "Yes", label: "Yes" },
                          { value: "No", label: "No" },
                        ]}
                        value={
                          formData.petrolCheckoutCharge
                            ? {
                                value: formData.petrolCheckoutCharge,
                                label: formData.petrolCheckoutCharge,
                              }
                            : null
                        }
                        onChange={(option) => {
                          handleModalFormChange(
                            "petrolCheckoutCharge",
                            option ? option.value : ""
                          );
                        }}
                        placeholder="Select"
                        required
                      />
                    </div>
                  </div>

                  {formData.petrolCheckoutCharge === "Yes" && (
                    <>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="col-span-3 lg:col-span-1">
                          <Label>Petrol Checkout Charges (£)</Label>
                        </div>
                        <div className="col-span-3 lg:col-span-2">
                          <div className="flex flex-1 border border-gray-300 rounded-lg bg-white h-10 sm:h-12">
                            <div className="flex items-center px-2 sm:px-3 rounded-lg">
                              <span className="text-sm sm:text-base">£</span>
                            </div>
                            <input
                              type="number"
                              step="0.01"
                              className="w-full p-2 sm:p-3 text-sm sm:text-base focus:outline-none border-none"
                              name="petrolChargeAmount"
                              value={formData.petrolChargeAmount || ""}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                handleModalFormChange(
                                  "petrolChargeAmount",
                                  e.target.value
                                )
                              }
                              onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
                                if (formData.petrolChargeAmount) {
                                  const formatted = formatToTwoDecimals(
                                    formData.petrolChargeAmount
                                  );
                                  handleModalFormChange(
                                    "petrolChargeAmount",
                                    formatted
                                  );
                                }
                              }}
                              placeholder="0.00"
                              required
                            />
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div className="col-span-3 lg:col-span-1">
                          <Label>Reason/notes</Label>
                        </div>
                        <div className="col-span-3 lg:col-span-2">
                          <input
                            type="text"
                            className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg bg-white hover:border-gray-400 focus:outline-none text-sm sm:text-base"
                            name="petrolChargeReason"
                            value={formData.petrolChargeReason}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                              handleModalFormChange(
                                "petrolChargeReason",
                                e.target.value
                              )
                            }
                          />
                        </div>
                      </div>
                    </>
                  )}

                  <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-3 lg:col-span-1">
                      <Label>Apply Damage Charges now?</Label>
                    </div>
                    <div className="col-span-3 lg:col-span-2">
                      <CustomSelect
                        name="applyDamageCharges"
                        options={[
                          { value: "Yes", label: "Yes" },
                          { value: "No", label: "No" },
                        ]}
                        value={
                          formData.applyDamageCharges
                            ? {
                                value: formData.applyDamageCharges,
                                label: formData.applyDamageCharges,
                              }
                            : null
                        }
                        onChange={(option) => {
                          handleModalFormChange(
                            "applyDamageCharges",
                            option ? option.value : ""
                          );
                        }}
                        placeholder="Select"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-3 lg:col-span-1">
                      <Label>Valet Charges (£)</Label>
                    </div>
                    <div className="col-span-3 lg:col-span-2">
                      <div className="flex flex-1 border border-gray-300 rounded-lg bg-white h-10 sm:h-12">
                        <div className="flex items-center px-2 sm:px-3 rounded-lg">
                          <span className="text-sm sm:text-base">£</span>
                        </div>
                        <input
                          name="valetCharge"
                          type="number"
                          step="0.01"
                          value={formData.valetCharge || ""}
                          className="w-full p-2 sm:p-3 text-sm sm:text-base focus:outline-none border-none"
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            handleModalFormChange("valetCharge", e.target.value)
                          }
                          onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
                            if (formData.valetCharge) {
                              const formatted = formatToTwoDecimals(
                                formData.valetCharge
                              );
                              handleModalFormChange("valetCharge", formatted);
                            }
                          }}
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                  </div>

                  {formData.applyDamageCharges === "Yes" && (
                    <>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="col-span-3 lg:col-span-1">
                          <label>Damage Charges (£)</label>
                        </div>
                        <div className="col-span-3 lg:col-span-2">
                          <div className="flex flex-1 border border-gray-300 rounded-lg bg-white h-10 sm:h-12">
                            <div className="flex items-center px-2 sm:px-3 rounded-lg">
                              <span className="text-sm sm:text-base">£</span>
                            </div>
                            <input
                              type="number"
                              step="0.01"
                              className="w-full p-2 sm:p-3 text-sm sm:text-base focus:outline-none border-none"
                              name="damageCharges"
                              value={formData.damageCharges || ""}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                handleModalFormChange(
                                  "damageCharges",
                                  e.target.value
                                )
                              }
                              onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
                                if (formData.damageCharges) {
                                  const formatted = formatToTwoDecimals(
                                    formData.damageCharges
                                  );
                                  handleModalFormChange(
                                    "damageCharges",
                                    formatted
                                  );
                                }
                              }}
                              placeholder="0.00"
                              required
                            />
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div className="col-span-3 lg:col-span-1">
                          <label>Damage Charges Paid Now (£)</label>
                        </div>
                        <div className="col-span-3 lg:col-span-2">
                          <div className="flex flex-1 border border-gray-300 rounded-lg bg-white h-10 sm:h-12">
                            <div className="flex items-center px-2 sm:px-3 rounded-lg">
                              <span className="text-sm sm:text-base">£</span>
                            </div>
                            <input
                              type="number"
                              step="0.01"
                              className="w-full p-2 sm:p-3 text-sm sm:text-base focus:outline-none border-none"
                              name="damageChargesPaidNow"
                              value={formData.damageChargesPaidNow || ""}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                handleModalFormChange(
                                  "damageChargesPaidNow",
                                  e.target.value
                                )
                              }
                              onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
                                if (formData.damageChargesPaidNow) {
                                  const formatted = formatToTwoDecimals(
                                    formData.damageChargesPaidNow
                                  );
                                  handleModalFormChange(
                                    "damageChargesPaidNow",
                                    formatted
                                  );
                                }
                              }}
                              placeholder="0.00"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div className="col-span-3 lg:col-span-1">
                          <Label>Notes</Label>
                        </div>
                        <div className="col-span-3 lg:col-span-2">
                          <input
                            type="text"
                            className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg bg-white hover:border-gray-400 focus:outline-none text-sm sm:text-base"
                            name="damageNotes"
                            value={formData.damageNotes}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                              handleModalFormChange(
                                "damageNotes",
                                e.target.value
                              )
                            }
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {formData.applyDamageCharges === "No" &&
                    (formData.interiorDamage || formData.exteriorDamage) && (
                      <div className="text-sm text-gray-500 mt-2">
                        Damage recorded. You can add charges later in Driver
                        Checkout Charges.
                      </div>
                    )}
                </div>

                <div className="flex justify-between mt-5 pb-4">
                  <button
                    type="submit"
                    className="text-white bg-custom hover:bg-[#252B37] px-3 sm:px-4 py-1 sm:py-2 rounded-lg transition-colors"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setOffHireModal(false)}
                    className="px-4 py-2 bg-gray-300 text-black rounded-lg"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </Modal>
      </div>
    );
  }
);

HireVehicleProvided.displayName = "HireVehicleProvided";

export default HireVehicleProvided;