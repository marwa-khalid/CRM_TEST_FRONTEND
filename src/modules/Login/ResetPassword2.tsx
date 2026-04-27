import { useEffect, useRef, useState } from "react";
import Subtractt from '../../assets/images/Subtractt.svg';
import group from "../../assets/images/Group 2608219.svg";
import background from "../../assets/images/background.png";
import group2 from "../../assets/images/group-2608221.svg";
import Vector3 from "../../assets/images/Vector3.svg";
import { useNavigate } from "react-router-dom";

const ResetPassword2 = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const navigate = useNavigate();
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
      <button
        className="absolute  top-[113px] left-[810px] w-[101px] h-[31px] inline-flex items-center justify-start gap-[12px] group focus:outline-none"
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
      <div className="flex flex-col w-[508px] items-start gap-10 absolute top-[197px] left-[810px]">
        <h2 className="relative self-stretch text-black text-[24px] font-weight-600 leading-[24px] break-words">
          Password Updated
        </h2>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col items-start gap-6 relative self-stretch w-full flex-[0_0_auto]"
        >
          <div className="flex items-start justify-start w-full max-w-[508px] py-3 rounded-[4px] gap-[20px]">
            {/* Success Check Circle Icon */}
            <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center">
              <img src={Vector3} alt="" />
            </div>

            {/* Success Message Text */}
            <p className="w-[440px] text-[#444444] text-[16px] font-normal leading-normal break-words pt-1">
              Your password has been updated successfully. <br />
              Please{" "}
              <button
                className="text-[#0352FD] hover:underline focus:outline-none transition-all"
                onClick={() => {
                  navigate("/login");
                }}
              >
                log in
              </button>{" "}
              using your new password
            </p>
          </div>
        </form>
      </div>
    </div>
    </div>
  );
};
export default ResetPassword2;