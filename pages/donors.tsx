import { useEffect, useState, useCallback } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import ProtectedRoute from "@/components/ProtectedRoute";
import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";
import DonorsListTable from "@/components/DonorsListTable";
import Pagination from "@/components/Pagination";
import { DonorListItem } from "@/types/donor";
import { fetchDonorsList } from "@/lib/donorsApi";
import { useSafeAuth } from "@/hooks/useSafeAuth";
import { AuthClaims } from "@/types/authClaims";

export default function DonorsPage() {
  const auth = useSafeAuth();
  const [user] = useAuthState(auth);
  const [claims, setClaims] = useState<AuthClaims>({});
  const [donors, setDonors] = useState<DonorListItem[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pageSize = 10;

  useEffect(() => {
    const fetchClaims = async () => {
      if (user) {
        const token = await user.getIdTokenResult();
        setClaims(token.claims as AuthClaims);
      }
    };
    fetchClaims();
  }, [user]);

  const loadDonors = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetchDonorsList({
        page,
        pageSize,
        search: search || undefined,
      });
      setDonors(response.donors);
      setTotalPages(response.totalPages);
      setTotal(response.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load donors");
    } finally {
      setLoading(false);
    }
  }, [user, page, search]);

  useEffect(() => {
    loadDonors();
  }, [loadDonors]);

  const handleSearch = () => {
    setPage(1);
    loadDonors();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const isSuperAdmin = claims.superAdmin === true;

  return (
    <ProtectedRoute allowedRoles={["superAdmin", "orphanageAdmin"]}>
      <div className="min-h-screen flex flex-col bg-background text-base">
        <Navbar />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 p-8">
            <h2 className="text-3xl font-bold text-base mb-6">Donors</h2>

            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Search by name or email"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="border border-gray-300 rounded px-4 py-2 w-64 focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <button
                  onClick={handleSearch}
                  className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90"
                >
                  Search
                </button>
              </div>
              <span className="text-sm text-gray-500">
                Showing {donors.length} of {total} donors
              </span>
            </div>

            {error && (
              <div className="mb-4 p-4 bg-red-50 text-red-700 rounded">
                {error}
              </div>
            )}

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <>
                <DonorsListTable donors={donors} showEmail={isSuperAdmin} />
                <Pagination
                  page={page}
                  totalPages={totalPages}
                  onPageChange={setPage}
                />
              </>
            )}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
