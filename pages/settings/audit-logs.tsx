import ProtectedRoute from "@/components/ProtectedRoute";
import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";
import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { BACKEND_ENDPOINTS } from "@/lib/config";

interface AuditLog {
  id: string;
  timestamp: string;
  action: string;
  category: string;
  actorId: string;
  actorEmail: string;
  actorRole: string;
  orphanageId: string | null;
  resourceType: string;
  resourceId: string;
  details: Record<string, unknown>;
  ipAddress: string;
  success: boolean;
  errorMessage: string | null;
}

interface AuditLogsResponse {
  logs: AuditLog[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasMore: boolean;
}

const CATEGORY_COLORS: Record<string, string> = {
  TIER_1_CRITICAL: "bg-red-100 text-red-800",
  TIER_2_HIGH: "bg-orange-100 text-orange-800",
  TIER_3_MEDIUM: "bg-yellow-100 text-yellow-800",
  TIER_4_LOW: "bg-gray-100 text-gray-800",
};

const CATEGORY_LABELS: Record<string, string> = {
  TIER_1_CRITICAL: "Critical",
  TIER_2_HIGH: "High",
  TIER_3_MEDIUM: "Medium",
  TIER_4_LOW: "Low",
};

function formatAction(action: string): string {
  return action
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString();
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination state
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 20;

  // Filter state
  const [filterCategory, setFilterCategory] = useState<string>("");
  const [filterAction, setFilterAction] = useState<string>("");
  const [filterSuccess, setFilterSuccess] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  // Detail modal state
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);

