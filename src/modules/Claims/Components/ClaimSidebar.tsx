import React from "react";
import Vector8 from "../../../assets/AutoClaim_icon/Vector-8.svg";
import Vector1 from "../../../assets/AutoClaim_icon/Vector-1.svg";
import Vector2 from "../../../assets/AutoClaim_icon/Vector-2.svg";
import Vector10 from "../../../assets/AutoClaim_icon/Vector-10.svg";

interface SidebarProps {
  steps: { label: string }[];
  activeStep: number;
  onStepClick: (index: number) => void;
}

const Sidebar = ({ steps, activeStep, onStepClick }: SidebarProps) => {
  return (
    <div className="Sidebar w-72 h-full flex flex-col justify-start items-start gap-4 overflow-y-auto scrollbar-hide">
      <div className="SidebarContainer self-stretch p-6 rounded-lg border border-gray-100 flex flex-col justify-start items-start gap-4">
        <div className="SidebarItemContainer self-stretch inline-flex justify-between items-center">
          <div className="SidebarItem flex justify-start items-center gap-3">
            <img src={Vector8} alt="" />
            <div className="SidebarItemText text-black text-base font-semibold font-['Stack_Sans_Headline']">
              Claim Details
            </div>
          </div>
          <img src={Vector2} alt="" />
        </div>

        <div className="Line1 self-stretch h-px bg-blue-100"></div>

        {steps.map((step, idx) => {
          const isActive = idx === activeStep;
          return (
            <div
              key={idx}
              onClick={() => onStepClick(idx)}
              className="Claimsteps self-stretch inline-flex justify-start items-center gap-3 cursor-pointer group"
            >
              {/* The Blue Radio Button Logic */}
              <div
                className={`w-4 h-4 rounded-full flex items-center justify-center transition-all ${
                  isActive
                    ? "bg-blue-600 shadow-[0_0_0_2px_rgba(37,99,235,0.2)]"
                    : "border-2 border-blue-200 group-hover:border-blue-400"
                }`}
              >
                {/* Optional: Add a small inner white dot for a "radio" look when active */}
                {/* {isActive && (
                  <div className="w-1.5 h-1.5 bg-white rounded-full" />
                )} */}
              </div>

              <div
                className={`Label text-sm font-['Stack_Sans_Headline'] transition-colors ${
                  isActive
                    ? "text-blue-600 font-semibold"
                    : "text-gray-500 font-normal group-hover:text-gray-700"
                }`}
              >
                {step.label}
              </div>
            </div>
          );
        })}
      </div>

      <div className="SidebarSection self-stretch p-6 rounded-lg border border-gray-200 flex flex-col justify-start items-start gap-4 mb-10">
        <div className="SidebarSectionItemContainer self-stretch inline-flex justify-between items-center">
          <div className="SidebarSectionItem flex justify-start items-center gap-3">
            <img src={Vector1} alt="" />
            <div className="SidebarSectionItemText text-gray-500 text-base font-semibold font-['Stack_Sans_Headline']">
              Payment Details
            </div>
          </div>
          <img src={Vector10} alt="" />
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
