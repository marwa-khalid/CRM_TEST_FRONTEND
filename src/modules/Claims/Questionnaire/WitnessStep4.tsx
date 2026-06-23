import React, { useEffect, useRef, useState } from "react";
import { CheckCircle } from "lucide-react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import SignatureCanvas from "react-signature-canvas";
import { toast } from "react-toastify";
import { useQuestionnaireForm } from "./QuestionnaireLayout";
import { formSubmitquestionaire } from "../../../services/Accidents/Cards/cards";

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

const Step4Signature = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { token } = useParams();
  const { formData, updateStepData, resetFormData } = useQuestionnaireForm();

  const signatureRef = useRef<SignatureCanvas | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [canvasDims, setCanvasDims] = useState({ w: 0, h: 0 });

  const [mode, setMode] = useState<"sign" | "upload">("sign");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Measure once after paint; only render canvas after we have real dimensions
  useEffect(() => {
    if (containerRef.current) {
      setCanvasDims({
        w: containerRef.current.offsetWidth,
        h: containerRef.current.offsetHeight,
      });
    }
  }, []);

  // Restore a previously drawn/uploaded signature onto the canvas when the user
  // navigates back to this step (otherwise the canvas re-mounts blank).
  useEffect(() => {
    const saved = formData.signature?.witnessSignature;
    if (mode === "sign" && canvasDims.w > 0 && signatureRef.current && saved) {
      try {
        signatureRef.current.clear();
        signatureRef.current.fromDataURL(saved);
      } catch {
        /* ignore restore failures */
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, canvasDims.w]);

  const searchParams = new URLSearchParams(location.search);
  const queryToken = searchParams.get("details");
  const queryClaimId = searchParams.get("claim_id");

  const finalToken = token || queryToken || "";
  const claimId = queryClaimId || "";

  const buildAnswers = (signatureImage: string) => {
    const witnessDetails = formData.witnessDetails || {};
    const questionnaire = formData.questionnaire || {};
    const incidentSketch = formData.incidentSketch || {};
    const signature = formData.signature || {};

    const answers: { question: string; answer: any }[] = [
      { question: "name", answer: witnessDetails.name || "" },
      { question: "address", answer: witnessDetails.address || "" },
      { question: "dob", answer: witnessDetails.dob || "" },
      { question: "occupation", answer: witnessDetails.occupation || "" },
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
        answer: signature.sketchImage || "",
      },
      {
        question: "sketchObjects",
        answer: JSON.stringify(signature.placedObjects || []),
      },
      {
        question: "witnessSignature",
        answer: signatureImage || "",
      },
    );

    return answers;
  };

  const handleUploadSignature = (file: File) => {
    const reader = new FileReader();

    reader.onloadend = () => {
      updateStepData("signature", {
        witnessSignature: reader.result,
      });
    };

    reader.readAsDataURL(file);
  };


  if (submitted) {
    return (
      <div className="min-h-[500px] flex flex-col items-center justify-center gap-5">
        <CheckCircle size={64} className="text-green-500" />

        <p className="w-96 text-center text-neutral-700 text-base font-normal">
          All details have been successfully submitted.
          <br />
          Thanks for your time
        </p>
      </div>
    );
  }

  return (
    <div className="p-5 rounded-lg border border-gray-100 bg-white shadow-sm flex flex-col gap-4 font-['Stack_Sans_Headline']">
      <div className="flex justify-between items-start">
        <h3 className="text-black text-xl font-weight-600 leading-5">
          Signature
        </h3>

        <div className="flex items-center gap-4 text-sm">
          <button
            type="button"
            onClick={() => setMode("sign")}
            className={mode === "sign" ? "text-blue-500" : "text-black"}
          >
            Sign
          </button>

          <button
            type="button"
            onClick={() => setMode("upload")}
            className={mode === "upload" ? "text-blue-500" : "text-black"}
          >
            Upload
          </button>
        </div>
      </div>

      <div className="h-px bg-gray-100 w-full" />

      <div ref={containerRef} className="w-full h-72 bg-neutral-100 rounded-lg overflow-hidden">
        {mode === "sign" ? (
          canvasDims.w > 0 && (
            <SignatureCanvas
              ref={signatureRef}
              penColor="black"
              onEnd={() => {
                if (!signatureRef.current) return;
                // getTrimmedCanvas() throws in this lib (bundled trim-canvas bug),
                // which silently aborted the save. Use the full canvas instead.
                try {
                  if (signatureRef.current.isEmpty()) return;
                  const dataUrl = signatureRef.current
                    .getCanvas()
                    .toDataURL("image/png");
                  if (dataUrl && dataUrl.length > 100) {
                    updateStepData("signature", { witnessSignature: dataUrl });
                  }
                } catch (err) {
                  console.error("Failed to capture signature", err);
                }
              }}
              canvasProps={{
                width: canvasDims.w,
                height: canvasDims.h,
                className: "bg-neutral-100",
                style: { touchAction: "none" },
              }}
            />
          )
        ) : (
          <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer text-neutral-500 text-sm">
            {formData.signature?.witnessSignature ? (
              <img
                src={formData.signature.witnessSignature}
                alt="Uploaded Signature"
                className="max-w-full max-h-full object-contain"
              />
            ) : (
              "Click to upload signature"
            )}

            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleUploadSignature(file);
              }}
            />
          </label>
        )}
      </div>

      {mode === "sign" && (
        <button
          type="button"
          onClick={() => signatureRef.current?.clear()}
          className="text-blue-500 text-sm w-fit"
        >
          Clear Signature
        </button>
      )}

      {/* <div className="flex justify-end pt-2">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="px-10 py-4 bg-blue-500 text-white rounded-lg font-medium disabled:bg-blue-300"
        >
          {isSubmitting ? "Submitting..." : "Submit Details"}
        </button>
      </div> */}
    </div>
  );
};

export default Step4Signature;
