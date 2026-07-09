import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import AddNewHire from "../pages/AddNewHire/AddNewHire";

// All Fleet screens mount under /fleet/* (see App.tsx). Self-contained — the host
// app only knows about <FleetRoutes />; adding screens never touches App.tsx.
const FleetRoutes: React.FC = () => (
  <Routes>
    <Route index element={<AddNewHire />} />
    <Route path="hire/new" element={<AddNewHire />} />
    <Route path="*" element={<Navigate to="/fleet" replace />} />
  </Routes>
);

export default FleetRoutes;
