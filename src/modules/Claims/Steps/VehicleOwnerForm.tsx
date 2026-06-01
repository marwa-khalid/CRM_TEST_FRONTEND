
import { useEffect, useState } from "react";
import Select from "react-select";
import { Calendar, Minus, Plus, Upload, X } from "lucide-react";
import { VehicleCheckModal } from "./VehicleCheckModal";
import { BlueDropdownIndicator, customStyles } from "./GeneralDetailsForm";
import pencil from "../../../assets/AutoClaim_icon/pencil.svg";
import trash from "../../../assets/AutoClaim_icon/trash.svg";
import { toast } from "react-toastify";
import { V5CUploadModalOwner } from "../UploadModalPopups/V5CUploadModalOwner";
import * as Yup from 'yup'
import { useFormik } from "formik";
import { createVehicleDetail, getVehicleDetail, updateVehicle } from "../../../services/Vehicle/vehicle";
import { cleanPayload } from "./ClientDetailsForm";
import { PostcodeLookup } from "../../../components/common/PostcodeLookup";
import { AddressAutocomplete } from "../../../components/common/AddressAutocomplete";
import { getVehicleOwner, updateVehicleOwner, VehicleOwnersApi } from "../../../services/VehicleOwner/vehicleOwner";

export const VehicleOwnerForm = ({ formRef, claimId }: any) => {

  const [vehicleOwnerId, setVehicleOwnerId] = useState<string | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);

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
        let response;
        if (claimId && vehicleOwnerId) {
          response = await updateVehicleOwner(payloadToSend, parseInt(claimId));
        } else {
          response = await VehicleOwnersApi.createVehicleOwner(payloadToSend);
        }
        if (response?.id) setVehicleOwnerId(String(response.id));
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
      if (ownerData?.id) setVehicleOwnerId(String(ownerData.id));
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
    if (claimId) {
      fetchData().catch((err) => {
        if (err?.response?.status !== 404) toast.error("Failed to load vehicle owner details");
      });
    }
  }, [claimId]);
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
          <AddressAutocomplete
            address={formik.values.address || ""}
            onChange={(v) => formik.setFieldValue("address", v)}
            onPlaceSelected={(place) => {
              formik.setFieldValue("address", place.address);
              formik.setFieldValue("postcode", place.postcode);
            }}
            inputClassName={`w-full h-[52px] px-5 bg-white rounded border border-gray-200 outline-none text-neutral-700 font-light ${inputStyles}`}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Body Type */}
          <div className="flex flex-col gap-2">
            <label className="text-neutral-700 text-[14px] font-weight-500">
              Post Code{" "}
            </label>
            <PostcodeLookup
              postcode={formik.values.postcode}
              onChange={(v) => formik.setFieldValue("postcode", v)}
              onAddressSelect={(addr) => {
                formik.setFieldValue("postcode", addr.postcode);
                formik.setFieldValue("address", [addr.line1, addr.line2, addr.line3].filter(Boolean).join(", "));
              }}
              inputClassName={`w-full h-[52px] px-5 bg-white rounded border border-gray-200 text-neutral-700 ${inputStyles}`}
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
