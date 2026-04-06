import React, { useState } from "react";
import { MousePointer2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Canvas from '../../../assets/AutoClaim_icon/canvas.svg'
const Step3SketchPreview = () => {
  const navigate = useNavigate();
  const [isTruthConfirmed, setIsTruthConfirmed] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      {/* Incident Details Section */}
      <section className="p-5 border border-gray-100 rounded-lg bg-white shadow-sm flex flex-col gap-4">
        <h3 className="text-black text-xl font-weight-600 font-['Stack_Sans_Headline'] leading-5">
          Incident Details
        </h3>
        <div className="h-px bg-gray-100 w-full" />
        <div className="flex flex-col gap-2">
          <label className="text-gray-700 text-sm font-weight-400 font-['Stack_Sans_Headline'] leading-tight">
            Please give a full description of the accident and draw a sketch
            plan in the space below:
          </label>
          <textarea
            placeholder="Enter Details"
            className="w-full h-24 px-5 py-4 border border-gray-200 rounded outline-none text-base font-light font-['Stack_Sans_Headline'] focus:border-blue-400 transition-colors placeholder:text-gray-300 resize-none"
          />
        </div>
      </section>

      {/* Incident Sketch Plan Section */}
      <section className="p-5 border border-gray-100 rounded-lg bg-white shadow-sm flex flex-col gap-4">
        <h3 className="text-black text-xl font-weight-600 font-['Stack_Sans_Headline'] leading-5">
          Incident Sketch Plan
        </h3>
        <div className="h-px bg-gray-100 w-full" />

        {/* Sketch Canvas Trigger */}
        <div
          onClick={() => navigate("/questionnaire/step-4")}
          className="group w-full p-10 rounded-lg border border-gray-200 bg-white flex flex-col justify-center items-center gap-6 cursor-pointer hover:bg-blue-50 hover:border-blue-300 transition-all duration-200"
        >
          <img src={Canvas} alt="" />

          <div className="flex flex-col items-center gap-2">
            <span className="text-black text-base font-weight-600 font-['Stack_Sans_Headline']">
              Start Drawing Sketch
            </span>
            <span className="text-black text-sm font-normal font-['Stack_Sans_Headline'] opacity-60">
              Click here to open Canvas
            </span>
          </div>
        </div>
      </section>

      {/* Statement of Truth Checkbox */}
      <div
        className="flex items-start gap-3 mt-2 cursor-pointer select-none"
        onClick={() => setIsTruthConfirmed(!isTruthConfirmed)}
      >
       
        {isTruthConfirmed?
        <div
          data-layer="Rectangle 3"
          className="Rectangle3 w-5 h-5 bg-blue-500 rounded border-[6px] border-blue-200"
        />:<div data-layer="Rectangle 3" className="Rectangle3 w-5 h-5 bg-neutral-300 rounded" />}
        <p className="flex-1 text-black text-sm font-normal font-['Stack_Sans_Headline'] leading-tight">
          I believe that the facts stated in this witness statement are true.
        </p>
      </div>
    </div>
  );
};

export default Step3SketchPreview;
