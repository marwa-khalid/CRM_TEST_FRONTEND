import React, { useEffect, useState } from "react";
import { useCurrentUser } from "../../../context/AuthContext";
import { getUsers, type SystemUser } from "../../../services/Notifications/Notifications";
import attachmentt from "../../../assets/AutoClaim_icon/attachment.svg";
import Option1 from "../../../assets/RichTextOptions/Option1.svg";
import Option2 from "../../../assets/RichTextOptions/Option2.svg";
import Option3 from "../../../assets/RichTextOptions/Option3.svg";
import Option4 from "../../../assets/RichTextOptions/Option4.svg";
import Option5 from "../../../assets/RichTextOptions/Option5.svg";
import deletee from "../../../assets/case_activity/delete.svg";
import reply from "../../../assets/case_activity/reply.svg";
import ForwardIcon from "../../../assets/case_activity/forward.svg";
import ViewIcon from "../../../assets/case_activity/view.svg";
import NotesIcon from "../../../assets/case_activity/note.svg";
import UpdateIcon from "../../../assets/case_activity/update.svg";
import UploadIcon from "../../../assets/case_activity/upload.svg";
import EmailIcon from "../../../assets/case_activity/email.svg";
import AIReportIcon from "../../../assets/case_activity/ai_report.svg";
import WitnessIcon from "../../../assets/case_activity/witness.svg";

import {
  getEmailAttachmentBlob,
  replyToEmailGraph,
} from "../../../services/HistoryActivities/HistoryActivities";
import { toast } from "react-toastify";
import axiosInstance from "../../../services/axiosConfig";

interface ActivityDetailSliderProps {
  isOpen: boolean;
  onClose: () => void;
  data: any;
  notes?: ActivityNote[];
  currentUser?: any;
  openWitnessPdf: any;
  onAddNote?: (payload: NotePayload) => void;
  onDeleteNote?: (payload: {
    activity: any;
    noteId: number | string;
    parentNoteId?: number | string;
  }) => void;
  onViewInDocumentLibrary?: (activity: any) => void;
  // onForwardToClient?: (activity: any) => void;
  // onReplyToEmail?: (activity: any) => void;
}

