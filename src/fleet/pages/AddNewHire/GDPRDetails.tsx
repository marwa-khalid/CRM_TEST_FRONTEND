import React, { useState } from "react";
import { FleetSelect, FleetDateField, FleetYesNo, FleetSegmented } from "../../components/fields";
import CloseFileIcon from "../../assets/icons/CloseFile.svg";
import {
  FIND_US_OPTIONS,
  PRIVACY_METHOD_OPTIONS,
  LAWFUL_BASIS_OPTIONS,
  CONSENT_METHOD_OPTIONS,
  CONSENT_STATE_OPTIONS,
  type GDPRForm,
  type AuditLogRow,
} from "../../types/hire";
import { useHire } from "./HireContext";

// Form field -> backend column (fleet_hire).
const TO_BACKEND: Record<keyof GDPRForm, string> = {
  whereFound: "where_found",
  privacyNoticeExplained: "privacy_notice_explained",
  privacyNoticeDate: "privacy_notice_date",
  privacyNoticeMethod: "privacy_notice_method",
  lawfulBasis: "lawful_basis",
  emailConsent: "email_consent",
  emailConsentDate: "email_consent_date",
  emailConsentMethod: "email_consent_method",
  smsConsent: "sms_consent",
  phoneConsent: "phone_consent",
  postalConsent: "postal_consent",
  reasonForWithdrawal: "reason_for_withdrawal",
};

const EMPTY: GDPRForm = {
  whereFound: "",
  privacyNoticeExplained: "yes",
  privacyNoticeDate: "",
  privacyNoticeMethod: "",
  lawfulBasis: "",
  emailConsent: "no",
  emailConsentDate: "",
  emailConsentMethod: "",
  smsConsent: "no",
  phoneConsent: "no",
  postalConsent: "no",
  reasonForWithdrawal: "",
};

// Placeholder audit log until the backend supplies real change history.
const AUDIT_ROWS: AuditLogRow[] = [
  { user: "James Joyce", fieldChanged: "Consent", oldValue: "Yes", newValue: "No", date: "02-22-26" },
  { user: "James Joyce", fieldChanged: "Consent", oldValue: "Yes", newValue: "No", date: "02-22-26" },
];

const ConsentRow: React.FC<{
  label: string;
  value: string;
  onChange: (v: string) => void;
}> = ({ label, value, onChange }) => (
  <div className="flex justify-between items-center gap-4">
    <span className="text-neutral-700 text-base font-semibold">{label}</span>
    <FleetSegmented options={CONSENT_STATE_OPTIONS} value={value} onChange={onChange} />
  </div>
);

