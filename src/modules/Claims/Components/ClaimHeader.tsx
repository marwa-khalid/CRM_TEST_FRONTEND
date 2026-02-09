import React from "react";
import Vector from '../../../assets/AutoClaim_icon/Vector.svg'
import Vector4 from "../../../assets/AutoClaim_icon/Vector-4.svg";

const Header = () => {
  return (
    <div className="Header w-full px-10 py-5 bg-white shadow-[0px_4px_20px_0px_rgba(0,0,0,0.08)] inline-flex justify-between items-center z-10">
      <div className="BackButtonContainer flex justify-start items-center gap-5">
        <div className="Vector w-6 h-6 relative">
          <img src={Vector} alt="" />
        </div>
        <div className="HeaderTitle text-black text-2xl font-semibold font-['Stack_Sans_Headline'] leading-6">
          Add New Claim
        </div>
        <div className="ActivityLogContainer flex justify-start items-center gap-1 cursor-pointer">
          <img src={Vector4} alt="" />
          <div className="ActivityLogText text-blue-400 text-xs font-semibold font-['Stack_Sans_Headline']">
            View Activity Log
          </div>
        </div>
      </div>
      <div className="HeaderActions flex justify-start items-center gap-5">
        <button className="px-10 py-4 bg-white rounded outline outline-1 outline-blue-600 text-blue-600 text-base font-medium font-['Stack_Sans_Headline'] hover:bg-gray-50 transition">
          Discard
        </button>
        <button className="px-10 py-4 bg-blue-500 rounded text-white text-base font-medium font-['Stack_Sans_Headline'] hover:bg-blue-600 transition">
          Save & Next
        </button>
      </div>
    </div>
  );
};

export default Header;
