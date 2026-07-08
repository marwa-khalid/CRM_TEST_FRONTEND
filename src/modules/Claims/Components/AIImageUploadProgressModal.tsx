import React from "react";
import { X } from "lucide-react";
import Complete from "../../../assets/AutoClaim_icon/Complete.svg";
import Processing from "../../../assets/AutoClaim_icon/Processing.svg";

export type AIUploadPhase = "uploading" | "processing" | "complete" | "error";

export type AIUploadProgressItem = {
  id: string;
  name: string;
  size: number;
  previewUrl: string;
  group?: string;
};

interface AIImageUploadProgressPanelProps {
  items: AIUploadProgressItem[];
  phase: AIUploadPhase;
  loadedBytes: number;
  totalBytes: number;
  speedBps: number;
  errorMessage?: string;
}

interface AIImageUploadProgressModalProps extends AIImageUploadProgressPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const formatBytes = (bytes: number) => {
  if (!bytes || bytes <= 0) return "0KB";
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
};

const SmallSpinner = () => (
  <div className="relative w-5 h-5 shrink-0">
    {Array.from({ length: 12 }).map((_, index) => (
      <span
        key={index}
        className="absolute left-1/2 top-1/2 w-[2px] h-[6px] rounded-full bg-[#9b9b9b] animate-loaderFade"
        style={{
          transform: `translate(-50%, -50%) rotate(${index * 30}deg) translateY(-7px)`,
          animationDelay: `${index * 0.08}s`,
        }}
      />
    ))}
  </div>
);

const CheckIcon = () => (
  <span className="w-5 h-5 shrink-0 rounded-full bg-[#4CAF50] flex items-center justify-center">
    <span className="w-2.5 h-1.5 border-l-2 border-b-2 border-white -rotate-45 translate-y-[-1px]" />
  </span>
);

const ANALYSIS_ROW_DELAY_MS = 1400;

export const AIImageUploadProgressPanel: React.FC<
  AIImageUploadProgressPanelProps
