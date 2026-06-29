import React, { useEffect, useMemo, useRef, useState } from "react";
import { useFormik } from "formik";
import { toast } from "react-toastify";
import { getABIBHRCharges, saveABIBHRCharges, generatePaymentPack } from "../../../services/ABIBHRCharges/ABIBHRCharges";
import { getPlatingTotal } from "../../../services/PlatingCharges/PlatingCharges";
import { getStorageRecoveryProvider } from "../../../services/StorageRecovery/StorageRecovery";
import { gettingEnginerDetails } from "../../../services/EngineeringDetails/engineeringDetails";
import { getHireRecords } from "../../../services/HireDetail/HireDetails";
import { getHireProvidedVehicles } from "../../../services/Vehicle/vehicle";
import { getThirdPartyInsurer } from "../../../services/ThirdPartyInsurer/ThirdPartyInsurer";
import { getClientByClaimID } from "../../../services/Client/client";
import { getAccidentDetailById } from "../../../services/Accidents/accident";
import VehicleCards, { type ClaimVehicle } from "./VehicleCards";
import { CustomDatePicker } from "../Components/DatePicker";
import Vector6 from "../../../assets/AutoClaim_icon/Vector-6.svg";
import Plus from "../../../assets/AutoClaim_icon/Plus.svg";
import { SpinnerLoader } from "../../../components/common/SpinnerLoader";
import CreditHireInvoiceForm from "./CreditHireInvoiceForm";
import ABIHireBreakdownForm from "./ABIHireBreakdownForm";
import PlatingInvoiceForm from "./PlatingInvoiceForm";
import CoveringLetterForm from "./CoveringLetterForm";
import FrontCoverForm from "./FrontCoverForm";


// ─── helpers ───────────────────────────────────────────────────────────────────

const toF = (v: any): number => parseFloat(String(v ?? 0)) || 0;

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + "Z");
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function diffDays(dateStr: string): number {
  const base = new Date(dateStr + "Z");
  const now = new Date();
  return Math.max(0, Math.floor((now.getTime() - base.getTime()) / 86400000));
}

function fmt(n: number): string {
  return n === 0 ? "0.00" : n.toFixed(2);
}

function dateToISO(d: Date): string {
  return d.toISOString().slice(0, 10);
}

// ─── main component ────────────────────────────────────────────────────────────

