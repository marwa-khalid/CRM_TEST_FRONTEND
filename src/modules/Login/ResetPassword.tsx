import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
// Keep your existing image imports...
import Subtractt from "../../assets/images/Subtractt.svg";
import group from "../../assets/images/Group 2608219.svg";
import background from "../../assets/images/background.png";
import group2 from "../../assets/images/group-2608221.svg";
import Vector4 from "../../assets/images/Vector4.svg";
import Vector3 from "../../assets/images/Vector3.svg";
import { API_BASE_URL } from "../../services/axiosConfig.ts";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // 1. Extract email from URL
  const emailFromUrl = searchParams.get("email") || "user@example.com";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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

  // const handleSubmit = (e: React.FormEvent) => {
  //   e.preventDefault();

  //   if (password !== confirmPassword) {
  //     setError("Passwords do not match");
  //     return;
  //   }

  //   if (!allValid) {
  //     setError("Please meet all password requirements");
  //     return;
  //   }

  //   // 3. Store in LocalStorage
  //   const newUser = {
  //     email: emailFromUrl,
  //     password: password, // In a real app, never store plain text passwords!
  //     joinedAt: new Date().toISOString(),
  //   };

  //   localStorage.setItem("activeUser", JSON.stringify(newUser));
  //   console.log("User saved to storage");

  //   // 4. Navigate to success page
  //   navigate("/auth/reset-password2");
  // };
    
  
  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setError("");
  setLoading(true);

  if (password !== confirmPassword) {
    setError("Passwords do not match");
    return;
  }

  if (!allValid) {
    setError("Please meet all password requirements");
    return;
  }

  try {
    const response = await fetch(
      `${API_BASE_URL}/auth/reset-password`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_name: emailFromUrl,
          password: password,
        }),
      },
    );
      const newUser = {
        email: emailFromUrl,
        password: password, // In a real app, never store plain text passwords!
        joinedAt: new Date().toISOString(),
      };

      localStorage.setItem("activeUser", JSON.stringify(newUser));
    const data = await response.json();

    if (!response.ok) {
      setError(data.detail || "Failed to reset password");
      return;
    }

    // Optionally store the bearer token returned by backend
    if (data.access_token) {
      localStorage.setItem("authToken", data.access_token);
    }

    // Navigate to login or success page
    navigate("/auth/reset-password2");
  } catch (err) {
    setError("Server error. Please try again later.");
    console.error(err);
  } finally {
    setLoading(false);
  }
};


  const [scale, setScale] = useState(1);
    const containerRef = useRef(null);
  
    useEffect(() => {
      const handleResize = () => {
        const baseWidth = 1600;
        const baseHeight = 903;
  
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
  
        const widthScale = windowWidth / baseWidth;
        const heightScale = windowHeight / baseHeight;
  
        // REMOVED Math.min(..., 1) so it expands to fill large screens
        // Using Math.max ensures the whole screen is covered (no white space)
        const newScale = Math.max(widthScale, heightScale);
  
        setScale(newScale);
      };
  
      window.addEventListener("resize", handleResize);
      handleResize();
      return () => window.removeEventListener("resize", handleResize);
    }, []);
  
  return (
    <div className="w-full h-screen overflow-hidden flex justify-center items-center bg-white font-['Stack_Sans_Headline']">
      <div
        ref={containerRef}
        style={{
          transform: `scale(${scale})`,
          transformOrigin: "center center",
          width: "1600px", // Changed from minWidth to width for strictness
          height: "903px",
          flexShrink: 0,
        }}
        className="bg-white relative overflow-hidden shadow-2xl"
      >
        <div className="absolute top-[46px] left-[832px] w-px h-[3px] bg-neutral-100 rounded-lg" />

        <img
          className="absolute top-0 left-0 w-[528px] h-full object-cover"
          alt="Background"
          src={background}
        />
        <img
          className="absolute top-[332px] left-[195px] w-[333px] h-[563px]"
          alt="Decorative graphic"
          src={Subtractt}
        />
        {/* Header Info */}
        <div className="flex flex-col w-[459px] items-start gap-6 absolute top-[113px] left-[35px]">
          <img
            className="relative w-[32.31px] h-[31px]"
            alt="Logo"
            src={group}
          />
          <h1 className="relative w-fit text-white text-[40px] font-weight-600 leading-[40px] break-words font-sans">
            All Your Claims,
            <br />
            One Smart Platform
          </h1>
          <p className="relative w-[431px] text-white text-[24px] font-weight-600 leading-[24px] break-words">
            Centralized CRM to track, process, and resolve claims smarter
          </p>
        </div>
        <div
          className="inline-flex items-center gap-2 absolute top-[352px] left-10"
          role="group"
        >
          <div className="relative w-3 h-3 bg-[#2c60f1] rounded-md" />
          <div className="relative w-3 h-3 bg-white rounded-md opacity-[0.62]" />
          <div className="relative w-3 h-3 bg-white rounded-md opacity-[0.62]" />
        </div>

        <img
          className="absolute w-[404px] h-[435px] top-[461px] left-[1196px]"
          alt="Decorative illustration"
          src={group2}
        />

        {/* <button
          className="absolute top-[113px] left-[678px] w-[101px] h-[31px] inline-flex items-center justify-start gap-[12px] group focus:outline-none"
          onClick={() => {
            navigate("/login");
          }}
        >
        

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


          <span className="text-primary text-[14px] font-normal break-words hover:underline">
            Login
          </span>
        </button> */}
        {/* Main Form Section */}
        <div className="flex flex-col w-[508px] items-start gap-10 absolute top-[197px] left-[810px]">
          <h2 className="text-black text-[24px] font-weight-600">
            Reset Password
          </h2>

          <form onSubmit={handleSubmit} className="flex flex-col gap-6 w-full">
            <div className="w-[440px] text-neutral-700 text-[16px]">
              <span>Reset Password for Email </span>
              <span className="font-weight-600">{emailFromUrl}</span>
            </div>

            {/* New Password Input */}
            <div className="flex flex-col gap-2 w-full">
              <label className="text-neutral-700 text-[14px] font-medium">
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
              <label className="text-neutral-700 text-[14px] font-medium">
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
            <div className="absolute top-[142px] left-[525px] flex flex-col w-[260px] p-6 bg-white shadow-lg rounded-lg border border-[#EEEEEE] gap-3">
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
              disabled={!allValid || loading}
              className={`w-full py-4 rounded-[4px] text-white font-medium transition-all flex items-center justify-center ${
                !allValid || loading
                  ? "bg-gray-300 cursor-not-allowed"
                  : "bg-[#0352FD] hover:bg-[#0246d9]"
              }`}
            >
              {loading ? (
                <svg
                  className="animate-spin h-5 w-5 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
              ) : (
                "Reset Password"
              )}
            </button>

            {error && <p className="text-red-500 text-sm">{error}</p>}
          </form>
        </div>
      </div>
    </div>
  );
};

// Helper component for the checkmarks
const RequirementItem = ({ met, text }: { met: boolean; text: string }) => (
  <div className="flex items-center gap-2">
    <img src={met ? Vector3 : Vector4} alt="" className="w-4 h-4" />
    <span className={`text-[13px] ${met ? "text-neutral-900" : "text-gray-500"}`}>
      {text}
    </span>
  </div>
);

export default ResetPassword;
