import React, { useState } from "react";
import { FileUpload } from "../application/file-upload/file-upload-base";
import { PulseLoader } from "react-spinners";
import { MdOutlineClose } from "react-icons/md";

interface UploadCSV5ModalProps {
  claimId?: string | number;
  isOpen?: boolean;
  loading?: boolean;
  error?: string | null;
  onClose: () => void;
  onUpload: () => void;
  confirming: () => boolean;
  title?: string;
  description?: string;
}

const UploadCSV5Modal: React.FC<UploadCSV5ModalProps> = ({
  claimId,
  isOpen,
  onClose,
  onUpload,
  confirming,
  loadings,
  error,
  title = "Upload V5C files",
  description = "Upload and attach files to this project"
}) => {
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [fileProgress, setFileProgress] = useState<any>({});
  const [isDisabled, setIsDisbaled] = useState(false);

  const handleFileChange = (files: FileList) => {
    const fileArray = Array.from(files);
    fileArray.forEach((file) => simulateFileUpload(file));
    setUploadedFiles((prev) => {
      const merged = [...prev, ...fileArray];

      // avoid duplicates (based on file name)
      const unique = merged.filter(
        (file, index, self) =>
          index === self.findIndex((f) => f.name === file.name)
      );

      return unique;
    });
  };

  const handleDelete = (fileName: string) => {
    setUploadedFiles((prevFiles) =>
      prevFiles.filter((file) => file.name !== fileName)
    );
    setFileProgress((prevProgress) => {
      const newProgress = { ...prevProgress };
      delete newProgress[fileName];
      return newProgress;
    });
  };

  const getFileType = (file: any) => {
    if (!file || !file.type) return "empty";

    const mime = file.type;

    if (mime.startsWith("image/")) return "img"; // or "image"
    if (mime.startsWith("audio/")) return "audio";
    if (mime.startsWith("video/")) return "video";
    if (mime.includes("pdf")) return "pdf";
    if (mime.includes("csv")) return "csv";
    if (mime.includes("msword")) return "doc";
    if (mime.includes("spreadsheet") || mime.includes("excel")) return "xls";
    if (mime.includes("presentation")) return "ppt";

    // fallback: extract extension if MIME not matched
    const ext = file.name.split(".").pop().toLowerCase();
    const validTypes = [
      "ai",
      "avi",
      "css",
      "csv",
      "doc",
      "docx",
      "eps",
      "exe",
      "fig",
      "gif",
      "html",
      "indd",
      "java",
      "jpeg",
      "jpg",
      "js",
      "json",
      "mkv",
      "mp3",
      "mp4",
      "mpeg",
      "pdf",
      "png",
      "ppt",
      "pptx",
      "psd",
      "rar",
      "rss",
      "sql",
      "svg",
      "tiff",
      "txt",
      "wav",
      "webp",
      "xls",
      "xlsx",
      "xml",
      "zip",
    ];

    return validTypes.includes(ext) ? ext : "document";
  };

  const simulateFileUpload = (file: File) => {
    setIsDisbaled(true);
    let progress = 0;
    const progressKey = file.name;

    const progressInterval = setInterval(() => {
      progress += 10;
      setFileProgress((prevProgress) => ({
        ...prevProgress,
        [progressKey]: progress,
      }));

      if (progress >= 100) {
        setIsDisbaled(false);
        clearInterval(progressInterval);
      }
    }, 1000);
  };

  const handleUpload = async () => {
    onUpload(uploadedFiles);
  };

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-xl mx-4 shadow-xl">
        <div className="p-6">
          <div className="flex justify-end">
            <MdOutlineClose
              onClick={() => {
                onClose();
              }}
              className="text-20 cursor-pointer"
            />
          </div>

          {/* Heading
          <h2 className="text-xl font-weight-600 mb-2 text-center text-gray-800">
            Upload V5C files
          </h2>
          <p className="text-sm text-gray-600 mb-6 text-center">
            Upload and attach files to this project
          </p> */}
          {/* Heading - Use the title prop */}
          <h2 className="text-xl font-weight-600 mb-2 text-center text-gray-800">
            {title}
          </h2>
          <p className="text-sm text-gray-600 mb-6 text-center">
            {description}
          </p>

          {/* Debug info */}
          <div className="text-xs text-gray-500 mb-2 text-center"></div>

          <FileUpload.Root>
            <FileUpload.DropZone
              allowsMultiple={true}
              onDropFiles={handleFileChange}
              accept="image/*,.pdf,.docx,.doc"
              onDropUnacceptedFiles={(files) =>
                alert("Unaccepted files dropped")
              }
              hint="Drag & Drop your files here"
            />

            <FileUpload.List>
              {uploadedFiles.length > 0 ? (
                uploadedFiles.map((file) => {
                  return (
                    <FileUpload.ListItemProgressBar
                      key={file.name}
                      name={file.name}
                      status=""
                      fileIconVariant="default"
                      size={file.size}
                      progress={fileProgress[file.name] || 0}
                      onDelete={() => handleDelete(file.name)}
                      type={getFileType(file)}
                    ></FileUpload.ListItemProgressBar>
                  );
                })
              ) : (
                <div></div>
              )}
            </FileUpload.List>
          </FileUpload.Root>
          {/* Footer Buttons */}
          <div className="flex justify-center w-full space-x-3 pt-4">
            <button
              onClick={onClose}
              className="px-5 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium w-full h-12"
            >
              Cancel
            </button>
            <button
              disabled={isDisabled}
              onClick={() => {
                handleUpload();
              }}
              className={`px-5 py-2.5 text-white rounded-lg transition-colors font-medium w-full h-12 
                            ${
                              isDisabled
                                ? "cursor-not-allowed opacity-50 bg-custom" // Disabled state: no hover and opacity reduced
                                : "cursor-pointer bg-custom hover:bg-[#252B37]"
                            } // Enabled state: with hover effect
                          `}
            >
              {confirming ? (
                <PulseLoader size={10} speedMultiplier={1} color="#ffffff" />
              ) : (
                "Confirm & Attach"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadCSV5Modal;
