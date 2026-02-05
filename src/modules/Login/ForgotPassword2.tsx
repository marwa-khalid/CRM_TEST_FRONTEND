import { useState } from "react";
import Subtractt from '../../assets/images/Subtractt.svg';
import group from "../../assets/images/Group 2608219.svg";
import background from "../../assets/images/background.png";
import group2 from "../../assets/images/group-2608221.svg";
import Vector2 from "../../assets/images/Vector2.svg";
import { useNavigate } from "react-router-dom";

const ForgotPassword2 = () => {
  const email = localStorage.getItem("email");
  const navigate = useNavigate();

  return (
    <div
      className="bg-white w-full min-h-screen relative overflow-hidden"
      data-model-id="5:137"
    >
      <div className="absolute top-[46px] left-[832px] w-px h-[3px] bg-neutral-100 rounded-lg" />
      <img
        className="absolute top-[calc(50.00%_-_448px)] left-0 w-[528px] h-[896px] object-cover"
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
        <h2 className="relative self-stretch text-black text-[24px] font-semibold leading-[24px] break-words">
          Email Sent
        </h2>

        <form className="flex flex-col items-start gap-6 relative self-stretch w-full flex-[0_0_auto]">
          <div className="flex items-start justify-start w-full max-w-[508px] py-3 rounded-[4px] gap-[20px]">
            {/* Info Icon */}
            <div className="relative flex-shrink-0 w-10 h-10">
              <div className="absolute inset-0 flex items-center justify-center">
                {/* Simple "i" for information */}
                <img src={Vector2} alt="" />
              </div>
            </div>

            {/* Text Content */}
            <p className="w-[440px] text-[#444444] text-[16px] font-normal leading-tight break-words pt-1">
              If an account exists for{" "}
              <span className="text-black font-semibold">{email}</span> a
              password reset link has been sent. Please check your inbox.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};
export default ForgotPassword2;