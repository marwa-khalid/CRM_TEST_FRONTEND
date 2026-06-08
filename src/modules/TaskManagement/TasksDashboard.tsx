import React, { useEffect, useState } from "react";
import { listTasks, type TaskFilters } from "../../services/Tasks/Tasks";

// ─── helpers ──────────────────────────────────────────────────────────────────

const formatDate = (value?: string | null): string => {
  if (!value) return "—";
  const [y, m, d] = value.split("-");
  if (!y || !m || !d) return value;
  return `${d}-${m}-${y}`;
};

const daysLabel = (due?: string | null): string => {
  if (!due) return "";
  const d = new Date(due + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.round((d.getTime() - today.getTime()) / 86400000);
  if (diff === 0) return "Today";
  if (diff > 0) return `${diff} Day${diff === 1 ? "" : "s"}`;
  return `${Math.abs(diff)} Day${Math.abs(diff) === 1 ? "" : "s"} ago`;
};

// ─── columns ──────────────────────────────────────────────────────────────────

interface ColumnDef {
  key: string;
  label: string;
  accent: string;   // left-border accent on each card
  accentBg: string; // count badge bg
  filter: TaskFilters;
}

const COLUMNS: ColumnDef[] = [
  { key: "mine", label: "My Tasks", accent: "border-l-blue-400", accentBg: "bg-blue-500", filter: {} },
  { key: "pending", label: "Pending", accent: "border-l-red-400", accentBg: "bg-red-500", filter: { status: "Pending" } },
  { key: "critical", label: "Critical Tasks", accent: "border-l-amber-400", accentBg: "bg-amber-500", filter: { priority: "High" } },
  { key: "followups", label: "Pending Followups", accent: "border-l-emerald-400", accentBg: "bg-emerald-500", filter: { status: "Awaiting Response" } },
];

const TaskCard = ({ t, accent, onClick }: { t: any; accent: string; onClick: () => void }) => (
  <button
    type="button"
    onClick={onClick}
    className={`w-full text-left bg-white rounded-md border border-neutral-200 border-l-4 ${accent} p-3 flex flex-col gap-1 hover:shadow-sm transition`}
  >
    <span className="text-neutral-900 text-sm font-weight-600 line-clamp-1">{t.title}</span>
    <span className="text-neutral-500 text-xs line-clamp-1">
      {t.assigned_user || "Unassigned"}
      {t.claim_reference ? ` · ${t.claim_reference}` : ""}
    </span>
    {t.due_date && (
      <span className="text-neutral-400 text-xs">
        Due: {formatDate(t.due_date)} ({daysLabel(t.due_date)})
      </span>
    )}
  </button>
);

const Column = ({
  col, me, onOpen,
}: { col: ColumnDef; me: string; onOpen: (f: TaskFilters) => void }) => {
  const [items, setItems] = useState<any[]>([]);
  const [count, setCount] = useState(0);
  const filter: TaskFilters = col.key === "mine" && me ? { assigned_user: me } : col.filter;

  useEffect(() => {
    listTasks({ ...filter, page_size: 10 })
      .then(({ data }) => { setItems(data?.items ?? []); setCount(data?.total ?? 0); })
      .catch(() => { setItems([]); setCount(0); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me]);

  return (
    <div className="flex flex-col gap-3 min-w-0">
      <button type="button" onClick={() => onOpen(filter)} className="flex items-center gap-2 text-left">
        <span className={`min-w-[28px] h-7 px-1.5 rounded-full ${col.accentBg} text-white text-sm font-weight-600 flex items-center justify-center`}>
          {count}
        </span>
        <span className="text-neutral-900 text-sm font-weight-600">{col.label}</span>
      </button>
      <div className="flex flex-col gap-3 max-h-[560px] overflow-auto pr-1">
        {items.length === 0 ? (
          <div className="text-neutral-400 text-xs py-6 text-center border border-dashed border-neutral-200 rounded-md">
            No tasks
          </div>
        ) : (
          items.map((t) => (
            <TaskCard key={t.id} t={t} accent={col.accent} onClick={() => onOpen(filter)} />
          ))
        )}
      </div>
    </div>
  );
};

// ─── main ─────────────────────────────────────────────────────────────────────

const TasksDashboard: React.FC<{ onOpen?: (f: TaskFilters) => void }> = ({ onOpen }) => {
  const [me, setMe] = useState("");
  useEffect(() => {
    try {
      const u = JSON.parse(localStorage.getItem("user") || "{}");
      setMe([u.first_name, u.last_name].filter(Boolean).join(" "));
    } catch {
      setMe("");
    }
  }, []);

  const open = (f: TaskFilters) => onOpen?.(f);

  return (
    <>
      <div className="h-20 px-10 py-4 border-b border-neutral-100 flex items-center shrink-0">
        <h1 className="text-neutral-900 text-2xl font-weight-600">Dashboard</h1>
      </div>
      <section className="px-10 py-6 flex-1 overflow-auto font-['Stack_Sans_Headline']">
        <h2 className="text-neutral-900 text-lg font-weight-600 mb-4">Tasks Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
          {COLUMNS.map((col) => (
            <Column key={col.key} col={col} me={me} onOpen={open} />
          ))}
        </div>
      </section>
    </>
  );
};

export default TasksDashboard;
