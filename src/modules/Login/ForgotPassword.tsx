import { useState } from "react";
import Subtractt from '../../assets/images/Subtractt.svg';
import group from "../../assets/images/Group 2608219.svg";
import background from "../../assets/images/background.png";
import group2 from "../../assets/images/group-2608221.svg";
import subtract1 from "../../assets/images/subtract-1.svg";
import union from "../../assets/images/union.svg";
import { useNavigate } from "react-router-dom";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [errorMessage, setErrorMessage] = useState(""); // For UI feedback
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setLoading(true);

    
    try {
      // 1. Call the send email endpoint
      const response = await fetch(
        "https://emailbackend-ten.vercel.app/send-reset-link",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            recipientEmail: email,
            inviteLink: `https://crmtestfe.netlify.app/auth/reset-password?email=${email}&code=839201`,
          }),
        },
      );

      if (response.ok) {
        // 2. Store OTP and Expiry in localStorage for the frontend to verify
        localStorage.setItem(
          "email",
          email
        );

        console.log("Activation email sent successfully");
        navigate("/forgot-password2");
      } else {
        setErrorMessage("User not found or server error.");
      }
    } catch (error) {
      console.error("Network error:", error);
      setErrorMessage("Could not connect to the server.");
    } finally {
      setLoading(false);
    }
  };
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
          Forgot Password
        </h2>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col items-start gap-6 relative self-stretch w-full flex-[0_0_auto]"
        >
          <div className="flex flex-col items-start gap-5 relative self-stretch w-full flex-[0_0_auto]">
            {errorMessage && <p>{errorMessage}</p>}{" "}
            <div className="flex flex-col items-start gap-2 relative self-stretch w-full flex-[0_0_auto]">
              <label
                htmlFor="email"
                className="relative self-stretch text-[#444444] text-[14px] font-medium break-words"
              >
                Email
              </label>
              <div className="flex items-center self-stretch px-5 py-4 bg-white rounded-[4px] outline outline-1 outline-[#CCCCCC] -outline-offset-1 gap-[10px]">
                <input
                  type="email"
                  id="email"
                  value={email}
                  required
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@autoclaim.com"
                  className="w-full bg-transparent text-[16px] font-light text-black placeholder-[#AAAAAA] outline-none"
                />
              </div>
            </div>
          </div>
        </form>
        <button
          type="submit"
          onClick={handleSubmit}
          disabled={loading}
          className={`flex items-center justify-center w-[508px] px-10 py-4 rounded-[4px] transition-all ${
            loading ? "bg-gray-400" : "bg-[#0352FD] hover:bg-[#0246d9]"
          } active:scale-[0.98]`}
        >
          <span className="text-white text-[16px] font-medium leading-[16px]">
            {loading ? "Sending..." : "Send Email"}
          </span>
        </button>
      </div>
    </div>
  );
};
export default ForgotPassword;