
import { useEffect, useState } from "react";
import Select from "react-select";
import { Calendar, Minus, Plus, Upload, X } from "lucide-react";
import { VehicleCheckModal } from "./VehicleCheckModal";
import { BlueDropdownIndicator, customStyles } from "./GeneralDetailsForm";
import pencil from "../../../assets/AutoClaim_icon/pencil.svg";
import trash from "../../../assets/AutoClaim_icon/trash.svg";
import { toast } from "react-toastify";
import { V5CUploadModalOwner } from "../Components/V5CUploadModalOwner";
import * as Yup from 'yup'
import { useFormik } from "formik";
import { createVehicleDetail, getVehicleDetail, updateVehicle } from "../../../services/Vehicle/vehicle";
import { cleanPayload } from "./ClientDetailsForm";
import LeafletAutocompleteMap from "../../../components/GoogleMapAutoComplete/GoogleMapAutoComplete";
import { getVehicleOwner, updateVehicleOwner, VehicleOwnersApi } from "../../../services/VehicleOwner/vehicleOwner";

export const VehicleOwnerForm = ({ formRef }: any) => {

 const claimId = localStorage.getItem("claimId")
  const [showUploadModal, setShowUploadModal] = useState(false);
  const vehicleOwnerId = localStorage.getItem("vehicleOwnerId");

  const formik = useFormik({
    initialValues: {
      clientTitle: "mr",
      clientFirstName: "",
      clientSurname: "",
      address: "",
      postcode: "",
      homeTelephone: "",
      mobileTelephone: "",
      email: "",
      vehiclePaymentBeneficiary: "",
    },
    validationSchema: Yup.object().shape({}),
    onSubmit: async (values: any) => {
      try {
        const payload = {
          gender: "mr",
          first_name: values.clientFirstName,
          surname: values.clientSurname,
          payment_benificiary: values.vehiclePaymentBeneficiary,
          claim_id: parseInt(claimId),
          tenant_id: 1,
          address: {
            address: values.address,
            postcode: values.postcode,
            home_tel: values.homeTelephone,
            mobile_tel: values.mobileTelephone,
            email: values.email,
          },
        };

        const payloadToSend = cleanPayload(payload);
        console.log(parseInt(claimId));
        // return
        if (claimId && vehicleOwnerId) {
          const response = await updateVehicleOwner(
            payloadToSend,
            parseInt(claimId),
          );
          localStorage.setItem("vehicleOwnerId", response.id);
        } else {
          const response = await VehicleOwnersApi.createVehicleOwner(payloadToSend);
          localStorage.setItem("vehicleOwnerId", response.id);
        }
        toast.success("Vehicle Owner details saved successfully");
      } catch (error) {
        toast.error("Error saving vehicle ownerdetails");
        throw error;
      }
    },
  });
  useEffect(() => {
    const fetchData = async () => {
      const ownerData = await getVehicleOwner(parseInt(claimId));
      console.log(ownerData);
        const mappedValues = {
          clientTitle: ownerData?.gender,
          clientFirstName: ownerData?.first_name,
          clientSurname: ownerData?.surname,
          email: ownerData?.address?.email,
          homeTelephone: ownerData?.address?.home_tel,
          mobileTelephone: ownerData?.address?.mobile_tel,
          vehiclePaymentBeneficiary: ownerData?.payment_benificiary,
          address: ownerData?.address?.address,
          postcode: ownerData?.address?.postcode,
        };

      formik.setValues(mappedValues);
    };
    console.log(formik.values)
    if (claimId && vehicleOwnerId) {
      fetchData();
    }
  }, []);
    useEffect(() => {
      if (formRef) {
        formRef.current = formik;
      }
    }, [formRef, formik]);
  const pollJobStatus = async (jobId: string) => {
    // Show a global loader for the OCR processing
    // setLoading(true);
    try {
      // Loop or interval to check OCR status
      // const result = await checkOCRStatus(jobId);
      // console.log(result)
      // if (result.status === "completed") {
        // Pre-fill your Formik fields
        // formik.setValues({
        //   ...formik.values,
        //   clientFirstName: result.data.clientFirstName,
        //   model: result.data.model,
        //   registration: result.data.registration,
        //   colour: result.data.colour,
        // });
        toast.success("Data extracted successfully!");
      }
     catch (e) {
      toast.error("OCR extraction failed");
    } finally {
      // setLoading(false);
    }
  };
  const handlHomeTelephoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // let value = e.target.value.replace(/\D/g, ""); // remove non-digits

    // if (value.length > 4) {
    //   value = value.slice(0, 4) + " " + value.slice(4);
    // }

    formik.setFieldValue("homeTelephone", e.target.value);
  };
const inputStyles = `hover:border-neutral-400 focus:border-blue-500 focus:outline-none font-light transition-colors placeholder:font-['Stack_Sans_Headline']`;

    const handleMobileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let value = e.target.value.replace(/\D/g, ""); // remove non-digits

      if (value.length > 4) {
        value = value.slice(0, 4) + " " + value.slice(4);
      }

      formik.setFieldValue("mobileTelephone", value);
    };
