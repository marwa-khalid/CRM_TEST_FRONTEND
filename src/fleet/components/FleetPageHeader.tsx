import React from "react";
import SearchIcon from "../assets/listingpage/search.svg";
import FleetNotificationBell from "./FleetNotificationBell";

// Shared Fleet page topbar — title on the left, search + notification bell on
// the right. Used across the Fleet listing, Tasks and Calendar so they match.
const FleetPageHeader: React.FC<{ title: string; module?: string }> = ({ title, module }) => (
  <div className="h-20 px-4 sm:px-6 lg:px-10 flex items-center justify-between border-b border-[#eee]">
    <h1 className="text-black text-2xl font-semibold">{title}</h1>
    <div className="flex items-center gap-6">
      <img src={SearchIcon} alt="Search" className="w-5 h-5" />
      <FleetNotificationBell module={module} />
    </div>
  </div>
);

export default FleetPageHeader;
