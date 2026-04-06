import { useEffect, useState } from "react";
import Select from "react-select";
import { useFormik } from "formik";
import * as Yup from "yup";
import { toast } from "react-toastify";
import { BlueDropdownIndicator, customStyles } from "./GeneralDetailsForm";
import LeafletAutocompleteMap from "../../../components/GoogleMapAutoComplete/GoogleMapAutoComplete";
import {
  getClientInsurer,
  updateClientInsurer,
  createClientInsurer,
} from "../../../services/ClientInsurer/ClientInsurer";
import { getCompanySuggestions } from "../../../services/Referrer/Referrer";
import {
  getVehicleOwner,
  updateVehicleOwner,
} from "../../../services/VehicleOwner/vehicleOwner"; // For two-way sync
import { cleanPayload } from "./ClientDetailsForm";

// Icons
import Yes from "../../../assets/AutoClaim_icon/Yes.svg";
import No from "../../../assets/AutoClaim_icon/No.svg";

export const ClientInsurerBrokerForm = ({ formRef }: any) => {
  const claimId = localStorage.getItem("claimId");
  const insurerId = localStorage.getItem("insurerId");
  const [companies, setCompanies] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
   useEffect(() => {
     const fetchCompanies = async () => {
       try {
         
         const response = await getCompanySuggestions(searchTerm); // Replace with your API endpoint
         

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
  const formik = useFormik({
    initialValues: {
      companyName: "",
      address: "",
      postcode: "",
      telephoneMain: "",
      email: "",
      reference: "",
      policy_number: "",
      policy_holder: "",
      type_of_policy: null, // Fleet, TBC, Trade [cite: 23]
      policy_cover_level: null, // Comprehensive, etc [cite: 23]
      policy_cover_excess: "",
      no_of_additional_driver: "",
      no_of_vehicles_policy: "",
      no_of_vehicles_use: "",
      sdp: false,
      private_hire: false,
    },
    onSubmit: async (values) => {
      try {
        const payload = {
          company_name: values.companyName,
          reference: values.reference,
          policy_number: values.policy_number,
          policy_holder: values.policy_holder,
          policy_type_id: values.type_of_policy,
          policy_cover_id: values.policy_cover_level,
          policy_cover_excess: values.policy_cover_excess,
          sdp: values.sdp,
          private_hire: values.private_hire,
          number_of_additional_driver: values.no_of_additional_driver,
          number_vehicle_on_policy: values.no_of_vehicles_policy,
          number_vehicle_in_use: values.no_of_vehicles_use,
          claim_id: parseInt(claimId),
          address: {
            address: values?.address,
            postcode: values?.postcode,
            mobile_tel: values?.telephoneMain,
            email: values?.email,
          },
        };

        const payloadToSend = cleanPayload(payload);
        if (claimId && insurerId) {
          await updateClientInsurer(payloadToSend, parseInt(claimId));
        } else {
          const res = await createClientInsurer(payloadToSend);
          localStorage.setItem("insurerId", res.id);
        }
        toast.success("Client insurer Details saved successfully");
      } catch (error) {
        toast.error("Error saving client insurer details");
                throw error;
      }
    },
  });

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
  handleVehicleOwnerCTA()
  }, [])
    const fetchClientInsurer = async () => {
        try {
          const res = await getClientInsurer(parseInt(claimId));
  
          formik.setValues((prev) => ({
            ...prev,
            companyName: res?.company_name,
            address: res?.address?.address,
            postcode: res?.address?.postcode,
            telephoneMain: res?.address?.mobile_tel,
            email: res?.address?.email,
            reference: res?.reference,
            policy_number: res?.policy_number,
            policy_holder: res?.policy_holder,
            type_of_policy: res?.policy_type_id,
            no_of_additional_driver: res?.number_of_additional_driver,
            no_of_vehicles_policy: res?.number_vehicle_on_policy,
            no_of_vehicles_use: res?.number_vehicle_in_use,
            policy_cover_level: res?.policy_cover_id,
            policy_cover_excess: res?.policy_cover_excess,
            sdp: res?.sdp || false,
            private_hire: res?.private_hire || false,
          }));
        } catch (e) {
        }
  };
  useEffect(() => {
    fetchClientInsurer();
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

    // Set Formik fields (correct backend keys!)
    formik.setFieldValue("companyName", selected.company_name);
    formik.setFieldValue("address", selected.address ?? "");
    formik.setFieldValue("postcode", selected.postcode ?? "");
  };
const handleMobileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  let value = e.target.value.replace(/\D/g, ""); // remove non-digits

  if (value.length > 4) {
    value = value.slice(0, 4) + " " + value.slice(4);
  }

  formik.setFieldValue("telephoneMain", value);
};
  useEffect(() => {
    if (formRef) formRef.current = formik;
  }, [formik]);
const inputStyles = `hover:border-neutral-400 focus:border-blue-500 focus:outline-none font-light transition-colors`;

  return (
    <div className="MainContent w-[788px] ms-[140px] flex-1 inline-flex flex-col gap-6 p-8 overflow-y-auto scrollbar-hide  font-['Stack_Sans_Headline']">
      <h1 className="text-black text-2xl font-weight-600 font-['Stack_Sans_Headline']">
        Client Insurer & Broker
      </h1>

      {/* 1. Client Insurers Section [cite: 7] */}
      <div className="self-stretch p-5 rounded-lg border border-gray-100 flex flex-col gap-4">
        <h2 className="text-black text-xl font-weight-600">
          Client Insurer Details
        </h2>
        <div className="h-px bg-gray-100 w-full" />

        <div className="flex flex-col gap-2 relative">
          <label className="text-gray-700 text-sm font-weight-400 h-[20px] flex items-center">
            Company Name
          </label>
          <input
            className={`w-full h-[52px] px-5 bg-white rounded border border-gray-200 outline-none text-neutral-700 font-light text-neutral-700 ${inputStyles}`}
            value={searchTerm || formik.values.companyName}
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
            showMap={false}
            apiKey={import.meta.env.VITE_GOOGLE_MAP_KEY}
            address={formik.values.address}
            onPlaceSelected={(place) => {
              formik.setFieldValue("address", place.address);
              formik.setFieldValue("postcode", place.postalCode);
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
              value={formik.values.postcode}
              onChange={(e) => formik.setFieldValue("postcode", e.target.value)}
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
              value={formik.values.email}
              onChange={(e) => formik.setFieldValue("email", e.target.value)}
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
              <span className="text-neutral-400 text-base font-weight-300 font-light">
                +44
              </span>
              <input
                name="contact_number"
                type="tel"
                onChange={handleMobileChange}
                maxLength={11}
                value={formik.values.telephoneMain}
                className="w-full bg-transparent outline-none text-gray-900 mb-0.5 font-weight-300 font-light placeholder:text-gray-300"
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
          <div className="flex flex-col gap-2">
            <label className="text-gray-700 text-sm font-weight-400 h-[20px] flex items-center">
              Policy Number
            </label>
            <input
              className={`w-full h-[52px] px-5 bg-white rounded border border-gray-200 outline-none text-neutral-700 font-light text-neutral-700 ${inputStyles}`}
              name="policy_number"
              onChange={formik.handleChange}
              value={formik.values.policy_number}
            />
          </div>
        </div>
      </div>

      {/* 2. Cover Details Section [cite: 16] */}
      <div className="self-stretch p-5 rounded-lg border border-gray-100 flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <h2 className="text-black text-xl font-weight-600">Cover Details</h2>
          {/* <button
            type="button"
            onClick={handleVehicleOwnerCTA}
            className="px-4 py-2 bg-blue-50 text-blue-600 rounded text-sm font-weight-400 border border-blue-200 hover:bg-blue-100"
          >
            Vehicle Owner
          </button> */}
        </div>
        <div className="h-px bg-gray-100 w-full" />
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-gray-700 text-sm font-weight-400 h-[20px] flex items-center">
              Policy Holder
            </label>
            <input
              className={`w-full h-[52px] px-5 bg-white rounded border border-gray-200 outline-none text-neutral-700 font-light text-neutral-700 ${inputStyles}`}
              name="policy_holder"
              value={formik.values.policy_holder}
              onChange={(e) => {
                formik.handleChange(e);
                syncBackToVehicleOwner(e.target.value); //  Two-way sync
              }}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-5">
          <div className="flex flex-col gap-2">
            <label className="text-gray-700 text-sm font-weight-400 h-[20px] flex items-center">
              Type of Policy
            </label>
            <Select
              options={[
                { value: 1, label: "Fleet" },
                { value: 2, label: "TBC" },
                { value: 3, label: "Trade" },
              ]}
              styles={customStyles}
              onChange={(opt: any) =>
                formik.setFieldValue("type_of_policy", opt.value)
              }
              value={[
                { value: 1, label: "Fleet" },
                { value: 2, label: "TBC" },
                { value: 3, label: "Trade" },
              ].find((opt) => opt.value === formik.values.type_of_policy)}
              components={{
                DropdownIndicator: BlueDropdownIndicator,
                IndicatorSeparator: () => null,
              }}
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-gray-700 text-sm font-weight-400 h-[20px] flex items-center">
              Policy Cover Level
            </label>
            <Select
              options={[
                { value: 1, label: "Comprehensive" },
                { value: 2, label: "Third Party" },
              ]}
              styles={customStyles}
              onChange={(opt: any) =>
                formik.setFieldValue("policy_cover_level", opt.value)
              }
              value={[
                { value: 1, label: "Comprehensive" },
                { value: 2, label: "Third Party" },
              ].find((opt) => opt.value === formik.values.policy_cover_level)}
              components={{
                DropdownIndicator: BlueDropdownIndicator,
                IndicatorSeparator: () => null,
              }}
            />
          </div>
        </div>

        {/* [cite: 25, 26, 37] Conditional Logic for Fleet */}
        {formik.values.type_of_policy === 1 && (
          <div className="grid grid-cols-3 gap-5 p-4 bg-gray-50 rounded-lg animate-in fade-in duration-300">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500">
                Additional Drivers
              </label>
              <input
                type="number"
                name="no_of_additional_driver"
                value={formik.values.no_of_additional_driver}
                onChange={formik.handleChange}
                className={`w-full h-[52px] px-5 bg-white rounded border border-gray-200 outline-none text-neutral-700 font-light text-neutral-700 ${inputStyles}`}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500">
                Vehicles on Policy
              </label>
              <input
                type="number"
                value={formik.values.no_of_vehicles_policy}
                name="no_of_vehicles_policy"
                onChange={formik.handleChange}
                className={`w-full h-[52px] px-5 bg-white rounded border border-gray-200 outline-none text-neutral-700 font-light text-neutral-700 ${inputStyles}`}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500">Vehicles in Use</label>
              <input
                type="number"
                name="no_of_vehicles_use"
                value={formik.values.no_of_vehicles_use}
                onChange={formik.handleChange}
                className={`w-full h-[52px] px-5 bg-white rounded border border-gray-200 outline-none text-neutral-700 font-light text-neutral-700 ${inputStyles}`}
              />
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-5">
          <div className="flex flex-col gap-2">
            <label className="text-gray-700 text-sm font-weight-400 h-[20px] flex items-center">
              Policy Cover Excess (£)
            </label>
            <input
              type="number"
              name="policy_cover_excess"
              onChange={formik.handleChange}
              value={formik.values.policy_cover_excess}
              className={`w-full h-[52px] px-5 bg-white rounded border border-gray-200 outline-none text-neutral-700 font-light text-neutral-700 ${inputStyles}`}
            />
          </div>

          <div className="flex items-center gap-6 mt-6">
            <div
              className="flex items-center gap-2 cursor-pointer"
              onClick={() => formik.setFieldValue("sdp", !formik.values.sdp)}
            >
              <img
                src={formik.values.sdp ? Yes : No}
                alt="toggle"
                className="w-6 h-6"
              />
              <span className="text-sm">SDP</span>
            </div>
            <div
              className="flex items-center gap-2 cursor-pointer"
              onClick={() =>
                formik.setFieldValue(
                  "private_hire",
                  !formik.values.private_hire,
                )
              }
            >
              <img
                src={formik.values.private_hire ? Yes : No}
                alt="toggle"
                className="w-6 h-6"
              />
              <span className="text-sm">Private Hire/Hackney</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
