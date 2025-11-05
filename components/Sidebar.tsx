import Link from "next/link";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../lib/firebase";
import { useEffect, useState } from "react";
import { AuthClaims } from "../types/authClaims";

export default function Sidebar() {
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
          <Link href="/payments">
            <div className="px-4 py-2 hover:bg-gray-700 rounded cursor-pointer">
              Payments
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
      </ul>
    </div>
  );
}
