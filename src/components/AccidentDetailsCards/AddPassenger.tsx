import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { useSelector } from "react-redux";
import { UserPlus2,Mail } from "lucide-react";
import CustomSelect from "../ReactSelect/ReactSelect";
import LeafletAutocompleteMap from "../GoogleMapAutoComplete/GoogleMapAutoComplete";
import PhoneInput from 'react-phone-input-2';
import {
  createPassenger,
  getPassengerByPassengerId,
  updatePassenger
} from '../../services/Accidents/Cards/cards';
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { MdOutlineClose } from "react-icons/md";

interface AddPassengerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (passenger: any) => void;
  editingPassengerId?: number | null;
}

const AddPassengerModal = ({
  isOpen,
  onClose,
  editingPassengerId,
}: AddPassengerModalProps) => {
  const isClosed = useSelector((state: any) => state.isClosed?.isClosed);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const claimId = useSelector((state: any) => state.isClosed?.claimId);
  const { id } = useParams()

  const [apiError, setApiError] = useState<string | null>(null);
  const [initialValues, setInitialValues] = useState({
    title: "mr",
    first_name: "",
    surname: "",
    address: "",
    postcode: "",
    mobile_tel: "",
    email: "",
    gender: "male",
  })

  const validationSchema = Yup.object().shape({
    // first_name: Yup.string().required("First name is required"),
    // surname: Yup.string().required("Surname is required"),
    // address: Yup.string().required("Address is required"),
    // postcode: Yup.string().required("Postcode is required"),
    // mobile_tel: Yup.string().required("Phone number is required"),
    // email: Yup.string().email("Invalid email format").required("Email is required"),
    // gender: Yup.string().required("Gender is required"),
  });

  const handlePlaceSelected = (place: any, formik: any) => {
    if (formik) {
      formik.setFieldValue("address", place.address);
      formik.setFieldValue("postcode", place.postalCode);
    }
  };

  useEffect(() => {
    if (!editingPassengerId) return;

    const fetchPassengerDetails = async () => {
      try {
        const res = await getPassengerByPassengerId(editingPassengerId);
        setInitialValues(mapPassengerToInitialValues(res));
      } catch (e) {
        console.error("Failed to fetch passenger", e);
      }
    };

    fetchPassengerDetails();
  }, [editingPassengerId]);

  function mapPassengerToInitialValues(res: any) {
    const inferredTitle =
      res?.title ??
      (res?.gender === "female" ? "mrs" : "mr");

    return {
      title: inferredTitle,
      first_name: res?.first_name ?? "",
      surname: res?.surname ?? "",
      address: res?.address?.address ?? "",
      postcode: res?.address?.postcode ?? "",
      email: res?.address?.email ?? "",
      mobile_tel: res?.address.mobile_tel ?? "",
      gender: res?.gender ?? "male",
    };
  }



  const handleSubmit = async (values: any) => {
    setIsSubmitting(true);
    setApiError(null);
    try {
      const passengerData = {
        gender: values.gender,
        first_name: values.first_name,
        surname: values.surname,
        claim_id: parseInt(claimId || id),
        address: {
          address: values.address,
          postcode: values.postcode,
          mobile_tel: values.mobile_tel,
          email: values.email
        }
      };

      if (editingPassengerId) {
        await updatePassenger(editingPassengerId, passengerData);
        toast.success('Passenger detail updated successfully')
      } else {
        await createPassenger(passengerData);
        toast.success('Passenger detail created successfully')
      }

      onClose();
    } catch (error: any) {
      console.error("Error creating passenger:", error);
      setApiError(error.response?.data?.message || error.message || "Failed to add passenger. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-xl mx-4 shadow-xl max-h-[90vh] overflow-y-auto">

        <div className="p-6">
          <div className='flex justify-end'>
            <MdOutlineClose onClick={() => {
              onClose()
            }} className='text-20 cursor-pointer' />
          </div>
          <div className="flex justify-center">
            <div className='rounded-full border-8 border-gray-300/10'>
              <div className="w-12 h-12 flex items-center justify-center rounded-full bg-[#414651]/10 text-custom">
                <UserPlus2 className="w-6 h-6" />
              </div>
            </div>
          </div>

          <h2 className="text-[20px] font-weight-600 text-center mb-1">
            {editingPassengerId ? `${initialValues.first_name} ${initialValues.surname}` : 'Add Passenger Details'}
          </h2>
          <p className="text-sm text-gray-600 text-center mb-6">
            {editingPassengerId ? 'Update' : 'Enter'} the passenger details below
          </p>

          {apiError && (
            <div className="mb-4 p-3 bg-red-100 border border-red-200 text-red-700 rounded-lg text-sm">
              {apiError}
            </div>
          )}

          <Formik
            initialValues={initialValues}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
            enableReinitialize={true}
            key={editingPassengerId ?? "new"}
          >
            {(formik) => (
              <Form className="space-y-4" onKeyDown={(e) => {
                if (e.key === "Enter" && e.target.tagName !== "TEXTAREA") {
                  e.preventDefault();
                }
              }}>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Field name="title">
                    {({ field, form }: any) => {
                      const titleOptions = [
                        { value: "mr", label: "Mr." },
                        { value: "mrs", label: "Mrs." },
                        { value: "ms", label: "Ms." },
                        { value: "miss", label: "Miss" },
                        { value: "dr", label: "Dr." },
                      ];
                      return (
                        <CustomSelect
                          options={titleOptions}
                          value={titleOptions.find((opt) => opt.value === field.value) || titleOptions[0]}
                          onChange={(option) => {
                            form.setFieldValue(field.name, option ? option.value : "");
                            if (option?.value === "mr") {
                              form.setFieldValue("gender", "male");
                            } else if (["mrs", "ms", "miss"].includes(option?.value || "")) {
                              form.setFieldValue("gender", "female");
                            }
                          }}
                          disabled={isClosed || isSubmitting}
                          onInputChange={() => { }}
                        />
                      );
                    }}
                  </Field>

                  <div>
                    <Field
                      type="text"
                      name="first_name"
                      placeholder="First Name"
                      className="w-full h-11 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-custom-200 focus:outline-none text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                      disabled={isClosed || isSubmitting}
                    />
                    <ErrorMessage
                      name="first_name"
                      component="div"
                      className="text-red-500 text-xs mt-1"
                    />
                  </div>

                  <div>
                    <Field
                      type="text"
                      name="surname"
                      placeholder="Surname"
                      className="w-full h-11 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-custom-200 focus:outline-none text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                      disabled={isClosed || isSubmitting}
                    />
                    <ErrorMessage
                      name="surname"
                      component="div"
                      className="text-red-500 text-xs mt-1"
                    />
                  </div>
                </div>

                <Field type="hidden" name="gender" />

                <div>
                  <LeafletAutocompleteMap
                    showMap={false}
                    apiKey={'AIzaSyAv9ul2PcfpCi7pbGk9UwZL40RyNmB9shs'}
                    address={formik.values.address}
                    onPlaceSelected={(place) => handlePlaceSelected(place, formik)}
                    disabled={isClosed || isSubmitting}
                  />
                  <ErrorMessage
                    name="address"
                    component="div"
                    className="text-red-500 text-xs mt-1"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Field
                      type="text"
                      name="postcode"
                      placeholder="Postcode"
                      className="w-full h-11 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-custom-200 focus:outline-none text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                      disabled={isClosed || isSubmitting}
                    />
                    <ErrorMessage
                      name="postcode"
                      component="div"
                      className="text-red-500 text-xs mt-1"
                    />
                  </div>
                  <div>
                    <div>
                      <PhoneInput
                        country={"gb"}
                        placeholder='+44'
                        value={formik.values.mobile_tel}
                        inputStyle={{ fontSize: '16px' }}
                        onChange={(phone) => formik.setFieldValue("mobile_tel", phone)}
                        inputClass="!w-full !h-11 !text-md !rounded-lg !border-gray-300 focus:!border-custom-400 disabled:!bg-gray-100 disabled:!cursor-not-allowed"
                        buttonClass="!h-11 !border-gray-300 disabled:!bg-gray-100"
                        disabled={isClosed || isSubmitting}
                      />
                      <ErrorMessage
                        name="mobile_tel"
                        component="div"
                        className="text-red-500 text-xs mt-1"
                      />
                    </div>
                  </div>
                </div>

                <div className="relative">
                  <Mail className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4"/>
                  <Field
                    type="email"
                    name="email"
                    placeholder="Enter Email Address"
                    className="w-full h-11 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-custom-200 focus:outline-none text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                    disabled={isClosed || isSubmitting}
                  />
                  <ErrorMessage
                    name="email"
                    component="div"
                    className="text-red-500 text-xs mt-1"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-custom text-white rounded-lg hover:bg-[#252B37] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Adding...' : 'Confirm'}
                  </button>
                </div>
              </Form>
            )}
          </Formik>
        </div>
      </div>
    </div>
  );
};

export default AddPassengerModal;