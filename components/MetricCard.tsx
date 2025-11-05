import { MetricCardProps } from "../types/ui";

export default function MetricCard({ title, value }: MetricCardProps) {
  return (
    <div className="bg-white rounded shadow p-6 text-center">
      <h3 className="text-sm text-gray-500 mb-2">{title}</h3>
      <p className="text-2xl font-bold text-base">₦{value.toLocaleString()}</p>
    </div>
  );
}
