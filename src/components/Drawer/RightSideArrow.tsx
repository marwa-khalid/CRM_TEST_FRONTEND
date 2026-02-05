import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface RightSideArrowProps {
  onClick: () => void;
}

const RightSideArrow: React.FC<RightSideArrowProps> = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
        className="fixed right-4 bottom-4 z-50 p-3 rounded-full text-white shadow-lg bg-[#414651] hover:bg-[#33373e] transition-colors"
    >
      <ChevronLeft className="h-6 w-6" />
    </button>
  );
};

export default RightSideArrow;
