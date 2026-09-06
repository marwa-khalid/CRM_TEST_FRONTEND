import React, { useContext, useEffect, useRef, useState } from "react";
import { ChevronLeft, Printer, Download, Mail } from "lucide-react";
import { toast } from "react-toastify";
import html2pdf from "html2pdf.js";
import { ClaimsEmailModal, htmlToPlainText } from "../Components/ClaimsEmailModal";
import { sendPaymentPackEmail } from "../../../services/ABIBHRCharges/ABIBHRCharges";
import { CustomDatePicker } from "../Components/DatePicker";
import Vector6 from "../../../assets/AutoClaim_icon/Vector-6.svg";
import { logCaseHistoryDocument } from "../../../services/CaseHistory/caseHistory";

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

// A persistent left-hand card listing every Payment Pack document, so the user
// can jump between documents inside the overlay instead of closing and reopening.
// PackScreen renders it (from context) as a left column beside the document.
export type PackDocItem = { key: string; label: string };
export const PackSidebarContext = React.createContext<React.ReactNode>(null);
// When true, every editable pack field renders read-only (the "Generate" flow —
// the user reviews the finished documents rather than editing them).
export const PackReadOnlyContext = React.createContext<boolean>(false);
// A "Download all documents together" action, surfaced in the PackScreen header
// during the Generate flow. Null in the Edit flow.
export const PackDownloadAllContext = React.createContext<{ onDownloadAll: () => void; busy?: boolean } | null>(null);

export const PackSidebar = ({
  docs, active, onSelect,
}: {
  docs: PackDocItem[];
  active: string;
  onSelect: (key: string) => void;
}) => (
  <div className="w-72 shrink-0 h-full overflow-y-auto scrollbar-hide py-8 px-6 font-['Stack_Sans_Headline']">
    {/* White card on the grey page — same treatment as the form sections on the
        right (rounded, bordered, white). */}
    <div className="p-6 rounded-lg border border-neutral-100 bg-white flex flex-col gap-4">
      <div className="text-neutral-900 text-base font-semibold font-['Stack_Sans_Headline']">Payment Pack</div>
      <div className="self-stretch h-px bg-blue-200" />
      {docs.map((d) => {
        const isActive = d.key === active;
        return (
          <div
            key={d.key}
            onClick={() => onSelect(d.key)}
            className="self-stretch inline-flex justify-start items-center gap-3 cursor-pointer group"
          >
            <span className={`size-4 shrink-0 rounded-full ${isActive ? "bg-blue-500" : "border-2 border-blue-200"}`} />
            <div className={`text-sm leading-4 transition-colors ${isActive ? "text-blue-600 font-medium" : "text-neutral-700 group-hover:text-neutral-900"}`}>
              {d.label}
            </div>
          </div>
        );
      })}
    </div>
  </div>
);

