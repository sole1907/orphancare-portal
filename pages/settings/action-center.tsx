import ProtectedRoute from "@/components/ProtectedRoute";
import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";
import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { collection, getDocs, updateDoc, doc } from "firebase/firestore";
import { Orphanage, OrphanageData } from "@/types/orphanage";
import { BACKEND_ENDPOINTS } from "@/lib/config";

export default function ActionCenterPage() {
  const [pendingAccounts, setPendingAccounts] = useState<Orphanage[]>([]);
  const [loadingAcctId, setLoadingAcctId] = useState<string | null>(null);
  const [loadingAcctAction, setLoadingAcctAction] = useState<
    "approve" | "reject" | null
  >(null);

  // -------------------------------
  // FETCH PENDING ORPHANAGE ACCOUNTS
  // -------------------------------
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

  // -------------------------------
  // APPROVE ORPHANAGE ACCOUNT
  // -------------------------------
  const approveBankAccount = async (id: string) => {
    setLoadingAcctId(id);
    setLoadingAcctAction("approve");

    try {
      const idToken = await auth.currentUser?.getIdToken();

      const res = await fetch(
        `${BACKEND_ENDPOINTS.apiBaseUrl}/approveOrphanageAccount`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${idToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ orphanageId: id }),
        }
      );

      const json = await res.json();

      if (!res.ok) {
        alert(json.error || "Unable to approve account");
        return;
      }

      alert("Account approved and Paystack subaccount created.");
      setPendingAccounts((prev) => prev.filter((o) => o.id !== id));
    } finally {
      setLoadingAcctId(null);
      setLoadingAcctAction(null);
    }
  };

  // -------------------------------
  // REJECT ORPHANAGE ACCOUNT
  // -------------------------------
  const rejectBankAccount = async (id: string) => {
    setLoadingAcctId(id);
    setLoadingAcctAction("reject");

    try {
      await updateDoc(doc(db, "orphanages", id), {
        accountVerificationStatus: "rejected",
      });

      setPendingAccounts((prev) => prev.filter((o) => o.id !== id));
    } finally {
      setLoadingAcctId(null);
      setLoadingAcctAction(null);
    }
  };

  return (
    <ProtectedRoute allowedRoles={["superAdmin"]}>
      <div className="min-h-screen flex flex-col bg-background text-base">
        <Navbar />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 p-8">
            <h2 className="text-3xl font-bold mb-6">Action Center</h2>

            {/* -------------------------------------------------- */}
            {/* BANK ACCOUNT VERIFICATION SECTION */}
            {/* -------------------------------------------------- */}
            <section className="mb-12">
              <h3 className="text-xl font-bold mb-2">
                Bank Account Verification Requests
              </h3>
              <hr className="mb-4" />

              {pendingAccounts.length === 0 ? (
                <p className="text-gray-600">No pending verifications.</p>
              ) : (
                pendingAccounts.map((o) => (
                  <div
                    key={o.id}
                    className="bg-white border p-4 mb-4 rounded shadow max-w-lg"
                  >
                    <p className="font-semibold">{o.name}</p>
                    <p>Bank: {o.bankName}</p>
                    <p>Account Name: {o.accountName}</p>
                    <p>Account Number: ****{o.accountNumberMasked}</p>

                    <div className="mt-3 flex gap-3">
                      <button
                        onClick={() => approveBankAccount(o.id)}
                        disabled={loadingAcctId === o.id}
                        className={`px-4 py-2 rounded text-white ${
                          loadingAcctId === o.id &&
                          loadingAcctAction === "approve"
                            ? "bg-green-400 cursor-not-allowed"
                            : "bg-green-600"
                        }`}
                      >
                        {loadingAcctId === o.id &&
                        loadingAcctAction === "approve"
                          ? "Approving..."
                          : "Approve"}
                      </button>

                      <button
                        onClick={() => rejectBankAccount(o.id)}
                        disabled={loadingAcctId === o.id}
                        className={`px-4 py-2 rounded text-white ${
                          loadingAcctId === o.id &&
                          loadingAcctAction === "reject"
                            ? "bg-red-400 cursor-not-allowed"
                            : "bg-red-600"
                        }`}
                      >
                        {loadingAcctId === o.id &&
                        loadingAcctAction === "reject"
                          ? "Rejecting..."
                          : "Reject"}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </section>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
