import { useState } from "react";
import { PackScreen, Section, Text, DateField, fieldInputCls, gbp, toNum } from "./paymentPackUi";
import CoveringLetterDoc from "./CoveringLetterDoc";

// Editable "Payment Pack: Covering Letter" screen. Invoice details + a 9-row ×
// 4-column Schedule of Charges (every cell editable). Sub Total / VAT @ 20% /
// Total Due derive live from the sum of all charge cells.

const COLS = [
  { key: "bhr", title: "BHR", sub: "Basic Hire" },
  { key: "abi", title: "<30 Days", sub: "ABI Rate" },
  { key: "lpp10", title: "31–60 Days", sub: "+10% LPP" },
  { key: "lpp20", title: "61+ Days", sub: "+20% LPP" },
];

const ROWS = [
  { key: "basicHireRate", label: "Basic Hire Rate", docLabel: "Hire Amount" },
  { key: "administrationFee", label: "Administration Fee" },
  { key: "repairCost", label: "Repair Cost" },
  { key: "storage", label: "Storage" },
  { key: "recovery", label: "Recovery" },
  { key: "platingCosts", label: "Plating Costs" },
  { key: "engineersFee", label: "Engineer's Fee" },
  { key: "cdw", label: "CDW" },
  { key: "collectionDeliveryFee", label: "Collection & Delivery Fee" },
];

export type CoveringLetterPrefill = {
  yourInsured?: string;
  yourReference?: string;
  ourClient?: string;
  ourReference?: string;
  incidentDate?: string;
  // Optional charge cells keyed `${rowKey}_${colKey}`.
  charges?: Record<string, string>;
  // Document-only fields.
  dated?: string;
  vehicleCount?: number;
  signatory?: string;
  valetingFee?: number;
};

const CoveringLetterForm = ({
  prefill = {}, onClose,
}: { prefill?: CoveringLetterPrefill; onClose: () => void }) => {
  const [f, setF] = useState({
    yourInsured: prefill.yourInsured || "",
    yourReference: prefill.yourReference || "",
    ourClient: prefill.ourClient || "",
    ourReference: prefill.ourReference || "",
    incidentDate: prefill.incidentDate || "",
    valetingFee: prefill.valetingFee != null ? String(prefill.valetingFee) : "30",
  });
  const set = (k: keyof typeof f, v: string) => setF((p) => ({ ...p, [k]: v }));

  const [cells, setCells] = useState<Record<string, string>>(prefill.charges || {});
  const setCell = (key: string, v: string) => setCells((p) => ({ ...p, [key]: v }));

  // Derived totals — sum of every charge cell.
  const subTotal = Object.values(cells).reduce((s, v) => s + toNum(v), 0);
  const vat = subTotal * 0.2;
  const totalDue = subTotal + vat;

  // ── Print/PDF document — Front Cover sheet + Heads of Claim covering letter ──
  // Per-column (BHR / <30 / 31–60 / 61+) sub totals, VAT and totals.
  const colSum = (col: string) => ROWS.reduce((s, r) => s + toNum(cells[`${r.key}_${col}`]), 0);
  const colKeys = ["bhr", "abi", "lpp10", "lpp20"] as const;
  const docSubTotal: Record<string, number> = {};
  const docVat: Record<string, number> = {};
  const docTotal: Record<string, number> = {};
  colKeys.forEach((c) => {
    const st = colSum(c);
    docSubTotal[c] = st;
    docVat[c] = st * 0.2;
    docTotal[c] = st * 1.2;
  });
  const docRows = ROWS.map((r) => ({
    label: r.docLabel || r.label,
    bhr: cells[`${r.key}_bhr`],
    abi: cells[`${r.key}_abi`],
    lpp10: cells[`${r.key}_lpp10`],
    lpp20: cells[`${r.key}_lpp20`],
  }));
  const docNode = (
    <CoveringLetterDoc
      data={{
        ourReference: f.ourReference,
        yourReference: f.yourReference,
        dated: prefill.dated,
        yourInsured: f.yourInsured,
        ourClient: f.ourClient,
        incidentDate: f.incidentDate,
        rows: docRows,
        subTotal: docSubTotal,
        vat: docVat,
        total: docTotal,
        valetingFee: toNum(f.valetingFee),
        signatory: prefill.signatory,
      }}
    />
  );

  return (
    <PackScreen title="Payment Pack: Covering Letter" onClose={onClose} renderDoc={docNode}>
      <Section title="Invoice Details">
        <div className="flex gap-5">
          <Text label="Your Insured" value={f.yourInsured} onChange={(v) => set("yourInsured", v)} />
          <Text label="Your Reference" value={f.yourReference} onChange={(v) => set("yourReference", v)} />
        </div>
        <div className="flex gap-5">
          <Text label="Our Client" value={f.ourClient} onChange={(v) => set("ourClient", v)} />
          <Text label="Our Reference" value={f.ourReference} onChange={(v) => set("ourReference", v)} />
        </div>
        <div className="flex gap-5">
          <DateField label="Incident Date" value={f.incidentDate} onChange={(v) => set("incidentDate", v)} />
          <Text label="Valeting Fee" value={f.valetingFee} onChange={(v) => set("valetingFee", v)} placeholder="£0.00" />
        </div>
      </Section>

      <Section title="Schedule of Charges">
        {/* column headers */}
        <div className="self-stretch flex items-start gap-5">
          <div className="w-44 shrink-0" />
          {COLS.map((c) => (
            <div key={c.key} className="flex-1 w-0 text-sm font-weight-500 leading-tight">
              <span className="text-neutral-900">{c.title}</span>{" "}
              <span className="text-neutral-700">{c.sub}</span>
            </div>
          ))}
        </div>

        {/* charge rows */}
        {ROWS.map((r) => (
          <div key={r.key} className="self-stretch flex items-center gap-5">
            <div className="w-44 shrink-0 text-neutral-950 text-sm font-weight-500">{r.label}</div>
            {COLS.map((c) => {
              const key = `${r.key}_${c.key}`;
              return (
                <input
                  key={c.key}
                  className={`${fieldInputCls} flex-1 w-0`}
                  value={cells[key] || ""}
                  onChange={(e) => setCell(key, e.target.value)}
                  placeholder="--"
                />
              );
            })}
          </div>
        ))}

        <div className="self-stretch h-px bg-neutral-100" />

        {/* Sub Total / VAT — derived, read-only */}
        {[
          { label: "Sub Total", value: subTotal },
          { label: "VAT @ 20%", value: vat },
        ].map((t) => (
          <div key={t.label} className="self-stretch flex justify-end items-center gap-5">
            <div className="w-40 text-neutral-950 text-sm font-weight-500">{t.label}</div>
            <div className="w-64 px-5 py-4 bg-neutral-50 rounded border border-neutral-200 text-base text-neutral-700 font-light leading-4">
              {gbp(t.value)}
            </div>
          </div>
        ))}

        <div className="self-stretch h-px bg-neutral-100" />
        <div className="self-stretch flex justify-end items-center gap-5">
          <div className="w-40 text-neutral-900 text-base font-weight-600">Total Due</div>
          <div className="w-64 px-5 py-4 bg-neutral-50 rounded border border-neutral-200 text-base text-neutral-700 font-light leading-4">
            {gbp(totalDue)}
          </div>
        </div>
      </Section>
    </PackScreen>
  );
};

export default CoveringLetterForm;
