export interface ServiceCheck {
  status: "pass" | "fail";
  latencyMs: number;
  error?: string;
}

export interface HealthCheckResponse {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  version?: string;
  checks: {
    firestore: ServiceCheck;
    paystack: ServiceCheck;
  };
}

export interface DeepHealthResponse extends HealthCheckResponse {
  collections: {
    donors: { count: number };
    orphanages: { count: number };
    donations: { count: number };
    recurringPlans: { count: number };
  };
  environment: {
    region: string;
    nodeVersion: string;
  };
}

// SLA Metrics Types
export interface ServiceSLAStats {
  passCount: number;
  failCount: number;
  uptimePercentage: number;
  avgLatencyMs: number;
  maxLatencyMs: number;
}

export type WindowType = "24h" | "7d" | "30d" | "90d";

export interface SLASummary {
  windowType: WindowType;
  lastUpdated: string | null;
  totalChecks: number;
  infrastructure: {
    firestore: ServiceSLAStats;
    paystack: ServiceSLAStats;
  };
  endpoints: Record<string, ServiceSLAStats>;
  overallUptimePercentage: number;
  message?: string;
}

export interface AllSLAMetrics {
  metrics: Record<WindowType, SLASummary>;
  availableWindows: WindowType[];
}

// SLA Config Types
export interface SlaEndpoint {
  name: string;
  path: string;
  method: "GET" | "POST" | "PUT" | "DELETE";
  requiresAuth?: boolean;
  testPayload?: Record<string, unknown>;
}

export interface SlaConfig {
  endpoints: SlaEndpoint[];
  updatedAt?: string;
}
