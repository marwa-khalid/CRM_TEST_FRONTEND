import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import AddNewHire from "../pages/AddNewHire/AddNewHire";
import FleetActivityLog from "../pages/FleetActivityLog";
import FleetDocumentLibrary from "../pages/FleetDocumentLibrary";
import FleetList from "../pages/FleetList";
import FleetShell from "../components/FleetShell";
import FleetTasks from "../pages/FleetTasks";
import FleetTasksCalendar from "../pages/FleetTasksCalendar";

// All Fleet screens mount under /fleet/* (see App.tsx). Self-contained — the host
// app only knows about <FleetRoutes />; adding screens never touches App.tsx.
// Records / Tasks / Calendar share the FleetShell (left nav); the hire wizard and
// full-screen tools stay outside it so they keep their own layouts.
const FleetRoutes: React.FC = () => (
  <Routes>
    <Route element={<FleetShell />}>
      <Route index element={<FleetList />} />
      <Route path="tasks" element={<FleetTasks />} />
      <Route path="calendar" element={<FleetTasksCalendar />} />
    </Route>
    <Route path="activity" element={<FleetActivityLog />} />
    <Route path="document-library" element={<FleetDocumentLibrary />} />
    <Route path="hire/new" element={<AddNewHire />} />
    <Route path="hire/:hireId" element={<AddNewHire />} />
    <Route path="*" element={<Navigate to="/fleet" replace />} />
  </Routes>
);

export default FleetRoutes;
