import { db } from "../lib/firebase";
import { Firestore } from "firebase/firestore";

export function useSafeDb(): Firestore {
  if (!db) {
    throw new Error(
      "Firestore is not initialized. Check SSR guards or Firebase config."
    );
  }
  return db;
}