    try {
      const idToken = await auth.currentUser?.getIdToken();

      const body: Record<string, string | number | boolean> = {
        page,
        pageSize,
      };

      if (filterCategory) body.category = filterCategory;
      if (filterAction) body.action = filterAction;
      if (filterSuccess !== "") body.success = filterSuccess === "true";
      if (startDate) body.startDate = startDate;
      if (endDate) body.endDate = endDate;

      const res = await fetch(`${BACKEND_ENDPOINTS.apiBaseUrl}/getAuditLogs`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${idToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        throw new Error("Failed to fetch audit logs");
      }

      const json = await res.json();
      const data: AuditLogsResponse = json.data;

      setLogs(data.logs);
      setTotalPages(data.totalPages);
      setTotal(data.total);
    } catch (err) {
      console.error("Failed to load audit logs:", err);
      setError("Failed to load audit logs. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, filterCategory, filterAction, filterSuccess, startDate, endDate]);

  const handleClearFilters = () => {
    setFilterCategory("");
    setFilterAction("");
    setFilterSuccess("");
    setStartDate("");
    setEndDate("");
    setPage(1);
  };

  return (
    <ProtectedRoute allowedRoles={["superAdmin", "orphanageAdmin"]}>
      <div className="min-h-screen flex flex-col bg-background text-base">
        <Navbar />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-bold">Audit Logs</h2>
              <button
                onClick={fetchLogs}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Refresh
              </button>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded shadow mb-6">
              <h3 className="text-lg font-semibold mb-3">Filters</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    value={filterCategory}
                    onChange={(e) => {
                      setFilterCategory(e.target.value);
                      setPage(1);
                    }}
                    className="w-full border rounded px-3 py-2"
                  >
                    <option value="">All Categories</option>
                    <option value="TIER_1_CRITICAL">Critical</option>
                    <option value="TIER_2_HIGH">High</option>
                    <option value="TIER_3_MEDIUM">Medium</option>
                    <option value="TIER_4_LOW">Low</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Action
                  </label>
                  <select
                    value={filterAction}
                    onChange={(e) => {
                      setFilterAction(e.target.value);
                      setPage(1);
                    }}
                    className="w-full border rounded px-3 py-2"
                  >
                    <option value="">All Actions</option>
                    <option value="approve_bank_account">Approve Bank Account</option>
                    <option value="reject_bank_account">Reject Bank Account</option>
                    <option value="create_orphanage">Create Orphanage</option>
                    <option value="update_orphanage">Update Orphanage</option>
                    <option value="submit_bank_account">Submit Bank Account</option>
                    <option value="verify_bank_account">Verify Bank Account</option>
                    <option value="create_child">Create Child</option>
                    <option value="update_child">Update Child</option>
                    <option value="delete_child">Delete Child</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={filterSuccess}
                    onChange={(e) => {
                      setFilterSuccess(e.target.value);
                      setPage(1);
                    }}
                    className="w-full border rounded px-3 py-2"
                  >
                    <option value="">All</option>
                    <option value="true">Success</option>
                    <option value="false">Failed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      setPage(1);
                    }}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => {
                      setEndDate(e.target.value);
                      setPage(1);
                    }}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>

                <div className="flex items-end">
                  <button
                    onClick={handleClearFilters}
                    className="w-full px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}

            {/* Loading state */}
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                <p className="text-gray-500">Loading audit logs...</p>
              </div>
            ) : logs.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No audit logs found.
              </div>
            ) : (
              <>
                {/* Results count */}
                <p className="text-sm text-gray-600 mb-4">
                  Showing {logs.length} of {total} logs
                </p>

                {/* Audit logs table */}
                <div className="bg-white rounded shadow overflow-x-auto">
                  <table className="min-w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                          Time
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                          Category
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                          Action
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                          Actor
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                          Resource
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                          Status
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                          Details
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {logs.map((log) => (
                        <tr key={log.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm">
                            {log.timestamp ? formatDate(log.timestamp) : "N/A"}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`px-2 py-1 text-xs font-medium rounded ${
                                CATEGORY_COLORS[log.category] || "bg-gray-100"
                              }`}
                            >
                              {CATEGORY_LABELS[log.category] || log.category}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {formatAction(log.action)}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <div className="text-gray-900">{log.actorEmail}</div>
                            <div className="text-xs text-gray-500">
                              {log.actorRole}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <div className="text-gray-900">{log.resourceType}</div>
                            <div className="text-xs text-gray-500 truncate max-w-[150px]">
                              {log.resourceId}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            {log.success ? (
                              <span className="px-2 py-1 text-xs font-medium rounded bg-green-100 text-green-800">
                                Success
                              </span>
                            ) : (
                              <span className="px-2 py-1 text-xs font-medium rounded bg-red-100 text-red-800">
                                Failed
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => setSelectedLog(log)}
                              className="text-blue-600 hover:text-blue-800 text-sm"
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="flex justify-between items-center mt-4">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className={`px-4 py-2 rounded ${
                      page === 1
                        ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                        : "bg-blue-600 text-white hover:bg-blue-700"
                    }`}
                  >
                    Previous
                  </button>
                  <span className="text-sm text-gray-600">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className={`px-4 py-2 rounded ${
                      page === totalPages
                        ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                        : "bg-blue-600 text-white hover:bg-blue-700"
                    }`}
                  >
                    Next
                  </button>
                </div>
              </>
            )}

            {/* Detail Modal */}
            {selectedLog && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-xl font-bold">Audit Log Details</h3>
                      <button
                        onClick={() => setSelectedLog(null)}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        <svg
                          className="w-6 h-6"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>

                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-gray-500">
                            Timestamp
                          </label>
                          <p>
                            {selectedLog.timestamp
                              ? formatDate(selectedLog.timestamp)
                              : "N/A"}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">
                            Category
                          </label>
                          <p>
                            <span
                              className={`px-2 py-1 text-xs font-medium rounded ${
                                CATEGORY_COLORS[selectedLog.category] ||
                                "bg-gray-100"
                              }`}
                            >
                              {CATEGORY_LABELS[selectedLog.category] ||
                                selectedLog.category}
                            </span>
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">
                            Action
                          </label>
                          <p>{formatAction(selectedLog.action)}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">
                            Status
                          </label>
                          <p>
                            {selectedLog.success ? (
                              <span className="text-green-600">Success</span>
                            ) : (
                              <span className="text-red-600">Failed</span>
                            )}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">
                            Actor Email
                          </label>
                          <p>{selectedLog.actorEmail}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">
                            Actor Role
                          </label>
                          <p>{selectedLog.actorRole}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">
                            Resource Type
                          </label>
                          <p>{selectedLog.resourceType}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">
                            Resource ID
                          </label>
                          <p className="text-sm break-all">
                            {selectedLog.resourceId}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">
                            IP Address
                          </label>
                          <p>{selectedLog.ipAddress}</p>
                        </div>
                        {selectedLog.orphanageId && (
                          <div>
                            <label className="text-sm font-medium text-gray-500">
                              Orphanage ID
                            </label>
                            <p className="text-sm break-all">
                              {selectedLog.orphanageId}
                            </p>
                          </div>
                        )}
                      </div>

                      {selectedLog.errorMessage && (
                        <div>
                          <label className="text-sm font-medium text-gray-500">
                            Error Message
                          </label>
                          <p className="text-red-600">{selectedLog.errorMessage}</p>
                        </div>
                      )}

                      <div>
                        <label className="text-sm font-medium text-gray-500">
                          Details
                        </label>
                        <pre className="mt-1 p-3 bg-gray-100 rounded text-sm overflow-x-auto">
                          {JSON.stringify(selectedLog.details, null, 2)}
                        </pre>
                      </div>
                    </div>

                    <div className="mt-6 flex justify-end">
                      <button
                        onClick={() => setSelectedLog(null)}
                        className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
