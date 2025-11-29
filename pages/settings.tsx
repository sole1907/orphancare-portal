import ProtectedRoute from "@/components/ProtectedRoute";
import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";
import Link from "next/link";

export default function SettingsPage() {
  return (
    <ProtectedRoute allowedRoles={["superAdmin"]}>
      <div className="min-h-screen flex flex-col bg-background text-base">
        <Navbar />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 p-8">
            <h2 className="text-3xl font-bold mb-6">Settings</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Hobby Management Card */}
              <Link href="/settings/hobbies">
                <div className="bg-white rounded shadow p-6 cursor-pointer hover:shadow-lg transition">
                  <h3 className="text-xl font-semibold mb-2">Manage Hobbies</h3>
                  <p className="text-gray-600">
                    Add, edit, or delete hobbies available for orphanage admins
                    to assign to children.
                  </p>
                </div>
              </Link>

              {/* Future cards: sponsor criteria, categories, etc. */}
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
