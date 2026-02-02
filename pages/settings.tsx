import ProtectedRoute from "@/components/ProtectedRoute";
import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";
import Link from "next/link";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase";
import { useEffect, useState } from "react";
import { AuthClaims } from "../types/authClaims";
import { BACKEND_ENDPOINTS } from "@/lib/config";

export default function SettingsPage() {
  const [user] = useAuthState(auth);
  const [claims, setClaims] = useState<AuthClaims>({});
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const fetchClaims = async () => {
      if (user) {
        const token = await user.getIdTokenResult();
        setClaims(token.claims as AuthClaims);
      }
    };
    fetchClaims();
  }, [user]);

  const refreshBanks = async () => {
    setIsRefreshing(true);
    try {
      const idToken = await auth.currentUser?.getIdToken();

      const res = await fetch(`${BACKEND_ENDPOINTS.apiBaseUrl}/refreshBanks`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${idToken}`,
          "Content-Type": "application/json",
        },
      });

      const json = await res.json();
      alert(`Bank list refreshed: ${json.count} banks`);
    } catch (err) {
      console.error("Refresh Banks error:", err);
      alert("Failed to refresh bank list");
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <ProtectedRoute allowedRoles={["superAdmin", "orphanageAdmin"]}>
      <div className="min-h-screen flex flex-col bg-background text-base">
        <Navbar />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 p-8">
            <h2 className="text-3xl font-bold mb-6">Settings</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Hobby Management Card */}
              {claims.superAdmin && (
                <Link href="/settings/hobbies">
                  <div className="bg-white rounded shadow p-6 cursor-pointer hover:shadow-lg transition">
                    <h3 className="text-xl font-semibold mb-2">
                      Manage Hobbies
                    </h3>
                    <p className="text-gray-600">
                      Add, edit, or delete hobbies available for orphanage
                      admins to assign to children.
                    </p>
                  </div>
                </Link>
              )}

              {/* FAQ Management Card */}
              {claims.superAdmin && (
                <Link href="/settings/faqs">
                  <div className="bg-white rounded shadow p-6 cursor-pointer hover:shadow-lg transition">
                    <h3 className="text-xl font-semibold mb-2">Manage FAQs</h3>
                    <p className="text-gray-600">
                      Add, edit, or delete frequently asked questions displayed
                      to donors in the mobile app.
                    </p>
                  </div>
                </Link>
              )}

              {claims.orphanageAdmin && (
                <Link href="/settings/account-details">
                  <div className="bg-white rounded shadow p-6 cursor-pointer hover:shadow-lg transition">
                    <h3 className="text-xl font-semibold mb-2">
                      Account Details
                    </h3>
                    <p className="text-gray-600">
                      Add or update your payout bank account details. Required
                      to start receiving donations.
                    </p>
                  </div>
                </Link>
              )}

              {claims.superAdmin && (
                <Link href="/settings/action-center">
                  <div className="bg-white rounded shadow p-6 cursor-pointer hover:shadow-lg transition">
                    <h3 className="text-xl font-semibold mb-2">
                      Action Center
                    </h3>
                    <p className="text-gray-600">
                      Review and approve pending actions such as orphanage
                      account verifications.
                    </p>
                  </div>
                </Link>
              )}

              {(claims.superAdmin || claims.orphanageAdmin) && (
                <Link href="/settings/audit-logs">
                  <div className="bg-white rounded shadow p-6 cursor-pointer hover:shadow-lg transition">
                    <h3 className="text-xl font-semibold mb-2">Audit Logs</h3>
                    <p className="text-gray-600">
                      View system audit logs including user actions, approvals,
                      and administrative changes.
                    </p>
                  </div>
                </Link>
              )}

              {/* Refresh Bank List Card (super admins only) */}
              {claims.superAdmin && (
                <div
                  onClick={refreshBanks}
                  className="bg-white rounded shadow p-6 cursor-pointer hover:shadow-lg transition"
                >
                  <div className="flex items-center gap-3">
                    <h3 className="text-xl font-semibold mb-2">
                      {isRefreshing
                        ? "Refreshing Bank List..."
                        : "Refresh Bank List"}
                    </h3>
                    {isRefreshing && (
                      <svg
                        className="animate-spin h-5 w-5 text-blue-600"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                        ></path>
                      </svg>
                    )}
                  </div>
                  <p className="text-gray-600">
                    {isRefreshing
                      ? "Please wait while we fetch the latest banks from Paystack."
                      : "Update the list of Nigerian banks from Paystack. This ensures orphanage admins always see the latest options."}
                  </p>
                </div>
              )}

              {/* Future cards: sponsor criteria, categories, etc. */}
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
