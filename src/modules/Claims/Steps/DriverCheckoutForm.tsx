import { useEffect, useState, type FunctionComponent } from "react";
import { toast } from "react-toastify";
import { CheckoutModal } from "../Components/CheckoutModal";
import {
  getHireRecords,
  getCheckoutDetails,
  saveCheckoutJson,
  sendCheckoutEmail,
} from "../../../services/HireVehicleProvided/HireVehicleProvided";
import editpencil from '../../../assets/AutoClaim_icon/pencil.svg'
const DEFAULT_CHECKOUT = {
  interiorCleanCheckOut: "No",
  interiorCleanCheckIn: "No",
  interiorDamage: "No",
  interiorDamageDescription: "",
  interiorPhotos: [] as File[],
  exteriorCleanCheckOut: "No",
  exteriorCleanCheckIn: "No",
  exteriorDamage: "No",
  exteriorDamageDescription: "",
  exteriorPhotos: [] as File[],
  petrolCheckoutCharge: "No",
  petrolChargeAmount: "0",
  petrolChargeReason: "",
  applyDamageCharges: "No",
  damageCharges: "0",
  damageNotes: "",
  valetCharge: 30,
};

function toApiPayload(formData: any, claimId: string, hvpId: number) {
  const toVal = (v: any) => parseFloat(v) || 0;
  const total =
    toVal(formData.valetCharge) +
    toVal(formData.petrolChargeAmount) +
    (formData.applyDamageCharges === "Yes" ? toVal(formData.damageCharges) : 0);

  return {
    claim_id: Number(claimId),
    hire_vehicle_provided_id: hvpId,
    currency: "GBP",
    interior_clean_at_check_out: formData.interiorCleanCheckOut === "Yes",
    interior_clean_at_check_in: formData.interiorCleanCheckIn === "Yes",
    interior_damage_at_check_in: formData.interiorDamage === "Yes",
    describe_interior_damage: formData.interiorDamageDescription || null,
    exterior_clean_at_check_out: formData.exteriorCleanCheckOut === "Yes",
    exterior_clean_at_check_in: formData.exteriorCleanCheckIn === "Yes",
    exterior_damage_at_check_in: formData.exteriorDamage === "Yes",
    describe_exterior_damage: formData.exteriorDamageDescription || null,
    apply_petrol_checkout_charges: formData.petrolCheckoutCharge === "Yes",
    petrol_checkout_charges: toVal(formData.petrolChargeAmount) || null,
    petrol_charges_note: formData.petrolChargeReason || null,
    apply_damage_charges: formData.applyDamageCharges === "Yes",
    damage_charges: toVal(formData.damageCharges) || null,
    damage_charges_paid_now: null,
    damage_charges_note: formData.damageNotes || null,
    damage_charges_paid: false,
    valet_charges: toVal(formData.valetCharge),
    total_driver_checkout_charges: total,
  };
}

function fromApiRecord(rec: any) {
  const yn = (v: boolean) => (v ? "Yes" : "No");
  return {
    interiorCleanCheckOut: yn(rec.interior_clean_at_check_out),
    interiorCleanCheckIn: yn(rec.interior_clean_at_check_in),
    interiorDamage: yn(rec.interior_damage_at_check_in),
    interiorDamageDescription: rec.describe_interior_damage ?? "",
    interiorPhotos: [],
    exteriorCleanCheckOut: yn(rec.exterior_clean_at_check_out),
    exteriorCleanCheckIn: yn(rec.exterior_clean_at_check_in),
    exteriorDamage: yn(rec.exterior_damage_at_check_in),
    exteriorDamageDescription: rec.describe_exterior_damage ?? "",
    exteriorPhotos: [],
    petrolCheckoutCharge: yn(rec.apply_petrol_checkout_charges),
    petrolChargeAmount: String(rec.petrol_checkout_charges ?? "0"),
    petrolChargeReason: rec.petrol_charges_note ?? "",
    applyDamageCharges: yn(rec.apply_damage_charges),
    damageCharges: String(rec.damage_charges ?? "0"),
    damageNotes: rec.damage_charges_note ?? "",
    valetCharge: parseFloat(rec.valet_charges ?? 30),
  };
}