return (
  <>
    <V5CUploadModalOwner
      isOpen={showUploadModal}
      claimId={claimId}
      formik={formik}
      onClose={() => setShowUploadModal(false)}
      onUploadSuccess={(jobId) => pollJobStatus(jobId)}
    />
    <div className="MainContent w-full flex flex-col items-start gap-6 py-1 font-['Stack_Sans_Headline']">
      {/* Container matching left-[534px] and top-[157px] from source */}
      <h1 className="text-neutral-900 text-[24px] font-weight-600 font-['Stack_Sans_Headline']">
        Owner Details
      </h1>
      {/* Section 1: Personal Information Section */}
      <div className="self-stretch p-5 rounded-lg border border-gray-100 flex flex-col gap-4">
        <div className="flex justify-between items-center w-full">
          <h2 className="text-neutral-900 text-[20px] font-weight-600 leading-5 font-['Stack_Sans_Headline']">
            Vehicle Owner Details
          </h2>
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-600 rounded-md text-sm font-weight-400 hover:bg-blue-100 transition-colors"
          >
            <Upload className="w-4 h-4" />
            Upload V5C File
          </button>
        </div>
        <div className="h-px bg-gray-100 w-full" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* clientFirstName */}
          <div className="flex flex-col gap-2">
            <label className="text-neutral-700 text-[14px] font-weight-500">
              First Name
            </label>
            <input
              value={formik.values.clientFirstName}
              onChange={(e) =>
                formik.setFieldValue("clientFirstName", e.target.value)
              }
              type="text"
              placeholder="Enter First Name"
              className={`w-full h-[52px] px-5 bg-white rounded border border-gray-200 text-neutral-700 ${inputStyles}`}
            />
          </div>
          {/* Model */}
          <div className="flex flex-col gap-2">
            <label className="text-neutral-700 text-[14px] font-weight-500">
              Last Name
            </label>
            <input
              type="text"
              placeholder="Enter Last Name"
              value={formik.values.clientSurname}
              onChange={(e) =>
                formik.setFieldValue("clientSurname", e.target.value)
              }
              className={`w-full h-[52px] px-5 bg-white rounded border border-gray-200 text-neutral-700 ${inputStyles}`}
            />
          </div>
        </div>
        <div className="row flex flex-col gap-2">
          <label className="text-neutral-700 text-[14px] font-weight-500">
            Address{" "}
          </label>
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Body Type */}
          <div className="flex flex-col gap-2">
            <label className="text-neutral-700 text-[14px] font-weight-500">
              Post Code{" "}
            </label>
            <input
              type="text"
              value={formik.values.postcode}
              onChange={(e) => formik.setFieldValue("postcode", e.target.value)}
              placeholder="Enter Post Code"
              className={`w-full h-[52px] px-5 bg-white rounded border border-gray-200 text-neutral-700 ${inputStyles}`}
            />
          </div>
          {/* Vehicle Registration */}
          <div className="flex flex-col gap-2">
            <label className="text-neutral-700 text-[14px] font-weight-500">
              Email
            </label>
            <input
              type="text"
              value={formik.values.email}
              onChange={(e) => formik.setFieldValue("email", e.target.value)}
              placeholder="Enter Email"
              className={`w-full h-[52px] px-5 bg-white rounded border border-gray-200 text-neutral-700 ${inputStyles}`}
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Color */}
          <div className="flex flex-col gap-2">
            <label className="text-neutral-700 text-[14px] font-weight-500">
              Home Telephone
            </label>
            <div className="relative h-[52px] px-5 bg-white rounded border border-gray-200 flex items-center gap-2.5 focus-within:border-blue-500 transition-all">
              {/* <span className="text-gray-400 text-base font-light">+44</span> */}
              <input
                name="contact_number"
                type="text"
                onChange={handlHomeTelephoneChange}
                maxLength={15}
                value={formik.values.homeTelephone}
                className="w-full bg-transparent mb-0.5 outline-none text-gray-900 font-light placeholder:text-gray-300"
              />
            </div>
          </div>
          {/* Fuel Type */}
          <div className="flex flex-col gap-2">
            <label className="text-neutral-700 text-[14px] font-weight-500">
              Mobile Number
            </label>
            <div className="relative h-[52px] px-5 bg-white rounded border border-gray-200 flex items-center gap-2.5 focus-within:border-blue-500 transition-all">
              <span className="text-gray-400 text-base font-light">+44</span>
              <input
                name="mobileTelephone"
                type="tel"
                onChange={handleMobileChange}
                maxLength={11}
                value={formik.values.mobileTelephone}
                className="w-full bg-transparent outline-none text-neutral-700 mb-0.5 font-light placeholder:text-gray-300"
              />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Engine Size */}
          <div className="flex flex-col gap-2">
            <label className="text-neutral-700 text-[14px] font-weight-500">
              Vehicle Payment Beneficiary
            </label>
            <input
              value={formik.values.vehiclePaymentBeneficiary}
              onChange={(e) =>
                formik.setFieldValue(
                  "vehiclePaymentBeneficiary",
                  e.target.value,
                )
              }
              type="text"
              placeholder="Enter Beneficiary"
              className={`w-full h-[52px] px-5 bg-white rounded border border-gray-200 text-neutral-700 ${inputStyles}`}
            />
          </div>
        </div>

        {/* Conditional Borough Section */}
        {/* {claimType !== "RTA - NA" && (
          <div className="mt-4 p-4 bg-blue-50/50 rounded-lg border border-blue-100 flex flex-col gap-2 animate-in fade-in duration-300">
            <label className="text-neutral-700 text-[14px] font-weight-500">
              Borough
            </label>
            <input
              type="text"
              placeholder="Enter Borough (Mandatory for Nationwide Assist)"
              className="w-full px-5 py-4 bg-white rounded border border-blue-200 text-base focus:ring-2 focus:ring-blue-500/20"
              required
            />
          </div>
        )} */}
      </div>
    </div>
  </>
);
};;
