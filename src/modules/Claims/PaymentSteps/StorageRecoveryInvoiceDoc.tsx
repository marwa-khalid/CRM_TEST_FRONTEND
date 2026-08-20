import { gbp, shortSlash, d, m, DocShell, toNum } from "./docHelpers";

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

/*
 * IMPORTANT FOR CLEAN PDF BORDERS
 *
 * Use a normal 1px border with border-collapse: collapse.
 * Fractional borders such as 0.5px / 0.5pt can be rasterised differently
 * by Chromium when the PDF is generated, which makes some lines look
 * darker or thicker than others.
 *
 * With collapse enabled, shared borders are rendered as ONE line.
 */
// Grey (not black) so the grid reads the same weight as the other pack docs.
const border = "1px solid #808080";

// Single-border-per-line (exactly like the clean Plating doc): each cell draws only its
// RIGHT + BOTTOM; the first column adds LEFT and the header row adds TOP — all on the
// CELLS (never on the table). Every gridline is drawn by one cell, so nothing stacks.
const tableStyle = {
  borderCollapse: "collapse" as const,
  borderSpacing: 0,
};

const cellBorderStyle = {
  borderRight: border,
  borderBottom: border,
};

const firstColStyle = {
  borderLeft: border,
  borderRight: border,
  borderBottom: border,
};

const headStyle = {
  borderTop: border,
  borderRight: border,
  borderBottom: border,
};

const headFirstStyle = {
  borderTop: border,
  borderLeft: border,
  borderRight: border,
  borderBottom: border,
};

// Totals boxes sit on the right only — no top border (the row above supplies it) so
// the empty left spacer stays borderless.
const totalsCellStyle = {
  borderLeft: border,
  borderRight: border,
  borderBottom: border,
};

const vehicleHead = "bg-[#d9d9d9] p-0 text-[9px] font-bold";

const vehicleCell = "p-0 text-[9px] font-normal";

const detailHead = "bg-[#d9d9d9] p-0 text-[9px] font-bold";

const invoiceCell = "p-0 text-[9px] font-normal";

