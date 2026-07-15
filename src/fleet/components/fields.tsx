import React, { useState, useRef, useEffect } from "react";
import Select from "react-select";
import CreatableSelect from "react-select/creatable";
import type { StylesConfig } from "react-select";
import { useJsApiLoader } from "@react-google-maps/api";
import Calendar from "../assets/icons/Calendar.svg";
import type { Option } from "../types/hire";
import FleetCalendar from "./FleetCalendar";

// Same custom-dropdown behaviour as the Claims ReactSelect, but in Fleet's
// black / white / grey theme (selected = black, hover = light grey).
const fleetSelectStyles: StylesConfig<Option, false> = {
  control: (base, state) => ({
    ...base,
    minHeight: "52px",
    borderRadius: "2px",
    paddingLeft: "8px",
    backgroundColor: state.isDisabled ? "#FAFAFA" : "#fff",
    borderColor: state.isFocused ? "#000000" : "#CCCCCC",
    boxShadow: "none",
    "&:hover": { borderColor: state.isFocused ? "#000000" : "#AAAAAA" },
  }),
  valueContainer: (base) => ({ ...base, padding: "2px 8px" }),
  placeholder: (base) => ({ ...base, color: "#AAAAAA", fontWeight: 300 }),
  singleValue: (base) => ({ ...base, color: "#111111" }),
  input: (base) => ({ ...base, color: "#111111" }),
  indicatorSeparator: () => ({ display: "none" }),
  dropdownIndicator: (base, state) => ({ ...base, color: state.isFocused ? "#000000" : "#888888" }),
  menu: (base) => ({
    ...base,
    borderRadius: "6px",
    overflow: "hidden",
    border: "1px solid #EEEEEE",
    boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
    zIndex: 30,
  }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isSelected ? "#000000" : state.isFocused ? "#EEEEEE" : "#fff",
    color: state.isSelected ? "#ffffff" : "#111111",
    cursor: "pointer",
    "&:active": { backgroundColor: "#000000", color: "#ffffff" },
  }),
};

// Fleet-local form primitives, so the module never imports Claims components.
const FIELD_BOX =
  "w-full self-stretch px-5 py-4 bg-white rounded outline outline-1 -outline-offset-1 outline-neutral-200 " +
  "text-base font-light text-neutral-900 placeholder:text-neutral-300 focus:outline-neutral-900 " +
  "disabled:bg-neutral-50 disabled:text-neutral-400 leading-4";
// Red-outline variant. MUST be a full literal class string (not a runtime .replace of
// FIELD_BOX) or Tailwind's scanner never sees `outline-red-500` and won't generate it.
const FIELD_BOX_ERROR =
  "w-full self-stretch px-5 py-4 bg-white rounded outline outline-1 -outline-offset-1 outline-red-500 " +
  "text-base font-light text-neutral-900 placeholder:text-neutral-300 focus:outline-red-500 " +
  "disabled:bg-neutral-50 disabled:text-neutral-400 leading-4";
// Blue-tinted variant for read-only computed fields. Full literal string (same
// reason as FIELD_BOX_ERROR — the scanner must see the blue classes verbatim).
const FIELD_BOX_HIGHLIGHT =
  "w-full self-stretch px-5 py-4 bg-blue-50 rounded outline outline-1 -outline-offset-1 outline-blue-200 " +
  "text-base font-light text-neutral-900 placeholder:text-neutral-300 focus:outline-blue-400 " +
  "disabled:bg-blue-50 disabled:text-neutral-500 leading-4";

const LABEL = "text-neutral-700 text-sm font-medium font-sans-headline";
const WRAP = "w-full min-w-0 flex flex-col gap-2 font-sans-headline";

const boxClass = (error?: string) => (error ? FIELD_BOX_ERROR : FIELD_BOX);
const FieldError: React.FC<{ error?: string }> = ({ error }) =>
  error ? <span className="text-red-500 text-xs">{error}</span> : null;

const FieldLabel: React.FC<{ text: string }> = ({ text }) => (
  <span className={`self-stretch ${LABEL}`}>{text}</span>
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
  error?: string;
}

