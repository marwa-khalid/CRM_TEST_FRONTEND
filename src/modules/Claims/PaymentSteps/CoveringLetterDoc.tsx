import { m0, datedLong, packCell, packHead, DocShell } from "./docHelpers";

type Col = "bhr" | "abi" | "lpp10" | "lpp20";
const COLS: Col[] = ["bhr", "abi", "lpp10", "lpp20"];
const COL_HEAD: Record<Col, string> = {
  bhr: "BHR Basic Hire Rate",
  abi: "< 30 Days ABI Rate",
  lpp10: "31-60 Days Discounted to: ABI Rate + 10% LPPs",
  lpp20: "61-90 Days Discounted to: ABI Rate + 20% LPPs",
};

export type ColVals = Partial<Record<Col, string | number>>;

export type CoveringLetterDocData = {
  ourReference?: string;
  yourReference?: string;
  dated?: string;
  yourInsured?: string;
  ourClient?: string;
  billTo?: string;
  incidentDate?: string;
  rows?: ({ label: string } & ColVals)[];
  subTotal?: ColVals;
  vat?: ColVals;
  total?: ColVals;
  valetingFee?: number;
  signatory?: string;
};

const NumCells = ({ vals, bold, bg }: { vals: ColVals; bold?: boolean; bg?: string }) => (
  <>
    {COLS.map((col) => (
      <td key={col} className={`${packCell} text-center${bold ? " font-bold" : ""}${bg ? ` ${bg}` : ""}`}>
        {m0(vals[col])}
      </td>
    ))}
  </>
);

const CoveringLetterDoc = ({ data }: { data: CoveringLetterDocData }) => {
  const rows = data.rows || [];
  const empty: ColVals = {};
  const valetingVals = COLS.reduce<ColVals>((acc, col) => {
    acc[col] = data.valetingFee || 0;
    return acc;
  }, {});
  const finalTotal = COLS.reduce<ColVals>((acc, col) => {
    acc[col] = (Number(data.total?.[col]) || 0) + (data.valetingFee || 0);
    return acc;
  }, {});

  return (
    <DocShell>
      <div className="mt-[22px] ml-10 whitespace-pre-line text-[10px] leading-[1.35]">
        {data.billTo || "—"}
      </div>

      <div className="mt-9 ml-10 text-[10px] leading-[1.45]">
        <div className="mb-4">{datedLong(data.dated)}</div>
        <div className="grid grid-cols-[98px_1fr] w-[250px]">
          <span>Your Insured :</span><span>{data.yourInsured || "—"}</span>
          <span>Your Reference:</span><span>{data.yourReference || "—"}</span>
          <span>Our Client:</span><span>{data.ourClient || "—"}</span>
          <span>Our Reference:</span><span>{data.ourReference || "—"}</span>
          <span>Incident Date:</span><span>{datedLong(data.incidentDate)}</span>
        </div>
        <div className="mt-4">Dear Sirs,</div>
        <p className="mt-4">
          We refer to the above incident. We initially advised you of this claim on
        </p>
        <p className="mt-4">
          Please find below details of our Client's credit hire and associated losses of claim,
          with supporting documentation enclosed.
        </p>
        <p className="mt-4 font-bold">The heads of claim consist of the following:-</p>
      </div>

      <table className="mt-3 mx-auto w-[520px] border-collapse table-fixed">
        <thead>
          <tr>
            <th className={`${packHead} w-[32%]`} />
            {COLS.map((col) => (
              <th key={col} className={`${packHead} text-center`}>{COL_HEAD[col]}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index}>
              <td className={`${packCell} bg-[#d9d9d9]`}>{row.label}</td>
              <NumCells vals={row} />
            </tr>
          ))}
          <tr>
            <td className={`${packCell} bg-[#d9d9d9] font-bold`}>Sub Total</td>
            <NumCells vals={data.subTotal || empty} bold bg="bg-[#d9d9d9]" />
          </tr>
          <tr>
            <td className={`${packCell} bg-[#a6a6a6] font-bold`}>VAT</td>
            <NumCells vals={data.vat || empty} bold bg="bg-[#a6a6a6]" />
          </tr>
          <tr>
            <td className={`${packCell} bg-[#a6a6a6] font-bold`}>TOTAL</td>
            <NumCells vals={data.total || empty} bold bg="bg-[#a6a6a6]" />
          </tr>
          <tr>
            <td className={`${packCell} bg-[#d9d9d9] font-bold`}>Valeting Fees Not VAT Applicable</td>
            <NumCells vals={valetingVals} bold />
          </tr>
          <tr>
            <td className={`${packCell} bg-[#a6a6a6] font-bold`}>TOTAL</td>
            <NumCells vals={finalTotal} bold bg="bg-[#a6a6a6]" />
          </tr>
        </tbody>
      </table>

      <div className="ml-10 pt-[110px] w-[520px] text-[10px] leading-[1.45]" style={{ breakBefore: "page", pageBreakBefore: "always" }}>
        <p className="font-bold">
          ABI INSURERS PLEASE NOTE: <span className="font-normal">
            Should settlement go beyond 60 days from the date of this payment pack this will
            fall outside of the ABI GTA and our Basic Hire Rate will apply. Our file will be
            passed to solicitors without any further notices in order to commence litigation.
          </span>
        </p>
        <p className="mt-5 font-bold">
          NON ABI INSURERS PLEASE NOTE: <span className="font-normal">
            As you do not subscribe to the ABI GTA our full Basic Hire Rate applies at all
            times. Settlement should be received strictly within 30 days from the date of this
            payment pack. Should settlement go beyond 30 days from the date of this payment
            pack our file will be passed to solicitors in order to commence litigation.
          </span>
        </p>

        <div className="mt-5 grid grid-cols-[1fr_180px]">
          <div className="font-bold">Please make your cheque payable to:</div>
          <div className="font-bold">Nationwide Assist</div>
        </div>

        <div className="mt-5">Yours faithfully,</div>
        <div className="mt-8 font-bold">{data.signatory || "—"}</div>
        <div className="font-bold">Nationwide Assist Ltd</div>
      </div>
    </DocShell>
  );
};

export default CoveringLetterDoc;
