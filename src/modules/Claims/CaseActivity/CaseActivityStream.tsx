import React, { useEffect, useMemo, useState } from "react";
import {
  Mail,
  FileText,
  User,
  Upload,
  Edit3,
  Search,
  ChevronLeft,
  Paperclip,
  Clock,
  History,
  Eye,
} from "lucide-react";
import ActivityDetailSlider from "./CaseActivityDetail";
import { getCaseActivity } from "../../../services/HistoryActivities/HistoryActivities";

type ActivityType =
  | "All"
  | "Email"
  | "Witness"
  | "Update"
  | "Upload"
  | "Note"
  | "AI Report"
  | "System";

type AttachmentItem = {
  file_name?: string;
  file_url?: string;
  file_size?: string;
  case_document_id?: number | null;
};

type AIActivityData = {
  badge?: string;
  system_name?: string;
  system_email?: string;
  client_name?: string;
  image_name?: string;
  assessment_type?: string;
  prediction_count?: number;
  high_severity_count?: number;
  vehicle_type?: string;
  damage_severity?: string;
  estimated_repair_cost?: string;
  recommended_action?: string;
  fraud_risk_score?: string;
  detail_summary?: string;
  document_library_id?: number | null;
  case_document_id?: number | null;
  report_pdf_url?: string;
  report_pdf_s3_key?: string;
  viewer_type?: string;
  generated_at?: string;
  uploaded_by?: string;
  document_type?: string;
};

type ActivityItem = {
  id: number | string;
  type: Exclude<ActivityType, "All">;
  history_file_type?: string;
  title: string;
  timestamp?: string;
  summary?: string;
  detail_text?: string;
  created_by_name?: string;
  attachments?: AttachmentItem[];

  subject?: string;
  sender_name?: string;
  sender_email?: string;
  received_at?: string;
  body_preview?: string;
  body_text?: string;

  meta?: Record<string, any>;
  ai?: AIActivityData;
};

