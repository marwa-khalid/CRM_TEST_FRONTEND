import React, { useEffect, useState } from "react";
import { Routes, Route, Navigate, useParams, useNavigate } from "react-router-dom";
import AddNewHire from "../pages/AddNewHire/AddNewHire";
import FleetHistory from "../pages/FleetHistory/FleetHistory";
import { getHire } from "../services/hireService";
import FleetActivityLog from "../pages/FleetActivityLog";
import FleetDocumentLibrary from "../pages/FleetDocumentLibrary";
import FleetList from "../pages/FleetList";
import FleetDashboard from "../pages/dashboards/FleetDashboard";
import FleetMap from "../pages/FleetMap";
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
      <Route path="dashboard" element={<FleetDashboard />} />
      <Route path="tasks" element={<FleetTasks />} />
      <Route path="calendar" element={<FleetTasksCalendar />} />
      <Route path="map" element={<FleetMap />} />
    </Route>
    <Route path="activity" element={<FleetActivityLog />} />
    <Route path="document-library" element={<FleetDocumentLibrary />} />
    <Route path="hire/new" element={<AddNewHire />} />
    <Route path="hire/:hireId" element={<AddNewHire />} />
    <Route path="hire/:hireId/history" element={<HireHistoryRoute />} />
    <Route path="*" element={<Navigate to="/fleet" replace />} />
  </Routes>
);

// A fleet hire's History section (scope = fleet_hire). Emails are matched on the
// HIRE reference (e.g. SK70) — that's what Skyline correspondence quotes — and the
// title mirrors the legacy screen: "SK70 (Mr Mohammed Hussain)".
const HireHistoryRoute: React.FC = () => {
  const { hireId } = useParams();
  const navigate = useNavigate();
  const [ref, setRef] = useState("");
  const [hirer, setHirer] = useState("");
  const [driverEmail, setDriverEmail] = useState("");
  useEffect(() => {
    if (hireId) {
      getHire(Number(hireId))
        .then((h) => {
          setRef(h?.fleet_reference || "");
          setHirer(h?.driver_name || "");
          // Correspondent defaults to the hirer's driver email (on hire); empty otherwise.
          setDriverEmail(h?.driver_email || "");
        })
        .catch(() => {});
    }
  }, [hireId]);
  const title = ref ? (hirer ? `${ref} (${hirer})` : ref) : `Hire #${hireId || ""}`;
  return (
    <FleetHistory
      scope="fleet_hire"
      id={hireId || ""}
      title={title}
      emailReference={ref}
      correspondentName={driverEmail}
      backLabel="Back to Hire Details"
      onBack={() => navigate(`/fleet/hire/${hireId}`)}
    />
  );
};

export default FleetRoutes;
