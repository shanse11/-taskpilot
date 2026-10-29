import { apiRequest, getStoredToken } from "./api";

export interface DashboardStats {
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  completionRate: number;
  priorityDistribution: { low: number; medium: number; high: number };
  statusDistribution: { todo: number; in_progress: number; done: number };
}

export const dashboardApi = {
  stats: (projectId?: string) => {
    const query = projectId ? `?projectId=${encodeURIComponent(projectId)}` : "";
    return apiRequest<{ stats: DashboardStats }>(`/dashboard/stats${query}`);
  },
};

export async function downloadTasksCsv(): Promise<void> {
  const headers = new Headers();
  const token = getStoredToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch("/api/export/tasks.csv", { headers, credentials: "include" });
  if (!response.ok) {
    const error = (await response.json().catch(() => ({}))) as { message?: string };
    throw new Error(error.message || `导出失败 (${response.status})`);
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "taskpilot-tasks.csv";
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}
