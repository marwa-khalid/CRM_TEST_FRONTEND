import fleetApi from "./fleetApi";

// Fleet notification client — reuses the shared /notifications backend via
// fleetApi (same backend, same Bearer token). No Claims imports. The bell filters
// to Fleet-relevant items so the Fleet feed stays separate from the Claims one.

// Fetch the raw notification feed (backend already returns frontend-shaped rows).
export const getFleetNotifications = async (): Promise<any[]> => {
  try {
    const { data } = await fleetApi.get("/notifications");
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
};

export const markFleetNotificationRead = (id: number) =>
  fleetApi.post(`/notifications/${id}/read`).catch(() => {});
