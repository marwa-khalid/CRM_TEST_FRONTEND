import React, { useEffect, useMemo, useRef, useState } from "react";
import { useFormik } from "formik";
import { toast } from "react-toastify";
import {
  getComparisonSettlement,
  saveComparisonSettlement,
} from "../../../services/ComparisonSettlement/ComparisonSettlement";
import { getHireRecords } from "../../../services/HireDetail/HireDetails";
import { getStorageRecoveryProvider } from "../../../services/StorageRecovery/StorageRecovery";
import { gettingEnginerDetails } from "../../../services/EngineeringDetails/engineeringDetails";
import { getPlatingTotal, getPlatingCharges } from "../../../services/PlatingCharges/PlatingCharges";
import { getRepairData } from "../../../services/RepairAndCost/RepairAndCost";
import { getHireProvidedVehicles } from "../../../services/Vehicle/vehicle";
import VehicleCards, { type ClaimVehicle } from "./VehicleCards";
import { SpinnerLoader } from "../../../claims/common/SpinnerLoader";

// ─── helpers ────────────────────────────────────────────────────────────────

const toF = (v: any): number => parseFloat(String(v ?? 0)) || 0;

// Round to 2 decimals so totals never carry sub-penny drift and match the pack
const round2 = (n: number): number => Math.round((n + Number.EPSILON) * 100) / 100;

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
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  placeholder?: string;
  noSymbol?: boolean;
}

const EditField: React.FC<EditFieldProps> = ({ label, name, value, onChange, onBlur, placeholder, noSymbol }) => (
  <div className="flex flex-col gap-2 w-full">
    <label className="text-neutral-700 text-sm font-weight-500 font-['Stack_Sans_Headline']">
      {label}
    </label>
    <div className="h-[52px] px-5 bg-white border border-neutral-200 rounded flex items-center gap-2 focus-within:border-blue-500">
      {!noSymbol && <span className="text-neutral-300 text-base font-light leading-4 select-none">£</span>}
      <input
        type="number"
        step="0.01"
        name={name}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={placeholder ?? "0.00"}
        className="flex-1 bg-transparent outline-none text-base text-neutral-700 font-light leading-4"
      />
    </div>
  </div>
);

// Format an input value to 2 decimals (empty stays empty)
const toTwoDecimals = (v: string): string =>
  v === "" || Number.isNaN(Number(v)) ? v : Number(v).toFixed(2);

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
    <div className={`self-stretch h-12 px-4 flex items-center gap-2 ${isTotal ? "bg-blue-100" : ""}`}>
      <div className={`flex-[5] min-w-0 ${textCls}`}>{label}</div>
      <div className="flex-[6] min-w-0 text-sm font-weight-600 text-neutral-700">{fmt(actual)}</div>
      <div className="flex-[6] min-w-0 text-sm font-weight-600 text-neutral-700">{fmt(agreed)}</div>
      <div className="flex-[4] min-w-0 text-sm font-weight-600 text-neutral-700">{fmt(Math.abs(diff))}</div>
      <div className="flex-[6] min-w-0 text-sm font-weight-600 text-neutral-700">{fmtPct(Math.abs(diffPct))}</div>
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
  { pct: "0", label: "Base ABI", range: "0–31 days" },
  { pct: "10", label: "10%", range: "31–60 days" },
  { pct: "20", label: "20%", range: "60-90 days" },
  { pct: "35", label: "35%", range: "90 days" },
];

interface SystemValues {
  hire_days: number;
  hire_rate_per_day: number;
  extra_charges_per_day: number;
  hire_costs: number;
  admin_fee: number;
  bhr_admin_fee: number;
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
  extra_charges_per_day: 0,
  hire_costs: 0,
  admin_fee: 0,
  bhr_admin_fee: 0,
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
  const [loading, setLoading] = useState(true);
  // Hire vehicle switcher cards (between Settlement Status and System Calculated).
  // The per-vehicle hire figure changes with the selected card; the Totals and
  // Summary stay as the claim-wide totals (shown once).
  const [hireRecords, setHireRecords] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<ClaimVehicle[]>([]);
  const [activeVehicle, setActiveVehicle] = useState(0);
  // Plating per hire vehicle (keyed by vehicle id) — each card shows its own.
  const [platingByVehicle, setPlatingByVehicle] = useState<Record<string, number>>({});
  // Every saved row for the claim (one per vehicle), used to sum agreed hire
  // across vehicles for the Totals while the manual block shows the selected one.
  const [savedAll, setSavedAll] = useState<any[]>([]);
  // Per-vehicle agreed hire { days, rate } (rate already band-topped-up), keyed by
  // hire-vehicle id. Ref is the source of truth; storeVersion forces a re-render of
  // the (display-once) Totals when the store changes.
  const hireStoreRef = useRef<Record<string, { days: number; rate: number }>>({});
  const [storeVersion, setStoreVersion] = useState(0);
  const bumpStore = () => setStoreVersion((v) => v + 1);
  useEffect(() => {
    if (!claimId) return;
    getHireProvidedVehicles(claimId).then((vs) => setVehicles(Array.isArray(vs) ? vs : []));
  }, [claimId]);
  const perVehicle = vehicles.length >= 2;
  const currentVehicleId: number | null = perVehicle ? (vehicles[activeVehicle]?.id ?? null) : null;

