import React from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { Check } from "lucide-react";
import logo from '../../../assets/AutoClaim_icon/logo.svg'
const STEPS = [
  { id: 1, label: "Witness Details", path: "/questionnaire/step-1" },
  { id: 2, label: "Questionnaire", path: "/questionnaire/step-2" },
  { id: 3, label: "Incident Sketch", path: "/questionnaire/step-3" },
  { id: 4, label: "E-Signature", path: "/questionnaire/step-4" },
];

const QuestionnaireLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
    const reference = localStorage.getItem("CaseReference")

    
  // Hide sidebar/header if we are in the full-screen canvas mode
  const isCanvasMode = location.pathname.includes("step-4");

  if (isCanvasMode) return <Outlet />;

  return (
    <div className="min-h-screen bg-white flex flex-col font-['Stack_Sans_Headline']">
      {/* Persistent Header */}
      <header className="w-full px-10 py-5 bg-white shadow-[0px_4px_20px_0px_rgba(0,0,0,0.08)] flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-6">
          <img src={logo} alt="" />
          <h2 className="text-black text-2xl font-weight-600 leading-6">
            Witness Statement of Truth
          </h2>
          <div className="text-base">
            <span className="text-gray-700 font-weight-600">Our Ref: </span>
            <span className="text-gray-500 font-normal">{reference}</span>
          </div>
        </div>
        <div className="flex gap-5">
          <button className="px-10 py-4 bg-white border border-blue-600 text-blue-600 rounded-lg font-medium">
            Discard
          </button>
          <button
            onClick={() => {
              /* logic to find next step path */
            }}
            className="px-10 py-4 bg-blue-600 text-white rounded-lg font-medium"
          >
            Save & Next
          </button>
        </div>
      </header>

      <div className="flex flex-1 p-10 gap-10">
        {/* Sidebar Navigation */}
        <aside className="w-72 p-6 rounded-lg border border-gray-100 flex flex-col gap-4 h-fit sticky top-32">
          {STEPS.map((step) => {
            const isActive = location.pathname.includes(`step-${step.id}`);
            const isComplete =
              STEPS.findIndex((s) => location.pathname.includes(s.path)) >
              STEPS.indexOf(step);

            return (
              <div
                key={step.id}
                className="flex items-center gap-3 self-stretch cursor-pointer"
                onClick={() => navigate(step.path)}
              >
                <div
                  className={`w-4 h-4 rounded-full flex items-center justify-center transition-all ${
                    isComplete
                      ? "bg-green-500"
                      : isActive
                        ? "bg-blue-400"
                        : "border-2 border-blue-200"
                  }`}
                >
                  {isComplete && <Check size={10} className="text-white" />}
                </div>
                <span
                  className={`text-base ${isActive ? "text-blue-600 font-weight-600" : "text-gray-600 font-normal"}`}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </aside>

        {/* This is where Step 1, 2, or 3 will render */}
        <main className="flex-1 flex justify-center">
          <div className="w-full max-w-[788px]">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default QuestionnaireLayout;
