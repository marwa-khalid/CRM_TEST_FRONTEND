import React, { useEffect, useRef, useState } from "react";
import Select from "react-select";
import CreatableSelect from "react-select/creatable";
import { toast } from "react-toastify";
import { customStyles, BlueDropdownIndicator, scrollSelectIntoView } from "../Steps/GeneralDetailsForm";
import { CustomDatePicker } from "../Components/DatePicker";
import Vector6 from "../../../assets/AutoClaim_icon/Vector-6.svg";

// 15-minute time options + validators, mirroring the Accident Details "Services Time".
const TIME_OPTIONS = (() => {
  const out: { label: string; value: string }[] = [];
  for (let h = 0; h < 24; h++) for (let m = 0; m < 60; m += 15) {
    const t = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    out.push({ label: t, value: t });
  }
  return out;
})();
const normalizeTime = (value: string): string => {
  if (!value) return "";
  const [hour, minute] = value.split(":");
  const h = Math.min(Math.max(Number(hour || 0), 0), 23);
  const m = Math.min(Math.max(Number(minute || 0), 0), 59);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
};
const isValidTime = (value: string): boolean => /^([01]?\d|2[0-3]):[0-5]\d$/.test(value);

// Shared building blocks for the History "Send Letter" / "Send Email" full-screen
// forms (and the embedded Diary Follow-up). Styling matches the Figma designs.

export const CASE_CORRESPONDENTS = [
  "Client", "Third Party", "Third Party Insurer", "Solicitor", "Engineer", "Other",
];
export const LETTER_TEMPLATES = ["Accident Report Form"];
export const NOTE_CATEGORIES = ["General", "Client", "Liability", "Vehicle", "Payment", "Legal", "Follow-up"];
export const DIARY_ACTIONS = ["Make a Call", "Send Email", "Letter", "SMS", "Other"];
export const CALL_TYPES = [
  "CL - Call to Client",
  "CI - Call to Insurer",
  "CS - Call to Solicitor",
  "CE - Call to Engineer",
  "CTP - Call to Third Party",
  "Other",
];

export const fieldCls =
  "w-full px-5 py-4 rounded-sm outline outline-1 -outline-offset-1 outline-neutral-200 text-base font-light text-neutral-700 placeholder:text-neutral-300 focus:outline-blue-400 bg-white";

export const FieldLabel = ({ children }: { children: React.ReactNode }) => (
  <div className="text-neutral-700 text-sm font-medium">{children}</div>
);

export const LabeledInput = ({
  label, value, onChange, placeholder, type = "text",
}: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) => (
  <label className="self-stretch flex flex-col gap-2">
    <FieldLabel>{label}</FieldLabel>
    <input className={fieldCls} type={type} value={value} placeholder={placeholder || "Value"} onChange={(e) => onChange(e.target.value)} />
  </label>
);

// UK phone helpers: keep only the national significant number (drop +44 / 44 / 0),
// max 10 digits, and group it the mobile way (7123 456789).
export const toUkNational = (raw: string): string => {
  let d = (raw || "").replace(/\D/g, "");
  if (d.startsWith("44")) d = d.slice(2);
  if (d.startsWith("0")) d = d.slice(1);
  return d.slice(0, 10);
};
export const formatUkNational = (d: string): string => (d.length > 4 ? `${d.slice(0, 4)} ${d.slice(4)}` : d);
export const normalizeUkPhone = (raw: string): string => {
  const d = toUkNational(raw);
  return d ? `+44 ${formatUkNational(d)}` : "";
};

