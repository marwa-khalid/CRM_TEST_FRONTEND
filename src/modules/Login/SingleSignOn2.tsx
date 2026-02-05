import { useState } from "react";
import Subtractt from '../../assets/images/Subtractt.svg';
import group from "../../assets/images/Group 2608219.svg";
import background from "../../assets/images/background.png";
import group2 from "../../assets/images/group-2608221.svg";
import fleet2 from "../../assets/images/fleet2.svg";
import claim from "../../assets/images/claim.svg";
import { useNavigate } from "react-router-dom";
const SingleSignOn2 = () => {
  const [password, setPassword] = useState("");
const email = localStorage.getItem("email")
  const navigate = useNavigate();
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Login submitted", { email, password });
  };

  const handleForgotPassword = () => {
    console.log("Forgot password clicked");
  };

  return (
    <div
      className="bg-white w-full min-w-[1600px] min-h-[896px] relative"
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

      <div className="flex flex-col w-[508px] items-start gap-10 absolute top-[170px] left-[810px]">
        <h2 className="relative self-stretch text-black text-[24px] font-semibold leading-[24px] break-words">
          Select Module
        </h2>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col items-start gap-6 relative self-stretch w-full flex-[0_0_auto]"
        >
          <div className="flex flex-col items-start gap-5 relative self-stretch w-full flex-[0_0_auto]">
            <div className="w-[440px] text-[#444444] text-base font-['Stack_Sans_Headline'] break-words leading-relaxed">
              <span className="font-normal">You have been logged in as </span>
              <span className="font-semibold">{email}</span>
              <br />
              <span className="font-normal">
                Select from the listed applications to proceed
              </span>
            </div>
            <div className="flex items-start justify-start self-stretch gap-5">
              {/* Card 1: Claims Management */}
              <div className="flex flex-col items-center justify-center w-[245px] py-6 px-4 bg-[#D9ECFF] rounded-lg gap-6">
                {/* Icon Placeholder - Replace with your SVG */}
                <img src={claim} alt="" />

                <div className="flex flex-col items-start gap-3">
                  <h3 className="text-black text-[16px] font-medium leading-4 font-['Stack_Sans_Headline']">
                    Claims Management
                  </h3>
                </div>
              </div>

              {/* Card 2: Fleet Management */}
              <div className="flex flex-col items-center justify-center w-[245px] py-6 px-4 bg-[#D9ECFF] rounded-lg gap-6">
                {/* Icon Placeholder - Replace with your SVG */}
                <img src={fleet2} alt="" />
                <div className="flex flex-col items-start gap-3">
                  <h3 className="text-black text-[16px] font-medium leading-4 font-['Stack_Sans_Headline']">
                    Fleet Management
                  </h3>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
export default SingleSignOn2;