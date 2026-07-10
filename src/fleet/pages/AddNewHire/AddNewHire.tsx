import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import FleetTopBar from "../../components/FleetTopBar";
import FleetStepper from "../../components/FleetStepper";
import GeneralDetails from "./GeneralDetails";
import DriverDetails from "./DriverDetails";
import GDPRDetails from "./GDPRDetails";
import DriverProofs from "./DriverProofs";
import { HireProvider } from "./HireContext";
import { createHire, updateHire } from "../../services/hireService";
import { HIRE_STEPS } from "../../types/hire";

// Each wizard step maps to a screen component. Steps not yet built (later stories)
// render a placeholder, so new stories just drop a component in here.
const STEP_COMPONENTS: Record<string, React.FC | undefined> = {
  general: GeneralDetails,
  driver: DriverDetails,
  gdpr: GDPRDetails,
  proofs: DriverProofs,
};

const AddNewHire: React.FC = () => {
  const navigate = useNavigate();
  const [activeIndex, setActiveIndex] = useState(0);
  const [completed, setCompleted] = useState<Set<number>>(new Set());
  const [hireId, setHireId] = useState<number | null>(null);

  // Create the hire record when the wizard opens (best-effort — screens still
  // work if the backend isn't up yet).
  useEffect(() => {
    createHire().then(setHireId);
  }, []);

  const save = (partial: Record<string, unknown>) => {
    if (hireId) updateHire(hireId, partial);
  };

  // A step is reachable only once the previous one has been completed
  // (e.g. GDPR "starts only when Driver Details is complete").
  const canAccess = (i: number) => i === 0 || completed.has(i - 1);

  const selectStep = (i: number) => {
    if (canAccess(i)) setActiveIndex(i);
    else toast.info("Complete the previous step first.");
  };

  const goBack = () => navigate("/single-signon");
  const discard = () => navigate("/single-signon");
  const saveNext = () => {
    setCompleted((prev) => new Set(prev).add(activeIndex));
    if (activeIndex < HIRE_STEPS.length - 1) {
      setActiveIndex((i) => i + 1);
    } else {
      toast.success("Hire saved.");
    }
  };

  const activeStep = HIRE_STEPS[activeIndex];
  const StepComponent = STEP_COMPONENTS[activeStep.key];

  return (
    <div className="min-h-screen bg-white font-stack">
      <FleetTopBar title="Add New Hire" onBack={goBack} onDiscard={discard} onSaveNext={saveNext} />
      <div className="px-10 py-10 flex items-start gap-10">
        <FleetStepper steps={HIRE_STEPS} activeIndex={activeIndex} completed={completed} onSelect={selectStep} />
        <div className="flex-1 flex justify-center">
          <HireProvider value={{ hireId, save }}>
            {StepComponent ? (
              <StepComponent />
            ) : (
              <div className="w-full max-w-[788px] py-20 text-center text-neutral-400 text-sm">
                {activeStep.label} — coming soon.
              </div>
            )}
          </HireProvider>
        </div>
      </div>
    </div>
  );
};

export default AddNewHire;
