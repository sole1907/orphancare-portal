// types/filters.ts

export type DateRange = "7d" | "30d" | "year";

export type DateFilterProps = {
  range: DateRange;
  setRange: (value: DateRange) => void;
};
