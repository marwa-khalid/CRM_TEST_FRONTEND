import { gbp, slash, longDate, m, d, cellBase, headBase, DocShell, DocHeader, SectionLabel, DocFooter } from "./docHelpers";

export type StorageInvoiceRow = {
  provider?: string;
  startDate?: string;
  endDate?: string;
  days?: string | number;
  rate?: string | number;
  amount?: string | number;
};

export type RecoveryInvoiceRow = {
  provider?: string;
  recoveryDate?: string;
  amount?: string | number;
};

export type StorageRecoveryInvoiceDocData = {
  ourReference?: string;
  invoiceNumber?: string;
  invoiceDate?: string;
  yourReference?: string;
  client?: string;
  billTo?: string;
  storages?: StorageInvoiceRow[];
  recoveries?: RecoveryInvoiceRow[];
  total?: number;
};

const StorageRecoveryInvoiceDoc = ({ data }: { data: StorageRecoveryInvoiceDocData }) => {
  const storages = data.storages && data.storages.length ? data.storages : [];
  const recoveries = data.recoveries && data.recoveries.length ? data.recoveries : [];

  return (
    <DocShell>
      <DocHeader
        ourRef={data.ourReference}
        yourRef={data.yourReference}
        dated={slash(data.invoiceDate)}
      />

      <div className="self-stretch pt-7 flex justify-between items-end">
        <div className="pt-3.5 pb-0.5 flex flex-col gap-1.5">
          <div className="text-[10px] uppercase leading-4">INVOICE · STORAGE &amp; RECOVERY</div>
          <div className="text-base font-bold uppercase leading-5">STORAGE AND RECOVERY INVOICE</div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className="text-right text-[12px] font-weight-600 uppercase leading-3 tracking-wider">BILL TO</div>
          <div className="text-right text-base font-weight-600 leading-5">{data.billTo || "—"}</div>
        </div>
      </div>

      <div className="self-stretch pt-3.5">
        <table className="w-full border-collapse table-fixed">
          <tbody>
            <tr>
              <td className={`${cellBase} w-1/2`}>
                <div className="flex justify-between items-center">
                  <span className="text-[10px]">Invoice No.:</span>
                  <span className="text-xs font-bold text-right">{data.invoiceNumber || "—"}</span>
                </div>
              </td>
              <td className={`${cellBase} w-1/2`}>
                <div className="flex justify-between items-center">
                  <span className="text-[10px]">Invoice Date:</span>
                  <span className="text-xs font-bold text-right">{slash(data.invoiceDate)}</span>
                </div>
              </td>
            </tr>
            <tr>
              <td className={cellBase}>
                <div className="flex justify-between items-center">
                  <span className="text-[10px]">Client:</span>
                  <span className="text-xs font-bold text-right">{data.client || "—"}</span>
                </div>
              </td>
              <td className={cellBase}>
                <div className="flex justify-between items-center">
                  <span className="text-[10px]">Invoice Type:</span>
                  <span className="text-xs font-bold text-right">Storage &amp; Recovery</span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <SectionLabel no="01." title="STORAGE CHARGES" />
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className={`${headBase} text-left`}>Storage Provider</th>
            <th className={`${headBase} text-left w-24`}>Start Date</th>
            <th className={`${headBase} text-left w-24`}>End Date</th>
            <th className={`${headBase} text-right w-14`}>Days</th>
            <th className={`${headBase} text-right w-24`}>Daily Rate</th>
            <th className={`${headBase} text-right w-24`}>Amount</th>
          </tr>
        </thead>
        <tbody>
          {storages.length ? (
            storages.map((row, index) => (
              <tr key={index}>
                <td className={cellBase}>{d(row.provider)}</td>
                <td className={cellBase}>{longDate(row.startDate)}</td>
                <td className={cellBase}>{longDate(row.endDate)}</td>
                <td className={`${cellBase} text-right`}>{d(row.days)}</td>
                <td className={`${cellBase} text-right`}>{m(row.rate)}</td>
                <td className={`${cellBase} text-right`}>{m(row.amount)}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td className={`${cellBase} text-center`} colSpan={6}>No storage charges</td>
            </tr>
          )}
        </tbody>
      </table>

      <SectionLabel no="02." title="RECOVERY CHARGES" />
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className={`${headBase} text-left`}>Recovery Provider</th>
            <th className={`${headBase} text-left w-32`}>Recovery Date</th>
            <th className={`${headBase} text-right w-32`}>Amount</th>
          </tr>
        </thead>
        <tbody>
          {recoveries.length ? (
            recoveries.map((row, index) => (
              <tr key={index}>
                <td className={cellBase}>{d(row.provider)}</td>
                <td className={cellBase}>{longDate(row.recoveryDate)}</td>
                <td className={`${cellBase} text-right`}>{m(row.amount)}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td className={`${cellBase} text-center`} colSpan={3}>No recovery charges</td>
            </tr>
          )}
        </tbody>
      </table>

      <div className="self-stretch pt-2.5 flex flex-col items-end">
        <div className="w-72 flex flex-col">
          <div className="pt-[5px] border-t-2 border-black flex justify-between items-center">
            <span className="text-xs font-bold uppercase leading-4">TOTAL DUE</span>
            <span className="text-xs font-bold leading-4">{gbp(data.total || 0)}</span>
          </div>
        </div>
      </div>

      <DocFooter label="Storage and Recovery Invoice" />
    </DocShell>
  );
};

export default StorageRecoveryInvoiceDoc;
