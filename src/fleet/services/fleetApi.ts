import axios from "axios";

// Fleet's OWN HTTP client — deliberately separate from the Claims axios instance
// (src/services/axiosConfig.ts) so Fleet can be pointed at its own backend later
// by changing one env var, without touching any Claims code. It still shares the
// httpOnly auth cookie via withCredentials, so login/SSO works across both.
const fleetApi = axios.create({
  baseURL:
    import.meta.env.VITE_FLEET_API_URL ||
    import.meta.env.VITE_BACKEND_BASE_URL ||
    "/api",
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

// Attach the shared Bearer token (same one the app stores at login). Read from
// localStorage directly so Fleet doesn't import any Claims code.
//
// NOTE: In production the frontend (netlify.app) and API (railway.app) are
// cross-site, so the httpOnly cookie is a third-party cookie the browser won't
// send — the Bearer header is what actually authenticates. Removing this would
// 401 Fleet on Railway. See project deploy-topology memory before changing.
fleetApi.interceptors.request.use((config) => {
  try {
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch {
    /* ignore */
  }
  return config;
});

export default fleetApi;