// Phone field with a fixed "+44" and live UK masking; stores "+44 7123 456789".
export const LabeledUkPhone = ({
  label, value, onChange,
}: { label: string; value: string; onChange: (v: string) => void }) => {
  const national = toUkNational(value);
  return (
    <div className="self-stretch flex flex-col gap-2">
      <FieldLabel>{label}</FieldLabel>
      <div className="self-stretch px-5 py-4 rounded-sm outline outline-1 -outline-offset-1 outline-neutral-200 bg-white flex items-center gap-2 focus-within:outline-blue-400">
        <span className="text-neutral-500 text-base font-light select-none">+44</span>
        <input
          inputMode="tel"
          className="flex-1 bg-transparent outline-none text-neutral-700 text-base font-light placeholder:text-neutral-300"
          value={formatUkNational(national)}
          placeholder="7123 456789"
          onChange={(e) => {
            const d = toUkNational(e.target.value);
            onChange(d ? `+44 ${formatUkNational(d)}` : "");
          }}
        />
      </div>
    </div>
  );
};

export const LabeledSelect = ({
  label, value, onChange, options, placeholder = "Select",
}: { label: string; value: string; onChange: (v: string) => void; options: string[]; placeholder?: string }) => {
  const opts = options.map((o) => ({ value: o, label: o }));
  return (
    <div className="self-stretch flex flex-col gap-2">
      <FieldLabel>{label}</FieldLabel>
      <Select
        options={opts}
        value={opts.find((o) => o.value === value) || null}
        placeholder={placeholder}
        // Same react-select look as the rest of the Claims forms; portal the menu
        // so it isn't clipped inside the slider's scroll area.
        styles={{ ...customStyles, menuPortal: (base) => ({ ...base, zIndex: 100 }) }}
        menuPlacement="auto"
        menuPortalTarget={typeof document !== "undefined" ? document.body : undefined}
        onMenuOpen={scrollSelectIntoView}
        onChange={(val: any) => onChange(val?.value ?? "")}
        components={{ DropdownIndicator: BlueDropdownIndicator, IndicatorSeparator: () => null }}
      />
    </div>
  );
};

export const LabeledTextArea = ({
  label, value, onChange, placeholder, heightCls = "h-24",
}: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; heightCls?: string }) => (
  <label className="self-stretch flex flex-col gap-2">
    <FieldLabel>{label}</FieldLabel>
    <textarea className={`${fieldCls} ${heightCls} resize-none`} value={value} placeholder={placeholder || "Enter Details"} onChange={(e) => onChange(e.target.value)} />
  </label>
);

