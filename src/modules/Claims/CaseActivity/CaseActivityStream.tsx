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
  Reply,
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
    { label: "Updates", type: "Update", icon: <History size={14} /> },
    { label: "Witness", type: "Witness", icon: <User size={14} /> },
    { label: "Uploads", type: "Upload", icon: <Upload size={14} /> },
    { label: "Notes", type: "Note", icon: <Edit3 size={14} /> },
  ];
// const extractClaimRef = (title = "") => {
//   const match = title.match(/for claim[- ](.+)$/i);
//   return match ? match[1].trim() : "";
// };

const toTitleCase = (value = "") =>
  value
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());

const shortUpdateTitle = (activity: any) => {
  const title = activity?.title || "";
  const type = activity?.history_file_type || "";
  const detailText = activity?.detail_text || "";

  if (type === "updated_insurer_broker") return "Insurer Broker Detail updated";
  if (type === "updated_client_detail") return "Client Detail updated";
  if (type === "updated_referrer_detail") return "Referrer Detail updated";
  if (type === "updated_solicitor_detail")
    return "Panel Solicitor Detail updated";
  if (type === "updated_vehicle_detail") return "Vehicle Detail updated";
  if (type === "updated_accident_detail") return "Accident Detail updated";
  if (type === "updated_driver_agreement")
    return title.toLowerCase().includes("file has been uploaded")
      ? `${detailText || "Driver document"} uploaded`
      : "Driver Document And Agreement updated";
  if (type === "updated_storage_recovery")
    return "Storage & Recovery Detail updated";
  if (type === "updated_engineer_detail") return "Engineer Detail updated";
  if (type === "updated_vehicle_owner") return "Vehicle Owner Detail updated";
  if (type === "updated_police_detail") return "Police Detail updated";
  if (type === "updated_passenger_detail") return "Passenger updated";
  if (type === "updated_general_detail") return "General Detail updated";

  if (type === "created_loss_detail") return "Total Loss Detail created";
  if (type === "created_police_detail") return "Police Detail created";
  if (type === "created_passenger_detail") return "Passenger created";
  if (type === "created_hire_vehicle") return "Hire Vehicle Detail created";
  if (type === "created_engineer_detail") return "Engineer Detail created";
  if (type === "created_storage_recovery") return "Storage & Recovery created";
  if (type === "created_third_insurer")
    return "Third Party Insurer Detail created";
  if (type === "created_driver_agreement")
    return "Driver Document And Agreement created";
  if (type === "created_repair_detail")
    return "Repair Costs & Route Detail created";
  if (type === "created_witness_detail") return "Witness created";

  if (
    type === "deativated_police_detail" ||
    type === "deactivated_police_detail"
  )
    return "Police Detail deactivated";
  if (
    type === "deativated_witness_detail" ||
    type === "deactivated_witness_detail"
  )
    return "Witness deactivated";
  if (
    type === "deativated_passenger_detail" ||
    type === "deactivated_passenger_detail"
  )
    return "Passenger deactivated";

  // fallback from sentence
  return title
    .replace(/^The\s+/i, "")
    .replace(/\s+has been\s+/i, " ")
    .replace(/\s+updated\s+for claim[- ].*$/i, " updated")
    .replace(/\s+created\s+for claim[- ].*$/i, " created")
    .replace(/\s+deactivated\s+for claim[- ].*$/i, " deactivated")
    .replace(/\s+downloaded\s+for claim[- ].*$/i, " downloaded")
    .trim();
};

const shortUploadTitle = (activity: any) => {
  const title = activity?.title || "";
  const type = activity?.history_file_type || "";
  const attachmentName =
    activity?.attachments?.[0]?.file_url ||
    activity?.attachments?.[0]?.file_name ||
    "";

  const quotedMatch = title.match(/"([^"]+)"/);
  if (quotedMatch) return `${quotedMatch[1]} uploaded`;

  if (type === "download_exemption_pdf") return "Fee Exemption PDF downloaded";
  if (type === "download_cil_client")
    return "Sent CIL To Client Document downloaded";
  if (type === "download_cil_letter") return "CIL Agreement Letter downloaded";
  if (type === "download_recovery_xlsx")
    return "Storage And Recovery XLSX downloaded";
  if (type === "download_mitigation_xlsx")
    return "Mitigation Questionnaire XLSX downloaded";
  if (type === "download_hire_xlsx")
    return "Hire Documentation Agreement XLSX downloaded";
  if (type === "download_vehicle_xlsx")
    return "Hire Vehicle Check Sheet XLSX downloaded";

  if (attachmentName) return `${attachmentName} uploaded`;

  return title
    .replace(/^The\s+/i, "")
    .replace(/\s+has been uploaded\s+for claim[- ].*$/i, " uploaded")
    .replace(/\s+downloaded\s+for claim[- ].*$/i, " downloaded")
    .trim();
};

