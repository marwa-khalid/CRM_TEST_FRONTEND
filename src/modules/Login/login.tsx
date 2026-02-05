// // import React, { useState,useEffect } from 'react';
// // import { Eye, EyeOff } from 'lucide-react';
// // import logoImage from '../../assets/images/Logo.png';
// // import { useNavigate, Link } from 'react-router-dom';
// // import { login } from '../../services/Authentication/auth';
// // import accidentImage from '../../assets/images/1cbcac34591b113950559367e9110f4f4c7bcec3.png'
// // import { toast } from 'react-toastify';

// // const Login: React.FC = () => {
// //   const [email, setEmail] = useState<string>('');
// //   const [password, setPassword] = useState<string>('');
// //   const [showPassword, setShowPassword] = useState<boolean>(false);
// //   const [rememberMe, setRememberMe] = useState<boolean>(false);
// //   const [, setError] = useState<string>('');
// //   const [, setIsLoading] = useState<boolean>(false);
// //   const navigate = useNavigate();
// //   useEffect(() => {
// //     const storedToken = localStorage.getItem("authToken") || sessionStorage.getItem("authToken");
// //     if (storedToken) {
// //       // Already logged in, redirect
// //       navigate("/");
// //     }
// //   }, [navigate]);

// //   const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
// //   //   e.preventDefault();
// //   //   setError("");
// //   //   setIsLoading(true);

// //   //   try {
// //   //     const data = await login({
// //   //       user_name: email,
// //   //       password,
// //   //     });

// //   //     localStorage.setItem("authToken", data.access_token);
// //   //     localStorage.setItem("user_name", data.first_name);
// //   //     localStorage.setItem("tenant_id", data.tenant_id);
// //   //     navigate("/claims");
// //   //   } catch (err) {
// //   //     toast.error(err?.response?.data?.detail)
// //   //   } finally {
// //   //     setIsLoading(false);
// //   //   }
// //   };

// //   return (
// //       <div className="min-h-screen bg-gray-50 flex">
// //         {/* Left side - Login Form */}
// //         <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:px-20 xl:px-24">
// //           <div className="mx-auto w-full max-w-sm lg:w-96">
// //             {/* Logo */}
// //             <div className="mb-8">
// //               <div className="flex items-center">
// //                 <img src={logoImage} alt="ProClaim Logo" className="object-contain" />
// //               </div>
// //             </div>

// //             {/* Form */}
// //             <div>
// //               <h2 className="text-3xl font-bold text-gray-900 mb-2">Log in</h2>
// //               <p className="text-gray-600 mb-8">Welcome back! Please enter your details.</p>

// //               <form onSubmit={handleSubmit} className="space-y-6">
// //                 {/* Email Field */}
// //                 <div>
// //                   <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
// //                     Email
// //                   </label>
// //                   <input
// //                       id="email"
// //                       name="email"
// //                       type="email"
// //                       required
// //                       value={email}
// //                       onChange={(e) => setEmail(e.target.value)}
// //                       className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-custom-700 focus:border-custom-700"
// //                       placeholder="Enter your email"
// //                   />
// //                 </div>

// //                 {/* Password Field */}
// //                 <div>
// //                   <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
// //                     Password
// //                   </label>
// //                   <div className="relative">
// //                     <input
// //                         id="password"
// //                         name="password"
// //                         type={showPassword ? 'text' : 'password'}
// //                         required
// //                         value={password}
// //                         onChange={(e) => setPassword(e.target.value)}
// //                         className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-custom-700 focus:border-custom-700"
// //                         placeholder="••••••••"
// //                     />
// //                     <button
// //                         type="button"
// //                         onClick={() => setShowPassword(!showPassword)}
// //                         className="absolute inset-y-0 right-0 pr-3 flex items-center"
// //                     >
// //                       {showPassword ? (
// //                           <EyeOff className="h-4 w-4 text-gray-400" />
// //                       ) : (
// //                           <Eye className="h-4 w-4 text-gray-400" />
// //                       )}
// //                     </button>
// //                   </div>
// //                 </div>