const ABIBHRCharges = ({ paymentFormRef, claimId }: any) => {

  // ABI base rates (read-only, from hire records)
  // ABI hire = Σ(each vehicle's rate × its days). For one vehicle this is rate × days.
  const [abiDailyRate, setAbiDailyRate] = useState(0);
  const [abiExtraCharges, setAbiExtraCharges] = useState(0);
  const [abiAdminFee, setAbiAdminFee] = useState(0);
  const [bhrAdminFee, setBhrAdminFee] = useState(0);
  // Actual BHR hire = Σ(each vehicle's BHR rate × its days) — used by the BHR
  // section instead of surging the ABI rate by 35% (avoids a rounding mismatch).
  const [bhrHireSum, setBhrHireSum] = useState(0);
  const [bhrExtraCharges, setBhrExtraCharges] = useState(0);
  const [noOfDays, setNoOfDays] = useState(0);

  // Billed breakdown (auto-fetched, read-only)
  const [storageCharges, setStorageCharges] = useState(0);
  const [recoveryCharges, setRecoveryCharges] = useState(0);
  const [engineerCharges, setEngineerCharges] = useState(0);
  const [platingCharges, setPlatingCharges] = useState(0);

  // Per-vehicle hire records + the vehicle switcher cards. The Payment Pack
  // Charges sections show the selected vehicle; the Billed Breakdown stays total.
  const [hireRecords, setHireRecords] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<ClaimVehicle[]>([]);
  const [activeVehicle, setActiveVehicle] = useState(0);
  useEffect(() => {
    if (!claimId) return;
    getHireProvidedVehicles(claimId).then((vs) => setVehicles(Array.isArray(vs) ? vs : []));
  }, [claimId]);

  // Document-only claim data: policy number + insurer (TPI), client (Screen 3),
  // and incident date (accident details).
  useEffect(() => {
    if (!claimId) return;
    getThirdPartyInsurer(claimId)
      .then((res: any) => {
        setPolicyNumber(res?.data?.policy_number || "");
        setInsurerName(res?.data?.third_party_insurer?.first_name || "");
      })
      .catch(() => {});
    getClientByClaimID(claimId)
      .then((c: any) => setClientName([c?.first_name, c?.surname].filter(Boolean).join(" ")))
      .catch(() => {});
    getAccidentDetailById(Number(claimId))
      .then((a: any) => setIncidentDate(String(a?.date_time || "").split("T")[0]))
      .catch(() => {});
  }, [claimId]);

  // Logged-in user — signatory name is the part before the "@" in their email.
  const signatory = (() => {
    try {
      const u = JSON.parse(localStorage.getItem("user") || "{}");
      return String(u.email || "").split("@")[0] || "";
    } catch {
      return "";
    }
  })();
  const perVehicle = vehicles.length >= 2;

  // Date picker visibility state
  const [showRaisedPicker, setShowRaisedPicker] = useState(false);
  const [showSentPicker, setShowSentPicker] = useState(false);
  const [showPaidPicker, setShowPaidPicker] = useState(false);
  const [showPenaltyDue30Picker, setShowPenaltyDue30Picker] = useState(false);
  const [showPenaltyDue60Picker, setShowPenaltyDue60Picker] = useState(false);
  const [showPenaltyDue61Picker, setShowPenaltyDue61Picker] = useState(false);
  const [showPenaltyDue90Picker, setShowPenaltyDue90Picker] = useState(false);
  const raisedRef = useRef<HTMLDivElement>(null);
  const sentRef = useRef<HTMLDivElement>(null);
  const paidRef = useRef<HTMLDivElement>(null);
  const penaltyDue30Ref = useRef<HTMLDivElement>(null);
  const penaltyDue60Ref = useRef<HTMLDivElement>(null);
  const penaltyDue61Ref = useRef<HTMLDivElement>(null);
  const penaltyDue90Ref = useRef<HTMLDivElement>(null);
  const packMenuRef = useRef<HTMLDivElement>(null);

  const [penaltyDueDate30, setPenaltyDueDate30] = useState("");
  const [penaltyDueDate60, setPenaltyDueDate60] = useState("");
  const [penaltyDueDate61, setPenaltyDueDate61] = useState("");
  const [penaltyDueDate90, setPenaltyDueDate90] = useState("");

  const [isGenerating, setIsGenerating] = useState(false);
  // Confirmation popup that lists the pack contents before generating.
  const [showPackModal, setShowPackModal] = useState(false);
  // Credit Hire Invoice editable form screen (opened from the popup's first item).
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  // ABI Hire Breakdown editable form screen (popup's second item).
  const [showAbiBreakdown, setShowAbiBreakdown] = useState(false);
  // Plating Invoice editable form screen (popup's "Plating Invoice" item).
  const [showPlatingInvoice, setShowPlatingInvoice] = useState(false);
  // Front Cover editable form screen (popup's "Front Cover" item).
  const [showFrontCover, setShowFrontCover] = useState(false);
  // Covering Letter editable form screen (popup's "Covering Letter" item).
  const [showCoveringLetter, setShowCoveringLetter] = useState(false);

  // Claim data sourced for the documents (read-only).
  const [policyNumber, setPolicyNumber] = useState("");
  const [insurerName, setInsurerName] = useState("");
  const [clientName, setClientName] = useState("");
  const [incidentDate, setIncidentDate] = useState("");
  const [loading, setLoading] = useState(true);

  // Formik — only the Payment Pack Sent Detail fields are saved to DB
  const formik = useFormik({
    initialValues: {
      payment_pack_raised_date: "",
      payment_pack_sent_date: "",
      invoice_number: "",
      date_hire_paid: "",
    },
    onSubmit: async (values) => {
      if (!claimId) return;
      try {
        await saveABIBHRCharges({
          claim_id: Number(claimId),
          payment_pack_raised_date: values.payment_pack_raised_date || null,
          payment_pack_sent_date: values.payment_pack_sent_date || null,
          invoice_number: values.invoice_number || null,
          date_hire_paid: values.date_hire_paid || null,
        });
        toast.success("ABI & BHR charges saved");
      } catch {
        toast.error("Failed to save charges");
        throw new Error("save failed");
      }
    },
  });

  // Expose to parent so "Save & Next" works
  useEffect(() => {
    if (paymentFormRef) paymentFormRef.current = formik;
  }, [formik]);

  // Close date pickers when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (raisedRef.current && !raisedRef.current.contains(e.target as Node))
        setShowRaisedPicker(false);
      if (sentRef.current && !sentRef.current.contains(e.target as Node))
        setShowSentPicker(false);
      if (paidRef.current && !paidRef.current.contains(e.target as Node))
        setShowPaidPicker(false);
      if (penaltyDue30Ref.current && !penaltyDue30Ref.current.contains(e.target as Node))
        setShowPenaltyDue30Picker(false);
      if (penaltyDue60Ref.current && !penaltyDue60Ref.current.contains(e.target as Node))
        setShowPenaltyDue60Picker(false);
      if (penaltyDue61Ref.current && !penaltyDue61Ref.current.contains(e.target as Node))
        setShowPenaltyDue61Picker(false);
      if (penaltyDue90Ref.current && !penaltyDue90Ref.current.contains(e.target as Node))
        setShowPenaltyDue90Picker(false);
      if (packMenuRef.current && !packMenuRef.current.contains(e.target as Node))
        setShowPackModal(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Auto-set penalty due dates when raised date changes
  useEffect(() => {
    const rd = formik.values.payment_pack_raised_date;
    if (rd) {
      setPenaltyDueDate30(addDays(rd, 30));
      setPenaltyDueDate60(addDays(rd, 60));
      setPenaltyDueDate61(addDays(rd, 61));
      setPenaltyDueDate90(addDays(rd, 90));
    }
  }, [formik.values.payment_pack_raised_date]);

  // Load ABI/BHR rates from hire records
  useEffect(() => {
    if (!claimId) return;
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
        // ABI hire = sum of each vehicle's (its own rate × its own days).
        // e.g. (142.88 × 7) + (61.59 × 6) = 1369.70. One vehicle = rate × days.
        const abiHire = records.reduce((sum: number, r: any) => {
          const d = toF(r.final_total_no_of_hire_days ?? r.no_of_days_hire_so_far);
          return sum + d * toF(r.abi_hire_charge_per_day);
        }, 0);
        // BHR hire = Σ(each vehicle's BHR rate × its days) — the actual BHR rate.
        const bhrHire = records.reduce((sum: number, r: any) => {
          const d = toF(r.final_total_no_of_hire_days ?? r.no_of_days_hire_so_far);
          return sum + d * toF(r.bhr_hire_charge_per_day);
        }, 0);
        setAbiDailyRate(abiHire);
        setAbiExtraCharges(toF(first.abi_extra_charges_per_day));
        setAbiAdminFee(toF(first.abi_administration_fee));
        setBhrAdminFee(toF(first.bhr_administration_fee));
        setBhrHireSum(bhrHire);
        setBhrExtraCharges(toF(first.bhr_extra_charges_per_day));
        setNoOfDays(days);
      })
      .catch(() => {});
  }, [claimId]);

  // Load billed breakdown data from other screens
  useEffect(() => {
    if (!claimId) return;

    getStorageRecoveryProvider(claimId)
      .then(({ data }: any) => {
        const s = (data?.storages ?? []).reduce((sum: number, r: any) => sum + toF(r.total_storage_charges), 0);
        const r = (data?.recoveries ?? []).reduce((sum: number, r: any) => sum + toF(r.recovery_charges), 0);
        setStorageCharges(s);
        setRecoveryCharges(r);
      })
      .catch(() => {});

    gettingEnginerDetails(claimId)
      .then((data: any) => {
        setEngineerCharges(toF(data?.engineer_fee ?? data?.actual_fee));
      })
      .catch(() => {});

    getPlatingTotal(claimId)
      .then(({ data }: any) => {
        setPlatingCharges(toF(data?.total_plating_cost));
      })
      .catch(() => {});
  }, [claimId]);

  // Load saved Payment Pack Sent Detail
  useEffect(() => {
    if (!claimId) { setLoading(false); return; }
    getABIBHRCharges(claimId)
      .then(({ data }: any) => {
        if (!data) return;
        formik.setValues({
          payment_pack_raised_date: data.payment_pack_raised_date ?? "",
          payment_pack_sent_date: data.payment_pack_sent_date ?? "",
          invoice_number: data.invoice_number ?? "",
          date_hire_paid: data.date_hire_paid ?? "",
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [claimId]);

  // ── Generate Payment Pack ──────────────────────────────────────────────────
  const handleGeneratePaymentPack = async () => {
    if (!claimId || isGenerating) return;
    try {
      setIsGenerating(true);
      const response = await generatePaymentPack(claimId);
      const blob = new Blob([response.data], { type: "application/zip" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const disposition = response.headers?.["content-disposition"] ?? "";
      const match = disposition.match(/filename="([^"]+)"/);
      a.download = match ? match[1] : `PaymentPack_Claim${claimId}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      // Refresh the raised date field since the backend may have set it
      getABIBHRCharges(claimId)
        .then(({ data }: any) => {
          if (data?.payment_pack_raised_date) {
            formik.setFieldValue("payment_pack_raised_date", data.payment_pack_raised_date);
          }
        })
        .catch(() => {});

      toast.success("Payment pack generated and downloaded");
    } catch {
      toast.error("Failed to generate payment pack");
    } finally {
      setIsGenerating(false);
    }
  };

  // ── computed values ────────────────────────────────────────────────────────────
  const rd = formik.values.payment_pack_raised_date;

  const daysExpired = useMemo(() => (rd ? diffDays(rd) : null), [rd]);

  // ── Payment Pack Charges sections — values for the SELECTED vehicle ──────────
  // (For one vehicle, the per-vehicle value equals the total, so nothing changes.)
  const selRec = hireRecords[activeVehicle];
  const vDays = perVehicle && selRec
    ? toF(selRec.final_total_no_of_hire_days ?? selRec.no_of_days_hire_so_far)
    : noOfDays;
  const vAbiHire = perVehicle && selRec
    ? vDays * toF(selRec.abi_hire_charge_per_day)   // this vehicle's ABI hire
    : abiDailyRate;                                  // Σ across vehicles (single-vehicle)
  const vExtra = perVehicle && selRec ? toF(selRec.abi_extra_charges_per_day) : abiExtraCharges;

  // Admin charges are charged ONCE per claim → only the first vehicle card shows
  // them; every other card shows 0 (for the 0-30 / 10% / 20% and BHR sections).
  const isFirstCard = !perVehicle || activeVehicle === 0;
  const vAdmin = isFirstCard ? abiAdminFee : 0;
  const vBhrAdmin = isFirstCard ? bhrAdminFee : 0;

  // Other vehicles on the claim — printed under the edited vehicle in the
  // Credit Hire document (read-only), so multi-vehicle packs list every vehicle.
  const otherVehicleRows = vehicles
    .map((v, i) => ({ v, rec: hireRecords[i] as any, i }))
    .filter(({ i }) => i !== activeVehicle)
    .map(({ v, rec }) => ({
      vehicle: [(v as any)?.make, (v as any)?.model].filter(Boolean).join(" "),
      registration: (v as any)?.registration || rec?.registration_number || rec?.hire_vehicle_registration || "",
      hireStart: String(rec?.hire_start_date || rec?.hire_out || "").slice(0, 10),
      hireEnd: String(rec?.hire_back || "").slice(0, 10),
      days: rec ? toF(rec.final_total_no_of_hire_days ?? rec.no_of_days_hire_so_far) || "" : "",
    }));

  // 0-30 section (selected vehicle)
  const totalHire030 = vAbiHire + (vExtra * vDays) + vAdmin;

  // 31-60 section (+10%)
  const rate3160 = vAbiHire * 1.1;
  const extra3160 = vExtra * 1.1;
  const admin3160 = vAdmin * 1.1;
  const totalHire3160 = rate3160 + (extra3160 * vDays) + admin3160;

  // 61+ section (+20%)
  const rate61plus = vAbiHire * 1.2;
  const extra61plus = vExtra * 1.2;
  const admin61plus = vAdmin * 1.2;
  const totalHire61plus = rate61plus + (extra61plus * vDays) + admin61plus;

  // 90+ BHR — use the ACTUAL BHR rate × days (not the ABI rate surged by 35%),
  // which avoids a rounding mismatch (e.g. 1157.33 vs the correct 1157.34).
  const vBhrHire = perVehicle && selRec
    ? vDays * toF(selRec.bhr_hire_charge_per_day)
    : bhrHireSum;
  const vBhrExtra = perVehicle && selRec
    ? toF(selRec.bhr_extra_charges_per_day)
    : bhrExtraCharges;
  const bhrDailyRate = vBhrHire;
  const bhrExtra = vBhrExtra;
  const bhrAdmin = vBhrAdmin; // BHR administration fee — once per claim (first card only)
  const totalHire90 = bhrDailyRate + (bhrExtra * vDays) + bhrAdmin;

  // ── Billed Breakdown — totals across ALL vehicles (shown once, not per card) ──
  // Credit Hire = Σ(ABI rate × days) only — it must NOT include the admin fee,
  // because Total Outlay adds the admin fee separately (otherwise it's counted twice).
  const creditHireTotal = abiDailyRate + (abiExtraCharges * noOfDays);
  const totalOutlay =
    creditHireTotal + abiAdminFee + storageCharges + recoveryCharges + engineerCharges + platingCharges;

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div className="w-full mt-3 flex flex-col justify-start items-start gap-6 bg-white font-['Stack_Sans_Headline']">
      {loading && <SpinnerLoader />}

      {showInvoiceForm && (
        <CreditHireInvoiceForm
          onClose={() => setShowInvoiceForm(false)}
          prefill={{
            invoiceNumber: formik.values.invoice_number || "",
            invoiceDate: String(formik.values.payment_pack_raised_date || "").slice(0, 10),
            hireStart: String((selRec as any)?.hire_start_date || (selRec as any)?.hire_out || "").slice(0, 10),
            hireEnd: String((selRec as any)?.hire_back || "").slice(0, 10),
            totalHireDays: vDays || "",
            registration: (selRec as any)?.registration_number || (selRec as any)?.hire_vehicle_registration || "",
            make: (selRec as any)?.make || "",
            model: (selRec as any)?.model || "",
            basicHireDays: vDays || "",
            basicHireRate: selRec ? toF((selRec as any).abi_hire_charge_per_day) : (noOfDays ? abiDailyRate / noOfDays : undefined),
            basicHireAmount: vAbiHire,
            adminAmount: vAdmin || undefined,
            otherVehicles: otherVehicleRows,
            client: clientName || (selRec as any)?.client_name || "",
            billTo: clientName || (selRec as any)?.client_name || "",
          }}
        />
      )}

      {showAbiBreakdown && (
        <ABIHireBreakdownForm
          onClose={() => setShowAbiBreakdown(false)}
          vehicleGroups={vehicles.map((v) => (v as any).category).filter(Boolean) as string[]}
          prefill={{
            ourReference: formik.values.invoice_number || "",
            vehicleGroup: (selRec as any)?.actual_vehicle_category?.label || (selRec as any)?.vehicle_group || "",
            hireStart: String((selRec as any)?.hire_start_date || (selRec as any)?.hire_out || "").slice(0, 10),
            hireEnd: String((selRec as any)?.hire_back || "").slice(0, 10),
            totalHireDays: vDays || "",
            abiRatePerDay: selRec ? toF((selRec as any).abi_hire_charge_per_day) : (noOfDays ? abiDailyRate / noOfDays : undefined),
            extras: vExtra || undefined,
            vehicle: [(selRec as any)?.make, (selRec as any)?.model].filter(Boolean).join(" "),
            registration: (selRec as any)?.registration_number || (selRec as any)?.hire_vehicle_registration || "",
            dated: String(formik.values.payment_pack_raised_date || "").slice(0, 10),
          }}
        />
      )}

      {showPlatingInvoice && (
        <PlatingInvoiceForm
          onClose={() => setShowPlatingInvoice(false)}
          prefill={{
            invoiceNumber: formik.values.invoice_number || "",
            invoiceDate: String(formik.values.payment_pack_raised_date || "").slice(0, 10),
            registration: (selRec as any)?.registration_number || (selRec as any)?.hire_vehicle_registration || "",
            make: (selRec as any)?.make || "",
            model: (selRec as any)?.model || "",
            privateHirePlatingCosts: platingCharges || undefined,
            otherVehicles: otherVehicleRows.map((v) => ({ vehicle: v.vehicle, registration: v.registration })),
            client: clientName || (selRec as any)?.client_name || "",
            billTo: clientName || (selRec as any)?.client_name || "",
          }}
        />
      )}

      {showFrontCover && (
        <FrontCoverForm
          onClose={() => setShowFrontCover(false)}
          prefill={{
            yourInsured: insurerName,
            policyNumber,
            incidentDate,
            caseType: (vehicles.length || 1) > 1 ? "Multiple Vehicles" : "Single Vehicle",
            dated: String(formik.values.payment_pack_raised_date || dateToISO(new Date())).slice(0, 10),
          }}
        />
      )}

      {showCoveringLetter && (
        <CoveringLetterForm
          onClose={() => setShowCoveringLetter(false)}
          prefill={{
            ourReference: formik.values.invoice_number || "",
            ourClient: clientName || (selRec as any)?.client_name || "",
            yourInsured: insurerName,
            incidentDate,
            dated: String(formik.values.payment_pack_raised_date || dateToISO(new Date())).slice(0, 10),
            vehicleCount: vehicles.length || 1,
            valetingFee: 30,
            signatory,
          }}
        />
      )}

      <div className="w-full flex items-center justify-between">
        <h1 className="text-black text-2xl font-weight-600 leading-6">
          ABI &amp; BHR Charges
        </h1>
        <div className="relative" ref={packMenuRef}>
          <button
            type="button"
            onClick={() => setShowPackModal((v) => !v)}
            disabled={isGenerating}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-100 disabled:bg-blue-100 text-blue-500 text-sm font-weight-500 rounded transition-all"
          >
            {isGenerating ? (
              <>
                <svg
                  className="animate-spin w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8H4z"
                  />
                </svg>
                Generating...
              </>
            ) : (
              <>
              <img src={Plus} alt="" />
                Generate Payment Pack
              </>
            )}
          </button>

          {/* Anchored dropdown — lists what the Payment Pack contains. */}
          {showPackModal && (
            <div className="absolute right-0 top-full mt-2 z-50 p-6 bg-white rounded-lg shadow-xl inline-flex flex-col gap-3 min-w-[300px] border border-slate-100 font-['Stack_Sans_Headline']">
              {[
                { label: "Credit Hire Invoice", open: () => setShowInvoiceForm(true) },
                { label: "ABI Hire Breakdown", open: () => setShowAbiBreakdown(true) },
                { label: "Front Cover", open: () => setShowFrontCover(true) },
                { label: "Plating Invoice", open: () => setShowPlatingInvoice(true) },
                { label: "Covering Letter", open: () => setShowCoveringLetter(true) },
              ].map((item,index) => (
                <React.Fragment key={item.label}>
                
                  <div
                    className="text-blue-500 text-sm cursor-pointer hover:bg-slate-50 p-1"
                    onClick={() => { setShowPackModal(false); item.open(); }}
                  >
                    {item.label}
                  </div>
                  {index < 4 && <div className="h-px bg-slate-100 w-full" />}
                </React.Fragment>
              ))}
              {/* <div className="h-px bg-slate-100 w-full" /> */}
              {/* <button
                type="button"
                onClick={() => { setShowPackModal(false); handleGeneratePaymentPack(); }}
                disabled={isGenerating}
                className="mt-1 px-4 py-2 rounded bg-blue-500 text-white text-sm font-weight-500 hover:bg-blue-600 disabled:opacity-60"
              >
                Generate All
              </button> */}
            </div>
          )}
        </div>
      </div>
      {/* Section 1: Payment Pack Sent Detail */}
      <section className="self-stretch p-5 rounded-lg border border-neutral-100 flex flex-col justify-start items-start gap-4">
        <div className="w-full flex items-center justify-between">
          <h2 className="text-neutral-900 text-xl font-weight-600 leading-5">
            Payment Pack Sent Detail
          </h2>
        </div>
        <div className="self-stretch h-px bg-neutral-100" />

        <div className="w-full grid grid-cols-2 gap-5">
          <DatePickerField
            label="Payment Pack Raised Date"
            value={formik.values.payment_pack_raised_date}
            onSelect={(d) =>
              formik.setFieldValue("payment_pack_raised_date", dateToISO(d))
            }
            show={showRaisedPicker}
            containerRef={raisedRef}
            onToggle={() => setShowRaisedPicker((p) => !p)}
          />
          <DatePickerField
            label="Payment Pack Sent Date"
            value={formik.values.payment_pack_sent_date}
            onSelect={(d) =>
              formik.setFieldValue("payment_pack_sent_date", dateToISO(d))
            }
            show={showSentPicker}
            containerRef={sentRef}
            onToggle={() => setShowSentPicker((p) => !p)}
          />
        </div>

        <div className="w-full grid grid-cols-2 gap-5">
          {/* Auto-generated + stored by the backend (e.g. INV-202606-0022) — not editable. */}
          <ReadonlyField
            label="Invoice Number"
            value={formik.values.invoice_number || ""}
            symbol=""
          />
          <ReadonlyField
            label="Number of Hired Days"
            value={noOfDays ? String(noOfDays) : ""}
            symbol=""
          />
        </div>

        <div className="w-full grid grid-cols-2 gap-5">
          <DatePickerField
            label="Date Hire Paid"
            value={formik.values.date_hire_paid}
            onSelect={(d) =>
              formik.setFieldValue("date_hire_paid", dateToISO(d))
            }
            show={showPaidPicker}
            containerRef={paidRef}
            onToggle={() => setShowPaidPicker((p) => !p)}
          />
          <ReadonlyField
            label="Days Expired from Payment Required"
            value={daysExpired !== null ? String(daysExpired) : ""}
            symbol=""
            suffix=" days"
          />
        </div>
      </section>

      {/* Section 2: Payment Pack Charges */}
      <section className="self-stretch p-5 rounded-lg border border-neutral-100 flex flex-col justify-start items-start gap-4">
        <h2 className="self-stretch text-neutral-900 text-xl font-weight-600 leading-5">
          Payment Pack Charges
        </h2>

        {/* Vehicle switcher — sections below show the selected vehicle (2+ only) */}
        <VehicleCards
          vehicles={vehicles}
          activeIndex={activeVehicle}
          onSelect={setActiveVehicle}
        />

        {/* 0–30 Days */}
        <div className="self-stretch flex flex-col gap-4 mt-2">
          <h3 className="text-black text-base font-weight-600">
            ABI Charges (0–30 Days)
          </h3>
          <div className="self-stretch h-px bg-neutral-100" />
          <div className="w-full grid grid-cols-2 gap-5">
            <ReadonlyField label="Daily Rate (ABI)" value={fmt(vAbiHire)} />
            <ReadonlyField label="Extra Charges" value={fmt(vExtra)} />
          </div>
          <div className="w-full grid grid-cols-2 gap-5">
            <ReadonlyField label="Admin Charges" value={fmt(vAdmin)} />
            <ReadonlyField label="Total Hire Charge" value={fmt(totalHire030)} />
          </div>
          <div className="w-full grid grid-cols-2 gap-5">
            <ReadonlyField label="Penalty Due Date" value={penaltyDueDate30} symbol="" />
          </div>
        </div>

        {/* 31–60 Days (+10%) */}
        <div className="self-stretch flex flex-col gap-4 mt-4">
          <h3 className="text-black text-base font-weight-600">
            31–60 Days Charges (+10%)
          </h3>
          <div className="self-stretch h-px bg-neutral-100" />
          <div className="w-full grid grid-cols-2 gap-5">
            <ReadonlyField label="Daily Rate (ABI)" value={fmt(rate3160)} />
            <ReadonlyField label="Extra Charges" value={fmt(extra3160)} />
          </div>
          <div className="w-full grid grid-cols-2 gap-5">
            <ReadonlyField label="Admin Charges" value={fmt(admin3160)} />
            <ReadonlyField label="Total Hire Charge" value={fmt(totalHire3160)} />
          </div>
          <div className="w-full grid grid-cols-2 gap-5">
            <ReadonlyField label="Penalty Due Date" value={penaltyDueDate60} symbol="" />
          </div>
        </div>

        {/* 61+ Days (+20%) */}
        <div className="self-stretch flex flex-col gap-4 mt-4">
          <h3 className="text-black text-base font-weight-600">
            61+ Days Charges (+20%)
          </h3>
          <div className="self-stretch h-px bg-neutral-100" />
          <div className="w-full grid grid-cols-2 gap-5">
            <ReadonlyField label="Daily Rate (ABI)" value={fmt(rate61plus)} />
            <ReadonlyField label="Extra Charges" value={fmt(extra61plus)} />
          </div>
          <div className="w-full grid grid-cols-2 gap-5">
            <ReadonlyField label="Admin Charges" value={fmt(admin61plus)} />
            <ReadonlyField label="Total Hire Charge" value={fmt(totalHire61plus)} />
          </div>
          <div className="w-full grid grid-cols-2 gap-5">
            <ReadonlyField label="Penalty Due Date" value={penaltyDueDate61} symbol="" />
          </div>
        </div>

        {/* 90 Days + BHR (+35%) */}
        <div className="self-stretch flex flex-col gap-4 mt-4">
          <h3 className="text-black text-base font-weight-600">
            90 Days + BHR (35% Surge)
          </h3>
          <div className="self-stretch h-px bg-neutral-100" />
          <div className="w-full grid grid-cols-2 gap-5">
            <ReadonlyField label="Daily Rate (BHR)" value={fmt(bhrDailyRate)} />
            <ReadonlyField label="Extra Charges" value={fmt(bhrExtra)} />
          </div>
          <div className="w-full grid grid-cols-2 gap-5">
            <ReadonlyField label="Admin Charges" value={fmt(bhrAdmin)} />
            <ReadonlyField label="Total Hire Charge" value={fmt(totalHire90)} />
          </div>
          <div className="w-full grid grid-cols-2 gap-5">
            <ReadonlyField label="Penalty Due Date" value={penaltyDueDate90} symbol="" />
          </div>
        </div>
      </section>

      {/* Section 3: Billed Breakdown */}
      <section className="self-stretch p-5 rounded-lg border border-neutral-100 flex flex-col justify-start items-start gap-4 mb-10">
        <h2 className="self-stretch text-neutral-900 text-xl font-weight-600 leading-5">
          Billed Breakdown Section (ABI 30 days Rate)
        </h2>
        <div className="self-stretch h-px bg-neutral-100" />
        <div className="w-full grid grid-cols-2 gap-5">
          <ReadonlyField label="Credit Hire" value={fmt(creditHireTotal)} />
          <ReadonlyField label="Admin Charges" value={fmt(abiAdminFee)} />
        </div>
        <div className="w-full grid grid-cols-2 gap-5">
          <ReadonlyField label="Storage Charges" value={fmt(storageCharges)} />
          <ReadonlyField
            label="Recovery Charges"
            value={fmt(recoveryCharges)}
          />
        </div>
        <div className="w-full grid grid-cols-2 gap-5">
          <ReadonlyField
            label="Engineers Charges"
            value={fmt(engineerCharges)}
          />
          <ReadonlyField label="Plating Charges" value={fmt(platingCharges)} />
        </div>
        <div className="w-full grid grid-cols-2 gap-5">
          <ReadonlyField label="Total Outlay" value={fmt(totalOutlay)} />
        </div>
      </section>
    </div>
  );
};

// ─── reusable field components ─────────────────────────────────────────────────

interface ReadonlyFieldProps {
  label: string;
  value: string;
  symbol?: string;
  suffix?: string;
}

const ReadonlyField: React.FC<ReadonlyFieldProps> = ({ label, value, symbol = "£", suffix }) => (
  <div className="flex flex-col justify-start items-start gap-2">
    <label className="self-stretch text-neutral-700 text-sm font-weight-400 font-['Stack_Sans_Headline']">
      {label}
    </label>
    <div className="self-stretch px-5 py-4 bg-slate-50 rounded border border-neutral-200 flex justify-start items-center gap-2.5">
      {symbol !== "" && (
        <span className="text-neutral-400 text-base font-light leading-4 select-none">
          {symbol}
        </span>
      )}
      <span className="text-neutral-600 text-base font-light leading-4">
        {value ? `${value}${suffix ?? ""}` : "—"}
      </span>
    </div>
  </div>
);

interface DatePickerFieldProps {
  label: string;
  value: string;
  onSelect: (d: Date) => void;
  show: boolean;
  containerRef: React.RefObject<HTMLDivElement>;
  onToggle: () => void;
}

const DatePickerField: React.FC<DatePickerFieldProps> = ({
  label, value, onSelect, show, containerRef, onToggle,
}) => {
  const selectedDate = value ? new Date(value + "T00:00:00") : new Date();

  return (
    <div className="flex flex-col gap-2">
      <label className="text-neutral-700 text-[14px] font-weight-500">
        {label}
      </label>
      <div className="flex flex-col gap-2 relative" ref={containerRef}>
        <div
          onClick={onToggle}
          className="h-[52px] px-5 bg-white border border-gray-200 rounded flex items-center justify-between cursor-pointer"
        >
          <span className={value ? "text-gray-900" : "text-gray-400"}>
            {value || "Select Date"}
          </span>
          <img src={Vector6} alt="" />
        </div>
        {show && (
          <CustomDatePicker
            selectedDate={selectedDate}
            onDateSelect={(d) => { onSelect(d); onToggle(); }}
          />
        )}
      </div>
    </div>
  );
};

interface TextFieldProps {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
}

const TextField: React.FC<TextFieldProps> = ({ label, name, value, onChange, placeholder }) => (
  <div className="flex flex-col justify-start items-start gap-2">
    <label className="self-stretch text-neutral-700 text-sm font-weight-400 font-['Stack_Sans_Headline']">
      {label}
    </label>
    <div className="self-stretch px-5 py-4 bg-white rounded border border-neutral-200 flex justify-start items-center gap-2.5 focus-within:border-blue-500 transition-colors">
      <input
        type="text"
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full bg-transparent outline-none text-black text-base font-light leading-4 placeholder:text-neutral-300"
      />
    </div>
  </div>
);

export default ABIBHRCharges;
