import { useState, useRef, useEffect, useLayoutEffect } from "react";
import ArrowLeft from '../../../assets/AutoClaim_icon/ArrowLeft.svg'
import ArrowRight from "../../../assets/AutoClaim_icon/ArrowRight.svg";

// --- CONSTANTS ---
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "JAN",
  "FEB",
  "MAR",
  "APR",
  "MAY",
  "JUN",
  "JUL",
  "AUG",
  "SEP",
  "OCT",
  "NOV",
  "DEC",
];

export const CustomDatePicker = ({
  selectedDate,
  onDateSelect,
}: {
  selectedDate: Date;
  onDateSelect: (d: Date) => void;
}) => {
const safeSelectedDate = selectedDate
  ? typeof selectedDate === "string"
    ? new Date(selectedDate)
    : selectedDate
  : new Date();

const [view, setView] = useState<"days" | "months" | "years">("days");

// 2. USE THE SAFE DATE: For your navigation state
const [navDate, setNavDate] = useState(new Date(safeSelectedDate));

const year = navDate.getFullYear();
const month = navDate.getMonth();

// Start year of the 12-year block shown in the year grid (paged by ‹ ›).
const [yearStart, setYearStart] = useState(() =>
  Math.floor(navDate.getFullYear() / 12) * 12,
);
// Open the year grid on the block that contains the currently-navigated year.
const openYears = () => {
  setYearStart(Math.floor(year / 12) * 12);
  setView("years");
};
  // Calendar Math
  const getDaysInMonth = (y: number, m: number) =>
    new Date(y, m + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInPrevMonth = getDaysInMonth(year, month - 1);

  const handleMonthSelect = (mIdx: number) => {
    setNavDate(new Date(year, mIdx, 1));
    setView("days");
  };

  const handleDaySelect = (day: number) => {
    const newDate = new Date(year, month, day);
    onDateSelect(newDate);
  };

  // When the calendar opens, if it's cut off at the bottom (or top) of the
  // viewport, auto-scroll the page/container just enough to reveal it fully —
  // so the user never has to scroll manually. `scroll-mb-6` leaves breathing
  // room below; `block: "nearest"` means it only scrolls when actually needed.
  const rootRef = useRef<HTMLDivElement>(null);
  // Anchor to the field's left by default, but flip to right-aligned when the
  // 384px-wide panel would spill past the right edge of the viewport (e.g. the
  // "To" date-range field sitting near the right of the screen). Measured before
  // paint so there's no visible jump.
  const [alignRight, setAlignRight] = useState(false);
  useLayoutEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const viewportW = window.innerWidth || document.documentElement.clientWidth;
    if (rect.right > viewportW - 8) setAlignRight(true);
  }, []);
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      const el = rootRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const viewportH = window.innerHeight || document.documentElement.clientHeight;
      if (rect.bottom > viewportH || rect.top < 0) {
        el.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    });
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <div
      ref={rootRef}
      className={`absolute top-14 z-50 scroll-mb-6 animate-in fade-in zoom-in-95 duration-200 ${alignRight ? "right-0" : "left-0"}`}
    >
      {view === "days" ? (
        /* --- DAY PICKER VIEW --- */
        <div className="Datepicker w-96 px-10 py-6 bg-white rounded-lg shadow-[4px_4px_4px_4px_rgba(0,0,0,0.08)] flex flex-col items-center gap-6">
          <div className="self-stretch px-2 flex justify-between items-center">
            <button
              onClick={() => setNavDate(new Date(year, month - 1, 1))}
              className="p-2 hover:bg-gray-50 rounded-full"
            >
              <img src={ArrowLeft} alt="" />
            </button>
            <div
              className="cursor-pointer text-gray-900 text-sm font-weight-600 hover:text-blue-500 uppercase transition-colors"
              onClick={() => setView("months")}
            >
              {MONTHS[month]} {year}
            </div>
            <button
              onClick={() => setNavDate(new Date(year, month + 1, 1))}
              className="p-2 hover:bg-gray-50 rounded-full"
            >
              <img src={ArrowRight} alt="" />
            </button>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              {DAYS.map((d) => (
                <div
                  key={d}
                  className="w-8 text-center text-gray-900 text-xs font-weight-600"
                >
                  {d}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-2">
              {/* Previous Month Days (Disabled look) */}
              {[...Array(firstDayOfMonth)].map((_, i) => (
                <div
                  key={`prev-${i}`}
                  className="w-8 h-8 flex items-center justify-center text-gray-200 text-xs font-weight-600"
                >
                  {daysInPrevMonth - (firstDayOfMonth - i - 1)}
                </div>
              ))}
              {/* Current Month Days */}
              {[...Array(getDaysInMonth(year, month))].map((_, i) => {
                const day = i + 1;

                // 3. USE SAFE DATE FOR COMPARISON:
                const isSelected =
                  safeSelectedDate.getDate() === day &&
                  safeSelectedDate.getMonth() === month &&
                  safeSelectedDate.getFullYear() === year;
                return (
                  <button
                    key={day}
                    onClick={() => handleDaySelect(day)}
                    className={`w-8 h-8 rounded text-xs font-weight-600 flex items-center justify-center transition-all
          ${isSelected ? "bg-blue-500 text-white shadow-md" : "text-gray-700 hover:bg-blue-50"}`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ) : view === "years" ? (
        /* --- YEAR PICKER VIEW (fast 12-year grid) --- */
        <div className="Datepickeryear w-96 px-10 py-6 bg-white rounded-lg shadow-[0px_4px_4px_0px_rgba(0,0,0,0.08)] flex flex-col items-center gap-6">
          <div className="self-stretch px-2 flex justify-between items-center">
            <button
              onClick={() => setYearStart((s) => s - 12)}
              className="p-2 hover:bg-gray-50 rounded-full"
            >
              <img src={ArrowLeft} alt="" />
            </button>
            <div className="text-gray-900 text-sm font-weight-600">
              {yearStart} – {yearStart + 11}
            </div>
            <button
              onClick={() => setYearStart((s) => s + 12)}
              className="p-2 hover:bg-gray-50 rounded-full"
            >
              <img src={ArrowRight} alt="" />
            </button>
          </div>
          <div className="grid grid-cols-4 gap-y-4 gap-x-2">
            {Array.from({ length: 12 }, (_, i) => yearStart + i).map((y) => (
              <button
                key={y}
                onClick={() => {
                  setNavDate(new Date(y, month, 1));
                  setView("months");
                }}
                className={`w-16 h-8 rounded text-xs font-weight-600 flex items-center justify-center transition-colors
                  ${year === y ? "bg-blue-500 text-white" : "text-gray-700 hover:bg-blue-50"}`}
              >
                {y}
              </button>
            ))}
          </div>
        </div>
      ) : (
        /* --- MONTH/YEAR PICKER VIEW --- */
        <div className="Datepickeryear w-96 px-10 py-6 bg-white rounded-lg shadow-[0px_4px_4px_0px_rgba(0,0,0,0.08)] flex flex-col items-center gap-6">
          <div className="self-stretch px-2 flex justify-between items-center">
            <button
              onClick={() => setNavDate(new Date(year - 1, month, 1))}
              className="p-2 hover:bg-gray-50 rounded-full"
            >
              <img src={ArrowLeft} alt="" />
            </button>
            <div
              className="cursor-pointer text-gray-900 text-sm font-weight-600 hover:text-blue-500 transition-colors"
              onClick={openYears}
            >
              {year}
            </div>
            <button
              onClick={() => setNavDate(new Date(year + 1, month, 1))}
              className="p-2 hover:bg-gray-50 rounded-full"
            >
              <img src={ArrowRight} alt="" />
            </button>
          </div>
          <div className="grid grid-cols-4 gap-y-4 gap-x-2">
            {MONTHS.map((m, idx) => (
              <button
                key={m}
                onClick={() => handleMonthSelect(idx)}
                className={`w-16 h-8 rounded text-xs font-weight-600 flex items-center justify-center transition-colors
                  ${month === idx ? "bg-blue-500 text-white" : "text-gray-700 hover:bg-blue-50"}`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};