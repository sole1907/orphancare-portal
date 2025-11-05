import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { TierPieChartProps } from "../types/donor";
ChartJS.register(ArcElement, Tooltip, Legend);

export default function TierPieChart({ donors }: TierPieChartProps) {
  const tierCounts = donors.reduce<Record<string, number>>((acc, d) => {
    acc[d.tier] = (acc[d.tier] || 0) + 1;
    return acc;
  }, {});

  const chartData = {
    labels: Object.keys(tierCounts),
    datasets: [
      {
        data: Object.values(tierCounts),
        backgroundColor: ["#4FC3F7", "#FF9E80", "#FFD700"],
      },
    ],
  };

  return (
    <div className="bg-white rounded shadow p-4">
      <h3 className="text-base font-semibold mb-2">Tier Distribution</h3>
      <Pie data={chartData} />
    </div>
  );
}
