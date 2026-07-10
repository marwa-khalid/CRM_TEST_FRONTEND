import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { gettingEnginerDetails } from "../../../services/EngineeringDetails/engineeringDetails";
import { setEngineerReportReceived } from "../../../redux/Engineer/engineerSlice";

interface SidebarItem {
  step: number;
  label: string;
  isCurrent?: boolean;
}

interface SidebarProps {
  currentStep: number;
  completedSteps: number[];
  onNavigate: (step: number) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  currentStep = 1,
  onNavigate,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const { id } = useParams();

  const dispatch = useDispatch()
  const engineer_report_received = useSelector(
    (state: any) => state?.engineer?.engineer_report_received
  );
  const searchParams = new URLSearchParams(window.location.search);
  const claimID = searchParams.get('claimid');

  useEffect(() => {
    if (id || claimID) {
      const fetchOwner = async () => {
        try {
          const EnginerDetails = await gettingEnginerDetails(id || claimID);
          dispatch(setEngineerReportReceived(EnginerDetails?.engineer_report_received))
        } catch (err) {
          console.error("Error fetching vehicle owner details:", err);
        }
      };
      fetchOwner();
    } else {
      console.warn("⚠️ No id found in route params. Check your <Route path> definition.");
    }
  }, [id]);

  const fullSidebarItems: SidebarItem[] = [
    { step: 1, label: "General Details" },
    { step: 2, label: "Referrer Details" },
    { step: 3, label: "Client Details" },
    { step: 4, label: "Accident Details" },
    { step: 5, label: "Vehicle Details" },
    { step: 6, label: "Vehicle Owner" },
    { step: 7, label: "Engineer Details" },
    { step: 8, label: "Repair Costs & Route Details" },
    { step: 9, label: "Total Loss Details" },
    { step: 10, label: "Client Insurer & Broker" },
    { step: 11, label: "Panel Solicitor Details" },
    { step: 12, label: "Storage & Recovery" },
    { step: 13, label: "Vehicle Damage Details" },
    { step: 14, label: "Third Party & Insurer" },
    { step: 15, label: "Hire Vehicle Provided" },
    { step: 16, label: "Hire Details" },
    { step: 17, label: "Driver Document & Agreement" },
    { step: 18, label: "Driver Checkout" },
    
    // { step: 15, label: "Total Loss" },
    // { step: 16, label: "Hire Details" },
    // { step: 17, label: "Hire Vehicle Details" },
    // { step: 18, label: "Vehicles Details" },
  ];

  const filteredSidebarItems = fullSidebarItems.filter((item) => {
    if (!engineer_report_received && (item.step === 8 || item.step === 9)) {
      return false;
    }
    return true;
  });


  const sidebarItems = filteredSidebarItems.map((item) => ({
    ...item,
    isCurrent: item.step === currentStep,
  }));


  const renderStepButton = (item: SidebarItem) => {
    const { step, label, isCurrent } = item;

    return (
      <button
        key={step}
        onClick={() => onNavigate(step)}
        className={`w-full text-left p-2 transition-colors flex items-center ${isCurrent
          ? " text-custom font-bold border-l-2 border-custom"
          : "hover:bg-gray-50"
          }`}
      >
        {label}
      </button>
    );
  };

  return (
    <div className="relative lg:w-56 mt-4">
      {/* Mobile dropdown button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden w-full p-3 bg-white border border-gray-200 text-left font-medium flex justify-between items-center"
        aria-expanded={isOpen}
        aria-controls="mobile-sidebar-menu"
      >
        {sidebarItems.find((item) => item.isCurrent)?.label || ""}
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""
            }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Mobile dropdown menu */}
      {isOpen && (
        <div
          id="mobile-sidebar-menu"
          className="lg:hidden absolute z-10 mt-1 w-full bg-white max-h-96 overflow-y-auto"
        >
          <nav className="p-2 text-sm">
            {sidebarItems.map((item) => renderStepButton(item))}
          </nav>
        </div>
      )}

      {/* Desktop sidebar */}
      <nav
        className="hidden lg:block p-4 text-sm bg-white"
        aria-label="Claim steps navigation"
      >
        <div className="space-y-1">
          {sidebarItems.map((item) => renderStepButton(item))}
        </div>
      </nav>
    </div>
  );
};

export default Sidebar;
