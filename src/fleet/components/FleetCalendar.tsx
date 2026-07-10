import { useState, useRef, useEffect } from "react";

// Fleet's own hand-built calendar — same UX as the Claims custom DatePicker
// (day / month / year views with ‹ › nav), but in the black / white / grey
// Fleet theme (selected = black, hover = light grey). No Claims imports.

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

const Chevron = ({ dir }: { dir: "left" | "right" }) => (
  <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-neutral-700" aria-hidden>
    <path
      d={dir === "left" ? "M15 18l-6-6 6-6" : "M9 18l6-6-6-6"}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const FleetCalendar = ({
  selectedDate,
  onSelect,
}: {
  selectedDate: Date | null;
  onSelect: (d: Date) => void;
}) => {
  const safe = selectedDate ?? new Date();
  const [view, setView] = useState<"days" | "months" | "years">("days");
  const [navDate, setNavDate] = useState(new Date(safe));

  const year = navDate.getFullYear();
  const month = navDate.getMonth();

  const [yearStart, setYearStart] = useState(() => Math.floor(year / 12) * 12);
  const openYears = () => {
    setYearStart(Math.floor(year / 12) * 12);
    setView("years");
  };

  const getDaysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInPrevMonth = getDaysInMonth(year, month - 1);

  // Reveal the popup if it opens partly off-screen.
  const rootRef = useRef<HTMLDivElement>(null);
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

  const PANEL =
    "w-80 px-8 py-6 bg-white rounded-lg shadow-[4px_4px_16px_rgba(0,0,0,0.12)] " +
    "outline outline-1 -outline-offset-1 outline-neutral-100 flex flex-col items-center gap-6 font-sans-headline";
  const NAV_BTN = "p-2 hover:bg-neutral-50 rounded-full";
  const CELL = "w-8 h-8 rounded text-xs font-semibold flex items-center justify-center transition-colors";

  return (
    <div ref={rootRef} className="absolute top-14 left-0 z-50 scroll-mb-6">
      {view === "days" ? (
        <div className={PANEL}>
          <div className="self-stretch px-2 flex justify-between items-center">
            <button type="button" onClick={() => setNavDate(new Date(year, month - 1, 1))} className={NAV_BTN}>
              <Chevron dir="left" />
            </button>
            <button
              type="button"
              className="text-neutral-900 text-sm font-semibold hover:text-neutral-500 uppercase transition-colors"
              onClick={() => setView("months")}
            >
              {MONTHS[month]} {year}
            </button>
            <button type="button" onClick={() => setNavDate(new Date(year, month + 1, 1))} className={NAV_BTN}>
              <Chevron dir="right" />
            </button>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              {DAYS.map((d) => (
                <div key={d} className="w-8 text-center text-neutral-900 text-xs font-semibold">
                  {d}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-2">
              {[...Array(firstDayOfMonth)].map((_, i) => (
                <div key={`prev-${i}`} className="w-8 h-8 flex items-center justify-center text-neutral-200 text-xs font-semibold">
                  {daysInPrevMonth - (firstDayOfMonth - i - 1)}
                </div>
              ))}
              {[...Array(getDaysInMonth(year, month))].map((_, i) => {
                const day = i + 1;
                const isSelected =
                  !!selectedDate &&
                  safe.getDate() === day &&
                  safe.getMonth() === month &&
                  safe.getFullYear() === year;
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => onSelect(new Date(year, month, day))}
                    className={`${CELL} ${
                      isSelected ? "bg-neutral-900 text-white shadow-md" : "text-neutral-700 hover:bg-neutral-100"
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ) : view === "years" ? (
        <div className={PANEL}>
          <div className="self-stretch px-2 flex justify-between items-center">
            <button type="button" onClick={() => setYearStart((s) => s - 12)} className={NAV_BTN}>
              <Chevron dir="left" />
            </button>
            <div className="text-neutral-900 text-sm font-semibold">
              {yearStart} – {yearStart + 11}
            </div>
            <button type="button" onClick={() => setYearStart((s) => s + 12)} className={NAV_BTN}>
              <Chevron dir="right" />
            </button>
          </div>
          <div className="grid grid-cols-4 gap-y-4 gap-x-2">
            {Array.from({ length: 12 }, (_, i) => yearStart + i).map((y) => (
              <button
                type="button"
                key={y}
                onClick={() => {
                  setNavDate(new Date(y, month, 1));
                  setView("months");
                }}
                className={`w-16 h-8 rounded text-xs font-semibold flex items-center justify-center transition-colors ${
                  year === y ? "bg-neutral-900 text-white" : "text-neutral-700 hover:bg-neutral-100"
                }`}
              >
                {y}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className={PANEL}>
          <div className="self-stretch px-2 flex justify-between items-center">
            <button type="button" onClick={() => setNavDate(new Date(year - 1, month, 1))} className={NAV_BTN}>
              <Chevron dir="left" />
            </button>
            <button
              type="button"
              className="text-neutral-900 text-sm font-semibold hover:text-neutral-500 transition-colors"
              onClick={openYears}
            >
              {year}
            </button>
            <button type="button" onClick={() => setNavDate(new Date(year + 1, month, 1))} className={NAV_BTN}>
              <Chevron dir="right" />
            </button>
          </div>
          <div className="grid grid-cols-4 gap-y-4 gap-x-2">
            {MONTHS.map((m, idx) => (
              <button
                type="button"
                key={m}
                onClick={() => {
                  setNavDate(new Date(year, idx, 1));
                  setView("days");
                }}
                className={`w-16 h-8 rounded text-xs font-semibold flex items-center justify-center transition-colors ${
                  month === idx ? "bg-neutral-900 text-white" : "text-neutral-700 hover:bg-neutral-100"
                }`}
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

export default FleetCalendar;
