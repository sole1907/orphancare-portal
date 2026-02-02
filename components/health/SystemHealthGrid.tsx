import { DeepHealthResponse } from "@/types/health";
import HealthStatusCard from "./HealthStatusCard";

interface SystemHealthGridProps {
  health: DeepHealthResponse;
}

export default function SystemHealthGrid({ health }: SystemHealthGridProps) {
  const statusColors = {
    healthy: "bg-green-500",
    degraded: "bg-yellow-500",
    unhealthy: "bg-red-500",
  };

  const statusText = {
    healthy: "All Systems Operational",
    degraded: "Some Services Degraded",
    unhealthy: "System Unhealthy",
  };

  return (
    <div className="space-y-6">
      {/* Overall Status Banner */}
      <div
        className={`${statusColors[health.status]} text-white rounded-lg p-4 flex items-center justify-between`}
      >
        <div>
          <h3 className="text-xl font-bold">{statusText[health.status]}</h3>
          <p className="text-sm opacity-90">
            Last checked: {new Date(health.timestamp).toLocaleString()}
          </p>
        </div>
        {health.version && (
          <span className="bg-white/20 px-3 py-1 rounded text-sm">
            v{health.version}
          </span>
        )}
      </div>

      {/* Service Health Cards */}
      <div>
        <h3 className="text-lg font-semibold mb-3 text-gray-800">
          Service Status
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <HealthStatusCard name="Firestore" check={health.checks.firestore} />
          <HealthStatusCard name="Paystack API" check={health.checks.paystack} />
        </div>
      </div>

      {/* Collection Stats */}
      {health.collections && (
        <div>
          <h3 className="text-lg font-semibold mb-3 text-gray-800">
            Collection Statistics
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded shadow p-4 text-center">
              <p className="text-2xl font-bold text-blue-600">
                {health.collections.donors.count.toLocaleString()}
              </p>
              <p className="text-sm text-gray-600">Donors</p>
            </div>
            <div className="bg-white rounded shadow p-4 text-center">
              <p className="text-2xl font-bold text-purple-600">
                {health.collections.orphanages.count.toLocaleString()}
              </p>
              <p className="text-sm text-gray-600">Orphanages</p>
            </div>
            <div className="bg-white rounded shadow p-4 text-center">
              <p className="text-2xl font-bold text-green-600">
                {health.collections.donations.count.toLocaleString()}
              </p>
              <p className="text-sm text-gray-600">Donations</p>
            </div>
            <div className="bg-white rounded shadow p-4 text-center">
              <p className="text-2xl font-bold text-orange-600">
                {health.collections.recurringPlans.count.toLocaleString()}
              </p>
              <p className="text-sm text-gray-600">Recurring Plans</p>
            </div>
          </div>
        </div>
      )}

      {/* Environment Info */}
      {health.environment && (
        <div>
          <h3 className="text-lg font-semibold mb-3 text-gray-800">
            Environment
          </h3>
          <div className="bg-white rounded shadow p-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Region:</span>{" "}
                <span className="font-medium">{health.environment.region}</span>
              </div>
              <div>
                <span className="text-gray-500">Node Version:</span>{" "}
                <span className="font-medium">
                  {health.environment.nodeVersion}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
