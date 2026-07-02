import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { User, ChevronLeft } from "lucide-react";
import ActivityDetailSlider from "./CaseActivityDetail";
import attachmentt from "../../../assets/AutoClaim_icon/attachment.svg";
import {
  getCaseActivity,
  replyToEmailGraph,
  forwardEmailGraph,
  getCaseActivityPresignedUrl,
} from "../../../services/HistoryActivities/HistoryActivities";
import MailIcon from "../../../assets/case_activity/email.svg";
import AIReportIcon from "../../../assets/case_activity/ai_report.svg";
import NotesIcon from "../../../assets/case_activity/note.svg";
import UpdateIcon from "../../../assets/case_activity/update.svg";
import UploadIcon from "../../../assets/case_activity/upload.svg";
import WitnessIcon from "../../../assets/case_activity/witness.svg";
import UserUploads from "../../../assets/case_activity/user_uploads.svg";

import { toast } from "react-toastify";
import axiosInstance from "../../../services/axiosConfig";
import {
  getActivityNotes,
  createActivityNote,
  createActivityReply,
  deleteActivityNote,
  deleteActivityReply,
} from "../../../services/HistoryActivities/HistoryActivities";

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
  s3_key?: string;
  content_type?: string;
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
  claim_reference?: string;
  attachments?: AttachmentItem[];

  subject?: string;
  sender_name?: string;
  sender_email?: string;
  received_at?: string;
  body_preview?: string;
  body_text?: string;
  body_html?: string;

  meta?: Record<string, any>;
  ai?: AIActivityData;
};
type NoteAttachment = {
  file_name?: string;
  file_url?: string;
  file_size?: string;
  case_document_id?: number | string | null;
  s3_key?: string;
  content_type?: string;
};

type ActivityNoteReply = {
  id: number | string;
  noteId: number | string;
  text: string;
  createdAt: string;
  createdById?: number | string;
  createdByName: string;
  createdByRole: string;
  attachments?: NoteAttachment[];
};

