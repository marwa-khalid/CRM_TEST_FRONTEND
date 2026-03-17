import { useEffect, useRef, useState } from "react";
import { useFormik } from "formik";
import { toast } from "react-toastify";
import LeafletAutocompleteMap from "../../../components/GoogleMapAutoComplete/GoogleMapAutoComplete";
import { CustomDatePicker } from "../Components/DatePicker";
import { getCompanySuggestions } from "../../../services/Referrer/Referrer";
import {
  getVehicleOwner,
  updateVehicleOwner,
} from "../../../services/VehicleOwner/vehicleOwner"; // For two-way sync
import { cleanPayload } from "./ClientDetailsForm";
// Icons
import Vector6 from "../../../assets/AutoClaim_icon/Vector-6.svg";
import { createPanelSolicitors, getPanelSolicitorDetails, updatePanelSolicitors } from "../../../services/PanelSolicitorDetails/PanelSolicitorDetails";

export const DriverCheckoutForm = ({ formRef }: any) => {
  const claimId = localStorage.getItem("claimId");
  const panelId = localStorage.getItem("panelId");
  const [companies, setCompanies] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const response = await getCompanySuggestions(searchTerm); // Replace with your API endpoint

        console.log(response);
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
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      )
        setShowPicker(false);
    };
    // document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  const formik = useFormik({
    initialValues: {
      company_name: "",
      reference: "",
      recommendation_sent: "",
      note: "",
      claim_id: parseInt(claimId) || 0,
      email_sent_date: "",
      accepted_sent_date: "",
      address: {
        address: "",
        postcode: "",
        mobile_tel: "",
        email: "",
      },
    },
    onSubmit: async (values) => {
      try {
        const payload = {
          company_name: values.company_name,
          reference: values.reference,
          recommendation_sent: values.recommendation_sent,
          note: values.note,
          claim_id: parseInt(claimId),
          email_sent_date: new Date().toLocaleDateString("sv-SE"), //remove from back end
          accepted_sent_date: new Date().toLocaleDateString("sv-SE"), //remove from back end
          address: {
            address: values.address.address,
            postcode: values.address.postcode,
            mobile_tel: values.address.mobile_tel,
            email: values.address.email,
          },
        };

        const payloadToSend = cleanPayload(payload);
        if (claimId && panelId) {
          await updatePanelSolicitors(payloadToSend, parseInt(claimId), "");
        } else {
          const res = await createPanelSolicitors(payloadToSend, "");
          localStorage.setItem("panelId", res.id);
        }
        toast.success("Panel Solicitor Details saved successfully");
      } catch (error) {
        toast.error("Error saving panel solicitor details");
        throw error;
      }
    },
  });
  const [showPicker, setShowPicker] = useState(false);

  //  CTA: Vehicle Owner logic
  const handleVehicleOwnerCTA = async () => {
    try {
      const ownerData = await getVehicleOwner(parseInt(claimId!));
      const fullName = `${ownerData.first_name} ${ownerData.surname}`;
      formik.setFieldValue("policy_holder", fullName);
      // toast.info("Policy Holder synced from Vehicle Owner");
    } catch (err) {
      // toast.error("Could not fetch Vehicle Owner details");
    }
  };
  useEffect(() => {
    handleVehicleOwnerCTA();
  }, []);
  const fetchPanelSolicitosDetails = async () => {
    try {
      //  setIsLoading(true);
      const response = await getPanelSolicitorDetails(claimId);
      const panelSolicitors = response.data || response;
      if (panelSolicitors) {
        formik.setValues((prev) => ({
          ...prev,
          company_name: panelSolicitors.company_name,
          reference: panelSolicitors.reference,
          recommendation_sent: panelSolicitors.recommendation_sent,
          note: panelSolicitors.note,
          claim_id: parseInt(claimId) || 0,
          email_sent_date: panelSolicitors.email_sent_date,
          accepted_sent_date: panelSolicitors.accepted_sent_date,
          address: {
            address: panelSolicitors.address.address,
            postcode: panelSolicitors.address.postcode,
            mobile_tel: panelSolicitors.address.mobile_tel,
            email: panelSolicitors.address.email,
          },
        }));
      }
    } catch (error) {
      console.error("Error fetching panel details:", error);
    } finally {
    }
  };
  interface ChargeInputProps {
    label: string;
    value: string;
  }

  const ChargeInput: React.FC<ChargeInputProps> = ({ label, value }) => (
    <div className="flex w-full max-w-[384px] flex-col gap-2">
      <label className="text-sm font-weight-400 text-gray-700">{label}</label>
      <div className="flex h-[52px] items-center rounded border border-gray-200 bg-white px-5 py-4">
        <span className="text-base font-light leading-4 text-gray-700">
          {value}
        </span>
      </div>
    </div>
  );

  const formatDate = (val: string | Date | null) => {
    if (!val) return null;
    const d = new Date(val);
    return d.toISOString().split("T")[0];
  };
  useEffect(() => {
    if (claimId && panelId) {
      fetchPanelSolicitosDetails();
    }
  }, []);

  //  Two-way sync: Update Vehicle Owner when Policy Holder changes
  const syncBackToVehicleOwner = async (val: string) => {
    try {
      const [first, ...last] = val.split(" ");
      await updateVehicleOwner(parseInt(claimId!), {
        first_name: first,
        surname: last.join(" "),
      });
    } catch (e) {
      console.error("Sync back failed");
    }
  };
  const handleCompanySelect = (selected: any) => {
    // Update input field to show full company name
    setSearchTerm(selected.company_name);

    // Close dropdown
    setShowDropdown(false);
    console.log(selected);
    // Set Formik fields (correct backend keys!)
    formik.setFieldValue("company_name", selected.company_name);
    formik.setFieldValue("address.address", selected.address ?? "");
    formik.setFieldValue("address.postcode", selected.postcode ?? "");
  };
  const handleMobileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, ""); // remove non-digits

    if (value.length > 5) {
      value = value.slice(0, 5) + " " + value.slice(5, 11);
    }

    formik.setFieldValue("address.mobile_tel", value);
  };
  useEffect(() => {
    if (formRef) formRef.current = formik;
  }, [formik]);

  return (
    <div className="MainContent w-[788px] ms-[140px] flex-1 inline-flex flex-col gap-6 p-8 overflow-y-auto scrollbar-hide  font-['Stack_Sans_Headline']">
      <h1 className="text-black text-2xl font-weight-600 font-['Stack_Sans_Headline']">
        Driver Checkout Charges
      </h1>

      {/* Vehicle Summary Banner */}
      <div className="flex w-full">
        <div className="flex flex-1 flex-col items-center justify-center gap-1 rounded-lg bg-blue-50 p-5">
          <div className="text-xl font-weight-600 leading-5 text-black">
            Vehicle 1
          </div>
          <div className="text-sm font-weight-400 text-gray-600">
            Reg# LP73UGM
          </div>
        </div>
      </div>

      {/* Charges Details Card */}
      <div className="flex w-full flex-col gap-4 rounded-lg border border-gray-100 p-5 shadow-sm">
        <div className="flex w-full items-center">
          <h3 className="text-xl font-weight-600 leading-5 text-black">
            Charges Detail
          </h3>
        </div>

        {/* Divider */}
        <div className="h-px w-full bg-gray-100" />

        {/* Row 1: Valet & Petrol */}
        <div className="grid grid-cols-2 gap-5">
          <ChargeInput label="Valet Charges" value="£250" />
          <ChargeInput label="Petrol Checkout Charges" value="£250" />
        </div>

        {/* Row 2: Damage */}
        <div className="flex flex-wrap gap-5">
          <ChargeInput label="Damage Charges" value="£250" />
        </div>

        {/* Status Checkbox/Indicator */}
        <div className="flex items-center gap-2">
          {/* Custom Checkbox UI from your Rectangle 3 */}
          <div className="h-5 w-5 rounded bg-blue-500 border-[6px] border-blue-200" />
          <span className="text-sm font-normal text-black">
            Damage Charges Paid
          </span>
        </div>

        {/* Row 3: Total */}
        <div className="flex flex-wrap gap-5 pt-2">
          <ChargeInput label="Total Charges" value="£250" />
        </div>
      </div>
    </div>
  );
};
