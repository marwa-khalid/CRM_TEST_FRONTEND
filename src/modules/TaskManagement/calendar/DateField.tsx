import React, { useEffect, useRef, useState } from "react";
import { Calendar as CalendarIcon } from "lucide-react";
import { CustomDatePicker } from "../../Claims/Components/DatePicker";

// Local YYYY-MM-DD (avoids the UTC off-by-one that toISOString can cause).
const toISO = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

// App-standard date field: a 52px box that opens the shared CustomDatePicker in
// a popover (same UX as the other screens), instead of a native date input.
const DateField = ({
  value, onChange, placeholder = "Select date", className = "",
}: {
  value?: string | null;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    if (open) document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  return (
    <div className={`relative ${className}`} ref={ref}>
      <div
        onClick={() => setOpen((o) => !o)}
        className="h-[52px] px-4 bg-white border border-neutral-200 rounded flex items-center justify-between cursor-pointer text-sm hover:border-blue-500"
      >
        <span className={value ? "text-neutral-700" : "text-neutral-400"}>{value || placeholder}</span>
        <CalendarIcon size={16} className="text-neutral-400" />
      </div>
      {open && (
        <div className="absolute top-full left-0 z-[70] mt-1 shadow-xl rounded-lg bg-white">
          <CustomDatePicker
            selectedDate={value ? new Date(value + "T00:00:00") : new Date()}
            onDateSelect={(d: Date) => { onChange(toISO(d)); setOpen(false); }}
          />
        </div>
      )}
    </div>
  );
};

export default DateField;
