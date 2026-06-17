import React, { useEffect, useRef, useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { toast } from "react-toastify";
import {
  getPlatingCharges,
  savePlatingCharges,
} from "../../../services/PlatingCharges/PlatingCharges";
import { getHireProvidedVehicles } from "../../../services/Vehicle/vehicle";
import VehicleCards, { type ClaimVehicle } from "./VehicleCards";
import { SpinnerLoader } from "../../../components/common/SpinnerLoader";

const validationSchema = Yup.object({
  private_hire_plating_fee: Yup.number().min(0).nullable(),
  private_hire_mot_cost: Yup.number().min(0).nullable(),
  automatic: Yup.number().min(0).nullable(),
  estate: Yup.number().min(0).nullable(),
  additional_premium: Yup.number().min(0).nullable(),
  additional_driver_charges: Yup.number().min(0).nullable(),
});

const PlatingChargesSection = ({ paymentFormRef, claimId }: any) => {

  const EMPTY = {
    private_hire_plating_fee: "" as string | number,
    private_hire_mot_cost: "" as string | number,
    total_plating_cost: "" as string | number,
    automatic: "" as string | number,
    estate: "" as string | number,
    additional_premium: "" as string | number,
    additional_driver_charges: "" as string | number,
  };
  const fromData = (d: any) => ({
    private_hire_plating_fee: d?.private_hire_plating_fee ?? "",
    private_hire_mot_cost: d?.private_hire_mot_cost ?? "",
    total_plating_cost: d?.total_plating_cost ?? "",
    automatic: d?.automatic ?? "",
    estate: d?.estate ?? "",
    additional_premium: d?.additional_premium ?? "",
    additional_driver_charges: d?.additional_driver_charges ?? "",
  });

  const [loading, setLoading] = useState(true);
  // Vehicle switcher cards (shown only when the claim has 2+ vehicles).
  const [vehicles, setVehicles] = useState<ClaimVehicle[]>([]);
  const [activeVehicle, setActiveVehicle] = useState(0);
  // Per-vehicle edited values, so switching cards keeps each vehicle separate.
  const cacheRef = useRef<Record<string, any>>({});
  useEffect(() => {
    if (!claimId) return;
    getHireProvidedVehicles(claimId).then((vs) => setVehicles(Array.isArray(vs) ? vs : []));
  }, [claimId]);

  // Plating is per vehicle only when there are 2+ vehicles; otherwise it stays
  // per-claim (vehicle id null) so existing single-vehicle data still loads.
  const perVehicle = vehicles.length >= 2;
  const currentVehicleId: number | null = perVehicle ? (vehicles[activeVehicle]?.id ?? null) : null;
  const cacheKey = (vid: number | null) => (vid == null ? "claim" : String(vid));

  const formik = useFormik({
    initialValues: { ...EMPTY },
    validationSchema,
    onSubmit: async () => {
      if (!claimId) return;
      // Stash the active vehicle's edits, then persist every visited vehicle.
      cacheRef.current[cacheKey(currentVehicleId)] = formik.values;
      try {
        await Promise.all(
          Object.entries(cacheRef.current).map(([key, vals]: any) =>
            savePlatingCharges({
              claim_id: Number(claimId),
              client_vehicle_id: key === "claim" ? null : Number(key),
              private_hire_plating_fee: toNum(vals.private_hire_plating_fee),
              private_hire_mot_cost: toNum(vals.private_hire_mot_cost),
              total_plating_cost: toNum(vals.total_plating_cost),
              automatic: toNum(vals.automatic),
              estate: toNum(vals.estate),
              additional_premium: toNum(vals.additional_premium),
              additional_driver_charges: toNum(vals.additional_driver_charges),
            }),
          ),
        );
        toast.success("Plating & additional charges saved");
      } catch {
        toast.error("Failed to save charges");
        throw new Error("save failed");
      }
    },
  });

  // Expose formik to parent via ref so Save & Next works
  useEffect(() => {
    if (paymentFormRef) paymentFormRef.current = formik;
  }, [formik]);

  // Load the active vehicle's plating (from cache if edited, else backend).
  useEffect(() => {
    if (!claimId) { setLoading(false); return; }
    const key = cacheKey(currentVehicleId);
    if (cacheRef.current[key]) {
      formik.setValues(cacheRef.current[key]);
      setLoading(false);
      return;
    }
    setLoading(true);
    getPlatingCharges(claimId, currentVehicleId ?? undefined)
      .then(({ data }) => formik.setValues(fromData(data)))
      .catch(() => formik.setValues({ ...EMPTY }))
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [claimId, currentVehicleId]);

  // Switch vehicle: stash current edits first so they aren't lost.
  const handleSelectVehicle = (i: number) => {
    cacheRef.current[cacheKey(currentVehicleId)] = formik.values;
    setActiveVehicle(i);
  };

  // Auto-calculate total plating cost
  useEffect(() => {
    const fee = parseFloat(String(formik.values.private_hire_plating_fee)) || 0;
    const mot = parseFloat(String(formik.values.private_hire_mot_cost)) || 0;
    formik.setFieldValue("total_plating_cost", (fee + mot).toFixed(2));
  }, [formik.values.private_hire_plating_fee, formik.values.private_hire_mot_cost]);

  return (
    <div className="w-full mt-3 flex flex-col justify-start items-start gap-6 bg-white font-['Stack_Sans_Headline']">
      {loading && <SpinnerLoader />}
      <h1 className="self-stretch text-black text-2xl font-weight-600 leading-6">
        Plating &amp; Additional Charges
      </h1>

      {/* Vehicle switcher — outside both boxes; only shows for 2+ vehicles */}
      <VehicleCards
        vehicles={vehicles}
        activeIndex={activeVehicle}
        onSelect={handleSelectVehicle}
      />

      {/* Hire Vehicle Plating Charges */}
      <section className="self-stretch p-5 rounded-lg border border-neutral-100 flex flex-col justify-start items-start gap-4">
        <h2 className="self-stretch text-neutral-900 text-xl font-weight-600 leading-5">
          Hire Vehicle Plating Charges
        </h2>
        <div className="self-stretch h-px bg-neutral-100" />

        <div className="w-full grid grid-cols-2 gap-5">
          <CurrencyInput
            label="Private Hire Plating Fee"
            name="private_hire_plating_fee"
            value={formik.values.private_hire_plating_fee}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.private_hire_plating_fee && formik.errors.private_hire_plating_fee as string}
          />
          <CurrencyInput
            label="Private Hire MOT Cost"
            name="private_hire_mot_cost"
            value={formik.values.private_hire_mot_cost}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.private_hire_mot_cost && formik.errors.private_hire_mot_cost as string}
          />
        </div>

        <div className="w-full grid grid-cols-2 gap-5">
          <CurrencyInput
            label="Total Plating Cost"
            name="total_plating_cost"
            value={formik.values.total_plating_cost}
            onChange={() => {}}
            disabled
          />
        </div>
      </section>

      {/* Additional Chargeable Items */}
      <section className="self-stretch p-5 rounded-lg border border-neutral-100 flex flex-col justify-start items-start gap-4">
        <h2 className="self-stretch text-neutral-900 text-xl font-weight-600 leading-5">
          Additional Chargeable Items
        </h2>
        <div className="self-stretch h-px bg-neutral-100" />

        <div className="w-full grid grid-cols-2 gap-5">
          <CurrencyInput
            label="Automatic"
            name="automatic"
            value={formik.values.automatic}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.automatic && formik.errors.automatic as string}
          />
          <CurrencyInput
            label="Estate"
            name="estate"
            value={formik.values.estate}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.estate && formik.errors.estate as string}
          />
        </div>

        <div className="w-full grid grid-cols-2 gap-5">
          <CurrencyInput
            label="Additional Premium"
            name="additional_premium"
            value={formik.values.additional_premium}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.additional_premium && formik.errors.additional_premium as string}
          />
          <CurrencyInput
            label="Additional Driver Charges"
            name="additional_driver_charges"
            value={formik.values.additional_driver_charges}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.additional_driver_charges && formik.errors.additional_driver_charges as string}
          />
        </div>
      </section>
    </div>
  );
};