const staticAiTableRows = [
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
type NoteAttachment = {
  file_name?: string;
  file_url?: string;
  file_size?: string;
  case_document_id?: number | string | null;
  s3_key?: string;
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

type NotePayload = {
  activity: any;
  note?: string;
  reply?: string;
  parentNoteId?: number | string;
  noteId?: number | string;
  files?: File[];
  isEdit?: boolean;
};
const ActivityDetailSlider: React.FC<ActivityDetailSliderProps> = ({
  isOpen,
  onClose,
  data,
  notes: activityNotes = [],
  currentUser: currentUserProp,
  onAddNote,
  onViewInDocumentLibrary,
  // onForwardToClient,
  // onReplyToEmail,
  onDeleteNote,
  openWitnessPdf,
}) => {
  const [showNoteBox, setShowNoteBox] = useState(false);
  const [noteText, setNoteText] = useState("");

  // @-mention tagging in the note box.
  const [mentionUsers, setMentionUsers] = useState<SystemUser[]>([]);
  const [mention, setMention] = useState<{ open: boolean; query: string }>({ open: false, query: "" });
  useEffect(() => {
    getUsers().then(({ data }) => setMentionUsers(Array.isArray(data) ? data : [])).catch(() => {});
  }, []);
  const handleNoteChange = (value: string) => {
    setNoteText(value);
    const m = value.match(/@([A-Za-z0-9._-]*)$/); // an @-token at the caret
    setMention(m ? { open: true, query: m[1] } : { open: false, query: "" });
  };
  const insertMention = (u: SystemUser) => {
    setNoteText((prev) => prev.replace(/@([A-Za-z0-9._-]*)$/, `@${u.name} `));
    setMention({ open: false, query: "" });
  };
  const mentionMatches = mention.open
    ? mentionUsers
        .filter(
          (u) =>
            (u.name || "").toLowerCase().includes(mention.query.toLowerCase()) ||
            (u.email || "").toLowerCase().includes(mention.query.toLowerCase()),
        )
        .slice(0, 6)
    : [];
  const [replyingToId, setReplyingToId] = useState<number | string | null>(
    null,
  );
  const [replyText, setReplyText] = useState("");
  const [deleteModal, setDeleteModal] = useState<{
    open: boolean;
    noteId?: number | string;
    parentNoteId?: number | string;
  } | null>(null);
  const [selectedEmailFiles, setSelectedEmailFiles] = useState<File[]>([]);
  const { user: authUser } = useCurrentUser();
  const currentUser = currentUserProp || authUser || {};
  const [emailActionModal, setEmailActionModal] = useState<{
    open: boolean;
    type: "reply" | "forward";
  } | null>(null);
  const openEmailAttachment = async (
    fileUrl: string,
    fileName = "attachment",
  ) => {
    try {
      const response = await getEmailAttachmentBlob(fileUrl);

      const blob = new Blob([response.data], {
        type: response.headers["content-type"] || "application/octet-stream",
      });

      const url = window.URL.createObjectURL(blob);
      window.open(url, "_blank");
    } catch (error) {
      console.error("Failed to open attachment:", error);
      toast.error("Failed to open attachment.");
    }
  };
  const [emailComment, setEmailComment] = useState("");
  const [forwardToEmail, setForwardToEmail] = useState("");
  const [emailSending, setEmailSending] = useState(false);
  const [noteFiles, setNoteFiles] = useState<File[]>([]);
  const [replyFiles, setReplyFiles] = useState<File[]>([]);

  const [editingNoteId, setEditingNoteId] = useState<number | string | null>(
    null,
  );
  const [editingParentNoteId, setEditingParentNoteId] = useState<
    number | string | null
  >(null);
  const [editText, setEditText] = useState("");
  const [editFiles, setEditFiles] = useState<File[]>([]);
  const [noteFormatting, setNoteFormatting] = useState({
    bold: false,
    italic: false,
    underline: false,
    list: false,
  });
  const [emailFormatting, setEmailFormatting] = useState({
    bold: false,
    italic: false,
    underline: false,
    list: false,
  });
  const parsedDetail = (() => {
    try {
      return typeof data?.detail_text === "string"
        ? JSON.parse(data.detail_text)
        : data?.detail_text || {};
    } catch {
      return {
        note: data?.detail_text || "",
      };
    }
  })();

  if (!isOpen || !data) return null;

  const getIcon = () => {
    switch (data.type) {
      case "Email":
        return EmailIcon;
      case "Upload":
        return UploadIcon;
      case "Note":
        return NotesIcon;
      case "Witness":
        return WitnessIcon;
      case "AI Report":
        return AIReportIcon;
      default:
        return UpdateIcon;
    }
  };
  // Display name = the part of the logged-in user's email before "@".
  const userName =
    currentUser?.name ||
    (currentUser?.email ? String(currentUser.email).split("@")[0] : "") ||
    (currentUser?.first_name && currentUser?.last_name
      ? `${currentUser.first_name} ${currentUser.last_name}`
      : "User");

  const userRole = currentUser?.role || "Claim Handler";

  const getInitials = (name = "") =>
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0])
      .join("")
      .toUpperCase() || "JD";

  const canDelete = (createdById?: number | string) => {
    if (!createdById || !currentUser?.id) return true; // demo fallback
    return String(createdById) === String(currentUser.id);
  };
  const handleSubmitNote = () => {
    if (!noteText.trim() && noteFiles.length === 0) return;

    const formattedNote = applyNoteFormatting(noteText.trim());

    onAddNote?.({
      activity: data,
      note: formattedNote,
      files: noteFiles,
    });

    setNoteText("");
    setNoteFiles([]);
    setNoteFormatting({
      bold: false,
      italic: false,
      underline: false,
      list: false,
    });
  };
  const escapeHtml = (value: string) =>
    value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

  const hasHtmlTags = (value = "") => /<\/?[a-z][\s\S]*>/i.test(value);

  const sanitizeNoteHtml = (html = "") => {
    if (!html) return "";

    const doc = new DOMParser().parseFromString(html, "text/html");

    doc
      .querySelectorAll("script, style, iframe, object, embed")
      .forEach((el) => el.remove());

    doc.body.querySelectorAll("*").forEach((el) => {
      [...el.attributes].forEach((attr) => {
        const name = attr.name.toLowerCase();
        const value = attr.value.toLowerCase();

        if (name.startsWith("on") || value.includes("javascript:")) {
          el.removeAttribute(attr.name);
        }
      });
    });

    return doc.body.innerHTML;
  };

  const applyNoteFormatting = (value: string) => {
    let output = escapeHtml(value).replace(/\n/g, "<br />");

    if (noteFormatting.list) {
      const lines = value
        .split("\n")
        .map((line) => line.replace(/^•\s*/, "").trim())
        .filter(Boolean);

      output = `<ul>${lines
        .map((line) => `<li>${escapeHtml(line)}</li>`)
        .join("")}</ul>`;
    }

    if (noteFormatting.bold) output = `<strong>${output}</strong>`;
    if (noteFormatting.italic) output = `<em>${output}</em>`;
    if (noteFormatting.underline) output = `<u>${output}</u>`;

    return output;
  };

  const stripHtmlToText = (html = "") => {
    const div = document.createElement("div");
    div.innerHTML = html;
    return div.textContent || div.innerText || "";
  };

  const renderNoteHtml = (value = "") => {
    let html = hasHtmlTags(value)
      ? sanitizeNoteHtml(value)
      : escapeHtml(value).replace(/\n/g, "<br />");

    // Highlight @mentions in blue so tagged users stand out from normal text.
    html = html.replace(
      /@([A-Za-z0-9._-]+)/g,
      '<span class="text-blue-500 font-weight-500">@$1</span>',
    );

    return { __html: html };
  };

  const getNoteAttachments = (item: any): NoteAttachment[] => {
    if (!item) return [];

    if (Array.isArray(item.attachments)) return item.attachments;
    if (Array.isArray(item.files)) return item.files;
    if (Array.isArray(item.note_attachments)) return item.note_attachments;

    return [];
  };

  const openNoteAttachment = (attachment: NoteAttachment) => {
    const fileUrl = attachment?.file_url || "";

    if (!fileUrl || fileUrl === "#") {
      toast.error("Attachment URL not found");
      return;
    }

    window.open(fileUrl, "_blank", "noopener,noreferrer");
  };

  const renderNoteAttachments = (attachments: NoteAttachment[] = []) => {
    if (!attachments.length) return null;

    return (
      <div className="self-stretch flex flex-wrap gap-2 pt-1">
        {attachments.map((attachment, index) => (
          <button
            key={`${attachment.file_name || "attachment"}-${index}`}
            type="button"
            onClick={() => openNoteAttachment(attachment)}
            className="inline-flex items-center gap-2 px-2 py-1 rounded bg-blue-50 text-blue-500 text-xs hover:underline"
          >
            <img src={attachmentt} alt="" className="w-3 h-3" />
            <span>{attachment.file_name || "Attachment"}</span>
          </button>
        ))}
      </div>
    );
  };
  const handleSubmitReply = (parentNoteId: number | string) => {
    if (!replyText.trim() && replyFiles.length === 0) return;

    const formattedReply = applyNoteFormatting(replyText.trim());

    onAddNote?.({
      activity: data,
      parentNoteId,
      reply: formattedReply,
      files: replyFiles,
    });

    setReplyText("");
    setReplyFiles([]);
    setReplyingToId(null);
    setNoteFormatting({
      bold: false,
      italic: false,
      underline: false,
      list: false,
    });
  };
  const handleSubmitEdit = () => {
    if (!editingNoteId || !editText.trim()) return;

    const formattedEdit = applyNoteFormatting(editText.trim());

    onAddNote?.({
      activity: data,
      noteId: editingNoteId,
      parentNoteId: editingParentNoteId || undefined,
      note: editingParentNoteId ? undefined : formattedEdit,
      reply: editingParentNoteId ? formattedEdit : undefined,
      files: editFiles,
      isEdit: true,
    });

    setEditingNoteId(null);
    setEditingParentNoteId(null);
    setEditText("");
    setEditFiles([]);
    setNoteFormatting({
      bold: false,
      italic: false,
      underline: false,
      list: false,
    });
  };
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

  const handleOpenNote = () => {
    setShowNoteBox(true);
  };

  const renderNotesSection = () => {
    if (!activityNotes || activityNotes.length === 0) return null;

    return (
      <div className="w-[700px] max-w-full flex flex-col items-start gap-6">
        {activityNotes.map((note) => (
          <div
            key={note.id}
            className="self-stretch flex flex-col items-end gap-2"
          >
            <div className="self-stretch p-4 rounded outline outline-1 outline-offset-[-1px] outline-blue-200 flex flex-col justify-start items-start gap-4">
              <div className="self-stretch flex justify-between items-center">
                <div className="flex justify-start items-start gap-2">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-500 text-sm font-weight-500">
                    {getInitials(note.createdByName) === "Unknown User" ? getInitials(userName) : getInitials(note.createdByName)}
                  </div>

                  <div className="w-24 flex flex-col justify-start items-start">
                    <div className="self-stretch text-black text-sm font-weight-500">
                      {note.createdByName}
                    </div>
                    <div className="self-stretch text-neutral-500 text-xs font-weight-400">
                      {note.createdByRole}
                    </div>
                  </div>
                </div>

                <div className="flex justify-start items-center gap-3">
                  <div className="text-neutral-500 text-sm font-weight-400">
                    {formatDateTime(note.createdAt)}
                  </div>

                  <div className="relative group">
                    <button className="w-5 h-5 text-neutral-300">⋮</button>

                    <div className="hidden group-hover:inline-flex absolute right-0 top-5 p-4 bg-white rounded shadow-[0px_4px_4px_0px_rgba(0,0,0,0.08)] flex-col justify-start items-start gap-4 z-20">
                      <button
                        type="button"
                        onClick={() => setReplyingToId(note.id)}
                        className="self-stretch inline-flex justify-start items-center gap-2"
                      >
                        <div className="w-14 flex justify-between items-center">
                          <img src={reply} alt="" className="w-3.5 h-3.5" />

                          <span className="text-blue-500 text-sm font-weight-300 font-light font-['Stack_Sans_Headline'] leading-4">
                            Reply
                          </span>
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingNoteId(note.id);
                          setEditingParentNoteId(null);
                          setEditText(stripHtmlToText(note.text));
                          setEditFiles([]);
                          setNoteFormatting({
                            bold: false,
                            italic: false,
                            underline: false,
                            list: false,
                          });
                        }}
                        className="self-stretch inline-flex justify-start items-center gap-2"
                      >
                        <div className="w-12 flex justify-between items-center">
                          <img src={NotesIcon} alt="" className="w-3.5 h-3.5" />
                          <span className="text-blue-500 text-sm font-weight-300 font-light font-['Stack_Sans_Headline'] leading-4">
                            Edit
                          </span>
                        </div>
                      </button>

                      {canDelete(note.createdById) && (
                        <button
                          type="button"
                          onClick={() =>
                            setDeleteModal({
                              open: true,
                              noteId: note.id,
                            })
                          }
                          className="self-stretch inline-flex justify-start items-center gap-2"
                        >
                          <div className="w-16 flex justify-between items-center">
                            <img src={deletee} alt="" className="w-3.5 h-3.5" />

                            <span className="text-red-500 text-sm font-weight-300 font-light font-['Stack_Sans_Headline'] leading-4">
                              Delete
                            </span>
                          </div>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div
                className="self-stretch text-neutral-700 text-sm font-weight-400 prose prose-sm max-w-none"
                dangerouslySetInnerHTML={renderNoteHtml(note.text)}
              />
              {renderNoteAttachments(getNoteAttachments(note))}
              {editingNoteId === note.id && !editingParentNoteId && (
                <div className="w-full pt-2">
                  {renderRichTextBox({
                    value: editText,
                    onChange: setEditText,
                    placeholder: "Edit note",
                    onSubmit: handleSubmitEdit,
                    widthClass: "w-full",
                    files: editFiles,
                    onFilesChange: setEditFiles,
                  })}
                </div>
              )}
            </div>

            {note.replies?.map((reply) => (
              <div
                key={reply.id}
                className="w-[628px] max-w-[calc(100%-72px)] p-4 rounded outline outline-1 outline-offset-[-1px] outline-blue-200 flex flex-col justify-start items-start gap-4"
              >
                <div className="self-stretch flex justify-between items-center">
                  <div className="flex justify-start items-start gap-2">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-500 text-sm font-weight-500">
                      {getInitials(reply.createdByName)}
                    </div>

                    <div className="w-24 flex flex-col justify-start items-start">
                      <div className="self-stretch text-black text-sm font-weight-500">
                        {reply.createdByName}
                      </div>
                      <div className="self-stretch text-neutral-500 text-xs font-weight-400">
                        {reply.createdByRole}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-start items-center gap-3">
                    <div className="text-neutral-500 text-sm font-weight-400">
                      {formatDateTime(reply.createdAt)}
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setEditingNoteId(reply.id);
                        setEditingParentNoteId(note.id);
                        setEditText(stripHtmlToText(reply.text));
                        setEditFiles([]);
                        setNoteFormatting({
                          bold: false,
                          italic: false,
                          underline: false,
                          list: false,
                        });
                      }}
                      className="text-xs text-blue-500 hover:underline"
                    >
                      Edit
                    </button>

                    {canDelete(reply.createdById) && (
                      <button
                        type="button"
                        onClick={() =>
                          setDeleteModal({
                            open: true,
                            noteId: reply.id,
                            parentNoteId: note.id,
                          })
                        }
                        className="text-xs text-red-500 hover:underline"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>

                <div
                  className="self-stretch text-neutral-700 text-sm font-weight-400 prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={renderNoteHtml(reply.text)}
                />
                {renderNoteAttachments(getNoteAttachments(reply))}

                {editingNoteId === reply.id &&
                  editingParentNoteId === note.id && (
                    <div className="w-full pt-2">
                      {renderRichTextBox({
                        value: editText,
                        onChange: setEditText,
                        placeholder: "Edit reply",
                        onSubmit: handleSubmitEdit,
                        widthClass: "w-full",
                        files: editFiles,
                        onFilesChange: setEditFiles,
                      })}
                    </div>
                  )}
              </div>
            ))}

            {replyingToId === note.id && (
              <div className="w-[628px] max-w-[calc(100%-72px)]">
                {renderRichTextBox({
                  value: replyText,
                  onChange: setReplyText,
                  placeholder: (
                    <div className="justify-start">
                      <span className="text-[#A6AAB1] text-sm font-weight-500 font-['Stack_Sans_Headline']">
                        Reply to{" "}
                      </span>

                      <span className="text-[#245BDB] text-sm font-weight-500 font-['Stack_Sans_Headline']">
                        {note.createdByName}
                      </span>
                    </div>
                  ),
                  onSubmit: () => handleSubmitReply(note.id),
                  widthClass: "w-full",
                  files: replyFiles,
                  onFilesChange: setReplyFiles,
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderRichTextBox = ({
    value,
    onChange,
    placeholder,
    onSubmit,
    widthClass = "w-[700px] max-w-full",
    files = [],
    onFilesChange,
  }: {
    value: string;
    onChange: (value: string) => void;
    placeholder: React.ReactNode;
    onSubmit: () => void;
    widthClass?: string;
    files?: File[];
    onFilesChange?: (files: File[]) => void;
  }) => {
    const formatClass = [
      noteFormatting.bold ? "font-weight-600" : "font-weight-300",
      noteFormatting.italic ? "italic" : "",
      noteFormatting.underline ? "underline" : "",
    ].join(" ");

    return (
      <div className={`${widthClass} flex flex-col items-end gap-3`}>
        <div className="self-stretch min-h-[8rem] px-5 pt-4 pb-2 bg-white rounded outline outline-1 outline-offset-[-1px] outline-neutral-200 flex flex-col justify-start items-start gap-2.5">
          <div className="relative w-full flex-1">
            {!value && typeof placeholder !== "string" && (
              <div className="absolute top-0 left-0 pointer-events-none text-sm font-weight-500 font-['Stack_Sans_Headline']">
                {placeholder}
              </div>
            )}

            <textarea
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={typeof placeholder === "string" ? placeholder : ""}
              className={`w-full flex-1 resize-none outline-none border-none bg-transparent text-neutral-700 text-sm placeholder:text-neutral-300 placeholder:font-light ${formatClass}`}
            />
          </div>

          <div className="self-stretch h-8 flex justify-between items-end">
            <div className="flex justify-start items-center gap-2.5 text-neutral-700 text-xs">
              <label className="hover:text-blue-600 cursor-pointer">
                <img src={Option1} alt="" />
                <input
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    const selected = Array.from(e.target.files || []);
                    onFilesChange?.([...(files || []), ...selected]);
                  }}
                />
              </label>

              <button
                type="button"
                onClick={() =>
                  setNoteFormatting((prev) => ({ ...prev, bold: !prev.bold }))
                }
                className={`italic hover:text-blue-600 ${
                  noteFormatting.bold ? "text-blue-600" : ""
                }`}
              >
                <img src={Option2} alt="" />
              </button>

              <button
                type="button"
                onClick={() =>
                  setNoteFormatting((prev) => ({
                    ...prev,
                    italic: !prev.italic,
                  }))
                }
                className={`italic hover:text-blue-600 ${
                  noteFormatting.italic ? "text-blue-600" : ""
                }`}
              >
                <img src={Option3} alt="" />
              </button>

              <button
                type="button"
                onClick={() =>
                  setNoteFormatting((prev) => ({
                    ...prev,
                    underline: !prev.underline,
                  }))
                }
                className={`underline hover:text-blue-600 ${
                  noteFormatting.underline ? "text-blue-600" : ""
                }`}
              >
                <img src={Option4} alt="" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setNoteFormatting((prev) => ({
                    ...prev,
                    list: !prev.list,
                  }));

                  if (!value.trim()) {
                    onChange("• ");
                    return;
                  }

                  const lines = value
                    .split("\n")
                    .map((line) =>
                      line.trim().startsWith("•") ? line : `• ${line}`,
                    )
                    .join("\n");

                  onChange(lines);
                }}
                className={`hover:text-blue-600 ${
                  noteFormatting.list ? "text-blue-600" : ""
                }`}
              >
                <img src={Option5} alt="" />
              </button>
            </div>
            {files.length > 0 && (
              <div className="self-stretch flex flex-wrap gap-2 pt-1">
                {files.map((file, index) => (
                  <div
                    key={`${file.name}-${index}`}
                    className="h-7 px-2 rounded bg-blue-50 text-blue-500 text-xs flex items-center gap-2"
                  >
                    <img src={attachmentt} alt="" className="w-3 h-3" />
                    <span>{file.name}</span>

                    <button
                      type="button"
                      onClick={() =>
                        onFilesChange?.(
                          files.filter((_, fileIndex) => fileIndex !== index),
                        )
                      }
                      className="text-neutral-400 hover:text-red-500"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
            <button
              type="button"
              onClick={onSubmit}
              // disabled={!value.trim()}
              className="h-8 px-3 py-2 bg-blue-100 disabled:opacity-50 rounded flex justify-center items-center text-blue-600 text-sm font-weight-400 leading-4"
            >
              Submit
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderEmailTextBox = () => {
    const formatClass = [
      emailFormatting.bold ? "font-weight-600" : "font-weight-300",
      emailFormatting.italic ? "italic" : "",
      emailFormatting.underline ? "underline" : "",
    ].join(" ");

    return (
      <div className="self-stretch min-h-[150px] px-5 pt-4 pb-2 bg-white border-b border-neutral-100 flex flex-col justify-start items-start gap-2.5">
        <textarea
          value={emailComment}
          onChange={(e) => setEmailComment(e.target.value)}
          placeholder="Write your message..."
          className={`w-full min-h-[105px] resize-none outline-none border-none bg-transparent text-neutral-800 text-sm leading-6 placeholder:text-neutral-300 placeholder:font-light ${formatClass}`}
        />

        <div className="self-stretch h-8 flex justify-between items-end">
          <div className="flex justify-start items-center gap-2.5 text-neutral-700 text-xs">
            <button type="button" className="hover:text-blue-600">
              <img src={Option1} alt="" />
            </button>

            <button
              type="button"
              onClick={() =>
                setEmailFormatting((prev) => ({ ...prev, bold: !prev.bold }))
              }
              className={`hover:text-blue-600 ${
                emailFormatting.bold ? "text-blue-600" : ""
              }`}
            >
              <img src={Option2} alt="" />
            </button>

            <button
              type="button"
              onClick={() =>
                setEmailFormatting((prev) => ({
                  ...prev,
                  italic: !prev.italic,
                }))
              }
              className={`hover:text-blue-600 ${
                emailFormatting.italic ? "text-blue-600" : ""
              }`}
            >
              <img src={Option3} alt="" />
            </button>

            <button
              type="button"
              onClick={() =>
                setEmailFormatting((prev) => ({
                  ...prev,
                  underline: !prev.underline,
                }))
              }
              className={`hover:text-blue-600 ${
                emailFormatting.underline ? "text-blue-600" : ""
              }`}
            >
              <img src={Option4} alt="" />
            </button>

            <button
              type="button"
              onClick={() => {
                if (!emailComment.trim()) {
                  setEmailComment("• ");
                  return;
                }

                const lines = emailComment
                  .split("\n")
                  .map((line) =>
                    line.trim().startsWith("•") ? line : `• ${line}`,
                  )
                  .join("\n");

                setEmailComment(lines);
              }}
              className="hover:text-blue-600"
            >
              <img src={Option5} alt="" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderNoteBox = () => {
    return (
      <div className="flex flex-col gap-4">
        <h3 className="text-black text-xl font-weight-600 leading-5">
          Add Note
        </h3>
        <div className="relative">
          {renderRichTextBox({
            value: noteText,
            onChange: handleNoteChange,
            placeholder: "Enter Text — type @ to tag someone",
            onSubmit: handleSubmitNote,
            files: noteFiles,
            onFilesChange: setNoteFiles,
          })}
          {mention.open && mentionMatches.length > 0 && (
            <div className="absolute z-50 left-0 right-0 bottom-full mb-2 max-h-56 overflow-auto bg-white border border-neutral-200 rounded-lg shadow-xl">
              {mentionMatches.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => insertMention(u)}
                  className="w-full text-left px-4 py-2.5 flex items-center gap-3 hover:bg-blue-50"
                >
                  <span className="w-7 h-7 rounded-full bg-blue-100 text-blue-500 text-xs font-weight-600 flex items-center justify-center shrink-0">
                    {(u.name || "?").charAt(0).toUpperCase()}
                  </span>
                  <span className="flex flex-col min-w-0">
                    <span className="text-sm text-blue-500 font-weight-500 truncate">@{u.name}</span>
                    <span className="text-xs text-neutral-400 truncate">{u.email}</span>
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderAttachmentLink = (attachment: any, fallbackName?: string) => {
    const fileUrl = attachment?.file_url || attachment || "#";
    const fileName = attachment?.file_name || fallbackName || "Attachment";

    return (
      <a
        href={fileUrl}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-2 text-[#245BDB] hover:underline text-sm"
      >
        <img src={attachmentt} alt="" />
        <span>{fileName}</span>
      </a>
    );
  };

  const aiAttachmentUrl =
    data?.ai?.report_pdf_url || data?.attachments?.[0]?.file_url || "";
  const aiAttachmentName =
    data?.attachments?.[0]?.file_name || "AI Damage Report.pdf";

  const getSeverityPill = (value: string) => {
    if (value === "High") {
      return (
        <span className="px-2 py-1 rounded bg-red-50 text-red-600 text-xs font-weight-600">
          High
        </span>
      );
    }

    if (value === "Low") {
      return (
        <span className="px-2 py-1 rounded bg-green-50 text-green-600 text-xs font-weight-600">
          Low
        </span>
      );
    }

    return (
      <span className="px-2 py-1 rounded bg-yellow-50 text-yellow-600 text-xs font-weight-600">
        {value}
      </span>
    );
  };
  const getWitnessStatement = () => {
    try {
      const parsed =
        typeof data.detail_text === "string"
          ? JSON.parse(data.detail_text)
          : data.detail_text;

      return parsed?.witness_statement || data.summary || "";
    } catch {
      return data.detail_text || data.summary || "";
    }
  };

  const getBaseSubject = () => {
    return data.subject || data.title || "Case Activity";
  };

  const getShareSubject = () => {
    const baseSubject = getBaseSubject();

    if (data.type === "Email" && emailActionModal?.type === "forward") {
      return baseSubject.toLowerCase().startsWith("fwd:")
        ? baseSubject
        : `Fwd: ${baseSubject}`;
    }

    if (data.type === "Email" && emailActionModal?.type === "reply") {
      return baseSubject.toLowerCase().startsWith("re:")
        ? baseSubject
        : `Re: ${baseSubject}`;
    }

    return baseSubject;
  };

  const getAiDamageRowsText = () => {
    const rows =
      data.meta?.damage_table ||
      data.ai?.damage_table ||
      staticAiTableRows ||
      [];

    if (!Array.isArray(rows) || rows.length === 0) {
      return "No damage summary available.";
    }

    return rows
      .map((item: any, index: number) => {
        const side = item.damage_side || item.side || "-";
        const area = item.area_of_damage || item.area || item.part || "-";
        const type =
          item.type_of_damage || item.type || item.damage_type || "-";
        const severity = item.severity || "-";
        const confidence = item.confidence
          ? String(item.confidence).includes("%")
            ? item.confidence
            : `${item.confidence}%`
          : "-";
        const points = item.points || "-";
        const repair = item.suggested_repair || item.repair || "-";

        return `${index + 1}. Side: ${side}
   Area: ${area}
   Type: ${type}
   Severity: ${severity}
   Confidence: ${confidence}
   Points: ${points}
   Suggested Repair: ${repair}`;
      })
      .join("\n\n");
  };

  const getAiReportMessageBody = () => {
    const rows = data.meta?.damage_table || data.ai?.damage_table || [];

    const formattedRows = rows
      .map(
        (item: any, index: number) =>
          `${index + 1}.
Side: ${item.damage_side || item.side || "-"}
Area: ${item.area_of_damage || item.area || item.part || "-"}
Type: ${item.type_of_damage || item.type || item.damage_type || "-"}
Severity: ${item.severity || "-"}
Confidence: ${
            item.confidence
              ? String(item.confidence).includes("%")
                ? item.confidence
                : `${item.confidence}%`
              : "-"
          }
Repair: ${item.suggested_repair || item.repair || "-"}`,
      )
      .join("\n\n");

    return `${emailComment ? `${emailComment}\n\n` : ""}AI Damage Report Summary

${formattedRows}`;
  };
  const getPdfLinksText = () => {
    const links = buildActivityAttachmentPayloads();

    if (!links.length) return "";

    return `

PDF Link${links.length > 1 ? "s" : ""}:
${links
  .map(
    (item: any, index: number) =>
      `${index + 1}. ${item.file_name || "PDF"}: ${item.file_url}`,
  )
  .join("\n")}`;
  };
  const getShareMessage = () => {
    if (data.type === "Witness") {
      return `${emailComment ? `${emailComment}\n\n` : ""}Witness Questionnaire

Title:
${data.title || "-"}

Submitted:
${formatDateTime(data.timestamp)}

Witness Statement:
${getWitnessStatement() || "No witness statement available."}${getPdfLinksText()}`;
    }

    if (data.type === "AI Report") {
      return `${getAiReportMessageBody()}${getPdfLinksText()}`;
    }

    return emailComment || "";
  };
  const buildActivityAttachmentPayloads = () => {
    const attachments = Array.isArray(data.attachments) ? data.attachments : [];

    const payloads = attachments
      .filter(
        (attachment: any) =>
          attachment?.file_url && attachment.file_url !== "#",
      )
      .map((attachment: any) => ({
        file_name: attachment.file_name || "attachment.pdf",
        file_url:
          data.type === "Witness"
            ? data.meta?.view_link || attachment.file_url
            : attachment.file_url,
        activity_type: data.type,
      }));

    const aiFileUrl =
      data?.ai?.report_pdf_url || data?.attachments?.[0]?.file_url;

    if (
      data.type === "AI Report" &&
      aiFileUrl &&
      !payloads.some((item: any) => item.file_url === aiFileUrl)
    ) {
      payloads.push({
        file_name: aiAttachmentName || "AI Damage Report.pdf",
        file_url: aiFileUrl,
        activity_type: data.type,
      });
    }

    return payloads;
  };

  const sendForwardWithAttachments = async (
    activity: any,
    toEmail: string,
    comment: string,
    files: File[] = [],
    subject?: string,
  ) => {
    const formData = new FormData();

    const messageId =
      activity?.message_id || activity?.meta?.message_id || activity?.id;

    if (
      activity?.type === "Email" &&
      messageId &&
      String(messageId).toLowerCase() !== "none" &&
      String(messageId).toLowerCase() !== "null"
    ) {
      formData.append("message_id", String(messageId));
    }

    formData.append("to_email", toEmail || "");
    formData.append("comment", comment || "");
    formData.append(
      "subject",
      subject || activity?.subject || activity?.title || "",
    );
    formData.append(
      "attachment_urls",
      JSON.stringify(buildActivityAttachmentPayloads()),
    );
    formData.append("use_graph", "true");

    files.forEach((file) => {
      formData.append("files", file);
    });

    const response = await axiosInstance.post(
      "/case-activity/email/forward-with-attachments",
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      },
    );

    return response.data;
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-black/20 z-40 transition-opacity"
        onClick={onClose}
      />

      <div
        className={`fixed top-0 right-0 h-full w-[918px] max-w-[96vw] bg-white font-['Stack_Sans_Headline'] shadow-[-4px_0px_20px_0px_rgba(0,0,0,0.08)] z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="w-full px-10 py-5 border-b border-neutral-100 flex justify-between items-center bg-white sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded flex items-center justify-center">
              <img src={getIcon()} alt="" className="h-6" />
            </div>

            <div className="flex flex-col">
              <h2 className="text-black text-[18px] font-weight-600">
                {data.title}
              </h2>
              <span className="text-neutral-500 text-sm font-weight-300">
                {formatDateTime(data.timestamp)}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="px-10 py-4 bg-blue-500 hover:bg-blue-700 text-white rounded text-base font-weight-400 transition-colors"
          >
            Close
          </button>
        </div>

        <div className="p-10 flex flex-col gap-6 overflow-y-auto h-[calc(100%-90px)]">
          {data.type === "AI Report" ? (
            <>
              <div className="flex items-center gap-8 text-blue-300 text-sm border-b border-neutral-100 pb-6 flex-wrap">
                <button
                  className="flex items-center gap-2 hover:text-blue-500"
                  onClick={handleOpenNote}
                >
                  <img src={NotesIcon} alt="" />
                  Add Note
                </button>

                <button
                  className="flex items-center gap-2 hover:text-blue-500"
                  onClick={() =>
                    setEmailActionModal({ open: true, type: "forward" })
                  }
                >
                  <img src={ForwardIcon} alt="" />
                  Forward to Client
                </button>

                {/* <button
                  className="flex items-center gap-2 hover:text-blue-500"
                  onClick={() => onViewInDocumentLibrary?.(data)}
                >
                  <img src={ViewIcon} alt="" />
                  Open in Document Library
                </button> */}

                {/* {aiAttachmentUrl && aiAttachmentUrl !== "#" && (
                  <a
                    href={aiAttachmentUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 hover:text-blue-700"
                  >
                  <img src={attachmentt} alt="" />
                    {aiAttachmentName}
                  </a>
                )} */}
              </div>

              <div className="space-y-1">
                <p className="text-sm text-neutral-700">
                  <span className="font-weight-300">System: </span>
                  <span className="font-weight-600">
                    {data.ai?.system_name || "AI Analysis System"}
                  </span>
                </p>
                <p className="text-sm text-neutral-700">
                  <span className="font-weight-300">Client: </span>
                  <span className="font-weight-600">
                    {data.ai?.client_name || "-"}
                  </span>
                </p>
                <p className="text-sm text-neutral-700">
                  <span className="font-weight-300">Generated: </span>
                  <span className="font-weight-600">
                    {formatDateTime(data.timestamp)}
                  </span>
                </p>
              </div>
              <div className="mt-1 p-4 bg-neutral-100 rounded-lg text-sm text-neutral-700">
                <div className="font-weight-600 mb-4">Damage Summary:</div>

                <div className="w-full overflow-x-auto">
                  <table className="w-full border border-neutral-200 rounded-lg overflow-hidden">
                    {/* HEADER */}
                    <thead className=" text-neutral-600 text-xs uppercase">
                      <tr>
                        <th className="text-left px-3 py-2 border-b">Side</th>
                        <th className="text-left px-3 py-2 border-b">Area</th>
                        <th className="text-left px-3 py-2 border-b">Type</th>
                        <th className="text-left px-3 py-2 border-b">
                          Severity
                        </th>
                        <th className="text-left px-3 py-2 border-b">
                          Confidence
                        </th>
                        <th className="text-left px-3 py-2 border-b">Points</th>
                        <th className="text-left px-3 py-2 border-b">Repair</th>
                      </tr>
                    </thead>

                    {/* BODY */}
                    <tbody className=" text-sm">
                      {(
                        data.meta?.damage_table ||
                        data.ai?.damage_table ||
                        []
                      ).map((item: any, i: number) => (
                        <tr key={i} className="border-b last:border-b-0">
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
                              ? String(item.confidence).includes("%")
                                ? item.confidence
                                : `${item.confidence}%`
                              : "-"}
                          </td>

                          <td className="px-3 py-2">{item.points || "-"}</td>

                          <td className="px-3 py-2">
                            {item.suggested_repair || item.repair || "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* {aiAttachmentUrl && aiAttachmentUrl !== "#" && ( */}
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => onViewInDocumentLibrary?.(data)}
                  className="inline-flex items-center gap-2 text-[#245BDB] hover:underline text-sm w-fit"
                >
                  <img src={attachmentt} alt="" />
                  <span>{aiAttachmentName}</span>
                </button>
              </div>
              {/* )} */}

              {renderNoteBox()}
              {renderNotesSection()}
            </>
          ) : data.type === "Email" ? (
            <>
              <div className="space-y-1">
                <div className="flex items-center gap-8 text-blue-300 text-sm border-b border-neutral-100 pb-3 mb-3 flex-wrap">
                  <button
                    className="flex items-center gap-2 hover:text-blue-500"
                    onClick={handleOpenNote}
                  >
                    <img src={NotesIcon} alt="" />
                    Add Note
                  </button>

                  <button
                    className="flex items-center gap-2 hover:text-blue-500"
                    onClick={() =>
                      setEmailActionModal({ open: true, type: "forward" })
                    }
                  >
                    <img src={ForwardIcon} alt="" />
                    Forward to Client
                  </button>
                  {/* {data.attachments?.length > 0 && (
                    <button
                      className="flex items-center gap-2 hover:text-blue-500"
                      onClick={() => onViewInDocumentLibrary?.(data)}
                    >
                      <img src={ViewIcon} alt="" />
                      Open in Document Library
                    </button>
                  )} */}
                  <button
                    className="flex items-center gap-2 hover:text-blue-500"
                    onClick={() =>
                      setEmailActionModal({ open: true, type: "reply" })
                    }
                  >
                    <img src={reply} alt="" />
                    Reply to Email
                  </button>

                  {/* {data.attachments?.length > 0 &&
                    renderAttachmentLink(
                      data.attachments[0],
                      data.attachments[0]?.file_name,
                    )} */}
                </div>

                <p className="text-sm text-neutral-700">
                  <span className="font-weight-300">Subject: </span>
                  <span className="font-weight-600">{data.subject || "-"}</span>
                </p>
                <p className="text-sm text-neutral-700">
                  <span className="font-weight-300">From: </span>
                  <span className="font-weight-600">
                    {data.sender_name || data.sender_email || "-"}
                  </span>
                </p>
                <p className="text-sm text-neutral-700">
                  <span className="font-weight-300">Received: </span>
                  <span className="font-weight-600">
                    {formatDateTime(data.received_at || data.timestamp)}
                  </span>
                </p>
              </div>

              <hr className="border-neutral-100" />

              <div className="bg-neutral-100 p-6 rounded-lg">
                <p className="text-neutral-700 text-sm font-weight-300 leading-relaxed whitespace-pre-line">
                  {data.body_text ||
                    data.body_preview ||
                    "No email body available."}
                </p>
              </div>

              {data.attachments?.length > 0 && (
                <div className="flex flex-col gap-2">
                  {data.attachments.map((attachment: any, index: number) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() =>
                        openEmailAttachment(
                          attachment.file_url,
                          attachment.file_name,
                        )
                      }
                      className="flex items-center gap-2.5 h-10 px-4 rounded bg-white text-blue-300 hover:bg-blue-50 transition-colors w-fit"
                    >
                      <img src={attachmentt} alt="" />
                      <span className="text-sm font-weight-300">
                        {attachment.file_name}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {renderNoteBox()}
              {renderNotesSection()}
            </>
          ) : data.type === "Witness" ? (
            <>
              {data.created_by_name && (
                <div className="space-y-1">
                  <p className="text-sm text-neutral-700">
                    <span className="font-weight-300">Updated By: </span>
                    <span className="font-weight-600">
                      {data.created_by_name}
                    </span>
                  </p>
                </div>
              )}
              <div className="flex items-center gap-8 text-blue-300 text-sm border-b border-neutral-100 pb-3 mb-3 flex-wrap">
                <button
                  className="flex items-center gap-2 hover:text-blue-500"
                  onClick={handleOpenNote}
                >
                  <img src={NotesIcon} alt="" />
                  Add Note
                </button>

                <button
                  className="flex items-center gap-2 hover:text-blue-500"
                  onClick={() =>
                    setEmailActionModal({ open: true, type: "forward" })
                  }
                >
                  <img src={ForwardIcon} alt="" />
                  Forward to Client
                </button>
              </div>
              {data.detail_text && (
                <div className="bg-neutral-100 p-6 rounded-lg">
                  <p className="text-neutral-700 text-sm font-weight-300 leading-relaxed whitespace-pre-line">
                    {(() => {
                      try {
                        const parsed =
                          typeof data.detail_text === "string"
                            ? JSON.parse(data.detail_text)
                            : data.detail_text;

                        return parsed?.witness_statement || "-";
                      } catch {
                        return data.detail_text || "-";
                      }
                    })()}
                  </p>
                </div>
              )}

              {data.attachments?.length > 0 && (
                <div className="flex flex-col gap-2">
                  {data.attachments.map((attachment: any, index: number) => (
                    <button
                      key={index}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();

                        const fileUrl =
                          data.meta?.view_link ||
                          data.attachments?.[0]?.file_url;

                        if (fileUrl) {
                          openWitnessPdf(fileUrl);
                        }
                      }}
                      className="flex items-center gap-2.5 h-10 px-4 rounded bg-white text-blue-300 hover:bg-blue-50 transition-colors w-fit"
                    >
                      <img src={attachmentt} alt="" />
                      <span className="text-sm font-weight-300">
                        {attachment.file_name}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {renderNoteBox()}
              {renderNotesSection()}
            </>
          ) : data.type === "Note" ? (
            <div className="w-full flex flex-col gap-6">
              <div className="w-full pb-4 border-b border-neutral-100">
                <h3 className="text-black text-xl font-weight-600">
                  Notes Thread
                </h3>
                <p className="text-neutral-400 text-sm font-weight-300 mt-1">
                  View, reply, edit, delete, and open attachments linked to this
                  activity.
                </p>
              </div>

              {renderNotesSection() || (
                <div className="w-full p-6 rounded-xl bg-neutral-50 border border-neutral-100 text-center">
                  <p className="text-neutral-400 text-sm font-weight-300">
                    No notes found for this activity.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <>
              {data.created_by_name && (
                <div className="space-y-1">
                  <p className="text-sm text-neutral-700">
                    <span className="font-weight-300">Updated By: </span>
                    <span className="font-weight-600">
                      {data.created_by_name}
                    </span>
                  </p>
                </div>
              )}

              {data.detail_text && (
                <div className="bg-neutral-100 p-6 rounded-lg">
                  <p className="text-neutral-700 text-sm font-weight-300 leading-relaxed whitespace-pre-line">
                    {data.detail_text}
                  </p>
                </div>
              )}

              {data.attachments?.length > 0 && (
                <div className="flex flex-col gap-2">
                  {data.attachments.map((attachment: any, index: number) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() =>
                        openEmailAttachment(
                          attachment.file_url,
                          attachment.file_name,
                        )
                      }
                      className="flex items-center gap-2.5 h-10 px-4 rounded bg-white text-blue-300 hover:bg-blue-50 transition-colors w-fit"
                    >
                      <img src={attachmentt} alt="" />
                      <span className="text-sm font-weight-300">
                        {attachment.file_name}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {renderNoteBox()}
              {renderNotesSection()}
            </>
          )}
        </div>
      </div>
      {deleteModal?.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="w-[400px] bg-white rounded-xl shadow-xl p-6 flex flex-col gap-5">
            {/* TITLE */}
            <h3 className="text-lg font-weight-600 text-black">Delete Note</h3>

            {/* MESSAGE */}
            <p className="text-sm text-neutral-600">
              Are you sure you want to delete this note? This action cannot be
              undone.
            </p>

            {/* ACTIONS */}
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteModal(null)}
                className="px-4 py-2 rounded bg-neutral-100 text-neutral-700 text-sm"
              >
                Cancel
              </button>

              <button
                onClick={() => {
                  onDeleteNote?.({
                    activity: data,
                    noteId: deleteModal.noteId!,
                    parentNoteId: deleteModal.parentNoteId,
                  });
                  setDeleteModal(null);
                }}
                className="px-4 py-2 rounded bg-red-500 text-white text-sm"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
      {emailActionModal?.open && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30">
          <div className="w-[720px] max-w-[95vw] bg-white rounded overflow-hidden flex flex-col">
            {/* Outlook-like header */}
            <div className="h-12 px-5 py-8 bg-white border-b border-neutral-200 flex items-center justify-between">
              <h2 className="text-[18px] font-weight-600 text-neutral-800 flex items-center gap-2">
                {emailActionModal.type === "reply" ? (
                  <>
                    <img src={reply} alt="" className="w-4 h-4" />
                    Reply
                  </>
                ) : (
                  <>
                    <img src={ForwardIcon} alt="" className="w-4 h-4" />
                    Forward
                  </>
                )}
              </h2>
              <button
                onClick={() => {
                  setEmailActionModal(null);
                  setEmailComment("");
                  setForwardToEmail("");
                }}
                className="text-neutral-400 hover:text-neutral-700 text-xl"
              >
                ×
              </button>
            </div>

            <div className="p-5 flex flex-col gap-3">
              {emailActionModal.type === "forward" && (
                <div className="flex items-center gap-3 border-b border-neutral-100 pb-2">
                  <span className="w-16 text-sm text-neutral-500">To</span>
                  <input
                    value={forwardToEmail}
                    onChange={(e) => setForwardToEmail(e.target.value)}
                    placeholder="Enter recipient email"
                    className="flex-1 outline-none text-sm text-neutral-800"
                  />
                </div>
              )}

              <div className="flex items-center gap-3 border-b border-neutral-100 pb-2">
                <span className="w-16 text-sm text-neutral-500">Subject</span>
                <input
                  readOnly
                  value={getShareSubject()}
                  className="flex-1 outline-none text-sm text-neutral-800 bg-transparent"
                />
              </div>

              {data.type === "Witness" ? (
                <div className="self-stretch min-h-[220px] px-5 pt-4 pb-2 bg-white border-b border-neutral-100 flex flex-col justify-start items-start gap-2.5">
                  <textarea
                    value={`${emailComment ? `${emailComment}\n\n` : ""}Witness Questionnaire

Title:
${data.title || "-"}

Submitted:
${formatDateTime(data.timestamp)}

Witness Statement:
${getWitnessStatement() || "No witness statement available."}`}
                    onChange={(e) => setEmailComment(e.target.value)}
                    className="w-full min-h-[180px] resize-none outline-none border-none bg-transparent text-neutral-800 text-sm leading-6 whitespace-pre-line"
                  />

                  <div className="self-stretch h-8 flex justify-between items-end">
                    <div className="flex justify-start items-center gap-2.5 text-neutral-700 text-xs">
                      <button type="button">
                        <img src={Option1} alt="" />
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setEmailFormatting((prev) => ({
                            ...prev,
                            bold: !prev.bold,
                          }))
                        }
                      >
                        <img src={Option2} alt="" />
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setEmailFormatting((prev) => ({
                            ...prev,
                            italic: !prev.italic,
                          }))
                        }
                      >
                        <img src={Option3} alt="" />
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setEmailFormatting((prev) => ({
                            ...prev,
                            underline: !prev.underline,
                          }))
                        }
                      >
                        <img src={Option4} alt="" />
                      </button>

                      <button type="button">
                        <img src={Option5} alt="" />
                      </button>
                    </div>
                  </div>
                </div>
              ) : data.type === "AI Report" ? (
                <div className="self-stretch px-5 pt-4 pb-4 bg-white border-b border-neutral-100 flex flex-col gap-4">
                  <textarea
                    value={emailComment}
                    onChange={(e) => setEmailComment(e.target.value)}
                    placeholder="Write your message..."
                    className="w-full min-h-[70px] resize-none outline-none border-none bg-transparent text-neutral-800 text-sm leading-6 placeholder:text-neutral-300 placeholder:font-light"
                  />

                  <div className="text-sm text-neutral-800 font-weight-600">
                    AI Damage Report Summary
                  </div>

                  <div className="w-full overflow-x-auto">
                    <table className="w-full border border-neutral-200 text-sm">
                      <thead className="bg-neutral-50 text-neutral-600">
                        <tr>
                          <th className="text-left px-3 py-2 border">Side</th>
                          <th className="text-left px-3 py-2 border">Area</th>
                          <th className="text-left px-3 py-2 border">Type</th>
                          <th className="text-left px-3 py-2 border">
                            Severity
                          </th>
                          <th className="text-left px-3 py-2 border">
                            Confidence
                          </th>
                          <th className="text-left px-3 py-2 border">Points</th>
                          <th className="text-left px-3 py-2 border">Repair</th>
                        </tr>
                      </thead>

                      <tbody>
                        {(
                          data.meta?.damage_table ||
                          data.ai?.damage_table ||
                          []
                        ).map((item: any, index: number) => (
                          <tr key={index}>
                            <td className="px-3 py-2 border">
                              {item.damage_side || item.side || "-"}
                            </td>
                            <td className="px-3 py-2 border">
                              {item.area_of_damage ||
                                item.area ||
                                item.part ||
                                "-"}
                            </td>
                            <td className="px-3 py-2 border">
                              {item.type_of_damage ||
                                item.type ||
                                item.damage_type ||
                                "-"}
                            </td>
                            <td
                              className={`px-3 py-2 border ${item.severity == "High" ? "text-red-500" : item.severity == "Medium" ? "text-orange-300" : "text-green-600"}`}
                            >
                              {item.severity || "-"}
                            </td>
                            <td className="px-3 py-2 border">
                              {item.confidence
                                ? String(item.confidence).includes("%")
                                  ? item.confidence
                                  : `${item.confidence}%`
                                : "-"}
                            </td>
                            <td className="px-3 py-2 border">
                              {item.points || "-"}
                            </td>
                            <td className="px-3 py-2 border">
                              {item.suggested_repair || item.repair || "-"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="self-stretch h-8 flex justify-between items-end">
                    <div className="flex justify-start items-center gap-2.5 text-neutral-700 text-xs">
                      <button type="button">
                        <img src={Option1} alt="" />
                      </button>
                      <button type="button">
                        <img src={Option2} alt="" />
                      </button>
                      <button type="button">
                        <img src={Option3} alt="" />
                      </button>
                      <button type="button">
                        <img src={Option4} alt="" />
                      </button>
                      <button type="button">
                        <img src={Option5} alt="" />
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                renderEmailTextBox()
              )}

              {data.type === "Email" && (
                <div className="bg-neutral-50 border border-neutral-100 rounded p-4 max-h-[240px] overflow-y-auto">
                  <div className="text-xs text-neutral-500 mb-3">
                    ---------- Original Message ----------
                  </div>

                  <p className="text-sm text-neutral-700">
                    <span className="font-weight-600">From:</span>{" "}
                    {data.sender_name || data.sender_email || "-"}
                  </p>

                  <p className="text-sm text-neutral-700">
                    <span className="font-weight-600">Subject:</span>{" "}
                    {data.subject || "-"}
                  </p>

                  <p className="text-sm text-neutral-700 mb-3">
                    <span className="font-weight-600">Received:</span>{" "}
                    {formatDateTime(data.received_at || data.timestamp)}
                  </p>

                  <div className="text-sm text-neutral-700 whitespace-pre-line">
                    {data.body_text ||
                      data.body_preview ||
                      "No email body available."}
                  </div>
                </div>
              )}
              {data.attachments?.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {data.attachments.map((attachment: any, index: number) => (
                    <div
                      key={index}
                      className="h-9 px-3 rounded flex items-center gap-2 text-xs text-blue-300"
                    >
                      <img src={attachmentt} alt="" />
                      {attachment.file_name}
                    </div>
                  ))}
                </div>
              )}
              {selectedEmailFiles.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedEmailFiles.map((file, index) => (
                    <div
                      key={`${file.name}-${index}`}
                      className="h-9 px-3 rounded border border-neutral-200 bg-white flex items-center gap-2 text-xs text-neutral-700"
                    >
                      <img src={attachmentt} alt="" />
                      <span>{file.name}</span>

                      <button
                        type="button"
                        onClick={() =>
                          setSelectedEmailFiles((prev) =>
                            prev.filter((_, fileIndex) => fileIndex !== index),
                          )
                        }
                        className="text-neutral-400 hover:text-red-500"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex justify-between items-center pt-2 border-top border-neutral-200">
                <div className="flex items-center gap-3 text-blue-500 text-sm">
                  <label className="px-10 py-4 font-weight-600  rounded border border-blue-500 bg-white flex items-center gap-2 cursor-pointer hover:bg-neutral-50">
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
                </div>

                <button
                  type="button"
                  disabled={
                    emailSending ||
                    (emailActionModal.type === "forward" &&
                      !forwardToEmail.trim())
                  }
                  onClick={async () => {
                    try {
                      setEmailSending(true);

                      if (emailActionModal.type === "reply") {
                        await replyToEmailGraph(
                          data,
                          emailComment,
                          selectedEmailFiles,
                        );
                      } else {
                        await sendForwardWithAttachments(
                          data,
                          forwardToEmail,
                          getShareMessage(),
                          selectedEmailFiles,
                          getShareSubject(),
                        );
                      }

                      setEmailActionModal(null);
                      setEmailComment("");
                      setForwardToEmail("");
                      setSelectedEmailFiles([]);
                      toast.success(
                        emailActionModal.type === "reply"
                          ? "Reply sent successfully."
                          : "Email forwarded successfully.",
                      );
                    } catch (error) {
                      console.error("Email action failed:", error);
                      toast.error("Failed to send email.");
                    } finally {
                      setEmailSending(false);
                    }
                  }}
                  className="px-10 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded text-base font-weight-400 transition-colors"
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

export default ActivityDetailSlider;
