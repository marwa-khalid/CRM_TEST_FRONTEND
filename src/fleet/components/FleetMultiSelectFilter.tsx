import React, { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

// Borderless multi-select filter — a "Label ▾" text trigger (with a count badge)
// that opens a checkbox dropdown. Shared by the Fleet listing and Tasks filters
// so both behave the same (multi-select, no box around the trigger).
const FleetMultiSelectFilter: React.FC<{
  label: string;
  options: { label: string; value: string }[];
  selected: string[];
  onToggle: (v: string) => void;
  onClear: () => void;
}> = ({ label, options, selected, onToggle, onClear }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  return (
    <div className="relative" ref={ref}>
      <button type="button" onClick={() => setOpen((o) => !o)} className="flex items-center gap-1.5 text-neutral-900 text-sm font-medium hover:opacity-80">
        {selected.length > 0 && (
          <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-neutral-900 text-white text-[11px] flex items-center justify-center">{selected.length}</span>
        )}
        {label}
        <ChevronDown size={14} />
      </button>
      {open && (
        <div className="absolute z-40 top-full mt-1 left-0 w-max min-w-[180px] max-h-[320px] overflow-y-auto bg-white rounded-md shadow-[0px_4px_12px_0px_rgba(0,0,0,0.1)] border border-neutral-100 p-2 flex flex-col gap-1">
          {selected.length > 0 && (
            <button type="button" onClick={onClear} className="w-full text-left p-2.5 text-xs text-neutral-500 hover:bg-neutral-50 rounded">
              Clear {label}
            </button>
          )}
          {options.length === 0 && <span className="p-2.5 text-xs text-neutral-400">No options</span>}
          {options.map((o) => {
            const checked = selected.includes(o.value);
            return (
              <button key={o.value} type="button" onClick={() => onToggle(o.value)} className={`w-full flex items-center gap-2 text-left p-2.5 rounded ${checked ? "bg-neutral-100" : "hover:bg-neutral-50"}`}>
                <span className={`w-5 h-5 rounded shrink-0 ${checked ? "bg-neutral-900 border-[6px] border-neutral-300" : "bg-neutral-300"}`} />
                <span className="text-neutral-700 text-sm truncate">{o.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default FleetMultiSelectFilter;
