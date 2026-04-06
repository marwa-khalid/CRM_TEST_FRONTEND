import React, { useState } from "react";
import {
  Mail,
  FileText,
  User,
  Upload,
  Edit3,
  Search,
  ChevronLeft,
  Paperclip,
  MessageSquare,
  Clock,
} from "lucide-react";
import ActivityDetailSlider from "./CaseActivityDetail";

type ActivityType =
  | "All"
  | "Email"
  | "AI Report"
  | "Witness"
  | "Upload"
  | "Note";

const CaseActivityStream = () => {
  const [filter, setFilter] = useState<ActivityType>("All");
  const [search, setSearch] = useState("");

  const filterButtons = [
    { label: "Show All", type: "All", icon: null },
    { label: "Emails", type: "Email", icon: <Mail size={14} /> },
    { label: "AI Reports", type: "AI Report", icon: <FileText size={14} /> },
    { label: "Witness", type: "Witness", icon: <User size={14} /> },
    { label: "Uploads", type: "Upload", icon: <Upload size={14} /> },
    { label: "Notes", type: "Note", icon: <Edit3 size={14} /> },
  ];
const [isSliderOpen, setIsSliderOpen] = useState(false);
const [selectedActivity, setSelectedActivity] = useState<any>(null);

// Function to trigger the slider for a specific entry
const handleOpenDetail = (activity: any) => {
  setSelectedActivity(activity);
  setIsSliderOpen(true);
};
  return (
    <div className="flex flex-col w-full min-h-screen bg-white font-['Stack_Sans_Headline']">
      {/* The Slider Component placed at the bottom of the JSX */}
      <ActivityDetailSlider
        isOpen={isSliderOpen}
        onClose={() => setIsSliderOpen(false)}
        // data={selectedActivity} // Pass the specific clicked item data
      />
      {/* Header [cite: 24, 28] */}
      <header className="px-10 py-5 bg-white shadow-md border-b flex justify-between items-center sticky top-0 z-10">
        <div className="flex flex-col gap-1">
          <button className="flex items-center gap-1 text-blue-300 text-xs font-weight-600 hover:text-blue-500">
            <ChevronLeft size={16} /> BACK TO CLAIM DETAILS
          </button>
          <h1 className="text-2xl font-weight-600 text-black tracking-tight uppercase">
            Case Activity Log
          </h1>
        </div>
      </header>

      <main className="max-w-6xl mx-auto w-full p-8">
        {/* Search Bar [cite: 19, 22] */}
        <div className="relative mb-6">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-light"
            size={20}
          />
          <input
            type="text"
            placeholder="Search Activity (subject, sender or date)"
            className="w-full pl-12 pr-4 py-4 bg-white border border-gray-200 rounded text-base font-light focus:outline-none focus:ring-1 focus:ring-blue-500"
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Filters [cite: 22, 26, 40] */}
        <div className="flex flex-wrap gap-3 mb-10">
          {filterButtons.map((btn) => (
            <button
              key={btn.label}
              onClick={() => setFilter(btn.type as ActivityType)}
              className={`px-4 py-2 rounded flex items-center gap-2 text-sm font-weight-300 font-light transition-all ${
                filter === btn.type
                  ? "bg-blue-300 text-white border border-blue-500"
                  : "bg-blue-100 text-blue-500 hover:bg-blue-100"
              }`}
            >
              {btn.icon} {btn.label}
            </button>
          ))}
        </div>

        {/* Chronological Timeline  */}
        <div className="relative border-l border-gray-100 ml-4 pl-10 space-y-12">
          {/* 1. Email Entry [cite: 30, 31, 32] */}
          <div
            className="relative group"
            onClick={() =>
              handleOpenDetail({ id: 1, type: "Email", name: "John Doe" })
            }
          >
            <div className="absolute -left-[53px] top-0 p-2 bg-blue-100 rounded-md border border-blue-100">
              <Mail size={16} className="text-blue-500" />
            </div>
            <div className="bg-white border border-gray-100 rounded-lg p-5 shadow-sm hover:border-gray-200 transition-all">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  <span className="px-2 py-0.5 bg-neutral-100 rounded text-xs font-weight-600 text-neutral-700">
                    EMAIL
                  </span>
                  <h3 className="font-weight-600 text-black text-lg">
                    Email from Client
                  </h3>
                </div>
                <span className="text-sm text-gray-400">02-22-26 5:30PM</span>
              </div>
              <div className="text-sm text-gray-600 space-y-1 mb-4">
                <p>
                  Subject:{" "}
                  <span className="font-weight-600 text-gray-800">
                    Damage Photos Attached
                  </span>
                </p>
                <p>
                  From:{" "}
                  <span className="font-weight-600 text-gray-800">
                    John Doe
                  </span>
                </p>
                <p>
                  Received:{" "}
                  <span className="font-weight-600 text-gray-800">
                    02-22-26 5:30PM
                  </span>
                </p>
              </div>
              <div className="bg-neutral-100 p-4 rounded-lg text-sm text-neutral-700 mb-4 leading-relaxed">
                Hi Team,
                <br />
                <br />
                Attached are the photos of the damage to my vehicle from the
                accident on March 10th. The front bumper and right headlight are
                severely damaged. Please let me know if you need any additional
                information.
                <br />
                <br />
                Best regards,
                <br />
                <br />
                John Doe
              </div>
              <button className="flex items-center gap-2 text-blue-400 text-sm font-weight-300 font-light px-3 py-2 border border-transparent hover:border-blue-100 rounded">
                <Paperclip size={14} /> 2 Attachments
              </button>
            </div>
          </div>

          {/* 2. AI Report Entry [cite: 6, 40] */}
          <div
            className="relative group"
            onClick={() => handleOpenDetail({ id: 2, type: "AI Report" })}
          >
            <div className="absolute -left-[53px] top-0 p-2 bg-blue-100 rounded-md border border-blue-100">
              <FileText size={16} className="text-blue-500" />
            </div>
            <div className="bg-white border border-gray-100 rounded-lg p-5 shadow-sm">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  <span className="px-2 py-0.5 bg-neutral-100 rounded text-xs font-weight-600 text-neutral-700">
                    AI REPORT
                  </span>
                  <h3 className="font-weight-600 text-black text-lg">
                    Damage Assessment Report Generated
                  </h3>
                </div>
                <span className="text-sm text-gray-400">02-22-26 2:30PM</span>
              </div>
              <p className="text-sm font-weight-600 text-gray-800 mb-2">
                AI Analysis System{" "}
                <span className="font-weight-300 font-light text-gray-500">
                  system@claimflow.ai
                </span>
              </p>
              <div className="bg-neutral-100 p-4 rounded-lg text-sm text-gray-700 whitespace-pre-line">
                <span className="font-weight-600 block mb-2">
                  Analysis Summary:
                </span>
                • Vehicle Type: 2024 Honda Civic{"\n"}• Damage Severity:
                Moderate to High{"\n"}• Estimated Repair Cost: $4,500 - $6,200
                {"\n"}• Recommended Action: Approve repair estimate
              </div>
            </div>
          </div>

          {/* 3. Witness Entry [cite: 7, 16, 40] */}
          <div className="relative group">
            <div className="absolute -left-[53px] top-0 p-2 bg-blue-100 rounded-md border border-blue-100">
              <User size={16} className="text-blue-500" />
            </div>
            <div className="bg-white border border-gray-100 rounded-lg p-5 shadow-sm">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  <span className="px-2 py-0.5 bg-gray-100 rounded text-[10px] font-weight-600 text-neutral-700">
                    WITNESS
                  </span>
                  <h3 className="font-weight-600 text-black text-lg">
                    Witness Questionnaire Submitted
                  </h3>
                </div>
                <span className="text-sm text-gray-400">02-21-26 2:30PM</span>
              </div>
              <p className="text-sm text-gray-500 mb-4">sarah.m@example.com</p>
              <div className="bg-neutral-100 p-4 rounded-lg text-sm text-neutral-700">
                Witness Statement:
                <br />
                <br />I was standing at the intersection when I saw the accident
                occur. The blue Honda was traveling north on Main Street when a
                red SUV ran the red light and struck the Honda on the passenger
                side. The Honda driver appeared to be following all traffic
                laws. The SUV driver seemed distracted and did not brake before
                impact.
              </div>
              <button className="mt-4 flex items-center gap-2 text-blue-400 text-sm py-2 px-3 border border-blue-100 rounded hover:bg-blue-100">
                <Paperclip size={14} /> 1 Attachment
              </button>
            </div>
          </div>

          {/* 4. Upload Entry [cite: 8, 15, 40, 42] */}
          <div className="relative group">
            <div className="absolute -left-[53px] top-0 p-2 bg-blue-100 rounded-md border border-blue-100">
              <Upload size={16} className="text-blue-500" />
            </div>
            <div className="bg-white border border-gray-100 rounded-lg p-5 shadow-sm">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  <span className="px-2 py-0.5 bg-neutral-100 rounded text-xs font-weight-600 text-neutral-700">
                    UPLOAD
                  </span>
                  <h3 className="font-weight-600 text-black text-lg">
                    Police Report Upload
                  </h3>
                </div>
                <span className="text-sm text-gray-400">02-21-26 2:30PM</span>
              </div>
              <p className="text-sm text-gray-500 mb-4">
                maria.garcia@claimflow.com
              </p>
              <button className="flex items-center gap-2 text-blue-400 text-sm px-4 py-2 bg-blue-100 rounded border border-blue-100 hover:bg-blue-100 transition-colors">
                <Paperclip size={14} /> Policereport.pdf [cite: 20, 38]
              </button>
            </div>
          </div>

          {/* 5. Note/Comment [cite: 9, 17, 35, 40] */}
          <div className="relative group">
            <div className="absolute -left-[53px] top-0 p-2 bg-blue-100 rounded-md border border-blue-100">
              <Edit3 size={16} className="text-blue-500" />
            </div>
            <div className="bg-white border border-gray-100 rounded-lg p-5 shadow-sm">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  <span className="px-2 py-0.5 bg-neutral-100 rounded text-xs font-weight-600 text-neutral-700">
                    NOTE
                  </span>
                  <h3 className="font-weight-600 text-black text-lg">
                    Case Review Note
                  </h3>
                </div>
                <span className="text-sm text-gray-400">02-21-26 2:30PM</span>
              </div>
              <p className="text-sm text-gray-500 mb-4">
                maria.garcia@claimflow.com
              </p>
              <div className="bg-neutral-100 p-4 rounded-lg text-sm text-gray-700 whitespace-pre-line leading-relaxed">
                <span className="font-weight-600">Initial Review Notes:</span>
                {"\n"}• Claimant is cooperative and responsive{"\n"}• All
                required documentation received{"\n"}• Police report confirms
                claimant's version of events{"\n\n"}
                <span className="font-weight-600">Next Steps:</span>
                {"\n"}
                1. Schedule vehicle inspection{"\n"}
                2. Contact witness for additional details
              </div>
            </div>
          </div>

          {/* 6. System Event [cite: 2, 40] */}
          <div className="relative group">
            <div className="absolute -left-[53px] top-0 p-2 bg-blue-100 rounded-md border border-blue-100">
              <Clock size={16} className="text-blue-500" />
            </div>
            <div className="bg-white border border-gray-100 rounded-lg p-5 shadow-sm">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <h3 className="font-weight-600 text-black text-lg">
                    Case Started
                  </h3>
                </div>
                <span className="text-sm text-gray-400">02-21-26 2:30PM</span>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                maria.garcia@claimflow.com
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CaseActivityStream;