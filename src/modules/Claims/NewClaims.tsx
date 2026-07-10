import React, { useState, useEffect, useRef } from "react";
import { ChevronLeft, MoreVertical, History, Upload } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import ClientsDetails from "../../claims/NewClaims/ClientDetails";
import GeneralDetails from "../../claims/NewClaims/GeneralDetails";
import ReferrerDetails from "../../claims/NewClaims/ReferrerDetails";
import AccidentDetails from "../../claims/NewClaims/AccidentDetails";
import VehicleOwnerDetails from "../../claims/NewClaims/VehicleOwner";
import VehicleDetails from "../../claims/NewClaims/VehicleDetails";
import Siderbar from "../../claims/Claims/Sidebar/sidebar";
import { getClaimById } from "../../services/Claims/Claims";
import { useDispatch, useSelector } from "react-redux";
import EngineerDetails from "../../claims/NewClaims/EngineerDetails";
import RepairCosts from "../../claims/NewClaims/RepairCosts";
import TotalLossDetail from "../../claims/NewClaims/TotalLossDetail";
import ClientInsurerDetails from "../../claims/NewClaims/ClientInsurerDetails";
import PanelSolicitorDetails from "../../claims/NewClaims/PanelSolicitorDetails";
import StorageRecovery from "../../claims/NewClaims/StorageRecovery";
import ThirdPartyInsurer from "../../claims/NewClaims/ThirdPartyInsurer";
import VehicleDamageForm from "../../claims/NewClaims/VehicleDamage";
import DriverDocumentAgreement from "../../claims/NewClaims/DriverDocumentAgreement";
import HireDetails from "../../claims/NewClaims/HireDetails";
import HireVehicleProvided from "../../claims/NewClaims/HireVehicleProvided";
import DriverCheckoutChargesForm from "../../claims/NewClaims/DriverCheckoutChargesForm";
import Drawer from "../../claims/Drawer/Drawer";
import UploadClaimFileModal from "../../claims/UploadClaimFile/UploadClaimFile";
import { setSelectedPosition } from "../../redux/Claim/claimSlice";
import { File06 } from "@untitledui/icons";

const ClaimsForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [step, setStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([1]);
  const [claimData, setClaimData] = useState<any>(null);
  const [loading, setLoading] = useState(!!id);
  const [isDrawerVisible, setIsDrawerVisible] = useState(false);
  const [skipNext, setSkipNext] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadConfirming, setUploadConfirming] = useState(false);

  const generalFormRef = useRef<any>(null);
  const referrerFormRef = useRef<any>(null);
  const clientFormRef = useRef<any>(null);
  const accidentFormRef = useRef<any>(null);
  const vehicleFormRef = useRef<any>(null);
  const vehicleOwnerFormRef = useRef<any>(null);
  const engineerDetailsFormRef = useRef<any>(null);
  const repairCoastFormRef = useRef<any>(null);
  const totalLossFormRef = useRef<any>(null);
  const clientInsurerFormRef = useRef<any>(null);
  const panelSolicitorDetailsFormRef = useRef<any>(null);
  const storageRecoveryFormRef = useRef<any>(null);
  const vehicleDamageFormRef = useRef<any>(null);
  const thirdPartyInsurerFormRef = useRef<any>(null);
  const driverDocumentAgreementFormRef = useRef<any>(null);
  const hireDetailsFormRef = useRef<any>(null);
  const hireVehicleProvidedFormRef = useRef<any>(null);
  const driverCheckoutFormRef = useRef<any>(null);
  const searchParams = new URLSearchParams(window.location.search);
  const claimID = searchParams.get("claimid");
  const { isClosed, referrence_no } = useSelector(
    (state: any) => state.isClosed
  );

  const engineer_report_received = useSelector(
    (state: any) => state?.engineer?.engineer_report_received
  );

  const dispatch = useDispatch();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };

    const handleScroll = () => {
      setShowMenu(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("scroll", handleScroll);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useEffect(() => {
    const currentClaimId = claimID || id;

    if (currentClaimId) {
      const fetchClaimData = async () => {
        try {
          setLoading(true);
          const data = await getClaimById(parseInt(currentClaimId));
          setClaimData(data);
          setIsEditing(true);
        } catch (error) {
          setIsEditing(false);
          console.error("Failed to fetch claim data:", error);
          setSubmitError("Failed to load claim data");
        } finally {
          setLoading(false);
        }
      };

      fetchClaimData();
    }
  }, [id, claimID]);

  // Handle file upload
  const handleUploadFiles = async (files: File[]) => {
    setUploadConfirming(true);
    try {
      // Here you can implement your actual file upload logic
      console.log("Uploading files for claim:", claimID || id);
      console.log("Files to upload:", files);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Success message
      alert(`${files.length} file(s) uploaded successfully!`);

      // Close modal
      setShowUploadModal(false);
    } catch (error) {
      console.error("Upload error:", error);
      alert("Failed to upload files. Please try again.");
    } finally {
      setUploadConfirming(false);
    }
  };

  const handleNext = async (param: any, key: string) => {
    setSubmitError("");
    setIsSubmitting(true);
    setSkipNext(false);

    try {
      let formikInstance: any = null;

      switch (step) {
        case 1:
          formikInstance = generalFormRef.current;
          break;
        case 2:
          formikInstance = referrerFormRef.current;
          break;
        case 3:
          formikInstance = clientFormRef.current;
          break;
        case 4:
          formikInstance = accidentFormRef.current;
          break;
        case 5:
          formikInstance = vehicleFormRef.current;
          break;
        case 6:
          formikInstance = vehicleOwnerFormRef.current;
          break;
        case 7:
          formikInstance = engineerDetailsFormRef.current;
          break;
        case 8:
          formikInstance = repairCoastFormRef.current;
          break;
        case 9:
          formikInstance = totalLossFormRef.current;
          break;
        case 10:
          formikInstance = clientInsurerFormRef.current;
          break;
        case 11:
          formikInstance = panelSolicitorDetailsFormRef.current;
          break;
        case 12:
          formikInstance = storageRecoveryFormRef.current;
          break;
        case 13:
          formikInstance = vehicleDamageFormRef.current;
          break;
        case 14:
          formikInstance = thirdPartyInsurerFormRef.current;
          break;
        case 15:
          formikInstance = hireVehicleProvidedFormRef.current;
          break;
        case 16:
          formikInstance = hireDetailsFormRef.current;
          break;
        case 17:
          formikInstance = driverDocumentAgreementFormRef.current;
          break;
        case 18:
          formikInstance = driverCheckoutFormRef.current;
          break;
        default:
          break;
      }
      if (key === "sideBar") {
        if (param !== 8 && param !== 9) {
          setSkipNext(true);
          localStorage.setItem("navigate", "true");
          await formikInstance?.submitForm({ isSideBarSubmit: true });
        }

        setStep(param);
        return;
      }

      if (formikInstance) {
        dispatch(setSelectedPosition({ key: "next", param: param }));
        localStorage.setItem("navigate", "false");
        await formikInstance.submitForm({ isSideBarSubmit: false });

        await new Promise((resolve) => setTimeout(resolve, 50));

        if (
          formikInstance.errors &&
          Object.keys(formikInstance.errors).length > 0
        ) {
          return;
        }
      }

      if (!completedSteps.includes(step)) {
        setCompletedSteps((prev) => [...prev, step]);
      }

      if (engineer_report_received === true) {
        if (param <= 17 && key === "next") {
          setStep(step + 1);
        } else if (param === 19 && key === "next") {
          navigate("/claims");
        }
      } else {
        if (param === 19 && key === "next") {
          navigate("/claims");
          return;
        }
        dispatch(setSelectedPosition({ key: "next", param: param }));
        setStep(param);
      }
    } catch (err) {
      console.error("Form submission error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleDrawer = () => {
    setIsDrawerVisible((prev) => !prev);
    setShowMenu(false);
  };

  const toggleUploadModal = () => {
    setShowUploadModal((prev) => !prev);
    setShowMenu(false);
  };

  const toggleMenu = () => {
    setShowMenu((prev) => !prev);
  };

  // const handleBack = () => {
  //   if (step > 1) {
  //     setStep((prev) => prev - 1);
  //   } else {
  //     navigate(-1);
  //   }
  // };
  const handleBack = () => {
    navigate("/claims");
  };

  const handleSidebarNavigation = (stepNumber: number) => {
    setStep(stepNumber);
    setSkipNext(true);
    dispatch(setSelectedPosition({ key: "sideBar", param: stepNumber }));
    handleNext(stepNumber, "sideBar");
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <GeneralDetails
            ref={generalFormRef}
            claimData={claimData}
            isEditMode={!!id}
            isEditing={isEditing}
            skipNext={skipNext}
            handleNext={handleNext}
          />
        );
      case 2:
        return (
          <ReferrerDetails
            ref={referrerFormRef}
            claimData={claimData}
            skipNext={skipNext}
            handleNext={handleNext}
          />
        );
      case 3:
        return (
          <ClientsDetails
            ref={clientFormRef}
            claimData={claimData}
            isEditMode={!!id}
            skipNext={skipNext}
            handleNext={handleNext}
          />
        );
      case 4:
        return (
          <AccidentDetails
            ref={accidentFormRef}
            skipNext={skipNext}
            handleNext={handleNext}
          />
        );
      case 5:
        return (
          <VehicleDetails
            ref={vehicleFormRef}
            claimData={claimData}
            isEditMode={!!id}
            skipNext={skipNext}
            handleNext={handleNext}
          />
        );
      case 6:
        return (
          <VehicleOwnerDetails
            ref={vehicleOwnerFormRef}
            claimData={claimData}
            isEditMode={!!id}
            skipNext={skipNext}
            handleNext={handleNext}
          />
        );
      case 7:
        return (
          <EngineerDetails
            ref={engineerDetailsFormRef}
            claimData={claimData}
            isEditMode={!!id}
            skipNext={skipNext}
            handleNext={handleNext}
          />
        );
      case 8:
        return (
          <RepairCosts
            ref={repairCoastFormRef}
            claimData={claimData}
            skipNext={skipNext}
            handleNext={handleNext}
          />
        );
      case 9:
        return (
          <TotalLossDetail
            ref={totalLossFormRef}
            skipNext={skipNext}
            handleNext={handleNext}
          />
        );
      case 10:
        return (
          <ClientInsurerDetails
            ref={clientInsurerFormRef}
            claimData={claimData}
            isEditMode={!!id}
            skipNext={skipNext}
            handleNext={handleNext}
          />
        );
      case 11:
        return (
          <PanelSolicitorDetails
            ref={panelSolicitorDetailsFormRef}
            claimData={claimData}
            isEditMode={!!id}
            skipNext={skipNext}
            handleNext={handleNext}
          />
        );
      case 12:
        return (
          <StorageRecovery
            ref={storageRecoveryFormRef}
            claimData={claimData}
            isEditMode={!!id}
            skipNext={skipNext}
            handleNext={handleNext}
          />
        );
      case 13:
        return (
          <VehicleDamageForm
            ref={vehicleDamageFormRef}
            claimData={claimData}
            isEditMode={!!id}
            skipNext={skipNext}
            handleNext={handleNext}
          />
        );
      case 14:
        return (
          <ThirdPartyInsurer
            ref={thirdPartyInsurerFormRef}
            claimData={claimData}
            isEditMode={!!id}
            skipNext={skipNext}
            handleNext={handleNext}
          />
        );
      case 17:
        return (
          <DriverDocumentAgreement
            ref={driverDocumentAgreementFormRef}
            claimData={claimData}
            isEditMode={!!id}
            skipNext={skipNext}
            handleNext={handleNext}
          />
        );
      case 16:
        return (
          <HireDetails
            ref={hireDetailsFormRef}
            claimData={claimData}
            isEditMode={!!id}
            skipNext={skipNext}
            handleNext={handleNext}
          />
        );
      case 15:
        return (
          <HireVehicleProvided
            ref={hireVehicleProvidedFormRef}
            claimData={claimData}
            isEditMode={!!id}
            skipNext={skipNext}
            handleNext={handleNext}
          />
        );
      case 18:
        return (
          <DriverCheckoutChargesForm
            ref={driverCheckoutFormRef}
            claimData={claimData}
            isEditMode={!!id}
            skipNext={skipNext}
            handleNext={handleNext}
          />
        );

      default:
        return (
          <GeneralDetails
            ref={generalFormRef}
            claimData={claimData}
            skipNext={skipNext}
            isEditMode={!!id}
          />
        );
    }
  };

  if (loading || isSubmitting) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-custom"></div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-10">
      {/* Header */}
      <div className="border-b border-gray-200 px-4 sm:px-6 py-4 sticky top-[64px] bg-white z-40 shadow-sm">
        <div>
          <button
            className="flex items-center gap-2 py-4 sm:py-6 text-gray-600 hover:text-gray-800 transition-colors"
            onClick={handleBack}
          >
            <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
            <span className="text-sm sm:text-md">
              {step === 1 ? "Back to queue" : "Back"}
            </span>
          </button>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-0">
          <div className="flex items-center gap-2 sm:gap-4">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-weight-600 text-gray-900">
              {(id || claimID) && referrence_no !== ""
                ? `${referrence_no}`
                : "Add New Claim"}
            </h1>
          </div>
          {!isClosed && (
            <div className="flex gap-2 sm:gap-3 mr-[-5px] font-weight-600 text-xs sm:text-sm relative">
              {/* 3-dots menu with click-outside detection */}
              <div className="relative" ref={menuRef}>
                <button
                  className="h-[40px] sm:h-[44px] min-w-[44px] px-3 sm:px-4 bg-white border rounded-lg shadow 
             flex items-center justify-center text-gray-700 hover:bg-gray-50 transition-colors"
                  onClick={toggleMenu}
                >
                  <MoreVertical className="h-4 w-4" />
                </button>

                {showMenu && (
                  <div className="absolute right-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 z-50 min-w-[180px]">
                    {/* History Activity Button */}
                    <button
                      className="w-full px-4 py-3 text-left text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors"
                      onClick={toggleDrawer}
                    >
                      <History className="h-4 w-4" />
                      <span>Activity Log</span>
                    </button>

                    {/* Upload File Button */}
                    <button
                      className="w-full px-4 py-3 text-left text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors"
                      onClick={toggleUploadModal}
                    >
                      <File06 className="h-4 w-4 flex-shrink-0" />
                      <span className="whitespace-nowrap">Claim Documents</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Discard */}
              <button
                className="px-3 sm:px-4 py-1 sm:py-2 text-gray-700 bg-white rounded-lg border shadow hover:bg-gray-50 transition-colors"
                onClick={() => navigate("/claims")}
              >
                Discard
              </button>

              {/* Save & Next / Save */}
              {step < 18 ? (
                <button
                  onClick={() => handleNext(step + 1, "next")}
                  disabled={isSubmitting}
                  className={`px-3 sm:px-4 py-1 sm:py-2 rounded-lg transition-colors ${
                    !isSubmitting
                      ? "text-white bg-custom hover:bg-[#252B37]"
                      : "text-gray-400 bg-gray-200 cursor-not-allowed"
                  }`}
                >
                  {isSubmitting ? "Processing..." : "Save & Next"}
                </button>
              ) : (
                <button
                  onClick={() => handleNext(19, "next")}
                  disabled={isSubmitting}
                  className={`px-3 sm:px-4 py-1 sm:py-2 rounded-lg transition-colors ${
                    !isSubmitting
                      ? "text-white bg-custom hover:bg-black"
                      : "text-gray-400 bg-gray-200 cursor-not-allowed"
                  }`}
                >
                  {isSubmitting ? "Processing..." : "Save"}
                </button>
              )}
            </div>
          )}
        </div>
        {submitError && (
          <div className="text-red-500 text-sm mt-2">{submitError}</div>
        )}
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        {/* Sidebar */}
        <div className="lg:w-64 flex">
          <Siderbar
            currentStep={step}
            completedSteps={completedSteps}
            onNavigate={handleSidebarNavigation}
          />
        </div>
        {/* Main Form Content */}
        <div className="flex-1">{renderStep()}</div>
      </div>

      {/* History Activity Drawer */}
      <Drawer
        visible={isDrawerVisible}
        onClose={toggleDrawer}
        claimId={claimID || id}
        position="right"
      >
        <div className="p-6">
          <h2 className="font-weight-600 text-xl mb-4">History Activity</h2>
          <div className="space-y-4">
            <div className="border-l-2 border-blue-500 pl-4 py-2">
              <p className="text-sm text-gray-600">Today, 10:30 AM</p>
              <p className="font-medium">Claim updated by John Doe</p>
              <p className="text-gray-600">Modified vehicle details</p>
            </div>
            <div className="border-l-2 border-green-500 pl-4 py-2">
              <p className="text-sm text-gray-600">Yesterday, 14:20 PM</p>
              <p className="font-medium">Accident details added</p>
              <p className="text-gray-600">By Sarah Johnson</p>
            </div>
            <div className="border-l-2 border-purple-500 pl-4 py-2">
              <p className="text-sm text-gray-600">2 days ago, 09:15 AM</p>
              <p className="font-medium">Claim created</p>
              <p className="text-gray-600">Initial claim setup</p>
            </div>
          </div>
        </div>
      </Drawer>

      {/* Upload File Modal */}
      <UploadClaimFileModal
        isOpen={showUploadModal}
        onClose={toggleUploadModal}
        onUpload={handleUploadFiles}
        claimId={claimID || id}
        confirming={() => uploadConfirming}
        error={null}
      />
    </div>
  );
};

export default ClaimsForm;
