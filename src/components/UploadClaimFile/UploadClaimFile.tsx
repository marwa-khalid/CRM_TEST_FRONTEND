import React, { useState, useEffect } from "react";
import { FileUpload } from "../application/file-upload/file-upload-base";
import { PulseLoader } from "react-spinners";
import { Trash01, Eye, Download01, Link03, SearchLg, FilterLines } from "@untitledui/icons";
import { Calendar, User, Type, MoreVertical } from "lucide-react";
import { FileIcon as FileTypeIcon } from "@untitledui/file-icons";
import { MdOutlineClose } from "react-icons/md";
import {
  getClaimFiles,
  deactivateHistoryRecord,
  uploadClaimFiles,
  downloadClaimFile,
} from "../../services/HistoryActivities/HistoryActivities";
import Modal from "react-responsive-modal";
import { toast } from "react-toastify";

interface UploadClaimFileModalProps {
  claimId?: string | number;
  isOpen?: boolean;
  loading?: boolean;
  error?: string | null;
  onClose: () => void;
  onUpload: (files: File[]) => void;
  confirming: () => boolean;
}

interface ClaimFile {
  id: number;
  file_name: string;
  file_path: string;
  claim_id: number;
  file_type: string;
  created_at: string;
  updated_at: string;
  created_by_name: string;
  updated_by: number;
  url: string;
  // For backward compatibility
  name?: string;
  date?: string;
  userName?: string;
  type?: string;
  downloadUrl?: string;
}

type FilterType = "title" | "user" | "date" | null;

// // Shared utility function for extracting original file names
// const extractOriginalFileName = (fileName: string): string => {
//   if (!fileName) return "download";

//   // Extract just the actual file name from "The File Named v5cfull_page-0003.jpg Has Been Save For Claim..."
//   const match = fileName.match(/The File Named (.+?) Has Been/);
//   if (match && match[1]) {
//     return match[1];
//   }

//   const parts = fileName.split("Named ");
//   if (parts.length > 1) {
//     const afterNamed = parts[1];
//     const nextSpace = afterNamed.indexOf(" ");
//     if (nextSpace > 0) {
//       return afterNamed.substring(0, nextSpace);
//     }
//     return afterNamed;
//   }

//   // If no pattern matches, return the original string (limited length)
//   return fileName.length > 50 ? `${fileName.substring(0, 50)}...` : fileName;
// };
const extractOriginalFileName = (fileName: string): string => {
  if (!fileName) return "download";

  // Match: The file named "v5cfull.pdf" has been save...
  const match = fileName.match(/file named\s+"([^"]+)"/i);
  if (match && match[1]) {
    return match[1];
  }

  // Fallback: try without quotes
  const fallbackMatch = fileName.match(/file named\s+(.+?)\s+has/i);
  if (fallbackMatch && fallbackMatch[1]) {
    return fallbackMatch[1];
  }

  // Final fallback
  return fileName.length > 50
    ? `${fileName.substring(0, 50)}...`
    : fileName;
};

// Updated handleDownloadFile using the shared utility
export const handleDownloadFile = async (file: {
  id: number;
  file_name: string;
  claim_id?: number;
}) => {
  if (!file?.id) return;

  try {
    const response = await downloadClaimFile(file.id);

    // Create a temporary link to trigger download
    const blob = new Blob([response.data], {
      type: response.data.type || "application/octet-stream",
    });
    const link = document.createElement("a");
    link.href = window.URL.createObjectURL(blob);

    // Use the extracted original file name
    const originalFileName = extractOriginalFileName(file.file_name);
    link.download = originalFileName;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(link.href);
    
    // Show success toast
    toast.success(`Downloaded "${extractOriginalFileName(file.file_name)}"`);
  } catch (error: any) {
    console.error("Error downloading file:", error);
    toast.error(
      error.response?.data?.detail ||
        error.message ||
        "Failed to download file."
    );
  }
};

