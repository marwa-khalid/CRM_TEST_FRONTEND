import React from "react";
import { useNavigate } from "react-router-dom";
import { DashboardShell, VMComplianceCards, VMFleetPerformance, VehicleDonut, VMServicingDue, TaskManagement, VMExpiryZone, SkylineOperations } from "./common";

// ── Skyline Vehicle-Management dashboard ──────────────────────────────────────
// Same layout as the CAMS VM dashboard; only the scope (context="skyline") differs.
const SkylineVehicleDashboard: React.FC = () => {
  const navigate = useNavigate();
  return (
    <DashboardShell side="vehicles" context="skyline">
      <div className="flex flex-col gap-10">
        <div className="flex justify-end">
          <button type="button" onClick={() => navigate("/vehicle-management/skyline/new")} className="px-10 py-4 bg-neutral-900 rounded text-white text-base font-weight-500 leading-4 hover:bg-black">Add Vehicle</button>
        </div>
        <VMComplianceCards context="skyline" />
        <VMFleetPerformance period="MTD" context="skyline" />
        <div className="flex flex-col lg:flex-row gap-5">
          <VehicleDonut side="vehicles" context="skyline" span="flex-1 min-w-0" />
          <VMServicingDue context="skyline" />
        </div>
        <TaskManagement module="vehicles_skyline" />
        <VMExpiryZone context="skyline" />
        <SkylineOperations context="skyline" />
      </div>
    </DashboardShell>
  );
};

export default SkylineVehicleDashboard;
