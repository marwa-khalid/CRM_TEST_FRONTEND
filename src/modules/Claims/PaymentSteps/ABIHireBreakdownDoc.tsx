import { gbp, shortSlash, m0, d, DocShell } from "./docHelpers";

export type ABIDocVehicle = {
  vehicle?: string;
  registration?: string;
  group?: string;
  hireStart?: string;
  hireEnd?: string;
  days?: string | number;
  abiHireRate?: number;
  extras?: number;
  automatic?: number;
  towBar?: number;
  dualControl?: number;
  other?: number;
  totalAdditionalDaily?: number;
  totalDailyRate?: number;
  totalABICost?: number;
};

export type ABIBreakdownDocData = {
  ourReference?: string;
  yourReference?: string;
  dated?: string;
  vehicle?: string;
  registration?: string;
  group?: string;
  hireStart?: string;
  hireEnd?: string;
  days?: string | number;
  abiHireRate?: number;
  extras?: number;
  automatic?: number;
  towBar?: number;
  dualControl?: number;
  other?: number;
  totalAdditionalDaily?: number;
  totalDailyRate?: number;
  totalABICost?: number;
  vehicles?: ABIDocVehicle[];
  combinedABICost?: number;
};

const RATE_ROWS: { label: string; key: keyof ABIDocVehicle }[] = [
  { label: "ABI Hire Rate per day £", key: "abiHireRate" },
  { label: "Extras (Daily Rate)", key: "extras" },
  { label: "Automatic", key: "automatic" },
  { label: "Tow Bar", key: "towBar" },
  { label: "Dual Control", key: "dualControl" },
  { label: "Other", key: "other" },
  { label: "Total Additional Daily Charges", key: "totalAdditionalDaily" },
  { label: "Total Daily ABI Rate Including Additional Charges", key: "totalDailyRate" },
  { label: "Total ABI Costs Including Additional Charges", key: "totalABICost" },
];

const ABIHireBreakdownDoc = ({ data }: { data: ABIBreakdownDocData }) => {
  const vehicles = data.vehicles && data.vehicles.length > 1
    ? data.vehicles
    : [{
      vehicle: data.vehicle,
      registration: data.registration,
      group: data.group,
      hireStart: data.hireStart,
      hireEnd: data.hireEnd,
      days: data.days,
      abiHireRate: data.abiHireRate,
      towBar: data.towBar,
      dualControl: data.dualControl,
      extras: data.extras,
      automatic: data.automatic,
      other: data.other,
      totalAdditionalDaily: data.totalAdditionalDaily,
      totalDailyRate: data.totalDailyRate,
      totalABICost: data.totalABICost,
    }];
  const total = data.combinedABICost || vehicles.reduce((sum, v) => sum + (v.totalABICost || 0), 0);
  const compactText = vehicles.length >= 4
    ? "text-[6.5px]"
    : vehicles.length >= 3
    ? "text-[7.5px]"
    : "text-[8.5px]";
  const compactCell = `border border-black px-1 py-1.5 ${compactText} leading-[1.25] align-middle`;
  const compactHead = `${compactCell} bg-[#d9d9d9] font-bold`;
  const vehicleColumnWidth = `${Math.max(68, Math.floor(360 / Math.max(vehicles.length, 1)))}px`;

  return (
    <DocShell>
      <div className="mt-[115px] text-[8px] leading-[1.15]">
        <h1 className="mb-3 text-[12px] font-bold">
          Breakdown of ABI Hire Costs Including Additional Charges (30 day Payment)
        </h1>

        <div className="mb-4 space-y-1">
          <div>Our Reference: {data.ourReference || "—"}</div>
          <div>Your Reference: {data.yourReference || "—"}</div>
        </div>

        <table className="w-full border-collapse table-fixed mb-5">
          <thead>
            <tr>
              <th className={`${compactHead} text-left w-[30%]`}>Vehicle</th>
              <th className={`${compactHead} text-center w-[14%]`}>Group</th>
              <th className={`${compactHead} text-center w-[18%]`}>Hire Start Date</th>
              <th className={`${compactHead} text-center w-[18%]`}>Hire End Date</th>
              <th className={`${compactHead} text-center w-[20%]`}>Total Days Hired</th>
            </tr>
          </thead>
          <tbody>
            {vehicles.map((vehicle, index) => (
              <tr key={`${vehicle.registration || "vehicle"}-${index}`}>
                <td className={compactCell}>
                  {d(vehicle.vehicle)}
                  <br />
                  {d(vehicle.registration)}
                </td>
                <td className={`${compactCell} text-center`}>{d(vehicle.group)}</td>
                <td className={`${compactCell} text-center`}>{shortSlash(vehicle.hireStart)}</td>
                <td className={`${compactCell} text-center`}>{shortSlash(vehicle.hireEnd)}</td>
                <td className={`${compactCell} text-center`}>{d(vehicle.days)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <table className="w-full border-collapse table-fixed">
          <thead>
            <tr>
              <th className={`${compactHead} text-left w-[215px]`}>Description</th>
              {vehicles.map((vehicle, index) => (
                <th
                  key={`${vehicle.registration || "vehicle"}-head-${index}`}
                  className={`${compactHead} text-center`}
                  style={{ width: vehicleColumnWidth }}
                >
                  Vehicle {index + 1}
                  <br />
                  {d(vehicle.registration)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {RATE_ROWS.map((row) => {
              const totalRow = row.key === "totalABICost";
              const emphasized =
                row.key === "extras" ||
                row.key === "totalAdditionalDaily" ||
                row.key === "totalDailyRate" ||
                row.key === "totalABICost";
              return (
                <tr key={row.label}>
                  <td className={`${compactCell} font-bold${emphasized ? " bg-[#d9d9d9]" : ""}`}>
                    {row.label}
                  </td>
                  {vehicles.map((vehicle, index) => (
                    <td
                      key={`${row.key}-${index}`}
                      className={`${compactCell} text-right${totalRow ? " bg-[#d9d9d9] font-bold" : ""}`}
                    >
                      {m0(vehicle[row.key] as number)}
                    </td>
                  ))}
                </tr>
              );
            })}
            <tr>
              <td className={`${compactCell} bg-[#d9d9d9] font-bold`}>
                Total ABI Costs Including Additional Charges
              </td>
              <td className={`${compactCell} bg-[#d9d9d9] text-right font-bold`} colSpan={vehicles.length}>
                {gbp(total)}
              </td>
            </tr>
          </tbody>
        </table>

        <div className="mt-6 text-[8px] font-bold">
          For payment after 30 days please refer to the totals on the payment request letter.
        </div>
      </div>
    </DocShell>
  );
};

export default ABIHireBreakdownDoc;
