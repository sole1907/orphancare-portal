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
