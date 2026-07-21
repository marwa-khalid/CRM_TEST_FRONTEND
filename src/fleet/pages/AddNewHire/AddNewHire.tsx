import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import FleetTopBar from "../../components/FleetTopBar";
import FleetStepper, { type StepFill } from "../../components/FleetStepper";
import FleetSpinnerLoader from "../../components/FleetSpinnerLoader";
import GeneralDetails from "./GeneralDetails";
import DriverDetails from "./DriverDetails";
import TaxiBadgeDetails from "./TaxiBadgeDetails";
import GDPRDetails from "./GDPRDetails";
import DriverProofs from "./DriverProofs";
import HireVehicleDetails from "./HireVehicleDetails";
import PaymentDetails from "./PaymentDetails";
import PenaltyCharges from "./PenaltyCharges";
import DocumentChecklist from "./DocumentChecklist";
import VehicleDetails from "../Vehicle/VehicleDetails";
import LicensingAuthority from "../Vehicle/LicensingAuthority";
import LicensingAuthoritySummary from "../Vehicle/LicensingAuthoritySummary";
import CurrentHireDetails from "../Vehicle/CurrentHireDetails";
import ServicingDetails from "../Vehicle/ServicingDetails";
import RoadFundLicense from "../Vehicle/RoadFundLicense";
import VehicleSaleDetails from "../Vehicle/VehicleSaleDetails";
import { VehicleProvider } from "../Vehicle/VehicleContext";
import { HireProvider } from "./HireContext";
import {
  createHire,
  getHireCompletionSummary,
  getHire,
  updateHire,
  type HireCompletionSummary,
  type HireRecord,
} from "../../services/hireService";
import { HIRE_STEPS, HIRER_TYPE_TAXI } from "../../types/hire";
import { VEHICLE_STEPS } from "../../types/vehicleRecord";
import {
  getHireVehicleRecord,
  updateVehicleRecord,
  type VehicleRecord,
} from "../../services/vehicleRecordService";

// Each wizard step maps to a screen component. Steps not yet built (later stories)
// render a placeholder, so new stories just drop a component in here.
const STEP_COMPONENTS: Record<string, React.FC | undefined> = {
  general: GeneralDetails,
  driver: DriverDetails,
  taxi: TaxiBadgeDetails,
  gdpr: GDPRDetails,
  proofs: DriverProofs,
  vehicle: HireVehicleDetails,
  payment: PaymentDetails,
  pcn: PenaltyCharges,
  documents: DocumentChecklist,
  // Customer Side — same record, different screens.
  details: VehicleDetails,
  licensing: LicensingAuthority,
  licensing_summary: LicensingAuthoritySummary,
  current_hire: CurrentHireDetails,
  servicing: ServicingDetails,
  road_fund: RoadFundLicense,
  sales: VehicleSaleDetails,
};

// Backend fields that live on the hire record, per step — drives the sidebar
// fill state (complete = all filled, half = 1+, empty = none). Steps whose data
// lives in child tables (vehicle/proofs/pcn/documents) aren't covered here yet.
const STEP_FIELDS: Record<string, string[]> = {
  general: ["insurance_type", "rental_advisor", "current_position", "hirer_type", "bank_name", "account_name", "sort_code", "account_number"],
  taxi: ["taxi_badge_number", "taxi_badge_name", "taxi_badge_expiry", "taxi_badge_council", "taxi_badge_type"],
  driver: ["driver_name", "driver_address", "driver_postcode", "driver_email", "driver_telephone", "driver_mobile", "driving_licence_number", "national_insurance_number", "date_of_birth"],
  gdpr: ["where_found", "privacy_notice_date", "privacy_notice_method", "lawful_basis", "email_consent", "sms_consent", "phone_consent", "postal_consent"],
  payment: ["payment_hire_start_date", "payment_hire_end_date", "vehicle_cost_per_day", "number_of_weekly_payments", "payment_day", "security_deposit", "weekly_hire_payment", "total_planned_hire_cost", "initial_amount_due", "payment_damage_charges", "additional_charges"],
};

// Customer-side steps are backed by the vehicle record rather than the hire row.
const VEHICLE_STEP_FIELDS: Record<string, string[]> = {
  details: [
    "obtained_for_purpose", "contract_type", "registration_number", "make", "model",
    "manufacturer", "variant", "number_of_doors", "number_of_seats", "body_type",
    "fuel_type", "transmission", "engine_size_cc", "v5c_document_reference",
    "chassis_number", "date_of_first_registration", "vehicle_status", "depot_branch",
  ],
};

// complete = all present, half = 1+, empty = none.
const fillFromCount = (present: number, total: number): StepFill =>
  present === 0 ? "empty" : present >= total ? "complete" : "half";
const fillFromFields = (obj: Record<string, unknown> | null | undefined, fields: string[]): StepFill => {
  if (!obj) return "empty";
  const filled = fields.filter((f) => {
    const v = obj[f];
    return v !== null && v !== undefined && String(v).trim() !== "";
  }).length;
  return fillFromCount(filled, fields.length);
};

