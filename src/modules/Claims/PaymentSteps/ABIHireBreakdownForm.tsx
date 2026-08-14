import { useState } from "react";
import { PackScreen, Section, Text, DateField, ReadField, toNum, gbp, money } from "./paymentPackUi";
import ABIHireBreakdownDoc from "./ABIHireBreakdownDoc";
import VehicleCards from "./VehicleCards";

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
  automatic?: number;
  towBar?: number;
  dualControl?: number;
  other?: number;
  // Document-only (not editable here) — identity of the selected vehicle.
  vehicle?: string;
  registration?: string;
  dated?: string;
};

const ABIHireBreakdownForm = ({
  prefill = {}, prefills, vehicleGroups = [], claimId, onClose, onEmailSent,
}: {
  prefill?: ABIHireBreakdownPrefill;
  prefills?: ABIHireBreakdownPrefill[];
  vehicleGroups?: string[];
  claimId?: string | number;
  onClose: () => void;
  onEmailSent?: (sentDate?: string) => void;
}) => {
  // All local to this form — editing/deleting never touches the actual claim.
  const list = prefills && prefills.length ? prefills : [prefill];
  const [shared, setShared] = useState({
    ourReference: list[0].ourReference || "",
    yourReference: list[0].yourReference || "",
  });
  const initV = (p: ABIHireBreakdownPrefill) => ({
    vehicle: p.vehicle || "",
    registration: p.registration || "",
    vehicleGroup: p.vehicleGroup || "",
    hireStart: p.hireStart || "",
    hireEnd: p.hireEnd || "",
    totalHireDays: String(p.totalHireDays ?? ""),
    abiRatePerDay: money(p.abiRatePerDay),
    extras: money(p.extras),
    automatic: money(p.automatic),
    towBar: money(p.towBar),
    dualControl: money(p.dualControl),
    other: money(p.other),
  });
  const [vForms, setVForms] = useState(list.map(initV));
  const [active, setActive] = useState(0);
  const SHARED_KEYS = new Set(["ourReference", "yourReference"]);
  const f = { ...shared, ...(vForms[active] ?? vForms[0]) };
  const set = (k: string, v: string) => {
    if (SHARED_KEYS.has(k)) setShared((p) => ({ ...p, [k]: v }));
    else setVForms((p) => p.map((vf, i) => (i === active ? { ...vf, [k]: v } : vf)));
  };
  const deleteVehicle = (i: number) => {
    if (vForms.length <= 1) return;
    setVForms((p) => p.filter((_, idx) => idx !== i));
    setActive((a) => (i < a ? a - 1 : i === a ? Math.min(a, vForms.length - 2) : a));
  };
  // Vehicle switcher — only renders for 2+ vehicles (single stays as before).
  const vehicleCards = (
    <VehicleCards
      vehicles={vForms.map((vf) => ({ registration: vf.registration }))}
      activeIndex={active}
      onSelect={setActive}
      onDelete={(_, i) => deleteVehicle(i)}
    />
  );

  // Derived totals (active vehicle — drives the single-vehicle document).
  const totalAdditionalDaily = toNum(f.extras) + toNum(f.automatic) + toNum(f.towBar) + toNum(f.dualControl) + toNum(f.other);
  const totalDailyABIRate = toNum(f.abiRatePerDay) + totalAdditionalDaily;
  const totalABICosts = totalDailyABIRate * toNum(f.totalHireDays);

  // Per-vehicle breakdown for the multi-vehicle document (natural order, 1..N).
  const vehiclesData = vForms.map((vf) => {
    const addl = toNum(vf.extras) + toNum(vf.automatic) + toNum(vf.towBar) + toNum(vf.dualControl) + toNum(vf.other);
    const dailyRate = toNum(vf.abiRatePerDay) + addl;
    const cost = dailyRate * toNum(vf.totalHireDays);
    return {
      vehicle: vf.vehicle,
      registration: vf.registration,
      group: vf.vehicleGroup,
      hireStart: vf.hireStart,
      hireEnd: vf.hireEnd,
      days: vf.totalHireDays,
      abiHireRate: toNum(vf.abiRatePerDay),
      extras: toNum(vf.extras),
      automatic: toNum(vf.automatic),
      towBar: toNum(vf.towBar),
      dualControl: toNum(vf.dualControl),
      totalAdditionalDaily: addl,
      totalDailyRate: dailyRate,
      totalABICost: cost,
    };
  });
  const combinedABICost = vehiclesData.reduce((a, v) => a + v.totalABICost, 0);

  // Print/PDF document — built live from the edited values.
  const docNode = (
    <ABIHireBreakdownDoc
      data={{
        ourReference: f.ourReference,
        yourReference: f.yourReference,
        dated: list[active]?.dated ?? list[0]?.dated,
        vehicle: f.vehicle,
        registration: f.registration,
        group: f.vehicleGroup,
        hireStart: f.hireStart,
        hireEnd: f.hireEnd,
        days: f.totalHireDays,
        abiHireRate: toNum(f.abiRatePerDay),
        extras: toNum(f.extras),
        automatic: toNum(f.automatic),
        towBar: toNum(f.towBar),
        dualControl: toNum(f.dualControl),
        other: toNum(f.other),
        totalAdditionalDaily,
        totalDailyRate: totalDailyABIRate,
        totalABICost: totalABICosts,
        vehicles: vehiclesData,
        combinedABICost,
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

      {vehicleCards}

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
          <Text label="Automatic" value={f.automatic} onChange={(v) => set("automatic", v)} placeholder="£0.00" />
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
