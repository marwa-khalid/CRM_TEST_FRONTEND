import React, { useState } from "react";
import { PackScreen, DateField } from "./paymentPackUi";
import CreditHireInvoiceDoc, { type CreditHireDocVehicle, type CreditHireDocData, type CreditHireDocCharge } from "./CreditHireInvoiceDoc";
import VehicleCards from "./VehicleCards";

// Editable "Payment Pack: Credit Hire Invoice" screen (opened from the Generate
// Payment Pack popup). Sub Total / VAT / Total Due are derived live from the
// editable charge amounts. Top bar + Print/Download/Email come from PackScreen.

const toNum = (v: any) => parseFloat(String(v ?? "").replace(/[^0-9.-]/g, "")) || 0;
const gbp = (n: number) =>
  `£${(Number(n) || 0).toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const money = (v?: number) => (v != null ? gbp(v) : "");

export type CreditHireInvoicePrefill = {
  ourReference?: string;
  invoiceDate?: string;
  invoiceNumber?: string;
  hireStart?: string;
  hireEnd?: string;
  totalHireDays?: string | number;
  client?: string;
  registration?: string;
  make?: string;
  model?: string;
  group?: string;
  basicHireDays?: string | number;
  basicHireRate?: number;
  basicHireAmount?: number;
  cdwDays?: string | number;
  cdwRate?: number;
  cdwAmount?: number;
  collectionRate?: number;
  collectionAmount?: number;
  adminRate?: number;
  adminAmount?: number;
  automaticDays?: string | number;
  automaticRate?: number;
  automaticAmount?: number;
  yourReference?: string;
  billTo?: string;
  // Read-only rows for the other vehicles on the claim (printed under the
  // edited vehicle in the document — mirrors the main screens' multi-vehicle).
  otherVehicles?: CreditHireDocVehicle[];
};

const labelCls = "text-neutral-700 text-sm font-weight-500";
const inputCls =
  "self-stretch px-5 py-4 bg-white rounded border border-neutral-200 text-base text-neutral-700 font-light leading-4 outline-none focus:border-blue-500 placeholder:text-neutral-300";
// Compact input for the Hire Charges table cells (tighter than the full-width fields).
const chargeInputCls =
  "w-full px-4 py-3 bg-white rounded border border-neutral-200 text-base text-neutral-700 font-light leading-4 outline-none focus:border-blue-500 placeholder:text-neutral-300";

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="self-stretch p-5 rounded-lg border border-neutral-100 flex flex-col gap-4">
    <h2 className="text-black text-xl font-weight-600 leading-5">{title}</h2>
    <div className="self-stretch h-px bg-neutral-100" />
    {children}
  </section>
);

const Text = ({
  label, value, onChange, placeholder = "--", width = "w-96",
}: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; width?: string }) => (
  <div className={`${width} flex flex-col gap-2`}>
    <span className={labelCls}>{label}</span>
    <input className={inputCls} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
  </div>
);

// One Hire-Charges line: label + (optional) Days + Daily Rate + Amount inputs.
const ChargeRow = ({
  label, days, onDays, rate, onRate, amount, onAmount, showDays = true,
}: {
  label: string;
  days?: string; onDays?: (v: string) => void;
  rate: string; onRate: (v: string) => void;
  amount: string; onAmount: (v: string) => void;
  showDays?: boolean;
}) => (
  <div className="self-stretch flex items-center gap-4">
    <div className="flex-1 text-neutral-950 text-sm font-weight-500">{label}</div>
    <div className="w-24 shrink-0">
      {showDays ? (
        <input className={chargeInputCls} value={days} onChange={(e) => onDays?.(e.target.value)} placeholder="--" />
      ) : null}
    </div>
    <div className="w-40 shrink-0">
      <input className={chargeInputCls} value={rate} onChange={(e) => onRate(e.target.value)} placeholder="£0.00" />
    </div>
    <div className="w-40 shrink-0">
      <input className={chargeInputCls} value={amount} onChange={(e) => onAmount(e.target.value)} placeholder="£0.00" />
    </div>
  </div>
);

const CreditHireInvoiceForm = ({
  prefill = {}, prefills, claimId, onClose, onEmailSent,
}: {
  prefill?: CreditHireInvoicePrefill;
  prefills?: CreditHireInvoicePrefill[];
  claimId?: string | number;
  onClose: () => void;
  onEmailSent?: (sentDate?: string) => void;
}) => {
  // Every vehicle's prefill (falls back to the single prefill). All state below
  // is local to this form — editing/deleting a vehicle here never touches the
  // actual claim.
  const list = prefills && prefills.length ? prefills : [prefill];

  // Fields shared across all vehicles.
  const [shared, setShared] = useState({
    ourReference: list[0].ourReference || "",
    invoiceDate: list[0].invoiceDate || "",
    invoiceNumber: list[0].invoiceNumber || "",
    yourReference: list[0].yourReference || "",
    billTo: list[0].billTo || "",
    client: list[0].client || "",
  });
  // Per-vehicle editable fields — one entry per vehicle, so edits persist when
  // you switch vehicles.
  const initV = (p: CreditHireInvoicePrefill) => ({
    hireStart: p.hireStart || "",
    hireEnd: p.hireEnd || "",
    totalHireDays: String(p.totalHireDays ?? ""),
    registration: p.registration || "",
    make: p.make || "",
    model: p.model || "",
    group: p.group || "",
    basicHireDays: String(p.basicHireDays ?? ""),
    basicHireRate: money(p.basicHireRate),
    basicHireAmount: money(p.basicHireAmount),
    cdwDays: String(p.cdwDays ?? ""),
    cdwRate: money(p.cdwRate),
    cdwAmount: money(p.cdwAmount),
    collectionRate: money(p.collectionRate),
    collectionAmount: money(p.collectionAmount),
    adminRate: money(p.adminRate),
    adminAmount: money(p.adminAmount),
    automaticDays: String(p.automaticDays ?? ""),
    automaticRate: money(p.automaticRate),
    automaticAmount: money(p.automaticAmount),
  });
  const [vForms, setVForms] = useState(list.map(initV));
  const [active, setActive] = useState(0);

  const SHARED_KEYS = new Set([
    "ourReference", "invoiceDate", "invoiceNumber", "yourReference", "billTo", "client",
  ]);
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
      vehicles={vForms.map((vf) => ({
        registration: vf.registration, make: vf.make, model: vf.model,
      }))}
      activeIndex={active}
      onSelect={setActive}
      onDelete={(_, i) => deleteVehicle(i)}
    />
  );

  const subTotal =
    toNum(f.basicHireAmount) + toNum(f.cdwAmount) + toNum(f.collectionAmount) + toNum(f.adminAmount) + toNum(f.automaticAmount);
  const vat = subTotal * 0.2;
  const totalDue = subTotal + vat;

  // Print/PDF document — every vehicle in natural order (row 1, 2, …). For 2+
  // vehicles the Hire Charges table groups columns per vehicle with subtotals.
  const multi = vForms.length > 1;
  const docVehicles: CreditHireDocVehicle[] = vForms.map((vf) => ({
    vehicle: [vf.make, vf.model].filter(Boolean).join(" "),
    registration: vf.registration,
    group: vf.group,
    hireStart: vf.hireStart,
    hireEnd: vf.hireEnd,
    days: vf.totalHireDays,
  }));
  // Per-vehicle charge lists (same labels/order for every vehicle) + subtotals.
  const vehicleCharges: CreditHireDocCharge[][] = vForms.map((vf) => [
    { label: "Basic Hire Rate", days: vf.basicHireDays, rate: vf.basicHireRate, amount: vf.basicHireAmount },
    { label: "Collection & Delivery Charge", rate: vf.collectionRate, amount: vf.collectionAmount },
    { label: "Admin Fee", rate: vf.adminRate, amount: vf.adminAmount },
    { label: "Automatic", days: vf.automaticDays, rate: vf.automaticRate, amount: vf.automaticAmount },
    { label: "Collision Damage Waiver", days: vf.cdwDays, rate: vf.cdwRate, amount: vf.cdwAmount },
  ]);
  const vehicleSubtotals = vForms.map(
    (vf) => toNum(vf.basicHireAmount) + toNum(vf.cdwAmount) + toNum(vf.collectionAmount) + toNum(vf.adminAmount) + toNum(vf.automaticAmount),
  );
  const allVehiclesSub = vehicleSubtotals.reduce((a, b) => a + b, 0);
  const allVehiclesVat = allVehiclesSub * 0.2;
  const allVehiclesTotal = allVehiclesSub + allVehiclesVat;

  const docData: CreditHireDocData = {
    ourReference: f.ourReference,
    invoiceNumber: f.invoiceNumber,
    invoiceDate: f.invoiceDate,
    yourReference: f.yourReference,
    client: f.client,
    billTo: f.billTo,
    vehicles: docVehicles,
    charges: vehicleCharges[active] ?? vehicleCharges[0],
    vehicleCharges,
    vehicleSubtotals,
    subTotal: multi ? allVehiclesSub : subTotal,
    vat: multi ? allVehiclesVat : vat,
    totalDue: multi ? allVehiclesTotal : totalDue,
  };
  const doc = <CreditHireInvoiceDoc data={docData} />;

  return (
    <PackScreen
      title="Payment Pack: Credit Hire Invoice"
      claimId={claimId}
      onClose={onClose}
      renderDoc={doc}
      onEmailSent={onEmailSent}
    >

        <Section title="Invoice Details">
          <div className="flex gap-5">
            <DateField label="Invoice Date" value={f.invoiceDate} onChange={(v) => set("invoiceDate", v)} />
            <Text label="Invoice Number" value={f.invoiceNumber} onChange={(v) => set("invoiceNumber", v)} />
          </div>
          <div className="flex gap-5">
            <Text label="Our Reference" value={f.ourReference} onChange={(v) => set("ourReference", v)} />
            <Text label="Your Reference" value={f.yourReference} onChange={(v) => set("yourReference", v)} />
          </div>
          <div className="flex gap-5">
            <Text label="Bill To" value={f.billTo} onChange={(v) => set("billTo", v)} width="flex-1" />
          </div>
        </Section>

        <Section title="Hire Details">
          {vehicleCards}
          <div className="flex gap-5">
            <DateField label="Hire Start" value={f.hireStart} onChange={(v) => set("hireStart", v)} />
            <DateField label="Hire End" value={f.hireEnd} onChange={(v) => set("hireEnd", v)} />
          </div>
          <div className="flex gap-5">
            <Text label="Total Hire Days" value={f.totalHireDays} onChange={(v) => set("totalHireDays", v)} width="flex-1" />
          </div>
        </Section>

        <Section title="Client details">
          <div className="flex gap-5">
            <Text label="Client" value={f.client} onChange={(v) => set("client", v)} width="flex-1" />
          </div>
          {vehicleCards}
          <div className="flex gap-5">
            <Text label="Registration Number" value={f.registration} onChange={(v) => set("registration", v)} placeholder="Reg Number" width="flex-1" />
          </div>
          <div className="flex gap-5">
            <Text label="Make" value={f.make} onChange={(v) => set("make", v)} placeholder="Enter Make" />
            <Text label="Model" value={f.model} onChange={(v) => set("model", v)} placeholder="Enter Model" />
          </div>
        </Section>

        <Section title="Hire Charges">
          {vehicleCards}
          {/* column headers */}
          <div className="self-stretch flex items-center gap-4">
            <div className="flex-1" />
            <div className="w-24 shrink-0 text-neutral-700 text-sm font-weight-500">Days</div>
            <div className="w-40 shrink-0 text-neutral-700 text-sm font-weight-500">Daily Rate</div>
            <div className="w-40 shrink-0 text-neutral-700 text-sm font-weight-500">Amount</div>
          </div>
          <ChargeRow
            label="Basic Hire Rate"
            days={f.basicHireDays} onDays={(v) => set("basicHireDays", v)}
            rate={f.basicHireRate} onRate={(v) => set("basicHireRate", v)}
            amount={f.basicHireAmount} onAmount={(v) => set("basicHireAmount", v)}
          />
          <ChargeRow
            label="Collection & Delivery Charge" showDays={false}
            rate={f.collectionRate} onRate={(v) => set("collectionRate", v)}
            amount={f.collectionAmount} onAmount={(v) => set("collectionAmount", v)}
          />
          <ChargeRow
            label="Admin Fee" showDays={false}
            rate={f.adminRate} onRate={(v) => set("adminRate", v)}
            amount={f.adminAmount} onAmount={(v) => set("adminAmount", v)}
          />
          <ChargeRow
            label="Automatic"
            days={f.automaticDays} onDays={(v) => set("automaticDays", v)}
            rate={f.automaticRate} onRate={(v) => set("automaticRate", v)}
            amount={f.automaticAmount} onAmount={(v) => set("automaticAmount", v)}
          />
          <ChargeRow
            label="Collision Damage Waiver"
            days={f.cdwDays} onDays={(v) => set("cdwDays", v)}
            rate={f.cdwRate} onRate={(v) => set("cdwRate", v)}
            amount={f.cdwAmount} onAmount={(v) => set("cdwAmount", v)}
          />

          <div className="self-stretch h-px bg-neutral-100" />
          {/* Sub Total / VAT / Total Due — derived, read-only */}
          {[
            { label: "Sub Total", value: subTotal },
            { label: "VAT @ 20%", value: vat },
          ].map((r) => (
            <div key={r.label} className="self-stretch flex justify-end items-center gap-4">
              <div className="text-neutral-950 text-sm font-weight-500 text-right">{r.label}</div>
              <div className="w-40 shrink-0 px-4 py-3 bg-neutral-50 rounded border border-neutral-200 text-base text-neutral-700 font-light leading-4">
                {gbp(r.value)}
              </div>
            </div>
          ))}
          <div className="self-stretch h-px bg-neutral-100" />
          <div className="self-stretch flex justify-end items-center gap-4">
            <div className="text-neutral-900 text-base font-weight-600 text-right">Total Due</div>
            <div className="w-40 shrink-0 px-4 py-3 bg-neutral-50 rounded border border-neutral-200 text-base text-neutral-700 font-light leading-4">
              {gbp(totalDue)}
            </div>
          </div>
        </Section>
    </PackScreen>
  );
};

export default CreditHireInvoiceForm;
