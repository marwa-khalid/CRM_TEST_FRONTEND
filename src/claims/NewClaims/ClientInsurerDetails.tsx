import React, {
  useState,
  useEffect,
  forwardRef,
  useImperativeHandle,
  useRef,
} from "react";
import { ChevronDown, Mail } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import {
  getReferrer,
  createReferrer,
  getCompanySuggestions,
  updateReferrer,
} from "../../services/Referrer/Referrer";
import LeafletAutocompleteMap from "../GoogleMapAutoComplete/GoogleMapAutoComplete";
import debounce from "lodash.debounce";
import CustomSelect from "../ReactSelect/ReactSelect";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import { FaArrowRight } from "react-icons/fa6";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import {
  createClientInsurer,
  getClientInsurer,
  getCoverLevels,
  getPolicyTypes,
  updateClientInsurer,
} from "../../services/ClientInsurer/ClientInsurer";
import { values } from "lodash";
import { getVehicleOwner } from "../../services/VehicleOwner/VehicleOwner";

interface FormValues {
  claim_id?: number;
  companyName: string;
  address: string;
  postcode: string;
  telephoneMain: string;
  email: string;
  reference: string;
  policy_number: string;
  policy_holder: string;
  type_of_policy: string;
  no_of_additional_driver: string;
  no_of_vehicles_policy: string;
  no_of_vehicles_use: string;
  policy_cover_level: string;
  policy_cover_excess: string;
  sdp: boolean;
  private_hire: boolean;
}

interface Company {
  id: string;
  name: string;
}

interface ClientInsurerDetailsProps {
  claimData?: any;
  isEditMode?: boolean;
  onSuccess?: () => void;
  handleNext?: (step: number, direction: string) => void;
  skipNext: boolean;
}

const validationSchema = Yup.object().shape({
  // companyName: Yup.string().required('Company name is required'),
  // address: Yup.string().required('Address is required'),
  // postcode: Yup.string().required('Postcode is required'),
  // telephoneMain: Yup.string().required('Telephone is required'),
  // email: Yup.string().email('Invalid email format').required('Email is required'),
  // reference: Yup.string().required('Reference is required'),
  // policy_number: Yup.string().required('Policy number is required'),
  // policy_holder: Yup.string().required('Policy holder is required'),
  // type_of_policy: Yup.string().required('Type of policy is required'),
  // no_of_additional_driver: Yup.number()
  //   .typeError('Must be a number')
  //   .required('Number of additional drivers is required'),
  // no_of_vehicles_policy: Yup.number()
  //   .typeError('Must be a number')
  //   .required('Number of vehicles on policy is required'),
  // no_of_vehicles_use: Yup.number()
  //   .typeError('Must be a number')
  //   .required('Number of vehicles in use is required'),
  // policy_cover_level: Yup.string().required('Policy cover level is required'),
  // policy_cover_excess: Yup.string().required('Policy cover excess is required'),
  // sdp: Yup.boolean(),
  // private_hire: Yup.boolean(),
});

