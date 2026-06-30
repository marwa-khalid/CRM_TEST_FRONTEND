import { datedLong, cellBase, DocShell, DocHeader, SectionLabel, DocFooter } from "./docHelpers";

// Print/PDF "Front Cover Information" sheet — the cover page of the payment pack.
// Mostly fixed claim-terms text; the meta box is populated from the claim.

export type FrontCoverDocData = {
  ourReference?: string;
  policyNumber?: string;
  yourReference?: string;
  dated?: string; // YYYY-MM-DD
  yourInsured?: string;
  incidentDate?: string; // YYYY-MM-DD
  caseType?: string; // claim type label
};

const FrontCoverInfoDoc = ({ data }: { data: FrontCoverDocData }) => (
  <DocShell>
    <DocHeader ourRef={data.ourReference} yourRef={data.yourReference} dated={datedLong(data.dated)} />

    {/* Title + intro */}
    <div className="self-stretch pt-7">
      <div className="self-stretch pt-3.5 pb-0.5 flex flex-col gap-1.5">
        <div className="text-[10px] uppercase leading-4">CLAIM DOCUMENTATION · COVER SHEET</div>
        <div className="text-base font-bold uppercase leading-5">FRONT COVER INFORMATION</div>
      </div>
      <div className="self-stretch pt-3.5 text-xs leading-4">
        The following documentation is submitted in support of our claim with reference to the matter detailed below. Please review the enclosed schedule in full.
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
                <span className="text-[10px]">Policy Number:</span>
                <span className="text-xs font-bold text-right">{data.policyNumber || "—"}</span>
              </div>
            </td>
          </tr>
          <tr>
            <td className={cellBase}>
              <div className="flex justify-between items-center">
                <span className="text-[10px]">Date of Incident:</span>
                <span className="text-xs font-bold text-right">{datedLong(data.incidentDate)}</span>
              </div>
            </td>
            <td className={cellBase}>
              <div className="flex justify-between items-center">
                <span className="text-[10px]">Case Type:</span>
                <span className="text-xs font-bold text-right">{data.caseType || "—"}</span>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <SectionLabel no="01." title="PAYMENT TERMS" />
    <div className="self-stretch text-xs leading-4">
      Our payment terms are <span className="font-bold">strictly 30 days</span>. The schedule enclosed should be settled within this period to avoid late payment penalties.
    </div>
    <div className="self-stretch flex flex-col gap-2 pt-2">
      <div className="self-stretch px-2 py-1.5 border border-black">
        <div className="text-xs font-bold underline leading-4">Non-ABI GTA Subscribers</div>
        <div className="text-xs leading-4">
          If you do not subscribe to the ABI GTA but would like to take advantage of the discounted rates, we will accept the ABI rate for up to 30 days. Thereafter, payments received between 31–60 days may be settled at the ABI GTA discounted rate, provided all other aspects of the ABI GTA are adhered to — i.e. late payment penalties will apply.
        </div>
      </div>
      <div className="self-stretch px-2 py-1.5 border border-black">
        <div className="text-xs font-bold underline leading-4">ABI GTA Subscribers</div>
        <div className="text-xs leading-4">
          If you subscribe to the ABI GTA and settlement is received later than the stated date, late penalty payments will apply as per the ABI GTA.
        </div>
      </div>
    </div>

    <SectionLabel no="02." title="STATEMENT OF ENQUIRY" />
    <div className="self-stretch pt-1.5">
      <div className="self-stretch px-2 py-1.5 border border-black text-xs leading-4">
        All relevant enquiries have been made in regard to placing our client in a credit hire vehicle. The client has <span className="font-bold">proved his need</span>, we have confirmed their financial position, and we have compared vehicles in this category within the local geographical area.
      </div>
    </div>

    <DocFooter label="Front Cover Information" />
  </DocShell>
);

export default FrontCoverInfoDoc;
