import axiosInstance from "../axiosConfig";

export interface SystemUser {
  id: number;
  email: string;
  name: string; // email-before-@
}

// All tenant users — for @-mention tagging in notes.
export const getUsers = () => axiosInstance.get<SystemUser[]>("/users");

// Notification feed for the logged-in user (mentions, etc.).
export const getNotifications = () => axiosInstance.get("/notifications");
export const markNotificationRead = (id: number) =>
  axiosInstance.post(`/notifications/${id}/read`);
export const markAllNotificationsRead = () =>
  axiosInstance.post("/notifications/read-all");
