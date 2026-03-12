// import { useState } from "react";
// import Sidebar from "./Components/ClaimSidebar";
// import {Header} from "./Components/ClaimHeader";
// import GeneralDetailsForm  from "./Steps/GeneralDetailsForm";
// import { ReferrerDetailsForm } from "./Steps/ReferrerDetailsForm";
// import { ClientDetailsForm } from "./Steps/ClientDetailsForm";
// import { AccidentDetailsForm } from "./Steps/AccidentDetailsForm";
// import { VehicleDetailsForm } from "./Steps/VehicleDetailsForm";
// // import { PassengerDetailsForm } from "./Steps/PassengerDetailsModal";

// const AddClaimPage = () => {
//   // 1. Manage current step index
//   const [currentStep, setCurrentStep] = useState(0);
// const handleNext = () => {
//   if (currentStep < steps.length - 1) {
//     setCurrentStep((prev) => prev + 1);
//   }
// };
//   const steps = [
//     { label: "General Details" },
//     { label: "Referrer Details" },
//     { label: "Client Details" },
//     { label: "Accident Details" },
//     { label: "Vehicle Details" },
//     { label: "Vehicle Owner" },
//     { label: "Engineer Details" },
//     { label: "Client Insurer & Broker" },
//     { label: "Panel Solicitor Details" },
//     { label: "Storage & Recovery" },
//     { label: "Vehicle Damage Details" },
//     { label: "Third Party & Insurer" },
//     { label: "Hire Vehicle Provided" },
//     { label: "Driver Document & Agreement" },
//     { label: "Driver Checkout" },
//   ];

//   // 2. Component Switcher Logic
//   const renderForm = () => {
//     switch (currentStep) {
//       case 0:
//         return <GeneralDetailsForm />;
//       case 1:
//         return <ReferrerDetailsForm />;
//       case 2:
//         return <ClientDetailsForm />;
//       case 3:
//         return <AccidentDetailsForm />;
//       case 4:
//         return <VehicleDetailsForm/>
//       default:
//         return (
//           <div className="p-10 text-gray-400">
//             Form for "{steps[currentStep].label}" coming soon...
//           </div>
//         );
//     }
//   };

//   return (
//     <div className="flex flex-col h-screen w-full bg-white overflow-hidden">
//       <Header onNext={handleNext} />

//       <div className="flex flex-1 overflow-hidden pt-6">
//         <div className="pl-10 h-full">
//           {/* 3. Pass currentStep and setter to Sidebar */}
//           <Sidebar
//             steps={steps}
//             activeStep={currentStep}
//             onStepClick={setCurrentStep}
//           />
//         </div>

//         <div className="flex-1 h-full w-full overflow-y-auto px-10 pb-20">
//           {renderForm()}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default AddClaimPage;


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

const AddClaimPage = () => {
  const [currentStep, setCurrentStep] = useState(0);

  // 🔥 This ref will hold formik reference
  const formRef = useRef<any>(null);

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
      case 12:
        return <HireDetailsForm formRef={formRef} />;
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
          />
        </div>

        <div className="flex-1 h-full w-full overflow-y-auto px-10 justify-center">
          {renderForm()}
        </div>
      </div>
    </div>
  );
};

export default AddClaimPage;
