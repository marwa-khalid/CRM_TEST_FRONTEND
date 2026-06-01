import React, { useEffect } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { toast } from "react-toastify";
import {
  getPlatingCharges,
  savePlatingCharges,
} from "../../../services/PlatingCharges/PlatingCharges";

const validationSchema = Yup.object({
  private_hire_plating_fee: Yup.number().min(0).nullable(),
  private_hire_mot_cost: Yup.number().min(0).nullable(),
  automatic: Yup.number().min(0).nullable(),
  estate: Yup.number().min(0).nullable(),
  additional_premium: Yup.number().min(0).nullable(),
  additional_driver_charges: Yup.number().min(0).nullable(),
});

const PlatingChargesSection = ({ paymentFormRef, claimId }: any) => {

  const formik = useFormik({
    initialValues: {
      private_hire_plating_fee: "" as string | number,
      private_hire_mot_cost: "" as string | number,
      total_plating_cost: "" as string | number,
      automatic: "" as string | number,
      estate: "" as string | number,
      additional_premium: "" as string | number,
      additional_driver_charges: "" as string | number,
    },
    validationSchema,
    onSubmit: async (values) => {
      if (!claimId) return;
      try {
        await savePlatingCharges({
          claim_id: Number(claimId),
          private_hire_plating_fee: toNum(values.private_hire_plating_fee),
          private_hire_mot_cost: toNum(values.private_hire_mot_cost),
          total_plating_cost: toNum(values.total_plating_cost),
          automatic: toNum(values.automatic),
          estate: toNum(values.estate),
          additional_premium: toNum(values.additional_premium),
          additional_driver_charges: toNum(values.additional_driver_charges),
        });
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

  // Load existing data
  useEffect(() => {
    if (!claimId) return;
    getPlatingCharges(claimId)
      .then(({ data }) => {
        if (!data) return;
        formik.setValues({
          private_hire_plating_fee: data.private_hire_plating_fee ?? "",
          private_hire_mot_cost: data.private_hire_mot_cost ?? "",
          total_plating_cost: data.total_plating_cost ?? "",
          automatic: data.automatic ?? "",
          estate: data.estate ?? "",
          additional_premium: data.additional_premium ?? "",
          additional_driver_charges: data.additional_driver_charges ?? "",
        });
      })
      .catch(() => {});
  }, [claimId]);

  // Auto-calculate total plating cost
  useEffect(() => {
    const fee = parseFloat(String(formik.values.private_hire_plating_fee)) || 0;
    const mot = parseFloat(String(formik.values.private_hire_mot_cost)) || 0;
    formik.setFieldValue("total_plating_cost", (fee + mot).toFixed(2));
  }, [formik.values.private_hire_plating_fee, formik.values.private_hire_mot_cost]);

  return (
    <div className="w-full mt-3 flex flex-col justify-start items-start gap-6 bg-white font-['Stack_Sans_Headline']">
      <h1 className="self-stretch text-black text-2xl font-weight-600 leading-6">
        Plating &amp; Additional Charges
      </h1>

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
