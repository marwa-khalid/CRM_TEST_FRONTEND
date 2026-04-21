import { useEffect, useMemo, useState, useRef } from "react";
import {
  Search,
  FileText,
  Image as ImageIcon,
  Cpu,
  Users,
  User,
  Eye,
  Download,
  Link,
  History,
  ChevronLeft,
} from "lucide-react";
import {
  getDocumentLibrary,
  getDocumentDetail,
  uploadLibraryDocument,
  createDocumentShareLink,
  registerDocumentDownload,
} from "../../../services/DocumentLibrary/DocumentLibrary";
import DocumentLibrarySlider from "./DocumentLibrarySlider";

const DocumentsLibrary = () => {
  const [activeTab, setActiveTab] = useState("Show All");
  const [searchQuery, setSearchQuery] = useState("");
  const [documents, setDocuments] = useState<any[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<any>(null);
  const [isSliderOpen, setIsSliderOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const claimId = localStorage.getItem("claimId");

  const categories = [
    { name: "Show All", icon: null },
    {
      name: "Claim Entrance Documents",
      icon: <FileText className="w-4 h-4" />,
    },
    { name: "Photos", icon: <ImageIcon className="w-4 h-4" /> },
    { name: "AI Reports", icon: <Cpu className="w-4 h-4" /> },
    {
      name: "Witness Questionnaires Responses",
      icon: <Users className="w-4 h-4" />,
    },
    { name: "User Uploads", icon: <User className="w-4 h-4" /> },
  ];

  const loadDocuments = async () => {
    if (!claimId) return;
    try {
      const data = await getDocumentLibrary(claimId);
      setDocuments(data || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, [claimId]);

  const filteredDocs = useMemo(() => {
    return documents.filter((doc) => {
      const matchesTab = activeTab === "Show All" || doc.category === activeTab;
      const matchesSearch = doc.file_name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      return matchesTab && matchesSearch;
    });
  }, [documents, activeTab, searchQuery]);

  const openDetail = async (documentId: number) => {
    try {
      const detail = await getDocumentDetail(documentId);
      setSelectedDocument(detail);
      setIsSliderOpen(true);
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !claimId) return;

    const formData = new FormData();
    formData.append("claim_id", String(claimId));
    formData.append(
      "category",
      activeTab === "Show All" ? "User Uploads" : activeTab,
    );
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

  return (
    <div className="w-full min-h-screen bg-white font-['Stack_Sans_Headline']">
      <DocumentLibrarySlider
        isOpen={isSliderOpen}
        onClose={() => setIsSliderOpen(false)}
        document={selectedDocument}
      />

      <div className="w-full px-10 py-5 bg-white shadow-[0px_4px_20px_0px_rgba(0,0,0,0.08)] inline-flex justify-between items-center">
        <div className="inline-flex flex-col justify-center items-start gap-2">
          <div className="inline-flex justify-start items-center gap-1 cursor-pointer">
            <ChevronLeft className="w-4 h-4 text-[#3B82F6]" />
            <div className="text-[#3B82F6] text-xs font-weight-600">
              Back to Claim Details
            </div>
          </div>
          <div className="text-black text-2xl font-weight-600 leading-6">
            Documents Library
          </div>
        </div>

        <div className="flex justify-start items-center gap-5">
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleUpload}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-10 py-4 bg-[#3B82F6] rounded flex justify-center items-center text-white text-base font-weight-400 hover:bg-blue-600 transition"
          >
            Upload Document
          </button>
        </div>
      </div>

      <div className="flex flex-col items-center py-20">
        <div className="w-[1000px] mb-6">
          <div className="w-full px-5 py-4 bg-white rounded border border-[#E5E7EB] flex items-center gap-3">
            <Search className="w-5 h-5 text-gray-400 font-light" />
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
          {categories.map((cat) => (
            <button
              key={cat.name}
              onClick={() => setActiveTab(cat.name)}
              className={`px-3 py-2 rounded flex items-center gap-2 text-sm transition-all border ${
                activeTab === cat.name
                  ? "bg-[#3B82F6] border-[#3B82F6] text-white"
                  : "bg-[#EBF5FF] border-transparent text-[#3B82F6]"
              }`}
            >
              {cat.icon}
              <span className="font-weight-300 font-light">{cat.name}</span>
            </button>
          ))}
        </div>

        <div className="w-[1003px] flex flex-col gap-5">
          {filteredDocs.map((doc) => (
            <div
              key={doc.id}
              className="w-full p-4 rounded-lg border border-[#F3F4F6] flex justify-between items-center hover:bg-gray-50 transition"
            >
              <div className="flex items-start gap-6">
                <div className="w-12 h-12 bg-[#EBF5FF] rounded flex items-center justify-center shrink-0">
                  {doc.content_type?.includes("image") ? (
                    <ImageIcon className="w-6 h-6 text-[#93C5FD]" />
                  ) : (
                    <FileText className="w-6 h-6 text-[#93C5FD]" />
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  <h3 className="text-[#374151] text-base font-weight-400 leading-4">
                    {doc.file_name}
                  </h3>
                  <p className="text-[#6B7280] text-sm font-weight-300 font-light">
                    {doc.file_size_bytes
                      ? `${(doc.file_size_bytes / 1024).toFixed(2)} KB`
                      : "0 KB"}{" "}
                    • {doc.created_by || "-"} •{" "}
                    {doc.created_at
                      ? new Date(doc.created_at).toLocaleString()
                      : ""}
                  </p>

                  <div className="flex gap-1.5">
                    {[doc.tag, doc.category].filter(Boolean).map((tag) => (
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
                  icon={<Eye size={16} />}
                  label="Preview"
                  onClick={() => openDetail(doc.id)}
                />
                <ActionButton
                  icon={<Download size={16} />}
                  label="Download"
                  onClick={() => window.open(doc.file_url, "_blank")}
                />
                <ActionButton
                  icon={<Link size={16} />}
                  label="Share"
                  onClick={() => openOutlookShare(doc)}
                />
                <ActionButton
                  icon={<History size={16} />}
                  label="Version"
                  onClick={() => openDetail(doc.id)}
                />
              </div>
            </div>
          ))}
        </div>
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
    {icon}
    <span className="text-sm font-weight-300 font-light">{label}</span>
  </button>
);

export default DocumentsLibrary;
