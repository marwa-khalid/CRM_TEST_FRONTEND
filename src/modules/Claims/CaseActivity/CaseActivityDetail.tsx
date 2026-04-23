import React, { useState } from "react";
import {
  Mail,
  FileText,
  History,
  User,
  Edit3,
  Upload,
} from "lucide-react";
import attachment from '../../../assets/AutoClaim_icon/attachment.svg'
interface ActivityDetailSliderProps {
  isOpen: boolean;
  onClose: () => void;
  data: any;
  onAddNote?: (payload: { activity: any; note: string }) => void;
  onViewInDocumentLibrary?: (activity: any) => void;
  onForwardToClient?: (activity: any) => void;
}

const ActivityDetailSlider: React.FC<ActivityDetailSliderProps> = ({
  isOpen,
  onClose,
  data,
  onAddNote,
  onViewInDocumentLibrary,
  onForwardToClient,
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
                  onClick={() => onViewInDocumentLibrary?.(data)}
                >
                  <FileText size={16} />
                  View attachment in Document Library
                </button>

                <button
                  className="flex items-center gap-2 hover:text-blue-700"
                  onClick={() => onForwardToClient?.(data)}
                >
                  <FileText size={16} />
                  Forward to Client
                </button>
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

              <div className="bg-neutral-100 p-6 rounded-lg text-neutral-700 text-sm font-weight-300 leading-relaxed">
                <div className="mb-3 font-weight-400">Analysis Summary:</div>
                <div>· Vehicle Type: {data.ai?.vehicle_type || "-"}</div>
                <div>· Damage Severity: {data.ai?.damage_severity || "-"}</div>
                <div>
                  · Estimated Repair Cost:{" "}
                  {data.ai?.estimated_repair_cost || "-"}
                </div>
                <div>
                  · Recommended Action: {data.ai?.recommended_action || "-"}
                </div>
                <div>
                  · Fraud Risk Score: {data.ai?.fraud_risk_score || "-"}
                </div>

                {data.ai?.detail_summary && (
                  <div className="mt-4 whitespace-pre-line">
                    {data.ai.detail_summary}
                  </div>
                )}
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
                      <img src={attachment} alt="" />

                      <span className="text-sm font-weight-300">
                        {attachment.file_name || "AI Damage Report.pdf"}
                      </span>
                    </a>
                  ))}
                </div>
              )}

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
                    onClick={() => onViewInDocumentLibrary?.(data)}
                  >
                    <FileText size={16} />
                    View attachment in Document Library
                  </button>

                  <button
                    className="flex items-center gap-2 hover:text-blue-700"
                    onClick={() => onForwardToClient?.(data)}
                  >
                    <FileText size={16} />
                    Forward to Client
                  </button>
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
                      <img src={attachment} alt="" />

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
                      <img src={attachment} alt="" />
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
