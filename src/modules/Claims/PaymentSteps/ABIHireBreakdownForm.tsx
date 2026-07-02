import { useState } from "react";
import { PackScreen, Section, Text, DateField, ReadField, toNum, gbp, money } from "./paymentPackUi";
import ABIHireBreakdownDoc from "./ABIHireBreakdownDoc";

// Editable "Payment Pack: ABI Hire Breakdown" screen. Breakdown inputs are
// editable; the three "Total …" fields derive live from them.

export type ABIHireBreakdownPrefill = {
  ourReference?: string;
  yourReference?: string;
  vehicleGroup?: string;
  hireStart?: string;
  hireEnd?: string;
  totalHireDays?: string | number;
  abiRatePerDay?: number;
  extras?: number;
  towBar?: number;
  dualControl?: number;
  other?: number;
  // Document-only (not editable here) — identity of the selected vehicle.
  vehicle?: string;
  registration?: string;
  dated?: string;
};

const ABIHireBreakdownForm = ({
  prefill = {}, vehicleGroups = [], claimId, onClose, onEmailSent,
}: {
  prefill?: ABIHireBreakdownPrefill;
  vehicleGroups?: string[];
  claimId?: string | number;
  onClose: () => void;
  onEmailSent?: (sentDate?: string) => void;
}) => {
  const [f, setF] = useState({
    ourReference: prefill.ourReference || "",
    yourReference: prefill.yourReference || "",
    vehicle: prefill.vehicle || "",
    registration: prefill.registration || "",
    vehicleGroup: prefill.vehicleGroup || "",
    hireStart: prefill.hireStart || "",
    hireEnd: prefill.hireEnd || "",
    totalHireDays: String(prefill.totalHireDays ?? ""),
    abiRatePerDay: money(prefill.abiRatePerDay),
    extras: money(prefill.extras),
    towBar: money(prefill.towBar),
    dualControl: money(prefill.dualControl),
    other: money(prefill.other),
  });
  const set = (k: keyof typeof f, v: string) => setF((p) => ({ ...p, [k]: v }));

  // Derived totals.
  const totalAdditionalDaily = toNum(f.extras) + toNum(f.towBar) + toNum(f.dualControl) + toNum(f.other);
  const totalDailyABIRate = toNum(f.abiRatePerDay) + totalAdditionalDaily;
  const totalABICosts = totalDailyABIRate * toNum(f.totalHireDays);

  // Print/PDF document — built live from the edited values.
  const docNode = (
    <ABIHireBreakdownDoc
      data={{
        ourReference: f.ourReference,
        yourReference: f.yourReference,
        dated: prefill.dated,
        vehicle: f.vehicle,
        registration: f.registration,
        group: f.vehicleGroup,
        hireStart: f.hireStart,
        hireEnd: f.hireEnd,
        days: f.totalHireDays,
        abiHireRate: toNum(f.abiRatePerDay),
        extras: toNum(f.extras),
        towBar: toNum(f.towBar),
        dualControl: toNum(f.dualControl),
        other: toNum(f.other),
        totalAdditionalDaily,
        totalDailyRate: totalDailyABIRate,
        totalABICost: totalABICosts,
      }}
    />
  );

  return (
    <PackScreen
      title="Payment Pack: ABI Hire Breakdown"
      claimId={claimId}
      onClose={onClose}
      renderDoc={docNode}
      onEmailSent={onEmailSent}
    >
      <Section title="Reference">
        <div className="flex gap-5">
          <Text label="Our Reference" value={f.ourReference} onChange={(v) => set("ourReference", v)} />
          <Text label="Your Reference" value={f.yourReference} onChange={(v) => set("yourReference", v)} />
        </div>
      </Section>

      <Section title="Vehicle Group">
        <div className="flex gap-5">
          <Text label="Vehicle" value={f.vehicle} onChange={(v) => set("vehicle", v)} placeholder="Make & Model" />
          <Text label="Registration" value={f.registration} onChange={(v) => set("registration", v)} placeholder="Reg Number" />
        </div>
        <div className="flex gap-5">
          <Text label="Vehicle Category" value={f.vehicleGroup} onChange={(v) => set("vehicleGroup", v)} placeholder="Vehicle Category" />
        </div>
      </Section>

      <Section title="Hire Details">
        <div className="flex gap-5">
          <DateField label="Hire Start" value={f.hireStart} onChange={(v) => set("hireStart", v)} />
          <DateField label="Hire End" value={f.hireEnd} onChange={(v) => set("hireEnd", v)} />
        </div>
        <div className="flex gap-5">
          <Text label="Total Hire Days" value={f.totalHireDays} onChange={(v) => set("totalHireDays", v)} />
        </div>
      </Section>

      <Section title="ABI Hire Breakdown" divider={false}>
        <div className="flex gap-4">
          <Text label="ABI Hire Rate per day £" value={f.abiRatePerDay} onChange={(v) => set("abiRatePerDay", v)} placeholder="£0.00" />
          <Text label="Extras (Daily Rate)" value={f.extras} onChange={(v) => set("extras", v)} placeholder="£0.00" />
        </div>
        <div className="flex gap-4">
          <Text label="Tow Bar" value={f.towBar} onChange={(v) => set("towBar", v)} placeholder="£0.00" />
          <Text label="Dual Control" value={f.dualControl} onChange={(v) => set("dualControl", v)} placeholder="£0.00" />
        </div>
        <div className="flex gap-4">
          <Text label="Other" value={f.other} onChange={(v) => set("other", v)} placeholder="£0.00" />
        </div>

        <div className="self-stretch h-px bg-neutral-100" />

        <div className="flex gap-4">
          <ReadField label="Total Additional Daily Charges" value={gbp(totalAdditionalDaily)} />
          <ReadField label="Total Daily ABI Rate Including Additional Charges" value={gbp(totalDailyABIRate)} />
        </div>
        <div className="flex gap-4">
          <ReadField label="Total ABI Costs Including Additional Charges" value={gbp(totalABICosts)} />
        </div>
      </Section>
    </PackScreen>
  );
};

export default ABIHireBreakdownForm;