const UploadClaimFileModal: React.FC<UploadClaimFileModalProps> = ({
  claimId,
  isOpen,
  onClose,
  onUpload,
  confirming,
  error,
}) => {
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [fileProgress, setFileProgress] = useState<Record<string, number>>({});
  const [isDisabled, setIsDisabled] = useState(false);
  const [existingFiles, setExistingFiles] = useState<ClaimFile[]>([]);
  const [loadingFiles, setLoadingFiles] = useState<boolean>(false);
  const [errorLoading, setErrorLoading] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedFileId, setSelectedFileId] = useState<number | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string>("");
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterType>(null);
  const [filterPlaceholder, setFilterPlaceholder] = useState("Search existing documents...");

  // File extension mapping to Untitled UI file icon types
  const extensionToUITypeMap: Record<string, string> = {
    // Documents
    pdf: "pdf",
    doc: "doc",
    docx: "doc",
    txt: "txt",
    rtf: "txt",

    // Images
    jpg: "jpg",
    jpeg: "jpg",
    png: "png",
    gif: "gif",
    svg: "svg",
    bmp: "img",
    webp: "img",
    tiff: "img",

    // Videos
    mp4: "mp4",
    mov: "mov",
    avi: "avi",
    mkv: "video",
    wmv: "video",
    flv: "video",
    webm: "video",
    m4v: "video",

    // Audio
    mp3: "mp3",
    wav: "wav",
    aac: "audio",
    ogg: "audio",
    flac: "audio",
    m4a: "audio",

    // Archives
    zip: "zip",
    rar: "zip",
    "7z": "zip",
    tar: "zip",
    gz: "zip",

    // Spreadsheets
    xls: "xls",
    xlsx: "xlsx",
    csv: "csv",

    // Presentations
    ppt: "ppt",
    pptx: "pptx",

    // Code files
    js: "js",
    ts: "js",
    html: "html",
    htm: "html",
    css: "css",
    json: "json",
    xml: "xml",
    java: "java",
    py: "python",

    // Other
    psd: "psd",
    ai: "ai",
    fig: "fig",
    eps: "eps",
    sql: "sql",
    exe: "exe",
    dmg: "dmg",
  };

  // Helper function to extract file extension from filename
  const getFileExtension = (filename: string): string => {
    if (!filename) return "document";

    // Try multiple extraction methods
    let ext = "document";

    // Method 1: Extract from "The File Named filename.ext Has Been..."
    const namedMatch = filename.match(/The File Named .*?\.(\w+)/);
    if (namedMatch && namedMatch[1]) {
      ext = namedMatch[1].toLowerCase();
      return extensionToUITypeMap[ext] || ext;
    }

    // Method 2: Last dot before space or end
    const dotSpaceMatch = filename.match(/\.(\w+)(?:\s|$)/);
    if (dotSpaceMatch && dotSpaceMatch[1]) {
      ext = dotSpaceMatch[1].toLowerCase();
      return extensionToUITypeMap[ext] || ext;
    }

    // Method 3: Simple split by dot
    const parts = filename.split(".");
    if (parts.length > 1) {
      const lastPart = parts[parts.length - 1].toLowerCase();
      // Remove any non-alphanumeric characters
      const cleanExt = lastPart.replace(/[^a-z0-9]/g, "");
      if (cleanExt) {
        ext = cleanExt;
      }
    }

    return extensionToUITypeMap[ext] || ext;
  };
  const getFileIconTypeFromHistory = (file: ClaimFile): string => {
  // 1️⃣ Get real filename (v5cfull.pdf)
  const realName = extractOriginalFileName(file.file_name);

  // 2️⃣ Extract extension
  const ext = realName.split(".").pop()?.toLowerCase();
  if (!ext) return "document";

  // 3️⃣ Map to Untitled UI icons
  return extensionToUITypeMap[ext] || "document";
};


  // Helper function to map file type to Untitled UI file icon type
  const getFileUIType = (file: any): string => {
    if (!file || !file.type) return "empty";

    const mime = file.type;

    if (mime.startsWith("image/")) {
      const ext = file.name.split(".").pop()?.toLowerCase() || "";
      return extensionToUITypeMap[ext] || "img";
    }
    if (mime.startsWith("audio/")) return "mp3";
    if (mime.startsWith("video/")) return "mp4";
    if (mime.includes("pdf")) return "pdf";
    if (mime.includes("csv")) return "csv";
    if (mime.includes("msword") || mime.includes("wordprocessing"))
      return "doc";
    if (mime.includes("spreadsheet") || mime.includes("excel")) return "xls";
    if (mime.includes("presentation")) return "ppt";

    const ext = file.name.split(".").pop()?.toLowerCase() || "";
    return extensionToUITypeMap[ext] || "empty";
  };

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      const scrollY = window.scrollY;

      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = "100%";
      document.body.style.overflow = "hidden";

      return () => {
        document.body.style.position = "";
        document.body.style.top = "";
        document.body.style.width = "";
        document.body.style.overflow = "";
        window.scrollTo(0, scrollY);
      };
    }
  }, [isOpen]);

  // Reset filter when modal closes
  useEffect(() => {
    if (!isOpen) {
      setActiveFilter(null);
      setSearchTerm("");
      setShowFilterMenu(false);
    }
  }, [isOpen]);

  // Fetch existing files when modal opens or claimId changes
  useEffect(() => {
    const fetchClaimFiles = async () => {
      if (isOpen && claimId) {
        setLoadingFiles(true);
        setErrorLoading(null);

        try {
          const claimIdNum =
            typeof claimId === "string" ? parseInt(claimId) : claimId;
          const response = await getClaimFiles(claimIdNum as number);

          if (response.data && Array.isArray(response.data)) {
            setExistingFiles(
              response.data.map((file: any) => ({
                id: file.id,
                file_name: file.file_name,
                file_path: file.file_path,
                claim_id: file.claim_id,
                file_type: file.file_type,
                created_at: file.created_at,
                updated_at: file.updated_at,
                created_by_name: file.created_by_name,
                updated_by: file.updated_by,
                url: file.url,

                // For compatibility
                name: file.file_name,
                date: file.created_at,
                userName: file.created_by_name,
                type: getFileExtension(file.file_name),
                downloadUrl: file.url,
              }))
            );
          }
        } catch (error: any) {
          console.error("Error fetching claim files:", error);
          setErrorLoading(error.message || "Failed to load files");
          toast.error("Failed to load claim files");
        } finally {
          setLoadingFiles(false);
        }
      }
    };

    fetchClaimFiles();
  }, [isOpen, claimId]);

  // Format date for display and search
  const formatDateForDisplay = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return "Invalid date";
      }
      const options: Intl.DateTimeFormatOptions = {
        month: "short",
        day: "numeric",
        year: "numeric",
      };
      return date.toLocaleDateString("en-US", options);
    } catch (error) {
      return "Invalid date";
    }
  };

  // Format date for search (includes time)
  const formatDateForSearch = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const day = date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
      const time = date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
      return `${time} · ${day}`;
    } catch {
      return dateString;
    }
  };

  // Update placeholder when filter changes
  useEffect(() => {
    if (activeFilter === "title") {
      setFilterPlaceholder("Search by Title...");
    } else if (activeFilter === "user") {
      setFilterPlaceholder("Search by User Name...");
    } else if (activeFilter === "date") {
      setFilterPlaceholder("Search by Date...");
    } else {
      setFilterPlaceholder("Search existing documents...");
    }
  }, [activeFilter]);

  // Filter data based on search term and active filter
  const filteredExistingFiles = existingFiles.filter((file) => {
    if (!searchTerm) return true;

    const term = searchTerm.toLowerCase();

    if (activeFilter === "title") {
      return extractOriginalFileName(file.file_name).toLowerCase().includes(term);
    } else if (activeFilter === "user") {
      return file.created_by_name?.toLowerCase().includes(term);
    } else if (activeFilter === "date") {
      return formatDateForSearch(file.created_at).toLowerCase().includes(term);
    } else {
      // Search in all fields if no filter is active
      return (
        extractOriginalFileName(file.file_name).toLowerCase().includes(term) ||
        file.created_by_name?.toLowerCase().includes(term) ||
        formatDateForSearch(file.created_at).toLowerCase().includes(term)
      );
    }
  });

  // Handle filter selection
  const handleFilterSelect = (filter: FilterType) => {
    setActiveFilter(filter);
    setShowFilterMenu(false);
  };

  // Clear filter
  const clearFilter = () => {
    setActiveFilter(null);
    setSearchTerm("");
  };

  const handleFileChange = (files: FileList) => {
    const fileArray = Array.from(files);
    fileArray.forEach((file) => simulateFileUpload(file));
    setUploadedFiles((prev) => {
      const merged = [...prev, ...fileArray];
      const unique = merged.filter(
        (file, index, self) =>
          index === self.findIndex((f) => f.name === file.name)
      );
      return unique;
    });
  };

  const handleDelete = (fileName: string) => {
    setUploadedFiles((prevFiles) =>
      prevFiles.filter((file) => file.name !== fileName)
    );
    setFileProgress((prevProgress) => {
      const newProgress = { ...prevProgress };
      delete newProgress[fileName];
      return newProgress;
    });
    toast.info(`Removed "${fileName}" from upload queue`);
  };

  const getFileType = (file: any) => {
    if (!file || !file.type) return "document";

    const mime = file.type;

    if (mime.startsWith("image/")) return "img";
    if (mime.startsWith("audio/")) return "audio";
    if (mime.startsWith("video/")) return "video";
    if (mime.includes("pdf")) return "pdf";
    if (mime.includes("csv")) return "csv";
    if (mime.includes("msword")) return "doc";
    if (mime.includes("spreadsheet") || mime.includes("excel")) return "xls";
    if (mime.includes("presentation")) return "ppt";

    const ext = file.name.split(".").pop().toLowerCase();
    const validTypes = [
      "ai",
      "avi",
      "css",
      "csv",
      "doc",
      "docx",
      "eps",
      "exe",
      "fig",
      "gif",
      "html",
      "indd",
      "java",
      "jpeg",
      "jpg",
      "js",
      "json",
      "mkv",
      "mp3",
      "mp4",
      "mpeg",
      "pdf",
      "png",
      "ppt",
      "pptx",
      "psd",
      "rar",
      "rss",
      "sql",
      "svg",
      "tiff",
      "txt",
      "wav",
      "webp",
      "xls",
      "xlsx",
      "xml",
      "zip",
    ];

    return validTypes.includes(ext) ? ext : "document";
  };

  const simulateFileUpload = (file: File) => {
    setIsDisabled(true);
    let progress = 0;
    const progressKey = file.name;

    const progressInterval = setInterval(() => {
      progress += 10;
      setFileProgress((prevProgress) => ({
        ...prevProgress,
        [progressKey]: progress,
      }));

      if (progress >= 100) {
        setIsDisabled(false);
        clearInterval(progressInterval);
      }
    }, 1000);
  };

  const handleUpload = async () => {
    if (!claimId || uploadedFiles.length === 0) return;

    setIsDisabled(true);

    try {
      const claimIdNum =
        typeof claimId === "string" ? parseInt(claimId) : claimId;
      const response = await uploadClaimFiles(claimIdNum, uploadedFiles);

      if (response.data && Array.isArray(response.data)) {
        // Map to your ClaimFile interface
        const uploaded = response.data.map((file: any) => ({
          id: file.id,
          file_name: file.file_name,
          file_path: file.file_path,
          claim_id: file.claim_id,
          file_type: file.file_type,
          created_at: file.created_at,
          updated_at: file.updated_at,
          created_by_name: file.created_by_name,
          updated_by: file.updated_by,
          url: file.url,

          // For compatibility
          name: file.file_name,
          date: file.created_at,
          userName: file.created_by_name,
          type: getFileExtension(file.file_name),
          downloadUrl: file.url,
        }));

        // Merge with existing files
        setExistingFiles((prev) => [...uploaded, ...prev]);

        // Show success message
        toast.success(`Successfully uploaded ${uploadedFiles.length} file(s)`);
        
        // Clear uploaded files and progress
        setUploadedFiles([]);
        setFileProgress({});
      }
    } catch (error: any) {
      console.error("Error uploading files:", error);
      toast.error(error.response?.data?.detail || "Failed to upload files");
    } finally {
      setIsDisabled(false);
    }
  };

  // Handle click outside to close
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Handle file actions
  const handleViewFile = (file: ClaimFile) => {
    if (file.url) {
      // Open the URL in a new tab
      window.open(file.url, "_blank", "noopener,noreferrer");
      toast.success(`Viewing "${extractOriginalFileName(file.file_name)}"`);
    } else {
      toast.error(`View ${file.file_name} - No URL available`);
    }
  };

  const handleShareFile = async (file: ClaimFile) => {
    if (!file.url) {
      toast.error("No URL available to share.");
      return;
    }

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(file.url);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = file.url;
        textArea.style.position = "fixed"; 
        textArea.style.left = "-9999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        const successful = document.execCommand("copy");
        document.body.removeChild(textArea);

        if (!successful) {
          throw new Error("Fallback copy failed");
        }
      }

      toast.success("File URL copied to clipboard");
    } catch (error) {
      console.error("Clipboard copy failed:", error);
      toast.error("Unable to copy file URL");
    }
  };

  const openDeleteModal = (fileId: number, fileName: string) => {
    setSelectedFileId(fileId);
    setSelectedFileName(fileName);
    setDeleteModalOpen(true);
  };

  if (!isOpen) return null;
  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto py-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg w-full max-w-2xl mx-4 shadow-xl max-h-[90vh] overflow-hidden">
        <div className="p-6 overflow-y-auto max-h-[90vh]">
          <div className="flex justify-end">
            <MdOutlineClose
              onClick={onClose}
              className="text-20 cursor-pointer hover:text-gray-700"
            />
          </div>

          {/* Heading */}
          <div className="text-center mb-6">
            <h2 className="text-xl font-semibold text-gray-800">
              Claim Documents {/*{claimId && `- Claim #${claimId}`} */}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Below is the list of all uploaded documents in this claim
            </p>
          </div>

          {/* Upload Section - Separated */}
          <div className="mb-6">
            <FileUpload.Root>
              <FileUpload.DropZone
                allowsMultiple={true}
                onDropFiles={handleFileChange}
                accept="image/*,.pdf,.docx,.doc,.mp4,.mov,.avi,.zip,.rar,.csv,.xlsx,.xls,.pptx,.ppt,.txt"
                onDropUnacceptedFiles={(files) => {
                  toast.error("Unsupported file type. Please upload supported file types.");
                }}
                hint="Click to upload or drag and drop"
                subHint="Supports images, documents, spreadsheets, videos, and archives"
                className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-300 transition-colors"
              />
            </FileUpload.Root>
          </div>

          {/* Uploaded Files List - Only show if user uploaded something */}
          {uploadedFiles.length > 0 && (
            <div className="mb-6">
              <h3 className="text-base font-semibold text-gray-800 mb-3">
                Files to Upload
              </h3>

              <FileUpload.Root>
                <FileUpload.List>
                  {uploadedFiles.map((file) => {
                    const fileType = getFileUIType(file);
                    return (
                      <FileUpload.ListItemProgressBar
                        key={file.name}
                        name={file.name}
                        status={
                          fileProgress[file.name] === 100
                            ? "Completed"
                            : "Uploading"
                        }
                        fileIconVariant="default"
                        size={file.size}
                        progress={fileProgress[file.name] || 0}
                        onDelete={() => handleDelete(file.name)}
                        type={fileType as any}
                      />
                    );
                  })}
                </FileUpload.List>
              </FileUpload.Root>
            </div>
          )}

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <button
              onClick={() => {
                onClose();
                // toast.error("Upload cancelled");
              }}
              className="w-full py-3 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              disabled={isDisabled || uploadedFiles.length === 0}
              onClick={handleUpload}
              className={`w-full py-3 text-sm text-white rounded-lg transition-colors font-medium ${
                isDisabled || uploadedFiles.length === 0
                  ? "cursor-not-allowed opacity-50 bg-[#252B37]"
                  : "bg-[#252B37] hover:bg-[#1C222D]"
              }`}
            >
              {confirming() ? (
                <div className="flex items-center justify-center">
                  <PulseLoader size={6} speedMultiplier={1} color="#ffffff" />
                </div>
              ) : (
                "Confirm & Attach"
              )}
            </button>
          </div>

          {/* Search Section with Filter */}
          <div className="mb-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <SearchLg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder={filterPlaceholder}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#414651] focus:border-transparent"
                />
              </div>
              
              {/* Filter Button */}
              <div className="relative">
                <button
                  onClick={() => setShowFilterMenu(!showFilterMenu)}
                  className="p-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 transition-colors flex items-center justify-center"
                  aria-label="Filter options"
                >
                  <FilterLines className="w-5 h-5 text-gray-600" />
                </button>
                
                {/* Filter Dropdown Menu */}
                {showFilterMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setShowFilterMenu(false)}
                    />
                    <div className="absolute right-0 top-full mt-1 z-50 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1">
                      <div className="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Filter by
                      </div>
                      
                      <button
                        onClick={() => handleFilterSelect("title")}
                        className={`w-full flex items-center px-3 py-2 text-sm hover:bg-gray-50 ${
                          activeFilter === "title" ? "text-[#414651] bg-gray-100" : "text-gray-700"
                        }`}
                      >
                        <Type className="w-4 h-4 mr-2" />
                        Title
                        {activeFilter === "title" && (
                          <span className="ml-auto text-xs text-[#414651]">✓</span>
                        )}
                      </button>
                      
                      <button
                        onClick={() => handleFilterSelect("user")}
                        className={`w-full flex items-center px-3 py-2 text-sm hover:bg-gray-50 ${
                          activeFilter === "user" ? "text-[#414651] bg-gray-100" : "text-gray-700"
                        }`}
                      >
                        <User className="w-4 h-4 mr-2" />
                        User Name
                        {activeFilter === "user" && (
                          <span className="ml-auto text-xs text-[#414651]">✓</span>
                        )}
                      </button>
                      
                      <button
                        onClick={() => handleFilterSelect("date")}
                        className={`w-full flex items-center px-3 py-2 text-sm hover:bg-gray-50 ${
                          activeFilter === "date" ? "text-[#414651] bg-gray-100" : "text-gray-700"
                        }`}
                      >
                        <Calendar className="w-4 h-4 mr-2" />
                        Date
                        {activeFilter === "date" && (
                          <span className="ml-auto text-xs text-[#414651]">✓</span>
                        )}
                      </button>
                      
                      {activeFilter && (
                        <div className="border-t border-gray-200 mt-1 pt-1">
                          <button
                            onClick={clearFilter}
                            className="w-full flex items-center justify-center px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
                          >
                            Clear Filter
                          </button>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Active Filter Indicator */}
            {activeFilter && (
              <div className="mt-3 flex items-center justify-between">
                <div className="flex items-center">
                  <span className="text-sm text-gray-600 mr-2">Filtering by:</span>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-[#414651]">
                    {activeFilter === "title" && (
                      <>
                        <Type className="w-3 h-3 mr-1" />
                        Title
                      </>
                    )}
                    {activeFilter === "user" && (
                      <>
                        <User className="w-3 h-3 mr-1" />
                        User Name
                      </>
                    )}
                    {activeFilter === "date" && (
                      <>
                        <Calendar className="w-3 h-3 mr-1" />
                        Date
                      </>
                    )}
                    <button
                      onClick={clearFilter}
                      className="ml-2 text-[#414651] hover:text-[#252B37]"
                      aria-label="Clear filter"
                    >
                      <MdOutlineClose className="w-3 h-3" />
                    </button>
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Existing Documents Section */}
          <div className="mb-6">
            <h3 className="text-base font-semibold text-gray-800 mb-3">
              Existing Documents
            </h3>

            {errorLoading && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">
                  Error loading files: {errorLoading}
                </p>
              </div>
            )}

            <div className="space-y-2">
              {loadingFiles ? (
                <div className="text-center py-8">
                  <PulseLoader size={8} color="#252B37" />
                  <p className="mt-2 text-sm text-gray-500">
                    Loading documents...
                  </p>
                </div>
              ) : filteredExistingFiles.length > 0 ? (
                filteredExistingFiles.map((file) => {
                  // const fileUIType = getFileExtension(file.file_name);
                  const fileUIType = getFileIconTypeFromHistory(file);

                  return (
                    <div
                      key={file.id}
                      className="flex items-center justify-between border border-gray-200 rounded-lg px-3 py-2 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0 h-8 w-8 flex items-center justify-center">
                          <FileTypeIcon
                            className="size-8 dark:hidden"
                            type={fileUIType as any}
                            theme="light"
                            variant="default"
                          />
                          <FileTypeIcon
                            className="size-8 not-dark:hidden"
                            type={fileUIType as any}
                            theme="dark"
                            variant="default"
                          />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-sm font-medium text-gray-800 truncate">
                            {extractOriginalFileName(file.file_name).length > 30
                              ? `${extractOriginalFileName(
                                  file.file_name
                                ).substring(0, 30)}...`
                              : extractOriginalFileName(file.file_name)}
                          </span>
                          <span className="text-xs text-gray-500">
                            {file.created_by_name} •{" "}
                            {formatDateForDisplay(file.created_at)}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1 shrink-0">
                        <button
                          onClick={() => handleViewFile(file)}
                          className="p-1 hover:bg-gray-200 rounded transition-colors"
                          title="View"
                        >
                          <Eye className="h-4 w-4 text-gray-600" />
                        </button>
                        <button
                          onClick={() => handleDownloadFile(file)}
                          className="p-1 hover:bg-gray-200 rounded transition-colors"
                          title="Download"
                        >
                          <Download01 className="h-4 w-4 text-gray-600" />
                        </button>

                        <button
                          onClick={() => handleShareFile(file)}
                          className="p-1 hover:bg-gray-200 rounded transition-colors"
                          title="Share"
                        >
                          <Link03 className="h-4 w-4 text-gray-600" />
                        </button>
                        <button
                          onClick={() =>
                            openDeleteModal(file.id, file.file_name)
                          }
                          className="p-1 hover:bg-red-50 rounded transition-colors"
                          title="Delete"
                        >
                          <Trash01 className="size-4 text-gray-600" />{" "}
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-4 text-gray-500 text-sm">
                  {searchTerm
                    ? "No documents match your search"
                    : "No existing documents found for this claim"}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      {/* DELETE CONFIRMATION MODAL */}
      <Modal
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        center
        closeIcon={
          <MdOutlineClose
            size={20}
            className="text-gray-500 hover:text-gray-700"
          />
        }
      >
        <div className="p-4">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">
            Are you sure?
          </h2>

          <p className="text-sm text-gray-600 mb-6">
            Do you really want to delete{" "}
            <strong>{extractOriginalFileName(selectedFileName)}</strong>?
          </p>

          <div className="flex justify-end space-x-3">
            <button
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              onClick={async () => {
                if (selectedFileId !== null) {
                  try {
                    await deactivateHistoryRecord(selectedFileId);
                    // Remove the file locally after successful deletion
                    setExistingFiles((prev) =>
                      prev.filter((f) => f.id !== selectedFileId)
                    );
                    setDeleteModalOpen(false);
                    setSelectedFileId(null);
                    setSelectedFileName("");
                    
                    // Show success toast
                    toast.success(`Deleted "${extractOriginalFileName(selectedFileName)}"`);
                  } catch (error: any) {
                    console.error("Error deleting file:", error);
                    toast.error(
                      error.response?.data?.message ||
                        "Failed to delete the document. Please try again."
                    );
                  }
                }
              }}
            >
              Yes, Delete
            </button>

            <button
              className="px-4 py-2 bg-white text-gray-800 border rounded-lg hover:bg-gray-100 transition-colors"
              onClick={() => {
                setDeleteModalOpen(false);
                toast.info("Delete cancelled");
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default UploadClaimFileModal;