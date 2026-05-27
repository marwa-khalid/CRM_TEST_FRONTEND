import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import { getDocumentPreviewPages } from "../../../services/DocumentLibrary/DocumentLibrary";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  caseDocumentId: number | null;
}

const WitnessQuestionnaireViewer: React.FC<Props> = ({ isOpen, onClose, caseDocumentId }) => {
  const [previewData, setPreviewData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !caseDocumentId) return;
    setPreviewData(null);
    setLoading(true);

    getDocumentPreviewPages(caseDocumentId)
      .then((pages) => setPreviewData(pages))
      .catch(() => setPreviewData(null))
      .finally(() => setLoading(false));
  }, [isOpen, caseDocumentId]);

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />

      <div
        className={`fixed top-0 right-0 h-full w-[720px] max-w-[95vw] bg-white z-50 shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out font-['Stack_Sans_Headline'] ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="px-6 py-5 flex justify-between items-center shrink-0 bg-white border-b z-10">
          <h2 className="text-neutral-900 text-xl font-weight-600">Witness Questionnaire</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="relative w-[73px] h-[73px]">
                {Array.from({ length: 12 }).map((_, index) => (
                  <span
                    key={index}
                    className="absolute left-1/2 top-1/2 w-[6px] h-[16px] rounded-full bg-[#9b9b9b] animate-loaderFade"
                    style={{
                      transform: `translate(-50%, -50%) rotate(${index * 30}deg) translateY(-25px)`,
                      animationDelay: `${index * 0.08}s`,
                    }}
                  />
                ))}
              </div>
            </div>
          ) : previewData?.type === "pdf" && previewData.pages?.length > 0 ? (
            <div className="w-full bg-white flex flex-col items-center gap-6 py-6 px-4">
              {previewData.pages.map((page: any) => (
                <div key={page.page} className="w-full flex justify-center">
                  <img
                    src={page.image}
                    alt={`Page ${page.page}`}
                    className="w-full max-w-[660px] h-auto object-contain bg-white rounded shadow-sm"
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
              Unable to load questionnaire document.
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default WitnessQuestionnaireViewer;
