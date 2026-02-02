import { useEffect, useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import ProtectedRoute from "@/components/ProtectedRoute";
import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";
import DateFilter from "@/components/DateFilter";
import MetricCard from "@/components/MetricCard";
import PaymentsChart from "@/components/PaymentsChart";
import DonorGrowthChart from "@/components/DonorGrowthChart";
import TopDonorsTable from "@/components/TopDonorsTable";
import TopOrphanagesTable from "@/components/TopOrphanagesTable";
import { DateRange } from "@/types/filters";
import { auth, db } from "@/lib/firebase";
import { AuthClaims } from "@/types/authClaims";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/router";
import { fetchDashboardStats } from "@/lib/dashboardApi";
import { DashboardStats } from "@/types/dashboard";

export default function Dashboard() {
  const [range, setRange] = useState<DateRange>("30d");
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user] = useAuthState(auth);
  const [claims, setClaims] = useState<AuthClaims>({});
  const [userHasSubaccount, setUserHasSubaccount] = useState(false);

  const router = useRouter();

  useEffect(() => {
    const loadData = async () => {
      if (!user) return;

      setLoading(true);
      setError(null);

      try {
        const token = await user.getIdTokenResult();
        setClaims(token.claims as AuthClaims);

        // Check orphanage subaccount status for orphanageAdmin
        if (
          token.claims.orphanageId &&
          typeof token.claims.orphanageId === "string"
        ) {
          const orphanageRef = doc(db, "orphanages", token.claims.orphanageId);
          const orphanageDoc = await getDoc(orphanageRef);
          if (orphanageDoc.exists()) {
            const data = orphanageDoc.data();
            setUserHasSubaccount(!!data.subaccountCode);
          }
        }

        // Fetch dashboard stats from API
        const orphanageId = token.claims.orphanageAdmin
          ? (token.claims.orphanageId as string)
          : undefined;

        const dashboardData = await fetchDashboardStats(range, orphanageId);
        setStats(dashboardData);
      } catch (err) {
        console.error("Failed to load dashboard:", err);
        setError("Failed to load dashboard data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    void loadData();
  }, [range, user]);

  return (
    <ProtectedRoute allowedRoles={["superAdmin", "orphanageAdmin"]}>
      <div className="min-h-screen flex flex-col bg-background text-base">
        <Navbar />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 p-8">
            {!claims.superAdmin && !userHasSubaccount && (
              <div className="mb-6 p-4 bg-yellow-100 border border-yellow-400 text-yellow-800 rounded">
                <strong>Action Required:</strong> You have not set up your
                payout account. Please{" "}
                <button
                  onClick={() => router.push("/settings/account-details")}
                  className="underline text-blue-600"
                >
                  add your bank details
                </button>{" "}
                to start receiving donations.
              </div>
            )}

            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-bold text-base">Dashboard</h2>
              <DateFilter range={range} setRange={setRange} />
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-800 rounded">
                {error}
              </div>
            )}

            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : stats ? (
              <>
                {/* Metrics Row */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                  <MetricCard
                    title="Total Donations"
                    value={stats.totalDonations}
                    prefix="₦"
                  />
                  <MetricCard title="Total Donors" value={stats.totalDonors} />
                  <MetricCard
                    title="Total Payments"
                    value={stats.totalPayments}
                  />
                  <MetricCard
                    title="Active Recurring"
                    value={stats.activeRecurringPlans}
                  />
                </div>

                {/* MRR Card (if any recurring) */}
                {stats.mrr > 0 && (
                  <div className="mb-8 flex gap-6">
                    <div className="flex-1 bg-gradient-to-r from-green-400 to-green-600 rounded shadow p-6 text-white">
                      <h3 className="text-sm opacity-90 mb-1">
                        Monthly Recurring Revenue (MRR)
                        {claims.superAdmin && (
                          <span className="ml-1 text-xs opacity-75">
                            for All Orphanages
                          </span>
                        )}
                      </h3>
                      <p className="text-3xl font-bold">
                        ₦{stats.mrr.toLocaleString()}
                      </p>
                    </div>
                    {claims.superAdmin &&
                      stats.monthlyRecurringTip !== undefined &&
                      stats.monthlyRecurringTip > 0 && (
                        <div className="flex-1 bg-gradient-to-r from-purple-400 to-purple-600 rounded shadow p-6 text-white">
                          <h3 className="text-sm opacity-90 mb-1">
                            Monthly Recurring Tip
                          </h3>
                          <p className="text-3xl font-bold">
                            ₦{stats.monthlyRecurringTip.toLocaleString()}
                          </p>
                        </div>
                      )}
                  </div>
                )}

                {/* Charts Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <PaymentsChart data={stats.paymentsOverTime} />
                  <DonorGrowthChart data={stats.donorsOverTime} />
                </div>

                {/* Top Donors & Orphanages */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <TopDonorsTable donors={stats.topDonors} />
                  {claims.superAdmin && stats.topOrphanages && (
                    <TopOrphanagesTable orphanages={stats.topOrphanages} />
                  )}
                </div>
              </>
            ) : (
              <div className="text-center text-gray-500 py-12">
                No data available.
              </div>
            )}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
