import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import ProtectedRoute from "../ProtectedRoute";
import Sidebar from "../Sidebar";
import Navbar from "../Navbar";
import { Donor } from "@/types/donor";
import { useSafeDb } from "@/hooks/useSafeDb";

export default function DonorsPage() {
  const db = useSafeDb();

  const [donors, setDonors] = useState<Donor[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetch = async () => {
      const snapshot = await getDocs(collection(db, "donors"));
      setDonors(
        snapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<Donor, "id">),
        }))
      );
    };

    void fetch();
  }, [db]);

  const filteredDonors = donors.filter((d) =>
    d.id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <ProtectedRoute allowedRoles={["superAdmin"]}>
      <div className="min-h-screen flex flex-col bg-background text-base">
        <Navbar />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 p-8">
            <h2 className="text-3xl font-bold text-base mb-6">
              Donor Activity
            </h2>

            <div className="mb-4 flex items-center justify-between">
              <input
                type="text"
                placeholder="Search by Donor ID"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="border border-gray-300 rounded px-4 py-2 w-64 focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <span className="text-sm text-gray-500">
                Showing {filteredDonors.length} of {donors.length}
              </span>
            </div>

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
                  {filteredDonors.map((d) => (
                    <tr key={d.id} className="border-t hover:bg-gray-50">
                      <td className="px-4 py-2 text-sm text-base">{d.id}</td>
                      <td className="px-4 py-2 text-sm">{d.tier}</td>
                      <td className="px-4 py-2 text-sm">₦{d.amount}</td>
                      <td className="px-4 py-2 text-sm text-gray-600">
                        {d.createdAt?.toDate().toLocaleString()}
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
