// lib/dashboardApi.ts
import { BACKEND_ENDPOINTS } from "./config";
import { auth } from "./firebase";
import { DashboardStats } from "@/types/dashboard";
import { DateRange } from "@/types/filters";

export async function fetchDashboardStats(
  dateRange: DateRange,
  orphanageId?: string
): Promise<DashboardStats> {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");

  const token = await user.getIdToken();

  const res = await fetch(`${BACKEND_ENDPOINTS.apiBaseUrl}/getDashboardStats`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ dateRange, orphanageId }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to fetch dashboard stats: ${errorText}`);
  }

  const json = await res.json();
  return json.data;
}
