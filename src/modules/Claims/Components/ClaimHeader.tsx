import React from "react";
import { useNavigate } from "react-router-dom"; // Import navigation hook
import Vector from "../../../assets/AutoClaim_icon/Vector.svg";
import Vector4 from "../../../assets/AutoClaim_icon/Vector-4.svg";

const Header = ({ onNext }) => {
  const navigate = useNavigate();
const caseReference= localStorage.getItem("CaseReference")
  // Navigation Handlers
  const goToDashboard = () => navigate("/dashboard");

  return (
    <div className="Header w-full px-10 py-5 bg-white shadow-[0px_4px_20px_0px_rgba(0,0,0,0.08)] inline-flex justify-between items-center z-10">
      <div className="BackButtonContainer flex justify-start items-center gap-5">
        {/* Vector Click -> Dashboard */}
        <div
          className="Vector w-6 h-6 relative cursor-pointer hover:opacity-70 transition-opacity"
          onClick={goToDashboard}
        >
          <img src={Vector} alt="Back to Dashboard" />
        </div>

        <div className="HeaderTitle text-black text-2xl font-weight-600 font-['Stack_Sans_Headline'] leading-6">
          {caseReference ? caseReference : "Add New Claim"}


        </div>

        <div className="ActivityLogContainer flex justify-start items-center gap-1 cursor-pointer group">
          <img src={Vector4} alt="" />
          <div className="ActivityLogText text-blue-300 text-xs font-weight-600 font-['Stack_Sans_Headline'] group-hover:underline">
            View Activity Log
          </div>
        </div>
      </div>

      <div className="HeaderActions flex justify-start items-center gap-5">
        {/* Discard Click -> Dashboard */}
        <button
          onClick={goToDashboard}
          className="px-10 py-4 bg-white rounded outline outline-1 outline-primary text-blue-600 text-base font-weight-400 font-['Stack_Sans_Headline'] hover:bg-gray-50 transition"
        >
          Discard
        </button>

        {/* Save & Next -> Next Step */}
        <button
          onClick={onNext} // Trigger the step increase here
          className="px-10 py-4 bg-blue-500 rounded text-white text-base font-weight-400 font-['Stack_Sans_Headline'] hover:bg-blue-500 transition"
        >
          Save & Next
        </button>
      </div>
    </div>
  );
};

export {Header};
