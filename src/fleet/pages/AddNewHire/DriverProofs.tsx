import React, { useRef, useState } from "react";
import FleetUploadModal from "../../components/FleetUploadModal";
import FleetConfirmModal from "../../components/FleetConfirmModal";
import { useHire } from "./HireContext";
import { uploadHireDocument, deleteHireDocument } from "../../services/hireService";
import { extractDriverDetailsFromLicence, extractProofOfAddress } from "../../services/driverService";
import { FleetInlineLoader } from "../../components/fields";
import TrashIcon from '../../assets/icons/Remove.svg'
import PlusIcon from "../../assets/icons/Plus.svg";
import AlertIcon from "../../assets/icons/Alert.svg";
import CheckCircleIcon from "../../assets/icons/CheckCircle.svg";

type DlKey = "dlFront" | "dlBack";

interface UploadedDoc {
  file: File;
  previewUrl: string | null;
  receivedOn: string;
  docId?: number; // backend id, when persisted
}

// One utility-bill slot. `docType` is stable per slot (never derived from the
// index) so backend persist/delete stay correct even after middle slots are removed.
interface UtilitySlot {
  docType: string;
  doc: UploadedDoc | null;
}

// The current upload/delete can target a utility slot (by index) or a DL card.
type Target = { kind: "utility"; index: number } | { kind: "dl"; key: DlKey };

const DL_LABELS: Record<DlKey, string> = {
  dlFront: "Driving License Front",
  dlBack: "Driving License Back",
};

const ORDINALS = ["First", "Second", "Third", "Fourth", "Fifth", "Sixth", "Seventh", "Eighth", "Ninth", "Tenth"];
const utilLabel = (i: number) => `${ORDINALS[i] || `#${i + 1}`} Utility Bill`;

