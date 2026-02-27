import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { useSelector } from "react-redux";
import { UserPlus2 } from "lucide-react";
import { DatePicker } from "../application/date-picker/date-picker";
import CustomSelect from "../ReactSelect/ReactSelect";
import LeafletAutocompleteMap from "../GoogleMapAutoComplete/GoogleMapAutoComplete";
import {
  createPoliceDetail,
  getPoliceDetailById,
  updatePoliceDetail,
} from "../../services/Accidents/Cards/cards";
import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { MdOutlineClose } from "react-icons/md";

interface AddPoliceModalProps {
  isOpen: boolean;
  onClose: (shouldRefresh?: boolean) => void;
  onConfirm: () => void;
  editingPoliceId: number;
}

const AddPoliceModal = ({
  isOpen,
  onClose,
  onConfirm,
  editingPoliceId,
}: AddPoliceModalProps) => {
  const isClosed = useSelector((state: any) => state.isClosed?.isClosed);
  const { id } = useParams();
  const searchParams = new URLSearchParams(window.location.search);
  const claimID = searchParams.get("claimid");
  const [initialValues, setInitialValues] = useState({
    name: "",
    reference_no: "",
    station_name: "",
    station_address: "",
    incident_report_taken: "Yes",
    report_received_date: "",
    additional_info: "",
  });

  const validationSchema = Yup.object().shape({
    // name: Yup.string().required('Officer name is required'),
    // reference_no: Yup.string().required('Reference number is required'),
    // station_name: Yup.string().required('Station name is required'),
    // station_address: Yup.string().required('Station address is required'),
    // incident_report_taken: Yup.string().required('Please specify if incident report was taken'),
  });

  const handlePlaceSelected = (place: any, formik: any) => {
    if (formik) {
      formik.setFieldValue("station_address", place.address);
    }
  };

  useEffect(() => {
    if (!editingPoliceId) return;

    const fetchPoliceDetails = async () => {
      try {
        const res = await getPoliceDetailById(editingPoliceId);
        setInitialValues(mapWitnessToInitialValues(res));
      } catch (e) {
        console.error("Failed to fetch passenger", e);
      }
    };

    fetchPoliceDetails();
  }, [editingPoliceId]);

  function mapWitnessToInitialValues(res: any) {
    return {
      name: res?.name,
      reference_no: res?.reference_no,
      station_name: res?.station_name,
      station_address: res?.station_address,
      incident_report_taken: res?.incident_report_taken === true ? "Yes" : "No",
      report_received_date: res?.report_received_date,
      additional_info: res?.additional_info,
    };
  }

  const handleSubmit = async (values: any) => {
    try {
      const policeData = {
        name: values.name,
        reference_no: values.reference_no,
        claim_id: parseInt(id || claimID),
        station_name: values.station_name,
        station_address: values.station_address,
        incident_report_taken: values.incident_report_taken === "Yes",
        report_received_date: values.report_received_date || null,
        additional_info: values.additional_info,
      };

      if (editingPoliceId) {
        await updatePoliceDetail(editingPoliceId, policeData);
        toast.success("Police detail updated successfully");
      } else {
        await createPoliceDetail(policeData);
        toast.success("Police detail created successfully");
      }
      onConfirm();
      onClose(true);
    } catch (error) {
      console.error("Error creating police detail:", error);
    }
  };

  const options = [
    { value: "Yes", label: "Yes" },
    { value: "No", label: "No" },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-end">
            <MdOutlineClose
              onClick={() => {
                onClose();
              }}
              className="text-20 cursor-pointer"
            />
          </div>
          <div className="flex justify-center">
            <div className="rounded-full border-8 border-gray-300/10">
              <div className="w-12 h-12 flex items-center justify-center rounded-full bg-[#414651]/10 text-custom">
                <UserPlus2 className="w-6 h-6" />
              </div>
            </div>
          </div>

          <h2 className="text-xl font-semibold mb-2 text-center">
            {editingPoliceId
              ? `${initialValues?.name} Police Details`
              : "Add Police Details"}
          </h2>
          <p className="text-sm text-gray-600 mb-6 text-center">
            {editingPoliceId ? "Edit" : "Enter"} the police details below
          </p>

          <Formik
            initialValues={initialValues}
            key={editingPoliceId ?? "new"}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
            enableReinitialize
          >
            {(formik) => (
              <Form
                onKeyDown={(e) => {
                  if (e.key === "Enter" && e.target.tagName !== "TEXTAREA") {
                    e.preventDefault();
                  }
                }}
              >
                <div className="mb-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="md:col-span-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Police Constable Name
                      </label>
                      <Field
                        type="text"
                        name="name"
                        placeholder="Enter Constable Name"
                        disabled={isClosed}
                        className="w-full p-3 h-[44px] border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-custom-200 border-custom-400 focus:outline-none"
                      />
                      <ErrorMessage
                        name="name"
                        component="div"
                        className="text-red-500 text-xs mt-1"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="w-full">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Reference No.
                      </label>
                      <Field
                        type="text"
                        name="reference_no"
                        placeholder="Enter Reference"
                        disabled={isClosed}
                        className="w-full p-3 border h-[44px] border-gray-300 rounded-md bg-white focus:ring-2 border-custom-400 focus:outline-none"
                      />
                      <ErrorMessage
                        name="reference_no"
                        component="div"
                        className="text-red-500 text-xs mt-1"
                      />
                    </div>
                    <div className="w-full">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Police Station Name
                      </label>
                      <Field
                        type="text"
                        name="station_name"
                        placeholder="Police Station Name"
                        disabled={isClosed}
                        className="w-full p-3 h-[44px] border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-custom-200 focus:border-custom-500 focus:outline-none"
                      />
                      <ErrorMessage
                        name="station_name"
                        component="div"
                        className="text-red-500 text-xs mt-1"
                      />
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <div className="grid grid-cols-1 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Police Station Address
                      </label>
                      <LeafletAutocompleteMap
                        showMap={false}
                        apiKey={import.meta.env.VITE_GOOGLE_MAP_KEY}
                        address={formik.values.station_address}
                        onPlaceSelected={(place) =>
                          handlePlaceSelected(place, formik)
                        }
                        disabled={isClosed}
                      />
                      <ErrorMessage
                        name="station_address"
                        component="div"
                        className="text-red-500 text-xs mt-1"
                      />
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="w-full h-11">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Incident Report Taken?
                      </label>
                      <div className="">
                        <CustomSelect
                          name="incident_report_taken"
                          disabled={isClosed}
                          value={
                            options.find(
                              (opt) =>
                                opt.value ===
                                formik.values.incident_report_taken
                            ) || null
                          }
                          onChange={(option: { value: string } | null) => {
                            formik.setFieldValue(
                              "incident_report_taken",
                              option?.value ?? "No"
                            );

                            // Clear date if user selects "No"
                            if (option?.value === "No") {
                              formik.setFieldValue("report_received_date", "");
                            }
                          }}
                          options={options}
                        />
                      </div>
                      <ErrorMessage
                        name="incident_report_taken"
                        component="div"
                        className="text-red-500 text-xs mt-1"
                      />
                    </div>

                    {formik.values.incident_report_taken === "Yes" && (
                      <div className="w-full">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Report Received Date
                        </label>
                        <div className="w-full">
                          <Field name="report_received_date">
                            {({ field, form }: any) => (
                              <DatePicker
                                aria-label="Report received date"
                                selectedDate={
                                  field.value ? new Date(field.value) : null
                                }
                                setSelectedDate={(date: Date | null) => {
                                  if (date) {
                                    const isoDate = date
                                      .toISOString()
                                      .split("T")[0];
                                    form.setFieldValue(
                                      "report_received_date",
                                      isoDate
                                    );
                                  } else {
                                    form.setFieldValue(
                                      "report_received_date",
                                      ""
                                    );
                                  }
                                }}
                                disabled={isClosed}
                              />
                            )}
                          </Field>
                        </div>
                        <ErrorMessage
                          name="report_received_date"
                          component="div"
                          className="text-red-500 text-xs mt-1"
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="mb-6">
                  <div className="grid grid-cols-1 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Notes / Additional Information
                      </label>
                      <Field
                        as="textarea"
                        name="additional_info"
                        rows={3}
                        placeholder="Type Here..."
                        disabled={isClosed}
                        className="w-full p-3 border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-custom-200 focus:border-custom-500 focus:outline-none resize-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-6">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-custom text-white rounded-md hover:bg-[#252B37] transition-colors duration-200"
                  >
                    Confirm
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

export default AddPoliceModal;
