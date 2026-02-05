import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
// Keep your existing image imports...
import Subtractt from "../../assets/images/Subtractt.svg";
import group from "../../assets/images/Group 2608219.svg";
import background from "../../assets/images/background.png";
import group2 from "../../assets/images/group-2608221.svg";
import Vector4 from "../../assets/images/Vector4.svg";
import Vector3 from "../../assets/images/Vector3.svg";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // 1. Extract email from URL
  const emailFromUrl = searchParams.get("email") || "user@example.com";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  // 2. Real-time Validation State
  const validations = {
    minLength: password.length >= 12,
    hasUpper: /[A-Z]/.test(password),
    hasLower: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };

  const allValid =
    Object.values(validations).every(Boolean) && password === confirmPassword;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (!allValid) {
      setError("Please meet all password requirements");
      return;
    }

    // 3. Store in LocalStorage
    const newUser = {
      email: emailFromUrl,
      password: password, // In a real app, never store plain text passwords!
      joinedAt: new Date().toISOString(),
    };

    localStorage.setItem("activeUser", JSON.stringify(newUser));
    console.log("User saved to storage");

    // 4. Navigate to success page
    navigate("/auth/reset-password2");
  };

  return (
    <div className="bg-white w-full min-w-[1600px] min-h-[896px] relative font-sans">
      {/* Background & Decorative Elements (Same as your code) */}
      <img
        className="absolute top-0 left-0 w-[528px] h-[896px] object-cover"
        alt="Background"
        src={background}
      />
      <img
        className="absolute top-[332px] left-[195px] w-[333px] h-[563px]"
        alt="Graphic"
        src={Subtractt}
      />

      {/* Header Info */}
      <div className="flex flex-col w-[459px] items-start gap-6 absolute top-[113px] left-[35px]">
        <img className="relative w-[32.31px] h-[31px]" alt="Logo" src={group} />
        <h1 className="text-white text-[40px] font-semibold">
          All Your Claims,
          <br />
          One Smart Platform
        </h1>
      </div>
      <button
        className="absolute top-[113px] left-[678px] w-[101px] h-[31px] inline-flex items-center justify-start gap-[12px] group focus:outline-none"
        onClick={() => {
          navigate("/login");
        }}
      >
        {/* Back Arrow Icon */}

        <div className="relative w-5 h-5 flex items-center justify-center">
          <svg
            width="16"
            height="9"
            viewBox="0 0 16 9"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="transform rotate-90 text-[#0352FD] group-hover:-translate-x-1 transition-transform"
          >
            <path
              d="M1 1L8 8L15 1"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        {/* Text */}

        <span className="text-[#0352FD] text-[14px] font-normal break-words hover:underline">
          Login
        </span>
      </button>
      {/* Main Form Section */}
      <div className="flex flex-col w-[508px] items-start gap-10 absolute top-[197px] left-[678px]">
        <h2 className="text-black text-[24px] font-semibold">Reset Password</h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6 w-full">
          <div className="w-[440px] text-[#444444] text-[16px]">
            <span>Reset Password for Email </span>
            <span className="font-semibold">{emailFromUrl}</span>
          </div>

          {/* New Password Input */}
          <div className="flex flex-col gap-2 w-full">
            <label className="text-[#444444] text-[14px] font-medium">
              New Password
            </label>
            <div className="flex items-center px-5 py-4 bg-white rounded-[4px] border border-[#CCCCCC] focus-within:border-[#0352FD]">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="**********"
                className="w-full outline-none"
                required
              />
            </div>
          </div>

          {/* Confirm Password Input */}
          <div className="flex flex-col gap-2 w-full">
            <label className="text-[#444444] text-[14px] font-medium">
              Confirm Password
            </label>
            <div className="flex items-center px-5 py-4 bg-white rounded-[4px] border border-[#CCCCCC] focus-within:border-[#0352FD]">
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="**********"
                className="w-full outline-none"
                required
              />
            </div>
          </div>

          {/* Requirements Box (Floating Right) */}
          <div className="absolute top-[151px] left-[523px] flex flex-col w-[260px] p-6 bg-white shadow-lg rounded-lg border border-[#EEEEEE] gap-3">
            <RequirementItem
              met={validations.minLength}
              text="Minimum 12 characters"
            />
            <RequirementItem
              met={validations.hasUpper}
              text="At least 1 uppercase letter"
            />
            <RequirementItem
              met={validations.hasLower}
              text="At least 1 lowercase letter"
            />
            <RequirementItem
              met={validations.hasNumber}
              text="At least 1 number"
            />
            <RequirementItem
              met={validations.hasSpecial}
              text="At least 1 special character"
            />

            {password && confirmPassword && (
              <RequirementItem
                met={password === confirmPassword}
                text="Passwords match"
              />
            )}
          </div>

          <button
            type="submit"
            disabled={!allValid}
            className={`w-full py-4 rounded-[4px] text-white font-medium transition-all ${
              allValid
                ? "bg-[#0352FD] hover:bg-[#0246d9]"
                : "bg-gray-300 cursor-not-allowed"
            }`}
          >
            Reset Password
          </button>

          {error && <p className="text-red-500 text-sm">{error}</p>}
        </form>
      </div>
    </div>
  );
};

// Helper component for the checkmarks
const RequirementItem = ({ met, text }: { met: boolean; text: string }) => (
  <div className="flex items-center gap-2">
    <img src={met ? Vector3 : Vector4} alt="" className="w-4 h-4" />
    <span className={`text-[13px] ${met ? "text-black" : "text-gray-400"}`}>
      {text}
    </span>
  </div>
);

export default ResetPassword;
