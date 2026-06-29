import React, { useState } from "react";
import { PackScreen, DateField } from "./paymentPackUi";
import CreditHireInvoiceDoc, { type CreditHireDocVehicle } from "./CreditHireInvoiceDoc";

// Editable "Payment Pack: Credit Hire Invoice" screen (opened from the Generate
// Payment Pack popup). Sub Total / VAT / Total Due are derived live from the
// editable charge amounts. Top bar + Print/Download/Email come from PackScreen.

const toNum = (v: any) => parseFloat(String(v ?? "").replace(/[^0-9.-]/g, "")) || 0;
const gbp = (n: number) =>
  `£${(Number(n) || 0).toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const money = (v?: number) => (v != null ? gbp(v) : "");

export type CreditHireInvoicePrefill = {
  invoiceDate?: string;
  invoiceNumber?: string;
  hireStart?: string;
  hireEnd?: string;
  totalHireDays?: string | number;
  client?: string;
  registration?: string;
  make?: string;
  model?: string;
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
  yourReference?: string;
  billTo?: string;
  // Read-only rows for the other vehicles on the claim (printed under the
  // edited vehicle in the document — mirrors the main screens' multi-vehicle).
  otherVehicles?: CreditHireDocVehicle[];
};

const labelCls = "text-neutral-700 text-sm font-weight-500";
const inputCls =
  "self-stretch px-5 py-4 bg-white rounded border border-neutral-200 text-base text-neutral-700 font-light leading-4 outline-none focus:border-blue-500 placeholder:text-neutral-300";

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
  <div className="self-stretch flex items-center gap-5">
    <div className="w-48 text-neutral-950 text-sm font-weight-500">{label}</div>
    <div className="w-40">
      {showDays ? (
        <input className={inputCls} value={days} onChange={(e) => onDays?.(e.target.value)} placeholder="--" />
      ) : null}
    </div>
    <div className="w-44">
      <input className={inputCls} value={rate} onChange={(e) => onRate(e.target.value)} placeholder="£0.00" />
    </div>
    <div className="w-44">
      <input className={inputCls} value={amount} onChange={(e) => onAmount(e.target.value)} placeholder="£0.00" />
    </div>
  </div>
);

const CreditHireInvoiceForm = ({
  prefill = {}, onClose,
}: { prefill?: CreditHireInvoicePrefill; onClose: () => void }) => {
  const [f, setF] = useState({
    invoiceDate: prefill.invoiceDate || "",
    invoiceNumber: prefill.invoiceNumber || "",
    yourReference: prefill.yourReference || "",
    billTo: prefill.billTo || "",
    hireStart: prefill.hireStart || "",
    hireEnd: prefill.hireEnd || "",
    totalHireDays: String(prefill.totalHireDays ?? ""),
    client: prefill.client || "",
    registration: prefill.registration || "",
    make: prefill.make || "",
    model: prefill.model || "",
    basicHireDays: String(prefill.basicHireDays ?? ""),
    basicHireRate: money(prefill.basicHireRate),
    basicHireAmount: money(prefill.basicHireAmount),
    cdwDays: String(prefill.cdwDays ?? ""),
    cdwRate: money(prefill.cdwRate),
    cdwAmount: money(prefill.cdwAmount),
    collectionRate: money(prefill.collectionRate),
    collectionAmount: money(prefill.collectionAmount),
    adminRate: money(prefill.adminRate),
    adminAmount: money(prefill.adminAmount),
  });
  const set = (k: keyof typeof f, v: string) => setF((p) => ({ ...p, [k]: v }));

  const subTotal =
    toNum(f.basicHireAmount) + toNum(f.cdwAmount) + toNum(f.collectionAmount) + toNum(f.adminAmount);
  const vat = subTotal * 0.2;
  const totalDue = subTotal + vat;

  // Print/PDF document — built live from the edited values. The edited vehicle
  // is row 1; any other vehicles on the claim follow (read-only).
  const editedVehicle: CreditHireDocVehicle = {
    vehicle: [f.make, f.model].filter(Boolean).join(" "),
    registration: f.registration,
    hireStart: f.hireStart,
    hireEnd: f.hireEnd,
    days: f.totalHireDays,
  };
  const doc = (
    <CreditHireInvoiceDoc
      data={{
        invoiceNumber: f.invoiceNumber,
        invoiceDate: f.invoiceDate,
        yourReference: f.yourReference,
        client: f.client,
        billTo: f.billTo,
        vehicles: [editedVehicle, ...(prefill.otherVehicles || [])],
        charges: [
          { label: "Basic Hire Rate", days: f.basicHireDays, rate: f.basicHireRate, amount: f.basicHireAmount },
          { label: "Collision Damage Waiver", days: f.cdwDays, rate: f.cdwRate, amount: f.cdwAmount },
          { label: "Collection & Delivery Charge", rate: f.collectionRate, amount: f.collectionAmount },
          { label: "Admin Fee", rate: f.adminRate, amount: f.adminAmount },
        ],
        subTotal,
        vat,
        totalDue,
      }}
    />
  );

  return (
    <PackScreen title="Payment Pack: Credit Hire Invoice" onClose={onClose} renderDoc={doc}>
        <Section title="Invoice Details">
          <div className="flex gap-5">
            <DateField label="Invoice Date" value={f.invoiceDate} onChange={(v) => set("invoiceDate", v)} />
            <Text label="Invoice Number" value={f.invoiceNumber} onChange={(v) => set("invoiceNumber", v)} />
          </div>
          <div className="flex gap-5">
            <Text label="Your Reference" value={f.yourReference} onChange={(v) => set("yourReference", v)} />
            <Text label="Bill To" value={f.billTo} onChange={(v) => set("billTo", v)} />
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

        <Section title="Client details">
          <div className="flex gap-5">
            <Text label="Client" value={f.client} onChange={(v) => set("client", v)} width="flex-1" />
          </div>
          <div className="self-stretch h-px bg-neutral-100" />
          <div className="flex gap-5">
            <Text label="Registration Number" value={f.registration} onChange={(v) => set("registration", v)} placeholder="Reg Number" />
          </div>
          <div className="flex gap-5">
            <Text label="Make" value={f.make} onChange={(v) => set("make", v)} placeholder="Enter Make" />
            <Text label="Model" value={f.model} onChange={(v) => set("model", v)} placeholder="Enter Model" />
          </div>
        </Section>

        <Section title="Hire Charges">
          {/* column headers */}
          <div className="self-stretch flex items-center gap-5">
            <div className="w-48" />
            <div className="w-40 text-neutral-700 text-sm font-weight-500">Days</div>
            <div className="w-44 text-neutral-700 text-sm font-weight-500">Daily Rate</div>
            <div className="w-44 text-neutral-700 text-sm font-weight-500">Amount</div>
          </div>
          <ChargeRow
            label="Basic Hire Rate"
            days={f.basicHireDays} onDays={(v) => set("basicHireDays", v)}
            rate={f.basicHireRate} onRate={(v) => set("basicHireRate", v)}
            amount={f.basicHireAmount} onAmount={(v) => set("basicHireAmount", v)}
          />
          <ChargeRow
            label="Collision Damage Waiver"
            days={f.cdwDays} onDays={(v) => set("cdwDays", v)}
            rate={f.cdwRate} onRate={(v) => set("cdwRate", v)}
            amount={f.cdwAmount} onAmount={(v) => set("cdwAmount", v)}
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

          <div className="self-stretch h-px bg-neutral-100" />
          {/* Sub Total / VAT / Total Due — derived, read-only */}
          {[
            { label: "Sub Total", value: subTotal, bold: false },
            { label: "VAT @ 20%", value: vat, bold: false },
          ].map((r) => (
            <div key={r.label} className="self-stretch flex justify-end items-center gap-5">
              <div className="w-40 text-neutral-950 text-sm font-weight-500">{r.label}</div>
              <div className="w-44">
                <div className="px-5 py-4 bg-neutral-50 rounded border border-neutral-200 text-base text-neutral-700 font-light leading-4">
                  {gbp(r.value)}
                </div>
              </div>
            </div>
          ))}
          <div className="self-stretch h-px bg-neutral-100" />
          <div className="self-stretch flex justify-end items-center gap-5">
            <div className="w-40 text-neutral-900 text-base font-weight-600">Total Due</div>
            <div className="w-44">
              <div className="px-5 py-4 bg-neutral-50 rounded border border-neutral-200 text-base text-neutral-700 font-light leading-4">
                {gbp(totalDue)}
              </div>
            </div>
          </div>
        </Section>
    </PackScreen>
  );
};

export default CreditHireInvoiceForm;
