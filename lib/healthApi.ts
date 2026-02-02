import { BACKEND_ENDPOINTS } from "./config";
import { DeepHealthResponse } from "@/types/health";

export async function fetchDeepHealth(): Promise<DeepHealthResponse> {
  const adminKey = process.env.NEXT_PUBLIC_ADMIN_HEALTH_KEY;

  const res = await fetch(`${BACKEND_ENDPOINTS.apiBaseUrl}/healthCheckDeep`, {
    headers: {
      "x-admin-key": adminKey || "",
    },
  });

  if (!res.ok) {
    throw new Error(`Health check failed: ${res.status} ${res.statusText}`);
  }

  return res.json();
}
