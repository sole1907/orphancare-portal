import { DateFilterProps } from "../types/filters";

export default function DateFilter({ range, setRange }: DateFilterProps) {
  return (
    <select
      value={range}
      onChange={(e) => setRange(e.target.value as DateFilterProps["range"])}
      className="border rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
    >
      <option value="7d">Last 7 Days</option>
      <option value="30d">Last 30 Days</option>
      <option value="year">This Year</option>
    </select>
  );
}
