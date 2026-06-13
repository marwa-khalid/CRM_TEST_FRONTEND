import React, { useEffect, useState } from "react";
import { getStorageRecovery } from "../../services/Dashboard/Dashboard";

interface SRItem {
  claim_id: number;
  registration: string;
  make_model: string;
  fee: number;
  claim_reference: string;
}

interface SRGroup {
  count: number;
  total: number;
  items: SRItem[];
}

const fmtFee = (n: number) =>
  "£ " + (Number(n) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtTotal = (n: number) => "£ " + Math.round(Number(n) || 0).toLocaleString();

const StorageRecoverySlider = ({
  type,
  onClose,
}: {
  type: "storage" | "recovery";
  onClose: () => void;
}) => {
  const [group, setGroup] = useState<SRGroup>({ count: 0, total: 0, items: [] });
  const title = type === "storage" ? "Storage" : "Recovery";

  useEffect(() => {
    getStorageRecovery()
      .then(({ data }) => setGroup(data?.[type] ?? { count: 0, total: 0, items: [] }))
      .catch(() => setGroup({ count: 0, total: 0, items: [] }));
  }, [type]);

  return (
    <div className="fixed inset-0 z-[60] flex justify-end font-['Stack_Sans_Headline']">
      <div className="flex-1 bg-black/30" onClick={onClose} />
      <div className="w-[900px] max-w-full bg-white h-full flex flex-col p-10 gap-5">
        {/* header */}
        <div className="flex justify-between items-start">
          <div className="text-black text-2xl font-weight-600 leading-6">{title}</div>
          <button
            type="button"
            onClick={onClose}
            className="px-10 py-4 bg-blue-500 rounded text-white text-base font-weight-500 leading-4"
          >
            Close
          </button>
        </div>
        <div className="h-px bg-neutral-100 w-full" />

        {/* count + total */}
        <div className="flex justify-between items-center">
          <div className="text-black text-2xl font-weight-600 leading-6">{group.count} Vehicles</div>
          <div className="text-black text-2xl font-weight-600 leading-6">{fmtTotal(group.total)}</div>
        </div>

        {/* grid of vehicle cards */}
        <div className="flex-1 overflow-auto">
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-3 gap-3">
            {group.items.map((it, i) => (
              <div
                key={`${it.claim_id}-${i}`}
                className="p-4 rounded-lg outline outline-1 outline-offset-[-1px] outline-neutral-200 flex justify-between items-start gap-3"
              >
                <div className="flex flex-col gap-4 min-w-0">
                  <div className="flex flex-col gap-1 min-w-0">
                    <div className="text-black text-sm font-weight-500 truncate">{it.registration}</div>
                    <div className="text-neutral-700 text-xs truncate">{it.make_model || "—"}</div>
                  </div>
                  <div className="text-sm">
                    <span className="text-neutral-700">Fee: </span>
                    <span className="text-neutral-700 font-weight-600">{fmtFee(it.fee)}</span>
                  </div>
                </div>
                <div className="text-neutral-700 text-xs font-weight-600 shrink-0 text-right">
                  {it.claim_reference}
                </div>
              </div>
            ))}
          </div>
          {group.items.length === 0 && (
            <div className="text-neutral-400 text-sm py-10 text-center">No {title.toLowerCase()} records.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StorageRecoverySlider;
