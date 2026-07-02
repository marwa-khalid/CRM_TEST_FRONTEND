import React, { useEffect, useMemo, useRef, useState } from "react";
import { useFormik } from "formik";
import { toast } from "react-toastify";
import { CustomDatePicker } from "../Components/DatePicker";
import Vector6 from "../../../assets/AutoClaim_icon/Vector-6.svg";
import Yes from "../../../assets/AutoClaim_icon/Yes.svg";
import No from "../../../assets/AutoClaim_icon/No.svg";
import {
  costRepairApi,
  getRepairData,
  instructFleetOffHireFromRepair,
  sendCILAgreement,
  sendCILAgreementClient,
  sendCILToClient,
  sendEngReportToTPI,
  updateCostRepair,
} from "../../../services/RepairAndCost/RepairAndCost";

type NullableDate = Date | null;

type RepairCostFormValues = {
  labour: string;
  paintMaterials: string;
  parts: string;
  specialistCost: string;
  jobHire: string;
  subTotal: string;
  vat: string;
  totalIncVat: string;
  cilTotalReceived: string;
  actualRepairParts: string;
  actualRepairLabour: string;
  netCilAmount: string;
  cilAgreed: boolean;
  roadworthyCilFeeAgreed: boolean;
  agreementReceived: NullableDate;
  engRepSentToTPI: NullableDate;
  cilChequeReceived: NullableDate;
  cilChequeSentToCL: NullableDate;
  cilRemovalConfirmationRec: NullableDate;
  repairEstDays: string;
  repairInst: NullableDate;
  repairAuth: NullableDate;
  estimationReceived: NullableDate;
  repairStart: NullableDate;
  repairCompleted: NullableDate;
};

const emptyValues: RepairCostFormValues = {
  labour: "",
  paintMaterials: "",
  parts: "",
  specialistCost: "",
  jobHire: "",
  subTotal: "",
  vat: "",
  totalIncVat: "",
  cilTotalReceived: "",
  actualRepairParts: "",
  actualRepairLabour: "",
  netCilAmount: "",
  cilAgreed: false,
  roadworthyCilFeeAgreed: false,
  agreementReceived: null,
  engRepSentToTPI: null,
  cilChequeReceived: null,
  cilChequeSentToCL: null,
  cilRemovalConfirmationRec: null,
  repairEstDays: "",
  repairInst: null,
  repairAuth: null,
  estimationReceived: null,
  repairStart: null,
  repairCompleted: null,
};

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

const mapRepairDataToFormValues = (
  data: any,
): Partial<RepairCostFormValues> => ({
  labour: toText(data?.labour),
  paintMaterials: toText(data?.paint_material),
  parts: toText(data?.parts),
  specialistCost: toText(data?.miscellaneous),
  jobHire: toText(data?.job_hire),
  subTotal: toText(data?.sub_total),
  vat: toText(data?.vat),
  totalIncVat: toText(data?.total_inc_vat),
  cilTotalReceived: toText(data?.cil_total_received),
  actualRepairParts: toText(data?.actual_repair_costs_parts),
  actualRepairLabour: toText(data?.actual_repair_costs_labour),
  netCilAmount: toText(data?.net_cil_amount),
  cilAgreed: Boolean(data?.cil_agreed),
  roadworthyCilFeeAgreed: Boolean(data?.if_roadworthy_cil_fee_agreed),
  agreementReceived: toCalendarDate(data?.agreement_received),
  engRepSentToTPI: toCalendarDate(data?.eng_rep_sent_tpi),
  cilChequeReceived: toCalendarDate(data?.cil_cheque_request),
  cilChequeSentToCL: toCalendarDate(data?.cil_cheque_sent_cl),
  cilRemovalConfirmationRec: toCalendarDate(
    data?.cil_removal_confirmation_received,
  ),
  repairEstDays: toText(data?.repair_est_days),
  repairInst: toCalendarDate(data?.repair_inst),
  repairAuth: toCalendarDate(data?.repair_auth),
  estimationReceived: toCalendarDate(data?.estimated_received),
  repairStart: toCalendarDate(data?.repair_start),
  repairCompleted: toCalendarDate(data?.repair_completed),
});