> = ({
  items,
  phase,
  loadedBytes,
  totalBytes,
  speedBps,
  errorMessage,
}) => {
  const [visibleAnalysedCount, setVisibleAnalysedCount] = React.useState(0);
  // Simulated "generating the report" progress. Once every image has been
  // analysed, the backend still needs a few seconds to compose the report — an
  // indeterminate wait. Rather than freeze the bar at ~98%, we trickle it upward
  // (80 -> 99%) so it always looks like it's moving.
  const [finalizeProgress, setFinalizeProgress] = React.useState(0);
  const itemKey = items.map((item) => item.id).join("|");
  const fileTotal = items.reduce((sum, item) => sum + item.size, 0);
  const progressBase = totalBytes || fileTotal || 1;
  const uploadProgress = Math.min(
    100,
    Math.round((loadedBytes / progressBase) * 100),
  );

  // Progress budget: uploading fills 0-60%, per-image analysis 60-80%, and the
  // final report-generation step creeps 80-99% (finalizeProgress). Complete = 100%.
  const analysedRatio =
    Math.min(visibleAnalysedCount, items.length) / Math.max(items.length, 1);
  const uploadingBarProgress = Math.round((uploadProgress / 100) * 60);
  const analysisBarProgress = Math.round(60 + analysedRatio * 20);
  const finalisingStarted =
    phase === "processing" &&
    items.length > 0 &&
    visibleAnalysedCount >= items.length;

  const progress =
    phase === "complete"
      ? 100
      : phase === "error"
        ? Math.max(uploadingBarProgress, analysisBarProgress)
        : phase === "processing"
          ? finalisingStarted
            ? Math.round(Math.max(analysisBarProgress, finalizeProgress))
            : analysisBarProgress
          : uploadingBarProgress;

  // Per-file upload ticks off real bytes (independent of the rescaled bar %).
  const equivalentLoaded = Math.min(
    fileTotal,
    fileTotal * (uploadProgress / 100),
  );

  React.useEffect(() => {
    if (phase === "complete") {
      setVisibleAnalysedCount(items.length);
      return;
    }

    if (phase !== "processing") {
      setVisibleAnalysedCount(0);
      return;
    }

    setVisibleAnalysedCount(0);
    if (!items.length) return;

    let nextCount = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const tickNextImage = () => {
      nextCount += 1;
      setVisibleAnalysedCount(Math.min(nextCount, items.length));

      if (nextCount < items.length) {
        timer = setTimeout(tickNextImage, ANALYSIS_ROW_DELAY_MS);
      }
    };

    timer = setTimeout(tickNextImage, ANALYSIS_ROW_DELAY_MS);

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [phase, itemKey, items.length]);

  // Once all images are analysed, trickle the bar 80 -> 99% while the backend
  // composes the report, so the final wait never looks frozen at ~98%.
  React.useEffect(() => {
    if (!finalisingStarted) {
      setFinalizeProgress(0);
      return;
    }
    let current = 80;
    setFinalizeProgress(current);
    const timer = setInterval(() => {
      // Ease-out toward 99%: bigger steps early, tiny steps near the cap. It
      // never reaches 100 — only the real "complete" phase does that.
      current = Math.min(99, current + Math.max(0.4, (99 - current) * 0.12));
      setFinalizeProgress(current);
    }, 350);
    return () => clearInterval(timer);
  }, [finalisingStarted]);

  const getItemState = (index: number) => {
    if (phase === "complete") return "done";

    if (phase === "processing") {
      if (index < visibleAnalysedCount) return "done";
      if (index === visibleAnalysedCount) return "uploading";
      return "pending";
    }

    const start = items
      .slice(0, index)
      .reduce((sum, item) => sum + item.size, 0);
    const end = start + items[index].size;

    if (equivalentLoaded >= end) return "done";
    if (phase === "uploading" && equivalentLoaded > start) return "uploading";
    return "pending";
  };

  const currentAnalysisIndex = Math.min(visibleAnalysedCount + 1, items.length);
  const analysisText =
    visibleAnalysedCount >= items.length
      ? "Preparing final report..."
      : `Analysing image ${currentAnalysisIndex} of ${items.length}...`;

  const statusText =
    phase === "processing"
      ? analysisText
      : phase === "complete"
        ? "Images uploaded and analysed"
        : phase === "error"
          ? errorMessage || "Upload failed. Please try again."
          : `Uploading - ${formatBytes(
              Math.min(loadedBytes, progressBase),
            )} of ${formatBytes(progressBase)}`;

  return (
    <>
      <div className="p-5 rounded-lg border border-gray-100 bg-white flex flex-col gap-4">
        <div className="flex items-center gap-4">
          {phase === "complete" ? (
            <img src={Complete} alt="" className="w-10 h-10" />
          ) : (
            <img
              src={Processing}
              alt=""
              className={`w-10 h-10 ${
                phase === "uploading" || phase === "processing"
                  ? "animate-[spin_2s_linear_infinite]"
                  : ""
              }`}
            />
          )}

          <div className="flex-1 min-w-0">
            <div className="text-black text-base font-weight-600">
              {statusText}
            </div>
            <div className="text-gray-500 text-sm">
              {phase === "uploading"
                ? `${formatBytes(speedBps)}/s`
                : phase === "processing"
                  ? visibleAnalysedCount >= items.length
                    ? "Finalising report..."
                    : "AI damage detection in progress"
                  : `${items.length} image${items.length === 1 ? "" : "s"}`}
            </div>
          </div>
          <div className="text-blue-600 text-sm font-weight-600">
            {progress}%
          </div>
        </div>

        <div className="w-full h-3 bg-blue-50 rounded-full relative overflow-hidden">
          <div
            className={`absolute left-0 top-0 h-full rounded-full transition-all duration-300 ${
              phase === "error" ? "bg-red-500" : "bg-blue-500"
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="flex flex-col gap-2 max-h-[330px] overflow-y-auto pr-1">
        {items.map((item, index) => {
          const state = getItemState(index);
          return (
            <div
              key={item.id}
              className="p-3 rounded-lg outline outline-1 outline-offset-[-1px] outline-neutral-200 flex items-center gap-3"
            >
              <img
                src={item.previewUrl}
                alt=""
                className="w-12 h-12 rounded object-cover bg-neutral-100"
              />
              <div className="flex-1 min-w-0">
                <div className="text-sm text-black line-clamp-1">
                  {item.name}
                </div>
                <div className="text-xs text-gray-400">
                  {item.group ? `${item.group} • ` : ""}
                  {formatBytes(item.size)}
                </div>
              </div>
              {state === "done" ? (
                <CheckIcon />
              ) : state === "uploading" ? (
                <SmallSpinner />
              ) : (
                <span className="w-5 h-5 shrink-0 rounded-full bg-neutral-200" />
              )}
            </div>
          );
        })}
      </div>
    </>
  );
};

export const AIImageUploadProgressModal: React.FC<
  AIImageUploadProgressModalProps
> = ({
  isOpen,
  items,
  phase,
  loadedBytes,
  totalBytes,
  speedBps,
  errorMessage,
  onClose,
}) => {
  if (!isOpen) return null;

  const canClose = phase === "complete" || phase === "error";
  const title =
    phase === "complete"
      ? "AI Images Uploaded"
      : phase === "error"
        ? "Upload Failed"
        : "Uploading AI Images";

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-[120] p-4 font-['Stack_Sans_Headline']">
      <div className="w-[640px] max-h-[88vh] p-6 bg-white rounded-lg flex flex-col gap-6 animate-in zoom-in-95">
        <div className="self-stretch flex justify-between items-center">
          <div className="text-neutral-900 text-[20px] font-weight-600">
            {title}
          </div>
          <button
            type="button"
            onClick={canClose ? onClose : undefined}
            disabled={!canClose}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="h-px bg-gray-100 w-full" />

        <AIImageUploadProgressPanel
          items={items}
          phase={phase}
          loadedBytes={loadedBytes}
          totalBytes={totalBytes}
          speedBps={speedBps}
          errorMessage={errorMessage}
        />

        <div className="self-stretch flex justify-end items-center gap-4">
          {canClose && (
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 bg-white border border-blue-600 rounded text-blue-600 text-base font-medium transition-colors hover:bg-blue-50"
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIImageUploadProgressModal;
