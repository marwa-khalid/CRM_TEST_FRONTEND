import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getMissingDocuments } from "../../services/Dashboard/Dashboard";

interface MissingDoc {
  label: string;
  claim_id: number;
  claim_reference: string;
}

// Drop "Received On" / "Completed On" from the document label.
const cleanLabel = (l: string) =>
  (l || "").replace(/\s*(Received On|Completed On)\s*/gi, " ").replace(/\s+/g, " ").trim();

const MissingDocumentsSlider = ({ onClose }: { onClose: () => void }) => {
  const navigate = useNavigate();
  const [items, setItems] = useState<MissingDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    setLoading(true);
    getMissingDocuments()
      .then(({ data }) => setItems(Array.isArray(data?.items) ? data.items : []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  const shown = query.trim()
    ? items.filter((i) => (i.claim_reference || "").toLowerCase().includes(query.trim().toLowerCase()))
    : items;

  const openClaim = (claimId: number) => {
    onClose();
    navigate(`/add-claim/${claimId}`);
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
            className="px-10 py-4 bg-blue-500 rounded text-white text-base font-weight-500 leading-4"
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
            placeholder="Enter Claim Number"
            className="w-72 px-5 py-4 bg-white rounded outline outline-1 outline-offset-[-1px] outline-neutral-200 text-neutral-700 text-base font-light placeholder:text-neutral-300 focus:outline-blue-500"
          />
        </div>

        {/* list: loader while fetching, otherwise the results */}
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
            <div className="text-neutral-400 text-sm">Loading missing documents…</div>
          </div>
        ) : (
        <div className="flex-1 overflow-auto flex flex-col gap-2">
          {shown.map((it, i) => (
            <div
              key={`${it.claim_id}-${it.label}-${i}`}
              className="p-4 rounded outline outline-1 outline-offset-[-1px] outline-neutral-200 flex justify-between items-start gap-4"
            >
              <div className="text-neutral-700 text-sm font-weight-500">{cleanLabel(it.label)}</div>
              <div className="text-sm shrink-0">
                <span className="text-neutral-700">Case: </span>
                <button
                  type="button"
                  onClick={() => openClaim(it.claim_id)}
                  className="text-blue-500 font-weight-600 hover:underline"
                >
                  {it.claim_reference}
                </button>
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

export default MissingDocumentsSlider;
