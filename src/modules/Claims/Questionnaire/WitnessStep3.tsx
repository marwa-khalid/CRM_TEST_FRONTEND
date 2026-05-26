import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import Canvas from "../../../assets/AutoClaim_icon/canvas.svg";
import { useQuestionnaireForm } from "./QuestionnaireLayout";
import Delete from "../../../assets/AutoClaim_icon/trashBlue.svg";
import { useState } from "react";
import CanvasScreen from "./CanvasScreen";
const Step3SketchPreview = () => {
  const navigate = useNavigate();
  const { token } = useParams();
  const { formData, updateStepData } = useQuestionnaireForm();

  const basePath = token ? `/questionnaire/${token}` : "/questionnaire";
const [showSketchCanvas, setShowSketchCanvas] = useState(false);
  const isTruthConfirmed = formData.incidentSketch?.isTruthConfirmed || false;

  const handleDescriptionChange = (value: string) => {
    updateStepData("incidentSketch", {
      accidentDescription: value,
    });
  };

  const handleTruthToggle = () => {
    updateStepData("incidentSketch", {
      isTruthConfirmed: !isTruthConfirmed,
    });
  };

  return (
    <div className="flex flex-col gap-6 font-['Stack_Sans_Headline']">
      <section className="p-5 border border-gray-100 rounded-lg bg-white shadow-sm flex flex-col gap-4">
        <h3 className="text-neutral-900 text-[20px] font-weight-600 leading-5">
          Incident Details
        </h3>

        <div className="h-px bg-gray-100 w-full" />

        <div className="flex flex-col gap-2">
          <label className="text-gray-700 text-sm font-weight-400 leading-tight">
            Please give a full description of the accident and draw a sketch
            plan in the space below:
          </label>

          <textarea
            value={formData.incidentSketch?.accidentDescription || ""}
            onChange={(e) => handleDescriptionChange(e.target.value)}
            placeholder="Enter Details"
            className="w-full h-24 px-5 py-4 border border-gray-200 rounded outline-none text-base font-light focus:border-blue-400 transition-colors placeholder:text-gray-300 resize-none"
          />
        </div>
      </section>

      <section className="p-5 border border-gray-100 rounded-lg bg-white shadow-sm flex flex-col gap-4">
        <h3 className="text-neutral-900 text-[20px] font-weight-600 leading-5">
          Incident Sketch Plan
        </h3>

        <div className="h-px bg-gray-100 w-full" />

        {formData.signature?.sketchImage ? (
          <div className="w-full rounded-lg border border-gray-300 bg-white flex flex-col items-center gap-4 p-6">
            <div className="w-[220px] h-[160px] rounded border border-gray-300 bg-white flex items-center justify-center overflow-hidden">
              <img
                src={formData.signature.sketchImage}
                alt="Incident Sketch"
                className="w-full h-full object-contain"
              />
            </div>

            <p className="text-neutral-900 text-[14px] font-weight-400">
              Sketch added successfully
            </p>

            <div className="h-px w-full bg-gray-100" />

            <button
              type="button"
              onClick={() => {
                updateStepData("signature", {
                  sketchImage: "",
                  placedObjects: [],
                });
                setShowSketchCanvas(true);
              }}
              className="flex gap-1 text-blue-600 text-sm font-weight-500"
            >
              <img src={Delete} alt="" />
              Remove and Redraw
            </button>
          </div>
        ) : (
          <div
            onClick={() => setShowSketchCanvas(true)}
            className="group w-full p-10 rounded-lg border border-gray-200 bg-white flex flex-col justify-center items-center gap-6 cursor-pointer hover:bg-blue-50 hover:border-blue-300 transition-all duration-200"
          >
            <img src={Canvas} alt="" />

            <div className="flex flex-col items-center gap-2">
              <span className="text-black text-base font-weight-600">
                Start Drawing Sketch
              </span>

              <span className="text-black text-sm font-normal opacity-60">
                Click here to open Canvas
              </span>
            </div>
          </div>
        )}
      </section>

      <div
        className="flex items-start gap-3 mt-2 cursor-pointer select-none"
        onClick={handleTruthToggle}
      >
        {isTruthConfirmed ? (
          <div className="w-5 h-5 bg-blue-500 rounded border-[6px] border-blue-200" />
        ) : (
          <div className="w-5 h-5 bg-neutral-300 rounded" />
        )}

        <p className="flex-1 text-black text-sm font-normal leading-tight">
          I believe that the facts stated in this witness statement are true.
        </p>
      </div>
      {showSketchCanvas && (
        <CanvasScreen
          mode="overlay"
          onClose={() => setShowSketchCanvas(false)}
          onSaved={() => setShowSketchCanvas(false)}
        />
      )}
    </div>
  );
};

export default Step3SketchPreview;
