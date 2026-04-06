// components/DonationsListTable.tsx
import { useState } from "react";
import { DonationListItem, DonationStatus, DonationChildInfo } from "@/types/donation";
import ChildProfileModal from "./ChildProfileModal";

interface DonationsListTableProps {
  donations: DonationListItem[];
  showOrphanage: boolean;
  showEmail: boolean;
}

function formatDate(dateString: string): string {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleDateString();
}

function getStatusBadgeStyle(status: DonationStatus): string {
  switch (status) {
    case "success":
      return "bg-green-100 text-green-800";
    case "pending":
      return "bg-yellow-100 text-yellow-800";
    case "failed":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

export default function DonationsListTable({
  donations,
  showOrphanage,
  showEmail,
}: DonationsListTableProps) {
  const [selectedChild, setSelectedChild] = useState<DonationChildInfo | null>(null);

  if (donations.length === 0) {
    return (
      <div className="bg-white rounded shadow p-8 text-center">
        <p className="text-gray-500">No donations found.</p>
      </div>
    );
  }

  return (
    <>
    <div className="overflow-x-auto rounded shadow">
      <table className="min-w-full bg-white border border-gray-200">
        <thead className="bg-primary text-white">
          <tr>
            <th className="px-4 py-3 text-left text-sm font-semibold">Donor</th>
            {showOrphanage && (
              <th className="px-4 py-3 text-left text-sm font-semibold">
                Orphanage
              </th>
            )}
            <th className="px-4 py-3 text-left text-sm font-semibold">
              Child
            </th>
            <th className="px-4 py-3 text-right text-sm font-semibold">
              Amount
            </th>
            <th className="px-4 py-3 text-right text-sm font-semibold">
              Platform Fee
            </th>
            <th className="px-4 py-3 text-right text-sm font-semibold">
              Transaction Fee
            </th>
            <th className="px-4 py-3 text-left text-sm font-semibold">Date</th>
            <th className="px-4 py-3 text-center text-sm font-semibold">
              Status
            </th>
            <th className="px-4 py-3 text-center text-sm font-semibold">
              Type
            </th>
          </tr>
        </thead>
        <tbody>
          {donations.map((donation) => (
            <tr key={donation.donationId} className="border-t hover:bg-gray-50">
              <td className="px-4 py-2 text-sm">
                <div>
                  <p className="font-medium">
                    {donation.donorName || "Anonymous"}
                  </p>
                  {showEmail && donation.donorEmail && (
                    <p className="text-xs text-gray-500">
                      {donation.donorEmail}
                    </p>
                  )}
                </div>
              </td>
              {showOrphanage && (
                <td className="px-4 py-2 text-sm text-gray-600">
                  {donation.orphanageName || "-"}
                </td>
              )}
              <td className="px-4 py-2 text-sm">
                {donation.child ? (
                  <button
                    onClick={() => setSelectedChild(donation.child!)}
                    className="text-primary hover:text-primary/80 hover:underline font-medium transition-colors"
                  >
                    {donation.child.childName}
                  </button>
                ) : (
                  <span className="text-gray-400">-</span>
                )}
              </td>
              <td className="px-4 py-2 text-sm text-right">
                {donation.amount.toLocaleString("en-NG", {
                  style: "currency",
                  currency: "NGN",
                  minimumFractionDigits: 0,
                })}
              </td>
              <td className="px-4 py-2 text-sm text-right text-gray-600">
                {donation.tipAmount.toLocaleString("en-NG", {
                  style: "currency",
                  currency: "NGN",
                  minimumFractionDigits: 0,
                })}
              </td>
              <td className="px-4 py-2 text-sm text-right text-gray-600">
                {donation.paystackFee.toLocaleString("en-NG", {
                  style: "currency",
                  currency: "NGN",
                  minimumFractionDigits: 0,
                })}
              </td>
              <td className="px-4 py-2 text-sm text-gray-600">
                {formatDate(donation.createdAt)}
              </td>
              <td className="px-4 py-2 text-sm text-center">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeStyle(donation.status)}`}
                >
                  {donation.status.charAt(0).toUpperCase() +
                    donation.status.slice(1)}
                </span>
              </td>
              <td className="px-4 py-2 text-sm text-center">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    donation.recurring
                      ? "bg-blue-100 text-blue-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {donation.recurring ? "Recurring" : "One-time"}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    {selectedChild && (
      <ChildProfileModal
        open={!!selectedChild}
        onClose={() => setSelectedChild(null)}
        child={selectedChild}
      />
    )}
    </>
  );
}