  // Load each hire vehicle's own plating, so each card shows its own value (not the sum).
  useEffect(() => {
    if (!claimId || vehicles.length === 0) return;
    Promise.all(
      vehicles.map((v) =>
        getPlatingCharges(claimId, v.id)
          .then(({ data }: any) => [String(v.id), toF(data?.total_plating_cost)] as [string, number])
          .catch(() => [String(v.id), 0] as [string, number]),
      ),
    ).then((entries) => setPlatingByVehicle(Object.fromEntries(entries)));
  }, [claimId, vehicles]);
  // The hire record belonging to a given hire-vehicle id. The hire records and
  // the vehicle cards can be returned in different orders, so match by the
  // vehicle link (hire_vehicle_provided_id), NOT by array index.
  const hireRecFor = (vehId: any) =>
    hireRecords.find((r: any) => Number(r.hire_vehicle_provided_id) === Number(vehId));

  // This vehicle's own system hire (days + base per-day rate, before band uplift).
  const vehSysHire = (i: number) => {
    const r = hireRecFor(vehicles[i]?.id) ?? hireRecords[i];
    return {
      days: toF(r?.final_total_no_of_hire_days ?? r?.no_of_days_hire_so_far),
      baseRate: toF(r?.abi_hire_charge_per_day),
    };
  };
  // Latest system-derived rates, used as fallback when saved values are null
  const computedRatesRef = useRef({ repair: "0.00", recovery: "0.00", engineer: "0.00", plating: "0.00", cdFee: "0.00", admin: "0.00", hire: "0.00" });

