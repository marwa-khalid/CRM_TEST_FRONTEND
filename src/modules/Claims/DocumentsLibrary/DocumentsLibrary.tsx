import React, { useEffect, useMemo, useState, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { ChevronLeft, Check, Mail } from "lucide-react";
import { toast } from "react-toastify";
import EmailAttachmentModal from "./EmailAttachmentModal";
import PhotosIcon from "../../../assets/case_activity/photos.svg";
import AIReportIcon from "../../../assets/case_activity/ai_report.svg";
import UserUploadsIcon from "../../../assets/case_activity/user_uploads.svg";
import FileIcon from "../../../assets/case_activity/file.svg";
import DownloadIcon from "../../../assets/AutoClaim_icon/downloadd2.svg";
import ShareIcon from "../../../assets/AutoClaim_icon/Vulnerable.svg";
import HistoryIcon from "../../../assets/AutoClaim_icon/Vector-4.svg";
import WitnessIcon from "../../../assets/case_activity/witness.svg";
import ViewIcon from "../../../assets/case_activity/view.svg";
import PDFIcon from "../../../assets/FileTypes/PDF.svg";
import PNGIcon from "../../../assets/FileTypes/PNG.svg";
import CSVIcon from "../../../assets/FileTypes/CSV.svg";
import DocumentLibraryUploadModal from "../UploadModalPopups/DocumentLibraryUploadModal";
import {
  getDocumentLibrary,
  getDocumentDetail,
  uploadLibraryDocument,
  createDocumentShareLink,
  getClaimPhotos,
  getAllDocumentLibrary,
  getDocumentPresignedUrl,
} from "../../../services/DocumentLibrary/DocumentLibrary";
import DocumentLibrarySlider from "./DocumentLibrarySlider";
import { getCaseActivityPresignedUrl } from "../../../services/HistoryActivities/HistoryActivities";
import { parseServerDate } from "../../../utils/serverDate";

// Renders an S3/local image and, on "Access Denied / expired" errors, refetches
// a fresh presigned URL from the object key so it never stays broken.
const S3Image: React.FC<{
  src: string;
  s3Key?: string;
  alt?: string;
  className?: string;
}> = ({ src, s3Key, alt, className }) => {
  const [url, setUrl] = useState(src);
  const tried = useRef(false);
  useEffect(() => {
    setUrl(src);
    tried.current = false;
  }, [src]);
  return (
    <img
      src={url}
      alt={alt}
      className={className}
      onError={async () => {
        if (tried.current || !s3Key) return;
        tried.current = true;
        try {
          const fresh = await getCaseActivityPresignedUrl(s3Key);
          if (fresh) setUrl(fresh);
        } catch {
          /* leave broken image */
        }
      }}
    />
  );
};

const DocumentsLibrary = () => {
  const [activeTab, setActiveTab] = useState("Show All");
  const [searchQuery, setSearchQuery] = useState("");
  const [documents, setDocuments] = useState<any[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<any>(null);
  const [isSliderOpen, setIsSliderOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const [photos, setPhotos] = useState<any[]>([]);
  const [isPhotosLoading, setIsPhotosLoading] = useState(false);
  const [hoveredPhoto, setHoveredPhoto] = useState<any>(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const claimId = searchParams.get("claim_id") || searchParams.get("claimId") || "";
  const [isPageLoading, setIsPageLoading] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedPhotoIds, setSelectedPhotoIds] = useState<Set<string | number>>(new Set());
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [sliderInitialTab, setSliderInitialTab] = useState<
    "File Preview" | "Meta Data" | "Version History" | "Audit Log"
  >("File Preview");
  const loadClaimPhotos = async () => {
    if (!claimId) return;

    try {
      setIsPhotosLoading(true);
      const data = await getClaimPhotos(claimId);
      setPhotos(data || []);
    } catch (error) {
      console.error("Failed to load claim photos:", error);
      setPhotos([]);
    } finally {
      setIsPhotosLoading(false);
    }
  };
  useEffect(() => {
    if (activeTab === "Photos") {
      loadClaimPhotos();
    }
  }, [activeTab, claimId]);
  const filteredPhotos = useMemo(() => {
    return photos.filter((photo) =>
      photo.file_name?.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [photos, searchQuery]);

  const togglePhotoSelection = (photo: any) => {
    setSelectedPhotoIds((prev) => {
      const next = new Set(prev);
      if (next.has(photo.id)) {
        next.delete(photo.id);
      } else {
        if (next.size >= 5) {
          toast.warn("Maximum 5 attachments allowed.");
          return prev;
        }
        next.add(photo.id);
      }
      return next;
    });
  };

  const selectedPhotos = filteredPhotos.filter((p) => selectedPhotoIds.has(p.id));


  const categories = [
    { name: "Show All", icon: null },
    {
      name: "Claim Entrance Documents",
      icon: FileIcon,
    },
    { name: "Photos", icon:PhotosIcon },
    { name: "AI Reports", icon:AIReportIcon },
    {
      name: "Witness Questionnaires Responses",
      icon: WitnessIcon,
    },
    { name: "User Uploads", icon:UserUploadsIcon },
  ];
const getPaginationPages = () => {
  if (totalPages <= 8) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  return [1, 2, 3, 4, 5, 6, 7, 8, "dots", totalPages];
};
  const scope = searchParams.get("scope");
  const loadDocuments = async () => {
    const isAll = scope === "all";
    // The "all documents" view has no claim_id; only the claim-scoped view needs one.
    if (!isAll && !claimId) return;
    try {
      setIsPageLoading(true)
      const data = isAll
        ? await getAllDocumentLibrary()
        : await getDocumentLibrary(claimId);
      setDocuments(data || []);
    } catch (e) {
      console.error(e);
    }
    finally {
      setIsPageLoading(false)

    }
  };

  useEffect(() => {
    loadDocuments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [claimId, scope]);

const getDocumentTab = (doc: any) => {
  const category = doc.category?.toLowerCase();
  const sourceType = doc.source_type?.toLowerCase();
  const tag = doc.tag?.toLowerCase();

  if (sourceType === "driver_document") {
    return "Claim Entrance Documents";
  }

  if (
    sourceType === "witness_questionnaire" ||
    category === "witness" ||
    tag === "witness-questionnaire"
  ) {
    return "Witness Questionnaires Responses";
  }

  if (
    sourceType === "ai_report" ||
    category === "ai report" ||
    category === "ai reports"
  ) {
    return "AI Reports";
  }

  if (sourceType === "user_upload" || category === "user uploads") {
    return "User Uploads";
  }

  return doc.category || "User Uploads";
};

const filteredDocs = useMemo(() => {
  return documents.filter((doc) => {
    const mappedTab = getDocumentTab(doc);

    const matchesTab = activeTab === "Show All" || mappedTab === activeTab;

    const matchesSearch = doc.file_name
      ?.toLowerCase()
      .includes(searchQuery.toLowerCase());

    return matchesTab && matchesSearch;
  });
}, [documents, activeTab, searchQuery]);
  const totalEntries = filteredDocs.length;
  const totalPages = Math.max(1, Math.ceil(totalEntries / pageSize));

  const startEntry = totalEntries === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endEntry = Math.min(currentPage * pageSize, totalEntries);

  const paginatedDocs = filteredDocs.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  const goToPage = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchQuery]);

  // Always open documents via a FRESH presigned URL so S3-backed files never
  // hit "Access Denied / Request has expired" from a stale stored URL.
  const openDocument = async (doc: any) => {
    try {
      const res = await getDocumentPresignedUrl(doc.id);
      const url = res?.url || res || doc.file_url;
      if (url) window.open(url, "_blank", "noopener,noreferrer");
    } catch {
      if (doc.file_url) window.open(doc.file_url, "_blank", "noopener,noreferrer");
    }
  };
const openDetail = async (
  documentId: number,
  initialTab: "File Preview" | "Meta Data" | "Version History" | "Audit Log" =
    "File Preview",
) => {
  try {
    setSliderInitialTab(initialTab);

    const detail = await getDocumentDetail(documentId);

    setSelectedDocument(detail);
    setIsSliderOpen(true);
  } catch (e) {
    console.error(e);
  }
};
const getUploadCategory = () => {
  if (activeTab === "Show All") return "User Uploads";
  if (activeTab === "Photos") return "User Uploads";

  if (activeTab === "Witness Questionnaires Responses") {
    return "Witness Questionnaires Responses";
  }

  if (activeTab === "AI Reports") return "AI Reports";

  if (activeTab === "Claim Entrance Documents") {
    return "Claim Entrance Documents";
  }

  return activeTab;
};
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !claimId) return;

    const formData = new FormData();
    formData.append("claim_id", String(claimId));
    formData.append("category", getUploadCategory());
    formData.append("tag", "Manual Upload");
    formData.append("source_type", "user_upload");
    formData.append("file", file);

    try {
      await uploadLibraryDocument(formData);
      await loadDocuments();
    } catch (e) {
      console.error(e);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const openOutlookShare = async (doc: any) => {
    try {
      const res = await createDocumentShareLink(doc.id);
      const shareUrl = res?.url || doc.file_url || "";

      const subject = `Shared Document - ${doc.file_name}`;
      const body = `Hello,

Please find the document details below.

Document Name: ${doc.file_name}
Category: ${doc.category || "-"}
Tag: ${doc.tag || "-"}
File Size: ${
        doc.file_size_bytes
          ? `${(doc.file_size_bytes / 1024).toFixed(2)} KB`
          : "0 KB"
      }

Open Document:
${shareUrl}

Regards`;

      const outlookUrl =
        `https://outlook.office.com/mail/deeplink/compose` +
        `?subject=${encodeURIComponent(subject)}` +
        `&body=${encodeURIComponent(body)}`;

      window.open(outlookUrl, "_blank", "noopener,noreferrer");
    } catch (error) {
      console.error("Failed to open Outlook share compose:", error);
      alert("Unable to open Outlook share composer.");
    }
  };
  
  const getRelativeTime = (dateStr?: string) => {
    const parsed = parseServerDate(dateStr);
    if (!parsed) return "";

    const now = new Date().getTime();
    const date = parsed.getTime();
    const diff = Math.floor((now - date) / 1000); // seconds

    if (diff < 60) return `${diff} sec${diff !== 1 ? "s" : ""} ago`;

    const minutes = Math.floor(diff / 60);
    if (minutes < 60) return `${minutes} min${minutes !== 1 ? "s" : ""} ago`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours !== 1 ? "s" : ""} ago`;

    const days = Math.floor(hours / 24);
    if (days < 7) return `${days} day${days !== 1 ? "s" : ""} ago`;

    const weeks = Math.floor(days / 7);
    if (weeks < 4) return `${weeks} week${weeks !== 1 ? "s" : ""} ago`;

    const months = Math.floor(days / 30);
    if (months < 12) return `${months} month${months !== 1 ? "s" : ""} ago`;

    const years = Math.floor(days / 365);
    return `${years} year${years !== 1 ? "s" : ""} ago`;
  };
  return (
    <div className="w-full min-h-screen bg-white font-['Stack_Sans_Headline']">
      <DocumentLibraryUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        claimId={claimId}
        category={getUploadCategory()}
        onUploadSuccess={loadDocuments}
      />

      {isEmailModalOpen && (
        <EmailAttachmentModal
          attachments={selectedPhotos}
          onClose={() => setIsEmailModalOpen(false)}
          onRemoveAttachment={(id) =>
            setSelectedPhotoIds((prev) => {
              const next = new Set(prev);
              next.delete(id);
              return next;
            })
          }
        />
      )}
      <DocumentLibrarySlider
        isOpen={isSliderOpen}
        onClose={() => setIsSliderOpen(false)}
        document={selectedDocument}
        allDocuments={documents}
        initialTab={sliderInitialTab}
        claimId={claimId}
      />

      <div className="w-full px-10 py-5 bg-white shadow-[0px_4px_20px_0px_rgba(0,0,0,0.08)] inline-flex justify-between items-center">
        <div className="inline-flex flex-col justify-center items-start gap-2">
          <div
            onClick={() => (claimId ? navigate(`/add-claim/${claimId}`) : navigate(-1))}
            className="inline-flex justify-start items-center gap-1 cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4 text-[#3B82F6]" />
            <div className="text-[#3B82F6] text-xs font-weight-600">
              Back to Claim Details
            </div>
          </div>
          <div className="text-black text-2xl font-weight-600 leading-6">
            Documents Library
          </div>
        </div>
        {isPageLoading && (
          <div className="fixed inset-0 z-[9999] bg-[#e8e6df]/80 flex items-center justify-center font-['Stack_Sans_Headline']">
            <div className="relative w-[73px] h-[73px]">
              {Array.from({ length: 12 }).map((_, index) => (
                <span
                  key={index}
                  className="absolute left-1/2 top-1/2 w-[6px] h-[16px] rounded-full bg-[#9b9b9b] animate-loaderFade"
                  style={{
                    transform: `
              translate(-50%, -50%)
              rotate(${index * 30}deg)
              translateY(-25px)
            `,
                    animationDelay: `${index * 0.08}s`,
                  }}
                />
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-start items-center gap-5">
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="px-10 py-4 bg-blue-500 rounded flex justify-center items-center text-white text-base font-weight-400 hover:bg-blue-600 transition"
          >
            Upload Document
          </button>
        </div>
      </div>

      <div className="flex flex-col items-center py-20">
        <div className="w-[1000px] mb-6">
          <div className="w-full px-5 py-4 bg-white rounded border border-[#E5E7EB] flex items-center gap-3">
            <input
              type="text"
              placeholder="Search Document"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-[#374151] text-base font-light focus:outline-none placeholder:text-[#9CA3AF]"
            />
          </div>
        </div>

        <div className="w-[1000px] flex flex-wrap items-center gap-3 mb-8">
          {categories.map((cat) => {
            const isActive = activeTab === cat.name;

            return (
              <button
                key={cat.name}
                onClick={() => setActiveTab(cat.name)}
                className={`px-3 py-2 rounded flex items-center gap-2 text-sm transition-all border ${
                  isActive
                    ? "bg-blue-500 border-blue-500 text-white"
                    : "bg-blue-100 border-transparent text-blue-500"
                }`}
              >
                {cat.icon && (
                  <img
                    src={cat.icon}
                    alt=""
                    className={`w-4 h-4 object-contain ${
                      isActive ? "brightness-0 invert" : ""
                    }`}
                  />
                )}

                <span className="font-weight-300 font-light">{cat.name}</span>
              </button>
            );
          })}
        </div>

        <div className="w-[1003px] flex flex-col gap-5">
          {activeTab === "Photos" ? (
            /* PHOTO GALLERY VIEW */
            <div className="relative">
              {/* Click-to-preview lightbox */}
              {hoveredPhoto && (
                <div
                  className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 cursor-pointer"
                  onClick={() => setHoveredPhoto(null)}
                >
                  <div
                    className="w-[720px] max-w-[85vw] max-h-[82vh] bg-white rounded shadow-[0px_20px_60px_rgba(0,0,0,0.25)] border border-gray-200 overflow-hidden p-3 cursor-default"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <S3Image
                      src={hoveredPhoto.file_url}
                      s3Key={hoveredPhoto.s3_key || hoveredPhoto.id}
                      alt={hoveredPhoto.file_name}
                      className="w-full max-h-[74vh] object-contain rounded bg-white"
                    />
                  </div>
                </div>
              )}

              {isPhotosLoading ? (
                <div className="w-full py-16 flex justify-center items-center text-[#6B7280] text-sm font-light">
                  Loading photos...
                </div>
              ) : filteredPhotos.length === 0 ? (
                <div className="w-full py-16 rounded-xl border border-dashed border-gray-300 flex justify-center items-center text-[#6B7280] text-sm font-light">
                  No photos found for this claim.
                </div>
              ) : (
                <>
                <div className="grid grid-cols-4 gap-4">
                  {filteredPhotos.map((photo) => {
                    const isSelected = selectedPhotoIds.has(photo.id);
                    return (
                      <div
                        key={photo.id}
                        onClick={() => setHoveredPhoto(photo)}
                        className={`group relative h-[190px] rounded overflow-hidden bg-white cursor-pointer shadow-sm hover:shadow-md transition-all border-2 ${
                          isSelected
                            ? "border-blue-500"
                            : "border-gray-200 hover:border-blue-300"
                        }`}
                      >
                        <S3Image
                          src={photo.file_url}
                          s3Key={photo.s3_key || photo.id}
                          alt={photo.file_name}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />

                        {/* Blue tint overlay when selected */}
                        {isSelected && (
                          <div className="absolute inset-0 bg-blue-500/15 pointer-events-none" />
                        )}

                        {/* Checkbox — click selects, stopPropagation so it doesn't open preview */}
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            togglePhotoSelection(photo);
                          }}
                          className={`absolute top-2 left-2 w-6 h-6 rounded border-2 flex items-center justify-center transition-all shadow-sm cursor-pointer ${
                            isSelected
                              ? "bg-blue-500 border-blue-500 opacity-100"
                              : "bg-white/90 border-gray-400 opacity-0 group-hover:opacity-100"
                          }`}
                        >
                          {isSelected && (
                            <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Floating selection bar */}
                {selectedPhotoIds.size > 0 && (
                  <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-white rounded-full shadow-2xl border border-gray-200 px-6 py-3 flex items-center gap-5">
                    <span className="text-sm font-weight-600 text-neutral-800">
                      {selectedPhotoIds.size} selected
                    </span>
                    <div className="w-px h-4 bg-gray-200" />
                    <button
                      onClick={() => setSelectedPhotoIds(new Set())}
                      className="text-sm text-gray-400 hover:text-red-500 transition-colors"
                    >
                      Clear
                    </button>
                    <button
                      onClick={() => setIsEmailModalOpen(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-full text-sm hover:bg-blue-600 transition-colors"
                    >
                      <Mail className="w-4 h-4" />
                      Forward
                    </button>
                  </div>
                )}
                </>
              )}
            </div>
          ) : (
            paginatedDocs.map((doc) => (
              <div
                key={doc.id}
                className="w-full p-4 rounded-lg border border-[#F3F4F6] flex justify-between items-center hover:bg-gray-50 transition"
              >
                <div className="flex items-start gap-6">
                  <div
                    className={`w-12 h-12 ${doc.content_type?.includes("pdf") ? "bg-red-100" : "bg-blue-100"} rounded flex items-center justify-center shrink-0`}
                  >
                    {doc.content_type?.includes("image") ? (
                      <img src={PNGIcon} alt="" />
                    ) : doc.content_type?.includes("pdf") ? (
                      <img src={PDFIcon} alt="" />
                    ) : doc.content_type?.includes("csv") ? (
                      <img src={CSVIcon} alt="" />
                    ) : (
                      <img src={PDFIcon} alt="" />
                    )}
                  </div>

                  <div className="flex flex-col gap-2">
                    <h3 className="text-[#374151] text-base font-weight-400 leading-4">
                      {doc.original_filename}
                    </h3>
                    <p className="text-[#6B7280] text-sm font-weight-300 font-light">
                      {doc.file_size_bytes
                        ? `${(doc.file_size_bytes / 1024).toFixed(2)} KB`
                        : "0 KB"}{" "}
                      • {"Marwa Khalid"} • {getRelativeTime(doc.created_at)}
                    </p>

                   
                      <div className="flex gap-1.5">
                        {(activeTab === "Show All"
                          ? [doc.tag, getDocumentTab(doc)]
                          : [doc.tag]
                        )
                          .filter(Boolean)
                          .filter(
                            (tag, index, arr) => arr.indexOf(tag) === index,
                          )
                          .map((tag) => (
                            <div
                              key={tag}
                              className="px-2 py-1 bg-[#F3F4F6] rounded flex items-center"
                            >
                              <span className="text-[#374151] text-xs font-weight-600">
                                {tag}
                              </span>
                            </div>
                          ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <ActionButton
                    icon={ViewIcon}
                    label="Preview"
                    onClick={() => openDetail(doc.id)}
                  />
                  <ActionButton
                    icon={DownloadIcon}
                    label="Download"
                    onClick={() => openDocument(doc)}
                  />
                  <ActionButton
                    icon={ShareIcon}
                    label="Share"
                    onClick={() => openOutlookShare(doc)}
                  />
                  <ActionButton
                    icon={HistoryIcon}
                    label="Version"
                    onClick={() => openDetail(doc.id, "Version History")}
                  />
                </div>
              </div>
            ))
          )}
        </div>
        {activeTab !== "Photos" && (
          <div className="w-[1003px] mt-10 inline-flex justify-between items-center">
            <div className="text-center justify-center font-['Stack_Sans_Headline']">
              <span className="text-neutral-600 text-xs font-weight-400">
                Showing{" "}
              </span>
              <span className="text-black text-xs font-weight-600">
                {startEntry}
              </span>
              <span className="text-neutral-600 text-xs font-weight-400">
                {" "}
                to{" "}
              </span>
              <span className="text-black text-xs font-weight-600">
                {endEntry}
              </span>
              <span className="text-neutral-600 text-xs font-weight-400">
                {" "}
                of{" "}
              </span>
              <span className="text-black text-xs font-weight-600">
                {totalEntries}
              </span>
              <span className="text-neutral-600 text-xs font-weight-400">
                {" "}
                Entries
              </span>
            </div>

            <div className="flex justify-start items-center shadow-[0px_1px_0.5px_0.05px_rgba(29,41,61,0.02)] font-['Inter'] text-sm">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => goToPage(currentPage - 1)}
                className="h-9 px-3 py-2 bg-white rounded-tl rounded-bl outline outline-1 outline-offset-[-1px] outline-neutral-200 flex justify-center items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="text-neutral-600 text-sm font-weight-500 font-['Inter'] leading-5">
                  Previous
                </span>
              </button>

              {getPaginationPages().map((page, index) => {
                if (page === "dots") {
                  return (
                    <div
                      key={`dots-${index}`}
                      className="w-9 h-9 bg-white outline outline-1 outline-offset-[-1px] outline-neutral-200 flex justify-center items-center"
                    >
                      <span className="text-neutral-600 text-sm font-weight-500 font-['Inter'] leading-5 -mt-1">
                        ...
                      </span>
                    </div>
                  );
                }

                const isActive = currentPage === page;

                return (
                  <button
                    key={page}
                    type="button"
                    onClick={() => goToPage(Number(page))}
                    className={`w-9 h-9 px-3 py-2 outline outline-1 outline-offset-[-1px] outline-neutral-200 outline-start-0 flex justify-center items-center gap-1.5 ${
                      isActive ? "bg-blue-100" : "bg-white"
                    }`}
                  >
                    <span
                      className={`text-sm font-weight-500 font-['Inter'] leading-5 ${
                        isActive ? "text-black" : "text-neutral-600"
                      }`}
                    >
                      {page}
                    </span>
                  </button>
                );
              })}

              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => goToPage(currentPage + 1)}
                className="h-9 px-3 py-2 bg-white rounded-tr rounded-br outline outline-1 outline-offset-[-1px] outline-neutral-200 flex justify-center items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="text-blue-500 text-sm font-weight-500 font-['Inter'] leading-5">
                  Next
                </span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const ActionButton = ({
  icon,
  label,
  onClick,
}: {
  icon: any;
  label: string;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className="h-8 px-3 py-2 rounded flex items-center gap-2 text-[#3B82F6] hover:bg-blue-50 transition-colors"
  >
    <img src={icon} alt="" />
    <span className="text-sm font-weight-300 font-light">{label}</span>
  </button>
);

export default DocumentsLibrary;
