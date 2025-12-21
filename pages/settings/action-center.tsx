import ProtectedRoute from "@/components/ProtectedRoute";
import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, updateDoc, doc } from "firebase/firestore";
import { Orphanage, OrphanageData } from "@/types/orphanage"; // <-- your interface

export default function ActionCenterPage() {
  const [pendingAccounts, setPendingAccounts] = useState<Orphanage[]>([]);

  useEffect(() => {
    const fetchPending = async () => {
      const snap = await getDocs(collection(db, "orphanages"));
      setPendingAccounts(
        snap.docs
          .map((d) => ({ id: d.id, ...(d.data() as OrphanageData) }))
          .filter((o) => o.accountVerificationStatus === "pending")
      );
    };
    fetchPending();
  }, []);

  const approve = async (id: string) => {
    await updateDoc(doc(db, "orphanages", id), {
      accountVerificationStatus: "approved",
    });
    setPendingAccounts((prev) => prev.filter((o) => o.id !== id));
  };

  const reject = async (id: string) => {
    await updateDoc(doc(db, "orphanages", id), {
      accountVerificationStatus: "rejected",
    });
    setPendingAccounts((prev) => prev.filter((o) => o.id !== id));
  };

  return (
    <ProtectedRoute allowedRoles={["superAdmin"]}>
      <div className="min-h-screen flex flex-col bg-background text-base">
        <Navbar />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 p-8">
            <h2 className="text-3xl font-bold mb-6">Action Center</h2>
            {pendingAccounts.length === 0 ? (
              <p className="text-gray-600">
                No pending verifications at the moment.
              </p>
            ) : (
              pendingAccounts.map((o) => (
                <div
                  key={o.id}
                  className="bg-white border p-4 mb-4 rounded shadow max-w-lg"
                >
                  {" "}
                  <p className="font-semibold">{o.name}</p>{" "}
                  <p>Bank: {o.bankName}</p> <p>Account Name: {o.accountName}</p>{" "}
                  <p>Account Number: ****{o.accountNumberMasked}</p>{" "}
                  <div className="mt-3 flex gap-3">
                    {" "}
                    <button
                      onClick={() => approve(o.id)}
                      className="bg-green-600 text-white px-4 py-2 rounded"
                    >
                      {" "}
                      Approve{" "}
                    </button>{" "}
                    <button
                      onClick={() => reject(o.id)}
                      className="bg-red-600 text-white px-4 py-2 rounded"
                    >
                      {" "}
                      Reject{" "}
                    </button>{" "}
                  </div>{" "}
                </div>
              ))
            )}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
