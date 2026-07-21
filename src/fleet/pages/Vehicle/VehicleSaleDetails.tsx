import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { ExternalLink } from "lucide-react";
import { FleetTextInput, FleetMoneyInput, FleetDateField } from "../../components/fields";
import FleetSpinnerLoader from "../../components/FleetSpinnerLoader";
import { openSaleDocumentsPrintView } from "../../services/vehicleRecordService";
import { useVehicle } from "./VehicleContext";

const SECTION = "self-stretch p-5 rounded-lg outline outline-1 -outline-offset-1 outline-neutral-100 flex flex-col gap-4";
const H3 = "text-black text-xl font-semibold leading-5";
const BTN_DARK = "h-8 px-3 py-2 bg-neutral-900 rounded text-white text-sm inline-flex items-center justify-center gap-2 hover:bg-black disabled:opacity-70";

interface Form {
  purchaserName: string;
  purchaserAddress: string;
  purchaserPostcode: string;
  purchaserTelephone: string;
  purchaserEmail: string;
  vehicleSoldOn: string;
  soldForIncVat: string;
  soldForExcVat: string;
}

const EMPTY: Form = {
  purchaserName: "", purchaserAddress: "", purchaserPostcode: "", purchaserTelephone: "",
  purchaserEmail: "", vehicleSoldOn: "", soldForIncVat: "", soldForExcVat: "",
};

const TO_BACKEND: Record<keyof Form, string> = {
  purchaserName: "purchaser_name",
  purchaserAddress: "purchaser_address",
  purchaserPostcode: "purchaser_postcode",
  purchaserTelephone: "purchaser_telephone",
  purchaserEmail: "purchaser_email",
  vehicleSoldOn: "vehicle_sold_on",
  soldForIncVat: "sold_for_inc_vat",
  soldForExcVat: "sold_for_exc_vat",
};

const VehicleSaleDetails: React.FC = () => {
  const { vehicle, save } = useVehicle();
  const [form, setForm] = useState<Form>(EMPTY);
  const [printing, setPrinting] = useState(false);

  useEffect(() => {
    if (!vehicle) return;
    setForm({
      purchaserName: vehicle.purchaser_name || "",
      purchaserAddress: vehicle.purchaser_address || "",
      purchaserPostcode: vehicle.purchaser_postcode || "",
      purchaserTelephone: vehicle.purchaser_telephone || "",
      purchaserEmail: vehicle.purchaser_email || "",
      vehicleSoldOn: vehicle.vehicle_sold_on || "",
      soldForIncVat: vehicle.sold_for_inc_vat || "",
      soldForExcVat: vehicle.sold_for_exc_vat || "",
    });
  }, [vehicle]);

  const set = <K extends keyof Form>(key: K, value: Form[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const saveField = (key: keyof Form) =>
    save({ [TO_BACKEND[key]]: form[key] === "" ? null : form[key] });

  const raiseDocuments = async () => {
    if (!vehicle?.id) return;
    if (!form.purchaserName.trim()) {
      toast.warn("Enter the purchaser's name before raising the documents.");
      return;
    }
    setPrinting(true);
    try {
      await openSaleDocumentsPrintView(vehicle.id);
    } catch {
      toast.error("Could not open the documents. Please allow pop-ups and try again.");
    } finally {
      setPrinting(false);
    }
  };

  if (!vehicle?.id) {
    return (
      <div className="flex-1 min-w-0 font-sans-headline">
        <span className="text-neutral-400 text-sm">Open the Vehicle Details screen first.</span>
      </div>
    );
  }

  return (
    <div className="flex-1 min-w-0 flex flex-col gap-6 font-sans-headline">
      {printing && <FleetSpinnerLoader />}

      <h2 className="text-black text-2xl font-semibold leading-6">Vehicle Sale Details</h2>

      {/* Section A — entered manually; nothing here is OCR'd or derived. */}
      <section className={SECTION}>
        <h3 className={H3}>Vehicle Purchaser Details</h3>
        <FleetTextInput label="Purchaser Name" placeholder="Enter Name" value={form.purchaserName} onChange={(v) => set("purchaserName", v)} onBlur={() => saveField("purchaserName")} />
        <FleetTextInput label="Address" placeholder="Enter Address" value={form.purchaserAddress} onChange={(v) => set("purchaserAddress", v)} onBlur={() => saveField("purchaserAddress")} />
        <div className="grid grid-cols-2 gap-5">
          <FleetTextInput label="Postcode" placeholder="Enter Postcode" value={form.purchaserPostcode} onChange={(v) => set("purchaserPostcode", v)} onBlur={() => saveField("purchaserPostcode")} />
          <FleetTextInput label="Telephone" placeholder="+44" inputMode="tel" value={form.purchaserTelephone} onChange={(v) => set("purchaserTelephone", v)} onBlur={() => saveField("purchaserTelephone")} />
        </div>
        <div className="grid grid-cols-2 gap-5">
          <FleetTextInput label="Email" placeholder="Enter Email" inputMode="email" value={form.purchaserEmail} onChange={(v) => set("purchaserEmail", v)} onBlur={() => saveField("purchaserEmail")} />
          <div />
        </div>
        <div className="py-2">
          <button type="button" disabled={printing} onClick={raiseDocuments} className={BTN_DARK}>
            <ExternalLink size={16} />
            Raise Release of Liability &amp; Receipt
          </button>
        </div>
      </section>

      {/* Section B — sale figures, also manual. */}
      <section className={SECTION}>
        <h3 className={H3}>Sale Details</h3>
        <div className="grid grid-cols-2 gap-5">
          <FleetDateField
            label="Vehicle Sold On"
            value={form.vehicleSoldOn}
            onChange={(v) => { set("vehicleSoldOn", v); save({ vehicle_sold_on: v || null }); }}
          />
          <div />
        </div>
        <div className="grid grid-cols-2 gap-5">
          <FleetMoneyInput label="Sold For (Inc. VAT)" value={form.soldForIncVat} onChange={(v) => set("soldForIncVat", v)} onBlur={() => saveField("soldForIncVat")} />
          <FleetMoneyInput label="Sold For (Exc. VAT)" value={form.soldForExcVat} onChange={(v) => set("soldForExcVat", v)} onBlur={() => saveField("soldForExcVat")} />
        </div>
      </section>
    </div>
  );
};

export default VehicleSaleDetails;
