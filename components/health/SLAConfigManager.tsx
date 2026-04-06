"use client";

import { useState, useEffect } from "react";
import { SlaEndpoint, SlaConfig } from "@/types/health";
import { getSlaConfig, updateSlaConfig } from "@/lib/healthApi";

const HTTP_METHODS = ["GET", "POST", "PUT", "DELETE"] as const;

interface NewEndpoint {
  name: string;
  path: string;
  method: "GET" | "POST" | "PUT" | "DELETE";
  requiresAuth: boolean;
}

const defaultNewEndpoint: NewEndpoint = {
  name: "",
  path: "",
  method: "GET",
  requiresAuth: false,
};

export default function SLAConfigManager() {
  const [config, setConfig] = useState<SlaConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newEndpoint, setNewEndpoint] = useState<NewEndpoint>(defaultNewEndpoint);

  useEffect(() => {
    loadConfig();
  }, []);

  async function loadConfig() {
    setLoading(true);
    setError(null);
    try {
      const data = await getSlaConfig();
      setConfig(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load config");
    } finally {
      setLoading(false);
    }
  }

  async function handleRemoveEndpoint(index: number) {
    if (!config) return;

    const updatedEndpoints = config.endpoints.filter((_, i) => i !== index);
    await saveEndpoints(updatedEndpoints);
  }

  async function handleAddEndpoint() {
    if (!config) return;
    if (!newEndpoint.name || !newEndpoint.path) {
      setError("Name and path are required");
      return;
    }

    // Ensure path starts with /
    const path = newEndpoint.path.startsWith("/")
      ? newEndpoint.path
      : `/${newEndpoint.path}`;

    const endpoint: SlaEndpoint = {
      name: newEndpoint.name,
      path,
      method: newEndpoint.method,
      ...(newEndpoint.requiresAuth && { requiresAuth: true }),
    };

    const updatedEndpoints = [...config.endpoints, endpoint];
    await saveEndpoints(updatedEndpoints);

    // Reset form
    setNewEndpoint(defaultNewEndpoint);
    setShowAddForm(false);
  }

  async function saveEndpoints(endpoints: SlaEndpoint[]) {
    setSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const result = await updateSlaConfig(endpoints);
      setConfig({ endpoints: result.endpoints, updatedAt: result.updatedAt });
      setSuccessMessage("Configuration saved successfully");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save config");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="space-y-2">
            <div className="h-12 bg-gray-200 rounded"></div>
            <div className="h-12 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-gray-800">SLA Endpoint Configuration</h3>
          {config?.updatedAt && (
            <p className="text-sm text-gray-500">
              Last updated: {new Date(config.updatedAt).toLocaleString()}
            </p>
          )}
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          {showAddForm ? "Cancel" : "Add Endpoint"}
        </button>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
          {successMessage}
        </div>
      )}

      {/* Add Endpoint Form */}
      {showAddForm && (
        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
          <h4 className="font-semibold text-gray-700 mb-4">Add New Endpoint</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name
              </label>
              <input
                type="text"
                value={newEndpoint.name}
                onChange={(e) =>
                  setNewEndpoint({ ...newEndpoint, name: e.target.value })
                }
                placeholder="e.g., getFAQs"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Path
              </label>
              <input
                type="text"
                value={newEndpoint.path}
                onChange={(e) =>
                  setNewEndpoint({ ...newEndpoint, path: e.target.value })
                }
                placeholder="e.g., /getFAQs"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Method
              </label>
              <select
                value={newEndpoint.method}
                onChange={(e) =>
                  setNewEndpoint({
                    ...newEndpoint,
                    method: e.target.value as typeof newEndpoint.method,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {HTTP_METHODS.map((method) => (
                  <option key={method} value={method}>
                    {method}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={newEndpoint.requiresAuth}
                  onChange={(e) =>
                    setNewEndpoint({
                      ...newEndpoint,
                      requiresAuth: e.target.checked,
                    })
                  }
                  className="mr-2 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">
                  Requires Authentication (will be skipped in checks)
                </span>
              </label>
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <button
              onClick={handleAddEndpoint}
              disabled={saving || !newEndpoint.name || !newEndpoint.path}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? "Saving..." : "Add Endpoint"}
            </button>
          </div>
        </div>
      )}

      {/* Endpoints List */}
      <div>
        <h4 className="font-semibold text-gray-700 mb-3">
          Tracked Endpoints ({config?.endpoints.length || 0})
        </h4>
        {config?.endpoints.length === 0 ? (
          <p className="text-gray-500 text-center py-4">
            No endpoints configured. Add one to start tracking.
          </p>
        ) : (
          <div className="space-y-2">
            {config?.endpoints.map((endpoint, index) => (
              <div
                key={`${endpoint.name}-${index}`}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
              >
                <div className="flex items-center gap-4">
                  <span
                    className={`px-2 py-1 text-xs font-mono rounded ${
                      endpoint.method === "GET"
                        ? "bg-green-100 text-green-700"
                        : endpoint.method === "POST"
                        ? "bg-blue-100 text-blue-700"
                        : endpoint.method === "PUT"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {endpoint.method}
                  </span>
                  <div>
                    <p className="font-medium text-gray-800">{endpoint.name}</p>
                    <p className="text-sm text-gray-500 font-mono">
                      {endpoint.path}
                    </p>
                  </div>
                  {endpoint.requiresAuth && (
                    <span className="px-2 py-1 text-xs bg-gray-200 text-gray-600 rounded">
                      Auth Required
                    </span>
                  )}
                </div>
                <button
                  onClick={() => handleRemoveEndpoint(index)}
                  disabled={saving}
                  className="px-3 py-1 text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                  title="Remove endpoint"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
