import React from "react";
import { useNavigate } from "react-router-dom";
import { DashboardShell, VMComplianceCards, VMFleetPerformance, VehicleDonut, VMServicingDue, TaskManagement, VMExpiryZone, SkylineOperations } from "./common";

// ── CAMS Vehicle-Management dashboard (Claims cars) ───────────────────────────
// Same layout as the Skyline VM dashboard; only the scope (context="cams") differs.
const CamsVehicleDashboard: React.FC = () => {
  const navigate = useNavigate();
  return (
    <DashboardShell side="vehicles" context="cams">
      <div className="flex flex-col gap-10">
        <div className="flex justify-end">
          <button type="button" onClick={() => navigate("/vehicle-management/cams/new")} className="px-10 py-4 bg-neutral-900 rounded text-white text-base font-weight-500 leading-4 hover:bg-black">Add Vehicle</button>
        </div>
        <VMComplianceCards context="cams" />
        <VMFleetPerformance period="MTD" context="cams" />
        <div className="flex flex-col lg:flex-row gap-5">
          <VehicleDonut side="vehicles" context="cams" span="flex-1 min-w-0" />
          <VMServicingDue context="cams" />
        </div>
        <TaskManagement module="vehicles_cams" />
        <VMExpiryZone context="cams" />
        <SkylineOperations context="cams" />
      </div>
    </DashboardShell>
  );
};

export default CamsVehicleDashboard;
