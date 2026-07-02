import { gbp, slash, longDate, m, d } from "./docHelpers";
import { SlateShell, SlateSectionLabel, SlateMeta, SlateCard, SlateTotalStrip, slateCell, slateHead, LIGHT } from "./slateDoc";

// Print/PDF document for the Credit Hire Invoice (Slate design). Rendered only
// for Print / Download / Email — never shown on screen. Supports multiple
// vehicles: one row per vehicle, mirroring the main screens.

export type CreditHireDocVehicle = {
  vehicle?: string;
  registration?: string;
  hireStart?: string; // YYYY-MM-DD
  hireEnd?: string; // YYYY-MM-DD
  days?: string | number;
};

export type CreditHireDocCharge = {
  label: string;
  days?: string | number;
  rate?: string | number;
  amount?: string | number;
};

export type CreditHireDocData = {
  ourReference?: string;
  invoiceNumber?: string;
  invoiceDate?: string; // YYYY-MM-DD
  yourReference?: string;
  client?: string;
  billTo?: string;
  vehicles?: CreditHireDocVehicle[];
  charges?: CreditHireDocCharge[];
  subTotal?: number;
  vat?: number;
  totalDue?: number;
};

const CreditHireInvoiceDoc = ({ data }: { data: CreditHireDocData }) => {
  const vehicles = data.vehicles && data.vehicles.length ? data.vehicles : [{}];
  const multi = vehicles.length > 1;
  const vehiclesLabel = multi ? `${vehicles.length} (Multiple)` : "1 (Single)";
  const charges = data.charges || [];

  return (
    <SlateShell title="Invoice" titleSub={`# ${data.invoiceNumber || "—"}`} footerLabel="Credit Hire Invoice">
      {/* Meta grid */}
      <div className="mt-6 grid grid-cols-4 gap-6">
        <SlateMeta label="Invoice Date" value={slash(data.invoiceDate)} />
        <SlateMeta label="Our Reference" value={data.ourReference || "—"} />
        <SlateMeta label="Your Reference" value={data.yourReference || "—"} />
        <SlateMeta label="Vehicles" value={vehiclesLabel} />
      </div>

      {/* Bill to / client */}
      <div className="mt-7 flex gap-4">
        <SlateCard title="Bill To">
          <div className="text-[13px] font-weight-600 text-slate-800 mt-1">{data.billTo || "—"}</div>
          <div className="text-[11px] text-slate-500">Ref: {data.yourReference || "—"}</div>
        </SlateCard>
        <SlateCard title="Client">
          <div className="text-[13px] font-weight-600 text-slate-800 mt-1">{data.client || "—"}</div>
        </SlateCard>
      </div>

      {/* Vehicle & hire period */}
      <SlateSectionLabel>Vehicle &amp; Hire Period</SlateSectionLabel>
      <table className="w-full border-collapse">
        <thead>
          <tr style={{ backgroundColor: LIGHT }}>
            <th className={`${slateHead} w-8`}>#</th>
            <th className={slateHead}>Vehicle</th>
            <th className={slateHead}>Registration</th>
            <th className={slateHead}>Hire Start</th>
            <th className={slateHead}>Hire End</th>
            <th className={`${slateHead} text-right w-14`}>Days</th>
          </tr>
        </thead>
        <tbody>
          {vehicles.map((v, i) => (
            <tr key={i}>
              <td className={slateCell}>{multi ? i + 1 : "1"}</td>
              <td className={slateCell}>{v.vehicle || "—"}</td>
              <td className={slateCell}>{v.registration || "—"}</td>
              <td className={slateCell}>{longDate(v.hireStart)}</td>
              <td className={slateCell}>{longDate(v.hireEnd)}</td>
              <td className={`${slateCell} text-right`}>{d(v.days)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Hire charges */}
      <SlateSectionLabel>Hire Charges</SlateSectionLabel>
      <table className="w-full border-collapse">
        <thead>
          <tr style={{ backgroundColor: LIGHT }}>
            <th className={slateHead}>Details</th>
            <th className={`${slateHead} text-right w-20`}>Days</th>
            <th className={`${slateHead} text-right w-28`}>Daily Rate</th>
            <th className={`${slateHead} text-right w-28`}>Amount</th>
          </tr>
        </thead>
        <tbody>
          {charges.map((c, i) => (
            <tr key={i}>
              <td className={slateCell}>{c.label}</td>
              <td className={`${slateCell} text-right`}>{d(c.days)}</td>
              <td className={`${slateCell} text-right`}>{m(c.rate)}</td>
              <td className={`${slateCell} text-right font-weight-600`}>{m(c.amount)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals */}
      <div className="mt-6 flex justify-end">
        <div className="w-96 flex flex-col gap-2">
          <div className="flex justify-between px-3">
            <span className="text-[12px] text-slate-500">Sub Total</span>
            <span className="text-[12px] font-weight-600 text-slate-800">{gbp(data.subTotal || 0)}</span>
          </div>
          <div className="flex justify-between px-3">
            <span className="text-[12px] text-slate-500">VAT @ 20%</span>
            <span className="text-[12px] font-weight-600 text-slate-800">{gbp(data.vat || 0)}</span>
          </div>
          <SlateTotalStrip label="Total Due" value={gbp(data.totalDue || 0)} />
        </div>
      </div>
    </SlateShell>
  );
};

export default CreditHireInvoiceDoc;
