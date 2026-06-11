import React, {
  createContext,
  useContext,
  useMemo,
  useRef,
  useState
} from "react";
import type { ReactNode } from "react";
import { Outlet, useLocation, useNavigate, useParams } from "react-router-dom";
import { useCaseReference } from "../../../hooks/useCaseReference";
import { Check } from "lucide-react";
import logo from "../../../assets/AutoClaim_icon/logo.svg";
import CheckCircle from "../../../assets/AutoClaim_icon/Complete.svg";

import { toast } from "react-toastify";
import { formSubmitquestionaire } from "../../../services/Accidents/Cards/cards";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import Step1Witness from "./WitnessStep1";
import Step2Questions from "./WitnessStep2";
import Step3SketchPreview from "./WitnessStep3";
import Step4Signature from "./WitnessStep4";
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
const QUESTION_KEYS = [
  "didSeeAccident",
  "location",
  "weatherConditions",
  "roadConditions",
  "vehicleDescription",
  "warningGiven",
  "lightsDisplayed",
  "speedEstimate",
  "obstructedView",
  "driverActions",
  "distanceTravelled",
  "avoidableCollision",
  "faultOpinion",
  "knownDriver",
  "policeStatement",
  "otherWitnesses",
  "interviewLocation",
  "conversationAfterAccident",
];

const QuestionnaireLayoutContent = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { token } = useParams();
  const pdfStep1Ref = useRef(null);
  const pdfStep2Ref = useRef(null);
  const pdfStep3Ref = useRef(null);
  const pdfStep4Ref = useRef(null);
  const pdfRef = useRef<HTMLDivElement>(null);

  // Per-claim reference from the URL's claim_id (was a global localStorage value).
  const reference = useCaseReference(new URLSearchParams(location.search).get("claim_id"));

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
  const PdfHeader = ({ reference }: { reference?: string | null }) => {
  const today = new Date()
    .toLocaleDateString("en-GB")
    .replaceAll("/", "-");

  return (
    <div className="mb-10">
      <h1 className="text-center text-[24px] font-bold tracking-wide text-black">
        WITNESS STATEMENT OF TRUTH
      </h1>

      <div className="mt-6 border-t-2 border-[#1f3f77]" />

      <div className="mt-8 flex justify-end">
        <div className="text-[16px] text-black leading-9">
          <p>
            <strong>Date:</strong> {today}
          </p>

          <p>
            <strong>Our Ref:</strong> {reference || "-"}
          </p>
        </div>
      </div>

      <h2 className="mt-8 text-[22px] font-bold text-black">
        PROOF OF EVIDENCE QUESTIONNAIRE
      </h2>

      <div className="mt-4 border-t border-gray-200" />
    </div>
  );
};
  const PdfField = ({
    label,
    value,
    height,
  }: {
    label: string;
    value?: any;
    height?: string;
  }) => {
    const hasValue = value && String(value).trim() !== "";

    return (
      <div className="flex flex-col gap-2">
        <label className="text-gray-700 text-sm font-weight-400">{label}</label>

        <div
          className={`w-full px-5 py-4 bg-white rounded border border-gray-200 text-base font-light text-gray-700 whitespace-pre-wrap ${
            height || (hasValue ? "min-h-[84px]" : "min-h-[64px]")
          }`}
        >
          {hasValue ? value : "-"}
        </div>
      </div>
    );
  };
