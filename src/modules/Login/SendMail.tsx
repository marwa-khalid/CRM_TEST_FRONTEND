import React, { useState } from "react";
import { Mail, Send, Loader2 } from "lucide-react"; // Optional: npm install lucide-react

const InviteUser = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null); // 'success' | 'error' | null

  const handleInvite = async () => {
    if (!email) return;
    setLoading(true);
    setStatus(null);

    try {
      // Your Nodemailer backend call
      const response = await fetch(
        "https://emailbackend-ten.vercel.app/send-email",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            recipientEmail: email,
            inviteLink: `https://crmtestfe.netlify.app/auth/reset-password?email=${email}`,
          }),
        },
      );

      if (response.ok) setStatus("success");
      else setStatus("error");
    } catch (err) {
      setStatus("error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-20 p-8 bg-white rounded-xl shadow-sm border border-gray-100 font-sans">
      <div className="flex flex-col items-center mb-6">
        <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mb-3">
          <Mail className="text-[#0352FD] w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-gray-800">
          Invite User to Proclaim
        </h2>
      </div>

      <div className="space-y-4">
        <div className="relative">
          <input
            type="email"
            placeholder="you@autoclaim.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full pl-4 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0352FD] focus:border-transparent transition-all text-gray-700"
          />
        </div>

        <button
          onClick={handleInvite}
          disabled={loading || !email}
          className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-semibold text-white transition-all
            ${
              loading || !email
                ? "bg-gray-300 cursor-not-allowed"
                : "bg-[#0352FD] hover:bg-[#0244d4] active:scale-[0.98]"
            }`}
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <Send className="w-4 h-4" />
              Send Invite
            </>
          )}
        </button>

        {status === "success" && (
          <p className="text-center text-sm text-green-600 font-medium animate-fade-in">
            ✓ Invitation sent to the inbox!
          </p>
        )}
        {status === "error" && (
          <p className="text-center text-sm text-red-600 font-medium">
            × Failed to send. Please try again.
          </p>
        )}
      </div>
    </div>
  );
};

export default InviteUser;
