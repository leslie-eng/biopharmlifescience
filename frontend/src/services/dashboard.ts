import { request } from "@/services/http";
import type { DashboardOverview, DashboardReports } from "@/types/api";

export const dashboardApi = {
  overview: () => request<DashboardOverview>("/api/dashboard/overview"),
  reports: (since: string) =>
    request<DashboardReports>(`/api/dashboard/reports?since=${encodeURIComponent(since)}`),
};