const questionLabels = [
  "Did you actually see the accident?",
  "Where were you at the time, and how near to the scene of the accident?",
  "What were the weather conditions?",
  "What were the road conditions?",
  "Please describe the vehicles and drivers involved",
  "Did you hear or see either driver give any warning?",
  "What lights were displayed on the vehicle?",
  "At what speed would you estimate the vehicles involved to have been travelling?",
  "Was there anything to obstruct the view of any driver involved?",
  "Did any driver involved apply his brakes, swerve or skid?",
  "How far did each vehicle travel after impact?",
  "Could any of the drivers involved do anything to avoid collision?",
  "In your opinion, who was to blame for the accident?",
  "Was any driver involved known to you – if so, please give details",
  "Did you give a statement to the police?",
  "Please give the names and addresses of any other witnesses to the accident",
  "Where can you be interviewed if required?",
  "Was there any conversation between any of the parties involved following the accident regarding who was at fault?",
];
  const currentStepIndex = steps.findIndex((step) =>
    location.pathname.includes(`step-${step.id}`),
  );

  const currentStep =
    currentStepIndex >= 0 ? steps[currentStepIndex] : steps[0];

  const isCanvasMode = location.pathname.includes("step-4");
  
  const { formData, updateStepData, resetFormData } = useQuestionnaireForm();

  const searchParams = new URLSearchParams(location.search);
  const queryToken = searchParams.get("details");
  const queryClaimId = searchParams.get("claim_id");
  const goNext = () => {
    const nextStep = steps[currentStepIndex + 1];

    if (nextStep) {
      navigate(nextStep.path);
    }
  };
    const finalToken = token || queryToken || "";
    const claimId = queryClaimId || "";
    const buildAnswers = (sketchImage: string) => {
      const witnessDetails = formData.witnessDetails || {};
      const questionnaire = formData.questionnaire || {};
      const incidentSketch = formData.incidentSketch || {};

      const answers: { question: string; answer: any }[] = [
        {
          question: "name",
          answer: witnessDetails.name || "",
        },
        {
          question: "address",
          answer: witnessDetails.address || "",
        },
        {
          question: "dob",
          answer: witnessDetails.dob || "",
        },
        {
          question: "occupation",
          answer: witnessDetails.occupation || "",
        },
      ];

      QUESTION_KEYS.forEach((key, index) => {
        answers.push({
          question: key,
          answer: questionnaire[index] || "",
        });
      });

      answers.push(
        {
          question: "accidentDescription",
          answer: incidentSketch.accidentDescription || "",
        },
        {
          question: "statementOfTruth",
          answer: incidentSketch.isTruthConfirmed ? "Yes" : "No",
        },
        {
          question: "sketch",
          answer: sketchImage || "",
        },
        {
          question: "sketchObjects",
          answer: JSON.stringify(formData.signature?.placedObjects || []),
        },
        {
          question: "witnessSignature",
          answer: formData.signature?.witnessSignature || "",
        },
      );

      return answers;
    };

  const [isSubmitting, setIsSubmitting] = useState(false);
  const getAnswerByIndex = (index: number) => {
    return formData.questionnaire?.[index] || "";
  };

