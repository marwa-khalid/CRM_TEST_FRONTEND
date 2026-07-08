import React, { useEffect, useMemo, useState } from "react";
import { useCaseReference } from "../../../hooks/useCaseReference";
import DownloadIcon from "../../../assets/AutoClaim_icon/downloadd2.svg";
import ShareIcon from "../../../assets/AutoClaim_icon/Vulnerable.svg";
import PDFIcon from "../../../assets/FileTypes/PDF.svg";
import PNGIcon from "../../../assets/FileTypes/PNG.svg";
import CSVIcon from "../../../assets/FileTypes/CSV.svg";
import { toast } from "react-toastify";
import axiosInstance from "../../../services/axiosConfig";
import attachmentt from "../../../assets/AutoClaim_icon/attachment.svg";
import ForwardIcon from "../../../assets/case_activity/forward.svg";
import {
  createDocumentShareLink,
  getDocumentPreviewPages,
  getDocumentPresignedUrl,
  registerDocumentDownload,
  registerDocumentPreview,
} from "../../../services/DocumentLibrary/DocumentLibrary";
import { Document, Page, pdfjs } from "react-pdf";
import { parseServerDate, serverTime } from "../../../utils/serverDate";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();
interface Props {
  isOpen: boolean;
  onClose: () => void;
  document: any;
  allDocuments?: any[];
  initialTab?: "File Preview" | "Meta Data" | "Version History" | "Audit Log";
  claimId?: string;
}

