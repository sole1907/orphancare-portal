import { BACKEND_ENDPOINTS } from "./config";
import {
  DeepHealthResponse,
  SLASummary,
  AllSLAMetrics,
  SlaConfig,
  SlaEndpoint,
  WindowType,
} from "@/types/health";

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

/**
 * Fetch SLA metrics for a specific time window
 */
export async function fetchSlaMetrics(window: WindowType = "24h"): Promise<SLASummary> {
  const adminKey = process.env.NEXT_PUBLIC_ADMIN_HEALTH_KEY;

  const res = await fetch(
    `${BACKEND_ENDPOINTS.apiBaseUrl}/getSlaMetrics?window=${window}`,
    {
      headers: {
        "x-admin-key": adminKey || "",
      },
    }
  );

  if (!res.ok) {
    throw new Error(`Failed to fetch SLA metrics: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

/**
 * Fetch all SLA metrics for all time windows
 */
export async function fetchAllSlaMetrics(): Promise<AllSLAMetrics> {
  const adminKey = process.env.NEXT_PUBLIC_ADMIN_HEALTH_KEY;

  const res = await fetch(`${BACKEND_ENDPOINTS.apiBaseUrl}/getAllSlaMetrics`, {
    headers: {
      "x-admin-key": adminKey || "",
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch all SLA metrics: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

/**
 * Get the current SLA endpoint configuration
 */
export async function getSlaConfig(): Promise<SlaConfig> {
  const adminKey = process.env.NEXT_PUBLIC_ADMIN_HEALTH_KEY;

  const res = await fetch(`${BACKEND_ENDPOINTS.apiBaseUrl}/getSlaConfig`, {
    headers: {
      "x-admin-key": adminKey || "",
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch SLA config: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

/**
 * Update the SLA endpoint configuration
 */
export async function updateSlaConfig(endpoints: SlaEndpoint[]): Promise<SlaConfig> {
  const adminKey = process.env.NEXT_PUBLIC_ADMIN_HEALTH_KEY;

  const res = await fetch(`${BACKEND_ENDPOINTS.apiBaseUrl}/updateSlaConfig`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "x-admin-key": adminKey || "",
    },
    body: JSON.stringify({ endpoints }),
  });

  if (!res.ok) {
    throw new Error(`Failed to update SLA config: ${res.status} ${res.statusText}`);
  }

  return res.json();
}
