import React, { useEffect, useRef, useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { toast } from "react-toastify";
import {
  getDirectHirePayment,
  saveDirectHirePayment,
} from "../../../services/DirectHirePayment/DirectHirePayment";
import { CustomDatePicker } from "../Components/DatePicker";
import Vector6 from "../../../assets/AutoClaim_icon/Vector-6.svg";
import { SpinnerLoader } from "../../../claims/common/SpinnerLoader";

// ─── helpers ────────────────────────────────────────────────────────────────

function dateToISO(d: Date): string {
  // Local YYYY-MM-DD — toISOString() returns UTC, which in timezones ahead of UTC
  // rolls back to the previous day (selecting the 8th would store the 7th).
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const toTwoDecimals = (v: string): string =>
  v === "" || Number.isNaN(Number(v)) ? v : Number(v).toFixed(2);

function formatDisplay(dateStr: string): string {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}

// ─── main component ──────────────────────────────────────────────────────────

const DirectHirePaymentForm = ({ paymentFormRef, claimId }: any) => {

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(true);
  const dateRef = useRef<HTMLDivElement>(null);

  const formik = useFormik({
    initialValues: {
      date_settlement_received: "",
      settlement_amount_received: "" as string | number,
    },
    validationSchema: Yup.object({
      date_settlement_received: Yup.string()
        .required("Date is required"),
      settlement_amount_received: Yup.number()
        .typeError("Must be a number")
        .required("Amount is required")
        .min(0.01, "Amount must be greater than 0"),
    }),
    onSubmit: async (values) => {
      if (!claimId) return;
      try {
        await saveDirectHirePayment({
          claim_id: Number(claimId),
          date_settlement_received: values.date_settlement_received || null,
          settlement_amount_received:
            values.settlement_amount_received !== ""
              ? Number(values.settlement_amount_received)
              : null,
        });
        toast.success("Settlement details saved");
      } catch {
        toast.error("Failed to save");
        throw new Error("save failed");
      }
    },
  });

  // Expose to parent "Save & Next"
  useEffect(() => {
    if (paymentFormRef) paymentFormRef.current = formik;
  }, [formik]);

  // Close date picker on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dateRef.current && !dateRef.current.contains(e.target as Node))
        setShowDatePicker(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Load saved data
  useEffect(() => {
    if (!claimId) { setLoading(false); return; }
    getDirectHirePayment(claimId)
      .then(({ data }: any) => {
        const s = data?.saved;
        if (!s) return;
        formik.setValues({
          date_settlement_received: s.date_settlement_received ?? "",
          settlement_amount_received:
            s.settlement_amount_received != null
              ? toTwoDecimals(String(s.settlement_amount_received))
              : "",
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [claimId]);

  // ─── date picker max = today ─────────────────────────────────────────────
  const today = new Date();
  const selectedDate = formik.values.date_settlement_received
    ? new Date(formik.values.date_settlement_received + "T00:00:00")
    : today;

  const dateTouched = formik.touched.date_settlement_received;
  const dateError = formik.errors.date_settlement_received;
  const amountTouched = formik.touched.settlement_amount_received;
  const amountError = formik.errors.settlement_amount_received;

  const divider = <div className="self-stretch h-px bg-neutral-100" />;

  return (
    <div className="w-full mt-3 flex flex-col gap-6 font-['Stack_Sans_Headline']">
      {loading && <SpinnerLoader />}
      <h1 className="text-black text-2xl font-weight-600 leading-6">
        Settlement Received Date
      </h1>

      <section className="self-stretch p-5 rounded-lg border border-neutral-100 flex flex-col gap-4">
        {/* {divider} */}
        <div className="w-full grid grid-cols-2 gap-5">

          {/* Date Settlement Received */}
          <div className="flex flex-col gap-2">
            <label className="text-neutral-700 text-sm font-weight-500 font-['Stack_Sans_Headline']">
              Date Settlement Received
            </label>
            <div className="relative flex flex-col" ref={dateRef}>
              <div
                onClick={() => setShowDatePicker((p) => !p)}
                className={`h-[52px] px-5 bg-white rounded border flex items-center justify-between cursor-pointer ${
                  dateTouched && dateError ? "border-red-400" : "border-neutral-200"
                }`}
              >
                <span
                  className={
                    formik.values.date_settlement_received
                      ? "text-neutral-700 text-base font-light leading-4"
                      : "text-neutral-300 text-base font-light leading-4"
                  }
                >
                  {formik.values.date_settlement_received
                    ? formatDisplay(formik.values.date_settlement_received)
                    : "Date"}
                </span>
                <img src={Vector6} alt="" />
              </div>
              {showDatePicker && (
                <CustomDatePicker
                  selectedDate={selectedDate}
                  onDateSelect={(d) => {
                    formik.setFieldValue("date_settlement_received", dateToISO(d));
                    formik.setFieldTouched("date_settlement_received", true);
                    setShowDatePicker(false);
                  }}
                />
              )}
            </div>
            {dateTouched && dateError && (
              <span className="text-red-500 text-xs">{dateError}</span>
            )}
          </div>

          {/* Settlement Amount Received */}
          <div className="flex flex-col gap-2">
            <label className="text-neutral-700 text-sm font-weight-500 font-['Stack_Sans_Headline']">
              Settlement Amount Received
            </label>
            <div
              className={`h-[52px] px-5 bg-white rounded border flex items-center gap-2 focus-within:border-blue-500 ${
                amountTouched && amountError ? "border-red-400" : "border-neutral-200"
              }`}
            >
              <span className="text-neutral-500 text-base font-light leading-4 select-none">
                £
              </span>
              <input
                type="number"
                step="0.01"
                name="settlement_amount_received"
                value={formik.values.settlement_amount_received}
                onChange={formik.handleChange}
                onBlur={(e) => {
                  formik.handleBlur(e);
                  formik.setFieldValue(
                    "settlement_amount_received",
                    toTwoDecimals(e.target.value),
                  );
                }}
                placeholder="0.00"
                className="flex-1 bg-transparent outline-none text-base text-neutral-700 font-light leading-4 placeholder:text-neutral-300"
              />
            </div>
            {amountTouched && amountError && (
              <span className="text-red-500 text-xs">{amountError}</span>
            )}
          </div>

        </div>
      </section>
    </div>
  );
};

export default DirectHirePaymentForm;
