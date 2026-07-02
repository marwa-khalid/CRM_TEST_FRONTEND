import React from "react";
import { Trash2 } from "lucide-react";

export interface ClaimVehicle {
  id?: number;
  registration?: string | null;
  make?: string | null;
  model?: string | null;
}

/**
 * Vehicle switcher cards for the payment screens — mirrors the Hire Vehicle
 * Details cards. Renders nothing for a single vehicle; shows selectable cards
 * for two or more. `onDelete` is optional (trash icon only shows when provided).
 */
const VehicleCards: React.FC<{
  vehicles: ClaimVehicle[];
  activeIndex: number;
  onSelect: (index: number) => void;
  onDelete?: (vehicle: ClaimVehicle, index: number) => void;
}> = ({ vehicles, activeIndex, onSelect, onDelete }) => {
  if (!vehicles || vehicles.length < 2) return null;

  return (
    <div className="self-stretch flex flex-wrap items-stretch gap-4 font-['Stack_Sans_Headline']">
      {vehicles.map((v, i) => {
        const selected = i === activeIndex;
        return (
          <button
            key={v.id ?? i}
            type="button"
            onClick={() => onSelect(i)}
            className={`flex-1 min-w-[240px] p-4 rounded-lg flex items-start justify-between gap-3 text-left transition-colors ${
              selected
                ? "bg-blue-100 "
                : "bg-white border border-neutral-200 hover:bg-blue-50"
            }`}
          >
            <div className="flex flex-col gap-0.5 min-w-0">
              <span className="text-black text-base font-weight-600 truncate">
                Vehicle{i + 1}
              </span>
              <span className="text-neutral-500 text-xs truncate">
                {v.registration || "Reg#"}
              </span>
            </div>
            {onDelete && (
              <span
                role="button"
                onClick={(e) => { e.stopPropagation(); onDelete(v, i); }}
                className="text-neutral-400 hover:text-red-500 shrink-0"
              >
                <Trash2 size={16} />
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default VehicleCards;
