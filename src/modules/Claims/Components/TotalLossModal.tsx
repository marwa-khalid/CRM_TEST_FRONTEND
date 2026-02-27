import React, { useState } from "react";
import { Calendar, ChevronDown } from "lucide-react";
import Vector6 from "../../../assets/AutoClaim_icon/Vector-6.svg";
import { BlueDropdownIndicator, customStyles } from "../Steps/GeneralDetailsForm";
import Select from 'react-select'
export const TotalLossView = ({ isOpen, onClose }) => {
    if (!isOpen) return null;
    const handlerOptions = [
      { value: 1, label: "A" },
      { value: 2, label: "B" },
      { value: 3, label: "N" },
      { value: 4, label: "S" },
      { value: 5, label: "X" },
    ];
      const commonStatusOptions = [
        { value: "YES", label: "Yes" },
        { value: "NO", label: "No" },
        { value: "TBC", label: "TBC" },
      ];
          const commonStatusOptions2 = [
            { value: "YES", label: "Yes" },
            { value: "NO", label: "No" },
            { value: "TBC", label: "TBC" },
            { value: "DISPUTED", label: "Disputed" },
          ];
  const [salvageCollected, setSalvageCollected] = useState<boolean>(true);
  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-[100] p-10">
      <div className="card  bg-white w-full h-full flex flex-col overflow-auto">
        {/* Modal Header */}
        <div
          data-layer="Header"
          className="w-full px-10 py-5 bg-white shadow-[0px_4px_20px_0px_rgba(0,0,0,0.08)] inline-flex justify-between items-center relative z-10"
        >
          <h1 className="font-weight-600">Total Loss</h1>
          <div className="flex gap-5">
            <button
              className="px-10 py-4 bg-white rounded border border-blue-600 text-blue-600 text-base font-medium hover:bg-blue-50 transition-colors"
              onClick={onClose}
            >
              Cancel
            </button>
            <button className="px-10 py-4 bg-blue-500 rounded text-white text-base font-medium hover:bg-blue-600 transition-colors">
              Update
            </button>
          </div>
        </div>

        <div className="w-full h-px bg-gray-100" />
        <div className="w-[788px] ms-[360px] mb-10">
          {/* Main Details Section */}
          <div className="self-stretch p-5 rounded-lg border border-gray-100 flex flex-col gap-4 mt-6 animate-in fade-in duration-500">
            <h2 className="text-black text-xl font-semibold font-sans">
              Total Loss Details
            </h2>
            <div className="w-full h-px bg-gray-100" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Date Row */}
              <FormField label="Total Loss Date" type="date" />
              <FormField label="PAV £" type="currency" />

              {/* Salvage Row */}
              <FormField label="Salvage Amount" type="currency" />
              {/* <FormField label="Salvage Category" type="select"> */}
              <div className="flex flex-col gap-3">
                <label className="text-gray-700 text-sm font-weight-400 h-[20px] flex items-center">
                  Salvage Category
                </label>
                <Select
                  options={handlerOptions}
                  placeholder="Select Occupation"
                  styles={customStyles}
                  //   value={handlerOptions.find(
                  //     (option) => option.value === formik.values.occupation,
                  //   )}
                  //   onChange={(option: any) =>
                  //     formik.setFieldValue("occupation", option.value)
                  //   }
                  components={{
                    DropdownIndicator: BlueDropdownIndicator,
                    IndicatorSeparator: () => null,
                  }}
                />
              </div>
              {/* </FormField> */}
              {/* Report Row */}
              <FormField label="Engineer Report Sent to TPI" type="date" />
              <FormField label="PAV Cheque Received" type="date" />

              {/* Status Row */}
              <FormField label="PAV Sent to Client" type="date" />
              <FormField label="Vehicle Salvage Mileage" type="text" />

              {/* Dropdown Row */}
              {/* <FormField
                label="Client Keeping Salvage?"
                type="select"
                placeholder="Yes"
              /> */}
              <div className="flex flex-col gap-2">
                <label className="text-gray-700 text-sm font-weight-500 ">
                  Client Keeping Salvage?
                </label>
                <Select
                  options={commonStatusOptions2}
                  styles={customStyles}
                  //   value={commonStatusOptions.find(
                  //     (option) =>
                  //       option.value === formik.values.non_fault_accident,
                  //   )} // Controlled from step1Data
                  //   onChange={(val) =>
                  //     formik.setFieldValue("non_fault_accident", val.value)
                  //   }
                  components={{
                    DropdownIndicator: BlueDropdownIndicator,
                    IndicatorSeparator: () => null,
                  }}
                />
              </div>
              <FormField label="PAV Sent to Client" type="date" />

              {/* Final Status Row */}
              {/* <FormField label="" type="select" placeholder="Yes" /> */}
              <div className="flex flex-col gap-2">
                <label className="text-gray-700 text-sm font-weight-500 ">
                  PAV Agreed
                </label>
                <Select
                  options={commonStatusOptions2}
                  styles={customStyles}
                  //   value={commonStatusOptions.find(
                  //     (option) =>
                  //       option.value === formik.values.non_fault_accident,
                  //   )} // Controlled from step1Data
                  //   onChange={(val) =>
                  //     formik.setFieldValue("non_fault_accident", val.value)
                  //   }
                  components={{
                    DropdownIndicator: BlueDropdownIndicator,
                    IndicatorSeparator: () => null,
                  }}
                />
              </div>
              <FormField label="PAV Offer Accepted" type="date" />
            </div>

            {/* Action Buttons Group */}
            <div className="flex flex-wrap gap-5 py-4">
              {[
                "Send Eng Rep to TPI",
                "Send PAV to CL",
                "Instruct Fleet to Off Hire",
              ].map((text) => (
                <button
                  key={text}
                  className="flex-1 min-w-[200px] px-6 py-4 bg-white rounded border border-blue-600 text-blue-600 text-base font-medium hover:bg-blue-50 transition-colors"
                >
                  {text}
                </button>
              ))}
            </div>
          </div>

          {/* Salvage Retention Section */}
          <div className="self-stretch p-5 rounded-lg border border-gray-100 flex flex-col gap-4 mt-6 animate-in fade-in duration-500">
            <h2 className="text-black text-xl font-semibold font-sans">
              Salvage Retention Details Section
            </h2>
            <div className="w-full h-px bg-gray-100" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* <FormField
                label="Client Retaining Salvage?"
                type="select"
                placeholder="Select Category"
              /> */}
              <div className="flex flex-col gap-2">
                <label className="text-gray-700 text-sm font-weight-500 ">
                  Client Retaining Salvage?
                </label>
                <Select
                  options={commonStatusOptions}
                  styles={customStyles}
                  placeholder="Select Category"
                  //   value={commonStatusOptions.find(
                  //     (option) =>
                  //       option.value === formik.values.non_fault_accident,
                  //   )} // Controlled from step1Data
                  //   onChange={(val) =>
                  //     formik.setFieldValue("non_fault_accident", val.value)
                  //   }
                  components={{
                    DropdownIndicator: BlueDropdownIndicator,
                    IndicatorSeparator: () => null,
                  }}
                />
              </div>
              <FormField
                label="TPI Instructed to Collect Salvage on"
                type="date"
              />

              {/* Radio Button Group */}
              <div className="flex flex-col gap-4">
                <span className="text-gray-700 text-sm font-medium">
                  Has Salvage Been Collected?
                </span>
                <div className="flex gap-5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <div
                      onClick={() => setSalvageCollected(true)}
                      className={`w-5 h-5 rounded-full flex items-center justify-center border transition-all ${salvageCollected ? "bg-blue-100 border-blue-500" : "bg-gray-100 border-gray-300"}`}
                    >
                      {salvageCollected && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full" />
                      )}
                    </div>
                    <span className="text-sm">Yes</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <div
                      onClick={() => setSalvageCollected(false)}
                      className={`w-5 h-5 rounded-full flex items-center justify-center border transition-all ${!salvageCollected ? "bg-blue-100 border-blue-500" : "bg-gray-100 border-gray-300"}`}
                    >
                      {!salvageCollected && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full" />
                      )}
                    </div>
                    <span className="text-sm">No</span>
                  </label>
                </div>
              </div>

              <FormField label="Salvage Collected On" type="date" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Reusable Field Component
const FormField = ({
  label,
  type,
  placeholder,
}: {
  label: string;
  type: "date" | "currency" | "select" | "text";
  placeholder?: string;
}) => (
  <div className="flex flex-col gap-2">
    <label className="text-gray-700 text-sm font-medium">{label}</label>
    <div className="relative">
      {type === "currency" && (
        <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300 text-base font-light">
          £
        </span>
      )}
      <input
        type={type === "date" ? "text" : "text"}
        placeholder={placeholder || (type === "date" ? "Date" : "")}
        onFocus={type === "date" ? (e) => (e.target.type = "date") : undefined}
        className={`w-full px-5 py-4 bg-white rounded border border-gray-200 text-base font-light focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${
          type === "currency" ? "pl-10" : ""
        } ${type === "date" || type === "select" ? "text-gray-400 cursor-pointer" : "text-black"}`}
      />
      {type === "date" && (
        <Calendar className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-400 pointer-events-none" />
      )}
      {type === "select" && (
        <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-600 pointer-events-none" />
      )}
    </div>
  </div>
);

export default TotalLossView;
