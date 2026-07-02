import { gbp, slash, longDate, m, d, cellBase, headBase, DocShell, DocHeader, SectionLabel, DocFooter } from "./docHelpers";

// Print/PDF document for the Credit Hire Invoice (rendered only for Print /
// Download / Email — never shown on screen). Values come from the edited form.
// Supports multiple vehicles: one row per vehicle in the Vehicle & Hire Period
// table, mirroring the per-vehicle behaviour on the main screens.

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

      <SectionLabel no="01." title="VEHICLE & HIRE PERIOD" />
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className={`${headBase} text-left w-10`}>Veh</th>
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

      {/* Totals */}
      <div className="self-stretch pt-2.5 flex flex-col items-end">
        <div className="w-80 flex flex-col">
          <div className="py-[3px] border-b border-stone-300 flex justify-between">
            <span className="text-xs leading-4">Sub Total</span>
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
