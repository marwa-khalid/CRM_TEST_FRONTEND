import React from "react";

/**
 * Fleet Dashboard — DESIGN PREVIEW ONLY.
 *
 * Renders the static design mockup (public/fleet-dashboard-mockup.html) in an
 * isolated iframe so it shows inside the real Fleet app shell without any of its
 * styles leaking into the app. This is a visual preview for management review —
 * it is NOT wired to live data. Remove this file + its route once the real
 * dashboard is built.
 */
const FleetDashboard: React.FC = () => (
  <iframe
    title="Fleet Dashboard (design preview)"
    src="/fleet-dashboard-mockup.html"
    style={{ display: "block", width: "100%", height: "100vh", border: 0 }}
  />
);

export default FleetDashboard;
