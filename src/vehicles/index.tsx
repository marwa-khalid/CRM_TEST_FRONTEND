import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import VehicleManagementShell from "./components/VehicleManagementShell";
import VehicleManagementList from "./pages/VehicleManagementList";
import VehicleManagementRecord from "./pages/VehicleManagementRecord";
// Tasks & Calendar reuse the Skyline components (imported one-way from Fleet),
// scoped to module="vehicles" so they show an independent list/calendar/feed.
import FleetTasks from "../fleet/pages/FleetTasks";
import FleetTasksCalendar from "../fleet/pages/FleetTasksCalendar";

// Standalone Vehicle Management module — the shared vehicle pool. Mounted at
// /vehicle-management/* from App.tsx. Self-contained (src/vehicles); it imports
// Fleet's UI kit one-way but owns all vehicle data/screens/services itself.
// Listing / Tasks / Calendar share the shell (left nav); the vehicle file editor
// is a full-screen wizard (its own FleetTopBar + stepper), so it sits outside.
const VehicleManagementRoutes: React.FC = () => (
  <Routes>
    <Route element={<VehicleManagementShell />}>
      <Route index element={<VehicleManagementList />} />
      <Route path="tasks" element={<FleetTasks module="vehicles" />} />
      <Route path="calendar" element={<FleetTasksCalendar module="vehicles" />} />
    </Route>
    <Route path="new" element={<VehicleManagementRecord />} />
    <Route path=":recordId" element={<VehicleManagementRecord />} />
    <Route path="*" element={<Navigate to="/vehicle-management" replace />} />
  </Routes>
);

export default VehicleManagementRoutes;