type ActivityNote = {
  id: number | string;
  activityId: number | string;
  text: string;
  createdAt: string;
  createdById?: number | string;
  createdByName: string;
  createdByRole: string;
  attachments?: NoteAttachment[];
  replies?: ActivityNoteReply[];
};
const CaseActivityStream = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  const routeClaimId =
    (location.state as any)?.claimId ||
    searchParams.get("claim_id") ||
    searchParams.get("claimId");
  const isAllCasesView =
    (location.state as any)?.scope === "all" ||
    searchParams.get("scope") === "all" ||
    !routeClaimId;
  const [filter, setFilter] = useState<ActivityType>("All");
  const [search, setSearch] = useState("");
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [isSliderOpen, setIsSliderOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<ActivityItem | null>(
    null,
  );
  const claimId = routeClaimId;

  const [activityNotes, setActivityNotes] = useState<
    Record<string, ActivityNote[]>
  >({});

  const activeUser = (() => {
    try {
      return JSON.parse(localStorage.getItem("activeUser") || "{}");
    } catch {
      return {};
    }
  })();

  const filterButtons = [
    { label: "Show All", type: "All", icon: null },
    { label: "Emails", type: "Email", icon: MailIcon },
    { label: "AI Reports", type: "AI Report", icon: AIReportIcon },
    { label: "Updates", type: "Update", icon: UpdateIcon },
    { label: "Witness", type: "Witness", icon: WitnessIcon },
    { label: "Uploads", type: "Upload", icon: UploadIcon },
    { label: "Notes", type: "Note", icon: NotesIcon },
  ];
  // const extractClaimRef = (title = "") => {
  //   const match = title.match(/for claim[- ](.+)$/i);
  //   return match ? match[1].trim() : "";
  // };
  const [isLoadingActivities, setIsLoadingActivities] = useState(false);
  const [isLoadingNotes, setIsLoadingNotes] = useState(false);

  const isPageLoading = isLoadingActivities || isLoadingNotes;

  const shortUpdateTitle = (activity: any) => {
    const title = activity?.title || "";
    const type = activity?.history_file_type || "";
    const detailText = activity?.detail_text || "";

    if (type === "updated_insurer_broker")
      return "Insurer Broker Detail updated";
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
    if (type === "created_storage_recovery")
      return "Storage & Recovery created";
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
      return "Police Detail deleted";
    if (
      type === "deativated_witness_detail" ||
      type === "deactivated_witness_detail"
    )
      return "Witness deleted";
    if (
      type === "deativated_passenger_detail" ||
      type === "deactivated_passenger_detail"
    )
      return "Passenger deleted";

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
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const safeJsonParse = (value: any) => {
    if (!value || typeof value !== "string") return null;

    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  };

  const extractFileNameFromTitle = (title = "") => {
    const match = title.match(/"([^"]+)"/);
    return match?.[1] || "";
  };

  // Pull just the file name out of the verbose backend sentences, e.g.
  // "The file named X has been saved for claim REF" -> "X", and strip any
  // trailing "has been uploaded/saved/downloaded" / "for claim REF" noise.
  const cleanFileName = (raw = "") => {
    let s = String(raw || "").trim();
    const named = s.match(/the file named\s+(.+?)\s+has been\b/i);
    if (named?.[1]) s = named[1].trim();
    s = s.replace(/\s+has been\s+(uploaded|saved|downloaded)\b.*$/i, "");
    s = s.replace(/\s+for claim[- ].*$/i, "");
    s = s.replace(/\s+(uploaded|downloaded)\s*$/i, "");
    return s.trim();
  };

  const getS3KeyFromUrl = (fileUrl = "") => {
    if (!fileUrl || typeof fileUrl !== "string") return "";

    const json = safeJsonParse(fileUrl);
    if (json?.s3_key) return json.s3_key;
    if (json?.file_url) return getS3KeyFromUrl(json.file_url);

    if (fileUrl.includes(".amazonaws.com/")) {
      // Strip any query string (e.g. an expired presigned signature) so we get
      // the bare object key back.
      const after = (fileUrl.split(".amazonaws.com/")[1] || "").split("?")[0];
      return decodeURIComponent(after);
    }

    // Local uploads: the "/uploads/..." path is itself a valid key the backend
    // presigned endpoint understands (it serves the file directly).
    const uploadsIdx = fileUrl.indexOf("/uploads/");
    if (uploadsIdx !== -1) return fileUrl.slice(uploadsIdx);

    return "";
  };

  const getUploadPayload = (activity: any) => {
    const detailJson = safeJsonParse(activity?.detail_text);
    const firstAttachment = activity?.attachments?.[0];
    const attachmentJson = safeJsonParse(firstAttachment?.file_url);

    const merged = {
      ...(activity?.meta || {}),
      ...(detailJson || {}),
      ...(attachmentJson || {}),
    };

    const historyType = activity?.history_file_type || "";
    const sourceType = merged?.source_type || "";

    const isUpload =
      activity?.type === "Upload" ||
      historyType === "history_upload" ||
      historyType === "uploaded_vehicle_owner" ||
      historyType === "engineer_detail" ||
      sourceType.includes("upload");

    if (!isUpload) return null;

    const fileName =
      cleanFileName(
        merged?.file_name ||
          extractFileNameFromTitle(activity?.title || "") ||
          extractFileNameFromTitle(firstAttachment?.file_name || "") ||
          firstAttachment?.file_name ||
          activity?.title ||
          "",
      ) || "Uploaded attachment";

    const fileUrl = merged?.file_url || firstAttachment?.file_url || "";

    const s3Key =
      merged?.s3_key || firstAttachment?.s3_key || getS3KeyFromUrl(fileUrl);

    return {
      fileName,
      fileUrl,
      s3Key,
      caseDocumentId:
        merged?.case_document_id || firstAttachment?.case_document_id || null,
      contentType:
        merged?.content_type ||
        firstAttachment?.content_type ||
        "application/pdf",
    };
  };

  const getUploadInfo = (activity: any) => {
    const detailMeta = safeJsonParse(activity?.detail_text);
    const firstAttachment = activity?.attachments?.[0];

    // Some API responses wrongly put the JSON payload inside attachment.file_url
    const attachmentUrlMeta = safeJsonParse(firstAttachment?.file_url);

    const mergedMeta = {
      ...(activity?.meta || {}),
      ...(detailMeta || {}),
      ...(attachmentUrlMeta || {}),
    };

    const titleFileName = extractFileNameFromTitle(activity?.title || "");
    const attachmentFileName = extractFileNameFromTitle(
      firstAttachment?.file_name || "",
    );

    const fileName =
      cleanFileName(
        mergedMeta?.file_name ||
          titleFileName ||
          attachmentFileName ||
          firstAttachment?.file_name ||
          activity?.title ||
          "",
      ) || "Uploaded attachment";

    const fileUrl = mergedMeta?.file_url || firstAttachment?.file_url || "";

    const s3Key =
      mergedMeta?.s3_key || firstAttachment?.s3_key || getS3KeyFromUrl(fileUrl);

    return {
      meta: mergedMeta,
      fileName,
      fileUrl,
      s3Key,
      caseDocumentId:
        mergedMeta?.case_document_id ||
        firstAttachment?.case_document_id ||
        null,
      contentType:
        mergedMeta?.content_type ||
        firstAttachment?.content_type ||
        "application/pdf",
    };
  };

  const isUploadLikeActivity = (row: any, uploadMeta: any) => {
    const type = row?.type || "";
    const historyFileType = row?.history_file_type || "";
    const sourceType = uploadMeta?.source_type || "";

    return (
      type === "Upload" ||
      historyFileType === "history_upload" ||
      historyFileType === "uploaded_vehicle_owner" ||
      historyFileType === "engineer_detail" ||
      sourceType.includes("upload")
    );
  };
  // const shortUploadTitle = (activity: any) => {
  //   const title = activity?.title || "";
  //   const type = activity?.history_file_type || "";
  //   const attachmentName =
  //     activity?.attachments?.[0]?.file_url ||
  //     activity?.attachments?.[0]?.file_name ||
  //     "";

  //   const quotedMatch = title.match(/"([^"]+)"/);
  //   if (quotedMatch) return `${quotedMatch[1]} uploaded`;
  //   console.log(attachmentName);

  //   if (type === "download_exemption_pdf")
  //     return "Fee Exemption PDF downloaded";
  //   if (type === "download_cil_client")
  //     return "Sent CIL To Client Document downloaded";
  //   if (type === "download_cil_letter")
  //     return "CIL Agreement Letter downloaded";
  //   if (type === "download_recovery_xlsx")
  //     return "Storage And Recovery XLSX downloaded";
  //   if (type === "download_mitigation_xlsx")
  //     return "Mitigation Questionnaire XLSX downloaded";
  //   if (type === "download_hire_xlsx")
  //     return "Hire Documentation Agreement XLSX downloaded";
  //   if (type === "download_vehicle_xlsx")
  //     return "Hire Vehicle Check Sheet XLSX downloaded";
  //   if (type === "download_vehicle_xlsx")
  //     return "Hire Vehicle Check Sheet XLSX downloaded";
  //   if (type === "history_upload") return `${title} downloaded`;

  //   if (attachmentName) return `${attachmentName} uploaded`;

  //   return title
  //     .replace(/^The\s+/i, "")
  //     .replace(/\s+has been uploaded\s+for claim[- ].*$/i, " uploaded")
  //     .replace(/\s+downloaded\s+for claim[- ].*$/i, " downloaded")
  //     .trim();
  // };
  const shortUploadTitle = (activity: any) => {
    const uploadInfo = getUploadInfo(activity);
    const fileName = uploadInfo.fileName || "File";
    // On a specific claim the reference is obvious, so omit it. On the
    // all-cases view keep it so you can tell which claim the file belongs to.
    const claimRef =
      activity?.claim_reference ||
      activity?.meta?.upload_claim_reference ||
      extractClaimRef(activity?.title || "");
    if (isAllCasesView && claimRef) {
      return `${fileName} uploaded for claim ${claimRef}`;
    }
    return `${fileName} uploaded`;
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
      return "Witness Questionnaire Submitted";
    }
    if (activity.type === "AI Report")
      return "Damage Assessment Report generated";

    return activity?.title || "Activity";
  };
  const normalizeModifiedFields = (row: any, meta: any): string[] => {
    const cleanList = (value: any): string[] => {
      if (Array.isArray(value)) {
        return value.map((item) => String(item).trim()).filter(Boolean);
      }

      if (typeof value === "string" && value.trim()) {
        const parsed = safeJsonParse(value);
        if (parsed)
          return cleanList(
            parsed.modified_fields || parsed.changed_fields || parsed.fields,
          );

        return value
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean);
      }

      return [];
    };

    const fromMeta =
      cleanList(meta?.modified_fields) ||
      cleanList(meta?.changed_fields) ||
      cleanList(meta?.fields);

    if (fromMeta.length) return fromMeta;

    const fromRow =
      cleanList(row?.modified_fields) ||
      cleanList(row?.changed_fields) ||
      cleanList(row?.fields);

    if (fromRow.length) return fromRow;

    const historyType = row?.history_file_type || "";
    const isUpdateLike =
      historyType.startsWith("updated_") ||
      historyType.startsWith("created_") ||
      historyType.startsWith("deactivated_") ||
      historyType.startsWith("deativated_");

    if (
      isUpdateLike &&
      typeof row?.detail_text === "string" &&
      row.detail_text.trim()
    ) {
      const parsed = safeJsonParse(row.detail_text);
      if (parsed)
        return cleanList(
          parsed.modified_fields || parsed.changed_fields || parsed.fields,
        );
      return cleanList(row.detail_text);
    }

    return [];
  };

  const normalizeActivity = (row: any): ActivityItem => {
    const parsedDetailText = safeJsonParse(row?.detail_text);
    const rawMeta = row?.meta || {};
    const uploadInfo = getUploadInfo(row);
    const isUploadLike = isUploadLikeActivity(row, uploadInfo.meta);

    const isAiReportLike =
      row?.type === "AI Report" ||
      row?.history_file_type === "ai_report" ||
      parsedDetailText?.document_type === "ai_report" ||
      parsedDetailText?.badge === "AI Report" ||
      rawMeta?.document_type === "ai_report" ||
      rawMeta?.source_type === "ai_report";

    const meta = {
      ...rawMeta,
      ...(parsedDetailText || {}),
      ...(isUploadLike
        ? {
            ...uploadInfo.meta,
            upload_file_name: uploadInfo.fileName,
            upload_file_url: uploadInfo.fileUrl,
            upload_s3_key: uploadInfo.s3Key,
            upload_case_document_id: uploadInfo.caseDocumentId,
            upload_content_type: uploadInfo.contentType,
            upload_claim_reference: extractClaimRef(row?.title || ""),
          }
        : {}),
    };

    const type = (
      isUploadLike
        ? "Upload"
        : isAiReportLike
          ? "AI Report"
          : row?.type || "System"
    ) as Exclude<ActivityType, "All">;

    const title = isUploadLike
      ? `${uploadInfo.fileName} has been uploaded`
      : isAiReportLike
        ? meta?.title || row?.title || "Damage Assessment Report Generated"
        : row?.title || "System Activity";

    const modifiedFields = normalizeModifiedFields(row, meta);

    const uploadAttachments: AttachmentItem[] = isUploadLike
      ? [
          {
            file_name: uploadInfo.fileName,
            file_url: uploadInfo.fileUrl,
            s3_key: uploadInfo.s3Key,
            content_type: uploadInfo.contentType,
            case_document_id: uploadInfo.caseDocumentId,
            file_size: row?.attachments?.[0]?.file_size || "",
          },
        ]
      : Array.isArray(row?.attachments)
        ? row.attachments
        : [];

    const isInstructEngineerEmail =
      type === "Email" && title.toLowerCase().includes("instruct engineer");

    if (isInstructEngineerEmail) {
      return {
        id: row?.id,
        type: "Email",
        history_file_type: row?.history_file_type || "",
        title: row?.title || "Instructing Engineer",
        timestamp: row?.timestamp || row?.received_at || "",
        summary: "",
        detail_text: "",
        created_by_name: row?.created_by_name || "",
        attachments: uploadAttachments,
        subject: row?.subject || "Instructing Engineer",
        sender_name: row?.sender_name || "No-Reply",
        sender_email:
          row?.sender_email ||
          "noreplynationwideassist@yopmail.com via sendgrid.net",
        received_at: row?.received_at || row?.timestamp || "",
        body_html: row?.body_html || "",
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
            system_name:
              meta?.system_name || row?.sender_name || "AI Analysis System",
            system_email:
              meta?.system_email || row?.sender_email || "system@claimflow.ai",
            client_name: meta?.client_name || "-",
            image_name: meta?.image_name || "",
            assessment_type:
              meta?.assessment_type ||
              meta?.assessmentType ||
              "Client vehicle only",
            prediction_count:
              meta?.prediction_count || meta?.damage_table?.length || 0,
            high_severity_count:
              meta?.high_severity_count ||
              (Array.isArray(meta?.damage_table)
                ? meta.damage_table.filter(
                    (item: any) => item?.severity === "High",
                  ).length
                : 0),
            vehicle_type: meta?.vehicle_type || "-",
            damage_severity: meta?.damage_severity || "-",
            estimated_repair_cost: meta?.estimated_repair_cost || "-",
            recommended_action: meta?.recommended_action || "-",
            fraud_risk_score: meta?.fraud_risk_score || "-",
            detail_summary:
              meta?.detail_summary ||
              meta?.message ||
              "AI damage assessment report generated successfully.",
            document_library_id:
              meta?.document_library_id || meta?.case_document_id || null,
            case_document_id:
              meta?.case_document_id || meta?.document_library_id || null,
            report_pdf_url:
              meta?.report_pdf_url || row?.attachments?.[0]?.file_url || "",
            report_pdf_s3_key: meta?.report_pdf_s3_key || meta?.s3_key || "",
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
      claim_reference: row?.claim_reference || "",
      timestamp: row?.timestamp || row?.received_at || "",
      summary: isUploadLike
        ? ""
        : isAiReportLike
          ? meta?.message ||
            row?.summary ||
            "AI damage assessment report generated successfully."
          : row?.summary || "",
      detail_text: isUploadLike
        ? ""
        : isAiReportLike
          ? meta?.message ||
            meta?.detail_summary ||
            "AI damage assessment report generated successfully."
          : row?.detail_text || "",
      created_by_name: row?.created_by_name || "",
      attachments: uploadAttachments,
      subject: row?.subject || "",
      sender_name: row?.sender_name || "",
      sender_email: row?.sender_email || "",
      received_at: row?.received_at || row?.timestamp || "",
      body_preview: row?.body_preview || "",
      body_text: row?.body_text || "",
      body_html: row?.body_html || "",
      meta: {
        ...meta,
        modified_fields: modifiedFields,
      },
      ai,
    };
  };

  useEffect(() => {
    const fetchActivity = async () => {
      if (!isAllCasesView && !claimId) return;

      try {
        setIsLoadingActivities(true);

        const items = isAllCasesView
          ? (
              await axiosInstance.get("/case-activity/all", {
                params: { include_emails: true },
              })
            ).data
          : await getCaseActivity(parseInt(claimId, 10));

        const normalized = Array.isArray(items)
          ? items.map(normalizeActivity)
          : [];

        setActivities(normalized);

        // On the all-cases view there can be hundreds of activities (every
        // claim). Prefetching notes per-activity would fire one request each,
        // saturating the browser's ~6 connections and starving every other API
        // ("stuck in queue"). Skip it here — notes still load when a detail is
        // opened. On a single-claim view the count is bounded, so keep prefetch.
        if (isAllCasesView) {
          setActivityNotes({});
        } else {
          const notesEntries = await Promise.all(
            normalized
              .filter(
                (activity) =>
                  activity.type !== "Update" && activity.type !== "Upload",
              )
              .map(async (activity) => {
                const activityId =
                  activity.meta?.parent_activity_id || activity.id;

                try {
                  const notes = await getActivityNotes(activityId);
                  return [String(activityId), notes || []];
                } catch {
                  return [String(activityId), []];
                }
              }),
          );

          setActivityNotes(Object.fromEntries(notesEntries));
        }
      } catch (error) {
        console.error("Failed to fetch case activity:", error);
        setActivities([]);
      } finally {
        setIsLoadingActivities(false);
      }
    };

    fetchActivity();
  }, [claimId, isAllCasesView]);
  const handleOpenDetail = async (activity: ActivityItem) => {
    if (activity.type === "Update" || activity.type === "Upload") return;

    try {
      setIsLoadingNotes(true);

      const activityId = activity.meta?.parent_activity_id || activity.id;
      const notes = await getActivityNotes(activityId);

      setActivityNotes((prev) => ({
        ...prev,
        [String(activityId)]: notes || [],
      }));

      setSelectedActivity(activity);
      setIsSliderOpen(true);
    } catch (error) {
      console.error("Failed to load notes:", error);
      setSelectedActivity(activity);
      setIsSliderOpen(true);
    } finally {
      setIsLoadingNotes(false);
    }
  };
  const openUploadedFile = async (
    file: AttachmentItem,
    activity: ActivityItem,
  ) => {
    try {
      const s3Key =
        file.s3_key ||
        activity.meta?.upload_s3_key ||
        activity.meta?.s3_key ||
        getS3KeyFromUrl(file.file_url || activity.meta?.upload_file_url || "");

      if (!s3Key) {
        toast.error("Uploaded file key not found");
        return;
      }

      const presignedUrl = await getCaseActivityPresignedUrl(s3Key);

      window.open(presignedUrl, "_blank", "noopener,noreferrer");
    } catch (error) {
      console.error(error);
      toast.error("Failed to open uploaded file");
    }
  };
  const openUploadedAttachment = async (
    file: AttachmentItem,
    activity: ActivityItem,
  ) => {
    try {
      const payload = getUploadPayload(activity);

      const s3Key =
        file.s3_key ||
        payload?.s3Key ||
        activity.meta?.s3_key ||
        activity.meta?.upload_s3_key ||
        getS3KeyFromUrl(file.file_url || payload?.fileUrl || "");

      if (!s3Key) {
        toast.error("Uploaded file key not found");
        return;
      }

      const presignedUrl = await getCaseActivityPresignedUrl(s3Key);

      window.open(presignedUrl, "_blank", "noopener,noreferrer");
    } catch (error) {
      console.error(error);
      toast.error("Failed to open uploaded file");
    }
  };
  const openWitnessPdf = async (fileUrl: string) => {
    try {
      const s3Key = fileUrl.split(".amazonaws.com/")[1];

      if (!s3Key) {
        toast.error("PDF file key not found");
        return;
      }

      const presignedUrl = await getCaseActivityPresignedUrl(s3Key);

      window.open(presignedUrl, "_blank");
    } catch (error) {
      console.error(error);
      toast.error("Failed to open witness PDF");
    }
  };

  const handleAddNote = async (payload: {
    activity: ActivityItem;
    note?: string;
    reply?: string;
    parentNoteId?: number | string;
    noteId?: number | string;
    files?: File[];
    isEdit?: boolean;
  }) => {
    try {
      const activityId =
        payload.activity.meta?.parent_activity_id || payload.activity.id;

      const targetClaimId =
        payload.activity.meta?.claim_id ||
        payload.activity.meta?.claimId ||
        claimId;

      if (!targetClaimId) {
        toast.error("Claim ID not found for this activity");
        return;
      }

      const formData = new FormData();
      if (payload.note) formData.append("note", payload.note);
      if (payload.reply) formData.append("reply", payload.reply);
      (payload.files || []).forEach((file) => formData.append("files", file));

      if (payload.isEdit && payload.noteId) {
        if (payload.parentNoteId) {
          await axiosInstance.put(
            `/case-activity/note-replies/${payload.noteId}`,
            formData,
            {
              headers: { "Content-Type": "multipart/form-data" },
            },
          );
        } else {
          await axiosInstance.put(
            `/case-activity/notes/${payload.noteId}`,
            formData,
            {
              headers: { "Content-Type": "multipart/form-data" },
            },
          );
        }
      } else if (payload.parentNoteId && payload.reply) {
        await axiosInstance.post(
          `/case-activity/notes/${payload.parentNoteId}/reply`,
          formData,
          {
            headers: { "Content-Type": "multipart/form-data" },
          },
        );
      } else if (payload.note || (payload.files || []).length > 0) {
        await axiosInstance.post(
          `/case-activity/claims/${targetClaimId}/activities/${activityId}/notes`,
          formData,
          { headers: { "Content-Type": "multipart/form-data" } },
        );
      }

      const refreshedNotes = await getActivityNotes(activityId);

      setActivityNotes((prev) => ({
        ...prev,
        [String(activityId)]: refreshedNotes || [],
      }));

      toast.success(
        payload.isEdit ? "Updated successfully" : "Saved successfully",
      );
    } catch (error) {
      console.error(error);
      toast.error("Failed to save note");
    }
  };

  const formatUpdateTitle = (title: string) => {
    if (!title) return "";

    return (
      title
        .replace(/The\s+/i, "")
        .replace(/has been updated for claim.*$/i, "")
        .trim() + " updated"
    );
  };
  const extractClaimRef = (title: string) => {
    const match = title.match(/for claim[-\s]+([A-Za-z0-9-]+)/i);
    return match ? match[1] : "";
  };

  const handleDeleteNote = async (payload: {
    activity: ActivityItem;
    noteId: number | string;
    parentNoteId?: number | string;
  }) => {
    try {
      if (payload.parentNoteId) {
        await axiosInstance.delete(
          `/case-activity/note-replies/${payload.noteId}`,
        );
      } else {
        await axiosInstance.delete(`/case-activity/notes/${payload.noteId}`);
      }

      const activityId =
        payload.activity.meta?.parent_activity_id || payload.activity.id;

      const refreshedNotes = await getActivityNotes(activityId);

      setActivityNotes((prev) => ({
        ...prev,
        [String(activityId)]: refreshedNotes || [],
      }));

      toast.success("Deleted successfully");
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete note");
    }
  };

  const handleViewInDocumentLibrary = async (activity: ActivityItem) => {
    const fileUrl =
      activity.ai?.report_pdf_url || activity.attachments?.[0]?.file_url;

    // Always fetch a FRESH presigned URL from the object key — the stored
    // report_pdf_url is a presigned link that expires ("Request has expired").
    const s3Key =
      activity.ai?.report_pdf_s3_key ||
      (activity.meta as any)?.report_pdf_s3_key ||
      (activity.meta as any)?.s3_key ||
      getS3KeyFromUrl(fileUrl || "");

    try {
      if (s3Key) {
        const fresh = await getCaseActivityPresignedUrl(s3Key);
        if (fresh) {
          openPdfClean(fresh);
          return;
        }
      }
    } catch (error) {
      console.error("Failed to refresh report URL:", error);
    }

    if (fileUrl && fileUrl !== "#") {
      openPdfClean(fileUrl);
      return;
    }

    alert("No attachment found for this item.");
  };

  const openMailApp = (subject: string, body: string, to = "") => {
    window.location.href = `mailto:${encodeURIComponent(
      to,
    )}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  // const handleForwardToClient = async (activity: ActivityItem) => {
  //   try {
  //     await forwardEmailGraph(activity);
  //   } catch (error) {
  //     console.error("Failed to forward email:", error);
  //     alert("Failed to open forward email.");
  //   }
  // };

  // const handleReplyToEmail = async (activity: ActivityItem) => {
  //   try {
  //     await replyToEmailGraph(activity);
  //   } catch (error) {
  //     console.error("Failed to reply to email:", error);
  //     alert("Failed to open reply email.");
  //   }
  // };
  const formatUploadTitle = (activity: any) => {
    const fileName =
      activity.attachments?.[0]?.file_name || activity.title || "File";

    return `${fileName} uploaded`;
  };

  const noteActivities: ActivityItem[] = useMemo(() => {
    return Object.entries(activityNotes).flatMap(([activityId, notes]) =>
      notes.map((note) => {
        const relatedActivity = activities.find(
          (activity) => String(activity.id) === String(activityId),
        );

        return {
          id: `note-${note.id}`,
          type: "Note" as Exclude<ActivityType, "All">,
          title: `Note added on ${(relatedActivity?.title || "activity")
            .replace(/\s+for claim\s+.*$/i, "")
            .trim()}`,
          timestamp: note.createdAt,
          summary: note.text,
          detail_text: note.text,
          created_by_name: note.createdByName,
          attachments: note.attachments || [],
          subject: "",
          sender_name: note.createdByName,
          sender_email: "",
          received_at: note.createdAt,
          body_preview: note.text,
          body_text: note.text,
          meta: {
            parent_activity_id: activityId,
            parent_activity_title: relatedActivity?.title || "",
            replies_count: note.replies?.length || 0,
          },
        };
      }),
    );
  }, [activityNotes, activities]);

  const getActivityTimestamp = (activity: ActivityItem) => {
    const value =
      activity.timestamp ||
      activity.received_at ||
      activity.meta?.createdAt ||
      activity.meta?.created_at ||
      "";

    const time = new Date(value).getTime();

    return Number.isNaN(time) ? 0 : time;
  };

  const filteredActivities = useMemo(() => {
    const allActivities = [...activities, ...noteActivities];

    return allActivities
      .filter((act) => {
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
      })
      .sort((a, b) => getActivityTimestamp(b) - getActivityTimestamp(a));
  }, [activities, filter, search, noteActivities]);
  const totalEntries = filteredActivities.length;
  const totalPages = Math.max(1, Math.ceil(totalEntries / pageSize));

  const startEntry = totalEntries === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endEntry = Math.min(currentPage * pageSize, totalEntries);

  const paginatedActivities = filteredActivities.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  const goToPage = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [filter, search]);
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
    const iconClass = "w-4 h-4";

    switch (type) {
      case "Email":
        return {
          label: "EMAIL",
          icon: <img src={MailIcon} className={iconClass} />,
        };

      case "Witness":
        return {
          label: "WITNESS",
          icon: <img src={WitnessIcon} className={iconClass} />,
        };

      case "Upload":
        return {
          label: "UPLOAD",
          icon: <img src={UploadIcon} className={iconClass} />,
        };

      case "Note":
        return {
          label: "NOTE",
          icon: <img src={NotesIcon} className={iconClass} />,
        };

      case "AI Report":
        return {
          label: "AI REPORT",
          icon: <img src={AIReportIcon} className={iconClass} />,
        };

      case "Update":
        return {
          label: "UPDATE",
          icon: <img src={UpdateIcon} className={iconClass} />,
        };

      default:
        return {
          label: "SYSTEM",
          icon: <img src={UpdateIcon} className={iconClass} />,
        };
    }
  };
  const openPdfClean = (fileUrl: string) => {
    const viewer = window.open("", "_blank");

    if (!viewer) return;

    viewer.document.write(`
    <html>
      <head>
        <title>PDF Preview</title>
        <style>
          html, body {
            margin: 0;
            padding: 0;
            width: 100%;
            height: 100%;
            background: #ffffff;
            overflow: hidden;
          }
          iframe {
            width: 100%;
            height: 100vh;
            border: none;
            background: #ffffff;
          }
        </style>
      </head>
      <body>
        <iframe src="${fileUrl}#toolbar=1&navpanes=0&scrollbar=1"></iframe>
      </body>
    </html>
  `);

    viewer.document.close();
  };
  return (
    <div className="flex flex-col w-full min-h-screen bg-white font-['Stack_Sans_Headline']">
      {/* <button
        type="button"
        onClick={async () => {
          try {
            const claimId = routeClaimId;

            const response = await axiosInstance.post(
              `/witnesses/demo-questionnaire-link/${claimId}`,
            );

            const link = response.data?.deep_link;

            if (link) {
              window.open(link, "_blank");
            }
          } catch (error) {
            console.error("Failed to create questionnaire link:", error);
            toast.error("Failed to create questionnaire link");
          }
        }}
        className="h-10 px-4 rounded bg-blue-600 text-white text-sm hover:bg-blue-700"
      >
        Open Demo Questionnaire
      </button>{" "} */}
      <ActivityDetailSlider
        isOpen={isSliderOpen}
        onClose={() => setIsSliderOpen(false)}
        data={selectedActivity}
        notes={
          selectedActivity
            ? activityNotes[
                String(
                  selectedActivity.meta?.parent_activity_id ||
                    selectedActivity.meta?.activityId ||
                    selectedActivity.id,
                )
              ] || []
            : []
        }
        openWitnessPdf={openWitnessPdf}
        currentUser={activeUser}
        onAddNote={handleAddNote}
        onDeleteNote={handleDeleteNote}
        onViewInDocumentLibrary={handleViewInDocumentLibrary}
      />
      <header className="px-10 py-5 bg-white shadow-md border-b flex justify-between items-center sticky top-0 z-10">
        <div className="flex flex-col gap-1">
          <button
            onClick={() => (claimId ? navigate(`/add-claim/${claimId}`) : navigate(-1))}
            className="flex items-center gap-1 text-blue-300 text-xs font-weight-600 hover:text-blue-500"
          >
            <ChevronLeft size={16} /> Back to Claim Details
          </button>
          <h1 className="text-2xl font-weight-600 text-black uppercase">
            Case Activity Log
          </h1>
        </div>
      </header>
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
      <main className="max-w-6xl mx-auto w-full p-8">
        <div className="relative mb-6">
          <input
            type="text"
            placeholder="Search Activity (type of update, field name, etc.)"
            className="w-full pl-12 pr-4 py-4 bg-white border border-gray-200 rounded text-base font-light focus:outline-none focus:ring-1 focus:ring-blue-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap gap-3 mb-10">
          {filterButtons.map((btn, i) => (
            <button
              key={btn.label}
              onClick={() => setFilter(btn.type as ActivityType)}
              className={`px-4 py-2 rounded flex items-center gap-2 text-sm transition-all ${
                filter === btn.type
                  ? "bg-blue-500 text-white shadow-md"
                  : "bg-blue-50 text-blue-500 hover:bg-blue-100"
              }`}
            >
              {i !== 0 && (
                <img
                  src={btn.icon}
                  alt=""
                  className={`w-4 h-4 transition-all ${
                    filter === btn.type ? "brightness-0 invert" : ""
                  }`}
                />
              )}
              {btn.label}
            </button>
          ))}
        </div>

        <div className="relative border-l border-gray-100 ml-4 pl-10 space-y-8">
          {paginatedActivities.length > 0 ? (
            paginatedActivities.map((activity) => {
              const config = getActivityConfig(activity.type);
              const uploadPayload = getUploadPayload(activity);

              const uploadAttachments: AttachmentItem[] =
                activity.type === "Upload" && uploadPayload
                  ? [
                      {
                        file_name: uploadPayload.fileName,
                        file_url: uploadPayload.fileUrl,
                        s3_key: uploadPayload.s3Key,
                        content_type: uploadPayload.contentType,
                        case_document_id: uploadPayload.caseDocumentId,
                        file_size: "",
                      },
                    ]
                  : activity.attachments || [];

              return (
                <div
                  key={activity.id}
                  className={`relative group ${
                    activity.type === "Update" || activity.type === "Upload"
                      ? ""
                      : "cursor-pointer"
                  }`}
                  onClick={() => {
                    if (
                      activity.type !== "Update" &&
                      activity.type !== "Upload"
                    ) {
                      handleOpenDetail(activity);
                    }
                  }}
                >
                  <div className="absolute -left-[53px] top-0 w-10 h-10 flex items-center justify-center rounded-md border bg-blue-50 shadow-sm border-blue-100">
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
                      <div className="flex flex-col gap-4">
                        {/* TOP ROW */}
                        <div className="flex justify-between items-start gap-6">
                          <div className="flex items-start gap-4">
                            <span className="mt-1 px-2 py-1 bg-neutral-100 rounded text-[10px] leading-none font-weight-600 text-neutral-700 uppercase">
                              Update
                            </span>

                            <div className="flex flex-col gap-2">
                              <h3 className="font-weight-600 text-black text-[18px] leading-6">
                                {getShortTitle(activity)}
                              </h3>
                            </div>
                          </div>

                          <span className="text-sm text-gray-400 font-light whitespace-nowrap">
                            {formatDateTime(activity.timestamp)}
                          </span>
                        </div>
                        {!getShortTitle(activity).includes("delete") && (
                          <div className="w-full p-3 bg-neutral-100 rounded-lg flex flex-col gap-2.5">
                            <div className="text-neutral-700 text-sm font-weight-400">
                              Modified Fields:
                            </div>

                            <div className="flex flex-wrap gap-2.5">
                              {activity.meta?.modified_fields?.length > 0 ? (
                                activity.meta.modified_fields.map(
                                  (field: string, index: number) => (
                                    <div
                                      key={index}
                                      className="px-2 py-1 bg-blue-100 rounded flex items-center"
                                    >
                                      <span className="text-blue-500 text-sm font-weight-400">
                                        {field}
                                      </span>
                                    </div>
                                  ),
                                )
                              ) : (
                                <span className="text-sm text-neutral-400">
                                  No modified fields
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-neutral-700 text-xs">
                          <img src={UserUploads} alt="" />
                          <span>
                            {" "}
                            {activity.created_by_name || activity.sender_email || activeUser?.email || "User"}
                          </span>
                        </div>
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

                          {uploadAttachments.length > 0 && (
                            <div className="flex flex-col gap-2 mt-2">
                              {uploadAttachments.map((file, index) => (
                                <button
                                  key={index}
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openUploadedAttachment(file, activity);
                                  }}
                                  className="inline-flex items-center gap-2 text-[#245BDB] text-sm hover:underline w-fit"
                                >
                                  <img src={attachmentt} alt="" />
                                  <span>
                                    {file.file_name || "Uploaded attachment"}
                                  </span>
                                </button>
                              ))}
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
                            <div className="font-weight-600 text-black text-[16px] mb-4">
                              Damage Summary:
                            </div>

                            <div className="w-full overflow-x-auto">
                              <table className="w-full border border-neutral-200 rounded-lg overflow-hidden">
                                {/* HEADER */}
                                <thead className=" bg-neutral-100 text-neutral-800 text-sm uppercase">
                                  <tr>
                                    <th className="text-left px-3 py-2 border-b font-weight-700">
                                      Side
                                    </th>
                                    <th className="text-left px-3 py-2 border-b font-weight-700">
                                      Area
                                    </th>
                                    <th className="text-left px-3 py-2 border-b font-weight-700">
                                      Type
                                    </th>
                                    <th className="text-left px-3 py-2 border-b font-weight-700">
                                      Severity
                                    </th>
                                    <th className="text-left px-3 py-2 border-b font-weight-700">
                                      Confidence
                                    </th>
                                    <th className="text-left px-3 py-2 border-b font-weight-700">
                                      Points
                                    </th>
                                    <th className="text-left px-3 py-2 border-b font-weight-700">
                                      Repair
                                    </th>
                                  </tr>
                                </thead>

                                {/* BODY */}
                                <tbody className=" text-sm">
                                  {(
                                    activity.meta?.damage_table ||
                                    activity.ai?.damage_table ||
                                    []
                                  )
                                    .slice(0, 4)
                                    .map((item: any, i: number) => (
                                      <tr
                                        key={i}
                                        className="border-b last:border-b-0"
                                      >
                                        <td className="px-3 py-2">
                                          {item.damage_side || item.side || "-"}
                                        </td>

                                        <td className="px-3 py-2">
                                          {item.area_of_damage ||
                                            item.area ||
                                            item.part ||
                                            "-"}
                                        </td>

                                        <td className="px-3 py-2">
                                          {item.type_of_damage ||
                                            item.type ||
                                            item.damage_type ||
                                            "-"}
                                        </td>

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
                                            {item.severity || "-"}
                                          </span>
                                        </td>

                                        <td className="px-3 py-2">
                                          {item.confidence
                                            ? String(item.confidence).includes(
                                                "%",
                                              )
                                              ? item.confidence
                                              : `${item.confidence}%`
                                            : "-"}
                                        </td>

                                        <td className="px-3 py-2">
                                          {item.points || "-"}
                                        </td>

                                        <td className="px-3 py-2">
                                          {item.suggested_repair ||
                                            item.repair ||
                                            "-"}
                                        </td>
                                      </tr>
                                    ))}
                                </tbody>
                              </table>
                            </div>
                          </div>

                          <div className="flex items-center gap-4 text-[#245BDB] text-sm">
                            <div className="flex items-center gap-2">
                              <img src={attachmentt} alt="" />
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

                          <div className="mt-2 text-sm text-neutral-500 line-clamp-2">
                            {activity.body_preview ||
                              activity.body_text ||
                              ""}
                          </div>

                          <div className="mt-3 flex flex-wrap items-center gap-4">
                            {activity.attachments?.length > 0 && (
                              <>
                                <div className="inline-flex items-center gap-2.5 h-8 px-3 py-2 rounded text-blue-300">
                                  <img src={attachmentt} alt="" />
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
                    ) : activity.type === "Note" ? (
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex flex-col gap-3 w-full">
                          <div className="flex items-center gap-3">
                            <span className="px-2 py-1 bg-neutral-100 rounded text-[10px] leading-none font-weight-600 text-neutral-700">
                              Note
                            </span>
                            <h3 className="font-weight-600 text-black text-[18px] leading-6">
                              {activity.title}
                            </h3>
                          </div>

                          <div className="w-full p-4 bg-neutral-100 rounded-lg text-sm text-neutral-700 whitespace-pre-wrap">
                            {activity.detail_text}
                          </div>

                          <div className="text-sm text-neutral-500">
                            Added by {activity.created_by_name || "User"}
                          </div>
                        </div>

                        <span className="text-sm text-gray-400 font-light whitespace-nowrap">
                          {formatDateTime(activity.timestamp)}
                        </span>
                      </div>
                    ) : activity.type === "Witness" ? (
                      <>
                        <div className="self-stretch flex flex-col justify-start items-start gap-2">
                          <div className="self-stretch inline-flex justify-between items-start">
                            <div className="flex justify-start items-center gap-3">
                              <div className="px-2 py-1 bg-neutral-100 rounded flex justify-start items-center gap-2">
                                <div className="text-neutral-700 text-xs font-weight-600 font-['Stack_Sans_Headline']">
                                  Witness
                                </div>
                              </div>

                              <div className="text-black text-base font-weight-600 font-['Stack_Sans_Headline']">
                                Witness Questionnaire Submitted
                              </div>
                            </div>

                            <div className="text-neutral-500 text-sm font-weight-400 font-['Stack_Sans_Headline']">
                              {formatDateTime(activity.timestamp)}
                            </div>
                          </div>

                          <div className="inline-flex justify-start items-start gap-2">
                            <div className="text-neutral-700 text-sm font-weight-400 font-['Stack_Sans_Headline']">
                              {activity.created_by_name || activity.sender_email || activeUser?.email || "User"}
                            </div>
                          </div>

                          <div className="self-stretch p-2 bg-neutral-100 rounded-lg inline-flex justify-center items-center gap-2.5">
                            <div className="flex-1 justify-start text-neutral-700 text-sm font-weight-400 font-['Stack_Sans_Headline'] whitespace-pre-line">
                              {(() => {
                                try {
                                  const parsed =
                                    typeof activity.detail_text === "string"
                                      ? JSON.parse(activity.detail_text)
                                      : activity.detail_text;

                                  return parsed?.witness_statement || "-";
                                } catch {
                                  return activity.detail_text || "-";
                                }
                              })() ||
                                activity.summary ||
                                "Witness questionnaire submitted successfully."}
                            </div>
                          </div>

                          {(activity.meta?.view_link ||
                            activity.attachments?.[0]?.file_url) && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();

                                const fileUrl =
                                  activity.meta?.view_link ||
                                  activity.attachments?.[0]?.file_url;

                                if (fileUrl) {
                                  openWitnessPdf(fileUrl);
                                }
                              }}
                              className="h-8 px-3 py-2 rounded inline-flex justify-center items-center gap-2.5 hover:bg-blue-50"
                            >
                              <img
                                src={attachmentt}
                                alt=""
                                className="w-4 h-4"
                              />

                              <div className="text-blue-500 text-sm font-weight-400 leading-4">
                                1 Attachment
                              </div>
                            </button>
                          )}
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
                          <div className="mt-4 flex items-center gap-2 text-neutral-700 text-xs">
                            <User size={12} />
                            {/* Updated by:{" "} */}
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
        <div className="w-full mt-10 flex justify-between items-center">
          <div className="text-center">
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
              className="px-3 py-2 h-9 border border-neutral-200 rounded-l-md flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="text-neutral-600 font-weight-500">Previous</span>
            </button>

            {Array.from({ length: totalPages }, (_, index) => index + 1)
              .filter((page) => {
                if (totalPages <= 8) return true;
                if (page <= 8) return true;
                if (page === totalPages) return true;
                return false;
              })
              .map((page, index, arr) => {
                const showDots = index > 0 && page - arr[index - 1] > 1;

                return (
                  <React.Fragment key={page}>
                    {showDots && (
                      <div className="w-9 h-9 flex items-center justify-center border border-neutral-200 text-neutral-600">
                        ...
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => goToPage(page)}
                      className={`w-9 h-9 flex items-center justify-center border-t border-b border-r border-neutral-200 ${
                        currentPage === page
                          ? "bg-blue-100 text-black font-weight-500"
                          : " text-neutral-600 font-weight-500"
                      }`}
                    >
                      {page}
                    </button>
                  </React.Fragment>
                );
              })}

            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() => goToPage(currentPage + 1)}
              className="px-3 py-2 h-9 border border-neutral-200 rounded-r-md flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="text-blue-500 font-weight-500">Next</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CaseActivityStream;
