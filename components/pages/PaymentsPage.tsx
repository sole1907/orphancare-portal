import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import ProtectedRoute from "../ProtectedRoute";
import Sidebar from "../Sidebar";
import Navbar from "../Navbar";
import { Payment } from "@/types/payment";
import { useSafeDb } from "@/hooks/useSafeDb";

export default function PaymentsPage() {
  const db = useSafeDb();

  const [payments, setPayments] = useState<Payment[]>([]);

  const fetchPayments = async () => {
    const snapshot = await getDocs(collection(db, "payments"));
    setPayments(
      snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<Payment, "id">),
      }))
    );
  };

  useEffect(() => {
    void (async () => {
      await fetchPayments();
    })();
  }, []);

  return (
    <ProtectedRoute allowedRoles={["superAdmin", "orphanageAdmin", "donor"]}>
      <div className="min-h-screen flex flex-col bg-background text-base">
        <Navbar />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 p-8">
            <h2 className="text-3xl font-bold text-base mb-6">Payments</h2>

            <div className="overflow-x-auto rounded shadow">
              <table className="min-w-full bg-white border border-gray-200">
                <thead className="bg-primary text-white">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold">
                      Donor ID
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">
                      Tier
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">
                      Amount
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">
                      Timestamp
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p) => (
                    <tr key={p.id} className="border-t hover:bg-gray-50">
                      <td className="px-4 py-2 text-sm text-base">
                        {p.donorId}
                      </td>
                      <td className="px-4 py-2 text-sm">{p.tier}</td>
                      <td className="px-4 py-2 text-sm">₦{p.amount}</td>
                      <td className="px-4 py-2 text-sm text-gray-600">
                        {p.createdAt?.toDate().toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
