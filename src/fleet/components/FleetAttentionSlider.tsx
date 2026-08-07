import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

// One card in the Attention slider (Overdue Returns / Overdue Payments). Kept
// generic so both tiles map their rows onto the same card shape.
export interface AttentionCard {
  heading: string; // registration (returns/payments)
  sub?: string; // secondary line (model)
  lines?: { label: string; value: string }[]; // Driver / Due date / Amount …
  badge?: string; // e.g. "13 Days Overdue"
  hire_id: number | null;
}

// Right-side drawer of Attention cards — same layout as the Skyline Vehicles
// "View All" drawer, adapted for the Overdue Returns / Overdue Payments tiles.
const FleetAttentionSlider: React.FC<{
  title: string;
  cards: AttentionCard[];
  searchPlaceholder?: string;
  onClose: () => void;
}> = ({ title, cards, searchPlaceholder = "Search", onClose }) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  const shown = query.trim()
    ? cards.filter((c) =>
        `${c.heading} ${c.sub || ""} ${(c.lines || []).map((l) => l.value).join(" ")}`
          .toLowerCase()
          .includes(query.trim().toLowerCase()),
      )
    : cards;

  const openHire = (hireId: number | null) => {
    if (!hireId) return;
    onClose();
    navigate(`/fleet/hire/${hireId}`);
  };

  return (
    <div className="fixed inset-0 z-[60] flex justify-end font-['Stack_Sans_Headline']">
      <div className="flex-1 bg-black/30" onClick={onClose} />
      <div className="w-[920px] max-w-full bg-white h-full flex flex-col p-10 gap-6">
        {/* header */}
        <div className="flex justify-between items-start">
          <h2 className="text-black text-2xl font-weight-600 leading-6">{title}</h2>
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
          <div className="text-black text-xl font-weight-600 leading-5">{shown.length} Found</div>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-72 px-5 py-4 bg-white rounded outline outline-1 outline-offset-[-1px] outline-neutral-200 text-neutral-700 text-base font-light placeholder:text-neutral-300 focus:outline-neutral-500"
          />
        </div>

        {/* card grid */}
        <div className="flex-1 overflow-auto grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 auto-rows-min">
          {shown.map((c, i) => (
            <button
              key={`${c.heading}-${i}`}
              type="button"
              onClick={() => openHire(c.hire_id)}
              className={`flex min-h-32 flex-col gap-4 rounded-lg border border-neutral-200 bg-neutral-50 p-4 text-left transition ${c.hire_id ? "hover:shadow-sm" : "cursor-default"}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex flex-col gap-1 min-w-0">
                  <h3 className="text-sm font-weight-500 text-black truncate">{c.heading}</h3>
                  {c.sub && <p className="text-xs font-weight-400 font-normal text-neutral-700 truncate">{c.sub}</p>}
                </div>
                {c.badge && (
                  <span className="inline-flex h-fit w-fit shrink-0 items-center justify-center rounded bg-red-100 px-2 py-1 text-xs font-weight-400 font-normal leading-4 text-red-600">
                    {c.badge}
                  </span>
                )}
              </div>
              {c.lines && c.lines.length > 0 && (
                <div className="flex flex-col gap-1">
                  {c.lines.map((l, j) => (
                    <p key={j} className="text-xs font-weight-400 font-normal text-neutral-500">
                      <span className="text-neutral-700">{l.label}: </span>
                      {l.value}
                    </p>
                  ))}
                </div>
              )}
            </button>
          ))}
          {shown.length === 0 && (
            <div className="col-span-full text-neutral-400 text-sm py-10 text-center">Nothing to show.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FleetAttentionSlider;
