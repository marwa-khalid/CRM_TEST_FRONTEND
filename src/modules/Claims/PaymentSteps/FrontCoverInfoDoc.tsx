import { datedLong, DocShell } from "./docHelpers";

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
    <div className="mt-[22px] w-[520px] text-[10px] leading-[1.45]">
      <div className="mb-3">Your Insured: {data.yourInsured || "—"}</div>
      <div className="mb-3">Your Reference: {data.yourReference || "—"}</div>
      <div className="mb-3">Your Policy Number: {data.policyNumber || "—"}</div>
      <div className="mb-5">Date of Incident: {datedLong(data.incidentDate)}</div>

      <p className="mb-5">
        Please note the following documentation is in support of our claim with reference to
        the above.
      </p>
      <p className="mb-5">Please note our payment terms are strictly 30 days.</p>
      <p className="mb-4 font-bold">
        If you do not subscribe to the ABI GTA but however would like to take advantage of
        the discounted rates then we will accept the ABI rate up to 30 days. Thereafter any
        payments received between 31-60 days can be paid at the ABI GTA discounted rate
        providing all other aspects of the ABI GTA are adhered to i.e. late payment penalties
        will be made.
      </p>
      <p className="mb-4 font-bold">
        If you subscribe to the ABI GTA and settlement is received later than this date, late
        penalty payments will apply as per the ABI GTA.
      </p>
      <p className="font-bold uppercase">
        Please note all relevant enquiries have been made in regards to placing our client
        in a credit hire vehicle. The client has proved his need, we have confirmed their
        financial position, and we have compared vehicles in this category in the local
        geographical area.
      </p>
    </div>
  </DocShell>
);

export default FrontCoverInfoDoc;
