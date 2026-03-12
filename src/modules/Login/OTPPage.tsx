import { useEffect, useRef, useState } from "react";
import Subtractt from '../../assets/images/Subtractt.svg';
import group from "../../assets/images/Group 2608219.svg";
import background from "../../assets/images/background.png";
import group2 from "../../assets/images/group-2608221.svg";
import subtract1 from "../../assets/images/subtract-1.svg";
import Vector from "../../assets/images/Vector.svg";
import Vector2 from "../../assets/images/Vector2.svg";
import union from "../../assets/images/union.svg";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../../services/axiosConfig.ts";

const OTPPage = () => {
  const [otp, setOtp] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(0); // Timer state
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    // 1. Get the OTP data we saved during login
    const storedDataRaw = localStorage.getItem("pendingOTP");

    if (!storedDataRaw) {
      setErrorMessage("Invalid OTP.");
      return;
    }

    const { code, expiresAt } = JSON.parse(storedDataRaw);

    // 2. Check for Expiry
    if (Date.now() > expiresAt) {
      setErrorMessage(
        "The verification code has expired/is incorrect. Please request a new code",
      );
      return;
    }

    // 3. Compare Input with stored Code
    if (otp === code) {
      console.log("OTP Verified!");
      localStorage.removeItem("pendingOTP"); // Clean up sensitive data
       const storedUserRaw = localStorage.getItem("activeUser");
       if (!storedUserRaw) {
         setErrorMessage("Invalid Credentials");
         return;
       }
      const storedUser = JSON.parse(storedUserRaw);
           const response2 = await fetch(
            `${API_BASE_URL}/auth/login`,
             {
               method: "POST",
               headers: {
                 "Content-Type": "application/json",
               },
               body: JSON.stringify({
                 user_name: storedUser.email,
                 password: storedUser.password,
               }),
             },
           );

           if (!response2.ok) {
             setErrorMessage("Invalid credentials");
             return;
           }

           const data = await response2.json();

           // Save token
           localStorage.setItem("access_token", data.access_token);
           localStorage.setItem("user", JSON.stringify(data));

          //  navigate("/dashboard");
      navigate("/single-signon"); // Or wherever your landing page is
    } else {
      setErrorMessage(
        "The verification code has expired/is incorrect. Please request a new code",
      );
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
  // Handle the countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleResendOTP = async () => {
    if (countdown > 0) return; // Prevent clicking if timer is active
    setOtp("")
    setIsResending(true);
    setErrorMessage("");

    // 1. Get user email from local storage
    const storedDataRaw = localStorage.getItem("pendingOTP");
    const storedUserRaw = localStorage.getItem("activeUser");

    // We need the email address to know where to send it
    const email = storedDataRaw
      ? JSON.parse(storedDataRaw).email
      : storedUserRaw
        ? JSON.parse(storedUserRaw).email
        : null;

    if (!email) {
      setErrorMessage(
        "The verification code has expired/is incorrect. Please request a new code",
      );
      setIsResending(false);
      return;
    }

    // 2. Generate New OTP and Expiry
    const newOtpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const newExpiresAt = Date.now() + 5 * 60 * 1000;

    try {
      // 3. Call Backend
      const response = await fetch("https://emailbackend-ten.vercel.app/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipientEmail: email, otp: newOtpCode }),
      });

      if (response.ok) {
        // 4. Update local storage with the NEW code
        localStorage.setItem(
          "pendingOTP",
          JSON.stringify({
            code: newOtpCode,
            expiresAt: newExpiresAt,
            email: email,
          }),
        );

        setCountdown(60); // Start 60s cooldown
        console.log("New OTP sent!");
      } else {
        setErrorMessage(
          "The verification code has expired/is incorrect. Please request a new code",
        );
      }
    } catch (error) {
      setErrorMessage(
        "The verification code has expired/is incorrect. Please request a new code",
      );
    } finally {
      setIsResending(false);
    }
  };
  return (
    <div className="w-full h-screen overflow-hidden flex justify-center items-center bg-white">
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

        <div className="flex flex-col w-[459px] items-start gap-6 absolute top-[113px] left-[35px]">
          <img
            className="relative w-[32.31px] h-[31px]"
            alt="AutoClaim logo"
            src={group}
          />

          <h1 className="relative w-fit text-white text-[40px] font-semibold leading-[40px] break-words font-sans">
            All Your Claims,
            <br />
            One Smart Platform
          </h1>

          <p className="relative w-[431px] text-white text-[24px] font-semibold leading-[24px] break-words">
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

          <div className="absolute top-2 left-[31px] [font-family:'Stack_Sans_Headline',Helvetica] font-semibold text-black text-xs tracking-[0] leading-[normal]">
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
            <h2 className="relative self-stretch text-black text-[24px] font-semibold mb-2 leading-[24px] break-words">
              Verify OTP
            </h2>
            <span className="text-neutral-700 text-md font-weight-400 font-regular margin-top-[10px]">
              We have sent a one-time password (OTP) to your email <br/>address.
              Enter it below to verify your account.
            </span>
          </div>
          <form
            onSubmit={handleSubmit}
            className="flex flex-col items-start gap-6 relative self-stretch w-full flex-[0_0_auto]"
          >
            <div className="flex flex-col items-start gap-5 relative self-stretch w-full flex-[0_0_auto]">
              {/* <div className="w-full px-5 py-3 bg-blue-50 rounded flex justify-start items-center gap-3 border border-blue-100">
                <img src={Vector2} className="w-5 h-5" alt="" /> */}

              {/* </div> */}
              {errorMessage && (
                <div className="w-full px-5 py-3 bg-red-50 rounded flex justify-start items-center gap-3 border border-red-100">
                  <img src={Vector} className="w-5 h-5" alt="" />

                  <div className="text-neutral-700 text-sm">{errorMessage}</div>
                </div>
              )}
              <div className="flex flex-col items-start gap-2 relative self-stretch w-full flex-[0_0_auto]">
                <label
                  htmlFor="email"
                  className="relative self-stretch text-[#444444] text-[14px] font-medium break-words"
                >
                  OTP
                </label>

                <div className="flex items-center self-stretch px-5 py-4 bg-white rounded-[4px] outline outline-1 outline-[#CCCCCC] -outline-offset-1 gap-[10px]">
                  <input
                    type="text"
                    id="otp"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))} // Only allow numbers
                    // placeholder="000000"
                    className="w-full bg-transparent text-[16px] tracking-[0.5em] font-semibold outline-none"
                  />
                </div>
              </div>
            </div>

            {/* <button
            type="button"
            onClick={handleForgotPassword}
            className="relative self-stretch font-CTA-link text-[#0352FD] text-[14px] text-[#0352fd] tracking-[var(--CTA-link-letter-spacing)] leading-[var(--CTA-link-line-height)] [font-style:var(--CTA-link-font-style)] text-left cursor-pointer hover:underline"
          >
            Forgot Password
          </button> */}
            <div className="flex items-start justify-start w-full">
              <p className="text-[14px] font-normal">
                <span className="text-[#444444]">Didn’t Receive OTP? </span>
                <button
                  type="button"
                  disabled={countdown > 0 || isResending}
                  onClick={handleResendOTP}
                  className={`font-medium transition-all ${
                    countdown > 0 || isResending
                      ? "text-gray-400 cursor-not-allowed"
                      : "text-[#0352FD] hover:underline cursor-pointer"
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
            type="submit"
            onClick={handleSubmit}
            className="flex items-center justify-center w-[508px] px-10 py-4 bg-[#0352FD] rounded-[4px] gap-[10px] hover:bg-[#0246d9] active:scale-[0.98] transition-all group"
          >
            <span className="text-white text-[16px] font-medium leading-[16px] break-words">
              {" "}
              Verify and Continue
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};;
export default OTPPage;