const StorageRecoveryInvoiceDoc = ({
  data,
}: {
  data: StorageRecoveryInvoiceDocData;
}) => {
  const storages = data.storages && data.storages.length ? data.storages : [];

  const recoveries =
    data.recoveries && data.recoveries.length ? data.recoveries : [];

  const subTotal =
    data.total ??
    storages.reduce((sum, row) => sum + toNum(row.amount), 0) +
      recoveries.reduce((sum, row) => sum + toNum(row.amount), 0);

  const vat = subTotal * 0.2;
  const totalDue = subTotal + vat;

  return (
    <DocShell>
      {/* BILL TO */}
      <div className="mt-[92px] w-[250px] text-[10px] leading-[1.35] whitespace-pre-line">
        <div className="mb-2 font-bold">Bill To:</div>

        <div>{data.billTo || "—"}</div>
      </div>

      {/* INVOICE INFORMATION */}
      <div className="mt-10 grid grid-cols-[92px_1fr] gap-y-1 text-[10px] leading-[1.35]">
        <div>Invoice Date:</div>
        <div>{shortSlash(data.invoiceDate)}</div>

        <div>Invoice Number:</div>
        <div>{data.invoiceNumber || "—"}</div>
      </div>

      {/* TITLE */}
      <h1 className="mt-3 mb-3 text-center text-[16px] font-bold tracking-wide">
        STORAGE &amp; RECOVERY INVOICE
      </h1>

      {/* CLIENT / VEHICLE TABLE */}
      <table className="w-[430px] mx-auto table-fixed mb-5" style={tableStyle}>
        <thead>
          <tr>
            <th className={`${vehicleHead} w-[28%]`} style={headFirstStyle}>
              <div className="h-[34px] px-1.5 flex items-center justify-center text-center leading-[1.15]">
                Client
              </div>
            </th>

            <th className={`${vehicleHead} w-[22%]`} style={headStyle}>
              <div className="h-[34px] px-1.5 pt-[3px] pb-[5px] flex items-center justify-center text-center leading-[1.15]">
                <div>
                  Vehicle
                  <br />
                  Registration
                </div>
              </div>
            </th>

            <th className={`${vehicleHead} w-[50%]`} style={headStyle}>
              <div className="h-[34px] px-1.5 flex items-center justify-center text-center leading-[1.15]">
                Vehicle Description
              </div>
            </th>
          </tr>
        </thead>

        <tbody>
          <tr>
            <td className={vehicleCell} style={firstColStyle}>
              <div className="min-h-[36px] px-1.5 py-1 flex items-center justify-center text-center">
                {data.client || "—"}
              </div>
            </td>

            <td className={vehicleCell} style={cellBorderStyle}>
              <div className="min-h-[36px] px-1.5 py-1 flex items-center justify-center text-center whitespace-pre-line">
                {data.vehicleRegistration || "—"}
              </div>
            </td>

            <td className={vehicleCell} style={cellBorderStyle}>
              <div className="min-h-[36px] px-1.5 py-1 flex items-center justify-center text-center whitespace-pre-line">
                {data.vehicleDescription || "—"}
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      {/* MAIN INVOICE AREA */}
      <div className="w-[500px] mx-auto">
        <table className="w-[500px] table-fixed" style={tableStyle}>
          <colgroup>
            <col style={{ width: "350px" }} />
            <col style={{ width: "150px" }} />
          </colgroup>

          <thead>
            <tr>
              <th className={detailHead} style={headFirstStyle}>
                <div className="h-[27px] flex items-center justify-center text-center">
                  Details
                </div>
              </th>

              <th className={detailHead} style={headStyle}>
                <div className="h-[27px] px-[7px] flex items-center justify-end text-right">
                  Amount
                </div>
              </th>
            </tr>
          </thead>

          <tbody>
            {/* RECOVERY ROWS */}
            {recoveries.map((row, index) => (
              <tr key={`recovery-${index}`}>
                <td className={invoiceCell} style={firstColStyle}>
                  <div className="min-h-[46px] px-[7px] py-[5px] flex items-center">
                    <span>
                      Vehicle Recovered to Nationwide Assist
                      {row.provider ? ` by ${row.provider}` : ""}
                      {row.recoveryDate
                        ? ` on ${shortSlash(row.recoveryDate)}`
                        : ""}
                    </span>
                  </div>
                </td>

                <td className={invoiceCell} style={cellBorderStyle}>
                  <div className="min-h-[46px] px-[7px] py-[5px] flex items-center justify-end text-right whitespace-nowrap">
                    {m(row.amount)}
                  </div>
                </td>
              </tr>
            ))}

            {/* STORAGE ROWS */}
            {storages.map((row, index) => (
              <tr key={`storage-${index}`}>
                <td className={invoiceCell} style={firstColStyle}>
                  <div className="min-h-[54px] px-[7px] py-[5px] flex items-center">
                    <span>
                      Vehicle stored at Nationwide Assist at {m(row.rate)} per
                      day for {d(row.days)} days
                      {row.startDate || row.endDate
                        ? ` from ${shortSlash(
                            row.startDate,
                          )} until ${shortSlash(row.endDate)}`
                        : ""}
                    </span>
                  </div>
                </td>

                <td className={invoiceCell} style={cellBorderStyle}>
                  <div className="min-h-[54px] px-[7px] py-[5px] flex items-center justify-end text-right whitespace-nowrap">
                    {m(row.amount)}
                  </div>
                </td>
              </tr>
            ))}

            {/* EMPTY STATE */}
            {!recoveries.length && !storages.length ? (
              <tr>
                <td className={invoiceCell} style={firstColStyle}>
                  <div className="h-[46px] px-[7px] flex items-center justify-center text-center">
                    No storage or recovery charges
                  </div>
                </td>

                <td className={invoiceCell} style={cellBorderStyle}>
                  <div className="h-[46px] px-[7px] flex items-center justify-end text-right">
                    {gbp(0)}
                  </div>
                </td>
              </tr>
            ) : null}

            {/* SUB TOTAL + VAT */}
            <tr>
              <td className="p-0" style={{ border: "none" }} />

              <td
                className="p-0 text-[9px] font-bold bg-white"
                style={totalsCellStyle}
              >
                <div className="h-[32px] px-[7px] flex items-center">
                  <span className="w-[78px] text-right pr-[8px] whitespace-nowrap">
                    Sub Total
                  </span>

                  <span className="flex-1 text-right whitespace-nowrap">
                    {gbp(subTotal)}
                  </span>
                </div>

                <div className="h-[32px] px-[7px] flex items-center">
                  <span className="w-[78px] text-right pr-[8px] whitespace-nowrap">
                    VAT
                  </span>

                  <span className="flex-1 text-right whitespace-nowrap">
                    {gbp(vat)}
                  </span>
                </div>
              </td>
            </tr>

            {/* TOTAL */}
            <tr>
              <td className="p-0" style={{ border: "none" }} />

              <td
                className="bg-[#d9d9d9] p-0 text-[9px] font-bold"
                style={totalsCellStyle}
              >
                <div className="h-[32px] px-[7px] flex items-center">
                  <span className="w-[78px] text-right pr-[8px] whitespace-nowrap">
                    TOTAL
                  </span>

                  <span className="flex-1 text-right whitespace-nowrap">
                    {gbp(totalDue)}
                  </span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </DocShell>
  );
};

export default StorageRecoveryInvoiceDoc;
