import PdfIcon from "../assets/FileTypes/PDF.svg";
import DocIcon from "../assets/FileTypes/DOC.svg";
import ExcelIcon from "../assets/FileTypes/Excel.svg";
import PptIcon from "../assets/FileTypes/PPT.svg";
import PngIcon from "../assets/FileTypes/PNG.svg";

// Pick a file-type logo from a filename (falls back to the image icon).
export const fileTypeIcon = (filename?: string | null): string => {
  const lower = (filename || "").toLowerCase();
  if (lower.endsWith(".pdf")) return PdfIcon;
  if (lower.endsWith(".doc") || lower.endsWith(".docx")) return DocIcon;
  if (lower.endsWith(".xls") || lower.endsWith(".xlsx") || lower.endsWith(".csv")) return ExcelIcon;
  if (lower.endsWith(".ppt") || lower.endsWith(".pptx")) return PptIcon;
  return PngIcon;
};
