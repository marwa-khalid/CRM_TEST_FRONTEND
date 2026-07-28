import React from "react";

// Outlook logo — shown in the header of Fleet email modals.
const OutlookIcon: React.FC<{ className?: string }> = ({ className = "w-7 h-7" }) => (
  <svg viewBox="0 0 32 32" className={className} aria-hidden>
    <rect x="12" y="6" width="16" height="20" rx="2.4" fill="#0A64AD" />
    <rect x="14" y="8" width="12" height="7" rx="1.2" fill="#28A8EA" />
    <rect x="14" y="17" width="12" height="7" rx="1.2" fill="#0078D4" />
    <path d="M12 12.2h17.2v12.6c0 .66-.54 1.2-1.2 1.2H12V12.2Z" fill="#0A64AD" />
    <path d="m12.2 13.1 7.9 5.2 8.9-6.1v12.5c0 .72-.58 1.3-1.3 1.3H13.5c-.72 0-1.3-.58-1.3-1.3V13.1Z" fill="#50D9FF" />
    <path d="m12.2 25.1 6.9-6.2 2.1 1.4 7.6-7.7v12.1c0 .72-.58 1.3-1.3 1.3H13.5c-.52 0-.98-.31-1.18-.76l-.12-.14Z" fill="#0078D4" />
    <rect x="3" y="9" width="14" height="14" rx="2" fill="#0078D4" />
    <path d="M6.2 16c0-3.02 1.64-5.02 4.04-5.02 2.38 0 3.94 1.95 3.94 4.9 0 3.05-1.61 5.14-4.03 5.14-2.38 0-3.95-2-3.95-5.02Zm2.1-.04c0 2.03.72 3.26 1.9 3.26 1.17 0 1.88-1.21 1.88-3.25 0-2-.72-3.18-1.9-3.18-1.15 0-1.88 1.2-1.88 3.17Z" fill="white" />
  </svg>
);

export default OutlookIcon;