export const PackScreen = ({
  title, onClose, claimId, emailSubject, renderDoc, onEmailSent, children,
}: {
  title: string;
  onClose: () => void;
  claimId?: string | number;
  emailSubject?: string;
  renderDoc?: React.ReactNode;
  onEmailSent?: (sentDate?: string) => void;
  children: React.ReactNode;
}) => {
  const sidebar = useContext(PackSidebarContext); // persistent doc-switcher, if provided
  const readOnly = useContext(PackReadOnlyContext);
  const downloadAll = useContext(PackDownloadAllContext);
  const bodyRef = useRef<HTMLDivElement>(null);
  const docRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState<"" | "print" | "download" | "email">("");
  const [pdf, setPdf] = useState<{ url: string; name: string; blob: Blob } | null>(null);
  const [emailSending, setEmailSending] = useState(false);
  const [downloadOpen, setDownloadOpen] = useState(false);
  const downloadRef = useRef<HTMLDivElement>(null);

  // Close the PDF/Word chooser on an outside click.
  useEffect(() => {
    const h = (e: MouseEvent) => { if (downloadRef.current && !downloadRef.current.contains(e.target as Node)) setDownloadOpen(false); };
    if (downloadOpen) document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [downloadOpen]);

  // "Payment Pack: Credit Hire Invoice" -> "PP-Credit-Hire-Invoice"
  const baseName = `PP-${title.replace(/^payment pack:\s*/i, "").trim()}`
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-|-$/g, "");
  const fileName = `${baseName}.pdf`;

  // When a dedicated print document is supplied, render THAT to PDF (with no
  // extra page margin — the doc has its own). Otherwise fall back to the form.
  const pdfTarget = () => (renderDoc ? docRef.current : bodyRef.current);
  const pdfOpts = () => ({ ...pdfOptions(fileName), margin: renderDoc ? 0 : [10, 10, 10, 10] });

  const buildBlob = async (): Promise<Blob> =>
    await html2pdf().set(pdfOpts()).from(pdfTarget()).output("blob");

  // Word (.doc) via the Word-compatible HTML wrapper — opens in Word, no library.
  const buildDocBlob = (): Blob => {
    const inner = pdfTarget()?.innerHTML || "";
    const html =
      '<html xmlns:o="urn:schemas-microsoft-com:office:office" ' +
      'xmlns:w="urn:schemas-microsoft-com:office:word" ' +
      'xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="utf-8">' +
      "<!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View>" +
      "<w:Zoom>100</w:Zoom></w:WordDocument></xml><![endif]-->" +
      `<title>${title}</title></head><body>${inner}</body></html>`;
    return new Blob(["﻿", html], { type: "application/msword" });
  };

  // "Payment Pack: Storage & Recovery Invoice" -> "PP - Storage & Recovery Invoice"
  const historyLabel = `PP - ${title.replace(/^payment pack:\s*/i, "").trim()}`;

  const runDownload = async (format: "pdf" | "word") => {
    if (busy) return;
    setDownloadOpen(false);
    setBusy("download");
    try {
      const blob = format === "pdf" ? await buildBlob() : buildDocBlob();
      const name = format === "pdf" ? fileName : `${baseName}.doc`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10000);
      // Log it to Case History as a Send Letter (SL) record with the file attached.
      if (claimId) {
        logCaseHistoryDocument(claimId, blob, {
          details: historyLabel,
          actionType: "send_letter",
          subject: historyLabel,
          fileName: name,
        }).catch((e) => console.error("Case History PP log failed:", e));
      }
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
      const blob = await buildBlob();
      const url = URL.createObjectURL(blob);
      setPdf({ url, name: fileName, blob });
    } finally {
      setBusy("");
    }
  };

  const closeEmail = () => {
    if (pdf) URL.revokeObjectURL(pdf.url);
    setPdf(null);
  };

  const sendPackEmail = async (editedHtml: string, to: string, subject: string, cc: string) => {
    if (!pdf) return;
    if (!to.trim()) { toast.warn("Please enter a recipient email address."); return; }
    if (!claimId) { toast.error("Claim id is missing for this payment pack email."); return; }
    const payload = new FormData();
    payload.append("to_email", to.trim());
    payload.append("cc_email", cc.trim());
    payload.append("subject", subject.trim());
    payload.append("body", htmlToPlainText(editedHtml));
    payload.append("document_name", pdf.name);
    payload.append("attachment", new File([pdf.blob], pdf.name, { type: "application/pdf" }));
    try {
      setEmailSending(true);
      const response = await sendPaymentPackEmail(claimId, payload);
      toast.success("Payment pack email sent.");
      onEmailSent?.(response.data?.payment_pack_sent_date);
      closeEmail();
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || "Failed to send payment pack email.");
    } finally {
      setEmailSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-white flex flex-col font-['Stack_Sans_Headline']">
      {/* Header — full width across the top (per Figma). */}
      <div className="shrink-0 bg-white px-10 py-5 shadow-[0px_4px_20px_0px_rgba(0,0,0,0.08)] flex justify-between items-center">
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
            <div className="relative" ref={downloadRef}>
              <button type="button" title="Download" onClick={() => setDownloadOpen((o) => !o)} disabled={!!busy} className="hover:text-blue-600 disabled:opacity-40">
                <Download size={22} />
              </button>
              {downloadOpen && (
                <div className="absolute right-0 top-full mt-2 z-40 w-44 bg-white rounded-md shadow-[0px_4px_16px_0px_rgba(0,0,0,0.16)] py-1 flex flex-col">
                  <button type="button" onClick={() => runDownload("pdf")} className="px-4 py-2.5 text-left text-sm text-neutral-700 hover:bg-blue-50">Download as PDF</button>
                  <button type="button" onClick={() => runDownload("word")} className="px-4 py-2.5 text-left text-sm text-neutral-700 hover:bg-blue-50">Download as Word</button>
                </div>
              )}
            </div>
            <button type="button" title="Email" onClick={handleEmail} disabled={!!busy} className="hover:text-blue-600 disabled:opacity-40">
              <Mail size={22} />
            </button>
          </div>
          {readOnly && downloadAll && (
            <button
              type="button"
              onClick={downloadAll.onDownloadAll}
              disabled={downloadAll.busy}
              className="px-8 py-4 rounded bg-blue-600 text-white text-base font-weight-500 leading-4 hover:bg-blue-700 disabled:opacity-60 flex items-center gap-2"
            >
              {downloadAll.busy ? "Downloading…" : (<><Download size={18} /> Download All</>)}
            </button>
          )}
          {!readOnly && (
            <button
              type="button"
              onClick={onClose}
              className="px-10 py-4 rounded border border-blue-500 text-blue-500 text-base font-weight-500 leading-4 hover:bg-blue-50"
            >
              Discard
            </button>
          )}
        </div>
      </div>
      {/* Below the header: persistent sidebar + the scrollable document. */}
      <div className="flex-1 flex min-h-0">
        {sidebar}
        <div className="flex-1 h-full overflow-auto">
          <div
            ref={bodyRef}
            className={`w-[788px] max-w-full mx-auto py-10 flex flex-col gap-6 ${
              readOnly
                ? "[&_input]:pointer-events-none [&_input]:!bg-neutral-50 [&_select]:pointer-events-none [&_select]:!bg-neutral-50 [&_textarea]:pointer-events-none [&_textarea]:!bg-neutral-50"
                : ""
            }`}
          >{children}</div>
        </div>
      </div>

      {/* Off-screen print document — the actual PDF source when provided. */}
      {renderDoc && (
        <div aria-hidden className="fixed top-0 left-[-10000px] pointer-events-none">
          <div ref={docRef}>{renderDoc}</div>
        </div>
      )}

      {pdf && (
        <ClaimsEmailModal
          isOpen={!!pdf}
          onClose={closeEmail}
          title="Send Email"
          html={'<div style="font-family:Arial,sans-serif;font-size:14px;color:#111827"><p>Please find attached the payment pack document.</p></div>'}
          subject={emailSubject || title}
          to=""
          attachments={[{ name: pdf.name, content_type: "application/pdf" }]}
          sending={emailSending}
          onSend={sendPackEmail}
        />
      )}
    </div>
  );
};

