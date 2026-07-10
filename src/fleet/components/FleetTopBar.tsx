import React from "react";
import ArrowBack from "../assets/icons/ArrowBack.svg";

interface Props {
  title: string;
  onBack: () => void;
  onDiscard: () => void;
  onSaveNext: () => void;
}

const FleetTopBar: React.FC<Props> = ({ title, onBack, onDiscard, onSaveNext }) => (
  <div className="w-full px-10 py-5 bg-white shadow-[0px_4px_20px_0px_rgba(0,0,0,0.08)] flex justify-between items-center sticky top-0 z-20 font-stack">
    <div className="flex items-center gap-5">
      <button type="button" onClick={onBack} aria-label="Back" className="shrink-0">
        <img src={ArrowBack} alt="" className="w-6 h-6" />
      </button>
      <h1 className="text-black text-2xl font-semibold leading-6">{title}</h1>
    </div>
    <div className="flex items-center gap-5">
      <button
        type="button"
        onClick={onDiscard}
        className="px-10 py-4 bg-white rounded-sm outline outline-1 -outline-offset-1 outline-black text-black text-base font-medium leading-4 hover:bg-neutral-50 transition-colors"
      >
        Discard
      </button>
      <button
        type="button"
        onClick={onSaveNext}
        className="px-10 py-4 bg-neutral-900 rounded-sm text-white text-base font-medium leading-4 hover:bg-black transition-colors"
      >
        Save &amp; Next
      </button>
    </div>
  </div>
);

export default FleetTopBar;
