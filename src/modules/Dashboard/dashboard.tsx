import AccountSettingsContent from "./AccountSettings";
import React, { useEffect, useMemo, useState } from "react";
import {
  LayoutDashboard,
  FileText,
  Briefcase,
  Calendar,
  CheckSquare,
  BarChart3,
  Settings,
  HelpCircle,
  Search,
  MoreVertical,
  Bell,
  Clock3,
  Hourglass,
  CheckCircle2,
  AlertCircle,
  Upload,
  ChevronDown,
  ClipboardList,
} from "lucide-react";
import Logo from "../../assets/AutoClaim_icon/logo.svg";
import logout from "../../assets/AutoClaim_icon/logout.svg";
import Vector4 from "../../assets/AutoClaim_icon/Vector-4.svg";
import FileIcon from '../../assets/case_activity/file.svg'

import { Link, useNavigate } from "react-router-dom";
import { getClaims } from "../../services/Claims/Claims";
import Tasks from "../TaskManagement/Tasks";
import { useCurrentUser } from "../../context/AuthContext";
import TasksDashboard from "../TaskManagement/TasksDashboard";
import TasksCalendar from "../TaskManagement/TasksCalendar";
import type { TaskFilters } from "../../services/Tasks/Tasks";

type ActivePage = "claims" | "settings" | "tasks" | "dashboard" | "calendar";

const CASE_ACTIVITY_ROUTE = "/case-activity";
const DOCUMENT_LIBRARY_ROUTE = "/document-library";

