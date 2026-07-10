import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import FleetTopBar from "../../components/FleetTopBar";
import FleetStepper, { type StepFill } from "../../components/FleetStepper";
import GeneralDetails from "./GeneralDetails";
import DriverDetails from "./DriverDetails";
import GDPRDetails from "./GDPRDetails";
import DriverProofs from "./DriverProofs";
import HireVehicleDetails from "./HireVehicleDetails";
import PaymentDetails from "./PaymentDetails";
import PenaltyCharges from "./PenaltyCharges";
import DocumentChecklist from "./DocumentChecklist";
import { HireProvider } from "./HireContext";
import { createHire, getHire, updateHire, type HireRecord } from "../../services/hireService";
import { HIRE_STEPS } from "../../types/hire";

// Each wizard step maps to a screen component. Steps not yet built (later stories)
// render a placeholder, so new stories just drop a component in here.
const STEP_COMPONENTS: Record<string, React.FC | undefined> = {
  general: GeneralDetails,
  driver: DriverDetails,
  gdpr: GDPRDetails,
  proofs: DriverProofs,
  vehicle: HireVehicleDetails,
  payment: PaymentDetails,
  pcn: PenaltyCharges,
  documents: DocumentChecklist,
};

// Backend fields that live on the hire record, per step — drives the sidebar
// fill state (complete = all filled, half = 1+, empty = none). Steps whose data
// lives in child tables (vehicle/proofs/pcn/documents) aren't covered here yet.
const STEP_FIELDS: Record<string, string[]> = {
  general: ["insurance_type", "rental_advisor", "current_position", "bank_name", "account_name", "sort_code", "account_number"],
  driver: ["driver_name", "driver_address", "driver_postcode", "driver_email", "driver_telephone", "driver_mobile", "driving_licence_number", "national_insurance_number", "date_of_birth"],
  gdpr: ["where_found", "privacy_notice_date", "privacy_notice_method", "lawful_basis", "email_consent", "sms_consent", "phone_consent", "postal_consent"],
  payment: ["payment_hire_start_date", "payment_hire_end_date", "vehicle_cost_per_day", "number_of_weekly_payments", "payment_day", "security_deposit", "weekly_hire_payment", "total_planned_hire_cost", "initial_amount_due", "payment_damage_charges", "additional_charges"],
};

const AddNewHire: React.FC = () => {
  const navigate = useNavigate();
  const { hireId: hireIdParam } = useParams();
  const [activeIndex, setActiveIndex] = useState(0);
  const [completed, setCompleted] = useState<Set<number>>(new Set());
  const [hireId, setHireId] = useState<number | null>(null);
  const [hire, setHire] = useState<HireRecord | null>(null);
  const [loadingHire, setLoadingHire] = useState(false);
  const hireIdRef = useRef<number | null>(null);
  const createPromiseRef = useRef<Promise<HireRecord | null> | null>(null);

  useEffect(() => {
    hireIdRef.current = hireId;
  }, [hireId]);

  useEffect(() => {
    const numericId = hireIdParam ? Number(hireIdParam) : null;
    if (!numericId || Number.isNaN(numericId)) {
      setHireId(null);
      setHire(null);
      return;
    }

    setLoadingHire(true);
    getHire(numericId)
      .then((record) => {
        if (!record) {
          toast.error("Fleet record not found.");
          navigate("/fleet", { replace: true });
          return;
        }
        setHireId(record.id);
        setHire(record);
      })
      .finally(() => setLoadingHire(false));
  }, [hireIdParam, navigate]);

  const ensureHire = async (): Promise<number | null> => {
    if (hireIdRef.current) return hireIdRef.current;
    if (!createPromiseRef.current) {
      createPromiseRef.current = createHire().finally(() => {
        createPromiseRef.current = null;
      });
    }
    const created = await createPromiseRef.current;
    if (!created?.id) {
      toast.error("Could not create fleet record yet.");
      return null;
    }
    hireIdRef.current = created.id;
    setHireId(created.id);
    setHire(created);
    navigate(`/fleet/hire/${created.id}`, { replace: true });
    return created.id;
  };

  const [saving, setSaving] = useState(false);

  const save = async (partial: Record<string, unknown>) => {
    const id = await ensureHire();
    if (!id) return;
    const updated = await updateHire(id, partial);
    if (updated) setHire(updated);
  };

  // No step gating on Fleet — every step is freely reachable in any order.
  const selectStep = (i: number) => setActiveIndex(i);

  const goBack = () => navigate("/fleet");
  const discard = () => navigate("/fleet");
  const saveNext = async () => {
    if (saving) return;
    setSaving(true);
    const minSpin = new Promise((resolve) => setTimeout(resolve, 400)); // keep loader visible
    try {
      const id = await ensureHire();
      await minSpin;
      if (!id) {
        toast.error("Couldn't save — please try again.");
        return;
      }
      setCompleted((prev) => new Set(prev).add(activeIndex));
      if (activeIndex < HIRE_STEPS.length - 1) {
        toast.success("Details saved.");
        setActiveIndex((i) => i + 1);
      } else {
        toast.success("Hire saved.");
      }
    } finally {
      setSaving(false);
    }
  };

  const activeStep = HIRE_STEPS[activeIndex];
  const StepComponent = STEP_COMPONENTS[activeStep.key];

  // Sidebar fill state per step, computed from the saved hire record.
  const stepStatus = (i: number): StepFill => {
    const fields = STEP_FIELDS[HIRE_STEPS[i].key];
    if (!fields || !hire) return "empty";
    const rec = hire as unknown as Record<string, unknown>;
    const filled = fields.filter((f) => {
      const v = rec[f];
      return v !== null && v !== undefined && String(v).trim() !== "";
    }).length;
    if (filled === 0) return "empty";
    return filled === fields.length ? "complete" : "half";
  };

  return (
    <div className="min-h-screen bg-white font-sans-headline">
      <FleetTopBar
        title={hire?.fleet_reference ? `${hire.fleet_reference}` : "Add New Hire"}
        onBack={goBack}
        onDiscard={discard}
        onSaveNext={saveNext}
        saving={saving}
      />
      <div className="px-10 py-10 flex items-start gap-10">
        <FleetStepper steps={HIRE_STEPS} activeIndex={activeIndex} statusOf={stepStatus} onSelect={selectStep} />
        <div className="flex-1 flex justify-center">
          <HireProvider value={{ hireId, hire, save }}>
            {loadingHire ? (
              <div className="w-full max-w-[788px] py-20 text-center text-neutral-400 text-sm">
                Loading fleet record...
              </div>
            ) : StepComponent ? (
              <StepComponent />
            ) : (
              <div className="w-full max-w-[788px] py-20 text-center text-neutral-400 text-sm">
                {activeStep.label} — coming soon.
              </div>
            )}
          </HireProvider>
        </div>
      </div>

      {/* Full-screen saving overlay (like the Claims side). */}
      {saving && (
        <div className="fixed inset-0 z-[200] bg-black/40 flex flex-col items-center justify-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-white/30 border-t-white" />
          <span className="text-white text-sm">Saving…</span>
        </div>
      )}
    </div>
  );
};

export default AddNewHire;