// Date field matching the previous screens: clickable box + Vector-6 icon opening
// the shared CustomDatePicker. Saves a local YYYY-MM-DD (no BST day-shift); no
// native browser date input.
export const LabeledDate = ({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    if (open) document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);
  return (
    <div className="self-stretch flex flex-col gap-2" ref={ref}>
      <FieldLabel>{label}</FieldLabel>
      <div className="relative">
        <div
          onClick={() => setOpen((o) => !o)}
          className="self-stretch h-[52px] px-5 bg-white rounded-sm outline outline-1 -outline-offset-1 outline-neutral-200 flex items-center justify-between cursor-pointer"
        >
          <span className={`text-base font-light ${value ? "text-neutral-700" : "text-neutral-300"}`}>{value || "Date"}</span>
          <img src={Vector6} alt="" className="w-4 h-4" />
        </div>
        {open && (
          <div className="absolute top-full left-0 z-[120] mt-1">
            <CustomDatePicker
              selectedDate={value ? new Date(`${value}T00:00:00`) : new Date()}
              onDateSelect={(date: Date) => { onChange(date.toLocaleDateString("sv-SE")); setOpen(false); }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

// Time picker matching the Accident Details "Services Time": 15-min options with
// free typing (validated HH:mm).
export const LabeledTime = ({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) => (
  <div className="self-stretch flex flex-col gap-2">
    <FieldLabel>{label}</FieldLabel>
    <CreatableSelect
      options={TIME_OPTIONS}
      value={value ? { label: value, value } : null}
      onChange={(opt: any) => onChange(opt?.value || "")}
      onCreateOption={(input: string) => {
        if (isValidTime(input)) onChange(normalizeTime(input));
        else toast.error("Please enter time in HH:mm format");
      }}
      placeholder="Select or type time"
      styles={{ ...customStyles, menuPortal: (base: any) => ({ ...base, zIndex: 100 }) }}
      menuPlacement="auto"
      menuPortalTarget={typeof document !== "undefined" ? document.body : undefined}
      onMenuOpen={scrollSelectIntoView}
      components={{ DropdownIndicator: BlueDropdownIndicator, IndicatorSeparator: () => null }}
      isSearchable
    />
  </div>
);

// ── Full-screen form shell (header: icon + title + Send / Close) ─────────────
export const FormShell = ({
  icon, title, saving, onSend, onClose, children, sendLabel = "Send",
}: {
  icon: string; title: string; saving?: boolean; sendLabel?: string;
  onSend: () => void; onClose: () => void; children: React.ReactNode;
}) => (
  <div className="fixed inset-0 z-[80] flex justify-end font-['Stack_Sans_Headline']">
    <div className="flex-1 bg-black/30" onClick={onClose} />
    <div className="w-[50vw] min-w-[560px] max-w-full h-full bg-white overflow-auto flex flex-col shadow-2xl">
      <header className="px-10 py-5 bg-white shadow-[0px_4px_20px_0px_rgba(0,0,0,0.08)] flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-blue-100 rounded-sm flex items-center justify-center shrink-0">
            <img src={icon} alt="" className="w-6 h-6" />
          </div>
          <h1 className="text-black text-2xl font-semibold leading-6">{title}</h1>
        </div>
        <div className="flex items-center gap-3">
          <button type="button" onClick={onSend} disabled={saving} className="px-10 py-4 bg-blue-500 rounded-sm text-white text-base font-medium leading-4 hover:bg-blue-600 disabled:opacity-60 disabled:cursor-not-allowed">
            {saving ? "Sending…" : sendLabel}
          </button>
          <button type="button" onClick={onClose} className="px-10 py-4 rounded-sm outline outline-1 -outline-offset-1 outline-blue-500 text-blue-500 text-base font-medium leading-4 hover:bg-blue-50">
            Close
          </button>
        </div>
      </header>
      <div className="px-10 py-8">{children}</div>
    </div>
  </div>
);

// ── Diary Follow-up (collapsible; embedded in Letter & Email) ─────────────────
export interface DiaryValue {
  action: string;
  assignedUser: string;
  correspondent: string;
  template: string;
  dueDate: string;
  dueTime: string;
  notes: string;
}
export const EMPTY_DIARY: DiaryValue = {
  action: "", assignedUser: "", correspondent: "", template: "", dueDate: "", dueTime: "", notes: "",
};
export const diaryHasContent = (d: DiaryValue): boolean =>
  Boolean(d.action || d.assignedUser || d.correspondent || d.template || d.dueDate || d.dueTime || d.notes.trim());

export const DiaryFollowUp = ({
  open, onToggle, value, onChange, users, correspondentOptions = CASE_CORRESPONDENTS,
}: {
  open: boolean; onToggle: () => void;
  value: DiaryValue; onChange: (v: DiaryValue) => void;
  users: string[]; correspondentOptions?: string[];
}) => {
  const set = (patch: Partial<DiaryValue>) => onChange({ ...value, ...patch });
  return (
    <div className="self-stretch rounded-sm outline outline-1 -outline-offset-1 outline-gray-200 flex flex-col overflow-hidden">
      <button type="button" onClick={onToggle} className="self-stretch px-4 py-3 bg-slate-50 flex justify-between items-center">
        <span className="text-blue-500 text-sm font-medium">+ Add Diary Follow-up</span>
        <span className="text-blue-500 text-xl leading-none">{open ? "−" : "+"}</span>
      </button>
      {open && (
        <div className="p-4 flex flex-col gap-4">
          <LabeledSelect label="Action" value={value.action} onChange={(v) => set({ action: v })} options={DIARY_ACTIONS} />
          <LabeledSelect label="Assigned User" value={value.assignedUser} onChange={(v) => set({ assignedUser: v })} options={users} />
          <LabeledSelect label="Correspondent" value={value.correspondent} onChange={(v) => set({ correspondent: v })} options={correspondentOptions} />
          <LabeledSelect label="Template" value={value.template} onChange={(v) => set({ template: v })} options={LETTER_TEMPLATES} placeholder="No template" />
          <LabeledDate label="Due Date" value={value.dueDate} onChange={(v) => set({ dueDate: v })} />
          <LabeledTime label="Due Time" value={value.dueTime} onChange={(v) => set({ dueTime: v })} />
          <LabeledTextArea label="Notes / Description" value={value.notes} onChange={(v) => set({ notes: v })} placeholder="Enter diary notes..." heightCls="h-20" />
        </div>
      )}
    </div>
  );
};

// Build the diary create-payload from a DiaryValue (used when the panel is filled).
export const diaryRecordFrom = (d: DiaryValue, handler: string, source: string) => ({
  action_type: "diary" as const,
  correspondent: d.correspondent || null,
  handler: handler || null,
  subject: d.action ? `Diary: ${d.action}` : "Diary",
  details: d.notes || null,
  payload: {
    action: d.action,
    assigned_to: d.assignedUser,
    template: d.template,
    due_date: d.dueDate,
    due_time: d.dueTime,
    source,
  },
});

// ── Lightweight rich-text editor (Email body) ────────────────────────────────
export const RichTextEditor = ({
  html, onChange, placeholder,
}: { html: string; onChange: (h: string) => void; placeholder?: string }) => {
  const ref = useRef<HTMLDivElement>(null);
  const inited = useRef(false);
  // Seed the editor once; after that it's uncontrolled so the caret never jumps.
  useEffect(() => {
    if (ref.current && !inited.current) {
      ref.current.innerHTML = html || "";
      inited.current = true;
    }
  }, [html]);
  const cmd = (command: string, arg?: string) => {
    ref.current?.focus();
    // execCommand is deprecated but universally supported for simple rich text.
    document.execCommand(command, false, arg);
    onChange(ref.current?.innerHTML || "");
  };
  const Btn = ({ label, on, title }: { label: string; on: () => void; title: string }) => (
    <button type="button" title={title} onMouseDown={(e) => { e.preventDefault(); on(); }}
      className="w-7 h-7 rounded-sm flex items-center justify-center text-neutral-700 text-xs hover:bg-neutral-200">
      {label}
    </button>
  );
  return (
    <div className="self-stretch flex flex-col">
      <div className="self-stretch px-3 py-2 bg-neutral-100 border-b border-neutral-200 flex items-center gap-2">
        <Btn label="B" title="Bold" on={() => cmd("bold")} />
        <Btn label="I" title="Italic" on={() => cmd("italic")} />
        <Btn label="U" title="Underline" on={() => cmd("underline")} />
        <Btn label="≡" title="Bulleted list" on={() => cmd("insertUnorderedList")} />
        <Btn label="⋮≡" title="Numbered list" on={() => cmd("insertOrderedList")} />
        <Btn label="🔗" title="Insert link" on={() => { const u = window.prompt("Link URL"); if (u) cmd("createLink", u); }} />
      </div>
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onInput={(e) => onChange((e.target as HTMLDivElement).innerHTML)}
        data-placeholder={placeholder || "Compose your email here..."}
        className="self-stretch h-36 overflow-auto px-3.5 py-2.5 rounded-b-sm outline outline-1 -outline-offset-1 outline-neutral-200 text-sm text-neutral-700 leading-5 focus:outline-blue-400 empty:before:content-[attr(data-placeholder)] empty:before:text-neutral-400"
      />
    </div>
  );
};
