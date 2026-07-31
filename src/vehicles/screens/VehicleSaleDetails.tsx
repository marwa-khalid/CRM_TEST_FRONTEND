import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { ExternalLink, Mail } from "lucide-react";
import {
  FleetTextInput,
  FleetMoneyInput,
  FleetDateField,
  FleetAddressAutocomplete,
  FleetPostcodeLookup,
  FleetUkMobileInput,
} from "../../fleet/components/fields";
import FleetSpinnerLoader from "../../fleet/components/FleetSpinnerLoader";
import FleetEmailModal, { type FleetEmailSendArgs } from "../../fleet/components/FleetEmailModal";
import { downloadSaleDocuments, getSaleAccountsEmailPreview, sendSaleAccountsEmail } from "../services/vehicleRecordService";
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
  const { vehicle, save, flush, loading: recordLoading } = useVehicle();
  const [form, setForm] = useState<Form>(EMPTY);
  const [printing, setPrinting] = useState(false);
  const [preparingEmail, setPreparingEmail] = useState(false);
  const [email, setEmail] = useState<{ to: string; subject: string; body: string } | null>(null);

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

  // Sale price pair: Inc is the base, Exc is Inc minus 20%. The two round-trip:
  // Inc → Exc = Inc × 0.8;  Exc → Inc = Exc ÷ 0.8  (so 8000 ⇄ 6400).
  const applyVat = (source: "inc" | "exc", raw: string) => {
    const n = parseFloat(raw.replace(/[^0-9.]/g, ""));
    setForm((f) =>
      source === "inc"
        ? { ...f, soldForIncVat: raw, soldForExcVat: Number.isNaN(n) ? "" : (n * 0.8).toFixed(2) }
        : { ...f, soldForExcVat: raw, soldForIncVat: Number.isNaN(n) ? "" : (n / 0.8).toFixed(2) },
    );
  };
  const saveVat = (source: "inc" | "exc") => {
    const raw = source === "inc" ? form.soldForIncVat : form.soldForExcVat;
    const n = parseFloat(raw.replace(/[^0-9.]/g, ""));
    const incNum = source === "inc" ? n : n / 0.8;
    const excNum = source === "inc" ? n * 0.8 : n;
    const inc = Number.isNaN(incNum) ? "" : incNum.toFixed(2);
    const exc = Number.isNaN(excNum) ? "" : excNum.toFixed(2);
    setForm((f) => ({ ...f, soldForIncVat: inc, soldForExcVat: exc }));
    save({
      sold_for_inc_vat: inc === "" ? null : inc,
      sold_for_exc_vat: exc === "" ? null : exc,
    });
  };

  const raiseDocuments = async () => {
    if (!vehicle?.id) return;
    if (!form.purchaserName.trim()) {
      toast.warn("Enter the purchaser's name before raising the documents.");
      return;
    }
    setPrinting(true);
    try {
      const payload = (Object.keys(TO_BACKEND) as Array<keyof Form>).reduce<Record<string, unknown>>((acc, key) => {
        acc[TO_BACKEND[key]] = form[key] === "" ? null : form[key];
        return acc;
      }, {});
      await save(payload);
      await flush(); // persist before the server generates the doc from the record
      await downloadSaleDocuments(vehicle.id);
      toast.success("Release documents downloaded.");
    } catch {
      toast.error("Could not download the documents. Please try again.");
    } finally {
      setPrinting(false);
    }
  };

  const informAccounts = async () => {
    if (!vehicle?.id) return;
    setPreparingEmail(true);
    try {
      // Persist the current form so the email reflects the latest sale data.
      const payload = (Object.keys(TO_BACKEND) as Array<keyof Form>).reduce<Record<string, unknown>>((acc, key) => {
        acc[TO_BACKEND[key]] = form[key] === "" ? null : form[key];
        return acc;
      }, {});
      await save(payload);
      await flush(); // persist before the server builds the email from the record
      const preview = await getSaleAccountsEmailPreview(vehicle.id);
      setEmail({ to: preview.to, subject: preview.subject, body: preview.body });
    } catch {
      toast.error("Could not prepare the accounts email.");
    } finally {
      setPreparingEmail(false);
    }
  };

  return (
    <div className="w-full max-w-[788px] flex flex-col gap-6 font-sans-headline">
      {(recordLoading || printing || preparingEmail || !vehicle?.id) && <FleetSpinnerLoader />}

      <h2 className="text-black text-2xl font-semibold leading-6">Vehicle Sale Details</h2>

      {/* Section A — entered manually; nothing here is OCR'd or derived. */}
      <section className={SECTION}>
        <h3 className={H3}>Vehicle Purchaser Details</h3>
        <FleetTextInput label="Purchaser Name" placeholder="Enter Name" value={form.purchaserName} onChange={(v) => set("purchaserName", v)} onBlur={() => saveField("purchaserName")} />
        <FleetAddressAutocomplete
          label="Address"
          placeholder="Enter Address"
          address={form.purchaserAddress}
          onChange={(v) => set("purchaserAddress", v)}
          onBlur={() => saveField("purchaserAddress")}
          onPlaceSelected={(place) => {
            set("purchaserAddress", place.address);
            if (place.postcode) set("purchaserPostcode", place.postcode);
            save({
              purchaser_address: place.address,
              ...(place.postcode ? { purchaser_postcode: place.postcode } : {}),
            });
          }}
        />
        <div className="grid grid-cols-2 gap-5">
          <FleetPostcodeLookup
            label="Postcode"
            placeholder="Enter Postcode"
            postcode={form.purchaserPostcode}
            onChange={(v) => set("purchaserPostcode", v)}
            onBlur={() => saveField("purchaserPostcode")}
            onAddressSelect={(addr) => {
              set("purchaserAddress", addr.address);
              set("purchaserPostcode", addr.postcode);
              save({ purchaser_address: addr.address, purchaser_postcode: addr.postcode });
            }}
          />
          <FleetUkMobileInput label="Telephone number" value={form.purchaserTelephone} onChange={(v) => set("purchaserTelephone", v)} onBlur={() => saveField("purchaserTelephone")} />
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
        <div className="flex items-center justify-between gap-4">
          <h3 className={H3}>Sale Details</h3>
          <button type="button" disabled={preparingEmail} onClick={informAccounts} className={BTN_DARK}>
            <Mail size={16} />
            Inform Accounts
          </button>
        </div>
        <div className="grid grid-cols-2 gap-5">
          <FleetDateField
            label="Vehicle Sold On"
            value={form.vehicleSoldOn}
            onChange={(v) => { set("vehicleSoldOn", v); save({ vehicle_sold_on: v || null }); }}
          />
          <div />
        </div>
        <div className="grid grid-cols-2 gap-5">
          <FleetMoneyInput label="Sold For (Inc. VAT)" value={form.soldForIncVat} onChange={(v) => applyVat("inc", v)} onBlur={() => saveVat("inc")} />
          <FleetMoneyInput label="Sold For (Exc. VAT)" value={form.soldForExcVat} onChange={(v) => applyVat("exc", v)} onBlur={() => saveVat("exc")} />
        </div>
      </section>

      <FleetEmailModal
        open={email !== null}
        onClose={() => setEmail(null)}
        hireId={vehicle?.hire_id ?? null}
        title="Inform Accounts"
        defaultTo={email?.to || ""}
        defaultSubject={email?.subject || ""}
        defaultBody={email?.body || ""}
        allowAttachments
        sendOverride={async (args: FleetEmailSendArgs) => {
          if (!vehicle?.id) return { status: "failed" as const };
          await sendSaleAccountsEmail(vehicle.id, {
            to: args.to,
            cc: args.cc,
            subject: args.subject,
            body: args.body,
            files: args.files,
          });
          return { status: "sent" as const };
        }}
      />
    </div>
  );
};

export default VehicleSaleDetails;
