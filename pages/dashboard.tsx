import { useEffect, useState } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";
import ProtectedRoute from "@/components/ProtectedRoute";
import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";
import DateFilter from "@/components/DateFilter";
import MetricCard from "@/components/MetricCard";
import PaymentsChart from "@/components/PaymentsChart";
import DonorGrowthChart from "@/components/DonorGrowthChart";
import TierPieChart from "@/components/TierPieChart";
import { Payment } from "@/types/payment";
import { Donor } from "@/types/donor";
import { DateRange } from "@/types/filters";
import { useCallback } from "react";
import { auth, db } from "@/lib/firebase";
import { AuthClaims } from "@/types/authClaims";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/router";

export default function Dashboard() {
  const [range, setRange] = useState<DateRange>("30d");
  const [payments, setPayments] = useState<Payment[]>([]);
  const [donors, setDonors] = useState<Donor[]>([]);
  const [user] = useAuthState(auth);
  const [claims, setClaims] = useState<AuthClaims>({});
  const [userHasSubaccount, setUserHasSubaccount] = useState(false);

  const getStartDate = useCallback(() => {
    const now = new Date();
    if (range === "7d") now.setDate(now.getDate() - 7);
    else if (range === "30d") now.setDate(now.getDate() - 30);
    else if (range === "year") now.setFullYear(now.getFullYear() - 1);
    return now;
  }, [range]);

  const router = useRouter();

  useEffect(() => {
    const fetch = async () => {
      if (!user) return;
      const token = await user.getIdTokenResult();
      setClaims(token.claims as AuthClaims);

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

      const isSuperAdmin = token.claims.superAdmin;
      const orphanageId = token.claims.orphanageId;
      const startDate = getStartDate();

      const paymentsQuery = isSuperAdmin
        ? query(collection(db, "payments"), where("timestamp", ">=", startDate))
        : query(
            collection(db, "payments"),
            where("timestamp", ">=", startDate),
            where("orphanageId", "==", orphanageId)
          );

      const donorsQuery = isSuperAdmin
        ? query(collection(db, "donors"), where("createdAt", ">=", startDate))
        : query(
            collection(db, "donors"),
            where("createdAt", ">=", startDate),
            where("orphanageId", "==", orphanageId)
          );

      const [paymentsSnap, donorsSnap] = await Promise.all([
        getDocs(paymentsQuery),
        getDocs(donorsQuery),
      ]);

      setPayments(
        paymentsSnap.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<Payment, "id">),
        }))
      );
      setDonors(
        donorsSnap.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<Donor, "id">),
        }))
      );
    };

    void fetch();
  }, [range, user, getStartDate]);

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
                  onClick={() => router.push("/account-details")}
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <MetricCard
                title="Total Collected"
                value={payments.reduce((sum, p) => sum + p.amount, 0)}
              />
              <MetricCard title="New Donors" value={donors.length} />
              <MetricCard title="Payments" value={payments.length} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <PaymentsChart payments={payments} />
              <DonorGrowthChart donors={donors} />
              <TierPieChart donors={donors} />
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
