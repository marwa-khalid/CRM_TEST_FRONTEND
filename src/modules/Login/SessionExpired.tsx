import React from "react";

interface Props {
  onRelogin: () => void;
}

const SessionExpired: React.FC<Props> = ({ onRelogin }) => {
  return (
    <div className="fixed inset-0 z-[9999999] flex items-center justify-center bg-black/50 font-['Stack_Sans_Headline']">
      <div className="bg-white rounded-2xl p-10 flex flex-col items-center gap-6 max-w-sm w-full mx-4 shadow-2xl">
        <div className="flex flex-col items-center gap-3 text-center">
          <h2 className="text-black text-2xl font-weight-600 leading-tight">
            Session Expired
          </h2>
          <p className="text-neutral-600 text-sm font-weight-400 leading-relaxed">
            Your session has expired due to inactivity. Please log in again to
            continue.
          </p>
        </div>
        <button
          onClick={onRelogin}
          className="w-full h-12 bg-blue-600 text-white text-base font-weight-500 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Re-login
        </button>
      </div>
    </div>
  );
};

export default SessionExpired;
