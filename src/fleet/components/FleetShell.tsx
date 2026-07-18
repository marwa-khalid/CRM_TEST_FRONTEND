import React from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { ArrowLeft, CalendarDays, CheckSquare, Files } from "lucide-react";

// Persistent Fleet navigation shell — mirrors the Claims dashboard's left rail,
// but in the Fleet neutral (black / white / grey) theme and with NO Claims
// imports. Wraps the Records / Tasks / Calendar screens via <Outlet/>.
const NAV = [
  { to: "/fleet", label: "Fleet Records", Icon: Files, end: true },
  { to: "/fleet/tasks", label: "Tasks", Icon: CheckSquare, end: false },
  { to: "/fleet/calendar", label: "Calendar", Icon: CalendarDays, end: false },
];

const FleetShell: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-white font-sans-headline lg:flex">
      <aside className="sticky top-0 z-30 w-full border-b border-neutral-100 bg-white lg:w-60 lg:h-screen lg:shrink-0 lg:self-start lg:border-b-0 lg:border-r lg:flex lg:flex-col lg:overflow-y-auto">
        <div className="h-16 lg:h-[88px] px-4 lg:px-6 flex items-center justify-between border-b border-neutral-100">
          <span className="text-neutral-900 text-lg font-semibold">Fleet</span>
          <button
            type="button"
            onClick={() => navigate("/single-signon")}
            className="lg:hidden px-3 py-2 flex items-center gap-2 text-sm text-neutral-600 rounded hover:bg-neutral-50"
          >
            <ArrowLeft size={18} />
            Back to CRM
          </button>
        </div>

        <nav className="flex overflow-x-auto lg:block lg:flex-1 lg:py-4">
          {NAV.map(({ to, label, Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `shrink-0 px-4 lg:px-5 py-3 flex items-center gap-3 text-sm transition-colors border-b-2 lg:border-b-0 lg:border-l-4 lg:w-full ${
                  isActive
                    ? "bg-neutral-100 border-neutral-900 text-neutral-900 font-medium"
                    : "border-transparent text-neutral-600 hover:bg-neutral-50"
                }`
              }
            >
              <Icon size={20} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="hidden lg:block border-t border-neutral-100 p-4">
          <button
            type="button"
            onClick={() => navigate("/single-signon")}
            className="w-full px-3 py-2 flex items-center gap-3 text-sm text-neutral-600 rounded hover:bg-neutral-50"
          >
            <ArrowLeft size={18} />
            Back to CRM
          </button>
        </div>
      </aside>

      <div className="flex-1 min-w-0">
        <Outlet />
      </div>
    </div>
  );
};

export default FleetShell;
