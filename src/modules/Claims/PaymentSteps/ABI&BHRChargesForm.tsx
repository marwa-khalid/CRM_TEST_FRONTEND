import React from "react";
import { Calendar, Plus } from "lucide-react";

const ABIBHRCharges= ({ paymentFormRef }:any) => {
  return (
    <div className="w-[788px] ms-[200px] mt-3 flex flex-col justify-start items-start gap-6 bg-white font-['Stack_Sans_Headline']">
      {/* Header Section */}
      <div className="self-stretch flex justify-between items-start">
        <h1 className="text-neutral-900 text-[24px] font-weight-600 leading-6">
          ABI & BHR Charges
        </h1>
        <button className="h-8 px-3 py-2 bg-blue-100 hover:bg-blue-100 rounded flex justify-center items-center gap-2.5 transition-colors group">
          <Plus size={16} className="text-blue-500" />
          <span className="text-blue-500 text-sm font-weight-300 font-light">
            Generate Payment Pack
          </span>
        </button>
      </div>

      {/* Section 1: Payment Pack Sent Detail */}
      <section className="self-stretch p-5 rounded-lg border border-neutral-100 flex flex-col justify-start items-start gap-4">
        <h2 className="text-neutral-900 text-[20px] font-weight-600 leading-5">
          Payment Pack Sent Detail
        </h2>
        <div className="self-stretch h-px bg-neutral-100" />

        <div className="grid grid-cols-2 gap-x-5 gap-y-4">
          <DateInput label="Payment Pack Raised Date" />
          <DateInput label="Payment Pack Sent Date" />
        </div>
        <div className="grid grid-cols-2 gap-x-5 gap-y-4">
          <CurrencyInput label="Invoice Number" symbol="--" />
          <CurrencyInput
            label="Days Expired from Payment Required"
            symbol="--"
          />
        </div>
        <div className="grid grid-cols-2 gap-x-5 gap-y-4">
          <DateInput label="Date Hire Paid" />
        </div>
      </section>

      {/* Section 2: Payment Pack Charges */}
      <section className="self-stretch p-5 rounded-lg border border-neutral-100 flex flex-col justify-start items-start gap-4">
        <h2 className="text-neutral-900 text-[20px] font-weight-600 leading-5">
          Payment Pack Charges
        </h2>

        {/* ABI Charges 0-30 */}
        <div className="self-stretch flex flex-col gap-4 mt-2">
          <h3 className="text-black text-base font-weight-600">
            ABI Charges (0–30 Days)
          </h3>
          <div className="self-stretch h-px bg-neutral-100" />
   
            <div className="grid grid-cols-2 gap-x-5 gap-y-4">
              <CurrencyInput label="Daily Rate (ABI)" />
              <CurrencyInput label="Extra Charges" />
            </div>
            <div className="grid grid-cols-2 gap-x-5 gap-y-4">
              <CurrencyInput label="Admin Charges" />
              <CurrencyInput label="Number of Hired Days" />
            </div>

            <CurrencyInput label="Total Hire Charge" />
          
        </div>

        {/* 31-60 Days */}
        <div className="self-stretch flex flex-col gap-4 mt-4">
          <h3 className="text-black text-base font-weight-600">
            31–60 Days Charges (+10%)
          </h3>
          <div className="self-stretch h-px bg-neutral-100" />
          <div className="flex flex-wrap gap-5">
            <div className="grid grid-cols-2 gap-x-5 gap-y-4">
              <CurrencyInput label="Daily Rate (ABI)" />
              <CurrencyInput label="Daily Rate + Extra Charges" />
            </div>
            <div className="grid grid-cols-2 gap-x-5 gap-y-4">
              <CurrencyInput label="Total Hire Charges" />
              <CurrencyInput label="Admin Charges" />
            </div>
            <div className="grid grid-cols-2 gap-x-5 gap-y-4">
              <CurrencyInput label="Updated Value" />
              <DateInput label="Payment Pack Generate Date + 60 Days" />
            </div>
          </div>
        </div>

        {/* 61+ Days */}
        <div className="self-stretch flex flex-col gap-4 mt-4">
          <h3 className="text-black text-base font-weight-600">
            61+ Days Charges (+20%)
          </h3>
          <div className="self-stretch h-px bg-neutral-100" />
          <div className="flex flex-wrap gap-5">
            <div className="grid grid-cols-2 gap-x-5 gap-y-4">
              <CurrencyInput label="Daily Rate (ABI)" />
              <CurrencyInput label="Daily Rate + Extra Charges" />
            </div>
            <div className="grid grid-cols-2 gap-x-5 gap-y-4">
              <CurrencyInput label="Total Hire Charges" />
              <CurrencyInput label="Admin Charges" />
            </div>
            <div className="grid grid-cols-2 gap-x-5 gap-y-4">
              <CurrencyInput label="Updated Value" />
              <DateInput label="Payment Pack Generate Date + 61(+) Days" />
            </div>
          </div>
        </div>

        {/* 90 Days + BHR */}
        <div className="self-stretch flex flex-col gap-4 mt-4">
          <h3 className="text-black text-base font-weight-600">
            90 Days + BHR (35% Surge)
          </h3>
          <div className="self-stretch h-px bg-neutral-100" />
          <div className="grid grid-cols-2 gap-x-5 gap-y-4">
            <CurrencyInput label="BHR Daily Rate" />
            <DateInput label="Payment Pack Generate Date + 90 Days" />
          </div>
        </div>
      </section>

      {/* Section 3: Billed Breakdown */}
      <section className="self-stretch p-5 rounded-lg border border-neutral-100 flex flex-col justify-start items-start gap-4">
        <h2 className="text-neutral-900 text-[20px] font-weight-600 leading-5">
          Billed Breakdown Section (ABI 30 days Rate)
        </h2>
        <div className="self-stretch h-px bg-neutral-100" />

        <div className="grid grid-cols-2 gap-x-5 gap-y-4">
          <CurrencyInput label="Credit Hire" symbol="--" />
          <CurrencyInput label="Admin Charges" />
        </div>
        <div className="grid grid-cols-2 gap-x-5 gap-y-4">
          <CurrencyInput label="Storage Charges" />
          <CurrencyInput label="Recovery Charges" />
        </div>
        <div className="grid grid-cols-2 gap-x-5 gap-y-4">
          <CurrencyInput label="Engineers Charges" />
          <CurrencyInput label="Plating Charges" />
        </div>
      </section>
    </div>
  );
};

/** Reusable Input Components **/

const CurrencyInput: React.FC<{ label: string; symbol?: string }> = ({
  label,
  symbol = "£",
}) => (
  <div className="flex flex-col gap-2">
    <label className="text-neutral-700 text-sm font-weight-400">{label}</label>
    <div className="self-stretch px-5 py-4 bg-white rounded border border-neutral-200 flex items-center gap-2.5 focus-within:border-blue-400 transition-colors">
      <span className="text-neutral-300 text-base font-light">{symbol}</span>
      <input
        type="text"
        className="w-full outline-none bg-transparent text-black text-base font-light"
        placeholder="--"
      />
    </div>
  </div>
);

const DateInput: React.FC<{ label: string }> = ({ label }) => (
  <div className="flex flex-col gap-2">
    <label className="text-neutral-700 text-sm font-weight-400">{label}</label>
    <div className="self-stretch px-5 py-4 bg-white rounded border border-neutral-200 flex justify-between items-center focus-within:border-blue-400 transition-colors">
      <span className="text-neutral-300 text-base font-light">Date</span>
      <Calendar size={16} className="text-blue-300" />
    </div>
  </div>
);

export default ABIBHRCharges;
