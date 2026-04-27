import { useEffect, useState, type FunctionComponent } from "react";

export const DriverCheckoutForm = ({ formRef }: any) => {
  const claimId = localStorage.getItem("claimId");
  const dataa = JSON.parse(
    localStorage.getItem(`hire_details_draft_${claimId}`) || "{}",
  );

  const vehicles = dataa.formikValues?.thirdPartyVehicles || [];
  // The component you provided
  const HireDates: FunctionComponent<{ start: string; end: string }> = ({
    start,
    end,
  }) => {
    return (
      <div className="relative text-sm font-stack-sans-headline text-neutral-500 whitespace-pre-wrap text-center">
        Hire Start: {start} - Hire End: {end}
      </div>
    );
  };
  // Update: Access the forms array from the checkout data structure
  const checkoutData = dataa.checkoutFormData?.forms || [];

  const [activeVehicleTab, setActiveVehicleTab] = useState<number>(0);

  // Active vehicle data mapped to the current tab index
  const activeCheckout = checkoutData[activeVehicleTab] || {
    valetCharge: 30,
    petrolChargeAmount: "0",
    damageCharges: "0",
    applyDamageCharges: "No", // Using the new "Yes"/"No" string
  };

  const getVal = (val: any) => parseFloat(val) || 0;

  const valet = getVal(activeCheckout.valetCharge);
  const petrol = getVal(activeCheckout.petrolChargeAmount);
  const damage = getVal(activeCheckout.damageCharges);

  // Logic update: Check for "Yes" string instead of boolean
  const isDamageApplied = activeCheckout.applyDamageCharges === "Yes";

  // Calculation: Only add damage if it was marked as "Yes" (Applied)
  const totalCharges = isDamageApplied
    ? valet + petrol + damage
    : valet + petrol;

  const ChargeInput = ({ label, value }: { label: string; value: string }) => (
    <div className="flex w-full max-w-[384px] flex-col gap-2">
      <label className="text-sm font-weight-400 text-gray-700">{label}</label>
      <div className="flex h-[52px] items-center rounded border border-gray-200 bg-white px-5 py-4">
        <span className="text-base font-light leading-4 text-gray-700">
          {value}
        </span>
      </div>
    </div>
  );

  return (
    <div className="MainContent w-full flex flex-col items-start gap-6 py-1 font-['Stack_Sans_Headline']">
      <h1 className="text-neutral-900 text-[24px] font-weight-600">
        Driver Checkout Charges
      </h1>

      {/* Vehicle Banners as Tabs */}
      <div className="flex gap-4">
        {vehicles.map((v: any, idx: number) => (
          <div
            key={idx}
            className={`flex-1 flex flex-col items-start justify-center gap-1 rounded-lg p-5 cursor-pointer transition-all duration-200
              ${activeVehicleTab === idx ? "bg-blue-100 border border-blue-600" : "bg-white border border-slate-200"}
            `}
            onClick={() => setActiveVehicleTab(idx)}
          >
            <div className="text-xl font-weight-600 leading-5 text-black">
              Vehicle {idx + 1} {v?.make} {v?.model}
            </div>
            <div className="text-sm font-weight-400 text-gray-600">
              Reg# {v?.hire_vehicle_registration || "TBC"}
            </div>

            <HireDates start={v?.hireOutDate} end={v?.hireBackDate} />
          </div>
        ))}
      </div>

      {/* Checkout Form / Charges Card */}
      <div className="flex w-full flex-col gap-4 rounded-lg border border-gray-100 p-5 shadow-sm mt-4 bg-white">
        <div className="flex w-full items-center">
          <h3 className="text-xl font-weight-600 leading-5 text-black">
            Charges Detail - Vehicle {activeVehicleTab + 1}
          </h3>
        </div>

        <div className="h-px w-full bg-gray-100" />

        {/* Row 1: Valet & Petrol */}
        <div className="grid grid-cols-2 gap-5">
          <ChargeInput label="Valet Charges" value={`£${valet.toFixed(2)}`} />
          <ChargeInput
            label="Petrol Checkout Charges"
            value={`£${petrol.toFixed(2)}`}
          />
        </div>

        {/* Row 2: Damage */}
        <div className="flex flex-wrap gap-5">
          <ChargeInput label="Damage Charges" value={`£${damage.toFixed(2)}`} />
        </div>

        {/* Status Indicator using "Yes"/"No" logic */}
        <div className="flex items-center gap-2">
          {isDamageApplied ? (
            <div className="h-5 w-5 relative rounded bg-blue-500 border-blue-200 border-solid border-[6px] box-border" />
          ) : (
            <div className="h-5 w-5 rounded border border-gray-300 bg-white" />
          )}
          <span className="text-sm font-normal text-black">
            Damage Charges Paid
            {/* <span className="font-weight-600">
              {activeCheckout.applyDamageCharges || "No"}
            </span> */}
          </span>
        </div>

        {/* Row 3: Total */}
        <div className="flex flex-wrap gap-5 pt-2">
          <ChargeInput
            label="Total Charges"
            value={`£${totalCharges.toFixed(2)}`}
          />
        </div>
      </div>
    </div>
  );
};;
