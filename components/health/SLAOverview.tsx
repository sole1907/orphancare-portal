"use client";

import { useState, useEffect } from "react";
import { SLASummary, WindowType } from "@/types/health";
import { fetchSlaMetrics } from "@/lib/healthApi";
import SLAMetricsCard from "./SLAMetricsCard";

const WINDOW_OPTIONS: { value: WindowType; label: string }[] = [
  { value: "24h", label: "Last 24 Hours" },
  { value: "7d", label: "Last 7 Days" },
  { value: "30d", label: "Last 30 Days" },
  { value: "90d", label: "Last 90 Days" },
];

function getOverallStatusColor(uptimePercentage: number): string {
  if (uptimePercentage >= 99.9) return "bg-green-500";
  if (uptimePercentage >= 99) return "bg-green-400";
  if (uptimePercentage >= 95) return "bg-yellow-500";
  if (uptimePercentage >= 90) return "bg-orange-500";
  return "bg-red-500";
}

function getStatusText(uptimePercentage: number): string {
  if (uptimePercentage >= 99.9) return "Excellent";
  if (uptimePercentage >= 99) return "Good";
  if (uptimePercentage >= 95) return "Fair";
  if (uptimePercentage >= 90) return "Degraded";
  return "Critical";
}

export default function SLAOverview() {
  const [selectedWindow, setSelectedWindow] = useState<WindowType>("24h");
  const [slaData, setSlaData] = useState<SLASummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadSlaMetrics() {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchSlaMetrics(selectedWindow);
        setSlaData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load SLA metrics");
      } finally {
        setLoading(false);
      }
    }

    loadSlaMetrics();
  }, [selectedWindow]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-24 bg-gray-200 rounded"></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-red-600 text-center">
          <p className="font-semibold">Error loading SLA metrics</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      </div>
    );
  }

  const hasData = slaData && slaData.totalChecks > 0;
  const endpointNames = slaData ? Object.keys(slaData.endpoints) : [];

  return (
    <div className="bg-white rounded-lg shadow p-6 space-y-6">
      {/* Header with Time Window Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-gray-800">SLA Metrics</h3>
          {slaData?.lastUpdated && (
            <p className="text-sm text-gray-500">
              Last updated: {new Date(slaData.lastUpdated).toLocaleString()}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          {WINDOW_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => setSelectedWindow(option.value)}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                selectedWindow === option.value
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Overall Uptime Banner */}
      {hasData ? (
        <div
          className={`rounded-lg p-6 text-white ${getOverallStatusColor(
            slaData.overallUptimePercentage
          )}`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Overall System Uptime</p>
              <p className="text-4xl font-bold">
                {slaData.overallUptimePercentage.toFixed(2)}%
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-semibold">
                {getStatusText(slaData.overallUptimePercentage)}
              </p>
              <p className="text-sm opacity-90">
                {slaData.totalChecks} total checks
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-lg p-6 bg-gray-100 text-gray-600 text-center">
          <p className="font-semibold">No SLA data available yet</p>
          <p className="text-sm mt-1">
            Data will be populated after the first scheduled health check runs.
          </p>
        </div>
      )}

      {/* Infrastructure Section */}
      {hasData && (
        <>
          <div>
            <h4 className="text-lg font-semibold text-gray-700 mb-3">
              Infrastructure Services
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SLAMetricsCard
                name="Firestore"
                stats={slaData.infrastructure.firestore}
                type="infrastructure"
              />
              <SLAMetricsCard
                name="Paystack"
                stats={slaData.infrastructure.paystack}
                type="infrastructure"
              />
            </div>
          </div>

          {/* Endpoints Section */}
          {endpointNames.length > 0 && (
            <div>
              <h4 className="text-lg font-semibold text-gray-700 mb-3">
                API Endpoints
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {endpointNames.map((name) => (
                  <SLAMetricsCard
                    key={name}
                    name={name}
                    stats={slaData.endpoints[name]}
                    type="endpoint"
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
