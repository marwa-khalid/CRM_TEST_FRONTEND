import React from "react";
import { FileText, History } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ArrowBack from "../assets/icons/ArrowBack.svg";
import HistoryIcon from "../../assets/HistorySection/History.svg";

interface Props {
  title: string;
  onBack: () => void;
  onDiscard: () => void;
  onSaveNext: () => void;
  // Persist any buffered field edits before leaving the wizard for another page.
  onBeforeNavigate?: () => Promise<void>;
  saving?: boolean;
  hireId?: number | null;
  // Optional override for the "View History" link (e.g. VM vehicle records route
  // to their own history). Falls back to the fleet hire history when omitted.
  onHistory?: () => void | Promise<void>;
}

const FleetTopBar: React.FC<Props> = ({ title, onBack, onDiscard, onSaveNext, onBeforeNavigate, saving, hireId, onHistory }) => {
  const navigate = useNavigate();
  const openFleetPage = async (page: "activity" | "document-library") => {
    if (!hireId) return;
    await onBeforeNavigate?.();
    navigate(`/fleet/${page}?hire_id=${hireId}`);
  };

  const linkClass = hireId
    ? "text-neutral-900 hover:underline cursor-pointer"
    : "text-neutral-300 cursor-not-allowed";

  return (
    <div className="w-full px-10 py-5 bg-white shadow-[0px_4px_20px_0px_rgba(0,0,0,0.08)] flex justify-between items-center sticky top-0 z-20 font-sans-headline">
      <div className="flex items-center gap-5">
        <button type="button" onClick={onBack} aria-label="Back" className="shrink-0">
          <img src={ArrowBack} alt="" className="w-6 h-6" />
        </button>
        <h1 className="text-black text-2xl font-semibold leading-6">{title}</h1>
        <button
          type="button"
          disabled={!hireId}
          onClick={() => openFleetPage("activity")}
          className={`flex items-center gap-1 text-xs font-semibold ${linkClass}`}
        >
          <History size={14} />
          View Activity Log
        </button>
        <button
          type="button"
          disabled={!hireId}
          onClick={() => openFleetPage("document-library")}
          className={`flex items-center gap-1 text-xs font-semibold ${linkClass}`}
        >
          <FileText size={14} />
          Documents Library
        </button>
        <button
          type="button"
          disabled={!hireId && !onHistory}
          onClick={async () => {
            await onBeforeNavigate?.();
            if (onHistory) return void onHistory();
            if (hireId) navigate(`/fleet/hire/${hireId}/history`);
          }}
          className={`flex items-center gap-1 text-xs font-semibold ${(hireId || onHistory) ? "text-neutral-900 hover:underline cursor-pointer" : "text-neutral-300 cursor-not-allowed"}`}
        >
          <img src={HistoryIcon} alt="" className="w-3.5 h-3.5" style={{ filter: "brightness(0)" }} />
          {onHistory ? "Vehicle History" : "Fleet History"}
        </button>
      </div>
      <div className="flex items-center gap-5">
        <button
          type="button"
          onClick={onDiscard}
          className="px-10 py-4 bg-white rounded outline outline-1 -outline-offset-1 outline-black text-black text-base font-medium leading-4 hover:bg-neutral-50 transition-colors"
        >
          Discard
        </button>
        <button
          type="button"
          onClick={onSaveNext}
          disabled={saving}
          className="px-10 py-4 bg-neutral-900 rounded text-white text-base font-medium leading-4 hover:bg-black transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
        >
          Save &amp; Next
        </button>
      </div>
    </div>
  );
};

export default FleetTopBar;
