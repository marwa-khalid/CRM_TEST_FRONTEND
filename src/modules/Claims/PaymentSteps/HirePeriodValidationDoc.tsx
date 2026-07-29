import { slash, datedLong, DocShell, DocHeader, SectionLabel, DocFooter } from "./docHelpers";

// Print/PDF document for the Payment Pack "Hire Period Validation" sheet.
// Non-editable A4 render of the form's key dates (figma design). Filled dates
// show DD / MM / YYYY centred (no rule); empty fields show a blank rule.

export type HirePeriodValidationDocData = {
  ourReference?: string;
  yourReference?: string;
  dated?: string; // YYYY-MM-DD
  dateNotifiedByInsured?: string;
  dateOfInspection?: string;
  dateRepairsAuthorised?: string;
  dateRepairsStarted?: string;
  dateSatisfactionNoteSigned?: string;
  dateOfSettlementOffer?: string;
  dateOfferAccepted?: string;
  datePaymentReceived?: string;
  dateCilChequeReceived?: string;
};

// One "label ……… value / blank rule" row.
const Row = ({ label, value }: { label: string; value?: string }) => (
  <div className="self-stretch py-1.5 border-b border-neutral-400 flex justify-between items-end">
    <span className="text-xs leading-4">{label}</span>
    {value ? (
      <div className="min-w-[224px] flex flex-col items-center">
        <span className="text-center text-xs font-bold leading-4">{slash(value)}</span>
      </div>
    ) : (
      <div className="pl-3.5 flex">
        <div className="w-56 h-px border-b border-black" />
      </div>
    )}
  </div>
);

const HirePeriodValidationDoc = ({ data }: { data: HirePeriodValidationDocData }) => (
  <DocShell>
    <DocHeader
      ourRef={data.ourReference}
      yourRef={data.yourReference}
      dated={datedLong(data.dated)}
    />

    {/* Title block */}
    <div className="self-stretch pt-8 flex flex-col">
      <div className="pt-3.5 text-[10px] uppercase leading-4">Validation · Internal Record</div>
      <div className="pt-4 text-base font-bold uppercase leading-5">Hire Period Validation</div>
      <div className="pt-2 text-xs leading-4">
        To be completed in support of the hire claim. Where applicable, attach a copy estimate,
        agreed labour figure, or telephone contact details for the garage. Applies across all
        swapped vehicles in this claim.
      </div>
    </div>

    <SectionLabel no="01." title="Notification & Inspection" />
    <div className="self-stretch flex flex-col">
      <Row label="Date of notification by Insured" value={data.dateNotifiedByInsured} />
      <Row label="Date of inspection" value={data.dateOfInspection} />
    </div>

    <SectionLabel no="02." title="If Repair Case" />
    <div className="self-stretch flex flex-col">
      <Row label="Date repairs authorised" value={data.dateRepairsAuthorised} />
      <Row label="Date repairs started" value={data.dateRepairsStarted} />
      <Row label="Date satisfaction note signed" value={data.dateSatisfactionNoteSigned} />
    </div>

    <SectionLabel no="03." title="In Event of Total Loss" />
    <div className="self-stretch flex flex-col">
      <Row label="Date of settlement offer" value={data.dateOfSettlementOffer} />
      <Row label="Date offer accepted" value={data.dateOfferAccepted} />
      <Row label="Date payment received" value={data.datePaymentReceived} />
    </div>

    <SectionLabel no="04." title="If CIL Requested" />
    <div className="self-stretch flex flex-col">
      <Row label="Date CIL cheque received" value={data.dateCilChequeReceived} />
    </div>

    {/* Attachment required note */}
    <div className="self-stretch pt-6 flex flex-col">
      <div className="self-stretch px-2 py-1.5 outline outline-1 outline-offset-[-1px] outline-black flex flex-col">
        <div className="pb-0.5 text-xs font-bold underline leading-4">Attachment Required</div>
        <div className="text-xs leading-4">
          Please attach a copy estimate or agreed labour figure. If not available, provide
          telephone contact details for the garage.
        </div>
      </div>
    </div>

    <DocFooter label="Hire Period Validation Form" />
  </DocShell>
);

export default HirePeriodValidationDoc;