export const FleetTextInput: React.FC<TextProps> = ({
  label, placeholder, value, onChange, onBlur, disabled, maxLength, inputMode = "text", error,
}) => (
  <div className={WRAP}>
    <FieldLabel text={label} />
    <input
      type="text"
      inputMode={inputMode}
      value={value}
      maxLength={maxLength}
      disabled={disabled}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
      className={boxClass(error)}
    />
    <FieldError error={error} />
  </div>
);

export const ukMobileDigits = (value: string): string => {
  let digits = String(value || "").replace(/\D/g, "");
  if (digits.startsWith("0044")) digits = digits.slice(4);
  if (digits.startsWith("44")) digits = digits.slice(2);
  if (digits.startsWith("0")) digits = digits.slice(1);
  return digits.slice(0, 10);
};

export const formatUkMobileDisplay = (value: string): string => {
  const digits = ukMobileDigits(value);
  const parts = [digits.slice(0, 4), digits.slice(4, 7), digits.slice(7, 10)].filter(Boolean);
  return parts.join(" ");
};

export const toUkMobileE164 = (value: string): string => {
  const digits = ukMobileDigits(value);
  return digits ? `+44${digits}` : "";
};

export const isValidUkMobile = (value: string): boolean => /^7\d{9}$/.test(ukMobileDigits(value));

interface UkMobileProps {
  label: string;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  disabled?: boolean;
  error?: string;
}

export const FleetUkMobileInput: React.FC<UkMobileProps> = ({
  label,
  placeholder = "7123 456 789",
  value,
  onChange,
  onBlur,
  disabled,
  error,
}) => (
  <div className={WRAP}>
    <FieldLabel text={label} />
    <div
      className={`${boxClass(error)} flex items-center gap-3`}
    >
      <span className="text-neutral-400 text-base font-light leading-4">+44</span>
      <input
        type="text"
        inputMode="tel"
        value={formatUkMobileDisplay(value)}
        disabled={disabled}
        placeholder={placeholder}
        onChange={(e) => onChange(formatUkMobileDisplay(e.target.value))}
        onBlur={onBlur}
        className="min-w-0 flex-1 bg-transparent text-base font-light text-neutral-900 placeholder:text-neutral-300 outline-none leading-4 disabled:text-neutral-400"
      />
    </div>
    <FieldError error={error} />
  </div>
);

// --- Ideal Postcodes lookup (same provider as the Claims side) --------------
// Enter a UK postcode -> pick from the matching addresses -> the address + tidy
// postcode are filled in. Fleet-local (no Claims imports) and in Fleet's theme.
export interface FleetAddressResult {
  address: string; // line1..line3 joined
  postcode: string;
  city: string;
  county: string;
}

interface PostcodeLookupProps {
  label?: string;
  postcode: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  onAddressSelect: (r: FleetAddressResult) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
}

const UK_POSTCODE = /^[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}$/i;

