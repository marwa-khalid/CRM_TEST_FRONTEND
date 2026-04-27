import React, { useState } from "react";
import { Mail, Send, Loader2 } from "lucide-react";
import { API_BASE_URL } from "../../services/axiosConfig.ts";
import { useNavigate } from "react-router-dom";

const InviteUser = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const navigate = useNavigate();

  const handleInvite = async () => {
    if (!email) return;

    setLoading(true);
    setStatus(null);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/invite-user`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_name: email,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || data.message || "Failed to send invite");
      }

      setStatus(data.message || "Invitation sent successfully.");
      setEmail("");
    } catch (err: any) {
      console.error(err);
      setStatus(err.message || "Failed to send invite");

      if (err.message === "User already exists.") {
        navigate("/login");
      }
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
          className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-weight-600 text-white transition-all ${
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

        {status && (
          <p
            className={`text-center text-sm font-medium ${
              status.toLowerCase().includes("success") ||
              status.toLowerCase().includes("sent") ||
              status.toLowerCase().includes("pending")
                ? "text-green-600"
                : "text-red-600"
            }`}
          >
            {status}
          </p>
        )}
      </div>
    </div>
  );
};

export default InviteUser;
