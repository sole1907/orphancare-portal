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

// API types for donor list
export interface RecurringPlanInfo {
  planCode: string;
  amount: number;
  interval: "daily" | "monthly" | "quarterly" | "yearly";
  nextChargeAt: string;
}

export interface DonorListItem {
  donorUid: string;
  name: string;
  email: string;
  totalAmount: number;
  donationCount: number;
  lastDonationAt: string | null;
  recurringPlan: RecurringPlanInfo | null;
}

export interface DonorsListResponse {
  donors: DonorListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface DonorsListRequest {
  page?: number;
  pageSize?: number;
  search?: string;
}
