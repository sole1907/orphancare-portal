import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { DonorTimePoint } from "../types/dashboard";

ChartJS.register(
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  Filler
);

interface DonorGrowthChartProps {
  data: DonorTimePoint[];
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

export default function DonorGrowthChart({ data }: DonorGrowthChartProps) {
  // Calculate cumulative donor count (pure computation — avoids state mutation during render)
  const cumulativeData = data.reduce<number[]>((acc, d) => {
    const next = (acc.length ? acc[acc.length - 1] : 0) + d.count;
    acc.push(next);
    return acc;
  }, []);

  const chartData = {
    labels: data.map((d) => formatDateLabel(d.date)),
    datasets: [
      {
        label: "Total Donors",
        data: cumulativeData,
        backgroundColor: "rgba(75, 192, 192, 0.2)",
        borderColor: "rgba(75, 192, 192, 1)",
        borderWidth: 2,
        fill: true,
        tension: 0.3,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
        },
      },
    },
  };

  return (
    <div className="bg-white rounded shadow p-4">
      <h3 className="text-base font-semibold mb-2">Donor Growth</h3>
      {data.length === 0 ? (
        <p className="text-gray-500 text-sm">No donor data available.</p>
      ) : (
        <Line data={chartData} options={options} />
      )}
    </div>
  );
}
