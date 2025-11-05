import { useEffect, useState } from "react";
import { db, auth } from "../lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";
import ProtectedRoute from "../components/ProtectedRoute";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import { Orphanage } from "../types/orphanage";

export default function MyOrphanagePage() {
  const [user] = useAuthState(auth);
  const [orphanage, setOrphanage] = useState<Orphanage | null>(null);

  useEffect(() => {
    const fetchOrphanage = async () => {
      if (!user) return;
      const token = await user.getIdTokenResult();
      const orphanageId = token.claims.orphanageId;
      const q = query(
        collection(db, "orphanages"),
        where("__name__", "==", orphanageId)
      );
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        setOrphanage({
          id: snapshot.docs[0].id,
          ...(snapshot.docs[0].data() as Omit<Orphanage, "id">),
        });
      }
    };
    fetchOrphanage();
  }, [user]);

  return (
    <ProtectedRoute allowedRoles={["orphanageAdmin"]}>
      <div className="min-h-screen bg-background text-base">
        <Navbar />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 p-8">
            <h2 className="text-3xl font-bold mb-6">My Orphanage</h2>
            {orphanage ? (
              <div className="bg-white rounded shadow p-6 max-w-2xl">
                <p>
                  <strong>Name:</strong> {orphanage.name}
                </p>
                <p>
                  <strong>Contact Name:</strong> {orphanage.contactName}
                </p>
                <p>
                  <strong>Email:</strong> {orphanage.email}
                </p>
                <p>
                  <strong>Phone:</strong> {orphanage.phone}
                </p>
                <p>
                  <strong>Address:</strong> {orphanage.address}
                </p>
                <p>
                  <strong>Registration #:</strong>{" "}
                  {orphanage.registrationNumber}
                </p>
                <p>
                  <strong>Status:</strong> {orphanage.status}
                </p>
              </div>
            ) : (
              <p>Loading orphanage info...</p>
            )}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
