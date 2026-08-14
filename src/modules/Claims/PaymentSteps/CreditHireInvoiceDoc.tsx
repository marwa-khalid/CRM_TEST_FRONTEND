import { gbp, shortSlash, m, d, packCell, packHead, DocShell, toNum } from "./docHelpers";

export type CreditHireDocVehicle = {
  vehicle?: string;
  registration?: string;
  group?: string;
  hireStart?: string;
  hireEnd?: string;
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
  invoiceDate?: string;
  yourReference?: string;
  client?: string;
  billTo?: string;
  vehicles?: CreditHireDocVehicle[];
  charges?: CreditHireDocCharge[];
  vehicleCharges?: CreditHireDocCharge[][];
  vehicleSubtotals?: number[];
  subTotal?: number;
  vat?: number;
  totalDue?: number;
};

const vehicleLines = (items: CreditHireDocVehicle[], key: "registration" | "vehicle") =>
  items.map((v) => d(v[key])).join("\n");

const chargeHead =
  "border border-black bg-[#d9d9d9] px-1.5 py-1 text-[9px] font-bold leading-[1.25] align-middle";
const chargeCell = "px-1.5 py-2 text-[9px] leading-[1.35] align-middle";
const separatedChargeCell = `${chargeCell} border-t border-black`;

const buildChargeRows = (
  vehicles: CreditHireDocVehicle[],
  charges: CreditHireDocCharge[],
  vehicleCharges?: CreditHireDocCharge[][],
) => {
  if (!vehicleCharges?.length) return charges;

  const sumAmounts = (label: string) =>
    vehicleCharges.reduce((sum, rows) => {
      const row = (rows || []).find((charge) => charge.label === label);
      return sum + toNum(row?.amount);
    }, 0);
  const firstFor = (label: string) =>
    vehicleCharges.flat().find((charge) => charge.label === label && (charge.days || charge.rate || charge.amount));
  const commonRow = (label: string): CreditHireDocCharge | null => {
    const first = firstFor(label);
    const amount = sumAmounts(label);
    if (!first && !amount) return null;
    return {
      label,
      days: first?.days,
      rate: first?.rate,
      amount,
    };
  };

  const rows: CreditHireDocCharge[] = [];
  vehicles.forEach((vehicle, vehicleIndex) => {
    const charge = (vehicleCharges[vehicleIndex] || []).find((row) => row.label === "Basic Hire Rate");
    if (!charge) return;
    const days = charge.days || vehicle.days;
    const group = vehicle.group ? `\n${vehicle.group}` : "";
    rows.push({
      ...charge,
      label: `${d(days)} Days Charged at Basic Hire Rate${group}`,
      days,
    });
  });
  [
    commonRow("Collection & Delivery Charge"),
    commonRow("Admin Fee"),
    commonRow("Automatic"),
    commonRow("Collision Damage Waiver"),
  ].forEach((row) => {
    if (row) rows.push(row);
  });
  return rows;
};

const CreditHireInvoiceDoc = ({ data }: { data: CreditHireDocData }) => {
  const vehicles = data.vehicles && data.vehicles.length ? data.vehicles : [{}];
  const chargeRows = buildChargeRows(vehicles, data.charges || [], data.vehicleCharges);
  const first = vehicles[0] || {};
  const last = vehicles[vehicles.length - 1] || first;
  const basicHireRows = chargeRows.filter((charge) =>
    charge.label.includes("Days Charged at Basic Hire Rate"),
  ).length;

  return (
    <DocShell>
      <div className="mt-[40px] w-[250px] text-[10px] leading-[1.35] whitespace-pre-line">
        <div className="font-bold mb-2">Bill To:</div>
        <div>{data.billTo || "—"}</div>
      </div>

      <div className="mt-10 grid grid-cols-[92px_1fr] gap-y-1 text-[10px] leading-[1.35]">
        <div>Invoice Date:</div>
        <div>{shortSlash(data.invoiceDate)}</div>
        <div>Invoice Number:</div>
        <div>{data.invoiceNumber || "—"}</div>
        <div className="mt-3">Hire Start:</div>
        <div className="mt-3">{shortSlash(first.hireStart)}</div>
        <div>Hire End:</div>
        <div>{shortSlash(last.hireEnd)}</div>
        <div>Total Hire Days:</div>
        <div>{d(vehicles.reduce((sum, v) => sum + toNum(v.days), 0) || first.days)} Days</div>
      </div>

      <h1 className="mt-3 mb-3 text-center text-[16px] font-bold tracking-wide">
        CREDIT HIRE INVOICE
      </h1>

      <table className="w-[470px] mx-auto border-collapse table-fixed mb-5">
        <thead>
          <tr>
            <th className={`${packHead} w-[33%] text-center`}>Client</th>
            <th className={`${packHead} w-[33%] text-center`}>Hire Vehicle<br />Registration</th>
            <th className={`${packHead} w-[34%] text-center`}>Vehicle Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className={`${packCell} text-center`}>{data.client || "—"}</td>
            <td className={`${packCell} text-center whitespace-pre-line`}>{vehicleLines(vehicles, "registration")}</td>
            <td className={`${packCell} text-center whitespace-pre-line`}>{vehicleLines(vehicles, "vehicle")}</td>
          </tr>
        </tbody>
      </table>

      <table className="w-[560px] mx-auto border-collapse table-fixed">
        <thead>
          <tr>
            <th className={`${chargeHead} text-center w-[48%]`}>Details</th>
            <th className={`${chargeHead} text-center w-[16%]`}>No of Days<br />Hire</th>
            <th className={`${chargeHead} text-center w-[18%]`}>Daily<br />Rate £</th>
            <th className={`${chargeHead} text-center w-[18%]`}>Amount £</th>
          </tr>
        </thead>
        <tbody>
          {chargeRows.map((charge, index) => {
            const startsNewGroup = index === 0 || index >= basicHireRows;
            const cellCls = startsNewGroup ? separatedChargeCell : chargeCell;
            return (
              <tr key={index}>
                <td className={`${cellCls} border-l border-black whitespace-pre-line font-bold`}>{charge.label}</td>
                <td className={`${cellCls} text-center`}>{d(charge.days)}</td>
                <td className={`${cellCls} text-right`}>{m(charge.rate)}</td>
                <td className={`${cellCls} border-r border-black text-right`}>{m(charge.amount)}</td>
              </tr>
            );
          })}
          <tr>
            <td className="border-t border-black px-1.5 py-1.5 text-[9px] leading-[1.35] align-middle" colSpan={2} rowSpan={3}>
              <div className="pt-5 text-center font-bold">
                Payment due within 30 days
                <br />
                <br />
                Please make cheques payable to: Nationwide
                <br />
                Assist Ltd
              </div>
            </td>
            <td className={`${packCell} bg-[#d9d9d9] font-bold text-right`}>Sub Total</td>
            <td className={`${packCell} bg-[#d9d9d9] font-bold text-right`}>{gbp(data.subTotal || 0)}</td>
          </tr>
          <tr>
            <td className={`${packCell} bg-[#d9d9d9] font-bold text-right`}>VAT</td>
            <td className={`${packCell} bg-[#d9d9d9] font-bold text-right`}>{gbp(data.vat || 0)}</td>
          </tr>
          <tr>
            <td className={`${packCell} bg-[#d9d9d9] font-bold text-right`}>TOTAL</td>
            <td className={`${packCell} bg-[#d9d9d9] font-bold text-right`}>{gbp(data.totalDue || 0)}</td>
          </tr>
        </tbody>
      </table>
    </DocShell>
  );
};

export default CreditHireInvoiceDoc;
