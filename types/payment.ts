// types/payment.ts
import { Timestamp } from "firebase/firestore";

export interface Payment {
  id: string;
  amount: number;
  donorId?: string;
  orphanageId?: string;
  createdAt?: Timestamp;
  tier?: string;
}

export interface PaymentsChartProps {
  payments: Payment[];
}
