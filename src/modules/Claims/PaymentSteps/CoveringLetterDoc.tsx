import { gbp, m0, datedLong, cellBase, headBase, DocShell, DocHeader, SectionLabel, DocFooter } from "./docHelpers";

// Print/PDF document for the Covering Letter — "Heads of Claim" schedule with a
// per-period (BHR / <30 / 31–60 / 61+) column for every head of claim. The
// <30-day (ABI) column is highlighted as the applicable GTA rate.

type Col = "bhr" | "abi" | "lpp10" | "lpp20";
const COLS: Col[] = ["bhr", "abi", "lpp10", "lpp20"];
const COL_HEAD: Record<Col, { title: string; sub: string }> = {
  bhr: { title: "BHR", sub: "Basic Hire" },
  abi: { title: "<30 Days", sub: "ABI Rate" },
  lpp10: { title: "31–60 Days", sub: "+10% LPP" },
  lpp20: { title: "61+ Days", sub: "+20% LPP" },
};

export type ColVals = Partial<Record<Col, string | number>>;

export type CoveringLetterDocData = {
  ourReference?: string;
  yourReference?: string;
  dated?: string; // YYYY-MM-DD
  yourInsured?: string;
  ourClient?: string;
  incidentDate?: string; // YYYY-MM-DD
  rows?: ({ label: string } & ColVals)[];
  subTotal?: ColVals;
  vat?: ColVals;
  total?: ColVals;
  valetingFee?: number;
  signatory?: string;
};

// Numeric cells across the four period columns; ABI (index 1) is highlighted.
const NumCells = ({ vals, bold, topThick }: { vals: ColVals; bold?: boolean; topThick?: boolean }) => (
  <>
    {COLS.map((c, i) => (
      <td
        key={c}
        className={`${cellBase} text-right w-28${i === 1 ? " bg-gray-200" : ""}${bold ? " font-bold" : ""}${topThick ? " border-t-2" : ""}`}
      >
        {m0(vals[c])}
      </td>
    ))}
  </>
);

const CoveringLetterDoc = ({ data }: { data: CoveringLetterDocData }) => {
  const rows = data.rows || [];
  const empty: ColVals = {};

  return (
    <DocShell>
      <DocHeader ourRef={data.ourReference} yourRef={data.yourReference} dated={datedLong(data.dated)} />

      {/* Title */}
      <div className="self-stretch pt-6">
        <div className="self-stretch pt-3.5 pb-0.5 flex flex-col gap-1.5">
          <div className="text-[10px] uppercase leading-4">COVERING LETTER · SCHEDULE OF CLAIM</div>
          <div className="text-base font-bold uppercase leading-5">HEADS OF CLAIM</div>
        </div>
      </div>

      {/* Meta box — 2×2 */}
      <div className="self-stretch pt-3.5">
        <table className="w-full border-collapse table-fixed">
          <tbody>
            <tr>
              <td className={`${cellBase} w-1/2`}>
                <div className="flex justify-between items-center">
                  <span className="text-[10px]">Your Insured:</span>
                  <span className="text-xs font-bold text-right">{data.yourInsured || "—"}</span>
                </div>
              </td>
              <td className={`${cellBase} w-1/2`}>
                <div className="flex justify-between items-center">
                  <span className="text-[10px]">Our Client:</span>
                  <span className="text-xs font-bold text-right">{data.ourClient || "—"}</span>
                </div>
              </td>
            </tr>
            <tr>
              <td className={cellBase}>
                <div className="flex justify-between items-center">
                  <span className="text-[10px]">Our Reference:</span>
                  <span className="text-xs font-bold text-right">{data.ourReference || "—"}</span>
                </div>
              </td>
              <td className={cellBase}>
                <div className="flex justify-between items-center">
                  <span className="text-[10px]">Incident Date:</span>
                  <span className="text-xs font-bold text-right">{datedLong(data.incidentDate)}</span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Intro */}
      <div className="self-stretch pt-4">
        <div className="text-xs leading-4">
          Dear Sirs — We refer to the above incident, of which we initially advised you. Please find below details of our client's credit hire and associated losses of claim, with supporting documentation enclosed. The heads of claim consist of the following:
        </div>
      </div>

      <SectionLabel no="01." title="SCHEDULE OF CHARGES" />
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className={`${headBase} text-left`}>Head of Claim</th>
            {COLS.map((c) => (
              <th key={c} className={`${headBase} text-right w-28`}>
                <div>{COL_HEAD[c].title}</div>
                <div className="text-[9px] font-normal leading-3">{COL_HEAD[c].sub}</div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              <td className={cellBase}>{r.label}</td>
              <NumCells vals={r} />
            </tr>
          ))}
          <tr>
            <td className={`${cellBase} bg-neutral-50`}>Sub Total</td>
            <NumCells vals={data.subTotal || empty} />
          </tr>
          <tr>
            <td className={cellBase}>VAT @ 20%</td>
            <NumCells vals={data.vat || empty} />
          </tr>
          <tr>
            <td className={`${cellBase} font-bold border-t-2`}>TOTAL</td>
            <NumCells vals={data.total || empty} bold topThick />
          </tr>
        </tbody>
      </table>

      {/* Note under table */}
      <div className="self-stretch pt-1.5">
        <div className="text-xs leading-4">
          Highlighted column indicates the applicable ABI GTA rate for settlement within the current period. Valeting fees (not VAT applicable): {gbp(data.valetingFee || 0)}.
        </div>
      </div>

      <SectionLabel no="02." title="SETTLEMENT NOTICES" />
      <div className="self-stretch flex flex-col gap-2 pt-1.5">
        <div className="self-stretch px-2 py-1.5 border border-black">
          <div className="text-xs font-bold underline leading-4">ABI Insurers</div>
          <div className="text-xs leading-4">
            Should settlement go beyond 60 days from the date of this payment pack, this will fall outside of the ABI GTA and our Basic Hire Rate will apply. Our file will be passed to solicitors without further notice in order to commence litigation.
          </div>
        </div>
        <div className="self-stretch px-2 py-1.5 border border-black">
          <div className="text-xs font-bold underline leading-4">Non-ABI Insurers</div>
          <div className="text-xs leading-4">
            As you do not subscribe to the ABI GTA, our full Basic Hire Rate applies at all times. Settlement should be received strictly within 30 days. Should settlement go beyond 30 days, our file will be passed to solicitors in order to commence litigation.
          </div>
        </div>
      </div>

      {/* Cheque + signature */}
      <div className="self-stretch pt-4 flex justify-between items-end">
        <div className="flex flex-col gap-1">
          <div className="text-[10px] leading-4">Please make your cheque payable to:</div>
          <div className="text-xs font-semibold leading-5">Nationwide Assist Ltd</div>
        </div>
        <div className="flex flex-col items-end">
          <div className="text-right text-[10px] leading-4">Yours faithfully,</div>
          <div className="pt-1.5 text-right text-base font-bold leading-5">{data.signatory || "Nationwide Assist Ltd"}</div>
          <div className="text-right text-[9px] leading-3">Nationwide Assist Ltd</div>
        </div>
      </div>

      <DocFooter label="Covering Letter" />
    </DocShell>
  );
};

export default CoveringLetterDoc;
