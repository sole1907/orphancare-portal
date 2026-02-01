import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from "chart.js";
import { PaymentTimePoint } from "../types/dashboard";

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

interface PaymentsChartProps {
  data: PaymentTimePoint[];
}

function formatDateLabel(dateStr: string): string {
  // Handle both YYYY-MM and YYYY-MM-DD formats
  if (dateStr.length === 7) {
    // YYYY-MM format (monthly)
    const [year, month] = dateStr.split("-");
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
  } else {
    // YYYY-MM-DD format (daily)
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }
}

export default function PaymentsChart({ data }: PaymentsChartProps) {
  const chartData = {
    labels: data.map((d) => formatDateLabel(d.date)),
    datasets: [
      {
        label: "Amount (₦)",
        data: data.map((d) => d.amount),
        backgroundColor: "rgba(54, 162, 235, 0.6)",
        borderColor: "rgba(54, 162, 235, 1)",
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: (context: { raw: unknown }) => {
            const value = context.raw as number;
            return `₦${value.toLocaleString()}`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value: unknown) => `₦${(value as number).toLocaleString()}`,
        },
      },
    },
  };

  return (
    <div className="bg-white rounded shadow p-4">
      <h3 className="text-base font-semibold mb-2">Payments Over Time</h3>
      {data.length === 0 ? (
        <p className="text-gray-500 text-sm">No payment data available.</p>
      ) : (
        <Bar data={chartData} options={options} />
      )}
    </div>
  );
}
