import ProtectedRoute from "@/components/ProtectedRoute";
import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";
import Link from "next/link";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase";
import { useEffect, useState } from "react";
import { AuthClaims } from "../types/authClaims";

export default function SettingsPage() {
  const [user] = useAuthState(auth);
  const [claims, setClaims] = useState<AuthClaims>({});
  useEffect(() => {
    const fetchClaims = async () => {
      if (user) {
        const token = await user.getIdTokenResult();
        setClaims(token.claims as AuthClaims);
      }
    };
    fetchClaims();
  }, [user]);

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
              {claims.superAdmin && (
                <Link href="/settings/hobbies">
                  <div className="bg-white rounded shadow p-6 cursor-pointer hover:shadow-lg transition">
                    <h3 className="text-xl font-semibold mb-2">
                      Manage Hobbies
                    </h3>
                    <p className="text-gray-600">
                      Add, edit, or delete hobbies available for orphanage
                      admins to assign to children.
                    </p>
                  </div>
                </Link>
              )}

              {claims.orphanageAdmin && (
                <Link href="/settings/account-details">
                  <div className="bg-white rounded shadow p-6 cursor-pointer hover:shadow-lg transition">
                    <h3 className="text-xl font-semibold mb-2">
                      Account Details
                    </h3>
                    <p className="text-gray-600">
                      Add or update your payout bank account details. Required
                      to start receiving donations.
                    </p>
                  </div>
                </Link>
              )}

              {claims.superAdmin && (
                <Link href="/settings/action-center">
                  <div className="bg-white rounded shadow p-6 cursor-pointer hover:shadow-lg transition">
                    <h3 className="text-xl font-semibold mb-2">
                      Action Center
                    </h3>
                    <p className="text-gray-600">
                      Review and approve pending actions such as orphanage
                      account verifications.
                    </p>
                  </div>
                </Link>
              )}

              {/* Future cards: sponsor criteria, categories, etc. */}
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
