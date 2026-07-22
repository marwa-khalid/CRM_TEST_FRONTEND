import React, { useState, useEffect } from "react";
import CurrentScreen from "../assets/icons/CurrentScreen.svg";
import CompleteScreen from "../assets/icons/CompleteScreen.svg";
import HalfFilledScreen from "../assets/icons/HalfFilledScreen.svg";
import EmptyScreen from "../assets/icons/EmptyScreen.svg";
import type { HireStep } from "../types/hire";

export type StepFill = "complete" | "half" | "empty";

interface Props {
  steps: HireStep[];
  activeIndex: number;
  // Per-step fill state: complete = all fields filled, half = 1+ filled, empty = none.
  statusOf?: (index: number) => StepFill;
  onSelect?: (index: number) => void;
  /** Customer-side steps for the SAME record. Indices continue after `steps`. */
  customerSteps?: HireStep[];
}

const Chevron: React.FC<{ open: boolean }> = ({ open }) => (
  <svg viewBox="0 0 16 16" fill="none" className={`w-4 h-4 shrink-0 text-neutral-400 transition-transform ${open ? "" : "-rotate-90"}`} aria-hidden>
    <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const CARD = "self-stretch p-6 rounded-lg outline outline-1 -outline-offset-1 outline-neutral-100 flex flex-col gap-4";

const FleetStepper: React.FC<Props> = ({ steps, activeIndex, statusOf, onSelect, customerSteps = [] }) => {
  // Accordion: only one side is expanded at a time, so opening one collapses the
  // other. Follows the active step across the client/customer boundary.
  const [openPanel, setOpenPanel] = useState<"client" | "customer">(
    activeIndex >= steps.length ? "customer" : "client",
  );
  useEffect(() => {
    setOpenPanel(activeIndex >= steps.length ? "customer" : "client");
  }, [activeIndex, steps.length]);
  const clientOpen = openPanel === "client";
  const customerOpen = openPanel === "customer";
  const setClientOpen = () => setOpenPanel("client");
  const setCustomerOpen = () => setOpenPanel("customer");

  return (
    <div className="w-72 shrink-0 font-sans-headline flex flex-col gap-4">
      {/* Skyline Client Side — the current wizard */}
      <div className={CARD}>
        <button type="button" onClick={setClientOpen} className="flex justify-between items-center">
          <span className="text-neutral-900 text-base font-semibold">Client Side</span>
          <Chevron open={clientOpen} />
        </button>
        {clientOpen && (
          <>
            <div className="h-px bg-neutral-100" />
            <div className="flex flex-col gap-4">
              {steps.map((step, i) => {
                const isCurrent = i === activeIndex;
                const status = statusOf?.(i) ?? "empty";
                // The active tab is ALWAYS "current"; otherwise the icon reflects fill state.
                const icon = isCurrent
                  ? CurrentScreen
                  : status === "complete"
                    ? CompleteScreen
                    : status === "half"
                      ? HalfFilledScreen
                      : EmptyScreen;
                return (
                  <button key={step.key} type="button" onClick={() => onSelect?.(i)} className="flex items-center gap-3 text-left">
                    <img src={icon} alt="" className="w-4 h-4 shrink-0" />
                    <span
                      className={`text-sm leading-4 ${isCurrent || status !== "empty" ? "text-black" : "text-neutral-700"} ${isCurrent ? "font-medium" : "font-normal"}`}
                    >
                      {step.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Skyline Customer Side — same record, indices continue after the client steps */}
      <div className={CARD}>
        <button type="button" onClick={setCustomerOpen} className="flex justify-between items-center">
          <span className={`text-base font-semibold ${customerSteps.length ? "text-neutral-900" : "text-neutral-500"}`}>
            Customer Side
          </span>
          <Chevron open={customerOpen} />
        </button>
        {customerOpen && (
          <>
            <div className="h-px bg-neutral-100" />
            {customerSteps.length === 0 ? (
              <span className="text-neutral-400 text-sm">Screens coming soon.</span>
            ) : (
              <div className="flex flex-col gap-4">
                {customerSteps.map((step, i) => {
                  const index = steps.length + i;
                  const isCurrent = index === activeIndex;
                  const status = statusOf?.(index) ?? "empty";
                  const icon = isCurrent
                    ? CurrentScreen
                    : status === "complete"
                      ? CompleteScreen
                      : status === "half"
                        ? HalfFilledScreen
                        : EmptyScreen;
                  return (
                    <button key={step.key} type="button" onClick={() => onSelect?.(index)} className="flex items-center gap-3 text-left">
                      <img src={icon} alt="" className="w-4 h-4 shrink-0" />
                      <span
                        className={`text-sm leading-4 ${isCurrent || status !== "empty" ? "text-black" : "text-neutral-700"} ${isCurrent ? "font-medium" : "font-normal"}`}
                      >
                        {step.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default FleetStepper;
