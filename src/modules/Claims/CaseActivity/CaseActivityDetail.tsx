import React, { useState } from "react";
import {
  Mail,
  FileText,
  History,
  User,
  Edit3,
  Upload,
  Reply,
  Paperclip,
  Eye,
} from "lucide-react";
import attachmentt from "../../../assets/AutoClaim_icon/attachment.svg";

interface ActivityDetailSliderProps {
  isOpen: boolean;
  onClose: () => void;
  data: any;
  onAddNote?: (payload: { activity: any; note: string }) => void;
  onViewInDocumentLibrary?: (activity: any) => void;
  onForwardToClient?: (activity: any) => void;
  onReplyToEmail?: (activity: any) => void;
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

const ActivityDetailSlider: React.FC<ActivityDetailSliderProps> = ({
  isOpen,
  onClose,
  data,
  onAddNote,
  onViewInDocumentLibrary,
  onForwardToClient,
  onReplyToEmail,
}) => {
  const [showNoteBox, setShowNoteBox] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [notes, setNotes] = useState<
    { id: number; text: string; createdAt: string }[]
  >([]);

  if (!isOpen || !data) return null;

  const getIcon = () => {
    switch (data.type) {
      case "Email":
        return <Mail className="text-blue-500" size={24} />;
      case "Upload":
        return <Upload className="text-blue-500" size={24} />;
      case "Note":
        return <Edit3 className="text-blue-500" size={24} />;
      case "Witness":
        return <User className="text-blue-500" size={24} />;
      case "AI Report":
        return <FileText className="text-blue-500" size={24} />;
      default:
        return <History className="text-blue-500" size={24} />;
    }
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

  const handleSaveNote = () => {
    if (!noteText.trim()) return;

    const newNote = {
      id: Date.now(),
      text: noteText.trim(),
      createdAt: new Date().toISOString(),
    };

    setNotes((prev) => [newNote, ...prev]);
    onAddNote?.({ activity: data, note: noteText.trim() });

    setNoteText("");
    setShowNoteBox(false);
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


  const renderNotesSection = () => {
    if (notes.length === 0) return null;

    return (
      <div className="flex flex-col gap-3">
        <h3 className="text-base font-weight-600 text-black">Notes</h3>

        {notes.map((note) => (
          <div key={note.id} className="bg-neutral-100 p-4 rounded-lg">
            <p className="text-neutral-700 text-sm font-weight-300 whitespace-pre-line leading-relaxed">
              {note.text}
            </p>
            <p className="text-neutral-500 text-xs mt-2">
              {formatDateTime(note.createdAt)}
            </p>
          </div>
        ))}
      </div>
    );
  };

  const renderNoteBox = () => {
    if (!showNoteBox) return null;

    return (
      <div className="mt-4 border-t border-neutral-100 pt-6">
        <div className="flex flex-col gap-3">
          <label className="text-sm text-neutral-700 font-weight-400">
            Add Note
          </label>

          <textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="Write your note here..."
            rows={5}
            className="w-full rounded-lg border border-neutral-200 px-4 py-3 text-sm text-neutral-700 outline-none focus:border-blue-500 resize-none"
          />

          <div className="flex items-center gap-3">
            <button
              onClick={handleSaveNote}
              disabled={!noteText.trim()}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-lg text-sm transition-colors"
            >
              Save Note
            </button>

            <button
              onClick={() => {
                setShowNoteBox(false);
                setNoteText("");
              }}
              className="px-5 py-2.5 border border-neutral-200 hover:bg-neutral-50 text-neutral-700 rounded-lg text-sm transition-colors"
            >
              Cancel
            </button>
          </div>
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
        <Paperclip size={14} />
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
              {getIcon()}
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
            className="px-10 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded text-base font-weight-400 transition-colors"
          >
            Close
          </button>
        </div>

        <div className="p-10 flex flex-col gap-6 overflow-y-auto h-[calc(100%-90px)]">
          {data.type === "AI Report" ? (
            <>
              <div className="flex items-center gap-8 text-blue-600 text-sm border-b border-neutral-100 pb-6 flex-wrap">
                <button
                  className="flex items-center gap-2 hover:text-blue-700"
                  onClick={handleOpenNote}
                >
                  <Edit3 size={16} />
                  Add Note
                </button>

                <button
                  className="flex items-center gap-2 hover:text-blue-700"
                  onClick={() => onForwardToClient?.(data)}
                >
                  <FileText size={16} />
                  Forward to Client
                </button>

                <button
                  className="flex items-center gap-2 hover:text-blue-700"
                  onClick={() => onViewInDocumentLibrary?.(data)}
                >
                  <Eye size={16} />
                  Open in Document Library
                </button>

                {/* {aiAttachmentUrl && aiAttachmentUrl !== "#" && (
                  <a
                    href={aiAttachmentUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 hover:text-blue-700"
                  >
                    <Paperclip size={16} />
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
                      {staticAiData.map((item, i) => (
                        <tr key={i} className="border-b last:border-b-0">
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

                          <td className="px-3 py-2">{item.confidence}</td>
                          <td className="px-3 py-2">{item.points}</td>
                          <td className="px-3 py-2">{item.repair}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* {aiAttachmentUrl && aiAttachmentUrl !== "#" && ( */}
              <div className="flex flex-col gap-2">
                {renderAttachmentLink(
                  { file_url: aiAttachmentUrl, file_name: aiAttachmentName },
                  aiAttachmentName,
                )}
              </div>
              {/* )} */}

              {renderNotesSection()}
              {renderNoteBox()}
            </>
          ) : data.type === "Email" ? (
            <>
              <div className="space-y-1">
                <div className="flex items-center gap-8 text-blue-600 text-sm border-b border-neutral-100 pb-3 mb-3 flex-wrap">
                  <button
                    className="flex items-center gap-2 hover:text-blue-700"
                    onClick={handleOpenNote}
                  >
                    <Edit3 size={16} />
                    Add Note
                  </button>

                  <button
                    className="flex items-center gap-2 hover:text-blue-700"
                    onClick={() => onForwardToClient?.(data)}
                  >
                    <FileText size={16} />
                    Forward to Client
                  </button>

                  {data.attachments?.length > 0 && (
                    <button
                      className="flex items-center gap-2 hover:text-blue-700"
                      onClick={() => onViewInDocumentLibrary?.(data)}
                    >
                      <Eye size={16} />
                      Open in Document Library
                    </button>
                  )}
                  <button
                    className="flex items-center gap-2 hover:text-blue-700"
                    onClick={() => onReplyToEmail?.(data)}
                  >
                    <Reply size={16} />
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
                    <a
                      key={index}
                      href={attachment.file_url || "#"}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2.5 h-10 px-4 rounded bg-white text-blue-600 hover:bg-blue-50 transition-colors w-fit"
                    >
                      <img src={attachmentt} alt="" />
                      <span className="text-sm font-weight-300">
                        {attachment.file_name}
                      </span>
                    </a>
                  ))}
                </div>
              )}

              {renderNotesSection()}
              {renderNoteBox()}
            </>
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
                    <a
                      key={index}
                      href={attachment.file_url || "#"}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2.5 h-10 px-4 rounded bg-white text-blue-600 hover:bg-blue-50 transition-colors w-fit"
                    >
                      <img src={attachmentt} alt="" />
                      <span className="text-sm font-weight-300">
                        {attachment.file_name}
                      </span>
                    </a>
                  ))}
                </div>
              )}

              {renderNotesSection()}
              {renderNoteBox()}
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default ActivityDetailSlider;
