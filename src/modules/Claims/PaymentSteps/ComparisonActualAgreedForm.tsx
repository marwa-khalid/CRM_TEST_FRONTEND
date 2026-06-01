import React, { useEffect, useMemo, useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { toast } from "react-toastify";
import {
  getComparisonSettlement,
  saveComparisonSettlement,
} from "../../../services/ComparisonSettlement/ComparisonSettlement";
import { getHireRecords } from "../../../services/HireDetail/HireDetails";
import { getStorageRecoveryProvider } from "../../../services/StorageRecovery/StorageRecovery";
import { gettingEnginerDetails } from "../../../services/EngineeringDetails/engineeringDetails";
import { getPlatingCharges } from "../../../services/PlatingCharges/PlatingCharges";
import { getRepairData } from "../../../services/RepairAndCost/RepairAndCost";

// ─── helpers ────────────────────────────────────────────────────────────────

const toF = (v: any): number => parseFloat(String(v ?? 0)) || 0;

function fmt(n: number): string {
  return n.toFixed(2);
}

function fmtPct(n: number): string {
  return n.toFixed(2) + "%";
}

// ─── sub-components ─────────────────────────────────────────────────────────

interface ReadFieldProps {
  label: string;
  value: number;
}

const ReadField: React.FC<ReadFieldProps> = ({ label, value }) => (
  <div className="flex flex-col gap-2 w-full">
    <label className="text-neutral-700 text-sm font-weight-500 font-['Stack_Sans_Headline']">
      {label}
    </label>
    <div className="h-[52px] px-5 bg-white border border-neutral-200 rounded flex items-center gap-2">
      <span className="text-neutral-500 text-base font-light leading-4">£</span>
      <span className="text-neutral-500 text-base font-light leading-4">{fmt(value)}</span>
    </div>
  </div>
);

interface EditFieldProps {
  label: string;
  name: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
}

const EditField: React.FC<EditFieldProps> = ({ label, name, value, onChange, placeholder }) => (
  <div className="flex flex-col gap-2 w-full">
    <label className="text-neutral-700 text-sm font-weight-500 font-['Stack_Sans_Headline']">
      {label}
    </label>
    <div className="h-[52px] px-5 bg-white border border-neutral-200 rounded flex items-center gap-2 focus-within:border-blue-500">
      <span className="text-neutral-300 text-base font-light leading-4 select-none">£</span>
      <input
        type="number"
        step="0.01"
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder ?? "0.00"}
        className="flex-1 bg-transparent outline-none text-base text-neutral-700 font-light leading-4"
      />
    </div>
  </div>
);

interface TableRowProps {
  label: string;
  actual: number;
  agreed: number;
  isTotal?: boolean;
}

const TableRow: React.FC<TableRowProps> = ({ label, actual, agreed, isTotal }) => {
  const diff = agreed - actual;
  const diffPct = actual !== 0 ? (diff / actual) * 100 : 0;
  const textCls = isTotal
    ? "text-sm font-weight-600 text-neutral-700"
    : "text-sm font-weight-400 text-neutral-700";

  return (
    <div className={`self-stretch h-12 px-4 inline-flex items-center gap-2 ${isTotal ? "bg-blue-100" : ""}`}>
      <div className={`w-32 ${textCls}`}>{label}</div>
      <div className="w-40 text-sm font-weight-600 text-neutral-700">{fmt(actual)}</div>
      <div className="w-44 text-sm font-weight-600 text-neutral-700">{fmt(agreed)}</div>
      <div className="w-24 text-sm font-weight-600 text-neutral-700">{fmt(Math.abs(diff))}</div>
      <div className="w-28 text-sm font-weight-600 text-neutral-700">{fmtPct(Math.abs(diffPct))}</div>
    </div>
  );
};

// ─── constants ───────────────────────────────────────────────────────────────

const SETTLEMENT_STATUSES = [
  "Awaiting Review",
  "CI or Reference Losses Outstanding",
  "Disputed",
  "Further Info or Documents Requested",
  "Settlement Agreed – Awaiting Receipt of Payment",
  "Settlement Offer Received – Counteroffer put to TPI",
  "Settlement Offer Received – Not yet reviewed or responded",
  "Solicitors Case",
];

