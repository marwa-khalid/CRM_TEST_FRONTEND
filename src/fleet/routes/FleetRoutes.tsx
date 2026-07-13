import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import AddNewHire from "../pages/AddNewHire/AddNewHire";
import FleetActivityLog from "../pages/FleetActivityLog";
import FleetDocumentLibrary from "../pages/FleetDocumentLibrary";
import FleetList from "../pages/FleetList";

// All Fleet screens mount under /fleet/* (see App.tsx). Self-contained — the host
// app only knows about <FleetRoutes />; adding screens never touches App.tsx.
const FleetRoutes: React.FC = () => (
  <Routes>
    <Route index element={<FleetList />} />
    <Route path="activity" element={<FleetActivityLog />} />
    <Route path="document-library" element={<FleetDocumentLibrary />} />
    <Route path="hire/new" element={<AddNewHire />} />
    <Route path="hire/:hireId" element={<AddNewHire />} />
    <Route path="*" element={<Navigate to="/fleet" replace />} />
  </Routes>
);

export default FleetRoutes;
