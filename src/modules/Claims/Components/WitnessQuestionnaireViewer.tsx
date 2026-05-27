import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import { getQuestionnaireFromId } from "../../../services/Accidents/Cards/cards";
import { getDocumentPreviewPages } from "../../../services/DocumentLibrary/DocumentLibrary";

const QUESTION_LABELS: Record<string, string> = {
  didSeeAccident: "Did you actually see the accident?",
  location: "Where were you at the time, and how near to the scene of the accident?",
  weatherConditions: "What were the weather conditions?",
  roadConditions: "What were the road conditions?",
  vehicleDescription: "Please describe the vehicles and drivers involved",
  warningGiven: "Did you hear or see either driver give any warning?",
  lightsDisplayed: "What lights were displayed on the vehicle?",
  speedEstimate: "At what speed would you estimate the vehicles involved to have been travelling?",
  obstructedView: "Was there anything to obstruct the view of any driver involved?",
  driverActions: "Did any driver involved apply his brakes, swerve or skid?",
  distanceTravelled: "How far did each vehicle travel after impact?",
  avoidableCollision: "Could any of the drivers involved do anything to avoid collision?",
  faultOpinion: "In your opinion, who was to blame for the accident?",
  knownDriver: "Was any driver involved known to you – if so, please give details",
  policeStatement: "Did you give a statement to the police?",
  otherWitnesses: "Please give the names and addresses of any other witnesses to the accident",
  interviewLocation: "Where can you be interviewed if required?",
  conversationAfterAccident:
    "Was there any conversation between any of the parties involved following the accident regarding who was at fault?",
};

interface Props {
  isOpen: boolean;
  onClose: () => void;
  claimQuestionnaireId: number | null;
}

const WitnessQuestionnaireViewer: React.FC<Props> = ({ isOpen, onClose, claimQuestionnaireId }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !claimQuestionnaireId) return;
    setData(null);
    setPreviewData(null);
    setLoading(true);

    getQuestionnaireFromId(claimQuestionnaireId)
      .then(async (res) => {
        setData(res);
        // If a case_document_id exists, load page-image previews the same way
        // the document library does — no browser PDF chrome, no tabs.
        if (res?.case_document_id) {
          setPreviewLoading(true);
          try {
            const pages = await getDocumentPreviewPages(res.case_document_id);
            setPreviewData(pages);
          } catch {
            setPreviewData(null);
          } finally {
            setPreviewLoading(false);
          }
        }
      })
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [isOpen, claimQuestionnaireId]);

  if (!isOpen) return null;

  const answerMap: Record<string, string> = {};
  (data?.answers || []).forEach((a: any) => {
    answerMap[a.question] = a.answer;
  });

  const Field = ({ label, value }: { label: string; value?: string }) => (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-gray-400 font-weight-500">{label}</span>
      <span className="text-sm text-neutral-700 font-light">{value || "—"}</span>
    </div>
  );

  const isLoading = loading || previewLoading;

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
          {isLoading ? (
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
          ) : !data ? (
            <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
              Unable to load questionnaire data.
            </div>
          ) : previewData?.type === "pdf" && previewData.pages?.length > 0 ? (
            /* ── Page-image preview (same as DocumentLibrarySlider) ── */
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
            /* ── Fallback: structured Q&A if no PDF stored ── */
            <div className="p-6 flex flex-col gap-8">
              <section className="flex flex-col gap-4">
                <h3 className="text-base font-weight-600 text-neutral-900 border-b pb-2">
                  Witness Details
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Name" value={answerMap["name"]} />
                  <Field label="Date of Birth" value={answerMap["dob"]} />
                  <Field label="Occupation" value={answerMap["occupation"]} />
                  <Field label="Address" value={answerMap["address"]} />
                </div>
              </section>

              <section className="flex flex-col gap-4">
                <h3 className="text-base font-weight-600 text-neutral-900 border-b pb-2">
                  Questionnaire
                </h3>
                <div className="flex flex-col gap-4">
                  {Object.entries(QUESTION_LABELS).map(([key, label]) => (
                    <div key={key} className="flex flex-col gap-1">
                      <span className="text-xs text-gray-400 font-weight-500">{label}</span>
                      <p className="text-sm text-neutral-700 font-light bg-neutral-50 rounded px-3 py-2 min-h-[36px]">
                        {answerMap[key] || "—"}
                      </p>
                    </div>
                  ))}
                </div>
              </section>

              <section className="flex flex-col gap-4">
                <h3 className="text-base font-weight-600 text-neutral-900 border-b pb-2">
                  Incident Details
                </h3>
                <Field label="Accident Description" value={answerMap["accidentDescription"]} />
                <Field
                  label="Statement of Truth"
                  value={answerMap["statementOfTruth"] === "Yes" ? "Confirmed" : "Not confirmed"}
                />
                {answerMap["sketch"] && (
                  <div className="flex flex-col gap-2">
                    <span className="text-xs text-gray-400 font-weight-500">Incident Sketch</span>
                    <div className="w-full rounded-lg overflow-hidden bg-neutral-50 border border-gray-100">
                      <img
                        src={answerMap["sketch"]}
                        alt="Incident sketch"
                        className="w-full object-contain max-h-[300px]"
                      />
                    </div>
                  </div>
                )}
              </section>

              {(answerMap["witnessSignature"] || data.signWitness) && (
                <section className="flex flex-col gap-4">
                  <h3 className="text-base font-weight-600 text-neutral-900 border-b pb-2">
                    Signature
                  </h3>
                  <div className="w-full rounded-lg overflow-hidden bg-neutral-50 border border-gray-100 flex items-center justify-center min-h-[120px]">
                    <img
                      src={answerMap["witnessSignature"] || data.signWitness}
                      alt="Witness signature"
                      className="max-h-[160px] object-contain"
                    />
                  </div>
                </section>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default WitnessQuestionnaireViewer;
