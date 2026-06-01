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
import { registerSession } from "../../services/AccountSettings/AccountSettings";

const OTPPage = () => {
  const [otp, setOtp] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isResending, setIsResending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [scale, setScale] = useState(1);

  const navigate = useNavigate();
  const containerRef = useRef(null);

  const pendingEmail = localStorage.getItem("pendingLoginEmail");

  useEffect(() => {
    if (!pendingEmail) {
      setErrorMessage("Session expired. Please login again.");
    }
  }, [pendingEmail]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    setErrorMessage("");

    if (!pendingEmail) {
      setErrorMessage("Session expired. Please login again.");
      return;
    }

    if (!otp || otp.length !== 6) {
      setErrorMessage("Invalid OTP");
      return;
    }

    try {
      setIsVerifying(true);

      const response = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_name: pendingEmail,
          otp,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrorMessage(data.detail || data.message || "Invalid OTP");
        return;
      }

      const pendingUser = localStorage.getItem("pendingLoginUser");

      if (!pendingUser) {
        setErrorMessage("Login session missing. Please login again.");
        return;
      }

      const parsedPendingUser = JSON.parse(pendingUser);

      localStorage.setItem("access_token", parsedPendingUser.access_token);
      if (parsedPendingUser.refresh_token) {
        localStorage.setItem("refresh_token", parsedPendingUser.refresh_token);
      }
      const { access_token, refresh_token, ...userInfo } = parsedPendingUser;
      localStorage.setItem("user", JSON.stringify(userInfo));

      localStorage.removeItem("pendingLoginUser");
      localStorage.removeItem("pendingLoginEmail");
      localStorage.removeItem("activeUser");
      localStorage.removeItem("pendingOTP");

      await registerSession({ device_info: navigator.userAgent }).catch(() => {});

      navigate("/single-signon");
    } catch (error) {
      console.error(error);
      setErrorMessage("Something went wrong. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  useEffect(() => {
    const handleResize = () => {
      const baseWidth = 1600;
      const baseHeight = 903;

      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;

      const widthScale = windowWidth / baseWidth;
      const heightScale = windowHeight / baseHeight;

      const newScale = Math.max(widthScale, heightScale);
      setScale(newScale);
    };

    window.addEventListener("resize", handleResize);
    handleResize();

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown((prev) => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleResendOTP = async () => {
    if (countdown > 0 || isResending) return;

    setOtp("");
    setErrorMessage("");

    if (!pendingEmail) {
      setErrorMessage("Session expired. Please login again.");
      return;
    }

    try {
      setIsResending(true);

      const response = await fetch(`${API_BASE_URL}/auth/send-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_name: pendingEmail,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrorMessage(data.detail || data.message || "Failed to resend OTP");
        return;
      }

      setCountdown(60);
    } catch (error) {
      console.error(error);
      setErrorMessage("Failed to resend OTP. Please try again.");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="w-full h-screen overflow-hidden flex justify-center items-center bg-white font-['Stack_Sans_Headline']">
      <div
        ref={containerRef}
        style={{
          transform: `scale(${scale})`,
          transformOrigin: "center center",
          width: "1600px",
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

        <div className="flex flex-col w-[459px] items-start gap-6 absolute top-[113px] left-[35px]">
          <img
            className="relative w-[32.31px] h-[31px]"
            alt="AutoClaim logo"
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
          aria-label="Carousel indicators"
        >
          <div
            className="relative w-3 h-3 bg-[#2c60f1] rounded-md aspect-[1]"
            aria-label="Slide 1 of 3"
            aria-current="true"
          />
          <div
            className="relative w-3 h-3 bg-white rounded-md aspect-[1] opacity-[0.62]"
            aria-label="Slide 2 of 3"
          />
          <div
            className="relative w-3 h-3 bg-white rounded-md aspect-[1] opacity-[0.62]"
            aria-label="Slide 3 of 3"
          />
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

          <div className="absolute top-2 left-[31px] [font-family:'Stack_Sans_Headline',Helvetica] font-weight-600 text-black text-xs tracking-[0] leading-[normal]">
            AUTOCLAIM
          </div>

          <img
            className="absolute top-[7px] left-[15px] w-3 h-[17px]"
            alt=""
            src={union}
          />
        </div>

        <div className="flex flex-col w-[508px] items-start gap-10 absolute top-[197px] left-[810px]">
          <div>
            <h2 className="relative self-stretch text-neutral-900 text-[24px] font-weight-600 mb-2 leading-[24px] break-words">
              Verify OTP
            </h2>
            <span className="text-neutral-700 text-[16px] font-light margin-top-[10px]">
              We have sent a one-time password (OTP) to your email
              <br />
              address. Enter it below to verify your account.
            </span>
          </div>

          <form
            onSubmit={handleSubmit}
            className="flex flex-col items-start gap-6 relative self-stretch w-full flex-[0_0_auto]"
          >
            <div className="flex flex-col items-start gap-5 relative self-stretch w-full flex-[0_0_auto]">
              {errorMessage && (
                <div className="w-full px-5 py-3 bg-red-50 rounded flex justify-start items-center gap-3 border border-red-100">
                  <img src={Vector} className="w-5 h-5" alt="" />
                  <div className="text-neutral-700 text-sm">{errorMessage}</div>
                </div>
              )}

              <div className="flex flex-col items-start gap-2 relative self-stretch w-full flex-[0_0_auto]">
                <label
                  htmlFor="otp"
                  className="relative self-stretch text-neutral-700 text-[14px] font-weight-500 break-words"
                >
                  OTP
                </label>

                <div className="flex items-center self-stretch px-5 py-4 bg-white rounded-[4px] outline outline-1 outline-[#CCCCCC] -outline-offset-1 gap-[10px]">
                  <input
                    type="text"
                    id="otp"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                    onPaste={(e) => {
                      e.preventDefault();
                      const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
                      setOtp(pasted);
                    }}
                    className="w-full bg-transparent text-[16px] tracking-[0.5em] font-weight-600 outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-start justify-start w-full">
              <p className="text-[14px] font-weight-400 font-light">
                <span className="text-neutral-700">Didn’t Receive OTP? </span>
                <button
                  type="button"
                  disabled={countdown > 0 || isResending}
                  onClick={handleResendOTP}
                  className={`font-weight-400 transition-all  ${
                    countdown > 0 || isResending
                      ? "text-gray-400 cursor-not-allowed"
                      : "text-primary hover:underline cursor-pointer"
                  }`}
                >
                  {isResending
                    ? "Sending..."
                    : countdown > 0
                      ? `Resend in ${countdown}s`
                      : "Resend"}
                </button>
              </p>
            </div>
          </form>

          <button
            type="button"
            disabled={isVerifying}
            onClick={() => handleSubmit()}
            className="flex items-center justify-center w-[508px] px-10 py-4 bg-blue-500 rounded-[4px] gap-[10px] hover:bg-[#0246d9] active:scale-[0.98] transition-all group disabled:bg-blue-300"
          >
            <span className="text-white text-[16px] font-weight-500 leading-[16px] break-words">
              {isVerifying ? "Verifying..." : "Verify and Continue"}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default OTPPage;
