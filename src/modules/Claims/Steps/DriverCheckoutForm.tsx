import { useEffect, useState, type FunctionComponent } from "react";
import { Edit2 } from "lucide-react";
import { CheckoutModal } from "../Components/CheckoutModal";

export const DriverCheckoutForm = ({ formRef }: any) => {
  const claimId = localStorage.getItem("claimId");
  const storageKey = `hire_details_draft_${claimId}`;

  const dataa = JSON.parse(localStorage.getItem(storageKey) || "{}");

  const vehicles = dataa.formikValues?.thirdPartyVehicles || [];
  const checkoutData = dataa.checkoutFormData?.forms || [];

  const [activeVehicleTab, setActiveVehicleTab] = useState<number>(0);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState(1);

  const defaultCheckoutForm = {
    interiorCleanCheckOut: "No",
    interiorCleanCheckIn: "No",
    interiorDamage: "No",
    interiorDamageDescription: "",
    interiorPhotos: [],
    exteriorCleanCheckOut: "No",
    exteriorCleanCheckIn: "No",
    exteriorDamage: "No",
    exteriorDamageDescription: "",
    exteriorPhotos: [],
    petrolCheckoutCharge: "No",
    petrolChargeAmount: "0",
    petrolChargeReason: "",
    applyDamageCharges: "No",
    damageCharges: "0",
    damageNotes: "",
    valetCharge: 30,
  };

  const [checkoutFormData, setCheckoutFormData] = useState<any>(
    checkoutData[activeVehicleTab] || defaultCheckoutForm,
  );

  useEffect(() => {
    setCheckoutFormData(checkoutData[activeVehicleTab] || defaultCheckoutForm);
  }, [activeVehicleTab]);

  const activeCheckout = checkoutData[activeVehicleTab] || defaultCheckoutForm;

  const getVal = (val: any) => parseFloat(val) || 0;

  const valet = getVal(activeCheckout.valetCharge);
  const petrol = getVal(activeCheckout.petrolChargeAmount);
  const damage = getVal(activeCheckout.damageCharges);

  const isDamageApplied = activeCheckout.applyDamageCharges === "Yes";

  const totalCharges = isDamageApplied
    ? valet + petrol + damage
    : valet + petrol;

  const handleEditCheckout = (idx: number) => {
    setActiveVehicleTab(idx);
    setCheckoutFormData(checkoutData[idx] || defaultCheckoutForm);
    setCheckoutStep(1);
    setShowCheckoutModal(true);
  };

  const handleSaveCheckout = (data: any) => {
    const updatedForms = [...checkoutData];
    updatedForms[activeVehicleTab] = data;

    const updatedDraft = {
      ...dataa,
      checkoutFormData: {
        ...(dataa.checkoutFormData || {}),
        forms: updatedForms,
      },
    };

    localStorage.setItem(storageKey, JSON.stringify(updatedDraft));

    setCheckoutFormData(data);
    setShowCheckoutModal(false);
  };

  const HireDates: FunctionComponent<{ start: string; end: string }> = ({
    start,
    end,
  }) => {
    return (
      <div className="text-sm font-stack-sans-headline text-neutral-500 whitespace-pre-wrap">
        Hire Start: {start || "TBC"} - Hire End: {end || "TBC"}
      </div>
    );
  };

  const ChargeInput = ({ label, value }: { label: string; value: string }) => (
    <div className="flex w-full flex-col gap-2">
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
      {showCheckoutModal && (
        <CheckoutModal
          isOpen={showCheckoutModal}
          onClose={() => setShowCheckoutModal(false)}
          onSave={handleSaveCheckout}
          formData={checkoutFormData}
          setFormData={setCheckoutFormData}
          step={checkoutStep}
          setStep={setCheckoutStep}
        />
      )}

      <h1 className="text-neutral-900 text-[24px] font-weight-600">
        Driver Checkout Charges
      </h1>

      <div className="grid w-full grid-cols-1 md:grid-cols-2 gap-4">
        {vehicles.map((v: any, idx: number) => (
          <div
            key={idx}
            className={`w-full flex flex-col gap-2 rounded-lg p-5 cursor-pointer transition-all duration-200
              ${
                activeVehicleTab === idx
                  ? "bg-blue-100 border border-blue-600"
                  : "bg-white border border-slate-200"
              }
            `}
            onClick={() => setActiveVehicleTab(idx)}
          >
            <div className="flex justify-between items-start gap-3">
              <div className="flex flex-col gap-1">
                <div className="text-xl font-weight-600 leading-5 text-black">
                  Vehicle {idx + 1} {v?.make} {v?.model}
                </div>

                <div className="text-sm font-weight-400 text-gray-600">
                  Reg# {v?.hire_vehicle_registration || "TBC"}
                </div>
              </div>

              {/* <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleEditCheckout(idx);
                }}
                className="p-2 rounded-md hover:bg-blue-50 text-blue-600"
                title="Edit checkout details"
              >
                <Edit2 size={16} />
              </button> */}
            </div>

            <HireDates start={v?.hireOutDate} end={v?.hireBackDate} />
          </div>
        ))}
      </div>

      <div className="flex w-full flex-col gap-4 rounded-lg border border-gray-100 p-5 shadow-sm mt-4 bg-white">
        <div className="flex w-full items-center justify-between">
          <h3 className="text-xl font-weight-600 leading-5 text-black">
            Charges Detail - Vehicle {activeVehicleTab + 1}
          </h3>

          <button
            type="button"
            onClick={() => handleEditCheckout(activeVehicleTab)}
            className="flex items-center gap-2 text-blue-600 text-sm hover:bg-blue-50 px-3 py-2 rounded-md"
          >
            <Edit2 size={16} />
            Edit
          </button>
        </div>

        <div className="h-px w-full bg-gray-100" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <ChargeInput label="Valet Charges" value={`£${valet.toFixed(2)}`} />
          <ChargeInput
            label="Petrol Checkout Charges"
            value={`£${petrol.toFixed(2)}`}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <ChargeInput label="Damage Charges" value={`£${damage.toFixed(2)}`} />
          <ChargeInput
            label="Total Charges"
            value={`£${totalCharges.toFixed(2)}`}
          />
        </div>

        <div className="flex items-center gap-2">
          {isDamageApplied ? (
            <div className="h-5 w-5 relative rounded bg-blue-500 border-blue-200 border-solid border-[6px] box-border" />
          ) : (
            <div className="h-5 w-5 rounded border border-gray-300 bg-white" />
          )}

          <span className="text-sm font-normal text-black">
            Damage Charges Paid
          </span>
        </div>
      </div>
    </div>
  );
};
