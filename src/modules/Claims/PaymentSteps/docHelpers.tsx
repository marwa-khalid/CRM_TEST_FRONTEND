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

// DD/MM/YY, matching the old payment-pack document style.
export const shortSlash = (ymd?: string) => {
  if (!ymd) return "—";
  const [y, m, d] = ymd.slice(0, 10).split("-");
  return y && m && d ? `${d}/${m}/${y.slice(-2)}` : ymd;
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
export const cellBase = "border border-black px-1.5 py-1.5 text-black text-[9px] leading-[1.35] align-middle";
export const headBase = "border border-black px-1.5 py-1.5 bg-[#d9d9d9] text-black text-[9px] font-bold leading-[1.25] align-middle";
export const packPageCls =
  "w-[793.70px] min-h-[1090px] bg-white text-black font-['Arial'] px-[86px] py-[88px] text-[10px] leading-[1.35]";
export const packHead = "border border-black bg-[#d9d9d9] px-1.5 py-1 text-[9px] font-bold leading-[1.25] align-middle";
export const packCell = "border border-black px-1.5 py-1.5 text-[9px] leading-[1.35] align-middle";

// Shared document chrome --------------------------------------------------------

// min-height kept just under one A4 page (297mm ≈ 1122.5px @96dpi) so a short
// document doesn't spill a sliver onto a blank second page in the PDF.
export const DocShell = ({ children }: { children: React.ReactNode }) => (
  <div className={`${packPageCls} flex flex-col`}>
    {children}
  </div>
);

export const DocHeader = ({
  ourRef, yourRef, dated,
}: { ourRef?: string; yourRef?: string; dated?: string }) => (
  <div className="self-stretch pb-4 text-[10px] leading-[1.35]">
    <div>Our Reference:&nbsp;&nbsp;{ourRef || "—"}</div>
    <div>Your Reference:&nbsp;&nbsp;{yourRef || "—"}</div>
    <div>Dated:&nbsp;&nbsp;{dated || "—"}</div>
  </div>
);

export const SectionLabel = ({
  no, title, right,
}: { no: string; title: string; right?: React.ReactNode }) => (
  <div className="self-stretch pt-4 pb-1.5">
    <div className="self-stretch flex items-center gap-1.5">
      <span className="text-[10px] font-bold leading-4">{no}</span>
      <span className="text-[10px] font-bold leading-4">{title}</span>
      {right ? <div className="ml-auto">{right}</div> : null}
    </div>
  </div>
);

export const DocFooter = ({ label }: { label: string }) => (
  <div aria-label={label} className="hidden" />
);
