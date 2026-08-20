import { useEffect, useRef, useState } from "react";
import Subtractt from '../../assets/images/Subtractt.svg';
import group from "../../assets/images/Group 2608219.svg";
import background from "../../assets/images/background.png";
import group2 from "../../assets/images/group-2608221.svg";
import Fleet from "../../assets/images/Fleet.svg";
import { useNavigate } from "react-router-dom";
import { useCurrentUser } from "../../context/AuthContext";
import subtract1 from '../../assets/images/subtract-1.svg'
import union from '../../assets/images/union.svg'
import ArrowRight from '../../assets/images/ArrowRight.svg'

const SingleSignOn = () => {
  const navigate = useNavigate();
  // Email comes from the auth context (cookie-based); fall back to the email
  // captured during login. The old localStorage "user" no longer exists.
  const { user } = useCurrentUser();
  const email = user?.email || localStorage.getItem("pendingLoginEmail") || "";
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

          <div className="flex flex-col items-start gap-1">
            <p className="text-white text-[24px] font-weight-600 leading-[24px]">Complete Control.</p>
            <p className="text-white text-[24px] font-weight-600 leading-[24px]">Better Outcomes.</p>
            <p className="text-white text-[24px] font-weight-600 leading-[24px]">Faster Claims.</p>
          </div>
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

        <div className="flex flex-col w-[508px] items-start gap-10 absolute top-1/2 -translate-y-1/2 left-[810px]">
          <h2 className="relative self-stretch text-black text-[24px] font-weight-600 leading-[24px] break-words">
            Select Application
          </h2>

          <form className="flex flex-col items-start gap-6 relative self-stretch w-full flex-[0_0_auto]">
            <div className="flex flex-col items-start gap-5 relative self-stretch w-full flex-[0_0_auto]">
              <div className="w-[440px] text-[#444444] text-base font-['Stack_Sans_Headline'] break-words leading-relaxed">
                <span className="font-weight-400">
                  You have been logged in as{" "}
                </span>
                <span className="font-weight-600">{email}</span>
                <br />
                <span className="font-weight-400">
                  Select from the listed applications to proceed
                </span>
              </div>
              <div
                className="flex flex-col items-start justify-start self-stretch gap-6 p-4 rounded-lg outline outline-1 outline-[#A3CFFF] -outline-offset-1 bg-white cursor-pointer"
                onClick={() => navigate("/dashboard")}
              >
                {/* Header Row */}
                <div className="flex items-center justify-between self-stretch">
                  <div className="flex items-center w-[103px] h-[31px] gap-1">
                    {/* If you have an icon/logo, place it here */}
                    <div className="flex items-center">
                      <img
                        className=" top-0 left-0 w-[18px] h-[31px]"
                        alt=""
                        src={subtract1}
                      />

                      <img
                        className=" top-[7px] left-[15px] w-3 h-[17px]"
                        alt=""
                        src={union}
                      />
                    </div>
                    <div className=" top-2 left-[31px] text-neutral-900 font-weight-600 text-black text-[12px]">
                      AUTOCLAIM
                    </div>
                  </div>
                  {/* Arrow Icon */}
                  <img src={ArrowRight} alt="" />
                </div>

                {/* Content Section */}
                <div className="flex flex-col items-start gap-3">
                  <h3 className="text-black text-[16px] font-weight-600 font-weight-[500] leading-4 font-['Stack_Sans_Headline']">
                    Claims Management
                  </h3>
                  <p className="text-[#888888] text-[12px] font-weight-400  leading-relaxed">
                    Manage claims end-to-end with complete visibility and
                    control.
                    <br />
                    Track status, documents, and approvals in one centralized
                    system
                  </p>
                </div>
              </div>

              <div
                className="flex flex-col items-start justify-start self-stretch gap-6 p-4 rounded-lg outline outline-1 outline-[#A3CFFF] -outline-offset-1 bg-white cursor-pointer"
                onClick={() => navigate("/fleet/dashboard")}
              >
                <div className="flex items-center justify-between self-stretch">
                  <div className="flex items-center gap-2">
                    <img src={Fleet} alt="" className="w-8 h-8" />
                    <div className="text-neutral-900 font-weight-600 text-black text-[12px]">
                      SKYLINE
                    </div>
                  </div>
                  <img src={ArrowRight} alt="" />
                </div>

                <div className="flex flex-col items-start gap-3">
                  <h3 className="text-black text-[16px] font-weight-600 font-weight-[500] leading-4 font-['Stack_Sans_Headline']">
                    Skyline Management
                  </h3>
                  <p className="text-[#888888] text-[12px] font-weight-400 leading-relaxed">
                    Manage Skyline hires, documents, payments, and vehicle status
                    in one centralized system.
                    <br />
                    Track records, tasks, and activity with the same workflow
                    style as claims.
                  </p>
                </div>
              </div>

              {/* Vehicle Management — one card, two sub-modules (Skyline / CAMS-NA). */}
              <div className="flex flex-col items-start justify-start self-stretch gap-6 p-4 rounded-lg outline outline-1 outline-[#A3CFFF] -outline-offset-1 bg-white">
                <div className="flex items-center gap-3">
                  <img src={Fleet} alt="" className="w-8 h-8" />
                  <div className="flex flex-col items-start gap-1">
                    <h3 className="text-black text-[16px] font-weight-600 leading-4 font-['Stack_Sans_Headline']">
                      Vehicle Management
                    </h3>
                    <p className="text-[#888888] text-[12px] font-weight-400 leading-relaxed">
                      Select the module you want to navigate to
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-start gap-4 self-stretch">
                  <div
                    className="w-full flex justify-between items-center cursor-pointer"
                    onClick={() => navigate("/vehicle-management/skyline/dashboard")}
                  >
                    <span className="text-neutral-900 text-sm font-weight-600 font-['Stack_Sans_Headline']">
                      Skyline
                    </span>
                    <img src={ArrowRight} alt="" />
                  </div>

                  <div className="w-full h-px bg-neutral-100" />

                  <div
                    className="w-full flex justify-between items-center cursor-pointer"
                    onClick={() => navigate("/vehicle-management/cams/dashboard")}
                  >
                    <span className="text-neutral-900 text-sm font-weight-600 font-['Stack_Sans_Headline']">
                      CAMS/NA
                    </span>
                    <img src={ArrowRight} alt="" />
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
export default SingleSignOn;
