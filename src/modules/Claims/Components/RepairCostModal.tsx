import React, { useEffect, useState } from "react";
import { X, Calendar, ChevronDown, CheckCircle2, Circle } from "lucide-react";
import { useFormik } from "formik";
import { costRepairApi, getRepairData, sendCILAgreement, sendCILAgreementClient, updateCostRepair } from "../../../services/RepairAndCost/RepairAndCost";
import { toast } from "react-toastify";
import type { CalendarDate } from "@internationalized/date";

const RepairCostRouteModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  engineer_report_received;
}> = ({ isOpen, onClose, engineer_report_received }) => {
  if (!isOpen) return null;
  const formatCalendarDate = (date?: CalendarDate) => {
    if (!date) return undefined;

    const jsDate = new Date(Date.UTC(date.year, date.month - 1, date.day));

    const year = jsDate.getUTCFullYear();
    const month = String(jsDate.getUTCMonth() + 1).padStart(2, "0");
    const day = String(jsDate.getUTCDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };
  const formik = useFormik({
    initialValues: {
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
      vehiclePaymentBeneficiary: "",
      repairInst: null,
      repairAuth: null,
      estimationReceived: null,
      repairStart: null,
      repairCompleted: null,
    },
    onSubmit: (values) => {
      const payload = {
        claim_id: Number(claimId),
        tenant_id: 1,
        labour: values.labour || 0,
        paint_material: values.paintMaterials || 0,
        parts: values.parts || 0,
        miscellaneous: values.specialistCost || 0,
        job_hire: values.jobHire || 0,
        sub_total: values.subTotal || 0,
        vat: values.vat || 0,
        total_inc_vat: values.totalIncVat || 0,
        cil_total_received: values.cilTotalReceived || 0,
        actual_repair_costs_parts: values.actualRepairParts || 0,
        actual_repair_costs_labour: values.actualRepairLabour || 0,
        net_cil_amount: values.netCilAmount || 0,
        cil_agreed: values.cilAgreed,
        if_roadworthy_cil_fee_agreed: values.roadworthyCilFeeAgreed,
        agreement_received: formatCalendarDate(values.agreementReceived),
        eng_rep_sent_tpi: formatCalendarDate(values.engRepSentToTPI),
        cil_cheque_request: formatCalendarDate(values.cilChequeReceived),
        cil_cheque_sent_cl: formatCalendarDate(values.cilChequeSentToCL),
        cil_removal_confirmation_received: formatCalendarDate(
          values.cilRemovalConfirmationRec,
        ),
        repair_est_days: values.vehiclePaymentBeneficiary,
        repair_inst: formatCalendarDate(values.repairInst),
        repair_auth: formatCalendarDate(values.repairAuth),
        estimated_received: formatCalendarDate(values.estimationReceived),
        repair_start: formatCalendarDate(values.repairStart),
        repair_completed: formatCalendarDate(values.repairCompleted),
      };
      let res;
      if (claimId) {
        res = costRepairApi.createVehicleRepair(payload);
        toast.success("Cost Repair Created");
      } else {
        res = updateCostRepair(parseInt(claimId), payload);
        toast.success("Cost Repair Updated Successfully");
      }
      onClose();
    },
  });
  const [fieldError, setFieldError] = useState({});

  const [salvageCollected, setSalvageCollected] = useState(true);
  const claimId = localStorage.getItem("claimId");
  console.log(engineer_report_received);
  console.log(formik.values);
  useEffect(() => {
    if (engineer_report_received) {
      formik.setValues((prev) => ({
        ...prev,
        labour: engineer_report_received?.labour || "",
        paintMaterials: engineer_report_received?.paint_material || "",
        parts: engineer_report_received?.parts || "",
        specialistCost: engineer_report_received?.miscellaneous || "",
        jobHire: engineer_report_received?.job_hire || "",
        subTotal: engineer_report_received?.sub_total || "",
        vat: engineer_report_received?.vat || "",
        totalIncVat: engineer_report_received?.total_inc_vat || "",
      }));

      const newErrors: Record<string, string> = {};

      if (!engineer_report_received?.engineer_fee) {
        newErrors["labour"] = "Low confidence OCR result - please verify.";
      }
      if (!engineer_report_received?.paint_material) {
        newErrors["paintMaterials"] =
          "Low confidence OCR result - please verify.";
      }
      if (!engineer_report_received?.parts) {
        newErrors["parts"] = "Low confidence OCR result - please verify.";
      }
      if (!engineer_report_received?.miscellaneous) {
        newErrors["specialistCost"] =
          "Low confidence OCR result - please verify.";
      }
      if (!engineer_report_received?.job_hire) {
        newErrors["jobHire"] = "Low confidence OCR result - please verify.";
      }
      if (!engineer_report_received?.sub_total) {
        newErrors["subTotal"] = "Low confidence OCR result - please verify.";
      }
      if (!engineer_report_received?.vat) {
        newErrors["vat"] = "Low confidence OCR result - please verify.";
      }
      if (!engineer_report_received?.total_inc_vat) {
        newErrors["totalIncVat"] = "Low confidence OCR result - please verify.";
      }

      setFieldError(newErrors);
    }
  }, [engineer_report_received]);
  useEffect(() => {
    const fetchData = async () => {
      let apiData = null;
      if (claimId) {
        try {
          const response = await getRepairData(parseInt(claimId));
          apiData = response;
        } catch (err) {
          console.error("Error fetching repair cost:", err);
        }
      }

      // Merge: OCR overrides API
      // const mergedData = { ...apiData, ...engineer_report_received };
      // formik.setValues(mergedData); // update this function to use mergedData
    };

    fetchData();
  }, [claimId, engineer_report_received]);
      const [cilLoading, setCilLoading] = useState(false);
  const [clientCilLoading, setClientCilLoading] = useState(false);
      const [cilError, setCilError] = useState<string | null>(null);
  
      const handleSendCILAgreement = async () => {
        setCilLoading(true);
        setCilError(null);
        try {
          const res = await sendCILAgreement(parseInt(claimId));
  
          // Show success toast immediately
          toast.success("CIL Agreement generated successfully!");
  
          const blob = new Blob([res.data], {
            type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          });
  
          const link = document.createElement("a");
          link.href = URL.createObjectURL(blob);
          link.download = `CIL_Agreement_${
            new Date().toISOString().split("T")[0]
          }.doc`;
          document.body.appendChild(link);
          link.click();
  
          document.body.removeChild(link);
          URL.revokeObjectURL(link.href);
        } catch (e: any) {
          console.error("Error generating CIL Agreement:", e);
          toast.error("Failed to generate CIL Agreement");
          setCilError(e.message || "An error occurred");
        } finally {
          setCilLoading(false);
        }
      };
  
      const handleSendCILClient = async () => {
        setClientCilLoading(true);
        setCilError(null);
        try {
          const res = await sendCILAgreementClient(parseInt(claimId));
  
          // Show success toast immediately
          toast.success("Client CIL Agreement generated successfully!");
  
          const blob = new Blob([res.data], {
            type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          });
  
          const link = document.createElement("a");
          link.href = URL.createObjectURL(blob);
          link.download = `CIL_Agreement_Client_${
            new Date().toISOString().split("T")[0]
          }.doc`;
          document.body.appendChild(link);
          link.click();
  
          document.body.removeChild(link);
          URL.revokeObjectURL(link.href);
        } catch (e: any) {
          console.error("Error generating Client CIL Agreement:", e);
          toast.error("Failed to generate Client CIL Agreement");
          setCilError(e.message || "An error occurred");
        } finally {
          setClientCilLoading(false);
        }
      };
  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-[100] p-10">
      <div className="card  bg-white w-[1070px] h-full flex flex-col overflow-auto">
        {/* Modal Header */}
        <div
          data-layer="Header"
          className="w-[1070px] px-10 py-5 bg-white shadow-[0px_4px_20px_0px_rgba(0,0,0,0.08)] inline-flex justify-between items-center relative z-10"
        >
          <h1 className="font-weight-600"> Repair Cost & Route</h1>
          <div className="flex gap-5">
            <button
              className="px-10 py-4 bg-white rounded border border-blue-600 text-blue-600 text-base font-medium hover:bg-blue-50 transition-colors"
              onClick={onClose}
            >
              Cancel
            </button>
            <button className="px-10 py-4 bg-blue-500 rounded text-white text-base font-medium hover:bg-blue-600 transition-colors" onClick={()=>formik.handleSubmit()}>
              Update
            </button>
          </div>
        </div>
        {/* Modal Container */}

        <div className="w-full h-px bg-gray-100" />
        <div className="w-[788px] ms-40 mb-10">
          {/* Section 1: Agreed Repair Costs */}
          <div className="p-5 rounded-lg border border-gray-100 flex flex-col gap-4 mt-6">
            <h2 className="text-black text-xl font-semibold">
              Agreed Repair Costs as per Engineer’s Report
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6">
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
              <CurrencyField
                label="Sub Total"
                name="subTotal"
                formik={formik}
                isReadOnly
              />
              <CurrencyField label="VAT" name="vat" formik={formik} />
              <CurrencyField
                label="Total Inc VAT"
                name="totalIncVat"
                formik={formik}
                isReadOnly
              />
            </div>
          </div>

          {/* Section 2: Actual Repair Costs */}
          <div className="p-5 rounded-lg border border-gray-100 flex flex-col gap-4 mt-6">
            <h2 className="text-black text-xl font-semibold">
              Actual Repair Costs
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6">
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
            </div>
          </div>

          {/* Section 3: CIL Settlement */}
          <div className="p-5 rounded-lg border border-gray-100 flex flex-col gap-4 mt-6">
            <h2 className="text-black text-xl font-semibold">
              Where the Repair Followed a CIL Settlement
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6">
              <RadioGroup
                label="CIL Agreed?"
                name="cilAgreed"
                formik={formik}
              />
              <RadioGroup
                label="Roadworthy CIL Fee Agreed:"
                name="roadworthyCilFeeAgreed"
                formik={formik}
              />
              <DateField
                label="Agreement Received:"
                name="agreementReceived"
                formik={formik}
              />
              <DateField
                label="Eng. Rep. Sent to TP"
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
            </div>
            {/* Action Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-6">
              {[
                "CIL Agreement Letter",
                "Eng Rep to TPI for Auth",
                "Send CIL to Client",
                "Instruct Fleet to Off Hire",
              ].map((btn,index) => (
                <button
                  key={btn}
                  onClick={() => { if (btn === "CIL Agreement Letter") {
                    console.log("working")
                    handleSendCILAgreement();
                  } else if (btn === "Send CIL to Client") {
                    handleSendCILClient();
                              console.log("working1");
                  } }}
                  disabled={clientCilLoading || cilLoading}
                  type="button"
                  className="w-full py-4 border border-blue-600 text-blue-600 rounded font-medium hover:bg-blue-50 uppercase text-xs tracking-wide"
                >
                  {btn}
                </button>
              ))}
            </div>
          </div>

          {/* Section 4: Instruction Options */}
          <div className="p-5 rounded-lg border border-gray-100 flex flex-col gap-4 mt-6">
            <h2 className="text-black text-xl font-semibold">
              Repair Instruction Options
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 py-2">
              <button
                type="button"
                className="w-full py-4 border border-blue-600 text-blue-600 rounded font-medium hover:bg-blue-50 text-sm"
              >
                Instruct Roadworthy to Arrange Hire
              </button>
              <button
                type="button"
                className="w-full py-4 border border-blue-600 text-blue-600 rounded font-medium hover:bg-blue-50 text-sm"
              >
                Eng. Rep to TPI for Auth
              </button>
            </div>
          </div>

          {/* Section 5: Loss of Use */}
          <div className="p-5 rounded-lg border border-gray-100 flex flex-col gap-4 mt-6">
            <h2 className="text-black text-xl font-semibold">
              Where Repair Loss of Use Dates
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6">
              <CurrencyField
                label="Repair Est. Days"
                name="vehiclePaymentBeneficiary"
                formik={formik}
              />
              <DateField
                label="Repair Inst."
                name="repairInst"
                formik={formik}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Reusable Internal Components ---

const CurrencyField = ({
  label,
  name,
  formik,
  isReadOnly,
}: {
  label: string;
  name: string;
  formik: any;
  isReadOnly?: boolean;
}) => (
  <div className="flex flex-col gap-2">
    <label className="text-gray-700 text-sm font-medium">{label}</label>
    <div className="relative">
      <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400">
        £
      </span>
      <input
        type="number"
        name={name}
        value={formik.values[name] || ""}
        onChange={formik.handleChange}
        readOnly={isReadOnly}
        className={`w-full pl-10 pr-4 py-4 rounded border border-gray-200 outline-none transition-all ${isReadOnly ? "bg-gray-50 text-gray-400 cursor-not-allowed" : "focus:border-blue-500 hover:border-gray-300"}`}
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
  name: string;
  formik: any;
}) => (
  <div className="flex flex-col gap-2">
    <label className="text-gray-700 text-sm font-medium">{label}</label>
    <div className="relative">
      <input
        type="date"
        name={name}
        value={formik.values[name] || ""}
        onChange={formik.handleChange}
        className="w-full px-5 py-4 rounded border border-gray-200 outline-none focus:border-blue-500 hover:border-gray-300"
      />
      <Calendar className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-300 pointer-events-none" />
    </div>
  </div>
);

const RadioGroup = ({
  label,
  name,
  formik,
}: {
  label: string;
  name: string;
  formik: any;
}) => (
  <div className="flex flex-col gap-4">
    <span className="text-gray-900 text-sm font-medium">{label}</span>
    <div className="flex gap-10">
      {[true, false].map((val) => (
        <button
          key={String(val)}
          type="button"
          onClick={() => formik.setFieldValue(name, val)}
          className="flex items-center gap-3"
        >
          <div
            className={`w-6 h-6 rounded-full border flex items-center justify-center transition-all ${formik.values[name] === val ? "border-blue-500 bg-blue-50" : "border-gray-300"}`}
          >
            {formik.values[name] === val && (
              <div className="w-2.5 h-2.5 bg-blue-500 rounded-full" />
            )}
          </div>
          <span className="text-sm text-gray-700 font-medium">
            {val ? "Yes" : "No"}
          </span>
        </button>
      ))}
    </div>
  </div>
);

export default RepairCostRouteModal;