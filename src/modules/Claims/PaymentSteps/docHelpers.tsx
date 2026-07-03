import React from "react";
import { gbp, toNum } from "./paymentPackUi";

// Shared helpers for the Payment Pack print/PDF documents (non-editable, A4).
export { gbp, toNum };

// DD / MM / YYYY
export const slash = (ymd?: string) => {
  if (!ymd) return "—";
  const [y, m, d] = ymd.slice(0, 10).split("-");
  return y && m && d ? `${d} / ${m} / ${y}` : ymd;
};

// DD Mon YYYY (e.g. 26 May 2026) — local, no UTC shift.
export const longDate = (ymd?: string) => {
  if (!ymd) return "—";
  const dt = new Date(`${ymd.slice(0, 10)}T00:00:00`);
  return isNaN(dt.getTime())
    ? ymd
    : dt.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

// D Month YYYY (e.g. 3 June 2026) — local, no UTC shift.
export const datedLong = (ymd?: string) => {
  if (!ymd) return "—";
  const dt = new Date(`${ymd.slice(0, 10)}T00:00:00`);
  return isNaN(dt.getTime())
    ? ymd
    : dt.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
};

// Money cell — "—" when empty or zero.
export const m = (v?: string | number) => {
  const s = String(v ?? "").trim();
  if (!s) return "—";
  const n = toNum(s);
  return n ? gbp(n) : "—";
};

// Money cell — always shows £ (even £0.00); "—" only when truly empty.
export const m0 = (v?: string | number) => {
  const s = String(v ?? "").trim();
  return s === "" ? "—" : gbp(toNum(s));
};

// Plain cell — "—" when empty.
export const d = (v?: string | number) => {
  const s = String(v ?? "").trim();
  return s || "—";
};

// Standard table cell / header classes used across the documents.
// A tall line-height (vs a small fixed leading) is what actually vertical-centers
// the single line of text when html2canvas rasterises the table for the PDF —
// `align-middle` alone is not honoured reliably by html2canvas.
export const cellBase = "border border-black px-1.5 py-0.5 text-black text-xs leading-[2.2] align-middle";
export const headBase = "border border-black px-1.5 py-0.5 bg-gray-200 text-black text-[10px] font-bold leading-[2.2] align-middle";

// Shared document chrome --------------------------------------------------------

// min-height kept just under one A4 page (297mm ≈ 1122.5px @96dpi) so a short
// document doesn't spill a sliver onto a blank second page in the PDF.
export const DocShell = ({ children }: { children: React.ReactNode }) => (
  <div className="w-[793.70px] min-h-[1090px] p-16 bg-white text-black font-['Stack_Sans_Headline'] flex flex-col">
    {children}
  </div>
);

export const DocHeader = ({
  ourRef, yourRef, dated,
}: { ourRef?: string; yourRef?: string; dated?: string }) => (
  <div className="self-stretch pb-2 border-b-2 border-black flex justify-between items-start">
    <div className="flex flex-col gap-[0.7px]">
      <div className="text-lg font-bold leading-5">Nationwide Assist Ltd</div>
      <div className="text-[10px] leading-3">Credit Hire &amp; Claims</div>
    </div>
    <div className="text-right text-xs leading-4">
      OUR REF&nbsp;&nbsp;{ourRef || "—"}<br />
      YOUR REF&nbsp;&nbsp;{yourRef || "—"}<br />
      DATED&nbsp;&nbsp;{dated || "—"}
    </div>
  </div>
);

export const SectionLabel = ({
  no, title, right,
}: { no: string; title: string; right?: React.ReactNode }) => (
  <div className="self-stretch pt-4 pb-1.5">
    <div className="self-stretch pb-[3px] border-b border-black flex items-center gap-1.5">
      <span className="text-xs font-bold leading-4">{no}</span>
      <span className="text-xs font-bold uppercase leading-4">{title}</span>
      {right ? <div className="ml-auto">{right}</div> : null}
    </div>
  </div>
);

export const DocFooter = ({ label }: { label: string }) => (
  <div className="self-stretch pt-3.5 mt-auto">
    <div className="self-stretch pt-[5px] border-t border-black flex justify-between items-center">
      <span className="text-[9px] font-bold leading-3">Nationwide Assist Ltd&nbsp;&nbsp;·&nbsp;&nbsp;{label}</span>
      <span className="text-[9px] leading-3">01 / 01</span>
    </div>
  </div>
);
