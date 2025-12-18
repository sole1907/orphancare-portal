import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db } from "@/lib/firebase";
import { useState } from "react";
import { doc, updateDoc } from "firebase/firestore";

export default function AccountDetailsPage() {
  const [user] = useAuthState(auth);
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");

  const handleSubmit = async () => {
    if (!user) return;
    const token = await user.getIdTokenResult();
    const orphanageId = token.claims.orphanageId as string;

    if (orphanageId) {
      const orphanageRef = doc(db, "orphanages", orphanageId);
      await updateDoc(orphanageRef, {
        bankName,
        accountNumber,
        status: "pendingVerification",
      });
    }

    alert("Account details submitted for verification.");
  };

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-4">Account Details</h2>
      <input
        type="text"
        placeholder="Bank Name"
        value={bankName}
        onChange={(e) => setBankName(e.target.value)}
        className="border p-2 mb-4 w-full"
      />
      <input
        type="text"
        placeholder="Account Number"
        value={accountNumber}
        onChange={(e) => setAccountNumber(e.target.value)}
        className="border p-2 mb-4 w-full"
      />
      <button
        onClick={handleSubmit}
        className="bg-blue-600 text-white px-4 py-2 rounded"
      >
        Submit
      </button>
    </div>
  );
}
