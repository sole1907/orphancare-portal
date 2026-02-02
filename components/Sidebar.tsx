import Link from "next/link";
import { useAuthState } from "react-firebase-hooks/auth";
import { useEffect, useState } from "react";
import { AuthClaims } from "../types/authClaims";
import { useSafeAuth } from "@/hooks/useSafeAuth";

export default function Sidebar() {
  const auth = useSafeAuth();

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
    <div className="w-64 min-h-screen bg-gray-800 text-white p-4">
      <h2 className="text-xl font-bold mb-6">Admin Panel</h2>
      <ul className="space-y-4">
        <li>
          <Link href="/dashboard">
            <div className="px-4 py-2 hover:bg-gray-700 rounded cursor-pointer">
              Dashboard
            </div>
          </Link>
        </li>
        {claims.superAdmin && (
          <li>
            <Link href="/orphanages">
              <div className="px-4 py-2 hover:bg-gray-700 rounded cursor-pointer">
                Orphanages
              </div>
            </Link>
          </li>
        )}
        {claims.orphanageAdmin && (
          <li>
            <Link href="/my-orphanage">
              <div className="px-4 py-2 hover:bg-gray-700 rounded cursor-pointer">
                My Orphanage
              </div>
            </Link>
          </li>
        )}
        <li>
          <Link href="/children">
            <div className="px-4 py-2 hover:bg-gray-700 rounded cursor-pointer">
              Children
            </div>
          </Link>
        </li>
        <li>
          <Link href="/donors">
            <div className="px-4 py-2 hover:bg-gray-700 rounded cursor-pointer">
              Donors
            </div>
          </Link>
        </li>
        <li>
          <Link href="/donations">
            <div className="px-4 py-2 hover:bg-gray-700 rounded cursor-pointer">
              Donations
            </div>
          </Link>
        </li>
        <li>
          <Link href="/updates">
            <div className="px-4 py-2 hover:bg-gray-700 rounded cursor-pointer">
              Post Updates
            </div>
          </Link>
        </li>
        <li>
          <Link href="/settings">
            <div className="px-4 py-2 hover:bg-gray-700 rounded cursor-pointer">
              Settings
            </div>
          </Link>
        </li>
        {claims.superAdmin && (
          <li>
            <Link href="/system-health">
              <div className="px-4 py-2 hover:bg-gray-700 rounded cursor-pointer flex items-center gap-2">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
                System Health
              </div>
            </Link>
          </li>
        )}
      </ul>
    </div>
  );
}
