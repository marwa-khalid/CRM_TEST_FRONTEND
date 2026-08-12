import React from "react";
import { Routes, Route, Navigate, useParams } from "react-router-dom";
import VehicleManagementShell from "./components/VehicleManagementShell";
import VehicleManagementList from "./pages/VehicleManagementList";
import VehicleManagementRecord from "./pages/VehicleManagementRecord";
// Tasks, Calendar & Dashboard reuse the Skyline components (imported one-way from
// Fleet), scoped to the current side via module="vehicles_<context>".
import FleetTasks from "../fleet/pages/FleetTasks";
import FleetTasksCalendar from "../fleet/pages/FleetTasksCalendar";
import FleetDashboard from "../fleet/pages/FleetDashboard";

// Vehicle Management is split per side — CAMS (Claims cars) and Skyline — mounted at
// /vehicle-management/:context/* (context = "cams" | "skyline"). Both are identical
// apps over independent vehicle pools + tasks/calendar/dashboard, scoped by context.
// It imports Fleet's UI kit one-way but owns all vehicle data/screens/services itself.

// Small wrappers read the :context param and scope the reused Fleet screens to it.
const VMDashboard: React.FC = () => {
  const { context } = useParams();
  return <FleetDashboard side="vehicles" context={context} />;
};
const VMTasks: React.FC = () => {
  const { context } = useParams();
  return <FleetTasks module={`vehicles_${context}`} />;
};
const VMCalendar: React.FC = () => {
  const { context } = useParams();
  return <FleetTasksCalendar module={`vehicles_${context}`} />;
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
    </Route>
    {/* Legacy /vehicle-management (no side chosen) → default to Skyline. */}
    <Route path="*" element={<Navigate to="/vehicle-management/skyline" replace />} />
  </Routes>
);

export default VehicleManagementRoutes;
