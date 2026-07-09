import React, { useState } from "react";
import FleetUploadModal from "../../components/FleetUploadModal";
import { useHire } from "./HireContext";
import { uploadHireDocument, deleteHireDocument } from "../../services/hireService";

type DocKey = "firstUtility" | "secondUtility" | "dlFront" | "dlBack";

interface UploadedDoc {
  file: File;
  previewUrl: string | null;
  receivedOn: string;
  docId?: number; // backend id, when persisted
}

const DOC_LABELS: Record<DocKey, string> = {
  firstUtility: "First Utility Bill",
  secondUtility: "Second Utility Bill",
  dlFront: "Driving License Front",
  dlBack: "Driving License Back",
};

const receivedToday = () => {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getDate())}-${p(d.getMonth() + 1)}-${String(d.getFullYear()).slice(2)}`;
};

// TODO (backend/OCR): these come from OCR of the uploaded documents.
const OCR_DL_ADDRESS = "10 Downing Street, London, SW1A 2AA";
const OCR_UTILITY_ADDRESS = "9 Anderson Drive, Aberdeen, AB15 4ST";
const OCR_DL_START = "20-06-2012";
const OCR_DL_END = "19-06-2022";
const normalise = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

const UploadPrompt = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-12 h-12 text-neutral-300" aria-hidden>
    <path d="M12 15V4m0 0 4 4m-4-4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const TrashIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" aria-hidden>
    <path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m2 0v12a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const AlertIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-red-500" aria-hidden>
    <path d="M12 9v4m0 4h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
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
      {doc && <span className="text-black text-sm">Received On: {doc.receivedOn}</span>}
    </div>
    <div className="h-px bg-neutral-100" />

    {doc ? (
      <div className="flex flex-col items-center gap-4">
        {doc.previewUrl ? (
          <img src={doc.previewUrl} alt={label} className="max-h-72 max-w-full rounded object-contain" />
        ) : (
          <div className="px-6 py-8 text-neutral-500 text-sm">PDF uploaded — {doc.file.name}</div>
        )}
        <div className="h-px bg-neutral-100 w-full" />
        <button
          type="button"
          onClick={onRemove}
          className="h-8 px-3 py-2 self-center bg-white rounded-sm outline outline-1 -outline-offset-1 outline-neutral-900 flex items-center gap-2 text-neutral-900 text-sm hover:bg-neutral-50"
        >
          <TrashIcon />
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
  const [docs, setDocs] = useState<Record<DocKey, UploadedDoc | null>>({
    firstUtility: null,
    secondUtility: null,
    dlFront: null,
    dlBack: null,
  });
  const [activeDoc, setActiveDoc] = useState<DocKey | null>(null);
  const { hireId } = useHire();

  const openUpload = (key: DocKey) => {
    setActiveDoc(key);
  };

  const handleUploaded = (file: File) => {
    if (!activeDoc) return;
    const key = activeDoc;
    setDocs((prev) => {
      const existing = prev[key];
      if (existing?.previewUrl) URL.revokeObjectURL(existing.previewUrl);
      return {
        ...prev,
        [key]: {
          file,
          previewUrl: file.type.startsWith("image/") ? URL.createObjectURL(file) : null,
          receivedOn: receivedToday(),
        },
      };
    });
    setActiveDoc(null);

    // Persist to backend (best-effort); keep the returned id for later delete.
    if (hireId) {
      uploadHireDocument(hireId, key, file).then((doc) => {
        if (doc?.id) {
          setDocs((prev) => (prev[key] ? { ...prev, [key]: { ...prev[key]!, docId: doc.id } } : prev));
        }
      });
    }
  };

  const removeDoc = (key: DocKey) => {
    const existing = docs[key];
    if (existing?.docId && hireId) deleteHireDocument(hireId, existing.docId);
    setDocs((prev) => {
      const ex = prev[key];
      if (ex?.previewUrl) URL.revokeObjectURL(ex.previewUrl);
      return { ...prev, [key]: null };
    });
  };

  const hasUtility = !!(docs.firstUtility || docs.secondUtility);
  const showLicenceDates = !!docs.dlFront;
  const showCompare = hasUtility && !!docs.dlFront;
  const addressesMatch = normalise(OCR_DL_ADDRESS) === normalise(OCR_UTILITY_ADDRESS);

  return (
    <div className="w-full max-w-[788px] flex flex-col gap-6 font-['Stack_Sans_Headline']">
      <h2 className="text-black text-2xl font-semibold leading-6">
        Driver Proofs &amp; License Checks with Address Match
      </h2>

      {(Object.keys(DOC_LABELS) as DocKey[]).map((key) => (
        <DocumentCard
          key={key}
          label={DOC_LABELS[key]}
          doc={docs[key]}
          onUploadClick={() => openUpload(key)}
          onRemove={() => removeDoc(key)}
        />
      ))}

      {showLicenceDates && (
        <section className="p-5 rounded-lg outline outline-1 -outline-offset-1 outline-neutral-100 flex flex-col gap-4">
          <h3 className="text-black text-xl font-semibold leading-5">Driving License Start/End</h3>
          <div className="h-px bg-neutral-100" />
          <div className="flex flex-col gap-3">
            <div className="text-black text-sm">
              Driving License Start Date : <span className="font-semibold">{OCR_DL_START}</span>
            </div>
            <div className="text-black text-sm">
              Driving License End Date : <span className="font-semibold">{OCR_DL_END}</span>
            </div>
          </div>
        </section>
      )}

      {showCompare && (
        <section className="px-5 py-4 rounded-lg outline outline-1 -outline-offset-1 outline-neutral-100 flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <h3 className="text-black text-xl font-semibold leading-5">Compare Address</h3>
            {addressesMatch ? (
              <div className="p-2 bg-green-100 rounded-sm flex items-center gap-2 text-black text-sm">Match</div>
            ) : (
              <div className="p-2 bg-red-100 rounded-sm flex items-center gap-2 text-black text-sm">
                <AlertIcon />
                Mismatch
              </div>
            )}
          </div>
          {!addressesMatch && (
            <div className="px-4 py-2 bg-red-100 rounded-sm text-neutral-700 text-sm">
              Address does not match between Driving Licence and Utility Bill
            </div>
          )}
          <div className="flex items-start gap-6">
            <div className="flex-1 p-5 rounded-lg outline outline-1 -outline-offset-1 outline-neutral-100 flex flex-col gap-3">
              <div className="text-black text-base font-semibold">Driving License Address</div>
              <div className="text-black text-sm">{OCR_DL_ADDRESS}</div>
            </div>
            <div className="flex-1 p-5 rounded-lg outline outline-1 -outline-offset-1 outline-neutral-100 flex flex-col gap-3">
              <div className="text-black text-base font-semibold">Utility Bill Address</div>
              <div className="text-black text-sm">{OCR_UTILITY_ADDRESS}</div>
            </div>
          </div>
        </section>
      )}

      <FleetUploadModal
        open={activeDoc !== null}
        onClose={() => setActiveDoc(null)}
        onUploaded={handleUploaded}
        title={activeDoc ? DOC_LABELS[activeDoc] : "Upload Document"}
      />
    </div>
  );
};

export default DriverProofs;
