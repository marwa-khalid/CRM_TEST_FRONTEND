import React, { useEffect, useMemo, useRef, useState } from "react";
import { useFormik } from "formik";
import Select from "react-select";
import { toast } from "react-toastify";
import {
  BlueDropdownIndicator,
  customStyles,
} from "../Steps/GeneralDetailsForm";
import { CustomDatePicker } from "../Components/DatePicker";
import Vector6 from "../../../assets/AutoClaim_icon/Vector-6.svg";
import Yes from "../../../assets/AutoClaim_icon/Yes.svg";
import No from "../../../assets/AutoClaim_icon/No.svg";
import {
  createTotalLoss,
  getTotalLoss,
  updateTotalLoss,
} from "../../../services/TotalLoss/TotalLoss";
import {
  sendPAVToClient,
  sendTotalLossEngReportToTPI,
  instructFleetOffHireFromTotalLoss,
} from "../../../services/TotalLoss/TotalLoss";
type NullableDate = Date | null;

type TotalLossFormValues = {
  totalLossDate: NullableDate;
  pav: string;
  salvageAmount: string;
  salvageCategory: string;
  engineerReportSent: NullableDate;
  pavChequeReceived: NullableDate;
  pavSentToClient: NullableDate;
  vehicleSalvageMileage: string;
  clientKeepingSalvage: string;
  pavOfferMade: NullableDate;
  pavAgreed: string;
  pavOfferAccepted: NullableDate;
  clientRetainingSalvage: string;
  tpiInstructed: NullableDate;
  hasSalvageBeenCollected: "Yes" | "No";
  salvageCollectedOn: NullableDate;
};

const emptyValues: TotalLossFormValues = {
  totalLossDate: null,
  pav: "",
  salvageAmount: "",
  salvageCategory: "",
  engineerReportSent: null,
  pavChequeReceived: null,
  pavSentToClient: null,
  vehicleSalvageMileage: "",
  clientKeepingSalvage: "",
  pavOfferMade: null,
  pavAgreed: "",
  pavOfferAccepted: null,
  clientRetainingSalvage: "",
  tpiInstructed: null,
  hasSalvageBeenCollected: "No",
  salvageCollectedOn: null,
};

const handlerOptions = [
  { value: "A", label: "A" },
  { value: "B", label: "B" },
  { value: "N", label: "N" },
  { value: "S", label: "S" },
];

const commonOptions = [
  { value: "YES", label: "Yes" },
  { value: "NO", label: "No" },
  { value: "TBC", label: "TBC" },
];

const commonOptions2 = [
  ...commonOptions,
  { value: "DISPUTED", label: "Disputed" },
];

const toText = (value: unknown) =>
  value === null || value === undefined ? "" : String(value);

