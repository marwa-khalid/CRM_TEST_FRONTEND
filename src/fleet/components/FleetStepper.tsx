import React from "react";
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
}

const FleetStepper: React.FC<Props> = ({ steps, activeIndex, statusOf, onSelect }) => (
  <div className="w-72 shrink-0 font-sans-headline">
    <div className="p-6 rounded-lg outline outline-1 -outline-offset-1 outline-neutral-100 flex flex-col gap-4">
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
          <button
            key={step.key}
            type="button"
            onClick={() => onSelect?.(i)}
            className="flex items-center gap-3 text-left"
          >
            <img src={icon} alt="" className="w-4 h-4 shrink-0" />
            <span
              className={`text-sm leading-4 ${
                isCurrent || status !== "empty" ? "text-black" : "text-neutral-700"
              } ${isCurrent ? "font-medium" : "font-normal"}`}
            >
              {step.label}
            </span>
          </button>
        );
      })}
    </div>
  </div>
);

export default FleetStepper;
