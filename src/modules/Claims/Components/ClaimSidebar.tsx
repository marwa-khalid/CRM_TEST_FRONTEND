import React, { useState } from "react"; // 1. Import useState
import Vector8 from "../../../assets/AutoClaim_icon/Vector-8.svg";
import Vector1 from "../../../assets/AutoClaim_icon/Vector-1.svg";
import Vector2 from "../../../assets/AutoClaim_icon/Vector-2.svg";
import Vector10 from "../../../assets/AutoClaim_icon/Vector-10.svg";
import type1 from "../../../assets/AutoClaim_icon/type1.svg";
import type2 from "../../../assets/AutoClaim_icon/type2.svg";
import pending from "../../../assets/AutoClaim_icon/Pending.svg";
import greenCircle from "../../../assets/AutoClaim_icon/GreenCircle.svg";
import checkIcon from "../../../assets/AutoClaim_icon/CheckIcon.svg";

interface SidebarProps {
  steps: { label: string }[];
  activeStep: number;
  onStepClick: (index: number) => void;
}

const Sidebar = ({ steps, activeStep, onStepClick }: SidebarProps) => {
  // 2. Local state to track if "Claim Details" is expanded
  const [isClaimsExpanded, setIsClaimsExpanded] = useState(true);

  return (
    <div
      className={`Sidebar ${isClaimsExpanded ? "w-72" : "w-72"} h-full flex flex-col justify-start items-start gap-4 overflow-y-auto scrollbar-hide transition-all duration-300`}
    >
      <div className="SidebarContainer self-stretch p-6 rounded-lg border border-gray-100 flex flex-col justify-start items-start gap-4">
        <div className="SidebarItemContainer self-stretch inline-flex justify-between items-center">
          <div className="SidebarItem flex justify-start items-center gap-3">
            <img src={Vector8} alt="" />
            <div className="SidebarItemText text-black text-base font-weight-600 font-['Stack_Sans_Headline']">
              Claim Details
            </div>
          </div>

          {/* 3. Click handler on Vector2 to toggle state */}
          <img
            src={Vector2}
            alt="Toggle"
            className={`cursor-pointer transition-transform duration-300 ${isClaimsExpanded ? "" : "rotate-180"}`}
            onClick={() => setIsClaimsExpanded(!isClaimsExpanded)}
          />
        </div>

        {/* 4. Conditional Rendering Logic */}
        {isClaimsExpanded && (
          <>
            <div className="Line1 self-stretch h-px bg-blue-200 animate-in fade-in duration-300"></div>

            <div className="flex flex-col gap-4 self-stretch animate-in slide-in-from-top-2 duration-300">
              {steps.map((step, idx) => {
                const isActive = idx === activeStep;
                const isCompleted = idx < activeStep;
                return (
                  <div
                    key={idx}
                    onClick={() => onStepClick(idx)}
                    className="Claimsteps self-stretch inline-flex justify-start items-center gap-3 cursor-pointer group"
                  >
                    {isActive ? (
                      <img src={type1} alt="active" />
                    ) : isCompleted ? (
                      // <div className="relative">
                      //   <img src={greenCircle} alt="green circle" />
                      //   <img
                      //     src={checkIcon}
                      //     alt="check"
                      //     className="absolute inset-0 m-auto"
                      //   />
                      // </div>
                      <img src={pending} alt="upcoming" />
                    ) : (
                      <img src={type2} alt="upcoming" />
                    )}

                    <div
                      className={`Label text-sm transition-colors ${
                        isActive
                          ? "text-blue-500"
                          : "text-gray-500 group-hover:text-gray-700"
                      }`}
                    >
                      {step.label}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
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
