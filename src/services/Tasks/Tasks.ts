import axiosInstance from "../axiosConfig";

export interface TaskFilters {
  search?: string;
  status?: string;
  priority?: string;
  department?: string;
  assigned_user?: string;
  claim_reference?: string;
  vehicle_registration?: string;
  due_from?: string;
  due_to?: string;
  page?: number;
  page_size?: number;
}

export interface TaskPayload {
  title: string;
  description?: string | null;
  assigned_user?: string | null;
  department?: string | null;
  due_date?: string | null;
  due_time?: string | null;
  priority?: string | null;
  status?: string | null;
  claim_id?: number | null;
  claim_reference?: string | null;
  vehicle_registration?: string | null;
  attachment_path?: string | null;
  notes?: string | null;
}

// Drop empty filter values so we don't send blank query params
const clean = (params: Record<string, any>) =>
  Object.fromEntries(
    Object.entries(params).filter(
      ([, v]) => v !== "" && v !== null && v !== undefined,
    ),
  );

export const listTasks = (params: TaskFilters = {}) =>
  axiosInstance.get("/tasks/", { params: clean(params) });

export const getTaskStats = () => axiosInstance.get("/tasks/stats");

export const getVehicleOptions = () => axiosInstance.get("/tasks/vehicle-options");

export const createTask = (payload: TaskPayload) =>
  axiosInstance.post("/tasks/", payload);

export const updateTask = (id: number, payload: Partial<TaskPayload>) =>
  axiosInstance.put(`/tasks/${id}`, payload);

export const deleteTask = (id: number) => axiosInstance.delete(`/tasks/${id}`);

export const uploadTaskFile = (file: File) => {
  const fd = new FormData();
  fd.append("file", file);
  return axiosInstance.post("/tasks/upload", fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

// Returns a short-lived presigned URL for viewing an attachment (S3 key).
export const getAttachmentUrl = (key: string) =>
  axiosInstance.get("/tasks/attachment-url", { params: { key } });
