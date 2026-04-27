import React, { useState } from "react";
import { CheckCircle2, Monitor, LogOut, Eye, EyeOff } from "lucide-react";
import loginn from '../../assets/AutoClaim_icon/loginn.svg'
type ViewMode = "settings" | "changePassword" | "success";

interface Props {
  onClose?: () => void;
}

const AccountSettingsContent: React.FC<Props> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<"Profile" | "Security">(
    "Security",
  );
  const [viewMode, setViewMode] = useState<ViewMode>("settings");

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

  const sessions = [
    {
      id: 1,
      label: "Current Device",
      device: "Mac Chrome - Web Browser",
      ip: "125.209.110.171",
      time: "23-04-26 1:19PM",
      current: true,
    },
    // {
    //   id: 2,
    //   label: "",
    //   device: "Mac Chrome - Web Browser",
    //   ip: "125.209.110.171",
    //   time: "22-02-26  2:30PM",
    //   current: false,
    // },
    // {
    //   id: 3,
    //   label: "",
    //   device: "Mac Chrome - Web Browser",
    //   ip: "125.209.110.171",
    //   time: "22-02-26  2:30PM",
    //   current: false,
    // },
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    setErrors((prev) => ({
      ...prev,
      [field]: "",
    }));
  };

  const validateForm = () => {
    const nextErrors: Record<string, string> = {};

    if (!formData.currentPassword.trim()) {
      nextErrors.currentPassword = "Current password is required";
    }

    if (!formData.newPassword.trim()) {
      nextErrors.newPassword = "New password is required";
    } else if (formData.newPassword.length < 8) {
      nextErrors.newPassword = "Password must be at least 8 characters";
    }

    if (!formData.confirmPassword.trim()) {
      nextErrors.confirmPassword = "Confirm password is required";
    } else if (formData.confirmPassword !== formData.newPassword) {
      nextErrors.confirmPassword = "Passwords do not match";
    }

    if (
      formData.currentPassword &&
      formData.newPassword &&
      formData.currentPassword === formData.newPassword
    ) {
      nextErrors.newPassword =
        "New password must be different from current password";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleUpdate = () => {
    if (!validateForm()) return;
    setViewMode("success");
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
            placeholder="Enter Code"
            className="flex-1 bg-transparent outline-none text-[#101828] text-base font-light font-['Stack_Sans_Headline'] placeholder:text-[#98A2B3] leading-4"
          />
          <button
            type="button"
            onClick={() =>
              setShowPassword((prev) => ({
                ...prev,
                [field]: !prev[field],
              }))
            }
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
                    activeTab === "Profile"
                      ? "text-[#007AFF]"
                      : "text-[#101828]"
                  }`}
                >
                  Profile
                </div>
                <div
                  className={`self-stretch h-0 outline outline-4 outline-offset-[-2px] ${
                    activeTab === "Profile"
                      ? "outline-[#007AFF]"
                      : "outline-transparent"
                  }`}
                />
              </button>

              <button
                type="button"
                className="pt-3 inline-flex flex-col justify-start items-center gap-2.5"
                onClick={() => setActiveTab("Security")}
              >
                <div className="justify-start text-[#101828] text-sm font-normal font-['Stack_Sans_Headline'] leading-4">
                  Security
                </div>
                <div className="self-stretch h-0 outline outline-4 outline-offset-[-2px] outline-[#007AFF]" />
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
                Demo placeholder for profile content.
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
                    Update your password through the button below. You will be
                    redirected to a form and must follow the instructions.
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
                  {sessions.map((session, index) => (
                    <React.Fragment key={session.id}>
                      <div className="w-full flex flex-col justify-start items-start gap-1">
                        {session.current && (
                          <div className="px-2 py-1 bg-[#F2F4F7] rounded inline-flex justify-start items-center gap-2">
                            <div className="justify-start text-[#344054] text-xs font-weight-600 font-['Stack_Sans_Headline']">
                              {session.label}
                            </div>
                          </div>
                        )}

                        <div className="inline-flex justify-start items-center gap-3 w-full">
                          <div className="w-[420px] inline-flex justify-start items-center gap-2">
                            <Monitor size={16} className="text-black" />
                            <div className="justify-start text-black text-sm font-weight-600 font-['Stack_Sans_Headline']">
                              {session.device}
                            </div>
                          </div>

                          <div className="w-72 justify-start text-[#475467] text-sm font-normal font-['Stack_Sans_Headline']">
                            {session.ip}
                          </div>

                          <div className="w-56 justify-start text-[#475467] text-sm font-normal font-['Stack_Sans_Headline']">
                            {session.time}
                          </div>

                          <button
                            type="button"
                            className="w-4 h-4 flex items-center justify-center"
                          >
                            <LogOut size={16} className="text-[#475467]" />
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
                  className="px-10 py-4 bg-[#007AFF] rounded flex justify-center items-center gap-2.5"
                >
                  <div className="justify-start text-white text-base font-weight-400 font-['Stack_Sans_Headline'] leading-4">
                    Update
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
              onClick={() => {
                setViewMode("settings");
                onClose?.();
              }}
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
                    Your password has been updated successfully. <br />
                    Please{" "}
                  </span>
                  <span className="text-[#007AFF]">log in </span>
                  <span className="text-[#475467]">
                    using your new password
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountSettingsContent;
