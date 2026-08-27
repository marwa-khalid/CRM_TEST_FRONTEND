import React, { useEffect, useMemo, useRef, useState } from "react";
import { useFormik } from "formik";
import { toast } from "react-toastify";
import { getABIBHRCharges, saveABIBHRCharges, generatePaymentPack } from "../../../services/ABIBHRCharges/ABIBHRCharges";
import { getPlatingTotal, getPlatingCharges } from "../../../services/PlatingCharges/PlatingCharges";
import { getStorageRecoveryProvider } from "../../../services/StorageRecovery/StorageRecovery";
import { gettingEnginerDetails } from "../../../services/EngineeringDetails/engineeringDetails";
import { getHireRecords } from "../../../services/HireDetail/HireDetails";
import { getActualVehicleCategory } from "../../../services/HireDetail/HireDetails";
import { getRepairData } from "../../../services/RepairAndCost/RepairAndCost";
import { getHireProvidedVehicles } from "../../../services/Vehicle/vehicle";
import { getCheckoutDetails } from "../../../services/HireVehicleProvided/HireVehicleProvided";
import { getThirdPartyInsurer } from "../../../services/ThirdPartyInsurer/ThirdPartyInsurer";
import { getClientByClaimID } from "../../../services/Client/client";
import { getAccidentDetailById } from "../../../services/Accidents/accident";
import { getCaseReference } from "../../../services/Claims/Claims";
import VehicleCards, { type ClaimVehicle } from "./VehicleCards";
import { CustomDatePicker } from "../Components/DatePicker";
import Vector6 from "../../../assets/AutoClaim_icon/Vector-6.svg";
import Plus from "../../../assets/AutoClaim_icon/Plus.svg";
import { SpinnerLoader } from "../../../claims/common/SpinnerLoader";
import CreditHireInvoiceForm from "./CreditHireInvoiceForm";
import ABIHireBreakdownForm from "./ABIHireBreakdownForm";
import PlatingInvoiceForm from "./PlatingInvoiceForm";
import CoveringLetterForm from "./CoveringLetterForm";
import FrontCoverForm from "./FrontCoverForm";
import { PackSidebar, PackSidebarContext } from "./paymentPackUi";
import HirePeriodValidationForm from "./HirePeriodValidationForm";
import StorageRecoveryInvoiceForm from "./StorageRecoveryInvoiceForm";
import { useCurrentUser } from "../../../context/AuthContext";


// ─── helpers ───────────────────────────────────────────────────────────────────

const toF = (v: any): number => parseFloat(String(v ?? 0)) || 0;

const fullName = (...parts: any[]) =>
  parts
    .map((part) => String(part ?? "").trim())
    .filter(Boolean)
    .join(" ");

const thirdPartyInsurerName = (insurer: any) =>
  fullName(insurer?.company_name, insurer?.first_name, insurer?.surname);

const thirdPartyInsurerBillTo = (insurer: any) =>
  [
    thirdPartyInsurerName(insurer),
    insurer?.address?.address,
    insurer?.address?.postcode,
  ]
    .map((part) => String(part ?? "").trim())
    .filter(Boolean)
    .join("\n");

type PlatingLine = {
  privateHireMot: number;
  privateHirePlatingCosts: number;
  hasValues: boolean;
};

const hasChargeValue = (v: any) => v !== undefined && v !== null && v !== "";

