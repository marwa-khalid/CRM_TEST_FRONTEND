import React from "react";

// Fleet "Vehicle Provision Log" — same idea as the Claims VehicleProvisionSlider
// (a right slide-in listing every vehicle provisioned for the hire), in the Fleet
// black/grey theme. Fed a list of provisions; active (still on-hire) rows first.
export interface ProvisionLog {
  registration: string;
  make: string;
  model: string;
  start: string;
  end: string;
}

const isActive = (l: ProvisionLog) => {
  const end = String(l.end || "").trim().toLowerCase();
  return end === "" || end === "-" || end === "—" || end === "active";
};

export const FleetProvisionSlider: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  logs: ProvisionLog[];
}> = ({ isOpen, onClose, logs }) => {
  const display = [...logs].sort((a, b) => Number(isActive(b)) - Number(isActive(a)));
  return (
    <>
      <div
        onClick={onClose}
        className={`fixed inset-0 bg-black/30 z-[100] transition-opacity duration-300 ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
      />
      <div
        className={`fixed right-0 top-0 h-full w-[760px] max-w-full bg-white shadow-2xl z-[101] flex flex-col font-sans-headline transition-transform duration-300 ${isOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="px-10 py-5 flex justify-between items-center shadow-[0px_4px_20px_rgba(0,0,0,0.08)]">
          <h1 className="text-neutral-900 text-2xl font-semibold leading-8">Vehicle Provision Log</h1>
          <button
            type="button"
            onClick={onClose}
            className="px-8 py-3 rounded bg-white text-neutral-900 text-base font-medium outline outline-1 -outline-offset-1 outline-neutral-900 hover:bg-neutral-50"
          >
            Close
          </button>
        </div>

        <div className="flex-1 p-10 overflow-y-auto">
          <div className="rounded-lg outline outline-1 -outline-offset-1 outline-neutral-100 overflow-hidden">
            <div className="grid grid-cols-5 gap-2 px-4 h-12 items-center bg-neutral-50 text-neutral-900 text-sm font-semibold uppercase border-b border-neutral-100">
              <span>Registration</span>
              <span>Make</span>
              <span>Model</span>
              <span>Start</span>
              <span>End</span>
            </div>
            {display.length === 0 ? (
              <div className="px-4 h-12 flex items-center text-neutral-400 text-sm">No vehicles provisioned yet.</div>
            ) : (
              display.map((l, i) => (
                <div key={i} className="grid grid-cols-5 gap-2 px-4 h-12 items-center text-neutral-700 text-sm border-b border-neutral-100 last:border-b-0">
                  <span className="truncate">{l.registration || "—"}</span>
                  <span className="truncate">{l.make || "—"}</span>
                  <span className="truncate">{l.model || "—"}</span>
                  <span className="truncate">{l.start || "—"}</span>
                  <span>
                    {isActive(l) ? (
                      <span className="px-2 py-0.5 rounded bg-green-100 text-green-700 text-xs">Active</span>
                    ) : (
                      l.end
                    )}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default FleetProvisionSlider;
