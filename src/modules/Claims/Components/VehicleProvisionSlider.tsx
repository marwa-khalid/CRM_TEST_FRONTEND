// import React from "react";
// import { motion, AnimatePresence } from "framer-motion";
// import { X } from "lucide-react";

// interface ProvisionLog {
//   registration: string;
//   make: string;
//   model: string;
//   start: string;
//   end: string;
// }

// interface SliderProps {
//   isOpen: boolean;
//   onClose: () => void;
//   logs: ProvisionLog[];
// }

// export const VehicleProvisionSlider = ({
//   isOpen,
//   onClose,
//   logs,
// }: SliderProps) => {
//   return (
//     <AnimatePresence>
//       {isOpen && (
//         <>
//           {/* Backdrop */}
//           <motion.div
//             initial={{ opacity: 0 }}
//             animate={{ opacity: 1 }}
//             exit={{ opacity: 0 }}
//             onClick={onClose}
//             className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[100]"
//           />

//           {/* Slider Panel */}
//           <motion.div
//             initial={{ x: "100%" }}
//             animate={{ x: 0 }}
//             exit={{ x: "100%" }}
//             transition={{ type: "spring", damping: 25, stiffness: 200 }}
//             className="fixed right-0 top-0 h-full w-[1000px] bg-white shadow-2xl z-[101] overflow-hidden flex flex-col font-['Stack_Sans_Headline']"
//           >
//             {/* Header - Matches your "Header" layer */}
//             <div className="w-full px-10 py-5 flex justify-between items-center bg-white shadow-[0px_4px_20px_0px_rgba(0,0,0,0.08)]">
//               <h1 className="text-neutral-900 text-[24px] font-weight-600 leading-6">
//                 Vehicle Provision Log
//               </h1>
//               <button
//                 onClick={onClose}
//                 className="px-10 py-4 bg-white rounded border border-[#3B82F6] text-[#3B82F6] text-base font-weight-400 hover:bg-blue-50 transition-colors"
//               >
//                 Close
//               </button>
//             </div>

//             {/* Content Area */}
//             <div className="flex-1 p-10 overflow-y-auto">
//               {/* Table Container - Matches your "Frame 1171277673" */}
//               <div className="w-full rounded-lg border border-neutral-100 flex flex-col overflow-hidden">
//                 {/* Table Header */}
//                 <div className="w-full h-12 px-4 flex items-center bg-white border-b border-neutral-100">
//                   <div className="w-52 text-[#1e293b] text-sm font-weight-600 uppercase">
//                     Registration
//                   </div>
//                   <div className="w-40 text-[#1e293b] text-sm font-weight-600 uppercase">
//                     Make
//                   </div>
//                   <div className="w-44 text-[#1e293b] text-sm font-weight-600 uppercase">
//                     Model
//                   </div>
//                   <div className="w-36 text-[#1e293b] text-sm font-weight-600 uppercase">
//                     Hire Start
//                   </div>
//                   <div className="w-28 text-[#1e293b] text-sm font-weight-600 uppercase">
//                     Hire End
//                   </div>
//                 </div>

//                 {/* Table Rows */}
//                 {logs.map((log, index) => (
//                   <div
//                     key={index}
//                     className="w-full px-4 py-3 flex items-center bg-white border-b border-neutral-100 last:border-0 hover:bg-slate-50 transition-colors"
//                   >
//                     <div className="w-52 text-neutral-700 text-sm font-weight-300 font-light">
//                       {log.registration}
//                     </div>
//                     <div className="w-40 text-neutral-700 text-sm font-weight-300 font-light">
//                       {log.make}
//                     </div>
//                     <div className="w-44 text-neutral-700 text-sm font-weight-300 font-light">
//                       {log.model}
//                     </div>
//                     <div className="w-36 text-neutral-700 text-sm font-weight-300 font-light">
//                       {log.start}
//                     </div>
//                     <div className="w-28 text-neutral-700 text-sm font-weight-300 font-light">
//                       {log.end}
//                     </div>
//                   </div>
//                 ))}

