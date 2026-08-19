import {
  gbp,
  shortSlash,
  m,
  d,
  packCell,
  packHead,
  DocShell,
} from "./docHelpers";

export type PlatingDocVehicle = {
  vehicle?: string;
  registration?: string;
  privateHireMot?: string | number;
  privateHirePlatingCosts?: string | number;
  subtotal?: number;
};

export type PlatingInvoiceDocData = {
  ourReference?: string;
  invoiceNumber?: string;
  invoiceDate?: string;
  yourReference?: string;
  client?: string;
  billTo?: string;
  vehicles?: PlatingDocVehicle[];
  privateHireMot?: string | number;
  privateHirePlatingCosts?: string | number;
  total?: number;
};

const lines = (
  vehicles: PlatingDocVehicle[],
  key: "registration" | "vehicle",
) => vehicles.map((v) => d(v[key])).join("\n");

// Main invoice detail cells. Each cell draws only its RIGHT + BOTTOM edge; the
// first column adds `border-l` and the header row adds `border-t` (below), so every
// gridline is drawn exactly once — otherwise html2canvas doubles the shared borders
// into a bold 2px line in the downloaded PDF.
const invoiceCell =
  "border-r border-b border-[#808080] p-0 text-[9px] leading-[1.35] align-middle";

// Fixed inner height gives more reliable vertical centring in generated PDFs.
const invoiceCellInner = "min-h-[50px] px-1.5 flex items-center";

// Local main-table header so Details / Amount / Vehicle headings
// are genuinely vertically centred.
const invoiceHead =
  "border-t border-r border-b border-[#808080] bg-[#d9d9d9] p-0 text-[9px] font-bold";

const invoiceHeadInner =
  "min-h-[30px] px-1.5 flex items-center justify-center text-center";

const PlatingInvoiceDoc = ({ data }: { data: PlatingInvoiceDocData }) => {
  const vehicles = data.vehicles && data.vehicles.length ? data.vehicles : [{}];

  const multi = vehicles.length > 1;

  return (
    <DocShell>
      {/* BILL TO */}
      <div className="mt-[54px] w-[250px] text-[10px] leading-[1.35] whitespace-pre-line">
        <div className="font-bold mb-2">Bill To:</div>
        <div>{data.billTo || "—"}</div>
      </div>

      {/* INVOICE DETAILS */}
      <div className="mt-10 grid grid-cols-[92px_1fr] gap-y-1 text-[10px] leading-[1.35]">
        <div>Invoice Date:</div>
        <div>{shortSlash(data.invoiceDate)}</div>

        <div>Invoice Number:</div>
        <div>{data.invoiceNumber || "—"}</div>
      </div>

      {/* TITLE */}
      <h1 className="mt-5 mb-3 text-center text-[16px] font-bold tracking-wide">
        PLATING COSTS INVOICE
      </h1>

      {/* CLIENT / VEHICLE TABLE */}
      <table className="w-[515px] mx-auto border-collapse table-fixed mb-5">
        <thead>
          <tr>
            <th className={`${packHead} w-[29%] text-center`}>Client</th>

            <th className={`${packHead} w-[22%] text-center`}>
              Vehicle
              <br />
              Registration
            </th>

            <th className={`${packHead} w-[49%] text-center`}>
              Vehicle Description
            </th>
          </tr>
        </thead>

        <tbody>
          <tr>
            <td className={`${packCell} text-center`}>{data.client || "—"}</td>

            <td className={`${packCell} text-center whitespace-pre-line`}>
              {lines(vehicles, "registration")}
            </td>

            <td className={`${packCell} text-center whitespace-pre-line`}>
              {lines(vehicles, "vehicle")}
            </td>
          </tr>
        </tbody>
      </table>

      {/* MAIN PLATING COST TABLE */}
      <table className="w-[600px] mx-auto border-collapse table-fixed">
        <thead>
          <tr>
            {/* DETAILS */}
            <th className={`${invoiceHead} border-l`}>
              <div className={invoiceHeadInner}>Details</div>
            </th>

            {/* MULTI VEHICLE HEADERS */}
            {multi ? (
              vehicles.map((vehicle, index) => (
                <th
                  key={`vehicle-head-${index}`}
                  className={`${invoiceHead} w-[95px]`}
                >
                  <div className={invoiceHeadInner}>
                    <div>
                      Vehicle {index + 1}
                      <br />
                      <span className="font-normal">
                        {vehicle.registration || "—"}
                      </span>
                    </div>
                  </div>
                </th>
              ))
            ) : (
              /* SINGLE VEHICLE AMOUNT HEADER */
              <th className={`${invoiceHead} w-[175px]`}>
                <div className={invoiceHeadInner}>Amount</div>
              </th>
            )}
          </tr>
        </thead>

        <tbody>
          {/* PRIVATE HIRE MOT */}
          <tr>
            <td className={`${invoiceCell} border-l ${multi ? "" : "font-bold"}`}>
              <div
                className={`${invoiceCellInner} justify-center text-center`}
              >
                Private Hire MOT
              </div>
            </td>

            {multi ? (
              vehicles.map((vehicle, index) => (
                <td key={`mot-${index}`} className={invoiceCell}>
                  <div className={`${invoiceCellInner} justify-end text-right`}>
                    {m(vehicle.privateHireMot)}
                  </div>
                </td>
              ))
            ) : (
              <td className={invoiceCell}>
                <div className={`${invoiceCellInner} justify-end text-right`}>
                  {m(data.privateHireMot)}
                </div>
              </td>
            )}
          </tr>

          {/* PRIVATE HIRE PLATING COSTS */}
          <tr>
            <td className={`${invoiceCell} border-l ${multi ? "" : "font-bold"}`}>
              <div
                className={`${invoiceCellInner} justify-center text-center`}
              >
                Private Hire Plating Costs
              </div>
            </td>

            {multi ? (
              vehicles.map((vehicle, index) => (
                <td key={`plating-${index}`} className={invoiceCell}>
                  <div className={`${invoiceCellInner} justify-end text-right`}>
                    {m(vehicle.privateHirePlatingCosts)}
                  </div>
                </td>
              ))
            ) : (
              <td className={invoiceCell}>
                <div className={`${invoiceCellInner} justify-end text-right`}>
                  {m(data.privateHirePlatingCosts)}
                </div>
              </td>
            )}
          </tr>

          {/* FINAL TOTAL */}
          <tr>
            <td className="border-none" />

            <td
              className="border-l border-r border-b border-[#808080] bg-[#d9d9d9] p-0 text-[9px] font-bold"
              colSpan={multi ? vehicles.length : 1}
            >
              <div className="h-[50px] px-[8px] flex items-center">
                <span className="flex-1 text-right pr-[20px]">Total</span>

                <span className="w-[65px] text-right whitespace-nowrap">
                  {gbp(data.total || 0)}
                </span>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </DocShell>
  );
};

export default PlatingInvoiceDoc;
