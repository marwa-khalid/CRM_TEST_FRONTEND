import { useState } from "react";
import { PackScreen, Section, Text, DateField, ReadField, toNum, gbp, money } from "./paymentPackUi";
import PlatingInvoiceDoc, { type PlatingDocVehicle } from "./PlatingInvoiceDoc";

// Editable "Payment Pack: Plating Invoice" screen. Cost inputs are editable;
// Total derives live from Private Hire MOT + Private Hire Plating Costs.

export type PlatingInvoicePrefill = {
  ourReference?: string;
  billTo?: string;
  invoiceDate?: string;
  invoiceNumber?: string;
  client?: string;
  registration?: string;
  make?: string;
  model?: string;
  privateHireMot?: number;
  privateHirePlatingCosts?: number;
  yourReference?: string;
  // Other vehicles on the claim (read-only) for the document's Vehicle Details.
  otherVehicles?: PlatingDocVehicle[];
};

const PlatingInvoiceForm = ({
  prefill = {}, onClose,
}: { prefill?: PlatingInvoicePrefill; onClose: () => void }) => {
  const [f, setF] = useState({
    ourReference: prefill.ourReference || "",
    billTo: prefill.billTo || "",
    invoiceDate: prefill.invoiceDate || "",
    invoiceNumber: prefill.invoiceNumber || "",
    yourReference: prefill.yourReference || "",
    client: prefill.client || "",
    registration: prefill.registration || "",
    make: prefill.make || "",
    model: prefill.model || "",
    privateHireMot: money(prefill.privateHireMot),
    privateHirePlatingCosts: money(prefill.privateHirePlatingCosts),
  });
  const set = (k: keyof typeof f, v: string) => setF((p) => ({ ...p, [k]: v }));

  const total = toNum(f.privateHireMot) + toNum(f.privateHirePlatingCosts);

  // Print/PDF document — built live from the edited values. The edited vehicle
  // is listed first, then any other vehicles on the claim.
  const docNode = (
    <PlatingInvoiceDoc
      data={{
        ourReference: f.ourReference,
        invoiceNumber: f.invoiceNumber,
        invoiceDate: f.invoiceDate,
        yourReference: f.yourReference,
        client: f.client,
        billTo: f.billTo,
        vehicles: [
          { vehicle: [f.make, f.model].filter(Boolean).join(" "), registration: f.registration },
          ...(prefill.otherVehicles || []),
        ],
        privateHireMot: f.privateHireMot,
        privateHirePlatingCosts: f.privateHirePlatingCosts,
        total,
      }}
    />
  );

  return (
    <PackScreen title="Payment Pack: Plating Invoice" onClose={onClose} renderDoc={docNode}>
      <Section title="Bill to">
        <div className="flex gap-5">
          <Text label="Bill to" value={f.billTo} onChange={(v) => set("billTo", v)} />
        </div>
      </Section>

      <Section title="Invoice Details">
        <div className="flex gap-5">
          <DateField label="Invoice Date" value={f.invoiceDate} onChange={(v) => set("invoiceDate", v)} />
          <Text label="Invoice Number" value={f.invoiceNumber} onChange={(v) => set("invoiceNumber", v)} />
        </div>
        <div className="flex gap-5">
          <Text label="Our Reference" value={f.ourReference} onChange={(v) => set("ourReference", v)} />
          <Text label="Your Reference" value={f.yourReference} onChange={(v) => set("yourReference", v)} />
        </div>
      </Section>

      <Section title="Client details" divider={false}>
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

      <Section title="Cost Details" divider={false}>
        <div className="flex gap-4">
          <Text label="Private Hire MOT" value={f.privateHireMot} onChange={(v) => set("privateHireMot", v)} placeholder="£0.00" />
          <Text label="Private Hire Plating Costs" value={f.privateHirePlatingCosts} onChange={(v) => set("privateHirePlatingCosts", v)} placeholder="£0.00" />
        </div>
        <div className="flex gap-4">
          <ReadField label="Total" value={gbp(total)} />
        </div>
      </Section>
    </PackScreen>
  );
};

export default PlatingInvoiceForm;
