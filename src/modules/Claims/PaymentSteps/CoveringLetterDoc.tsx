import { gbp, m0, datedLong } from "./docHelpers";
import { SlateShell, SlateSectionLabel, SlateMeta, SlateNote, slateCell, slateHead, LIGHT, HILITE } from "./slateDoc";

// Print/PDF document for the Covering Letter (Slate design) — "Heads of Claim"
// schedule with a per-period (BHR / <30 / 31–60 / 61+) column for every head of
// claim. The <30-day (ABI) column is highlighted as the applicable GTA rate.

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
        className={`${slateCell} text-right w-28${bold ? " font-bold" : ""}${topThick ? " border-t-2 border-slate-300" : ""}`}
        style={i === 1 ? { backgroundColor: HILITE } : undefined}
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
    <SlateShell title="Letter" titleSub="Heads of Claim" footerLabel="Covering Letter">
      {/* Meta grid */}
      <div className="mt-6 grid grid-cols-4 gap-6">
        <SlateMeta label="Your Insured" value={data.yourInsured || "—"} />
        <SlateMeta label="Our Client" value={data.ourClient || "—"} />
        <SlateMeta label="Our Reference" value={data.ourReference || "—"} />
        <SlateMeta label="Incident Date" value={datedLong(data.incidentDate)} />
      </div>

      {/* Intro */}
      <div className="mt-6 text-[11px] leading-5 text-slate-600">
        Dear Sirs — We refer to the above incident, of which we initially advised you. Please find below details of our client's credit hire and associated losses of claim, with supporting documentation enclosed. The heads of claim consist of the following:
      </div>

      <SlateSectionLabel>Schedule of Charges</SlateSectionLabel>
      <table className="w-full border-collapse">
        <thead>
          <tr style={{ backgroundColor: LIGHT }}>
            <th className={slateHead}>Head of Claim</th>
            {COLS.map((c, i) => (
              <th
                key={c}
                className={`${slateHead} text-right w-28`}
                style={i === 1 ? { backgroundColor: HILITE } : undefined}
              >
                <div>{COL_HEAD[c].title}</div>
                <div className="text-[8px] font-normal normal-case tracking-normal leading-3 text-slate-400">{COL_HEAD[c].sub}</div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              <td className={slateCell}>{r.label}</td>
              <NumCells vals={r} />
            </tr>
          ))}
          <tr>
            <td className={slateCell} style={{ backgroundColor: LIGHT }}>Sub Total</td>
            <NumCells vals={data.subTotal || empty} />
          </tr>
          <tr>
            <td className={slateCell}>VAT @ 20%</td>
            <NumCells vals={data.vat || empty} />
          </tr>
          <tr>
            <td className={`${slateCell} font-bold border-t-2 border-slate-300`}>Total</td>
            <NumCells vals={data.total || empty} bold topThick />
          </tr>
        </tbody>
      </table>

      <div className="mt-2 text-[10px] leading-4 text-slate-500">
        Highlighted column indicates the applicable ABI GTA rate for settlement within the current period. Valeting fees (not VAT applicable): {gbp(data.valetingFee || 0)}.
      </div>

      <SlateSectionLabel>Settlement Notices</SlateSectionLabel>
      <div className="flex flex-col gap-2">
        <SlateNote title="ABI Insurers">
          Should settlement go beyond 60 days from the date of this payment pack, this will fall outside of the ABI GTA and our Basic Hire Rate will apply. Our file will be passed to solicitors without further notice in order to commence litigation.
        </SlateNote>
        <SlateNote title="Non-ABI Insurers">
          As you do not subscribe to the ABI GTA, our full Basic Hire Rate applies at all times. Settlement should be received strictly within 30 days. Should settlement go beyond 30 days, our file will be passed to solicitors in order to commence litigation.
        </SlateNote>
      </div>

      {/* Cheque + signature */}
      <div className="mt-6 flex justify-between items-end">
        <div className="flex flex-col gap-1">
          <div className="text-[10px] text-slate-500">Please make your cheque payable to:</div>
          <div className="text-[12px] font-weight-600 text-slate-800">Nationwide Assist Ltd</div>
        </div>
        <div className="flex flex-col items-end">
          <div className="text-right text-[10px] text-slate-500">Yours faithfully,</div>
          <div className="pt-1.5 text-right text-[15px] font-bold text-slate-800">{data.signatory || "Nationwide Assist Ltd"}</div>
          <div className="text-right text-[9px] text-slate-400">Nationwide Assist Ltd</div>
        </div>
      </div>
    </SlateShell>
  );
};

export default CoveringLetterDoc;
