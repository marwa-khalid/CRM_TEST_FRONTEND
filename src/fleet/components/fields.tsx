import React from "react";
import ArrowDown from "../assets/icons/ArrowDown.svg";
import Calendar from "../assets/icons/Calendar.svg";
import type { Option } from "../types/hire";

// Fleet-local form primitives, so the module never imports Claims components.
const FIELD_BOX =
  "self-stretch px-5 py-4 bg-white rounded-sm outline outline-1 -outline-offset-1 outline-neutral-200 " +
  "text-base font-light text-neutral-900 placeholder:text-neutral-300 focus:outline-neutral-900 " +
  "disabled:bg-neutral-50 disabled:text-neutral-400 leading-4";

const LABEL = "text-neutral-700 text-sm font-medium font-stack";
const WRAP = "w-full min-w-0 flex flex-col gap-2 font-stack";

// Subtle marker on OCR-auto-filled fields (story: "highlight OCR-filled fields").
const OcrBadge = () => (
  <span className="ml-2 align-middle text-[10px] font-normal px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-500">
    Auto-filled
  </span>
);

const FieldLabel: React.FC<{ text: string; ocrFilled?: boolean }> = ({ text, ocrFilled }) => (
  <span className={`self-stretch ${LABEL}`}>
    {text}
    {ocrFilled && <OcrBadge />}
  </span>
);

interface TextProps {
  label: string;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  disabled?: boolean;
  maxLength?: number;
  inputMode?: "text" | "numeric" | "decimal" | "email" | "tel";
  ocrFilled?: boolean;
}

export const FleetTextInput: React.FC<TextProps> = ({
  label, placeholder, value, onChange, onBlur, disabled, maxLength, inputMode = "text", ocrFilled,
}) => (
  <div className={WRAP}>
    <FieldLabel text={label} ocrFilled={ocrFilled} />
    <input
      type="text"
      inputMode={inputMode}
      value={value}
      maxLength={maxLength}
      disabled={disabled}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
      className={FIELD_BOX}
    />
  </div>
);

interface SelectProps {
  label: string;
  placeholder?: string;
  value: string;
  options: Option[];
  onChange: (v: string) => void;
  onBlur?: () => void;
  disabled?: boolean;
  ocrFilled?: boolean;
}

export const FleetSelect: React.FC<SelectProps> = ({
  label, placeholder = "Select", value, options, onChange, onBlur, disabled, ocrFilled,
}) => (
  <div className={WRAP}>
    <FieldLabel text={label} ocrFilled={ocrFilled} />
    <div className="relative">
      <select
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        className={`${FIELD_BOX} appearance-none w-full pr-10 ${value ? "" : "text-neutral-300"}`}
      >
        <option value="" disabled hidden>{placeholder}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value} className="text-neutral-900">{o.label}</option>
        ))}
      </select>
      <img src={ArrowDown} alt="" className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 w-3" />
    </div>
  </div>
);

interface ReadonlyProps {
  label: string;
  value?: string;
  placeholder?: string;
  icon?: string;
}

export const FleetReadonlyField: React.FC<ReadonlyProps> = ({ label, value, placeholder, icon }) => (
  <div className={WRAP}>
    <FieldLabel text={label} />
    <div className="self-stretch px-5 py-4 bg-white rounded-sm outline outline-1 -outline-offset-1 outline-neutral-200 flex justify-between items-center">
      <span className={`text-base font-light leading-4 ${value ? "text-neutral-900" : "text-neutral-300"}`}>
        {value || placeholder}
      </span>
      {icon && <img src={icon} alt="" className="w-4 h-4" />}
    </div>
  </div>
);

interface DateProps {
  label: string;
  value: string; // yyyy-mm-dd
  onChange: (v: string) => void;
  onBlur?: () => void;
  disabled?: boolean;
  ocrFilled?: boolean;
}

export const FleetDateField: React.FC<DateProps> = ({ label, value, onChange, onBlur, disabled, ocrFilled }) => (
  <div className={WRAP}>
    <FieldLabel text={label} ocrFilled={ocrFilled} />
    <div className="relative">
      <input
        type="date"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        className={`${FIELD_BOX} w-full pr-11 ${value ? "text-neutral-900" : "text-neutral-400"} [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-y-0 [&::-webkit-calendar-picker-indicator]:right-0 [&::-webkit-calendar-picker-indicator]:w-11 [&::-webkit-calendar-picker-indicator]:cursor-pointer`}
      />
      <img src={Calendar} alt="" className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4" />
    </div>
  </div>
);

interface SegmentedProps {
  options: Option[];
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}

// Yes / No / Withdrawn style segmented control (selected = black, Fleet theme).
export const FleetSegmented: React.FC<SegmentedProps> = ({ options, value, onChange, disabled }) => (
  <div className="inline-flex rounded-sm outline outline-1 -outline-offset-1 outline-neutral-200 overflow-hidden font-stack">
    {options.map((o, idx) => {
      const active = value === o.value;
      return (
        <button
          key={o.value}
          type="button"
          disabled={disabled}
          onClick={() => onChange(o.value)}
          className={`px-4 py-2.5 min-w-[84px] text-sm ${
            active ? "bg-neutral-900 text-white" : "bg-white text-neutral-700 hover:bg-neutral-50"
          } ${idx > 0 ? "border-l border-neutral-200" : ""}`}
        >
          {o.label}
        </button>
      );
    })}
  </div>
);

interface YesNoProps {
  value: string; // "yes" | "no"
  onChange: (v: string) => void;
  disabled?: boolean;
}

// Checkbox-style Yes / No single-select (e.g. Privacy Notice Explained to Hirer).
export const FleetYesNo: React.FC<YesNoProps> = ({ value, onChange, disabled }) => (
  <div className="flex items-center gap-6 font-stack">
    {["yes", "no"].map((opt) => {
      const active = value === opt;
      return (
        <button key={opt} type="button" disabled={disabled} onClick={() => onChange(opt)} className="flex items-center gap-2">
          <span
            className={`w-5 h-5 rounded-sm flex items-center justify-center ${
              active ? "bg-neutral-900" : "bg-neutral-200"
            }`}
          >
            {active && <span className="w-2 h-1 border-l-2 border-b-2 border-white -rotate-45 -translate-y-[1px]" />}
          </span>
          <span className="text-black text-sm capitalize">{opt}</span>
        </button>
      );
    })}
  </div>
);
