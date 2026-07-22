import React, { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { FleetTextInput, FleetDateField, FleetTimeSelect } from "../../components/fields";
import FleetSpinnerLoader from "../../components/FleetSpinnerLoader";
import FleetUploadModal from "../../components/FleetUploadModal";
import UploadFileIcon from "../../assets/icons/UploadFile.svg";
import RemoveIcon from "../../assets/icons/Remove.svg";
import {
  createVehicleService,
  deleteVehicleService,
  extractServiceInvoice,
  listVehicleServices,
  updateVehicleService,
  uploadServiceInvoice,
  SERVICE_INTERVAL_MILES,
  type VehicleServiceRecord,
} from "../../services/vehicleServiceService";
import { useVehicle } from "./VehicleContext";

const SECTION = "self-stretch p-5 rounded-lg outline outline-1 -outline-offset-1 outline-neutral-100 flex flex-col gap-4";
const H3 = "text-black text-xl font-semibold leading-5";
const BTN_DARK = "h-8 px-3 py-2 bg-neutral-900 rounded text-white text-sm inline-flex items-center justify-center gap-2 hover:bg-black disabled:opacity-70";
const LOG_GRID = "grid grid-cols-[1.2fr_1fr_1.2fr_1fr_44px] gap-2";

const digitsOnly = (value: string) => value.replace(/[^0-9]/g, "");

// OCR returns dd-mm-yyyy; the date field wants yyyy-mm-dd.
const toIsoDate = (value: string): string => {
  const m = value.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
  return m ? `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}` : value;
};

const displayDate = (value?: string | null): string => {
  if (!value) return "";
  const d = new Date(`${value}T00:00:00`);
  return Number.isNaN(d.getTime()) ? value : d.toLocaleDateString("en-GB");
};

const ServicingDetails: React.FC = () => {
  const { vehicle } = useVehicle();
  const recordId = vehicle?.id ?? null;

  const [services, setServices] = useState<VehicleServiceRecord[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);

  const active = services[activeIndex] ?? null;

  const load = useCallback(async () => {
    if (!recordId) return;
    setLoading(true);
    try {
      let rows = await listVehicleServices(recordId);
      // Always show a servicing form — create a first blank record so the Garage
      // and Servicing sections render before any invoice is uploaded. Uploading
      // an invoice fills this record; a later upload adds another.
      if (rows.length === 0) {
        const created = await createVehicleService(recordId);
        if (created) rows = [created];
      }
      setServices(rows);
      // Show the newest record by default — it's the one that determines the
      // current Next Service Due At.
      setActiveIndex(Math.max(0, rows.length - 1));
    } finally {
      setLoading(false);
    }
  }, [recordId]);

  useEffect(() => {
    load();
  }, [load]);

  const patch = async (field: string, value: unknown) => {
    if (!recordId || !active) return;
    setServices((rows) => rows.map((r) => (r.id === active.id ? { ...r, [field]: value } : r)));
    const updated = await updateVehicleService(recordId, active.id, { [field]: value });
    if (updated) setServices((rows) => rows.map((r) => (r.id === updated.id ? updated : r)));
  };

  // A servicing record is untouched if it has no invoice and no entered data —
  // the auto-created first record, or one just added.
  const isBlank = (r?: VehicleServiceRecord | null) =>
    !!r && !r.invoice_name && !r.garage_name && !r.serviced_at_mileage && !r.serviced_on && !r.case_reference;

  // The first invoice fills the blank starter record; each later invoice adds a
  // new record so the log keeps the full history rather than overwriting.
  const handleInvoice = async (file: File) => {
    if (!recordId) return;
    // Progress is shown by the upload modal, so no full-screen spinner here.
    {
      const target = isBlank(active) ? active! : await createVehicleService(recordId);
      if (!target) {
        throw new Error("Could not create the servicing record.");
      }
      const isNew = !isBlank(active);
      const stored = (await uploadServiceInvoice(recordId, target.id, file)) ?? target;

      const invoice = await extractServiceInvoice(file);
      const payload: Record<string, unknown> = {};
      if (invoice.garageName) payload.garage_name = invoice.garageName;
      if (invoice.address) payload.address = invoice.address;
      if (invoice.postcode) payload.postcode = invoice.postcode;
      if (invoice.contactNumber) payload.contact_number = invoice.contactNumber;
      if (invoice.email) payload.email = invoice.email;
      if (invoice.serviceBookedDate) payload.service_booked_date = toIsoDate(invoice.serviceBookedDate);
      if (invoice.serviceBookedTime) payload.service_booked_time = invoice.serviceBookedTime;
      if (invoice.servicedAtMileage) payload.serviced_at_mileage = invoice.servicedAtMileage;
      if (invoice.servicedOn) payload.serviced_on = toIsoDate(invoice.servicedOn);
      if (invoice.nextServiceDueAt) payload.next_service_due_at = invoice.nextServiceDueAt;
      if (invoice.caseReference) payload.case_reference = invoice.caseReference;

      const count = Object.keys(payload).length;
      const updated = count ? await updateVehicleService(recordId, target.id, payload) : null;
      const finalRecord = updated ?? stored;

      setServices((rows) => {
        if (isNew) return [...rows, finalRecord];
        return rows.map((r) => (r.id === finalRecord.id ? finalRecord : r));
      });
      setActiveIndex(isNew ? services.length : activeIndex);

      if (!count) {
        toast.warn("Invoice saved, but nothing could be read from it. Please enter the details manually.");
      } else {
        toast.success(`Invoice read — ${count} field${count === 1 ? "" : "s"} filled. Please check before saving.`);
      }
    }
  };

  const handleDelete = async (service: VehicleServiceRecord) => {
    if (!recordId) return;
    setBusy(true);
    try {
      await deleteVehicleService(recordId, service.id);
      setServices((rows) => rows.filter((r) => r.id !== service.id));
      setActiveIndex((i) => Math.max(0, Math.min(i, services.length - 2)));
    } finally {
      setBusy(false);
    }
  };

  if (!recordId) {
    return (
      <div className="w-full max-w-[788px] font-sans-headline">
        <span className="text-neutral-400 text-sm">Open the Vehicle Details screen first.</span>
      </div>
    );
  }

  const mileageHint = active?.serviced_at_mileage && !active?.next_service_due_at
    ? `Defaults to ${SERVICE_INTERVAL_MILES.toLocaleString()} miles after the serviced mileage.`
    : "";

  return (
    <div className="w-full max-w-[788px] flex flex-col gap-6 font-sans-headline">
      {(loading || busy) && <FleetSpinnerLoader />}

      <FleetUploadModal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onUploaded={handleInvoice}
        title="Upload Service Invoice"
        accept="image/*,.pdf"
      />

      <div className="flex justify-between items-center">
        <h2 className="text-black text-2xl font-semibold leading-6">Servicing Details</h2>
        <button type="button" disabled={busy} onClick={() => setUploadOpen(true)} className={BTN_DARK}>
          <img src={UploadFileIcon} alt="" className="w-4 h-4 brightness-0 invert" />
          Upload Service Invoice
        </button>
      </div>

      {/* Invoice tabs — selecting one shows its servicing details. */}
      {services.length > 0 && (
        <div className="flex flex-wrap gap-6">
          {services.map((service, i) => {
            const isActive = i === activeIndex;
            const subtitle = [service.garage_name, service.serviced_at_mileage]
              .filter(Boolean)
              .join(" - ");
            return (
              <button
                key={service.id}
                type="button"
                onClick={() => setActiveIndex(i)}
                className={`flex-1 min-w-[220px] p-5 rounded-lg outline outline-1 -outline-offset-1 flex flex-col items-start gap-1 text-left ${
                  isActive ? "outline-neutral-700" : "outline-neutral-300"
                }`}
              >
                <span className={`text-xl font-semibold leading-5 ${isActive ? "text-black" : "text-neutral-300"}`}>
                  Service Invoice {service.position ?? i + 1}
                </span>
                <span className={`text-sm font-medium truncate max-w-full ${isActive ? "text-neutral-700" : "text-neutral-300"}`}>
                  {subtitle || "No details yet"}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {services.length === 0 ? (
        <section className={SECTION}>
          <span className="text-neutral-400 text-sm">
            Upload a service invoice to start the servicing history for this vehicle.
          </span>
        </section>
      ) : (
        active && (
          <>
            <section className={SECTION}>
              <h3 className={H3}>Garage Details</h3>
              <FleetTextInput label="Servicing Garage Name" placeholder="Enter Garage Name" value={active.garage_name || ""} onChange={(v) => patch("garage_name", v)} />
              <FleetTextInput label="Address" placeholder="Enter Address" value={active.address || ""} onChange={(v) => patch("address", v)} />
              <div className="grid grid-cols-2 gap-5">
                <FleetTextInput label="Postcode" placeholder="Enter Postcode" value={active.postcode || ""} onChange={(v) => patch("postcode", v)} />
                <FleetTextInput label="Contact Number" placeholder="Enter Contact Number" inputMode="tel" value={active.contact_number || ""} onChange={(v) => patch("contact_number", v)} />
              </div>
              <div className="grid grid-cols-2 gap-5">
                <FleetTextInput label="Email" placeholder="Enter Email" inputMode="email" value={active.email || ""} onChange={(v) => patch("email", v)} />
                <div />
              </div>
            </section>

            <section className={SECTION}>
              <h3 className={H3}>Servicing Details</h3>
              <div className="grid grid-cols-2 gap-5">
                <FleetDateField label="Service Booked For Date" value={active.service_booked_date || ""} onChange={(v) => patch("service_booked_date", v || null)} />
                <FleetTimeSelect label="Service Booked For Time" value={active.service_booked_time || ""} onChange={(v) => patch("service_booked_time", v || null)} />
              </div>
              <div className="grid grid-cols-2 gap-5">
                <FleetTextInput label="Serviced At Mileage" placeholder="Enter Mileage" inputMode="numeric" value={active.serviced_at_mileage || ""} onChange={(v) => patch("serviced_at_mileage", digitsOnly(v))} />
                <FleetDateField label="Serviced On (date)" value={active.serviced_on || ""} onChange={(v) => patch("serviced_on", v || null)} />
              </div>
              <div className="grid grid-cols-2 gap-5">
                <div className="flex flex-col gap-1">
                  {/* Calculated as mileage + 10,000, but editable — an amendment
                      is kept even if the serviced mileage changes afterwards. */}
                  <FleetTextInput label="Next Service Due At" placeholder="Enter Mileage" inputMode="numeric" value={active.next_service_due_at || ""} onChange={(v) => patch("next_service_due_at", digitsOnly(v))} />
                  {mileageHint && <span className="text-neutral-400 text-xs">{mileageHint}</span>}
                </div>
                <div />
              </div>
            </section>

            <section className={SECTION}>
              <h3 className={H3}>Service Summary Log</h3>
              <div className="self-stretch rounded-lg outline outline-1 -outline-offset-1 outline-neutral-100 flex flex-col">
                <div className={`${LOG_GRID} px-4 h-12 items-center text-neutral-900 text-sm font-semibold`}>
                  <span>SERVICED BY</span>
                  <span>SERVICED ON</span>
                  <span>SERVICED AT MILEAGE</span>
                  <span>CASE REFERENCE</span>
                  <span />
                </div>
                <div className="h-px bg-neutral-100" />
                {services.map((service, i) => (
                  <React.Fragment key={service.id}>
                    <div
                      className={`${LOG_GRID} px-4 py-3 items-center text-sm cursor-pointer hover:bg-neutral-50 ${
                        i === activeIndex ? "bg-neutral-50 text-neutral-900" : "text-neutral-700"
                      }`}
                      onClick={() => setActiveIndex(i)}
                    >
                      <span className="truncate">{service.garage_name || "—"}</span>
                      <span>{displayDate(service.serviced_on) || "—"}</span>
                      <span>{service.serviced_at_mileage || "—"}</span>
                      <span className="truncate">{service.case_reference || "—"}</span>
                      <button
                        type="button"
                        title="Remove this servicing record"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(service);
                        }}
                        className="justify-self-end hover:opacity-70"
                      >
                        <img src={RemoveIcon} alt="Remove" className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="h-px bg-neutral-100" />
                  </React.Fragment>
                ))}
              </div>
            </section>
          </>
        )
      )}
    </div>
  );
};

export default ServicingDetails;
