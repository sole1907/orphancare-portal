// types/donor.ts
import { Timestamp } from "firebase/firestore";

export interface Donor {
  id: string;
  name: string;
  createdAt?: Timestamp;
  orphanageId?: string;
  tier: string; // e.g. "silver", "gold", "platinum"
  amount?: number;
}

export interface DonorGrowthChartProps {
  donors: Donor[];
}

export interface TierPieChartProps {
  donors: Donor[];
}
