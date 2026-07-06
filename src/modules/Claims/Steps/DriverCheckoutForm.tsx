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
    interiorImages: (rec.interior_images || [])
      .filter((i: any) => i.url)
      .map((i: any) => ({ id: i.id, url: i.url })),
    exteriorCleanCheckOut: yn(rec.exterior_clean_at_check_out),
    exteriorCleanCheckIn: yn(rec.exterior_clean_at_check_in),
    exteriorDamage: yn(rec.exterior_damage_at_check_in),
    exteriorDamageDescription: rec.describe_exterior_damage ?? "",
    exteriorPhotos: [],
    exteriorImages: (rec.exterior_images || [])
      .filter((i: any) => i.url)
      .map((i: any) => ({ id: i.id, url: i.url })),
    petrolCheckoutCharge: yn(rec.apply_petrol_checkout_charges),
    petrolChargeAmount: String(rec.petrol_checkout_charges ?? "0"),
    petrolChargeReason: rec.petrol_charges_note ?? "",
    applyDamageCharges: yn(rec.apply_damage_charges),
    damageCharges: String(rec.damage_charges ?? "0"),
    damageNotes: rec.damage_charges_note ?? "",
    valetCharge: 30,
  };
}

export const DriverCheckoutForm = ({ formRef, claimId }: any) => {

  const [vehicles, setVehicles] = useState<any[]>([]);
  const [checkoutMap, setCheckoutMap] = useState<Record<number, any>>({});
  const [activeVehicleTab, setActiveVehicleTab] = useState(0);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState(1);
  const [checkoutFormData, setCheckoutFormData] = useState<any>(DEFAULT_CHECKOUT);

  // Load vehicles and existing checkout records from API, then auto-select the vehicle with data
  useEffect(() => {
    if (!claimId) return;

    Promise.all([
      getHireRecords(claimId).catch(() => ({ data: [] })),
      getCheckoutDetails(claimId).catch(() => ({ data: [] })),
    ]).then(([{ data: vehicleData }, { data: checkoutData }]) => {
      // The Hire Details screen persists even its default blank vehicle row, so
      // a claim with no hire vehicle provided can still have an empty hire
      // record. Only show cards for records that actually describe a vehicle.
      const hasVehicleInfo = (v: any) =>
        Boolean(
          String(v?.hire_vehicle_registration || "").trim() ||
            String(v?.make || "").trim() ||
            String(v?.model || "").trim() ||
            v?.hire_start_date ||
            v?.hire_end_date,
        );

      const map: Record<number, any> = {};
      if (Array.isArray(checkoutData)) {
        checkoutData.forEach((rec: any) => {
          map[rec.hire_vehicle_provided_id] = fromApiRecord(rec);
        });
      }
      setCheckoutMap(map);

      // Only vehicles that have been OFF-HIRED belong on the Driver Checkout
      // screen — an on-hire vehicle has no checkout form yet, so it never shows
      // here. (hire_vehicle_status_id 1 = On Hire; anything else = off-hired.)
      // A saved checkout record also qualifies it, as a safety net.
      const ON_HIRE_STATUS = 1;
      const isOffHired = (v: any) =>
        Number(v?.hire_vehicle_status_id) !== ON_HIRE_STATUS ||
        map[v?.id] !== undefined;
      const vList = (Array.isArray(vehicleData) ? vehicleData : []).filter(
        (v: any) => hasVehicleInfo(v) && isOffHired(v),
      );
      setVehicles(vList);

      // Auto-select the first vehicle that has saved checkout data
      const firstWithData = vList.findIndex((v: any) => map[v.id] !== undefined);
      if (firstWithData !== -1) {
        setActiveVehicleTab(firstWithData);
      }
    });
  }, [claimId]);

  // Sync modal form data when tab or checkout map changes
  useEffect(() => {
    const hvpId = vehicles[activeVehicleTab]?.id;
    setCheckoutFormData(hvpId !== undefined ? (checkoutMap[hvpId] ?? DEFAULT_CHECKOUT) : DEFAULT_CHECKOUT);
  }, [activeVehicleTab, vehicles, checkoutMap]);

  const activeHvpId: number | null = vehicles[activeVehicleTab]?.id ?? null;
  const activeCheckout = activeHvpId !== null ? checkoutMap[activeHvpId] : undefined;
  const hasData = activeCheckout !== undefined;

  const getVal = (val: any) => parseFloat(val) || 0;
  const valet = hasData ? getVal(activeCheckout.valetCharge) : null;
  const petrol = hasData ? getVal(activeCheckout.petrolChargeAmount) : null;
  const damage = hasData ? getVal(activeCheckout.damageCharges) : null;
  const isDamageApplied = hasData && activeCheckout.applyDamageCharges === "Yes";
  const totalCharges = hasData
    ? (isDamageApplied ? valet! + petrol! + damage! : valet! + petrol!)
    : null;

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
      const payload = toApiPayload(data, claimId, activeHvpId);
      const fd = new FormData();
      Object.entries(payload).forEach(([k, v]) => {
        if (v !== null && v !== undefined) fd.append(k, String(v));
      });
      (data.interiorPhotos || []).forEach((file: File) =>
        fd.append("interior_files", file),
      );
      (data.exteriorPhotos || []).forEach((file: File) =>
        fd.append("exterior_files", file),
      );
      await saveCheckoutJson(fd);
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

      {vehicles.length === 0 ? (
        <div className="w-full rounded-lg border border-gray-100 p-8 text-center text-sm text-gray-400 bg-white mt-2">
          No hire vehicle was provided for this claim, so there are no driver checkout charges.
        </div>
      ) : (
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
            {hasData && "Edit"}
          </button>
        </div>

        <div className="h-px w-full bg-gray-100" />

        {!hasData ? (
          <p className="text-sm text-gray-400 py-4 text-center">
            No checkout data recorded for this vehicle yet.
          </p>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <ChargeInput label="Valet Charges" value={`£${valet!.toFixed(2)}`} />
              <ChargeInput
                label="Petrol Checkout Charges"
                value={`£${petrol!.toFixed(2)}`}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <ChargeInput label="Damage Charges" value={`£${damage!.toFixed(2)}`} />
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
              <ChargeInput
                label="Total Charges"
                value={`£${totalCharges!.toFixed(2)}`}
              />
            </div>
          </>
        )}
      </div>
      )}
    </div>
  );
};
