import { useState } from "react";
import Sidebar from "./Components/ClaimSidebar";
import Header from "./Components/ClaimHeader";
import { GeneralDetailsForm } from "./Steps/GeneralDetailsForm";
import { ReferrerDetailsForm } from "./Steps/ReferrerDetailsForm";
import { ClientDetailsForm } from "./Steps/ClientDetailsForm";

const AddClaimPage = () => {
  // 1. Manage current step index
  const [currentStep, setCurrentStep] = useState(0);

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

  // 2. Component Switcher Logic
  const renderForm = () => {
    switch (currentStep) {
      case 0:
        return <GeneralDetailsForm />;
      case 1:
        return <ReferrerDetailsForm />;
      case 2:
        return <ClientDetailsForm />;
      default:
        return (
          <div className="p-10 text-gray-400">
            Form for "{steps[currentStep].label}" coming soon...
          </div>
        );
    }
  };

  return (
    <div className="flex flex-col h-screen w-full bg-white overflow-hidden">
      <Header />

      <div className="flex flex-1 overflow-hidden pt-6">
        <div className="pl-10 h-full">
          {/* 3. Pass currentStep and setter to Sidebar */}
          <Sidebar
            steps={steps}
            activeStep={currentStep}
            onStepClick={setCurrentStep}
          />
        </div>

        <div className="flex-1 h-full w-full overflow-y-auto px-10 pb-20">
          {renderForm()}
        </div>
      </div>
    </div>
  );
};

export default AddClaimPage;
