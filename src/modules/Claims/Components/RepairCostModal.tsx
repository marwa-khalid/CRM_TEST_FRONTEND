import React, { useState } from "react";
import { X, Calendar, ChevronDown, CheckCircle2, Circle } from "lucide-react";

const RepairCostRouteModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
}> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-[100] p-10">
      <div className="card  bg-white w-full h-full flex flex-col overflow-auto">
        {/* Modal Header */}
        <div
          data-layer="Header"
          className="w-full px-10 py-5 bg-white shadow-[0px_4px_20px_0px_rgba(0,0,0,0.08)] inline-flex justify-between items-center relative z-10"
        >
          <h1 className="font-weight-600"> Repair Cost & Route</h1>
          <div className="flex gap-5">
            <button
              className="px-10 py-4 bg-white rounded border border-blue-600 text-blue-600 text-base font-medium hover:bg-blue-50 transition-colors"
              onClick={onClose}
            >
              Cancel
            </button>
            <button className="px-10 py-4 bg-blue-500 rounded text-white text-base font-medium hover:bg-blue-600 transition-colors">
              Update
            </button>
          </div>
        </div>
        {/* Modal Container */}

        <div className="w-full h-px bg-gray-100" />
        <div className="w-[788px] ms-[360px] mb-10">
          {/* Main Details Section */}
          <div className="self-stretch p-5 rounded-lg border border-gray-100 flex flex-col gap-4 mt-6 animate-in fade-in duration-500">
            <h2 className="text-black text-xl font-semibold font-sans">
              Agreed Repair Costs as per Engineer’s Report
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6">
              <CurrencyField label="Labour" />
              <CurrencyField label="Paint/Materials" />
              <CurrencyField label="Parts" />
              <CurrencyField label="Specialist/Additional Cost/Miscellaneous" />
              <CurrencyField label="Job Hire" />
              <CurrencyField label="Sub Total" isReadOnly />
              <CurrencyField label="VAT" />
              <CurrencyField label="Total Inc VAT" isReadOnly />
            </div>
          </div>
          <div className="self-stretch p-5 rounded-lg border border-gray-100 flex flex-col gap-4 mt-6 animate-in fade-in duration-500">
            {/* Section 2: Actual Repair Costs */}
            <h2 className="text-black text-xl font-semibold font-sans">
              Actual Repair Costs
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6">
              <CurrencyField label="CIL Total Received" />
              <CurrencyField label="Actual Repair Costs Parts" />
              <CurrencyField label="Actual Repair Costs Labour" />
              <CurrencyField label="Net CIL Amount" />
            </div>
          </div>
          {/* Section 3: CIL Settlement */}
          <div className="self-stretch p-5 rounded-lg border border-gray-100 flex flex-col gap-4 mt-6 animate-in fade-in duration-500">
            <h2 className="text-black text-xl font-semibold font-sans">
              Where the Repair Followed a CIL Settlement
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6">
              <RadioGroup
                label="CIL Agreed?"
                options={["Yes", "No"]}
                defaultValue="Yes"
              />
              <RadioGroup
                label="If Roadworthy CIL Fee Agreed:"
                options={["Yes", "No"]}
                defaultValue="Yes"
              />
              <DateField label="Agreement Received:" />
              <DateField label="Eng. Rep. Sent to TP" />
              <DateField label="CIL Cheque Received" />
              <DateField label="CIL Cheque Sent to CL" />
              <DateField label="CIL Removal Confirmation Rec" />
            </div>
            {/* CIL Action Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-6">
              <button className="w-full py-4 border border-blue-600 text-blue-600 rounded font-medium hover:bg-blue-50 uppercase text-sm tracking-wide transition-colors">
                CIL Agreement Letter
              </button>
              <button className="w-full py-4 border border-blue-600 text-blue-600 rounded font-medium hover:bg-blue-50 uppercase text-sm tracking-wide transition-colors">
                Eng Rep to TPI for Auth
              </button>
              <button className="w-full py-4 border border-blue-600 text-blue-600 rounded font-medium hover:bg-blue-50 uppercase text-sm tracking-wide transition-colors">
                Send CIL to Client
              </button>
              <button className="w-full py-4 border border-blue-600 text-blue-600 rounded font-medium hover:bg-blue-50 uppercase text-sm tracking-wide transition-colors">
                Instruct Fleet to Off Hire
              </button>
            </div>
          </div>
          <div className="self-stretch p-5 rounded-lg border border-gray-100 flex flex-col gap-4 mt-6 animate-in fade-in duration-500">
            {/* Section 4: Instruction Options */}
            <h2 className="text-black text-xl font-semibold font-sans">
              Repair Instruction Options
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 py-2">
              <button className="w-full py-4 border border-blue-600 text-blue-600 rounded font-medium hover:bg-blue-50 text-sm transition-colors">
                Instruct Roadworthy to Arrange Hire
              </button>
              <button className="w-full py-4 border border-blue-600 text-blue-600 rounded font-medium hover:bg-blue-50 text-sm transition-colors">
                Eng. Rep to TPI for Auth
              </button>
            </div>
          </div>
          <div className="self-stretch p-5 rounded-lg border border-gray-100 flex flex-col gap-4 mt-6 animate-in fade-in duration-500">
            {/* Section 5: Loss of Use */}
            <h2 className="text-black text-xl font-semibold font-sans">
              Where Repair Loss of Use Dates
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6">
              <CurrencyField label="Repair Est. Days" />
              <DateField label="Repair Inst." />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Sub-Components for Cleanliness ---

