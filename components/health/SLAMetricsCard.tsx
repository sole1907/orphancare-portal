import { ServiceSLAStats } from "@/types/health";

interface SLAMetricsCardProps {
  name: string;
  stats: ServiceSLAStats;
  type?: "infrastructure" | "endpoint";
}

function getUptimeColor(uptimePercentage: number): string {
  if (uptimePercentage >= 99.9) return "text-green-600";
  if (uptimePercentage >= 99) return "text-green-500";
  if (uptimePercentage >= 95) return "text-yellow-500";
  if (uptimePercentage >= 90) return "text-orange-500";
  return "text-red-500";
}

function getUptimeBgColor(uptimePercentage: number): string {
  if (uptimePercentage >= 99.9) return "bg-green-100";
  if (uptimePercentage >= 99) return "bg-green-50";
  if (uptimePercentage >= 95) return "bg-yellow-50";
  if (uptimePercentage >= 90) return "bg-orange-50";
  return "bg-red-50";
}

function formatUptime(uptimePercentage: number): string {
  return uptimePercentage.toFixed(2) + "%";
}

export default function SLAMetricsCard({ name, stats, type = "infrastructure" }: SLAMetricsCardProps) {
  const totalChecks = stats.passCount + stats.failCount;
  const hasData = totalChecks > 0;
  const uptimeColor = getUptimeColor(stats.uptimePercentage);
  const bgColor = getUptimeBgColor(stats.uptimePercentage);

  return (
    <div className={`rounded-lg shadow p-4 ${bgColor}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {type === "infrastructure" ? (
            <span className="text-lg">🏗️</span>
          ) : (
            <span className="text-lg">🔗</span>
          )}
          <h4 className="font-semibold text-gray-800 capitalize">{name}</h4>
        </div>
        <span className={`text-xl font-bold ${uptimeColor}`}>
          {hasData ? formatUptime(stats.uptimePercentage) : "N/A"}
        </span>
      </div>

      {hasData ? (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Checks</span>
            <span className="font-medium">
              <span className="text-green-600">{stats.passCount} passed</span>
              {stats.failCount > 0 && (
                <>
                  {" / "}
                  <span className="text-red-600">{stats.failCount} failed</span>
                </>
              )}
            </span>
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Avg Latency</span>
            <span className="font-medium">{stats.avgLatencyMs}ms</span>
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Max Latency</span>
            <span className="font-medium">{stats.maxLatencyMs}ms</span>
          </div>

          {/* Progress bar for uptime visualization */}
          <div className="mt-2">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${
                  stats.uptimePercentage >= 99
                    ? "bg-green-500"
                    : stats.uptimePercentage >= 95
                    ? "bg-yellow-500"
                    : "bg-red-500"
                }`}
                style={{ width: `${Math.min(stats.uptimePercentage, 100)}%` }}
              />
            </div>
          </div>
        </div>
      ) : (
        <p className="text-sm text-gray-500 italic">No data available</p>
      )}
    </div>
  );
}
