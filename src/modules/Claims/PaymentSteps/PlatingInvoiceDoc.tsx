import { gbp, shortSlash, m, d, packCell, packHead, DocShell } from "./docHelpers";

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

const lines = (vehicles: PlatingDocVehicle[], key: "registration" | "vehicle") =>
  vehicles.map((v) => d(v[key])).join("\n");

const PlatingInvoiceDoc = ({ data }: { data: PlatingInvoiceDocData }) => {
  const vehicles = data.vehicles && data.vehicles.length ? data.vehicles : [{}];
  const multi = vehicles.length > 1;

  return (
    <DocShell>
      <div className="mt-[54px] w-[250px] text-[10px] leading-[1.35] whitespace-pre-line">
        <div className="font-bold mb-2">Bill To:</div>
        <div>{data.billTo || "—"}</div>
      </div>

      <div className="mt-10 grid grid-cols-[92px_1fr] gap-y-1 text-[10px] leading-[1.35]">
        <div>Invoice Date:</div>
        <div>{shortSlash(data.invoiceDate)}</div>
        <div>Invoice Number:</div>
        <div>{data.invoiceNumber || "—"}</div>
      </div>

      <h1 className="mt-5 mb-3 text-center text-[16px] font-bold tracking-wide">
        PLATING INVOICE
      </h1>

      <table className="w-[470px] mx-auto border-collapse table-fixed mb-5">
        <thead>
          <tr>
            <th className={`${packHead} w-[33%] text-center`}>Client</th>
            <th className={`${packHead} w-[33%] text-center`}>Vehicle<br />Registration</th>
            <th className={`${packHead} w-[34%] text-center`}>Vehicle Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className={`${packCell} text-center`}>{data.client || "—"}</td>
            <td className={`${packCell} text-center whitespace-pre-line`}>{lines(vehicles, "registration")}</td>
            <td className={`${packCell} text-center whitespace-pre-line`}>{lines(vehicles, "vehicle")}</td>
          </tr>
        </tbody>
      </table>

      <table className="w-[560px] mx-auto border-collapse table-fixed">
        <thead>
          <tr>
            <th className={`${packHead} text-center`}>Details</th>
            {multi ? (
              vehicles.map((vehicle, index) => (
                <th key={index} className={`${packHead} text-center w-[90px]`}>
                  Vehicle {index + 1}
                  <br />
                  <span className="font-normal">{vehicle.registration || "—"}</span>
                </th>
              ))
            ) : (
              <th className={`${packHead} text-center w-[140px]`}>Amount</th>
            )}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className={packCell}>Private Hire MOT</td>
            {multi ? (
              vehicles.map((vehicle, index) => (
                <td key={index} className={`${packCell} text-right`}>{m(vehicle.privateHireMot)}</td>
              ))
            ) : (
              <td className={`${packCell} text-right`}>{m(data.privateHireMot)}</td>
            )}
          </tr>
          <tr>
            <td className={packCell}>Private Hire Plating Costs</td>
            {multi ? (
              vehicles.map((vehicle, index) => (
                <td key={index} className={`${packCell} text-right`}>{m(vehicle.privateHirePlatingCosts)}</td>
              ))
            ) : (
              <td className={`${packCell} text-right`}>{m(data.privateHirePlatingCosts)}</td>
            )}
          </tr>
          {multi ? (
            <tr>
              <td className={`${packCell} font-bold bg-[#d9d9d9]`}>Vehicle Subtotal</td>
              {vehicles.map((vehicle, index) => (
                <td key={index} className={`${packCell} text-right font-bold bg-[#d9d9d9]`}>
                  {gbp(vehicle.subtotal || 0)}
                </td>
              ))}
            </tr>
          ) : null}
          <tr>
            <td className={`${packCell} border-none`} />
            <td
              className={`${packCell} text-right font-bold bg-[#d9d9d9]`}
              colSpan={multi ? vehicles.length : 1}
            >
              TOTAL&nbsp;&nbsp;&nbsp;{gbp(data.total || 0)}
            </td>
          </tr>
        </tbody>
      </table>
    </DocShell>
  );
};

export default PlatingInvoiceDoc;