// //                 {/* Remember me and Forgot password */}
// //                 <div className="flex items-center justify-between">
// //                   <div className="flex items-center">
// //                     <input
// //                         id="remember-me"
// //                         name="remember-me"
// //                         type="checkbox"
// //                         checked={rememberMe}
// //                         onChange={(e) => setRememberMe(e.target.checked)}
// //                         className="h-4 w-4 text-custom border-gray-300 rounded"
// //                     />
// //                     <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
// //                       Remember for 30 days
// //                     </label>
// //                   </div>
// //                   <div className="text-sm">
// //                     <Link to="/forgot-password" className="font-medium text-custom no-underline hover:underline">
// //                       Forgot Password
// //                     </Link>
// //                   </div>
// //                 </div>

// //                 {/* Sign in button */}
// //                 <div>
// //                   <button
// //                       type="submit"
// //                       className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-custom hover:bg-[#252B37] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-custom-600 transition-colors"
// //                   >
// //                     Sign in
// //                   </button>
// //                 </div>

// //                 {/* Google sign in */}
// //                 <div>
// //                   <button
// //                       type="button"
// //                       className="w-full flex justify-center items-center py-2.5 px-4 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-custom-500 transition-colors"
// //                   >
// //                     <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
// //                       <path
// //                           fill="#4285F4"
// //                           d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
// //                       />
// //                       <path
// //                           fill="#34A853"
// //                           d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
// //                       />
// //                       <path
// //                           fill="#FBBC05"
// //                           d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
// //                       />
// //                       <path
// //                           fill="#EA4335"
// //                           d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
// //                       />
// //                     </svg>
// //                     Sign in with Google
// //                   </button>
// //                 </div>
// //               </form>

// //               {/* Sign up link */}
// //               <p className="mt-6 text-center text-sm text-gray-600">
// //                 Don't have an account?{' '}
// //                 <Link to="/signup" className="font-medium text-custom hover:text-[#252B37]">
// //                   Sign up
// //                 </Link>
// //               </p>
// //             </div>
// //           </div>
// //         </div>

// //         {/* Right side - Device mockup */}
// //         <div className="hidden lg:block relative w-0 flex-1">
// //           <div className="absolute inset-0 bg-gray-100 flex items-center justify-end">
// //             {/* <div className="w-96 h-2/3 bg-white rounded-l-3xl shadow-2xl border-r-0 border-4 border-gray-800 overflow-hidden"> */}
// //               {/* <div className="w-full h-full bg-gray-300 flex items-center justify-center"> */}
// //                 {/* <div className="text-center p-8"> */}
// //                   <img src={accidentImage} alt='' />
// //                 {/* </div> */}
// //               {/* </div> */}
// //             {/* </div> */}
// //           </div>
// //         </div>
// //       </div>
// //   );
// // };

// // export default Login;

// import React, { useState, useEffect } from "react";
// import { useNavigate } from "react-router-dom";
// import { login } from "../../services/Authentication/auth";
// import { toast } from "react-toastify";
// import loginImage from "../../assets/images/Login.jpg";
// // Assuming you have the logo/icon as an SVG or Image
// import watermark from "../../assets/images/Watermark.png";
// import group from "../../assets/images/Group 2608219.svg";
// import subtractImage from "../../assets/images/Subtract.svg";
// import unionImage from "../../assets/images/Union.svg";
// const Login: React.FC = () => {
//   const [email, setEmail] = useState<string>("");
//   const [password, setPassword] = useState<string>("");
//   const [isLoading, setIsLoading] = useState<boolean>(false);
//   const navigate = useNavigate();

//   useEffect(() => {
//     const storedToken =
//       localStorage.getItem("authToken") || sessionStorage.getItem("authToken");
//     if (storedToken) {
//       navigate("/");
//     }
//   }, [navigate]);

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setIsLoading(true);

//     try {
//       const data = await login({
//         user_name: email,
//         password,
//       });

