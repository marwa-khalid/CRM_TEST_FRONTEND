// Public API of the Fleet module. The host app (App.tsx, SSO) imports only from
// here — never reaches into src/fleet internals, and Fleet never imports Claims.
export { default as FleetRoutes } from "./routes/FleetRoutes";
export { FLEET_PATHS } from "./routes/paths";
