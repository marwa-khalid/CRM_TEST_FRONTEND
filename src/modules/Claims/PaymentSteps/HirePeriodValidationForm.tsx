import { useState } from "react";
import { PackScreen, Section, DateField } from "./paymentPackUi";

// Editable "Payment Pack: Hire Period Validation" screen — a set of key dates
// across the claim lifecycle. All fields are editable date pickers.

export type HirePeriodValidationPrefill = {
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

const HirePeriodValidationForm = ({
  prefill = {}, onClose,
}: { prefill?: HirePeriodValidationPrefill; onClose: () => void }) => {
  const [f, setF] = useState({
    dateNotifiedByInsured: prefill.dateNotifiedByInsured || "",
    dateOfInspection: prefill.dateOfInspection || "",
    dateRepairsAuthorised: prefill.dateRepairsAuthorised || "",
    dateRepairsStarted: prefill.dateRepairsStarted || "",
    dateSatisfactionNoteSigned: prefill.dateSatisfactionNoteSigned || "",
    dateOfSettlementOffer: prefill.dateOfSettlementOffer || "",
    dateOfferAccepted: prefill.dateOfferAccepted || "",
    datePaymentReceived: prefill.datePaymentReceived || "",
    dateCilChequeReceived: prefill.dateCilChequeReceived || "",
  });
  const set = (k: keyof typeof f, v: string) => setF((p) => ({ ...p, [k]: v }));

  return (
    <PackScreen title="Payment Pack: Hire Period Validation" onClose={onClose}>
      <Section title="Notification & Inspection">
        <div className="flex gap-5">
          <DateField label="Date of notification by Insured" value={f.dateNotifiedByInsured} onChange={(v) => set("dateNotifiedByInsured", v)} />
          <DateField label="Date of inspection:" value={f.dateOfInspection} onChange={(v) => set("dateOfInspection", v)} />
        </div>
      </Section>

      <Section title="If Repair Case">
        <div className="flex gap-5">
          <DateField label="Date Repairs Authorised" value={f.dateRepairsAuthorised} onChange={(v) => set("dateRepairsAuthorised", v)} />
          <DateField label="Date Repairs Started" value={f.dateRepairsStarted} onChange={(v) => set("dateRepairsStarted", v)} />
        </div>
        <div className="flex gap-5">
          <DateField label="Date Satisfaction Note Signed" value={f.dateSatisfactionNoteSigned} onChange={(v) => set("dateSatisfactionNoteSigned", v)} />
        </div>
      </Section>

      <Section title="In event of total loss">
        <div className="flex gap-5">
          <DateField label="Date of settlement offer" value={f.dateOfSettlementOffer} onChange={(v) => set("dateOfSettlementOffer", v)} />
          <DateField label="Date offer accepted" value={f.dateOfferAccepted} onChange={(v) => set("dateOfferAccepted", v)} />
        </div>
        <div className="flex gap-5">
          <DateField label="Date payment received" value={f.datePaymentReceived} onChange={(v) => set("datePaymentReceived", v)} />
        </div>
      </Section>

      <Section title="If CIL requested">
        <div className="flex gap-5">
          <DateField label="Date CIL cheque received" value={f.dateCilChequeReceived} onChange={(v) => set("dateCilChequeReceived", v)} />
        </div>
      </Section>
    </PackScreen>
  );
};

export default HirePeriodValidationForm;
