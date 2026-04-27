import React, { useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { X } from "lucide-react";
import Vector6 from '../../../assets/AutoClaim_icon/Vector-6.svg';
import Yes from "../../../assets/AutoClaim_icon/Yes.svg";
import No from "../../../assets/AutoClaim_icon/No.svg";
import LeafletAutocompleteMap from "../../../components/GoogleMapAutoComplete/GoogleMapAutoComplete";
import { toast } from "react-toastify";
import { createPoliceDetail, updatePoliceDetail } from "../../../services/Accidents/Cards/cards";
import { CustomDatePicker } from "../Components/DatePicker";
// Assuming these are your service imports
// import { createPoliceDetails, updatePoliceDetails } from "../../../services/Accidents/Cards/cards";

interface PoliceDetailsModalProps {
  onClose: () => void;
  claimId: string | number;
  initialData?: any;
  addNew:boolean
}

export const PoliceDetailsModal: React.FC<PoliceDetailsModalProps> = ({
  onClose,
  claimId,
  initialData,
  addNew,
}) => {
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const formik = useFormik({
    initialValues: {
      name: initialData?.name || "",
      referenceNo: initialData?.reference_no || "",
      stationName: initialData?.station_name || "",
      station_address: initialData?.station_address || "",
      incident_report_taken: initialData?.incident_report_taken || "Yes",
      reportReceivedDate: initialData?.report_received_date || "",
      notes: initialData?.additional_info || "",
    },
    validationSchema: Yup.object({}),
    onSubmit: async (values) => {
      try {
        const payload = {
          claim_id: claimId,
          name: values.name,
          reference_no: values.referenceNo,
          station_name: values.stationName,
          station_address: values.station_address,
          incident_report_taken: values.incident_report_taken === "Yes",
          report_received_date: values.reportReceivedDate
            ? new Date(values.reportReceivedDate).toISOString().split("T")[0]
            : null,
          additional_info: values.notes,
        };

        // API Call Logic
        if (initialData?.id) {
          await updatePoliceDetail(initialData.id, payload);
        } else {
          await createPoliceDetail(payload);
        }

        toast.success("Police details saved successfully");
        onClose();
      } catch (error) {
        toast.error("Failed to save police details");
      }
    },
  });

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-[70] p-4 font-['Stack_Sans_Headline']">
      <form
        onSubmit={formik.handleSubmit}
        className="w-[788px] p-6 bg-white rounded-lg shadow-xl flex flex-col gap-6 animate-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="flex justify-between items-center w-full">
          <h2 className="text-neutral-900 text-[20px] font-weight-600 font-['Stack_Sans_Headline'] leading-5">
            Police Details
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="h-px bg-gray-100 w-full" />

        <div className="flex flex-col gap-4">
          {/* Constable Name */}
          <div className="flex flex-col gap-2">
            <label className="text-gray-700 text-sm font-weight-400">
              Police Constable Name
            </label>
            <input
              name="name"
              type="text"
              placeholder="Enter Full Name"
              className="px-5 py-4 border border-gray-200 rounded text-base outline-none focus:ring-2 focus:ring-blue-500/20"
              {...formik.getFieldProps("name")}
            />
          </div>

          {/* Ref & Station Name */}
          <div className="grid grid-cols-2 gap-5">
            <div className="flex flex-col gap-2">
              <label className="text-gray-700 text-sm font-weight-400">
                Reference No.
              </label>
              <input
                name="referenceNo"
                type="text"
                placeholder="Enter Ref. No."
                className="px-5 py-4 border border-gray-200 rounded text-base outline-none focus:ring-2 focus:ring-blue-500/20"
                {...formik.getFieldProps("referenceNo")}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-gray-700 text-sm font-weight-400">
                Police Station Name
              </label>
              <input
                name="stationName"
                type="text"
                placeholder="Enter Police Station"
                className="px-5 py-4 border border-gray-200 rounded text-base outline-none focus:ring-2 focus:ring-blue-500/20"
                {...formik.getFieldProps("stationName")}
              />
            </div>
          </div>

          {/* Station Address */}
          <div className="flex flex-col gap-2">
            <label className="text-gray-700 text-sm font-weight-400">
              Police Station Address
            </label>
            {/* <textarea
              name="station_address"
              placeholder="Police Station Address"
              className="px-5 py-4 h-24 border border-gray-200 rounded text-base outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
              {...formik.getFieldProps("station_address")}
            /> */}
            <LeafletAutocompleteMap
              showMap={false}
              apiKey={import.meta.env.VITE_GOOGLE_MAP_KEY}
              address={formik.values.station_address}
              onPlaceSelected={(place) => {
                if (place.name) {
                  formik.setFieldValue("station_address", place?.address);
                }
              }}
              disabled={false}
            />
          </div>

          {/* Radio & Date Row */}
          <div className="grid grid-cols-2 gap-5 items-start">
            {/* Custom Radio Group */}
            <div className="flex flex-col gap-4">
              <label className="text-black text-sm font-weight-400">
                Incident Report Taken?
              </label>
              <div className="flex items-center gap-5">
                {["Yes", "No"].map((option) => (
                  <label
                    key={option}
                    className="flex items-center gap-2 cursor-pointer group"
                  >
                    <input
                      type="radio"
                      name="incident_report_taken"
                      value={option}
                      className="hidden"
                      checked={formik.values.incident_report_taken === option}
                      onChange={() =>
                        formik.setFieldValue("incident_report_taken", option)
                      }
                    />

                    {formik.values.incident_report_taken === option ? (
                      <img src={Yes} />
                    ) : (
                      <img src={No} />
                    )}
                    <span className="text-black text-sm">{option}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Date Input */}

            <div className="flex flex-col gap-2 relative">
              <label className="text-neutral-700 text-[14px] font-weight-500">
                Report Received Date
              </label>
              <div
                onClick={() => setShowDatePicker(!showDatePicker)}
                className="h-[52px] px-5 bg-white rounded border border-gray-200 flex items-center justify-between cursor-pointer focus-within:border-blue-500"
              >
                <span
                  className={
                    formik.values.reportReceivedDate
                      ? "text-gray-900 font-['system-ui']"
                      : "text-gray-300 font-['system-ui']"
                  }
                >
                  {formik.values.reportReceivedDate
                    ? new Date(
                        formik.values.reportReceivedDate,
                      ).toLocaleDateString("sv-SE")
                    : "Date"}
                </span>
                <img src={Vector6} className="w-4 h-4" alt="calendar" />
              </div>

              {/* Date Picker Dropdown */}
              {showDatePicker && (
                <div className="absolute top-[25px] left-0 z-[100] shadow-xl rounded-lg bg-white">
                  <CustomDatePicker
                    selectedDate={
                      formik.values.reportReceivedDate || new Date()
                    }
                    // Ensure the user cannot pick a future date
                    // maxDate={new Date()}
                    onDateSelect={(date) => {
                      // Double check: only update if date is not in the future
                      if (date <= new Date()) {
                        formik.setFieldValue("reportReceivedDate", date);
                        setShowDatePicker(false);
                      }
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          <div className="flex flex-col gap-2">
            <label className="text-gray-700 text-sm font-weight-400">Notes</label>
            <textarea
              name="notes"
              placeholder="Add Notes"
              className="px-5 py-4 h-24 border border-gray-200 rounded text-base outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
              {...formik.getFieldProps("notes")}
            />
          </div>
        </div>

        <div className="h-px bg-gray-100 w-full" />

        {/* Action Buttons */}
        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-4 border border-blue-600 text-blue-600 rounded font-weight-400 hover:bg-blue-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-6 py-4 bg-blue-500 text-white rounded font-weight-400 hover:bg-blue-600 transition-colors"
          >
            Save
          </button>
          {addNew && (
            <button
              type="button"
              onClick={() => {
                formik.submitForm().then(() => formik.resetForm());
              }}
              className="px-6 py-4 bg-blue-500 text-white rounded font-weight-400 hover:bg-blue-600 transition-colors"
            >
              Save and Add Next Police Detail
            </button>
          )}
        </div>
      </form>
    </div>
  );
};