//                 {/* Fallback if no logs */}
//                 {logs.length === 0 && (
//                   <div className="p-10 text-center text-slate-400">
//                     No provision history found.
//                   </div>
//                 )}
//               </div>
//             </div>
//           </motion.div>
//         </>
//       )}
//     </AnimatePresence>
//   );
// };

import React from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ProvisionLog {
  registration: string;
  make: string;
  model: string;
  start: string;
  end: string;
}

interface SliderProps {
  isOpen: boolean;
  onClose: () => void;
  logs: ProvisionLog[];
}

export const VehicleProvisionSlider = ({
  isOpen,
  onClose,
  logs,
}: SliderProps) => {
  // Active (still on-hire) vehicles first — their hire hasn't ended, shown as
  // "Active"/blank end. Otherwise keep the given order.
  const isActive = (l: ProvisionLog) => {
    const end = String(l.end || "").trim().toLowerCase();
    return end === "" || end === "-" || end === "—" || end === "active";
  };
  const displayLogs = [...logs].sort((a, b) => Number(isActive(b)) - Number(isActive(a)));

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[100]"
          />

          {/* Slider Panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-[1000px] bg-white shadow-2xl z-[101] overflow-hidden flex flex-col font-['Stack_Sans_Headline']"
          >
            {/* Header */}
            <div className="w-full px-10 py-5 flex justify-between items-center bg-white shadow-[0px_4px_20px_0px_rgba(0,0,0,0.08)]">
              <h1 className="text-neutral-900 text-[24px] font-weight-600 leading-6">
                Vehicle Provision Log
              </h1>
              <button
                onClick={onClose}
                className="px-10 py-4 bg-white rounded border border-[#3B82F6] text-[#3B82F6] text-base font-weight-400 hover:bg-blue-50 transition-colors"
              >
                Close
              </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 p-10 overflow-y-auto">
              <div className="w-full rounded-lg border border-neutral-100 flex flex-col overflow-hidden">
                {/* Table Header */}
                <div className="w-full h-12 px-4 flex items-center bg-gray-50 border-b border-neutral-100">
                  <div className="w-52 text-[#1e293b] text-sm font-weight-600 uppercase">
                    Registration
                  </div>
                  <div className="w-40 text-[#1e293b] text-sm font-weight-600 uppercase">
                    Make
                  </div>
                  <div className="w-44 text-[#1e293b] text-sm font-weight-600 uppercase">
                    Model
                  </div>
                  <div className="w-36 text-[#1e293b] text-sm font-weight-600 uppercase">
                    Hire Start
                  </div>
                  <div className="w-28 text-[#1e293b] text-sm font-weight-600 uppercase">
                    Hire End
                  </div>
                </div>

                {/* Table Rows */}
                {displayLogs.map((log, index) => (
                  <div
                    key={index}
                    className="w-full px-4 py-4 flex items-center bg-white border-b border-neutral-100 last:border-0 hover:bg-blue-50/30 transition-colors"
                  >
                    <div className="w-52 text-black text-sm font-weight-500">
                      {log.registration}
                    </div>
                    <div className="w-40 text-neutral-600 text-sm">
                      {log.make}
                    </div>
                    <div className="w-44 text-neutral-600 text-sm">
                      {log.model}
                    </div>
                    <div className="w-36 text-neutral-700 text-sm">
                      {log.start}
                    </div>
                    <div
                      className={`w-28 text-sm font-weight-600 ${log.end === "Active" ? "text-green-600" : "text-neutral-500"}`}
                    >
                      {log.end}
                    </div>
                  </div>
                ))}

                {/* Fallback if no logs */}
                {displayLogs.length === 0 && (
                  <div className="p-20 text-center flex flex-col items-center gap-2">
                    <div className="text-slate-400 text-lg">
                      No provision history found.
                    </div>
                    <div className="text-slate-300 text-sm text-balance">
                      Once you add vehicles in the Hire Details form, they will
                      appear here.
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};