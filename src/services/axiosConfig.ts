import axios from "axios";

const rawApiBaseUrl =
  import.meta.env.VITE_BACKEND_BASE_URL2 ||
  import.meta.env.VITE_BACKEND_BASE_URL ||
  "";

export const API_BASE_URL = String(rawApiBaseUrl).trim().replace(/\/+$/, "");

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  // Send/receive the httpOnly auth cookie — the access token is no longer kept
  // in localStorage (XSS-safe). The API's CORS must allow this origin with
  // credentials (allow_origins must be explicit, not "*").
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
    "ngrok-skip-browser-warning": "69420",
  },
  timeout: 30000,
});

// Auth/public pages where a 401 should NOT bounce to /login.
const PUBLIC_PATHS = [
  "/login",
  "/otp",
  "/forgot-password",
  "/forgot-password2",
  "/auth/reset-password",
  "/auth/reset-password2",
  "/account-locked",
  "/single-signon",
  "/single-signon2",
  "/email-templates1",
  "/email-templates2",
  "/email-templates3",
  "/send-mail",
];

const isPublicPath = (path: string) =>
  path === "/" ||
  path.startsWith("/questionnaire/") ||
  PUBLIC_PATHS.some((p) => path === p || path.startsWith(`${p}/`));

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const path = window.location.pathname;
    if (status === 401 && !isPublicPath(path)) {
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

export default axiosInstance;
