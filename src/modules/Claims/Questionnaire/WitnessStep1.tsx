import React, { useEffect, useMemo } from "react";
import calander from "../../../assets/AutoClaim_icon/Vector-6.svg";
import { useQuestionnaireForm } from "./QuestionnaireLayout";

const Step1Witness = () => {
  const { formData, updateStepData } = useQuestionnaireForm();

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

        <input
          type="text"
          value={formData.witnessDetails.address || ""}
          onChange={(e) => handleChange("address", e.target.value)}
          placeholder="Enter Address"
          className="w-full px-5 py-4 h-[52px] bg-white rounded border border-gray-200 text-base font-light outline-none focus:border-blue-500 transition-colors placeholder:text-gray-300"
        />
      </div>

      <div className="grid grid-cols-2 gap-5">
        <div className="flex flex-col gap-2">
          <label className="text-gray-700 text-sm font-weight-400">
            Date of Birth
          </label>

          <div className="relative">
            <input
              type="date"
              value={formData.witnessDetails.dob || ""}
              onChange={(e) => handleChange("dob", e.target.value)}
              className="w-full px-5 py-4 h-[52px] bg-white rounded border border-gray-200 text-base font-light outline-none focus:border-blue-500 transition-colors"
            />

            <img
              src={calander}
              alt=""
              className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none"
            />
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