//       localStorage.setItem("authToken", data.access_token);
//       localStorage.setItem("user_name", data.first_name);
//       localStorage.setItem("tenant_id", data.tenant_id);
//       navigate("/claims");
//     } catch (err: any) {
//       toast.error(err?.response?.data?.detail || "Login failed");
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   return (
//     <div
//       className="login-container"
//       style={{
//         width: "100vw",
//         height: "100vh",
//         display: "flex",
//         background: "white",
//         fontFamily: '"Inter", sans-serif', // Closest to Stack Sans
//         overflow: "hidden",
//       }}
//     >
//       {/* Left Section: Hero Image */}
//       <div
//         className="hero-section"
//         style={{
//           width: "40%",
//           height: "100%",
//           position: "relative",
//           backgroundImage: `linear-gradient(0deg, rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url(${loginImage})`,
//           backgroundSize: "cover",
//           backgroundPosition: "center",
//           display: "flex",
//           flexDirection: "column",
//           justifyContent: "flex-start",
//           padding: "80px 40px",
//         }}
//       >
//         <div style={{ zIndex: 2 }}>
//           <img src={group} alt="" />
//           <h1
//             style={{
//               marginTop:"20px",
//               color: "white",
//               fontSize: "48px",
//               fontWeight: "600",
//               lineHeight: "1.1",
//               marginBottom: "20px",
//             }}
//           >
//             All Your Claims,
//             <br />
//             One Smart Platform
//           </h1>
//           <p
//             style={{
//               color: "white",
//               fontSize: "20px",
//               fontWeight: "400",
//               maxWidth: "400px",
//               opacity: 0.9,
//             }}
//           >
//             Centralized CRM to track, process, and resolve claims smarter
//           </p>
//         </div>

//         {/* Carousel Indicators */}
//         <div
//           style={{
//             display: "flex",
//             gap: "8px",
//             marginTop: "40px",
//           }}
//         >
//           <div
//             style={{
//               width: "10px",
//               height: "10px",
//               borderRadius: "50%",
//               background: "#3b82f6",
//             }}
//           />
//           <div
//             style={{
//               width: "10px",
//               height: "10px",
//               borderRadius: "50%",
//               background: "rgba(255,255,255,0.5)",
//             }}
//           />
//           <div
//             style={{
//               width: "10px",
//               height: "10px",
//               borderRadius: "50%",
//               background: "rgba(255,255,255,0.5)",
//             }}
//           />
//         </div>
//       </div>

//       {/* Right Section: Form */}
//       <div
//         className="form-section"
//         style={{
//           width: "60%",
//           height: "100%",
//           display: "flex",
//           flexDirection: "column",
//           justifyContent: "center",
//           alignItems: "center",
//           position: "relative",
//         }}
//       >
//         {/* Faded Background Logo/Star */}
//         <div
//           style={{
//             position: "absolute",
//             right: "-50px",
//             bottom: "-50px",
//             opacity: 0.03,
//             pointerEvents: "none",
//             zIndex: 0,
//           }}
//         >
//           {/* Example Star SVG to match your screenshot watermark */}
//           {/* <svg width="600" height="600" viewBox="0 0 24 24" fill="currentColor">
//             <path d="M12 2L14.5 9H22L16 13.5L18.5 21L12 16.5L5.5 21L8 13.5L2 9H9.5L12 2Z" />
//           </svg> */}
//           <img width="404" height="435" src={subtractImage} alt="" />
//           {/* <svg width="404" height="435" viewBox="0 0 404 435" fill="none" xmlns="http://www.w3.org/2000/svg">
// <path d="M129.614 180.659L37.9629 89.9727L90.9287 37.5644L182.581 128.251L182.581 -7.98087e-06L257.486 -1.12551e-05L257.486 114.013C213.695 128.939 182.197 170.424 182.197 219.267C182.197 268.109 213.695 309.594 257.486 324.52L257.486 435.435L182.581 435.435L182.581 307.184L90.9287 397.87L37.9629 345.462L129.614 254.775L-7.89686e-06 254.775L-1.11366e-05 180.659L129.614 180.659Z" fill="#F6F6F6"/>
// <path d="M314.66 212.823L384.175 282.338L334.521 331.991L215.354 212.824L334.522 93.6557L384.175 143.309L314.66 212.823Z" fill="#F6F6F6"/>
// </svg> */}
//         </div>

//         <div style={{ width: "400px", zIndex: 1 }}>
//           {/* Logo */}
//           <div
//             style={{
//               display: "flex",
//               alignItems: "center",
//               gap: "8px",
//               marginBottom: "48px",
//             }}
//           >
//             {/* <img src={logoImage} alt="Logo" style={{ height: "32px" }} />
//             <span
//               style={{
//                 fontWeight: "800",
//                 fontSize: "14px",
//                 letterSpacing: "1px",
//               }}
//             >
//               AUTOCLAIM
//             </span> */}
//             <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
//               {/* Icon Container */}
//               <div
//                 style={{
//                   position: "relative",
//                   width: "32px",
//                   height: "32px",
//                   display: "flex",
//                   alignItems: "center",
//                   justifyContent: "center",
//                 }}
//               >
//                 {/* Your Blue Spark SVG */}
//                 <div style={{ position: "absolute", inset: 0 }}>
//                   {/* PASTE YOUR BLUE SVG CODE HERE */}
//                   <img src={subtractImage} alt="" />
//                 </div>

//                 {/* Your Black Chevron SVG */}
//                 <div
//                   style={{
//                     position: "absolute",
//                     width: "50%", // Adjust size based on your specific SVG
//                     zIndex: 1,
//                     left: "55%", // Moves the black icon slightly to the right of center as seen in image
//                   }}
//                 >
//                   {/* PASTE YOUR BLACK SVG CODE HERE */}
//                   <img src={unionImage} alt="" />
//                 </div>
//               </div>

//               {/* Brand Text */}
//               <span
//                 style={{
//                   fontSize: "20px",
//                   fontWeight: "bold",
//                   fontFamily: "Inter, sans-serif",
//                   color: "#000",
//                 }}
//               >
//                 AUTOCLAIM
//               </span>
//             </div>
//           </div>

//           <h2
//             style={{
//               fontSize: "28px",
//               fontWeight: "700",
//               marginBottom: "32px",
//             }}
//           >
//             Sign in
//           </h2>

//           <form
//             onSubmit={handleSubmit}
//             style={{ display: "flex", flexDirection: "column", gap: "24px" }}
//           >
//             {/* Email Field */}
//             <div
//               style={{ display: "flex", flexDirection: "column", gap: "8px" }}
//             >
//               <label
//                 style={{ fontSize: "14px", fontWeight: "500", color: "#444" }}
//               >
//                 Email
//               </label>
//               <input
//                 type="email"
//                 placeholder="you@autoclaim.com"
//                 value={email}
//                 onChange={(e) => setEmail(e.target.value)}
//                 required
//                 style={{
//                   padding: "14px 16px",
//                   borderRadius: "6px",
//                   border: "1px solid #ddd",
//                   fontSize: "16px",
//                   outline: "none",
//                 }}
//               />
//             </div>

//             {/* Password Field */}
//             <div
//               style={{ display: "flex", flexDirection: "column", gap: "8px" }}
//             >
//               <label
//                 style={{ fontSize: "14px", fontWeight: "500", color: "#444" }}
//               >
//                 Password
//               </label>
//               <input
//                 type="password"
//                 placeholder="••••••••"
//                 value={password}
//                 onChange={(e) => setPassword(e.target.value)}
//                 required
//                 style={{
//                   padding: "14px 16px",
//                   borderRadius: "6px",
//                   border: "1px solid #ddd",
//                   fontSize: "16px",
//                   outline: "none",
//                 }}
//               />
//             </div>

//             <div style={{ textAlign: "left" }}>
//               <button
//                 type="button"
//                 style={{
//                   background: "none",
//                   border: "none",
//                   color: "#2563eb",
//                   fontSize: "14px",
//                   cursor: "pointer",
//                   padding: 0,
//                 }}
//               >
//                 Forgot Password
//               </button>
//             </div>

//             <button
//               type="submit"
//               disabled={isLoading}
//               style={{
//                 background: "#3543ff", // Match the blue in screenshot
//                 color: "white",
//                 padding: "16px",
//                 borderRadius: "6px",
//                 border: "none",
//                 fontSize: "16px",
//                 fontWeight: "600",
//                 cursor: isLoading ? "not-allowed" : "pointer",
//                 marginTop: "10px",
//                 transition: "background 0.2s",
//               }}
//               onMouseOver={(e) =>
//                 (e.currentTarget.style.background = "#2835e0")
//               }
//               onMouseOut={(e) => (e.currentTarget.style.background = "#3543ff")}
//             >
//               {isLoading ? "Signing in..." : "Login"}
//             </button>
//           </form>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Login;

import { useState } from "react";
import Subtractt from '../../assets/images/Subtractt.svg';
import group from "../../assets/images/Group 2608219.svg";
import background from "../../assets/images/background.png";
import group2 from "../../assets/images/group-2608221.svg";
import subtract1 from "../../assets/images/subtract-1.svg";
import Vector from "../../assets/images/Vector.svg";
import union from "../../assets/images/union.svg";
import { useNavigate } from "react-router-dom";


const login = ()=>{
 const [email, setEmail] = useState("");
 const [password, setPassword] = useState("");
 const [errorMessage, setErrorMessage] = useState(""); // Track login errors
console.log(errorMessage)
 const navigate = useNavigate();

const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    // 1. Check Lockout Status
    const lockoutData = localStorage.getItem(`lockout_${email}`);
    if (lockoutData) {
      const { lockedUntil } = JSON.parse(lockoutData);
      if (Date.now() < lockedUntil) {
        navigate("/account-locked"); // Redirect if still locked
        return;
      } else {
        // Lockout period expired, clear it
        localStorage.removeItem(`lockout_${email}`);
      }
    }

    // 2. Get user data
    const storedUserRaw = localStorage.getItem("activeUser");
    if (!storedUserRaw) {
      setErrorMessage("Invalid Credentials");
      return;
    }
    const storedUser = JSON.parse(storedUserRaw);

    // 3. Validate Credentials
    if (storedUser.email === email && storedUser.password === password) {
      // SUCCESS: Clear any previous failed attempts
      localStorage.removeItem(`attempts_${email}`);
      
      // ... (Your existing OTP generation and fetch logic)
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      localStorage.setItem("pendingOTP", JSON.stringify({
        code: otpCode,
        expiresAt: Date.now() + 5 * 60 * 1000,
        email: email,
      }));

      navigate("/otp");
    } else {
      // FAILURE: Increment attempts
      const currentAttempts = Number(localStorage.getItem(`attempts_${email}`)) || 0;
      const newAttempts = currentAttempts + 1;

      if (newAttempts >= 5) {
        // LOCKOUT: Set for 15 minutes
        const lockDuration = 15 * 60 * 1000;
        const lockedUntil = Date.now() + lockDuration;
        
        localStorage.setItem(`lockout_${email}`, JSON.stringify({ lockedUntil }));
        localStorage.removeItem(`attempts_${email}`); // Reset attempts for next cycle
        
        navigate("/account-locked");
      } else {
        localStorage.setItem(`attempts_${email}`, newAttempts.toString());
        setErrorMessage(`Invalid Credentials. ${5 - newAttempts} attempts remaining.`);
      }
    }
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
          Sign in
        </h2>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col items-start gap-6 w-full"
        >
          {errorMessage && (
            <div className="flex flex-col gap-4 w-full items-center">
              <div className="w-[508px] px-5 py-3 bg-red-50 rounded inline-flex justify-start items-start gap-3 border border-red-100">
                <div className="w-5 h-5 relative flex-shrink-0">
                  <img src={Vector} alt="" />
                </div>
                <div className="text-neutral-700 text-sm font-normal font-['Stack_Sans_Headline']">
                  {errorMessage}
                </div>
              </div>
            </div>
          )}

          {/* Email Input */}
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

          {/* Password Input */}
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

          {/* Error Message Display */}

          <button
            type="button"
            onClick={() => navigate("/forgot-password")}
            className="text-[#0352FD] text-[14px] hover:underline"
          >
            Forgot Password
          </button>

          {/* Corrected Submit Button */}
          {/* <button
            type="submit" // Changed to submit so it triggers handleSubmit
            className="flex items-center justify-center w-full px-10 py-4 bg-[#0352FD] rounded-[4px] text-white font-medium hover:bg-[#0246d9] active:scale-[0.98] transition-all"
          >
            Login
          </button> */}
        </form>
        <button
          // onClick={() => navigate("/otp")}
          type="submit"
          onClick={handleSubmit}
          className="flex items-center justify-center w-[508px] px-10 py-4 bg-[#0352FD] rounded-[4px] gap-[10px] hover:bg-[#0246d9] active:scale-[0.98] transition-all group"
        >
          <span className="text-white text-[16px] font-medium leading-[16px] break-words">
            {" "}
            Login
          </span>
        </button>
      </div>
    </div>
  );
}
export default login;