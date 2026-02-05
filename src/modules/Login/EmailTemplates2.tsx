const EmailTemplates2 = () => {
    return (
      <div className="w-[640px] bg-white mx-auto my-10 shadow-lg rounded-lg overflow-hidden flex flex-col items-center p-12 font-['Stack_Sans_Headline'] text-center">
        {/* Greeting */}
        <h2 className="text-black text-[20px] font-semibold leading-5 mb-4">
          Hi, John Doe
        </h2>

        {/* Header Message */}
        <p className="text-[#444444] text-[14px] leading-relaxed mb-6">
          You have been added as a user to the <br />
          <span className="font-semibold">Nationwide Assist CRM</span>
        </p>

        {/* Instruction & Link */}
        <div className="flex flex-col items-center gap-3 mb-8">
          <p className="text-[#444444] text-[12px] font-normal max-w-[424px]">
            To activate your account and set your password, please click the
            link below:
          </p>
          <a
            href="https://app.yourproduct.com/auth/verify?email=user@example.com&code=839201"
            className="text-[#0352FD] text-[12px] font-normal break-all hover:underline px-4"
          >
            https://app.yourproduct.com/auth/verify?email=user@example.com&code=839201
          </a>
        </div>

        {/* Security Warning Boxes */}
        <div className="w-[394px] space-y-6 mb-12">
          <p className="text-[#444444] text-[12px] font-normal leading-relaxed">
            For security reasons, this link will expire in 24 hours.
            <br />
            If the link expires, please contact your admin to request a new
            activation email.
          </p>
          <p className="text-[#444444] text-[12px] font-normal italic">
            If you did not expect this invitation, you can safely ignore this
            message.
          </p>
        </div>

        {/* Divider */}
        <div className="w-full h-px bg-[#CCCCCC] mb-8" />

        {/* Sign-off */}
        <div className="mb-12">
          <span className="text-black text-[12px] font-normal">
            Kind regards,
          </span>
          <br />
          <span className="text-black text-[14px] font-semibold">
            Nationwide Assist IT / Systems Team
          </span>
        </div>

        {/* Footer Security Notice */}
        <div className="w-[398px] p-4 bg-gray-50 rounded-md border border-gray-100">
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
export default EmailTemplates2