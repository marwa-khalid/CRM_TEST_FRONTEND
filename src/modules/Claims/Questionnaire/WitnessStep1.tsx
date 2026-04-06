import React from "react";
import calander from '../../../assets/AutoClaim_icon/Vector-6.svg'

const Step1Witness = () => {
      const user = JSON.parse(localStorage.getItem("activeUser"))
  return (
    <div className="flex flex-col gap-4 p-5 rounded-lg border border-gray-100 shadow-sm bg-white font-['Stack_Sans_Headline']">
      <div className="text-black text-xl font-weight-600 font-['Stack_Sans_Headline'] leading-5">
        Witness Details
      </div>

      <div className="h-px w-full bg-gray-100" />

      {/* Name Input */}
      <div className="flex flex-col gap-2">
        <label className="text-gray-700 text-sm font-weight-400 font-['Stack_Sans_Headline']">
          Name
        </label>
        <div className="px-5 py-4 bg-gray-50 rounded border border-gray-200 flex items-center">
          <span className="text-gray-700 text-base font-light font-['Stack_Sans_Headline'] leading-4">
            Marwa Khalid
          </span>
        </div>
      </div>

      {/* Address Input */}
      <div className="flex flex-col gap-2">
        <label className="text-gray-700 text-sm font-weight-400 font-['Stack_Sans_Headline']">
          Address
        </label>
        <input
          type="text"
          placeholder="Enter Address"
          className="w-full px-5 py-4 h-[52px] bg-white rounded border border-gray-200 text-base font-light font-['Stack_Sans_Headline'] outline-none focus:border-blue-500 transition-colors placeholder:text-gray-300"
        />
      </div>

      {/* DOB & Occupation Row */}
      <div className="grid grid-cols-2 gap-5">
        <div className="flex flex-col gap-2">
          <label className="text-gray-700 text-sm font-weight-400 font-['Stack_Sans_Headline']">
            Date of Birth
          </label>
          <div className="px-5 py-4 bg-white rounded border border-gray-200 flex justify-between items-center group cursor-pointer">
            <span className="text-gray-300 text-base font-light font-['Stack_Sans_Headline'] leading-4 group-focus-within:text-gray-700">
              Date
            </span>
            <img src={calander} alt="" />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-gray-700 text-sm font-weight-400 font-['Stack_Sans_Headline']">
            Occupation
          </label>
          <input
            type="text"
            placeholder="Enter Occupation"
            className="w-full px-5 py-4 bg-white h-[52px] rounded border border-gray-200 text-base font-light font-['Stack_Sans_Headline'] outline-none focus:border-blue-500 transition-colors placeholder:text-gray-300"
          />
        </div>
      </div>
    </div>
  );
};

export default Step1Witness;