const buildPayload = (values: RepairCostFormValues, claimId: number) => ({
  claim_id: claimId,
  tenant_id: 1,
  labour: toNumber(values.labour),
  paint_material: toNumber(values.paintMaterials),
  parts: toNumber(values.parts),
  miscellaneous: toNumber(values.specialistCost),
  job_hire: toNumber(values.jobHire),
  sub_total: toNumber(values.subTotal),
  vat: toNumber(values.vat),
  total_inc_vat: toNumber(values.totalIncVat),
  cil_total_received: toNumber(values.cilTotalReceived),
  actual_repair_costs_parts: toNumber(values.actualRepairParts),
  actual_repair_costs_labour: toNumber(values.actualRepairLabour),
  net_cil_amount: toNumber(values.netCilAmount),
  cil_agreed: values.cilAgreed,
  if_roadworthy_cil_fee_agreed: values.roadworthyCilFeeAgreed,
  agreement_received: formatCalendarDate(values.agreementReceived),
  eng_rep_sent_tpi: formatCalendarDate(values.engRepSentToTPI),
  cil_cheque_request: formatCalendarDate(values.cilChequeReceived),
  cil_cheque_sent_cl: formatCalendarDate(values.cilChequeSentToCL),
  cil_removal_confirmation_received: formatCalendarDate(
    values.cilRemovalConfirmationRec,
  ),
  repair_est_days: toNumber(values.repairEstDays),
  repair_inst: formatCalendarDate(values.repairInst),
  repair_auth: formatCalendarDate(values.repairAuth),
  estimated_received: formatCalendarDate(values.estimationReceived),
  repair_start: formatCalendarDate(values.repairStart),
  repair_completed: formatCalendarDate(values.repairCompleted),
});

const RepairCostRouteModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  engineer_report_received?: any;
  claimId?: string | null;
}> = ({ isOpen, onClose, engineer_report_received, claimId: claimIdProp }) => {
  const claimId = useMemo(() => Number(claimIdProp), [claimIdProp]);
  const [repairRecordId, setRepairRecordId] = useState<number | null>(null);
  const [cilLoading, setCilLoading] = useState(false);
  const [clientCilLoading, setClientCilLoading] = useState(false);
console.log(repairRecordId);
  const formik = useFormik<RepairCostFormValues>({
    initialValues: emptyValues,
    enableReinitialize: false,
    onSubmit: async (values, helpers) => {
      if (!claimId) {
        toast.error("Claim ID is missing");
        return;
      }

      try {
        const payload = buildPayload(values, claimId);

        if (repairRecordId) {
          await updateCostRepair(claimId, payload);
          toast.success("Cost Repair Updated Successfully");
        } else {
          const response = await costRepairApi.createVehicleRepair(payload);
          setRepairRecordId(response?.id ?? response?.data?.id ?? null);
          toast.success("Cost Repair Created");
        }

        onClose();
      } catch (error) {
        console.error("Error saving repair cost:", error);
        toast.error("Failed to save repair cost");
      } finally {
        helpers.setSubmitting(false);
      }
    },
  });

  useEffect(() => {
    if (!isOpen || !claimId) return;

    const fetchData = async () => {
      try {
        const apiData = await getRepairData(claimId);
        const existingRecord = apiData?.data ?? apiData;

        if (existingRecord?.id) {
          setRepairRecordId(existingRecord.id);
        } else {
          setRepairRecordId(null);
        }

        const apiValues = existingRecord
          ? mapRepairDataToFormValues(existingRecord)
          : {};
        const ocrValues = engineer_report_received
          ? mapRepairDataToFormValues(engineer_report_received)
          : {};

        formik.setValues({
          ...emptyValues,
          ...apiValues,
          ...ocrValues,
        });
      } catch (error) {
        console.error("Error fetching repair cost:", error);
        setRepairRecordId(null);

        if (engineer_report_received) {
          formik.setValues({
            ...emptyValues,
            ...mapRepairDataToFormValues(engineer_report_received),
          });
        }
      }
    };

    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, claimId, engineer_report_received]);

  const downloadDocument = (blobData: BlobPart, fileName: string) => {
    const blob = new Blob([blobData], {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

const handleSendCILAgreement = async () => {
  if (!claimId) return toast.error("Claim ID is missing");

  setCilLoading(true);
  try {
    await sendCILAgreement(claimId);
    toast.success("CIL Agreement sent successfully");
  } catch (error: any) {
    toast.error(error?.response?.data?.detail || "Failed to send");
  } finally {
    setCilLoading(false);
  }
};

const handleSendCILClient = async () => {
  if (!claimId) return toast.error("Claim ID is missing");

  setClientCilLoading(true);
  try {
    await sendCILToClient(claimId);
    toast.success("CIL sent to client successfully");
  } catch (error: any) {
    toast.error(error?.response?.data?.detail || "Failed to send");
  } finally {
    setClientCilLoading(false);
  }
};const [tpiLoading, setTpiLoading] = useState(false);
const [fleetLoading, setFleetLoading] = useState(false);

const handleSendEngToTPI = async () => {
  if (!claimId) return;

  setTpiLoading(true);
  try {
    await sendEngReportToTPI(claimId);
    toast.success("Engineer report sent to TPI");
  } catch (e: any) {
    const detail = e?.response?.data?.detail || "";
    if (detail.toLowerCase().includes("recipient email is missing")) {
      toast.error(
        "TPI Direct Email is not set. Go to the Third Party Insurer section, enter the Direct Email, and save before sending.",
        { autoClose: 6000 }
      );
    } else {
      toast.error(detail || "Failed to send engineer report");
    }
  } finally {
    setTpiLoading(false);
  }
};

const handleFleetOffHire = async () => {
  if (!claimId) return;

  setFleetLoading(true);
  try {
    await instructFleetOffHireFromRepair(claimId);
    toast.success("Fleet instructed for off hire");
  } catch (e: any) {
    toast.error(e?.response?.data?.detail || "Failed");
  } finally {
    setFleetLoading(false);
  }
};
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-[100] p-10 font-['Stack_Sans_Headline']">
      <div className="card bg-white w-[1070px] h-full flex flex-col overflow-auto">
        <div className="w-full px-10 py-5 bg-white shadow-[0px_4px_20px_0px_rgba(0,0,0,0.08)] flex justify-between items-center sticky top-0 z-20">
          <h1 className="font-weight-600 text-[20px]">Repair Cost & Route</h1>
          <div className="flex gap-5">
            <button
              type="button"
              className="px-10 py-4 bg-white rounded border border-blue-600 text-blue-600 text-base font-weight-500 hover:bg-blue-50 transition-colors"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={formik.isSubmitting}
              className="px-10 py-4 bg-blue-500 rounded text-white text-base font-weight-500 hover:bg-blue-600 disabled:opacity-60 transition-colors"
              onClick={() => formik.handleSubmit()}
            >
              {formik.isSubmitting
                ? "Saving..."
                : repairRecordId
                  ? "Update"
                  : "Update"}
            </button>
          </div>
        </div>

        <div className="w-[788px] mx-auto mb-10">
          <Section title="Agreed Repair Costs as per Engineer’s Report">
            <CurrencyField label="Labour" name="labour" formik={formik} />
            <CurrencyField
              label="Paint/Materials"
              name="paintMaterials"
              formik={formik}
            />
            <CurrencyField label="Parts" name="parts" formik={formik} />
            <CurrencyField
              label="Specialist/Miscellaneous"
              name="specialistCost"
              formik={formik}
            />
            <CurrencyField label="Job Hire" name="jobHire" formik={formik} />
            <CurrencyField label="Sub Total" name="subTotal" formik={formik} />
            <CurrencyField label="VAT" name="vat" formik={formik} />
            <CurrencyField
              label="Total Inc VAT"
              name="totalIncVat"
              formik={formik}
            />
          </Section>

          <Section title="Actual Repair Costs">
            <CurrencyField
              label="CIL Total Received"
              name="cilTotalReceived"
              formik={formik}
            />
            <CurrencyField
              label="Actual Repair Costs Parts"
              name="actualRepairParts"
              formik={formik}
            />
            <CurrencyField
              label="Actual Repair Costs Labour"
              name="actualRepairLabour"
              formik={formik}
            />
            <CurrencyField
              label="Net CIL Amount"
              name="netCilAmount"
              formik={formik}
            />
          </Section>

          <Section title="Where the Repair Followed a CIL Settlement">
            <RadioGroup label="CIL Agreed?" name="cilAgreed" formik={formik} />
            <RadioGroup
              label="Roadworthy CIL Fee Agreed"
              name="roadworthyCilFeeAgreed"
              formik={formik}
            />
            <DateField
              label="Agreement Received"
              name="agreementReceived"
              formik={formik}
            />
            <DateField
              label="Eng. Rep. Sent to TPI"
              name="engRepSentToTPI"
              formik={formik}
            />
            <DateField
              label="CIL Cheque Received"
              name="cilChequeReceived"
              formik={formik}
            />
            <DateField
              label="CIL Cheque Sent to CL"
              name="cilChequeSentToCL"
              formik={formik}
            />
            <DateField
              label="CIL Removal Confirmation Rec"
              name="cilRemovalConfirmationRec"
              formik={formik}
            />

            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-5 mt-2">
              <button
                type="button"
                onClick={handleSendCILAgreement}
                disabled={cilLoading || clientCilLoading}
                className="w-full py-4 border border-blue-500 text-blue-500 rounded font-weight-500 hover:bg-blue-50 uppercase text-xs tracking-wide disabled:opacity-60"
              >
                {cilLoading ? "Generating..." : "CIL Agreement Letter"}
              </button>

              <button
                type="button"
                onClick={handleSendEngToTPI}
                disabled={tpiLoading}
                className="w-full py-4 border border-blue-500 text-blue-500 rounded font-weight-500 hover:bg-blue-50 uppercase text-xs tracking-wide"
              >
                {tpiLoading ? "Sending..." : "Eng Rep to TPI for Auth"}
              </button>
              <button
                type="button"
                onClick={handleSendCILClient}
                disabled={cilLoading || clientCilLoading}
                className="w-full py-4 border border-blue-500 text-blue-500 rounded font-weight-500 hover:bg-blue-50 uppercase text-xs tracking-wide disabled:opacity-60"
              >
                {clientCilLoading ? "Generating..." : "Send CIL to Client"}
              </button>

              <button
                type="button"
                onClick={handleFleetOffHire}
                disabled={fleetLoading}
                className="w-full py-4 border border-blue-500 text-blue-500 rounded font-weight-500 hover:bg-blue-50 uppercase text-xs tracking-wide disabled:opacity-60"
              >
                {fleetLoading ? "Sending..." : "Instruct Fleet to Off Hire"}
              </button>
            </div>
          </Section>

          <div className="p-5 rounded-lg border border-gray-100 flex flex-col gap-4 mt-6">
            <h2 className="text-neutral-900 text-[20px] font-weight-600">
              Repair Instruction Options
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 py-2">
              <button
                type="button"
                className="w-full py-4 border border-blue-500 text-blue-500 rounded font-weight-500 hover:bg-blue-50 text-sm"
              >
                Instruct Roadworthy to Arrange Hire
              </button>
              <button
                type="button"
                className="w-full py-4 border border-blue-500 text-blue-500 rounded font-weight-500 hover:bg-blue-50 text-sm"
              >
                Eng. Rep to TPI for Auth
              </button>
            </div>
          </div>

          <Section title="Where Repair Loss of Use Dates">
            <CurrencyField
              label="Repair Est. Days"
              name="repairEstDays"
              formik={formik}
            />
            <DateField label="Repair Inst." name="repairInst" formik={formik} />
            <DateField label="Repair Auth" name="repairAuth" formik={formik} />
            <DateField
              label="Estimation Received"
              name="estimationReceived"
              formik={formik}
            />
            <DateField
              label="Repair Start"
              name="repairStart"
              formik={formik}
            />
            <DateField
              label="Repair Completed"
              name="repairCompleted"
              formik={formik}
            />
          </Section>
        </div>
      </div>
    </div>
  );
};

const Section = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <div className="p-5 rounded-lg border border-gray-100 flex flex-col gap-4 mt-6">
    <h2 className="text-neutral-900 text-[20px] font-weight-600">{title}</h2>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6">
      {children}
    </div>
  </div>
);

const formatTwoDecimals = (value: any) => {
  if (value === "" || value === null || value === undefined) return "";
  const num = Number(value);
  if (Number.isNaN(num)) return value;
  return num.toFixed(2);
};

const CurrencyField = ({
  label,
  name,
  formik,
}: {
  label: string;
  name: keyof RepairCostFormValues;
  formik: any;
}) => (
  <div className="flex flex-col gap-2">
    <label className="text-gray-700 text-sm font-weight-500">{label}</label>
    <div className="relative">
      <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400">
        £
      </span>
      <input
        type="number"
        step="0.01"
        min="0"
        name={name}
        value={formik.values[name] ?? ""}
        onChange={formik.handleChange}
        onBlur={(e) => formik.setFieldValue(name, formatTwoDecimals(e.target.value))}
        className="w-full pl-10 pr-4 py-4 rounded border border-gray-200 outline-none transition-all focus:border-blue-500 hover:border-gray-300"
        placeholder="0.00"
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
  name: keyof RepairCostFormValues;
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

const RadioGroup = ({
  label,
  name,
  formik,
}: {
  label: string;
  name: keyof RepairCostFormValues;
  formik: any;
}) => (
  <div className="flex flex-col gap-4">
    <span className="text-gray-900 text-sm font-weight-500">{label}</span>
    <div className="flex gap-10">
      {[true, false].map((val) => (
        <label
          key={String(val)}
          className="flex items-center gap-2 cursor-pointer"
        >
          <div className="relative flex items-center justify-center">
            <input
              type="radio"
              name={name}
              className="sr-only"
              checked={formik.values[name] === val}
              onChange={() => formik.setFieldValue(name, val)}
            />
            {formik.values[name] === val ? <img src={Yes} /> : <img src={No} />}
          </div>
          <span className="text-black text-sm">{val ? "Yes" : "No"}</span>
        </label>
      ))}
    </div>
  </div>
);

export default RepairCostRouteModal;