const FormSection = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <section className="p-6 rounded-xl border border-gray-100 bg-white shadow-sm flex flex-col gap-6">
    <h2 className="text-black text-xl font-semibold border-b border-gray-50 pb-4">
      {title}
    </h2>
    {children}
  </section>
);

const CurrencyField = ({
  label,
  isReadOnly,
}: {
  label: string;
  isReadOnly?: boolean;
}) => (
  <div className="flex flex-col gap-2">
    <label className="text-gray-700 text-sm font-medium">{label}</label>
    <div className="relative group">
      <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300 text-lg">
        £
      </span>
      <input
        type="number"
        readOnly={isReadOnly}
        className={`w-full pl-10 pr-4 py-4 rounded border border-gray-200 outline-none transition-all ${isReadOnly ? "bg-gray-50 text-gray-400 cursor-not-allowed" : "focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 hover:border-gray-300"}`}
        placeholder="0.00"
      />
    </div>
  </div>
);

const DateField = ({ label }: { label: string }) => (
  <div className="flex flex-col gap-2">
    <label className="text-gray-700 text-sm font-medium">{label}</label>
    <div className="relative group">
      <input
        type="text"
        placeholder="Date"
        onFocus={(e) => (e.target.type = "date")}
        onBlur={(e) => (e.target.type = "text")}
        className="w-full px-5 py-4 rounded border border-gray-200 outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 hover:border-gray-300"
      />
      <Calendar className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-300 pointer-events-none" />
    </div>
  </div>
);

const RadioGroup = ({
  label,
  options,
  defaultValue,
}: {
  label: string;
  options: string[];
  defaultValue: string;
}) => {
  const [selected, setSelected] = useState(defaultValue);
  return (
    <div className="flex flex-col gap-4">
      <span className="text-gray-900 text-sm font-medium">{label}</span>
      <div className="flex gap-10">
        {options.map((opt) => (
          <button
            key={opt}
            onClick={() => setSelected(opt)}
            className="flex items-center gap-3 group"
          >
            <div
              className={`w-6 h-6 rounded-full border flex items-center justify-center transition-all ${selected === opt ? "border-blue-500 bg-blue-50 shadow-inner" : "border-gray-300 group-hover:border-gray-400"}`}
            >
              {selected === opt && (
                <div className="w-2.5 h-2.5 bg-blue-500 rounded-full" />
              )}
            </div>
            <span className="text-sm text-gray-700 font-medium">{opt}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default RepairCostRouteModal;
