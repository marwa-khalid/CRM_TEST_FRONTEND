import React, { useEffect, useState } from "react";
import { Routes, Route, Navigate, useParams, useNavigate } from "react-router-dom";
import VehicleManagementShell from "./components/VehicleManagementShell";
import VehicleManagementList from "./pages/VehicleManagementList";
import VehicleManagementRecord from "./pages/VehicleManagementRecord";
import { getVehicleRecord } from "./services/vehicleRecordService";
import FleetHistory from "../fleet/pages/FleetHistory/FleetHistory";
// Tasks, Calendar & Dashboard reuse the Skyline components (imported one-way from
// Fleet), scoped to the current side via module="vehicles_<context>".
import FleetTasks from "../fleet/pages/FleetTasks";
import FleetTasksCalendar from "../fleet/pages/FleetTasksCalendar";
import CamsVehicleDashboard from "../fleet/pages/dashboards/CamsVehicleDashboard";
import SkylineVehicleDashboard from "../fleet/pages/dashboards/SkylineVehicleDashboard";

// Vehicle Management is split per side — CAMS (Claims cars) and Skyline — mounted at
// /vehicle-management/:context/* (context = "cams" | "skyline"). Both are identical
// apps over independent vehicle pools + tasks/calendar/dashboard, scoped by context.
// It imports Fleet's UI kit one-way but owns all vehicle data/screens/services itself.

// Small wrappers read the :context param and scope the reused Fleet screens to it.
const VMDashboard: React.FC = () => {
  const { context } = useParams();
  // Each VM side is its own dashboard file now; pick by the :context route param.
  return context === "cams" ? <CamsVehicleDashboard /> : <SkylineVehicleDashboard />;
};
const VMTasks: React.FC = () => {
  const { context } = useParams();
  return <FleetTasks module={`vehicles_${context}`} />;
};
const VMCalendar: React.FC = () => {
  const { context } = useParams();
  return <FleetTasksCalendar module={`vehicles_${context}`} />;
};
// A VM vehicle's History section (scope = vm_cams | vm_skyline). The title shows the
// vehicle's registration number (matching the record edit screen), not a raw id.
const VMHistoryRoute: React.FC = () => {
  const { context, recordId } = useParams();
  const navigate = useNavigate();
  const scope = context === "cams" ? "vm_cams" : "vm_skyline";
  const [reg, setReg] = useState("");
  useEffect(() => {
    if (recordId) getVehicleRecord(Number(recordId)).then((v) => setReg(v?.registration_number || "")).catch(() => {});
  }, [recordId]);
  return (
    <FleetHistory
      scope={scope}
      id={recordId || ""}
      title={reg || `Vehicle ${recordId || ""}`}
      emailReference={reg}
      backLabel="Back to Vehicle Details"
      onBack={() => navigate(`/vehicle-management/${context}/${recordId}`)}
    />
  );
};

const VehicleManagementRoutes: React.FC = () => (
  <Routes>
    <Route path=":context">
      <Route element={<VehicleManagementShell />}>
        <Route index element={<VehicleManagementList />} />
        <Route path="dashboard" element={<VMDashboard />} />
        <Route path="tasks" element={<VMTasks />} />
        <Route path="calendar" element={<VMCalendar />} />
      </Route>
      {/* The vehicle-file editor is a full-screen wizard, outside the shell. */}
      <Route path="new" element={<VehicleManagementRecord />} />
      <Route path=":recordId" element={<VehicleManagementRecord />} />
      <Route path=":recordId/history" element={<VMHistoryRoute />} />
    </Route>
    {/* Legacy /vehicle-management (no side chosen) → default to Skyline. */}
    <Route path="*" element={<Navigate to="/vehicle-management/skyline" replace />} />
  </Routes>
);

export default VehicleManagementRoutes;
