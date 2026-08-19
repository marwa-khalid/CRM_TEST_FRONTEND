import { gbp, fullSlash, toNum } from "./docHelpers";
import type { ReactNode } from "react";
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

const oldCell = "border border-[#808080] p-0 text-[10px] font-normal";

const oldShadedCell = `${oldCell} bg-[#d9d9d9]`;

const cellInner = "h-[22px] px-[6px] flex items-center -translate-y-[1px]";

const blankCell = "border border-[#808080] p-0 h-[18px]";
const rowSpanInner = "h-[44px] px-[6px] flex items-center -translate-y-[1px]";
const oldRowSpanCell =
  "border border-[#808080] px-[6px] h-[44px] text-[10px] align-middle font-normal";
const ABILandscapeShell = ({ children }: { children: ReactNode }) => (
  <div className="w-[1090px] min-h-[793.7px] bg-white text-black font-['Times_New_Roman'] px-[70px] py-[55px] text-[10px] leading-[1.2]">
    {children}
  </div>
);
const ABIHireBreakdownDoc = ({ data }: { data: ABIBreakdownDocData }) => {
  const vehicles =
    data.vehicles && data.vehicles.length
      ? data.vehicles
      : [
          {
            vehicle: data.vehicle,
            registration: data.registration,
            group: data.group,
            hireStart: data.hireStart,
            hireEnd: data.hireEnd,
            days: data.days,
            abiHireRate: data.abiHireRate,
            extras: data.extras,
            automatic: data.automatic,
            towBar: data.towBar,
            dualControl: data.dualControl,
            other: data.other,
            totalAdditionalDaily: data.totalAdditionalDaily,
            totalDailyRate: data.totalDailyRate,
            totalABICost: data.totalABICost,
          },
        ];

  const first = vehicles[0] || {};
  const last = vehicles[vehicles.length - 1] || first;

  const total =
    data.combinedABICost ??
    vehicles.reduce((sum, vehicle) => sum + toNum(vehicle.totalABICost), 0);

  // OLD FORMAT:
  // T12<3YRS + T10<3YRS
  const groupText =
    vehicles
      .map((vehicle) => vehicle.group)
      .filter(Boolean)
      .join(" + ") || "—";

  // OLD FORMAT:
  // 72 (11+61)
  const dayParts = vehicles
    .map((vehicle) => toNum(vehicle.days))
    .filter((days) => days > 0);

  const totalDays = dayParts.reduce((sum, days) => sum + days, 0);

  const daysText =
    dayParts.length > 1
      ? `${totalDays} (${dayParts.join("+")})`
      : dayParts.length === 1
        ? `${dayParts[0]}`
        : "—";

  // OLD FORMAT:
  // Different rates: £187.60 + £175.04
  // Same rate on both vehicles: £5.00
  const joinedMoney = (key: keyof ABIDocVehicle) => {
    const values = vehicles
      .map((vehicle) => vehicle[key])
      .filter(
        (value): value is number =>
          typeof value === "number" && Number.isFinite(value),
      );

    const uniqueValues = [...new Set(values)];

    return uniqueValues.length
      ? uniqueValues.map((value) => gbp(value)).join(" + ")
      : "";
  };

  return (
    <ABILandscapeShell>
      <div
        className="w-full text-black"
        style={{
          fontFamily: '"Times New Roman", Times, serif',
        }}
      >
        <h1 className="mb-[16px] text-[15px] leading-none font-bold">
          Breakdown of ABI Hire Costs Including Additional Charges (30 day
          Payment)
        </h1>

        <div className="mb-[14px] text-[10px] leading-[1.2]">
          <div>Our Reference:{data.ourReference || "—"}</div>
          <div>Your Reference: {data.yourReference || "—"}</div>
        </div>

        {/* VEHICLE GROUP */}
        <table className="w-[650px] table-fixed border-collapse">
          <tbody>
            <tr>
              <td className={`${oldShadedCell} w-[240px]`}>
                <div className={cellInner}>Vehicle Group</div>
              </td>

              <td className={`${oldCell} w-[410px]`}>
                <div className={cellInner}>{groupText}</div>
              </td>
            </tr>
          </tbody>
        </table>

        {/* HIRE DATES / TOTAL DAYS */}
        <table className="-mt-px w-[650px] table-fixed border-collapse">
          <tbody>
            <tr>
              <td className={`${oldCell} w-[108px]`}>
                <div className={cellInner}>Hire Start Date</div>
              </td>

              <td className={`${oldCell} w-[173px]`}>
                <div className={cellInner}>{fullSlash(first.hireStart)}</div>
              </td>

              <td className={`${oldCell} w-[144px]`} rowSpan={2}>
                <div className={rowSpanInner}>Total Days Hired</div>
              </td>

              <td className={`${oldCell} w-[225px]`} rowSpan={2}>
                <div className={rowSpanInner}>{daysText}</div>
              </td>
            </tr>

            <tr>
              <td className={oldCell}>
                <div className={cellInner}>Hire End Date</div>
              </td>

              <td className={oldCell}>
                <div className={cellInner}>{fullSlash(last.hireEnd)}</div>
              </td>
            </tr>
          </tbody>
        </table>

        {/* MAIN DAILY RATE / EXTRAS TABLE */}
        <table className="-mt-px w-[650px] table-fixed border-collapse">
          <tbody>
            <tr>
              <td className={`${oldShadedCell} w-[240px]`}>
                <div className={cellInner}>ABI Hire Rate per day £</div>
              </td>

              <td className={`${oldCell} w-[410px]`}>
                <div className={cellInner}>{joinedMoney("abiHireRate")}</div>
              </td>
            </tr>

            {/* Blank bordered row in OLD format */}
            <tr>
              <td className={blankCell}>&nbsp;</td>
              <td className={blankCell}>&nbsp;</td>
            </tr>

            <tr>
              <td className={oldShadedCell}>
                <div className={cellInner}>Extras (Daily Rate)</div>
              </td>

              <td className={oldCell}>
                <div className={cellInner}>&nbsp;</div>
              </td>
            </tr>

            <tr>
              <td className={oldCell}>
                <div className={cellInner}>Automatic</div>
              </td>

              <td className={oldCell}>
                <div className={cellInner}>{joinedMoney("automatic")}</div>
              </td>
            </tr>
            <tr>
              <td className={oldCell}>
                <div className={cellInner}>Tow Bar</div>
              </td>

              <td className={oldCell}>
                <div className={cellInner}>{joinedMoney("towBar")}</div>
              </td>
            </tr>

            <tr>
              <td className={oldCell}>
                <div className={cellInner}>Dual Control</div>
              </td>

              <td className={oldCell}>
                <div className={cellInner}>{joinedMoney("dualControl")}</div>
              </td>
            </tr>

            <tr>
              <td className={oldCell}>
                <div className={cellInner}>Other</div>
              </td>

              <td className={oldCell}>
                <div className={cellInner}>{joinedMoney("other")}</div>
              </td>
            </tr>

      <tr>
  <td className={`${oldShadedCell} w-[240px]`}>
    <div className={cellInner}>
      Total Additional Daily Charges
    </div>
  </td>

  <td className={`${oldCell} w-[410px]`}>
    <div className={cellInner}>
      {joinedMoney("totalAdditionalDaily")}
    </div>
  </td>
</tr>
          </tbody>
        </table>

        {/* TOTAL RATE / FINAL ABI COST */}
        <table className="-mt-px w-[650px] table-fixed border-collapse">
          <tbody>
            <tr>
              <td className={`${oldShadedCell} w-[240px]`}>
                <div className={cellInner}>
                  Total Daily ABI Rate Including Additional Charges
                </div>
              </td>

              <td className={`${oldCell} w-[410px]`}>
                <div className={cellInner}>{joinedMoney("totalDailyRate")}</div>
              </td>
            </tr>

            {/* Another blank bordered row in OLD format */}
            <tr>
              <td className={`${oldCell} h-[16px]`}>&nbsp;</td>
              <td className={`${oldCell} h-[16px]`}>&nbsp;</td>
            </tr>

            <tr>
              <td className={oldShadedCell}>
                <div className={cellInner}>
                  Total ABI Costs Including Additional Charges
                </div>
              </td>

              <td className={oldCell}>
                <div className={cellInner}>{gbp(total)}</div>{" "}
              </td>
            </tr>
          </tbody>
        </table>

        {/* FOOTNOTE */}
        <div className="mt-[15px] pl-[6px] text-[10px] font-bold">
          For payment after 30 days please refer to the totals on the payment
          request letter.
        </div>
      </div>
    </ABILandscapeShell>
  );
};
export default ABIHireBreakdownDoc;
