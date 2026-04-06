import axios from "axios";

export const API_BASE_URL ="https://noninflected-saul-stratiformis.ngrok-free.dev";
// export const API_BASE_URL ="http://localhost:8080";


const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
    "ngrok-skip-browser-warning": "69420",
  },
  timeout: 10000000000,
});

axiosInstance.interceptors.request.use(
    (config) => {
        const token =
          localStorage.getItem("access_token") ||
          sessionStorage.getItem("access_token");
        if (token) {
            config.headers["Authorization"] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
        
            try {
                const refreshToken = localStorage.getItem("refresh_token");
                if (!refreshToken) throw new Error("No refresh token");
        
                const { data } = await axios.post(`${API_BASE_URL}auth/refresh`, { refresh_token: refreshToken });
        
                localStorage.setItem("access_token", data.access_token);
                localStorage.setItem("refresh_token", data.refresh_token);
        
                axiosInstance.defaults.headers["Authorization"] = `Bearer ${data.access_token}`;
                originalRequest.headers["Authorization"] = `Bearer ${data.access_token}`;
        
                return await axiosInstance(originalRequest);
            } catch (err) {
                console.error("Token refresh failed:", err);
                // localStorage.clear();
                window.location.href = "/login";
                return Promise.reject(err);
            }
        }
        
        console.error("API Error:", error.response?.data?.message || error.message);
        return Promise.reject(error);
    }
);
export default axiosInstance;