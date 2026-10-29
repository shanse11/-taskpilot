import { apiRequest } from "./api";

export type ProjectStatus = "active" | "archived";
export type TaskStatus = "todo" | "in_progress" | "done";
export type TaskPriority = "low" | "medium" | "high";

export interface Project {
  id: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  createdAt: string;
  updatedAt: string;
  _count: { tasks: number };
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate: string | null;
  position: number;
  createdAt: string;
  updatedAt: string;
  project?: Pick<Project, "id" | "name" | "status">;
}

export interface ProjectInput {
  name: string;
  description?: string | null;
  status?: ProjectStatus;
}

export interface TaskInput {
  title: string;
  description?: string | null;
  priority?: TaskPriority;
  status?: TaskStatus;
  dueDate?: string | null;
  position?: number;
}

export interface TaskFilters {
  status?: TaskStatus | "";
  priority?: TaskPriority | "";
  q?: string;
  sort?: string;
}

export const projectsApi = {
  list: () => apiRequest<{ projects: Project[] }>("/projects"),
  get: (id: string) => apiRequest<{ project: Project; taskSummary: { total: number; todo: number; in_progress: number; done: number } }>(`/projects/${id}`),
  create: (input: ProjectInput) => apiRequest<{ project: Project }>("/projects", { method: "POST", body: JSON.stringify(input) }),
  update: (id: string, input: ProjectInput) => apiRequest<{ project: Project }>(`/projects/${id}`, { method: "PATCH", body: JSON.stringify(input) }),
  delete: (id: string) => apiRequest<void>(`/projects/${id}`, { method: "DELETE" }),
};

export const tasksApi = {
  list: (projectId: string, filters: TaskFilters = {}) => {
    const query = new URLSearchParams();
    if (filters.status) query.set("status", filters.status);
    if (filters.priority) query.set("priority", filters.priority);
    if (filters.q?.trim()) query.set("q", filters.q.trim());
    if (filters.sort) query.set("sort", filters.sort);
    const suffix = query.size > 0 ? `?${query.toString()}` : "";
    return apiRequest<{ tasks: Task[] }>(`/projects/${projectId}/tasks${suffix}`);
  },
  create: (projectId: string, input: TaskInput) => apiRequest<{ task: Task }>(`/projects/${projectId}/tasks`, { method: "POST", body: JSON.stringify(input) }),
  update: (id: string, input: TaskInput) => apiRequest<{ task: Task }>(`/tasks/${id}`, { method: "PATCH", body: JSON.stringify(input) }),
  updateStatus: (id: string, status: TaskStatus, position: number) => apiRequest<{ task: Task }>(`/tasks/${id}/status`, { method: "PATCH", body: JSON.stringify({ status, position }) }),
  delete: (id: string) => apiRequest<void>(`/tasks/${id}`, { method: "DELETE" }),
};