const toNumber = (value: string) => {
  if (value === "" || value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const toCalendarDate = (value: unknown): NullableDate => {
  if (!value) return null;
  if (value instanceof Date) return value;

  const dateString = String(value).split("T")[0];
  const date = new Date(`${dateString}T00:00:00`);

  return Number.isNaN(date.getTime()) ? null : date;
};

const formatCalendarDate = (date?: NullableDate) => {
  if (!date) return null;

  return date.toLocaleDateString("sv-SE");
};

const yesNoFromApi = (value: unknown): "Yes" | "No" => {
  if (
    value === true ||
    value === "true" ||
    value === "YES" ||
    value === "Yes"
  ) {
    return "Yes";
  }
  return "No";
};

const mapTotalLossDataToFormValues = (
  data: any,
): Partial<TotalLossFormValues> => ({
  totalLossDate: toCalendarDate(data?.total_loss_date ?? data?.totalLossDate),
  pav: toText(data?.pav),
  salvageAmount: toText(data?.salvage_amount ?? data?.salvageAmount),
  salvageCategory: toText(data?.salvage_category ?? data?.salvage_category_id),
  engineerReportSent: toCalendarDate(
    data?.engineer_report_sent_tpi ?? data?.engineerReportSent,
  ),
  pavChequeReceived: toCalendarDate(
    data?.pav_cheque_received ?? data?.pavChequeReceived,
  ),
  pavSentToClient: toCalendarDate(
    data?.pav_sent_client ?? data?.pavSentToClient,
  ),
  vehicleSalvageMileage: toText(
    data?.vehicle_salvage_milage ??
      data?.vehicle_salvage_mileage ??
      data?.vehicleSalvageMileage,
  ),
  clientKeepingSalvage: toText(
    data?.keeping_salvage_id ?? data?.clientKeepingSalvage,
  ),
  pavOfferMade: toCalendarDate(
    data?.pav_offer_made_client ?? data?.pavOfferMade,
  ),
  pavAgreed: toText(data?.pav_agreed_id ?? data?.pavAgreed),
  pavOfferAccepted: toCalendarDate(
    data?.pav_offer_accepted ?? data?.pavOfferAccepted,
  ),
  clientRetainingSalvage: toText(
    data?.retaining_salvage_id ?? data?.clientRetainingSalvage,
  ),
  tpiInstructed: toCalendarDate(
    data?.tpi_instructed_collect_saving_on ?? data?.tpiInstructed,
  ),
  hasSalvageBeenCollected: yesNoFromApi(data?.has_salvage_been_collected),
  salvageCollectedOn: toCalendarDate(
    data?.salvage_collect_on ?? data?.salvageCollectedOn,
  ),
});

const buildPayload = (values: TotalLossFormValues, claimId: number) => ({
  claim_id: claimId,
  currency: "GBP",
  total_loss_date: formatCalendarDate(values.totalLossDate),
  pav: toNumber(values.pav),
  salvage_amount: toNumber(values.salvageAmount),
  salvage_category_id: values.salvageCategory || null,
  keeping_salvage_id: values.clientKeepingSalvage || null,
  pav_agreed_id: values.pavAgreed || null,
  retaining_salvage_id: values.clientRetainingSalvage || null,
  engineer_report_sent_tpi: formatCalendarDate(values.engineerReportSent),
  pav_cheque_received: formatCalendarDate(values.pavChequeReceived),
  pav_sent_client: formatCalendarDate(values.pavSentToClient),
  vehicle_salvage_milage: toNumber(values.vehicleSalvageMileage),
  pav_offer_made_client: formatCalendarDate(values.pavOfferMade),
  pav_offer_accepted: formatCalendarDate(values.pavOfferAccepted),
  tpi_instructed_collect_saving_on: formatCalendarDate(values.tpiInstructed),
  has_salvage_been_collected: values.hasSalvageBeenCollected === "Yes",
  salvage_collect_on: formatCalendarDate(values.salvageCollectedOn),
});

export const TotalLossView: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  engineer_report_received?: any;
}> = ({ isOpen, onClose, engineer_report_received }) => {
  const claimId = useMemo(() => Number(localStorage.getItem("claimId")), []);
  const [totalLossRecordId, setTotalLossRecordId] = useState<number | null>(
    null,
  );
const [loading, setLoading] = useState<string | null>(null);

const handleCTA = async (type: string) => {
  if (!claimId) return;

  setLoading(type);
  try {
    if (type === "eng") {
      await sendTotalLossEngReportToTPI(claimId);
      toast.success("Engineer report sent to TPI");
    }

    if (type === "pav") {
      await sendPAVToClient(claimId);
      toast.success("PAV sent to client");
    }

    if (type === "fleet") {
      await instructFleetOffHireFromTotalLoss(claimId);
      toast.success("Fleet instructed for off hire");
    }
  } catch (e: any) {
    const detail = e?.response?.data?.detail || "";
    if (type === "eng" && detail.toLowerCase().includes("recipient email is missing")) {
      toast.error(
        "TPI Direct Email is not set. Go to the Third Party Insurer section, enter the Direct Email, and save before sending.",
        { autoClose: 6000 }
      );
    } else {
      toast.error(detail || "Failed to send");
    }
  } finally {
    setLoading(null);
  }
};
  const formik = useFormik<TotalLossFormValues>({
    initialValues: emptyValues,
    enableReinitialize: false,
    onSubmit: async (values, helpers) => {
      if (!claimId) {
        toast.error("Claim ID is missing");
        return;
      }

      try {
        const payload = buildPayload(values, claimId);

        if (totalLossRecordId) {
          await updateTotalLoss(claimId, payload);
          toast.success("Total Loss Updated Successfully");
        } else {
          const response = await createTotalLoss(claimId, payload);
          setTotalLossRecordId(response?.id ?? response?.data?.id ?? null);
          toast.success("Total Loss Created");
        }

        onClose();
      } catch (error) {
        console.error("Error saving total loss:", error);
        toast.error("Failed to save total loss");
      } finally {
        helpers.setSubmitting(false);
      }
    },
  });

  useEffect(() => {
    if (!isOpen || !claimId) return;

    const fetchData = async () => {
      try {
        const apiData = await getTotalLoss(claimId);
        const existingRecord = apiData?.data ?? apiData;

        if (existingRecord?.id) {
          setTotalLossRecordId(existingRecord.id);
        } else {
          setTotalLossRecordId(null);
        }

        const apiValues = existingRecord
          ? mapTotalLossDataToFormValues(existingRecord)
          : {};
        const ocrValues = engineer_report_received
          ? mapTotalLossDataToFormValues(engineer_report_received)
          : {};

        formik.setValues({
          ...emptyValues,
          ...apiValues,
          ...ocrValues,
        });
      } catch (error) {
        console.error("Error fetching total loss:", error);
        setTotalLossRecordId(null);

        if (engineer_report_received) {
          formik.setValues({
            ...emptyValues,
            ...mapTotalLossDataToFormValues(engineer_report_received),
          });
        }
      }
    };

    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, claimId, engineer_report_received]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-[100] p-10 font-['Stack_Sans_Headline']">
      <div className="card bg-white h-full flex flex-col overflow-auto w-[1070px]">
        <div className="w-full px-10 py-5 bg-white shadow-md flex justify-between items-center sticky top-0 z-20">
          <h1 className="font-weight-600 text-[20px]">Total Loss</h1>
          <div className="flex gap-5">
            <button
              type="button"
              className="px-10 py-4 border border-primary text-primary rounded"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={formik.isSubmitting}
              className="px-10 py-4 bg-blue-500 text-white rounded disabled:opacity-60"
              onClick={() => formik.handleSubmit()}
            >
              {formik.isSubmitting
                ? "Saving..."
                : totalLossRecordId
                  ? "Update"
                  : "Update"}
            </button>
          </div>
        </div>

        <div className="w-[788px] mx-auto mb-10 space-y-6">
          <div className="p-5 rounded-lg border border-gray-100 flex flex-col gap-4 mt-6">
            <h2 className="text-neutral-900 text-[20px] font-weight-600">
              Total Loss Details
            </h2>
            <div className="w-full h-px bg-gray-100" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <DateField
                label="Total Loss Date"
                name="totalLossDate"
                formik={formik}
              />
              <InputGroup
                label="PAV £"
                type="currency"
                name="pav"
                formik={formik}
              />
              <InputGroup
                label="Salvage Amount"
                type="currency"
                name="salvageAmount"
                formik={formik}
              />
              <SelectGroup
                label="Salvage Category"
                name="salvageCategory"
                options={handlerOptions}
                formik={formik}
              />
              <DateField
                label="Engineer Report Sent to TPI"
                name="engineerReportSent"
                formik={formik}
              />
              <DateField
                label="PAV Cheque Received"
                name="pavChequeReceived"
                formik={formik}
              />
              <DateField
                label="PAV Sent to Client"
                name="pavSentToClient"
                formik={formik}
              />
              <InputGroup
                label="Vehicle Salvage Mileage"
                type="text"
                name="vehicleSalvageMileage"
                formik={formik}
              />
              <SelectGroup
                label="Client Keeping Salvage?"
                name="clientKeepingSalvage"
                options={commonOptions2}
                formik={formik}
              />
              <DateField
                label="PAV Offer Made to Client"
                name="pavOfferMade"
                formik={formik}
              />
              <SelectGroup
                label="PAV Agreed"
                name="pavAgreed"
                options={commonOptions2}
                formik={formik}
              />
              <DateField
                label="PAV Offer Accepted"
                name="pavOfferAccepted"
                formik={formik}
              />
            </div>

            <div className="flex flex-wrap gap-5 py-4">
              <button
                onClick={() => handleCTA("eng")}
                className="flex-1 min-w-[200px] px-6 py-4 bg-white rounded border
              border-blue-600 text-blue-600 font-medium hover:bg-blue-50"
              >
                {loading === "eng" ? "Sending..." : "Send Eng Rep to TPI"}
              </button>

              <button
                onClick={() => handleCTA("pav")}
                className="flex-1 min-w-[200px] px-6 py-4 bg-white rounded border
              border-blue-600 text-blue-600 font-medium hover:bg-blue-50"
              >
                {loading === "pav" ? "Sending..." : "Send PAV to CL"}
              </button>

              <button
                onClick={() => handleCTA("fleet")}
                className="flex-1 min-w-[200px] px-6 py-4 bg-white rounded border
              border-blue-600 text-blue-600 font-medium hover:bg-blue-50"
              >
                {loading === "fleet"
                  ? "Sending..."
                  : "Instruct Fleet to Off Hire"}
              </button>
            </div>
          </div>

          <div className="p-5 rounded-lg border border-gray-100 flex flex-col gap-4 mt-6">
            <h2 className="text-neutral-900 text-[20px] font-weight-600">
              Salvage Retention Details Section
            </h2>
            <div className="w-full h-px bg-gray-100" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <SelectGroup
                label="Client Retaining Salvage?"
                name="clientRetainingSalvage"
                options={commonOptions}
                formik={formik}
              />
              <DateField
                label="TPI Instructed to Collect Salvage on"
                name="tpiInstructed"
                formik={formik}
              />

              <div className="flex flex-col gap-4">
                <span className="text-gray-700 text-sm font-medium">
                  Has Salvage Been Collected?
                </span>
                <div className="flex items-center gap-5">
                  {(["Yes", "No"] as const).map((option) => (
                    <label
                      key={option}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <input
                        type="radio"
                        name="hasSalvageBeenCollected"
                        className="sr-only"
                        checked={
                          formik.values.hasSalvageBeenCollected === option
                        }
                        onChange={() =>
                          formik.setFieldValue(
                            "hasSalvageBeenCollected",
                            option,
                          )
                        }
                      />
                      <img
                        src={
                          formik.values.hasSalvageBeenCollected === option
                            ? Yes
                            : No
                        }
                        alt=""
                      />
                      <span className="text-black text-sm">{option}</span>
                    </label>
                  ))}
                </div>
              </div>

              <DateField
                label="Salvage Collected On"
                name="salvageCollectedOn"
                formik={formik}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const formatTwoDecimals = (value: any) => {
  if (value === "" || value === null || value === undefined) return "";
  const num = Number(value);
  if (Number.isNaN(num)) return value;
  return num.toFixed(2);
};

const InputGroup = ({
  label,
  type,
  name,
  formik,
}: {
  label: string;
  type: "currency" | "text";
  name: keyof TotalLossFormValues;
  formik: any;
}) => (
  <div className="flex flex-col gap-2">
    <label className="text-gray-700 text-sm font-medium">{label}</label>
    <div className="relative">
      {type === "currency" && (
        <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400">
          £
        </span>
      )}
      <input
        type={type === "currency" ? "number" : "text"}
        step={type === "currency" ? "0.01" : undefined}
        min={type === "currency" ? "0" : undefined}
        name={name}
        value={formik.values[name] ?? ""}
        onChange={formik.handleChange}
        onBlur={
          type === "currency"
            ? (e) => formik.setFieldValue(name, formatTwoDecimals(e.target.value))
            : undefined
        }
        placeholder={type === "currency" ? "0.00" : ""}
        className={`w-full px-5 py-4 bg-white rounded border border-gray-200 focus:border-blue-500 outline-none transition-all ${
          type === "currency" ? "pl-10" : ""
        }`}
      />
    </div>
  </div>
);

const DateField = ({
  label,
  name,
  formik,
}: {
  label: string;
  name: keyof TotalLossFormValues;
  formik: any;
}) => {
  const [showPicker, setShowPicker] = useState(false);
  const datepickerRef = useRef<HTMLDivElement>(null);
  const selectedDate = formik.values[name] as NullableDate;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        datepickerRef.current &&
        !datepickerRef.current.contains(event.target as Node)
      ) {
        setShowPicker(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="flex flex-col gap-2 relative" ref={datepickerRef}>
      <label className="text-neutral-700 text-[14px] font-weight-500">
        {label}
      </label>
      <div
        onClick={() => setShowPicker((prev) => !prev)}
        className="h-[52px] px-5 bg-white rounded border border-gray-200 flex items-center justify-between cursor-pointer focus-within:border-blue-500"
      >
        <span
          className={
            selectedDate
              ? "text-neutral-700 font-light"
              : "text-gray-300 font-light"
          }
        >
          {selectedDate ? selectedDate.toLocaleDateString("sv-SE") : "Date"}
        </span>
        <img src={Vector6} className="w-4 h-4" alt="calendar" />
      </div>

      {showPicker && (
        <div className="absolute bottom-[53px] left-0 z-[100] shadow-xl rounded-lg bg-white">
          <CustomDatePicker
            selectedDate={selectedDate || new Date()}
            onDateSelect={(date: Date) => {
              formik.setFieldValue(name, date);
              setShowPicker(false);
            }}
          />
        </div>
      )}
    </div>
  );
};

const SelectGroup = ({
  label,
  name,
  options,
  formik,
}: {
  label: string;
  name: keyof TotalLossFormValues;
  options: { value: string; label: string }[];
  formik: any;
}) => (
  <div className="flex flex-col gap-2">
    <label className="text-gray-700 text-[14px] font-weight-500">{label}</label>
    <Select
      options={options}
      styles={customStyles}
      placeholder="Select"
      value={
        options.find((option) => option.value === formik.values[name]) ?? null
      }
      onChange={(option) => formik.setFieldValue(name, option?.value ?? "")}
      components={{
        DropdownIndicator: BlueDropdownIndicator,
        IndicatorSeparator: () => null,
      }}
    />
  </div>
);

export default TotalLossView;
