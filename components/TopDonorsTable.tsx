// components/TopDonorsTable.tsx
import { TopDonor } from "@/types/dashboard";

interface TopDonorsTableProps {
  donors: TopDonor[];
}

export default function TopDonorsTable({ donors }: TopDonorsTableProps) {
  if (donors.length === 0) {
    return (
      <div className="bg-white rounded shadow p-4">
        <h3 className="text-base font-semibold mb-4">Top Donors</h3>
        <p className="text-gray-500 text-sm">No donation data available.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded shadow p-4">
      <h3 className="text-base font-semibold mb-4">Top Donors</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2 px-2">#</th>
              <th className="text-left py-2 px-2">Name</th>
              <th className="text-right py-2 px-2">Total (₦)</th>
              <th className="text-right py-2 px-2">Donations</th>
            </tr>
          </thead>
          <tbody>
            {donors.map((donor, index) => (
              <tr key={donor.donorId} className="border-b hover:bg-gray-50">
                <td className="py-2 px-2 text-gray-500">{index + 1}</td>
                <td className="py-2 px-2 font-medium">{donor.name}</td>
                <td className="py-2 px-2 text-right">
                  {donor.totalAmount.toLocaleString()}
                </td>
                <td className="py-2 px-2 text-right">{donor.donationCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
