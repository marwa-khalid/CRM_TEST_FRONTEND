import { gbp, slash, longDate, m, d, cellBase, headBase, DocShell, DocHeader, SectionLabel, DocFooter } from "./docHelpers";

// Print/PDF document for the Credit Hire Invoice (rendered only for Print /
// Download / Email — never shown on screen). Values come from the edited form.
// Single vehicle: one flat Hire Charges table (Details / Days / Daily Rate / Amount).
// Multiple vehicles: the Vehicle & Hire Period table numbers each vehicle and the
// Hire Charges table groups Days/Rate/Amount columns per vehicle with a per-vehicle
// subtotal row — matching the "vehicle swap" figma.

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
  charges?: CreditHireDocCharge[]; // single-vehicle flat table
  // Multi-vehicle: one charge list per vehicle (same labels/order) + per-vehicle subtotal.
  vehicleCharges?: CreditHireDocCharge[][];
  vehicleSubtotals?: number[];
  subTotal?: number;
  vat?: number;
  totalDue?: number;
};

// Header cell for the grouped per-vehicle column (two lines: vehicle then dates).
// headBase's tall line-height would over-inflate a two-line cell, so this uses
// its own compact leading.
const groupHeadCls =
  "border border-black px-1.5 py-1 bg-gray-200 text-black text-center align-middle";