function toNum(v: any): number | null {
  const n = parseFloat(String(v));
  return isNaN(n) ? null : n;
}

interface CurrencyInputProps {
  label: string;
  name: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  error?: string | false;
}

const CurrencyInput: React.FC<CurrencyInputProps> = ({
  label,
  name,
  value,
  onChange,
  onBlur,
  disabled,
  error,
}) => {
  return (
    <div className="flex flex-col justify-start items-start gap-2">
      <label className="self-stretch text-neutral-700 text-sm font-weight-400 font-['Stack_Sans_Headline']">
        {label}
      </label>
      <div
        className={`self-stretch px-5 py-4 bg-white rounded border flex justify-start items-center gap-2.5 transition-colors ${
          error
            ? "border-red-400"
            : disabled
            ? "border-neutral-200 bg-slate-50"
            : "border-neutral-200 focus-within:border-blue-500"
        }`}
      >
        <span className="text-neutral-300 text-base font-light leading-4 select-none">
          £
        </span>
        <input
          type="text"
          name={name}
          value={value}
          onChange={onChange}
          onBlur={(e) => {
            onBlur?.(e);
            // Format to 2 decimal places on blur
            if (e.target.value !== "" && !disabled) {
              const formatted = parseFloat(e.target.value).toFixed(2);
              onChange({ target: { name, value: formatted } } as any);
            }
          }}
          disabled={disabled}
          step="0.01"
          min="0"
          placeholder="0.00"
          className="w-full bg-transparent outline-none text-black text-base font-light leading-4 placeholder:text-neutral-300 disabled:text-neutral-500"
        />
      </div>
      {error && <span className="text-red-500 text-xs">{error}</span>}
    </div>
  );
};

export default PlatingChargesSection;
