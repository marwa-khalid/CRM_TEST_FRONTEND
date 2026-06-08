import React, { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { listTasks, type TaskFilters } from "../../services/Tasks/Tasks";
import { SpinnerLoader } from "../../components/common/SpinnerLoader";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const toKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

// Event chip colour — overdue is red, otherwise tinted by priority
const chipCls = (priority: string, overdue: boolean): string => {
  if (overdue) return "bg-red-100 text-red-600";
  const p = (priority || "").toLowerCase();
  if (p === "high") return "bg-red-50 text-red-600";
  if (p === "medium") return "bg-amber-50 text-amber-600";
  if (p === "low") return "bg-green-50 text-green-600";
  return "bg-blue-50 text-blue-600";
};

const TasksCalendar: React.FC<{ onOpen?: (f: TaskFilters) => void }> = ({ onOpen }) => {
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const today = new Date();

  // 6-week grid starting on the Sunday on/before the 1st of the month
  const gridStart = useMemo(() => {
    const s = new Date(cursor);
    s.setDate(1 - s.getDay());
    return s;
  }, [cursor]);

  const days = useMemo(
    () =>
      Array.from({ length: 42 }, (_, i) => {
        const d = new Date(gridStart);
        d.setDate(gridStart.getDate() + i);
        return d;
      }),
    [gridStart],
  );

  useEffect(() => {
    setLoading(true);
    listTasks({ due_from: toKey(days[0]), due_to: toKey(days[41]), page_size: 300 })
      .then(({ data }) => setTasks(data?.items ?? []))
      .catch(() => setTasks([]))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gridStart]);

  const byDay = useMemo(() => {
    const m: Record<string, any[]> = {};
    tasks.forEach((t) => {
      if (t.due_date) (m[t.due_date] = m[t.due_date] || []).push(t);
    });
    return m;
  }, [tasks]);

  const move = (delta: number) => {
    const d = new Date(cursor);
    d.setMonth(d.getMonth() + delta);
    setCursor(d);
  };
  const goToday = () => {
    const d = new Date();
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    setCursor(d);
  };

  const openDay = (d: Date) => onOpen?.({ due_from: toKey(d), due_to: toKey(d) });

  return (
    <>
      {/* Header */}
      <div className="h-20 px-10 py-4 border-b border-neutral-100 flex items-center justify-between shrink-0">
        <h1 className="text-neutral-900 text-2xl font-weight-600">Calendar</h1>
      </div>

      <section className="px-10 py-6 flex-1 overflow-auto font-['Stack_Sans_Headline'] relative">
        {loading && <SpinnerLoader />}

        {/* Month navigation */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => move(-1)}
              className="w-9 h-9 rounded border border-neutral-200 flex items-center justify-center text-neutral-600 hover:bg-neutral-50"
            >
              <ChevronLeft size={18} />
            </button>
            <h2 className="text-neutral-900 text-lg font-weight-600 min-w-[180px] text-center">
              {MONTHS[cursor.getMonth()]} {cursor.getFullYear()}
            </h2>
            <button
              type="button"
              onClick={() => move(1)}
              className="w-9 h-9 rounded border border-neutral-200 flex items-center justify-center text-neutral-600 hover:bg-neutral-50"
            >
              <ChevronRight size={18} />
            </button>
          </div>
          <button
            type="button"
            onClick={goToday}
            className="h-9 px-4 rounded border border-blue-500 text-blue-500 text-sm font-weight-500 hover:bg-blue-50"
          >
            Today
          </button>
        </div>

        {/* Month grid */}
        <div className="rounded-lg border border-neutral-200 overflow-hidden">
          {/* weekday headers */}
          <div className="grid grid-cols-7 bg-neutral-50 border-b border-neutral-200">
            {WEEKDAYS.map((w) => (
              <div key={w} className="px-3 py-2 text-xs font-weight-600 text-neutral-500">
                {w}
              </div>
            ))}
          </div>
          {/* day cells */}
          <div className="grid grid-cols-7">
            {days.map((d, i) => {
              const inMonth = d.getMonth() === cursor.getMonth();
              const isToday = sameDay(d, today);
              const dayEvents = byDay[toKey(d)] || [];
              return (
                <div
                  key={i}
                  className={`min-h-[112px] border-b border-r border-neutral-100 p-2 flex flex-col gap-1 ${
                    inMonth ? "bg-white" : "bg-neutral-50/50"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => openDay(d)}
                    className={`self-start w-7 h-7 rounded-full flex items-center justify-center text-sm ${
                      isToday
                        ? "bg-blue-500 text-white font-weight-600"
                        : inMonth
                          ? "text-neutral-700 hover:bg-neutral-100"
                          : "text-neutral-300"
                    }`}
                  >
                    {d.getDate()}
                  </button>
                  <div className="flex flex-col gap-1">
                    {dayEvents.slice(0, 3).map((t) => {
                      const overdue = t.is_overdue && (t.status || "").toLowerCase() !== "completed";
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => openDay(d)}
                          title={t.title}
                          className={`text-left px-1.5 py-0.5 rounded text-[11px] truncate ${chipCls(t.priority, overdue)}`}
                        >
                          {t.due_time ? `${t.due_time} ` : ""}
                          {t.title}
                        </button>
                      );
                    })}
                    {dayEvents.length > 3 && (
                      <button
                        type="button"
                        onClick={() => openDay(d)}
                        className="text-[11px] text-blue-500 px-1.5 text-left hover:underline"
                      >
                        +{dayEvents.length - 3} more
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
};

export default TasksCalendar;
