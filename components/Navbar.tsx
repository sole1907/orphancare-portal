import { useState } from "react";
import { signOut } from "firebase/auth";
import { useAuthState } from "react-firebase-hooks/auth";
import { ChevronDownIcon } from "@heroicons/react/24/solid";
import Link from "next/link";
import { useSafeAuth } from "@/hooks/useSafeAuth";

export default function Navbar() {
  const auth = useSafeAuth();
  const [user] = useAuthState(auth);
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    await signOut(auth);
  };

  return (
    <div className="flex justify-between items-center bg-primary text-white px-6 py-4 shadow-md relative">
      <Link href="/">
        <h1 className="text-xl font-bold">OrphanCare Admin</h1>
      </Link>

      {user && (
        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-2 bg-primary text-white px-3 py-2 rounded hover:bg-sky-400 transition"
          >
            <div className="w-8 h-8 bg-white text-primary font-bold rounded-full flex items-center justify-center">
              {user.email?.charAt(0).toUpperCase()}
            </div>
            <ChevronDownIcon className="w-4 h-4" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white text-base rounded shadow-lg z-50">
              <div className="px-4 py-4 border-b text-sm text-gray-700 text-center break-words">
                {user.email}
              </div>
              <div className="py-2">
                <button
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm"
                  onClick={() => {
                    // TODO: Navigate to profile page
                    setMenuOpen(false);
                  }}
                >
                  View Profile
                </button>
                <button
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm text-red-600"
                  onClick={handleLogout}
                >
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
