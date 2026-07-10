import React from "react";
import CurrentScreen from "../assets/icons/CurrentScreen.svg";
import PendingScreen from "../assets/icons/PendingScreen.svg";
import type { HireStep } from "../types/hire";

interface Props {
  steps: HireStep[];
  activeIndex: number;
  completed: Set<number>;
  onSelect?: (index: number) => void;
}

// Green filled circle with a white check (Complete state).
const CompleteDot = () => (
  <span className="w-4 h-4 shrink-0 rounded-full bg-green-500 flex items-center justify-center">
    <span className="w-2 h-1 border-l-2 border-b-2 border-white -rotate-45 -translate-y-[1px]" />
  </span>
);

const FleetStepper: React.FC<Props> = ({ steps, activeIndex, completed, onSelect }) => (
  <div className="w-72 shrink-0 font-stack">
    <div className="p-6 rounded-lg outline outline-1 -outline-offset-1 outline-neutral-100 flex flex-col gap-4">
      {steps.map((step, i) => {
        const isComplete = completed.has(i);
        const isCurrent = i === activeIndex;
        return (
          <button
            key={step.key}
            type="button"
            onClick={() => onSelect?.(i)}
            className="flex items-center gap-3 text-left"
          >
            {isComplete ? (
              <CompleteDot />
            ) : (
              <img src={isCurrent ? CurrentScreen : PendingScreen} alt="" className="w-4 h-4 shrink-0" />
            )}
            <span
              className={`text-sm leading-4 ${
                isCurrent || isComplete ? "text-black" : "text-neutral-700"
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