const GDPRDetails: React.FC = () => {
  const [form, setForm] = useState<GDPRForm>(EMPTY);
  const { save } = useHire();

  // Every change persists (field-level save, like Claims).
  const set = <K extends keyof GDPRForm>(key: K, value: GDPRForm[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    save({ [TO_BACKEND[key]]: value });
  };

  const allWithdrawn =
    form.emailConsent === "withdrawn" &&
    form.smsConsent === "withdrawn" &&
    form.phoneConsent === "withdrawn" &&
    form.postalConsent === "withdrawn";

  const anyWithdrawn =
    form.emailConsent === "withdrawn" ||
    form.smsConsent === "withdrawn" ||
    form.phoneConsent === "withdrawn" ||
    form.postalConsent === "withdrawn";

  const withdrawAll = () => {
    if (allWithdrawn) return;
    setForm((f) => ({
      ...f,
      emailConsent: "withdrawn",
      smsConsent: "withdrawn",
      phoneConsent: "withdrawn",
      postalConsent: "withdrawn",
    }));
    save({
      email_consent: "withdrawn",
      sms_consent: "withdrawn",
      phone_consent: "withdrawn",
      postal_consent: "withdrawn",
    });
  };

  return (
    <div className="w-full max-w-[788px] flex flex-col gap-6 font-stack">
      <h2 className="text-black text-2xl font-semibold leading-6">GDPR &amp; Marketing Preferences</h2>

      {/* GDPR Transparency */}
      <section className="p-5 rounded-lg outline outline-1 -outline-offset-1 outline-neutral-100 flex flex-col gap-4">
        <h3 className="text-black text-xl font-semibold leading-5">GDPR Transparency</h3>
        <div className="h-px bg-neutral-100" />

        <div className="grid grid-cols-2 gap-5 items-start">
          <FleetSelect
            label="Where Did the Customer Find Us?"
            value={form.whereFound}
            options={FIND_US_OPTIONS}
            onChange={(v) => set("whereFound", v)}
          />
          <div className="flex flex-col gap-3">
            <span className="text-neutral-700 text-sm font-medium">Privacy Notice Explained to Hirer</span>
            <FleetYesNo value={form.privacyNoticeExplained} onChange={(v) => set("privacyNoticeExplained", v)} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-5">
          <FleetDateField label="Privacy Notice Date" value={form.privacyNoticeDate} onChange={(v) => set("privacyNoticeDate", v)} />
          <FleetSelect label="Privacy Notice Method" value={form.privacyNoticeMethod} options={PRIVACY_METHOD_OPTIONS} onChange={(v) => set("privacyNoticeMethod", v)} />
        </div>
        <div className="grid grid-cols-2 gap-5">
          <FleetSelect label="Lawful Basis for Processing" value={form.lawfulBasis} options={LAWFUL_BASIS_OPTIONS} onChange={(v) => set("lawfulBasis", v)} />
          <div />
        </div>
      </section>

      {/* Marketing Preferences */}
      <section className="p-5 rounded-lg outline outline-1 -outline-offset-1 outline-neutral-100 flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <h3 className="text-black text-xl font-semibold leading-5">Marketing Preferences (PECR Compliant)</h3>
          <button
            type="button"
            onClick={withdrawAll}
            disabled={allWithdrawn}
            className={`h-8 px-3 py-2 rounded-sm flex items-center gap-2 text-sm ${
              allWithdrawn ? "bg-neutral-400 text-white cursor-default" : "bg-neutral-900 text-white hover:bg-black"
            }`}
          >
            <img src={CloseFileIcon} alt="" className="w-4 h-4" />
            {allWithdrawn ? "Withdrawn All Consent" : "Withdraw All Marketing Consent"}
          </button>
        </div>
        <div className="h-px bg-neutral-100" />

        <ConsentRow label="Email Marketing Consent" value={form.emailConsent} onChange={(v) => set("emailConsent", v)} />
        {form.emailConsent === "yes" && (
          <div className="grid grid-cols-2 gap-5">
            <FleetDateField label="Consent date" value={form.emailConsentDate} onChange={(v) => set("emailConsentDate", v)} />
            <FleetSelect label="Consent method:" value={form.emailConsentMethod} options={CONSENT_METHOD_OPTIONS} onChange={(v) => set("emailConsentMethod", v)} />
          </div>
        )}

        <div className="h-px bg-neutral-100" />
        <ConsentRow label="SMS Marketing Consent" value={form.smsConsent} onChange={(v) => set("smsConsent", v)} />
        <div className="h-px bg-neutral-100" />
        <ConsentRow label="Phone Marketing Consent" value={form.phoneConsent} onChange={(v) => set("phoneConsent", v)} />
        <div className="h-px bg-neutral-100" />
        <ConsentRow label="Postal Marketing Consent" value={form.postalConsent} onChange={(v) => set("postalConsent", v)} />

        {anyWithdrawn && (
          <div className="flex flex-col gap-2 pt-2">
            <span className="text-neutral-700 text-sm font-medium">Reason for Withdrawal</span>
            <textarea
              value={form.reasonForWithdrawal}
              onChange={(e) => setForm((f) => ({ ...f, reasonForWithdrawal: e.target.value }))}
              onBlur={() => save({ reason_for_withdrawal: form.reasonForWithdrawal })}
              placeholder="Value"
              rows={3}
              className="h-24 px-5 py-4 bg-white rounded-sm outline outline-1 -outline-offset-1 outline-neutral-200 text-base text-neutral-900 placeholder:text-neutral-300 focus:outline-neutral-900 resize-none"
            />
          </div>
        )}
      </section>

      {/* Audit Log */}
      <section className="p-5 rounded-lg outline outline-1 -outline-offset-1 outline-neutral-100 flex flex-col gap-4">
        <h3 className="text-black text-xl font-semibold leading-5">Audit Log</h3>
        <div className="rounded-lg outline outline-1 -outline-offset-1 outline-neutral-100 overflow-hidden">
          <div className="grid grid-cols-5 gap-2 px-4 h-12 items-center text-neutral-900 text-sm font-semibold border-b border-neutral-100">
            <span>USER</span>
            <span>FIELD CHANGED</span>
            <span>OLD VALUE</span>
            <span>NEW VALUE</span>
            <span>DATE</span>
          </div>
          {AUDIT_ROWS.map((r, i) => (
            <div key={i} className="grid grid-cols-5 gap-2 px-4 h-12 items-center text-neutral-700 text-sm border-b border-neutral-100 last:border-b-0">
              <span>{r.user}</span>
              <span>{r.fieldChanged}</span>
              <span>{r.oldValue}</span>
              <span>{r.newValue}</span>
              <span>{r.date}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default GDPRDetails;
