import { gbp, slash, datedLong, m0, d } from "./docHelpers";
import { SlateShell, SlateSectionLabel, SlateMeta, SlateNote, SlateTotalStrip, slateCell, slateHead, LIGHT } from "./slateDoc";

// Print/PDF document for the ABI Hire Breakdown (Slate design). Single (selected)
// vehicle — matches the per-vehicle behaviour of the main screens.

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
};

const ABIHireBreakdownDoc = ({ data }: { data: ABIBreakdownDocData }) => {
  const rateRows = [
    { label: "ABI Hire Rate", daily: data.abiHireRate },
    { label: "Tow Bar", daily: data.towBar },
    { label: "Dual Control", daily: data.dualControl },
    { label: "Other", daily: data.other },
    { label: "Total Additional Daily Charges", daily: data.totalAdditionalDaily },
  ];

  return (
    <SlateShell title="Breakdown" titleSub="ABI Hire · 30-Day" footerLabel="ABI Hire Breakdown">
      {/* Intro */}
      <div className="mt-6 text-[11px] leading-5 text-slate-600">
        Breakdown of ABI hire costs including additional charges, calculated on the basis of settlement within 30 days.
      </div>

      {/* Meta grid */}
      <div className="mt-6 grid grid-cols-4 gap-6">
        <SlateMeta label="Our Reference" value={data.ourReference || "—"} />
        <SlateMeta label="Your Reference" value={data.yourReference || "—"} />
        <SlateMeta label="Dated" value={datedLong(data.dated)} />
        <SlateMeta label="Group" value={data.group || "—"} />
      </div>

      {/* Vehicle & hire period */}
      <SlateSectionLabel>Vehicle &amp; Hire Period</SlateSectionLabel>
      <table className="w-full border-collapse">
        <thead>
          <tr style={{ backgroundColor: LIGHT }}>
            <th className={`${slateHead} w-8`}>#</th>
            <th className={slateHead}>Vehicle</th>
            <th className={slateHead}>Registration</th>
            <th className={slateHead}>Group</th>
            <th className={slateHead}>Hire Start</th>
            <th className={slateHead}>Hire End</th>
            <th className={`${slateHead} text-right w-14`}>Days</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className={slateCell}>1</td>
            <td className={slateCell}>{data.vehicle || "—"}</td>
            <td className={slateCell}>{data.registration || "—"}</td>
            <td className={slateCell}>{data.group || "—"}</td>
            <td className={slateCell}>{slash(data.hireStart)}</td>
            <td className={slateCell}>{slash(data.hireEnd)}</td>
            <td className={`${slateCell} text-right`}>{d(data.days)}</td>
          </tr>
        </tbody>
      </table>

      {/* Rate & extras */}
      <SlateSectionLabel>Rate &amp; Extras</SlateSectionLabel>
      <table className="w-full border-collapse">
        <thead>
          <tr style={{ backgroundColor: LIGHT }}>
            <th className={slateHead}>Component</th>
            <th className={`${slateHead} text-right w-36`}>Daily Rate</th>
            <th className={`${slateHead} text-right w-36`}>Total</th>
          </tr>
        </thead>
        <tbody>
          {rateRows.map((r, i) => (
            <tr key={i}>
              <td className={slateCell}>{r.label}</td>
              <td className={`${slateCell} text-right`}>{m0(r.daily)}</td>
              <td className={`${slateCell} text-right`}>—</td>
            </tr>
          ))}
          <tr>
            <td className={`${slateCell} text-right`}>Daily Rate incl. Extras × {d(data.days)} days</td>
            <td className={`${slateCell} text-right`}>{m0(data.totalDailyRate)}</td>
            <td className={`${slateCell} text-right font-bold`}>{gbp(data.totalABICost || 0)}</td>
          </tr>
        </tbody>
      </table>

      {/* Total */}
      <div className="mt-6 flex justify-end">
        <div className="w-80 flex flex-col gap-2">
          <SlateTotalStrip label="Total ABI Cost" value={gbp(data.totalABICost || 0)} />
        </div>
      </div>

      {/* Note */}
      <div className="mt-6">
        <SlateNote>
          For payment after 30 days, please refer to the totals stated on the payment request letter enclosed with this pack.
        </SlateNote>
      </div>
    </SlateShell>
  );
};

export default ABIHireBreakdownDoc;
