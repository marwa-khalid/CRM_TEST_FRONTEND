import { gbp, slash, m } from "./docHelpers";
import { SlateShell, SlateSectionLabel, SlateMeta, SlateCard, SlateTotalStrip, slateCell, slateHead, LIGHT } from "./slateDoc";

// Print/PDF document for the Plating Costs Invoice (Slate design). Lists every
// vehicle on the claim in Vehicle Details.

export type PlatingDocVehicle = { vehicle?: string; registration?: string };

export type PlatingInvoiceDocData = {
  ourReference?: string;
  invoiceNumber?: string;
  invoiceDate?: string; // YYYY-MM-DD
  yourReference?: string;
  client?: string;
  billTo?: string;
  vehicles?: PlatingDocVehicle[];
  privateHireMot?: string | number;
  privateHirePlatingCosts?: string | number;
  total?: number;
};

const PlatingInvoiceDoc = ({ data }: { data: PlatingInvoiceDocData }) => {
  const vehicles = data.vehicles && data.vehicles.length ? data.vehicles : [{}];
  const multi = vehicles.length > 1;
  const vehiclesLabel = multi ? `${vehicles.length} (Multiple)` : "1 (Single)";

  return (
    <SlateShell title="Invoice" titleSub="Plating Costs" footerLabel="Plating Costs Invoice">
      {/* Meta grid */}
      <div className="mt-6 grid grid-cols-4 gap-6">
        <SlateMeta label="Invoice No." value={data.invoiceNumber || "—"} />
        <SlateMeta label="Invoice Date" value={slash(data.invoiceDate)} />
        <SlateMeta label="Our Reference" value={data.ourReference || "—"} />
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

      {/* Vehicle details */}
      <SlateSectionLabel>Vehicle Details</SlateSectionLabel>
      <table className="w-full border-collapse">
        <thead>
          <tr style={{ backgroundColor: LIGHT }}>
            <th className={`${slateHead} w-12`}>#</th>
            <th className={slateHead}>Vehicle</th>
            <th className={slateHead}>Registration</th>
          </tr>
        </thead>
        <tbody>
          {vehicles.map((v, i) => (
            <tr key={i}>
              <td className={slateCell}>{multi ? i + 1 : "1"}</td>
              <td className={slateCell}>{v.vehicle || "—"}</td>
              <td className={slateCell}>{v.registration || "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Charges */}
      <SlateSectionLabel>Charges</SlateSectionLabel>
      <table className="w-full border-collapse">
        <thead>
          <tr style={{ backgroundColor: LIGHT }}>
            <th className={slateHead}>Details</th>
            <th className={`${slateHead} text-right w-44`}>Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className={slateCell}>Private Hire MOT</td>
            <td className={`${slateCell} text-right`}>{m(data.privateHireMot)}</td>
          </tr>
          <tr>
            <td className={slateCell}>Private Hire Plating Costs</td>
            <td className={`${slateCell} text-right`}>{m(data.privateHirePlatingCosts)}</td>
          </tr>
        </tbody>
      </table>

      {/* Total */}
      <div className="mt-6 flex justify-end">
        <div className="w-72 flex flex-col gap-2">
          <SlateTotalStrip label="Total Due" value={gbp(data.total || 0)} />
        </div>
      </div>
    </SlateShell>
  );
};

export default PlatingInvoiceDoc;
