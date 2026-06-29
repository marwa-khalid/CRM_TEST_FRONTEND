import { gbp, slash, datedLong, m0, d, cellBase, headBase, DocShell, DocHeader, SectionLabel, DocFooter } from "./docHelpers";

// Print/PDF document for the ABI Hire Breakdown (non-editable). Built from the
// edited form values. Single (selected) vehicle — matches the per-vehicle
// behaviour of the main screens.

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

      <SectionLabel no="01." title="VEHICLE & HIRE PERIOD" />
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className={`${headBase} text-left w-10`}>Veh</th>
            <th className={`${headBase} text-left`}>Vehicle</th>
            <th className={`${headBase} text-left`}>Registration</th>
            <th className={`${headBase} text-left`}>Group</th>
            <th className={`${headBase} text-left`}>Hire Start</th>
            <th className={`${headBase} text-left`}>Hire End</th>
            <th className={`${headBase} text-right w-14`}>Days</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className={cellBase}>—</td>
            <td className={cellBase}>{data.vehicle || "—"}</td>
            <td className={cellBase}>{data.registration || "—"}</td>
            <td className={cellBase}>{data.group || "—"}</td>
            <td className={cellBase}>{slash(data.hireStart)}</td>
            <td className={cellBase}>{slash(data.hireEnd)}</td>
            <td className={`${cellBase} text-right`}>{d(data.days)}</td>
          </tr>
        </tbody>
      </table>

      <SectionLabel no="02." title="RATE & EXTRAS" />
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className={`${headBase} text-left`}>Component</th>
            <th className={`${headBase} text-right w-36`}>Daily Rate</th>
            <th className={`${headBase} text-right w-36`}>Total</th>
          </tr>
        </thead>
        <tbody>
          {rateRows.map((r, i) => (
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

      {/* Totals */}
      <div className="self-stretch pt-2.5 flex flex-col items-end">
        <div className="w-80 flex flex-col">
          <div className="py-[3px] border-b border-stone-300 flex justify-between">
            <span className="text-xs leading-4">Total ABI Cost</span>
            <span className="text-xs font-bold leading-4">{gbp(data.totalABICost || 0)}</span>
          </div>
          <div className="pt-[5px] border-t-2 border-black flex justify-between items-center">
            <span className="text-xs font-bold uppercase leading-4">TOTAL ABI COST</span>
            <span className="text-xs font-bold leading-4">{gbp(data.totalABICost || 0)}</span>
          </div>
        </div>
      </div>

      {/* Note */}
      <div className="self-stretch pt-6">
        <div className="self-stretch px-2 py-1.5 border border-black">
          <div className="text-xs leading-4">
            For payment after 30 days, please refer to the totals stated on the payment request letter enclosed with this pack.
          </div>
        </div>
      </div>

      <DocFooter label="ABI Hire Breakdown" />
    </DocShell>
  );
};

export default ABIHireBreakdownDoc;
