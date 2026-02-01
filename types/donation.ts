import { Timestamp } from "firebase/firestore";

export interface Donation {
  id: string;
  orphanageId: string;
  orphanagePayout: number;
  splitStatus: "pending" | "success" | "failed";
  splitError: string | null;
  splitAttemptedAt: Timestamp | null; // Firestore timestamp
}

// API types for donation list
export type DonationStatus = "pending" | "success" | "failed";

export interface DonationListItem {
  donationId: string;
  donorName: string;
  donorEmail: string;
  orphanageName?: string;
  amount: number;
  netAmount: number;
  tipAmount: number;      // Platform fee
  paystackFee: number;    // Transaction fee
  status: DonationStatus;
  recurring: boolean;
  createdAt: string;
}

export interface DonationsListResponse {
  donations: DonationListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface DonationsListRequest {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: DonationStatus | "all";
  startDate?: string;
  endDate?: string;
}
