import { shortSlash, DocShell } from "./docHelpers";

export type HirePeriodValidationDocData = {
  ourReference?: string;
  yourReference?: string;
  dated?: string;
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

const DateRow = ({ label, value, indent = false }: { label: string; value?: string; indent?: boolean }) => (
  <div className={`grid grid-cols-[260px_1fr] text-[10px] leading-[1.8] ${indent ? "ml-16" : ""}`}>
    <div>{indent ? "- " : ""}{label}</div>
    <div>{value ? shortSlash(value) : ""}</div>
  </div>
);

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <div className="mt-5 mb-1 text-[10px] underline">{children}</div>
);

const HirePeriodValidationDoc = ({ data }: { data: HirePeriodValidationDocData }) => (
  <DocShell>
    <div className="mt-[30px] text-center text-[12px] font-bold tracking-wide">
      HIRE PERIOD VALIDATION FORM
    </div>

    <div className="mt-14 ml-1 w-[560px] text-[10px] leading-[1.8]">
      <DateRow label="Date of notification by Insured:" value={data.dateNotifiedByInsured} />
      <DateRow label="Date of inspection:" value={data.dateOfInspection} />

      <SectionTitle>If repair case</SectionTitle>
      <DateRow label="Date Repairs Authorised:" value={data.dateRepairsAuthorised} indent />
      <DateRow label="Date Repairs Started:" value={data.dateRepairsStarted} indent />
      <DateRow label="Date Satisfaction Note Signed:" value={data.dateSatisfactionNoteSigned} indent />

      <SectionTitle>In event of total loss</SectionTitle>
      <DateRow label="Date of settlement offer:" value={data.dateOfSettlementOffer} indent />
      <DateRow label="Date offer accepted:" value={data.dateOfferAccepted} indent />
      <DateRow label="Date cheque received:" value={data.datePaymentReceived} indent />

      <SectionTitle>If CIL requested</SectionTitle>
      <DateRow label="Date CIL cheque received:" value={data.dateCilChequeReceived} indent />

      <p className="mt-7">
        (Attached - copy estimate or agreed labour figure or, if not available, telephone
        contact details for garage)
      </p>

      <p className="mt-8">If applicable – explanation for delays</p>
    </div>
  </DocShell>
);

export default HirePeriodValidationDoc;
