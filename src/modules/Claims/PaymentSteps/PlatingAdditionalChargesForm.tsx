import React from "react";

const PlatingChargesSection= ({ paymentFormRef }:any) => {
  return (
    <div className="w-[788px] ms-[200px] mt-3 flex flex-col justify-start items-start gap-6 bg-white font-['Stack_Sans_Headline']">
      {/* Main Title */}
      <h1 className="self-stretch text-black text-2xl font-weight-600 leading-6">
        Plating & Additional Charges
      </h1>

      {/* Hire Vehicle Plating Charges Section */}
      <section className="self-stretch p-5 rounded-lg border border-neutral-100 flex flex-col justify-start items-start gap-4">
        <h2 className="self-stretch text-neutral-900 text-[20px] font-weight-600 leading-5">
          Hire Vehicle Plating Charges
        </h2>
        <div className="self-stretch h-px bg-neutral-100" />

        <div className="w-full flex flex-col gap-5">
          <div className="grid grid-cols-2 gap-x-5 gap-y-4">
            <CurrencyInput label="Private Hire Plating Fee" />
            <CurrencyInput label="Private Hire MOT Cost" />
          </div>
          <div className="grid grid-cols-2 gap-x-5 gap-y-4">
            <CurrencyInput label="Total Plating Cost" />
          </div>
        </div>
      </section>

      {/* Additional Chargeable Items Section */}
      <section className="self-stretch p-5 rounded-lg border border-neutral-100 flex flex-col justify-start items-start gap-4">
        <h2 className="self-stretch text-neutral-900 text-[20px] font-weight-600 leading-5">
          Additional Chargeable Items
        </h2>
        <div className="self-stretch h-px bg-neutral-100" />

        <div className="w-full flex flex-col gap-5">
          <div className="grid grid-cols-2 gap-x-5 gap-y-4">
            <CurrencyInput label="Automatic" />
            <CurrencyInput label="Estate" />
          </div>
          <div className="grid grid-cols-2 gap-x-5 gap-y-4">
            <CurrencyInput label="Additional Premium" />
            <CurrencyInput label="Additional Driver Charges" />
          </div>
        </div>
      </section>
    </div>
  );
};

/**
 * Reusable Currency Input Component
 * Matches the "Currency" data-layer specs from Figma
 */
const CurrencyInput: React.FC<{ label: string }> = ({ label }) => {
  return (
    <div className="flex flex-col justify-start items-start gap-2">
      <label className="self-stretch text-neutral-700 text-sm font-weight-400">
        {label}
      </label>
      <div className="self-stretch px-5 py-4 bg-white rounded border border-neutral-200 flex justify-start items-center gap-2.5 focus-within:border-blue-500 transition-colors">
        <span className="text-neutral-300 text-base font-light leading-4">
          £
        </span>
        <input
          type="number"
          // placeholder="0.00"
          className="w-full bg-transparent outline-none text-black text-base font-light leading-4 placeholder:text-neutral-300"
        />
      </div>
    </div>
  );
};

export default PlatingChargesSection;
