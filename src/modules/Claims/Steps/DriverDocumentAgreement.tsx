import { useState, useEffect, useRef, useMemo } from "react";
import { useFormik } from "formik";
import { toast } from "react-toastify";

// Icons
import uploadIcon from "../../../assets/AutoClaim_icon/uploadSmall.svg";
import Vector6 from "../../../assets/AutoClaim_icon/Vector-6.svg";
import { CustomDatePicker } from "../Components/DatePicker";
import { DriverDocumentUploadModal } from "../Components/DriverDocumentUploadModal";
// Services
import {
  createDriverDocumentAgreement,
  getDriverDocumentAgreement,
  updateDriverDocumentAgreement,
  uploadDriverDocumentAgreementFile,
} from "../../../services/DriverDocumentAgreement/DriverDocumentAgreement";

const DriverDocumentAgreement = ({ formRef }: any) => {
  const claimId = localStorage.getItem("claimId");
  const parsedClaimId = claimId ? parseInt(claimId) : 0;
const [uploadModal, setUploadModal] = useState<{
  open: boolean;
  fieldName: string;
  label: string;
} | null>(null);
  const initialValues = useMemo(
    () => ({
      driver_license_received_on: "",
      driver_license_file_url: "",

      license_checks_completed_on: "",
      license_checks_completed_file_url: "",

      proof_of_address_1_received_on: "",
      proof_of_address_1_file_url: "",

      proof_of_address_2_received_on: "",
      proof_of_address_2_file_url: "",

      pre_hire_bank_statement_received_on: "",
      pre_hire_bank_statement_file_url: "",

      post_hire_bank_statement_received_on: "",
      post_hire_bank_statement_file_url: "",

      taxi_badge_received_on: "",
      taxi_badge_file_url: "",

      v5_received_on: "",
      v5_file_url: "",

      mot_certificate_received_on: "",
      mot_certificate_file_url: "",

      insurance_certificate_received_on: "",
      insurance_certificate_file_url: "",

      suspension_notice_received_on: "",
      suspension_notice_file_url: "",

      suspension_uplift_received_on: "",
      suspension_uplift_file_url: "",

      signed_cha_received_on: "",
      signed_cha_file_url: "",

      signed_mitigation_received_on: "",
      signed_mitigation_file_url: "",

      arf_received_on: "",
      arf_file_url: "",

      signed_cil_agreement_received_on: "",
      signed_cil_agreement_file_url: "",
    }),
    [],
  );
  const openUploadModal = (fieldName: string, label: string) => {
    setUploadModal({
      open: true,
      fieldName,
      label,
    });
  };

  const closeUploadModal = () => {
    setUploadModal(null);
  };

  const handleModalUpload = async (file: File) => {
    if (!uploadModal || !parsedClaimId) return;

    const fieldName = uploadModal.fieldName;
    const fileUrlField = fieldName.replace("_received_on", "_file_url");

    const uploaded = await uploadDriverDocumentAgreementFile(
      parsedClaimId,
      fieldName,
      file,
    );

    formik.setFieldValue(fileUrlField, uploaded.file_url);

    if (!formik.values[fieldName]) {
      formik.setFieldValue(fieldName, uploaded.uploaded_at);
    }

    toast.success(`${file.name} uploaded successfully`);
  };

  const formatDisplayDate = (dateValue: any) => {
    if (!dateValue) return "Select Date";
    const date = new Date(dateValue);
    if (isNaN(date.getTime())) return "Select Date";

    return `${date.toLocaleDateString("sv-SE")} ${date
      .toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
      .toLowerCase()}`;
  };

  const truncateFilename = (name: string) => {
    if (!name) return "";
    return name.length > 30 ? name.substring(0, 30) + "..." : name;
  };

  const getFilenameFromUrl = (url: string) => {
    if (!url) return "";
    try {
      const cleanUrl = url.split("?")[0];
      return decodeURIComponent(
        cleanUrl.substring(cleanUrl.lastIndexOf("/") + 1),
      );
    } catch {
      return "Uploaded File";
    }
  };

  const getFileTypeFromUrl = (url: string) => {
    if (!url) return "";
    const cleanUrl = url.split("?")[0].toLowerCase();
    if (cleanUrl.endsWith(".pdf")) return "application/pdf";
    if (
      cleanUrl.endsWith(".jpg") ||
      cleanUrl.endsWith(".jpeg") ||
      cleanUrl.endsWith(".png")
    ) {
      return "image/*";
    }
    return "";
  };

  const formik = useFormik({
    initialValues,
    enableReinitialize: true,
    onSubmit: async (values: any) => {
      try {
        const payload = {
          ...values,
          claim_id: parsedClaimId,
        };

        let response;

        try {
          response = await updateDriverDocumentAgreement(
            payload,
            parsedClaimId,
          );
        } catch (error: any) {
          if (error?.response?.status === 404) {
            response = await createDriverDocumentAgreement(payload);
          } else {
            throw error;
          }
        }

        toast.success("Driver Document Agreement saved successfully");
        return response;
      } catch (error) {
        console.error(error);
        toast.error("Unable to save documents");
      }
    },
  });

  useEffect(() => {
    const fetchDocs = async () => {
      if (!parsedClaimId) return;

      try {
        const response = await getDriverDocumentAgreement(parsedClaimId);
        const data = response?.data;

        if (data) {
          formik.setValues({
            ...initialValues,
            ...data,
          });
        }
      } catch (error: any) {
        if (error?.response?.status !== 404) {
          console.error(error);
        }
      }
    };

    fetchDocs();
  }, [parsedClaimId, initialValues]);

  useEffect(() => {
    if (formRef) {
      formRef.current = formik;
    }
  }, [formRef, formik]);

const DocumentRow: React.FC<{
  label: string;
  dateLabel: string;
  fieldName: string;
  position?:string
}> = ({ label, dateLabel, fieldName,position }) => {
  const [showPicker, setShowPicker] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const fileUrlField = fieldName.replace("_received_on", "_file_url");
  const fileUrl = formik.values[fileUrlField] || "";

  const displayFile = fileUrl
    ? {
        name: getFilenameFromUrl(fileUrl),
        type: getFileTypeFromUrl(fileUrl),
        url: fileUrl,
      }
    : null;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setShowPicker(false);
      }
    };

    if (showPicker) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showPicker]);

  const handleRemoveFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    formik.setFieldValue(fileUrlField, "");
    formik.setFieldValue(fieldName, "");
    toast.info(`${label} and its date removed from form`);
  };

  return (
    <div className="py-2 grid grid-cols-2 gap-4 items-center font-['Stack_Sans_Headline']">
      <div className="flex flex-col gap-2">
        <label className="text-neutral-700 text-sm font-weight-400">
          {label}
        </label>

        <div
          onClick={() => openUploadModal(fieldName, label)}
          className="group px-4 h-[52px] bg-white rounded border border-gray-200 flex items-center justify-between transition-all cursor-pointer hover:bg-gray-50"
        >
          <div className="flex items-center gap-3 overflow-hidden">
            {displayFile ? (
              <>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold text-white shrink-0 ${
                    displayFile.type.includes("pdf")
                      ? "bg-red-500"
                      : "bg-blue-500"
                  }`}
                >
                  {displayFile.type.includes("pdf") ? "PDF" : "IMG"}
                </span>

                <span className="text-sm text-gray-700 font-weight-400 truncate max-w-[180px]">
                  {truncateFilename(displayFile.name)}
                </span>
              </>
            ) : (
              <>
                <img src={uploadIcon} alt="upload" className="w-5 h-5" />
                <span className="text-neutral-500 text-sm">
                  Upload file{" "}
                  <span className="text-xs font-weight-300 font-light">
                    (JPG, PNG, PDF)
                  </span>
                </span>
              </>
            )}
          </div>

          {displayFile && (
            <button
              type="button"
              onClick={handleRemoveFile}
              className="p-1.5 rounded-full hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
              title="Remove file"
            >
              x
            </button>
          )}
        </div>
      </div>

      <div ref={containerRef} className="flex flex-col gap-2 relative">
        <label className="text-neutral-700 text-sm">{dateLabel}</label>

        <div
          onClick={() => setShowPicker((prev) => !prev)}
          className={`w-full h-[52px] px-5 bg-white rounded border flex items-center justify-between cursor-pointer transition-all ${
            showPicker
              ? "border-blue-500 ring-1 ring-blue-500"
              : "border-gray-200"
          }`}
        >
          <span
            className={`${
              formik.values[fieldName] ? "text-gray-900" : "text-gray-400"
            } text-sm`}
          >
            {formatDisplayDate(formik.values[fieldName])}
          </span>
          <img src={Vector6} alt="calendar" />
        </div>

        {showPicker && (
          <div               className={`absolute ${position === "top" ? "bottom-[423px]" : "top-[25px]"} left-0 z-[100] shadow-2xl`}>
            <CustomDatePicker
              selectedDate={
                formik.values[fieldName]
                  ? new Date(formik.values[fieldName])
                  : new Date()
              }
              onDateSelect={(date) => {
                formik.setFieldValue(fieldName, date.toISOString());
                setShowPicker(false);
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};
             
  return (
    <div className="MainContent w-full flex flex-col items-start gap-6 py-1 font-['Stack_Sans_Headline']">
      <h1 className="text-neutral-900 text-[24px] font-weight-600">
        Driver Documents & Agreements
      </h1>

        <div className="w-full p-5 rounded-lg border border-neutral-100 flex flex-col gap-4 shadow-sm">
        <h2 className="text-xl font-weight-600">Driver Proofs Check List</h2>

        <div className="self-stretch h-px bg-neutral-100" />
        <DocumentRow
          label="Upload Driving License"
          dateLabel="Driving Licence Received On"
          fieldName="driver_license_received_on"
        />

        <div className="self-stretch h-px bg-neutral-100" />
        <DocumentRow
          label="Driving License Checks"
          dateLabel="Driving Licence Received On"
          fieldName="license_checks_completed_on"
        />

        <div className="self-stretch h-px bg-neutral-100" />
        <DocumentRow
          label="Proof of Address"
          dateLabel="Proof of Address 1 Received On"
          fieldName="proof_of_address_1_received_on"
        />

        <div className="self-stretch h-px bg-neutral-100" />
        <DocumentRow
          label="Proof of Address 2"
          dateLabel="Proof of Address 2 Received On"
          fieldName="proof_of_address_2_received_on"
        />

        <div className="self-stretch h-px bg-neutral-100" />
        <DocumentRow
          label="Bank Statement (Pre-Hire)"
          dateLabel="Bank Statement Received On (Pre-Hire)"
          fieldName="pre_hire_bank_statement_received_on"
        />

        <div className="self-stretch h-px bg-neutral-100" />
        <DocumentRow
          label="Bank Statement (Post-Hire)"
          dateLabel="Bank Statement Received On (Post-Hire)"
          fieldName="post_hire_bank_statement_received_on"
        />

        <div className="self-stretch h-px bg-neutral-100" />
        <DocumentRow
          label="Taxi Badge"
          dateLabel="Taxi Badge Received On"
          fieldName="taxi_badge_received_on"
        />

        <div className="self-stretch h-px bg-neutral-100" />
        <DocumentRow
          label="V5"
          dateLabel="V5 Received On"
          fieldName="v5_received_on"
        />

        <div className="self-stretch h-px bg-neutral-100" />
        <DocumentRow
          label="MOT Certificate"
          dateLabel="MOT Certificate Received On"
          fieldName="mot_certificate_received_on"
        />

        <div className="self-stretch h-px bg-neutral-100" />
        <DocumentRow
          label="Insurance Certificate"
          dateLabel="Insurance Certificate Received On"
          fieldName="insurance_certificate_received_on"
        />

        <div className="self-stretch h-px bg-neutral-100" />
        <DocumentRow
          label="Suspension Notice"
          dateLabel="Suspension Notice Received On"
          fieldName="suspension_notice_received_on"
        />

        <div className="self-stretch h-px bg-neutral-100" />
        <DocumentRow
          label="Suspension UPLIFT"
          dateLabel="Suspension UPLIFT Received On"
          fieldName="suspension_uplift_received_on"
        />
      </div>

      <div className="w-full p-5 rounded-lg border border-neutral-100 flex flex-col gap-4 shadow-sm">
        <div className="text-neutral-900 text-[20px] font-weight-600 font-['Stack_Sans_Headline'] leading-5">
          Agreements & Statements Check List Section
        </div>

        <div className="self-stretch h-px bg-neutral-100" />
        <DocumentRow
          label="Signed CHA"
          dateLabel="Signed CHA Received On"
          fieldName="signed_cha_received_on"
        />

        <div className="self-stretch h-px bg-neutral-100" />
        <DocumentRow
          label="Signed Mitigation"
          dateLabel="Signed Mitigation Received On"
          fieldName="signed_mitigation_received_on"
        />

        <div className="self-stretch h-px bg-neutral-100" />
        <DocumentRow
          label="ARF"
          dateLabel="ARF Received On"
          fieldName="arf_received_on"
          position="top"
        />

        <div className="self-stretch h-px bg-neutral-100" />
        <DocumentRow
          label="Signed CIL Agreement"
          dateLabel="Signed CIL Agreement Received On"
          fieldName="signed_cil_agreement_received_on"
          position="top"
        />
      </div>
      {uploadModal?.open && (
        <DriverDocumentUploadModal
          isOpen={uploadModal.open}
          onClose={closeUploadModal}
          title={`Upload ${uploadModal.label}`}
          onFileSelect={handleModalUpload}
        />
      )}
    </div>
  );
};

export default DriverDocumentAgreement;
