import { gbp, slash, datedLong, m0, d, cellBase, headBase, DocShell, DocHeader, SectionLabel, DocFooter } from "./docHelpers";

// Print/PDF document for the ABI Hire Breakdown (non-editable). Built from the
// edited form values. Single vehicle: one flat Rate & Extras table. Two or more
// vehicles: the Rate & Extras table groups Daily Rate / Total columns per vehicle
// (with a combined total) — matching the "vehicle swap" figma.

export type ABIDocVehicle = {
  vehicle?: string;
  registration?: string;
  group?: string;
  hireStart?: string; // YYYY-MM-DD
  hireEnd?: string; // YYYY-MM-DD
  days?: string | number;
  abiHireRate?: number;
  towBar?: number;
  dualControl?: number;
  totalAdditionalDaily?: number;
  totalDailyRate?: number; // incl. extras
  totalABICost?: number;
};

export type ABIBreakdownDocData = {
  ourReference?: string;
  yourReference?: string;
  dated?: string; // YYYY-MM-DD
  vehicle?: string;
  registration?: string;
  group?: string;
  hireStart?: string; // YYYY-MM-DD
  hireEnd?: string; // YYYY-MM-DD
  days?: string | number;
  abiHireRate?: number;
  extras?: number;
  towBar?: number;
  dualControl?: number;
  other?: number;
  totalAdditionalDaily?: number;
  totalDailyRate?: number; // incl. extras
  totalABICost?: number;
  // Multi-vehicle: full per-vehicle breakdown + combined total.
  vehicles?: ABIDocVehicle[];
  combinedABICost?: number;
};

// Two-line grouped column header (vehicle then hire dates) — compact leading so
// the two lines don't over-inflate the cell height.
const groupHeadCls =
  "border border-black px-1.5 py-1 bg-gray-200 text-black text-center align-middle";

// Per-vehicle Rate & Extras rows (same order for every vehicle).
const RATE_ROWS: { label: string; key: keyof ABIDocVehicle }[] = [
  { label: "ABI Hire Rate", key: "abiHireRate" },
  { label: "Tow Bar", key: "towBar" },
  { label: "Dual Control", key: "dualControl" },
  { label: "Total Additional Daily Charges", key: "totalAdditionalDaily" },
];

