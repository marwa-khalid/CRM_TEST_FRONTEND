import React from "react";
import { X, Mail, Edit3, Eye, Send, Paperclip } from "lucide-react";

interface ActivitySliderProps {
  isOpen: boolean;
  onClose: () => void;
}

const ActivityDetailSlider: React.FC<ActivitySliderProps> = ({
  isOpen,
  onClose,
}) => {
  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-40 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Slider Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-[918px] bg-white font-['Stack_Sans_Headline'] shadow-[-4px_0px_20px_0px_rgba(0,0,0,0.08)] z-50 transform transition-transform duration-300 ease-in-out ${isOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        {/* Header Section */}
        <div className="w-full px-10 py-5 border-b border-neutral-100 flex justify-between items-center bg-white sticky top-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded flex items-center justify-center relative">
              <Mail className="text-blue-400" size={24} />
            </div>
            <div className="flex flex-col">
              <h2 className="text-black text-base font-weight-600 font-['Stack_Sans_Headline']">
                Email from Client
              </h2>
              <span className="text-neutral-500 text-sm font-weight-300 font-['Stack_Sans_Headline']">
                02-22-26 5:30PM
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="px-10 py-4 bg-blue-500 hover:bg-blue-700 text-white rounded text-base font-weight-400 font-['Stack_Sans_Headline'] transition-colors"
          >
            Close
          </button>
        </div>

        {/* Quick Actions Bar */}
        <div className="px-7 py-4 flex items-center gap-2 border-b border-neutral-50">
          <button className="flex items-center gap-2.5 px-3 py-2 text-blue-300 hover:bg-blue-100 rounded transition-colors text-sm font-weight-300 font-['Stack_Sans_Headline']">
            <Edit3 size={16} /> Add Note
          </button>
          <button className="flex items-center gap-2.5 px-3 py-2 text-blue-300 hover:bg-blue-100 rounded transition-colors text-sm font-weight-300 font-['Stack_Sans_Headline']">
            <Eye size={16} /> View attachment in Document Library
          </button>
          <button className="flex items-center gap-2.5 px-3 py-2 text-blue-300 hover:bg-blue-100 rounded transition-colors text-sm font-weight-300 font-['Stack_Sans_Headline']">
            <Send size={16} /> Forward Email to Client
          </button>
        </div>

        {/* Content Area */}
        <div className="p-10 flex flex-col gap-6 overflow-y-auto h-[calc(100%-180px)]">
          <div className="space-y-1">
            <p className="text-sm font-['Stack_Sans_Headline'] text-neutral-700">
              <span className="font-weight-300 font-light">Subject: </span>
              <span className="font-weight-600">Damage Photos Attached</span>
            </p>
            <p className="text-sm font-['Stack_Sans_Headline'] text-neutral-700">
              <span className="font-weight-300 font-light">From: </span>
              <span className="font-weight-600">John Doe</span>
            </p>
            <p className="text-sm font-['Stack_Sans_Headline'] text-neutral-700">
              <span className="font-weight-300 font-light">Received: </span>
              <span className="font-weight-600">02-22-26 5:30PM</span>
            </p>
          </div>

          <hr className="border-neutral-100" />

          {/* Email Body */}
          <div className="bg-neutral-100 p-6 rounded-lg">
            <p className="text-neutral-700 text-sm font-weight-300 font-['Stack_Sans_Headline'] leading-relaxed whitespace-pre-line">
              Hi Team,{"\n\n"}
              Attached are the photos of the damage to my vehicle from the
              accident on March 10th. The front bumper and right headlight are
              severely damaged. Please let me know if you need any additional
              information.{"\n\n"}
              Best regards,{"\n"}
              John Doe
            </p>
          </div>

          {/* Attachments Section */}
          <div className="flex flex-col gap-2">
            <button className="flex items-center gap-2.5 h-10 px-4 rounded bg-white text-blue-300 hover:bg-blue-100 transition-colors w-fit">
              <Paperclip size={16} />
              <span className="text-sm font-weight-300 font-['Stack_Sans_Headline']">
                VehiclePhotoFront.jpg | 200kb
              </span>
            </button>
            <button className="flex items-center gap-2.5 h-10 px-4 rounded bg-white text-blue-300 hover:bg-blue-100 transition-colors w-fit">
              <Paperclip size={16} />
              <span className="text-sm font-weight-300 font-['Stack_Sans_Headline']">
                VehiclePhotoBack.jpg | 200kb
              </span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ActivityDetailSlider;
