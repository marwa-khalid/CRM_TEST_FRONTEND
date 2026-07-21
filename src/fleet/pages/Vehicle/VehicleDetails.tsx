import React, { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { FleetTextInput, FleetSelect, FleetDateField, FleetReadonlyField } from "../../components/fields";
import FleetSpinnerLoader from "../../components/FleetSpinnerLoader";
import UploadFileIcon from "../../assets/icons/UploadFile.svg";
import Vector6 from "../../assets/AutoClaim_icon/Vector-6.svg";
import { extractV5C } from "../../services/vehicleRecordService";
import {
  CONTRACT_TYPE_OPTIONS,
  DEPOT_BRANCH_OPTIONS,
  OBTAINED_FOR_PURPOSE_OPTIONS,
  VEHICLE_STATUS_OPTIONS,
} from "../../types/vehicleRecord";
import { useVehicle } from "./VehicleContext";

const SECTION = "self-stretch p-5 rounded-lg outline outline-1 -outline-offset-1 outline-neutral-100 flex flex-col gap-4";
const H3 = "text-black text-xl font-semibold leading-5";

interface Form {
  obtainedForPurpose: string;
  contractType: string;
  companyOwnedOrLeased: boolean;
  crossHiredToUs: boolean;
  registrationNumber: string;
  make: string;
  model: string;
  manufacturer: string;
  variant: string;
  numberOfDoors: string;
  numberOfSeats: string;
  bodyType: string;
  fuelType: string;
  transmission: string;
  engineSizeCc: string;
  v5cDocumentReference: string;
  chassisNumber: string;
  dateOfFirstRegistration: string;
  dateDelivered: string;
  vehicleStatus: string;
  depotBranch: string;
}

const EMPTY: Form = {
  obtainedForPurpose: "", contractType: "", companyOwnedOrLeased: false, crossHiredToUs: false,
  registrationNumber: "", make: "", model: "", manufacturer: "", variant: "",
  numberOfDoors: "", numberOfSeats: "", bodyType: "", fuelType: "", transmission: "",
  engineSizeCc: "", v5cDocumentReference: "", chassisNumber: "",
  dateOfFirstRegistration: "", dateDelivered: "", vehicleStatus: "", depotBranch: "",
};

const TO_BACKEND: Record<keyof Form, string> = {
  obtainedForPurpose: "obtained_for_purpose", contractType: "contract_type",
  companyOwnedOrLeased: "company_owned_or_leased", crossHiredToUs: "cross_hired_to_us",
  registrationNumber: "registration_number", make: "make", model: "model",
  manufacturer: "manufacturer", variant: "variant", numberOfDoors: "number_of_doors",
  numberOfSeats: "number_of_seats", bodyType: "body_type", fuelType: "fuel_type",
  transmission: "transmission", engineSizeCc: "engine_size_cc",
  v5cDocumentReference: "v5c_document_reference", chassisNumber: "chassis_number",
  dateOfFirstRegistration: "date_of_first_registration", dateDelivered: "date_delivered",
  vehicleStatus: "vehicle_status", depotBranch: "depot_branch",
};

// The OCR returns dd-mm-yyyy; the date field wants yyyy-mm-dd.
const toIsoDate = (value: string): string => {
  const m = value.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
  return m ? `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}` : value;
};

const displayDate = (value?: string | null): string => {
  if (!value) return "";
  const d = new Date(`${value}T00:00:00`);
  return Number.isNaN(d.getTime()) ? value : d.toLocaleDateString("en-GB");
};

// Square checkbox matching the design (filled dark when checked).
const Checkbox: React.FC<{ checked: boolean; label: string; onChange: (v: boolean) => void }> = ({
  checked,
  label,
  onChange,
}) => (
  <button type="button" onClick={() => onChange(!checked)} className="flex items-center gap-2 text-left">
    <span
      className={`w-5 h-5 shrink-0 rounded-sm flex items-center justify-center ${
        checked ? "bg-neutral-900 border-[6px] border-neutral-500" : "bg-neutral-300"
      }`}
    />
    <span className="text-black text-sm leading-4">{label}</span>
  </button>
);

const VehicleDetails: React.FC = () => {
  const { vehicle, save } = useVehicle();
  const [form, setForm] = useState<Form>(EMPTY);
  const [reading, setReading] = useState(false);
  const v5cInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!vehicle) return;
    setForm({
      obtainedForPurpose: vehicle.obtained_for_purpose || "",
      contractType: vehicle.contract_type || "",
      companyOwnedOrLeased: !!vehicle.company_owned_or_leased,
      crossHiredToUs: !!vehicle.cross_hired_to_us,
      registrationNumber: vehicle.registration_number || "",
      make: vehicle.make || "",
      model: vehicle.model || "",
      manufacturer: vehicle.manufacturer || "",
      variant: vehicle.variant || "",
      numberOfDoors: vehicle.number_of_doors || "",
      numberOfSeats: vehicle.number_of_seats || "",
      bodyType: vehicle.body_type || "",
      fuelType: vehicle.fuel_type || "",
      transmission: vehicle.transmission || "",
      engineSizeCc: vehicle.engine_size_cc || "",
      v5cDocumentReference: vehicle.v5c_document_reference || "",
      chassisNumber: vehicle.chassis_number || "",
      dateOfFirstRegistration: vehicle.date_of_first_registration || "",
      dateDelivered: vehicle.date_delivered || "",
      vehicleStatus: vehicle.vehicle_status || "",
      depotBranch: vehicle.depot_branch || "",
    });
  }, [vehicle]);

  const set = <K extends keyof Form>(key: K, value: Form[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const persist = (key: keyof Form, value: unknown) => save({ [TO_BACKEND[key]]: value });

  const saveField = (key: keyof Form) => persist(key, form[key] === "" ? null : form[key]);

  // A V5C read overwrites the vehicle fields — the document is the source of
  // truth for them, and the user story says the user may amend afterwards. The
  // two classification dropdowns are never touched; those stay the user's choice.
  const handleV5C = async (file: File) => {
    setReading(true);
    try {
      const v5c = await extractV5C(file);
      const next: Partial<Form> = {};
      if (v5c.registration) next.registrationNumber = v5c.registration;
      if (v5c.make) next.make = v5c.make;
      if (v5c.model) next.model = v5c.model;
      if (v5c.manufacturer) next.manufacturer = v5c.manufacturer;
      if (v5c.variant) next.variant = v5c.variant;
      if (v5c.numberOfDoors) next.numberOfDoors = v5c.numberOfDoors;
      if (v5c.numberOfSeats) next.numberOfSeats = v5c.numberOfSeats;
      if (v5c.bodyType) next.bodyType = v5c.bodyType;
      if (v5c.fuelType) next.fuelType = v5c.fuelType;
      if (v5c.transmission) next.transmission = v5c.transmission;
      if (v5c.engineSizeCc) next.engineSizeCc = v5c.engineSizeCc;
      if (v5c.v5cDocumentReference) next.v5cDocumentReference = v5c.v5cDocumentReference;
      if (v5c.chassisNumber) next.chassisNumber = v5c.chassisNumber;
      if (v5c.dateOfFirstRegistration) next.dateOfFirstRegistration = toIsoDate(v5c.dateOfFirstRegistration);
      if (v5c.dateDelivered) next.dateDelivered = toIsoDate(v5c.dateDelivered);

      const readCount = Object.keys(next).length;
      if (!readCount) {
        toast.warn("Could not read the V5C. Please enter the vehicle details manually.");
        return;
      }

      setForm((f) => ({ ...f, ...next }));
      // Persist everything the OCR read in one PATCH.
      const payload: Record<string, unknown> = {};
      (Object.keys(next) as Array<keyof Form>).forEach((k) => {
        payload[TO_BACKEND[k]] = next[k];
      });
      await save(payload);
      toast.success(`V5C read — ${readCount} field${readCount === 1 ? "" : "s"} filled. Please check before saving.`);
    } finally {
      setReading(false);
    }
  };

  return (
    <div className="flex-1 min-w-0 flex flex-col gap-6 font-sans-headline">
      {reading && <FleetSpinnerLoader />}

      <div className="flex justify-between items-center">
        <h2 className="text-black text-2xl font-semibold leading-6">Vehicle Details</h2>
        <input
          ref={v5cInput}
          type="file"
          accept="image/*,.pdf"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleV5C(file);
            e.target.value = "";
          }}
        />
        <button
          type="button"
          disabled={reading}
          onClick={() => v5cInput.current?.click()}
          className="h-8 px-3 py-2 bg-neutral-900 rounded text-white text-sm inline-flex items-center justify-center gap-2 hover:bg-black disabled:opacity-70"
        >
          <img src={UploadFileIcon} alt="" className="w-4 h-4 brightness-0 invert" />
          {reading ? "Reading V5C…" : "Upload V5C"}
        </button>
      </div>

      {/* Section A */}
      <section className={SECTION}>
        <h3 className={H3}>Vehicle Details</h3>
        <div className="h-px bg-neutral-100" />

        <div className="grid grid-cols-2 gap-5">
          <FleetSelect
            label="Obtained For Purpose"
            value={form.obtainedForPurpose}
            options={OBTAINED_FOR_PURPOSE_OPTIONS}
            unsorted
            onChange={(v) => { set("obtainedForPurpose", v); persist("obtainedForPurpose", v || null); }}
          />
          <FleetSelect
            label="Contract Type"
            value={form.contractType}
            options={CONTRACT_TYPE_OPTIONS}
            unsorted
            onChange={(v) => { set("contractType", v); persist("contractType", v || null); }}
          />
        </div>

        <Checkbox
          label="Company Owned or Leased Vehicle?"
          checked={form.companyOwnedOrLeased}
          onChange={(v) => { set("companyOwnedOrLeased", v); persist("companyOwnedOrLeased", v); }}
        />
        <Checkbox
          label="Vehicle Cross Hired to Us?"
          checked={form.crossHiredToUs}
          onChange={(v) => { set("crossHiredToUs", v); persist("crossHiredToUs", v); }}
        />

        <div className="grid grid-cols-2 gap-5">
          <FleetTextInput label="Registration Number" placeholder="Enter Registration" value={form.registrationNumber} onChange={(v) => set("registrationNumber", v)} onBlur={() => saveField("registrationNumber")} />
          <FleetTextInput label="Make" placeholder="Enter Make" value={form.make} onChange={(v) => set("make", v)} onBlur={() => saveField("make")} />
        </div>
        <div className="grid grid-cols-2 gap-5">
          <FleetTextInput label="Model" placeholder="Enter Model" value={form.model} onChange={(v) => set("model", v)} onBlur={() => saveField("model")} />
          <FleetTextInput label="Manufacturer" placeholder="Enter Manufacturer" value={form.manufacturer} onChange={(v) => set("manufacturer", v)} onBlur={() => saveField("manufacturer")} />
        </div>
        <div className="grid grid-cols-2 gap-5">
          <FleetTextInput label="Vehicle Model/ Variant" placeholder="Enter Variant" value={form.variant} onChange={(v) => set("variant", v)} onBlur={() => saveField("variant")} />
          <FleetTextInput label="Number of Doors" placeholder="Enter Number of Doors" inputMode="numeric" value={form.numberOfDoors} onChange={(v) => set("numberOfDoors", v.replace(/[^0-9]/g, ""))} onBlur={() => saveField("numberOfDoors")} />
        </div>
        <div className="grid grid-cols-2 gap-5">
          <FleetTextInput label="Number of Seats" placeholder="Enter Number of Seats" inputMode="numeric" value={form.numberOfSeats} onChange={(v) => set("numberOfSeats", v.replace(/[^0-9]/g, ""))} onBlur={() => saveField("numberOfSeats")} />
          <FleetTextInput label="Body Type" placeholder="Enter Body Type" value={form.bodyType} onChange={(v) => set("bodyType", v)} onBlur={() => saveField("bodyType")} />
        </div>
        <div className="grid grid-cols-2 gap-5">
          <FleetTextInput label="Fuel Type" placeholder="Enter Fuel Type" value={form.fuelType} onChange={(v) => set("fuelType", v)} onBlur={() => saveField("fuelType")} />
          <FleetTextInput label="Transmission" placeholder="Enter Transmission" value={form.transmission} onChange={(v) => set("transmission", v)} onBlur={() => saveField("transmission")} />
        </div>
        <div className="grid grid-cols-2 gap-5">
          <FleetTextInput label="Engine Size (CC)" placeholder="Enter Engine Size" inputMode="numeric" value={form.engineSizeCc} onChange={(v) => set("engineSizeCc", v.replace(/[^0-9]/g, ""))} onBlur={() => saveField("engineSizeCc")} />
          <FleetTextInput label="V5C Document Reference Number" placeholder="Enter Reference Number" value={form.v5cDocumentReference} onChange={(v) => set("v5cDocumentReference", v)} onBlur={() => saveField("v5cDocumentReference")} />
        </div>
        <div className="grid grid-cols-2 gap-5">
          <FleetTextInput label="Chassis Number (VIN)" placeholder="Enter Chassis Number" value={form.chassisNumber} onChange={(v) => set("chassisNumber", v)} onBlur={() => saveField("chassisNumber")} />
          <FleetDateField
            label="Date of First Registration"
            value={form.dateOfFirstRegistration}
            onChange={(v) => { set("dateOfFirstRegistration", v); persist("dateOfFirstRegistration", v || null); }}
          />
        </div>
        <div className="grid grid-cols-2 gap-5">
          <FleetDateField
            label="Date Delivered (where available)"
            value={form.dateDelivered}
            onChange={(v) => { set("dateDelivered", v); persist("dateDelivered", v || null); }}
          />
          <div />
        </div>
      </section>

      {/* Section B — dropdowns only, no action buttons (per the user story). */}
      <section className={SECTION}>
        <h3 className={H3}>Vehicle Availability Options</h3>
        <div className="h-px bg-neutral-100" />
        <div className="grid grid-cols-2 gap-5">
          <FleetSelect
            label="Vehicle Status"
            value={form.vehicleStatus}
            options={VEHICLE_STATUS_OPTIONS}
            unsorted
            onChange={(v) => { set("vehicleStatus", v); persist("vehicleStatus", v || null); }}
          />
          <FleetSelect
            label="Depot / Branch"
            value={form.depotBranch}
            options={DEPOT_BRANCH_OPTIONS}
            unsorted
            onChange={(v) => { set("depotBranch", v); persist("depotBranch", v || null); }}
          />
        </div>
      </section>

      {/* Section C — read-only, fetched from the Skyline client side on every load. */}
      <section className={SECTION}>
        <h3 className={H3}>Current Mileage</h3>
        <div className="h-px bg-neutral-100" />
        <div className="grid grid-cols-2 gap-5">
          <FleetReadonlyField
            label="Latest Mileage Obtained"
            value={vehicle?.latest_mileage_obtained || ""}
            placeholder="Not yet recorded on a hire"
          />
          <FleetReadonlyField
            label="Mileage Obtained On"
            value={displayDate(vehicle?.mileage_obtained_on)}
            placeholder="Not yet recorded on a hire"
            icon={Vector6}
          />
        </div>
      </section>
    </div>
  );
};

export default VehicleDetails;
