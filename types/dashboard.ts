// types/dashboard.ts

export interface PaymentTimePoint {
  date: string;
  amount: number;
  count: number;
}

export interface DonorTimePoint {
  date: string;
  count: number;
}

export interface TopDonor {
  donorId: string;
  name: string;
  totalAmount: number;
  donationCount: number;
}

export interface TopOrphanage {
  orphanageId: string;
  name: string;
  totalReceived: number;
  donationCount: number;
}

export interface DashboardStats {
  totalDonations: number;
  totalDonors: number;
  totalPayments: number;
  activeRecurringPlans: number;
  mrr: number;
  periodStart: string;
  periodEnd: string;
  paymentsOverTime: PaymentTimePoint[];
  donorsOverTime: DonorTimePoint[];
  topDonors: TopDonor[];
  topOrphanages?: TopOrphanage[];
}
