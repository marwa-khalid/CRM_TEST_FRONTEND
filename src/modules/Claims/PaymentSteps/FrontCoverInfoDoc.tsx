import { datedLong } from "./docHelpers";
import { SlateShell, SlateSectionLabel, SlateMeta, SlateNote } from "./slateDoc";

// Print/PDF "Front Cover Information" sheet (Slate design) — the cover page of
// the payment pack. Mostly fixed claim-terms text; the meta grid is populated
// from the claim.

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
  <SlateShell title="Cover" titleSub="Claim Documentation" footerLabel="Front Cover Information">
    {/* Intro */}
    <div className="mt-6 text-[11px] leading-5 text-slate-600">
      The following documentation is submitted in support of our claim with reference to the matter detailed below. Please review the enclosed schedule in full.
    </div>

    {/* Meta grid */}
    <div className="mt-6 grid grid-cols-4 gap-6">
      <SlateMeta label="Your Insured" value={data.yourInsured || "—"} />
      <SlateMeta label="Policy Number" value={data.policyNumber || "—"} />
      <SlateMeta label="Date of Incident" value={datedLong(data.incidentDate)} />
      <SlateMeta label="Case Type" value={data.caseType || "—"} />
    </div>

    <SlateSectionLabel>Payment Terms</SlateSectionLabel>
    <div className="text-[11px] leading-5 text-slate-600">
      Our payment terms are <span className="font-bold text-slate-700">strictly 30 days</span>. The schedule enclosed should be settled within this period to avoid late payment penalties.
    </div>
    <div className="mt-3 flex flex-col gap-2">
      <SlateNote title="Non-ABI GTA Subscribers">
        If you do not subscribe to the ABI GTA but would like to take advantage of the discounted rates, we will accept the ABI rate for up to 30 days. Thereafter, payments received between 31–60 days may be settled at the ABI GTA discounted rate, provided all other aspects of the ABI GTA are adhered to — i.e. late payment penalties will apply.
      </SlateNote>
      <SlateNote title="ABI GTA Subscribers">
        If you subscribe to the ABI GTA and settlement is received later than the stated date, late penalty payments will apply as per the ABI GTA.
      </SlateNote>
    </div>

    <SlateSectionLabel>Statement of Enquiry</SlateSectionLabel>
    <SlateNote>
      All relevant enquiries have been made in regard to placing our client in a credit hire vehicle. The client has <span className="font-bold text-slate-700">proved his need</span>, we have confirmed their financial position, and we have compared vehicles in this category within the local geographical area.
    </SlateNote>
  </SlateShell>
);

export default FrontCoverInfoDoc;
