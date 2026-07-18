import fleetApi from "./fleetApi";

// Fleet-owned task client. Talks to the shared /tasks backend via fleetApi (same
// backend, same Bearer token) — deliberately NO Claims imports, so the Fleet
// slice stays self-contained and extractable. Swap the base URL in fleetApi to
// point Tasks at a different backend later without touching any of this.

export const TASK_STATUSES = ["Pending", "In Progress", "Awaiting Response", "Completed"] as const;
export const TASK_PRIORITIES = ["Low", "Medium", "High"] as const;
export const TASK_DEPARTMENTS = ["Fleet", "Claims", "Recovery", "Customer Service"] as const;

export interface FleetTask {
  id: number;
  title: string;
  description?: string | null;
  assigned_user?: string | null;
  department?: string | null;
  due_date?: string | null; // yyyy-mm-dd
  due_time?: string | null; // HH:mm
  priority?: string | null;
  status?: string | null;
  claim_reference?: string | null;
  vehicle_registration?: string | null;
  notes?: string | null;
  is_overdue?: boolean;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface FleetTaskPayload {
  title: string;
  description?: string | null;
  assigned_user?: string | null;
  department?: string | null;
  due_date?: string | null;
  due_time?: string | null;
  priority?: string | null;
  status?: string | null;
  vehicle_registration?: string | null;
  notes?: string | null;
}

export interface FleetTaskStats {
  total: number;
  pending: number;
  in_progress: number;
  overdue: number;
  completed: number;
}

export interface FleetTaskFilters {
  search?: string;
  status?: string;
  priority?: string;
  department?: string;
  due_from?: string;
  due_to?: string;
  page?: number;
  page_size?: number;
  all_users?: boolean;
}

const clean = (params: Record<string, unknown>) =>
  Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== "" && v !== null && v !== undefined),
  );

// Returns the logged-in user's tasks (the backend scopes to current user unless
// all_users is set). New tasks default to the Fleet department; the UI also
// offers a department filter to widen/narrow the board.
export const listFleetTasks = async (filters: FleetTaskFilters = {}): Promise<FleetTask[]> => {
  try {
    const { data } = await fleetApi.get("/tasks/", { params: clean({ page_size: 500, ...filters }) });
    return Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : [];
  } catch (error) {
    console.warn("Unable to load Fleet tasks.", error);
    return [];
  }
};

export const getFleetTaskStats = async (): Promise<FleetTaskStats> => {
  try {
    const { data } = await fleetApi.get("/tasks/stats");
    return {
      total: data?.total ?? 0,
      pending: data?.pending ?? 0,
      in_progress: data?.in_progress ?? 0,
      overdue: data?.overdue ?? 0,
      completed: data?.completed ?? 0,
    };
  } catch (error) {
    console.warn("Unable to load Fleet task stats.", error);
    return { total: 0, pending: 0, in_progress: 0, overdue: 0, completed: 0 };
  }
};

export const createFleetTask = async (payload: FleetTaskPayload): Promise<FleetTask | null> => {
  try {
    const { data } = await fleetApi.post("/tasks/", { department: "Fleet", ...payload });
    return data ?? null;
  } catch (error) {
    console.warn("Unable to create task.", error);
    return null;
  }
};

export const updateFleetTask = async (
  id: number,
  payload: Partial<FleetTaskPayload>,
): Promise<FleetTask | null> => {
  try {
    const { data } = await fleetApi.put(`/tasks/${id}`, payload);
    return data ?? null;
  } catch (error) {
    console.warn("Unable to update task.", error);
    return null;
  }
};

export const deleteFleetTask = async (id: number): Promise<boolean> => {
  try {
    await fleetApi.delete(`/tasks/${id}`);
    return true;
  } catch (error) {
    console.warn("Unable to delete task.", error);
    return false;
  }
};
