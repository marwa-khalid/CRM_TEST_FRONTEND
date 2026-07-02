import { gbp, slash, m, cellBase, headBase, DocShell, DocHeader, SectionLabel, DocFooter } from "./docHelpers";

// Print/PDF document for the Plating Costs Invoice (non-editable). Built from the
// edited form values. Lists every vehicle on the claim in Vehicle Details.

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
    <DocShell>
      <DocHeader
        ourRef={data.ourReference}
        yourRef={data.yourReference}
        dated={slash(data.invoiceDate)}
      />

      {/* Title + Bill To */}
      <div className="self-stretch pt-7 flex justify-between items-end">
        <div className="pt-3.5 pb-0.5 flex flex-col gap-1.5">
          <div className="text-[10px] uppercase leading-4">
            INVOICE · PLATING COSTS
          </div>
          <div className="text-base font-bold uppercase leading-5">
            PLATING COSTS INVOICE
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className="text-right text-[12px] font-weight-600 uppercase leading-3 tracking-wider">
            BILL TO
          </div>
          <div className="text-right text-base font-weight-600 leading-5">
            {data.billTo || "—"}
          </div>
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
                  <span className="text-xs font-bold text-right">
                    {data.invoiceNumber || "—"}
                  </span>
                </div>
              </td>
              <td className={`${cellBase} w-1/2`}>
                <div className="flex justify-between items-center">
                  <span className="text-[10px]">Invoice Date:</span>
                  <span className="text-xs font-bold text-right">
                    {slash(data.invoiceDate)}
                  </span>
                </div>
              </td>
            </tr>
            <tr>
              <td className={cellBase}>
                <div className="flex justify-between items-center">
                  <span className="text-[10px]">Client:</span>
                  <span className="text-xs font-bold text-right">
                    {data.client || "—"}
                  </span>
                </div>
              </td>
              <td className={cellBase}>
                <div className="flex justify-between items-center">
                  <span className="text-[10px]">Vehicles:</span>
                  <span className="text-xs font-bold text-right">
                    {vehiclesLabel}
                  </span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <SectionLabel no="01." title="VEHICLE DETAILS" />
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className={`${headBase} text-left w-14`}>Veh</th>
            <th className={`${headBase} text-left`}>Vehicle</th>
            <th className={`${headBase} text-left`}>Registration</th>
          </tr>
        </thead>
        <tbody>
          {vehicles.map((v, i) => (
            <tr key={i}>
              <td className={cellBase}>{multi ? i + 1 : "—"}</td>
              <td className={cellBase}>{v.vehicle || "—"}</td>
              <td className={cellBase}>{v.registration || "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <SectionLabel no="02." title="CHARGES" />
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className={`${headBase} text-left`}>Details</th>
            <th className={`${headBase} text-right w-44`}>Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className={cellBase}>Private Hire MOT</td>
            <td className={`${cellBase} text-right`}>
              {m(data.privateHireMot)}
            </td>
          </tr>
          <tr>
            <td className={cellBase}>Private Hire Plating Costs</td>
            <td className={`${cellBase} text-right`}>
              {m(data.privateHirePlatingCosts)}
            </td>
          </tr>
        </tbody>
      </table>

      {/* Total Due */}
      <div className="self-stretch pt-2.5 flex flex-col items-end">
        <div className="w-72 flex flex-col">
          <div className="pt-[5px] border-t-2 border-black flex justify-between items-center">
            <span className="text-xs font-bold uppercase leading-4">
              TOTAL DUE
            </span>
            <span className="text-xs font-bold leading-4">
              {gbp(data.total || 0)}
            </span>
          </div>
        </div>
      </div>

      <DocFooter label="Plating Costs Invoice" />
    </DocShell>
  );
};

export default PlatingInvoiceDoc;
