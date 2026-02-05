import { useState, useEffect, forwardRef, useImperativeHandle, useRef } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import PhoneInput from "react-phone-input-2";
import { Mail } from "lucide-react";
import CustomSelect from "../ReactSelect/ReactSelect.tsx";
import LeafletAutocompleteMap from "../GoogleMapAutoComplete/GoogleMapAutoComplete.tsx";
import { useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import UploadCSV5Modal from "../VehicleDetailCard/uploadCV5.tsx";
import { getVehicleOwner, updateVehicleOwner, uploadVCDocs, VehicleOwnersApi } from "../../services/VehicleOwner/VehicleOwner.ts";
import { toast } from "react-toastify";
import { checkStatusJob, fetchJobResultCall } from "../../services/Vehicle/Vehicle.tsx";

interface FormData {
  clientTitle: string;
  clientFirstName: string;
  clientSurname: string;
  address: string;
  postcode: string;
  homeTelephone: string;
  mobileTelephone: string;
  email: string;
  vehiclePaymentBeneficiary: string;
}

const validationSchema = Yup.object({
  // clientTitle: Yup.string()
  //   .required("Title is required"),

  // clientFirstName: Yup.string()
  //   .required("First name is required")
  //   .min(2, "First name must be at least 2 characters"),

  // clientSurname: Yup.string()
  //   .required("Surname is required")
  //   .min(2, "Surname must be at least 2 characters"),

  // address: Yup.string()
  //   .required("Address is required"),

  // postcode: Yup.string()
  //   .required("Postcode is required"),

  // homeTelephone: Yup.string()
  //   .required("Home telephone is required"),

  // mobileTelephone: Yup.string()
  //   .required("Mobile telephone is required"),

  // email: Yup.string()
  //   .email("Invalid email address")
  //   .required("Email is required"),

  // vehiclePaymentBeneficiary: Yup.string()
  //   .required("Vehicle payment beneficiary is required"),
});

interface VehicleOwnerFormProps {
  claimData?: any;
  isEditMode?: boolean;
  handleNext?: (step: number, direction: string) => void;
  skipNext: boolean;
}

export interface VehicleOwnerDetailsHandle {
  submitForm: () => Promise<boolean>;
}



const VehicleOwnerDetails = forwardRef<any, VehicleOwnerFormProps>(({
  claimData,
  isEditMode,
  handleNext,
  skipNext
}, ref) => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [uploadModal, setUploadModal] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [data, setData] = useState();
  const [isEditing, setIsEditing] = useState(false)
  const [fieldError, setFieldError] = useState({})
  

  const { isClosed } = useSelector((state: any) => state.isClosed);
  const { id } = useParams();
  const searchParams = new URLSearchParams(window.location.search);
  const claimID = searchParams.get('claimid');

  const formikRef = useRef<any>(null);

  const [initialValues, setInitialValues] = useState<FormData>({
    clientTitle: "mr",
    clientFirstName: "",
    clientSurname: "",
    address: "",
    postcode: "",
    homeTelephone: "",
    mobileTelephone: "",
    email: "",
    vehiclePaymentBeneficiary: "",
  });

  const [jobId, setJobId] = useState("")

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);


  const handleUpload = async (uploadedFiles: any) => {
    setConfirming(true);
    try {
      const response = await uploadVCDocs(uploadedFiles, id || claimID);
      const jobId = response?.job_id;
      setJobId(jobId)
      setUploadModal(false);
      setLoading(true)
      toast.success("File uploaded successfully");
      await pollJobStatus(jobId);

    } catch (e) {
      toast.error("Unable to upload file");
    } finally {
      setConfirming(false);
    }
  };

  const pollJobStatus = async (jobId: string) => {
    const POLL_INTERVAL = 3000;
    const MAX_ATTEMPTS = 400;
  
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      try {
        const res = await checkStatusJob(jobId);  
        if (res.status === 'completed') {
          await fetchJobResult(jobId);
          return;
        }
  
        if (res.status === 'failed') {
          toast.error(res.error || 'Import job failed');
          return;
        }
  
        await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL));
  
      } catch (err) {
        console.error('Error checking job status:', err);
        toast.error('Error checking job status');
        return;
      }
    }
  
    toast.error('Timed out waiting for job completion');
  };
  

  const fetchJobResult = async (jobId: string) => {
    try {
      const res = await fetchJobResultCall(jobId);
      if (res.status === "completed") {
        handleSetInitialValues(res?.result?.vehicle_owner_detail, "v5");
        toast.success('Import completed successfully');
      } else if (res.status === 202) {
        toast.info('Job still processing...');
      } else if (res.status === 500) {
        const errorData = await res.json();
        toast.error(`Job failed: ${errorData.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Error fetching job result:', err);
      toast.error('Error fetching job result');
    } finally{
      setLoading(false)
    }
  };

  const handleSetInitialValues = (response: any, key: any) => {
    const details =
      response[0] ||
      {
        gender: response?.gender,
        first_name: response?.first_name,
        surname: response?.surname,
        address: response?.address?.address ?? response?.address,
        postcode: response?.address?.postcode ?? response?.postcode,
        email: response?.address?.email ?? response?.email,
        home_tel: response?.address?.home_tel ?? response?.home_tel,
        mobile_tel: response?.address?.mobile_tel ?? response?.mobile_tel,
        payment_benificiary: response?.payment_benificiary,
      };
    
    const updatedValues: FormData = {
      clientTitle: details.gender || "",
      clientFirstName: details.first_name || "",
      clientSurname: details.surname || "",
      address: details.address || "",
      postcode: details.postcode || "",
      homeTelephone: details.home_tel || "",
      mobileTelephone: details.mobile_tel || "",
      email: details.email || "",
      vehiclePaymentBeneficiary: details.payment_benificiary || "",
    };
  
    setInitialValues(updatedValues);
  
    // ✅ Validation should use `details`, not `response`
    if (key === 'v5') {
      const newErrors: Record<string, string> = {};
  
      if (!details.email) newErrors["email"] = "Low confidence OCR result - please verify.";
      if (!details.first_name) newErrors["clientFirstName"] = "Low confidence OCR result - please verify.";
      if (!details.surname) newErrors["clientSurname"] = "Low confidence OCR result - please verify.";
      if (!details.address) newErrors["address"] = "Low confidence OCR result - please verify.";
      if (!details.postcode) newErrors["postcode"] = "Low confidence OCR result - please verify.";
      if (!details.payment_benificiary) newErrors["vehiclePaymentBeneficiary"] = "Low confidence OCR result - please verify.";
      if (!details.home_tel) newErrors["homeTelephone"] = "Low confidence OCR result - please verify.";
      if (!details.mobile_tel) newErrors["mobileTelephone"] = "Low confidence OCR result - please verify.";
  
      setFieldError(newErrors);
    }
  };
  

const handleSubmit = async (values: FormData) => {
  setLoading(true);
  setSuccess(false);
  try {
    const payload = {
      gender: "mr",
      first_name: values.clientFirstName,
      surname: values.clientSurname,
      payment_benificiary: values.vehiclePaymentBeneficiary,
      claim_id: Number(id || claimID),
      tenant_id: 1,
      address: {
        address: values.address,
        postcode: values.postcode,
        home_tel: values.homeTelephone,
        mobile_tel: values.mobileTelephone,
        email: values.email,
      },
    };

    const storedClaimId = id || claimID
    let response
    if(storedClaimId && isEditing){
        response = await updateVehicleOwner(payload, storedClaimId)
    } else{
        response = await VehicleOwnersApi.createVehicleOwner(payload);

    }

    setSuccess(true);
    toast.success("Vehicle owner details saved successfully!");

    if (handleNext && !skipNext) {
      handleNext(7, "next");
    }

  } catch (error) {
    console.error("Error saving vehicle owner details:", error);
    toast.error("Failed to save vehicle owner details");
  } finally {
    setLoading(false);
  }
};

 useEffect(() => {
  if (id || claimID) {
    const fetchOwner = async () => {
      try {
        const ownerData = await getVehicleOwner((id || claimID));
        setData(ownerData)
        setInitialValues({
          clientTitle: ownerData?.gender,
          clientFirstName: ownerData?.first_name,
          clientSurname: ownerData?.surname,
          email:ownerData?.address?.email,
          homeTelephone: ownerData?.address?.home_tel,
          mobileTelephone: ownerData?.address?.mobile_tel,
          vehiclePaymentBeneficiary: ownerData?.payment_benificiary,
          address: ownerData?.address?.address,
          postcode: ownerData?.address?.postcode
        })
        setIsEditing(true)
      } catch (err) {
        setIsEditing(false)
        console.error("Error fetching vehicle owner details:", err);
      }
    };
    fetchOwner();
  } else {
    console.warn("⚠️ No id found in route params. Check your <Route path> definition.");
  }
}, [id]);


  useImperativeHandle(ref, () => ({
    submitForm: async () => {
      if (!formikRef.current) {
          throw new Error('Formik instance not available');
      }
      await formikRef.current.submitForm();
      return true;
    }
  }));

  const getFieldError = (fieldName: keyof FormData, formik: any) =>
    formik.touched[fieldName] && formik.errors[fieldName] ? (
      <div className="text-red-500 text-xs mt-1">{formik.errors[fieldName]}</div>
    ) : null;


    if (loading) {
      return (
        <div className={`flex justify-center items-center h-screen bg-gray-50`}>
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      );
    }

  return (
    <>
      <Formik
        innerRef={formikRef}
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
        enableReinitialize
      >
        {(formik) => {
          const { setFieldValue } = formik;
          return (
            <Form className="sm:pt-8 pb-8 sm:pb-12 sm:pr-4 lg:pr-10 bg-white mt-2">
              {/* HEADER */}
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-lg font-semibold  mb-2 sm:text-xl">
                    Vehicle Owner Details
                  </h1>
                  <p className="text-sm text-gray-600 mb-4 sm:mb-6">
                    Enter the vehicle owner details below.
                  </p>
                </div>
                <div className="flex gap-4 items-center">
                  <button
                    type="button"
                    onClick={() => setUploadModal(true)}
                    className="px-4 py-2 bg-white-600 text-gray-800 rounded-lg hover:bg-gray-100 focus:outline-none border focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
                  >
                    Upload V5C File
                  </button>
                </div>
              </div>

              {/* Client Name */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-4 sm:mb-6">
                <label className="w-full sm:w-1/4 text-sm font-medium text-gray-700">
                  Client Name
                </label>
                <div className="flex flex-col sm:flex-row w-full sm:w-3/4 gap-2 sm:gap-3">
                  <Field name="clientTitle">
                    {({ field, form, meta }: any) => {
                      const titleOptions = [
                        { value: "mr", label: "Mr." },
                        { value: "mrs", label: "Mrs." },
                        { value: "ms", label: "Ms." },
                      ];
                      return (
                        <div className="w-full sm:w-1/6">
                          <CustomSelect
                            options={titleOptions}
                            value={
                              titleOptions.find((opt) => opt.value === field.value) ||
                              titleOptions[0]
                            }
                            onChange={(option) =>
                              form.setFieldValue(field.name, option ? option.value : "")
                            }
                            disabled={isClosed}
                          />
                          {meta.touched && meta.error && (
                            <div className="text-red-500 text-xs mt-1">{meta.error}</div>
                          )}
                        </div>
                      );
                    }}
                  </Field>

                  <div className="flex-1">
                    <Field
                      type="text"
                      name="clientFirstName"
                      placeholder="First Name"
                      style={{ height: "44px" }}
                      disabled={isClosed}
                      className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg bg-white hover:border-gray-400 focus:ring-2 focus:ring-custom-200 focus:outline-none  text-sm sm:text-base"
                    />
                    {/* {getFieldError("clientFirstName", formik)} */}
                    {fieldError["clientFirstName"] && formik.values.clientFirstName === "" ? <p className='text-red-500 text-xs'>{fieldError["clientFirstName"]}</p> : ''}
                                          <ErrorMessage name="clientFirstName" component="div" className="text-red-500 text-xs mt-1" />
                  </div>
                  <div className="flex-1">
                    <Field
                      type="text"
                      name="clientSurname"
                      placeholder="Surname"
                      style={{ height: "44px" }}
                      disabled={isClosed}
                      className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg bg-white hover:border-gray-400 focus:ring-2 focus:ring-custom-200 focus:outline-none  text-sm sm:text-base"
                    />

                    {/* {getFieldError("clientSurname", formik)} */}
                       {fieldError["clientSurname"] && formik.values.clientSurname === "" ? <p className='text-red-500 text-xs'>{fieldError["clientSurname"]}</p> : ''}
                                          <ErrorMessage name="clientSurname" component="div" className="text-red-500 text-xs mt-1" />
                    
                  </div>
                </div>
              </div>

              {/* Address */}
              <div className="flex flex-col sm:flex-row sm:items-start gap-2 mb-4">
                <label className="w-full sm:w-1/4 text-sm font-medium text-gray-700">
                  Address
                </label>
                <div className="w-full sm:w-3/4">
                  <LeafletAutocompleteMap
                    showMap={false}
                    apiKey={import.meta.env.VITE_GOOGLE_MAP_KEY}
                    address={formik.values.address}
                    onPlaceSelected={(place) => {
                      if (place.name) {
                        setFieldValue("address", place.address || place.name || "");
                        setFieldValue("postcode", place?.postalCode);
                      }
                    }}
                    disabled={isClosed}
                  />

                   {fieldError["address"] && formik.values.address === "" ? <p className='text-red-500 text-xs'>{fieldError["address"]}</p> : ''}
                                          <ErrorMessage name="address" component="div" className="text-red-500 text-xs mt-1" />
                  
                </div>
              </div>

              {/* Postcode */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-4">
                <label className="w-full sm:w-1/4 text-sm font-medium text-gray-700">
                  Postcode
                </label>
                <div className="relative w-full sm:w-3/4">
                  <Field
                    name="postcode"
                    type="text"
                    style={{ height: "44px" }}
                    disabled={isClosed}
                    className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg bg-white hover:border-gray-400 focus:ring-2 focus:ring-custom-200 focus:outline-none  text-sm sm:text-base"
                  />
                 
                   {fieldError["postcode"] && formik.values.postcode === "" ? <p className='text-red-500 text-xs'>{fieldError["postcode"]}</p> : ''}
                                          <ErrorMessage name="postcode" component="div" className="text-red-500 text-xs mt-1" />
                </div>
              </div>

              {/* Home Telephone */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-4 sm:mb-6">
                <label className="w-full sm:w-1/4 text-sm font-medium text-gray-700">
                  Home Telephone
                </label>
                <div className="w-full sm:w-3/4">
                  <Field name="homeTelephone">
                    {({ field, form, meta }: any) => (
                      <div className="w-full sm:w-3/4">
                        <PhoneInput
                          country="gb"
                          placeholder='+44'
                          value={field.value}
                          onChange={(value) => form.setFieldValue(field.name, value)}
                          inputStyle={{ width: "134%", height: "44px",fontSize: '16px' }}
                          disabled={isClosed}
                        />
                        {meta.touched && meta.error && (
                          <div className="text-red-500 text-xs mt-1">{meta.error}</div>
                        )}
                      </div>
                    )}
                  </Field>
                     {fieldError["homeTelephone"] && formik.values.homeTelephone === "" ? <p className='text-red-500 text-xs'>{fieldError["homeTelephone"]}</p> : ''}
                                          <ErrorMessage name="homeTelephone" component="div" className="text-red-500 text-xs mt-1" />
                </div>
              </div>

              {/* Mobile Telephone */}
              <div className="flex sm:items-center gap-2">
                <label className="w-full sm:w-1/4 text-sm font-medium text-gray-700">
                  Mobile Number
                </label>
                <div className="w-full sm:w-3/4">
                  <Field name="mobileTelephone">
                    {({ field, form, meta }: any) => (
                      <div className="w-full sm:w-3/4">
                        <PhoneInput
                          country="gb"
                          value={field.value}
                          placeholder='+44'
                          onChange={(value) => form.setFieldValue(field.name, value)}
                          inputStyle={{ width: "134%", height: "44px", fontSize: '16px' }}
                          disabled={isClosed}
                        />
                        {meta.touched && meta.error && (
                          <div className="text-red-500 text-xs mt-1">{meta.error}</div>
                        )}
                      </div>
                    )}
                  </Field>
                        {fieldError["mobileTelephone"] && formik.values.mobileTelephone === "" ? <p className='text-red-500 text-xs'>{fieldError["mobileTelephone"]}</p> : ''}
                                          <ErrorMessage name="mobileTelephone" component="div" className="text-red-500 text-xs mt-1" />
                  
                </div>
              </div>

              {/* Email */}
              <div className="flex flex-col mt-4 sm:flex-row sm:items-center gap-2 mb-6 sm:mb-2">
                <label className="w-full sm:w-1/4 text-sm font-medium text-gray-700">
                  Email
                </label>
                <div className="relative w-full sm:w-3/4">
                  <Field
                    type="email"
                    name="email"
                    style={{ height: "44px" }}
                    disabled={isClosed}
                    className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg bg-white hover:border-gray-400 focus:ring-2 focus:ring-custom-200 focus:outline-none  text-sm sm:text-base"
                  />
                  <div className="absolute right-3 top-[22px] transform -translate-y-1/2 text-gray-500">
                    <Mail className="h-4 w-4" />
                  </div>

                  {fieldError["email"] && formik.values.email === "" ? <p className='text-red-500 text-xs'>{fieldError["email"]}</p> : ''}
                                          <ErrorMessage name="email" component="div" className="text-red-500 text-xs mt-1" />
                </div>
              </div>

              {/* Vehicle Payment Beneficiary */}
              <div className="flex flex-col mt-4 sm:flex-row sm:items-center gap-2 mb-6 sm:mb-2">
                <label className="w-full sm:w-1/4 text-sm font-medium text-gray-700">
                  Vehicle Payment Beneficiary
                </label>
                <div className="relative w-full sm:w-3/4">
                  <Field
                    type="text"
                    name="vehiclePaymentBeneficiary"
                    // style={{ height: "44px" }}
                    disabled={isClosed}
                    placeholder="Enter beneficiary name"
                    className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg bg-white hover:border-gray-400 focus:ring-2 focus:ring-custom-200 focus:outline-none  text-sm sm:text-base"
                  />
                  {getFieldError("vehiclePaymentBeneficiary", formik)}
                </div>
              </div>

              {/* Success */}
              {success && (
                <div className="mx-6 mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
                  Vehicle owner details saved successfully!
                </div>
              )}
            </Form>
          );
        }}
      </Formik>

      <UploadCSV5Modal
        isOpen={uploadModal}
        onClose={() => setUploadModal(false)}
        onUpload={handleUpload}
        confirming={confirming}
      />
    </>
  );
});

VehicleOwnerDetails.displayName = "VehicleOwnerDetails";

export default VehicleOwnerDetails;
