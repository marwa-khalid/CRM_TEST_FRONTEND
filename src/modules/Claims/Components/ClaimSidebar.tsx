import React, { useState, useEffect } from "react"; // 1. Import useState
import Vector8 from "../../../assets/AutoClaim_icon/Vector-8.svg";
import Vector1 from "../../../assets/AutoClaim_icon/Vector-1.svg";
import Vector2 from "../../../assets/AutoClaim_icon/Vector-2.svg";
import Vector10 from "../../../assets/AutoClaim_icon/Vector-10.svg";
import type1 from "../../../assets/AutoClaim_icon/type1.svg";
import type2 from "../../../assets/AutoClaim_icon/type2.svg";
import pending from "../../../assets/AutoClaim_icon/Pending.svg";

interface SidebarProps {
  steps: { label: string }[];
  paymentSteps: { label: string }[];
  activeStep: number;
  onStepClick: (index: number) => void;
  activePaymentStep: number;
  onPaymentStepClick: (index: number) => void;
  activeMode?: "claim" | "payment";
}

const Sidebar = ({ steps, activeStep, onStepClick,paymentSteps,activePaymentStep,onPaymentStepClick, activeMode = "claim" }: SidebarProps) => {
  // 2. Local state to track if "Claim Details" is expanded.
  // The two sections are mutually exclusive: opening one closes the other.
  // Initial expansion follows the active mode so a deep-link (?mode=payment)
  // opens with the Payment Details accordion expanded.
  const [isClaimsExpanded, setIsClaimsExpanded] = useState(activeMode !== "payment");
  const [isPaymentExpanded, setIsPaymentExpanded] = useState(activeMode === "payment");

  // Keep the open accordion in sync when the active mode changes (e.g. the page
  // switches to payment mode after mount).
  useEffect(() => {
    setIsClaimsExpanded(activeMode !== "payment");
    setIsPaymentExpanded(activeMode === "payment");
  }, [activeMode]);

  const toggleClaims = () =>
    setIsClaimsExpanded((prev) => {
      const next = !prev;
      if (next) setIsPaymentExpanded(false);
      return next;
    });

  const togglePayment = () =>
    setIsPaymentExpanded((prev) => {
      const next = !prev;
      if (next) setIsClaimsExpanded(false);
      return next;
    });


  return (
    <div
      className={`Sidebar font-['Stack_Sans_Headline'] ${isClaimsExpanded ? "w-72" : "w-72"} h-full flex flex-col justify-start items-start gap-4 overflow-y-auto scrollbar-hide transition-all duration-300`}
    >
      <div className="SidebarContainer self-stretch p-6 rounded-lg border border-neutral-100 flex flex-col justify-start items-start gap-4">
        <div className="SidebarItemContainer self-stretch inline-flex justify-between items-center">
          <div className="SidebarItem flex justify-start items-center gap-3">
            <img src={Vector8} alt="" />
            <div className="SidebarItemText text-neutral-900 text-[16px] font-weight-600 font-['Stack_Sans_Headline']">
              Claim Details
            </div>
          </div>

          {/* 3. Click handler on Vector2 to toggle state */}
          <img
            src={Vector2}
            alt="Toggle"
            className={`cursor-pointer transition-transform duration-300 ${isClaimsExpanded ? "" : "rotate-180"}`}
            onClick={toggleClaims}
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
                    onClick={() => {
                      setIsClaimsExpanded(true);
                      setIsPaymentExpanded(false);
                      onStepClick(idx);
                    }}
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
                      className={`Label text-[12px] transition-colors font-weight-300 font-light ${
                        isActive
                          ? "text-primary"
                          : "text-neutral-700 group-hover:text-gray-700"
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
            <div className="SidebarSectionItemText text-gray-500 text-base font-weight-600 font-['Stack_Sans_Headline']">
              Payment Details
            </div>
          </div>
          <img
            src={Vector10}
            className={`cursor-pointer transition-transform duration-300 ${isPaymentExpanded ? "" : "rotate-180"}`}
            alt=""
            onClick={togglePayment}
          />
        </div>
        {/* 4. Conditional Rendering Logic */}
        {isPaymentExpanded && (
          <>
            <div className="Line1 self-stretch h-px bg-blue-200 animate-in fade-in duration-300"></div>

            <div className="flex flex-col gap-4 self-stretch animate-in slide-in-from-top-2 duration-300">
              {paymentSteps.map((step, idx) => {
                const isActive = idx === activePaymentStep;
                const isCompleted = idx < activePaymentStep;
                return (
                  <div
                    key={idx}
                    onClick={() => {
                      setIsPaymentExpanded(true);
                      setIsClaimsExpanded(false);
                      onPaymentStepClick(idx);
                    }}
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
    </div>
  );
};

export default Sidebar;