const ClientInsurerDetails = forwardRef(
  ({ onSuccess, handleNext, skipNext }: ClientInsurerDetailsProps, ref) => {
    const { isClosed } = useSelector((state) => state.isClosed);
    const formikRef = useRef<any>(null);

    const searchParams = new URLSearchParams(window.location.search);
    const claimID = searchParams.get("claimid");
    const { id } = useParams();

    const [initialValues, setInitialValues] = useState<FormValues>({
      claim_id: claimID,
      companyName: "",
      address: "",
      postcode: "",
      telephoneMain: "",
      email: "",
      reference: "",
      policy_number: "",
      policy_holder: "",
      type_of_policy: "",
      no_of_additional_driver: "",
      no_of_vehicles_policy: "",
      no_of_vehicles_use: "",
      policy_cover_level: "",
      policy_cover_excess: "",
      sdp: false,
      private_hire: false,
    });
    const [suggestions, setSuggestions] = useState<Company[]>([]);
    const [typing, setTyping] = useState(false);
    const [loadingSuggestions, setLoadingSuggestions] = useState(false);
    const [policyTypes, setPolicyTypes] = useState([]);
    const [coverLevels, setCoverLevels] = useState([]);
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
      fetchPolicyTypes();
      fetchCoverLevels();
      fetchClientInsurer();
    }, []);

    useEffect(() => {
      window.scrollTo(0, 0);
    }, []);

    const fetchClientInsurer = async () => {
      try {
        const res = await getClientInsurer(id || claimID);

        setInitialValues((prev) => ({
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
        setIsEditing(true);
      } catch (e) {
        setIsEditing(false);
      }
    };

    const fetchPolicyTypes = async () => {
      try {
        const response = await getPolicyTypes();
        setPolicyTypes(response);
      } catch (e) {}
    };

    const fetchCoverLevels = async () => {
      try {
        const response = await getCoverLevels();
        setCoverLevels(response);
      } catch (e) {}
    };

    const handleSubmit = async (values: any) => {
      try {
        const payload = {
          company_name: values.companyName,
          reference: values?.reference,
          policy_number: values?.policy_number,
          policy_holder: values?.policy_holder,
          policy_type_id: values?.type_of_policy,
          policy_cover_id: values?.policy_cover_level,
          currency: "GBP",
          policy_cover_excess: values?.policy_cover_excess,
          sdp: values.sdp,
          number_of_additional_driver: values?.no_of_additional_driver,
          number_vehicle_on_policy: values?.no_of_vehicles_policy,
          number_vehicle_in_use: values?.no_of_vehicles_use,
          private_hire: values?.private_hire,
          claim_id: claimID || id,
          address: {
            address: values?.address,
            postcode: values?.postcode,
            mobile_tel: values?.telephoneMain,
            email: values?.email,
          },
        };
        let res;
        if ((id || claimID) && isEditing) {
          res = await updateClientInsurer(payload, id || claimID);
          toast.success("Client Insurer and Broker updated successfully");
        } else {
          res = await createClientInsurer(payload);
          toast.success("Client Insurer and Broker created successfully ");
        }
        if (handleNext && !skipNext) {
          handleNext(10, "next");
        }
      } catch (e) {
        toast.error("Unable to create Client Insurer and Broker");
      }
    };

    const fetchSuggestions = debounce(async (query: string) => {
      if (!query) {
        setSuggestions([]);
        return;
      }
      setLoadingSuggestions(true);
      try {
        const response = await getCompanySuggestions(query);
        const rawSuggestions = response.data || response;

        const uniqueByCompany = rawSuggestions.filter(
          (item: any, index: number, self: any[]) =>
            index ===
            self.findIndex(
              (s) =>
                s.company_name?.toLowerCase() ===
                item.company_name?.toLowerCase()
            )
        );

        setSuggestions(uniqueByCompany);
      } catch (error) {
        console.error("Failed to fetch company suggestions:", error);
        setSuggestions([]);
      } finally {
        setLoadingSuggestions(false);
      }
    }, 300);

    useImperativeHandle(ref, () => ({
      submitForm: async () => {
        if (!formikRef.current) {
          console.error("❌ Formik ref is NULL");
          throw new Error("Formik instance not available");
        }
        await formikRef.current.submitForm();
        return true;
      },
    }));

    const getVehicleOwnerPolicy = async (setFieldValue: any) => {
      try {
        const ownerData = await getVehicleOwner(id || claimID);
        const fullName = `${ownerData?.first_name || ""} ${
          ownerData?.surname || ""
        }`.trim();
        setFieldValue("policy_holder", fullName);
        // setInitialValues((prev) => ({
        //   ...prev,
        //   policy_holder: fullName,
        // }));
      } catch (err) {
        console.error("Error fetching vehicle owner details:", err);
      }
    };

    const formatToTwoDecimals = (value: string): string => {
      if (value === "" || value === null || value === undefined) return "";

      const num = parseFloat(value);
      if (isNaN(num)) return value;

      return num.toFixed(2);
    };

    return (
      <div className=" sm:pt-8 pb-8 sm:pb-12 sm:pr-4 lg:pr-10 bg-white">
        <Formik
          innerRef={formikRef}
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
          enableReinitialize
        >
          {({ values, setFieldValue, handleBlur }) => {
            const handleNumberBlur = (
              e: React.FocusEvent<HTMLInputElement>,
              fieldName: string
            ) => {
              const value = e.target.value;
              if (value) {
                const formatted = formatToTwoDecimals(value);
                setFieldValue(fieldName, formatted);
              }
              handleBlur(e);
            };
            const selectedPolicy = policyTypes.find(
              (p) => p.id === values.type_of_policy
            );
            const isFleet = selectedPolicy?.label === "Fleet";
            const handleSelect = (company: Company) => {
              const newValues = {
                address: company.address || "",
                companyName: company.company_name || "",
                email: company.contact_email || "",
                postcode: company.postcode || "",
                telephoneMain: company.primary_contact_number || "",
              };

              Object.entries(newValues).forEach(([key, value]) => {
                setFieldValue(key, value);
              });

              setInitialValues((prev) => ({
                ...prev,
                ...newValues,
              }));

              setSuggestions([]);
              setTyping(false);
            };

            return (
              <Form>
                <Field type="hidden" name="referrer_id" />
                <Field type="hidden" name="claim_id" />

                <div className="flex-1 p-0 sm:p-0 mt-4">
                  {/* Referrer & Reporting Details Section */}
                  <div className="bg-white mb-6">
                    <div className="p-0 border-b border-gray-200 flex justify-between">
                      <div>
                        <h2 className="text-lg font-weight-600  mb-2 sm:text-xl">
                          Client Insurer Details
                        </h2>
                        <p className="text-sm text-gray-600">
                          Please provide the client insurer details
                        </p>
                      </div>
                      <div className="mr-[-20px]">
                        <button
                          type="button"
                          onClick={() => getVehicleOwnerPolicy(setFieldValue)}
                          className="px-4 py-2 bg-white-600 text-gray-800 rounded-lg hover:bg-gray-100 focus:outline-none border focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
                        >
                          Vehicle Owner
                        </button>
                      </div>
                    </div>
                    <div className="w-[102%]">
                      <div className="">
                        <Field name="companyName">
                          {({ field, form, meta }: any) => (
                            <div
                              className="flex flex-col mt-2 sm:flex-row sm:items-center"
                              style={{ height: "100px" }}
                            >
                              <label className="w-full sm:w-1/4 text-sm font-medium text-gray-700">
                                Company Name
                              </label>
                              <div className="w-full ml-2 sm:w-3/4 relative">
                                <input
                                  type="text"
                                  {...field}
                                  onChange={(e) => {
                                    const value = e.target.value;
                                    field.onChange(e);
                                    fetchSuggestions(value);
                                    setTyping(!!value);
                                  }}
                                  onFocus={() => {
                                    if (field.value && !suggestions.length) {
                                      fetchSuggestions(field.value);
                                    }
                                    setTyping(!!field.value);
                                  }}
                                  onBlur={() => {
                                    setTimeout(() => {
                                      setSuggestions([]);
                                      setTyping(false);
                                    }, 150);
                                  }}
                                  placeholder="Type company name"
                                  disabled={isClosed}
                                  className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg bg-white hover:border-gray-400 focus:outline-none text-sm sm:text-base"
                                  style={{ height: "44px" }}
                                />

                                {/* Custom Suggestions Dropdown */}
                                {suggestions.length > 0 && typing && (
                                  <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
                                    {loadingSuggestions ? (
                                      <div className="px-4 py-3 text-gray-400 text-sm">
                                        Loading...
                                      </div>
                                    ) : (
                                      suggestions.map((company) => (
                                        <div
                                          key={company.id}
                                          className="px-4 py-3 cursor-pointer border-b border-gray-100 last:border-b-0 hover:bg-[#252B37] transition-colors duration-150 group"
                                          onMouseDown={(e) => {
                                            e.preventDefault();
                                            form.setFieldValue(
                                              "companyName",
                                              company.company_name || ""
                                            );
                                            handleSelect(company);
                                            setSuggestions([]);
                                            setTyping(false);
                                          }}
                                        >
                                          <div className="font-medium text-gray-900 group-hover:text-white">
                                            {company.company_name}
                                          </div>
                                          {company.address && (
                                            <div className="text-sm text-gray-600 truncate group-hover:text-white">
                                              {company.address}
                                            </div>
                                          )}
                                        </div>
                                      ))
                                    )}
                                  </div>
                                )}

                                {meta.touched && meta.error && (
                                  <div className="text-red-500 text-xs mt-1">
                                    {meta.error}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </Field>

                        <div className="flex flex-col sm:flex-row sm:items-start gap-2 mb-4">
                          <label className="w-full sm:w-1/4 text-sm font-medium text-gray-700">
                            Address
                          </label>
                          <div className="w-full sm:w-3/4">
                            <LeafletAutocompleteMap
                              showMap={false}
                              apiKey={import.meta.env.VITE_GOOGLE_MAP_KEY}
                              address={initialValues.address}
                              onPlaceSelected={(place) => {
                                if (place.name) {
                                  setFieldValue("address", place.address);
                                  setFieldValue("postcode", place?.postalCode);
                                }
                              }}
                              disabled={isClosed}
                            />
                            <ErrorMessage
                              name="address"
                              component="div"
                              className="text-red-500 text-xs mt-1"
                            />
                          </div>
                        </div>

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
                              className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg bg-white hover:border-gray-400 focus:outline-none  text-sm sm:text-base"
                            />
                            <ErrorMessage
                              name="postcode"
                              component="div"
                              className="text-red-500 text-xs mt-1"
                            />
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-4 sm:mb-6">
                          <label className="w-full sm:w-1/4 text-sm font-medium text-gray-700">
                            Telephone
                          </label>
                          <div className="w-full sm:w-3/4">
                            <Field name="telephoneMain">
                              {({ field, form, meta }: any) => (
                                <div className="w-full">
                                  <PhoneInput
                                    country="gb"
                                    placeholder="+44"
                                    value={field.value}
                                    onChange={(value) =>
                                      form.setFieldValue(field.name, value)
                                    }
                                    inputStyle={{
                                      width: "100%", 
                                      height: "44px",
                                      fontSize: "16px",
                                    }}
                                    containerStyle={{
                                      width: "100%", // ✅ ensure responsive container
                                    }}
                                    disabled={isClosed}
                                  />
                                  {meta.touched && meta.error && (
                                    <div className="text-red-500 text-xs mt-1">
                                      {meta.error}
                                    </div>
                                  )}
                                </div>
                              )}
                            </Field>
                          </div>
                        </div>
                      </div>

                      <div>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-4">
                          <label className="w-full sm:w-1/4 text-sm font-medium text-gray-700">
                            Email
                          </label>
                          <div className="relative w-full sm:w-3/4">
                            <Field
                              name="email"
                              type="email"
                              style={{ height: "44px" }}
                              disabled={isClosed}
                              className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg bg-white hover:border-gray-400 focus:outline-none  text-sm sm:text-base"
                            />
                            <div className="absolute right-3 top-1/3 transform -translate-y-1/2 text-gray-500">
                              <a
                                href="https://outlook.office.com/mail/deeplink/compose?to=usaleem651@gmail.com"
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <Mail className="h-4 w-4 mt-3" />
                              </a>
                            </div>
                            <ErrorMessage
                              name="email"
                              component="div"
                              className="text-red-500 text-xs mt-1"
                            />
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-4">
                          <label className="w-full sm:w-1/4 text-sm font-medium text-gray-700">
                            Reference
                          </label>
                          <div className="relative w-full sm:w-3/4">
                            <Field
                              name="reference"
                              type="text"
                              style={{ height: "44px" }}
                              disabled={isClosed}
                              className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg bg-white hover:border-gray-400 focus:outline-none  text-sm sm:text-base"
                            />
                            <ErrorMessage
                              name="reference"
                              component="div"
                              className="text-red-500 text-xs mt-1"
                            />
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-4">
                          <label className="w-full sm:w-1/4 text-sm font-medium text-gray-700">
                            Policy Number
                          </label>
                          <div className="relative w-full sm:w-3/4">
                            <Field
                              name="policy_number"
                              type="text"
                              style={{ height: "44px" }}
                              disabled={isClosed}
                              className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg bg-white hover:border-gray-400 focus:outline-none  text-sm sm:text-base"
                            />
                            <ErrorMessage
                              name="reference"
                              component="div"
                              className="text-red-500 text-xs mt-1"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    <hr className="text-slate-300" />
                  </div>

                  {/* Driver Commission Payments Section */}
                  <div className="bg-white border-b border-gray-200 mb-6">
                    <div className="border-b border-gray-200">
                      <h2 className="text-lg font-weight-600 text-gray-900 mb-2">
                        Cover Details
                      </h2>
                      <p className="text-sm mb-2 text-gray-600">
                        Enter cover details
                      </p>
                    </div>

                    <div className="py-6 w-[102%]">
                      <div className="grid gap-8">
                        <div>
                          {/* On Hire Payment */}
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-4">
                            <label className="w-full sm:w-1/4 text-sm font-medium text-gray-700">
                              Policy Holder
                            </label>
                            <div className="relative w-full sm:w-3/4">
                              <Field
                                name="policy_holder"
                                type="text"
                                style={{ height: "44px" }}
                                disabled={isClosed}
                                className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg bg-white hover:border-gray-400 focus:outline-none  text-sm sm:text-base"
                              />
                              <ErrorMessage
                                name="policy_holder"
                                component="div"
                                className="text-red-500 text-xs mt-1"
                              />
                            </div>
                          </div>

                          {/* Paid On */}
                          <Field name="type_of_policy">
                            {({ field, form }: any) => {
                              return (
                                <div className="flex flex-col sm:flex-row items-start mt-4 mb-4 group relative">
                                  <label className="w-full sm:w-1/4 my-4 text-sm font-medium text-gray-700">
                                    Type of Policy
                                  </label>
                                  <div
                                    className="w-full sm:w-3/4 relative"
                                    // style={{
                                    //   width: "826px",
                                    //   marginLeft: "10px",
                                    // }}
                                  >
                                    <CustomSelect
                                      options={policyTypes.map((c: any) => ({
                                        value: c.id,
                                        label: c.label,
                                      }))}
                                      placeholder="Select type of policy"
                                      value={
                                        policyTypes
                                          .map((c: any) => ({
                                            value: c.id,
                                            label: c.label,
                                          }))
                                          .find(
                                            (opt: any) =>
                                              opt.value === field.value
                                          ) || null
                                      }
                                      onChange={(opt) => {
                                        form.setFieldValue(
                                          "type_of_policy",
                                          opt?.value || ""
                                        );
                                      }}
                                      className={`w-full rounded-lg bg-white hover:border-gray-400 `}
                                    />
                                  </div>
                                </div>
                              );
                            }}
                          </Field>

                          {isFleet ? (
                            <>
                              <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-4">
                                <label className="w-full sm:w-1/4 text-sm font-medium text-gray-700">
                                  Number of Addition Drivers
                                </label>
                                <div className="relative w-full sm:w-3/4">
                                  <Field
                                    name="no_of_additional_driver"
                                    type="text"
                                    style={{ height: "44px" }}
                                    disabled={isClosed}
                                    className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg bg-white hover:border-gray-400 focus:outline-none  text-sm sm:text-base"
                                  />
                                  <ErrorMessage
                                    name="no_of_additional_driver"
                                    component="div"
                                    className="text-red-500 text-xs mt-1"
                                  />
                                </div>
                              </div>

                              {/* Other Charges */}
                              <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-4">
                                <label className="w-full sm:w-1/4 text-sm font-medium text-gray-700">
                                  Number of Vehicles on Policy
                                </label>
                                <div className="relative w-full sm:w-3/4">
                                  <Field
                                    name="no_of_vehicles_policy"
                                    type="text"
                                    style={{ height: "44px" }}
                                    disabled={isClosed}
                                    className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg bg-white hover:border-gray-400 focus:outline-none  text-sm sm:text-base"
                                  />
                                  <ErrorMessage
                                    name="no_of_vehicles_policy"
                                    component="div"
                                    className="text-red-500 text-xs mt-1"
                                  />
                                </div>
                              </div>

                              {/* Off Hire Payment */}
                              <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-4">
                                <label className="w-full sm:w-1/4 text-sm font-medium text-gray-700">
                                  Number of Vehicles in Use
                                </label>
                                <div className="relative w-full sm:w-3/4">
                                  <Field
                                    name="no_of_vehicles_use"
                                    type="text"
                                    style={{ height: "44px" }}
                                    disabled={isClosed}
                                    className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg bg-white hover:border-gray-400 focus:outline-none  text-sm sm:text-base"
                                  />
                                  <ErrorMessage
                                    name="no_of_vehicles_use"
                                    component="div"
                                    className="text-red-500 text-xs mt-1"
                                  />
                                </div>
                              </div>
                            </>
                          ) : (
                            ""
                          )}

                          {/* Off Hire Paid On */}
                          <Field name="policy_cover_level">
                            {({ field, form }: any) => {
                              return (
                                <div className="flex flex-col sm:flex-row items-start mt-4 mb-4 group relative">
                                  <label className="w-full sm:w-1/4 my-4 text-sm font-medium text-gray-700">
                                    Policy Cover Level
                                  </label>
                                  <div
                                    className="w-full sm:w-3/4 relative"
                                    // style={{
                                    //   width: "826px",
                                    //   marginLeft: "10px",
                                    // }}
                                  >
                                    <CustomSelect
                                      options={coverLevels.map((c: any) => ({
                                        value: c.id,
                                        label: c.label,
                                      }))}
                                      placeholder="Select policy cover level"
                                      value={
                                        coverLevels
                                          .map((c: any) => ({
                                            value: c.id,
                                            label: c.label,
                                          }))
                                          .find(
                                            (opt: any) =>
                                              opt.value === field.value
                                          ) || null
                                      }
                                      onChange={(opt) => {
                                        form.setFieldValue(
                                          "policy_cover_level",
                                          opt?.value || ""
                                        );
                                      }}
                                      className={`w-full rounded-lg bg-white hover:border-gray-400 `}
                                    />
                                  </div>
                                </div>
                              );
                            }}
                          </Field>

                          <div className="flex flex-col sm:flex-row sm:items-start mb-4">
                            <label className="w-full sm:w-1/4 mr-4 text-sm font-medium text-gray-700">
                              Policy Cover Excess
                            </label>
                            <div className="flex flex-col sm:flex-row w-full sm:w-3/4 gap-2">
                              <div className="flex flex-1 border border-gray-300 rounded-lg bg-white h-10 sm:h-12">
                                <div className="flex items-center px-2 sm:px-3 rounded-lg">
                                  <span className="text-sm sm:text-base">
                                    £
                                  </span>
                                </div>
                                <Field name="policy_cover_excess">
                                  {({ field, form }) => {
                                    return (
                                      <input
                                        {...field}
                                        type="text"
                                        step={"0.01"}
                                        disabled={isClosed}
                                        placeholder="0.00"
                                        className="flex-1 p-2 sm:p-3 text-sm sm:text-base focus:outline-none"
                                        onBlur={(
                                          e: React.FocusEvent<HTMLInputElement>
                                        ) =>
                                          handleNumberBlur(
                                            e,
                                            "policy_cover_excess"
                                          )
                                        }
                                      />
                                    );
                                  }}
                                </Field>

                                {/* <div className="relative w-[110px] sm:w-[130px]">
                                                                <select disabled={isClosed} className="w-full h-full px-2 sm:px-3 rounded-lg bg-white appearance-none cursor-pointer">
                                                                    <option>GBP</option>
                                                                </select>
                                                                <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-gray-500 pointer-events-none" />
                                                            </div> */}
                              </div>
                              {/* {getFieldError("salvageAmount", formik)} */}
                            </div>
                          </div>
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-4 sm:mb-6">
                            <label className="w-full sm:w-1/4 text-sm font-medium text-gray-700"></label>
                            <div className="w-full sm:w-3/4 flex gap-4">
                              <label className="flex items-center">
                                <Field
                                  type="checkbox"
                                  name="sdp"
                                  disabled={isClosed}
                                  className="w-4 h-4 accent-[#00249c] border-gray-300 focus:ring-custom-500"
                                />
                                <span className="ml-2 text-sm text-gray-700">
                                  SDP
                                </span>
                              </label>
                              <label className="flex items-center">
                                <Field
                                  type="checkbox"
                                  name="private_hire"
                                  disabled={isClosed}
                                  className="w-4 h-4 accent-[#00249c] border-gray-300 focus:ring-custom-500"
                                />
                                <span className="ml-2 text-sm text-gray-700">
                                  Private Hire/Hackney
                                </span>
                              </label>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Form>
            );
          }}
        </Formik>
      </div>
    );
  }
);

ClientInsurerDetails.displayName = "ReferrerDetails";

export default ClientInsurerDetails;
