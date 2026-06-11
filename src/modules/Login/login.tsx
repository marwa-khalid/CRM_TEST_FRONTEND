import { useEffect, useRef, useState } from "react";
import Subtractt from "../../assets/images/Subtractt.svg";
import group from "../../assets/images/Group 2608219.svg";
import background from "../../assets/images/background.png";
import group2 from "../../assets/images/group-2608221.svg";
import subtract1 from "../../assets/images/subtract-1.svg";
import Vector from "../../assets/images/Vector.svg";
import union from "../../assets/images/union.svg";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../../services/axiosConfig.ts";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setErrorMessage("");
  setLoading(true);

  const lockoutData = localStorage.getItem(`lockout_${email}`);
  if (lockoutData) {
    const { lockedUntil } = JSON.parse(lockoutData);
    if (Date.now() < lockedUntil) {
      navigate("/account-locked");
      return;
    } else {
      localStorage.removeItem(`lockout_${email}`);
    }
  }

  try {
    // 1. Validate email + password against backend
    const loginResponse = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user_name: email,
        password,
      }),
    });

    if (!loginResponse.ok) {
      const currentAttempts =
        Number(localStorage.getItem(`attempts_${email}`)) || 0;
      const newAttempts = currentAttempts + 1;

      if (newAttempts >= 5) {
        const lockDuration = 5 * 60 * 1000;
        const lockedUntil = Date.now() + lockDuration;

        localStorage.setItem(
          `lockout_${email}`,
          JSON.stringify({ lockedUntil }),
        );
        localStorage.removeItem(`attempts_${email}`);
        navigate("/account-locked");
        return;
      } else {
        localStorage.setItem(`attempts_${email}`, newAttempts.toString());
      }

      setErrorMessage("Invalid Credentials");
      return;
    }

    await loginResponse.json();

    localStorage.removeItem(`attempts_${email}`);
    // Only the email is needed for the OTP step. The auth token is set as an
    // httpOnly cookie by the server on /verify-otp — never stored in localStorage.
    localStorage.setItem("pendingLoginEmail", email);

    // 2. Ask backend to send OTP
    const otpResponse = await fetch(`${API_BASE_URL}/auth/send-otp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user_name: email,
      }),
    });

    if (!otpResponse.ok) {
      const otpErr = await otpResponse.json();
      setErrorMessage(otpErr.detail || "Failed to send OTP");
      return;
    }

    navigate("/otp");
  } catch (error) {
    console.error(error);
    setErrorMessage("Something went wrong. Please try again.");
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
    /* Outer wrapper matches the background to hide any potential gaps */
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

        {/* IMAGE FIX: object-cover and h-full ensures no white lines */}
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

        <div className="absolute top-[113px] left-[810px] w-[101px] h-[31px]">
          <img
            className="absolute top-0 left-0 w-[18px] h-[31px]"
            alt=""
            src={subtract1}
          />
          <div className="absolute top-2 left-[31px] font-weight-600 text-black text-xs tracking-widest">
            AUTOCLAIM
          </div>
          <img
            className="absolute top-[7px] left-[15px] w-3 h-[17px]"
            alt=""
            src={union}
          />
        </div>

        <div className="flex flex-col w-[508px] items-start gap-10 absolute top-[197px] left-[810px]">
          <h2 className="relative self-stretch text-black text-[24px] font-weight-600 leading-[24px]">
            Sign in
          </h2>

          <form
            onSubmit={handleSubmit}
            className="flex flex-col items-start gap-6 w-full"
          >
            {errorMessage && (
              <div className="w-full px-5 py-3 bg-red-50 rounded flex justify-start items-center gap-3 border border-red-100">
                <img src={Vector} className="w-5 h-5" alt="" />
                <div className="text-neutral-700 text-sm">{errorMessage}</div>
              </div>
            )}

            <div className="flex flex-col items-start gap-2 w-full">
              <label className="text-[#444444] text-[14px] font-medium">
                Email
              </label>
              <div className="flex items-center self-stretch px-5 py-4 bg-white rounded-[4px] border border-[#CCCCCC] focus-within:border-[#0352FD]">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@autoclaim.com"
                  required
                  className="w-full bg-transparent text-[16px] outline-none"
                />
              </div>
            </div>

            <div className="flex flex-col items-start gap-2 w-full">
              <label className="text-[#444444] text-[14px] font-medium">
                Password
              </label>
              <div className="flex items-center self-stretch px-5 py-4 bg-white rounded-[4px] border border-[#CCCCCC] focus-within:border-[#0352FD]">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="**********"
                  required
                  className="w-full bg-transparent text-[16px] outline-none"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigate("/forgot-password")}
              className="text-[#0352FD] text-[14px] hover:underline"
            >
              Forgot Password
            </button>

            <button
              type="submit"
              onClick={handleSubmit}
              disabled={loading}
              className={`flex items-center justify-center w-[508px] px-10 py-4 rounded-[4px] active:scale-[0.98] transition-all ${loading ? "bg-gray-400 cursor-not-allowed" : "bg-[#0352FD] hover:bg-[#0246d9]"}`}
            >
              {loading ? (
                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <span className="text-white text-[16px] font-medium">Login</span>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
