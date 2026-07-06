import { useState, useEffect } from "react";
import { toast } from 'react-toastify';
import { createPortal } from "react-dom";
import logo from '../../../assets/AutoClaim_icon/logo.svg'
import { sendOffHireMail } from '../../../services/HireDetail/HireDetails';

interface EmailPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  data?: {
    Reference: string;
    Referrer: string;
    client_name: string;
    registration: string;
    mobile_tel: string;
    to?: string;
  };
}

export const EmailPreviewModal = ({
  isOpen,
  onClose,
  data,
}: EmailPreviewProps) => {
  const previewData = data || ({} as NonNullable<EmailPreviewProps["data"]>);
  // Editable recipients — users can add / edit who the email goes to.
  const [toValue, setToValue] = useState<string>("");
  useEffect(() => {
    if (isOpen) setToValue(String(data?.to || ""));
  }, [isOpen, data?.to]);
  if (!isOpen) return null;

   const sendEmail = async () => {
  // Optional: Add a loading state to disable the button while sending
//   setIsLoading(true);

  try {
    const res = await sendOffHireMail({ ...previewData, to: toValue });

    // If your service returns the full response object:
    if (res.status === 200) {
      // Backend returns {"msg": "..."}, so we use res.data.msg
      toast.success(res.data.msg || "Email sent successfully");
      onClose(); // Close the modal on success
    } else {
      // Accessing the error message from the backend
      toast.error(res.data.msg || "Failed to send email");
    }
  } catch (error: any) {
      // Handle network errors or server crashes
      console.log(error)
    toast.error(error?.response?.data?.detail || "Failed to send email");
  } finally {
    // setIsLoading(false);
  }
   };
    console.log(previewData);

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/10 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-[700px] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-white">
          <h2 className="text-slate-800 font-bold text-base">
            Inst to Fleet to Off Hire
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Email Metadata (Recipients & Subject) */}
        <div className="px-8 py-4 bg-slate-50 border-b border-slate-100 space-y-3">
          <div className="flex items-start gap-4">
            <span className="text-slate-500 text-sm font-medium w-16 pt-1">
              To:
            </span>
            <div className="flex-1">
              <input
                type="text"
                value={toValue}
                onChange={(e) => setToValue(e.target.value)}
                placeholder="Enter recipient email(s)"
                className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded text-sm text-slate-800 outline-none focus:border-blue-500"
              />
              <p className="text-slate-400 text-[11px] mt-1">
                Separate multiple recipients with a semicolon (;)
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <span className="text-slate-500 text-sm font-medium w-16">
              Subject:
            </span>
            <span className="text-slate-800 text-sm font-weight-600 flex-1">
              New Instruction to Fleet to Off Hire Vehicle (CIL)
            </span>
          </div>
        </div>

        {/* --- SCROLLABLE EMAIL BODY --- */}
        <div className="p-12 flex flex-col items-center bg-white overflow-y-auto ">
          {/* Main Data Card (From your Design) */}
          <img src={logo} alt="" />
          <div className="w-[384px] p-4 mt-5 rounded-lg border border-slate-200 flex flex-col gap-2 mb-8 bg-white shadow-sm">
            <DataRow label="Reference" value={previewData.Reference} />
            <div className="h-px bg-slate-100 w-full" />
            <DataRow label="Referrer" value={previewData.Referrer} />
            <div className="h-px bg-slate-100 w-full" />
            <DataRow label="Client" value={previewData.client_name} />
            <div className="h-px bg-slate-100 w-full" />
            <DataRow label="Hire Vehicle" value={previewData.registration} />
            <div className="h-px bg-slate-100 w-full" />
            <DataRow label="Cl Mobile No" value={previewData.mobile_tel} />
          </div>

          {/* Message Content */}
          <div className="w-[320px] text-center mb-12">
            <p className="text-slate-700 text-sm font-normal font-['Stack_Sans_Headline'] leading-relaxed">
              Hi,
              <br />
              <br />
              Please contact the Client to arrange the off hire of this vehicle
              for{" "}
              <span className="font-weight-600">
                {new Date().toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                })}
              </span>
              .
            </p>
          </div>

          {/* Divider Line */}
          <div className="w-full max-w-[580px] h-px bg-slate-200 mb-3" />

          {/* Footer / Sign-off */}
          <div className="text-center">
            <p className="text-slate-700 text-xs font-weight-600 font-['Stack_Sans_Headline'] mb-1">
              Kind regards,
            </p>
            <p className="text-slate-700 text-sm font-weight-600 font-['Stack_Sans_Headline'] ">
              Nationwide Assist IT / Systems Team
            </p>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="px-8 py-5 bg-white border-t border-slate-100 flex justify-end items-center gap-4">
          <button
            onClick={onClose}
            className="px-10 py-4 bg-white rounded outline outline-1 outline-primary text-blue-600 text-base font-medium font-['Stack_Sans_Headline'] hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            className="px-10 py-4 bg-blue-500 rounded text-white text-base font-medium font-['Stack_Sans_Headline'] hover:bg-blue-500 transition"
            onClick={sendEmail}
          >
            Send Email
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
};

// Sub-component for Data Rows
const DataRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-start items-center gap-5">
    <div className="w-32 text-[11px]  text-neutral-700 tracking-wider font-weight-300 font-light font-['Stack_Sans_Headline']">
      {label}
    </div>
    <div className="flex-1 text-neutral-700 text-xs font-weight-600 font-['Stack_Sans_Headline']">
      {value || "N/A"}
    </div>
  </div>
);
