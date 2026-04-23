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

export const PanelSolicitorForm = ({ formRef }: any) => {
  const claimId = localStorage.getItem("claimId");
  const panelId = localStorage.getItem("panelId");
  const [companies, setCompanies] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
const inputStyles = `hover:border-neutral-400 focus:border-blue-500 focus:outline-none font-light transition-colors`;
  
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
     }
        // document.addEventListener("mousedown", handleClickOutside);
        return () =>
          document.removeEventListener("mousedown", handleClickOutside);
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
          await updatePanelSolicitors(payloadToSend, parseInt(claimId),'');
        } else {
          const res = await createPanelSolicitors(payloadToSend,'');
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
             recommendation_sent:panelSolicitors.recommendation_sent,
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
console.log(selected)
    // Set Formik fields (correct backend keys!)
    formik.setFieldValue("company_name", selected.company_name);
    formik.setFieldValue("address.address", selected.address ?? "");
    formik.setFieldValue("address.postcode", selected.postcode ?? "");
  };
  const handleMobileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, ""); // remove non-digits

    if (value.length > 4) {
      value = value.slice(0, 4) + " " + value.slice(4);
    }

    formik.setFieldValue("address.mobile_tel", value);
  };
  useEffect(() => {
    if (formRef) formRef.current = formik;
  }, [formik]);

  return (
          <div className="MainContent w-full flex flex-col items-start gap-6 py-1 font-['Stack_Sans_Headline']">

      <h1 className="text-black text-2xl font-weight-600 font-['Stack_Sans_Headline']">
        Panel Solicitor
      </h1>

      {/* 1. Client Insurers Section [cite: 7] */}
      <div className="self-stretch p-5 rounded-lg border border-gray-100 flex flex-col gap-4">
        <h2 className="text-black text-xl font-weight-600">
          Solicitor Details
        </h2>
        <div className="h-px bg-gray-100 w-full" />

        <div className="flex flex-col gap-2 relative">
          <label className="text-gray-700 text-sm font-weight-400 h-[20px] flex items-center">
            Company Name
          </label>
          <input
            className={`w-full h-[52px] px-5 bg-white rounded border border-gray-200 outline-none text-neutral-700 font-light text-neutral-700 ${inputStyles}`}
            value={searchTerm || formik.values.company_name}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setShowDropdown(true);
            }}
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

        <div className="flex flex-col gap-2">
          <label className="text-gray-700 text-sm font-weight-400 h-[20px] flex items-center">
            Address
          </label>
          <LeafletAutocompleteMap
            disabled={false}
            apiKey={import.meta.env.VITE_GOOGLE_MAP_KEY}
            address={formik.values.address.address}
            showMap={false}
            onPlaceSelected={(place) => {
              formik.setFieldValue("address.address", place.address);
              formik.setFieldValue("address.postcode", place.postalCode);
            }}
          />
        </div>

        <div className="grid grid-cols-2 gap-5">
          <div className="flex-1 flex flex-col gap-2">
            <label className="text-gray-700 text-sm font-weight-400">
              Post Code
            </label>
            <input
              name="postcode"
              value={formik.values.address.postcode}
              onChange={(e) =>
                formik.setFieldValue("address.postcode", e.target.value)
              }
              placeholder="Enter Postcode"
              className={`w-full h-[52px] px-5 bg-white rounded border border-gray-200 outline-none text-neutral-700 font-light text-neutral-700 ${inputStyles}`}
            />
          </div>

          <div className="flex-1 flex flex-col gap-2 focus-within:border-blue-500 transition-all">
            <label className="text-gray-700 text-sm font-weight-400">
              Email Address
            </label>
            <input
              name="email"
              type="email"
              value={formik.values.address.email}
              onChange={(e) =>
                formik.setFieldValue("address.email", e.target.value)
              }
              placeholder="Enter Email"
              className={`w-full h-[52px] px-5 bg-white rounded border border-gray-200 outline-none text-neutral-700 font-light text-neutral-700 ${inputStyles}`}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-5">
          <div className="flex-1 flex flex-col gap-2">
            <label className="text-gray-700 text-sm font-weight-400">
              Telephone{" "}
            </label>
            <div className="relative h-[52px] px-5 bg-white rounded border border-gray-200 flex items-center gap-2.5 focus-within:border-blue-500 transition-all">
              <span className="text-gray-400 text-base font-light">+44</span>
              <input
                name="contact_number"
                type="tel"
                onChange={handleMobileChange}
                maxLength={11}
                value={formik.values.address.mobile_tel}
                className="w-full bg-transparent outline-none text-neutral-700 mb-0.5 font-light placeholder:text-gray-300"
              />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-5">
          <div className="flex flex-col gap-2">
            <label className="text-gray-700 text-sm font-weight-400 h-[20px] flex items-center">
              Reference
            </label>
            <input
              className={`w-full h-[52px] px-5 bg-white rounded border border-gray-200 outline-none text-neutral-700 font-light text-neutral-700 ${inputStyles}`}
              name="reference"
              onChange={formik.handleChange}
              value={formik.values.reference}
            />
          </div>

          <div className="flex flex-col gap-2 relative" ref={containerRef}>
            <label className="text-gray-700 text-sm font-weight-500 ">
              Recommendations Send On
            </label>
            <div
              onClick={() => setShowPicker(!showPicker)}
              className="h-[52px] px-5 bg-white border border-gray-200 rounded flex items-center justify-between cursor-pointer"
            >
              <span
                className={`
                   font-light font-weight-300
                  ${
                    formik.values.recommendation_sent
                      ? "text-gray-900"
                      : "text-gray-400"
                  }`}
              >
                {formik.values.recommendation_sent || "Select Date"}
              </span>
              <img src={Vector6} alt="" />
            </div>
            {showPicker && (
              <div className="absolute bottom-[54px] left-0 z-100">
                <CustomDatePicker
                  selectedDate={
                    formik.values.recommendation_sent
                      ? new Date(formik.values.recommendation_sent)
                      : new Date()
                  }
                  onDateSelect={(date) => {
                    formik.setFieldValue(
                      "recommendation_sent",
                      date.toISOString().split("T")[0],
                    );
                    setShowPicker(false);
                  }}
                />
              </div>
            )}
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-gray-700 text-sm h-[20px] flex items-center font-weight-300 font-light">
            Note
          </label>
          <textarea
            className={`w-full p-3 px-5 bg-white rounded border border-gray-200 outline-none text-neutral-700 font-light text-neutral-700 ${inputStyles}`}
            placeholder="Value"
            rows={3}
            maxLength={500}
            value={formik.values.note}
            name="note"
            onChange={formik.handleChange}
          />
        </div>
      </div>
    </div>
  );
};
