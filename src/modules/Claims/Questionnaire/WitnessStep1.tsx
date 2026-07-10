import React, { useEffect, useMemo, useRef, useState } from "react";
import calander from "../../../assets/AutoClaim_icon/Vector-6.svg";
import { useQuestionnaireForm } from "./QuestionnaireLayout";
import { CustomDatePicker } from "../Components/DatePicker";
import { AddressAutocomplete } from "../../../claims/common/AddressAutocomplete";

const Step1Witness = () => {
  const { formData, updateStepData } = useQuestionnaireForm();
const [showDobPicker, setShowDobPicker] = useState(false);
const dobPickerRef = useRef<HTMLDivElement>(null);
  const activeUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("activeUser") || "{}");
    } catch {
      return {};
    }
  }, []);

  const witnessName =
    formData.witnessDetails.name ||
    activeUser?.name ||
    activeUser?.full_name ||
    activeUser?.user_name ||
    "";

  useEffect(() => {
    if (witnessName && !formData.witnessDetails.name) {
      updateStepData("witnessDetails", {
        name: witnessName,
      });
    }
  }, [witnessName]);

  const handleChange = (field: string, value: string) => {
    updateStepData("witnessDetails", {
      [field]: value,
    });
  };

  return (
    <div className="flex flex-col gap-4 p-5 rounded-lg border border-gray-100 shadow-sm bg-white font-['Stack_Sans_Headline']">
      <div className="text-neutral-900 text-[20px] font-weight-600 leading-5">
        Witness Details
      </div>

      <div className="h-px w-full bg-gray-100" />

      <div className="flex flex-col gap-2">
        <label className="text-gray-700 text-sm font-weight-400">Name</label>

        <input
          type="text"
          value={formData.witnessDetails.name || ""}
          onChange={(e) => handleChange("name", e.target.value)}
          placeholder="Enter Name"
          className="w-full px-5 py-4 h-[52px] bg-white rounded border border-gray-200 text-gray-700 text-base font-light outline-none focus:border-blue-500 transition-colors placeholder:text-gray-300"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-gray-700 text-sm font-weight-400">Address</label>
        <AddressAutocomplete
          address={formData.witnessDetails.address || ""}
          onChange={(v) => handleChange("address", v)}
          onPlaceSelected={(place) => handleChange("address", place.address)}
          placeholder="Enter Address"
          inputClassName="w-full px-5 py-4 h-[52px] bg-white rounded border border-gray-200 text-gray-700 text-base font-light outline-none focus:border-blue-500 transition-colors placeholder:text-gray-300"
        />
      </div>

      <div className="grid grid-cols-2 gap-5">
        <div className="flex flex-col gap-2">
          <label className="text-gray-700 text-sm font-weight-400">
            Date of Birth
          </label>

          <div className="relative">
            <button
              type="button"
              onClick={() => setShowDobPicker((prev) => !prev)}
              className="w-full px-5 py-4 h-[52px] bg-white rounded border border-gray-200 text-base font-light outline-none focus:border-blue-500 transition-colors text-left flex items-center justify-between"
            >
              <span
                className={
                  formData.witnessDetails.dob
                    ? "text-gray-700"
                    : "text-gray-300"
                }
              >
                {formData.witnessDetails.dob || "Select Date of Birth"}
              </span>

              <img src={calander} alt="" />
            </button>

            {showDobPicker && (
              <div className="absolute bottom-[53px] left-0 z-[100]">
                <CustomDatePicker
                  selectedDate={
                    formData.witnessDetails.dob
                      ? new Date(formData.witnessDetails.dob)
                      : new Date()
                  }
                  onDateSelect={(date: Date) => {
                    handleChange("dob", date.toLocaleDateString("sv-SE"));
                    setShowDobPicker(false);
                  }}
                />
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-gray-700 text-sm font-weight-400">
            Occupation
          </label>

          <input
            type="text"
            value={formData.witnessDetails.occupation || ""}
            onChange={(e) => handleChange("occupation", e.target.value)}
            placeholder="Enter Occupation"
            className="w-full px-5 py-4 bg-white h-[52px] rounded border border-gray-200 text-base font-light outline-none focus:border-blue-500 transition-colors placeholder:text-gray-300"
          />
        </div>
      </div>
    </div>
  );
};

export default Step1Witness;