const RATE_BANDS = [
  { pct: "10", label: "10%", range: "0–31 days" },
  { pct: "15", label: "15%", range: "31–60 days" },
  { pct: "20", label: "20%", range: "60-90 days" },
  { pct: "35", label: "35%", range: "90+ days" },
];

interface SystemValues {
  hire_days: number;
  hire_rate_per_day: number;
  hire_costs: number;
  admin_fee: number;
  storage: number;
  storage_days: number;
  storage_rate_per_day: number;
  repair: number;
  recovery: number;
  plating: number;
  engineer_fee: number;
  cdw: number;
  cdw_days: number;
  cd_fee: number;
}

const EMPTY_SYSTEM: SystemValues = {
  hire_days: 0,
  hire_rate_per_day: 0,
  hire_costs: 0,
  admin_fee: 0,
  storage: 0,
  storage_days: 0,
  storage_rate_per_day: 0,
  repair: 0,
  recovery: 0,
  plating: 0,
  engineer_fee: 0,
  cdw: 0,
  cdw_days: 0,
  cd_fee: 0,
};

// ─── main component ──────────────────────────────────────────────────────────

const ComparisonActualAgreedForm = ({ paymentFormRef, claimId }: any) => {
  const [system, setSystem] = useState<SystemValues>(EMPTY_SYSTEM);
  const [statusOpen, setStatusOpen] = useState(false);

  const formik = useFormik({
    initialValues: {
      settlement_status: "",
      abi_rate_band: "10",
      agreed_hire_days: "" as string | number,
      agreed_hire_rate: "" as string | number,
      agreed_storage_days: "" as string | number,
      agreed_storage_rate: "" as string | number,
      agreed_cdw_days: "" as string | number,
      agreed_cdw_rate: "" as string | number,
      agreed_additional_fees: "" as string | number,
      agreed_penalties: "" as string | number,
      vat_recovered: null as boolean | null,
      reason_for_reduction: "",
    },
    validationSchema: Yup.object({
      reason_for_reduction: Yup.string().required("Reason is required"),
    }),
    onSubmit: async (values) => {
      if (!claimId) return;
      try {
        await saveComparisonSettlement({
          claim_id: Number(claimId),
          settlement_status: values.settlement_status || null,
          abi_rate_band: values.abi_rate_band || null,
          agreed_hire_days: values.agreed_hire_days !== "" ? Number(values.agreed_hire_days) : null,
          agreed_hire_rate: values.agreed_hire_rate !== "" ? Number(values.agreed_hire_rate) : null,
          agreed_storage_days: values.agreed_storage_days !== "" ? Number(values.agreed_storage_days) : null,
          agreed_storage_rate: values.agreed_storage_rate !== "" ? Number(values.agreed_storage_rate) : null,
          agreed_cdw_days: values.agreed_cdw_days !== "" ? Number(values.agreed_cdw_days) : null,
          agreed_cdw_rate: values.agreed_cdw_rate !== "" ? Number(values.agreed_cdw_rate) : null,
          agreed_additional_fees: values.agreed_additional_fees !== "" ? Number(values.agreed_additional_fees) : null,
          agreed_penalties: values.agreed_penalties !== "" ? Number(values.agreed_penalties) : null,
          vat_recovered: values.vat_recovered,
          reason_for_reduction: values.reason_for_reduction || null,
        });
        toast.success("Comparison settlement saved");
      } catch {
        toast.error("Failed to save");
        throw new Error("save failed");
      }
    },
  });

  useEffect(() => {
    if (paymentFormRef) paymentFormRef.current = formik;
  }, [formik]);

  // Load saved form data
  useEffect(() => {
    if (!claimId) return;
    getComparisonSettlement(claimId)
      .then(({ data }: any) => {
        const s = data?.saved;
        if (!s) return;
        formik.setValues({
          settlement_status: s.settlement_status ?? "",
          abi_rate_band: s.abi_rate_band ?? "10",
          agreed_hire_days: s.agreed_hire_days ?? "",
          agreed_hire_rate: s.agreed_hire_rate ?? "",
          agreed_storage_days: s.agreed_storage_days ?? "",
          agreed_storage_rate: s.agreed_storage_rate ?? "",
          agreed_cdw_days: s.agreed_cdw_days ?? "",
          agreed_cdw_rate: s.agreed_cdw_rate ?? "",
          agreed_additional_fees: s.agreed_additional_fees ?? "",
          agreed_penalties: s.agreed_penalties ?? "",
          vat_recovered: s.vat_recovered ?? null,
          reason_for_reduction: s.reason_for_reduction ?? "",
        });
      })
      .catch(() => {});
  }, [claimId]);

  // Load system values from each source screen (mirrors ABI&BHR approach)
  useEffect(() => {
    if (!claimId) return;

    // Hire costs, admin fee, CDW, C&D fee, hire days/rate
    getHireRecords(claimId)
      .then(({ data }: any) => {
        const records: any[] = Array.isArray(data) ? data : [];
        const first = records[0];
        if (!first) return;
        const days = toF(first.final_total_no_of_hire_days ?? first.no_of_days_hire_so_far);
        const rate = toF(first.abi_hire_charge_per_day);
        setSystem((prev) => ({
          ...prev,
          hire_days: days,
          hire_rate_per_day: rate,
          hire_costs: days * rate,
          admin_fee: toF(first.abi_administration_fee),
          cdw: toF(first.cdw_charges),
          cdw_days: days,
          cd_fee: toF(first.collection_delivery_fee),
        }));
      })
      .catch(() => {});

    // Storage and recovery
    getStorageRecoveryProvider(claimId)
      .then(({ data }: any) => {
        const storages: any[] = data?.storages ?? [];
        const recoveries: any[] = data?.recoveries ?? [];
        const totalStorage = storages.reduce((s: number, r: any) => s + toF(r.total_storage_charges), 0);
        const storageDays = storages.reduce((s: number, r: any) => s + toF(r.total_storage_days), 0);
        const totalRecovery = recoveries.reduce((s: number, r: any) => s + toF(r.recovery_charges), 0);
        setSystem((prev) => ({
          ...prev,
          storage: totalStorage,
          storage_days: storageDays,
          storage_rate_per_day: storageDays > 0 ? totalStorage / storageDays : 0,
          recovery: totalRecovery,
        }));
      })
      .catch(() => {});

    // Engineer fee
    gettingEnginerDetails(claimId)
      .then((data: any) => {
        setSystem((prev) => ({
          ...prev,
          engineer_fee: toF(data?.engineer_fee ?? data?.actual_fee),
        }));
      })
      .catch(() => {});

    // Plating
    getPlatingCharges(claimId)
      .then(({ data }: any) => {
        setSystem((prev) => ({
          ...prev,
          plating: toF(data?.total_plating_cost),
        }));
      })
      .catch(() => {});

    // Repair (total_inc_vat from route_repairs)
    getRepairData(claimId)
      .then((data: any) => {
        setSystem((prev) => ({
          ...prev,
          repair: toF(data?.total_inc_vat),
        }));
      })
      .catch(() => {});
  }, [claimId]);

  // ─── computed values ──────────────────────────────────────────────────────

  const rateMult = useMemo(
    () => 1 + toF(formik.values.abi_rate_band) / 100,
    [formik.values.abi_rate_band]
  );

  // Actual (system) line items
  const actualHire = system.hire_costs;
  const actualAdmin = system.admin_fee;
  const actualStorage = system.storage;
  const actualRepair = system.repair;
  const actualRecovery = system.recovery;
  const actualPlating = system.plating;
  const actualEngineer = system.engineer_fee;
  const actualCdw = system.cdw;
  const actualCdFee = system.cd_fee;

  const actualExclVAT =
    actualHire + actualAdmin + actualStorage + actualRepair + actualRecovery +
    actualPlating + actualEngineer + actualCdw + actualCdFee;
  const actualVAT = actualExclVAT * 0.2;
  const actualInclVAT = actualExclVAT + actualVAT;

  // Agreed line items
  const agreedHireDays =
    formik.values.agreed_hire_days !== "" ? toF(formik.values.agreed_hire_days) : system.hire_days;
  const agreedHireRate =
    formik.values.agreed_hire_rate !== "" ? toF(formik.values.agreed_hire_rate) : system.hire_rate_per_day;
  const agreedHire = agreedHireDays * agreedHireRate * rateMult;

  const hasStorageAdj =
    formik.values.agreed_storage_days !== "" || formik.values.agreed_storage_rate !== "";
  const agreedStorageDays =
    formik.values.agreed_storage_days !== "" ? toF(formik.values.agreed_storage_days) : system.storage_days;
  const agreedStorageRate =
    formik.values.agreed_storage_rate !== "" ? toF(formik.values.agreed_storage_rate) : system.storage_rate_per_day;
  const agreedStorage = hasStorageAdj
    ? agreedStorageDays * agreedStorageRate * rateMult
    : actualStorage * rateMult;

  const hasCdwAdj =
    formik.values.agreed_cdw_days !== "" || formik.values.agreed_cdw_rate !== "";
  const agreedCdwDays =
    formik.values.agreed_cdw_days !== "" ? toF(formik.values.agreed_cdw_days) : system.cdw_days;
  const cdwRatePerDay = system.cdw_days > 0 ? system.cdw / system.cdw_days : 0;
  const agreedCdwRate =
    formik.values.agreed_cdw_rate !== "" ? toF(formik.values.agreed_cdw_rate) : cdwRatePerDay;
  const agreedCdw = hasCdwAdj
    ? agreedCdwDays * agreedCdwRate * rateMult
    : actualCdw * rateMult;

  const agreedAdmin = actualAdmin * rateMult;
  const agreedRepair = actualRepair * rateMult;
  const agreedRecovery = actualRecovery * rateMult;
  const agreedPlating = actualPlating * rateMult;
  const agreedEngineer = actualEngineer * rateMult;
  const agreedCdFee = actualCdFee * rateMult;
  const agreedAdditional = toF(formik.values.agreed_additional_fees) * rateMult;
  const agreedPenalties = toF(formik.values.agreed_penalties);

  const agreedExclVAT =
    agreedHire + agreedAdmin + agreedStorage + agreedRepair + agreedRecovery +
    agreedPlating + agreedEngineer + agreedCdw + agreedCdFee + agreedAdditional + agreedPenalties;
  const agreedVAT = agreedExclVAT * 0.2;
  const agreedInclVAT = agreedExclVAT + agreedVAT;

  // Summary
  const totalDiff = agreedInclVAT - actualInclVAT;
  const overallPct = actualInclVAT > 0 ? (totalDiff / actualInclVAT) * 100 : 0;
  const reductionInHireDays = system.hire_days - agreedHireDays;

  // ─── render ───────────────────────────────────────────────────────────────

  const divider = <div className="self-stretch h-px bg-neutral-100" />;

  return (
    <div className="w-full mt-3 flex flex-col gap-6 font-['Stack_Sans_Headline']">
      <h1 className="text-black text-2xl font-weight-600 leading-6">
        Comparison - Actual &amp; Agreed Settlement
      </h1>

      {/* ── Section 1: Settlement Status ── */}
      <section className="self-stretch p-5 rounded-lg border border-neutral-100 flex flex-col gap-4">
        <h2 className="text-black text-xl font-weight-600 leading-5">Settlement Status</h2>
        {divider}
        <div className="relative w-96">
          <label className="block text-neutral-700 text-sm font-weight-500 mb-2">Status</label>
          <div
            onClick={() => setStatusOpen((o) => !o)}
            className="h-[52px] px-5 bg-white border border-neutral-200 rounded flex items-center justify-between cursor-pointer"
          >
            <span className={formik.values.settlement_status ? "text-neutral-700 text-base font-light" : "text-neutral-300 text-base font-light"}>
              {formik.values.settlement_status || "Select Status"}
            </span>
            <svg width="12" height="6" viewBox="0 0 12 6" fill="none">
              <path d="M1 1L6 5L11 1" stroke="#0352FD" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
          {statusOpen && (
            <div className="absolute top-full left-0 right-0 z-50 bg-white border border-neutral-200 rounded shadow-lg mt-1">
              {SETTLEMENT_STATUSES.map((s) => (
                <div
                  key={s}
                  onClick={() => {
                    formik.setFieldValue("settlement_status", s);
                    setStatusOpen(false);
                  }}
                  className={`px-5 py-3 text-sm cursor-pointer hover:bg-blue-100 ${
                    formik.values.settlement_status === s ? "bg-blue-100 font-weight-500" : "text-neutral-700"
                  }`}
                >
                  {s}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── Section 2: System Calculated Settlement ── */}
      <section className="self-stretch p-5 rounded-lg border border-neutral-100 flex flex-col gap-4">
        <h2 className="text-black text-xl font-weight-600 leading-5">System Calculated Settlement</h2>
        <div className="flex flex-col gap-4">
          {divider}
          <div className="grid grid-cols-2 gap-5">
            <ReadField label="Hire Costs" value={actualHire} />
            <ReadField label="Admin Fee" value={actualAdmin} />
          </div>
          <div className="grid grid-cols-2 gap-5">
            <ReadField label="Storage" value={actualStorage} />
            <ReadField label="Repair" value={actualRepair} />
          </div>
          <div className="grid grid-cols-2 gap-5">
            <ReadField label="Recovery" value={actualRecovery} />
            <ReadField label="Plating" value={actualPlating} />
          </div>
          <div className="grid grid-cols-2 gap-5">
            <ReadField label="Engineer Fee" value={actualEngineer} />
            <ReadField label="CDW" value={actualCdw} />
          </div>
          <div className="grid grid-cols-2 gap-5">
            <ReadField label="C &amp; D Fee" value={actualCdFee} />
          </div>
          {/* System Totals */}
          <div className="p-4 bg-blue-100 rounded-lg flex flex-col gap-2">
            <span className="text-black text-base font-weight-600">Totals</span>
            <div className="h-px bg-blue-200" />
            <p className="text-base">
              <span className="text-neutral-700 font-weight-400">Total (Excl. VAT) </span>
              <span className="text-neutral-700 font-weight-600">– £{fmt(actualExclVAT)}</span>
            </p>
            <p className="text-base">
              <span className="text-neutral-700 font-weight-400">VAT (20%) </span>
              <span className="text-neutral-700 font-weight-600">– £{fmt(actualVAT)}</span>
            </p>
            <p className="text-base">
              <span className="text-neutral-700 font-weight-400">Total Actual Settlement (Incl. VAT) </span>
              <span className="text-neutral-700 font-weight-600">– £{fmt(actualInclVAT)}</span>
            </p>
          </div>
        </div>
      </section>

      {/* ── Section 3: Manual-ABI Based Calculated Settlement ── */}
      <section className="self-stretch p-5 rounded-lg border border-neutral-100 flex flex-col gap-4">
        <h2 className="text-black text-xl font-weight-600 leading-5">
          Manual-ABI Based Calculated Settlement
        </h2>
        {/* Rate band cards */}
        <div className="flex gap-5">
          {RATE_BANDS.map((band) => {
            const selected = formik.values.abi_rate_band === band.pct;
            return (
              <button
                key={band.pct}
                type="button"
                onClick={() => formik.setFieldValue("abi_rate_band", band.pct)}
                className={`w-44 p-5 rounded-lg border border-blue-200 flex flex-col gap-1 text-left transition-colors ${
                  selected ? "bg-blue-100" : "bg-white"
                }`}
              >
                <span className="text-neutral-900 text-xl font-weight-600 leading-5">{band.label}</span>
                <span className="text-neutral-700 text-sm font-weight-500">
                  Paid between <br /> {band.range}
                </span>
              </button>
            );
          })}
        </div>
        {divider}
        <div className="grid grid-cols-2 gap-5">
          <EditField
            label="Hire Days (if adjusted)"
            name="agreed_hire_days"
            value={formik.values.agreed_hire_days}
            onChange={formik.handleChange}
            placeholder="Days"
          />
          <EditField
            label="Hire Rate (if adjusted)"
            name="agreed_hire_rate"
            value={formik.values.agreed_hire_rate}
            onChange={formik.handleChange}
            placeholder="Rate per day"
          />
        </div>
        <div className="grid grid-cols-2 gap-5">
          <EditField
            label="Storage Days (if adjusted)"
            name="agreed_storage_days"
            value={formik.values.agreed_storage_days}
            onChange={formik.handleChange}
            placeholder="Days"
          />
          <EditField
            label="Storage Rate (if adjusted)"
            name="agreed_storage_rate"
            value={formik.values.agreed_storage_rate}
            onChange={formik.handleChange}
            placeholder="Rate per day"
          />
        </div>
        <div className="grid grid-cols-2 gap-5">
          <EditField
            label="CDW Days (if adjusted)"
            name="agreed_cdw_days"
            value={formik.values.agreed_cdw_days}
            onChange={formik.handleChange}
            placeholder="Days"
          />
          <EditField
            label="CDW Rate (if adjusted)"
            name="agreed_cdw_rate"
            value={formik.values.agreed_cdw_rate}
            onChange={formik.handleChange}
            placeholder="Rate per day"
          />
        </div>
        <div className="grid grid-cols-2 gap-5">
          <EditField
            label="Additional Fees &amp; Charges (as applicable)"
            name="agreed_additional_fees"
            value={formik.values.agreed_additional_fees}
            onChange={formik.handleChange}
          />
          <EditField
            label="Penalties"
            name="agreed_penalties"
            value={formik.values.agreed_penalties}
            onChange={formik.handleChange}
          />
        </div>
        {/* VAT Recovered */}
        <div className="flex flex-col gap-2">
            <span className="text-black text-sm font-weight-500">VAT Recovered ?</span>
            <div className="flex gap-5 mt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <div className="relative w-5 h-5">
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      formik.values.vat_recovered === true
                        ? "border-blue-300 bg-blue-200"
                        : "border-neutral-300 bg-white"
                    }`}
                    onClick={() => formik.setFieldValue("vat_recovered", true)}
                  >
                    {formik.values.vat_recovered === true && (
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                    )}
                  </div>
                </div>
                <span className="text-black text-sm font-weight-400">Yes</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <div className="relative w-5 h-5">
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      formik.values.vat_recovered === false
                        ? "border-blue-300 bg-blue-200"
                        : "border-neutral-300 bg-white"
                    }`}
                    onClick={() => formik.setFieldValue("vat_recovered", false)}
                  >
                    {formik.values.vat_recovered === false && (
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                    )}
                  </div>
                </div>
                <span className="text-black text-sm font-weight-400">No</span>
              </label>
            </div>
          </div>
        {/* Agreed Totals */}
        <div className="p-4 bg-blue-100 rounded-lg flex flex-col gap-2">
          <span className="text-black text-base font-weight-600">Totals</span>
          <div className="h-px bg-blue-200" />
          <p className="text-base">
            <span className="text-neutral-700 font-weight-400">Total (Excl. VAT) </span>
            <span className="text-neutral-700 font-weight-600">– £{fmt(agreedExclVAT)}</span>
          </p>
          <p className="text-base">
            <span className="text-neutral-700 font-weight-400">VAT (20%) </span>
            <span className="text-neutral-700 font-weight-600">– £{fmt(agreedVAT)}</span>
          </p>
          <p className="text-base">
            <span className="text-neutral-700 font-weight-400">Total Agreed Settlement (Incl. VAT) </span>
            <span className="text-neutral-700 font-weight-600">– £{fmt(agreedInclVAT)}</span>
          </p>
        </div>
      </section>

      {/* ── Section 4: Comparison View (Bird's-Eye View) ── */}
      <section className="self-stretch p-5 rounded-lg border border-neutral-100 flex flex-col gap-4">
        <h2 className="text-black text-xl font-weight-600 leading-5">
          Comparison View (Bird's-Eye View)
        </h2>
        {divider}
        <div className="rounded-lg border border-neutral-100 overflow-hidden">
          {/* Header */}
          <div className="h-12 px-4 inline-flex items-center gap-2 w-full bg-white">
            <div className="w-32 text-sm font-weight-600 text-black">CHARGE TYPE</div>
            <div className="w-40 text-sm font-weight-600 text-black">ACTUAL (SYSTEM-AUTO)</div>
            <div className="w-44 text-sm font-weight-600 text-black leading-tight">
              AGREED (MANUAL-ABI)
              <span className="text-xs font-weight-400"> {formik.values.abi_rate_band}% ADD. CHARGES</span>
            </div>
            <div className="w-24 text-sm font-weight-600 text-black">DIFFERENCE</div>
            <div className="w-28 text-sm font-weight-600 text-black">DIFF %</div>
          </div>
          <div className="h-px bg-neutral-100" />
          <TableRow label="Hire Costs" actual={actualHire} agreed={agreedHire} />
          <div className="h-px bg-neutral-100" />
          <TableRow label="Admin Fee" actual={actualAdmin} agreed={agreedAdmin} />
          <div className="h-px bg-neutral-100" />
          <TableRow label="Storage" actual={actualStorage} agreed={agreedStorage} />
          <div className="h-px bg-neutral-100" />
          <TableRow label="Repair" actual={actualRepair} agreed={agreedRepair} />
          <div className="h-px bg-neutral-100" />
          <TableRow label="Recovery" actual={actualRecovery} agreed={agreedRecovery} />
          <div className="h-px bg-neutral-100" />
          <TableRow label="Plating" actual={actualPlating} agreed={agreedPlating} />
          <div className="h-px bg-neutral-100" />
          <TableRow label="Engineer Fee" actual={actualEngineer} agreed={agreedEngineer} />
          <div className="h-px bg-neutral-100" />
          <TableRow label="CDW" actual={actualCdw} agreed={agreedCdw} />
          <div className="h-px bg-neutral-100" />
          <TableRow label="C &amp; D Fee" actual={actualCdFee} agreed={agreedCdFee} />
          <div className="h-px bg-neutral-100" />
          {/* Totals rows with blue bg */}
          <TableRow label="Total (Excl. VAT)" actual={actualExclVAT} agreed={agreedExclVAT} isTotal />
          <div className="h-px bg-blue-200" />
          <TableRow label="VAT (20%)" actual={actualVAT} agreed={agreedVAT} isTotal />
          <div className="h-px bg-blue-200" />
          <TableRow label="Total (Incl. VAT)" actual={actualInclVAT} agreed={agreedInclVAT} isTotal />
        </div>
      </section>

      {/* ── Section 5: Summary ── */}
      <section className="self-stretch p-5 rounded-lg border border-neutral-100 flex flex-col gap-4">
        <h2 className="text-black text-xl font-weight-600 leading-5">Summary</h2>
        {divider}
        <p className="text-sm">
          <span className="text-black font-weight-400">Total Reduction / Increase Amount:  </span>
          <span className="text-black text-base font-weight-600">
            {totalDiff >= 0
              ? `Increase by ${fmt(totalDiff)}`
              : `Reduction by ${fmt(Math.abs(totalDiff))}`}
          </span>
        </p>
        <p className="text-sm">
          <span className="text-black font-weight-400">Reduction in Hire Days:  </span>
          <span className="text-black text-base font-weight-600">
            {reductionInHireDays >= 0
              ? `${fmt(reductionInHireDays)} days`
              : `Increase by ${fmt(Math.abs(reductionInHireDays))} days`}
          </span>
        </p>
        <p className="text-sm">
          <span className="text-black font-weight-400">Overall % Reduction on Settlement: </span>
          <span className="text-black text-base font-weight-600">{fmtPct(Math.abs(overallPct))}</span>
        </p>
        {divider}
        {/* Reason textarea */}
        <div className="flex flex-col gap-2">
          <label className="text-neutral-700 text-sm font-weight-500">
            Reason for Reduction or Increase
            <span className="text-red-500 ml-1">*</span>
          </label>
          <textarea
            name="reason_for_reduction"
            value={formik.values.reason_for_reduction}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            placeholder="Add Reason"
            rows={4}
            className={`w-full px-5 py-4 bg-white border rounded text-base text-neutral-700 font-light resize-none outline-none focus:border-blue-500 ${
              formik.touched.reason_for_reduction && formik.errors.reason_for_reduction
                ? "border-red-400"
                : "border-neutral-200"
            }`}
          />
          {formik.touched.reason_for_reduction && formik.errors.reason_for_reduction && (
            <span className="text-red-500 text-xs">{formik.errors.reason_for_reduction}</span>
          )}
        </div>
      </section>
    </div>
  );
};

export default ComparisonActualAgreedForm;