const receivedToday = () => {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getDate())}-${p(d.getMonth() + 1)}-${String(d.getFullYear()).slice(2)}`;
};

const normalise = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

const UploadPrompt = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-12 h-12 text-neutral-300" aria-hidden>
    <path d="M12 15V4m0 0 4 4m-4-4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const DocumentCard: React.FC<{
  label: string;
  doc: UploadedDoc | null;
  onUploadClick: () => void;
  onRemove: () => void;
}> = ({ label, doc, onUploadClick, onRemove }) => (
  <section className="p-5 rounded-lg outline outline-1 -outline-offset-1 outline-neutral-100 flex flex-col gap-4">
    <div className="flex justify-between items-center">
      <h3 className="text-black text-xl font-semibold leading-5">{label}</h3>
      {doc && (
        <span className="text-black text-sm">
          Received On: {doc.receivedOn}
        </span>
      )}
    </div>
    <div className="h-px bg-neutral-100" />

    {doc ? (
      <div className="flex flex-col items-center gap-4">
        {doc.previewUrl ? (
          <img
            src={doc.previewUrl}
            alt={label}
            className="max-h-72 max-w-full rounded object-contain"
          />
        ) : (
          <div className="px-6 py-8 text-neutral-500 text-sm">
            PDF uploaded — {doc.file.name}
          </div>
        )}
        <div className="h-px bg-neutral-100 w-full" />
        <button
          type="button"
          onClick={onRemove}
          className="h-8 px-3 py-2 self-center bg-white rounded-sm outline outline-1 -outline-offset-1 outline-neutral-900 flex items-center gap-2 text-neutral-900 text-sm hover:bg-neutral-50"
        >
          <img src={TrashIcon} alt="" className="w-4 h-4" />
          Remove
        </button>
      </div>
    ) : (
      <button
        type="button"
        onClick={onUploadClick}
        className="p-6 rounded-lg border-2 border-dashed border-neutral-200 flex flex-col items-center justify-center gap-4 hover:bg-neutral-50 transition-colors"
      >
        <UploadPrompt />
        <div className="flex flex-col items-center gap-1">
          <span className="text-black text-base font-semibold">{label}</span>
          <span className="text-black text-sm">JPG, PNG, PDF Supported</span>
        </div>
      </button>
    )}
  </section>
);

const DriverProofs: React.FC = () => {
  const [utilities, setUtilities] = useState<UtilitySlot[]>([{ docType: "utility_1", doc: null }]);
  const nextUtilId = useRef(2);
  const [dl, setDl] = useState<Record<DlKey, UploadedDoc | null>>({ dlFront: null, dlBack: null });
  const [activeUpload, setActiveUpload] = useState<Target | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Target | null>(null);
  // OCR results driving the licence dates + address comparison.
  const [dlOcr, setDlOcr] = useState({ address: "", postcode: "", start: "", end: "" });
  const [utilOcr, setUtilOcr] = useState({ address: "", postcode: "" });
  const [ocrLoading, setOcrLoading] = useState(false);
  const { hireId } = useHire();

  const makeDoc = (file: File): UploadedDoc => ({
    file,
    previewUrl: file.type.startsWith("image/") ? URL.createObjectURL(file) : null,
    receivedOn: receivedToday(),
  });

  // Store to the backend and return the new doc id — awaited by the upload modal
  // so it stays open until the document is actually persisted.
  const uploadDoc = async (docType: string, file: File): Promise<number | null> => {
    if (!hireId) return null;
    const doc = await uploadHireDocument(hireId, docType, file);
    return doc?.id ?? null;
  };

  const addUtility = () =>
    setUtilities((u) => [...u, { docType: `utility_${nextUtilId.current++}`, doc: null }]);

  const targetLabel = (t: Target) => (t.kind === "utility" ? utilLabel(t.index) : DL_LABELS[t.key]);

  const handleUploaded = async (file: File) => {
    const target = activeUpload;
    if (!target) return;

    if (target.kind === "utility") {
      const i = target.index;
      const docType = utilities[i]?.docType || `utility_${i + 1}`;
      setUtilities((u) => {
        const next = [...u];
        const prev = next[i];
        if (prev?.doc?.previewUrl) URL.revokeObjectURL(prev.doc.previewUrl);
        next[i] = { ...prev, doc: makeDoc(file) };
        return next;
      });
      // The first utility bill drives the address comparison (runs in background).
      if (i === 0) {
        setOcrLoading(true);
        extractProofOfAddress(file)
          .then((d) => setUtilOcr({ address: d.address, postcode: d.postcode }))
          .finally(() => setOcrLoading(false));
      }
      const id = await uploadDoc(docType, file);
      if (id) {
        setUtilities((u) => {
          const n = [...u];
          if (n[i]?.doc) n[i] = { ...n[i], doc: { ...n[i].doc!, docId: id } };
          return n;
        });
      }
      return;
    }

    const key = target.key;
    setDl((prev) => {
      if (prev[key]?.previewUrl) URL.revokeObjectURL(prev[key]!.previewUrl!);
      return { ...prev, [key]: makeDoc(file) };
    });
    if (key === "dlFront") {
      setOcrLoading(true);
      extractDriverDetailsFromLicence(file)
        .then((d) => setDlOcr({ address: d.address, postcode: d.postcode, start: d.licenceStart, end: d.licenceEnd }))
        .finally(() => setOcrLoading(false));
    }
    const id = await uploadDoc(key, file);
    if (id) setDl((prev) => (prev[key] ? { ...prev, [key]: { ...prev[key]!, docId: id } } : prev));
  };

  const doRemove = (target: Target) => {
    if (target.kind === "utility") {
      const i = target.index;
      const slot = utilities[i];
      if (slot?.doc?.docId && hireId) deleteHireDocument(hireId, slot.doc.docId);
      if (slot?.doc?.previewUrl) URL.revokeObjectURL(slot.doc.previewUrl);
      // Keep the "First Utility Bill" card (clear it); remove any extra slot entirely.
      setUtilities((u) => (i === 0 ? u.map((s, idx) => (idx === 0 ? { ...s, doc: null } : s)) : u.filter((_, idx) => idx !== i)));
      if (i === 0) setUtilOcr({ address: "", postcode: "" });
      return;
    }
    const key = target.key;
    const ex = dl[key];
    if (ex?.docId && hireId) deleteHireDocument(hireId, ex.docId);
    if (ex?.previewUrl) URL.revokeObjectURL(ex.previewUrl);
    setDl((prev) => ({ ...prev, [key]: null }));
    if (key === "dlFront") setDlOcr({ address: "", postcode: "", start: "", end: "" });
  };

  const hasUtility = utilities.some((u) => u.doc);
  const showLicenceDates = !!dl.dlFront;
  const showCompare = hasUtility && !!dl.dlFront;
  const dlFull = [dlOcr.address, dlOcr.postcode].filter(Boolean).join(", ");
  const utilFull = [utilOcr.address, utilOcr.postcode].filter(Boolean).join(", ");
  const bothPresent = !!dlFull && !!utilFull;
  const addressesMatch = bothPresent && normalise(dlFull) === normalise(utilFull);

  return (
    <div className="w-full max-w-[788px] flex flex-col gap-6 font-sans-headline">
      <h2 className="text-black text-2xl font-semibold leading-6">
        Driver Proofs &amp; License Checks with Address Match
      </h2>
      {ocrLoading && <FleetInlineLoader text="Reading document…" />}

      {/* Utility bills — First + any added via the CTA below. */}
      {utilities.map((slot, i) => (
        <DocumentCard
          key={slot.docType}
          label={utilLabel(i)}
          doc={slot.doc}
          onUploadClick={() => setActiveUpload({ kind: "utility", index: i })}
          onRemove={() => setDeleteTarget({ kind: "utility", index: i })}
        />
      ))}

      <div className="self-stretch flex flex-col items-center">
        <button
          type="button"
          onClick={addUtility}
          className="h-8 px-3 py-2 rounded-sm outline outline-1 -outline-offset-1 outline-neutral-900 inline-flex justify-center items-center gap-2.5 text-neutral-900 text-sm font-normal leading-4 hover:bg-neutral-50"
        >
          <img src={PlusIcon} alt="" className="w-4 h-4" />
          Add Another Utility Bill
        </button>
      </div>

      {(Object.keys(DL_LABELS) as DlKey[]).map((key) => (
        <DocumentCard
          key={key}
          label={DL_LABELS[key]}
          doc={dl[key]}
          onUploadClick={() => setActiveUpload({ kind: "dl", key })}
          onRemove={() => setDeleteTarget({ kind: "dl", key })}
        />
      ))}

      {showLicenceDates && (
        <section className="p-5 rounded-lg outline outline-1 -outline-offset-1 outline-neutral-100 flex flex-col gap-4">
          <h3 className="text-black text-xl font-semibold leading-5">
            Driving License Start/End
          </h3>
          <div className="h-px bg-neutral-100" />
          <div className="flex flex-col gap-3">
            <div className="text-black text-sm">
              Driving License Start Date :{" "}
              <span className="font-semibold">{dlOcr.start || "—"}</span>
            </div>
            <div className="text-black text-sm">
              Driving License End Date :{" "}
              <span className="font-semibold">{dlOcr.end || "—"}</span>
            </div>
          </div>
        </section>
      )}

      {showCompare && (
        <section className="px-5 py-4 rounded-lg outline outline-1 -outline-offset-1 outline-neutral-100 flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <h3 className="text-black text-xl font-semibold leading-5">
              Compare Address
            </h3>
            {!bothPresent ? (
              <div className="p-2 bg-neutral-100 rounded-sm flex items-center gap-2 text-neutral-600 text-sm">
                Reading…
              </div>
            ) : addressesMatch ? (
              <div className="p-2 bg-green-100 rounded-sm flex items-center gap-2.5 text-black text-sm">
                <img src={CheckCircleIcon} alt="" className="w-5 h-5" />
                Matched
              </div>
            ) : (
              <div className="p-2 bg-red-100 rounded-sm flex items-center gap-2 text-black text-sm">
                <img src={AlertIcon} alt="" className="w-5 h-5" />
                Mismatch
              </div>
            )}
          </div>
          {bothPresent &&
            (addressesMatch ? (
              <div className="px-4 py-2 bg-green-100 rounded-sm text-neutral-700 text-sm">
                Address matched between Driving Licence and Utility Bill
              </div>
            ) : (
              <div className="px-4 py-2 bg-red-100 rounded-sm text-neutral-700 text-sm">
                Address does not match between Driving Licence and Utility Bill
              </div>
            ))}
          <div className="flex items-start gap-6">
            <div className="flex-1 p-5 rounded-lg outline outline-1 -outline-offset-1 outline-neutral-100 flex flex-col gap-3">
              <div className="text-black text-base font-semibold">
                Driving License Address
              </div>
              <div className="text-black text-sm">
                {dlFull || "Not detected"}
              </div>
            </div>
            <div className="flex-1 p-5 rounded-lg outline outline-1 -outline-offset-1 outline-neutral-100 flex flex-col gap-3">
              <div className="text-black text-base font-semibold">
                Utility Bill Address
              </div>
              <div className="text-black text-sm">
                {utilFull || "Not detected"}
              </div>
            </div>
          </div>
        </section>
      )}

      <FleetUploadModal
        open={activeUpload !== null}
        onClose={() => setActiveUpload(null)}
        onUploaded={handleUploaded}
        title={activeUpload ? targetLabel(activeUpload) : "Upload Document"}
      />

      {deleteTarget && (
        <FleetConfirmModal
          title="Delete Document"
          message={`Are you sure you want to delete ${targetLabel(deleteTarget)}?`}
          confirmLabel="Delete"
          onConfirm={() => {
            doRemove(deleteTarget);
            setDeleteTarget(null);
          }}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
};

export default DriverProofs;
