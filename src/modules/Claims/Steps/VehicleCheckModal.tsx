import Vehicle from "../../../assets/AutoClaim_icon/Vehicle.svg";

export const VehicleCheckModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-[100] p-10">
      <div className="card bg-white w-full h-full flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div
          data-layer="Header"
         className="w-full px-10 py-5 bg-white shadow-[0px_4px_20px_0px_rgba(0,0,0,0.08)] inline-flex justify-between items-center relative z-10">
          {/* Back Button and Title */}
          <div
            data-layer="Back Button Container"
            className="flex justify-start items-center gap-4"
          >
            <button
              onClick={onClose}
              className="hover:bg-gray-100 p-1 rounded-full transition-colors"
            >
              <img src={Vehicle} />
            </button>
            <div
              data-layer="Header Text Container"
              className="flex justify-start items-center gap-6"
            >
              <div
                data-layer="Header Title"
                className="text-black text-2xl font-weight-600 font-['Stack_Sans_Headline'] leading-6"
              >
                Vehicle Check
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
        <iframe
          src="https://www.carcheck.co.uk/"
          className="w-full h-full border-none"
          title="Vehicle Check"
        />
      </div>
    </div>
  );
};
