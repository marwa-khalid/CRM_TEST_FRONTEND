import { useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Sidebar from "./Components/ClaimSidebar";
import { Header } from "./Components/ClaimHeader";
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
  const [currentStep, setCurrentStep] = useState(0);
  const [currentPaymentStep, setCurrentPaymentStep] = useState(0);
  const [activeMode, setActiveMode] = useState<ActiveMode>("claim");

  const formRef = useRef<any>(null);
  const paymentFormRef = useRef<any>(null);

  const handleClaimCreated = (newId: string | number) => {
    navigate(`/add-claim/${newId}`, { replace: true });
  };

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

  const handleSaveAndNext = async () => {
    if (activeMode === "claim") {
      if (formRef.current) {
        try {
          await formRef.current.submitForm();
          setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
        } catch {
          /* validation errors are shown inline */
        }
      }
    } else {
      if (paymentFormRef.current) {
        try {
          await paymentFormRef.current.submitForm();
          setCurrentPaymentStep((prev) => Math.min(prev + 1, paymentSteps.length - 1));
        } catch {
          /* validation errors are shown inline */
        }
      }
    }
  };

  const handleClaimStepClick = (idx: number) => {
    setActiveMode("claim");
    setCurrentStep(idx);
  };

  const handlePaymentStepClick = (idx: number) => {
    setActiveMode("payment");
    setCurrentPaymentStep(idx);
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

  return (
    <div className="flex flex-col h-screen w-full bg-white overflow-hidden">
      <Header onNext={handleSaveAndNext} />

      <div className="flex flex-1 overflow-hidden pt-6">
        <div className="pl-10 h-full">
          <Sidebar
            steps={steps}
            activeStep={currentStep}
            onStepClick={handleClaimStepClick}
            paymentSteps={paymentSteps}
            activePaymentStep={currentPaymentStep}
            onPaymentStepClick={handlePaymentStepClick}
          />
        </div>

        <div className="flex-1 h-full w-full overflow-y-auto flex justify-center">
          <div className="w-full max-w-[900px] px-4 pb-10">
            {activeMode === "claim" ? renderClaimForm() : renderPaymentForm()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddClaimPage;