const AddNewHire: React.FC = () => {
  const navigate = useNavigate();
  const { hireId: hireIdParam } = useParams();
  const [activeIndex, setActiveIndex] = useState(0);
  const [completed, setCompleted] = useState<Set<number>>(new Set());
  const [hireId, setHireId] = useState<number | null>(null);
  const [hire, setHire] = useState<HireRecord | null>(null);
  // Shared active vehicle so Hire Vehicle Details ↔ Payment Details open the same card.
  const [activeVehicleId, setActiveVehicleId] = useState<number | null>(null);
  const [completionSummary, setCompletionSummary] = useState<HireCompletionSummary | null>(null);
  const [loadingHire, setLoadingHire] = useState(false);
  // The Customer Side of this same record. Fetched lazily the first time a
  // customer-side step is opened, so client-only files never create one.
  const [vehicle, setVehicle] = useState<VehicleRecord | null>(null);
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

  useEffect(() => {
    if (!hireId) {
      setCompletionSummary(null);
      return;
    }

    let active = true;
    getHireCompletionSummary(hireId).then((summary) => {
      if (active) setCompletionSummary(summary);
    });

    return () => {
      active = false;
    };
  }, [hireId, activeIndex]);

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

  // The Taxi Badge step only exists when Hirer Type = Taxi Driver (General Details).
  const steps = useMemo(
    () => HIRE_STEPS.filter((s) => s.key !== "taxi" || hire?.hirer_type === HIRER_TYPE_TAXI),
    [hire?.hirer_type],
  );

  // Switching away from Taxi Driver removes a step — keep the index in range.
  useEffect(() => {
    setActiveIndex((i) => Math.min(i, Math.max(0, steps.length - 1)));
  }, [steps.length]);

  // Customer-side steps continue the same index space as the client steps, so
  // one activeIndex drives both sidebar cards.
  const allSteps = useMemo(() => [...steps, ...VEHICLE_STEPS], [steps]);
  const isCustomerStep = activeIndex >= steps.length;

  // No step gating on Fleet — every step is freely reachable in any order.
  const selectStep = (i: number) => setActiveIndex(i);

  useEffect(() => {
    if (!isCustomerStep || !hireId || vehicle) return;
    getHireVehicleRecord(hireId).then((record) => {
      if (record) setVehicle(record);
    });
  }, [isCustomerStep, hireId, vehicle]);

  const saveVehicle = async (partial: Record<string, unknown>) => {
    let record = vehicle;
    if (!record && hireId) record = await getHireVehicleRecord(hireId);
    if (!record) {
      toast.error("Could not open the vehicle record yet.");
      return;
    }
    const updated = await updateVehicleRecord(record.id, partial);
    setVehicle(updated ?? record);
    if (!updated) toast.error("Could not save. Please try again.");
  };

  const refreshVehicle = async () => {
    if (!hireId) return;
    const record = await getHireVehicleRecord(hireId);
    if (record) setVehicle(record);
  };

  const ensureVehicle = async (): Promise<number | null> => {
    if (vehicle) return vehicle.id;
    if (!hireId) return null;
    const record = await getHireVehicleRecord(hireId);
    if (record) setVehicle(record);
    return record?.id ?? null;
  };

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
      if (activeIndex < allSteps.length - 1) {
        toast.success("Details saved.");
        setActiveIndex((i) => i + 1);
      } else {
        toast.success("Hire saved.");
      }
    } finally {
      setSaving(false);
    }
  };

  const activeStep = allSteps[activeIndex] ?? allSteps[0];
  const StepComponent = STEP_COMPONENTS[activeStep.key];

  // Sidebar fill state per step. Hire-row screens read the hire record. Screens
  // backed by child tables keep their own data loading so the parent does not
  // duplicate every child-screen API call just to colour the sidebar.
  const stepStatus = (i: number): StepFill => {
    const step = allSteps[i];
    if (!step) return "empty";
    const key = step.key;
    if (i >= steps.length) {
      const vehicleFields = VEHICLE_STEP_FIELDS[key];
      if (!vehicleFields) return "empty";
      return fillFromFields(vehicle as unknown as Record<string, unknown> | null, vehicleFields);
    }
    const fields = STEP_FIELDS[key];
    if (fields) return fillFromFields(hire as unknown as Record<string, unknown> | null, fields);
    if (key === "vehicle") {
      return fillFromCount(completionSummary?.vehicle_present ?? 0, completionSummary?.vehicle_total ?? 5);
    }
    if (key === "proofs") {
      return fillFromCount(completionSummary?.proof_present ?? 0, completionSummary?.proof_total ?? 3);
    }
    if (key === "documents") {
      return fillFromCount(completionSummary?.document_present ?? 0, completionSummary?.document_total ?? 8);
    }
    if (key === "pcn") {
      return fillFromCount(completionSummary?.pcn_present ?? 0, completionSummary?.pcn_total ?? 8);
    }
    return completed.has(i) ? "complete" : "empty";
  };

  return (
    <div className="min-h-screen bg-white font-sans-headline">
      <FleetTopBar
        title={hire?.fleet_reference ? `${hire.fleet_reference}` : "Add New Hire"}
        onBack={goBack}
        onDiscard={discard}
        onSaveNext={saveNext}
        saving={saving}
        hireId={hireId}
      />
      <div className="px-10 py-10 flex items-start gap-10">
        <FleetStepper
          steps={steps}
          activeIndex={activeIndex}
          statusOf={stepStatus}
          onSelect={selectStep}
          customerSteps={VEHICLE_STEPS}
        />
        <div className="flex-1 flex justify-center">
          <HireProvider value={{ hireId, hire, save, activeVehicleId, setActiveVehicleId }}>
            {loadingHire ? null : StepComponent ? (
              isCustomerStep ? (
                <VehicleProvider
                  value={{ vehicleId: vehicle?.id ?? null, vehicle, hire, save: saveVehicle, ensureVehicle, refresh: refreshVehicle }}
                >
                  <StepComponent />
                </VehicleProvider>
              ) : (
                <StepComponent />
              )
            ) : (
              <div className="w-full max-w-[788px] py-20 text-center text-neutral-400 text-sm">
                {activeStep.label} — coming soon.
              </div>
            )}
          </HireProvider>
        </div>
      </div>

      {/* Full-screen grey saving overlay (matches the Claims SpinnerLoader). */}
      {(saving || loadingHire) && <FleetSpinnerLoader />}
    </div>
  );
};

export default AddNewHire;
