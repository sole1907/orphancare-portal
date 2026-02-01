// components/DonorsListTable.tsx
import { DonorListItem } from "@/types/donor";

interface DonorsListTableProps {
  donors: DonorListItem[];
  showEmail: boolean;
}

function formatDate(dateString: string | null): string {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleDateString();
}

export default function DonorsListTable({
  donors,
  showEmail,
}: DonorsListTableProps) {
  if (donors.length === 0) {
    return (
      <div className="bg-white rounded shadow p-8 text-center">
        <p className="text-gray-500">No donors found.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded shadow">
      <table className="min-w-full bg-white border border-gray-200">
        <thead className="bg-primary text-white">
          <tr>
            <th className="px-4 py-3 text-left text-sm font-semibold">Name</th>
            {showEmail && (
              <th className="px-4 py-3 text-left text-sm font-semibold">
                Email
              </th>
            )}
            <th className="px-4 py-3 text-right text-sm font-semibold">
              Total Contributed
            </th>
            <th className="px-4 py-3 text-right text-sm font-semibold">
              Donations
            </th>
            <th className="px-4 py-3 text-left text-sm font-semibold">
              Last Donation
            </th>
          </tr>
        </thead>
        <tbody>
          {donors.map((donor) => (
            <tr key={donor.donorUid} className="border-t hover:bg-gray-50">
              <td className="px-4 py-2 text-sm font-medium">
                {donor.name || "Anonymous"}
              </td>
              {showEmail && (
                <td className="px-4 py-2 text-sm text-gray-600">
                  {donor.email || "-"}
                </td>
              )}
              <td className="px-4 py-2 text-sm text-right">
                {donor.totalAmount.toLocaleString("en-NG", {
                  style: "currency",
                  currency: "NGN",
                  minimumFractionDigits: 0,
                })}
              </td>
              <td className="px-4 py-2 text-sm text-right">
                {donor.donationCount}
              </td>
              <td className="px-4 py-2 text-sm text-gray-600">
                {formatDate(donor.lastDonationAt)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
