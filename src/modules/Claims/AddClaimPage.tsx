import { useState, useRef, useCallback, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import Sidebar from "./Components/ClaimSidebar";
import { ClaimCompletionProvider } from "./Components/ClaimCompletion";
import { loadClaimStepCompletion } from "./Components/claimStepCompletion";
import {
  getScreenCompletion,
  updateScreenCompletion,
  getClaimById,
} from "../../services/Claims/Claims";
import { toast } from "react-toastify";

// Stable server key per sidebar step (parallel to `steps` below). Persisted so
// the sidebar loads every screen's completion in one request.
const SCREEN_KEYS = [
  "general",
  "referrer",
  "client",
  "accident",
  "vehicle",
  "vehicle_owner",
  "engineer",
  "client_insurer",
  "panel_solicitor",
  "storage_recovery",
  "vehicle_damage",
  "third_party",
  "hire_vehicle",
  "driver_docs",
  "driver_checkout",
];
import { Header } from "./Components/ClaimHeader";
import SpinnerLoader from "../../components/common/SpinnerLoader";
import GeneralDetailsForm from "./Steps/GeneralDetailsForm";
import { ReferrerDetailsForm } from "./Steps/ReferrerDetailsForm";
import { ClientDetailsForm } from "./Steps/ClientDetailsForm";
import { AccidentDetailsForm } from "./Steps/AccidentDetailsForm";
import { VehicleDetailsForm } from "./Steps/VehicleDetailsForm";
import { VehicleOwnerForm } from "./Steps/VehicleOwnerForm";
import { EngineerDetailsForm } from "./Steps/EngineerDetailsForm";
import { ClientInsurerBrokerForm } from "./Steps/ClientInsurerBrokerForm";
import { PanelSolicitorForm } from "./Steps/PanelSolicitorForm";
import { StorageRecoveryDetails } from "./Steps/StorageRecoveryDetails";
import { HireDetailsForm } from "./Steps/HireDetailsForm";
import { DriverCheckoutForm } from "./Steps/DriverCheckoutForm";
import { VehicleDamageAI } from "./Steps/VehicleDamageAI";
import DriverDocumentAgreement from "./Steps/DriverDocumentAgreement";
import ThirdPartyInsurer from "./Steps/ThirdPartyInsurer";
import PlatingChargesSection from "./PaymentSteps/PlatingAdditionalChargesForm";
import ABIBHRCharges from "./PaymentSteps/ABI&BHRChargesForm";
import ComparisonActualAgreedForm from "./PaymentSteps/ComparisonActualAgreedForm";
import HirePaymentDetailsForm from "./PaymentSteps/HirePaymentDetailsForm";
import DirectHirePaymentForm from "./PaymentSteps/DirectHirePaymentForm";

type ActiveMode = "claim" | "payment";

const AddClaimPage = () => {
  const { claimId } = useParams<{ claimId?: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  // Email "View Case" CTA deep-links with ?mode=payment to open the payment
  // section directly on screen 4 (Hire Payment Details & Recovery Management).
  const isPaymentMode = searchParams.get("mode") === "payment";
  const [currentStep, setCurrentStep] = useState(0);
  const [currentPaymentStep, setCurrentPaymentStep] = useState(isPaymentMode ? 3 : 0);
  const [activeMode, setActiveMode] = useState<ActiveMode>(
    isPaymentMode ? "payment" : "claim",
  );
  const [isSavingScreen, setIsSavingScreen] = useState(false);
  // Existence guard: a new claim (no id) is ready immediately; an existing id is
  // only "ready" once we've confirmed it exists (otherwise we redirect out).
  const [claimReady, setClaimReady] = useState<boolean>(!claimId);

  const formRef = useRef<any>(null);
  const paymentFormRef = useRef<any>(null);
  const isSidebarSaveInProgressRef = useRef(false);
  const contentScrollRef = useRef<HTMLDivElement>(null);

  // Per-screen completion (green check in the sidebar when a screen is fully filled).
  const [completedMap, setCompletedMap] = useState<Record<number, boolean>>({});
  // Completion loaded once from the server, handed to the provider to seed itself.
  const [initialCompletion, setInitialCompletion] =
    useState<Record<number, boolean> | undefined>(undefined);
  const handleCompletionChange = useCallback(
    (map: Record<number, boolean>) =>
      setCompletedMap((prev) => ({ ...prev, ...map })),
    [],
  );
  // Persist a single screen's flag as it flips (called by the provider).
  const persistCompletion = useCallback(
    (screenKey: string, complete: boolean) => {
      if (claimId) updateScreenCompletion(claimId, screenKey, complete).catch(() => {});
    },
    [claimId],
  );

  const handleClaimCreated = (newId: string | number) => {
    navigate(`/add-claim/${newId}`, { replace: true });
  };

  // Guard: confirm the claim id in the URL actually exists. If it 404s (e.g. a
  // stale/deleted claim), bounce back to the claims list instead of letting every
  // screen fire its own 404. Other errors don't trap the user on a blank page.
  useEffect(() => {
    if (!claimId) {
      setClaimReady(true);
      return;
    }
    let cancelled = false;
    setClaimReady(false);
    getClaimById(Number(claimId))
      .then(() => {
        if (!cancelled) setClaimReady(true);
      })
      .catch((err: any) => {
        if (cancelled) return;
        if (err?.response?.status === 404) {
          toast.error("That claim no longer exists.");
          navigate("/dashboard", { replace: true });
        } else {
          setClaimReady(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [claimId, navigate]);

  // Load completion in ONE request from the stored map. Only when nothing has been
  // stored yet (older claims) do we compute it once from the screens and persist,
  // so every subsequent open is just the single fetch.
  useEffect(() => {
    if (!claimId) {
      setCompletedMap({});
      setInitialCompletion(undefined);
      return;
    }
    // Wait until the claim is confirmed to exist before probing its screens.
    if (!claimReady) return;

    let cancelled = false;

    (async () => {
      let byIndex: Record<number, boolean> = {};
      try {
        const { data } = await getScreenCompletion(claimId);
        const server: Record<string, boolean> = data?.completion || {};
        SCREEN_KEYS.forEach((k, i) => {
          if (k in server) byIndex[i] = !!server[k];
        });

        if (Object.keys(server).length === 0) {
          // Backfill once from existing screen data, then store it.
          const computed = await loadClaimStepCompletion(claimId);
          byIndex = { ...computed };
          Object.entries(computed).forEach(([i, v]) => {
            const key = SCREEN_KEYS[Number(i)];
            if (key) updateScreenCompletion(claimId, key, v as boolean).catch(() => {});
          });
        }
      } catch {
        /* leave empty on failure */
      }

      if (!cancelled) {
        setInitialCompletion(byIndex);
        setCompletedMap((prev) => ({ ...byIndex, ...prev }));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [claimId, claimReady]);

  const steps = [
    { label: "General Details" },
    { label: "Referrer Details" },
    { label: "Client Details" },
    { label: "Accident Details" },
    { label: "Vehicle Details" },
    { label: "Vehicle Owner" },
    { label: "Engineer Details" },
    { label: "Client Insurer & Broker" },
    { label: "Panel Solicitor Details" },
    { label: "Storage & Recovery" },
    { label: "Vehicle Damage Details" },
    { label: "Third Party & Insurer" },
    { label: "Hire Vehicle Provided" },
    { label: "Driver Document & Agreement" },
    { label: "Driver Checkout" },
  ];

  const paymentSteps = [
    { label: "Plating & Additional Charges" },
    { label: "ABI and BHR Charges" },
    { label: "Comparison - Agreed & Actual Settlement" },
    { label: "Hire Payment Details & Recovery Management" },
    { label: "Settlement Received Date" },
  ];

  const saveCurrentScreen = async (silent = false) => {
    const activeFormRef = activeMode === "claim" ? formRef : paymentFormRef;
    if (activeFormRef.current?.submitForm) {
      setIsSavingScreen(true);
      // Sidebar navigation still saves, but silently — suppress the per-form
      // "saved successfully" toast (Save & Next keeps it). Errors still show.
      const originalSuccess = toast.success;
      if (silent) (toast as any).success = () => "";
      try {
        await activeFormRef.current.submitForm();
      } finally {
        if (silent) (toast as any).success = originalSuccess;
        setIsSavingScreen(false);
      }
    }
  };

  const handleSaveAndNext = async () => {
    if (isSidebarSaveInProgressRef.current) return;
    isSidebarSaveInProgressRef.current = true;

    try {
      await saveCurrentScreen();

      if (activeMode === "claim") {
        setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
      } else {
        setCurrentPaymentStep((prev) => Math.min(prev + 1, paymentSteps.length - 1));
      }
    } catch {
      /* validation/save errors are shown inline */
    } finally {
      isSidebarSaveInProgressRef.current = false;
    }
  };

  const handleClaimStepClick = async (idx: number) => {
    if (activeMode === "claim" && idx === currentStep) return;
    if (isSidebarSaveInProgressRef.current) return;
    isSidebarSaveInProgressRef.current = true;

    try {
      await saveCurrentScreen(true);
      setActiveMode("claim");
      setCurrentStep(idx);
    } catch {
      /* validation/save errors are shown inline */
    } finally {
      isSidebarSaveInProgressRef.current = false;
    }
  };

  const handlePaymentStepClick = async (idx: number) => {
    if (activeMode === "payment" && idx === currentPaymentStep) return;
    if (isSidebarSaveInProgressRef.current) return;
    isSidebarSaveInProgressRef.current = true;

    try {
      await saveCurrentScreen(true);
      setActiveMode("payment");
      setCurrentPaymentStep(idx);
    } catch {
      /* validation/save errors are shown inline */
    } finally {
      isSidebarSaveInProgressRef.current = false;
    }
  };

  const renderClaimForm = () => {
    switch (currentStep) {
      case 0:  return <GeneralDetailsForm formRef={formRef} claimId={claimId} onClaimCreated={handleClaimCreated} />;
      case 1:  return <ReferrerDetailsForm formRef={formRef} claimId={claimId} />;
      case 2:  return <ClientDetailsForm formRef={formRef} claimId={claimId} />;
      case 3:  return <AccidentDetailsForm formRef={formRef} claimId={claimId} />;
      case 4:  return <VehicleDetailsForm formRef={formRef} claimId={claimId} />;
      case 5:  return <VehicleOwnerForm formRef={formRef} claimId={claimId} />;
      case 6:  return <EngineerDetailsForm formRef={formRef} claimId={claimId} />;
      case 7:  return <ClientInsurerBrokerForm formRef={formRef} claimId={claimId} />;
      case 8:  return <PanelSolicitorForm formRef={formRef} claimId={claimId} />;
      case 9:  return <StorageRecoveryDetails formRef={formRef} claimId={claimId} />;
      case 10: return <VehicleDamageAI formRef={formRef} claimId={claimId} />;
      case 11: return <ThirdPartyInsurer formRef={formRef} claimId={claimId} />;
      case 12: return <HireDetailsForm formRef={formRef} claimId={claimId} />;
      case 13: return <DriverDocumentAgreement formRef={formRef} claimId={claimId} />;
      case 14: return <DriverCheckoutForm formRef={formRef} claimId={claimId} />;
      default: return <div>Coming soon…</div>;
    }
  };

  const renderPaymentForm = () => {
    switch (currentPaymentStep) {
      case 0: return <PlatingChargesSection paymentFormRef={paymentFormRef} claimId={claimId} />;
      case 1: return <ABIBHRCharges paymentFormRef={paymentFormRef} claimId={claimId} />;
      case 2: return <ComparisonActualAgreedForm paymentFormRef={paymentFormRef} claimId={claimId} />;
      case 3: return <HirePaymentDetailsForm paymentFormRef={paymentFormRef} claimId={claimId} />;
      case 4: return <DirectHirePaymentForm paymentFormRef={paymentFormRef} claimId={claimId} />;
      default: return <div>Coming soon…</div>;
    }
  };

  useEffect(() => {
    contentScrollRef.current?.scrollTo({ top: 0, behavior: "auto" });
  }, [activeMode, currentStep, currentPaymentStep]);

  return (
    <div className="flex flex-col h-screen w-full bg-white overflow-hidden">
      <Header
        onNext={handleSaveAndNext}
        claimId={claimId}
        isSaving={isSavingScreen}
      />

      <div className="flex flex-1 overflow-hidden pt-6">
        <div className="pl-10 h-full">
          <Sidebar
            steps={steps}
            activeStep={currentStep}
            onStepClick={handleClaimStepClick}
            paymentSteps={paymentSteps}
            activePaymentStep={currentPaymentStep}
            onPaymentStepClick={handlePaymentStepClick}
            activeMode={activeMode}
            completedMap={completedMap}
          />
        </div>

        <div
          ref={contentScrollRef}
          className="flex-1 h-full w-full overflow-y-auto flex justify-center"
          aria-busy={isSavingScreen}
        >
          <div className="w-full max-w-[900px] px-4 pb-10">
            {claimId && !claimReady ? (
              <div className="w-full flex justify-center py-20">
                <SpinnerLoader />
              </div>
            ) : (
              <ClaimCompletionProvider
                activeStep={currentStep}
                onChange={handleCompletionChange}
                claimId={claimId}
                screenKeys={SCREEN_KEYS}
                initialMap={initialCompletion}
                onPersist={persistCompletion}
              >
                {activeMode === "claim" ? renderClaimForm() : renderPaymentForm()}
              </ClaimCompletionProvider>
            )}
          </div>
        </div>
      </div>

      {isSavingScreen && <SpinnerLoader />}
    </div>
  );
};

export default AddClaimPage;