const generateWitnessPdfBlob = async () => {
  const blocks = Array.from(
    pdfRef.current?.querySelectorAll(".pdf-block") || [],
  ) as HTMLElement[];
  if (!blocks.length) {
    toast.error("PDF content not found");
    return null;
  }

  const pdf = new jsPDF("p", "mm", "a4");

  const pageWidth = 210;
  const pageHeight = 297;

  const marginTop = 14;
  const marginBottom = 14;
  const contentWidth = 210;

  let currentY = 0;

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];

    const canvas = await html2canvas(block, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
    });

    const imgData = canvas.toDataURL("image/png");

    const imgWidth = contentWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    const remainingHeight = pageHeight - currentY - marginBottom;

    if (i !== 0 && imgHeight > remainingHeight) {
      pdf.addPage();
      currentY = marginTop;
    }

    pdf.addImage(imgData, "PNG", 0, currentY, imgWidth, imgHeight);

    currentY += imgHeight;
  }

  return pdf.output("blob");
};
  const [isSubmittedSuccessfully, setIsSubmittedSuccessfully] = useState(false);
  const handleFinalSubmit = async () => {
    try {
      setIsPageLoading(true)
      if (!finalToken) {
        toast.error("Questionnaire token is missing");
        return;
      }

      if (!formData.incidentSketch?.isTruthConfirmed) {
        toast.error("Please confirm the statement of truth before submitting");
        return;
      }

      setIsSubmitting(true);
     const sketchImage = formData.signature?.sketchImage || "";

    const pdfBlob = await generateWitnessPdfBlob();

if (!pdfBlob) {
  toast.error("Failed to generate PDF");
  return;
}

  const pdfFile = new File([pdfBlob], "Witness-Questionnaire.pdf", {
    type: "application/pdf",
  });

    const formDataToSend = new FormData();

    formDataToSend.append("status", "completed");
    formDataToSend.append("claimId", claimId || "");
    formDataToSend.append("witness_name", formData.witnessDetails?.name || "");
    formDataToSend.append(
      "witness_statement",
      formData.incidentSketch?.accidentDescription || "",
    );
    formDataToSend.append("date_of_witness", new Date().toISOString());
    formDataToSend.append("answers", JSON.stringify(buildAnswers(sketchImage)));
    formDataToSend.append("pdf_file", pdfFile);

    await formSubmitquestionaire(formDataToSend, finalToken);
console.log("test");
     toast.success("Questionnaire submitted successfully");

     resetFormData();
     setIsSubmittedSuccessfully(true);
    } catch (error) {
      console.error(error);
      toast.error("Failed to submit questionnaire");
    } finally {
      setIsSubmitting(false);
      setIsPageLoading(false)
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
  const [isPageLoading, setIsPageLoading] = useState(false);

  // if (isCanvasMode) {
  //   return (
  //     <div className="min-h-screen bg-white font-['Stack_Sans_Headline']">
  //       <Outlet />
  //     </div>
  //   );
  // }

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
        {!isSubmittedSuccessfully &&
          <div className="flex gap-5">
            {/* {currentStepIndex > 0 && (
            <button
              type="button"
              onClick={goBack}
              className="px-10 py-4 bg-white border border-blue-600 text-blue-600 rounded-lg font-medium"
            >
              Back
            </button>
          )} */}

            <button
              type="button"
              onClick={handleDiscard}
              className="px-10 py-4 bg-white border border-blue-500 text-blue-500 rounded-lg font-medium"
            >
              Discard
            </button>

            <button
              type="button"
              onClick={() => {
                if (currentStepIndex === steps.length - 1) {
                  handleFinalSubmit();
                } else {
                  goNext();
                }
              }}
              // disabled={currentStepIndex === steps.length - 1}
              className="px-10 py-4 rounded-lg font-weight-400 bg-blue-500 text-white"
            >
              {currentStepIndex === steps.length - 1
                ? "Submit Details"
                : "Save & Next"}
            </button>
          </div>}
      </header>
      {isPageLoading && (
        <div className="fixed inset-0 z-[9999] bg-[#e8e6df]/80 flex items-center justify-center font-['Stack_Sans_Headline']">
          <div className="relative w-[73px] h-[73px]">
            {Array.from({ length: 12 }).map((_, index) => (
              <span
                key={index}
                className="absolute left-1/2 top-1/2 w-[6px] h-[16px] rounded-full bg-[#9b9b9b] animate-loaderFade"
                style={{
                  transform: `
              translate(-50%, -50%)
              rotate(${index * 30}deg)
              translateY(-25px)
            `,
                  animationDelay: `${index * 0.08}s`,
                }}
              />
            ))}
          </div>
        </div>
      )}
      {isSubmittedSuccessfully ? (
        <div className="flex-1 flex items-center justify-center min-h-[calc(100vh-96px)]">
          <div className="w-[508px] py-3 rounded flex flex-col justify-center items-center gap-5">
            <img src={CheckCircle} alt="" />

            <p className="w-96 text-center text-neutral-700 text-base font-normal font-['Stack_Sans_Headline']">
              All details have been successfully submitted.
              <br />
              Thanks for your time
            </p>
          </div>
        </div>
      ) : (
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
                          ? "bg-blue-500"
                          : "border-2 border-blue-200"
                    }`}
                  >
                    {isComplete && <Check size={10} className="text-white" />}
                  </div>

                  <span
                    className={`text-base ${
                      isActive
                        ? "text-blue-500 font-weight-600"
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
      )}
      <div
        ref={pdfRef}
        className="fixed left-[-99999px] top-0 w-[794px] bg-white font-['Stack_Sans_Headline'] text-black"
      >
        <div className="pdf-block px-[56px] pt-[60px] pb-6">
          <PdfHeader reference={reference} />
        </div>

        <div className="pdf-block px-[56px] py-4">
          <section className="p-5 rounded-lg border border-gray-100 shadow-sm bg-white flex flex-col gap-4">
            <h3 className="text-neutral-900 text-[20px] font-weight-600">
              Witness Details
            </h3>

            <div className="h-px w-full bg-gray-100" />

            <PdfField label="Name" value={formData.witnessDetails?.name} />
            <PdfField
              label="Address"
              value={formData.witnessDetails?.address}
            />

            <div className="grid grid-cols-2 gap-5">
              <PdfField
                label="Date of Birth"
                value={formData.witnessDetails?.dob}
              />
              <PdfField
                label="Occupation"
                value={formData.witnessDetails?.occupation}
              />
            </div>
          </section>
        </div>

        <div className="pdf-block px-[56px] py-4">
          <section className="p-5 rounded-lg border border-gray-100 shadow-sm bg-white flex flex-col gap-6">
            <h3 className="text-neutral-900 text-[20px] font-weight-600">
              Questionnaire
            </h3>

            <div className="h-px w-full bg-gray-100" />
          </section>
        </div>

        {questionLabels.map((question, index) => (
          <div key={index} className="pdf-block px-[56px] py-3">
            <PdfField
              label={question}
              value={formData.questionnaire?.[index]}
              height="min-h-[82px]"
            />
          </div>
        ))}

        <div className="pdf-block px-[56px] py-4">
          <section className="p-5 rounded-lg border border-gray-100 shadow-sm bg-white flex flex-col gap-4">
            <h3 className="text-neutral-900 text-[20px] font-weight-600">
              Incident Details
            </h3>

            <div className="h-px w-full bg-gray-100" />

            <PdfField
              label="Please give a full description of the accident and draw a sketch plan in the space below:"
              value={formData.incidentSketch?.accidentDescription}
              height="min-h-[96px]"
            />
          </section>
        </div>

        <div className="pdf-block px-[56px] py-4">
          <section className="p-5 rounded-lg border border-gray-100 shadow-sm bg-white flex flex-col gap-4">
            <h3 className="text-neutral-900 text-[20px] font-weight-600">
              Incident Sketch Plan
            </h3>

            <div className="h-px w-full bg-gray-100" />

            <div className="w-full min-h-[260px] rounded-lg border border-gray-300 bg-white flex items-center justify-center overflow-hidden p-5">
              {formData.signature?.sketchImage ? (
                <img
                  src={formData.signature.sketchImage}
                  className="max-w-full max-h-[240px] object-contain"
                />
              ) : (
                <span className="text-gray-400">No sketch added</span>
              )}
            </div>
          </section>
        </div>

        <div className="pdf-block px-[56px] py-3">
          <p className="text-black text-sm font-normal">
            <strong>Statement of Truth:</strong> I believe that the facts stated
            in this witness statement are true.
          </p>
        </div>

        <div className="pdf-block px-[56px] py-4">
          <section className="p-5 rounded-lg border border-gray-100 shadow-sm bg-white flex flex-col gap-4">
            <h3 className="text-neutral-900 text-[20px] font-weight-600">
              Signature
            </h3>

            <div className="h-px w-full bg-gray-100" />

            <div className="w-full h-52 bg-neutral-100 rounded-lg flex items-center justify-center overflow-hidden">
              {formData.signature?.witnessSignature ? (
                <img
                  src={formData.signature.witnessSignature}
                  className="max-w-full max-h-full object-contain"
                />
              ) : (
                <span className="text-gray-400">No signature added</span>
              )}
            </div>
          </section>
        </div>
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
