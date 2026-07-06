import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { createPortal } from "react-dom";
import logo from "../../../assets/AutoClaim_icon/logo.svg";
import { sendOnHireMail } from "../../../services/HireDetail/HireDetails"; // Ensure this service exists

interface OnHirePreviewProps {
  isOpen: boolean;
  onClose: () => void;
  data?: {
    Reference: string;
    Referrer: string;
    client_name: string;
    mobile_tel: string;
    registration: string;
    make: string;
    model: string;
    body_type: string;
    Auto: string;
    engine_size: string;
    fuel_type: string;
    number_of_seat: number;
    borough_name: string | null;
    taxi_type: string | null;
    driver_base: string | null;
    to: string;
    Subject: string;
    vehicleCategory?: string; // e.g. T12<3YRS
    activeUser?:string
  };
}

export const OnHireEmailPreviewModal = ({
  isOpen,
  onClose,
  data,
}: OnHirePreviewProps) => {
  const previewData = data || ({} as NonNullable<OnHirePreviewProps["data"]>);
  // Editable recipients — users can add / edit who the email goes to.
  const [toValue, setToValue] = useState<string>("");
  useEffect(() => {
    if (isOpen) setToValue(String(data?.to || ""));
  }, [isOpen, data?.to]);
  if (!isOpen) return null;

  const sendEmail = async () => {
    try {
      const res = await sendOnHireMail({ ...previewData, to: toValue });
      if (res.status === 200) {
        toast.success(res.data.msg || "On-Hire Email sent successfully");
        onClose();
      } else {
        toast.error(res.data.msg || "Failed to send email");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "An error occurred");
    }
  };

  const todayStr = new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/10 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-[700px] flex flex-col overflow-hidden max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-100 flex justify-between items-center bg-white sticky top-0 z-10">
          <h2 className="text-neutral-800 font-bold text-base">
            Inst to Fleet to On Hire
          </h2>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-600"
          >
            ✕
          </button>
        </div>

        {/* Recipients & Subject */}
        <div className="px-8 py-4 bg-neutral-50 border-b border-neutral-100 space-y-3">
          <div className="flex items-start gap-4">
            <span className="text-neutral-500 text-sm font-medium w-16 pt-1">
              To:
            </span>
            <div className="flex-1">
              <input
                type="text"
                value={toValue}
                onChange={(e) => setToValue(e.target.value)}
                placeholder="Enter recipient email(s)"
                className="w-full px-3 py-1.5 bg-white border border-neutral-200 rounded text-sm text-neutral-800 outline-none focus:border-blue-500"
              />
              <p className="text-neutral-400 text-[11px] mt-1">
                Separate multiple recipients with a semicolon (;)
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <span className="text-neutral-500 text-sm font-medium w-16">
              Subject:
            </span>
            <span className="text-neutral-800 text-sm font-weight-600 flex-1">
              {previewData.Subject || "New Instruction to Fleet to Arrange New Hire"}
            </span>
          </div>
        </div>

        {/* --- SCROLLABLE EMAIL BODY --- */}
        <div className="p-12 flex flex-col items-center bg-white overflow-y-auto">
          <img src={logo} alt="Nationwide Assist Logo" />

          {/* Section 1: General Info */}
          <div className="w-[420px] p-4 mt-8 rounded-lg border border-neutral-200 flex flex-col gap-2 bg-white shadow-sm">
            <DataRow label="Brand" value="RTA - Nationwide Assist" />
            <div className="h-px bg-neutral-100 w-full" />
            <DataRow label="Reference" value={previewData.Reference} />
            <div className="h-px bg-neutral-100 w-full" />
            <DataRow label="Referrer" value={previewData.Referrer} />
            <div className="h-px bg-neutral-100 w-full" />
            <DataRow label="Client" value={previewData.client_name} />
            <div className="h-px bg-neutral-100 w-full" />
            <DataRow label="Cl Mobile No" value={previewData.mobile_tel} />
            <div className="h-px bg-neutral-100 w-full" />
            <div className="py-1 text-center">
              <span className="text-neutral-700 text-sm font-normal">
                Does Hirer Require Vehicle Documents:{" "}
              </span>
              <span className="text-neutral-700 text-sm font-weight-600">Yes</span>
            </div>
          </div>

          {/* Section 2: Client's Vehicle Details */}
          <div className="w-[420px] p-4 mt-6 rounded-lg border border-neutral-200 flex flex-col gap-2 bg-white shadow-sm">
            <h3 className="text-neutral-700 text-sm font-weight-600 mb-2">
              Client's Vehicle Details
            </h3>
            <DataRow label="Reg" value={previewData.registration} />
            <div className="h-px bg-neutral-100 w-full" />
            <DataRow
              label="Make/Model"
              value={`${previewData.make || "N/A"} / ${previewData.model || "N/A"}`}
            />
            <div className="h-px bg-neutral-100 w-full" />
            <DataRow label="Body Type" value={previewData.body_type} />
            <div className="h-px bg-neutral-100 w-full" />
            <DataRow label="Auto" value={previewData.Auto} />
            <div className="h-px bg-neutral-100 w-full" />
            <DataRow label="Engine Size" value={previewData.engine_size} />
            <div className="h-px bg-neutral-100 w-full" />
            <DataRow label="Fuel Type" value={previewData.fuel_type} />
            <div className="h-px bg-neutral-100 w-full" />
            <DataRow
              label="No of Seats inc Driver"
              value={String(previewData.number_of_seat || "")}
            />
          </div>

          {/* Section 3: If Taxi (Conditional) */}
          {(previewData.borough_name || previewData.taxi_type || previewData.driver_base) && (
            <div className="w-[420px] p-4 mt-6 rounded-lg border border-neutral-200 flex flex-col gap-2 bg-white shadow-sm">
              <h3 className="text-neutral-700 text-sm font-weight-600 mb-2">
                If Taxi Vehicle
              </h3>
              <DataRow label="Borough:" value={previewData.borough_name || "N/A"} />
              <div className="h-px bg-neutral-100 w-full" />
              <DataRow label="Type of Plate:" value={previewData.taxi_type || "N/A"} />
              <div className="h-px bg-neutral-100 w-full" />
              <DataRow label="Driver Base:" value={previewData.driver_base || "N/A"} />
            </div>
          )}

          {/* Message Content */}
          <div className="w-[400px] text-center my-10">
            <p className="text-neutral-700 text-sm font-normal leading-relaxed">
              Hi,
              <br />
              <br />
              Please contact the Client to arrange a hire vehicle.
              <br />
              <br />
              Hire needs to start on{" "}
              <span className="font-weight-600">{todayStr}</span>
              <br />
              <br />
              We need to provide hire vehicle category{" "}
              <span className="font-weight-600">
                {previewData.vehicleCategory || "N/A"}
              </span>
              .
            </p>
          </div>

          <div className="w-full max-w-[580px] h-px bg-neutral-200 mb-4" />

          {/* Sign-off */}
          <div className="text-center pb-8">
            <p className="text-neutral-700 text-xs font-weight-600 mb-1">
              Kind regards,
            </p>
            <p className="text-neutral-700 text-sm font-weight-600">
              Nationwide Assist IT / Systems Team
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="px-8 py-5 bg-white border-t border-neutral-100 flex justify-end gap-4 sticky bottom-0">
          <button
            onClick={onClose}
            className="px-10 py-4 bg-white rounded outline outline-1 outline-primary text-blue-600 text-base font-medium hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={sendEmail}
            className="px-10 py-4 bg-blue-500 rounded text-white text-base font-medium hover:bg-blue-600 transition"
          >
            Send Email
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
};

// Sub-component remains the same
const DataRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-start items-center gap-5">
    <div className="w-32 text-[11px] text-neutral-700 tracking-wider font-light">
      {label}
    </div>
    <div className="flex-1 text-neutral-700 text-xs font-weight-600 uppercase">
      {value || "N/A"}
    </div>
  </div>
);
