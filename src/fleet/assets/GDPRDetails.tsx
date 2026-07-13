import React, { useState, useEffect, useCallback, useRef } from "react";
import { FleetSelect, FleetDateField, FleetYesNo, FleetSegmented } from "../../components/fields";
import { getHireAudit } from "../../services/hireService";
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

// Friendly labels for the audit log's "Field Changed" column.
const FIELD_LABELS: Record<string, string> = {
  where_found: "Where Found", privacy_notice_explained: "Privacy Notice Explained",
  privacy_notice_date: "Privacy Notice Date", privacy_notice_method: "Privacy Notice Method",
  lawful_basis: "Lawful Basis", email_consent: "Email Consent", email_consent_date: "Email Consent Date",
  email_consent_method: "Email Consent Method", sms_consent: "SMS Consent", phone_consent: "Phone Consent",
  postal_consent: "Postal Consent", reason_for_withdrawal: "Reason for Withdrawal",
};
const prettyField = (f: string) =>
  FIELD_LABELS[f] || f.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
const prettyValue = (v?: string) => (v && v.length ? v : "—");
const fmtAuditDate = (iso?: string) => {
  if (!iso) return "—";
  const d = new Date(/[zZ]|[+-]\d\d:?\d\d$/.test(iso) ? iso : `${iso}Z`); // Postgres has no Z
  if (Number.isNaN(d.getTime())) return "—";
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${String(d.getFullYear()).slice(2)} ${p(d.getHours())}:${p(d.getMinutes())}`;
};

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
  const [auditRows, setAuditRows] = useState<AuditLogRow[]>([]);
  const { hire, hireId, save } = useHire();
  const hydrated = useRef(false);

  // Pre-fill from the saved hire once (reopen an existing hire / after creation).
  useEffect(() => {
    if (hydrated.current || !hire) return;
    hydrated.current = true;
    setForm({
      whereFound: hire.where_found || "",
      privacyNoticeExplained: hire.privacy_notice_explained || "yes",
      privacyNoticeDate: hire.privacy_notice_date || "",
      privacyNoticeMethod: hire.privacy_notice_method || "",
      lawfulBasis: hire.lawful_basis || "",
      emailConsent: hire.email_consent || "no",
      emailConsentDate: hire.email_consent_date || "",
      emailConsentMethod: hire.email_consent_method || "",
      smsConsent: hire.sms_consent || "no",
      phoneConsent: hire.phone_consent || "no",
      postalConsent: hire.postal_consent || "no",
      reasonForWithdrawal: hire.reason_for_withdrawal || "",
    });
  }, [hire]);

  const refreshAudit = useCallback(() => {
    if (!hireId) return;
    getHireAudit(hireId).then((entries) =>
      setAuditRows(
        entries
          // Only changes to GDPR-screen fields belong in this screen's audit log.
          .filter((e) => e.field_changed in FIELD_LABELS)
          .map((e) => ({
            user: prettyValue(e.user),
            fieldChanged: prettyField(e.field_changed),
            oldValue: prettyValue(e.old_value),
            newValue: prettyValue(e.new_value),
            date: fmtAuditDate(e.changed_at),
          })),
      ),
    );
  }, [hireId]);

  useEffect(() => { refreshAudit(); }, [refreshAudit]);

  // Persist a change, then refresh the audit log once the save has committed.
  const persist = (partial: Record<string, unknown>) => {
    Promise.resolve(save(partial)).then(() => refreshAudit());
  };

  // Every change persists (field-level save, like Claims).
  const set = <K extends keyof GDPRForm>(key: K, value: GDPRForm[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    persist({ [TO_BACKEND[key]]: value });
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
    persist({
      email_consent: "withdrawn",
      sms_consent: "withdrawn",
      phone_consent: "withdrawn",
      postal_consent: "withdrawn",
    });
  };

  return (
    <div className="w-full max-w-[788px] flex flex-col gap-6 font-sans-headline">
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
              onBlur={() => persist({ reason_for_withdrawal: form.reasonForWithdrawal })}
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
          {auditRows.length === 0 ? (
            <div className="px-4 h-12 flex items-center text-neutral-400 text-sm">No changes recorded yet.</div>
          ) : (
            auditRows.map((r, i) => (
              <div key={i} className="grid grid-cols-5 gap-2 px-4 h-12 items-center text-neutral-700 text-sm border-b border-neutral-100 last:border-b-0">
                <span className="truncate">{r.user}</span>
                <span className="truncate">{r.fieldChanged}</span>
                <span className="truncate">{r.oldValue}</span>
                <span className="truncate">{r.newValue}</span>
                <span className="truncate">{r.date}</span>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
};

export default GDPRDetails;