const shortEmailTitle = (activity: any) => {
  const type = activity?.history_file_type || "";
  const claimRef = extractClaimRef(activity?.title || "");

  if (type === "instruct_engineer_send") {
    return claimRef ? `Instruct Engineer sent` : "Instruct Engineer sent";
  }

  return activity?.subject || activity?.title || "Email";
};

const shortSystemTitle = (activity: any) => {
  const type = activity?.history_file_type || "";

  if (type === "ai_report") return "AI Report generated";
  if (
    type === "deativated_police_detail" ||
    type === "deactivated_police_detail"
  )
    return "Police Detail deactivated";
  if (
    type === "deativated_passenger_detail" ||
    type === "deactivated_passenger_detail"
  )
    return "Passenger deactivated";

  return activity?.title || "System Activity";
};

const getShortTitle = (activity: any) => {
  if (activity.type === "Update") return shortUpdateTitle(activity);
  if (activity.type === "Upload") return shortUploadTitle(activity);
  if (activity.type === "Email") return shortEmailTitle(activity);
  if (activity.type === "System") return shortSystemTitle(activity);
  if (activity.type === "Witness") {
    if ((activity?.history_file_type || "").includes("created"))
      return "Witness created";
    if (
      (activity?.history_file_type || "").includes("deativated") ||
      (activity?.history_file_type || "").includes("deactivated")
    ) {
      return "Witness deactivated";
    }
    return "Witness updated";
  }
  if (activity.type === "AI Report")
    return "Damage Assessment Report generated";

  return activity?.title || "Activity";
};
  const normalizeModifiedFields = (row: any, meta: any): string[] => {
    if (Array.isArray(meta?.modified_fields)) return meta.modified_fields;
    if (Array.isArray(meta?.changed_fields)) return meta.changed_fields;
    if (Array.isArray(meta?.fields)) return meta.fields;
    if (Array.isArray(row?.modified_fields)) return row.modified_fields;
    if (Array.isArray(row?.changed_fields)) return row.changed_fields;

    if (typeof meta?.modified_fields === "string") {
      return meta.modified_fields
        .split(",")
        .map((item: string) => item.trim())
        .filter(Boolean);
    }

    if (typeof row?.modified_fields === "string") {
      return row.modified_fields
        .split(",")
        .map((item: string) => item.trim())
        .filter(Boolean);
    }

    if (typeof row?.detail_text === "string" && row.detail_text.trim()) {
      return row.detail_text
        .split(",")
        .map((item: string) => item.trim())
        .filter(Boolean);
    }

    return [];
  };

  const normalizeActivity = (row: any): ActivityItem => {
    const meta = row?.meta || {};
    const type = (row?.type || "System") as Exclude<ActivityType, "All">;
    const title = row?.title || "System Activity";
    const modifiedFields = normalizeModifiedFields(row, meta);

    const isInstructEngineerEmail =
      type === "Email" && title.toLowerCase().includes("instruct engineer");

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
        attachments:
          Array.isArray(row?.attachments) && row.attachments.length > 0
            ? row.attachments
            : [
                {
                  file_name: "New Instruction.pdf",
                  file_url: "#",
                  file_size: "",
                  case_document_id: null,
                },
              ],
        subject: row?.subject || "Instructing Engineer - Dean-202603-00004",
        sender_name: row?.sender_name || "No-Reply",
        sender_email:
          row?.sender_email ||
          "noreplynationwideassist@yopmail.com via sendgrid.net",
        received_at: row?.received_at || row?.timestamp || "",
        body_preview:
          row?.body_preview ||
          "Dear Sir, Please find attached our new instruction.",
        body_text:
          row?.body_text ||
          `Dear Sir,

Please find attached our new instruction.

If you are not able to inspect the Client's vehicle within 48 working hours from the date of the instruction please notify us immediately.

If you have any queries, please contact us on the number below.

Regards,
Ruby Uddin
Nationwide Assist Team`,
        meta: {
          ...meta,
          modified_fields: modifiedFields,
        },
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
      meta: {
        ...meta,
        modified_fields: modifiedFields,
      },
      ai,
    };
  };

