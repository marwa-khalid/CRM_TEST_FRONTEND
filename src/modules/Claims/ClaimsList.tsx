import { useState, useEffect, useMemo,useRef } from "react";
import { Search, Import, Plus, Filter, History } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  deleteClaim,
  downloadCSV,
  getClaims,
} from "../../services/Claims/Claims.tsx";
import "react-datepicker/dist/react-datepicker.css";
import { useDispatch } from "react-redux";
// import { setIsClosed } from "../../redux/Claim/claimSlice.tsx";
import type { SortDescriptor } from "react-aria-components";
import { DateRangePicker } from "../../components/application/date-picker/date-range-picker.tsx";
import {
  Table,
  TableCard,
  TableRowActionsDropdown,
} from "../../components/application/table/table.tsx";
import "react-responsive-modal/styles.css";
import { Modal } from "react-responsive-modal";
import {
  PaginationButtonGroup,
  PaginationCardDefault,
  PaginationCardMinimal,
  PaginationPageDefault,
} from "../../components/application/pagination/pagination.tsx";
import { BadgeWithDot } from "../../components/base/badges/badges.tsx";
import { FaTimes } from "react-icons/fa";
import TenantHistoryActivities from "../../components/Drawer/TenantHistoryDrawer.tsx";

interface Claim {
  claim_id: number;
  our_reference: string;
  client_name: string;
  mobile_tel: string;
  incident_date: string | null;
  actual_category: string;
  handler: string;
  case_status: string;
  latest_update_str: string;
  priority: string;
}