const ABIHireBreakdownDoc = ({ data }: { data: ABIBreakdownDocData }) => {
  const vehicles = data.vehicles || [];
  const multi = vehicles.length > 1;
  const grandTotal = multi ? (data.combinedABICost || 0) : (data.totalABICost || 0);
  const groupPct = multi ? 69 / vehicles.length : 0;

  // Single-vehicle Rate & Extras rows (keeps the itemised "Other" line).
  const singleRateRows = [
    { label: "ABI Hire Rate", daily: data.abiHireRate },
    { label: "Tow Bar", daily: data.towBar },
    { label: "Dual Control", daily: data.dualControl },
    { label: "Other", daily: data.other },
    { label: "Total Additional Daily Charges", daily: data.totalAdditionalDaily },
  ];

  return (
    <DocShell>
      <DocHeader ourRef={data.ourReference} yourRef={data.yourReference} dated={datedLong(data.dated)} />

      {/* Title + description */}
      <div className="self-stretch pt-7">
        <div className="self-stretch pt-3.5 flex flex-col gap-1.5">
          <div className="text-[10px] uppercase leading-4">COST BREAKDOWN · 30-DAY PAYMENT</div>
          <div className="text-base font-bold uppercase leading-5">ABI HIRE BREAKDOWN</div>
          <div className="pt-0.5 text-xs leading-4">
            Breakdown of ABI hire costs including additional charges, calculated on the basis of settlement within 30 days.
          </div>
        </div>
      </div>

      <SectionLabel
        no="01."
        title="VEHICLE & HIRE PERIOD"
        right={
          multi ? (
            <div className="px-1.5 py-px outline outline-1 outline-offset-[-1px] outline-black text-[10px] leading-4">
              Vehicle Swap
            </div>
          ) : undefined
        }
      />
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className={`${headBase} text-left w-10`}>{multi ? "#" : "Veh"}</th>
            <th className={`${headBase} text-left`}>Vehicle</th>
            <th className={`${headBase} text-left`}>Registration</th>
            <th className={`${headBase} text-left`}>Group</th>
            <th className={`${headBase} text-left`}>Hire Start</th>
            <th className={`${headBase} text-left`}>Hire End</th>
            <th className={`${headBase} text-right w-14`}>Days</th>
          </tr>
        </thead>
        <tbody>
          {multi ? (
            vehicles.map((v, i) => (
              <tr key={i}>
                <td className={cellBase}>{i + 1}</td>
                <td className={cellBase}>{v.vehicle || "—"}</td>
                <td className={cellBase}>{v.registration || "—"}</td>
                <td className={cellBase}>{v.group || "—"}</td>
                <td className={cellBase}>{slash(v.hireStart)}</td>
                <td className={cellBase}>{slash(v.hireEnd)}</td>
                <td className={`${cellBase} text-right`}>{d(v.days)}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td className={cellBase}>—</td>
              <td className={cellBase}>{data.vehicle || "—"}</td>
              <td className={cellBase}>{data.registration || "—"}</td>
              <td className={cellBase}>{data.group || "—"}</td>
              <td className={cellBase}>{slash(data.hireStart)}</td>
              <td className={cellBase}>{slash(data.hireEnd)}</td>
              <td className={`${cellBase} text-right`}>{d(data.days)}</td>
            </tr>
          )}
        </tbody>
      </table>

      <SectionLabel no="02." title="RATE & EXTRAS" />
      {multi ? (
        <table className="w-full border-collapse table-fixed">
          <colgroup>
            <col style={{ width: "31%" }} />
            {vehicles.flatMap((_, i) => [
              <col key={`${i}-r`} style={{ width: `${groupPct / 2}%` }} />,
              <col key={`${i}-t`} style={{ width: `${groupPct / 2}%` }} />,
            ])}
          </colgroup>
          <thead>
            <tr>
              <th rowSpan={2} className={`${headBase} text-left align-bottom`}>Component</th>
              {vehicles.map((v, i) => (
                <th key={i} colSpan={2} className={groupHeadCls}>
                  <div className="text-[10px] font-bold leading-[1.4]">
                    Vehicle {i + 1} — {v.vehicle || "—"}
                    {v.registration ? ` · ${v.registration}` : ""}
                  </div>
                  <div className="text-[9px] font-normal leading-[1.3]">
                    {slash(v.hireStart)} – {slash(v.hireEnd)} · {d(v.days)} days
                  </div>
                </th>
              ))}
            </tr>
            <tr>
              {vehicles.flatMap((_, i) => [
                <th key={`${i}-r`} className={`${headBase} text-right`}>Daily Rate</th>,
                <th key={`${i}-t`} className={`${headBase} text-right`}>Total</th>,
              ])}
            </tr>
          </thead>
          <tbody>
            {RATE_ROWS.map((row, r) => (
              <tr key={r}>
                <td className={`${cellBase} text-left`}>{row.label}</td>
                {vehicles.flatMap((v, vi) => [
                  <td key={`${vi}-r`} className={`${cellBase} text-right`}>{m0(v[row.key] as number)}</td>,
                  <td key={`${vi}-t`} className={`${cellBase} text-right`}>—</td>,
                ])}
              </tr>
            ))}
            <tr>
              <td className={`${cellBase} text-right`}>Daily Rate incl. Extras × Days</td>
              {vehicles.flatMap((v, vi) => [
                <td key={`${vi}-r`} className={`${cellBase} text-right`}>{m0(v.totalDailyRate)}</td>,
                <td key={`${vi}-t`} className={`${cellBase} text-right font-bold`}>{gbp(v.totalABICost || 0)}</td>,
              ])}
            </tr>
          </tbody>
        </table>
      ) : (
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className={`${headBase} text-left`}>Component</th>
              <th className={`${headBase} text-right w-36`}>Daily Rate</th>
              <th className={`${headBase} text-right w-36`}>Total</th>
            </tr>
          </thead>
          <tbody>
            {singleRateRows.map((r, i) => (
              <tr key={i}>
                <td className={cellBase}>{r.label}</td>
                <td className={`${cellBase} text-right`}>{m0(r.daily)}</td>
                <td className={`${cellBase} text-right`}>—</td>
              </tr>
            ))}
            <tr>
              <td className={`${cellBase} text-right`}>Daily Rate incl. Extras × {d(data.days)} days</td>
              <td className={`${cellBase} text-right`}>{m0(data.totalDailyRate)}</td>
              <td className={`${cellBase} text-right font-bold`}>{gbp(data.totalABICost || 0)}</td>
            </tr>
          </tbody>
        </table>
      )}

      {/* Totals */}
      <div className="self-stretch pt-2.5 flex flex-col items-end">
        <div className="w-80 flex flex-col">
          <div className="py-[3px] border-b border-stone-300 flex justify-between">
            <span className="text-xs leading-4">{multi ? "Combined ABI Cost (all vehicles)" : "Total ABI Cost"}</span>
            <span className="text-xs font-bold leading-4">{gbp(grandTotal)}</span>
          </div>
          <div className="pt-[5px] border-t-2 border-black flex justify-between items-center">
            <span className="text-xs font-bold uppercase leading-4">TOTAL ABI COST</span>
            <span className="text-xs font-bold leading-4">{gbp(grandTotal)}</span>
          </div>
        </div>
      </div>

      {/* Note */}
      <div className="self-stretch pt-6">
        <div className="self-stretch px-2 py-1.5 border border-black">
          <div className="text-xs leading-4">
            For payment after 30 days, please refer to the totals stated on the{" "}
            {multi ? <span className="font-bold">payment request letter</span> : "payment request letter"} enclosed with this pack.
          </div>
        </div>
      </div>

      <DocFooter label="ABI Hire Breakdown" />
    </DocShell>
  );
};

export default ABIHireBreakdownDoc;
