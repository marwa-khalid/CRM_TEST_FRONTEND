import React, { useEffect, useState } from "react";
import { X, Loader2, AlertCircle, Search } from "lucide-react";
import {
  getTenatHistory,
  searchTenantFiles,
} from "../../services/HistoryActivities/HistoryActivities.tsx";
import { PaginationButtonGroup } from "../application/pagination/pagination.tsx";
import { DateRangePicker } from "../application/date-picker/date-range-picker.tsx";
import "react-datepicker/dist/react-datepicker.css";

interface TenantDrawerProps {
  visible: boolean;
  onClose: () => void;
  tenantId: string | number;
}

interface ActivityItem {
  id: number;
  file_name: string;
  tenant_id: number;
  file_type: string;
  created_at: string;
  created_by_name: string;
  urls: string[];
  file_path: string;
}

const PAGE_SIZE = 20;

const TenantHistoryActivities: React.FC<TenantDrawerProps> = ({
  visible,
  onClose,
  tenantId,
}) => {
  const [historyData, setHistoryData] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([
    null,
    null,
  ]);
  const [datePickerKey, setDatePickerKey] = useState(0); // force reset

  const [startDate, endDate] = dateRange;

  useEffect(() => {
    if (visible) {
      setPage(1);
      setSearchTerm("");
      setDateRange([null, null]);
    }
  }, [visible]);

  useEffect(() => {
    if (!visible || !tenantId) return;

    const formatDateForApi = (date: Date) => {
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, "0");
      const day = date.getDate().toString().padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    const fetchHistory = async () => {
      setLoading(true);
      setError(null);

      try {
        const tenantIdNum =
          typeof tenantId === "string" ? parseInt(tenantId) : tenantId;
        let response;

        if (searchTerm) {
          response = await searchTenantFiles(
            tenantIdNum,
            page,
            PAGE_SIZE,
            searchTerm
          );
        } else if (startDate && endDate) {
          const start = formatDateForApi(startDate);
          const end = formatDateForApi(endDate);
          response = await searchTenantFiles(
            tenantIdNum,
            page,
            PAGE_SIZE,
            undefined,
            start,
            end
          );
        } else {
          response = await getTenatHistory(tenantIdNum, page, PAGE_SIZE);
        }

        setHistoryData(response.data.items);
        setTotal(response.data.total);
      } catch (err) {
        console.error(err);
        setError("Failed to load activity history.");
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [visible, tenantId, page, searchTerm, startDate, endDate]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    if (e.target.value) {
      setDateRange([null, null]);
      setDatePickerKey((prev) => prev + 1);
    }
  };

  const handleDateChange = (update: { start?: any; end?: any }) => {
    const start = update?.start
      ? new Date(update.start.year, update.start.month - 1, update.start.day)
      : null;
    const end = update?.end
      ? new Date(update.end.year, update.end.month - 1, update.end.day)
      : null;
    setDateRange([start, end]);

    if (start || end) {
      setSearchTerm("");
    }
  };

  const formatDate = (iso: string) => {
    const date = new Date(iso);
    return `${date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })} · ${date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })}`;
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div
      className={`fixed inset-0 bg-black bg-opacity-50 z-50 transition-opacity duration-300 ease-in-out ${
        visible ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
      onClick={onClose}
    >
      <div
        className={`fixed right-0 top-0 h-full w-[900px] bg-white shadow-xl transition-transform duration-300 ease-in-out transform ${
          visible ? "translate-x-0" : "translate-x-full"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <h3 className="text-xl font-bold text-gray-800">Tenant History</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100"
            aria-label="Close drawer"
          >
            <X className="h-6 w-6 text-gray-500" />
          </button>
        </div>

        <div className="flex flex-col h-[calc(100%-80px)] w-full p-6 bg-gray-50/50">
          {/* Search & Date Picker */}
          <div className="mb-4 flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchTerm}
                onChange={handleSearchChange}
                placeholder="Search here..."
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#414651] focus:border-transparent"
              />
              <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
            </div>

            <DateRangePicker
              key={datePickerKey}
              selectsRange
              startDate={startDate}
              endDate={endDate}
              onChange={handleDateChange}
              isClearable
              placeholderText="Select date range"
            />
          </div>

          {/* Activity List */}
          <div className="flex-1 overflow-y-auto space-y-6">
            {loading ? (
              <div className="flex justify-center items-center h-40">
                <Loader2 className="w-8 h-8 text-[#414651] animate-spin" />
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center h-40 text-red-500">
                <AlertCircle className="w-8 h-8 mb-2" />
                <p>{error}</p>
              </div>
            ) : historyData.length === 0 ? (
              <p className="text-gray-500 text-center mt-10">
                {searchTerm || (startDate && endDate)
                  ? "No results found."
                  : "No activity found."}
              </p>
            ) : (
              historyData.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center space-x-4 relative"
                >
                  <div className="flex flex-col items-center">
                    <div
                      className="h-3 w-3 rounded-full z-10 ring-4 ring-white"
                      style={{ backgroundColor: "#414651" }}
                    />
                  </div>
                  <div className="flex-1 bg-white p-4 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                    <p className="text-sm text-gray-700 font-medium mb-2">
                      {item.file_name}
                    </p>
                    {/* <p
                      className={`text-xs ${
                        item.url
                          ? "text-blue-600 underline cursor-pointer"
                          : "text-gray-500"
                      } break-all mb-2`}
                      onClick={() =>
                        item.url && window.open(item.url, "_blank")
                      }
                    >
                      {item.url || item.file_path}
                    </p> */}
                    <div className="mb-2 flex flex-col gap-1">
                      {item.urls && item.urls.length > 0 ? (
                        item.urls.map((url, index) => {
                          const fileName = url.split("/").pop() || "View File";

                          return (
                            <div
                              key={index}
                              className="flex items-center gap-2"
                            >
                              <button
                                onClick={() =>
                                  window.open(
                                    url,
                                    "_blank",
                                    "noopener,noreferrer"
                                  )
                                }
                                className="text-xs text-blue-600 hover:underline"
                              >
                                {fileName.length > 30
                                  ? fileName.slice(0, 27) + "..."
                                  : fileName}
                              </button>
                              {/* <button
            onClick={() => navigator.clipboard.writeText(url)}
            className="text-xs text-gray-500 hover:text-gray-700"
          >
            Copy Link
          </button> */}
                            </div>
                          );
                        })
                      ) : (
                        <span className="text-xs text-gray-500">
                          {item.file_path}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center text-xs text-gray-400 uppercase">
                      <span className="text-gray-600 mr-1">
                        {item.created_by_name}
                      </span>
                      <span className="mx-1.5 text-gray-300">•</span>
                      <span>{formatDate(item.created_at)}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/*
            Pagination: always visible, but blur when only 1 page
          */}
          <div
            className={`mt-4 flex justify-end transition-opacity duration-300 ${
              totalPages <= 1 ? "opacity-40 pointer-events-none" : "opacity-100"
            }`}
          >
            <PaginationButtonGroup
              page={page}
              total={totalPages || 1}
              onPageChange={setPage}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TenantHistoryActivities;