function Claims() {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [tenantDrawerVisible, setTenantDrawerVisible] = useState(false);
  const [showDotsMenu, setShowDotsMenu] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [confirmation, setConfirmation] = useState(false);
  const [claimId, setClaimId] = useState(null);
  const [selectedClaims, setSelectedClaims] = useState<Claim[]>([]);
  const dotsMenuRef = useRef<HTMLDivElement>(null);
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([
    null,
    null,
  ]);
  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
    column: "claim_id",
    direction: "ascending",
  });

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const tenant_id = localStorage.getItem("tenant_id");

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dotsMenuRef.current &&
        !dotsMenuRef.current.contains(event.target as Node)
      ) {
        setShowDotsMenu(false);
      }
    };

    if (showDotsMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showDotsMenu]);

  const fetchClaims = async () => {
    try {
      setLoading(true);
      const response = await getClaims(tenant_id);
      const data = Array.isArray(response)
        ? response
        : response.data || response;

      if (!data) throw new Error("No data received from API");

      const formattedData = data.map((claim: any) => ({
        claim_id: claim.claim_id,
        our_reference: claim.our_reference || "N/A",
        client_name: claim.client_name || "N/A",
        mobile_tel: claim.mobile_tel || "N/A",
        incident_date: claim.incident_date || null,
        actual_category: formatVehicleCategoryLabel(
          claim.actual_category || "N/A"
        ),
        handler: claim.handler || "Unassigned",
        case_status: claim.case_status || "N/A",
        latest_update_str: claim.latest_update_str || "N/A",
        priority: claim.priority || "N/A",
      }));

      setClaims(formattedData);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch claims. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClaims();
    dispatch({ type: "RESET_STORE" });
    // dispatch(setIsClosed(false));
  }, []);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const [startDate, endDate] = dateRange;

  const filteredClaims = useMemo(() => {
    let filtered = claims.filter((claim) => {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        searchQuery === "" ||
        claim.client_name.toLowerCase().includes(searchLower) ||
        claim.handler.toLowerCase().includes(searchLower) ||
        claim.case_status.toLowerCase().includes(searchLower) ||
        claim.our_reference.toLowerCase().includes(searchLower);

      let matchesDate = true;
      if (startDate && endDate && claim.incident_date) {
        const claimDate = new Date(claim.incident_date);
        matchesDate =
          claimDate >= new Date(startDate.setHours(0, 0, 0, 0)) &&
          claimDate <= new Date(endDate.setHours(23, 59, 59, 999));
      }

      return matchesSearch && matchesDate;
    });

    if (sortDescriptor.column) {
      filtered.sort((a, b) => {
        const first = a[sortDescriptor.column as keyof Claim];
        const second = b[sortDescriptor.column as keyof Claim];

        if (first === null || first === undefined)
          return sortDescriptor.direction === "ascending" ? -1 : 1;
        if (second === null || second === undefined)
          return sortDescriptor.direction === "ascending" ? 1 : -1;

        if (typeof first === "string" && typeof second === "string") {
          let cmp = first.localeCompare(second);
          return sortDescriptor.direction === "descending" ? -cmp : cmp;
        }

        return 0;
      });
    }

    return filtered;
  }, [claims, searchQuery, startDate, endDate, sortDescriptor]);

  const totalPages = Math.ceil(filteredClaims.length / pageSize);
  const paginatedClaims = filteredClaims.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handleDeleteClaim = async (id: number) => {
    try {
      await deleteClaim(claimId);
      await fetchClaims();
    } catch (e) {
      console.error(e);
    } finally {
      setConfirmation(false);
    }
  };

  const getStatusColor = (status: string) => {
    const s = status.toLowerCase().trim();
    console.log(`Status: "${status}" -> Lowercase: "${s}"`);
    if (s.includes("accepted")) return "#deffe7";
    if (s.includes("rejected")) return "#e3e3e3";
    if (s.includes("pending")) return "warning";
    return "#e3e3e3";
  };

  function downloadCSVFile(data: any, filename = "data.csv") {
    const blob = new Blob([data], { type: "text/csv" });

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;

    link.click();
  }

  const handleExportCSV = async () => {
    try {
      const res = await downloadCSV(tenant_id);
      downloadCSVFile(res, "Claims Report.csv");
    } catch (e) {}
  };

  useEffect(() => {
    localStorage.removeItem("isClosed");
  }, [selectedClaims, paginatedClaims]);
  // Add this helper function at the top of the file or in a separate utils file
  const formatVehicleCategoryLabel = (label: string): string => {
    if (!label) return label;

    // Replace combinations of greater-than and equal symbols
    return label
      .replace(/>=/g, " ≥ ") // Replace >= with ≥
      .replace(/<=/g, " ≤ ") // Replace <= with ≤
      .replace(/=>/g, " ≥ ") // Replace => with ≥
      .replace(/=< /g, " ≤ ") // Replace =< with ≤
      .replace(/greater than or equal to/gi, " ≥ ")
      .replace(/less than or equal to/gi, " ≤ ");
  };

  return (
    <div className="min-h-screen font-semibold bg-white justify-center px-14 py-10">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
            Claims Management
          </h1>
          <p className="text-gray-600 font-medium mt-1">
            Manage and track all the claims
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          {/* Updated 3-dots menu */}
          <div className="relative" ref={dotsMenuRef}>
            <button
              onClick={() => setShowDotsMenu((prev) => !prev)}
              className="h-[40px] sm:h-[44px] min-w-[44px] px-3 sm:px-4 bg-white border rounded-lg shadow flex items-center justify-center text-gray-700 hover:bg-gray-50 transition-colors"
              style={{ minHeight: "44px" }}
            >
              <span className="text-lg font-bold">⋮</span>
            </button>

            {showDotsMenu && (
              <div className="absolute right-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 z-50 min-w-[180px]">
                {/* History Activity Button - Updated to match newclaim styling */}
                <button
                  className="w-full px-4 py-3 text-left text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors"
                  onClick={() => {
                    setTenantDrawerVisible(true);
                    setShowDotsMenu(false);
                  }}
                >
                  <History className="h-4 w-4" />
                  <span>Activity Log</span>
                </button>
              </div>
            )}
          </div>

          {/* Export button - Also update to match styling */}
          <button
            onClick={() => handleExportCSV()}
            className="h-[40px] sm:h-[44px] px-3 sm:px-4 py-1 sm:py-2 text-gray-700 bg-white border rounded-lg shadow hover:bg-gray-50 transition-colors flex items-center"
          >
            <Import className="h-4 w-4 mr-2" /> Export
          </button>

          {/* Add New Claim - Also update to match styling */}
          <button
            onClick={() => navigate("/new-claim")}
            className="h-[40px] sm:h-[44px] px-3 sm:px-4 py-1 sm:py-2 text-white bg-custom rounded-lg hover:bg-[#252B37] transition-colors flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" /> Add New Claim
          </button>
        </div>

        {/* Tenant History Activities Drawer */}
        <TenantHistoryActivities
          visible={tenantDrawerVisible}
          onClose={() => setTenantDrawerVisible(false)}
          tenantId={tenant_id}
        />
      </div>

      {/* SEARCH & FILTER */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between pb-6 gap-4">
        <div className="relative w-full md:w-1/2 lg:w-1/3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search for claims"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700"
          />
        </div>

        <div className="relative">
          {/* <button
            onClick={() => setShowFilterDropdown(!showFilterDropdown)}
            className="flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
          >
            <Filter className="h-4 w-4 mr-2 text-gray-500" /> Filters
          </button> */}

          {/* {showFilterDropdown && (
            <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border z-10 p-4">
              <h4 className="text-sm font-semibold mb-2 text-gray-800">
                Filter by Incident Date
              </h4> */}
          {/* <DateRangePicker
            selectsRange
            startDate={startDate}
            endDate={endDate}
            onChange={(update) => {
              const start = update?.start
                ? new Date(
                    update.start.year,
                    update.start.month - 1,
                    update.start.day
                  )
                : null;
              const end = update?.end
                ? new Date(
                    update.end.year,
                    update.end.month - 1,
                    update.end.day
                  )
                : null;
              setDateRange([start, end]);
            }}
            isClearable
            placeholderText="Select date range"
          /> */}
          {/* </div>
          )} */}
        </div>
      </div>

      {/* TABLE */}
      {loading ? (
        <div className="p-12 text-center text-gray-600">Loading claims...</div>
      ) : error ? (
        <div className="p-12 text-center text-red-600">{error}</div>
      ) : (
        <TableCard.Root size="sm" className="border border-gray-200 rounded-lg">
          <div style={{ overflowX: "auto" }}>
            <Table
              aria-label="Claims"
              selectionBehavior="toggle"
              selectionMode="multiple"
              selectedKeys={selectedClaims.map((c) => c.claim_id.toString())}
              onSelectionChange={(keys) => {
                if (keys === "all") {
                  setSelectedClaims(paginatedClaims);
                } else {
                  const selectedIds = Array.from(keys).map((id) =>
                    parseInt(id as string)
                  );
                  setSelectedClaims(
                    paginatedClaims.filter((claim) =>
                      selectedIds.includes(claim.claim_id)
                    )
                  );
                }
              }}
              sortDescriptor={sortDescriptor}
              onSortChange={setSortDescriptor}
              style={{ minWidth: "100%" }} // Add tableLayout: fixed for controlling column widths
            >
              <Table.Header className="bg-gray-100 text-gray-700">
                {/* <Table.Head id="claim_id" label="ID" allowsSorting style={{ width: '120px' }} /> */}
                <Table.Head
                  id="our_reference"
                  label="Reference"
                  allowsSorting
                  style={{ minWidth: "200px" }}
                />
                <Table.Head
                  id="client_name"
                  label="Client Name"
                  allowsSorting
                  style={{ minWidth: "200px" }}
                />
                <Table.Head
                  id="mobile_tel"
                  label="Mobile"
                  allowsSorting
                  style={{ minWidth: "150px" }}
                />
                <Table.Head
                  id="incident_date"
                  label="Incident Date"
                  allowsSorting
                  style={{ minWidth: "180px" }}
                />
                <Table.Head
                  id="actual_category"
                  label="Category"
                  allowsSorting
                  style={{ minWidth: "150px" }}
                />
                <Table.Head
                  id="handler"
                  label="Handler"
                  allowsSorting
                  style={{ minWidth: "150px" }}
                />
                <Table.Head
                  id="case_status"
                  label="Status"
                  allowsSorting
                  style={{ minWidth: "0px" }}
                />
                <Table.Head
                  id="latest_update_str"
                  label="Latest Update"
                  allowsSorting
                  style={{ minWidth: "180px" }}
                />
                <Table.Head
                  id="priority"
                  label="Priority"
                  allowsSorting
                  style={{ minWidth: "120px" }}
                />
                <Table.Head id="actions" style={{ minWidth: "100px" }} />
              </Table.Header>

              <Table.Body items={paginatedClaims}>
                {(claim) => (
                  <Table.Row
                    className="hover:bg-gray-50 transition-colors duration-150"
                    onClick={() => navigate(`/claim/${claim.claim_id}`)}
                    id={claim.claim_id.toString()}
                    key={claim.claim_id}
                  >
                    {/* <Table.Cell style={{ width: '120px', whiteSpace: 'nowrap', fontWeight: 'normal' }}>{claim.claim_id}</Table.Cell> */}
                    <Table.Cell
                      style={{
                        minWidth: "0",
                        whiteSpace: "nowrap",
                        paddingLeft: "22px",
                      }}
                    >
                      {claim.our_reference}
                    </Table.Cell>
                    <Table.Cell
                      style={{
                        minWidth: "200px",
                        whiteSpace: "nowrap",
                        fontWeight: "normal",
                        paddingLeft: "22px",
                      }}
                    >
                      {claim.client_name}
                    </Table.Cell>
                    <Table.Cell
                      style={{
                        minWidth: "150px",
                        whiteSpace: "nowrap",
                        fontWeight: "normal",
                        paddingLeft: "22px",
                      }}
                    >
                      {claim.mobile_tel && claim.mobile_tel !== "N/A"
                        ? `+${claim.mobile_tel}`
                        : claim.mobile_tel || ""}
                    </Table.Cell>
                    <Table.Cell
                      style={{
                        minWidth: "180px",
                        whiteSpace: "nowrap",
                        fontWeight: "normal",
                        paddingLeft: "22px",
                      }}
                    >
                      {claim.incident_date
                        ? new Date(claim.incident_date).toLocaleString(
                            "en-GB",
                            {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                              hour12: false,
                            }
                          )
                        : "N/A"}
                    </Table.Cell>
                    <Table.Cell
                      style={{
                        minWidth: "150px",
                        whiteSpace: "nowrap",
                        fontWeight: "normal",
                        paddingLeft: "25px",
                      }}
                    >
                      {claim.actual_category}
                    </Table.Cell>
                    <Table.Cell
                      style={{
                        minWidth: "150px",
                        whiteSpace: "nowrap",
                        fontWeight: "normal",
                        paddingLeft: "22px",
                      }}
                    >
                      {claim.handler}
                    </Table.Cell>
                    <Table.Cell
                      style={{
                        minWidth: "0px",
                        whiteSpace: "nowrap",
                        fontWeight: "normal",
                        paddingLeft: "22px",
                      }}
                    >
                      <div className="">
                        <div
                          style={{
                            backgroundColor: getStatusColor(claim.case_status),
                          }}
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold`}
                        >
                          <span className="w-1.5 h-1.5 bg-black rounded-full mr-2"></span>
                          {claim.case_status}
                        </div>
                      </div>
                    </Table.Cell>
                    <Table.Cell
                      style={{
                        minWidth: "0px",
                        whiteSpace: "nowrap",
                        fontWeight: "normal",
                        paddingLeft: "22px",
                      }}
                    >
                      {claim.latest_update_str}
                    </Table.Cell>
                    <Table.Cell
                      style={{
                        minWidth: "0px",
                        whiteSpace: "nowrap",
                        fontWeight: "normal",
                        paddingLeft: "25px",
                      }}
                    >
                      {claim.priority}
                    </Table.Cell>
                    <Table.Cell style={{ minWidth: "0px" }}>
                      <TableRowActionsDropdown
                        onDelete={() => {
                          setConfirmation(true);
                          setClaimId(claim.claim_id);
                        }}
                        onEdit={() => navigate(`/claim/${claim.claim_id}`)}
                      />
                    </Table.Cell>
                  </Table.Row>
                )}
              </Table.Body>
            </Table>
          </div>

          <PaginationButtonGroup
            page={currentPage}
            total={totalPages}
            onPageChange={setCurrentPage}
            className="px-4 py-3"
          />
        </TableCard.Root>
      )}
      <Modal
        open={confirmation}
        onClose={() => setConfirmation(false)}
        center
        closeIcon={
          <FaTimes size={18} className="text-gray-500 hover:text-gray-700" />
        }
      >
        <div className="p-4">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">
            Are you sure?
          </h2>
          <p className="text-sm text-gray-600 mb-6">
            Do you really want to delete this claim?
          </p>

          {/* Buttons aligned bottom-right */}
          <div className="flex justify-end space-x-3">
            <button
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
              onClick={()=>handleDeleteClaim}
            >
              Yes, Delete
            </button>
            <button
              className="px-4 py-2 bg-white text-gray-800 border rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 transition-colors"
              onClick={() => setConfirmation(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default Claims;
