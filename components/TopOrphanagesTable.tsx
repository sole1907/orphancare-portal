// components/TopOrphanagesTable.tsx
import { TopOrphanage } from "@/types/dashboard";

interface TopOrphanagesTableProps {
  orphanages: TopOrphanage[];
}

export default function TopOrphanagesTable({
  orphanages,
}: TopOrphanagesTableProps) {
  if (orphanages.length === 0) {
    return (
      <div className="bg-white rounded shadow p-4">
        <h3 className="text-base font-semibold mb-4">Top Orphanages</h3>
        <p className="text-gray-500 text-sm">No orphanage data available.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded shadow p-4">
      <h3 className="text-base font-semibold mb-4">Top Orphanages</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2 px-2">#</th>
              <th className="text-left py-2 px-2">Orphanage</th>
              <th className="text-right py-2 px-2">Received (₦)</th>
              <th className="text-right py-2 px-2">Donations</th>
            </tr>
          </thead>
          <tbody>
            {orphanages.map((orphanage, index) => (
              <tr
                key={orphanage.orphanageId}
                className="border-b hover:bg-gray-50"
              >
                <td className="py-2 px-2 text-gray-500">{index + 1}</td>
                <td className="py-2 px-2 font-medium">{orphanage.name}</td>
                <td className="py-2 px-2 text-right">
                  {orphanage.totalReceived.toLocaleString()}
                </td>
                <td className="py-2 px-2 text-right">
                  {orphanage.donationCount}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
