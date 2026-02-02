import { ServiceCheck } from "@/types/health";

interface HealthStatusCardProps {
  name: string;
  check: ServiceCheck;
}

export default function HealthStatusCard({ name, check }: HealthStatusCardProps) {
  const isHealthy = check.status === "pass";

  return (
    <div className="bg-white rounded shadow p-4">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-semibold text-gray-800">{name}</h4>
        <span
          className={`px-2 py-1 rounded text-sm font-medium ${
            isHealthy
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {isHealthy ? "Healthy" : "Unhealthy"}
        </span>
      </div>
      <div className="text-sm text-gray-600">
        <p>Latency: {check.latencyMs}ms</p>
        {check.error && (
          <p className="text-red-600 mt-1">Error: {check.error}</p>
        )}
      </div>
    </div>
  );
}