  const formik = useFormik({
    initialValues: {
      settlement_status: "",
      abi_rate_band: "0",
      agreed_hire_days: "" as string | number,
      agreed_hire_rate: "" as string | number,
      agreed_storage_days: "" as string | number,
      agreed_storage_rate: "" as string | number,
      agreed_cdw_days: "" as string | number,
      agreed_cdw_rate: "" as string | number,
      agreed_additional_fees: "" as string | number,
      agreed_penalties: "" as string | number,
      agreed_repair_rate: "" as string | number,
      agreed_recovery_rate: "" as string | number,
      agreed_engineer_rate: "" as string | number,
      agreed_plating_rate: "" as string | number,
      agreed_cd_fee: "" as string | number,
      agreed_admin: "" as string | number,
      vat_recovered: true as boolean | null,
      reason_for_reduction: "",
    },
    onSubmit: async (values) => {
      if (!claimId) return;
      const num = (v: any) => (v !== "" ? Number(v) : null);
      // Claim-level fields are identical on every row (counted once in totals).
      const base = {
        claim_id: Number(claimId),
        settlement_status: values.settlement_status || null,
        abi_rate_band: values.abi_rate_band || null,
        agreed_storage_days: num(values.agreed_storage_days),
        agreed_storage_rate: num(values.agreed_storage_rate),
        agreed_cdw_days: num(values.agreed_cdw_days),
        agreed_cdw_rate: num(values.agreed_cdw_rate),
        agreed_additional_fees: num(values.agreed_additional_fees),
        agreed_penalties: num(values.agreed_penalties),
        agreed_repair_rate: num(values.agreed_repair_rate),
        agreed_recovery_rate: num(values.agreed_recovery_rate),
        agreed_engineer_rate: num(values.agreed_engineer_rate),
        agreed_plating_rate: num(values.agreed_plating_rate),
        agreed_cd_fee: num(values.agreed_cd_fee),
        agreed_admin: num(values.agreed_admin),
        vat_recovered: values.vat_recovered,
        reason_for_reduction: values.reason_for_reduction || null,
      };
      try {
        if (perVehicle) {
          // Persist the live card's hire first, then save one row per vehicle.
          if (currentVehicleId != null) {
            hireStoreRef.current[String(currentVehicleId)] = {
              days: toF(values.agreed_hire_days),
              rate: toF(values.agreed_hire_rate),
            };
          }
          await Promise.all(
            vehicles.map((v) => {
              const st = hireStoreRef.current[String(v.id)];
              return saveComparisonSettlement({
                ...base,
                hire_vehicle_id: v.id ?? null,
                agreed_hire_days: st ? st.days : null,
                agreed_hire_rate: st ? st.rate : null,
              });
            }),
          );
        } else {
          await saveComparisonSettlement({
            ...base,
            hire_vehicle_id: null,
            agreed_hire_days: num(values.agreed_hire_days),
            agreed_hire_rate: num(values.agreed_hire_rate),
          });
        }
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

  // Pre-populate fields when system data loads. The hire & admin rates hold the
  // band-topped-up value (set in the band effect below); the others hold base.
  useEffect(() => {
    if (system.hire_days === 0 && system.hire_rate_per_day === 0) return;
    const isBhr = formik.values.abi_rate_band === "35";
    // When there are 2+ vehicles, hire days come per-vehicle (handled below); the
    // claim-sum default would otherwise overwrite the selected card's value.
    if (!perVehicle) formik.setFieldValue("agreed_hire_days", system.hire_days);
    formik.setFieldValue("agreed_storage_days", system.storage_days);
    formik.setFieldValue("agreed_storage_rate", +(system.storage_rate_per_day).toFixed(2));
    // CDW is BHR-only — both days and rate are 0 for the ABI bands (Base/10%/20%).
    // For BHR, the days are the SELECTED vehicle's hire days (per card), not the
    // claim-wide sum.
    {
      const sel = hireRecFor(vehicles[activeVehicle]?.id) ?? hireRecords[activeVehicle];
      const cdwDays = perVehicle && sel
        ? toF(sel.final_total_no_of_hire_days ?? sel.no_of_days_hire_so_far)
        : system.cdw_days;
      formik.setFieldValue("agreed_cdw_days", isBhr ? cdwDays : 0);
    }
    formik.setFieldValue("agreed_cdw_rate", isBhr ? +(system.cdw).toFixed(2) : 0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [system.hire_days, system.hire_rate_per_day, system.storage_days, system.storage_rate_per_day, system.cdw, system.cdw_days]);

  // Update band-dependent fields when the band changes. Hire/storage rates are
  // base (band-independent); only the CDW rate flips with the BHR band.
  useEffect(() => {
    if (system.hire_rate_per_day === 0) return;
    const isBhr = formik.values.abi_rate_band === "35";
    const sel = hireRecords[activeVehicle];
    const cdwDays = perVehicle && sel
      ? toF(sel.final_total_no_of_hire_days ?? sel.no_of_days_hire_so_far)
      : system.cdw_days;
    formik.setFieldValue("agreed_cdw_days", isBhr ? cdwDays : 0);
    formik.setFieldValue("agreed_cdw_rate", isBhr ? +(system.cdw).toFixed(2) : 0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formik.values.abi_rate_band, activeVehicle]);

  // Pre-populate repair/recovery/engineer/plating rates from system × band mult.
  // Also caches the values in a ref so the saved-record loader can use them as a
  // fallback (its null columns must not clobber these fields back to empty).
  useEffect(() => {
    const mult = 1 + toF(formik.values.abi_rate_band) / 100;
    const isBhr = formik.values.abi_rate_band === "35";
    // Repair / recovery / engineer / plating are NOT topped up — base values
    const repair = (system.repair).toFixed(2);
    const recovery = (system.recovery).toFixed(2);
    const engineer = (system.engineer_fee).toFixed(2);
    const plating = (system.plating).toFixed(2);
    // C&D Fee is BHR-only — its value for the BHR band, 0 for ABI bands
    const cdFee = (isBhr ? system.cd_fee : 0).toFixed(2);
    // Hire rate IS topped up by the band (10/20/35), same as admin
    const hire = (system.hire_rate_per_day * mult).toFixed(2);
    // BHR admin is a flat 60 (no uplift); ABI bands keep abi admin × band mult
    const admin = (isBhr ? system.bhr_admin_fee : system.admin_fee * mult).toFixed(2);
    computedRatesRef.current = { repair, recovery, engineer, plating, cdFee, admin, hire };
    formik.setFieldValue("agreed_repair_rate", repair);
    formik.setFieldValue("agreed_recovery_rate", recovery);
    formik.setFieldValue("agreed_engineer_rate", engineer);
    formik.setFieldValue("agreed_plating_rate", plating);
    formik.setFieldValue("agreed_cd_fee", cdFee);
    // For 2+ vehicles the hire rate is the SELECTED vehicle's base × band mult
    // (set in the per-vehicle effect); the claim-blended rate would be wrong here.
    if (!perVehicle) formik.setFieldValue("agreed_hire_rate", hire);
    formik.setFieldValue("agreed_admin", admin);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [system.repair, system.recovery, system.engineer_fee, system.plating, system.cd_fee, system.admin_fee, system.bhr_admin_fee, system.hire_rate_per_day, formik.values.abi_rate_band]);

  // Load saved form data
  useEffect(() => {
    if (!claimId) { setLoading(false); return; }
    getComparisonSettlement(claimId)
      .then(({ data }: any) => {
        const all: any[] = Array.isArray(data?.saved_all) ? data.saved_all : [];
        setSavedAll(all);
        // Claim-level fields live on the claim-level row, or (for multi-vehicle
        // claims that only have per-vehicle rows) on any saved row — they're
        // replicated across all vehicle rows on save.
        const s = data?.saved ?? all[0];
        if (!s) return;
        formik.setValues({
          settlement_status: s.settlement_status ?? "",
          abi_rate_band: s.abi_rate_band ?? "10",
          agreed_hire_days: s.agreed_hire_days ?? "",
          agreed_hire_rate: s.agreed_hire_rate ?? computedRatesRef.current.hire,
          agreed_storage_days: s.agreed_storage_days ?? "",
          agreed_storage_rate: s.agreed_storage_rate ?? "",
          agreed_cdw_days: s.agreed_cdw_days ?? "",
          agreed_cdw_rate: s.agreed_cdw_rate ?? "",
          agreed_additional_fees: s.agreed_additional_fees ?? "",
          agreed_penalties: s.agreed_penalties ?? "",
          agreed_repair_rate: s.agreed_repair_rate ?? computedRatesRef.current.repair,
          agreed_recovery_rate: s.agreed_recovery_rate ?? computedRatesRef.current.recovery,
          agreed_engineer_rate: s.agreed_engineer_rate ?? computedRatesRef.current.engineer,
          agreed_plating_rate: s.agreed_plating_rate ?? computedRatesRef.current.plating,
          agreed_cd_fee: s.agreed_cd_fee ?? computedRatesRef.current.cdFee,
          agreed_admin: s.agreed_admin ?? computedRatesRef.current.admin,
          vat_recovered: s.vat_recovered ?? true,
          reason_for_reduction: s.reason_for_reduction ?? "",
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [claimId]);

  // ── Per-vehicle agreed hire (only when 2+ hire vehicles) ──────────────────
  // Seed the store for every vehicle from its saved row, or its own system hire
  // (days + base rate × band). Re-runs on band change so unsaved defaults track
  // the band. The selected vehicle is edited live in formik, so its store entry
  // is whatever was last stashed; we never overwrite it here once visited.
  useEffect(() => {
    if (!perVehicle) return;
    const mult = 1 + toF(formik.values.abi_rate_band) / 100;
    const store = hireStoreRef.current;
    vehicles.forEach((v, i) => {
      const key = String(v.id);
      // The selected card is edited live in formik — never overwrite its store.
      if (key === (currentVehicleId != null ? String(currentVehicleId) : null)) return;
      const saved = savedAll.find((r) => String(r.hire_vehicle_id) === key);
      if (saved && saved.agreed_hire_days != null) {
        store[key] = { days: toF(saved.agreed_hire_days), rate: toF(saved.agreed_hire_rate) };
      } else {
        // No saved row: default days from system (keep any edited days), and
        // re-derive the rate from this vehicle's base × band so it tracks the band.
        const sys = vehSysHire(i);
        store[key] = { days: store[key]?.days ?? sys.days, rate: round2(sys.baseRate * mult) };
      }
    });
    bumpStore();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [perVehicle, vehicles.length, hireRecords.length, savedAll, formik.values.abi_rate_band]);

  // Load the selected vehicle's hire into formik on card switch. Priority:
  // live-edited (store) → its saved row → its own system default. Re-runs when the
  // hire records / saved rows arrive so the per-vehicle value isn't left on a stale
  // (or another vehicle's) number.
  useEffect(() => {
    if (!perVehicle || currentVehicleId == null) return;
    const key = String(currentVehicleId);
    const mult = 1 + toF(formik.values.abi_rate_band) / 100;
    const stored = hireStoreRef.current[key];
    const saved = savedAll.find((r) => String(r.hire_vehicle_id) === key);
    const sys = vehSysHire(activeVehicle);
    let days: number, rate: number;
    if (stored) {
      days = stored.days; rate = stored.rate;
    } else if (saved && saved.agreed_hire_days != null) {
      days = toF(saved.agreed_hire_days); rate = toF(saved.agreed_hire_rate);
    } else {
      days = sys.days; rate = sys.baseRate * mult;
    }
    formik.setFieldValue("agreed_hire_days", days);
    formik.setFieldValue("agreed_hire_rate", round2(rate));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentVehicleId, perVehicle, savedAll, hireRecords.length]);

  // On band change, reset the SELECTED vehicle's hire rate to its base × band
  // (matches the single-vehicle behaviour where changing the band re-derives it).
  useEffect(() => {
    if (!perVehicle || currentVehicleId == null) return;
    const mult = 1 + toF(formik.values.abi_rate_band) / 100;
    const sys = vehSysHire(activeVehicle);
    formik.setFieldValue("agreed_hire_rate", round2(sys.baseRate * mult));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formik.values.abi_rate_band]);

  // Switch card: stash the current vehicle's live hire so its total contribution
  // and a later return to the card keep the edited values.
  const handleSelectVehicle = (i: number) => {
    if (perVehicle && currentVehicleId != null) {
      hireStoreRef.current[String(currentVehicleId)] = {
        days: toF(formik.values.agreed_hire_days),
        rate: toF(formik.values.agreed_hire_rate),
      };
      bumpStore();
    }
    setActiveVehicle(i);
  };

  // Load system values from each source screen (mirrors ABI&BHR approach)
  useEffect(() => {
    if (!claimId) return;

    // Hire costs, admin fee, CDW, C&D fee, hire days/rate
    getHireRecords(claimId)
      .then(({ data }: any) => {
        const records: any[] = Array.isArray(data) ? data : [];
        setHireRecords(records);
        const first = records[0];
        if (!first) return;
        // Total days = sum of every vehicle's total hire days
        const days = records.reduce(
          (sum: number, r: any) =>
            sum + toF(r.final_total_no_of_hire_days ?? r.no_of_days_hire_so_far),
          0,
        );
        // Total hire cost = sum of each vehicle's (its own days × its own rate),
        // since different vehicle categories have different daily rates.
        const hireCosts = records.reduce((sum: number, r: any) => {
          const d = toF(r.final_total_no_of_hire_days ?? r.no_of_days_hire_so_far);
          const rt = toF(r.abi_hire_charge_per_day);
          return sum + d * rt;
        }, 0);
        // Blended per-day rate so days × rate stays equal to the summed cost
        // (keeps the single-rate band/agreed logic working for multi-vehicle hires).
        const rate = days > 0 ? hireCosts / days : toF(first.abi_hire_charge_per_day);
        setSystem((prev) => ({
          ...prev,
          hire_days: days,
          hire_rate_per_day: rate,
          extra_charges_per_day: toF(first.abi_extra_charges_per_day),
          hire_costs: hireCosts,
          admin_fee: toF(first.abi_administration_fee),
          bhr_admin_fee: toF(first.bhr_administration_fee) || 60, // BHR admin is a flat 60
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

    // Plating — use the total across all vehicles (per-vehicle plating is stored
    // per hire vehicle, so the claim-level row is empty and would read as 0).
    getPlatingTotal(claimId)
      .then(({ data }: any) => {
        setSystem((prev) => ({
          ...prev,
          plating: toF(data?.total_plating_cost),
        }));
      })
      .catch(() => {});

    // Repair (sub_total = excl VAT, from route_repairs)
    getRepairData(claimId)
      .then((data: any) => {
        setSystem((prev) => ({
          ...prev,
          repair: toF(data?.sub_total),
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
  const actualHire = system.hire_costs;  // Σ across vehicles — used in the Totals
  // Per-vehicle hire for the System Calculated block (the selected card). For a
  // single vehicle this equals the total, so nothing changes.
  const selHireRec = hireRecFor(vehicles[activeVehicle]?.id) ?? hireRecords[activeVehicle];
  const hireDisplay = perVehicle && selHireRec
    ? toF(selHireRec.final_total_no_of_hire_days ?? selHireRec.no_of_days_hire_so_far) *
      toF(selHireRec.abi_hire_charge_per_day)
    : actualHire;
  const actualAdmin = system.admin_fee;
  const actualStorage = system.storage;
  const actualRepair = system.repair;
  const actualRecovery = system.recovery;
  const actualPlating = system.plating;  // Σ across vehicles — used in the Totals
  const actualEngineer = system.engineer_fee;
  // CDW and C&D Fee are BHR-only charges — not part of the ABI actual settlement
  const actualCdw = 0;
  const actualCdFee = 0;

  // System Calculated block displays (per card). Admin / Storage / Repair /
  // Recovery / Engineer are charged once per claim → shown on the first card only
  // (0 on the rest). Plating is per-vehicle → each card shows its own.
  const isFirstCard = !perVehicle || activeVehicle === 0;
  const adminDisplay = isFirstCard ? actualAdmin : 0;
  const storageDisplay = isFirstCard ? actualStorage : 0;
  const repairDisplay = isFirstCard ? actualRepair : 0;
  const recoveryDisplay = isFirstCard ? actualRecovery : 0;
  const engineerDisplay = isFirstCard ? actualEngineer : 0;
  const platingDisplay = perVehicle && currentVehicleId != null
    ? (platingByVehicle[String(currentVehicleId)] ?? 0)
    : actualPlating;

  const actualExclVAT = round2(
    round2(actualHire) + round2(actualAdmin) + round2(actualStorage) + round2(actualRepair) +
    round2(actualRecovery) + round2(actualPlating) + round2(actualEngineer) +
    round2(actualCdw) + round2(actualCdFee),
  );
  const actualVAT = round2(actualExclVAT * 0.2);
  const actualInclVAT = round2(actualExclVAT + actualVAT);

  // Agreed line items
  const agreedHireDays =
    formik.values.agreed_hire_days !== "" ? toF(formik.values.agreed_hire_days) : system.hire_days;
  const agreedHireRate =
    formik.values.agreed_hire_rate !== "" ? toF(formik.values.agreed_hire_rate) : system.hire_rate_per_day * rateMult;
  // Hire rate already includes the band top-up (like admin), so no extra mult here
  const agreedHire = agreedHireDays * agreedHireRate;

  // Hire is summed across every vehicle for the (display-once) Totals; the selected
  // card uses the live formik value, the others come from the per-vehicle store.
  // storeVersion is referenced so edits to other cards re-trigger this calc.
  void storeVersion;
  const selKey = currentVehicleId != null ? String(currentVehicleId) : null;
  const totalAgreedHire = perVehicle
    ? vehicles.reduce((sum, v, i) => {
        const key = String(v.id);
        if (key === selKey) return sum + agreedHire;
        const st = hireStoreRef.current[key];
        const days = st ? st.days : vehSysHire(i).days;
        const rate = st ? st.rate : round2(vehSysHire(i).baseRate * rateMult);
        return sum + days * rate;
      }, 0)
    : agreedHire;
  const totalAgreedHireDays = perVehicle
    ? vehicles.reduce((sum, v, i) => {
        const key = String(v.id);
        if (key === selKey) return sum + agreedHireDays;
        const st = hireStoreRef.current[key];
        return sum + (st ? st.days : vehSysHire(i).days);
      }, 0)
    : agreedHireDays;

  const hasStorageAdj =
    formik.values.agreed_storage_days !== "" || formik.values.agreed_storage_rate !== "";
  const agreedStorageDays =
    formik.values.agreed_storage_days !== "" ? toF(formik.values.agreed_storage_days) : system.storage_days;
  const agreedStorageRate =
    formik.values.agreed_storage_rate !== "" ? toF(formik.values.agreed_storage_rate) : system.storage_rate_per_day;
  // Storage is NOT topped up by the band — stays at base
  const agreedStorage = hasStorageAdj
    ? agreedStorageDays * agreedStorageRate
    : actualStorage;

  const hasCdwAdj =
    formik.values.agreed_cdw_days !== "" || formik.values.agreed_cdw_rate !== "";
  const agreedCdwDays =
    formik.values.agreed_cdw_days !== "" ? toF(formik.values.agreed_cdw_days) : system.cdw_days;
  const cdwRatePerDay = system.cdw; // cdw_charges is stored as the per-day rate
  const agreedCdwRate =
    formik.values.agreed_cdw_rate !== "" ? toF(formik.values.agreed_cdw_rate) : cdwRatePerDay;
  // CDW and C&D Fee are BHR-only charges: zero for Base ABI / 10% / 20%.
  // For the 35% (BHR) band they use their already-calculated value WITHOUT the
  // 35% uplift that applies to the other line items.
  const isBhrBand = formik.values.abi_rate_band === "35";
  const agreedCdw = isBhrBand
    ? (hasCdwAdj ? agreedCdwDays * agreedCdwRate : system.cdw * system.cdw_days)
    : 0;

  // BHR admin is a flat 60 (no band uplift); ABI bands keep abi admin × band mult
  const agreedAdmin = isBhrBand ? system.bhr_admin_fee : actualAdmin * rateMult;
  // Repair / recovery / plating / engineer are NOT topped up — stay at base
  const agreedRepair = actualRepair;
  const agreedRecovery = actualRecovery;
  const agreedPlating = actualPlating;
  const agreedEngineer = actualEngineer;
  const agreedCdFee = isBhrBand ? system.cd_fee : 0;
  const agreedAdditional = toF(formik.values.agreed_additional_fees);
  const agreedPenalties = toF(formik.values.agreed_penalties);

  // Totals use the summed hire across vehicles; everything else is claim-level (once).
  const agreedExclVAT = round2(
    round2(totalAgreedHire) + round2(agreedAdmin) + round2(agreedStorage) + round2(agreedRepair) +
    round2(agreedRecovery) + round2(agreedPlating) + round2(agreedEngineer) + round2(agreedCdw) +
    round2(agreedCdFee) + round2(agreedAdditional) + round2(agreedPenalties),
  );
  // VAT is always recovered (the Yes/No option was removed) → always apply 20%
  const agreedVAT = round2(agreedExclVAT * 0.2);
  const agreedInclVAT = round2(agreedExclVAT + agreedVAT);

  // Summary
  const totalDiff = agreedInclVAT - actualInclVAT;
  const overallPct = actualInclVAT > 0 ? (totalDiff / actualInclVAT) * 100 : 0;
  const reductionInHireDays = system.hire_days - totalAgreedHireDays;

  // ─── render ───────────────────────────────────────────────────────────────

  const divider = <div className="self-stretch h-px bg-neutral-100" />;

  return (
    <div className="w-full mt-3 flex flex-col gap-6 font-['Stack_Sans_Headline']">
      {loading && <SpinnerLoader />}
      <h1 className="text-black text-2xl font-weight-600 leading-6">
        Comparison - Actual &amp; Agreed Settlement
      </h1>

      {/* ── Section 1: Settlement Status ── */}
      <section className="self-stretch p-5 rounded-lg border border-neutral-100 flex flex-col gap-4">
        <h2 className="text-black text-xl font-weight-600 leading-5">
          Settlement Status
        </h2>
        {divider}
        <div className="relative w-96">
          <label className="block text-neutral-700 text-sm font-weight-500 mb-2">
            Status
          </label>
          <div
            onClick={() => setStatusOpen((o) => !o)}
            className="h-[52px] px-5 bg-white border border-neutral-200 rounded flex items-center justify-between cursor-pointer"
          >
            <span
              className={
                formik.values.settlement_status
                  ? "text-neutral-700 text-base font-light"
                  : "text-neutral-300 text-base font-light"
              }
            >
              {formik.values.settlement_status || "Select Status"}
            </span>
            <svg width="12" height="6" viewBox="0 0 12 6" fill="none">
              <path
                d="M1 1L6 5L11 1"
                stroke="#0352FD"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
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
                    formik.values.settlement_status === s
                      ? "bg-blue-100 font-weight-500"
                      : "text-neutral-700"
                  }`}
                >
                  {s}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── Vehicle switcher — between Settlement Status and System Calculated ── */}
      <VehicleCards
        vehicles={vehicles}
        activeIndex={activeVehicle}
        onSelect={handleSelectVehicle}
      />

      {/* ── Section 2: System Calculated Settlement ── */}
      <section className="self-stretch p-5 rounded-lg border border-neutral-100 flex flex-col gap-4">
        <h2 className="text-black text-xl font-weight-600 leading-5">
          System Calculated Settlement
        </h2>
        <div className="flex flex-col gap-4">
          {divider}
          <div className="grid grid-cols-2 gap-5">
            <ReadField label="Hire Costs" value={hireDisplay} />
            <ReadField label="Admin Fee" value={adminDisplay} />
          </div>
          <div className="grid grid-cols-2 gap-5">
            <ReadField label="Storage" value={storageDisplay} />
            <ReadField label="Repair" value={repairDisplay} />
          </div>
          <div className="grid grid-cols-2 gap-5">
            <ReadField label="Recovery" value={recoveryDisplay} />
            <ReadField label="Plating" value={platingDisplay} />
          </div>
          <div className="grid grid-cols-2 gap-5">
            <ReadField label="Engineer Fee" value={engineerDisplay} />
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
              <span className="text-neutral-700 font-weight-400">
                Total (Excl. VAT){" "}
              </span>
              <span className="text-neutral-700 font-weight-600">
                – £{fmt(actualExclVAT)}
              </span>
            </p>
            <p className="text-base">
              <span className="text-neutral-700 font-weight-400">
                VAT (20%){" "}
              </span>
              <span className="text-neutral-700 font-weight-600">
                – £{fmt(actualVAT)}
              </span>
            </p>
            <p className="text-base">
              <span className="text-neutral-700 font-weight-400">
                Total Actual Settlement (Incl. VAT){" "}
              </span>
              <span className="text-neutral-700 font-weight-600">
                – £{fmt(actualInclVAT)}
              </span>
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
                <span className="text-neutral-900 text-xl font-weight-600 leading-5">
                  {band.label}
                </span>
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
            noSymbol
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
            noSymbol
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
            noSymbol
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
            label="Repair Charges"
            name="agreed_repair_rate"
            value={formik.values.agreed_repair_rate}
            onChange={formik.handleChange}
            onBlur={(e) =>
              formik.setFieldValue(
                "agreed_repair_rate",
                toTwoDecimals(e.target.value),
              )
            }
            placeholder="Rate"
          />
          <EditField
            label="Recovery Charges"
            name="agreed_recovery_rate"
            value={formik.values.agreed_recovery_rate}
            onChange={formik.handleChange}
            onBlur={(e) =>
              formik.setFieldValue(
                "agreed_recovery_rate",
                toTwoDecimals(e.target.value),
              )
            }
            placeholder="Rate"
          />
        </div>
        <div className="grid grid-cols-2 gap-5">
          <EditField
            label="Plating Charges"
            name="agreed_plating_rate"
            value={formik.values.agreed_plating_rate}
            onChange={formik.handleChange}
            onBlur={(e) =>
              formik.setFieldValue(
                "agreed_plating_rate",
                toTwoDecimals(e.target.value),
              )
            }
            placeholder="Rate"
          />
          <EditField
            label="Engineer Fee"
            name="agreed_engineer_rate"
            value={formik.values.agreed_engineer_rate}
            onChange={formik.handleChange}
            onBlur={(e) =>
              formik.setFieldValue(
                "agreed_engineer_rate",
                toTwoDecimals(e.target.value),
              )
            }
            placeholder="Rate"
          />
        </div>
        <div className="grid grid-cols-2 gap-5">
          <EditField
            label="C & D Fee"
            name="agreed_cd_fee"
            value={formik.values.agreed_cd_fee}
            onChange={formik.handleChange}
            onBlur={(e) =>
              formik.setFieldValue("agreed_cd_fee", toTwoDecimals(e.target.value))
            }
            placeholder="Rate"
          />
          <EditField
            label="Admin Charges"
            name="agreed_admin"
            value={formik.values.agreed_admin}
            onChange={formik.handleChange}
            onBlur={(e) =>
              formik.setFieldValue("agreed_admin", toTwoDecimals(e.target.value))
            }
            placeholder="Rate"
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
        {/* VAT is always recovered (20% always applied) — toggle removed */}
        {/* Agreed Totals */}
        <div className="p-4 bg-blue-100 rounded-lg flex flex-col gap-2">
          <span className="text-black text-base font-weight-600">Totals</span>
          <div className="h-px bg-blue-200" />
          <p className="text-base">
            <span className="text-neutral-700 font-weight-400">
              Total (Excl. VAT){" "}
            </span>
            <span className="text-neutral-700 font-weight-600">
              – £{fmt(agreedExclVAT)}
            </span>
          </p>
          <p className="text-base">
            <span className="text-neutral-700 font-weight-400">VAT (20%) </span>
            <span className="text-neutral-700 font-weight-600">
              – £{fmt(agreedVAT)}
            </span>
          </p>
          <p className="text-base">
            <span className="text-neutral-700 font-weight-400">
              Total Agreed Settlement (Incl. VAT){" "}
            </span>
            <span className="text-neutral-700 font-weight-600">
              – £{fmt(agreedInclVAT)}
            </span>
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
          <div className="h-12 px-4 flex items-center gap-2 w-full bg-white">
            <div className="flex-[5] min-w-0 text-sm font-weight-600 text-black">
              CHARGE TYPE
            </div>
            <div className="flex-[6] min-w-0 text-sm font-weight-600 text-black">
              ACTUAL AMOUNT
            </div>
            <div className="flex-[6] min-w-0 text-sm font-weight-600 text-black leading-tight">
              AGREED AMOUNT
              {formik.values.abi_rate_band !== "0" && (
                <span className="text-xs font-weight-400">
                  {" "}
                  ({formik.values.abi_rate_band}% PENALTY)
                </span>
              )}
            </div>
            <div className="flex-[4] min-w-0 text-sm font-weight-600 text-black">
              DIFFERENCE
            </div>
            <div className="flex-[6] min-w-0 text-sm font-weight-600 text-black">
              DIFF %
            </div>
          </div>
          <div className="h-px bg-neutral-100" />
          <TableRow
            label="Hire Costs"
            actual={hireDisplay}
            agreed={agreedHire}
          />
          <div className="h-px bg-neutral-100" />
          <TableRow
            label="Admin Fee"
            actual={actualAdmin}
            agreed={agreedAdmin}
          />
          <div className="h-px bg-neutral-100" />
          <TableRow
            label="Storage"
            actual={actualStorage}
            agreed={agreedStorage}
          />
          <div className="h-px bg-neutral-100" />
          <TableRow
            label="Repair"
            actual={actualRepair}
            agreed={agreedRepair}
          />
          <div className="h-px bg-neutral-100" />
          <TableRow
            label="Recovery"
            actual={actualRecovery}
            agreed={agreedRecovery}
          />
          <div className="h-px bg-neutral-100" />
          <TableRow
            label="Plating"
            actual={actualPlating}
            agreed={agreedPlating}
          />
          <div className="h-px bg-neutral-100" />
          <TableRow
            label="Engineer Fee"
            actual={actualEngineer}
            agreed={agreedEngineer}
          />
          <div className="h-px bg-neutral-100" />
          <TableRow label="CDW" actual={actualCdw} agreed={agreedCdw} />
          <div className="h-px bg-neutral-100" />
          <TableRow
            label="C &amp; D Fee"
            actual={actualCdFee}
            agreed={agreedCdFee}
          />
          <div className="h-px bg-neutral-100" />
          {/* Totals rows with blue bg */}
          <TableRow
            label="Total (Excl. VAT)"
            actual={actualExclVAT}
            agreed={agreedExclVAT}
            isTotal
          />
          <div className="h-px bg-blue-200" />
          <TableRow
            label="VAT (20%)"
            actual={actualVAT}
            agreed={agreedVAT}
            isTotal
          />
          <div className="h-px bg-blue-200" />
          <TableRow
            label="Total (Incl. VAT)"
            actual={actualInclVAT}
            agreed={agreedInclVAT}
            isTotal
          />
        </div>
      </section>

      {/* ── Section 5: Summary ── */}
      <section className="self-stretch p-5 rounded-lg border border-neutral-100 flex flex-col gap-4 mb-10">
        <h2 className="text-black text-xl font-weight-600 leading-5">
          Summary
        </h2>
        {divider}
        <p className="text-sm">
          <span className="text-black font-weight-400">
            {totalDiff >= 0
              ? "Total Increase Amount: "
              : "Total Reduction Amount: "}
          </span>
          <span className="text-black text-base font-weight-600">
            £{fmt(Math.abs(totalDiff))}
          </span>
        </p>
        <p className="text-sm">
          <span className="text-black font-weight-400">
            {reductionInHireDays >= 0
              ? "Reduction in Hire Days: "
              : "Increase in Hire Days: "}
          </span>
          <span className="text-black text-base font-weight-600">
            {Math.round(Math.abs(reductionInHireDays))} days
          </span>
        </p>
        <p className="text-sm">
          <span className="text-black font-weight-400">
            {overallPct >= 0
              ? "Overall % Increase on Settlement: "
              : "Overall % Reduction on Settlement: "}
          </span>
          <span className="text-black text-base font-weight-600">
            {fmtPct(Math.abs(overallPct))}
          </span>
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
              formik.touched.reason_for_reduction &&
              formik.errors.reason_for_reduction
                ? "border-red-400"
                : "border-neutral-200"
            }`}
          />
          {formik.touched.reason_for_reduction &&
            formik.errors.reason_for_reduction && (
              <span className="text-red-500 text-xs">
                {formik.errors.reason_for_reduction}
              </span>
            )}
        </div>
      </section>
    </div>
  );
};

export default ComparisonActualAgreedForm;
