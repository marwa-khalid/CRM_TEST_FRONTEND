import axiosInstance from "../axiosConfig";

export const changePassword = (payload: {
  current_password: string;
  new_password: string;
  confirm_password: string;
}) => axiosInstance.post("/account/change-password", payload);

export const getSessions = () => axiosInstance.get("/account/sessions");

export const registerSession = (payload: {
  ip_address?: string;
  device_info?: string;
}) => axiosInstance.post("/account/sessions", payload);

export const terminateSession = (sessionId: number) =>
  axiosInstance.delete(`/account/sessions/${sessionId}`);

export const logSessionExpiry = () =>
  axiosInstance.post("/account/log-session-expiry");
