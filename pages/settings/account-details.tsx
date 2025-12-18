// pages/settings/account-details.tsx
import ProtectedRoute from "@/components/ProtectedRoute";
import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db } from "@/lib/firebase";
import { useEffect, useState } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";

export default function AccountDetailsPage() {
  const [user] = useAuthState(auth);
  const [bankName, setBankName] = useState("");
  const [accountName, setAccountName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetails = async () => {
      if (!user) return;
      const token = await user.getIdTokenResult();
      const orphanageId = token.claims.orphanageId as string;
      const ref = doc(db, "orphanages", orphanageId);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data = snap.data();
        setBankName(data.bankName || "");
        setAccountName(data.accountName || "");
        setAccountNumber(data.accountNumber || "");
      }
      setLoading(false);
    };
    fetchDetails();
  }, [user]);

  const handleSubmit = async () => {
    if (!user) return;
    const token = await user.getIdTokenResult();
    const orphanageId = token.claims.orphanageId as string;
    const ref = doc(db, "orphanages", orphanageId);

    await updateDoc(ref, {
      bankName,
      accountName,
      accountNumber,
      accountVerificationStatus: "pending",
    });

    alert("Account details submitted for verification.");
  };

  return (
    <ProtectedRoute allowedRoles={["orphanageAdmin"]}>
      <div className="min-h-screen flex flex-col bg-background text-base">
        <Navbar />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 p-8">
            <h2 className="text-3xl font-bold mb-6">Account Details</h2>

            {loading ? (
              <p>Loading...</p>
            ) : (
              <div className="bg-white rounded shadow p-6 max-w-lg">
                <div className="mb-4">
                  <label className="block font-semibold mb-2">Bank Name</label>
                  <input
                    type="text"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="border p-2 w-full"
                  />
                </div>
                <div className="mb-4">
                  <label className="block font-semibold mb-2">
                    Account Name
                  </label>
                  <input
                    type="text"
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                    className="border p-2 w-full"
                  />
                </div>
                <div className="mb-4">
                  <label className="block font-semibold mb-2">
                    Account Number
                  </label>
                  <input
                    type="text"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    className="border p-2 w-full"
                  />
                </div>
                <button
                  onClick={handleSubmit}
                  className="bg-blue-600 text-white px-4 py-2 rounded"
                >
                  Save & Submit for Verification
                </button>
              </div>
            )}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
