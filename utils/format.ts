import { Timestamp } from "firebase/firestore";

export function formatInputValue(
  value: unknown
): string | number | readonly string[] | undefined {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (typeof value === "string" || typeof value === "number") return value;
  return "";
}
