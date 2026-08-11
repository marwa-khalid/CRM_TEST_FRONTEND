import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { HireProvider } from "../../fleet/pages/AddNewHire/HireContext";
import { VehicleProvider } from "../screens/VehicleContext";
import { getHire, type HireRecord } from "../../fleet/services/hireService";
import VehicleDetails from "../screens/VehicleDetails";
import LicensingAuthority from "../screens/LicensingAuthority";
import LicensingAuthoritySummary from "../screens/LicensingAuthoritySummary";
import CurrentHireDetails from "../screens/CurrentHireDetails";
import ServicingDetails from "../screens/ServicingDetails";
import RoadFundLicense from "../screens/RoadFundLicense";
import VehicleSaleDetails from "../screens/VehicleSaleDetails";
import FleetTopBar from "../../fleet/components/FleetTopBar";
import FleetStepper, { type StepFill } from "../../fleet/components/FleetStepper";
import FleetSpinnerLoader from "../../fleet/components/FleetSpinnerLoader";
import { VEHICLE_STEPS } from "../types/vehicleRecord";
import {
  createVehicleRecord,
  getVehicleRecord,
  updateVehicleRecord,
  type VehicleRecord,
} from "../services/vehicleRecordService";
import { upsertVehicleRegister } from "../services/vehicleService";

const STEP_MAP: Record<string, React.ComponentType> = {
  details: VehicleDetails,
  licensing: LicensingAuthority,
  licensing_summary: LicensingAuthoritySummary,
  current_hire: CurrentHireDetails,
  servicing: ServicingDetails,
  road_fund: RoadFundLicense,
  sales: VehicleSaleDetails,
};

// Only the Vehicle Details step lives directly on the record row — its fill state
// drives the sidebar dot. Other steps (child tables) colour once visited.
const DETAILS_FIELDS = ["registration_number", "make", "model", "transmission", "fuel_type", "vehicle_status"];

/**
 * Standalone customer-side vehicle file (Vehicle Management). Same shell as the
 * Add New Hire wizard — FleetTopBar + FleetStepper card sidebar — but backed by a
 * standalone vehicle record with no hire. `hire` is null so Current Hire Details
 * reads blank until a Claims/Skyline hire assigns the vehicle.
 */
