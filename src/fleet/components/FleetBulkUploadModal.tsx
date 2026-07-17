import React, { useMemo, useRef, useState } from "react";
import RemoveIcon from "../assets/icons/Remove.svg";
import { FleetSelect } from "./fields";
import type { Option } from "../types/hire";
import type { HireDocument } from "../services/hireService";

export interface BulkUploadSection {
  key: string;
  label: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  sections: readonly BulkUploadSection[];
  // Uploads one file under the chosen doc_type. Resolves with the stored doc, or
  // throws so the row is marked failed and stays visible.
  onUpload: (docType: string, file: File) => Promise<HireDocument>;
  // Called once the batch finishes with the docs that uploaded successfully so the
  // parent can merge them into its checklist state.
  onUploaded: (docs: HireDocument[]) => void;
}

type RowStatus = "pending" | "uploading" | "done" | "error";

interface Row {
  id: string;
  file: File;
  docType: string; // "" = unassigned
  status: RowStatus;
  error?: string;
}

const fmtSize = (bytes: number) =>
  bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(0)}KB` : `${(bytes / (1024 * 1024)).toFixed(1)}MB`;

// Ordered filename → section guesses. First rule that hits wins, so the more
// specific patterns (back before front, check-out before check-in) come first.
// The filename is lower-cased with separators flattened to spaces before matching.
const GUESS_RULES: { key: string; test: RegExp }[] = [
  { key: "checklist_dl_back", test: /\bback\b/ },
  { key: "checklist_dl_front", test: /\bfront\b/ },
  { key: "checklist_signed_checkout_sheet", test: /check[\s_-]?out/ },
  { key: "checklist_signed_checkin_sheet", test: /check[\s_-]?in/ },
  { key: "checklist_bank_statement", test: /\bbank\b|statement/ },
  { key: "checklist_utility_bill", test: /utility|council|\bgas\b|electric|\bwater\b|\bbill\b/ },
  { key: "checklist_taxi_badge", test: /taxi|badge|\bphv\b|\bpco\b/ },
  { key: "checklist_customer_insurance", test: /insurance|certificate|\bcover\b/ },
  { key: "checklist_signed_rental_contract", test: /rental|contract|agreement/ },
  // Generic licence with no front/back stated — default to the front slot.
  { key: "checklist_dl_front", test: /licen[cs]e|\bdvla\b|\bdl\b/ },
];

const guessSection = (filename: string, allowed: Set<string>): string => {
  const name = filename.toLowerCase().replace(/\.[^.]+$/, "").replace(/[_\-.]+/g, " ");
  for (const rule of GUESS_RULES) {
    if (allowed.has(rule.key) && rule.test.test(name)) return rule.key;
  }
  return "";
};

let rowSeq = 0;

const FleetBulkUploadModal: React.FC<Props> = ({ open, onClose, sections, onUpload, onUploaded }) => {
  const [rows, setRows] = useState<Row[]>([]);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const allowedKeys = useMemo(() => new Set(sections.map((s) => s.key)), [sections]);
  const sectionOptions: Option[] = useMemo(() => sections.map((s) => ({ label: s.label, value: s.key })), [sections]);
  // Doc-types assigned to more than one still-pending row — surfaced as a soft
  // warning. Kept above the early return so hook order stays stable.
  const dupKeys = useMemo(() => {
    const counts = new Map<string, number>();
    rows.forEach((r) => {
      if (r.status !== "done" && r.docType) counts.set(r.docType, (counts.get(r.docType) || 0) + 1);
    });
    return new Set([...counts.entries()].filter(([, n]) => n > 1).map(([k]) => k));
  }, [rows]);

  if (!open) return null;

  const addFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const next: Row[] = Array.from(files).map((file) => ({
      id: `row-${rowSeq++}`,
      file,
      docType: guessSection(file.name, allowedKeys),
      status: "pending" as RowStatus,
    }));
    setRows((current) => [...current, ...next]);
  };

  const setRowType = (id: string, docType: string) =>
    setRows((current) => current.map((r) => (r.id === id ? { ...r, docType } : r)));

  const removeRow = (id: string) => setRows((current) => current.filter((r) => r.id !== id));

  const close = () => {
    if (uploading) return;
    setRows([]);
    onClose();
  };

  const unassigned = rows.filter((r) => r.status !== "done" && !r.docType).length;
  const pending = rows.filter((r) => r.status !== "done");
  const canUpload = pending.length > 0 && unassigned === 0 && !uploading;

  const handleUploadAll = async () => {
    if (!canUpload) return;
    setUploading(true);
    const uploaded: HireDocument[] = [];
    // Sequential so we never overwhelm the free-tier backend and can report per row.
    for (const row of rows) {
      if (row.status === "done" || !row.docType) continue;
      setRows((current) => current.map((r) => (r.id === row.id ? { ...r, status: "uploading", error: undefined } : r)));
      try {
        const doc = await onUpload(row.docType, row.file);
        uploaded.push(doc);
        setRows((current) => current.map((r) => (r.id === row.id ? { ...r, status: "done" } : r)));
      } catch (e) {
        const msg = e instanceof Error && e.message ? e.message : "Upload failed.";
        setRows((current) => current.map((r) => (r.id === row.id ? { ...r, status: "error", error: msg } : r)));
      }
    }
    setUploading(false);
    if (uploaded.length) onUploaded(uploaded);
    // Close automatically only if everything succeeded; otherwise keep the failed rows visible.
    setRows((current) => {
      const remaining = current.filter((r) => r.status !== "done");
      if (remaining.length === 0) {
        onClose();
        return [];
      }
      return remaining;
    });
  };

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/40 p-4 font-sans-headline">
      <div className="w-[720px] max-w-full max-h-[90vh] bg-white rounded-lg flex flex-col overflow-hidden">
        <div className="px-6 py-4 flex justify-between items-center border-b border-neutral-100 shrink-0">
          <div className="text-neutral-900 text-xl font-semibold">Upload Documents</div>
          <button
            type="button"
            onClick={close}
            disabled={uploading}
            className="text-neutral-400 hover:text-neutral-700 text-xl leading-none disabled:opacity-40 disabled:cursor-not-allowed"
          >
            ×
          </button>
        </div>

        <div className="p-6 flex flex-col gap-4 overflow-y-auto">
          <div
            onClick={() => !uploading && inputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (!uploading) addFiles(e.dataTransfer.files);
            }}
            className={`p-8 rounded-lg border-2 border-dashed border-neutral-200 flex flex-col items-center justify-center gap-2 text-center transition-colors ${
              uploading ? "opacity-60" : "cursor-pointer hover:bg-neutral-50"
            }`}
          >
            <input
              ref={inputRef}
              type="file"
              multiple
              accept=".jpg,.jpeg,.png,.pdf"
              className="hidden"
              onChange={(e) => {
                addFiles(e.target.files);
                e.target.value = "";
              }}
            />
            <div className="text-black text-base font-semibold">Choose files or Drag &amp; Drop here</div>
            <div className="text-neutral-500 text-sm">Upload several at once — JPG, PNG, PDF supported</div>
          </div>

          {rows.length > 0 && (
            <div className="flex flex-col gap-2">
              {rows.map((row) => {
                const conflict = row.docType && dupKeys.has(row.docType);
                return (
                  <div
                    key={row.id}
                    className="p-3 rounded-lg outline outline-1 -outline-offset-1 outline-neutral-200 flex items-center gap-3"
                  >
                    <StatusDot status={row.status} />
                    <div className="min-w-0 flex-1">
                      <div className="text-black text-sm font-medium truncate">{row.file.name}</div>
                      <div className="text-neutral-500 text-xs">
                        {fmtSize(row.file.size)}
                        {row.status === "error" && row.error && (
                          <span className="text-red-500"> · {row.error}</span>
                        )}
                        {conflict && row.status !== "error" && (
                          <span className="text-red-600"> · two files share this section</span>
                        )}
                      </div>
                    </div>
                    <div className="w-[240px] shrink-0">
                      <FleetSelect
                        menuPortal
                        placeholder="Unassigned — pick a section"
                        value={row.docType}
                        options={sectionOptions}
                        onChange={(v) => setRowType(row.id, v)}
                        disabled={uploading || row.status === "done"}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeRow(row.id)}
                      disabled={uploading}
                      title="Remove"
                      className="w-5 h-5 shrink-0 hover:opacity-70 disabled:opacity-40"
                    >
                      <img src={RemoveIcon} alt="" className="w-5 h-5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-neutral-100 flex justify-between items-center gap-4 shrink-0">
          <div className="text-neutral-600 text-sm">
            {pending.length} file{pending.length === 1 ? "" : "s"} to upload
            {unassigned > 0 && <span className="text-red-600"> · {unassigned} need a section</span>}
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={close}
              disabled={uploading}
              className="px-6 py-3 bg-white rounded outline outline-1 -outline-offset-1 outline-black text-neutral-900 text-base font-medium hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleUploadAll}
              disabled={!canUpload}
              className="px-6 py-3 rounded bg-neutral-900 text-white text-base font-medium hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? "Uploading…" : `Upload All${pending.length ? ` (${pending.length})` : ""}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatusDot: React.FC<{ status: RowStatus }> = ({ status }) => {
  if (status === "uploading")
    return <span className="w-4 h-4 shrink-0 rounded-full border-2 border-neutral-200 border-t-neutral-900 animate-spin" aria-hidden />;
  if (status === "done")
    return (
      <span className="w-4 h-4 shrink-0 rounded-full bg-green-500 flex items-center justify-center" aria-hidden>
        <span className="w-2 h-1 border-l-2 border-b-2 border-white -rotate-45 -translate-y-[1px]" />
      </span>
    );
  if (status === "error") return <span className="w-4 h-4 shrink-0 rounded-full bg-red-500" aria-hidden />;
  return <span className="w-4 h-4 shrink-0 rounded-full border-2 border-neutral-300" aria-hidden />;
};

export default FleetBulkUploadModal;
