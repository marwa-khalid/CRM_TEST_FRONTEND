import VulnerablePDF from "../../../assets/documents/Vulnerable_Person_Policy (7) (1).pdf";
import Vulnerable from '../../../assets/AutoClaim_icon/Vulnerable.svg'
export const VulnerablePolicyModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-[100] p-10">
      <div className="card bg-white w-[788px] h-full flex flex-col overflow-hidden ">
        {/* Modal Header */}
        <div
          data-layer="Header"
          className="w-full px-10 py-5 bg-white shadow-[0px_4px_20px_0px_rgba(0,0,0,0.08)] inline-flex justify-between items-center relative z-10"
        >
          {/* Back Button and Title */}
          <div
            data-layer="Back Button Container"
            className="flex justify-start items-center gap-4"
          >
            <div
              data-layer="Header Text Container"
              className="flex justify-start items-center gap-6"
            >
              <button
                onClick={onClose}
                className="hover:bg-gray-100 p-1 rounded-full transition-colors"
              >
                <img src={Vulnerable} />
              </button>
              <div
                data-layer="Header Title"
                className="text-black text-2xl font-weight-600 font-['Stack_Sans_Headline'] leading-6"
              >
                Vulnerable Policy
              </div>
            </div>
          </div>

          {/* Header Actions */}
          <div
            data-layer="Header Actions"
            className="flex justify-start items-center gap-5"
          >
            <button
              onClick={onClose}
              data-layer="Button"
              className="px-10 py-4 bg-blue-500 hover:bg-blue-600 active:bg-blue-700 rounded flex justify-center items-center transition-colors"
            >
              <span className="text-white text-base font-weight-400 font-['Stack_Sans_Headline'] leading-4">
                Close
              </span>
            </button>
          </div>
        </div>

        {/* The Website Content */}
        <div className="w-full h-[800px] bg-white relative">
          <iframe
            src={`${VulnerablePDF}#toolbar=0&navpanes=0&view=FitW`}
            title="Policy"
            className="absolute"
            style={{
              // We make the iframe 20% wider and taller to "push"
              backgroundColor: "white",
              width: "120%",
              height: "120%",
              top: "-5%",
              left: "-10%",
              border: "none",
            }}
          />
        </div>
      </div>
    </div>
  );
};
