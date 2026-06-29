import React, { useEffect, useRef, useState } from "react";
import { ChevronLeft, Printer, Download, Mail } from "lucide-react";
import html2pdf from "html2pdf.js";
import PackEmailModal from "./PackEmailModal";
import { CustomDatePicker } from "../Components/DatePicker";
import Vector6 from "../../../assets/AutoClaim_icon/Vector-6.svg";

// Shared UI for the editable "Payment Pack: …" full-screen forms (Credit Hire
// Invoice, ABI Hire Breakdown, …). One top bar + field set, reused per screen.

// html2pdf options for rendering a pack body (the A4 document) to PDF.
const pdfOptions = (filename: string) => ({
  margin: [10, 10, 10, 10],
  filename,
  image: { type: "jpeg", quality: 0.98 },
  pagebreak: { mode: ["css", "legacy"] },
  html2canvas: { scale: 2, useCORS: true, backgroundColor: "#ffffff" },
  jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
});

export const toNum = (v: any) => parseFloat(String(v ?? "").replace(/[^0-9.-]/g, "")) || 0;
export const gbp = (n: number) =>
  `£${(Number(n) || 0).toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
export const money = (v?: number) => (v != null ? gbp(v) : "");

const labelCls = "text-neutral-700 text-sm font-weight-500";
export const fieldInputCls =
  "self-stretch px-5 py-4 bg-white rounded border border-neutral-200 text-base text-neutral-700 font-light leading-4 outline-none focus:border-blue-500 placeholder:text-neutral-300";
export const readonlyCls =
  "self-stretch px-5 py-4 bg-neutral-50 rounded border border-neutral-200 text-base text-neutral-700 font-light leading-4";

export const PackScreen = ({
  title, onClose, emailSubject, renderDoc, children,
}: { title: string; onClose: () => void; emailSubject?: string; renderDoc?: React.ReactNode; children: React.ReactNode }) => {
  const bodyRef = useRef<HTMLDivElement>(null);
  const docRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState<"" | "print" | "download" | "email">("");
  const [pdf, setPdf] = useState<{ url: string; name: string } | null>(null);

  // "Payment Pack: Credit Hire Invoice" -> "Payment-Pack-Credit-Hire-Invoice.pdf"
  const fileName = `${title.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "")}.pdf`;

  // When a dedicated print document is supplied, render THAT to PDF (with no
  // extra page margin — the doc has its own). Otherwise fall back to the form.
  const pdfTarget = () => (renderDoc ? docRef.current : bodyRef.current);
  const pdfOpts = () => ({ ...pdfOptions(fileName), margin: renderDoc ? 0 : [10, 10, 10, 10] });

  const buildBlob = async (): Promise<Blob> =>
    await html2pdf().set(pdfOpts()).from(pdfTarget()).output("blob");

  const handleDownload = async () => {
    if (busy) return;
    setBusy("download");
    try {
      await html2pdf().set(pdfOpts()).from(pdfTarget()).save();
    } finally {
      setBusy("");
    }
  };

  const handlePrint = async () => {
    if (busy) return;
    setBusy("print");
    try {
      const url = URL.createObjectURL(await buildBlob());
      const iframe = document.createElement("iframe");
      iframe.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0;";
      iframe.src = url;
      iframe.onload = () => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        // Clean up after the print dialog has had time to grab the document.
        setTimeout(() => { iframe.remove(); URL.revokeObjectURL(url); }, 60000);
      };
      document.body.appendChild(iframe);
    } finally {
      setBusy("");
    }
  };

  const handleEmail = async () => {
    if (busy) return;
    setBusy("email");
    try {
      const url = URL.createObjectURL(await buildBlob());
      setPdf({ url, name: fileName });
    } finally {
      setBusy("");
    }
  };

  const closeEmail = () => {
    if (pdf) URL.revokeObjectURL(pdf.url);
    setPdf(null);
  };

  return (
    <div className="fixed inset-0 z-[200] bg-white overflow-auto font-['Stack_Sans_Headline']">
      <div className="sticky top-0 z-10 bg-white px-10 py-5 shadow-[0px_4px_20px_0px_rgba(0,0,0,0.08)] flex justify-between items-center">
        <div className="flex items-center gap-5">
          <button type="button" onClick={onClose} aria-label="Back" className="text-blue-500 hover:text-blue-600">
            <ChevronLeft size={24} />
          </button>
          <span className="text-black text-2xl font-weight-600 leading-6">{title}</span>
        </div>
        <div className="flex items-center gap-12">
          <div className="flex items-center gap-6 text-blue-500">
            <button type="button" title="Print" onClick={handlePrint} disabled={!!busy} className="hover:text-blue-600 disabled:opacity-40">
              <Printer size={22} />
            </button>
            <button type="button" title="Download" onClick={handleDownload} disabled={!!busy} className="hover:text-blue-600 disabled:opacity-40">
              <Download size={22} />
            </button>
            <button type="button" title="Email" onClick={handleEmail} disabled={!!busy} className="hover:text-blue-600 disabled:opacity-40">
              <Mail size={22} />
            </button>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-10 py-4 rounded border border-blue-500 text-blue-500 text-base font-weight-500 leading-4 hover:bg-blue-50"
          >
            Discard
          </button>
        </div>
      </div>
      <div ref={bodyRef} className="w-[788px] max-w-full mx-auto py-10 flex flex-col gap-6">{children}</div>

      {/* Off-screen print document — the actual PDF source when provided. */}
      {renderDoc && (
        <div aria-hidden className="fixed top-0 left-[-10000px] pointer-events-none">
          <div ref={docRef}>{renderDoc}</div>
        </div>
      )}

      {pdf && (
        <PackEmailModal
          subject={emailSubject || title}
          attachment={pdf}
          onClose={closeEmail}
        />
      )}
    </div>
  );
};

export const Section = ({
  title, divider = true, children,
}: { title: string; divider?: boolean; children: React.ReactNode }) => (
  <section className="self-stretch p-5 rounded-lg border border-neutral-100 flex flex-col gap-4">
    <h2 className="text-black text-xl font-weight-600 leading-5">{title}</h2>
    {divider && <div className="self-stretch h-px bg-neutral-100" />}
    {children}
  </section>
);

export const Text = ({
  label, value, onChange, placeholder = "--", width = "w-96",
}: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; width?: string }) => (
  <div className={`${width} flex flex-col gap-2`}>
    <span className={labelCls}>{label}</span>
    <input className={fieldInputCls} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
  </div>
);

// Local YYYY-MM-DD formatter — avoids the UTC day-shift that toISOString() causes
// on local-midnight dates.
const toYmd = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

// Custom calendar date field — matches the picker on the General Details screen.
export const DateField = ({
  label, value, onChange, width = "w-96",
}: { label: string; value: string; onChange: (v: string) => void; width?: string }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className={`${width} flex flex-col gap-2 relative`} ref={ref}>
      <span className={labelCls}>{label}</span>
      <div
        onClick={() => setOpen((v) => !v)}
        className="self-stretch px-5 py-4 bg-white rounded border border-neutral-200 flex items-center justify-between cursor-pointer"
      >
        <span className={`text-base font-light leading-4 ${value ? "text-neutral-700" : "text-neutral-300"}`}>
          {value || "Select Date"}
        </span>
        <img src={Vector6} alt="" className="w-4 h-4" />
      </div>
      {open && (
        <CustomDatePicker
          selectedDate={value ? new Date(value) : new Date()}
          onDateSelect={(date) => { onChange(toYmd(date)); setOpen(false); }}
        />
      )}
    </div>
  );
};

export const SelectField = ({
  label, value, onChange, options, placeholder = "Select", width = "w-96",
}: { label: string; value: string; onChange: (v: string) => void; options: string[]; placeholder?: string; width?: string }) => (
  <div className={`${width} flex flex-col gap-2`}>
    <span className={labelCls}>{label}</span>
    <select
      className={`${fieldInputCls} appearance-none cursor-pointer bg-[length:12px] bg-[right_1.25rem_center] bg-no-repeat`}
      style={{ backgroundImage: "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 8' fill='none'><path d='M1 1l5 5 5-5' stroke='%230352FD' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/></svg>\")" }}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="">{placeholder}</option>
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  </div>
);

// Read-only derived field (e.g. computed totals).
export const ReadField = ({
  label, value, width = "w-96",
}: { label: string; value: string; width?: string }) => (
  <div className={`${width} flex flex-col gap-2`}>
    <span className={labelCls}>{label}</span>
    <div className={readonlyCls}>{value}</div>
  </div>
);