const staticAiData = [
  {
    side: "Rear",
    area: "Bumper",
    type: "Broken",
    severity: "High",
    confidence: "90%",
    points: "1",
    repair: "Repair",
  },
  {
    side: "Rear",
    area: "Trunk",
    type: "Dent",
    severity: "Low",
    confidence: "84%",
    points: "1",
    repair: "Repair",
  },
  {
    side: "Rear",
    area: "Taillight",
    type: "Broken",
    severity: "High",
    confidence: "67%",
    points: "1",
    repair: "Repair",
  },
];

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
    if (activity.type === "Update") return;
    setSelectedActivity(activity);
    setIsSliderOpen(true);
  };

  const handleAddNote = (payload: { activity: any; note: string }) => {
    console.log("Add note:", payload);
  };const formatUpdateTitle = (title: string) => {
    if (!title) return "";

    return (
      title
        .replace(/The\s+/i, "")
        .replace(/has been updated for claim.*$/i, "")
        .trim() + " updated"
    );
  };const extractClaimRef = (title: string) => {
    const match = title.match(/for claim (.+)$/i);
    return match ? match[1] : "";
  };

  const handleViewInDocumentLibrary = (activity: ActivityItem) => {
    const fileUrl =
      activity.ai?.report_pdf_url || activity.attachments?.[0]?.file_url;

    if (fileUrl && fileUrl !== "#") {
      window.open(fileUrl, "_blank", "noopener,noreferrer");
      return;
    }

    alert("No attachment found for this item.");
  };

  const openMailApp = (subject: string, body: string, to = "") => {
    window.location.href = `mailto:${encodeURIComponent(
      to,
    )}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const handleForwardToClient = (activity: ActivityItem) => {
    const fileUrl =
      activity.ai?.report_pdf_url || activity.attachments?.[0]?.file_url || "";

    const subject =
      activity.type === "AI Report"
        ? `Forwarding AI Report - ${activity.title}`
        : `Forwarding ${activity.subject || activity.title}`;

    const body = `Hi,

Please see the forwarded item below.

Title: ${activity.title}
Date: ${formatDateTime(activity.timestamp)}

${
  fileUrl
    ? `Attachment / preview link:
${fileUrl}

Please open the link above to review the document.`
    : ""
}

Regards`;

    openMailApp(subject, body);

    if (fileUrl) {
      window.open(fileUrl, "_blank", "noopener,noreferrer");
    }
  };

  const handleReplyToEmail = (activity: ActivityItem) => {
    const subject = activity.subject
      ? `Re: ${activity.subject}`
      : `Re: ${activity.title}`;

    const body = `Hi,

Regards`;

    openMailApp(subject, body, activity.sender_email || "");
  };
const formatUploadTitle = (activity: any) => {
  const fileName =
    activity.attachments?.[0]?.file_name || activity.title || "File";

  return `${fileName} uploaded`;
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
        ...(act.meta?.modified_fields || []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return matchesFilter && searchText.includes(search.toLowerCase());
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
        onReplyToEmail={handleReplyToEmail}
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
            placeholder="Search Activity (type of update, field name, etc.)"
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
              const attachment = activity.attachments?.[0];

              return (
                <div
                  key={activity.id}
                  className={`relative group ${
                    activity.type === "Update" ? "" : "cursor-pointer"
                  }`}
                  onClick={() => {
                    if (activity.type !== "Update") {
                      handleOpenDetail(activity);
                    }
                  }}
                >
                  <div className="absolute -left-[53px] top-0 p-2 rounded-md border bg-blue-50 shadow-sm border-blue-100 text-blue-500">
                    {config.icon}
                  </div>

                  <div
                    className={`bg-white border border-gray-100 rounded-lg p-5 shadow-sm transition-all ${
                      activity.type === "Update"
                        ? ""
                        : "hover:shadow-md hover:border-gray-300"
                    }`}
                  >
                    {activity.type === "Update" ? (
                      <div className="flex justify-between items-start gap-6">
                        <div className="flex items-start gap-4">
                          <span className="mt-1 px-2 py-1 bg-neutral-100 rounded text-[10px] leading-none font-weight-600 text-neutral-700 uppercase">
                            Update
                          </span>

                          <div className="flex flex-col gap-3">
                            <h3 className="font-weight-600 text-black text-[18px] leading-6">
                              {getShortTitle(activity)}
                            </h3>

                            <div className="flex flex-col gap-2">
                              <span className="text-xs text-neutral-400 font-weight-600 uppercase tracking-wide">
                                Modified Fields:
                              </span>

                              <div className="flex flex-wrap gap-2">
                                {activity.meta?.modified_fields?.length > 0 ? (
                                  activity.meta.modified_fields.map(
                                    (field: string, index: number) => (
                                      <span
                                        key={index}
                                        className="px-2 py-1 rounded bg-[#EEF4FF] border border-[#D8E5FF] text-[#245BDB] text-xs font-weight-400"
                                      >
                                        {field}
                                      </span>
                                    ),
                                  )
                                ) : (
                                  <span className="text-xs text-neutral-400">
                                    No modified fields
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-2 text-neutral-400 text-xs italic">
                              <User size={12} />
                              <span>
                                Updated by:{" "}
                                {JSON.parse(localStorage.getItem("activeUser"))
                                  .email || "User"}{" "}
                                {extractClaimRef(activity.title) && (
                                  <span>
                                    for claim {extractClaimRef(activity.title)}
                                  </span>
                                )}
                              </span>
                            </div>
                            {/* {extractClaimRef(activity.title) && (
                              <div className="mt-2">
                                <span className="px-2 py-1 rounded bg-[#EEF4FF] border border-[#D8E5FF] text-[#245BDB] text-xs font-weight-400">
                                  for claim {extractClaimRef(activity.title)}
                                </span>
                              </div>
                            )} */}
                          </div>
                        </div>

                        <span className="text-sm text-gray-400 font-light whitespace-nowrap">
                          {formatDateTime(activity.timestamp)}
                        </span>
                      </div>
                    ) : activity.type === "Upload" ? (
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex flex-col gap-3">
                          <div className="flex items-center gap-3">
                            <span className="px-2 py-1 bg-neutral-100 rounded text-[10px] leading-none font-weight-600 text-neutral-700">
                              Upload
                            </span>
                            <h3 className="font-weight-600 text-black text-[18px] leading-6">
                              {getShortTitle(activity)}
                            </h3>
                          </div>

                          {(activity.sender_name ||
                            activity.created_by_name ||
                            activity.sender_email) && (
                            <div className="text-sm text-neutral-600 font-weight-300">
                              {activity.sender_name ||
                                activity.created_by_name ||
                                activity.sender_email}
                            </div>
                          )}

                          {attachment?.file_name && (
                            <div className="flex items-center gap-4">
                              <a
                                href={attachment.file_url || "#"}
                                target="_blank"
                                rel="noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="inline-flex items-center gap-2 text-[#245BDB] text-sm hover:underline w-fit"
                              >
                                <Paperclip size={14} />
                                {attachment.file_name}
                              </a>

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleViewInDocumentLibrary(activity);
                                }}
                                className="inline-flex items-center gap-2 text-blue-500 hover:text-blue-700 text-sm"
                              >
                                <Eye size={14} />
                                Open in Document Library
                              </button>
                            </div>
                          )}
                        </div>

                        <span className="text-sm text-gray-400 font-light whitespace-nowrap">
                          {formatDateTime(activity.timestamp)}
                        </span>
                      </div>
                    ) : activity.type === "AI Report" ? (
                      <>
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-3">
                            <span className="px-2 py-1 bg-neutral-100 rounded text-xs font-weight-600 text-neutral-700">
                              AI Report
                            </span>
                            <h3 className="font-weight-600 text-black text-lg">
                              {getShortTitle(activity)}
                            </h3>
                          </div>
                          <span className="text-sm text-gray-400 font-light">
                            {formatDateTime(activity.timestamp)}
                          </span>
                        </div>

                        <div className="flex flex-col gap-3">
                          <div className="text-sm text-neutral-700 flex items-center gap-3">
                            <span className="font-weight-600">
                              {activity.ai?.system_name || "AI Analysis System"}
                            </span>
                            <span className="text-neutral-500">
                              {activity.ai?.system_email ||
                                "system@claimflow.ai"}
                            </span>
                          </div>

                          <div className="mt-1 p-4 bg-neutral-100 rounded-lg text-sm text-neutral-700">
                            <div className="font-weight-600 mb-4">
                              Damage Summary:
                            </div>

                            <div className="w-full overflow-x-auto">
                              <table className="w-full border border-neutral-200 rounded-lg overflow-hidden">
                                {/* HEADER */}
                                <thead className=" text-neutral-600 text-xs uppercase">
                                  <tr>
                                    <th className="text-left px-3 py-2 border-b">
                                      Side
                                    </th>
                                    <th className="text-left px-3 py-2 border-b">
                                      Area
                                    </th>
                                    <th className="text-left px-3 py-2 border-b">
                                      Type
                                    </th>
                                    <th className="text-left px-3 py-2 border-b">
                                      Severity
                                    </th>
                                    <th className="text-left px-3 py-2 border-b">
                                      Confidence
                                    </th>
                                    <th className="text-left px-3 py-2 border-b">
                                      Points
                                    </th>
                                    <th className="text-left px-3 py-2 border-b">
                                      Repair
                                    </th>
                                  </tr>
                                </thead>

                                {/* BODY */}
                                <tbody className=" text-sm">
                                  {staticAiData.map((item, i) => (
                                    <tr
                                      key={i}
                                      className="border-b last:border-b-0"
                                    >
                                      <td className="px-3 py-2">{item.side}</td>
                                      <td className="px-3 py-2">{item.area}</td>
                                      <td className="px-3 py-2">{item.type}</td>

                                      {/* SEVERITY WITH COLOR */}
                                      <td className="px-3 py-2">
                                        <span
                                          className={
                                            item.severity === "High"
                                              ? "text-red-600"
                                              : item.severity === "Medium"
                                                ? "text-yellow-600"
                                                : "text-green-600"
                                          }
                                        >
                                          {item.severity}
                                        </span>
                                      </td>

                                      <td className="px-3 py-2">
                                        {item.confidence}
                                      </td>
                                      <td className="px-3 py-2">
                                        {item.points}
                                      </td>
                                      <td className="px-3 py-2">
                                        {item.repair}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>

                          <div className="flex items-center gap-4 text-[#245BDB] text-sm">
                            <div className="flex items-center gap-2">
                              <Paperclip size={14} />
                              <span className="hover:underline">
                                {activity.attachments?.[0]?.file_name ||
                                  "AI Damage Report.pdf"}
                              </span>
                            </div>

                            {/* <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleViewInDocumentLibrary(activity);
                                }}
                                className="inline-flex items-center gap-2 text-blue-500 hover:text-blue-700 text-sm"
                              >
                                <Eye size={14} />
                                Open in Document Library
                              </button> */}
                          </div>
                        </div>
                      </>
                    ) : activity.type === "Email" ? (
                      <>
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-3">
                            <span className="px-2 py-1 bg-neutral-100 rounded text-xs font-weight-600 text-neutral-700">
                              Email
                            </span>
                            <h3 className="font-weight-600 text-black text-lg">
                              {getShortTitle(activity)}
                            </h3>
                          </div>
                          <span className="text-sm text-gray-400 font-light">
                            {formatDateTime(activity.timestamp)}
                          </span>
                        </div>

                        <div className="flex flex-col gap-1">
                          <div className="text-sm text-neutral-700">
                            <span className="font-weight-300">Subject: </span>
                            <span className="font-weight-600">
                              {activity.subject || "-"}
                            </span>
                          </div>
                          <div className="text-sm text-neutral-700">
                            <span className="font-weight-300">From: </span>
                            <span className="font-weight-600">
                              {activity.sender_name ||
                                activity.sender_email ||
                                "-"}
                            </span>
                          </div>
                          <div className="text-sm text-neutral-700">
                            <span className="font-weight-300">Received: </span>
                            <span className="font-weight-600">
                              {formatDateTime(
                                activity.received_at || activity.timestamp,
                              )}
                            </span>
                          </div>

                          <div className="mt-2 p-2 bg-neutral-100 rounded-lg text-sm text-neutral-700 whitespace-pre-line">
                            {activity.body_preview || activity.body_text || ""}
                          </div>

                          <div className="mt-3 flex flex-wrap items-center gap-4">
                            {activity.attachments?.length > 0 && (
                              <>
                                <div className="inline-flex items-center gap-2.5 h-8 px-3 py-2 rounded text-blue-300">
                                  <Paperclip size={16} />
                                  <span className="text-sm font-weight-300">
                                    {activity.attachments.length} Attachment
                                    {activity.attachments.length > 1 ? "s" : ""}
                                  </span>
                                </div>

                                {/* <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleViewInDocumentLibrary(activity);
                                  }}
                                  className="inline-flex items-center gap-2 text-blue-500 hover:text-blue-700 text-sm"
                                >
                                  <Eye size={14} />
                                  Open in Document Library
                                </button> */}
                              </>
                            )}

                            {/* <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleForwardToClient(activity);
                              }}
                              className="inline-flex items-center gap-2 text-blue-500 hover:text-blue-700 text-sm"
                            >
                              <FileText size={14} />
                              Forward to Client
                            </button> */}
                            {/* 
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleReplyToEmail(activity);
                              }}
                              className="inline-flex items-center gap-2 text-blue-500 hover:text-blue-700 text-sm"
                            >
                              <Reply size={14} />
                              Reply to Email
                            </button> */}
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-3">
                            <span className="px-2 py-1 bg-neutral-100 rounded text-xs font-weight-600 text-neutral-700">
                              {config.label}
                            </span>
                            <h3 className="font-weight-600 text-black text-lg">
                              {getShortTitle(activity)}
                            </h3>
                          </div>
                          <span className="text-sm text-gray-400 font-light">
                            {formatDateTime(activity.timestamp)}
                          </span>
                        </div>

                        {activity.summary && (
                          <div className="text-sm text-neutral-700">
                            {activity.summary}
                          </div>
                        )}

                        {activity.type !== "Upload" && activity.detail_text && (
                          <div className="mt-3 bg-neutral-100 rounded-lg p-4 text-sm text-neutral-700 whitespace-pre-line">
                            {activity.detail_text}
                          </div>
                        )}

                        {activity.created_by_name && (
                          <div className="mt-4 flex items-center gap-2 text-neutral-400 text-xs">
                            <User size={12} /> Updated by:{" "}
                            {activity.created_by_name}
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
        <div className="inline-flex items-center shadow-[0px_1px_0.5px_0.05px_rgba(29,41,61,0.02)] font-['Inter'] text-sm">
          {/* PREVIOUS */}
          <button className="px-3 py-2 bg-neutral-100 border border-neutral-200 rounded-l-md flex items-center justify-center">
            <span className="text-neutral-600 font-medium">Previous</span>
          </button>

          {/* PAGE NUMBERS */}
          {[1, 2, 3, 4, 5, 6, 7, 8].map((page) => (
            <button
              key={page}
              className={`w-9 h-9 flex items-center justify-center border-t border-b border-r border-neutral-200 ${
                page === 3
                  ? "bg-blue-100 text-black font-medium"
                  : "bg-neutral-100 text-neutral-600 font-medium"
              }`}
            >
              {page}
            </button>
          ))}

          {/* DOTS */}
          <div className="w-9 h-9 flex items-center justify-center border border-neutral-200 bg-neutral-100 text-neutral-600">
            ...
          </div>

          {/* LAST */}
          <button className="w-9 h-9 flex items-center justify-center border-t border-b border-r border-neutral-200 bg-neutral-100 text-neutral-600 font-medium">
            99
          </button>

          {/* NEXT */}
          <button className="px-3 py-2 bg-neutral-100 border border-neutral-200 rounded-r-md flex items-center justify-center">
            <span className="text-blue-500 font-medium">Next</span>
          </button>
        </div>
      </main>
    </div>
  );
};

export default CaseActivityStream;