export const Section = ({
  title, divider = true, children,
}: { title: string; divider?: boolean; children: React.ReactNode }) => (
  <section className="self-stretch p-5 rounded-lg border border-neutral-100 bg-white flex flex-col gap-4">
    <h2 className="text-black text-xl font-weight-600 leading-5">{title}</h2>
    {divider && <div className="self-stretch h-px bg-neutral-100" />}
    {children}
  </section>
);

export const Text = ({
  label, value, onChange, placeholder = "--", width = "flex-1",
}: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; width?: string }) => {
  const ro = useContext(PackReadOnlyContext);
  return (
    <div className={`${width} flex flex-col gap-2`}>
      <span className={labelCls}>{label}</span>
      {ro
        ? <div className={readonlyCls}>{value || "—"}</div>
        : <input className={fieldInputCls} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />}
    </div>
  );
};

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
  label, value, onChange, width = "flex-1",
}: { label: string; value: string; onChange: (v: string) => void; width?: string }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const ro = useContext(PackReadOnlyContext);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  if (ro) {
    return (
      <div className={`${width} flex flex-col gap-2`}>
        <span className={labelCls}>{label}</span>
        <div className={readonlyCls}>{value || "—"}</div>
      </div>
    );
  }
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
  label, value, onChange, options, placeholder = "Select", width = "flex-1",
}: { label: string; value: string; onChange: (v: string) => void; options: string[]; placeholder?: string; width?: string }) => {
  const ro = useContext(PackReadOnlyContext);
  if (ro) {
    return (
      <div className={`${width} flex flex-col gap-2`}>
        <span className={labelCls}>{label}</span>
        <div className={readonlyCls}>{value || "—"}</div>
      </div>
    );
  }
  return (
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
};

// Read-only derived field (e.g. computed totals).
export const ReadField = ({
  label, value, width = "flex-1",
}: { label: string; value: string; width?: string }) => (
  <div className={`${width} flex flex-col gap-2`}>
    <span className={labelCls}>{label}</span>
    <div className={readonlyCls}>{value}</div>
  </div>
);
