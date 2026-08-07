import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getMissingDocuments, type MissingDoc } from "../services/dashboardService";

// Right-side drawer listing entities missing a required document — mirrors the
// Claims "Missing Documents" slider, adapted to Fleet (links through to the hire).
// `side`: "vehicles" → vehicle docs keyed by reg; "skyline" → driver docs keyed by
// driver name (driving licence / taxi badge).
const FleetMissingDocumentsSlider: React.FC<{ side?: "skyline" | "vehicles"; items?: MissingDoc[]; onClose: () => void }> = ({ side = "vehicles", items: preloaded, onClose }) => {
  const navigate = useNavigate();
  const [items, setItems] = useState<MissingDoc[]>(preloaded ?? []);
  const [loading, setLoading] = useState(!preloaded);
  const [query, setQuery] = useState("");
  const isDriver = side === "skyline";
  const subjectLabel = isDriver ? "Driver" : "Vehicle";

  useEffect(() => {
    if (preloaded) return; // parent already fetched (shows the full-screen loader first)
    setLoading(true);
    getMissingDocuments(side)
      .then(setItems)
      .finally(() => setLoading(false));
  }, [side, preloaded]);

  const shown = query.trim()
    ? items.filter((i) => (i.registration || "").toLowerCase().includes(query.trim().toLowerCase()))
    : items;

  const openHire = (hireId: number | null) => {
    if (!hireId) return;
    onClose();
    navigate(`/fleet/hire/${hireId}`);
  };

  return (
    <div className="fixed inset-0 z-[60] flex justify-end font-['Stack_Sans_Headline']">
      <div className="flex-1 bg-black/30" onClick={onClose} />
      <div className="w-[872px] max-w-full bg-white h-full flex flex-col p-10 gap-5">
        {/* header */}
        <div className="flex justify-between items-start">
          <div className="text-black text-2xl font-weight-600 leading-6">Missing Documents</div>
          <button
            type="button"
            onClick={onClose}
            className="px-10 py-4 bg-neutral-900 rounded text-white text-base font-weight-500 leading-4 hover:bg-black"
          >
            Close
          </button>
        </div>
        <div className="h-px bg-neutral-100 w-full" />

        {/* count + search */}
        <div className="flex justify-between items-center gap-4">
          <div className="text-black text-xl font-weight-600 leading-5">
            {loading ? "…" : `${shown.length} Missing Documents Found`}
          </div>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={isDriver ? "Enter Driver Name" : "Enter Vehicle Reg"}
            className="w-72 px-5 py-4 bg-white rounded outline outline-1 outline-offset-[-1px] outline-neutral-200 text-neutral-700 text-base font-light placeholder:text-neutral-300 focus:outline-neutral-500"
          />
        </div>

        {/* list: loader while fetching, otherwise the results */}
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-neutral-800 border-t-transparent animate-spin" />
            <div className="text-neutral-400 text-sm">Loading missing documents…</div>
          </div>
        ) : (
          <div className="flex-1 overflow-auto flex flex-col gap-2">
            {shown.map((it, i) => (
              <div
                key={`${it.registration}-${it.label}-${i}`}
                className="p-4 rounded outline outline-1 outline-offset-[-1px] outline-neutral-200 flex justify-between items-start gap-4"
              >
                <div className="text-neutral-700 text-sm font-weight-500">{it.label}</div>
                <div className="text-sm shrink-0">
                  <span className="text-neutral-700">{subjectLabel}: </span>
                  {it.hire_id ? (
                    <button
                      type="button"
                      onClick={() => openHire(it.hire_id)}
                      className="text-neutral-900 font-weight-600 hover:underline"
                    >
                      {it.registration}
                    </button>
                  ) : (
                    <span className="text-neutral-900 font-weight-600">{it.registration}</span>
                  )}
                </div>
              </div>
            ))}
            {shown.length === 0 && (
              <div className="text-neutral-400 text-sm py-10 text-center">No missing documents.</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FleetMissingDocumentsSlider;
