import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
} from "chart.js";
import { PaymentsChartProps } from "../types/payment";
ChartJS.register(BarElement, CategoryScale, LinearScale);

export default function PaymentsChart({ payments }: PaymentsChartProps) {
  const chartData = {
    labels: payments.map((_, i: number) => `P${i + 1}`),
    datasets: [
      {
        label: "Amount (₦)",
        data: payments.map((p) => p.amount),
        backgroundColor: "rgba(54, 162, 235, 0.6)",
      },
    ],
  };

  return (
    <div className="bg-white rounded shadow p-4">
      <h3 className="text-base font-semibold mb-2">Payments Overview</h3>
      <Bar data={chartData} />
    </div>
  );
}
