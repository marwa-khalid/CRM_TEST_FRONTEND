import React, { useEffect, useState } from "react";
import { CheckCircle2, Monitor, Eye, EyeOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import loginn from "../../assets/AutoClaim_icon/loginn.svg";
import trashIcon from "../../assets/AccountSettingsIcons/Vector.svg";
import {
  changePassword,
  getSessions,
  logSessionExpiry,
  terminateSession,
} from "../../services/AccountSettings/AccountSettings";
import { ConfirmModal } from "../../components/common/ConfirmModal";

type ViewMode = "settings" | "changePassword" | "success";

interface Props {
  onClose?: () => void;
}

interface Session {
  id: number;
  ip_address: string | null;
  device_info: string | null;
  is_current: boolean | null;
  created_at: string | null;
}

function formatSessionTime(iso: string | null): string {
  if (!iso) return "";
  const hasTimezone = iso.endsWith("Z") || /[+-]\d{2}:\d{2}$/.test(iso);
  const d = new Date(hasTimezone ? iso : iso + "Z");
  if (isNaN(d.getTime())) return "";
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const yr = String(d.getFullYear()).slice(2);
  let h = d.getHours();
  const min = String(d.getMinutes()).padStart(2, "0");
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${day}-${month}-${yr} ${h}:${min}${ampm}`;
}

function parseDeviceLabel(userAgent: string | null): string {
  if (!userAgent) return "Unknown Device";
  const ua = userAgent.toLowerCase();
  let os = "Unknown OS";
  let browser = "Browser";
  if (ua.includes("mac")) os = "Mac";
  else if (ua.includes("windows")) os = "Windows";
  else if (ua.includes("android")) os = "Android";
  else if (ua.includes("iphone") || ua.includes("ipad")) os = "iOS";
  else if (ua.includes("linux")) os = "Linux";
  if (ua.includes("chrome") && !ua.includes("edg")) browser = "Chrome";
  else if (ua.includes("firefox")) browser = "Firefox";
  else if (ua.includes("safari") && !ua.includes("chrome")) browser = "Safari";
  else if (ua.includes("edg")) browser = "Edge";
  return `${os} ${browser} - Web Browser`;
}

const AccountSettingsContent: React.FC<Props> = ({ onClose }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"Profile" | "Security">("Security");
  const [viewMode, setViewMode] = useState<ViewMode>("settings");
  const [sessions, setSessions] = useState<Session[]>([]);
  const [confirmModal, setConfirmModal] = useState<{
    open: boolean;
    sessionId: number | null;
    isCurrent: boolean;
  }>({ open: false, sessionId: null, isCurrent: false });

  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getSessions()
      .then(({ data }: any) => setSessions(data.sessions || []))
      .catch(() => {});
  }, []);

  const openConfirm = (sessionId: number, isCurrent: boolean) => {
    setConfirmModal({ open: true, sessionId, isCurrent });
  };

  const handleConfirmAction = async () => {
    const { sessionId, isCurrent } = confirmModal;
    setConfirmModal({ open: false, sessionId: null, isCurrent: false });
    if (!sessionId) return;
    try {
      if (isCurrent) {
        await logSessionExpiry();
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        navigate("/login");
      } else {
        await terminateSession(sessionId);
        setSessions((prev) => prev.filter((s) => s.id !== sessionId));
        toast.success("Session terminated");
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Failed to terminate session");
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const validateForm = () => {
    const next: Record<string, string> = {};
    if (!formData.currentPassword.trim())
      next.currentPassword = "Current password is required";
    if (!formData.newPassword.trim())
      next.newPassword = "New password is required";
    else if (formData.newPassword.length < 8)
      next.newPassword = "Password must be at least 8 characters";
    if (!formData.confirmPassword.trim())
      next.confirmPassword = "Confirm password is required";
    else if (formData.confirmPassword !== formData.newPassword)
      next.confirmPassword = "Passwords do not match";
    if (
      formData.currentPassword &&
      formData.newPassword &&
      formData.currentPassword === formData.newPassword
    )
      next.newPassword = "New password must be different from current password";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleUpdate = async () => {
    if (!validateForm()) return;
    setSubmitting(true);
    try {
      await changePassword({
        current_password: formData.currentPassword,
        new_password: formData.newPassword,
        confirm_password: formData.confirmPassword,
      });
      setViewMode("success");
    } catch (err: any) {
      const msg = err?.response?.data?.detail || "Failed to update password";
      if (msg.toLowerCase().includes("current")) {
        setErrors({ currentPassword: msg });
      } else {
        toast.error(msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const renderPasswordField = (
    label: string,
    field: "currentPassword" | "newPassword" | "confirmPassword",
  ) => {
    const hasError = !!errors[field];
    return (
      <div className="w-full flex flex-col gap-2 bg-white">
        <label className="self-stretch text-[#344054] text-sm font-weight-400 font-['Stack_Sans_Headline']">
          {label}
        </label>
        <div
          className={`self-stretch px-5 py-4 bg-white rounded outline outline-1 outline-offset-[-1px] inline-flex justify-start items-center gap-2.5 ${
            hasError ? "outline-red-300" : "outline-[#D0D5DD]"
          }`}
        >
          <input
            type={showPassword[field] ? "text" : "password"}
            value={formData[field]}
            onChange={(e) => handleInputChange(field, e.target.value)}
            placeholder="Enter password"
            className="flex-1 bg-transparent outline-none text-[#101828] text-base font-light font-['Stack_Sans_Headline'] placeholder:text-[#98A2B3] leading-4"
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => ({ ...prev, [field]: !prev[field] }))}
            className="text-[#667085]"
          >
            {showPassword[field] ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        {hasError && (
          <p className="text-red-500 text-sm font-normal font-['Stack_Sans_Headline']">
            {errors[field]}
          </p>
        )}
      </div>
    );
  };

  return (
    <>
      {confirmModal.open && (
        <ConfirmModal
          title={confirmModal.isCurrent ? "Log Out" : "Terminate Session"}
          message={
            confirmModal.isCurrent
              ? "This will log you out of your current session. You will need to sign in again."
              : "Are you sure you want to terminate this session?"
          }
          confirmLabel={confirmModal.isCurrent ? "Log Out" : "Terminate"}
          onConfirm={handleConfirmAction}
          onCancel={() => setConfirmModal({ open: false, sessionId: null, isCurrent: false })}
        />
      )}

      <div className="w-full h-full bg-white">
        {viewMode === "settings" && (
          <div className="w-full px-16 py-10 inline-flex flex-col justify-start items-start gap-10">
            <div className="flex flex-col justify-start items-start gap-2">
              <div className="justify-start text-[#101828] text-2xl font-weight-600 font-['Stack_Sans_Headline'] leading-6">
                Account Settings
              </div>
              <div className="justify-start text-[#475467] text-sm font-normal font-['Stack_Sans_Headline']">
                Manage your account settings and preferences
              </div>
            </div>

            <div className="self-stretch flex flex-col justify-start items-start">
              <div className="inline-flex justify-start items-start gap-6">
                <button
                  type="button"
                  className="w-16 pt-3 inline-flex flex-col justify-start items-center gap-2.5"
                  onClick={() => setActiveTab("Profile")}
                >
                  <div
                    className={`justify-start text-sm font-normal font-['Stack_Sans_Headline'] leading-4 ${
                      activeTab === "Profile" ? "text-[#007AFF]" : "text-[#101828]"
                    }`}
                  >
                    Profile
                  </div>
                  <div
                    className={`self-stretch h-0 outline outline-2 outline-offset-[-2px] ${
                      activeTab === "Profile" ? "outline-[#007AFF]" : "outline-transparent"
                    }`}
                  />
                </button>

                <button
                  type="button"
                  className="pt-3 inline-flex flex-col justify-start items-center gap-2.5"
                  onClick={() => setActiveTab("Security")}
                >
                  <div
                    className={`justify-start text-sm font-normal font-['Stack_Sans_Headline'] leading-4 ${
                      activeTab === "Security" ? "text-[#007AFF]" : "text-[#101828]"
                    }`}
                  >
                    Security
                  </div>
                  <div
                    className={`self-stretch h-0 outline outline-2 outline-offset-[-2px] ${
                      activeTab === "Security" ? "outline-[#007AFF]" : "outline-transparent"
                    }`}
                  />
                </button>
              </div>
              <div className="self-stretch h-0 outline outline-1 outline-offset-[-0.5px] outline-[#EAECF0]" />
            </div>

            {activeTab === "Profile" && (
              <div className="w-full bg-white rounded-xl border border-[#EAECF0] p-6">
                <div className="text-[#101828] text-xl font-weight-600 font-['Stack_Sans_Headline'] mb-2">
                  Profile
                </div>
                <div className="text-[#475467] text-sm font-['Stack_Sans_Headline']">
                  Profile settings coming soon.
                </div>
              </div>
            )}

            {activeTab === "Security" && (
              <>
                <div className="flex flex-col justify-start items-start gap-6">
                  <div className="flex flex-col justify-start items-start gap-2">
                    <div className="justify-start text-[#101828] text-xl font-weight-600 font-['Stack_Sans_Headline'] leading-5">
                      Change Password
                    </div>
                    <div className="justify-start text-[#475467] text-sm font-normal font-['Stack_Sans_Headline']">
                      Update your password through the button below.
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setViewMode("changePassword")}
                    className="h-8 px-3 py-2 bg-[#EAF2FF] rounded inline-flex justify-center items-center gap-2.5"
                  >
                    <div className="justify-start text-[#007AFF] text-sm font-normal font-['Stack_Sans_Headline'] leading-4">
                      Change Password
                    </div>
                  </button>
                </div>

                <div className="self-stretch h-0 outline outline-1 outline-offset-[-0.5px] outline-[#EAECF0]" />

                <div className="flex flex-col justify-start items-start gap-6 w-full">
                  <div className="flex flex-col justify-start items-start gap-2">
                    <div className="justify-start text-[#101828] text-xl font-weight-600 font-['Stack_Sans_Headline'] leading-5">
                      Sessions &amp; devices
                    </div>
                    <div className="justify-start text-[#475467] text-sm font-normal font-['Stack_Sans_Headline']">
                      View active devices and sessions.
                    </div>
                  </div>

                  <div className="flex flex-col justify-center items-start gap-3 w-full">
                    {sessions.length === 0 && (
                      <div className="text-[#475467] text-sm font-['Stack_Sans_Headline']">
                        No active sessions found.
                      </div>
                    )}
                    {sessions.map((session, index) => (
                      <React.Fragment key={session.id}>
                        <div className="w-full flex flex-col justify-start items-start gap-1">
                          {session.is_current && (
                            <div className="px-2 py-1 bg-[#F2F4F7] rounded inline-flex justify-start items-center gap-2">
                              <div className="justify-start text-[#344054] text-xs font-weight-600 font-['Stack_Sans_Headline']">
                                Current Device
                              </div>
                            </div>
                          )}
                          <div className="inline-flex justify-start items-center gap-3 w-full">
                            <div className="w-[420px] inline-flex justify-start items-center gap-2">
                              <Monitor size={16} className="text-black flex-shrink-0" />
                              <div className="justify-start text-black text-sm font-weight-600 font-['Stack_Sans_Headline']">
                                {parseDeviceLabel(session.device_info)}
                              </div>
                            </div>
                            <div className="w-72 justify-start text-[#475467] text-sm font-normal font-['Stack_Sans_Headline']">
                              {session.ip_address || "—"}
                            </div>
                            <div className="w-56 justify-start text-[#475467] text-sm font-normal font-['Stack_Sans_Headline']">
                              {formatSessionTime(session.created_at)}
                            </div>
                            <button
                              type="button"
                              onClick={() => openConfirm(session.id, !!session.is_current)}
                              className="p-2 flex items-center justify-center flex-shrink-0 rounded hover:bg-gray-100 transition-colors"
                            >
                              <img src={trashIcon} alt="Remove session" className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        {index !== sessions.length - 1 && (
                          <div className="self-stretch h-0 outline outline-1 outline-offset-[-0.5px] outline-[#EAECF0]" />
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {viewMode === "changePassword" && (
          <div className="w-full min-h-screen bg-white overflow-hidden">
            <div className="w-full px-10 py-5 bg-white shadow-[0px_4px_20px_0px_rgba(0,0,0,0.08)] inline-flex justify-between items-center">
              <div className="justify-start text-neutral-900 text-[20px] font-weight-600 font-['Stack_Sans_Headline'] leading-5">
                Change Password
              </div>
              <button
                type="button"
                onClick={() => setViewMode("settings")}
                className="px-10 py-4 bg-[#007AFF] rounded flex justify-center items-center gap-2.5"
              >
                <div className="justify-start text-white text-base font-weight-400 font-['Stack_Sans_Headline'] leading-4">
                  Close
                </div>
              </button>
            </div>
            <div className="w-full flex justify-center pt-24">
              <div className="w-96 inline-flex flex-col justify-start items-start gap-6">
                {renderPasswordField("Current Password", "currentPassword")}
                {renderPasswordField("New Password", "newPassword")}
                {renderPasswordField("Confirm New Password", "confirmPassword")}
                <div className="w-full flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={handleUpdate}
                    disabled={submitting}
                    className="px-10 py-4 bg-[#007AFF] rounded flex justify-center items-center gap-2.5 disabled:opacity-50"
                  >
                    <div className="justify-start text-white text-base font-weight-400 font-['Stack_Sans_Headline'] leading-4">
                      {submitting ? "Updating..." : "Update"}
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {viewMode === "success" && (
          <div className="w-full min-h-screen bg-white overflow-hidden">
            <div className="w-full px-10 py-5 bg-white shadow-[0px_4px_20px_0px_rgba(0,0,0,0.08)] inline-flex justify-between items-center">
              <div className="justify-start text-neutral-900 text-[20px] font-weight-600 font-['Stack_Sans_Headline'] leading-5">
                Change Password
              </div>
              <button
                type="button"
                onClick={() => { setViewMode("settings"); onClose?.(); }}
                className="px-10 py-4 bg-[#007AFF] rounded flex justify-center items-center gap-2.5"
              >
                <div className="justify-start text-white text-base font-weight-400 font-['Stack_Sans_Headline'] leading-4">
                  Close
                </div>
              </button>
            </div>
            <div className="w-full flex justify-center pt-40">
              <div className="w-[508px] inline-flex flex-col justify-start items-start gap-10">
                <div className="self-stretch justify-start text-black text-2xl font-weight-600 font-['Stack_Sans_Headline'] leading-6">
                  Password Updated
                </div>
                <div className="w-[508px] py-3 rounded inline-flex justify-start items-start gap-5">
                  <img src={loginn} alt="" />
                  <div className="w-96 justify-start text-base font-normal font-['Stack_Sans_Headline'] leading-6">
                    <span className="text-[#475467]">
                      Your password has been updated successfully. <br />Please{" "}
                    </span>
                    <span className="text-[#007AFF]">log in </span>
                    <span className="text-[#475467]">using your new password</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default AccountSettingsContent;
