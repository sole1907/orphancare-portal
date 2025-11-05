import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
} from "chart.js";
ChartJS.register(LineElement, PointElement, CategoryScale, LinearScale);
import { DonorGrowthChartProps } from "../types/donor";

export default function DonorGrowthChart({ donors }: DonorGrowthChartProps) {
  const chartData = {
    labels: donors.map((d, i) => `D${i + 1}`),
    datasets: [
      {
        label: "New Donors",
        data: donors.map(() => 1),
        backgroundColor: "rgba(255, 99, 132, 0.6)",
        borderColor: "rgba(255, 99, 132, 1)",
        fill: false,
      },
    ],
  };

  return (
    <div className="bg-white rounded shadow p-4">
      <h3 className="text-base font-semibold mb-2">Donor Growth</h3>
      <Line data={chartData} />
    </div>
  );
}