const DocumentLibrarySlider: React.FC<Props> = ({
  isOpen,
  onClose,
  document,
  allDocuments = [],
  initialTab = "File Preview",
  claimId = "",
}) => {
  const [previewData, setPreviewData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("File Preview");
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab, document?.id]);
  const [previewUrl, setPreviewUrl] = useState("");
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [emailActionModal, setEmailActionModal] = useState(false);
  const [forwardToEmail, setForwardToEmail] = useState("");
  const [emailComment, setEmailComment] = useState("");
  const [emailSending, setEmailSending] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [selectedEmailFiles, setSelectedEmailFiles] = useState<File[]>([]);
  
  const caseReference = useCaseReference(claimId); // per-claim ref (was localStorage)

  useEffect(() => {
    if (isOpen && document?.id) {
      registerDocumentPreview(document.id).catch(console.error);
    }
  }, [isOpen, document?.id]);
  useEffect(() => {
    const loadPreview = async () => {
      if (!isOpen || !document?.id) {
        setPreviewData(null);
        setPreviewUrl("");
        setIsPreviewLoading(false);
        return;
      }

      try {
        setIsPreviewLoading(true);
        setPreviewData(null);
        setPreviewUrl("");

        const data = await getDocumentPreviewPages(document.id);

        setPreviewData(data);

        if (data?.type === "image") {
          setPreviewUrl(data.url || "");
        }
      } catch (error) {
        console.error("Preview failed:", error);
        setPreviewData({
          type: "error",
          message: "Unable to load preview.",
        });
      } finally {
        setIsPreviewLoading(false);
      }
    };

    loadPreview();
  }, [isOpen, document?.id]);

  const fileSizeLabel = useMemo(() => {
    const size = document?.file_size_bytes || 0;
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(2)} KB`;
    return `${(size / (1024 * 1024)).toFixed(2)} MB`;
  }, [document?.file_size_bytes]);

  const isPdf =
    document?.content_type?.includes("pdf") ||
    document?.file_extension === "pdf";

  if (!isOpen || !document) return null;

  const handleDownload = async () => {
    try {
      await registerDocumentDownload(document.id);
      const res = await getDocumentPresignedUrl(document.id);
      window.open(res.url, "_blank");
    } catch (e) {
      console.error(e);
    }
  };

  const handleShare = async () => {
    try {
      const res = await createDocumentShareLink(document.id, 3600);
      const url = res?.url || "";

      setShareUrl(url);
      setEmailComment("");
      setForwardToEmail("");
      setSelectedEmailFiles([]);
      setEmailActionModal(true);
    } catch (e) {
      console.error(e);
      toast.error("Failed to create temporary link.");
    }
  };
  const escapeHtml = (value = "") => {
    return value
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  };

  const getShareSubject = () => {
    return `Shared Document - ${document?.file_name || "Document"}`;
  };

  const getDocumentShareMessage = () => {
    const safeComment = escapeHtml(emailComment).replace(/\n/g, "<br />");

    return `
${safeComment ? `<p>${safeComment}</p>` : ""}

<p>You can view the shared document by clicking the button below.</p>
`;
  };

  const sendDocumentForwardEmail = async () => {
    const formData = new FormData();

    formData.append("to_email", forwardToEmail.trim());
    formData.append("subject", getShareSubject());
    formData.append("comment", getDocumentShareMessage());
    formData.append("use_graph", "true");

    formData.append(
      "attachment_urls",
      JSON.stringify([
        {
          file_name: document?.file_name || "document",
          file_url: shareUrl,
          activity_type: "Document Library",
        },
      ]),
    );

    selectedEmailFiles.forEach((file) => {
      formData.append("files", file);
    });

    const response = await axiosInstance.post(
      "/case-activity/email/forward-with-attachments",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );

    return response.data;
  };
  const displayUploadedBy =
    document?.created_by_name ||
    document?.uploaded_by_name ||
    document?.created_by ||
    "-";
  const PreviewLoader = () => (
    <div className="w-full h-[420px] flex items-center justify-center">
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
  );
const normalizeValue = (value?: string) =>
  String(value || "")
    .trim()
    .toLowerCase();

const getVersionGroupKey = (doc: any) => {
  const sourceType = normalizeValue(doc?.source_type);
  const category = normalizeValue(doc?.category);
  const originalFilename = normalizeValue(
    doc?.original_filename || doc?.file_name,
  );
  const tag = normalizeValue(doc?.tag);

  // Witness questionnaires are separate records, but they share original_filename/source/tag.
  if (
    sourceType === "witness_questionnaire" ||
    category.includes("witness") ||
    tag.includes("witness")
  ) {
    return `witness-${doc?.claim_id}-${originalFilename || "witness-questionnaire"}`;
  }

  // AI reports should be grouped together by source/category.
  if (
    sourceType === "ai_report" ||
    category === "ai report" ||
    category === "ai reports"
  ) {
    return `ai-report-${doc?.claim_id}-${originalFilename || "ai-report"}`;
  }

  // Driver documents should be grouped by tag if available.
  if (sourceType === "driver_document") {
    return `driver-document-${doc?.claim_id}-${tag || originalFilename}`;
  }

  // Normal uploaded document versions.
  return `document-${doc?.claim_id}-${category}-${originalFilename}`;
};

const getDocumentVersions = () => {
  if (!document) return [];

  const currentKey = getVersionGroupKey(document);

  const relatedFromList = (allDocuments || []).filter(
    (item) => getVersionGroupKey(item) === currentKey,
  );

  const relatedFromDetail = Array.isArray(document?.versions)
    ? document.versions
    : [];

  const mergedMap = new Map<string | number, any>();

  [...relatedFromList, ...relatedFromDetail, document].forEach((item) => {
    if (!item) return;
    mergedMap.set(item.id || item.s3_key || item.file_url, item);
  });

  const sortedAscending = Array.from(mergedMap.values()).sort((a, b) => {
    const aTime = serverTime(a.created_at);
    const bTime = serverTime(b.created_at);
    return aTime - bTime;
  });

  const withVersionNumbers = sortedAscending.map((item, index) => ({
    ...item,
    calculatedVersion: index + 1,
    isCurrent: String(item.id) === String(document.id),
  }));

  // latest first in UI, but version numbers remain based on upload time
  return withVersionNumbers.reverse();
};

const formatDateTime = (dateStr?: string) => {
  const parsed = parseServerDate(dateStr);
  if (!parsed) return "-";

  return parsed.toLocaleString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};
  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />

      <div className="fixed top-0 right-0 h-full w-[918px] bg-white z-50 shadow-2xl font-['Stack_Sans_Headline'] overflow-y-auto">
        <div className="w-full h-36 px-10 pt-5 bg-white shadow-[0px_4px_20px_0px_rgba(0,0,0,0.08)] flex flex-col justify-between items-start sticky top-0 z-10">
          <div className="w-[838px] inline-flex justify-between items-center">
            <div className="w-[490px] flex justify-start items-center gap-2">
              <div
                className={`w-12 h-12  ${document.content_type?.includes("pdf") ? "bg-red-100" : "bg-blue-100"} rounded flex items-center justify-center`}
              >
                {document.content_type?.includes("image") ? (
                  <img src={PNGIcon} alt="" />
                ) : document.content_type?.includes("pdf") ? (
                  <img src={PDFIcon} alt="" />
                ) : document.content_type?.includes("csv") ? (
                  <img src={CSVIcon} alt="" />
                ) : (
                  <img src={PDFIcon} alt="" />
                )}
              </div>

              <div className="inline-flex flex-col justify-center items-start gap-1">
                <div className="text-[#374151] text-base font-weight-600">
                  {document.original_filename}
                </div>
                <div className="text-[#6B7280] text-xs font-weight-300">
                  {fileSizeLabel} • Uploaded{" "}
                  {document.created_at
                    ? (parseServerDate(document.created_at)?.toLocaleString() ?? "-")
                    : ""}
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="px-10 py-4 bg-blue-500 rounded text-white text-base font-medium"
            >
              Close
            </button>
          </div>

          <div className="inline-flex justify-start items-start gap-6">
            {["File Preview", "Meta Data", "Version History", "Audit Log"].map(
              (tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className="inline-flex flex-col justify-start items-start gap-2"
                >
                  <div
                    className={`text-sm ${
                      activeTab === tab ? "text-neutral-900" : "text-blue-500"
                    }`}
                  >
                    {tab}
                  </div>
                  <div
                    className={`h-0 ${
                      activeTab === tab
                        ? "w-full outline outline-2 outline-offset-[-1px] outline-blue-500"
                        : ""
                    }`}
                  />
                </button>
              ),
            )}
          </div>
        </div>

        <div className="px-[37px] pt-8 pb-12">
          <div className="flex justify-end items-center gap-3 mb-6">
            <button
              onClick={handleDownload}
              className="h-8 px-3 py-2 rounded flex justify-center items-center gap-2.5 text-[#3B82F6] hover:bg-blue-50"
            >
              <img src={DownloadIcon} alt="" />

              <span className="text-sm text-blue-500">Download</span>
            </button>

            <button
              onClick={handleShare}
              className="h-8 px-3 py-2 rounded flex justify-center items-center gap-2.5 text-[#3B82F6] hover:bg-blue-50"
            >
              <img src={ShareIcon} alt="" />
              <span className="text-sm text-blue-500">Share</span>
            </button>
          </div>
          {activeTab === "File Preview" && (
            <div className="w-[844px] bg-white rounded-xl">
              {isPreviewLoading ? (
                <PreviewLoader />
              ) : previewData?.type === "pdf" ? (
                <div className="w-full bg-white flex flex-col items-center gap-6">
                  {previewData.pages?.map((page: any) => (
                    <div
                      key={page.page}
                      className="w-full bg-white flex justify-center"
                    >
                      <img
                        src={page.image}
                        alt={`Page ${page.page}`}
                        className="w-full max-w-[780px] h-auto object-contain bg-white rounded"
                      />
                    </div>
                  ))}
                </div>
              ) : previewData?.type === "image" ? (
                <div className="w-full bg-white flex justify-center items-center">
                  <img
                    src={previewUrl}
                    alt={document.file_name}
                    className="max-w-[560px] max-h-[420px] object-contain rounded bg-white"
                  />
                </div>
              ) : previewData?.type === "csv" ? (
                <div className="w-full bg-white rounded border border-neutral-200 overflow-hidden">
                  <div className="max-h-[520px] overflow-auto bg-white">
                    <table className="w-full text-sm text-left border-collapse">
                      <thead className="bg-neutral-50 sticky top-0 z-10">
                        <tr>
                          {(previewData.headers || []).map(
                            (header: string, index: number) => (
                              <th
                                key={index}
                                className="px-4 py-3 border-b border-neutral-200 text-neutral-700 font-weight-600 whitespace-nowrap"
                              >
                                {header || `Column ${index + 1}`}
                              </th>
                            ),
                          )}
                        </tr>
                      </thead>

                      <tbody>
                        {(previewData.rows || []).map(
                          (row: any[], rowIndex: number) => (
                            <tr
                              key={rowIndex}
                              className="border-b border-neutral-100"
                            >
                              {(row || []).map(
                                (cell: any, cellIndex: number) => (
                                  <td
                                    key={cellIndex}
                                    className="px-4 py-3 text-neutral-600 whitespace-nowrap"
                                  >
                                    {cell || "-"}
                                  </td>
                                ),
                              )}
                            </tr>
                          ),
                        )}
                      </tbody>
                    </table>
                  </div>

                  {previewData.total_rows > previewData.preview_rows && (
                    <div className="px-4 py-3 bg-neutral-50 text-xs text-neutral-500 border-t border-neutral-200">
                      Showing first {previewData.preview_rows} rows of{" "}
                      {previewData.total_rows} rows.
                    </div>
                  )}
                </div>
              ) : previewData?.type === "unsupported" ? (
                <div className="text-[#9CA3AF] text-sm">
                  Preview is not available for this file type.
                </div>
              ) : (
                <div className="text-[#EF4444] text-sm">
                  Unable to load preview.
                </div>
              )}
            </div>
          )}

          {activeTab === "Meta Data" && (
            <div className="w-[841px] flex flex-col gap-10">
              <div className="flex flex-col gap-6">
                <div className="text-[#374151] text-base font-weight-600">
                  File Information
                </div>

                <div className="flex flex-col gap-2 w-full">
                  {[
                    ["File Name", document.file_name],
                    [
                      "File Type",
                      document.file_extension || document.content_type || "-",
                    ],
                    ["Size", fileSizeLabel],
                    ["Category", document.category || "-"],
                    [
                      "Case ID",
                      document.claim_id === parseInt(claimId)
                        ?  caseReference
                        : "USER-202605-0015",
                     ,
                    ],

                    ["Current Version", `v${document.version || 1}`],
                  ].map(([label, value], idx) => (
                    <div key={idx} className="flex flex-col gap-2">
                      <div className="w-[556px] inline-flex justify-between items-center">
                        <div className="w-48 text-[#374151] text-sm">
                          {label}
                        </div>
                        <div className="w-48 text-[#374151] text-sm">
                          {value}
                        </div>
                      </div>
                      <div className="self-stretch h-0 outline outline-1 outline-offset-[-0.50px] outline-[#E5E7EB]" />
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-6">
                <div className="text-[#374151] text-base font-weight-600">
                  Upload Information
                </div>

                <div className="flex flex-col gap-2">
                  {[
                    [
                      "Uploaded By",
                      JSON.parse(localStorage.getItem("activeUser"))?.email || "-",
                    ],
                    [
                      "Upload Date Time",
                      document.created_at
                        ? (parseServerDate(document.created_at)?.toLocaleString() ?? "-")
                        : "-",
                    ],
                  ].map(([label, value], idx) => (
                    <div key={idx} className="flex flex-col gap-2">
                      <div className="w-[556px] inline-flex justify-between items-center">
                        <div className="w-48 text-[#374151] text-sm">
                          {label}
                        </div>
                        <div className="w-48 text-[#374151] text-sm">
                          {value}
                        </div>
                      </div>
                      <div className="self-stretch h-0 outline outline-1 outline-offset-[-0.50px] outline-[#E5E7EB]" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "Version History" && (
            <div className="w-[841px] flex flex-col gap-6">
              <div className="text-[#374151] text-base font-weight-600">
                Version History
              </div>

              {getDocumentVersions().length > 0 ? (
                getDocumentVersions().map((version: any) => (
                  <div
                    key={version.id}
                    className={`self-stretch p-4 rounded-lg flex flex-col gap-2 ${
                      version.isCurrent
                        ? "bg-blue-100 outline outline-1 outline-blue-300"
                        : "bg-[#F9FAFB] outline outline-1 outline-neutral-100"
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div className="text-[#374151] text-base font-weight-600">
                        Version {version.calculatedVersion}
                      </div>

                      {version.isCurrent && (
                        <span className="px-2 py-1 bg-blue-500 text-white rounded text-xs font-weight-500">
                          Current
                        </span>
                      )}
                    </div>

                    <div className="text-[#374151] text-sm font-weight-400">
                      {version.original_filename || version.file_name}
                    </div>

                    <div className="text-[#374151] text-sm">
                      Uploaded by{" "}
                      {version.created_by_name || version.uploaded_by_name || version.created_by || "-"}
                    </div>

                    <div className="text-[#6B7280] text-sm font-weight-300">
                      {formatDateTime(version.created_at)}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-[#9CA3AF] text-sm">
                  No version history available.
                </div>
              )}
            </div>
          )}

          {activeTab === "Audit Log" && (
            <div className="w-[841px] flex flex-col gap-6">
              <div className="text-[#374151] text-base font-weight-600">
                Audit Log
              </div>

              {(document.versions || []).length > 0 ? (
                (document.versions || []).map((version: any) => (
                  <div
                    key={version.id}
                    className="self-stretch p-4 bg-blue-100 rounded-lg flex flex-col gap-2"
                  >
                    <div className="text-[#374151] text-base font-weight-600">
                      Upload
                    </div>
                    <div className="text-[#374151] text-sm">
                      Uploaded by{" "}
                      {JSON.parse(localStorage.getItem("activeUser"))?.email || "-"}
                      {/* {version.created_by_name || version.created_by || "-"} */}
                    </div>
                    <div className="text-[#374151] text-sm">
                      {version.created_at
                        ? (parseServerDate(version.created_at)?.toLocaleString() ?? "-")
                        : "-"}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-[#9CA3AF] text-sm">
                  No audit logs available.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      {emailActionModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30">
          <div className="w-[720px] max-w-[95vw] bg-white rounded overflow-hidden flex flex-col">
            <div className="h-12 px-5 py-8 bg-white border-b border-neutral-200 flex items-center justify-between">
              <h2 className="text-[18px] font-weight-600 text-neutral-800 flex items-center gap-2">
                <img src={ForwardIcon} alt="" className="w-4 h-4" />
                Forward
              </h2>

              <button
                onClick={() => {
                  setEmailActionModal(false);
                  setEmailComment("");
                  setForwardToEmail("");
                  setSelectedEmailFiles([]);
                }}
                className="text-neutral-400 hover:text-neutral-700 text-xl"
              >
                ×
              </button>
            </div>

            <div className="p-5 flex flex-col gap-3">
              <div className="flex items-center gap-3 border-b border-neutral-100 pb-2">
                <span className="w-16 text-sm text-neutral-500">To</span>
                <input
                  value={forwardToEmail}
                  onChange={(e) => setForwardToEmail(e.target.value)}
                  placeholder="Enter recipient email"
                  className="flex-1 outline-none text-sm text-neutral-800"
                />
              </div>

              <div className="flex items-center gap-3 border-b border-neutral-100 pb-2">
                <span className="w-16 text-sm text-neutral-500">Subject</span>
                <input
                  readOnly
                  value={getShareSubject()}
                  className="flex-1 outline-none text-sm text-neutral-800 bg-transparent"
                />
              </div>

              <div className="self-stretch min-h-[190px] px-5 pt-4 pb-4 bg-white border-b border-neutral-100 flex flex-col gap-4">
                <textarea
                  value={emailComment}
                  onChange={(e) => setEmailComment(e.target.value)}
                  placeholder="Write your message..."
                  className="w-full min-h-[80px] resize-none outline-none border-none bg-transparent text-neutral-800 text-sm leading-6 placeholder:text-neutral-300 placeholder:font-light"
                />

                <div className="p-4 rounded flex flex-col gap-3 text-center items-center">
                  <p className="text-sm text-neutral-700">
                    You can view the shared document by clicking the button
                    below.
                  </p>

                  <button
                    type="button"
                    onClick={() =>
                      shareUrl &&
                      window.open(shareUrl, "_blank", "noopener,noreferrer")
                    }
                    className="text-center w-fit px-5 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm font-weight-500"
                  >
                    View PDF
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <div className="flex items-center gap-2.5 h-10 px-4 rounded bg-blue-50 text-blue-500 w-fit">
                  <img src={attachmentt} alt="" />
                  <span className="text-sm font-weight-300">
                    {document?.file_name}
                  </span>
                </div>

                {selectedEmailFiles.map((file, index) => (
                  <div
                    key={`${file.name}-${index}`}
                    className="flex items-center gap-2.5 h-10 px-4 rounded bg-neutral-50 text-neutral-600 w-fit"
                  >
                    <img src={attachmentt} alt="" />
                    <span className="text-sm font-weight-300">{file.name}</span>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-neutral-200">
                <label className="px-10 py-4 font-weight-600 rounded border border-blue-500 bg-white flex items-center gap-2 cursor-pointer hover:bg-neutral-50 text-blue-500 text-sm">
                  <img src={attachmentt} alt="" />
                  <span>Attach</span>

                  <input
                    type="file"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      setSelectedEmailFiles((prev) => [...prev, ...files]);
                    }}
                  />
                </label>

                <button
                  type="button"
                  disabled={emailSending || !forwardToEmail.trim() || !shareUrl}
                  onClick={async () => {
                    try {
                      setEmailSending(true);

                      await sendDocumentForwardEmail();

                      setEmailActionModal(false);
                      setEmailComment("");
                      setForwardToEmail("");
                      setSelectedEmailFiles([]);

                      toast.success("Email forwarded successfully.");
                    } catch (error) {
                      console.error("Document share email failed:", error);
                      toast.error("Failed to send email.");
                    } finally {
                      setEmailSending(false);
                    }
                  }}
                  className="px-10 py-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded text-base font-weight-400 transition-colors"
                >
                  {emailSending ? "Sending..." : "Send"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DocumentLibrarySlider;
             