const VehicleManagementRecord: React.FC = () => {
  const { recordId } = useParams();
  const navigate = useNavigate();
  const id = recordId ? Number(recordId) : null;

  const [vehicle, setVehicle] = useState<VehicleRecord | null>(null);
  const [hire, setHire] = useState<HireRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [completed, setCompleted] = useState<Set<number>>(new Set());

  const pendingRef = useRef<Record<string, unknown>>({});
  const vehicleRef = useRef<VehicleRecord | null>(null);
  useEffect(() => {
    vehicleRef.current = vehicle;
  }, [vehicle]);

  // Load the record. On the /new route there's no id yet — nothing to fetch, and
  // crucially nothing is created until the user actually enters data (below).
  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    getVehicleRecord(id).then((r) => {
      if (cancelled) return;
      setVehicle(r);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [id]);

  // Load the hire this vehicle is currently on (if any) so Current Hire Details can
  // show the driver. hire_id is linked when the vehicle goes on hire (backend).
  useEffect(() => {
    const hid = vehicle?.hire_id;
    if (!hid) { setHire(null); return; }
    let cancelled = false;
    getHire(hid).then((h) => { if (!cancelled) setHire(h); });
    return () => { cancelled = true; };
  }, [vehicle?.hire_id]);

  // Deferred creation (mirrors Add New Hire's ensureHire): the DB row is created
  // the first time the user saves a field / opens a child screen — NOT on page
  // open — so bailing out of "Register Vehicle" leaves no empty record behind.
  const createPromiseRef = useRef<Promise<VehicleRecord | null> | null>(null);
  const ensureRecord = useCallback(async (): Promise<VehicleRecord | null> => {
    if (vehicleRef.current) return vehicleRef.current;
    if (!createPromiseRef.current) {
      createPromiseRef.current = createVehicleRecord().finally(() => {
        createPromiseRef.current = null;
      });
    }
    const created = await createPromiseRef.current;
    if (!created?.id) {
      toast.error("Could not create the vehicle record.");
      return null;
    }
    vehicleRef.current = created;
    setVehicle(created);
    navigate(`/vehicle-management/${created.id}`, { replace: true });
    return created;
  }, [navigate]);

  // --- Vehicle provider plumbing (buffer edits, flush on navigation) ---
  const save = useCallback(async (partial: Record<string, unknown>) => {
    const rec = await ensureRecord();
    pendingRef.current = { ...pendingRef.current, ...partial };
    setVehicle((v) => ({ ...((v ?? rec) as VehicleRecord), ...partial } as VehicleRecord));
  }, [ensureRecord]);
  const flush = useCallback(async () => {
    const pending = pendingRef.current;
    if (Object.keys(pending).length === 0) return;
    const rec = vehicleRef.current;
    if (!rec) return;
    pendingRef.current = {};
    const updated = await updateVehicleRecord(rec.id, pending);
    if (updated) {
      setVehicle(updated);
      // Keep the shared register in step so this vehicle appears in the Claims &
      // Skyline hire reg dropdowns. Done from the frontend against the existing
      // register endpoint, so it works without redeploying the backend hook.
      if (updated.registration_number) {
        void upsertVehicleRegister({
          registration_number: updated.registration_number,
          make: updated.make || "",
          model: updated.model || "",
          transmission: updated.transmission || undefined,
        });
      }
    } else toast.error("Could not save. Please try again.");
  }, []);
  const refresh = useCallback(async () => {
    const rec = vehicleRef.current;
    if (!rec) return;
    const fresh = await getVehicleRecord(rec.id);
    if (fresh) setVehicle(fresh);
  }, []);
  const ensureVehicle = useCallback(async () => {
    const rec = await ensureRecord();
    return rec?.id ?? null;
  }, [ensureRecord]);

  // --- Flush registry (Licensing / Servicing register their own flushers) ---
  const flushersRef = useRef<Set<() => Promise<void>>>(new Set());
  const registerFlusher = useCallback((fn: () => Promise<void>) => {
    flushersRef.current.add(fn);
    return () => {
      flushersRef.current.delete(fn);
    };
  }, []);
  const flushAll = useCallback(async () => {
    await flush();
    for (const fn of Array.from(flushersRef.current)) {
      try {
        await fn();
      } catch {
        /* keep flushing the rest */
      }
    }
  }, [flush]);

  const selectStep = (i: number) => {
    void flushAll();
    setActiveIndex(i);
  };
  const goBack = async () => {
    await flushAll();
    navigate("/vehicle-management");
  };
  const discard = () => {
    pendingRef.current = {};
    navigate("/vehicle-management");
  };
  const saveNext = async () => {
    if (saving) return;
    setSaving(true);
    const minSpin = new Promise((r) => setTimeout(r, 400));
    try {
      await flushAll();
      await minSpin;
      setCompleted((prev) => new Set(prev).add(activeIndex));
      if (activeIndex < VEHICLE_STEPS.length - 1) {
        toast.success("Details saved.");
        setActiveIndex((i) => i + 1);
      } else {
        toast.success("Vehicle saved.");
      }
    } finally {
      setSaving(false);
    }
  };

  const stepStatus = (i: number): StepFill => {
    const key = VEHICLE_STEPS[i]?.key;
    if (key === "details") {
      if (!vehicle) return "empty";
      const filled = DETAILS_FIELDS.filter((f) => {
        const v = (vehicle as unknown as Record<string, unknown>)[f];
        return v !== null && v !== undefined && String(v).trim() !== "";
      }).length;
      return filled === 0 ? "empty" : filled >= DETAILS_FIELDS.length ? "complete" : "half";
    }
    return completed.has(i) ? "complete" : "empty";
  };

  const StepComponent = STEP_MAP[VEHICLE_STEPS[activeIndex].key];

  return (
    <div className="min-h-screen bg-white font-sans-headline">
      <FleetTopBar
        title={vehicle?.registration_number || "New Vehicle"}
        onBack={goBack}
        onDiscard={discard}
        onSaveNext={saveNext}
        onBeforeNavigate={flushAll}
        saving={saving}
        hireId={null}
      />
      <div className="px-10 py-10 flex items-start gap-10">
        <FleetStepper
          steps={VEHICLE_STEPS}
          activeIndex={activeIndex}
          statusOf={stepStatus}
          onSelect={selectStep}
          clientLabel="Vehicle Registration"
        />
        <div className="flex-1 flex justify-center">
          {loading ? null : (
            <HireProvider
              value={{
                hireId: null,
                hire: null,
                save: async () => {},
                activeVehicleId: null,
                setActiveVehicleId: () => {},
                registerFlusher,
              }}
            >
              <VehicleProvider
                value={{
                  vehicleId: vehicle?.id ?? null,
                  vehicle,
                  loading,
                  hire,
                  save,
                  flush,
                  ensureVehicle,
                  refresh,
                }}
              >
                {StepComponent ? <StepComponent /> : null}
              </VehicleProvider>
            </HireProvider>
          )}
        </div>
      </div>

      {(saving || loading) && <FleetSpinnerLoader />}
    </div>
  );
};

export default VehicleManagementRecord;