const CreditHireInvoiceDoc = ({ data }: { data: CreditHireDocData }) => {
  const vehicles = data.vehicles && data.vehicles.length ? data.vehicles : [{}];
  const multi = vehicles.length > 1;
  const vehiclesLabel = `${vehicles.length} Vehicle${vehicles.length === 1 ? "" : "s"}`;
  const charges = data.charges || [];
  const vehicleCharges = data.vehicleCharges || [];
  const vehicleSubtotals = data.vehicleSubtotals || [];
  // Charge row labels (shared across vehicles) drive the multi-vehicle table body.
  const chargeRows = (vehicleCharges[0] || charges).map((c) => c.label);

  // Column widths for the multi table: Details ~31%, the rest split evenly across
  // vehicle groups (Days / Rate / Amount = 25% / 37.5% / 37.5% of each group).
  const groupPct = multi ? 69 / vehicles.length : 0;

  return (
    <DocShell>
      <DocHeader ourRef={data.ourReference} yourRef={data.yourReference} dated={slash(data.invoiceDate)} />

      {/* Title + Bill To */}
      <div className="self-stretch pt-7 flex justify-between items-end">
        <div className="pt-3.5 pb-0.5 flex flex-col gap-1.5">
          <div className="text-[10px] uppercase leading-4">INVOICE · CREDIT HIRE</div>
          <div className="text-base font-bold uppercase leading-5">CREDIT HIRE INVOICE</div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className="text-right text-[12px] font-weight-600 uppercase leading-3 tracking-wider">BILL TO</div>
          <div className="text-right text-base font-weight-600 leading-5">{data.billTo || "—"}</div>
        </div>
      </div>

      {/* Invoice meta box — 2×2 */}
      <div className="self-stretch pt-3.5">
        <table className="w-full border-collapse table-fixed">
          <tbody>
            <tr>
              <td className={`${cellBase} w-1/2`}>
                <div className="flex justify-between items-center">
                  <span className="text-[10px]">Invoice No.:</span>
                  <span className="text-xs font-bold text-right">{data.invoiceNumber || "—"}</span>
                </div>
              </td>
              <td className={`${cellBase} w-1/2`}>
                <div className="flex justify-between items-center">
                  <span className="text-[10px]">Invoice Date:</span>
                  <span className="text-xs font-bold text-right">{slash(data.invoiceDate)}</span>
                </div>
              </td>
            </tr>
            <tr>
              <td className={cellBase}>
                <div className="flex justify-between items-center">
                  <span className="text-[10px]">Client:</span>
                  <span className="text-xs font-bold text-right">{data.client || "—"}</span>
                </div>
              </td>
              <td className={cellBase}>
                <div className="flex justify-between items-center">
                  <span className="text-[10px]">Vehicles:</span>
                  <span className="text-xs font-bold text-right">{vehiclesLabel}</span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
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
            <th className={`${headBase} text-left`}>Hire Start</th>
            <th className={`${headBase} text-left`}>Hire End</th>
            <th className={`${headBase} text-right w-16`}>Days</th>
          </tr>
        </thead>
        <tbody>
          {vehicles.map((v, i) => (
            <tr key={i}>
              <td className={cellBase}>{multi ? i + 1 : "—"}</td>
              <td className={cellBase}>{v.vehicle || "—"}</td>
              <td className={cellBase}>{v.registration || "—"}</td>
              <td className={cellBase}>{longDate(v.hireStart)}</td>
              <td className={cellBase}>{longDate(v.hireEnd)}</td>
              <td className={`${cellBase} text-right`}>{d(v.days)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <SectionLabel no="02." title="HIRE CHARGES" />
      {multi ? (
        <table className="w-full border-collapse table-fixed">
          <colgroup>
            <col style={{ width: "31%" }} />
            {vehicles.flatMap((_, i) => [
              <col key={`${i}-d`} style={{ width: `${groupPct * 0.25}%` }} />,
              <col key={`${i}-r`} style={{ width: `${groupPct * 0.375}%` }} />,
              <col key={`${i}-a`} style={{ width: `${groupPct * 0.375}%` }} />,
            ])}
          </colgroup>
          <thead>
            <tr>
              <th rowSpan={2} className={`${headBase} text-left align-bottom`}>Details</th>
              {vehicles.map((v, i) => (
                <th key={i} colSpan={3} className={groupHeadCls}>
                  <div className="text-[10px] font-bold leading-[1.4]">
                    Vehicle {i + 1} — {v.vehicle || "—"}
                    {v.registration ? ` · ${v.registration}` : ""}
                  </div>
                  <div className="text-[9px] font-normal leading-[1.3]">
                    {longDate(v.hireStart)} – {longDate(v.hireEnd)} · {d(v.days)} days
                  </div>
                </th>
              ))}
            </tr>
            <tr>
              {vehicles.flatMap((_, i) => [
                <th key={`${i}-d`} className={`${headBase} text-right`}>Days</th>,
                <th key={`${i}-r`} className={`${headBase} text-right`}>Rate</th>,
                <th key={`${i}-a`} className={`${headBase} text-right`}>Amount</th>,
              ])}
            </tr>
          </thead>
          <tbody>
            {chargeRows.map((label, r) => (
              <tr key={r}>
                <td className={`${cellBase} text-left`}>{label}</td>
                {vehicles.flatMap((_, vi) => {
                  const c: CreditHireDocCharge =
                    vehicleCharges[vi]?.[r] || { label };
                  return [
                    <td key={`${vi}-d`} className={`${cellBase} text-right`}>{d(c.days)}</td>,
                    <td key={`${vi}-r`} className={`${cellBase} text-right`}>{m(c.rate)}</td>,
                    <td key={`${vi}-a`} className={`${cellBase} text-right`}>{m(c.amount)}</td>,
                  ];
                })}
              </tr>
            ))}
            <tr>
              <td className={`${cellBase} text-left font-bold`}>Vehicle Subtotal</td>
              {vehicles.map((_, vi) => (
                <td key={vi} colSpan={3} className={`${cellBase} text-right font-bold`}>
                  {gbp(vehicleSubtotals[vi] || 0)}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      ) : (
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className={`${headBase} text-left`}>Details</th>
              <th className={`${headBase} text-right w-20`}>Days</th>
              <th className={`${headBase} text-right w-28`}>Daily Rate</th>
              <th className={`${headBase} text-right w-28`}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {charges.map((c, i) => (
              <tr key={i}>
                <td className={cellBase}>{c.label}</td>
                <td className={`${cellBase} text-right`}>{d(c.days)}</td>
                <td className={`${cellBase} text-right`}>{m(c.rate)}</td>
                <td className={`${cellBase} text-right`}>{m(c.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Totals */}
      <div className="self-stretch pt-2.5 flex flex-col items-end">
        <div className="w-80 flex flex-col">
          <div className="py-[3px] border-b border-stone-300 flex justify-between">
            <span className="text-xs leading-4">{multi ? "Sub Total (all vehicles)" : "Sub Total"}</span>
            <span className="text-xs font-bold leading-4">{gbp(data.subTotal || 0)}</span>
          </div>
          <div className="py-[3px] border-b border-stone-300 flex justify-between">
            <span className="text-xs leading-4">VAT @ 20%</span>
            <span className="text-xs font-bold leading-4">{gbp(data.vat || 0)}</span>
          </div>
          <div className="pt-[5px] border-t-2 border-black flex justify-between items-center">
            <span className="text-xs font-bold uppercase leading-4">TOTAL DUE</span>
            <span className="text-xs font-bold leading-4">{gbp(data.totalDue || 0)}</span>
          </div>
        </div>
      </div>

      <DocFooter label="Credit Hire Invoice" />
    </DocShell>
  );
};

export default CreditHireInvoiceDoc;