const Dashboard: React.FC = () => {
  const { user: authUser } = useCurrentUser();
  const navigate = useNavigate();

  const [activePage, setActivePage] = useState<ActivePage>("claims");
  const [taskFilter, setTaskFilter] = useState<TaskFilters | undefined>(undefined);
  const [claims, setClaims] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 10;

  const sidebarItems = [
    { name: "Dashboard", icon: LayoutDashboard },
    { name: "Claims", icon: FileText },
    { name: "Cases", icon: Briefcase },
    { name: "Tasks", icon: CheckSquare },
    { name: "Calendar", icon: Calendar },
    { name: "Reports", icon: BarChart3 },
  ];

  const fallbackClaims = [
    {
      client: "Olivia Rhye",
      claimNo: "ACC-2024-001",
      type: "Vehicle damage",
      date: "Jan 13, 2025",
      assigned: "John Smith",
      status: "PENDING",
      priority: "HIGH",
    },
    {
      client: "Olivia Rhye",
      claimNo: "ACC-2024-001",
      type: "Vehicle damage",
      date: "Jan 13, 2025",
      assigned: "John Smith",
      status: "PENDING",
      priority: "HIGH",
    },
    {
      client: "Liam Johnson",
      claimNo: "ACC-2024-002",
      type: "Property damage",
      date: "Jan 15, 2025",
      assigned: "Emily Davis",
      status: "APPROVED",
      priority: "HIGH",
    },
    {
      client: "Sophia Lee",
      claimNo: "ACC-2024-003",
      type: "Injury claim",
      date: "Jan 20, 2025",
      assigned: "Michael Brown",
      status: "PROCESSING",
      priority: "HIGH",
    },
  ];

  useEffect(() => {
    const fetchClaims = async () => {
      try {
        const res = await getClaims();

        if (Array.isArray(res)) {
          setClaims(res);
          return;
        }

        if (Array.isArray(res?.data)) {
          setClaims(res.data);
          return;
        }

        if (Array.isArray(res?.items)) {
          setClaims(res.items);
          return;
        }

        setClaims([]);
      } catch (error) {
        console.error("Failed to fetch claims:", error);
        setClaims([]);
      }
    };

    fetchClaims();
  }, []);

  const normalizeClaim = (claim: any) => {
    return {
      ...claim,
      client: claim.client_name || "—",
      claimNo: claim.our_reference || claim.claim_no || claim.claim_number || "—",
      type: claim.actual_category || claim.claim_type || claim.type || "—",
      date: formatDate(claim.incident_date || claim.accident_date || claim.date),
      assigned: claim.handler || claim.assigned_to || claim.handler_name || "—",
      status: claim.case_status || claim.status || "—",
      priority: claim.priority || "—",
    };
  };

  const tableRows = useMemo(() => {
    return claims.map((claim) => normalizeClaim(claim));
  }, [claims]);

  const filteredRows = useMemo(() => {
    const query = searchQuery.toLowerCase();

    if (!query) return tableRows;

    return tableRows.filter((claim) =>
      [claim.client, claim.claimNo, claim.type, claim.assigned, claim.status, claim.priority]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query)),
    );
  }, [tableRows, searchQuery]);

  const highCount = claims.filter((c) => c.priority === "High").length;
  const mediumCount = claims.filter((c) => c.priority === "Medium").length;
  const lowCount = claims.filter((c) => c.priority === "Low").length;
  const totalClaims = claims.length;

  const stats = [
    {
      title: "Total Claims",
      value: totalClaims,
      change: "",
      trend: "up",
      icon: ClipboardList,
      iconBg: "bg-blue-100",
      iconColor: "text-blue-700",
    },
    {
      title: "High Priority",
      value: highCount,
      change: "",
      trend: "up",
      icon: AlertCircle,
      iconBg: "bg-red-100",
      iconColor: "text-red-500",
    },
    {
      title: "Medium Priority",
      value: mediumCount,
      change: "",
      trend: "down",
      icon: Hourglass,
      iconBg: "bg-yellow-100",
      iconColor: "text-yellow-500",
    },
    {
      title: "Low Priority",
      value: lowCount,
      change: "",
      trend: "down",
      icon: CheckCircle2,
      iconBg: "bg-green-100",
      iconColor: "text-green-500",
    },
    {
      title: "Active Claims",
      value: totalClaims,
      change: "",
      trend: "up",
      icon: Clock3,
      iconBg: "bg-blue-100",
      iconColor: "text-blue-500",
    },
  ];

  const handleSidebarClick = (name: string) => {
    if (name === "Claims") {
      setActivePage("claims");
    } else if (name === "Tasks") {
      setActivePage("tasks");
    } else if (name === "Dashboard") {
      setActivePage("dashboard");
    } else if (name === "Calendar") {
      setActivePage("calendar");
    }
  };

  // Open the Tasks screen pre-filtered (used by the Dashboard task columns)
  const goToTasks = (filter?: TaskFilters) => {
    setTaskFilter(filter);
    setActivePage("tasks");
  };

  return (
    <div className="flex min-h-screen bg-white font-['Stack_Sans_Headline']">
      <aside className="w-60 border-r border-neutral-100 flex flex-col shrink-0 bg-white">
        <div className="h-16 px-5 py-6 flex justify-between items-center border-b border-neutral-100">
          <img src={Logo} alt="Logo" className="w-8 h-8 object-contain" />
          <img src={logout} alt="" />
        </div>

        <nav className="flex-1 py-6">
          {sidebarItems.map((item) => {
            const isSelected =
              (item.name === "Claims" && activePage === "claims") ||
              (item.name === "Tasks" && activePage === "tasks") ||
              (item.name === "Dashboard" && activePage === "dashboard") ||
              (item.name === "Calendar" && activePage === "calendar");

            return (
              <button
                key={item.name}
                type="button"
                onClick={() => handleSidebarClick(item.name)}
                className={`w-full px-5 py-3 flex items-center gap-3 text-sm transition-colors ${
                  isSelected
                    ? "bg-blue-100 border-l-4 border-blue-300 text-blue-700"
                    : "border-l-4 border-transparent text-neutral-700 hover:bg-neutral-50"
                }`}
              >
                <item.icon size={20} />
                <span className="font-weight-400">{item.name}</span>
              </button>
            );
          })}

          <div className="px-4 pt-4 pb-1">
            <span className="text-neutral-500 text-xs font-weight-600">
              PLATFORM
            </span>
          </div>

          <button
            type="button"
            onClick={() => setActivePage("settings")}
            className={`w-full px-5 py-3 flex items-center gap-3 text-sm transition-colors ${
              activePage === "settings"
                ? "bg-blue-100 border-l-4 border-blue-300 text-blue-700"
                : "border-l-4 border-transparent text-neutral-700 hover:bg-neutral-50"
            }`}
          >
            <Settings size={20} />
            <span className="font-weight-400">Settings</span>
          </button>

          <button
            type="button"
            className="w-full px-5 py-3 flex items-center gap-3 text-sm border-l-4 border-transparent text-neutral-700 hover:bg-neutral-50"
          >
            <HelpCircle size={20} />
            <span className="font-weight-400">Help</span>
          </button>
        </nav>

        <div className="border-t border-neutral-100 p-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-weight-600">
              {(authUser?.name || "?").charAt(0).toUpperCase()}
            </div>
            <span className="text-black text-base font-weight-500">
              {authUser?.name || "User"}
            </span>
          </div>
          <div className="text-neutral-300 text-sm">↕</div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        {activePage === "claims" && (
          <>
            <div className="h-20 px-10 py-4 border-b border-neutral-100 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <h1 className="text-neutral-900 text-2xl font-weight-600 leading-6">
                  Claims
                </h1>

                <div
                  className="ActivityLogContainer flex justify-start items-center gap-1 cursor-pointer group"
                  onClick={() => navigate("/case-activity?scope=all")}
                >
                  <img src={Vector4} alt="" />
                  <div className="ActivityLogText text-blue-300 text-xs font-weight-600 font-['Stack_Sans_Headline'] group-hover:underline">
                    View Activity Log
                  </div>
                </div>
                <div
                  className="ActivityLogContainer flex justify-start items-center gap-1 cursor-pointer group"
                  onClick={() => navigate("/document-library?scope=all")}
                >
                  <img src={FileIcon} alt="" />
                  <div className="ActivityLogText text-blue-300 text-xs font-weight-600 font-['Stack_Sans_Headline'] group-hover:underline">
                    Documents Library
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-6 text-neutral-500">
                <Search size={20} />
                <Bell size={20} />
              </div>
            </div>

            <section className="px-10 py-6 flex-1 overflow-auto">
              <div className="grid grid-cols-5 gap-4 mb-10">
                {stats.map((stat) => (
                  <StatCard key={stat.title} {...stat} />
                ))}
              </div>

              <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center">
                  <div className="w-[491px] px-5 py-4 bg-white rounded outline outline-1 outline-offset-[-1px] outline-neutral-200 flex items-center">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                      placeholder="Claim number / Client / Assigned to"
                      className="w-full outline-none text-base font-light text-neutral-700 placeholder:text-neutral-300"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => navigate("/add-claim")}
                      className="px-10 py-4 bg-blue-500 rounded flex justify-center items-center gap-2.5 text-white text-base font-weight-500 leading-4 hover:bg-blue-600 transition"
                    >
                      Add Claim
                    </button>

                    <button
                      type="button"
                      className="px-6 py-4 bg-white rounded outline outline-1 outline-offset-[-1px] outline-blue-500 flex justify-center items-center gap-2.5 text-blue-500 text-base font-weight-500 leading-4 hover:bg-blue-50 transition"
                    >
                      <Upload size={16} />
                      Export
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-4">
                    {["Claim Type", "Status", "Priority"].map((filter) => (
                      <button
                        key={filter}
                        type="button"
                        className="h-11 p-4 rounded flex items-center gap-3 text-blue-500 text-sm font-weight-400 leading-4 hover:bg-blue-50 transition"
                      >
                        {filter}
                        <ChevronDown size={14} />
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-neutral-700 text-sm font-weight-400">
                      Date Range
                    </span>

                    <DateBox label="From" />
                    <DateBox label="To" />
                  </div>
                </div>

                <div className="rounded-lg outline outline-1 outline-neutral-100 overflow-hidden">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="h-12 bg-neutral-100">
                        <TableHeader className="w-10">
                          <div className="w-5 h-5 bg-neutral-300 rounded" />
                        </TableHeader>
                        <TableHeader>CLIENT</TableHeader>
                        <TableHeader>CLAIM NO.</TableHeader>
                        <TableHeader>TYPE</TableHeader>
                        <TableHeader>INCIDENT DATE</TableHeader>
                        <TableHeader>ASSIGNED TO</TableHeader>
                        <TableHeader>STATUS</TableHeader>
                        <TableHeader>PRIORITY</TableHeader>
                        <TableHeader className="w-10" />
                      </tr>
                    </thead>

                    <tbody>
                      {filteredRows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE).map((claim, index) => (
                        <tr
                          key={`${claim.claimNo}-${index}`}
                          className="border-b border-neutral-100 last:border-b-0 hover:bg-neutral-50 transition cursor-pointer"
                          onClick={() => {
                            navigate(claim.claim_id ? `/add-claim/${claim.claim_id}` : "/add-claim");
                          }}
                        >
                          <TableCell className="w-10">
                            <div className="w-5 h-5 bg-neutral-300 rounded" />
                          </TableCell>

                          <TableCell>{claim.client}</TableCell>
                          <TableCell>{claim.claimNo}</TableCell>
                          <TableCell>{claim.type}</TableCell>
                          <TableCell>{claim.date}</TableCell>
                          <TableCell>{claim.assigned}</TableCell>

                          <TableCell>
                            <StatusBadge status={claim.status} />
                          </TableCell>

                          <TableCell>
                            <PriorityBadge priority={claim.priority} />
                          </TableCell>

                          <TableCell className="w-10 text-right">
                            <button className="px-2 py-1 text-neutral-300 hover:text-neutral-500">
                              <MoreVertical size={16} />
                            </button>
                          </TableCell>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-6 w-full inline-flex justify-between items-center">
                  <div className="text-center">
                    <span className="text-neutral-600 text-xs font-weight-400">
                      Showing{" "}
                    </span>
                    <span className="text-black text-xs font-weight-600">
                      {filteredRows.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1}
                    </span>
                    <span className="text-neutral-600 text-xs font-weight-400">
                      {" "}
                      to{" "}
                    </span>
                    <span className="text-black text-xs font-weight-600">
                      {Math.min(currentPage * PAGE_SIZE, filteredRows.length)}
                    </span>
                    <span className="text-neutral-600 text-xs font-weight-400">
                      {" "}
                      of{" "}
                    </span>
                    <span className="text-black text-xs font-weight-600">
                      {filteredRows.length}
                    </span>
                    <span className="text-neutral-600 text-xs font-weight-400">
                      {" "}
                      Entries
                    </span>
                  </div>

                  <Pagination
                    currentPage={currentPage}
                    totalPages={Math.ceil(filteredRows.length / PAGE_SIZE)}
                    onPageChange={setCurrentPage}
                  />
                </div>
              </div>
            </section>
          </>
        )}

        {activePage === "settings" && (
          <section className="flex-1 overflow-auto">
            <AccountSettingsContent onClose={() => setActivePage("claims")} />
          </section>
        )}

        {activePage === "tasks" && <Tasks initialFilters={taskFilter} />}

        {activePage === "dashboard" && <TasksDashboard onOpen={goToTasks} />}

        {activePage === "calendar" && <TasksCalendar onOpen={goToTasks} />}
      </main>
    </div>
  );
};

const StatCard = ({
  title,
  value,
  change,
  trend,
  icon: Icon,
  iconBg,
  iconColor,
}: any) => {
  const isUp = trend === "up";

  return (
    <div className="p-4 rounded-lg outline outline-1 outline-offset-[-1px] outline-neutral-200 flex flex-col gap-3">
      <div className="flex items-center gap-4">
        <div className={`p-3 ${iconBg} rounded flex items-center`}>
          <Icon size={20} className={iconColor} />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <div className="text-black text-4xl font-weight-600 leading-10">
          {value}
        </div>
        <div className="text-neutral-500 text-sm font-weight-500">{title}</div>
      </div>
    </div>
  );
};

const DateBox = ({ label }: { label: string }) => (
  <button
    type="button"
    className="w-36 px-5 py-4 bg-white rounded outline outline-1 outline-offset-[-1px] outline-neutral-200 flex justify-between items-center"
  >
    <span className="text-neutral-300 text-base font-light leading-4">
      {label}
    </span>
    <Calendar size={16} className="text-blue-300" />
  </button>
);

const TableHeader = ({
  children,
  className = "",
}: {
  children?: React.ReactNode;
  className?: string;
}) => (
  <th
    className={`px-4 py-3 text-left text-neutral-900 text-sm font-weight-600 ${className}`}
  >
    {children}
  </th>
);

const TableCell = ({
  children,
  className = "",
}: {
  children?: React.ReactNode;
  className?: string;
}) => (
  <td
    className={`px-4 py-3 text-neutral-700 text-sm font-weight-400 ${className}`}
  >
    {children}
  </td>
);

const StatusBadge = ({ status }: { status: string }) => {
  const s = status?.toLowerCase() || "";
  if (s.includes("cancel") || s.includes("closed")) {
    return (
      <span className="px-2 py-1 bg-neutral-100 rounded text-neutral-600 text-[10px] font-weight-500 font-['Outfit']">
        {status}
      </span>
    );
  }
  if (s.includes("complet") || s.includes("settled") || s.includes("approved")) {
    return (
      <span className="px-2 py-1 bg-green-100 rounded text-lime-700 text-[10px] font-weight-500 font-['Outfit']">
        {status}
      </span>
    );
  }
  if (s.includes("process") || s.includes("progress") || s.includes("pending")) {
    return (
      <span className="px-2 py-1 bg-yellow-100 rounded text-amber-600 text-[10px] font-weight-500 font-['Outfit']">
        {status}
      </span>
    );
  }
  return (
    <span className="px-2 py-1 bg-blue-100 rounded text-blue-700 text-[10px] font-weight-500 font-['Outfit']">
      {status || "—"}
    </span>
  );
};

const PriorityBadge = ({ priority }: { priority: string }) => {
  const p = priority?.toLowerCase() || "";
  if (p === "high") {
    return (
      <span className="px-2 py-1 bg-red-100 rounded text-red-700 text-[10px] font-weight-500 font-['Outfit']">
        High
      </span>
    );
  }
  if (p === "medium") {
    return (
      <span className="px-2 py-1 bg-yellow-100 rounded text-amber-600 text-[10px] font-weight-500 font-['Outfit']">
        Medium
      </span>
    );
  }
  if (p === "low") {
    return (
      <span className="px-2 py-1 bg-green-100 rounded text-lime-700 text-[10px] font-weight-500 font-['Outfit']">
        Low
      </span>
    );
  }
  return (
    <span className="px-2 py-1 bg-neutral-100 rounded text-neutral-600 text-[10px] font-weight-500 font-['Outfit']">
      {priority || "—"}
    </span>
  );
};

const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) => {
  const pages = Math.max(1, totalPages);

  return (
    <div className="flex justify-start items-center shadow-[0px_1px_0.5px_0.05px_rgba(29,41,61,0.02)] font-['Inter'] text-sm">
      <button
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
        className="h-9 px-3 py-2 bg-white rounded-tl rounded-bl outline outline-1 outline-offset-[-1px] outline-neutral-200 flex justify-center items-center disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <span className="text-neutral-600 text-sm font-weight-500 leading-5">
          Previous
        </span>
      </button>

      {Array.from({ length: pages }, (_, i) => i + 1).map((page) => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={`w-9 h-9 px-3 py-2 outline outline-1 outline-offset-[-1px] outline-neutral-200 flex justify-center items-center ${
            page === currentPage ? "bg-blue-100" : "bg-white"
          }`}
        >
          <span
            className={`text-sm font-weight-500 leading-5 ${
              page === currentPage ? "text-black" : "text-neutral-600"
            }`}
          >
            {page}
          </span>
        </button>
      ))}

      <button
        disabled={currentPage === pages}
        onClick={() => onPageChange(currentPage + 1)}
        className="h-9 px-3 py-2 bg-white rounded-tr rounded-br outline outline-1 outline-offset-[-1px] outline-neutral-200 flex justify-center items-center disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <span className="text-blue-500 text-sm font-weight-500 leading-5">
          Next
        </span>
      </button>
    </div>
  );
};

const formatDate = (value: any) => {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
};

export default Dashboard;
