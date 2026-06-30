import { useEffect, useState } from "react";
import { PackScreen, Section, Text, DateField } from "./paymentPackUi";
import FrontCoverInfoDoc from "./FrontCoverInfoDoc";

// Editable "Payment Pack: Front Cover" screen — the cover-sheet meta fields.
// The body text (payment terms / statement of enquiry) is fixed in the document.

export type FrontCoverPrefill = {
  ourReference?: string;
  yourInsured?: string;
  policyNumber?: string;
  yourReference?: string;
  incidentDate?: string;
  caseType?: string;
  dated?: string;
};

const FrontCoverForm = ({
  prefill = {}, onClose,
}: { prefill?: FrontCoverPrefill; onClose: () => void }) => {
  const [f, setF] = useState({
    ourReference: prefill.ourReference || "",
    yourInsured: prefill.yourInsured || "",
    policyNumber: prefill.policyNumber || "",
    yourReference: prefill.yourReference || "",
    incidentDate: prefill.incidentDate || "",
    caseType: prefill.caseType || "",
  });
  const set = (k: keyof typeof f, v: string) => setF((p) => ({ ...p, [k]: v }));

  // Prefill values are fetched async by the parent — fill any field still empty
  // when they arrive, without clobbering edits the user has already made.
  useEffect(() => {
    setF((prev) => ({
      ourReference: prev.ourReference || prefill.ourReference || "",
      yourInsured: prev.yourInsured || prefill.yourInsured || "",
      policyNumber: prev.policyNumber || prefill.policyNumber || "",
      yourReference: prev.yourReference || prefill.yourReference || "",
      incidentDate: prev.incidentDate || prefill.incidentDate || "",
      caseType: prev.caseType || prefill.caseType || "",
    }));
  }, [
    prefill.ourReference, prefill.yourInsured, prefill.policyNumber,
    prefill.yourReference, prefill.incidentDate, prefill.caseType,
  ]);

  const docNode = (
    <FrontCoverInfoDoc
      data={{
        ourReference: f.ourReference,
        policyNumber: f.policyNumber,
        yourReference: f.yourReference,
        dated: prefill.dated,
        yourInsured: f.yourInsured,
        incidentDate: f.incidentDate,
        caseType: f.caseType,
      }}
    />
  );

  return (
    <PackScreen title="Payment Pack: Front Cover" onClose={onClose} renderDoc={docNode}>
      <Section title="Cover Details">
        <div className="flex gap-5">
          <Text label="Your Insured" value={f.yourInsured} onChange={(v) => set("yourInsured", v)} />
          <Text label="Policy Number" value={f.policyNumber} onChange={(v) => set("policyNumber", v)} />
        </div>
        <div className="flex gap-5">
          <DateField label="Date of Incident" value={f.incidentDate} onChange={(v) => set("incidentDate", v)} />
          <Text label="Your Reference" value={f.yourReference} onChange={(v) => set("yourReference", v)} />
        </div>
        <div className="flex gap-5">
          <Text label="Our Reference" value={f.ourReference} onChange={(v) => set("ourReference", v)} />
          <Text label="Case Type" value={f.caseType} onChange={(v) => set("caseType", v)} placeholder="Claim type" />
        </div>
      </Section>
    </PackScreen>
  );
};

export default FrontCoverForm;
