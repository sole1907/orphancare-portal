import { useEffect, useState, useCallback } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import ProtectedRoute from "@/components/ProtectedRoute";
import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";
import DonationsListTable from "@/components/DonationsListTable";
import DonationsFilter from "@/components/DonationsFilter";
import Pagination from "@/components/Pagination";
import { DonationListItem, DonationStatus } from "@/types/donation";
import { fetchDonationsList } from "@/lib/donationsApi";
import { useSafeAuth } from "@/hooks/useSafeAuth";
import { AuthClaims } from "@/types/authClaims";

export default function DonationsPage() {
  const auth = useSafeAuth();
  const [user] = useAuthState(auth);
  const [claims, setClaims] = useState<AuthClaims>({});
  const [donations, setDonations] = useState<DonationListItem[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<DonationStatus | "all">("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Applied filters (used for actual API calls)
  const [appliedFilters, setAppliedFilters] = useState({
    search: "",
    status: "all" as DonationStatus | "all",
    startDate: "",
    endDate: "",
  });

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

  const loadDonations = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetchDonationsList({
        page,
        pageSize,
        search: appliedFilters.search || undefined,
        status: appliedFilters.status !== "all" ? appliedFilters.status : undefined,
        startDate: appliedFilters.startDate || undefined,
        endDate: appliedFilters.endDate || undefined,
      });
      setDonations(response.donations);
      setTotalPages(response.totalPages);
      setTotal(response.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load donations");
    } finally {
      setLoading(false);
    }
  }, [user, page, appliedFilters]);

  useEffect(() => {
    loadDonations();
  }, [loadDonations]);

  const handleApplyFilters = () => {
    setPage(1);
    setAppliedFilters({
      search,
      status,
      startDate,
      endDate,
    });
  };

  const handleResetFilters = () => {
    setSearch("");
    setStatus("all");
    setStartDate("");
    setEndDate("");
    setPage(1);
    setAppliedFilters({
      search: "",
      status: "all",
      startDate: "",
      endDate: "",
    });
  };

  const isSuperAdmin = claims.superAdmin === true;

  return (
    <ProtectedRoute allowedRoles={["superAdmin", "orphanageAdmin"]}>
      <div className="min-h-screen flex flex-col bg-background text-base">
        <Navbar />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-bold text-base">Donations</h2>
              <span className="text-sm text-gray-500">
                {total} total donations
              </span>
            </div>

            <DonationsFilter
              search={search}
              status={status}
              startDate={startDate}
              endDate={endDate}
              onSearchChange={setSearch}
              onStatusChange={setStatus}
              onStartDateChange={setStartDate}
              onEndDateChange={setEndDate}
              onApply={handleApplyFilters}
              onReset={handleResetFilters}
            />

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
                <DonationsListTable
                  donations={donations}
                  showOrphanage={isSuperAdmin}
                  showEmail={isSuperAdmin}
                />
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