const CaseActivityStream = () => {
  const [filter, setFilter] = useState<ActivityType>("All");
  const [search, setSearch] = useState("");
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [isSliderOpen, setIsSliderOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<ActivityItem | null>(
    null,
  );

  const claimId = localStorage.getItem("claimId");

  const filterButtons = [
    { label: "Show All", type: "All", icon: null },
    { label: "Emails", type: "Email", icon: <Mail size={14} /> },
    { label: "AI Reports", type: "AI Report", icon: <FileText size={14} /> },
    { label: "Witness", type: "Witness", icon: <User size={14} /> },
    { label: "Uploads", type: "Upload", icon: <Upload size={14} /> },
    { label: "Notes", type: "Note", icon: <Edit3 size={14} /> },
    { label: "Updates", type: "Update", icon: <History size={14} /> },
  ];

  const normalizeActivity = (row: any): ActivityItem => {
    const meta = row?.meta || {};
    const type = (row?.type || "System") as Exclude<ActivityType, "All">;
    const title = row?.title || "System Activity";

    const isInstructEngineerEmail =
      type === "Email" &&
      title.toLowerCase().includes("instruct engineer");

    if (isInstructEngineerEmail) {
      return {
        id: row?.id,
        type: "Email",
        history_file_type: row?.history_file_type || "",
        title: row?.title || "Instructing Engineer - Dean-202603-00004",
        timestamp: row?.timestamp || row?.received_at || "",
        summary: "",
        detail_text: "",
        created_by_name: row?.created_by_name || "",
        attachments: [
          {
            file_name: "New Instruction.pdf",
            file_url: "#",
            file_size: "",
            case_document_id: null,
          },
        ],
        subject: "Instructing Engineer - Dean-202603-00004",
        sender_name: "No-Reply",
        sender_email: "noreplynationwideassist@yopmail.com via sendgrid.net",
        received_at: row?.received_at || row?.timestamp || "",
        body_preview: "Dear Sir, Please find attached our new instruction.",
        body_text: `Dear Sir,

Please find attached our new instruction.

If you are not able to inspect the Client's vehicle within 48 working hours from the date of the instruction please notify us immediately.

If you have any queries, please contact us on the number below.

Regards,
Ruby Uddin
Nationwide Assist Team`,
        meta: row?.meta || {},
      };
    }

    const ai: AIActivityData | undefined =
      type === "AI Report"
        ? {
            badge: meta?.badge || "AI Report",
            system_name: row?.sender_name || "AI Analysis System",
            system_email: row?.sender_email || "system@claimflow.ai",
            client_name: meta?.client_name || "Imran Dean",
            image_name: meta?.image_name || "",
            assessment_type: meta?.assessment_type || "Client vehicle only",
            prediction_count: meta?.prediction_count || 1,
            high_severity_count: meta?.high_severity_count || 1,
            vehicle_type: meta?.vehicle_type || "Toyota Camry",
            damage_severity: meta?.damage_severity || "High",
            estimated_repair_cost: meta?.estimated_repair_cost || "-",
            recommended_action: meta?.recommended_action || "Repair",
            fraud_risk_score: meta?.fraud_risk_score || "-",
            detail_summary:
              meta?.detail_summary ||
              row?.detail_text ||
              "Detailed findings indicate damage requiring repair.",
            document_library_id:
              meta?.document_library_id || meta?.case_document_id || null,
            case_document_id:
              meta?.case_document_id || meta?.document_library_id || null,
            report_pdf_url:
              meta?.report_pdf_url || row?.attachments?.[0]?.file_url || "",
            report_pdf_s3_key: meta?.report_pdf_s3_key || "",
            viewer_type: meta?.viewer_type || "slider",
            generated_at: meta?.generated_at || row?.timestamp || "",
            uploaded_by: meta?.uploaded_by || row?.created_by_name || "",
            document_type: meta?.document_type || "ai_report",
          }
        : undefined;

    return {
      id: row?.id,
      type,
      history_file_type: row?.history_file_type || "",
      title,
      timestamp: row?.timestamp || row?.received_at || "",
      summary: row?.summary || "",
      detail_text: row?.detail_text || "",
      created_by_name: row?.created_by_name || "",
      attachments: Array.isArray(row?.attachments) ? row.attachments : [],
      subject: row?.subject || "",
      sender_name: row?.sender_name || "",
      sender_email: row?.sender_email || "",
      received_at: row?.received_at || row?.timestamp || "",
      body_preview: row?.body_preview || "",
      body_text: row?.body_text || "",
      meta,
      ai,
    };
  };

  useEffect(() => {
    const fetchActivity = async () => {
      if (!claimId) return;

      try {
        const items = await getCaseActivity(parseInt(claimId, 10));
        const normalized = Array.isArray(items)
          ? items.map(normalizeActivity)
          : [];
        setActivities(normalized);
      } catch (error) {
        console.error("Failed to fetch case activity:", error);
        setActivities([]);
      }
    };

    fetchActivity();
  }, [claimId]);

  const handleOpenDetail = (activity: ActivityItem) => {
    setSelectedActivity(activity);
    setIsSliderOpen(true);
  };

  const handleAddNote = (activity: ActivityItem) => {
    console.log("Add note for activity:", activity);
    // alert("Next step: open Add Note modal and save note to history_activities.");
  };

  const handleViewInDocumentLibrary = (activity: ActivityItem) => {
    const documentId = activity.ai?.case_document_id;
    const fileUrl =
      activity.ai?.report_pdf_url || activity.attachments?.[0]?.file_url;

    if (documentId) {
      console.log("Open document library preview for case_document_id:", documentId);
      alert(`Next step: open Document Library preview for document ID ${documentId}.`);
      return;
    }

    if (fileUrl && fileUrl !== "#") {
      window.open(fileUrl, "_blank");
      return;
    }

    alert("No document library attachment found for this item.");
  };

  const handleForwardToClient = (activity: ActivityItem) => {
    console.log("Forward to client:", activity);
    alert("Next step: connect Outlook compose/draft endpoint.");
  };

  const filteredActivities = useMemo(() => {
    return activities.filter((act) => {
      const matchesFilter = filter === "All" || act.type === filter;

      const searchText = [
        act.title,
        act.summary,
        act.subject,
        act.sender_name,
        act.sender_email,
        act.detail_text,
        act.ai?.client_name,
        act.ai?.vehicle_type,
        act.ai?.damage_severity,
        act.history_file_type,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch = searchText.includes(search.toLowerCase());

      return matchesFilter && matchesSearch;
    });
  }, [activities, filter, search]);

  const formatDateTime = (dateStr?: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date
      .toLocaleString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
      .replace(",", "");
  };

  const getActivityConfig = (type: string) => {
    switch (type) {
      case "Email":
        return { label: "EMAIL", icon: <Mail size={16} /> };
      case "Witness":
        return { label: "WITNESS", icon: <User size={16} /> };
      case "Upload":
        return { label: "UPLOAD", icon: <Upload size={16} /> };
      case "Note":
        return { label: "NOTE", icon: <Edit3 size={16} /> };
      case "AI Report":
        return { label: "AI REPORT", icon: <FileText size={16} /> };
      case "Update":
        return { label: "UPDATE", icon: <History size={16} /> };
      default:
        return { label: "SYSTEM", icon: <Clock size={16} /> };
    }
  };

  return (
    <div className="flex flex-col w-full min-h-screen bg-white font-['Stack_Sans_Headline']">
      <ActivityDetailSlider
        isOpen={isSliderOpen}
        onClose={() => setIsSliderOpen(false)}
        data={selectedActivity}
        onAddNote={handleAddNote}
        onViewInDocumentLibrary={handleViewInDocumentLibrary}
        onForwardToClient={handleForwardToClient}
      />

      <header className="px-10 py-5 bg-white shadow-md border-b flex justify-between items-center sticky top-0 z-10">
        <div className="flex flex-col gap-1">
          <button className="flex items-center gap-1 text-blue-300 text-xs font-weight-600 hover:text-blue-500">
            <ChevronLeft size={16} /> Back to Claim Details
          </button>
          <h1 className="text-2xl font-weight-600 text-black uppercase">
            Case Activity Log
          </h1>
        </div>
      </header>

      <main className="max-w-6xl mx-auto w-full p-8">
        <div className="relative mb-6">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            size={20}
          />
          <input
            type="text"
            placeholder="Search Activity"
            className="w-full pl-12 pr-4 py-4 bg-white border border-gray-200 rounded text-base font-light focus:outline-none focus:ring-1 focus:ring-blue-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap gap-3 mb-10">
          {filterButtons.map((btn) => (
            <button
              key={btn.label}
              onClick={() => setFilter(btn.type as ActivityType)}
              className={`px-4 py-2 rounded flex items-center gap-2 text-sm transition-all ${
                filter === btn.type
                  ? "bg-blue-500 text-white shadow-md"
                  : "bg-blue-50 text-blue-500 hover:bg-blue-100"
              }`}
            >
              {btn.icon} {btn.label}
            </button>
          ))}
        </div>

        <div className="relative border-l border-gray-100 ml-4 pl-10 space-y-8">
          {filteredActivities.length > 0 ? (
            filteredActivities.map((activity) => {
              const config = getActivityConfig(activity.type);

              return (
                <div
                  key={activity.id}
                  className="relative group cursor-pointer"
                  onClick={() => handleOpenDetail(activity)}
                >
                  <div className="absolute -left-[53px] top-0 p-2 rounded-md border bg-blue-50 shadow-sm border-blue-100 text-blue-500">
                    {config.icon}
                  </div>

                  <div className="bg-white border border-gray-100 rounded-lg p-5 shadow-sm hover:shadow-md hover:border-gray-300 transition-all">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-3">
                        <span className="px-2 py-1 bg-neutral-100 rounded text-xs font-weight-600 text-neutral-700">
                          {config.label === "AI REPORT" ? "AI Report" : config.label}
                        </span>
                        <h3 className="font-weight-600 text-black text-lg">
                          {activity.title}
                        </h3>
                      </div>
                      <span className="text-sm text-gray-400 font-light">
                        {formatDateTime(activity.timestamp)}
                      </span>
                    </div>

                    {activity.type === "AI Report" ? (
                      <div className="flex flex-col gap-3">
                        <div className="text-sm text-neutral-700 flex items-center gap-3">
                          <span className="font-weight-600">
                            {activity.ai?.system_name || "AI Analysis System"}
                          </span>
                          <span className="text-neutral-500">
                            {activity.ai?.system_email || "system@claimflow.ai"}
                          </span>
                        </div>

                        <div className="mt-1 p-4 bg-neutral-100 rounded-lg text-sm text-neutral-700 whitespace-pre-line">
                          <div className="mb-3 font-weight-400">Analysis Summary:</div>
                          <div>· Vehicle Type: {activity.ai?.vehicle_type || "-"}</div>
                          <div>· Damage Severity: {activity.ai?.damage_severity || "-"}</div>
                          <div>
                            · Estimated Repair Cost:{" "}
                            {activity.ai?.estimated_repair_cost || "-"}
                          </div>
                          <div>
                            · Recommended Action:{" "}
                            {activity.ai?.recommended_action || "-"}
                          </div>
                          <div>· Fraud Risk Score: {activity.ai?.fraud_risk_score || "-"}</div>

                          {activity.ai?.detail_summary && (
                            <div className="mt-4">{activity.ai.detail_summary}</div>
                          )}
                        </div>

                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewInDocumentLibrary(activity);
                            }}
                            className="inline-flex items-center gap-2 text-blue-500 hover:text-blue-700 text-sm"
                          >
                            <Eye size={16} />
                            View attachment in Document Library
                          </button>
                        </div>
                      </div>
                    ) : activity.type === "Email" ? (
                      <div className="flex flex-col gap-1">
                        <div className="text-sm text-neutral-700">
                          <span className="font-weight-300">Subject: </span>
                          <span className="font-weight-600">{activity.subject || "-"}</span>
                        </div>
                        <div className="text-sm text-neutral-700">
                          <span className="font-weight-300">From: </span>
                          <span className="font-weight-600">
                            {activity.sender_name || activity.sender_email || "-"}
                          </span>
                        </div>
                        <div className="text-sm text-neutral-700">
                          <span className="font-weight-300">Received: </span>
                          <span className="font-weight-600">
                            {formatDateTime(activity.received_at || activity.timestamp)}
                          </span>
                        </div>

                        <div className="mt-2 p-2 bg-neutral-100 rounded-lg text-sm text-neutral-700 whitespace-pre-line">
                          {activity.body_preview || activity.body_text || ""}
                        </div>

                        {activity.attachments?.length > 0 && (
                          <div className="mt-2 inline-flex items-center gap-2.5 h-8 px-3 py-2 rounded text-blue-300">
                            <Paperclip size={16} />
                            <span className="text-sm font-weight-300">
                              {activity.attachments.length} Attachment
                              {activity.attachments.length > 1 ? "s" : ""}
                            </span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <>
                        {activity.summary && (
                          <div className="text-sm text-neutral-700">{activity.summary}</div>
                        )}

                        {activity.type === "Upload" &&
                          activity.attachments?.length > 0 && (
                            <div className="mt-3">
                              <a
                                href={activity.attachments[0]?.file_url || "#"}
                                target="_blank"
                                rel="noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="inline-flex items-center gap-2.5 h-8 px-3 py-2 rounded text-blue-300 hover:bg-blue-50"
                              >
                                <Paperclip size={16} />
                                <span className="text-sm font-weight-300">
                                  {activity.attachments[0]?.file_name || "Attachment"}
                                </span>
                              </a>
                            </div>
                          )}

                        {activity.type !== "Upload" && activity.detail_text && (
                          <div className="mt-3 bg-neutral-100 rounded-lg p-4 text-sm text-neutral-700 whitespace-pre-line">
                            {activity.detail_text}
                          </div>
                        )}

                        {activity.created_by_name && (
                          <div className="mt-4 flex items-center gap-2 text-neutral-400 text-xs">
                            <User size={12} /> Updated by: {activity.created_by_name}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-20 text-gray-400 italic">
              No activities found matching your search or filters.
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default CaseActivityStream;