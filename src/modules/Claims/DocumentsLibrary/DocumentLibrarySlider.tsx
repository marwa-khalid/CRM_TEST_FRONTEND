import React, { useEffect, useMemo, useState } from "react";
import { Download, Link, FileText, Image as ImageIcon } from "lucide-react";
import {
  createDocumentShareLink,
  getDocumentPresignedUrl,
  registerDocumentDownload,
  registerDocumentPreview,
} from "../../../services/DocumentLibrary/DocumentLibrary";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  document: any;
}

const DocumentLibrarySlider: React.FC<Props> = ({
  isOpen,
  onClose,
  document,
}) => {
  const [activeTab, setActiveTab] = useState("File Preview");
  const [previewUrl, setPreviewUrl] = useState("");

  useEffect(() => {
    if (isOpen && document?.id) {
      registerDocumentPreview(document.id).catch(console.error);
    }
  }, [isOpen, document?.id]);

  useEffect(() => {
    const loadPreviewUrl = async () => {
      if (isOpen && document?.id) {
        try {
          const res = await getDocumentPresignedUrl(document.id);
          setPreviewUrl(res.url);
        } catch (e) {
          console.error(e);
          setPreviewUrl("");
        }
      } else {
        setPreviewUrl("");
      }
    };

    loadPreviewUrl();
  }, [isOpen, document?.id]);

  const fileSizeLabel = useMemo(() => {
    const size = document?.file_size_bytes || 0;
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(2)} KB`;
    return `${(size / (1024 * 1024)).toFixed(2)} MB`;
  }, [document?.file_size_bytes]);

  const isImage = document?.content_type?.includes("image");
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
      await navigator.clipboard.writeText(res.url);
      alert("Share link copied");
    } catch (e) {
      console.error(e);
    }
  };

  const displayUploadedBy =
    document?.created_by_name ||
    document?.uploaded_by_name ||
    document?.created_by ||
    "-";

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />

      <div className="fixed top-0 right-0 h-full w-[918px] bg-white z-50 shadow-2xl font-['Stack_Sans_Headline'] overflow-y-auto">
        <div className="w-full h-36 px-10 pt-5 bg-white shadow-[0px_4px_20px_0px_rgba(0,0,0,0.08)] flex flex-col justify-between items-start sticky top-0 z-10">
          <div className="w-[838px] inline-flex justify-between items-center">
            <div className="w-[490px] flex justify-start items-center gap-2">
              <div className="w-12 h-12 bg-[#EBF5FF] rounded flex items-center justify-center">
                {isImage ? (
                  <ImageIcon className="w-6 h-6 text-[#93C5FD]" />
                ) : (
                  <FileText className="w-6 h-6 text-[#93C5FD]" />
                )}
              </div>

              <div className="inline-flex flex-col justify-center items-start gap-1">
                <div className="text-[#374151] text-base font-weight-600">
                  {document.file_name}
                </div>
                <div className="text-[#6B7280] text-xs font-weight-300">
                  {fileSizeLabel} • Uploaded{" "}
                  {document.created_at
                    ? new Date(document.created_at).toLocaleString()
                    : ""}
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="px-10 py-4 bg-[#3B82F6] rounded text-white text-base font-medium"
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
                      activeTab === tab ? "text-[#111827]" : "text-[#3B82F6]"
                    }`}
                  >
                    {tab}
                  </div>
                  <div
                    className={`h-0 ${
                      activeTab === tab
                        ? "w-full outline outline-2 outline-offset-[-1px] outline-[#3B82F6]"
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
              <Download className="w-4 h-4" />
              <span className="text-sm">Download</span>
            </button>

            <button
              onClick={handleShare}
              className="h-8 px-3 py-2 rounded flex justify-center items-center gap-2.5 text-[#3B82F6] hover:bg-blue-50"
            >
              <Link className="w-4 h-4" />
              <span className="text-sm">Share</span>
            </button>
          </div>

          {activeTab === "File Preview" && (
            <div className="w-[844px] min-h-[820px] bg-[#F3F4F6] rounded-xl flex items-center justify-center overflow-hidden">
              {!previewUrl ? (
                <div className="text-[#9CA3AF] text-sm">Loading preview...</div>
              ) : isPdf ? (
                <iframe
                  src={`${previewUrl}#toolbar=0&navpanes=0&scrollbar=0`}
                  title={document.file_name}
                  className="w-full h-[820px] rounded-xl border-0"
                />
              ) : isImage ? (
                <img
                  src={previewUrl}
                  alt={document.file_name}
                  className="max-w-full max-h-[820px] object-contain"
                />
              ) : (
                <div className="text-[#9CA3AF] text-sm">File Preview</div>
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
                    ["Case ID", localStorage.getItem("CaseReference")],

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
                    ["Uploaded By",                       JSON.parse(localStorage.getItem("activeUser")).email
],
                    [
                      "Upload Date Time",
                      document.created_at
                        ? new Date(document.created_at).toLocaleString()
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

              {(document.versions || []).length > 0 ? (
                (document.versions || []).map((version: any) => (
                  <div
                    key={version.id}
                    className="self-stretch p-4 bg-[#EBF5FF] rounded-lg flex flex-col gap-2"
                  >
                    <div className="text-[#374151] text-base font-weight-600">
                      Version {version.version}
                    </div>
                    <div className="text-[#374151] text-sm">
                      Uploaded by{" "}
                      {JSON.parse(localStorage.getItem("activeUser")).email}
                      {/* {version.created_by_name || version.created_by || "-"} */}
                    </div>
                    <div className="text-[#374151] text-sm">
                      {version.created_at
                        ? new Date(version.created_at).toLocaleString()
                        : "-"}
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
                    className="self-stretch p-4 bg-[#EBF5FF] rounded-lg flex flex-col gap-2"
                  >
                    <div className="text-[#374151] text-base font-weight-600">
                      Upload
                    </div>
                    <div className="text-[#374151] text-sm">
                      Uploaded by{" "}
                      {JSON.parse(localStorage.getItem("activeUser")).email}
                      {/* {version.created_by_name || version.created_by || "-"} */}
                    </div>
                    <div className="text-[#374151] text-sm">
                      {version.created_at
                        ? new Date(version.created_at).toLocaleString()
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
    </>
  );
};

export default DocumentLibrarySlider;
             