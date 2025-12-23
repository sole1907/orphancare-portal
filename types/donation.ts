import { Timestamp } from "firebase/firestore";

export interface Donation {
  id: string;
  orphanageId: string;
  orphanagePayout: number;
  splitStatus: "pending" | "success" | "failed";
  splitError: string | null;
  splitAttemptedAt: Timestamp | null; // Firestore timestamp
}
