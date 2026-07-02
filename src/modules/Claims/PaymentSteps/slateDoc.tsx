import React from "react";
import naLogo from "../../../assets/AutoClaim_icon/nationwide-assist-logo.png";

// Shared "Slate" document toolkit — the single visual language for every Payment
// Pack PDF (Credit Hire Invoice, Plating, ABI Breakdown, Covering Letter, Front
// Cover). Clean monochrome greyscale: dark-slate accents, light-grey bands,
// hairline tables. html2canvas-safe (solid rgb colours, tall cell line-height).

export const INK = "#1F2937";    // slate-800
export const SLATE = "#475569";  // slate-600
export const LIGHT = "#F1F3F5";  // light grey band
export const HILITE = "#E2E8F0"; // slate-200 (highlighted column)

// Table cell / header classes. A tall line-height centres the single line under
// html2canvas (align-middle is not honoured reliably).
export const slateCell = "px-3 text-[11px] leading-[2.7] text-slate-700 border-b border-slate-100";
export const slateHead = "px-3 text-[9px] leading-[2.4] font-bold uppercase tracking-[0.14em] text-slate-500 text-left";

// Full-page shell: masthead (logo + right-aligned kicker) and footer, with a
// dark rule under the header. Children fill the middle; footer sticks to bottom.
export const SlateShell = ({
  title, titleSub, footerLabel, children,
}: { title: string; titleSub?: string; footerLabel: string; children: React.ReactNode }) => (
  <div className="w-[793.70px] min-h-[1090px] bg-white text-slate-700 font-['Stack_Sans_Headline'] flex flex-col px-16 pt-14 pb-12">
    {/* Masthead */}
    <div className="flex justify-between items-start">
      <div className="flex flex-col gap-1.5">
        <img src={naLogo} alt="Nationwide Assist" className="h-12 w-auto self-start" />
        <div className="text-[11px] uppercase tracking-[0.2em] text-slate-400 pl-0.5">Credit Hire &amp; Claims</div>
      </div>
      <div className="text-right">
        <div className="text-3xl font-light uppercase tracking-[0.18em]" style={{ color: INK }}>{title}</div>
        {titleSub ? <div className="text-[11px] text-slate-500 mt-1">{titleSub}</div> : null}
      </div>
    </div>

    <div className="mt-8 border-t-2" style={{ borderColor: INK }} />

    {children}

    {/* Footer */}
    <div className="mt-auto pt-8">
      <div className="border-t border-slate-200 pt-3 flex justify-between items-center">
        <span className="text-[9px] uppercase tracking-[0.16em] text-slate-400">Nationwide Assist Ltd — {footerLabel}</span>
        <span className="text-[9px]" style={{ color: SLATE }}>Page 01 / 01</span>
      </div>
    </div>
  </div>
);

export const SlateSectionLabel = ({ children }: { children: React.ReactNode }) => (
  <div className="mt-8 mb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-600">{children}</div>
);

export const SlateMeta = ({ label, value }: { label: string; value: string }) => (
  <div className="flex flex-col gap-1">
    <span className="text-[9px] uppercase tracking-[0.16em] text-slate-400">{label}</span>
    <span className="text-[12px] font-weight-600 text-slate-800">{value || "—"}</span>
  </div>
);

export const SlateCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div style={{ backgroundColor: LIGHT }} className="flex-1 rounded-lg px-5 py-4">
    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{title}</div>
    {children}
  </div>
);

export const SlateNote = ({ title, children }: { title?: string; children: React.ReactNode }) => (
  <div style={{ backgroundColor: LIGHT }} className="rounded-lg px-4 py-3">
    {title ? <div className="text-[11px] font-bold text-slate-700 mb-0.5">{title}</div> : null}
    <div className="text-[11px] leading-5 text-slate-600">{children}</div>
  </div>
);

export const SlateTotalStrip = ({ label, value }: { label: string; value: string }) => (
  <div style={{ backgroundColor: INK }} className="mt-1 rounded-lg px-3 py-3 flex justify-between items-center">
    <span className="text-[13px] font-bold uppercase tracking-widest text-white">{label}</span>
    <span className="text-lg font-bold text-white">{value}</span>
  </div>
);