const parsePlatingLine = (data: any): PlatingLine => ({
  privateHireMot: toF(data?.private_hire_mot_cost),
  privateHirePlatingCosts: toF(data?.private_hire_plating_fee),
  hasValues:
    hasChargeValue(data?.private_hire_mot_cost) ||
    hasChargeValue(data?.private_hire_plating_fee),
});


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
  const { user } = useCurrentUser();

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
  const [storageInvoiceRows, setStorageInvoiceRows] = useState<any[]>([]);
  const [recoveryInvoiceRows, setRecoveryInvoiceRows] = useState<any[]>([]);
  const [engineerCharges, setEngineerCharges] = useState(0);
  const [platingCharges, setPlatingCharges] = useState(0);
  const [valetingCharges, setValetingCharges] = useState(0);

  // Per-vehicle hire records + the vehicle switcher cards. The Payment Pack
  // Charges sections show the selected vehicle; the Billed Breakdown stays total.
  const [hireRecords, setHireRecords] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<ClaimVehicle[]>([]);
  const [activeVehicle, setActiveVehicle] = useState(0);
  useEffect(() => {
    if (!claimId) return;
    getHireProvidedVehicles(claimId).then((vs) => setVehicles(Array.isArray(vs) ? vs : []));
    getCheckoutDetails(claimId)
      .then((res: any) => {
        const checks = Array.isArray(res?.data) ? res.data : [];
        setValetingCharges(
          checks.reduce((sum: number, check: any) => sum + toF(check?.valet_charges), 0),
        );
      })
      .catch(() => setValetingCharges(0));
  }, [claimId]);

  // Only OFF-HIRED vehicles belong in the payment pack — a vehicle still on hire
  // has no end date, so its hire days can't be finalised and it isn't billed
  // yet. Pair each provided vehicle with its hire record (by index) and keep the
  // ones whose hire has ended; the whole pack then operates on these only.
  const packPairs = useMemo(
    () =>
      vehicles
        .map((v, i) => ({ v, rec: hireRecords[i] }))
        .filter(
          ({ rec }) =>
            Boolean(rec?.hire_back || rec?.hire_end_date) ||
            toF(rec?.final_total_no_of_hire_days) > 0,
        ),
    [vehicles, hireRecords],
  );
  const packVehicles = packPairs.map((p) => p.v) as ClaimVehicle[];
  const packRecords = packPairs.map((p) => p.rec);
  const packVehicleIds = packVehicles
    .map((v: any, i) => String(v?.id ?? `idx-${i}`))
    .join("|");

  // Document-only claim data: policy number + insurer (TPI), client (Screen 3),
  // and incident date (accident details).
  useEffect(() => {
    if (!claimId) return;
    getThirdPartyInsurer(claimId)
      .then((res: any) => {
        const insurer = res?.data?.third_party_insurer;
        const thirdParty = res?.data?.third_party;
        setPolicyNumber(res?.data?.policy_number || "");
        setInsurerName(thirdPartyInsurerName(insurer));
        setInsurerBillTo(thirdPartyInsurerBillTo(insurer));
        setInsurerReference(res?.data?.insurer_reference || "");
        // Your Insured = Third Party name (first section); Bill To stays the TP insurer above.
        setThirdPartyName(fullName(thirdParty?.first_name, thirdParty?.surname));
      })
      .catch(() => {});
    getClientByClaimID(claimId)
      .then((c: any) => setClientName([c?.first_name, c?.surname].filter(Boolean).join(" ")))
      .catch(() => {});
    getAccidentDetailById(Number(claimId))
      .then((a: any) => setIncidentDate(String(a?.date_time || "").split("T")[0]))
      .catch(() => {});
    getCaseReference(claimId)
      .then((ref: string) => setCaseReference(ref || ""))
      .catch(() => {});
  }, [claimId]);

  const signatory =
    user?.name ||
    user?.email?.split("@")[0] ||
    (localStorage.getItem("pendingLoginEmail") || "").split("@")[0] ||
    "";
  const perVehicle = packVehicles.length >= 2;

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
  // Raised-date picker shown inside the "Generate Payment Pack" dropdown — this
  // date drives the debtors age analysis (aged from the settlement date).
  const [showPackDatePicker, setShowPackDatePicker] = useState(false);
  const packDateRef = useRef<HTMLDivElement>(null);

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
  // Hire Period Validation editable form screen (popup's "Hire Period" item).
  const [showHirePeriod, setShowHirePeriod] = useState(false);
  // Storage and Recovery Invoice editable form screen.
  const [showStorageRecoveryInvoice, setShowStorageRecoveryInvoice] = useState(false);
  // Which pack document is currently *visible* in the overlay. The show* flags above
  // stay true once a document has been opened (kept mounted, just hidden), so its
  // edits survive switching to another document and back.
  const [activeDoc, setActiveDoc] = useState<string | null>(null);

  // Claim data sourced for the documents (read-only).
  const [policyNumber, setPolicyNumber] = useState("");
  const [insurerName, setInsurerName] = useState("");
  const [insurerBillTo, setInsurerBillTo] = useState("");
  // "Your Insured" on the pack = the Third Party (the at-fault driver the TP insurer covers),
  // taken from the Third Party Insurer screen's first section (third_party), NOT the insurer.
  const [thirdPartyName, setThirdPartyName] = useState("");
  const [insurerReference, setInsurerReference] = useState("");
  const [clientName, setClientName] = useState("");
  const [incidentDate, setIncidentDate] = useState("");
  const [caseReference, setCaseReference] = useState("");
  const [platingMot, setPlatingMot] = useState(0);
  const [platingFee, setPlatingFee] = useState(0);
  const [platingByVehicle, setPlatingByVehicle] = useState<Record<string, PlatingLine>>({});
  const [automaticCharge, setAutomaticCharge] = useState(5);
  const [repairCost, setRepairCost] = useState(0);
  const [vehicleCatMap, setVehicleCatMap] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);

  // Formik — only the Payment Pack Sent Detail fields are saved to DB
  const raisedDateSavePromiseRef = useRef<Promise<string> | null>(null);
  const raisedDateValueRef = useRef("");
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

  useEffect(() => {
    raisedDateValueRef.current = formik.values.payment_pack_raised_date || "";
  }, [formik.values.payment_pack_raised_date]);

  const ensurePaymentPackRaisedDate = async () => {
    const existing =
      raisedDateValueRef.current || formik.values.payment_pack_raised_date;
    if (existing) return existing;

    if (raisedDateSavePromiseRef.current) {
      return raisedDateSavePromiseRef.current;
    }

    const today = dateToISO(new Date());
    raisedDateValueRef.current = today;
    formik.setFieldValue("payment_pack_raised_date", today, false);

    if (!claimId) return today;

    raisedDateSavePromiseRef.current = saveABIBHRCharges({
      claim_id: Number(claimId),
      payment_pack_raised_date: today,
      payment_pack_sent_date: formik.values.payment_pack_sent_date || null,
      invoice_number: formik.values.invoice_number || null,
      date_hire_paid: formik.values.date_hire_paid || null,
    })
      .then(() => today)
      .catch(() => {
        toast.error("Failed to save payment pack raised date");
        return today;
      })
      .finally(() => {
        raisedDateSavePromiseRef.current = null;
      });

    return raisedDateSavePromiseRef.current;
  };

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
        const allRecords: any[] = Array.isArray(data) ? data : [];
        setHireRecords(allRecords);
        // Only OFF-HIRED records are billed: no end date ⇒ no finalised days, so
        // on-hire vehicles contribute nothing (no "days so far" fallback either).
        const records = allRecords.filter(
          (r: any) =>
            Boolean(r?.hire_back || r?.hire_end_date) ||
            toF(r?.final_total_no_of_hire_days) > 0,
        );
        const first = records[0];
        if (!first) return;
        // Total days = sum of every off-hired vehicle's finalised hire days
        const days = records.reduce(
          (sum: number, r: any) => sum + toF(r.final_total_no_of_hire_days),
          0,
        );
        // ABI hire = sum of each vehicle's (its own rate × its own days).
        // e.g. (142.88 × 7) + (61.59 × 6) = 1369.70. One vehicle = rate × days.
        const abiHire = records.reduce((sum: number, r: any) => {
          const d = toF(r.final_total_no_of_hire_days);
          return sum + d * toF(r.abi_hire_charge_per_day);
        }, 0);
        // BHR hire = Σ(each vehicle's BHR rate × its days) — the actual BHR rate.
        const bhrHire = records.reduce((sum: number, r: any) => {
          const d = toF(r.final_total_no_of_hire_days);
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
        const storages = data?.storages ?? [];
        const recoveries = data?.recoveries ?? [];
        const s = storages.reduce((sum: number, r: any) => sum + toF(r.total_storage_charges), 0);
        const r = recoveries.reduce((sum: number, r: any) => sum + toF(r.recovery_charges), 0);
        setStorageCharges(s);
        setRecoveryCharges(r);
        setStorageInvoiceRows(storages);
        setRecoveryInvoiceRows(recoveries);
      })
      .catch(() => {
        setStorageInvoiceRows([]);
        setRecoveryInvoiceRows([]);
      });

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

    // Plating invoice line items (MOT + plating fee) — from the Plating screen.
    getPlatingCharges(claimId)
      .then(({ data }: any) => {
        setPlatingMot(toF(data?.private_hire_mot_cost));
        setPlatingFee(toF(data?.private_hire_plating_fee));
        setAutomaticCharge(
          data?.automatic !== undefined && data?.automatic !== null && data?.automatic !== ""
            ? toF(data.automatic)
            : 5,
        );
      })
      .catch(() => {});

    // Repair cost — sub total from the Repair Cost modal on the engineers screen.
    getRepairData(claimId)
      .then((apiData: any) => {
        const rec = apiData?.data ?? apiData;
        setRepairCost(toF(rec?.sub_total));
      })
      .catch(() => {});

    // Vehicle category lookup (id → label) for the ABI "Group" field.
    getActualVehicleCategory()
      .then(({ data }: any) => {
        const map: Record<number, string> = {};
        (Array.isArray(data) ? data : []).forEach((c: any) => { map[c.id] = c.label; });
        setVehicleCatMap(map);
      })
      .catch(() => {});
  }, [claimId]);

  useEffect(() => {
    if (!claimId || !packVehicles.length) {
      setPlatingByVehicle({});
      return;
    }

    let cancelled = false;

    Promise.all(
      packVehicles.map(async (vehicle: any, index) => {
        const key = String(vehicle?.id ?? `idx-${index}`);
        let values = parsePlatingLine(null);

        if (vehicle?.id != null) {
          try {
            const { data } = await getPlatingCharges(claimId, vehicle.id);
            values = parsePlatingLine(data);
          } catch {
            values = parsePlatingLine(null);
          }
        }

        // Older single-vehicle claims were saved at claim level before plating
        // became per-vehicle, so keep those values visible in the invoice form.
        if (!values.hasValues) {
          try {
            const { data } = await getPlatingCharges(claimId);
            const claimLevelValues = parsePlatingLine(data);
            if (claimLevelValues.hasValues) values = claimLevelValues;
          } catch {
            // Leave this vehicle empty if neither source has plating values.
          }
        }

        return [key, values] as const;
      }),
    ).then((entries) => {
      if (!cancelled) setPlatingByVehicle(Object.fromEntries(entries));
    });

    return () => {
      cancelled = true;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [claimId, packVehicleIds]);

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

  const handlePaymentPackEmailSent = (sentDate?: string) => {
    formik.setFieldValue(
      "payment_pack_sent_date",
      sentDate ? String(sentDate).slice(0, 10) : dateToISO(new Date()),
    );
  };

  // ── computed values ────────────────────────────────────────────────────────────
  const rd = formik.values.payment_pack_raised_date;

  const daysExpired = useMemo(() => (rd ? diffDays(rd) : null), [rd]);

  // ── Payment Pack Charges sections — values for the SELECTED vehicle ──────────
  // (For one vehicle, the per-vehicle value equals the total, so nothing changes.)
  const selRec = packRecords[activeVehicle];
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
  const otherVehicleRows = packVehicles
    .map((v, i) => ({ v, rec: packRecords[i] as any, i }))
    .filter(({ i }) => i !== activeVehicle)
    .map(({ v, rec }) => ({
      vehicle: [(v as any)?.make, (v as any)?.model].filter(Boolean).join(" "),
      registration: (v as any)?.registration || rec?.registration_number || rec?.hire_vehicle_registration || "",
      hireStart: String(rec?.hire_start_date || rec?.hire_out || "").slice(0, 10),
      hireEnd: String(rec?.hire_end_date || rec?.hire_back || "").slice(0, 10),
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

  // Covering Letter "Schedule of Charges" — claim-level value per head across the
  // rate periods: BHR (basic hire), <30 (ABI), 31–60 (+10% on ABI), 61+ (+20%).
  // Repair Cost / CDW / Collection & Delivery have no source in the charges model
  // yet, so they stay blank (still editable on the form).
  const coveringCharges = useMemo(() => {
    const out: Record<string, string> = {};
    (
      [
        { key: "basicHireRate", bhr: bhrHireSum, abi: abiDailyRate },
        { key: "administrationFee", bhr: bhrAdminFee, abi: abiAdminFee },
        { key: "repairCost", bhr: repairCost, abi: repairCost },
        { key: "storage", bhr: storageCharges, abi: storageCharges },
        { key: "recovery", bhr: recoveryCharges, abi: recoveryCharges },
        { key: "platingCosts", bhr: platingCharges, abi: platingCharges },
        { key: "engineersFee", bhr: engineerCharges, abi: engineerCharges },
        // CDW + Collection & Delivery: £60 in the BHR column only; other periods stay empty.
        { key: "cdw", bhr: 60, abi: 0 },
        { key: "collectionDeliveryFee", bhr: 60, abi: 0 },
      ] as const
    ).forEach((h) => {
      // Only Hire Amount + Administration Fee are topped up over the LPP periods;
      // every other head of claim stays flat across <30 / 31–60 / 61+.
      const topUp = h.key === "basicHireRate" || h.key === "administrationFee";
      if (h.bhr) out[`${h.key}_bhr`] = h.bhr.toFixed(2);
      if (h.abi) {
        out[`${h.key}_abi`] = h.abi.toFixed(2);
        out[`${h.key}_lpp10`] = (h.abi * (topUp ? 1.1 : 1)).toFixed(2);
        out[`${h.key}_lpp20`] = (h.abi * (topUp ? 1.2 : 1)).toFixed(2);
      }
    });
    return out;
  }, [bhrHireSum, abiDailyRate, bhrAdminFee, abiAdminFee, repairCost, storageCharges, recoveryCharges, platingCharges, engineerCharges]);

  // ── Per-vehicle prefills for the payment-pack forms ─────────────────────────
  // Each vehicle is fully editable inside the form; editing/deleting there never
  // touches the claim. One prefill per vehicle so the form can persist edits.
  const creditHirePrefills = packVehicles.map((v, i) => {
    const rec = packRecords[i] as any;
    const vv = v as any;
    const days = perVehicle && rec
      ? toF(rec.final_total_no_of_hire_days ?? rec.no_of_days_hire_so_far)
      : noOfDays;
    // Credit Hire is billed on the BHR (Basic Hire Rate), NOT the ABI rate — so
    // it uses the BHR daily rate, the BHR admin fee, and adds CDW + Collection &
    // Delivery (£60 each, same as the covering-letter BHR column). Claim-level
    // charges (admin, CDW, C&D) only sit on the first vehicle card.
    const bhrRate = rec ? toF(rec.bhr_hire_charge_per_day) : (noOfDays ? bhrHireSum / noOfDays : undefined);
    const bhrHire = perVehicle && rec ? days * toF(rec.bhr_hire_charge_per_day) : bhrHireSum;
    const firstCard = !perVehicle || i === 0;
    return {
      ourReference: caseReference,
      yourReference: insurerReference,
      invoiceNumber: formik.values.invoice_number || "",
      invoiceDate: String(formik.values.payment_pack_raised_date || "").slice(0, 10),
      client: clientName || rec?.client_name || "",
      billTo: insurerBillTo || insurerName,
      registration: vv?.registration || rec?.registration_number || rec?.hire_vehicle_registration || "",
      make: vv?.make || rec?.make || "",
      model: vv?.model || rec?.model || "",
      group:
        vehicleCatMap[rec?.actual_vehicle_category_id] ||
        rec?.actual_vehicle_category?.label ||
        rec?.vehicle_group || "",
      hireStart: String(rec?.hire_start_date || rec?.hire_out || "").slice(0, 10),
      hireEnd: String(rec?.hire_end_date || rec?.hire_back || "").slice(0, 10),
      totalHireDays: days || "",
      basicHireDays: days || "",
      basicHireRate: bhrRate,
      basicHireAmount: bhrHire,
      automaticDays: firstCard ? noOfDays : undefined,
      automaticRate: firstCard ? automaticCharge : undefined,
      automaticAmount: firstCard ? noOfDays * automaticCharge : undefined,
      cdwAmount: firstCard ? 60 : undefined,
      collectionAmount: firstCard ? 60 : undefined,
      adminAmount: firstCard ? (bhrAdminFee || 60) : undefined,
    };
  });

  const abiPrefills = packVehicles.map((v, i) => {
    const rec = packRecords[i] as any;
    const vv = v as any;
    const days = perVehicle && rec
      ? toF(rec.final_total_no_of_hire_days ?? rec.no_of_days_hire_so_far)
      : noOfDays;
    return {
      ourReference: caseReference,
      yourReference: insurerReference,
      vehicleGroup:
        vehicleCatMap[rec?.actual_vehicle_category_id] ||
        rec?.actual_vehicle_category?.label ||
        rec?.vehicle_group || "",
      hireStart: String(rec?.hire_start_date || rec?.hire_out || "").slice(0, 10),
      hireEnd: String(rec?.hire_end_date || rec?.hire_back || "").slice(0, 10),
      totalHireDays: days || "",
      abiRatePerDay: rec ? toF(rec.abi_hire_charge_per_day) : (noOfDays ? abiDailyRate / noOfDays : undefined),
      extras: (perVehicle && rec ? toF(rec.abi_extra_charges_per_day) : abiExtraCharges) || undefined,
      automatic: automaticCharge,
      vehicle: [vv?.make || rec?.make, vv?.model || rec?.model].filter(Boolean).join(" "),
      registration: vv?.registration || rec?.registration_number || rec?.hire_vehicle_registration || "",
      dated: String(formik.values.payment_pack_raised_date || "").slice(0, 10),
    };
  });

  const platingPrefills = packVehicles.map((v, i) => {
    const rec = packRecords[i] as any;
    const vv = v as any;
    const line = platingByVehicle[String(vv?.id ?? `idx-${i}`)];
    const mot = line?.hasValues ? line.privateHireMot : platingMot;
    const fee = line?.hasValues ? line.privateHirePlatingCosts : platingFee;
    return {
      ourReference: caseReference,
      yourReference: insurerReference,
      invoiceNumber: formik.values.invoice_number || "",
      invoiceDate: String(formik.values.payment_pack_raised_date || "").slice(0, 10),
      registration: vv?.registration || rec?.registration_number || rec?.hire_vehicle_registration || "",
      make: vv?.make || rec?.make || "",
      model: vv?.model || rec?.model || "",
      privateHireMot: mot || undefined,
      privateHirePlatingCosts: fee || undefined,
      client: clientName || rec?.client_name || "",
      billTo: insurerBillTo || insurerName,
    };
  });

  const storageRecoveryPrefill = {
    ourReference: caseReference,
    yourReference: insurerReference,
    invoiceNumber: formik.values.invoice_number || "",
    invoiceDate: String(formik.values.payment_pack_raised_date || "").slice(0, 10),
    client: clientName,
    billTo: insurerBillTo || insurerName,
    vehicleRegistration: packVehicles.map((v: any, i: number) => {
      const rec = packRecords[i] as any;
      return v?.registration || rec?.registration_number || rec?.hire_vehicle_registration || "";
    }).filter(Boolean).join("\n"),
    vehicleDescription: packVehicles.map((v: any, i: number) => {
      const rec = packRecords[i] as any;
      return [v?.make || rec?.make, v?.model || rec?.model].filter(Boolean).join(" ");
    }).filter(Boolean).join("\n"),
    storages: storageInvoiceRows.map((row: any) => ({
      provider: row?.storage_provider || row?.name || "",
      startDate: String(row?.start_date || "").slice(0, 10),
      endDate: String(row?.end_date || "").slice(0, 10),
      days: row?.total_storage_days ?? "",
      rate: row?.charge_per_day ?? "",
      amount: row?.total_storage_charges ?? "",
    })),
    recoveries: recoveryInvoiceRows.map((row: any) => ({
      provider: row?.recovery_provider || row?.name || "",
      recoveryDate: String(row?.date_of_recovery || "").slice(0, 10),
      amount: row?.recovery_charges ?? "",
    })),
  };

  // ── Payment Pack documents — one overlay, one persistent sidebar ─────────────
  // Each document is a full-screen PackScreen; the sidebar (rendered by PackScreen
  // via context) lets the user jump between them without closing/reopening. Only
  // one is ever open at a time, so opening one closes the rest.
  const PACK_DOCS = [
    { key: "frontCover", label: "Front Cover Information", show: showFrontCover, setShow: setShowFrontCover },
    { key: "coveringLetter", label: "Covering Letter", show: showCoveringLetter, setShow: setShowCoveringLetter },
    { key: "creditHire", label: "Credit Hire Invoice", show: showInvoiceForm, setShow: setShowInvoiceForm },
    { key: "abi", label: "ABI Hire Breakdown", show: showAbiBreakdown, setShow: setShowAbiBreakdown },
    { key: "hirePeriod", label: "Hire Period Validation", show: showHirePeriod, setShow: setShowHirePeriod },
    { key: "plating", label: "Plating Invoice", show: showPlatingInvoice, setShow: setShowPlatingInvoice },
    { key: "storageRecovery", label: "Storage and Recovery Invoice", show: showStorageRecoveryInvoice, setShow: setShowStorageRecoveryInvoice },
  ];
  // Open a document: mount it (if not already) and make it the visible one. Other
  // opened documents stay mounted (hidden) so their unsaved edits are preserved.
  const openPackDoc = (key: string) => {
    PACK_DOCS.find((d) => d.key === key)?.setShow(true);
    setActiveDoc(key);
  };
  // Discard closes the whole overlay and unmounts every document (fresh next time).
  const closePackDocs = () => {
    PACK_DOCS.forEach((d) => d.setShow(false));
    setActiveDoc(null);
  };
  const packSidebar = activeDoc ? (
    <PackSidebar
      docs={PACK_DOCS.map(({ key, label }) => ({ key, label }))}
      active={activeDoc}
      onSelect={openPackDoc}
    />
  ) : null;

  return (
    <div className="w-full mt-3 flex flex-col justify-start items-start gap-6 bg-white font-['Stack_Sans_Headline']">
      {loading && <SpinnerLoader />}

      <PackSidebarContext.Provider value={packSidebar}>
      {showFrontCover && (
        <div hidden={activeDoc !== "frontCover"}>
        <FrontCoverForm
          claimId={claimId}
          onEmailSent={handlePaymentPackEmailSent}
          onClose={closePackDocs}
          prefill={{
            ourReference: caseReference,
            yourInsured: thirdPartyName,
            yourReference: insurerReference,
            policyNumber,
            incidentDate,
            billTo: insurerBillTo || insurerName,
            caseType: packVehicles.length > 1 ? "Multiple Vehicles" : "Single Vehicle",
            dated: String(
              formik.values.payment_pack_raised_date || dateToISO(new Date()),
            ).slice(0, 10),
          }}
        />
        </div>
      )}

      {showCoveringLetter && (
        <div hidden={activeDoc !== "coveringLetter"}>
        <CoveringLetterForm
          claimId={claimId}
          onEmailSent={handlePaymentPackEmailSent}
          onClose={closePackDocs}
          prefill={{
            ourReference: caseReference,
            yourReference: insurerReference,
            ourClient: clientName || (selRec as any)?.client_name || "",
            yourInsured: thirdPartyName,
            billTo: insurerBillTo || insurerName,
            incidentDate,
            dated: String(
              formik.values.payment_pack_raised_date || dateToISO(new Date()),
            ).slice(0, 10),
            vehicleCount: packVehicles.length || 1,
            valetingFee: valetingCharges,
            signatory,
            charges: coveringCharges,
          }}
        />
        </div>
      )}

      {showInvoiceForm && (
        <div hidden={activeDoc !== "creditHire"}>
        <CreditHireInvoiceForm
          claimId={claimId}
          onEmailSent={handlePaymentPackEmailSent}
          onClose={closePackDocs}
          prefills={creditHirePrefills}
        />
        </div>
      )}

      {showAbiBreakdown && (
        <div hidden={activeDoc !== "abi"}>
        <ABIHireBreakdownForm
          claimId={claimId}
          onEmailSent={handlePaymentPackEmailSent}
          onClose={closePackDocs}
          vehicleGroups={
            packVehicles.map((v) => (v as any).category).filter(Boolean) as string[]
          }
          prefills={abiPrefills}
        />
        </div>
      )}

      {showHirePeriod && (
        <div hidden={activeDoc !== "hirePeriod"}>
        <HirePeriodValidationForm
          claimId={claimId}
          onEmailSent={handlePaymentPackEmailSent}
          onClose={closePackDocs}
          prefill={{
            ourReference: caseReference,
            yourReference: insurerReference,
            dated: String(
              formik.values.payment_pack_raised_date || dateToISO(new Date()),
            ).slice(0, 10),
          }}
        />
        </div>
      )}

      {showPlatingInvoice && (
        <div hidden={activeDoc !== "plating"}>
        <PlatingInvoiceForm
          claimId={claimId}
          onEmailSent={handlePaymentPackEmailSent}
          onClose={closePackDocs}
          prefills={platingPrefills}
        />
        </div>
      )}

      {showStorageRecoveryInvoice && (
        <div hidden={activeDoc !== "storageRecovery"}>
        <StorageRecoveryInvoiceForm
          claimId={claimId}
          onEmailSent={handlePaymentPackEmailSent}
          onClose={closePackDocs}
          prefill={storageRecoveryPrefill}
        />
        </div>
      )}
      </PackSidebarContext.Provider>

      <div className="w-full flex items-center justify-between">
        <h1 className="text-black text-2xl font-weight-600 leading-6">
          ABI &amp; BHR Charges
        </h1>
        <div className="relative" ref={packMenuRef}>
          <button
            type="button"
            onClick={async () => {
              // Open the pack overlay straight away at the first document; the
              // sidebar handles moving between the rest.
              await ensurePaymentPackRaisedDate();
              openPackDoc(PACK_DOCS[0].key);
            }}
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
          vehicles={packVehicles}
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
            <ReadonlyField
              label="Total Hire Charge"
              value={fmt(totalHire030)}
            />
          </div>
          <div className="w-full grid grid-cols-2 gap-5">
            <ReadonlyField
              label="Penalty Due Date"
              value={penaltyDueDate30}
              symbol=""
            />
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
            <ReadonlyField
              label="Total Hire Charge"
              value={fmt(totalHire3160)}
            />
          </div>
          <div className="w-full grid grid-cols-2 gap-5">
            <ReadonlyField
              label="Penalty Due Date"
              value={penaltyDueDate60}
              symbol=""
            />
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
            <ReadonlyField
              label="Total Hire Charge"
              value={fmt(totalHire61plus)}
            />
          </div>
          <div className="w-full grid grid-cols-2 gap-5">
            <ReadonlyField
              label="Penalty Due Date"
              value={penaltyDueDate61}
              symbol=""
            />
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
            <ReadonlyField
              label="Penalty Due Date"
              value={penaltyDueDate90}
              symbol=""
            />
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
