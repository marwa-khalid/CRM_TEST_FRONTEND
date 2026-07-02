import React, { useEffect, useState } from "react";
import { Download, X } from "lucide-react";
import {
  getDocumentPresignedUrl,
  getDocumentPreviewPages,
  registerDocumentDownload,
} from "../../../services/DocumentLibrary/DocumentLibrary";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  caseDocumentId: number | null;
}

const WitnessQuestionnaireViewer: React.FC<Props> = ({ isOpen, onClose, caseDocumentId }) => {
  const [previewData, setPreviewData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (!isOpen || !caseDocumentId) return;
    let cancelled = false;

    setPreviewData(null);
    setLoading(true);

    getDocumentPreviewPages(caseDocumentId, { compact: true })
      .then((pages) => {
        if (!cancelled) setPreviewData(pages);
      })
      .catch(() => {
        if (cancelled) return;
        setPreviewData(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, caseDocumentId]);

  if (!isOpen) return null;

  const handleDownload = async () => {
    if (!caseDocumentId) return;

    setDownloading(true);
    try {
      await registerDocumentDownload(caseDocumentId).catch(() => {});
      const response = await getDocumentPresignedUrl(caseDocumentId, {
        download: true,
      });
      const url = response?.url;
      if (!url) return;

      const link = document.createElement("a");
      link.href = url;
      link.download =
        previewData?.file_name || "Witness-Questionnaire.pdf";
      link.rel = "noopener noreferrer";
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Failed to download witness questionnaire", error);
    } finally {
      setDownloading(false);
    }
  };

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
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownload}
              disabled={!caseDocumentId || downloading}
              className="h-9 px-3 rounded border border-blue-100 text-blue-600 hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2 text-sm"
            >
              <Download className="w-4 h-4" />
              {downloading ? "Downloading" : "Download"}
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 min-h-0 overflow-y-auto bg-white">
          {loading ? (
            <div className="flex items-center justify-center min-h-full">
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
            <div className="w-full bg-white flex flex-col items-center gap-0 px-0 pt-5 pb-8 text-[0px] leading-none">
              {previewData.pages.map((page: any) => (
                <div key={page.page} className="w-full flex justify-center leading-none text-[0px]">
                  <img
                    src={page.image}
                    alt={`Page ${page.page}`}
                    className="block w-full max-w-none h-auto object-contain bg-white rounded-none shadow-none align-top"
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center min-h-full text-gray-400 text-sm">
              Unable to load questionnaire document.
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default WitnessQuestionnaireViewer;
