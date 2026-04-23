import { useState, useRef } from "react";
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

const AddClaimPage = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [currentPaymentStep, setCurrentPaymentStep] = useState(0);

  // 🔥 This ref will hold formik reference
  const formRef = useRef<any>(null);
  const paymentFormRef = useRef<any>(null);

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
    { label: "Direct Hire Payment" },
  ];

  // ✅ This is called from Header
  const handleSaveAndNext = async () => {
    if (formRef.current) {
      try {
        await formRef.current.submitForm(); // 🔥 trigger formik submit
        setCurrentStep((prev) => prev + 1); // move next only after success
      } catch (err) {
        console.error("Submission failed");
      }
    }
  };
  // ✅ This is called from Header
  const handleSaveAndNextPayment = async () => {
    if (paymentFormRef.current) {
      try {
        await paymentFormRef.current.submitForm(); // 🔥 trigger formik submit
        setCurrentPaymentStep((prev) => prev + 1); // move next only after success
      } catch (err) {
        console.error("Submission failed");
      }
    }
  };

  const renderForm = () => {
    switch (currentStep) {
      case 0:
        return <GeneralDetailsForm formRef={formRef} />;
      case 1:
        return <ReferrerDetailsForm formRef={formRef} />;
      case 2:
        return <ClientDetailsForm formRef={formRef} />;
      case 3:
        return <AccidentDetailsForm formRef={formRef} />;
      case 4:
        return <VehicleDetailsForm formRef={formRef} />;
      case 5:
        return <VehicleOwnerForm formRef={formRef} />;
      case 6:
        return <EngineerDetailsForm formRef={formRef} />;
      case 7:
        return <ClientInsurerBrokerForm formRef={formRef} />;
      case 8:
        return <PanelSolicitorForm formRef={formRef} />;
      case 9:
        return <StorageRecoveryDetails formRef={formRef} />;
      case 10:
        return <VehicleDamageAI formRef={formRef} />;
      case 11:
        return <ThirdPartyInsurer formRef={formRef} />;

      case 12:
        return <HireDetailsForm formRef={formRef} />;
      case 13:
        return <DriverDocumentAgreement formRef={formRef} />;
      case 14:
        return <DriverCheckoutForm formRef={formRef} />;
      default:
        return <div>Coming soon...</div>;
    }
  };
 const renderPaymentForm = () => {
   switch (currentStep) {
     case 0:
       return <PlatingChargesSection paymentFormRef={paymentFormRef} />;
     case 1:
       return <ABIBHRCharges paymentFormRef={paymentFormRef} />;
     case 2:
       return <ClientDetailsForm formRef={formRef} />;
     case 3:
       return <AccidentDetailsForm formRef={formRef} />;
     case 4:
       return <VehicleDetailsForm formRef={formRef} />;
     default:
       return <div>Coming soon...</div>;
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
            onStepClick={setCurrentStep}
            paymentSteps={paymentSteps}
            activePaymentStep={currentPaymentStep}
            onPaymentStepClick={setCurrentPaymentStep}
          />
        </div>

        <div className="flex-1 h-full w-full overflow-y-auto flex justify-center">
          <div className="w-full max-w-[900px] px-4">{renderForm()}</div>
        </div>
        {/* <div className="flex-1 h-full w-full overflow-y-auto px-10 justify-center">
          {renderPaymentForm()}
        </div> */}
      </div>
    </div>
  );
};;

export default AddClaimPage;
