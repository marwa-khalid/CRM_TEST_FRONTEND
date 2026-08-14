import { useState } from "react";
import { PackScreen, Section, Text, DateField, ReadField, toNum, gbp, money } from "./paymentPackUi";
import StorageRecoveryInvoiceDoc, { type StorageInvoiceRow, type RecoveryInvoiceRow } from "./StorageRecoveryInvoiceDoc";

export type StorageRecoveryInvoicePrefill = {
  ourReference?: string;
  billTo?: string;
  invoiceDate?: string;
  invoiceNumber?: string;
  client?: string;
  yourReference?: string;
  storages?: StorageInvoiceRow[];
  recoveries?: RecoveryInvoiceRow[];
};

const compactInputCls =
  "w-full px-4 py-3 bg-white rounded border border-neutral-200 text-base text-neutral-700 font-light leading-4 outline-none focus:border-blue-500 placeholder:text-neutral-300";

const tableHeadCls = "text-neutral-700 text-sm font-weight-500";

const StorageRowEditor = ({
  row,
  onChange,
}: {
  row: StorageInvoiceRow;
  onChange: (row: StorageInvoiceRow) => void;
}) => (
  <div className="self-stretch grid grid-cols-[1.3fr_0.9fr_0.9fr_0.55fr_0.85fr_0.85fr] gap-3 items-end">
    <input className={compactInputCls} value={row.provider || ""} onChange={(e) => onChange({ ...row, provider: e.target.value })} placeholder="Provider" />
    <input className={compactInputCls} type="date" value={String(row.startDate || "").slice(0, 10)} onChange={(e) => onChange({ ...row, startDate: e.target.value })} />
    <input className={compactInputCls} type="date" value={String(row.endDate || "").slice(0, 10)} onChange={(e) => onChange({ ...row, endDate: e.target.value })} />
    <input className={compactInputCls} value={String(row.days ?? "")} onChange={(e) => onChange({ ...row, days: e.target.value })} placeholder="Days" />
    <input className={compactInputCls} value={String(row.rate ?? "")} onChange={(e) => onChange({ ...row, rate: e.target.value })} placeholder="£0.00" />
    <input className={compactInputCls} value={String(row.amount ?? "")} onChange={(e) => onChange({ ...row, amount: e.target.value })} placeholder="£0.00" />
  </div>
);

const RecoveryRowEditor = ({
  row,
  onChange,
}: {
  row: RecoveryInvoiceRow;
  onChange: (row: RecoveryInvoiceRow) => void;
}) => (
  <div className="self-stretch grid grid-cols-[1fr_0.9fr_0.8fr] gap-3 items-end">
    <input className={compactInputCls} value={row.provider || ""} onChange={(e) => onChange({ ...row, provider: e.target.value })} placeholder="Provider" />
    <input className={compactInputCls} type="date" value={String(row.recoveryDate || "").slice(0, 10)} onChange={(e) => onChange({ ...row, recoveryDate: e.target.value })} />
    <input className={compactInputCls} value={String(row.amount ?? "")} onChange={(e) => onChange({ ...row, amount: e.target.value })} placeholder="£0.00" />
  </div>
);

const StorageRecoveryInvoiceForm = ({
  prefill = {}, claimId, onClose, onEmailSent,
}: {
  prefill?: StorageRecoveryInvoicePrefill;
  claimId?: string | number;
  onClose: () => void;
  onEmailSent?: (sentDate?: string) => void;
}) => {
  const [f, setF] = useState({
    ourReference: prefill.ourReference || "",
    billTo: prefill.billTo || "",
    invoiceDate: prefill.invoiceDate || "",
    invoiceNumber: prefill.invoiceNumber || "",
    yourReference: prefill.yourReference || "",
    client: prefill.client || "",
  });
  const [storages, setStorages] = useState<StorageInvoiceRow[]>(
    (prefill.storages || []).map((row) => ({
      ...row,
      rate: row.rate != null ? money(toNum(row.rate)) : "",
      amount: row.amount != null ? money(toNum(row.amount)) : "",
    })),
  );
  const [recoveries, setRecoveries] = useState<RecoveryInvoiceRow[]>(
    (prefill.recoveries || []).map((row) => ({
      ...row,
      amount: row.amount != null ? money(toNum(row.amount)) : "",
    })),
  );

  const set = (k: keyof typeof f, v: string) => setF((p) => ({ ...p, [k]: v }));
  const setStorage = (index: number, row: StorageInvoiceRow) =>
    setStorages((rows) => rows.map((item, i) => (i === index ? row : item)));
  const setRecovery = (index: number, row: RecoveryInvoiceRow) =>
    setRecoveries((rows) => rows.map((item, i) => (i === index ? row : item)));

  const total =
    storages.reduce((sum, row) => sum + toNum(row.amount), 0) +
    recoveries.reduce((sum, row) => sum + toNum(row.amount), 0);

  const docNode = (
    <StorageRecoveryInvoiceDoc
      data={{
        ...f,
        storages,
        recoveries,
        total,
      }}
    />
  );

  return (
    <PackScreen
      title="Payment Pack: Storage and Recovery Invoice"
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
        <div className="flex gap-5">
          <Text label="Client" value={f.client} onChange={(v) => set("client", v)} />
          <Text label="Our Reference" value={f.ourReference} onChange={(v) => set("ourReference", v)} />
        </div>
      </Section>

      <Section title="Storage Charges">
        <div className="self-stretch grid grid-cols-[1.3fr_0.9fr_0.9fr_0.55fr_0.85fr_0.85fr] gap-3">
          <span className={tableHeadCls}>Storage Provider</span>
          <span className={tableHeadCls}>Start Date</span>
          <span className={tableHeadCls}>End Date</span>
          <span className={tableHeadCls}>Days</span>
          <span className={tableHeadCls}>Daily Rate</span>
          <span className={tableHeadCls}>Amount</span>
        </div>
        {storages.length ? (
          storages.map((row, index) => (
            <StorageRowEditor key={index} row={row} onChange={(next) => setStorage(index, next)} />
          ))
        ) : (
          <div className="self-stretch p-4 rounded border border-dashed border-neutral-200 text-neutral-400 text-sm text-center">
            No storage charges
          </div>
        )}
      </Section>

      <Section title="Recovery Charges">
        <div className="self-stretch grid grid-cols-[1fr_0.9fr_0.8fr] gap-3">
          <span className={tableHeadCls}>Recovery Provider</span>
          <span className={tableHeadCls}>Recovery Date</span>
          <span className={tableHeadCls}>Amount</span>
        </div>
        {recoveries.length ? (
          recoveries.map((row, index) => (
            <RecoveryRowEditor key={index} row={row} onChange={(next) => setRecovery(index, next)} />
          ))
        ) : (
          <div className="self-stretch p-4 rounded border border-dashed border-neutral-200 text-neutral-400 text-sm text-center">
            No recovery charges
          </div>
        )}
      </Section>

      <Section title="Total" divider={false}>
        <div className="flex gap-5">
          <ReadField label="Total Due" value={gbp(total)} />
        </div>
      </Section>
    </PackScreen>
  );
};

export default StorageRecoveryInvoiceForm;
