import React, { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { FleetTextInput, FleetDateField, FleetTimeSelect, FleetAddressAutocomplete, FleetPostcodeLookup } from "../../fleet/components/fields";
import FleetSpinnerLoader from "../../fleet/components/FleetSpinnerLoader";
import FleetUploadModal from "../../fleet/components/FleetUploadModal";
import FleetConfirmModal from "../../fleet/components/FleetConfirmModal";
import FleetUploadedDocuments from "../../fleet/components/FleetUploadedDocuments";
import UploadFileIcon from "../../fleet/assets/icons/UploadFile.svg";
import RemoveIcon from "../../fleet/assets/icons/Remove.svg";
import {
  createVehicleService,
  deleteVehicleService,
  extractServiceInvoice,
  listVehicleServices,
  updateVehicleService,
  uploadServiceInvoice,
  SERVICE_INTERVAL_MILES,
  type VehicleServiceRecord,
} from "../services/vehicleServiceService";
import {
  listVehicleDocuments,
  getVehicleDocumentFileUrl,
  deleteVehicleDocument,
  type VehicleDocument,
} from "../services/vehicleRecordService";
import { useVehicle } from "./VehicleContext";
import { useHire } from "../../fleet/pages/AddNewHire/HireContext";

const SECTION = "self-stretch p-5 rounded-lg outline outline-1 -outline-offset-1 outline-neutral-100 flex flex-col gap-4";
const H3 = "text-black text-xl font-semibold leading-5";
const BTN_DARK = "h-8 px-3 py-2 bg-neutral-900 rounded text-white text-sm inline-flex items-center justify-center gap-2 hover:bg-black disabled:opacity-70";
const LOG_GRID = "grid grid-cols-[2.4fr_1fr_1.2fr] gap-3";
const LOW_CONFIDENCE_MSG = "Low Confidence OCR Result - Please Verify";

const digitsOnly = (value: string) => value.replace(/[^0-9]/g, "");

type ServiceOcrField =
  | "garage_name"
  | "address"
  | "postcode"
  | "contact_number"
  | "email"
  | "service_booked_date"
  | "service_booked_time"
  | "serviced_at_mileage"
  | "serviced_on"
  | "next_service_due_at"
  | "case_reference";

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
  const { vehicle, loading: recordLoading } = useVehicle();
  const recordId = vehicle?.id ?? null;

  const [services, setServices] = useState<VehicleServiceRecord[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  // Which service card the upload modal targets — the top CTA adds a new card,
  // each card's own button replaces/adds to that specific card.
  const [uploadTargetId, setUploadTargetId] = useState<number | null>(null);
  const [invoiceDocs, setInvoiceDocs] = useState<VehicleDocument[]>([]);
  // Delete goes through a confirmation modal rather than removing immediately.
  const [deleteTarget, setDeleteTarget] = useState<VehicleServiceRecord | null>(null);
  const [deleteDoc, setDeleteDoc] = useState<VehicleDocument | null>(null);
  // Shows a loader while a document is fetched for viewing (the eye icon).
  const [viewingDoc, setViewingDoc] = useState(false);
  // Shows a loader while the active card's invoices are (re)fetched on switch.
  const [invoicesLoading, setInvoicesLoading] = useState(false);
  // Per service card: fields the last invoice OCR could not read. They stay red
  // until the user edits/verifies that field.
  const [ocrMissingByService, setOcrMissingByService] = useState<Record<number, ServiceOcrField[]>>({});

  const active = services[activeIndex] ?? null;
  const activeId = active?.id ?? null;

  // Invoice history for the active card — every uploaded invoice stays viewable
  // (latest + "Show all"), and replacing one adds a new row rather than overwriting.
  // Keyed on the id (not the record object) so editing a field doesn't refetch.
  // `silent` refreshes the list without the full-screen spinner — used after an
  // upload/delete, where the modal already shows its own progress and a second
  // overlay would flash over it.
  const loadInvoices = useCallback(async (silent = false) => {
    if (!recordId || !activeId) {
      setInvoiceDocs([]);
      return;
    }
    if (!silent) setInvoicesLoading(true);
    try {
      setInvoiceDocs(await listVehicleDocuments(recordId, "service_invoice", undefined, activeId));
    } finally {
      if (!silent) setInvoicesLoading(false);
    }
  }, [recordId, activeId]);

  useEffect(() => {
    loadInvoices();
  }, [loadInvoices]);

  const openInvoice = async (docId: number) => {
    if (!recordId) return;
    setViewingDoc(true);
    try {
      const url = await getVehicleDocumentFileUrl(recordId, docId);
      if (url) window.open(url, "_blank", "noopener,noreferrer");
      else toast.error("Could not open the file.");
    } finally {
      setViewingDoc(false);
    }
  };

  const confirmDeleteDoc = async () => {
    if (!deleteDoc || !recordId) return;
    const target = deleteDoc;
    setDeleteDoc(null);
    setInvoiceDocs((rows) => rows.filter((r) => r.id !== target.id)); // optimistic
    const ok = await deleteVehicleDocument(recordId, target.id);
    if (ok) toast.success("Document removed.");
    else { toast.error("Couldn't remove the document."); loadInvoices(true); }
  };

  // Mount-scoped readiness so the loader shows over the (empty) fields until the
  // records arrive — never a blank white page.
  const [pageReady, setPageReady] = useState(false);

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
      // Open the first card by default.
      setActiveIndex(0);
    } finally {
      setLoading(false);
      setPageReady(true);
    }
  }, [recordId]);

  useEffect(() => {
    load();
  }, [load]);

  // Buffer of pending edits per service id, flushed on navigation rather than
  // PATCHed on every field — one request per screen instead of dozens.
  const { registerFlusher } = useHire();
  const pendingRef = useRef<Record<number, Record<string, unknown>>>({});

  const patch = async (field: string, value: unknown) => patchMany({ [field]: value });

  // Several fields at once — used when a postcode/address lookup fills both.
  const patchMany = async (fields: Record<string, unknown>) => {
    if (!recordId || !active) return;
    const touched = Object.keys(fields) as ServiceOcrField[];
    setOcrMissingByService((prev) => ({
      ...prev,
      [active.id]: (prev[active.id] || []).filter((field) => !touched.includes(field)),
    }));
    setServices((rows) => rows.map((r) => (r.id === active.id ? { ...r, ...fields } : r)));
    // Buffer instead of PATCHing now — flushPending persists it on navigation.
    pendingRef.current[active.id] = { ...(pendingRef.current[active.id] || {}), ...fields };
  };

  // Persist every service card's buffered edits (called before the wizard
  // navigates away). Merges each server response back into local state.
  const flushPending = useCallback(async () => {
    if (!recordId) return;
    const buffers = pendingRef.current;
    pendingRef.current = {};
    for (const [idStr, fields] of Object.entries(buffers)) {
      if (!fields || Object.keys(fields).length === 0) continue;
      const updated = await updateVehicleService(recordId, Number(idStr), fields);
      if (updated) setServices((rows) => rows.map((r) => (r.id === updated.id ? updated : r)));
    }
  }, [recordId]);
  useEffect(() => registerFlusher(flushPending), [registerFlusher, flushPending]);

  // Top CTA — just add a new (blank) service card and make it active. Uploading
  // its invoice is done from the card's own "Upload Service Invoice" button.
  const addServiceCard = async () => {
    if (!recordId) return;
    setBusy(true);
    try {
      const created = await createVehicleService(recordId);
      if (!created) {
        toast.error("Could not add a service card.");
        return;
      }
      setActiveIndex(services.length); // the new card is appended at the end
      setServices((rows) => [...rows, created]);
    } finally {
      setBusy(false);
    }
  };

  // Per-card — upload/replace the invoice for one specific card. The previous
  // invoice stays in that card's history rather than being overwritten.
  const replaceInvoice = (service: VehicleServiceRecord, index: number) => {
    setActiveIndex(index);
    setUploadTargetId(service.id);
    setUploadOpen(true);
  };

  // Uploads the chosen invoice against the targeted card, reads it, and refreshes
  // that card's invoice history.
  const handleInvoice = async (file: File) => {
    const targetId = uploadTargetId ?? active?.id ?? null;
    if (!recordId || targetId == null) return;
    const stored = await uploadServiceInvoice(recordId, targetId, file);

    const invoice = await extractServiceInvoice(file);
    const ocrValues: Record<ServiceOcrField, string> = {
      garage_name: invoice.garageName,
      address: invoice.address,
      postcode: invoice.postcode,
      contact_number: invoice.contactNumber,
      email: invoice.email,
      service_booked_date: invoice.serviceBookedDate,
      service_booked_time: invoice.serviceBookedTime,
      serviced_at_mileage: invoice.servicedAtMileage,
      serviced_on: invoice.servicedOn,
      next_service_due_at: invoice.nextServiceDueAt,
      case_reference: invoice.caseReference,
    };
    const missing = (Object.entries(ocrValues) as [ServiceOcrField, string][])
      .filter(([, value]) => !String(value || "").trim())
      .map(([field]) => field);
    setOcrMissingByService((prev) => ({ ...prev, [targetId]: missing }));

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
    const updated = count ? await updateVehicleService(recordId, targetId, payload) : null;
    const finalRecord = updated ?? stored;
    if (finalRecord) setServices((rows) => rows.map((r) => (r.id === targetId ? finalRecord : r)));
    // Silent — the upload modal's own progress bar is the only loader on screen.
    await loadInvoices(true);

    if (!count) {
      toast.warn("Invoice saved, but nothing could be read from it. Please enter the details manually.");
    } else {
      toast.success("Invoice read. Please check the details before saving.");
    }
  };

  const handleDelete = async (service: VehicleServiceRecord) => {
    if (!recordId) return;
    setBusy(true);
    try {
      await deleteVehicleService(recordId, service.id);
      let remaining = services.filter((r) => r.id !== service.id);
      setOcrMissingByService((prev) => {
        const next = { ...prev };
        delete next[service.id];
        return next;
      });
      // Never leave the screen empty — recreate a blank starter so the Garage
      // and Servicing form stays on screen.
      if (remaining.length === 0) {
        const created = await createVehicleService(recordId);
        if (created) remaining = [created];
      }
      setServices(remaining);
      setActiveIndex((i) => Math.max(0, Math.min(i, remaining.length - 1)));
    } finally {
      setBusy(false);
    }
  };

  const mileageHint = active?.serviced_at_mileage && !active?.next_service_due_at
    ? `Defaults to ${SERVICE_INTERVAL_MILES.toLocaleString()} miles after the serviced mileage.`
    : "";
  const ocrError = (field: ServiceOcrField): string | undefined => {
    if (!activeId) return undefined;
    return (ocrMissingByService[activeId] || []).includes(field) ? LOW_CONFIDENCE_MSG : undefined;
  };

  return (
    <div className="w-full max-w-[788px] flex flex-col gap-6 font-sans-headline">
      {(recordLoading || loading || busy || viewingDoc || invoicesLoading || !recordId || !pageReady) && <FleetSpinnerLoader />}

      <FleetUploadModal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onUploaded={handleInvoice}
        title="Upload Service Invoice"
        accept="image/*,.pdf"
        history={invoiceDocs}
        onView={openInvoice}
      />

      <div className="flex justify-between items-center">
        <h2 className="text-black text-2xl font-semibold leading-6">Servicing Details</h2>
        <button type="button" disabled={busy} onClick={addServiceCard} className={BTN_DARK}>
          <span className="text-xl">+</span>Add New Service
        </button>
      </div>

      {/* Invoice cards — always one row of equal-width cards, so they never wrap. */}
      {services.length > 0 && (
        <div className="flex gap-3">
          {services.map((service, i) => {
            const isActive = i === activeIndex;
            const subtitle = [service.garage_name, service.serviced_at_mileage]
              .filter(Boolean)
              .join(" - ");
            return (
              <div
                key={service.id}
                className={`flex-1 basis-0 min-w-0 p-4 rounded-lg outline outline-1 -outline-offset-1 flex items-start gap-2 ${
                  isActive ? "outline-neutral-700" : "outline-neutral-300"
                }`}
              >
                <button
                  type="button"
                  onClick={() => setActiveIndex(i)}
                  className="flex-1 min-w-0 flex flex-col items-start gap-1 text-left"
                >
                  <span className={`text-base font-semibold leading-tight ${isActive ? "text-black" : "text-neutral-300"}`}>
                    Service Invoice {service.position ?? i + 1}
                  </span>
                  <span className={`text-xs font-medium truncate max-w-full ${isActive ? "text-neutral-700" : "text-neutral-300"}`}>
                    {subtitle || "No details yet"}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteTarget(service)}
                  className="w-5 h-5 shrink-0 flex items-center justify-center rounded hover:bg-neutral-100"
                  title={`Delete Service Invoice ${service.position ?? i + 1}`}
                >
                  <img src={RemoveIcon} alt="Delete" className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {
      //   services.length === 0 ? (
      //   <section className={SECTION}>
      //     <span className="text-neutral-400 text-sm">
      //       Upload a service invoice to start the servicing history for this vehicle.
      //     </span>
      //   </section>
      // ) : (
        active && (
          <>
            <section className={SECTION}>
              <div className="flex justify-between items-center gap-4">
                <h3 className={H3}>Garage Details</h3>
                {/* {invoiceDocs.length === 0 && ( */}
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => replaceInvoice(active, activeIndex)}
                    className={`${BTN_DARK} shrink-0`}
                  >
                    <img src={UploadFileIcon} alt="" className="w-4 h-4 brightness-0 invert" />
                    Upload Service Invoice
                  </button>
                {/* )} */}
              </div>
              {/* Uploaded service invoices — current + previous reports (Figma). */}
              <FleetUploadedDocuments docs={invoiceDocs} onView={openInvoice} onRemove={setDeleteDoc} />
              <FleetTextInput
                label="Servicing Garage Name"
                placeholder="Enter Garage Name"
                value={active.garage_name || ""}
                onChange={(v) => patch("garage_name", v)}
                error={ocrError("garage_name")}
              />
              <FleetAddressAutocomplete
                label="Address"
                placeholder="Enter Address"
                address={active.address || ""}
                onChange={(v) => patch("address", v)}
                onPlaceSelected={(place) => patchMany({ address: place.address, ...(place.postcode ? { postcode: place.postcode } : {}) })}
                error={ocrError("address")}
              />
              <div className="grid grid-cols-2 gap-5">
                <FleetPostcodeLookup
                  label="Postcode"
                  placeholder="Enter Postcode"
                  postcode={active.postcode || ""}
                  onChange={(v) => patch("postcode", v)}
                  onAddressSelect={(addr) => patchMany({ address: addr.address, postcode: addr.postcode })}
                  error={ocrError("postcode")}
                />
                {/* Garages are landlines (0121 440 4411), which don't fit the
                    +44 mobile mask — use a plain tel input that accepts any UK
                    number (landline or mobile). */}
                <FleetTextInput
                  label="Contact Number"
                  placeholder="Enter Contact Number"
                  inputMode="tel"
                  value={active.contact_number || ""}
                  onChange={(v) => patch("contact_number", v)}
                  error={ocrError("contact_number")}
                />
              </div>
              <div className="grid grid-cols-2 gap-5">
                <FleetTextInput
                  label="Email"
                  placeholder="Enter Email"
                  inputMode="email"
                  value={active.email || ""}
                  onChange={(v) => patch("email", v)}
                  error={ocrError("email")}
                />
                <div />
              </div>
            </section>

            <section className={SECTION}>
              <h3 className={H3}>Servicing Details</h3>
              <div className="grid grid-cols-2 gap-5">
                <FleetDateField
                  label="Service Booked For Date"
                  value={active.service_booked_date || ""}
                  onChange={(v) => patch("service_booked_date", v || null)}
                  error={ocrError("service_booked_date")}
                />
                <FleetTimeSelect
                  label="Service Booked For Time"
                  value={active.service_booked_time || ""}
                  onChange={(v) => patch("service_booked_time", v || null)}
                  error={ocrError("service_booked_time")}
                />
              </div>
              <div className="grid grid-cols-2 gap-5">
                <FleetTextInput
                  label="Serviced At Mileage"
                  placeholder="Enter Mileage"
                  inputMode="numeric"
                  value={active.serviced_at_mileage || ""}
                  onChange={(v) => patch("serviced_at_mileage", digitsOnly(v))}
                  error={ocrError("serviced_at_mileage")}
                />
                <FleetDateField
                  label="Serviced On (date)"
                  value={active.serviced_on || ""}
                  onChange={(v) => patch("serviced_on", v || null)}
                  error={ocrError("serviced_on")}
                />
              </div>
              <div className="grid grid-cols-2 gap-5">
                <div className="flex flex-col gap-1">
                  {/* Calculated as mileage + 10,000, but editable — an amendment
                      is kept even if the serviced mileage changes afterwards. */}
                  <FleetTextInput
                    label="Next Service Due At"
                    placeholder="Enter Mileage"
                    inputMode="numeric"
                    value={active.next_service_due_at || ""}
                    onChange={(v) => patch("next_service_due_at", digitsOnly(v))}
                    error={ocrError("next_service_due_at")}
                    highlight
                  />
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
                </div>
                <div className="h-px bg-neutral-100" />
                {/* Capped + scrollable so the log never grows unbounded. */}
                <div className="max-h-[280px] overflow-y-auto">
                  {/* Newest first (3, 2, 1) regardless of service date; `i` stays
                      the true index into `services` so selection is unaffected. */}
                  {services.map((service, i) => ({ service, i })).reverse().map(({ service, i }) => (
                    <React.Fragment key={service.id}>
                      <div
                        className={`${LOG_GRID} px-4 py-3 items-center text-sm cursor-pointer hover:bg-neutral-50 ${
                          i === activeIndex ? "bg-neutral-50 text-neutral-900" : "text-neutral-700"
                        }`}
                        onClick={() => setActiveIndex(i)}
                      >
                        <span className="pr-2 break-words">{service.garage_name || "—"}</span>
                        <span>{displayDate(service.serviced_on) || "—"}</span>
                        <span>{service.serviced_at_mileage || "—"}</span>
                      </div>
                      <div className="h-px bg-neutral-100" />
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </section>
          </>
        )
      // )
      }

      {deleteTarget && (
        <FleetConfirmModal
          title="Delete Service Invoice"
          message="Are you sure you want to delete this record?"
          confirmLabel="Delete"
          onConfirm={() => {
            const target = deleteTarget;
            setDeleteTarget(null);
            handleDelete(target);
          }}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {deleteDoc && (
        <FleetConfirmModal
          title="Delete Document"
          message={`Are you sure you want to delete "${deleteDoc.filename || "this document"}"?`}
          confirmLabel="Delete"
          onConfirm={confirmDeleteDoc}
          onCancel={() => setDeleteDoc(null)}
        />
      )}
    </div>
  );
};

export default ServicingDetails;