export const FleetPostcodeLookup: React.FC<PostcodeLookupProps> = ({
  label = "Post Code", postcode, onChange, onBlur, onAddressSelect, placeholder = "Enter Post Code to Search", disabled, error,
}) => {
  const [addresses, setAddresses] = useState<FleetAddressResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [lookupError, setLookupError] = useState("");
  const wrapRef = useRef<HTMLDivElement>(null);
  const typing = useRef(false);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  useEffect(() => {
    if (!typing.current) return;
    const pc = postcode.trim();
    if (!UK_POSTCODE.test(pc)) { setAddresses([]); setOpen(false); return; }

    const timer = setTimeout(async () => {
      typing.current = false;
      setLoading(true); setLookupError(""); setAddresses([]);
      try {
        const key = import.meta.env.VITE_IDEAL_POSTCODES_KEY;
        const res = await fetch(`https://api.ideal-postcodes.co.uk/v1/postcodes/${encodeURIComponent(pc)}?api_key=${key}`);
        if (res.status === 404) { setLookupError("No addresses found for this postcode"); setOpen(false); return; }
        if (res.status === 402) { setLookupError("Postcode lookup limit reached — top up your Ideal Postcodes balance"); setOpen(false); return; }
        if (!res.ok) { setLookupError("Address lookup failed"); setOpen(false); return; }
        const data = await res.json();
        const results: FleetAddressResult[] = (data.result || []).map((a: Record<string, string>) => ({
          address: [a.line_1, a.line_2, a.line_3].filter(Boolean).join(", "),
          postcode: a.postcode || pc,
          city: a.post_town || "",
          county: a.county || "",
        }));
        setAddresses(results);
        setOpen(results.length > 0);
        if (results.length === 0) setLookupError("No addresses found for this postcode");
      } catch {
        setLookupError("Address lookup failed");
      } finally {
        setLoading(false);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [postcode]);

  const isOpen = loading || (open && addresses.length > 0);

  return (
    <div className={WRAP}>
      <FieldLabel text={label} />
      <div ref={wrapRef} className="relative">
        <input
          type="text"
          inputMode="text"
          value={postcode}
          disabled={disabled}
          placeholder={placeholder}
          onChange={(e) => { typing.current = true; onChange(e.target.value); setLookupError(""); setOpen(false); }}
          onBlur={onBlur}
          className={boxClass(error)}
        />
        <FieldError error={error} />
        {lookupError && <p className="text-red-500 text-xs mt-1">{lookupError}</p>}
        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded outline outline-1 -outline-offset-1 outline-neutral-200 shadow-lg z-[200] max-h-52 overflow-y-auto">
            {loading && (
              <div className="px-4 py-3 flex items-center gap-2 text-sm text-neutral-400">
                <span className="animate-spin rounded-full h-4 w-4 border-2 border-neutral-200 border-t-neutral-900" />
                Finding addresses…
              </div>
            )}
            {addresses.map((addr, i) => (
              <div
                key={i}
                onClick={() => { onAddressSelect(addr); setOpen(false); }}
                className="px-4 py-2.5 hover:bg-neutral-50 cursor-pointer text-sm text-neutral-700 border-b border-neutral-100 last:border-0"
              >
                {[addr.address, addr.city, addr.postcode].filter(Boolean).join(", ")}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// --- Address autocomplete (same behaviour as the Claims address field) ------
// Type a UK postcode -> Ideal Postcodes address list; type free text -> Google
// Places suggestions. Selecting fills the address AND postcode. Fleet-local (no
// Claims imports), in Fleet's theme. Mirrors claims/common/AddressAutocomplete.
type AddrSuggestion =
  | { type: "postcode"; description: string; address: string; postcode: string }
  | { type: "google"; description: string; place_id: string };

const GOOGLE_LIBRARIES: "places"[] = ["places"];

interface AddressAutocompleteProps {
  label?: string;
  address: string;
  onChange: (v: string) => void;
  onPlaceSelected: (place: { address: string; postcode: string }) => void;
  onBlur?: () => void;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
}

export const FleetAddressAutocomplete: React.FC<AddressAutocompleteProps> = ({
  label = "Address", address, onChange, onPlaceSelected, onBlur, placeholder = "Enter Address", disabled, error,
}) => {
  const [suggestions, setSuggestions] = useState<AddrSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const typing = useRef(false);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAP_KEY,
    libraries: GOOGLE_LIBRARIES,
  });

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  useEffect(() => {
    if (!typing.current) return;
    const input = address.trim();
    if (input.length < 2) { setSuggestions([]); setOpen(false); return; }

    const timer = setTimeout(async () => {
      setLoading(true); setSuggestions([]); setOpen(true);

      if (UK_POSTCODE.test(input)) {
        // Postcode typed into the address field — use Ideal Postcodes.
        try {
          const key = import.meta.env.VITE_IDEAL_POSTCODES_KEY;
          const res = await fetch(`https://api.ideal-postcodes.co.uk/v1/postcodes/${encodeURIComponent(input)}?api_key=${key}`);
          if (res.ok) {
            const data = await res.json();
            const results: AddrSuggestion[] = (data.result || []).map((a: Record<string, string>) => ({
              type: "postcode" as const,
              description: [a.line_1, a.line_2, a.line_3, a.post_town, a.postcode].filter(Boolean).join(", "),
              address: [a.line_1, a.line_2, a.line_3].filter(Boolean).join(", "),
              postcode: a.postcode || input,
            }));
            setSuggestions(results);
            if (results.length === 0) setOpen(false);
          } else {
            setOpen(false);
          }
        } catch {
          setOpen(false);
        }
        setLoading(false);
      } else if (isLoaded) {
        // Free-text address — Google Places predictions (GB only).
        const g = (window as unknown as { google?: typeof google }).google;
        if (!g?.maps?.places?.AutocompleteService) { setLoading(false); return; }
        const service = new g.maps.places.AutocompleteService();
        service.getPlacePredictions(
          { input, componentRestrictions: { country: "gb" } },
          (results, status) => {
            if (status === "OK" && results && results.length > 0) {
              setSuggestions(results.map((r) => ({ type: "google" as const, description: r.description.replace(/, UK$/, ""), place_id: r.place_id })));
            } else {
              setOpen(false);
            }
            setLoading(false);
          },
        );
        return; // loading cleared in the callback
      } else {
        setLoading(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [address, isLoaded]);

  const selectSuggestion = (s: AddrSuggestion) => {
    typing.current = false;
    setSuggestions([]);
    setOpen(false);
    if (s.type === "postcode") {
      onChange(s.address);
      onPlaceSelected({ address: s.address, postcode: s.postcode });
      return;
    }
    // Google Places — fetch details to extract the postcode.
    const g = (window as unknown as { google?: typeof google }).google;
    const service = new g!.maps.places.PlacesService(document.createElement("div"));
    service.getDetails(
      { placeId: s.place_id, fields: ["address_components", "formatted_address"] },
      (place, status) => {
        if (status !== "OK" || !place?.address_components) {
          onChange(s.description);
          onPlaceSelected({ address: s.description, postcode: "" });
          return;
        }
        let postcode = "";
        for (const comp of place.address_components) {
          if (comp.types.includes("postal_code")) { postcode = comp.long_name; break; }
        }
        const addressStr = place.formatted_address?.replace(/, UK$/, "") ?? s.description;
        onChange(addressStr);
        onPlaceSelected({ address: addressStr, postcode });
      },
    );
  };

  const isOpen = open && (loading || suggestions.length > 0);

  return (
    <div className={WRAP}>
      <FieldLabel text={label} />
      <div ref={wrapRef} className="relative">
        <input
          type="text"
          value={address}
          disabled={disabled}
          placeholder={placeholder}
          onChange={(e) => { typing.current = true; onChange(e.target.value); setOpen(false); }}
          onBlur={onBlur}
          className={boxClass(error)}
        />
        <FieldError error={error} />
        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded outline outline-1 -outline-offset-1 outline-neutral-200 shadow-lg z-[200] max-h-52 overflow-y-auto">
            {loading && (
              <div className="px-4 py-3 flex items-center gap-2 text-sm text-neutral-400">
                <span className="animate-spin rounded-full h-4 w-4 border-2 border-neutral-200 border-t-neutral-900" />
                Finding addresses…
              </div>
            )}
            {suggestions.map((s, i) => (
              <div
                key={i}
                onClick={() => selectSuggestion(s)}
                className="px-4 py-2.5 hover:bg-neutral-50 cursor-pointer text-sm text-neutral-700 border-b border-neutral-100 last:border-0"
              >
                {s.description}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Currency input — like the Claims side, formats to two decimals on blur.
// Stores/emits the raw numeric string (no £ symbol) so it round-trips cleanly.
export const formatMoney = (raw: string): string => {
  const n = parseFloat(String(raw).replace(/[^0-9.-]/g, ""));
  return Number.isNaN(n) ? "" : n.toFixed(2);
};

export const FleetMoneyInput: React.FC<Omit<TextProps, "inputMode"> & { highlight?: boolean }> = ({
  label, placeholder = "£", value, onChange, onBlur, disabled, highlight,
}) => (
  <div className={WRAP}>
    <FieldLabel text={label} />
    <div className="relative">
      <span className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-neutral-400 text-base">£</span>
      <input
        type="text"
        inputMode="decimal"
        value={value}
        disabled={disabled}
        placeholder={placeholder === "£" ? "0.00" : placeholder}
        onChange={(e) => onChange(e.target.value.replace(/[^0-9.]/g, ""))}
        onBlur={() => { onChange(formatMoney(value)); onBlur?.(); }}
        className={`${highlight ? FIELD_BOX_HIGHLIGHT : FIELD_BOX} pl-9`}
      />
    </div>
  </div>
);

interface TextAreaProps {
  label: string;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  disabled?: boolean;
  rows?: number;
}

export const FleetTextArea: React.FC<TextAreaProps> = ({
  label, placeholder, value, onChange, onBlur, disabled, rows = 4,
}) => (
  <div className={WRAP}>
    <FieldLabel text={label} />
    <textarea
      value={value}
      rows={rows}
      disabled={disabled}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
      className={`${FIELD_BOX} resize-none min-h-24`}
    />
  </div>
);

// Reusable inline loader for async waits (OCR, hydration, saving).
export const FleetInlineLoader: React.FC<{ text?: string }> = ({ text = "Loading…" }) => (
  <div className="flex items-center gap-3 px-4 py-3 rounded bg-neutral-50 text-neutral-600 text-sm font-sans-headline">
    <span className="w-4 h-4 rounded-full border-2 border-neutral-300 border-t-neutral-900 animate-spin" aria-hidden />
    {text}
  </div>
);

interface SelectProps {
  label?: string;
  placeholder?: string;
  value: string;
  options: Option[];
  onChange: (v: string) => void;
  onBlur?: () => void;
  disabled?: boolean;
  // Render the menu in a body portal (menuPosition fixed) so it isn't clipped when
  // the select sits inside a scrollable/overflow-hidden container like a modal.
  menuPortal?: boolean;
}

export const FleetSelect: React.FC<SelectProps> = ({
  label, placeholder = "Select", value, options, onChange, onBlur, disabled, menuPortal,
}) => (
  <div className={WRAP}>
    {label && <FieldLabel text={label} />}
    <Select<Option, false>
      options={options}
      value={options.find((o) => o.value === value) ?? null}
      onChange={(opt) => onChange(opt ? opt.value : "")}
      onBlur={onBlur}
      isDisabled={disabled}
      placeholder={placeholder}
      styles={menuPortal ? { ...fleetSelectStyles, menuPortal: (base) => ({ ...base, zIndex: 9999 }) } : fleetSelectStyles}
      className="font-sans-headline text-base"
      classNamePrefix="fleet-select"
      menuPlacement="auto"
      menuPortalTarget={menuPortal && typeof document !== "undefined" ? document.body : undefined}
      menuPosition={menuPortal ? "fixed" : "absolute"}
    />
  </div>
);

export const FleetCreatableSelect: React.FC<SelectProps> = ({
  label, placeholder = "Select", value, options, onChange, onBlur, disabled,
}) => {
  const selected = options.find((o) => o.value === value) ?? (value ? { value, label: value } : null);
  return (
    <div className={WRAP}>
      <FieldLabel text={label} />
      <CreatableSelect<Option, false>
        options={options}
        value={selected}
        onChange={(opt) => onChange(opt ? opt.value : "")}
        onCreateOption={(inputValue) => onChange(inputValue.trim())}
        onBlur={onBlur}
        isDisabled={disabled}
        placeholder={placeholder}
        styles={fleetSelectStyles}
        className="font-sans-headline text-base"
        classNamePrefix="fleet-select"
        menuPlacement="auto"
        formatCreateLabel={(inputValue) => `Add "${inputValue}"`}
      />
    </div>
  );
};

// 15-minute time dropdown (00:00 … 23:45) — same idea as the Claims time picker
// (timeIntervals={15}), in Fleet's theme. Value is an "HH:mm" string.
const TIME_OPTIONS: Option[] = Array.from({ length: 24 * 4 }, (_, i) => {
  const t = `${String(Math.floor(i / 4)).padStart(2, "0")}:${String((i % 4) * 15).padStart(2, "0")}`;
  return { value: t, label: t };
});

export const formatTime24 = (value?: string | null): string => {
  const raw = String(value ?? "").trim();
  if (!raw) return "";

  const amPmMatch = raw.match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*([AP]M)$/i);
  if (amPmMatch) {
    let hour = Number(amPmMatch[1]);
    const minute = Number(amPmMatch[2]);
    const meridiem = amPmMatch[3].toUpperCase();
    if (Number.isNaN(hour) || Number.isNaN(minute)) return raw;
    if (meridiem === "PM" && hour < 12) hour += 12;
    if (meridiem === "AM" && hour === 12) hour = 0;
    return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
  }

  const twentyFourMatch = raw.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (twentyFourMatch) {
    const hour = Number(twentyFourMatch[1]);
    const minute = Number(twentyFourMatch[2]);
    if (hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59) {
      return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
    }
  }

  const asDate = new Date(raw);
  if (!Number.isNaN(asDate.getTime())) {
    return `${String(asDate.getHours()).padStart(2, "0")}:${String(asDate.getMinutes()).padStart(2, "0")}`;
  }

  return raw;
};

export const currentTime24 = (): string => {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
};

// Round any "HH:mm" (or Date) to the nearest 15-minute slot so a real value shows.
export const roundToQuarter = (hh: number, mm: number): string => {
  let total = hh * 60 + Math.round(mm / 15) * 15;
  total = ((total % 1440) + 1440) % 1440;
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
};

interface TimeProps {
  label: string;
  value: string; // HH:mm
  onChange: (v: string) => void;
  onBlur?: () => void;
  disabled?: boolean;
  placeholder?: string;
}

export const FleetTimeSelect: React.FC<TimeProps> = ({
  label, value, onChange, onBlur, disabled, placeholder = "Select Time",
}) => (
  <div className={WRAP}>
    <FieldLabel text={label} />
    <Select<Option, false>
      options={TIME_OPTIONS}
      value={TIME_OPTIONS.find((o) => o.value === formatTime24(value)) ?? null}
      onChange={(opt) => onChange(opt ? opt.value : "")}
      onBlur={onBlur}
      isDisabled={disabled}
      placeholder={placeholder}
      styles={fleetSelectStyles}
      className="font-sans-headline text-base"
      classNamePrefix="fleet-select"
      menuPlacement="auto"
      maxMenuHeight={220}
    />
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
    <div className="self-stretch px-5 py-4 bg-white rounded outline outline-1 -outline-offset-1 outline-neutral-200 flex justify-between items-center">
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
  error?: string;
  suffix?: string;
}

export const FleetDateField: React.FC<DateProps> = ({ label, value, onChange, onBlur, disabled, error, suffix }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  // value is "yyyy-mm-dd"; parse at local midnight, save back in local time
  // (sv-SE) to avoid the BST off-by-one day.
  const selected = value ? new Date(`${value}T00:00:00`) : null;

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        onBlur?.();
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open, onBlur]);

  return (
    <div className={WRAP}>
      <FieldLabel text={label} />
      <div className="relative" ref={ref}>
        <button
          type="button"
          disabled={disabled}
          onClick={() => setOpen((o) => !o)}
          className={`${boxClass(error)} w-full pr-11 text-left flex items-center justify-between gap-3 ${selected ? "text-neutral-900" : "text-neutral-300"}`}
        >
          <span>{selected ? selected.toLocaleDateString("en-GB") : "Select Date"}</span>
          {suffix && <span className="mr-4 text-neutral-700 text-sm font-medium leading-4">{suffix}</span>}
        </button>
        <img src={Calendar} alt="" className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4" />
        {open && !disabled && (
          <FleetCalendar
            selectedDate={selected}
            onSelect={(d) => {
              onChange(d.toLocaleDateString("sv-SE"));
              setOpen(false);
              onBlur?.();
            }}
          />
        )}
      </div>
      <FieldError error={error} />
    </div>
  );
};

interface SegmentedProps {
  options: Option[];
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}

// Yes / No / Withdrawn style segmented control (selected = black, Fleet theme).
export const FleetSegmented: React.FC<SegmentedProps> = ({ options, value, onChange, disabled }) => (
  <div className="inline-flex rounded outline outline-1 -outline-offset-1 outline-neutral-200 overflow-hidden font-sans-headline">
    {options.map((o, idx) => {
      const active = value === o.value;
      return (
        <button
          key={o.value}
          type="button"
          disabled={disabled}
          onClick={() => onChange(o.value)}
          className={`px-2 py-2 min-w-[84px] text-sm ${
            active ? "bg-neutral-900 text-white rounded" : "bg-white text-neutral-700 hover:bg-neutral-50"
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
  <div className="flex items-center gap-6 font-sans-headline">
    {["yes", "no"].map((opt) => {
      const active = value === opt;
      return (
        <button key={opt} type="button" disabled={disabled} onClick={() => onChange(opt)} className="flex items-center gap-2">
          <span
            className={`w-5 h-5 rounded flex items-center justify-center ${
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
