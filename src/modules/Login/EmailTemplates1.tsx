const EmailTemplates1 = () => {
    return (
      <div className="w-[640px] min-h-[600px] bg-white mx-auto my-10 shadow-lg rounded-lg overflow-hidden flex flex-col items-center p-12 font-['Stack_Sans_Headline']">
        {/* Greeting */}
        <h2 className="text-black text-[20px] font-semibold leading-5 mb-4">
          Hi, John Doe
        </h2>

        {/* Instructions */}
        <p className="text-[#444444] text-[14px] font-normal text-center leading-relaxed mb-10">
          Your One-Time Password (OTP) for accessing <br />
          your Nationwide Assist CRM account is
        </p>

        {/* OTP Code */}
        <div className="text-[#0352FD] text-[40px] font-semibold tracking-[0.2em] mb-10">
          1 2 3 4 5 6
        </div>

        {/* Expiry/Security Info */}
        <div className="w-[394px] text-center text-[#444444] text-[12px] font-normal leading-relaxed mb-12">
          <p>This OTP is valid for 5 minutes and can only be used once.</p>
          <p className="mt-4">
            If you did not request this OTP, you can safely ignore this email or
            contact your system administrator.
          </p>
        </div>

        {/* Divider */}
        <div className="w-full h-px bg-[#CCCCCC] mb-8" />

        {/* Sign-off */}
        <div className="text-center mb-12">
          <span className="text-black text-[12px] font-normal">
            Kind regards,
          </span>
          <br />
          <span className="text-black text-[14px] font-semibold">
            Nationwide Assist IT / Systems Team
          </span>
        </div>

        {/* Footer Security Notice */}
        <div className="w-[398px] p-4 bg-gray-50 rounded-md text-center">
          <span className="text-[#888888] text-[14px] font-semibold uppercase tracking-wide">
            Security notice:
          </span>
          <br />
          <p className="text-[#888888] text-[12px] font-normal mt-1">
            Never share your login details with anyone. Nationwide Assist will
            never ask for your password by email.
          </p>
        </div>
      </div>
    );
}
export default EmailTemplates1