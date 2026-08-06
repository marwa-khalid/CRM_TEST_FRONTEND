import React, { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import LogoIcon from "../assets/listingpage/Logo.svg";
import CollapseIcon from "../assets/listingpage/GoBack.svg";
import HomeIcon from "../assets/listingpage/home.svg";
import FleetIcon from "../assets/listingpage/fleet.svg";
import TasksIcon from "../assets/listingpage/tasks.svg";
import CalendarIcon from "../assets/listingpage/calendarsidebar.svg";
import ReportsIcon from "../assets/listingpage/reports.svg";
import MapIcon from "../assets/listingpage/map.svg";
import AccountArrows from "../assets/listingpage/doublearrow.svg";

// Best-effort current user for the profile block — real identity from storage /
// the JWT, never a hardcoded name.
const decodeJwt = (token: string): Record<string, unknown> | null => {
  try {
    const payload = token.split(".")[1];
    return JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
  } catch {
    return null;
  }
};

const currentUser = (): { name: string; initials: string } => {
  const ls = (k: string) => localStorage.getItem(k) || "";
  let name =
    ls("user_name") || ls("userName") || ls("name") || ls("fullName") || "";
  let email = ls("email") || ls("pendingLoginEmail") || "";
  if (!name || !email) {
    const claims = decodeJwt(ls("access_token"));
    if (claims) {
      name = name || String(claims.name || claims.full_name || "");
      email = email || String(claims.email || claims.sub || "");
    }
  }
  if (!name && email) {
    name = email
      .split("@")[0]
      .replace(/[._-]+/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }
  if (!name) name = "Account";
  const initials =
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join("") || (email ? email.slice(0, 2).toUpperCase() : "AC");
  return { name, initials };
};

interface NavItem {
  label: string;
  icon: string;
  to?: string;
  end?: boolean;
  onClick?: () => void;
}

const FleetShell: React.FC = () => {
  const navigate = useNavigate();
  const { name, initials } = currentUser();
  // Collapsed = icon-only rail so the page area goes near-full-width. Persisted so
  // it survives navigation between Fleet screens (and reloads).
  const [collapsed, setCollapsed] = useState<boolean>(() => localStorage.getItem("fleetSidebarCollapsed") === "1");
  const toggleCollapsed = () =>
    setCollapsed((c) => {
      const next = !c;
      localStorage.setItem("fleetSidebarCollapsed", next ? "1" : "0");
      return next;
    });

  const items: NavItem[] = [
    { label: "Dashboard", icon: HomeIcon, to: "/fleet/dashboard" },
    { label: "Skyline", icon: FleetIcon, to: "/fleet", end: true },
    { label: "Tasks", icon: TasksIcon, to: "/fleet/tasks" },
    { label: "Calendar", icon: CalendarIcon, to: "/fleet/calendar" },
    { label: "Reports", icon: ReportsIcon, onClick: () => navigate("/dashboard") },
    { label: "Skyline Map", icon: MapIcon, to: "/fleet/map" },
  ];

  const rowBase = `w-full flex items-center gap-3 py-3 text-[15px] leading-none transition-colors ${collapsed ? "justify-center px-0" : "px-5"}`;

  return (
    <div className="min-h-screen bg-white font-sans-headline flex">
      <aside className={`hidden lg:flex ${collapsed ? "w-[76px]" : "w-[242px]"} shrink-0 h-screen sticky top-0 bg-white border-r border-[#eee] flex-col transition-[width] duration-200`}>
        {/* Logo + collapse */}
        <div className={`flex items-center px-5 py-6 ${collapsed ? "justify-center" : "justify-between"}`}>
          {!collapsed && <img src={LogoIcon} alt="Logo" className="h-[31px] w-auto object-contain" />}
          <button type="button" onClick={toggleCollapsed} className="text-neutral-500 hover:text-neutral-700" aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}>
            <img src={CollapseIcon} alt="" className={`w-4 h-4 transition-transform ${collapsed ? "rotate-180" : ""}`} />
          </button>
        </div>
        <div className="border-t border-[#eee]" />

        {/* Nav */}
        <nav className="flex-1 py-6">
          {items.map((item) =>
            item.to ? (
              <NavLink
                key={item.label}
                to={item.to}
                end={item.end}
                title={collapsed ? item.label : undefined}
                className={({ isActive }) =>
                  `${rowBase} ${
                    isActive
                      ? "bg-[#eee] border-l-4 border-black text-black font-medium"
                      : "border-l-4 border-transparent text-[#444] hover:bg-neutral-50"
                  }`
                }
              >
                <img src={item.icon} alt="" className="w-5 h-5 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </NavLink>
            ) : (
              <button
                key={item.label}
                type="button"
                onClick={item.onClick}
                title={collapsed ? item.label : undefined}
                className={`${rowBase} border-l-4 border-transparent text-[#444] hover:bg-neutral-50 text-left`}
              >
                <img src={item.icon} alt="" className="w-5 h-5 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </button>
            ),
          )}
        </nav>

        {/* User profile */}
        <div className={`border-t border-[#eee] flex items-center gap-3 ${collapsed ? "p-4 justify-center" : "p-6 justify-between"}`}>
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-10 h-10 shrink-0 rounded-full bg-black text-white text-sm font-semibold flex items-center justify-center">
              {initials}
            </span>
            {!collapsed && <span className="text-black text-base font-medium truncate">{name}</span>}
          </div>
          {!collapsed && <img src={AccountArrows} alt="" className="w-5 h-5 shrink-0" />}
        </div>
      </aside>

      <div className="flex-1 min-w-0">
        <Outlet />
      </div>
    </div>
  );
};

export default FleetShell;
