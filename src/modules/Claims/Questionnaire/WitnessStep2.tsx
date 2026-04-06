import React from "react";

const questions = [
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

const Step2Questions = () => {
  return (
    <div className="flex flex-col gap-6 p-5 rounded-lg border border-gray-100 shadow-sm bg-white">
      <div className="text-black text-xl font-weight-600 font-['Stack_Sans_Headline'] leading-5">
        Questionnaire
      </div>

      <div className="h-px w-full bg-gray-100" />

      <div className="flex flex-col gap-6">
        {questions.map((q, index) => (
          <div key={index} className="flex flex-col gap-2">
            <label className="text-gray-700 text-sm font-weight-400 font-['Stack_Sans_Headline'] leading-tight">
              {q}
            </label>
            <textarea
              placeholder="Enter Details"
              className="w-full h-24 px-5 py-4 bg-white rounded border border-gray-200 text-base font-light font-['Stack_Sans_Headline'] outline-none focus:border-blue-500 transition-colors placeholder:text-gray-300 resize-none"
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default Step2Questions;
