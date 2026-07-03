import { useState } from "react";
import { PackScreen, Section, Text, DateField, ReadField, toNum, gbp, money } from "./paymentPackUi";
import PlatingInvoiceDoc, { type PlatingDocVehicle } from "./PlatingInvoiceDoc";
import VehicleCards from "./VehicleCards";

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
  prefill = {}, prefills, claimId, onClose, onEmailSent,
}: {
  prefill?: PlatingInvoicePrefill;
  prefills?: PlatingInvoicePrefill[];
  claimId?: string | number;
  onClose: () => void;
  onEmailSent?: (sentDate?: string) => void;
}) => {
  // All local to this form — editing/deleting never touches the actual claim.
  const list = prefills && prefills.length ? prefills : [prefill];
  const [shared, setShared] = useState({
    ourReference: list[0].ourReference || "",
    billTo: list[0].billTo || "",
    invoiceDate: list[0].invoiceDate || "",
    invoiceNumber: list[0].invoiceNumber || "",
    yourReference: list[0].yourReference || "",
    client: list[0].client || "",
  });
  const initV = (p: PlatingInvoicePrefill) => ({
    registration: p.registration || "",
    make: p.make || "",
    model: p.model || "",
    privateHireMot: money(p.privateHireMot),
    privateHirePlatingCosts: money(p.privateHirePlatingCosts),
  });
  const [vForms, setVForms] = useState(list.map(initV));
  const [active, setActive] = useState(0);
  const SHARED_KEYS = new Set([
    "ourReference", "billTo", "invoiceDate", "invoiceNumber", "yourReference", "client",
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

  const total = toNum(f.privateHireMot) + toNum(f.privateHirePlatingCosts);

  // Print/PDF document — every vehicle in natural order (row 1, 2, …). For 2+
  // vehicles the Charges table adds an Amount column per vehicle with subtotals.
  const multi = vForms.length > 1;
  const docVehicles = vForms.map((vf) => ({
    vehicle: [vf.make, vf.model].filter(Boolean).join(" "),
    registration: vf.registration,
    privateHireMot: vf.privateHireMot,
    privateHirePlatingCosts: vf.privateHirePlatingCosts,
    subtotal: toNum(vf.privateHireMot) + toNum(vf.privateHirePlatingCosts),
  }));
  const allVehiclesTotal = docVehicles.reduce((a, v) => a + v.subtotal, 0);
  const docNode = (
    <PlatingInvoiceDoc
      data={{
        ourReference: f.ourReference,
        invoiceNumber: f.invoiceNumber,
        invoiceDate: f.invoiceDate,
        yourReference: f.yourReference,
        client: f.client,
        billTo: f.billTo,
        vehicles: docVehicles,
        privateHireMot: f.privateHireMot,
        privateHirePlatingCosts: f.privateHirePlatingCosts,
        total: multi ? allVehiclesTotal : total,
      }}
    />
  );

  return (
    <PackScreen
      title="Payment Pack: Plating Invoice"
      claimId={claimId}
      onClose={onClose}
      renderDoc={docNode}
      onEmailSent={onEmailSent}
    >
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
        {/* <div className="flex gap-5">
          <Text label="Our Reference" value={f.ourReference} onChange={(v) => set("ourReference", v)} />
          <Text label="Your Reference" value={f.yourReference} onChange={(v) => set("yourReference", v)} />
        </div> */}
      </Section>

      <Section title="Client details" divider={false}>
        <div className="flex gap-5">
          <Text label="Client" value={f.client} onChange={(v) => set("client", v)} width="flex-1" />
        </div>
        {vehicleCards}
        <div className="flex gap-5">
          <Text label="Registration Number" value={f.registration} onChange={(v) => set("registration", v)} placeholder="Reg Number" />
        </div>
        <div className="flex gap-5">
          <Text label="Make" value={f.make} onChange={(v) => set("make", v)} placeholder="Enter Make" />
          <Text label="Model" value={f.model} onChange={(v) => set("model", v)} placeholder="Enter Model" />
        </div>
      </Section>

      <Section title="Cost Details" divider={false}>
        {vehicleCards}
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
