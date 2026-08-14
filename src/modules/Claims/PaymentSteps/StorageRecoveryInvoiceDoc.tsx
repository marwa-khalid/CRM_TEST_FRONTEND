import { gbp, shortSlash, d, m, packCell, packHead, DocShell, toNum } from "./docHelpers";

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
  vehicleRegistration?: string;
  vehicleDescription?: string;
  storages?: StorageInvoiceRow[];
  recoveries?: RecoveryInvoiceRow[];
  total?: number;
};

const StorageRecoveryInvoiceDoc = ({ data }: { data: StorageRecoveryInvoiceDocData }) => {
  const storages = data.storages && data.storages.length ? data.storages : [];
  const recoveries = data.recoveries && data.recoveries.length ? data.recoveries : [];
  const subTotal =
    data.total ??
    storages.reduce((sum, row) => sum + toNum(row.amount), 0) +
      recoveries.reduce((sum, row) => sum + toNum(row.amount), 0);
  const vat = subTotal * 0.2;
  const totalDue = subTotal + vat;

  return (
    <DocShell>
      <div className="mt-[92px] w-[250px] text-[10px] leading-[1.35] whitespace-pre-line">
        <div className="font-bold mb-2">Bill To:</div>
        <div>{data.billTo || "—"}</div>
      </div>

      <div className="mt-10 grid grid-cols-[92px_1fr] gap-y-1 text-[10px] leading-[1.35]">
        <div>Invoice Date:</div>
        <div>{shortSlash(data.invoiceDate)}</div>
        <div>Invoice Number:</div>
        <div>{data.invoiceNumber || "—"}</div>
      </div>

      <h1 className="mt-3 mb-3 text-center text-[16px] font-bold tracking-wide">
        STORAGE &amp; RECOVERY INVOICE
      </h1>

      <table className="w-[470px] mx-auto border-collapse table-fixed mb-5">
        <thead>
          <tr>
            <th className={`${packHead} w-[33%] text-center`}>Client</th>
            <th className={`${packHead} w-[33%] text-center`}>Vehicle<br />Registration</th>
            <th className={`${packHead} w-[34%] text-center`}>Vehicle Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className={`${packCell} text-center`}>{data.client || "—"}</td>
            <td className={`${packCell} text-center whitespace-pre-line`}>{data.vehicleRegistration || "—"}</td>
            <td className={`${packCell} text-center whitespace-pre-line`}>{data.vehicleDescription || "—"}</td>
          </tr>
        </tbody>
      </table>

      <table className="w-[560px] mx-auto border-collapse table-fixed">
        <thead>
          <tr>
            <th className={`${packHead} text-center`}>Details</th>
            <th className={`${packHead} text-center w-[130px]`}>Amount</th>
          </tr>
        </thead>
        <tbody>
          {recoveries.length ? recoveries.map((row, index) => (
            <tr key={`recovery-${index}`}>
              <td className={packCell}>
                Vehicle Recovered to Nationwide Assist
                {row.provider ? ` by ${row.provider}` : ""}
                {row.recoveryDate ? ` on ${shortSlash(row.recoveryDate)}` : ""}
              </td>
              <td className={`${packCell} text-right`}>{m(row.amount)}</td>
            </tr>
          )) : null}
          {storages.length ? storages.map((row, index) => (
            <tr key={`storage-${index}`}>
              <td className={packCell}>
                Vehicle stored at Nationwide Assist at {m(row.rate)} per day for {d(row.days)} days
                {row.startDate || row.endDate ? ` from ${shortSlash(row.startDate)} until ${shortSlash(row.endDate)}` : ""}
              </td>
              <td className={`${packCell} text-right`}>{m(row.amount)}</td>
            </tr>
          )) : null}
          {!recoveries.length && !storages.length ? (
            <tr>
              <td className={`${packCell} text-center`}>No storage or recovery charges</td>
              <td className={`${packCell} text-right`}>{gbp(0)}</td>
            </tr>
          ) : null}
          <tr>
            <td className={`${packCell} border-none`} />
            <td className={`${packCell} bg-white font-bold`}>
              <div className="flex justify-between"><span>Sub Total</span><span>{gbp(subTotal)}</span></div>
            </td>
          </tr>
          <tr>
            <td className={`${packCell} border-none`} />
            <td className={`${packCell} bg-white font-bold`}>
              <div className="flex justify-between"><span>VAT</span><span>{gbp(vat)}</span></div>
            </td>
          </tr>
          <tr>
            <td className={`${packCell} border-none`} />
            <td className={`${packCell} bg-[#d9d9d9] font-bold`}>
              <div className="flex justify-between"><span>TOTAL</span><span>{gbp(totalDue)}</span></div>
            </td>
          </tr>
        </tbody>
      </table>
    </DocShell>
  );
};

export default StorageRecoveryInvoiceDoc;
