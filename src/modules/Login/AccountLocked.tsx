import { useEffect, useRef, useState } from "react";
import Subtractt from "../../assets/images/Subtractt.svg";
import group from "../../assets/images/Group 2608219.svg";
import background from "../../assets/images/background.png";
import group2 from "../../assets/images/group-2608221.svg";
import subtract1 from "../../assets/images/subtract-1.svg";
import vector from "../../assets/images/Vector.svg";
import union from "../../assets/images/union.svg";
import { useNavigate } from "react-router-dom";

const AccountLocked = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  // 1. Start with 300 seconds
  const [countdown, setCountdown] = useState(120);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // 2. Create a helper to turn 299 seconds into "4:59"
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Login submitted", { email, password });
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
          <h2 className="relative self-stretch text-black text-[24px] font-semibold leading-[24px] break-words">
            Account Locked
          </h2>

          <form
            onSubmit={handleSubmit}
            className="flex flex-col items-start gap-6 relative self-stretch w-full flex-[0_0_auto]"
          >
            <div className="flex flex-col items-start justify-start w-full max-w-[508px] gap-1">
              {/* Error Message Section */}
              <div className="flex items-start justify-start w-full gap-5 rounded-[4px]">
                {/* Red "Block" Icon */}
                <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center">
                  <img src={vector} alt="" />
                </div>

                <p className="w-[440px] text-[#444444] text-[16px] font-normal leading-tight break-words">
                  Your account has been temporarily locked due to multiple
                  <br />
                  unsuccessful login attempts
                </p>
              </div>

              {/* Instruction Section */}
              <div className="flex items-start justify-start w-full gap-5 py-3 rounded-[4px]">
                {/* White "Information" Icon Placeholder */}
                <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center invisible">
                  <img src={vector} alt="" />
                </div>

                <div className="text-left leading-tight">
                  <p className="text-slate-700">
                    <span className="text-sm font-normal">
                      Please wait for{" "}
                    </span>
                    <span className="text-base font-semibold">{formatTime(countdown)}</span>
                    <span className="text-sm font-normal">
                      {" "}
                      mins and try Login again or reset your password if you’ve
                      forgotten it.
                    </span>
                    <br />
                    <span className="text-sm font-normal">
                      If the issue continues, please contact your system
                      administrator.
                    </span>
                  </p>
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
            <div className="flex items-start justify-start gap-[24px]">
              {/* Reset Password Button */}
              <button
                onClick={() => navigate("/auth/reset-password")}
                className="flex items-center justify-center w-[240px] px-[40px] py-[16px] bg-white rounded-[4px] border border-[#0352FD] group hover:bg-[#0352FD] transition-all duration-200"
              >
                <span className="text-[#0352FD] text-[16px] font-medium leading-[16px] group-hover:text-white transition-colors">
                  Reset Password
                </span>
              </button>

              {/* Back to Login Button */}
              {countdown > 0 ? (
                <button
                  type="button"
                  disabled={true}
                  className="w-60 px-10 py-4 bg-white rounded outline outline-1 -outline-offset-1 outline-gray-300 inline-flex justify-center items-center gap-2.5 hover:bg-gray-50 active:bg-gray-100 transition-colors duration-200"
                >
                  <span className="text-gray-500 text-base font-medium leading-4">
                    Back to Login
                  </span>
                </button>
              ) : (
                <button
                  onClick={() => navigate("/login")}
                  className="flex items-center justify-center w-[240px] px-[40px] py-[16px] bg-white rounded-[4px] border border-[#0352FD] group hover:bg-[#0352FD] transition-all duration-200"
                >
                  <span className="text-[#0352FD] text-[16px] font-medium leading-[16px] group-hover:text-white transition-colors">
                    Back to Login
                  </span>
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
export default AccountLocked;
