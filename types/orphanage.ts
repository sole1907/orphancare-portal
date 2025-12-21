import { Timestamp, FieldValue } from "firebase/firestore";

type VerificationStatus =
  | "otp_pending" // orphanage yet to complete OTP verification
  | "notSetup" // orphanage registered but no bank details yet
  | "pending" // orphanage submitted bank details, awaiting super admin approval
  | "approved" // super admin approved
  | "rejected"; // super admin rejected

export interface OrphanageData {
  name: string;
  email: string;
  phone: string;
  address: string;
  registrationNumber: string;
  contactName: string;
  status: string;
  createdAt?: Timestamp | FieldValue;
  registrationDocUrl?: string;
  registrationDocMimeType?: string;
  accountVerificationStatus?: VerificationStatus;

  // Bank details
  bankName?: string; // e.g. "Access Bank"
  bankCode?: string; // e.g. "044"
  accountName?: string; // e.g. "Orphanage Foundation"
  accountNumber?: string; // e.g. "0123456789"

  // Metrics
  childrenCount?: number;
  lastUpdate?: Timestamp;
  fundingProgress?: number;
  logoUrl?: string;
}

export interface Orphanage extends OrphanageData {
  id: string; // added only when reading from Firestore
}

export interface EditOrphanageModalProps {
  open: boolean;
  onClose: (saved?: boolean) => void;
  orphanage: Orphanage;
  onSave: (updated: Orphanage) => void;
}

export type EditableOrphanageField =
  | "name"
  | "contactName"
  | "email"
  | "phone"
  | "address"
  | "registrationNumber";

export type OrphanageForm = {
  name: string;
  contactName: string;
  email: string;
  phone: string;
  address: string;
  registrationNumber: string;
  registrationDocUrl: string;
  registrationDocMimeType?: string;
};

export type OrphanageFormField =
  | "name"
  | "contactName"
  | "email"
  | "phone"
  | "address"
  | "registrationNumber"
  | "registrationDocUrl";