export const DriverCheckoutForm = ({ formRef, claimId }: any) => {

  const [vehicles, setVehicles] = useState<any[]>([]);
  const [checkoutMap, setCheckoutMap] = useState<Record<number, any>>({});
  const [activeVehicleTab, setActiveVehicleTab] = useState(0);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState(1);
  const [checkoutFormData, setCheckoutFormData] = useState<any>(DEFAULT_CHECKOUT);

  // Load vehicles and existing checkout records from API
  useEffect(() => {
    if (!claimId) return;

    getHireRecords(claimId)
      .then(({ data }) => setVehicles(Array.isArray(data) ? data : []))
      .catch(() => {});

    getCheckoutDetails(claimId)
      .then(({ data }) => {
        if (!Array.isArray(data)) return;
        const map: Record<number, any> = {};
        data.forEach((rec: any) => {
          map[rec.hire_vehicle_provided_id] = fromApiRecord(rec);
        });
        setCheckoutMap(map);
      })
      .catch(() => {});
  }, [claimId]);

  // Sync modal form when switching tabs
  useEffect(() => {
    const hvpId = vehicles[activeVehicleTab]?.id;
    setCheckoutFormData(hvpId ? (checkoutMap[hvpId] ?? DEFAULT_CHECKOUT) : DEFAULT_CHECKOUT);
  }, [activeVehicleTab, vehicles, checkoutMap]);

  const activeHvpId: number | null = vehicles[activeVehicleTab]?.id ?? null;
  const activeCheckout = activeHvpId ? (checkoutMap[activeHvpId] ?? DEFAULT_CHECKOUT) : DEFAULT_CHECKOUT;

  const getVal = (val: any) => parseFloat(val) || 0;
  const valet = getVal(activeCheckout.valetCharge);
  const petrol = getVal(activeCheckout.petrolChargeAmount);
  const damage = getVal(activeCheckout.damageCharges);
  const isDamageApplied = activeCheckout.applyDamageCharges === "Yes";
  const totalCharges = isDamageApplied ? valet + petrol + damage : valet + petrol;

  const handleEditCheckout = (idx: number) => {
    setActiveVehicleTab(idx);
    const hvpId = vehicles[idx]?.id;
    setCheckoutFormData(hvpId ? (checkoutMap[hvpId] ?? DEFAULT_CHECKOUT) : DEFAULT_CHECKOUT);
    setCheckoutStep(1);
    setShowCheckoutModal(true);
  };

  const handleSaveCheckout = async (data: any) => {
    if (!activeHvpId || !claimId) {
      toast.error("No hire vehicle ID — save hire records first");
      return;
    }
    try {
      await saveCheckoutJson(toApiPayload(data, claimId, activeHvpId));
      setCheckoutMap((prev) => ({ ...prev, [activeHvpId]: data }));
      setShowCheckoutModal(false);

      try {
        await sendCheckoutEmail(claimId, activeHvpId);
        toast.success("Checkout saved and confirmation email sent");
      } catch {
        toast.success("Checkout saved (email could not be sent)");
      }
    } catch {
      toast.error("Failed to save checkout details");
    }
  };

  const HireDates: FunctionComponent<{ start: string; end: string }> = ({ start, end }) => (
    <div className="text-sm font-stack-sans-headline text-neutral-500 whitespace-pre-wrap">
      Hire Start: {start || "TBC"} - Hire End: {end || "TBC"}
    </div>
  );

  const ChargeInput = ({ label, value }: { label: string; value: string }) => (
    <div className="flex w-full flex-col gap-2">
      <label className="text-sm font-weight-400 text-gray-700">{label}</label>
      <div className="flex h-[52px] items-center rounded border border-gray-200 bg-white px-5 py-4">
        <span className="text-base font-light leading-4 text-gray-700">{value}</span>
      </div>
    </div>
  );

  return (
    <div className="MainContent w-full flex flex-col items-start gap-6 py-1 font-['Stack_Sans_Headline'] pb-5">
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
            key={v.id ?? idx}
            className={`w-full flex flex-col gap-2 rounded-lg p-5 cursor-pointer transition-all duration-200 ${
              activeVehicleTab === idx
                ? "bg-blue-100 border border-blue-600"
                : "bg-white border border-slate-200"
            }`}
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
            </div>
            <HireDates start={v?.hire_start_date} end={v?.hire_end_date} />
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
            className="flex items-center gap-2 text-blue-300 text-sm hover:bg-blue-50 px-3 py-2 rounded-md"
          >
            {/* <img src={editpencil} alt="" className="text-blue-600"/> */}
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
          {/* <ChargeInput
            label="Total Charges"
            value={`£${totalCharges.toFixed(2)}`}
          /> */}
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* <ChargeInput label="Damage Charges" value={`£${damage.toFixed(2)}`} /> */}
          <ChargeInput
            label="Total Charges"
            value={`£${totalCharges.toFixed(2)}`}
          />
        </div>
      </div>
    </div>
  );
};
