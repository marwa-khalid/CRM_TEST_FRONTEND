import React, {
  createContext,
  useContext,
  useMemo,
  useState
} from "react";
import type { ReactNode } from "react";
import { Outlet, useLocation, useNavigate, useParams } from "react-router-dom";
import { Check } from "lucide-react";
import logo from "../../../assets/AutoClaim_icon/logo.svg";

type QuestionnaireFormData = {
  witnessDetails: Record<string, any>;
  questionnaire: Record<string, any>;
  incidentSketch: Record<string, any>;
  signature: Record<string, any>;
};

type QuestionnaireContextType = {
  formData: QuestionnaireFormData;
  updateStepData: (stepKey: keyof QuestionnaireFormData, data: any) => void;
  resetFormData: () => void;
};

const initialFormData: QuestionnaireFormData = {
  witnessDetails: {},
  questionnaire: {},
  incidentSketch: {},
  signature: {},
};

const QuestionnaireContext = createContext<QuestionnaireContextType | null>(
  null,
);

export const useQuestionnaireForm = () => {
  const context = useContext(QuestionnaireContext);

  if (!context) {
    throw new Error(
      "useQuestionnaireForm must be used inside QuestionnaireLayout",
    );
  }

  return context;
};

const QuestionnaireProvider = ({ children }: { children: ReactNode }) => {
  const [formData, setFormData] =
    useState<QuestionnaireFormData>(initialFormData);

  const updateStepData = (stepKey: keyof QuestionnaireFormData, data: any) => {
    setFormData((prev) => ({
      ...prev,
      [stepKey]: {
        ...prev[stepKey],
        ...data,
      },
    }));
  };

  const resetFormData = () => {
    setFormData(initialFormData);
  };

  return (
    <QuestionnaireContext.Provider
      value={{
        formData,
        updateStepData,
        resetFormData,
      }}
    >
      {children}
    </QuestionnaireContext.Provider>
  );
};

const QuestionnaireLayoutContent = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { token } = useParams();

  const reference = localStorage.getItem("CaseReference");

  const basePath = token ? `/questionnaire/${token}` : "/questionnaire";

  const steps = useMemo(
    () => [
      {
        id: 1,
        label: "Witness Details",
        path: `${basePath}/step-1`,
      },
      {
        id: 2,
        label: "Questionnaire",
        path: `${basePath}/step-2`,
      },
      {
        id: 3,
        label: "Incident Sketch",
        path: `${basePath}/step-3`,
      },
      {
        id: 4,
        label: "E-Signature",
        path: `${basePath}/step-4`,
      },
    ],
    [basePath],
  );

  const currentStepIndex = steps.findIndex((step) =>
    location.pathname.includes(`step-${step.id}`),
  );

  const currentStep =
    currentStepIndex >= 0 ? steps[currentStepIndex] : steps[0];

  const isCanvasMode = location.pathname.includes("step-4");

  const goNext = () => {
    const nextStep = steps[currentStepIndex + 1];

    if (nextStep) {
      navigate(nextStep.path);
    }
  };

  const goBack = () => {
    const previousStep = steps[currentStepIndex - 1];

    if (previousStep) {
      navigate(previousStep.path);
    }
  };

  const handleDiscard = () => {
    navigate(-1);
  };

  if (isCanvasMode) {
    return (
      <div className="min-h-screen bg-white font-['Stack_Sans_Headline']">
        <Outlet />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col font-['Stack_Sans_Headline']">
      <header className="w-full px-10 py-5 bg-white shadow-[0px_4px_20px_0px_rgba(0,0,0,0.08)] flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-6">
          <img src={logo} alt="Logo" />

          <h2 className="text-black text-2xl font-weight-600 leading-6">
            Witness Statement of Truth
          </h2>

          <div className="text-base">
            <span className="text-gray-700 font-weight-600">Our Ref: </span>
            <span className="text-gray-500 font-normal">
              {reference || "-"}
            </span>
          </div>
        </div>

        <div className="flex gap-5">
          {currentStepIndex > 0 && (
            <button
              type="button"
              onClick={goBack}
              className="px-10 py-4 bg-white border border-blue-600 text-blue-600 rounded-lg font-medium"
            >
              Back
            </button>
          )}

          <button
            type="button"
            onClick={handleDiscard}
            className="px-10 py-4 bg-white border border-blue-600 text-blue-600 rounded-lg font-medium"
          >
            Discard
          </button>

          <button
            type="button"
            onClick={goNext}
            disabled={currentStepIndex === steps.length - 1}
            className={`px-10 py-4 rounded-lg font-medium ${
              currentStepIndex === steps.length - 1
                ? "bg-gray-300 text-white cursor-not-allowed"
                : "bg-blue-600 text-white"
            }`}
          >
            Save & Next
          </button>
        </div>
      </header>

      <div className="flex flex-1 p-10 gap-10">
        <aside className="w-72 p-6 rounded-lg border border-gray-100 flex flex-col gap-4 h-fit sticky top-32">
          {steps.map((step, index) => {
            const isActive = currentStep?.id === step.id;
            const isComplete = currentStepIndex > index;

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
                  className={`text-base ${
                    isActive
                      ? "text-blue-600 font-weight-600"
                      : "text-gray-600 font-normal"
                  }`}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </aside>

        <main className="flex-1 flex justify-center">
          <div className="w-full max-w-[788px]">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

const QuestionnaireLayout = () => {
  return (
    <QuestionnaireProvider>
      <QuestionnaireLayoutContent />
    </QuestionnaireProvider>
  );
};

export default QuestionnaireLayout;
